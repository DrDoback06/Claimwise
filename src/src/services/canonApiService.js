/**
 * Canon API Service — Unified Service Contract
 *
 * Required methods (Section 11):
 *   saveDraft(chapter)
 *   transactionalSaveAndExtract(chapter, guidesContext)
 *   resolveQueueItem(id, action, payload?)
 *   bulkResolveQueue(chapterId, mode)
 *   commitCanon(chapterId, sessionId)
 *   rollbackToVersion(chapterId, versionId)
 *   getVersionDiff(chapterId, fromVersion, toVersion)
 *   computeRetroImpacts(originChange)
 *   retryExtractionNode(queueItemId)
 */

import db from './database';
import canonLifecycleService, { STATES } from './canonLifecycleService';
import narrativeReviewQueueService from './narrativeReviewQueueService';
import confidencePolicyService from './confidencePolicyService';
import retroImpactEngine from './retroImpactEngine';
import canonExtractionPipeline from './canonExtractionPipeline';

class CanonApiService {
  constructor() {
    this._listeners = new Set();
  }

  // ─── 1. saveDraft ──────────────────────────────────────────

  async saveDraft(chapter) {
    const { chapterId, chapterText, bookData } = chapter;
    return canonLifecycleService.saveDraft(chapterId, chapterText, bookData);
  }

  // ─── 2. transactionalSaveAndExtract ────────────────────────

  async transactionalSaveAndExtract(chapter, guidesContext = {}) {
    const { chapterId, chapterNumber, bookId, chapterText, bookData, worldState } = chapter;

    // 1. Transition to SavePending
    await canonLifecycleService.startSaveAndExtract(chapterId, chapterNumber, bookId);

    try {
      // 2. Save chapter text
      const book = { ...bookData };
      const chap = book.chapters?.find(c => c.id === chapterId);
      if (chap) {
        chap.script = chapterText;
        chap.lastUpdated = Date.now();
        await db.update('books', book);
      }

      // 3. Create pre-canon snapshot
      const snapshot = await canonLifecycleService.createVersionSnapshot(
        chapterId, chapterNumber, chapterText,
        { actors: worldState?.actors?.length || 0, items: worldState?.items?.length || 0 }
      );

      // 4. Transition to Extracting
      await canonLifecycleService.beginExtraction(chapterId, snapshot.id);

      // 5. Run extraction pipeline
      const session = await canonLifecycleService.getActiveSession(chapterId);
      const extractionResult = await canonExtractionPipeline.runExtraction({
        sessionId: session.id,
        chapterId,
        chapterNumber,
        bookId,
        chapterText,
        worldState,
        guidesContext
      });

      // 6. Classify confidence bands
      const classifiedItems = await confidencePolicyService.classifyBatch(
        extractionResult.queueItems
      );

      // 7. Persist queue items
      await narrativeReviewQueueService.addItems(classifiedItems);

      // 8. Auto-apply high confidence items if enabled
      const settings = await confidencePolicyService.getSettings();
      if (settings.autoApplyHighConfidence) {
        await narrativeReviewQueueService.autoApplyHighConfidence(session.id);
      }

      // 9. Transition to ReviewLocked
      await canonLifecycleService.completeExtraction(chapterId);

      // 10. Check for retro-edits (is this a prior chapter?)
      const isRetroEdit = await this._isRetroEdit(chapterId, bookData);
      let retroResult = null;
      if (isRetroEdit) {
        retroResult = await this._processRetroEdit(session.id, chapterId, chapterNumber, bookData);
      }

      this._emit('extractionComplete', {
        sessionId: session.id,
        chapterId,
        totalItems: classifiedItems.length,
        retroImpacts: retroResult?.impacts?.length || 0
      });

      return {
        sessionId: session.id,
        snapshotId: snapshot.id,
        queueItems: classifiedItems,
        extractionResult,
        retroResult,
        state: STATES.REVIEW_LOCKED
      };

    } catch (error) {
      // On failure, revert to Draft
      try {
        await canonLifecycleService.cancelSession(chapterId);
      } catch (e) {
        console.error('Failed to cancel session on error:', e);
      }
      throw error;
    }
  }

  // ─── 3. resolveQueueItem ───────────────────────────────────

  async resolveQueueItem(id, action, payload = {}) {
    return narrativeReviewQueueService.resolveItem(id, action, payload);
  }

  // ─── 4. bulkResolveQueue ─────────────────────────────────���─

  async bulkResolveQueue(chapterId, mode, sessionId) {
    switch (mode) {
      case 'approve_all':
        return narrativeReviewQueueService.approveAllForChapter(chapterId, sessionId);
      case 'approve_with_edits':
        return narrativeReviewQueueService.approveAllWithSuggestedEdits(sessionId);
      case 'deny_all':
        return narrativeReviewQueueService.denyAllRemaining(sessionId);
      case 'undo_last':
        return narrativeReviewQueueService.undoLast();
      case 'undo_all':
        return narrativeReviewQueueService.undoAll(sessionId);
      default:
        throw new Error(`Unknown bulk mode: ${mode}`);
    }
  }

  // ─── 5. commitCanon ────────────────────────────────────────

  async commitCanon(chapterId, sessionId) {
    // Check gate conditions
    const unresolvedCount = await narrativeReviewQueueService.getUnresolvedCount(sessionId);
    const blockingRetroCount = await retroImpactEngine.getBlockingRetroCount(chapterId);

    // Idempotent: if already committed, return current state
    const session = await canonLifecycleService.getActiveSession(chapterId);
    if (!session) {
      const lastSession = await canonLifecycleService.getSession(chapterId);
      if (lastSession?.status === STATES.CANON_COMMITTED) {
        return { session: lastSession, alreadyCommitted: true };
      }
      throw new Error('No session found for chapter');
    }

    // Commit
    const committed = await canonLifecycleService.commitCanon(
      chapterId, unresolvedCount, blockingRetroCount
    );

    // Apply accepted queue items to canon stores
    const items = await narrativeReviewQueueService.getSessionItems(sessionId);
    const accepted = items.filter(i => i.status === 'accepted' || i.status === 'edited');
    await this._applyAcceptedItems(accepted);

    // Create audit snapshot
    const changelog = {
      id: `cl_${chapterId}_commit_${Date.now()}`,
      chapterId,
      fromVersion: null,
      toVersion: committed.snapshotId,
      action: 'commit',
      acceptedItems: accepted.length,
      rejectedItems: items.filter(i => i.status === 'rejected').length,
      totalItems: items.length,
      createdAt: Date.now()
    };
    await db.add('chapterChangelog', changelog);

    this._emit('canonCommitted', { chapterId, sessionId, accepted: accepted.length });
    return { session: committed, changelog };
  }

  // ─── 6. rollbackToVersion ────────────────────────────��─────

  async rollbackToVersion(chapterId, versionNumber) {
    return canonLifecycleService.rollbackToVersion(chapterId, versionNumber);
  }

  // ─── 7. getVersionDiff ─────────────────────────────────────

  async getVersionDiff(chapterId, fromVersion, toVersion) {
    return canonLifecycleService.getVersionDiff(chapterId, fromVersion, toVersion);
  }

  // ─── 8. computeRetroImpacts ───────────────────────────���────

  async computeRetroImpacts(originChange) {
    return retroImpactEngine.computeRetroImpacts(originChange);
  }

  // ─── 9. retryExtractionNode ────────────────────────────────

  async retryExtractionNode(queueItemId) {
    return narrativeReviewQueueService.retryExtractionNode(queueItemId);
  }

  // ─── Query Helpers ─────────────────────────────────────────

  async getQueueSummary(sessionId) {
    return narrativeReviewQueueService.getSessionSummary(sessionId);
  }

  async canContinueWriting(sessionId, chapterId) {
    const queueStatus = await narrativeReviewQueueService.canContinue(sessionId);
    const blockingRetro = await retroImpactEngine.getBlockingRetroCount(chapterId);
    return {
      canContinue: queueStatus.canContinue && blockingRetro === 0,
      unresolvedCount: queueStatus.unresolvedCount,
      blockingQueueCount: queueStatus.blockingCount,
      blockingRetroCount: blockingRetro
    };
  }

  async getChapterLifecycleState(chapterId) {
    return canonLifecycleService.getChapterState(chapterId);
  }

  // ─── Private Helpers ──────────────────────────────────���────

  async _isRetroEdit(chapterId, bookData) {
    // A retro-edit is when the user edits a chapter that isn't the latest
    if (!bookData?.chapters) return false;
    const sorted = [...bookData.chapters].sort(
      (a, b) => (a.chapterNumber || a.id) - (b.chapterNumber || b.id)
    );
    const latest = sorted[sorted.length - 1];
    return latest && latest.id !== chapterId;
  }

  async _processRetroEdit(sessionId, chapterId, chapterNumber, bookData) {
    // Get all accepted changes from this session's queue
    const items = await narrativeReviewQueueService.getSessionItems(sessionId);
    const accepted = items.filter(i => i.status === 'accepted' || i.status === 'edited');

    const allImpacts = [];
    for (const item of accepted) {
      if (item.targetEntityId) {
        const result = await retroImpactEngine.computeRetroImpacts({
          entityId: item.targetEntityId,
          entityType: this._domainToEntityType(item.domain),
          chapterId,
          chapterNumber,
          changeType: item.operation,
          previousValue: item.suggestions?.sideBySide?.original,
          newValue: item.suggestions?.proposedNode,
          sessionId
        });
        allImpacts.push(...result.impacts);
      }
    }

    return { impacts: allImpacts };
  }

  _domainToEntityType(domain) {
    const map = {
      character: 'character',
      item: 'item',
      skill: 'skill',
      relationship: 'relationship',
      plot: 'plot',
      timeline: 'timeline',
      location: 'location',
      quest: 'quest',
      faction: 'faction',
      lore: 'lore'
    };
    return map[domain] || domain;
  }

  async _applyAcceptedItems(items) {
    for (const item of items) {
      try {
        const proposed = item.suggestions?.editedNode || item.suggestions?.proposedNode;
        if (!proposed) continue;

        switch (item.domain) {
          case 'character':
            if (item.operation === 'create') {
              await db.update('actors', { id: proposed.id || `actor_${Date.now()}`, ...proposed });
            } else if (item.targetEntityId) {
              const existing = await db.get('actors', item.targetEntityId);
              if (existing) await db.update('actors', { ...existing, ...proposed });
            }
            break;
          case 'item':
            if (item.operation === 'create') {
              await db.update('itemBank', { id: proposed.id || `item_${Date.now()}`, ...proposed });
            } else if (item.targetEntityId) {
              const existing = await db.get('itemBank', item.targetEntityId);
              if (existing) await db.update('itemBank', { ...existing, ...proposed });
            }
            break;
          case 'skill':
            if (item.operation === 'create') {
              await db.update('skillBank', { id: proposed.id || `skill_${Date.now()}`, ...proposed });
            } else if (item.targetEntityId) {
              const existing = await db.get('skillBank', item.targetEntityId);
              if (existing) await db.update('skillBank', { ...existing, ...proposed });
            }
            break;
          case 'relationship':
            if (item.operation === 'create') {
              await db.update('relationships', { id: proposed.id || `rel_${Date.now()}`, ...proposed });
            }
            break;
          case 'plot':
          case 'quest':
            if (item.operation === 'create') {
              await db.update('plotQuests', { id: proposed.id || `pq_${Date.now()}`, ...proposed });
            }
            break;
          case 'location':
            if (item.operation === 'create') {
              await db.update('locations', { id: proposed.id || `loc_${Date.now()}`, ...proposed });
            }
            break;
          case 'faction':
          case 'lore':
            if (item.operation === 'create') {
              await db.update('factions', { id: proposed.id || `fac_${Date.now()}`, ...proposed });
            }
            break;
          case 'timeline':
            if (item.operation === 'create') {
              await db.update('timelineEvents', { id: proposed.id || `te_${Date.now()}`, ...proposed });
            }
            break;
          default:
            break;
        }
      } catch (e) {
        console.error(`Failed to apply accepted item ${item.id}:`, e);
      }
    }
  }

  // ─── Event System ──────────────────────────────────────────

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _emit(event, data) {
    for (const listener of this._listeners) {
      try { listener(event, data); } catch (e) { console.error('CanonApi listener error:', e); }
    }
  }
}

export default new CanonApiService();

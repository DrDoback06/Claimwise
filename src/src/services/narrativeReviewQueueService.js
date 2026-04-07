/**
 * Narrative Review Queue Service
 * Unified queue for all extraction/canon review nodes.
 *
 * Supports:
 * - Accept/Reject/Edit/Disambiguate per item
 * - Approve all for chapter, Approve all with suggested edits
 * - Deny all remaining, Undo last, Undo all (double confirm)
 * - Atomic resolve with audit trail
 * - Continue gate (disabled until unresolved = 0)
 */

import db from './database';
import confidencePolicyService from './confidencePolicyService';

class NarrativeReviewQueueService {
  constructor() {
    this._listeners = new Set();
    this._undoStack = [];
    this._maxUndoDepth = 50;
  }

  // ─── Queue Item Creation ───────────────────────────────────

  createQueueItem({
    sessionId, chapterId, chapterNumber, domain, operation,
    targetEntityId, targetEntityLabel, newOrExisting,
    source, confidence, confidenceReason, suggestions,
    disambiguationOptions, lastMention, blocking
  }) {
    const now = Date.now();
    const band = confidencePolicyService._classifyWithThresholds(
      confidence,
      confidencePolicyService.getThresholdBoundaries()
    );

    const isBlocking = blocking ??
      (band === 'red_block' || domain === 'retro_impact');

    return {
      id: `qn_${sessionId}_${domain}_${now}_${Math.random().toString(36).slice(2, 8)}`,
      sessionId,
      chapterId,
      chapterNumber,
      domain,
      operation,
      targetEntityId: targetEntityId || null,
      targetEntityLabel: targetEntityLabel || null,
      newOrExisting: newOrExisting || 'ambiguous',
      source: source || { lineStart: 0, lineEnd: 0, snippet: '', chapterRef: '' },
      confidence: Number(confidence) || 0,
      confidenceBand: band,
      confidenceReason: confidenceReason || '',
      suggestions: suggestions || { proposedNode: {} },
      disambiguationOptions: disambiguationOptions || null,
      lastMention: lastMention || null,
      blocking: isBlocking,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
  }

  // ─── Persistence ───────────────────────────────────────────

  async addItems(items) {
    if (!items || items.length === 0) return [];
    await db.batchUpsert('narrativeReviewQueue', items);
    this._emit('itemsAdded', { count: items.length, sessionId: items[0]?.sessionId });
    return items;
  }

  async getSessionItems(sessionId) {
    return (await db.getByIndex('narrativeReviewQueue', 'sessionId', sessionId)) || [];
  }

  async getChapterItems(chapterId) {
    return (await db.getByIndex('narrativeReviewQueue', 'chapterId', chapterId)) || [];
  }

  async getPendingItems(sessionId) {
    const all = await this.getSessionItems(sessionId);
    return all.filter(item => item.status === 'pending');
  }

  async getUnresolvedCount(sessionId) {
    const pending = await this.getPendingItems(sessionId);
    return pending.length;
  }

  async getBlockingItems(sessionId) {
    const all = await this.getSessionItems(sessionId);
    return all.filter(item => item.status === 'pending' && item.blocking);
  }

  async getBlockingCount(sessionId) {
    const blocking = await this.getBlockingItems(sessionId);
    return blocking.length;
  }

  async getItemsByDomain(sessionId, domain) {
    const all = await this.getSessionItems(sessionId);
    return all.filter(item => item.domain === domain);
  }

  async getItemsByBand(sessionId, band) {
    const all = await this.getSessionItems(sessionId);
    return all.filter(item => item.confidenceBand === band);
  }

  // ─── Resolution Actions ────────────────────────────────────

  async resolveItem(id, action, payload = {}) {
    const item = await db.get('narrativeReviewQueue', id);
    if (!item) throw new Error(`Queue item ${id} not found`);
    if (item.status !== 'pending') {
      throw new Error(`Queue item ${id} is already ${item.status}`);
    }

    const previousState = { ...item };
    const now = Date.now();

    switch (action) {
      case 'accept':
        item.status = 'accepted';
        break;
      case 'reject':
        item.status = 'rejected';
        break;
      case 'edit':
        item.status = 'edited';
        if (payload.editedNode) {
          item.suggestions = { ...item.suggestions, editedNode: payload.editedNode };
        }
        break;
      case 'disambiguate':
        item.status = 'accepted';
        if (payload.selectedOption) {
          item.disambiguationResolution = payload.selectedOption;
          item.targetEntityId = payload.selectedOption.entityId || item.targetEntityId;
        }
        break;
      case 'delete':
        item.status = 'deleted';
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    item.updatedAt = now;
    item.resolvedAction = action;

    await db.update('narrativeReviewQueue', item);

    // Audit trail
    await this._createAuditEntry(item, action, previousState, payload);

    // Push to undo stack
    this._pushUndo({ itemId: id, previousState, action });

    this._emit('itemResolved', { item, action });
    return item;
  }

  // ─── Bulk Actions ──────────────────────────────────────────

  async approveAllForChapter(chapterId, sessionId) {
    const items = await this.getSessionItems(sessionId);
    const pending = items.filter(
      item => item.status === 'pending' && item.chapterId === chapterId
    );
    return this._bulkResolve(pending, 'accept');
  }

  async approveAllWithSuggestedEdits(sessionId) {
    const items = await this.getSessionItems(sessionId);
    const pending = items.filter(item => item.status === 'pending');
    const results = [];
    for (const item of pending) {
      if (item.suggestions?.guideBasedEdits?.length > 0) {
        results.push(await this.resolveItem(item.id, 'edit', {
          editedNode: item.suggestions.guideBasedEdits[0]
        }));
      } else {
        results.push(await this.resolveItem(item.id, 'accept'));
      }
    }
    this._emit('bulkResolved', { action: 'approveWithEdits', count: results.length });
    return results;
  }

  async denyAllRemaining(sessionId) {
    const pending = await this.getPendingItems(sessionId);
    return this._bulkResolve(pending, 'reject');
  }

  async _bulkResolve(items, action) {
    const results = [];
    for (const item of items) {
      results.push(await this.resolveItem(item.id, action));
    }
    this._emit('bulkResolved', { action, count: results.length });
    return results;
  }

  // ─── Undo Operations ──────────────────────────────────────

  async undoLast() {
    const entry = this._undoStack.pop();
    if (!entry) throw new Error('Nothing to undo');

    const item = await db.get('narrativeReviewQueue', entry.itemId);
    if (!item) throw new Error('Queue item no longer exists');

    // Restore previous state
    const restored = { ...entry.previousState };
    restored.updatedAt = Date.now();
    await db.update('narrativeReviewQueue', restored);

    await this._createAuditEntry(restored, 'undo', item, { undoneAction: entry.action });

    this._emit('undone', { item: restored, undoneAction: entry.action });
    return restored;
  }

  async undoAll(sessionId) {
    // Undo all items in reverse order for this session
    const undone = [];
    while (this._undoStack.length > 0) {
      const top = this._undoStack[this._undoStack.length - 1];
      if (top.previousState.sessionId !== sessionId) break;
      undone.push(await this.undoLast());
    }
    this._emit('undoAll', { count: undone.length, sessionId });
    return undone;
  }

  getUndoStackSize() {
    return this._undoStack.length;
  }

  // ─── Continue Gate ─────────────────────────────────────────

  async canContinue(sessionId) {
    const unresolved = await this.getUnresolvedCount(sessionId);
    const blocking = await this.getBlockingCount(sessionId);
    return {
      canContinue: unresolved === 0,
      unresolvedCount: unresolved,
      blockingCount: blocking,
      reason: unresolved > 0
        ? `${unresolved} unresolved items remain (${blocking} blocking)`
        : null
    };
  }

  // ─── Auto-Apply ────────────────────────────────────────────

  async autoApplyHighConfidence(sessionId) {
    const items = await this.getPendingItems(sessionId);
    const autoApplyItems = await confidencePolicyService.getAutoApplyItems(items);
    if (autoApplyItems.length === 0) return [];

    const results = [];
    for (const item of autoApplyItems) {
      results.push(await this.resolveItem(item.id, 'accept'));
    }

    this._emit('autoApplied', { count: results.length, sessionId });
    return results;
  }

  // ─── Stats & Summary ──────────────────────────────────────

  async getSessionSummary(sessionId) {
    const items = await this.getSessionItems(sessionId);

    const byStatus = { pending: 0, accepted: 0, rejected: 0, edited: 0, deleted: 0 };
    const byDomain = {};
    const byBand = { red_block: 0, amber_review: 0, normal_review: 0, high_confidence: 0 };

    for (const item of items) {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      byDomain[item.domain] = (byDomain[item.domain] || 0) + 1;
      byBand[item.confidenceBand] = (byBand[item.confidenceBand] || 0) + 1;
    }

    return {
      total: items.length,
      byStatus,
      byDomain,
      byBand,
      unresolvedCount: byStatus.pending,
      blockingCount: items.filter(i => i.blocking && i.status === 'pending').length
    };
  }

  // ─── Audit Trail ───────────────────────────────────────────

  async _createAuditEntry(item, action, previousState, payload = {}) {
    const entry = {
      id: `qa_${item.id}_${Date.now()}`,
      queueItemId: item.id,
      sessionId: item.sessionId,
      action,
      previousStatus: previousState?.status,
      newStatus: item.status,
      confidence: item.confidence,
      confidenceBand: item.confidenceBand,
      domain: item.domain,
      payload,
      createdAt: Date.now()
    };
    await db.add('queueAudit', entry);
    return entry;
  }

  async getAuditTrail(queueItemId) {
    return (await db.getByIndex('queueAudit', 'queueItemId', queueItemId)) || [];
  }

  async getSessionAuditTrail(sessionId) {
    return (await db.getByIndex('queueAudit', 'sessionId', sessionId)) || [];
  }

  // ─── Retry Failed Extraction ──────────────────────────────

  async retryExtractionNode(queueItemId) {
    const item = await db.get('narrativeReviewQueue', queueItemId);
    if (!item) throw new Error(`Queue item ${queueItemId} not found`);
    if (item.domain !== 'failure') {
      throw new Error('Only failure domain items can be retried');
    }

    // Reset to pending for re-extraction
    item.status = 'pending';
    item.domain = item.originalDomain || 'character';
    item.updatedAt = Date.now();
    item.retryCount = (item.retryCount || 0) + 1;

    await db.update('narrativeReviewQueue', item);
    this._emit('retryRequested', { item });
    return item;
  }

  // ─── Event System ──────────────────────────────────────────

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _emit(event, data) {
    for (const listener of this._listeners) {
      try { listener(event, data); } catch (e) { console.error('Queue listener error:', e); }
    }
  }

  _pushUndo(entry) {
    this._undoStack.push(entry);
    if (this._undoStack.length > this._maxUndoDepth) {
      this._undoStack.shift();
    }
  }
}

export default new NarrativeReviewQueueService();

/**
 * Retro Impact Engine
 *
 * For any accepted change in prior canon:
 * - Builds dependency graph from entity references across future chapters
 * - Finds impacted nodes only
 * - Creates retro_impact queue nodes with origin/impacted references, severity, suggested transforms
 * - Marks critical/major as blocking
 * - Requires resolution before continuing writing
 *
 * Severity levels:
 *   critical — breaks canon continuity hard (blocking)
 *   major    — strong inconsistency (blocking before commit)
 *   minor    — non-blocking but must be acknowledged
 */

import db from './database';
import aiService from './aiService';
import narrativeReviewQueueService from './narrativeReviewQueueService';

class RetroImpactEngine {
  constructor() {
    this._listeners = new Set();
  }

  // ─── Dependency Graph ──────────────────────────────────────

  async buildDependencyGraph(entityId, entityType, fromChapterNumber) {
    // Find all chapters that reference this entity after the given chapter
    const books = await db.getAll('books');
    const references = [];

    for (const book of books) {
      if (!book.chapters) continue;
      for (const chapter of book.chapters) {
        const chapterNum = chapter.chapterNumber || chapter.id;
        if (chapterNum <= fromChapterNumber) continue;

        const text = chapter.script || '';
        if (!text) continue;

        // Check entity chapter states for explicit references
        const states = await db.getByIndex('entityChapterStates', 'entityId', entityId);
        const stateInChapter = states?.find(s =>
          s.chapterNumber === chapterNum || s.chapterId === chapter.id
        );

        // Also check for name mentions in text
        const entityData = await this._getEntityData(entityId, entityType);
        const nameFound = entityData?.name &&
          text.toLowerCase().includes(entityData.name.toLowerCase());

        if (stateInChapter || nameFound) {
          references.push({
            chapterId: chapter.id,
            chapterNumber: chapterNum,
            bookId: book.id,
            entityState: stateInChapter,
            hasTextReference: nameFound,
            snippet: nameFound ? this._extractSnippet(text, entityData.name) : ''
          });
        }
      }
    }

    return {
      entityId,
      entityType,
      originChapter: fromChapterNumber,
      downstreamReferences: references,
      totalImpacted: references.length
    };
  }

  // ─── Impact Computation ────────────────────────────────────

  async computeRetroImpacts(originChange) {
    const {
      entityId, entityType, chapterId, chapterNumber,
      changeType, previousValue, newValue, sessionId
    } = originChange;

    const graph = await this.buildDependencyGraph(entityId, entityType, chapterNumber);

    if (graph.downstreamReferences.length === 0) {
      return { impacts: [], graph };
    }

    const impacts = [];

    for (const ref of graph.downstreamReferences) {
      const severity = await this._assessSeverity(
        originChange, ref, entityType
      );

      const impact = {
        id: `ri_${entityId}_${ref.chapterId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        originChapterId: chapterId,
        originChapterNumber: chapterNumber,
        impactedChapterId: ref.chapterId,
        impactedChapterNumber: ref.chapterNumber,
        entityId,
        entityType,
        changeType,
        previousValue,
        newValue,
        severity: severity.level,
        severityReason: severity.reason,
        blocking: severity.level === 'critical' || severity.level === 'major',
        status: 'pending',
        suggestedTransform: severity.suggestedTransform,
        snippet: ref.snippet,
        createdAt: Date.now()
      };

      await db.add('retroImpacts', impact);
      impacts.push(impact);

      // Also create retro_impact queue nodes
      if (sessionId) {
        const queueNode = narrativeReviewQueueService.createQueueItem({
          sessionId,
          chapterId: ref.chapterId,
          chapterNumber: ref.chapterNumber,
          domain: 'retro_impact',
          operation: 'conflict',
          targetEntityId: entityId,
          targetEntityLabel: (await this._getEntityData(entityId, entityType))?.name || entityId,
          newOrExisting: 'existing',
          source: {
            lineStart: 0,
            lineEnd: 0,
            snippet: ref.snippet,
            chapterRef: `Chapter ${ref.chapterNumber}`
          },
          confidence: severity.confidence,
          confidenceReason: severity.reason,
          suggestions: {
            proposedNode: severity.suggestedTransform,
            sideBySide: { original: previousValue, suggested: newValue }
          },
          blocking: severity.level === 'critical' || severity.level === 'major'
        });

        await narrativeReviewQueueService.addItems([queueNode]);
      }
    }

    this._emit('impactsComputed', {
      entityId, originChapter: chapterNumber,
      totalImpacts: impacts.length,
      blocking: impacts.filter(i => i.blocking).length
    });

    return { impacts, graph };
  }

  // ─── Severity Assessment ───────────────────────────────────

  async _assessSeverity(originChange, reference, entityType) {
    const { changeType, previousValue, newValue } = originChange;

    // Critical: entity renamed, deleted, or fundamentally changed
    if (changeType === 'delete') {
      return {
        level: 'critical',
        reason: `Entity deleted in Chapter ${originChange.chapterNumber} but referenced in Chapter ${reference.chapterNumber}`,
        confidence: 0.95,
        suggestedTransform: { action: 'remove_references', targetChapter: reference.chapterNumber }
      };
    }

    if (changeType === 'rename') {
      return {
        level: 'critical',
        reason: `Entity renamed from "${previousValue?.name}" to "${newValue?.name}" — all future references need updating`,
        confidence: 0.95,
        suggestedTransform: {
          action: 'rename_references',
          from: previousValue?.name,
          to: newValue?.name,
          targetChapter: reference.chapterNumber
        }
      };
    }

    // Major: key attributes changed that affect story logic
    if (entityType === 'character' && changeType === 'update') {
      const criticalFields = ['class', 'alignment', 'status', 'alive'];
      const changedCritical = criticalFields.some(f =>
        previousValue?.[f] !== newValue?.[f]
      );

      if (changedCritical) {
        return {
          level: 'major',
          reason: `Critical character attribute changed — may cause inconsistencies in Chapter ${reference.chapterNumber}`,
          confidence: 0.8,
          suggestedTransform: {
            action: 'review_consistency',
            changedFields: criticalFields.filter(f => previousValue?.[f] !== newValue?.[f]),
            targetChapter: reference.chapterNumber
          }
        };
      }
    }

    if (entityType === 'item' && changeType === 'update') {
      const ownerChanged = previousValue?.ownerId !== newValue?.ownerId;
      if (ownerChanged) {
        return {
          level: 'major',
          reason: `Item ownership changed — references in Chapter ${reference.chapterNumber} may be inconsistent`,
          confidence: 0.75,
          suggestedTransform: {
            action: 'update_ownership_references',
            targetChapter: reference.chapterNumber
          }
        };
      }
    }

    // Try AI assessment for nuanced cases
    try {
      const severity = await this._aiAssessSeverity(originChange, reference);
      if (severity) return severity;
    } catch {
      // Fall through to default
    }

    // Minor: cosmetic or non-breaking changes
    return {
      level: 'minor',
      reason: `Entity updated in Chapter ${originChange.chapterNumber} — minor reference in Chapter ${reference.chapterNumber}`,
      confidence: 0.6,
      suggestedTransform: {
        action: 'acknowledge',
        targetChapter: reference.chapterNumber
      }
    };
  }

  async _aiAssessSeverity(originChange, reference) {
    try {
      const prompt = `Assess the severity of a story canon change.

Original entity was changed in Chapter ${originChange.chapterNumber}.
The entity (type: ${originChange.entityType}) appears in Chapter ${reference.chapterNumber}.

Change: ${originChange.changeType}
Previous: ${JSON.stringify(originChange.previousValue).substring(0, 500)}
New: ${JSON.stringify(originChange.newValue).substring(0, 500)}
Reference snippet: ${reference.snippet.substring(0, 300)}

Rate severity:
- "critical": breaks story continuity (character dead but appears alive, etc.)
- "major": strong inconsistency that readers would notice
- "minor": cosmetic, readers unlikely to notice

Return JSON: {"level": "critical|major|minor", "reason": "...", "suggestedFix": "..."}`;

      const response = await aiService.callAI(prompt, 'structured');
      const match = response.match(/\{[\s\S]*\}/);
      if (!match) return null;

      const result = JSON.parse(match[0]);
      return {
        level: ['critical', 'major', 'minor'].includes(result.level) ? result.level : 'minor',
        reason: result.reason || 'AI-assessed impact',
        confidence: result.level === 'critical' ? 0.9 : result.level === 'major' ? 0.75 : 0.6,
        suggestedTransform: {
          action: 'ai_suggested',
          fix: result.suggestedFix,
          targetChapter: reference.chapterNumber
        }
      };
    } catch {
      return null;
    }
  }

  // ─── Resolution ────────────────────────────────────────────

  async resolveImpact(impactId, resolution) {
    const impact = await db.get('retroImpacts', impactId);
    if (!impact) throw new Error(`Impact ${impactId} not found`);

    impact.status = resolution.action === 'dismiss' ? 'dismissed' : 'resolved';
    impact.resolution = resolution;
    impact.resolvedAt = Date.now();

    await db.update('retroImpacts', impact);
    this._emit('impactResolved', impact);
    return impact;
  }

  async getPendingImpacts(originChapterId) {
    const impacts = await db.getByIndex('retroImpacts', 'originChapterId', originChapterId);
    return (impacts || []).filter(i => i.status === 'pending');
  }

  async getBlockingImpacts(originChapterId) {
    const pending = await this.getPendingImpacts(originChapterId);
    return pending.filter(i => i.blocking);
  }

  async getBlockingRetroCount(chapterId) {
    const blocking = await this.getBlockingImpacts(chapterId);
    return blocking.length;
  }

  async getImpactsForChapter(chapterId) {
    const asOrigin = await db.getByIndex('retroImpacts', 'originChapterId', chapterId);
    const asImpacted = await db.getByIndex('retroImpacts', 'impactedChapterId', chapterId);
    return {
      originated: asOrigin || [],
      impacted: asImpacted || [],
      total: (asOrigin?.length || 0) + (asImpacted?.length || 0)
    };
  }

  // ─── Helpers ───────────────────────────────────────────────

  async _getEntityData(entityId, entityType) {
    const storeMap = {
      character: 'actors',
      actor: 'actors',
      item: 'itemBank',
      skill: 'skillBank',
      location: 'locations',
      faction: 'factions',
      relationship: 'relationships'
    };
    const store = storeMap[entityType];
    if (!store) return null;
    try {
      return await db.get(store, entityId);
    } catch {
      return null;
    }
  }

  _extractSnippet(text, searchTerm, contextChars = 100) {
    const idx = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (idx === -1) return '';
    const start = Math.max(0, idx - contextChars);
    const end = Math.min(text.length, idx + searchTerm.length + contextChars);
    return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
  }

  // ─── Event System ──────────────────────────────────────────

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _emit(event, data) {
    for (const listener of this._listeners) {
      try { listener(event, data); } catch (e) { console.error('RetroImpact listener error:', e); }
    }
  }
}

export default new RetroImpactEngine();

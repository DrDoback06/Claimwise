/**
 * Canon Extraction Pipeline
 *
 * Entry points: canonApiService.js (runExtraction). Reaches the narrative review
 * queue; primary UI is legacy Manuscript / API flows, not the Loomwright redesign.
 *
 * Enhanced extraction that produces unified review queue nodes
 * across all 10 domains:
 *   character, item, skill, relationship, plot, timeline,
 *   location, quest, faction, lore
 *
 * Pipeline stages:
 *   1. Chunk chapter with overlap
 *   2. Per chunk: entity, relationship, plot/quest, timeline/location extraction
 *   3. Merge + dedupe
 *   4. Match against canon graph
 *   5. Produce queue nodes
 *   6. Handle failures as queue nodes in failure domain
 */

import aiService from './aiService';
import db from './database';
import entityMatchingService from './entityMatchingService';
import narrativeReviewQueueService from './narrativeReviewQueueService';
import confidencePolicyService from './confidencePolicyService';

class CanonExtractionPipeline {
  constructor() {
    this.chunkSize = 5000;
    this.chunkOverlap = 500;
    this._listeners = new Set();
  }

  // ─── Main Pipeline ─────────────────────────────────────────

  async runExtraction({
    sessionId, chapterId, chapterNumber, bookId,
    chapterText, worldState, guidesContext
  }) {
    const results = {
      queueItems: [],
      failures: [],
      stats: { total: 0, byDomain: {} }
    };

    if (!chapterText || chapterText.trim().length < 50) {
      return results;
    }

    const chunks = this._getChunks(chapterText);
    const guidePromptSuffix = this._buildGuideContext(guidesContext);

    this._emit('extractionStarted', { sessionId, chapterId, chunkCount: chunks.length });

    // Stage 1-2: Per-chunk extraction across all domains
    const rawExtractions = {
      characters: [], items: [], skills: [],
      relationships: [], plots: [], quests: [],
      timeline: [], locations: [], factions: [], lore: []
    };

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      this._emit('chunkProgress', { sessionId, current: i + 1, total: chunks.length });

      try {
        const chunkResult = await this._extractFromChunk(
          chunk, chapterNumber, bookId, worldState, guidePromptSuffix
        );
        Object.keys(rawExtractions).forEach(domain => {
          if (chunkResult[domain]) {
            rawExtractions[domain].push(...chunkResult[domain]);
          }
        });
      } catch (error) {
        // Stage 6: Failure handling — no silent drops
        const failureNode = narrativeReviewQueueService.createQueueItem({
          sessionId, chapterId, chapterNumber,
          domain: 'failure',
          operation: 'conflict',
          source: {
            lineStart: chunk.charStart,
            lineEnd: chunk.charEnd,
            snippet: chunk.text.substring(0, 200),
            chapterRef: `Chapter ${chapterNumber}, chunk ${i + 1}`
          },
          confidence: 0,
          confidenceReason: `Extraction failed for chunk ${i + 1}: ${error.message}`,
          suggestions: {
            proposedNode: { error: error.message, chunkIndex: i },
            manualFallbackPrompt: `Review chunk ${i + 1} of Chapter ${chapterNumber} manually`
          },
          blocking: false
        });
        failureNode.originalDomain = 'multi';
        results.failures.push(failureNode);
        results.queueItems.push(failureNode);

        // Also persist to extractionFailures store
        await db.add('extractionFailures', {
          id: failureNode.id,
          sessionId, chapterId, chapterNumber,
          domain: 'multi',
          error: error.message,
          chunkIndex: i,
          createdAt: Date.now()
        });
      }
    }

    // Stage 3: Merge + dedupe
    const deduped = this._deduplicateExtractions(rawExtractions);

    // Stage 4-5: Match against canon and produce queue nodes
    const queueItems = await this._matchAndProduceNodes(
      deduped, sessionId, chapterId, chapterNumber, worldState
    );

    results.queueItems.push(...queueItems);
    results.stats.total = results.queueItems.length;

    for (const item of results.queueItems) {
      results.stats.byDomain[item.domain] = (results.stats.byDomain[item.domain] || 0) + 1;
    }

    this._emit('extractionCompleted', {
      sessionId, chapterId,
      total: results.stats.total,
      failures: results.failures.length
    });

    return results;
  }

  // ─── Chunk Management ──────────────────────────────────────

  _getChunks(text) {
    if (text.length <= this.chunkSize) {
      return [{ index: 0, text, charStart: 0, charEnd: text.length }];
    }

    const chunks = [];
    let start = 0;
    let index = 0;
    while (start < text.length) {
      const end = Math.min(text.length, start + this.chunkSize);
      chunks.push({ index, text: text.slice(start, end), charStart: start, charEnd: end });
      if (end >= text.length) break;
      start = end - this.chunkOverlap;
      index++;
    }
    return chunks;
  }

  // ─── Per-Chunk Extraction ──────────────────────────────────

  async _extractFromChunk(chunk, chapterNumber, bookId, worldState, guideContext) {
    const actorNames = (worldState?.actors || []).map(a => a.name).join(', ');
    const itemNames = (worldState?.items || []).map(i => i.name).join(', ');

    const prompt = `You are a canon extraction system for a long-form story. Analyze this chapter chunk and extract ALL narrative elements across every domain.

Chapter ${chapterNumber}, Chunk ${chunk.index + 1}:
---
${chunk.text}
---

Known characters: ${actorNames || 'None'}
Known items: ${itemNames || 'None'}
${guideContext}

Extract into these categories:
1. characters: [{name, description, isNew, traits, role, confidence}]
2. items: [{name, description, isNew, type, rarity, owner, confidence}]
3. skills: [{name, description, isNew, user, action(gained/improved/mastered), level, confidence}]
4. relationships: [{character1, character2, type, change, strength, confidence}]
5. plots: [{title, description, status(setup/development/climax/resolution), characters, confidence}]
6. quests: [{title, description, type(main/sub), status(active/completed/failed), objectives, confidence}]
7. timeline: [{event, timestamp, characters, significance, confidence}]
8. locations: [{name, type, description, significance, confidence}]
9. factions: [{name, type, members, goals, stance, confidence}]
10. lore: [{title, category, description, significance, confidence}]

For each item, include a confidence score (0-1) indicating extraction certainty.
For existing entities, note them as isNew: false with their current name.

Return valid JSON only:
{"characters":[...],"items":[...],"skills":[...],"relationships":[...],"plots":[...],"quests":[...],"timeline":[...],"locations":[...],"factions":[...],"lore":[...]}`;

    const response = await aiService.callAI(prompt, 'structured', '', {
      temperature: 0.2,
      maxTokens: 4000
    });

    return this._parseMultiDomainResponse(response);
  }

  _parseMultiDomainResponse(response) {
    const defaults = {
      characters: [], items: [], skills: [],
      relationships: [], plots: [], quests: [],
      timeline: [], locations: [], factions: [], lore: []
    };

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return defaults;

      const data = JSON.parse(jsonMatch[0]);
      const result = {};
      for (const key of Object.keys(defaults)) {
        result[key] = Array.isArray(data[key]) ? data[key] : [];
      }
      return result;
    } catch {
      return defaults;
    }
  }

  // ─── Deduplication ─────────────────────────────────────────

  _deduplicateExtractions(raw) {
    const deduped = {};
    for (const [domain, items] of Object.entries(raw)) {
      const seen = new Set();
      deduped[domain] = items.filter(item => {
        const key = this._dedupeKey(domain, item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return deduped;
  }

  _dedupeKey(domain, item) {
    switch (domain) {
      case 'characters':
      case 'items':
      case 'skills':
      case 'locations':
      case 'factions':
        return `${domain}|${(item.name || '').toLowerCase().trim()}`;
      case 'relationships':
        return `rel|${(item.character1 || '').toLowerCase()}|${(item.character2 || '').toLowerCase()}`;
      case 'plots':
      case 'quests':
        return `${domain}|${(item.title || '').toLowerCase().trim()}`;
      case 'timeline':
        return `time|${(item.event || '').toLowerCase().trim()}`;
      case 'lore':
        return `lore|${(item.title || '').toLowerCase().trim()}`;
      default:
        return `${domain}|${JSON.stringify(item)}`;
    }
  }

  // ─── Canon Matching & Queue Node Production ────────────────

  async _matchAndProduceNodes(deduped, sessionId, chapterId, chapterNumber, worldState) {
    const queueItems = [];

    // Characters
    for (const char of deduped.characters) {
      const match = worldState?.actors
        ? entityMatchingService.matchEntity(char, worldState)
        : null;

      queueItems.push(narrativeReviewQueueService.createQueueItem({
        sessionId, chapterId, chapterNumber,
        domain: 'character',
        operation: match ? 'update' : 'create',
        targetEntityId: match?.matchedEntity?.id,
        targetEntityLabel: char.name,
        newOrExisting: match ? 'existing' : char.isNew === false ? 'ambiguous' : 'new',
        source: { lineStart: 0, lineEnd: 0, snippet: char.description || '', chapterRef: `Ch.${chapterNumber}` },
        confidence: Number(char.confidence ?? (match ? 0.85 : 0.65)),
        confidenceReason: match
          ? `Matched existing character "${match.matchedEntity?.name}" (score: ${match.score?.toFixed(2)})`
          : `New character detected: "${char.name}"`,
        suggestions: {
          proposedNode: char,
          sideBySide: match ? { original: match.matchedEntity, suggested: char } : undefined
        },
        lastMention: match?.matchedEntity ? await this._findLastMention(match.matchedEntity.id, 'actors', chapterNumber) : undefined,
        blocking: false
      }));
    }

    // Items
    for (const item of deduped.items) {
      const match = worldState?.items
        ? entityMatchingService.matchEntity(item, worldState)
        : null;

      queueItems.push(narrativeReviewQueueService.createQueueItem({
        sessionId, chapterId, chapterNumber,
        domain: 'item',
        operation: match ? 'update' : 'create',
        targetEntityId: match?.matchedEntity?.id,
        targetEntityLabel: item.name,
        newOrExisting: match ? 'existing' : 'new',
        source: { lineStart: 0, lineEnd: 0, snippet: item.description || '', chapterRef: `Ch.${chapterNumber}` },
        confidence: Number(item.confidence ?? 0.75),
        confidenceReason: match
          ? `Matched existing item "${match.matchedEntity?.name}"`
          : `New item detected: "${item.name}"`,
        suggestions: { proposedNode: item },
        blocking: false
      }));
    }

    // Skills
    for (const skill of deduped.skills) {
      const match = worldState?.skills
        ? entityMatchingService.matchEntity(skill, worldState)
        : null;

      queueItems.push(narrativeReviewQueueService.createQueueItem({
        sessionId, chapterId, chapterNumber,
        domain: 'skill',
        operation: match ? 'update' : 'create',
        targetEntityId: match?.matchedEntity?.id,
        targetEntityLabel: skill.name,
        newOrExisting: match ? 'existing' : 'new',
        source: { lineStart: 0, lineEnd: 0, snippet: skill.description || '', chapterRef: `Ch.${chapterNumber}` },
        confidence: Number(skill.confidence ?? 0.75),
        confidenceReason: match
          ? `Matched existing skill "${match.matchedEntity?.name}"`
          : `New skill: "${skill.name}" (${skill.action || 'detected'})`,
        suggestions: { proposedNode: skill },
        blocking: false
      }));
    }

    // Relationships
    for (const rel of deduped.relationships) {
      queueItems.push(narrativeReviewQueueService.createQueueItem({
        sessionId, chapterId, chapterNumber,
        domain: 'relationship',
        operation: 'create',
        targetEntityLabel: `${rel.character1} ↔ ${rel.character2}`,
        newOrExisting: 'new',
        source: { lineStart: 0, lineEnd: 0, snippet: rel.change || '', chapterRef: `Ch.${chapterNumber}` },
        confidence: Number(rel.confidence ?? 0.7),
        confidenceReason: `Relationship detected: ${rel.type} (${rel.character1} ↔ ${rel.character2})`,
        suggestions: { proposedNode: rel },
        blocking: false
      }));
    }

    // Plots
    for (const plot of deduped.plots) {
      queueItems.push(narrativeReviewQueueService.createQueueItem({
        sessionId, chapterId, chapterNumber,
        domain: 'plot',
        operation: 'create',
        targetEntityLabel: plot.title,
        newOrExisting: 'new',
        source: { lineStart: 0, lineEnd: 0, snippet: plot.description || '', chapterRef: `Ch.${chapterNumber}` },
        confidence: Number(plot.confidence ?? 0.7),
        confidenceReason: `Plot point: "${plot.title}" (${plot.status || 'detected'})`,
        suggestions: { proposedNode: plot },
        blocking: false
      }));
    }

    // Quests (under plot domain)
    for (const quest of deduped.quests) {
      queueItems.push(narrativeReviewQueueService.createQueueItem({
        sessionId, chapterId, chapterNumber,
        domain: 'plot',
        operation: 'create',
        targetEntityLabel: quest.title,
        newOrExisting: 'new',
        source: { lineStart: 0, lineEnd: 0, snippet: quest.description || '', chapterRef: `Ch.${chapterNumber}` },
        confidence: Number(quest.confidence ?? 0.7),
        confidenceReason: `Quest detected: "${quest.title}" (${quest.type || 'sub'})`,
        suggestions: { proposedNode: { ...quest, isQuest: true } },
        blocking: false
      }));
    }

    // Timeline
    for (const event of deduped.timeline) {
      queueItems.push(narrativeReviewQueueService.createQueueItem({
        sessionId, chapterId, chapterNumber,
        domain: 'timeline',
        operation: 'create',
        targetEntityLabel: event.event,
        newOrExisting: 'new',
        source: { lineStart: 0, lineEnd: 0, snippet: event.event || '', chapterRef: `Ch.${chapterNumber}` },
        confidence: Number(event.confidence ?? 0.8),
        confidenceReason: `Timeline event: "${event.event}"`,
        suggestions: { proposedNode: event },
        blocking: false
      }));
    }

    // Locations
    for (const loc of deduped.locations) {
      const existingLocs = await db.getAll('locations');
      const existingMatch = existingLocs?.find(
        l => l.name?.toLowerCase() === loc.name?.toLowerCase()
      );

      queueItems.push(narrativeReviewQueueService.createQueueItem({
        sessionId, chapterId, chapterNumber,
        domain: 'location',
        operation: existingMatch ? 'update' : 'create',
        targetEntityId: existingMatch?.id,
        targetEntityLabel: loc.name,
        newOrExisting: existingMatch ? 'existing' : 'new',
        source: { lineStart: 0, lineEnd: 0, snippet: loc.description || '', chapterRef: `Ch.${chapterNumber}` },
        confidence: Number(loc.confidence ?? 0.8),
        confidenceReason: existingMatch
          ? `Known location: "${loc.name}"`
          : `New location: "${loc.name}"`,
        suggestions: { proposedNode: loc },
        blocking: false
      }));
    }

    // Factions (under lore domain in queue, stored in factions table)
    for (const faction of deduped.factions) {
      queueItems.push(narrativeReviewQueueService.createQueueItem({
        sessionId, chapterId, chapterNumber,
        domain: 'faction',
        operation: 'create',
        targetEntityLabel: faction.name,
        newOrExisting: 'new',
        source: { lineStart: 0, lineEnd: 0, snippet: faction.goals || '', chapterRef: `Ch.${chapterNumber}` },
        confidence: Number(faction.confidence ?? 0.7),
        confidenceReason: `Faction detected: "${faction.name}"`,
        suggestions: { proposedNode: faction },
        blocking: false
      }));
    }

    // Lore
    for (const loreItem of deduped.lore) {
      queueItems.push(narrativeReviewQueueService.createQueueItem({
        sessionId, chapterId, chapterNumber,
        domain: 'lore',
        operation: 'create',
        targetEntityLabel: loreItem.title,
        newOrExisting: 'new',
        source: { lineStart: 0, lineEnd: 0, snippet: loreItem.description || '', chapterRef: `Ch.${chapterNumber}` },
        confidence: Number(loreItem.confidence ?? 0.65),
        confidenceReason: `Lore entry: "${loreItem.title}" (${loreItem.category || 'general'})`,
        suggestions: { proposedNode: loreItem },
        blocking: false
      }));
    }

    return queueItems;
  }

  // ─── Guide Context ─────────────────────────────────────────

  _buildGuideContext(guidesContext) {
    if (!guidesContext) return '';
    const parts = [];
    if (guidesContext.styleGuide) {
      parts.push(`Writing Style Guide: ${guidesContext.styleGuide.substring(0, 500)}`);
    }
    if (guidesContext.worldRules) {
      parts.push(`World Rules: ${guidesContext.worldRules.substring(0, 500)}`);
    }
    if (guidesContext.storyArchitecture) {
      parts.push(`Story Architecture: ${guidesContext.storyArchitecture.substring(0, 500)}`);
    }
    return parts.length > 0 ? `\n\nGuide Context:\n${parts.join('\n')}` : '';
  }

  // ─── Last Mention Lookup ───────────────────────────────────

  async _findLastMention(entityId, storeName, currentChapter) {
    try {
      const states = await db.getByIndex('entityChapterStates', 'entityId', entityId);
      if (!states || states.length === 0) return undefined;

      const prior = states
        .filter(s => s.chapterNumber < currentChapter)
        .sort((a, b) => b.chapterNumber - a.chapterNumber);

      if (prior.length === 0) return undefined;
      const last = prior[0];
      return {
        chapterNumber: last.chapterNumber,
        lineStart: last.lineStart || 0,
        snippet: last.snippet || `Last seen in Chapter ${last.chapterNumber}`
      };
    } catch {
      return undefined;
    }
  }

  // ─── Event System ──────────────────────────────────────────

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _emit(event, data) {
    for (const listener of this._listeners) {
      try { listener(event, data); } catch (e) { console.error('Pipeline listener error:', e); }
    }
  }
}

export default new CanonExtractionPipeline();

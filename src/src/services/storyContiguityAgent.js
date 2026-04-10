/**
 * Story Continuity Agent — New Feature A
 *
 * An always-on background agent that monitors story changes in real-time.
 * Triggered after each chapter save, it orchestrates:
 *   1. Wiki staleness flagging for entities mentioned in the chapter
 *   2. Lightweight consistency check for the saved chapter
 *   3. Relationship gap detection for characters in the chapter
 *   4. Timeline event suggestions for key events in the chapter
 *   5. Plot thread progress updates
 *
 * Results are surfaced in a unified "Story Health" notification panel.
 */

import aiService from './aiService';
import db from './database';

class StoryContiguityAgent {
  constructor() {
    this.enabled = true;
    this.taskQueue = [];
    this.results = []; // array of { id, type, title, message, severity, timestamp, actorId, chapterId }
    this.listeners = []; // callbacks when results change
    this.isRunning = false;
  }

  /**
   * Register a listener for result updates
   */
  onUpdate(callback) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(l => l !== callback); };
  }

  _notify() {
    this.listeners.forEach(cb => {
      try { cb([...this.results]); } catch (_) {}
    });
  }

  addResult(result) {
    const id = `result_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.results.unshift({ id, timestamp: Date.now(), dismissed: false, ...result });
    // Keep last 50 results
    if (this.results.length > 50) this.results = this.results.slice(0, 50);
    this._notify();
  }

  dismissResult(id) {
    this.results = this.results.filter(r => r.id !== id);
    this._notify();
  }

  clearAll() {
    this.results = [];
    this._notify();
  }

  /**
   * Main entry point — called after a chapter is saved.
   * @param {object} params
   *   chapter: chapter object with { id, title, content|script }
   *   book: book object
   *   actors: all actors array
   *   itemBank: all items array
   *   skillBank: all skills array
   */
  async runAfterChapterSave({ chapter, book, actors = [], itemBank = [], skillBank = [] }) {
    if (!this.enabled || this.isRunning) return;
    this.isRunning = true;

    try {
      const chapterText = chapter?.content || chapter?.script || '';
      if (!chapterText || chapterText.trim().length < 50) return;

      // Run all tasks concurrently but don't let one failure stop others
      await Promise.allSettled([
        this._flagStaleWikiEntries(chapterText, actors, itemBank, skillBank, chapter, book),
        this._detectMissingRelationships(chapterText, actors, chapter),
        this._suggestTimelineEvents(chapterText, actors, chapter, book),
        this._checkChapterConsistency(chapterText, actors, chapter),
        this._checkPlotThreadProgress(chapterText, chapter, book),
      ]);
    } catch (err) {
      console.warn('[StoryContiguityAgent] Error during run:', err);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Task 1: Flag wiki entries as stale when their entity is mentioned in the chapter
   */
  async _flagStaleWikiEntries(text, actors, items, skills, chapter, book) {
    try {
      const allWiki = await db.getAll('wiki') || [];
      const flagged = [];

      allWiki.forEach(entry => {
        const name = (entry.name || entry.title || '').toLowerCase();
        if (name && text.toLowerCase().includes(name) && !entry.stale) {
          flagged.push(entry);
        }
      });

      if (flagged.length > 0) {
        // Mark them stale in the database
        for (const entry of flagged) {
          try {
            await db.update('wiki', { ...entry, stale: true, staleChapterId: chapter?.id, staleChapterTitle: chapter?.title });
          } catch (_) {}
        }
        this.addResult({
          type: 'wiki_stale',
          title: 'Wiki Entries May Need Updating',
          message: `${flagged.length} wiki entr${flagged.length === 1 ? 'y' : 'ies'} (${flagged.slice(0, 3).map(e => e.name || e.title).join(', ')}${flagged.length > 3 ? '...' : ''}) may be outdated after saving "${chapter?.title || 'this chapter'}".`,
          severity: 'info',
          chapterId: chapter?.id,
          count: flagged.length,
        });
      }
    } catch (err) {
      console.warn('[StoryContiguityAgent] Wiki stale check error:', err);
    }
  }

  /**
   * Task 2: Detect characters who co-appear in the chapter but have no defined relationship
   */
  async _detectMissingRelationships(text, actors, chapter) {
    try {
      const presentActors = actors.filter(a => a.name && text.toLowerCase().includes(a.name.toLowerCase()));
      if (presentActors.length < 2) return;

      const allRels = await db.getAll('relationships') || [];
      const gaps = [];

      for (let i = 0; i < presentActors.length; i++) {
        for (let j = i + 1; j < presentActors.length; j++) {
          const a = presentActors[i];
          const b = presentActors[j];
          const hasRel = allRels.some(r =>
            (r.actor1Id === a.id && r.actor2Id === b.id) ||
            (r.actor1Id === b.id && r.actor2Id === a.id)
          );
          if (!hasRel) gaps.push(`${a.name} ↔ ${b.name}`);
        }
      }

      if (gaps.length > 0) {
        this.addResult({
          type: 'relationship_gap',
          title: 'Undefined Relationships Detected',
          message: `${gaps.length} character pair${gaps.length === 1 ? '' : 's'} appear together in "${chapter?.title || 'this chapter'}" but have no defined relationship: ${gaps.slice(0, 3).join(', ')}${gaps.length > 3 ? '...' : ''}.`,
          severity: 'warning',
          chapterId: chapter?.id,
          count: gaps.length,
          gaps,
        });
      }
    } catch (err) {
      console.warn('[StoryContiguityAgent] Relationship gap check error:', err);
    }
  }

  /**
   * Task 3: Suggest timeline events based on chapter content (AI-powered)
   */
  async _suggestTimelineEvents(text, actors, chapter, book) {
    try {
      if (text.length < 200) return;
      const system = 'You are a story analyst. Extract the 2-3 most important story events from this chapter text. Return ONLY a JSON array: [{"title":"...","type":"milestone|character_appearance|relationship_change|item_event|skill_event|travel","description":"..."}]. Maximum 3 items.';
      const result = await aiService.callAI(text.slice(0, 3000), 'analytical', system);
      if (!result) return;
      const events = JSON.parse(result.replace(/```json|```/g, '').trim());
      if (Array.isArray(events) && events.length > 0) {
        this.addResult({
          type: 'timeline_suggestion',
          title: 'Timeline Events Suggested',
          message: `Detected ${events.length} key event${events.length === 1 ? '' : 's'} in "${chapter?.title || 'this chapter'}": ${events.map(e => e.title).join(', ')}.`,
          severity: 'info',
          chapterId: chapter?.id,
          suggestions: events,
        });
      }
    } catch (err) {
      console.warn('[StoryContiguityAgent] Timeline suggestion error:', err);
    }
  }

  /**
   * Task 4: Quick consistency check for the saved chapter
   */
  async _checkChapterConsistency(text, actors, chapter) {
    try {
      if (text.length < 200 || actors.length === 0) return;
      const knownChars = actors.map(a => a.name).join(', ');
      const system = `Known characters: ${knownChars}. Check this chapter text for consistency issues: unknown characters, contradictions, or errors. Return ONLY a JSON array: [{"issue":"...","severity":"warning|critical"}] or []. Max 3.`;
      const result = await aiService.callAI(text.slice(0, 2500), 'analytical', system);
      if (!result) return;
      const issues = JSON.parse(result.replace(/```json|```/g, '').trim());
      if (Array.isArray(issues) && issues.length > 0) {
        const criticals = issues.filter(i => i.severity === 'critical').length;
        this.addResult({
          type: 'consistency_issue',
          title: `${issues.length} Consistency Issue${issues.length > 1 ? 's' : ''} Detected`,
          message: `Chapter "${chapter?.title || 'Untitled'}" has potential issues: ${issues.map(i => i.issue).join('; ')}.`,
          severity: criticals > 0 ? 'critical' : 'warning',
          chapterId: chapter?.id,
          issues,
        });
      }
    } catch (err) {
      console.warn('[StoryContiguityAgent] Consistency check error:', err);
    }
  }

  /**
   * Task 5: Update plot thread progress based on chapter content
   */
  async _checkPlotThreadProgress(text, chapter, book) {
    try {
      const plotBeats = await db.getAll('plotBeats') || [];
      if (plotBeats.length === 0) return;

      const completedBeats = plotBeats.filter(beat => {
        const beatTitle = (beat.title || beat.description || '').toLowerCase();
        return beatTitle && text.toLowerCase().includes(beatTitle.slice(0, 20));
      });

      if (completedBeats.length > 0) {
        this.addResult({
          type: 'plot_progress',
          title: 'Plot Beats Potentially Completed',
          message: `${completedBeats.length} plot beat${completedBeats.length > 1 ? 's' : ''} may have been addressed in "${chapter?.title || 'this chapter'}": ${completedBeats.slice(0, 2).map(b => b.title || b.description).join(', ')}${completedBeats.length > 2 ? '...' : ''}.`,
          severity: 'info',
          chapterId: chapter?.id,
          beatIds: completedBeats.map(b => b.id),
        });
      }
    } catch (err) {
      console.warn('[StoryContiguityAgent] Plot thread check error:', err);
    }
  }
}

const storyContiguityAgent = new StoryContiguityAgent();
export default storyContiguityAgent;

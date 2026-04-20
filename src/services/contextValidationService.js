/**
 * Context Validation Service
 * Traffic light system for validating context data
 */

import db from './database';
import manuscriptContextEngine from './manuscriptContextEngine';

class ContextValidationService {
  constructor() {
    this.validationCache = new Map();
  }

  /**
   * Validate manuscript context for a chapter
   * Returns traffic light status: green, yellow, or red
   * @param {number} bookId - Book ID
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Object>} Validation result
   */
  async validateManuscriptContext(bookId, chapterId) {
    try {
      const cacheKey = `validation_${bookId}_${chapterId}`;
      const cached = this.validationCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < 30000) { // 30 second cache
        return cached.data;
      }

      const context = await manuscriptContextEngine.buildManuscriptContext(bookId, chapterId);
      
      const checks = {
        plotBeats: this._checkPlotBeats(context.plotBeats),
        characterArcs: this._checkCharacterArcs(context.characterArcs),
        timelineEvents: this._checkTimelineEvents(context.timeline),
        decisions: this._checkDecisions(context.decisions),
        storylines: this._checkStorylines(context.storylines),
        chapterFlow: this._checkChapterFlow(context.chapterFlow)
      };

      // Calculate overall status
      const status = this._calculateStatus(checks);
      const missingContext = this._getMissingContext(checks);

      const result = {
        status: status, // 'green' | 'yellow' | 'red'
        checks: checks,
        missingContext: missingContext,
        suggestions: this._suggestContextEnhancements(checks, bookId, chapterId),
        timestamp: Date.now()
      };

      this.validationCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('Error validating manuscript context:', error);
      return {
        status: 'red',
        checks: {},
        missingContext: [],
        suggestions: [],
        error: error.message
      };
    }
  }

  /**
   * Check plot beats
   * @param {Array} plotBeats - Plot beats
   * @returns {Object} Check result
   */
  _checkPlotBeats(plotBeats) {
    if (!plotBeats || plotBeats.length === 0) {
      return { status: 'red', message: 'No plot beats found', count: 0 };
    }

    const assignedBeats = plotBeats.filter(b => b.targetChapter || b.chapterId);
    const unassignedBeats = plotBeats.length - assignedBeats.length;

    if (unassignedBeats > plotBeats.length * 0.5) {
      return { 
        status: 'yellow', 
        message: `${unassignedBeats} beats not assigned to chapters`,
        count: plotBeats.length,
        assigned: assignedBeats.length,
        unassigned: unassignedBeats
      };
    }

    return { 
      status: 'green', 
      message: `${plotBeats.length} plot beats available`,
      count: plotBeats.length,
      assigned: assignedBeats.length
    };
  }

  /**
   * Check character arcs
   * @param {Array} characterArcs - Character arcs
   * @returns {Object} Check result
   */
  _checkCharacterArcs(characterArcs) {
    if (!characterArcs || characterArcs.length === 0) {
      return { status: 'yellow', message: 'No character arcs found', count: 0 };
    }

    const arcsWithMoments = characterArcs.filter(arc => 
      arc.moments && arc.moments.length > 0
    );

    if (arcsWithMoments.length < characterArcs.length * 0.7) {
      return { 
        status: 'yellow', 
        message: `${characterArcs.length - arcsWithMoments.length} arcs without milestones`,
        count: characterArcs.length,
        withMoments: arcsWithMoments.length
      };
    }

    return { 
      status: 'green', 
      message: `${characterArcs.length} character arcs with milestones`,
      count: characterArcs.length
    };
  }

  /**
   * Check timeline events
   * @param {Array} timelineEvents - Timeline events
   * @returns {Object} Check result
   */
  _checkTimelineEvents(timelineEvents) {
    if (!timelineEvents || timelineEvents.length === 0) {
      return { status: 'yellow', message: 'No timeline events found', count: 0 };
    }

    const linkedEvents = timelineEvents.filter(evt => 
      evt.chapterId || evt.bookId
    );

    if (linkedEvents.length < timelineEvents.length * 0.8) {
      return { 
        status: 'yellow', 
        message: `${timelineEvents.length - linkedEvents.length} events not linked to chapters`,
        count: timelineEvents.length,
        linked: linkedEvents.length
      };
    }

    return { 
      status: 'green', 
      message: `${timelineEvents.length} timeline events available`,
      count: timelineEvents.length,
      linked: linkedEvents.length
    };
  }

  /**
   * Check decisions
   * @param {Array} decisions - Decisions
   * @returns {Object} Check result
   */
  _checkDecisions(decisions) {
    if (!decisions || decisions.length === 0) {
      return { status: 'green', message: 'No decisions to track', count: 0 };
    }

    const decisionsWithConsequences = decisions.filter(dec => 
      dec.consequences && dec.consequences.length > 0
    );

    if (decisionsWithConsequences.length < decisions.length * 0.6) {
      return { 
        status: 'yellow', 
        message: `${decisions.length - decisionsWithConsequences.length} decisions without tracked consequences`,
        count: decisions.length,
        withConsequences: decisionsWithConsequences.length
      };
    }

    return { 
      status: 'green', 
      message: `${decisions.length} decisions tracked`,
      count: decisions.length
    };
  }

  /**
   * Check storylines
   * @param {Array} storylines - Storylines
   * @returns {Object} Check result
   */
  _checkStorylines(storylines) {
    if (!storylines || storylines.length === 0) {
      return { status: 'yellow', message: 'No storylines found', count: 0 };
    }

    const activeStorylines = storylines.filter(sl => 
      sl.status === 'active' || sl.status === 'ongoing'
    );

    const storylinesWithContinuity = storylines.filter(sl => 
      sl.relatedChapters && sl.relatedChapters.length > 1
    );

    if (storylinesWithContinuity.length < storylines.length * 0.5) {
      return { 
        status: 'yellow', 
        message: `${storylines.length - storylinesWithContinuity.length} storylines without continuity tracking`,
        count: storylines.length,
        withContinuity: storylinesWithContinuity.length,
        active: activeStorylines.length
      };
    }

    return { 
      status: 'green', 
      message: `${storylines.length} storylines tracked`,
      count: storylines.length,
      active: activeStorylines.length
    };
  }

  /**
   * Check chapter flow
   * @param {Object} chapterFlow - Chapter flow data
   * @returns {Object} Check result
   */
  _checkChapterFlow(chapterFlow) {
    if (!chapterFlow || !chapterFlow.chapters || chapterFlow.chapters.length === 0) {
      return { status: 'red', message: 'No chapter flow data', count: 0 };
    }

    const chaptersWithContent = chapterFlow.chapters.filter(ch => ch.hasContent);
    
    if (chaptersWithContent.length < chapterFlow.chapters.length * 0.3) {
      return { 
        status: 'yellow', 
        message: `${chapterFlow.chapters.length - chaptersWithContent.length} chapters without content`,
        count: chapterFlow.chapters.length,
        withContent: chaptersWithContent.length
      };
    }

    return { 
      status: 'green', 
      message: `${chapterFlow.chapters.length} chapters in flow`,
      count: chapterFlow.chapters.length
    };
  }

  /**
   * Calculate overall status from checks
   * @param {Object} checks - All check results
   * @returns {string} Overall status
   */
  _calculateStatus(checks) {
    const statuses = Object.values(checks).map(check => check.status);
    const redCount = statuses.filter(s => s === 'red').length;
    const yellowCount = statuses.filter(s => s === 'yellow').length;

    if (redCount > 0) return 'red';
    if (yellowCount > 2) return 'yellow';
    if (yellowCount > 0) return 'yellow';
    return 'green';
  }

  /**
   * Get missing context items
   * @param {Object} checks - All check results
   * @returns {Array} Missing context items
   */
  _getMissingContext(checks) {
    const missing = [];

    if (checks.plotBeats.status === 'red') {
      missing.push({ type: 'plotBeats', message: 'No plot beats found' });
    }

    if (checks.characterArcs.status === 'red') {
      missing.push({ type: 'characterArcs', message: 'No character arcs found' });
    }

    if (checks.timelineEvents.status === 'red') {
      missing.push({ type: 'timelineEvents', message: 'No timeline events found' });
    }

    if (checks.chapterFlow.status === 'red') {
      missing.push({ type: 'chapterFlow', message: 'No chapter flow data' });
    }

    return missing;
  }

  /**
   * Suggest context enhancements
   * @param {Object} checks - All check results
   * @param {number} bookId - Book ID
   * @param {number} chapterId - Chapter ID
   * @returns {Array} Enhancement suggestions
   */
  _suggestContextEnhancements(checks, bookId, chapterId) {
    const suggestions = [];

    if (checks.plotBeats.status !== 'green') {
      suggestions.push({
        type: 'plotBeats',
        action: 'Extract plot beats from chapters',
        priority: checks.plotBeats.status === 'red' ? 'high' : 'medium'
      });
    }

    if (checks.characterArcs.status !== 'green') {
      suggestions.push({
        type: 'characterArcs',
        action: 'Extract character arc moments',
        priority: checks.characterArcs.status === 'red' ? 'high' : 'medium'
      });
    }

    if (checks.timelineEvents.status !== 'green') {
      suggestions.push({
        type: 'timelineEvents',
        action: 'Extract timeline events from chapters',
        priority: checks.timelineEvents.status === 'red' ? 'high' : 'medium'
      });
    }

    if (checks.storylines.status !== 'green') {
      suggestions.push({
        type: 'storylines',
        action: 'Track storylines across chapters',
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear();
  }
}

// Create singleton instance
const contextValidationService = new ContextValidationService();

export default contextValidationService;

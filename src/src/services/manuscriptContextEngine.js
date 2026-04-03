/**
 * Manuscript Context Engine
 * Assembles manuscript-extracted data for Writers Room context
 */

import db from './database';
import contextEngine from './contextEngine';
import chapterFlowAnalyzer from './chapterFlowAnalyzer';

class ManuscriptContextEngine {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute
  }

  /**
   * Build complete manuscript context for a chapter
   * @param {number} bookId - Book ID
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Object>} Complete manuscript context
   */
  async buildManuscriptContext(bookId, chapterId) {
    try {
      const cacheKey = `manuscript_${bookId}_${chapterId}`;
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.data;
      }

      const [
        chapterFlowContext,
        plotBeatContext,
        storylineContext,
        characterArcContext,
        timelineContext,
        decisionContext,
        aiSuggestionContext,
        callbacksContext,
        memoriesContext
      ] = await Promise.all([
        this.getChapterFlowContext(bookId),
        this.getPlotBeatContext(chapterId),
        this.getStorylineContext(chapterId),
        this.getCharacterArcContext(null, chapterId), // null = all characters
        this.getTimelineContext(chapterId),
        this.getDecisionContext(chapterId),
        this.getAISuggestionContext(chapterId),
        this.getCallbacksContext(chapterId),
        this.getMemoriesContext(chapterId)
      ]);

      const context = {
        chapterFlow: chapterFlowContext,
        plotBeats: plotBeatContext,
        storylines: storylineContext,
        characterArcs: characterArcContext,
        timeline: timelineContext,
        decisions: decisionContext,
        aiSuggestions: aiSuggestionContext,
        callbacks: callbacksContext,
        memories: memoriesContext,
        generatedAt: Date.now()
      };

      this.cache.set(cacheKey, { data: context, timestamp: Date.now() });
      return context;
    } catch (error) {
      console.error('Error building manuscript context:', error);
      return {
        chapterFlow: {},
        plotBeats: [],
        storylines: [],
        characterArcs: [],
        timeline: [],
        decisions: [],
        aiSuggestions: [],
        callbacks: [],
        memories: [],
        generatedAt: Date.now()
      };
    }
  }

  /**
   * Get AI suggestion context for a chapter
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Array>} AI suggestions
   */
  async getAISuggestionContext(chapterId) {
    try {
      const cacheKey = `ai_suggestions_${chapterId}`;
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.data;
      }

      let suggestions = [];
      try {
        const allSuggestions = await db.getAll('aiSuggestions') || [];
        suggestions = allSuggestions.filter(s => 
          s.chapterId === chapterId && 
          (s.status === 'pending' || s.status === 'accepted')
        );
      } catch (e) {
        // Database store might not exist yet
        return [];
      }

      const result = suggestions.map(s => ({
        id: s.id,
        type: s.type,
        priority: s.priority,
        confidence: s.confidence,
        suggestion: s.suggestion,
        reasoning: s.reasoning,
        suggestions: s.suggestions || [],
        characters: s.characters || []
      }));

      // Cache for 5 minutes
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('Error getting AI suggestion context:', error);
      return [];
    }
  }

  /**
   * Invalidate AI suggestions cache for a chapter
   * @param {number} chapterId - Chapter ID
   */
  invalidateAISuggestionsCache(chapterId) {
    const cacheKey = `ai_suggestions_${chapterId}`;
    this.cache.delete(cacheKey);
    // Also invalidate the full manuscript context cache
    const manuscriptCacheKey = `manuscript_${chapterId}`;
    this.cache.delete(manuscriptCacheKey);
  }

  /**
   * Get callbacks context for a chapter
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Array>} Callbacks
   */
  async getCallbacksContext(chapterId) {
    try {
      let callbacks = [];
      try {
        callbacks = await db.getAll('callbacks') || [];
      } catch (e) {
        // Callbacks table might not exist yet
        return [];
      }

      // Get callbacks relevant to this chapter
      const relevantCallbacks = callbacks.filter(cb => {
        // Callbacks from previous chapters that haven't been used
        if (cb.chapterId === chapterId) return true;
        if (cb.used) return false;
        if (cb.targetChapter === chapterId) return true;
        return false;
      });

      // Also get callbacks from previous chapters
      const book = await this._getBookForChapter(chapterId);
      if (book) {
        const currentChapter = book.chapters?.find(ch => ch.id === chapterId);
        if (currentChapter) {
          const previousChapters = book.chapters?.filter(ch => 
            ch.number < currentChapter.number
          ) || [];
          
          const previousChapterIds = previousChapters.map(ch => ch.id);
          const previousCallbacks = callbacks.filter(cb => 
            previousChapterIds.includes(cb.chapterId) && !cb.used
          );
          
          relevantCallbacks.push(...previousCallbacks.slice(-5)); // Last 5 unused callbacks
        }
      }

      return relevantCallbacks.sort((a, b) => (b.importance || 0) - (a.importance || 0));
    } catch (error) {
      console.error('Error getting callbacks context:', error);
      return [];
    }
  }

  /**
   * Get memories context for a chapter
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Array>} Memories
   */
  async getMemoriesContext(chapterId) {
    try {
      let memories = [];
      try {
        memories = await db.getAll('memories') || [];
      } catch (e) {
        // Memories table might not exist yet
        return [];
      }

      // Get memories from previous chapters
      const book = await this._getBookForChapter(chapterId);
      if (book) {
        const currentChapter = book.chapters?.find(ch => ch.id === chapterId);
        if (currentChapter) {
          const previousChapters = book.chapters?.filter(ch => 
            ch.number < currentChapter.number
          ) || [];
          
          const previousChapterIds = previousChapters.map(ch => ch.id);
          const relevantMemories = memories.filter(m => 
            previousChapterIds.includes(m.chapterId) && 
            (m.importance || 0) >= 5 // Only important memories
          );
          
          return relevantMemories
            .sort((a, b) => (b.importance || 0) - (a.importance || 0))
            .slice(0, 10); // Top 10 most important memories
        }
      }

      return memories.filter(m => m.chapterId === chapterId);
    } catch (error) {
      console.error('Error getting memories context:', error);
      return [];
    }
  }

  /**
   * Get chapter flow context
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Chapter flow context
   */
  async getChapterFlowContext(bookId) {
    try {
      const book = await db.get('books', bookId);
      if (!book || !book.chapters) {
        return { chapters: [], flow: null };
      }

      const chapters = book.chapters.map(ch => ({
        id: ch.id,
        number: ch.number,
        title: ch.title,
        desc: ch.desc,
        hasContent: !!(ch.script || ch.content)
      }));

      // Get flow analysis
      const flowAnalysis = await chapterFlowAnalyzer.analyzeChapterDependencies(
        book.chapters,
        { [bookId]: book }
      );

      return {
        chapters: chapters,
        flow: flowAnalysis.flow,
        dependencies: flowAnalysis.dependencies,
        bookTitle: book.title,
        bookId: book.id
      };
    } catch (error) {
      console.error('Error getting chapter flow context:', error);
      return { chapters: [], flow: null };
    }
  }

  /**
   * Get plot beat context for a chapter
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Array>} Relevant plot beats
   */
  async getPlotBeatContext(chapterId) {
    try {
      // Get all plot beats
      const allBeats = await contextEngine.getPlotBeats();
      
      // Filter beats relevant to this chapter
      const relevantBeats = allBeats.filter(beat => {
        // Check if beat is assigned to this chapter
        if (beat.targetChapter === chapterId || beat.chapterId === chapterId) {
          return true;
        }
        
        // Check if beat mentions this chapter
        if (beat.chapters && beat.chapters.includes(chapterId)) {
          return true;
        }
        
        return false;
      });

      // Also get beats from previous chapters that might be relevant
      const book = await this._getBookForChapter(chapterId);
      if (book) {
        const currentChapter = book.chapters?.find(ch => ch.id === chapterId);
        if (currentChapter) {
          const previousChapters = book.chapters?.filter(ch => 
            ch.number < currentChapter.number
          ) || [];
          
          for (const prevChapter of previousChapters) {
            const prevBeats = allBeats.filter(beat => 
              beat.targetChapter === prevChapter.id || beat.chapterId === prevChapter.id
            );
            relevantBeats.push(...prevBeats.slice(-3)); // Last 3 beats from previous chapters
          }
        }
      }

      return relevantBeats;
    } catch (error) {
      console.error('Error getting plot beat context:', error);
      return [];
    }
  }

  /**
   * Get storyline context for a chapter
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Array>} Active storylines
   */
  async getStorylineContext(chapterId) {
    try {
      // Try to get storylines from database
      let storylines = [];
      try {
        storylines = await db.getAll('storylines') || [];
      } catch (e) {
        // Storylines table might not exist yet
      }

      // Filter active storylines
      const activeStorylines = storylines.filter(sl => {
        if (sl.status === 'resolved') return false;
        if (sl.relatedChapters && sl.relatedChapters.includes(chapterId)) return true;
        if (sl.chapterId === chapterId) return true;
        return sl.status === 'active' || sl.status === 'ongoing';
      });

      return activeStorylines;
    } catch (error) {
      console.error('Error getting storyline context:', error);
      return [];
    }
  }

  /**
   * Get character arc context
   * @param {Array} characterIds - Character IDs (null = all characters)
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Array>} Character arc data
   */
  async getCharacterArcContext(characterIds, chapterId) {
    try {
      let arcs = [];
      try {
        arcs = await db.getAll('characterArcs') || [];
      } catch (e) {
        // Character arcs table might not exist yet
      }

      // Filter by character IDs if provided
      if (characterIds && Array.isArray(characterIds)) {
        arcs = arcs.filter(arc => characterIds.includes(arc.characterId));
      }

      // Get arc moments relevant to this chapter
      const relevantArcs = arcs.map(arc => {
        const relevantMoments = (arc.timeline || []).filter(moment => {
          return moment.chapterId === chapterId || 
                 moment.bookId === (arc.bookId || null);
        });

        return {
          characterId: arc.characterId,
          characterName: arc.characterName,
          moments: relevantMoments,
          statsHistory: arc.statsHistory || [],
          emotionalStates: arc.emotionalStates || [],
          goals: arc.goals || []
        };
      });

      return relevantArcs;
    } catch (error) {
      console.error('Error getting character arc context:', error);
      return [];
    }
  }

  /**
   * Get timeline context for a chapter
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Array>} Timeline events
   */
  async getTimelineContext(chapterId) {
    try {
      const events = await db.getAll('timelineEvents') || [];
      
      // Get events for this chapter
      const chapterEvents = events.filter(evt => evt.chapterId === chapterId);
      
      // Get recent events from previous chapters
      const book = await this._getBookForChapter(chapterId);
      if (book) {
        const currentChapter = book.chapters?.find(ch => ch.id === chapterId);
        if (currentChapter) {
          const previousChapters = book.chapters?.filter(ch => 
            ch.number < currentChapter.number
          ) || [];
          
          const previousChapterIds = previousChapters.map(ch => ch.id);
          const recentEvents = events
            .filter(evt => previousChapterIds.includes(evt.chapterId))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 10); // Last 10 events
          
          return [...chapterEvents, ...recentEvents];
        }
      }

      return chapterEvents;
    } catch (error) {
      console.error('Error getting timeline context:', error);
      return [];
    }
  }

  /**
   * Get decision context for a chapter
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Array>} Past decisions
   */
  async getDecisionContext(chapterId) {
    try {
      let decisions = [];
      try {
        decisions = await db.getAll('decisions') || [];
      } catch (e) {
        // Decisions table might not exist yet
      }

      // Get decisions from previous chapters
      const book = await this._getBookForChapter(chapterId);
      if (book) {
        const currentChapter = book.chapters?.find(ch => ch.id === chapterId);
        if (currentChapter) {
          const previousChapters = book.chapters?.filter(ch => 
            ch.number < currentChapter.number
          ) || [];
          
          const previousChapterIds = previousChapters.map(ch => ch.id);
          const relevantDecisions = decisions.filter(dec => 
            previousChapterIds.includes(dec.chapterId || dec.chapterNumber)
          );
          
          return relevantDecisions.sort((a, b) => 
            (b.importance || 0) - (a.importance || 0)
          );
        }
      }

      return decisions.filter(dec => dec.chapterId === chapterId);
    } catch (error) {
      console.error('Error getting decision context:', error);
      return [];
    }
  }

  /**
   * Helper: Get book for a chapter
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Object|null>} Book object
   */
  async _getBookForChapter(chapterId) {
    try {
      const books = await db.getAll('books');
      for (const book of books) {
        if (book.chapters && Array.isArray(book.chapters)) {
          const chapter = book.chapters.find(ch => ch.id === chapterId);
          if (chapter) {
            return book;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting book for chapter:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const manuscriptContextEngine = new ManuscriptContextEngine();

export default manuscriptContextEngine;

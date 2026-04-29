/**
 * Callback and Memory Service
 * Tracks callbacks, memories, and decisions for story continuity
 */

import db from './database';

class CallbackMemoryService {
  constructor() {
    this.memoryCache = new Map();
  }

  /**
   * Register a callback - mark an event for future reference
   * @param {Object} event - Event to register
   * @param {number} targetChapter - Target chapter ID (optional)
   * @returns {Promise<Object>} Registered callback
   */
  async registerCallback(event, targetChapter = null) {
    try {
      const callback = {
        id: `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event: event.event || event.title || '',
        description: event.description || '',
        type: event.type || 'callback',
        importance: event.importance || 5,
        chapterId: event.chapterId || null,
        bookId: event.bookId || null,
        targetChapter: targetChapter,
        characters: event.characters || [],
        createdAt: Date.now(),
        used: false,
        usedIn: []
      };

      try {
        await db.add('callbacks', callback);
      } catch (e) {
        // Table might not exist, create it
        await db.add('callbacks', callback);
      }

      return callback;
    } catch (error) {
      console.error('Error registering callback:', error);
      throw error;
    }
  }

  /**
   * Get callbacks for a chapter
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Array>} Callbacks to include
   */
  async getCallbacksForChapter(chapterId) {
    try {
      let callbacks = [];
      try {
        callbacks = await db.getAll('callbacks') || [];
      } catch (e) {
        // Table might not exist
        return [];
      }

      // Get callbacks that:
      // 1. Are targeted to this chapter
      // 2. Are from previous chapters and not yet used
      // 3. Are important enough to reference
      const relevantCallbacks = callbacks.filter(cb => {
        if (cb.targetChapter === chapterId) return true;
        if (cb.used) return false;
        if (cb.importance >= 7) return true; // High importance
        return false;
      });

      // Sort by importance and recency
      return relevantCallbacks.sort((a, b) => {
        if (a.importance !== b.importance) {
          return (b.importance || 0) - (a.importance || 0);
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    } catch (error) {
      console.error('Error getting callbacks for chapter:', error);
      return [];
    }
  }

  /**
   * Store a memory - important event to remember
   * @param {Object} event - Event to store
   * @param {number} importance - Importance level (1-10)
   * @returns {Promise<Object>} Stored memory
   */
  async storeMemory(event, importance = 5) {
    try {
      const memory = {
        id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event: event.event || event.title || '',
        description: event.description || '',
        type: event.type || 'memory',
        importance: importance,
        chapterId: event.chapterId || null,
        bookId: event.bookId || null,
        characters: event.characters || [],
        emotionalTone: event.emotionalTone || '',
        createdAt: Date.now(),
        referenced: false,
        referencedIn: []
      };

      try {
        await db.add('memories', memory);
      } catch (e) {
        // Table might not exist
        await db.add('memories', memory);
      }

      return memory;
    } catch (error) {
      console.error('Error storing memory:', error);
      throw error;
    }
  }

  /**
   * Get relevant memories for a chapter
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Array>} Relevant memories
   */
  async getRelevantMemories(chapterId) {
    try {
      let memories = [];
      try {
        memories = await db.getAll('memories') || [];
      } catch (e) {
        // Table might not exist
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
          const relevantMemories = memories.filter(mem => 
            previousChapterIds.includes(mem.chapterId) && 
            (mem.importance >= 6 || !mem.referenced)
          );
          
          // Sort by importance and recency
          return relevantMemories.sort((a, b) => {
            if (a.importance !== b.importance) {
              return (b.importance || 0) - (a.importance || 0);
            }
            return (b.createdAt || 0) - (a.createdAt || 0);
          }).slice(0, 10); // Top 10 most relevant
        }
      }

      return memories.filter(mem => mem.chapterId === chapterId);
    } catch (error) {
      console.error('Error getting relevant memories:', error);
      return [];
    }
  }

  /**
   * Track a decision
   * @param {Object} decision - Decision to track
   * @param {Array} consequences - Potential consequences
   * @returns {Promise<Object>} Tracked decision
   */
  async trackDecision(decision, consequences = []) {
    try {
      const trackedDecision = {
        id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        decision: decision.decision || decision.title || '',
        character: decision.character || '',
        consequences: consequences,
        importance: decision.importance || 5,
        type: decision.type || 'plot',
        chapterId: decision.chapterId || null,
        bookId: decision.bookId || null,
        createdAt: Date.now(),
        resolved: false,
        resolvedIn: null
      };

      try {
        await db.add('decisions', trackedDecision);
      } catch (e) {
        // Table might not exist
        await db.add('decisions', trackedDecision);
      }

      return trackedDecision;
    } catch (error) {
      console.error('Error tracking decision:', error);
      throw error;
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
        // Table might not exist
        return [];
      }

      // Get unresolved decisions from previous chapters
      const book = await this._getBookForChapter(chapterId);
      if (book) {
        const currentChapter = book.chapters?.find(ch => ch.id === chapterId);
        if (currentChapter) {
          const previousChapters = book.chapters?.filter(ch => 
            ch.number < currentChapter.number
          ) || [];
          
          const previousChapterIds = previousChapters.map(ch => ch.id);
          const relevantDecisions = decisions.filter(dec => 
            previousChapterIds.includes(dec.chapterId) && 
            !dec.resolved &&
            (dec.importance >= 6)
          );
          
          return relevantDecisions.sort((a, b) => 
            (b.importance || 0) - (a.importance || 0)
          );
        }
      }

      return decisions.filter(dec => dec.chapterId === chapterId && !dec.resolved);
    } catch (error) {
      console.error('Error getting decision context:', error);
      return [];
    }
  }

  /**
   * Mark callback as used
   * @param {string} callbackId - Callback ID
   * @param {number} chapterId - Chapter where it was used
   * @returns {Promise<void>}
   */
  async markCallbackUsed(callbackId, chapterId) {
    try {
      const callback = await db.get('callbacks', callbackId);
      if (callback) {
        callback.used = true;
        if (!callback.usedIn) callback.usedIn = [];
        callback.usedIn.push(chapterId);
        await db.update('callbacks', callback);
      }
    } catch (error) {
      console.error('Error marking callback as used:', error);
    }
  }

  /**
   * Mark memory as referenced
   * @param {string} memoryId - Memory ID
   * @param {number} chapterId - Chapter where it was referenced
   * @returns {Promise<void>}
   */
  async markMemoryReferenced(memoryId, chapterId) {
    try {
      const memory = await db.get('memories', memoryId);
      if (memory) {
        memory.referenced = true;
        if (!memory.referencedIn) memory.referencedIn = [];
        memory.referencedIn.push(chapterId);
        await db.update('memories', memory);
      }
    } catch (error) {
      console.error('Error marking memory as referenced:', error);
    }
  }

  /**
   * Check continuity - ensure callbacks are properly used
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Object>} Continuity check result
   */
  async checkContinuity(chapterId) {
    try {
      const callbacks = await this.getCallbacksForChapter(chapterId);
      const memories = await this.getRelevantMemories(chapterId);
      const decisions = await this.getDecisionContext(chapterId);

      return {
        callbacksAvailable: callbacks.length,
        memoriesAvailable: memories.length,
        decisionsPending: decisions.length,
        suggestions: this._generateContinuitySuggestions(callbacks, memories, decisions)
      };
    } catch (error) {
      console.error('Error checking continuity:', error);
      return {
        callbacksAvailable: 0,
        memoriesAvailable: 0,
        decisionsPending: 0,
        suggestions: []
      };
    }
  }

  /**
   * Generate continuity suggestions
   * @param {Array} callbacks - Available callbacks
   * @param {Array} memories - Available memories
   * @param {Array} decisions - Pending decisions
   * @returns {Array} Suggestions
   */
  _generateContinuitySuggestions(callbacks, memories, decisions) {
    const suggestions = [];

    if (callbacks.length > 0) {
      suggestions.push({
        type: 'callback',
        message: `Consider referencing ${callbacks.length} callback${callbacks.length > 1 ? 's' : ''} from previous chapters`,
        items: callbacks.slice(0, 3).map(cb => cb.event)
      });
    }

    if (memories.length > 0) {
      suggestions.push({
        type: 'memory',
        message: `Consider referencing ${memories.length} important memory${memories.length > 1 ? 'ies' : ''}`,
        items: memories.slice(0, 3).map(mem => mem.event)
      });
    }

    if (decisions.length > 0) {
      suggestions.push({
        type: 'decision',
        message: `Consider addressing ${decisions.length} pending decision${decisions.length > 1 ? 's' : ''}`,
        items: decisions.slice(0, 3).map(dec => dec.decision)
      });
    }

    return suggestions;
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
}

// Create singleton instance
const callbackMemoryService = new CallbackMemoryService();

export default callbackMemoryService;

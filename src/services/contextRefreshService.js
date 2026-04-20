/**
 * Context Refresh Service
 * Refreshes context after changes to chapters, beats, events, etc.
 */

import db from './database';
import manuscriptContextEngine from './manuscriptContextEngine';
import contextValidationService from './contextValidationService';

class ContextRefreshService {
  constructor() {
    this.listeners = new Set();
    this.refreshQueue = new Set();
    this.isRefreshing = false;
  }

  /**
   * Register a listener for context updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unregister function
   */
  onContextUpdate(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of context update
   * @param {Object} update - Update information
   */
  _notifyListeners(update) {
    this.listeners.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in context update listener:', error);
      }
    });
  }

  /**
   * Detect changes and refresh context
   * @param {string} changeType - Type of change (chapter, beat, event, etc.)
   * @param {Object} changeData - Change data
   * @returns {Promise<void>}
   */
  async detectAndRefresh(changeType, changeData) {
    try {
      const refreshKey = `${changeType}_${changeData.bookId || 'all'}_${changeData.chapterId || 'all'}`;
      
      // Add to refresh queue
      this.refreshQueue.add(refreshKey);

      // Debounce refresh
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        setTimeout(async () => {
          await this._processRefreshQueue();
          this.isRefreshing = false;
        }, 500); // 500ms debounce
      }
    } catch (error) {
      console.error('Error detecting changes:', error);
      this.isRefreshing = false;
    }
  }

  /**
   * Process refresh queue
   * @returns {Promise<void>}
   */
  async _processRefreshQueue() {
    const keys = Array.from(this.refreshQueue);
    this.refreshQueue.clear();

    const updates = [];

    for (const key of keys) {
      const [changeType, bookId, chapterId] = key.split('_');
      
      if (bookId !== 'all' && chapterId !== 'all') {
        // Refresh specific chapter context
        try {
          manuscriptContextEngine.clearCache();
          const context = await manuscriptContextEngine.buildManuscriptContext(
            parseInt(bookId),
            parseInt(chapterId)
          );
          
          const validation = await contextValidationService.validateManuscriptContext(
            parseInt(bookId),
            parseInt(chapterId)
          );

          updates.push({
            type: changeType,
            bookId: parseInt(bookId),
            chapterId: parseInt(chapterId),
            context,
            validation
          });
        } catch (error) {
          console.error(`Error refreshing context for ${key}:`, error);
        }
      } else if (bookId !== 'all') {
        // Refresh all chapters in book
        try {
          const book = await db.get('books', parseInt(bookId));
          if (book && book.chapters) {
            for (const chapter of book.chapters) {
              manuscriptContextEngine.clearCache();
              const context = await manuscriptContextEngine.buildManuscriptContext(
                parseInt(bookId),
                chapter.id
              );
              
              const validation = await contextValidationService.validateManuscriptContext(
                parseInt(bookId),
                chapter.id
              );

              updates.push({
                type: changeType,
                bookId: parseInt(bookId),
                chapterId: chapter.id,
                context,
                validation
              });
            }
          }
        } catch (error) {
          console.error(`Error refreshing book context ${bookId}:`, error);
        }
      } else {
        // Refresh all books
        try {
          const books = await db.getAll('books');
          for (const book of books) {
            if (book.chapters) {
              for (const chapter of book.chapters) {
                manuscriptContextEngine.clearCache();
                const context = await manuscriptContextEngine.buildManuscriptContext(
                  book.id,
                  chapter.id
                );
                
                const validation = await contextValidationService.validateManuscriptContext(
                  book.id,
                  chapter.id
                );

                updates.push({
                  type: changeType,
                  bookId: book.id,
                  chapterId: chapter.id,
                  context,
                  validation
                });
              }
            }
          }
        } catch (error) {
          console.error('Error refreshing all context:', error);
        }
      }
    }

    // Notify listeners
    if (updates.length > 0) {
      this._notifyListeners({
        updates,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Refresh context for a specific chapter
   * @param {number} bookId - Book ID
   * @param {number} chapterId - Chapter ID
   * @returns {Promise<Object>} Refreshed context and validation
   */
  async refreshChapterContext(bookId, chapterId) {
    try {
      manuscriptContextEngine.clearCache();
      contextValidationService.clearCache();

      const context = await manuscriptContextEngine.buildManuscriptContext(bookId, chapterId);
      const validation = await contextValidationService.validateManuscriptContext(bookId, chapterId);

      this._notifyListeners({
        updates: [{
          type: 'manual_refresh',
          bookId,
          chapterId,
          context,
          validation
        }],
        timestamp: Date.now()
      });

      return { context, validation };
    } catch (error) {
      console.error('Error refreshing chapter context:', error);
      throw error;
    }
  }

  /**
   * Monitor database for changes
   * This is a placeholder - in a real implementation, you might use IndexedDB change events
   * or poll for changes
   */
  startMonitoring() {
    // In a real implementation, you might:
    // 1. Use IndexedDB change events (if available)
    // 2. Poll for changes periodically
    // 3. Use a custom event system
    // For now, components will call detectAndRefresh manually
    console.log('Context refresh monitoring started (manual mode)');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.refreshQueue.clear();
    this.isRefreshing = false;
    console.log('Context refresh monitoring stopped');
  }
}

// Create singleton instance
const contextRefreshService = new ContextRefreshService();

export default contextRefreshService;

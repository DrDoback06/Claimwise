/**
 * Chapter Navigation Service
 * Utility for navigating from visualizations to chapters in Series Bible
 */
class ChapterNavigationService {
  constructor() {
    this.navigationCallback = null;
  }

  /**
   * Set the navigation callback function
   * This should be set by App.js to handle actual navigation
   * @param {Function} callback - Function that takes (bookId, chapterId) and navigates
   */
  setNavigationCallback(callback) {
    this.navigationCallback = callback;
  }

  /**
   * Navigate to a specific chapter
   * @param {number|string} bookId - Book ID
   * @param {number|string} chapterId - Chapter ID
   * @param {Object} options - Additional options
   * @param {Function} options.onNavigate - Optional callback after navigation
   */
  navigateToChapter(bookId, chapterId, options = {}) {
    if (!this.navigationCallback) {
      console.warn('[ChapterNavigation] No navigation callback set. Call setNavigationCallback() first.');
      // Fallback: try to use window event or store for App.js to pick up
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('navigateToChapter', {
          detail: { bookId, chapterId }
        }));
      }
      return;
    }

    try {
      this.navigationCallback(bookId, chapterId);
      if (options.onNavigate) {
        options.onNavigate(bookId, chapterId);
      }
    } catch (error) {
      console.error('[ChapterNavigation] Error navigating to chapter:', error);
    }
  }

  /**
   * Navigate to a chapter by chapter number (finds first matching chapter)
   * @param {number} chapterNumber - Chapter number
   * @param {number} bookId - Optional book ID to limit search
   */
  async navigateToChapterByNumber(chapterNumber, bookId = null) {
    try {
      const db = (await import('./database')).default;
      const books = bookId 
        ? [await db.get('books', bookId)].filter(Boolean)
        : await db.getAll('books');

      for (const book of books) {
        if (!book.chapters) continue;
        const chapter = book.chapters.find(ch => 
          ch.number === chapterNumber || ch.id === chapterNumber
        );
        if (chapter) {
          this.navigateToChapter(book.id, chapter.id);
          return;
        }
      }

      console.warn(`[ChapterNavigation] Chapter ${chapterNumber} not found`);
    } catch (error) {
      console.error('[ChapterNavigation] Error finding chapter by number:', error);
    }
  }

  /**
   * Get chapter URL or identifier for display
   * @param {number|string} bookId - Book ID
   * @param {number|string} chapterId - Chapter ID
   * @returns {string} Display string
   */
  getChapterLabel(bookId, chapterId) {
    return `Book ${bookId}, Chapter ${chapterId}`;
  }
}

// Create singleton instance
const chapterNavigationService = new ChapterNavigationService();

export default chapterNavigationService;

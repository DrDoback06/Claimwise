/**
 * Chapter Navigation Service
 *
 * Lets any component ask the app to jump into the Writer's Room at a specific
 * book/chapter — and, as of Loomwright, a specific character range within the
 * chapter text. The editor (`WritingCanvasPro`) registers a seek handler;
 * Story Analysis / Canon Weaver / Plot Lab / Global Search consumers call
 * `navigateToChapter(bookId, chapterId, { range: [start, end] })`.
 */

class ChapterNavigationService {
  constructor() {
    this.navigationCallback = null;
    this.seekHandler = null;
    // Stash the most recent seek target so a lazily-mounted editor can replay
    // it when it finishes mounting.
    this.pendingSeek = null;
  }

  setNavigationCallback(callback) {
    this.navigationCallback = callback;
  }

  /**
   * Editors register themselves here. `handler(bookId, chapterId, range)` is
   * called whenever a consumer asks to jump to a range. Returning `true` tells
   * the service the seek succeeded (no retry needed).
   */
  setSeekHandler(handler) {
    this.seekHandler = handler;
    // If something tried to navigate before the editor mounted, replay.
    if (handler && this.pendingSeek) {
      try {
        handler(this.pendingSeek.bookId, this.pendingSeek.chapterId, this.pendingSeek.range);
      } catch (e) {
        console.warn('[ChapterNavigation] seek replay failed:', e);
      }
      this.pendingSeek = null;
    }
  }

  /**
   * Navigate to a specific chapter (and optionally a character range within
   * that chapter's body text).
   *
   * @param {number|string} bookId
   * @param {number|string} chapterId
   * @param {Object} [options]
   * @param {[number, number]} [options.range]  [startChar, endChar] to seek to
   * @param {Function}          [options.onNavigate] Callback after navigation
   */
  navigateToChapter(bookId, chapterId, options = {}) {
    const { range, onNavigate } = options;

    if (!this.navigationCallback) {
      console.warn('[ChapterNavigation] No navigation callback set.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('navigateToChapter', {
          detail: { bookId, chapterId, range },
        }));
      }
      return;
    }

    try {
      this.navigationCallback(bookId, chapterId, range);
    } catch (e) {
      console.error('[ChapterNavigation] Error navigating:', e);
    }

    // Even if the editor isn't mounted yet, stash the range so it picks up
    // once it registers.
    if (range) {
      if (this.seekHandler) {
        try {
          this.seekHandler(bookId, chapterId, range);
        } catch (e) {
          console.warn('[ChapterNavigation] seek failed, will retry on editor mount:', e);
          this.pendingSeek = { bookId, chapterId, range };
        }
      } else {
        this.pendingSeek = { bookId, chapterId, range };
      }
    }

    if (onNavigate) {
      try { onNavigate(bookId, chapterId, range); } catch (_e) { /* noop */ }
    }
  }

  async navigateToChapterByNumber(chapterNumber, bookId = null, options = {}) {
    try {
      const db = (await import('./database')).default;
      const books = bookId
        ? [await db.get('books', bookId)].filter(Boolean)
        : await db.getAll('books');

      for (const book of books) {
        if (!book.chapters) continue;
        const chapter = book.chapters.find(
          (ch) => ch.number === chapterNumber || ch.id === chapterNumber,
        );
        if (chapter) {
          this.navigateToChapter(book.id, chapter.id, options);
          return;
        }
      }

      console.warn(`[ChapterNavigation] Chapter ${chapterNumber} not found`);
    } catch (e) {
      console.error('[ChapterNavigation] Error finding chapter:', e);
    }
  }

  getChapterLabel(bookId, chapterId) {
    return `Book ${bookId}, Chapter ${chapterId}`;
  }
}

const chapterNavigationService = new ChapterNavigationService();
export default chapterNavigationService;

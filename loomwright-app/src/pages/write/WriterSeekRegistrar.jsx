/**
 * WriterSeekRegistrar - registers a seek handler on chapterNavigationService
 * that scrolls the Writer's Room textarea to a character range when the
 * Story Analysis drawer or Weaver points the app at a specific position.
 *
 * Finds the first `<textarea>` inside `.lw-writer-surface`. On a seek
 * request it sets the textarea selection to [start, end] and scrolls the
 * selection into view using the standard DOM techniques (set
 * selectionStart/End + focus, then find the scrollTop from the textarea's
 * scrollHeight proportional to the character offset).
 */

import { useEffect } from 'react';
import chapterNavigationService from '../../services/chapterNavigationService';

export default function WriterSeekRegistrar({ scopeSelector = '.lw-writer-surface' }) {
  useEffect(() => {
    const handler = (bookId, chapterId, range) => {
      try {
        const scope = document.querySelector(scopeSelector);
        const ta = scope?.querySelector('textarea');
        if (!ta) return false;
        const [start, end] = Array.isArray(range) ? range : [range, range];
        if (typeof start !== 'number' || start < 0) return false;
        // Defer a tick so any chapter-swap render finishes first.
        setTimeout(() => {
          try {
            ta.focus({ preventScroll: true });
            ta.setSelectionRange(start, end || start);
            // Scroll so the selection is vertically centered.
            const approxLine = ta.value.slice(0, start).split('\n').length;
            const totalLines = Math.max(1, ta.value.split('\n').length);
            const targetScroll = Math.max(0, ta.scrollHeight * (approxLine / totalLines) - ta.clientHeight / 2);
            ta.scrollTop = targetScroll;
          } catch (_e) { /* noop */ }
        }, 120);
        return true;
      } catch (e) {
        console.warn('[WriterSeekRegistrar] seek failed:', e);
        return false;
      }
    };
    chapterNavigationService.setSeekHandler?.(handler);
    return () => {
      // Leave the handler in place; a future registrar will overwrite it.
    };
  }, [scopeSelector]);
  return null;
}

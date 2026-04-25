// Loomwright — prose editor (plan §7). Contenteditable + paragraph-block model.
// Cursor preservation via saved range + useLayoutEffect (plan Appendix A.1).

import React from 'react';
import { useTheme } from '../theme';
import { useStore, rid, wordCount } from '../store';
import { useSelection } from '../selection';
import { MIME, dragProseSnippet, readDrop } from '../drag';

function parseParagraphsFromDOM(root) {
  if (!root) return [];
  const out = [];
  for (const node of root.children) {
    const id = node.dataset.paragraphId || rid('p');
    const text = node.textContent || '';
    out.push({ id, text, state: 'written' });
  }
  return out;
}

function renderParagraphsToHTML(paragraphs) {
  if (!paragraphs?.length) return '';
  return paragraphs.map(p => `<p data-paragraph-id="${p.id}">${escapeHtml(p.text)}</p>`).join('');
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function saveSelection(root) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return null;
  // Preserve as { paragraphIndex, offset } so we survive re-render.
  let pIdx = -1, offset = 0;
  let cur = range.startContainer;
  while (cur && cur.parentNode !== root) cur = cur.parentNode;
  if (!cur) return null;
  pIdx = Array.prototype.indexOf.call(root.children, cur);
  // Compute offset within the paragraph's text.
  const walker = document.createTreeWalker(cur, NodeFilter.SHOW_TEXT, null);
  let node, pos = 0;
  while ((node = walker.nextNode())) {
    if (node === range.startContainer) { offset = pos + range.startOffset; break; }
    pos += node.textContent.length;
  }
  if (!node) offset = pos;
  return { pIdx, offset };
}

function restoreSelection(root, saved) {
  if (!saved || saved.pIdx < 0) return;
  const p = root.children[saved.pIdx];
  if (!p) return;
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);
  let node, pos = 0;
  while ((node = walker.nextNode())) {
    const len = node.textContent.length;
    if (pos + len >= saved.offset) {
      const r = document.createRange();
      r.setStart(node, Math.max(0, saved.offset - pos));
      r.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
    pos += len;
  }
  // Fallback: place at end of paragraph.
  const r = document.createRange();
  r.selectNodeContents(p);
  r.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges(); sel.addRange(r);
}

export default function Editor({ onContextMenu }) {
  const t = useTheme();
  const store = useStore();
  const { sel } = useSelection();
  const ref = React.useRef(null);
  const savedRange = React.useRef(null);
  const debouncedSave = React.useRef(null);

  const activeId = store.ui?.activeChapterId || store.book?.currentChapterId;
  const chapter = activeId ? store.chapters?.[activeId] : null;
  const paragraphs = chapter?.paragraphs || (chapter?.text
    ? chapter.text.split(/\n\n+/).map(text => ({ id: rid('p'), text, state: 'written' }))
    : [{ id: rid('p'), text: '', state: 'draft' }]);

  // Render HTML on chapter change.
  const lastChapterId = React.useRef(null);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    if (lastChapterId.current === activeId) return;
    ref.current.innerHTML = renderParagraphsToHTML(paragraphs);
    lastChapterId.current = activeId;
  }, [activeId, paragraphs.length]);

  // Save selection before each potential re-render, restore after.
  const onInput = React.useCallback(() => {
    savedRange.current = saveSelection(ref.current);
    clearTimeout(debouncedSave.current);
    debouncedSave.current = setTimeout(() => {
      if (!ref.current || !activeId) return;
      const next = parseParagraphsFromDOM(ref.current);
      const text = next.map(p => p.text).join('\n\n');
      const wc = wordCount(text);
      const prevText = chapter?.text || '';
      const prevWc = wordCount(prevText);
      const delta = Math.max(0, wc - prevWc);
      store.setSlice('chapters', ch => ({
        ...ch,
        [activeId]: { ...ch[activeId], text, paragraphs: next, lastEdit: Date.now() },
      }));
      if (delta > 0) {
        store.setSlice('book', b => ({ ...b, wordsToday: (b.wordsToday || 0) + delta }));
      }
    }, 1200);
  }, [activeId, chapter?.text, store]);

  React.useLayoutEffect(() => {
    if (savedRange.current && ref.current) restoreSelection(ref.current, savedRange.current);
  });

  const onCtxMenu = (e) => {
    e.preventDefault();
    const sel = window.getSelection();
    const text = sel?.toString() || '';
    onContextMenu?.({ x: e.clientX, y: e.clientY, text });
  };

  const onDragStart = (e) => {
    const sel = window.getSelection();
    const text = sel?.toString() || '';
    if (text && activeId) dragProseSnippet(e, activeId, null, text);
  };

  const onDrop = (e) => {
    if (!e.dataTransfer.types.includes(MIME.ENTITY)) return;
    e.preventDefault();
    const data = readDrop(e, MIME.ENTITY);
    if (!data) return;
    let label = data.id;
    if (data.kind === 'character') {
      const c = (store.cast || []).find(x => x.id === data.id);
      if (c) label = c.name;
    } else if (data.kind === 'place') {
      const p = (store.places || []).find(x => x.id === data.id);
      if (p) label = p.name;
    }
    const sel2 = window.getSelection();
    if (sel2?.rangeCount) {
      const r = sel2.getRangeAt(0);
      r.deleteContents();
      r.insertNode(document.createTextNode(label));
      r.collapse(false);
    }
    onInput();
  };
  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes(MIME.ENTITY)) e.preventDefault();
  };

  return (
    <article
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={onInput}
      onContextMenu={onCtxMenu}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      style={{
        maxWidth: 720, margin: '40px auto', padding: '0 40px',
        fontFamily: t.display, fontSize: 17, lineHeight: 1.7, color: t.ink,
        outline: 'none', minHeight: 'calc(100vh - 160px)',
      }}
    />
  );
}

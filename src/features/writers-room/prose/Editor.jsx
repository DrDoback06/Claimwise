// Loomwright — prose editor (plan §7). Contenteditable + paragraph-block model.
// Cursor preservation via saved range + useLayoutEffect (plan Appendix A.1).

import React from 'react';
import { useTheme } from '../theme';
import { useStore, rid, wordCount } from '../store';
import { useSelection } from '../selection';
import { MIME, dragProseSnippet, readDrop } from '../drag';
import { decorateText, buildKnownEntities } from './highlights';
import { characterById } from '../store/selectors';
import { localProofread } from '../utilities/proofread';
import MentionPicker from './MentionPicker';
import aiService from '../../../services/aiService';

function parseParagraphsFromDOM(root) {
  if (!root) return [];
  const out = [];
  for (const node of root.children) {
    const id = node.dataset.paragraphId || rid('p');
    if (!node.dataset.paragraphId) node.dataset.paragraphId = id;
    const text = node.textContent || '';
    out.push({ id, text, state: 'written' });
  }
  return out;
}

function renderParagraphsToHTML(paragraphs, knownEntities) {
  if (!paragraphs?.length) return '';
  return paragraphs.map(p => {
    const decorated = knownEntities?.length ? decorateText(p.text, knownEntities) : null;
    const inner = decorated || escapeHtml(p.text);
    return `<p data-paragraph-id="${p.id}">${inner}</p>`;
  }).join('');
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// In-place squiggle wrapping: walk text nodes inside `paragraph`, replace
// the first occurrence of each known proofread `quote` with a span. We do
// not nest into existing wrappers (so entity spans stay clean).
function wrapProofIssuesInPlace(paragraph, proofMap) {
  // First strip any stale squiggle spans we previously placed.
  unwrapProofIssues(paragraph);
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      // Skip text inside an entity span or an existing proof span.
      if (n.parentElement?.closest('[data-lw-proof-issue], [data-lw-entity-id]')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  for (const node of nodes) {
    let text = node.nodeValue;
    for (const [quote, info] of proofMap) {
      const idx = text.indexOf(quote);
      if (idx < 0) continue;
      const before = text.slice(0, idx);
      const after = text.slice(idx + quote.length);
      const span = document.createElement('span');
      span.setAttribute('data-lw-proof-issue', '1');
      span.setAttribute('data-lw-proof-kind', info.kind || 'spelling');
      span.setAttribute('title', info.label || 'Issue');
      span.textContent = quote;
      const beforeNode = document.createTextNode(before);
      const afterNode = document.createTextNode(after);
      const parent = node.parentNode;
      parent.insertBefore(beforeNode, node);
      parent.insertBefore(span, node);
      parent.insertBefore(afterNode, node);
      parent.removeChild(node);
      // Restart with the trailing text node so we don't infinite-loop.
      return wrapProofIssuesInPlace(paragraph, proofMap);
    }
  }
}

function unwrapProofIssues(paragraph) {
  const spans = paragraph.querySelectorAll('[data-lw-proof-issue]');
  for (const s of spans) {
    const parent = s.parentNode;
    while (s.firstChild) parent.insertBefore(s.firstChild, s);
    parent.removeChild(s);
    parent.normalize();
  }
}

function saveSelection(root) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return null;
  let cur = range.startContainer;
  while (cur && cur.parentNode !== root) cur = cur.parentNode;
  if (!cur) return null;
  const pIdx = Array.prototype.indexOf.call(root.children, cur);
  const walker = document.createTreeWalker(cur, NodeFilter.SHOW_TEXT, null);
  let node, pos = 0, offset = 0;
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
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      return;
    }
    pos += len;
  }
  const r = document.createRange();
  r.selectNodeContents(p);
  r.collapse(false);
  const s = window.getSelection();
  s.removeAllRanges(); s.addRange(r);
}

export default function Editor({ onContextMenu, onParagraphMeasure }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const tweaks = store.ui?.tweaks || {};
  const focusChar = sel.character ? characterById(store, sel.character) : null;
  const ref = React.useRef(null);
  const savedRange = React.useRef(null);
  const debouncedSave = React.useRef(null);
  const isUserTyping = React.useRef(false);

  const activeId = store.ui?.activeChapterId || store.book?.currentChapterId;
  const chapter = activeId ? store.chapters?.[activeId] : null;
  const known = React.useMemo(() => buildKnownEntities(store, t), [store.cast, store.places, store.items, t.mode]);

  const paragraphs = chapter?.paragraphs || (chapter?.text
    ? chapter.text.split(/\n\n+/).map(text => ({ id: rid('p'), text, state: 'written' }))
    : [{ id: rid('p'), text: '', state: 'draft' }]);

  // Render HTML on chapter change OR when known entities change AND user not actively typing.
  const lastChapterId = React.useRef(null);
  const lastKnownHash = React.useRef('');
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const knownHash = known.map(e => `${e._kind}:${e.id}:${e.name}`).join('|');
    const chapterChanged = lastChapterId.current !== activeId;
    const knownChanged = lastKnownHash.current !== knownHash;
    if (!chapterChanged && !knownChanged) return;
    if (isUserTyping.current && !chapterChanged) return; // don't blow away cursor mid-keystroke
    savedRange.current = saveSelection(ref.current);
    ref.current.innerHTML = renderParagraphsToHTML(paragraphs, known);
    if (savedRange.current) restoreSelection(ref.current, savedRange.current);
    lastChapterId.current = activeId;
    lastKnownHash.current = knownHash;
    onParagraphMeasure?.();
  }, [activeId, paragraphs.length, known, onParagraphMeasure]);

  // Per-paragraph voice / spotlight ribbon + inline proofread squiggles.
  // Runs after every render that matters (selection changes, chapter changes).
  // Decorates the host paragraphs without disturbing the cursor.
  React.useEffect(() => {
    if (!ref.current) return;
    const showVoice = tweaks.showVoiceRibbon === true;
    const showSpotlight = tweaks.highlightMargin !== false;
    const showProof = tweaks.showProofIssues !== false;
    const focusName = focusChar?.name?.toLowerCase();
    const focusAliases = (focusChar?.aliases || []).map(a => a.toLowerCase());
    const focusColor = focusChar?.color;

    // Quote → kind (for proofread squiggles).
    let proofMap = null;
    if (showProof && !isUserTyping.current) {
      const text = paragraphs.map(p => p.text).join('\n\n');
      const issues = localProofread(text);
      if (issues.length) {
        proofMap = new Map();
        for (const i of issues) {
          if (!proofMap.has(i.quote)) proofMap.set(i.quote, { kind: i.kind, label: i.label });
        }
      }
    }

    for (const p of ref.current.children) {
      const text = (p.textContent || '').toLowerCase();
      let mark = false;
      if (focusName && text.includes(focusName)) mark = true;
      if (!mark) for (const a of focusAliases) if (a && text.includes(a)) { mark = true; break; }

      if (showSpotlight && mark) p.dataset.lwSpotlight = 'true';
      else delete p.dataset.lwSpotlight;

      if (showVoice && focusColor && mark) {
        p.dataset.lwVoiceColor = '1';
        p.style.setProperty('--lw-voice-color', focusColor);
      } else {
        delete p.dataset.lwVoiceColor;
        p.style.removeProperty('--lw-voice-color');
      }

      if (proofMap && proofMap.size) {
        wrapProofIssuesInPlace(p, proofMap);
      } else {
        // Strip stale squiggles only if user toggled off / nothing matched.
        unwrapProofIssues(p);
      }
    }
  });

  // Listen for accepted suggestions and inject as staged spans at the cursor.
  // CODE-INSIGHT §3.B.3 — Caveat font + ochre ink + left bracket while staged.
  React.useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      const body = detail.body || '';
      const sgId = detail.suggestionId || '';
      if (!ref.current || !body) return;
      ref.current.focus();
      const sel = window.getSelection();
      let range = sel?.rangeCount ? sel.getRangeAt(0) : null;
      // If selection isn't inside the editor, append at end.
      if (!range || !ref.current.contains(range.startContainer)) {
        const last = ref.current.lastElementChild || ref.current;
        range = document.createRange();
        range.selectNodeContents(last);
        range.collapse(false);
      }
      const span = document.createElement('span');
      span.className = 'lw-staged-suggestion';
      span.setAttribute('data-staged', 'true');
      if (sgId) span.setAttribute('data-suggestion-id', sgId);
      span.textContent = ' ' + body + ' ';
      range.insertNode(span);
      // Cursor goes after the inserted span so further typing is normal prose.
      const after = document.createRange();
      after.setStartAfter(span);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);
      onInput();
    };
    window.addEventListener('lw:insert-staged', handler);
    return () => window.removeEventListener('lw:insert-staged', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Promote staged spans to manuscript font once the writer edits inside them.
  const onBeforeInput = React.useCallback((e) => {
    const span = e.target?.closest?.('[data-staged="true"]')
      || (window.getSelection()?.anchorNode?.parentElement?.closest?.('[data-staged="true"]'));
    if (span) {
      span.removeAttribute('data-staged');
      span.classList.remove('lw-staged-suggestion');
    }
  }, []);

  const onInput = React.useCallback(() => {
    isUserTyping.current = true;
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
      isUserTyping.current = false;
      onParagraphMeasure?.();
    }, 1200);
  }, [activeId, chapter?.text, store, onParagraphMeasure]);

  // Hard flush — runs the save immediately. Used for blur, visibility
  // change, beforeunload, and chapter swap to prevent prose loss when
  // the writer navigates away mid-debounce.
  const flushSave = React.useCallback(() => {
    if (!ref.current || !activeId) return;
    clearTimeout(debouncedSave.current);
    debouncedSave.current = null;
    const next = parseParagraphsFromDOM(ref.current);
    const text = next.map(p => p.text).join('\n\n');
    if (text === (chapter?.text || '')) return;
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
    isUserTyping.current = false;
  }, [activeId, chapter?.text, store]);

  // Wire flush to every "user is leaving" signal.
  React.useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'hidden') flushSave(); };
    const onBeforeUnload = () => { flushSave(); };
    const onPageHide = () => { flushSave(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
      // Final flush on unmount (also covers chapter swap).
      flushSave();
    };
  }, [flushSave]);

  // Flush whenever the active chapter changes — guarantees the previous
  // chapter's pending text lands before we render the new one.
  const lastActiveIdRef = React.useRef(activeId);
  React.useEffect(() => {
    if (lastActiveIdRef.current && lastActiveIdRef.current !== activeId) {
      // Use the stale flush; the close-over still references the old chapter.
      flushSave();
    }
    lastActiveIdRef.current = activeId;
  }, [activeId, flushSave]);

  const onBlurFlush = () => flushSave();

  const onCtxMenu = (e) => {
    // Plain right-click: let the browser show its native context menu so
    // the writer can fix spelling, copy/paste, look up, etc.
    // Ctrl / Cmd / Shift + right-click summons the Loomwright radial.
    if (!(e.ctrlKey || e.metaKey || e.shiftKey)) return;
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
    const label = resolveEntityLabel(store, data);
    const choice = window.prompt(
      `Drop action for ${label}:\n` +
      '1 = Write a new paragraph\n' +
      '2 = Include in last paragraph\n' +
      '3 = Include in this paragraph\n' +
      '4 = Include in next paragraph',
      '3'
    );
    const mode = String(choice || '3').trim();
    const hostParagraph = e.target?.closest?.('[data-paragraph-id]') || null;
    injectEntityParagraph({ ref, label, mode, hostParagraph, store, chapter: activeId, onInput });
  };

  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes(MIME.ENTITY)) e.preventDefault();
  };

  // Click on entity span → spotlight. Also picks up @-mention spans.
  const onClick = (e) => {
    const mention = e.target.closest('[data-lw-mention]');
    if (mention) {
      e.preventDefault();
      const kind = mention.getAttribute('data-lw-mention-kind');
      const id = mention.getAttribute('data-lw-mention-id');
      if (kind && id) select(kind, id);
      return;
    }
    const span = e.target.closest('[data-lw-entity-id]');
    if (!span) return;
    e.preventDefault();
    const kind = span.getAttribute('data-lw-entity-kind');
    const id = span.getAttribute('data-lw-entity-id');
    if (kind && id) select(kind, id);
  };

  return (
    <>
      <article
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck={true}
        onBeforeInput={onBeforeInput}
        onInput={onInput}
        onBlur={onBlurFlush}
        onClick={onClick}
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
      <MentionPicker editorRef={ref} />
    </>
  );
}

function resolveEntityLabel(store, data) {
  if (!data?.id) return 'entity';
  const map = {
    character: store.cast || [],
    place: store.places || [],
    item: store.items || [],
    quest: store.quests || [],
    skill: store.skills || [],
  };
  const arr = map[data.kind] || [];
  const hit = arr.find(x => x.id === data.id);
  return hit?.name || hit?.title || data.id;
}

async function injectEntityParagraph({ ref, label, mode, hostParagraph, store, chapter, onInput }) {
  const root = ref.current;
  if (!root) return;
  const makeParagraph = async () => {
    const fallback = `【${label}】 enters the scene, reshaping the moment with immediate consequence.`;
    try {
      const prompt = `Write one short prose paragraph (40-80 words) that naturally includes this entity: ${label}. Return plain text only.`;
      const raw = await aiService.callAI(prompt, 'creative', null, { useCache: false });
      const text = String(raw || '').replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
      return text || fallback;
    } catch {
      return fallback;
    }
  };

  const text = await makeParagraph();
  const p = document.createElement('p');
  p.dataset.paragraphId = `p_${Date.now().toString(36)}`;
  p.textContent = text;
  p.style.outline = '1px dashed rgba(212,146,82,0.7)';
  p.style.outlineOffset = '2px';
  setTimeout(() => {
    p.style.outline = '';
    p.style.outlineOffset = '';
  }, 2200);

  const paragraphs = [...root.children];
  const hostIdx = hostParagraph ? paragraphs.indexOf(hostParagraph) : -1;
  if (mode === '1' || hostIdx < 0) {
    root.appendChild(p);
  } else if (mode === '2') {
    const target = paragraphs[Math.max(0, hostIdx - 1)] || paragraphs[paragraphs.length - 1];
    if (target) target.textContent = `${target.textContent || ''} ${text}`.trim();
    else root.appendChild(p);
  } else if (mode === '4') {
    const after = paragraphs[Math.min(paragraphs.length - 1, hostIdx + 1)];
    if (after) after.insertAdjacentElement('afterend', p);
    else root.appendChild(p);
  } else {
    const target = paragraphs[hostIdx] || null;
    if (target) target.textContent = `${target.textContent || ''} ${text}`.trim();
    else root.appendChild(p);
  }
  onInput?.();
  try { store.setPath('ui.activeChapterId', chapter); } catch {}
}

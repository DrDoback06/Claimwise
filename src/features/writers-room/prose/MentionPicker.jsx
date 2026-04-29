// Loomwright — @-mention micro-cards (CODE-INSIGHT §1.B.9 / §12.1).
// Unified `@` syntax with optional qualifier: @Tom, @loc:Riverside,
// @item:watch, @thread:revenge.
//
// Listens for `@` in the editor, shows a small picker near the caret. Picking
// inserts a `<span data-lw-mention>` carrying kind + id. Clicking the span
// later sets the selection bus.

import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { useSelection } from '../selection';

const QUALIFIERS = {
  '': 'character', 'char': 'character',
  'loc': 'place', 'place': 'place',
  'item': 'item',
  'thread': 'thread',
  'chapter': 'chapter',
};

function searchEntities(store, kind, query) {
  const q = query.toLowerCase();
  const list = kind === 'character' ? store.cast
    : kind === 'place' ? store.places
    : kind === 'item' ? store.items
    : kind === 'thread' ? store.quests
    : kind === 'chapter' ? Object.values(store.chapters || {})
    : [];
  return (list || [])
    .map(e => ({ ...e, _label: e.name || e.title || '' }))
    .filter(e => e._label && e._label.toLowerCase().includes(q))
    .slice(0, 8);
}

export default function MentionPicker({ editorRef }) {
  const t = useTheme();
  const store = useStore();
  const { select } = useSelection();
  const [open, setOpen] = React.useState(null); // { kind, query, x, y, range }
  const [highlight, setHighlight] = React.useState(0);

  // Listen for keystrokes inside the editor; on `@`, capture the position.
  React.useEffect(() => {
    const root = editorRef?.current;
    if (!root) return;

    let probeTimer = null;
    const probe = () => {
      const sel = window.getSelection();
      if (!sel?.rangeCount) { setOpen(null); return; }
      const range = sel.getRangeAt(0);
      if (!root.contains(range.startContainer)) { setOpen(null); return; }
      const node = range.startContainer;
      const offset = range.startOffset;
      if (node.nodeType !== Node.TEXT_NODE) { setOpen(null); return; }
      const text = node.nodeValue.slice(0, offset);
      const at = text.lastIndexOf('@');
      if (at < 0) { setOpen(null); return; }
      const tail = text.slice(at + 1);
      // Don't fire for spaces or newlines
      if (/\s/.test(tail)) { setOpen(null); return; }

      // Parse qualifier:query
      let qualifier = '';
      let query = tail;
      const colon = tail.indexOf(':');
      if (colon >= 0) {
        const q = tail.slice(0, colon);
        if (QUALIFIERS[q]) { qualifier = q; query = tail.slice(colon + 1); }
      }
      const kind = QUALIFIERS[qualifier] || 'character';

      // Position the picker just below the caret.
      const r2 = range.cloneRange();
      r2.collapse(true);
      const rect = r2.getClientRects()[0] || range.getBoundingClientRect();
      setOpen({
        kind, query, qualifier,
        x: rect.left, y: rect.bottom + 4,
        atOffset: at,
        node,
      });
      setHighlight(0);
    };

    const onInput = () => { clearTimeout(probeTimer); probeTimer = setTimeout(probe, 60); };
    const onSelChange = () => { clearTimeout(probeTimer); probeTimer = setTimeout(probe, 60); };
    root.addEventListener('input', onInput);
    document.addEventListener('selectionchange', onSelChange);
    return () => {
      root.removeEventListener('input', onInput);
      document.removeEventListener('selectionchange', onSelChange);
      clearTimeout(probeTimer);
    };
  }, [editorRef]);

  const matches = open ? searchEntities(store, open.kind, open.query) : [];

  // Keyboard: arrows + enter to pick.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(matches.length - 1, h + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(0, h - 1)); }
      else if (e.key === 'Enter' && matches[highlight]) {
        e.preventDefault();
        pick(matches[highlight]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(null);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, matches, highlight]);

  const pick = (entity) => {
    if (!open) return;
    const { node, atOffset, kind } = open;
    // Find the current end of the @<text> token.
    const sel = window.getSelection();
    if (!sel?.rangeCount) { setOpen(null); return; }
    const caretRange = sel.getRangeAt(0);
    if (caretRange.startContainer !== node) { setOpen(null); return; }
    const endOffset = caretRange.startOffset;
    const range = document.createRange();
    range.setStart(node, atOffset);
    range.setEnd(node, endOffset);
    range.deleteContents();

    const span = document.createElement('span');
    span.className = 'lw-mention';
    span.setAttribute('data-lw-mention', '1');
    span.setAttribute('data-lw-mention-kind', kind);
    span.setAttribute('data-lw-mention-id', entity.id);
    span.textContent = '@' + (entity.name || entity.title || entity.id);
    range.insertNode(span);

    // Caret after the span.
    const after = document.createRange();
    after.setStartAfter(span);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);

    // Select the entity in the bus.
    select(kind, entity.id);

    setOpen(null);
    // Trigger an input event so the host editor saves.
    span.parentElement?.dispatchEvent(new Event('input', { bubbles: true }));
  };

  if (!open || matches.length === 0) return null;

  return (
    <div role="listbox" style={{
      position: 'fixed', left: open.x, top: open.y, zIndex: 4500,
      width: 260, maxHeight: 300, overflowY: 'auto',
      background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 4,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      animation: 'lw-card-in 120ms ease-out',
    }}>
      <div style={{
        padding: '6px 10px', borderBottom: `1px solid ${t.rule}`,
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>@ {open.kind}</span>
        <span>↑↓ ↵</span>
      </div>
      {matches.map((m, i) => (
        <button key={m.id} onMouseDown={(e) => { e.preventDefault(); pick(m); }} style={{
          display: 'flex', width: '100%', alignItems: 'center', gap: 8,
          padding: '6px 10px',
          background: i === highlight ? t.paper2 : 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: m.color || t.accent, color: t.onAccent,
            display: 'grid', placeItems: 'center',
            fontFamily: t.display, fontWeight: 500, fontSize: 11,
          }}>{(m._label || '?')[0]?.toUpperCase()}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: t.display, fontSize: 13, color: t.ink,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{m._label}</div>
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.12, textTransform: 'uppercase',
            }}>{m.role || m.kind || open.kind}</div>
          </span>
        </button>
      ))}
    </div>
  );
}

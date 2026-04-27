// Loomwright — shared horizontal chapter strip. Replaces the bare-dot
// scrubber on the top bar and the range-input scrubber inside actor /
// atlas. Numbered, fixed-size pills; horizontally scrollable; never wraps;
// the active pill auto-scrolls into view.
//
// Two modes:
//   • mode='jump'  — clicking a pill commits the active chapter globally
//                    (used by the TopBar — flips currentChapterId).
//   • mode='scrub' — clicking a pill emits onChange but does NOT touch
//                    the global active-chapter state (used by Dossier /
//                    Atlas to time-travel the panel without disturbing
//                    the editor's current chapter).

import React from 'react';
import { useTheme } from '../theme';
import { useStore, createChapter, removeChapter } from '../store';

export default function ChapterStrip({
  mode = 'jump',          // 'jump' | 'scrub'
  value,                   // current chapterId (controlled)
  onChange,                // (chapterId) => void
  label,                   // optional left-label e.g. "As of"
  accent,                  // active-pill colour (defaults to theme accent)
}) {
  const t = useTheme();
  const store = useStore();
  const order = store.book?.chapterOrder || [];
  const chapters = store.chapters || {};
  const activeId = value || store.ui?.activeChapterId || store.book?.currentChapterId;
  const activeIdx = order.indexOf(activeId);
  const activeAccent = accent || t.accent;

  const stripRef = React.useRef(null);
  const itemRefs = React.useRef({});
  const [hover, setHover] = React.useState(null); // { idx, ch, x, y }
  const [metaOpenId, setMetaOpenId] = React.useState(null);

  // Auto-scroll the active pill into view whenever it changes.
  React.useEffect(() => {
    const el = itemRefs.current[activeId];
    if (!el || !stripRef.current) return;
    el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeId]);

  if (!order.length) {
    return label ? (
      <div style={{ ...frame(t), justifyContent: 'flex-start' }}>
        <span style={labelStyle(t)}>{label}</span>
        <span style={{ fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic' }}>
          no chapters yet
        </span>
      </div>
    ) : null;
  }

  const handlePick = (id) => {
    if (mode === 'jump') {
      store.setPath('ui.activeChapterId', id);
      store.setPath('book.currentChapterId', id);
    }
    onChange?.(id);
  };

  const addChapter = () => {
    let id = null;
    store.transaction(({ setSlice }) => {
      id = createChapter({ setSlice, book: store.book }, {});
    });
    if (id) handlePick(id);
  };

  return (
    <div style={frame(t)}>
      {label && <span style={labelStyle(t)}>{label}</span>}
      <div
        ref={stripRef}
        style={{
          flex: 1, minWidth: 0, display: 'flex', alignItems: 'center',
          gap: 4, overflowX: 'auto', overflowY: 'hidden',
          padding: '2px 4px',
          scrollbarWidth: 'thin',
          // Hide native scrollbar visually but keep wheel/touch scroll.
          msOverflowStyle: 'none',
        }}>
        {order.map((id, i) => {
          const ch = chapters[id];
          if (!ch) return null;
          const isActive = i === activeIdx;
          const wc = (ch?.text || '').trim().match(/\S+/g)?.length || 0;
          return (
            <button
              key={id}
              ref={el => { if (el) itemRefs.current[id] = el; else delete itemRefs.current[id]; }}
              onClick={() => handlePick(id)}
              onDoubleClick={() => setMetaOpenId(id)}
              onMouseEnter={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setHover({ idx: i, ch, wc, x: r.left + r.width / 2, y: r.bottom + 4 });
              }}
              onMouseLeave={() => setHover(null)}
              style={{
                flex: '0 0 auto',
                minWidth: 24, height: 24, padding: '0 6px',
                borderRadius: 999,
                background: isActive ? activeAccent : 'transparent',
                color: isActive ? t.onAccent : t.ink2,
                border: `1px solid ${isActive ? activeAccent : t.rule}`,
                cursor: 'pointer',
                fontFamily: t.mono, fontSize: 10, fontWeight: isActive ? 600 : 400,
                letterSpacing: 0.08,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 160ms, border-color 160ms, color 160ms',
              }}>
              {ch.n ?? (i + 1)}
            </button>
          );
        })}
        <button
          onClick={addChapter}
          title="Add chapter"
          style={{
            flex: '0 0 auto',
            minWidth: 24, height: 24, padding: '0 6px',
            borderRadius: 999,
            background: 'transparent',
            color: t.accent,
            border: `1px dashed ${t.accent}`,
            cursor: 'pointer',
            fontFamily: t.mono, fontSize: 12, letterSpacing: 0.08,
          }}>+</button>
      </div>
      {hover && (
        <div style={{
          position: 'fixed',
          left: hover.x, top: hover.y, transform: 'translateX(-50%)',
          padding: '6px 10px',
          background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)', whiteSpace: 'nowrap',
          zIndex: 100, pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>ch.{hover.ch.n} · {hover.wc} words</div>
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, marginTop: 2 }}>
            {hover.ch.title || `Chapter ${hover.ch.n}`}
          </div>
          {hover.ch.lastEdit && (
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, marginTop: 2 }}>
              edited {timeAgo(hover.ch.lastEdit)}
            </div>
          )}
        </div>
      )}
      {metaOpenId && (
        <ChapterMetaModal
          chapter={chapters[metaOpenId]}
          index={order.indexOf(metaOpenId)}
          onClose={() => setMetaOpenId(null)}
          onDelete={() => {
            const id = metaOpenId;
            if (!id) return;
            if (!window.confirm('Move this chapter to trash?')) return;
            const doomed = chapters[id];
            if (doomed) {
              store.setSlice('trash', xs => ([...(xs || []), {
                id: `trash_${Date.now()}`,
                kind: 'chapter',
                payload: doomed,
                deletedAt: Date.now(),
              }]));
            }
            removeChapter(store, id);
            setMetaOpenId(null);
          }}
          onSave={(patch) => {
            const id = metaOpenId;
            store.setSlice('chapters', chs => ({
              ...(chs || {}),
              [id]: { ...(chs?.[id] || {}), ...patch },
            }));
            setMetaOpenId(null);
          }}
        />
      )}
    </div>
  );
}

function ChapterMetaModal({ chapter, index, onClose, onSave, onDelete }) {
  const t = useTheme();
  const [title, setTitle] = React.useState(chapter?.title || `Chapter ${index + 1}`);
  const [color, setColor] = React.useState(chapter?.color || '#8b2b1f');
  const [notes, setNotes] = React.useState(chapter?.notes || '');
  const [todo, setTodo] = React.useState(chapter?.todo || []);
  const [todoInput, setTodoInput] = React.useState('');
  if (!chapter) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 3600,
      display: 'grid', placeItems: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(92vw, 620px)', maxHeight: '88vh', overflowY: 'auto',
        background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 4, padding: 16,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} style={{
            flex: 1, fontFamily: t.display, fontSize: 20, border: 'none', outline: 'none',
            background: 'transparent', color: t.ink,
          }} />
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: 28, height: 28, padding: 0, border: 'none', background: 'transparent' }} />
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>
          Chapter {chapter.n || index + 1} · double-click chapter pills to edit
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} style={{
            width: '100%', padding: '8px 10px', fontFamily: t.display, fontSize: 13, border: `1px solid ${t.rule}`, background: t.paper2,
          }} />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, textTransform: 'uppercase', marginBottom: 4 }}>To-do</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={todoInput} onChange={e => setTodoInput(e.target.value)} placeholder="Add checklist item"
              style={{ flex: 1, padding: '6px 8px', border: `1px solid ${t.rule}`, background: t.paper2 }} />
            <button onClick={() => {
              if (!todoInput.trim()) return;
              setTodo(xs => [...xs, { id: `todo_${Date.now()}`, text: todoInput.trim(), done: false }]);
              setTodoInput('');
            }} style={{ padding: '6px 10px', border: `1px solid ${t.accent}`, color: t.accent, background: 'transparent' }}>+ Add</button>
          </div>
          <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
            {todo.map(x => (
              <label key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!x.done}
                  onChange={e => setTodo(rows => rows.map(r => r.id === x.id ? { ...r, done: e.target.checked } : r))} />
                <input value={x.text} onChange={e => setTodo(rows => rows.map(r => r.id === x.id ? { ...r, text: e.target.value } : r))}
                  style={{ flex: 1, padding: '4px 6px', border: `1px solid ${t.rule}`, background: t.paper2 }} />
                <button onClick={() => setTodo(rows => rows.filter(r => r.id !== x.id))}
                  style={{ border: 'none', background: 'transparent', color: t.ink3, cursor: 'pointer' }}>×</button>
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
          <button onClick={onDelete} style={{ padding: '6px 10px', border: `1px solid ${t.bad || '#b33'}`, color: t.bad || '#b33', background: 'transparent' }}>Move to trash</button>
          <span style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: '6px 10px', border: `1px solid ${t.rule}`, background: 'transparent' }}>Cancel</button>
          <button onClick={() => onSave({ title, color, notes, todo })} style={{ padding: '6px 12px', border: 'none', background: t.accent, color: t.onAccent }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function frame(t) {
  return {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 8px',
    background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 4,
    minWidth: 0,
  };
}

function labelStyle(t) {
  return {
    flex: '0 0 auto',
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.16, textTransform: 'uppercase',
  };
}

function timeAgo(ms) {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return Math.round(diff / 60_000) + 'm ago';
  if (diff < 86_400_000) return Math.round(diff / 3600_000) + 'h ago';
  return Math.round(diff / 86_400_000) + 'd ago';
}

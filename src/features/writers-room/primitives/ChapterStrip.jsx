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
import { useStore } from '../store';

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

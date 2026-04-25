// Loomwright — TopBar with chapter scrubber (plan §6).

import React from 'react';
import { useTheme } from './theme';
import { useStore } from './store';
import Icon from './entities/Icon';
import ReadAloud from './utilities/ReadAloud';

export default function TopBar({ onOpenPalette, onToggleFocus, focusMode, onOpenSettings, onOpenBible, onOpenHistory }) {
  const t = useTheme();
  const store = useStore();
  const { book } = store;

  const order = book?.chapterOrder || [];
  const activeId = store.ui?.activeChapterId || book?.currentChapterId;
  const activeIdx = order.indexOf(activeId);
  const activeCh = activeId ? store.chapters?.[activeId] : null;

  const jump = (idx) => {
    const id = order[idx];
    if (!id) return;
    store.setPath('ui.activeChapterId', id);
    store.setPath('book.currentChapterId', id);
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target?.matches('input, textarea, [contenteditable="true"]')) return;
      if (e.key === '[') jump(Math.max(0, activeIdx - 1));
      if (e.key === ']') jump(Math.min(order.length - 1, activeIdx + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIdx, order.length]);

  return (
    <header className="lw-topbar" style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '8px 16px', borderBottom: `1px solid ${t.rule}`,
      background: t.paper, height: 48,
    }}>
      {book.series && (
        <span style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.16, textTransform: 'uppercase',
        }}>{book.series}</span>
      )}
      <span style={{
        fontFamily: t.display, fontSize: 16, color: t.ink, fontWeight: 500,
      }}>{book.title || 'Untitled'}</span>
      {activeCh && <span style={{
        fontFamily: t.mono, fontSize: 11, color: t.ink2, letterSpacing: 0.1,
      }}>· ch.{activeCh.n} {activeCh.title}</span>}

      <ChapterScrubber order={order} activeIdx={activeIdx} jump={jump} t={t} chapters={store.chapters || {}} />
      <div style={{ flex: 1 }} />

      <button onClick={onOpenPalette} style={{
        padding: '5px 10px', background: 'transparent',
        border: `1px solid ${t.rule}`, borderRadius: 14,
        fontFamily: t.display, fontSize: 11, color: t.ink3,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Icon name="search" size={11} color={t.ink3} />
        Ask the Loom… <span style={{ fontFamily: t.mono, fontSize: 9 }}>⌘K</span>
      </button>

      <ReadAloud />

      {onOpenHistory && (
        <button title="Version history" onClick={onOpenHistory} className="lw-rail-btn"
          style={{ width: 32, height: 32, borderColor: 'transparent', color: t.ink2 }}>
          <Icon name="book" size={14} color={t.ink2} />
        </button>
      )}
      {onOpenBible && (
        <button title="Series bible" onClick={onOpenBible} className="lw-rail-btn"
          style={{ width: 32, height: 32, borderColor: 'transparent', color: t.ink2 }}>
          <Icon name="building" size={14} color={t.ink2} />
        </button>
      )}
      {onOpenSettings && (
        <button title="Settings" onClick={onOpenSettings} className="lw-rail-btn"
          style={{ width: 32, height: 32, borderColor: 'transparent', color: t.ink2 }}>
          <Icon name="cog" size={14} color={t.ink2} />
        </button>
      )}
      <button title="Focus mode (F9)" onClick={onToggleFocus} className="lw-rail-btn"
        style={{ width: 32, height: 32, borderColor: focusMode ? t.accent : 'transparent', color: focusMode ? t.accent : t.ink2 }}>
        <Icon name="focus" size={14} color={focusMode ? t.accent : t.ink2} />
      </button>

      <span style={{
        fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12,
      }}>{book.wordsToday || 0} / {book.target || 0} · {book.streak || 0}🔥</span>
    </header>
  );
}

function ChapterScrubber({ order, activeIdx, jump, t, chapters }) {
  const [hover, setHover] = React.useState(null);
  if (!order.length) return <div style={{ flex: 1 }} />;
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', position: 'relative' }}>
      {order.map((id, i) => {
        const ch = chapters[id];
        const isActive = i === activeIdx;
        const wc = (ch?.text || '').trim().match(/\S+/g)?.length || 0;
        return (
          <button key={id}
            onClick={() => jump(i)}
            onMouseEnter={() => setHover({ i, ch, wc })}
            onMouseLeave={() => setHover(null)}
            className={isActive ? 'lw-breathe' : ''}
            style={{
              width: isActive ? 10 : 6, height: isActive ? 10 : 6,
              borderRadius: '50%', padding: 0,
              background: isActive ? t.accent : t.rule,
              border: 'none', cursor: 'pointer',
              transition: 'all 200ms',
            }} />
        );
      })}
      {hover && hover.ch && (
        <div style={{
          position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)',
          padding: '6px 10px',
          background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)', whiteSpace: 'nowrap', zIndex: 10,
        }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>ch.{hover.ch.n} · {hover.wc} words</div>
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, marginTop: 2 }}>{hover.ch.title}</div>
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

function timeAgo(ms) {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return Math.round(diff / 60_000) + 'm ago';
  if (diff < 86_400_000) return Math.round(diff / 3600_000) + 'h ago';
  return Math.round(diff / 86_400_000) + 'd ago';
}

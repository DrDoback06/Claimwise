// Loomwright — Cast roster (plan §10).

import React from 'react';
import { useTheme } from '../../theme';
import { useStore, createCharacter } from '../../store';
import { useSelection } from '../../selection';
import { dragEntity } from '../../drag';
import { castOnPage, castOffPage } from '../../store/selectors';
import { characterMetrics } from './appearances';

export default function Roster({ activeId, onSelect }) {
  const t = useTheme();
  const store = useStore();
  const onPage = castOnPage(store);
  const offPage = castOffPage(store);
  const onPageIds = new Set(onPage.map(c => c.id));
  const rowRefs = React.useRef({});

  const addCharacter = () => {
    let id = null;
    store.transaction(({ setSlice }) => {
      id = createCharacter({ setSlice }, {});
    });
    if (id) onSelect?.(id);
  };

  // Scroll-to-entity event from the prose canvas's quick-link popover.
  // We only handle character kind here — the other rosters listen too.
  React.useEffect(() => {
    const onScroll = (e) => {
      const { kind, id } = e?.detail || {};
      if (kind !== 'character') return;
      onSelect?.(id);
      const el = rowRefs.current[id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('lw-entity-flash');
        setTimeout(() => el.classList.remove('lw-entity-flash'), 1300);
      }
    };
    window.addEventListener('lw:scroll-to-entity', onScroll);
    return () => window.removeEventListener('lw:scroll-to-entity', onScroll);
  }, [onSelect]);

  const activeCh = store.ui?.activeChapterId
    ? store.chapters?.[store.ui.activeChapterId]
    : null;
  const totalChapters = store.book?.chapterOrder?.length || 1;
  const activeChIdx = activeCh ? (store.book?.chapterOrder || []).indexOf(activeCh.id) : -1;

  return (
    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rule}` }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6,
      }}>On page now {activeCh ? `· ch.${activeCh.n}` : ''}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {onPage.length === 0 && (
          <span style={{
            fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic',
          }}>No-one on page yet.</span>
        )}
        {onPage.map(x => (
          <button key={x.id}
            ref={el => { if (el) rowRefs.current[x.id] = el; }}
            onClick={() => onSelect?.(x.id)}
            draggable
            onDragStart={e => dragEntity(e, 'character', x.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px',
              background: activeId === x.id ? (x.color || t.accent) + '22' : 'transparent',
              border: `1px solid ${activeId === x.id ? (x.color || t.accent) : t.rule}`,
              borderRadius: 1, cursor: 'grab',
              fontFamily: t.display, fontSize: 12, color: t.ink,
            }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              background: x.color || t.accent, color: t.onAccent,
              display: 'grid', placeItems: 'center',
              fontFamily: t.display, fontWeight: 600, fontSize: 10,
            }}>{(x.name || '?')[0]}</div>
            {x.name || 'Unnamed'}
          </button>
        ))}
      </div>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6,
      }}>Off-page · relevant</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {offPage.map(x => (
          <button key={x.id}
            ref={el => { if (el) rowRefs.current[x.id] = el; }}
            onClick={() => onSelect?.(x.id)}
            draggable
            onDragStart={e => dragEntity(e, 'character', x.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px',
              background: 'transparent',
              border: `1px solid ${activeId === x.id ? (x.color || t.accent) : t.rule}`,
              borderRadius: 1, cursor: 'grab',
              fontFamily: t.display, fontSize: 11, color: t.ink2,
              opacity: activeId === x.id ? 1 : 0.7,
            }}>
            <span style={{
              width: 6, height: 6, background: x.color || t.accent, borderRadius: '50%',
            }} />
            {x.name || 'Unnamed'}
          </button>
        ))}
        <button onClick={addCharacter} style={{
          padding: '4px 9px', background: 'transparent',
          color: t.accent, border: `1px dashed ${t.accent}`,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1,
        }}>+ new</button>
      </div>

      {activeId && (
        <ChapterStrip
          characterId={activeId}
          totalChapters={totalChapters}
          activeChIdx={activeChIdx}
        />
      )}
    </div>
  );
}

function ChapterStrip({ characterId, totalChapters, activeChIdx }) {
  const t = useTheme();
  const store = useStore();
  const character = (store.cast || []).find(c => c.id === characterId);
  const metrics = React.useMemo(() => characterMetrics(store, character), [store.chapters, store.book?.chapterOrder, character]);
  if (!character) return null;
  const peak = metrics.perChapter.reduce((a, b) => Math.max(a, b.mentions), 1);
  const order = store.book?.chapterOrder || [];

  const jumpTo = (id) => {
    store.setPath('ui.activeChapterId', id);
    store.setPath('book.currentChapterId', id);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4,
      }}>Across {totalChapters} chapter{totalChapters === 1 ? '' : 's'}</div>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 24 }}>
        {order.map((id, i) => {
          const cell = metrics.perChapter.find(c => c.id === id) || { mentions: 0 };
          const intensity = peak > 0 ? cell.mentions / peak : 0;
          const isActive = i === activeChIdx;
          return (
            <button key={id}
              onClick={() => jumpTo(id)}
              title={`ch.${i + 1}: ${cell.mentions} mention${cell.mentions === 1 ? '' : 's'}`}
              style={{
                flex: 1, height: '100%', minWidth: 4, padding: 0,
                border: `1px solid ${isActive ? t.accent : 'transparent'}`,
                background: cell.mentions > 0
                  ? (character.color || t.accent)
                  : t.rule,
                opacity: cell.mentions > 0 ? Math.max(0.25, intensity) : 0.25,
                cursor: 'pointer',
                borderRadius: 1,
              }} />
          );
        })}
      </div>
    </div>
  );
}

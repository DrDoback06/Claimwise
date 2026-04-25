// Loomwright — Cast roster (plan §10).

import React from 'react';
import { useTheme } from '../../theme';
import { useStore, createCharacter } from '../../store';
import { useSelection } from '../../selection';
import { dragEntity } from '../../drag';
import { castOnPage, castOffPage } from '../../store/selectors';

export default function Roster({ activeId, onSelect }) {
  const t = useTheme();
  const store = useStore();
  const onPage = castOnPage(store);
  const offPage = castOffPage(store);
  const onPageIds = new Set(onPage.map(c => c.id));

  const addCharacter = () => {
    let id = null;
    store.transaction(({ setSlice }) => {
      id = createCharacter({ setSlice }, {});
    });
    if (id) onSelect?.(id);
  };

  const activeCh = store.ui?.activeChapterId
    ? store.chapters?.[store.ui.activeChapterId]
    : null;

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
    </div>
  );
}

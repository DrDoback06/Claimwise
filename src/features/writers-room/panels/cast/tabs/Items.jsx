// Loomwright — Cast > Items tab.

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';
import { useSelection } from '../../../selection';
import { dragEntity } from '../../../drag';

export default function ItemsTab({ character: c }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const charItems = (store.items || []).filter(it =>
    (c.inventory || []).includes(it.id) || it.owner === c.id
  );

  return (
    <div style={{ padding: '14px 16px' }}>
      {charItems.length === 0 && (
        <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
          Items appear as your characters pick them up.
        </div>
      )}
      {charItems.map(it => {
        const last = (it.track || [])[(it.track || []).length - 1];
        return (
          <div key={it.id} draggable onDragStart={e => dragEntity(e, 'item', it.id)} onClick={() => select('item', it.id)} style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px',
            marginBottom: 3,
            background: sel.item === it.id ? t.paper2 : 'transparent',
            border: `1px solid ${sel.item === it.id ? t.accent : 'transparent'}`,
            borderRadius: 1, cursor: 'grab',
          }}>
            <span style={{
              width: 24, height: 24, display: 'grid', placeItems: 'center',
              background: t.paper2, borderRadius: 1, fontSize: 14,
              color: c.color || t.accent, fontFamily: t.mono,
            }}>{it.icon || '◆'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: t.display, fontSize: 13, fontWeight: 500, color: t.ink }}>{it.name}</div>
              <div style={{
                fontFamily: t.mono, fontSize: 9, color: t.ink3,
                letterSpacing: 0.1, textTransform: 'uppercase',
              }}>{it.kind}{last ? ` · last: ${last.act} @ ch.${last.ch}` : ''}</div>
            </div>
            {last?.warning && <span style={{ color: t.warn, fontSize: 14 }}>⚠</span>}
          </div>
        );
      })}
    </div>
  );
}

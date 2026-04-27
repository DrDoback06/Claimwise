// Loomwright — Cast > Items tab. Accepts item drops; each drop logs a
// manual_correction timeline event so canon stays auditable.

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';
import { useSelection } from '../../../selection';
import { dragEntity, MIME, readDrop, isAcceptable } from '../../../drag';
import { recordItemAssignment } from '../../../timeline/corrections';

export default function ItemsTab({ character: c }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const [over, setOver] = React.useState(false);
  const charItems = (store.items || []).filter(it =>
    (c.inventory || []).some(x => (x?.id || x) === it.id) || it.owner === c.id
  );

  const onDragOver = (e) => {
    if (isAcceptable(e, MIME.ENTITY)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setOver(true);
    }
  };
  const onDragLeave = () => setOver(false);
  const onDrop = (e) => {
    setOver(false);
    const data = readDrop(e, MIME.ENTITY);
    if (data && data.kind === 'item' && data.id) {
      e.preventDefault();
      recordItemAssignment(store, { characterId: c.id, itemId: data.id, action: 'inventory-add' });
    }
  };

  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} style={{
      padding: '14px 16px',
      background: over ? (t.paper2 || t.paper) : 'transparent',
      outline: over ? `1px dashed ${t.accent}` : 'none',
    }}>
      {charItems.length === 0 && (
        <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
          Items appear as your characters pick them up. Drag an item chip here to assign one manually.
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

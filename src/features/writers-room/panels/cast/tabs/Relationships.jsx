// Loomwright — Cast > Relationships tab.

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';
import { useSelection } from '../../../selection';
import { dragEntity } from '../../../drag';

export default function RelationshipsTab({ character: c, update }) {
  const t = useTheme();
  const store = useStore();
  const { select } = useSelection();
  const rels = c.relationships || [];

  const others = (store.cast || []).filter(x => x.id !== c.id);
  const addRel = () => {
    const target = others[0];
    if (!target) return;
    update({ relationships: [...rels, { to: target.id, kind: 'allied', strength: 0.5, note: '' }] });
  };
  const updateRel = (i, patch) => update({ relationships: rels.map((r, j) => j === i ? { ...r, ...patch } : r) });
  const removeRel = (i) => update({ relationships: rels.filter((_, j) => j !== i) });

  return (
    <div style={{ padding: '14px 16px' }}>
      {rels.length === 0 && (
        <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
          No relationships yet.
        </div>
      )}
      {rels.map((r, i) => {
        const other = (store.cast || []).find(x => x.id === r.to);
        if (!other) return null;
        return (
          <div key={i} style={{ padding: '8px 0', borderTop: i > 0 ? `1px solid ${t.rule}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => select('character', other.id)}
                draggable
                onDragStart={e => dragEntity(e, 'character', other.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px',
                  background: 'transparent', border: `1px solid ${other.color || t.accent}`,
                  borderRadius: 1, cursor: 'grab',
                  fontFamily: t.display, fontSize: 12, color: t.ink,
                }}>
                <span style={{ width: 6, height: 6, background: other.color || t.accent, borderRadius: '50%' }} />
                {other.name}
              </button>
              <input value={r.kind || ''} onChange={e => updateRel(i, { kind: e.target.value })}
                style={{ flex: 1, fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', background: 'transparent', border: 'none', outline: 'none' }} />
              <input type="range" min={0} max={1} step={0.05} value={r.strength || 0.5}
                onChange={e => updateRel(i, { strength: Number(e.target.value) })}
                style={{ width: 60, accentColor: c.color || t.accent }} />
              <button onClick={() => removeRel(i)} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer' }}>×</button>
            </div>
            <input value={r.note || ''} onChange={e => updateRel(i, { note: e.target.value })} placeholder="Note"
              style={{ width: '100%', fontSize: 12, color: t.ink2, fontStyle: 'italic', background: 'transparent', border: 'none', outline: 'none', marginTop: 4 }} />
          </div>
        );
      })}
      {others.length > 0 && (
        <button onClick={addRel} style={{
          marginTop: 10, padding: '5px 10px', background: 'transparent',
          color: t.accent, border: `1px dashed ${t.accent}`,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1,
        }}>+ relationship</button>
      )}
    </div>
  );
}

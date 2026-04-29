// Loomwright — Atlas region list (CODE-INSIGHT §5).
// Manage region polygons drawn from the canvas.

import React from 'react';
import { useTheme } from '../../theme';
import { useStore } from '../../store';

export default function RegionList() {
  const t = useTheme();
  const store = useStore();
  const regions = store.regions || [];

  const update = (id, patch) =>
    store.setSlice('regions', rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id) =>
    store.setSlice('regions', rs => rs.filter(r => r.id !== id));

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 8,
      }}>Regions · {regions.length}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {regions.map(r => (
          <div key={r.id} style={{
            padding: '8px 10px', background: t.paper2, border: `1px solid ${t.rule}`,
            borderRadius: 2, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <input type="color" value={r.color || '#b8492e'}
              onChange={e => update(r.id, { color: e.target.value })}
              style={{ width: 22, height: 22, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
            <input value={r.name || ''} onChange={e => update(r.id, { name: e.target.value })}
              style={{
                flex: 1, fontFamily: t.display, fontSize: 13, color: t.ink,
                background: 'transparent', border: 'none', outline: 'none',
              }} />
            <input value={r.biome || ''} onChange={e => update(r.id, { biome: e.target.value })}
              placeholder="biome"
              style={{
                width: 100, fontFamily: t.mono, fontSize: 10, color: t.ink2,
                background: 'transparent', border: `1px solid ${t.rule}`,
                borderRadius: 1, padding: '2px 4px', outline: 'none',
              }} />
            <button onClick={() => { if (window.confirm(`Delete region "${r.name}"?`)) remove(r.id); }}
              style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer' }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

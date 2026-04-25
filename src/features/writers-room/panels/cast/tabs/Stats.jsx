// Loomwright — Cast > Stats tab.

import React from 'react';
import { useTheme } from '../../../theme';

const DEFAULT_STATS = ['Body', 'Mind', 'Heart', 'Resolve', 'Cunning', 'Voice'];

function StatBar({ label, value, color, onChange }) {
  const t = useTheme();
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>{value}</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color }}
      />
    </div>
  );
}

export default function StatsTab({ character: c, update }) {
  const t = useTheme();
  const stats = c.stats || {};
  const merged = {};
  DEFAULT_STATS.forEach(k => { merged[k] = stats[k] ?? 50; });
  Object.entries(stats).forEach(([k, v]) => { merged[k] = v; });

  const setStat = (k, v) => update({ stats: { ...stats, [k]: v } });

  return (
    <div style={{ padding: '14px 16px' }}>
      {Object.entries(merged).map(([k, v]) => (
        <StatBar key={k} label={k} value={v} color={c.color || t.accent} onChange={nv => setStat(k, nv)} />
      ))}
    </div>
  );
}

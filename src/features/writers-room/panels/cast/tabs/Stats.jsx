// Loomwright — Cast > Stats tab. Custom stats with descriptions, max values,
// derived view (base + items + skills + sets), compare with another character.

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';
import { derivedStats } from '../../../store/selectors';

const DEFAULT_STATS = ['Body', 'Mind', 'Heart', 'Resolve', 'Cunning', 'Voice'];

function statBar(t, label, value, color, max = 100, onChange, hint) {
  return (
    <div key={label} style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>{value}{max ? ` / ${max}` : ''}</span>
      </div>
      {onChange && (
        <input type="range" min={0} max={max || 100} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: color }} />
      )}
      {hint && (
        <div style={{ fontFamily: t.display, fontSize: 11, color: t.ink3, fontStyle: 'italic', marginTop: 2 }}>{hint}</div>
      )}
    </div>
  );
}

export default function StatsTab({ character: c, update }) {
  const t = useTheme();
  const store = useStore();
  const [view, setView] = React.useState('base'); // 'base' | 'derived' | 'compare'
  const [compareWith, setCompareWith] = React.useState(null);
  const catalog = store.statCatalog || [];

  // Build the merged stat key list: defaults + any extras from this character + catalog.
  const baseStats = c.stats || {};
  const allKeys = Array.from(new Set([
    ...DEFAULT_STATS,
    ...Object.keys(baseStats),
    ...catalog.map(s => s.key),
  ]));

  const setStat = (k, v) => update({ stats: { ...baseStats, [k]: v } });
  const removeStat = (k) => {
    const { [k]: _, ...rest } = baseStats;
    update({ stats: rest });
  };
  const addStat = () => {
    const k = window.prompt('Stat key (e.g. STAMINA)');
    if (!k) return;
    update({ stats: { ...baseStats, [k]: 50 } });
  };

  const derived = derivedStats(store, c);
  const compareChar = compareWith ? (store.cast || []).find(x => x.id === compareWith) : null;
  const compareDerived = compareChar ? derivedStats(store, compareChar) : {};

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {['base', 'derived', 'compare'].map(v => (
          <button key={v} onClick={() => setView(v)} style={chip(t, view === v)}>{v}</button>
        ))}
        <span style={{ flex: 1 }} />
        <button onClick={addStat} style={ghost(t)}>+ Stat</button>
      </div>

      {view === 'base' && allKeys.map(k => {
        const cat = catalog.find(s => s.key === k);
        const max = cat?.max || 100;
        const value = baseStats[k] ?? 50;
        return (
          <div key={k} style={{ position: 'relative' }}>
            {statBar(t, k, value, c.color || t.accent, max, v => setStat(k, v), cat?.description)}
            {baseStats[k] !== undefined && !DEFAULT_STATS.includes(k) && (
              <button onClick={() => removeStat(k)} style={{
                position: 'absolute', top: 0, right: -4,
                background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer',
                fontFamily: t.mono, fontSize: 11, lineHeight: 1, padding: 2,
              }}>×</button>
            )}
          </div>
        );
      })}

      {view === 'derived' && (
        <>
          <div style={{
            fontFamily: t.display, fontSize: 13, color: t.ink2, fontStyle: 'italic',
            marginBottom: 10, lineHeight: 1.5,
          }}>Base stats + every equipped item, active skill, set bonus, and runeword folded together.</div>
          {Object.entries(derived).map(([k, v]) => {
            const base = baseStats[k] ?? 0;
            const delta = v - base;
            return (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <span style={{
                  fontFamily: t.mono, fontSize: 9, color: t.ink2,
                  letterSpacing: 0.14, textTransform: 'uppercase',
                }}>{k}</span>
                <div style={{ position: 'relative', height: 8, background: t.rule, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${(Math.max(0, base) / 100) * 100}%`,
                    background: c.color || t.accent,
                  }} />
                  {delta !== 0 && (
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0,
                      left: `${(base / 100) * 100}%`,
                      width: `${(Math.abs(delta) / 100) * 100}%`,
                      background: delta > 0 ? t.good : t.bad,
                    }} />
                  )}
                </div>
                <span style={{
                  fontFamily: t.mono, fontSize: 11, color: delta > 0 ? t.good : delta < 0 ? t.bad : t.ink2,
                  textAlign: 'right',
                }}>{v}{delta !== 0 ? ` (${delta > 0 ? '+' : ''}${delta})` : ''}</span>
              </div>
            );
          })}
        </>
      )}

      {view === 'compare' && (
        <>
          <select value={compareWith || ''} onChange={e => setCompareWith(e.target.value || null)}
            style={{
              width: '100%', padding: '6px 8px', marginBottom: 10,
              fontFamily: t.display, fontSize: 13, color: t.ink,
              background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
            }}>
            <option value="">Pick someone to compare with…</option>
            {(store.cast || []).filter(x => x.id !== c.id).map(x => (
              <option key={x.id} value={x.id}>{x.name}</option>
            ))}
          </select>
          {compareChar && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: t.display, fontSize: 13, color: c.color || t.accent, fontWeight: 500 }}>{c.name}</span>
                <span style={{ flex: 1, textAlign: 'center', fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16 }}>VS</span>
                <span style={{ fontFamily: t.display, fontSize: 13, color: compareChar.color || t.accent, fontWeight: 500 }}>{compareChar.name}</span>
              </div>
              {Array.from(new Set([...Object.keys(derived), ...Object.keys(compareDerived)])).map(k => {
                const a = derived[k] || 0;
                const b = compareDerived[k] || 0;
                const max = Math.max(a, b, 100);
                return (
                  <div key={k} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 40px', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontFamily: t.mono, fontSize: 11, color: c.color || t.accent, textAlign: 'right' }}>{a}</span>
                      <div style={{ height: 8, background: t.rule, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(a / max) * 100}%`, background: c.color || t.accent }} />
                      </div>
                      <div style={{ height: 8, background: t.rule, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(b / max) * 100}%`, background: compareChar.color || t.accent }} />
                      </div>
                      <span style={{ fontFamily: t.mono, fontSize: 11, color: compareChar.color || t.accent }}>{b}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}

function chip(t, on) {
  return {
    padding: '4px 10px',
    background: on ? t.accent : 'transparent',
    color: on ? t.onAccent : t.ink2,
    border: `1px solid ${on ? t.accent : t.rule}`,
    borderRadius: 999, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}
function ghost(t) {
  return {
    padding: '4px 8px', background: 'transparent', color: t.accent,
    border: `1px dashed ${t.accent}`, borderRadius: 1, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}

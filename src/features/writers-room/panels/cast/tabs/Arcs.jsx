// Loomwright — Cast > Arcs tab. SVG timeline + chronological list.

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';

export default function ArcsTab({ character: c, update }) {
  const t = useTheme();
  const store = useStore();
  const arc = c.arc || [];
  const totalCh = store.book?.totalChapters || (store.book?.chapterOrder?.length || 1);
  const currentN = (() => {
    const id = store.ui?.activeChapterId || store.book?.currentChapterId;
    return id ? (store.chapters?.[id]?.n || 1) : 1;
  })();

  const addBeat = () => {
    update({ arc: [...arc, { ch: currentN, beat: 'New beat', projected: false }] });
  };

  return (
    <div style={{ padding: '14px 16px' }}>
      {arc.length === 0 ? (
        <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 10 }}>
          No arc beats yet. Add one to start charting their journey.
        </div>
      ) : (
        <svg viewBox="0 0 100 40" style={{ width: '100%', marginBottom: 8 }}>
          <line x1="4" y1="20" x2="96" y2="20" stroke={t.rule} strokeWidth="0.4" />
          {Array.from({ length: totalCh }, (_, i) => {
            const x = 4 + (i / Math.max(1, totalCh - 1)) * 92;
            return <line key={i} x1={x} y1="19" x2={x} y2="21" stroke={t.ink3} strokeWidth="0.3" />;
          })}
          {arc.map((b, i) => {
            const x = 4 + ((b.ch - 1) / Math.max(1, totalCh - 1)) * 92;
            const y = 20 - (i % 2 === 0 ? 10 : -10);
            return (
              <g key={i}>
                <line x1={x} y1="20" x2={x} y2={y} stroke={c.color || t.accent} strokeWidth="0.4" strokeDasharray={b.projected ? '0.6 0.4' : ''} />
                <circle cx={x} cy={y} r="1.5" fill={b.projected ? 'transparent' : (c.color || t.accent)} stroke={c.color || t.accent} strokeWidth="0.4" />
              </g>
            );
          })}
          <line x1={4 + ((currentN - 1) / Math.max(1, totalCh - 1)) * 92} y1="6"
            x2={4 + ((currentN - 1) / Math.max(1, totalCh - 1)) * 92} y2="34"
            stroke={t.accent} strokeWidth="0.4" strokeDasharray="0.8 0.4" />
        </svg>
      )}
      {arc.map((b, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 8,
          padding: '6px 0', borderTop: i > 0 ? `1px solid ${t.rule}` : 'none',
          opacity: b.projected ? 0.6 : 1,
        }}>
          <input type="number" value={b.ch} min={1} max={totalCh}
            onChange={e => update({ arc: arc.map((x, j) => j === i ? { ...x, ch: Number(e.target.value) } : x) })}
            style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, background: 'transparent', border: 'none', outline: 'none', width: 40, textAlign: 'right' }} />
          <input value={b.beat} onChange={e => update({ arc: arc.map((x, j) => j === i ? { ...x, beat: e.target.value } : x) })}
            style={{ fontSize: 12, color: t.ink, fontFamily: t.display, background: 'transparent', border: 'none', outline: 'none' }} />
          <button onClick={() => update({ arc: arc.filter((_, j) => j !== i) })} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer' }}>×</button>
        </div>
      ))}
      <button onClick={addBeat} style={{
        marginTop: 10, padding: '5px 10px', background: 'transparent',
        color: t.accent, border: `1px dashed ${t.accent}`,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
        textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1,
      }}>+ beat</button>
    </div>
  );
}

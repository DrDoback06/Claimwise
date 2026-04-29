// Loomwright — Tangle relationship matrix (CODE-INSIGHT §8 / artboard 07-more).
// Alternate view of the Tangle. 5x5+ colour-coded grid. Click a cell to open
// the relationship in a popover.

import React from 'react';
import { useTheme } from '../../theme';
import { useStore } from '../../store';
import { useSelection } from '../../selection';

function relationshipBetween(a, b) {
  if (!a || !b) return null;
  const fwd = (a.relationships || []).find(r => r.with === b.id || r.toId === b.id || r.targetId === b.id);
  const rev = (b.relationships || []).find(r => r.with === a.id || r.toId === a.id || r.targetId === a.id);
  return fwd || rev || null;
}

function strengthColor(t, strength) {
  // -1 (hostile) → bad, 0 (neutral) → ink3, +1 (close) → good.
  const s = Math.max(-1, Math.min(1, strength ?? 0));
  if (s > 0.5) return t.good;
  if (s > 0)   return 'oklch(60% 0.13 110)';
  if (s > -0.5) return t.ink3;
  return t.bad;
}

function strengthForRel(r) {
  if (!r) return 0;
  if (typeof r.strength === 'number') return r.strength;
  // Heuristic from kind labels.
  const k = (r.kind || r.relation || '').toLowerCase();
  if (/love|friend|ally|family|loyal/.test(k)) return 0.7;
  if (/rival|enemy|hostile|distrust/.test(k)) return -0.7;
  if (/distant|stranger/.test(k)) return -0.2;
  return 0.2;
}

export default function RelationshipMatrix() {
  const t = useTheme();
  const store = useStore();
  const { sel, addToMulti } = useSelection();
  const cast = store.cast || [];
  const [hover, setHover] = React.useState(null); // {row, col}
  const [open, setOpen] = React.useState(null);   // {a, b, rel}

  if (cast.length < 2) {
    return (
      <div style={{ padding: 24, textAlign: 'center', fontFamily: t.display, color: t.ink3, fontStyle: 'italic' }}>
        Add at least two characters to see the matrix.
      </div>
    );
  }

  const highlightChar = sel.character;
  const multiIds = (sel.multi || []).filter(r => r.kind === 'character').map(r => r.id);

  return (
    <div style={{ padding: 12, position: 'relative' }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 8,
      }}>Relationship matrix · {cast.length} × {cast.length}</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `120px repeat(${cast.length}, 36px)`,
        gap: 1,
        background: t.rule, padding: 1,
      }}>
        {/* Header row */}
        <div style={{ background: t.paper }} />
        {cast.map(c => (
          <div key={'h-' + c.id} title={c.name} style={{
            background: t.paper2, padding: '6px 4px',
            fontFamily: t.mono, fontSize: 9, color: c.color || t.ink2,
            letterSpacing: 0.08, textTransform: 'uppercase',
            writingMode: 'vertical-rl', textAlign: 'right',
            outline: highlightChar === c.id || multiIds.includes(c.id) ? `2px solid ${t.accent}` : 'none',
          }}>{c.name?.slice(0, 12) || '?'}</div>
        ))}
        {/* Body */}
        {cast.map((a, i) => (
          <React.Fragment key={'row-' + a.id}>
            <div title={a.name} style={{
              background: t.paper2, padding: '6px 8px',
              fontFamily: t.display, fontSize: 12, color: t.ink,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              borderLeft: `3px solid ${a.color || t.ink3}`,
              outline: highlightChar === a.id || multiIds.includes(a.id) ? `2px solid ${t.accent}` : 'none',
            }}>{a.name || '?'}</div>
            {cast.map((b, j) => {
              if (i === j) {
                return (
                  <div key={'c-' + j} style={{
                    background: t.paper3, fontFamily: t.mono, fontSize: 10,
                    color: t.ink3, display: 'grid', placeItems: 'center',
                  }}>—</div>
                );
              }
              const rel = relationshipBetween(a, b);
              const strength = strengthForRel(rel);
              const color = rel ? strengthColor(t, strength) : t.paper;
              const isHover = hover?.row === i && hover?.col === j;
              const isHighlightRow = highlightChar === a.id || multiIds.includes(a.id);
              const isHighlightCol = highlightChar === b.id || multiIds.includes(b.id);
              return (
                <button
                  key={'c-' + j}
                  onClick={() => {
                    setOpen({ a, b, rel });
                    addToMulti({ kind: 'character', id: a.id });
                    addToMulti({ kind: 'character', id: b.id });
                  }}
                  onMouseEnter={() => setHover({ row: i, col: j })}
                  onMouseLeave={() => setHover(null)}
                  title={rel ? `${a.name} → ${b.name}: ${rel.kind || rel.relation || 'related'}` : `${a.name} & ${b.name}: no relationship`}
                  style={{
                    background: rel ? color : t.paper, border: 'none', padding: 0, cursor: 'pointer',
                    height: 32,
                    opacity: isHover ? 1 : (isHighlightRow || isHighlightCol ? 1 : (rel ? 0.85 : 0.3)),
                    outline: isHover ? `1px solid ${t.ink}` : 'none',
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 10, display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase',
      }}>
        <span>Strength:</span>
        <Swatch t={t} c={t.bad} label="hostile" />
        <Swatch t={t} c={t.ink3} label="distant" />
        <Swatch t={t} c="oklch(60% 0.13 110)" label="warm" />
        <Swatch t={t} c={t.good} label="close" />
      </div>

      {open && (
        <div role="dialog" style={{
          position: 'absolute', top: 80, left: 12, right: 12,
          padding: 14, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 5,
          animation: 'lw-card-in 160ms ease-out',
        }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
          }}>Relationship</div>
          <div style={{ fontFamily: t.display, fontSize: 16, color: t.ink, fontWeight: 500 }}>
            {open.a.name} ↔ {open.b.name}
          </div>
          <div style={{ marginTop: 6, fontFamily: t.display, fontSize: 13, color: t.ink2, fontStyle: 'italic' }}>
            {open.rel ? (open.rel.kind || open.rel.relation || open.rel.label || 'connected') : 'No relationship recorded.'}
          </div>
          {open.rel?.note && (
            <div style={{ marginTop: 6, fontFamily: t.display, fontSize: 12, color: t.ink2, lineHeight: 1.5 }}>
              {open.rel.note}
            </div>
          )}
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setOpen(null)} style={{
              padding: '4px 10px', background: 'transparent', color: t.ink3,
              border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer',
              fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
            }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Swatch({ t, c, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
      {label}
    </span>
  );
}

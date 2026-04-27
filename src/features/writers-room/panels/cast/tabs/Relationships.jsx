// Loomwright — Cast > Relationships tab.
//
// Shows each relationship as a pill with a hostile↔close strength bar
// (-1 to +1, colour-coded). Below the relationships, a "Quests together"
// section cross-links to quests where both characters appear; selecting
// a quest jumps the quests panel to it so the writer can see how each
// character's angle plays differently.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../../../theme';
import { useStore } from '../../../store';
import { useSelection } from '../../../selection';
import { dragEntity } from '../../../drag';

function strengthColor(s, t) {
  // s in [-1, +1]
  if (s >= 0.5) return t.good || '#2a8';
  if (s <= -0.5) return t.bad || '#c44';
  if (s >= 0.1) return PANEL_ACCENT.cast;
  if (s <= -0.1) return t.warn || '#d80';
  return t.ink3;
}
function strengthLabel(s) {
  if (s >= 0.7) return 'devoted';
  if (s >= 0.3) return 'close';
  if (s > -0.1) return 'cordial';
  if (s > -0.5) return 'wary';
  return 'hostile';
}

export default function RelationshipsTab({ character: c, update }) {
  const t = useTheme();
  const store = useStore();
  const { select } = useSelection();
  const rels = c.relationships || [];

  const others = (store.cast || []).filter(x => x.id !== c.id);
  const quests = store.quests || [];

  const addRel = () => {
    const target = others[0];
    if (!target) return;
    update({ relationships: [...rels, { to: target.id, kind: 'allied', strength: 0.3, note: '' }] });
  };
  const updateRel = (i, patch) => update({ relationships: rels.map((r, j) => j === i ? { ...r, ...patch } : r) });
  const removeRel = (i) => update({ relationships: rels.filter((_, j) => j !== i) });

  // Quests both this character and any related character are involved in.
  const sharedQuests = quests.filter(q => {
    const cs = q.characters || [];
    if (!cs.includes(c.id)) return false;
    return rels.some(r => cs.includes(r.to));
  });

  // Quests that include this character — shows the writer the "angles" view.
  const myQuests = quests.filter(q => (q.characters || []).includes(c.id));

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={lbl(t)}>Relationships · {rels.length}</div>
        {rels.length === 0 && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5, marginTop: 4 }}>
            No relationships yet. The deep-extraction pipeline picks these up
            from chapter prose; you can also add them manually.
          </div>
        )}
        {rels.map((r, i) => {
          const other = (store.cast || []).find(x => x.id === r.to);
          if (!other) return null;
          const s = typeof r.strength === 'number' ? r.strength : 0;
          const sc = strengthColor(s, t);
          const sLabel = strengthLabel(s);
          // Convert from displayed -1..+1 range to the slider's 0..100 scale.
          const sliderVal = Math.round((s + 1) * 50);
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
                <span style={{
                  padding: '1px 6px', borderRadius: 999,
                  background: sc + '22',
                  color: sc, border: `1px solid ${sc}`,
                  fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
                }}>{sLabel}</span>
                <button onClick={() => removeRel(i)} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3 }}>hostile</span>
                <input type="range" min={0} max={100} step={1} value={sliderVal}
                  onChange={e => updateRel(i, { strength: (Number(e.target.value) - 50) / 50 })}
                  style={{ flex: 1, accentColor: sc }} />
                <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3 }}>close</span>
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

      {sharedQuests.length > 0 && (
        <div>
          <div style={lbl(t)}>Quests together · {sharedQuests.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {sharedQuests.map(q => {
              const otherIds = (q.characters || []).filter(id => id !== c.id);
              return (
                <button key={q.id}
                  onClick={() => select('quest', q.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 8px', background: 'transparent',
                    border: `1px solid ${q.color || t.rule}`,
                    borderLeft: `3px solid ${q.color || PANEL_ACCENT.threads}`,
                    borderRadius: 1, cursor: 'pointer', textAlign: 'left',
                  }}>
                  <span style={{ flex: 1, fontFamily: t.display, fontSize: 13, color: t.ink }}>
                    {q.name || q.title}
                  </span>
                  <span style={{
                    fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase',
                  }}>+{otherIds.length} other{otherIds.length === 1 ? '' : 's'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {myQuests.length > 0 && (
        <div>
          <div style={lbl(t)}>Their angle on each quest</div>
          <p style={{ fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5, marginTop: 4 }}>
            Each quest below includes {c.name}. Open one to see other involved characters
            and how their relationships might colour their viewpoint.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {myQuests.slice(0, 8).map(q => {
              const others = (q.characters || []).filter(id => id !== c.id);
              const friendlies = others.filter(oid => {
                const r = rels.find(rr => rr.to === oid);
                return r && (r.strength ?? 0) >= 0.3;
              });
              const hostiles = others.filter(oid => {
                const r = rels.find(rr => rr.to === oid);
                return r && (r.strength ?? 0) <= -0.3;
              });
              return (
                <button key={q.id}
                  onClick={() => select('quest', q.id)}
                  style={{
                    padding: '6px 8px', background: t.paper2,
                    border: `1px solid ${t.rule}`,
                    borderLeft: `3px solid ${q.color || PANEL_ACCENT.threads}`,
                    borderRadius: 1, cursor: 'pointer', textAlign: 'left',
                  }}>
                  <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500 }}>
                    {q.name || q.title}
                  </div>
                  <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, marginTop: 2 }}>
                    {friendlies.length > 0 && (
                      <span style={{ color: t.good || '#2a8' }}>+{friendlies.length} ally · </span>
                    )}
                    {hostiles.length > 0 && (
                      <span style={{ color: t.bad || '#c44' }}>{hostiles.length} foe · </span>
                    )}
                    {others.length} other{others.length === 1 ? '' : 's'} involved
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function lbl(t) {
  return {
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.16, textTransform: 'uppercase',
  };
}

// Loomwright — Cast dossier · Factions section.
//
// Surfaces every faction (org / guild / family / company / movement) the
// character is listed as a member of, sourced from store.factions where
// `members[]` includes either the character's id or their name.
// Genre-agnostic: a faction is as much "the Compliance Office" as it is
// "the Black Company".

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';

export default function FactionsTab({ character: c }) {
  const t = useTheme();
  const store = useStore();
  const factions = (store.factions || []).filter(f => {
    const members = f.members || [];
    return members.includes(c.id) || members.some(m => (m || '').toLowerCase() === (c.name || '').toLowerCase());
  });

  const remove = (factionId) => {
    store.setSlice('factions', xs => (xs || []).map(f => {
      if (f.id !== factionId) return f;
      return { ...f, members: (f.members || []).filter(m => m !== c.id && (m || '').toLowerCase() !== (c.name || '').toLowerCase()) };
    }));
  };

  if (factions.length === 0) {
    return (
      <div style={{ padding: '8px 16px', fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic' }}>
        No factions on record. Loom-drafted memberships will appear here after extraction.
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {factions.map(f => (
        <div key={f.id} style={{
          padding: '8px 12px', background: t.paper2, border: `1px solid ${t.rule}`,
          borderRadius: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>{f.name}</span>
            <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>
              {f.type || 'group'}{f.stance && f.stance !== 'neutral' ? ` · ${f.stance}` : ''}
            </span>
            <span style={{ flex: 1 }} />
            <button onClick={() => remove(f.id)} style={ghost(t)} title="Remove this character from the faction">×</button>
          </div>
          {f.description && (
            <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink2, marginTop: 4 }}>{f.description}</div>
          )}
          {f.goals && (
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, marginTop: 4, letterSpacing: 0.1 }}>
              GOALS · {f.goals}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ghost(t) {
  return {
    padding: '0 6px', background: 'transparent', color: t.ink3,
    border: `1px solid ${t.rule}`, borderRadius: 1,
    fontFamily: t.mono, fontSize: 10, cursor: 'pointer',
  };
}

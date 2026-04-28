// Loomwright — Cast dossier · Lore section.
//
// Worldbuilding facts the character is shown to know. Sourced from
// store.lore where `knownBy[]` references this character. Useful for
// continuity scans ("character X knew Y in chapter 3, but here she's
// asking about it as if it were new").

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';

export default function LoreTab({ character: c }) {
  const t = useTheme();
  const store = useStore();
  const lore = (store.lore || []).filter(l => {
    const known = l.knownBy || [];
    return known.includes(c.id) || known.some(k => (k || '').toLowerCase() === (c.name || '').toLowerCase());
  });

  if (lore.length === 0) {
    return (
      <div style={{ padding: '8px 16px', fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic' }}>
        No lore tied to {c.name || 'this character'} yet. Run a Deep Extract to surface what they know.
      </div>
    );
  }

  // Group by category for legibility.
  const byCategory = lore.reduce((acc, l) => {
    const k = l.category || 'other';
    (acc[k] = acc[k] || []).push(l);
    return acc;
  }, {});

  return (
    <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
          }}>{cat}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.map(l => (
              <div key={l.id} style={{
                padding: '6px 10px', background: t.paper2, border: `1px solid ${t.rule}`,
                borderRadius: 2,
              }}>
                <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500 }}>{l.title}</div>
                {l.description && (
                  <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink2, marginTop: 2 }}>{l.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

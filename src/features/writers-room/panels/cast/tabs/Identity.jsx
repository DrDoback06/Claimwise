// Loomwright — Cast > Identity tab.

import React from 'react';
import { useTheme } from '../../../theme';

export default function IdentityTab({ character: c, update }) {
  const t = useTheme();
  const inp = {
    width: '100%', padding: '6px 8px',
    fontFamily: t.display, fontSize: 13, color: t.ink,
    background: 'transparent', border: `1px solid ${t.rule}`,
    borderRadius: 1, outline: 'none', marginTop: 4,
  };
  const lbl = {
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 10,
  };
  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={lbl}>Aliases</div>
      <input style={inp} value={(c.aliases || []).join(', ')}
        onChange={e => update({ aliases: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
      <div style={lbl}>Pronouns</div>
      <input style={inp} value={c.pronouns || ''} onChange={e => update({ pronouns: e.target.value })} />
      <div style={lbl}>Age</div>
      <input style={inp} value={c.age || ''} onChange={e => update({ age: e.target.value })} />
      <div style={lbl}>One-liner</div>
      <input style={inp} value={c.oneliner || ''} onChange={e => update({ oneliner: e.target.value })} />
      <div style={lbl}>Bio</div>
      <textarea rows={4} style={{ ...inp, fontFamily: t.display, lineHeight: 1.5 }}
        value={c.dossier?.bio || ''}
        onChange={e => update({ dossier: { ...(c.dossier || {}), bio: e.target.value } })} />
      <div style={lbl}>Tags</div>
      <input style={inp} value={(c.traits || []).join(', ')}
        onChange={e => update({ traits: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
    </div>
  );
}

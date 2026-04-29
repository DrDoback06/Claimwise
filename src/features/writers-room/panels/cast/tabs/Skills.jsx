// Loomwright — Cast > Skills tab.

import React from 'react';
import { useTheme } from '../../../theme';

export default function SkillsTab({ character: c, update }) {
  const t = useTheme();
  const skills = c.skills || [];
  const setSkills = (next) => update({ skills: typeof next === 'function' ? next(skills) : next });

  const addSkill = () => setSkills(s => [...s, { id: `sk_${Date.now()}`, k: 'New skill', lvl: 1, origin: '', detail: '' }]);
  const removeSkill = (id) => setSkills(s => s.filter(x => x.id !== id));
  const updateSkill = (id, patch) => setSkills(s => s.map(x => x.id === id ? { ...x, ...patch } : x));

  return (
    <div style={{ padding: '14px 16px' }}>
      {skills.length === 0 && (
        <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
          No skills yet. Add one as your character earns it.
        </div>
      )}
      {skills.map((s, i) => (
        <div key={s.id || i} style={{ padding: '8px 0', borderTop: i > 0 ? `1px solid ${t.rule}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input value={s.k || ''} onChange={e => updateSkill(s.id, { k: e.target.value })}
              style={{ flex: 1, fontFamily: t.display, fontSize: 13, fontWeight: 500, color: t.ink, background: 'transparent', border: 'none', outline: 'none' }} />
            <input type="number" min={0} max={5} value={s.lvl || 0} onChange={e => updateSkill(s.id, { lvl: Number(e.target.value) })}
              style={{ width: 36, fontFamily: t.mono, fontSize: 10, color: c.color || t.accent, background: t.paper2, border: `1px solid ${t.rule}`, padding: '1px 4px', borderRadius: 1 }} />
            <button onClick={() => removeSkill(s.id)} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer' }}>×</button>
          </div>
          <input value={s.origin || ''} onChange={e => updateSkill(s.id, { origin: e.target.value })} placeholder="Origin"
            style={{ width: '100%', fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase', background: 'transparent', border: 'none', outline: 'none', marginTop: 2 }} />
          <input value={s.detail || ''} onChange={e => updateSkill(s.id, { detail: e.target.value })} placeholder="Detail"
            style={{ width: '100%', fontSize: 12, color: t.ink2, fontStyle: 'italic', background: 'transparent', border: 'none', outline: 'none', marginTop: 2 }} />
        </div>
      ))}
      <button onClick={addSkill} style={{
        marginTop: 10, padding: '5px 10px', background: 'transparent',
        color: t.accent, border: `1px dashed ${t.accent}`,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
        textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1,
      }}>+ skill</button>
    </div>
  );
}

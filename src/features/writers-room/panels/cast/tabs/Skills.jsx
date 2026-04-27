// Loomwright — Cast > Skills tab.
//
// Three sections:
//   1. Skill trees assigned to this character (multi-select; choose from
//      `store.skillTrees`).
//   2. Personal skills — unique abilities not in any tree. Drag a skill
//      from the Skill Bank into the drop-zone to add it here.
//   3. Inline editor — old freeform fields are preserved.

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';
import { MIME, readDrop } from '../../../drag';
import { recordSkillAssignment } from '../../../timeline/corrections';

export default function SkillsTab({ character: c, update }) {
  const t = useTheme();
  const store = useStore();
  const trees = store.skillTrees || [];
  const bank = store.skillBank || [];
  const skills = c.skills || [];
  const treeIds = c.skillTreeIds || [];
  const [overDrop, setOverDrop] = React.useState(false);

  const setSkills = (next) => update({ skills: typeof next === 'function' ? next(skills) : next });
  const setTreeIds = (next) => update({ skillTreeIds: typeof next === 'function' ? next(treeIds) : next });

  const toggleTree = (id) => setTreeIds(ts => ts.includes(id) ? ts.filter(x => x !== id) : [...ts, id]);

  const addSkill = () => setSkills(s => [...s, { id: `sk_${Date.now()}`, k: 'New skill', lvl: 1, origin: '', detail: '' }]);
  const removeSkill = (id) => setSkills(s => s.filter(x => x.id !== id));
  const updateSkill = (id, patch) => setSkills(s => s.map(x => x.id === id ? { ...x, ...patch } : x));

  // Accept drag-drop from Skill Bank (panels/skills/index.jsx) OR a generic
  // EntityChip with kind=skill (records a manual_correction event).
  const onDrop = (e) => {
    setOverDrop(false);
    const bankSkillId = e.dataTransfer.getData('application/x-lw-bank-skill');
    if (bankSkillId) {
      e.preventDefault();
      const bankItem = bank.find(b => b.id === bankSkillId);
      if (!bankItem) return;
      recordSkillAssignment(store, { characterId: c.id, skillId: bankItem.id });
      return;
    }
    const entityDrop = readDrop(e, MIME.ENTITY);
    if (entityDrop && entityDrop.kind === 'skill' && entityDrop.id) {
      e.preventDefault();
      recordSkillAssignment(store, { characterId: c.id, skillId: entityDrop.id });
    }
  };

  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes('application/x-lw-bank-skill')
        || e.dataTransfer.types.includes(MIME.ENTITY)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setOverDrop(true);
    }
  };

  const lbl = {
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.16, textTransform: 'uppercase',
  };

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Tree assignment */}
      <div>
        <div style={lbl}>Skill trees · {treeIds.length}/{trees.length}</div>
        {trees.length === 0 ? (
          <div style={{ marginTop: 4, fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic' }}>
            Create a tree from the Skills panel to assign one here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {trees.map(tr => {
              const on = treeIds.includes(tr.id);
              return (
                <button key={tr.id} onClick={() => toggleTree(tr.id)} style={{
                  padding: '3px 10px',
                  background: on ? (tr.color || t.accent) : 'transparent',
                  color: on ? t.onAccent : (tr.color || t.ink2),
                  border: `1px solid ${tr.color || t.accent}`,
                  borderRadius: 999, cursor: 'pointer',
                  fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
                }}>
                  {on ? '✓ ' : ''}{tr.name} · {(tr.nodeIds || []).length}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Personal skills + drag drop */}
      <div
        onDragOver={onDragOver}
        onDragLeave={() => setOverDrop(false)}
        onDrop={onDrop}
        style={{
          border: `1px dashed ${overDrop ? t.accent : t.rule}`,
          background: overDrop ? (t.sugg || t.paper2) : 'transparent',
          borderRadius: 2, padding: 8,
        }}>
        <div style={lbl}>Personal skills · {skills.length}</div>
        {skills.length === 0 && (
          <div style={{ marginTop: 6, fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic' }}>
            No personal skills yet. Drag a skill from the Skill Bank, or
            <button onClick={addSkill} style={{
              marginLeft: 6, padding: '0 6px', background: 'transparent',
              border: 'none', color: t.accent, cursor: 'pointer',
              fontFamily: t.mono, fontSize: 12, letterSpacing: 0.1, textDecoration: 'underline',
            }}>add one manually</button>.
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
        {skills.length > 0 && (
          <button onClick={addSkill} style={{
            marginTop: 10, padding: '5px 10px', background: 'transparent',
            color: t.accent, border: `1px dashed ${t.accent}`,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1,
          }}>+ skill</button>
        )}
      </div>
    </div>
  );
}

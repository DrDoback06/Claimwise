// Loomwright — manual canon corrections. Every drag-drop correction (item
// onto inventory, skill onto character, item ownership transfer, etc.) goes
// through this helper so it produces both the state mutation and an audit-
// tracked timeline event. User-driven corrections always land in BLUE
// (high band) — the user did it explicitly.

import { rid } from '../store/mutators';

function appendEvent(setSlice, event) {
  setSlice('timelineEvents', xs => [
    ...(Array.isArray(xs) ? xs : []),
    {
      id: rid('te'),
      createdAt: Date.now(),
      riskBand: 'high',
      ...event,
      entityRefs: event.entityRefs || (event.actorId ? [{ kind: 'character', id: event.actorId, role: 'primary' }] : []),
    },
  ]);
}

// Drop an item onto a character's inventory: mutate inventory + owner,
// log a manual_correction event with both entities + chapter context.
export function recordItemAssignment(store, { characterId, itemId, action = 'inventory-add' }) {
  if (!characterId || !itemId) return;
  store.transaction(({ setSlice, get }) => {
    const draft = get();
    const character = (draft.cast || []).find(c => c.id === characterId);
    const itemEntity = (draft.items || []).find(i => i.id === itemId);
    if (!character || !itemEntity) return;

    if (action === 'inventory-add') {
      setSlice('cast', cs => (cs || []).map(c => {
        if (c.id !== characterId) return c;
        const inv = Array.isArray(c.inventory) ? c.inventory : [];
        if (inv.some(x => (x?.id || x) === itemId)) return c;
        return { ...c, inventory: [...inv, { id: itemId, addedAt: Date.now() }] };
      }));
      setSlice('items', is => (is || []).map(x => x.id === itemId ? { ...x, owner: characterId } : x));
    } else if (action === 'inventory-remove') {
      setSlice('cast', cs => (cs || []).map(c => {
        if (c.id !== characterId) return c;
        const inv = Array.isArray(c.inventory) ? c.inventory : [];
        return { ...c, inventory: inv.filter(x => (x?.id || x) !== itemId) };
      }));
      setSlice('items', is => (is || []).map(x => x.id === itemId ? { ...x, owner: null } : x));
    }

    appendEvent(setSlice, {
      actorId: characterId,
      entityRefs: [
        { kind: 'character', id: characterId, role: action === 'inventory-remove' ? 'former_owner' : 'owner' },
        { kind: 'item',      id: itemId,      role: 'item' },
      ],
      eventType: 'manual_correction',
      chapterId: draft.book?.currentChapterId || draft.ui?.activeChapterId || null,
      data: {
        description: action === 'inventory-add'
          ? `${itemEntity.name} added to ${character.name}'s inventory (manual).`
          : `${itemEntity.name} removed from ${character.name}'s inventory (manual).`,
        action,
      },
    });
  });
}

// Drop a skill onto a character: append to personalSkills + log event.
export function recordSkillAssignment(store, { characterId, skillId }) {
  if (!characterId || !skillId) return;
  store.transaction(({ setSlice, get }) => {
    const draft = get();
    const character = (draft.cast || []).find(c => c.id === characterId);
    const skill = (draft.skillBank || []).find(s => s.id === skillId)
      || (draft.skills || []).find(s => s.id === skillId);
    if (!character || !skill) return;

    setSlice('cast', cs => (cs || []).map(c => {
      if (c.id !== characterId) return c;
      const personal = Array.isArray(c.personalSkills) ? c.personalSkills : (c.skills || []);
      if (personal.some(p => p?.k === skill.name || p?.id === skillId)) return c;
      const next = [...personal, { id: 'sk_' + Date.now(), k: skill.name, lvl: 1, origin: 'manual' }];
      return { ...c, personalSkills: next, skills: next };
    }));

    appendEvent(setSlice, {
      actorId: characterId,
      entityRefs: [
        { kind: 'character', id: characterId, role: 'learner' },
        { kind: 'skill',     id: skillId,     role: 'skill' },
      ],
      eventType: 'manual_correction',
      chapterId: draft.book?.currentChapterId || draft.ui?.activeChapterId || null,
      data: {
        description: `${skill.name} added to ${character.name} (manual).`,
        action: 'skill-add',
      },
    });
  });
}

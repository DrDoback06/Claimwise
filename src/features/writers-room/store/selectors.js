// Loomwright — pure selectors over the canonical store.

export function activeChapter(state) {
  const id = state.ui?.activeChapterId || state.book?.currentChapterId;
  return id ? state.chapters?.[id] : null;
}

export function chapterList(state) {
  const order = state.book?.chapterOrder || [];
  return order.map(id => state.chapters?.[id]).filter(Boolean);
}

export function castOnPage(state) {
  const ch = activeChapter(state);
  if (!ch || !ch.text) return [];
  const text = ch.text;
  return (state.cast || []).filter(c => {
    if (!c.name) return false;
    return new RegExp(`\\b${escapeRegExp(c.name)}\\b`, 'i').test(text);
  });
}

export function castOffPage(state) {
  const onPageIds = new Set(castOnPage(state).map(c => c.id));
  return (state.cast || []).filter(c => !onPageIds.has(c.id));
}

export function characterById(state, id) { return (state.cast || []).find(c => c.id === id) || null; }
export function placeById(state, id) { return (state.places || []).find(p => p.id === id) || null; }
export function threadById(state, id) { return (state.threads || []).find(t => t.id === id) || null; }
export function itemById(state, id) { return (state.items || []).find(i => i.id === id) || null; }

export function threadsForCharacter(state, charId) {
  return (state.threads || []).filter(t => (t.characters || []).includes(charId));
}

export function itemsForCharacter(state, charId) {
  const c = characterById(state, charId);
  if (!c) return [];
  const ids = c.inventory || [];
  return (state.items || []).filter(i => ids.includes(i.id) || i.owner === charId);
}

export function relationshipsForCharacter(state, charId) {
  const c = characterById(state, charId);
  if (!c) return [];
  return c.relationships || [];
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Design-pass selectors (CODE-INSIGHT §12) ────────────────────────
// All return safe defaults so legacy data without the new fields renders.

export function locationByChapter(character) {
  return character?.locationByChapter || {};
}

export function inventoryByChapter(character) {
  return character?.inventoryByChapter || {};
}

export function knowledge(character) {
  // Returns merged ledger with KIND-tagged entries. Per CODE-INSIGHT §12.7
  // KnowledgeEntry adds learnedAtChapter / source / sourceCharacterId / alsoKnownBy.
  const out = [];
  for (const k of ['knows', 'hides', 'fears']) {
    const list = Array.isArray(character?.[k]) ? character[k] : [];
    for (const e of list) out.push({ ...e, kind: e.kind || k });
  }
  return out;
}

export function knowledgeByKind(character, kind) {
  return knowledge(character).filter(e => e.kind === kind);
}

// Items: derive stat deltas from equipped items + active skills.
export function itemStatMods(item) {
  return item?.statMods || {};
}
export function skillStatMods(skill) {
  return skill?.effects?.stats || {};
}

export function derivedStats(state, character) {
  if (!character) return {};
  const base = character.stats || {};
  const out = { ...base };
  const items = state.items || [];
  const skills = state.skills || [];
  const equipped = (character.equipped || []).map(id => items.find(i => i.id === id)).filter(Boolean);
  const active = (character.activeSkills || []).map(id => skills.find(s => s.id === id)).filter(Boolean);
  for (const it of equipped) {
    for (const [k, v] of Object.entries(itemStatMods(it))) out[k] = (out[k] || 0) + v;
  }
  for (const sk of active) {
    for (const [k, v] of Object.entries(skillStatMods(sk))) out[k] = (out[k] || 0) + v;
  }
  return out;
}

// Suggestion drawer: scope key (used for caching per-entity).
export function suggestionScopeKey(scope) {
  if (!scope) return 'whole';
  return `${scope.kind}:${scope.id}`;
}
export function suggestionsForScope(state, scope) {
  const key = suggestionScopeKey(scope);
  return state.suggestionDrawer?.byScope?.[key] || { open: [], snoozed: [], dismissed: [], accepted: [] };
}

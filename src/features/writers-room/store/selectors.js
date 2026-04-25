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

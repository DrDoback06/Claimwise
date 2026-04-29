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
// 2026-04 rename: prefer questById; threadById is a back-compat alias.
export function questById(state, id) { return (state.quests || state.threads || []).find(q => q.id === id) || null; }
export const threadById = questById;
export function itemById(state, id) { return (state.items || []).find(i => i.id === id) || null; }

export function questsForCharacter(state, charId) {
  return (state.quests || state.threads || []).filter(q =>
    (q.characters || []).includes(charId) ||
    (q.sides || []).some(s => (s.members || []).includes(charId))
  );
}
export const threadsForCharacter = questsForCharacter;

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

// ─── Item RPG math (CODE-INSIGHT §6 + Diablo II layer) ──────────────
// An Item's full stat contribution is base statMods + every affix's mods +
// every socketed gem's mods + the matched runeword's bonus + the set bonus
// owed to the equipping character.

export function itemStatMods(item) {
  return item?.statMods || {};
}
export function skillStatMods(skill) {
  return skill?.effects?.stats || {};
}

function mergeMods(target, source) {
  for (const [k, v] of Object.entries(source || {})) {
    target[k] = (target[k] || 0) + v;
  }
  return target;
}

// Imports kept lazy to avoid pulling data into hot paths if a project never
// uses Diablo-II depth.
let _affixIndex = null;
let _gemIndex = null;
let _runewords = null;
let _sets = null;
function affixIndex() {
  if (!_affixIndex) {
    try {
      // eslint-disable-next-line global-require
      const { ALL_AFFIXES } = require('../data/affixes');
      _affixIndex = new Map(ALL_AFFIXES.map(a => [a.id, a]));
    } catch { _affixIndex = new Map(); }
  }
  return _affixIndex;
}
function gemIndex() {
  if (!_gemIndex) {
    try {
      // eslint-disable-next-line global-require
      const { ALL_GEMS } = require('../data/gems');
      // eslint-disable-next-line global-require
      const { RUNES } = require('../data/runewords');
      _gemIndex = new Map([...ALL_GEMS, ...RUNES].map(g => [g.id, g]));
    } catch { _gemIndex = new Map(); }
  }
  return _gemIndex;
}
function runewords() {
  if (!_runewords) {
    try {
      // eslint-disable-next-line global-require
      const { RUNEWORDS, matchRuneword } = require('../data/runewords');
      _runewords = { all: RUNEWORDS, match: matchRuneword };
    } catch { _runewords = { all: [], match: () => null }; }
  }
  return _runewords;
}
function sets() {
  if (!_sets) {
    try {
      // eslint-disable-next-line global-require
      const { SETS } = require('../data/sets');
      _sets = new Map(SETS.map(s => [s.id, s]));
    } catch { _sets = new Map(); }
  }
  return _sets;
}

// Compute the full stat contribution of a single item (independent of who
// wears it; set bonuses come in via deriveStats below).
export function itemTotalMods(item) {
  if (!item) return {};
  const out = {};
  mergeMods(out, item.statMods || {});
  const affixIdx = affixIndex();
  for (const aid of (item.affixes || [])) {
    const a = typeof aid === 'string' ? affixIdx.get(aid) : (aid?.mods ? aid : affixIdx.get(aid?.id));
    if (a?.mods) mergeMods(out, a.mods);
  }
  const gemIdx = gemIndex();
  for (const sk of (item.sockets || [])) {
    const id = sk?.gemId || sk?.runeId;
    if (!id) continue;
    const g = gemIdx.get(id);
    if (g?.mods) mergeMods(out, g.mods);
  }
  // Runeword: if all sockets are filled with runes that match a runeword,
  // add the runeword bonus.
  const rw = runewords();
  const filledSockets = (item.sockets || []).filter(s => s?.runeId);
  if (filledSockets.length === (item.sockets || []).length && filledSockets.length > 0) {
    const matched = rw.match(item.sockets);
    if (matched) mergeMods(out, matched.bonus || {});
  }
  return out;
}

// What runeword (if any) is currently active on this item?
export function activeRuneword(item) {
  const rw = runewords();
  return item?.sockets?.length ? rw.match(item.sockets) : null;
}

// Set bonuses: given a character with N pieces of a set equipped, return the
// summed bonus mods.
export function setBonusForCharacter(state, character) {
  const out = {};
  if (!character) return out;
  const equipped = (character.equipped || []).map(id => (state.items || []).find(i => i.id === id)).filter(Boolean);
  const setMap = sets();
  const counts = new Map();
  for (const it of equipped) {
    if (!it.setId) continue;
    counts.set(it.setId, (counts.get(it.setId) || 0) + 1);
  }
  for (const [setId, n] of counts.entries()) {
    const def = setMap.get(setId);
    if (!def) continue;
    // Apply the highest-tier bonus we qualify for.
    const tiers = Object.keys(def.bonuses || {}).map(Number).filter(t => t <= n).sort((a, b) => b - a);
    for (const t of tiers) {
      mergeMods(out, def.bonuses[t]);
      break;
    }
  }
  return out;
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
    for (const [k, v] of Object.entries(itemTotalMods(it))) out[k] = (out[k] || 0) + v;
  }
  for (const sk of active) {
    for (const [k, v] of Object.entries(skillStatMods(sk))) out[k] = (out[k] || 0) + v;
  }
  // Apply allStats fan-out: every set/affix that grants `allStats` bumps
  // every numeric stat by that amount.
  if (out.allStats) {
    const fan = out.allStats;
    for (const k of Object.keys(out)) {
      if (k !== 'allStats' && typeof out[k] === 'number') out[k] = (out[k] || 0) + fan;
    }
    delete out.allStats;
  }
  // Set bonuses (computed across all equipped pieces, not per-item).
  const setBonus = setBonusForCharacter(state, character);
  for (const [k, v] of Object.entries(setBonus)) out[k] = (out[k] || 0) + v;
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

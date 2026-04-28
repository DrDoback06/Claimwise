// Loomwright — inline entity highlighting (plan §7) + 2026-04 wiki-link
// upgrade.
//
// Post-process the contenteditable's HTML *after* a save: find known
// entity names and wrap them in <span data-lw-entity-kind data-lw-entity-id>.
// The span has zero structural impact (display:inline) so the cursor
// preserved state survives a re-render.
//
// Highlights now cover:
//   character, place, item, skill, quest, faction
// Per-kind colour comes from theme.PANEL_ACCENT so the prose reads like
// a colour-keyed wiki (cast=blue, places=green, items=amber, etc).
// Click on a highlighted span opens the quick-link popover.

import { PANEL_ACCENT, PLACE_COLORS } from '../theme';

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const KIND_TO_PANEL = {
  character: 'cast',
  place: 'atlas',
  item: 'items',
  skill: 'skills',
  quest: 'quests',
  faction: 'cast',
};

export function panelForKind(kind) { return KIND_TO_PANEL[kind] || null; }

// Turn a paragraph's plain text into HTML with marker spans for any
// known entity that matches by name or alias. Returns null when there
// are no known entities or no matches — caller falls back to escapeHtml.
export function decorateText(text, knownEntities) {
  if (!text || !knownEntities?.length) return null;
  const tokens = [];
  for (const e of knownEntities) {
    if (!e.name) continue;
    tokens.push({ pattern: e.name, ent: e });
    for (const a of e.aliases || []) {
      if (a) tokens.push({ pattern: a, ent: e });
    }
  }
  // Longest-first so multi-word names match before sub-words.
  tokens.sort((a, b) => b.pattern.length - a.pattern.length);
  if (!tokens.length) return null;
  const re = new RegExp(`\\b(${tokens.map(t => escapeRegExp(t.pattern)).join('|')})\\b`, 'g');
  let out = '', last = 0, m;
  let matched = 0;
  while ((m = re.exec(text)) !== null) {
    out += escapeHtml(text.slice(last, m.index));
    const phrase = m[0];
    const tok = tokens.find(t => t.pattern === phrase);
    const e = tok?.ent;
    if (e) {
      matched++;
      const color = e._color || PANEL_ACCENT[KIND_TO_PANEL[e._kind]] || '#888';
      // CSS class drives hover/active; inline border sets the kind colour.
      out += `<span class="lw-entity" data-lw-entity-kind="${e._kind}" data-lw-entity-id="${e.id}" data-lw-entity-name="${escapeAttr(e.name)}" style="border-bottom: 1.5px solid ${color}; cursor: pointer;">${escapeHtml(phrase)}</span>`;
    } else {
      out += escapeHtml(phrase);
    }
    last = m.index + phrase.length;
  }
  out += escapeHtml(text.slice(last));
  return matched > 0 ? out : null;
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
function escapeAttr(s) {
  return (s || '').replace(/["&<>]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  })[c]);
}

// Build the unified known-entities list for highlighting. Sourced from
// every slice that has an addressable canon entity. Each entry carries
// the colour the prose span should use as its underline.
export function buildKnownEntities(store, theme) {
  const out = [];
  for (const c of store.cast || []) {
    out.push({
      _kind: 'character', _color: c.color || PANEL_ACCENT.cast,
      id: c.id, name: c.name, aliases: c.aliases || [],
    });
  }
  for (const p of store.places || []) {
    out.push({
      _kind: 'place', _color: PLACE_COLORS[p.kind] || PANEL_ACCENT.atlas,
      id: p.id, name: p.name, aliases: [],
    });
  }
  for (const it of store.items || []) {
    out.push({
      _kind: 'item', _color: PANEL_ACCENT.items,
      id: it.id, name: it.name, aliases: [],
    });
  }
  for (const s of store.skills || []) {
    out.push({
      _kind: 'skill', _color: PANEL_ACCENT.tangle,
      id: s.id, name: s.name, aliases: [],
    });
  }
  for (const q of store.quests || []) {
    const name = q.name || q.title;
    if (!name) continue;
    out.push({
      _kind: 'quest', _color: q.color || PANEL_ACCENT.threads,
      id: q.id, name, aliases: [],
    });
  }
  for (const f of store.factions || []) {
    if (!f.name) continue;
    out.push({
      _kind: 'faction', _color: PANEL_ACCENT.voice,
      id: f.id, name: f.name, aliases: [],
    });
  }
  return out;
}

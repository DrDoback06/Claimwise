// Loomwright — inline entity highlighting (plan §7).
//
// We post-process the contenteditable's HTML *after* a save: find known
// entity names and wrap them in <span data-lw-entity-kind data-lw-entity-id>.
// The span has zero structural impact (display:inline) so the cursor
// preserved state survives a re-render.

import { useTheme, PLACE_COLORS } from '../theme';

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Turn a paragraph's plain text into HTML with marker spans for any
// known entity that matches by name or alias.
export function decorateText(text, knownEntities) {
  if (!text || !knownEntities?.length) return null;
  // Build one alternation regex sorted by length desc so longer names match first.
  const tokens = [];
  for (const e of knownEntities) {
    if (!e.name) continue;
    tokens.push({ pattern: e.name, ent: e });
    for (const a of e.aliases || []) {
      if (a) tokens.push({ pattern: a, ent: e });
    }
  }
  tokens.sort((a, b) => b.pattern.length - a.pattern.length);
  if (!tokens.length) return null;
  const re = new RegExp(`\\b(${tokens.map(t => escapeRegExp(t.pattern)).join('|')})\\b`, 'g');
  let out = '', last = 0, m;
  while ((m = re.exec(text)) !== null) {
    out += escapeHtml(text.slice(last, m.index));
    const matched = m[0];
    const tok = tokens.find(t => t.pattern === matched);
    const e = tok?.ent;
    if (e) {
      out += `<span data-lw-entity-kind="${e._kind}" data-lw-entity-id="${e.id}" style="border-bottom: 1px dashed ${e._color}; cursor: pointer;">${escapeHtml(matched)}</span>`;
    } else {
      out += escapeHtml(matched);
    }
    last = m.index + matched.length;
  }
  out += escapeHtml(text.slice(last));
  return out;
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// Build the unified known-entities list for highlighting.
export function buildKnownEntities(store, theme) {
  const out = [];
  for (const c of store.cast || []) {
    out.push({
      _kind: 'character', _color: c.color || theme.accent,
      id: c.id, name: c.name, aliases: c.aliases || [],
    });
  }
  for (const p of store.places || []) {
    out.push({
      _kind: 'place', _color: PLACE_COLORS[p.kind] || theme.accent,
      id: p.id, name: p.name, aliases: [],
    });
  }
  for (const it of store.items || []) {
    out.push({
      _kind: 'item', _color: theme.warn,
      id: it.id, name: it.name, aliases: [],
    });
  }
  return out;
}

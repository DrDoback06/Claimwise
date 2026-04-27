// Loomwright — AI item-craft service (CODE-INSIGHT §6).
//
// One call → one freshly minted item. The model returns: the item draft,
// any stats / skills it referenced that don't exist yet, and a wiki origin
// paragraph. Caller decides how to commit (review wizard).

import aiService from '../../../services/aiService';
import { ALL_AFFIXES } from '../data/affixes';
import { ALL_GEMS } from '../data/gems';
import { RUNEWORDS, RUNES } from '../data/runewords';
import { SETS } from '../data/sets';
import { composeSystem } from '../ai/context';

function rid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

function knownStatsFromState(state) {
  const set = new Set();
  for (const c of state.cast || []) for (const k of Object.keys(c.stats || {})) set.add(k);
  for (const i of state.items || []) for (const k of Object.keys(i.statMods || {})) set.add(k);
  for (const s of state.skills || []) for (const k of Object.keys(s.effects?.stats || {})) set.add(k);
  return [...set];
}

function knownSkills(state) {
  return (state.skills || []).map(s => ({ id: s.id, name: s.name }));
}

function safeParse(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (s.startsWith('```')) s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first < 0 || last <= first) return null;
  try { return JSON.parse(s.slice(first, last + 1)); } catch { return null; }
}

function buildSystemPrompt(state) {
  const persona = [
    'You are an items master for a fantasy series with Diablo II-style mechanics.',
    'Mint a single item from the writer\'s prompt. Use existing stats / skills when possible; only invent new ones if the prompt clearly calls for them. The item must feel native to the saga in the project context below.',
  ].join(' ');

  const extra = [
    'Known stats: ' + (knownStatsFromState(state).join(', ') || '(none yet)'),
    'Known skills: ' + (knownSkills(state).map(s => `${s.id}::${s.name}`).join(', ') || '(none yet)'),
    '',
    'Existing affixes you can reference by id (do NOT invent new affix ids):',
    ALL_AFFIXES.slice(0, 28).map(a => `- ${a.id} (${a.kind}) ${a.name}`).join('\n'),
    '',
    'Existing runewords you can reference: ' + RUNEWORDS.map(r => r.id).join(', '),
    'Existing sets you can reference: ' + SETS.map(s => s.id).join(', '),
    '',
    'Return ONLY this JSON (no commentary):',
    '{"item":{"name":"...","slot":"...","kind":"weapon|armor|charm|...","rarity":"common|magic|rare|legendary|unique|mythic","weight":1.0,"description":"...","statMods":{"STR":2,"DEX":1},"affixes":["pre_keen"],"sockets":[{}, {}],"setId":null,"grantedSkills":["sk_existing_id"]},"missingStats":[{"key":"STAMINA","description":"..."}],"missingSkills":[{"name":"Death Blow","tier":"adept","description":"...","effects":{"stats":{"STR":2}}}],"wikiDraft":"<short origin paragraph rooted in the saga lore>"}',
  ].join('\n');

  return composeSystem({
    state, persona,
    focusCharId: state.ui?.selection?.character || null,
    slice: ['cast', 'items', 'skills'],
    extra,
  });
}

export async function craftItem(state, userPrompt, opts = {}) {
  const sys = buildSystemPrompt(state);
  const prompt = `Writer's request:\n${userPrompt}\n\nMint the item now.`;
  let raw = '';
  try {
    raw = await aiService.callAI(prompt, opts.task || 'creative-deep', sys, { useCache: false });
  } catch (err) {
    return { error: err?.message || 'craft failed', item: null };
  }
  const parsed = safeParse(raw);
  if (!parsed?.item) return { error: 'parse failed', raw, item: null };

  const it = parsed.item;
  // Normalise sockets array: AI sometimes returns ["", ""] or [{}].
  const sockets = Array.isArray(it.sockets)
    ? it.sockets.map(s => (typeof s === 'object' && s ? s : {}))
    : [];

  const item = {
    id: rid('it'),
    name: it.name || 'Unnamed item',
    kind: it.kind || 'item',
    slot: it.slot || '',
    rarity: ['common', 'magic', 'rare', 'legendary', 'unique', 'mythic'].includes(it.rarity)
      ? it.rarity : 'common',
    weight: typeof it.weight === 'number' ? it.weight : 1,
    description: it.description || '',
    statMods: it.statMods || {},
    affixes: Array.isArray(it.affixes) ? it.affixes.filter(a => typeof a === 'string') : [],
    sockets,
    setId: it.setId || null,
    grantedSkills: Array.isArray(it.grantedSkills) ? it.grantedSkills : [],
    inBank: true,
    draftedByLoom: true,
    createdAt: Date.now(),
  };

  return {
    item,
    missingStats: Array.isArray(parsed.missingStats) ? parsed.missingStats : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
    wikiDraft: parsed.wikiDraft || '',
    raw,
  };
}

// Loomwright — Layer 1 foundation extractor.
//
// Ported from the legacy canonExtractionPipeline + chapterDataExtractionService
// pattern: small focused prompts with concrete examples, chunk overlap so
// entities near a chunk boundary aren't missed, and per-call failure
// isolation so a parse error in one category doesn't take down the rest.
//
// Three calls per chunk:
//   A) entities — characters, places, items, skills (the roster).
//   B) story    — quests, plot threads (the narrative spine).
//   C) network  — relationships, factions, lore (who-is-with-whom + world).
//
// Each call asks for a SMALL JSON envelope so the response fits in one shot
// even at gpt-4o-mini's 8K cap. Across 5 KB chunks of a normal manuscript
// each call returns 1-2 KB of JSON.
//
// Outputs are unified into a `findings` array keyed by `kind` so the
// existing pipeline.js bucketing and review-queue routing keep working.

import aiService from '../../../services/aiService';
import { composeSystem } from '../ai/context';
import { reconcileFindings } from '../ai/entityMatch';
import { safeParseJson } from '../ai/jsonExtract';

const CHUNK_SIZE = 5000;
const CHUNK_OVERLAP = 500;

function rid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

function chunk(text) {
  const t = text || '';
  if (t.length <= CHUNK_SIZE) return [{ index: 0, text: t, charStart: 0 }];
  const out = [];
  let start = 0;
  let index = 0;
  while (start < t.length) {
    const end = Math.min(t.length, start + CHUNK_SIZE);
    out.push({ index, text: t.slice(start, end), charStart: start });
    if (end >= t.length) break;
    start = end - CHUNK_OVERLAP;
    index++;
  }
  return out;
}

// ─── Prompts ─────────────────────────────────────────────────────────────

const ENTITIES_PERSONA =
  'You are a roster scribe. From the chapter chunk, surface every named ' +
  'character, place, item, and skill. Skip generic nouns. Include quiet ' +
  'mentions ("the postman", "her sister Mira") even if unnamed at first ' +
  'mention — give them a "<unnamed>" name and a short description.';

const ENTITIES_SCHEMA = [
  'Return ONLY this JSON, no commentary:',
  '{',
  '  "characters": [',
  '    {"name":"<exact>","role":"protagonist|antagonist|support|minor|cameo","description":"<1 line>","traits":["<trait>"],"isNew":true,"confidence":0.0}',
  '  ],',
  '  "places": [',
  '    {"name":"<exact>","kind":"settlement|building|landmark|region|interior|other","description":"<1 line>","isNew":true,"confidence":0.0}',
  '  ],',
  '  "items": [',
  '    {"name":"<exact>","kind":"weapon|tool|object|gift|document|other","description":"<1 line>","owner":"<character if known>","isNew":true,"confidence":0.0}',
  '  ],',
  '  "skills": [',
  '    {"name":"<exact>","description":"<1 line>","user":"<character if known>","action":"used|gained|improved|mastered","tier":"novice|adept|master|unique","isNew":true,"confidence":0.0}',
  '  ]',
  '}',
  '',
  'Examples of progression cues that count as "skills" — not just RPG verbs:',
  '  "She finally learned to apologise"  → skill: apology, action:gained',
  '  "Tom\'s diplomacy had grown sharper" → skill: diplomacy, action:improved',
  '  "He cast Fireball at the goblin"     → skill: Fireball, action:used',
  '',
  'Set isNew=false ONLY if the entity is in the canon list above.',
  'Confidence 0..1 — drop below 0.55 unless explicitly described.',
].join('\n');

const STORY_PERSONA =
  'You are a story-spine scribe. From the chunk, surface ongoing quests / ' +
  'goals / pursuits / ambitions and broader plot arcs. A QUEST is a ' +
  'specific goal with stakes ("clear his debts before the eviction"). A ' +
  'PLOT is a longer thread ("the slow death of his marriage"). Skip mere ' +
  'situations.';

const STORY_SCHEMA = [
  'Return ONLY this JSON:',
  '{',
  '  "quests": [',
  '    {"name":"<short title>","description":"<1 line>","kind":"main-quest|side-quest|rivalry|investigation|chase|romance|escape|recovery|negotiation","severity":"low|medium|high","characters":["<name>"],"isNew":true,"confidence":0.0}',
  '  ],',
  '  "plots": [',
  '    {"title":"<short title>","description":"<1 line>","status":"setup|development|crisis|climax|resolution","characters":["<name>"],"confidence":0.0}',
  '  ]',
  '}',
  '',
  'Skip if the chunk is purely descriptive prose. Confidence 0..1.',
].join('\n');

const NETWORK_PERSONA =
  'You are a social/world scribe. From the chunk, surface (a) relationships ' +
  'between characters, (b) factions / orgs / collectives anyone belongs to, ' +
  'and (c) bits of worldbuilding lore (customs, history, rules). Be ' +
  'GENRE-AGNOSTIC: a faction is as much a "council of bureaucrats" as a ' +
  '"thieves\' guild". Lore is as much "people queue politely in this town" ' +
  'as "magic costs years of life".';

const NETWORK_SCHEMA = [
  'Return ONLY this JSON:',
  '{',
  '  "relationships": [',
  '    {"a":"<character name>","b":"<character name>","kind":"<short, e.g. friend|rival|sibling|spouse|ally|enemy|mentor|colleague|parent|stranger>","strength":-1.0,"reason":"<1 line evidence>","confidence":0.0}',
  '  ],',
  '  "factions": [',
  '    {"name":"<exact>","type":"guild|council|family|order|company|crew|gang|clan|movement|other","description":"<1 line>","members":["<character name>"],"goals":"<short>","stance":"hostile|neutral|allied","confidence":0.0}',
  '  ],',
  '  "lore": [',
  '    {"title":"<short>","category":"history|custom|rule|mythology|technology|geography|religion|economy|politics|other","description":"<1 line>","knownBy":["<character name>"],"confidence":0.0}',
  '  ]',
  '}',
  '',
  'strength is -1..1: -1 hostile, 0 neutral, +1 close. Confidence 0..1.',
].join('\n');

// ─── Single-call worker ─────────────────────────────────────────────────
//
// `skipList` is appended to the persona so the model treats canon names
// as background knowledge — they should NOT come back in the response.
// Massive token savings on a manuscript with a 50-character cast.

function buildSkipList(state) {
  const names = [];
  const push = (arr, key) => {
    for (const x of (arr || [])) {
      const n = x?.name || x?.title;
      if (n) names.push(`${key}:${n}`);
    }
  };
  push(state.cast, 'character');
  push(state.places, 'place');
  push(state.items, 'item');
  push(state.skills, 'skill');
  push(state.quests, 'quest');
  push(state.factions, 'faction');
  push(state.lore, 'lore');
  return names;
}

async function callExtractor(prompt, sysPersona, sysSchema, state, focusChapterId, label) {
  const skipList = buildSkipList(state);
  const skipNote = skipList.length
    ? '\n\nALREADY-CANON entities (do NOT re-emit these unless you observe a NEW interaction with them — focus your output on entities NOT in this list):\n  ' + skipList.slice(0, 200).join(', ')
    : '';
  const sys = composeSystem({
    state,
    persona: sysPersona + skipNote,
    focusChapterId,
    slice: ['cast', 'places', 'items', 'quests', 'skills'],
    extra: sysSchema,
  });
  let raw = '';
  try {
    raw = await aiService.callAI(prompt, 'analytical', sys, { useCache: false });
  } catch (err) {
    console.warn(`[foundation:${label}] AI call failed`, err?.message);
    return null;
  }
  const parsed = safeParseJson(raw);
  if (!parsed) {
    console.warn(`[foundation:${label}] unparseable response (${(raw || '').length} chars)`);
  }
  return parsed;
}

function asArray(x) { return Array.isArray(x) ? x : []; }

// ─── Public API ──────────────────────────────────────────────────────────

export async function runFoundationPass(state, chapterId) {
  const chapter = chapterId ? state.chapters?.[chapterId] : null;
  if (!chapter?.text || chapter.text.trim().length < 50) return [];

  const chunks = chunk(chapter.text);
  const seen = new Map();   // key -> finding (deduped across chunks)
  const relSeen = new Map();
  const factionSeen = new Map();
  const loreSeen = new Map();
  const plotSeen = new Map();

  let order = 0;
  function pushFinding(kind, raw) {
    if (!raw) return;
    const name = String(raw.name || raw.title || '').trim();
    if (!name || name === '<unnamed>') return;
    const key = `${kind}:${name.toLowerCase()}`;
    if (seen.has(key)) {
      // bump occurrenceCount so multi-chapter / multi-chunk presence is
      // reflected in the auto-apply gate.
      const cur = seen.get(key);
      cur.occurrences = (cur.occurrences || 1) + 1;
      cur.confidence = Math.max(cur.confidence, raw.confidence ?? 0.7);
      return;
    }
    seen.set(key, {
      id: rid('ef'),
      kind,
      status: raw.isNew === false ? 'known' : 'new',
      name,
      notes: raw.description || '',
      role: raw.role,
      class: raw.role || raw.kind,
      placeKind: kind === 'place' ? raw.kind : undefined,
      itemKind: kind === 'item' ? raw.kind : undefined,
      questKind: kind === 'quest' ? raw.kind : undefined,
      severity: raw.severity,
      tier: raw.tier,
      action: raw.action,
      user: raw.user,
      owner: raw.owner,
      traits: raw.traits || [],
      characters: raw.characters || [],
      occurrences: 1,
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.7,
      draft: { name, notes: raw.description || '' },
      sourceQuote: raw.sourceQuote || raw.quote || null,
      order: order++,
    });
  }

  for (const c of chunks) {
    const heading = `Chapter ${chapter.n || '?'}, chunk ${c.index + 1} of ${chunks.length}.`;

    // A) Roster — characters / places / items / skills.
    const aResp = await callExtractor(
      `${heading}\n\n---\n${c.text}\n---\n\nFollow the schema exactly. JSON only.`,
      ENTITIES_PERSONA, ENTITIES_SCHEMA, state, chapterId, 'entities'
    );
    if (aResp) {
      for (const x of asArray(aResp.characters)) pushFinding('character', x);
      for (const x of asArray(aResp.places))     pushFinding('place', x);
      for (const x of asArray(aResp.items))      pushFinding('item', x);
      for (const x of asArray(aResp.skills))     pushFinding('skill', x);
    }

    // B) Story spine — quests + plots.
    const bResp = await callExtractor(
      `${heading}\n\n---\n${c.text}\n---\n\nFollow the schema. JSON only.`,
      STORY_PERSONA, STORY_SCHEMA, state, chapterId, 'story'
    );
    if (bResp) {
      for (const q of asArray(bResp.quests)) pushFinding('quest', q);
      for (const p of asArray(bResp.plots)) {
        const key = (p.title || '').toLowerCase().trim();
        if (!key || plotSeen.has(key)) continue;
        plotSeen.set(key, {
          id: rid('plot'),
          title: p.title,
          description: p.description || '',
          status: p.status || 'development',
          characters: p.characters || [],
          chapterId,
          confidence: typeof p.confidence === 'number' ? p.confidence : 0.7,
          draftedByLoom: true,
        });
      }
    }

    // C) Network — relationships / factions / lore.
    const cResp = await callExtractor(
      `${heading}\n\n---\n${c.text}\n---\n\nFollow the schema. JSON only.`,
      NETWORK_PERSONA, NETWORK_SCHEMA, state, chapterId, 'network'
    );
    if (cResp) {
      for (const r of asArray(cResp.relationships)) {
        const key = `${(r.a || '').toLowerCase()}|${(r.b || '').toLowerCase()}|${(r.kind || '').toLowerCase()}`;
        if (!key || relSeen.has(key)) continue;
        relSeen.set(key, {
          id: rid('rel'),
          a: r.a, b: r.b, kind: r.kind || 'related',
          strength: typeof r.strength === 'number' ? r.strength : 0,
          reason: r.reason || '',
          chapterId,
          confidence: typeof r.confidence === 'number' ? r.confidence : 0.65,
        });
      }
      for (const f of asArray(cResp.factions)) {
        const key = (f.name || '').toLowerCase().trim();
        if (!key || factionSeen.has(key)) continue;
        factionSeen.set(key, {
          id: rid('fac'),
          name: f.name,
          type: f.type || 'other',
          description: f.description || '',
          members: f.members || [],
          goals: f.goals || '',
          stance: f.stance || 'neutral',
          chapterId,
          confidence: typeof f.confidence === 'number' ? f.confidence : 0.7,
          draftedByLoom: true,
        });
      }
      for (const l of asArray(cResp.lore)) {
        const key = (l.title || '').toLowerCase().trim();
        if (!key || loreSeen.has(key)) continue;
        loreSeen.set(key, {
          id: rid('lore'),
          title: l.title,
          category: l.category || 'other',
          description: l.description || '',
          knownBy: l.knownBy || [],
          chapterId,
          confidence: typeof l.confidence === 'number' ? l.confidence : 0.65,
          draftedByLoom: true,
        });
      }
    }
  }

  // Reconcile against canon — flips status to 'known' + attaches resolvesTo
  // when a fuzzy match exists, so commit doesn't double-create.
  const findings = reconcileFindings([...seen.values()], state);
  // Attach the side-channel structures the pipeline consumes via property
  // bag (kept for back-compat with the existing pipeline.js routing).
  findings.relationships = [...relSeen.values()];
  findings.factions = [...factionSeen.values()];
  findings.lore = [...loreSeen.values()];
  findings.plots = [...plotSeen.values()];
  findings.entityEvents = [];     // Layer 2 produces these
  findings.proposedLinks = [];    // Layer 2 produces these
  return findings;
}

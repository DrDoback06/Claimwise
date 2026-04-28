// Loomwright — Layer 2 deep extractor.
//
// Runs AFTER Layer 1 has populated the canon roster, so prompts can reference
// known character/place/item names by-id. Pulls every kind of state change
// the legacy chapterDataExtractionService.extractCharacterDataFromChapter
// surfaced PLUS modern-fiction-friendly progression cues — emotional growth,
// social shifts, knowledge reveals, status changes that don't fit RPG stats.
//
// Five focused calls per chunk, run sequentially so a parse failure in one
// doesn't abort the rest:
//
//   1) appearances + stat changes + skill changes
//   2) inventory / location / status changes
//   3) knowledge / promise / revelation changes
//   4) relationship deltas (existing relationships shifting)
//   5) plot beats + emotional beats + decisions
//
// Each response stays small (<= ~1.5 KB JSON) so 8K cap is safe.

import aiService from '../../../services/aiService';
import { composeSystem } from '../ai/context';
import { safeParseJson } from '../ai/jsonExtract';
import entityMatchingService from '../../../services/entityMatchingService';

const CHUNK_SIZE = 5000;
const CHUNK_OVERLAP = 500;

function rid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }
function chunk(text) {
  const t = text || '';
  if (t.length <= CHUNK_SIZE) return [{ index: 0, text: t }];
  const out = []; let s = 0; let i = 0;
  while (s < t.length) {
    const e = Math.min(t.length, s + CHUNK_SIZE);
    out.push({ index: i, text: t.slice(s, e) });
    if (e >= t.length) break;
    s = e - CHUNK_OVERLAP; i++;
  }
  return out;
}

// ─── Personas + schemas ─────────────────────────────────────────────────

const CORE_PERSONA =
  'You are a continuity scribe. Surface ONLY EXPLICIT changes — do not ' +
  'invent. The chunk explicitly says someone "learnt", "lost", "felt", ' +
  '"became", "decided", "moved", "remembered", "told", or shows it. If a ' +
  'change is implied but not shown, skip it.';

const PROGRESSION_HINTS = [
  'Genre-agnostic progression cues — accept any of these as evidence of change:',
  '  STATS: "she felt stronger", "his patience finally cracked", "her resolve ' +
  'hardened", "+2 STR", "her wit dulled with grief", "he aged ten years that day".',
  '  SKILLS: "she finally learnt to apologise", "his negotiating sharpened", ' +
  '"he picked up the lute again after twenty years", "Fireball cast for the first time".',
  '  STATUS: "he was made redundant", "her debt cleared", "they were betrothed", ' +
  '"the fever broke", "exiled from the council", "homeless again".',
  '  KNOWLEDGE: "she learned that…", "he realised…", "the secret got out", ' +
  '"told her the truth", "the letter contained the date".',
  '  INVENTORY: "she pocketed the keys", "he gave the necklace away", "the' +
  ' contract was signed", "she lost her wallet on the train".',
  '  LOCATION: "boarded the train to Bristol", "moved to a smaller flat", ' +
  '"was finally let into the temple", "she walked back home".',
  '  PROMISES: "he swore he would return", "she broke her vow", "the deal ' +
  'was honoured at last".',
  '  EMOTIONAL: "she finally let herself cry", "he couldn\'t bring himself to ' +
  'speak", "shame turned to anger", "the grief loosened a little".',
].join('\n');

const CORE_SCHEMA = `Return ONLY this JSON:
{
  "appearances": [
    {"character":"<exact name>","firstMention":<bool>,"why":"<short reason character is on-page>","confidence":0.0}
  ],
  "statChanges": [
    {"character":"<name>","stat":"<short — accept STR/INT/HP-style or genre-neutral like patience|resolve|reputation|debt|stamina|grief>","delta":<int>,"qualitative":"<e.g. \\"hardened\\", \\"frayed\\">","reason":"<short>","confidence":0.0}
  ],
  "skillChanges": [
    {"character":"<name>","skill":"<short>","action":"used|gained|improved|mastered|lost","level":1,"reason":"<short>","confidence":0.0}
  ]
}`;

const STATE_SCHEMA = `Return ONLY this JSON:
{
  "inventoryChanges": [
    {"character":"<name>","item":"<name>","action":"acquired|lost|gave|received|equipped|broke","location":"<optional place>","reason":"<short>","confidence":0.0}
  ],
  "locationChanges": [
    {"character":"<name>","location":"<place name>","action":"moved|arrived|left|fled|exiled","reason":"<short>","confidence":0.0}
  ],
  "statusChanges": [
    {"character":"<name>","status":"<short e.g. employed|engaged|sick|exiled|wealthy|in-debt|imprisoned|reborn>","action":"gained|lost|changed","reason":"<short>","confidence":0.0}
  ]
}`;

const REVEAL_SCHEMA = `Return ONLY this JSON:
{
  "knowledgeChanges": [
    {"character":"<name>","fact":"<short>","action":"learned|revealed|forgot|told","fromCharacter":"<optional>","confidence":0.0}
  ],
  "promiseChanges": [
    {"character":"<name>","promise":"<short>","action":"made|kept|broke|forgave","toCharacter":"<optional>","confidence":0.0}
  ],
  "revelations": [
    {"summary":"<the reveal in one line>","characters":["<who is affected>"],"impact":"<low|medium|high>","confidence":0.0}
  ]
}`;

const REL_SCHEMA = `Return ONLY this JSON:
{
  "relationshipChanges": [
    {"a":"<character>","b":"<character>","kind":"<short, e.g. friend|rival|mentor|estranged|romantic|colleague>","action":"formed|deepened|strained|broken|reconciled","strength":-1.0,"reason":"<short>","confidence":0.0}
  ]
}`;

const BEATS_SCHEMA = `Return ONLY this JSON:
{
  "plotBeats": [
    {"summary":"<the beat in one line>","status":"setup|rising|crisis|climax|falling|resolution","characters":["<name>"],"plotTitle":"<optional thread title>","confidence":0.0}
  ],
  "emotionalBeats": [
    {"character":"<name>","emotion":"<grief|relief|fear|rage|shame|joy|love|despair|hope|resolve|other>","trigger":"<short>","intensity":"<low|medium|high>","confidence":0.0}
  ],
  "decisions": [
    {"character":"<name>","decision":"<one line>","stake":"<what's at risk>","confidence":0.0}
  ]
}`;

// ─── Single-call worker ─────────────────────────────────────────────────

async function callDeep(prompt, persona, schema, state, focusChapterId, label) {
  const sys = composeSystem({
    state,
    persona: `${persona}\n\n${PROGRESSION_HINTS}`,
    focusChapterId,
    slice: ['cast', 'places', 'items', 'quests', 'skills'],
    extra: schema,
  });
  let raw = '';
  try {
    raw = await aiService.callAI(prompt, 'analytical', sys, { useCache: false });
  } catch (err) {
    console.warn(`[depth:${label}] AI call failed`, err?.message);
    return null;
  }
  const parsed = safeParseJson(raw);
  if (!parsed) console.warn(`[depth:${label}] unparseable response (${(raw || '').length} chars)`);
  return parsed;
}

function asArray(x) { return Array.isArray(x) ? x : []; }

// ─── Public API ──────────────────────────────────────────────────────────

export async function runDeepPass(state, chapterId) {
  const chapter = chapterId ? state.chapters?.[chapterId] : null;
  if (!chapter?.text || chapter.text.trim().length < 50) {
    return emptyDeep();
  }
  const cast = state.cast || [];
  const knownNames = cast.map(c => c.name).filter(Boolean).join(', ') || '(none yet)';
  const chunks = chunk(chapter.text);

  const merged = emptyDeep();
  const seen = new Set();
  const dedupe = (bucket, entry) => {
    const key = `${bucket}|${JSON.stringify(entry).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const heading = `Chapter ${chapter.n || '?'}, chunk ${i + 1} of ${chunks.length}.\nKnown characters: ${knownNames}`;
    const body = `\n\n---\n${c.text}\n---\n\nFollow the schema exactly. JSON only.`;

    const core = await callDeep(heading + body, CORE_PERSONA, CORE_SCHEMA, state, chapterId, 'core');
    if (core) {
      for (const e of asArray(core.appearances))   if (dedupe('app', e)) merged.appearances.push(stamp(e, i, chapterId));
      for (const e of asArray(core.statChanges))   if (dedupe('stat', e)) merged.statChanges.push(stamp(e, i, chapterId));
      for (const e of asArray(core.skillChanges))  if (dedupe('skill', e)) merged.skillChanges.push(stamp(e, i, chapterId));
    }

    const stateChanges = await callDeep(heading + body, CORE_PERSONA, STATE_SCHEMA, state, chapterId, 'state');
    if (stateChanges) {
      for (const e of asArray(stateChanges.inventoryChanges)) if (dedupe('inv', e)) merged.inventoryChanges.push(stamp(e, i, chapterId));
      for (const e of asArray(stateChanges.locationChanges))  if (dedupe('loc', e)) merged.locationChanges.push(stamp(e, i, chapterId));
      for (const e of asArray(stateChanges.statusChanges))    if (dedupe('status', e)) merged.statusChanges.push(stamp(e, i, chapterId));
    }

    const reveals = await callDeep(heading + body, CORE_PERSONA, REVEAL_SCHEMA, state, chapterId, 'reveals');
    if (reveals) {
      for (const e of asArray(reveals.knowledgeChanges)) if (dedupe('know', e)) merged.knowledgeChanges.push(stamp(e, i, chapterId));
      for (const e of asArray(reveals.promiseChanges))   if (dedupe('promise', e)) merged.promiseChanges.push(stamp(e, i, chapterId));
      for (const e of asArray(reveals.revelations))      if (dedupe('reveal', e)) merged.revelations.push(stamp(e, i, chapterId));
    }

    const rels = await callDeep(heading + body, CORE_PERSONA, REL_SCHEMA, state, chapterId, 'rels');
    if (rels) {
      for (const e of asArray(rels.relationshipChanges)) if (dedupe('rel', e)) merged.relationshipChanges.push(stamp(e, i, chapterId));
    }

    const beats = await callDeep(heading + body, CORE_PERSONA, BEATS_SCHEMA, state, chapterId, 'beats');
    if (beats) {
      for (const e of asArray(beats.plotBeats))      if (dedupe('beat', e)) merged.plotBeats.push(stamp(e, i, chapterId));
      for (const e of asArray(beats.emotionalBeats)) if (dedupe('emo', e)) merged.emotionalBeats.push(stamp(e, i, chapterId));
      for (const e of asArray(beats.decisions))      if (dedupe('dec', e)) merged.decisions.push(stamp(e, i, chapterId));
    }
  }

  return resolveActors(merged, cast);
}

function stamp(entry, i, chapterId) {
  return {
    ...entry,
    id: rid('dx'),
    confidence: typeof entry.confidence === 'number' ? entry.confidence : 0.7,
    sourceChunk: i,
    chapterId,
  };
}

function emptyDeep() {
  return {
    appearances: [], statChanges: [], skillChanges: [],
    inventoryChanges: [], locationChanges: [], statusChanges: [],
    knowledgeChanges: [], promiseChanges: [], revelations: [],
    relationshipChanges: [],
    plotBeats: [], emotionalBeats: [], decisions: [],
  };
}

// Legacy entityMatchingService gives us nickname-matching out of the box.
function resolveActors(merged, cast) {
  const matchOne = (name) => {
    if (!name) return null;
    const m = entityMatchingService.findMatchingActor(name, cast);
    if (!m?.actor) return null;
    return { id: m.actor.id, name: m.actor.name, matchType: m.matchType, confidence: m.confidence };
  };
  const resolveCharField = (a) => ({ ...a, resolved: matchOne(a.character) });
  return {
    ...merged,
    appearances: merged.appearances.map(resolveCharField),
    statChanges: merged.statChanges.map(resolveCharField),
    skillChanges: merged.skillChanges.map(resolveCharField),
    inventoryChanges: merged.inventoryChanges.map(resolveCharField),
    locationChanges: merged.locationChanges.map(resolveCharField),
    statusChanges: merged.statusChanges.map(resolveCharField),
    knowledgeChanges: merged.knowledgeChanges.map(resolveCharField),
    promiseChanges: merged.promiseChanges.map(resolveCharField),
    emotionalBeats: merged.emotionalBeats.map(resolveCharField),
    decisions: merged.decisions.map(resolveCharField),
    relationshipChanges: merged.relationshipChanges.map(r => ({
      ...r, resolvedA: matchOne(r.a), resolvedB: matchOne(r.b),
    })),
  };
}

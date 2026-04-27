// Loomwright — deep per-chapter character extraction pass.
//
// Ports the legacy chapterDataExtractionService.extractCharacterDataFromChapter
// into the modern pipeline. Pulls four kinds of facts the basic extraction
// pass misses:
//   • appearances        — who is on the page in this chapter
//   • statChanges        — explicit stat moves like "+2 STR"
//   • skillChanges       — gained / improved / mastered skills, with level
//   • relationshipChanges — how relationships shifted
//
// Plus a quest-involvement pass that connects characters to quest beats
// with a confidence score, so high-certainty matches can be auto-attached
// while everything else is suggested via the quests review queue.

import aiService from '../../../services/aiService';
import { composeSystem } from './context';
import entityMatchingService from '../../../services/entityMatchingService';
const findMatchingActor = (name, actors) => entityMatchingService.findMatchingActor(name, actors);

const CHUNK = 5000;

function chunk(text) {
  const out = [];
  for (let i = 0; i < text.length; i += CHUNK) out.push(text.slice(i, i + CHUNK));
  return out;
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

const PERSONA = [
  'You are a careful continuity scribe for a novel manuscript.',
  'For each chunk you receive, surface only EXPLICIT changes —',
  'a skill is "gained" only when the prose says someone learnt / discovered / acquired it,',
  'a stat changes only when the prose says strength rose / he grew taller / her wisdom deepened,',
  'a relationship shifts only when the prose explicitly shows the change.',
].join(' ');

const SCHEMA = `Return ONLY this JSON, no commentary:
{
  "appearances": [
    {"character":"<exact name>","firstMention":<bool>,"confidence":0.0}
  ],
  "statChanges": [
    {"character":"<exact name>","stat":"<short>","delta":<int>,"reason":"<short>","confidence":0.0}
  ],
  "skillChanges": [
    {"character":"<exact name>","skill":"<short>","action":"gained|improved|mastered","level":1,"reason":"<short>","confidence":0.0}
  ],
  "relationshipChanges": [
    {"a":"<character>","b":"<character>","kind":"<short>","strength":-1.0,"reason":"<short>","confidence":0.0}
  ],
  "inventoryChanges": [
    {"character":"<exact name>","item":"<exact name>","action":"acquired|lost|destroyed|gifted|transferred","place":"<place name or null>","reason":"<short>","confidence":0.0}
  ]
}
Only emit an inventoryChange when the prose explicitly shows the character taking, finding, losing, breaking, or giving the item. Do not invent ownership.`;

export async function runDeepCharacterPass(store, chapterId) {
  const chapter = chapterId ? store.chapters?.[chapterId] : null;
  if (!chapter?.text || chapter.text.length < 50) {
    return { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [], inventoryChanges: [] };
  }
  const cast = store.cast || [];
  const knownNames = cast.map(c => c.name).join(', ') || '(none yet)';
  const chunks = chunk(chapter.text);
  const sys = composeSystem({
    state: store,
    persona: PERSONA,
    focusChapterId: chapterId,
    slice: ['cast', 'skills', 'quests'],
    extra: SCHEMA,
  });

  const merged = { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [], inventoryChanges: [] };
  const seen = new Set();

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const prompt = [
      `Chapter ${chapter.n || '?'} — chunk ${i + 1} of ${chunks.length}:`,
      '',
      c,
      '',
      `Known characters: ${knownNames}`,
      '',
      'Extract every EXPLICIT change. JSON only.',
    ].join('\n');

    let raw = '';
    try {
      raw = await aiService.callAI(prompt, 'analytical', sys, { useCache: false });
    } catch (err) {
      console.warn('[deep-extract] chunk failed', i, err?.message);
      continue;
    }
    const parsed = safeParse(raw);
    if (!parsed) continue;

    for (const k of Object.keys(merged)) {
      const list = Array.isArray(parsed[k]) ? parsed[k] : [];
      for (const entry of list) {
        const key = `${k}|${JSON.stringify(entry).toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged[k].push({
          ...entry,
          confidence: typeof entry.confidence === 'number' ? entry.confidence : 0.7,
          sourceChunk: i,
          chapterId,
        });
      }
    }
  }

  return resolveActors(merged, cast, store.items || [], store.places || []);
}

// Replace bare character names with canonical actor IDs where possible
// so downstream commits can patch the right entity.
function resolveActors(merged, cast, items = [], places = []) {
  const matchOne = (name) => {
    if (!name) return null;
    const m = findMatchingActor(name, cast);
    if (!m || !m.actor) return null;
    return { id: m.actor.id, name: m.actor.name, matchType: m.matchType, confidence: m.confidence };
  };
  // Items + places use the same actor matcher (it's name-based, not actor-specific).
  const matchByName = (name, pool) => {
    if (!name) return null;
    const m = findMatchingActor(name, pool);
    if (!m || !m.actor) return null;
    return { id: m.actor.id, name: m.actor.name };
  };
  return {
    appearances: merged.appearances.map(a => ({ ...a, resolved: matchOne(a.character) })),
    statChanges: merged.statChanges.map(a => ({ ...a, resolved: matchOne(a.character) })),
    skillChanges: merged.skillChanges.map(a => ({ ...a, resolved: matchOne(a.character) })),
    relationshipChanges: merged.relationshipChanges.map(a => ({
      ...a,
      resolvedA: matchOne(a.a),
      resolvedB: matchOne(a.b),
    })),
    inventoryChanges: (merged.inventoryChanges || []).map(a => ({
      ...a,
      resolvedCharacter: matchOne(a.character),
      resolvedItem: matchByName(a.item, items),
      resolvedPlace: a.place ? matchByName(a.place, places) : null,
    })),
  };
}

// Quest-involvement pass: for every quest beat, decide which characters
// were involved. High-confidence matches (≥ 0.8) auto-attach; the rest go
// to the quests review queue as suggestions.
const QUEST_PERSONA =
  'You decide which characters were directly involved in a specific quest beat. ' +
  'A character is involved only if they ACTED IN, REACTED TO, or were the SUBJECT OF the beat. ' +
  'Pure mentions of someone\'s name do not count.';

const QUEST_SCHEMA = `Return ONLY this JSON:
{
  "involved": [
    {"character":"<exact name>","role":"actor|subject|witness","confidence":0.0,"reason":"<short>"}
  ]
}`;

export async function runQuestInvolvementPass(store, chapterId, quest) {
  const chapter = chapterId ? store.chapters?.[chapterId] : null;
  if (!chapter?.text || !quest) return [];
  const cast = store.cast || [];
  const knownNames = cast.map(c => c.name).join(', ') || '(none yet)';
  const sys = composeSystem({
    state: store,
    persona: QUEST_PERSONA,
    focusChapterId: chapterId,
    slice: ['cast', 'quests'],
    extra: QUEST_SCHEMA,
  });
  const beats = (quest.beats || []).slice(0, 5).map(b => `- ${b.text || b.summary || b}`).join('\n') || '(no beats yet)';
  const prompt = [
    `Quest: ${quest.name || quest.title}`,
    `Beats:`,
    beats,
    ``,
    `Chapter ${chapter.n || '?'} text (truncated):`,
    chapter.text.slice(0, 5000),
    ``,
    `Known characters: ${knownNames}`,
    ``,
    `Which characters were directly involved in this quest in this chapter? JSON only.`,
  ].join('\n');

  try {
    const raw = await aiService.callAI(prompt, 'analytical', sys, { useCache: false });
    const parsed = safeParse(raw);
    const list = Array.isArray(parsed?.involved) ? parsed.involved : [];
    return list.map(x => ({
      ...x,
      resolved: findMatchingActor(x.character, cast)?.actor || null,
    })).filter(x => x.resolved); // drop unresolvable names
  } catch (err) {
    console.warn('[deep-extract] quest involvement failed', err?.message);
    return [];
  }
}

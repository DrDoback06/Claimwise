// Loomwright — Today AI helpers. Generates daily sparks + morning brief
// + interview-style prompts, switching between starter mode (no chapters
// yet) and contextual mode (real story-aware suggestions).
//
// Adapted from src/loomwright/daily/dailyAI.js (legacy) — modern store
// shape, modern composeSystem context, JSON-strict outputs.

import aiService from '../../../services/aiService';
import { composeSystem } from '../ai/context';

export const KIND_META = {
  editor:        { label: 'Editor note',   color: 'oklch(78% 0.13 78)' },
  whatif:        { label: 'What-if',       color: 'oklch(72% 0.13 145)' },
  contradiction: { label: 'Contradiction', color: 'oklch(65% 0.18 25)' },
  drift:         { label: 'Voice drift',   color: 'oklch(72% 0.10 200)' },
  discovery:     { label: 'Discovery',     color: 'oklch(70% 0.13 300)' },
  prompt:        { label: 'Writing prompt', color: 'oklch(70% 0.13 80)' },
  interview:     { label: 'Interview cue', color: 'oklch(60% 0.13 300)' },
};

export const SEVERITY_META = {
  low:    { color: 'oklch(60% 0.04 60)' },
  medium: { color: 'oklch(78% 0.13 78)' },
  high:   { color: 'oklch(65% 0.18 25)' },
};

function safeParseJSON(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const m = s.match(/[{[][\s\S]*[\]}]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

function hasRealContent(store) {
  const order = store.book?.chapterOrder || [];
  const total = order.reduce((n, id) => n + ((store.chapters?.[id]?.text || '').trim().length), 0);
  return total > 400; // ~70 words
}

function recentChapters(store, n = 5) {
  const order = store.book?.chapterOrder || [];
  return order.slice(-n).map(id => store.chapters?.[id]).filter(Boolean);
}

// Starter sparks — for empty rooms. Genre-aware where possible (reads
// profile.genres / premise / tone). Handcrafted; no AI call needed.
export function starterSparks(store) {
  const profile = store.profile || {};
  const genres = (profile.genres || []).join(', ').toLowerCase() || 'literary';
  const tone = (profile.tone || []).join('/') || 'balanced';
  const premise = profile.premise || '';
  const out = [
    {
      id: 's_starter_open',
      kind: 'prompt',
      severity: 'medium',
      title: 'Open with a fixed image',
      body: `Write the first sentence of chapter one. Make it a single concrete image — a hand on a doorframe, a bird falling, a scar. ${tone ? `Lean into the ${tone} tone.` : ''}`,
    },
    {
      id: 's_starter_voice',
      kind: 'editor',
      severity: 'medium',
      title: 'Try three voices',
      body: 'Draft the same opening paragraph three times — one in past-omniscient, one in present-1st, one in 3rd-limited. Keep the one that surprises you.',
    },
    {
      id: 's_starter_who',
      kind: 'whatif',
      severity: 'medium',
      title: 'Who is the wrong protagonist?',
      body: premise ? `If the obvious protagonist of "${(premise || '').slice(0, 80)}…" stepped aside, who's standing behind them?` : 'Sketch the person who would be the protagonist if the obvious one stepped aside.',
    },
    {
      id: 's_starter_anchor',
      kind: 'discovery',
      severity: 'low',
      title: 'Place the saga in a single sentence',
      body: `Try this: "It began the way ${genres.includes('fantasy') ? 'every old story does' : 'these things tend to'} — with [event] in [place]."`,
    },
  ];
  return out;
}

// Contextual sparks — uses real chapter content + cast.
export async function generateSparks(store) {
  if (!hasRealContent(store)) return starterSparks(store);

  const recent = recentChapters(store, 5);
  const cast = (store.cast || []).slice(0, 8);

  const sys = composeSystem({
    state: store,
    persona: 'You are an editorial assistant producing 4–7 short "sparks" about the novel.',
    slice: ['cast', 'places', 'quests'],
  });

  const prompt = [
    `Each spark must be typed: editor | whatif | contradiction | drift | discovery | prompt | interview.`,
    ``,
    `Recent chapters (last ${recent.length}):`,
    recent.map(c => `- ch.${c.n} "${c.title}": ${(c.text || '').slice(0, 220)}`).join('\n'),
    ``,
    `Cast in scope:`,
    cast.map(a => `- ${a.id} :: ${a.name} (${a.role || 'support'})`).join('\n'),
    ``,
    `Return STRICT JSON, no commentary:`,
    `{`,
    `  "sparks": [`,
    `    { "id": "<unique>", "kind": "editor|whatif|contradiction|drift|discovery|prompt|interview",`,
    `      "severity": "low|medium|high", "title": "short title",`,
    `      "body": "1-3 sentences. For interview kind, phrase as a question for a SPECIFIC named character.",`,
    `      "linkedChapter": "<chapter id>", "linkedCharacter": "<character id if relevant, else null>" }`,
    `  ]`,
    `}`,
  ].join('\n');

  try {
    const raw = await aiService.callAI(prompt, 'analytical', sys);
    const parsed = safeParseJSON(raw);
    if (!parsed || !Array.isArray(parsed.sparks)) return [];
    return parsed.sparks.map((s, i) => ({ id: s.id || `spark_${Date.now()}_${i}`, ...s }));
  } catch (err) {
    console.warn('[today] generateSparks failed', err?.message);
    return [];
  }
}

export async function generateMorningBrief(store) {
  if (!hasRealContent(store)) {
    return {
      greeting: 'Welcome back.',
      summary: 'No chapters yet — the Loom is ready when you are. Start with a single sentence; the rest will follow.',
      sections: [
        { kind: 'noticed', title: 'Noticed', items: [{ id: 'n1', text: 'You\'ve set up the room. Time to write.' }] },
        { kind: 'ahead', title: 'Look ahead', items: [{ id: 'a1', text: 'Try the writing prompts below to find your opening line.' }] },
      ],
    };
  }
  const recent = recentChapters(store, 3);
  const sys = composeSystem({
    state: store,
    persona: 'You produce the writer\'s morning brief — short, warm, observant.',
    slice: ['cast', 'places', 'quests'],
  });
  const prompt = [
    `Recent chapters:`,
    recent.map(c => `- ch.${c.n} "${c.title}": ${(c.text || '').slice(0, 240)}`).join('\n'),
    ``,
    `Return STRICT JSON, no commentary:`,
    `{`,
    `  "greeting": "<warm 1 sentence>",`,
    `  "summary": "<2-3 sentences describing where the story stands today>",`,
    `  "sections": [`,
    `    { "kind": "noticed", "title": "Noticed",      "items": [{"id":"n1","text":"..."}] },`,
    `    { "kind": "worry",   "title": "Worry about",  "items": [] },`,
    `    { "kind": "delight", "title": "Delight in",   "items": [] },`,
    `    { "kind": "ahead",   "title": "Look ahead",   "items": [] }`,
    `  ]`,
    `}`,
  ].join('\n');
  try {
    const raw = await aiService.callAI(prompt, 'analytical', sys);
    return safeParseJSON(raw);
  } catch (err) {
    console.warn('[today] generateMorningBrief failed', err?.message);
    return null;
  }
}

const dailyAI = { generateSparks, generateMorningBrief, starterSparks, KIND_META, SEVERITY_META };
export default dailyAI;

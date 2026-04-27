// Loomwright — voice analysis service. Takes samples of a character's
// voice (or pasted prose) and asks the AI to derive a structured profile:
// natural-language description, fingerprint, tics, dialect notes, and
// optional dial values for the legacy heuristic.

import aiService from '../../../services/aiService';
import { composeSystem } from '../ai/context';

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
  'You are a voice coach analysing a character\'s speech and prose voice.',
  'Read every sample, then return a structured profile the writer can edit.',
  'Be specific. Reference actual words, sentence shapes, and rhythms from the samples — never generic adjectives.',
].join(' ');

const SCHEMA = [
  'Return ONLY this JSON:',
  '{',
  '  "description": "<2-4 sentence natural-language description of the voice — how they speak, what they avoid, what they reach for>",',
  '  "fingerprint": "<six-word headline phrase>",',
  '  "tics": ["<short verbal habit>", "..."],',
  '  "dialect": "<one line: era, region, social register, idiolect notes>",',
  '  "hooks": ["<phrase the character uses>", "..."],',
  '  "dials": {',
  '    "lyric": 0.0,         // 0=plain  ↔  1=lyric',
  '    "sentenceLen": 0.0,   // 0=short  ↔  1=long',
  '    "subordination": 0.0, // 0=parataxis ↔ 1=hypotactic',
  '    "sensoryDensity": 0.0,',
  '    "distance": 0.0,      // 0=close   ↔  1=distant',
  '    "tension": 0.0',
  '  }',
  '}',
].join('\n');

export async function analyzeVoice(state, { character, samples }) {
  const text = (samples || []).map(s => (typeof s === 'string' ? s : s?.text)).filter(Boolean).join('\n\n');
  if (!text || text.trim().length < 40) {
    return { error: 'Need at least a few sentences of sample text.' };
  }
  const sys = composeSystem({
    state,
    persona: PERSONA + (character ? ` The character being analysed is ${character.name}${character.role ? ' (' + character.role + ')' : ''}.` : ''),
    focusCharId: character?.id,
    slice: ['cast'],
    extra: SCHEMA,
  });

  const prompt = [
    'Voice samples:',
    '"""',
    text,
    '"""',
    '',
    'Analyse the voice now. JSON only.',
  ].join('\n');

  let raw = '';
  try {
    raw = await aiService.callAI(prompt, 'analytical', sys, { useCache: false });
  } catch (err) {
    return { error: err?.message || 'voice analysis failed' };
  }
  const parsed = safeParse(raw);
  if (!parsed) return { error: 'parse failed', raw };

  return {
    description: typeof parsed.description === 'string' ? parsed.description : '',
    fingerprint: typeof parsed.fingerprint === 'string' ? parsed.fingerprint : '',
    tics: Array.isArray(parsed.tics) ? parsed.tics.filter(Boolean).slice(0, 12) : [],
    dialect: typeof parsed.dialect === 'string' ? parsed.dialect : '',
    hooks: Array.isArray(parsed.hooks) ? parsed.hooks.filter(Boolean).slice(0, 12) : [],
    dials: clampDials(parsed.dials),
  };
}

function clampDials(d) {
  if (!d || typeof d !== 'object') return null;
  const keys = ['lyric', 'sentenceLen', 'subordination', 'sensoryDensity', 'distance', 'tension'];
  const out = {};
  for (const k of keys) {
    const n = Number(d[k]);
    if (Number.isFinite(n)) out[k] = Math.max(0, Math.min(1, n));
  }
  return out;
}

/**
 * voiceAI — rewrite a sample paragraph according to seven voice dimensions.
 */

import aiService from '../../services/aiService';

export const VOICE_DIMENSIONS = [
  { key: 'formality',  label: 'Formality',       low: 'Colloquial', high: 'Formal' },
  { key: 'rhythm',     label: 'Rhythm',          low: 'Flowing',    high: 'Staccato' },
  { key: 'length',     label: 'Sentence length', low: 'Long',       high: 'Short' },
  { key: 'lyricism',   label: 'Lyricism',        low: 'Plain',      high: 'Lyrical' },
  { key: 'darkness',   label: 'Darkness',        low: 'Bright',     high: 'Grim' },
  { key: 'pov',        label: 'POV distance',    low: 'Close',      high: 'Distant' },
  { key: 'modernity',  label: 'Vocabulary',      low: 'Archaic',     high: 'Modern' },
];

export const DEFAULT_SLIDERS = {
  formality: 40,
  rhythm: 55,
  length: 45,
  lyricism: 60,
  darkness: 50,
  pov: 30,
  modernity: 50,
};

export function defaultProfile(idSuffix = '') {
  return {
    id: `vp_${Date.now()}_${idSuffix}${Math.random().toString(36).slice(2, 6)}`,
    name: 'Untitled voice',
    subtitle: '',
    sliders: { ...DEFAULT_SLIDERS },
    sample: '',
    createdAt: Date.now(),
    source: 'manual',
  };
}

function describeSliders(sliders) {
  return VOICE_DIMENSIONS.map((d) => {
    const v = sliders[d.key] ?? 50;
    const bias = v > 60 ? d.high : v < 40 ? d.low : 'balanced';
    return `${d.label}: ${bias} (${v}/100)`;
  }).join('; ');
}

export async function rewriteInVoice(source, sliders) {
  const prompt = [
    `Rewrite the passage below so it reads in a voice described by these dimensions:`,
    describeSliders(sliders),
    ``,
    `PASSAGE:`,
    String(source || ''),
    ``,
    `Rules:`,
    `- Keep events and facts identical.`,
    `- Shift only diction, sentence shape, cadence, and imagery.`,
    `- Return ONLY the rewritten passage, no commentary.`,
  ].join('\n');
  try {
    const response = await aiService.callAI(prompt, 'voice', 'Return prose only. No markdown. No commentary.');
    return String(response || '').trim();
  } catch (_e) {
    return '(Voice preview unavailable \u2014 AI proxy offline.)';
  }
}

export async function deriveSlidersFromSample(sample) {
  const prompt = [
    `Given the writing sample below, estimate seven voice dimensions as integers 0\u2013100.`,
    ``,
    `Return STRICT JSON:`,
    `{`,
    `  "formality": 0-100, "rhythm": 0-100, "length": 0-100,`,
    `  "lyricism": 0-100, "darkness": 0-100, "pov": 0-100, "modernity": 0-100`,
    `}`,
    ``,
    `SAMPLE:`,
    String(sample || ''),
  ].join('\n');
  try {
    const response = await aiService.callAI(prompt, 'voice', 'Return only valid JSON.');
    const m = String(response || '').match(/\{[\s\S]*\}/);
    if (!m) return { ...DEFAULT_SLIDERS };
    const obj = JSON.parse(m[0]);
    const out = { ...DEFAULT_SLIDERS };
    Object.keys(DEFAULT_SLIDERS).forEach((k) => {
      if (typeof obj[k] === 'number') out[k] = Math.max(0, Math.min(100, Math.round(obj[k])));
    });
    return out;
  } catch (_e) {
    return { ...DEFAULT_SLIDERS };
  }
}

export default { rewriteInVoice, deriveSlidersFromSample, VOICE_DIMENSIONS, DEFAULT_SLIDERS };

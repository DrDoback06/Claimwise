/**
 * languageAI — lint, thesaurus, rewrite, and metrics.
 */

import aiService from '../../services/aiService';

const ISSUE_TYPES = [
  { id: 'passive',    label: 'Passive voice',     color: 'oklch(70% 0.15 25)' },
  { id: 'adverb',     label: 'Weak adverb',       color: 'oklch(78% 0.13 78)' },
  { id: 'repetition', label: 'Repetition',        color: 'oklch(72% 0.10 200)' },
  { id: 'cliche',     label: 'Clich\u00E9',        color: 'oklch(65% 0.18 25)' },
  { id: 'telling',    label: 'Telling not showing', color: 'oklch(70% 0.13 300)' },
  { id: 'pacing',     label: 'Pacing',            color: 'oklch(60% 0.04 60)' },
  { id: 'pov',        label: 'POV slip',          color: 'oklch(72% 0.13 145)' },
];

export const ISSUE_COLOR = Object.fromEntries(ISSUE_TYPES.map((i) => [i.id, i.color]));
export const ISSUE_LABEL = Object.fromEntries(ISSUE_TYPES.map((i) => [i.id, i.label]));
export { ISSUE_TYPES };

function safeParseJSON(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const m = s.match(/[\{\[][\s\S]*[\}\]]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function lintManuscript(text) {
  if (!text) return [];
  const prompt = [
    `Analyze the prose below and return specific language issues.`,
    `For each issue, give precise character offsets into the passage.`,
    ``,
    `Prose:`,
    String(text).slice(0, 6000),
    ``,
    `Return STRICT JSON:`,
    `{`,
    `  "issues": [`,
    `    {`,
    `      "type": "one of: ${ISSUE_TYPES.map((i) => i.id).join(', ')}",`,
    `      "start": 0,`,
    `      "end": 10,`,
    `      "quote": "the exact substring",`,
    `      "suggestion": "replacement or note",`,
    `      "reason": "1 short sentence"`,
    `    }`,
    `  ]`,
    `}`,
    ``,
    `Limit to the 20 most important issues.`,
  ].join('\n');
  try {
    const response = await aiService.callAI(prompt, 'analytical', 'Return only valid JSON.');
    const parsed = safeParseJSON(response);
    if (!parsed || !Array.isArray(parsed.issues)) return [];
    return parsed.issues
      .filter((i) => typeof i.start === 'number' && typeof i.end === 'number')
      .map((i, idx) => ({ id: `iss_${idx}`, ...i }));
  } catch (_e) {
    return [];
  }
}

export async function rewriteSnippet(text, directive) {
  const prompt = [
    `Rewrite this passage. Directive: ${directive || 'improve clarity and rhythm'}.`,
    `Keep meaning. Change only prose.`,
    ``,
    text,
    ``,
    `Return ONLY the rewritten passage, no commentary.`,
  ].join('\n');
  try {
    const r = await aiService.callAI(prompt, 'creative', 'Return prose only.');
    return String(r || '').trim();
  } catch {
    return '(Rewrite unavailable \u2014 AI proxy offline.)';
  }
}

export async function thesaurus(word) {
  if (!word) return [];
  const prompt = [
    `Suggest 6 alternatives for the word "${word}" in a literary fiction context.`,
    `Group by register. Return STRICT JSON:`,
    `{ "alternatives": [{ "word":"x", "register":"plain|elevated|archaic|modern|dark", "nuance":"short phrase" }] }`,
  ].join('\n');
  try {
    const r = await aiService.callAI(prompt, 'analytical', 'Return only valid JSON.');
    const parsed = safeParseJSON(r);
    return parsed?.alternatives || [];
  } catch {
    return [];
  }
}

export function computeMetrics(text) {
  if (!text) return null;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+\s+/).filter((s) => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chars = text.length;
  const avgSent = sentences.length ? words.length / sentences.length : 0;
  const longSent = sentences.filter((s) => s.split(/\s+/).length > 30).length;
  const shortSent = sentences.filter((s) => s.split(/\s+/).length < 8).length;

  // Flesch reading ease (approx)
  const syllables = words.reduce((acc, w) => acc + Math.max(1, (w.match(/[aeiouy]+/gi) || []).length), 0);
  const avgSyl = words.length ? syllables / words.length : 0;
  const flesch = sentences.length && words.length
    ? 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * avgSyl
    : 0;
  return {
    words: words.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    chars,
    avgSentenceLength: Math.round(avgSent * 10) / 10,
    longSentences: longSent,
    shortSentences: shortSent,
    fleschReadingEase: Math.round(flesch * 10) / 10,
  };
}

export default { lintManuscript, rewriteSnippet, thesaurus, computeMetrics };

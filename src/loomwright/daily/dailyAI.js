/**
 * dailyAI — generate Daily Sparks from the current book state.
 */

import aiService from '../../services/aiService';

export const KIND_META = {
  editor:        { label: 'Editor note',   color: 'oklch(78% 0.13 78)', icon: 'edit' },
  whatif:        { label: 'What-if',       color: 'oklch(72% 0.13 145)', icon: 'sparkle' },
  contradiction: { label: 'Contradiction', color: 'oklch(65% 0.18 25)', icon: 'flag' },
  drift:         { label: 'Voice drift',   color: 'oklch(72% 0.10 200)', icon: 'mic' },
  discovery:     { label: 'Discovery',     color: 'oklch(70% 0.13 300)', icon: 'globe' },
};

export const SEVERITY_META = {
  low:    { label: 'Low',    color: 'oklch(60% 0.04 60)' },
  medium: { label: 'Medium', color: 'oklch(78% 0.13 78)' },
  high:   { label: 'High',   color: 'oklch(65% 0.18 25)' },
};

function safeParseJSON(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const m = s.match(/[\{\[][\s\S]*[\}\]]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function generateSparks(worldState, bookId, options = {}) {
  const book = worldState?.books?.[bookId];
  if (!book) return [];
  const actors = worldState?.actors || [];
  const chapters = book.chapters || [];
  const recent = chapters.slice(-5);

  const prompt = [
    `You are an editorial assistant. Produce 4\u20137 short "sparks" about the novel below.`,
    `Each spark is typed: editor | whatif | contradiction | drift | discovery.`,
    ``,
    `Book: ${book.title || 'Untitled'}`,
    `Chapters so far: ${chapters.length}`,
    `Recent chapters:`,
    recent.map((c) => `- Ch.${c.id} "${c.title || ''}": ${(c.summary || c.text || '').slice(0, 200)}`).join('\n'),
    ``,
    `Cast sample:`,
    actors.slice(0, 8).map((a) => `- ${a.name}: ${a.role || ''}`).join('\n'),
    ``,
    `Return STRICT JSON:`,
    `{`,
    `  "sparks": [`,
    `    { "id": "unique-string", "kind": "editor|whatif|contradiction|drift|discovery", "severity": "low|medium|high", "title": "short title", "body": "1-3 sentences", "linkedChapters": [N] }`,
    `  ]`,
    `}`,
  ].join('\n');

  try {
    const r = await aiService.callAI(prompt, 'analytical', 'Return only valid JSON.');
    const parsed = safeParseJSON(r);
    if (!parsed || !Array.isArray(parsed.sparks)) return [];
    return parsed.sparks.map((s, i) => ({ id: s.id || `spark_${Date.now()}_${i}`, ...s }));
  } catch (_e) {
    return [];
  }
}

export async function generateMorningBrief(worldState, bookId) {
  const book = worldState?.books?.[bookId];
  if (!book) return null;
  const chapters = book.chapters || [];
  const recent = chapters.slice(-3);
  const actors = worldState?.actors || [];

  const prompt = [
    `Produce a "Morning Brief" for the novelist starting their day.`,
    ``,
    `Book: ${book.title || 'Untitled'}`,
    `Recent chapters:`,
    recent.map((c) => `- Ch.${c.id} "${c.title || ''}": ${(c.summary || c.text || '').slice(0, 220)}`).join('\n'),
    ``,
    `Cast: ${actors.length} characters.`,
    ``,
    `Return STRICT JSON:`,
    `{`,
    `  "greeting": "short, warm, 1 sentence",`,
    `  "summary": "2-3 sentences describing where the story currently stands",`,
    `  "sections": [`,
    `    { "kind": "noticed", "title": "Noticed", "items": [{ "id":"n1", "text":"..." }] },`,
    `    { "kind": "worry",   "title": "Worry about", "items": [] },`,
    `    { "kind": "delight", "title": "Delight in", "items": [] },`,
    `    { "kind": "ahead",   "title": "Look ahead", "items": [] }`,
    `  ]`,
    `}`,
  ].join('\n');

  try {
    const r = await aiService.callAI(prompt, 'analytical', 'Return only valid JSON.');
    return safeParseJSON(r);
  } catch {
    return null;
  }
}

export default { generateSparks, generateMorningBrief };

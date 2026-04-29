/**
 * atlasAI — extract place proposals from chapter prose.
 */

import aiService from '../../services/aiService';

const KINDS = ['castle', 'city', 'town', 'village', 'ruin', 'shrine', 'feature', 'inn', 'road', 'river', 'forest', 'mountain', 'sea', 'other'];

function safeParseJSON(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const m = s.match(/[\{\[][\s\S]*[\}\]]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function extractPlaceProposals(chapterText, chapterId, existingNames = []) {
  if (!chapterText) return [];
  const prompt = [
    `Extract named PLACES mentioned in the chapter below that are not already known.`,
    ``,
    `Known place names (do not repeat): ${existingNames.join(', ') || '(none)'}`,
    ``,
    `Chapter ${chapterId}:`,
    String(chapterText).slice(0, 8000),
    ``,
    `Return STRICT JSON:`,
    `{`,
    `  "places": [`,
    `    {`,
    `      "name": "string",`,
    `      "kind": "one of: ${KINDS.join(', ')}",`,
    `      "whereInText": "short quote or paragraph reference",`,
    `      "note": "1 sentence flavor/context",`,
    `      "confidence": "high | medium | low"`,
    `    }`,
    `  ]`,
    `}`,
  ].join('\n');
  try {
    const response = await aiService.callAI(prompt, 'analytical', 'Return only valid JSON.');
    const parsed = safeParseJSON(response);
    if (!parsed || !Array.isArray(parsed.places)) return [];
    return parsed.places.filter((p) => p.name && !existingNames.includes(p.name));
  } catch (_e) {
    return [];
  }
}

export default { extractPlaceProposals };

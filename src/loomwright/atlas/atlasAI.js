/**
 * atlasAI — extract place proposals from chapter prose.
 */

import aiService from '../../services/aiService';
import { parseAIJson } from '../../services/structuredAIJson';

const KINDS = ['castle', 'city', 'town', 'village', 'ruin', 'shrine', 'feature', 'inn', 'road', 'river', 'forest', 'mountain', 'sea', 'other'];

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
    const response = await aiService.callAI(prompt, 'atlas', 'Return only valid JSON.');
    const validate = (obj) => obj && Array.isArray(obj.places);
    const repair = async (bad) => {
      const fixPrompt = [
        'The text below was meant to be JSON with a top-level "places" array.',
        'Return ONLY valid JSON. No markdown fences.',
        String(bad).slice(0, 12000),
      ].join('\n');
      return aiService.callAI(fixPrompt, 'atlas', 'Return only valid JSON.');
    };
    const parsed = await parseAIJson(response, validate, repair);
    if (!parsed || !Array.isArray(parsed.places)) return [];
    const existingLower = new Set(existingNames.map((n) => String(n).toLowerCase()));
    return parsed.places.filter(
      (p) => p?.name && !existingLower.has(String(p.name).toLowerCase()),
    );
  } catch (_e) {
    return [];
  }
}

export default { extractPlaceProposals };

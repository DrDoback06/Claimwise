// Loomwright — Continuity scan service (CODE-INSIGHT §8 / §12.7).
// Calls the AI with the manuscript + canon snapshot; parses to ContinuityFinding[].
// Wired through ai/context.composeSystem so the model sees full saga context.

import aiService from '../../../services/aiService';
import { composeSystem } from '../ai/context';
import { safeParseJson } from '../ai/jsonExtract';

const PERSONA = [
  'You are a continuity checker for a novel manuscript.',
  'Look for inconsistencies across canon and the chapter text — a character in two places at once, an item that changes hands without explanation, a fact that contradicts a previous chapter, a stat that defies the world rules.',
  'Be specific: name the chapter and the entity. Skip nitpicks the writer would already accept (e.g. stylistic choice).',
].join(' ');

const SCHEMA = [
  'Return ONLY JSON of this exact shape:',
  '{"findings":[{"severity":"info|warn|error","description":"<1 short sentence>","manuscriptLocations":[{"chapterId":"<id>"}],"suggestedFix":"<optional>","confidence":0.0}]}',
].join('\n');

function safeParse(raw) {
  const parsed = safeParseJson(raw);
  return Array.isArray(parsed?.findings) ? parsed.findings : [];
}

export async function scanContinuity(state, chapterId) {
  const chapter = chapterId ? state.chapters?.[chapterId] : null;
  if (!chapter?.text) return [];
  const knowledge = (state.cast || [])
    .filter(c => (c.knows?.length || c.hides?.length || c.fears?.length))
    .map(c => `${c.name}: knows[${(c.knows || []).map(k => k.fact || k).filter(Boolean).join(' / ')}] hides[${(c.hides || []).map(k => k.fact || k).filter(Boolean).join(' / ')}]`)
    .slice(0, 12)
    .join(' || ');

  const sys = composeSystem({
    state, persona: PERSONA,
    focusChapterId: chapterId,
    slice: ['cast', 'places', 'items', 'quests'],
    extra: [
      knowledge && 'KNOWLEDGE LEDGER: ' + knowledge,
      SCHEMA,
    ].filter(Boolean).join('\n\n'),
  });

  const prompt = [
    `Chapter ${chapter.n || '?'} (id: ${chapter.id}):`,
    '',
    chapter.text,
    '',
    'List inconsistencies now. JSON only.',
  ].join('\n');

  let raw = '';
  try {
    raw = await aiService.callAI(prompt, 'analytical', sys, { useCache: false });
  } catch {
    return [];
  }
  const findings = safeParse(raw);
  return findings
    .filter(f => f && f.description)
    .map((f, i) => ({
      id: `cf_${Date.now().toString(36)}_${i}`,
      severity: ['info', 'warn', 'error'].includes(f.severity) ? f.severity : 'warn',
      description: f.description,
      manuscriptLocations: Array.isArray(f.manuscriptLocations) ? f.manuscriptLocations : [{ chapterId }],
      suggestedFix: f.suggestedFix,
      confidence: typeof f.confidence === 'number' ? f.confidence : 0.7,
    }));
}

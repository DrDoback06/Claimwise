// Loomwright — Quest progress detection (CODE-INSIGHT 2026-04 expansion).
// Scans chapter text against the active quests + each quest's sides; returns
// detected progress beats keyed to {questId, sideId}. The Quest panel renders
// these as accept/dismiss cards.

import aiService from '../../../services/aiService';
import { composeSystem } from '../ai/context';
import { safeParseJson } from '../ai/jsonExtract';

function safeParse(raw) {
  const parsed = safeParseJson(raw);
  return Array.isArray(parsed?.beats) ? parsed.beats : [];
}

export async function detectQuestProgress(state, chapterId) {
  const chapter = chapterId ? state.chapters?.[chapterId] : null;
  if (!chapter?.text) return [];
  const quests = (state.quests || []).filter(q => q.active !== false);
  if (!quests.length) return [];

  const cast = state.cast || [];
  const questBlock = quests.map(q => {
    const sides = (q.sides || []).map(s => {
      const memberNames = (s.members || []).map(id => cast.find(c => c.id === id)?.name).filter(Boolean);
      return `    side ${s.id} :: ${s.name} [${memberNames.join(', ') || '—'}] goal=${s.goal || '—'}`;
    }).join('\n');
    return `quest ${q.id} :: ${q.name} (${q.kind || 'main-quest'}) sides:\n${sides || '    (no sides)'}`;
  }).join('\n\n');

  const persona = [
    'You are a quest progress detector for a novel manuscript.',
    'Find moments in the chapter where one of the listed sides advances or suffers a setback toward its goal.',
    'Cite the side by id. Be conservative — only return beats with confidence ≥ 0.6. Use the saga context below to avoid false positives that contradict world rules.',
  ].join(' ');

  const sys = composeSystem({
    state, persona,
    focusChapterId: chapterId,
    slice: ['cast', 'places'],
    extra: [
      'ACTIVE QUESTS:',
      questBlock,
      '',
      'Return ONLY this JSON:',
      '{"beats":[{"questId":"...","sideId":"...","beat":"<one-sentence summary>","confidence":0.0,"chapterId":"' + chapter.id + '"}]}',
    ].join('\n'),
  });

  let raw = '';
  try {
    raw = await aiService.callAI(`Chapter text:\n${chapter.text}\n\nDetect quest progress now.`, 'analytical', sys, { useCache: false });
  } catch { return []; }
  const beats = safeParse(raw);
  return beats
    .filter(b => b && b.questId && b.sideId && b.beat && (b.confidence ?? 0) >= 0.6)
    .map(b => ({ ...b, chapterId: b.chapterId || chapter.id }));
}

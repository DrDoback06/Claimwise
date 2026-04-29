// Loomwright — Continuity scan service (CODE-INSIGHT §8 / §12.7).
// Calls the free model with the manuscript + canon snapshot; parses to
// ContinuityFinding[].

import aiService from '../../../services/aiService';

function buildPrompt({ chapter, cast, places, items, knowledge }) {
  return [
    'You are a continuity checker for a novel manuscript. Look for inconsistencies across canon and the chapter text.',
    'Examples: a character is in two places at once; an item changes hands without explanation; a fact contradicts a previous chapter.',
    'Return ONLY JSON of this exact shape:',
    '{"findings":[{"severity":"info|warn|error","description":"<1 short sentence>","manuscriptLocations":[{"chapterId":"<id>"}],"suggestedFix":"<optional>"}]}',
    '',
    `CANON:`,
    `Cast: ${(cast || []).map(c => c.name).filter(Boolean).join(', ')}`,
    `Places: ${(places || []).map(p => p.name).filter(Boolean).join(', ')}`,
    `Items: ${(items || []).map(i => i.name).filter(Boolean).join(', ')}`,
    knowledge ? `Knowledge ledger: ${knowledge}` : '',
    '',
    `CHAPTER ${chapter?.n || ''} (id: ${chapter?.id}):`,
    chapter?.text || '(empty)',
  ].filter(Boolean).join('\n');
}

function safeParse(raw) {
  if (!raw) return [];
  let s = String(raw).trim();
  if (s.startsWith('```')) s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed?.findings) ? parsed.findings : [];
  } catch {}
  return [];
}

export async function scanContinuity(state, chapterId) {
  const chapter = chapterId ? state.chapters?.[chapterId] : null;
  if (!chapter) return [];
  const knowledge = (state.cast || [])
    .filter(c => (c.knows?.length || c.hides?.length || c.fears?.length))
    .map(c => `${c.name}: knows[${(c.knows || []).map(k => k.fact).join(' / ')}] hides[${(c.hides || []).map(k => k.fact).join(' / ')}]`)
    .join(' || ');
  let raw = '';
  try {
    raw = await aiService.callAI(
      buildPrompt({ chapter, cast: state.cast, places: state.places, items: state.items, knowledge }),
      'continuity',
      'You are a careful continuity checker for a novel manuscript.',
      { useCache: false },
    );
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
    }));
}

// Loomwright — Extraction Wizard service (CODE-INSIGHT §7).
// Calls the free model with chapter text + canon → Finding[].
// Boost flag routes through deeper model on explicit user click.

import aiService from '../../../services/aiService';

function buildPrompt({ chapter, cast, places, items, threads, deep }) {
  return [
    'You are an extraction pass for a novel manuscript.',
    'Find every named character, place, item, and thread mentioned in the chapter, classify each as NEW or KNOWN against the canon below, and return JSON only.',
    deep ? 'Run a deep pass — include subtle implied entities (rumored places, off-page characters).' : 'Skim pass — only entities explicitly named.',
    'Shape:',
    '{"findings":[{"kind":"character|place|item|thread|relationship|fact","status":"new|known","name":"<canonical>","resolvesTo":"<existing-id-if-known>","notes":"<optional>"}]}',
    '',
    `KNOWN CAST: ${(cast || []).map(c => `${c.id}::${c.name || ''}`).join(', ')}`,
    `KNOWN PLACES: ${(places || []).map(p => `${p.id}::${p.name || ''}`).join(', ')}`,
    `KNOWN ITEMS: ${(items || []).map(i => `${i.id}::${i.name || ''}`).join(', ')}`,
    `KNOWN THREADS: ${(threads || []).map(th => `${th.id}::${th.title || th.name || ''}`).join(', ')}`,
    '',
    `CHAPTER ${chapter?.n || ''}:`,
    chapter?.text || '(empty)',
  ].join('\n');
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

export async function runExtractPass(state, chapterId, opts = {}) {
  const chapter = chapterId ? state.chapters?.[chapterId] : null;
  if (!chapter) return [];
  let raw = '';
  try {
    raw = await aiService.callAI(
      buildPrompt({
        chapter,
        cast: state.cast, places: state.places,
        items: state.items, threads: state.quests,
        deep: opts.deep,
      }),
      opts.deep ? 'extraction-deep' : 'extraction',
      'You are a careful entity extractor for a novel manuscript.',
      { useCache: false },
    );
  } catch {
    return [];
  }
  const findings = safeParse(raw);
  return findings
    .filter(f => f && f.kind && f.name)
    .map((f, i) => ({
      id: `ef_${Date.now().toString(36)}_${i}`,
      kind: f.kind,
      status: f.status === 'known' ? 'known' : 'new',
      name: f.name,
      resolvesTo: f.resolvesTo || null,
      notes: f.notes || '',
      draft: { name: f.name, notes: f.notes || '' },
    }));
}

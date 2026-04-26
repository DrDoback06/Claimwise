// Loomwright — Extraction Wizard service. 2026-04 rewrite based on the legacy
// scanDocumentForSuggestions pattern: a chunked, very-explicit prompt that
// surfaces every actor / place / item / quest / fact / relationship beat.
//
// Returns Finding[] for the wizard UI.

import aiService from '../../../services/aiService';

function rid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

const CHUNK_SIZE = 5000;

function chunk(text) {
  const out = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) out.push(text.slice(i, i + CHUNK_SIZE));
  return out;
}

function safeParse(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (s.startsWith('```')) s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first < 0 || last <= first) return null;
  try { return JSON.parse(s.slice(first, last + 1)); } catch { return null; }
}

function buildSystem(state, opts) {
  const cast    = (state.cast || []).map(c => c.name).filter(Boolean).join(', ') || 'none yet';
  const places  = (state.places || []).map(p => p.name).filter(Boolean).join(', ') || 'none yet';
  const items   = (state.items || []).map(i => i.name).filter(Boolean).join(', ') || 'none yet';
  const quests  = (state.quests || []).map(q => q.name || q.title).filter(Boolean).join(', ') || 'none yet';
  const profile = state.profile || {};

  return [
    'You are an entity-extraction pass for a novel manuscript.',
    'Pull EVERY proper-noun entity, item with stat hints, place name, named relationship, and quest beat from the chapter text.',
    'Be exhaustive — include partial mentions, side characters, named objects ("the wooden box"), unnamed-but-described people ("the elder, a wise woman named Elara").',
    opts.deep
      ? 'Run a deep pass: include implied / off-page references and rumour-only entities the writer might want to track.'
      : 'Skim pass — only entities explicitly named or clearly described in the text.',
    '',
    'KNOWN CANON (use these names instead of inventing duplicates; mark status="known" with resolvesTo=<id> when you find a known one):',
    'Cast: ' + cast,
    'Places: ' + places,
    'Items: ' + items,
    'Quests: ' + quests,
    profile.premise && ('Story premise: ' + profile.premise),
    profile.genre && ('Genre: ' + profile.genre),
    profile.tone?.length && ('Tone: ' + profile.tone.join(' / ')),
    '',
    'Return ONLY JSON of this exact shape — no prose, no markdown:',
    '{',
    '  "findings": [',
    '    {"kind":"character","status":"new|known","name":"<exact name>","resolvesTo":"<id-if-known>","notes":"<role / relevant detail>"},',
    '    {"kind":"place","status":"new|known","name":"<exact name>","resolvesTo":"<id-if-known>","notes":"<what it is>"},',
    '    {"kind":"item","status":"new|known","name":"<exact name>","resolvesTo":"<id-if-known>","notes":"<stat hints / role>"},',
    '    {"kind":"quest","status":"new|known","name":"<exact name>","resolvesTo":"<id-if-known>","notes":"<what is at stake>"},',
    '    {"kind":"fact","status":"new","name":"<short summary>","notes":"<who knows it>"},',
    '    {"kind":"relationship","status":"new","name":"<A & B>","notes":"<nature of the bond>"}',
    '  ]',
    '}',
    '',
    'If a chunk has no findings, return {"findings":[]}.',
  ].filter(Boolean).join('\n');
}

export async function runExtractPass(state, chapterId, opts = {}) {
  const chapter = chapterId ? state.chapters?.[chapterId] : null;
  if (!chapter?.text) return [];
  const chunks = chunk(chapter.text);
  const sys = buildSystem(state, opts);
  const seen = new Map(); // dedupe key -> finding
  let order = 0;

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const prompt = [
      `Chapter ${chapter.n || '?'} — chunk ${i + 1} of ${chunks.length}:`,
      '',
      c,
      '',
      'Extract every entity now. JSON only.',
    ].join('\n');

    let raw = '';
    try {
      raw = await aiService.callAI(prompt, opts.deep ? 'analytical' : 'analytical', sys, { useCache: false });
    } catch (err) {
      console.warn('[extraction] chunk failed', i, err?.message);
      continue;
    }
    const parsed = safeParse(raw);
    const list = Array.isArray(parsed?.findings) ? parsed.findings : [];

    for (const f of list) {
      if (!f?.kind || !f?.name) continue;
      const key = (f.kind + ':' + f.name).toLowerCase();
      if (seen.has(key)) continue;
      seen.set(key, {
        id: rid('ef'),
        kind: f.kind,
        status: f.status === 'known' ? 'known' : 'new',
        name: String(f.name).slice(0, 120),
        resolvesTo: f.resolvesTo || null,
        notes: f.notes || '',
        draft: { name: f.name, notes: f.notes || '' },
        order: order++,
      });
    }
  }
  return [...seen.values()];
}

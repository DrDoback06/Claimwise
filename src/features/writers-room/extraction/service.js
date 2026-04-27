// Loomwright — Extraction Wizard service. 2026-04 rewrite based on the legacy
// scanDocumentForSuggestions pattern: a chunked, very-explicit prompt that
// surfaces every actor / place / item / quest / fact / relationship beat.
//
// Wired to:
//   • ai/context.composeSystem — full saga + voice + recent chapters in
//     every chunk's system prompt
//   • ai/entityMatch.reconcileFindings — fuzzy-matches names against canon
//     so duplicates don't spawn

import aiService from '../../../services/aiService';
import { composeSystem } from '../ai/context';
import { reconcileFindings } from '../ai/entityMatch';

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

const PERSONA = [
  'You are an entity-extraction pass for a novel manuscript.',
  'Pull EVERY proper-noun entity, item with stat hints, place name, named relationship, and quest beat from the chapter text.',
  'Be exhaustive — include partial mentions, side characters, named objects ("the wooden box"), unnamed-but-described people ("the elder, a wise woman named Elara").',
].join(' ');

const SCHEMA = [
  'Return ONLY JSON of this exact shape — no prose, no markdown:',
  '{',
  '  "findings": [',
  '    {"kind":"character","status":"new|known","name":"<exact name>","resolvesTo":"<id-if-known>","notes":"<role / relevant detail>","confidence":0.0},',
  '    {"kind":"place","status":"new|known","name":"<exact name>","resolvesTo":"<id-if-known>","notes":"<what it is>","confidence":0.0},',
  '    {"kind":"item","status":"new|known","name":"<exact name>","resolvesTo":"<id-if-known>","notes":"<stat hints / role>","confidence":0.0},',
  '    {"kind":"quest","status":"new|known","name":"<exact name>","resolvesTo":"<id-if-known>","notes":"<what is at stake>","confidence":0.0},',
  '    {"kind":"fact","status":"new","name":"<short summary>","notes":"<who knows it>","confidence":0.0},',
  '    {"kind":"relationship","status":"new","name":"<A & B>","notes":"<nature of the bond>","confidence":0.0}',
  '  ],',
  '  "entityEvents": [',
  '    {"eventType":"<type>","label":"<short label>","summary":"<what happened>","entities":[{"name":"<entity>","type":"character|item|place|quest|skill","role":"<role>"}],"stateChanges":[{"entity":"<name>","field":"<field>","before":"<optional>","after":"<optional>"}],"confidence":0.0,"risk":"blue|green|amber|red","evidence":"<short quote>"}',
  '  ],',
  '  "proposedLinks": [',
  '    {"from":"<entity name>","fromType":"character|item|place|quest|skill","to":"<entity name>","toType":"character|item|place|quest|skill","relation":"<short relation>","confidence":0.0}',
  '  ],',
  '  "mergeSuggestions": [',
  '    {"candidate":"<name>","candidateKind":"character|place|item|quest|skill","suggestedId":"<existing id if obvious>","confidence":0.0}',
  '  ],',
  '  "continuityConcerns": [',
  '    {"summary":"<possible contradiction>","severity":"low|medium|high","confidence":0.0}',
  '  ]',
  '}',
  'Confidence is 0..1. Be honest — if you only saw a hint, mark < 0.6.',
  'Extract actions, not just nouns.',
  'If an item is acquired, link character + item + location in entityEvents/proposedLinks.',
  'If a skill is used but not learned, mark as skill-used, not skill-gained.',
  'If progression is implied but not numeric, keep it qualitative and do not invent numeric stats.',
  'Include short evidence quotes whenever possible.',
  'If a chunk has no findings, return {"findings":[]}.',
].join('\n');

export async function runExtractPass(state, chapterId, opts = {}) {
  const chapter = chapterId ? state.chapters?.[chapterId] : null;
  if (!chapter?.text) return [];
  const chunks = chunk(chapter.text);
  const sys = composeSystem({
    state,
    persona: PERSONA + (opts.deep
      ? ' Run a deep pass: include implied / off-page references and rumour-only entities.'
      : ' Skim pass — only entities explicitly named or clearly described.'),
    focusChapterId: chapterId,
    slice: ['cast', 'places', 'items', 'quests', 'skills'],
    extra: SCHEMA,
  });
  const seen = new Map();
  const eventSeen = new Map();
  const linkSeen = new Map();
  const mergeSuggestions = [];
  const continuityConcerns = [];
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
      raw = await aiService.callAI(prompt, 'analytical', sys, { useCache: false });
    } catch (err) {
      console.warn('[extraction] chunk failed', i, err?.message);
      continue;
    }
    const parsed = safeParse(raw);
    const list = Array.isArray(parsed?.findings) ? parsed.findings : [];
    const events = Array.isArray(parsed?.entityEvents) ? parsed.entityEvents : [];
    const links = Array.isArray(parsed?.proposedLinks) ? parsed.proposedLinks : [];
    const merges = Array.isArray(parsed?.mergeSuggestions) ? parsed.mergeSuggestions : [];
    const continuity = Array.isArray(parsed?.continuityConcerns) ? parsed.continuityConcerns : [];

    for (const f of list) {
      if (!f?.kind || !f?.name) continue;
      const key = (f.kind + ':' + String(f.name).toLowerCase().trim());
      if (seen.has(key)) continue;
      seen.set(key, {
        id: rid('ef'),
        kind: f.kind,
        status: f.status === 'known' ? 'known' : 'new',
        name: String(f.name).slice(0, 120),
        resolvesTo: f.resolvesTo || null,
        notes: f.notes || '',
        confidence: typeof f.confidence === 'number' ? f.confidence : 0.7,
        draft: { name: f.name, notes: f.notes || '' },
        order: order++,
      });
    }
    for (const ev of events) {
      if (!ev?.summary) continue;
      const key = `${ev.eventType || 'event'}:${String(ev.summary).toLowerCase().trim()}`;
      if (eventSeen.has(key)) continue;
      eventSeen.set(key, {
        id: rid('ee'),
        eventType: ev.eventType || 'entity-update',
        label: ev.label || 'Updated',
        summary: String(ev.summary).slice(0, 220),
        entities: Array.isArray(ev.entities) ? ev.entities : [],
        stateChanges: Array.isArray(ev.stateChanges) ? ev.stateChanges : [],
        confidence: typeof ev.confidence === 'number' ? ev.confidence : 0.7,
        riskBand: ev.risk || null,
        evidence: { quote: ev.evidence || '' },
      });
    }
    for (const link of links) {
      if (!link?.from || !link?.to) continue;
      const key = `${link.fromType || 'u'}:${String(link.from).toLowerCase()}=>${link.toType || 'u'}:${String(link.to).toLowerCase()}:${link.relation || ''}`;
      if (linkSeen.has(key)) continue;
      linkSeen.set(key, {
        id: rid('el'),
        from: link.from,
        fromType: link.fromType || null,
        to: link.to,
        toType: link.toType || null,
        relation: link.relation || 'related-to',
        confidence: typeof link.confidence === 'number' ? link.confidence : 0.7,
      });
    }
    for (const m of merges) {
      mergeSuggestions.push({ id: rid('ms'), ...m, chapterId });
    }
    for (const c0 of continuity) {
      continuityConcerns.push({ id: rid('cc'), chapterId, ...c0 });
    }
  }
  // Reconcile against canon — if the model called something "new" but a
  // close match exists, flip it to known with the canonical id.
  const findings = reconcileFindings([...seen.values()], state);
  findings.entityEvents = [...eventSeen.values()];
  findings.proposedLinks = [...linkSeen.values()];
  findings.mergeSuggestions = mergeSuggestions;
  findings.continuityConcerns = continuityConcerns;
  return findings;
}

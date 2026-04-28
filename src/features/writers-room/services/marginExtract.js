// Loomwright — Margin Extraction Layer 1 (CODE-INSIGHT §4 / artboard 04-margin).
//
// Continuous, ambient, free-model detection of new entities per paragraph.
// Cache by paragraph hash; abort on text change. Self-filters to confidence ≥ 0.6.

import aiService from '../../../services/aiService';
import { normalizeEntityName } from '../ai/entityMatch';
import { safeParseJson } from '../ai/jsonExtract';

const CACHE = new Map();        // hash -> Detection[]
const INFLIGHT = new Map();     // paragraphId -> AbortController

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return String(h);
}

function buildPrompt(paragraph, contextBefore, contextAfter, knownEntities) {
  const known = (knownEntities || []).map(e => `${e.kind}:${e.name}`).join(', ');
  return [
    'You are an ambient entity detector for a novel manuscript.',
    'Find any NEW characters, places, items, or threads named in this paragraph that are NOT already in the known list.',
    'Be conservative — confidence must be ≥ 0.6. Skip pronouns, common nouns, and existing entities.',
    'Respond with ONLY this JSON:',
    '{"detections":[{"kind":"character|place|item|thread","surfaceText":"<exact phrase>","suggestedName":"<canonical name>","confidence":<0..1>}]}',
    '',
    `Known entities: ${known || '(none)'}`,
    '',
    contextBefore ? `Context (prior paragraph): ${contextBefore}` : '',
    `Paragraph to analyse:\n${paragraph}`,
    contextAfter ? `Context (next paragraph): ${contextAfter}` : '',
  ].filter(Boolean).join('\n');
}

function safeParse(raw) {
  const parsed = safeParseJson(raw);
  return Array.isArray(parsed?.detections) ? parsed.detections : [];
}

export async function detectInParagraph({
  paragraphId, text, contextBefore, contextAfter, knownEntities,
}) {
  if (!text || text.trim().length < 12) return [];
  const key = hashStr(text);
  if (CACHE.has(key)) return CACHE.get(key);

  // Cancel any in-flight detection for this paragraph.
  const prev = INFLIGHT.get(paragraphId);
  if (prev) { try { prev.abort(); } catch {} }
  const ctrl = new AbortController();
  INFLIGHT.set(paragraphId, ctrl);

  let raw = '';
  try {
    raw = await aiService.callAI(
      buildPrompt(text, contextBefore, contextAfter, knownEntities),
      'extraction',
      'You are a careful, ambient entity detector for a novel manuscript.',
      { useCache: false, abortController: ctrl },
    );
  } catch (err) {
    if (err?.name === 'AbortError') return [];
    return [];
  } finally {
    if (INFLIGHT.get(paragraphId) === ctrl) INFLIGHT.delete(paragraphId);
  }

  const list = safeParse(raw);
  const knownSet = new Set((knownEntities || []).map(e => normalizeEntityName(e.name)).filter(Boolean));
  const cleaned = list
    .filter(d => d && d.kind && d.suggestedName && (d.confidence ?? 0) >= 0.6)
    .filter(d => !knownSet.has(normalizeEntityName(d.suggestedName)))
    .map(d => ({
      kind: d.kind,
      surfaceText: d.surfaceText || d.suggestedName,
      suggestedName: d.suggestedName,
      confidence: d.confidence,
      position: { paragraphId, charOffset: text.indexOf(d.surfaceText || d.suggestedName) || 0 },
    }));
  CACHE.set(key, cleaned);
  return cleaned;
}

export function clearCache() { CACHE.clear(); }

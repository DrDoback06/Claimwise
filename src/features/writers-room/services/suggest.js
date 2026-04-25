// Loomwright — suggestion orchestrator (plan §5).
//
// One facade — `suggest(text, ctx, opts)` — every panel calls. Returns
// scored, threshold-gated suggestions sorted by combined_score, max 12.

import entityMatchingService from '../../../services/entityMatchingService';
import worldConsistencyService from '../../../services/worldConsistencyService';
import writingEnhancementServices from '../../../services/writingEnhancementServices';
import suggestionLearningService from '../../../services/suggestionLearningService';

export const MODE_THRESHOLDS = {
  idle: 0.62,
  ritual: 0.45,
  'inline-weaver': 0.30,
  guided: 0.0,
};

const KIND_GENRE_WEIGHTS = {
  literary: { voice: 1.2, language: 1.1, character: 1.0, place: 0.8, thread: 0.9, item: 0.7, grammar: 1.0, continuity: 1.0, spark: 1.0 },
  thriller: { voice: 0.9, language: 0.9, character: 1.0, place: 1.0, thread: 1.2, item: 1.0, grammar: 1.0, continuity: 1.2, spark: 1.0 },
  fantasy:  { voice: 1.0, language: 1.0, character: 1.1, place: 1.2, thread: 1.0, item: 1.1, grammar: 1.0, continuity: 1.0, spark: 1.0 },
  romance:  { voice: 1.1, language: 1.0, character: 1.2, place: 0.8, thread: 1.0, item: 0.7, grammar: 1.0, continuity: 1.0, spark: 1.0 },
  default:  { voice: 1.0, language: 1.0, character: 1.0, place: 1.0, thread: 1.0, item: 1.0, grammar: 1.0, continuity: 1.0, spark: 1.0 },
};

const INTRUSION_BUDGET = {
  quiet:   { perChapter: 4, perKind: 2, base: 0.85 },
  medium:  { perChapter: 8, perKind: 3, base: 1.0 },
  helpful: { perChapter: 14, perKind: 5, base: 1.1 },
  eager:   { perChapter: 24, perKind: 8, base: 1.2 },
};

function genreFactor(kind, genre) {
  const map = KIND_GENRE_WEIGHTS[genre] || KIND_GENRE_WEIGHTS.default;
  return map[kind] ?? 1.0;
}

function intrusionBudget(kind, kindCount, wordCount, intrusion = 'medium') {
  const cfg = INTRUSION_BUDGET[intrusion] || INTRUSION_BUDGET.medium;
  if (kindCount > cfg.perKind) return Math.max(0.4, 1 - 0.12 * (kindCount - cfg.perKind));
  return cfg.base;
}

function getBias(kind, profile) {
  // Soft bias from accept/dismiss counts. Range [0.3, 1.5].
  const accepts = profile?.acceptCounts?.[kind] || 0;
  const dismisses = profile?.dismissRates?.[kind] || 0;
  const total = accepts + dismisses;
  if (total < 3) return 1.0;
  const ratio = accepts / total;
  // Soft mapping: more accepts → higher bias.
  return Math.max(0.3, Math.min(1.5, 0.6 + 1.0 * ratio));
}

function countByKind(arr) {
  const out = {};
  for (const s of arr) out[s.kind] = (out[s.kind] || 0) + 1;
  return out;
}

function safeCall(fn, fallback) {
  return fn().catch(err => {
    console.warn('[lw-suggest] detector failed:', err?.message || err);
    return fallback;
  });
}

// ─── Detectors (adapters over legacy services) ───────────────────────
async function detectEntities(text, ctx) {
  if (!entityMatchingService?.detectMentions) return [];
  try {
    const known = (ctx.cast || []).map(c => ({ id: c.id, name: c.name, aliases: c.aliases || [] }));
    const knownPlaces = (ctx.places || []).map(p => ({ id: p.id, name: p.name }));
    // detectMentions varies by version; try several method names.
    let raw = [];
    if (entityMatchingService.detectMentions) {
      raw = await entityMatchingService.detectMentions(text, { characters: known, places: knownPlaces });
    } else if (entityMatchingService.scanText) {
      raw = await entityMatchingService.scanText(text, { characters: known, places: knownPlaces });
    }
    raw = Array.isArray(raw) ? raw : [];
    return raw.map(r => ({
      id: r.id || `s_${Math.random().toString(36).slice(2, 8)}`,
      kind: r.kind || (r.type === 'place' ? 'place' : 'character'),
      span: r.span || { paragraphId: null, start: 0, end: 0 },
      proposal: r.proposal || { name: r.name },
      confidence: r.confidence ?? 0.7,
      rationale: r.rationale || `Mentioned: ${r.name || r.text}`,
      actions: ['walk-through', 'dismiss'],
    }));
  } catch { return []; }
}

async function detectContinuity(text, ctx) {
  if (!worldConsistencyService?.detectContradictions) return [];
  try {
    const raw = await worldConsistencyService.detectContradictions(text, ctx) || [];
    return raw.map(r => ({
      id: r.id || `s_${Math.random().toString(36).slice(2, 8)}`,
      kind: 'continuity',
      span: r.span || { paragraphId: null, start: 0, end: 0 },
      proposal: r.proposal || {},
      confidence: r.confidence ?? 0.5,
      rationale: r.rationale || r.message || 'Possible contradiction',
      actions: ['investigate', 'dismiss'],
    }));
  } catch { return []; }
}

async function detectLanguage(text, ctx) {
  if (!writingEnhancementServices?.detectIssues) return [];
  try {
    const raw = await writingEnhancementServices.detectIssues(text, ctx) || [];
    return raw.map(r => ({
      id: r.id || `s_${Math.random().toString(36).slice(2, 8)}`,
      kind: 'grammar',
      span: r.span || { paragraphId: null, start: 0, end: 0 },
      proposal: { fix: r.fix, quote: r.quote },
      confidence: r.confidence ?? 0.6,
      rationale: r.rule || r.label || 'Language issue',
      actions: ['apply', 'dismiss'],
    }));
  } catch { return []; }
}

// ─── The orchestrator ───────────────────────────────────────────────
export async function suggest(text, ctx = {}, opts = {}) {
  const mode = opts.mode || 'idle';
  const threshold = MODE_THRESHOLDS[mode] ?? MODE_THRESHOLDS.idle;
  const profile = ctx.profile || {};
  const intrusion = profile.intrusion || 'medium';
  const genre = profile.genre || 'default';

  const [entities, continuity, language] = await Promise.all([
    safeCall(() => detectEntities(text, ctx), []),
    opts.skipContinuity ? Promise.resolve([]) : safeCall(() => detectContinuity(text, ctx), []),
    opts.skipLanguage ? Promise.resolve([]) : safeCall(() => detectLanguage(text, ctx), []),
  ]);

  const raw = [...entities, ...continuity, ...language];
  const counts = countByKind(raw);
  const wordCount = (text || '').split(/\s+/).filter(Boolean).length;

  const scored = raw.map(s => ({
    ...s,
    combined_score:
      (s.confidence ?? 0.5)
      * getBias(s.kind, profile)
      * intrusionBudget(s.kind, counts[s.kind], wordCount, intrusion)
      * genreFactor(s.kind, genre),
  }));

  return scored
    .filter(s => s.combined_score >= threshold)
    .sort((a, b) => b.combined_score - a.combined_score)
    .slice(0, 12);
}

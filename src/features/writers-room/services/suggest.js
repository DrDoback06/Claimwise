// Loomwright — suggestion orchestrator (plan §5).
//
// One facade — `suggest(text, ctx, opts)` — every panel calls. Returns
// scored, threshold-gated suggestions sorted by combined_score, max 12.

import {
  findCandidateNames, findCandidatePlaces,
  findEchoes, findAdverbHotspots, findLongSentences,
} from './detectors';

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
  quiet:   { perKind: 2, base: 0.85 },
  medium:  { perKind: 3, base: 1.0 },
  helpful: { perKind: 5, base: 1.1 },
  eager:   { perKind: 8, base: 1.2 },
};

function genreFactor(kind, genre) {
  const map = KIND_GENRE_WEIGHTS[genre] || KIND_GENRE_WEIGHTS.default;
  return map[kind] ?? 1.0;
}

function intrusionBudget(kindCount, intrusion = 'medium') {
  const cfg = INTRUSION_BUDGET[intrusion] || INTRUSION_BUDGET.medium;
  if (kindCount > cfg.perKind) return Math.max(0.4, 1 - 0.12 * (kindCount - cfg.perKind));
  return cfg.base;
}

function getBias(kind, profile) {
  const accepts = profile?.acceptCounts?.[kind] || 0;
  const dismisses = profile?.dismissRates?.[kind] || 0;
  const total = accepts + dismisses;
  if (total < 3) return 1.0;
  const ratio = accepts / total;
  return Math.max(0.3, Math.min(1.5, 0.6 + 1.0 * ratio));
}

function rid(prefix = 's') { return `${prefix}_${Math.random().toString(36).slice(2, 8)}`; }

// Map suggestion kind → bias-tracking key matching profile.acceptCounts.
const KIND_TO_PROFILE_KEY = {
  character: 'cast',
  place: 'atlas',
  thread: 'thread',
  item: 'cast',
  grammar: 'lang',
  continuity: 'entity',
  voice: 'voice',
  spark: 'spark',
};

function biasKey(kind) { return KIND_TO_PROFILE_KEY[kind] || kind; }

export async function suggest(text, ctx = {}, opts = {}) {
  const mode = opts.mode || 'idle';
  const threshold = MODE_THRESHOLDS[mode] ?? MODE_THRESHOLDS.idle;
  const profile = ctx.profile || {};
  const intrusion = profile.intrusion || 'medium';
  const genre = profile.genre || 'default';

  const raw = [];

  // 1. Character candidates.
  if (!opts.skipEntities) {
    const candidates = findCandidateNames(text, ctx.cast || [], ctx.places || []);
    for (const c of candidates) {
      // Confidence: more mentions ⇒ higher confidence; novel-only candidates start lower.
      const conf = Math.min(0.95, 0.45 + 0.15 * c.count);
      raw.push({
        id: rid('s'),
        kind: 'character',
        span: { start: c.position, end: c.position + c.name.length },
        proposal: { name: c.name, role: 'support' },
        confidence: conf,
        rationale: `Mentioned ${c.count} time${c.count > 1 ? 's' : ''} — add to cast?`,
        actions: ['walk-through', 'dismiss'],
      });
    }

    // 2. Place candidates.
    const places = findCandidatePlaces(text, ctx.places || []);
    for (const p of places) {
      const conf = Math.min(0.92, 0.4 + 0.15 * p.count);
      raw.push({
        id: rid('s'),
        kind: 'place',
        span: { start: 0, end: 0 },
        proposal: { name: p.name, kind: 'settlement' },
        confidence: conf,
        rationale: `Referenced ${p.count} time${p.count > 1 ? 's' : ''} as a location.`,
        actions: ['walk-through', 'dismiss'],
      });
    }
  }

  // 3. Language issues.
  if (!opts.skipLanguage) {
    const echoes = findEchoes(text).slice(0, 3);
    for (const e of echoes) {
      raw.push({
        id: rid('s'),
        kind: 'grammar',
        span: { start: e.position, end: e.position + e.word.length * 2 + 1 },
        proposal: { word: e.word },
        confidence: 0.9,
        rationale: `"${e.word} ${e.word}" — same word twice in a row.`,
        actions: ['dismiss'],
      });
    }
    const adverbs = findAdverbHotspots(text);
    if (adverbs.length > 6) {
      raw.push({
        id: rid('s'),
        kind: 'grammar',
        span: { start: 0, end: 0 },
        proposal: { count: adverbs.length },
        confidence: Math.min(0.92, 0.55 + 0.04 * adverbs.length),
        rationale: `${adverbs.length} -ly adverbs — consider stronger verbs.`,
        actions: ['dismiss'],
      });
    }
    const longs = findLongSentences(text, 35);
    if (longs.length) {
      raw.push({
        id: rid('s'),
        kind: 'grammar',
        span: { start: 0, end: 0 },
        proposal: { sample: longs[0].slice(0, 80) },
        confidence: Math.min(0.85, 0.5 + 0.07 * longs.length),
        rationale: `${longs.length} sentence${longs.length > 1 ? 's' : ''} over 35 words.`,
        actions: ['dismiss'],
      });
    }
  }

  // Score.
  const counts = {};
  for (const s of raw) counts[s.kind] = (counts[s.kind] || 0) + 1;

  const scored = raw.map(s => ({
    ...s,
    combined_score:
      (s.confidence ?? 0.5)
      * getBias(biasKey(s.kind), profile)
      * intrusionBudget(counts[s.kind], intrusion)
      * genreFactor(s.kind, genre),
  }));

  return scored
    .filter(s => s.combined_score >= threshold)
    .sort((a, b) => b.combined_score - a.combined_score)
    .slice(0, 12);
}

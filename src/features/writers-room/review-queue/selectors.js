// Loomwright — review queue selectors. Routes the flat `reviewQueue` slice
// (populated by `ai/pipeline.js`) into per-tab buckets so each panel can
// surface only the findings it cares about.

import { riskBandFor } from '../ai/confidence';

const KIND_TO_DOMAIN = {
  character: 'cast',
  place: 'atlas',
  item: 'items',
  quest: 'quests',
  thread: 'quests',
  'quest-progress': 'quests',
  skill: 'skills',
  // facts + relationships belong to the cast — they describe what
  // characters know / who they connect to.
  fact: 'cast',
  relationship: 'cast',
  // continuity has its own panel; keep it routed there.
  continuity: 'continuity',
};

export function domainForKind(kind) {
  return KIND_TO_DOMAIN[kind] || null;
}

export function selectReviewQueueByDomain(store) {
  const queue = Array.isArray(store?.reviewQueue) ? store.reviewQueue : [];
  const out = { cast: [], atlas: [], items: [], quests: [], skills: [], continuity: [] };
  for (const it of queue) {
    if (!it || it.status === 'dismissed' || it.status === 'committed' || it.status === 'merged') continue;
    const d = domainForKind(it.kind);
    if (!d || !out[d]) continue;
    out[d].push(it);
  }
  // Order: highest confidence first, then most recent.
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => (b.confidence || 0) - (a.confidence || 0) || (b.addedAt || 0) - (a.addedAt || 0));
  }
  return out;
}

export function selectQueueForDomain(store, domain) {
  const all = selectReviewQueueByDomain(store);
  return all[domain] || [];
}

// Map a queue item's source/event-type to the eventType the timeline
// would use, so consequence-based always-red overrides apply at queue
// surfacing time too. (e.g. a destroyed-item finding lands in Red.)
function eventTypeForQueueItem(item) {
  if (!item) return null;
  if (item.sourceType === 'item-change' && item.payload?.action) {
    const a = item.payload.action;
    if (a === 'destroyed') return 'item_destroyed';
    if (a === 'transferred' || a === 'lost') return 'item_transferred';
    return 'item_acquired';
  }
  if (item.sourceType === 'stat-change' && item.payload?.permanent) return 'permanent_stat_change';
  return null;
}

// Bucket pending items by risk band (Blue/Green/Amber/Red). Always-red
// event types override confidence — a death finding is RED even at 99%.
export function selectQueueByBand(store, domain) {
  const items = selectQueueForDomain(store, domain);
  const out = { blue: [], green: [], amber: [], red: [] };
  for (const it of items) {
    const eventType = eventTypeForQueueItem(it);
    const band = riskBandFor({ confidence: it.confidence, eventType });
    if (band === 'high') out.blue.push(it);
    else if (band === 'normal') out.green.push(it);
    else if (band === 'amber_review') out.amber.push(it);
    else out.red.push(it);
  }
  return out;
}

// Build a stable fingerprint for a queue item so we can suppress
// re-suggestions of dismissed findings. Tied to (kind, normalised name,
// chapterId) — extraction is idempotent on those three.
export function fingerprintFor(item) {
  if (!item) return null;
  const name = String(item.draft?.name || item.name || '').toLowerCase().trim();
  if (!name) return null;
  return `${item.kind || 'unknown'}:${name}:${item.chapterId || ''}`;
}

// Set of fingerprints the writer has dismissed in the last 30 days.
// Used by the pipeline to avoid re-suggesting the same finding after a
// re-extraction of the same chapter.
const DISMISSED_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export function selectDismissedFingerprints(store) {
  const queue = Array.isArray(store?.reviewQueue) ? store.reviewQueue : [];
  const now = Date.now();
  const out = new Set();
  for (const it of queue) {
    if (!it || it.status !== 'dismissed') continue;
    if (it.actedAt && (now - it.actedAt) > DISMISSED_TTL_MS) continue;
    const fp = fingerprintFor(it);
    if (fp) out.add(fp);
  }
  return out;
}

// Pending = anything not yet acted on. History = committed/merged/dismissed
// for the audit/undo view.
export function selectQueueHistory(store, domain) {
  const queue = Array.isArray(store?.reviewQueue) ? store.reviewQueue : [];
  return queue.filter(it => {
    if (!it) return false;
    if (it.status !== 'committed' && it.status !== 'merged' && it.status !== 'dismissed') return false;
    return domainForKind(it.kind) === domain;
  }).sort((a, b) => (b.actedAt || b.addedAt || 0) - (a.actedAt || a.addedAt || 0));
}

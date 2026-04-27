// Loomwright — review queue selectors. Routes the flat `reviewQueue` slice
// (populated by `ai/pipeline.js`) into per-tab buckets so each panel can
// surface only the findings it cares about.

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
  const showAutoAdded = store?.profile?.reviewAutomation?.showAutoAdded !== false;
  const out = { cast: [], atlas: [], items: [], quests: [], skills: [], continuity: [] };
  for (const it of queue) {
    if (!it || it.status === 'dismissed' || it.status === 'committed' || it.status === 'merged') continue;
    if (!showAutoAdded && it.status === 'auto-applied') continue;
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

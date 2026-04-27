// Loomwright — entity timeline selectors. Filters the flat `timelineEvents`
// slice by (kind, id), reading both the legacy `actorId` (character primary)
// and the multi-entity `entityRefs` array. Sorts by manuscript chapter order
// (book.chapterOrder index) with createdAt as the tiebreaker.
//
// Memoized against the timelineEvents array reference + chapterOrder reference
// so re-renders don't rebuild the index unless the canon actually changes.

const cache = new WeakMap(); // timelineEvents array -> { chapterOrder, indexByEntity }

function buildIndex(events, chapterOrder) {
  // entityKey -> sorted event[]
  const byEntity = new Map();
  const orderIndex = new Map();
  (chapterOrder || []).forEach((cid, i) => orderIndex.set(cid, i));

  const sortKey = (e) => {
    const ord = e.chapterId != null && orderIndex.has(e.chapterId)
      ? orderIndex.get(e.chapterId) : Number.MAX_SAFE_INTEGER;
    return [ord, e.createdAt || 0];
  };

  for (const ev of events || []) {
    if (!ev) continue;
    const refs = collectRefs(ev);
    for (const ref of refs) {
      const key = `${ref.kind}:${ref.id}`;
      if (!byEntity.has(key)) byEntity.set(key, []);
      byEntity.get(key).push(ev);
    }
  }
  for (const list of byEntity.values()) {
    list.sort((a, b) => {
      const [ao, at] = sortKey(a);
      const [bo, bt] = sortKey(b);
      return ao - bo || at - bt;
    });
  }
  return { chapterOrder, byEntity };
}

// Collect every (kind, id) the event touches. Reads legacy `actorId`
// (character primary) and the modern `entityRefs` array.
function collectRefs(ev) {
  const out = [];
  if (ev.actorId) out.push({ kind: 'character', id: ev.actorId });
  if (Array.isArray(ev.entityRefs)) {
    for (const r of ev.entityRefs) {
      if (r && r.kind && r.id) out.push({ kind: r.kind, id: r.id });
    }
  }
  // De-dupe — same entity may appear in both fields.
  const seen = new Set();
  return out.filter(r => {
    const k = `${r.kind}:${r.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function selectEventsForEntity(store, kind, id) {
  if (!kind || !id) return [];
  const events = Array.isArray(store?.timelineEvents) ? store.timelineEvents : [];
  const chapterOrder = store?.book?.chapterOrder || [];
  let entry = cache.get(events);
  if (!entry || entry.chapterOrder !== chapterOrder) {
    entry = buildIndex(events, chapterOrder);
    cache.set(events, entry);
  }
  return entry.byEntity.get(`${kind}:${id}`) || [];
}

// Public for tests / debugging.
export function _refsFor(ev) { return collectRefs(ev); }

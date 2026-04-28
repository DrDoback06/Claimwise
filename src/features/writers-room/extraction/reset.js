// Loomwright — extraction reset + undo.
//
// resetExtraction: nuclear option. Clears the review queue, deletes every
// loom-drafted entity (cast / places / items / quests / skills / factions /
// lore / plots where draftedByLoom === true), and clears entityEvents,
// entityLinks, entityMentions, entityAudit, and extractionRuns. Preserves
// any entity the writer has manually edited — `draftedByLoom` flips to
// false on first user edit (see clearDraftFlag in store/mutators.js).
//
// undoLastExtraction: surgical. Looks up the most recent entry in
// extractionHistory, removes the queue items it created, and reverses any
// auto-applied entities (matched by id stamped in the queue items).

const SLICES_WITH_DRAFT_FLAG = ['cast', 'places', 'items', 'quests', 'skills', 'factions', 'lore', 'plots'];

export function resetExtraction(store, opts = {}) {
  const includeManual = !!opts.includeManual;
  store.transaction(({ setSlice }) => {
    setSlice('reviewQueue', []);
    setSlice('entityEvents', []);
    setSlice('entityLinks', []);
    setSlice('entityMentions', []);
    setSlice('entityAudit', []);
    setSlice('extractionRuns', {});
    setSlice('extractionHistory', []);
    setSlice('continuity', { findings: [], lastScanAt: null });
    for (const sliceName of SLICES_WITH_DRAFT_FLAG) {
      setSlice(sliceName, xs => {
        if (!Array.isArray(xs)) return xs;
        return includeManual ? [] : xs.filter(x => !x.draftedByLoom);
      });
    }
    // Strip Loom-added relationships from cast members the writer kept.
    setSlice('cast', xs => {
      if (!Array.isArray(xs)) return xs;
      return xs.map(c => ({
        ...c,
        relationships: (c.relationships || []).filter(r => !r.draftedByLoom),
      }));
    });
  });
}

export function undoLastExtraction(store) {
  const history = store.extractionHistory || [];
  if (!history.length) return null;
  const last = history[history.length - 1];

  store.transaction(({ setSlice }) => {
    // Drop queue items this run created.
    if ((last.queueIds || []).length) {
      const toDrop = new Set(last.queueIds);
      setSlice('reviewQueue', xs => (xs || []).filter(it => !toDrop.has(it.id)));
    }
    // Drop entity events / links / mentions / audit entries stamped with
    // this runId.
    setSlice('entityEvents', xs => (xs || []).filter(ev => ev.runId !== last.id));
    setSlice('entityLinks', xs => (xs || []).filter(l => l.runId !== last.id));
    setSlice('entityMentions', xs => (xs || []).filter(m => m.runId !== last.id));
    setSlice('entityAudit', xs => (xs || []).filter(a => a.runId !== last.id));

    // Drop any draft entity that was created by this run. We don't have
    // direct stamping by runId on cast/places/etc, so we conservatively
    // identify them by `draftedByLoom: true` AND `extractedFromChapter`
    // matching the run's chapter — the exact rows the auto-apply step
    // stamped. Manual edits flip draftedByLoom to false so they survive.
    const chId = last.chapterId;
    for (const sliceName of SLICES_WITH_DRAFT_FLAG) {
      setSlice(sliceName, xs => {
        if (!Array.isArray(xs)) return xs;
        return xs.filter(x => !(x.draftedByLoom && x.extractedFromChapter === chId));
      });
    }

    // Drop the history entry itself.
    setSlice('extractionHistory', xs => (xs || []).slice(0, -1));
  });

  return last;
}

// How many entities + queue items the next undo would remove. Used for the
// command-palette confirmation copy.
export function describeLastExtraction(store) {
  const history = store.extractionHistory || [];
  if (!history.length) return null;
  const last = history[history.length - 1];
  const queue = (store.reviewQueue || []).filter(it => last.queueIds?.includes(it.id));
  const chapter = store.chapters?.[last.chapterId];
  return {
    mode: last.mode,
    chapterTitle: chapter?.title || 'Chapter',
    chapterN: chapter?.n,
    queueCount: queue.length,
    summary: last.summary || {},
    finishedAt: last.finishedAt,
  };
}

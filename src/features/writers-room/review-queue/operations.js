// Loomwright — review queue operations. Commit / merge / dismiss / promote.
//
// Reuses the store-helper-shaped `createCharacter / createPlace / createItem
// / createQuest` mutators (so the operations work both inside a transaction
// and against the live store) and writes timeline events into the in-store
// `timelineEvents` slice.

import {
  createCharacter, createPlace, createItem, createQuest, createThread,
} from '../store/mutators';
import { rid } from '../store/mutators';

// Helper: stamp a queue item with its action result so the history view
// shows what was done. Mutates the slice transactionally.
function patchQueueItem(setSlice, itemId, patch) {
  setSlice('reviewQueue', xs => (xs || []).map(it =>
    it.id === itemId ? { ...it, ...patch, actedAt: Date.now() } : it
  ));
}

function appendTimelineEvent(setSlice, event) {
  setSlice('timelineEvents', xs => [
    ...(Array.isArray(xs) ? xs : []),
    {
      id: rid('te'),
      createdAt: Date.now(),
      ...event,
    },
  ]);
}

// Build a patch for a new entity from a queue item's draft + name + notes.
function patchFor(item) {
  const draft = item.draft || {};
  return {
    name: draft.name || item.name || 'Unnamed',
    description: draft.notes || item.notes || '',
    notes: draft.notes || item.notes || '',
    draftedByLoom: true,
    extractedFromChapter: item.chapterId || null,
  };
}

// Commit a single queue item: creates the canonical entity (if 'new'), or
// promotes a 'known' item into a timeline event on the resolved entity.
export function commitQueueItem(store, itemId) {
  const queue = store.reviewQueue || [];
  const item = queue.find(x => x.id === itemId);
  if (!item) return null;
  let createdEntityId = null;

  store.transaction(({ setSlice, get }) => {
    // 'known' findings are cross-chapter mentions of an existing entity →
    // record a timeline event rather than creating a duplicate.
    if (item.status === 'known' && item.resolvesTo) {
      const target = item.resolvesTo;
      if (item.kind === 'character') {
        appendTimelineEvent(setSlice, {
          actorId: target,
          eventType: 'mention',
          chapterId: item.chapterId || null,
          data: {
            description: item.notes || `Appeared in chapter`,
            sourceQuote: item.sourceQuote || null,
          },
        });
      }
      patchQueueItem(setSlice, itemId, { status: 'committed', resolvedAs: target });
      createdEntityId = target;
      return;
    }

    // 'new' findings → create the entity using a transaction-scoped helper.
    const helper = { setSlice, setPath: (p, v) => {} };
    const patch = patchFor(item);
    if (item.kind === 'character') {
      createdEntityId = createCharacter(helper, patch);
      appendTimelineEvent(setSlice, {
        actorId: createdEntityId,
        eventType: 'introduced',
        chapterId: item.chapterId || null,
        data: { description: `Introduced in chapter`, sourceQuote: item.sourceQuote || null },
      });
    } else if (item.kind === 'place') {
      createdEntityId = createPlace(helper, patch);
    } else if (item.kind === 'item') {
      createdEntityId = createItem(helper, patch);
    } else if (item.kind === 'quest') {
      createdEntityId = createQuest(helper, patch);
    } else if (item.kind === 'thread') {
      createdEntityId = createThread(helper, patch);
    } else if (item.kind === 'fact') {
      // Facts attach to continuity — append as a continuity finding.
      setSlice('continuity', c => {
        const cur = c || { findings: [], lastScanAt: null };
        return {
          ...cur,
          findings: [...(cur.findings || []), {
            id: rid('cf'),
            kind: 'fact',
            chapterId: item.chapterId || null,
            text: item.name || item.notes,
            severity: 'info',
            createdAt: Date.now(),
          }],
        };
      });
      createdEntityId = null;
    } else if (item.kind === 'relationship') {
      // Relationship findings are descriptive only here; users wire them in
      // the cast tangle. Record as a fact for now so the data isn't lost.
      setSlice('continuity', c => {
        const cur = c || { findings: [], lastScanAt: null };
        return {
          ...cur,
          findings: [...(cur.findings || []), {
            id: rid('cf'),
            kind: 'relationship',
            chapterId: item.chapterId || null,
            text: item.name + (item.notes ? ` — ${item.notes}` : ''),
            severity: 'info',
            createdAt: Date.now(),
          }],
        };
      });
      createdEntityId = null;
    }

    patchQueueItem(setSlice, itemId, {
      status: 'committed',
      resolvedAs: createdEntityId,
    });
  });

  return createdEntityId;
}

// Merge: fold queue item B into queue item or canonical entity A. Both can
// be queue items (user dragged one onto another) or the survivor can be a
// canonical entity id (drag onto a roster row).
export function mergeQueueItem(store, deadId, survivorRef) {
  // survivorRef can be: { itemId } | { entityId, kind }
  const queue = store.reviewQueue || [];
  const dead = queue.find(x => x.id === deadId);
  if (!dead) return null;

  store.transaction(({ setSlice }) => {
    let survivorEntityId = null;

    // Survivor is a canonical entity → record a timeline event on it.
    if (survivorRef.entityId) {
      survivorEntityId = survivorRef.entityId;
      if (dead.kind === 'character' || survivorRef.kind === 'character') {
        appendTimelineEvent(setSlice, {
          actorId: survivorEntityId,
          eventType: 'mention',
          chapterId: dead.chapterId || null,
          data: {
            description: dead.notes || dead.name,
            sourceQuote: dead.sourceQuote || null,
            mergedFromQueue: dead.id,
          },
        });
      }
    } else if (survivorRef.itemId) {
      // Survivor is another queue item — combine their drafts.
      setSlice('reviewQueue', xs => (xs || []).map(it => {
        if (it.id !== survivorRef.itemId) return it;
        const mergedFrom = Array.isArray(it.mergedFrom) ? it.mergedFrom : [];
        return {
          ...it,
          mergedFrom: [...mergedFrom, dead.id],
          draft: {
            ...(it.draft || {}),
            // prefer the longer notes; keep both names as aliases.
            notes: [it.draft?.notes, dead.draft?.notes || dead.notes].filter(Boolean).join(' / '),
          },
        };
      }));
    }

    patchQueueItem(setSlice, deadId, {
      status: 'merged',
      mergedInto: survivorRef.entityId || survivorRef.itemId || null,
    });
  });

  return null;
}

export function dismissQueueItem(store, itemId) {
  store.transaction(({ setSlice }) => {
    patchQueueItem(setSlice, itemId, { status: 'dismissed' });
  });
}

export function editQueueItemDraft(store, itemId, patch) {
  store.transaction(({ setSlice }) => {
    setSlice('reviewQueue', xs => (xs || []).map(it =>
      it.id === itemId ? { ...it, draft: { ...(it.draft || {}), ...patch } } : it
    ));
  });
}

// Used by Specialist cross-tab routing — appends a draft into the queue
// for the target domain instead of committing inline.
export function pushDraftToQueue(store, kind, draft, opts = {}) {
  store.transaction(({ setSlice }) => {
    setSlice('reviewQueue', xs => [
      ...(Array.isArray(xs) ? xs : []),
      {
        id: rid('rq'),
        kind,
        chapterId: opts.chapterId || store.book?.currentChapterId || null,
        addedAt: Date.now(),
        status: 'pending',
        confidence: opts.confidence ?? 0.85,
        name: draft.name || 'Unnamed',
        notes: draft.notes || draft.description || '',
        draft: { ...draft },
        source: opts.source || 'specialist',
      },
    ]);
  });
}

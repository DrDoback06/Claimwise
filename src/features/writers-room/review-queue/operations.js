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
import { riskBandFor } from '../ai/confidence';

// Helper: stamp a queue item with its action result so the history view
// shows what was done. Mutates the slice transactionally.
function patchQueueItem(setSlice, itemId, patch) {
  setSlice('reviewQueue', xs => (xs || []).map(it =>
    it.id === itemId ? { ...it, ...patch, actedAt: Date.now() } : it
  ));
}

function tierFor(level) {
  const n = Number(level) || 1;
  if (n >= 5) return 'unique';
  if (n >= 4) return 'master';
  if (n >= 2) return 'adept';
  return 'novice';
}

// Append a timeline event. Accepts either the legacy single-actor shape
// ({ actorId, eventType, chapterId, data }) or the multi-entity shape
// ({ entityRefs: [{kind, id, role}], eventType, ... }). When only `actorId`
// is provided we synthesize an `entityRefs` for the unified selector. Risk
// band is derived from confidence + eventType unless the caller pins one
// (e.g. manual corrections always land in 'high'/Blue).
function appendTimelineEvent(setSlice, event) {
  const refs = Array.isArray(event.entityRefs) && event.entityRefs.length
    ? event.entityRefs
    : (event.actorId ? [{ kind: 'character', id: event.actorId, role: 'primary' }] : []);
  const band = event.riskBand
    || riskBandFor({ confidence: event.confidence, eventType: event.eventType });
  setSlice('timelineEvents', xs => [
    ...(Array.isArray(xs) ? xs : []),
    {
      id: rid('te'),
      createdAt: Date.now(),
      ...event,
      entityRefs: refs,
      riskBand: band,
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
    // Deep-extract payload commits — these mutate an existing entity
    // rather than creating a new one. Keep this branch first so it wins
    // before the generic 'known' / 'new' branches.
    if (item.sourceType === 'stat-change' && item.payload && item.resolvesTo) {
      const { stat, delta, reason } = item.payload;
      const charId = item.resolvesTo;
      setSlice('cast', cs => (cs || []).map(c => {
        if (c.id !== charId) return c;
        const stats = { ...(c.stats || {}) };
        stats[stat] = (stats[stat] || 0) + (Number(delta) || 0);
        return { ...c, stats };
      }));
      appendTimelineEvent(setSlice, {
        actorId: charId, eventType: 'stat_change', chapterId: item.chapterId,
        confidence: item.confidence,
        data: { stat, delta, reason, evidence: item.evidence || null, sourceQuote: item.sourceQuote || item.evidence?.sourceQuote || null },
      });
      patchQueueItem(setSlice, itemId, { status: 'committed', resolvedAs: charId });
      createdEntityId = charId;
      return;
    }
    if (item.sourceType === 'skill-change' && item.payload) {
      const { character, action, level } = item.payload;
      const skillName = item.draft?.name || item.name;
      const skillId = rid('skb');
      // Push into skillBank for later tree placement.
      setSlice('skillBank', xs => [
        ...(Array.isArray(xs) ? xs : []),
        { id: skillId, name: skillName, tier: tierFor(level), description: item.notes || '', createdAt: Date.now() },
      ]);
      // Stamp on the character as a personal skill too.
      if (character) {
        setSlice('cast', cs => (cs || []).map(c => {
          if (c.id !== character) return c;
          const personal = [...(c.personalSkills || c.skills || [])];
          personal.push({ id: 'sk_' + Date.now(), k: skillName, lvl: level || 1, origin: action || 'gained', detail: item.notes || '' });
          return { ...c, personalSkills: personal, skills: personal };
        }));
        appendTimelineEvent(setSlice, {
          actorId: character, eventType: 'skill_acquired', chapterId: item.chapterId,
          confidence: item.confidence,
          entityRefs: [
            { kind: 'character', id: character, role: 'learner' },
            { kind: 'skill', id: skillId, role: 'skill' },
          ],
          data: { skillName, action, level, evidence: item.evidence || null, sourceQuote: item.sourceQuote || item.evidence?.sourceQuote || null },
        });
      }
      patchQueueItem(setSlice, itemId, { status: 'committed', resolvedAs: skillId });
      createdEntityId = skillId;
      return;
    }
    if (item.sourceType === 'relationship-change' && item.payload) {
      const { a, b, kind, strength } = item.payload;
      if (a && b) {
        setSlice('cast', cs => (cs || []).map(c => {
          if (c.id !== a) return c;
          const rels = [...(c.relationships || [])];
          const existing = rels.find(r => r.to === b);
          if (existing) {
            Object.assign(existing, { kind: kind || existing.kind, strength: strength ?? existing.strength });
          } else {
            rels.push({ to: b, kind: kind || 'connected', strength: strength ?? 0, note: item.notes });
          }
          return { ...c, relationships: rels };
        }));
        appendTimelineEvent(setSlice, {
          actorId: a, eventType: 'relationship_change', chapterId: item.chapterId,
          confidence: item.confidence,
          entityRefs: [
            { kind: 'character', id: a, role: 'subject' },
            { kind: 'character', id: b, role: 'other' },
          ],
          data: { other: b, kind, strength, reason: item.notes, evidence: item.evidence || null, sourceQuote: item.sourceQuote || item.evidence?.sourceQuote || null },
        });
      }
      patchQueueItem(setSlice, itemId, { status: 'committed' });
      return;
    }
    if (item.sourceType === 'item-change' && item.payload) {
      const { action, character, item: resolvedItemId, itemName, place, placeName, reason } = item.payload;
      const itemDraftName = item.draft?.name || itemName || item.name || 'Unnamed';

      // 1. Find or create the item.
      let entityItemId = resolvedItemId;
      if (!entityItemId) {
        const existing = (get?.().items || store.items || []).find(
          x => (x.name || '').toLowerCase().trim() === itemDraftName.toLowerCase().trim());
        if (existing) {
          entityItemId = existing.id;
        } else {
          entityItemId = createItem({ setSlice }, {
            name: itemDraftName,
            description: item.notes || '',
            owner: action === 'acquired' || action === 'gifted' ? character : null,
            extractedFromChapter: item.chapterId || null,
            draftedByLoom: true,
          });
        }
      }

      // 2. Mutate the character's inventory + the item's owner.
      if (character && entityItemId) {
        if (action === 'acquired' || action === 'gifted' || action === 'transferred') {
          setSlice('cast', cs => (cs || []).map(c => {
            if (c.id !== character) return c;
            const inv = Array.isArray(c.inventory) ? c.inventory : [];
            if (inv.some(x => (x?.id || x) === entityItemId)) return c;
            return { ...c, inventory: [...inv, { id: entityItemId, addedAt: Date.now() }] };
          }));
          setSlice('items', is => (is || []).map(x => x.id === entityItemId ? { ...x, owner: character } : x));
        } else if (action === 'lost' || action === 'destroyed') {
          setSlice('cast', cs => (cs || []).map(c => {
            if (c.id !== character) return c;
            const inv = Array.isArray(c.inventory) ? c.inventory : [];
            return { ...c, inventory: inv.filter(x => (x?.id || x) !== entityItemId) };
          }));
          if (action === 'destroyed') {
            setSlice('items', is => (is || []).map(x => x.id === entityItemId ? { ...x, status: 'destroyed' } : x));
          } else {
            setSlice('items', is => (is || []).map(x => x.id === entityItemId ? { ...x, owner: null } : x));
          }
        }
      }

      // 3. Append the multi-entity timeline event.
      const eventType = action === 'destroyed' ? 'item_destroyed'
        : action === 'transferred' ? 'item_transferred'
        : action === 'lost' ? 'item_transferred'
        : 'item_acquired';
      const refs = [];
      if (character) refs.push({ kind: 'character', id: character, role: action === 'lost' ? 'former_owner' : 'owner' });
      if (entityItemId) refs.push({ kind: 'item', id: entityItemId, role: 'item' });
      if (place) refs.push({ kind: 'place', id: place, role: 'location' });
      appendTimelineEvent(setSlice, {
        actorId: character || null,
        entityRefs: refs,
        eventType,
        chapterId: item.chapterId || null,
        confidence: item.confidence,
        data: {
          description: `${itemDraftName} ${action}${placeName ? ` in ${placeName}` : ''}${reason ? ` — ${reason}` : ''}`,
          sourceQuote: item.sourceQuote || item.evidence?.sourceQuote || null,
          evidence: item.evidence || null,
          action,
        },
      });

      patchQueueItem(setSlice, item.id, { status: 'committed', resolvedAs: entityItemId });
      createdEntityId = entityItemId;
      return;
    }
    if (item.sourceType === 'quest-involvement' && item.payload) {
      const { questId, characterId, role } = item.payload;
      if (questId && characterId) {
        setSlice('quests', qs => (qs || []).map(q => {
          if (q.id !== questId) return q;
          const cur = new Set(q.characters || []);
          cur.add(characterId);
          return { ...q, characters: [...cur] };
        }));
        appendTimelineEvent(setSlice, {
          actorId: characterId, eventType: 'quest_involvement', chapterId: item.chapterId,
          confidence: item.confidence,
          entityRefs: [
            { kind: 'character', id: characterId, role: role || 'actor' },
            { kind: 'quest', id: questId, role: 'quest' },
          ],
          data: { questId, role, evidence: item.evidence || null, sourceQuote: item.sourceQuote || item.evidence?.sourceQuote || null },
        });
      }
      patchQueueItem(setSlice, itemId, { status: 'committed', resolvedAs: questId });
      createdEntityId = questId;
      return;
    }

    // 'known' findings are cross-chapter mentions of an existing entity →
    // record a timeline event rather than creating a duplicate.
    if (item.status === 'known' && item.resolvesTo) {
      const target = item.resolvesTo;
      if (item.kind === 'character') {
        appendTimelineEvent(setSlice, {
          actorId: target,
          eventType: 'mention',
          chapterId: item.chapterId || null,
          confidence: item.confidence,
          data: {
            description: item.notes || `Appeared in chapter`,
            sourceQuote: item.sourceQuote || item.evidence?.sourceQuote || null,
            evidence: item.evidence || null,
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
        confidence: item.confidence,
        data: {
          description: `Introduced in chapter`,
          sourceQuote: item.sourceQuote || item.evidence?.sourceQuote || null,
          evidence: item.evidence || null,
        },
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

// Bulk variants — same semantics as their single-item siblings but issued
// as one transaction so the UI re-renders once instead of N times.
export function bulkDismiss(store, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const set = new Set(ids);
  store.transaction(({ setSlice }) => {
    setSlice('reviewQueue', xs => (xs || []).map(it =>
      set.has(it.id) ? { ...it, status: 'dismissed', actedAt: Date.now() } : it
    ));
  });
}

// Bulk commit. Re-uses `commitQueueItem` per id; each call opens its own
// transaction. We keep them sequential because earlier commits may create
// canonical entities that later commits resolve to.
export function bulkCommit(store, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const out = [];
  for (const id of ids) {
    const result = commitQueueItem(store, id);
    if (result) out.push(result);
  }
  return out;
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

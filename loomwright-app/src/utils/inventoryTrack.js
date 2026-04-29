/**
 * Inventory Track helpers.
 *
 * Data model
 * ----------
 *   item.track = {
 *     [chapterNumber]: { actorId, slotId, stateId, note }
 *   }
 *
 *   actor.inventoryTrack = {
 *     [chapterNumber]: { [slotId]: { itemId, stateId, note } }
 *   }
 *
 * The item.track is the source of truth. actor.inventoryTrack is an
 * (optional) denormalised cache to speed up per-actor rendering.
 *
 * All helpers here are pure — they return new objects and never mutate.
 */

import { SLOT_DEFS, ensureItemWardrobeShape, ensureWardrobeShape } from '../loomwright/wardrobe/schema';

const LEGACY_SLOT_MAP = Object.fromEntries(
  SLOT_DEFS.filter((s) => s.legacyKey).map((s) => [s.legacyKey, s.id])
);

/**
 * resolveAsOf — for a given item, find its recorded state at or before
 * the given chapter. Returns { actorId, slotId, stateId, note, _atCh } or null.
 */
export function resolveAsOf(item, chapter) {
  if (!item || !item.track) return null;
  const keys = Object.keys(item.track)
    .map(Number)
    .filter((k) => !Number.isNaN(k) && k <= chapter)
    .sort((a, b) => a - b);
  if (!keys.length) return null;
  const k = keys[keys.length - 1];
  return { ...item.track[k], _atCh: k };
}

/**
 * Returns the set of chapter numbers that appear anywhere in an item's track.
 */
export function getItemChapterKeys(item) {
  if (!item?.track) return [];
  return Object.keys(item.track)
    .map(Number)
    .filter((k) => !Number.isNaN(k))
    .sort((a, b) => a - b);
}

/**
 * upsertTrackEntry — returns a new item with a track entry set for `chapter`.
 * Passing null for actorId/slotId records "not present in the story" at that
 * chapter (useful for marking lost/destroyed/burned).
 */
export function upsertTrackEntry(item, chapter, entry) {
  const it = ensureItemWardrobeShape(item);
  const nextTrack = { ...(it.track || {}) };
  if (entry === null) {
    delete nextTrack[chapter];
  } else {
    nextTrack[chapter] = {
      actorId: entry.actorId ?? null,
      slotId: entry.slotId ?? null,
      stateId: entry.stateId ?? 'pristine',
      note: entry.note ?? '',
    };
  }
  return { ...it, track: nextTrack };
}

/**
 * For a given actor + chapter, return an object { [slotId]: { itemId, stateId, note } }
 * computed from every item's track. This is the on-demand, always-correct view.
 */
export function computeActorInventoryAtChapter(actor, allItems, chapter) {
  if (!actor) return {};
  const result = {};
  const items = (allItems || []).map(ensureItemWardrobeShape);
  items.forEach((item) => {
    const cur = resolveAsOf(item, chapter);
    if (!cur) return;
    if (cur.actorId !== actor.id) return;
    if (!cur.slotId) return;
    if (!result[cur.slotId]) {
      result[cur.slotId] = { itemId: item.id, stateId: cur.stateId, note: cur.note };
    } else {
      // Slot already occupied — fall back to a bag keyed by slot+ordinal
      let n = 2;
      while (result[`${cur.slotId}_${n}`]) n += 1;
      result[`${cur.slotId}_${n}`] = { itemId: item.id, stateId: cur.stateId, note: cur.note };
    }
  });
  return result;
}

/**
 * For a given actor at a chapter, return [{ item, slotId, stateId, note, isEcho }]
 * flat list useful for list views. `isEcho` means the last known entry is before
 * the requested chapter (i.e. we're inferring continued possession).
 */
export function listActorItemsAtChapter(actor, allItems, chapter) {
  if (!actor) return [];
  const items = (allItems || []).map(ensureItemWardrobeShape);
  const out = [];
  items.forEach((item) => {
    const cur = resolveAsOf(item, chapter);
    if (!cur) return;
    if (cur.actorId !== actor.id) return;
    if (!cur.slotId) return;
    out.push({
      item,
      slotId: cur.slotId,
      stateId: cur.stateId,
      note: cur.note,
      isEcho: cur._atCh !== chapter,
      sourceChapter: cur._atCh,
    });
  });
  return out;
}

/**
 * Given an actor that was created before the wardrobe model existed, seed a
 * chapter-1 track from their legacy `equipment` + `inventory` arrays so the
 * Wardrobe view has something to show on day one.
 * Returns { actorMutated, itemsMutated } — shallow-merge-back arrays.
 */
export function migrateLegacyEquipmentToTrack(actor, allItems, seedChapter = 1) {
  const a = ensureWardrobeShape(actor);
  const items = (allItems || []).map(ensureItemWardrobeShape);
  const itemsById = Object.fromEntries(items.map((i) => [i.id, i]));
  const nextItems = [...items];
  const touchedItemIds = new Set();

  const recordOn = (itemId, slotId) => {
    if (!itemId) return;
    const it = itemsById[itemId];
    if (!it) return;
    // Only seed if the item has no track yet
    if (it.track && Object.keys(it.track).length) return;
    const updated = upsertTrackEntry(it, seedChapter, {
      actorId: a.id,
      slotId,
      stateId: 'pristine',
      note: 'Auto-seeded from legacy equipment at migration.',
    });
    const idx = nextItems.findIndex((x) => x.id === it.id);
    if (idx >= 0) nextItems[idx] = updated;
    itemsById[itemId] = updated;
    touchedItemIds.add(itemId);
  };

  const eq = a.equipment || {};
  Object.entries(eq).forEach(([legacyKey, val]) => {
    const slotId = LEGACY_SLOT_MAP[legacyKey] || 'pack';
    if (Array.isArray(val)) {
      val.filter(Boolean).forEach((id, i) => {
        // Ring array -> ring1/ring2, charms bag -> pack
        if (legacyKey === 'rings') {
          recordOn(id, i === 0 ? 'ring1' : i === 1 ? 'ring2' : 'pack');
        } else {
          recordOn(id, slotId);
        }
      });
    } else if (val) {
      recordOn(val, slotId);
    }
  });

  // Anything in inventory but not equipped goes to `pack`
  (a.inventory || []).filter(Boolean).forEach((id) => {
    if (!touchedItemIds.has(id)) recordOn(id, 'pack');
  });

  const nextActor = {
    ...a,
    inventoryTrack: {
      ...(a.inventoryTrack || {}),
      // leave the live cache empty; computeActorInventoryAtChapter is the truth
    },
  };

  return { actor: nextActor, items: nextItems };
}

/**
 * Mutates (immutably) the set of items so that ownership/slot/state is
 * recorded for `chapter`. Convenience helper for ItemEditor / StarterKit.
 */
export function applyTrackUpdates(allItems, updates) {
  const items = (allItems || []).map(ensureItemWardrobeShape);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  updates.forEach((u) => {
    const base = byId[u.itemId];
    if (!base) return;
    byId[u.itemId] = upsertTrackEntry(base, u.chapter, u.entry);
  });
  return Object.values(byId);
}

export default {
  resolveAsOf,
  getItemChapterKeys,
  upsertTrackEntry,
  computeActorInventoryAtChapter,
  listActorItemsAtChapter,
  migrateLegacyEquipmentToTrack,
  applyTrackUpdates,
};

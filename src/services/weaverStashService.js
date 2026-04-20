/**
 * weaverStashService - thin wrapper around the `weaverStash` IndexedDB store.
 *
 * Anywhere that generates AI prose proposals (Canon Weaver chapter edits,
 * Chapter Templates, future Atlas proposals etc.) pushes into the stash
 * instead of inserting directly into the chapter. The Write page's right
 * pane renders the list with Bring Over / Edit / Discard actions so the
 * author stays in control.
 */

import db from './database';

function uid() {
  return `stash_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Add a proposed draft to the stash. Returns the saved record.
 *
 * @param {object} input
 * @param {string} input.content           - Full prose draft.
 * @param {string} [input.title]           - Short label for list UI.
 * @param {string} [input.source='weaver'] - 'weaver' | 'template' | 'continue' | custom.
 * @param {string} [input.bookId]
 * @param {string} [input.chapterId]
 * @param {object} [input.meta]            - Free-form metadata (template id, weaver edit id...).
 */
export async function addStashItem(input) {
  const item = {
    id: uid(),
    title: input.title || input.source || 'Untitled draft',
    content: String(input.content || ''),
    source: input.source || 'weaver',
    bookId: input.bookId || null,
    chapterId: input.chapterId || null,
    meta: input.meta || null,
    status: 'proposed', // 'proposed' | 'edited' | 'brought-over' | 'discarded'
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  try {
    await db.add('weaverStash', item);
  } catch (err) {
    console.error('[weaverStash] add failed:', err?.name, err?.message, err);
    throw err;
  }
  return item;
}

export async function listStashItems({ bookId = null, chapterId = null } = {}) {
  const all = await db.getAll('weaverStash', false).catch(() => []);
  let items = all || [];
  if (bookId) items = items.filter((i) => !i.bookId || i.bookId === bookId);
  if (chapterId) items = items.filter((i) => !i.chapterId || i.chapterId === chapterId);
  // Newest first.
  items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return items;
}

export async function updateStashItem(id, patch) {
  const existing = await db.get('weaverStash', id);
  if (!existing) throw new Error('Stash item not found: ' + id);
  const next = { ...existing, ...patch, updatedAt: Date.now() };
  await db.update('weaverStash', next);
  return next;
}

export async function markStashItem(id, status) {
  return updateStashItem(id, { status });
}

export async function deleteStashItem(id) {
  await db.delete('weaverStash', id);
}

const weaverStashService = {
  addStashItem,
  listStashItems,
  updateStashItem,
  markStashItem,
  deleteStashItem,
};

export default weaverStashService;

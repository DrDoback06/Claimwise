// Loomwright — wiki bridge. Reuses the existing IndexedDB `wikiEntries`
// store (created in src/services/database.js) so legacy wiki entries and
// new ones live in the same place.
//
// On commit of an AI-crafted item / skill / quest / character we call
// `ensureWikiEntry({entityType, entity, body})` which writes the markdown
// to the wikiEntries store keyed by entityId.

import db from '../../../services/database';
import aiService from '../../../services/aiService';

function rid(prefix = 'wiki') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

async function dbInit() {
  try { await db.init(); } catch {}
}

export async function getWikiEntry(entityId) {
  await dbInit();
  try {
    const all = await db.getAll('wikiEntries').catch(() => []);
    return (all || []).find(e => e.entityId === entityId) || null;
  } catch { return null; }
}

export async function listWikiEntriesByType(entityType) {
  await dbInit();
  try {
    const all = await db.getAll('wikiEntries').catch(() => []);
    return (all || []).filter(e => e.entityType === entityType);
  } catch { return []; }
}

// Write or update a wiki entry. If `body` is omitted, ask the AI to draft one.
export async function ensureWikiEntry({ entityId, entityType, entity, body, draftedByLoom = false }) {
  if (!entityId) return null;
  await dbInit();
  let content = body;
  if (!content) {
    try {
      content = await aiService.generateWikiEntry(entityType, { ...entity, name: entity?.name || entity?.title });
    } catch (err) {
      content = '## Overview\n\n_Wiki entry pending — couldn\'t reach the model._';
    }
  }
  const existing = await getWikiEntry(entityId);
  const record = {
    id: existing?.id || rid('wiki'),
    entityId,
    entityType,
    name: entity?.name || entity?.title || existing?.name || 'Untitled',
    body: content,
    draftedByLoom,
    updatedAt: Date.now(),
    createdAt: existing?.createdAt || Date.now(),
  };
  try {
    if (existing) await db.update('wikiEntries', record);
    else await db.add('wikiEntries', record);
  } catch (err) {
    console.warn('[lw-wiki] write failed', err?.message);
  }
  return record;
}

export async function deleteWikiEntry(entityId) {
  await dbInit();
  const existing = await getWikiEntry(entityId);
  if (!existing) return;
  try { await db.delete('wikiEntries', existing.id); } catch {}
}

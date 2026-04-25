// Loomwright — persistence (plan §4).
//
// We reuse the existing IndexedDB layer in src/services/database.js (the
// "ClaimwiseOmniscience" DB at version 22 already has every store we need).
// The redesign branch's loading/persistence pattern is preserved, with
// migrations and dot-path-aware writes.

import db from '../../../services/database';
import { EMPTY_BOOK, EMPTY_PROFILE, EMPTY_UI, DEFAULT_TWEAKS, SCHEMA_VERSION } from './schema';

// Store names (mirroring database.js v22).
export const S = {
  meta: 'meta',
  books: 'books',
  actors: 'actors',
  locations: 'locations',
  plotThreads: 'plotThreads',
  items: 'itemBank',
  voices: 'characterVoices',
  nodes: 'mindMapNodes',
  edges: 'mindMapEdges',
  mapState: 'mindMapState',
  profile: 'storyProfile',
  feedback: 'suggestionFeedback',
  wizard: 'wizardState',
};

const META = {
  profile: 'lw.profile',
  ui: 'lw.ui',
  noticings: 'lw.noticings',
  schemaVersion: 'lw.schemaVersion',
  reviewQueue: 'lw.reviewQueue',
  snapshots: 'lw.snapshots',
};

// ─── Safe wrappers ────────────────────────────────────────────────────
async function dbGetAll(store) {
  try { await db.init(); return (await db.getAll(store)) || []; }
  catch (e) { console.warn('[lw-persist] getAll', store, e?.message); return []; }
}
async function dbGet(store, id, fallback = null) {
  try { await db.init(); const r = await db.get(store, id); return r || fallback; }
  catch (e) { console.warn('[lw-persist] get', store, id, e?.message); return fallback; }
}
async function dbPut(store, record) {
  try { await db.init(); await db.update(store, record); return record; }
  catch (e) {
    try { return await db.add(store, record); }
    catch (e2) { console.warn('[lw-persist] put', store, e2?.message); return null; }
  }
}
async function dbDel(store, id) {
  try { await db.init(); await db.delete(store, id); return true; }
  catch (e) { console.warn('[lw-persist] del', store, id, e?.message); return false; }
}

// ─── Migrations ───────────────────────────────────────────────────────
const MIGRATIONS = {
  // 0 -> 1: lift legacy localStorage keys (lw.*) into IDB meta. Idempotent.
  1: async () => {
    if (typeof localStorage === 'undefined') return;
    const keys = ['lw.profile', 'lw.ui', 'lw.noticings'];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const data = JSON.parse(raw);
        const existing = await dbGet(S.meta, k);
        if (!existing) {
          await dbPut(S.meta, { id: k, data });
        }
      } catch {}
    }
  },
  // 1 -> 2: ensure profile carries new aiProvider/apiKeys fields. Idempotent.
  2: async () => {
    const cur = await dbGet(S.meta, META.profile);
    if (!cur) return;
    const data = cur.data || cur;
    const next = {
      ...data,
      aiProvider: data.aiProvider || data.preferredProvider || 'auto',
      apiKeys: data.apiKeys || {},
    };
    await dbPut(S.meta, { id: META.profile, data: next });
  },
};

export async function runMigrations() {
  const rec = await dbGet(S.meta, META.schemaVersion);
  const current = rec?.data?.version || 0;
  if (current >= SCHEMA_VERSION) return;
  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const fn = MIGRATIONS[v];
    if (fn) {
      try { await fn(); console.info(`[lw-persist] migration ${v} done`); }
      catch (e) { console.warn(`[lw-persist] migration ${v} failed`, e); }
    }
  }
  await dbPut(S.meta, { id: META.schemaVersion, data: { version: SCHEMA_VERSION, at: Date.now() } });
}

// ─── Hydrate ──────────────────────────────────────────────────────────
function pickColor(seed = 0) {
  const palette = [
    'oklch(62% 0.16 25)', 'oklch(55% 0.10 220)', 'oklch(60% 0.10 145)',
    'oklch(72% 0.13 78)', 'oklch(55% 0.15 45)', 'oklch(58% 0.12 300)',
    'oklch(55% 0.08 200)',
  ];
  return palette[Math.abs(seed) % palette.length];
}

export async function loadAllFromDB() {
  await runMigrations();

  const [
    profileRaw, uiRaw, books, cast, places, threads, items, voices,
    nodes, edges, mapState, noticingsRaw, reviewQueueRaw, snapshotsRaw,
  ] = await Promise.all([
    dbGet(S.meta, META.profile),
    dbGet(S.meta, META.ui),
    dbGetAll(S.books),
    dbGetAll(S.actors),
    dbGetAll(S.locations),
    dbGetAll(S.plotThreads),
    dbGetAll(S.items),
    dbGetAll(S.voices),
    dbGetAll(S.nodes),
    dbGetAll(S.edges),
    dbGet(S.mapState, 'default'),
    dbGet(S.meta, META.noticings),
    dbGet(S.meta, META.reviewQueue),
    dbGet(S.meta, META.snapshots),
  ]);

  const profile = { ...EMPTY_PROFILE, ...(profileRaw?.data || profileRaw || {}) };
  const ui = { ...EMPTY_UI, ...(uiRaw?.data || uiRaw || {}) };
  ui.tweaks = { ...DEFAULT_TWEAKS, ...(ui.tweaks || {}) };

  const primaryBook = books.find(b => b.id === 'lw.primary') || books[0] || null;
  const book = primaryBook ? { ...EMPTY_BOOK, ...primaryBook } : { ...EMPTY_BOOK };

  const rawChapters = (primaryBook?.chapters || []);
  const chapters = {};
  const orderFromBook = [];
  rawChapters.forEach((c, i) => {
    const id = c.id || ('ch_' + (c.chapterId || i));
    chapters[id] = {
      id,
      n: c.n ?? c.chapterNumber ?? i + 1,
      title: c.title || `Chapter ${i + 1}`,
      text: c.text ?? c.script ?? c.content ?? '',
      paragraphs: c.paragraphs || null, // computed lazily by editor if absent
      scenes: c.scenes || [],
      lastEdit: c.lastEdit || null,
    };
    orderFromBook.push(id);
  });
  if (!book.chapterOrder || !book.chapterOrder.length) book.chapterOrder = orderFromBook;
  if (!book.currentChapterId && book.chapterOrder.length) book.currentChapterId = book.chapterOrder[0];

  const castWithColors = (cast || []).map((c, i) => c.color ? c : { ...c, color: pickColor(i) });

  const tangle = {
    nodes: Array.isArray(nodes) ? nodes : [],
    edges: Array.isArray(edges) ? edges : [],
    layout: mapState?.layout || {},
  };

  return {
    version: SCHEMA_VERSION,
    profile,
    book,
    chapters,
    cast: castWithColors,
    places: Array.isArray(places) ? places : [],
    threads: Array.isArray(threads) ? threads : [],
    items: Array.isArray(items) ? items : [],
    skills: [],
    stats: [],
    relationships: [],
    timelineEvents: [],
    voice: Array.isArray(voices) ? voices : [],
    tangle,
    ui: { ...ui, activeChapterId: ui.activeChapterId || book.currentChapterId || null },
    noticings: noticingsRaw?.data || noticingsRaw?.value || {},
    suggestions: [],
    reviewQueue: reviewQueueRaw?.data || [],
    snapshots: snapshotsRaw?.data || [],
    feedback: [],
    _loading: false,
  };
}

// ─── Persist ──────────────────────────────────────────────────────────
async function diffPersistArray(storeName, prev, next) {
  const prevById = new Map((prev || []).map(r => [r.id, r]));
  const nextById = new Map((next || []).map(r => [r.id, r]));
  const writes = [];
  for (const [id, rec] of nextById) {
    const before = prevById.get(id);
    if (!before || JSON.stringify(before) !== JSON.stringify(rec)) {
      writes.push(dbPut(storeName, rec));
    }
  }
  for (const id of prevById.keys()) {
    if (!nextById.has(id)) writes.push(dbDel(storeName, id));
  }
  await Promise.all(writes);
}

export async function persistSlice(slice, prev, next) {
  if (slice === 'profile') {
    await dbPut(S.meta, { id: META.profile, data: next });
    if (next?.onboarded) {
      await dbPut(S.profile, { id: 'default', ...next, updatedAt: Date.now() });
    }
    return;
  }
  if (slice === 'ui') {
    const { focusMode, ...persistable } = next || {};
    await dbPut(S.meta, { id: META.ui, data: { ...persistable, id: META.ui } });
    return;
  }
  if (slice === 'noticings') {
    await dbPut(S.meta, { id: META.noticings, data: next || {} });
    return;
  }
  if (slice === 'reviewQueue') {
    await dbPut(S.meta, { id: META.reviewQueue, data: next || [] });
    return;
  }
  if (slice === 'snapshots') {
    await dbPut(S.meta, { id: META.snapshots, data: next || [] });
    return;
  }
  if (slice === 'book') {
    await dbPut(S.books, { ...EMPTY_BOOK, ...next });
    return;
  }
  if (slice === 'chapters') {
    const book = (await dbGet(S.books, 'lw.primary')) || { ...EMPTY_BOOK };
    const order = book.chapterOrder || Object.keys(next || {});
    const chArray = order.map(id => next?.[id]).filter(Boolean);
    await dbPut(S.books, { ...book, chapters: chArray });
    return;
  }
  if (slice === 'tangle') {
    await diffPersistArray(S.nodes, prev?.nodes || [], next?.nodes || []);
    await diffPersistArray(S.edges, prev?.edges || [], next?.edges || []);
    await dbPut(S.mapState, { id: 'default', layout: next?.layout || {}, updatedAt: Date.now() });
    return;
  }
  const map = {
    cast:    S.actors,
    places:  S.locations,
    threads: S.plotThreads,
    items:   S.items,
    voice:   S.voices,
  };
  if (map[slice]) await diffPersistArray(map[slice], prev || [], next || []);
}

// ─── Backup / restore ─────────────────────────────────────────────────
export async function exportBackup(state) {
  const blob = {
    schema: 'loomwright-backup',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
  return JSON.stringify(blob, null, 2);
}

export function downloadBackup(json) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `loomwright-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.lw.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importBackup(json) {
  const data = JSON.parse(json);
  if (data.schema !== 'loomwright-backup') throw new Error('Not a Loomwright backup');
  return data.state;
}

export async function clearAll() {
  try {
    await db.init();
    const stores = [S.actors, S.locations, S.plotThreads, S.items, S.voices, S.nodes, S.edges, S.books];
    await Promise.all(stores.map(s => db.clear(s).catch(() => {})));
    await Promise.all([
      dbDel(S.meta, META.profile),
      dbDel(S.meta, META.ui),
      dbDel(S.meta, META.noticings),
      dbDel(S.mapState, 'default'),
      dbDel(S.meta, META.reviewQueue),
      dbDel(S.meta, META.snapshots),
    ]);
  } catch (e) { console.warn('[lw-persist] clearAll', e); }
}

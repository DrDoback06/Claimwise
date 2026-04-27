// Loomwright — multi-saga (multi-book) project switcher.
//
// Strategy (lowest-friction, no schema migration):
//   • A "projects" registry lives in IDB meta under `lw.projects`.
//   • The current project id is stored in localStorage (`lw.currentProject`)
//     so it can be read synchronously at boot.
//   • Every META key gets namespaced with the project id prefix
//     (e.g. `default:lw.profile` instead of `lw.profile`).
//   • Every entity record in the IDB stores (S.actors, S.books, S.locations,
//     etc.) gets a `_projectId` field on write; reads filter by it.
//
// URL hash `#/p/<id>` reflects the active project so it's shareable.
//
// `default` is the legacy bucket — pre-existing data stays here so users
// who never touch projects don't see anything change.

import db from '../../../services/database';

const PROJECTS_META_KEY = 'lw.projects';
const STORAGE_KEY = 'lw.currentProject';
const DEFAULT_ID = 'default';

let _cached = null;

export function getCurrentProjectId() {
  if (_cached) return _cached;
  // Pure read — no localStorage writes during render.
  try {
    if (typeof window !== 'undefined') {
      const m = (window.location.hash || '').match(/#\/p\/([\w-]+)/);
      if (m) { _cached = m[1]; return _cached; }
      const ls = (typeof localStorage !== 'undefined') ? localStorage.getItem(STORAGE_KEY) : null;
      if (ls) { _cached = ls; return _cached; }
    }
  } catch {}
  _cached = DEFAULT_ID;
  return _cached;
}

export function setCurrentProjectId(id) {
  if (!id) id = DEFAULT_ID;
  _cached = id;
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  if (typeof window !== 'undefined') {
    // Update hash without triggering popstate listeners that route panels.
    const target = `#/p/${id}`;
    if (window.location.hash !== target) {
      window.location.hash = target;
    }
    // Force a clean reload so every store + hydrate cycle picks up the new id.
    window.location.reload();
  }
}

export function projectScope(key) {
  return `${getCurrentProjectId()}:${key}`;
}

export function projectFilter(record) {
  if (!record || typeof record !== 'object') return false;
  const pid = getCurrentProjectId();
  // Legacy records have no _projectId; treat them as belonging to 'default'.
  const recPid = record._projectId || DEFAULT_ID;
  return recPid === pid;
}

export function stampProject(record) {
  if (!record || typeof record !== 'object') return record;
  return { ...record, _projectId: getCurrentProjectId() };
}

export async function listProjects() {
  try {
    await db.init();
    const rec = await db.get('meta', PROJECTS_META_KEY);
    const list = rec?.data;
    if (Array.isArray(list) && list.length) return list;
  } catch {}
  // Seed default.
  return [{ id: DEFAULT_ID, name: 'My saga', color: 'oklch(60% 0.13 80)', createdAt: Date.now() }];
}

export async function saveProjects(list) {
  try {
    await db.init();
    await db.update('meta', { id: PROJECTS_META_KEY, data: list });
  } catch (err) {
    console.warn('[projects] saveProjects failed', err?.message);
  }
}

export async function ensureProjectExists(id, name = 'New saga') {
  const list = await listProjects();
  if (!list.find(p => p.id === id)) {
    list.push({ id, name, color: 'oklch(60% 0.13 80)', createdAt: Date.now() });
    await saveProjects(list);
  }
}

export async function createProject(name = 'New saga') {
  const id = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  const list = await listProjects();
  list.push({ id, name, color: 'oklch(60% 0.13 80)', createdAt: Date.now() });
  await saveProjects(list);
  return id;
}

export async function renameProject(id, name) {
  const list = await listProjects();
  const i = list.findIndex(p => p.id === id);
  if (i < 0) return;
  list[i] = { ...list[i], name };
  await saveProjects(list);
}

export async function deleteProject(id) {
  if (id === DEFAULT_ID) throw new Error('Cannot delete the default project.');
  const list = (await listProjects()).filter(p => p.id !== id);
  await saveProjects(list);
}

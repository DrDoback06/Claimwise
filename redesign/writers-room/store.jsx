// writers-room/store.jsx — IndexedDB-backed state layer.
//
// All persistent data now lives in the legacy Claimwise IndexedDB
// (ClaimwiseOmniscience). The store loads every slice asynchronously on
// mount, mirrors it in React state for synchronous reads, and persists
// every write back to IndexedDB so the rest of the Claimwise services
// (aiService, manuscriptIntelligenceService, integrationService, …) see
// the same records the panels see.
//
// The React-facing API is unchanged from the previous localStorage
// version: useStore() returns { profile, book, chapters, cast, places,
// threads, items, voice, tangle, ui, setSlice, setPath, reset }. Panels
// keep working. What changed: nothing is in localStorage any more.

// _getCW — reach the Claimwise services bundle on window. Named with a
// leading underscore so Babel Standalone's const→var transpilation doesn't
// collide with `window.CW` (which would wipe the bundle's 48 services).
const _getCW = () => (typeof window !== 'undefined' ? window.CW : null);

// ─── DB store names (from database.js v22) ────────────────────────────
const S = {
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

// Meta-store keys we own. Namespaced so we never collide with legacy keys.
const META = {
  profile: 'lw.profile',
  ui: 'lw.ui',
  noticings: 'lw.noticings',
};

// ─── Defaults (brand-new user) ────────────────────────────────────────
const EMPTY_PROFILE = {
  onboarded: false,
  // Story foundation
  workingTitle: null,
  seriesName: null,
  genre: null,
  genres: [],
  subGenres: [],
  premise: null,
  targetAudience: 'adult',
  comparisons: null,
  tone: [],
  pov: null,
  tense: null,
  // Targets
  targetWords: null,
  targetChapters: null,
  // World
  worldType: null,
  worldAnchor: null,
  worldRules: [],
  // Influences
  influences: [],
  // Manuscript seed
  manuscriptImported: false,
  manuscriptSeed: null,
  // Seed cast
  seedCast: [],
  // Writing preferences (legacy fields preserved)
  writingPreferences: {
    pov: '',
    tense: '',
    chapterLength: '',
    petPeeves: [],
    customPetPeeves: '',
    favorites: [],
    customFavorites: '',
    dialogueStyle: '',
    descriptionDensity: '',
    profanityLevel: '',
    romanticContent: '',
    violenceLevel: '',
  },
  // Voice sliders (what the margin listens for)
  voiceWeights: {
    formality: 0.5, rhythm: 0.5, lyricism: 0.5,
    darkness: 0.5, pov: 0.5, modernity: 0.5,
  },
  // Ritual
  ritual: { sprintLen: 25, rhythm: null },
  // AI preference signals
  intrusion: 'medium',
  entityThreshold: 0.6,
  dismissRates: { entity: 0, cast: 0, atlas: 0, thread: 0, voice: 0, lang: 0, spark: 0 },
  acceptCounts:  { entity: 0, cast: 0, atlas: 0, thread: 0, voice: 0, lang: 0, spark: 0 },
  // AI provider
  preferredProvider: 'auto',
};

const EMPTY_BOOK = {
  id: 'lw.primary',
  title: 'Untitled',
  series: null,
  currentChapterId: null,
  chapterOrder: [],
  wordsToday: 0,
  streak: 0,
  target: 2500,
  createdAt: null,
};

const DEFAULT_TWEAKS = {
  intrusion: 'medium',
  density: 'comfortable',
  showMargin: true,
  showRitualBar: true,
  highlightMargin: true,
  showChapterTree: true,
};

const EMPTY_UI = {
  id: META.ui,
  panels: [],
  panelWidths: {},
  selection: { character: null, place: null, thread: null, item: null, paragraph: null },
  tweaks: DEFAULT_TWEAKS,
  focusMode: false,
  activeChapterId: null,
  activeSceneId: null,
};

// ─── Safe DB wrappers (tolerate unavailable DB during early boot) ─────
async function dbGetAll(store) {
  const cw = _getCW(); if (!cw?.db) return [];
  try { await cw.db.init(); return (await cw.db.getAll(store)) || []; }
  catch (e) { console.warn('[store] getAll failed for', store, e?.message); return []; }
}
async function dbGet(store, id, fallback = null) {
  const cw = _getCW(); if (!cw?.db) return fallback;
  try { await cw.db.init(); const r = await cw.db.get(store, id); return r || fallback; }
  catch (e) { console.warn('[store] get failed for', store, id, e?.message); return fallback; }
}
async function dbPut(store, record) {
  const cw = _getCW(); if (!cw?.db) return null;
  try { await cw.db.init(); await cw.db.update(store, record); return record; }
  catch (e) { try { return await cw.db.add(store, record); } catch (e2) { console.warn('[store] put failed', store, e2?.message); return null; } }
}
async function dbDel(store, id) {
  const cw = _getCW(); if (!cw?.db) return false;
  try { await cw.db.init(); await cw.db.delete(store, id); return true; }
  catch (e) { console.warn('[store] delete failed', store, id, e?.message); return false; }
}

// ─── Load everything on boot ──────────────────────────────────────────
async function loadAllFromDB() {
  const [
    profileRaw, uiRaw, books, cast, places, threads, items, voices, nodes, edges, mapState,
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
  ]);

  const profile = { ...EMPTY_PROFILE, ...(profileRaw?.data || profileRaw || {}) };
  const ui = { ...EMPTY_UI, ...(uiRaw?.data || uiRaw || {}) };
  ui.tweaks = { ...DEFAULT_TWEAKS, ...(ui.tweaks || {}) };

  const primaryBook = books.find(b => b.id === 'lw.primary') || books[0] || null;
  const book = primaryBook ? { ...EMPTY_BOOK, ...primaryBook } : { ...EMPTY_BOOK };

  // Chapters are nested under the book (legacy convention). Flatten to
  // { [id]: chapter } for O(1) lookups the panels use.
  const rawChapters = (primaryBook?.chapters || []);
  const chapters = {};
  const orderFromBook = [];
  rawChapters.forEach((c, i) => {
    const id = c.id || ('ch_' + (c.chapterId || i));
    const normalized = {
      id,
      n: c.n ?? c.chapterNumber ?? i + 1,
      title: c.title || `Chapter ${i + 1}`,
      text: c.text ?? c.script ?? c.content ?? '',
      scenes: c.scenes || [],
      lastEdit: c.lastEdit || null,
    };
    chapters[id] = normalized;
    orderFromBook.push(id);
  });
  if (!book.chapterOrder || !book.chapterOrder.length) book.chapterOrder = orderFromBook;
  if (!book.currentChapterId && book.chapterOrder.length) book.currentChapterId = book.chapterOrder[0];

  // Back-fill colours on legacy actors that don't have one so panels stay legible.
  const castWithColors = (cast || []).map((c, i) => c.color ? c : { ...c, color: pickColor(i) });

  const noticingsRaw = await dbGet(S.meta, META.noticings);
  const noticings = noticingsRaw?.data || noticingsRaw?.value || {};

  const tangle = {
    nodes: Array.isArray(nodes) ? nodes : [],
    edges: Array.isArray(edges) ? edges : [],
    layout: mapState?.layout || {},
  };

  return {
    profile,
    book,
    chapters,
    cast: castWithColors,
    places: Array.isArray(places) ? places : [],
    threads: Array.isArray(threads) ? threads : [],
    items: Array.isArray(items) ? items : [],
    voice: Array.isArray(voices) ? voices : [],
    tangle,
    ui: { ...ui, activeChapterId: ui.activeChapterId || book.currentChapterId || null },
    noticings,
    feedback: [],
  };
}

function emptyState() {
  return {
    profile: { ...EMPTY_PROFILE },
    book: { ...EMPTY_BOOK },
    chapters: {},
    cast: [],
    places: [],
    threads: [],
    items: [],
    voice: [],
    tangle: { nodes: [], edges: [], layout: {} },
    ui: { ...EMPTY_UI },
    noticings: {},
    feedback: [],
    _loading: true,
  };
}

// ─── Persistence router ───────────────────────────────────────────────
async function persistSlice(slice, prev, next) {
  const cw = _getCW();
  if (!cw?.db) return;

  if (slice === 'profile') {
    await dbPut(S.meta, { id: META.profile, data: next });
    if (next.onboarded) {
      await dbPut(S.profile, { id: 'default', ...next, updatedAt: Date.now() });
    }
    return;
  }

  if (slice === 'ui') {
    const { focusMode, ...persistable } = next;
    await dbPut(S.meta, { id: META.ui, data: { ...persistable, id: META.ui } });
    return;
  }

  if (slice === 'noticings') {
    await dbPut(S.meta, { id: META.noticings, data: next });
    return;
  }

  if (slice === 'book') {
    const nextBook = { ...EMPTY_BOOK, ...next };
    await dbPut(S.books, nextBook);
    return;
  }

  if (slice === 'chapters') {
    // Chapters live inside the primary book. Rewrite the whole nested array.
    const book = (await dbGet(S.books, 'lw.primary')) || { ...EMPTY_BOOK };
    const order = book.chapterOrder || Object.keys(next);
    const chArray = order.map(id => next[id]).filter(Boolean);
    await dbPut(S.books, { ...book, chapters: chArray });
    return;
  }

  if (slice === 'tangle') {
    await diffPersistArray(S.nodes, prev?.nodes || [], next?.nodes || []);
    await diffPersistArray(S.edges, prev?.edges || [], next?.edges || []);
    await dbPut(S.mapState, { id: 'default', layout: next.layout || {}, updatedAt: Date.now() });
    return;
  }

  const storeForSlice = {
    cast:    S.actors,
    places:  S.locations,
    threads: S.plotThreads,
    items:   S.items,
    voice:   S.voices,
  }[slice];
  if (storeForSlice) {
    await diffPersistArray(storeForSlice, prev || [], next || []);
  }
}

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

// ─── React context ────────────────────────────────────────────────────
const StoreCtx = React.createContext(null);

function StoreProvider({ children }) {
  const [state, setState] = React.useState(() => emptyState());

  React.useEffect(() => {
    let cancelled = false;
    loadAllFromDB().then(loaded => {
      if (cancelled) return;
      setState(s => ({ ...loaded, _loading: false }));
    }).catch(err => {
      console.warn('[store] hydrate failed, staying on empty state:', err);
      setState(s => ({ ...s, _loading: false }));
    });
    return () => { cancelled = true; };
  }, []);

  const prevRef = React.useRef(state);
  const pendingRef = React.useRef(new Set());
  const timerRef = React.useRef(null);
  React.useEffect(() => {
    if (state._loading) { prevRef.current = state; return; }
    const prev = prevRef.current;
    const changed = [];
    for (const k of Object.keys(state)) {
      if (k === '_loading' || k === 'feedback') continue;
      if (prev[k] !== state[k]) changed.push(k);
    }
    changed.forEach(k => pendingRef.current.add(k));
    prevRef.current = state;
    if (!changed.length) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const slices = [...pendingRef.current]; pendingRef.current.clear();
      const snap = prevRef.current;
      for (const slice of slices) {
        try { await persistSlice(slice, prev[slice], snap[slice]); }
        catch (e) { console.warn('[store] persist', slice, 'failed:', e?.message); }
      }
    }, 400);
  }, [state]);

  // Flush pending writes on tab close so no keystroke is lost.
  React.useEffect(() => {
    const onBeforeUnload = async () => {
      if (pendingRef.current.size === 0) return;
      // Cancel the debounce so we flush immediately instead of 400ms later.
      clearTimeout(timerRef.current);
      const slices = [...pendingRef.current]; pendingRef.current.clear();
      const prev = {};
      for (const slice of slices) prev[slice] = prevRef.current[slice];
      const snap = prevRef.current;
      // We can't wait on async in beforeunload reliably — fire-and-forget.
      for (const slice of slices) {
        try { persistSlice(slice, prev[slice], snap[slice]); } catch (_) {}
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onBeforeUnload);
    };
  }, []);

  const setSlice = React.useCallback((slice, next) => {
    setState(s => ({ ...s, [slice]: typeof next === 'function' ? next(s[slice]) : next }));
  }, []);

  const setPath = React.useCallback((path, value) => {
    const parts = path.split('.');
    setState(s => {
      const clone = { ...s };
      let cur = clone;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = { ...cur[parts[i]] };
        cur = cur[parts[i]];
      }
      const leaf = parts[parts.length - 1];
      cur[leaf] = typeof value === 'function' ? value(cur[leaf]) : value;
      return clone;
    });
  }, []);

  const reset = React.useCallback(async () => {
    const cw = _getCW();
    if (cw?.db) {
      try {
        await cw.db.init();
        await Promise.all([
          cw.db.clear(S.actors), cw.db.clear(S.locations), cw.db.clear(S.plotThreads),
          cw.db.clear(S.items), cw.db.clear(S.voices), cw.db.clear(S.nodes),
          cw.db.clear(S.edges), cw.db.clear(S.books),
        ]);
        await Promise.all([
          dbDel(S.meta, META.profile), dbDel(S.meta, META.ui),
          dbDel(S.meta, META.noticings), dbDel(S.mapState, 'default'),
        ]);
      } catch (e) { console.warn('[store] reset failed', e); }
    }
    setState({ ...emptyState(), _loading: false });
  }, []);

  const recordFeedbackApi = React.useCallback((kind, action, extra = {}) => {
    const cw = _getCW();
    const svc = cw?.suggestionFeedbackService;
    if (svc) {
      try {
        // Legacy name is recordAcceptance; some forks expose recordFeedback.
        const fn = svc.recordAcceptance || svc.recordFeedback;
        if (fn) {
          const suggestionId = extra.suggestionId || `${kind}_${Date.now()}`;
          const promise = svc.recordAcceptance
            ? svc.recordAcceptance(suggestionId, action, { suggestionType: kind, ...extra })
            : svc.recordFeedback({ suggestionType: kind, action, timestamp: Date.now(), ...extra });
          promise?.catch?.(() => {});
        }
      } catch (_) {}
    }
    setState(s => ({
      ...s,
      feedback: [...(s.feedback || []).slice(-499), { kind, action, at: Date.now(), ...extra }],
      profile: {
        ...s.profile,
        acceptCounts: action === 'accept' || action === 'apply'
          ? { ...s.profile.acceptCounts, [kind]: (s.profile.acceptCounts?.[kind] || 0) + 1 }
          : s.profile.acceptCounts,
        dismissRates: action === 'dismiss' || action === 'reject'
          ? { ...s.profile.dismissRates, [kind]: (s.profile.dismissRates?.[kind] || 0) + 1 }
          : s.profile.dismissRates,
      },
    }));
  }, []);

  const api = React.useMemo(() => ({
    ...state, setSlice, setPath, reset,
    recordFeedback: recordFeedbackApi,
  }), [state, setSlice, setPath, reset, recordFeedbackApi]);
  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

function useStore() {
  const s = React.useContext(StoreCtx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

// ─── Small helpers ────────────────────────────────────────────────────
function rid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

function wordCount(str) {
  if (!str) return 0;
  return (str.trim().match(/\S+/g) || []).length;
}

function recordFeedback(store, kind, action, extra = {}) {
  if (store?.recordFeedback) return store.recordFeedback(kind, action, extra);
}

// ─── Entity creators ──────────────────────────────────────────────────
function createCharacter(store, patch = {}) {
  const id = patch.id || rid('ch');
  const now = Date.now();
  const rec = {
    id,
    name: patch.name || 'New character',
    role: patch.role || 'support',
    class: patch.role || patch.class || 'support', // legacy compat
    color: patch.color || pickColor(),
    status: patch.status || 'on-page',
    dossier: { bio: '', quirks: [], voice: '', notes: '' },
    traits: [], stats: {}, skills: [], inventory: [],
    threads: [], arc: [], relationships: [],
    knows: [], hides: [], fears: [],
    wants: { surface: '', true: '' },
    appears: [],
    journey: [],
    notes: '',
    createdAt: now,
    ...patch,
  };
  store.setSlice('cast', cs => [...(cs || []), rec]);
  return id;
}

function createPlace(store, patch = {}) {
  const id = patch.id || rid('pl');
  const now = Date.now();
  const rec = {
    id,
    name: patch.name || 'New place',
    kind: patch.kind || 'settlement',
    realm: patch.realm || 'the world',
    description: '',
    coordinates: patch.coordinates || null,
    x: patch.x ?? null, y: patch.y ?? null,
    ch: [],
    proposed: false,
    hasFloorplan: false,
    notes: '',
    createdAt: now,
    ...patch,
  };
  store.setSlice('places', ps => [...(ps || []), rec]);
  return id;
}

function createThread(store, patch = {}) {
  const id = patch.id || rid('th');
  const now = Date.now();
  const rec = {
    id,
    name: patch.name || 'New thread',
    severity: 'medium',
    active: true,
    color: patch.color || pickColor(1),
    description: '',
    opens: patch.opens ?? 1,
    beats: [],
    characters: [],
    createdAt: now,
    ...patch,
  };
  store.setSlice('threads', ts => [...(ts || []), rec]);
  return id;
}

function createItem(store, patch = {}) {
  const id = patch.id || rid('it');
  const now = Date.now();
  const rec = {
    id,
    name: patch.name || 'New item',
    kind: patch.kind || 'object',
    icon: patch.icon || '◆',
    status: 'on-page',
    owner: null,
    description: '',
    symbolism: '',
    ch: [],
    track: [],
    notes: '',
    createdAt: now,
    ...patch,
  };
  store.setSlice('items', is => [...(is || []), rec]);
  return id;
}

function createChapter(store, patch = {}) {
  const id = patch.id || rid('chp');
  const order = store.book?.chapterOrder || [];
  const n = patch.n ?? (order.length + 1);
  const rec = {
    id, n,
    title: patch.title || `Chapter ${n}`,
    text: patch.text || '',
    scenes: patch.scenes || [],
    lastEdit: null,
    ...patch,
  };
  store.setSlice('chapters', ch => ({ ...ch, [id]: rec }));
  store.setSlice('book', b => ({
    ...b,
    chapterOrder: [...(b.chapterOrder || []), id],
    currentChapterId: b.currentChapterId || id,
  }));
  return id;
}

function removeChapter(store, chapterId) {
  store.setSlice('chapters', ch => { const { [chapterId]: _, ...rest } = ch; return rest; });
  store.setSlice('book', b => {
    const nextOrder = (b.chapterOrder || []).filter(x => x !== chapterId);
    return {
      ...b,
      chapterOrder: nextOrder,
      currentChapterId: b.currentChapterId === chapterId ? (nextOrder[0] || null) : b.currentChapterId,
    };
  });
}

function reorderChapters(store, newOrder) {
  // Re-number chapters so n matches position
  store.setSlice('chapters', ch => {
    const next = { ...ch };
    newOrder.forEach((id, i) => { if (next[id]) next[id] = { ...next[id], n: i + 1 }; });
    return next;
  });
  store.setSlice('book', b => ({ ...b, chapterOrder: newOrder }));
}

// Deterministic colour picker rotates through the panel palette
const COLORS = [
  'oklch(62% 0.16 25)',   // rust
  'oklch(55% 0.10 220)',  // blue
  'oklch(60% 0.10 145)',  // green
  'oklch(72% 0.13 78)',   // amber
  'oklch(55% 0.15 45)',   // warm
  'oklch(58% 0.12 300)',  // violet
  'oklch(55% 0.08 200)',  // teal
];
let _colorCounter = 0;
function pickColor(seed) {
  if (seed != null) return COLORS[seed % COLORS.length];
  _colorCounter = (_colorCounter + 1) % COLORS.length;
  return COLORS[_colorCounter];
}

// ─── Expose everything window-side ────────────────────────────────────
Object.assign(window, {
  StoreProvider, useStore, rid, wordCount, recordFeedback,
  EMPTY_PROFILE, DEFAULT_TWEAKS,
  createCharacter, createPlace, createThread, createItem,
  createChapter, removeChapter, reorderChapters,
  pickColor,
});

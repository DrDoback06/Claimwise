// Loomwright — entity creators (plan §3, §10–§16). Pure functions that
// receive the store API and a patch; return the new id. Never mutate.

export function rid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function wordCount(str) {
  if (!str) return 0;
  return (str.trim().match(/\S+/g) || []).length;
}

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
export function pickColor(seed) {
  if (seed != null) return COLORS[Math.abs(seed) % COLORS.length];
  _colorCounter = (_colorCounter + 1) % COLORS.length;
  return COLORS[_colorCounter];
}

export function createCharacter(store, patch = {}) {
  const id = patch.id || rid('ch');
  const rec = {
    id,
    name: patch.name || 'New character',
    role: patch.role || 'support',
    class: patch.role || patch.class || 'support',  // legacy compat
    color: patch.color || pickColor(),
    status: patch.status || 'on-page',
    age: patch.age || '',
    pronouns: patch.pronouns || '',
    oneliner: patch.oneliner || '',
    aliases: patch.aliases || [],
    avatar: patch.avatar || null,
    dossier: { bio: '', quirks: [], voice: '', notes: '' },
    traits: [], stats: {}, skills: [], inventory: [],
    threads: [], arc: [], relationships: [],
    knows: [], hides: [], fears: [],
    wants: { surface: '', true: '' },
    appears: [],
    journey: [],
    notes: '',
    draftedByLoom: !!patch.draftedByLoom,
    createdAt: Date.now(),
    ...patch,
  };
  store.setSlice('cast', cs => [...(cs || []), rec]);
  return id;
}

export function createPlace(store, patch = {}) {
  const id = patch.id || rid('pl');
  const rec = {
    id,
    name: patch.name || 'New place',
    kind: patch.kind || 'settlement',
    realm: patch.realm || 'the world',
    description: '',
    coordinates: patch.coordinates || null,
    x: patch.x ?? null, y: patch.y ?? null,
    parentId: patch.parentId || null,
    children: patch.children || [],
    visits: patch.visits || [],
    ch: [],
    proposed: !!patch.proposed,
    hasFloorplan: !!patch.hasFloorplan,
    notes: '',
    createdAt: Date.now(),
    draftedByLoom: !!patch.draftedByLoom,
    ...patch,
  };
  store.setSlice('places', ps => [...(ps || []), rec]);
  return id;
}

// Quests are the renamed Threads (CODE-INSIGHT 2026-04). They support
// multi-side scenarios: a quest has named sides (factions) and per-side
// progress beats. The old `createThread` name is kept as an alias.
export function createQuest(store, patch = {}) {
  const id = patch.id || rid('qu');
  const rec = {
    id,
    name: patch.name || patch.title || 'New quest',
    severity: patch.severity || 'medium',
    active: true,
    color: patch.color || pickColor(1),
    description: '',
    opens: patch.opens ?? 1,
    beats: patch.beats || [],
    characters: patch.characters || [],
    places: patch.places || [],
    items: patch.items || [],
    // (NEW) sides + objectives + progress.
    sides: patch.sides || [],          // [{id, name, color, members:[charId], goal}]
    objectives: patch.objectives || [], // [{id, text, completed, sideId?}]
    progress: patch.progress || [],     // [{id, sideId, beat, chapterId, confidence, source}]
    rewards: patch.rewards || [],
    kind: patch.kind || 'main-quest',   // main-quest | side-quest | rivalry | thread (legacy)
    createdAt: Date.now(),
    draftedByLoom: !!patch.draftedByLoom,
    ...patch,
  };
  store.setSlice('quests', qs => [...(qs || []), rec]);
  return id;
}

// Back-compat: old code calling createThread still works; it routes through
// createQuest with the legacy `thread` kind so the data lives in one slice.
export function createThread(store, patch = {}) {
  return createQuest(store, { ...patch, kind: 'thread' });
}

export function createItem(store, patch = {}) {
  const id = patch.id || rid('it');
  const rec = {
    id,
    name: patch.name || 'New item',
    kind: patch.kind || 'object',
    icon: patch.icon || '◆',
    status: patch.status || 'on-page',
    owner: patch.owner || null,
    description: '',
    symbolism: '',
    ch: [],
    track: [],
    notes: '',
    createdAt: Date.now(),
    draftedByLoom: !!patch.draftedByLoom,
    ...patch,
  };
  store.setSlice('items', is => [...(is || []), rec]);
  return id;
}

export function createChapter(store, patch = {}) {
  const id = patch.id || rid('chp');
  const order = store.book?.chapterOrder || [];
  const n = patch.n ?? (order.length + 1);
  const rec = {
    id, n,
    title: patch.title || `Chapter ${n}`,
    text: patch.text || '',
    paragraphs: patch.paragraphs || null,
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

export function removeChapter(store, chapterId) {
  store.setSlice('chapters', ch => {
    const { [chapterId]: _, ...rest } = ch || {};
    return rest;
  });
  store.setSlice('book', b => {
    const nextOrder = (b.chapterOrder || []).filter(x => x !== chapterId);
    return {
      ...b,
      chapterOrder: nextOrder,
      currentChapterId: b.currentChapterId === chapterId ? (nextOrder[0] || null) : b.currentChapterId,
    };
  });
}

export function reorderChapters(store, newOrder) {
  store.setSlice('chapters', ch => {
    const next = { ...(ch || {}) };
    newOrder.forEach((id, i) => {
      if (next[id]) next[id] = { ...next[id], n: i + 1 };
    });
    return next;
  });
  store.setSlice('book', b => ({ ...b, chapterOrder: newOrder }));
}

// Drop the loom-drafted pill on first user edit.
export function clearDraftFlag(store, kind, id) {
  const slice = { character: 'cast', place: 'places', thread: 'threads', item: 'items' }[kind];
  if (!slice) return;
  store.setSlice(slice, xs => (xs || []).map(x =>
    x.id === id && x.draftedByLoom ? { ...x, draftedByLoom: false } : x
  ));
}

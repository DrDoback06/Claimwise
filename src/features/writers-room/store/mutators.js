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

export function createThread(store, patch = {}) {
  const id = patch.id || rid('th');
  const rec = {
    id,
    name: patch.name || 'New thread',
    severity: patch.severity || 'medium',
    active: true,
    color: patch.color || pickColor(1),
    description: '',
    opens: patch.opens ?? 1,
    beats: [],
    characters: [],
    places: [],
    items: [],
    createdAt: Date.now(),
    draftedByLoom: !!patch.draftedByLoom,
    ...patch,
  };
  store.setSlice('threads', ts => [...(ts || []), rec]);
  return id;
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

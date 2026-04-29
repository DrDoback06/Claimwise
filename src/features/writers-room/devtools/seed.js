// Loomwright — devtools: seed and clear demo data.
//
// Pure functions over the store API. No defaults are written until the
// user clicks the seed button in the Developer panel. Every record
// carries `_demo: true` so the matching clear function can purge them
// without touching anything the user authored.

import {
  DEMO_CHARACTERS, DEMO_PLACES, DEMO_THREADS, DEMO_ITEMS,
  DEMO_CHAPTERS, DEMO_VISITS, DEMO_BOOK, DEMO_PROFILE_PATCH, DEMO_NS,
} from './demo-data';

function rid(prefix) { return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`; }

function isDemo(rec) { return !!rec?._demo || (typeof rec?.id === 'string' && rec.id.startsWith(DEMO_NS)); }

export function seedDemoManuscript(store) {
  const ts = Date.now();

  // Stamp visits onto the demo places before we write them.
  const placesWithVisits = DEMO_PLACES.map(p => ({
    ...p,
    visits: DEMO_VISITS
      .filter(v => v.placeId === p.id)
      .map(v => ({
        id: rid('v'),
        chapterId: v.chapterId,
        characterId: v.characterId,
        xy: { x: p.x ?? 0, y: p.y ?? 0 },
        t: ts,
        _demo: true,
      })),
  }));

  // Build chapters map keyed by id, in the canonical order.
  const chaptersMap = {};
  const order = [];
  for (const c of DEMO_CHAPTERS) {
    chaptersMap[c.id] = { ...c };
    order.push(c.id);
  }

  store.transaction(({ setSlice, setPath }) => {
    // Profile patch — narrative defaults so the writing aid + suggestion
    // genre weighting know what kind of book this is.
    for (const [k, v] of Object.entries(DEMO_PROFILE_PATCH)) {
      setPath(`profile.${k}`, v);
    }

    // Append demo entities to whatever the user already has.
    setSlice('cast',    cs => [...(cs || []).filter(c => !isDemo(c)), ...DEMO_CHARACTERS]);
    setSlice('places',  ps => [...(ps || []).filter(p => !isDemo(p)), ...placesWithVisits]);
    setSlice('threads', ts => [...(ts || []).filter(t => !isDemo(t)), ...DEMO_THREADS]);
    setSlice('items',   is => [...(is || []).filter(i => !isDemo(i)), ...DEMO_ITEMS]);

    // Append demo chapters — preserve the user's existing chapter order.
    setSlice('chapters', ch => ({ ...(ch || {}), ...chaptersMap }));
    setSlice('book', b => ({
      ...b,
      title: b?.title && !b.title.startsWith('Untitled') ? b.title : DEMO_BOOK.title,
      series: b?.series || DEMO_BOOK.series,
      target: b?.target || DEMO_BOOK.target,
      totalChapters: Math.max(b?.totalChapters || 0, DEMO_BOOK.totalChapters),
      chapterOrder: [...((b?.chapterOrder || []).filter(id => !id.startsWith(DEMO_NS))), ...order],
      currentChapterId: b?.currentChapterId || order[0],
      _demoSeededAt: ts,
    }));
  });
}

export function clearDemoData(store) {
  store.transaction(({ setSlice, setPath }) => {
    setSlice('cast',    cs => (cs || []).filter(c => !isDemo(c)));
    setSlice('places',  ps => (ps || []).map(p => p && {
      ...p,
      visits: (p.visits || []).filter(v => !v._demo),
    }).filter(p => !isDemo(p)));
    setSlice('threads', ts => (ts || []).filter(t => !isDemo(t)));
    setSlice('items',   is => (is || []).filter(i => !isDemo(i)));
    setSlice('chapters', ch => {
      const out = {};
      for (const [id, c] of Object.entries(ch || {})) {
        if (!isDemo(c)) out[id] = c;
      }
      return out;
    });
    setSlice('book', b => ({
      ...b,
      chapterOrder: (b?.chapterOrder || []).filter(id => !id.startsWith(DEMO_NS)),
      currentChapterId: (b?.chapterOrder || []).find(id => !id.startsWith(DEMO_NS)) || null,
      _demoSeededAt: null,
    }));
    // Tangle nodes / edges that point at demo entities.
    setSlice('tangle', tg => ({
      ...(tg || { nodes: [], edges: [], layout: {} }),
      nodes: (tg?.nodes || []).filter(n => !isDemo(n) && !(n.entityId || '').startsWith(DEMO_NS)),
      edges: (tg?.edges || []).filter(e => !isDemo(e)),
    }));
  });
}

export function isDemoActive(store) {
  return !!store?.book?._demoSeededAt
      || (store?.cast || []).some(isDemo)
      || (store?.chapters && Object.values(store.chapters).some(isDemo));
}

export function demoCounts(store) {
  return {
    characters: (store?.cast || []).filter(isDemo).length,
    places:    (store?.places || []).filter(isDemo).length,
    threads:   (store?.threads || []).filter(isDemo).length,
    items:     (store?.items || []).filter(isDemo).length,
    chapters:  Object.values(store?.chapters || {}).filter(isDemo).length,
  };
}

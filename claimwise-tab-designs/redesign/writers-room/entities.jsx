// writers-room/entities.jsx — bridge from the store into the shape legacy panels expect.
//
// The original panels all read `window.WR` (populated by data.jsx). Rewriting every
// panel against the store would be a larger change; instead we keep `window.WR` as a
// thin, always-up-to-date projection of the store. When the store has no data, WR has
// empty arrays — every panel's empty state renders naturally.
//
// Also exports: ChapterTree (sidebar), ChapterScrubber (top bar), EntityDossierQuick,
//               and the detection pipeline used by the live editor.

// ─── BRIDGE ──────────────────────────────────────────────────────────────────
function EntitiesBridge() {
  const store = useStore();

  // Compute WR during render (not in useEffect) so that sibling components
  // rendering later in the same tree see fresh data on this render. Without
  // this, panels read WR on render → see stale data → don't re-render the
  // dossier after a character was just created.
  const chapterOrder = store.book.chapterOrder || Object.keys(store.chapters);
  const chapterList = chapterOrder.map((id, i) => {
    const c = store.chapters[id];
    return c ? { n: c.n || i + 1, title: c.title, id } : null;
  }).filter(Boolean);

  const activeChapter = store.chapters[store.ui.activeChapterId]
    || (chapterList.length ? store.chapters[chapterOrder[0]] : null);

  const chapterForLegacy = activeChapter ? {
    n: activeChapter.n,
    title: activeChapter.title,
    words: wordCount(activeChapter.text || ''),
    lastEdit: activeChapter.lastEdit || '',
    paragraphs: splitIntoParagraphs(activeChapter.text || '', store.noticings[activeChapter.id] || {}),
  } : { n: 1, title: '', words: 0, lastEdit: '', paragraphs: [] };

  // Preserve the PLACE_COLORS palette from data.jsx
  const existingColors = (typeof window !== 'undefined' && window.WR && window.WR.PLACE_COLORS) || {};

  if (typeof window !== 'undefined') {
    window.WR = {
      BOOK: {
        title: store.book.title,
        series: store.book.series || '',
        currentChapter: activeChapter?.n || 1,
        totalChapters: chapterList.length || 1,
        wordsToday: store.book.wordsToday || 0,
        streak: store.book.streak || 0,
        target: store.book.target || 2500,
      },
      CHAPTER: chapterForLegacy,
      CHAPTERS: chapterList,
      CAST: store.cast || [],
      THREADS: store.threads || [],
      REALMS: deriveRealms(store.places),
      PLACES: store.places || [],
      PLACE_COLORS: existingColors,
      FLOORPLANS: {},
      ITEMS: store.items || [],
      VOICE: {
        match: store.voice?.[0]?.lastMatch ?? 0,
        weights: [],
        profiles: (store.voice || []).map(v => ({
          id: v.id, name: v.name,
          match: v.lastMatch ?? 0,
          note: v.source || '',
        })),
        profileSliders: Object.fromEntries((store.voice || []).map(v => [v.id, v.sliders || {}])),
        paragraphMatch: {},
        history: (store.voice || []).flatMap(v => v.history || []),
      },
      LANG_ISSUES: (activeChapter && store.noticings[activeChapter.id]?.lang) || {},
      COMMANDS: buildCommandList(store),
      journeyFor: (cid) => {
        if (!cid) return [];
        const char = (store.cast || []).find(c => c.id === cid);
        if (!char) return [];
        if (Array.isArray(char.journey) && char.journey.length) return char.journey;
        const chs = Array.isArray(char.appears) ? char.appears : [];
        const places = store.places || [];
        const stops = [];
        for (const ch of chs) {
          const place = places.find(p => (p.ch || []).includes(ch));
          if (place && (!stops.length || stops[stops.length - 1].place !== place.id)) {
            stops.push({ place: place.id, ch });
          }
        }
        return stops;
      },
    };
  }

  return null;
}

function splitIntoParagraphs(text, noticings) {
  if (!text?.trim()) return [];
  const chunks = text.split(/\n\s*\n/).filter(Boolean);
  return chunks.map((chunk, i) => ({
    id: `p${i}`,
    kind: chunk.startsWith('[draft]') ? 'draft' : 'prose',
    text: chunk.replace(/^\[draft\]\s*/, ''),
    noticings: noticings[`p${i}`] || [],
  }));
}

function deriveRealms(places) {
  const byRealm = {};
  (places || []).forEach(p => {
    const r = p.realm || 'the world';
    byRealm[r] = byRealm[r] || { id: r, name: r, places: [] };
    byRealm[r].places.push(p.id);
  });
  return Object.values(byRealm);
}

function buildCommandList(store) {
  const cmds = [
    // Always visible
    { k: 'weave',     label: 'Weave a new idea into the canon',   hint: 'A new character, place, item, thread…', icon: 'sparkle' },
    { k: 'mindmap',   label: 'Open the Tangle',                   hint: 'Drag anything in',                      icon: 'web' },
    { k: 'focus',     label: 'Enter focus mode',                  hint: 'Typewriter scroll · F9',                icon: 'pen' },
    { k: 'lang',      label: 'Language workbench',                hint: 'Continuity, pacing, rewrites',          icon: 'pen' },
    { k: 'voice',     label: 'Voice studio',                      hint: 'Tune · compare · teach',                icon: 'pen' },
    // Create-from-scratch entries so a blank-canvas user has direct paths.
    { k: 'new-chapter',   label: 'New chapter',            hint: 'Add a chapter to the manuscript',      icon: 'book' },
    { k: 'new-character', label: 'Add a character',        hint: 'Opens Cast with a new blank card',     icon: 'users' },
    { k: 'new-place',     label: 'Add a place',            hint: 'Opens the Atlas to create a location', icon: 'map' },
    { k: 'new-thread',    label: 'Add a plot thread',      hint: 'Opens Threads with a new thread',      icon: 'flag' },
    { k: 'new-item',      label: 'Add an item',            hint: 'Opens Items with a new object',        icon: 'bag' },
  ];
  // Entity-dependent entries — only when the user already has data.
  if ((store.cast || []).length) {
    cmds.push({ k: 'interview', label: 'Interview a character', hint: `${store.cast.length} on the roster`, icon: 'chat' });
  }
  if ((store.cast || []).length >= 2) {
    cmds.push({ k: 'groupchat', label: 'Start a group chat', hint: 'Round-table with your cast', icon: 'chat' });
  }
  if ((store.threads || []).length) {
    cmds.push({ k: 'threads', label: 'Show threads in play', hint: `${store.threads.filter(t => t.active).length} active`, icon: 'flag' });
  }
  if ((store.places || []).length) {
    cmds.push({ k: 'atlas', label: 'Open the atlas', hint: `${store.places.length} places`, icon: 'map' });
  }
  if ((store.items || []).length) {
    cmds.push({ k: 'items', label: 'Show items on-page', hint: `${store.items.length} tracked`, icon: 'bag' });
  }
  return cmds;
}

// ─── CHAPTER TREE ─────────────────────────────────────────────────────────────
function ChapterTree({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const order = store.book.chapterOrder || Object.keys(store.chapters);
  const [editingId, setEditingId] = React.useState(null);
  const [editValue, setEditValue] = React.useState('');
  const [dragOverId, setDragOverId] = React.useState(null);

  const addChapter = () => {
    const id = window.createChapter(store, {});
    store.setPath('ui.activeChapterId', id);
  };

  const deleteChapter = (id) => {
    const c = store.chapters[id];
    if (!c) return;
    const name = c.title || `Chapter ${c.n}`;
    const wc = wordCount(c.text);
    const confirmed = wc > 0
      ? confirm(`Delete ${name}? It has ${wc.toLocaleString()} words. This can't be undone.`)
      : confirm(`Delete ${name}?`);
    if (confirmed) window.removeChapter(store, id);
  };

  const startRename = (id) => {
    setEditingId(id);
    setEditValue(store.chapters[id]?.title || '');
  };
  const commitRename = () => {
    if (editingId) {
      const next = editValue.trim() || store.chapters[editingId]?.title;
      if (next !== store.chapters[editingId]?.title) {
        store.setSlice('chapters', ch => ({ ...ch, [editingId]: { ...ch[editingId], title: next } }));
      }
    }
    setEditingId(null);
    setEditValue('');
  };

  const open = (id) => store.setPath('ui.activeChapterId', id);

  // HTML5 drag-reorder
  const onDragStart = (e, id) => {
    e.dataTransfer.setData('application/wr-chapter', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e, id) => {
    e.preventDefault();
    setDragOverId(id);
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e, targetId) => {
    e.preventDefault();
    setDragOverId(null);
    const srcId = e.dataTransfer.getData('application/wr-chapter');
    if (!srcId || srcId === targetId) return;
    const cur = store.book.chapterOrder || Object.keys(store.chapters);
    const without = cur.filter(x => x !== srcId);
    const targetIdx = without.indexOf(targetId);
    const next = [...without.slice(0, targetIdx), srcId, ...without.slice(targetIdx)];
    window.reorderChapters(store, next);
  };

  return (
    <aside style={{
      width: 240, background: t.sidebar, borderRight: `1px solid ${t.rule}`,
      flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', flex: 1 }}>Manuscript</div>
        <button onClick={addChapter} title="New chapter" style={iconBtn(t)}>+</button>
        <button onClick={onClose} title="Hide tree" style={iconBtn(t)}>‹</button>
      </div>
      <div style={{ padding: '10px 10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '4px 8px 10px', fontFamily: t.display, fontSize: 15, color: t.ink, fontWeight: 500 }}>{store.book.title}</div>
        {order.length === 0 && (
          <div style={{ padding: 16, fontFamily: t.display, fontSize: 13, fontStyle: 'italic', color: t.ink3, lineHeight: 1.55 }}>
            No chapters yet. Hit + to begin.
          </div>
        )}
        {order.map(id => {
          const c = store.chapters[id];
          if (!c) return null;
          const active = store.ui.activeChapterId === id;
          const wc = wordCount(c.text);
          const isEditing = editingId === id;
          const isDragOver = dragOverId === id;
          return (
            <div key={id}
              draggable={!isEditing}
              onDragStart={e => onDragStart(e, id)}
              onDragOver={e => onDragOver(e, id)}
              onDragLeave={() => setDragOverId(null)}
              onDrop={e => onDrop(e, id)}
              style={{
                position: 'relative',
                marginBottom: 2,
                background: active ? t.paper : 'transparent',
                borderLeft: active ? `2px solid ${t.accent}` : '2px solid transparent',
                borderTop: isDragOver ? `2px solid ${t.accent}` : '2px solid transparent',
                cursor: isEditing ? 'text' : 'grab',
              }}>
              <div onClick={() => !isEditing && open(id)}
                onDoubleClick={() => startRename(id)}
                style={{ padding: '8px 30px 8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12 }}>{String(c.n).padStart(2, '0')}</span>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
                      }}
                      style={{ flex: 1, padding: '2px 4px', fontFamily: t.display, fontSize: 13, color: t.ink, background: t.bg, border: `1px solid ${t.accent}`, borderRadius: 1, outline: 'none' }}
                    />
                  ) : (
                    <span style={{ fontFamily: t.display, fontSize: 13, color: t.ink, flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.title}</span>
                  )}
                </div>
                <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.08, marginTop: 1, paddingLeft: 18 }}>{wc ? wc.toLocaleString() + ' w' : 'empty'}</div>
              </div>
              {!isEditing && (
                <button
                  onClick={e => { e.stopPropagation(); deleteChapter(id); }}
                  title="Delete chapter"
                  style={{
                    position: 'absolute', top: 8, right: 6,
                    width: 18, height: 18, background: 'transparent',
                    border: 'none', color: t.ink3, cursor: 'pointer',
                    fontSize: 14, lineHeight: 1, padding: 0, opacity: 0.5,
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                >×</button>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding: '8px 12px', borderTop: `1px solid ${t.rule}`, fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, lineHeight: 1.5 }}>
        Drag to reorder · double-click to rename
      </div>
    </aside>
  );
}

// ─── CHAPTER SCRUBBER (top bar) ──────────────────────────────────────────────
function ChapterScrubber() {
  const t = useTheme();
  const store = useStore();
  const order = store.book.chapterOrder || Object.keys(store.chapters);
  if (order.length < 2) return null;
  const activeIdx = order.indexOf(store.ui.activeChapterId);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {order.map((id, i) => {
        const c = store.chapters[id];
        if (!c) return null;
        const active = i === activeIdx;
        const wc = wordCount(c.text);
        return (
          <button key={id}
            onClick={() => store.setPath('ui.activeChapterId', id)}
            title={`${c.title} · ${wc} words`}
            style={{
              width: 14, height: 14, borderRadius: '50%',
              background: active ? t.accent : (wc > 0 ? t.ink3 : 'transparent'),
              border: `1px solid ${active ? t.accent : wc > 0 ? t.ink3 : t.rule}`,
              cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center',
              fontFamily: t.mono, fontSize: 8, color: active ? t.onAccent : t.ink3,
            }}>
            {active ? c.n : ''}
          </button>
        );
      })}
    </div>
  );
}

// ─── ENTITY DETECTION — simple regex for proper nouns ────────────────────────
// Proper nouns (capitalised words not at sentence start) become candidates.
// Known entity names become anchor links.
function detectEntitiesInText(text, store) {
  if (!text) return { proposed: [], matched: [] };
  const sentences = text.split(/(?<=[.!?])\s+/);
  const allNames = new Map();
  (store.cast || []).forEach(c => allNames.set(c.name.toLowerCase(), { kind: 'character', id: c.id, name: c.name }));
  (store.places || []).forEach(p => allNames.set(p.name.toLowerCase(), { kind: 'place', id: p.id, name: p.name }));
  (store.items || []).forEach(i => allNames.set(i.name.toLowerCase(), { kind: 'item', id: i.id, name: i.name }));

  const matched = [];
  const proposedSet = new Map();
  sentences.forEach(sent => {
    const words = sent.split(/(\s+|[,;:—])/);
    words.forEach((w, idx) => {
      const clean = w.replace(/[^\w']/g, '');
      if (!clean || clean.length < 3) return;
      const isCap = /^[A-Z][a-z']+/.test(clean);
      if (!isCap) return;
      // skip sentence-initial
      if (idx === 0 && sent.indexOf(w) === 0) return;
      const lower = clean.toLowerCase();
      if (allNames.has(lower)) matched.push({ ...allNames.get(lower), at: text.indexOf(clean) });
      else if (!COMMON_WORDS.has(lower)) {
        proposedSet.set(lower, { name: clean, at: text.indexOf(clean), occurrences: (proposedSet.get(lower)?.occurrences || 0) + 1 });
      }
    });
  });
  return { proposed: [...proposedSet.values()], matched };
}

const COMMON_WORDS = new Set(['the','a','and','but','or','so','if','when','where','she','he','they','their','his','her','its','this','that','then','now','yes','no','monday','tuesday','wednesday','thursday','friday','saturday','sunday','january','february','march','april','may','june','july','august','september','october','november','december']);

// ─── Inline button helper style ──────────────────────────────────────────────
const iconBtn = t => ({
  width: 22, height: 22, background: 'transparent', border: `1px solid ${t.rule}`,
  borderRadius: 2, color: t.ink2, cursor: 'pointer', fontFamily: t.mono, fontSize: 12,
  display: 'grid', placeItems: 'center', lineHeight: 1,
});

Object.assign(window, { EntitiesBridge, ChapterTree, ChapterScrubber, detectEntitiesInText });

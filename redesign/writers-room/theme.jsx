// writers-room/theme.jsx — Parchment & Press theme + selection bus + icon set

const THEMES = {
  day: {
    mode: 'day',
    bg: '#f4ecd8',
    paper: '#ebe1c7',
    paper2: '#e0d4b4',
    paper3: '#d8caa4',
    sidebar: '#e8dcbf',
    ink: '#2b1d0e',
    ink2: '#5a4a35',
    ink3: '#8a7a5e',
    ink4: '#b0a382',
    rule: '#c9b98e',
    rule2: '#d8c9a0',
    accent: '#8b2b1f',
    accent2: '#b8492e',
    onAccent: '#f4ecd8',
    good: '#4a6b2e',
    warn: '#b8731c',
    bad:  '#a33a2b',
    font: "'Fraunces', Georgia, serif",
    display: "'Fraunces', Georgia, serif",
    mono: "'JetBrains Mono', 'Courier New', monospace",
  },
  night: {
    mode: 'night',
    bg: '#141017',
    paper: '#1c1721',
    paper2: '#231c29',
    paper3: '#2a2232',
    sidebar: '#181319',
    ink: '#eae0d0',
    ink2: '#b5a894',
    ink3: '#7a6d5f',
    ink4: '#4f4538',
    rule: '#322a36',
    rule2: '#3d3341',
    accent: '#d49252',
    accent2: '#eab069',
    onAccent: '#141017',
    good: '#7cb26a',
    warn: '#d49252',
    bad: '#d87a6a',
    font: "'Fraunces', Georgia, serif",
    display: "'Fraunces', Georgia, serif",
    mono: "'JetBrains Mono', 'Courier New', monospace",
  },
};

const ThemeCtx = React.createContext(THEMES.day);

function ThemeProvider({ initial = 'day', children }) {
  const [mode, setMode] = React.useState(initial);
  const theme = { ...THEMES[mode], setMode, toggle: () => setMode(m => m === 'day' ? 'night' : 'day') };
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>;
}
function useTheme() { return React.useContext(ThemeCtx); }

function ThemeToggle() {
  const t = useTheme();
  return (
    <button onClick={t.toggle} title={t.mode === 'day' ? 'Night mode' : 'Day mode'} style={{
      width: 40, height: 40, background: 'transparent', border: `1px solid ${t.rule}`,
      borderRadius: 2, cursor: 'pointer', color: t.ink2, display: 'grid', placeItems: 'center',
      fontFamily: t.mono, fontSize: 14,
    }}>{t.mode === 'day' ? '☾' : '☀'}</button>
  );
}

// ─── SELECTION BUS — cross-panel sync ───
// All panels listen for { kind: 'character' | 'place' | 'thread' | 'item', id }
// When a panel wants to focus an entity elsewhere, it calls select(kind, id).
const SelectionCtx = React.createContext({ sel: null, select: () => {} });

function SelectionProvider({ children }) {
  // Starts empty — no hardcoded demo-story IDs. Panels fall back to their
  // first available record when the selection for their kind is null.
  const [sel, setSel] = React.useState({ character: null, place: null, thread: null, item: null });
  const select = (kind, id) => setSel(s => ({ ...s, [kind]: id }));
  return <SelectionCtx.Provider value={{ sel, select }}>{children}</SelectionCtx.Provider>;
}
function useSelection() { return React.useContext(SelectionCtx); }

// ─── MIND MAP BUS — drag/drop entities between tabs ───
// Bridges to the main store's `tangle` slice so nodes + edges persist
// through IndexedDB. No hardcoded seed nodes — brand-new users see an
// empty canvas.
const MindMapCtx = React.createContext({
  nodes: [], edges: [],
  addNode: () => {}, addNoteNode: () => {},
  removeNode: () => {}, moveNode: () => {}, toggleEdge: () => {},
  updateNote: () => {},
});

function MindMapProvider({ children }) {
  // useStore is defined in store.jsx which loads after theme.jsx but *is*
  // parsed before any component renders, so by the time MindMapProvider's
  // function body runs, window.useStore exists.
  const store = (typeof window !== 'undefined' && window.useStore)
    ? window.useStore() : null;

  const write = (mut) => {
    if (!store) return;
    store.setSlice('tangle', t => {
      const cur = { nodes: t?.nodes || [], edges: t?.edges || [], layout: t?.layout || {} };
      return { ...cur, ...mut(cur) };
    });
  };

  const nodes = store?.tangle?.nodes || [];
  const edges = store?.tangle?.edges || [];

  const addNode = (kind, entityId, pos) => {
    const id = 'mn_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);
    write(t => ({
      nodes: [...t.nodes, { id, kind, entityId, x: pos?.x ?? 400, y: pos?.y ?? 300 }],
    }));
    return id;
  };
  const addNoteNode = (text, pos) => {
    const id = 'mn_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);
    write(t => ({
      nodes: [...t.nodes, { id, kind: 'note', entityId: null, text: text || '', x: pos?.x ?? 400, y: pos?.y ?? 300 }],
    }));
    return id;
  };
  const updateNote = (id, text) => write(t => ({
    nodes: t.nodes.map(n => n.id === id ? { ...n, text } : n),
  }));
  const removeNode = (id) => write(t => ({
    nodes: t.nodes.filter(n => n.id !== id),
    edges: t.edges.filter(e => e.from !== id && e.to !== id),
  }));
  const moveNode = (id, x, y) => write(t => ({
    nodes: t.nodes.map(n => n.id === id ? { ...n, x, y } : n),
  }));
  const toggleEdge = (a, b) => write(t => {
    const idx = t.edges.findIndex(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
    if (idx >= 0) return { edges: t.edges.filter((_, j) => j !== idx) };
    const id = 'me_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);
    return { edges: [...t.edges, { id, from: a, to: b }] };
  });

  return (
    <MindMapCtx.Provider value={{ nodes, edges, addNode, addNoteNode, updateNote, removeNode, moveNode, toggleEdge }}>
      {children}
    </MindMapCtx.Provider>
  );
}
function useMindMap() { return React.useContext(MindMapCtx); }

// Forward-reference container so MindMapProvider can hook into the store
// context that's defined in store.jsx (which loads after theme.jsx).
const StoreCtxRef = { current: null };

// Helper: drag-start payload for any entity chip
function dragEntity(e, kind, entityId) {
  e.dataTransfer.setData('application/wr-entity', JSON.stringify({ kind, entityId }));
  e.dataTransfer.effectAllowed = 'copy';
}

// ─── Icon set ───
function Icon({ name, size = 14, color = 'currentColor' }) {
  const s = size, c = color, sw = 1.5;
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'map':     return <svg {...common}><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><path d="M9 3v15M15 6v15"/></svg>;
    case 'users':   return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="7" r="2.5"/><path d="M14 14c2-1 4 0 5 1.5"/></svg>;
    case 'pen':     return <svg {...common}><path d="M15 4l5 5L9 20H4v-5L15 4z"/><path d="M13 6l5 5"/></svg>;
    case 'flag':    return <svg {...common}><path d="M5 3v18M5 4h12l-3 4 3 4H5"/></svg>;
    case 'sparkle': return <svg {...common}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8L19 3z"/></svg>;
    case 'book':    return <svg {...common}><path d="M4 5a2 2 0 012-2h13v17H6a2 2 0 01-2-2V5z"/><path d="M4 18a2 2 0 012-2h13"/></svg>;
    case 'bag':     return <svg {...common}><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>;
    case 'web':     return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 4 3 14 0 18M12 3c-3 4-3 14 0 18"/></svg>;
    case 'compass': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-4 0 2-6z"/></svg>;
    case 'building':return <svg {...common}><path d="M4 20V7l8-4 8 4v13"/><path d="M9 20v-5h6v5M9 11h2M13 11h2"/></svg>;
    case 'chat':    return <svg {...common}><path d="M4 5h16v12H8l-4 4V5z"/></svg>;
    case 'seed':    return <svg {...common}><path d="M12 21c-4-4-7-7-7-11a7 7 0 0114 0c0 4-3 7-7 11z"/><path d="M12 3v9"/></svg>;
    default:        return <svg {...common}><circle cx="12" cy="12" r="8"/></svg>;
  }
}

// ─── Generic entity chip — used anywhere, draggable to mind map ───
function EntityChip({ kind, id, size = 'md' }) {
  const t = useTheme();
  const { select } = useSelection();
  let label = '', color = t.ink3, icon = 'book', sub = '';
  if (kind === 'character') {
    const c = WR.CAST.find(x => x.id === id); if (!c) return null;
    label = c.name; color = c.color; icon = 'users'; sub = c.role;
  } else if (kind === 'place') {
    const p = WR.PLACES.find(x => x.id === id); if (!p) return null;
    label = p.name; color = WR.PLACE_COLORS[p.kind] || t.ink3; icon = 'map'; sub = p.kind;
  } else if (kind === 'thread') {
    const th = WR.THREADS.find(x => x.id === id); if (!th) return null;
    label = th.name; color = th.color; icon = 'flag'; sub = th.severity;
  } else if (kind === 'item') {
    const it = WR.ITEMS.find(x => x.id === id); if (!it) return null;
    label = it.name; color = t.accent; icon = 'bag'; sub = it.kind;
  }
  const pad = size === 'sm' ? '3px 7px' : '5px 10px';
  const font = size === 'sm' ? 11 : 12;
  return (
    <span draggable onDragStart={e => dragEntity(e, kind, id)} onClick={() => select(kind, id)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: pad,
      background: 'transparent', borderLeft: `2px solid ${color}`,
      fontFamily: t.display, fontSize: font, color: t.ink, cursor: 'grab', userSelect: 'none', whiteSpace: 'nowrap',
      marginRight: 3, marginBottom: 3,
    }} title={`${sub} · drag to mind map, click to focus`}>
      <Icon name={icon} size={11} color={color} />
      {label}
    </span>
  );
}

window.ThemeProvider = ThemeProvider;
window.useTheme = useTheme;
window.ThemeToggle = ThemeToggle;
window.SelectionProvider = SelectionProvider;
window.useSelection = useSelection;
window.MindMapProvider = MindMapProvider;
window.useMindMap = useMindMap;
window.dragEntity = dragEntity;
window.Icon = Icon;
window.EntityChip = EntityChip;

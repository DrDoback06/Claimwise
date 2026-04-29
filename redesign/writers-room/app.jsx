// writers-room/app.jsx — shell, prose (contenteditable), margin, chapter tree, scrubber.

// Error boundary — catches panel crashes so one broken panel doesn't take down the whole app
class PanelErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('[panel]', this.props.label, err, info); }
  render() {
    if (this.state.err) {
      const msg = String(this.state.err?.message || this.state.err);
      return (
        <div style={{ width: 420, background: '#fbf8f1', border: '1px solid #e6dfd1', borderLeft: '3px solid #c44', borderRadius: 2, padding: 18, margin: '0 4px', fontFamily: 'Spectral, serif', color: '#3a3226' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase', color: '#c44', marginBottom: 6 }}>Panel error · {this.props.label}</div>
          <div style={{ fontSize: 14, fontStyle: 'italic', marginBottom: 10 }}>This panel ran into a snag.</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#8a7f6d', wordBreak: 'break-word', marginBottom: 12 }}>{msg}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => this.setState({ err: null })} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #e6dfd1', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', color: '#3a3226', cursor: 'pointer' }}>Retry</button>
            <button onClick={this.props.onClose} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #e6dfd1', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', color: '#8a7f6d', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const NOTICING_COLORS = {
  voice:  'oklch(55% 0.15 45)',
  atlas:  'oklch(60% 0.10 145)',
  cast:   'oklch(55% 0.10 220)',
  thread: 'oklch(62% 0.16 25)',
  spark:  'oklch(78% 0.13 78)',
  loom:   'oklch(50% 0.04 60)',
  entity: 'oklch(50% 0.04 60)',
  lang:   'oklch(58% 0.12 300)',
};
const NOTICING_LABELS = {
  voice: 'Voice', atlas: 'Atlas', cast: 'Cast', thread: 'Thread', spark: 'Spark', loom: 'Loom', entity: 'Entity', lang: 'Language',
};

const TWEAKS = /*EDITMODE-BEGIN*/{
  "intrusion": "medium",
  "density": "comfortable",
  "showMargin": true,
  "showRitualBar": true,
  "highlightMargin": true,
  "showChapterTree": true
}/*EDITMODE-END*/;

function WritersRoom() {
  const t = useTheme();
  const store = useStore();

  // While the IndexedDB hydrate is still in flight we return a minimal
  // loading shell rather than flashing onboarding to returning users whose
  // saved profile.onboarded is true but hasn't arrived yet.
  if (store._loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: t.bg, color: t.ink3, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.16, textTransform: 'uppercase' }}>
        Loading…
      </div>
    );
  }

  // Show the onboarding wizard first-run
  if (!store.profile.onboarded) {
    return <OnboardingWizard onDone={() => {/* store update triggers re-render */}} />;
  }

  return <Room />;
}

function Room() {
  const t = useTheme();
  const store = useStore();

  const [panels, setPanels] = React.useState(store.ui.panels || []);
  const [activeNoticing, setActiveNoticing] = React.useState(null);
  const [ringOpen, setRingOpen] = React.useState(false);
  const [ringCenter, setRingCenter] = React.useState({ x: 0, y: 0 });
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [weaverOpen, setWeaverOpen] = React.useState(false);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [tweaks, setTweaks] = React.useState({ ...TWEAKS, ...store.ui.tweaks });
  const [focusMode, setFocusMode] = React.useState(false);
  const [editsLive, setEditsLive] = React.useState(false);
  const [showTree, setShowTree] = React.useState(tweaks.showChapterTree !== false);

  React.useEffect(() => { store.setPath('ui.panels', panels); }, [panels]);
  React.useEffect(() => { store.setPath('ui.tweaks', tweaks); }, [tweaks]);

  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') { setEditsLive(true); setTweaksOpen(true); }
      if (e.data?.type === '__deactivate_edit_mode') { setEditsLive(false); setTweaksOpen(false); }
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweak = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };

  const togglePanel = (k) => setPanels(ps => ps.includes(k) ? ps.filter(x => x !== k) : [...ps, k].slice(-4));

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') { e.preventDefault(); setWeaverOpen(true); }
      if (e.key === 'Escape') { setRingOpen(false); setCmdOpen(false); setWeaverOpen(false); setActiveNoticing(null); }
      if (e.key === 'F9') { e.preventDefault(); setFocusMode(f => !f); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openRingAt = (e) => { e.preventDefault(); setRingCenter({ x: e.clientX, y: e.clientY }); setRingOpen(true); };

  const runCmd = (k) => {
    if (k === 'weave' || k === 'spark') { setWeaverOpen(true); return; }
    if (k === 'focus')    { setFocusMode(true); return; }
    if (k === 'mindmap')  { togglePanel('mindmap'); return; }
    // Create-from-scratch shortcuts
    if (k === 'new-chapter')   { const id = window.createChapter(store, {}); store.setPath('ui.activeChapterId', id); return; }
    if (k === 'new-character') { const id = window.createCharacter(store, {}); window.__WR_SEL_API?.select?.('character', id); if (!panels.includes('cast')) togglePanel('cast'); return; }
    if (k === 'new-place')     { const id = window.createPlace(store, {}); window.__WR_SEL_API?.select?.('place', id); if (!panels.includes('atlas')) togglePanel('atlas'); return; }
    if (k === 'new-thread')    { const id = window.createThread(store, {}); window.__WR_SEL_API?.select?.('thread', id); if (!panels.includes('threads')) togglePanel('threads'); return; }
    if (k === 'new-item')      { const id = window.createItem(store, {}); window.__WR_SEL_API?.select?.('item', id); if (!panels.includes('items')) togglePanel('items'); return; }
    // Group chat
    if (k === 'groupchat') { togglePanel('groupchat'); return; }
    // Generic panel toggle — normalise legacy keys
    togglePanel(k === 'thread' ? 'threads' : k === 'inventory' ? 'items' : k);
  };

  return (
    <>
    <style>{`
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes slideIn { from { transform: translateX(40px); opacity: 0 } to { transform: none; opacity: 1 } }
      @keyframes ringPop { from { transform: scale(0.4); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      @keyframes breathe { 0%, 100% { opacity: 0.5 } 50% { opacity: 1 } }
      body { margin: 0; background: ${t.bg}; }
      ::selection { background: ${t.accent}; color: ${t.onAccent}; }
      [data-entity-ref] { color: ${t.accent}; border-bottom: 1px dotted ${t.accent}88; cursor: pointer; }
      [data-entity-ref]:hover { background: ${t.accent}15; }
      .lw-prose [contenteditable]:focus { outline: none; }
    `}</style>
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: t.bg, color: t.ink, fontFamily: t.font, position: 'relative' }}>
      {!focusMode && <LeftRail togglePanel={togglePanel} openPanels={panels} onCommand={() => setCmdOpen(true)} onWeaver={() => setWeaverOpen(true)} showTree={showTree} setShowTree={setShowTree} />}
      {!focusMode && showTree && <ChapterTree onClose={() => setShowTree(false)} />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {!focusMode && <TopBar onFocus={() => setFocusMode(true)} tweaks={tweaks} onCommand={() => setCmdOpen(true)} />}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          <ProseEditor
            showMargin={tweaks.showMargin && !focusMode}
            density={tweaks.density}
            intrusion={tweaks.intrusion}
            highlightMargin={tweaks.highlightMargin}
            activeNoticing={activeNoticing}
            setActiveNoticing={setActiveNoticing}
            onContextMenu={openRingAt}
            onActOnNoticing={(n) => {
              if (!n) return;
              if (n.link) {
                const { select } = window.__WR_SEL_API || {};
                if (select) select(n.link.kind, n.link.id);
                if (n.link.kind === 'place') togglePanel('atlas');
                if (n.link.kind === 'character') togglePanel('cast');
                if (n.link.kind === 'thread') togglePanel('threads');
                if (n.link.kind === 'item') togglePanel('items');
              }
              if (n.action === 'pin-atlas') togglePanel('atlas');
              if (n.action === 'try-spark') setWeaverOpen(true);
            }}
            togglePanel={togglePanel}
          />
          {panels.map(k => {
            const common = { onClose: () => togglePanel(k) };
            let panel = null;
            if (k === 'atlas')    panel = <AtlasPanel    {...common} onSendToWeaver={() => setWeaverOpen(true)} />;
            else if (k === 'cast')     panel = <CastPanel     {...common} onInterview={() => togglePanel('interview')} onSendToWeaver={() => setWeaverOpen(true)} />;
            else if (k === 'voice')    panel = <VoicePanel    {...common} />;
            else if (k === 'threads')  panel = <ThreadsPanel  {...common} onSendToWeaver={() => setWeaverOpen(true)} />;
            else if (k === 'items')    panel = <ItemsPanel    {...common} />;
            else if (k === 'lang')     panel = <LanguagePanel {...common} />;
            else if (k === 'mindmap')  panel = <MindMapPanel  {...common} />;
            else if (k === 'interview')panel = <InterviewPanel {...common} />;
            else if (k === 'groupchat')panel = <GroupChatPanel {...common} />;
            if (!panel) return null;
            return <PanelErrorBoundary key={k} label={k} onClose={common.onClose}>{panel}</PanelErrorBoundary>;
          })}
        </div>
        {!focusMode && tweaks.showRitualBar && <RitualBar />}
      </main>

      {focusMode && (
        <button onClick={() => setFocusMode(false)} style={{ position: 'fixed', top: 16, right: 16, padding: '6px 12px', background: t.paper, color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer', zIndex: 99 }}>Exit focus · F9</button>
      )}
    </div>

    <SummoningRing open={ringOpen} center={ringCenter} onClose={() => setRingOpen(false)} onPick={(k) => { setRingOpen(false); if (k === 'weaver') setWeaverOpen(true); else togglePanel(k); }} />
    <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onRun={runCmd} />
    {weaverOpen && <InlineWeaver onClose={() => setWeaverOpen(false)} onRunExample={() => {}} />}
    {tweaksOpen && editsLive && <TweaksPanel tweaks={tweaks} setTweak={setTweak} onClose={() => setTweaksOpen(false)} />}
    </>
  );
}

function SelectionBridge() {
  const api = useSelection();
  React.useEffect(() => { window.__WR_SEL_API = api; }, [api]);
  return null;
}

// ─── LEFT RAIL ─────────────────────────────────────────────────────────────────
function LeftRail({ togglePanel, openPanels, onCommand, onWeaver, showTree, setShowTree }) {
  const t = useTheme();
  const tools = [
    { k: 'atlas',    label: 'Atlas',   icon: 'map',     color: 'oklch(60% 0.10 145)' },
    { k: 'cast',     label: 'Cast',    icon: 'users',   color: 'oklch(55% 0.10 220)' },
    { k: 'voice',    label: 'Voice',   icon: 'pen',     color: 'oklch(55% 0.15 45)' },
    { k: 'threads',  label: 'Threads', icon: 'flag',    color: 'oklch(62% 0.16 25)' },
    { k: 'items',    label: 'Items',   icon: 'bag',     color: 'oklch(72% 0.13 78)' },
    { k: 'lang',     label: 'Language',icon: 'pen',     color: 'oklch(58% 0.12 300)' },
    { k: 'mindmap',  label: 'Tangle',  icon: 'web',     color: 'oklch(58% 0.12 145)' },
  ];
  return (
    <aside style={{ width: 64, background: t.sidebar, borderRight: `1px solid ${t.rule}`, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0' }}>
      <div style={{ width: 36, height: 36, background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 16, borderRadius: 2, marginBottom: 14 }}>L<span style={{ fontSize: 12, opacity: 0.6 }}>w</span></div>
      <button onClick={onWeaver} title="Weave an idea (⌘J)" style={{ width: 40, height: 40, background: t.accent, color: t.onAccent, border: 'none', borderRadius: '50%', cursor: 'pointer', marginBottom: 10, display: 'grid', placeItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <Icon name="sparkle" size={16} color={t.onAccent} />
      </button>
      <button onClick={onCommand} title="Ask the Loom (⌘K)" style={{ width: 40, height: 40, background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer', marginBottom: 6, display: 'grid', placeItems: 'center', fontFamily: t.mono, fontSize: 11 }}>⌘K</button>
      <button onClick={() => setShowTree(v => !v)} title="Chapter tree" style={{ width: 40, height: 40, background: showTree ? t.paper : 'transparent', color: showTree ? t.ink : t.ink3, border: `1px solid ${showTree ? t.rule : 'transparent'}`, borderRadius: 2, cursor: 'pointer', marginBottom: 14, display: 'grid', placeItems: 'center' }}>
        <Icon name="book" size={16} color={showTree ? t.ink : t.ink3} />
      </button>
      {tools.map(tool => {
        const active = openPanels.includes(tool.k);
        return (
          <button key={tool.k} onClick={() => togglePanel(tool.k)} title={tool.label} style={{ width: 40, height: 40, background: active ? tool.color + '20' : 'transparent', color: active ? tool.color : t.ink3, border: `1px solid ${active ? tool.color : 'transparent'}`, borderRadius: 2, cursor: 'pointer', marginBottom: 4, display: 'grid', placeItems: 'center' }}>
            <Icon name={tool.icon} size={16} color={active ? tool.color : t.ink3} />
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <ThemeToggle />
    </aside>
  );
}

function TopBar({ onFocus, onCommand }) {
  const t = useTheme();
  const store = useStore();
  const chapter = store.chapters[store.ui.activeChapterId];
  const chapterOrder = store.book.chapterOrder || Object.keys(store.chapters);
  const chapterIdx = chapterOrder.indexOf(store.ui.activeChapterId) + 1;
  return (
    <div style={{ padding: '10px 28px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
      <div>
        {store.book.series && <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase' }}>{store.book.series}</div>}
        <div style={{ fontFamily: t.display, fontSize: 17, color: t.ink, fontWeight: 500, marginTop: 1 }}>
          {store.book.title}
          {chapter && <span style={{ color: t.ink3, fontStyle: 'italic', fontSize: 14 }}> · ch.{chapter.n} · {chapter.title}</span>}
        </div>
      </div>
      <div style={{ width: 20 }} />
      <ChapterScrubber />
      <div style={{ flex: 1 }} />
      <button onClick={onCommand} style={{ padding: '7px 14px', background: t.paper, color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Ask the Loom…</span>
        <span style={{ padding: '1px 6px', background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, fontSize: 9 }}>⌘K</span>
      </button>
      <button onClick={onFocus} title="Focus mode · F9" style={{ padding: '7px 12px', background: 'transparent', color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer' }}>Focus</button>
      <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12 }}>
        <span style={{ color: t.accent }}>{(store.book.wordsToday || 0).toLocaleString()}</span> / {(store.book.target || 2500).toLocaleString()} TODAY
        {store.book.streak > 0 && <> · <span style={{ color: t.good }}>{store.book.streak}d</span> STREAK</>}
      </div>
    </div>
  );
}

// ─── PROSE EDITOR — contenteditable per chapter, live-saves to store ─────────
function ProseEditor({ showMargin, density, intrusion, highlightMargin, activeNoticing, setActiveNoticing, onContextMenu, onActOnNoticing, togglePanel }) {
  const t = useTheme();
  const store = useStore();
  const chapter = store.chapters[store.ui.activeChapterId];
  const editorRef = React.useRef(null);
  const saveTimerRef = React.useRef(null);
  const [localText, setLocalText] = React.useState(chapter?.text || '');
  const [noticings, setNoticings] = React.useState([]);
  const pad = density === 'dense' ? '28px 44px' : density === 'airy' ? '56px 90px' : '44px 72px';

  // Load chapter text into editor when active chapter changes
  React.useEffect(() => {
    if (!editorRef.current) return;
    const next = chapter?.text || '';
    if (editorRef.current.innerText !== next) {
      editorRef.current.innerText = next;
    }
    setLocalText(next);
  }, [store.ui.activeChapterId]);

  // Debounced save + detect + notice
  const onInput = React.useCallback(() => {
    if (!editorRef.current || !chapter) return;
    const text = editorRef.current.innerText;
    setLocalText(text);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      store.setSlice('chapters', ch => ({ ...ch, [chapter.id]: { ...ch[chapter.id], text, lastEdit: 'just now' } }));
      store.setSlice('book', b => ({ ...b, wordsToday: (b.wordsToday || 0) + Math.max(0, wordCount(text) - wordCount(chapter.text || '')) }));
      runDetection(text);
    }, 1200);
  }, [chapter?.id]);

  // Run entity detection through the real CW.aiService when a key is set,
  // otherwise fall back to the regex detector. Results are deduped against
  // the existing cast/places/items/threads via CW.entityMatchingService.
  const runDetection = React.useCallback(async (text) => {
    if (!text?.trim()) { setNoticings([]); return; }
    const CW = window.CW;
    const ns = [];

    // 1. Structural hints that don't need AI — long sentences & sparks
    const sents = text.split(/(?<=[.!?])\s+/);
    sents.forEach((s, i) => {
      const wc = wordCount(s);
      if (wc > 40) ns.push({ id: `lang_long_${i}`, kind: 'lang', body: `Long sentence (${wc} words) — consider breaking for breath.`, tone: 'info' });
    });

    // 2. Entity detection: prefer AI, fall back to regex.
    let entityCandidates = [];
    // Real method names: aiService exposes getAvailableProviders() which
    // returns providers with configured keys. No key → empty array.
    let hasAIKey = false;
    try {
      const providers = CW?.aiService?.getAvailableProviders?.() || [];
      hasAIKey = Array.isArray(providers) && providers.length > 0;
    } catch (_) {}

    if (hasAIKey && typeof CW?.aiService?.detectCharactersInText === 'function') {
      try {
        // Real signature: detectCharactersInText(text, existingActors) — pass the
        // actor array directly (the service handles matching internally).
        const found = await CW.aiService.detectCharactersInText(text, store.cast || []);
        // Returns: { characters: [{ name, description, action: 'new'|'match', ... }] }
        const items = Array.isArray(found) ? found : (found?.characters || []);
        entityCandidates = items
          .filter(x => x?.name && x.action !== 'match' && x.action !== 'skip')
          .map(x => ({ name: String(x.name).trim(), kind: 'character', confidence: x.confidence ?? 0.7, context: x.description }));
      } catch (e) {
        // fall through to regex below
      }
    }
    if (!entityCandidates.length) {
      const { proposed } = detectEntitiesInText(text, store);
      entityCandidates = (proposed || [])
        .filter(p => p.occurrences >= 1)
        .map(p => ({ name: p.name, kind: p.kind || 'character', confidence: 0.5, raw: p }));
    }

    // 3. Dedupe against existing entities using CW.entityMatchingService if available
    const filtered = [];
    for (const cand of entityCandidates) {
      let isDuplicate = false;
      if (CW?.entityMatchingService) {
        try {
          const ems = CW.entityMatchingService;
          const threshold = store.profile?.entityThreshold ?? 0.85;
          if (cand.kind === 'character' && ems.findMatchingActor) {
            const m = ems.findMatchingActor(cand.name, store.cast || [], threshold);
            if (m) isDuplicate = true;
          } else if (cand.kind === 'item' && ems.findMatchingItem) {
            const m = ems.findMatchingItem(cand.name, store.items || [], threshold);
            if (m) isDuplicate = true;
          } else {
            // Fallback to a plain similarity check against places
            const haystack = store.places || [];
            if (ems.calculateSimilarity) {
              for (const p of haystack) {
                if (ems.calculateSimilarity(cand.name, p.name || '') >= threshold) { isDuplicate = true; break; }
              }
            }
          }
        } catch (_) {}
      }
      if (!isDuplicate) {
        // Last-resort fallback: case-insensitive exact-name match
        const all = [...(store.cast || []), ...(store.places || []), ...(store.items || [])];
        if (all.some(x => (x.name || '').trim().toLowerCase() === cand.name.toLowerCase())) isDuplicate = true;
      }
      if (!isDuplicate) filtered.push(cand);
    }

    // Gate by the intrusion profile — confidence threshold rises as
    // intrusion falls. This uses the dismissRates the store records so
    // repeatedly-dismissed kinds stay quieter.
    const dismissRate = store.profile?.dismissRates?.entity || 0;
    const minConfidence = Math.min(0.9, 0.55 + dismissRate * 0.02);
    filtered
      .filter(p => (p.confidence ?? 0.5) >= minConfidence)
      .slice(0, 5)
      .forEach((p, i) => {
        ns.push({
          id: `ent_${p.name}_${i}`,
          kind: 'entity',
          body: `"${p.name}" appears as a proper noun. Add to cast, places, or items?`,
          tone: 'action',
          proposed: { name: p.name, kind: p.kind, confidence: p.confidence, context: p.context },
        });
      });

    // 4. Spark suggestions via CW.aiService.scanDocumentForSuggestions (optional)
    //    Signature: scanDocumentForSuggestions(docText, worldState)
    if (hasAIKey && typeof CW?.aiService?.scanDocumentForSuggestions === 'function' && wordCount(text) > 400) {
      try {
        const worldState = {
          actors: store.cast || [],
          locations: store.places || [],
          items: store.items || [],
          plotThreads: store.threads || [],
          book: { title: store.book?.title, genre: store.profile?.genre || (store.profile?.genres || [])[0] },
        };
        const suggestions = await CW.aiService.scanDocumentForSuggestions(text, worldState);
        const items = Array.isArray(suggestions) ? suggestions : (suggestions?.suggestions || []);
        items.slice(0, 2).forEach((s, i) => {
          ns.push({
            id: `spark_${i}`,
            kind: 'spark',
            body: s.message || s.text || s.description || String(s).slice(0, 160),
            tone: 'spark',
            action: 'try-spark',
          });
        });
      } catch (_) {}
    } else if (wordCount(text) > 100 && Math.random() > 0.5) {
      // Fallback spark when there's no AI
      ns.push({ id: 'spark_chapter', kind: 'spark', body: 'What if this scene ended a beat earlier, in silence?', tone: 'spark', action: 'try-spark' });
    }

    setNoticings(ns.slice(0, 6));
  }, [store]);

  // Run detection when chapter loads
  React.useEffect(() => { runDetection(chapter?.text || ''); }, [chapter?.id]);

  // Filter by intrusion
  const intrudeLevel = { none: 0, low: 1, medium: 2, high: 3 };
  const lvl = intrudeLevel[intrusion] ?? 2;
  const visible = lvl === 0 ? [] : lvl === 1 ? noticings.filter(n => n.tone === 'warn' || n.tone === 'action') : lvl === 2 ? noticings.filter(n => n.tone !== 'info') : noticings;

  // Blank canvas welcome
  if (!chapter) {
    return <BlankCanvasWelcome />;
  }

  const isEmpty = !localText.trim();

  return (
    <div className="lw-prose" data-prose-scroll onContextMenu={onContextMenu} style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: t.bg, position: 'relative' }}>
      <div style={{ maxWidth: showMargin ? 1080 : 740, margin: '0 auto', padding: pad, display: 'grid', gridTemplateColumns: showMargin ? 'minmax(0, 1fr) 300px' : '1fr', gap: 40, position: 'relative' }}>

        <div style={{ gridColumn: showMargin ? '1 / -1' : '1', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase' }}>Chapter {chapter.n}</div>
          <h1
            contentEditable suppressContentEditableWarning
            onBlur={e => {
              const title = e.target.innerText.trim() || `Chapter ${chapter.n}`;
              store.setSlice('chapters', ch => ({ ...ch, [chapter.id]: { ...ch[chapter.id], title } }));
            }}
            style={{ fontFamily: t.display, fontSize: 42, fontWeight: 400, margin: '6px 0 6px', letterSpacing: -0.02, color: t.ink, lineHeight: 1.1, outline: 'none' }}
          >{chapter.title}</h1>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12 }}>
            {wordCount(localText).toLocaleString()} words
            {chapter.lastEdit && ` · last edit ${chapter.lastEdit}`}
            {' · right-click to summon tools · ⌘K palette'}
          </div>
        </div>

        {/* Prose column */}
        <div style={{ minWidth: 0, position: 'relative', zIndex: 1 }}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={onInput}
            data-placeholder={isEmpty ? 'Begin here. The Loom is listening.' : ''}
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: density === 'dense' ? 17 : 19,
              lineHeight: 1.7,
              color: t.ink,
              textWrap: 'pretty',
              minHeight: 480,
              whiteSpace: 'pre-wrap',
              outline: 'none',
              position: 'relative',
            }}
          />
          <style>{`
            .lw-prose [contenteditable][data-placeholder]:empty::before {
              content: attr(data-placeholder);
              color: ${t.ink3};
              font-style: italic;
              pointer-events: none;
            }
          `}</style>
          {isEmpty && <BlankChapterHints togglePanel={togglePanel} />}
        </div>

        {/* Margin */}
        {showMargin && (
          <div style={{ position: 'relative', zIndex: 1, width: 300, minWidth: 300 }}>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, background: t.accent, borderRadius: '50%', animation: 'breathe 2.4s ease infinite' }} />
              The margin · {visible.length} {visible.length === 1 ? 'noticing' : 'noticings'}
            </div>
            {visible.length === 0 && isEmpty && (
              <div style={{ padding: 14, background: t.paper, border: `1px solid ${t.rule}`, borderLeft: `3px solid ${t.ink3}`, borderRadius: 2, fontFamily: t.display, fontSize: 13, fontStyle: 'italic', color: t.ink2, lineHeight: 1.55 }}>
                Start writing — I'll begin noticing things after the first paragraph.
              </div>
            )}
            {visible.length === 0 && !isEmpty && (
              <div style={{ padding: 14, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.display, fontSize: 13, fontStyle: 'italic', color: t.ink3, lineHeight: 1.55 }}>
                Nothing worth interrupting for yet. Keep going.
              </div>
            )}
            {visible.map(n => {
              const color = NOTICING_COLORS[n.kind] || t.ink3;
              const isActive = activeNoticing === n.id;
              return (
                <div key={n.id}
                  onMouseEnter={() => setActiveNoticing(n.id)}
                  onMouseLeave={() => setActiveNoticing(null)}
                  onClick={() => onActOnNoticing(n)}
                  style={{
                    marginBottom: 10, padding: 12,
                    background: isActive ? color + '18' : t.paper,
                    border: `1px solid ${isActive ? color : t.rule}`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 2, cursor: 'pointer',
                    boxShadow: isActive ? `0 4px 16px ${color}22` : 'none',
                    transition: 'all 180ms',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5 }}>
                    <span style={{ padding: '1px 6px', background: color, color: t.onAccent, fontFamily: t.mono, fontSize: 8, letterSpacing: 0.16, textTransform: 'uppercase', fontWeight: 600, borderRadius: 1 }}>{NOTICING_LABELS[n.kind]}</span>
                    {n.tone === 'warn' && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.warn, letterSpacing: 0.12, textTransform: 'uppercase' }}>⚠ continuity</span>}
                    {n.tone === 'action' && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.12, textTransform: 'uppercase' }}>needs you</span>}
                  </div>
                  <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.55 }}>{n.body}</div>
                  {n.proposed && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <MiniBtn onClick={e => { e.stopPropagation(); addEntity(store, 'character', n.proposed.name); setNoticings(ns => ns.filter(x => x.id !== n.id)); recordFeedback(store, 'entity', 'accept', { as: 'character' }); }}>+ Cast</MiniBtn>
                      <MiniBtn onClick={e => { e.stopPropagation(); addEntity(store, 'place', n.proposed.name); setNoticings(ns => ns.filter(x => x.id !== n.id)); recordFeedback(store, 'entity', 'accept', { as: 'place' }); }}>+ Atlas</MiniBtn>
                      <MiniBtn onClick={e => { e.stopPropagation(); addEntity(store, 'item', n.proposed.name); setNoticings(ns => ns.filter(x => x.id !== n.id)); recordFeedback(store, 'entity', 'accept', { as: 'item' }); }}>+ Item</MiniBtn>
                      <MiniBtn onClick={e => { e.stopPropagation(); setNoticings(ns => ns.filter(x => x.id !== n.id)); recordFeedback(store, 'entity', 'dismiss'); }}>Skip</MiniBtn>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function addEntity(store, kind, name) {
  if (kind === 'character') { window.createCharacter(store, { name, color: 'oklch(72% 0.13 78)' }); }
  else if (kind === 'place') { window.createPlace(store, { name }); }
  else if (kind === 'item') { window.createItem(store, { name }); }
  else if (kind === 'thread') { window.createThread(store, { name }); }
}

function MiniBtn({ children, onClick }) {
  const t = useTheme();
  return <button onClick={onClick} style={{ padding: '3px 8px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>{children}</button>;
}

// ─── Blank canvas helpers ────────────────────────────────────────────────────
function BlankCanvasWelcome() {
  const t = useTheme();
  const store = useStore();
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <h2 style={{ fontFamily: t.display, fontSize: 32, fontWeight: 400, color: t.ink, margin: '0 0 12px' }}>No chapter open.</h2>
        <p style={{ fontFamily: t.display, fontSize: 15, fontStyle: 'italic', color: t.ink2, lineHeight: 1.6 }}>Pick a chapter from the tree on the left, or create a new one.</p>
        <button onClick={() => {
          const id = window.createChapter(store, {});
          store.setPath('ui.activeChapterId', id);
        }} style={{ marginTop: 18, padding: '10px 22px', background: t.accent, color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>+ New chapter</button>
      </div>
    </div>
  );
}

function BlankChapterHints({ togglePanel }) {
  const t = useTheme();
  const store = useStore();
  const hints = [];
  if ((store.cast || []).length === 0) hints.push({ label: 'No cast yet — add your first character', onClick: () => togglePanel('cast'), icon: 'users' });
  if ((store.places || []).length === 0) hints.push({ label: 'No places yet — sketch the atlas', onClick: () => togglePanel('atlas'), icon: 'map' });
  if ((store.threads || []).length === 0) hints.push({ label: 'No threads — define one plot beat', onClick: () => togglePanel('threads'), icon: 'flag' });
  hints.push({ label: 'Or just write — I\'ll notice what matters', onClick: () => {}, icon: 'pen' });
  return (
    <div style={{ marginTop: 48, padding: 20, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2 }}>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 10 }}>If you're stuck</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {hints.map((h, i) => (
          <button key={i} onClick={h.onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 2, cursor: 'pointer', textAlign: 'left', fontFamily: t.display, fontSize: 14 }}>
            <Icon name={h.icon} size={14} color={t.accent} />{h.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RitualBar() {
  const t = useTheme();
  const store = useStore();
  const pct = ((store.book.wordsToday || 0) / (store.book.target || 2500)) * 100;
  return (
    <div style={{ flexShrink: 0, padding: '8px 28px', borderTop: `1px solid ${t.rule}`, background: t.paper, display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>Today</div>
      <div style={{ width: 240, height: 6, background: t.rule, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: t.accent, transition: 'width 240ms' }} />
      </div>
      <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.1 }}>{(store.book.wordsToday || 0).toLocaleString()} / {(store.book.target || 2500).toLocaleString()} words</div>
      {store.book.streak > 0 && <div style={{ fontFamily: t.mono, fontSize: 10, color: t.good, letterSpacing: 0.12 }}>·  {store.book.streak}-day streak</div>}
      <div style={{ flex: 1 }} />
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>Right-click prose → summon · ⌘K palette · ⌘J weave</div>
    </div>
  );
}

function TweaksPanel({ tweaks, setTweak, onClose }) {
  const t = useTheme();
  const store = useStore();
  return (
    <div style={{ position: 'fixed', bottom: 70, right: 24, width: 280, background: t.paper, border: `1px solid ${t.accent}`, borderRadius: 3, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', zIndex: 250, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: t.display, fontSize: 16, fontWeight: 500, color: t.ink, flex: 1 }}>Tweaks</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.ink3, fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>Loom intrusion</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {['none', 'low', 'medium', 'high'].map(l => (
          <button key={l} onClick={() => setTweak('intrusion', l)} style={{ flex: 1, padding: '5px 0', background: tweaks.intrusion === l ? t.accent : 'transparent', color: tweaks.intrusion === l ? t.onAccent : t.ink3, border: `1px solid ${tweaks.intrusion === l ? t.accent : t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>{l}</button>
        ))}
      </div>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>Density</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {['dense', 'comfortable', 'airy'].map(l => (
          <button key={l} onClick={() => setTweak('density', l)} style={{ flex: 1, padding: '5px 0', background: tweaks.density === l ? t.accent : 'transparent', color: tweaks.density === l ? t.onAccent : t.ink3, border: `1px solid ${tweaks.density === l ? t.accent : t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>{l}</button>
        ))}
      </div>
      {[
        ['showMargin', 'Show margin noticings'],
        ['highlightMargin', 'Highlight paragraph on hover'],
        ['showRitualBar', 'Show ritual bar'],
        ['showChapterTree', 'Show chapter tree on launch'],
      ].map(([k, label]) => (
        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!tweaks[k]} onChange={e => setTweak(k, e.target.checked)} />
          <span style={{ fontSize: 12, color: t.ink2 }}>{label}</span>
        </label>
      ))}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.rule}` }}>
        <button onClick={async () => {
          try {
            const cw = window.CW;
            if (!cw?.db) { alert('Database not ready.'); return; }
            const stores = ['books', 'actors', 'locations', 'plotThreads', 'itemBank', 'characterVoices', 'mindMapNodes', 'mindMapEdges', 'mindMapState', 'meta', 'storyProfile'];
            const data = {};
            for (const s of stores) {
              try { data[s] = await cw.db.getAll(s, false); } catch (_) { data[s] = []; }
            }
            const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), stores: data }, null, 2);
            const blob = new Blob([payload], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `loomwright-${(store.book.title || 'book').replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (e) { alert('Export failed: ' + (e.message || e)); }
        }} style={{ width: '100%', padding: '6px 0', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', marginBottom: 6 }}>↓ Export backup</button>
        <label style={{ display: 'block', marginBottom: 6 }}>
          <span style={{ display: 'block', width: '100%', padding: '6px 0', textAlign: 'center', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer' }}>↑ Import backup</span>
          <input type="file" accept="application/json,.json" style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              if (!confirm('Import will REPLACE your current data. Export first if you want to keep it. Continue?')) return;
              try {
                const text = await file.text();
                const parsed = JSON.parse(text);
                if (!parsed.stores) throw new Error('Not a valid Loomwright backup');
                const cw = window.CW;
                for (const [storeName, records] of Object.entries(parsed.stores)) {
                  if (!Array.isArray(records)) continue;
                  try { await cw.db.clear(storeName); } catch (_) {}
                  for (const rec of records) { try { await cw.db.update(storeName, rec); } catch (_) {} }
                }
                alert('Imported. Reloading…');
                location.reload();
              } catch (err) { alert('Import failed: ' + (err.message || err)); }
            }} />
        </label>
        <button onClick={() => { if (confirm('Restart onboarding? Your book data is kept.')) store.setPath('profile.onboarded', false); }} style={{ width: '100%', padding: '6px 0', background: 'transparent', color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', marginBottom: 6 }}>Restart onboarding</button>
        <button onClick={() => { if (confirm('Reset ALL data and start over? This cannot be undone.')) store.reset(); }} style={{ width: '100%', padding: '6px 0', background: 'transparent', color: t.bad, border: `1px solid ${t.bad}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer' }}>Reset everything</button>
      </div>
    </div>
  );
}

// Root error boundary — catches any uncaught render error anywhere in the tree
// and shows a friendly "reload" screen rather than a blank page. Data in
// IndexedDB is unaffected — reload will pick it back up.
class RootErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('[root]', err, info); }
  render() {
    if (!this.state.err) return this.props.children;
    const msg = String(this.state.err?.message || this.state.err);
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: 40,
        background: '#f4ecd8', color: '#2b1d0e', fontFamily: "'Fraunces', Georgia, serif",
      }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8b2b1f', letterSpacing: 0.18, textTransform: 'uppercase', marginBottom: 14 }}>The Loom caught a snag</div>
          <h1 style={{ fontSize: 36, fontWeight: 400, margin: '0 0 14px', letterSpacing: -0.015 }}>Something broke. Your work is safe.</h1>
          <p style={{ fontSize: 15, fontStyle: 'italic', color: '#5a4a35', lineHeight: 1.6, marginBottom: 22 }}>
            Everything you've written is stored locally in your browser's database — nothing is lost. Reload to pick up where you left off.
          </p>
          <pre style={{ padding: 12, background: '#ebe1c7', border: '1px solid #c9b98e', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#5a4a35', textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 18, maxHeight: 160, overflow: 'auto' }}>{msg}</pre>
          <button onClick={() => location.reload()} style={{
            padding: '12px 28px', background: '#8b2b1f', color: '#f4ecd8',
            border: 'none', borderRadius: 2, fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
          }}>↻ Reload</button>
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <RootErrorBoundary>
    <ThemeProvider initial="day">
      <StoreProvider>
        <SelectionProvider>
          <MindMapProvider>
            <SelectionBridge />
            <EntitiesBridge />
            <WritersRoom />
          </MindMapProvider>
        </SelectionProvider>
      </StoreProvider>
    </ThemeProvider>
  </RootErrorBoundary>
);

// Loomwright — shell composition (plan §6, §22). Mounts at /writers.

import React from 'react';
import './shell.css';
import { useTheme, PANEL_WIDTHS_FALLBACK, PANEL_ACCENT } from './theme';
import { useStore, createChapter } from './store';
import { useSelection } from './selection';
import LeftRail, { PANELS } from './LeftRail';
import TopBar from './TopBar';
import RitualBar from './RitualBar';
import Editor from './prose/Editor';
import MarginNoticings from './prose/MarginNoticings';
import CommandPalette from './CommandPalette';
import InlineWeaver from './InlineWeaver';
import SummoningRing from './radial/SummoningRing';
import WalkThroughWizard from './wizard/WalkThroughWizard';
import Onboarding from './onboarding';
import ReadAloud from './utilities/ReadAloud';

import CastPanel from './panels/cast';
import AtlasPanel from './panels/atlas';
import ThreadsPanel from './panels/threads';
import VoicePanel from './panels/voice';
import ItemsPanel from './panels/items';
import LanguagePanel from './panels/language';
import TanglePanel from './panels/tangle';
import SeriesBible from './panels/series-bible';
import { PANEL_WIDTHS } from './store/schema';

const PANEL_COMPONENTS = {
  cast: CastPanel, atlas: AtlasPanel, threads: ThreadsPanel,
  voice: VoicePanel, items: ItemsPanel, language: LanguagePanel,
  tangle: TanglePanel,
};

export default function Shell() {
  const t = useTheme();
  const store = useStore();
  const { sel } = useSelection();

  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [weaverOpen, setWeaverOpen] = React.useState(false);
  const [ring, setRing] = React.useState(null);
  const [wizard, setWizard] = React.useState(null);
  const [seriesOpen, setSeriesOpen] = React.useState(false);

  const openPanels = store.ui?.panels || [];
  const focusMode = store.ui?.focusMode || false;

  // Ensure at least one chapter exists once onboarding is complete.
  React.useEffect(() => {
    if (store._loading) return;
    if (!store.profile?.onboarded) return;
    const order = store.book?.chapterOrder || [];
    if (order.length === 0) createChapter(store, { title: 'Chapter 1', text: '' });
  }, [store._loading, store.profile?.onboarded]);

  const togglePanel = (id) => {
    const list = openPanels.includes(id)
      ? openPanels.filter(x => x !== id)
      : [...openPanels, id];
    // Auto-collapse oldest if 4+ open.
    while (list.length > 3) list.shift();
    store.setPath('ui.panels', list);
  };

  const closePanel = (id) => {
    store.setPath('ui.panels', openPanels.filter(x => x !== id));
  };

  const ensurePanelOpen = (id) => {
    if (!openPanels.includes(id)) togglePanel(id);
  };

  const onAction = (actionId) => {
    if (actionId.startsWith('panel.')) {
      const panel = actionId.replace('panel.', '');
      ensurePanelOpen(panel);
      return;
    }
    if (actionId === 'open.weaver') setWeaverOpen(true);
    if (actionId === 'focus.toggle') store.setPath('ui.focusMode', !focusMode);
    if (actionId === 'theme.toggle') t.toggle();
  };

  const onWalkThrough = (suggestion) => {
    const kindMap = { character: 'character', place: 'place', thread: 'thread', item: 'item' };
    const kind = kindMap[suggestion.kind] || 'character';
    setWizard({ kind, proposal: suggestion.proposal });
  };

  const onRingAction = ({ context, spokeId }) => {
    if (context === 'editor') {
      if (spokeId === 'cast') ensurePanelOpen('cast');
      if (spokeId === 'atlas') ensurePanelOpen('atlas');
      if (spokeId === 'voice') ensurePanelOpen('voice');
      if (spokeId === 'threads') ensurePanelOpen('threads');
      if (spokeId === 'tangle') ensurePanelOpen('tangle');
      if (spokeId === 'weave') setWeaverOpen(true);
    } else if (context === 'atlas') {
      if (spokeId === 'newPlace') {
        // sub-radial handles template; here we no-op.
      }
    } else if (context === 'placeTemplates' && ring?.mapPoint) {
      const { x, y } = ring.mapPoint;
      const id = `pl_${Date.now()}`;
      store.setSlice('places', ps => [...(ps || []), {
        id, name: `New ${spokeId}`, kind: spokeId, realm: 'the world',
        x, y, visits: [], children: [], parentId: null, proposed: false,
        hasFloorplan: false, createdAt: Date.now(),
      }]);
    }
  };

  // Global keyboard.
  React.useEffect(() => {
    const onKey = (e) => {
      const inField = e.target?.matches('input, textarea, [contenteditable="true"]');
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setWeaverOpen(true);
        return;
      }
      if (!inField && e.key === 'F9') {
        e.preventDefault();
        store.setPath('ui.focusMode', !focusMode);
      }
      if (e.key === 'Escape') {
        if (ring) { setRing(null); return; }
        if (wizard) { setWizard(null); return; }
        if (paletteOpen) { setPaletteOpen(false); return; }
        if (weaverOpen) { setWeaverOpen(false); return; }
        if (seriesOpen) { setSeriesOpen(false); return; }
        if (openPanels.length) { store.setPath('ui.panels', openPanels.slice(0, -1)); return; }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode, ring, wizard, paletteOpen, weaverOpen, seriesOpen, openPanels.join(',')]);

  if (store._loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: t.bg, display: 'grid', placeItems: 'center',
        fontFamily: t.display, color: t.ink3,
      }}>Loading…</div>
    );
  }

  if (!store.profile?.onboarded) {
    return <Onboarding onDone={() => store.setPath('profile.onboarded', true)} />;
  }

  return (
    <div className={'lw-app' + (focusMode ? ' focus-mode' : '')} style={{
      background: t.bg, color: t.ink,
    }}>
      {!focusMode && (
        <LeftRail
          openPanels={openPanels}
          onTogglePanel={togglePanel}
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenWeaver={() => setWeaverOpen(true)}
        />
      )}
      <div className="lw-center">
        {!focusMode && (
          <TopBar
            onOpenPalette={() => setPaletteOpen(true)}
            onToggleFocus={() => store.setPath('ui.focusMode', !focusMode)}
            focusMode={focusMode}
          />
        )}
        <div className="lw-prose-wrap" style={{ display: 'flex' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Editor
              onContextMenu={({ x, y }) => setRing({ x, y, context: 'editor' })}
            />
          </div>
          {!focusMode && <MarginNoticings onWalkThrough={onWalkThrough} />}
        </div>
        {!focusMode && <RitualBar />}
      </div>
      {!focusMode && (
        <div className="lw-panel-stack">
          {openPanels.map(id => {
            const Cmp = PANEL_COMPONENTS[id];
            if (!Cmp) return null;
            return <Cmp key={id}
              onClose={() => closePanel(id)}
              onSummonRing={(args) => setRing({ ...args })}
              onWeave={() => setWeaverOpen(true)}
              onInterview={() => {}}
            />;
          })}
        </div>
      )}

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} onAction={onAction} />}
      {weaverOpen && <InlineWeaver onClose={() => setWeaverOpen(false)} onWalkThrough={onWalkThrough} />}
      {ring && <SummoningRing {...ring} onAction={onRingAction} onClose={() => setRing(null)} />}
      {wizard && <WalkThroughWizard kind={wizard.kind} proposal={wizard.proposal} onClose={() => setWizard(null)} />}
      {seriesOpen && <SeriesBible onClose={() => setSeriesOpen(false)} />}
    </div>
  );
}

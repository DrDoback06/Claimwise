// Loomwright — shell composition (plan §6, §22). Mounts at /writers.

import React from 'react';
import './shell.css';
import { useTheme } from './theme';
import { useStore, createChapter } from './store';
import { useSelection } from './selection';
import LeftRail from './LeftRail';
import TopBar from './TopBar';
import RitualBar from './RitualBar';
import Editor from './prose/Editor';
import MarginNoticings from './prose/MarginNoticings';
import Tethers from './prose/Tethers';
import CommandPalette from './CommandPalette';
import InlineWeaver from './InlineWeaver';
import SummoningRing from './radial/SummoningRing';
import WalkThroughWizard from './wizard/WalkThroughWizard';
import Onboarding from './onboarding';
import Settings from './Settings';
import KeyboardHelp from './KeyboardHelp';
import WritingAid from './WritingAid';
import Proofreader from './Proofreader';
import WhatsNew from './WhatsNew';
import VersionHistory from './utilities/VersionHistory';
import aiService from '../../services/aiService';
import { shouldAutoSnapshot, makeSnapshot, pushSnapshot } from './utilities/snapshots';
import { scheduleAutonomousRun, clearAllRuns } from './ai/pipeline';
import { ensureDefaultAuthor } from './authors/AuthorsPanel';

import CastPanel from './panels/cast';
import AtlasPanel from './panels/atlas';
import QuestsPanel from './panels/quests';
import VoicePanel from './panels/voice';
import ItemsPanel from './panels/items';
import LanguagePanel from './panels/language';
import TanglePanel from './panels/tangle';
import GroupChatPanel from './panels/groupchat';
import InterviewPanel from './panels/interview';
import SeriesBible from './panels/series-bible';
import SkillsPanel from './panels/skills';
import ContinuityPanel from './panels/continuity';
import ReferencesPanel from './panels/references';
import SuggestionDrawer from './suggestions/SuggestionDrawer';
import ExtractionWizard from './extraction/ExtractionWizard';
import TodayPanel from './today/TodayPanel';
import MobileTabBar from './MobileTabBar';

const PANEL_COMPONENTS = {
  cast: CastPanel, atlas: AtlasPanel, quests: QuestsPanel, threads: QuestsPanel,
  voice: VoicePanel, items: ItemsPanel, language: LanguagePanel,
  tangle: TanglePanel, groupchat: GroupChatPanel, interview: InterviewPanel,
  skills: SkillsPanel, continuity: ContinuityPanel,
  references: ReferencesPanel,
};

export default function Shell() {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();

  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [weaverOpen, setWeaverOpen] = React.useState(false);
  const [aidOpen, setAidOpen] = React.useState(false);
  const [proofOpen, setProofOpen] = React.useState(false);
  const [ring, setRing] = React.useState(null);
  const [wizard, setWizard] = React.useState(null);
  const [seriesOpen, setSeriesOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [tethers, setTethers] = React.useState([]);
  const [extractionFor, setExtractionFor] = React.useState(null); // chapterId

  const proseColumnRef = React.useRef(null);
  const marginRef = React.useRef(null);

  const openPanels = store.ui?.panels || [];
  const focusMode = store.ui?.focusMode || false;

  // Ensure at least one chapter exists once onboarding is complete.
  React.useEffect(() => {
    if (store._loading) return;
    if (!store.profile?.onboarded) return;
    const order = store.book?.chapterOrder || [];
    if (order.length === 0) createChapter(store, { title: 'Chapter 1', text: '' });
  }, [store._loading, store.profile?.onboarded]);

  // Seed a default author so margin notes always have someone to attribute to.
  React.useEffect(() => {
    if (store._loading) return;
    if (!store.profile?.onboarded) return;
    ensureDefaultAuthor(store);
  }, [store._loading, store.profile?.onboarded, store.authors?.length]);

  // Push any persisted API keys back into the legacy aiService so the
  // writing aid / proofreader / interview can reach the chosen provider
  // without the user having to re-save.
  React.useEffect(() => {
    if (store._loading) return;
    const keys = store.profile?.apiKeys || {};
    for (const [provider, key] of Object.entries(keys)) {
      if (key && typeof aiService.setApiKey === 'function') {
        try { aiService.setApiKey(provider, key); } catch {}
      }
    }
    if (store.profile?.aiProvider && store.profile.aiProvider !== 'auto') {
      try { aiService.preferredProvider = store.profile.aiProvider; } catch {}
    }
  }, [store._loading, store.profile?.apiKeys, store.profile?.aiProvider]);

  // Auto-snapshot on chapter save. We hook into chapter changes via lastEdit.
  const lastSnapshotMs = React.useRef({});
  const lastPipelineMs = React.useRef({});
  React.useEffect(() => {
    const id = store.ui?.activeChapterId || store.book?.currentChapterId;
    const ch = id ? store.chapters?.[id] : null;
    if (!ch?.lastEdit) return;
    if (lastSnapshotMs.current[id] !== ch.lastEdit) {
      lastSnapshotMs.current[id] = ch.lastEdit;
      if (shouldAutoSnapshot(id, store.snapshots)) {
        pushSnapshot(store, makeSnapshot(ch, 'auto'));
      }
    }
    // Autonomous AI pipeline: only schedule when the writer's onboarded
    // (so we have context) and the chapter has real content.
    if (lastPipelineMs.current[id] !== ch.lastEdit
        && (ch.text || '').trim().length > 80
        && store.profile?.onboarded) {
      lastPipelineMs.current[id] = ch.lastEdit;
      scheduleAutonomousRun(store, id);
    }
  }, [store.chapters, store.ui?.activeChapterId, store.book?.currentChapterId, store.snapshots, store]);

  React.useEffect(() => () => clearAllRuns(), []);

  // Reset wordsToday at midnight (user local).
  React.useEffect(() => {
    const last = store.book?.wordsTodayDate;
    const today = new Date().toDateString();
    if (last !== today && store.book?.id) {
      store.transaction(({ setPath }) => {
        setPath('book.wordsToday', 0);
        setPath('book.wordsTodayDate', today);
      });
    }
  }, [store.book?.id, store.book?.wordsTodayDate, store]);

  const togglePanel = (id) => {
    const list = openPanels.includes(id)
      ? openPanels.filter(x => x !== id)
      : [...openPanels, id];
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
      ensurePanelOpen(actionId.replace('panel.', ''));
      return;
    }
    if (actionId === 'open.weaver') setWeaverOpen(true);
    if (actionId === 'open.aid') setAidOpen(true);
    if (actionId === 'open.proof') setProofOpen(true);
    if (actionId === 'open.settings') setSettingsOpen(true);
    if (actionId === 'open.bible') setSeriesOpen(true);
    if (actionId === 'open.history') setHistoryOpen(true);
    if (actionId === 'open.help') setHelpOpen(true);
    if (actionId === 'open.groupchat') ensurePanelOpen('groupchat');
    if (actionId === 'open.suggestions') store.setPath('ui.suggestionsOpen', true);
    if (actionId === 'toggle.suggestions') store.setPath('ui.suggestionsOpen', !store.ui?.suggestionsOpen);
    if (actionId === 'open.extraction') {
      const chId = store.ui?.activeChapterId || store.book?.currentChapterId;
      if (chId) setExtractionFor(chId);
    }
    if (actionId === 'rescan.all') {
      const order = store.book?.chapterOrder || [];
      let scheduled = 0;
      for (const id of order) {
        const ch = store.chapters?.[id];
        if ((ch?.text || '').trim().length > 80) {
          try { scheduleAutonomousRun(store, id); scheduled++; } catch {}
        }
      }
      if (scheduled === 0) window.alert('No chapters with enough text to scan.');
    }
    if (actionId === 'open.skills') ensurePanelOpen('skills');
    if (actionId === 'open.continuity') ensurePanelOpen('continuity');
    if (actionId === 'focus.toggle') store.setPath('ui.focusMode', !focusMode);
    if (actionId === 'theme.toggle') t.toggle();
  };

  const onWalkThrough = (suggestion) => {
    const kind = suggestion.kind === 'character' || suggestion.kind === 'place' || suggestion.kind === 'thread' || suggestion.kind === 'item'
      ? suggestion.kind : 'character';
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
    } else if (context === 'placeTemplates' && ring?.mapPoint) {
      const { x, y } = ring.mapPoint;
      const id = `pl_${Date.now()}`;
      store.setSlice('places', ps => [...(ps || []), {
        id, name: `New ${spokeId}`, kind: spokeId, realm: 'the world',
        x, y, visits: [], children: [], parentId: null, proposed: false,
        hasFloorplan: false, createdAt: Date.now(),
      }]);
      select('place', id);
    }
  };

  // Listen for the Extract button in TopBar.
  React.useEffect(() => {
    const onOpen = () => {
      const chId = store.ui?.activeChapterId || store.book?.currentChapterId;
      if (chId) setExtractionFor(chId);
    };
    window.addEventListener('lw:open-extraction', onOpen);
    return () => window.removeEventListener('lw:open-extraction', onOpen);
  }, [store.ui?.activeChapterId, store.book?.currentChapterId]);

  // Global keyboard.
  React.useEffect(() => {
    const onKey = (e) => {
      const inField = e.target?.matches('input, textarea, [contenteditable="true"]');
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setPaletteOpen(true); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault(); setWeaverOpen(true); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault(); setAidOpen(true); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "'") {
        e.preventDefault(); setProofOpen(true); return;
      }
      if (!inField && e.key === 'F9') {
        e.preventDefault();
        store.setPath('ui.focusMode', !focusMode);
      }
      if (!inField && e.key === '?' ) {
        e.preventDefault(); setHelpOpen(true);
      }
      if (e.key === 'Escape') {
        if (helpOpen) { setHelpOpen(false); return; }
        if (historyOpen) { setHistoryOpen(false); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
        if (ring) { setRing(null); return; }
        if (wizard) { setWizard(null); return; }
        if (paletteOpen) { setPaletteOpen(false); return; }
        if (aidOpen) { setAidOpen(false); return; }
        if (proofOpen) { setProofOpen(false); return; }
        if (weaverOpen) { setWeaverOpen(false); return; }
        if (seriesOpen) { setSeriesOpen(false); return; }
        if (openPanels.length) { store.setPath('ui.panels', openPanels.slice(0, -1)); return; }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode, ring, wizard, paletteOpen, weaverOpen, aidOpen, proofOpen, seriesOpen, settingsOpen, helpOpen, historyOpen, openPanels, store]);

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
          onOpenAid={() => setAidOpen(true)}
          todayOpen={!!store.ui?.todayOpen}
          onToggleToday={() => store.setPath('ui.todayOpen', !store.ui?.todayOpen)}
        />
      )}
      {!focusMode && store.ui?.todayOpen && (
        <TodayPanel
          onOpenPanel={ensurePanelOpen}
          onClose={() => store.setPath('ui.todayOpen', false)}
        />
      )}
      <div className="lw-center">
        {!focusMode && (
          <TopBar
            onOpenPalette={() => setPaletteOpen(true)}
            onToggleFocus={() => store.setPath('ui.focusMode', !focusMode)}
            focusMode={focusMode}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenBible={() => setSeriesOpen(true)}
            onOpenHistory={() => setHistoryOpen(true)}
            onOpenProof={() => setProofOpen(true)}
            onOpenAid={() => setAidOpen(true)}
          />
        )}
        <div className="lw-prose-wrap" ref={proseColumnRef} style={{ display: 'flex', position: 'relative' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Editor
              onContextMenu={({ x, y }) => setRing({ x, y, context: 'editor' })}
              onParagraphMeasure={() => { /* triggers tether redraw via state below */ }}
            />
          </div>
          {!focusMode && (
            <MarginNoticings
              ref={marginRef}
              onWalkThrough={onWalkThrough}
              onTethersChange={setTethers}
            />
          )}
          {!focusMode && tethers.length > 0 && <Tethers tethers={tethers} hostRef={proseColumnRef} />}
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
              onInterview={() => ensurePanelOpen('interview')}
            />;
          })}
          {store.ui?.suggestionsOpen && (
            <SuggestionDrawer onClose={() => store.setPath('ui.suggestionsOpen', false)} />
          )}
        </div>
      )}

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} onAction={onAction} />}
      {weaverOpen && <InlineWeaver onClose={() => setWeaverOpen(false)} onWalkThrough={onWalkThrough} />}
      {aidOpen && <WritingAid onClose={() => setAidOpen(false)} />}
      {proofOpen && <Proofreader onClose={() => setProofOpen(false)} />}
      {!focusMode && <WhatsNew onOpenAid={() => setAidOpen(true)} onOpenProof={() => setProofOpen(true)} />}
      {ring && <SummoningRing {...ring} onAction={onRingAction} onClose={() => setRing(null)} />}
      {wizard && <WalkThroughWizard kind={wizard.kind} proposal={wizard.proposal} onClose={() => setWizard(null)} />}
      {seriesOpen && <SeriesBible onClose={() => setSeriesOpen(false)} />}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
      {helpOpen && <KeyboardHelp onClose={() => setHelpOpen(false)} />}
      {historyOpen && <VersionHistory onClose={() => setHistoryOpen(false)} />}
      {extractionFor && (
        <ExtractionWizard
          chapterId={extractionFor}
          onClose={() => setExtractionFor(null)}
        />
      )}
      {!focusMode && (
        <MobileTabBar
          openPanels={openPanels}
          onTogglePanel={togglePanel}
          onCloseAll={() => store.setPath('ui.panels', [])}
        />
      )}
    </div>
  );
}

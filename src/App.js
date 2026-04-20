/**
 * Loomwright — standalone app root.
 *
 * Owns the top-level state (worldState, activeTab), bootstraps the IndexedDB
 * layer, and routes to feature pages under the 5 verb-based nav groups:
 *   Today • Write • Track • Explore • Settings.
 *
 * The previous 7k-line App.js lives in docs/legacy/App.legacy.js for reference
 * only and is NOT imported by this file.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';

// Core services
import db from './services/database';
import aiService from './services/aiService';
import contextEngine from './services/contextEngine';
import toastService from './services/toastService';
import undoRedoManager from './services/undoRedo';
import chapterNavigationService from './services/chapterNavigationService';
import { resolveTab, parseDeepLink } from './services/keyboardShortcuts';
import { runLegacyMigration } from './services/legacyMigration';

// Loomwright shell
import { ThemeProvider, useTheme } from './loomwright/theme';

// Chrome
import AppHeader from './components/AppHeader';
import NavigationSidebar from './components/NavigationSidebar';
import ToastContainer from './components/ToastContainer';
import GlobalSearch from './components/GlobalSearch';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import TutorialWizard, { shouldAutoOpen as shouldAutoOpenTutorial } from './components/TutorialWizard';
import useIsMobile from './loomwright/useIsMobile';

// Onboarding (re-rendered inside Loomwright shell)
import OnboardingHost from './pages/OnboardingHost';

// Pages
import TodayPage from './pages/Today';
import WritePage from './pages/Write';
import CastPage from './pages/Cast';
import CharacterDetailPage from './pages/cast/CharacterDetail';
import ItemsLibraryPage from './pages/ItemsLibrary';
import SkillsLibraryPage from './pages/SkillsLibrary';
import StatsLibraryPage from './pages/StatsLibrary';
import VoiceStudioPage from './pages/VoiceStudio';
import AtlasPage from './pages/Atlas';
import WorldPage from './pages/World';
import PlotTimelinePage from './pages/PlotTimeline';
import SettingsPage from './pages/Settings';

// Styles
import './styles/theme.css';
import './styles/z-layers.css';

const DEFAULT_STAT_REGISTRY = [
  { id: 'st1', key: 'STR', name: 'Strength', desc: 'Physical power & carry weight.', isCore: true, color: 'green' },
  { id: 'st2', key: 'VIT', name: 'Vitality', desc: 'Health & endurance.', isCore: true, color: 'green' },
  { id: 'st3', key: 'INT', name: 'Intelligence', desc: 'Magic & logic puzzles.', isCore: true, color: 'blue' },
  { id: 'st4', key: 'DEX', name: 'Dexterity', desc: 'Agility & speed.', isCore: true, color: 'yellow' },
];

const EMPTY_STATE = {
  meta: { premise: '', tone: '', reveal: '' },
  statRegistry: [],
  skillBank: [],
  itemBank: [],
  books: {},
  actors: [],
  plotThreads: [],
  places: [],
  floorplans: [],
  regions: [],
};

// Routes that should render with no header/sidebar chrome (e.g. onboarding)
const CHROMELESS_TABS = new Set(['onboarding']);

function LoadingScreen() {
  const t = useTheme();
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: t.bg,
        color: t.ink2,
        fontFamily: t.mono,
        fontSize: 11,
        letterSpacing: 0.12,
        textTransform: 'uppercase',
      }}
    >
      Loomwright · Loading
    </div>
  );
}

function AppInner() {
  const t = useTheme();
  const { isMobile, isTablet } = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const deepLink = useRef(parseDeepLink()).current;
  const [activeTab, setActiveTab] = useState(deepLink.tab || 'today');
  const [selectedCharacterId, setSelectedCharacterId] = useState(deepLink.characterId);
  const [worldState, setWorldState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [undoRedoInfo, setUndoRedoInfo] = useState({ canUndo: false, canRedo: false });
  const [bookTab, setBookTab] = useState(1);
  const [currentChapter, setCurrentChapter] = useState(1);
  // Set to `true` when a deep-link or PWA shortcut requested idea capture; the
  // Write page honours this and focuses the Weaver rail input on mount.
  const [captureOnMount, setCaptureOnMount] = useState(deepLink.capture);
  const [initialWeaveIdea] = useState(deepLink.sharedText || '');

  // -----------------------------------------------------------------------
  // Init
  // -----------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        await db.init();
        // Promote legacy actor.inventory / actor.*Skills references into
        // the global banks so the Items Library / Skills Library /
        // World views stop being empty for pre-pass-3 users.
        try {
          const result = await runLegacyMigration();
          if (!result.skipped && (result.promotedItems || result.promotedSkills)) {
            console.log(`[Loomwright] Legacy migration promoted ${result.promotedItems} items + ${result.promotedSkills} skills into banks.`);
          }
        } catch (e) {
          console.warn('[Loomwright] Legacy migration failed (non-fatal):', e);
        }

        const isOnboardingDone = await contextEngine.isOnboardingComplete();
        setOnboardingDone(isOnboardingDone);

        if (!isOnboardingDone) {
          setWorldState({ ...EMPTY_STATE, statRegistry: DEFAULT_STAT_REGISTRY });
          setShowOnboarding(true);
          setActiveTab('onboarding');
          setIsLoading(false);
          return;
        }

        await loadWorld();
      } catch (e) {
        console.error('[Loomwright] init failed', e);
        setWorldState({ ...EMPTY_STATE, statRegistry: DEFAULT_STAT_REGISTRY });
        setIsLoading(false);
      }
    })();

    // Chapter navigation service: jump into Write when a flagged issue is
    // clicked; the range (if any) is forwarded to the editor's seek handler.
    chapterNavigationService.setNavigationCallback?.((bookId, chapterId, range) => {
      setActiveTab('write');
      if (bookId) setBookTab(bookId);
      if (chapterId) setCurrentChapter(chapterId);
      toastService.info?.(
        range
          ? `Jumped to chapter ${chapterId}, range ${range[0]}\u2013${range[1]}`
          : `Navigated to chapter ${chapterId}`,
      );
    });

    // Undo coverage (HANDOFF \u00a75.13): any legacy db.update that touches a
    // tracked store fires this event. Reload the world and push an undo
    // snapshot so Ctrl+Z covers those paths too. Throttled so a burst of
    // writes produces one snapshot, not dozens.
    let undoTimer = null;
    const onDbChange = () => {
      clearTimeout(undoTimer);
      undoTimer = setTimeout(async () => {
        try {
          const actors = await db.getAll('actors').catch(() => []);
          const itemBank = await db.getAll('itemBank').catch(() => []);
          const skillBank = await db.getAll('skillBank').catch(() => []);
          const booksArr = await db.getAll('books').catch(() => []);
          const plotThreads = await db.getAll('plotThreads').catch(() => []);
          const booksObj = {};
          booksArr.forEach((b) => { booksObj[b.id] = b; });
          setWorldState((prev) => {
            const next = { ...(prev || {}), actors, itemBank, skillBank, books: booksObj, plotThreads };
            undoRedoManager.saveState?.(next, 'Legacy db write');
            setUndoRedoInfo(undoRedoManager.getHistoryInfo?.() || { canUndo: false, canRedo: false });
            return next;
          });
        } catch (_e) { /* swallow */ }
      }, 250);
    };
    window.addEventListener('loomwright:db-change', onDbChange);
    return () => { window.removeEventListener('loomwright:db-change', onDbChange); clearTimeout(undoTimer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep aiService aware of current chapter/voice context
  useEffect(() => {
    aiService.setLoomwrightContext?.(() => ({ worldState, bookId: bookTab, chapterId: currentChapter }));
  }, [worldState, bookTab, currentChapter]);

  const loadWorld = useCallback(async () => {
    // Tolerate missing stores on older DBs — any store that isn't provisioned
    // yet resolves to `[]` instead of throwing the whole boot.
    const safeGetAll = async (storeName) => {
      try { return (await db.getAll(storeName)) || []; }
      catch (e) { console.warn(`[Loomwright] store '${storeName}' unavailable:`, e?.message || e); return []; }
    };
    try {
      const actors = await safeGetAll('actors');
      let statRegistry = await safeGetAll('statRegistry');
      if (!statRegistry || statRegistry.length === 0) {
        try { await db.bulkAdd('statRegistry', DEFAULT_STAT_REGISTRY); } catch (_e) { /* noop */ }
        statRegistry = DEFAULT_STAT_REGISTRY;
      }
      const loaded = {
        meta: (await safeGetAll('meta'))[0] || { premise: '', tone: '', reveal: '' },
        statRegistry,
        skillBank: await safeGetAll('skillBank'),
        itemBank: await safeGetAll('itemBank'),
        actors,
        books: await safeGetAll('books'),
        plotThreads: await safeGetAll('plotThreads'),
        places: await safeGetAll('places'),
        floorplans: await safeGetAll('floorplans'),
        factions: await safeGetAll('factions'),
        loreEntries: await safeGetAll('loreEntries'),
        regions: await safeGetAll('regions'),
      };
      // Convert books array to object (legacy shape used by many widgets).
      const booksObj = {};
      loaded.books.forEach((b) => { booksObj[b.id] = b; });
      const state = { ...loaded, books: booksObj };
      setWorldState(state);
      undoRedoManager.saveState?.(state, 'Initial Load');
      setUndoRedoInfo(undoRedoManager.getHistoryInfo?.() || { canUndo: false, canRedo: false });
      setIsLoading(false);
    } catch (e) {
      console.error('[Loomwright] loadWorld failed', e);
      setWorldState({ ...EMPTY_STATE, statRegistry: DEFAULT_STAT_REGISTRY });
      setIsLoading(false);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Global keybinds (see services/keyboardShortcuts.js for the source of truth)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowGlobalSearch(true); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); setShowKeyboardShortcuts((v) => !v); return; }
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key === '1') { e.preventDefault(); setActiveTab('today'); return; }
        if (e.key === '2') { e.preventDefault(); setActiveTab('write'); return; }
        if (e.key === '3') { e.preventDefault(); setActiveTab('cast'); return; }
        if (e.key === '4') { e.preventDefault(); setActiveTab('atlas'); return; }
        if (e.key === '5') { e.preventDefault(); setActiveTab('plot_timeline'); return; }
        if (e.key === '6') { e.preventDefault(); setActiveTab('settings'); return; }
      }
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const prev = undoRedoManager.undo?.();
        if (prev) { setWorldState(prev); setUndoRedoInfo(undoRedoManager.getHistoryInfo?.() || {}); }
      } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
        e.preventDefault();
        const next = undoRedoManager.redo?.();
        if (next) { setWorldState(next); setUndoRedoInfo(undoRedoManager.getHistoryInfo?.() || {}); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // -----------------------------------------------------------------------
  // Navigation helpers
  // -----------------------------------------------------------------------
  const navigateToCharacter = useCallback((actorId) => {
    setSelectedCharacterId(actorId);
    setActiveTab('cast_detail');
  }, []);

  const handleOnboardingComplete = useCallback(async () => {
    setShowOnboarding(false);
    setOnboardingDone(true);
    await loadWorld();
    setActiveTab('today');
    // Auto-open the Tutorial Wizard on first login after onboarding.
    if (shouldAutoOpenTutorial()) setShowTutorial(true);
  }, [loadWorld]);

  const rerunOnboarding = useCallback(() => {
    setShowOnboarding(true);
    setActiveTab('onboarding');
  }, []);

  /**
   * Global search emits hits of shape
   *   { type: 'actor'|'item'|'skill'|'chapter', id, bookId? }
   * or, if a consumer calls onNavigate('tabId'), a legacy tab id. Translate
   * both into a new-nav tab id + any selection state.
   */
  const onGlobalSearchNavigate = useCallback((typeOrTab, id, bookId) => {
    setShowGlobalSearch(false);
    // Result-object shape
    switch (typeOrTab) {
      case 'actor':
        if (id) setSelectedCharacterId(id);
        setActiveTab('cast_detail');
        return;
      case 'item':
        setActiveTab('items_library');
        return;
      case 'skill':
        setActiveTab('skills_library');
        return;
      case 'stat':
        setActiveTab('stats_library');
        return;
      case 'chapter':
        if (bookId) setBookTab(bookId);
        if (id) setCurrentChapter(id);
        setActiveTab('write');
        return;
      default:
        // Legacy tab id path — run through the canonical resolver.
        setActiveTab(resolveTab(typeOrTab) || 'today');
    }
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (isLoading || !worldState) return <LoadingScreen />;

  const pageProps = {
    worldState,
    setWorldState,
    bookTab,
    setBookTab,
    currentChapter,
    setCurrentChapter,
    onNavigate: (tab) => setActiveTab(resolveTab(tab) || tab),
    onNavigateToCharacter: navigateToCharacter,
    selectedCharacterId,
    onRerunOnboarding: rerunOnboarding,
    onOpenTutorial: () => setShowTutorial(true),
    captureOnMount,
    initialWeaveIdea,
    onCaptureConsumed: () => setCaptureOnMount(false),
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'today':          return <TodayPage {...pageProps} />;
      case 'write':          return <WritePage {...pageProps} />;
      case 'cast':            return <CastPage {...pageProps} />;
      case 'cast_detail':    return <CharacterDetailPage {...pageProps} />;
      case 'items_library':   return <ItemsLibraryPage {...pageProps} />;
      case 'skills_library':  return <SkillsLibraryPage {...pageProps} />;
      case 'stats_library':   return <StatsLibraryPage {...pageProps} />;
      case 'voice_studio':    return <VoiceStudioPage {...pageProps} />;
      case 'atlas':           return <AtlasPage {...pageProps} />;
      case 'world':           return <WorldPage {...pageProps} />;
      case 'plot_timeline':   return <PlotTimelinePage {...pageProps} />;
      case 'settings':        return <SettingsPage {...pageProps} />;
      case 'onboarding':     return null; // rendered as overlay below
      default:                return <TodayPage {...pageProps} />;
    }
  };

  const chromeless = CHROMELESS_TABS.has(activeTab) || showOnboarding;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: t.bg,
        color: t.ink,
        fontFamily: t.font,
        overflow: 'hidden',
      }}
    >
      {!chromeless && (
        <AppHeader
          undoRedoInfo={undoRedoInfo}
          onUndo={() => {
            const prev = undoRedoManager.undo?.();
            if (prev) { setWorldState(prev); setUndoRedoInfo(undoRedoManager.getHistoryInfo?.() || {}); }
          }}
          onRedo={() => {
            const next = undoRedoManager.redo?.();
            if (next) { setWorldState(next); setUndoRedoInfo(undoRedoManager.getHistoryInfo?.() || {}); }
          }}
          onOpenSearch={() => setShowGlobalSearch(true)}
          onOpenShortcuts={() => setShowKeyboardShortcuts(true)}
          onToggleNav={isTablet ? () => setNavOpen((v) => !v) : undefined}
        />
      )}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {!chromeless && !isTablet && (
          <NavigationSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        {!chromeless && isTablet && navOpen && (
          <>
            <div
              onClick={() => setNavOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)' }}
            />
            <div style={{ position: 'fixed', top: 48, left: 0, bottom: 0, zIndex: 41 }}>
              <NavigationSidebar
                activeTab={activeTab}
                setActiveTab={(tab) => { setActiveTab(tab); setNavOpen(false); }}
              />
            </div>
          </>
        )}
        <main style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative' }}>
          {renderPage()}
        </main>
      </div>

      {/* Onboarding overlay — full-screen, Loomwright-chromed */}
      {showOnboarding && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: t.bg,
            zIndex: 100,
            overflow: 'auto',
          }}
        >
          <OnboardingHost
            onComplete={handleOnboardingComplete}
            onExit={onboardingDone ? () => { setShowOnboarding(false); setActiveTab('today'); } : undefined}
          />
        </div>
      )}

      {/* Global overlays */}
      {showGlobalSearch && (
        <GlobalSearch
          isOpen={showGlobalSearch}
          onClose={() => setShowGlobalSearch(false)}
          worldState={worldState}
          onNavigate={onGlobalSearchNavigate}
        />
      )}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsHelp
          isOpen={showKeyboardShortcuts}
          onClose={() => setShowKeyboardShortcuts(false)}
        />
      )}

      {showTutorial && (
        <TutorialWizard
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
          onFinish={() => setShowTutorial(false)}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider initial="night">
      <AppInner />
    </ThemeProvider>
  );
}

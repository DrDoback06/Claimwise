/**
 * Loomwright — standalone app root.
 *
 * Owns the top-level state (worldState, activeTab), bootstraps the IndexedDB
 * layer, and routes to feature pages under the 5 verb-based nav groups:
 *   Today • Write • Track • Explore • Settings.
 *
 * The previous 7k-line App.js lives in App.legacy.js for reference only and
 * is NOT imported by this file.
 */

import React, { useEffect, useState, useCallback } from 'react';

// Core services (shared with legacy surfaces we still mount inside pages)
import db from './services/database';
import aiService from './services/aiService';
import contextEngine from './services/contextEngine';
import toastService from './services/toastService';
import undoRedoManager from './services/undoRedo';
import chapterNavigationService from './services/chapterNavigationService';

// Loomwright shell
import { ThemeProvider, useTheme } from './loomwright/theme';

// Chrome
import AppHeader from './components/AppHeader';
import NavigationSidebar from './components/NavigationSidebar';
import ToastContainer from './components/ToastContainer';
import GlobalSearch from './components/GlobalSearch';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';

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
  const [activeTab, setActiveTab] = useState('today');
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [worldState, setWorldState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [undoRedoInfo, setUndoRedoInfo] = useState({ canUndo: false, canRedo: false });
  const [bookTab, setBookTab] = useState(1);
  const [currentChapter, setCurrentChapter] = useState(1);

  // -----------------------------------------------------------------------
  // Init
  // -----------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        await db.init();
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

    // Chapter navigation service: jump into Write when a flagged issue is clicked
    chapterNavigationService.setNavigationCallback?.((bookId, chapterId) => {
      setActiveTab('write');
      if (bookId) setBookTab(bookId);
      if (chapterId) setCurrentChapter(chapterId);
      toastService.info?.(`Navigated to chapter ${chapterId}`);
    });
  }, []);

  // Keep aiService aware of current chapter/voice context
  useEffect(() => {
    aiService.setLoomwrightContext?.(() => ({ worldState, bookId: bookTab, chapterId: currentChapter }));
  }, [worldState, bookTab, currentChapter]);

  const loadWorld = useCallback(async () => {
    try {
      const actors = await db.getAll('actors');
      let statRegistry = await db.getAll('statRegistry');
      if (!statRegistry || statRegistry.length === 0) {
        await db.bulkAdd('statRegistry', DEFAULT_STAT_REGISTRY);
        statRegistry = DEFAULT_STAT_REGISTRY;
      }
      const loaded = {
        meta: (await db.getAll('meta'))[0] || { premise: '', tone: '', reveal: '' },
        statRegistry,
        skillBank: await db.getAll('skillBank'),
        itemBank: await db.getAll('itemBank'),
        actors,
        books: await db.getAll('books'),
        plotThreads: (await db.getAll('plotThreads')) || [],
        places: (await db.getAll('places')) || [],
        floorplans: (await db.getAll('floorplans')) || [],
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
  // Global keybinds
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
  }, [loadWorld]);

  const rerunOnboarding = useCallback(() => {
    setShowOnboarding(true);
    setActiveTab('onboarding');
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
    onNavigate: setActiveTab,
    onNavigateToCharacter: navigateToCharacter,
    selectedCharacterId,
    onRerunOnboarding: rerunOnboarding,
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
        />
      )}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {!chromeless && (
          <NavigationSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
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
          onNavigate={(tab) => { setActiveTab(tab); setShowGlobalSearch(false); }}
        />
      )}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsHelp
          isOpen={showKeyboardShortcuts}
          onClose={() => setShowKeyboardShortcuts(false)}
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

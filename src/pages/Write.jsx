/**
 * Write - Loomwright Writer's Room, Weaver-primary layout.
 *
 * Pass 3 (M32) flips the old side-rail arrangement:
 *
 *   +------------------------------------------------+
 *   | slim top bar: Save + Focus + Analysis toggle   |
 *   +------------------------------------------------+
 *   | CANON WEAVER  (primary surface, ~55%)          |
 *   |   - sticky header keeps the idea-capture in    |
 *   |     view when the user scrolls                 |
 *   +------------------------------------------------+
 *   | compact toolbar (Sprint / Read / Language /    |
 *   |   Interview / Voice / Import)                  |
 *   +------------------------------------------------+
 *   | CHAPTER EDITOR (WritingCanvasPro, ~45%)        |
 *   |   - InlineSuggestions overlay lives here       |
 *   +------------------------------------------------+
 *
 * - The "Analysis" button swaps the top pane between the Weaver and the
 *   Story Analysis surface (rather than opening a drawer).
 * - Pane split is a draggable horizontal resizer stored in localStorage
 *   under `lw-write-split`.
 * - Focus mode hides everything except the editor, with a portal-mounted
 *   Exit chip so users can always escape.
 * - Z-layers are provided by `src/styles/z-layers.css` (M32).
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Eye, Feather, MessageSquare, Focus, FileText, Gauge,
  Sparkles, Mic2, AlignLeft,
} from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import useIsMobile from '../loomwright/useIsMobile';
import { Page } from './_shared/PageChrome';
import WritingCanvasPro from '../components/WritingCanvasPro';
import CanonWeaver from '../loomwright/weaver/CanonWeaver';
import LanguageWorkbench from '../loomwright/language/LanguageWorkbench';
import InterviewMode from '../loomwright/interview/InterviewMode';
import SpeedReader from '../components/SpeedReader';
import StoryAnalysisDrawer from './write/StoryAnalysisDrawer';
import ManuscriptImportDrawer from './write/ManuscriptImportDrawer';
import WriterSprintTimer from './write/WriterSprintTimer';
import SelectionRewriteMenu from './write/SelectionRewriteMenu';
import VersionSlider from './write/VersionSlider';
import InlineSuggestions from './write/InlineSuggestions';
import VoiceDriftBanner from './write/VoiceDriftBanner';
import WriterSeekRegistrar from './write/WriterSeekRegistrar';
import PaneResizer from './write/PaneResizer';
import FocusExitChip from './write/FocusExitChip';
import { X } from 'lucide-react';

const SPLIT_KEY = 'lw-write-split';

function CompactButton({ icon: Icon, label, active, onClick, title, hotkey }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      title={hotkey ? `${title || label} (${hotkey})` : title || label}
      aria-label={title || label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 9px',
        background: active ? t.accentSoft : 'transparent',
        color: active ? t.ink : t.ink2,
        border: `1px solid ${active ? t.accent : t.rule}`,
        borderRadius: t.radius,
        cursor: 'pointer',
        fontFamily: t.mono,
        fontSize: 10,
        letterSpacing: 0.12,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={11} /> {label}
    </button>
  );
}

function Drawer({ open, onClose, title, width = 620, children }) {
  const t = useTheme();
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        className="lw-z-drawer"
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)' }}
      />
      <aside
        className="lw-z-drawer"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width,
          background: 'var(--lw-bg, #fff)',
          borderLeft: `1px solid ${t.rule}`,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 30px rgba(0,0,0,0.35)',
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: `1px solid ${t.rule}`,
            background: t.sidebar,
          }}
        >
          <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: 'transparent',
              border: `1px solid ${t.rule}`,
              color: t.ink2,
              borderRadius: t.radius,
              padding: 4,
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </aside>
    </>
  );
}

export default function WritePage({
  worldState,
  setWorldState,
  onNavigate,
  captureOnMount,
  initialWeaveIdea,
  onCaptureConsumed,
  bookTab,
  currentChapter,
}) {
  const t = useTheme();
  const { isMobile } = useIsMobile();

  // Persisted pane split (top = Weaver, bottom = editor).
  const [splitRatio, setSplitRatio] = useState(() => {
    try {
      const raw = typeof localStorage !== 'undefined'
        ? localStorage.getItem(SPLIT_KEY) : null;
      const num = raw ? parseFloat(raw) : NaN;
      return Number.isFinite(num) && num >= 0.2 && num <= 0.85 ? num : 0.55;
    } catch { return 0.55; }
  });
  useEffect(() => {
    try { localStorage.setItem(SPLIT_KEY, String(splitRatio)); } catch (_e) { /* noop */ }
  }, [splitRatio]);

  const [focusMode, setFocusMode] = useState(false);
  const [topPane, setTopPane] = useState('weaver'); // 'weaver' | 'analysis'
  const [openDrawer, setOpenDrawer] = useState(null);
  // openDrawer: null | 'reader' | 'language-full' | 'interview' | 'import' | 'voice'
  const editorHostRef = useRef(null);

  const onPatchWorldState = useCallback((patch) => {
    setWorldState?.((prev) => ({
      ...prev,
      itemBank: patch.itemBank || prev.itemBank,
      actors: patch.actors || prev.actors,
      books: patch.books || prev.books,
      plotThreads: patch.plotThreads || prev.plotThreads,
    }));
  }, [setWorldState]);

  const topHeight = useMemo(() => `${(splitRatio * 100).toFixed(2)}%`, [splitRatio]);
  const bottomHeight = useMemo(() => `${((1 - splitRatio) * 100).toFixed(2)}%`, [splitRatio]);

  // On narrow screens we collapse Weaver into a tab above the editor
  // instead of stacking; both use 50/50.
  const stacked = !isMobile;

  return (
    <Page>
      {/* Slim top bar (hidden in Focus mode). */}
      {!focusMode && (
        <div
          className="lw-z-toolbar"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            borderBottom: `1px solid ${t.rule}`,
            background: t.sidebar,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: t.display, fontSize: 13, color: t.ink,
              letterSpacing: 0.04, fontWeight: 500,
            }}
          >
            Writer&rsquo;s Room
          </div>
          <div
            style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.18, textTransform: 'uppercase',
            }}
          >
            Weaver primary
          </div>
          <div style={{ flex: 1 }} />
          <CompactButton
            icon={Sparkles}
            label={topPane === 'weaver' ? 'Weaver' : 'Analysis'}
            active
            onClick={() => setTopPane((p) => (p === 'weaver' ? 'analysis' : 'weaver'))}
            title="Swap top pane between Canon Weaver and Story Analysis"
          />
          <CompactButton
            icon={Focus}
            label="Focus"
            active={focusMode}
            onClick={() => setFocusMode((v) => !v)}
            title="Fade all chrome and pin the current paragraph to eye-line"
          />
        </div>
      )}

      {/* Main content. */}
      {focusMode ? (
        <div
          ref={editorHostRef}
          className="lw-writer-surface lw-writer-focus lw-z-editor"
          style={{
            flex: 1, minHeight: 0,
            background: t.paper,
            padding: '0 8vw',
            display: 'flex', flexDirection: 'column',
            transition: 'padding 180ms ease, background 180ms ease',
          }}
        >
          <div style={{ flex: 1, overflow: 'auto' }}>
            <WritingCanvasPro onNavigate={onNavigate} onSave={() => {}} />
          </div>
          <SelectionRewriteMenu scopeSelector=".lw-writer-surface" />
          <InlineSuggestions scopeSelector=".lw-writer-surface" worldState={worldState} />
          <WriterSeekRegistrar scopeSelector=".lw-writer-surface" />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex', flexDirection: 'column',
            minHeight: 0, background: t.bg,
          }}
        >
          {/* Top pane: Weaver (primary) or Story Analysis. */}
          <div
            style={{
              height: stacked ? topHeight : 'auto',
              flex: stacked ? 'none' : '0 0 auto',
              minHeight: stacked ? 0 : 260,
              borderBottom: `1px solid ${t.rule}`,
              background: t.paper,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Sticky pane header */}
            <div
              className="lw-z-toolbar"
              style={{
                position: 'sticky', top: 0,
                padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
                background: t.sidebar, borderBottom: `1px solid ${t.rule}`,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontFamily: t.mono, fontSize: 10, color: t.accent,
                  letterSpacing: 0.18, textTransform: 'uppercase',
                }}
              >
                {topPane === 'weaver' ? 'Canon Weaver' : 'Story Analysis'}
              </div>
              <div style={{ flex: 1 }} />
              <CompactButton
                icon={topPane === 'weaver' ? AlignLeft : Sparkles}
                label={topPane === 'weaver' ? 'Analysis' : 'Weaver'}
                onClick={() => setTopPane((p) => (p === 'weaver' ? 'analysis' : 'weaver'))}
                title={topPane === 'weaver' ? 'Switch to Story Analysis' : 'Switch to Canon Weaver'}
              />
            </div>
            <div style={{ flex: 1, overflow: 'auto', background: t.bg }}>
              {topPane === 'weaver' ? (
                <CanonWeaver
                  scoped
                  worldState={worldState}
                  setWorldState={setWorldState}
                  onPatchWorldState={onPatchWorldState}
                  captureOnMount={captureOnMount}
                  initialIdea={initialWeaveIdea}
                  onCaptureConsumed={onCaptureConsumed}
                />
              ) : (
                <StoryAnalysisDrawer
                  worldState={worldState}
                  onJumpToChapter={() => { /* via chapterNavigationService */ }}
                />
              )}
            </div>
          </div>

          {stacked && <PaneResizer setRatio={setSplitRatio} />}

          {/* Compact editor toolbar. */}
          <div
            className="lw-z-toolbar"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
              padding: '6px 14px',
              borderTop: `1px solid ${t.rule}`,
              borderBottom: `1px solid ${t.rule}`,
              background: t.sidebar,
              flexShrink: 0,
            }}
          >
            <WriterSprintTimer />
            <CompactButton
              icon={Eye} label="Read"
              active={openDrawer === 'reader'}
              onClick={() => setOpenDrawer(openDrawer === 'reader' ? null : 'reader')}
              title="Speed reader takeover of the current chapter"
              hotkey="Ctrl+Shift+R"
            />
            <CompactButton
              icon={Feather} label="Language"
              active={openDrawer === 'language-full'}
              onClick={() => setOpenDrawer(openDrawer === 'language-full' ? null : 'language-full')}
              title="Grammar, rewrite, readability and thesaurus"
              hotkey="Ctrl+Shift+L"
            />
            <CompactButton
              icon={MessageSquare} label="Interview"
              active={openDrawer === 'interview'}
              onClick={() => setOpenDrawer(openDrawer === 'interview' ? null : 'interview')}
              title="Chat with a character in voice; turn any line into a scene seed"
              hotkey="Ctrl+Shift+I"
            />
            <CompactButton
              icon={Mic2} label="Voice"
              active={openDrawer === 'voice'}
              onClick={() => setOpenDrawer(openDrawer === 'voice' ? null : 'voice')}
              title="Voice profile + drift monitor"
            />
            <CompactButton
              icon={FileText} label="Import"
              active={openDrawer === 'import'}
              onClick={() => setOpenDrawer(openDrawer === 'import' ? null : 'import')}
              title="Import manuscript"
            />
            <div style={{ flex: 1 }} />
            <div
              style={{
                fontFamily: t.mono, fontSize: 9, color: t.ink3,
                letterSpacing: 0.18, textTransform: 'uppercase',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
              title="Pane split"
            >
              <Gauge size={10} /> {Math.round(splitRatio * 100)} / {Math.round((1 - splitRatio) * 100)}
            </div>
          </div>

          {/* Bottom pane: editor. */}
          <div
            style={{
              flex: stacked ? 'none' : 1,
              height: stacked ? bottomHeight : 'auto',
              minHeight: 160,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              background: t.bg,
            }}
          >
            <VersionSlider
              bookId={bookTab}
              chapterId={currentChapter}
              worldState={worldState}
              setWorldState={setWorldState}
            />
            <VoiceDriftBanner
              worldState={worldState}
              bookTab={bookTab}
              currentChapter={currentChapter}
            />
            <div
              ref={editorHostRef}
              className="lw-writer-surface lw-z-editor"
              style={{
                flex: 1, minHeight: 0,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ flex: 1, overflow: 'auto' }}>
                <WritingCanvasPro onNavigate={onNavigate} onSave={() => {}} />
              </div>
              <SelectionRewriteMenu scopeSelector=".lw-writer-surface" />
              <InlineSuggestions scopeSelector=".lw-writer-surface" worldState={worldState} />
              <WriterSeekRegistrar scopeSelector=".lw-writer-surface" />
            </div>
          </div>
        </div>
      )}

      <FocusExitChip visible={focusMode} onExit={() => setFocusMode(false)} />

      {/* Drawers */}
      <Drawer
        open={openDrawer === 'language-full'}
        onClose={() => setOpenDrawer(null)}
        title="Language workbench"
        width={780}
      >
        <LanguageWorkbench scoped worldState={worldState} />
      </Drawer>

      <Drawer
        open={openDrawer === 'interview'}
        onClose={() => setOpenDrawer(null)}
        title="Interview mode"
        width={720}
      >
        <InterviewMode scoped worldState={worldState} setWorldState={setWorldState} />
      </Drawer>

      <Drawer
        open={openDrawer === 'reader'}
        onClose={() => setOpenDrawer(null)}
        title="Speed reader"
        width={820}
      >
        <SpeedReader worldState={worldState} onClose={() => setOpenDrawer(null)} />
      </Drawer>

      <Drawer
        open={openDrawer === 'import'}
        onClose={() => setOpenDrawer(null)}
        title="Import manuscript"
        width={820}
      >
        <ManuscriptImportDrawer
          worldState={worldState}
          setWorldState={setWorldState}
          onClose={() => setOpenDrawer(null)}
        />
      </Drawer>

      <Drawer
        open={openDrawer === 'voice'}
        onClose={() => setOpenDrawer(null)}
        title="Voice profile"
        width={540}
      >
        <VoicePanel worldState={worldState} />
      </Drawer>
    </Page>
  );
}

function VoicePanel({ worldState }) {
  const t = useTheme();
  const voice = worldState?.voiceProfile || null;
  const drift = worldState?.voiceDrift || null;
  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color: t.accent,
          letterSpacing: 0.18, textTransform: 'uppercase', marginBottom: 8,
        }}
      >
        Your voice
      </div>
      {!voice ? (
        <div style={{ color: t.ink2, fontSize: 13 }}>
          Voice profile not sampled yet. Open Settings &rarr; Voice &amp; Tone to
          capture a baseline.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(voice).slice(0, 6).map(([k, v]) => (
            <div
              key={k}
              style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 10px',
                background: t.paper, border: `1px solid ${t.rule}`,
                borderRadius: t.radius, fontSize: 12, color: t.ink,
              }}
            >
              <span style={{ color: t.ink2 }}>{k}</span>
              <span>{typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
            </div>
          ))}
          {drift && (
            <div
              style={{
                padding: 10,
                background: t.bg, border: `1px dashed ${t.rule}`,
                borderRadius: t.radius, color: t.ink2, fontSize: 12,
              }}
            >
              Current drift: <strong style={{ color: t.ink }}>{(drift.score || 0).toFixed(2)}</strong>
              {drift.flavour && <span> &middot; {drift.flavour}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

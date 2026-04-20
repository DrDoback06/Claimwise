/**
 * Write — Loomwright Writer's Room, unified.
 *
 * One surface that folds in every old Claimwise "writing-adjacent" tool:
 *
 *   centre:     WritingCanvasPro (chapter editor)
 *   right rail: Canon Weaver (live, not a drawer)
 *   bottom:     Story Analysis strip (threads / consistency / beats, collapsible)
 *   top bar:    Sprint timer · Focus · Read mode · Language · Interview · Import
 *   floating:   SelectionRewriteMenu (inline rewrite on text selection)
 *
 * Only the least-used tools (Interview, Import manuscript, Speed Reader)
 * still slide in as drawers because their internals haven't been restructured
 * to inline panels yet; each now uses the `scoped` LoomwrightShell so the
 * theme toggle flows through.
 *
 * Deep-link / PWA share-target support: if the parent sets `captureOnMount`,
 * CanonWeaver jumps directly into capture stage with focus.
 */

import React, { useState, useRef } from 'react';
import {
  AlignLeft, MessageSquare, Eye, Feather, PanelRight, PanelBottom, X,
  FileText, Focus, Zap,
} from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import useIsMobile from '../loomwright/useIsMobile';
import { Page, PageHeader } from './_shared/PageChrome';
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
import InlineSquiggles from './write/InlineSquiggles';
import VoiceDriftBanner from './write/VoiceDriftBanner';
import WriterSeekRegistrar from './write/WriterSeekRegistrar';

function ToolbarButton({ icon: Icon, label, active, onClick, title, hotkey }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      title={hotkey ? `${title || label} (${hotkey})` : title || label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: active ? t.accentSoft : 'transparent',
        color: active ? t.ink : t.ink2,
        border: `1px solid ${active ? t.accent : t.rule}`,
        borderRadius: t.radius,
        cursor: 'pointer',
        fontFamily: t.mono,
        fontSize: 10,
        letterSpacing: 0.12,
        textTransform: 'uppercase',
      }}
    >
      <Icon size={12} /> {label}
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
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60 }}
      />
      <aside
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width,
          background: t.bg,
          borderLeft: `1px solid ${t.rule}`,
          zIndex: 61,
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
  const [showWeaver, setShowWeaver] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(null);
  // openDrawer: null | 'interview' | 'reader' | 'import' | 'language-full' | 'weaver'
  const editorHostRef = useRef(null);

  // On narrow screens the editor + rail stack; the Weaver rail becomes a
  // bottom-sheet drawer triggered by a FAB so the editor gets the full width.
  const weaverAsDrawer = isMobile;

  const onPatchWorldState = (patch) => {
    setWorldState?.((prev) => ({
      ...prev,
      itemBank: patch.itemBank || prev.itemBank,
      actors: patch.actors || prev.actors,
      books: patch.books || prev.books,
      plotThreads: patch.plotThreads || prev.plotThreads,
    }));
  };

  return (
    <Page>
      {!focusMode && (
        <PageHeader
          eyebrow="Write"
          title="Writer's Room"
          subtitle="Draft chapters with Canon Weaver live, the Language workbench inline, and story analysis at the bottom of the page."
          actions={
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <WriterSprintTimer />
              <ToolbarButton
                icon={Focus}
                label={focusMode ? 'Exit focus' : 'Focus'}
                active={focusMode}
                onClick={() => setFocusMode((v) => !v)}
                title="Fade all chrome and pin the current paragraph to eye line"
              />
              <ToolbarButton
                icon={Eye}
                label="Read"
                active={openDrawer === 'reader'}
                onClick={() => setOpenDrawer(openDrawer === 'reader' ? null : 'reader')}
                title="Speed reader takeover of the current chapter"
                hotkey="Ctrl+Shift+R"
              />
              <ToolbarButton
                icon={Feather}
                label="Language"
                active={openDrawer === 'language-full'}
                onClick={() => setOpenDrawer(openDrawer === 'language-full' ? null : 'language-full')}
                title="Grammar, rewrite, readability and thesaurus"
                hotkey="Ctrl+Shift+L"
              />
              <ToolbarButton
                icon={MessageSquare}
                label="Interview"
                active={openDrawer === 'interview'}
                onClick={() => setOpenDrawer(openDrawer === 'interview' ? null : 'interview')}
                title="Chat with a character in voice; turn any line into a scene seed"
                hotkey="Ctrl+Shift+I"
              />
              <ToolbarButton
                icon={FileText}
                label="Import"
                active={openDrawer === 'import'}
                onClick={() => setOpenDrawer(openDrawer === 'import' ? null : 'import')}
                title="Import an existing manuscript and let Canon Weaver propose edits"
              />
              <ToolbarButton
                icon={AlignLeft}
                label={showAnalysis ? 'Hide analysis' : 'Story analysis'}
                active={showAnalysis}
                onClick={() => setShowAnalysis((v) => !v)}
                title="Show/hide the bottom story-analysis strip"
              />
              <ToolbarButton
                icon={PanelRight}
                label={showWeaver ? 'Hide Weaver' : 'Show Weaver'}
                active={showWeaver}
                onClick={() => setShowWeaver((v) => !v)}
                title="Toggle the Canon Weaver rail"
              />
            </div>
          }
        />
      )}

      <div style={{ flex: 1, display: 'flex', minHeight: 0, background: t.bg }}>
        {/* Editor + Weaver column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          {!focusMode && (
            <>
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
            </>
          )}
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* Editor pane */}
            <div
              ref={editorHostRef}
              className={`lw-writer-surface${focusMode ? ' lw-writer-focus' : ''}`}
              style={{
                flex: 1, minWidth: 0,
                borderRight: showWeaver && !focusMode ? `1px solid ${t.rule}` : 'none',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: focusMode ? t.paper : 'transparent',
                padding: focusMode ? '0 8vw' : 0,
                transition: 'padding 180ms ease, background 180ms ease',
              }}
            >
              <div style={{ flex: 1, overflow: 'auto' }}>
                <WritingCanvasPro
                  onNavigate={onNavigate}
                  onSave={() => { /* WritingCanvasPro persists internally via db */ }}
                />
              </div>
              <SelectionRewriteMenu scopeSelector=".lw-writer-surface" />
              <InlineSquiggles scopeSelector=".lw-writer-surface" worldState={worldState} />
              <WriterSeekRegistrar scopeSelector=".lw-writer-surface" />
            </div>

            {/* Canon Weaver rail (desktop/tablet only \u2014 drawer on mobile) */}
            {showWeaver && !focusMode && !weaverAsDrawer && (
              <aside
                style={{
                  width: 420,
                  flexShrink: 0,
                  background: t.sidebar,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    borderBottom: `1px solid ${t.rule}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Zap size={13} color={t.accent} />
                  <div
                    style={{
                      fontFamily: t.mono,
                      fontSize: 10,
                      color: t.accent,
                      letterSpacing: 0.18,
                      textTransform: 'uppercase',
                    }}
                  >
                    Canon Weaver
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', background: t.bg }}>
                  <CanonWeaver
                    scoped
                    worldState={worldState}
                    setWorldState={setWorldState}
                    onPatchWorldState={onPatchWorldState}
                    captureOnMount={captureOnMount}
                    initialIdea={initialWeaveIdea}
                    onCaptureConsumed={onCaptureConsumed}
                  />
                </div>
              </aside>
            )}
          </div>

          {/* Bottom Story Analysis strip — replaces the legacy drawer */}
          {showAnalysis && !focusMode && (
            <div
              style={{
                flex: '0 0 auto',
                height: 280,
                borderTop: `1px solid ${t.rule}`,
                background: t.paper,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '8px 16px',
                  borderBottom: `1px solid ${t.rule}`,
                  background: t.sidebar,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <PanelBottom size={12} color={t.accent} />
                <div
                  style={{
                    fontFamily: t.mono,
                    fontSize: 10,
                    color: t.accent,
                    letterSpacing: 0.18,
                    textTransform: 'uppercase',
                  }}
                >
                  Story analysis
                </div>
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => setShowAnalysis(false)}
                  style={{
                    padding: 4,
                    background: 'transparent',
                    color: t.ink2,
                    border: `1px solid ${t.rule}`,
                    borderRadius: t.radius,
                    cursor: 'pointer',
                  }}
                  title="Hide"
                >
                  <X size={12} />
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <StoryAnalysisDrawer
                  worldState={worldState}
                  onJumpToChapter={() => { /* handled via chapterNavigationService */ }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Capture FAB + Weaver drawer */}
      {weaverAsDrawer && !focusMode && (
        <>
          <button
            type="button"
            onClick={() => setOpenDrawer('weaver')}
            title="Open Canon Weaver"
            style={{
              position: 'fixed',
              right: 16,
              bottom: 16,
              width: 48,
              height: 48,
              borderRadius: 24,
              background: t.accent,
              color: t.onAccent,
              border: `1px solid ${t.accent}`,
              boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
              display: 'grid', placeItems: 'center',
              cursor: 'pointer',
              zIndex: 30,
            }}
          >
            <Zap size={18} />
          </button>
          <Drawer
            open={openDrawer === 'weaver'}
            onClose={() => setOpenDrawer(null)}
            title="Canon Weaver"
            width={Math.min(420, (typeof window !== 'undefined' ? window.innerWidth : 420) - 16)}
          >
            <CanonWeaver
              scoped
              worldState={worldState}
              setWorldState={setWorldState}
              onPatchWorldState={onPatchWorldState}
              captureOnMount={captureOnMount}
              initialIdea={initialWeaveIdea}
              onCaptureConsumed={onCaptureConsumed}
            />
          </Drawer>
        </>
      )}

      {/* Remaining drawers \u2014 used for tools that still own their own shell */}
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
    </Page>
  );
}

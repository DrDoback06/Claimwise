/**
 * Write — the Loomwright writing surface.
 *
 * Layout:
 *   centre:  WritingCanvasPro (the long-form chapter editor)
 *   right:   Canon Weaver rail (idea capture, change proposals, manuscript import)
 *   toolbar: buttons for Story Analysis, Language Workbench, Interview Mode, Speed Reader
 *
 * Each secondary tool opens as an overlay drawer so the editor always stays
 * available underneath. This is the single tab that absorbs Writer's Room +
 * Canon Weaver + Manuscript Intelligence + Language Workbench + Consistency
 * Checker + Story Analysis Hub + Interview Mode + Speed Reader.
 */

import React, { useState } from 'react';
import {
  AlignLeft, Zap, MessageSquare, Eye, Feather, PanelRight, X, FileText,
} from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader } from './_shared/PageChrome';
import WritingCanvasPro from '../components/WritingCanvasPro';
import CanonWeaver from '../loomwright/weaver/CanonWeaver';
import LanguageWorkbench from '../loomwright/language/LanguageWorkbench';
import InterviewMode from '../loomwright/interview/InterviewMode';
import SpeedReader from '../components/SpeedReader';
import StoryAnalysisDrawer from './write/StoryAnalysisDrawer';
import ManuscriptImportDrawer from './write/ManuscriptImportDrawer';

function ToolbarButton({ icon: Icon, label, active, onClick, title }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
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
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60,
        }}
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

export default function WritePage({ worldState, setWorldState, onNavigate }) {
  const t = useTheme();
  const [showWeaver, setShowWeaver] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(null);
  // openDrawer: null | 'analysis' | 'language' | 'interview' | 'reader' | 'import'

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
      <PageHeader
        eyebrow="Write"
        title="Writer's Room"
        subtitle="Draft chapters with Canon Weaver, the language workbench and cross-story analysis at hand."
        actions={
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <ToolbarButton
              icon={FileText}
              label="Import"
              active={openDrawer === 'import'}
              onClick={() => setOpenDrawer(openDrawer === 'import' ? null : 'import')}
              title="Import an existing manuscript into Canon Weaver proposals"
            />
            <ToolbarButton
              icon={AlignLeft}
              label="Story analysis"
              active={openDrawer === 'analysis'}
              onClick={() => setOpenDrawer(openDrawer === 'analysis' ? null : 'analysis')}
              title="Run consistency and structural analysis across all chapters"
            />
            <ToolbarButton
              icon={Feather}
              label="Language"
              active={openDrawer === 'language'}
              onClick={() => setOpenDrawer(openDrawer === 'language' ? null : 'language')}
              title="Grammar, rewrite and readability metrics"
            />
            <ToolbarButton
              icon={MessageSquare}
              label="Interview"
              active={openDrawer === 'interview'}
              onClick={() => setOpenDrawer(openDrawer === 'interview' ? null : 'interview')}
              title="Chat with your characters for dialogue drafts"
            />
            <ToolbarButton
              icon={Eye}
              label="Speed reader"
              active={openDrawer === 'reader'}
              onClick={() => setOpenDrawer(openDrawer === 'reader' ? null : 'reader')}
              title="Fast read through a chapter"
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

      <div style={{ flex: 1, display: 'flex', minHeight: 0, background: t.bg }}>
        {/* Editor pane */}
        <div
          style={{
            flex: 1, minWidth: 0,
            borderRight: showWeaver ? `1px solid ${t.rule}` : 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, overflow: 'auto' }}>
            <WritingCanvasPro
              onNavigate={onNavigate}
              onSave={() => { /* WritingCanvasPro persists internally via db */ }}
            />
          </div>
        </div>

        {/* Canon Weaver rail */}
        {showWeaver && (
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
                worldState={worldState}
                setWorldState={setWorldState}
                onPatchWorldState={onPatchWorldState}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Drawers */}
      <Drawer
        open={openDrawer === 'analysis'}
        onClose={() => setOpenDrawer(null)}
        title="Story analysis"
        width={720}
      >
        <StoryAnalysisDrawer
          worldState={worldState}
          onJumpToChapter={(bookId, chapterId) => {
            setOpenDrawer(null);
            onNavigate?.('write');
          }}
        />
      </Drawer>

      <Drawer
        open={openDrawer === 'language'}
        onClose={() => setOpenDrawer(null)}
        title="Language workbench"
        width={780}
      >
        <LanguageWorkbench worldState={worldState} />
      </Drawer>

      <Drawer
        open={openDrawer === 'interview'}
        onClose={() => setOpenDrawer(null)}
        title="Interview mode"
        width={720}
      >
        <InterviewMode worldState={worldState} setWorldState={setWorldState} />
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
        <ManuscriptImportDrawer worldState={worldState} setWorldState={setWorldState} onClose={() => setOpenDrawer(null)} />
      </Drawer>
    </Page>
  );
}

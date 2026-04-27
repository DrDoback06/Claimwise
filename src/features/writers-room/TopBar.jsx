// Loomwright — TopBar with chapter scrubber (plan §6).

import React from 'react';
import { useTheme } from './theme';
import { useStore } from './store';
import Icon from './entities/Icon';
import ReadAloud from './utilities/ReadAloud';
import SelectionPill from './selection/SelectionPill';
import ChapterStrip from './primitives/ChapterStrip';
import { AuthorChip } from './authors/AuthorsPanel';
import ProjectSwitcher from './projects/ProjectSwitcher';

export default function TopBar({ onOpenPalette, onToggleFocus, focusMode, onOpenSettings, onOpenBible, onOpenHistory, onOpenProof, onOpenAid }) {
  const t = useTheme();
  const store = useStore();
  const { book } = store;
  const suggestionsOpen = !!store.ui?.suggestionsOpen;
  const reviewQueue = store.reviewQueue || [];
  const runningJobs = store.autonomousJobs || [];

  const order = book?.chapterOrder || [];
  const activeId = store.ui?.activeChapterId || book?.currentChapterId;
  const activeIdx = order.indexOf(activeId);
  const activeCh = activeId ? store.chapters?.[activeId] : null;

  // Save indicator — reflects the most recent edit + persistence cycle.
  // The store auto-persists 400ms after a change; we show "Saving…" while
  // a recent edit is within that window, otherwise "Saved · 2m ago".
  const lastEdit = activeCh?.lastEdit || 0;
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const sinceEdit = now - lastEdit;
  const saving = lastEdit > 0 && sinceEdit < 800;
  const saveLabel = !lastEdit ? '—'
    : saving ? 'Saving…'
    : 'Saved ' + relTime(sinceEdit);

  const jump = (idx) => {
    const id = order[idx];
    if (!id) return;
    store.setPath('ui.activeChapterId', id);
    store.setPath('book.currentChapterId', id);
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target?.matches('input, textarea, [contenteditable="true"]')) return;
      if (e.key === '[') jump(Math.max(0, activeIdx - 1));
      if (e.key === ']') jump(Math.min(order.length - 1, activeIdx + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIdx, order.length]);

  // Single source-of-truth for the right-side toolbar so we can render it
  // compactly without per-button styling drifting.
  const tools = [
    onOpenAid     && { id: 'aid',     icon: 'sparkle',  label: '✦', title: 'Writing aid (⌘\\)',         onClick: onOpenAid },
    {                  id: 'whisper', icon: null,       label: '✧', title: 'Suggestions drawer',
      active: suggestionsOpen, onClick: () => store.setPath('ui.suggestionsOpen', !suggestionsOpen) },
    {                  id: 'extract', icon: null,       label: '⌬', title: 'Run extraction on this chapter',
      onClick: () => window.dispatchEvent(new CustomEvent('lw:open-extraction')) },
    onOpenProof   && { id: 'proof',   icon: null,       label: '✓', title: "Proofreader (⌘')",          onClick: onOpenProof },
    onOpenHistory && { id: 'hist',    icon: 'book',     label: null, title: 'Version history',           onClick: onOpenHistory },
    onOpenBible   && { id: 'bible',   icon: 'building', label: null, title: 'Series bible',              onClick: onOpenBible },
    onOpenSettings && { id: 'settings', icon: 'cog',    label: null, title: 'Settings',                  onClick: onOpenSettings },
    {                  id: 'focus',   icon: 'focus',    label: null, title: 'Focus mode (F9)',
      active: focusMode, onClick: onToggleFocus },
  ].filter(Boolean);

  return (
    <header className="lw-topbar" style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap',
      padding: '6px 12px', borderBottom: `1px solid ${t.rule}`,
      background: t.paper, height: 48, minWidth: 0, overflow: 'hidden',
    }}>
      <ProjectSwitcher />
      {/* Left cluster — shrinkable, ellipsises when tight */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6,
        minWidth: 0, flex: '0 1 auto', overflow: 'hidden',
      }}>
        {book.series && (
          <span style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>{book.series}</span>
        )}
        <span style={{
          fontFamily: t.display, fontSize: 15, color: t.ink, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220,
        }}>{book.title || 'Untitled'}</span>
        {activeCh && <span style={{
          fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.1, whiteSpace: 'nowrap',
        }}>· ch.{activeCh.n}</span>}
      </div>

      {/* Middle scrubber — flex-grows, but allowed to shrink. The strip
          itself scrolls horizontally so any chapter count fits. */}
      <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
        <ChapterStrip mode="jump" />
      </div>

      {/* Selection pill — always rightmost-content. */}
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <AuthorChip onClickSettings={onOpenSettings} />
        <SelectionPill />
        {runningJobs.length > 0 && (
          <span title={`Pipeline running: ${runningJobs.map(j => j.label).join(' · ')}`}
            style={{
              padding: '2px 8px', borderRadius: 999,
              background: t.warn, color: t.onAccent,
              fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
              textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>⟲ {runningJobs.map(j => j.label).join('·')}</span>
        )}
        {!runningJobs.length && reviewQueue.length > 0 && (
          <button
            title={`${reviewQueue.length} item${reviewQueue.length === 1 ? '' : 's'} from the autonomous pipeline. Click to clear.`}
            onClick={() => {
              if (window.confirm(`Clear ${reviewQueue.length} review item${reviewQueue.length === 1 ? '' : 's'}?`)) {
                store.setSlice('reviewQueue', []);
              }
            }}
            style={{
              padding: '2px 8px', borderRadius: 999,
              background: t.sugg || t.paper2,
              color: t.suggInk || t.accent,
              border: `1px solid ${t.suggInk || t.accent}55`,
              fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
              textTransform: 'uppercase', whiteSpace: 'nowrap', cursor: 'pointer',
            }}>✦ {reviewQueue.length} review ×</button>
        )}
      </div>

      {/* Compact "Ask the Loom" command palette button. */}
      <button onClick={onOpenPalette} title="Ask the Loom (⌘K)" style={{
        flex: '0 0 auto',
        padding: '4px 8px', background: 'transparent',
        border: `1px solid ${t.rule}`, borderRadius: 14,
        fontFamily: t.display, fontSize: 11, color: t.ink3,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
        whiteSpace: 'nowrap',
      }}>
        <Icon name="search" size={11} color={t.ink3} />
        <span>⌘K</span>
      </button>

      <ReadAloud />

      {/* Right toolbar — uniform 28×28 icon buttons that never wrap. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, flex: '0 0 auto',
      }}>
        {tools.map(tool => (
          <button key={tool.id} title={tool.title} onClick={tool.onClick} style={{
            width: 28, height: 28, padding: 0, borderRadius: 4,
            background: tool.active ? (t.sugg || t.paper2) : 'transparent',
            color: tool.active ? (t.suggInk || t.accent) : t.ink2,
            border: `1px solid ${tool.active ? (t.suggInk || t.accent) : 'transparent'}`,
            cursor: 'pointer',
            display: 'grid', placeItems: 'center',
            fontFamily: t.mono, fontSize: 13, lineHeight: 1,
          }}>
            {tool.icon
              ? <Icon name={tool.icon} size={14} color={tool.active ? (t.suggInk || t.accent) : t.ink2} />
              : <span>{tool.label}</span>}
          </button>
        ))}
      </div>

      {/* Save indicator — clickable, opens version history. */}
      <button
        onClick={onOpenHistory}
        title="Click to view version history"
        style={{
          padding: '2px 8px', borderRadius: 999,
          background: 'transparent',
          color: saving ? (t.warn || '#d80') : t.ink3,
          border: `1px solid ${t.rule}`,
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
          whiteSpace: 'nowrap', flex: '0 0 auto', cursor: 'pointer',
        }}>
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: 999,
          background: saving ? (t.warn || '#d80') : (t.good || '#2a8'),
          marginRight: 6, verticalAlign: 1,
        }} />
        {saveLabel}
      </button>

      {/* Word counter — drops out at narrow widths via overflow hidden on header. */}
      <span style={{
        fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12,
        whiteSpace: 'nowrap', flex: '0 0 auto',
      }}>{book.wordsToday || 0}/{book.target || 0}·{book.streak || 0}🔥</span>
    </header>
  );
}

function relTime(ms) {
  if (ms < 60_000) return 'just now';
  if (ms < 3600_000) return Math.round(ms / 60_000) + 'm ago';
  if (ms < 86_400_000) return Math.round(ms / 3600_000) + 'h ago';
  return Math.round(ms / 86_400_000) + 'd ago';
}


// Loomwright — TopBar (plan §6).
// Chapter scrubber lives below this row in its own band so the writer
// always has a static toolbar regardless of viewport. On narrow widths
// the right-hand action cluster collapses into a single ⋯ dropdown so
// every tool stays reachable instead of overflowing off-screen.

import React from 'react';
import { useTheme } from './theme';
import { useStore } from './store';
import Icon from './entities/Icon';
import ReadAloud from './utilities/ReadAloud';
import SelectionPill from './selection/SelectionPill';
import { AuthorChip } from './authors/AuthorsPanel';
import ProjectSwitcher from './projects/ProjectSwitcher';
import SaveButton from './SaveButton';
import useViewport from './utilities/useViewport';

export default function TopBar({ onOpenPalette, onToggleFocus, focusMode, onOpenSettings, onOpenBible, onOpenHistory, onOpenAid }) {
  const t = useTheme();
  const store = useStore();
  const { book } = store;
  const { mobile, narrow } = useViewport();
  const suggestionsOpen = !!store.ui?.suggestionsOpen;
  const reviewQueue = store.reviewQueue || [];
  const runningJobs = store.autonomousJobs || [];

  const order = book?.chapterOrder || [];
  const activeId = store.ui?.activeChapterId || book?.currentChapterId;
  const activeIdx = order.indexOf(activeId);
  const activeCh = activeId ? store.chapters?.[activeId] : null;

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

  // Single source-of-truth for the right-side toolbar so the desktop
  // bar and the mobile dropdown render the same set.
  const tools = [
    onOpenAid     && { id: 'aid',     icon: 'sparkle',  label: '✦', title: 'Writing aid (⌘\\)',         onClick: onOpenAid },
    {                  id: 'whisper', icon: null,       label: '✧', title: 'Suggestions drawer',
      active: suggestionsOpen, onClick: () => store.setPath('ui.suggestionsOpen', !suggestionsOpen) },
    {                  id: 'extract', icon: null,       label: '⌬', title: 'Run extraction on this chapter',
      onClick: () => window.dispatchEvent(new CustomEvent('lw:open-extraction')) },
    onOpenHistory && { id: 'hist',    icon: 'book',     label: null, title: 'Version history',           onClick: onOpenHistory },
    onOpenBible   && { id: 'bible',   icon: 'building', label: null, title: 'Series bible',              onClick: onOpenBible },
    onOpenSettings && { id: 'settings', icon: 'cog',    label: null, title: 'Settings',                  onClick: onOpenSettings },
    {                  id: 'focus',   icon: 'focus',    label: null, title: 'Focus mode (F9)',
      active: focusMode, onClick: onToggleFocus },
  ].filter(Boolean);

  return (
    <header className="lw-topbar" style={{
      display: 'flex', alignItems: 'center', gap: mobile ? 6 : 10, flexWrap: 'nowrap',
      padding: mobile ? '4px 8px' : '6px 12px', borderBottom: `1px solid ${t.rule}`,
      background: t.paper, height: 48, minWidth: 0, overflow: 'visible',
    }}>
      <ProjectSwitcher />
      {/* Left cluster — title + chapter number. Drops the series eyebrow
          on narrow widths to leave room for tools. */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6,
        minWidth: 0, flex: '1 1 auto', overflow: 'hidden',
      }}>
        {!narrow && book.series && (
          <span style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>{book.series}</span>
        )}
        <span style={{
          fontFamily: t.display, fontSize: mobile ? 14 : 15, color: t.ink, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: mobile ? 140 : 220,
        }}>{book.title || 'Untitled'}</span>
        {activeCh && <span style={{
          fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.1, whiteSpace: 'nowrap',
        }}>· ch.{activeCh.n}</span>}
      </div>

      {/* Selection pill cluster — kept compact on mobile. */}
      {!mobile && (
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AuthorChip onClickSettings={onOpenSettings} />
          <SelectionPill />
        </div>
      )}

      {/* Pipeline / review-queue indicator — visible everywhere because
          the writer needs to know the AI is doing something. */}
      {(runningJobs.length > 0 || reviewQueue.length > 0) && (
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
          {runningJobs.length > 0 && (
            <span title={`Pipeline running: ${runningJobs.map(j => j.label).join(' · ')}`}
              style={{
                padding: '2px 8px', borderRadius: 999,
                background: t.warn, color: t.onAccent,
                fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
                textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>⟲ {[...new Set(runningJobs.map(j => j.label))].join('·')}{runningJobs.length > 1 ? ` (${runningJobs.length})` : ''}</span>
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
              }}>✦ {reviewQueue.length}{mobile ? '' : ' review ×'}</button>
          )}
        </div>
      )}

      {/* "Ask the Loom" — collapses to icon-only on narrow. */}
      <button onClick={onOpenPalette} title="Ask the Loom (⌘K)" style={{
        flex: '0 0 auto',
        padding: mobile ? 6 : '4px 8px', background: 'transparent',
        border: `1px solid ${t.rule}`, borderRadius: 14,
        fontFamily: t.display, fontSize: 11, color: t.ink3,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
        whiteSpace: 'nowrap',
      }}>
        <Icon name="search" size={12} color={t.ink3} />
        {!mobile && <span>⌘K</span>}
      </button>

      {!mobile && <ReadAloud />}

      {/* Right toolbar — uniform 28×28 icon buttons on desktop; collapses
          into a single ⋯ dropdown on mobile so nothing falls off the edge. */}
      {mobile ? (
        <ToolDropdown tools={tools} t={t} />
      ) : (
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
      )}

      <SaveButton />

      {!mobile && (
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
      )}

      {!narrow && (
        <span style={{
          fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12,
          whiteSpace: 'nowrap', flex: '0 0 auto',
        }}>{book.wordsToday || 0}/{book.target || 0}·{book.streak || 0}🔥</span>
      )}
    </header>
  );
}

// Compact dropdown that mirrors the right-hand toolbar on mobile. Each
// entry keeps its icon so visual recognition is preserved — the writer
// just taps to expand instead of fishing across an overflow row.
function ToolDropdown({ tools, t }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  const anyActive = tools.some(x => x.active);

  return (
    <div ref={ref} style={{ position: 'relative', flex: '0 0 auto' }}>
      <button
        title="Tools"
        onClick={() => setOpen(o => !o)}
        style={{
          width: 32, height: 32, padding: 0, borderRadius: 4,
          background: anyActive ? (t.sugg || t.paper2) : 'transparent',
          color: anyActive ? (t.suggInk || t.accent) : t.ink2,
          border: `1px solid ${t.rule}`,
          cursor: 'pointer',
          display: 'grid', placeItems: 'center',
          fontFamily: t.mono, fontSize: 16, lineHeight: 1,
        }}>⋯</button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          background: t.paper, border: `1px solid ${t.rule}`,
          borderRadius: 4, boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
          zIndex: 3000, minWidth: 200, padding: 4,
        }}>
          {tools.map(tool => (
            <button key={tool.id}
              onClick={() => { tool.onClick?.(); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 12px', textAlign: 'left',
                background: tool.active ? (t.sugg || t.paper2) : 'transparent',
                color: tool.active ? (t.suggInk || t.accent) : t.ink,
                border: 'none', borderRadius: 3,
                cursor: 'pointer',
                fontFamily: t.display, fontSize: 13,
              }}>
              <span style={{
                width: 22, display: 'grid', placeItems: 'center',
                fontFamily: t.mono, fontSize: 13,
              }}>
                {tool.icon
                  ? <Icon name={tool.icon} size={14} color={tool.active ? (t.suggInk || t.accent) : t.ink2} />
                  : <span>{tool.label}</span>}
              </span>
              <span style={{ flex: 1 }}>{tool.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function relTime(ms) {
  if (ms < 60_000) return 'just now';
  if (ms < 3600_000) return Math.round(ms / 60_000) + 'm ago';
  if (ms < 86_400_000) return Math.round(ms / 3600_000) + 'h ago';
  return Math.round(ms / 86_400_000) + 'd ago';
}

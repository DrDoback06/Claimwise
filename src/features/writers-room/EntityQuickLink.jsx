// Loomwright — Entity quick-link popover.
//
// Renders a small wiki-style preview anchored to a clicked entity span in
// prose. Pulls live data from the store (so it reflects whatever the
// extractor has surfaced) and gives the writer two ways to drill in:
//
//   • "Open dossier →" jumps the cursor to the right panel + scrolls to
//     the entity's row + auto-expands the dossier.
//   • "Highlight all" briefly flashes every other instance of the entity
//     in the current chapter so the writer can scan continuity.

import React from 'react';
import { createPortal } from 'react-dom';
import { useTheme, PANEL_ACCENT } from './theme';
import { useStore } from './store';
import { panelForKind } from './prose/highlights';

const POPOVER_W = 320;
const POPOVER_OFFSET = 8;

function findEntity(store, kind, id) {
  const map = {
    character: store.cast,
    place: store.places,
    item: store.items,
    skill: store.skills,
    quest: store.quests,
    faction: store.factions,
  };
  const arr = map[kind] || [];
  return arr.find(x => x.id === id) || null;
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Count how many chapters mention this entity, plus first / last appearance.
// Sourced from entityMentions where present, otherwise scans chapter text
// for the name. Cheap enough for a 20-chapter manuscript.
function mentionStats(store, entity, kind) {
  if (!entity) return null;
  const mentions = (store.entityMentions || []).filter(m =>
    (m.entityId === entity.id) ||
    (m.entityId == null && (m.name || '').toLowerCase() === (entity.name || '').toLowerCase())
  );
  if (mentions.length) {
    const chapters = new Set(mentions.map(m => m.chapterId).filter(Boolean));
    const order = store.book?.chapterOrder || [];
    const inOrder = [...chapters].map(id => order.indexOf(id)).filter(i => i >= 0).sort((a, b) => a - b);
    const firstChId = inOrder.length ? order[inOrder[0]] : null;
    const lastChId = inOrder.length ? order[inOrder[inOrder.length - 1]] : null;
    return {
      total: mentions.length,
      chapterCount: chapters.size,
      firstChapter: firstChId ? store.chapters?.[firstChId] : null,
      lastChapter: lastChId ? store.chapters?.[lastChId] : null,
    };
  }
  // Fallback: scan chapter text for the name.
  const name = (entity.name || '').toLowerCase();
  if (!name) return { total: 0, chapterCount: 0, firstChapter: null, lastChapter: null };
  const order = store.book?.chapterOrder || [];
  let total = 0; let first = null; let last = null;
  for (const chId of order) {
    const ch = store.chapters?.[chId];
    if (!ch?.text) continue;
    const hits = (ch.text.toLowerCase().match(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'g')) || []).length;
    if (hits > 0) {
      total += hits;
      if (!first) first = ch;
      last = ch;
    }
  }
  const chapterCount = (first ? 1 : 0) + (last && last !== first ? 1 : 0);
  return { total, chapterCount, firstChapter: first, lastChapter: last };
}

function describeEntity(entity, kind) {
  if (!entity) return '';
  if (kind === 'character') return entity.oneliner || entity.dossier?.bio || (entity.role || 'support');
  if (kind === 'place')     return entity.description || entity.kind || '';
  if (kind === 'item')      return entity.description || entity.kind || '';
  if (kind === 'skill')     return entity.description || entity.tier || '';
  if (kind === 'quest')     return entity.description || entity.kind || '';
  if (kind === 'faction')   return entity.description || (entity.type || '');
  return '';
}

function colorFor(entity, kind) {
  if (kind === 'character') return entity?.color || PANEL_ACCENT.cast;
  if (kind === 'place')     return PANEL_ACCENT.atlas;
  if (kind === 'item')      return PANEL_ACCENT.items;
  if (kind === 'skill')     return PANEL_ACCENT.tangle;
  if (kind === 'quest')     return entity?.color || PANEL_ACCENT.threads;
  if (kind === 'faction')   return PANEL_ACCENT.voice;
  return '#888';
}

export default function EntityQuickLink({ kind, id, anchorRect, onClose, onOpenDossier }) {
  const t = useTheme();
  const store = useStore();
  const ref = React.useRef(null);
  const entity = findEntity(store, kind, id);
  const stats = React.useMemo(
    () => mentionStats(store, entity, kind),
    [store.entityMentions, store.chapters, store.book?.chapterOrder, entity?.id, kind]
  );

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    const onDocClick = (e) => { if (!ref.current?.contains(e.target)) onClose?.(); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [onClose]);

  if (!entity || !anchorRect) return null;

  // Position: prefer below the anchor, flip above if no room.
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const spaceBelow = vh - anchorRect.bottom;
  const spaceAbove = anchorRect.top;
  const placeBelow = spaceBelow > 220 || spaceBelow > spaceAbove;
  const top = placeBelow
    ? Math.min(anchorRect.bottom + POPOVER_OFFSET, vh - 240)
    : Math.max(anchorRect.top - POPOVER_OFFSET - 220, 8);
  const left = Math.min(Math.max(anchorRect.left, 8), vw - POPOVER_W - 8);

  const accent = colorFor(entity, kind);
  const description = describeEntity(entity, kind);
  const targetPanel = panelForKind(kind);

  const highlightAll = () => {
    window.dispatchEvent(new CustomEvent('lw:flash-entity', { detail: { kind, id } }));
    onClose?.();
  };

  const jumpToFirst = () => {
    const ch = stats?.firstChapter;
    if (!ch) return;
    store.setPath('ui.activeChapterId', ch.id);
    store.setPath('book.currentChapterId', ch.id);
    onClose?.();
  };

  // Stale flag: 4+ chapters since last mention.
  const order = store.book?.chapterOrder || [];
  const activeIdx = order.indexOf(store.ui?.activeChapterId || store.book?.currentChapterId);
  const lastIdx = stats?.lastChapter ? order.indexOf(stats.lastChapter.id) : -1;
  const stale = activeIdx >= 0 && lastIdx >= 0 && activeIdx - lastIdx >= 4;

  const node = (
    <div ref={ref} className="lw-entity-quicklink" style={{
      position: 'fixed', top, left, width: POPOVER_W, zIndex: 3000,
      background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 4,
      boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
      borderTop: `3px solid ${accent}`,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 12px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: t.mono, fontSize: 8, color: accent,
            letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 600,
          }}>{kind}</span>
          {stale && (
            <span style={{
              padding: '0 5px', fontFamily: t.mono, fontSize: 8,
              color: t.warn || '#d80', letterSpacing: 0.14, textTransform: 'uppercase',
              border: `1px solid ${t.warn || '#d80'}55`, borderRadius: 2,
            }}>last seen ch.{stats.lastChapter?.n}</span>
          )}
        </div>
        <div style={{
          fontFamily: t.display, fontSize: 17, color: t.ink, fontWeight: 500,
          marginTop: 2, lineHeight: 1.2,
        }}>{entity.name || entity.title || 'Unnamed'}</div>
      </div>

      <div style={{ padding: '0 12px 8px' }}>
        {description && (
          <div style={{
            fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.4,
            marginBottom: 8,
          }}>{description}</div>
        )}
        <div style={{
          display: 'flex', gap: 12, fontFamily: t.mono, fontSize: 9,
          color: t.ink3, letterSpacing: 0.12,
        }}>
          {stats && stats.total > 0 && (
            <span title="Total mentions across all chapters">
              {stats.total} mention{stats.total === 1 ? '' : 's'}
            </span>
          )}
          {stats && stats.chapterCount > 0 && (
            <span>· in {stats.chapterCount} chapter{stats.chapterCount === 1 ? '' : 's'}</span>
          )}
          {stats?.firstChapter && (
            <button onClick={jumpToFirst}
              title={`Jump to ${stats.firstChapter.title || `ch.${stats.firstChapter.n}`}`}
              style={linkBtn(t)}>
              ↑ first ch.{stats.firstChapter.n}
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 6, padding: '8px 12px',
        borderTop: `1px solid ${t.rule}`, background: t.paper2,
      }}>
        {targetPanel && (
          <button onClick={() => onOpenDossier?.(kind, id, targetPanel)} style={primaryBtn(t, accent)}>
            Open dossier →
          </button>
        )}
        <button onClick={highlightAll} style={ghostBtn(t)}>
          Highlight all
        </button>
        <span style={{ flex: 1 }} />
        <button onClick={onClose} style={ghostBtn(t)} title="Close (Esc)">×</button>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

function primaryBtn(t, accent) {
  return {
    flex: 1, padding: '5px 10px', cursor: 'pointer',
    background: accent, color: t.onAccent, border: 'none', borderRadius: 2,
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase', fontWeight: 600,
  };
}
function ghostBtn(t) {
  return {
    padding: '5px 10px', cursor: 'pointer',
    background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 2,
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}
function linkBtn(t) {
  return {
    padding: 0, background: 'transparent', color: t.accent, border: 'none',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, cursor: 'pointer',
    textDecoration: 'underline', textUnderlineOffset: '2px',
  };
}

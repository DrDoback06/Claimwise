// Loomwright — single review-queue card. Shared across cast/items/atlas/
// quests/skills review sections. Supports inline edit of draft, drag-to-
// merge, and the four lifecycle actions.

import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import {
  commitQueueItem, dismissQueueItem, editQueueItemDraft, mergeQueueItem,
} from './operations';
import RiskChip from './RiskChip';
import { riskBandFor } from '../ai/confidence';

const KIND_LABEL = {
  character: 'Character',
  place: 'Place',
  item: 'Item',
  quest: 'Quest',
  thread: 'Thread',
  fact: 'Fact',
  relationship: 'Relationship',
  skill: 'Skill',
  'quest-progress': 'Quest beat',
};

function eventTypeForItem(item) {
  if (item?.sourceType === 'item-change' && item.payload?.action) {
    const a = item.payload.action;
    if (a === 'destroyed') return 'item_destroyed';
    if (a === 'transferred' || a === 'lost') return 'item_transferred';
    return 'item_acquired';
  }
  return null;
}

export default function QueueCard({ item, accent, onCommit, selected, onToggleSelect }) {
  const t = useTheme();
  const store = useStore();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({
    name: item.draft?.name || item.name || '',
    notes: item.draft?.notes || item.notes || '',
  });

  const flushDraft = () => {
    if (draft.name !== (item.draft?.name || item.name) ||
        draft.notes !== (item.draft?.notes || item.notes)) {
      editQueueItemDraft(store, item.id, draft);
    }
  };

  const ch = item.chapterId ? store.chapters?.[item.chapterId] : null;
  const conf = Math.round((item.confidence || 0) * 100);
  const known = item.status === 'known' && item.resolvesTo;
  const resolved = known ? findEntity(store, item.kind, item.resolvesTo) : null;

  // Drag-to-merge: drop another queue item onto this one to nest.
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/x-lw-queue-item', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes('application/x-lw-queue-item')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };
  const onDrop = (e) => {
    const otherId = e.dataTransfer.getData('application/x-lw-queue-item');
    if (otherId && otherId !== item.id) {
      e.preventDefault();
      mergeQueueItem(store, otherId, { itemId: item.id });
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        border: `1px solid ${known ? t.warn || accent : t.rule}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 2,
        padding: '8px 10px',
        background: t.paper2,
        display: 'flex', flexDirection: 'column', gap: 6,
        cursor: 'grab',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {onToggleSelect && (
          <input type="checkbox" checked={!!selected}
            onChange={() => onToggleSelect(item.id)}
            onClick={e => e.stopPropagation()}
            style={{ cursor: 'pointer', flexShrink: 0 }} />
        )}
        <RiskChip band={riskBandFor({ confidence: item.confidence, eventType: eventTypeForItem(item) })} size="xs" />
        <span style={{
          padding: '1px 6px', background: accent, color: t.onAccent,
          fontFamily: t.mono, fontSize: 8, letterSpacing: 0.16, textTransform: 'uppercase',
          borderRadius: 1,
        }}>{KIND_LABEL[item.kind] || item.kind}</span>
        <input
          value={draft.name}
          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          onBlur={flushDraft}
          style={{
            flex: 1, minWidth: 0, padding: 0,
            fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500,
            background: 'transparent', border: 'none', outline: 'none',
          }} />
        <span style={{
          padding: '1px 5px', fontFamily: t.mono, fontSize: 9,
          color: conf >= 70 ? (t.good || '#1a8') : conf >= 40 ? t.ink2 : t.ink3,
          letterSpacing: 0.1, opacity: 0.85,
        }}>{conf}%</span>
      </div>

      {known && resolved && (
        <div style={{
          padding: '4px 8px', borderRadius: 1,
          background: t.paper, border: `1px dashed ${t.warn || accent}`,
          fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.1,
        }}>
          ↳ matches existing <b style={{ color: t.ink }}>{resolved.name}</b> — committing logs a chapter mention.
        </div>
      )}

      {ch && (
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12 }}>
          Chapter {ch.n || '?'}{ch.title ? ` · ${ch.title}` : ''}
        </div>
      )}

      <textarea
        rows={open ? 3 : 1}
        value={draft.notes}
        onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
        onFocus={() => setOpen(true)}
        onBlur={() => { setOpen(false); flushDraft(); }}
        placeholder="Notes / role / detail"
        style={{
          width: '100%', padding: '4px 6px', resize: 'vertical',
          fontFamily: t.display, fontSize: 12, color: t.ink2, lineHeight: 1.5,
          background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
        }} />

      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        <button onClick={() => { dismissQueueItem(store, item.id); }} style={btn(t)}>
          Dismiss
        </button>
        <button onClick={() => {
          flushDraft();
          const id = commitQueueItem(store, item.id);
          if (id && onCommit) onCommit(id);
        }} style={btn(t, accent)}>
          {known ? 'Confirm match' : 'Create'}
        </button>
      </div>
    </div>
  );
}

function findEntity(store, kind, id) {
  const slice = {
    character: 'cast',
    place: 'places',
    item: 'items',
    quest: 'quests',
    thread: 'quests',
  }[kind];
  if (!slice || !id) return null;
  return (store[slice] || []).find(x => x.id === id) || null;
}

function btn(t, accent) {
  return {
    padding: '3px 10px',
    background: accent || 'transparent',
    color: accent ? t.onAccent : t.ink2,
    border: `1px solid ${accent || t.rule}`,
    borderRadius: 1,
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
    cursor: 'pointer', fontWeight: 600,
  };
}

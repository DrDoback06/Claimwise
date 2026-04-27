import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import {
  commitQueueItem, dismissQueueItem, editQueueItemDraft, mergeQueueItem,
} from './operations';

const KIND_LABEL = {
  character: 'Character',
  place: 'Place',
  item: 'Item',
  quest: 'Quest',
  thread: 'Thread',
  fact: 'Fact',
  relationship: 'Relationship',
  skill: 'Skill',
  continuity: 'Continuity',
};

const RISK_CHIP = {
  blue: { text: 'BLUE Auto-added', fg: '#1d4ed8', bg: 'rgba(37,99,235,0.12)' },
  green: { text: 'GREEN Suggested', fg: '#15803d', bg: 'rgba(22,163,74,0.12)' },
  amber: { text: 'AMBER Needs review', fg: '#b45309', bg: 'rgba(217,119,6,0.12)' },
  red: { text: 'RED Canon risk', fg: '#b91c1c', bg: 'rgba(220,38,38,0.12)' },
};

export default function QueueCard({ item, accent, selected, onToggleSelect }) {
  const t = useTheme();
  const store = useStore();
  const [open, setOpen] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [draft, setDraft] = React.useState({
    name: item.draft?.name || item.name || '',
    notes: item.draft?.notes || item.notes || '',
  });

  const flushDraft = () => {
    if (draft.name !== (item.draft?.name || item.name) || draft.notes !== (item.draft?.notes || item.notes)) {
      editQueueItemDraft(store, item.id, draft);
    }
  };

  const ch = item.chapterId ? store.chapters?.[item.chapterId] : null;
  const conf = Math.round((item.confidence || 0) * 100);
  const known = item.status === 'known' && item.resolvesTo;
  const resolved = known ? findEntity(store, item.kind, item.resolvesTo) : null;
  const risk = RISK_CHIP[item.riskBand || 'amber'] || RISK_CHIP.amber;

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
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect?.(item.id)} />
        <span style={{
          padding: '1px 6px', background: accent, color: t.onAccent,
          fontFamily: t.mono, fontSize: 8, letterSpacing: 0.16, textTransform: 'uppercase', borderRadius: 1,
        }}>{KIND_LABEL[item.kind] || item.kind}</span>
        <span style={{
          padding: '1px 6px', background: risk.bg, color: risk.fg,
          fontFamily: t.mono, fontSize: 8, letterSpacing: 0.14, textTransform: 'uppercase', borderRadius: 1,
        }}>{risk.text}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: t.mono, fontSize: 9, color: conf >= 70 ? (t.good || '#1a8') : conf >= 40 ? t.ink2 : t.ink3 }}>{conf}%</span>
      </div>

      {editMode ? (
        <input
          value={draft.name}
          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          style={nameInput(t)}
        />
      ) : (
        <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>{draft.name}</div>
      )}

      {known && resolved && (
        <div style={{
          padding: '4px 8px', borderRadius: 1,
          background: t.paper, border: `1px dashed ${t.warn || accent}`,
          fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.1,
        }}>
          ↳ matches existing <b style={{ color: t.ink }}>{resolved.name}</b> — committing logs a chapter mention.
        </div>
      )}

      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12 }}>
        {ch ? `Chapter ${ch.n || '?'}${ch.title ? ` · ${ch.title}` : ''}` : 'No chapter linked'}
      </div>

      <textarea
        rows={open ? 3 : 1}
        value={draft.notes}
        onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
        onFocus={() => setOpen(true)}
        onBlur={() => { setOpen(false); if (!editMode) flushDraft(); }}
        placeholder="Notes / role / detail"
        style={{
          width: '100%', padding: '4px 6px', resize: 'vertical',
          fontFamily: t.display, fontSize: 12, color: t.ink2, lineHeight: 1.5,
          background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
        }} />

      {item.sourceQuote && (
        <div style={{
          padding: '4px 6px', background: t.paper,
          border: `1px dashed ${t.rule}`,
          fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic',
        }}>
          “{String(item.sourceQuote).slice(0, 180)}{String(item.sourceQuote).length > 180 ? '…' : ''}”
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {!editMode ? (
          <>
            <button onClick={() => setEditMode(true)} style={btn(t)}>Edit</button>
            <button onClick={() => dismissQueueItem(store, item.id)} style={btn(t)}>Dismiss</button>
            <button onClick={() => {
              const name = window.prompt('Merge into which existing entity id?');
              if (!name) return;
              mergeQueueItem(store, item.id, { entityId: name, kind: item.kind });
            }} style={btn(t)}>Merge</button>
            <button onClick={() => { flushDraft(); commitQueueItem(store, item.id); }} style={btn(t, accent)}>
              {known ? 'Accept match' : 'Accept'}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { setEditMode(false); setDraft({ name: item.draft?.name || item.name || '', notes: item.draft?.notes || item.notes || '' }); }} style={btn(t)}>Cancel</button>
            <button onClick={() => { flushDraft(); setEditMode(false); }} style={btn(t, accent)}>✓ Lock edit</button>
          </>
        )}
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

function nameInput(t) {
  return {
    width: '100%', minWidth: 0, padding: '4px 6px',
    fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500,
    background: t.paper, border: `1px solid ${t.rule}`, outline: 'none',
  };
}

// Loomwright — entity timeline log. The "living canon graph" UI: filters
// `timelineEvents` to the events that touch a given (kind, id) and renders
// them in chapter order with a risk chip, event label, clickable chapter,
// and inline chips for every other entity the event linked to.
//
// Mounted by Cast > Appearances, Items > Story, Atlas > Place detail. Same
// component, same data, different filter — that's the canon graph.

import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { useSelection } from '../selection';
import { selectEventsForEntity } from './selectors';
import { riskLabelFor } from '../ai/confidence';
import EntityChip from '../entities/EntityChip';

const EVENT_LABEL = {
  introduced: 'Introduced',
  mention: 'Mentioned',
  stat_change: 'Stat change',
  skill_acquired: 'Skill acquired',
  relationship_change: 'Relationship',
  quest_involvement: 'Quest involvement',
  item_acquired: 'Item acquired',
  item_transferred: 'Item transferred',
  item_destroyed: 'Item destroyed',
  death: 'Death',
  resurrection: 'Resurrection',
  betrayal: 'Betrayal',
  allegiance_change: 'Allegiance change',
  manual_correction: 'Manual correction',
  quest_completed: 'Quest completed',
  quest_failed: 'Quest failed',
  contradiction: 'Contradiction',
};

// BLUE/GREEN/AMBER/RED dot colors. Picked to read in both light and dark modes.
const RISK_COLOR = {
  BLUE: '#3a6fb1',
  GREEN: '#4a8b3c',
  AMBER: '#b8731c',
  RED: '#a83b32',
};

function eventLabel(eventType) {
  if (!eventType) return 'Event';
  return EVENT_LABEL[eventType] || eventType.replace(/_/g, ' ');
}

function chapterTitle(store, chapterId) {
  if (!chapterId) return null;
  const ch = store?.chapters?.[chapterId];
  if (!ch) return null;
  const n = ch.n != null ? `Ch ${ch.n}` : 'Chapter';
  return ch.title ? `${n} · ${ch.title}` : n;
}

export default function EntityTimeline({ kind, id, limit }) {
  const t = useTheme();
  const store = useStore();
  const { select } = useSelection();
  const events = selectEventsForEntity(store, kind, id);
  const visible = limit ? events.slice(0, limit) : events;

  if (!events.length) {
    return (
      <div style={{
        padding: '10px 14px', fontFamily: t.display, fontSize: 12,
        color: t.ink3, fontStyle: 'italic',
      }}>
        No canon events yet. The Loom logs them as you write.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 14px' }}>
      {visible.map(ev => (
        <Row key={ev.id} ev={ev} kind={kind} id={id} t={t} store={store} select={select} />
      ))}
      {limit && events.length > limit && (
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.14, textTransform: 'uppercase', padding: '4px 0',
        }}>
          + {events.length - limit} earlier event{events.length - limit > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

function Row({ ev, kind, id, t, store, select }) {
  const label = riskLabelFor(ev.riskBand);
  const dot = RISK_COLOR[label] || RISK_COLOR.GREEN;
  const chTitle = chapterTitle(store, ev.chapterId);
  const others = (ev.entityRefs || []).filter(r =>
    r && r.id && !(r.kind === kind && r.id === id) &&
    !(kind === 'character' && r.kind === 'character' && r.id === ev.actorId && id === ev.actorId)
  );
  const quote = ev.data?.sourceQuote || ev.data?.evidence?.sourceQuote;

  const jumpToChapter = () => {
    if (!ev.chapterId) return;
    select('chapter', ev.chapterId);
    store.setPath?.('ui.activeChapterId', ev.chapterId);
    if (quote) {
      try {
        window.dispatchEvent(new CustomEvent('lw:highlight-search', { detail: { quote } }));
      } catch {}
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '6px 8px', borderLeft: `2px solid ${dot}`,
      background: t.paper, border: `1px solid ${t.rule}`, borderLeftWidth: 2,
      borderRadius: 1,
    }}>
      <span title={`Risk band: ${label}`} style={{
        marginTop: 4, width: 6, height: 6, borderRadius: 999, background: dot, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: t.mono, fontSize: 9, color: dot,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}>{eventLabel(ev.eventType)}</span>
          {chTitle && (
            <button onClick={jumpToChapter} title="Open chapter" style={{
              padding: '1px 6px', background: 'transparent', color: t.ink2,
              border: `1px solid ${t.rule}`, borderRadius: 1,
              fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
              textTransform: 'uppercase', cursor: 'pointer',
            }}>{chTitle}</button>
          )}
          {others.map((r, i) => (
            <EntityChip key={`${r.kind}-${r.id}-${i}`} kind={r.kind} id={r.id} size="sm" />
          ))}
        </div>
        {ev.data?.description && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.5 }}>
            {ev.data.description}
          </div>
        )}
        {quote && (
          <div onClick={jumpToChapter} title="Click to jump to chapter" style={{
            fontFamily: t.display, fontSize: 12, color: t.ink2, fontStyle: 'italic',
            lineHeight: 1.5, padding: '4px 8px',
            background: t.paper2, borderLeft: `2px solid ${t.rule}`, borderRadius: 1,
            cursor: ev.chapterId ? 'pointer' : 'default',
          }}>“{quote}”</div>
        )}
      </div>
    </div>
  );
}

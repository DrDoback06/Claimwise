import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { getEntityEvents } from './selectors';

const RISK_STYLE = {
  blue: { bg: 'rgba(37,99,235,0.12)', fg: '#2563eb', label: 'BLUE Auto-added' },
  green: { bg: 'rgba(22,163,74,0.12)', fg: '#15803d', label: 'GREEN Suggested' },
  amber: { bg: 'rgba(217,119,6,0.12)', fg: '#b45309', label: 'AMBER Needs review' },
  red: { bg: 'rgba(220,38,38,0.12)', fg: '#b91c1c', label: 'RED Canon risk' },
};

export default function EntityTimeline({ entityType, entityId, title = 'Log' }) {
  const t = useTheme();
  const store = useStore();
  const events = getEntityEvents(store, entityType, entityId);

  return (
    <div style={{ marginTop: 16, paddingTop: 10, borderTop: `1px solid ${t.rule}` }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 8,
      }}>{title}</div>
      {events.length === 0 && (
        <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic' }}>
          No entity events yet. AI and manual edits will appear here.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map(ev => {
          const risk = RISK_STYLE[ev.riskBand] || RISK_STYLE.amber;
          const chapter = ev.chapterId ? store.chapters?.[ev.chapterId] : null;
          return (
            <div key={ev.id} style={{ border: `1px solid ${t.rule}`, borderRadius: 2, padding: '8px 10px', background: t.paper2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  padding: '1px 6px', borderRadius: 999,
                  background: risk.bg, color: risk.fg,
                  fontFamily: t.mono, fontSize: 8, letterSpacing: 0.1, textTransform: 'uppercase',
                }}>{risk.label}</span>
                <span style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 600 }}>{ev.label || ev.eventType}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3 }}>{Math.round((ev.confidence || 0) * 100)}%</span>
              </div>
              <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, marginTop: 6, lineHeight: 1.45 }}>
                {ev.summary}
              </div>
              {(chapter || ev.evidence?.quote) && (
                <div style={{ marginTop: 6, fontFamily: t.mono, fontSize: 9, color: t.ink3 }}>
                  {chapter ? `Chapter ${chapter.n || '?'}${chapter.title ? ` · ${chapter.title}` : ''}` : ''}
                  {chapter && ev.evidence?.quote ? ' · ' : ''}
                  {ev.evidence?.quote ? `“${String(ev.evidence.quote).slice(0, 120)}${String(ev.evidence.quote).length > 120 ? '…' : ''}”` : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

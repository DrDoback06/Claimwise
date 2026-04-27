// Loomwright — collapsible review-queue section. Mounted at the top of
// each entity panel (cast / items / atlas / quests / skills) so writers see
// AI findings for that tab without switching context.

import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { selectQueueForDomain, selectQueueHistory } from './selectors';
import QueueCard from './QueueCard';

export default function QueuePanel({ domain, accent, title = 'Review queue' }) {
  const t = useTheme();
  const store = useStore();
  const pending = selectQueueForDomain(store, domain);
  const history = selectQueueHistory(store, domain);
  const [view, setView] = React.useState('pending'); // 'pending' | 'history'
  const [open, setOpen] = React.useState(true);

  const list = view === 'pending' ? pending : history;

  return (
    <div style={{
      borderBottom: `1px solid ${t.rule}`,
      background: t.paper,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: t.mono, fontSize: 9, color: t.ink2,
          letterSpacing: 0.16, textTransform: 'uppercase',
        }}>
        <span style={{ color: accent }}>{open ? '▾' : '▸'}</span>
        <span>{title}</span>
        {pending.length > 0 && (
          <span style={{
            marginLeft: 4, padding: '1px 6px',
            background: accent, color: t.onAccent,
            fontFamily: t.mono, fontSize: 9, fontWeight: 600,
            borderRadius: 999, letterSpacing: 0.1,
          }}>{pending.length}</span>
        )}
        <span style={{ flex: 1 }} />
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <button onClick={() => setView('pending')}
              style={tab(t, accent, view === 'pending')}>
              Pending {pending.length > 0 && `· ${pending.length}`}
            </button>
            <button onClick={() => setView('history')}
              style={tab(t, accent, view === 'history')}>
              History {history.length > 0 && `· ${history.length}`}
            </button>
          </div>
          {list.length === 0 && (
            <div style={{
              padding: '14px 0', textAlign: 'center',
              fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
            }}>{view === 'pending' ? 'Nothing pending. The Loom will surface findings here as you write.' : 'No history yet.'}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {list.map(it => view === 'pending'
              ? <QueueCard key={it.id} item={it} accent={accent} />
              : <HistoryRow key={it.id} item={it} accent={accent} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryRow({ item, accent }) {
  const t = useTheme();
  const verb = item.status === 'committed' ? '✓ created'
    : item.status === 'merged' ? '↳ merged'
    : '× dismissed';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', borderRadius: 1,
      border: `1px solid ${t.rule}`, borderLeft: `2px solid ${accent}`,
      fontFamily: t.mono, fontSize: 10, color: t.ink3,
    }}>
      <span style={{ color: t.ink2 }}>{verb}</span>
      <span style={{ flex: 1, fontFamily: t.display, fontSize: 12, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.draft?.name || item.name}
      </span>
    </div>
  );
}

function tab(t, accent, on) {
  return {
    padding: '3px 10px',
    background: on ? accent : 'transparent',
    color: on ? t.onAccent : t.ink2,
    border: `1px solid ${on ? accent : t.rule}`,
    borderRadius: 999, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}

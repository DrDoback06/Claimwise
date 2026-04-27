// Loomwright — risk-banded review queue panel. Four collapsible boxes
// (Blue/Green/Amber/Red) with per-section bulk Accept / Dismiss, plus a
// History toggle. Mounted at the top of each domain panel (cast / items /
// atlas / quests / skills) so writers see AI findings in-context.

import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { selectQueueByBand, selectQueueHistory } from './selectors';
import { bulkCommit, bulkDismiss } from './operations';
import QueueCard from './QueueCard';
import { RISK_COLOR } from './RiskChip';

const BAND_ORDER = [
  { id: 'blue',  label: 'Auto-applied',  hint: 'High confidence — applied. Edit, merge, or dismiss to revert.' },
  { id: 'green', label: 'Suggested',     hint: 'Likely correct. Accept to apply.' },
  { id: 'amber', label: 'Needs review',  hint: 'Uncertain or mid-consequence. Confirm evidence first.' },
  { id: 'red',   label: 'Canon risk',    hint: 'High consequence. Explicit accept required.' },
];

const BAND_COLOR = {
  blue:  RISK_COLOR.BLUE,
  green: RISK_COLOR.GREEN,
  amber: RISK_COLOR.AMBER,
  red:   RISK_COLOR.RED,
};

export default function QueuePanel({ domain, accent, title = 'Review queue' }) {
  const t = useTheme();
  const store = useStore();
  const bands = selectQueueByBand(store, domain);
  const history = selectQueueHistory(store, domain);
  const [open, setOpen] = React.useState(true);
  const [showHistory, setShowHistory] = React.useState(false);

  const totalPending = bands.blue.length + bands.green.length + bands.amber.length + bands.red.length;
  if (totalPending === 0 && history.length === 0) return null;

  return (
    <div style={{ borderBottom: `1px solid ${t.rule}`, background: t.paper }}>
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
        {totalPending > 0 && (
          <span style={{
            marginLeft: 4, padding: '1px 6px',
            background: accent, color: t.onAccent,
            fontFamily: t.mono, fontSize: 9, fontWeight: 600,
            borderRadius: 999, letterSpacing: 0.1,
          }}>{totalPending}</span>
        )}
        <span style={{ flex: 1 }} />
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BAND_ORDER.map(b => (
            <BandSection key={b.id}
              band={b} items={bands[b.id]} t={t} accent={accent} store={store}
              color={BAND_COLOR[b.id]} />
          ))}

          <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
            <button onClick={() => setShowHistory(h => !h)} style={tabBtn(t, accent, showHistory)}>
              History {history.length > 0 && `· ${history.length}`}
            </button>
          </div>
          {showHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {history.length === 0
                ? <Empty t={t} text="No history yet." />
                : history.map(it => <HistoryRow key={it.id} item={it} accent={accent} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BandSection({ band, items, t, accent, store, color }) {
  const [open, setOpen] = React.useState(items.length > 0 && band.id !== 'blue');
  const [selected, setSelected] = React.useState(() => new Set());

  React.useEffect(() => {
    setSelected(prev => {
      const next = new Set();
      for (const id of prev) if (items.some(it => it.id === id)) next.add(id);
      return next;
    });
  }, [items]);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const allSelected = items.length > 0 && items.every(it => selected.has(it.id));
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(items.map(it => it.id)));
  };

  const acceptSelected = () => {
    if (selected.size === 0) return;
    if (band.id === 'red') {
      const ok = window.confirm(`Apply ${selected.size} canon-risk change${selected.size > 1 ? 's' : ''}? This is reversible from History.`);
      if (!ok) return;
    }
    bulkCommit(store, [...selected]);
    setSelected(new Set());
  };
  const dismissSelected = () => {
    if (selected.size === 0) return;
    bulkDismiss(store, [...selected]);
    setSelected(new Set());
  };

  if (items.length === 0) return null;

  return (
    <div style={{
      border: `1px solid ${t.rule}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 1,
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '6px 10px',
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontFamily: t.mono, fontSize: 9, color,
        letterSpacing: 0.16, textTransform: 'uppercase', fontWeight: 600,
      }} title={band.hint}>
        <span>{open ? '▾' : '▸'}</span>
        <span>{band.label}</span>
        <span style={{
          padding: '0 5px', background: color, color: t.onAccent,
          fontFamily: t.mono, fontSize: 9, fontWeight: 700,
          borderRadius: 999,
        }}>{items.length}</span>
        <span style={{ flex: 1 }} />
      </button>
      {open && (
        <div style={{ padding: '6px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.12, cursor: 'pointer',
            }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              Select all
            </label>
            <span style={{ flex: 1 }} />
            <button onClick={acceptSelected} disabled={selected.size === 0}
              style={bulkBtn(t, color, selected.size > 0)}>
              Accept{selected.size > 0 ? ` · ${selected.size}` : ''}
            </button>
            <button onClick={dismissSelected} disabled={selected.size === 0}
              style={bulkBtn(t, t.ink3, selected.size > 0)}>
              Dismiss{selected.size > 0 ? ` · ${selected.size}` : ''}
            </button>
          </div>
          {items.map(it => (
            <QueueCard key={it.id} item={it} accent={accent}
              selected={selected.has(it.id)} onToggleSelect={toggle} />
          ))}
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

function Empty({ t, text }) {
  return (
    <div style={{
      padding: '14px 0', textAlign: 'center',
      fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
    }}>{text}</div>
  );
}

function tabBtn(t, accent, on) {
  return {
    padding: '3px 10px',
    background: on ? accent : 'transparent',
    color: on ? t.onAccent : t.ink2,
    border: `1px solid ${on ? accent : t.rule}`,
    borderRadius: 999, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}

function bulkBtn(t, color, enabled) {
  return {
    padding: '3px 10px',
    background: enabled ? color : 'transparent',
    color: enabled ? t.onAccent : t.ink3,
    border: `1px solid ${enabled ? color : t.rule}`,
    borderRadius: 1,
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
    textTransform: 'uppercase', fontWeight: 600,
    cursor: enabled ? 'pointer' : 'not-allowed',
  };
}

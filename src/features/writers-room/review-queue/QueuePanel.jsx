import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { selectQueueForDomain, selectQueueHistory } from './selectors';
import QueueCard from './QueueCard';
import { autoApplyQueueItems, commitQueueItem, dismissQueueItem, mergeQueueItem } from './operations';

const RISK_ORDER = ['blue', 'green', 'amber', 'red'];
const RISK_TITLE = {
  blue: 'Blue — Auto-added',
  green: 'Green — Suggested',
  amber: 'Amber — Needs review',
  red: 'Red — Canon risk',
};

export default function QueuePanel({ domain, accent, title = 'Review queue' }) {
  const t = useTheme();
  const store = useStore();
  const pending = selectQueueForDomain(store, domain);
  const history = selectQueueHistory(store, domain);
  const [view, setView] = React.useState('pending');
  const [open, setOpen] = React.useState(true);
  const [sort, setSort] = React.useState('recent');
  const [selected, setSelected] = React.useState([]);
  const groupByRisk = store.profile?.reviewAutomation?.groupByRiskBand !== false;

  if (pending.length === 0 && history.length === 0) return null;
  const list = view === 'pending' ? pending : history;
  const grouped = groupItems(sortItems(list, sort), groupByRisk);

  const toggleSelected = (id) => setSelected(xs => xs.includes(id) ? xs.filter(x => x !== id) : [...xs, id]);
  const selectAll = (ids) => setSelected(xs => [...new Set([...xs, ...ids])]);
  const clearSelected = () => setSelected([]);

  const bulkAccept = (ids) => {
    const redCount = ids.filter(id => (pending.find(p => p.id === id)?.riskBand === 'red')).length;
    if (redCount > 0 && !window.confirm(`You are about to apply ${redCount} high-risk canon change(s). Continue?`)) return;
    ids.forEach(id => commitQueueItem(store, id));
    clearSelected();
  };

  const bulkDismiss = (ids) => {
    ids.forEach(id => dismissQueueItem(store, id));
    clearSelected();
  };

  const bulkMerge = (ids) => {
    const target = window.prompt('Merge selected items into which entity id?');
    if (!target) return;
    ids.forEach(id => mergeQueueItem(store, id, { entityId: target }));
    clearSelected();
  };

  const bulkAutoApplyBlue = (ids) => {
    autoApplyQueueItems(store, ids);
    clearSelected();
  };

  return (
    <div style={{ borderBottom: `1px solid ${t.rule}`, background: t.paper }}>
      <button onClick={() => setOpen(o => !o)} style={headerBtn(t)}>
        <span style={{ color: accent }}>{open ? '▾' : '▸'}</span>
        <span>{title}</span>
        {pending.length > 0 && <Badge color={accent}>{pending.length}</Badge>}
        <span style={{ flex: 1 }} />
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button onClick={() => setView('pending')} style={tab(t, accent, view === 'pending')}>Pending</button>
            <button onClick={() => setView('history')} style={tab(t, accent, view === 'history')}>History</button>
            <span style={{ flex: 1 }} />
            <select value={sort} onChange={e => setSort(e.target.value)} style={sortStyle(t)}>
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
              <option value="high-conf">Highest confidence</option>
              <option value="low-conf">Lowest confidence</option>
            </select>
          </div>

          {view === 'pending' && selected.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              <button style={bulkBtn(t)} onClick={() => bulkAccept(selected)}>Bulk Accept</button>
              <button style={bulkBtn(t)} onClick={() => bulkDismiss(selected)}>Bulk Dismiss</button>
              <button style={bulkBtn(t)} onClick={() => bulkMerge(selected)}>Bulk Merge</button>
              <button style={bulkBtn(t)} onClick={() => bulkAutoApplyBlue(selected)}>Auto-apply selected</button>
              <button style={bulkBtn(t)} onClick={clearSelected}>Clear selection</button>
            </div>
          )}

          {list.length === 0 && (
            <div style={{ padding: '14px 0', textAlign: 'center', fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic' }}>
              {view === 'pending' ? 'Nothing pending. The Loom will surface findings here as you write.' : 'No history yet.'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RISK_ORDER.map(risk => {
              const items = grouped[risk] || [];
              if (items.length === 0) return null;
              const ids = items.map(x => x.id);
              return (
                <RiskSection
                  key={risk}
                  t={t}
                  accent={accent}
                  title={RISK_TITLE[risk]}
                  count={items.length}
                  onSelectAll={() => selectAll(ids)}>
                  {items.map(it => (
                    <QueueCard
                      key={it.id}
                      item={it}
                      accent={accent}
                      selected={selected.includes(it.id)}
                      onToggleSelect={toggleSelected}
                    />
                  ))}
                </RiskSection>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskSection({ t, title, count, children, onSelectAll }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ border: `1px solid ${t.rule}`, borderRadius: 2, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={riskHeader(t)}>
        <span>{open ? '▾' : '▸'}</span>
        <span>{title}</span>
        <Badge>{count}</Badge>
        <span style={{ flex: 1 }} />
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onSelectAll?.(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSelectAll?.(); } }}
          style={miniBtn(t)}
        >Select all visible</span>
      </button>
      {open && <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>}
    </div>
  );
}

function sortItems(items, mode) {
  const arr = [...items];
  if (mode === 'oldest') return arr.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
  if (mode === 'high-conf') return arr.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  if (mode === 'low-conf') return arr.sort((a, b) => (a.confidence || 0) - (b.confidence || 0));
  return arr.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
}

function groupByRisk(items) {
  return items.reduce((acc, it) => {
    const k = it.riskBand || 'amber';
    acc[k] = acc[k] || [];
    acc[k].push(it);
    return acc;
  }, { blue: [], green: [], amber: [], red: [] });
}

function groupItems(items, byRisk) {
  if (byRisk) return groupByRisk(items);
  return { blue: [], green: [], amber: items, red: [] };
}

function headerBtn(t) {
  return {
    width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, color: t.ink2, letterSpacing: 0.16, textTransform: 'uppercase',
  };
}
function riskHeader(t) {
  return {
    width: '100%', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 8,
    background: t.paper2, border: 'none', cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, color: t.ink2, letterSpacing: 0.16, textTransform: 'uppercase',
  };
}
function miniBtn(t) {
  return {
    padding: '2px 6px', background: 'transparent', border: `1px solid ${t.rule}`, borderRadius: 1,
    fontFamily: t.mono, fontSize: 8, color: t.ink3, cursor: 'pointer', textTransform: 'uppercase',
  };
}
function Badge({ children, color }) {
  return <span style={{ marginLeft: 4, padding: '1px 6px', background: color || '#ddd', color: '#111', fontFamily: 'monospace', fontSize: 9, borderRadius: 999 }}>{children}</span>;
}
function tab(t, accent, on) {
  return {
    padding: '3px 10px', background: on ? accent : 'transparent', color: on ? t.onAccent : t.ink2,
    border: `1px solid ${on ? accent : t.rule}`, borderRadius: 999, cursor: 'pointer',
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
  };
}
function sortStyle(t) {
  return {
    fontFamily: t.mono, fontSize: 9, color: t.ink2, background: 'transparent',
    border: `1px solid ${t.rule}`, padding: '3px 6px', borderRadius: 1,
  };
}
function bulkBtn(t) {
  return {
    padding: '3px 10px', background: 'transparent', color: t.ink2,
    border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono,
    fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
  };
}

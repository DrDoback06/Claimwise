// Loomwright — bottom tab bar for mobile (CSS shows/hides via @media).
// Each tab opens / closes its respective right-side panel, except for
// Editor which closes everything (returning the writer to the prose).
//
// "More" expands a sheet of less-frequent tabs.

import React from 'react';
import { useStore } from './store';

const PRIMARY = [
  { id: 'editor',  label: 'Edit',   glyph: '✎' },
  { id: 'today',   label: 'Today',  glyph: '☀' },
  { id: 'cast',    label: 'Cast',   glyph: '👥' },
  { id: 'atlas',   label: 'Atlas',  glyph: '🗺' },
  { id: 'quests',  label: 'Quests', glyph: '⚔' },
  { id: 'more',    label: 'More',   glyph: '…' },
];

const MORE_PANELS = [
  { id: 'items',      label: 'Items' },
  { id: 'skills',     label: 'Skills' },
  { id: 'voice',      label: 'Voice' },
  { id: 'language',   label: 'Lang' },
  { id: 'tangle',     label: 'Tangle' },
  { id: 'continuity', label: 'Cont.' },
  { id: 'interview',  label: 'Interview' },
  { id: 'groupchat',  label: 'Round' },
  { id: 'references', label: 'Refs' },
];

export default function MobileTabBar({ openPanels, onTogglePanel, onCloseAll }) {
  const store = useStore();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const todayOpen = !!store.ui?.todayOpen;

  const isActive = (id) => {
    if (id === 'editor') return openPanels.length === 0 && !todayOpen;
    if (id === 'today') return todayOpen;
    if (id === 'more') return moreOpen;
    return openPanels.includes(id);
  };

  const onTap = (id) => {
    if (id === 'editor') { onCloseAll(); store.setPath('ui.todayOpen', false); setMoreOpen(false); return; }
    if (id === 'today') { store.setPath('ui.todayOpen', !todayOpen); setMoreOpen(false); return; }
    if (id === 'more') { setMoreOpen(o => !o); return; }
    onTogglePanel(id);
    setMoreOpen(false);
  };

  return (
    <>
      {moreOpen && (
        <div onClick={() => setMoreOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1599,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#f8f4ea', width: '100%', padding: '14px 12px',
            borderTopLeftRadius: 12, borderTopRightRadius: 12,
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
            paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 12px)',
          }}>
            {MORE_PANELS.map(p => (
              <button key={p.id}
                onClick={() => { onTogglePanel(p.id); setMoreOpen(false); }}
                style={{
                  padding: '10px 8px',
                  background: openPanels.includes(p.id) ? 'rgba(0,0,0,0.06)' : 'transparent',
                  border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6,
                  fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#333', cursor: 'pointer',
                }}>{p.label}</button>
            ))}
          </div>
        </div>
      )}
      <nav className="lw-mobile-tabbar">
        {PRIMARY.map(p => (
          <button key={p.id} onClick={() => onTap(p.id)} className={isActive(p.id) ? 'active' : ''}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{p.glyph}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

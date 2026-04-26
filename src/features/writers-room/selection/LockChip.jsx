// Loomwright — per-panel pin/lock chip (CODE-INSIGHT §1).
// Pin metaphor (📌), three states: follow / whole / entity.
// Mounted in each panel header, top-right.

import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { useSelection, primaryRef } from './index';
import {
  characterById, placeById, threadById, itemById,
} from '../store/selectors';

function refLookup(state, ref) {
  if (!ref) return null;
  switch (ref.kind) {
    case 'character': return characterById(state, ref.id);
    case 'place':     return placeById(state, ref.id);
    case 'thread':    return threadById(state, ref.id);
    case 'item':      return itemById(state, ref.id);
    case 'chapter':   return state.chapters?.[ref.id] || null;
    default: return null;
  }
}

function refLabel(ref, entity) {
  if (!entity) return ref?.id || '';
  return entity.name || entity.title || entity.label || '';
}

export default function LockChip({ panelId, accent }) {
  const t = useTheme();
  const store = useStore();
  const { sel, panelLocks, setPanelLock } = useSelection();
  const lock = panelLocks[panelId] || { mode: 'follow' };
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const pinnedLabel = (() => {
    if (lock.mode === 'whole') return 'Whole book';
    if (lock.mode === 'entity' && lock.pinnedTo) {
      const e = refLookup(store, lock.pinnedTo);
      return e ? refLabel(lock.pinnedTo, e) : 'Pinned';
    }
    return null;
  })();

  const pinHere = () => {
    const ref = primaryRef(sel);
    if (ref) setPanelLock(panelId, { mode: 'entity', pinnedTo: ref });
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={pinnedLabel ? `Pinned · ${pinnedLabel}` : 'Follow selection'}
        aria-label="Panel pin"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          height: 22, padding: '0 6px',
          background: lock.mode === 'follow' ? 'transparent' : (t.paper2),
          border: `1px solid ${lock.mode === 'follow' ? t.rule : (accent || t.warn)}`,
          borderRadius: 999, cursor: 'pointer',
          color: lock.mode === 'follow' ? t.ink3 : (accent || t.warn),
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
          textTransform: 'uppercase',
        }}
      >
        <span style={{ transform: lock.mode === 'follow' ? 'rotate(0deg)' : 'rotate(-30deg)', display: 'inline-block' }}>📌</span>
        {pinnedLabel && (
          <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pinnedLabel}
          </span>
        )}
      </button>
      {open && (
        <div role="menu" style={{
          position: 'absolute', right: 0, top: 26, zIndex: 30,
          background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 4,
          minWidth: 180, padding: 4,
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
          fontFamily: t.mono, fontSize: 10,
          letterSpacing: 0.14, textTransform: 'uppercase',
          color: t.ink2,
        }}>
          <MenuItem t={t} active={lock.mode === 'follow'}
            onClick={() => { setPanelLock(panelId, { mode: 'follow' }); setOpen(false); }}>
            Follow selection
          </MenuItem>
          <MenuItem t={t} active={lock.mode === 'whole'}
            onClick={() => { setPanelLock(panelId, { mode: 'whole' }); setOpen(false); }}>
            Pin to whole book
          </MenuItem>
          <MenuItem t={t} active={lock.mode === 'entity'} onClick={pinHere}
            disabled={!primaryRef(sel)}>
            Pin to current selection
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({ t, active, onClick, disabled, children }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      display: 'block', width: '100%', padding: '6px 8px',
      background: active ? t.paper2 : 'transparent', border: 'none', borderRadius: 2,
      textAlign: 'left',
      fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase',
      color: disabled ? t.ink4 : (active ? t.ink : t.ink2),
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>{children}</button>
  );
}

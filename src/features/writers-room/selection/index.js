// Loomwright — selection bus. The spine of cross-panel sync (plan §3.2).
// Click a character anywhere → every other surface lights up. One hook drives the spotlight.
//
// 2026-04 design refresh: adds `chapter` + `multi` to `sel`, and a separate
// `panelLocks` slice (per-panel pin state, NOT global). See CODE-INSIGHT §1.

import React from 'react';

const EMPTY_SELECTION = {
  character: null,
  place: null,
  thread: null,
  item: null,
  paragraph: null,
  scene: null,
  chapter: null,
  multi: [],     // EntityRef[] for multi-select stack; primary = most recently set
};

// Each panel has its own pin state. 'follow' = mirror sel; 'whole' = pin to
// overview / whole-book mode; 'entity' = pin to a specific selection so
// later sel changes don't disturb this panel.
const EMPTY_LOCKS = {
  // panelId -> { mode: 'follow' | 'whole' | 'entity', pinnedTo?: EntityRef }
};

const SelectionCtx = React.createContext({
  sel: EMPTY_SELECTION,
  panelLocks: EMPTY_LOCKS,
  select: () => {},
  clear: () => {},
  addToMulti: () => {},
  removeFromMulti: () => {},
  clearMulti: () => {},
  setPanelLock: () => {},
  effectiveSelectionFor: () => EMPTY_SELECTION,
});

export function SelectionProvider({ children, persist = true }) {
  const [sel, setSel] = React.useState(() => {
    if (!persist) return EMPTY_SELECTION;
    try {
      const raw = localStorage.getItem('lw.selection');
      if (raw) return { ...EMPTY_SELECTION, ...JSON.parse(raw) };
    } catch {}
    return EMPTY_SELECTION;
  });

  const [panelLocks, setPanelLocks] = React.useState(() => {
    if (!persist) return EMPTY_LOCKS;
    try {
      const raw = localStorage.getItem('lw.panelLocks');
      if (raw) return { ...EMPTY_LOCKS, ...JSON.parse(raw) };
    } catch {}
    return EMPTY_LOCKS;
  });

  React.useEffect(() => {
    if (!persist) return;
    try { localStorage.setItem('lw.selection', JSON.stringify(sel)); } catch {}
  }, [sel, persist]);

  React.useEffect(() => {
    if (!persist) return;
    try { localStorage.setItem('lw.panelLocks', JSON.stringify(panelLocks)); } catch {}
  }, [panelLocks, persist]);

  const select = React.useCallback((kind, id) => {
    setSel(s => ({ ...s, [kind]: id }));
  }, []);

  const clear = React.useCallback(() => setSel(EMPTY_SELECTION), []);

  // Multi-select: shift-click to add, cmd/ctrl-click on existing member to remove.
  const addToMulti = React.useCallback((ref) => {
    if (!ref || !ref.kind || !ref.id) return;
    setSel(s => {
      const next = (s.multi || []).filter(r => !(r.kind === ref.kind && r.id === ref.id));
      next.push(ref);
      // Primary mirrors most recently set
      return { ...s, multi: next, [ref.kind]: ref.id };
    });
  }, []);

  const removeFromMulti = React.useCallback((ref) => {
    if (!ref || !ref.kind || !ref.id) return;
    setSel(s => ({
      ...s,
      multi: (s.multi || []).filter(r => !(r.kind === ref.kind && r.id === ref.id)),
    }));
  }, []);

  const clearMulti = React.useCallback(() => {
    setSel(s => ({ ...s, multi: [] }));
  }, []);

  const setPanelLock = React.useCallback((panelId, lock) => {
    setPanelLocks(prev => {
      if (!lock || lock.mode === 'follow') {
        if (!prev[panelId]) return prev;
        const { [panelId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [panelId]: lock };
    });
  }, []);

  // Resolve the selection a panel should render. Locked panels see their
  // pinned selection (or whole-book mode), not the live `sel`.
  const effectiveSelectionFor = React.useCallback((panelId) => {
    const lock = panelLocks[panelId];
    if (!lock || lock.mode === 'follow') return sel;
    if (lock.mode === 'whole') return EMPTY_SELECTION;
    if (lock.mode === 'entity' && lock.pinnedTo) {
      return { ...EMPTY_SELECTION, [lock.pinnedTo.kind]: lock.pinnedTo.id };
    }
    return sel;
  }, [sel, panelLocks]);

  const value = React.useMemo(() => ({
    sel, panelLocks,
    select, clear,
    addToMulti, removeFromMulti, clearMulti,
    setPanelLock, effectiveSelectionFor,
  }), [sel, panelLocks, select, clear, addToMulti, removeFromMulti, clearMulti, setPanelLock, effectiveSelectionFor]);

  return <SelectionCtx.Provider value={value}>{children}</SelectionCtx.Provider>;
}

export function useSelection() { return React.useContext(SelectionCtx); }

// Resolve the primary EntityRef from `sel`. Order: explicit primary in `multi`
// (last set), else first non-null of character/place/thread/item.
export function primaryRef(sel) {
  if (!sel) return null;
  if (sel.multi && sel.multi.length) return sel.multi[sel.multi.length - 1];
  for (const k of ['character', 'place', 'thread', 'item']) {
    if (sel[k]) return { kind: k, id: sel[k] };
  }
  return null;
}

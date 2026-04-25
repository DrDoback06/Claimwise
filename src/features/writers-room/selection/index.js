// Loomwright — selection bus. The spine of cross-panel sync (plan §3.2).
// Click a character anywhere → every other surface lights up. One hook drives the spotlight.

import React from 'react';

const EMPTY_SELECTION = {
  character: null,
  place: null,
  thread: null,
  item: null,
  paragraph: null,
  scene: null,
};

const SelectionCtx = React.createContext({ sel: EMPTY_SELECTION, select: () => {}, clear: () => {} });

export function SelectionProvider({ children, persist = true }) {
  const [sel, setSel] = React.useState(() => {
    if (!persist) return EMPTY_SELECTION;
    try {
      const raw = localStorage.getItem('lw.selection');
      if (raw) return { ...EMPTY_SELECTION, ...JSON.parse(raw) };
    } catch {}
    return EMPTY_SELECTION;
  });

  React.useEffect(() => {
    if (!persist) return;
    try { localStorage.setItem('lw.selection', JSON.stringify(sel)); } catch {}
  }, [sel, persist]);

  const select = React.useCallback((kind, id) => {
    setSel(s => ({ ...s, [kind]: id }));
  }, []);

  const clear = React.useCallback(() => setSel(EMPTY_SELECTION), []);

  const value = React.useMemo(() => ({ sel, select, clear }), [sel, select, clear]);
  return <SelectionCtx.Provider value={value}>{children}</SelectionCtx.Provider>;
}

export function useSelection() { return React.useContext(SelectionCtx); }

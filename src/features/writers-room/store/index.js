// Loomwright — StoreProvider, useStore, dot-path mutators (plan §3).
//
// One canonical store. Every panel reads via `useStore()` and writes via
// `setSlice` / `setPath` / `transaction`. The redesign branch's API is
// preserved so panels port over with minimal change.

import React from 'react';
import { emptyState } from './schema';
import { loadAllFromDB, persistSlice } from './persistence';
import {
  createCharacter, createPlace, createThread, createItem,
  createChapter, removeChapter, reorderChapters,
  rid, wordCount, pickColor, clearDraftFlag,
} from './mutators';
import suggestionFeedbackService from '../../../services/suggestionFeedbackService';

const StoreCtx = React.createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = React.useState(() => emptyState());

  // Hydrate once.
  React.useEffect(() => {
    let cancelled = false;
    loadAllFromDB().then(loaded => {
      if (cancelled) return;
      setState(s => ({ ...loaded, _loading: false }));
    }).catch(err => {
      console.warn('[lw-store] hydrate failed', err);
      setState(s => ({ ...s, _loading: false }));
    });
    return () => { cancelled = true; };
  }, []);

  // Debounced persistence.
  const prevRef = React.useRef(state);
  const pendingRef = React.useRef(new Set());
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    if (state._loading) { prevRef.current = state; return; }
    const prev = prevRef.current;
    const changed = [];
    for (const k of Object.keys(state)) {
      if (k === '_loading' || k === 'feedback' || k === 'suggestions') continue;
      if (k === 'marginDetections') continue; // ephemeral — see CODE-INSIGHT §4
      if (prev[k] !== state[k]) changed.push(k);
    }
    changed.forEach(k => pendingRef.current.add(k));
    prevRef.current = state;
    if (!changed.length) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const slices = [...pendingRef.current]; pendingRef.current.clear();
      const snap = prevRef.current;
      for (const slice of slices) {
        try { await persistSlice(slice, prev[slice], snap[slice]); }
        catch (e) { console.warn('[lw-store] persist', slice, 'failed:', e?.message); }
      }
    }, 400);
  }, [state]);

  // Flush on tab close.
  React.useEffect(() => {
    const flush = () => {
      if (pendingRef.current.size === 0) return;
      clearTimeout(timerRef.current);
      const slices = [...pendingRef.current]; pendingRef.current.clear();
      const snap = prevRef.current;
      for (const slice of slices) {
        try { persistSlice(slice, snap[slice], snap[slice]); } catch {}
      }
    };
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  const setSlice = React.useCallback((slice, next) => {
    setState(s => ({
      ...s,
      [slice]: typeof next === 'function' ? next(s[slice]) : next,
    }));
  }, []);

  const setPath = React.useCallback((path, value) => {
    const parts = path.split('.');
    setState(s => {
      const clone = { ...s };
      let cur = clone;
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] || {}) };
        cur = cur[k];
      }
      const leaf = parts[parts.length - 1];
      cur[leaf] = typeof value === 'function' ? value(cur[leaf]) : value;
      return clone;
    });
  }, []);

  // transaction(fn) — receives a draft proxy with .setSlice/.setPath; batches
  // all changes into a single state update.
  const transaction = React.useCallback((fn) => {
    setState(s => {
      let draft = { ...s };
      const helper = {
        setSlice: (slice, next) => {
          draft = {
            ...draft,
            [slice]: typeof next === 'function' ? next(draft[slice]) : next,
          };
        },
        setPath: (path, value) => {
          const parts = path.split('.');
          const clone = { ...draft };
          let cur = clone;
          for (let i = 0; i < parts.length - 1; i++) {
            const k = parts[i];
            cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] || {}) };
            cur = cur[k];
          }
          const leaf = parts[parts.length - 1];
          cur[leaf] = typeof value === 'function' ? value(cur[leaf]) : value;
          draft = clone;
        },
        get: () => draft,
      };
      try { fn(helper); } catch (e) { console.warn('[lw-store] transaction', e); }
      return draft;
    });
  }, []);

  const reset = React.useCallback(async () => {
    const { clearAll } = await import('./persistence');
    await clearAll();
    setState({ ...emptyState(), _loading: false });
  }, []);

  const recordFeedback = React.useCallback((kind, action, extra = {}) => {
    setState(s => ({
      ...s,
      feedback: [...(s.feedback || []).slice(-499), { kind, action, at: Date.now(), ...extra }],
      profile: {
        ...s.profile,
        acceptCounts: action === 'accept' || action === 'apply'
          ? { ...s.profile.acceptCounts, [kind]: (s.profile.acceptCounts?.[kind] || 0) + 1 }
          : s.profile.acceptCounts,
        dismissRates: action === 'dismiss' || action === 'reject'
          ? { ...s.profile.dismissRates, [kind]: (s.profile.dismissRates?.[kind] || 0) + 1 }
          : s.profile.dismissRates,
      },
    }));
    // Best-effort write to legacy feedback service.
    try {
      const fn = suggestionFeedbackService?.recordAcceptance || suggestionFeedbackService?.recordFeedback;
      if (fn) {
        const sid = extra.suggestionId || `${kind}_${Date.now()}`;
        const p = suggestionFeedbackService.recordAcceptance
          ? suggestionFeedbackService.recordAcceptance(sid, action, { suggestionType: kind, ...extra })
          : suggestionFeedbackService.recordFeedback({ suggestionType: kind, action, timestamp: Date.now(), ...extra });
        p?.catch?.(() => {});
      }
    } catch {}
  }, []);

  const api = React.useMemo(() => ({
    ...state,
    setSlice, setPath, transaction, reset, recordFeedback,
  }), [state, setSlice, setPath, transaction, reset, recordFeedback]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const s = React.useContext(StoreCtx);
  if (!s) throw new Error('useStore must be used inside <StoreProvider>');
  return s;
}

export {
  createCharacter, createPlace, createThread, createItem,
  createChapter, removeChapter, reorderChapters,
  rid, wordCount, pickColor, clearDraftFlag,
};

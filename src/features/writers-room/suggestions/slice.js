// Loomwright — Suggestion-drawer slice helpers (CODE-INSIGHT §3 / §12.2).
//
// Each helper takes the current `suggestionDrawer` value and returns the
// next one — pair with `store.setSlice('suggestionDrawer', d => …)`.

import { suggestionScopeKey } from '../store/selectors';

function rid(prefix = 'sg') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeSuggestion(partial = {}) {
  return {
    id: partial.id || rid(),
    type: partial.type || 'item',
    scope: partial.scope || null,
    title: partial.title || 'Untitled suggestion',
    preview: partial.preview || '',
    body: partial.body || '',
    relevance: typeof partial.relevance === 'number' ? partial.relevance : 50,
    boosted: !!partial.boosted,
    provenance: partial.provenance || [],
    customisation: partial.customisation,
    createdAt: partial.createdAt || Date.now(),
  };
}

function emptyBucket() {
  return { open: [], snoozed: [], dismissed: [], accepted: [] };
}

function withScope(drawer, scope, mutate) {
  const key = suggestionScopeKey(scope);
  const bucket = drawer?.byScope?.[key] || emptyBucket();
  const next = mutate(bucket) || bucket;
  return {
    ...(drawer || {}),
    byScope: { ...(drawer?.byScope || {}), [key]: next },
  };
}

export function setSuggestionsForScope(drawer, scope, suggestions) {
  return withScope(drawer, scope, (b) => ({
    ...b,
    open: suggestions.map(makeSuggestion),
  }));
}

export function appendSuggestion(drawer, scope, partial) {
  const sg = makeSuggestion(partial);
  return withScope(drawer, scope, (b) => ({ ...b, open: [...b.open, sg] }));
}

export function snoozeSuggestion(drawer, scope, id) {
  return withScope(drawer, scope, (b) => {
    const target = b.open.find(s => s.id === id);
    if (!target) return b;
    return {
      ...b,
      open: b.open.filter(s => s.id !== id),
      snoozed: [...b.snoozed, { ...target, snoozedAtRelevance: target.relevance }],
    };
  });
}

export function dismissSuggestion(drawer, scope, id) {
  return withScope(drawer, scope, (b) => {
    const target = b.open.find(s => s.id === id) || b.snoozed.find(s => s.id === id);
    if (!target) return b;
    return {
      ...b,
      open: b.open.filter(s => s.id !== id),
      snoozed: b.snoozed.filter(s => s.id !== id),
      dismissed: [...b.dismissed, target],
    };
  });
}

export function acceptSuggestion(drawer, scope, id, manuscriptRef) {
  return withScope(drawer, scope, (b) => {
    const target = b.open.find(s => s.id === id);
    if (!target) return b;
    return {
      ...b,
      open: b.open.filter(s => s.id !== id),
      accepted: [...b.accepted, { ...target, manuscriptRef, acceptedAt: Date.now() }],
    };
  });
}

export function commitAccepted(drawer, scope, id) {
  return withScope(drawer, scope, (b) => ({
    ...b,
    accepted: b.accepted.map(s => s.id === id ? { ...s, commitedAt: Date.now() } : s),
  }));
}

export function revertAccepted(drawer, scope, id) {
  return withScope(drawer, scope, (b) => ({
    ...b,
    accepted: b.accepted.filter(s => s.id !== id),
  }));
}

export function boostSuggestion(drawer, scope, id) {
  return withScope(drawer, scope, (b) => ({
    ...b,
    open: b.open.map(s => s.id === id ? { ...s, boosted: true } : s),
  }));
}

export function resurfaceSnoozed(drawer, scope, delta = 15) {
  return withScope(drawer, scope, (b) => {
    const stillSnoozed = [];
    const surfaced = [];
    for (const s of b.snoozed) {
      const start = s.snoozedAtRelevance ?? s.relevance;
      if (s.relevance - start >= delta) {
        const { snoozedAtRelevance, ...rest } = s;
        surfaced.push(rest);
      } else {
        stillSnoozed.push(s);
      }
    }
    if (surfaced.length === 0) return b;
    return { ...b, open: [...b.open, ...surfaced], snoozed: stillSnoozed };
  });
}

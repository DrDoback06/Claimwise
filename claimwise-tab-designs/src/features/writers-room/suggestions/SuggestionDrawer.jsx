// Loomwright — Suggestion Drawer (CODE-INSIGHT §3 / artboard 03-suggestions).
//
// Drawer-off-drawer. Right rail is mounted on the panel stack; cards render in
// a list. Selecting a card slides the detail in over the cards. Accept opens
// the mini-wizard. Insertion is dispatched to a window-level event the editor
// listens to ("lw:insert-staged").

import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { useSelection, primaryRef } from '../selection';
import LockChip from '../selection/LockChip';
import { suggestionsForScope, suggestionScopeKey } from '../store/selectors';
import {
  setSuggestionsForScope, snoozeSuggestion, dismissSuggestion,
  acceptSuggestion, boostSuggestion,
} from './slice';
import { regenerate } from './service';
import SuggestionCard from './SuggestionCard';
import AcceptWizard from './AcceptWizard';

const WIDTH = 380;
const DEBOUNCE_MS = 800;

export default function SuggestionDrawer({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const { effectiveSelectionFor } = useSelection();

  const effective = effectiveSelectionFor('suggestions');
  const scope = primaryRef(effective);

  const bucket = suggestionsForScope(store, scope);
  const [phase, setPhase] = React.useState('list');  // 'list' | 'detail' | 'wizard'
  const [openId, setOpenId] = React.useState(null);
  const [showLow, setShowLow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [view, setView] = React.useState('open');   // 'open' | 'snoozed' | 'dismissed' | 'accepted'

  const scopeKey = suggestionScopeKey(scope);
  const lastScopeRef = React.useRef(scopeKey);
  const debounceRef = React.useRef(null);

  // Auto-regenerate on scope or chapter-save.
  const chapterId = store.ui?.activeChapterId;
  const lastEdit = chapterId ? store.chapters?.[chapterId]?.lastEdit : null;

  const triggerRegenerate = React.useCallback(async ({ boost = false } = {}) => {
    setLoading(true); setError(null);
    try {
      const items = await regenerate(store, scope, { boost });
      store.setSlice('suggestionDrawer', d => setSuggestionsForScope(d, scope, items));
    } catch (err) {
      setError(err?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey, store]);

  React.useEffect(() => {
    if (lastScopeRef.current !== scopeKey) {
      lastScopeRef.current = scopeKey;
      // New scope, no cards → trigger one cold-start fetch.
      const fresh = suggestionsForScope(store, scope);
      if (!fresh.open.length) triggerRegenerate();
    }
  }, [scopeKey, scope, store, triggerRegenerate]);

  React.useEffect(() => {
    if (!lastEdit) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      triggerRegenerate();
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [lastEdit, triggerRegenerate]);

  const list = bucket[view] || [];
  const visible = view === 'open' && !showLow
    ? list.filter(s => (s.relevance ?? 0) >= 40)
    : list;
  const lowCount = view === 'open'
    ? list.filter(s => (s.relevance ?? 0) < 40).length
    : 0;

  const openCard = (id) => { setOpenId(id); setPhase('detail'); };
  const backToList = () => { setOpenId(null); setPhase('list'); };

  const onSnooze = (id) => store.setSlice('suggestionDrawer', d =>
    snoozeSuggestion(d, scope, id));

  const onDismiss = (id) => store.setSlice('suggestionDrawer', d =>
    dismissSuggestion(d, scope, id));

  const onBoost = async (id) => {
    store.setSlice('suggestionDrawer', d =>
      boostSuggestion(d, scope, id));
    // Boost actually re-runs the deeper model.
    await triggerRegenerate({ boost: true });
  };

  const onAccept = ({ body, insertion }) => {
    const sg = bucket.open.find(s => s.id === openId);
    if (!sg) return;
    const ref = chapterId ? { chapterId } : null;
    store.setSlice('suggestionDrawer', d =>
      acceptSuggestion(d, scope, openId, ref));
    if (insertion === 'tray') {
      store.setSlice('pendingInsertions', xs => [...(xs || []), {
        suggestionId: sg.id, body, createdAt: Date.now(),
      }]);
    } else {
      // Hand off to the editor via a window event. Editor injects the staged span.
      window.dispatchEvent(new CustomEvent('lw:insert-staged', {
        detail: { suggestionId: sg.id, body },
      }));
    }
    backToList();
  };

  const accent = t.suggInk || t.warn;

  return (
    <aside style={{
      width: WIDTH, minWidth: 340, maxWidth: 480,
      background: t.sugg || t.paper,
      borderLeft: `1px solid ${t.rule}`,
      display: 'flex', flexDirection: 'column',
      animation: 'lw-slide-in 240ms ease',
      overflow: 'hidden',
    }}>
      <header style={{
        padding: '14px 16px 10px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        background: t.sugg || t.paper,
      }}>
        <div style={{ width: 4, alignSelf: 'stretch', background: accent, borderRadius: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: accent,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>Suggestions</div>
          <div style={{
            fontFamily: t.display, fontSize: 16, color: t.ink, fontWeight: 500,
            lineHeight: 1.2,
          }}>{scope ? scopeLabel(store, scope) : 'Whole-book'}</div>
        </div>
        <button title="Refresh" onClick={() => triggerRegenerate()} style={iconBtn(t)}>↻</button>
        <LockChip panelId="suggestions" accent={accent} />
        {onClose && <button onClick={onClose} aria-label="Close" style={iconBtn(t)}>×</button>}
      </header>

      {/* View tabs */}
      <div style={{
        padding: '8px 12px', display: 'flex', gap: 4,
        borderBottom: `1px solid ${t.rule}`, background: t.sugg || t.paper,
      }}>
        {['open', 'snoozed', 'accepted', 'dismissed'].map(v => {
          const count = (bucket[v] || []).length;
          const isActive = view === v;
          return (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '4px 8px',
              background: isActive ? t.paper2 : 'transparent',
              color: isActive ? t.ink : t.ink3,
              border: `1px solid ${isActive ? t.rule : 'transparent'}`,
              borderRadius: 999,
              fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
              textTransform: 'uppercase', cursor: 'pointer',
            }}>{v} · {count}</button>
          );
        })}
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {phase === 'list' && (
          <div style={{
            position: 'absolute', inset: 0, overflowY: 'auto',
            padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {loading && bucket.open.length === 0 && (
              <SkeletonRows t={t} />
            )}
            {error && (
              <div style={{
                padding: 12, background: t.paper2,
                border: `1px solid ${t.bad}55`, borderRadius: 2,
                fontFamily: t.display, fontSize: 13, color: t.bad,
              }}>
                Couldn't reach the model — <button onClick={() => triggerRegenerate()} style={{
                  background: 'transparent', border: 'none', color: t.bad,
                  textDecoration: 'underline', cursor: 'pointer',
                }}>retry?</button>
              </div>
            )}
            {!loading && visible.length === 0 && view === 'open' && !error && (
              <EmptyState t={t} onRefresh={() => triggerRegenerate()} />
            )}
            {visible.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onOpen={() => openCard(s.id)}
                onSnooze={() => onSnooze(s.id)}
                onDismiss={() => onDismiss(s.id)}
                onBoost={() => onBoost(s.id)}
              />
            ))}
            {view === 'open' && lowCount > 0 && (
              <button onClick={() => setShowLow(s => !s)} style={{
                margin: '6px auto', padding: '4px 10px',
                background: 'transparent', color: t.ink3,
                border: `1px dashed ${t.rule}`, borderRadius: 999,
                fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
                textTransform: 'uppercase', cursor: 'pointer',
              }}>{showLow ? 'Hide' : 'Show'} low-relevance ({lowCount})</button>
            )}
          </div>
        )}
        {phase === 'detail' && openId && (
          <DetailLayer
            suggestion={bucket.open.find(s => s.id === openId)}
            onBack={backToList}
            onAcceptStart={() => setPhase('wizard')}
            onSnooze={() => { onSnooze(openId); backToList(); }}
            onDismiss={() => { onDismiss(openId); backToList(); }}
            onBoost={() => onBoost(openId)}
            t={t}
          />
        )}
        {phase === 'wizard' && openId && (
          <AcceptWizard
            suggestion={bucket.open.find(s => s.id === openId)}
            defaultInsertion={store.profile?.suggestionPrefs?.defaultInsertion || 'cursor'}
            onConfirm={onAccept}
            onCancel={() => setPhase('detail')}
          />
        )}
      </div>
    </aside>
  );
}

function scopeLabel(state, ref) {
  if (!ref) return 'Whole-book';
  const list = ref.kind === 'character' ? state.cast
    : ref.kind === 'place' ? state.places
    : ref.kind === 'thread' ? state.quests
    : ref.kind === 'item' ? state.items
    : [];
  const e = (list || []).find(x => x.id === ref.id);
  return e?.name || e?.title || ref.kind;
}

function iconBtn(t) {
  return {
    width: 26, height: 26, borderRadius: 999, border: `1px solid ${t.rule}`,
    background: 'transparent', color: t.ink3, cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    fontFamily: t.mono, fontSize: 12, lineHeight: 1,
  };
}

function SkeletonRows({ t }) {
  return (
    <>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          padding: 12, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 4,
          opacity: 0.6,
        }}>
          <div style={{ width: 60, height: 8, background: t.rule, borderRadius: 2 }} />
          <div style={{ width: '70%', height: 12, background: t.rule, borderRadius: 2, marginTop: 8 }} />
          <div style={{ width: '90%', height: 8, background: t.rule, borderRadius: 2, marginTop: 6 }} />
        </div>
      ))}
    </>
  );
}

function EmptyState({ t, onRefresh }) {
  return (
    <div style={{
      padding: 24, textAlign: 'center', color: t.ink3,
      fontFamily: t.display, fontSize: 13, fontStyle: 'italic',
      lineHeight: 1.6,
    }}>
      No whispers yet. Save a chapter or refresh.
      <div style={{ marginTop: 12 }}>
        <button onClick={onRefresh} style={{
          padding: '6px 12px', background: 'transparent',
          color: t.suggInk || t.accent, border: `1px solid ${t.suggInk || t.rule}`,
          borderRadius: 999,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>Refresh</button>
      </div>
    </div>
  );
}

function DetailLayer({ suggestion, onBack, onAcceptStart, onSnooze, onDismiss, onBoost, t }) {
  if (!suggestion) {
    return <div style={{ padding: 24, color: t.ink3 }}>Suggestion gone.</div>;
  }
  return (
    <div style={{
      position: 'absolute', inset: 0, overflowY: 'auto',
      background: t.sugg || t.paper, color: t.ink,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
      animation: 'lw-slide-in 260ms cubic-bezier(.2,.7,.3,1)',
    }}>
      <button onClick={onBack} style={{
        alignSelf: 'flex-start', background: 'transparent', border: 'none',
        color: t.ink3, cursor: 'pointer',
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase',
      }}>← back</button>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.suggInk || t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase',
      }}>{suggestion.type}</div>
      <div style={{
        fontFamily: t.display, fontSize: 22, color: t.ink, fontWeight: 500, lineHeight: 1.2,
      }}>{suggestion.title}</div>
      {suggestion.preview && (
        <div style={{
          fontFamily: t.display, fontSize: 14, color: t.ink2,
          fontStyle: 'italic', lineHeight: 1.5,
        }}>{suggestion.preview}</div>
      )}
      <div style={{
        fontFamily: t.hand || "'Caveat', cursive",
        fontSize: 18, lineHeight: 1.5, color: t.suggInk || t.ink2,
        padding: '12px 14px', background: t.paper,
        border: `1px solid ${t.rule}`, borderLeft: `2px solid ${t.suggInk || t.warn}`,
        borderRadius: 2, whiteSpace: 'pre-wrap',
      }}>{suggestion.body}</div>
      {suggestion.provenance?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {suggestion.provenance.map((p, i) => (
            <span key={i} style={{
              padding: '2px 8px', background: 'transparent',
              border: `1px solid ${t.suggInk || t.ink3}55`, borderRadius: 999,
              fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1,
              color: t.suggInk || t.ink2,
            }}>{p.label}</span>
          ))}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onAcceptStart} style={{
          padding: '8px 16px', background: t.accent, color: t.onAccent,
          border: 'none', borderRadius: 2,
          fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14,
          textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
        }}>Accept →</button>
        <button onClick={onSnooze} style={ghost(t)}>Snooze</button>
        <button onClick={onDismiss} style={ghost(t)}>Dismiss</button>
        <span style={{ flex: 1 }} />
        <button onClick={onBoost} title="Boost — premium call" style={{
          padding: '6px 10px', background: 'transparent',
          color: suggestion.boosted ? t.accent : t.ink3,
          border: `1px solid ${suggestion.boosted ? t.accent : t.rule}`, borderRadius: 999,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>✦ {suggestion.boosted ? 'Boosted' : 'Boost'}</button>
      </div>
    </div>
  );
}

function ghost(t) {
  return {
    padding: '7px 12px', background: 'transparent', color: t.ink2,
    border: `1px solid ${t.rule}`, borderRadius: 2,
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
    textTransform: 'uppercase', cursor: 'pointer',
  };
}

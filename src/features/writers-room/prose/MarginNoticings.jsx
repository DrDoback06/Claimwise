// Loomwright — margin noticings (plan §7, §8). Cards stacked alongside prose.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import { suggest } from '../services/suggest';

const KIND_ACCENT = {
  character: PANEL_ACCENT.cast,
  place: PANEL_ACCENT.atlas,
  thread: PANEL_ACCENT.threads,
  item: PANEL_ACCENT.items,
  voice: PANEL_ACCENT.voice,
  grammar: PANEL_ACCENT.language,
  continuity: PANEL_ACCENT.atlas,
  spark: PANEL_ACCENT.loom,
};

export default function MarginNoticings({ onWalkThrough }) {
  const t = useTheme();
  const store = useStore();
  const activeId = store.ui?.activeChapterId || store.book?.currentChapterId;
  const chapter = activeId ? store.chapters?.[activeId] : null;
  const tweaks = store.ui?.tweaks || {};
  const visibility = tweaks.kindVisibility || {};

  const [items, setItems] = React.useState([]);
  const [running, setRunning] = React.useState(false);

  // Run suggest() on chapter text changes (debounced via chapter save's own 1.2s).
  React.useEffect(() => {
    if (!chapter?.text) { setItems([]); return; }
    let cancelled = false;
    setRunning(true);
    const ctx = {
      cast: store.cast, places: store.places, threads: store.threads,
      items: store.items, profile: store.profile,
    };
    suggest(chapter.text, ctx, { mode: 'idle' }).then(res => {
      if (!cancelled) {
        setItems(res);
        setRunning(false);
      }
    }).catch(() => {
      if (!cancelled) setRunning(false);
    });
    return () => { cancelled = true; };
  }, [chapter?.text, chapter?.id, store.cast, store.places, store.threads, store.items, store.profile]);

  if (!tweaks.showMargin) return null;

  const visible = items.filter(s => {
    const kind = ['character', 'place'].includes(s.kind) ? (s.kind === 'character' ? 'cast' : 'atlas') : s.kind;
    return visibility[kind] !== false;
  });

  return (
    <aside style={{
      width: 280, padding: '40px 16px',
      borderLeft: `1px solid ${t.rule}`, background: t.paper,
      overflowY: 'auto', flexShrink: 0,
    }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 12,
      }}>
        Margin · {running ? 'listening…' : `${visible.length} noticings`}
      </div>
      {visible.length === 0 && !running && (
        <div style={{
          fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
          lineHeight: 1.5, padding: '20px 0',
        }}>The Loom is listening. Keep writing — I'll mark anything worth a second look.</div>
      )}
      {visible.map(s => (
        <div key={s.id} className="lw-noticing" style={{
          marginBottom: 10, padding: 10,
          background: t.paper2, borderLeft: `2px solid ${KIND_ACCENT[s.kind] || t.accent}`,
          borderRadius: 1,
        }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
          }}>{s.kind}</div>
          <div style={{
            fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.5,
          }}>{s.proposal?.name || s.rationale}</div>
          {s.rationale && s.proposal?.name && (
            <div style={{
              fontSize: 11, color: t.ink2, fontStyle: 'italic',
              marginTop: 4, lineHeight: 1.5,
            }}>{s.rationale}</div>
          )}
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {(s.actions || []).includes('walk-through') && (
              <button onClick={() => onWalkThrough?.(s)} style={btnStyle(t)}>Walk me through it</button>
            )}
            <button
              onClick={() => {
                store.recordFeedback(s.kind, 'dismiss', { suggestionId: s.id });
                setItems(prev => prev.filter(x => x.id !== s.id));
              }}
              style={btnStyle(t, true)}>Dismiss</button>
          </div>
        </div>
      ))}
    </aside>
  );
}

function btnStyle(t, ghost) {
  return {
    padding: '4px 8px',
    background: ghost ? 'transparent' : t.accent,
    color: ghost ? t.ink3 : t.onAccent,
    border: ghost ? `1px solid ${t.rule}` : 'none',
    borderRadius: 1,
    fontFamily: t.mono, fontSize: 9,
    letterSpacing: 0.12, textTransform: 'uppercase',
    cursor: 'pointer',
  };
}

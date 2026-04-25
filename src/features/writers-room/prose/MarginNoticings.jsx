// Loomwright — margin noticings (plan §7, §8).

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

function kindToVisibilityKey(kind) {
  return kind === 'character' ? 'cast' : kind === 'place' ? 'atlas' : kind;
}

const MarginNoticings = React.forwardRef(function MarginNoticings({ onWalkThrough, onTethersChange }, ref) {
  const t = useTheme();
  const store = useStore();
  const activeId = store.ui?.activeChapterId || store.book?.currentChapterId;
  const chapter = activeId ? store.chapters?.[activeId] : null;
  const tweaks = store.ui?.tweaks || {};
  const visibility = tweaks.kindVisibility || {};

  const [items, setItems] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const [hovered, setHovered] = React.useState(null);
  const cardRefs = React.useRef({});
  const containerRef = React.useRef(null);

  React.useImperativeHandle(ref, () => ({ container: containerRef.current }));

  // Run suggest() on chapter text changes.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter?.text, chapter?.id]);

  const visible = React.useMemo(() => items.filter(s => visibility[kindToVisibilityKey(s.kind)] !== false), [items, visibility]);

  // Group by inferred paragraph (first that contains the suggestion's start
  // offset). For un-paragraphed suggestions, use a synthetic 'global' bucket.
  const grouped = React.useMemo(() => {
    const paragraphs = chapter?.paragraphs || [];
    const buckets = new Map();
    for (const s of visible) {
      const start = s.span?.start ?? null;
      let pid = 'global';
      if (start != null && paragraphs.length) {
        let cumulative = 0;
        for (const p of paragraphs) {
          const len = (p.text || '').length + 2;
          if (start <= cumulative + len) { pid = p.id; break; }
          cumulative += len;
        }
      }
      if (!buckets.has(pid)) buckets.set(pid, []);
      buckets.get(pid).push(s);
    }
    // Preserve paragraph order.
    const order = (paragraphs || []).map(p => p.id).concat(['global']);
    return order.filter(id => buckets.has(id)).map(id => ({ id, list: buckets.get(id) }));
  }, [visible, chapter]);

  const [expanded, setExpanded] = React.useState({});

  // Publish tethers up to the shell so it can draw curved paths.
  React.useEffect(() => {
    if (!onTethersChange) return;
    const tethers = visible.map(s => {
      const span = s.span || {};
      // Find the paragraph containing the start offset by scanning chapter paragraphs.
      const paragraphs = chapter?.paragraphs || [];
      let cumulative = 0, paragraphId = null;
      for (const p of paragraphs) {
        const len = (p.text || '').length + 2; // approx for the \n\n joiner
        if (span.start != null && span.start <= cumulative + len) { paragraphId = p.id; break; }
        cumulative += len;
      }
      const paragraphEl = paragraphId
        ? document.querySelector(`[data-paragraph-id="${paragraphId}"]`)
        : null;
      const cardEl = cardRefs.current[s.id];
      return {
        id: s.id, paragraphEl, cardEl,
        color: KIND_ACCENT[s.kind] || t.accent,
        hover: hovered === s.id,
      };
    });
    onTethersChange(tethers);
  }, [visible, hovered, chapter, onTethersChange, t.accent]);

  if (!tweaks.showMargin) return null;

  const dismiss = (s) => {
    store.recordFeedback(s.kind, 'dismiss', { suggestionId: s.id });
    setItems(prev => prev.filter(x => x.id !== s.id));
  };

  return (
    <aside ref={containerRef} style={{
      width: 280, padding: '40px 16px',
      borderLeft: `1px solid ${t.rule}`, background: t.paper,
      overflowY: 'auto', flexShrink: 0, position: 'relative',
    }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 12,
      }}>
        Margin · {running ? 'listening…' : `${visible.length} noticing${visible.length === 1 ? '' : 's'}`}
      </div>
      {visible.length === 0 && !running && (
        <div style={{
          fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
          lineHeight: 1.5, padding: '20px 0',
        }}>The Loom is listening. Keep writing — anything worth marking will surface here.</div>
      )}
      {grouped.map(g => {
        const expandedHere = expanded[g.id];
        const head = g.list[0];
        const overflow = g.list.length - 1;
        const renderCard = (s) => (
          <div key={s.id}
            ref={el => { if (el) cardRefs.current[s.id] = el; }}
            className="lw-noticing"
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              marginBottom: 10, padding: 10,
              background: hovered === s.id ? t.paper3 : t.paper2,
              borderLeft: `2px solid ${KIND_ACCENT[s.kind] || t.accent}`,
              borderRadius: 1,
              transition: 'background 120ms',
            }}>
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
            }}>{s.kind} · {Math.round((s.combined_score || s.confidence || 0) * 100)}%</div>
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
              <button onClick={() => dismiss(s)} style={btnStyle(t, true)}>Dismiss</button>
            </div>
          </div>
        );

        if (g.list.length <= 2 || expandedHere) {
          return (
            <React.Fragment key={g.id}>
              {g.list.map(renderCard)}
              {expandedHere && g.list.length > 2 && (
                <button onClick={() => setExpanded(s => ({ ...s, [g.id]: false }))} style={{
                  ...btnStyle(t), display: 'block', marginBottom: 10, width: '100%', textAlign: 'center',
                }}>collapse</button>
              )}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={g.id}>
            {renderCard(head)}
            <button onClick={() => setExpanded(s => ({ ...s, [g.id]: true }))} style={{
              ...btnStyle(t),
              display: 'block', width: '100%', marginBottom: 10, textAlign: 'center',
              borderStyle: 'dashed', color: t.ink2,
            }}>+ {overflow} more on this paragraph</button>
          </React.Fragment>
        );
      })}
    </aside>
  );
});

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

export default MarginNoticings;

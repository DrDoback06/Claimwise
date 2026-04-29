// Loomwright — margin noticings (plan §7, §8).
// 2026-04 design refresh adds Margin Extraction Layer 1 chips per paragraph
// (CODE-INSIGHT §4) — ambient AI-detected new entities, one-click commit.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore, createCharacter, createPlace, createThread, createItem } from '../store';
import { suggest } from '../services/suggest';
import { detectInParagraph } from '../services/marginExtract';

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
      cast: store.cast, places: store.places, threads: store.quests,
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

  // ── Margin Extraction Layer 1 (CODE-INSIGHT §4) ─────────────────────
  // Free-model detection per paragraph, debounced 600ms after the writer
  // stops typing. Results live in the ephemeral `marginDetections` slice.
  const marginAuto = tweaks.atlasAuto !== 'off' && visibility.entity !== false;
  const detections = store.marginDetections || {};
  const lastTextByParagraph = React.useRef({});
  const idleTimers = React.useRef({});

  React.useEffect(() => {
    if (!marginAuto) return;
    const paragraphs = chapter?.paragraphs || [];
    const known = [
      ...(store.cast || []).map(c => ({ kind: 'character', name: c.name })),
      ...(store.places || []).map(p => ({ kind: 'place', name: p.name })),
      ...(store.items || []).map(i => ({ kind: 'item', name: i.name })),
      ...(store.quests || []).map(t => ({ kind: 'thread', name: t.title || t.name })),
    ].filter(e => e.name);

    paragraphs.forEach((p, i) => {
      if (!p?.id || !p?.text) return;
      if (lastTextByParagraph.current[p.id] === p.text) return;
      clearTimeout(idleTimers.current[p.id]);
      idleTimers.current[p.id] = setTimeout(async () => {
        lastTextByParagraph.current[p.id] = p.text;
        const before = i > 0 ? paragraphs[i - 1]?.text : '';
        const after = i < paragraphs.length - 1 ? paragraphs[i + 1]?.text : '';
        const found = await detectInParagraph({
          paragraphId: p.id, text: p.text,
          contextBefore: before, contextAfter: after,
          knownEntities: known,
        });
        store.setSlice('marginDetections', m => ({ ...(m || {}), [p.id]: found || [] }));
      }, 600);
    });
    return () => {
      Object.values(idleTimers.current).forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter?.id, JSON.stringify((chapter?.paragraphs || []).map(p => ({ id: p.id, text: p.text }))), marginAuto]);

  const commitDetection = (paragraphId, det) => {
    const helper = { setSlice: store.setSlice };
    let id = null;
    const patch = { name: det.suggestedName, draftedByLoom: true };
    if (det.kind === 'character') id = createCharacter(helper, patch);
    else if (det.kind === 'place') id = createPlace(helper, patch);
    else if (det.kind === 'item') id = createItem(helper, patch);
    else if (det.kind === 'thread') id = createThread(helper, { title: det.suggestedName, ...patch });
    // Drop the detection chip.
    store.setSlice('marginDetections', m => ({
      ...(m || {}),
      [paragraphId]: (m?.[paragraphId] || []).filter(d => d !== det),
    }));
    return id;
  };

  const dismissDetection = (paragraphId, det) => {
    store.setSlice('marginDetections', m => ({
      ...(m || {}),
      [paragraphId]: (m?.[paragraphId] || []).filter(d => d !== det),
    }));
  };

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
      {visible.length === 0 && !running && Object.values(detections).every(d => !d?.length) && (
        <div style={{
          fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
          lineHeight: 1.5, padding: '20px 0',
        }}>The Loom is listening. Keep writing — anything worth marking will surface here.</div>
      )}

      {marginAuto && Object.entries(detections).map(([pid, list]) => {
        if (!list?.length) return null;
        return (
          <div key={'det_' + pid} style={{
            marginBottom: 10,
            padding: '6px 8px',
            background: 'transparent',
            borderLeft: `2px dashed ${PANEL_ACCENT.loom}`,
          }}>
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: PANEL_ACCENT.loom,
              letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
            }}>Spotted in this paragraph</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {list.map((det, i) => (
                <DetectionChip
                  key={pid + '_' + i + '_' + det.suggestedName}
                  detection={det}
                  t={t}
                  onAdd={() => commitDetection(pid, det)}
                  onDismiss={() => dismissDetection(pid, det)}
                />
              ))}
            </div>
          </div>
        );
      })}
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

function DetectionChip({ detection: d, t, onAdd, onDismiss }) {
  const accent = d.kind === 'character' ? PANEL_ACCENT.cast
    : d.kind === 'place' ? PANEL_ACCENT.atlas
    : d.kind === 'item' ? PANEL_ACCENT.items
    : d.kind === 'thread' ? PANEL_ACCENT.threads
    : t.accent;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 4px 2px 6px',
      background: t.paper2, border: `1px solid ${accent}55`, borderRadius: 999,
      fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
      animation: 'lw-margin-chip-in 150ms ease-out',
    }}>
      <span style={{ color: accent, textTransform: 'uppercase' }}>{d.kind}</span>
      <span style={{ color: t.ink, fontFamily: t.display, fontSize: 11 }}>{d.suggestedName}</span>
      <button onClick={onAdd} title="Add to canon" style={{
        padding: '2px 6px', background: accent, color: t.onAccent,
        border: 'none', borderRadius: 999,
        fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
        textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
      }}>+ Add</button>
      <button onClick={onDismiss} aria-label="Dismiss" style={{
        background: 'transparent', border: 'none', color: t.ink3,
        cursor: 'pointer', padding: '0 2px', fontSize: 11, lineHeight: 1,
      }}>×</button>
    </span>
  );
}

export default MarginNoticings;

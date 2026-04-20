/**
 * InlineSuggestions - Google-Docs-style inline suggestions for the
 * Writer's Room (M33).
 *
 * Mirrors the current chapter textarea with a transparent-text overlay
 * and draws clickable highlighted spans over:
 *   - Language issues from `languageService.lintText` (dashed underline
 *     in the kind's colour).
 *   - Weaver chapter proposals with before/after text (subtle purple
 *     fill; click to accept/reject).
 *
 * Accepting a language issue replaces the flagged text with the first
 * suggestion using the native textarea setter so React's controlled
 * value logic picks it up. A single Accept is undoable with Ctrl+Z
 * because we dispatch a normal 'input' event.
 *
 * Supersedes the popup-menu-on-selection pattern by letting users hover
 * any highlight to surface the action popover.
 *
 * Thesaurus menu (right-click a single word) stays here so the Writer's
 * Room only needs one overlay.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Trash2, HelpCircle } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import { lintText, LANGUAGE_KINDS } from '../../services/languageService';
import { synonymsFor } from '../../services/wikiDictionary';

const WEAVER_COLOR = '#8b5cf6';

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replaceRange(target, start, end, replacement) {
  if (!target) return;
  const text = target.value || '';
  const next = text.slice(0, start) + replacement + text.slice(end);
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value',
  )?.set;
  if (setter) setter.call(target, next);
  else target.value = next;
  target.dispatchEvent(new Event('input', { bubbles: true }));
  // Place cursor at end of the inserted replacement.
  const pos = start + replacement.length;
  target.setSelectionRange?.(pos, pos);
}

function coalesce(ranges) {
  const sorted = [...ranges].sort((a, b) => a.offset - b.offset);
  const out = [];
  sorted.forEach((r) => {
    const prev = out[out.length - 1];
    if (prev && r.offset < prev.offset + prev.length) return; // drop overlap
    out.push(r);
  });
  return out;
}

function renderMirror(text, ranges) {
  if (!ranges.length) return escapeHtml(text) + '\u200b';
  const parts = [];
  let cursor = 0;
  ranges.forEach((r) => {
    if (r.offset > cursor) {
      parts.push(escapeHtml(text.slice(cursor, r.offset)));
    }
    const frag = text.slice(r.offset, r.offset + r.length);
    const payload = JSON.stringify({ id: r.id });
    const color = r.color || '#c76b5a';
    const bg = r.bg || 'transparent';
    const style =
      r.type === 'weaver'
        ? `background: ${bg}; border-bottom: 2px solid ${color};`
        : `border-bottom: 2px dashed ${color};`;
    parts.push(
      `<span class="lw-is-range" data-lw-range='${escapeHtml(payload)}' style="${style} color: inherit; cursor: pointer; pointer-events: auto;">${escapeHtml(frag)}</span>`,
    );
    cursor = r.offset + r.length;
  });
  if (cursor < text.length) parts.push(escapeHtml(text.slice(cursor)));
  return `${parts.join('')}\u200b`;
}

export default function InlineSuggestions({
  scopeSelector = '.lw-writer-surface',
  worldState,
  weaverProposals = [], // [{ id, offset, length, before, after, message }]
  onAcceptWeaver,
  onRejectWeaver,
}) {
  const t = useTheme();
  const [target, setTarget] = useState(null);
  const [issues, setIssues] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [hover, setHover] = useState(null); // { rangeId, x, y }
  const [thesaurus, setThesaurus] = useState(null); // { word, x, y }
  const mirrorRef = useRef(null);
  const hostRef = useRef(null);

  // Locate the editor textarea.
  useEffect(() => {
    const find = () => {
      const scope = document.querySelector(scopeSelector);
      const ta = scope?.querySelector('textarea');
      setTarget((prev) => (prev === ta ? prev : ta || null));
    };
    find();
    const interval = setInterval(find, 800);
    return () => clearInterval(interval);
  }, [scopeSelector]);

  // Lint on change.
  useEffect(() => {
    if (!target) return undefined;
    let timer = null;
    const relint = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const text = target.value || '';
          setIssues(lintText(text, { worldState }));
        } catch {
          setIssues([]);
        }
      }, 220);
    };
    relint();
    target.addEventListener('input', relint);
    window.addEventListener('resize', relint);
    return () => {
      target.removeEventListener('input', relint);
      window.removeEventListener('resize', relint);
      clearTimeout(timer);
    };
  }, [target, worldState]);

  // Keep mirror scroll in sync.
  useEffect(() => {
    if (!target) return undefined;
    const sync = () => {
      if (mirrorRef.current) {
        mirrorRef.current.scrollTop = target.scrollTop;
        mirrorRef.current.scrollLeft = target.scrollLeft;
      }
    };
    target.addEventListener('scroll', sync);
    return () => target.removeEventListener('scroll', sync);
  }, [target]);

  const combinedRanges = useMemo(() => {
    const out = [];
    issues.forEach((iss, i) => {
      const id = `lang_${i}_${iss.offset}_${iss.length}`;
      if (dismissed.has(id)) return;
      out.push({
        id, type: 'language', offset: iss.offset, length: iss.length,
        color: LANGUAGE_KINDS[iss.kind]?.color || '#c76b5a',
        kind: iss.kind,
        message: iss.message,
        suggestions: iss.suggestions || [],
      });
    });
    weaverProposals.forEach((p) => {
      if (dismissed.has(p.id)) return;
      if (typeof p.offset !== 'number' || typeof p.length !== 'number') return;
      out.push({
        id: p.id, type: 'weaver',
        offset: p.offset, length: p.length,
        color: WEAVER_COLOR,
        bg: 'rgba(139, 92, 246, 0.18)',
        before: p.before, after: p.after,
        message: p.message,
      });
    });
    return coalesce(out);
  }, [issues, dismissed, weaverProposals]);

  const byId = useMemo(() => {
    const m = new Map();
    combinedRanges.forEach((r) => m.set(r.id, r));
    return m;
  }, [combinedRanges]);

  const onRangeClick = useCallback((e) => {
    const el = e.target.closest('.lw-is-range');
    if (!el) return;
    const data = el.getAttribute('data-lw-range');
    try {
      const { id } = JSON.parse(data || '{}');
      const rect = el.getBoundingClientRect();
      setHover({ rangeId: id, x: rect.left, y: rect.bottom });
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    host.addEventListener('click', onRangeClick);
    return () => host.removeEventListener('click', onRangeClick);
  }, [onRangeClick]);

  const accept = (range) => {
    if (!target || !range) return;
    if (range.type === 'language') {
      const replacement = range.suggestions?.[0];
      if (!replacement) return;
      replaceRange(target, range.offset, range.offset + range.length, replacement);
      setDismissed((d) => { const n = new Set(d); n.add(range.id); return n; });
    } else if (range.type === 'weaver') {
      if (range.after != null) {
        replaceRange(target, range.offset, range.offset + range.length, String(range.after));
      }
      onAcceptWeaver?.(range.id);
      setDismissed((d) => { const n = new Set(d); n.add(range.id); return n; });
    }
    setHover(null);
  };

  const dismiss = (range) => {
    if (!range) return;
    setDismissed((d) => { const n = new Set(d); n.add(range.id); return n; });
    if (range.type === 'weaver') onRejectWeaver?.(range.id);
    setHover(null);
  };

  // Thesaurus on right-click word.
  useEffect(() => {
    if (!target) return undefined;
    const handler = (e) => {
      const sel = window.getSelection();
      const selectedText = String(sel?.toString() || '').trim();
      if (!selectedText || /\s/.test(selectedText)) return;
      if (selectedText.length < 3) return;
      e.preventDefault();
      setThesaurus({ word: selectedText, x: e.clientX, y: e.clientY });
    };
    target.addEventListener('contextmenu', handler);
    return () => target.removeEventListener('contextmenu', handler);
  }, [target]);

  const insertSynonym = (syn) => {
    if (!target || !thesaurus) return;
    const { selectionStart, selectionEnd } = target;
    if (selectionStart !== selectionEnd) {
      replaceRange(target, selectionStart, selectionEnd, syn);
    } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(syn);
    }
    setThesaurus(null);
  };

  const rect = target?.getBoundingClientRect();
  const mirrorStyle = useMemo(() => {
    if (!target) return null;
    const cs = window.getComputedStyle(target);
    return {
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%',
      padding: cs.padding,
      border: cs.border,
      boxSizing: cs.boxSizing,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      overflow: 'hidden',
      pointerEvents: 'none',
      color: 'transparent',
      background: 'transparent',
    };
  }, [target]);

  const hoverRange = hover ? byId.get(hover.rangeId) : null;

  return (
    <>
      {target && mirrorStyle && (
        <div
          ref={hostRef}
          aria-hidden
          className="lw-z-toolbar"
          style={{
            position: 'fixed',
            left: rect?.left || 0,
            top: rect?.top || 0,
            width: rect?.width || 0,
            height: rect?.height || 0,
            pointerEvents: 'none',
          }}
        >
          <div
            ref={mirrorRef}
            style={mirrorStyle}
            dangerouslySetInnerHTML={{
              __html: renderMirror(target.value || '', combinedRanges),
            }}
          />
        </div>
      )}

      {/* Action popover for a highlighted range. */}
      {hoverRange && (
        <div
          className="lw-z-popover"
          style={{
            position: 'fixed',
            left: Math.min(hover.x, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 320),
            top: Math.min(hover.y + 6, (typeof window !== 'undefined' ? window.innerHeight : 768) - 200),
            width: 300,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            boxShadow: '0 14px 30px rgba(0,0,0,0.35)',
            padding: 12,
            fontFamily: t.font,
            fontSize: 12,
            color: t.ink,
          }}
          onMouseLeave={() => setHover(null)}
        >
          <div
            style={{
              fontFamily: t.mono, fontSize: 9,
              color: hoverRange.color || t.accent,
              letterSpacing: 0.18, textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {hoverRange.type === 'weaver' ? 'Weaver proposal' : (hoverRange.kind || 'Suggestion')}
          </div>
          <div style={{ color: t.ink2, marginBottom: 8, lineHeight: 1.5 }}>
            {hoverRange.message || 'Suggested change'}
          </div>
          {hoverRange.type === 'language' && hoverRange.suggestions?.[0] && (
            <div
              style={{
                padding: '6px 8px', marginBottom: 8,
                background: t.bg, border: `1px solid ${t.rule}`,
                borderRadius: t.radius, color: t.ink,
              }}
            >
              &rarr; <strong>{hoverRange.suggestions[0]}</strong>
            </div>
          )}
          {hoverRange.type === 'weaver' && hoverRange.after && (
            <div
              style={{
                padding: '6px 8px', marginBottom: 8,
                background: t.bg, border: `1px solid ${t.rule}`,
                borderRadius: t.radius, color: t.ink,
                maxHeight: 90, overflow: 'auto',
                fontStyle: 'italic',
              }}
            >
              {String(hoverRange.after).slice(0, 200)}
              {String(hoverRange.after).length > 200 ? '...' : ''}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            {(hoverRange.type === 'weaver' || hoverRange.suggestions?.[0]) && (
              <button
                type="button"
                onClick={() => accept(hoverRange)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px',
                  background: t.accent, color: t.onAccent,
                  border: `1px solid ${t.accent}`, borderRadius: t.radius,
                  fontFamily: t.mono, fontSize: 10,
                  letterSpacing: 0.14, textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                <Check size={11} /> Accept
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss(hoverRange)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px',
                background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={11} /> Dismiss
            </button>
            <button
              type="button"
              onClick={() => {
                alert(hoverRange.message || 'No explanation available.');
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px',
                background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              title="Explain this suggestion"
              aria-label="Explain this suggestion"
            >
              <HelpCircle size={11} /> Explain
            </button>
          </div>
        </div>
      )}

      {/* Thesaurus */}
      {thesaurus && (() => {
        const syns = synonymsFor(thesaurus.word);
        return (
          <div
            className="lw-z-popover"
            style={{
              position: 'fixed',
              top: Math.min(thesaurus.y, (typeof window !== 'undefined' ? window.innerHeight : 768) - 200),
              left: Math.min(thesaurus.x, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 260),
              width: 240,
              background: t.paper,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              padding: 10,
              boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
            }}
            onMouseLeave={() => setThesaurus(null)}
          >
            <div
              style={{
                fontFamily: t.mono, fontSize: 10, color: t.accent,
                letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6,
              }}
            >
              Synonyms for &ldquo;{thesaurus.word}&rdquo;
            </div>
            {syns.length === 0 ? (
              <div style={{ color: t.ink3, fontSize: 11 }}>
                No entries for this word yet.
              </div>
            ) : (
              syns.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => insertSynonym(s)}
                  style={{
                    display: 'block', width: '100%',
                    padding: '6px 8px', marginBottom: 2,
                    background: 'transparent', color: t.ink,
                    border: `1px solid ${t.rule}`, borderRadius: t.radius,
                    fontFamily: t.display, fontSize: 13,
                    textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))
            )}
            <div style={{ marginTop: 6, fontSize: 10, color: t.ink3 }}>
              Click to replace selection &middot; voice-sorted
            </div>
          </div>
        );
      })()}

      {/* Issue count footer. */}
      {target && combinedRanges.length > 0 && (
        <div
          className="lw-z-toolbar"
          style={{
            position: 'fixed', right: 16, bottom: 16,
            padding: '6px 10px',
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            display: 'flex', gap: 10,
            fontFamily: t.mono, fontSize: 10,
            letterSpacing: 0.12, textTransform: 'uppercase',
            color: t.ink2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {Object.entries(LANGUAGE_KINDS).map(([k, meta]) => {
            const count = combinedRanges.filter((r) => r.type === 'language' && r.kind === k).length;
            if (count === 0) return null;
            return (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 2, background: meta.color }} />
                {meta.label}: {count}
              </span>
            );
          })}
          {combinedRanges.some((r) => r.type === 'weaver') && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 2, background: WEAVER_COLOR }} />
              Weaver: {combinedRanges.filter((r) => r.type === 'weaver').length}
            </span>
          )}
        </div>
      )}
    </>
  );
}

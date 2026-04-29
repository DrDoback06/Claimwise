/**
 * InlineSquiggles - overlays coloured underlines on issues in a text area.
 *
 * Works against any `<textarea>` inside the scope selector. The technique:
 *   1. Build a mirror `<div>` with identical typography + padding + size.
 *   2. Inject the textarea content with issue ranges wrapped in <span>s
 *      that carry a bottom dashed border in the issue's kind-colour.
 *   3. Position the mirror absolutely behind the textarea, syncing scroll.
 *
 * This is a zero-dep approach that avoids rewriting WritingCanvasPro's
 * textarea into a contentEditable. If the editor is not a textarea the
 * overlay becomes a no-op (InlineSquiggles looks for `textarea` inside
 * the scope selector).
 *
 * On right-click over a word the Thesaurus menu opens with voice-aware
 * synonyms.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../loomwright/theme';
import { lintText, LANGUAGE_KINDS } from '../../services/languageService';
import { synonymsFor } from '../../services/wikiDictionary';

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMirror(text, issues, colorsForKind) {
  if (!issues.length) return escapeHtml(text) + '\u200b';
  const parts = [];
  let cursor = 0;
  issues
    .slice()
    .sort((a, b) => a.offset - b.offset)
    .forEach((iss) => {
      if (iss.offset < cursor) return; // overlap - skip
      if (iss.offset > cursor) {
        parts.push(escapeHtml(text.slice(cursor, iss.offset)));
      }
      const frag = text.slice(iss.offset, iss.offset + iss.length);
      const color = colorsForKind[iss.kind]?.color || '#c76b5a';
      parts.push(
        `<span style="border-bottom: 2px dashed ${color};">${escapeHtml(frag)}</span>`,
      );
      cursor = iss.offset + iss.length;
    });
  if (cursor < text.length) parts.push(escapeHtml(text.slice(cursor)));
  return `${parts.join('')}\u200b`;
}

export default function InlineSquiggles({
  scopeSelector = '.lw-writer-surface',
  worldState,
}) {
  const t = useTheme();
  const [target, setTarget] = useState(null);
  const [issues, setIssues] = useState([]);
  const [hoverIssue, setHoverIssue] = useState(null);
  const [thesaurus, setThesaurus] = useState(null); // { word, x, y }
  const mirrorRef = useRef(null);

  // Attach to the first textarea inside the scope
  useEffect(() => {
    const find = () => {
      const scope = document.querySelector(scopeSelector);
      const ta = scope?.querySelector('textarea');
      setTarget(ta || null);
    };
    find();
    const interval = setInterval(find, 800);
    return () => clearInterval(interval);
  }, [scopeSelector]);

  // Lint on change (debounced)
  useEffect(() => {
    if (!target) return;
    let timer = null;
    const relint = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const text = target.value || '';
          setIssues(lintText(text, { worldState }));
        } catch (e) {
          console.warn('[InlineSquiggles] lint failed:', e);
          setIssues([]);
        }
      }, 250);
    };
    relint();
    target.addEventListener('input', relint);
    target.addEventListener('scroll', syncScroll);
    window.addEventListener('resize', relint);
    return () => {
      target.removeEventListener('input', relint);
      target.removeEventListener('scroll', syncScroll);
      window.removeEventListener('resize', relint);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, worldState]);

  const syncScroll = () => {
    if (mirrorRef.current && target) {
      mirrorRef.current.scrollTop = target.scrollTop;
      mirrorRef.current.scrollLeft = target.scrollLeft;
    }
  };

  const contextHandler = (e) => {
    if (!target) return;
    const sel = window.getSelection();
    const selectedText = String(sel?.toString() || '').trim();
    if (!selectedText || /\s/.test(selectedText)) return; // single word only
    if (selectedText.length < 3) return;
    e.preventDefault();
    setThesaurus({
      word: selectedText,
      x: e.clientX,
      y: e.clientY,
    });
  };

  useEffect(() => {
    if (!target) return undefined;
    target.addEventListener('contextmenu', contextHandler);
    return () => target.removeEventListener('contextmenu', contextHandler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const insertSynonym = (syn) => {
    if (!target || !thesaurus) return;
    const { selectionStart, selectionEnd } = target;
    const text = target.value;
    if (selectionStart !== selectionEnd) {
      const next = text.slice(0, selectionStart) + syn + text.slice(selectionEnd);
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(target, next);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // No range selected, just copy to clipboard.
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(syn);
      }
    }
    setThesaurus(null);
  };

  const rect = target?.getBoundingClientRect();

  // Compute mirror styles from the textarea's computed styles
  const mirrorStyle = useMemo(() => {
    if (!target) return null;
    const cs = window.getComputedStyle(target);
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
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
      zIndex: 1,
      background: 'transparent',
    };
  }, [target, issues.length]);

  return (
    <>
      {target && mirrorStyle && (
        <div
          ref={mirrorRef}
          aria-hidden
          style={{
            position: 'fixed',
            left: rect?.left || 0,
            top: rect?.top || 0,
            width: rect?.width || 0,
            height: rect?.height || 0,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <div
            style={mirrorStyle}
            dangerouslySetInnerHTML={{ __html: renderMirror(target.value || '', issues, LANGUAGE_KINDS) }}
          />
        </div>
      )}

      {/* Mini legend + counts */}
      {target && issues.length > 0 && (
        <div
          style={{
            position: 'fixed', right: 16, bottom: 16,
            zIndex: 40,
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
          onMouseEnter={() => setHoverIssue(true)}
          onMouseLeave={() => setHoverIssue(false)}
        >
          {Object.entries(LANGUAGE_KINDS).map(([k, meta]) => {
            const count = issues.filter((i) => i.kind === k).length;
            if (count === 0) return null;
            return (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 2, background: meta.color }} />
                {meta.label}: {count}
              </span>
            );
          })}
          {hoverIssue && issues.length > 0 && (
            <div
              style={{
                position: 'absolute', bottom: '100%', right: 0, marginBottom: 6,
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                padding: 10,
                maxWidth: 360,
                maxHeight: 240,
                overflowY: 'auto',
                color: t.ink,
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              {issues.slice(0, 10).map((iss, i) => (
                <div
                  key={i}
                  style={{
                    padding: '4px 0',
                    fontSize: 11,
                    borderBottom: i < 9 ? `1px solid ${t.rule}` : 'none',
                  }}
                >
                  <span style={{ color: LANGUAGE_KINDS[iss.kind]?.color || t.ink2 }}>
                    {iss.kind}:
                  </span>{' '}
                  {iss.message}
                  {iss.suggestions?.[0] && (
                    <span style={{ color: t.ink3, fontStyle: 'italic' }}>
                      {' '}&rarr; &ldquo;{iss.suggestions[0]}&rdquo;
                    </span>
                  )}
                </div>
              ))}
              {issues.length > 10 && (
                <div style={{ marginTop: 4, fontSize: 10, color: t.ink3 }}>
                  + {issues.length - 10} more
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Thesaurus popup */}
      {thesaurus && (() => {
        const syns = synonymsFor(thesaurus.word);
        return (
          <div
            style={{
              position: 'fixed',
              top: Math.min(thesaurus.y, window.innerHeight - 200),
              left: Math.min(thesaurus.x, window.innerWidth - 260),
              width: 240,
              background: t.paper,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              padding: 10,
              zIndex: 90,
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
                    border: `1px solid ${t.rule}`,
                    borderRadius: t.radius,
                    fontFamily: t.display, fontSize: 13,
                    textAlign: 'left', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.paper2; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
    </>
  );
}

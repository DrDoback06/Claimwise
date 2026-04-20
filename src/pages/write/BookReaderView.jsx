/**
 * BookReaderView - a full-book reader that lists every chapter in order with
 * collapsible content. The user asked for a way to "see all the chapters
 * together and expand them to read them - basically like a book reader page".
 *
 * Lives inside the Write drawer set (see `pages/Write.jsx`). It pulls directly
 * from IndexedDB so it always reflects the latest saved content, including
 * chapters created via the + New Chapter button in WritingCanvasPro.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Maximize2, Minimize2 } from 'lucide-react';
import db from '../../services/database';
import { useTheme } from '../../loomwright/theme';

function wordCount(s) {
  if (!s) return 0;
  const m = String(s).trim().match(/\S+/g);
  return m ? m.length : 0;
}

function paragraphs(s) {
  if (!s) return [];
  return String(s).split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
}

export default function BookReaderView({ bookId, onClose }) {
  const t = useTheme();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(() => new Set());
  const [continuous, setContinuous] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = bookId ? await db.get('books', bookId) : null;
        if (!cancelled) {
          setBook(loaded || null);
          // Start with every chapter collapsed; opening a chapter is cheap.
          setExpanded(new Set());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookId]);

  const chapters = useMemo(() => {
    const list = Array.isArray(book?.chapters) ? [...book.chapters] : [];
    list.sort((a, b) => {
      const na = Number(a?.number ?? a?.id ?? 0);
      const nb = Number(b?.number ?? b?.id ?? 0);
      return na - nb;
    });
    return list;
  }, [book]);

  const totalWords = useMemo(
    () => chapters.reduce((sum, c) => sum + wordCount(c?.content || c?.script || ''), 0),
    [chapters]
  );

  const toggle = (chapterId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(chapters.map((c) => c.id)));
  const collapseAll = () => setExpanded(new Set());

  if (loading) {
    return (
      <div style={{ padding: 24, color: t.ink2, fontFamily: t.mono, fontSize: 12 }}>
        Loading book&hellip;
      </div>
    );
  }

  if (!book) {
    return (
      <div style={{ padding: 24, color: t.ink2, fontFamily: t.mono, fontSize: 12 }}>
        No book selected.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: t.paper,
        color: t.ink,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderBottom: `1px solid ${t.rule}`,
          background: t.sidebar,
          flexShrink: 0,
        }}
      >
        <BookOpen size={16} style={{ color: t.accent }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: t.display, fontSize: 16, fontWeight: 500 }}>
            {book.title || 'Untitled Book'}
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12 }}>
            {chapters.length} chapter{chapters.length === 1 ? '' : 's'} &middot;{' '}
            {totalWords.toLocaleString()} words
          </div>
        </div>
        <button
          type="button"
          onClick={continuous ? collapseAll : expandAll}
          style={toolbarButtonStyle(t)}
          title={continuous ? 'Collapse all chapters' : 'Expand all chapters'}
        >
          {continuous ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          {continuous ? 'Collapse all' : 'Expand all'}
        </button>
        <button
          type="button"
          onClick={() => {
            const next = !continuous;
            setContinuous(next);
            setExpanded(next ? new Set(chapters.map((c) => c.id)) : new Set());
          }}
          style={toolbarButtonStyle(t, continuous)}
          title="Continuous scroll mode expands every chapter at once"
        >
          Continuous
        </button>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            style={{ ...toolbarButtonStyle(t), color: t.ink2 }}
          >
            Close
          </button>
        ) : null}
      </div>

      {/* Chapter list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 24px 40px' }}>
        {chapters.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: t.ink2, fontSize: 13 }}>
            This book has no chapters yet. Use the + New Chapter button in the Writer&rsquo;s Room to add one.
          </div>
        ) : (
          chapters.map((chapter) => {
            const id = chapter.id;
            const open = expanded.has(id) || continuous;
            const content = chapter.content || chapter.script || '';
            const count = wordCount(content);
            return (
              <article
                key={id}
                style={{
                  marginBottom: 16,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  background: t.bg,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: t.ink,
                    textAlign: 'left',
                    borderBottom: open ? `1px solid ${t.rule}` : 'none',
                  }}
                >
                  {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: t.display, fontSize: 15, fontWeight: 500 }}>
                      {chapter.title || `Chapter ${chapter.number || chapter.id}`}
                    </div>
                    {chapter.desc ? (
                      <div style={{ fontSize: 12, color: t.ink2, marginTop: 2 }}>
                        {chapter.desc}
                      </div>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontFamily: t.mono, fontSize: 10, color: t.ink3,
                      letterSpacing: 0.12, textTransform: 'uppercase',
                    }}
                  >
                    {count.toLocaleString()} w
                  </div>
                </button>
                {open ? (
                  <div style={{ padding: '18px 26px 24px', maxWidth: 780 }}>
                    {paragraphs(content).length === 0 ? (
                      <p style={{ color: t.ink3, fontStyle: 'italic' }}>
                        (This chapter is empty.)
                      </p>
                    ) : (
                      paragraphs(content).map((para, i) => (
                        <p
                          key={i}
                          style={{
                            margin: '0 0 12px',
                            fontSize: 15,
                            lineHeight: 1.7,
                            color: t.ink,
                          }}
                        >
                          {para}
                        </p>
                      ))
                    )}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function toolbarButtonStyle(t, active = false) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 9px',
    background: active ? t.accentSoft : 'transparent',
    color: active ? t.ink : t.ink2,
    border: `1px solid ${active ? t.accent : t.rule}`,
    borderRadius: t.radius,
    cursor: 'pointer',
    fontFamily: t.mono,
    fontSize: 10,
    letterSpacing: 0.12,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };
}

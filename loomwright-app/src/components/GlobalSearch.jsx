/**
 * GlobalSearch — Cmd+K palette for Loomwright.
 *
 * Searches actors, items, skills and chapters and emits a result hit of the
 * shape { type, id, bookId? } to the caller's `onNavigate` handler (App.js
 * maps that to the right tab + selection state).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Users, Briefcase, Zap } from 'lucide-react';
import { useTheme } from '../loomwright/theme';

const TYPE_META = {
  actor: { label: 'Cast', icon: Users },
  item: { label: 'Item', icon: Briefcase },
  skill: { label: 'Skill', icon: Zap },
  chapter: { label: 'Chapter', icon: FileText },
};

export default function GlobalSearch({ isOpen, onClose, onNavigate, worldState }) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    const found = [];

    worldState.actors?.forEach((actor) => {
      const hit =
        actor.name?.toLowerCase().includes(q) ||
        actor.desc?.toLowerCase().includes(q) ||
        actor.class?.toLowerCase().includes(q);
      if (hit) {
        found.push({ type: 'actor', id: actor.id, name: actor.name, subtitle: actor.class || 'Actor' });
      }
    });

    worldState.itemBank?.forEach((item) => {
      const hit =
        item.name?.toLowerCase().includes(q) ||
        item.desc?.toLowerCase().includes(q) ||
        item.type?.toLowerCase().includes(q);
      if (hit) {
        found.push({ type: 'item', id: item.id, name: item.name, subtitle: item.type || 'Item' });
      }
    });

    worldState.skillBank?.forEach((skill) => {
      const hit =
        skill.name?.toLowerCase().includes(q) ||
        skill.desc?.toLowerCase().includes(q) ||
        skill.type?.toLowerCase().includes(q);
      if (hit) {
        found.push({ type: 'skill', id: skill.id, name: skill.name, subtitle: skill.type || 'Skill' });
      }
    });

    Object.values(worldState.books || {}).forEach((book) => {
      book.chapters?.forEach((chapter) => {
        const hit =
          chapter.title?.toLowerCase().includes(q) ||
          chapter.desc?.toLowerCase().includes(q) ||
          chapter.script?.toLowerCase().includes(q);
        if (hit) {
          found.push({
            type: 'chapter',
            id: chapter.id,
            name: chapter.title || `Chapter ${chapter.id}`,
            subtitle: `${book.title || 'Book'} \u00b7 Ch. ${chapter.id}`,
            bookId: book.id,
          });
        }
      });
    });

    setResults(found.slice(0, 12));
    setSelectedIndex(0);
  }, [query, worldState]);

  const handleSelect = (r) => {
    if (!r) return;
    onNavigate?.(r.type, r.id, r.bookId);
    onClose?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 680,
          margin: '0 16px',
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: 6,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '72vh',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${t.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: t.sidebar,
          }}
        >
          <Search size={14} color={t.ink2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search actors, items, skills, chapters\u2026"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: t.ink,
              fontFamily: t.font,
              fontSize: 14,
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: 5,
              background: 'transparent',
              color: t.ink2,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              cursor: 'pointer',
            }}
          >
            <X size={12} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {query && results.length === 0 && (
            <div style={{ padding: '48px 16px', textAlign: 'center', color: t.ink3, fontSize: 13 }}>
              No results for &ldquo;{query}&rdquo;.
            </div>
          )}

          {!query && (
            <div style={{ padding: 36, textAlign: 'center', color: t.ink3 }}>
              <Search size={36} color={t.ink3} style={{ opacity: 0.5, margin: '0 auto 12px' }} />
              <div style={{ fontSize: 13, color: t.ink2 }}>Type to search across your world.</div>
              <div
                style={{
                  fontFamily: t.mono,
                  fontSize: 10,
                  color: t.ink3,
                  marginTop: 10,
                  letterSpacing: 0.14,
                  textTransform: 'uppercase',
                }}
              >
                \u2191\u2193 Navigate &nbsp;\u00b7&nbsp; \u21B5 Select &nbsp;\u00b7&nbsp; Esc Close
              </div>
            </div>
          )}

          {results.map((r, i) => {
            const meta = TYPE_META[r.type] || TYPE_META.chapter;
            const Icon = meta.icon;
            const active = i === selectedIndex;
            return (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  background: active ? t.accentSoft : 'transparent',
                  borderLeft: `3px solid ${active ? t.accent : 'transparent'}`,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: t.ink,
                }}
              >
                <Icon size={14} color={active ? t.accent : t.ink2} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: t.ink }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: t.ink3 }}>{r.subtitle}</div>
                </div>
                <div
                  style={{
                    fontFamily: t.mono,
                    fontSize: 9,
                    color: t.ink3,
                    letterSpacing: 0.14,
                    textTransform: 'uppercase',
                  }}
                >
                  {meta.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

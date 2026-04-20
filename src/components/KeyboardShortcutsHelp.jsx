/**
 * KeyboardShortcutsHelp — Loomwright-themed, data-driven keyboard shortcut
 * reference. The actual list lives in services/keyboardShortcuts.js so the
 * help sheet can never drift from what App.js actually binds.
 */

import React, { useMemo, useState } from 'react';
import { X, Keyboard, Search, Command, ArrowRight } from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import { SHORTCUT_CATEGORIES, SHORTCUTS } from '../services/keyboardShortcuts';

function KeyChip({ children }) {
  const t = useTheme();
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 26,
        padding: '2px 6px',
        background: t.paper2,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        color: t.ink,
        fontFamily: t.mono,
        fontSize: 10,
        letterSpacing: 0.04,
      }}
    >
      {children}
    </kbd>
  );
}

function ShortcutRow({ shortcut, showCategory }) {
  const t = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: t.radius,
        border: `1px solid ${t.rule}`,
        background: t.paper,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {shortcut.keys.map((k, i) => (
            <React.Fragment key={`${k}-${i}`}>
              <KeyChip>{k}</KeyChip>
              {i < shortcut.keys.length - 1 && (
                <span style={{ color: t.ink3, fontSize: 10 }}>+</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <ArrowRight size={12} color={t.ink3} />
        <div>
          <div style={{ color: t.ink, fontSize: 13, fontWeight: 500 }}>{shortcut.action}</div>
          <div style={{ color: t.ink2, fontSize: 11 }}>{shortcut.description}</div>
        </div>
      </div>
      {showCategory && shortcut.category && (
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.ink3,
            background: t.paper2,
            border: `1px solid ${t.rule}`,
            padding: '2px 8px',
            borderRadius: 999,
            letterSpacing: 0.1,
            textTransform: 'uppercase',
          }}
        >
          {shortcut.category}
        </span>
      )}
    </div>
  );
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('all');

  const filtered = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return SHORTCUTS.filter(
        (s) =>
          s.action.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.keys.join(' ').toLowerCase().includes(q),
      );
    }
    if (active === 'all') return null; // sentinel: render grouped
    const cat = SHORTCUT_CATEGORIES.find((c) => c.id === active);
    return cat ? cat.shortcuts.map((s) => ({ ...s, category: cat.name, categoryIcon: cat.icon })) : [];
  }, [query, active]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 780,
          margin: '0 16px',
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: 6,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            background: t.sidebar,
            borderBottom: `1px solid ${t.rule}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                padding: 7,
                background: t.accentSoft,
                borderRadius: t.radius,
                color: t.accent,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Keyboard size={16} />
            </div>
            <div>
              <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, lineHeight: 1 }}>
                Keyboard shortcuts
              </div>
              <div
                style={{
                  fontFamily: t.mono,
                  fontSize: 9,
                  color: t.accent,
                  letterSpacing: 0.18,
                  textTransform: 'uppercase',
                  marginTop: 4,
                }}
              >
                Single source of truth · updates with the app
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: 6,
              background: 'transparent',
              color: t.ink2,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${t.rule}` }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              color={t.ink3}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shortcuts…"
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                background: t.bg,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                color: t.ink,
                outline: 'none',
                fontSize: 12,
                fontFamily: t.font,
              }}
            />
          </div>
        </div>

        {/* Category tabs */}
        {!query && (
          <div
            style={{
              padding: '8px 20px',
              borderBottom: `1px solid ${t.rule}`,
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
            }}
          >
            {[{ id: 'all', name: 'All', icon: '\u2261' }, ...SHORTCUT_CATEGORIES].map((cat) => {
              const on = active === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActive(cat.id)}
                  type="button"
                  style={{
                    padding: '5px 10px',
                    background: on ? t.accentSoft : 'transparent',
                    color: on ? t.ink : t.ink2,
                    border: `1px solid ${on ? t.accent : t.rule}`,
                    borderRadius: t.radius,
                    cursor: 'pointer',
                    fontFamily: t.mono,
                    fontSize: 10,
                    letterSpacing: 0.12,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.icon} {cat.name}
                </button>
              );
            })}
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {filtered === null ? (
            SHORTCUT_CATEGORIES.map((cat) => (
              <div key={cat.id} style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontFamily: t.mono,
                    fontSize: 10,
                    color: t.ink3,
                    letterSpacing: 0.18,
                    textTransform: 'uppercase',
                    margin: '6px 0',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  {cat.when && (
                    <span style={{ color: t.ink3, textTransform: 'none', letterSpacing: 0 }}>· {cat.when}</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cat.shortcuts.map((s, i) => (
                    <ShortcutRow key={`${cat.id}-${i}`} shortcut={s} />
                  ))}
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ padding: '28px 0', textAlign: 'center', color: t.ink3, fontSize: 13 }}>
              No shortcuts match &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.map((s, i) => (
                <ShortcutRow key={`filtered-${i}`} shortcut={s} showCategory />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: `1px solid ${t.rule}`,
            background: t.sidebar,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: t.ink3,
            fontSize: 11,
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Command size={12} />
            <span>On Mac, use Cmd instead of Ctrl.</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <KeyChip>Ctrl</KeyChip>
            <span>+</span>
            <KeyChip>/</KeyChip>
            <span style={{ marginLeft: 6 }}>anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}

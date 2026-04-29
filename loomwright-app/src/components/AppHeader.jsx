/**
 * AppHeader — slim top bar for the Loomwright app.
 *
 * Shows the product name, undo/redo, search and keyboard-shortcut access,
 * and a theme toggle. Replaces the old "GRIMGUFF TRACKER" chrome.
 */

import React from 'react';
import { ArrowLeft, ArrowRight, Keyboard, Search, Menu } from 'lucide-react';
import { useTheme, ThemeToggle } from '../loomwright/theme';

function IconButton({ title, onClick, disabled, children }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '5px 9px',
        background: 'transparent',
        color: disabled ? t.ink3 : t.ink2,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: t.mono,
        fontSize: 10,
        letterSpacing: 0.12,
        textTransform: 'uppercase',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = t.paper2; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

export default function AppHeader({ undoRedoInfo, onUndo, onRedo, onOpenSearch, onOpenShortcuts, onToggleNav }) {
  const t = useTheme();
  return (
    <header
      style={{
        height: 48,
        flexShrink: 0,
        background: t.sidebar,
        borderBottom: `1px solid ${t.rule}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onToggleNav && (
          <button
            type="button"
            onClick={onToggleNav}
            title="Toggle navigation"
            style={{
              padding: 6,
              background: 'transparent',
              color: t.ink2,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              cursor: 'pointer',
            }}
          >
            <Menu size={14} />
          </button>
        )}
        <div
          style={{
            width: 28, height: 28, borderRadius: t.radius,
            background: t.accent, color: t.onAccent,
            display: 'grid', placeItems: 'center',
            fontFamily: t.display, fontWeight: 600, fontSize: 13, lineHeight: 1,
          }}
        >
          Lw
        </div>
        <div>
          <div
            style={{
              fontFamily: t.display,
              fontSize: 15,
              fontWeight: 500,
              color: t.ink,
              letterSpacing: 0.4,
              lineHeight: 1,
            }}
          >
            LOOMWRIGHT
          </div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 8,
              color: t.accent,
              letterSpacing: 0.22,
              textTransform: 'uppercase',
              marginTop: 3,
            }}
          >
            Story Studio
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconButton
          title={undoRedoInfo?.canUndo ? 'Undo (Ctrl+Z)' : 'Nothing to undo'}
          onClick={onUndo}
          disabled={!undoRedoInfo?.canUndo}
        >
          <ArrowLeft size={12} /> Undo
        </IconButton>
        <IconButton
          title={undoRedoInfo?.canRedo ? 'Redo (Ctrl+Y)' : 'Nothing to redo'}
          onClick={onRedo}
          disabled={!undoRedoInfo?.canRedo}
        >
          <ArrowRight size={12} /> Redo
        </IconButton>
        <div style={{ width: 1, height: 18, background: t.rule, margin: '0 4px' }} />
        <IconButton title="Keyboard shortcuts (Ctrl+/)" onClick={onOpenShortcuts}>
          <Keyboard size={12} />
        </IconButton>
        <IconButton title="Search (Ctrl+K)" onClick={onOpenSearch}>
          <Search size={12} />
        </IconButton>
        <ThemeToggle />
      </div>
    </header>
  );
}

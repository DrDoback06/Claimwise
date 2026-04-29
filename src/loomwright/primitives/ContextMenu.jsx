/**
 * Lightweight context menu — pass items via props, open() is imperative.
 * Used for right-click actions inside the Wardrobe (give, break, mark lost, hide).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../theme';

export function useContextMenu() {
  const [state, setState] = useState({ open: false, x: 0, y: 0, items: [] });
  const open = (e, items) => {
    e.preventDefault();
    e.stopPropagation();
    setState({ open: true, x: e.clientX, y: e.clientY, items });
  };
  const close = () => setState((s) => ({ ...s, open: false }));
  return { state, open, close };
}

export default function ContextMenu({ state, onClose }) {
  const t = useTheme();
  const ref = useRef(null);

  useEffect(() => {
    if (!state.open) return undefined;
    const onDocDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('mousedown', onDocDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDocDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [state.open, onClose]);

  if (!state.open || !state.items?.length) return null;

  return (
    <div
      ref={ref}
      role="menu"
      style={{
        position: 'fixed',
        top: state.y,
        left: state.x,
        zIndex: 3000,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        minWidth: 180,
        padding: 4,
        boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
      }}
    >
      {state.items.map((item, i) => {
        if (item.divider) {
          return (
            <div
              key={`div-${i}`}
              style={{ borderTop: `1px solid ${t.rule}`, margin: '4px 0' }}
            />
          );
        }
        return (
          <button
            key={item.id || i}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              item.onClick?.();
              onClose?.();
            }}
            role="menuitem"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              textAlign: 'left',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              color: item.danger ? t.bad : t.ink,
              fontFamily: t.font,
              fontSize: 12,
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.5 : 1,
              borderRadius: 2,
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) e.currentTarget.style.background = t.paper2;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.shortcut && (
              <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3 }}>
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * FocusExitChip - rendered via a portal directly into document.body so
 * it escapes any hidden header / overflow:hidden parents when Focus
 * mode is engaged. Previously, entering Focus hid the entire header
 * including its exit button and users had no way back short of a
 * refresh.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';

export default function FocusExitChip({ visible, onExit }) {
  const t = useTheme();
  useEffect(() => {
    if (!visible) return undefined;
    const onEsc = (e) => { if (e.key === 'Escape') onExit?.(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [visible, onExit]);

  if (!visible || typeof document === 'undefined') return null;
  return createPortal(
    <button
      type="button"
      onClick={onExit}
      title="Exit focus mode (Esc)"
      aria-label="Exit focus mode"
      className="lw-z-toast"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        padding: '9px 14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        background: t.paper,
        color: t.ink,
        border: `1px solid ${t.rule}`,
        borderRadius: 999,
        fontFamily: t.mono,
        fontSize: 10,
        letterSpacing: 0.2,
        textTransform: 'uppercase',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        cursor: 'pointer',
      }}
    >
      <X size={13} /> Exit focus
    </button>,
    document.body,
  );
}

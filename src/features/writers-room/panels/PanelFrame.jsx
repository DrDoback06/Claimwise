// Loomwright — shared panel chrome.

import React from 'react';
import { useTheme } from '../theme';

export default function PanelFrame({ title, eyebrow, accent, onClose, width = 460, children, footer }) {
  const t = useTheme();
  return (
    <aside style={{
      width, minWidth: 320, maxWidth: 720,
      background: t.paper,
      borderLeft: `1px solid ${t.rule}`,
      display: 'flex', flexDirection: 'column',
      animation: 'lw-slide-in 240ms ease',
      overflow: 'hidden',
    }}>
      <header style={{
        padding: '14px 16px 10px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0,
      }}>
        <div style={{ width: 4, alignSelf: 'stretch', background: accent || t.accent, borderRadius: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {eyebrow && <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>{eyebrow}</div>}
          <div style={{
            fontFamily: t.display, fontSize: 17, color: t.ink, fontWeight: 500,
            marginTop: 2, lineHeight: 1.2,
          }}>{title}</div>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close panel" style={{
            background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer',
            fontFamily: t.mono, fontSize: 16, padding: 4, lineHeight: 1,
          }}>×</button>
        )}
      </header>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
      {footer && (
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${t.rule}`, flexShrink: 0 }}>{footer}</div>
      )}
    </aside>
  );
}

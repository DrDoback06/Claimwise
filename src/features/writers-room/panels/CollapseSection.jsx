// Loomwright — collapsible panel section. Persists open/closed state per
// title in localStorage so the writer's chosen layout survives reload.

import React from 'react';
import { useTheme } from '../theme';

const KEY = 'lw.collapse';
function readCollapse() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function writeCollapse(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
}

export default function CollapseSection({ title, count, accent, defaultOpen = true, children }) {
  const t = useTheme();
  const [open, setOpen] = React.useState(() => {
    const map = readCollapse();
    if (title in map) return map[title];
    return defaultOpen;
  });
  const toggle = () => {
    setOpen(prev => {
      const next = !prev;
      const map = readCollapse();
      map[title] = next;
      writeCollapse(map);
      return next;
    });
  };
  return (
    <section style={{
      borderTop: `1px solid ${t.rule}`,
      padding: '10px 16px 12px',
    }}>
      <button onClick={toggle} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: 0, marginBottom: open ? 8 : 0, color: t.ink2,
      }}>
        <span style={{
          width: 0, height: 0,
          borderLeft: '4px solid ' + (open ? 'transparent' : (accent || t.accent)),
          borderRight: '4px solid transparent',
          borderTop: open ? '4px solid ' + (accent || t.accent) : '4px solid transparent',
          borderBottom: '4px solid transparent',
          transform: open ? 'translateY(2px)' : 'translateY(0)',
          transition: 'transform 180ms',
        }} />
        <span style={{
          fontFamily: t.mono, fontSize: 10, color: t.ink2,
          letterSpacing: 0.16, textTransform: 'uppercase', flex: 1, textAlign: 'left',
        }}>{title}</span>
        {count != null && <span style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12,
        }}>{count}</span>}
      </button>
      {open && <div>{children}</div>}
    </section>
  );
}

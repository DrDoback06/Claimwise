/**
 * PaneResizer - horizontal draggable divider between two stacked panes.
 *
 * Reports the new ratio [0.2, 0.85] via `setRatio` on drag. Parent is
 * responsible for persisting (the Writer's Room parent keeps the ratio
 * in localStorage under `lw-write-split`).
 */

import React, { useCallback, useRef } from 'react';
import { useTheme } from '../../loomwright/theme';

export default function PaneResizer({ setRatio }) {
  const t = useTheme();
  const hostRef = useRef(null);
  const dragging = useRef(false);

  const onDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev) => {
      if (!dragging.current) return;
      const host = hostRef.current?.parentElement;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const y = ev.clientY - rect.top;
      const next = Math.min(0.85, Math.max(0.2, y / rect.height));
      setRatio(next);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [setRatio]);

  return (
    <div
      ref={hostRef}
      onMouseDown={onDown}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize panes"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const step = e.key === 'ArrowDown' ? 0.03 : -0.03;
          setRatio((r) => Math.min(0.85, Math.max(0.2, (r || 0.55) + step)));
        }
      }}
      className="lw-z-pane-resizer"
      style={{
        position: 'relative',
        height: 6,
        cursor: 'row-resize',
        background: t.rule,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 34, height: 2,
          background: t.ink3,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

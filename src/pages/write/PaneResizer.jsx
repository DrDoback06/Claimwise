/**
 * PaneResizer - draggable divider between two panes. Supports vertical
 * (stacked, dragged on Y) and horizontal (side-by-side, dragged on X)
 * orientations.
 *
 * Reports the new ratio [0.2, 0.85] via `setRatio` on drag. Parent is
 * responsible for persisting (the Writer's Room parent keeps the ratio
 * in localStorage under `lw-write-split`).
 */

import React, { useCallback, useRef } from 'react';
import { useTheme } from '../../loomwright/theme';

export default function PaneResizer({ setRatio, orientation = 'horizontal' }) {
  const t = useTheme();
  // orientation === 'horizontal' means the PANES are stacked (vertical split)
  // and the divider is a horizontal bar. orientation === 'vertical' means the
  // panes are side-by-side and the divider is a vertical line. This matches
  // the ARIA spec for aria-orientation.
  const isHorizontalBar = orientation === 'horizontal';
  const hostRef = useRef(null);
  const dragging = useRef(false);

  const onDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = isHorizontalBar ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev) => {
      if (!dragging.current) return;
      const host = hostRef.current?.parentElement;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      let next;
      if (isHorizontalBar) {
        const y = ev.clientY - rect.top;
        next = Math.min(0.85, Math.max(0.2, y / rect.height));
      } else {
        const x = ev.clientX - rect.left;
        next = Math.min(0.85, Math.max(0.2, x / rect.width));
      }
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
  }, [setRatio, isHorizontalBar]);

  const barStyle = isHorizontalBar
    ? { height: 6, width: '100%', cursor: 'row-resize' }
    : { width: 6, height: '100%', cursor: 'col-resize' };

  return (
    <div
      ref={hostRef}
      onMouseDown={onDown}
      role="separator"
      aria-orientation={isHorizontalBar ? 'horizontal' : 'vertical'}
      aria-label="Resize panes"
      tabIndex={0}
      onKeyDown={(e) => {
        const increase = isHorizontalBar ? 'ArrowDown' : 'ArrowRight';
        const decrease = isHorizontalBar ? 'ArrowUp' : 'ArrowLeft';
        if (e.key === increase || e.key === decrease) {
          e.preventDefault();
          const step = e.key === increase ? 0.03 : -0.03;
          setRatio((r) => Math.min(0.85, Math.max(0.2, (r || 0.55) + step)));
        }
      }}
      className="lw-z-pane-resizer"
      style={{
        position: 'relative',
        ...barStyle,
        background: t.rule,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: isHorizontalBar ? 34 : 2,
          height: isHorizontalBar ? 2 : 34,
          background: t.ink3,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

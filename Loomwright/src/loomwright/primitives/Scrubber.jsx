/**
 * Chapter Scrubber — horizontal strip of chapter ticks, drag/click/arrow-key to scrub.
 * Emits onChange(chapter) whenever user lands on a new chapter.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { useTheme } from '../theme';

export default function Scrubber({
  chapters = [],
  value,
  onChange,
  highlight = {},
  compact = false,
  labelFn,
}) {
  const t = useTheme();
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const setFromClientX = useCallback(
    (clientX) => {
      const el = containerRef.current;
      if (!el || !chapters.length) return;
      const rect = el.getBoundingClientRect();
      const rel = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const idx = Math.round((rel / rect.width) * (chapters.length - 1));
      const c = chapters[idx];
      if (c != null && c !== value) onChange?.(c);
    },
    [chapters, value, onChange]
  );

  useEffect(() => {
    const up = () => {
      dragging.current = false;
    };
    const move = (e) => {
      if (!dragging.current) return;
      setFromClientX(e.clientX);
    };
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', move);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mousemove', move);
    };
  }, [setFromClientX]);

  const handleKey = (e) => {
    const idx = chapters.indexOf(value);
    if (idx < 0) return;
    if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      onChange?.(chapters[idx - 1]);
    } else if (e.key === 'ArrowRight' && idx < chapters.length - 1) {
      e.preventDefault();
      onChange?.(chapters[idx + 1]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange?.(chapters[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange?.(chapters[chapters.length - 1]);
    }
  };

  if (!chapters.length) {
    return (
      <div
        style={{
          padding: '10px 14px',
          fontFamily: t.mono,
          fontSize: 10,
          color: t.ink3,
          letterSpacing: 0.12,
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        No chapters yet
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: compact ? '6px 10px' : '10px 14px',
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: t.mono,
          fontSize: 9,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
          color: t.ink3,
        }}
      >
        <span>Chapter</span>
        <span style={{ color: t.accent }}>
          {labelFn ? labelFn(value) : `#${String(value ?? chapters[0]).padStart(2, '0')}`}
        </span>
      </div>
      <div
        ref={containerRef}
        tabIndex={0}
        role="slider"
        aria-valuemin={chapters[0]}
        aria-valuemax={chapters[chapters.length - 1]}
        aria-valuenow={value}
        onKeyDown={handleKey}
        onMouseDown={(e) => {
          dragging.current = true;
          setFromClientX(e.clientX);
        }}
        style={{
          position: 'relative',
          height: compact ? 22 : 32,
          cursor: 'ew-resize',
          display: 'flex',
          alignItems: 'stretch',
          gap: 2,
          outline: 'none',
        }}
      >
        {chapters.map((c) => {
          const isCurrent = c === value;
          const has = !!highlight[c];
          return (
            <button
              key={c}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.(c);
              }}
              title={labelFn ? labelFn(c) : `Chapter ${c}`}
              style={{
                flex: 1,
                minWidth: 0,
                padding: 0,
                background: isCurrent
                  ? t.accent
                  : has
                  ? t.accentSoft
                  : t.paper2,
                border: `1px solid ${isCurrent ? t.accent : t.rule}`,
                borderRadius: 1,
                cursor: 'pointer',
                color: isCurrent ? t.onAccent : t.ink3,
                fontFamily: t.mono,
                fontSize: 8,
                letterSpacing: 0.1,
              }}
            >
              {compact ? '' : String(c).padStart(2, '0')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

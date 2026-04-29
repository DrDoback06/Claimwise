import React from 'react';
import { useTheme } from '../theme';

export default function Chip({ children, color, tone, onClick, title, style }) {
  const t = useTheme();
  const resolved =
    color ||
    (tone === 'good'
      ? t.good
      : tone === 'warn'
      ? t.warn
      : tone === 'bad'
      ? t.bad
      : tone === 'accent'
      ? t.accent
      : tone === 'subtle'
      ? t.subtle
      : null);
  const bg = resolved ? resolved + '20' : t.paper2;
  const fg = resolved || t.ink2;
  const border = resolved || t.rule;
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
        borderRadius: 2,
        fontFamily: t.mono,
        fontSize: 9,
        letterSpacing: 0.1,
        textTransform: 'uppercase',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

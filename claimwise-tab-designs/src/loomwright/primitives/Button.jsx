import React from 'react';
import { useTheme } from '../theme';

export default function Button({
  children,
  variant = 'default',
  size = 'md',
  disabled,
  onClick,
  type = 'button',
  title,
  style,
  icon,
}) {
  const t = useTheme();
  const variants = {
    default: { bg: 'transparent', fg: t.ink, border: t.rule, hover: t.paper2 },
    primary: { bg: t.accent, fg: t.onAccent, border: t.accent, hover: t.accent },
    ghost: { bg: 'transparent', fg: t.ink2, border: 'transparent', hover: t.paper2 },
    danger: { bg: 'transparent', fg: t.bad, border: t.bad, hover: t.bad + '20' },
  };
  const v = variants[variant] || variants.default;
  const sizes = {
    sm: { padding: '4px 10px', fontSize: 10 },
    md: { padding: '6px 12px', fontSize: 11 },
    lg: { padding: '9px 16px', fontSize: 12 },
  };
  const s = sizes[size] || sizes.md;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: s.padding,
        fontSize: s.fontSize,
        fontFamily: t.mono,
        letterSpacing: 0.1,
        textTransform: 'uppercase',
        background: v.bg,
        color: v.fg,
        border: `1px solid ${v.border}`,
        borderRadius: t.radius,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = v.hover;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = v.bg;
      }}
    >
      {icon}
      {children}
    </button>
  );
}

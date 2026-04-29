import React from 'react';
import { useTheme } from '../theme';

export function Panel({ title, subtitle, children, style, actions }) {
  const t = useTheme();
  return (
    <div
      style={{
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {(title || subtitle || actions) && (
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${t.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            {subtitle && (
              <div
                style={{
                  fontFamily: t.mono,
                  fontSize: 9,
                  color: t.accent,
                  letterSpacing: 0.14,
                  textTransform: 'uppercase',
                }}
              >
                {subtitle}
              </div>
            )}
            {title && (
              <div
                style={{
                  fontFamily: t.display,
                  fontSize: 16,
                  fontWeight: 500,
                  color: t.ink,
                  marginTop: subtitle ? 2 : 0,
                }}
              >
                {title}
              </div>
            )}
          </div>
          {actions}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  const t = useTheme();
  return (
    <div
      style={{
        padding: '28px 20px',
        textAlign: 'center',
        border: `1px dashed ${t.rule}`,
        borderRadius: t.radius,
        background: t.paper,
      }}
    >
      {icon && <div style={{ marginBottom: 10, opacity: 0.6 }}>{icon}</div>}
      <div
        style={{
          fontFamily: t.display,
          fontSize: 15,
          color: t.ink,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: t.ink2, marginBottom: 12 }}>{subtitle}</div>
      )}
      {action}
    </div>
  );
}

export default Panel;

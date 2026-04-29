import React, { useEffect } from 'react';
import { useTheme } from '../theme';

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 680,
  maxHeight = '86vh',
}) {
  const t = useTheme();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          width: '100%',
          maxWidth: width,
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          color: t.ink,
          fontFamily: t.font,
        }}
      >
        {(title || subtitle) && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${t.rule}`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              {subtitle && (
                <div
                  style={{
                    fontFamily: t.mono,
                    fontSize: 10,
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
                    fontSize: 20,
                    fontWeight: 500,
                    marginTop: subtitle ? 2 : 0,
                  }}
                >
                  {title}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: `1px solid ${t.rule}`,
                color: t.ink2,
                padding: '4px 8px',
                cursor: 'pointer',
                borderRadius: t.radius,
                fontFamily: t.mono,
                fontSize: 11,
              }}
            >
              \u00d7
            </button>
          </div>
        )}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: `1px solid ${t.rule}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              background: t.paper2,
              borderBottomLeftRadius: t.radius,
              borderBottomRightRadius: t.radius,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

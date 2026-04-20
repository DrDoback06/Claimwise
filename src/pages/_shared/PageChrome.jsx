/**
 * PageChrome — shared page scaffolding for Loomwright pages.
 *
 * Provides a typed page header (eyebrow, title, subtitle), optional tab strip,
 * and a scrollable body. Used by Today/Cast/Atlas/World/Plot/Settings/etc.
 */

import React from 'react';
import { useTheme } from '../../loomwright/theme';

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  const t = useTheme();
  return (
    <div
      style={{
        padding: '20px 28px 16px',
        borderBottom: `1px solid ${t.rule}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: t.paper,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && (
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 9,
              color: t.accent,
              letterSpacing: 0.22,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            {eyebrow}
          </div>
        )}
        {title && (
          <div
            style={{
              fontFamily: t.display,
              fontSize: 22,
              fontWeight: 500,
              color: t.ink,
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
        )}
        {subtitle && (
          <div
            style={{
              fontSize: 12,
              color: t.ink2,
              marginTop: 6,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {actions}
    </div>
  );
}

export function TabStrip({ tabs, activeId, onChange }) {
  const t = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: '6px 28px',
        borderBottom: `1px solid ${t.rule}`,
        background: t.sidebar,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              padding: '7px 14px',
              background: active ? t.paper : 'transparent',
              color: active ? t.ink : t.ink2,
              border: `1px solid ${active ? t.rule : 'transparent'}`,
              borderBottom: active ? `1px solid ${t.paper}` : `1px solid transparent`,
              borderRadius: `${t.radius} ${t.radius} 0 0`,
              fontFamily: t.mono,
              fontSize: 10,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
              cursor: 'pointer',
              position: 'relative',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function PageBody({ children, padding = 28, style }) {
  const t = useTheme();
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding,
        background: t.bg,
        color: t.ink,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Page({ children }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  );
}

export default Page;

import React from 'react';
import { useTheme } from '../theme';

export function Toolbar({ children, style }) {
  const t = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ToolbarGroup({ children, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...style }}>{children}</div>
  );
}

export function ToolbarSpacer() {
  return <div style={{ flex: 1 }} />;
}

export default Toolbar;

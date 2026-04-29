/**
 * Stub placeholder for Loomwright surfaces that haven't been implemented yet.
 * Real implementations live under ./weaver, ./voice, ./atlas, etc.
 */

import React from 'react';
import LoomwrightShell from './LoomwrightShell';
import { useTheme, ThemeToggle } from './theme';
import Icon from './primitives/Icon';

function StubBody({ title, subtitle, notes = [] }) {
  const t = useTheme();
  return (
    <div style={{ padding: '32px 36px', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: t.accent,
            color: t.onAccent,
            display: 'grid',
            placeItems: 'center',
            fontFamily: t.display,
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          L<span style={{ fontSize: 12, opacity: 0.6 }}>w</span>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.accent,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
            }}
          >
            Loomwright
          </div>
          <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 500 }}>{title}</div>
        </div>
        <ThemeToggle />
      </div>
      {subtitle && <p style={{ color: t.ink2, lineHeight: 1.6, marginBottom: 18 }}>{subtitle}</p>}
      <div
        style={{
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.ink3,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="sparkle" size={12} color={t.accent} /> Build in progress
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            color: t.ink2,
            lineHeight: 1.7,
            fontSize: 13,
          }}
        >
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Stub({ title, subtitle, notes }) {
  return (
    <LoomwrightShell>
      <StubBody title={title} subtitle={subtitle} notes={notes} />
    </LoomwrightShell>
  );
}

/**
 * Loomwright theme — design tokens, ThemeProvider, useTheme, ThemeToggle.
 * Ported from redesign/proto/theme.jsx so the Loomwright surface area owns its
 * own visual system separate from the existing slate/tailwind UI.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const THEMES = {
  night: {
    name: 'night',
    bg: '#0f1419',
    paper: '#171d24',
    paper2: '#1d242c',
    sidebar: '#0a0e12',
    ink: '#e8e1d0',
    ink2: '#a8a18f',
    ink3: '#6a655a',
    rule: '#262d36',
    accent: 'oklch(78% 0.13 78)',
    accentSoft: 'oklch(78% 0.13 78 / 0.25)',
    accent2: 'oklch(72% 0.10 200)',
    good: 'oklch(72% 0.13 145)',
    warn: 'oklch(78% 0.13 78)',
    bad: 'oklch(65% 0.18 25)',
    subtle: 'oklch(60% 0.04 60)',
    display: "'Fraunces', 'Georgia', serif",
    font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Consolas', monospace",
    radius: '3px',
  },
  day: {
    name: 'day',
    bg: '#f4efe4',
    paper: '#fbf7ed',
    paper2: '#ffffff',
    sidebar: '#ebe4d2',
    ink: '#2a261e',
    ink2: '#5a544a',
    ink3: '#8a8478',
    rule: '#d9d2bf',
    accent: 'oklch(55% 0.15 45)',
    accentSoft: 'oklch(55% 0.15 45 / 0.18)',
    accent2: 'oklch(48% 0.09 200)',
    good: 'oklch(50% 0.13 145)',
    warn: 'oklch(55% 0.15 45)',
    bad: 'oklch(55% 0.18 25)',
    subtle: 'oklch(55% 0.04 60)',
    display: "'Fraunces', 'Georgia', serif",
    font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Consolas', monospace",
    radius: '3px',
  },
};

const ThemeCtx = createContext(THEMES.night);

export function ThemeProvider({ children, initial, scoped = false }) {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('lw-theme') : null;
  const [mode, setMode] = useState(initial || stored || 'night');

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('lw-theme', mode);
    // When scoped we don't touch document.body so it won't fight with the host app's chrome.
    if (!scoped && typeof document !== 'undefined' && document.body) {
      document.body.dataset.lwTheme = mode;
    }
  }, [mode, scoped]);

  const value = useMemo(() => {
    const base = THEMES[mode] || THEMES.night;
    const onAccent = mode === 'day' ? '#fbf7ed' : base.sidebar;
    return { ...base, onAccent, setMode, mode };
  }, [mode]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeToggle({ style }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={() => t.setMode(t.mode === 'night' ? 'day' : 'night')}
      title={t.mode === 'night' ? 'Switch to Daylight' : 'Switch to Nightmode'}
      style={{
        padding: '5px 10px',
        background: 'transparent',
        color: t.ink2,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        fontFamily: t.mono,
        fontSize: 10,
        letterSpacing: 0.12,
        textTransform: 'uppercase',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        ...style,
      }}
    >
      {t.mode === 'night' ? '\u263E Night' : '\u263C Day'}
    </button>
  );
}

export default ThemeProvider;

// Loomwright — Parchment & Press theme. All colour comes from here; hex
// outside this file is forbidden (see plan §3.4).

import React from 'react';

export const THEMES = {
  day: {
    mode: 'day',
    bg: '#f4ecd8',
    paper: '#ebe1c7',
    paper2: '#e0d4b4',
    paper3: '#d8caa4',
    sidebar: '#e8dcbf',
    ink: '#2b1d0e',
    ink2: '#5a4a35',
    ink3: '#8a7a5e',
    ink4: '#b0a382',
    rule: '#c9b98e',
    rule2: '#d8c9a0',
    accent: '#8b2b1f',
    accent2: '#b8492e',
    onAccent: '#f4ecd8',
    good: '#4a6b2e',
    warn: '#b8731c',
    bad: '#a33a2b',
    // Suggestion-engine palette (CODE-INSIGHT §9 — additive).
    sugg: '#f6efd9',
    suggInk: '#7a5d2a',
    hand: "'Caveat', 'Comic Sans MS', cursive",
    font: "'Fraunces', Georgia, serif",
    display: "'Fraunces', Georgia, serif",
    mono: "'JetBrains Mono', 'Courier New', monospace",
  },
  night: {
    mode: 'night',
    bg: '#141017',
    paper: '#1c1721',
    paper2: '#231c29',
    paper3: '#2a2232',
    sidebar: '#181319',
    ink: '#eae0d0',
    ink2: '#b5a894',
    ink3: '#7a6d5f',
    ink4: '#4f4538',
    rule: '#322a36',
    rule2: '#3d3341',
    accent: '#d49252',
    accent2: '#eab069',
    onAccent: '#141017',
    good: '#7cb26a',
    warn: '#d49252',
    bad: '#d87a6a',
    // Suggestion-engine palette tuned for dark mode (warmer paper, ochre ink).
    sugg: '#2a2118',
    suggInk: '#d4a866',
    hand: "'Caveat', 'Comic Sans MS', cursive",
    font: "'Fraunces', Georgia, serif",
    display: "'Fraunces', Georgia, serif",
    mono: "'JetBrains Mono', 'Courier New', monospace",
  },
};

// Per-panel accents (plan §3.4).
export const PANEL_ACCENT = {
  atlas:    'oklch(55% 0.10 145)',  // mossy green
  cast:     'oklch(55% 0.10 220)',  // dusk blue
  voice:    'oklch(55% 0.14 30)',   // rust
  threads:  'oklch(55% 0.14 50)',   // rust-amber
  items:    'oklch(60% 0.13 75)',   // amber
  language: 'oklch(55% 0.10 290)',  // violet
  tangle:   'oklch(55% 0.10 110)',  // sage
  loom:     'oklch(70% 0.13 80)',   // gold
};

// Place kind palette (Atlas).
export const PLACE_COLORS = {
  city:    'oklch(55% 0.10 145)',
  village: 'oklch(58% 0.09 110)',
  manor:   'oklch(55% 0.10 60)',
  ship:    'oklch(55% 0.12 220)',
  tavern:  'oklch(55% 0.11 35)',
  dungeon: 'oklch(40% 0.06 280)',
  wilderness: 'oklch(50% 0.10 130)',
};

const ThemeCtx = React.createContext(THEMES.day);

export function ThemeProvider({ initial = 'day', children }) {
  const [mode, setMode] = React.useState(() => {
    try { return localStorage.getItem('lw.themeMode') || initial; } catch { return initial; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('lw.themeMode', mode); } catch {}
    if (typeof document !== 'undefined') {
      document.body.dataset.lwTheme = mode;
      // Surface design-pass tokens to plain CSS rules (e.g. .lw-staged-suggestion).
      const root = document.documentElement;
      const T = THEMES[mode];
      if (T) {
        root.style.setProperty('--lw-hand', T.hand || "'Caveat', cursive");
        root.style.setProperty('--lw-sugg-ink', T.suggInk || '#7a5d2a');
        root.style.setProperty('--lw-sugg', T.sugg || T.paper);
      }
    }
  }, [mode]);
  const value = React.useMemo(() => ({
    ...THEMES[mode],
    setMode,
    toggle: () => setMode(m => (m === 'day' ? 'night' : 'day')),
  }), [mode]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() { return React.useContext(ThemeCtx); }

export function ThemeToggle() {
  const t = useTheme();
  return (
    <button onClick={t.toggle} title={t.mode === 'day' ? 'Night mode' : 'Day mode'} style={{
      width: 40, height: 40, background: 'transparent', border: `1px solid ${t.rule}`,
      borderRadius: 2, cursor: 'pointer', color: t.ink2, display: 'grid', placeItems: 'center',
      fontFamily: t.mono, fontSize: 14,
    }}>{t.mode === 'day' ? '☾' : '☀'}</button>
  );
}

// Spacing scale (plan §3.4): 2/4/6/8/10/14/18/24/28/40/64
export const SPACING = [2, 4, 6, 8, 10, 14, 18, 24, 28, 40, 64];

// Animation table (plan §3.4)
export const ANIMS = {
  slideIn: '240ms',
  popIn: '260ms',
  breathe: '2.4s',
  tabFade: '200ms',
  fadeIn: '600ms',
};

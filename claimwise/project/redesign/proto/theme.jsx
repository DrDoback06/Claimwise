// theme.jsx — Loomwright theme provider with Daylight ⇄ Nightmode toggle.

const THEMES = {
  night: {
    name: 'night',
    bg: '#0f1419', paper: '#171d24', paper2: '#1d242c', sidebar: '#0a0e12',
    ink: '#e8e1d0', ink2: '#a8a18f', ink3: '#6a655a',
    rule: '#262d36',
    accent: 'oklch(78% 0.13 78)', accentSoft: 'oklch(78% 0.13 78 / 0.25)', accent2: 'oklch(72% 0.10 200)',
    good: 'oklch(72% 0.13 145)', warn: 'oklch(78% 0.13 78)',
    display: "'Fraunces', serif",
    font: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
    radius: '3px',
  },
  day: {
    name: 'day',
    bg: '#f4efe4', paper: '#fbf7ed', paper2: '#ffffff', sidebar: '#ebe4d2',
    ink: '#2a261e', ink2: '#5a544a', ink3: '#8a8478',
    rule: '#d9d2bf',
    accent: 'oklch(55% 0.15 45)', accentSoft: 'oklch(55% 0.15 45 / 0.18)', accent2: 'oklch(48% 0.09 200)',
    good: 'oklch(50% 0.13 145)', warn: 'oklch(55% 0.15 45)',
    display: "'Fraunces', serif",
    font: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
    radius: '3px',
  },
};

const ThemeCtx = React.createContext(THEMES.night);

function ThemeProvider({ children, initial }) {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('lw-theme') : null;
  const [mode, setMode] = React.useState(initial || stored || 'night');
  React.useEffect(() => { if (typeof localStorage !== 'undefined') localStorage.setItem('lw-theme', mode); document.body.style.background = THEMES[mode].bg; }, [mode]);
  const base = THEMES[mode];
  // onAccent: text/icon color to use on top of an accent-colored surface (button bg).
  const onAccent = mode === 'day' ? '#fbf7ed' : base.sidebar;
  const value = { ...base, onAccent, setMode, mode };
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
function useTheme() { return React.useContext(ThemeCtx); }

function ThemeToggle() {
  const t = useTheme();
  return (
    <button onClick={() => t.setMode(t.mode === 'night' ? 'day' : 'night')}
      title={t.mode === 'night' ? 'Switch to Daylight' : 'Switch to Nightmode'}
      style={{
        padding: '5px 10px', background: 'transparent', color: t.ink2,
        border: `1px solid ${t.rule}`, borderRadius: t.radius,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase',
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
      {t.mode === 'night' ? '☾ Night' : '☼ Day'}
    </button>
  );
}

window.THEMES = THEMES;
window.ThemeProvider = ThemeProvider;
window.useTheme = useTheme;
window.ThemeToggle = ThemeToggle;

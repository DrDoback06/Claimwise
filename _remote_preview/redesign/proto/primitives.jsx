// primitives.jsx — small reusable bits: Icon, Chip, Tag.

const ICON_PATHS = {
  sparkle:  'M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z M19 14l.8 2.8L22 18l-2.2.8-.8 2.2-.8-2.2L16 18l2.2-1.2z',
  globe:    'M12 2a10 10 0 100 20 10 10 0 000-20zm0 0v20M2 12h20M5 5c3 4 11 4 14 0M5 19c3-4 11-4 14 0',
  users:    'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M22 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
  flag:     'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22V15',
  clock:    'M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2',
  map:      'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16',
  pen:      'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586 M11 11a2 2 0 110-4 2 2 0 010 4z',
  plus:     'M12 5v14 M5 12h14',
  check:    'M20 6L9 17l-5-5',
  x:        'M18 6L6 18 M6 6l12 12',
  chevron:  'M9 18l6-6-6-6',
  arrow:    'M5 12h14 M12 5l7 7-7 7',
};

function Icon({ name, size = 14, color, strokeWidth = 1.5, style }) {
  const t = useTheme();
  const c = color || t.ink2;
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {d.split('M').filter(Boolean).map((p, i) => <path key={i} d={'M' + p} />)}
    </svg>
  );
}

function Chip({ children, color, style }) {
  const t = useTheme();
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      background: color ? color + '20' : t.paper2,
      color: color || t.ink2,
      border: `1px solid ${color || t.rule}`,
      borderRadius: 2,
      fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase',
      ...style,
    }}>{children}</span>
  );
}

window.Icon = Icon;
window.Chip = Chip;

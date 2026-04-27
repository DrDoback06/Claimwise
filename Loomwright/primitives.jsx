/* global React */
const { useState } = React;
const T = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Atomic chrome — mono uppercase microtext, hairline rules, 3px radius.
// Mirrors src/loomwright/primitives/* idioms.
// ───────────────────────────────────────────────────────────────────────────

function Mono({ children, color = T.ink3, size = 9, style }) {
  return (
    <span style={{
      fontFamily: T.mono, fontSize: size, color,
      letterSpacing: 0.14, textTransform: 'uppercase',
      ...style,
    }}>{children}</span>
  );
}

function Rule({ vertical, color = T.rule, style }) {
  return <div style={{
    background: color,
    width: vertical ? 1 : '100%',
    height: vertical ? '100%' : 1,
    ...style,
  }} />;
}

function Pill({ children, tone = 'subtle', filled, style, onClick }) {
  const map = { good: T.good, warn: T.warn, bad: T.bad, accent: T.accent, accent2: T.accent2, subtle: T.ink2 };
  const c = map[tone] || T.ink2;
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px',
      background: filled ? c : 'transparent',
      color: filled ? T.paper2 : c,
      border: `1px solid ${c}${filled ? '' : '55'}`,
      borderRadius: 2,
      fontFamily: T.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</Tag>
  );
}

function Btn({ children, variant = 'default', size = 'md', icon, style, onClick }) {
  const v = {
    default: { bg: T.paper2, fg: T.ink, bd: T.rule },
    primary: { bg: T.accent, fg: T.paper2, bd: T.accent },
    ghost:   { bg: 'transparent', fg: T.ink2, bd: 'transparent' },
    danger:  { bg: 'transparent', fg: T.bad, bd: T.bad },
  }[variant];
  const s = { sm: { p: '4px 9px', f: 9 }, md: { p: '6px 12px', f: 10 }, lg: { p: '9px 16px', f: 11 } }[size];
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: s.p, fontSize: s.f, fontFamily: T.mono,
      letterSpacing: 0.12, textTransform: 'uppercase',
      background: v.bg, color: v.fg, border: `1px solid ${v.bd}`,
      borderRadius: T.radius, cursor: 'pointer',
      ...style,
    }}>{icon}{children}</button>
  );
}

// Tiny stroked icons — same idiom as src/loomwright/primitives/Icon.jsx
function I({ d, size = 13, color = T.ink2, sw = 1.5, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      {d.split('M').filter(Boolean).map((p, i) => <path key={i} d={'M' + p} />)}
    </svg>
  );
}
const ICONS = {
  sparkle: 'M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z M19 14l.8 2.8L22 18l-2.2.8-.8 2.2-.8-2.2L16 18l2.2-1.2z',
  pin:   'M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1z',
  anchor:'M12 2a3 3 0 100 6 3 3 0 000-6z M12 8v14 M5 15a7 7 0 0014 0 M3 15h4 M17 15h4',
  x:     'M18 6L6 18 M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  chev:  'M9 18l6-6-6-6',
  chevD: 'M6 9l6 6 6-6',
  plus:  'M12 5v14 M5 12h14',
  search:'M11 2a9 9 0 106.32 15.41L22 22 M11 2a9 9 0 010 18',
  user:  'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z',
  flag:  'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22V15',
  pen:   'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z',
  eye:   'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z M12 15a3 3 0 100-6 3 3 0 000 6z',
  zZ:    'M4 4h12L4 18h12 M14 14h6l-6 6h6',
  map:   'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16',
  shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  book:  'M4 19.5V4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z M4 19.5A2.5 2.5 0 016.5 17H20',
  link:  'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2',
  refresh:'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M20.49 15a9 9 0 01-14.85 3.36L1 14',
  alert: 'M12 9v4 M12 17h.01 M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  drop:  'M12 2s7 8 7 13a7 7 0 11-14 0c0-5 7-13 7-13z',
  spark: 'M12 2v6 M12 16v6 M2 12h6 M16 12h6 M4.93 4.93l4.24 4.24 M14.83 14.83l4.24 4.24 M4.93 19.07l4.24-4.24 M14.83 9.17l4.24-4.24',
  thread:'M4 4c4 0 4 8 8 8s4-8 8-8 M4 20c4 0 4-8 8-8s4 8 8 8',
  layers:'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
};

// Avatar: 2-letter monogram
function Mono2({ name, size = 28, tint = T.accent }) {
  const initials = (name || '?').split(/\s+/).map(s => s[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${tint}, ${T.accent2})`,
      color: T.paper2,
      display: 'grid', placeItems: 'center',
      fontFamily: T.display, fontSize: size * 0.42, fontWeight: 600,
      borderRadius: 2,
      flexShrink: 0,
    }}>{initials}</div>
  );
}

// Section frame — used inside artboards
function Frame({ title, kicker, action, children, style }) {
  return (
    <div style={{
      background: T.paper, border: `1px solid ${T.rule}`, borderRadius: T.radius,
      display: 'flex', flexDirection: 'column',
      ...style,
    }}>
      {(title || kicker || action) && (
        <div style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${T.rule}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {kicker && <div><Mono color={T.accent}>{kicker}</Mono></div>}
            {title && <div style={{
              fontFamily: T.display, fontSize: 14, color: T.ink, marginTop: kicker ? 1 : 0,
              fontWeight: 500,
            }}>{title}</div>}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

// Annotation callout — yellow-paper hookup pin, day-theme appropriate.
// Lives ABSOLUTELY positioned on top of artboards, anchored with `style`.
function Note({ children, style, accent = T.accent }) {
  return (
    <div style={{
      position: 'absolute',
      background: '#fef9d8',
      border: `1px dashed ${accent}`,
      borderRadius: T.radius,
      padding: '7px 10px',
      fontFamily: T.mono, fontSize: 9.5, lineHeight: 1.55,
      color: '#5a4a2a', letterSpacing: 0.06,
      maxWidth: 220,
      boxShadow: '0 2px 8px rgba(120,90,30,.12)',
      ...style,
    }}>
      <div style={{
        fontSize: 8, color: accent, letterSpacing: 0.22, textTransform: 'uppercase',
        marginBottom: 4, fontWeight: 600,
      }}>↳ Hookup</div>
      {children}
    </div>
  );
}

// Connector — short angled line + arrowhead, for anchoring Notes to elements.
function NoteLine({ from, to, color = T.accent, style }) {
  // from/to are {top, left} relative to the artboard; renders as an absolutely-positioned svg.
  const x1 = from.left, y1 = from.top, x2 = to.left, y2 = to.top;
  const minX = Math.min(x1, x2) - 8, minY = Math.min(y1, y2) - 8;
  const maxX = Math.max(x1, x2) + 8, maxY = Math.max(y1, y2) + 8;
  const w = maxX - minX, h = maxY - minY;
  return (
    <svg style={{ position: 'absolute', top: minY, left: minX, width: w, height: h, pointerEvents: 'none', ...style }}>
      <line x1={x1 - minX} y1={y1 - minY} x2={x2 - minX} y2={y2 - minY}
        stroke={color} strokeWidth={1} strokeDasharray="3 3" />
      <circle cx={x2 - minX} cy={y2 - minY} r={3} fill={color} />
    </svg>
  );
}

Object.assign(window, { Mono, Rule, Pill, Btn, I, ICONS, Mono2, Frame, Note, NoteLine });

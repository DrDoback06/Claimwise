// AestheticDirections.jsx — three visual directions for Loomwright, side-by-side.
// Each mockup is a fixed-size app shell (sidebar + content) so they read as comparable artboards on the design canvas.

const SHELL_W = 1200;
const SHELL_H = 760;

// ─── Direction A: Parchment & Press ─────────────────────────────────────────
// Warm, papery, editorial. Fraunces display + Inter body. Burnt-sienna accent.
// Feels like a hand-bound notebook crossed with a serious newsroom CMS.
const A = {
  bg: '#faf6ec',
  paper: '#fffdf6',
  sidebar: '#f3ecd9',
  ink: '#1a1410',
  ink2: '#5a4f3e',
  ink3: '#9a8e75',
  rule: '#e6dec3',
  rule2: '#efe7cf',
  accent: 'oklch(56% 0.14 35)',
  accent2: 'oklch(56% 0.12 200)',
  good: 'oklch(52% 0.13 145)',
  font: "'Inter', sans-serif",
  display: "'Fraunces', serif",
  mono: "'JetBrains Mono', monospace",
};

function ShellA() {
  return (
    <div style={{ width: SHELL_W, height: SHELL_H, background: A.bg, color: A.ink, fontFamily: A.font, display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: A.sidebar, borderRight: `1px solid ${A.rule}`, padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 18, borderBottom: `1px solid ${A.rule}`, marginBottom: 18 }}>
          <div style={{ width: 30, height: 30, background: A.ink, color: A.bg, fontFamily: A.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 14, letterSpacing: -0.5 }}>L<span style={{ color: A.accent, fontSize: 18, lineHeight: 0.5 }}>·</span>W</div>
          <div>
            <div style={{ fontFamily: A.display, fontWeight: 600, fontSize: 17, letterSpacing: -0.3, lineHeight: 1 }}>Loomwright</div>
            <div style={{ fontFamily: A.mono, fontSize: 9, letterSpacing: 0.16, color: A.ink3, textTransform: 'uppercase', marginTop: 2 }}>The Ardent Path</div>
          </div>
        </div>
        {/* Nav */}
        {[
          { n: 'Home', a: true, m: '⌘0' },
          { n: 'Write', m: '⌘1', count: 'Ch. 14' },
          { n: 'Cast', m: '⌘2', count: '23' },
          { n: 'World', m: '⌘3' },
          { n: 'Plot', m: '⌘4', count: '7' },
          { n: 'Timeline', m: '⌘5' },
          { n: 'Settings', m: '⌘,' },
        ].map(it => (
          <div key={it.n} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 12px', marginBottom: 2, borderRadius: 3,
            background: it.a ? A.paper : 'transparent',
            border: it.a ? `1px solid ${A.rule}` : '1px solid transparent',
            boxShadow: it.a ? '0 1px 0 rgba(0,0,0,0.03)' : 'none',
          }}>
            <span style={{ fontFamily: A.display, fontSize: 16, fontWeight: it.a ? 600 : 500, color: it.a ? A.ink : A.ink2 }}>{it.n}</span>
            {it.count && <span style={{ fontFamily: A.mono, fontSize: 10, color: A.ink3 }}>{it.count}</span>}
          </div>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${A.rule}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: A.accent, color: A.bg, fontFamily: A.display, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>D</div>
          <div style={{ fontSize: 11, color: A.ink2 }}>doback06</div>
          <div style={{ marginLeft: 'auto', fontFamily: A.mono, fontSize: 9, color: A.ink3 }}>v1.0</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px 56px 0', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: A.mono, fontSize: 10, letterSpacing: 0.18, textTransform: 'uppercase', color: A.ink3 }}>Today / Friday, April 19</div>
            <div style={{ fontFamily: A.display, fontWeight: 500, fontSize: 38, letterSpacing: -0.02, marginTop: 4, lineHeight: 1 }}>Good morning, Daniel.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', border: `1px solid ${A.rule}`, background: A.paper, borderRadius: 3, fontSize: 11, color: A.ink2, fontFamily: A.mono }}>
              <span>⌘ K</span><span style={{ color: A.ink3 }}>jump anywhere</span>
            </div>
          </div>
        </div>

        {/* Resume card */}
        <div style={{ background: A.paper, border: `1px solid ${A.rule}`, padding: '24px 28px', marginBottom: 20, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div style={{ fontFamily: A.mono, fontSize: 10, letterSpacing: 0.16, color: A.accent, textTransform: 'uppercase' }}>Resume</div>
            <div style={{ fontFamily: A.mono, fontSize: 10, color: A.ink3 }}>· last edited 38 minutes ago</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
            <div>
              <div style={{ fontFamily: A.display, fontWeight: 500, fontSize: 28, letterSpacing: -0.01 }}>Chapter 14 · The hollow at Caer Drun</div>
              <div style={{ fontSize: 12, color: A.ink2, marginTop: 4 }}>Book II — <i>The Ardent Path</i> · 2,418 words written today / 2,000 goal</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ProgressRing pct={121} size={56} color={A.good} bg={A.rule2} />
              <button style={{ padding: '10px 18px', background: A.ink, color: A.bg, fontFamily: A.display, fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 3, cursor: 'pointer' }}>Continue writing →</button>
            </div>
          </div>
        </div>

        {/* Two-up: Threads + AI noticed */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <div style={{ background: A.paper, border: `1px solid ${A.rule}`, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div style={{ fontFamily: A.mono, fontSize: 10, letterSpacing: 0.16, color: A.ink3, textTransform: 'uppercase' }}>Open threads · 7</div>
              <div style={{ fontFamily: A.mono, fontSize: 10, color: A.accent2 }}>plot lab →</div>
            </div>
            {[
              { n: "Mira's missing brother", c: 'introduced ch.3 · 11 chapters silent', urgent: true },
              { n: 'The Wyrd Stone bargain', c: 'active · last touched ch.12' },
              { n: 'King Aldric\u2019s succession', c: 'active · 4 beats remaining' },
            ].map(t => (
              <div key={t.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: `1px solid ${A.rule2}` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.urgent ? A.accent : A.ink3 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: A.display, fontSize: 15, fontWeight: 500, color: A.ink }}>{t.n}</div>
                  <div style={{ fontSize: 11, color: A.ink3, marginTop: 1 }}>{t.c}</div>
                </div>
                <div style={{ fontFamily: A.mono, fontSize: 10, color: A.ink3 }}>↗</div>
              </div>
            ))}
          </div>

          <div style={{ background: A.paper, border: `1px solid ${A.rule}`, padding: 20 }}>
            <div style={{ fontFamily: A.mono, fontSize: 10, letterSpacing: 0.16, color: A.ink3, textTransform: 'uppercase', marginBottom: 12 }}>The AI noticed · 3</div>
            {[
              { t: 'A new character', n: '"Old Tobyn" appears in ch.13. Add to Cast?' },
              { t: 'A timeline shift', n: 'Caer Drun moved from Tuesday to Thursday' },
              { t: 'A consistency flag', n: 'Mira\u2019s hair was auburn in ch.2; black in ch.13.' },
            ].map(it => (
              <div key={it.n} style={{ padding: '10px 0', borderTop: `1px solid ${A.rule2}` }}>
                <div style={{ fontFamily: A.mono, fontSize: 9, letterSpacing: 0.1, color: A.accent, textTransform: 'uppercase' }}>{it.t}</div>
                <div style={{ fontSize: 13, color: A.ink2, marginTop: 2, lineHeight: 1.4 }}>{it.n}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Direction B: Quiet Grid ────────────────────────────────────────────────
// Modern, restrained, software-like. Reads as Linear/Notion DNA: white-bg,
// systemized type, hairline rules, no decoration. Sober blue-green accent.
const B = {
  bg: '#ffffff',
  panel: '#fafafa',
  sidebar: '#f5f5f4',
  ink: '#0a0a0a',
  ink2: '#525252',
  ink3: '#a3a3a3',
  rule: '#e7e5e4',
  rule2: '#f0efed',
  accent: 'oklch(54% 0.10 200)',
  accent2: 'oklch(54% 0.10 145)',
  font: "'Inter', sans-serif",
  display: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

function ShellB() {
  return (
    <div style={{ width: SHELL_W, height: SHELL_H, background: B.bg, color: B.ink, fontFamily: B.font, display: 'flex', overflow: 'hidden' }}>
      <div style={{ width: 200, background: B.sidebar, borderRight: `1px solid ${B.rule}`, padding: '14px 10px', display: 'flex', flexDirection: 'column', fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 14px' }}>
          <div style={{ width: 24, height: 24, background: B.ink, color: B.bg, borderRadius: 5, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>L</div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Loomwright</div>
          <div style={{ marginLeft: 'auto', fontFamily: B.mono, fontSize: 9, color: B.ink3 }}>v1.0</div>
        </div>
        {/* Search at top */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: B.bg, border: `1px solid ${B.rule}`, borderRadius: 5, marginBottom: 10, fontSize: 12, color: B.ink3 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          <span>Search</span>
          <span style={{ marginLeft: 'auto', fontFamily: B.mono, fontSize: 10, color: B.ink3 }}>⌘K</span>
        </div>
        {/* Nav */}
        {[
          { n: 'Home', a: true },
          { n: 'Write' },
          { n: 'Cast', count: 23 },
          { n: 'World' },
          { n: 'Plot', count: 7 },
          { n: 'Timeline' },
        ].map(it => (
          <div key={it.n} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 8px', marginBottom: 1, borderRadius: 4,
            background: it.a ? B.bg : 'transparent',
            border: it.a ? `1px solid ${B.rule}` : '1px solid transparent',
            color: it.a ? B.ink : B.ink2, fontWeight: it.a ? 500 : 400,
          }}>
            <span>{it.n}</span>
            {it.count && <span style={{ fontFamily: B.mono, fontSize: 10, color: B.ink3 }}>{it.count}</span>}
          </div>
        ))}
        <div style={{ height: 1, background: B.rule, margin: '12px 8px' }} />
        <div style={{ padding: '6px 8px', color: B.ink3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.06 }}>Recent</div>
        {['Mira Vance', 'The Wyrd Stone', 'Ch. 14', 'Caer Drun'].map(r => (
          <div key={r} style={{ padding: '5px 8px', color: B.ink2, fontSize: 12 }}>{r}</div>
        ))}
        <div style={{ marginTop: 'auto', padding: '8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: B.accent, color: B.bg, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 600 }}>D</div>
          <div style={{ fontSize: 12, color: B.ink2 }}>doback06</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 32px', overflow: 'hidden' }}>
        {/* Topbar — breadcrumb + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, fontSize: 12, color: B.ink3 }}>
          <div>Home</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ fontFamily: B.mono, fontSize: 10, padding: '4px 8px', border: `1px solid ${B.rule}`, borderRadius: 4 }}>F1 tutor</div>
            <div style={{ fontFamily: B.mono, fontSize: 10, padding: '4px 8px', border: `1px solid ${B.rule}`, borderRadius: 4 }}>⌘. AI</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: -0.02 }}>Good morning, Daniel.</h1>
          <div style={{ fontSize: 13, color: B.ink2, marginTop: 4 }}>Friday, April 19 · 7-day streak · 14,206 words this week</div>
        </div>

        {/* Resume strip */}
        <div style={{ background: B.panel, border: `1px solid ${B.rule}`, borderRadius: 6, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ProgressRing pct={121} size={44} color={B.accent2} bg={B.rule} thin />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Chapter 14 · The hollow at Caer Drun</div>
              <div style={{ fontSize: 12, color: B.ink2, marginTop: 2 }}>Book II — The Ardent Path · 2,418 / 2,000 today</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ padding: '8px 12px', background: B.bg, border: `1px solid ${B.rule}`, borderRadius: 5, fontSize: 12, color: B.ink2, cursor: 'pointer' }}>Read mode</button>
            <button style={{ padding: '8px 14px', background: B.ink, color: B.bg, border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Continue →</button>
          </div>
        </div>

        {/* 3-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Panel B={B} title="Open threads" count="7" link="Plot Lab">
            {[['Mira\u2019s missing brother', 'silent 11 ch'], ['The Wyrd Stone bargain', 'active'], ['King Aldric\u2019s succession', '4 beats left']].map(([n, m]) => (
              <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${B.rule2}`, fontSize: 12 }}>
                <span style={{ color: B.ink2 }}>{n}</span><span style={{ color: B.ink3, fontFamily: B.mono, fontSize: 10 }}>{m}</span>
              </div>
            ))}
          </Panel>
          <Panel B={B} title="AI noticed" count="3" link="Review all">
            {[['New character', '"Old Tobyn" in ch.13'], ['Timeline', 'Caer Drun day shifted'], ['Consistency', 'Mira\u2019s hair colour']].map(([t, n]) => (
              <div key={n} style={{ padding: '8px 0', borderTop: `1px solid ${B.rule2}` }}>
                <div style={{ fontSize: 10, color: B.accent, textTransform: 'uppercase', letterSpacing: 0.06 }}>{t}</div>
                <div style={{ fontSize: 12, color: B.ink2, marginTop: 1 }}>{n}</div>
              </div>
            ))}
          </Panel>
          <Panel B={B} title="Quiet characters" count="4" link="Cast">
            {[['Greta Holm', 'absent 9 ch'], ['Tomas Vance', 'absent 7 ch'], ['Sir Edrick', 'absent 6 ch']].map(([n, m]) => (
              <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: `1px solid ${B.rule2}`, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: B.rule, color: B.ink2, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 600 }}>{n[0]}</div>
                  <span style={{ color: B.ink2 }}>{n}</span>
                </div>
                <span style={{ color: B.ink3, fontFamily: B.mono, fontSize: 10 }}>{m}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ B, title, count, link, children }) {
  return (
    <div style={{ background: B.panel, border: `1px solid ${B.rule}`, borderRadius: 6, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{title} <span style={{ color: B.ink3, fontWeight: 400, marginLeft: 4 }}>{count}</span></div>
        <div style={{ fontSize: 10, color: B.accent, fontFamily: B.mono }}>{link} →</div>
      </div>
      {children}
    </div>
  );
}

// ─── Direction C: The Loom ──────────────────────────────────────────────────
// Confident moody dark. Ink-blue background. Brass/gold accent. Old-cartography
// engraving feel without going RPG-cosplay. Serif display, mono labels.
const C = {
  bg: '#0f1419',
  panel: '#171d24',
  panel2: '#1d242c',
  sidebar: '#0a0e12',
  ink: '#e8e1d0',
  ink2: '#a8a18f',
  ink3: '#6a655a',
  rule: '#262d36',
  rule2: '#1d242c',
  accent: 'oklch(78% 0.13 78)',   // warm brass
  accent2: 'oklch(72% 0.10 200)', // cool steel
  good: 'oklch(72% 0.13 145)',
  font: "'Inter', sans-serif",
  display: "'Fraunces', serif",
  mono: "'JetBrains Mono', monospace",
};

function ShellC() {
  return (
    <div style={{ width: SHELL_W, height: SHELL_H, background: C.bg, color: C.ink, fontFamily: C.font, display: 'flex', overflow: 'hidden', position: 'relative' }}>
      {/* subtle paper noise overlay */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(255,220,180,0.6), transparent 60%)' }} />

      {/* Sidebar */}
      <div style={{ width: 220, background: C.sidebar, borderRight: `1px solid ${C.rule}`, padding: '20px 14px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 18, borderBottom: `1px solid ${C.rule}`, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, background: C.accent, color: C.sidebar, fontFamily: C.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 16, letterSpacing: -0.5, borderRadius: 2 }}>L<span style={{ fontSize: 14, opacity: 0.6 }}>w</span></div>
          <div>
            <div style={{ fontFamily: C.display, fontWeight: 500, fontSize: 18, letterSpacing: -0.02, color: C.ink }}>Loomwright</div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.accent, letterSpacing: 0.18, textTransform: 'uppercase', marginTop: 2 }}>The Ardent Path</div>
          </div>
        </div>

        {[
          { n: 'Home', a: true, m: '⌘0' },
          { n: 'Write', m: '⌘1' },
          { n: 'Cast', m: '⌘2', count: '23' },
          { n: 'World', m: '⌘3' },
          { n: 'Plot', m: '⌘4', count: '7' },
          { n: 'Timeline', m: '⌘5' },
          { n: 'Settings', m: '⌘,' },
        ].map(it => (
          <div key={it.n} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', marginBottom: 2, borderRadius: 3,
            background: it.a ? `linear-gradient(90deg, ${C.panel}, ${C.panel2})` : 'transparent',
            borderLeft: it.a ? `2px solid ${C.accent}` : '2px solid transparent',
          }}>
            <span style={{ fontFamily: C.display, fontSize: 16, fontWeight: it.a ? 500 : 400, color: it.a ? C.ink : C.ink2 }}>{it.n}</span>
            {it.count && <span style={{ marginLeft: 'auto', fontFamily: C.mono, fontSize: 10, color: C.ink3 }}>{it.count}</span>}
          </div>
        ))}

        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontFamily: C.mono, fontSize: 9, color: C.ink3, letterSpacing: 0.16, textTransform: 'uppercase', padding: '0 12px 6px' }}>Tools</div>
          {['⌘ K  Jump', '⌘ . AI dock', 'F1  Tutor'].map(t => (
            <div key={t} style={{ padding: '4px 12px', fontFamily: C.mono, fontSize: 10, color: C.ink3 }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px 48px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: 0.18, color: C.accent, textTransform: 'uppercase' }}>FRIDAY · 19 APRIL · DAY 217 OF THE LOOM</div>
            <div style={{ fontFamily: C.display, fontWeight: 400, fontSize: 42, letterSpacing: -0.02, marginTop: 6, lineHeight: 1, color: C.ink }}>Welcome back, <span style={{ fontStyle: 'italic', color: C.accent }}>maker</span>.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: C.mono, fontSize: 10, color: C.ink3 }}>
            <div>231k WORDS</div>
            <div style={{ width: 1, height: 14, background: C.rule }} />
            <div>23 CAST</div>
            <div style={{ width: 1, height: 14, background: C.rule }} />
            <div>7 THREADS</div>
          </div>
        </div>

        {/* Resume — large hero */}
        <div style={{ background: `linear-gradient(180deg, ${C.panel} 0%, ${C.panel2} 100%)`, border: `1px solid ${C.rule}`, padding: '28px 32px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px 14px', fontFamily: C.mono, fontSize: 9, letterSpacing: 0.2, color: C.accent, textTransform: 'uppercase', borderLeft: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}` }}>RESUME</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14 }}>
            <div>
              <div style={{ fontFamily: C.mono, fontSize: 10, color: C.ink3, letterSpacing: 0.12 }}>BOOK II · CHAPTER 14</div>
              <div style={{ fontFamily: C.display, fontWeight: 500, fontSize: 30, letterSpacing: -0.01, marginTop: 4, color: C.ink, lineHeight: 1.1 }}>The hollow at Caer Drun</div>
              <div style={{ fontSize: 13, color: C.ink2, marginTop: 12, fontStyle: 'italic', maxWidth: 460, lineHeight: 1.5 }}>"…and the wind, when it came, came carrying the smell of old iron and older promises…"</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: C.display, fontSize: 36, color: C.ink, fontWeight: 500, lineHeight: 1 }}>2,418</div>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.ink3, letterSpacing: 0.12, marginTop: 2 }}>OF 2,000 TODAY</div>
              </div>
              <button style={{ padding: '12px 22px', background: C.accent, color: C.sidebar, fontFamily: C.display, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', letterSpacing: -0.01 }}>Continue weaving →</button>
            </div>
          </div>
        </div>

        {/* Two-up */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: 0.16, color: C.accent, textTransform: 'uppercase' }}>OPEN THREADS</div>
              <div style={{ fontFamily: C.display, fontSize: 24, color: C.ink }}>7</div>
            </div>
            {[
              { n: "Mira's missing brother", c: 'silent · ch.3 → ch.13', urgent: true },
              { n: 'The Wyrd Stone bargain', c: 'active · last in ch.12' },
              { n: "Aldric's succession", c: '4 beats remaining' },
            ].map(t => (
              <div key={t.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: `1px solid ${C.rule}`, marginTop: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: 0, background: t.urgent ? C.accent : C.ink3, transform: 'rotate(45deg)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: C.display, fontSize: 16, color: C.ink }}>{t.n}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 10, color: C.ink3, marginTop: 1, letterSpacing: 0.06 }}>{t.c}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: 0.16, color: C.accent, textTransform: 'uppercase' }}>THE LOOM NOTICED</div>
              <div style={{ fontFamily: C.display, fontSize: 24, color: C.ink }}>3</div>
            </div>
            {[
              { t: 'NEW THREAD', n: '"Old Tobyn" appears in ch.13.' },
              { t: 'TIMELINE', n: 'Caer Drun shifted Tue → Thu' },
              { t: 'SNAGGED', n: 'Mira: auburn → black hair' },
            ].map(it => (
              <div key={it.n} style={{ padding: '10px 0', borderTop: `1px solid ${C.rule}`, marginTop: 4 }}>
                <div style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: 0.16, color: C.accent2 }}>{it.t}</div>
                <div style={{ fontSize: 13, color: C.ink, marginTop: 3 }}>{it.n}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI dock peek */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 8, background: `linear-gradient(180deg, transparent, ${C.accent}, transparent)`, opacity: 0.3 }} />
    </div>
  );
}

// ─── Reusable bits ──────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 56, color = '#000', bg = '#eee', thin = false }) {
  const stroke = thin ? 3 : 5;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="butt" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        fontSize={size > 50 ? 11 : 9} fontWeight="600" fill={color} fontFamily="'JetBrains Mono', monospace">
        {pct}%
      </text>
    </svg>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
function Page() {
  return (
    <DesignCanvas>
      {/* Title section in canvas */}
      <div style={{ padding: '0 60px 32px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.18em', color: 'rgba(60,50,40,0.6)', textTransform: 'uppercase' }}>Document 02 / Aesthetic Directions</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 56, fontWeight: 500, letterSpacing: '-0.02em', color: 'rgba(40,30,20,0.85)', marginTop: 12, lineHeight: 1 }}>Three ways the loom could feel.</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 20, color: 'rgba(60,50,40,0.6)', marginTop: 8 }}>Same nav, same content, three visual languages. Pick one or mix.</div>
      </div>

      <DCSection title="A — Parchment & Press" subtitle="Warm paper, serif display, hand-bound notebook crossed with a serious newsroom CMS. Burnt-sienna accent. Quiet, confident, made-by-a-craftsperson." gap={56}>
        <DCArtboard label="Loomwright · Home — Direction A" width={SHELL_W} height={SHELL_H}>
          <ShellA />
        </DCArtboard>
        <DCPostIt top={-30} left={20} rotate={-2.5}>Most "writerly" — leans editorial. Risk: feels like a magazine, not software.</DCPostIt>
      </DCSection>

      <DCSection title="B — Quiet Grid" subtitle="Modern, restrained, software-first. Linear/Notion DNA. Hairline rules, systemized type, no decoration. Tool gets out of the way." gap={56}>
        <DCArtboard label="Loomwright · Home — Direction B" width={SHELL_W} height={SHELL_H}>
          <ShellB />
        </DCArtboard>
        <DCPostIt top={-30} left={20} rotate={2}>Least friction; most legible. Risk: forgettable. Doesn't claim a personality.</DCPostIt>
      </DCSection>

      <DCSection title="C — The Loom" subtitle="Confident dark moody. Ink-blue ground, brass accent, old-cartography feel without going RPG-cosplay. Evolves the existing dark theme into something prouder." gap={56}>
        <DCArtboard label="Loomwright · Home — Direction C" width={SHELL_W} height={SHELL_H}>
          <ShellC />
        </DCArtboard>
        <DCPostIt top={-30} left={20} rotate={-1.5}>Closest to today's app, evolved. Builds on what users already know. My pick — but it depends what you want to feel like.</DCPostIt>
      </DCSection>

      {/* Recommendation panel */}
      <div style={{ padding: '40px 60px 0', maxWidth: 1100 }}>
        <div style={{ background: '#1a1612', color: '#faf8f4', padding: '40px 48px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.18em', color: 'oklch(78% 0.13 78)', textTransform: 'uppercase' }}>Recommendation</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 500, letterSpacing: '-0.015em', marginTop: 10, lineHeight: 1.1 }}>Direction C as default; A as a "Daylight" mode toggle.</div>
          <div style={{ fontSize: 14, color: 'rgba(250,248,244,0.7)', marginTop: 14, maxWidth: '60ch', lineHeight: 1.6 }}>
            Direction C carries forward what users already love about the current dark theme — but cleans the ornamentation and adds intentional warmth (brass, ink-blue, real serif headings). Direction A becomes an opt-in light/daylight mode for daytime writing sessions. Direction B's restraint principles inform spacing and density across both — we steal its hairlines and its calm, not its full aesthetic.
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(250,248,244,0.5)', letterSpacing: 0.12, marginTop: 24 }}>The prototype in Doc 03 is built in Direction C. Toggleable to A via a header switch.</div>
        </div>
      </div>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Page />);

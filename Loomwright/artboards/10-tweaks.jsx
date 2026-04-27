/* global React, Mono, Pill, Btn, I, ICONS, Frame, Note */
const T10 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 10 — Design tweaks panel
//
// The genuinely-contested decisions, exposed as toggles for the team to argue
// about in conversation. NOT the runtime Tweaks panel — this is a design
// artifact that names the choices we made and the alternatives we rejected.
//
// ── For Claude Code ──
// Don't ship any of these as user-facing settings. They're design decisions —
// pick one and commit. The point of this artboard is to make those decisions
// LEGIBLE so we can discuss them, then bake them in.
//
// Final answers (this is what to build):
//   • Theme              → both day & night (existing) — day is the canvas primary
//   • Pill style         → avatar-led + role microtext
//   • Mention syntax     → unified `@` with optional qualifier prefix
//   • Drawer side        → right (3:7 split, drawer on right)
//   • Marginalia         → "caveat" handwritten + bracket fallback
//   • Suggestion paper   → warmer (#f6efd9) — distinct from canvas paper
//
// All six lock in unless the team objects in review. None of them become
// user prefs without a strong reason — these aren't a kitchen.
// ───────────────────────────────────────────────────────────────────────────
function AB_Tweaks() {
  return (
    <div style={{ padding: 32, color: T10.ink, position: 'relative', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Mono color={T10.accent}>10 · Decisions</Mono>
        <h1 style={{ fontFamily: T10.display, fontSize: 26, fontWeight: 500, color: T10.ink, margin: '4px 0 6px' }}>
          The contested choices
        </h1>
        <div style={{ color: T10.ink2, fontSize: 13, lineHeight: 1.6, maxWidth: 720 }}>
          Six decisions where reasonable people disagreed. Each shows the option I picked
          (highlighted), the alternatives, and why. <strong>None of these become user settings</strong> —
          we commit, and the room stays coherent.
        </div>
      </div>

      <Decision
        n="01"
        title="Mention syntax in the manuscript"
        chose="Unified @ with optional qualifier"
        because="One sigil, one mental model. *italics* collides with markdown; mixed sigils require teaching."
      >
        <Opt picked label="@Tom &nbsp; @loc:Riverside &nbsp; @item:watch">
          <span style={{ fontFamily: T10.display, fontSize: 14 }}>
            <span style={{ color: T10.accent, borderBottom: `1.5px dotted ${T10.accent}` }}>@Tom</span>
            <span style={{ color: T10.ink3 }}> · </span>
            <span style={{ color: T10.accent2, borderBottom: `1.5px dotted ${T10.accent2}` }}>@loc:Riverside</span>
            <span style={{ color: T10.ink3 }}> · </span>
            <span style={{ color: T10.rarityLegendary, borderBottom: `1.5px dotted ${T10.rarityLegendary}` }}>@item:watch</span>
          </span>
        </Opt>
        <Opt label="Mixed sigils per type">
          <span style={{ fontFamily: T10.display, fontSize: 14 }}>
            <span style={{ color: T10.accent }}>@Tom</span>
            <span style={{ color: T10.ink3 }}> · </span>
            <span style={{ color: T10.accent2, fontStyle: 'italic' }}>*Riverside*</span>
            <span style={{ color: T10.ink3 }}> · </span>
            <span style={{ color: T10.rarityLegendary }}>%watch%</span>
          </span>
        </Opt>
        <Opt label="No sigils — plain text + autocomplete">
          <span style={{ fontFamily: T10.display, fontSize: 14, color: T10.ink }}>
            Tom · Riverside · watch
          </span>
        </Opt>
      </Decision>

      <Decision
        n="02"
        title="Selection pill style"
        chose="Avatar-led + role microtext"
        because="Avatar is the fastest visual lookup. Role microtext makes the pill say what's selected without redundancy."
      >
        <Opt picked label="Avatar + name + role">
          <PillPreview style="avatar" />
        </Opt>
        <Opt label="Name only — minimal">
          <PillPreview style="minimal" />
        </Opt>
        <Opt label="Color-coded chip — no avatar">
          <PillPreview style="chip" />
        </Opt>
      </Decision>

      <Decision
        n="03"
        title="Suggestion drawer position"
        chose="Right side, 3:7 manuscript / drawer split"
        because="Manuscript is the primary surface. Right is where attention lands after reading a sentence (LTR cultures). Bottom drawer breaks reading flow."
      >
        <Opt picked label="Right · 7:3"><LayoutPreview side="right" /></Opt>
        <Opt label="Left · 3:7"><LayoutPreview side="left" /></Opt>
        <Opt label="Bottom · 7:3"><LayoutPreview side="bottom" /></Opt>
      </Decision>

      <Decision
        n="04"
        title="Marginalia treatment for accepted suggestions (staged)"
        chose="Handwritten caveat + bracket fallback"
        because="The bracket says 'this is provisional'. The handwriting says 'Claude wrote this, you haven't yet'. Two distinct visual signals — readers find the right one."
      >
        <Opt picked label="[handwritten caveat]">
          <ManuPreview kind="caveat" />
        </Opt>
        <Opt label="italic gray, no bracket"><ManuPreview kind="italic" /></Opt>
        <Opt label="bracket only, no styling"><ManuPreview kind="bracket" /></Opt>
      </Decision>

      <Decision
        n="05"
        title="Suggestion paper colour"
        chose="Warmer than canvas paper (#f6efd9)"
        because="The drawer must read as 'Claude's voice', not 'another panel'. Warmer pulp hints at marginalia / margin notes."
      >
        <Opt picked label={<><span style={{ ...sw(T10.sugg) }} /> #f6efd9 · warmer</>}>
          <PaperSwatch bg={T10.sugg} />
        </Opt>
        <Opt label={<><span style={{ ...sw(T10.paper) }} /> #fbf7ed · same as canvas</>}>
          <PaperSwatch bg={T10.paper} />
        </Opt>
        <Opt label={<><span style={{ ...sw(T10.paper2) }} /> #ffffff · clinical</>}>
          <PaperSwatch bg={T10.paper2} />
        </Opt>
      </Decision>

      <Decision
        n="06"
        title="Atlas basemap default"
        chose="Real (Leaflet/UKMapVisualization)"
        because="Anchor in fact first. Parchment is a one-toggle stylization — keep it as a mode, not the default. Saves us from having to draw fictional geography for every project."
      >
        <Opt picked label="Real cartography">
          <BasemapPreview kind="real" />
        </Opt>
        <Opt label="Parchment / hand-drawn">
          <BasemapPreview kind="parchment" />
        </Opt>
        <Opt label="Schematic (graph layout)">
          <BasemapPreview kind="schematic" />
        </Opt>
      </Decision>

      <Note style={{ top: 80, right: -240, width: 220 }}>
        Six decisions. The reasoning here is also folded into <b>CODE-INSIGHT.md</b>
        as B.9 in each system&rsquo;s section.
      </Note>
    </div>
  );
}

// ── Decision row ────────────────────────────────────────────────────────────
function Decision({ n, title, chose, because, children }) {
  return (
    <div style={{
      background: T10.paper, border: `1px solid ${T10.rule}`, borderRadius: T10.radius,
      padding: 18,
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: T10.radius,
          background: T10.accent, color: T10.paper2,
          fontFamily: T10.mono, fontSize: 12, fontWeight: 600,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>{n}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T10.display, fontSize: 16, color: T10.ink, fontWeight: 500 }}>{title}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: T10.ink2, lineHeight: 1.55 }}>
            <strong style={{ color: T10.accent }}>Chose:</strong> {chose}
          </div>
          <div style={{ marginTop: 2, fontSize: 12, color: T10.ink2, lineHeight: 1.55 }}>
            <em>{because}</em>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}
function Opt({ picked, label, children }) {
  return (
    <div style={{
      background: picked ? T10.accentSoft : T10.paper2,
      border: `1px ${picked ? 'solid' : 'dashed'} ${picked ? T10.accent : T10.rule}`,
      borderRadius: T10.radius,
      padding: 10,
      position: 'relative',
      opacity: picked ? 1 : 0.65,
    }}>
      {picked && (
        <div style={{ position: 'absolute', top: 6, right: 8 }}>
          <Mono color={T10.accent}>✓ CHOSEN</Mono>
        </div>
      )}
      <div style={{ marginBottom: 8 }}>
        <Mono color={picked ? T10.accent : T10.ink3}>{label}</Mono>
      </div>
      <div style={{
        background: T10.paper2, borderRadius: 2, padding: 10,
        minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${T10.rule}`,
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Preview atoms ───────────────────────────────────────────────────────────
function PillPreview({ style }) {
  if (style === 'minimal') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', background: T10.paper, border: `1px solid ${T10.accentSoft}`, borderRadius: 999,
        fontFamily: T10.display, fontSize: 13, color: T10.ink,
      }}>
        Tom Carrow <span style={{ color: T10.ink3, fontFamily: T10.mono, fontSize: 9, marginLeft: 4 }}>×</span>
      </span>
    );
  }
  if (style === 'chip') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 8px', background: T10.accent, color: T10.paper2, borderRadius: 2,
        fontFamily: T10.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
      }}>SEL · TOM CARROW</span>
    );
  }
  // avatar
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 10px 4px 4px', background: T10.paper, border: `1px solid ${T10.accentSoft}`, borderRadius: 999,
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 2, background: T10.accentSoft,
        fontFamily: T10.mono, fontSize: 9, fontWeight: 600, color: T10.accent,
        display: 'grid', placeItems: 'center',
      }}>TC</span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontFamily: T10.display, fontSize: 13, color: T10.ink }}>Tom Carrow</span>
        <span style={{ fontFamily: T10.mono, fontSize: 8, color: T10.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>Cartwright · POV</span>
      </span>
    </span>
  );
}

function LayoutPreview({ side }) {
  const split = side === 'bottom' ? '70% 30%' : (side === 'left' ? '30% 70%' : '70% 30%');
  const dir = side === 'bottom' ? 'column' : 'row';
  const order = side === 'left' ? ['drawer', 'manuscript'] : ['manuscript', 'drawer'];
  const blocks = side === 'bottom' ? ['manuscript', 'drawer'] : order;
  return (
    <div style={{
      width: 160, height: 70,
      display: 'flex', flexDirection: dir, gap: 3,
    }}>
      {blocks.map(b => (
        <div key={b} style={{
          flex: b === 'drawer' ? '0 0 30%' : '1 1 70%',
          background: b === 'drawer' ? T10.sugg : T10.paper2,
          border: `1px solid ${b === 'drawer' ? T10.suggRule : T10.rule}`,
          borderRadius: 2,
          display: 'grid', placeItems: 'center',
        }}>
          <Mono color={b === 'drawer' ? T10.suggInk : T10.ink3} size={8}>
            {b === 'drawer' ? 'CLAUDE' : 'MANUSCRIPT'}
          </Mono>
        </div>
      ))}
    </div>
  );
}

function ManuPreview({ kind }) {
  if (kind === 'caveat') {
    return (
      <span style={{ fontFamily: T10.display, fontSize: 12, color: T10.ink, lineHeight: 1.5 }}>
        Tom stepped onto the bridge,{' '}
        <span style={{
          fontFamily: T10.hand, fontSize: 14, color: T10.suggInk,
          padding: '0 2px', background: '#f6efd9',
          borderLeft: `2px solid ${T10.suggInk}`, paddingLeft: 4,
        }}>[the smell of wet rope behind him]</span>.
      </span>
    );
  }
  if (kind === 'italic') {
    return (
      <span style={{ fontFamily: T10.display, fontSize: 12, color: T10.ink, lineHeight: 1.5 }}>
        Tom stepped onto the bridge, <em style={{ color: T10.ink3 }}>the smell of wet rope behind him</em>.
      </span>
    );
  }
  return (
    <span style={{ fontFamily: T10.display, fontSize: 12, color: T10.ink, lineHeight: 1.5 }}>
      Tom stepped onto the bridge, <span style={{ color: T10.ink2 }}>[the smell of wet rope behind him]</span>.
    </span>
  );
}

function PaperSwatch({ bg }) {
  return (
    <div style={{
      background: bg, width: 110, height: 50,
      border: `1px solid ${T10.suggRule}`, borderRadius: 2,
      display: 'grid', placeItems: 'center',
    }}>
      <span style={{ fontFamily: T10.display, fontSize: 12, color: T10.suggInk, fontStyle: 'italic' }}>
        the watch...
      </span>
    </div>
  );
}

function BasemapPreview({ kind }) {
  if (kind === 'real') {
    return (
      <svg width="120" height="60" viewBox="0 0 120 60" style={{ background: '#e8eedb', borderRadius: 2 }}>
        <path d="M0 28 Q30 10 60 22 T120 18 L120 60 L0 60 Z" fill="#cdd9b8" />
        <path d="M20 8 Q40 20 60 16 T100 22" stroke="#7a8c5c" strokeWidth="0.7" fill="none" />
        <circle cx="48" cy="22" r="2" fill={T10.accent} />
        <circle cx="84" cy="20" r="2" fill={T10.accent2} />
      </svg>
    );
  }
  if (kind === 'parchment') {
    return (
      <svg width="120" height="60" viewBox="0 0 120 60" style={{ background: '#f0e6cf', borderRadius: 2 }}>
        <path d="M10 30 Q30 18 50 28 T90 26 L100 50 L20 50 Z" fill="none" stroke="#8a6f3a" strokeWidth="0.8" />
        <path d="M20 35 Q40 30 60 33" stroke="#8a6f3a" strokeWidth="0.4" fill="none" strokeDasharray="2 1" />
        <text x="55" y="45" fontFamily={T10.hand} fontSize="9" fill="#8a6f3a">Riverside</text>
      </svg>
    );
  }
  return (
    <svg width="120" height="60" viewBox="0 0 120 60" style={{ background: T10.paper2, borderRadius: 2 }}>
      <line x1="20" y1="30" x2="60" y2="20" stroke={T10.ink3} strokeWidth="0.7" />
      <line x1="60" y1="20" x2="100" y2="35" stroke={T10.ink3} strokeWidth="0.7" />
      <circle cx="20" cy="30" r="3" fill={T10.accent} />
      <circle cx="60" cy="20" r="3" fill={T10.accent2} />
      <circle cx="100" cy="35" r="3" fill={T10.rarityLegendary} />
    </svg>
  );
}

function sw(c) {
  return { display: 'inline-block', width: 8, height: 8, background: c, border: `1px solid ${T10.suggRule}`, marginRight: 4, borderRadius: 1 };
}

window.AB_Tweaks = AB_Tweaks;

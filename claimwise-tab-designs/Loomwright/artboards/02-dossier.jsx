/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const { useState: uS2 } = React;
const T2 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 02 — Dossier (vertical collapsible sections)
// Replaces the broken horizontal tab scroller. Order: Stats · Skills ·
// Inventory · Threads · Relationships · Traits & Voice · Knows·Hides·Fears · Arc
// Density default: Stats / Inventory / Threads OPEN, rest collapsed.
//
// ── For Claude Code ──
// Touches:
//   • src/loomwright/dossier/Dossier.jsx  → replace tab scroller with <Section>s
//   • each section maps to existing component (Stats/Skills/Inventory/etc.)
//   • Inventory section embeds <PaperDoll> + <EnhancedInventoryDisplay>
//   • Skills section embeds <SkillTreeVisualizer>
//   • Knows section is NEW — see artboard 07
//
// State contracts:
//   localStorage['dossier.openByChar'][charId] = { stats: bool, skills: bool, ... }
//   character.locationByChapter must exist for Timeline Scrubber (FLAG IF MISSING)
// ───────────────────────────────────────────────────────────────────────────
function AB_Dossier() {
  const [open, setOpen] = uS2({
    stats: true, skills: false, inv: true, threads: true,
    rel: false, voice: false, knows: false, arc: false,
  });
  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }));

  return (
    <div style={{ background: T2.bg, color: T2.ink, padding: 0, minHeight: '100%' }}>
      {/* Room header — selection pill anchors it */}
      <div style={{
        padding: '14px 22px', borderBottom: `1px solid ${T2.rule}`,
        display: 'flex', alignItems: 'center', gap: 14, background: T2.sidebar,
      }}>
        <Mono color={T2.accent}>ROOM · DOSSIER</Mono>
        <span style={{ flex: 1 }} />
        <RoomPill />
        <button style={{ ...iconBtn(), marginLeft: 4 }}><I d={ICONS.pin} size={13} color={T2.ink3} /></button>
      </div>

      {/* Command bar */}
      <div style={{
        padding: '18px 22px 14px', display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: `1px solid ${T2.rule}`,
      }}>
        <Mono2 name="Tom Carrow" size={56} />
        <div style={{ flex: 1 }}>
          <Mono color={T2.accent}>POV · CARTWRIGHT · 27</Mono>
          <div style={{ fontFamily: T2.display, fontSize: 28, color: T2.ink, fontWeight: 500, lineHeight: 1.1, marginTop: 2 }}>
            Tom Carrow
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Pill tone="accent2"><I d={ICONS.map} size={9} color={T2.accent2} style={{ marginRight: 3 }} />RIVERSIDE</Pill>
            <Pill tone="subtle">CH. 04 / 12</Pill>
            <Pill tone="good">ARC · ACT II</Pill>
          </div>
        </div>
        <Btn icon={<I d={ICONS.pen} size={11} color={T2.ink} />}>EDIT</Btn>
        <Btn variant="ghost" icon={<I d={ICONS.sparkle} size={11} color={T2.accent} />}>SUGGEST</Btn>
      </div>

      {/* Sections */}
      <div style={{ padding: '14px 22px 80px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Section open={open.stats} onToggle={() => toggle('stats')}
          name="Stats" count={6} desc="Core attributes · derived from manuscript">
          <StatsBlock />
        </Section>

        <Section open={open.skills} onToggle={() => toggle('skills')}
          name="Skills" count={4} desc="Reuses SkillTreeVisualizer (collapsed preview)">
          <SkillsPreview />
        </Section>

        <Section open={open.inv} onToggle={() => toggle('inv')}
          name="Inventory" count={7} desc="PaperDoll · 3 equipped · 4 stowed">
          <InventoryPane />
        </Section>

        <Section open={open.threads} onToggle={() => toggle('threads')}
          name="Threads" count={3} desc="Filtered to this character">
          <ThreadsPane />
        </Section>

        <Section open={open.rel} onToggle={() => toggle('rel')}
          name="Relationships" count={5} desc="Tangle cluster · 1-hop">
          <Mono color={T2.ink3}>5 ENTRIES — IRIS · MARLO · OLD CARROW · …</Mono>
        </Section>

        <Section open={open.voice} onToggle={() => toggle('voice')}
          name="Traits & Voice" count={9} desc="Voice fingerprint · 4 traits · 5 tics">
          <Mono color={T2.ink3}>FINGERPRINT · 0.83 CONSISTENCY · 2 OUT-OF-VOICE FLAGS</Mono>
        </Section>

        <Section open={open.knows} onToggle={() => toggle('knows')}
          name="Knows · Hides · Fears" count={11} desc="Timeline-aware ledger">
          <KnowsPreview />
        </Section>

        <Section open={open.arc} onToggle={() => toggle('arc')}
          name="Arc" count={4} desc="4 milestones across 12 chapters">
          <Mono color={T2.ink3}>WANT · NEED · LIE · TRUTH</Mono>
        </Section>
      </div>

      <Note style={{ top: 220, right: 32, width: 220 }}>
        Replace horizontal tab scroller in <b>features/Dossier/*</b>. Sections are independently collapsible; persist open-state per-character in <b>ui.dossierOpen[characterId]</b>.
      </Note>
    </div>
  );
}

function RoomPill() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '5px 6px 5px 10px',
      background: T2.paper, border: `1px solid ${T2.accentSoft}`,
      borderRadius: 999,
    }}>
      <Mono color={T2.accent}>SEL</Mono>
      <Mono2 name="Tom Carrow" size={20} />
      <span style={{ fontFamily: T2.display, fontSize: 13, color: T2.ink }}>Tom Carrow</span>
      <button style={iconBtn()}><I d={ICONS.x} size={10} color={T2.ink2} /></button>
    </div>
  );
}
function iconBtn() {
  return {
    width: 22, height: 22, borderRadius: 999, border: `1px solid ${T2.rule}`,
    background: 'transparent', display: 'grid', placeItems: 'center', cursor: 'pointer',
  };
}

function Section({ name, count, desc, open, onToggle, children }) {
  return (
    <div style={{ background: T2.paper, border: `1px solid ${T2.rule}`, borderRadius: T2.radius }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        textAlign: 'left', color: T2.ink,
      }}>
        <I d={open ? ICONS.chevD : ICONS.chev} size={13} color={T2.ink2} />
        <span style={{ fontFamily: T2.display, fontSize: 16, color: T2.ink, fontWeight: 500 }}>{name}</span>
        <span style={{
          fontFamily: T2.mono, fontSize: 9, color: T2.accent,
          padding: '1px 6px', border: `1px solid ${T2.accentSoft}`, borderRadius: 2,
        }}>{String(count).padStart(2, '0')}</span>
        <span style={{ flex: 1 }} />
        <Mono color={T2.ink3}>{desc}</Mono>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${T2.rule}` }}>
          <div style={{ paddingTop: 14 }}>{children}</div>
        </div>
      )}
    </div>
  );
}

function StatsBlock() {
  const stats = [
    ['STR', 12, T2.good], ['VIT', 14, T2.bad], ['INT', 9, '#3b82f6'],
    ['DEX', 11, T2.warn], ['CHA', 8, T2.accent2], ['LCK', 5, T2.rarityUnique],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
      {stats.map(([k, v, c]) => (
        <div key={k} style={{
          padding: 10, background: T2.paper2, border: `1px solid ${T2.rule}`, borderRadius: T2.radius,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <Mono color={c}>{k}</Mono>
          <span style={{ fontFamily: T2.display, fontSize: 24, color: T2.ink }}>{v}</span>
          <div style={{ width: '100%', height: 3, background: T2.rule, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${v * 5}%`, height: '100%', background: c }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillsPreview() {
  const skills = [
    { name: 'Wheelwright', tier: 'Master', c: T2.rarityRare },
    { name: 'River Lore', tier: 'Adept', c: T2.rarityMagic },
    { name: 'Quiet Step', tier: 'Novice', c: T2.rarityCommon },
    { name: 'Old Tongue', tier: 'Locked', c: T2.ink3 },
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {skills.map(s => (
          <div key={s.name} style={{
            padding: '8px 12px', background: T2.paper2, border: `1px solid ${s.c}55`, borderRadius: T2.radius,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: s.c }} />
            <span style={{ fontFamily: T2.display, fontSize: 13, color: T2.ink }}>{s.name}</span>
            <Mono color={s.c}>{s.tier}</Mono>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <Btn variant="ghost" size="sm" icon={<I d={ICONS.chev} size={9} color={T2.ink2} />}>OPEN FULL TREE</Btn>
      </div>
    </div>
  );
}

function InventoryPane() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 14 }}>
      {/* PaperDoll mini */}
      <div style={{
        aspectRatio: '3/4', background: T2.paper2, border: `1px solid ${T2.rule}`,
        borderRadius: T2.radius, position: 'relative', overflow: 'hidden',
      }}>
        <svg viewBox="0 0 200 280" width="100%" style={{ opacity: 0.18, position: 'absolute', inset: 0 }}>
          <g fill="none" stroke={T2.ink2} strokeWidth={1.5} strokeLinejoin="round">
            <ellipse cx="100" cy="38" rx="22" ry="26" />
            <path d="M60 90 Q100 62 140 90 L150 160 Q140 176 124 176 L124 250 L110 258 L100 260 L90 258 L76 250 L76 176 Q60 176 50 160 Z" />
            <path d="M60 90 L35 150 L30 200 L44 202 L50 162" />
            <path d="M140 90 L165 150 L170 200 L156 202 L150 162" />
          </g>
        </svg>
        {[
          ['Head', 50, 12, T2.rarityCommon],
          ['Coat', 50, 38, T2.rarityRare, true],
          ['L.Hand', 22, 50, T2.rarityMagic],
          ['R.Hand', 78, 50, T2.rarityLegendary, '★'],
          ['Belt', 50, 60, T2.rarityCommon, true],
          ['Boots', 50, 86, T2.rarityCommon, true],
        ].map(([n, x, y, c, has]) => (
          <div key={n} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            width: 24, height: 24, background: has ? T2.paper : T2.paper2,
            border: `1.5px solid ${has ? c : T2.rule}`, borderRadius: 2,
            display: 'grid', placeItems: 'center',
            fontSize: 10, color: c, fontFamily: T2.display,
          }}>{has === true ? '◆' : has || ''}</div>
        ))}
        <div style={{
          position: 'absolute', bottom: 4, left: 8,
          fontFamily: T2.mono, fontSize: 7, color: T2.ink3, letterSpacing: 0.14,
          textTransform: 'uppercase',
        }}>PAPER DOLL</div>
      </div>
      {/* Item grid */}
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <Pill tone="accent">EQUIPPED · 3</Pill>
          <Pill tone="subtle">STOWED · 4</Pill>
          <span style={{ flex: 1 }} />
          <Btn variant="ghost" size="sm">+ ADD</Btn>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            ['Father\'s Watch', T2.rarityLegendary, 'EQ'],
            ['Long Coat', T2.rarityRare, 'EQ'],
            ['River Boots', T2.rarityCommon, 'EQ'],
            ['Pewter Cup', T2.rarityCommon],
            ['Letter, Sealed', T2.rarityMagic],
            ['Iron Tools', T2.rarityCommon],
            ['Marlo\'s Token', T2.rarityUnique, '★'],
          ].map(([n, c, eq]) => (
            <div key={n} style={{
              padding: 8, background: T2.paper2, border: `1px solid ${c}55`, borderRadius: T2.radius,
              minHeight: 56, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, background: c, borderRadius: 1 }} />
                {eq && <Mono color={c}>{eq}</Mono>}
              </div>
              <span style={{ fontFamily: T2.display, fontSize: 11, color: T2.ink, lineHeight: 1.15 }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThreadsPane() {
  const threads = [
    ['The Watch', 'active', 4, T2.good],
    ['Marlo\'s Debt', 'active', 2, T2.good],
    ['River Crossing', 'dormant', 1, T2.ink3],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {threads.map(([n, st, ch, c]) => (
        <div key={n} style={{
          padding: '8px 12px', background: T2.paper2, border: `1px solid ${T2.rule}`,
          borderRadius: T2.radius, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: c }} />
          <span style={{ fontFamily: T2.display, fontSize: 14, color: T2.ink, flex: 1 }}>{n}</span>
          <Mono color={c}>{st.toUpperCase()}</Mono>
          <Mono color={T2.ink3}>{ch} CHAPTERS</Mono>
        </div>
      ))}
    </div>
  );
}

function KnowsPreview() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {[
        ['KNOWS', 4, T2.good, 'Watch was father\'s · Marlo lied · …'],
        ['HIDES', 3, T2.warn, 'From Iris · From the village …'],
        ['FEARS', 4, T2.bad, 'Discovery at the river · …'],
      ].map(([k, n, c, hint]) => (
        <div key={k} style={{ padding: 10, background: T2.paper2, border: `1px solid ${c}55`, borderRadius: T2.radius }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <Mono color={c}>{k}</Mono>
            <Mono color={c}>{n}</Mono>
          </div>
          <div style={{ fontSize: 11, color: T2.ink2, lineHeight: 1.5 }}>{hint}</div>
        </div>
      ))}
    </div>
  );
}

window.AB_Dossier = AB_Dossier;

/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const T6c = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 06c — Skill Detail (single-skill full editor)
//
// ── For Claude Code ──
// Opens when a user picks a skill from list/canvas and presses ⌘↵ or
// "OPEN FULL". This is the "deep authoring" view — the inspector sidebar in
// 06b is the quick view. Both share the same data; this surface gets MORE
// space for prose, narrative refs, and prereq logic editing.
//
// Reuses the same primitives as ItemEditor (Field, Section, NodeInspector
// chunks). Don't reinvent.
// ───────────────────────────────────────────────────────────────────────────
function AB_SkillDetail() {
  return (
    <div style={{ background: T6c.bg, color: T6c.ink, padding: 0 }}>
      {/* breadcrumb header */}
      <div style={{ padding: '10px 22px', background: T6c.sidebar, borderBottom: `1px solid ${T6c.rule}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mono color={T6c.ink3}>SKILLS</Mono>
        <Mono color={T6c.ink3}>›</Mono>
        <Mono color={T6c.ink3}>RIVER LORE TREE</Mono>
        <Mono color={T6c.ink3}>›</Mono>
        <Mono color={T6c.accent}>OLD TONGUE</Mono>
        <span style={{ flex: 1 }} />
        <Btn size="sm" variant="ghost"><I d={ICONS.chev} size={10} color={T6c.ink2} style={{ transform: 'rotate(180deg)' }} /> PREV NODE</Btn>
        <Btn size="sm" variant="ghost">NEXT NODE <I d={ICONS.chev} size={10} color={T6c.ink2} /></Btn>
      </div>

      <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>
        {/* main column */}
        <div>
          <Mono color={T6c.rarityUnique}>UNIQUE · LANGUAGE</Mono>
          <h1 style={{ fontFamily: T6c.display, fontSize: 36, fontWeight: 500, color: T6c.ink, margin: '4px 0 0', letterSpacing: -0.4 }}>
            Old Tongue
          </h1>
          <div style={{ fontSize: 13, color: T6c.ink2, marginTop: 4, fontStyle: 'italic' }}>
            "Three dozen verbs, half of them for water."
          </div>

          {/* Description */}
          <Section6c title="DESCRIPTION · player-facing">
            <textarea defaultValue={`The pre-canal speech of bargemen. A relic language preserved on the river — half-Welsh, half-something older. Speakers can be recognised across the canal-towns; they read the carved boundary stones, understand the watermen's calls, and remember the names of fords no map shows.\n\nKnowing it is rarely useful. When it is, it is the only thing that is useful.`} style={{
              width: '100%', minHeight: 120, padding: 12,
              background: T6c.paper2, border: `1px solid ${T6c.rule}`, borderRadius: T6c.radius,
              fontFamily: T6c.display, fontSize: 14, color: T6c.ink, lineHeight: 1.6,
              outline: 'none', resize: 'vertical',
            }} />
          </Section6c>

          {/* Unlock requirements */}
          <Section6c title="UNLOCK · prereq logic" subtitle="Boolean composition. Drag chips to reorder; click AND/OR to flip.">
            <div style={{
              padding: 14, background: T6c.paper2, border: `1px solid ${T6c.rule}`, borderRadius: T6c.radius,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <PrereqLine>
                <PrereqChip>River Lore <strong>≥ Adept</strong></PrereqChip>
                <Op>AND</Op>
                <PrereqChip>Chapter <strong>≥ 06</strong></PrereqChip>
              </PrereqLine>
              <Mono color={T6c.ink3} style={{ marginLeft: 8 }}>OR</Mono>
              <PrereqLine>
                <PrereqChip cross>→ <strong>Combat:Old Bargeman's Hand</strong></PrereqChip>
                <Mono color={T6c.ink3}>cross-tree</Mono>
              </PrereqLine>
              <button style={addRowBtn6c()}>
                <I d={ICONS.plus} size={10} color={T6c.accent} />
                <Mono color={T6c.accent}>ADD CONDITION</Mono>
              </button>
            </div>
          </Section6c>

          {/* Effects */}
          <Section6c title="EFFECTS · while active"
                   subtitle="Stat modifiers stack with item mods. Flags are read by the narrative system.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <EffectCard kind="stat">
                <Mono color={T6c.good}>+2 LORE</Mono>
                <div style={{ fontSize: 11, color: T6c.ink2, marginTop: 2 }}>permanent while active</div>
              </EffectCard>
              <EffectCard kind="flag">
                <Mono color={T6c.accent2}>FLAG · comprehend.bargemen</Mono>
                <div style={{ fontSize: 11, color: T6c.ink2, marginTop: 2, fontFamily: T6c.mono }}>
                  → narrative system reads this on @-mention dialogue
                </div>
              </EffectCard>
              <EffectCard kind="grant">
                <Mono color={T6c.accent}>GRANTS · Read carved stones</Mono>
                <div style={{ fontSize: 11, color: T6c.ink2, marginTop: 2 }}>
                  unlocks "Decipher" affordance on stone @loc
                </div>
              </EffectCard>
              <button style={addRowBtn6c()}>
                <I d={ICONS.plus} size={10} color={T6c.accent} />
                <Mono color={T6c.accent}>ADD EFFECT</Mono>
              </button>
            </div>
          </Section6c>

          {/* Narrative references */}
          <Section6c title="NARRATIVE REFERENCES · 3"
                   subtitle="Auto-detected mentions in the manuscript. Click any to jump to the paragraph.">
            <NarRef ch="ch.04 · ¶12"
              snippet="…the strange old vowel his grandfather had used, the one for the slow water under the willow." />
            <NarRef ch="ch.06 · ¶03"
              snippet="The bargeman answered in the old tongue, and Tom, to his own surprise, answered back." />
            <NarRef ch="ch.07 · ¶21"
              snippet="There were words for water Tom didn't yet know — three at least, for the same patch of river at dawn." />
          </Section6c>

          {/* Save bar */}
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${T6c.rule}`, display: 'flex', gap: 8 }}>
            <Btn variant="primary" size="lg">SAVE</Btn>
            <Btn size="lg">SAVE &amp; CLOSE</Btn>
            <span style={{ flex: 1 }} />
            <Btn size="lg" variant="ghost"><I d={ICONS.x} size={11} color={T6c.bad} /> DELETE NODE</Btn>
          </div>
        </div>

        {/* Side rail — tree position + meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Frame kicker="POSITION · in tree" title="River Lore">
            {/* mini-tree */}
            <svg viewBox="0 0 280 200" style={{ width: '100%', height: 200 }}>
              <line x1="140" y1="30" x2="80" y2="100" stroke={T6c.rule} strokeWidth="1.5" />
              <line x1="140" y1="30" x2="200" y2="100" stroke={T6c.rule} strokeWidth="1.5" />
              <line x1="80" y1="100" x2="80" y2="170" stroke={T6c.rule} strokeWidth="1.5" />
              <line x1="200" y1="100" x2="200" y2="170" stroke={T6c.accent} strokeWidth="2.5" />
              <line x1="200" y1="170" x2="200" y2="170" />
              {/* nodes */}
              <NodeMini cx={140} cy={30} c={T6c.rarityRare} label="River Lore" />
              <NodeMini cx={80} cy={100} c={T6c.rarityCommon} label="Ferry Knot" />
              <NodeMini cx={200} cy={100} c={T6c.rarityUnique} label="Old Tongue" big />
              <NodeMini cx={80} cy={170} c={T6c.rarityCommon} label="Knots" />
              <NodeMini cx={200} cy={170} c={T6c.rarityUnique} label="Name of the River" />
            </svg>
          </Frame>

          <Frame kicker="META" title="Authoring">
            <Meta label="Tier" value={<Pill tone="accent" filled>UNIQUE</Pill>} />
            <Meta label="Tags" value={
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Pill tone="accent2">LANGUAGE</Pill>
                <Pill tone="accent2">RIVER</Pill>
                <Pill tone="subtle">LORE</Pill>
              </div>
            } />
            <Meta label="Created" value={<span style={{ fontSize: 11, color: T6c.ink }}>day 1 · ch.04 draft</span>} />
            <Meta label="Last edited" value={<span style={{ fontSize: 11, color: T6c.ink }}>2h ago · by you</span>} />
            <Meta label="ID" value={<code style={{ fontFamily: T6c.mono, fontSize: 10, color: T6c.ink2 }}>old-tongue</code>} />
          </Frame>

          <Frame kicker="DANGER ZONE" title="Cascade impact" style={{ borderColor: T6c.bad + '55' }}>
            <div style={{ fontSize: 11, color: T6c.ink2, lineHeight: 1.55 }}>
              Deleting this node will:
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: T6c.ink2 }}>
                <li>Remove 1 child node (<em>Name of the River</em>) or detach it</li>
                <li>Strip the <code>comprehend.bargemen</code> flag from 3 narrative refs</li>
                <li>Remove from Marris's active-skill list</li>
              </ul>
            </div>
          </Frame>
        </div>
      </div>
    </div>
  );
}

function Section6c({ title, subtitle, children }) {
  return (
    <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${T6c.rule}` }}>
      <Mono color={T6c.ink3}>{title}</Mono>
      {subtitle && <div style={{ fontSize: 11, color: T6c.ink3, marginTop: 2, lineHeight: 1.45 }}>{subtitle}</div>}
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}
function PrereqLine({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{children}</div>
  );
}
function PrereqChip({ children, cross }) {
  return (
    <span style={{
      padding: '5px 10px',
      background: T6c.paper, border: `1px solid ${cross ? T6c.accent2 : T6c.rule}`,
      borderRadius: T6c.radius,
      fontFamily: T6c.display, fontSize: 13, color: T6c.ink,
    }}>{children}</span>
  );
}
function Op({ children }) {
  return (
    <span style={{
      padding: '3px 8px', background: T6c.accent, color: T6c.paper2,
      borderRadius: 2, fontFamily: T6c.mono, fontSize: 9, fontWeight: 600,
      letterSpacing: 0.18, cursor: 'pointer',
    }}>{children}</span>
  );
}
function EffectCard({ kind, children }) {
  const c = kind === 'stat' ? T6c.good : kind === 'flag' ? T6c.accent2 : T6c.accent;
  return (
    <div style={{
      padding: 10, background: T6c.paper2, border: `1px solid ${c}55`, borderRadius: T6c.radius,
      borderLeft: `3px solid ${c}`,
    }}>{children}</div>
  );
}
function NarRef({ ch, snippet }) {
  return (
    <div style={{
      padding: 12, background: T6c.paper2, border: `1px solid ${T6c.rule}`, borderRadius: T6c.radius,
      borderLeft: `2px solid ${T6c.accent}`, marginBottom: 6,
    }}>
      <Mono color={T6c.accent}>{ch}</Mono>
      <div style={{ fontFamily: T6c.display, fontSize: 13, color: T6c.ink2, marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>
        "{snippet}"
      </div>
    </div>
  );
}
function Meta({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
      <Mono color={T6c.ink3} style={{ width: 80 }}>{label.toUpperCase()}</Mono>
      <span style={{ flex: 1 }}>{value}</span>
    </div>
  );
}
function NodeMini({ cx, cy, c, label, big }) {
  const r = big ? 10 : 7;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={T6c.paper2} stroke={c} strokeWidth={big ? 3 : 1.5} />
      <text x={cx} y={cy + r + 12} textAnchor="middle" fontFamily={T6c.display} fontSize="10" fill={T6c.ink}>{label}</text>
    </g>
  );
}
function addRowBtn6c() {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 10px',
    background: 'transparent',
    border: `1px dashed ${T6c.accent}`,
    borderRadius: T6c.radius, cursor: 'pointer',
  };
}

window.AB_SkillDetail = AB_SkillDetail;

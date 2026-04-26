/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const { useState: uS6d } = React;
const T6d = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 06d — Tree assignment + per-character progression
//
// ── For Claude Code ──
// One grid: rows are characters, columns are tree nodes (grouped by tree).
// Each cell is one of: ✓ active, ◐ unlocked-but-not-active, ◯ available, · locked.
// Click a cell to flip state. Click a row header to focus a character; click a
// column header to focus a node.
//
// New schema (FLAG IF MISSING):
//   Character.skillProgress: Record<SkillId, 'active' | 'unlocked' | 'available' | 'locked'>
//   Character.treeAccess: TreeId[]   // which trees this character can use
// ───────────────────────────────────────────────────────────────────────────
function AB_TreeAssignment() {
  const chars = [
    { name: 'Tom Carrow',  trees: ['wheelwright', 'river-lore'],          progress: 0.42 },
    { name: 'Iris Vell',   trees: ['social'],                              progress: 0.20 },
    { name: 'Marris Quail',trees: ['river-lore', 'social', 'combat'],     progress: 0.71 },
    { name: 'Old Carrow',  trees: ['wheelwright'],                         progress: 0.95 },
  ];
  const trees = [
    { id: 'wheelwright', name: 'Wheelwright', c: T6d.rarityLegendary, nodes: ['Wheel', 'River Lore', 'Quiet'] },
    { id: 'river-lore',  name: 'River Lore',  c: T6d.rarityRare,      nodes: ['Ferry', 'Old Tongue', 'Name'] },
    { id: 'social',      name: 'Social',      c: T6d.accent,          nodes: ['Read', 'Lie', 'Persuade'] },
    { id: 'combat',      name: 'Combat',      c: T6d.bad,             nodes: ['Block', 'Strike', 'Dodge'] },
  ];
  // states: 0=locked, 1=available, 2=unlocked, 3=active
  const grid = {
    'Tom Carrow':   [3, 2, 2, 1, 0, 0, 1, 0, 0, 0, 0, 0],
    'Iris Vell':    [0, 0, 0, 0, 0, 0, 3, 2, 1, 0, 0, 0],
    'Marris Quail': [0, 0, 0, 3, 3, 1, 2, 2, 0, 3, 2, 1],
    'Old Carrow':   [3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
  return (
    <div style={{ background: T6d.bg, color: T6d.ink, padding: 22 }}>
      <Mono color={T6d.accent}>06D · TREE ASSIGNMENT &amp; PROGRESSION</Mono>
      <h2 style={{ fontFamily: T6d.display, fontSize: 22, color: T6d.ink, fontWeight: 500, margin: '4px 0 4px' }}>
        Who knows what
      </h2>
      <div style={{ fontSize: 12, color: T6d.ink2, marginBottom: 16, lineHeight: 1.55, maxWidth: 700 }}>
        Each row is a character, columns are skills grouped by tree. Click a cell to cycle:
        locked → available → unlocked → active. Each character only sees the trees they have access to.
      </div>

      <div style={{
        background: T6d.paper, border: `1px solid ${T6d.rule}`, borderRadius: T6d.radius,
        overflow: 'hidden',
      }}>
        {/* Header rows */}
        <div style={{ display: 'grid', gridTemplateColumns: `220px repeat(${trees.length}, 1fr)`, borderBottom: `1px solid ${T6d.rule}` }}>
          <div style={{ padding: '10px 14px', background: T6d.paper2, borderRight: `1px solid ${T6d.rule}` }}>
            <Mono color={T6d.ink3}>CHARACTER</Mono>
          </div>
          {trees.map(t => (
            <div key={t.id} style={{
              padding: '8px 12px', background: T6d.paper2,
              borderRight: `1px solid ${T6d.rule}`,
              borderTop: `3px solid ${t.c}`,
            }}>
              <div style={{ fontFamily: T6d.display, fontSize: 13, color: T6d.ink, marginTop: -2 }}>{t.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginTop: 4 }}>
                {t.nodes.map(n => (
                  <Mono key={n} color={T6d.ink3} size={8} style={{ textAlign: 'center' }}>{n.toUpperCase().slice(0, 5)}</Mono>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Body rows */}
        {chars.map((c, ri) => (
          <div key={c.name} style={{
            display: 'grid', gridTemplateColumns: `220px repeat(${trees.length}, 1fr)`,
            borderBottom: ri < chars.length - 1 ? `1px solid ${T6d.rule}` : 'none',
          }}>
            <div style={{ padding: '12px 14px', background: T6d.paper2, borderRight: `1px solid ${T6d.rule}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mono2 name={c.name} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T6d.display, fontSize: 13, color: T6d.ink }}>{c.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <div style={{ flex: 1, height: 4, background: T6d.bg, borderRadius: 2, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${c.progress * 100}%`, background: T6d.accent, borderRadius: 2 }} />
                  </div>
                  <Mono color={T6d.ink3}>{Math.round(c.progress * 100)}%</Mono>
                </div>
              </div>
            </div>
            {trees.map((t, ti) => {
              const accessible = c.trees.includes(t.id);
              return (
                <div key={t.id} style={{
                  padding: 10, borderRight: `1px solid ${T6d.rule}`,
                  background: accessible ? T6d.paper : `${T6d.paper2}88`,
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4,
                }}>
                  {[0, 1, 2].map(ni => {
                    const idx = ti * 3 + ni;
                    const state = accessible ? (grid[c.name][idx] || 0) : -1;
                    return <Cell key={ni} state={state} c={t.c} />;
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Mono color={T6d.ink3}>LEGEND</Mono>
        <CellLegend state={3} label="Active" hint="equipped + applying effects" />
        <CellLegend state={2} label="Unlocked" hint="known, but not active" />
        <CellLegend state={1} label="Available" hint="prereqs met, can unlock" />
        <CellLegend state={0} label="Locked" hint="prereqs not met" />
        <CellLegend state={-1} label="No access" hint="tree not granted to character" />
      </div>
    </div>
  );
}

function Cell({ state, c }) {
  if (state === -1) {
    return <div style={{
      height: 26, background: 'transparent', border: `1px dashed ${T6d.rule}`, borderRadius: 2,
    }} />;
  }
  const styles = [
    { bg: T6d.paper2, fg: T6d.ink3, mark: '·', border: T6d.rule },
    { bg: T6d.paper2, fg: c, mark: '○', border: c + '55' },
    { bg: c + '15', fg: c, mark: '◐', border: c + '88' },
    { bg: c, fg: T6d.paper2, mark: '✓', border: c },
  ];
  const s = styles[state];
  return (
    <div style={{
      height: 26, background: s.bg, border: `1.5px solid ${s.border}`,
      borderRadius: 2, display: 'grid', placeItems: 'center', cursor: 'pointer',
      fontFamily: T6d.mono, fontSize: 12, fontWeight: 600, color: s.fg,
    }}>{s.mark}</div>
  );
}
function CellLegend({ state, label, hint }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 26, height: 22 }}><Cell state={state} c={T6d.accent} /></div>
      <Mono color={T6d.ink}>{label}</Mono>
      <Mono color={T6d.ink3}>· {hint}</Mono>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Artboard 06e — Build simulator
// ───────────────────────────────────────────────────────────────────────────
function AB_BuildSim() {
  return (
    <div style={{ background: T6d.bg, color: T6d.ink, padding: 22 }}>
      <Mono color={T6d.accent}>06E · BUILD SIMULATOR</Mono>
      <h2 style={{ fontFamily: T6d.display, fontSize: 22, color: T6d.ink, fontWeight: 500, margin: '4px 0 4px' }}>
        Try this build on Tom
      </h2>
      <div style={{ fontSize: 12, color: T6d.ink2, marginBottom: 16, lineHeight: 1.55, maxWidth: 700 }}>
        Pick nodes hypothetically — see derived stats, granted skills, and which narrative
        moments would change. Doesn't commit until you press <strong>APPLY TO ACTOR</strong>.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Left — pickable nodes */}
        <div style={{
          background: T6d.paper, border: `1px solid ${T6d.rule}`, borderRadius: T6d.radius,
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Mono color={T6d.ink3}>BUILD · for</Mono>
            <select style={{
              padding: '4px 10px', background: T6d.paper2, border: `1px solid ${T6d.rule}`,
              borderRadius: T6d.radius, fontFamily: T6d.display, fontSize: 13, color: T6d.ink,
            }}>
              <option>Tom Carrow</option>
              <option>Iris Vell</option>
              <option>Marris Quail</option>
            </select>
            <span style={{ flex: 1 }} />
            <Mono color={T6d.ink3}>BUDGET</Mono>
            <Mono color={T6d.accent}>5 / 8 PTS</Mono>
          </div>

          <Mono color={T6d.ink3}>WHEELWRIGHT</Mono>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, marginBottom: 12 }}>
            <PickNode label="Wheelwright" tier="master" picked />
            <PickNode label="River Lore" tier="adept" picked />
            <PickNode label="Quiet Step" tier="novice" picked />
            <PickNode label="Bridge Eye" tier="locked" />
          </div>

          <Mono color={T6d.ink3}>RIVER LORE</Mono>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, marginBottom: 12 }}>
            <PickNode label="Ferry Knot" tier="novice" picked />
            <PickNode label="Old Tongue" tier="unique" picked dim />
            <PickNode label="Name of the River" tier="unique" />
          </div>

          <Mono color={T6d.ink3}>SOCIAL</Mono>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            <PickNode label="Read People" tier="novice" />
            <PickNode label="Lie Plain" tier="rare" />
          </div>

          <div style={{ marginTop: 18, paddingTop: 12, borderTop: `1px solid ${T6d.rule}`, display: 'flex', gap: 8 }}>
            <Btn variant="primary">APPLY TO TOM</Btn>
            <Btn>SAVE BUILD</Btn>
            <Btn variant="ghost">RESET</Btn>
            <span style={{ flex: 1 }} />
            <Btn variant="ghost" icon={<I d={ICONS.sparkle} size={10} color={T6d.accent} />}>SUGGEST FOR ARC</Btn>
          </div>
        </div>

        {/* Right — derived effects */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Frame kicker="DERIVED STATS · vs current" title="Tom Carrow">
            <BuildStat stat="strength" base={12} now={13} sim={13} />
            <BuildStat stat="dexterity" base={14} now={16} sim={16} />
            <BuildStat stat="perception" base={11} now={12} sim={14} delta={+2} />
            <BuildStat stat="lore" base={9} now={9} sim={13} delta={+4} />
            <BuildStat stat="resolve" base={10} now={9} sim={9} />
          </Frame>

          <Frame kicker="FLAGS · gained" title="Active narrative flags">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FlagRow flag="comprehend.bargemen" gained />
              <FlagRow flag="navigation.ferries" gained />
              <FlagRow flag="recognise.carrow-mark" current />
            </div>
          </Frame>

          <Frame kicker="NARRATIVE IMPACT" title="2 chapters change">
            <div style={{ fontSize: 11, color: T6d.ink2, lineHeight: 1.55 }}>
              <div style={{ borderLeft: `2px solid ${T6d.accent}`, paddingLeft: 8, marginBottom: 6 }}>
                <Mono color={T6d.accent}>CH.06 · ¶03</Mono>
                <div>Tom would now <em>understand</em> the bargeman's reply. New affordance: respond.</div>
              </div>
              <div style={{ borderLeft: `2px solid ${T6d.warn}`, paddingLeft: 8 }}>
                <Mono color={T6d.warn}>CH.07 · ¶21</Mono>
                <div>"words for water Tom didn't yet know" — copy may need revision.</div>
              </div>
            </div>
          </Frame>
        </div>
      </div>
    </div>
  );
}

function PickNode({ label, tier, picked, dim }) {
  const c = {
    master: T6d.rarityLegendary, adept: T6d.rarityRare, novice: T6d.rarityCommon,
    unique: T6d.rarityUnique, rare: T6d.rarityRare, locked: T6d.ink3,
  }[tier];
  return (
    <button style={{
      padding: '7px 11px',
      background: picked ? T6d.paper2 : 'transparent',
      border: `${picked ? 2 : 1}px ${tier === 'locked' ? 'dashed' : 'solid'} ${c}`,
      borderRadius: T6d.radius, cursor: 'pointer',
      opacity: dim ? 0.65 : (tier === 'locked' ? 0.5 : 1),
      display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      {picked && <I d={ICONS.check} size={10} color={c} />}
      <span style={{ fontFamily: T6d.display, fontSize: 12, color: T6d.ink }}>{label}</span>
      <Mono color={c}>{tier.toUpperCase().slice(0, 3)}</Mono>
    </button>
  );
}
function BuildStat({ stat, base, now, sim, delta }) {
  const max = 20;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <Mono color={T6d.ink2} style={{ width: 80 }}>{stat.toUpperCase()}</Mono>
      <div style={{ flex: 1, height: 8, background: T6d.bg, borderRadius: 3, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(now / max) * 100}%`, background: T6d.ink3, borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(sim / max) * 100}%`, background: delta > 0 ? T6d.good : T6d.ink2, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: T6d.mono, fontSize: 11, color: T6d.ink, minWidth: 28, textAlign: 'right' }}>{sim}</span>
      {delta !== undefined && delta > 0 && (
        <span style={{ fontFamily: T6d.mono, fontSize: 9, color: T6d.good, minWidth: 24 }}>+{delta}</span>
      )}
    </div>
  );
}
function FlagRow({ flag, gained, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: gained ? T6d.good : T6d.ink2 }} />
      <code style={{ fontFamily: T6d.mono, fontSize: 11, color: T6d.ink, flex: 1 }}>{flag}</code>
      <Mono color={gained ? T6d.good : T6d.ink3}>{gained ? '+ NEW' : 'KEPT'}</Mono>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Artboard 06f — Effects DSL reference
// ───────────────────────────────────────────────────────────────────────────
function AB_EffectsDSL() {
  return (
    <div style={{ background: T6d.bg, color: T6d.ink, padding: 22 }}>
      <Mono color={T6d.accent}>06F · EFFECTS DSL · reference</Mono>
      <h2 style={{ fontFamily: T6d.display, fontSize: 22, color: T6d.ink, fontWeight: 500, margin: '4px 0 4px' }}>
        Flag namespaces &amp; effect grammar
      </h2>
      <div style={{ fontSize: 12, color: T6d.ink2, marginBottom: 16, lineHeight: 1.55, maxWidth: 720 }}>
        Skills emit two kinds of effects: <strong>stat mods</strong> (numerical, stack with item mods)
        and <strong>flags</strong> (boolean, read by the narrative system). Flags use a fixed
        namespace tree — extend by adding to <code style={mono6d()}>src/loomwright/skills/dsl.ts</code>.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Stat mods */}
        <Frame kicker="A · STAT MODIFIERS" title="Numerical, additive">
          <DslLine code="{ stats: { lore: +2 } }" desc="adds +2 to lore while active" />
          <DslLine code="{ stats: { dexterity: +1, resolve: -1 } }" desc="trade-off mods" />
          <DslLine code="{ stats: { lore: { mult: 1.5 } } }" desc="multiplier (rare; only on unique nodes)" />
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T6d.rule}`, fontSize: 11, color: T6d.ink2, lineHeight: 1.55 }}>
            Stack with <em>item mods</em> additively: derived = base + Σ(item mods) + Σ(skill mods).
            Multipliers apply last.
          </div>
        </Frame>

        {/* Flags */}
        <Frame kicker="B · FLAGS · namespaces" title="Boolean, read by narrative">
          <NsRow ns="comprehend." desc="character understands a language / sign-system">
            <code style={mono6d()}>comprehend.bargemen</code>
            <code style={mono6d()}>comprehend.carrow-cipher</code>
          </NsRow>
          <NsRow ns="recognise." desc="character can identify on sight">
            <code style={mono6d()}>recognise.carrow-mark</code>
            <code style={mono6d()}>recognise.fender-knot</code>
          </NsRow>
          <NsRow ns="navigation." desc="terrain / travel affordances">
            <code style={mono6d()}>navigation.ferries</code>
            <code style={mono6d()}>navigation.fords</code>
          </NsRow>
          <NsRow ns="social." desc="dialogue affordances unlocked">
            <code style={mono6d()}>social.lie-plain</code>
            <code style={mono6d()}>social.read-grief</code>
          </NsRow>
          <NsRow ns="combat." desc="combat actions / postures">
            <code style={mono6d()}>combat.first-strike</code>
            <code style={mono6d()}>combat.parry-haft</code>
          </NsRow>
        </Frame>
      </div>

      <Frame kicker="C · EXAMPLE · full SkillNode.effects" title="The Old Tongue node, fully expanded" style={{ marginTop: 16 }}>
        <pre style={{
          background: T6d.paper2, border: `1px solid ${T6d.rule}`, borderRadius: T6d.radius,
          padding: 14, margin: 0, fontFamily: T6d.mono, fontSize: 11.5, color: T6d.ink,
          lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowX: 'auto',
        }}>{`{
  "id": "old-tongue",
  "name": "Old Tongue",
  "tier": "unique",
  "unlockReqs": {
    "any": [
      { "all": [
        { "prereqId": "river-lore", "minTier": "adept" },
        { "minChapter": 6 }
      ]},
      { "prereqId": "combat:old-bargemans-hand" }     // cross-tree
    ]
  },
  "effects": {
    "stats":  { "lore": +2 },
    "flags":  [ "comprehend.bargemen" ],
    "grants": [ "decipher-stones" ]                    // affordance ids
  }
}`}</pre>
      </Frame>
    </div>
  );
}
function DslLine({ code, desc }) {
  return (
    <div style={{ marginBottom: 8, padding: '8px 10px', background: T6d.paper2, border: `1px solid ${T6d.rule}`, borderRadius: T6d.radius }}>
      <code style={{ fontFamily: T6d.mono, fontSize: 11, color: T6d.accent }}>{code}</code>
      <div style={{ fontSize: 11, color: T6d.ink2, marginTop: 3, lineHeight: 1.45 }}>{desc}</div>
    </div>
  );
}
function NsRow({ ns, desc, children }) {
  return (
    <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T6d.rule}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <code style={{ fontFamily: T6d.mono, fontSize: 12, color: T6d.accent2, fontWeight: 600 }}>{ns}</code>
        <span style={{ fontSize: 11, color: T6d.ink2 }}>{desc}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
        {React.Children.map(children, ch => <span style={{ padding: '2px 6px', background: T6d.paper2, border: `1px solid ${T6d.rule}`, borderRadius: 2 }}>{ch}</span>)}
      </div>
    </div>
  );
}
function mono6d() { return { fontFamily: T6d.mono, fontSize: 11, color: T6d.accent, padding: '1px 5px', background: T6d.paper2, border: `1px solid ${T6d.rule}`, borderRadius: 2 }; }

window.AB_TreeAssignment = AB_TreeAssignment;
window.AB_BuildSim = AB_BuildSim;
window.AB_EffectsDSL = AB_EffectsDSL;

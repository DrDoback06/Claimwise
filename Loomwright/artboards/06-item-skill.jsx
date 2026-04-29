/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const { useState: uS6 } = React;
const T6 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 06 — Item Editor + Skill Tree Editor
//
// ── For Claude Code ──
// Item editor wraps EnhancedItemVault (src/loomwright/wardrobe/) and adds:
//   • Stat modifiers (+/- to actor stats when equipped)
//   • Granted skills (skill IDs unlocked while equipped)
//   • Live actor preview right rail — shows Tom's stats with/without this item
//
// Skill tree editor is NEW — pair with SkillTreeSystem (src/loomwright/skills/).
// Same UX vocabulary as the item editor: form left, live preview right,
// right-click on tree canvas to add nodes / link / delete.
//
// Required schema additions (FLAG IF MISSING):
//   Item.statMods: Record<StatKey, number>          // e.g. { dexterity: +2, perception: -1 }
//   Item.grantedSkills: SkillId[]                    // skills unlocked while equipped
//   Character.derivedStats: Record<StatKey, number>  // computed = base + sum(equipped.statMods)
//   SkillNode.unlockReqs: { prereqIds: SkillId[]; minChapter?: number; minStat?: {key,val} }
//   SkillNode.effects: { stats?: Record<StatKey, number>; flags?: string[] }
// ───────────────────────────────────────────────────────────────────────────
function AB_ItemSkill() {
  const [tab, setTab] = uS6('item');
  return (
    <div style={{ background: T6.bg, color: T6.ink, minHeight: '100%', padding: 0 }}>
      <div style={{ padding: '14px 22px', borderBottom: `1px solid ${T6.rule}`, background: T6.sidebar, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Mono color={T6.accent}>CREATORS · ITEM / SKILL</Mono>
        <span style={{ flex: 1 }} />
        <div style={{ display: 'flex', border: `1px solid ${T6.rule}`, borderRadius: 2, overflow: 'hidden' }}>
          {['item', 'skill'].map(m => (
            <button key={m} onClick={() => setTab(m)} style={{
              padding: '6px 12px', border: 'none', cursor: 'pointer',
              background: tab === m ? T6.accent : T6.paper, color: tab === m ? T6.paper2 : T6.ink2,
              fontFamily: T6.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
            }}>{m === 'item' ? 'ITEM EDITOR' : 'SKILL TREE EDITOR'}</button>
          ))}
        </div>
      </div>

      {tab === 'item' && <ItemEditor />}
      {tab === 'skill' && <SkillEditor />}
    </div>
  );
}

// ── ITEM EDITOR ────────────────────────────────────────────────────────────
function ItemEditor() {
  // Derived actor stats live preview — base + this item's mods
  const baseTom = { strength: 12, dexterity: 14, perception: 11, lore: 9, resolve: 10 };
  const thisItemMods = { dexterity: +2, perception: +1, resolve: -1 };
  const equippedMods = { strength: +1 }; // from currently-equipped items
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0 }}>
      <div style={{ padding: 22 }}>
        <Mono color={T6.accent2}>↳ WRAPS EnhancedItemVault · src/loomwright/wardrobe/ItemEditor.jsx</Mono>
        <h2 style={{ fontFamily: T6.display, fontSize: 22, color: T6.ink, fontWeight: 500, margin: '4px 0 14px' }}>
          New Item · Father's Watch
        </h2>

        {/* Identity */}
        <Section title="IDENTITY">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="NAME" value="Father's Watch" />
            <Field label="SLOT" value="POCKET · L" />
            <Field label="TYPE" value="HEIRLOOM · MECHANICAL" />
            <Field label="WEIGHT" value="0.18 KG" />
          </div>
          <div style={{ marginTop: 10 }}>
            <Mono color={T6.ink3}>RARITY</Mono>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {[
                ['common', T6.rarityCommon, false],
                ['magic', T6.rarityMagic, false],
                ['rare', T6.rarityRare, false],
                ['legendary', T6.rarityLegendary, true],
                ['unique', T6.rarityUnique, false],
                ['mythic', T6.rarityMythic, false],
              ].map(([r, c, on]) => (
                <button key={r} style={{
                  padding: '5px 11px',
                  background: on ? `${c}25` : T6.paper2,
                  border: `1.5px solid ${on ? c : T6.rule}`,
                  borderRadius: T6.radius, cursor: 'pointer',
                  fontFamily: T6.mono, fontSize: 9, letterSpacing: 0.14,
                  textTransform: 'uppercase', color: c,
                }}>{r}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* STATS — the requested feature */}
        <Section title="STAT MODIFIERS · while equipped"
                 subtitle="Auto-applied to the equipping actor's derived stats. Negative values welcome.">
          <StatRow stat="dexterity" base={14} mod={+2} />
          <StatRow stat="perception" base={11} mod={+1} />
          <StatRow stat="resolve" base={10} mod={-1} />
          <button style={addRowBtn()}>
            <I d={ICONS.plus} size={10} color={T6.ink2} />
            <Mono color={T6.ink2}>ADD STAT MODIFIER</Mono>
          </button>
        </Section>

        {/* GRANTED SKILLS */}
        <Section title="GRANTED SKILLS · while equipped"
                 subtitle="Skills unlocked while this item is equipped. Removed when unequipped.">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <SkillChip name="Wind & Listen" tier="rare" desc="React 1 round before initiative" />
            <SkillChip name="Father's Mark" tier="unique" desc="Recognised by Old Carrow's network" />
            <button style={addRowBtn(true)}>
              <I d={ICONS.plus} size={10} color={T6.accent} />
              <Mono color={T6.accent}>LINK SKILL</Mono>
            </button>
          </div>
        </Section>

        {/* States & description */}
        <Section title="DESCRIPTION">
          <div style={{
            padding: 12, background: T6.paper2, border: `1px solid ${T6.rule}`,
            borderRadius: T6.radius, fontFamily: T6.display, fontSize: 14, color: T6.ink, lineHeight: 1.6,
          }}>
            A pewter half-hunter, chipped at the hinge — Old Carrow's. Tom winds it twice every
            morning. The chip is the only mark that distinguishes it.
          </div>
        </Section>

        {/* Set bonuses */}
        <Section title="SET · CARROW HEIRLOOMS · 2 / 3">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pill tone="accent">+1 SENTIMENT · IRIS</Pill>
            <Pill tone="accent">+1 SECRET · LOCK-MARK</Pill>
            <Pill tone="subtle">? MISSING · KEY</Pill>
          </div>
        </Section>

        <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
          <Btn variant="primary">SAVE TO VAULT</Btn>
          <Btn>SAVE & EQUIP TO TOM</Btn>
          <span style={{ flex: 1 }} />
          <Btn variant="ghost" icon={<I d={ICONS.sparkle} size={10} color={T6.accent} />}>SUGGEST DETAILS</Btn>
        </div>
      </div>

      {/* RIGHT RAIL — Live actor preview */}
      <div style={{ borderLeft: `1px solid ${T6.rule}`, padding: 18, background: T6.paper, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Mono color={T6.accent}>↳ LIVE PREVIEW · TOM CARROW</Mono>

        {/* Item card preview */}
        <div style={{ padding: 14, background: T6.paper2, border: `1.5px solid ${T6.rarityLegendary}`, borderRadius: T6.radius, boxShadow: `0 0 20px ${T6.rarityLegendary}25` }}>
          <Mono color={T6.rarityLegendary}>LEGENDARY · HEIRLOOM</Mono>
          <div style={{ fontFamily: T6.display, fontSize: 18, color: T6.ink, marginTop: 4 }}>Father's Watch</div>
          <div style={{ fontSize: 11, color: T6.ink2, lineHeight: 1.55, marginTop: 6 }}>
            A pewter half-hunter, chipped at the hinge.
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <Pill tone="accent">CARROW SET · 2/3</Pill>
            <Pill tone="subtle">POCKET · L</Pill>
          </div>
        </div>

        {/* Actor stat panel */}
        <div style={{ padding: 14, background: T6.paper2, border: `1px solid ${T6.rule}`, borderRadius: T6.radius }}>
          <Mono color={T6.ink3}>DERIVED STATS · IF EQUIPPED</Mono>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {Object.entries(baseTom).map(([k, v]) => {
              const eq = equippedMods[k] || 0;
              const tm = thisItemMods[k] || 0;
              const final = v + eq + tm;
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mono color={T6.ink2} style={{ width: 80 }}>{k.toUpperCase()}</Mono>
                  <div style={{ flex: 1, height: 6, background: T6.bg, borderRadius: 3, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(v / 20) * 100}%`, background: T6.ink3, borderRadius: 3 }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(final / 20) * 100}%`, background: tm > 0 ? T6.good : tm < 0 ? T6.bad : T6.ink2, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: T6.mono, fontSize: 11, color: T6.ink, minWidth: 32, textAlign: 'right' }}>{final}</span>
                  {tm !== 0 && (
                    <span style={{ fontFamily: T6.mono, fontSize: 9, color: tm > 0 ? T6.good : T6.bad, minWidth: 24 }}>
                      {tm > 0 ? '+' : ''}{tm}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Granted skills preview */}
        <div style={{ padding: 14, background: T6.paper2, border: `1px solid ${T6.rule}`, borderRadius: T6.radius }}>
          <Mono color={T6.ink3}>GRANTED · 2 SKILLS</Mono>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <PreviewSkillRow name="Wind & Listen" tier="rare" />
            <PreviewSkillRow name="Father's Mark" tier="unique" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T6.rule}` }}>
      <Mono color={T6.ink3}>{title}</Mono>
      {subtitle && <div style={{ fontSize: 11, color: T6.ink3, marginTop: 2, lineHeight: 1.45 }}>{subtitle}</div>}
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <Mono color={T6.ink3}>{label}</Mono>
      <div style={{
        marginTop: 4, padding: '8px 10px', background: T6.paper2, border: `1px solid ${T6.rule}`,
        borderRadius: T6.radius, fontFamily: T6.display, fontSize: 14, color: T6.ink,
      }}>{value}</div>
    </div>
  );
}

function StatRow({ stat, base, mod }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: T6.paper2, border: `1px solid ${T6.rule}`, borderRadius: T6.radius, marginBottom: 5 }}>
      <Mono color={T6.ink2} style={{ width: 90 }}>{stat.toUpperCase()}</Mono>
      <span style={{ fontFamily: T6.mono, fontSize: 10, color: T6.ink3 }}>BASE {base}</span>
      <span style={{ flex: 1 }} />
      <button style={mathBtn()}>−</button>
      <input type="text" defaultValue={mod > 0 ? `+${mod}` : mod} style={{
        width: 56, textAlign: 'center', padding: '4px 6px',
        background: T6.bg, border: `1px solid ${T6.rule}`, borderRadius: T6.radius,
        fontFamily: T6.mono, fontSize: 12, color: mod > 0 ? T6.good : mod < 0 ? T6.bad : T6.ink,
      }} />
      <button style={mathBtn()}>+</button>
      <button style={{ ...mathBtn(), marginLeft: 4, color: T6.ink3 }}><I d={ICONS.x} size={10} color={T6.ink3} /></button>
    </div>
  );
}

function SkillChip({ name, tier, desc }) {
  const c = { rare: T6.rarityRare, unique: T6.rarityUnique, common: T6.rarityCommon }[tier] || T6.ink2;
  return (
    <div style={{
      padding: '6px 10px', background: T6.paper2, border: `1.5px solid ${c}`, borderRadius: T6.radius,
      display: 'flex', flexDirection: 'column', minWidth: 180,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <I d={ICONS.spark} size={11} color={c} />
        <span style={{ fontFamily: T6.display, fontSize: 13, color: T6.ink, flex: 1 }}>{name}</span>
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}>
          <I d={ICONS.x} size={10} color={T6.ink3} />
        </button>
      </div>
      <Mono color={c} style={{ marginTop: 2 }}>{tier.toUpperCase()}</Mono>
      <div style={{ fontSize: 10, color: T6.ink2, marginTop: 3, lineHeight: 1.4 }}>{desc}</div>
    </div>
  );
}

function PreviewSkillRow({ name, tier }) {
  const c = { rare: T6.rarityRare, unique: T6.rarityUnique, common: T6.rarityCommon }[tier] || T6.ink2;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 7px', borderLeft: `2px solid ${c}` }}>
      <I d={ICONS.spark} size={10} color={c} />
      <span style={{ fontFamily: T6.display, fontSize: 12, color: T6.ink, flex: 1 }}>{name}</span>
      <Mono color={c}>{tier.toUpperCase()}</Mono>
    </div>
  );
}

function addRowBtn(accent) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 10px',
    background: 'transparent',
    border: `1px dashed ${accent ? T6.accent : T6.rule}`,
    borderRadius: T6.radius, cursor: 'pointer',
  };
}
function mathBtn() {
  return {
    width: 22, height: 22, display: 'grid', placeItems: 'center',
    background: T6.paper, border: `1px solid ${T6.rule}`, borderRadius: T6.radius,
    cursor: 'pointer', fontFamily: T6.mono, fontSize: 12, color: T6.ink,
  };
}

// ── SKILL TREE EDITOR ──────────────────────────────────────────────────────
function SkillEditor() {
  const [selectedNode, setSelectedNode] = uS6('old-tongue');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0 }}>
      <div style={{ padding: 22 }}>
        <Mono color={T6.accent2}>↳ NEW · pair with SkillTreeSystem · src/loomwright/skills/</Mono>
        <h2 style={{ fontFamily: T6.display, fontSize: 22, color: T6.ink, fontWeight: 500, margin: '4px 0 4px' }}>
          Skill Tree · Wheelwright
        </h2>
        <div style={{ fontSize: 12, color: T6.ink2, marginBottom: 12, lineHeight: 1.55 }}>
          Right-click the canvas to add a node · drag a node to reposition · drag from one node to
          another to link · double-click to rename. Locked nodes show their unlock requirements
          inline.
        </div>

        {/* Toolbar — mirrors map editor below */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, padding: 8, background: T6.paper, border: `1px solid ${T6.rule}`, borderRadius: T6.radius }}>
          <ToolBtn icon={ICONS.plus} label="ADD NODE" hint="or right-click canvas" />
          <ToolBtn icon={ICONS.link} label="LINK" hint="drag node→node" />
          <ToolBtn icon={ICONS.thread} label="BRANCH" hint="split path" />
          <ToolBtn icon={ICONS.layers} label="GROUP" hint="cluster nodes" />
          <span style={{ flex: 1 }} />
          <ToolBtn icon={ICONS.sparkle} label="SUGGEST PATHS" accent />
        </div>

        {/* Tree canvas */}
        <div style={{
          background: T6.paper, border: `1px solid ${T6.rule}`, borderRadius: T6.radius,
          minHeight: 380, position: 'relative', padding: 22, overflow: 'hidden',
        }}>
          {/* dotted grid */}
          <svg style={{ position: 'absolute', inset: 0, opacity: 0.4 }} viewBox="0 0 600 380" preserveAspectRatio="none">
            <defs>
              <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.8" fill={T6.ink3} />
              </pattern>
            </defs>
            <rect width="600" height="380" fill="url(#dots)" />
          </svg>

          {/* Connections */}
          <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 600 380">
            <line x1="300" y1="60" x2="180" y2="170" stroke={T6.rule} strokeWidth="2" />
            <line x1="300" y1="60" x2="420" y2="170" stroke={T6.rule} strokeWidth="2" />
            <line x1="180" y1="170" x2="100" y2="290" stroke={T6.rule} strokeWidth="2" />
            <line x1="180" y1="170" x2="260" y2="290" stroke={T6.rule} strokeWidth="2" strokeDasharray="3 4" />
            <line x1="420" y1="170" x2="500" y2="290" stroke={T6.rule} strokeWidth="2" strokeDasharray="3 4" />
          </svg>

          {[
            ['Wheelwright', 300, 60, T6.rarityRare, 'master', 'wheelwright'],
            ['River Lore', 180, 170, T6.rarityMagic, 'adept', 'river-lore'],
            ['Quiet Step', 420, 170, T6.rarityCommon, 'novice', 'quiet-step'],
            ['Ferry Knot', 100, 290, T6.rarityCommon, 'novice', 'ferry-knot'],
            ['Old Tongue', 260, 290, T6.rarityUnique, 'locked', 'old-tongue'],
            ['Bridge Eye', 500, 290, T6.ink3, 'locked', 'bridge-eye'],
          ].map(([n, x, y, c, t, id]) => {
            const isSelected = id === selectedNode;
            const locked = t === 'locked';
            return (
              <button key={id} onClick={() => setSelectedNode(id)} style={{
                position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)',
                padding: '7px 11px', minWidth: 110,
                background: T6.paper2, border: `${isSelected ? 2 : 1.5}px solid ${c}`,
                borderRadius: T6.radius, textAlign: 'center', cursor: 'pointer',
                boxShadow: isSelected ? `0 0 0 4px ${c}25` : !locked ? `0 0 10px ${c}30` : 'none',
                opacity: locked ? 0.6 : 1,
              }}>
                <div style={{ fontFamily: T6.display, fontSize: 12, color: T6.ink }}>{n}</div>
                <Mono color={c}>{t.toUpperCase()}</Mono>
              </button>
            );
          })}

          {/* Right-click contextual menu — illustrative (showing what appears) */}
          <div style={{
            position: 'absolute', right: 22, bottom: 22, width: 200,
            background: T6.paper2, border: `1px solid ${T6.rule}`, borderRadius: T6.radius,
            padding: 6, boxShadow: '0 12px 40px rgba(60, 50, 30, 0.18)',
          }}>
            <Mono color={T6.ink3} style={{ padding: '4px 8px' }}>RIGHT-CLICK MENU</Mono>
            {[
              ['+ Add node here', T6.ink],
              ['+ Add child of…', T6.ink],
              ['Link from selected', T6.ink],
              ['—', null],
              ['Group selection', T6.ink],
              ['Auto-arrange branch', T6.accent],
              ['—', null],
              ['Delete', T6.bad],
            ].map((row, i) => row[0] === '—' ? (
              <div key={i} style={{ height: 1, background: T6.rule, margin: '3px 0' }} />
            ) : (
              <div key={i} style={{ padding: '5px 8px', fontSize: 11, color: row[1], cursor: 'pointer', borderRadius: 2 }}>{row[0]}</div>
            ))}
          </div>
        </div>

        {/* Edit pane below the canvas — same pattern as Atlas */}
        <NodeEditPane />
      </div>

      {/* Right rail — node inspector */}
      <div style={{ borderLeft: `1px solid ${T6.rule}`, padding: 18, background: T6.paper, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Mono color={T6.accent}>↳ NODE INSPECTOR</Mono>
        <div>
          <div style={{ fontFamily: T6.display, fontSize: 18, color: T6.ink }}>Old Tongue</div>
          <Mono color={T6.rarityUnique}>UNIQUE · LOCKED</Mono>
        </div>
        <div style={{ fontSize: 12, color: T6.ink2, lineHeight: 1.6 }}>
          The pre-canal speech of bargemen. Three dozen verbs, half of them for water. Tom heard
          his grandfather use it once.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Field label="UNLOCK · PREREQS" value="River Lore · Adept" />
          <Field label="UNLOCK · CHAPTER" value="ch.06+" />
          <Field label="EFFECT · STAT" value="+2 LORE while active" />
          <Field label="EFFECT · FLAG" value="comprehend.bargemen" />
        </div>
        <div style={{ marginTop: 4 }}>
          <Mono color={T6.ink3}>UNLOCKED BY</Mono>
          <div style={{ fontSize: 11, color: T6.ink2, marginTop: 4, lineHeight: 1.5 }}>
            • Tom — once he reaches Adept on River Lore<br/>
            • Iris — never (no River Lore)
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ icon, label, hint, accent }) {
  return (
    <button title={hint} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 10px',
      background: accent ? T6.paper2 : 'transparent',
      border: `1px solid ${accent ? T6.accent : T6.rule}`,
      borderRadius: T6.radius, cursor: 'pointer',
      fontFamily: T6.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase',
      color: accent ? T6.accent : T6.ink2,
    }}>
      <I d={icon} size={10} color={accent ? T6.accent : T6.ink2} />
      {label}
    </button>
  );
}

function NodeEditPane() {
  return (
    <div style={{
      marginTop: 10, padding: 12, background: T6.paper, border: `1px solid ${T6.rule}`, borderRadius: T6.radius,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Mono color={T6.accent}>EDITING · OLD TONGUE</Mono>
        <span style={{ flex: 1 }} />
        <Btn size="sm" variant="ghost"><I d={ICONS.x} size={10} color={T6.ink3} /> CLOSE</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <Field label="NAME" value="Old Tongue" />
        <Field label="TIER" value="UNIQUE" />
        <Field label="POSITION" value="x:260 y:290" />
        <Field label="ICON" value="◇ runes" />
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <Btn variant="primary">SAVE NODE</Btn>
        <Btn>DUPLICATE</Btn>
        <Btn variant="ghost"><I d={ICONS.x} size={10} color={T6.bad} /> DELETE NODE</Btn>
      </div>
    </div>
  );
}

window.AB_ItemSkill = AB_ItemSkill;

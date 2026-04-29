/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const T6a = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 06a — Item Editor (no toggle — Skills moved to 06b)
//
// ── For Claude Code ──
// Item editor wraps EnhancedItemVault (src/loomwright/wardrobe/) and adds:
//   • Stat modifiers (+/- to actor stats when equipped)
//   • Granted skills (skill IDs unlocked while equipped)
//   • Live actor preview right rail — shows Tom's stats with/without this item
//
// Required schema additions (FLAG IF MISSING):
//   Item.statMods: Record<StatKey, number>
//   Item.grantedSkills: SkillId[]
//   Character.derivedStats: Record<StatKey, number>  // derived = base + sum(equipped.statMods)
// ───────────────────────────────────────────────────────────────────────────
function AB_ItemEditor() {
  const baseTom = { strength: 12, dexterity: 14, perception: 11, lore: 9, resolve: 10 };
  const thisItemMods = { dexterity: +2, perception: +1, resolve: -1 };
  const equippedMods = { strength: +1 };
  return (
    <div style={{ background: T6a.bg, color: T6a.ink, minHeight: '100%', padding: 0 }}>
      <div style={{ padding: '14px 22px', borderBottom: `1px solid ${T6a.rule}`, background: T6a.sidebar, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Mono color={T6a.accent}>06A · ITEM EDITOR</Mono>
        <Mono color={T6a.ink3}>NEW ITEM · UNSAVED</Mono>
        <span style={{ flex: 1 }} />
        <Btn variant="ghost"><I d={ICONS.x} size={10} color={T6a.ink3} /> CLOSE</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0 }}>
        <div style={{ padding: 22 }}>
          <Mono color={T6a.accent2}>↳ WRAPS EnhancedItemVault · src/loomwright/wardrobe/ItemEditor.jsx</Mono>
          <h2 style={{ fontFamily: T6a.display, fontSize: 22, color: T6a.ink, fontWeight: 500, margin: '4px 0 14px' }}>
            New Item · Father's Watch
          </h2>

          <Section6a title="IDENTITY">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field6a label="NAME" value="Father's Watch" />
              <Field6a label="SLOT" value="POCKET · L" />
              <Field6a label="TYPE" value="HEIRLOOM · MECHANICAL" />
              <Field6a label="WEIGHT" value="0.18 KG" />
            </div>
            <div style={{ marginTop: 10 }}>
              <Mono color={T6a.ink3}>RARITY</Mono>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {[
                  ['common', T6a.rarityCommon, false],
                  ['magic', T6a.rarityMagic, false],
                  ['rare', T6a.rarityRare, false],
                  ['legendary', T6a.rarityLegendary, true],
                  ['unique', T6a.rarityUnique, false],
                  ['mythic', T6a.rarityMythic, false],
                ].map(([r, c, on]) => (
                  <button key={r} style={{
                    padding: '5px 11px',
                    background: on ? `${c}25` : T6a.paper2,
                    border: `1.5px solid ${on ? c : T6a.rule}`,
                    borderRadius: T6a.radius, cursor: 'pointer',
                    fontFamily: T6a.mono, fontSize: 9, letterSpacing: 0.14,
                    textTransform: 'uppercase', color: c,
                  }}>{r}</button>
                ))}
              </div>
            </div>
          </Section6a>

          <Section6a title="STAT MODIFIERS · while equipped"
                   subtitle="Auto-applied to the equipping actor's derived stats. Negative values welcome.">
            <StatRow6a stat="dexterity" base={14} mod={+2} />
            <StatRow6a stat="perception" base={11} mod={+1} />
            <StatRow6a stat="resolve" base={10} mod={-1} />
            <button style={addRowBtn6a()}>
              <I d={ICONS.plus} size={10} color={T6a.ink2} />
              <Mono color={T6a.ink2}>ADD STAT MODIFIER</Mono>
            </button>
          </Section6a>

          <Section6a title="GRANTED SKILLS · while equipped"
                   subtitle="Skills unlocked while this item is equipped. Removed when unequipped.">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <SkillChip6a name="Wind &amp; Listen" tier="rare" desc="React 1 round before initiative" />
              <SkillChip6a name="Father's Mark" tier="unique" desc="Recognised by Old Carrow's network" />
              <button style={addRowBtn6a(true)}>
                <I d={ICONS.plus} size={10} color={T6a.accent} />
                <Mono color={T6a.accent}>LINK SKILL</Mono>
              </button>
            </div>
          </Section6a>

          <Section6a title="DESCRIPTION">
            <div style={{
              padding: 12, background: T6a.paper2, border: `1px solid ${T6a.rule}`,
              borderRadius: T6a.radius, fontFamily: T6a.display, fontSize: 14, color: T6a.ink, lineHeight: 1.6,
            }}>
              A pewter half-hunter, chipped at the hinge — Old Carrow's. Tom winds it twice every
              morning. The chip is the only mark that distinguishes it.
            </div>
          </Section6a>

          <Section6a title="SET · CARROW HEIRLOOMS · 2 / 3">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Pill tone="accent">+1 SENTIMENT · IRIS</Pill>
              <Pill tone="accent">+1 SECRET · LOCK-MARK</Pill>
              <Pill tone="subtle">? MISSING · KEY</Pill>
            </div>
          </Section6a>

          <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
            <Btn variant="primary">SAVE TO VAULT</Btn>
            <Btn>SAVE &amp; EQUIP TO TOM</Btn>
            <span style={{ flex: 1 }} />
            <Btn variant="ghost" icon={<I d={ICONS.sparkle} size={10} color={T6a.accent} />}>SUGGEST DETAILS</Btn>
          </div>
        </div>

        <div style={{ borderLeft: `1px solid ${T6a.rule}`, padding: 18, background: T6a.paper, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Mono color={T6a.accent}>↳ LIVE PREVIEW · TOM CARROW</Mono>

          <div style={{ padding: 14, background: T6a.paper2, border: `1.5px solid ${T6a.rarityLegendary}`, borderRadius: T6a.radius, boxShadow: `0 0 20px ${T6a.rarityLegendary}25` }}>
            <Mono color={T6a.rarityLegendary}>LEGENDARY · HEIRLOOM</Mono>
            <div style={{ fontFamily: T6a.display, fontSize: 18, color: T6a.ink, marginTop: 4 }}>Father's Watch</div>
            <div style={{ fontSize: 11, color: T6a.ink2, lineHeight: 1.55, marginTop: 6 }}>
              A pewter half-hunter, chipped at the hinge.
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <Pill tone="accent">CARROW SET · 2/3</Pill>
              <Pill tone="subtle">POCKET · L</Pill>
            </div>
          </div>

          <div style={{ padding: 14, background: T6a.paper2, border: `1px solid ${T6a.rule}`, borderRadius: T6a.radius }}>
            <Mono color={T6a.ink3}>DERIVED STATS · IF EQUIPPED</Mono>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {Object.entries(baseTom).map(([k, v]) => {
                const eq = equippedMods[k] || 0;
                const tm = thisItemMods[k] || 0;
                const final = v + eq + tm;
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mono color={T6a.ink2} style={{ width: 80 }}>{k.toUpperCase()}</Mono>
                    <div style={{ flex: 1, height: 6, background: T6a.bg, borderRadius: 3, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(v / 20) * 100}%`, background: T6a.ink3, borderRadius: 3 }} />
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(final / 20) * 100}%`, background: tm > 0 ? T6a.good : tm < 0 ? T6a.bad : T6a.ink2, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: T6a.mono, fontSize: 11, color: T6a.ink, minWidth: 32, textAlign: 'right' }}>{final}</span>
                    {tm !== 0 && (
                      <span style={{ fontFamily: T6a.mono, fontSize: 9, color: tm > 0 ? T6a.good : T6a.bad, minWidth: 24 }}>
                        {tm > 0 ? '+' : ''}{tm}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: 14, background: T6a.paper2, border: `1px solid ${T6a.rule}`, borderRadius: T6a.radius }}>
            <Mono color={T6a.ink3}>GRANTED · 2 SKILLS</Mono>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <PreviewSkillRow6a name="Wind &amp; Listen" tier="rare" />
              <PreviewSkillRow6a name="Father's Mark" tier="unique" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section6a({ title, subtitle, children }) {
  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T6a.rule}` }}>
      <Mono color={T6a.ink3}>{title}</Mono>
      {subtitle && <div style={{ fontSize: 11, color: T6a.ink3, marginTop: 2, lineHeight: 1.45 }}>{subtitle}</div>}
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}
function Field6a({ label, value }) {
  return (
    <div>
      <Mono color={T6a.ink3}>{label}</Mono>
      <div style={{
        marginTop: 4, padding: '8px 10px', background: T6a.paper2, border: `1px solid ${T6a.rule}`,
        borderRadius: T6a.radius, fontFamily: T6a.display, fontSize: 14, color: T6a.ink,
      }}>{value}</div>
    </div>
  );
}
function StatRow6a({ stat, base, mod }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: T6a.paper2, border: `1px solid ${T6a.rule}`, borderRadius: T6a.radius, marginBottom: 5 }}>
      <Mono color={T6a.ink2} style={{ width: 90 }}>{stat.toUpperCase()}</Mono>
      <span style={{ fontFamily: T6a.mono, fontSize: 10, color: T6a.ink3 }}>BASE {base}</span>
      <span style={{ flex: 1 }} />
      <button style={mathBtn6a()}>−</button>
      <input type="text" defaultValue={mod > 0 ? `+${mod}` : mod} style={{
        width: 56, textAlign: 'center', padding: '4px 6px',
        background: T6a.bg, border: `1px solid ${T6a.rule}`, borderRadius: T6a.radius,
        fontFamily: T6a.mono, fontSize: 12, color: mod > 0 ? T6a.good : mod < 0 ? T6a.bad : T6a.ink,
      }} />
      <button style={mathBtn6a()}>+</button>
      <button style={{ ...mathBtn6a(), marginLeft: 4 }}><I d={ICONS.x} size={10} color={T6a.ink3} /></button>
    </div>
  );
}
function SkillChip6a({ name, tier, desc }) {
  const c = { rare: T6a.rarityRare, unique: T6a.rarityUnique, common: T6a.rarityCommon }[tier] || T6a.ink2;
  return (
    <div style={{
      padding: '6px 10px', background: T6a.paper2, border: `1.5px solid ${c}`, borderRadius: T6a.radius,
      display: 'flex', flexDirection: 'column', minWidth: 180,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <I d={ICONS.spark} size={11} color={c} />
        <span style={{ fontFamily: T6a.display, fontSize: 13, color: T6a.ink, flex: 1 }} dangerouslySetInnerHTML={{ __html: name }} />
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}>
          <I d={ICONS.x} size={10} color={T6a.ink3} />
        </button>
      </div>
      <Mono color={c} style={{ marginTop: 2 }}>{tier.toUpperCase()}</Mono>
      <div style={{ fontSize: 10, color: T6a.ink2, marginTop: 3, lineHeight: 1.4 }}>{desc}</div>
    </div>
  );
}
function PreviewSkillRow6a({ name, tier }) {
  const c = { rare: T6a.rarityRare, unique: T6a.rarityUnique, common: T6a.rarityCommon }[tier] || T6a.ink2;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 7px', borderLeft: `2px solid ${c}` }}>
      <I d={ICONS.spark} size={10} color={c} />
      <span style={{ fontFamily: T6a.display, fontSize: 12, color: T6a.ink, flex: 1 }} dangerouslySetInnerHTML={{ __html: name }} />
      <Mono color={c}>{tier.toUpperCase()}</Mono>
    </div>
  );
}
function addRowBtn6a(accent) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 10px',
    background: 'transparent',
    border: `1px dashed ${accent ? T6a.accent : T6a.rule}`,
    borderRadius: T6a.radius, cursor: 'pointer',
  };
}
function mathBtn6a() {
  return {
    width: 22, height: 22, display: 'grid', placeItems: 'center',
    background: T6a.paper, border: `1px solid ${T6a.rule}`, borderRadius: T6a.radius,
    cursor: 'pointer', fontFamily: T6a.mono, fontSize: 12, color: T6a.ink,
  };
}

window.AB_ItemEditor = AB_ItemEditor;

/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const T12 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 12 — Dossier Compare
//
// ── For Claude Code ──
// Two characters side-by-side. Same vertical sections as the single-character
// dossier, mirrored. Diff column down the centre. Use case: writing a scene
// where two characters meet — see at a glance what they each know, where they
// each are, what's loaded into each's "voice".
//
// Maps to: src/loomwright/dossier/Dossier.jsx  — render twice with a shared
// `compareWith` prop, plus a CompareGutter component (NEW; flag).
// ───────────────────────────────────────────────────────────────────────────
function AB_DossierCompare() {
  const a = { name: 'Tom Carrow', age: '19', loc: 'Penlow Ford', knows: 7, voice: 'plainspoken, surprises himself' };
  const b = { name: 'Iris Vell',  age: '21', loc: 'Carrow forge', knows: 4, voice: 'sharper than she lets show' };
  return (
    <div style={{ background: T12.bg, color: T12.ink, padding: 0 }}>
      {/* header */}
      <div style={{ padding: '14px 22px', borderBottom: `1px solid ${T12.rule}`, background: T12.sidebar, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Mono color={T12.accent}>12 · DOSSIER COMPARE</Mono>
        <span style={{ flex: 1 }} />
        <Btn size="sm" variant="ghost"><I d={ICONS.plus} size={11} color={T12.ink2} /> ADD CHARACTER</Btn>
        <Btn size="sm" variant="ghost"><I d={ICONS.x} size={11} color={T12.ink2} /> CLOSE</Btn>
      </div>

      {/* names */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px 1fr', borderBottom: `1px solid ${T12.rule}`, background: T12.paper }}>
        <CharHeader c={a} />
        <div style={{ display: 'grid', placeItems: 'center', borderLeft: `1px solid ${T12.rule}`, borderRight: `1px solid ${T12.rule}` }}>
          <Mono color={T12.ink3}>VS</Mono>
        </div>
        <CharHeader c={b} right />
      </div>

      {/* sections */}
      <CompareSection label="OVERVIEW">
        <Half>
          <Field k="age" v={a.age} />
          <Field k="last seen" v={a.loc} highlight />
          <Field k="voice" v={a.voice} />
          <Field k="pov chapters" v="3 (ch.01, 04, 06)" />
        </Half>
        <Diff>
          <DiffRow label="last seen" delta="≠" note="Tom east of forge, Iris at forge" />
          <DiffRow label="voice" delta="≠" note="opposite registers" />
          <DiffRow label="age" delta="2y" note="b is older" />
          <DiffRow label="pov" delta="3 vs 1" />
        </Diff>
        <Half>
          <Field k="age" v={b.age} />
          <Field k="last seen" v={b.loc} highlight />
          <Field k="voice" v={b.voice} />
          <Field k="pov chapters" v="1 (ch.05)" />
        </Half>
      </CompareSection>

      <CompareSection label="KNOWS · about each other">
        <Half>
          <KnowsRow12 fact="Iris's name" since="ch.03" />
          <KnowsRow12 fact="Iris is grieving" since="ch.05" />
          <KnowsRow12 fact="Iris's brother died" since="ch.05" />
          <KnowsRow12 fact="Iris's connection to forge" missing />
        </Half>
        <Diff>
          <DiffRow label="asymmetry" delta="!" note="Iris knows things Tom doesn't" tone="warn" />
          <DiffRow label="overlap" delta="2" note="shared facts" />
        </Diff>
        <Half>
          <KnowsRow12 fact="Tom's name" since="ch.02" />
          <KnowsRow12 fact="Tom is grandson of old Carrow" since="ch.02" />
          <KnowsRow12 fact="Tom speaks Old Tongue" since="ch.06" />
          <KnowsRow12 fact="Tom carries the mark" since="ch.04" />
        </Half>
      </CompareSection>

      <CompareSection label="ITEMS · equipped">
        <Half>
          <ItemPill name="Wheelwright's mark" tier="unique" />
          <ItemPill name="Father's coat" tier="common" />
          <ItemPill name="Penknife" tier="common" />
        </Half>
        <Diff>
          <DiffRow label="grants" delta="0" note="no shared affordance items" />
          <DiffRow label="rarity sum" delta="3 vs 2" />
        </Diff>
        <Half>
          <ItemPill name="Brother's letter" tier="unique" />
          <ItemPill name="Boots, oversized" tier="common" />
        </Half>
      </CompareSection>

      <CompareSection label="ACTIVE SKILLS">
        <Half>
          <ItemPill name="Wheelwright" tier="legendary" />
          <ItemPill name="Old Tongue" tier="unique" />
          <ItemPill name="Quiet Step" tier="common" />
        </Half>
        <Diff>
          <DiffRow label="overlap" delta="0" note="no shared skill" />
          <DiffRow label="combined unlocks" delta="→ ch.07 path" tone="good" />
        </Diff>
        <Half>
          <ItemPill name="Read Plain" tier="rare" />
          <ItemPill name="Lie Plain" tier="rare" />
        </Half>
      </CompareSection>

      <CompareSection label="LAST INTERACTION">
        <Half wide>
          <Mono color={T12.ink3}>CH.05 · ¶17</Mono>
          <div style={{ fontFamily: T12.display, fontSize: 13, color: T12.ink2, marginTop: 6, fontStyle: 'italic', lineHeight: 1.6 }}>
            "She did not look up when he came in. He stood in the doorway a long time before he said her name, and she did not answer."
          </div>
        </Half>
        <Diff>
          <DiffRow label="warmth" delta="↘" note="cooled since ch.03" tone="warn" />
        </Diff>
        <Half wide>
          <Mono color={T12.ink3}>CH.05 · ¶17 · POV</Mono>
          <div style={{ fontFamily: T12.display, fontSize: 13, color: T12.ink2, marginTop: 6, fontStyle: 'italic', lineHeight: 1.6 }}>
            "She heard him in the doorway. She heard her own name in his mouth, and could not bring herself to lift her head."
          </div>
        </Half>
      </CompareSection>

      {/* footer actions */}
      <div style={{ padding: '14px 22px', borderTop: `1px solid ${T12.rule}`, display: 'flex', gap: 8 }}>
        <Btn variant="primary"><I d={ICONS.sparkle} size={11} color={T12.paper2} /> DRAFT THEIR NEXT MEETING</Btn>
        <Btn>SWAP SIDES</Btn>
        <span style={{ flex: 1 }} />
        <Mono color={T12.ink3}>3 ASYMMETRIES · 2 OVERLAPS · 1 WARMTH SHIFT</Mono>
      </div>
    </div>
  );
}

function CharHeader({ c, right }) {
  return (
    <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 14, justifyContent: right ? 'flex-end' : 'flex-start' }}>
      {!right && <Mono2 name={c.name} size={42} />}
      <div style={{ textAlign: right ? 'right' : 'left' }}>
        <h2 style={{ fontFamily: T12.display, fontSize: 22, fontWeight: 500, color: T12.ink, margin: 0, letterSpacing: -0.3 }}>{c.name}</h2>
        <Mono color={T12.ink3}>{c.knows} FACTS · POV CHAR</Mono>
      </div>
      {right && <Mono2 name={c.name} size={42} />}
    </div>
  );
}
function CompareSection({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px 1fr', borderBottom: `1px solid ${T12.rule}` }}>
      <div style={{ gridColumn: '1 / -1', padding: '8px 22px', background: T12.sidebar, borderBottom: `1px solid ${T12.rule}` }}>
        <Mono color={T12.ink3}>{label}</Mono>
      </div>
      <div style={{ padding: 18, gridColumn: 1, gridRow: 2 }}>{React.Children.toArray(children)[0]}</div>
      <div style={{ padding: '18px 6px', gridColumn: 2, gridRow: 2, borderLeft: `1px solid ${T12.rule}`, borderRight: `1px solid ${T12.rule}`, background: T12.paper }}>{React.Children.toArray(children)[1]}</div>
      <div style={{ padding: 18, gridColumn: 3, gridRow: 2 }}>{React.Children.toArray(children)[2]}</div>
    </div>
  );
}
function Half({ children, wide }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: wide ? 4 : 6 }}>{children}</div>;
}
function Field({ k, v, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '3px 0' }}>
      <Mono color={T12.ink3} style={{ width: 80 }}>{k.toUpperCase()}</Mono>
      <span style={{ fontFamily: T12.display, fontSize: 13, color: highlight ? T12.accent : T12.ink, flex: 1 }}>{v}</span>
    </div>
  );
}
function Diff({ children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>{children}</div>;
}
function DiffRow({ label, delta, note, tone }) {
  const c = tone === 'warn' ? T12.warn : tone === 'good' ? T12.good : T12.ink2;
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{
        fontFamily: T12.mono, fontSize: 14, color: c, fontWeight: 600,
        padding: '3px 8px', border: `1px solid ${c}55`, borderRadius: 999, background: T12.paper2,
      }}>{delta}</span>
      <Mono color={T12.ink3}>{label}</Mono>
      {note && <span style={{ fontSize: 9.5, color: T12.ink2, lineHeight: 1.3, fontStyle: 'italic' }}>{note}</span>}
    </div>
  );
}
function KnowsRow12({ fact, since, missing }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: missing ? T12.bad : T12.good }} />
      <span style={{ fontFamily: T12.display, fontSize: 12.5, color: missing ? T12.ink3 : T12.ink, fontStyle: missing ? 'italic' : 'normal', flex: 1 }}>{fact}{missing && ' (does not know)'}</span>
      {!missing && <Mono color={T12.ink3}>{since}</Mono>}
    </div>
  );
}
function ItemPill({ name, tier }) {
  const c = { common: T12.rarityCommon, rare: T12.rarityRare, legendary: T12.rarityLegendary, unique: T12.rarityUnique }[tier];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: T12.paper, border: `1px solid ${c}55`, borderLeft: `2px solid ${c}`, borderRadius: T12.radius, marginBottom: 4, alignSelf: 'flex-start' }}>
      <span style={{ fontFamily: T12.display, fontSize: 12, color: T12.ink }}>{name}</span>
      <Mono color={c}>{tier.toUpperCase()}</Mono>
    </div>
  );
}

window.AB_DossierCompare = AB_DossierCompare;

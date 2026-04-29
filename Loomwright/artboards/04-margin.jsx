/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const T4 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 04 — Margin extraction (Layer 1) in the Writers Room
// As-you-type entity flagging in the gutter. One-click + ADD commits.
//
// ── For Claude Code ──
// Touches:
//   • src/loomwright/writers-room/InlineWeaver.jsx  → add gutter slot
//   • src/loomwright/extraction/MarginChip.jsx       (NEW)
//   • src/loomwright/extraction/marginAI.js          (NEW free-model client)
//
// Trigger: paragraph idle 600ms → call free model with {paragraph, ±1 ctx,
// known-entity index}. Response = Detection[]. Cache per paragraph hash.
//
// Click + ADD → opens inline minimal commit dialog (name + type + avatar),
// optimistic add, chip dismisses. NO multi-step wizard at Layer 1 — speed
// is the entire point. Layer 2 is the wizard (artboard 07).
//
// Editor must expose stable per-paragraph IDs and a gutter render slot —
// FLAG IF NOT (small layout change to writers-room).
// ───────────────────────────────────────────────────────────────────────────
function AB_Margin() {
  return (
    <div style={{ background: T4.bg, color: T4.ink, padding: 0, minHeight: '100%' }}>
      <div style={{
        padding: '14px 22px', borderBottom: `1px solid ${T4.rule}`, background: T4.sidebar,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <Mono color={T4.accent}>WRITERS ROOM · INLINE EXTRACTION</Mono>
        <span style={{ flex: 1 }} />
        <Pill tone="good"><span style={{ width: 5, height: 5, background: T4.good, borderRadius: 999, marginRight: 4 }} />FREE MODEL · WATCHING</Pill>
        <Btn variant="ghost" size="sm" icon={<I d={ICONS.spark} size={10} color={T4.accent} />}>RUN EXTRACT PASS</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 220px', gap: 0, padding: 0 }}>
        {/* Left margin (line numbers) */}
        <div style={{ padding: '28px 12px', textAlign: 'right', color: T4.ink3, fontFamily: T4.mono, fontSize: 10, lineHeight: 1.85 }}>
          {Array.from({ length: 14 }, (_, i) => <div key={i}>{String(i + 41).padStart(3, '0')}</div>)}
        </div>
        {/* Manuscript */}
        <div style={{ padding: '24px 0', borderLeft: `1px solid ${T4.rule}`, borderRight: `1px solid ${T4.rule}` }}>
          <div style={{
            fontFamily: T4.display, fontSize: 16, lineHeight: 1.85, color: T4.ink,
            padding: '0 32px', maxWidth: 640,
          }}>
            They reached <Anchor c={T4.accent2}>Riverside</Anchor> at dusk. The bridge had been
            mended in a hurry — fresh rope, dark with creosote — and Tom didn't trust it. He pressed
            his hand to the railing and waited for the wind to settle.<br/><br/>
            <Anchor c={T4.accent}>Marlo</Anchor> arrived twelve minutes after sundown, carrying
            a lantern that wasn't lit. He moved like a man who had walked the bridge a thousand
            times and didn't need to look down.<br/><br/>
            "You brought the <Anchor c={T4.rarityLegendary}>millhouse key</Anchor>?" he asked.<br/><br/>
            Tom didn't answer. The river ran on below them, indifferent.
          </div>
        </div>
        {/* Margin */}
        <div style={{ padding: '24px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Mono color={T4.ink3}>↳ AI · MARGIN</Mono>
          <FlagChip type="loc" name="Riverside" line={41}
            note="New location detected. Add to Atlas?" cta="+ ADD LOCATION" />
          <FlagChip type="char" name="Marlo" line={43}
            note="Existing entity (Cast). Strengthen relation w/ Tom?" cta="+ LINK TO TOM" />
          <FlagChip type="item" name="millhouse key" line={45}
            note="New item. Mentioned by Marlo · attribute?" cta="+ ADD ITEM" />
          <FlagChip type="rel" name="Tom · Marlo" line={43}
            note="Tension beat detected. Add to thread 'Marlo's Debt'?" cta="+ APPEND BEAT" subtle />
          <div style={{
            marginTop: 12, padding: 12, background: T4.paper2, border: `1px dashed ${T4.rule}`, borderRadius: T4.radius,
          }}>
            <Mono color={T4.accent2}>↳ ESCALATION HINT</Mono>
            <div style={{ fontSize: 11, color: T4.ink2, lineHeight: 1.55, marginTop: 6 }}>
              This chapter has dense entity material. A <strong>deep extract pass</strong> would
              likely surface 4–6 more references.
            </div>
            <div style={{ marginTop: 8 }}>
              <Btn size="sm" variant="primary">RUN DEEP PASS · 1 CALL</Btn>
            </div>
          </div>
        </div>
      </div>
      <Note style={{ top: 90, right: -250, width: 230 }}>
        Margin chips emit <b>extraction:flag</b>. + ADD opens an inline editor; commit writes to
        canonical store and removes the chip. Free-model only — premium escalation is opt-in via the
        deep-pass button.
      </Note>
    </div>
  );
}

function Anchor({ c, children }) {
  return (
    <span style={{
      background: `${c}15`, borderBottom: `1.5px dotted ${c}`, padding: '0 2px',
      borderRadius: 1,
    }}>{children}</span>
  );
}

function FlagChip({ type, name, line, note, cta, subtle }) {
  const c = { loc: T4.accent2, char: T4.accent, item: T4.rarityLegendary, rel: T4.rarityUnique }[type];
  return (
    <div style={{
      padding: 10, background: subtle ? 'transparent' : T4.paper,
      border: `1px solid ${subtle ? T4.rule : c + '55'}`, borderRadius: T4.radius,
      borderLeft: `3px solid ${c}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Mono color={c}>{type === 'rel' ? 'RELATION' : type.toUpperCase()}</Mono>
        <span style={{ flex: 1 }} />
        <Mono color={T4.ink3}>L{line}</Mono>
      </div>
      <div style={{ fontFamily: T4.display, fontSize: 14, color: T4.ink, marginTop: 4 }}>{name}</div>
      <div style={{ fontSize: 11, color: T4.ink2, lineHeight: 1.5, marginTop: 4 }}>{note}</div>
      <div style={{ marginTop: 8 }}>
        <Btn size="sm" variant={subtle ? 'ghost' : 'default'}>{cta}</Btn>
      </div>
    </div>
  );
}

window.AB_Margin = AB_Margin;

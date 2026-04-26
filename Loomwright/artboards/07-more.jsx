/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const T7 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 07 — Extraction Wizard (Layer 2 · post-chapter, deliberate)
//
// ── For Claude Code ──
// Touches:
//   • src/loomwright/extraction/ExtractionWizard.jsx  (NEW — was a wizard
//     in an earlier branch; resurrect, scope to single chapter not whole book)
//   • src/loomwright/extraction/extractionAI.js       (NEW)
//   • src/loomwright/state/extractionRuns.js          (NEW slice)
//
// Steps: SCAN → REVIEW → EDIT → COMMIT. Linear, with Back/Skip on every step.
// On COMMIT, batch-dispatch addEntity for new + updateEntity for edited.
// Confirm batch-dispatch ordering — places must commit before relationships
// that reference them (FLAG IF YOUR DISPATCHER DOESN'T HANDLE THIS).
//
// Trigger: "Run Extract Pass on this chapter" button in chapter header
// (chapter must have stable ID + save event hook).
//
// Free-model self-flag "this chapter is dense — recommend deep pass"
// surfaces as an unobtrusive note next to the trigger — never auto-runs.
// ───────────────────────────────────────────────────────────────────────────
function AB_Extraction() {
  return (
    <div style={{ background: T7.bg, color: T7.ink, padding: 0, minHeight: '100%' }}>
      <div style={{ padding: '14px 22px', borderBottom: `1px solid ${T7.rule}`, background: T7.sidebar, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Mono color={T7.accent}>EXTRACTION WIZARD · CH. 04</Mono>
        <span style={{ flex: 1 }} />
        <Mono color={T7.ink3}>STEP 2 / 4 · REVIEW FINDINGS</Mono>
      </div>
      <div style={{ padding: '24px 32px', maxWidth: 1080 }}>
        <h2 style={{ fontFamily: T7.display, fontSize: 24, color: T7.ink, margin: '0 0 6px', fontWeight: 500 }}>
          16 entities found · 11 new · 5 already canon
        </h2>
        <div style={{ color: T7.ink2, fontSize: 13, lineHeight: 1.6, marginBottom: 18, maxWidth: 640 }}>
          The free pass extracted these from chapter 4. Tick what to lock into your canon. Existing
          entities are pre-checked and editable in place.
        </div>

        {/* Steps rail */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 18, border: `1px solid ${T7.rule}`, borderRadius: T7.radius, overflow: 'hidden' }}>
          {['SCAN', 'REVIEW', 'EDIT', 'COMMIT'].map((s, i) => (
            <div key={s} style={{
              flex: 1, padding: '10px 14px',
              background: i === 1 ? T7.accent : i < 1 ? T7.paper2 : 'transparent',
              color: i === 1 ? T7.bg : i < 1 ? T7.ink2 : T7.ink3,
              borderRight: i < 3 ? `1px solid ${T7.rule}` : 'none',
              fontFamily: T7.mono, fontSize: 10, letterSpacing: 0.14,
            }}>
              <span style={{ marginRight: 6 }}>{i + 1}.</span>{s}
              {i === 0 && <span style={{ float: 'right' }}>✓</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Bucket title="Characters" count="2 new · 1 known" items={[
            ['Marlo', 'NEW', T7.accent, 'Mentioned 3× · debt subplot'],
            ['Old Carrow', 'NEW', T7.accent, 'Tom\'s grandfather · referenced'],
            ['Tom Carrow', 'KNOWN', T7.ink3, 'Existing · POV'],
          ]} />
          <Bucket title="Locations" count="2 new · 1 known" items={[
            ['Riverside', 'KNOWN', T7.ink3, 'Existing · ch.02'],
            ['Millhouse', 'NEW', T7.accent2, 'Mentioned by Marlo'],
            ['The Crossing', 'NEW', T7.accent2, 'Bridge over the Carr'],
          ]} />
          <Bucket title="Items" count="3 new" items={[
            ['Father\'s watch', 'NEW', T7.rarityLegendary, 'Plot-relevant heirloom'],
            ['Millhouse key', 'NEW', T7.rarityRare, 'Marlo\'s line · ch.04'],
            ['Lantern (unlit)', 'NEW', T7.rarityCommon, 'Marlo carries it'],
          ]} />
          <Bucket title="Threads" count="1 new · 1 known" items={[
            ['Marlo\'s Debt', 'KNOWN', T7.ink3, 'Active'],
            ['Lock-mark secret', 'NEW', T7.rarityUnique, 'Tom hides from villagers'],
          ]} />
          <Bucket title="Relationships" count="2 updates" items={[
            ['Tom · Marlo', 'BEAT', T7.bad, 'Tension · false neutrality'],
            ['Tom · Old C.', 'BEAT', T7.warn, 'Watch backstory · ch.04'],
          ]} />
          <Bucket title="Facts" count="3 new" items={[
            ['Watch has chip on hinge', 'NEW', T7.good, 'Canonical detail'],
            ['Bridge mended w/ creosote', 'NEW', T7.good, 'World detail'],
            ['Marlo walks bridge often', 'NEW', T7.good, 'Character detail'],
          ]} />
        </div>

        <div style={{ marginTop: 18, padding: 12, background: T7.paper, border: `1px dashed ${T7.accentSoft}`, borderRadius: T7.radius, display: 'flex', alignItems: 'center', gap: 10 }}>
          <I d={ICONS.spark} size={13} color={T7.accent} />
          <div style={{ flex: 1, fontSize: 12, color: T7.ink2 }}>
            <strong style={{ color: T7.ink }}>Free model flag:</strong> this chapter has dense entity material.
            A deep pass would likely surface relationship nuance the free pass missed.
          </div>
          <Btn variant="primary" size="sm">RUN DEEP PASS · 1 CALL</Btn>
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
          <Btn variant="primary">NEXT · EDIT 11 NEW</Btn>
          <Btn>BACK</Btn>
          <span style={{ flex: 1 }} />
          <Btn variant="ghost">SKIP — DON'T COMMIT</Btn>
        </div>
      </div>
    </div>
  );
}

function Bucket({ title, count, items }) {
  return (
    <div style={{ background: T7.paper, border: `1px solid ${T7.rule}`, borderRadius: T7.radius }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T7.rule}`, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: T7.display, fontSize: 14, color: T7.ink, flex: 1, fontWeight: 500 }}>{title}</span>
        <Mono color={T7.ink3}>{count}</Mono>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map(([n, tag, c, hint], i) => (
          <label key={n} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px',
            borderBottom: i < items.length - 1 ? `1px solid ${T7.rule}` : 'none',
            cursor: 'pointer',
          }}>
            <span style={{
              width: 14, height: 14, marginTop: 2,
              border: `1.5px solid ${tag === 'KNOWN' ? T7.ink3 : T7.accent}`,
              borderRadius: 2, background: tag !== 'KNOWN' ? T7.accent : 'transparent',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              {tag !== 'KNOWN' && <I d={ICONS.check} size={10} color={T7.bg} />}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: T7.display, fontSize: 13, color: T7.ink }}>{n}</span>
                <Mono color={c}>{tag}</Mono>
              </div>
              <Mono color={T7.ink3}>{hint}</Mono>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

window.AB_Extraction = AB_Extraction;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 08 — Continuity Checker, Knows ledger, Tangle matrix, Marginalia
//
// ── For Claude Code ──
// Four small surfaces, grouped because they share paper-and-ink vocabulary.
//
// CONTINUITY CHECKER — NEW PANEL in LeftRail panel stack:
//   • src/loomwright/continuity/ContinuityPanel.jsx  (NEW)
//   • src/loomwright/state/continuity.js             (NEW slice)
//   • Trigger: chapter save → free-model scan; cache per chapter hash
//   • Findings: { severity, description, manuscriptLocations, suggestedFix }
//   • Accept = jump editor to location, apply tracked-change span
//
// KNOWS LEDGER — section in dossier (artboard 02 references it):
//   • Reads character.knows / .hides / .fears (already in Appendix B shape)
//   • KnowledgeEntry needs .learnedAt + .source + .alsoKnownBy (FLAG IF MISSING)
//
// TANGLE MATRIX — alternative view of existing Tangle panel (toggle in header):
//   • src/loomwright/tangle/RelationshipMatrix.jsx  (NEW)
//   • Pure derived render of characters[*].relationships
//
// MARGINALIA — accepted-suggestion treatment in editor:
//   • <span data-staged="true" data-suggestion-id="..."> wraps inserted text
//   • Caveat font + amber left bracket while staged
//   • First edit → strip data-staged, swap to manuscript font (commits to canon)
// ───────────────────────────────────────────────────────────────────────────
function AB_More() {
  return (
    <div style={{ background: T7.bg, color: T7.ink, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Continuity Checker */}
      <Frame kicker="07 · NEW PANEL" title="Continuity Checker">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['HIGH', T7.bad, 'Eye colour drift', 'Tom · grey in ch.02 · "blue" in ch.05', 'Replace "blue" → "grey"'],
            ['MED', T7.warn, 'Item state contradiction', 'Lantern lit in ch.04 · "unlit" in ch.05', 'Mark intentional?'],
            ['LOW', T7.subtle, 'Knowledge', 'Iris asks about watch in ch.07 — already knows from ch.02', 'Soften phrasing'],
          ].map(([sev, c, t, where, fix]) => (
            <div key={t} style={{
              padding: 12, background: T7.paper2, border: `1px solid ${T7.rule}`,
              borderLeft: `3px solid ${c}`, borderRadius: T7.radius,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <Mono color={c} style={{ minWidth: 36 }}>{sev}</Mono>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T7.display, fontSize: 14, color: T7.ink }}>{t}</div>
                <Mono color={T7.ink3}>{where}</Mono>
                <div style={{ fontSize: 11, color: T7.ink2, marginTop: 4 }}>↳ Suggested fix: {fix}</div>
              </div>
              <Btn size="sm" variant="primary">ACCEPT</Btn>
              <Btn size="sm">SNOOZE</Btn>
              <Btn size="sm" variant="ghost">DISMISS</Btn>
            </div>
          ))}
        </div>
      </Frame>

      {/* Knows / Hides / Fears ledger */}
      <Frame kicker="08 · DOSSIER SECTION" title="Knows · Hides · Fears (timeline ledger)">
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 0 }}>
          <div style={{ borderRight: `1px solid ${T7.rule}`, paddingRight: 12 }}>
            {['KNOWS · 4', 'HIDES · 3', 'FEARS · 4'].map((t, i) => (
              <div key={t} style={{
                padding: '10px 8px', borderLeft: `2px solid ${i === 0 ? T7.accent : 'transparent'}`,
                fontFamily: T7.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase',
                color: i === 0 ? T7.accent : T7.ink3, cursor: 'pointer',
              }}>{t}</div>
            ))}
          </div>
          <div style={{ paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Watch was father\'s', 'CH.01', 'from Old Carrow', 'Iris · Marlo'],
              ['Lock-mark on watch', 'CH.02', 'self-discovered', 'Iris (suspected)'],
              ['Marlo lied about debt', 'CH.04', 'overheard', 'no one'],
              ['Bridge will be removed', 'CH.06', 'rumor · Iris', 'Old Carrow'],
            ].map(([fact, ch, src, knownBy]) => (
              <div key={fact} style={{
                padding: '8px 12px', background: T7.paper2, border: `1px solid ${T7.rule}`, borderRadius: T7.radius,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T7.display, fontSize: 13, color: T7.ink }}>{fact}</div>
                  <Mono color={T7.ink3}>FROM · {src}</Mono>
                </div>
                <Pill tone="accent">{ch}</Pill>
                <Mono color={T7.ink3}>ALSO · {knownBy}</Mono>
              </div>
            ))}
          </div>
        </div>
      </Frame>

      {/* Tangle relationship matrix */}
      <Frame kicker="09 · TANGLE" title="Relationship matrix · alternative to graph">
        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', gap: 1, background: T7.rule }}>
          {[' ', 'Tom', 'Iris', 'Marlo', 'Old C.', 'Vell'].map(h => (
            <div key={h} style={{ background: T7.paper, padding: '6px 8px', fontFamily: T7.mono, fontSize: 10, color: T7.ink2, letterSpacing: 0.12, textTransform: 'uppercase' }}>{h}</div>
          ))}
          {[
            ['Tom',   '—', 'sister', 'rivals', 'love', 'cool'],
            ['Iris',  'sister', '—', 'cool', 'cool', 'mother'],
            ['Marlo', 'rivals', 'cool', '—', 'debt', '—'],
            ['Old C.', 'love', 'cool', 'debt', '—', '—'],
            ['Vell',  'cool', 'mother', '—', '—', '—'],
          ].map((row, ri) => row.map((cell, ci) => {
            const tone = cell === 'sister' || cell === 'love' ? T7.good
              : cell === 'rivals' || cell === 'debt' ? T7.bad
              : cell === 'mother' ? T7.accent
              : cell === 'cool' ? T7.subtle
              : null;
            return (
              <div key={ri + '-' + ci} style={{
                background: ci === 0 ? T7.paper : tone ? `${tone}25` : T7.paper2,
                padding: '8px 8px',
                fontFamily: ci === 0 ? T7.mono : T7.display,
                fontSize: ci === 0 ? 10 : 11,
                color: ci === 0 ? T7.ink2 : tone || T7.ink3,
                letterSpacing: ci === 0 ? 0.12 : 0,
                textTransform: ci === 0 ? 'uppercase' : 'none',
                cursor: tone ? 'pointer' : 'default',
              }}>{cell}</div>
            );
          }))}
        </div>
      </Frame>

      {/* Margin-style accepted suggestion */}
      <Frame kicker="10 · MARGINALIA" title="Accepted suggestion in manuscript (post-commit)">
        <div style={{
          background: T7.paper2, border: `1px solid ${T7.rule}`, borderRadius: T7.radius, padding: 22,
          fontFamily: T7.display, fontSize: 16, lineHeight: 1.85, color: T7.ink, position: 'relative',
        }}>
          The bridge at Riverside groaned under the wind. Tom turned the watch in his coat pocket
          and listened for footsteps that did not come.<br/><br/>
          <span style={{
            background: 'rgba(220, 207, 168, 0.10)',
            borderLeft: `2px solid ${T7.accent}`,
            padding: '0 6px', display: 'inline-block', marginTop: 4,
            fontFamily: T7.hand, fontSize: 19, color: T7.suggInk, lineHeight: 1.5,
          }}>
            "You still keep the watch with the chip on the case?" Iris asked, not looking up from
            the river.
          </span>
          <div style={{ position: 'absolute', top: 16, right: 18, display: 'flex', gap: 6 }}>
            <Pill tone="accent">STAGED · CALLBACK</Pill>
            <Btn size="sm">PROMOTE</Btn>
            <Btn size="sm" variant="ghost">REVERT</Btn>
          </div>
        </div>
        <Mono color={T7.ink3} style={{ marginTop: 8, display: 'block' }}>
          ↳ Handwritten ink + bracket while staged. First edit promotes to canon (becomes regular ink).
          Revert wipes it cleanly.
        </Mono>
      </Frame>
    </div>
  );
}

window.AB_More = AB_More;

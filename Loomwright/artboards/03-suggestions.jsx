/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const { useState: uS3 } = React;
const T3 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 03 — Suggestion drawer (cards + detail) + Accept mini-wizard
// Drawer-off-drawer pattern, decided: detail panel pushes left, drawer stays
// visible. Right edge, full height. Marginalia paper texture.
//
// ── For Claude Code ──
// Touches:
//   • src/loomwright/suggestions/SuggestionDrawer.jsx  (NEW component)
//   • src/loomwright/suggestions/SuggestionCard.jsx     (NEW)
//   • src/loomwright/suggestions/AcceptWizard.jsx       (NEW)
//   • src/loomwright/state/suggestions.js               (NEW slice)
//
// Triggers (call regenerateSuggestions(scope)):
//   1. Chapter saved (debounce 800ms)
//   2. Character material state change (item gained/lost, location, fact)
//   3. Manual "Refresh" click
//
// Boost = explicit user action only. Free model NEVER silently escalates.
//
// Provenance chips ALWAYS visible — non-negotiable per brief §5.1.3.
// Accepted text inserted as <span data-staged="true"> in editor — verify
// the editor round-trips this attribute (FLAG IF NOT).
// ───────────────────────────────────────────────────────────────────────────
function AB_Suggestions() {
  const [openId, setOpenId] = uS3(2);
  const [phase, setPhase] = uS3('list'); // list | detail | wizard
  const cards = [
    { id: 1, type: 'item', icon: '◈', rel: 92, boost: false,
      title: 'Pocket-watch slips during river crossing',
      preview: 'Tom\'s grip falters as the cold takes him. Father\'s watch, almost lost.',
      prov: ['Tom · fear of water', 'CH.04 · river crossing', 'Item · @watch · uncovered']},
    { id: 2, type: 'callback', icon: '✦', rel: 87, boost: true,
      title: 'Iris references the lock-mark',
      preview: 'A throwaway line — but only Tom would notice. Plants a payoff for ch.7.',
      prov: ['Iris · knows about watch', 'Knows ledger entry · ch.02', 'Suggestion · ch.07 callback']},
    { id: 3, type: 'sensory', icon: '~', rel: 71, boost: false,
      title: 'Riverside · the smell of cold iron',
      preview: 'Texture beat to anchor the location before Marlo arrives.',
      prov: ['Loc · @Riverside', 'Voice · sparse sensory in ch.4']},
    { id: 4, type: 'dialogue', icon: '”', rel: 64, boost: false,
      title: 'Marlo · "You always wind it twice"',
      preview: 'A line for Marlo that lands inside his speech tics.',
      prov: ['Marlo · voice fingerprint', 'Watch · canonical detail']},
    { id: 5, type: 'travel', icon: '→', rel: 58, boost: false,
      title: 'Side trip to the millhouse',
      preview: 'Beat-skipping option: Tom detours alone before reaching Iris.',
      prov: ['Atlas · Riverside→Mill', 'Pacing · ch.4 single-loc']},
  ];

  return (
    <div style={{ background: T3.bg, color: T3.ink, minHeight: '100%', display: 'flex' }}>
      {/* Manuscript stub on the left */}
      <div style={{ flex: 1, padding: '28px 36px', borderRight: `1px solid ${T3.rule}`, position: 'relative' }}>
        <Mono color={T3.accent}>ROOM · WRITERS</Mono>
        <div style={{ fontFamily: T3.display, fontSize: 22, color: T3.ink, fontWeight: 500, margin: '4px 0 18px' }}>
          Chapter 04 · The Watch at Riverside
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Mono2 name="Tom Carrow" size={26} />
          <Mono>SEL · TOM CARROW</Mono>
          <span style={{ flex: 1 }} />
          <Btn variant="ghost" size="sm" icon={<I d={ICONS.refresh} size={10} color={T3.accent} />}>REGENERATE</Btn>
        </div>
        <div style={{
          fontFamily: T3.display, fontSize: 16, lineHeight: 1.85, color: T3.ink,
          background: T3.paper, border: `1px solid ${T3.rule}`, borderRadius: T3.radius,
          padding: '22px 28px', maxWidth: 640,
        }}>
          The bridge at Riverside groaned under the wind. Tom turned the watch in his coat pocket — the
          familiar weight, the small cold key of it — and listened for footsteps that did not come.<br/><br/>
          <span style={{ background: 'rgba(220, 207, 168, 0.08)', borderBottom: `1px dotted ${T3.suggInk}` }}>
            Below him, the river ran like ink.
          </span>
          <br/><br/>
          He had been here before, years ago, with a man who—
        </div>
        <Mono color={T3.ink3} style={{ marginTop: 14, display: 'block' }}>
          ↳ HIGHLIGHTED LINE · ANCHOR FOR ACCEPTED SUGGESTION INSERTION POINT
        </Mono>
      </div>

      {/* Drawer */}
      <div style={{
        width: phase === 'list' ? 380 : 380,
        background: T3.sidebar, borderLeft: `1px solid ${T3.rule}`,
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, position: 'relative',
      }}>
        <div style={{
          padding: '14px 16px', borderBottom: `1px solid ${T3.rule}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <I d={ICONS.sparkle} size={13} color={T3.accent} />
          <div style={{ flex: 1 }}>
            <Mono color={T3.accent}>SUGGESTIONS · TOM</Mono>
            <div style={{ fontFamily: T3.display, fontSize: 13, color: T3.ink, marginTop: 1 }}>5 open · 1 boosted</div>
          </div>
          <button style={iconBtn3()}><I d={ICONS.refresh} size={11} color={T3.ink2} /></button>
          <button style={iconBtn3()}><I d={ICONS.x} size={11} color={T3.ink2} /></button>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 16px', borderBottom: `1px solid ${T3.rule}`, gap: 14 }}>
          {['Open · 5', 'Snoozed · 2', 'Dismissed · 7'].map((t, i) => (
            <button key={t} style={{
              padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${i === 0 ? T3.accent : 'transparent'}`,
              fontFamily: T3.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
              color: i === 0 ? T3.accent : T3.ink3,
            }}>{t}</button>
          ))}
        </div>
        {/* Cards */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cards.map(c => <SuggestionCard key={c.id} c={c} active={openId === c.id} onOpen={() => { setOpenId(c.id); setPhase('detail'); }} />)}
        </div>
      </div>

      {/* Detail panel — drawer-off-drawer */}
      {phase !== 'list' && (
        <div style={{
          width: 460, background: T3.sugg, borderLeft: `1px solid ${T3.rule}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 26px, rgba(220,207,168,0.04) 26px, rgba(220,207,168,0.04) 27px)',
        }}>
          <div style={{
            padding: '14px 18px', borderBottom: `1px solid ${T3.suggRule}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <button style={iconBtn3()} onClick={() => setPhase('list')}><I d={ICONS.x} size={11} color={T3.ink2} /></button>
            <Mono color={T3.accent}>CALLBACK · 87% RELEVANCE</Mono>
            <span style={{ flex: 1 }} />
            <Pill tone="accent" filled><I d={ICONS.spark} size={9} color={T3.bg} style={{ marginRight: 3 }} />BOOSTED</Pill>
          </div>

          {phase === 'detail' && (
            <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
              <h3 style={{
                fontFamily: T3.display, fontSize: 20, color: T3.ink, margin: 0, fontWeight: 500, lineHeight: 1.25,
              }}>Iris references the lock-mark</h3>

              <div style={{
                marginTop: 14, padding: 14, background: 'rgba(15, 20, 25, 0.4)',
                border: `1px solid ${T3.suggRule}`, borderRadius: T3.radius,
                fontFamily: T3.display, fontSize: 14, color: T3.suggInk, lineHeight: 1.7,
              }}>
                "You still keep the watch with the chip on the case?" Iris asked, not looking up
                from the river. Tom's hand moved before he answered — once, against the wool of his coat,
                pressing the small ridge through the fabric. He hadn't told her about the chip.
              </div>

              {/* Provenance */}
              <div style={{ marginTop: 16 }}>
                <Mono color={T3.accent}>↳ PROVENANCE</Mono>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {[
                    ['CHAR', 'Iris · knows about watch', 'ch.02 · learned from Old Carrow'],
                    ['LEDGER', 'Knows entry · "lock-mark"', 'Tom hides it from villagers'],
                    ['ARC', 'Setup for ch.07 reveal', 'Compresses 2 callbacks into 1 line'],
                  ].map(([k, t, h]) => (
                    <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Mono color={T3.accent2} style={{ minWidth: 50 }}>{k}</Mono>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: T3.ink }}>{t}</div>
                        <Mono color={T3.ink3}>{h}</Mono>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customisation */}
              <div style={{ marginTop: 18 }}>
                <Mono color={T3.accent}>↳ TUNE</Mono>
                <div style={{
                  marginTop: 8, padding: 12, background: 'rgba(15,20,25,0.4)',
                  border: `1px solid ${T3.suggRule}`, borderRadius: T3.radius,
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <Segmented label="LENGTH" options={['SHORT', 'MEDIUM', 'LONG']} active={1} />
                  <Segmented label="TONE" options={['COMEDIC', 'NEUTRAL', 'SOMBRE', 'LYRICAL']} active={2} />
                  <div>
                    <Mono color={T3.ink3}>FORCE INCLUDE — drag chips here</Mono>
                    <div style={{
                      marginTop: 6, padding: 8, minHeight: 38,
                      border: `1px dashed ${T3.suggRule}`, borderRadius: T3.radius,
                      display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
                    }}>
                      <Pill tone="accent">@IRIS</Pill>
                      <Pill tone="warn">@WATCH</Pill>
                      <Mono color={T3.ink3}>+ DROP HERE</Mono>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
                <Btn variant="primary" onClick={() => setPhase('wizard')}>ACCEPT →</Btn>
                <Btn icon={<I d={ICONS.zZ} size={10} color={T3.ink} />}>SNOOZE</Btn>
                <span style={{ flex: 1 }} />
                <Btn variant="danger" size="sm">DISMISS</Btn>
              </div>
            </div>
          )}

          {phase === 'wizard' && <AcceptWizard onClose={() => setPhase('detail')} />}
        </div>
      )}

      <Note style={{ top: 32, right: 32, width: 220, zIndex: 99 }}>
        Suggestion store: <b>state.suggestions: Suggestion[]</b>. Generation triggered on
        <b> chapter:save</b>, <b>character:state-change</b>, manual refresh.
        Free model emits <b>boostRecommended: bool</b>.
      </Note>
    </div>
  );
}

function SuggestionCard({ c, active, onOpen }) {
  const TYPE_C = { item: T3.rarityLegendary, callback: T3.rarityUnique, sensory: T3.accent2, dialogue: T3.good, travel: T3.warn, event: T3.accent, relationship: T3.bad };
  const tc = TYPE_C[c.type] || T3.accent;
  return (
    <div onClick={onOpen} style={{
      padding: 12, background: active ? T3.paper : T3.paper2,
      border: `1px solid ${active ? T3.accentSoft : T3.rule}`,
      borderRadius: T3.radius, cursor: 'pointer',
      display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: active ? `inset 3px 0 0 ${T3.accent}` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: T3.display, fontSize: 14, color: tc, width: 14 }}>{c.icon}</span>
        <Mono color={tc}>{c.type.toUpperCase()}</Mono>
        <span style={{ flex: 1 }} />
        {c.boost && <Pill tone="accent" filled style={{ padding: '1px 5px', fontSize: 8 }}>BOOSTED</Pill>}
        <Mono color={T3.ink3}>{c.rel}%</Mono>
      </div>
      <div style={{ fontFamily: T3.display, fontSize: 14, color: T3.ink, lineHeight: 1.3 }}>{c.title}</div>
      <div style={{ fontSize: 11, color: T3.ink2, lineHeight: 1.5 }}>{c.preview}</div>
      {/* Provenance — always-visible mini-chips */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
        {c.prov.map((p, i) => (
          <span key={i} style={{
            fontFamily: T3.mono, fontSize: 8, color: T3.ink3,
            padding: '1px 5px', background: T3.bg, border: `1px solid ${T3.rule}`, borderRadius: 2,
            letterSpacing: 0.1, textTransform: 'uppercase',
          }}>{p}</span>
        ))}
      </div>
      {/* Hover row — quick actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <Btn variant="ghost" size="sm">ACCEPT</Btn>
        <Btn variant="ghost" size="sm">SNOOZE</Btn>
        <span style={{ flex: 1 }} />
        <button style={iconBtn3(true)} title="Boost (premium)"><I d={ICONS.spark} size={10} color={T3.accent} /></button>
        <button style={iconBtn3(true)} title="Dismiss"><I d={ICONS.x} size={10} color={T3.ink3} /></button>
      </div>
    </div>
  );
}

function Segmented({ label, options, active }) {
  return (
    <div>
      <Mono color={T3.ink3}>{label}</Mono>
      <div style={{ marginTop: 4, display: 'flex', border: `1px solid ${T3.suggRule}`, borderRadius: 2, overflow: 'hidden' }}>
        {options.map((o, i) => (
          <button key={o} style={{
            flex: 1, padding: '6px 8px',
            background: i === active ? T3.accent : 'transparent',
            color: i === active ? T3.bg : T3.ink2,
            border: 'none', cursor: 'pointer',
            fontFamily: T3.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase',
            borderRight: i < options.length - 1 ? `1px solid ${T3.suggRule}` : 'none',
          }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function AcceptWizard({ onClose }) {
  return (
    <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
      <Mono color={T3.accent}>STEP 2 · INSERTION</Mono>
      <h3 style={{ fontFamily: T3.display, fontSize: 18, color: T3.ink, margin: '4px 0 14px', fontWeight: 500 }}>
        Where should this go?
      </h3>
      {/* Editable preview */}
      <div style={{
        padding: 14, background: 'rgba(15,20,25,0.4)', border: `1px solid ${T3.suggRule}`,
        borderRadius: T3.radius,
        fontFamily: T3.hand, fontSize: 19, color: T3.suggInk, lineHeight: 1.55,
      }}>
        "You still keep the watch with the chip on the case?" Iris asked, not looking up from
        the river. Tom's hand moved before he answered.
      </div>
      <Mono color={T3.ink3} style={{ marginTop: 6, display: 'block' }}>↳ EDIT BEFORE COMMIT — handwritten ink while staged</Mono>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <RadioRow checked label="Insert at cursor" sub="Line 12 · ch.04 · the highlighted anchor" pill="DEFAULT" />
        <RadioRow label="Pending insertions tray" sub="Stage for later — copy-paste when ready" />
        <RadioRow label="Replace selection" sub="Disabled · no manuscript selection" disabled />
      </div>

      <label style={{
        display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
        fontFamily: T3.mono, fontSize: 10, color: T3.ink2, letterSpacing: 0.12, textTransform: 'uppercase',
      }}>
        <span style={{ width: 12, height: 12, border: `1.5px solid ${T3.accent}`, borderRadius: 2, display: 'grid', placeItems: 'center' }}>
          <I d={ICONS.check} size={9} color={T3.accent} />
        </span>
        REMEMBER THIS DEFAULT
      </label>

      <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
        <Btn variant="primary">COMMIT INSERTION</Btn>
        <Btn onClick={onClose}>← BACK</Btn>
      </div>

      <div style={{
        marginTop: 22, padding: 12, background: 'rgba(15,20,25,0.4)',
        border: `1px dashed ${T3.suggRule}`, borderRadius: T3.radius,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <Mono color={T3.accent2}>POST-COMMIT</Mono>
        <span style={{ fontSize: 11, color: T3.ink2, lineHeight: 1.55 }}>
          Inserted text wraps in tracked-change marginalia (handwritten ink). Editing it once
          promotes it to canonical text. Until then, it's reverable.
        </span>
      </div>
    </div>
  );
}

function RadioRow({ checked, label, sub, pill, disabled }) {
  return (
    <button style={{
      width: '100%', padding: 12,
      background: checked ? 'rgba(220,207,168,0.08)' : 'transparent',
      border: `1px solid ${checked ? T3.accentSoft : T3.suggRule}`,
      borderRadius: T3.radius, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 999, border: `1.5px solid ${checked ? T3.accent : T3.suggRule}`,
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        {checked && <span style={{ width: 7, height: 7, borderRadius: 999, background: T3.accent }} />}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T3.display, fontSize: 14, color: T3.ink }}>{label}</div>
        <Mono color={T3.ink3}>{sub}</Mono>
      </div>
      {pill && <Pill tone="accent">{pill}</Pill>}
    </button>
  );
}

function iconBtn3(small) {
  return {
    width: small ? 20 : 24, height: small ? 20 : 24, borderRadius: 2,
    border: `1px solid ${T3.rule}`, background: 'transparent',
    display: 'grid', placeItems: 'center', cursor: 'pointer',
  };
}

window.AB_Suggestions = AB_Suggestions;

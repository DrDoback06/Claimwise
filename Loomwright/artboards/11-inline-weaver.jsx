/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const { useState: uS11 } = React;
const T11 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 11 — Inline Weaver
//
// ── For Claude Code ──
// The chapter writing surface. This is what the author looks at most of the
// day. Everything else (Suggestions, Continuity, Knows) is a sidecar that
// surfaces here. Three-column layout:
//
//   ┌────────────┬─────────────────────────┬──────────────┐
//   │ Chapters   │ MANUSCRIPT (the page)   │ Live Sidecar │
//   │ + scenes   │  with @-mentions inline │ (continuity, │
//   │ outline    │  + accepted marginalia  │  suggestions │
//   │            │  + caret-context chip   │  for current │
//   │            │                         │  paragraph)  │
//   └────────────┴─────────────────────────┴──────────────┘
//
// Maps to: src/loomwright/manuscript/Editor.jsx (the textarea-of-record),
// src/loomwright/manuscript/Sidebar.jsx (chapter list).
//
// The "caret-context chip" is NEW — small floating tag near the cursor showing
// (active POV, scene-time, current location). FLAG this as a new component:
//   src/loomwright/manuscript/CaretContext.jsx
// It reads:
//   manuscript.activeChapterId, manuscript.cursorParagraphId
//   ¶.povCharacterId, ¶.sceneTimeRel, ¶.locationId
// ───────────────────────────────────────────────────────────────────────────
function AB_InlineWeaver() {
  return (
    <div style={{ background: T11.bg, color: T11.ink, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* top strip — chapter title + breadcrumbs + global actions */}
      <div style={{
        padding: '10px 22px', borderBottom: `1px solid ${T11.rule}`, background: T11.sidebar,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Mono color={T11.ink3}>MANUSCRIPT</Mono>
        <Mono color={T11.ink3}>›</Mono>
        <Mono color={T11.ink3}>BOOK ONE · THE CARROW</Mono>
        <Mono color={T11.ink3}>›</Mono>
        <Mono color={T11.accent}>CH.06 · THE OLD TONGUE</Mono>
        <span style={{ flex: 1 }} />
        <Mono color={T11.ink3}>1,847 words · saved 12s ago</Mono>
        <Btn size="sm" variant="ghost" icon={<I d={ICONS.eye} size={11} color={T11.ink2} />}>FOCUS</Btn>
        <Btn size="sm" icon={<I d={ICONS.sparkle} size={11} color={T11.accent} />}>SUGGEST</Btn>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 320px', minHeight: 0 }}>
        {/* LEFT — chapter outline */}
        <div style={{ background: T11.sidebar, borderRight: `1px solid ${T11.rule}`, padding: '14px 0', overflow: 'auto' }}>
          <div style={{ padding: '0 14px 8px' }}>
            <Mono color={T11.ink3}>BOOK ONE</Mono>
          </div>
          <ChapItem n="01" t="The Forge" />
          <ChapItem n="02" t="A Wheel Returns" />
          <ChapItem n="03" t="Iris in the Lane" />
          <ChapItem n="04" t="The Ferry" />
          <ChapItem n="05" t="Bargemen at Dusk" />
          <ChapItem n="06" t="The Old Tongue" current
            scenes={[
              { t: 'Tom rises before light', here: false },
              { t: 'On the towpath', here: false },
              { t: 'The bargeman speaks', here: true },
              { t: 'Tom answers', here: false },
            ]} />
          <ChapItem n="07" t="What the Stones Say" />
          <ChapItem n="08" t="(unwritten)" dim />

          <div style={{ padding: '14px 14px 0', borderTop: `1px solid ${T11.rule}`, marginTop: 12 }}>
            <button style={{
              width: '100%', padding: '8px 10px',
              background: 'transparent', border: `1px dashed ${T11.rule}`, borderRadius: T11.radius,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <I d={ICONS.plus} size={11} color={T11.ink2} />
              <Mono color={T11.ink2}>NEW SCENE</Mono>
            </button>
          </div>
        </div>

        {/* CENTER — manuscript */}
        <div style={{ position: 'relative', overflow: 'auto', background: T11.bg, padding: '36px 0' }}>
          <div style={{
            maxWidth: 640, margin: '0 auto', background: T11.paper,
            border: `1px solid ${T11.rule}`, borderRadius: T11.radius,
            padding: '52px 64px', position: 'relative',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 28px rgba(40,30,15,0.06)',
          }}>
            {/* page header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Mono color={T11.ink3}>CHAPTER SIX</Mono>
              <h1 style={{ fontFamily: T11.display, fontSize: 26, fontWeight: 500, color: T11.ink, margin: '4px 0 0', letterSpacing: -0.3 }}>
                The Old Tongue
              </h1>
            </div>

            {/* paragraphs */}
            <Para>
              The mist had not yet lifted from the river when <Mention name="Tom Carrow" type="char" /> reached the towpath. He carried his grandfather's <Mention name="Wheelwright's mark" type="item" /> in his coat pocket, where he had carried it every day since the funeral, and he was beginning, in some part of himself he could not yet name, to feel that the carrying mattered.
            </Para>

            <Para>
              The barge was already moored at <Mention name="Penlow Ford" type="loc" />. Two men were aboard. The older one — broad-faced, with the kind of stillness Tom had only ever seen in his grandfather — looked up from his rope and said something Tom did not understand.
            </Para>

            <Para>
              Tom must have looked stupid, because the man repeated it, slower. <em>Diolch i'r afon a' chwsg yn dawel.</em> And then, in English, almost gentle: "Thanks to the river, and sleep quiet."
            </Para>

            {/* ACTIVE PARAGRAPH — caret here */}
            <Para active>
              "I know that one," Tom said, and was surprised to find that he did. His grandfather had said it over <Mention name="the Carrow forge" type="loc" />, every night, as the fire died down. Tom had thought it was nonsense. <Caret />
            </Para>

            <Para muted>
              The bargeman smiled, then, and said something else, longer, and Tom did not understand a word of it.
            </Para>

            {/* ACCEPTED MARGINALIA — bound to the prev paragraph */}
            <Marginalia>
              <Mono color={T11.suggInk}>FROM @CLAUDE · accepted</Mono>
              <div style={{ fontFamily: T11.hand, fontSize: 17, color: T11.suggInk, lineHeight: 1.4, marginTop: 4 }}>
                Tom doesn't yet know he's speaking the Old Tongue. Hold the reveal — let his grandfather's voice surface as memory, not knowledge.
              </div>
            </Marginalia>
          </div>

          {/* Caret-context chip — floats near the cursor */}
          <div style={{
            position: 'absolute', top: 408, left: '50%', transform: 'translateX(110px)',
            background: T11.paper2, border: `1px solid ${T11.rule}`, borderRadius: T11.radius,
            padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(40,30,15,0.10)',
          }}>
            <Mono color={T11.ink3}>CARET</Mono>
            <span style={{ width: 1, height: 12, background: T11.rule }} />
            <Mono2 name="Tom Carrow" size={16} />
            <Mono color={T11.ink}>POV · TOM</Mono>
            <span style={{ width: 1, height: 12, background: T11.rule }} />
            <Mono color={T11.ink2}>DAWN</Mono>
            <span style={{ width: 1, height: 12, background: T11.rule }} />
            <Mono color={T11.accent2}>@PENLOW FORD</Mono>
          </div>
        </div>

        {/* RIGHT — live sidecar */}
        <div style={{ background: T11.sidebar, borderLeft: `1px solid ${T11.rule}`, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Tab label="FOR THIS ¶" active />
          <SidecarSection kicker="CONTINUITY · for this paragraph" tone="warn">
            <div style={{ fontSize: 12, color: T11.ink, lineHeight: 1.55 }}>
              Tom <strong>knows</strong> the phrase, but in <em>ch.04 ¶12</em> he was described as having "no Welsh."
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Btn size="sm" variant="primary">ACCEPT &amp; FIX</Btn>
              <Btn size="sm" variant="ghost">DISMISS</Btn>
            </div>
          </SidecarSection>

          <SidecarSection kicker="SUGGESTIONS · 2 for this ¶" tone="accent">
            <SuggMini
              kind="line"
              text="Try: 'said it without thinking, the way grandfather had said it.' — keeps the unconscious-knowledge framing."
            />
            <SuggMini
              kind="continuity"
              text="If you keep this line, ch.04 ¶12 needs revising. Auto-draft a fix?"
            />
          </SidecarSection>

          <SidecarSection kicker="KNOWS · what changes here">
            <KnowsRow who="Tom" fact="speaks Old Tongue" delta="+ NEW" />
            <KnowsRow who="Bargeman" fact="Tom understands" delta="+ NEW" />
            <KnowsRow who="Iris" fact="—" delta="unchanged" />
          </SidecarSection>

          <SidecarSection kicker="MENTIONED HERE">
            <MentionRow type="char" name="Tom Carrow" />
            <MentionRow type="loc" name="Penlow Ford" />
            <MentionRow type="loc" name="Carrow forge" />
            <MentionRow type="item" name="Wheelwright's mark" />
          </SidecarSection>
        </div>
      </div>
    </div>
  );
}

function ChapItem({ n, t, current, dim, scenes }) {
  return (
    <div>
      <div style={{
        padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8,
        background: current ? T11.paper : 'transparent',
        borderLeft: `2px solid ${current ? T11.accent : 'transparent'}`,
        opacity: dim ? 0.5 : 1, cursor: 'pointer',
      }}>
        <Mono color={current ? T11.accent : T11.ink3}>{n}</Mono>
        <span style={{ fontFamily: T11.display, fontSize: 13, color: current ? T11.ink : T11.ink2, fontStyle: dim ? 'italic' : 'normal' }}>{t}</span>
      </div>
      {current && scenes && (
        <div style={{ paddingLeft: 30, paddingBottom: 4 }}>
          {scenes.map((s, i) => (
            <div key={i} style={{
              padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 8,
              borderLeft: `2px solid ${s.here ? T11.accent : T11.rule}`,
            }}>
              <span style={{ width: 4, height: 4, borderRadius: 999, background: s.here ? T11.accent : T11.ink3 }} />
              <span style={{ fontSize: 11, color: s.here ? T11.ink : T11.ink2, fontFamily: T11.display, fontStyle: 'italic' }}>{s.t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Para({ children, active, muted }) {
  return (
    <p style={{
      fontFamily: T11.display, fontSize: 16, lineHeight: 1.75,
      color: muted ? T11.ink2 : T11.ink,
      margin: '0 0 18px',
      textIndent: 28,
      background: active ? `${T11.accentSoft}` : 'transparent',
      padding: active ? '4px 8px' : 0,
      marginLeft: active ? -8 : 0,
      marginRight: active ? -8 : 0,
      borderRadius: active ? 2 : 0,
    }}>{children}</p>
  );
}
function Mention({ name, type }) {
  const c = type === 'char' ? T11.accent : type === 'loc' ? T11.accent2 : T11.rarityRare;
  return (
    <span style={{
      color: c, borderBottom: `1px solid ${c}55`, cursor: 'pointer',
      background: `${c}0c`, padding: '0 2px', borderRadius: 2,
    }}>{name}</span>
  );
}
function Caret() {
  return <span style={{
    display: 'inline-block', width: 1.5, height: 18, background: T11.accent,
    verticalAlign: 'middle', marginLeft: 1,
    animation: 'lwblink 1.1s steps(2) infinite',
  }} />;
}
function Marginalia({ children }) {
  return (
    <div style={{
      marginTop: 22, padding: '10px 14px',
      background: T11.sugg, borderLeft: `2px solid ${T11.suggInk}55`, borderRadius: T11.radius,
    }}>{children}</div>
  );
}

function Tab({ label, active }) {
  return (
    <div style={{
      padding: '10px 14px', borderBottom: `1px solid ${T11.rule}`,
      background: active ? T11.paper : 'transparent',
      borderLeft: `2px solid ${active ? T11.accent : 'transparent'}`,
    }}>
      <Mono color={active ? T11.accent : T11.ink3}>{label}</Mono>
    </div>
  );
}
function SidecarSection({ kicker, tone, children }) {
  const c = tone === 'warn' ? T11.warn : tone === 'accent' ? T11.accent : T11.ink3;
  return (
    <div style={{ padding: 14, borderBottom: `1px solid ${T11.rule}` }}>
      <Mono color={c} style={{ marginBottom: 8, display: 'block' }}>{kicker}</Mono>
      {children}
    </div>
  );
}
function SuggMini({ kind, text }) {
  const c = kind === 'continuity' ? T11.warn : T11.accent;
  return (
    <div style={{
      padding: 10, background: T11.paper, border: `1px solid ${T11.rule}`,
      borderLeft: `2px solid ${c}`, borderRadius: T11.radius, marginBottom: 6,
    }}>
      <Mono color={c}>{kind.toUpperCase()}</Mono>
      <div style={{ fontFamily: T11.display, fontSize: 12.5, color: T11.ink, marginTop: 4, lineHeight: 1.5, fontStyle: 'italic' }}>
        "{text}"
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        <Btn size="sm" variant="primary">ACCEPT</Btn>
        <Btn size="sm" variant="ghost">×</Btn>
      </div>
    </div>
  );
}
function KnowsRow({ who, fact, delta }) {
  const isNew = delta.includes('+');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${T11.rule}` }}>
      <Mono2 name={who} size={18} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: T11.ink }}>{who}</div>
        <div style={{ fontSize: 10.5, color: T11.ink2, fontStyle: 'italic' }}>{fact}</div>
      </div>
      <Mono color={isNew ? T11.good : T11.ink3}>{delta}</Mono>
    </div>
  );
}
function MentionRow({ type, name }) {
  const c = type === 'char' ? T11.accent : type === 'loc' ? T11.accent2 : T11.rarityRare;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c }} />
      <span style={{ fontSize: 12, color: T11.ink, flex: 1 }}>{name}</span>
      <Mono color={T11.ink3}>{type.toUpperCase()}</Mono>
    </div>
  );
}

window.AB_InlineWeaver = AB_InlineWeaver;

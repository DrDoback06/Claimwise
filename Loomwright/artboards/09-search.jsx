/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const T9 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 09 — Cross-cutting search & mention micro-card
//
// ── For Claude Code ──
// Two surfaces, both small but load-bearing:
//
// A · Cmd-K palette (NEW — `src/loomwright/cmdk/`)
//    • Single keyboard entry into anything: characters, places, items, threads,
//      chapters, skills, suggestions, and verbs ("New character", "Run scan").
//    • Indexes ALL entity slices on mount; refreshes on slice change.
//    • Picking an entity sets sel.{kind} = id (uses dispatch helpers from §12.8).
//    • Picking a verb dispatches the action directly.
//
// B · @-mention hover micro-card (extends the manuscript editor)
//    • On hover of a `<span data-mention-id>` token, render this card
//      anchored to the token. 250ms delay in, 100ms out.
//    • Click body → setSelection(ref). Click "open" → focus the relevant panel.
//    • Card is the SAME component used by Atlas pin tooltips and Tangle node
//      tooltips — one component, three call sites.
// ───────────────────────────────────────────────────────────────────────────
function AB_Search() {
  return (
    <div style={{ padding: 32, color: T9.ink, position: 'relative', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Mono color={T9.accent}>09 · Cross-cutting</Mono>
        <h1 style={{ fontFamily: T9.display, fontSize: 26, fontWeight: 500, color: T9.ink, margin: '4px 0 6px' }}>
          Cmd-K palette &amp; mention micro-card
        </h1>
        <div style={{ color: T9.ink2, fontSize: 13, lineHeight: 1.6, maxWidth: 700 }}>
          Two small surfaces that touch every panel. Both reuse the same entity-render component
          so one fix propagates everywhere.
        </div>
      </div>

      {/* Cmd-K */}
      <Frame kicker="A · Cmd-K palette" title="One keystroke to anything">
        <div style={{
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.10))',
          border: `1px dashed ${T9.rule}`,
          borderRadius: T9.radius,
          padding: 24,
          minHeight: 460,
          display: 'grid', placeItems: 'center',
        }}>
          <div style={{ position: 'absolute', top: 8, left: 12 }}>
            <Mono color={T9.ink3}>SCRIM · ROOM DIMS BEHIND</Mono>
          </div>
          {/* palette */}
          <div style={{
            width: 540,
            background: T9.paper2,
            border: `1px solid ${T9.rule}`,
            borderRadius: 6,
            boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            {/* input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 16px',
              borderBottom: `1px solid ${T9.rule}`,
            }}>
              <I d={ICONS.search} size={16} color={T9.ink2} />
              <span style={{ fontFamily: T9.display, fontSize: 17, color: T9.ink, flex: 1 }}>
                ris<span style={{ background: T9.accentSoft, color: T9.ink }}>&nbsp;</span>
                <span style={{
                  display: 'inline-block', width: 1, height: 18, background: T9.accent, verticalAlign: 'middle',
                  animation: 'lwBlink 1s steps(2) infinite', marginLeft: 1,
                }} />
              </span>
              <Mono color={T9.ink3}>⌘K</Mono>
            </div>
            <style>{`@keyframes lwBlink { 50% { opacity: 0; } }`}</style>

            {/* groups */}
            <div style={{ maxHeight: 380, overflow: 'hidden' }}>
              <CmdGroup label="People">
                <CmdRow icon={<Mono2 name="Iris Vell" size={20} />} title={<MatchHL t="I" m="ris" rest=" Vell" />} hint="Sister · ch. 01–07" selected />
                <CmdRow icon={<Mono2 name="Marris Quail" size={20} />} title={<MatchHL t="Mar" m="ris" rest=" Quail" />} hint="Innkeep · ch. 02" />
              </CmdGroup>
              <CmdGroup label="Places">
                <CmdRow icon={<I d={ICONS.map} size={14} color={T9.accent2} />} title={<MatchHL t="Rive" m="ris" rest="ide Quay" />} hint="Place · 4 chapters" />
              </CmdGroup>
              <CmdGroup label="Threads">
                <CmdRow icon={<I d={ICONS.thread} size={14} color={T9.rarityUnique} />} title={<MatchHL t="Iris&rsquo;s lie" m="" rest="" />} hint="Thread · 3 beats unresolved" />
              </CmdGroup>
              <CmdGroup label="Verbs">
                <CmdRow icon={<I d={ICONS.plus} size={14} color={T9.ink2} />} title="New character" hint="Open dossier · empty" />
                <CmdRow icon={<I d={ICONS.shield} size={14} color={T9.ink2} />} title="Scan continuity" hint="Current chapter · ch. 04" />
                <CmdRow icon={<I d={ICONS.refresh} size={14} color={T9.ink2} />} title="Re-suggest" hint="Re-run Claude on this paragraph" />
              </CmdGroup>
            </div>

            {/* footer */}
            <div style={{
              borderTop: `1px solid ${T9.rule}`,
              padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 14,
              background: T9.bg,
            }}>
              <Hint k="↑↓">navigate</Hint>
              <Hint k="↵">open</Hint>
              <Hint k="⌘↵">focus &amp; pin</Hint>
              <span style={{ flex: 1 }} />
              <Hint k="esc">close</Hint>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: T9.ink2, lineHeight: 1.55 }}>
          Match highlights use <code style={mono9()}>accentSoft</code> on the matched substring.
          Groups are <em>fixed order</em> (people → places → threads → items → chapters → suggestions → verbs)
          so muscle memory works after the first use.
        </div>
      </Frame>

      {/* Mention micro-card */}
      <Frame kicker="B · @-mention hover micro-card" title="One component · three call sites">
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
          {/* live demo */}
          <div style={{ position: 'relative', minHeight: 280 }}>
            <div style={{
              background: T9.paper2, border: `1px solid ${T9.rule}`, borderRadius: T9.radius,
              padding: 18, fontFamily: T9.display, fontSize: 16, lineHeight: 1.8, color: T9.ink,
            }}>
              <p style={{ margin: 0 }}>
                Tom found <Ment>@Iris</Ment> at the gate. She hadn&rsquo;t spoken to him since
                the night at <span style={{ color: T9.accent2, borderBottom: `1.5px dotted ${T9.accent2}` }}>@loc:Riverside</span>.
              </p>
            </div>
            {/* card anchored to @Iris */}
            <div style={{
              position: 'absolute', top: 56, left: 60,
              width: 280,
              background: T9.paper, border: `1px solid ${T9.accentSoft}`,
              borderRadius: T9.radius, padding: 12,
              boxShadow: '0 18px 40px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Mono2 name="Iris Vell" size={36} />
                <div>
                  <div style={{ fontFamily: T9.display, fontSize: 15, color: T9.ink }}>Iris Vell</div>
                  <Mono>SISTER · UNRELIABLE NARRATOR</Mono>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                <Pill tone="accent">CH 01–07</Pill>
                <Pill tone="subtle">11 KNOWS</Pill>
              </div>
              <div style={{ fontSize: 12, color: T9.ink2, lineHeight: 1.55, marginBottom: 8 }}>
                Last seen ch.04 at <span style={{ color: T9.accent2 }}>Riverside</span>.
                Knows about the watch. Hides it from Tom.
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn size="sm" variant="primary" icon={<I d={ICONS.eye} size={11} color="#fff" />}>FOCUS</Btn>
                <Btn size="sm" icon={<I d={ICONS.book} size={11} color={T9.ink2} />}>DOSSIER</Btn>
                <Btn size="sm" icon={<I d={ICONS.map} size={11} color={T9.ink2} />}>ATLAS</Btn>
              </div>
            </div>
            {/* arrow connector */}
            <svg style={{ position: 'absolute', top: 38, left: 50, width: 30, height: 22, pointerEvents: 'none' }}>
              <path d="M2 22 L18 6" stroke={T9.accent} strokeWidth="1" strokeDasharray="2 2" fill="none" />
            </svg>
          </div>

          {/* anatomy */}
          <div style={{
            background: T9.paper2, border: `1px solid ${T9.rule}`, borderRadius: T9.radius,
            padding: 14,
          }}>
            <Mono color={T9.accent}>ANATOMY</Mono>
            <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Anat n="1" label="Avatar" hint="Mono2 · 36px (16px on inline @-tokens)" />
              <Anat n="2" label="Title + role" hint="display 15 / mono 9 — same hierarchy as Selection pill" />
              <Anat n="3" label="Pills" hint="appearance scope · counts · custom flags" />
              <Anat n="4" label="Body" hint="1–3 lines, last seen · key relationships · most recent fact" />
              <Anat n="5" label="Actions" hint="FOCUS (sel) · DOSSIER (focus panel) · contextual third (ATLAS for char/place, EQUIP for item, etc)" />
            </ul>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T9.rule}`, fontSize: 11, color: T9.ink2, lineHeight: 1.55 }}>
              <strong style={{ color: T9.ink }}>Same component, three call sites:</strong> manuscript hover,
              Atlas pin tooltip, Tangle node tooltip. Pass <code style={mono9()}>EntityRef</code>; the card resolves the rest.
            </div>
          </div>
        </div>
      </Frame>

      <Note style={{ top: 240, right: -240, width: 220 }}>
        Hover delay <b>250ms in / 100ms out</b>. Same as Atlas tooltips — keep timings in
        a single constants module so they stay aligned.
      </Note>
      <Note style={{ top: 690, right: -240, width: 220 }}>
        Build the card <b>once</b> — <code>EntityCard&lt;ref&gt;</code> in <code>src/loomwright/entity-card/</code>.
        Manuscript hover, Atlas, Tangle all import it.
      </Note>
    </div>
  );
}

// ── atoms ──────────────────────────────────────────────────────────────────
function CmdGroup({ label, children }) {
  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ padding: '2px 16px 4px' }}>
        <Mono color={T9.ink3}>{label}</Mono>
      </div>
      {children}
    </div>
  );
}
function CmdRow({ icon, title, hint, selected }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px',
      background: selected ? T9.accentSoft : 'transparent',
      borderLeft: `2px solid ${selected ? T9.accent : 'transparent'}`,
    }}>
      <div style={{ width: 22, display: 'grid', placeItems: 'center' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: T9.ink, fontFamily: T9.display, lineHeight: 1.2 }}>{title}</div>
        <div style={{ marginTop: 2 }}><Mono color={T9.ink3}>{hint}</Mono></div>
      </div>
      {selected && <Mono color={T9.accent}>↵ open</Mono>}
    </div>
  );
}
function MatchHL({ t, m, rest }) {
  return (
    <span>
      {t}
      <span style={{ background: T9.accentSoft, color: T9.ink, borderRadius: 2, padding: '0 1px' }}>{m}</span>
      {rest}
    </span>
  );
}
function Hint({ k, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <kbd style={{
        fontFamily: T9.mono, fontSize: 9.5,
        padding: '1px 5px',
        border: `1px solid ${T9.rule}`,
        borderRadius: 2,
        background: T9.paper2,
        color: T9.ink2,
      }}>{k}</kbd>
      <Mono color={T9.ink3}>{children}</Mono>
    </span>
  );
}
function Ment({ children }) {
  return (
    <span style={{
      color: T9.accent, borderBottom: `1.5px dotted ${T9.accent}`,
      cursor: 'pointer', padding: '0 1px',
      background: T9.accentSoft,
    }}>{children}</span>
  );
}
function Anat({ n, label, hint }) {
  return (
    <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{
        flexShrink: 0, width: 18, height: 18,
        borderRadius: 999, background: T9.accent, color: T9.paper2,
        fontFamily: T9.mono, fontSize: 9, fontWeight: 600,
        display: 'grid', placeItems: 'center', marginTop: 1,
      }}>{n}</span>
      <div>
        <div style={{ fontSize: 12, color: T9.ink, fontFamily: T9.display }}>{label}</div>
        <div style={{ marginTop: 1 }}><Mono color={T9.ink3}>{hint}</Mono></div>
      </div>
    </li>
  );
}
function mono9() { return { fontFamily: T9.mono, fontSize: 11, color: T9.accent, padding: '1px 5px', background: T9.paper2, border: `1px solid ${T9.rule}`, borderRadius: 2 }; }

window.AB_Search = AB_Search;

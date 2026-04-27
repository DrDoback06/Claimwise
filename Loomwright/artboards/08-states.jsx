/* global React, Mono, Pill, Btn, I, ICONS, Frame, Note */
const T8 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 08 — States Matrix
//
// Three high-traffic panels × four states = 12 cells.
// ── For Claude Code ──
// Every panel MUST handle these four states explicitly. Don't ship without.
//   • Empty:    user has done nothing yet (no selection, no data)
//   • Loading:  fetch / AI run in flight  →  show skeleton, never blank
//   • Error:    fetch / AI failed         →  copy + retry button, never silent
//   • Populated: happy path
//
// The skeleton pattern: 2-3 inert rows with a faint shimmer (animation:
// `pulse 1.6s ease-in-out infinite`). NEVER spinners — they hide the shape
// of what's coming and feel wrong in this aesthetic.
//
// Error copy convention: state what failed in 3 words ("AI run failed",
// "Couldn't load Tom"), then a retry. No stack traces. No "Oops!".
// ───────────────────────────────────────────────────────────────────────────
function AB_StatesMatrix() {
  return (
    <div style={{ padding: 32, color: T8.ink, position: 'relative' }}>
      <div style={{ marginBottom: 24 }}>
        <Mono color={T8.accent}>08 · States · 12 cells</Mono>
        <h1 style={{ fontFamily: T8.display, fontSize: 26, fontWeight: 500, color: T8.ink, margin: '4px 0 6px' }}>
          Empty / Loading / Error / Populated
        </h1>
        <div style={{ color: T8.ink2, fontSize: 13, lineHeight: 1.6, maxWidth: 700 }}>
          Three high-traffic panels, four states each. Every panel ships with all four —
          no &ldquo;happy path only&rdquo;.
        </div>
      </div>

      <style>{`
        @keyframes lwPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.9; } }
        .lw-skel { animation: lwPulse 1.6s ease-in-out infinite; }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '120px repeat(4, 1fr)',
        gap: 12,
      }}>
        {/* header row */}
        <div />
        <ColHeader label="Empty" hint="No data / no selection" />
        <ColHeader label="Loading" hint="Skeleton — not spinner" />
        <ColHeader label="Error" hint="3-word copy + retry" />
        <ColHeader label="Populated" hint="Happy path" />

        {/* Dossier row */}
        <RowHeader label="Dossier" />
        <Cell><DossierEmpty /></Cell>
        <Cell><DossierLoading /></Cell>
        <Cell><DossierError /></Cell>
        <Cell><DossierPopulated /></Cell>

        {/* Suggestions row */}
        <RowHeader label="Suggestion drawer" />
        <Cell><SuggEmpty /></Cell>
        <Cell><SuggLoading /></Cell>
        <Cell><SuggError /></Cell>
        <Cell><SuggPopulated /></Cell>

        {/* Continuity row */}
        <RowHeader label="Continuity" />
        <Cell><ContEmpty /></Cell>
        <Cell><ContLoading /></Cell>
        <Cell><ContError /></Cell>
        <Cell><ContPopulated /></Cell>
      </div>

      <Note style={{ top: 32, right: -240, width: 220 }}>
        Skeleton rows mirror the height of real content so the layout doesn&rsquo;t jump
        when data arrives. Match real row heights ±2px.
      </Note>
      <Note style={{ top: 360, right: -240, width: 220 }}>
        Error copy is short and human. Retry button uses the original action verb
        (&ldquo;Re-scan&rdquo;, &ldquo;Re-suggest&rdquo;, &ldquo;Reload&rdquo;) — never just &ldquo;Retry&rdquo;.
      </Note>
    </div>
  );
}

function ColHeader({ label, hint }) {
  return (
    <div style={{ padding: '4px 6px 8px' }}>
      <div style={{ fontFamily: T8.display, fontSize: 14, color: T8.ink, fontWeight: 500 }}>{label}</div>
      <div style={{ marginTop: 2 }}><Mono color={T8.ink3}>{hint}</Mono></div>
    </div>
  );
}
function RowHeader({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
      paddingTop: 10, paddingRight: 10,
    }}>
      <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        <Mono color={T8.accent} size={10} style={{ letterSpacing: 0.18 }}>{label.toUpperCase()}</Mono>
      </div>
    </div>
  );
}
function Cell({ children }) {
  return (
    <div style={{
      background: T8.paper, border: `1px solid ${T8.rule}`, borderRadius: T8.radius,
      minHeight: 220, padding: 12, display: 'flex', flexDirection: 'column',
    }}>{children}</div>
  );
}

// ── Dossier states ──────────────────────────────────────────────────────────
function DossierShell({ children, kicker = 'DOSSIER' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <Mono color={T8.ink3}>{kicker}</Mono>
      {children}
    </div>
  );
}
function DossierEmpty() {
  return (
    <DossierShell>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 12 }}>
        <div>
          <I d={ICONS.eye} size={20} color={T8.ink3} />
          <div style={{ fontFamily: T8.display, fontSize: 14, color: T8.ink, marginTop: 8 }}>
            Nothing selected
          </div>
          <div style={{ fontSize: 11, color: T8.ink2, marginTop: 4, lineHeight: 1.5, maxWidth: 200 }}>
            Click a name in the manuscript or pick someone from the Cast.
          </div>
        </div>
      </div>
    </DossierShell>
  );
}
function DossierLoading() {
  return (
    <DossierShell>
      <div className="lw-skel" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skel w="60%" h={18} />
        <Skel w="40%" h={10} />
        <div style={{ height: 8 }} />
        <Skel w="100%" h={28} />
        <Skel w="100%" h={28} />
        <Skel w="100%" h={28} />
      </div>
    </DossierShell>
  );
}
function DossierError() {
  return (
    <DossierShell>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 12 }}>
        <div>
          <I d={ICONS.alert} size={20} color={T8.bad} />
          <div style={{ fontFamily: T8.display, fontSize: 14, color: T8.ink, marginTop: 8 }}>
            Couldn&rsquo;t load Tom
          </div>
          <div style={{ fontSize: 11, color: T8.ink2, marginTop: 4, lineHeight: 1.5 }}>
            Last try: 4 sec ago.
          </div>
          <Btn size="sm" variant="primary" style={{ marginTop: 10 }}>RELOAD</Btn>
        </div>
      </div>
    </DossierShell>
  );
}
function DossierPopulated() {
  return (
    <DossierShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: T8.display, fontSize: 15, color: T8.ink }}>Tom Carrow</div>
        <Mono color={T8.ink3}>CARTWRIGHT · POV · CH 01–07</Mono>
        <div style={{ height: 6 }} />
        <SectionRow label="Identity" count="6 fields" />
        <SectionRow label="Inventory" count="4 items" />
        <SectionRow label="Skills" count="2 trees" />
        <SectionRow label="Knows" count="11 facts" />
      </div>
    </DossierShell>
  );
}

// ── Suggestion drawer states ────────────────────────────────────────────────
function SuggShell({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Mono color={T8.suggInk}>SUGGESTIONS</Mono>
      </div>
      {children}
    </div>
  );
}
function SuggEmpty() {
  return (
    <SuggShell>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 8 }}>
        <div>
          <I d={ICONS.spark} size={20} color={T8.ink3} />
          <div style={{ fontFamily: T8.display, fontSize: 13, color: T8.ink, marginTop: 8 }}>
            Quiet for now
          </div>
          <div style={{ fontSize: 11, color: T8.ink2, marginTop: 4, lineHeight: 1.5, maxWidth: 200 }}>
            Keep writing — Claude reads on every paragraph.
          </div>
        </div>
      </div>
    </SuggShell>
  );
}
function SuggLoading() {
  return (
    <SuggShell>
      <div className="lw-skel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkelCard />
        <SkelCard />
        <SkelCard />
      </div>
    </SuggShell>
  );
}
function SuggError() {
  return (
    <SuggShell>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 8 }}>
        <div>
          <I d={ICONS.alert} size={18} color={T8.bad} />
          <div style={{ fontFamily: T8.display, fontSize: 13, color: T8.ink, marginTop: 8 }}>
            AI run failed
          </div>
          <div style={{ fontSize: 11, color: T8.ink2, marginTop: 4, lineHeight: 1.5 }}>
            Network or rate limit.
          </div>
          <Btn size="sm" variant="primary" style={{ marginTop: 10 }}>RE-SUGGEST</Btn>
        </div>
      </div>
    </SuggShell>
  );
}
function SuggPopulated() {
  return (
    <SuggShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <MiniSugg type="ITEM" title="The chipped horseshoe" rel={82} />
        <MiniSugg type="CALLBACK" title="Iris&rsquo;s flask, ch. 02" rel={71} />
        <MiniSugg type="SENSORY" title="Smell of wet rope" rel={64} />
      </div>
    </SuggShell>
  );
}

// ── Continuity states ───────────────────────────────────────────────────────
function ContShell({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Mono color={T8.ink3}>CONTINUITY</Mono>
        <I d={ICONS.shield} size={11} color={T8.ink3} />
      </div>
      {children}
    </div>
  );
}
function ContEmpty() {
  return (
    <ContShell>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 8 }}>
        <div>
          <I d={ICONS.shield} size={20} color={T8.good} />
          <div style={{ fontFamily: T8.display, fontSize: 13, color: T8.ink, marginTop: 8 }}>
            Nothing yet
          </div>
          <div style={{ fontSize: 11, color: T8.ink2, marginTop: 4, lineHeight: 1.5, maxWidth: 200 }}>
            Run a scan after the chapter is drafted.
          </div>
          <Btn size="sm" style={{ marginTop: 10 }}>SCAN CHAPTER</Btn>
        </div>
      </div>
    </ContShell>
  );
}
function ContLoading() {
  return (
    <ContShell>
      <div className="lw-skel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skel w="100%" h={14} />
        <Skel w="80%" h={10} />
        <div style={{ height: 4 }} />
        <Skel w="100%" h={14} />
        <Skel w="60%" h={10} />
        <div style={{ height: 4 }} />
        <Skel w="100%" h={14} />
      </div>
    </ContShell>
  );
}
function ContError() {
  return (
    <ContShell>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 8 }}>
        <div>
          <I d={ICONS.alert} size={18} color={T8.bad} />
          <div style={{ fontFamily: T8.display, fontSize: 13, color: T8.ink, marginTop: 8 }}>
            Scan failed
          </div>
          <div style={{ fontSize: 11, color: T8.ink2, marginTop: 4, lineHeight: 1.5 }}>
            Last partial result kept.
          </div>
          <Btn size="sm" variant="primary" style={{ marginTop: 10 }}>RE-SCAN</Btn>
        </div>
      </div>
    </ContShell>
  );
}
function ContPopulated() {
  return (
    <ContShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FindingRow sev="error" text="Tom carries the watch in ch.05 — given to Iris in ch.03" />
        <FindingRow sev="warn" text="Riverside described both as &lsquo;quay&rsquo; and &lsquo;wharf&rsquo;" />
        <FindingRow sev="info" text="@Iris&rsquo;s eyes: green (ch.01) → grey (ch.04)" />
      </div>
    </ContShell>
  );
}

// ── Tiny atoms ──────────────────────────────────────────────────────────────
function Skel({ w = '100%', h = 14 }) {
  return <div style={{ width: w, height: h, background: T8.rule, borderRadius: 2 }} />;
}
function SkelCard() {
  return (
    <div style={{
      padding: 8, background: T8.sugg, border: `1px solid ${T8.suggRule}`, borderRadius: T8.radius,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <Skel w="50%" h={9} />
      <Skel w="100%" h={12} />
      <Skel w="80%" h={9} />
    </div>
  );
}
function SectionRow({ label, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 8px', borderBottom: `1px solid ${T8.rule}`,
    }}>
      <span style={{ fontSize: 12, color: T8.ink }}>{label}</span>
      <Mono color={T8.ink3}>{count}</Mono>
    </div>
  );
}
function MiniSugg({ type, title, rel }) {
  return (
    <div style={{
      padding: 8, background: T8.sugg, border: `1px solid ${T8.suggRule}`, borderRadius: T8.radius,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Mono color={T8.suggInk}>{type}</Mono>
        <Mono color={T8.ink3}>{rel}</Mono>
      </div>
      <div style={{ fontSize: 11.5, color: T8.ink, marginTop: 3, lineHeight: 1.4 }}>{title}</div>
    </div>
  );
}
function FindingRow({ sev, text }) {
  const c = sev === 'error' ? T8.bad : sev === 'warn' ? T8.warn : T8.ink3;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{
        width: 6, height: 6, marginTop: 6, borderRadius: 999, background: c, flexShrink: 0,
      }} />
      <span style={{ fontSize: 11, color: T8.ink, lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}

window.AB_StatesMatrix = AB_StatesMatrix;

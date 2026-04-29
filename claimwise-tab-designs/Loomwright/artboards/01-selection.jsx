/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const T1 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 01 — Selection language: pill, lock, multi-select, mention
//
// ── For Claude Code ──
// Lives at the room shell level (above all panels). Touches:
//   • src/loomwright/LoomwrightShell.jsx  → mount <SelectionPill> in header
//   • src/loomwright/state/sel.js (NEW)   → global slice + useSel() hook
//   • Each panel's header                  → <PanelLockChip />  reads/writes panelLocks slice
//   • InlineWeaver / writers-room editor   → render @-mention tokens as live links
//
// State contracts (NEW slices needed):
//   sel = { character, place, thread, item, chapter, multi }   // single global slice
//   panelLocks: Record<PanelId, { mode: 'follow'|'whole'|'entity', pinnedTo? }>
//
// Mention syntax DECISION: unified `@`. `@Tom`, `@loc:Riverside`,
// `@item:watch`, `@thread:revenge`. Rejected mixed sigils because *italics*
// collides with markdown.
// ───────────────────────────────────────────────────────────────────────────
function AB_Selection() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, color: T1.ink, position: 'relative' }}>
      <Header kicker="01 · The Spine" title="Selection Bus — visual language">
        Every panel reads <code style={mono()}>sel</code>. The pill, lock, and mention conventions are the
        connective tissue. Settle these first; everything else inherits.
      </Header>

      {/* Pill — single */}
      <Frame kicker="A · Selection pill (single)" title="Persistent at the top of the room">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SelectionPill name="Tom Carrow" role="Cartwright · POV" />
          <Mono>↳ click avatar to focus dossier · click × to clear</Mono>
        </div>
      </Frame>

      {/* Pill — multi */}
      <Frame kicker="B · Multi-select" title="Shift-click to add a second entity">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <SelectionPill multi names={['Tom Carrow', 'Iris Vell']} />
          <Mono>+2 OTHERS</Mono>
          <span style={{ flex: 1 }} />
          <Pill tone="accent2">INTERSECT MODE</Pill>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: T1.ink2, lineHeight: 1.55 }}>
          Atlas highlights where their paths cross in <em>space and time</em>; Threads filters to shared;
          Tangle highlights the path between them.
        </div>
      </Frame>

      {/* Lock states */}
      <Frame kicker="C · Per-panel lock" title="Pin a panel; ignore Selection Bus">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <LockChip state="follow" />
          <LockChip state="whole" />
          <LockChip state="entity" entity="Tom" />
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: T1.ink2, lineHeight: 1.55 }}>
          Metaphor chosen: <strong style={{ color: T1.ink }}>pin</strong>. Lock implies "don't edit"; pin reads as
          "stay where you are." Sits in each panel header, top-right.
        </div>
      </Frame>

      {/* Mention syntax */}
      <Frame kicker="D · Mention syntax (manuscript)" title="Unified @ prefix · type inferred from match">
        <div style={{
          background: T1.paper2, border: `1px solid ${T1.rule}`, borderRadius: T1.radius,
          padding: 16, fontFamily: T1.display, fontSize: 16, lineHeight: 1.7, color: T1.ink,
        }}>
          The <Mention type="char">@Tom</Mention> stepped onto the bridge at <Mention type="loc">@Riverside</Mention>,
          one hand closed around the <Mention type="item">@watch</Mention> his father had given him.
          The <Mention type="thread">@revenge</Mention> was nearer than he wanted to admit.
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <Legend swatch={T1.accent} label="@character" hint="ink-ochre, dotted underline" />
          <Legend swatch={T1.accent2} label="@location · prefix loc:" hint="teal, dotted underline" />
          <Legend swatch={T1.rarityLegendary} label="@item · prefix item:" hint="amber-orange" />
          <Legend swatch={T1.rarityUnique} label="@thread · prefix thread:" hint="violet" />
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: T1.ink2, lineHeight: 1.55 }}>
          Decided over <code style={mono()}>*item*</code> / <code style={mono()}>%thread%</code> because <code style={mono()}>*</code> conflicts with markdown italics.
          One sigil, one mental model. Prefix only required when the bare name is ambiguous.
        </div>
      </Frame>

      {/* Hover micro-card */}
      <Frame kicker="E · Mention hover micro-card" title="Quick preview · click sets sel">
        <div style={{ position: 'relative', minHeight: 180 }}>
          <div style={{
            background: T1.paper2, border: `1px solid ${T1.rule}`, borderRadius: T1.radius,
            padding: 16, fontFamily: T1.display, fontSize: 15, color: T1.ink, lineHeight: 1.7,
          }}>
            …found <Mention type="char">@Iris</Mention> waiting at the gate.
          </div>
          <div style={{
            position: 'absolute', top: 50, left: 78,
            width: 280, background: T1.paper, border: `1px solid ${T1.accentSoft}`,
            borderRadius: T1.radius, padding: 12,
            boxShadow: '0 18px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Mono2 name="Iris Vell" size={36} />
              <div>
                <div style={{ fontFamily: T1.display, fontSize: 15, color: T1.ink }}>Iris Vell</div>
                <Mono>SISTER · UNRELIABLE NARRATOR</Mono>
              </div>
            </div>
            <Mono color={T1.ink3}>LAST SEEN · CH. 04 · RIVERSIDE</Mono>
            <div style={{ fontSize: 12, color: T1.ink2, marginTop: 6, lineHeight: 1.5 }}>
              Knows about the watch. Hides it from Tom.
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <Btn size="sm" variant="primary">FOCUS</Btn>
              <Btn size="sm">DOSSIER</Btn>
            </div>
          </div>
        </div>
      </Frame>

      <Note style={{ top: 130, right: -240, width: 220 }}>
        Pill writes to <b>sel</b> only via × (clearSelection). Multi-mode entered via shift-click on a Cast tile.
      </Note>
      <Note style={{ top: 360, right: -240, width: 220 }}>
        Lock state lives <b>per panel</b>, not in <b>sel</b>. New slice: <b>panelLocks: Record&lt;PanelId, LockState&gt;</b>.
      </Note>
    </div>
  );
}

function Header({ kicker, title, children }) {
  return (
    <div>
      <Mono color={T1.accent}>{kicker}</Mono>
      <h1 style={{
        fontFamily: T1.display, fontSize: 28, fontWeight: 500, color: T1.ink,
        margin: '4px 0 8px', letterSpacing: -0.3,
      }}>{title}</h1>
      <div style={{ color: T1.ink2, fontSize: 13, lineHeight: 1.6, maxWidth: 720 }}>{children}</div>
    </div>
  );
}

function SelectionPill({ name, role, multi, names }) {
  if (multi) {
    return (
      <div style={pillBase()}>
        <Mono color={T1.accent}>SELECTION</Mono>
        <div style={{ display: 'flex', marginLeft: 6 }}>
          {names.map((n, i) => (
            <div key={n} style={{ marginLeft: i ? -8 : 0, border: `1.5px solid ${T1.paper}`, borderRadius: 2 }}>
              <Mono2 name={n} size={22} />
            </div>
          ))}
        </div>
        <span style={{ fontFamily: T1.display, fontSize: 14, color: T1.ink, marginLeft: 8 }}>
          {names.join(' + ')}
        </span>
        <button style={xBtn()}><I d={ICONS.x} size={11} color={T1.ink2} /></button>
      </div>
    );
  }
  return (
    <div style={pillBase()}>
      <Mono color={T1.accent}>SELECTION</Mono>
      <Mono2 name={name} size={22} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontFamily: T1.display, fontSize: 14, color: T1.ink }}>{name}</span>
        <Mono color={T1.ink3} size={8}>{role}</Mono>
      </div>
      <button style={xBtn()}><I d={ICONS.x} size={11} color={T1.ink2} /></button>
    </div>
  );
}
function pillBase() {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 6px 6px 10px',
    background: T1.paper, border: `1px solid ${T1.accentSoft}`,
    borderRadius: 999,
  };
}
function xBtn() {
  return {
    width: 22, height: 22, borderRadius: 999,
    border: `1px solid ${T1.rule}`, background: 'transparent',
    display: 'grid', placeItems: 'center', cursor: 'pointer',
    marginLeft: 4,
  };
}

function LockChip({ state, entity }) {
  const isFollow = state === 'follow';
  const isWhole = state === 'whole';
  const isEntity = state === 'entity';
  const c = isFollow ? T1.ink3 : isWhole ? T1.accent2 : T1.accent;
  const label = isFollow ? 'FOLLOWING SEL' : isWhole ? 'PINNED · WHOLE BOOK' : `PINNED · ${entity?.toUpperCase()}`;
  return (
    <div style={{
      padding: 12, background: T1.paper2, border: `1px solid ${T1.rule}`, borderRadius: T1.radius,
      display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start',
    }}>
      <I d={ICONS.pin} size={16} color={c} />
      <Mono color={c}>{label}</Mono>
      <span style={{ fontSize: 11, color: T1.ink2, lineHeight: 1.5 }}>
        {isFollow && 'Default. Panel responds to global selection.'}
        {isWhole && 'Click pin while sel is null — panel locks to overview.'}
        {isEntity && 'Click pin while a character is selected — panel sticks even if sel changes.'}
      </span>
    </div>
  );
}

function Mention({ type, children }) {
  const c = {
    char: T1.accent, loc: T1.accent2, item: T1.rarityLegendary, thread: T1.rarityUnique,
  }[type];
  return (
    <span style={{
      color: c,
      borderBottom: `1.5px dotted ${c}`,
      cursor: 'pointer', padding: '0 1px',
    }}>{children}</span>
  );
}
function Legend({ swatch, label, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 10, height: 10, background: swatch, borderRadius: 2 }} />
      <Mono color={T1.ink}>{label}</Mono>
      <Mono color={T1.ink3}>· {hint}</Mono>
    </div>
  );
}
function mono() { return { fontFamily: T1.mono, fontSize: 11, color: T1.accent, padding: '1px 5px', background: T1.paper2, border: `1px solid ${T1.rule}`, borderRadius: 2 }; }

window.AB_Selection = AB_Selection;

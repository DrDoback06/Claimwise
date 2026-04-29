/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const { useState: uS6b } = React;
const T6b = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 06b — Skill Tree Editor (hybrid: list left, canvas right, both live)
//
// ── For Claude Code ──
// This is the PRIMARY skill authoring surface. New module: src/loomwright/skills/editor/.
// Wraps existing SkillTreeSystem; adds the list/table side, multi-tree switcher,
// inline-edit pane, AI suggest, and import/export.
//
// Hybrid rule: editing in the list updates the canvas; clicking a node selects
// the row in the list. ONE selection state shared between sides. NEVER fork.
//
//   selectedNode: SkillNode | null   ← single source of truth
//   activeTreeId: TreeId             ← which tree is shown
//   skillFilter: { q, tier, tag }    ← list filter only
//
// Multi-tree: a project has many trees. The switcher up top is just a row of
// pills with a "+ NEW TREE" button. Cross-tree links: when a node's prereq
// references a node in another tree, render the link as a "→ tree:Combat"
// chip in the inspector.
// ───────────────────────────────────────────────────────────────────────────
function AB_SkillTreeEditor() {
  const [activeTree, setActiveTree] = uS6b('wheelwright');
  const [selected, setSelected] = uS6b('old-tongue');
  const [filter, setFilter] = uS6b('');

  return (
    <div style={{ background: T6b.bg, color: T6b.ink, minHeight: '100%', padding: 0, display: 'flex', flexDirection: 'column' }}>
      {/* ── Header bar with multi-tree switcher ─────────────────────────── */}
      <div style={{ padding: '12px 22px', borderBottom: `1px solid ${T6b.rule}`, background: T6b.sidebar, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Mono color={T6b.accent}>06B · SKILL TREE EDITOR</Mono>
        <span style={{ flex: 1 }} />
        <Btn variant="ghost" icon={<I d={ICONS.refresh} size={10} color={T6b.ink2} />}>EXPORT</Btn>
        <Btn variant="ghost" icon={<I d={ICONS.sparkle} size={10} color={T6b.accent} />}>SUGGEST TREE</Btn>
      </div>
      <div style={{ padding: '10px 22px', background: T6b.paper, borderBottom: `1px solid ${T6b.rule}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mono color={T6b.ink3}>TREE</Mono>
        {[
          ['wheelwright', 'Wheelwright', 14, T6b.rarityLegendary],
          ['river-lore', 'River Lore', 9, T6b.accent2],
          ['combat', 'Combat', 22, T6b.bad],
          ['social', 'Social', 11, T6b.accent],
        ].map(([id, name, count, c]) => (
          <button key={id} onClick={() => setActiveTree(id)} style={{
            padding: '6px 12px',
            background: activeTree === id ? T6b.paper2 : 'transparent',
            border: `1px solid ${activeTree === id ? c : T6b.rule}`,
            borderTopLeftRadius: T6b.radius, borderTopRightRadius: T6b.radius,
            borderBottomColor: activeTree === id ? T6b.paper2 : T6b.rule,
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginBottom: -1,
            position: 'relative',
            zIndex: activeTree === id ? 2 : 1,
          }}>
            <I d={ICONS.spark} size={11} color={c} />
            <span style={{ fontFamily: T6b.display, fontSize: 13, color: T6b.ink }}>{name}</span>
            <Mono color={T6b.ink3}>{count}</Mono>
          </button>
        ))}
        <button style={{
          padding: '6px 10px', background: 'transparent',
          border: `1px dashed ${T6b.rule}`, borderRadius: T6b.radius,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <I d={ICONS.plus} size={10} color={T6b.ink2} />
          <Mono color={T6b.ink2}>NEW TREE</Mono>
        </button>
      </div>

      {/* ── Body: list left | canvas right | inspector far right ──────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', flex: 1, minHeight: 0 }}>
        {/* List / table */}
        <div style={{ borderRight: `1px solid ${T6b.rule}`, display: 'flex', flexDirection: 'column', background: T6b.paper, minHeight: 0 }}>
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T6b.rule}`, display: 'flex', alignItems: 'center', gap: 6 }}>
            <I d={ICONS.search} size={11} color={T6b.ink3} />
            <input type="text" placeholder="Search nodes…" value={filter} onChange={e => setFilter(e.target.value)} style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: T6b.font, fontSize: 12, color: T6b.ink,
            }} />
            <Mono color={T6b.ink3}>14</Mono>
          </div>
          <div style={{ padding: '6px 0', flex: 1, overflowY: 'auto' }}>
            {[
              ['wheelwright', 'Wheelwright', 'master', 0, []],
              ['river-lore', 'River Lore', 'adept', 1, ['wheelwright']],
              ['quiet-step', 'Quiet Step', 'novice', 1, ['wheelwright']],
              ['ferry-knot', 'Ferry Knot', 'novice', 2, ['river-lore']],
              ['old-tongue', 'Old Tongue', 'unique', 2, ['river-lore']],
              ['bridge-eye', 'Bridge Eye', 'locked', 2, ['quiet-step']],
              ['rope-sense', 'Rope Sense', 'novice', 2, ['quiet-step']],
              ['name-of-the-river', 'Name of the River', 'unique', 3, ['old-tongue']],
            ].filter(r => !filter || r[1].toLowerCase().includes(filter.toLowerCase()))
              .map(([id, name, tier, depth, prereqs]) => (
                <SkillRow key={id} id={id} name={name} tier={tier} depth={depth} prereqs={prereqs}
                  selected={selected === id} onSelect={() => setSelected(id)} />
              ))}
            <div style={{ padding: '8px 12px' }}>
              <button style={{
                width: '100%', padding: '8px 10px',
                background: 'transparent', border: `1px dashed ${T6b.rule}`,
                borderRadius: T6b.radius, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <I d={ICONS.plus} size={10} color={T6b.accent} />
                <Mono color={T6b.accent}>NEW NODE · ⌘N</Mono>
              </button>
            </div>
            <div style={{ padding: '0 12px 8px' }}>
              <Mono color={T6b.ink3}>BULK</Mono>
              <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                <Btn size="sm" variant="ghost">PASTE CSV</Btn>
                <Btn size="sm" variant="ghost">IMPORT TREE</Btn>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ position: 'relative', background: T6b.paper, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${T6b.rule}`, display: 'flex', alignItems: 'center', gap: 6, background: T6b.paper2 }}>
            <ToolBtn icon={ICONS.plus} label="ADD" />
            <ToolBtn icon={ICONS.link} label="LINK" />
            <ToolBtn icon={ICONS.thread} label="BRANCH" />
            <ToolBtn icon={ICONS.layers} label="GROUP" />
            <span style={{ flex: 1 }} />
            <Mono color={T6b.ink3}>ZOOM</Mono>
            <Btn size="sm" variant="ghost">−</Btn>
            <Mono color={T6b.ink}>100%</Mono>
            <Btn size="sm" variant="ghost">+</Btn>
            <Btn size="sm" variant="ghost" icon={<I d={ICONS.layers} size={10} color={T6b.accent} />}>AUTO-ARRANGE</Btn>
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <TreeCanvas selected={selected} onSelect={setSelected} />
          </div>

          {/* Edit pane sliding up from bottom */}
          <NodeEditPane6b />
        </div>

        {/* Inspector */}
        <div style={{ borderLeft: `1px solid ${T6b.rule}`, padding: 16, background: T6b.paper, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <NodeInspector />
        </div>
      </div>
    </div>
  );
}

function SkillRow({ id, name, tier, depth, prereqs, selected, onSelect }) {
  const tierColor = {
    master: T6b.rarityLegendary, adept: T6b.rarityRare, novice: T6b.rarityCommon,
    unique: T6b.rarityUnique, locked: T6b.ink3,
  }[tier];
  return (
    <div onClick={onSelect} style={{
      padding: '6px 12px 6px ' + (12 + depth * 12) + 'px',
      borderLeft: `2px solid ${selected ? T6b.accent : 'transparent'}`,
      background: selected ? T6b.accentSoft : 'transparent',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <I d={ICONS.spark} size={10} color={tierColor} />
      <span style={{ flex: 1, fontFamily: T6b.display, fontSize: 12.5, color: T6b.ink }}>{name}</span>
      <Mono color={tierColor}>{tier.toUpperCase().slice(0, 3)}</Mono>
    </div>
  );
}

function TreeCanvas({ selected, onSelect }) {
  const nodes = [
    ['wheelwright', 'Wheelwright', 360, 80, T6b.rarityLegendary, 'master'],
    ['river-lore', 'River Lore', 220, 200, T6b.rarityRare, 'adept'],
    ['quiet-step', 'Quiet Step', 500, 200, T6b.rarityCommon, 'novice'],
    ['ferry-knot', 'Ferry Knot', 120, 320, T6b.rarityCommon, 'novice'],
    ['old-tongue', 'Old Tongue', 320, 320, T6b.rarityUnique, 'unique'],
    ['bridge-eye', 'Bridge Eye', 580, 320, T6b.ink3, 'locked'],
    ['rope-sense', 'Rope Sense', 420, 320, T6b.rarityCommon, 'novice'],
    ['name-of-the-river', 'Name of the River', 320, 460, T6b.rarityUnique, 'unique'],
  ];
  const links = [
    ['wheelwright', 'river-lore'], ['wheelwright', 'quiet-step'],
    ['river-lore', 'ferry-knot'], ['river-lore', 'old-tongue'],
    ['quiet-step', 'rope-sense'], ['quiet-step', 'bridge-eye'],
    ['old-tongue', 'name-of-the-river'],
  ];
  const byId = Object.fromEntries(nodes.map(n => [n[0], n]));
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* dotted grid */}
      <svg style={{ position: 'absolute', inset: 0, opacity: 0.35, width: '100%', height: '100%' }}>
        <defs>
          <pattern id="dots6b" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.7" fill={T6b.ink3} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots6b)" />
      </svg>

      {/* connections */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {links.map(([a, b], i) => {
          const A = byId[a], B = byId[b];
          const dashed = B[5] === 'locked';
          return <line key={i} x1={A[2]} y1={A[3]} x2={B[2]} y2={B[3]}
            stroke={T6b.rule} strokeWidth="2" strokeDasharray={dashed ? '3 4' : 'none'} />;
        })}
      </svg>

      {nodes.map(([id, name, x, y, c, tier]) => {
        const isSel = id === selected;
        const locked = tier === 'locked';
        return (
          <button key={id} onClick={() => onSelect(id)} style={{
            position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)',
            padding: '7px 11px', minWidth: 110,
            background: T6b.paper2,
            border: `${isSel ? 2 : 1.5}px solid ${c}`,
            borderRadius: T6b.radius, textAlign: 'center', cursor: 'pointer',
            boxShadow: isSel ? `0 0 0 4px ${c}25` : !locked ? `0 0 10px ${c}30` : 'none',
            opacity: locked ? 0.55 : 1,
          }}>
            <div style={{ fontFamily: T6b.display, fontSize: 12, color: T6b.ink }}>{name}</div>
            <Mono color={c}>{tier.toUpperCase()}</Mono>
          </button>
        );
      })}
    </div>
  );
}

function ToolBtn({ icon, label }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 8px',
      background: 'transparent',
      border: `1px solid ${T6b.rule}`,
      borderRadius: T6b.radius, cursor: 'pointer',
      fontFamily: T6b.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase',
      color: T6b.ink2,
    }}>
      <I d={icon} size={10} color={T6b.ink2} />
      {label}
    </button>
  );
}

function NodeEditPane6b() {
  return (
    <div style={{
      borderTop: `1px solid ${T6b.rule}`,
      padding: '10px 14px',
      background: T6b.paper2,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <Mono color={T6b.accent}>EDITING · OLD TONGUE</Mono>
      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
        <input type="text" defaultValue="Old Tongue" style={inputStyle()} />
        <select style={{ ...inputStyle(), width: 110 }} defaultValue="unique">
          <option>novice</option><option>adept</option><option>master</option><option>unique</option>
        </select>
        <input type="text" defaultValue="River Lore · Adept" style={{ ...inputStyle(), flex: 1 }} placeholder="prereqs" />
      </div>
      <Btn size="sm" variant="primary">SAVE</Btn>
      <Btn size="sm">DUPLICATE</Btn>
      <Btn size="sm" variant="ghost"><I d={ICONS.x} size={10} color={T6b.bad} /></Btn>
    </div>
  );
}
function inputStyle() {
  return {
    padding: '5px 8px', background: T6b.paper, border: `1px solid ${T6b.rule}`,
    borderRadius: T6b.radius, fontFamily: T6b.font, fontSize: 12, color: T6b.ink, outline: 'none',
  };
}

function NodeInspector() {
  return (
    <>
      <Mono color={T6b.accent}>↳ NODE INSPECTOR</Mono>
      <div>
        <div style={{ fontFamily: T6b.display, fontSize: 18, color: T6b.ink }}>Old Tongue</div>
        <Mono color={T6b.rarityUnique}>UNIQUE · LOCKED FOR TOM</Mono>
      </div>
      <div style={{ fontSize: 12, color: T6b.ink2, lineHeight: 1.6 }}>
        The pre-canal speech of bargemen. Three dozen verbs, half of them for water. Tom heard
        his grandfather use it once.
      </div>
      <FieldI label="UNLOCK · PREREQS" value="River Lore · Adept" />
      <FieldI label="UNLOCK · CHAPTER" value="ch.06+" />
      <FieldI label="EFFECT · STAT" value="+2 LORE while active" />
      <FieldI label="EFFECT · FLAG" value="comprehend.bargemen" mono />
      <div>
        <Mono color={T6b.ink3}>NARRATIVE REFS · 3</Mono>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <RefRow ch="ch.04 · ¶12" snippet="…the strange old vowel his grandfather had used…" />
          <RefRow ch="ch.06 · ¶03" snippet="The bargeman answered in the old tongue." />
          <RefRow ch="ch.07 · ¶21" snippet="…words for water Tom didn't yet know." />
        </div>
      </div>
      <div style={{ paddingTop: 10, borderTop: `1px solid ${T6b.rule}` }}>
        <Mono color={T6b.ink3}>PROGRESSION</Mono>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ProgRow name="Tom" status="locked" hint="needs River Lore · Adept" />
          <ProgRow name="Iris" status="never" hint="no River Lore" />
          <ProgRow name="Marris" status="active" hint="unlocked ch.05" />
        </div>
      </div>
    </>
  );
}
function FieldI({ label, value, mono }) {
  return (
    <div>
      <Mono color={T6b.ink3}>{label}</Mono>
      <div style={{
        marginTop: 4, padding: '6px 9px', background: T6b.paper2, border: `1px solid ${T6b.rule}`,
        borderRadius: T6b.radius, fontFamily: mono ? T6b.mono : T6b.display, fontSize: mono ? 11 : 13, color: T6b.ink,
      }}>{value}</div>
    </div>
  );
}
function RefRow({ ch, snippet }) {
  return (
    <div style={{ borderLeft: `2px solid ${T6b.accent}`, paddingLeft: 8 }}>
      <Mono color={T6b.accent}>{ch}</Mono>
      <div style={{ fontFamily: T6b.display, fontSize: 11.5, color: T6b.ink2, marginTop: 2, fontStyle: 'italic', lineHeight: 1.4 }}>{snippet}</div>
    </div>
  );
}
function ProgRow({ name, status, hint }) {
  const c = { active: T6b.good, locked: T6b.warn, never: T6b.ink3 }[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c }} />
      <span style={{ fontFamily: T6b.display, fontSize: 12, color: T6b.ink, flex: 1 }}>{name}</span>
      <Mono color={c}>{status.toUpperCase()}</Mono>
      <Mono color={T6b.ink3} style={{ fontSize: 8 }}>{hint}</Mono>
    </div>
  );
}

window.AB_SkillTreeEditor = AB_SkillTreeEditor;

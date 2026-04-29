/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const { useState: uS5 } = React;
const T5 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 05 — Atlas v2
//
// ── For Claude Code ──
// Wraps src/loomwright/atlas/AtlasAI.jsx + UKMapVisualization.
// Interaction model (the user explicitly asked for this split):
//   • LEFT-CLICK on map  → manipulate visuals (drag pin, drag polygon vertex,
//                          drag region label, lasso-select, pan)
//   • RIGHT-CLICK on map → open creation menu (add place / draw region /
//                          drop label / measure / draw road)
//   • EDIT PANE BELOW    → appears on selection. Add / edit / remove
//                          properties of the selected feature WITHOUT a modal.
//
// Required schema additions (FLAG IF MISSING):
//   Place.coords: { x, y } | { lat, lng }     (already present)
//   Place.chapterIds: ChapterId[]              (already present in AtlasAI)
//   Region.poly: [[x,y]…]                      // NEW — polygon points
//   Region.biome: string                       // NEW — biome/territory tag
//   Region.color: string                       // NEW — fill colour
//   Atlas.basemapMode: 'real' | 'parchment'    // NEW — per-project setting
// ───────────────────────────────────────────────────────────────────────────
function AB_Atlas() {
  const [mode, setMode] = uS5('parchment');
  const [chapter, setChapter] = uS5(4);
  const [selected, setSelected] = uS5('riverside'); // place id
  return (
    <div style={{ background: T5.bg, color: T5.ink, minHeight: '100%' }}>
      <div style={{
        padding: '14px 22px', borderBottom: `1px solid ${T5.rule}`, background: T5.sidebar,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <Mono color={T5.accent}>ROOM · ATLAS · V2</Mono>
        <span style={{ flex: 1 }} />
        <div style={{ display: 'flex', border: `1px solid ${T5.rule}`, borderRadius: 2, overflow: 'hidden' }}>
          {['real', 'parchment'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '6px 12px', border: 'none', cursor: 'pointer',
              background: mode === m ? T5.accent : 'transparent', color: mode === m ? T5.paper2 : T5.ink2,
              fontFamily: T5.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
            }}>{m === 'real' ? 'CONTEMPORARY' : 'PARCHMENT'}</button>
          ))}
        </div>
        <Mono color={T5.ink3}>RIGHT-CLICK MAP · CREATE  •  LEFT-CLICK · MANIPULATE</Mono>
        <button style={{ width: 26, height: 26, borderRadius: 999, border: `1px solid ${T5.rule}`, background: 'transparent', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          <I d={ICONS.pin} size={12} color={T5.ink3} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 0, minHeight: 460 }}>
        {/* Map */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: mode === 'parchment'
            ? 'radial-gradient(ellipse at 30% 30%, #efe3c2 0%, #e6d6a8 60%, #d4c08a 100%)'
            : 'radial-gradient(ellipse at 50% 40%, #e8eef0 0%, #cdd6dc 70%)',
        }}>
          {/* Texture / contour */}
          {mode === 'parchment' && (
            <svg style={{ position: 'absolute', inset: 0, opacity: 0.35 }} viewBox="0 0 800 460" preserveAspectRatio="none">
              {Array.from({ length: 22 }, (_, i) =>
                <path key={i} d={`M0 ${i * 22 + (i%3)*4} Q400 ${i * 22 + 12} 800 ${i * 22 - 4}`}
                  fill="none" stroke="#8a7048" strokeWidth="0.4" />)}
            </svg>
          )}

          {/* Region polygon */}
          <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 800 460" preserveAspectRatio="none">
            <polygon points="120,140 260,90 380,120 360,240 240,280 140,230"
              fill={mode === 'parchment' ? 'rgba(180, 130, 60, 0.16)' : 'rgba(72, 130, 180, 0.16)'}
              stroke={T5.accent2} strokeWidth="1.2" strokeDasharray="3 4" />
            <text x="200" y="180" fill={T5.ink2} fontFamily={T5.mono} fontSize="9" letterSpacing="2">
              CARROW LANDS
            </text>

            {/* Tom path — solid up to ch.4, dashed prior */}
            <path d="M180 180 L240 220 L320 200" fill="none" stroke={T5.accent}
              strokeWidth="2" strokeDasharray="3 4" />
            <path d="M320 200 L420 260 L500 300 L560 340" fill="none" stroke={T5.accent}
              strokeWidth="2.5" />
            {/* Iris path */}
            <path d="M420 100 L480 160 L520 220 L560 340" fill="none" stroke={T5.accent2}
              strokeWidth="2.5" />
            {/* Intersection ring */}
            <circle cx="560" cy="340" r="14" fill="none" stroke={T5.warn} strokeWidth="1.5" />
            <circle cx="560" cy="340" r="22" fill="none" stroke={T5.warn} strokeWidth="1" strokeDasharray="2 3" />
          </svg>

          {/* Pins */}
          <Pin x={180} y={180} label="Carrow Mill" sub="ch. 01" tone={T5.accent} />
          <Pin x={320} y={200} label="The Crossing" sub="ch. 02–03" tone={T5.accent} />
          <Pin x={420} y={100} label="Vell House" sub="ch. 02" tone={T5.accent2} />
          <Pin x={560} y={340} label="Riverside" sub="CH. 04 · NOW" tone={T5.warn} active />
          <Pin x={680} y={400} label="Millhouse" sub="future" tone={T5.ink3} ghost />

          {/* Right-click context menu — illustrative */}
          <div style={{
            position: 'absolute', left: 410, top: 170, width: 220,
            background: T5.paper2, border: `1px solid ${T5.rule}`, borderRadius: T5.radius,
            padding: 6, boxShadow: '0 14px 44px rgba(60, 50, 30, 0.22)', zIndex: 10,
          }}>
            <Mono color={T5.ink3} style={{ padding: '4px 8px' }}>RIGHT-CLICK MENU</Mono>
            {[
              ['＋ Add place here', T5.ink, ICONS.pin],
              ['◇ Draw region (polygon)', T5.ink, ICONS.layers],
              ['→ Draw road / route', T5.ink, ICONS.thread],
              ['T  Drop label', T5.ink, ICONS.flag],
              ['—', null, null],
              ['↔  Measure distance', T5.ink, ICONS.zZ],
              ['◎ Set as Tom\'s ch.04 location', T5.accent, ICONS.user],
              ['—', null, null],
              ['✦ Suggest places nearby', T5.accent, ICONS.sparkle],
            ].map((row, i) => row[0] === '—' ? (
              <div key={i} style={{ height: 1, background: T5.rule, margin: '3px 4px' }} />
            ) : (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', fontSize: 11, color: row[1], cursor: 'pointer', borderRadius: 2, fontFamily: T5.font }}>
                <I d={row[2]} size={11} color={row[1]} />
                {row[0]}
              </div>
            ))}
          </div>

          {/* Coordinates / scale / cursor mode */}
          <div style={{ position: 'absolute', bottom: 12, left: 14, display: 'flex', gap: 12 }}>
            <Mono color={T5.ink3}>SCALE · 1:48000</Mono>
            <Mono color={T5.ink3}>CURSOR · MANIPULATE</Mono>
          </div>
          <div style={{ position: 'absolute', top: 12, right: 14, display: 'flex', gap: 6 }}>
            <Pill tone="accent">TOM</Pill>
            <Pill tone="accent2">IRIS</Pill>
            <Pill tone="warn">CROSSED PATHS · 1</Pill>
          </div>
        </div>

        {/* Sidebar — selection-aware + tool palette */}
        <div style={{ borderLeft: `1px solid ${T5.rule}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Mono color={T5.accent}>FOLLOWING SEL · TOM + IRIS</Mono>

          {/* Tool palette — companion to right-click menu */}
          <div style={{ padding: 10, background: T5.paper, border: `1px solid ${T5.rule}`, borderRadius: T5.radius }}>
            <Mono color={T5.ink3}>TOOLS · same as right-click</Mono>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 6 }}>
              {[
                ['PIN', ICONS.pin, true],
                ['REGION', ICONS.layers, false],
                ['ROAD', ICONS.thread, false],
                ['LABEL', ICONS.flag, false],
                ['MEASURE', ICONS.zZ, false],
                ['LASSO', ICONS.search, false],
              ].map(([n, ic, on]) => (
                <button key={n} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px',
                  background: on ? T5.accentSoft : T5.paper2,
                  border: `1px solid ${on ? T5.accent : T5.rule}`, borderRadius: T5.radius,
                  cursor: 'pointer', fontFamily: T5.mono, fontSize: 9, letterSpacing: 0.12, color: on ? T5.accent : T5.ink2,
                }}>
                  <I d={ic} size={10} color={on ? T5.accent : T5.ink2} /> {n}
                </button>
              ))}
            </div>
          </div>

          <Frame kicker="INTERSECTION" title="Riverside · ch.04">
            <div style={{ fontSize: 12, color: T5.ink2, lineHeight: 1.6 }}>
              Tom and Iris are at the same place <strong style={{ color: T5.warn }}>at the same chapter</strong> — a
              real meeting, not a geometric crossing.
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <Btn size="sm">DOSSIER → IRIS</Btn>
              <Btn size="sm" variant="ghost">SUGGEST BEAT</Btn>
            </div>
          </Frame>
        </div>
      </div>

      {/* EDIT PANE BELOW MAP — the requested feature */}
      <div style={{ borderTop: `1px solid ${T5.rule}`, background: T5.paper, padding: '14px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <Mono color={T5.accent}>EDITING · RIVERSIDE</Mono>
          <Pill tone="warn">SELECTED ON MAP</Pill>
          <span style={{ flex: 1 }} />
          <Btn size="sm" variant="ghost"><I d={ICONS.x} size={10} color={T5.ink3} /> CLOSE</Btn>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          <EditField label="NAME" value="Riverside" />
          <EditField label="TYPE" value="SETTLEMENT" />
          <EditField label="COORDS" value="x:560 y:340" />
          <EditField label="REGION" value="CARROW LANDS" />
          <EditField label="POPULATION" value="≈ 240" />
        </div>
        <div style={{ marginTop: 10 }}>
          <Mono color={T5.ink3}>PRESENT IN CHAPTERS</Mono>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(c => {
              const has = [4, 5, 7].includes(c);
              return (
                <button key={c} style={{
                  width: 30, height: 22, border: `1px solid ${has ? T5.accent : T5.rule}`,
                  background: has ? T5.accentSoft : T5.paper2, color: has ? T5.accent : T5.ink3,
                  fontFamily: T5.mono, fontSize: 9, letterSpacing: 0.1, cursor: 'pointer', borderRadius: 1,
                }}>{String(c).padStart(2, '0')}</button>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <Mono color={T5.ink3}>NOTES</Mono>
          <div style={{ marginTop: 4, padding: 10, background: T5.paper2, border: `1px solid ${T5.rule}`, borderRadius: T5.radius, fontFamily: T5.display, fontSize: 13, color: T5.ink, lineHeight: 1.55 }}>
            A muddy bend where the canal meets the old course. Iris waits here in ch.04. The watch
            slips into the reeds.
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Btn variant="primary">SAVE PLACE</Btn>
          <Btn>+ ADD PROPERTY</Btn>
          <Btn variant="ghost"><I d={ICONS.link} size={10} color={T5.ink2} /> LINK TO REGION</Btn>
          <span style={{ flex: 1 }} />
          <Btn variant="ghost"><I d={ICONS.x} size={10} color={T5.bad} /> REMOVE PLACE</Btn>
        </div>
      </div>

      {/* Timeline scrubber */}
      <div style={{ padding: '10px 22px', borderTop: `1px solid ${T5.rule}`, background: T5.sidebar }}>
        <Mono color={T5.ink3}>TIMELINE — drag to extend / retract paths</Mono>
        <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(c => {
            const isCurrent = c === chapter;
            const has = c <= 4;
            return (
              <button key={c} onClick={() => setChapter(c)} style={{
                flex: 1, height: 24, padding: 0, border: `1px solid ${isCurrent ? T5.accent : T5.rule}`,
                background: isCurrent ? T5.accent : has ? T5.accentSoft : T5.paper2,
                color: isCurrent ? T5.paper2 : T5.ink2, cursor: 'pointer',
                fontFamily: T5.mono, fontSize: 9, letterSpacing: 0.1, borderRadius: 1,
              }}>{String(c).padStart(2, '0')}</button>
            );
          })}
        </div>
      </div>

      <Note style={{ bottom: 250, right: -250, width: 230 }}>
        Reuse <b>UKMapVisualization</b> + <b>AtlasAI</b>. Right-click ⇒ creation menu, left-click ⇒
        drag/manipulate, edit pane below ⇒ no modals. Travel lines need
        <b> character.locationByChapter</b>.
      </Note>
    </div>
  );
}

function EditField({ label, value }) {
  return (
    <div>
      <Mono color={T5.ink3}>{label}</Mono>
      <div style={{
        marginTop: 4, padding: '8px 10px', background: T5.paper2, border: `1px solid ${T5.rule}`,
        borderRadius: T5.radius, fontFamily: T5.display, fontSize: 13, color: T5.ink,
      }}>{value}</div>
    </div>
  );
}

function Pin({ x, y, label, sub, tone, active, ghost }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: 'translate(-50%, -100%)',
      pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    }}>
      <div style={{
        width: active ? 14 : 10, height: active ? 14 : 10, borderRadius: 999,
        background: ghost ? 'transparent' : tone, border: `2px solid ${tone}`,
        boxShadow: active ? `0 0 0 6px ${tone}33` : 'none',
      }} />
      <div style={{
        background: T5.paper2, border: `1px solid ${T5.rule}`, padding: '3px 7px', borderRadius: 2,
        marginTop: 4,
      }}>
        <div style={{ fontFamily: T5.display, fontSize: 11, color: T5.ink, lineHeight: 1 }}>{label}</div>
        <div style={{ fontFamily: T5.mono, fontSize: 8, color: tone, letterSpacing: 0.12, textTransform: 'uppercase', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

window.AB_Atlas = AB_Atlas;

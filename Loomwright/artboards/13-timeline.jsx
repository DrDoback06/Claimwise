/* global React, Mono, Pill, Btn, I, ICONS, Mono2, Frame, Note */
const T13 = window.LW;

// ───────────────────────────────────────────────────────────────────────────
// Artboard 13 — Timeline / pacing view
//
// ── For Claude Code ──
// Two stacked tracks across a chapter axis:
//   1. STORY TIME — when scenes happen IN-WORLD (dawn / day / dusk / night)
//   2. WRITING TIME — when scenes were drafted (calendar) and word-count weight
//
// Plus rows:
//   • POV swimlanes — coloured strips per POV character
//   • TENSION line — author-rated 0–5 per scene, drawn as area chart
//   • EVENTS — pinned moments (deaths, reveals)
//
// Pacing view exists to catch:
//   • a chapter that's all dawn (tonal flatness)
//   • a POV that disappears for 3 chapters
//   • a reveal too early or too late
//
// Maps to: NEW src/loomwright/timeline/Timeline.jsx — reads
// Scene.sceneTimeRel, Scene.povCharacterId, Scene.tensionRating, ChapterEvent[].
// ───────────────────────────────────────────────────────────────────────────
function AB_Timeline() {
  const chapters = [
    { n: '01', title: 'The Forge',          words: 3200, time: 'dusk',  pov: 'tom',   tension: 1 },
    { n: '02', title: 'A Wheel Returns',    words: 2800, time: 'day',   pov: 'tom',   tension: 2 },
    { n: '03', title: 'Iris in the Lane',   words: 3600, time: 'night', pov: 'tom',   tension: 3 },
    { n: '04', title: 'The Ferry',          words: 4100, time: 'dawn',  pov: 'tom',   tension: 2 },
    { n: '05', title: 'Bargemen at Dusk',   words: 3300, time: 'dusk',  pov: 'iris',  tension: 4 },
    { n: '06', title: 'The Old Tongue',     words: 1847, time: 'dawn',  pov: 'tom',   tension: 3, current: true },
    { n: '07', title: 'What the Stones Say',words: 0,    time: '—',     pov: '—',     tension: 0, draft: true },
    { n: '08', title: '(unwritten)',        words: 0,    time: '—',     pov: '—',     tension: 0, empty: true },
  ];
  const povs = { tom: { name: 'Tom Carrow', c: T13.accent }, iris: { name: 'Iris Vell', c: T13.accent2 }, marris: { name: 'Marris', c: T13.rarityRare } };
  const events = [
    { ch: 1, label: 'old Carrow dies', tone: 'bad' },
    { ch: 4, label: 'Tom finds the mark', tone: 'good' },
    { ch: 5, label: 'Iris breaks down', tone: 'warn' },
    { ch: 6, label: 'Old Tongue revealed', tone: 'accent' },
  ];
  const W = 1200;
  const PAD = 30;
  const colW = (W - PAD * 2) / chapters.length;
  const x = i => PAD + i * colW + colW / 2;

  return (
    <div style={{ background: T13.bg, color: T13.ink, padding: 22 }}>
      <Mono color={T13.accent}>13 · TIMELINE / PACING</Mono>
      <h2 style={{ fontFamily: T13.display, fontSize: 22, color: T13.ink, fontWeight: 500, margin: '4px 0 4px' }}>
        Pacing of the manuscript so far
      </h2>
      <div style={{ fontSize: 12, color: T13.ink2, marginBottom: 16, lineHeight: 1.55, maxWidth: 760 }}>
        Two stacked tracks (story-time vs writing-time), POV swimlanes, tension curve,
        and pinned events. Use this to spot tonal flatness, missing POVs, or a reveal
        that's landed too early.
      </div>

      <div style={{ background: T13.paper, border: `1px solid ${T13.rule}`, borderRadius: T13.radius, padding: '20px 0' }}>
        <svg viewBox={`0 0 ${W} 540`} style={{ width: '100%', display: 'block' }}>
          {/* chapter columns + headers */}
          {chapters.map((c, i) => (
            <g key={i}>
              <rect x={PAD + i * colW} y={0} width={colW} height={540}
                fill={c.current ? T13.accentSoft : 'transparent'}
                stroke={i < chapters.length - 1 ? T13.rule : 'transparent'} strokeWidth={1} strokeDasharray={c.empty ? '4 3' : ''} />
              <text x={x(i)} y={20} textAnchor="middle" fontFamily={T13.mono} fontSize="9" fill={c.current ? T13.accent : T13.ink3} letterSpacing="0.16em">CH.{c.n}</text>
              <text x={x(i)} y={36} textAnchor="middle" fontFamily={T13.display} fontSize="11" fill={c.empty ? T13.ink3 : T13.ink} fontStyle={c.empty ? 'italic' : 'normal'}>{c.title.length > 14 ? c.title.slice(0, 13) + '…' : c.title}</text>
            </g>
          ))}

          {/* TRACK 1 — STORY TIME (dawn/day/dusk/night) */}
          <g transform="translate(0, 70)">
            <text x={PAD - 6} y={14} textAnchor="end" fontFamily={T13.mono} fontSize="9" fill={T13.ink3} letterSpacing="0.16em">STORY-TIME</text>
            {['dawn', 'day', 'dusk', 'night'].map((label, ri) => (
              <g key={label}>
                <line x1={PAD} y1={20 + ri * 14} x2={W - PAD} y2={20 + ri * 14} stroke={T13.rule} strokeWidth={0.5} />
                <text x={PAD - 6} y={24 + ri * 14} textAnchor="end" fontFamily={T13.mono} fontSize="8" fill={T13.ink3}>{label.toUpperCase()}</text>
              </g>
            ))}
            {chapters.map((c, i) => {
              const row = ['dawn', 'day', 'dusk', 'night'].indexOf(c.time);
              if (row < 0) return null;
              return <circle key={i} cx={x(i)} cy={20 + row * 14} r={6} fill={c.current ? T13.accent : T13.ink} />;
            })}
          </g>

          {/* TRACK 2 — POV swimlanes */}
          <g transform="translate(0, 160)">
            <text x={PAD - 6} y={14} textAnchor="end" fontFamily={T13.mono} fontSize="9" fill={T13.ink3} letterSpacing="0.16em">POV</text>
            {Object.entries(povs).map(([id, p], ri) => (
              <g key={id}>
                <text x={PAD - 6} y={36 + ri * 22} textAnchor="end" fontFamily={T13.mono} fontSize="8" fill={p.c}>{p.name.toUpperCase().slice(0, 6)}</text>
                <line x1={PAD} y1={32 + ri * 22} x2={W - PAD} y2={32 + ri * 22} stroke={T13.rule} strokeWidth={0.5} strokeDasharray="2 3" />
                {chapters.map((c, i) => {
                  if (c.pov !== id) return null;
                  return <rect key={i} x={PAD + i * colW + 4} y={26 + ri * 22} width={colW - 8} height={12} fill={p.c} opacity={c.current ? 1 : 0.7} rx={2} />;
                })}
              </g>
            ))}
          </g>

          {/* TRACK 3 — TENSION area chart */}
          <g transform="translate(0, 250)">
            <text x={PAD - 6} y={14} textAnchor="end" fontFamily={T13.mono} fontSize="9" fill={T13.ink3} letterSpacing="0.16em">TENSION</text>
            <line x1={PAD} y1={70} x2={W - PAD} y2={70} stroke={T13.rule} strokeWidth={0.5} />
            <line x1={PAD} y1={20} x2={W - PAD} y2={20} stroke={T13.rule} strokeWidth={0.5} strokeDasharray="2 3" />
            {/* area path */}
            <path d={`M ${x(0)} 70 ${chapters.map((c, i) => `L ${x(i)} ${70 - c.tension * 10}`).join(' ')} L ${x(chapters.length - 1)} 70 Z`}
              fill={T13.accent} opacity={0.18} />
            <path d={`M ${chapters.map((c, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${70 - c.tension * 10}`).join(' ')}`}
              fill="none" stroke={T13.accent} strokeWidth={1.5} />
            {chapters.map((c, i) => c.tension > 0 && (
              <g key={i}>
                <circle cx={x(i)} cy={70 - c.tension * 10} r={3} fill={T13.paper} stroke={T13.accent} strokeWidth={1.5} />
                <text x={x(i)} y={70 - c.tension * 10 - 6} textAnchor="middle" fontFamily={T13.mono} fontSize="8" fill={T13.ink2}>{c.tension}</text>
              </g>
            ))}
          </g>

          {/* TRACK 4 — word counts as bars */}
          <g transform="translate(0, 350)">
            <text x={PAD - 6} y={14} textAnchor="end" fontFamily={T13.mono} fontSize="9" fill={T13.ink3} letterSpacing="0.16em">WORDS</text>
            <line x1={PAD} y1={70} x2={W - PAD} y2={70} stroke={T13.rule} strokeWidth={0.5} />
            {chapters.map((c, i) => {
              const h = (c.words / 4500) * 60;
              return (
                <g key={i}>
                  <rect x={PAD + i * colW + colW * 0.25} y={70 - h} width={colW * 0.5} height={h}
                    fill={c.draft ? 'transparent' : (c.current ? T13.accent : T13.ink2)}
                    stroke={c.draft ? T13.rule : 'transparent'} strokeDasharray={c.draft ? '2 2' : ''} />
                  {c.words > 0 && <text x={x(i)} y={70 - h - 4} textAnchor="middle" fontFamily={T13.mono} fontSize="8" fill={T13.ink2}>{(c.words / 1000).toFixed(1)}k</text>}
                </g>
              );
            })}
          </g>

          {/* TRACK 5 — events */}
          <g transform="translate(0, 450)">
            <text x={PAD - 6} y={14} textAnchor="end" fontFamily={T13.mono} fontSize="9" fill={T13.ink3} letterSpacing="0.16em">EVENTS</text>
            <line x1={PAD} y1={32} x2={W - PAD} y2={32} stroke={T13.rule} strokeWidth={1} />
            {events.map((e, i) => {
              const xc = x(e.ch - 1);
              const c = e.tone === 'bad' ? T13.bad : e.tone === 'warn' ? T13.warn : e.tone === 'good' ? T13.good : T13.accent;
              return (
                <g key={i}>
                  <circle cx={xc} cy={32} r={5} fill={T13.paper} stroke={c} strokeWidth={2} />
                  <line x1={xc} y1={32} x2={xc} y2={50 + (i % 2) * 14} stroke={c} strokeWidth={0.5} strokeDasharray="2 2" />
                  <text x={xc} y={62 + (i % 2) * 14} textAnchor="middle" fontFamily={T13.display} fontSize="10" fontStyle="italic" fill={T13.ink}>{e.label}</text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Diagnostics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
        <Frame kicker="DIAGNOSTICS" title="Tonal flatness" style={{ borderColor: T13.warn + '55' }}>
          <div style={{ fontSize: 12, color: T13.ink2, lineHeight: 1.55 }}>
            Three of last four chapters at <strong>dawn/dusk</strong>. Consider a midday or
            night scene to break the pattern.
          </div>
        </Frame>
        <Frame kicker="DIAGNOSTICS" title="Missing POV" style={{ borderColor: T13.warn + '55' }}>
          <div style={{ fontSize: 12, color: T13.ink2, lineHeight: 1.55 }}>
            <strong>Iris</strong> last had POV in <em>ch.05</em>. She's now offscreen for 2 chapters
            — consider a return before ch.08.
          </div>
        </Frame>
        <Frame kicker="DIAGNOSTICS" title="Tension shape">
          <div style={{ fontSize: 12, color: T13.ink2, lineHeight: 1.55 }}>
            Curve peaks at <strong>ch.05 (4)</strong>, dips at <strong>ch.06</strong>. Healthy
            breathing — keep it.
          </div>
        </Frame>
      </div>
    </div>
  );
}

window.AB_Timeline = AB_Timeline;

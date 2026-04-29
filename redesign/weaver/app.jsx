// weaver-app.jsx — Canon Weaver: the mass-integration engine.
// Flow: capture idea → analyzing → review proposed edits → apply.

const SYSTEM_COLORS = {
  World:    'oklch(72% 0.10 200)',
  Cast:     'oklch(72% 0.13 30)',
  Plot:     'oklch(68% 0.16 22)',
  Timeline: 'oklch(70% 0.13 280)',
  Atlas:    'oklch(72% 0.13 145)',
  Chapter:  'oklch(78% 0.13 78)',
};
const SYSTEM_ICON = { World: 'globe', Cast: 'users', Plot: 'flag', Timeline: 'clock', Atlas: 'map', Chapter: 'pen' };

function WeaverApp() {
  const t = useTheme();
  const [stage, setStage] = React.useState('hub'); // hub | capturing | analyzing | review | applied
  const [idea, setIdea] = React.useState('');
  const [decisions, setDecisions] = React.useState({}); // id -> 'accept' | 'reject' | 'edit'
  const [selectedEdit, setSelectedEdit] = React.useState(null);

  const startExample = () => {
    setIdea(WEAVER.EXAMPLE.idea);
    setStage('analyzing');
    // Seed all accepted by default
    const seed = {};
    WEAVER.EXAMPLE.edits.forEach(e => { seed[e.id] = 'accept'; });
    setDecisions(seed);
    setSelectedEdit(WEAVER.EXAMPLE.edits[0].id);
    setTimeout(() => setStage('review'), 2400);
  };

  const apply = () => {
    setStage('applied');
    setTimeout(() => setStage('hub'), 2500);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: t.bg, color: t.ink, fontFamily: t.font }}>
      <WeaverSidebar stage={stage} setStage={setStage} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <WeaverTopbar stage={stage} />
        {stage === 'hub' && <WeaverHub onStartExample={startExample} setIdea={setIdea} setStage={setStage} />}
        {stage === 'capturing' && <WeaverCapture idea={idea} setIdea={setIdea} onSubmit={() => { setStage('analyzing'); const seed = {}; WEAVER.EXAMPLE.edits.forEach(e => { seed[e.id] = 'accept'; }); setDecisions(seed); setSelectedEdit(WEAVER.EXAMPLE.edits[0].id); setTimeout(() => setStage('review'), 2400); }} />}
        {stage === 'analyzing' && <WeaverAnalyzing idea={idea} />}
        {stage === 'review' && <WeaverReview idea={idea} decisions={decisions} setDecisions={setDecisions} selectedEdit={selectedEdit} setSelectedEdit={setSelectedEdit} onApply={apply} onCancel={() => setStage('hub')} />}
        {stage === 'applied' && <WeaverApplied decisions={decisions} />}
      </main>
    </div>
  );
}

// ─── Sidebar & Topbar ───────────────────────────────────────────────────────
function WeaverSidebar({ stage, setStage }) {
  const t = useTheme();
  return (
    <aside style={{ width: 220, background: t.sidebar, borderRight: `1px solid ${t.rule}`, padding: '20px 14px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: `1px solid ${t.rule}`, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 15, borderRadius: 2 }}>L<span style={{ fontSize: 13, opacity: 0.6 }}>w</span></div>
        <div>
          <div style={{ fontFamily: t.display, fontWeight: 500, fontSize: 16, lineHeight: 1, color: t.ink }}>Loomwright</div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 2 }}>Canon Weaver</div>
        </div>
      </div>

      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>Current book</div>
      <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, marginBottom: 4 }}>{WEAVER.BOOK.name}</div>
      <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, marginBottom: 20 }}>Ch.{WEAVER.BOOK.currentChapter} of {WEAVER.BOOK.totalChapters} · Book II</div>

      <button onClick={() => setStage('capturing')} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        background: t.accent, color: t.onAccent,
        border: 'none', borderRadius: t.radius,
        fontFamily: t.display, fontWeight: 500, fontSize: 14,
        cursor: 'pointer', marginBottom: 20,
      }}><Icon name="sparkle" size={14} color={t.onAccent} /> New weave</button>

      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>Recent weaves</div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {WEAVER.HISTORY.map(h => (
          <div key={h.id} style={{ padding: '8px 10px', marginBottom: 4, borderRadius: t.radius, background: t.paper, border: `1px solid ${t.rule}`, cursor: 'pointer' }}>
            <div style={{ fontSize: 11, color: t.ink, lineHeight: 1.35 }}>{h.title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.08 }}>
              <span style={{ color: t.ink3 }}>{h.when}</span>
              <span style={{ color: h.status === 'accepted' ? t.good : '#c88080' }}>{h.accepted}/{h.touched} {h.status === 'accepted' ? '✓' : '✕'}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${t.rule}`, fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>WEAVES THIS WEEK</span><span style={{ color: t.ink2 }}>7</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}><span>EDITS APPLIED</span><span style={{ color: t.ink2 }}>62</span></div>
      </div>
    </aside>
  );
}

function WeaverTopbar({ stage }) {
  const t = useTheme();
  const steps = [
    { id: 'hub', label: 'Idea' },
    { id: 'capturing', label: 'Capture' },
    { id: 'analyzing', label: 'Analyze' },
    { id: 'review', label: 'Review' },
    { id: 'applied', label: 'Weaved' },
  ];
  const curIdx = steps.findIndex(s => s.id === stage);
  return (
    <div style={{ padding: '14px 32px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 22 }}>
      {steps.map((s, i) => {
        const active = i === curIdx;
        const done = i < curIdx;
        return (
          <React.Fragment key={s.id}>
            {i > 0 && <div style={{ width: 16, height: 1, background: done ? t.accent : t.rule }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 18, height: 18, borderRadius: 2,
                display: 'grid', placeItems: 'center',
                background: active ? t.accent : (done ? t.accent : t.paper),
                border: `1px solid ${active || done ? t.accent : t.rule}`,
                color: (active || done) ? t.onAccent : t.ink3,
                fontFamily: t.mono, fontSize: 10, fontWeight: 600,
              }}>{done ? '✓' : i + 1}</div>
              <span style={{ fontFamily: t.mono, fontSize: 10, color: active ? t.accent : t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>{s.label}</span>
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <ThemeToggle />
      </div>
    </div>
  );
}

// ─── Stage 1: Hub ───────────────────────────────────────────────────────────
function WeaverHub({ onStartExample, setIdea, setStage }) {
  const t = useTheme();
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, letterSpacing: 0.16, color: t.accent, textTransform: 'uppercase' }}>The mass-integration engine</div>
        <h1 style={{ fontFamily: t.display, fontSize: 54, fontWeight: 400, letterSpacing: -0.025, margin: '6px 0 14px', lineHeight: 1.02, color: t.ink }}>
          Have an idea.<br /><em style={{ color: t.accent }}>Let it find its place.</em>
        </h1>
        <p style={{ fontSize: 16, color: t.ink2, lineHeight: 1.6, maxWidth: '55ch', margin: 0 }}>
          Type a thought — a new character, a cursed artefact, a relationship you wish you’d planted earlier, a plot thread that should’ve existed from chapter one. The Loom reads every chapter, every entry, every pin on the map, and proposes exactly where this belongs and how to weave it in. You review. Accept, edit, or reject each edit. The canon stays coherent.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '32px 0 12px' }}>
          {[
            { k: 'Cross-system', v: 'Chapters, cast, world, plot, timeline, atlas — all at once.' },
            { k: 'Consent-first', v: 'Nothing changes without your yes. Everything undoable.' },
            { k: 'Voice-matched', v: 'AI proposals written in your style, at low intrusion.' },
          ].map(f => (
            <div key={f.k} style={{ padding: 14, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.12, textTransform: 'uppercase' }}>{f.k}</div>
              <div style={{ fontSize: 12, color: t.ink2, marginTop: 4, lineHeight: 1.5 }}>{f.v}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28, padding: 22, background: t.paper, border: `1px solid ${t.accent}`, borderRadius: t.radius }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>Try a live example</div>
          <div style={{ fontFamily: t.display, fontSize: 20, fontWeight: 500, marginTop: 6, color: t.ink, lineHeight: 1.4 }}>
            "A cursed dagger — The Whistling Knife. Passed down in House Maelgwyn. Mira picks it up at Westmark."
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={onStartExample} style={{
              padding: '10px 18px', background: t.accent, color: t.onAccent,
              border: 'none', borderRadius: t.radius,
              fontFamily: t.display, fontWeight: 500, fontSize: 14, cursor: 'pointer',
            }}>Weave this idea →</button>
            <button onClick={() => setStage('capturing')} style={{
              padding: '10px 18px', background: 'transparent', color: t.ink2,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.display, fontWeight: 500, fontSize: 14, cursor: 'pointer',
            }}>Write my own</button>
          </div>
        </div>

        <div style={{ marginTop: 40 }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, letterSpacing: 0.16, color: t.ink3, textTransform: 'uppercase', marginBottom: 10 }}>How it works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { n: '1', t: 'Capture', b: 'Type, dictate, or paste a note. One sentence or a paragraph.' },
              { n: '2', t: 'Analyze', b: 'The Loom reads everything and proposes edits across systems.' },
              { n: '3', t: 'Review', b: 'Every proposed edit, with reasoning. Accept, edit, or reject.' },
              { n: '4', t: 'Weave', b: 'Applied atomically. Fully undoable. History kept.' },
            ].map(s => (
              <div key={s.n} style={{ padding: 14, background: t.paper2, borderRadius: t.radius }}>
                <div style={{ fontFamily: t.display, fontSize: 28, fontStyle: 'italic', color: t.accent, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: t.display, fontSize: 16, fontWeight: 500, marginTop: 6, color: t.ink }}>{s.t}</div>
                <div style={{ fontSize: 12, color: t.ink2, marginTop: 4, lineHeight: 1.5 }}>{s.b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stage 2: Capture ───────────────────────────────────────────────────────
function WeaverCapture({ idea, setIdea, onSubmit }) {
  const t = useTheme();
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, letterSpacing: 0.16, color: t.accent, textTransform: 'uppercase' }}>Capture</div>
        <h1 style={{ fontFamily: t.display, fontSize: 40, fontWeight: 400, letterSpacing: -0.02, margin: '4px 0 14px', lineHeight: 1.05, color: t.ink }}>What's on your mind?</h1>
        <p style={{ fontSize: 14, color: t.ink2, margin: '0 0 18px' }}>Character, item, event, contradiction, new scene — whatever. Plain English. The more context, the smarter the weave.</p>

        <textarea
          value={idea}
          onChange={e => setIdea(e.target.value)}
          placeholder="A cursed dagger..."
          autoFocus
          style={{
            width: '100%', minHeight: 180, padding: 20,
            background: t.paper, color: t.ink,
            border: `1px solid ${t.rule}`, borderRadius: t.radius,
            fontFamily: t.display, fontSize: 20, lineHeight: 1.5,
            resize: 'vertical', outline: 'none',
          }}
          onFocus={e => e.currentTarget.style.borderColor = t.accent}
          onBlur={e => e.currentTarget.style.borderColor = t.rule}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {['Quick · few chapters', 'Thorough · whole book', 'Series-wide'].map((l, i) => (
            <button key={l} style={{
              padding: '6px 12px', background: i === 1 ? t.accent + '20' : t.paper, color: i === 1 ? t.accent : t.ink2,
              border: `1px solid ${i === 1 ? t.accent : t.rule}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer',
            }}>{l}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button style={{
            padding: '6px 12px', background: 'transparent', color: t.ink3,
            border: `1px solid ${t.rule}`, borderRadius: t.radius,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>🎙 Dictate</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1 }}>{idea.trim().split(/\s+/).filter(Boolean).length} words · ready to weave</div>
          <button onClick={onSubmit} disabled={idea.trim().length < 5} style={{
            padding: '10px 20px',
            background: idea.trim().length < 5 ? t.rule : t.accent, color: t.onAccent,
            border: 'none', borderRadius: t.radius,
            fontFamily: t.display, fontWeight: 500, fontSize: 14,
            cursor: idea.trim().length < 5 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}><Icon name="sparkle" size={14} /> Weave →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Stage 3: Analyzing ─────────────────────────────────────────────────────
function WeaverAnalyzing({ idea }) {
  const t = useTheme();
  const phases = [
    { label: 'Reading all 14 chapters', t: 600 },
    { label: 'Scanning cast of 23', t: 1000 },
    { label: 'Scanning 47 world entries', t: 1400 },
    { label: 'Mapping against 7 threads', t: 1800 },
    { label: 'Weaving proposals', t: 2200 },
  ];
  const [currentPhase, setCurrentPhase] = React.useState(0);

  React.useEffect(() => {
    phases.forEach((p, i) => {
      setTimeout(() => setCurrentPhase(i + 1), p.t);
    });
  }, []);

  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 40 }}>
      <div style={{ maxWidth: 560, textAlign: 'center' }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, letterSpacing: 0.16, color: t.accent, textTransform: 'uppercase' }}>Analyzing</div>
        <h1 style={{ fontFamily: t.display, fontSize: 38, fontWeight: 400, letterSpacing: -0.02, margin: '8px 0 18px', lineHeight: 1.1, color: t.ink }}>
          The Loom is reading<br /><em style={{ color: t.accent }}>your book.</em>
        </h1>
        <div style={{ background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius, padding: 18, marginBottom: 22, fontFamily: t.display, fontSize: 16, color: t.ink2, fontStyle: 'italic', lineHeight: 1.5 }}>
          "{idea}"
        </div>
        <div style={{ textAlign: 'left', background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius, padding: 16 }}>
          {phases.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontFamily: t.mono, fontSize: 11 }}>
              <div style={{ width: 16, height: 16, borderRadius: 2, display: 'grid', placeItems: 'center',
                background: i < currentPhase ? t.accent : (i === currentPhase ? t.accentSoft : 'transparent'),
                border: `1px solid ${i <= currentPhase ? t.accent : t.rule}`,
                color: i < currentPhase ? t.onAccent : t.accent,
                fontSize: 10,
              }}>{i < currentPhase ? '✓' : (i === currentPhase ? <span className="pulse">·</span> : '')}</div>
              <span style={{ color: i <= currentPhase ? t.ink : t.ink3, letterSpacing: 0.1 }}>{p.label}</span>
              {i === currentPhase && <span style={{ marginLeft: 'auto', color: t.ink3, fontSize: 10 }}>…</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.WeaverApp = WeaverApp;
window.SYSTEM_COLORS = SYSTEM_COLORS;
window.SYSTEM_ICON = SYSTEM_ICON;

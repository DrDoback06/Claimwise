// voice-modes.jsx — A/B compare, chapter assignment, teach-from-sample.

function VoiceCompare({ leftId, rightId, setRightId }) {
  const t = useTheme();
  const left = VOICE.PROFILES.find(p => p.id === leftId);
  const right = VOICE.PROFILES.find(p => p.id === (rightId || (VOICE.PROFILES.find(p => p.id !== leftId).id)));

  React.useEffect(() => {
    if (!rightId) setRightId(VOICE.PROFILES.find(p => p.id !== leftId).id);
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '20px 28px 10px' }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase' }}>A / B compare</div>
        <h2 style={{ fontFamily: t.display, fontSize: 26, fontWeight: 500, letterSpacing: -0.015, margin: '4px 0 6px', color: t.ink }}>Same text. Two voices. Pick the one that's yours.</h2>
        <div style={{ fontSize: 13, color: t.ink2, maxWidth: '56ch' }}>Change either side. Swap source. When you've decided, apply the winner — to a chapter, a section, or the whole book.</div>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: t.rule, minHeight: 0, padding: '0 28px 28px' }}>
        <VoicePane side="A" profile={left} profiles={VOICE.PROFILES} onPick={() => {}} />
        <VoicePane side="B" profile={right} profiles={VOICE.PROFILES} onPick={setRightId} />
      </div>
      <div style={{ padding: '14px 28px', borderTop: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1 }}>Source · ch.14 opening paragraph</div>
        <button style={{ padding: '5px 10px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>⇄ Swap source</button>
        <div style={{ flex: 1 }} />
        <button style={{ padding: '7px 16px', background: t.accent, color: t.onAccent, border: 'none', borderRadius: t.radius, fontFamily: t.display, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Apply A</button>
        <button style={{ padding: '7px 16px', background: 'transparent', color: t.accent, border: `1px solid ${t.accent}`, borderRadius: t.radius, fontFamily: t.display, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Apply B</button>
      </div>
    </div>
  );
}

function VoicePane({ side, profile, profiles, onPick }) {
  const t = useTheme();
  return (
    <div style={{ background: t.paper, padding: 22, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexShrink: 0 }}>
        <div style={{
          width: 24, height: 24, background: side === 'A' ? t.accent : t.accent2, color: t.onAccent,
          display: 'grid', placeItems: 'center', fontFamily: t.display, fontWeight: 600, fontSize: 13, borderRadius: 2,
        }}>{side}</div>
        <select
          value={profile.id}
          onChange={e => onPick && onPick(e.target.value)}
          style={{ flex: 1, padding: '5px 8px', background: t.bg, color: t.ink, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.display, fontSize: 14 }}
        >
          {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <VoiceMiniVector sliders={profile.sliders} />
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <VoiceBadges sliders={profile.sliders} />
      </div>
      <div style={{ marginTop: 14, padding: 16, background: t.bg, borderRadius: t.radius, border: `1px solid ${t.rule}`, flex: 1, overflowY: 'auto' }}>
        <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, lineHeight: 1.7 }}>{profile.sample}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexShrink: 0, fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1 }}>
        <span>{profile.sample.split(/\s+/).length} words</span> · <span>{profile.sample.split(/[.!?]+/).filter(s => s.trim()).length} sentences</span> · <span>avg {Math.round(profile.sample.split(/\s+/).length / Math.max(1, profile.sample.split(/[.!?]+/).filter(s => s.trim()).length))} w/s</span>
      </div>
    </div>
  );
}

// ─── Assign mode ────────────────────────────────────────────────────────────
function VoiceAssign() {
  const t = useTheme();
  const [assignments, setAssignments] = React.useState(VOICE.ASSIGNMENTS);
  const chaptersFull = Array.from({ length: 14 }, (_, i) => {
    const a = assignments.find(x => x.chapter === i + 1);
    return a || { chapter: i + 1, title: `Chapter ${i + 1}`, profile: 'book1-mira' };
  });

  const setAssign = (ch, profile) => {
    setAssignments(list => {
      const existing = list.find(a => a.chapter === ch);
      if (existing) return list.map(a => a.chapter === ch ? { ...a, profile } : a);
      return [...list, { chapter: ch, title: `Chapter ${ch}`, profile }];
    });
  };

  const colorFor = id => {
    const idx = VOICE.PROFILES.findIndex(p => p.id === id);
    return ['oklch(78% 0.13 78)', 'oklch(72% 0.10 200)', 'oklch(65% 0.18 25)', 'oklch(72% 0.13 145)', 'oklch(70% 0.13 300)'][idx % 5];
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 820 }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase' }}>Per-chapter assignment</div>
        <h2 style={{ fontFamily: t.display, fontSize: 26, fontWeight: 500, letterSpacing: -0.015, margin: '4px 0 6px', color: t.ink }}>Different chapters, different voices.</h2>
        <div style={{ fontSize: 13, color: t.ink2, maxWidth: '56ch', marginBottom: 20 }}>The Loom will use the assigned voice when generating, auto-completing, or re-rendering any content in that chapter. Previously-written prose is untouched unless you ask.</div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          {VOICE.PROFILES.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.ink2 }}>
              <span style={{ width: 10, height: 10, background: colorFor(p.id), borderRadius: 2 }} />
              {p.name}
            </div>
          ))}
        </div>

        {/* Timeline bar */}
        <div style={{ background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius, padding: 18, marginBottom: 20 }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 10 }}>Book II · chapters 1–14</div>
          <div style={{ display: 'flex', gap: 2, height: 40 }}>
            {chaptersFull.map(c => (
              <div key={c.chapter} title={`Ch.${c.chapter} ${c.title}`} style={{
                flex: 1, background: colorFor(c.profile), borderRadius: 2,
                display: 'grid', placeItems: 'center', color: 'rgba(0,0,0,0.6)',
                fontFamily: t.mono, fontSize: 11, fontWeight: 600,
              }}>{c.chapter}</div>
            ))}
          </div>
        </div>

        {/* Chapter table */}
        <div style={{ background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius, overflow: 'hidden' }}>
          {chaptersFull.map((c, i) => (
            <div key={c.chapter} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderTop: i > 0 ? `1px solid ${t.rule}` : 'none', gap: 12 }}>
              <div style={{ fontFamily: t.mono, fontSize: 11, color: t.ink3, letterSpacing: 0.1, width: 40 }}>CH.{String(c.chapter).padStart(2, '0')}</div>
              <div style={{ flex: 1, fontSize: 13, color: t.ink }}>{c.title}</div>
              <span style={{ width: 8, height: 8, background: colorFor(c.profile), borderRadius: 1 }} />
              <select value={c.profile} onChange={e => setAssign(c.chapter, e.target.value)}
                style={{ padding: '4px 8px', background: t.bg, color: t.ink, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.display, fontSize: 12 }}>
                {VOICE.PROFILES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Teach mode ─────────────────────────────────────────────────────────────
function VoiceTeach() {
  const t = useTheme();
  const [sample, setSample] = React.useState('');
  const [analyzed, setAnalyzed] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);

  const wordCount = sample.trim().split(/\s+/).filter(Boolean).length;
  const ready = wordCount >= 200;

  const analyze = () => {
    setAnalyzing(true);
    setTimeout(() => { setAnalyzing(false); setAnalyzed(true); }, 1800);
  };

  const LEARNED = { formality: 42, rhythm: 61, length: 38, lyricism: 78, darkness: 66, pov: 33, modernity: 35 };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 820 }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase' }}>Teach from sample</div>
        <h2 style={{ fontFamily: t.display, fontSize: 26, fontWeight: 500, letterSpacing: -0.015, margin: '4px 0 6px', color: t.ink }}>Paste your best writing. The Loom learns.</h2>
        <div style={{ fontSize: 13, color: t.ink2, maxWidth: '56ch', marginBottom: 20 }}>A chapter you're proud of. A scene that sounded exactly right. ~500 words is ideal; 200 is the minimum. The Loom reads it and proposes slider values — you accept, tweak, and save as a new profile.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
          <div>
            <textarea value={sample} onChange={e => setSample(e.target.value)} placeholder="Paste a passage in your voice…" style={{
              width: '100%', minHeight: 300, padding: 18,
              background: t.paper, color: t.ink,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.display, fontSize: 14, lineHeight: 1.7, resize: 'vertical', outline: 'none',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: ready ? t.good : t.ink3, letterSpacing: 0.1 }}>
                {wordCount} / 200 WORDS {ready ? '· READY' : '· KEEP GOING'}
              </div>
              <button onClick={analyze} disabled={!ready || analyzing} style={{
                padding: '8px 16px', background: ready ? t.accent : t.rule,
                color: t.onAccent, border: 'none', borderRadius: t.radius,
                fontFamily: t.display, fontWeight: 500, fontSize: 13,
                cursor: ready ? 'pointer' : 'not-allowed', opacity: analyzing ? 0.6 : 1,
              }}>{analyzing ? 'Reading…' : 'Learn voice →'}</button>
            </div>
          </div>

          <div style={{ padding: 20, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 10 }}>Proposed sliders</div>
            {analyzed ? (
              <>
                {VOICE.DIMENSIONS.map(d => (
                  <div key={d.key} style={{ padding: '6px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.ink, marginBottom: 3 }}>
                      <span>{d.label}</span>
                      <span style={{ fontFamily: t.mono, color: t.accent }}>{LEARNED[d.key]}</span>
                    </div>
                    <div style={{ height: 4, background: t.rule, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${LEARNED[d.key]}%`, height: '100%', background: t.accent }} />
                    </div>
                  </div>
                ))}
                <button style={{
                  width: '100%', padding: '10px 14px', marginTop: 14,
                  background: t.accent, color: t.onAccent,
                  border: 'none', borderRadius: t.radius,
                  fontFamily: t.display, fontWeight: 500, fontSize: 13, cursor: 'pointer',
                }}>Save as new profile</button>
              </>
            ) : (
              <div style={{ fontSize: 13, color: t.ink3, lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center', padding: '40px 10px' }}>
                {analyzing ? 'Reading cadence, vocabulary, rhythm…' : 'Values will appear here once the Loom has read your sample.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.VoiceCompare = VoiceCompare;
window.VoiceAssign = VoiceAssign;
window.VoiceTeach = VoiceTeach;
window.VoicePane = VoicePane;

// Boot
ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider><VoiceApp /></ThemeProvider>
);

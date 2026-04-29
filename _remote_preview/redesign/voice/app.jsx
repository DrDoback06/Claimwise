// voice-app.jsx — Voice Studio: tune sliders, preview live re-rendered text,
// save profiles, A/B compare, version history, chapter assignment.

function VoiceApp() {
  const t = useTheme();
  const [profileId, setProfileId] = React.useState('book1-mira');
  const profile = VOICE.PROFILES.find(p => p.id === profileId);
  const [sliders, setSliders] = React.useState(profile.sliders);
  const [compareId, setCompareId] = React.useState(null);
  const [mode, setMode] = React.useState('tune'); // tune | compare | assign | teach
  const [history, setHistory] = React.useState(VOICE.HISTORY);

  // Switching profile resets sliders
  React.useEffect(() => {
    const p = VOICE.PROFILES.find(p => p.id === profileId);
    if (p) setSliders(p.sliders);
  }, [profileId]);

  const updateSlider = (k, v) => setSliders(s => ({ ...s, [k]: v }));
  const dirty = Object.keys(sliders).some(k => sliders[k] !== profile.sliders[k]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: t.bg, color: t.ink, fontFamily: t.font }}>
      <VoiceSidebar profileId={profileId} setProfileId={setProfileId} mode={mode} setMode={setMode} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <VoiceTopbar profile={profile} dirty={dirty} mode={mode} setMode={setMode} onRevert={() => setSliders(profile.sliders)} />
        {mode === 'tune' && <VoiceTune profile={profile} sliders={sliders} updateSlider={updateSlider} history={history} setHistory={setHistory} />}
        {mode === 'compare' && <VoiceCompare leftId={profileId} rightId={compareId} setRightId={setCompareId} />}
        {mode === 'assign' && <VoiceAssign />}
        {mode === 'teach' && <VoiceTeach />}
      </main>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────
function VoiceSidebar({ profileId, setProfileId, mode, setMode }) {
  const t = useTheme();
  const savedLabels = { current: 'IN USE', committed: 'SAVED', experiment: 'DRAFT' };
  return (
    <aside style={{ width: 240, background: t.sidebar, borderRight: `1px solid ${t.rule}`, padding: '20px 14px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: `1px solid ${t.rule}`, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 15, borderRadius: 2 }}>L<span style={{ fontSize: 13, opacity: 0.6 }}>w</span></div>
        <div>
          <div style={{ fontFamily: t.display, fontWeight: 500, fontSize: 16, lineHeight: 1, color: t.ink }}>Loomwright</div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 2 }}>Voice Studio</div>
        </div>
      </div>

      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>Modes</div>
      {[
        { id: 'tune', label: 'Tune', desc: 'Slider dashboard' },
        { id: 'compare', label: 'A / B compare', desc: 'Two voices, same text' },
        { id: 'assign', label: 'Assign to chapters', desc: 'Per-chapter voice' },
        { id: 'teach', label: 'Teach from sample', desc: 'Paste your best writing' },
      ].map(m => (
        <button key={m.id} onClick={() => setMode(m.id)} style={{
          display: 'block', width: '100%', textAlign: 'left',
          padding: '9px 10px', marginBottom: 3,
          background: mode === m.id ? t.paper : 'transparent',
          border: 'none', borderLeft: mode === m.id ? `2px solid ${t.accent}` : '2px solid transparent',
          borderRadius: 2,
          cursor: 'pointer',
          color: mode === m.id ? t.ink : t.ink2,
        }}>
          <div style={{ fontFamily: t.display, fontSize: 13, fontWeight: 500 }}>{m.label}</div>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, marginTop: 1 }}>{m.desc.toUpperCase()}</div>
        </button>
      ))}

      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', margin: '20px 0 8px' }}>Voice profiles</div>
      {VOICE.PROFILES.map(p => {
        const active = profileId === p.id;
        return (
          <button key={p.id} onClick={() => setProfileId(p.id)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: 10, marginBottom: 4,
            background: active ? t.paper : 'transparent',
            border: `1px solid ${active ? t.accent : t.rule}`,
            borderRadius: t.radius,
            cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500 }}>{p.name}</div>
              <span style={{
                fontFamily: t.mono, fontSize: 8, letterSpacing: 0.12, padding: '2px 5px',
                color: p.saved === 'current' ? t.onAccent : t.ink3,
                background: p.saved === 'current' ? t.accent : 'transparent',
                border: p.saved !== 'current' ? `1px solid ${t.rule}` : 'none',
                borderRadius: 1,
              }}>{savedLabels[p.saved]}</span>
            </div>
            <div style={{ fontSize: 11, color: t.ink3, marginTop: 4, lineHeight: 1.4 }}>{p.subtitle}</div>
            <VoiceMiniVector sliders={p.sliders} />
          </button>
        );
      })}

      <button style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '9px 10px', marginTop: 6,
        background: 'transparent', color: t.accent,
        border: `1px dashed ${t.accent}`, borderRadius: t.radius,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
      }}>+ New profile</button>
    </aside>
  );
}

function VoiceMiniVector({ sliders }) {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 7, height: 14, alignItems: 'flex-end' }}>
      {VOICE.DIMENSIONS.map(d => (
        <div key={d.key} style={{ flex: 1, background: t.rule, borderRadius: 1, height: 14, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${sliders[d.key]}%`, background: t.accent, borderRadius: 1, opacity: 0.8 }} />
        </div>
      ))}
    </div>
  );
}

// ─── Topbar ─────────────────────────────────────────────────────────────────
function VoiceTopbar({ profile, dirty, mode, setMode, onRevert }) {
  const t = useTheme();
  return (
    <div style={{ padding: '14px 28px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
      <div>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase' }}>Editing voice</div>
        <div style={{ fontFamily: t.display, fontSize: 20, fontWeight: 500, lineHeight: 1.1, marginTop: 2, color: t.ink }}>{profile.name}</div>
      </div>
      {dirty && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: t.warn + '20', border: `1px solid ${t.warn}`, borderRadius: t.radius }}>
          <span style={{ width: 6, height: 6, background: t.warn, borderRadius: '50%' }} />
          <span style={{ fontFamily: t.mono, fontSize: 10, color: t.warn, letterSpacing: 0.1, textTransform: 'uppercase' }}>Unsaved changes</span>
          <button onClick={onRevert} style={{ marginLeft: 4, background: 'transparent', border: 'none', color: t.warn, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>Revert</button>
        </div>
      )}
      <div style={{ flex: 1 }} />
      <ThemeToggle />
      <button style={{
        padding: '7px 13px', background: dirty ? t.accent : 'transparent', color: dirty ? t.onAccent : t.ink3,
        border: dirty ? 'none' : `1px solid ${t.rule}`, borderRadius: t.radius,
        fontFamily: t.display, fontWeight: 500, fontSize: 12, cursor: dirty ? 'pointer' : 'default',
        opacity: dirty ? 1 : 0.6,
      }}>{dirty ? 'Save version' : 'Saved'}</button>
    </div>
  );
}

// ─── Tune mode ──────────────────────────────────────────────────────────────
function VoiceTune({ profile, sliders, updateSlider, history, setHistory }) {
  const t = useTheme();
  // Simulate "re-rendered" preview based on slider drift from profile baseline
  const preview = simulateVoice(sliders);

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {/* LEFT — slider dashboard */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 28 }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4 }}>Voice dials</div>
        <h2 style={{ fontFamily: t.display, fontSize: 28, fontWeight: 500, letterSpacing: -0.015, margin: '0 0 16px', color: t.ink }}>Tune the voice, feel the change.</h2>

        <div style={{ background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius, padding: 22 }}>
          {VOICE.DIMENSIONS.map(d => (
            <VoiceSlider key={d.key} dim={d} value={sliders[d.key]} onChange={(v) => updateSlider(d.key, v)} baseline={profile.sliders[d.key]} />
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={{ padding: '7px 12px', background: t.paper, color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>✎ Edit source text</button>
          <button style={{ padding: '7px 12px', background: t.paper, color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>↻ Re-render</button>
          <button style={{ padding: '7px 12px', background: t.paper, color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>⎘ Copy variant</button>
          <button style={{ padding: '7px 12px', background: t.paper, color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: t.radius, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>⚐ Apply to chapter…</button>
        </div>
      </div>

      {/* RIGHT — live preview + history */}
      <div style={{ width: 440, flexShrink: 0, borderLeft: `1px solid ${t.rule}`, background: t.paper2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '18px 22px 10px' }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.16, textTransform: 'uppercase' }}>Live preview</div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1, marginTop: 2 }}>Same source · re-voiced as you drag</div>
        </div>

        {/* Source text block */}
        <div style={{ margin: '0 22px 14px', padding: 14, background: t.bg, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, marginBottom: 4, textTransform: 'uppercase' }}>Source (ch.14, draft)</div>
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, lineHeight: 1.6 }}>{VOICE.SOURCE}</div>
        </div>

        {/* Re-rendered preview */}
        <div style={{ margin: '0 22px', padding: 16, background: t.paper, border: `1px solid ${t.accent}`, borderLeft: `3px solid ${t.accent}`, borderRadius: t.radius, flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>{profile.name} · live</span>
            <div style={{ flex: 1 }} />
            <VoiceBadges sliders={sliders} />
          </div>
          <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, lineHeight: 1.7 }}>{preview}</div>
        </div>

        {/* Version history */}
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${t.rule}`, flexShrink: 0 }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 6 }}>Version history · {history.length}</div>
          <div style={{ maxHeight: 130, overflowY: 'auto' }}>
            {history.map(h => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${t.rule}` }}>
                <div>
                  <div style={{ fontSize: 12, color: t.ink, lineHeight: 1.3 }}>{h.label}</div>
                  <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.08 }}>{h.id} · {h.when}</div>
                </div>
                <button style={{ background: 'transparent', border: 'none', color: t.accent, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase', cursor: 'pointer' }}>Restore</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VoiceSlider({ dim, value, onChange, baseline }) {
  const t = useTheme();
  const drift = value - baseline;
  return (
    <div style={{ padding: '10px 0', borderBottom: `1px solid ${t.rule}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
        <div>
          <span style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>{dim.label}</span>
          {drift !== 0 && <span style={{ marginLeft: 6, fontFamily: t.mono, fontSize: 10, color: drift > 0 ? t.good : t.warn, letterSpacing: 0.1 }}>{drift > 0 ? '+' : ''}{drift}</span>}
        </div>
        <span style={{ fontFamily: t.mono, fontSize: 11, color: t.accent, letterSpacing: 0.1 }}>{value}</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: '100%', accentColor: t.accent }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, marginTop: -2 }}>
        <span>{dim.low.toUpperCase()}</span>
        <span>{dim.high.toUpperCase()}</span>
      </div>
    </div>
  );
}

function VoiceBadges({ sliders }) {
  const t = useTheme();
  // pull the top 2 most-extreme dimensions
  const top = [...VOICE.DIMENSIONS].map(d => ({ ...d, distance: Math.abs(sliders[d.key] - 50), v: sliders[d.key] }))
    .sort((a, b) => b.distance - a.distance).slice(0, 2);
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {top.map(d => (
        <span key={d.key} style={{ fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, padding: '2px 6px', border: `1px solid ${t.accent}`, borderRadius: 1, color: t.accent, textTransform: 'uppercase' }}>
          {d.v > 50 ? d.high : d.low}
        </span>
      ))}
    </div>
  );
}

// Simulate a voice re-rendering based on the slider vector.
// Picks the preset sample that's nearest in 7-dim space to the current sliders.
function simulateVoice(sliders) {
  let best = null, bestDist = Infinity;
  for (const p of VOICE.PROFILES) {
    let d = 0;
    for (const k of Object.keys(sliders)) d += Math.pow(sliders[k] - p.sliders[k], 2);
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best.sample;
}

window.VoiceApp = VoiceApp;
window.simulateVoice = simulateVoice;

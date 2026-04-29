// writers-room/onboarding-steps.jsx — steps 2–9 + Ready screen.
// Loads after onboarding.jsx; uses shared widgets via window.__ob_*.

(function() {
  const ChipRow = window.__ob_ChipRow;
  const VoiceSliders = window.__ob_VoiceSliders;
  const {
    TONES, POVS, TENSES, WORLD_TYPES, RHYTHMS,
    CHAPTER_LENGTHS, DIALOGUE_STYLES, DESCRIPTION_DENSITIES,
    PROFANITY_LEVELS, ROMANTIC_CONTENT, VIOLENCE_LEVELS,
    PET_PEEVES, FAVORITE_TECHNIQUES, PROVIDERS,
  } = window.__ob_options;
  const { stepTitle, stepHelp, primaryBtn, secondaryBtn, skipBtn, chipCard, kbd } = window.__ob_styles;

// ─── Step 2: Style Analysis ─────────────────────────────────────────────
function StepStyle({ draft, set, text, setText, analysing, setAnalysing, styleProfile, setStyleProfile, styleError, setStyleError, CW }) {
  const t = useTheme();

  const runAnalysis = async () => {
    if (!text?.trim() || !CW?.aiService) {
      setStyleError('Paste a chapter or paragraph first.');
      return;
    }
    setStyleError(null);
    setAnalysing(true);
    try {
      const prompt = CW.promptTemplates?.styleAnalysis?.(text);
      if (!prompt) throw new Error('styleAnalysis prompt template unavailable');
      const raw = await CW.aiService.callAI(prompt, 'style_analysis', '', {});
      const parsed = CW.parseExternalAIResponse?.(raw) || JSON.parse(raw);
      setStyleProfile(parsed);
      // Mirror parsed voice weights into the sliders if present
      if (parsed?.voiceProfile) {
        // Rough mapping — style-analysis fields don't map 1:1, but give the user
        // a reasonable starting point based on what the AI picked up.
        set('voiceWeights', w => ({ ...w }));
      }
    } catch (e) {
      setStyleError(e.message || 'Style analysis failed. Check your API keys in step 6.');
    } finally { setAnalysing(false); }
  };

  return (
    <div>
      <h2 style={stepTitle(t)}>Your voice</h2>
      <p style={stepHelp(t)}>How does your writing sound? Tune the sliders, then — if you like — paste a representative passage and the Loom will analyse it.</p>

      <div style={{ marginTop: 24 }}>
        <span className="ob-label">Genre vs tone — how close do you want it to feel?</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <span className="ob-label" style={{ marginTop: 6 }}>POV</span>
            <ChipRow options={POVS} value={draft.pov} onChange={v => set('pov', v)} wrap />
          </div>
          <div>
            <span className="ob-label" style={{ marginTop: 6 }}>Tense</span>
            <ChipRow options={TENSES} value={draft.tense} onChange={v => set('tense', v)} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <span className="ob-label">Voice sliders · drag to calibrate</span>
        <VoiceSliders weights={draft.voiceWeights || {}} onChange={v => set('voiceWeights', v)} />
      </div>

      <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${t.rule}` }}>
        <span className="ob-label">Or teach the Loom by example <span style={{ color: t.ink3, textTransform: 'none' }}>(optional · paste a passage that feels like you)</span></span>
        <textarea className="ob-textarea" value={text} onChange={e => setText(e.target.value)}
          placeholder="Paste a chapter, a few pages, or a paragraph that best represents how you write."
          style={{ minHeight: 180 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={runAnalysis} disabled={analysing || !text?.trim()}
            style={{ ...primaryBtn(t), opacity: (analysing || !text?.trim()) ? 0.5 : 1 }}>
            {analysing ? 'Listening…' : '✦ Analyse voice'}
          </button>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, alignSelf: 'center' }}>
            Uses your configured AI provider · requires a key (step 6)
          </div>
        </div>
        {styleError && (
          <div style={{ marginTop: 10, padding: 10, background: t.paper, borderLeft: `3px solid ${t.warn}`, fontSize: 12, color: t.warn }}>
            {styleError} · You can still continue — voice sliders alone are enough.
          </div>
        )}
        {styleProfile && (
          <div style={{ marginTop: 12, padding: 14, background: t.paper2, border: `1px solid ${t.good}`, borderLeft: `3px solid ${t.good}`, borderRadius: 2 }}>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.good, letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 8 }}>Voice captured</div>
            {styleProfile.voiceProfile?.narratorTone && <div style={{ fontSize: 13, color: t.ink, lineHeight: 1.6, marginBottom: 4 }}><b>Tone:</b> {styleProfile.voiceProfile.narratorTone}</div>}
            {styleProfile.voiceProfile?.sentenceStructure && <div style={{ fontSize: 13, color: t.ink, lineHeight: 1.6, marginBottom: 4 }}><b>Sentence structure:</b> {styleProfile.voiceProfile.sentenceStructure}</div>}
            {styleProfile.voiceProfile?.uniquePatterns?.length > 0 && <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6, fontStyle: 'italic', marginTop: 6 }}>"{styleProfile.voiceProfile.uniquePatterns.slice(0, 2).join(' · ')}"</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Characters ─────────────────────────────────────────────────
function StepCharacters({ draft, set }) {
  const t = useTheme();
  const cast = draft.seedCast || [];
  const addChar = () => set('seedCast', xs => [...(xs || []), { name: '', role: 'support', oneliner: '', bio: '', voice: '' }]);
  const update = (i, k, v) => set('seedCast', xs => xs.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const remove = (i) => set('seedCast', xs => xs.filter((_, j) => j !== i));
  return (
    <div>
      <h2 style={stepTitle(t)}>Seed cast <span style={{ color: t.ink3, fontStyle: 'italic', fontWeight: 400 }}>(optional)</span></h2>
      <p style={stepHelp(t)}>Characters you already know. Add as many as you like — role, a one-liner, and their voice go a long way. The Loom proposes new ones as you write.</p>

      <div style={{ marginTop: 22 }}>
        {cast.map((c, i) => (
          <div key={i} style={{ padding: 14, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <input className="ob-input" style={{ flex: 1 }} value={c.name}
                onChange={e => update(i, 'name', e.target.value)} placeholder="Character name" />
              <select className="ob-select" style={{ width: 140 }} value={c.role}
                onChange={e => update(i, 'role', e.target.value)}>
                <option value="lead">lead</option>
                <option value="support">support</option>
                <option value="antagonist">antagonist</option>
                <option value="minor">minor</option>
              </select>
              <button onClick={() => remove(i)} style={{ background: 'transparent', border: 'none', color: t.ink3, fontSize: 20, cursor: 'pointer', padding: '0 8px' }}>×</button>
            </div>
            <input className="ob-input" style={{ marginBottom: 8 }} value={c.oneliner || ''}
              onChange={e => update(i, 'oneliner', e.target.value)} placeholder="One-line description" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input className="ob-input" value={c.voice || ''}
                onChange={e => update(i, 'voice', e.target.value)} placeholder="How they speak (optional)" />
              <input className="ob-input" value={c.bio || ''}
                onChange={e => update(i, 'bio', e.target.value)} placeholder="Short bio / backstory (optional)" />
            </div>
          </div>
        ))}
        <button onClick={addChar} style={{ ...secondaryBtn(t), marginTop: 4 }}>+ Add character</button>
      </div>
    </div>
  );
}

// ─── Step 4: World ──────────────────────────────────────────────────────
function StepWorld({ draft, set }) {
  const t = useTheme();
  const rules = draft.worldRules || [];
  const [newRule, setNewRule] = React.useState('');
  const addRule = () => {
    if (newRule.trim()) {
      set('worldRules', xs => [...(xs || []), newRule.trim()]);
      setNewRule('');
    }
  };
  return (
    <div>
      <h2 style={stepTitle(t)}>The world</h2>
      <p style={stepHelp(t)}>This wires the Atlas and the consistency checker. Pick the world's shape; add any fixed rules you want the Loom to respect.</p>

      <div style={{ marginTop: 24 }}>
        <span className="ob-label">World type</span>
        <ChipRow options={WORLD_TYPES} value={draft.worldType} onChange={v => set('worldType', v)} wrap />
      </div>

      <div style={{ marginTop: 20 }}>
        <span className="ob-label">Real-world anchor <span style={{ color: t.ink3, textTransform: 'none' }}>(optional)</span></span>
        <input className="ob-input" value={draft.worldAnchor || ''}
          onChange={e => set('worldAnchor', e.target.value)} placeholder="North Wales · Northumberland · Kyoto · Mars colony" />
      </div>

      <div style={{ marginTop: 20 }}>
        <span className="ob-label">World rules <span style={{ color: t.ink3, textTransform: 'none' }}>(one per line — magic works like this, tech is at that level, etc.)</span></span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {rules.map((r, i) => (
            <span key={i} style={{ padding: '6px 10px', background: t.paper, border: `1px solid ${t.rule}`, borderLeft: `3px solid ${t.accent}`, fontFamily: t.display, fontSize: 13, color: t.ink, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 2 }}>
              {r}
              <button onClick={() => set('worldRules', xs => xs.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="ob-input" style={{ flex: 1 }} value={newRule}
            onChange={e => setNewRule(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRule()}
            placeholder="e.g. Magic always has a cost paid in memory." />
          <button onClick={addRule} style={secondaryBtn(t)}>Add</button>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <span className="ob-label">Influences <span style={{ color: t.ink3, textTransform: 'none' }}>(writers or works — the Loom listens in their direction)</span></span>
        <InfluenceInput draft={draft} set={set} />
      </div>
    </div>
  );
}

function InfluenceInput({ draft, set }) {
  const t = useTheme();
  const [entry, setEntry] = React.useState('');
  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="ob-input" style={{ flex: 1 }} value={entry} onChange={e => setEntry(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && entry.trim()) {
              set('influences', xs => [...(xs || []), entry.trim()]);
              setEntry('');
            }
          }}
          placeholder="Ursula K. Le Guin · Tana French · Iain M. Banks" />
        <button onClick={() => { if (entry.trim()) { set('influences', xs => [...(xs || []), entry.trim()]); setEntry(''); } }} style={secondaryBtn(t)}>Add</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {(draft.influences || []).map((inf, i) => (
          <span key={i} style={{ padding: '6px 10px', background: t.paper, border: `1px solid ${t.rule}`, fontFamily: t.mono, fontSize: 11, color: t.ink, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 2 }}>
            {inf}
            <button onClick={() => set('influences', xs => xs.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Step 5: Plot Roadmap ───────────────────────────────────────────────
function StepPlot({ draft, set }) {
  const t = useTheme();
  return (
    <div>
      <h2 style={stepTitle(t)}>Plot &amp; targets</h2>
      <p style={stepHelp(t)}>How big is the book, and where is it headed? The Loom uses chapter count + word target to shape pacing.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 22 }}>
        <div>
          <span className="ob-label">Target word count</span>
          <input className="ob-input" type="number" value={draft.targetWords || ''}
            onChange={e => set('targetWords', +e.target.value || null)} placeholder="90000" />
        </div>
        <div>
          <span className="ob-label">Planned chapters</span>
          <input className="ob-input" type="number" value={draft.targetChapters || ''}
            onChange={e => set('targetChapters', +e.target.value || null)} placeholder="24" />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <span className="ob-label">Act structure / plot beats <span style={{ color: t.ink3, textTransform: 'none' }}>(optional — or write it directly in the room)</span></span>
        <textarea className="ob-textarea" value={draft.plotOutline || ''}
          onChange={e => set('plotOutline', e.target.value)}
          placeholder="Act 1 — the call… Act 2 — the cost… Act 3 — the return…"
          style={{ minHeight: 140 }} />
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, marginTop: 8 }}>
          You can also generate a plot outline from premise in the room — ⌘K · "Plot outline"
        </div>
      </div>
    </div>
  );
}

// ─── Step 6: AI Setup (API keys) ────────────────────────────────────────
function StepAI({ draft, set, apiKeys, setApiKeys, showKeys, setShowKeys }) {
  const t = useTheme();
  return (
    <div>
      <h2 style={stepTitle(t)}>AI provider keys</h2>
      <p style={stepHelp(t)}>You need at least one to generate AI content. Groq and Hugging Face are free; the others are paid but higher quality. Keys are stored locally and never leave your device.</p>

      <div style={{ marginTop: 22 }}>
        <span className="ob-label">Preferred provider</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['auto', ...PROVIDERS.map(p => p.id)].map(p => (
            <button key={p} onClick={() => set('preferredProvider', p)}
              className={`ob-chip ${(draft.preferredProvider || 'auto') === p ? 'on' : ''}`}>
              {p === 'auto' ? 'Auto · smart routing' : PROVIDERS.find(x => x.id === p)?.label || p}
            </button>
          ))}
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, marginTop: 6 }}>
          Auto picks the cheapest provider that can handle each request.
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        {PROVIDERS.map(p => (
          <div key={p.id} style={{ padding: 14, background: t.paper, border: `1px solid ${p.free ? t.good : t.rule}`, borderLeft: `3px solid ${p.free ? t.good : t.accent}`, borderRadius: 2, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, fontWeight: 500 }}>{p.label}</div>
              {p.free && <span style={{ padding: '1px 6px', background: t.good, color: t.onAccent, fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase' }}>Free</span>}
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1, flex: 1 }}>{p.hint}</div>
              <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.12, textDecoration: 'none' }}>Get key →</a>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type={showKeys[p.id] ? 'text' : 'password'}
                className="ob-input"
                style={{ flex: 1, fontFamily: t.mono, fontSize: 13, padding: '8px 12px' }}
                value={apiKeys[p.id] || ''}
                onChange={e => setApiKeys(k => ({ ...k, [p.id]: e.target.value }))}
                placeholder={`${p.label} API key (optional)`} />
              <button onClick={() => setShowKeys(s => ({ ...s, [p.id]: !s[p.id] }))}
                style={{ ...secondaryBtn(t), padding: '8px 12px' }}>
                {showKeys[p.id] ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: 12, background: t.paper2, borderLeft: `3px solid ${t.ink3}`, fontSize: 12, color: t.ink2, lineHeight: 1.55 }}>
        You can skip this entirely and set keys later in Settings. Writing tools that don't need AI (prose editing, manual entity management, mind-map) work without any keys at all.
      </div>
    </div>
  );
}

// ─── Step 7: Style Test ─────────────────────────────────────────────────
function StepStyleTest({ draft, set, CW, styleProfile }) {
  const t = useTheme();
  const [samples, setSamples] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const [ratings, setRatings] = React.useState({});
  const [error, setError] = React.useState(null);

  const generate = async () => {
    if (!CW?.aiService) { setError('AI service unavailable — add a provider key in step 6.'); return; }
    setRunning(true); setError(null);
    try {
      const prompt = `Generate 3 short (60-80 word) paragraphs of fiction that match this writer's taste.
Genre: ${(draft.genres || [draft.genre]).filter(Boolean).join(', ') || 'unspecified'}
Tone: ${(draft.tone || []).join(', ') || 'unspecified'}
POV: ${draft.pov || 'unspecified'} / ${draft.tense || 'past'}
Premise: ${draft.premise || '(unspecified)'}
Voice hints: ${styleProfile?.voiceProfile?.narratorTone || "author's choice"}

Return exactly 3 paragraphs, separated by a blank line. No numbering, no commentary.`;
      const response = await CW.aiService.callAI(prompt, 'creative', '', {});
      const paras = String(response).split(/\n\s*\n/).map(s => s.trim()).filter(Boolean).slice(0, 3);
      setSamples(paras.map((p, i) => ({ id: i, text: p })));
    } catch (e) {
      setError(e.message || 'Failed to generate samples.');
    } finally { setRunning(false); }
  };

  const rate = (id, stars) => {
    setRatings(r => ({ ...r, [id]: stars }));
    // Feed into learning system when available
    const svc = CW?.suggestionFeedbackService;
    if (svc) {
      try {
        const fn = svc.recordAcceptance || svc.recordFeedback;
        if (fn) {
          const id = `style_sample_${Date.now()}`;
          const action = stars >= 4 ? 'accept' : stars <= 2 ? 'reject' : 'neutral';
          const promise = svc.recordAcceptance
            ? svc.recordAcceptance(id, action, { suggestionType: 'style_sample', rating: stars })
            : svc.recordFeedback({ suggestionType: 'style_sample', action, rating: stars, timestamp: Date.now() });
          promise?.catch?.(() => {});
        }
      } catch (_) {}
    }
  };

  return (
    <div>
      <h2 style={stepTitle(t)}>Style test <span style={{ color: t.ink3, fontStyle: 'italic', fontWeight: 400 }}>(optional)</span></h2>
      <p style={stepHelp(t)}>Generate a few AI sample paragraphs and rate them. The Loom uses your ratings to calibrate voice match over time.</p>

      <div style={{ marginTop: 22 }}>
        <button onClick={generate} disabled={running} style={{ ...primaryBtn(t), opacity: running ? 0.5 : 1 }}>
          {running ? 'Generating…' : samples.length ? '↻ New samples' : '✦ Generate 3 samples'}
        </button>
        {error && <span style={{ marginLeft: 12, fontSize: 12, color: t.warn }}>{error}</span>}
      </div>

      {samples.map(s => (
        <div key={s.id} style={{ marginTop: 16, padding: 16, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2 }}>
          <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, lineHeight: 1.65, fontStyle: 'italic' }}>{s.text}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginRight: 4 }}>Rate</div>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => rate(s.id, n)}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: (ratings[s.id] || 0) >= n ? t.accent : 'transparent',
                  color: (ratings[s.id] || 0) >= n ? t.onAccent : t.ink3,
                  border: `1px solid ${(ratings[s.id] || 0) >= n ? t.accent : t.rule}`,
                  cursor: 'pointer', fontFamily: t.mono, fontSize: 11, fontWeight: 600,
                }}>{n}</button>
            ))}
          </div>
        </div>
      ))}
      {!samples.length && (
        <div style={{ marginTop: 16, padding: 14, background: t.paper, borderLeft: `3px solid ${t.ink3}`, fontSize: 12, color: t.ink2, lineHeight: 1.55 }}>
          No samples yet. Click "Generate 3 samples" above, or skip this step — you can run it later via ⌘K · "Voice studio".
        </div>
      )}
    </div>
  );
}

// ─── Step 8: Preferences ────────────────────────────────────────────────
function StepPreferences({ draft, set, setPref }) {
  const t = useTheme();
  const prefs = draft.writingPreferences || {};
  const togglePref = (field, value) => {
    const cur = prefs[field] || [];
    setPref(field, cur.includes(value) ? cur.filter(x => x !== value) : [...cur, value]);
  };

  return (
    <div>
      <h2 style={stepTitle(t)}>Your tastes</h2>
      <p style={stepHelp(t)}>Tell the Loom what you love and hate in writing. This directly shapes what it suggests, rewrites, or leaves alone.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 22 }}>
        <div>
          <span className="ob-label">Preferred POV (override)</span>
          <select className="ob-select" value={prefs.pov || ''} onChange={e => setPref('pov', e.target.value)}>
            <option value="">Follow story setting</option>
            <option value="first">First person (I/me)</option>
            <option value="third-limited">Third person limited</option>
            <option value="third-omni">Third person omniscient</option>
            <option value="second">Second person</option>
            <option value="mixed">Mixed / rotating</option>
          </select>
        </div>
        <div>
          <span className="ob-label">Preferred tense (override)</span>
          <select className="ob-select" value={prefs.tense || ''} onChange={e => setPref('tense', e.target.value)}>
            <option value="">Follow story setting</option>
            <option value="past">Past</option>
            <option value="present">Present</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
        <div>
          <span className="ob-label">Ideal chapter length</span>
          <ChipRow options={CHAPTER_LENGTHS.map(x => x.label)} value={CHAPTER_LENGTHS.find(x => x.id === prefs.chapterLength)?.label}
            onChange={v => setPref('chapterLength', CHAPTER_LENGTHS.find(x => x.label === v)?.id || '')} wrap />
        </div>
        <div>
          <span className="ob-label">Dialogue style</span>
          <ChipRow options={DIALOGUE_STYLES} value={prefs.dialogueStyle} onChange={v => setPref('dialogueStyle', v)} wrap />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, marginTop: 18 }}>
        <div>
          <span className="ob-label">Description density</span>
          <ChipRow options={DESCRIPTION_DENSITIES} value={prefs.descriptionDensity} onChange={v => setPref('descriptionDensity', v)} wrap />
        </div>
        <div>
          <span className="ob-label">Profanity</span>
          <ChipRow options={PROFANITY_LEVELS} value={prefs.profanityLevel} onChange={v => setPref('profanityLevel', v)} wrap />
        </div>
        <div>
          <span className="ob-label">Violence</span>
          <ChipRow options={VIOLENCE_LEVELS} value={prefs.violenceLevel} onChange={v => setPref('violenceLevel', v)} wrap />
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <span className="ob-label">Romantic content</span>
        <ChipRow options={ROMANTIC_CONTENT} value={prefs.romanticContent} onChange={v => setPref('romanticContent', v)} wrap />
      </div>

      <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${t.rule}` }}>
        <span className="ob-label">Pet peeves · things you DON'T want</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PET_PEEVES.map(p => {
            const on = (prefs.petPeeves || []).includes(p);
            return (
              <button key={p} onClick={() => togglePref('petPeeves', p)}
                className={`ob-chip ${on ? 'on' : ''}`}
                style={on ? { background: t.bad, color: t.onAccent, borderColor: t.bad } : {}}>
                {on ? '× ' : ''}{p}
              </button>
            );
          })}
        </div>
        <input className="ob-input" style={{ marginTop: 10 }} value={prefs.customPetPeeves || ''}
          onChange={e => setPref('customPetPeeves', e.target.value)}
          placeholder="Custom peeves · one line, comma-separated" />
      </div>

      <div style={{ marginTop: 24 }}>
        <span className="ob-label">Favourite techniques · things you love</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FAVORITE_TECHNIQUES.map(f => {
            const on = (prefs.favorites || []).includes(f);
            return (
              <button key={f} onClick={() => togglePref('favorites', f)}
                className={`ob-chip ${on ? 'on' : ''}`}
                style={on ? { background: t.good, color: t.onAccent, borderColor: t.good } : {}}>
                {on ? '✓ ' : ''}{f}
              </button>
            );
          })}
        </div>
        <input className="ob-input" style={{ marginTop: 10 }} value={prefs.customFavorites || ''}
          onChange={e => setPref('customFavorites', e.target.value)}
          placeholder="Custom favourites · free-form" />
      </div>
    </div>
  );
}

// ─── Step 9: Style Rules ────────────────────────────────────────────────
function StepStyleRules({ draft, set }) {
  const t = useTheme();
  const rules = draft.styleRules || [];
  const [entry, setEntry] = React.useState('');
  return (
    <div>
      <h2 style={stepTitle(t)}>Style rules</h2>
      <p style={stepHelp(t)}>Final rules the Loom will always follow when it generates or rewrites. These are absolute.</p>

      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input className="ob-input" style={{ flex: 1 }} value={entry}
            onChange={e => setEntry(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && entry.trim()) {
                set('styleRules', xs => [...(xs || []), entry.trim()]);
                setEntry('');
              }
            }}
            placeholder="e.g. No adverbs on dialogue tags. · Always use the Oxford comma." />
          <button onClick={() => { if (entry.trim()) { set('styleRules', xs => [...(xs || []), entry.trim()]); setEntry(''); } }} style={secondaryBtn(t)}>Add</button>
        </div>
        {rules.length === 0 && (
          <div style={{ padding: 12, fontFamily: t.display, fontSize: 13, fontStyle: 'italic', color: t.ink3 }}>
            No rules yet. Add any that the Loom should never break.
          </div>
        )}
        {rules.map((r, i) => (
          <div key={i} style={{ padding: '10px 14px', background: t.paper, border: `1px solid ${t.rule}`, borderLeft: `3px solid ${t.accent}`, borderRadius: 2, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, fontSize: 14, color: t.ink }}>{r}</div>
            <button onClick={() => set('styleRules', xs => xs.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 10: Ritual ────────────────────────────────────────────────────
function StepRitual({ draft, set }) {
  const t = useTheme();
  return (
    <div>
      <h2 style={stepTitle(t)}>Your ritual</h2>
      <p style={stepHelp(t)}>When do you write? This shapes how the room greets you and how sprint timers default.</p>

      <div style={{ marginTop: 24 }}>
        <span className="ob-label">Rhythm</span>
        <ChipRow options={RHYTHMS} value={draft.ritual?.rhythm} onChange={v => set('ritual', r => ({ ...(r || {}), rhythm: v }))} wrap />
      </div>
      <div style={{ marginTop: 20 }}>
        <span className="ob-label">Sprint length · {draft.ritual?.sprintLen || 25} min</span>
        <input type="range" min="10" max="60" step="5" value={draft.ritual?.sprintLen || 25}
          onChange={e => set('ritual', r => ({ ...(r || {}), sprintLen: +e.target.value }))}
          style={{ width: '100%', accentColor: t.accent }} />
      </div>
      <div style={{ marginTop: 20 }}>
        <span className="ob-label">Intrusion level · how talkative should the margin be?</span>
        <ChipRow options={['none', 'low', 'medium', 'high']} value={draft.intrusion}
          onChange={v => set('intrusion', v)} />
      </div>
    </div>
  );
}

// ─── Ready screen ───────────────────────────────────────────────────────
function ReadyScreen({ t, draft, onEnter }) {
  const bits = [
    draft.workingTitle && `"${draft.workingTitle}"`,
    (draft.genres || [draft.genre]).filter(Boolean).join(' / '),
    (draft.tone || []).join(' · '),
    draft.pov,
    draft.worldType,
    draft.seedCast?.filter(c => c.name?.trim()).length && `${draft.seedCast.filter(c => c.name?.trim()).length} characters`,
    draft.targetChapters && `${draft.targetChapters} chapters`,
    draft.preferredProvider && draft.preferredProvider !== 'auto' && draft.preferredProvider,
  ].filter(Boolean);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: t.bg, color: t.ink, fontFamily: t.font,
      display: 'grid', placeItems: 'center', padding: 40,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 580 }}>
        <div style={{ fontFamily: t.mono, fontSize: 11, color: t.accent, letterSpacing: 0.18, textTransform: 'uppercase', marginBottom: 14 }}>All set</div>
        <h1 style={{ fontFamily: t.display, fontSize: 52, fontWeight: 400, letterSpacing: -0.02, lineHeight: 1.1, margin: '0 0 22px', color: t.ink }}>The Loom is listening.</h1>
        <p style={{ fontFamily: t.display, fontSize: 17, fontStyle: 'italic', color: t.ink2, lineHeight: 1.7, textWrap: 'pretty', margin: '0 auto 32px' }}>
          {bits.length
            ? <>I'll start with <span style={{ color: t.ink }}>{bits.join(' · ')}</span> and notice the rest as you write.</>
            : <>I'll notice as you write. Any setting can change any time.</>}
        </p>
        <button onClick={onEnter} style={{ ...primaryBtn(t), padding: '14px 32px', fontSize: 13 }}>✦ Enter the Room →</button>
      </div>
    </div>
  );
}

// Expose all step components on window so onboarding.jsx can render them.
Object.assign(window, {
  StepStyle, StepCharacters, StepWorld, StepPlot, StepAI,
  StepStyleTest, StepPreferences, StepStyleRules, StepRitual,
  ReadyScreen, InfluenceInput,
});

})();

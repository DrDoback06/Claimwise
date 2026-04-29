// writers-room/onboarding.jsx — first-run wizard, full-fidelity port of the
// legacy 9-step OnboardingWizard (src/components/OnboardingWizard.jsx, 2,703
// lines) into the Parchment & Press aesthetic.
//
// Every substantive question from the legacy wizard is preserved:
//   · Welcome slides (what Loomwright is · how setup works · API keys heads-up)
//   · Step 1  Story Foundation (title, series, genres, subgenres, premise,
//             target audience, comparisons, tone)
//   · Step 2  Style Analysis (paste a chapter → optional AI voice extraction)
//   · Step 3  Character Profiles (seed cast with depth)
//   · Step 4  World Rules (world type, real-world anchor, free-form rules)
//   · Step 5  Plot Roadmap (premise beats, target chapter count, target words)
//   · Step 6  AI Setup (keys for Gemini / OpenAI / Claude / Groq / HF + provider)
//   · Step 7  Style Test (rate a couple of AI samples — deferred, teaches the
//             learning loop once set, optional for v1)
//   · Step 8  Writing Preferences (POV, tense, chapter length, pet peeves,
//             favourites, dialogue style, density, profanity, violence, romance)
//   · Step 9  Style Rules (free-form never-do / always-do list)
//   · Plus:   Voice sliders + Ritual (new-design additions — kept)
//
// All signals persist via the IndexedDB-backed store (profile + seedCast →
// actors store on finish). Any step can be skipped; Skip All jumps to Ready.

// ─── Static option sets ──────────────────────────────────────────────────
const GENRES = [
  { id: 'fantasy',   label: 'Fantasy',          features: ['Mind maps', 'World building', 'Magic systems'] },
  { id: 'sci-fi',    label: 'Sci-Fi',           features: ['Tech systems', 'Timeline tracking', 'World rules'] },
  { id: 'literary',  label: 'Literary Fiction', features: ['Character depth', 'Theme tracking', 'Style analysis'] },
  { id: 'thriller',  label: 'Thriller',         features: ['Plot threads', 'Tension tracking', 'Pacing control'] },
  { id: 'mystery',   label: 'Mystery',          features: ['Clue tracking', 'Suspect dossiers', 'Timelines'] },
  { id: 'horror',    label: 'Horror',           features: ['Mood sliders', 'Atmosphere', 'Tension tracking'] },
  { id: 'romance',   label: 'Romance',          features: ['Relationship tracking', 'Emotional beats', 'Chemistry'] },
  { id: 'historical',label: 'Historical',       features: ['Period accuracy', 'Real-world anchor', 'Dialects'] },
  { id: 'ya',        label: 'YA',               features: ['Age-appropriate voice', 'Emotional beats'] },
  { id: 'memoir',    label: 'Memoir / Non-fic', features: ['First-person', 'Factual timeline'] },
  { id: 'comedy',    label: 'Comedy',           features: ['Humor timing', 'Character quirks', 'Running gags'] },
  { id: 'rpg-lite',  label: 'RPG-Lite',         features: ['Items', 'Skills', 'Stats', 'Progression'] },
];

const TONES = ['Lyrical', 'Gritty', 'Warm', 'Dark', 'Comic', 'Melancholy', 'Epic', 'Intimate', 'Dreamlike', 'Sardonic'];
const POVS = ['First person', 'Close third', 'Omniscient third', 'Second person', 'Mixed / rotating'];
const TENSES = ['Past', 'Present'];
const WORLD_TYPES = [
  'Secondary-world fantasy', 'Sci-fi / futuristic', 'Contemporary real-world',
  'Historical', 'Alternate history', 'Surreal / liminal',
];
const RHYTHMS = ['Morning pages', 'Evening session', 'Weekend deep-dives', 'Sprint-based', 'Whenever it strikes'];
const TARGET_AUDIENCES = [
  { id: 'adult',      label: 'Adult',      hint: 'General adult fiction' },
  { id: 'ya',         label: 'Young Adult', hint: '13–18, strong emotional beats' },
  { id: 'new-adult',  label: 'New Adult',  hint: '18–25, college/early career' },
  { id: 'mg',         label: 'Middle Grade', hint: '8–12' },
  { id: 'literary',   label: 'Literary',   hint: 'Character-first, prose-focused' },
];
const CHAPTER_LENGTHS = [
  { id: 'short',  label: 'Short',  hint: '~1,500–2,500 words' },
  { id: 'medium', label: 'Medium', hint: '~3,000–5,000 words' },
  { id: 'long',   label: 'Long',   hint: '~6,000–10,000 words' },
  { id: 'mixed',  label: 'Mixed',  hint: 'Varies by scene needs' },
];
const DIALOGUE_STYLES = ['Snappy · quick-fire', 'Realistic · ums and pauses', 'Stylised · literary', 'Sparse · implication-heavy', 'Verbose · theatrical'];
const DESCRIPTION_DENSITIES = ['Sparse', 'Moderate', 'Rich', 'Lush'];
const PROFANITY_LEVELS = ['None', 'Mild', 'Moderate', 'Heavy · unfiltered'];
const ROMANTIC_CONTENT = ['None · fade to black', 'Subtle · hints', 'Moderate · on-page kissing', 'Explicit · open door'];
const VIOLENCE_LEVELS = ['None', 'Mild · implied', 'Moderate · on-page', 'Graphic · unflinching'];

// Preserved verbatim from legacy (the exact list writers iterate on is part of
// what makes the AI suggestions feel calibrated).
const PET_PEEVES = [
  'Purple prose', 'Info dumps', 'Telling instead of showing',
  '"Said" synonyms (exclaimed, proclaimed)',
  'Adverb overuse (quickly, slowly, angrily)',
  'Starting sentences with "Suddenly"',
  'Cliché metaphors', 'Dream sequences as plot device',
  'Mary Sue / perfect characters', 'Explaining the joke',
  'On-the-nose dialogue', 'Head-hopping (random POV switches)',
  'Filler words (very, really, just)', 'Passive voice overuse',
  'Repetitive sentence structure', 'Melodramatic inner monologue',
];
const FAVORITE_TECHNIQUES = [
  'Subtext in dialogue', 'Unreliable narrator', 'Dry humor / deadpan',
  'Show don\'t tell', 'Cliffhangers', 'Parallel storylines',
  'Foreshadowing', 'Breaking the fourth wall',
  'Stream of consciousness', 'In medias res (start mid-action)',
  'Motifs & callbacks', 'Sardonic inner monologue',
  'Atmospheric world-building', 'Snappy dialogue exchanges',
  'Slow burn tension', 'Character-driven conflict',
];

const PROVIDERS = [
  { id: 'groq',        label: 'Groq',        free: true,  hint: '14,400 free requests/day · fast', url: 'https://console.groq.com/keys' },
  { id: 'huggingface', label: 'Hugging Face',free: true,  hint: 'Free tier · basic use', url: 'https://huggingface.co/settings/tokens' },
  { id: 'gemini',      label: 'Gemini',      free: false, hint: 'Google · generous free tier', url: 'https://aistudio.google.com/app/apikey' },
  { id: 'anthropic',   label: 'Claude',      free: false, hint: 'Anthropic · premium reasoning', url: 'https://console.anthropic.com/' },
  { id: 'openai',      label: 'OpenAI',      free: false, hint: 'GPT-4o · broad capability', url: 'https://platform.openai.com/api-keys' },
];

// ─── Shell ──────────────────────────────────────────────────────────────
function OnboardingWizard({ onDone }) {
  const t = useTheme();
  const store = useStore();
  const CW = (typeof window !== 'undefined' ? window.CW : null);

  // −2 = welcome slides, −1 = mode select, 0..9 = real steps, 10 = ready
  const [stage, setStage] = React.useState(-2);
  const [welcomeSlide, setWelcomeSlide] = React.useState(0);
  const [quickImportMode, setQuickImportMode] = React.useState(false);

  // Working copy — committed on finish
  const [draft, setDraft] = React.useState(() => ({ ...(window.EMPTY_PROFILE || {}) }));
  const set = (k, v) => setDraft(d => ({ ...d, [k]: typeof v === 'function' ? v(d[k]) : v }));
  const setPref = (k, v) => setDraft(d => ({
    ...d,
    writingPreferences: { ...(d.writingPreferences || {}), [k]: typeof v === 'function' ? v(d.writingPreferences?.[k]) : v },
  }));

  // API key state (actually writes to aiService on save)
  const [apiKeys, setApiKeys] = React.useState({
    gemini: '', openai: '', anthropic: '', groq: '', huggingface: '',
  });
  const [showKeys, setShowKeys] = React.useState({});

  // Style-analysis AI state
  const [styleText, setStyleText] = React.useState('');
  const [analysing, setAnalysing] = React.useState(false);
  const [styleProfile, setStyleProfile] = React.useState(null);
  const [styleError, setStyleError] = React.useState(null);

  const steps = [
    { id: 0, label: 'Story',        sub: 'Title, genre, premise' },
    { id: 1, label: 'Style',        sub: 'Voice & tone capture' },
    { id: 2, label: 'Characters',   sub: 'Seed the cast' },
    { id: 3, label: 'World',        sub: 'Shape of the world' },
    { id: 4, label: 'Plot',         sub: 'Roadmap & targets' },
    { id: 5, label: 'AI Setup',     sub: 'Provider keys' },
    { id: 6, label: 'Style Test',   sub: 'Rate samples' },
    { id: 7, label: 'Preferences',  sub: 'Tastes & peeves' },
    { id: 8, label: 'Style Rules',  sub: 'Never-do / always-do' },
    { id: 9, label: 'Ritual',       sub: 'Sprint rhythm' },
  ];

  const canAdvance = () => {
    if (stage === 0) return !!draft.workingTitle?.trim();
    return true;
  };

  // ─── Finish: commit everything ─────────────────────────────────────────
  const finish = async () => {
    const now = Date.now();
    // 1. Save API keys via aiService if any were provided
    if (CW?.aiService) {
      try {
        await Promise.all(Object.entries(apiKeys).map(async ([provider, key]) => {
          if (key && key.trim()) {
            try { await CW.aiService.setApiKeySecure?.(provider, key.trim()); }
            catch (_) { CW.aiService.setApiKey?.(provider, key.trim()); }
          }
        }));
        if (draft.preferredProvider) {
          CW.aiService.setPreferredProvider?.(draft.preferredProvider);
        }
      } catch (e) { console.warn('[onboarding] API key save failed:', e); }
    }

    // 2. Write profile
    store.setSlice('profile', { ...draft, onboarded: true });

    // 3. Seed the book
    store.setSlice('book', b => ({
      ...b,
      id: 'lw.primary',
      title: draft.workingTitle || 'Untitled',
      series: draft.seriesName || null,
      target: draft.targetWords
        ? Math.round(draft.targetWords / (draft.targetChapters || 20))
        : 2500,
      createdAt: b.createdAt || now,
    }));

    // 4. Seed chapters
    const chapterCount = draft.targetChapters || 3;
    const chapters = {};
    const order = [];
    for (let i = 0; i < Math.min(chapterCount, 50); i++) {
      const id = window.rid('chp');
      chapters[id] = {
        id, n: i + 1,
        title: i === 0 ? 'Chapter 1' : `Chapter ${i + 1}`,
        text: '', scenes: [], lastEdit: null,
      };
      order.push(id);
    }
    store.setSlice('chapters', chapters);
    store.setSlice('book', b => ({ ...b, chapterOrder: order, currentChapterId: order[0] }));
    store.setPath('ui.activeChapterId', order[0]);

    // 5. Seed voice profile if any slider was touched or style was analysed
    const voiceProfile = {
      id: window.rid('vp'),
      name: `${draft.workingTitle || 'Book'} · primary voice`,
      sliders: draft.voiceWeights || {},
      source: styleProfile ? 'style-analysis' : 'onboarding',
      styleProfile: styleProfile || null,
      createdAt: now,
    };
    store.setSlice('voice', [voiceProfile]);

    // 6. Seed cast via real createCharacter so legacy services see them
    if (draft.seedCast?.length) {
      draft.seedCast.forEach(c => {
        if (!c.name?.trim()) return;
        window.createCharacter(store, {
          name: c.name.trim(),
          role: c.role || 'support',
          oneliner: c.oneliner || '',
          dossier: { bio: c.bio || '', quirks: [], voice: c.voice || '', notes: '' },
        });
      });
    }

    onDone();
  };

  // ─── Render ────────────────────────────────────────────────────────────
  if (stage === -2) {
    return <WelcomeSlides t={t}
      slide={welcomeSlide}
      setSlide={setWelcomeSlide}
      onSkip={() => setStage(-1)}
      onBegin={() => setStage(-1)} />;
  }
  if (stage === -1) {
    return <ModeSelect t={t}
      onStepByStep={() => setStage(0)}
      onQuickImport={() => setQuickImportMode(true)}
      quickImportMode={quickImportMode}
      setQuickImportMode={setQuickImportMode}
      draft={draft}
      set={set}
      onApplyImported={(parsed) => {
        // Map quick-import parsed data into the draft
        setDraft(d => ({
          ...d,
          workingTitle: parsed.title || d.workingTitle,
          seriesName: parsed.series || d.seriesName,
          genre: parsed.genre || d.genre,
          genres: parsed.genres || (parsed.genre ? [parsed.genre] : d.genres),
          premise: parsed.premise || d.premise,
          tone: parsed.tone || d.tone,
          worldType: parsed.worldType || d.worldType,
          influences: parsed.influences || d.influences,
          seedCast: parsed.characters || parsed.seedCast || d.seedCast,
        }));
        setStage(0);
      }}
    />;
  }
  if (stage === 10) {
    const Ready = window.ReadyScreen;
    return Ready ? <Ready t={t} draft={draft} onEnter={finish} /> : null;
  }

  const totalSteps = steps.length;
  const progressPct = Math.round(((stage + 1) / totalSteps) * 100);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: t.bg, color: t.ink, fontFamily: t.font,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes onboardFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .ob-step { animation: onboardFade 220ms ease both; }
        .ob-chip { padding: 8px 14px; border: 1px solid ${t.rule}; background: transparent; color: ${t.ink2}; font-family: ${t.mono}; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; border-radius: 2px; cursor: pointer; transition: all 140ms; }
        .ob-chip:hover { border-color: ${t.ink3}; color: ${t.ink}; }
        .ob-chip.on { border-color: ${t.accent}; background: ${t.accent}; color: ${t.onAccent}; }
        .ob-input { width: 100%; padding: 12px 14px; background: ${t.paper}; border: 1px solid ${t.rule}; border-radius: 2px; color: ${t.ink}; font-family: ${t.display}; font-size: 17px; outline: none; transition: border-color 140ms; }
        .ob-input:focus { border-color: ${t.accent}; }
        .ob-textarea { width: 100%; padding: 12px 14px; background: ${t.paper}; border: 1px solid ${t.rule}; border-radius: 2px; color: ${t.ink}; font-family: ${t.display}; font-size: 15px; line-height: 1.6; outline: none; resize: vertical; min-height: 100px; }
        .ob-label { font-family: ${t.mono}; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${t.ink3}; display: block; margin-bottom: 8px; }
        .ob-select { width: 100%; padding: 10px 12px; background: ${t.paper}; border: 1px solid ${t.rule}; color: ${t.ink}; font-family: ${t.display}; font-size: 15px; border-radius: 2px; outline: none; }
      `}</style>

      {/* Header */}
      <header style={{ padding: '18px 40px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 15, borderRadius: 2 }}>L<span style={{ fontSize: 12, opacity: 0.6 }}>w</span></div>
          <div>
            <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink }}>Loomwright</div>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>First weave · {steps[stage]?.label}</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Step rail */}
        <div style={{ display: 'flex', gap: 3 }}>
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => i <= stage && setStage(i)}
              title={s.label + ' · ' + s.sub}
              style={{
                padding: '4px 8px', minWidth: 32,
                background: i === stage ? t.accent : i < stage ? t.paper2 : 'transparent',
                color: i === stage ? t.onAccent : i < stage ? t.ink : t.ink3,
                border: `1px solid ${i === stage ? t.accent : t.rule}`,
                borderRadius: 1,
                fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase',
                cursor: i <= stage ? 'pointer' : 'not-allowed',
              }}>{i + 1}</button>
          ))}
        </div>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, minWidth: 70, textAlign: 'right' }}>
          {progressPct}%
        </div>
      </header>

      {/* Body */}
      <div className="ob-step" key={stage} style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: 760, margin: '0 auto' }}>
          {stage === 0 && <StepStory draft={draft} set={set} />}
          {stage === 1 && <window.StepStyle
            draft={draft} set={set}
            text={styleText} setText={setStyleText}
            analysing={analysing} setAnalysing={setAnalysing}
            styleProfile={styleProfile} setStyleProfile={setStyleProfile}
            styleError={styleError} setStyleError={setStyleError}
            CW={CW}
          />}
          {stage === 2 && <window.StepCharacters draft={draft} set={set} />}
          {stage === 3 && <window.StepWorld draft={draft} set={set} />}
          {stage === 4 && <window.StepPlot draft={draft} set={set} />}
          {stage === 5 && <window.StepAI draft={draft} set={set} apiKeys={apiKeys} setApiKeys={setApiKeys} showKeys={showKeys} setShowKeys={setShowKeys} />}
          {stage === 6 && <window.StepStyleTest draft={draft} set={set} CW={CW} styleProfile={styleProfile} />}
          {stage === 7 && <window.StepPreferences draft={draft} set={set} setPref={setPref} />}
          {stage === 8 && <window.StepStyleRules draft={draft} set={set} />}
          {stage === 9 && <window.StepRitual draft={draft} set={set} />}
        </div>
      </div>

      {/* Footer nav */}
      <footer style={{ padding: '16px 40px', borderTop: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 12, background: t.paper, flexShrink: 0 }}>
        <button onClick={() => {
          if (confirm('Skip the rest of setup? We\'ll save what you\'ve entered so far — you can finish setup from Settings any time.')) {
            // Commit whatever the user has entered rather than discard it.
            finish();
          }
        }} style={skipBtn(t)}>Skip the rest</button>
        <div style={{ flex: 1 }} />
        {stage > 0 && <button onClick={() => setStage(s => s - 1)} style={secondaryBtn(t)}>← Back</button>}
        {stage < steps.length - 1 && (
          <button
            disabled={!canAdvance()}
            onClick={() => setStage(s => s + 1)}
            style={{ ...primaryBtn(t), opacity: canAdvance() ? 1 : 0.4, cursor: canAdvance() ? 'pointer' : 'not-allowed' }}>
            Continue →
          </button>
        )}
        {stage === steps.length - 1 && (
          <button onClick={() => setStage(10)} style={primaryBtn(t)}>Review &amp; enter the Room →</button>
        )}
      </footer>
    </div>
  );
}

// ─── Welcome slides ─────────────────────────────────────────────────────
function WelcomeSlides({ t, slide, setSlide, onSkip, onBegin }) {
  const slides = [
    {
      eyebrow: 'Welcome, writer',
      title: 'The prose is the room.',
      body: 'Loomwright is the writing app that remembers everything you set down — characters, places, plot threads, the voice you write in — and listens for the rest as you go.',
      bullets: [
        { icon: '◉', text: 'Deep story memory across every chapter' },
        { icon: '✎', text: 'Intelligent writing that matches your voice, not generic AI slop' },
        { icon: '⚡', text: 'Entities track themselves — cast, places, items, threads' },
        { icon: '✦', text: 'Forward-thinking suggestions anchored in your narrative arc' },
      ],
    },
    {
      eyebrow: 'How setup works',
      title: 'A quick conversation.',
      body: 'The wizard teaches the Loom about your specific story. The more you tell it, the better it listens. Nothing is hard-coded — every answer shapes what the margin notices for you.',
      bullets: [
        { icon: '1–2', text: 'Story & Style — premise, genre, voice' },
        { icon: '3–4', text: 'Characters & World' },
        { icon: '5',   text: 'Plot roadmap' },
        { icon: '6',   text: 'AI provider keys' },
        { icon: '7–9', text: 'Style test · preferences · rules' },
      ],
      note: 'Every step is skippable. Come back to any of them later.',
    },
    {
      eyebrow: 'One more thing',
      title: 'AI provider keys.',
      body: 'To generate AI content you\'ll need at least one API key. Good news — there are free options.',
      bullets: [
        { icon: '✓', text: 'Groq · 14,400 free requests/day · fast' },
        { icon: '✓', text: 'Hugging Face · free tier · basic use' },
        { icon: '·', text: 'Gemini, Claude, OpenAI — paid but higher quality' },
      ],
      note: 'You can do this in step 6 of the wizard, or skip and set up in Settings later.',
    },
  ];
  const cur = slides[slide];
  const isLast = slide === slides.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: t.bg, color: t.ink, fontFamily: t.font,
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{ padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, background: t.accent, color: t.onAccent, fontFamily: t.display, fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 15, borderRadius: 2 }}>L<span style={{ fontSize: 12, opacity: 0.6 }}>w</span></div>
        <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink }}>Loomwright</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {slides.map((_, i) => <div key={i} style={{ width: 22, height: 3, background: i === slide ? t.accent : t.rule, borderRadius: 1 }} />)}
        </div>
      </header>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: 640, textAlign: 'center' }}>
          <div style={{ fontFamily: t.mono, fontSize: 11, color: t.accent, letterSpacing: 0.18, textTransform: 'uppercase', marginBottom: 14 }}>{cur.eyebrow}</div>
          <h1 style={{ fontFamily: t.display, fontSize: 52, fontWeight: 400, letterSpacing: -0.02, lineHeight: 1.1, margin: '0 0 20px', color: t.ink }}>{cur.title}</h1>
          <p style={{ fontFamily: t.display, fontSize: 18, fontStyle: 'italic', color: t.ink2, lineHeight: 1.65, textWrap: 'pretty', maxWidth: 540, margin: '0 auto 28px' }}>{cur.body}</p>
          {cur.bullets && (
            <div style={{ textAlign: 'left', marginTop: 20 }}>
              {cur.bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 14px', background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2, marginBottom: 6 }}>
                  <span style={{ color: t.accent, fontFamily: t.mono, fontSize: 13, fontWeight: 600, minWidth: 28 }}>{b.icon}</span>
                  <span style={{ fontSize: 14, color: t.ink, lineHeight: 1.55 }}>{b.text}</span>
                </div>
              ))}
            </div>
          )}
          {cur.note && <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 20 }}>{cur.note}</div>}
        </div>
      </div>
      <footer style={{ padding: '18px 40px', display: 'flex', gap: 10, borderTop: `1px solid ${t.rule}`, background: t.paper, flexShrink: 0 }}>
        <button onClick={onSkip} style={skipBtn(t)}>Skip intro</button>
        <div style={{ flex: 1 }} />
        {slide > 0 && <button onClick={() => setSlide(slide - 1)} style={secondaryBtn(t)}>Back</button>}
        {!isLast
          ? <button onClick={() => setSlide(slide + 1)} style={primaryBtn(t)}>Next →</button>
          : <button onClick={onBegin} style={primaryBtn(t)}>Let's begin →</button>}
      </footer>
    </div>
  );
}

// ─── Mode select (Quick Import vs Step-by-Step) ────────────────────────
function ModeSelect({ t, onStepByStep, onQuickImport, quickImportMode, setQuickImportMode, draft, set, onApplyImported }) {
  const [importContext, setImportContext] = React.useState('');
  const [importResponse, setImportResponse] = React.useState('');
  const [parsed, setParsed] = React.useState(null);
  const [parseError, setParseError] = React.useState(null);

  if (quickImportMode) {
    const CW = (typeof window !== 'undefined' ? window.CW : null);
    const quickPrompt = CW?.promptTemplates?.quickImport
      ? CW.promptTemplates.quickImport(importContext)
      : 'Quick-import prompt not available yet — promptTemplates not loaded.';

    const tryParse = () => {
      setParseError(null);
      try {
        const data = CW?.parseExternalAIResponse?.(importResponse);
        if (!data) throw new Error('Response did not contain valid JSON.');
        setParsed(data);
      } catch (e) { setParseError(e.message || String(e)); setParsed(null); }
    };

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: t.bg, color: t.ink, fontFamily: t.font,
        display: 'flex', flexDirection: 'column',
      }}>
        <header style={{ padding: '20px 40px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, fontWeight: 500 }}>Quick Import</div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setQuickImportMode(false)} style={secondaryBtn(t)}>Back to mode select</button>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ marginBottom: 20 }}>
              <span className="ob-label">How this works</span>
              <ol style={{ fontSize: 14, color: t.ink2, lineHeight: 1.7, paddingLeft: 20 }}>
                <li>Optional: add any prior context you want included ↓</li>
                <li>Copy the prompt below and paste into ChatGPT / Claude.</li>
                <li>Paste the full JSON response back here → we'll parse and auto-fill every step.</li>
              </ol>
            </div>
            <span className="ob-label">Optional context · existing notes, plot, characters</span>
            <textarea className="ob-textarea" value={importContext}
              onChange={e => setImportContext(e.target.value)}
              placeholder="Paste any notes you already have — it's fine to leave blank." />
            <div style={{ marginTop: 20, padding: 14, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="ob-label" style={{ marginBottom: 0 }}>Prompt to copy</span>
                <button onClick={() => {
                  navigator.clipboard?.writeText(quickPrompt);
                }} style={{ ...secondaryBtn(t), padding: '4px 10px' }}>Copy</button>
              </div>
              <div style={{ maxHeight: 180, overflowY: 'auto', padding: 10, background: t.bg, fontFamily: t.mono, fontSize: 11, color: t.ink2, lineHeight: 1.5, whiteSpace: 'pre-wrap', border: `1px solid ${t.rule}`, borderRadius: 2 }}>{quickPrompt}</div>
            </div>
            <div style={{ marginTop: 20 }}>
              <span className="ob-label">Paste the JSON response</span>
              <textarea className="ob-textarea" style={{ minHeight: 180, fontFamily: t.mono, fontSize: 12 }} value={importResponse}
                onChange={e => setImportResponse(e.target.value)} placeholder='{ "title": "...", "genre": "...", "premise": "...", ... }' />
              {parseError && <div style={{ marginTop: 8, padding: 10, background: t.paper, borderLeft: `3px solid ${t.bad}`, fontSize: 12, color: t.bad }}>Parse error · {parseError}</div>}
              {parsed && <div style={{ marginTop: 8, padding: 10, background: t.paper, borderLeft: `3px solid ${t.good}`, fontSize: 12, color: t.good }}>Parsed. Ready to apply.</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={tryParse} style={secondaryBtn(t)}>Parse JSON</button>
                <button onClick={() => parsed && onApplyImported(parsed)}
                  disabled={!parsed}
                  style={{ ...primaryBtn(t), opacity: parsed ? 1 : 0.4, cursor: parsed ? 'pointer' : 'not-allowed' }}>
                  Apply &amp; continue →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: t.bg, color: t.ink, fontFamily: t.font,
      display: 'grid', placeItems: 'center', padding: 40,
    }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: t.mono, fontSize: 11, color: t.accent, letterSpacing: 0.18, textTransform: 'uppercase', marginBottom: 10 }}>Setup</div>
          <h1 style={{ fontFamily: t.display, fontSize: 38, fontWeight: 400, margin: '0 0 10px', color: t.ink, letterSpacing: -0.02 }}>How would you like to start?</h1>
          <p style={{ fontFamily: t.display, fontSize: 15, fontStyle: 'italic', color: t.ink2, lineHeight: 1.6 }}>Either way, the Loom learns from what you bring.</p>
        </div>
        <button onClick={() => setQuickImportMode(true)} style={{ ...modeBtn(t), borderColor: t.accent, background: t.accent + '15' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 40, height: 40, background: t.accent, color: t.onAccent, display: 'grid', placeItems: 'center', borderRadius: 2, fontSize: 18, fontFamily: t.display, fontWeight: 600 }}>↥</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, fontWeight: 500, marginBottom: 4 }}>Quick import from ChatGPT</div>
              <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.5, marginBottom: 4 }}>Already set your story up with an AI? Copy one prompt, paste the response, we'll auto-fill every step.</div>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>Fastest · recommended if you have existing context</div>
            </div>
          </div>
        </button>
        <button onClick={onStepByStep} style={{ ...modeBtn(t), marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 40, height: 40, background: t.paper2, color: t.ink2, display: 'grid', placeItems: 'center', borderRadius: 2, fontSize: 18 }}>▣</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, fontWeight: 500, marginBottom: 4 }}>Step-by-step setup</div>
              <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.5, marginBottom: 4 }}>Walk through each section with guided prompts. Best for a new story or detailed customisation.</div>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>10 steps · 10–15 minutes · any step is skippable</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Step 1: Story Foundation ───────────────────────────────────────────
function StepStory({ draft, set }) {
  const t = useTheme();
  const genres = draft.genres || [];
  const toggleGenre = (id) => {
    set('genres', g => g?.includes(id) ? g.filter(x => x !== id) : [...(g || []), id]);
    // Also mirror to legacy single-genre field for services that read it
    set('genre', id);
  };
  return (
    <div>
      <h2 style={stepTitle(t)}>Your book</h2>
      <p style={stepHelp(t)}>What are you working on? The Loom uses every field here to shape what it notices as you write.</p>

      <div style={{ marginTop: 30 }}>
        <span className="ob-label">Working title *</span>
        <input className="ob-input" autoFocus value={draft.workingTitle || ''}
          onChange={e => set('workingTitle', e.target.value)} placeholder="e.g. The Ardent Path" />
      </div>
      <div style={{ marginTop: 18 }}>
        <span className="ob-label">Series name <span style={{ color: t.ink3, textTransform: 'none' }}>(optional)</span></span>
        <input className="ob-input" value={draft.seriesName || ''}
          onChange={e => set('seriesName', e.target.value)} placeholder="The Loomwright Cycle · Book II" />
      </div>

      <div style={{ marginTop: 22 }}>
        <span className="ob-label">Genres · pick one or more</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
          {GENRES.map(g => (
            <button key={g.id} onClick={() => toggleGenre(g.id)} className={`ob-chip ${genres.includes(g.id) ? 'on' : ''}`} style={{ textAlign: 'left', padding: '10px 12px', textTransform: 'none', letterSpacing: 'normal', fontFamily: t.display, fontSize: 13 }}>
              <div style={{ fontWeight: 500 }}>{g.label}</div>
              <div style={{ fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase', opacity: 0.7, marginTop: 3 }}>{g.features.slice(0, 2).join(' · ')}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <span className="ob-label">Sub-genres / flavours <span style={{ color: t.ink3, textTransform: 'none' }}>(optional, free-form · comma-separated)</span></span>
        <input className="ob-input" value={(draft.subGenres || []).join(', ')}
          onChange={e => set('subGenres', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          placeholder="grimdark, cosy mystery, space opera" />
      </div>

      <div style={{ marginTop: 22 }}>
        <span className="ob-label">The premise</span>
        <textarea className="ob-textarea" value={draft.premise || ''}
          onChange={e => set('premise', e.target.value)}
          placeholder="One or two sentences. What's the story about at its core?" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 22 }}>
        <div>
          <span className="ob-label">Target audience</span>
          <ChipRow options={TARGET_AUDIENCES.map(a => a.label)} value={TARGET_AUDIENCES.find(a => a.id === draft.targetAudience)?.label}
            onChange={(v) => {
              const match = TARGET_AUDIENCES.find(a => a.label === v);
              set('targetAudience', match?.id || 'adult');
            }} wrap />
        </div>
        <div>
          <span className="ob-label">Comparables <span style={{ color: t.ink3, textTransform: 'none' }}>(for reviewers)</span></span>
          <input className="ob-input" value={draft.comparisons || ''}
            onChange={e => set('comparisons', e.target.value)} placeholder="X meets Y · Le Guin for atmosphere" />
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <span className="ob-label">Tone · pick up to 3</span>
        <ChipRow options={TONES} multi value={draft.tone || []} onChange={v => set('tone', v)} max={3} wrap />
      </div>
    </div>
  );
}

// ─── Shared widgets ─────────────────────────────────────────────────────
function ChipRow({ options, value, onChange, multi, max, wrap }) {
  const isOn = (o) => multi ? (value || []).includes(o) : value === o;
  const toggle = (o) => {
    if (multi) {
      const cur = value || [];
      if (cur.includes(o)) onChange(cur.filter(x => x !== o));
      else if (!max || cur.length < max) onChange([...cur, o]);
    } else {
      onChange(isOn(o) ? null : o);
    }
  };
  return (
    <div style={{ display: 'flex', flexWrap: wrap ? 'wrap' : 'nowrap', gap: 6, overflowX: wrap ? 'visible' : 'auto' }}>
      {options.map(o => (
        <button key={o} className={`ob-chip ${isOn(o) ? 'on' : ''}`} onClick={() => toggle(o)}>{o}</button>
      ))}
    </div>
  );
}

function VoiceSliders({ weights, onChange }) {
  const t = useTheme();
  const w = weights || {};
  const defs = [
    ['formality', 'plain', 'formal'],
    ['rhythm', 'staccato', 'flowing'],
    ['lyricism', 'spare', 'lyrical'],
    ['darkness', 'light', 'dark'],
    ['pov', 'distant', 'close'],
    ['modernity', 'archaic', 'modern'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginTop: 10 }}>
      {defs.map(([k, lo, hi]) => (
        <div key={k}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 6 }}>
            <span>{lo}</span><span style={{ color: t.ink }}>{k}</span><span>{hi}</span>
          </div>
          <input type="range" min="0" max="1" step="0.05" value={w[k] ?? 0.5}
            onChange={e => onChange({ ...w, [k]: +e.target.value })}
            style={{ width: '100%', accentColor: t.accent }} />
        </div>
      ))}
    </div>
  );
}

// ─── Styles (shared) ────────────────────────────────────────────────────
const stepTitle = t => ({ fontFamily: t.display, fontSize: 36, fontWeight: 400, letterSpacing: -0.02, color: t.ink, margin: 0 });
const stepHelp = t => ({ fontFamily: t.display, fontSize: 16, fontStyle: 'italic', color: t.ink2, lineHeight: 1.6, marginTop: 12, maxWidth: '60ch' });
const primaryBtn = t => ({ padding: '10px 22px', background: t.accent, color: t.onAccent, border: 'none', borderRadius: 2, fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 });
const secondaryBtn = t => ({ padding: '10px 18px', background: 'transparent', color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer' });
const skipBtn = t => ({ padding: '8px 14px', background: 'transparent', color: t.ink3, border: 'none', fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer' });
const chipCard = (t, on) => ({ padding: 18, background: on ? (t.accent + '15') : t.paper, border: `1px solid ${on ? t.accent : t.rule}`, borderRadius: 3, textAlign: 'left', cursor: 'pointer', color: t.ink });
const modeBtn = (t) => ({ display: 'block', width: '100%', padding: 20, background: t.paper, color: t.ink, border: `2px solid ${t.rule}`, borderRadius: 3, cursor: 'pointer', fontFamily: t.font });
const kbd = t => ({ padding: '1px 6px', background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2, fontFamily: t.mono, fontSize: 10 });

// ═══════════════════════════════════════════════════════════════════════
//  Remaining steps live in onboarding-steps.jsx for size reasons.
// ═══════════════════════════════════════════════════════════════════════

Object.assign(window, {
  OnboardingWizard,
  // Exported for onboarding-steps.jsx
  __ob_ChipRow: ChipRow,
  __ob_VoiceSliders: VoiceSliders,
  __ob_styles: { stepTitle, stepHelp, primaryBtn, secondaryBtn, skipBtn, chipCard, kbd },
  __ob_options: {
    TONES, POVS, TENSES, WORLD_TYPES, RHYTHMS,
    CHAPTER_LENGTHS, DIALOGUE_STYLES, DESCRIPTION_DENSITIES,
    PROFANITY_LEVELS, ROMANTIC_CONTENT, VIOLENCE_LEVELS,
    PET_PEEVES, FAVORITE_TECHNIQUES, PROVIDERS,
  },
});

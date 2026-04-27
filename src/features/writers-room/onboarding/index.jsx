// Loomwright — onboarding wizard. 2026-04 expansion: ports the deeper
// questioning from the legacy OnboardingWizard so the AI has real context
// about the writer's saga, voice, and content boundaries before the room
// opens. Twelve focused steps, all skippable except Welcome / Begin.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import { rid } from '../store/mutators';
import { importFile } from './file-importers';
import { scheduleAutonomousRun } from '../ai/pipeline';
import { sectionById } from './schemas';
import { evaluateSection } from './completeness';
import SectionIO, { TrafficLight } from './SectionIO';
import ApiKeysStep from './ApiKeysStep';

const GENRES = [
  'Literary', 'Fantasy', 'Sci-fi', 'Thriller', 'Romance', 'Mystery',
  'Horror', 'Historical', 'YA', 'Adventure', 'Western', 'Crime',
  'Dystopian', 'Urban Fantasy', 'Magic Realism', 'Comedy', 'Memoir',
  'Slice of Life', 'RPG-Lite',
];
const SUB_GENRES = [
  'Grimdark', 'High Fantasy', 'Sword & Sorcery', 'Cyberpunk',
  'Space Opera', 'Cosy', 'Noir', 'Gothic', 'Mythic', 'Hopepunk',
  'Steampunk', 'Post-apocalyptic', 'Coming-of-age', 'Whodunit',
];
const TONES = [
  'hopeful', 'dark', 'lyrical', 'plain', 'ironic', 'sincere',
  'urgent', 'meditative', 'melancholic', 'comic', 'reverent', 'grim',
];
const POVS = ['1st person', '3rd limited', '3rd omniscient', 'multiple POV'];
const TENSES = ['past', 'present'];
const AUDIENCES = ['adult', 'YA', 'middle-grade', 'all ages'];
const CHAPTER_LENGTHS = ['flash (<1k)', 'short (1-2.5k)', 'standard (2.5-5k)', 'long (5k+)', 'mixed'];
const DIALOGUE_STYLES = ['terse', 'naturalistic', 'witty', 'formal', 'florid', 'mixed'];
const DESCRIPTION_DENSITIES = ['minimal', 'sparse', 'balanced', 'rich', 'maximalist'];
const LEVELS = ['none', 'mild', 'moderate', 'strong', 'extreme'];
const PET_PEEVES = [
  'overuse of adverbs', 'said-bookisms', 'purple prose', 'excessive backstory',
  'on-the-nose dialogue', 'info dumps', 'cliché openings ("waking up")',
  'em-dash overuse', 'head-hopping', 'weather-as-mood opening',
];
const FAVORITES = [
  'sensory detail', 'rhythmic prose', 'subtext', 'short chapters',
  'multiple POV', 'unreliable narrator', 'in-medias-res openings',
  'dialogue-driven scenes', 'time skips', 'epistolary inserts',
];

const STEPS = [
  'Welcome', 'AI keys', 'Story', 'Flavour', 'World rules', 'Voice & style',
  'Content boundaries', 'Pet peeves & loves', 'Style references',
  'Existing manuscript', 'Plot roadmap', 'AI & cadence', 'Begin',
];
const TOTAL = STEPS.length;

// Step index → schema id for per-section JSON I/O + traffic lights.
// Indices shifted +1 after AI keys was inserted at step 1.
const SECTION_FOR_STEP = {
  2: 'story',
  3: 'flavour',
  4: 'worldRules',
  5: 'voiceStyle',
  6: 'contentBoundaries',
  7: 'petPeeves',
  10: 'plotRoadmap',
  11: 'aiCadence',
};

export default function Onboarding({ onDone }) {
  const t = useTheme();
  const store = useStore();
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    workingTitle: '', seriesName: '', premise: '', comparisons: '',
    targetAudience: 'adult',
    genres: [], subGenres: [], tone: [], pov: '', tense: '',
    worldRulesText: '', worldRules: [],
    chapterLength: 'standard (2.5-5k)',
    dialogueStyle: 'naturalistic',
    descriptionDensity: 'balanced',
    profanityLevel: 'mild',
    violenceLevel: 'mild',
    romanticContent: 'mild',
    petPeeves: [], customPetPeeves: '',
    favorites: [], customFavorites: '',
    styleSamples: [], importedDocs: [],
    targetChapters: 25, outlineText: '',
    targetWords: 90000,
    aiProvider: 'auto', intrusion: 'medium',
    extractionBudget: 'balanced',
  });
  const [busy, setBusy] = React.useState(false);

  const next = () => setStep(s => Math.min(TOTAL - 1, s + 1));
  const prev = () => setStep(s => Math.max(0, s - 1));
  const set = (patch) => setData(d => ({ ...d, ...patch }));

  // The references slice lives on the store; the traffic-light score reads
  // it to decide whether a section has matching reference docs.
  const liveReferences = store.references || [];

  // Build a thin "data + uploaded reference siblings" view for the schemas
  // (so paste-in JSON applies to setData while traffic-lights also count
  // file uploads done within the wizard but not yet committed to the store).
  const renderSectionIO = (stepIdx) => {
    const sectionId = SECTION_FOR_STEP[stepIdx];
    if (!sectionId) return null;
    const section = sectionById(sectionId);
    if (!section) return null;
    // For traffic-light: combine store-side refs with the wizard-local
    // styleSamples so the writer sees green when they've dropped a file
    // in step 7 even before finish().
    const localRefs = (data.styleSamples || []).map(s => ({
      id: 'local_' + s.name,
      name: s.name,
      category: 'style',
      paragraphs: s.paragraphs,
    }));
    const evaluation = evaluateSection(section, data, [...liveReferences, ...localRefs]);
    return (
      <SectionIO
        section={section}
        data={data}
        evaluation={evaluation}
        onApply={(merged) => setData(d => ({ ...d, ...merged }))}
      />
    );
  };

  const renderTrafficLight = (stepIdx) => {
    const sectionId = SECTION_FOR_STEP[stepIdx];
    if (!sectionId) return null;
    const section = sectionById(sectionId);
    if (!section) return null;
    const localRefs = (data.styleSamples || []).map(s => ({
      id: 'local_' + s.name, name: s.name, category: 'style', paragraphs: s.paragraphs,
    }));
    const evaluation = evaluateSection(section, data, [...liveReferences, ...localRefs]);
    return <TrafficLight status={evaluation.status} title={evaluation.reasons.join(' · ') || 'Complete'} />;
  };

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    const docs = [];
    for (const f of files) {
      try {
        const out = await importFile(f);
        if (out.kind === 'document') docs.push({ name: f.name, paragraphs: out.paragraphs });
        else if (out.kind === 'archive') docs.push(...out.documents);
      } catch (err) { console.warn('Import failed', f.name, err); }
    }
    // Functional update — never read `data` from closure (stale across async).
    setData(d => ({ ...d, importedDocs: [...(d.importedDocs || []), ...docs] }));
    // Reset the input so picking the same file again re-fires onChange.
    if (e.target) e.target.value = '';
    setBusy(false);
  };

  const onStyleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    const samples = [];
    for (const f of files) {
      try {
        const out = await importFile(f);
        if (out.kind === 'document') samples.push({ name: f.name, paragraphs: out.paragraphs });
      } catch {}
    }
    setData(d => ({ ...d, styleSamples: [...(d.styleSamples || []), ...samples] }));
    if (e.target) e.target.value = '';
    setBusy(false);
  };

  const removeImportedDoc = (idx) => {
    setData(d => ({ ...d, importedDocs: (d.importedDocs || []).filter((_, i) => i !== idx) }));
  };
  const removeStyleSample = (idx) => {
    setData(d => ({ ...d, styleSamples: (d.styleSamples || []).filter((_, i) => i !== idx) }));
  };

  const finish = async () => {
    // Pre-build chapter records so onboarded=true and the chapters land in
    // the SAME state update. Otherwise Shell.jsx's "ensure at least one
    // chapter" effect fires between setPath('profile.onboarded') and
    // createChapter() and inserts a stray empty Chapter 1 ahead of the
    // imported manuscript.
    const chapterRecs = [];
    if ((data.importedDocs || []).length > 0) {
      data.importedDocs.forEach((doc, i) => {
        const id = rid('chp');
        const text = (doc.paragraphs || []).map(p => p.text).join('\n\n');
        chapterRecs.push({
          id,
          n: i + 1,
          title: (doc.name || `Chapter ${i + 1}`).replace(/\.[^.]+$/, ''),
          text,
          paragraphs: doc.paragraphs || null,
          scenes: [],
          lastEdit: Date.now(),
        });
      });
    } else {
      chapterRecs.push({
        id: rid('chp'), n: 1, title: 'Chapter 1', text: '',
        paragraphs: null, scenes: [], lastEdit: null,
      });
    }

    store.transaction(({ setSlice, setPath }) => {
      // Profile — comprehensive context for every AI call.
      setPath('profile.onboarded', true);
      setPath('profile.workingTitle', data.workingTitle);
      setPath('profile.seriesName', data.seriesName);
      setPath('profile.genre', (data.genres[0] || '').toLowerCase());
      setPath('profile.genres', data.genres);
      setPath('profile.subGenres', data.subGenres);
      setPath('profile.tone', data.tone);
      setPath('profile.pov', data.pov);
      setPath('profile.tense', data.tense);
      setPath('profile.targetAudience', data.targetAudience);
      setPath('profile.comparisons', data.comparisons);
      setPath('profile.targetWords', data.targetWords);
      setPath('profile.targetChapters', data.targetChapters);
      setPath('profile.premise', data.premise);
      setPath('profile.intrusion', data.intrusion);
      setPath('profile.aiProvider', data.aiProvider);
      setPath('profile.extractionBudget', data.extractionBudget || 'balanced');
      // World rules: a free-form text plus a bulleted list (split on newlines).
      const ruleList = (data.worldRulesText || '').split('\n').map(s => s.trim()).filter(Boolean);
      setPath('profile.worldRules', ruleList);
      setPath('profile.worldAnchor', data.worldRulesText);
      // Plot roadmap.
      setPath('profile.plotOutline', data.outlineText);
      // Writing preferences — a single object the legacy AI prompts read.
      setPath('profile.writingPreferences', {
        pov: data.pov,
        tense: data.tense,
        chapterLength: data.chapterLength,
        dialogueStyle: data.dialogueStyle,
        descriptionDensity: data.descriptionDensity,
        profanityLevel: data.profanityLevel,
        violenceLevel: data.violenceLevel,
        romanticContent: data.romanticContent,
        petPeeves: [...data.petPeeves, ...(data.customPetPeeves ? data.customPetPeeves.split(',').map(s => s.trim()).filter(Boolean) : [])],
        favorites: [...data.favorites, ...(data.customFavorites ? data.customFavorites.split(',').map(s => s.trim()).filter(Boolean) : [])],
      });
      // Book — including chapter order + currentChapterId so the editor
      // immediately opens the first imported chapter.
      setPath('book.title', data.workingTitle || 'Untitled');
      setPath('book.series', data.seriesName || null);
      setPath('book.target', Math.round((data.targetWords || 80000) / 30) || 2500);
      setPath('book.totalChapters', data.targetChapters || 25);
      setPath('book.createdAt', Date.now());
      setPath('book.chapterOrder', chapterRecs.map(c => c.id));
      setPath('book.currentChapterId', chapterRecs[0].id);
      // Chapters slice — all imported documents at once.
      setSlice('chapters', () => {
        const next = {};
        for (const c of chapterRecs) next[c.id] = c;
        return next;
      });
      // Mirror the active chapter into ui as well; Shell reads either path.
      setPath('ui.activeChapterId', chapterRecs[0].id);

      // Style samples → narrator voice profile (for the live AI prompt) and
      // a parallel entry in `references` (for the manage-references panel).
      if ((data.styleSamples || []).length > 0) {
        const narratorSamples = data.styleSamples.flatMap(s => s.paragraphs).map(p => p.text);
        setSlice('voice', vs => {
          const arr = vs || [];
          const i = arr.findIndex(v => v.characterId === 'narrator');
          const next = {
            id: 'voice_narrator',
            characterId: 'narrator',
            samples: narratorSamples.map(t => ({ text: t, at: Date.now() })),
          };
          if (i >= 0) return arr.map((x, j) => j === i ? { ...x, ...next } : x);
          return [...arr, next];
        });
        setSlice('references', xs => {
          const arr = Array.isArray(xs) ? xs : [];
          const newOnes = data.styleSamples.map(s => ({
            id: rid('ref'),
            name: s.name || 'style sample',
            label: (s.name || 'Style sample').replace(/\.[^.]+$/, ''),
            category: 'style',
            paragraphs: s.paragraphs || [],
            sourceKind: 'upload',
            importedAt: Date.now(),
            linkedTo: { sectionIds: ['voice-style', 'pet-peeves'], characterIds: [] },
          }));
          return [...arr, ...newOnes];
        });
      }
    });

    // Kick off background extraction for every imported chapter that has
    // real content. The pipeline writes findings to `reviewQueue` per-tab.
    // Guard: when extractionBudget === 'manual' (writer's choice), don't
    // auto-fire — they can scan from the panels' "Re-scan" buttons.
    const budget = data.extractionBudget || 'balanced';
    if (budget !== 'manual' && (data.importedDocs || []).length > 0) {
      for (const c of chapterRecs) {
        if ((c.text || '').trim().length > 80) {
          try { scheduleAutonomousRun(store, c.id); } catch (err) {
            console.warn('[onboarding] scheduleAutonomousRun failed', c.id, err);
          }
        }
      }
    }

    onDone?.();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: t.bg, display: 'grid', placeItems: 'start center',
      overflowY: 'auto',
    }}>
      <div style={{ width: 'min(100%, 760px)', padding: '40px 24px 80px', color: t.ink, fontFamily: t.display }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
        }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: PANEL_ACCENT.loom,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>Loomwright · Step {step + 1} of {TOTAL} · {STEPS[step]}</div>
          <span style={{ flex: 1 }} />
          {renderTrafficLight(step)}
        </div>
        <div style={{ height: 2, background: t.rule, marginBottom: 24, borderRadius: 1 }}>
          <div style={{
            width: `${((step + 1) / TOTAL) * 100}%`, height: '100%',
            background: PANEL_ACCENT.loom, transition: 'width 200ms',
          }} />
        </div>

        {step === 0 && (
          <Section title="Welcome">
            <p style={pStyle(t)}>Loomwright is your writers room. As you write, the manuscript becomes a living wiki of people, places, items, quests, and voices — surfaced quietly in the margins.</p>
            <p style={pStyle(t)}>The next 10 minutes are a one-time setup. The deeper your answers, the smarter the room is from day one. Anything you skip you can fill in later from Settings.</p>
            <p style={pStyle(t)}>The very first step wires up your AI keys — most are free, and nothing else here works without at least one.</p>
          </Section>
        )}

        {step === 1 && (
          <Section title="AI keys">
            <ApiKeysStep data={data} set={set} />
          </Section>
        )}

        {step === 2 && (
          <Section title="What is your story?">
            <Field label="Working title">
              <input value={data.workingTitle} onChange={e => set({ workingTitle: e.target.value })} style={inp(t)} placeholder="Untitled" autoFocus />
            </Field>
            <Field label="Series name (optional)">
              <input value={data.seriesName} onChange={e => set({ seriesName: e.target.value })} style={inp(t)} placeholder="The Compliance Run, The First Law, etc." />
            </Field>
            <Field label="One-paragraph premise">
              <textarea rows={4} value={data.premise} onChange={e => set({ premise: e.target.value })}
                style={{ ...inp(t), fontFamily: t.display, lineHeight: 1.5 }}
                placeholder="A fallen knight and a goblin squire navigate a welfare system run by feudal bureaucrats..." />
            </Field>
            <Field label="Comparable works (optional, comma-separated)">
              <input value={data.comparisons} onChange={e => set({ comparisons: e.target.value })} style={inp(t)}
                placeholder="Discworld, Dark Souls, Kafka on the Shore" />
            </Field>
            <Field label="Target audience">
              <Chips items={AUDIENCES} selected={[data.targetAudience]} onChange={v => set({ targetAudience: v[0] || 'adult' })} multi={false} t={t} />
            </Field>
          </Section>
        )}

        {step === 3 && (
          <Section title="What flavour?">
            <Field label="Genres (pick any that apply)">
              <Chips items={GENRES} selected={data.genres} onChange={v => set({ genres: v })} multi t={t} />
            </Field>
            <Field label="Sub-genres (optional)">
              <Chips items={SUB_GENRES} selected={data.subGenres} onChange={v => set({ subGenres: v })} multi t={t} />
            </Field>
            <Field label="Tone (pick any)">
              <Chips items={TONES} selected={data.tone} onChange={v => set({ tone: v })} multi t={t} />
            </Field>
            <Field label="POV">
              <Chips items={POVS} selected={data.pov ? [data.pov] : []} onChange={v => set({ pov: v[0] || '' })} multi={false} t={t} />
            </Field>
            <Field label="Tense">
              <Chips items={TENSES} selected={data.tense ? [data.tense] : []} onChange={v => set({ tense: v[0] || '' })} multi={false} t={t} />
            </Field>
          </Section>
        )}

        {step === 4 && (
          <Section title="World rules">
            <p style={pStyle(t)}>The hard limits of your world — the laws of magic, technology, society, anything that would feel like cheating to break. The Loom uses these every time it suggests prose.</p>
            <Field label="Describe the world (one or two paragraphs)">
              <textarea rows={5} value={data.worldRulesText} onChange={e => set({ worldRulesText: e.target.value })}
                style={{ ...inp(t), lineHeight: 1.5 }}
                placeholder="Magic costs life-years. The council is real. Steel rusts in the marsh. ..." />
            </Field>
            <p style={{ ...pStyle(t), fontSize: 13 }}>Tip: one rule per line gets read as a checklist by the AI.</p>
          </Section>
        )}

        {step === 5 && (
          <Section title="Voice & style">
            <Field label="Average chapter length">
              <Chips items={CHAPTER_LENGTHS} selected={[data.chapterLength]} onChange={v => set({ chapterLength: v[0] || 'standard (2.5-5k)' })} multi={false} t={t} />
            </Field>
            <Field label="Dialogue style">
              <Chips items={DIALOGUE_STYLES} selected={[data.dialogueStyle]} onChange={v => set({ dialogueStyle: v[0] || 'naturalistic' })} multi={false} t={t} />
            </Field>
            <Field label="Description density">
              <Chips items={DESCRIPTION_DENSITIES} selected={[data.descriptionDensity]} onChange={v => set({ descriptionDensity: v[0] || 'balanced' })} multi={false} t={t} />
            </Field>
          </Section>
        )}

        {step === 6 && (
          <Section title="Content boundaries">
            <p style={pStyle(t)}>How far the AI is allowed to go when proposing prose.</p>
            <Field label="Profanity">
              <Chips items={LEVELS} selected={[data.profanityLevel]} onChange={v => set({ profanityLevel: v[0] || 'mild' })} multi={false} t={t} />
            </Field>
            <Field label="Violence">
              <Chips items={LEVELS} selected={[data.violenceLevel]} onChange={v => set({ violenceLevel: v[0] || 'mild' })} multi={false} t={t} />
            </Field>
            <Field label="Romance / sexual content">
              <Chips items={LEVELS} selected={[data.romanticContent]} onChange={v => set({ romanticContent: v[0] || 'mild' })} multi={false} t={t} />
            </Field>
          </Section>
        )}

        {step === 7 && (
          <Section title="Pet peeves & favourites">
            <p style={pStyle(t)}>Tell the Loom what to avoid and what to lean into.</p>
            <Field label="Avoid">
              <Chips items={PET_PEEVES} selected={data.petPeeves} onChange={v => set({ petPeeves: v })} multi t={t} />
              <input value={data.customPetPeeves} onChange={e => set({ customPetPeeves: e.target.value })}
                style={{ ...inp(t), marginTop: 8 }}
                placeholder="Anything else, comma separated" />
            </Field>
            <Field label="Lean into">
              <Chips items={FAVORITES} selected={data.favorites} onChange={v => set({ favorites: v })} multi t={t} />
              <input value={data.customFavorites} onChange={e => set({ customFavorites: e.target.value })}
                style={{ ...inp(t), marginTop: 8 }}
                placeholder="Anything else, comma separated" />
            </Field>
          </Section>
        )}

        {step === 8 && (
          <Section title="Style references (optional)">
            <p style={pStyle(t)}>Upload passages from writers whose voice you want to study. Add as many as you like — drop more files at any time. The Loom compares drafts against them.</p>
            <FileDrop t={t} accept=".docx,.pdf,.txt,.md,.markdown,.zip" onFiles={onStyleFiles} busy={busy} />
            {data.styleSamples.length > 0 && (
              <FileList
                t={t}
                items={data.styleSamples}
                onRemove={removeStyleSample}
                label="reference"
              />
            )}
          </Section>
        )}

        {step === 9 && (
          <Section title="Bring in an existing manuscript? (optional)">
            <p style={pStyle(t)}>DOCX, PDF, TXT, Markdown, or a ZIP. Drop as many files as you like — each becomes its own chapter, in upload order. The Loom scans them in the background and surfaces characters, places, and items in the panel review queues.</p>
            <FileDrop t={t} accept=".docx,.pdf,.txt,.md,.markdown,.zip" onFiles={onFiles} busy={busy} />
            {data.importedDocs.length > 0 && (
              <FileList
                t={t}
                items={data.importedDocs}
                onRemove={removeImportedDoc}
                label="document"
                paragraphCount
              />
            )}
          </Section>
        )}

        {step === 10 && (
          <Section title="Plot roadmap (optional)">
            <Field label="Target chapter count">
              <input type="number" min={1} max={120} value={data.targetChapters}
                onChange={e => set({ targetChapters: Math.max(1, Number(e.target.value) || 25) })} style={inp(t)} />
            </Field>
            <Field label="Outline / beats (one per line, optional)">
              <textarea rows={6} value={data.outlineText} onChange={e => set({ outlineText: e.target.value })}
                style={{ ...inp(t), lineHeight: 1.5, fontFamily: t.display }}
                placeholder={`ch.01 — Tom finds the watch\nch.02 — Marlo arrives\nch.03 — the river crossing`} />
            </Field>
          </Section>
        )}

        {step === 11 && (
          <Section title="AI & cadence">
            <p style={{ ...pStyle(t), fontSize: 12 }}>
              Provider + keys live in step 1 (AI keys). This step controls how
              eagerly the Loom speaks and how aggressively it scans your
              imported chapters.
            </p>
            <Field label="How vocal should the Loom be?">
              <Chips items={['quiet', 'medium', 'helpful', 'eager']}
                selected={[data.intrusion]} onChange={v => set({ intrusion: v[0] || 'medium' })} multi={false} t={t} />
              <p style={{ ...pStyle(t), fontSize: 12, marginTop: 6 }}>
                {data.intrusion === 'quiet' && 'Only the most confident noticings.'}
                {data.intrusion === 'medium' && 'A balanced cadence. The default.'}
                {data.intrusion === 'helpful' && 'More margin noticings — good for first drafts.'}
                {data.intrusion === 'eager' && 'Speaks freely. Best for brainstorming.'}
              </p>
            </Field>
            <Field label="Background extraction budget">
              <Chips items={['manual', 'balanced', 'eager']}
                selected={[data.extractionBudget || 'balanced']} onChange={v => set({ extractionBudget: v[0] || 'balanced' })} multi={false} t={t} />
              <p style={{ ...pStyle(t), fontSize: 12, marginTop: 6 }}>
                {(!data.extractionBudget || data.extractionBudget === 'balanced') && 'Auto-scan every imported chapter once, then on each save. Recommended.'}
                {data.extractionBudget === 'manual' && 'Never auto-scan. Use ⌘K → "Re-scan all chapters" when you want it. Cheapest.'}
                {data.extractionBudget === 'eager' && 'Re-scan more often, including deeper passes. Burns more API credits.'}
              </p>
            </Field>
            <Field label="Total target words">
              <input type="number" value={data.targetWords} onChange={e => set({ targetWords: Math.max(1000, Number(e.target.value) || 0) })} style={inp(t)} />
            </Field>
          </Section>
        )}

        {step === 12 && (
          <Section title="Ready">
            <p style={pStyle(t)}>Hit Begin and the room opens with everything wired in.</p>
            <p style={pStyle(t)}>Tip: right-click in prose for the contextual radial. Type @ to mention any character / place / item.</p>
            <p style={pStyle(t)}>You can revise anything you set here from the Settings panel.</p>
          </Section>
        )}

        {renderSectionIO(step)}

        <div style={{ display: 'flex', gap: 8, marginTop: 30, alignItems: 'center' }}>
          {step > 0 && <button onClick={prev} style={btn(t)}>Back</button>}
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12 }}>
            {step === 0 ? '' : step < TOTAL - 1 ? 'Optional — skip if you like' : ''}
          </span>
          {step < TOTAL - 1 ? (
            <button onClick={next} style={btn(t, true)}>Next</button>
          ) : (
            <button onClick={finish} style={btn(t, true)}>Begin →</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  const t = useTheme();
  return (
    <div>
      <h1 style={{ fontFamily: t.display, fontSize: 28, color: t.ink, fontWeight: 500, marginBottom: 18 }}>{title}</h1>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  const t = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}
function Chips({ items, selected, onChange, multi, t }) {
  const toggle = (v) => {
    if (multi) onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
    else onChange([v]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map(v => (
        <button key={v} onClick={() => toggle(v)} style={{
          padding: '6px 12px', borderRadius: 1, cursor: 'pointer',
          background: selected.includes(v) ? t.accent : 'transparent',
          color: selected.includes(v) ? t.onAccent : t.ink2,
          border: `1px solid ${selected.includes(v) ? t.accent : t.rule}`,
          fontFamily: t.display, fontSize: 12, textTransform: 'capitalize',
        }}>{v}</button>
      ))}
    </div>
  );
}
function FileList({ t, items, onRemove, label, paragraphCount }) {
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase' }}>
        {items.length} {label}{items.length > 1 ? 's' : ''} loaded
      </div>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', border: `1px solid ${t.rule}`, borderRadius: 1,
          background: t.paper2,
        }}>
          <div style={{ flex: 1, minWidth: 0, fontFamily: t.display, fontSize: 13, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {it.name || `(unnamed ${label})`}
          </div>
          {paragraphCount && (
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>
              {(it.paragraphs || []).length}p
            </div>
          )}
          <button onClick={() => onRemove(i)} style={{
            padding: '2px 8px', cursor: 'pointer',
            background: 'transparent', color: t.ink3,
            border: `1px solid ${t.rule}`, borderRadius: 1,
            fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase',
          }}>Remove</button>
        </div>
      ))}
    </div>
  );
}

function FileDrop({ t, accept, onFiles, busy }) {
  return (
    <label style={{
      display: 'block', padding: 30, textAlign: 'center', cursor: busy ? 'wait' : 'pointer',
      border: `2px dashed ${t.rule}`, borderRadius: 2, background: busy ? t.paper2 : 'transparent',
    }}>
      <input type="file" multiple accept={accept} onChange={onFiles} style={{ display: 'none' }} disabled={busy} />
      <div style={{ fontFamily: t.display, fontSize: 14, color: busy ? t.ink3 : t.ink2 }}>
        {busy ? 'Reading…' : 'Click or drop files here'}
      </div>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginTop: 4 }}>
        DOCX · PDF · TXT · MD · ZIP
      </div>
    </label>
  );
}
function inp(t) {
  return {
    width: '100%', padding: '8px 10px',
    fontFamily: t.display, fontSize: 14, color: t.ink,
    background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
  };
}
function pStyle(t) {
  return { fontFamily: t.display, fontSize: 16, color: t.ink2, lineHeight: 1.7, marginBottom: 12 };
}
function btn(t, primary) {
  return {
    padding: '10px 18px',
    background: primary ? t.accent : 'transparent',
    color: primary ? t.onAccent : t.ink2,
    border: primary ? 'none' : `1px solid ${t.rule}`,
    borderRadius: 2,
    fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14, textTransform: 'uppercase',
    cursor: 'pointer', fontWeight: 600,
  };
}

// Loomwright — onboarding wizard (plan §19). 9 steps, ending in a populated room.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore, createChapter, createCharacter } from '../store';
import { importFile } from './file-importers';

const GENRES = ['Literary', 'Fantasy', 'Sci-fi', 'Thriller', 'Romance', 'Mystery', 'Horror', 'Historical', 'YA'];
const TONES = ['hopeful', 'dark', 'lyrical', 'plain', 'ironic', 'sincere', 'urgent', 'meditative'];
const POVS = ['1st person', '3rd limited', '3rd omniscient', 'multiple POV'];
const TENSES = ['past', 'present'];

export default function Onboarding({ onDone }) {
  const t = useTheme();
  const store = useStore();
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    workingTitle: '', seriesName: '',
    genre: '', tone: [], pov: '', tense: '',
    targetWords: 90000, premise: '',
    intrusion: 'medium', aiProvider: 'auto',
    importedDocs: [], styleSamples: [],
    seedCast: [],
  });
  const [busy, setBusy] = React.useState(false);

  const next = () => setStep(s => Math.min(8, s + 1));
  const prev = () => setStep(s => Math.max(0, s - 1));

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
      } catch (err) {
        console.warn('Import failed', f.name, err);
      }
    }
    setData(d => ({ ...d, importedDocs: [...d.importedDocs, ...docs] }));
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
    setData(d => ({ ...d, styleSamples: [...d.styleSamples, ...samples] }));
    setBusy(false);
  };

  const finish = async () => {
    store.transaction(({ setSlice, setPath }) => {
      // Profile.
      setPath('profile.onboarded', true);
      setPath('profile.workingTitle', data.workingTitle);
      setPath('profile.seriesName', data.seriesName);
      setPath('profile.genre', (data.genre || '').toLowerCase());
      setPath('profile.tone', data.tone);
      setPath('profile.pov', data.pov);
      setPath('profile.tense', data.tense);
      setPath('profile.targetWords', data.targetWords);
      setPath('profile.premise', data.premise);
      setPath('profile.intrusion', data.intrusion);
      setPath('profile.aiProvider', data.aiProvider);
      // Book.
      setPath('book.title', data.workingTitle || 'Untitled');
      setPath('book.series', data.seriesName || null);
      setPath('book.target', Math.round((data.targetWords || 80000) / 30) || 2500);
      setPath('book.totalChapters', 25);
      setPath('book.createdAt', Date.now());
      // Seed cast.
      for (const c of data.seedCast) {
        if (c.name) createCharacter({ setSlice }, { name: c.name, role: c.role || 'support', oneliner: c.oneliner || '' });
      }
    });

    // Imported documents become chapters (one chapter per doc).
    if (data.importedDocs.length > 0) {
      data.importedDocs.forEach((doc, i) => {
        const text = doc.paragraphs.map(p => p.text).join('\n\n');
        createChapter(store, {
          title: doc.name.replace(/\.[^.]+$/, '') || `Chapter ${i + 1}`,
          text,
          paragraphs: doc.paragraphs,
        });
      });
    } else {
      // Always seed at least an empty chapter.
      createChapter(store, { title: 'Chapter 1', text: '' });
    }

    // Imported style samples → voice profile narrator slot.
    if (data.styleSamples.length > 0) {
      const narratorSamples = data.styleSamples.flatMap(s => s.paragraphs).map(p => p.text);
      store.setSlice('voice', vs => {
        const arr = vs || [];
        const i = arr.findIndex(v => v.characterId === 'narrator');
        const next = { id: 'voice_narrator', characterId: 'narrator', samples: narratorSamples.map(t => ({ text: t, at: Date.now() })) };
        if (i >= 0) return arr.map((x, j) => j === i ? { ...x, ...next } : x);
        return [...arr, next];
      });
    }

    onDone?.();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: t.bg,
      display: 'grid', placeItems: 'center',
      overflowY: 'auto',
    }}>
      <div style={{
        width: 'min(100%, 720px)', padding: 40, color: t.ink,
        fontFamily: t.display,
      }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: PANEL_ACCENT.loom,
          letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
        }}>Loomwright · Step {step + 1} of 9</div>
        <div style={{ height: 2, background: t.rule, marginBottom: 24, borderRadius: 1 }}>
          <div style={{
            width: `${((step + 1) / 9) * 100}%`, height: '100%',
            background: PANEL_ACCENT.loom, transition: 'width 200ms',
          }} />
        </div>

        {step === 0 && (
          <Section title="Welcome">
            <p style={pStyle(t)}>Loomwright is a writers room. As you write, the manuscript becomes a living wiki of people, places, items, threads, and voices — surfaced quietly in the margins.</p>
            <p style={pStyle(t)}>Let me get to know your story.</p>
          </Section>
        )}
        {step === 1 && (
          <Section title="What is your story called?">
            <Field label="Working title">
              <input value={data.workingTitle} onChange={e => setData(d => ({ ...d, workingTitle: e.target.value }))} style={inpStyle(t)} placeholder="Untitled" autoFocus />
            </Field>
            <Field label="Series name (optional)">
              <input value={data.seriesName} onChange={e => setData(d => ({ ...d, seriesName: e.target.value }))} style={inpStyle(t)} />
            </Field>
            <Field label="Premise (optional)">
              <textarea rows={3} value={data.premise} onChange={e => setData(d => ({ ...d, premise: e.target.value }))} style={{ ...inpStyle(t), fontFamily: t.display, lineHeight: 1.5 }} placeholder="A few sentences…" />
            </Field>
          </Section>
        )}
        {step === 2 && (
          <Section title="What flavour?">
            <Field label="Genre">
              <Chips items={GENRES} selected={data.genre ? [data.genre] : []} onChange={v => setData(d => ({ ...d, genre: v[0] || '' }))} multi={false} t={t} />
            </Field>
            <Field label="Tone">
              <Chips items={TONES} selected={data.tone} onChange={v => setData(d => ({ ...d, tone: v }))} multi={true} t={t} />
            </Field>
            <Field label="POV">
              <Chips items={POVS} selected={data.pov ? [data.pov] : []} onChange={v => setData(d => ({ ...d, pov: v[0] || '' }))} multi={false} t={t} />
            </Field>
            <Field label="Tense">
              <Chips items={TENSES} selected={data.tense ? [data.tense] : []} onChange={v => setData(d => ({ ...d, tense: v[0] || '' }))} multi={false} t={t} />
            </Field>
          </Section>
        )}
        {step === 3 && (
          <Section title="Style references (optional)">
            <p style={pStyle(t)}>Upload books or chapters whose voice you want to study. The Loom can compare against them.</p>
            <FileDrop t={t} accept=".docx,.pdf,.txt,.md,.markdown,.zip" onFiles={onStyleFiles} busy={busy} />
            {data.styleSamples.length > 0 && (
              <div style={{ marginTop: 10, fontFamily: t.mono, fontSize: 10, color: t.ink2 }}>
                {data.styleSamples.length} reference{data.styleSamples.length > 1 ? 's' : ''} loaded
              </div>
            )}
          </Section>
        )}
        {step === 4 && (
          <Section title="Bring in an existing manuscript?">
            <p style={pStyle(t)}>Optional. DOCX, PDF, TXT, Markdown, or a ZIP of any of those. Imports become chapters; entities you have not added yet appear as suggestions in the margin.</p>
            <FileDrop t={t} accept=".docx,.pdf,.txt,.md,.markdown,.zip" onFiles={onFiles} busy={busy} />
            {data.importedDocs.length > 0 && (
              <div style={{ marginTop: 10, fontFamily: t.mono, fontSize: 10, color: t.ink2 }}>
                {data.importedDocs.length} document{data.importedDocs.length > 1 ? 's' : ''} ready ·{' '}
                {data.importedDocs.reduce((n, d) => n + d.paragraphs.length, 0)} paragraphs
              </div>
            )}
          </Section>
        )}
        {step === 5 && (
          <Section title="How vocal should the Loom be?">
            <Chips
              items={['quiet', 'medium', 'helpful', 'eager']}
              selected={[data.intrusion]}
              onChange={v => setData(d => ({ ...d, intrusion: v[0] || 'medium' }))}
              multi={false} t={t}
            />
            <p style={{ ...pStyle(t), marginTop: 14, fontSize: 13 }}>
              {data.intrusion === 'quiet' && 'Only the most confident noticings will appear. Best for a finished manuscript.'}
              {data.intrusion === 'medium' && 'A balanced cadence. The default.'}
              {data.intrusion === 'helpful' && 'More margin noticings — good for first drafts.'}
              {data.intrusion === 'eager' && 'The Loom speaks freely. Best for brainstorming.'}
            </p>
          </Section>
        )}
        {step === 6 && (
          <Section title="AI provider">
            <Chips
              items={['auto', 'anthropic', 'openai', 'gemini', 'offline']}
              selected={[data.aiProvider]}
              onChange={v => setData(d => ({ ...d, aiProvider: v[0] || 'auto' }))}
              multi={false} t={t}
            />
            <p style={{ ...pStyle(t), fontSize: 13 }}>
              You can change this later in Settings, and add API keys when you are ready.
            </p>
          </Section>
        )}
        {step === 7 && (
          <Section title="Word count goal">
            <Field label="Target words for this book">
              <input type="number" value={data.targetWords} onChange={e => setData(d => ({ ...d, targetWords: Number(e.target.value) || 0 }))} style={inpStyle(t)} />
            </Field>
            <p style={{ ...pStyle(t), fontSize: 13 }}>
              We will divide that across chapters and surface a daily target in the ritual bar.
            </p>
          </Section>
        )}
        {step === 8 && (
          <Section title="One last thing">
            <p style={pStyle(t)}>You are ready. Hit Begin and the room will open.</p>
            <p style={pStyle(t)}>Tip: right-click anywhere in the prose for a contextual radial menu.</p>
          </Section>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 30 }}>
          {step > 0 && (
            <button onClick={prev} style={btnStyle(t)}>Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < 8 ? (
            <button onClick={next} style={btnStyle(t, true)}>Next</button>
          ) : (
            <button onClick={finish} style={btnStyle(t, true)}>Begin →</button>
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
    if (multi) {
      onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
    } else {
      onChange([v]);
    }
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
function FileDrop({ t, accept, onFiles, busy }) {
  return (
    <label style={{
      display: 'block', padding: 30, textAlign: 'center', cursor: busy ? 'wait' : 'pointer',
      border: `2px dashed ${t.rule}`, borderRadius: 2,
      background: busy ? t.paper2 : 'transparent',
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
function inpStyle(t) {
  return {
    width: '100%', padding: '8px 10px',
    fontFamily: t.display, fontSize: 14, color: t.ink,
    background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
  };
}
function pStyle(t) {
  return { fontFamily: t.display, fontSize: 16, color: t.ink2, lineHeight: 1.7, marginBottom: 12 };
}
function btnStyle(t, primary) {
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

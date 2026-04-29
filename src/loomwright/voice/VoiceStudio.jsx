/**
 * Voice Studio — tune / compare / assign / teach voice profiles.
 *
 * Persistence model (additive on worldState):
 *   worldState.books[bookId].voiceProfiles = [{ id, name, subtitle, sliders, sample }]
 *   worldState.books[bookId].chapters[i].voiceProfileId = '<id>'
 *
 * History is kept in localStorage under 'lw-voice-history-<bookId>'.
 */

import React, { useEffect, useMemo, useState } from 'react';
import LoomwrightShell from '../LoomwrightShell';
import { useTheme, ThemeToggle } from '../theme';
import Button from '../primitives/Button';
import Icon from '../primitives/Icon';
import {
  VOICE_DIMENSIONS,
  DEFAULT_SLIDERS,
  defaultProfile,
  rewriteInVoice,
  deriveSlidersFromSample,
} from './voiceAI';

const MODES = [
  { id: 'tune',    label: 'Tune'   },
  { id: 'compare', label: 'A / B'  },
  { id: 'assign',  label: 'Assign' },
  { id: 'teach',   label: 'Teach'  },
];

const HISTORY_KEY = (bookId) => `lw-voice-history-${bookId}`;

function loadHistory(bookId) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY(bookId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveHistory(bookId, list) {
  try {
    localStorage.setItem(HISTORY_KEY(bookId), JSON.stringify(list.slice(0, 30)));
  } catch {
    /* ignore */
  }
}

function useBookCtx(worldState) {
  const ids = Object.keys(worldState?.books || {}).map(Number).sort((a, b) => a - b);
  const [bookId, setBookId] = useState(ids[ids.length - 1] || 1);
  useEffect(() => {
    if (ids.length && !ids.includes(bookId)) setBookId(ids[ids.length - 1]);
  }, [ids.join(','), bookId]);
  const book = worldState?.books?.[bookId] || null;
  return { bookId, setBookId, ids, book };
}

function Slider({ dim, value, onChange, small }) {
  const t = useTheme();
  const v = value ?? 50;
  return (
    <div style={{ marginBottom: small ? 6 : 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: t.mono,
          fontSize: 9,
          color: t.ink3,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        <span style={{ color: t.ink }}>{dim.label}</span>
        <span>
          {dim.low} \u2022 {dim.high}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: t.accent }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: t.mono,
          fontSize: 8,
          color: t.ink3,
        }}
      >
        <span>0</span>
        <span style={{ color: t.accent }}>{v}</span>
        <span>100</span>
      </div>
    </div>
  );
}

function Sidebar({ profiles, active, onPick, onNew, onDuplicate, onDelete, history }) {
  const t = useTheme();
  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        background: t.sidebar,
        borderRight: `1px solid ${t.rule}`,
        padding: '18px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflowY: 'auto',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.accent,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
          }}
        >
          Loomwright
        </div>
        <div style={{ fontFamily: t.display, fontSize: 18, fontWeight: 500, color: t.ink }}>
          Voice Studio
        </div>
      </div>
      <Button variant="primary" onClick={onNew} icon={<Icon name="plus" size={12} />}>
        New profile
      </Button>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 9,
          color: t.ink3,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
          marginTop: 4,
        }}
      >
        Profiles \u00B7 {profiles.length}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {profiles.map((p) => {
          const isActive = p.id === active;
          return (
            <div
              key={p.id}
              style={{
                padding: '8px 10px',
                background: isActive ? t.paper : 'transparent',
                border: isActive ? `1px solid ${t.accent}` : `1px solid ${t.rule}`,
                borderRadius: t.radius,
                cursor: 'pointer',
                color: t.ink,
              }}
              onClick={() => onPick(p.id)}
            >
              <div style={{ fontFamily: t.display, fontSize: 13, fontWeight: 500 }}>{p.name}</div>
              {p.subtitle && (
                <div
                  style={{
                    fontFamily: t.mono,
                    fontSize: 9,
                    color: t.ink3,
                    letterSpacing: 0.1,
                    marginTop: 2,
                  }}
                >
                  {p.subtitle}
                </div>
              )}
              {isActive && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDuplicate(p); }}>
                    Duplicate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}>
                    Delete
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 9,
          color: t.ink3,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
          marginTop: 10,
        }}
      >
        History
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {history.length === 0 ? (
          <div style={{ color: t.ink3, fontSize: 11 }}>No edits yet.</div>
        ) : (
          history.slice(0, 6).map((h) => (
            <div
              key={h.id}
              style={{
                fontSize: 11,
                color: t.ink2,
                padding: '4px 6px',
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
              }}
            >
              <div
                style={{
                  fontFamily: t.mono,
                  fontSize: 9,
                  color: t.ink3,
                  letterSpacing: 0.1,
                }}
              >
                {new Date(h.when).toLocaleTimeString()}
              </div>
              {h.label}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function TuneMode({ profile, setSliders, sample, setSample, preview, rewriting, onRewrite, onRename, onSave }) {
  const t = useTheme();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 18, overflowY: 'auto' }}>
      <div>
        <input
          value={profile.name}
          onChange={(e) => onRename(e.target.value)}
          style={{
            width: '100%',
            background: 'transparent',
            border: `1px solid ${t.rule}`,
            color: t.ink,
            padding: '8px 10px',
            fontFamily: t.display,
            fontSize: 20,
            fontWeight: 500,
            borderRadius: t.radius,
            boxSizing: 'border-box',
            marginBottom: 10,
          }}
        />
        <div style={{ background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius, padding: 12 }}>
          {VOICE_DIMENSIONS.map((d) => (
            <Slider
              key={d.key}
              dim={d}
              value={profile.sliders?.[d.key]}
              onChange={(v) => setSliders({ ...profile.sliders, [d.key]: v })}
            />
          ))}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
          <Button variant="primary" onClick={onRewrite} disabled={rewriting} icon={<Icon name="sparkle" size={12} />}>
            {rewriting ? 'Rewriting\u2026' : 'Rewrite sample'}
          </Button>
          <Button onClick={onSave}>Save profile</Button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.accent,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Source passage
          </div>
          <textarea
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              background: t.paper,
              border: `1px solid ${t.rule}`,
              color: t.ink,
              padding: 12,
              borderRadius: t.radius,
              fontFamily: t.font,
              fontSize: 13,
              lineHeight: 1.6,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.accent,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Rewritten in this voice
          </div>
          <div
            style={{
              background: t.paper,
              border: `1px solid ${t.accent}`,
              color: t.ink,
              padding: 12,
              borderRadius: t.radius,
              fontFamily: t.display,
              fontSize: 14,
              lineHeight: 1.7,
              minHeight: 140,
              fontStyle: 'italic',
            }}
          >
            {preview || '(click "Rewrite sample" to preview)'}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareMode({ profile, profiles, sample }) {
  const t = useTheme();
  const [leftId, setLeftId] = useState(profile?.id);
  const [rightId, setRightId] = useState(profiles.find((p) => p.id !== profile?.id)?.id || profile?.id);
  const [leftPreview, setLeftPreview] = useState('');
  const [rightPreview, setRightPreview] = useState('');
  const [working, setWorking] = useState(false);

  const run = async () => {
    setWorking(true);
    const l = profiles.find((p) => p.id === leftId);
    const r = profiles.find((p) => p.id === rightId);
    const [lp, rp] = await Promise.all([
      rewriteInVoice(sample, l?.sliders || DEFAULT_SLIDERS),
      rewriteInVoice(sample, r?.sliders || DEFAULT_SLIDERS),
    ]);
    setLeftPreview(lp);
    setRightPreview(rp);
    setWorking(false);
  };

  const Pane = ({ id, setId, preview }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <select
        value={id || ''}
        onChange={(e) => setId(e.target.value)}
        style={{
          padding: '6px 10px',
          background: t.paper2,
          color: t.ink,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          fontFamily: t.mono,
          fontSize: 11,
        }}
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <div
        style={{
          background: t.paper,
          border: `1px solid ${t.rule}`,
          color: t.ink,
          padding: 14,
          borderRadius: t.radius,
          fontFamily: t.display,
          fontSize: 14,
          lineHeight: 1.7,
          minHeight: 240,
          fontStyle: 'italic',
        }}
      >
        {preview || '(run to preview)'}
      </div>
    </div>
  );

  return (
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
      <div>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.accent,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
          }}
        >
          Source passage
        </div>
        <div
          style={{
            fontFamily: t.display,
            fontSize: 14,
            color: t.ink2,
            fontStyle: 'italic',
            marginTop: 4,
            lineHeight: 1.6,
          }}
        >
          {sample || '(no sample set)'}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Pane id={leftId} setId={setLeftId} preview={leftPreview} />
        <Pane id={rightId} setId={setRightId} preview={rightPreview} />
      </div>
      <div>
        <Button variant="primary" onClick={run} disabled={working} icon={<Icon name="sparkle" size={12} />}>
          {working ? 'Rewriting\u2026' : 'Rewrite both'}
        </Button>
      </div>
    </div>
  );
}

function AssignMode({ profiles, book, onAssign }) {
  const t = useTheme();
  const chapters = book?.chapters || [];
  if (!chapters.length) {
    return (
      <div style={{ padding: 24, color: t.ink3, fontSize: 13 }}>
        No chapters in this book yet.
      </div>
    );
  }
  return (
    <div style={{ padding: 18, overflowY: 'auto' }}>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 10,
          color: t.accent,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Chapter \u2192 voice assignments
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {chapters.map((ch) => (
          <div
            key={ch.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 200px',
              gap: 10,
              alignItems: 'center',
              padding: 10,
              background: t.paper,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
            }}
          >
            <span style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.12 }}>
              CH.{String(ch.id).padStart(2, '0')}
            </span>
            <div
              style={{
                fontFamily: t.display,
                fontSize: 13,
                color: t.ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {ch.title || '(untitled)'}
            </div>
            <select
              value={ch.voiceProfileId || ''}
              onChange={(e) => onAssign(ch.id, e.target.value || null)}
              style={{
                padding: '6px 8px',
                background: t.paper2,
                color: t.ink,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                fontFamily: t.mono,
                fontSize: 11,
              }}
            >
              <option value="">(none)</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeachMode({ onDerive, teachSample, setTeachSample, derived }) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    await onDerive();
    setBusy(false);
  };
  return (
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 10,
          color: t.accent,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
        }}
      >
        Teach a voice from a sample
      </div>
      <p style={{ color: t.ink2, lineHeight: 1.6, margin: 0, fontSize: 13 }}>
        Paste a paragraph from your work in the target voice. The model will estimate values
        for each dimension; you can then save the result as a new profile.
      </p>
      <textarea
        value={teachSample}
        onChange={(e) => setTeachSample(e.target.value)}
        rows={8}
        style={{
          background: t.paper,
          border: `1px solid ${t.rule}`,
          color: t.ink,
          padding: 12,
          borderRadius: t.radius,
          fontFamily: t.font,
          fontSize: 13,
          lineHeight: 1.6,
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <div>
        <Button variant="primary" onClick={run} disabled={busy || !teachSample.trim()} icon={<Icon name="sparkle" size={12} />}>
          {busy ? 'Estimating\u2026' : 'Estimate voice'}
        </Button>
      </div>
      {derived && (
        <div style={{ background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius, padding: 14 }}>
          {VOICE_DIMENSIONS.map((d) => (
            <Slider key={d.key} dim={d} value={derived[d.key]} onChange={() => {}} small />
          ))}
        </div>
      )}
    </div>
  );
}

function StudioBody({ worldState, setWorldState }) {
  const t = useTheme();
  const { bookId, book } = useBookCtx(worldState);
  const profiles = book?.voiceProfiles || [];
  const [activeId, setActiveId] = useState(null);
  const [mode, setMode] = useState('tune');
  const [sample, setSample] = useState('');
  const [preview, setPreview] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [teachSample, setTeachSample] = useState('');
  const [derived, setDerived] = useState(null);
  const [history, setHistory] = useState(() => loadHistory(bookId));

  // Seed a default profile if empty
  useEffect(() => {
    if (!book) return;
    if ((book.voiceProfiles || []).length === 0) {
      const prof = defaultProfile('seed');
      prof.name = 'Default voice';
      prof.subtitle = 'Starting point';
      prof.sample = sample || book.chapters?.[0]?.summary || 'A single line of prose to rewrite.';
      persistProfiles([prof]);
      setActiveId(prof.id);
    } else if (!activeId) {
      setActiveId(book.voiceProfiles[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id, (book?.voiceProfiles || []).length]);

  // Pull in sample from current chapter or active profile
  useEffect(() => {
    const prof = profiles.find((p) => p.id === activeId);
    if (!prof) return;
    if (prof.sample) setSample(prof.sample);
    else if (book?.chapters?.[0]?.text) setSample(book.chapters[0].text.slice(0, 400));
    else setSample('A single line of prose to rewrite.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => setHistory(loadHistory(bookId)), [bookId]);

  const profile = profiles.find((p) => p.id === activeId) || profiles[0] || defaultProfile('fallback');

  const persistProfiles = (next) => {
    const nextBooks = {
      ...worldState.books,
      [bookId]: {
        ...book,
        voiceProfiles: next,
      },
    };
    setWorldState?.((prev) => ({ ...prev, books: nextBooks }));
  };

  const persistChapter = (chapterId, voiceProfileId) => {
    const nextChapters = book.chapters.map((c) =>
      c.id === chapterId ? { ...c, voiceProfileId } : c
    );
    const nextBooks = {
      ...worldState.books,
      [bookId]: { ...book, chapters: nextChapters },
    };
    setWorldState?.((prev) => ({ ...prev, books: nextBooks }));
  };

  const updateActive = (patch) => {
    if (!profile) return;
    const nextProfiles = profiles.map((p) =>
      p.id === profile.id ? { ...p, ...patch } : p
    );
    persistProfiles(nextProfiles);
  };

  const setSliders = (sliders) => updateActive({ sliders });
  const setName = (name) => updateActive({ name });

  const saveProfile = () => {
    // Just pushes a history entry — persistence is live on every change
    const entry = {
      id: `h_${Date.now()}`,
      when: Date.now(),
      label: `${profile.name} saved`,
    };
    const next = [entry, ...history];
    setHistory(next);
    saveHistory(bookId, next);
  };

  const onRewrite = async () => {
    if (!sample.trim()) return;
    setRewriting(true);
    const out = await rewriteInVoice(sample, profile.sliders);
    setPreview(out);
    updateActive({ sample });
    const entry = {
      id: `h_${Date.now()}`,
      when: Date.now(),
      label: `${profile.name} rewrote sample`,
    };
    const next = [entry, ...history];
    setHistory(next);
    saveHistory(bookId, next);
    setRewriting(false);
  };

  const newProfile = () => {
    const p = defaultProfile('new');
    p.name = 'New voice';
    const next = [...profiles, p];
    persistProfiles(next);
    setActiveId(p.id);
  };
  const duplicate = (src) => {
    const p = { ...src, id: defaultProfile('dup').id, name: src.name + ' (copy)' };
    const next = [...profiles, p];
    persistProfiles(next);
    setActiveId(p.id);
  };
  const remove = (id) => {
    const next = profiles.filter((p) => p.id !== id);
    persistProfiles(next);
    if (activeId === id) setActiveId(next[0]?.id || null);
  };

  const derive = async () => {
    const out = await deriveSlidersFromSample(teachSample);
    setDerived(out);
    // Auto-create profile from derived
    const p = defaultProfile('taught');
    p.name = 'Taught voice';
    p.subtitle = 'Derived from sample';
    p.sliders = out;
    p.sample = teachSample.slice(0, 600);
    persistProfiles([...profiles, p]);
    setActiveId(p.id);
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <Sidebar
        profiles={profiles}
        active={activeId}
        onPick={setActiveId}
        onNew={newProfile}
        onDuplicate={duplicate}
        onDelete={remove}
        history={history}
      />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${t.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              style={{
                padding: '6px 12px',
                background: mode === m.id ? t.accent : 'transparent',
                color: mode === m.id ? t.onAccent : t.ink2,
                border: `1px solid ${mode === m.id ? t.accent : t.rule}`,
                borderRadius: t.radius,
                fontFamily: t.mono,
                fontSize: 10,
                letterSpacing: 0.12,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <ThemeToggle />
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {mode === 'tune' && (
              <TuneMode
                profile={profile}
                setSliders={setSliders}
                sample={sample}
                setSample={setSample}
                preview={preview}
                rewriting={rewriting}
                onRewrite={onRewrite}
                onRename={setName}
                onSave={saveProfile}
              />
            )}
            {mode === 'compare' && (
              <CompareMode profile={profile} profiles={profiles} sample={sample} />
            )}
            {mode === 'assign' && (
              <AssignMode
                profiles={profiles}
                book={book}
                onAssign={persistChapter}
              />
            )}
            {mode === 'teach' && (
              <TeachMode
                teachSample={teachSample}
                setTeachSample={setTeachSample}
                onDerive={derive}
                derived={derived}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VoiceStudio(props) {
  return (
    <LoomwrightShell scrollable={false}>
      <StudioBody {...props} />
    </LoomwrightShell>
  );
}

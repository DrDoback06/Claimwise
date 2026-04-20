/**
 * Interview Mode — solo or group chat with characters, prompt deck, saved quotes.
 *
 * Persistence:
 *   Saved quotes are stored per-actor under actor.savedQuotes = [{ id, q, a, at, chapterId? }].
 *   Group transcripts are session-scoped (not persisted).
 */

import React, { useMemo, useRef, useState } from 'react';
import LoomwrightShell from '../LoomwrightShell';
import { useTheme, ThemeToggle } from '../theme';
import Icon from '../primitives/Icon';
import Button from '../primitives/Button';
import { askActor, askGroup, PROMPT_DECK } from './interviewAI';

const MODES = [
  { id: 'solo',  label: 'Solo'  },
  { id: 'group', label: 'Group' },
  { id: 'saved', label: 'Saved' },
];

function Bubble({ m, color }) {
  const t = useTheme();
  const self = m.from === 'interviewer';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: self ? 'flex-end' : 'flex-start',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: '75%',
          padding: '10px 14px',
          background: self ? t.accent : t.paper,
          color: self ? t.onAccent : t.ink,
          border: self ? `1px solid ${t.accent}` : `1px solid ${t.rule}`,
          borderRadius: t.radius,
          fontFamily: self ? t.mono : t.display,
          fontSize: self ? 11 : 14,
          lineHeight: 1.6,
          fontStyle: self ? 'normal' : 'italic',
          letterSpacing: self ? 0.08 : 0,
          textTransform: self ? 'uppercase' : 'none',
        }}
      >
        {m.speaker && !self && (
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 9,
              color: color || t.accent,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
              marginBottom: 3,
              fontStyle: 'normal',
            }}
          >
            {m.speaker}
          </div>
        )}
        <div>{m.text}</div>
      </div>
    </div>
  );
}

function SoloChat({ actor, worldState, onSave }) {
  const t = useTheme();
  const [transcript, setTranscript] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottom = useRef(null);

  if (!actor) return <div style={{ padding: 20, color: t.ink3 }}>Pick a character from the sidebar.</div>;

  const ask = async (question) => {
    if (!question.trim()) return;
    const q = { from: 'interviewer', speaker: 'You', text: question };
    const next = [...transcript, q];
    setTranscript(next);
    setInput('');
    setBusy(true);
    const a = await askActor(actor, question, worldState, transcript);
    const reply = { from: 'actor', speaker: actor.name, text: a };
    setTranscript((cur) => [...cur, reply]);
    setBusy(false);
    setTimeout(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
          Interview
        </div>
        <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 500, color: t.ink, marginBottom: 16 }}>
          {actor.name}
        </div>
        {transcript.map((m, i) => (
          <Bubble key={i} m={m} />
        ))}
        {busy && (
          <div style={{ color: t.ink3, fontSize: 12, fontFamily: t.mono, fontStyle: 'italic' }}>
            {actor.name} is thinking\u2026
          </div>
        )}
        <div ref={bottom} />
      </div>
      <div style={{ padding: '10px 20px', borderTop: `1px solid ${t.rule}` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {PROMPT_DECK.slice(0, 6).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => ask(p.label)}
              style={{
                padding: '3px 8px',
                background: 'transparent',
                color: t.ink2,
                border: `1px solid ${t.rule}`,
                borderRadius: 2,
                fontFamily: t.mono,
                fontSize: 9,
                letterSpacing: 0.12,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), ask(input))}
            placeholder={`Ask ${actor.name}\u2026`}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: t.paper,
              color: t.ink,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
              fontFamily: t.font,
              fontSize: 14,
            }}
          />
          <Button variant="primary" onClick={() => ask(input)} disabled={busy || !input.trim()} icon={<Icon name="sparkle" size={12} />}>
            Ask
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (transcript.length < 2) return;
              const lastPair = transcript.slice(-2);
              if (lastPair[0]?.from === 'interviewer' && lastPair[1]?.from === 'actor') {
                onSave?.({
                  id: `q_${Date.now()}`,
                  q: lastPair[0].text,
                  a: lastPair[1].text,
                  at: Date.now(),
                });
              }
            }}
            disabled={transcript.length < 2}
            icon={<Icon name="bookmark" size={12} />}
          >
            Save quote
          </Button>
        </div>
      </div>
    </div>
  );
}

function GroupChat({ cast, worldState }) {
  const t = useTheme();
  const [director, setDirector] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottom = useRef(null);
  if (cast.length === 0) return <div style={{ padding: 20, color: t.ink3 }}>Select at least one character (hold Ctrl/Cmd to multi-select).</div>;
  const ask = async () => {
    if (!input.trim()) return;
    const q = { from: 'interviewer', speaker: 'You', text: input };
    setTranscript((cur) => [...cur, q]);
    setInput('');
    setBusy(true);
    const r = await askGroup(cast, input, worldState, transcript, director);
    // Parse by simple "NAME: reply" lines
    r.split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const m = line.match(/^([A-Z][\w \-'\u2019]+):\s*(.+)$/);
        if (m) {
          setTranscript((cur) => [...cur, { from: 'actor', speaker: m[1], text: m[2] }]);
        } else {
          setTranscript((cur) => [...cur, { from: 'actor', speaker: '', text: line }]);
        }
      });
    setBusy(false);
    setTimeout(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
          Group interview \u00B7 {cast.map((a) => a.name).join(', ')}
        </div>
        <input
          value={director}
          onChange={(e) => setDirector(e.target.value)}
          placeholder="Director note (e.g. 'Tensions are high; they've just lost Greymouth')..."
          style={{
            width: '100%',
            margin: '10px 0 16px',
            padding: '8px 12px',
            background: t.paper,
            color: t.ink,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            fontFamily: t.font,
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
        {transcript.map((m, i) => (
          <Bubble key={i} m={m} />
        ))}
        {busy && (
          <div style={{ color: t.ink3, fontSize: 12, fontFamily: t.mono, fontStyle: 'italic' }}>
            the table is talking\u2026
          </div>
        )}
        <div ref={bottom} />
      </div>
      <div style={{ padding: '10px 20px', borderTop: `1px solid ${t.rule}`, display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), ask())}
          placeholder="Ask the group\u2026"
          style={{
            flex: 1,
            padding: '10px 14px',
            background: t.paper,
            color: t.ink,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            fontFamily: t.font,
            fontSize: 14,
          }}
        />
        <Button variant="primary" onClick={ask} disabled={busy || !input.trim()} icon={<Icon name="sparkle" size={12} />}>
          Ask
        </Button>
      </div>
    </div>
  );
}

function SavedView({ actors }) {
  const t = useTheme();
  const all = useMemo(() => {
    const out = [];
    actors.forEach((a) => {
      (a.savedQuotes || []).forEach((q) => out.push({ actor: a.name, actorId: a.id, ...q }));
    });
    return out.sort((x, y) => y.at - x.at);
  }, [actors]);
  if (!all.length) return <div style={{ padding: 20, color: t.ink3 }}>No saved quotes yet.</div>;
  return (
    <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {all.map((q) => (
        <div
          key={q.id}
          style={{
            padding: 12,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
          }}
        >
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.accent,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
            }}
          >
            {q.actor}
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 11, color: t.ink3, marginTop: 4 }}>
            Q: {q.q}
          </div>
          <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, lineHeight: 1.6, marginTop: 6, fontStyle: 'italic' }}>
            {q.a}
          </div>
        </div>
      ))}
    </div>
  );
}

function InterviewBody({ worldState, setWorldState }) {
  const t = useTheme();
  const actors = worldState?.actors || [];
  const [mode, setMode] = useState('solo');
  const [soloId, setSoloId] = useState(actors[0]?.id || null);
  const [groupIds, setGroupIds] = useState([]);
  const soloActor = actors.find((a) => a.id === soloId);
  const groupActors = actors.filter((a) => groupIds.includes(a.id));

  const saveQuote = (q) => {
    if (!soloId) return;
    setWorldState?.((prev) => ({
      ...prev,
      actors: prev.actors.map((a) =>
        a.id === soloId ? { ...a, savedQuotes: [q, ...(a.savedQuotes || [])] } : a
      ),
    }));
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: t.sidebar,
          borderRight: `1px solid ${t.rule}`,
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
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
          <div style={{ fontFamily: t.display, fontSize: 16, color: t.ink }}>
            Interview Mode
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 3, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              style={{
                flex: 1,
                padding: '6px 8px',
                background: mode === m.id ? t.accent : 'transparent',
                color: mode === m.id ? t.onAccent : t.ink2,
                border: 'none',
                borderRadius: 2,
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
        </div>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 9,
            color: t.ink3,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
          }}
        >
          Cast \u00B7 {actors.length}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {actors.map((a) => {
            const isSolo = soloId === a.id;
            const inGroup = groupIds.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={(e) => {
                  if (mode === 'group') {
                    setGroupIds((cur) =>
                      cur.includes(a.id) ? cur.filter((x) => x !== a.id) : [...cur, a.id]
                    );
                  } else {
                    setSoloId(a.id);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  background:
                    mode === 'group'
                      ? inGroup
                        ? t.accentSoft
                        : 'transparent'
                      : isSolo
                      ? t.paper
                      : 'transparent',
                  borderLeft:
                    mode === 'group'
                      ? inGroup
                        ? `2px solid ${t.accent}`
                        : '2px solid transparent'
                      : isSolo
                      ? `2px solid ${t.accent}`
                      : '2px solid transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: t.ink,
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: t.accent,
                    borderRadius: '50%',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: t.display,
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.name}
                  </div>
                  {a.role && (
                    <div
                      style={{
                        fontFamily: t.mono,
                        fontSize: 9,
                        color: t.ink3,
                        letterSpacing: 0.1,
                        textTransform: 'uppercase',
                      }}
                    >
                      {a.role}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '10px 20px',
            borderBottom: `1px solid ${t.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
            {mode === 'solo'
              ? `Solo \u00B7 ${soloActor?.name || '\u2014'}`
              : mode === 'group'
              ? `Group \u00B7 ${groupActors.length} selected`
              : 'Saved quotes'}
          </div>
          <div style={{ flex: 1 }} />
          <ThemeToggle />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {mode === 'solo' && (
            <SoloChat actor={soloActor} worldState={worldState} onSave={saveQuote} />
          )}
          {mode === 'group' && <GroupChat cast={groupActors} worldState={worldState} />}
          {mode === 'saved' && <SavedView actors={actors} />}
        </div>
      </main>
    </div>
  );
}

export { InterviewBody };

export default function InterviewMode(props) {
  return (
    <LoomwrightShell scrollable={false}>
      <InterviewBody {...props} />
    </LoomwrightShell>
  );
}

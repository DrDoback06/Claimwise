/**
 * Canon Weaver — the mass-integration engine.
 * Stages: hub -> capture -> analyzing -> review -> applied.
 *
 * Wires to real Claimwise data:
 *   - Reads worldState.books[bookId].chapters, worldState.actors, worldState.plotThreads
 *   - On apply, dispatches edits into worldState via onPatchWorldState
 *   - History persisted to localStorage under 'lw-weaver-history'
 */

import React, { useEffect, useMemo, useState } from 'react';
import LoomwrightShell from '../LoomwrightShell';
import { useTheme, ThemeToggle } from '../theme';
import Icon from '../primitives/Icon';
import Button from '../primitives/Button';
import { proposeWeave, SYSTEM_COLORS, SYSTEM_ICON, subscribeWeaver } from './weaverAI';
import undoRedoManager from '../../services/undoRedo';
import ReviewBoard from './ReviewBoard';

const HISTORY_KEY = 'lw-weaver-history';

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

function useBookContext(worldState, preferredBookId) {
  const bookIds = Object.keys(worldState?.books || {}).map(Number).sort((a, b) => a - b);
  const initial = preferredBookId != null && bookIds.includes(Number(preferredBookId))
    ? Number(preferredBookId)
    : (bookIds[bookIds.length - 1] || 1);
  const [bookId, setBookId] = useState(initial);
  useEffect(() => {
    if (preferredBookId != null && bookIds.includes(Number(preferredBookId))) {
      setBookId(Number(preferredBookId));
    } else if (!bookIds.includes(bookId) && bookIds.length) {
      setBookId(bookIds[bookIds.length - 1]);
    }
  }, [preferredBookId, bookIds.join(','), bookId, bookIds]);
  const book = worldState?.books?.[bookId] || null;
  return { bookId, setBookId, bookIds, book };
}

function Stepper({ stage }) {
  const t = useTheme();
  const steps = [
    { id: 'hub',       label: 'Idea'    },
    { id: 'capture',   label: 'Capture' },
    { id: 'analyzing', label: 'Analyze' },
    { id: 'review',    label: 'Review'  },
    { id: 'applied',   label: 'Weaved'  },
  ];
  const idx = steps.findIndex((s) => s.id === stage);
  return (
    <div
      style={{
        padding: '14px 28px',
        borderBottom: `1px solid ${t.rule}`,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        flexWrap: 'wrap',
      }}
    >
      {steps.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <React.Fragment key={s.id}>
            {i > 0 && (
              <div style={{ width: 14, height: 1, background: done ? t.accent : t.rule }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  display: 'grid',
                  placeItems: 'center',
                  background: active || done ? t.accent : t.paper,
                  border: `1px solid ${active || done ? t.accent : t.rule}`,
                  color: active || done ? t.onAccent : t.ink3,
                  fontFamily: t.mono,
                  fontSize: 9,
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                {done ? '\u2713' : i + 1}
              </div>
              <span
                style={{
                  fontFamily: t.mono,
                  fontSize: 10,
                  letterSpacing: 0.12,
                  textTransform: 'uppercase',
                  color: active ? t.accent : t.ink3,
                }}
              >
                {s.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ marginLeft: 'auto' }}>
        <ThemeToggle />
      </div>
    </div>
  );
}

function Hub({ book, history, onStart, onLoadExample, onSweep }) {
  const t = useTheme();
  return (
    <div style={{ padding: '40px 48px', maxWidth: 900, margin: '0 auto' }}>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 10,
          letterSpacing: 0.16,
          color: t.accent,
          textTransform: 'uppercase',
        }}
      >
        The mass-integration engine
      </div>
      <h1
        style={{
          fontFamily: t.display,
          fontSize: 48,
          fontWeight: 400,
          letterSpacing: -0.025,
          margin: '6px 0 14px',
          lineHeight: 1.05,
          color: t.ink,
        }}
      >
        Have an idea.
        <br />
        <em style={{ color: t.accent }}>Let it find its place.</em>
      </h1>
      <p style={{ fontSize: 15, color: t.ink2, lineHeight: 1.6, maxWidth: '58ch', margin: 0 }}>
        Type a thought \u2014 a new character, a cursed artefact, a relationship you wish you'd
        planted earlier, a plot thread that should've existed from chapter one. Canon Weaver
        reads every chapter, every entry, every pin on the map, and proposes exactly where
        this belongs and how to weave it in. You review. Accept, edit, or reject each edit.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
          margin: '28px 0 10px',
        }}
      >
        {[
          { k: 'Cross-system', v: 'Chapters, cast, world, plot, timeline, atlas \u2014 all at once.' },
          { k: 'Consent-first', v: 'Nothing changes without your yes. Everything undoable.' },
          { k: 'Voice-matched', v: 'AI proposals written in your style, at low intrusion.' },
        ].map((f) => (
          <div
            key={f.k}
            style={{
              padding: 14,
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
                letterSpacing: 0.12,
                textTransform: 'uppercase',
              }}
            >
              {f.k}
            </div>
            <div style={{ fontSize: 12, color: t.ink2, marginTop: 4, lineHeight: 1.5 }}>{f.v}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 26,
          padding: 22,
          background: t.paper,
          border: `1px solid ${t.accent}`,
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
          Ready to weave
        </div>
        <div
          style={{
            fontFamily: t.display,
            fontSize: 18,
            fontWeight: 500,
            marginTop: 6,
            color: t.ink,
            lineHeight: 1.5,
          }}
        >
          Working on <em>{book?.title || 'your book'}</em>
          {book?.chapters?.length ? ` \u2014 ${book.chapters.length} chapters indexed.` : '.'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <Button variant="primary" size="lg" onClick={onStart} icon={<Icon name="sparkle" size={14} color={t.onAccent} />}>
            New weave
          </Button>
          <Button variant="default" onClick={onSweep} icon={<Icon name="refresh" size={14} color={t.ink} />}>
            Continuity sweep
          </Button>
          <Button variant="default" onClick={onLoadExample}>
            Load example idea
          </Button>
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: t.ink2,
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: t.ink }}>Continuity sweep</strong> scans every chapter, character and thread and proposes coordinated fixes for dangling plants, silent characters and drifting facts &mdash; no new idea required.
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              letterSpacing: 0.16,
              color: t.ink3,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Recent weaves
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.slice(0, 6).map((h) => (
              <div
                key={h.id}
                style={{
                  padding: 10,
                  background: t.paper,
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: t.display,
                      fontSize: 14,
                      color: t.ink,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h.title}
                  </div>
                  <div
                    style={{
                      fontFamily: t.mono,
                      fontSize: 9,
                      color: t.ink3,
                      letterSpacing: 0.1,
                      marginTop: 3,
                    }}
                  >
                    {new Date(h.when).toLocaleString()} \u00B7 {h.accepted}/{h.touched} accepted
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: t.mono,
                    fontSize: 10,
                    color: h.status === 'accepted' ? t.good : t.bad,
                    letterSpacing: 0.12,
                    textTransform: 'uppercase',
                  }}
                >
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Capture({ idea, setIdea, onSubmit, onBack }) {
  const t = useTheme();
  return (
    <div style={{ padding: '40px 48px', maxWidth: 800, margin: '0 auto' }}>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 10,
          letterSpacing: 0.16,
          color: t.accent,
          textTransform: 'uppercase',
        }}
      >
        Capture
      </div>
      <h1
        style={{
          fontFamily: t.display,
          fontSize: 36,
          fontWeight: 400,
          letterSpacing: -0.02,
          margin: '4px 0 12px',
          lineHeight: 1.1,
          color: t.ink,
        }}
      >
        What's on your mind?
      </h1>
      <p style={{ fontSize: 13, color: t.ink2, margin: '0 0 16px' }}>
        Character, item, event, contradiction, new scene \u2014 whatever. Plain English.
      </p>
      <p style={{ fontSize: 12, color: t.ink3, margin: '0 0 16px', lineHeight: 1.5 }}>
        The open chapter in Writer&apos;s Room is sent to the Weaver as manuscript context (voice + on-page facts).
        Names you add only in this box are your intent for the weave.
      </p>
      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="e.g. A cursed dagger..."
        autoFocus
        style={{
          width: '100%',
          minHeight: 180,
          padding: 20,
          background: t.paper,
          color: t.ink,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          fontFamily: t.display,
          fontSize: 17,
          lineHeight: 1.5,
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 20,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.1 }}>
          {idea.trim().split(/\s+/).filter(Boolean).length} words
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="primary"
            disabled={idea.trim().length < 5}
            onClick={onSubmit}
            icon={<Icon name="sparkle" size={12} />}
          >
            Weave
          </Button>
        </div>
      </div>
    </div>
  );
}

function Analyzing({ idea, book, actors }) {
  const t = useTheme();
  const phases = [
    `Reading ${book?.chapters?.length || 0} chapters`,
    `Scanning cast of ${actors.length}`,
    'Mapping against plot threads',
    'Weaving proposals',
  ];
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const ts = [700, 1400, 2100, 2800];
    const timers = phases.map((_, i) => setTimeout(() => setCurrent(i + 1), ts[i]));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div style={{ padding: 40, display: 'grid', placeItems: 'center', minHeight: 360 }}>
      <div style={{ maxWidth: 560, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            letterSpacing: 0.16,
            color: t.accent,
            textTransform: 'uppercase',
          }}
        >
          Analyzing
        </div>
        <h1
          style={{
            fontFamily: t.display,
            fontSize: 34,
            fontWeight: 400,
            letterSpacing: -0.02,
            margin: '8px 0 18px',
            lineHeight: 1.15,
            color: t.ink,
          }}
        >
          The Loom is reading
          <br />
          <em style={{ color: t.accent }}>your book.</em>
        </h1>
        <div
          style={{
            padding: 16,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            fontFamily: t.display,
            fontSize: 15,
            color: t.ink2,
            fontStyle: 'italic',
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          "{idea}"
        </div>
        <div
          style={{
            textAlign: 'left',
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            padding: 16,
          }}
        >
          {phases.map((p, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 0',
                fontFamily: t.mono,
                fontSize: 11,
                color: i <= current ? t.ink : t.ink3,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 2,
                  background: i < current ? t.accent : 'transparent',
                  border: `1px solid ${i <= current ? t.accent : t.rule}`,
                }}
              />
              {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditCard({ edit, decision, onDecision, isSelected, onSelect }) {
  const t = useTheme();
  const col = SYSTEM_COLORS[edit.system] || t.accent;
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '10px 14px',
        background: isSelected ? t.paper : 'transparent',
        border: 'none',
        borderLeft: isSelected ? `2px solid ${col}` : '2px solid transparent',
        borderBottom: `1px solid ${t.rule}`,
        cursor: 'pointer',
        color: t.ink,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontFamily: t.display, fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>
          {edit.title}
        </div>
        <span
          style={{
            flexShrink: 0,
            fontFamily: t.mono,
            fontSize: 10,
            letterSpacing: 0.1,
            textTransform: 'uppercase',
            color:
              decision === 'accept'
                ? t.good
                : decision === 'reject'
                ? t.bad
                : t.warn,
          }}
        >
          {decision === 'accept' ? '\u2713' : decision === 'reject' ? '\u2715' : '\u270E'}
        </span>
      </div>
      {edit.reasoning && (
        <div
          style={{
            fontSize: 11,
            color: t.ink3,
            marginTop: 3,
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {edit.reasoning}
        </div>
      )}
    </button>
  );
}

function EditDetail({ edit, decision, setDecision }) {
  const t = useTheme();
  if (!edit) return null;
  const col = SYSTEM_COLORS[edit.system] || t.accent;
  const payload = edit.payload || {};
  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: t.mono,
          fontSize: 10,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
          color: col,
        }}
      >
        <Icon name={SYSTEM_ICON[edit.system] || 'sparkle'} size={12} color={col} />
        {edit.system} \u00B7 {edit.action}
        {edit.target && <span style={{ color: t.ink3 }}>\u00B7 {edit.target}</span>}
      </div>
      <h2
        style={{
          fontFamily: t.display,
          fontSize: 22,
          fontWeight: 500,
          color: t.ink,
          margin: '6px 0 12px',
        }}
      >
        {edit.title}
      </h2>
      <p
        style={{
          fontSize: 13,
          color: t.ink2,
          lineHeight: 1.6,
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          padding: 14,
        }}
      >
        {edit.reasoning}
      </p>

      {(payload.before || payload.after) && (
        <div
          style={{
            marginTop: 14,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          <div
            style={{
              padding: 12,
              background: t.paper2,
              border: `1px solid ${t.rule}`,
              borderRadius: t.radius,
            }}
          >
            <div
              style={{
                fontFamily: t.mono,
                fontSize: 9,
                color: t.ink3,
                letterSpacing: 0.14,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Before
            </div>
            <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6 }}>{payload.before}</div>
          </div>
          <div
            style={{
              padding: 12,
              background: t.paper,
              border: `1px solid ${t.accent}`,
              borderRadius: t.radius,
            }}
          >
            <div
              style={{
                fontFamily: t.mono,
                fontSize: 9,
                color: t.accent,
                letterSpacing: 0.14,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              After
            </div>
            <div style={{ fontSize: 13, color: t.ink, lineHeight: 1.6 }}>{payload.after}</div>
          </div>
        </div>
      )}

      {Object.keys(payload).length > 0 && !payload.before && !payload.after && (
        <pre
          style={{
            marginTop: 14,
            padding: 12,
            background: t.paper2,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink2,
            fontFamily: t.mono,
            fontSize: 11,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          variant={decision === 'accept' ? 'primary' : 'default'}
          onClick={() => setDecision('accept')}
          icon={<Icon name="check" size={12} />}
        >
          Accept
        </Button>
        <Button
          variant={decision === 'edit' ? 'primary' : 'default'}
          onClick={() => setDecision('edit')}
          icon={<Icon name="edit" size={12} />}
        >
          Edit later
        </Button>
        <Button
          variant={decision === 'reject' ? 'danger' : 'default'}
          onClick={() => setDecision('reject')}
          icon={<Icon name="x" size={12} />}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

function Review({ idea, edits, decisions, setDecisions, selected, setSelected, onApply, onCancel }) {
  const t = useTheme();
  const cur = edits.find((e) => e.id === selected) || edits[0];
  const grouped = edits.reduce((acc, e) => {
    (acc[e.system] = acc[e.system] || []).push(e);
    return acc;
  }, {});
  const counts = edits.reduce((acc, e) => {
    const v = decisions[e.id] || 'accept';
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', minHeight: 0, flex: 1, overflow: 'hidden' }}>
      <aside
        style={{
          width: 340,
          flexShrink: 0,
          borderRight: `1px solid ${t.rule}`,
          overflowY: 'auto',
          padding: '16px 0',
        }}
      >
        <div style={{ padding: '0 16px 14px', borderBottom: `1px solid ${t.rule}`, marginBottom: 10 }}>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.accent,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
            }}
          >
            Your idea
          </div>
          <div
            style={{
              fontFamily: t.display,
              fontSize: 15,
              color: t.ink,
              marginTop: 4,
              lineHeight: 1.4,
              fontStyle: 'italic',
            }}
          >
            "{idea}"
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 8,
              fontFamily: t.mono,
              fontSize: 10,
              color: t.ink3,
              letterSpacing: 0.08,
              flexWrap: 'wrap',
            }}
          >
            <span>{edits.length} edits</span>
            <span style={{ color: t.good }}>{counts.accept || 0} accept</span>
            <span style={{ color: t.warn }}>{counts.edit || 0} edit</span>
            <span style={{ color: t.bad }}>{counts.reject || 0} reject</span>
          </div>
        </div>
        {Object.entries(grouped).map(([system, items]) => {
          const col = SYSTEM_COLORS[system] || t.accent;
          return (
            <div key={system}>
              <div
                style={{
                  padding: '8px 16px',
                  fontFamily: t.mono,
                  fontSize: 9,
                  color: col,
                  letterSpacing: 0.14,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icon name={SYSTEM_ICON[system] || 'sparkle'} size={11} color={col} /> {system} \u00B7 {items.length}
              </div>
              {items.map((e) => (
                <EditCard
                  key={e.id}
                  edit={e}
                  decision={decisions[e.id] || 'accept'}
                  isSelected={cur?.id === e.id}
                  onSelect={() => setSelected(e.id)}
                  onDecision={(d) => setDecisions((old) => ({ ...old, [e.id]: d }))}
                />
              ))}
            </div>
          );
        })}
      </aside>
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <EditDetail
          edit={cur}
          decision={decisions[cur?.id] || 'accept'}
          setDecision={(v) => setDecisions((d) => ({ ...d, [cur.id]: v }))}
        />
      </main>
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          borderLeft: `1px solid ${t.rule}`,
          background: t.paper2,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
          Apply
        </div>
        <p style={{ fontSize: 12, color: t.ink2, lineHeight: 1.6 }}>
          Every accepted edit will be applied to your world, cast, plot, timeline, atlas, or
          chapter as appropriate. Nothing is destructive \u2014 everything is additive.
        </p>
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="lg" onClick={onApply}>
          Weave {counts.accept || 0} edit{(counts.accept || 0) === 1 ? '' : 's'}
        </Button>
        <div style={{ height: 6 }} />
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </aside>
    </div>
  );
}

function Applied({ summary, onAgain }) {
  const t = useTheme();
  return (
    <div style={{ padding: 40, display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 540 }}>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.accent,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
          }}
        >
          Weaved
        </div>
        <h1
          style={{
            fontFamily: t.display,
            fontSize: 32,
            fontWeight: 400,
            margin: '8px 0 14px',
            letterSpacing: -0.02,
            color: t.ink,
          }}
        >
          The canon has moved.
        </h1>
        <p style={{ fontSize: 14, color: t.ink2, lineHeight: 1.6 }}>
          {summary.accepted} of {summary.total} edits were applied across{' '}
          {summary.systems.length} system{summary.systems.length === 1 ? '' : 's'}. You can
          review them individually or undo the whole weave from History.
        </p>
        <div style={{ marginTop: 20 }}>
          <Button variant="primary" onClick={onAgain}>
            Start another weave
          </Button>
        </div>
      </div>
    </div>
  );
}

function WeaverBody({
  worldState,
  setWorldState,
  onPatchWorldState,
  captureOnMount,
  initialIdea,
  onCaptureConsumed,
  /** When embedded in Writer's Room, syncs weave target book/chapter to the editor. */
  writerBookId,
  writerChapterId,
}) {
  const t = useTheme();
  const { bookId, book } = useBookContext(worldState, writerBookId);
  const actors = worldState?.actors || [];

  const [stage, setStage] = useState(captureOnMount ? 'capture' : 'hub');
  const [idea, setIdea] = useState(initialIdea || '');
  const [edits, setEdits] = useState([]);
  const [reviewView, setReviewView] = useState('list');
  const [weaveMode, setWeaveMode] = useState('single');
  const [weaveEntity, setWeaveEntity] = useState(null);

  useEffect(() => {
    if (captureOnMount) {
      setStage('capture');
      if (initialIdea) setIdea(initialIdea);
      onCaptureConsumed?.();
    }
  }, [captureOnMount]); // eslint-disable-line react-hooks/exhaustive-deps
  const [decisions, setDecisions] = useState({});
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState(loadHistory());
  const [summary, setSummary] = useState({ accepted: 0, total: 0, systems: [] });
  const currentChapter = useMemo(() => {
    const chs = book?.chapters || [];
    if (!chs.length) return 1;
    if (writerChapterId != null) {
      const hit = chs.find(
        (c) => c.id === writerChapterId
          || c.number === writerChapterId
          || String(c.id) === String(writerChapterId)
      );
      if (hit) return hit.id ?? hit.number ?? writerChapterId;
    }
    const last = chs[chs.length - 1];
    return last?.id ?? last?.number ?? 1;
  }, [book, writerChapterId]);

  // External triggers (Daily Spark, Interview handoff, mobile Capture, deep
  // links) publish on the weaver bus. We honour them by seeding state and
  // jumping to the right stage.
  useEffect(() => {
    const off = subscribeWeaver(({ mode = 'single', text, entity, autoRun = false } = {}) => {
      if (text) setIdea(text);
      if (entity) setWeaveEntity(entity);
      setWeaveMode(mode);
      if (autoRun && (text || mode === 'sweep' || mode === 'backfill')) {
        // Kick off immediately, skipping the Capture step.
        submit(text ?? '', { mode, entity });
      } else {
        setStage('capture');
      }
    });
    return off;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (text, opts = {}) => {
    const theIdea = text ?? idea;
    const mode = opts.mode || weaveMode || 'single';
    const entity = opts.entity || weaveEntity;
    setIdea(theIdea);
    setWeaveMode(mode);
    setStage('analyzing');
    const { edits: proposed } = await proposeWeave(theIdea, worldState, bookId, {
      currentChapter,
      chapterId: currentChapter,
      mode,
      entity,
      transcript: opts.transcript,
    });
    setEdits(proposed);
    const seed = {};
    proposed.forEach((e) => {
      seed[e.id] = 'accept';
    });
    setDecisions(seed);
    setSelected(proposed[0]?.id || null);
    setTimeout(() => setStage('review'), 600);
  };

  const applyEdits = () => {
    const accepted = edits.filter((e) => (decisions[e.id] || 'accept') === 'accept');
    const systems = Array.from(new Set(accepted.map((e) => e.system)));

    // Dispatch accepted edits to worldState. These are ADDITIVE.
    const patch = dispatchWeaveEdits(worldState, accepted, bookId, currentChapter);
    if (patch) {
      // One-click-undo: record the pre-apply snapshot as a single history
      // step labeled with the idea. `Ctrl+Z` in the header reverts the whole
      // batch.
      try {
        undoRedoManager.saveState?.(worldState, `Weave: ${String(idea).slice(0, 80) || weaveMode}`);
      } catch (_e) { /* noop */ }
      onPatchWorldState?.(patch);
    }

    // Mirror accepted Chapter prose edits into the Weaver Stash so the
    // author can preview / edit / bring them over into the actual chapter
    // body from the Stash drawer rather than only seeing the note form
    // attached to the chapter object.
    const chapterEdits = accepted.filter(
      (e) => e.system === 'Chapter' && e.action === 'suggest-edit' && e.payload?.after
    );
    if (chapterEdits.length) {
      (async () => {
        try {
          // Dynamic import keeps the weaver bundle light if the stash is
          // never opened.
          const stash = await import('../../services/weaverStashService');
          for (const e of chapterEdits) {
            await stash.addStashItem({
              title: e.title || `Weaver: ${e.target || 'chapter edit'}`,
              content: e.payload?.after || '',
              source: 'weaver',
              bookId,
              chapterId: currentChapter || null,
              meta: {
                editId: e.id, target: e.target,
                before: e.payload?.before || '',
                reasoning: e.reasoning || '',
              },
            });
          }
        } catch (err) {
          console.warn('[CanonWeaver] could not stash chapter edits:', err);
        }
      })();
    }

    const entry = {
      id: `h_${Date.now()}`,
      title: (idea || weaveMode).slice(0, 140),
      when: Date.now(),
      touched: edits.length,
      accepted: accepted.length,
      mode: weaveMode,
      status: accepted.length > 0 ? 'accepted' : 'rejected',
    };
    const next = [entry, ...history];
    setHistory(next);
    saveHistory(next);
    setSummary({ accepted: accepted.length, total: edits.length, systems });
    setStage('applied');
  };

  const loadExample = () => {
    setIdea(
      'A cursed dagger \u2014 The Whistling Knife. Passed down in House Maelgwyn. Whispers to the bearer. Mira picks it up at Westmark and keeps it.'
    );
    setStage('capture');
  };

  return (
    <>
      <Stepper stage={stage} />
      {stage === 'hub' && (
        <Hub
          book={book}
          history={history}
          onStart={() => { setWeaveMode('single'); setStage('capture'); }}
          onSweep={() => {
            setWeaveMode('sweep');
            setIdea('Run a continuity sweep on the whole book.');
            submit('Run a continuity sweep on the whole book.', { mode: 'sweep' });
          }}
          onLoadExample={loadExample}
        />
      )}
      {stage === 'capture' && (
        <Capture
          idea={idea}
          setIdea={setIdea}
          onSubmit={() => submit(idea)}
          onBack={() => setStage('hub')}
        />
      )}
      {stage === 'analyzing' && <Analyzing idea={idea} book={book} actors={actors} />}
      {stage === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div
            style={{
              padding: '6px 16px',
              borderBottom: `1px solid ${t.rule}`,
              background: t.paper,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <div
              style={{
                fontFamily: t.mono, fontSize: 10, color: t.accent,
                letterSpacing: 0.18, textTransform: 'uppercase',
              }}
            >
              View
            </div>
            {[
              { id: 'list',  label: 'List' },
              { id: 'board', label: 'Board' },
            ].map((v) => {
              const on = reviewView === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setReviewView(v.id)}
                  style={{
                    padding: '4px 10px',
                    background: on ? t.accentSoft : 'transparent',
                    color: on ? t.ink : t.ink2,
                    border: `1px solid ${on ? t.accent : t.rule}`, borderRadius: t.radius,
                    cursor: 'pointer',
                    fontFamily: t.mono, fontSize: 10,
                    letterSpacing: 0.12, textTransform: 'uppercase',
                  }}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {reviewView === 'list' ? (
              <Review
                idea={idea}
                edits={edits}
                decisions={decisions}
                setDecisions={setDecisions}
                selected={selected}
                setSelected={setSelected}
                onApply={applyEdits}
                onCancel={() => setStage('hub')}
              />
            ) : (
              <ReviewBoard
                edits={edits}
                decisions={decisions}
                onSetDecision={(id, d) => setDecisions((old) => ({ ...old, [id]: d }))}
                onBatchDecide={(id, d) => setDecisions((old) => ({ ...old, [id]: d }))}
                onApply={applyEdits}
                onCancel={() => setStage('hub')}
              />
            )}
          </div>
        </div>
      )}
      {stage === 'applied' && (
        <Applied summary={summary} onAgain={() => setStage('hub')} />
      )}
    </>
  );
}

/**
 * Dispatch accepted edits into worldState. Additive and defensive.
 * Returns the patch shape expected by onPatchWorldState, or null if nothing changed.
 */
function dispatchWeaveEdits(worldState, accepted, bookId, chapterId) {
  if (!accepted.length) return null;
  const patch = {};
  let itemBank = worldState?.itemBank ? [...worldState.itemBank] : [];
  let actors = worldState?.actors ? [...worldState.actors] : [];
  let books = worldState?.books ? { ...worldState.books } : {};
  let plotThreads = worldState?.plotThreads ? [...worldState.plotThreads] : [];
  let touched = false;

  accepted.forEach((e) => {
    try {
      switch (e.system) {
        case 'World': {
          if (e.action === 'create' && e.payload?.name) {
            const id = `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            itemBank.push({
              id,
              name: e.payload.name,
              type: e.payload.type || 'artefact',
              desc: e.payload.description || '',
              properties: (e.payload.provenance || []).join(' \u00B7 '),
              rarity: 'Rare',
              stats: {},
              grantsSkills: [],
              origin: chapterId,
              symbolism: e.payload.tags ? e.payload.tags.join(', ') : '',
              knownTo: [],
              customStates: [],
              track: {},
              flag: '',
            });
            touched = true;
          }
          break;
        }
        case 'Cast': {
          if (e.action === 'inventory-add' && e.target && e.payload?.item) {
            // Find actor by name
            const actor = actors.find(
              (a) => a.name && a.name.toLowerCase() === String(e.target).toLowerCase()
            );
            if (actor) {
              // Find or create item in bank
              let item = itemBank.find((i) => i.name === e.payload.item);
              if (!item) {
                const id = `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                item = {
                  id,
                  name: e.payload.item,
                  type: 'artefact',
                  desc: '',
                  stats: {},
                  grantsSkills: [],
                  rarity: 'Common',
                  origin: e.payload.chapter || chapterId,
                  track: {},
                };
                itemBank.push(item);
              }
              // Record in item.track
              const ch = e.payload.chapter || chapterId;
              const slot = (e.payload.slot || 'pack').split(' ')[0];
              item.track = {
                ...(item.track || {}),
                [ch]: {
                  actorId: actor.id,
                  slotId: slot,
                  stateId: 'pristine',
                  note: `Acquired \u2014 Canon Weaver.`,
                },
              };
              itemBank = itemBank.map((i) => (i.id === item.id ? item : i));
              touched = true;
            }
          } else if (e.action === 'trait-hint' && e.target && e.payload?.note) {
            const actor = actors.find(
              (a) => a.name && a.name.toLowerCase() === String(e.target).toLowerCase()
            );
            if (actor) {
              const note = e.payload.note;
              const nextBio = actor.biography ? `${actor.biography}\n\n${note}` : note;
              actors = actors.map((a) => (a.id === actor.id ? { ...a, biography: nextBio } : a));
              touched = true;
            }
          } else if (e.action === 'backstory-link' && e.target && e.payload?.note) {
            const actor = actors.find(
              (a) => a.name && a.name.toLowerCase() === String(e.target).toLowerCase()
            );
            if (actor) {
              const note = e.payload.note;
              const nextBio = actor.biography ? `${actor.biography}\n\n${note}` : note;
              actors = actors.map((a) => (a.id === actor.id ? { ...a, biography: nextBio } : a));
              touched = true;
            }
          }
          break;
        }
        case 'Plot': {
          if (e.action === 'create-thread' && e.payload?.name) {
            plotThreads.push({
              id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              name: e.payload.name,
              opens: e.payload.opens || chapterId,
              tieIn: e.payload.tieIn || '',
              severity: e.payload.severity || 'minor',
              created: Date.now(),
              source: 'canon-weaver',
            });
            touched = true;
          }
          break;
        }
        case 'Chapter': {
          if (e.action === 'suggest-edit' && e.target) {
            // Append suggestion as a note on the chapter
            const targetChId = Number(
              String(e.target)
                .replace(/[^0-9]/g, '')
                .slice(0, 4)
            );
            const book = books[bookId];
            if (book && targetChId) {
              const nextChapters = book.chapters.map((c) => {
                if (c.id !== targetChId) return c;
                const suggestion = {
                  id: `sug_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  source: 'canon-weaver',
                  before: e.payload?.before || '',
                  after: e.payload?.after || '',
                  intrusion: e.payload?.intrusion || 'low',
                  reasoning: e.reasoning || '',
                  createdAt: Date.now(),
                };
                return {
                  ...c,
                  weaverSuggestions: [...(c.weaverSuggestions || []), suggestion],
                };
              });
              books = {
                ...books,
                [bookId]: { ...book, chapters: nextChapters },
              };
              touched = true;
            }
          }
          break;
        }
        default:
          // Timeline/Atlas edits land as generic notes on the book
          if (e.payload) {
            const book = books[bookId];
            if (book) {
              books = {
                ...books,
                [bookId]: {
                  ...book,
                  weaverNotes: [
                    ...(book.weaverNotes || []),
                    {
                      id: `wn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                      system: e.system,
                      action: e.action,
                      title: e.title,
                      reasoning: e.reasoning,
                      payload: e.payload,
                      at: Date.now(),
                    },
                  ],
                },
              };
              touched = true;
            }
          }
      }
    } catch (_err) {
      /* keep going */
    }
  });

  if (!touched) return null;
  patch.itemBank = itemBank;
  patch.actors = actors;
  patch.books = books;
  patch.plotThreads = plotThreads;
  return patch;
}

export { WeaverBody };

export default function CanonWeaver({ scoped = false, ...props }) {
  const onPatchWorldState = props.onPatchWorldState || ((patch) => {
    props.setWorldState?.((prev) => ({
      ...prev,
      itemBank: patch.itemBank || prev.itemBank,
      actors: patch.actors || prev.actors,
      books: patch.books || prev.books,
      plotThreads: patch.plotThreads || prev.plotThreads,
    }));
  });
  return (
    <LoomwrightShell scrollable={false} scoped={scoped}>
      <WeaverBody {...props} onPatchWorldState={onPatchWorldState} />
    </LoomwrightShell>
  );
}

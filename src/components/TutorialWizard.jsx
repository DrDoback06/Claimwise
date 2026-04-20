/**
 * TutorialWizard — Loomwright first-use walkthrough (doc 00 decision #13).
 *
 * A thin, data-driven overlay that walks the user through each workspace.
 * Separate from OnboardingWizard (which sets up story data). Steps are
 * resumable and dismissable; completion state lives in localStorage.
 *
 * Steps are declarative: each step sets `activeTab` (via a callback) and
 * shows a Loomwright-themed card with copy and optional bullet list. No DOM
 * measurement or spotlight overlays are required for v1 - this keeps the
 * wizard robust across theme changes and responsive breakpoints.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { X, ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../loomwright/theme';

const STORAGE_KEY = 'lw-tutorial-state';

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    tab: 'today',
    title: 'Welcome to Loomwright.',
    body: 'This tour takes about a minute. You can skip at any time and resume from Settings > Story Setup > Tour.',
    bullets: [
      'Loomwright is organized around five verb-based workspaces.',
      'Cmd+K jumps anywhere; Ctrl+/ shows keyboard shortcuts.',
      'Canon Weaver is the AI editor that keeps your canon coherent.',
    ],
  },
  {
    id: 'today',
    tab: 'today',
    title: 'Today is your home.',
    body: 'It resumes what you were writing, surfaces three things the Loom has noticed, and suggests the next best move for the time of day.',
  },
  {
    id: 'write',
    tab: 'write',
    title: 'The Writer\u2019s Room.',
    body: 'The editor sits centre. Canon Weaver lives on the right as a live rail. Story Analysis pins to the bottom. Language, Interview, Import and Read-mode are all reachable without leaving the page.',
    bullets: [
      'Select any sentence to rewrite it inline (Shorten / Tighten / Flip / \u2026).',
      'Sprint timer + focus mode are in the toolbar.',
      'Drop an idea into the Weaver rail to coordinate edits across cast, items, wiki, plot and atlas in one batch.',
    ],
  },
  {
    id: 'cast',
    tab: 'cast',
    title: 'Cast.',
    body: 'Every character has a deep profile. The Journey tab is the chapter-scrubbable viewer: items, skills, stats and relationships as-of any chapter.',
  },
  {
    id: 'atlas',
    tab: 'atlas',
    title: 'Atlas.',
    body: 'Three modes: Globe (real-world), Maker (upload a fantasy map), Hybrid. A time scrubber animates character movement across chapters.',
  },
  {
    id: 'world',
    tab: 'world',
    title: 'World.',
    body: 'Wiki for every entity type, factions with a power diagram, artefact provenance, and a one-click lore consistency auditor that runs a Canon Weaver sweep.',
  },
  {
    id: 'plot',
    tab: 'plot_timeline',
    title: 'Plot Lab.',
    body: 'Threads, beats, consistency, arcs, chronology and the narrative graph in one canvas. Run a continuity sweep from the top-right when you need the AI to find drift.',
  },
  {
    id: 'settings',
    tab: 'settings',
    title: 'Settings.',
    body: 'Keys & providers, Data & History (backup/sync/versions unified), preferences, and a Dev panel that re-exposes the Mobile Preview and Design & Docs surfaces when you need them.',
  },
  {
    id: 'done',
    tab: 'today',
    title: 'You\u2019re ready.',
    body: 'Drop an idea, scrub a chapter, weave the canon. Welcome aboard.',
  },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { dismissed: false, completedAt: 0, lastStep: 0 };
  } catch {
    return { dismissed: false, completedAt: 0, lastStep: 0 };
  }
}
function saveState(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
}

export function shouldAutoOpen() {
  const s = loadState();
  return !s.dismissed && !s.completedAt;
}

export default function TutorialWizard({ isOpen, onClose, onNavigate, onFinish }) {
  const t = useTheme();
  const [stepIdx, setStepIdx] = useState(() => loadState().lastStep || 0);

  const step = useMemo(() => TUTORIAL_STEPS[stepIdx] || TUTORIAL_STEPS[0], [stepIdx]);

  useEffect(() => {
    if (!isOpen) return;
    if (step?.tab) onNavigate?.(step.tab);
    saveState({ ...loadState(), lastStep: stepIdx });
  }, [isOpen, stepIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const last = stepIdx === TUTORIAL_STEPS.length - 1;

  const finish = () => {
    saveState({ dismissed: false, completedAt: Date.now(), lastStep: 0 });
    onFinish?.();
    onClose?.();
  };

  const dismiss = () => {
    saveState({ ...loadState(), dismissed: true });
    onClose?.();
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 90,
        width: 420,
        background: t.paper,
        border: `1px solid ${t.accent}`,
        borderRadius: 6,
        boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          background: t.sidebar,
          borderBottom: `1px solid ${t.rule}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={12} color={t.accent} />
          <div
            style={{
              fontFamily: t.mono, fontSize: 10, color: t.accent,
              letterSpacing: 0.18, textTransform: 'uppercase',
            }}
          >
            Tour &middot; {stepIdx + 1} / {TUTORIAL_STEPS.length}
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          title="Dismiss (resumable from Settings)"
          style={{
            padding: 4,
            background: 'transparent',
            color: t.ink2,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            cursor: 'pointer',
          }}
        >
          <X size={12} />
        </button>
      </div>

      <div style={{ padding: 16 }}>
        <div
          style={{
            fontFamily: t.display, fontSize: 18, color: t.ink,
            lineHeight: 1.25, marginBottom: 8,
          }}
        >
          {step.title}
        </div>
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6 }}>
          {step.body}
        </div>
        {step.bullets && (
          <ul
            style={{
              marginTop: 10,
              paddingLeft: 18,
              fontSize: 12,
              color: t.ink2,
              lineHeight: 1.55,
            }}
          >
            {step.bullets.map((b, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{b}</li>
            ))}
          </ul>
        )}
      </div>

      <div
        style={{
          padding: '10px 14px',
          borderTop: `1px solid ${t.rule}`,
          background: t.sidebar,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          disabled={stepIdx === 0}
          style={{
            padding: '5px 10px',
            background: 'transparent',
            color: stepIdx === 0 ? t.ink3 : t.ink2,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            cursor: stepIdx === 0 ? 'not-allowed' : 'pointer',
            fontFamily: t.mono, fontSize: 10,
            letterSpacing: 0.12, textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          <ArrowLeft size={11} /> Back
        </button>
        <div style={{ flex: 1 }} />
        {last ? (
          <button
            type="button"
            onClick={finish}
            style={{
              padding: '5px 12px',
              background: t.accent, color: t.onAccent,
              border: `1px solid ${t.accent}`,
              borderRadius: t.radius,
              cursor: 'pointer',
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.14, textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            <Check size={11} /> Done
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStepIdx((i) => Math.min(TUTORIAL_STEPS.length - 1, i + 1))}
            style={{
              padding: '5px 12px',
              background: t.accent, color: t.onAccent,
              border: `1px solid ${t.accent}`,
              borderRadius: t.radius,
              cursor: 'pointer',
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.14, textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            Next <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

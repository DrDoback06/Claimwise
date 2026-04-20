/**
 * WriterSprintTimer — compact sprint timer for Writer's Room.
 *
 * 15 / 25 / 45 minute preset sprints with a silent completion state (no
 * popups, per the Enhancement Roadmap "silent streaks" guidance). Tracks
 * word-count delta across the sprint by reading `window.__lwWordCount` on
 * tick. The editor updates that global via `setWordCount` for observability.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';

const PRESETS = [
  { label: '15', minutes: 15 },
  { label: '25', minutes: 25 },
  { label: '45', minutes: 45 },
];

export default function WriterSprintTimer() {
  const t = useTheme();
  const [preset, setPreset] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [startWords, setStartWords] = useState(null);
  const [deltaWords, setDeltaWords] = useState(0);
  const [completed, setCompleted] = useState(0);
  const tickRef = useRef();

  useEffect(() => {
    if (!running) {
      clearInterval(tickRef.current);
      return undefined;
    }
    tickRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (typeof window !== 'undefined' && typeof window.__lwWordCount === 'number') {
          setDeltaWords(Math.max(0, window.__lwWordCount - (startWords ?? window.__lwWordCount)));
        }
        if (next <= 0) {
          setRunning(false);
          setCompleted((c) => c + 1);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, startWords]);

  const setPresetMinutes = (m) => {
    setPreset(m);
    setRemaining(m * 60);
    setRunning(false);
    setStartWords(null);
    setDeltaWords(0);
  };

  const toggle = () => {
    if (!running && startWords === null && typeof window !== 'undefined') {
      setStartWords(window.__lwWordCount ?? 0);
    }
    setRunning((r) => !r);
  };

  const reset = () => {
    setRemaining(preset * 60);
    setRunning(false);
    setStartWords(null);
    setDeltaWords(0);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');
  const progress = 1 - remaining / (preset * 60);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 10px',
        border: `1px solid ${running ? t.accent : t.rule}`,
        background: running ? t.accentSoft : t.paper,
        borderRadius: t.radius,
        fontFamily: t.mono,
        fontSize: 11,
        color: t.ink,
        position: 'relative',
        overflow: 'hidden',
      }}
      title={`Sprint: ${deltaWords} words this sprint${completed ? ` · ${completed} completed today` : ''}`}
    >
      {running && (
        <div
          aria-hidden
          style={{
            position: 'absolute', left: 0, bottom: 0, right: 0,
            height: 2,
            background: t.accent,
            transform: `scaleX(${progress})`,
            transformOrigin: 'left',
            transition: 'transform 1s linear',
          }}
        />
      )}
      <Timer size={12} color={t.accent} />
      <span>{minutes}:{seconds}</span>

      <div style={{ display: 'inline-flex', gap: 2 }}>
        {PRESETS.map((p) => (
          <button
            key={p.minutes}
            type="button"
            onClick={() => setPresetMinutes(p.minutes)}
            style={{
              padding: '1px 6px',
              background: preset === p.minutes ? t.accent : 'transparent',
              color: preset === p.minutes ? t.onAccent : t.ink2,
              border: `1px solid ${preset === p.minutes ? t.accent : t.rule}`,
              borderRadius: 2,
              cursor: 'pointer',
              fontFamily: t.mono,
              fontSize: 10,
              letterSpacing: 0.08,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={toggle}
        style={{
          background: 'transparent', border: 'none', color: t.ink, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', padding: 2,
        }}
        title={running ? 'Pause' : 'Start'}
      >
        {running ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <button
        type="button"
        onClick={reset}
        style={{
          background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', padding: 2,
        }}
        title="Reset"
      >
        <RotateCcw size={11} />
      </button>
      {deltaWords > 0 && (
        <span style={{ color: t.accent, fontSize: 10 }}>+{deltaWords}w</span>
      )}
    </div>
  );
}

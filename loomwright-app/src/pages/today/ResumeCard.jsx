/**
 * ResumeCard — the "continue writing" card at the top of Today.
 *
 * Shows the currently-active book/chapter with today's word count, a daily
 * goal ring, and a primary CTA that jumps straight into Write.
 */

import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';

function dailyGoal() {
  try { return Number(localStorage.getItem('lw-daily-goal')) || 1500; } catch { return 1500; }
}

function todaysWordDelta() {
  // Track delta via the global we set in WriterSprintTimer; persisted lightly
  // so the card feels responsive between reloads.
  try {
    const key = `lw-words-${new Date().toISOString().slice(0, 10)}`;
    const stored = Number(localStorage.getItem(key)) || 0;
    const live = typeof window !== 'undefined' ? (window.__lwWordDelta || 0) : 0;
    return Math.max(stored, live);
  } catch { return 0; }
}

function ProgressRing({ pct, size = 56 }) {
  const t = useTheme();
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, pct));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={t.rule} strokeWidth="2" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={t.accent}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${p * c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="11"
        fontFamily={t.mono}
        fill={t.ink}
      >
        {Math.round(p * 100)}%
      </text>
    </svg>
  );
}

export default function ResumeCard({ worldState, onNavigate }) {
  const t = useTheme();

  const { book, chapter, chapterTitle, wordCount } = useMemo(() => {
    const books = Object.values(worldState?.books || {});
    const lastBook = books[books.length - 1] || books[0] || null;
    const lastChapter = lastBook?.chapters?.[lastBook.chapters.length - 1] || null;
    const wc = (lastChapter?.script || '').trim().split(/\s+/).filter(Boolean).length;
    return {
      book: lastBook,
      chapter: lastChapter?.id,
      chapterTitle: lastChapter?.title,
      wordCount: wc,
    };
  }, [worldState]);

  const goal = dailyGoal();
  const delta = todaysWordDelta();
  const pct = delta / goal;

  return (
    <div
      style={{
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.2, textTransform: 'uppercase',
          }}
        >
          Resume
        </div>
        <div
          style={{
            fontFamily: t.display, fontSize: 24, color: t.ink,
            marginTop: 4, lineHeight: 1.2,
          }}
        >
          {book?.title || 'Your story'}
          {chapter && (
            <span style={{ color: t.ink2, fontWeight: 400 }}>
              {' \u00b7 '} Chapter {chapter}
              {chapterTitle && <>: <em>{chapterTitle}</em></>}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: t.ink3, marginTop: 4 }}>
          Current chapter has {wordCount} words. Today so far: {delta} / {goal}.
        </div>
      </div>
      <ProgressRing pct={pct} />
      <button
        type="button"
        onClick={() => onNavigate?.('write')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 16px',
          background: t.accent, color: t.onAccent,
          border: `1px solid ${t.accent}`, borderRadius: t.radius,
          fontFamily: t.display, fontSize: 14, fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Continue writing <ArrowRight size={14} />
      </button>
    </div>
  );
}

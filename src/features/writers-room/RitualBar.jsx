// Loomwright — RitualBar (plan §6, §21). 28px footer with metrics + sprint timer.

import React from 'react';
import { useTheme, PANEL_ACCENT } from './theme';
import { useStore } from './store';

function formatMs(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RitualBar() {
  const t = useTheme();
  const store = useStore();
  const { book, profile } = store;
  const sprintLen = (profile?.ritual?.sprintLen || 25) * 60 * 1000;
  const [sprintEnd, setSprintEnd] = React.useState(null);
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    if (!sprintEnd) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [sprintEnd]);

  React.useEffect(() => {
    if (sprintEnd && now >= sprintEnd) {
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Loomwright', { body: 'Sprint complete. Take a breath.' });
        }
      } catch {}
      setSprintEnd(null);
    }
  }, [now, sprintEnd]);

  const startSprint = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch {}
    }
    setSprintEnd(Date.now() + sprintLen);
  };
  const stopSprint = () => setSprintEnd(null);

  const remaining = sprintEnd ? sprintEnd - now : 0;
  const todayProgress = Math.min(100, Math.round(((book.wordsToday || 0) / Math.max(1, book.target || 1)) * 100));

  return (
    <footer className="lw-ritualbar" style={{
      height: 28, display: 'flex', alignItems: 'center', gap: 14,
      padding: '0 16px', borderTop: `1px solid ${t.rule}`,
      background: t.paper, fontFamily: t.mono, fontSize: 10, color: t.ink3,
      letterSpacing: 0.12,
    }}>
      <span>{book.wordsToday || 0} / {book.target || 0} today</span>
      <span style={{
        width: 80, height: 3, background: t.rule, borderRadius: 1, overflow: 'hidden',
      }}>
        <span style={{ display: 'block', width: `${todayProgress}%`, height: '100%', background: PANEL_ACCENT.loom, transition: 'width 200ms' }} />
      </span>
      <span>·</span>
      <span>{book.streak || 0} day streak</span>
      <span style={{ flex: 1 }} />
      {sprintEnd ? (
        <>
          <span style={{ color: PANEL_ACCENT.voice }}>Sprint · {formatMs(remaining)}</span>
          <button onClick={stopSprint} style={btnStyle(t)}>Stop</button>
        </>
      ) : (
        <button onClick={startSprint} title={`Start a ${profile?.ritual?.sprintLen || 25}-min sprint`} style={btnStyle(t)}>
          Start sprint
        </button>
      )}
      <span>⌘K · ⌘J · F9 · ?</span>
    </footer>
  );
}

function btnStyle(t) {
  return {
    padding: '2px 8px', background: 'transparent',
    color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 14,
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
    textTransform: 'uppercase', cursor: 'pointer',
  };
}

// Loomwright — RitualBar (plan §6). 28px footer with metrics.

import React from 'react';
import { useTheme } from './theme';
import { useStore } from './store';

export default function RitualBar() {
  const t = useTheme();
  const { book } = useStore();
  return (
    <footer className="lw-ritualbar" style={{
      height: 28, display: 'flex', alignItems: 'center', gap: 18,
      padding: '0 16px', borderTop: `1px solid ${t.rule}`,
      background: t.paper, fontFamily: t.mono, fontSize: 10, color: t.ink3,
      letterSpacing: 0.12,
    }}>
      <span>{book.wordsToday || 0} / {book.target || 0} words today</span>
      <span>·</span>
      <span>{book.streak || 0} day streak</span>
      <span style={{ flex: 1 }} />
      <span>⌘K palette · ⌘J weave · F9 focus · [/] chapter</span>
    </footer>
  );
}

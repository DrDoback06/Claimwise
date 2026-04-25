// Loomwright — read-aloud utility (plan §21).

import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { activeChapter } from '../store/selectors';
import Icon from '../entities/Icon';

export default function ReadAloud() {
  const t = useTheme();
  const store = useStore();
  const ch = activeChapter(store);
  const [playing, setPlaying] = React.useState(false);
  const [rate, setRate] = React.useState(1.0);

  const speak = () => {
    if (!ch?.text) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(ch.text);
    u.rate = rate;
    u.onend = () => setPlaying(false);
    window.speechSynthesis.speak(u);
    setPlaying(true);
  };
  const stop = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setPlaying(false);
  };

  return (
    <button title="Read aloud" onClick={playing ? stop : speak} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      background: 'transparent', border: `1px solid ${t.rule}`, borderRadius: 14,
      fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.12,
      textTransform: 'uppercase', cursor: 'pointer',
    }}>
      <Icon name={playing ? 'x' : 'play'} size={11} color={t.ink2} />
      {playing ? 'Stop' : 'Read'}
    </button>
  );
}

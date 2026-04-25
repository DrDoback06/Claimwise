// Loomwright — read-aloud (plan §21). Sentence-by-sentence with paragraph highlight.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import { activeChapter } from '../store/selectors';
import Icon from '../entities/Icon';

function splitToSentences(paragraphs) {
  const out = [];
  for (const p of paragraphs) {
    const sentences = (p.text || '').match(/[^.!?]+[.!?]+|\S+$/g) || [(p.text || '')];
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed) out.push({ paragraphId: p.id, text: trimmed });
    }
  }
  return out;
}

export default function ReadAloud() {
  const t = useTheme();
  const store = useStore();
  const ch = activeChapter(store);
  const [playing, setPlaying] = React.useState(false);
  const [rate, setRate] = React.useState(1.0);
  const [showRate, setShowRate] = React.useState(false);

  const stop = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    document.querySelectorAll('[data-paragraph-id].lw-tts-active').forEach(el => el.classList.remove('lw-tts-active'));
    setPlaying(false);
  }, []);

  const speak = () => {
    if (!ch) return;
    const paragraphs = ch.paragraphs || (ch.text || '').split(/\n\n+/).map((text, i) => ({ id: `_${i}`, text }));
    const sents = splitToSentences(paragraphs);
    if (!sents.length) return;
    if (!('speechSynthesis' in window)) return;
    setPlaying(true);
    let i = 0;
    const queueNext = () => {
      if (i >= sents.length) { stop(); return; }
      const s = sents[i];
      // Highlight paragraph.
      document.querySelectorAll('[data-paragraph-id].lw-tts-active').forEach(el => el.classList.remove('lw-tts-active'));
      const el = document.querySelector(`[data-paragraph-id="${s.paragraphId}"]`);
      if (el) el.classList.add('lw-tts-active');
      const u = new SpeechSynthesisUtterance(s.text);
      u.rate = rate;
      u.onend = () => { i += 1; queueNext(); };
      u.onerror = () => { i += 1; queueNext(); };
      window.speechSynthesis.speak(u);
    };
    queueNext();
  };

  React.useEffect(() => () => stop(), [stop]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
      <button title="Read aloud" onClick={playing ? stop : speak} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
        background: playing ? PANEL_ACCENT.voice : 'transparent',
        color: playing ? t.onAccent : t.ink2,
        border: `1px solid ${playing ? PANEL_ACCENT.voice : t.rule}`, borderRadius: 14,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
        textTransform: 'uppercase', cursor: 'pointer',
      }}>
        <Icon name={playing ? 'x' : 'play'} size={11} color={playing ? t.onAccent : t.ink2} />
        {playing ? 'Stop' : 'Read'}
      </button>
      <button onClick={() => setShowRate(s => !s)} title="Speed"
        style={{
          padding: '4px 8px', background: 'transparent',
          border: `1px solid ${t.rule}`, borderRadius: 14,
          fontFamily: t.mono, fontSize: 9, color: t.ink2,
          letterSpacing: 0.12, cursor: 'pointer',
        }}>{rate.toFixed(1)}×</button>
      {showRate && (
        <div style={{
          position: 'absolute', top: 30, right: 0, padding: 10,
          background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2, zIndex: 10,
          width: 180,
        }}>
          <input type="range" min={0.5} max={2.0} step={0.1} value={rate}
            onChange={e => setRate(Number(e.target.value))}
            style={{ width: '100%', accentColor: PANEL_ACCENT.voice }} />
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textAlign: 'center' }}>
            {rate.toFixed(1)}× speed
          </div>
        </div>
      )}
    </div>
  );
}

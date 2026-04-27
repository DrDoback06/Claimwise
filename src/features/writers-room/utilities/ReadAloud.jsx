// Loomwright — read-aloud (plan §21). Sentence-by-sentence with paragraph
// highlight + per-character voice via speaker detection.
//
// Each sentence is attributed to a character (or the narrator) using
// regex rules in voice/speakerDetect. A character's voice is picked from
// `character.readAloudVoiceId`; the narrator uses `book.narratorVoiceId`.
// Both fall back to `defaultVoice()` when unset.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import { activeChapter } from '../store/selectors';
import Icon from '../entities/Icon';
import { attributeSpeakers } from '../voice/speakerDetect';
import { findVoice, defaultVoice, listBrowserVoices, PREMIUM_VOICES } from '../voice/voiceCatalog';

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

function pickVoiceForSpeaker(store, speakerId) {
  if (speakerId) {
    const c = (store.cast || []).find(x => x.id === speakerId);
    const voice = c?.readAloudVoiceId ? findVoice(c.readAloudVoiceId) : null;
    if (voice) return voice;
    return defaultVoice(c?.pronouns);
  }
  const narratorId = store.book?.narratorVoiceId;
  if (narratorId) return findVoice(narratorId);
  return defaultVoice('narrator');
}

export default function ReadAloud() {
  const t = useTheme();
  const store = useStore();
  const ch = activeChapter(store);
  const [playing, setPlaying] = React.useState(false);
  const [rate, setRate] = React.useState(1.0);
  const [showRate, setShowRate] = React.useState(false);
  const [activeSpeaker, setActiveSpeaker] = React.useState(null);

  // Force a re-eval of browser voices once the OS announces them
  // (Chromium fires onvoiceschanged late on first load).
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const onChange = () => {/* triggers re-render via state below */};
    window.speechSynthesis.onvoiceschanged = onChange;
  }, []);

  const stop = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    document.querySelectorAll('[data-paragraph-id].lw-tts-active').forEach(el => el.classList.remove('lw-tts-active'));
    setPlaying(false);
    setActiveSpeaker(null);
  }, []);

  const speak = () => {
    if (!ch) return;
    const paragraphs = ch.paragraphs || (ch.text || '').split(/\n\n+/).map((text, i) => ({ id: `_${i}`, text }));
    const rawSents = splitToSentences(paragraphs);
    if (!rawSents.length || !('speechSynthesis' in window)) return;
    // Attribute speakers up-front so we can pre-print the voice path.
    const sents = attributeSpeakers(rawSents, store.cast || []);
    setPlaying(true);
    let i = 0;
    const queueNext = () => {
      if (i >= sents.length) { stop(); return; }
      const s = sents[i];
      document.querySelectorAll('[data-paragraph-id].lw-tts-active').forEach(el => el.classList.remove('lw-tts-active'));
      const el = document.querySelector(`[data-paragraph-id="${s.paragraphId}"]`);
      if (el) el.classList.add('lw-tts-active');
      const voice = pickVoiceForSpeaker(store, s.speakerId);
      setActiveSpeaker(s.speakerId
        ? (store.cast || []).find(c => c.id === s.speakerId)?.name || 'speaker'
        : 'narrator');
      const u = new SpeechSynthesisUtterance(s.text);
      u.rate = rate;
      // Browser voices use the SpeechSynthesisVoice object directly.
      if (voice?.engine === 'browser' && voice.voiceObj) u.voice = voice.voiceObj;
      // (premium engines hooked in by textToSpeechService — future)
      u.onend = () => { i += 1; queueNext(); };
      u.onerror = () => { i += 1; queueNext(); };
      window.speechSynthesis.speak(u);
    };
    queueNext();
  };

  React.useEffect(() => () => stop(), [stop]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
      <button title="Read aloud (per-character voices)" onClick={playing ? stop : speak} style={{
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
      {playing && activeSpeaker && (
        <span style={{
          padding: '2px 8px', borderRadius: 999,
          background: 'transparent', color: PANEL_ACCENT.voice,
          border: `1px solid ${PANEL_ACCENT.voice}55`,
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>♪ {activeSpeaker}</span>
      )}
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

// Inline picker — drop into Cast > Identity tab and Settings (narrator).
export function VoicePicker({ value, onChange, label = 'Voice', allowNone = true }) {
  const t = useTheme();
  const browser = listBrowserVoices();
  const all = [...browser, ...PREMIUM_VOICES];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase',
      }}>{label}</span>
      <select value={value || ''} onChange={e => onChange(e.target.value || null)}
        style={{
          flex: 1, padding: '4px 6px',
          fontFamily: t.mono, fontSize: 11, color: t.ink,
          background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
        }}>
        {allowNone && <option value="">(auto by gender)</option>}
        <optgroup label="Browser (free)">
          {browser.map(v => <option key={v.id} value={v.id}>{v.name} · {v.lang} · {v.gender}</option>)}
        </optgroup>
        <optgroup label="ElevenLabs (key required)">
          {all.filter(v => v.engine === 'elevenlabs').map(v => (
            <option key={v.id} value={v.id}>{v.name} · {v.gender}{v.accent ? ' · ' + v.accent : ''}</option>
          ))}
        </optgroup>
        <optgroup label="OpenAI TTS (key required)">
          {all.filter(v => v.engine === 'openai').map(v => (
            <option key={v.id} value={v.id}>{v.name} · {v.gender}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

// Loomwright — voice-to-text dictation. The legacy `voiceService` did STT;
// we rename here to avoid confusion with prose-voice analysis (plan §5).

let recognition = null;

export const dictation = {
  isSupported() {
    return typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  },
  start({ onResult, onEnd } = {}) {
    if (!this.isSupported()) return false;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      onResult?.({ interim, final });
    };
    recognition.onend = () => onEnd?.();
    recognition.start();
    return true;
  },
  stop() {
    try { recognition?.stop(); } catch {}
    recognition = null;
  },
};

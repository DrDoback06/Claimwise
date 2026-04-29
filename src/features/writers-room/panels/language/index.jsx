// Loomwright — Language panel (plan §17). Issues + per-category eyeballs +
// sensory check + rhythm sparkline.

import React from 'react';
import PanelFrame from '../PanelFrame';
import SpecialistChat from '../../specialist/SpecialistChat';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import Icon from '../../entities/Icon';
import { activeChapter } from '../../store/selectors';

const KINDS = ['echo', 'adverb', 'repetition', 'telling', 'long', 'sensory'];

const TELL_PATTERNS = [
  /\b(?:she|he|they|it|i)\s+(?:felt|was|were)\s+(?:sad|happy|angry|tired|afraid|scared|excited|nervous|relieved)\b/gi,
  /\b(?:she|he|they|i)\s+(?:wondered|thought|realised|realized|knew|understood)\b/gi,
  /\b(?:looked|seemed|appeared)\s+(?:sad|happy|angry|tired|afraid|nervous)\b/gi,
];

const SENSORY = {
  sight: /\b(saw|seen|looked|watched|stared|glanced|gazed|noticed|peered|glimpsed|peek|peeked|colou?r|bright|dark|shimmer|gleam|flash|shadow|silhouette)\b/gi,
  sound: /\b(heard|listened|roar|whisper|murmur|hum|silen[ct]|creak|crash|echo|footsteps|rustl|thud|knock|voice|sang|sung|yell)\b/gi,
  smell: /\b(smell|scent|odou?r|aroma|stink|reek|fragran|musk|perfume|burnt|smoke|incense)\b/gi,
  taste: /\b(taste|tasted|bitter|sweet|sour|salt|metallic|tang|flavou?r|sip|swallow)\b/gi,
  touch: /\b(touch|felt|cold|warm|hot|smooth|rough|soft|sharp|prick|brush|grip|grasp|press|sting|tingl|skin|grasped)\b/gi,
};

function detectIssues(text) {
  if (!text) return [];
  const issues = [];
  // Echo (same word twice in a row).
  let m;
  const echoRe = /\b(\w{3,})\b\s+\1\b/gi;
  while ((m = echoRe.exec(text)) !== null) {
    if (issues.filter(i => i.kind === 'echo').length >= 3) break;
    issues.push({
      id: `i_echo_${m.index}`, kind: 'echo', label: 'Echo',
      rule: 'Same word back-to-back.', quote: m[0],
    });
  }
  // Adverb density.
  const adverbs = text.match(/\b\w+ly\b/gi) || [];
  if (adverbs.length > 4) {
    issues.push({
      id: 'i_adv', kind: 'adverb', label: 'Adverb density',
      rule: `${adverbs.length} adverbs — consider stronger verbs.`,
      quote: adverbs.slice(0, 4).join(', '),
    });
  }
  // Word repetition.
  const counts = {};
  for (const w of (text.toLowerCase().split(/\W+/).filter(w => w.length > 4))) counts[w] = (counts[w] || 0) + 1;
  const repeats = Object.entries(counts).filter(([, n]) => n >= 4).slice(0, 3);
  for (const [w, n] of repeats) {
    issues.push({
      id: `i_rep_${w}`, kind: 'repetition', label: 'Word repetition',
      rule: `"${w}" appears ${n} times.`, quote: w,
    });
  }
  // Telling (show-don't-tell).
  for (const pat of TELL_PATTERNS) {
    pat.lastIndex = 0;
    let mm;
    while ((mm = pat.exec(text)) !== null) {
      if (issues.filter(i => i.kind === 'telling').length >= 4) break;
      issues.push({
        id: `i_tell_${mm.index}`, kind: 'telling', label: 'Telling',
        rule: 'Try showing this through action or gesture.',
        quote: mm[0],
      });
    }
  }
  // Long sentences.
  const longs = (text.match(/[^.!?]+[.!?]/g) || []).filter(s => s.split(/\s+/).filter(Boolean).length > 35);
  for (const s of longs.slice(0, 3)) {
    issues.push({
      id: `i_long_${s.length}`, kind: 'long', label: 'Long sentence',
      rule: `${s.split(/\s+/).filter(Boolean).length} words.`,
      quote: s.trim().slice(0, 90) + (s.length > 90 ? '…' : ''),
    });
  }
  // Sensory gaps.
  const counts2 = {};
  for (const [name, re] of Object.entries(SENSORY)) {
    counts2[name] = (text.match(re) || []).length;
  }
  const totalSenses = Object.values(counts2).reduce((a, b) => a + b, 0);
  if (totalSenses > 3) {
    const missing = Object.entries(counts2).filter(([, n]) => n === 0).map(([k]) => k);
    if (missing.length >= 2) {
      issues.push({
        id: 'i_sensory', kind: 'sensory', label: 'Sensory gap',
        rule: `Strong on ${Object.entries(counts2).filter(([, n]) => n > 0).map(([k]) => k).join(', ')}; missing ${missing.join(', ')}.`,
        quote: '',
        senses: counts2,
      });
    }
  }
  return issues;
}

function rhythmSparkline(text) {
  if (!text) return [];
  const sents = text.match(/[^.!?]+[.!?]+/g) || [];
  return sents.map(s => s.split(/\s+/).filter(Boolean).length);
}

export default function LanguagePanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const tweaks = store.ui?.tweaks || {};
  const visibility = tweaks.kindVisibility || {};
  const ch = activeChapter(store);
  const [issues, setIssues] = React.useState([]);
  const [rhythm, setRhythm] = React.useState([]);

  React.useEffect(() => {
    if (!ch?.text) { setIssues([]); setRhythm([]); return; }
    setIssues(detectIssues(ch.text));
    setRhythm(rhythmSparkline(ch.text));
  }, [ch?.text, ch?.id]);

  const toggleKind = (k) => {
    const next = { ...visibility, [k]: visibility[k] === false ? true : false };
    store.setPath('ui.tweaks.kindVisibility', next);
  };

  const visible = issues.filter(i => visibility[i.kind] !== false);

  return (
    <PanelFrame
      title="Language"
      eyebrow="Echoes, density, rhythm"
      accent={PANEL_ACCENT.language}
      onClose={onClose}
      width={420}>

      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rule}` }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6 }}>
          Rhythm · {rhythm.length} sentence{rhythm.length === 1 ? '' : 's'}
        </div>
        <RhythmGraph values={rhythm} t={t} />
      </div>

      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${t.rule}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {KINDS.map(k => (
          <button key={k} onClick={() => toggleKind(k)} style={{
            padding: '4px 8px',
            background: visibility[k] === false ? 'transparent' : t.paper2,
            color: visibility[k] === false ? t.ink3 : t.ink,
            border: `1px solid ${t.rule}`, borderRadius: 14,
            fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name={visibility[k] === false ? 'eye-off' : 'eye'} size={11} />
            {k}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 16px' }}>
        {visible.length === 0 && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
            Write a few sentences and I will listen.
          </div>
        )}
        {visible.map(i => (
          <div key={i.id} style={{
            marginBottom: 8, padding: 10,
            background: t.paper2, borderLeft: `2px solid ${PANEL_ACCENT.language}`, borderRadius: 1,
          }}>
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.16, textTransform: 'uppercase',
            }}>{i.kind} · {i.label}</div>
            {i.quote && <div style={{
              fontFamily: t.display, fontSize: 13, color: t.ink, fontStyle: 'italic',
              marginTop: 4, lineHeight: 1.5,
            }}>{i.quote}</div>}
            <div style={{
              fontFamily: t.display, fontSize: 12, color: t.ink2, marginTop: 4, lineHeight: 1.5,
            }}>{i.rule}</div>
            {i.senses && (
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {Object.entries(i.senses).map(([s, n]) => (
                  <span key={s} style={{
                    fontFamily: t.mono, fontSize: 9,
                    color: n === 0 ? t.ink3 : t.ink2, letterSpacing: 0.12, textTransform: 'uppercase',
                    opacity: n === 0 ? 0.5 : 1,
                  }}>{s}·{n}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <SpecialistChat domain="language" accent={PANEL_ACCENT.language} />
    </PanelFrame>
  );
}

function RhythmGraph({ values, t }) {
  if (!values?.length) return null;
  const max = Math.max(20, ...values);
  const W = 360, H = 50, step = W / Math.max(values.length, 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 50 }}>
      <line x1={0} y1={H - 0.5} x2={W} y2={H - 0.5} stroke={t.rule} strokeWidth="0.5" />
      {values.map((v, i) => {
        const h = (v / max) * (H - 4);
        return (
          <rect key={i}
            x={i * step + 1} y={H - h - 1}
            width={Math.max(2, step - 2)} height={h}
            fill={v > 35 ? t.warn : v > 20 ? t.accent : PANEL_ACCENT.tangle}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

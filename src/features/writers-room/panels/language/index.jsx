// Loomwright — Language panel (plan §17). Issues + per-category eyeballs.

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import Icon from '../../entities/Icon';
import { activeChapter } from '../../store/selectors';

const KINDS = ['echo', 'adverb', 'repetition', 'grammar', 'readability'];

// Lightweight built-in detectors so the panel works without backend AI.
function detectIssues(text) {
  if (!text) return [];
  const issues = [];
  const adverbs = text.match(/\b\w+ly\b/gi) || [];
  if (adverbs.length > 3) {
    issues.push({
      id: `i_adverb_${Date.now()}`,
      kind: 'adverb',
      label: 'Adverb density',
      rule: `${adverbs.length} adverbs detected — consider trimming for stronger verbs.`,
      quote: adverbs.slice(0, 3).join(', '),
    });
  }
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  const counts = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  const repeats = Object.entries(counts).filter(([, n]) => n >= 4).slice(0, 3);
  for (const [w, n] of repeats) {
    issues.push({
      id: `i_rep_${w}`,
      kind: 'repetition',
      label: 'Word repetition',
      rule: `"${w}" appears ${n} times — consider variation.`,
      quote: w,
    });
  }
  // Echo: same word twice in close range.
  const echoMatch = text.match(/\b(\w+)\b\s+\1\b/i);
  if (echoMatch) {
    issues.push({
      id: `i_echo_${Date.now()}`,
      kind: 'echo',
      label: 'Echo',
      rule: 'Same word back-to-back.',
      quote: echoMatch[0],
    });
  }
  // Readability: very long sentences.
  const longSent = (text.match(/[^.!?]+[.!?]/g) || []).filter(s => s.split(/\s+/).length > 35);
  if (longSent.length > 0) {
    issues.push({
      id: `i_read_${Date.now()}`,
      kind: 'readability',
      label: 'Long sentence',
      rule: `${longSent.length} sentence${longSent.length > 1 ? 's' : ''} over 35 words. Consider splitting.`,
      quote: longSent[0].slice(0, 80) + '…',
    });
  }
  return issues;
}

export default function LanguagePanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const tweaks = store.ui?.tweaks || {};
  const visibility = tweaks.kindVisibility || {};
  const ch = activeChapter(store);
  const [issues, setIssues] = React.useState([]);

  React.useEffect(() => {
    if (!ch?.text) { setIssues([]); return; }
    setIssues(detectIssues(ch.text));
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
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rule}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
          </div>
        ))}
      </div>
    </PanelFrame>
  );
}

// Loomwright — Suggestion card (CODE-INSIGHT §3 / artboard 03-suggestions).
// Paper-textured tile; provenance chips always present (non-negotiable).

import React from 'react';
import { useTheme } from '../theme';

const TYPE_LABEL = {
  'item': 'Item',
  'callback': 'Callback',
  'sensory': 'Sensory',
  'tension': 'Tension',
  'pacing': 'Pacing',
  'continuity-fix': 'Continuity',
};

export default function SuggestionCard({ suggestion: s, onOpen, onSnooze, onDismiss, onBoost }) {
  const t = useTheme();

  const sugg = t.sugg || t.paper;
  const ink = t.suggInk || t.ink2;

  return (
    <div
      role="button" tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.(); } }}
      style={{
        background: sugg, color: t.ink,
        border: `1px solid ${t.rule}`, borderRadius: 4,
        padding: 12,
        animation: 'lw-card-in 200ms ease-out',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: t.mono, fontSize: 9, color: ink,
          letterSpacing: 0.16, textTransform: 'uppercase',
        }}>{TYPE_LABEL[s.type] || s.type}</span>
        <span style={{ flex: 1 }} />
        <RelevanceBar relevance={s.relevance} t={t} />
      </div>
      <div style={{
        fontFamily: t.display, fontSize: 16, color: t.ink, lineHeight: 1.25, fontWeight: 500,
      }}>{s.title}</div>
      {s.preview && (
        <div style={{
          fontFamily: t.display, fontSize: 13, color: t.ink2, fontStyle: 'italic',
          lineHeight: 1.4,
        }}>{s.preview}</div>
      )}
      {s.provenance?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {s.provenance.slice(0, 4).map((p, i) => (
            <span key={i} style={{
              padding: '1px 6px', background: 'transparent',
              border: `1px solid ${ink}55`, color: ink, borderRadius: 999,
              fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1,
            }}>{p.label}</span>
          ))}
        </div>
      )}
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        <button onClick={onOpen} style={primaryAction(t)}>Open</button>
        <button onClick={onSnooze} title="Snooze" style={ghostAction(t)}>Snooze</button>
        <button onClick={onDismiss} title="Dismiss" style={ghostAction(t)}>Dismiss</button>
        <span style={{ flex: 1 }} />
        <button
          onClick={onBoost}
          title="Boost — runs deeper reasoning (1 premium call)"
          style={{ ...ghostAction(t), color: s.boosted ? t.accent : t.ink3 }}>
          ✦ {s.boosted ? 'Boosted' : 'Boost'}
        </button>
      </div>
    </div>
  );
}

function RelevanceBar({ relevance = 50, t }) {
  const w = Math.max(0, Math.min(100, relevance));
  const c = w >= 70 ? t.good : w >= 40 ? t.warn : t.ink3;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 36, height: 3, background: t.rule, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', background: c }} />
      </div>
      <span style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
      }}>{w}%</span>
    </div>
  );
}

function primaryAction(t) {
  return {
    padding: '4px 10px', background: t.accent, color: t.onAccent,
    border: 'none', borderRadius: 2,
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
    textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
  };
}
function ghostAction(t) {
  return {
    padding: '4px 8px', background: 'transparent', color: t.ink3,
    border: `1px solid ${t.rule}`, borderRadius: 2,
    fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14,
    textTransform: 'uppercase', cursor: 'pointer',
  };
}

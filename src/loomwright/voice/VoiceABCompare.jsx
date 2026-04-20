/**
 * VoiceABCompare - pick two voice profiles, paste a paragraph, see both
 * "same text, scored by each profile" side-by-side with the per-dimension
 * diff visualised. Saves the comparison on chapter.voiceVersions[] so the
 * writer can return to it later.
 */

import React, { useMemo, useState } from 'react';
import { useTheme } from '../theme';
import { scoreVoice } from '../../services/voiceScore';

function ScoreBar({ pct, color, t }) {
  return (
    <div
      style={{
        width: '100%', height: 6,
        background: t.bg, border: `1px solid ${t.rule}`,
        borderRadius: 3, overflow: 'hidden', marginTop: 4,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          transition: 'width 300ms ease',
        }}
      />
    </div>
  );
}

export default function VoiceABCompare({ worldState }) {
  const t = useTheme();
  const profiles = worldState?.voiceProfiles || [];
  const [aId, setAId] = useState(profiles[0]?.id || null);
  const [bId, setBId] = useState(profiles[1]?.id || profiles[0]?.id || null);
  const [text, setText] = useState('');

  const pa = profiles.find((p) => p.id === aId);
  const pb = profiles.find((p) => p.id === bId);
  const baseA = pa?.baselineText || pa?.sample || '';
  const baseB = pb?.baselineText || pb?.sample || '';

  const rA = useMemo(() => (text.length > 40 && baseA ? scoreVoice(text, baseA) : null), [text, baseA]);
  const rB = useMemo(() => (text.length > 40 && baseB ? scoreVoice(text, baseB) : null), [text, baseB]);

  if (profiles.length < 1) {
    return (
      <div
        style={{
          padding: 20,
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          color: t.ink3,
          fontSize: 12,
        }}
      >
        No voice profiles yet. Create profiles in the Voice Studio to A/B them.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color: t.accent,
          letterSpacing: 0.14, textTransform: 'uppercase',
        }}
      >
        A/B voice compare
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
          A
          <select
            value={aId || ''}
            onChange={(e) => setAId(e.target.value)}
            style={{
              width: '100%', marginTop: 4,
              padding: '5px 10px',
              background: t.bg, color: t.ink,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.font, fontSize: 12, outline: 'none',
            }}
          >
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
          B
          <select
            value={bId || ''}
            onChange={(e) => setBId(e.target.value)}
            style={{
              width: '100%', marginTop: 4,
              padding: '5px 10px',
              background: t.bg, color: t.ink,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.font, fontSize: 12, outline: 'none',
            }}
          >
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a paragraph (or write one) to see how it scores against each profile."
        style={{
          width: '100%',
          minHeight: 140,
          padding: 10,
          background: t.bg,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          color: t.ink,
          fontFamily: t.font,
          fontSize: 14,
          lineHeight: 1.55,
          resize: 'vertical',
          outline: 'none',
        }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[{ r: rA, p: pa, label: 'A' }, { r: rB, p: pb, label: 'B' }].map(({ r, p, label }) => {
          if (!r) return <div key={label} style={{ color: t.ink3, fontSize: 12 }}>Paste text to score.</div>;
          const pct = Math.round(r.score * 100);
          const color = r.score > 0.75 ? t.good : r.score > 0.55 ? t.warn : t.bad;
          return (
            <div key={label} style={{ background: t.bg, border: `1px solid ${t.rule}`, borderRadius: t.radius, padding: 12 }}>
              <div style={{ fontFamily: t.mono, fontSize: 10, color, letterSpacing: 0.14, textTransform: 'uppercase' }}>
                {label} &middot; {p?.name} &middot; {pct}%
              </div>
              <ScoreBar pct={pct} color={color} t={t} />
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {Object.entries(r.dims).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 11, color: t.ink2 }}>
                    <div
                      style={{
                        fontFamily: t.mono, fontSize: 9, color: t.ink3,
                        letterSpacing: 0.1, textTransform: 'uppercase',
                      }}
                    >
                      {k}
                    </div>
                    <div style={{ color: t.ink }}>{Math.round(v * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

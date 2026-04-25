// Loomwright — Voice panel (plan §15).

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import { useSelection } from '../../selection';
import { characterById, chapterList } from '../../store/selectors';

export default function VoicePanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const cast = store.cast || [];
  const profiles = store.voice || [];
  const charId = sel.character || cast[0]?.id;
  const character = charId ? characterById(store, charId) : null;
  const profile = profiles.find(p => p.characterId === charId);
  const dials = profile?.dials || {};

  const [sample, setSample] = React.useState('');

  const teach = () => {
    if (!sample.trim() || !charId) return;
    const next = { ...(profile || {}), characterId: charId, id: profile?.id || `voice_${charId}`, samples: [...(profile?.samples || []), { text: sample, at: Date.now() }] };
    store.setSlice('voice', vs => {
      const arr = vs || [];
      const i = arr.findIndex(v => v.characterId === charId);
      if (i >= 0) return arr.map((x, j) => j === i ? next : x);
      return [...arr, next];
    });
    setSample('');
  };

  return (
    <PanelFrame
      title="How they sound"
      eyebrow="Voice"
      accent={PANEL_ACCENT.voice}
      onClose={onClose}
      width={420}>
      <div style={{ padding: '12px 16px' }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
        }}>Profiles</div>
        {cast.length === 0 && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
            Write a paragraph and I will start a profile.
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {cast.map(c => {
            const p = profiles.find(x => x.characterId === c.id);
            const score = p?.matchScore;
            return (
              <button key={c.id} onClick={() => select('character', c.id)} style={{
                padding: '4px 10px',
                background: charId === c.id ? (c.color || t.accent) + '22' : 'transparent',
                border: `1px solid ${charId === c.id ? (c.color || t.accent) : t.rule}`,
                borderRadius: 1, cursor: 'pointer',
                fontFamily: t.display, fontSize: 12, color: t.ink,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 6, height: 6, background: c.color || t.accent, borderRadius: '50%' }} />
                {c.name}
                {score != null && <span style={{
                  fontFamily: t.mono, fontSize: 9,
                  color: score > 0.85 ? t.good : score > 0.7 ? t.warn : t.ink3,
                }}>{Math.round(score * 100)}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {character && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.rule}` }}>
          <div style={{
            fontFamily: t.display, fontSize: 16, color: t.ink, fontWeight: 500, marginBottom: 4,
          }}>{character.name}</div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, marginBottom: 12 }}>
            Voice signature
          </div>
          {[
            { key: 'lyric', label: 'Lyric ⇄ Plain' },
            { key: 'sentenceLen', label: 'Sentence length' },
            { key: 'subordination', label: 'Subordination' },
            { key: 'sensoryDensity', label: 'Sensory density' },
            { key: 'distance', label: 'Distance' },
            { key: 'tension', label: 'Tension' },
          ].map(a => (
            <div key={a.key} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase' }}>{a.label}</span>
                <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>{(dials[a.key] ?? 0.5).toFixed(2)}</span>
              </div>
              <div style={{ height: 3, background: t.rule, borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ width: `${(dials[a.key] ?? 0.5) * 100}%`, height: '100%', background: character.color || t.accent }} />
              </div>
            </div>
          ))}
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 14, marginBottom: 6,
          }}>Teach the Loom</div>
          <textarea
            rows={3}
            placeholder="Paste a sample of their voice…"
            value={sample}
            onChange={e => setSample(e.target.value)}
            style={{
              width: '100%', padding: '6px 8px', fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.5,
              background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
            }}
          />
          <button onClick={teach} disabled={!sample.trim()} style={{
            marginTop: 8, padding: '6px 12px',
            background: sample.trim() ? PANEL_ACCENT.voice : t.rule,
            color: sample.trim() ? t.onAccent : t.ink3,
            border: 'none', borderRadius: 1,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: sample.trim() ? 'pointer' : 'not-allowed',
          }}>Teach</button>
        </div>
      )}
    </PanelFrame>
  );
}

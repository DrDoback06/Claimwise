// Loomwright — Cast > Voice tab. Per-character voice profile dials.

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';

const AXES = [
  { key: 'lyric', label: 'Lyric ⇄ Plain' },
  { key: 'sentenceLen', label: 'Sentence length' },
  { key: 'subordination', label: 'Subordination' },
  { key: 'sensoryDensity', label: 'Sensory density' },
  { key: 'distance', label: 'Distance' },
  { key: 'tension', label: 'Tension' },
];

export default function VoiceTab({ character: c, update }) {
  const t = useTheme();
  const store = useStore();
  const profile = (store.voice || []).find(v => v.characterId === c.id) || {};
  const dials = profile.dials || {};

  const setDial = (key, v) => {
    const next = { ...dials, [key]: v };
    const updated = { ...profile, characterId: c.id, dials: next, updatedAt: Date.now() };
    if (!profile.id) updated.id = `voice_${c.id}`;
    store.setSlice('voice', vs => {
      const arr = vs || [];
      const i = arr.findIndex(v => v.characterId === c.id);
      if (i >= 0) return arr.map((x, j) => j === i ? updated : x);
      return [...arr, updated];
    });
  };

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5, fontStyle: 'italic', marginBottom: 12 }}>
        Write a paragraph and the Loom will start a profile. You can shape it here.
      </div>
      {AXES.map(a => (
        <div key={a.key} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase' }}>{a.label}</span>
            <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>{(dials[a.key] ?? 0.5).toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={dials[a.key] ?? 0.5}
            onChange={e => setDial(a.key, Number(e.target.value))}
            style={{ width: '100%', accentColor: c.color || t.accent }} />
        </div>
      ))}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase' }}>Sample voice</div>
        <textarea
          rows={3}
          value={c.voice || c.dossier?.voice || ''}
          onChange={e => update({ voice: e.target.value, dossier: { ...(c.dossier || {}), voice: e.target.value } })}
          placeholder="Paste a line or two of dialogue…"
          style={{
            width: '100%', padding: '8px 10px',
            fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.5,
            background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none', marginTop: 4,
          }}
        />
      </div>
    </div>
  );
}

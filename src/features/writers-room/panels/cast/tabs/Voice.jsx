// Loomwright — Cast > Voice tab. Per-character voice profile dials.

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';
import { chapterList } from '../../../store/selectors';

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

      <DialogueExtract character={c} />
    </div>
  );
}

function DialogueExtract({ character }) {
  const t = useTheme();
  const store = useStore();
  const lines = React.useMemo(() => extractDialogue(store, character), [store.chapters, store.book?.chapterOrder, character?.name, character?.aliases]);
  if (!lines.length) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6,
      }}>What they have said · {lines.length} line{lines.length !== 1 ? 's' : ''}</div>
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {lines.slice(0, 30).map((ln, i) => (
          <div key={i} style={{
            padding: '6px 8px', marginBottom: 4,
            background: t.paper2, borderLeft: `2px solid ${character.color || t.accent}`, borderRadius: 1,
          }}>
            <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontStyle: 'italic', lineHeight: 1.5 }}>
              "{ln.text}"
            </div>
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.12, textTransform: 'uppercase', marginTop: 2,
            }}>ch.{ln.chapterN}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function extractDialogue(store, character) {
  if (!character?.name) return [];
  const names = [character.name, ...(character.aliases || [])].filter(Boolean);
  const namePattern = `(?:${names.map(escapeRegExp).join('|')})`;
  // Quoted line + (said/asked/whispered/etc.) + name, in either order, allowing for tags before or after.
  const verbs = '(?:said|asked|replied|whispered|shouted|murmured|cried|growled|gasped|breathed|hissed|added|continued|murmured)';
  const out = [];
  for (const ch of chapterList(store)) {
    const text = ch.text || '';
    if (!text) continue;
    // Pattern A: "Line," NAME said.
    const reA = new RegExp(`["“]([^"”]+?)["”][,.\\s]*(?:${verbs}\\s+)?${namePattern}`, 'gi');
    let m;
    while ((m = reA.exec(text)) !== null) out.push({ text: m[1].trim(), chapterN: ch.n });
    // Pattern B: NAME said, "Line."
    const reB = new RegExp(`${namePattern}[,\\s]+(?:${verbs}\\s+)?["“]([^"”]+?)["”]`, 'gi');
    while ((m = reB.exec(text)) !== null) out.push({ text: m[1].trim(), chapterN: ch.n });
  }
  // Dedupe by text.
  const seen = new Set();
  return out.filter(l => {
    const k = l.text.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

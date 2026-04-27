// Loomwright — Cast > Identity tab.

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';
import { characterMetrics } from '../appearances';
import { VoicePicker } from '../../../utilities/ReadAloud';

export default function IdentityTab({ character: c, update }) {
  const t = useTheme();
  const store = useStore();
  const metrics = React.useMemo(() => characterMetrics(store, c), [store.chapters, store.book?.chapterOrder, c]);
  const inp = {
    width: '100%', padding: '6px 8px',
    fontFamily: t.display, fontSize: 13, color: t.ink,
    background: 'transparent', border: `1px solid ${t.rule}`,
    borderRadius: 1, outline: 'none', marginTop: 4,
  };
  const lbl = {
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 10,
  };
  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={lbl}>Aliases</div>
      <input style={inp} value={(c.aliases || []).join(', ')}
        onChange={e => update({ aliases: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
      <div style={lbl}>Pronouns</div>
      <input style={inp} value={c.pronouns || ''} onChange={e => update({ pronouns: e.target.value })} />
      <div style={lbl}>Age</div>
      <input style={inp} value={c.age || ''} onChange={e => update({ age: e.target.value })} />
      <div style={lbl}>One-liner</div>
      <input style={inp} value={c.oneliner || ''} onChange={e => update({ oneliner: e.target.value })} />
      <div style={lbl}>Bio</div>
      <textarea rows={4} style={{ ...inp, fontFamily: t.display, lineHeight: 1.5 }}
        value={c.dossier?.bio || ''}
        onChange={e => update({ dossier: { ...(c.dossier || {}), bio: e.target.value } })} />
      <div style={lbl}>Tags</div>
      <input style={inp} value={(c.traits || []).join(', ')}
        onChange={e => update({ traits: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />

      <div style={lbl}>Read-aloud voice</div>
      <div style={{ marginTop: 4 }}>
        <VoicePicker
          value={c.readAloudVoiceId}
          onChange={(v) => update({ readAloudVoiceId: v })}
          label="Voice"
        />
      </div>

      <div style={{ marginTop: 18, padding: '10px 12px', background: t.paper2, borderLeft: `2px solid ${c.color || t.accent}`, borderRadius: 1 }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 6 }}>
          Across the manuscript
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <Stat label="Mentions" value={metrics.mentions} t={t} />
          <Stat label="Chapters" value={metrics.chapters} t={t} />
          <Stat label="Dialogue" value={metrics.dialogueLines} t={t} />
        </div>
        {metrics.firstAppears != null && (
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, marginTop: 8 }}>
            First appears in ch.{metrics.firstAppears}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, t }) {
  return (
    <div>
      <div style={{ fontFamily: t.display, fontSize: 22, color: t.ink, fontWeight: 500, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  );
}

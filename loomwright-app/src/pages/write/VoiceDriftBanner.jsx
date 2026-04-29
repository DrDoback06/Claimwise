/**
 * VoiceDriftBanner - a thin Writer's Room strip that shows how on-voice
 * the active chapter is vs the active voice profile's baseline. Mounts
 * under the page header and updates as the editor contents change.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Mic } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import { scoreVoice, scoreToTone } from '../../services/voiceScore';

function getActiveProfile(worldState, bookTab, currentChapter) {
  const books = worldState?.books || {};
  const book = books[bookTab] || Object.values(books)[0];
  const chapter = book?.chapters?.find((c) => Number(c.id) === Number(currentChapter));
  const assigned = chapter?.voiceProfileId;
  const profiles = worldState?.voiceProfiles || [];
  if (assigned) return profiles.find((p) => p.id === assigned);
  return profiles.find((p) => p.isDefault) || profiles[0] || null;
}

export default function VoiceDriftBanner({ worldState, bookTab, currentChapter }) {
  const t = useTheme();
  const [text, setText] = useState('');

  useEffect(() => {
    const find = () => document.querySelector('.lw-writer-surface textarea');
    const ta = find();
    if (!ta) { setText(''); return undefined; }
    const update = () => setText(ta.value || '');
    update();
    ta.addEventListener('input', update);
    return () => ta.removeEventListener('input', update);
  }, [bookTab, currentChapter]);

  const profile = useMemo(
    () => getActiveProfile(worldState, bookTab, currentChapter),
    [worldState, bookTab, currentChapter],
  );

  if (!profile) return null;

  const baseline = profile.baselineText || profile.sample || profile.examples?.join('\n') || '';
  if (!baseline || text.length < 40) return null;

  const { score, dims } = scoreVoice(text, baseline);
  const tone = scoreToTone(score);
  const color = tone === 'good' ? t.good : tone === 'warn' ? t.warn : t.bad;
  const pct = Math.round(score * 100);

  const worstDim = Object.entries(dims)
    .sort((a, b) => a[1] - b[1])[0];

  return (
    <div
      style={{
        padding: '6px 14px',
        borderBottom: `1px solid ${t.rule}`,
        background: t.paper,
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <Mic size={12} color={color} />
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color,
          letterSpacing: 0.14, textTransform: 'uppercase',
        }}
      >
        Voice &middot; {profile.name || 'Default'} &middot; {pct}%
      </div>
      <div
        style={{
          flex: 1,
          height: 4,
          background: t.bg,
          border: `1px solid ${t.rule}`,
          borderRadius: 2,
          overflow: 'hidden',
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
      {worstDim && worstDim[1] < 0.7 && (
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
          Drift: {worstDim[0]}
        </div>
      )}
    </div>
  );
}

// Loomwright — Timeline Scrubber primitive (CODE-INSIGHT §2 / §12).
// Shared by Dossier (re-derives Inventory / Knows / Location at the scrubbed
// chapter) and Atlas (focus chapter for travel paths).

import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';

export default function TimelineScrubber({ value, onChange, label = 'Chapter' }) {
  const t = useTheme();
  const store = useStore();
  const order = store.book?.chapterOrder || [];
  const chapters = order.map(id => store.chapters?.[id]).filter(Boolean);
  if (chapters.length === 0) return null;

  const idx = Math.max(0, order.indexOf(value));
  const current = chapters[idx];

  return (
    <div style={{
      padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 10,
      background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 4,
    }}>
      <span style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase',
      }}>{label}</span>
      <input
        type="range"
        min={0} max={chapters.length - 1}
        value={idx}
        onChange={e => onChange(order[parseInt(e.target.value, 10)])}
        style={{ flex: 1, accentColor: t.accent }}
      />
      <span style={{
        fontFamily: t.display, fontSize: 12, color: t.ink, minWidth: 100, textAlign: 'right',
      }}>ch.{current?.n ?? '?'}{current?.title ? ' · ' + current.title : ''}</span>
    </div>
  );
}

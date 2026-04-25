// Loomwright — Cast > Appearances tab. Auto-scan chapters for mentions.

import React from 'react';
import { useTheme } from '../../../theme';
import { useStore } from '../../../store';
import { chapterList } from '../../../store/selectors';

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function findMentions(name, text) {
  if (!name || !text) return [];
  const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const start = Math.max(0, m.index - 60);
    const end = Math.min(text.length, m.index + name.length + 60);
    out.push({
      start: m.index,
      snippet: (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : ''),
    });
    if (out.length > 8) break;
  }
  return out;
}

export default function AppearancesTab({ character: c }) {
  const t = useTheme();
  const store = useStore();
  const chapters = chapterList(store);

  const jumpTo = (chId) => {
    store.setPath('ui.activeChapterId', chId);
    store.setPath('book.currentChapterId', chId);
  };

  return (
    <div style={{ padding: '14px 16px' }}>
      {chapters.length === 0 && (
        <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic' }}>No chapters yet.</div>
      )}
      {chapters.map(ch => {
        const mentions = findMentions(c.name, ch.text || '');
        if (mentions.length === 0) return null;
        return (
          <div key={ch.id} style={{ marginBottom: 14 }}>
            <button onClick={() => jumpTo(ch.id)} style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink2, letterSpacing: 0.16, textTransform: 'uppercase',
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
            }}>ch.{ch.n} {ch.title} · {mentions.length} mention{mentions.length > 1 ? 's' : ''}</button>
            {mentions.slice(0, 3).map((m, i) => (
              <div key={i} style={{
                fontSize: 12, color: t.ink2, fontStyle: 'italic',
                lineHeight: 1.5, marginTop: 4, padding: '6px 8px',
                background: t.paper2, borderLeft: `2px solid ${c.color || t.accent}`, borderRadius: 1,
              }}>{m.snippet}</div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

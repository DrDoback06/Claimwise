// Loomwright — Atlas JourneyLayer (plan §12). Past=solid, current=pulse, future=dashed.

import React from 'react';
import { useTheme } from '../../theme';
import { useStore } from '../../store';
import { useSelection } from '../../selection';

export default function JourneyLayer({ view }) {
  const t = useTheme();
  const store = useStore();
  const { sel } = useSelection();
  const charId = sel.character;
  if (!charId) return null;

  const character = (store.cast || []).find(c => c.id === charId);
  if (!character) return null;
  const color = character.color || t.accent;

  const orderedChapterIds = store.book?.chapterOrder || [];
  const orderIdx = (id) => orderedChapterIds.indexOf(id);
  const activeIdx = orderIdx(store.ui?.activeChapterId || store.book?.currentChapterId);

  // Collect all visits for this character across all places.
  const visits = [];
  for (const p of store.places || []) {
    for (const v of p.visits || []) {
      if (v.characterId !== charId) continue;
      visits.push({ ...v, placeId: p.id, x: p.x, y: p.y, chapterIdx: orderIdx(v.chapterId) });
    }
  }
  visits.sort((a, b) => a.chapterIdx - b.chapterIdx);
  if (visits.length === 0) return null;

  const segments = [];
  for (let i = 0; i < visits.length - 1; i++) {
    segments.push({
      from: visits[i],
      to: visits[i + 1],
      future: visits[i].chapterIdx > activeIdx,
    });
  }

  return (
    <g>
      {segments.map((s, i) => (
        <line key={i}
          x1={s.from.x ?? 0} y1={s.from.y ?? 0}
          x2={s.to.x ?? 0} y2={s.to.y ?? 0}
          stroke={color} strokeWidth={s.future ? 1.5 : 2}
          strokeDasharray={s.future ? '4 3' : ''}
          opacity={s.future ? 0.6 : 1}
        />
      ))}
      {visits.map(v => {
        const isCurrent = v.chapterIdx === activeIdx;
        return (
          <circle key={v.id}
            cx={v.x ?? 0} cy={v.y ?? 0}
            r={isCurrent ? 5 : 3.5}
            fill={color} stroke="white" strokeWidth={isCurrent ? 1.2 : 0.8}
            className={isCurrent ? 'lw-breathe' : ''}
            style={{ transformOrigin: `${v.x}px ${v.y}px` }}
          />
        );
      })}
    </g>
  );
}

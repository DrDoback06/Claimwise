// Loomwright — Atlas JourneyLayer (plan §12). Past=solid, current=pulse, future=dashed.
// Optional multi-character mode draws every cast member's path in their own colour.

import React from 'react';
import { useTheme } from '../../theme';
import { useStore } from '../../store';
import { useSelection } from '../../selection';

function buildJourneyForCharacter(store, charId) {
  const orderedChapterIds = store.book?.chapterOrder || [];
  const orderIdx = (id) => orderedChapterIds.indexOf(id);
  const visits = [];
  for (const p of store.places || []) {
    for (const v of p.visits || []) {
      if (v.characterId !== charId) continue;
      visits.push({ ...v, placeId: p.id, x: p.x, y: p.y, chapterIdx: orderIdx(v.chapterId) });
    }
  }
  visits.sort((a, b) => a.chapterIdx - b.chapterIdx);
  return visits;
}

export default function JourneyLayer({ view }) {
  const t = useTheme();
  const store = useStore();
  const { sel } = useSelection();
  const tweaks = store.ui?.tweaks || {};
  const showAll = tweaks.atlasShowAll === true;

  const orderedChapterIds = store.book?.chapterOrder || [];
  const activeIdx = orderedChapterIds.indexOf(store.ui?.activeChapterId || store.book?.currentChapterId);

  const targets = showAll
    ? (store.cast || [])
    : (sel.character ? [(store.cast || []).find(c => c.id === sel.character)].filter(Boolean) : []);

  if (!targets.length) return null;

  return (
    <g>
      {targets.map(character => {
        const color = character.color || t.accent;
        const visits = buildJourneyForCharacter(store, character.id);
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
          <g key={character.id} opacity={showAll && sel.character && sel.character !== character.id ? 0.5 : 1}>
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
      })}
    </g>
  );
}

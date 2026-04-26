// Loomwright — Atlas JourneyLayer (plan §12). Past=solid, current=pulse, future=dashed.
// Optional multi-character mode draws every cast member's path in their own colour.
// 2026-04 design refresh (CODE-INSIGHT §5): if sel.multi has 2+ characters, ring
// every space-and-time meeting point (same place, same chapter).

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

// Find space-and-time meetings: pairs of characters present at the same
// place in the same chapter. Returns deduped { x, y, chapterIdx, who: charId[] }.
function buildIntersections(store, charIds) {
  if (!charIds || charIds.length < 2) return [];
  const buckets = new Map(); // key=`${placeId}:${chapterId}` -> Set<charId>
  for (const p of store.places || []) {
    for (const v of p.visits || []) {
      if (!charIds.includes(v.characterId)) continue;
      const key = `${p.id}:${v.chapterId}`;
      let bag = buckets.get(key);
      if (!bag) {
        bag = { x: p.x, y: p.y, chapterId: v.chapterId, placeId: p.id, who: new Set() };
        buckets.set(key, bag);
      }
      bag.who.add(v.characterId);
    }
  }
  const order = store.book?.chapterOrder || [];
  return [...buckets.values()]
    .filter(b => b.who.size >= 2 && b.x != null && b.y != null)
    .map(b => ({ x: b.x, y: b.y, who: [...b.who], chapterIdx: order.indexOf(b.chapterId) }));
}

export default function JourneyLayer() {
  const t = useTheme();
  const store = useStore();
  const { sel } = useSelection();
  const tweaks = store.ui?.tweaks || {};
  const showAll = tweaks.atlasShowAll === true;

  const orderedChapterIds = store.book?.chapterOrder || [];
  const activeIdx = orderedChapterIds.indexOf(sel.chapter || store.ui?.activeChapterId || store.book?.currentChapterId);

  // Multi-character: every selected character gets a path; intersections ring.
  const multiChars = (sel.multi || [])
    .filter(r => r.kind === 'character')
    .map(r => (store.cast || []).find(c => c.id === r.id))
    .filter(Boolean);

  const targets = multiChars.length >= 2 ? multiChars
    : (showAll ? (store.cast || [])
      : (sel.character ? [(store.cast || []).find(c => c.id === sel.character)].filter(Boolean) : []));

  if (!targets.length) return null;

  const intersections = multiChars.length >= 2
    ? buildIntersections(store, multiChars.map(c => c.id))
    : [];

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
      {intersections.map((m, i) => (
        <g key={'int-' + i} className="lw-breathe" style={{ transformOrigin: `${m.x}px ${m.y}px` }}>
          <circle cx={m.x} cy={m.y} r={14} fill="none" stroke={t.warn} strokeWidth={1.5} opacity={0.85} />
          <circle cx={m.x} cy={m.y} r={20} fill="none" stroke={t.warn} strokeWidth={0.6} opacity={0.4} />
        </g>
      ))}
    </g>
  );
}

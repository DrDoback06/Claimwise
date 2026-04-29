/**
 * RelationshipTimeline - per-pair mini timeline for the Relationships tab.
 *
 * Picks two characters and shows the chronological trail of events between
 * them (last spoke / fought / loved / died for) drawn from:
 *
 *   1. Entries on each actor's `relationships` array with a `chapter` or
 *      `bookChapter` hint.
 *   2. Chapter scripts that mention both characters within the same
 *      paragraph (heuristic but surfaces real co-appearances).
 *
 * Rendered inside the Relationships tab on CharacterDetail alongside the
 * Hub / Web / Graph toggle.
 */

import React, { useMemo, useState } from 'react';
import { Heart, Sword, MessageSquare, Clock, Users } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';

const CATEGORY_ICON = {
  spoke: MessageSquare,
  fought: Sword,
  loved: Heart,
  travelled: Users,
  event: Clock,
};

const CATEGORY_TONE = (t) => ({
  spoke:     t.accent_2 || t.accent,
  fought:    t.bad,
  loved:     '#d09c8e',
  travelled: t.accent,
  event:     t.ink2,
});

function findCoAppearances(a, b, books) {
  if (!a || !b) return [];
  const A = new RegExp(`\\b${a.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
  const B = new RegExp(`\\b${b.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
  const events = [];
  Object.values(books || {}).forEach((book) => {
    (book.chapters || []).forEach((chapter) => {
      const text = chapter.script || chapter.content || '';
      if (!text) return;
      // Split to paragraphs; a paragraph where both names appear is a
      // co-appearance.
      const paragraphs = text.split(/\n\n+/);
      paragraphs.forEach((p, idx) => {
        if (A.test(p) && B.test(p)) {
          // Classify by cheap keywords - not perfect, but produces a
          // useful event label.
          let category = 'event';
          const lower = p.toLowerCase();
          if (/\bkiss|embrace|lover|married|love\b/.test(lower)) category = 'loved';
          else if (/\bfight|struck|killed|blade|sword|blow|battle\b/.test(lower)) category = 'fought';
          else if (/\bsaid|asked|whisper|shouted|replied\b/.test(lower)) category = 'spoke';
          else if (/\brode|sailed|travel|walked|journey\b/.test(lower)) category = 'travelled';
          events.push({
            id: `${book.id}-${chapter.id}-${idx}`,
            bookId: book.id,
            chapterId: chapter.id,
            chapterTitle: chapter.title || `Chapter ${chapter.id}`,
            category,
            excerpt: p.trim().slice(0, 220),
          });
        }
      });
    });
  });
  return events;
}

export default function RelationshipTimeline({ character, worldState, onNavigateToCharacter, onNavigate }) {
  const t = useTheme();
  const actors = worldState?.actors || [];
  const books = worldState?.books || {};
  const otherActors = actors.filter((a) => a.id !== character?.id);
  const [partnerId, setPartnerId] = useState(otherActors[0]?.id || null);
  const partner = actors.find((a) => a.id === partnerId);
  const tone = CATEGORY_TONE(t);

  // Collect explicit relationship entries for this pair + co-appearances.
  const events = useMemo(() => {
    const explicit = ((character?.relationships || []).filter(
      (r) => r.otherId === partnerId || r.partnerId === partnerId || r.targetId === partnerId,
    )).map((r, i) => ({
      id: `rel_${i}`,
      bookId: r.bookId,
      chapterId: r.chapter || r.bookChapter || r.chapterId,
      chapterTitle: r.chapterTitle || '',
      category: r.kind || r.type || 'event',
      excerpt: r.note || r.description || r.summary || '',
      explicit: true,
    }));
    const inferred = findCoAppearances(character, partner, books);
    const all = [...explicit, ...inferred];
    // Order by chapterId ascending, grouping by book.
    return all.sort((x, y) => (Number(x.chapterId) || 0) - (Number(y.chapterId) || 0));
  }, [character, partner, partnerId, books]);

  if (!character) return null;
  if (otherActors.length === 0) {
    return (
      <div style={{ color: t.ink3, fontSize: 12, padding: 10 }}>
        Only one character in the cast - no pair timeline to render.
      </div>
    );
  }

  return (
    <div
      style={{
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Clock size={13} color={t.accent} />
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}
        >
          Pair timeline
        </div>
        <div style={{ flex: 1 }} />
        <label
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.ink3,
            letterSpacing: 0.12, textTransform: 'uppercase',
          }}
        >
          With
        </label>
        <select
          value={partnerId || ''}
          onChange={(e) => setPartnerId(e.target.value)}
          style={{
            padding: '4px 8px',
            background: t.bg,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink,
            fontFamily: t.font, fontSize: 12, outline: 'none',
          }}
        >
          {otherActors.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {!partner ? (
        <div style={{ color: t.ink3, fontSize: 12 }}>Pick a partner to see the timeline.</div>
      ) : events.length === 0 ? (
        <div style={{ color: t.ink3, fontSize: 12 }}>
          No recorded events or co-appearances between {character.name} and {partner.name}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {events.map((ev) => {
            const Icon = CATEGORY_ICON[ev.category] || Clock;
            const color = tone[ev.category] || t.ink2;
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => onNavigate?.('write')}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 100px 1fr',
                  gap: 10, alignItems: 'start',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: `1px solid ${t.rule}`,
                  borderRadius: t.radius,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: t.ink,
                }}
              >
                <div
                  style={{
                    width: 24, height: 24, borderRadius: 12,
                    background: t.paper,
                    border: `1px solid ${color}`,
                    color,
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  <Icon size={11} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: t.mono, fontSize: 10, color,
                      letterSpacing: 0.14, textTransform: 'uppercase',
                    }}
                  >
                    {ev.category}
                  </div>
                  <div style={{ fontSize: 11, color: t.ink3 }}>
                    Ch.{ev.chapterId || '?'}{ev.chapterTitle && ` - ${ev.chapterTitle}`}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: t.ink2, lineHeight: 1.5, fontStyle: ev.explicit ? 'normal' : 'italic' }}>
                  {ev.excerpt || 'Co-appearance detected in chapter text.'}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

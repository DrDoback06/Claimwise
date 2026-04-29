/**
 * InventoryOverChapters — per-character chapter scrubber.
 *
 * "Diablo-II style" progression viewer (Enhancement Roadmap flagship #2).
 * Shows, at any chapter N of the current book, the character's:
 *   - Items grid (grouped by slot), with state + note
 *   - Active skills and levels (as of N)
 *   - Base stats
 *   - Relationship snapshot (most-recent note per partner)
 *   - Knowledge (chapter memories / callbacks tagged to this character)
 *
 * Data comes from the existing worldState shape:
 *   - worldState.itemBank[*].track[chapter] = { actorId, slotId, stateId, note }
 *   - worldState.books[bookId].chapters[]
 *   - actor.activeSkills, baseStats, relationships, memories
 *
 * This is designed to keep working even if most items don't have chapter
 * tracks yet — unknown slots fall back to generic "Held". Canon Weaver
 * populates tracks when it applies edits, so this viewer becomes richer
 * over time.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Briefcase, Zap, Heart, BookOpen, Users } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';

const SLOT_ORDER = [
  'head', 'neck', 'torso', 'cloak', 'belt', 'hands', 'main', 'off',
  'ring1', 'ring2', 'legs', 'feet', 'pack', 'charm', 'hidden', 'worn',
];
const SLOT_LABEL = {
  head: 'Head', neck: 'Neck', torso: 'Torso', cloak: 'Cloak', belt: 'Belt',
  hands: 'Hands', main: 'Main', off: 'Off-hand', ring1: 'Ring (L)', ring2: 'Ring (R)',
  legs: 'Legs', feet: 'Feet', pack: 'Pack', charm: 'Charms', hidden: 'Hidden', worn: 'Worn',
};

function pickItemsForActorAtChapter(items, actorId, chapterNum) {
  const out = [];
  (items || []).forEach((item) => {
    const track = item.track || {};
    // Walk chapters 1..chapterNum, most recent record wins. Missing entries
    // inherit from the previous chapter (carry-over).
    let current = null;
    for (let ch = 1; ch <= chapterNum; ch += 1) {
      if (track[ch]) current = { chapter: ch, ...track[ch] };
    }
    if (current && current.actorId === actorId && current.stateId !== 'lost' && current.stateId !== 'given') {
      out.push({ ...item, snapshot: current });
    }
  });
  return out;
}

function StatBlock({ label, value, tone, t }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: t.bg,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
      }}
    >
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 9,
          color: tone || t.accent,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, marginTop: 2 }}>{value}</div>
    </div>
  );
}

export default function InventoryOverChapters({ character, worldState, bookId }) {
  const t = useTheme();
  const actors = worldState?.actors || [];
  const books = worldState?.books || {};
  const items = worldState?.itemBank || [];
  const skills = worldState?.skillBank || [];
  const book = books[bookId] || Object.values(books)[0] || null;
  const chapters = book?.chapters || [];
  const maxChapter = chapters.length ? chapters[chapters.length - 1].id : 1;

  const [currentCh, setCurrentCh] = useState(maxChapter);

  useEffect(() => {
    setCurrentCh(maxChapter || 1);
  }, [maxChapter, character?.id]);

  const equipped = useMemo(
    () => pickItemsForActorAtChapter(items, character?.id, currentCh),
    [items, character?.id, currentCh],
  );

  const slotted = useMemo(() => {
    const bucket = {};
    equipped.forEach((it) => {
      const s = it.snapshot.slotId || 'pack';
      if (!bucket[s]) bucket[s] = [];
      bucket[s].push(it);
    });
    return bucket;
  }, [equipped]);

  const relSnapshot = useMemo(() => {
    const rels = character?.relationships || [];
    return rels.slice(0, 8);
  }, [character]);

  const memories = useMemo(() => {
    // Chapter memories stored on chapter objects; filter for this actor.
    const chapter = chapters.find((c) => c.id === currentCh);
    const all = chapter?.memories || chapter?.callbacks || [];
    return all
      .filter((m) => !m.actorId || m.actorId === character?.id)
      .slice(0, 6);
  }, [chapters, currentCh, character?.id]);

  if (!character) return null;
  if (!chapters.length) {
    return (
      <div style={{ color: t.ink3, fontStyle: 'italic', padding: 16 }}>
        No chapters in this book yet. The Journey viewer activates once chapters exist.
      </div>
    );
  }

  const chapter = chapters.find((c) => c.id === currentCh);
  const progress = Math.max(1, currentCh) / Math.max(1, maxChapter);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Scrubber */}
      <div
        style={{
          padding: '10px 14px',
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setCurrentCh((n) => Math.max(1, n - 1))}
          disabled={currentCh <= 1}
          style={{
            padding: 5, background: 'transparent',
            color: currentCh <= 1 ? t.ink3 : t.ink,
            border: `1px solid ${t.rule}`, borderRadius: t.radius,
            cursor: currentCh <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={14} />
        </button>
        <div
          style={{
            flex: 1,
            height: 6,
            background: t.bg,
            borderRadius: 3,
            position: 'relative',
            border: `1px solid ${t.rule}`,
          }}
        >
          <div
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${progress * 100}%`,
              background: t.accent,
              borderRadius: 3,
              transition: 'width 180ms ease',
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setCurrentCh((n) => Math.min(maxChapter, n + 1))}
          disabled={currentCh >= maxChapter}
          style={{
            padding: 5, background: 'transparent',
            color: currentCh >= maxChapter ? t.ink3 : t.ink,
            border: `1px solid ${t.rule}`, borderRadius: t.radius,
            cursor: currentCh >= maxChapter ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronRight size={14} />
        </button>
        <input
          type="range"
          min={1}
          max={maxChapter}
          value={currentCh}
          onChange={(e) => setCurrentCh(Number(e.target.value))}
          style={{ width: 140, accentColor: t.accent }}
        />
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.accent,
            letterSpacing: 0.16,
            textTransform: 'uppercase',
            minWidth: 80,
            textAlign: 'right',
          }}
        >
          Ch. {currentCh} / {maxChapter}
        </div>
      </div>

      {chapter?.title && (
        <div
          style={{
            fontFamily: t.display,
            fontSize: 20,
            color: t.ink,
            lineHeight: 1.2,
          }}
        >
          {chapter.title}
        </div>
      )}

      {/* Inventory grid */}
      <div
        style={{
          background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius,
          padding: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Briefcase size={13} color={t.accent} />
          <div
            style={{
              fontFamily: t.mono, fontSize: 10, color: t.accent,
              letterSpacing: 0.16, textTransform: 'uppercase',
            }}
          >
            Inventory as of ch.{currentCh}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 11, color: t.ink3 }}>{equipped.length} items</div>
        </div>
        {equipped.length === 0 ? (
          <div style={{ color: t.ink3, fontSize: 12, padding: '12px 0' }}>
            Nothing explicitly tracked for {character.name} at this chapter. Canon Weaver
            records inventory changes as edits are accepted &mdash; drop an idea (e.g.
            &ldquo;Mira finds a ring in ch.3&rdquo;) and it will show up here.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 8,
            }}
          >
            {SLOT_ORDER.map((slot) => {
              const list = slotted[slot];
              if (!list || list.length === 0) return null;
              return (
                <div
                  key={slot}
                  style={{
                    padding: 10,
                    background: t.bg,
                    border: `1px solid ${t.rule}`,
                    borderRadius: t.radius,
                  }}
                >
                  <div
                    style={{
                      fontFamily: t.mono, fontSize: 9, color: t.ink3,
                      letterSpacing: 0.12, textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    {SLOT_LABEL[slot] || slot}
                  </div>
                  {list.map((it) => (
                    <div key={it.id} style={{ fontSize: 12, color: t.ink, marginBottom: 2 }}>
                      <span style={{ color: t.ink }}>{it.name}</span>
                      {it.snapshot.stateId && it.snapshot.stateId !== 'pristine' && (
                        <span style={{ color: t.ink3, fontSize: 10, marginLeft: 6 }}>
                          &middot; {it.snapshot.stateId}
                        </span>
                      )}
                      {it.snapshot.note && (
                        <div style={{ fontSize: 10, color: t.ink3, fontStyle: 'italic', marginTop: 1 }}>
                          {it.snapshot.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Skills + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div
          style={{
            background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Zap size={13} color={t.accent} />
            <div
              style={{
                fontFamily: t.mono, fontSize: 10, color: t.accent,
                letterSpacing: 0.16, textTransform: 'uppercase',
              }}
            >
              Skills as of ch.{currentCh}
            </div>
          </div>
          {(character.activeSkills || []).length === 0 ? (
            <div style={{ color: t.ink3, fontSize: 12 }}>No active skills yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {character.activeSkills.map((ref) => {
                const s = skills.find((x) => x.id === ref.id);
                return (
                  <div
                    key={ref.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 10px',
                      background: t.bg,
                      border: `1px solid ${t.rule}`,
                      borderRadius: t.radius,
                      fontSize: 12,
                    }}
                  >
                    <span>{s?.name || ref.id}</span>
                    <span style={{ fontFamily: t.mono, color: t.accent }}>Lv {ref.val ?? 1}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Heart size={13} color={t.accent} />
            <div
              style={{
                fontFamily: t.mono, fontSize: 10, color: t.accent,
                letterSpacing: 0.16, textTransform: 'uppercase',
              }}
            >
              Stats
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
            {Object.entries(character.baseStats || {}).map(([k, v]) => (
              <StatBlock key={k} label={k} value={v} t={t} />
            ))}
          </div>
        </div>
      </div>

      {/* Relationships + knowledge */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div
          style={{
            background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Users size={13} color={t.accent} />
            <div
              style={{
                fontFamily: t.mono, fontSize: 10, color: t.accent,
                letterSpacing: 0.16, textTransform: 'uppercase',
              }}
            >
              Relationships
            </div>
          </div>
          {relSnapshot.length === 0 ? (
            <div style={{ color: t.ink3, fontSize: 12 }}>No tracked relationships.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {relSnapshot.map((r, i) => {
                const other = actors.find((a) => a.id === (r.otherId || r.partnerId || r.targetId)) || null;
                return (
                  <div
                    key={i}
                    style={{
                      padding: '6px 10px',
                      background: t.bg,
                      border: `1px solid ${t.rule}`,
                      borderRadius: t.radius,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ color: t.ink }}>{other?.name || r.name || 'Unknown'}</div>
                    <div style={{ color: t.ink3, fontSize: 11 }}>{r.type || r.label || 'relationship'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <BookOpen size={13} color={t.accent} />
            <div
              style={{
                fontFamily: t.mono, fontSize: 10, color: t.accent,
                letterSpacing: 0.16, textTransform: 'uppercase',
              }}
            >
              Knowledge at ch.{currentCh}
            </div>
          </div>
          {memories.length === 0 ? (
            <div style={{ color: t.ink3, fontSize: 12 }}>
              No chapter memories or callbacks recorded for this character yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {memories.map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 10px',
                    background: t.bg,
                    border: `1px solid ${t.rule}`,
                    borderRadius: t.radius,
                    fontSize: 12,
                    color: t.ink,
                  }}
                >
                  {m.title || m.label || m.text || JSON.stringify(m).slice(0, 120)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * InventoryMatrix - the whole-book inventory-over-chapters viewer.
 *
 * Per redesign doc 14 v2: rows = items, columns = chapters, cells = the
 * item's state at that chapter drawn from `item.track[chapter]`. A compact
 * palette makes the whole life of an object legible at a glance. Click a
 * row to open a "life timeline" drawer with quoted chapter snippets.
 *
 * Surfaces two ways:
 *   - As a "Matrix" sub-tab inside Character Detail > Journey (filtered to
 *     items the character owns)
 *   - Standalone page: `/?tab=items_library` > Matrix tab
 */

import React, { useMemo, useState } from 'react';
import { Briefcase, Filter, X, ChevronRight, Users } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import GiveToCharacterModal from './GiveToCharacterModal';

const STATE_COLOR = (t) => ({
  pristine:  t.good,
  worn:      t.ink2,
  damaged:   t.warn,
  broken:    t.bad,
  lost:      t.ink3,
  hidden:    t.ink2,
  gifted:    t.accent_2 || t.accent,
  stolen:    t.bad,
  returned:  t.good,
  concealed: t.ink3,
  equipped:  t.accent,
  carried:   t.accent,
});

function deriveState(track, chapter) {
  // Walk chapters 1..chapter, most recent record wins.
  let current = null;
  for (let ch = 1; ch <= chapter; ch += 1) {
    if (track[ch]) current = { chapter: ch, ...track[ch] };
  }
  return current;
}

function Cell({ record, colors, t, onClick }) {
  if (!record) {
    return (
      <div
        onClick={onClick}
        style={{
          width: 16, height: 16,
          background: 'transparent',
          border: `1px solid ${t.rule}`,
          cursor: onClick ? 'pointer' : 'default',
        }}
      />
    );
  }
  const state = record.stateId || 'carried';
  const color = colors[state] || t.ink2;
  const unr = !!record.unresolved;
  const tip = [
    `ch.${record.chapter} · ${state}`,
    record.note || '',
    record.quote ? `Quote: ${record.quote}` : '',
    unr ? 'Unresolved / open thread' : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <div
      onClick={onClick}
      title={tip}
      style={{
        width: 16,
        height: 16,
        background: color,
        border: unr ? `2px solid ${t.warn}` : `1px solid ${t.rule}`,
        cursor: onClick ? 'pointer' : 'default',
        opacity: state === 'lost' || state === 'broken' ? 0.5 : 1,
        boxSizing: 'border-box',
      }}
    />
  );
}

export default function InventoryMatrix({ worldState, setWorldState, filterOwnerId, onClose }) {
  const t = useTheme();
  const colors = STATE_COLOR(t);
  const itemBank = worldState?.itemBank || [];
  const actors = worldState?.actors || [];
  const books = Object.values(worldState?.books || {});
  const book = books[0];
  const chapters = book?.chapters || [];
  const [filterOwner, setFilterOwner] = useState(filterOwnerId || '');
  const [filterKind, setFilterKind] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [openItemId, setOpenItemId] = useState(null);
  const [giveItem, setGiveItem] = useState(null);

  const filteredItems = useMemo(() => {
    return itemBank.filter((item) => {
      const track = item.track || {};
      if (filterOwner) {
        const anyMatch = Object.values(track).some((rec) => rec.actorId === filterOwner);
        if (!anyMatch) return false;
      }
      if (filterKind && (item.type || '').toLowerCase() !== filterKind.toLowerCase()) return false;
      if (filterStatus) {
        const anyMatch = Object.values(track).some((rec) => rec.stateId === filterStatus);
        if (!anyMatch) return false;
      }
      return true;
    });
  }, [itemBank, filterOwner, filterKind, filterStatus]);

  const openItem = filteredItems.find((i) => i.id === openItemId) || null;
  const openTimeline = useMemo(() => {
    if (!openItem) return [];
    const track = openItem.track || {};
    return Object.keys(track)
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b)
      .map((ch) => {
        const rec = track[ch];
        const actor = actors.find((a) => a.id === rec.actorId);
        return { ch, ...rec, actor };
      });
  }, [openItem, actors]);

  const kinds = useMemo(
    () => Array.from(new Set(itemBank.map((i) => i.type).filter(Boolean))).sort(),
    [itemBank],
  );
  const statuses = useMemo(() => Object.keys(colors), [colors]);

  if (chapters.length === 0) {
    return (
      <div
        style={{
          padding: 30, textAlign: 'center',
          color: t.ink3, fontSize: 12,
          border: `1px dashed ${t.rule}`, borderRadius: t.radius,
          background: t.paper,
        }}
      >
        <Briefcase size={18} style={{ opacity: 0.5, marginBottom: 6 }} />
        <div>No chapters in this book yet. The matrix activates once chapters exist.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: openItem ? '1fr 340px' : '1fr', gap: 12 }}>
      <div
        style={{
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          padding: 14,
          overflow: 'hidden',
        }}
      >
        {/* Filters */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 12, flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontFamily: t.mono, fontSize: 10, color: t.accent,
              letterSpacing: 0.16, textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <Filter size={11} /> Filters
          </div>
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            style={{
              padding: '4px 8px',
              background: t.bg, color: t.ink,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.font, fontSize: 12, outline: 'none',
            }}
          >
            <option value="">All owners</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value)}
            style={{
              padding: '4px 8px',
              background: t.bg, color: t.ink,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.font, fontSize: 12, outline: 'none',
            }}
          >
            <option value="">All kinds</option>
            {kinds.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '4px 8px',
              background: t.bg, color: t.ink,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.font, fontSize: 12, outline: 'none',
            }}
          >
            <option value="">Any status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 11, color: t.ink3 }}>
            {filteredItems.length} of {itemBank.length} items &middot; {chapters.length} chapters
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: 5,
                background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: t.radius, cursor: 'pointer',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Matrix */}
        <div style={{ overflow: 'auto', maxHeight: '65vh' }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th
                  style={{
                    position: 'sticky', left: 0, top: 0,
                    background: t.paper,
                    padding: '6px 10px',
                    fontFamily: t.mono, fontSize: 10, color: t.ink3,
                    letterSpacing: 0.14, textTransform: 'uppercase',
                    textAlign: 'left',
                    zIndex: 2,
                    borderBottom: `1px solid ${t.rule}`,
                    minWidth: 220,
                  }}
                >
                  Item
                </th>
                {chapters.map((c) => (
                  <th
                    key={c.id}
                    title={c.title || ''}
                    style={{
                      position: 'sticky', top: 0,
                      background: t.paper,
                      padding: '4px 2px',
                      fontFamily: t.mono, fontSize: 9, color: t.ink3,
                      letterSpacing: 0.1, textTransform: 'uppercase',
                      minWidth: 20, width: 20,
                      borderBottom: `1px solid ${t.rule}`,
                    }}
                  >
                    {c.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setOpenItemId(item.id)}
                  style={{
                    cursor: 'pointer',
                    background: openItemId === item.id ? t.accentSoft : 'transparent',
                  }}
                >
                  <td
                    style={{
                      position: 'sticky', left: 0,
                      background: openItemId === item.id ? t.accentSoft : t.paper,
                      padding: '4px 10px',
                      borderBottom: `1px solid ${t.rule}`,
                      zIndex: 1,
                    }}
                  >
                    <div style={{ fontSize: 12, color: t.ink, fontWeight: 500 }}>{item.name}</div>
                    <div
                      style={{
                        fontFamily: t.mono, fontSize: 9, color: t.ink3,
                        letterSpacing: 0.1, textTransform: 'uppercase',
                      }}
                    >
                      {item.type || 'item'}{item.rarity ? ` · ${item.rarity}` : ''}
                    </div>
                  </td>
                  {chapters.map((c) => {
                    const rec = deriveState(item.track || {}, c.id);
                    return (
                      <td key={c.id} style={{ padding: 0, borderBottom: `1px solid ${t.rule}`, textAlign: 'center' }}>
                        <Cell record={rec} colors={colors} t={t} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: t.ink3, fontSize: 12 }}>
              No items match the current filters.
            </div>
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginTop: 10, flexWrap: 'wrap',
            fontFamily: t.mono, fontSize: 10, color: t.ink3,
            letterSpacing: 0.12, textTransform: 'uppercase',
          }}
        >
          Legend:
          {Object.entries(colors).map(([k, v]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, background: v, border: `1px solid ${t.rule}` }} />
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline drawer */}
      {openItem && (
        <aside
          style={{
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            padding: 16,
            overflowY: 'auto',
            maxHeight: '65vh',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div
                style={{
                  fontFamily: t.mono, fontSize: 10, color: t.accent,
                  letterSpacing: 0.14, textTransform: 'uppercase',
                }}
              >
                {openItem.type || 'item'}
              </div>
              <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, marginTop: 2 }}>
                {openItem.name}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenItemId(null)}
              style={{
                padding: 4,
                background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: t.radius, cursor: 'pointer',
              }}
            >
              <X size={12} />
            </button>
          </div>
          {openItem.desc && (
            <div style={{ fontSize: 12, color: t.ink2, marginTop: 6, lineHeight: 1.55 }}>
              {openItem.desc}
            </div>
          )}
          {setWorldState && (
            <button
              type="button"
              onClick={() => setGiveItem(openItem)}
              style={{
                marginTop: 10,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 10px',
                background: t.accent, color: t.onAccent,
                border: `1px solid ${t.accent}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <Users size={11} /> Give to character
            </button>
          )}
          <div
            style={{
              fontFamily: t.mono, fontSize: 10, color: t.ink3,
              letterSpacing: 0.14, textTransform: 'uppercase',
              marginTop: 14, marginBottom: 6,
            }}
          >
            Life timeline
          </div>
          {openTimeline.length === 0 ? (
            <div style={{ color: t.ink3, fontSize: 12 }}>
              No tracked events. Canon Weaver populates this as changes are accepted.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {openTimeline.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    padding: 8,
                    background: t.bg,
                    border: `1px solid ${t.rule}`,
                    borderRadius: t.radius,
                    fontSize: 11,
                  }}
                >
                  <div
                    style={{
                      fontFamily: t.mono, fontSize: 9, color: t.accent,
                      letterSpacing: 0.14, textTransform: 'uppercase',
                      marginBottom: 2,
                    }}
                  >
                    ch.{ev.ch} &middot; {ev.stateId || 'carried'}
                  </div>
                  <div style={{ color: t.ink }}>
                    {ev.actor ? ev.actor.name : 'Unknown owner'}
                    {ev.slotId && <span style={{ color: t.ink3 }}> &middot; {ev.slotId}</span>}
                    {ev.unresolved && (
                      <span style={{ marginLeft: 6, color: t.warn, fontFamily: t.mono, fontSize: 9 }}>
                        Open thread
                      </span>
                    )}
                  </div>
                  {ev.quote && (
                    <div style={{ fontSize: 11, color: t.ink2, marginTop: 4, fontStyle: 'italic', lineHeight: 1.45 }}>
                      &ldquo;{ev.quote}&rdquo;
                    </div>
                  )}
                  {ev.note && (
                    <div style={{ fontSize: 11, color: t.ink2, marginTop: 3, fontStyle: 'italic' }}>
                      {ev.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      )}

      {giveItem && (
        <GiveToCharacterModal
          isOpen={!!giveItem}
          item={giveItem}
          worldState={worldState}
          setWorldState={setWorldState}
          onClose={() => setGiveItem(null)}
        />
      )}
    </div>
  );
}

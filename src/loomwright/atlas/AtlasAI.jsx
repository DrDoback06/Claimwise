/**
 * Atlas AI — region map + floorplan view for Claimwise places.
 *
 * Persistence (additive on worldState):
 *   worldState.places = [{ id, name, kind, x%, y%, note, chapterIds[], mentions }]
 *   worldState.floorplans = [{ id, placeId, name, w, h, rooms[], doors[], pins[] }]
 *
 * Place proposals are generated per-chapter by extractPlaceProposals and
 * surfaced as "Propose" cards that can be accepted or rejected.
 */

import React, { useEffect, useMemo, useState } from 'react';
import LoomwrightShell from '../LoomwrightShell';
import { useTheme, ThemeToggle } from '../theme';
import Icon from '../primitives/Icon';
import Button from '../primitives/Button';
import Scrubber from '../primitives/Scrubber';
import { extractPlaceProposals } from './atlasAI';

const KIND_COLORS = {
  castle:  'oklch(70% 0.15 25)',
  city:    'oklch(72% 0.10 200)',
  town:    'oklch(78% 0.13 78)',
  village: 'oklch(78% 0.13 78)',
  ruin:    'oklch(60% 0.04 60)',
  shrine:  'oklch(70% 0.13 300)',
  feature: 'oklch(72% 0.13 145)',
  inn:     'oklch(78% 0.13 78)',
  road:    'oklch(60% 0.04 60)',
  river:   'oklch(72% 0.10 200)',
  forest:  'oklch(65% 0.13 145)',
  mountain:'oklch(60% 0.04 60)',
  sea:     'oklch(72% 0.10 200)',
  other:   'oklch(70% 0.00 0)',
};

const KINDS = Object.keys(KIND_COLORS);

function uid(prefix = 'pl') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function Sidebar({ places, activeId, onPick, chapters, chapterFilter, setChapterFilter, onNewPlace, onPropose, proposing, tab, setTab }) {
  const t = useTheme();
  const visible = chapterFilter == null
    ? places
    : places.filter((p) => (p.chapterIds || []).includes(chapterFilter));
  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        background: t.sidebar,
        borderRight: `1px solid ${t.rule}`,
        padding: '18px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        overflow: 'hidden',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.accent,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
          }}
        >
          Loomwright
        </div>
        <div style={{ fontFamily: t.display, fontSize: 18, fontWeight: 500, color: t.ink }}>
          Atlas AI
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 3, background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius }}>
        {[{ id: 'map', l: 'Region' }, { id: 'floor', l: 'Floor' }, { id: 'propose', l: 'Propose' }].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setTab(m.id)}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: tab === m.id ? t.accent : 'transparent',
              color: tab === m.id ? t.onAccent : t.ink2,
              border: 'none',
              borderRadius: 2,
              fontFamily: t.mono,
              fontSize: 10,
              letterSpacing: 0.12,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {m.l}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Button size="sm" onClick={onNewPlace} icon={<Icon name="plus" size={10} />}>
          Add place
        </Button>
        <Button size="sm" variant="ghost" onClick={onPropose} disabled={proposing} icon={<Icon name="sparkle" size={10} />}>
          {proposing ? '\u2026' : 'AI scan'}
        </Button>
      </div>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 9,
          color: t.ink3,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
        }}
      >
        Places \u00B7 {visible.length}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visible.map((p) => {
          const col = KIND_COLORS[p.kind] || t.accent;
          const isSel = activeId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                background: isSel ? t.paper : 'transparent',
                borderLeft: isSel ? `2px solid ${col}` : '2px solid transparent',
                border: 'none',
                cursor: 'pointer',
                color: t.ink,
                textAlign: 'left',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: col }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: t.display,
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontFamily: t.mono,
                    fontSize: 9,
                    color: t.ink3,
                    letterSpacing: 0.1,
                    textTransform: 'uppercase',
                  }}
                >
                  {p.kind} \u00B7 {(p.chapterIds || []).length} chapters
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {chapters.length > 0 && (
        <Scrubber
          chapters={[null, ...chapters]}
          value={chapterFilter ?? null}
          onChange={setChapterFilter}
          compact
          labelFn={(c) => (c == null ? 'All chapters' : `Chapter ${c}`)}
        />
      )}
    </aside>
  );
}

function RegionMap({ places, activeId, onPick, onDragPlace, chapterFilter }) {
  const t = useTheme();
  const [dragId, setDragId] = useState(null);
  const filtered = chapterFilter == null ? places : places.filter((p) => (p.chapterIds || []).includes(chapterFilter));
  const onMove = (e) => {
    if (!dragId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onDragPlace(dragId, x, y);
  };
  const onUp = () => setDragId(null);
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: t.paper,
        borderBottom: `1px solid ${t.rule}`,
      }}
    >
      <div
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(ellipse at 35% 40%, rgba(255,255,255,0.04), transparent 65%), linear-gradient(180deg, transparent 0, rgba(0,0,0,0.15) 100%)',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.7 }}
        >
          <path
            d="M 0 55 Q 20 60 35 58 T 60 62 T 100 60"
            fill="none"
            stroke={t.accent2}
            strokeWidth={0.6}
            strokeDasharray="1 1.2"
          />
          <path
            d="M 0 15 L 14 8 L 24 18 L 32 10 L 46 18 L 58 10 L 70 20 L 82 12 L 100 24"
            fill="none"
            stroke={t.ink3}
            strokeWidth={0.7}
          />
        </svg>
        {filtered.map((p) => {
          const col = KIND_COLORS[p.kind] || t.accent;
          const active = activeId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => setDragId(p.id)}
              onClick={() => onPick(p.id)}
              style={{
                position: 'absolute',
                left: `${p.x ?? 50}%`,
                top: `${p.y ?? 50}%`,
                transform: 'translate(-50%, -50%)',
                background: 'transparent',
                border: 'none',
                cursor: dragId === p.id ? 'grabbing' : 'grab',
                color: t.ink,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span
                style={{
                  width: active ? 14 : 10,
                  height: active ? 14 : 10,
                  borderRadius: '50%',
                  background: col,
                  boxShadow: active ? `0 0 0 3px ${t.accentSoft}` : 'none',
                  border: `1px solid ${t.bg}`,
                }}
              />
              <span
                style={{
                  fontFamily: t.mono,
                  fontSize: 9,
                  color: active ? t.accent : t.ink2,
                  letterSpacing: 0.12,
                  textTransform: 'uppercase',
                  padding: '1px 4px',
                  background: t.paper + 'cc',
                  borderRadius: 2,
                }}
              >
                {p.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlaceDetail({ place, chapters, onPatch, onDelete }) {
  const t = useTheme();
  if (!place) {
    return (
      <div style={{ padding: 18, color: t.ink3, fontSize: 13 }}>
        Pick a place on the map to see details.
      </div>
    );
  }
  return (
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 10,
          color: t.accent,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
        }}
      >
        Place
      </div>
      <input
        value={place.name}
        onChange={(e) => onPatch({ name: e.target.value })}
        style={{
          fontFamily: t.display,
          fontSize: 20,
          fontWeight: 500,
          background: 'transparent',
          border: `1px solid ${t.rule}`,
          color: t.ink,
          padding: '6px 10px',
          borderRadius: t.radius,
        }}
      />
      <select
        value={place.kind}
        onChange={(e) => onPatch({ kind: e.target.value })}
        style={{
          padding: '6px 10px',
          background: t.paper2,
          color: t.ink,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          fontFamily: t.mono,
          fontSize: 11,
        }}
      >
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <textarea
        value={place.note || ''}
        onChange={(e) => onPatch({ note: e.target.value })}
        placeholder="Notes \u2014 what matters here, who lives here, what happens."
        rows={4}
        style={{
          padding: 10,
          background: t.paper2,
          color: t.ink,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          fontFamily: t.font,
          fontSize: 12,
          lineHeight: 1.5,
          resize: 'vertical',
        }}
      />
      <div>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 9,
            color: t.ink3,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Appears in chapters
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {chapters.map((ch) => {
            const active = (place.chapterIds || []).includes(ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  const set = new Set(place.chapterIds || []);
                  if (active) set.delete(ch.id);
                  else set.add(ch.id);
                  onPatch({ chapterIds: Array.from(set).sort((a, b) => a - b) });
                }}
                style={{
                  padding: '3px 7px',
                  fontFamily: t.mono,
                  fontSize: 9,
                  background: active ? t.accentSoft : 'transparent',
                  color: active ? t.accent : t.ink3,
                  border: `1px solid ${active ? t.accent : t.rule}`,
                  borderRadius: 2,
                  cursor: 'pointer',
                  letterSpacing: 0.1,
                }}
                title={ch.title || ''}
              >
                {ch.id}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <Button size="sm" variant="danger" onClick={onDelete} icon={<Icon name="trash" size={10} />}>
          Remove place
        </Button>
      </div>
    </div>
  );
}

function ProposalsPane({ proposals, onAccept, onReject, chapterId }) {
  const t = useTheme();
  if (!proposals.length) {
    return (
      <div style={{ padding: 18, color: t.ink3, fontSize: 13 }}>
        No fresh proposals. Click <strong>AI scan</strong> in the sidebar to extract places
        from the chapter's prose.
      </div>
    );
  }
  return (
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 10,
          color: t.accent,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
        }}
      >
        Proposed places from chapter {chapterId ?? '\u2014'}
      </div>
      {proposals.map((p) => (
        <div
          key={p.name + (p.whereInText || '')}
          style={{
            padding: 12,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ fontFamily: t.display, fontSize: 15, fontWeight: 500 }}>
              {p.name}
            </div>
            <span
              style={{
                fontFamily: t.mono,
                fontSize: 9,
                letterSpacing: 0.12,
                textTransform: 'uppercase',
                color:
                  p.confidence === 'high'
                    ? t.good
                    : p.confidence === 'low'
                    ? t.bad
                    : t.warn,
              }}
            >
              {p.confidence}
            </span>
          </div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.ink3,
              letterSpacing: 0.1,
              marginTop: 4,
            }}
          >
            {p.kind}
          </div>
          {p.whereInText && (
            <div style={{ fontSize: 12, color: t.ink2, marginTop: 6, fontStyle: 'italic' }}>
              {p.whereInText}
            </div>
          )}
          {p.note && (
            <div style={{ fontSize: 12, color: t.ink2, marginTop: 4 }}>{p.note}</div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <Button size="sm" variant="primary" onClick={() => onAccept(p)}>
              Pin on map
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onReject(p)}>
              Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AtlasBody({ worldState, setWorldState }) {
  const t = useTheme();
  const bookIds = Object.keys(worldState?.books || {}).map(Number).sort((a, b) => a - b);
  const [bookId, setBookId] = useState(bookIds[bookIds.length - 1] || 1);
  const book = worldState?.books?.[bookId];
  const chapters = book?.chapters || [];
  const chapterIds = chapters.map((c) => c.id);
  const [chapterFilter, setChapterFilter] = useState(null);
  const [tab, setTab] = useState('map');
  const [activeId, setActiveId] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [proposing, setProposing] = useState(false);

  const places = useMemo(() => worldState?.places || [], [worldState?.places]);
  const active = places.find((p) => p.id === activeId) || null;

  useEffect(() => {
    if (!active && places.length) setActiveId(places[0].id);
  }, [places, active]);

  const persistPlaces = (next) => {
    setWorldState?.((prev) => ({ ...prev, places: next }));
  };

  const addPlace = () => {
    const p = {
      id: uid(),
      name: 'New place',
      kind: 'town',
      x: 50,
      y: 50,
      note: '',
      chapterIds: [],
      mentions: 0,
    };
    persistPlaces([...places, p]);
    setActiveId(p.id);
    setTab('map');
  };

  const patchPlace = (patch) => {
    if (!active) return;
    persistPlaces(places.map((p) => (p.id === active.id ? { ...p, ...patch } : p)));
  };

  const deletePlace = () => {
    if (!active) return;
    persistPlaces(places.filter((p) => p.id !== active.id));
    setActiveId(null);
  };

  const dragPlace = (id, x, y) => {
    persistPlaces(places.map((p) => (p.id === id ? { ...p, x, y } : p)));
  };

  const propose = async () => {
    const ch = chapterFilter
      ? chapters.find((c) => c.id === chapterFilter)
      : chapters[chapters.length - 1];
    if (!ch) return;
    setProposing(true);
    const existing = places.map((p) => p.name);
    const text = ch.text || ch.summary || '';
    const out = await extractPlaceProposals(text, ch.id, existing);
    setProposals(out);
    setTab('propose');
    setProposing(false);
  };

  const acceptProposal = (p) => {
    const chId = chapterFilter ?? chapters[chapters.length - 1]?.id ?? 1;
    const newPlace = {
      id: uid(),
      name: p.name,
      kind: p.kind || 'other',
      x: 50,
      y: 50,
      note: p.note || '',
      chapterIds: [chId],
      mentions: 1,
    };
    persistPlaces([...places, newPlace]);
    setActiveId(newPlace.id);
    setProposals((old) => old.filter((x) => x.name !== p.name));
    setTab('map');
  };

  const rejectProposal = (p) => {
    setProposals((old) => old.filter((x) => x.name !== p.name));
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <Sidebar
        places={places}
        activeId={activeId}
        onPick={setActiveId}
        chapters={chapterIds}
        chapterFilter={chapterFilter}
        setChapterFilter={setChapterFilter}
        onNewPlace={addPlace}
        onPropose={propose}
        proposing={proposing}
        tab={tab}
        setTab={setTab}
      />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '10px 20px',
            borderBottom: `1px solid ${t.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {bookIds.length > 1 && (
            <select
              value={bookId}
              onChange={(e) => setBookId(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                background: t.paper2,
                color: t.ink,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                fontFamily: t.mono,
                fontSize: 11,
              }}
            >
              {bookIds.map((id) => (
                <option key={id} value={id}>
                  {worldState.books[id]?.title || `Book ${id}`}
                </option>
              ))}
            </select>
          )}
          <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink }}>
            {book?.title || 'Untitled book'}
          </div>
          <div style={{ flex: 1 }} />
          <ThemeToggle />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {tab === 'map' && (
            <>
              <RegionMap
                places={places}
                activeId={activeId}
                onPick={setActiveId}
                onDragPlace={dragPlace}
                chapterFilter={chapterFilter}
              />
              <PlaceDetail
                place={active}
                chapters={chapters}
                onPatch={patchPlace}
                onDelete={deletePlace}
              />
            </>
          )}
          {tab === 'floor' && (
            <div style={{ padding: 24, color: t.ink3, fontSize: 13 }}>
              Floorplan editor coming soon \u2014 use Region tab to pin places for now.
            </div>
          )}
          {tab === 'propose' && (
            <ProposalsPane
              proposals={proposals}
              onAccept={acceptProposal}
              onReject={rejectProposal}
              chapterId={chapterFilter ?? chapters[chapters.length - 1]?.id}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function AtlasAI({ scoped = false, ...props }) {
  return (
    <LoomwrightShell scrollable={false} scoped={scoped}>
      <AtlasBody {...props} />
    </LoomwrightShell>
  );
}

export { AtlasBody };


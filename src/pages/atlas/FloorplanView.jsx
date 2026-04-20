/**
 * FloorplanView - vector floorplan editor for a place (doc 13).
 *
 * Data model (extends the `floorplans` store provisioned in DB v23):
 *   {
 *     id: string,
 *     placeId: string,
 *     kind: 'floorplan',
 *     name: string,
 *     bounds: { w, h },
 *     rooms: [{ id, name, x, y, w, h, note, sceneChapterIds: number[] }],
 *     doors: [{ x, y }],
 *     pins: [{ x, y, label, chapterId, color }],
 *     upperFloorId: string | null,
 *     createdAt: number,
 *   }
 *
 * Interaction:
 *   - No floorplan yet for the selected place -> "Create floorplan" CTA.
 *   - Once created, the SVG canvas shows the outer wall + rooms.
 *     Click a room to select it. Drag its corner to resize (SVG <rect>).
 *     + New room adds a default-sized room in the centre.
 *   - Hover a room -> right pane shows its note + scenes.
 *   - "Generate upper floor" duplicates the current rooms with empty notes.
 *   - "Re-read all scenes" dispatches a Canon Weaver sweep asking it to
 *     scan every scene set here and update the room notes.
 *   - Scene pins are rendered per-room from the chapter data; click a pin
 *     to jump to the chapter in Write.
 *
 * This is a usable MVP: not a full CAD tool, but enough to sketch a place
 * and wire it to chapter events.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Layers, RefreshCw, Trash2, Save, X, Lock, Unlock } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import toastService from '../../services/toastService';
import { dispatchWeaver } from '../../loomwright/weaver/weaverAI';

const DEFAULT_BOUNDS = { w: 480, h: 300 };

function makeBlankFloorplan(place) {
  const id = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    placeId: place?.id || null,
    kind: 'floorplan',
    name: `${place?.name || 'Place'} - ground floor`,
    bounds: DEFAULT_BOUNDS,
    rooms: [
      { id: 'r_hall', name: 'Hall', x: 100, y: 60, w: 180, h: 120, note: '', sceneChapterIds: [] },
      { id: 'r_side', name: 'Side room', x: 300, y: 60, w: 100, h: 80, note: '', sceneChapterIds: [] },
    ],
    doors: [{ x: 200, y: 180 }],
    pins: [],
    upperFloorId: null,
    createdAt: Date.now(),
  };
}

function useFloorplanForPlace(place, worldState) {
  const [fp, setFp] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!place) { setFp(null); return; }
    const stored = (worldState?.floorplans || []).find(
      (f) => f.placeId === place.id && f.kind === 'floorplan' && !f.isUpper,
    );
    setFp(stored || null);
  }, [place, worldState?.floorplans]);

  return [fp, setFp, loading, setLoading];
}

function persistFloorplan(fp, setWorldState) {
  return (async () => {
    try { await db.update('floorplans', fp); }
    catch (_e) {
      try { await db.add('floorplans', fp); } catch (__e) { /* noop */ }
    }
    setWorldState?.((prev) => {
      const existing = (prev?.floorplans || []).some((f) => f.id === fp.id);
      return {
        ...(prev || {}),
        floorplans: existing
          ? prev.floorplans.map((f) => (f.id === fp.id ? fp : f))
          : [...(prev?.floorplans || []), fp],
      };
    });
  })();
}

function RoomCard({ room, active, onEdit, onRemove }) {
  const t = useTheme();
  const [draft, setDraft] = useState(room);
  useEffect(() => setDraft(room), [room]);
  const commit = () => onEdit?.(draft);
  return (
    <div
      style={{
        padding: 12,
        background: active ? t.accentSoft : t.bg,
        border: `1px solid ${active ? t.accent : t.rule}`,
        borderRadius: t.radius,
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          onBlur={commit}
          style={{
            flex: 1,
            padding: '4px 8px',
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink, fontFamily: t.display, fontSize: 13, outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => onEdit?.({ ...room, locked: !room.locked })}
          title={room.locked ? 'Unlock room' : 'Lock room so it can\'t be dragged'}
          aria-label={room.locked ? 'Unlock room' : 'Lock room'}
          style={{
            padding: 5,
            background: room.locked ? t.accentSoft : 'transparent',
            color: room.locked ? t.ink : t.ink3,
            border: `1px solid ${room.locked ? t.accent : t.rule}`,
            borderRadius: t.radius, cursor: 'pointer',
          }}
        >
          {room.locked ? <Lock size={11} /> : <Unlock size={11} />}
        </button>
        <button
          type="button"
          onClick={() => onRemove?.(room.id)}
          title="Remove room"
          aria-label="Remove room"
          style={{
            padding: 5, background: 'transparent',
            color: t.ink3, border: `1px solid ${t.rule}`,
            borderRadius: t.radius, cursor: 'pointer',
          }}
        >
          <Trash2 size={11} />
        </button>
      </div>
      <textarea
        value={draft.note || ''}
        onChange={(e) => setDraft({ ...draft, note: e.target.value })}
        onBlur={commit}
        placeholder="Notes (what happens here, who lives here, what's hidden)"
        style={{
          width: '100%',
          minHeight: 52,
          padding: 8,
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          color: t.ink, fontFamily: t.font, fontSize: 12, resize: 'vertical',
          outline: 'none',
        }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 6 }}>
        {['x', 'y', 'w', 'h'].map((axis) => (
          <label key={axis} style={{ fontSize: 10, color: t.ink3 }}>
            <div
              style={{
                fontFamily: t.mono, fontSize: 9, letterSpacing: 0.1, textTransform: 'uppercase',
              }}
            >
              {axis}
            </div>
            <input
              type="number"
              value={draft[axis]}
              onChange={(e) => setDraft({ ...draft, [axis]: Number(e.target.value) || 0 })}
              onBlur={commit}
              style={{
                width: '100%',
                padding: '3px 6px',
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                color: t.ink, fontFamily: t.mono, fontSize: 11, outline: 'none',
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function FloorplanView({ place, worldState, setWorldState, onNavigate }) {
  const t = useTheme();
  const [fp, setFp] = useFloorplanForPlace(place, worldState);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [hoveredRoomId, setHoveredRoomId] = useState(null);
  const roomDrag = React.useRef(null);
  const [roomDragPreview, setRoomDragPreview] = useState(null);

  const toFpCoords = (clientX, clientY, svg, bounds) => {
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * bounds.w;
    const y = ((clientY - rect.top) / rect.height) * bounds.h;
    return { x, y };
  };

  const selectedRoom = useMemo(
    () => (fp?.rooms || []).find((r) => r.id === selectedRoomId) || null,
    [fp, selectedRoomId],
  );

  const save = useCallback(
    (next) => {
      setFp(next);
      persistFloorplan(next, setWorldState);
    },
    [setFp, setWorldState],
  );

  if (!place) {
    return (
      <div
        style={{
          flex: 1,
          padding: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: t.ink2,
          background: t.bg,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            padding: 24,
            background: t.paper,
            border: `1px dashed ${t.rule}`,
            borderRadius: t.radius,
            textAlign: 'center',
          }}
        >
          <Layers size={24} color={t.accent} style={{ opacity: 0.7, marginBottom: 8 }} />
          <div style={{ fontFamily: t.display, fontSize: 18, color: t.ink, marginBottom: 6 }}>
            Floorplan editor
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            Pick a place in the Region tab, then choose &ldquo;Generate floorplan&rdquo; from its inspector.
          </div>
        </div>
      </div>
    );
  }

  if (!fp) {
    return (
      <div
        style={{
          flex: 1,
          padding: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: t.bg,
        }}
      >
        <div
          style={{
            maxWidth: 520,
            padding: 24,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            textAlign: 'center',
            color: t.ink2,
          }}
        >
          <Layers size={22} color={t.accent} style={{ opacity: 0.7, marginBottom: 8 }} />
          <div style={{ fontFamily: t.display, fontSize: 20, color: t.ink, marginBottom: 6 }}>
            No floorplan for {place.name} yet
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
            Start from a blank plan with two rooms, or ask Canon Weaver to draft one from any scenes set here.
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                const next = makeBlankFloorplan(place);
                save(next);
                setSelectedRoomId(next.rooms[0].id);
              }}
              style={{
                padding: '8px 14px',
                background: t.accent, color: t.onAccent,
                border: `1px solid ${t.accent}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 11,
                letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Start blank plan
            </button>
            <button
              type="button"
              onClick={() => {
                dispatchWeaver({
                  mode: 'single',
                  text: `Draft a floorplan for ${place.name} (${place.kind}). Include 4-7 rooms with short notes about what happens in each, referencing any chapter scenes set here.`,
                  autoRun: true,
                });
                toastService.info?.('Canon Weaver is drafting a floorplan proposal.');
                onNavigate?.('write');
              }}
              style={{
                padding: '8px 14px',
                background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 11,
                letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Ask Canon Weaver to draft
            </button>
          </div>
        </div>
      </div>
    );
  }

  const addRoom = () => {
    const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const next = {
      ...fp,
      rooms: [
        ...fp.rooms,
        {
          id,
          name: 'New room',
          x: Math.round(fp.bounds.w / 2 - 40),
          y: Math.round(fp.bounds.h / 2 - 30),
          w: 80, h: 60,
          note: '',
          sceneChapterIds: [],
        },
      ],
    };
    save(next);
    setSelectedRoomId(id);
  };

  const editRoom = (room) => {
    save({ ...fp, rooms: fp.rooms.map((r) => (r.id === room.id ? room : r)) });
  };

  const removeRoom = (id) => {
    save({ ...fp, rooms: fp.rooms.filter((r) => r.id !== id) });
    if (selectedRoomId === id) setSelectedRoomId(null);
  };

  const regenerateScenes = () => {
    dispatchWeaver({
      mode: 'single',
      text: `Re-read every chapter that's set at ${place.name}. Update the floorplan room notes with what happens in each and add any new rooms implied by the scenes. Respond with a structured edit per room.`,
      autoRun: true,
    });
    toastService.info?.('Canon Weaver is re-reading scenes for this place.');
    onNavigate?.('write');
  };

  const generateUpperFloor = async () => {
    if (fp.upperFloorId) {
      toastService.info?.('Upper floor already exists.');
      return;
    }
    const upperId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const upper = {
      id: upperId,
      placeId: place.id,
      kind: 'floorplan',
      name: `${place.name} - upper floor`,
      isUpper: true,
      bounds: fp.bounds,
      rooms: fp.rooms.map((r, i) => ({
        ...r,
        id: `${r.id}_u`,
        name: i === 0 ? 'Solar' : `Upper ${r.name}`,
        note: '',
      })),
      doors: fp.doors,
      pins: [],
      createdAt: Date.now(),
    };
    try { await db.add('floorplans', upper); } catch (_e) { /* noop */ }
    const next = { ...fp, upperFloorId: upperId };
    await persistFloorplan(next, setWorldState);
    setWorldState?.((prev) => ({
      ...(prev || {}),
      floorplans: [...(prev?.floorplans || []), upper],
    }));
    toastService.success?.('Upper floor duplicated. Edit its rooms in the new tab.');
  };

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div
        style={{
          flex: 1, minWidth: 0,
          background: t.mode === 'night' ? '#0a0e12' : '#ece3ca',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '8px 14px',
            background: t.paper,
            borderBottom: `1px solid ${t.rule}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: t.mono, fontSize: 10, color: t.accent,
              letterSpacing: 0.14, textTransform: 'uppercase',
            }}
          >
            {fp.name}
          </div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={addRoom}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px',
              background: t.accent, color: t.onAccent,
              border: `1px solid ${t.accent}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            <Plus size={10} /> New room
          </button>
          <button
            type="button"
            onClick={generateUpperFloor}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px',
              background: 'transparent', color: t.ink2,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            <Layers size={10} /> Generate upper floor
          </button>
          <button
            type="button"
            onClick={regenerateScenes}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px',
              background: 'transparent', color: t.ink2,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            <RefreshCw size={10} /> Re-read scenes
          </button>
        </div>

        <div
          style={{
            flex: 1, overflow: 'auto',
            padding: 40,
            display: 'grid', placeItems: 'center',
          }}
        >
          <svg
            viewBox={`0 0 ${fp.bounds.w} ${fp.bounds.h}`}
            style={{
              width: 'min(100%, 820px)',
              background: t.mode === 'night' ? '#111a22' : '#f5efdc',
              border: `1px solid ${t.rule}`,
            }}
          >
            <defs>
              <pattern
                id="lw-floorhatch"
                width="6" height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0" y1="0" x2="0" y2="6"
                  stroke={t.ink3}
                  strokeWidth="0.3"
                  opacity="0.2"
                />
              </pattern>
            </defs>
            <rect
              x={fp.bounds.w * 0.05}
              y={fp.bounds.h * 0.05}
              width={fp.bounds.w * 0.9}
              height={fp.bounds.h * 0.9}
              fill="url(#lw-floorhatch)"
              stroke={t.ink}
              strokeWidth="2"
            />
            {fp.rooms.map((r) => {
              const active = selectedRoomId === r.id;
              const hovered = hoveredRoomId === r.id;
              const preview = roomDragPreview?.id === r.id ? roomDragPreview : null;
              const rx = preview ? preview.x : r.x;
              const ry = preview ? preview.y : r.y;
              const locked = !!r.locked;
              return (
                <g
                  key={r.id}
                  onClick={() => setSelectedRoomId(r.id)}
                  onMouseEnter={() => setHoveredRoomId(r.id)}
                  onMouseLeave={() => setHoveredRoomId(null)}
                  onMouseDown={(e) => {
                    if (locked) return;
                    const svg = e.currentTarget.closest('svg');
                    if (!svg) return;
                    const coords = toFpCoords(e.clientX, e.clientY, svg, fp.bounds);
                    roomDrag.current = {
                      id: r.id,
                      offsetX: coords.x - r.x,
                      offsetY: coords.y - r.y,
                    };
                    e.stopPropagation();
                  }}
                  onMouseMove={(e) => {
                    if (!roomDrag.current || roomDrag.current.id !== r.id) return;
                    const svg = e.currentTarget.closest('svg');
                    if (!svg) return;
                    const coords = toFpCoords(e.clientX, e.clientY, svg, fp.bounds);
                    setRoomDragPreview({
                      id: r.id,
                      x: Math.max(0, Math.min(fp.bounds.w - r.w, coords.x - roomDrag.current.offsetX)),
                      y: Math.max(0, Math.min(fp.bounds.h - r.h, coords.y - roomDrag.current.offsetY)),
                    });
                  }}
                  onMouseUp={() => {
                    if (roomDrag.current && roomDrag.current.id === r.id && roomDragPreview) {
                      editRoom({ ...r, x: Math.round(roomDragPreview.x), y: Math.round(roomDragPreview.y) });
                    }
                    roomDrag.current = null;
                    setRoomDragPreview(null);
                  }}
                  style={{ cursor: locked ? 'not-allowed' : (roomDrag.current?.id === r.id ? 'grabbing' : 'grab') }}
                >
                  <rect
                    x={rx}
                    y={ry}
                    width={r.w}
                    height={r.h}
                    fill={active || hovered ? t.accentSoft : t.mode === 'night' ? '#0a0e12' : '#faf3de'}
                    stroke={active ? t.accent : t.ink}
                    strokeWidth={active ? 2 : 1.4}
                  />
                  <text
                    x={rx + r.w / 2}
                    y={ry + r.h / 2 + 4}
                    fontSize="11"
                    fill={t.ink}
                    textAnchor="middle"
                    fontFamily="'Fraunces', serif"
                    fontStyle="italic"
                  >
                    {r.name}{locked ? ' \u00b7 locked' : ''}
                  </text>
                </g>
              );
            })}
            {(fp.doors || []).map((d, i) => (
              <rect
                key={i}
                x={d.x - 6}
                y={d.y - 2}
                width="12"
                height="4"
                fill={t.mode === 'night' ? '#111a22' : '#f5efdc'}
              />
            ))}
            {(fp.pins || []).map((p, i) => (
              <g key={i} style={{ cursor: 'pointer' }}>
                <circle cx={p.x} cy={p.y} r="6" fill={p.color || t.accent} opacity="0.25" />
                <circle cx={p.x} cy={p.y} r="3" fill={p.color || t.accent} stroke={t.ink} strokeWidth="0.8" />
                <text
                  x={p.x + 8}
                  y={p.y + 3}
                  fontSize="10"
                  fill={t.ink}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  ch.{p.chapterId} &middot; {p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <aside
        style={{
          width: 320,
          flexShrink: 0,
          borderLeft: `1px solid ${t.rule}`,
          background: t.paper,
          padding: 20,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}
        >
          Rooms &middot; {fp.rooms.length}
        </div>
        <div style={{ fontFamily: t.display, fontSize: 16, color: t.ink, marginTop: 2, marginBottom: 10 }}>
          {selectedRoom ? selectedRoom.name : 'Select a room'}
        </div>
        {fp.rooms.map((r) => (
          <RoomCard
            key={r.id}
            room={r}
            active={r.id === selectedRoomId}
            onEdit={editRoom}
            onRemove={removeRoom}
          />
        ))}
      </aside>
    </div>
  );
}

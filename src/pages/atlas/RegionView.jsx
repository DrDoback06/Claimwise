/**
 * RegionView - the SVG region map (pan/zoom + drag+lock pins + polygon
 * draw + reference overlay, shipped in M34).
 *
 * - Wheel scroll to zoom toward the cursor; drag empty space to pan. The
 *   transform persists per-region in localStorage.
 * - Drag a pin to reposition it. Pins carry a `locked` flag; locked pins
 *   cannot be dragged. Lock / unlock from the inspector or by shift+click.
 * - Polygon draw tool: when the parent enables draw mode, clicks on the
 *   map append vertices to the in-progress landMass. Double-click closes
 *   and commits. ESC cancels.
 * - Reference-map overlay: the parent supplies a data-URL image + opacity
 *   slider; image renders behind the map content so users can trace over
 *   it.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import { KIND_COLORS, kindColor, KIND_OPTIONS } from './kindColors';
import { estimateJourney } from './travel';
import useAtlasTransform from './useAtlasTransform';

const DEFAULT_BOUNDS = { w: 96, h: 72 };

function defaultRegion(places = []) {
  const mountains = 'M 0 10 L 14 4 L 24 14 L 32 6 L 46 16 L 58 8 L 70 18 L 82 10 L 96 22';
  const river = 'M 0 55 Q 20 60 35 58 T 60 62 T 96 60';
  return { name: 'Region', bounds: DEFAULT_BOUNDS, mountains, river, roads: [], places };
}

function normalisePlace(place) {
  const x = typeof place.x === 'number' ? place.x : null;
  const y = typeof place.y === 'number' ? place.y : null;
  if (x != null && y != null && x <= 100 && y <= 100) {
    return { ...place, x: x > 96 ? x * (96 / 100) : x, y: y > 72 ? y * (72 / 100) : y };
  }
  const seed = (place.id || place.name || 'place').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { ...place, x: 10 + (seed * 17 % 78), y: 10 + (seed * 31 % 58) };
}

function knownPlaceIds(actor, currentCh, places) {
  if (!actor) return null;
  const out = new Set();
  const lower = (s) => (s || '').toLowerCase();
  const byName = new Map(places.map((p) => [lower(p.name), p.id]));
  (actor.timeline || []).forEach((evt) => {
    const ch = Number(evt.chapter);
    if (!ch || ch > currentCh) return;
    const loc = lower(evt.location);
    if (loc && byName.has(loc)) out.add(byName.get(loc));
  });
  places.forEach((p) => {
    const chapters = (p.chapterIds || p.ch || []).map(Number).filter(Boolean);
    if (chapters.some((c) => c <= currentCh)) out.add(p.id);
  });
  return out;
}

export default function RegionView({
  places,
  proposals,
  showProposals,
  selectedId,
  selectedProposalId,
  onSelectPlace,
  onSelectProposal,
  onDropPin,
  onMovePin,
  onToggleLock,
  pendingDropKind,
  worldState,
  povCharacterId,
  fogEnabled,
  currentChapter,
  travelMode,
  travelFromId,
  travelToId,
  onTravelPick,
  // Polygon draw
  drawMode = false,
  onPolygonCommit,
  landMasses = [],
  // Reference overlay
  referenceImage = null,
  referenceOpacity = 0.4,
  // Region identity for transform persistence
  regionKey = 'default',
}) {
  const t = useTheme();
  const svgRef = useRef(null);
  const [hoverPos, setHoverPos] = useState(null);
  const { transform, reset, zoomBy, shouldSuppressClick, handlers } = useAtlasTransform(regionKey);

  const region = useMemo(() => {
    const stored = worldState?.region;
    if (stored && stored.bounds) return stored;
    return defaultRegion();
  }, [worldState]);

  const placed = useMemo(() => places.map(normalisePlace), [places]);
  const proposedPlaced = useMemo(() => proposals.map(normalisePlace), [proposals]);

  const povActor = useMemo(
    () => (povCharacterId ? (worldState?.actors || []).find((a) => a.id === povCharacterId) : null),
    [povCharacterId, worldState?.actors],
  );
  const fogKnownIds = useMemo(
    () => (fogEnabled && povActor ? knownPlaceIds(povActor, currentChapter || 999, placed) : null),
    [fogEnabled, povActor, currentChapter, placed],
  );

  const travelFrom = placed.find((p) => p.id === travelFromId) || null;
  const travelTo = placed.find((p) => p.id === travelToId) || null;
  const journey = useMemo(
    () => estimateJourney(travelFrom, travelTo, { mode: travelMode, places: placed }),
    [travelFrom, travelTo, travelMode, placed],
  );

  // Drag-a-pin
  const dragState = useRef(null); // { pinId, startClientX, startClientY, originX, originY }
  const [dragPreview, setDragPreview] = useState(null); // { id, x, y }

  // Polygon draft
  const [polygonDraft, setPolygonDraft] = useState([]); // [[x, y], ...]
  const [polyHover, setPolyHover] = useState(null); // [x, y]

  // Keyboard: ESC cancels polygon draft
  useEffect(() => {
    if (!drawMode) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setPolygonDraft([]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawMode]);

  // Cancel polygon draft when draw mode toggles off
  useEffect(() => { if (!drawMode) setPolygonDraft([]); }, [drawMode]);

  const clientToMap = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    // Undo transform first, then map to viewBox coords.
    const tx = (px - transform.x) / transform.scale;
    const ty = (py - transform.y) / transform.scale;
    const x = (tx / rect.width) * region.bounds.w;
    const y = (ty / rect.height) * region.bounds.h;
    return { x, y };
  }, [transform, region.bounds]);

  const handleMapClick = (e) => {
    if (shouldSuppressClick()) return;
    if (drawMode) {
      const { x, y } = clientToMap(e.clientX, e.clientY);
      setPolygonDraft((list) => [...list, [x, y]]);
      return;
    }
    if (!pendingDropKind || !onDropPin) return;
    const { x, y } = clientToMap(e.clientX, e.clientY);
    onDropPin(x, y);
  };

  const handleMapDoubleClick = () => {
    if (!drawMode || polygonDraft.length < 3) return;
    const id = `land_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    onPolygonCommit?.({ id, name: `Land ${landMasses.length + 1}`, points: polygonDraft });
    setPolygonDraft([]);
  };

  const handleMove = (e) => {
    const { x, y } = clientToMap(e.clientX, e.clientY);
    setHoverPos({ x, y });
    if (drawMode && polygonDraft.length > 0) setPolyHover([x, y]);

    if (dragState.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const dx = (e.clientX - dragState.current.startClientX) / transform.scale;
      const dy = (e.clientY - dragState.current.startClientY) / transform.scale;
      const nx = dragState.current.originX + (dx / rect.width) * region.bounds.w;
      const ny = dragState.current.originY + (dy / rect.height) * region.bounds.h;
      setDragPreview({
        id: dragState.current.pinId,
        x: Math.max(0, Math.min(region.bounds.w, nx)),
        y: Math.max(0, Math.min(region.bounds.h, ny)),
      });
    }
  };

  const beginPinDrag = (pin, e) => {
    if (pin.locked || travelMode || drawMode) return;
    e.stopPropagation();
    dragState.current = {
      pinId: pin.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: pin.x,
      originY: pin.y,
    };
  };

  const endPinDrag = (e) => {
    if (!dragState.current || !dragPreview) {
      dragState.current = null;
      setDragPreview(null);
      return;
    }
    if (dragPreview.x != null && onMovePin) {
      onMovePin(dragState.current.pinId, dragPreview.x, dragPreview.y);
    }
    dragState.current = null;
    setDragPreview(null);
    if (e) e.stopPropagation?.();
  };

  const clickPin = (p, e) => {
    if (shouldSuppressClick()) return;
    if (e?.shiftKey) { onToggleLock?.(p.id); return; }
    if (onTravelPick) { onTravelPick(p.id); return; }
    onSelectPlace?.(p.id);
  };

  const transformAttr = `translate(${transform.x / 10},${transform.y / 10}) scale(${transform.scale})`;

  return (
    <div
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: t.mode === 'night' ? '#0a0e12' : '#ece3ca',
      }}
      onMouseUp={endPinDrag}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${region.bounds.w} ${region.bounds.h}`}
        style={{
          width: '100%', height: '100%', display: 'block',
          cursor: pendingDropKind || drawMode ? 'crosshair' : (dragState.current ? 'grabbing' : 'grab'),
          touchAction: 'none',
        }}
        preserveAspectRatio="xMidYMid meet"
        onClick={handleMapClick}
        onDoubleClick={handleMapDoubleClick}
        onMouseMove={(e) => { handleMove(e); handlers.onMouseMove(e); }}
        onMouseDown={handlers.onMouseDown}
        onMouseUp={handlers.onMouseUp}
        onMouseLeave={(e) => { setHoverPos(null); handlers.onMouseLeave(e); }}
        onWheel={handlers.onWheel}
      >
        <defs>
          <radialGradient id="lw-vignette" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={t.mode === 'night' ? '#111a22' : '#f0e8cf'} stopOpacity="0" />
            <stop offset="100%" stopColor={t.mode === 'night' ? '#050709' : '#c4b688'} stopOpacity="0.5" />
          </radialGradient>
          <pattern id="lw-hatch" width="1.5" height="1.5" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
            <line x1="0" y1="0" x2="0" y2="1.5" stroke={t.ink3} strokeWidth="0.08" opacity="0.35" />
          </pattern>
        </defs>

        {/* Transformed layer */}
        <g transform={transformAttr}>
          <rect className="lw-atlas-base" width={region.bounds.w} height={region.bounds.h} fill="url(#lw-vignette)" />

          {referenceImage && (
            <image
              href={referenceImage}
              x="0" y="0"
              width={region.bounds.w}
              height={region.bounds.h}
              preserveAspectRatio="xMidYMid slice"
              opacity={referenceOpacity}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Custom land masses (polygons). */}
          {landMasses.map((lm) => (
            <path
              key={lm.id}
              d={`M ${lm.points.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`}
              fill={t.mode === 'night' ? '#17222c' : '#e4d6aa'}
              stroke={t.ink}
              strokeWidth="0.2"
              opacity="0.9"
            />
          ))}

          {/* Polygon draft */}
          {drawMode && polygonDraft.length > 0 && (
            <g>
              <path
                d={`M ${polygonDraft.map(([x, y]) => `${x} ${y}`).join(' L ')}${polyHover ? ` L ${polyHover[0]} ${polyHover[1]}` : ''}`}
                fill={t.accentSoft}
                stroke={t.accent}
                strokeWidth="0.25"
                strokeDasharray="0.4 0.3"
                opacity="0.7"
              />
              {polygonDraft.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="0.4" fill={t.accent} />
              ))}
            </g>
          )}

          {region.mountains && (
            <>
              <path d={region.mountains} fill="none" stroke={t.ink} strokeWidth="0.22" opacity="0.6" />
              <path d="M 0 20 L 14 14 L 24 22 L 32 16 L 46 24 L 58 18 L 70 26 L 82 18 L 96 30" fill="none" stroke={t.ink} strokeWidth="0.18" opacity="0.35" />
              <rect x="0" y="0" width={region.bounds.w} height="22" fill="url(#lw-hatch)" opacity="0.5" />
            </>
          )}

          {region.river && (
            <>
              <path d={region.river} fill="none" stroke="#557a8a" strokeWidth="0.6" strokeLinecap="round" />
              <path d={region.river} fill="none" stroke="#7fb8c7" strokeWidth="0.2" strokeLinecap="round" />
            </>
          )}

          {(region.roads || []).map((r, i) => {
            const a = placed.find((p) => p.id === r.from);
            const b = placed.find((p) => p.id === r.to);
            if (!a || !b) return null;
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={t.ink3} strokeWidth="0.15"
                strokeDasharray="0.6 0.4" opacity="0.7"
              />
            );
          })}

          {travelFrom && travelTo && (
            <g>
              <line
                x1={travelFrom.x} y1={travelFrom.y} x2={travelTo.x} y2={travelTo.y}
                stroke={t.accent} strokeWidth="0.35"
                strokeDasharray="0.6 0.3" opacity="0.8"
              />
              <circle cx={(travelFrom.x + travelTo.x) / 2} cy={(travelFrom.y + travelTo.y) / 2} r="1.2" fill={t.accent} opacity="0.7" />
            </g>
          )}

          {placed.map((p) => {
            const active = selectedId === p.id;
            const bigKind = p.kind === 'city' || p.kind === 'castle';
            const color = kindColor(p.kind);
            const hiddenByFog = fogKnownIds && !fogKnownIds.has(p.id);
            if (hiddenByFog) {
              return (
                <g key={p.id} opacity="0.3" style={{ pointerEvents: 'none' }}>
                  <circle cx={p.x} cy={p.y} r="0.8" fill="none" stroke={t.ink2} strokeWidth="0.12" strokeDasharray="0.3 0.2" />
                </g>
              );
            }
            const isTravelPick = travelFromId === p.id || travelToId === p.id;
            const showDragPreview = dragPreview?.id === p.id;
            const rx = showDragPreview ? dragPreview.x : p.x;
            const ry = showDragPreview ? dragPreview.y : p.y;
            return (
              <g
                key={p.id}
                onClick={(e) => { e.stopPropagation(); clickPin(p, e); }}
                onMouseDown={(e) => beginPinDrag(p, e)}
                style={{ cursor: p.locked ? 'not-allowed' : 'grab' }}
                title={p.locked ? 'Locked - shift-click to unlock' : 'Drag to move, shift-click to lock'}
              >
                {active && <circle cx={rx} cy={ry} r="3" fill={color} opacity="0.22" />}
                {isTravelPick && (
                  <circle cx={rx} cy={ry} r="2.2" fill="none" stroke={t.accent} strokeWidth="0.25" />
                )}
                <circle cx={rx} cy={ry} r={bigKind ? 1.2 : 0.8} fill={color} stroke={t.ink} strokeWidth="0.15" />
                {p.locked && (
                  <circle cx={rx + 0.9} cy={ry - 0.9} r="0.35" fill={t.ink} />
                )}
                <text
                  x={rx + 1.5}
                  y={ry + 0.5}
                  fontSize={bigKind ? 2.2 : 1.7}
                  fill={t.ink}
                  fontFamily="'Fraunces', serif"
                  fontStyle="italic"
                >
                  {p.name}
                </text>
              </g>
            );
          })}

          {showProposals && proposedPlaced.map((pr) => {
            const active = selectedProposalId === pr.id;
            return (
              <g key={pr.id} opacity={active ? 1 : 0.75} onClick={(e) => { e.stopPropagation(); onSelectProposal?.(pr); }} style={{ cursor: 'pointer' }}>
                <circle cx={pr.x} cy={pr.y} r="0.9" fill="none" stroke={t.accent} strokeWidth={active ? 0.3 : 0.15} strokeDasharray="0.3 0.2" />
                <text x={pr.x + 1.3} y={pr.y + 0.3} fontSize="1.4" fill={t.accent} fontFamily="'JetBrains Mono', monospace">{pr.name}?</text>
              </g>
            );
          })}

          {pendingDropKind && hoverPos && !drawMode && (
            <g opacity="0.7">
              <circle cx={hoverPos.x} cy={hoverPos.y} r="1.1" fill={kindColor(pendingDropKind)} stroke={t.ink} strokeWidth="0.15" />
            </g>
          )}
        </g>

        {/* Chrome that doesn't pan/zoom */}
        <g transform={`translate(${region.bounds.w - 8}, ${region.bounds.h - 6})`}>
          <circle r="2.8" fill="none" stroke={t.ink2} strokeWidth="0.12" />
          <line x1="0" y1="-2.2" x2="0" y2="2.2" stroke={t.ink2} strokeWidth="0.12" />
          <line x1="-2.2" y1="0" x2="2.2" y2="0" stroke={t.ink2} strokeWidth="0.12" />
          <text y="-1" fontSize="1.4" fill={t.ink2} textAnchor="middle" fontFamily="'Fraunces', serif">N</text>
        </g>
        <g transform={`translate(6, ${region.bounds.h - 6})`}>
          <line x1="0" y1="0" x2="10" y2="0" stroke={t.ink2} strokeWidth="0.18" />
          <line x1="0" y1="-0.4" x2="0" y2="0.4" stroke={t.ink2} strokeWidth="0.18" />
          <line x1="10" y1="-0.4" x2="10" y2="0.4" stroke={t.ink2} strokeWidth="0.18" />
          <text x="5" y="-0.8" fontSize="1.2" fill={t.ink2} textAnchor="middle" fontFamily="'JetBrains Mono', monospace">10 mi</text>
        </g>
      </svg>

      {/* Zoom HUD */}
      <div
        style={{
          position: 'absolute', right: 10, bottom: 10,
          display: 'flex', gap: 4,
        }}
      >
        <button
          type="button" onClick={() => zoomBy(0.8)} title="Zoom out" aria-label="Zoom out"
          style={zoomBtnStyle(t)}
        >-</button>
        <button
          type="button" onClick={reset} title="Reset view" aria-label="Reset view"
          style={{ ...zoomBtnStyle(t), width: 'auto', padding: '0 10px' }}
        >{Math.round(transform.scale * 100)}%</button>
        <button
          type="button" onClick={() => zoomBy(1.25)} title="Zoom in" aria-label="Zoom in"
          style={zoomBtnStyle(t)}
        >+</button>
      </div>

      {/* Selected pin lock control */}
      {selectedId && (() => {
        const sel = placed.find((p) => p.id === selectedId);
        if (!sel) return null;
        return (
          <div
            style={{
              position: 'absolute', left: 10, bottom: 10,
              padding: '5px 10px',
              display: 'flex', alignItems: 'center', gap: 6,
              background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10, color: t.ink2,
              letterSpacing: 0.14, textTransform: 'uppercase',
            }}
          >
            <span>{sel.name}</span>
            <button
              type="button"
              onClick={() => onToggleLock?.(sel.id)}
              title={sel.locked ? 'Unlock pin' : 'Lock pin so it can\'t be dragged'}
              aria-label={sel.locked ? 'Unlock pin' : 'Lock pin'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px',
                background: sel.locked ? t.accentSoft : 'transparent',
                color: sel.locked ? t.ink : t.ink2,
                border: `1px solid ${sel.locked ? t.accent : t.rule}`,
                borderRadius: t.radius, cursor: 'pointer',
              }}
            >
              {sel.locked ? <Lock size={10} /> : <Unlock size={10} />}
              {sel.locked ? 'Locked' : 'Unlocked'}
            </button>
          </div>
        );
      })()}

      {drawMode && (
        <div
          style={{
            position: 'absolute', left: 10, top: 10,
            padding: '6px 10px',
            background: t.paper, border: `1px solid ${t.accent}`,
            borderRadius: t.radius,
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}
        >
          Draw land &middot; click to add vertices &middot; double-click to close &middot; Esc to cancel
        </div>
      )}

      {pendingDropKind && !drawMode && (
        <div
          style={{
            position: 'absolute', left: 10, top: 10,
            padding: '6px 10px',
            background: t.paper, border: `1px solid ${t.accent}`,
            borderRadius: t.radius,
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.14, textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          Drop {pendingDropKind}: click the map
        </div>
      )}

      {onTravelPick && (
        <div
          style={{
            position: 'absolute', right: 10, top: 10,
            padding: '8px 12px',
            background: t.paper, border: `1px solid ${t.accent}`,
            borderRadius: t.radius,
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.14, textTransform: 'uppercase',
            maxWidth: 260,
          }}
        >
          {!travelFromId ? (
            <>Click start pin</>
          ) : !travelToId ? (
            <>Click destination pin</>
          ) : journey ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: t.ink }}>
              <div>{journey.distance} mi &middot; {journey.mode}</div>
              <div style={{ color: t.accent }}>
                {journey.days > 0 ? `${journey.days}d ` : ''}{journey.hours}h travel
              </div>
              {journey.terrainNotes.length > 0 && (
                <div style={{ color: t.ink2, fontFamily: t.mono, fontSize: 9 }}>
                  {journey.terrainNotes.join(' \u00b7 ')}
                </div>
              )}
            </div>
          ) : (
            <>Unreachable</>
          )}
        </div>
      )}

      {fogKnownIds && (
        <div
          style={{
            position: 'absolute', left: 10, top: drawMode || pendingDropKind ? 50 : 10,
            padding: '6px 10px',
            background: t.paper, border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            fontFamily: t.mono, fontSize: 10, color: t.ink2,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}
        >
          Fog of war &middot; {povActor?.name || 'POV'} by ch.{currentChapter || '?'}
        </div>
      )}
    </div>
  );
}

function zoomBtnStyle(t) {
  return {
    width: 28, height: 24,
    display: 'grid', placeItems: 'center',
    background: t.paper, color: t.ink,
    border: `1px solid ${t.rule}`,
    borderRadius: t.radius,
    fontFamily: t.mono, fontSize: 11,
    cursor: 'pointer',
  };
}

export { KIND_OPTIONS, KIND_COLORS };

/**
 * RegionView - the SVG region map.
 *
 * An ink-wash parchment base with typed place pins, proposal ghosts, roads,
 * river, mountains, a compass + scale bar, optional fog-of-war (filter pins
 * by POV character's knowledge at a given chapter), and a travel-path
 * overlay (click two pins to compute distance + estimated days of travel).
 */

import React, { useMemo, useState } from 'react';
import { useTheme } from '../../loomwright/theme';
import { KIND_COLORS, kindColor, KIND_OPTIONS } from './kindColors';
import { estimateJourney } from './travel';

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

// Derive the set of place ids a POV actor "knows" by chapter.
// Priority:
//   1. actor.timeline[].location matched against known place names
//   2. places whose chapterIds include any chapter <= currentCh
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
  pendingDropKind,
  worldState,
  povCharacterId,
  fogEnabled,
  currentChapter,
  travelMode,
  travelFromId,
  travelToId,
  onTravelPick,
}) {
  const t = useTheme();
  const [hoverPos, setHoverPos] = useState(null);

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

  const handleMapClick = (e) => {
    if (!pendingDropKind || !onDropPin) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * region.bounds.w;
    const y = ((e.clientY - rect.top) / rect.height) * region.bounds.h;
    onDropPin(x, y);
  };

  const handleMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * region.bounds.w;
    const y = ((e.clientY - rect.top) / rect.height) * region.bounds.h;
    setHoverPos({ x, y });
  };

  const clickPin = (p) => {
    if (onTravelPick) {
      onTravelPick(p.id);
      return;
    }
    onSelectPlace?.(p.id);
  };

  return (
    <div
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: t.mode === 'night' ? '#0a0e12' : '#ece3ca',
      }}
    >
      <svg
        viewBox={`0 0 ${region.bounds.w} ${region.bounds.h}`}
        style={{
          width: '100%', height: '100%', display: 'block',
          cursor: pendingDropKind ? 'crosshair' : 'default',
        }}
        preserveAspectRatio="xMidYMid meet"
        onClick={handleMapClick}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverPos(null)}
      >
        <defs>
          <radialGradient id="lw-vignette" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={t.mode === 'night' ? '#111a22' : '#f0e8cf'} stopOpacity="0" />
            <stop offset="100%" stopColor={t.mode === 'night' ? '#050709' : '#c4b688'} stopOpacity="0.5" />
          </radialGradient>
          <pattern id="lw-hatch" width="1.5" height="1.5" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
            <line x1="0" y1="0" x2="0" y2="1.5" stroke={t.ink3} strokeWidth="0.08" opacity="0.35" />
          </pattern>
          <radialGradient id="lw-fog" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={t.mode === 'night' ? '#0a0e12' : '#ece3ca'} stopOpacity="0" />
            <stop offset="100%" stopColor={t.mode === 'night' ? '#000000' : '#2a261e'} stopOpacity="0.75" />
          </radialGradient>
        </defs>

        <rect width={region.bounds.w} height={region.bounds.h} fill="url(#lw-vignette)" />

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

        {/* Travel path overlay */}
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
            // Ghost outline only - place exists but POV doesn't know it
            return (
              <g key={p.id} opacity="0.3" style={{ pointerEvents: 'none' }}>
                <circle cx={p.x} cy={p.y} r="0.8" fill="none" stroke={t.ink2} strokeWidth="0.12" strokeDasharray="0.3 0.2" />
              </g>
            );
          }
          const isTravelPick = travelFromId === p.id || travelToId === p.id;
          return (
            <g key={p.id} onClick={(e) => { e.stopPropagation(); clickPin(p); }} style={{ cursor: 'pointer' }}>
              {active && <circle cx={p.x} cy={p.y} r="3" fill={color} opacity="0.22" />}
              {isTravelPick && (
                <circle cx={p.x} cy={p.y} r="2.2" fill="none" stroke={t.accent} strokeWidth="0.25" />
              )}
              <circle cx={p.x} cy={p.y} r={bigKind ? 1.2 : 0.8} fill={color} stroke={t.ink} strokeWidth="0.15" />
              <text
                x={p.x + 1.5}
                y={p.y + 0.5}
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

        {pendingDropKind && hoverPos && (
          <g opacity="0.7">
            <circle cx={hoverPos.x} cy={hoverPos.y} r="1.1" fill={kindColor(pendingDropKind)} stroke={t.ink} strokeWidth="0.15" />
          </g>
        )}

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

      {pendingDropKind && (
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
              <div>
                {journey.distance} mi &middot; {journey.mode}
              </div>
              <div style={{ color: t.accent }}>
                {journey.days > 0 ? `${journey.days}d ` : ''}{journey.hours}h travel
              </div>
              {journey.terrainNotes.length > 0 && (
                <div style={{ color: t.ink2, fontFamily: t.mono, fontSize: 9 }}>
                  {journey.terrainNotes.join(' &middot; ')}
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
            position: 'absolute', left: 10, bottom: 10,
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

export { KIND_OPTIONS, KIND_COLORS };

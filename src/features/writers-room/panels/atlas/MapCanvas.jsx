// Loomwright — Atlas map canvas with pan/zoom + place pins + journey layer.

import React from 'react';
import { useTheme, PLACE_COLORS, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import { useSelection } from '../../selection';
import { MIME, readDrop } from '../../drag';
import JourneyLayer from './JourneyLayer';

const INITIAL_VIEW = { x: 0, y: 0, w: 1000, h: 700 };

export default function MapCanvas({ onSummonRing }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const [view, setView] = React.useState(INITIAL_VIEW);
  const [dragState, setDragState] = React.useState(null);
  const svgRef = React.useRef(null);

  const places = (store.places || []).filter(p => !p.parentId);
  const selectedPlace = sel.place;

  const screenToMap = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = (e.clientX - rect.left) / rect.width;
    const sy = (e.clientY - rect.top) / rect.height;
    return { x: view.x + sx * view.w, y: view.y + sy * view.h };
  };

  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    setView(v => {
      const nw = Math.max(300, Math.min(5000, v.w * factor));
      const nh = nw * (v.h / v.w);
      const center = screenToMap(e);
      return { w: nw, h: nh, x: center.x - nw / 2, y: center.y - nh / 2 };
    });
  };

  const onMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === 'rect') {
      setDragState({ type: 'pan', startX: e.clientX, startY: e.clientY, startView: view });
    }
  };
  const onMouseMove = (e) => {
    if (!dragState) return;
    if (dragState.type === 'pan') {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const dx = (e.clientX - dragState.startX) / rect.width * dragState.startView.w;
      const dy = (e.clientY - dragState.startY) / rect.height * dragState.startView.h;
      setView({ ...dragState.startView, x: dragState.startView.x - dx, y: dragState.startView.y - dy });
    }
  };
  const onMouseUp = () => setDragState(null);

  const onContextMenu = (e) => {
    e.preventDefault();
    onSummonRing?.({ x: e.clientX, y: e.clientY, context: 'atlas', mapPoint: screenToMap(e) });
  };

  const onDrop = (e) => {
    e.preventDefault();
    const data = readDrop(e, MIME.ENTITY);
    if (!data || data.kind !== 'character') return;
    const point = screenToMap(e);
    // Find nearest pin within ~80 pixels (in map units, scale w/screen ratio).
    const screenPxPerMap = svgRef.current ? svgRef.current.getBoundingClientRect().width / view.w : 1;
    const snapDistance = 80 / Math.max(0.001, screenPxPerMap);
    let nearest = null, nearestD = Infinity;
    for (const p of places) {
      if (p.x == null || p.y == null) continue;
      const d = Math.hypot(p.x - point.x, p.y - point.y);
      if (d < nearestD) { nearestD = d; nearest = p; }
    }
    const activeChId = store.ui?.activeChapterId || store.book?.currentChapterId;
    if (!activeChId) return;
    if (nearest && nearestD <= snapDistance) {
      // Snap to nearest pin → record visit.
      store.setSlice('places', ps => ps.map(p => p.id === nearest.id ? {
        ...p, visits: [...(p.visits || []), {
          id: `v_${Date.now()}`, chapterId: activeChId, characterId: data.id, xy: { x: nearest.x, y: nearest.y }, t: Date.now(),
        }],
      } : p));
    } else {
      // Otherwise prompt to name a new place.
      const name = window.prompt('Name this new place:', '');
      if (!name) return;
      const id = `pl_${Date.now()}`;
      store.setSlice('places', ps => [...(ps || []), {
        id, name, kind: 'settlement', realm: 'the world',
        x: point.x, y: point.y, visits: [{
          id: `v_${Date.now()}`, chapterId: activeChId, characterId: data.id, xy: { x: point.x, y: point.y }, t: Date.now(),
        }],
        children: [], parentId: null, proposed: false, hasFloorplan: false,
        createdAt: Date.now(),
      }]);
    }
  };
  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes(MIME.ENTITY)) e.preventDefault();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid meet"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onContextMenu={onContextMenu}
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{ width: '100%', height: '100%', cursor: dragState?.type === 'pan' ? 'grabbing' : 'grab' }}
      >
        <defs>
          <radialGradient id="lw-vignette">
            <stop offset="60%" stopColor={t.paper2} stopOpacity="0" />
            <stop offset="100%" stopColor={t.ink} stopOpacity="0.18" />
          </radialGradient>
          <pattern id="lw-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M0,6 l6,-6" stroke={t.rule} strokeWidth="0.4" />
          </pattern>
        </defs>

        <rect x={view.x - 200} y={view.y - 200} width={view.w + 400} height={view.h + 400} fill={t.paper2} />
        <rect x={view.x - 200} y={view.y - 200} width={view.w + 400} height={view.h + 400} fill="url(#lw-vignette)" />

        {/* Suggestive landscape — hatched mountains and a wandering river. */}
        <path d="M -200 200 q 200 -120 400 -40 q 200 -100 400 0 q 200 -60 400 60"
              fill="none" stroke={t.rule} strokeWidth="2" strokeOpacity="0.4" />
        <path d="M -200 500 q 200 -60 400 -10 q 200 100 400 0 q 200 -80 400 30"
              fill="url(#lw-hatch)" opacity="0.5" />

        {places.map(p => {
          const isSel = sel.place === p.id;
          const color = PLACE_COLORS[p.kind] || t.ink3;
          const visits = (p.visits || []).length;
          // 7-base; +1 per visit (capped at +12).
          const r = (isSel ? 9 : 7) + Math.min(12, visits);
          return (
            <g key={p.id} onClick={(e) => { e.stopPropagation(); select('place', p.id); }} style={{ cursor: 'pointer' }}>
              {visits > 0 && (
                <circle cx={p.x ?? 0} cy={p.y ?? 0} r={r + 6}
                  fill={color} opacity={0.10} />
              )}
              <circle
                cx={p.x ?? 0} cy={p.y ?? 0} r={r}
                fill={p.proposed ? 'none' : color}
                stroke={color} strokeWidth={isSel ? 2 : 1}
                strokeDasharray={p.proposed ? '3 2' : ''}
              />
              <text x={p.x ?? 0} y={(p.y ?? 0) + r + 12}
                fontSize={11} fontFamily={t.display} fill={t.ink}
                textAnchor="middle">{p.name}</text>
              {visits > 0 && (
                <text x={p.x ?? 0} y={(p.y ?? 0) + 4}
                  fontSize={9} fontFamily={t.mono} fill={t.onAccent}
                  textAnchor="middle" fontWeight="600" pointerEvents="none">{visits}</text>
              )}
            </g>
          );
        })}

        <JourneyLayer view={view} />
      </svg>

      {places.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          pointerEvents: 'none', textAlign: 'center',
        }}>
          <div style={{ fontFamily: t.display, color: t.ink3, fontStyle: 'italic', maxWidth: 320 }}>
            Mention a place in your prose. I will mark it here. Right-click to add one.
          </div>
        </div>
      )}
    </div>
  );
}

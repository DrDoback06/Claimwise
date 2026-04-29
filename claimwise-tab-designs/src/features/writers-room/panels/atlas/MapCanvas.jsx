// Loomwright — Atlas map canvas with pan/zoom + place pins + journey layer.
// CODE-INSIGHT §5: right-click owns creation, left-click owns manipulation,
// edit pane below owns property editing. Real ↔ parchment basemap toggle.

import React from 'react';
import { useTheme, PLACE_COLORS, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import { useSelection } from '../../selection';
import { MIME, readDrop } from '../../drag';
import JourneyLayer from './JourneyLayer';
import RegionLayer from './RegionLayer';
import ContextMenu, { useContextMenu } from '../../primitives/ContextMenu';

const INITIAL_VIEW = { x: 0, y: 0, w: 1000, h: 700 };

function rid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

export default function MapCanvas({ onSummonRing }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const [view, setView] = React.useState(INITIAL_VIEW);
  const [dragState, setDragState] = React.useState(null);
  const [tool, setTool] = React.useState(null); // 'pin' | 'region' | null
  const [regionDraft, setRegionDraft] = React.useState(null);
  const [cursor, setCursor] = React.useState(null);
  const svgRef = React.useRef(null);
  const ctx = useContextMenu();

  const basemap = store.atlasSettings?.basemapMode || 'real';
  const places = (store.places || []).filter(p => !p.parentId);

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
    if (tool || regionDraft) return; // tools are committed on click, not drag
    if (e.target === svgRef.current || e.target.tagName === 'rect') {
      setDragState({ type: 'pan', startX: e.clientX, startY: e.clientY, startView: view });
      return;
    }
    if (e.target.tagName === 'circle' && e.target.dataset?.placeId) {
      const p = places.find(pp => pp.id === e.target.dataset.placeId);
      if (p) setDragState({ type: 'pin', placeId: p.id, startX: e.clientX, startY: e.clientY, startCoords: { x: p.x, y: p.y } });
    }
  };

  const onMouseMove = (e) => {
    setCursor(screenToMap(e));
    if (!dragState) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    if (dragState.type === 'pan') {
      const dx = (e.clientX - dragState.startX) / rect.width * dragState.startView.w;
      const dy = (e.clientY - dragState.startY) / rect.height * dragState.startView.h;
      setView({ ...dragState.startView, x: dragState.startView.x - dx, y: dragState.startView.y - dy });
    }
    if (dragState.type === 'pin') {
      const dx = (e.clientX - dragState.startX) / rect.width * view.w;
      const dy = (e.clientY - dragState.startY) / rect.height * view.h;
      const nx = dragState.startCoords.x + dx;
      const ny = dragState.startCoords.y + dy;
      store.setSlice('places', ps => ps.map(p =>
        p.id === dragState.placeId ? { ...p, x: nx, y: ny } : p));
    }
  };
  const onMouseUp = () => setDragState(null);

  const onClick = (e) => {
    if (tool === 'pin') {
      const point = screenToMap(e);
      const id = rid('pl');
      store.setSlice('places', ps => [...(ps || []), {
        id, name: 'New place', kind: 'settlement', realm: 'the world',
        x: point.x, y: point.y, visits: [], children: [], parentId: null,
        proposed: false, hasFloorplan: false, createdAt: Date.now(),
      }]);
      select('place', id);
      setTool(null);
      return;
    }
    if (tool === 'region') {
      const point = screenToMap(e);
      setRegionDraft(d => {
        const poly = d ? [...d.poly, [point.x, point.y]] : [[point.x, point.y]];
        return { ...(d || { name: 'New region', color: t.accent2 }), poly };
      });
      return;
    }
  };

  const finishRegion = () => {
    if (!regionDraft || regionDraft.poly.length < 3) {
      setRegionDraft(null);
      setTool(null);
      return;
    }
    const id = rid('rg');
    store.setSlice('regions', rs => [...(rs || []), { id, ...regionDraft }]);
    setRegionDraft(null);
    setTool(null);
  };

  // Esc cancels active tool / region draft.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (regionDraft) {
          if (regionDraft.poly.length >= 3 && !window.confirm('Discard region in progress?')) return;
          setRegionDraft(null);
        }
        setTool(null);
        ctx.close();
      }
      if (e.key === 'Enter' && tool === 'region') finishRegion();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, regionDraft]);

  const onContextMenu = (e) => {
    e.preventDefault();
    const point = screenToMap(e);
    const overPin = e.target?.tagName === 'circle' && e.target.dataset?.placeId
      ? places.find(p => p.id === e.target.dataset.placeId) : null;

    const items = overPin ? [
      { heading: overPin.name },
      { id: 'select', label: 'Select & edit',
        onClick: () => select('place', overPin.id) },
      { id: 'rename', label: 'Rename…',
        onClick: () => {
          const name = window.prompt('New name', overPin.name);
          if (name) store.setSlice('places', ps => ps.map(p => p.id === overPin.id ? { ...p, name } : p));
        } },
      { id: 'pin-here', label: 'Pin character here this chapter',
        disabled: !sel.character, onClick: () => {
          const chId = sel.chapter || store.ui?.activeChapterId;
          if (!chId || !sel.character) return;
          store.setSlice('places', ps => ps.map(p => p.id === overPin.id
            ? { ...p, visits: [...(p.visits || []), {
                id: rid('v'), chapterId: chId, characterId: sel.character,
                xy: { x: overPin.x, y: overPin.y }, t: Date.now(),
              }] } : p));
        } },
      { divider: true },
      { id: 'delete', label: 'Delete place', danger: true,
        onClick: () => {
          if (!window.confirm(`Delete "${overPin.name}"?`)) return;
          store.setSlice('places', ps => ps.filter(p => p.id !== overPin.id));
          if (sel.place === overPin.id) select('place', null);
        } },
    ] : [
      { heading: 'Add at this point' },
      { id: 'add-place', label: '+ Add place here',
        onClick: () => {
          const id = rid('pl');
          store.setSlice('places', ps => [...(ps || []), {
            id, name: 'New place', kind: 'settlement', realm: 'the world',
            x: point.x, y: point.y, visits: [], children: [], parentId: null,
            proposed: false, hasFloorplan: false, createdAt: Date.now(),
          }]);
          select('place', id);
        } },
      { id: 'draw-region', label: '✎ Draw region',
        onClick: () => { setTool('region'); setRegionDraft({ name: 'New region', color: t.accent2, poly: [[point.x, point.y]] }); } },
      { id: 'pin-tool', label: 'Pin tool (click to drop)',
        onClick: () => setTool('pin') },
      { divider: true },
      { id: 'pin-character', label: 'Pin selected character here this chapter',
        disabled: !sel.character, onClick: () => {
          const chId = sel.chapter || store.ui?.activeChapterId;
          if (!chId || !sel.character) return;
          // Add a new place at point and visit it.
          const id = rid('pl');
          store.setSlice('places', ps => [...(ps || []), {
            id, name: 'New place', kind: 'settlement', realm: 'the world',
            x: point.x, y: point.y,
            visits: [{ id: rid('v'), chapterId: chId, characterId: sel.character,
              xy: { x: point.x, y: point.y }, t: Date.now() }],
            children: [], parentId: null, proposed: false, hasFloorplan: false,
            createdAt: Date.now(),
          }]);
          select('place', id);
        } },
      { divider: true },
      { id: 'summon-ring', label: 'Summoning ring…',
        onClick: () => onSummonRing?.({ x: e.clientX, y: e.clientY, context: 'atlas', mapPoint: point }) },
    ];

    ctx.open(e, items);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const data = readDrop(e, MIME.ENTITY);
    if (!data || data.kind !== 'character') return;
    const point = screenToMap(e);
    const screenPxPerMap = svgRef.current ? svgRef.current.getBoundingClientRect().width / view.w : 1;
    const snapDistance = 80 / Math.max(0.001, screenPxPerMap);
    let nearest = null, nearestD = Infinity;
    for (const p of places) {
      if (p.x == null || p.y == null) continue;
      const d = distance({ x: p.x, y: p.y }, point);
      if (d < nearestD) { nearestD = d; nearest = p; }
    }
    const activeChId = sel.chapter || store.ui?.activeChapterId || store.book?.currentChapterId;
    if (!activeChId) return;
    if (nearest && nearestD <= snapDistance) {
      store.setSlice('places', ps => ps.map(p => p.id === nearest.id ? {
        ...p, visits: [...(p.visits || []), {
          id: rid('v'), chapterId: activeChId, characterId: data.id, xy: { x: nearest.x, y: nearest.y }, t: Date.now(),
        }],
      } : p));
    } else {
      const name = window.prompt('Name this new place:', '');
      if (!name) return;
      const id = rid('pl');
      store.setSlice('places', ps => [...(ps || []), {
        id, name, kind: 'settlement', realm: 'the world',
        x: point.x, y: point.y, visits: [{
          id: rid('v'), chapterId: activeChId, characterId: data.id, xy: { x: point.x, y: point.y }, t: Date.now(),
        }],
        children: [], parentId: null, proposed: false, hasFloorplan: false,
        createdAt: Date.now(),
      }]);
    }
  };
  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes(MIME.ENTITY)) e.preventDefault();
  };

  const cursorStyle = tool === 'pin' ? 'crosshair'
    : tool === 'region' ? 'crosshair'
    : dragState?.type === 'pan' ? 'grabbing'
    : dragState?.type === 'pin' ? 'grabbing'
    : 'grab';

  const setBasemap = (mode) => store.setSlice('atlasSettings', s => ({ ...(s || {}), basemapMode: mode }));

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
        onMouseLeave={() => { onMouseUp(); setCursor(null); }}
        onContextMenu={onContextMenu}
        onClick={onClick}
        onDoubleClick={() => tool === 'region' && finishRegion()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{ width: '100%', height: '100%', cursor: cursorStyle }}
      >
        <defs>
          <radialGradient id="lw-vignette">
            <stop offset="60%" stopColor={t.paper2} stopOpacity="0" />
            <stop offset="100%" stopColor={t.ink} stopOpacity="0.18" />
          </radialGradient>
          <pattern id="lw-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M0,6 l6,-6" stroke={t.rule} strokeWidth="0.4" />
          </pattern>
          <pattern id="lw-parchment" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill={t.paper3} />
            <path d="M0,30 q15,-10 30,0 t30,0" stroke={t.rule2} strokeWidth="0.4" fill="none" opacity="0.5" />
            <path d="M0,15 q15,-6 30,0 t30,0" stroke={t.rule} strokeWidth="0.3" fill="none" opacity="0.3" />
          </pattern>
        </defs>

        {basemap === 'parchment' ? (
          <>
            <rect x={view.x - 200} y={view.y - 200} width={view.w + 400} height={view.h + 400} fill="url(#lw-parchment)" />
            <rect x={view.x - 200} y={view.y - 200} width={view.w + 400} height={view.h + 400} fill="url(#lw-vignette)" />
          </>
        ) : (
          <>
            <rect x={view.x - 200} y={view.y - 200} width={view.w + 400} height={view.h + 400} fill={t.paper2} />
            <rect x={view.x - 200} y={view.y - 200} width={view.w + 400} height={view.h + 400} fill="url(#lw-vignette)" />
            <path d="M -200 200 q 200 -120 400 -40 q 200 -100 400 0 q 200 -60 400 60"
                  fill="none" stroke={t.rule} strokeWidth="2" strokeOpacity="0.4" />
            <path d="M -200 500 q 200 -60 400 -10 q 200 100 400 0 q 200 -80 400 30"
                  fill="url(#lw-hatch)" opacity="0.5" />
          </>
        )}

        <RegionLayer drafting={regionDraft} cursor={cursor} />

        {places.map(p => {
          const isSel = sel.place === p.id;
          const color = PLACE_COLORS[p.kind] || t.ink3;
          const visits = (p.visits || []).length;
          const r = (isSel ? 9 : 7) + Math.min(12, visits);
          return (
            <g key={p.id} onClick={(e) => { e.stopPropagation(); select('place', p.id); }} style={{ cursor: 'pointer' }}>
              {visits > 0 && (
                <circle cx={p.x ?? 0} cy={p.y ?? 0} r={r + 6}
                  fill={color} opacity={0.10} />
              )}
              <circle
                data-place-id={p.id}
                cx={p.x ?? 0} cy={p.y ?? 0} r={r}
                fill={p.proposed ? 'none' : color}
                stroke={color} strokeWidth={isSel ? 2 : 1}
                strokeDasharray={p.proposed ? '3 2' : ''}
              />
              <text x={p.x ?? 0} y={(p.y ?? 0) + r + 12}
                fontSize={11} fontFamily={t.display} fill={t.ink}
                textAnchor="middle" pointerEvents="none">{p.name}</text>
              {visits > 0 && (
                <text x={p.x ?? 0} y={(p.y ?? 0) + 4}
                  fontSize={9} fontFamily={t.mono} fill={t.onAccent}
                  textAnchor="middle" fontWeight="600" pointerEvents="none">{visits}</text>
              )}
            </g>
          );
        })}

        <JourneyLayer />
      </svg>

      {/* Toolbar overlay */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        display: 'flex', gap: 4, alignItems: 'center',
        background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 999,
        padding: '3px 6px',
      }}>
        <ToolToggle t={t} active={basemap === 'real'} onClick={() => setBasemap('real')}>Real</ToolToggle>
        <ToolToggle t={t} active={basemap === 'parchment'} onClick={() => setBasemap('parchment')}>Parchment</ToolToggle>
        <span style={{ width: 1, height: 14, background: t.rule, margin: '0 2px' }} />
        <ToolToggle t={t} active={tool === 'pin'} onClick={() => setTool(tool === 'pin' ? null : 'pin')}>Pin</ToolToggle>
        <ToolToggle t={t} active={tool === 'region'}
          onClick={() => {
            if (tool === 'region') { setTool(null); setRegionDraft(null); }
            else { setTool('region'); setRegionDraft({ name: 'New region', color: t.accent2, poly: [] }); }
          }}>Region</ToolToggle>
      </div>

      {tool === 'region' && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          padding: '8px 10px', background: t.paper, border: `1px solid ${t.warn}`, borderRadius: 4,
          fontFamily: t.mono, fontSize: 10, color: t.ink2,
          letterSpacing: 0.14, display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ flex: 1 }}>
            DRAWING REGION · click to add vertices · {regionDraft?.poly?.length || 0} placed · double-click or Enter to close · Esc to cancel
          </span>
          <button onClick={finishRegion} disabled={(regionDraft?.poly?.length || 0) < 3} style={{
            padding: '4px 10px', background: t.accent, color: t.onAccent,
            border: 'none', borderRadius: 2, cursor: 'pointer',
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase',
            opacity: (regionDraft?.poly?.length || 0) < 3 ? 0.5 : 1,
          }}>Close polygon</button>
        </div>
      )}

      {places.length === 0 && !tool && (
        <div style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          pointerEvents: 'none', textAlign: 'center',
        }}>
          <div style={{ fontFamily: t.display, color: t.ink3, fontStyle: 'italic', maxWidth: 320 }}>
            Mention a place in your prose. I will mark it here. Right-click to add one.
          </div>
        </div>
      )}

      <ContextMenu state={ctx.state} onClose={ctx.close} />
    </div>
  );
}

function ToolToggle({ t, active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 8px',
      background: active ? t.accent : 'transparent',
      color: active ? t.onAccent : t.ink2,
      border: 'none', borderRadius: 999, cursor: 'pointer',
      fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
    }}>{children}</button>
  );
}

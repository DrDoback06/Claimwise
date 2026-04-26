// Loomwright — Tangle (mind map) panel (plan §18).

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';
import { useSelection } from '../../selection';
import { MIME, readDrop, dragEntity } from '../../drag';
import { rid } from '../../store';

export default function TanglePanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const tangle = store.tangle || { nodes: [], edges: [], layout: {} };
  const [connectFrom, setConnectFrom] = React.useState(null);

  const setTangle = (next) => store.setSlice('tangle', tg => ({ ...tg, ...(typeof next === 'function' ? next(tg) : next) }));

  const addNode = (kind, entityId, pos) => {
    const id = rid('mn');
    setTangle(tg => ({
      nodes: [...(tg.nodes || []), { id, kind, entityId, x: pos?.x ?? 200, y: pos?.y ?? 200 }],
      edges: tg.edges || [], layout: tg.layout || {},
    }));
    return id;
  };

  const addNoteNode = (text, pos) => {
    const id = rid('mn');
    setTangle(tg => ({
      nodes: [...(tg.nodes || []), { id, kind: 'note', entityId: null, text: text || '', x: pos?.x ?? 200, y: pos?.y ?? 200 }],
      edges: tg.edges || [], layout: tg.layout || {},
    }));
    return id;
  };

  const moveNode = (id, x, y) => setTangle(tg => ({
    nodes: (tg.nodes || []).map(n => n.id === id ? { ...n, x, y } : n),
    edges: tg.edges || [], layout: tg.layout || {},
  }));

  const removeNode = (id) => setTangle(tg => ({
    nodes: (tg.nodes || []).filter(n => n.id !== id),
    edges: (tg.edges || []).filter(e => e.from !== id && e.to !== id),
    layout: tg.layout || {},
  }));

  const toggleEdge = (a, b) => setTangle(tg => {
    const edges = tg.edges || [];
    const idx = edges.findIndex(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
    if (idx >= 0) return { nodes: tg.nodes, edges: edges.filter((_, j) => j !== idx), layout: tg.layout };
    return { nodes: tg.nodes, edges: [...edges, { id: rid('me'), from: a, to: b, kind: 'tied to', strength: 0.5 }], layout: tg.layout };
  });

  const updateEdge = (id, patch) => setTangle(tg => ({
    nodes: tg.nodes,
    edges: (tg.edges || []).map(e => e.id === id ? { ...e, ...patch } : e),
    layout: tg.layout,
  }));

  const [edgeInspector, setEdgeInspector] = React.useState(null);

  const [dragOver, setDragOver] = React.useState(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const ent = readDrop(e, MIME.ENTITY);
    if (ent) { addNode(ent.kind, ent.id, pos); return; }
    const snip = readDrop(e, MIME.PROSE);
    if (snip) { addNoteNode(snip.text, pos); return; }
  };

  const proposeStarter = () => {
    const cast = store.cast || [];
    if (cast.length === 0) return;
    store.transaction(({ setSlice }) => {
      const nodes = cast.map((c, i) => ({
        id: rid('mn'), kind: 'character', entityId: c.id,
        x: 200 + 200 * Math.cos((i / cast.length) * Math.PI * 2),
        y: 200 + 200 * Math.sin((i / cast.length) * Math.PI * 2),
      }));
      const edges = [];
      for (const c of cast) {
        const me = nodes.find(n => n.entityId === c.id);
        for (const r of (c.relationships || []).slice(0, 3)) {
          const other = nodes.find(n => n.entityId === r.to);
          if (me && other) edges.push({ id: rid('me'), from: me.id, to: other.id });
        }
      }
      setSlice('tangle', tg => ({ nodes: [...(tg.nodes || []), ...nodes], edges: [...(tg.edges || []), ...edges], layout: tg.layout || {} }));
    });
  };

  const onClickNode = (e, n) => {
    e.stopPropagation();
    if (e.shiftKey) {
      if (!connectFrom) setConnectFrom(n.id);
      else if (connectFrom !== n.id) {
        toggleEdge(connectFrom, n.id);
        setConnectFrom(null);
      } else {
        setConnectFrom(null);
      }
    } else {
      if (n.kind && n.entityId) select(n.kind, n.entityId);
    }
  };

  const onMouseDown = (e, n) => {
    if (e.shiftKey) return;
    e.preventDefault();
    const rect = e.currentTarget.parentNode.getBoundingClientRect();
    const startX = e.clientX, startY = e.clientY;
    const startNX = n.x, startNY = n.y;
    const onMove = (ev) => {
      moveNode(n.id, startNX + (ev.clientX - startX), startNY + (ev.clientY - startY));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <PanelFrame
      title="Tangle"
      eyebrow="Mind map"
      accent={PANEL_ACCENT.tangle}
      panelId="tangle"
      onClose={onClose}
      width={640}>
      <div style={{ padding: '8px 12px', display: 'flex', gap: 6, borderBottom: `1px solid ${t.rule}` }}>
        <button onClick={() => addNoteNode('New note', { x: 200, y: 200 })} style={btnStyle(t)}>+ note</button>
        {tangle.nodes.length === 0 && (store.cast || []).length > 0 && (
          <button onClick={proposeStarter} style={btnStyle(t, true)}>Map cast & relationships</button>
        )}
        {connectFrom && <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink2, letterSpacing: 0.12, textTransform: 'uppercase', alignSelf: 'center' }}>shift+click another node to connect</span>}
      </div>

      <div
        onDrop={onDrop}
        onDragEnter={e => { if (e.dataTransfer.types.includes(MIME.ENTITY) || e.dataTransfer.types.includes(MIME.PROSE)) setDragOver(true); }}
        onDragLeave={e => { if (e.target === e.currentTarget) setDragOver(false); }}
        onDragOver={e => { if (e.dataTransfer.types.includes(MIME.ENTITY) || e.dataTransfer.types.includes(MIME.PROSE)) e.preventDefault(); }}
        style={{
          position: 'relative', height: 560,
          background: t.paper2,
          backgroundImage: `linear-gradient(${t.rule} 1px, transparent 1px), linear-gradient(90deg, ${t.rule} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          overflow: 'hidden',
          outline: dragOver ? `2px dashed ${PANEL_ACCENT.tangle}` : 'none',
          outlineOffset: -4,
        }}>
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
          {(tangle.edges || []).map(e => {
            const a = tangle.nodes.find(n => n.id === e.from);
            const b = tangle.nodes.find(n => n.id === e.to);
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 30;
            const strength = e.strength ?? 0.5;
            return (
              <g key={e.id}>
                <path
                  d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                  stroke={t.rule} strokeWidth={1 + strength * 2} fill="none"
                  opacity={0.4 + strength * 0.6}
                />
                <path
                  d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                  stroke="transparent" strokeWidth={14} fill="none"
                  style={{ cursor: 'pointer' }}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    const rect = ev.currentTarget.ownerSVGElement.getBoundingClientRect();
                    setEdgeInspector({ edge: e, x: rect.left + mx, y: rect.top + my });
                  }}
                />
                {e.kind && (
                  <text x={mx} y={my} fontSize="9" fontFamily={t.mono}
                    fill={t.ink3} textAnchor="middle"
                    style={{ pointerEvents: 'none', letterSpacing: 0.12 }}>{e.kind}</text>
                )}
              </g>
            );
          })}
        </svg>
        {edgeInspector && (
          <EdgeInspector
            edge={edgeInspector.edge}
            x={edgeInspector.x} y={edgeInspector.y}
            onClose={() => setEdgeInspector(null)}
            onChange={(patch) => updateEdge(edgeInspector.edge.id, patch)}
            onDelete={() => { toggleEdge(edgeInspector.edge.from, edgeInspector.edge.to); setEdgeInspector(null); }}
          />
        )}
        {tangle.nodes.map(n => (
          <NodeView key={n.id} node={n}
            onMouseDown={(e) => onMouseDown(e, n)}
            onClick={(e) => onClickNode(e, n)}
            onRemove={() => removeNode(n.id)}
            highlighted={connectFrom === n.id}
          />
        ))}
        {tangle.nodes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: t.display, color: t.ink3, fontStyle: 'italic', textAlign: 'center', padding: 30 }}>
            Drag cast, places, threads, items here from any panel.
          </div>
        )}
      </div>
    </PanelFrame>
  );
}

function NodeView({ node, onMouseDown, onClick, onRemove, highlighted }) {
  const t = useTheme();
  const store = useStore();
  let label = '', color = PANEL_ACCENT.tangle, kindLabel = node.kind;
  if (node.kind === 'character') {
    const c = (store.cast || []).find(x => x.id === node.entityId);
    if (c) { label = c.name; color = c.color || color; kindLabel = c.role || 'character'; }
  } else if (node.kind === 'place') {
    const p = (store.places || []).find(x => x.id === node.entityId);
    if (p) { label = p.name; kindLabel = p.kind || 'place'; }
  } else if (node.kind === 'thread') {
    const th = (store.threads || []).find(x => x.id === node.entityId);
    if (th) { label = th.name; color = th.color || color; kindLabel = 'thread'; }
  } else if (node.kind === 'item') {
    const it = (store.items || []).find(x => x.id === node.entityId);
    if (it) { label = it.name; kindLabel = 'item'; }
  } else if (node.kind === 'note') {
    label = node.text || 'note'; kindLabel = 'note';
  }
  return (
    <div
      onMouseDown={onMouseDown}
      onClick={onClick}
      draggable={node.kind && node.kind !== 'note'}
      onDragStart={e => node.entityId && dragEntity(e, node.kind, node.entityId)}
      style={{
        position: 'absolute', left: node.x - 60, top: node.y - 22, width: 120,
        padding: '6px 8px', background: t.paper, color: t.ink,
        border: `1px solid ${highlighted ? t.accent : color}`,
        borderLeft: `3px solid ${color}`, borderRadius: 1,
        cursor: 'move', userSelect: 'none',
        animation: 'lw-pop-in 260ms ease',
      }}>
      <div style={{ fontFamily: t.mono, fontSize: 8, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>{kindLabel}</div>
      <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{
        position: 'absolute', top: 2, right: 2, width: 14, height: 14,
        background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer',
        lineHeight: 1, padding: 0, fontSize: 12,
      }}>×</button>
    </div>
  );
}

function btnStyle(t, primary) {
  return {
    padding: '4px 10px',
    background: primary ? t.accent : 'transparent',
    color: primary ? t.onAccent : t.accent,
    border: `1px ${primary ? 'solid' : 'dashed'} ${t.accent}`, borderRadius: 1,
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
    textTransform: 'uppercase', cursor: 'pointer',
  };
}

function EdgeInspector({ edge, x, y, onClose, onChange, onDelete }) {
  const t = useTheme();
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onOutside = (e) => { if (!e.target.closest('[data-lw-edge-inspector]')) onClose(); };
    const id = setTimeout(() => {
      window.addEventListener('keydown', onKey);
      window.addEventListener('click', onOutside);
    }, 0);
    return () => {
      clearTimeout(id);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onOutside);
    };
  }, [onClose]);
  return (
    <div data-lw-edge-inspector style={{
      position: 'fixed', left: x, top: y, transform: 'translate(-50%, -100%)',
      width: 220, padding: 10,
      background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2,
      boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
      zIndex: 50, pointerEvents: 'auto',
    }}>
      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4 }}>
        Connection
      </div>
      <input
        autoFocus
        value={edge.kind || ''}
        onChange={(e) => onChange({ kind: e.target.value })}
        placeholder="kind (tied to / opposes / loves)"
        style={{
          width: '100%', padding: '5px 8px', marginBottom: 6,
          background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
          fontFamily: t.display, fontSize: 12, color: t.ink,
        }}
      />
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 4,
      }}>Strength · {(edge.strength ?? 0.5).toFixed(2)}</div>
      <input type="range" min={0} max={1} step={0.05}
        value={edge.strength ?? 0.5}
        onChange={(e) => onChange({ strength: Number(e.target.value) })}
        style={{ width: '100%', accentColor: t.accent }} />
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        <button onClick={onClose} style={btnStyle(t)}>Close</button>
        <div style={{ flex: 1 }} />
        <button onClick={onDelete} style={{ ...btnStyle(t), borderColor: t.bad, color: t.bad }}>Cut</button>
      </div>
    </div>
  );
}

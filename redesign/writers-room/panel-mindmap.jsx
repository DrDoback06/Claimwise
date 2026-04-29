// writers-room/panel-mindmap.jsx — freeform drag-drop canvas for mind-mapping entities

function MindMapPanel({ onClose }) {
  const t = useTheme();
  const { nodes, edges, addNode, addNoteNode, removeNode, moveNode, toggleEdge } = useMindMap();
  const { select } = useSelection();
  const [dragId, setDragId] = React.useState(null);
  const [connectFrom, setConnectFrom] = React.useState(null);
  const [hover, setHover] = React.useState(null);
  const canvasRef = React.useRef(null);

  function onDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/wr-entity');
    if (!data) return;
    const { kind, entityId } = JSON.parse(data);
    const rect = canvasRef.current.getBoundingClientRect();
    addNode(kind, entityId, { x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function onMouseDown(e, id) {
    if (e.shiftKey) {
      if (connectFrom) {
        if (connectFrom !== id) toggleEdge(connectFrom, id);
        setConnectFrom(null);
      } else {
        setConnectFrom(id);
      }
      return;
    }
    setDragId(id);
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!dragId) return;
    const rect = canvasRef.current.getBoundingClientRect();
    moveNode(dragId, e.clientX - rect.left, e.clientY - rect.top);
  }

  function labelFor(n) {
    if (n.kind === 'note') return { label: n.text, color: t.ink3, icon: '✎', sub: 'note' };
    if (n.kind === 'character') { const c = WR.CAST.find(x => x.id === n.entityId); return c ? { label: c.name, color: c.color, icon: '◉', sub: c.role || '' } : null; }
    if (n.kind === 'place')     { const p = WR.PLACES.find(x => x.id === n.entityId); return p ? { label: p.name, color: WR.PLACE_COLORS[p.kind] || t.ink3, icon: '⌂', sub: p.kind } : null; }
    if (n.kind === 'thread')    { const th = WR.THREADS.find(x => x.id === n.entityId); return th ? { label: th.name, color: th.color, icon: '⚑', sub: 'thread' } : null; }
    if (n.kind === 'item')      { const it = WR.ITEMS.find(x => x.id === n.entityId); return it ? { label: it.name, color: t.accent, icon: it.icon || '◆', sub: it.kind } : null; }
    return { label: '?', color: t.ink3, icon: '?', sub: '' };
  }

  return (
    <PanelFrame title="The Tangle" eyebrow="Mind map · drag anything in" accent="oklch(58% 0.12 145)" onClose={onClose} width={640}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>{nodes.length} nodes · {edges.length} edges</div>
        <div style={{ flex: 1 }} />
        <button onClick={() => {
          const text = prompt('Note:');
          if (text && text.trim()) addNoteNode(text.trim(), { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 });
        }} style={{ padding: '4px 10px', background: 'transparent', color: t.accent, border: `1px dashed ${t.accent}`, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1 }}>+ note</button>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, fontStyle: 'italic' }}>shift-click two nodes to connect</div>
      </div>

      <div ref={canvasRef}
        onDragOver={e => e.preventDefault()} onDrop={onDrop}
        onMouseMove={onMouseMove} onMouseUp={() => setDragId(null)} onMouseLeave={() => setDragId(null)}
        style={{ position: 'relative', minHeight: 560, background: `repeating-linear-gradient(0deg, transparent 0 23px, ${t.rule2}44 23px 24px), repeating-linear-gradient(90deg, transparent 0 23px, ${t.rule2}44 23px 24px)` }}>

        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {edges.map((e, i) => {
            const a = nodes.find(n => n.id === e.from); const b = nodes.find(n => n.id === e.to);
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 20;
            return <path key={i} d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`} stroke={t.ink3} strokeWidth="1" fill="none" opacity="0.4" />;
          })}
          {connectFrom && hover && hover !== connectFrom && (() => {
            const a = nodes.find(n => n.id === connectFrom); const b = nodes.find(n => n.id === hover);
            if (!a || !b) return null;
            return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={t.accent} strokeWidth="1.5" strokeDasharray="4 3" />;
          })()}
        </svg>

        {nodes.map(n => {
          const info = labelFor(n);
          if (!info) return null;
          const isFrom = connectFrom === n.id;
          return (
            <div key={n.id}
              onMouseDown={e => onMouseDown(e, n.id)}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              onDoubleClick={() => n.kind !== 'note' && select(n.kind, n.entityId)}
              style={{
                position: 'absolute', left: n.x, top: n.y, transform: 'translate(-50%,-50%)',
                maxWidth: n.kind === 'note' ? 180 : 160,
                padding: n.kind === 'note' ? '8px 10px' : '6px 10px',
                background: n.kind === 'note' ? t.paper3 : t.paper,
                border: `1px solid ${isFrom ? t.accent : info.color}`,
                borderLeft: `3px solid ${info.color}`,
                cursor: dragId === n.id ? 'grabbing' : 'grab',
                boxShadow: isFrom ? `0 0 0 3px ${t.accent}33` : `2px 3px 0 ${t.rule}`,
                userSelect: 'none',
                borderRadius: 1,
              }}>
              {n.kind !== 'note' && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ color: info.color, fontFamily: t.mono, fontSize: 12 }}>{info.icon}</span>
                <span style={{ fontFamily: t.mono, fontSize: 8, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase' }}>{info.sub}</span>
              </div>}
              <div style={{ fontFamily: t.display, fontSize: n.kind === 'note' ? 12 : 13, color: t.ink, fontWeight: n.kind === 'note' ? 400 : 500, fontStyle: n.kind === 'note' ? 'italic' : 'normal', lineHeight: 1.3 }}>{info.label}</div>
              <button onClick={e => { e.stopPropagation(); removeNode(n.id); }} style={{ position: 'absolute', top: -6, right: -6, width: 14, height: 14, borderRadius: '50%', background: t.bg, border: `1px solid ${t.rule}`, color: t.ink3, fontSize: 10, lineHeight: '12px', cursor: 'pointer', padding: 0, opacity: 0.6 }}>×</button>
            </div>
          );
        })}

        {nodes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: t.ink3, fontFamily: t.display, fontStyle: 'italic', fontSize: 14 }}>
            Drag cast · places · threads · items here from any panel.
          </div>
        )}
      </div>
    </PanelFrame>
  );
}

window.MindMapPanel = MindMapPanel;

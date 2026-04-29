// writers-room/panel-frame.jsx — shared frame + the Atlas panel (hierarchical world + floorplans + journey)

function PanelFrame({ title, eyebrow, onClose, accent, children, width = 440, toolbar = null }) {
  const t = useTheme();
  return (
    <div style={{
      width, flexShrink: 0, borderLeft: `1px solid ${t.rule}`,
      background: t.paper, display: 'flex', flexDirection: 'column',
      animation: 'slideIn 240ms cubic-bezier(.2,.8,.2,1)',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 7, height: 7, background: accent, borderRadius: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: accent, letterSpacing: 0.16, textTransform: 'uppercase' }}>{eyebrow}</div>
          <div style={{ fontFamily: t.display, fontSize: 16, color: t.ink, marginTop: 1, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        </div>
        {toolbar}
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.ink3, fontSize: 18, cursor: 'pointer', padding: 2, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
    </div>
  );
}

function CollapseSection({ title, count, defaultOpen = true, children, accent }) {
  const t = useTheme();
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ borderTop: `1px solid ${t.rule}` }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ color: accent || t.ink3, fontFamily: t.mono, fontSize: 10, width: 8, display: 'inline-block' }}>{open ? '▾' : '▸'}</span>
        <span style={{ flex: 1, fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.16, textTransform: 'uppercase', fontWeight: 500 }}>{title}</span>
        {count != null && <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>{count}</span>}
      </button>
      {open && <div style={{ padding: '0 16px 14px' }}>{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ATLAS PANEL — realms → regions → places → floorplans, with character journeys
// ═══════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════
// ATLAS PANEL — generic editable world atlas.
// Features:
//   · Click-to-add: click an empty spot → place pin is created there
//   · Drag-to-move: drag any pin around the map, position persists
//   · Realm tabs: multiple realms, auto-derived from places[].realm
//   · Inline rename + kind picker on the selected place
//   · Character journey overlay (past solid · future dashed) for the
//     currently-selected character
//   · Floor-plan view: per-place rooms on a grid (click to add a room)
//   · No hardcoded fiction — blank canvas until the user adds anything
// ═════════════════════════════════════════════════════════════════════════
function AtlasPanel({ onClose, onSendToWeaver }) {
  const t = useTheme();
  const { sel, select } = useSelection();
  const store = useStore();

  const [realm, setRealm] = React.useState('the world');
  const [view, setView] = React.useState('map'); // map | floorplan
  const [showJourney, setShowJourney] = React.useState(true);
  const [mode, setMode] = React.useState('pin'); // pin | pan (pin = click adds)

  const svgRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(null); // { placeId, offX, offY }

  // Derive realms from the places themselves — a realm is anything any place
  // references in its .realm field. First time, there's just "the world".
  const realms = React.useMemo(() => {
    const s = new Set(['the world']);
    (WR.PLACES || []).forEach(p => p.realm && s.add(p.realm));
    return Array.from(s);
  }, [WR.PLACES]);

  const placesInRealm = (WR.PLACES || []).filter(p => (p.realm || 'the world') === realm);
  const selectedPlace = (WR.PLACES || []).find(p => p.id === sel.place);

  const addPlaceAt = (x, y, kind = 'settlement') => {
    const id = window.createPlace(store, {
      realm,
      kind,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      coordinates: { x, y },
    });
    select('place', id);
  };

  const onSvgClick = (e) => {
    if (mode !== 'pin' || dragging) return;
    if (e.target.getAttribute('data-atlas-pin')) return; // clicked a pin
    const pt = svgPoint(svgRef.current, e);
    if (pt) addPlaceAt(pt.x, pt.y);
  };

  const onPinMouseDown = (e, place) => {
    e.stopPropagation();
    const pt = svgPoint(svgRef.current, e);
    if (!pt) return;
    setDragging({ placeId: place.id, offX: pt.x - (place.x || 0), offY: pt.y - (place.y || 0) });
    select('place', place.id);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const pt = svgPoint(svgRef.current, e);
      if (!pt) return;
      const nx = Math.max(2, Math.min(98, pt.x - dragging.offX));
      const ny = Math.max(2, Math.min(70, pt.y - dragging.offY));
      store.setSlice('places', xs => xs.map(p => p.id === dragging.placeId
        ? { ...p, x: Math.round(nx * 10) / 10, y: Math.round(ny * 10) / 10, coordinates: { x: nx, y: ny }, proposed: false }
        : p));
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, store]);

  const updatePlace = (id, patch) => {
    store.setSlice('places', xs => xs.map(p => p.id === id ? { ...p, ...patch } : p));
  };
  const removePlace = (id) => {
    if (!confirm('Delete this place?')) return;
    store.setSlice('places', xs => xs.filter(p => p.id !== id));
    if (sel.place === id) select('place', null);
  };

  // Empty state — no places anywhere
  if (!(WR.PLACES || []).length) {
    return (
      <PanelFrame title="Atlas" eyebrow="World · empty" accent="oklch(60% 0.10 145)" onClose={onClose} width={480}>
        <div style={{ padding: 24 }}>
          <div style={{ fontFamily: t.display, fontSize: 20, color: t.ink, marginBottom: 8 }}>No places yet</div>
          <div style={{ fontFamily: t.display, fontSize: 14, fontStyle: 'italic', color: t.ink2, lineHeight: 1.6, marginBottom: 18 }}>
            Click anywhere on the parchment below to drop a pin. Drag pins to reposition. Name and describe them in the detail panel.
          </div>
          <AtlasCanvas
            t={t}
            svgRef={svgRef}
            places={[]}
            selectedPlaceId={null}
            journey={[]}
            characterColor={t.accent}
            onSvgClick={(e) => {
              const pt = svgPoint(svgRef.current, e);
              if (pt) addPlaceAt(pt.x, pt.y);
            }}
            onPinMouseDown={() => {}}
          />
        </div>
      </PanelFrame>
    );
  }

  // Character journey overlay
  const journey = showJourney && sel.character ? (WR.journeyFor(sel.character) || []) : [];
  const currentChIdx = journey.findIndex(s => s.ch === WR.BOOK.currentChapter);
  const characterColor = (WR.CAST.find(c => c.id === sel.character)?.color) || t.accent;

  const floorplan = selectedPlace?.floorplan || null;

  const toolbar = (
    <div style={{ display: 'flex', gap: 3, marginRight: 4 }}>
      <button onClick={() => setView('map')} style={tbBtn(t, view === 'map')}>Map</button>
      {selectedPlace && <button onClick={() => setView('floorplan')} style={tbBtn(t, view === 'floorplan')}>Plan</button>}
    </div>
  );

  return (
    <PanelFrame title={realm.charAt(0).toUpperCase() + realm.slice(1)} eyebrow={`Atlas · ${placesInRealm.length} ${placesInRealm.length === 1 ? 'place' : 'places'}`} accent="oklch(60% 0.10 145)" onClose={onClose} width={480} toolbar={toolbar}>
      {/* Realm tabs */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: `1px solid ${t.rule}` }}>
        {realms.map(r => (
          <button key={r} onClick={() => setRealm(r)} style={{ padding: '4px 10px', background: realm === r ? t.paper2 : 'transparent', color: realm === r ? t.ink : t.ink3, border: `1px solid ${realm === r ? t.ink3 : t.rule}`, fontFamily: t.display, fontSize: 12, cursor: 'pointer', borderRadius: 1 }}>
            {r}
          </button>
        ))}
        <button onClick={() => {
          const name = prompt('New realm name:');
          if (name && name.trim()) setRealm(name.trim());
        }} style={{ padding: '4px 10px', background: 'transparent', color: t.accent, border: `1px dashed ${t.accent}`, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1 }}>+ realm</button>
      </div>

      {/* Mode hint */}
      {view === 'map' && (
        <div style={{ padding: '6px 16px', fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', background: t.paper2, borderBottom: `1px solid ${t.rule}` }}>
          Click parchment to add a pin · drag pins to move · click a pin to edit
        </div>
      )}

      {/* MAP */}
      {view === 'map' && (
        <div style={{ padding: 16 }}>
          <AtlasCanvas
            t={t}
            svgRef={svgRef}
            places={placesInRealm}
            selectedPlaceId={sel.place}
            journey={journey.filter(s => (WR.PLACES.find(p => p.id === s.place)?.realm || 'the world') === realm)}
            currentChIdx={currentChIdx}
            characterColor={characterColor}
            onSvgClick={onSvgClick}
            onPinMouseDown={onPinMouseDown}
            dragging={dragging}
          />
          {/* Journey toggle (only when a character is selected) */}
          {sel.character && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 14, fontFamily: t.mono, fontSize: 10, color: t.ink2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={showJourney} onChange={e => setShowJourney(e.target.checked)} />
                Show journey for {WR.CAST.find(c => c.id === sel.character)?.name || 'selection'}
              </label>
            </div>
          )}
        </div>
      )}

      {/* FLOORPLAN */}
      {view === 'floorplan' && selectedPlace && (
        <FloorplanEditor t={t} place={selectedPlace} updatePlace={updatePlace} />
      )}

      {/* Place detail */}
      {selectedPlace && (
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${t.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <input
              value={selectedPlace.name || ''}
              onChange={e => updatePlace(selectedPlace.id, { name: e.target.value })}
              placeholder="Unnamed place"
              style={{ flex: 1, fontFamily: t.display, fontSize: 20, color: t.ink, fontWeight: 500, background: 'transparent', border: 'none', outline: 'none', padding: 0 }} />
            <select
              value={selectedPlace.kind || 'settlement'}
              onChange={e => updatePlace(selectedPlace.id, { kind: e.target.value })}
              style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', background: t.paper2, border: `1px solid ${t.rule}`, padding: '3px 6px', borderRadius: 1 }}>
              {['settlement','city','castle','fortress','ruin','forest','wild','water','mountain','road','location'].map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <textarea
            value={selectedPlace.description || ''}
            onChange={e => updatePlace(selectedPlace.id, { description: e.target.value })}
            placeholder="A short description…"
            style={{ width: '100%', fontSize: 13, color: t.ink2, lineHeight: 1.6, fontStyle: 'italic', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', minHeight: 40, padding: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <input
              value={selectedPlace.realm || 'the world'}
              onChange={e => updatePlace(selectedPlace.id, { realm: e.target.value })}
              style={{ flex: 1, fontFamily: t.mono, fontSize: 10, color: t.ink2, letterSpacing: 0.12, background: t.paper2, border: `1px solid ${t.rule}`, padding: '4px 6px', borderRadius: 1 }}
              title="Realm (world-name). Places in the same realm render on the same map." />
            {!selectedPlace.floorplan && (
              <button onClick={() => updatePlace(selectedPlace.id, { floorplan: { rooms: [], viewBox: '0 0 40 30' }, hasFloorplan: true })}
                style={{ padding: '4px 10px', background: 'transparent', color: t.accent, border: `1px dashed ${t.accent}`, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1 }}>+ Floorplan</button>
            )}
            <button onClick={() => removePlace(selectedPlace.id)}
              style={{ padding: '4px 10px', background: 'transparent', color: t.bad, border: `1px solid ${t.rule}`, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1 }}>Delete</button>
          </div>
          {onSendToWeaver && (
            <button onClick={onSendToWeaver} style={{ marginTop: 10, width: '100%', padding: '7px 12px', background: 'transparent', color: t.accent, border: `1px solid ${t.accent}`, fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>✦ Weave this place →</button>
          )}
        </div>
      )}
    </PanelFrame>
  );
}

// ─── Shared atlas canvas ──────────────────────────────────────────────────
function AtlasCanvas({ t, svgRef, places, selectedPlaceId, journey, currentChIdx, characterColor, onSvgClick, onPinMouseDown, dragging }) {
  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 72"
      onClick={onSvgClick}
      style={{
        width: '100%',
        background: t.mode === 'night' ? '#0a0e12' : '#ede2c4',
        border: `1px solid ${t.rule}`,
        borderRadius: 2,
        display: 'block',
        cursor: dragging ? 'grabbing' : 'crosshair',
      }}>
      <defs>
        <radialGradient id="wr-vig" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor={t.mode === 'night' ? '#141e26' : '#f0e5c7'} stopOpacity="0" />
          <stop offset="100%" stopColor={t.mode === 'night' ? '#050709' : '#c4b688'} stopOpacity="0.6" />
        </radialGradient>
        <pattern id="wr-hatch" width="1.5" height="1.5" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
          <line x1="0" y1="0" x2="0" y2="1.5" stroke={t.ink3} strokeWidth="0.08" opacity="0.35" />
        </pattern>
      </defs>
      <rect width="100" height="72" fill="url(#wr-vig)" />

      {/* Subtle grid — writer cue for even spacing */}
      <g opacity="0.2">
        {[10,20,30,40,50,60,70,80,90].map(x => <line key={'vx'+x} x1={x} y1="0" x2={x} y2="72" stroke={t.ink3} strokeWidth="0.05" />)}
        {[10,20,30,40,50,60].map(y => <line key={'hy'+y} x1="0" y1={y} x2="100" y2={y} stroke={t.ink3} strokeWidth="0.05" />)}
      </g>

      {/* Journey line */}
      {journey && journey.length > 1 && (() => {
        const pts = journey.map(s => places.find(p => p.id === s.place)).filter(Boolean);
        return (
          <g>
            {pts.slice(0, Math.max(1, currentChIdx + 1)).map((p, i, arr) => i > 0 && (
              <line key={'past'+i} x1={arr[i-1].x} y1={arr[i-1].y} x2={p.x} y2={p.y} stroke={characterColor} strokeWidth="0.4" strokeLinecap="round" opacity="0.8" />
            ))}
            {pts.slice(Math.max(0, currentChIdx)).map((p, i, arr) => i > 0 && (
              <line key={'fut'+i} x1={arr[i-1].x} y1={arr[i-1].y} x2={p.x} y2={p.y} stroke={characterColor} strokeWidth="0.3" strokeLinecap="round" strokeDasharray="0.8 0.6" opacity="0.5" />
            ))}
          </g>
        );
      })()}

      {/* Places */}
      {places.map(p => {
        const isSel = selectedPlaceId === p.id;
        const color = (WR.PLACE_COLORS || {})[p.kind] || '#888';
        const inJourney = journey?.some(s => s.place === p.id);
        return (
          <g key={p.id} data-atlas-pin="1" onMouseDown={(e) => onPinMouseDown(e, p)} style={{ cursor: 'grab' }}>
            {isSel && <circle cx={p.x} cy={p.y} r="2.4" fill={color} opacity="0.25" />}
            {inJourney && <circle cx={p.x} cy={p.y} r="1.8" fill="none" stroke={characterColor} strokeWidth="0.18" />}
            <circle data-atlas-pin="1"
              cx={p.x} cy={p.y}
              r={p.kind === 'city' || p.kind === 'castle' ? 1.1 : 0.8}
              fill={p.proposed ? 'none' : color}
              stroke={color}
              strokeWidth={p.proposed ? 0.3 : 0.15}
              strokeDasharray={p.proposed ? '0.3 0.2' : ''} />
            <text data-atlas-pin="1"
              x={p.x + 1.5} y={p.y + 0.5}
              fontSize={p.kind === 'castle' || p.kind === 'city' ? 2.2 : 1.7}
              fill={p.proposed ? t.accent : t.ink}
              fontFamily="'Fraunces', serif" fontStyle="italic">
              {p.name || '(unnamed)'}{p.proposed ? '?' : ''}
            </text>
          </g>
        );
      })}

      {/* Compass */}
      <g transform="translate(92, 66)" opacity="0.6">
        <circle r="3" fill="none" stroke={t.ink3} strokeWidth="0.15" />
        <path d="M 0 -2.5 L 0.5 0 L 0 2.5 L -0.5 0 Z" fill={t.ink2} />
        <text y="-3.5" fontSize="1.3" textAnchor="middle" fill={t.ink2} fontFamily="'JetBrains Mono'">N</text>
      </g>
    </svg>
  );
}

// ─── Floor-plan editor ────────────────────────────────────────────────────
// Click-to-add a room; drag rooms to reposition; inline rename.
function FloorplanEditor({ t, place, updatePlace }) {
  const fp = place.floorplan || { rooms: [], viewBox: '0 0 40 30' };
  const svgRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(null);

  const addRoomAt = (x, y) => {
    const id = 'rm_' + Math.random().toString(36).slice(2, 8);
    const rooms = [...(fp.rooms || []), { id, name: 'Room', rect: [Math.round(x - 3), Math.round(y - 2), 6, 4], note: '' }];
    updatePlace(place.id, { floorplan: { ...fp, rooms }, hasFloorplan: true });
  };

  const onSvgClick = (e) => {
    if (dragging) return;
    if (e.target.getAttribute('data-room')) return;
    const pt = svgPoint(svgRef.current, e);
    if (pt) addRoomAt(pt.x, pt.y);
  };

  const onRoomMouseDown = (e, room) => {
    e.stopPropagation();
    const pt = svgPoint(svgRef.current, e);
    if (!pt) return;
    setDragging({ id: room.id, offX: pt.x - room.rect[0], offY: pt.y - room.rect[1] });
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const pt = svgPoint(svgRef.current, e);
      if (!pt) return;
      const rooms = (fp.rooms || []).map(r => r.id === dragging.id
        ? { ...r, rect: [Math.round(pt.x - dragging.offX), Math.round(pt.y - dragging.offY), r.rect[2], r.rect[3]] }
        : r);
      updatePlace(place.id, { floorplan: { ...fp, rooms } });
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, fp, place.id, updatePlace]);

  const updateRoom = (id, patch) => {
    const rooms = (fp.rooms || []).map(r => r.id === id ? { ...r, ...patch } : r);
    updatePlace(place.id, { floorplan: { ...fp, rooms } });
  };
  const deleteRoom = (id) => {
    const rooms = (fp.rooms || []).filter(r => r.id !== id);
    updatePlace(place.id, { floorplan: { ...fp, rooms } });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ padding: '6px 0 8px', fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
        Click to add a room · drag to move · click a room to edit
      </div>
      <svg ref={svgRef} viewBox={fp.viewBox || '0 0 40 30'} onClick={onSvgClick}
        style={{ width: '100%', background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 2, display: 'block', cursor: dragging ? 'grabbing' : 'crosshair' }}>
        <defs>
          <pattern id="stone" width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill={t.mode === 'night' ? '#1f1a25' : '#d8caa4'} />
            <path d="M 0 1 L 2 1 M 1 0 L 1 2" stroke={t.rule} strokeWidth="0.08" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#stone)" />
        {(fp.rooms || []).map(r => {
          const [x, y, w, h] = r.rect;
          return (
            <g key={r.id} data-room="1" onMouseDown={(e) => onRoomMouseDown(e, r)} style={{ cursor: 'grab' }}>
              <rect data-room="1" x={x} y={y} width={w} height={h} fill={t.mode === 'night' ? '#2a2232' : '#f4ecd8'} stroke={t.ink} strokeWidth="0.25" />
              <text data-room="1" x={x + w/2} y={y + h/2} fontSize="1.6" textAnchor="middle" fill={t.ink2} fontFamily="'Fraunces', serif" fontStyle="italic">{r.name}</text>
            </g>
          );
        })}
      </svg>
      {(fp.rooms || []).length > 0 && (
        <div style={{ marginTop: 10 }}>
          {(fp.rooms || []).map(r => (
            <div key={r.id} style={{ padding: '6px 10px', background: t.paper2, borderLeft: `2px solid ${t.rule}`, marginBottom: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={r.name || ''} onChange={e => updateRoom(r.id, { name: e.target.value })}
                style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500, background: 'transparent', border: 'none', outline: 'none', padding: 0, width: 100 }} />
              <input value={r.note || ''} onChange={e => updateRoom(r.id, { note: e.target.value })}
                placeholder="Short note about this room" style={{ flex: 1, fontFamily: t.display, fontStyle: 'italic', fontSize: 12, color: t.ink2, background: 'transparent', border: 'none', outline: 'none', padding: 0 }} />
              <button onClick={() => deleteRoom(r.id)} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer', fontSize: 14, padding: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────
function svgPoint(svg, evt) {
  if (!svg) return null;
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const inv = ctm.inverse();
  return pt.matrixTransform(inv);
}
const tbBtn = (t, on) => ({
  padding: '3px 8px',
  background: on ? t.accent : 'transparent',
  color: on ? t.onAccent : t.ink3,
  border: `1px solid ${on ? t.accent : t.rule}`,
  fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12, textTransform: 'uppercase',
  cursor: 'pointer', borderRadius: 1,
});

// ─── EMPTY PANEL ──────────────────────────────────────────────────────────
// Blank-canvas empty state shown by every panel when its entity list is empty.
function EmptyPanel({ onClose, title, eyebrow, accent, icon, headline, body, hint, width = 420 }) {
  const t = useTheme();
  return (
    <PanelFrame title={title} eyebrow={eyebrow} accent={accent || t.accent} onClose={onClose} width={width}>
      <div style={{ padding: '48px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {icon && (
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: `1px solid ${t.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent || t.ink3, opacity: 0.7 }}>
            <Icon name={icon} size={22} color={accent || t.ink3} />
          </div>
        )}
        <div style={{ fontFamily: t.display, fontSize: 20, color: t.ink, fontWeight: 500, letterSpacing: '-0.01em' }}>{headline}</div>
        {body && <div style={{ fontFamily: t.serif || t.display, fontStyle: 'italic', fontSize: 14, color: t.ink2, lineHeight: 1.5, maxWidth: 300 }}>{body}</div>}
        {hint && <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.14, textTransform: 'uppercase', marginTop: 6, maxWidth: 280, lineHeight: 1.6 }}>{hint}</div>}
      </div>
    </PanelFrame>
  );
}

// ─── PANEL ERROR BOUNDARY ──────────────────────────────────────────────────
class PanelErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('[panel error]', err, info); }
  render() {
    if (this.state.err) {
      const msg = String(this.state.err && this.state.err.message || this.state.err);
      return (
        <div style={{ width: 400, margin: 16, padding: 20, background: '#2b1d0e', color: '#f3ead3', border: '1px solid #7a1f1a', borderRadius: 2, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11 }}>
          <div style={{ fontSize: 13, marginBottom: 8, letterSpacing: 0.14, textTransform: 'uppercase', color: '#d4a648' }}>Panel error</div>
          <div style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg}</div>
          <button onClick={() => { this.setState({ err: null }); this.props.onClose && this.props.onClose(); }} style={{ marginTop: 12, padding: '6px 12px', background: 'transparent', color: '#f3ead3', border: '1px solid #7a1f1a', fontFamily: 'inherit', fontSize: 10, letterSpacing: 0.14, textTransform: 'uppercase', cursor: 'pointer' }}>Close panel</button>
        </div>
      );
    }
    return this.props.children;
  }
}

window.PanelFrame = PanelFrame;
window.CollapseSection = CollapseSection;
window.AtlasPanel = AtlasPanel;
window.EmptyPanel = EmptyPanel;
window.PanelErrorBoundary = PanelErrorBoundary;

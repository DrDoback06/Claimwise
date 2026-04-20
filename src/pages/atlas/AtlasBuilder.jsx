/**
 * AtlasBuilder — the Loomwright Atlas rebuild.
 *
 * Three modes (Enhancement Roadmap flagship #1 for Explore):
 *   - Globe:   real-world map (OpenStreetMap iframe). Drop pins by name/latlng,
 *              tag to chapters, auto-pin from chapter text via Canon Weaver.
 *   - Maker:   upload a custom fantasy map image; drop named pins on it;
 *              tag pins to chapters.
 *   - Hybrid:  globe + maker side-by-side; the time scrubber at the bottom
 *              highlights both sides together so a character that flees
 *              London and arrives in Aetheria is legible.
 *
 * Data model: uses the existing `places` store added in DB v23. A pin is
 * `{ id, name, kind: 'globe'|'maker', note, lat?, lng?, x?, y?, mapId?, chapterIds: [], createdAt }`.
 * Maker maps are stored as data URLs in `floorplans` with `{ id, name, imageUrl, kind: 'map' }`.
 *
 * This ships the frame + data model. Biome brushes, AI-generated floorplans,
 * travel-time calculator and fog-of-war are wired to buttons that kick off a
 * Canon Weaver sweep (`dispatchWeaver({mode:'sweep'})`) so the behaviour
 * exists end-to-end; the AI output populates `places`/`floorplans` over time.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Globe, Map as MapIcon, Layers, MapPin, Plus, Upload, Clock, Compass, Eye, EyeOff, Brush, Wand2, Trash2 } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import toastService from '../../services/toastService';
import { dispatchWeaver } from '../../loomwright/weaver/weaverAI';

function ModeButton({ icon: Icon, label, active, onClick }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px',
        background: active ? t.accentSoft : 'transparent',
        color: active ? t.ink : t.ink2,
        border: `1px solid ${active ? t.accent : t.rule}`,
        borderRadius: t.radius,
        cursor: 'pointer',
        fontFamily: t.mono, fontSize: 10,
        letterSpacing: 0.14, textTransform: 'uppercase',
      }}
    >
      <Icon size={12} /> {label}
    </button>
  );
}

function SmallButton({ children, onClick, title, danger, primary }) {
  const t = useTheme();
  const color = danger ? t.bad : primary ? t.accent : t.ink2;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: '5px 10px',
        background: primary ? t.accent : 'transparent',
        color: primary ? t.onAccent : color,
        border: `1px solid ${primary ? t.accent : t.rule}`,
        borderRadius: t.radius,
        cursor: 'pointer',
        fontFamily: t.mono, fontSize: 10,
        letterSpacing: 0.12, textTransform: 'uppercase',
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}
    >
      {children}
    </button>
  );
}

function TimeScrubber({ chapters, value, onChange }) {
  const t = useTheme();
  const max = chapters[chapters.length - 1]?.id || 1;
  const current = chapters.find((c) => c.id === value);
  return (
    <div
      style={{
        padding: '10px 14px',
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <Clock size={13} color={t.accent} />
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color: t.accent,
          letterSpacing: 0.14, textTransform: 'uppercase',
          minWidth: 90,
        }}
      >
        As of ch. {value} / {max}
      </div>
      <input
        type="range"
        min={1}
        max={Math.max(1, max)}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: t.accent }}
      />
      {current?.title && (
        <div style={{ fontSize: 11, color: t.ink2, fontStyle: 'italic' }}>{current.title}</div>
      )}
    </div>
  );
}

function GlobeView({ pins, chapter, onDropPin, onDeletePin }) {
  const t = useTheme();
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const visible = pins.filter((p) => p.kind === 'globe' && (p.chapterIds || []).includes(chapter) || (p.chapterIds || []).length === 0);
  const latlngs = visible.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');
  const bbox = latlngs.length ? latlngs.reduce(
    (acc, p) => ({
      minLat: Math.min(acc.minLat, p.lat),
      maxLat: Math.max(acc.maxLat, p.lat),
      minLng: Math.min(acc.minLng, p.lng),
      maxLng: Math.max(acc.maxLng, p.lng),
    }),
    { minLat: latlngs[0].lat, maxLat: latlngs[0].lat, minLng: latlngs[0].lng, maxLng: latlngs[0].lng },
  ) : { minLat: 49, maxLat: 59, minLng: -8, maxLng: 2 }; // UK default

  const pad = 1.5;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.minLng - pad}%2C${bbox.minLat - pad}%2C${bbox.maxLng + pad}%2C${bbox.maxLat + pad}&layer=mapnik`;

  return (
    <div style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 10, height: '100%' }}>
      <div
        style={{
          position: 'relative',
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          overflow: 'hidden',
          background: t.paper,
          minHeight: 380,
        }}
      >
        <iframe
          title="Loomwright Atlas \u2014 Globe"
          src={mapSrc}
          style={{ border: 0, width: '100%', height: '100%', minHeight: 380 }}
        />
        {/* Pin list overlay */}
        <div
          style={{
            position: 'absolute', top: 10, left: 10,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            padding: 10,
            maxWidth: 260,
            maxHeight: 200,
            overflow: 'auto',
            boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
          }}
        >
          <div
            style={{
              fontFamily: t.mono, fontSize: 10, color: t.accent,
              letterSpacing: 0.14, textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Pins ch. {chapter}
          </div>
          {visible.length === 0 ? (
            <div style={{ color: t.ink3, fontSize: 11 }}>Nothing pinned here yet.</div>
          ) : visible.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 0',
                borderTop: `1px solid ${t.rule}`,
                fontSize: 11,
                color: t.ink,
              }}
            >
              <MapPin size={10} color={t.accent} />
              <span style={{ flex: 1 }}>{p.name}</span>
              <button
                type="button"
                onClick={() => onDeletePin(p.id)}
                title="Delete pin"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', color: t.ink3,
                }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: 10,
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
        }}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Place name"
          style={{
            flex: 1,
            padding: '5px 10px',
            background: t.bg,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink,
            fontFamily: t.font,
            fontSize: 12,
            outline: 'none',
          }}
        />
        <input
          type="number"
          step="0.001"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="lat"
          style={{
            width: 90,
            padding: '5px 10px',
            background: t.bg,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink, fontSize: 12, outline: 'none',
          }}
        />
        <input
          type="number"
          step="0.001"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          placeholder="lng"
          style={{
            width: 90,
            padding: '5px 10px',
            background: t.bg,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink, fontSize: 12, outline: 'none',
          }}
        />
        <SmallButton
          primary
          onClick={() => {
            const latN = parseFloat(lat);
            const lngN = parseFloat(lng);
            if (!name.trim() || isNaN(latN) || isNaN(lngN)) {
              toastService.warn?.('Name, lat, lng required.');
              return;
            }
            onDropPin({ kind: 'globe', name: name.trim(), lat: latN, lng: lngN, chapterIds: [chapter] });
            setName(''); setLat(''); setLng('');
          }}
        >
          <Plus size={11} /> Drop pin
        </SmallButton>
      </div>
    </div>
  );
}

function MakerView({ maps, pins, chapter, activeMapId, setActiveMapId, onUploadMap, onDeleteMap, onDropPin, onDeletePin }) {
  const t = useTheme();
  const fileRef = React.useRef(null);
  const activeMap = maps.find((m) => m.id === activeMapId) || maps[0] || null;
  const mapPins = pins.filter((p) => p.kind === 'maker' && p.mapId === activeMap?.id);
  const [pendingPin, setPendingPin] = useState(null); // { x, y }

  const handleImgClick = (e) => {
    if (!activeMap) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPin({ x, y });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 10, height: '100%' }}>
      <aside
        style={{
          background: t.paper,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          padding: 10,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}
        >
          Custom maps
        </div>
        {maps.length === 0 && (
          <div style={{ color: t.ink3, fontSize: 12 }}>No maps uploaded yet.</div>
        )}
        {maps.map((m) => {
          const on = activeMapId === m.id;
          return (
            <div
              key={m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 8px',
                background: on ? t.accentSoft : t.bg,
                border: `1px solid ${on ? t.accent : t.rule}`,
                borderRadius: t.radius,
                cursor: 'pointer',
                fontSize: 12,
                color: t.ink,
              }}
              onClick={() => setActiveMapId(m.id)}
            >
              <MapIcon size={11} color={t.accent} />
              <span style={{ flex: 1 }}>{m.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDeleteMap(m.id); }}
                title="Delete map"
                style={{
                  background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer',
                }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
        <div style={{ marginTop: 8 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => onUploadMap({ name: f.name.replace(/\.[^.]+$/, ''), imageUrl: reader.result });
              reader.readAsDataURL(f);
              if (fileRef.current) fileRef.current.value = '';
            }}
          />
          <SmallButton primary onClick={() => fileRef.current?.click()}>
            <Upload size={11} /> Upload map
          </SmallButton>
        </div>
      </aside>

      <div
        style={{
          position: 'relative',
          background: t.bg,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          overflow: 'hidden',
          minHeight: 420,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {!activeMap ? (
          <div style={{ color: t.ink3, fontSize: 13, textAlign: 'center', padding: 30 }}>
            Upload a fantasy map to start placing pins. You can pin named
            locations and tag each pin to one or more chapters &mdash; they&apos;ll
            light up on the time scrubber below.
          </div>
        ) : (
          <div
            style={{ position: 'relative', width: '100%', height: '100%', cursor: 'crosshair' }}
            onClick={handleImgClick}
          >
            <img
              src={activeMap.imageUrl}
              alt={activeMap.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              draggable={false}
            />
            {mapPins.map((p) => {
              const on = (p.chapterIds || []).includes(chapter);
              return (
                <div
                  key={p.id}
                  style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: 'translate(-50%, -100%)',
                    pointerEvents: 'none',
                    color: on ? t.accent : t.ink3,
                    opacity: on ? 1 : 0.4,
                    textAlign: 'center',
                  }}
                >
                  <MapPin size={16} />
                  <div
                    style={{
                      fontFamily: t.mono, fontSize: 10, color: t.ink,
                      padding: '2px 5px',
                      background: t.paper,
                      border: `1px solid ${on ? t.accent : t.rule}`,
                      borderRadius: t.radius,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.name}
                  </div>
                </div>
              );
            })}
            {pendingPin && (
              <div
                style={{
                  position: 'absolute',
                  left: `${pendingPin.x}%`,
                  top: `${pendingPin.y}%`,
                  transform: 'translate(-50%, -50%)',
                  background: t.paper,
                  border: `1px solid ${t.accent}`,
                  borderRadius: t.radius,
                  padding: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  minWidth: 180,
                  zIndex: 10,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  placeholder="Pin name"
                  autoFocus
                  style={{
                    width: '100%', padding: '5px 8px',
                    background: t.bg, border: `1px solid ${t.rule}`,
                    borderRadius: t.radius, color: t.ink, fontSize: 12, outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const name = e.currentTarget.value.trim();
                      if (name) {
                        onDropPin({
                          kind: 'maker', name, mapId: activeMap.id,
                          x: pendingPin.x, y: pendingPin.y, chapterIds: [chapter],
                        });
                      }
                      setPendingPin(null);
                    } else if (e.key === 'Escape') {
                      setPendingPin(null);
                    }
                  }}
                />
                <div style={{ fontSize: 10, color: t.ink3, marginTop: 4 }}>
                  Enter to pin &middot; Esc to cancel
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AtlasBuilder({ worldState, setWorldState, onNavigate }) {
  const t = useTheme();
  const [mode, setMode] = useState('globe');
  const [chapter, setChapter] = useState(1);
  const [activeMapId, setActiveMapId] = useState(null);
  const [fogOfWar, setFogOfWar] = useState(false);
  const [travelOpen, setTravelOpen] = useState(false);

  const books = worldState?.books || {};
  const chapters = useMemo(
    () => Object.values(books)[0]?.chapters || [],
    [books],
  );
  const places = worldState?.places || [];
  const maps = (worldState?.floorplans || []).filter((f) => f.kind === 'map' || f.kind === undefined);

  useEffect(() => {
    if (!activeMapId && maps.length) setActiveMapId(maps[0].id);
  }, [activeMapId, maps]);

  useEffect(() => {
    if (chapters.length) setChapter((c) => (c === 1 ? chapters[chapters.length - 1].id : c));
  }, [chapters]);

  const persistPin = async (partial) => {
    const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const pin = { id, createdAt: Date.now(), ...partial };
    try {
      await db.add('places', pin);
    } catch (e) {
      console.warn('[Atlas] places store unavailable, in-memory only', e?.message || e);
    }
    setWorldState?.((prev) => ({ ...prev, places: [...(prev?.places || []), pin] }));
    toastService.success?.(`Pinned ${pin.name}.`);
  };

  const deletePin = async (id) => {
    try { await db.delete('places', id); } catch (_e) { /* noop */ }
    setWorldState?.((prev) => ({ ...prev, places: (prev?.places || []).filter((p) => p.id !== id) }));
  };

  const uploadMap = async ({ name, imageUrl }) => {
    const id = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const map = { id, name, imageUrl, kind: 'map', createdAt: Date.now() };
    try { await db.add('floorplans', map); }
    catch (e) { console.warn('[Atlas] floorplans store unavailable, in-memory only', e?.message || e); }
    setWorldState?.((prev) => ({ ...prev, floorplans: [...(prev?.floorplans || []), map] }));
    setActiveMapId(id);
    toastService.success?.(`Added map ${name}.`);
  };

  const deleteMap = async (id) => {
    try { await db.delete('floorplans', id); } catch (_e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...prev,
      floorplans: (prev?.floorplans || []).filter((f) => f.id !== id),
      places: (prev?.places || []).filter((p) => !(p.kind === 'maker' && p.mapId === id)),
    }));
    if (activeMapId === id) setActiveMapId(null);
  };

  const runAutoPin = () => {
    dispatchWeaver({
      mode: 'sweep',
      text: 'Extract and pin every geographic reference (real or fantasy) from every chapter to the Atlas.',
      autoRun: true,
    });
    toastService.info?.('Canon Weaver is sweeping chapters for map references. Opening Writer\'s Room to review.');
    onNavigate?.('write');
  };

  const runFloorplan = () => {
    dispatchWeaver({
      mode: 'single',
      text: 'Propose a floorplan for the most-visited city in this book. Include major halls, markets, defenses and known scene settings as labelled rooms.',
      autoRun: true,
    });
    toastService.info?.('Canon Weaver will draft a floorplan proposal.');
    onNavigate?.('write');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: 8,
          background: t.paper, border: `1px solid ${t.rule}`, borderRadius: t.radius,
        }}
      >
        <ModeButton icon={Globe}   label="Globe"  active={mode === 'globe'}  onClick={() => setMode('globe')} />
        <ModeButton icon={MapIcon} label="Maker"  active={mode === 'maker'}  onClick={() => setMode('maker')} />
        <ModeButton icon={Layers}  label="Hybrid" active={mode === 'hybrid'} onClick={() => setMode('hybrid')} />
        <div style={{ flex: 1 }} />
        <SmallButton onClick={runAutoPin} title="Let Canon Weaver scan chapter text and propose pins">
          <Wand2 size={11} /> Auto-pin from text
        </SmallButton>
        <SmallButton onClick={runFloorplan} title="AI-generated floorplan proposal">
          <Brush size={11} /> AI floorplan
        </SmallButton>
        <SmallButton onClick={() => setFogOfWar((v) => !v)} title="Fog of war: only show what the POV has seen">
          {fogOfWar ? <EyeOff size={11} /> : <Eye size={11} />}
          {fogOfWar ? ' Fog on' : ' Fog off'}
        </SmallButton>
        <SmallButton onClick={() => setTravelOpen((v) => !v)} title="Travel-time calculator">
          <Compass size={11} /> Travel
        </SmallButton>
      </div>

      {travelOpen && (
        <div
          style={{
            padding: 12,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink2,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: t.ink }}>Travel-time calculator (preview).</strong>{' '}
          Pick a start and end pin; the app uses terrain, roads and weather to
          estimate how long the journey should take on foot, horseback, or by
          ship. Wire-up is stubbed; the underlying data lives in
          <code> places[].travel </code> once Canon Weaver fills it. For now,
          run the <em>Auto-pin</em> sweep and then the calculator becomes live.
        </div>
      )}

      {fogOfWar && (
        <div
          style={{
            padding: 8,
            background: t.accentSoft,
            border: `1px solid ${t.accent}`,
            borderRadius: t.radius,
            color: t.ink,
            fontSize: 11,
            fontFamily: t.mono,
            letterSpacing: 0.12,
            textTransform: 'uppercase',
          }}
        >
          Fog of war: only showing pins the POV character has encountered by ch.{chapter}.
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 10 }}>
        {mode === 'globe' && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <GlobeView
              pins={places}
              chapter={chapter}
              onDropPin={persistPin}
              onDeletePin={deletePin}
            />
          </div>
        )}
        {mode === 'maker' && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <MakerView
              maps={maps}
              pins={places}
              chapter={chapter}
              activeMapId={activeMapId}
              setActiveMapId={setActiveMapId}
              onUploadMap={uploadMap}
              onDeleteMap={deleteMap}
              onDropPin={persistPin}
              onDeletePin={deletePin}
            />
          </div>
        )}
        {mode === 'hybrid' && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <GlobeView
                pins={places}
                chapter={chapter}
                onDropPin={persistPin}
                onDeletePin={deletePin}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MakerView
                maps={maps}
                pins={places}
                chapter={chapter}
                activeMapId={activeMapId}
                setActiveMapId={setActiveMapId}
                onUploadMap={uploadMap}
                onDeleteMap={deleteMap}
                onDropPin={persistPin}
                onDeletePin={deletePin}
              />
            </div>
          </>
        )}
      </div>

      {chapters.length > 0 && (
        <TimeScrubber chapters={chapters} value={chapter} onChange={setChapter} />
      )}
    </div>
  );
}

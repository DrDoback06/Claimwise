/**
 * AtlasBuilder - the Loomwright Atlas.
 *
 * Pass 3 (M34) adds:
 *   - Multi-region support (worldState.regions[] backed by DB v24
 *     `regions` store). Header has a region picker + new-region button.
 *   - Pan / zoom handled inside RegionView via a useAtlasTransform hook.
 *   - Draggable + lockable pins. Dragged positions are persisted to
 *     the places store.
 *   - Polygon draw tool that writes into region.landMasses[].
 *   - Reference-map overlay: upload an image + opacity slider so the
 *     user can trace over real geography.
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  Map as MapIcon, Layers, Wand2, Download, Plus, Eye, EyeOff, Navigation,
  Pencil, Image as ImageIcon, Trash2,
} from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import toastService from '../../services/toastService';
import PlacesSidebar from './PlacesSidebar';
import PlaceInspector from './PlaceInspector';
import RegionView from './RegionView';
import FloorplanView from './FloorplanView';
import GenerateView from './GenerateView';
import { KIND_OPTIONS, kindColor } from './kindColors';
import { proposePlaces } from '../../services/atlasProposals';

function TabButton({ label, active, onClick }) {
  const t = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '6px 8px',
        background: active ? t.accent : 'transparent',
        color: active ? t.onAccent : t.ink2,
        border: 'none',
        borderRadius: 2,
        fontFamily: t.mono, fontSize: 10,
        letterSpacing: 0.12, textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

export default function AtlasBuilder({ worldState, setWorldState, onNavigate }) {
  const t = useTheme();
  const [tab, setTab] = useState('region');
  const places = worldState?.places || [];
  const actors = worldState?.actors || [];
  const books = Object.values(worldState?.books || {});
  const maxChapter = books[0]?.chapters?.length
    ? books[0].chapters[books[0].chapters.length - 1].id
    : 1;

  // Multi-region.
  const regions = useMemo(() => {
    const arr = worldState?.regions || [];
    if (arr.length) return arr;
    return [{ id: 'region_default', name: 'Region', createdAt: 0 }];
  }, [worldState?.regions]);
  const [currentRegionId, setCurrentRegionId] = useState(regions[0]?.id || 'region_default');
  const currentRegion = regions.find((r) => r.id === currentRegionId) || regions[0];

  const [selectedId, setSelectedId] = useState(places[0]?.id || null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showProposals, setShowProposals] = useState(true);
  const [pendingDropKind, setPendingDropKind] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [fogEnabled, setFogEnabled] = useState(false);
  const [povCharacterId, setPovCharacterId] = useState(
    (actors.find((a) => a.role === 'lead') || actors[0])?.id || null,
  );
  const [currentChapter, setCurrentChapter] = useState(maxChapter);
  const [travelMode, setTravelMode] = useState(null);
  const [travelFromId, setTravelFromId] = useState(null);
  const [travelToId, setTravelToId] = useState(null);
  const [referenceOpacity, setReferenceOpacity] = useState(0.4);
  const fileInputRef = useRef(null);

  const handleTravelPick = travelMode
    ? (placeId) => {
        if (!travelFromId) { setTravelFromId(placeId); return; }
        if (!travelToId && placeId !== travelFromId) { setTravelToId(placeId); return; }
        setTravelFromId(placeId);
        setTravelToId(null);
      }
    : null;

  const [dismissedProposals, setDismissedProposals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lw-atlas-dismissed') || '[]'); }
    catch { return []; }
  });

  const proposals = useMemo(() => {
    const raw = proposePlaces(worldState);
    return raw.filter((p) => !dismissedProposals.includes(p.id));
  }, [worldState, dismissedProposals]);

  const selected = useMemo(
    () => places.find((p) => p.id === selectedId) || null,
    [places, selectedId],
  );

  const commitRegionPatch = useCallback(async (regionId, patch) => {
    const next = { ...(currentRegion || {}), id: regionId, ...patch, updatedAt: Date.now() };
    try { await db.update('regions', next); }
    catch (_e) {
      try { await db.add('regions', next); } catch (__e) { /* noop */ }
    }
    setWorldState?.((prev) => {
      const arr = prev?.regions || [];
      const exists = arr.some((r) => r.id === regionId);
      return {
        ...(prev || {}),
        regions: exists ? arr.map((r) => (r.id === regionId ? { ...r, ...next } : r)) : [...arr, next],
      };
    });
  }, [currentRegion, setWorldState]);

  // SVG export preserves vector fidelity; PNG export rasterises it through a
  // canvas so the user can drop the map into docs, beta-reader packs etc.
  const exportSVG = () => {
    const svg = document.querySelector('.lw-atlas-region svg');
    if (!svg) { toastService.warn?.('No region map to export.'); return; }
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(svg);
    const blob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loomwright-atlas-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toastService.success?.('Atlas SVG exported.');
  };

  const exportPNG = async () => {
    const svg = document.querySelector('.lw-atlas-region svg');
    if (!svg) { toastService.warn?.('No region map to export.'); return; }
    try {
      const serializer = new XMLSerializer();
      const src = serializer.serializeToString(svg);
      const svgBlob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgUrl;
      });
      // Render at 2x for retina-friendly exports.
      const bbox = svg.getBoundingClientRect();
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(bbox.width * scale));
      canvas.height = Math.max(1, Math.floor(bbox.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f6f2e8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => {
        if (!blob) { toastService.warn?.('PNG export failed.'); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loomwright-atlas-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toastService.success?.('Atlas PNG exported.');
      }, 'image/png');
    } catch (err) {
      console.warn('[Atlas] PNG export failed:', err);
      toastService.warn?.('PNG export failed - falling back to SVG.');
      exportSVG();
    }
  };

  const addProposalToPlaces = async (proposal) => {
    const existingBySlug = places.find(
      (p) => (p.name || '').toLowerCase() === (proposal.name || '').toLowerCase(),
    );
    if (existingBySlug) { toastService.info?.(`${proposal.name} is already in the atlas.`); return; }
    const chapterIds = Array.from(new Set(proposal.mentions.map((m) => Number(m.chapterId)).filter(Boolean)));
    const pin = {
      id: `place_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: proposal.name,
      kind: proposal.kind || 'place',
      regionId: currentRegionId,
      note: (proposal.mentions[0]?.excerpt || '').slice(0, 240),
      chapterIds,
      mentions: proposal.mentions.length,
      x: (proposal.x ?? 10) + (Math.random() * 70),
      y: (proposal.y ?? 10) + (Math.random() * 50),
      source: 'proposal',
      createdAt: Date.now(),
    };
    try { await db.add('places', pin); } catch (e) { /* noop */ }
    setWorldState?.((prev) => ({ ...(prev || {}), places: [...(prev?.places || []), pin] }));
    setDismissedProposals((list) => {
      const next = [...list, proposal.id];
      try { localStorage.setItem('lw-atlas-dismissed', JSON.stringify(next)); } catch (_e) { /* noop */ }
      return next;
    });
    setSelectedId(pin.id);
    setSelectedProposal(null);
    toastService.success?.(`Added ${pin.name} to the atlas.`);
  };

  const mergeProposal = (proposal) => {
    const target = selected || places[0];
    if (!target) { toastService.warn?.('Pick a place to merge into first.'); return; }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      places: (prev?.places || []).map((p) =>
        p.id === target.id
          ? {
              ...p,
              aliases: Array.from(new Set([...(p.aliases || []), proposal.name])),
              mentions: (p.mentions || 0) + proposal.mentions.length,
              chapterIds: Array.from(new Set([
                ...(p.chapterIds || []),
                ...proposal.mentions.map((m) => Number(m.chapterId)).filter(Boolean),
              ])),
            }
          : p,
      ),
    }));
    setDismissedProposals((list) => {
      const next = [...list, proposal.id];
      try { localStorage.setItem('lw-atlas-dismissed', JSON.stringify(next)); } catch (_e) { /* noop */ }
      return next;
    });
    setSelectedProposal(null);
    toastService.success?.(`${proposal.name} merged into ${target.name}.`);
  };

  const dismissProposal = (proposal) => {
    setDismissedProposals((list) => {
      const next = [...list, proposal.id];
      try { localStorage.setItem('lw-atlas-dismissed', JSON.stringify(next)); } catch (_e) { /* noop */ }
      return next;
    });
    if (selectedProposal?.id === proposal.id) setSelectedProposal(null);
  };

  const dropPin = async (x, y) => {
    if (!pendingDropKind) return;
    const name = window.prompt(`Name this ${pendingDropKind}?`, '');
    if (!name) { setPendingDropKind(null); return; }
    const pin = {
      id: `place_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      kind: pendingDropKind,
      regionId: currentRegionId,
      x, y,
      chapterIds: [],
      locked: false,
      createdAt: Date.now(),
    };
    try { await db.add('places', pin); } catch (e) { /* noop */ }
    setWorldState?.((prev) => ({ ...(prev || {}), places: [...(prev?.places || []), pin] }));
    setPendingDropKind(null);
    setSelectedId(pin.id);
    toastService.success?.(`Pinned ${pin.name}.`);
  };

  const movePin = async (id, x, y) => {
    const existing = places.find((p) => p.id === id);
    if (!existing || existing.locked) return;
    const next = { ...existing, x, y, updatedAt: Date.now() };
    try { await db.update('places', next); } catch (e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      places: (prev?.places || []).map((p) => (p.id === id ? next : p)),
    }));
  };

  const toggleLock = async (id) => {
    const existing = places.find((p) => p.id === id);
    if (!existing) return;
    const next = { ...existing, locked: !existing.locked, updatedAt: Date.now() };
    try { await db.update('places', next); } catch (e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      places: (prev?.places || []).map((p) => (p.id === id ? next : p)),
    }));
    toastService.info?.(next.locked ? `${existing.name} pin locked.` : `${existing.name} pin unlocked.`);
  };

  // Generic patch used by the inspector's rename / note / kind / manual-coord
  // edits. Keeps worldState + IndexedDB in sync.
  const patchPlace = async (id, patch) => {
    const existing = places.find((p) => p.id === id);
    if (!existing) return;
    const next = { ...existing, ...patch, updatedAt: Date.now() };
    try { await db.update('places', next); } catch (e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      places: (prev?.places || []).map((p) => (p.id === id ? next : p)),
    }));
  };

  const deletePlace = async (id) => {
    const existing = places.find((p) => p.id === id);
    if (!existing) return;
    try { await db.delete('places', id); } catch (e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      places: (prev?.places || []).filter((p) => p.id !== id),
    }));
    if (selectedId === id) setSelectedId(places[0]?.id || null);
    toastService.success?.(`Deleted ${existing.name}.`);
  };

  const duplicatePlace = async (id) => {
    const existing = places.find((p) => p.id === id);
    if (!existing) return;
    const copy = {
      ...existing,
      id: `place_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${existing.name} (copy)`,
      x: (typeof existing.x === 'number' ? existing.x : 50) + 3,
      y: (typeof existing.y === 'number' ? existing.y : 50) + 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      locked: false,
    };
    try { await db.add('places', copy); } catch (e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      places: [...(prev?.places || []), copy],
    }));
    setSelectedId(copy.id);
    toastService.success?.(`Duplicated as ${copy.name}.`);
  };

  const commitPolygon = (poly) => {
    const nextLand = [...((currentRegion?.landMasses) || []), poly];
    commitRegionPatch(currentRegionId, { landMasses: nextLand });
    setDrawMode(false);
    toastService.success?.(`Added ${poly.name} to the region.`);
  };

  const openFloorplan = (place) => {
    setSelectedId(place.id);
    setTab('floor');
  };

  const createRegion = async () => {
    const name = window.prompt('Name this region', 'New region');
    if (!name) return;
    const id = `region_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const region = { id, name: name.trim(), createdAt: Date.now(), landMasses: [], referenceImage: null };
    try { await db.add('regions', region); } catch (e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      regions: [...(prev?.regions || []), region],
    }));
    setCurrentRegionId(id);
    toastService.success?.(`Region "${region.name}" ready.`);
  };

  const uploadReference = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      commitRegionPatch(currentRegionId, { referenceImage: dataUrl });
      toastService.success?.('Reference image applied. Drag the slider to change opacity.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearReference = () => {
    commitRegionPatch(currentRegionId, { referenceImage: null });
    toastService.info?.('Reference image cleared.');
  };

  // Filter places to the current region (legacy pins without regionId show up everywhere).
  const regionPlaces = useMemo(() => {
    return places.filter((p) => !p.regionId || p.regionId === currentRegionId);
  }, [places, currentRegionId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${t.rule}`,
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          background: t.paper, flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex', gap: 4,
            padding: 3,
            background: t.bg,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            minWidth: 260,
          }}
        >
          <TabButton label="World" active={tab === 'world'} onClick={() => setTab('world')} />
          <TabButton label="Region" active={tab === 'region'} onClick={() => setTab('region')} />
          <TabButton label="Floorplan" active={tab === 'floor'} onClick={() => setTab('floor')} />
          <TabButton label="Generate" active={tab === 'generate'} onClick={() => setTab('generate')} />
        </div>

        {/* Region picker */}
        {tab === 'region' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <MapIcon size={12} color={t.accent} />
            <select
              value={currentRegionId}
              onChange={(e) => setCurrentRegionId(e.target.value)}
              style={{
                padding: '4px 8px',
                background: t.bg, color: t.ink,
                border: `1px solid ${t.rule}`, borderRadius: t.radius,
                fontFamily: t.font, fontSize: 11, outline: 'none',
              }}
            >
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button
              type="button"
              onClick={createRegion}
              title="Create another region"
              aria-label="Create another region"
              style={{
                padding: '4px 8px',
                display: 'inline-flex', alignItems: 'center', gap: 3,
                background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <Plus size={10} /> Region
            </button>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {tab === 'region' && (
          <>
            <select
              value={pendingDropKind || ''}
              onChange={(e) => setPendingDropKind(e.target.value || null)}
              title="Drop a pin of this kind by clicking the map"
              style={{
                padding: '5px 8px',
                background: pendingDropKind ? kindColor(pendingDropKind) + '22' : t.bg,
                color: t.ink,
                border: `1px solid ${pendingDropKind ? t.accent : t.rule}`,
                borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase',
              }}
            >
              <option value="">Drop pin...</option>
              {KIND_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>

            <button
              type="button"
              onClick={() => setDrawMode((v) => !v)}
              title="Draw a custom land mass"
              aria-label="Draw custom land"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px',
                background: drawMode ? t.accentSoft : 'transparent',
                color: drawMode ? t.ink : t.ink2,
                border: `1px solid ${drawMode ? t.accent : t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <Pencil size={11} /> Draw land
            </button>

            <div style={{ width: 1, height: 18, background: t.rule }} />

            <input
              type="file" accept="image/*" ref={fileInputRef}
              onChange={uploadReference}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Overlay a reference map image you can trace over"
              aria-label="Upload reference image"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px',
                background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <ImageIcon size={11} /> Reference
            </button>
            {currentRegion?.referenceImage && (
              <>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={referenceOpacity}
                  onChange={(e) => setReferenceOpacity(Number(e.target.value))}
                  title={`Reference opacity: ${Math.round(referenceOpacity * 100)}%`}
                  style={{ width: 80 }}
                />
                <button
                  type="button"
                  onClick={clearReference}
                  title="Remove reference image"
                  aria-label="Remove reference image"
                  style={{
                    padding: 4,
                    background: 'transparent', color: t.ink2,
                    border: `1px solid ${t.rule}`, borderRadius: t.radius, cursor: 'pointer',
                  }}
                >
                  <Trash2 size={10} />
                </button>
              </>
            )}

            <div style={{ width: 1, height: 18, background: t.rule }} />

            {/* Chapter scrubber - dims pins whose chapterIds are beyond the
                selected chapter so the author can see how the world grew
                chapter by chapter. */}
            {maxChapter > 1 && (
              <label
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 8px',
                  background: t.paper2,
                  border: `1px solid ${t.rule}`, borderRadius: t.radius,
                  fontFamily: t.mono, fontSize: 10,
                  letterSpacing: 0.12, textTransform: 'uppercase',
                  color: t.ink2,
                }}
                title="Limit the atlas to places seen by this chapter"
              >
                Ch.{currentChapter}
                <input
                  type="range"
                  min={1}
                  max={maxChapter}
                  value={currentChapter}
                  onChange={(e) => setCurrentChapter(Number(e.target.value))}
                  style={{ width: 80 }}
                />
              </label>
            )}

            {/* Fog-of-war */}
            <button
              type="button"
              onClick={() => setFogEnabled((v) => !v)}
              title={fogEnabled ? 'Hide fog of war' : 'Show only places the POV has seen'}
              aria-label="Toggle fog of war"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px',
                background: fogEnabled ? t.accentSoft : 'transparent',
                color: fogEnabled ? t.ink : t.ink2,
                border: `1px solid ${fogEnabled ? t.accent : t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              {fogEnabled ? <Eye size={11} /> : <EyeOff size={11} />} Fog
            </button>

            {/* Travel */}
            <button
              type="button"
              onClick={() => {
                setTravelMode((prev) => {
                  if (prev) { setTravelFromId(null); setTravelToId(null); return null; }
                  return 'horseback';
                });
              }}
              title="Click two pins to estimate travel time"
              aria-label="Estimate travel"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px',
                background: travelMode ? t.accentSoft : 'transparent',
                color: travelMode ? t.ink : t.ink2,
                border: `1px solid ${travelMode ? t.accent : t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <Navigation size={11} /> Travel
            </button>

            <button
              type="button"
              onClick={exportPNG}
              aria-label="Export atlas as PNG"
              title="Export the current region as a PNG"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 10px',
                background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <Download size={11} /> PNG
            </button>
            <button
              type="button"
              onClick={exportSVG}
              aria-label="Export atlas as SVG"
              title="Export the current region as a vector SVG"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 10px',
                background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <Download size={11} /> SVG
            </button>
          </>
        )}
        {tab === 'generate' && (
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: t.ink2, fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.12, textTransform: 'uppercase',
            }}
          >
            <Wand2 size={11} color={t.accent} /> Powered by Canon Weaver
          </div>
        )}
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* World tab shows a full-width cards grid; sidebar is only useful
            inside a single region. */}
        {tab !== 'world' && (
          <PlacesSidebar
            places={regionPlaces}
            proposals={proposals}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); setSelectedProposal(null); }}
            onSelectProposal={(pr) => { setSelectedProposal(pr); setSelectedId(null); }}
            showProposals={showProposals}
            onToggleProposals={setShowProposals}
            onAddProposal={addProposalToPlaces}
            onMergeProposal={mergeProposal}
            onDismissProposal={dismissProposal}
          />
        )}
        <main style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0 }}>
          {tab === 'world' && (
            <WorldView
              regions={regions}
              places={places}
              currentChapter={currentChapter}
              onEnterRegion={(id) => { setCurrentRegionId(id); setTab('region'); }}
              onCreateRegion={createRegion}
            />
          )}
          {tab === 'region' && (
            <>
              <div className="lw-atlas-region" style={{ flex: 1, display: 'flex', minWidth: 0 }}>
                <RegionView
                  places={regionPlaces}
                  proposals={proposals}
                  showProposals={showProposals}
                  selectedId={selectedId}
                  selectedProposalId={selectedProposal?.id || null}
                  onSelectPlace={(id) => { setSelectedId(id); setSelectedProposal(null); }}
                  onSelectProposal={(pr) => { setSelectedProposal(pr); setSelectedId(null); }}
                  onDropPin={dropPin}
                  onMovePin={movePin}
                  onToggleLock={toggleLock}
                  pendingDropKind={pendingDropKind}
                  worldState={worldState}
                  fogEnabled={fogEnabled}
                  povCharacterId={povCharacterId}
                  currentChapter={currentChapter}
                  travelMode={travelMode}
                  travelFromId={travelFromId}
                  travelToId={travelToId}
                  onTravelPick={handleTravelPick}
                  drawMode={drawMode}
                  onPolygonCommit={commitPolygon}
                  landMasses={currentRegion?.landMasses || []}
                  referenceImage={currentRegion?.referenceImage || null}
                  referenceOpacity={referenceOpacity}
                  regionKey={currentRegionId}
                />
              </div>
              <PlaceInspector
                place={selected}
                proposal={selectedProposal}
                worldState={worldState}
                onOpenFloorplan={openFloorplan}
                onNavigate={onNavigate}
                onToggleLock={toggleLock}
                onPatchPlace={patchPlace}
                onDeletePlace={deletePlace}
                onDuplicatePlace={duplicatePlace}
              />
            </>
          )}
          {tab === 'floor' && (
            <FloorplanView
              place={selected}
              worldState={worldState}
              setWorldState={setWorldState}
              onNavigate={onNavigate}
            />
          )}
          {tab === 'generate' && (
            <GenerateView
              worldState={worldState}
              setWorldState={setWorldState}
              onNavigate={onNavigate}
              onReturnToRegion={() => setTab('region')}
            />
          )}
        </main>
      </div>
      {regionPlaces.length === 0 && tab === 'region' && (
        <div
          style={{
            padding: '10px 16px',
            borderTop: `1px solid ${t.rule}`,
            fontSize: 12, color: t.ink3,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <Plus size={12} color={t.accent} />
          <span>
            This region is empty. Accept proposals from the sidebar, drop a pin
            with the kind selector above, draw a land mass, or use the
            Generate tab.
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * WorldView - phase 2 top-level multi-region canvas. Shows every region as
 * a card; double-click (or the "Open" button) zooms into the classic Region
 * editor. Region images double as card thumbnails when uploaded; otherwise
 * the pane shows a generated mini grid of its places.
 *
 * This is intentionally a thin pass - cross-region routes and world-level
 * timeline scrubbing are queued for a follow-up commit, but having the
 * panel here means the user can already manage a dozen regions without
 * living in the picker dropdown.
 */
function WorldView({ regions, places, currentChapter, onEnterRegion, onCreateRegion }) {
  const t = useTheme();
  const byRegion = useMemo(() => {
    const out = new Map();
    (regions || []).forEach((r) => out.set(r.id, []));
    (places || []).forEach((p) => {
      if (!p.regionId) return;
      if (!out.has(p.regionId)) out.set(p.regionId, []);
      out.get(p.regionId).push(p);
    });
    return out;
  }, [regions, places]);

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 20, background: t.bg }}>
      <div
        style={{
          fontFamily: t.mono, fontSize: 10, color: t.accent,
          letterSpacing: 0.18, textTransform: 'uppercase', marginBottom: 10,
        }}
      >
        World map &middot; Ch.{currentChapter}
      </div>
      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        }}
      >
        {(regions || []).map((r) => {
          const rp = byRegion.get(r.id) || [];
          return (
            <button
              key={r.id}
              type="button"
              onDoubleClick={() => onEnterRegion?.(r.id)}
              onClick={() => onEnterRegion?.(r.id)}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column',
                minHeight: 160,
                padding: 0,
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                overflow: 'hidden',
                cursor: 'pointer',
                color: t.ink,
                textAlign: 'left',
              }}
            >
              {r.referenceImage ? (
                <img
                  src={r.referenceImage}
                  alt={r.name}
                  style={{
                    width: '100%', height: 100,
                    objectFit: 'cover', opacity: 0.8,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%', height: 100,
                    background: `linear-gradient(135deg, ${t.paper2}, ${t.bg})`,
                    position: 'relative',
                  }}
                >
                  {/* Tiny scatter of dots so regions without a reference
                      image still look like maps. */}
                  {rp.slice(0, 12).map((p, i) => (
                    <span
                      key={p.id || i}
                      style={{
                        position: 'absolute',
                        left: `${typeof p.x === 'number' ? Math.min(96, Math.max(2, p.x)) : (i * 7) % 96}%`,
                        top: `${typeof p.y === 'number' ? Math.min(92, Math.max(2, p.y * 1.35)) : 10 + ((i * 13) % 80)}%`,
                        width: 4, height: 4, borderRadius: 999,
                        background: kindColor(p.kind),
                      }}
                    />
                  ))}
                </div>
              )}
              <div style={{ padding: 12 }}>
                <div style={{ fontFamily: t.display, fontSize: 15, fontWeight: 500, color: t.ink }}>
                  {r.name}
                </div>
                <div
                  style={{
                    fontFamily: t.mono, fontSize: 9, color: t.ink3,
                    letterSpacing: 0.14, textTransform: 'uppercase',
                    marginTop: 4,
                  }}
                >
                  {rp.length} place{rp.length === 1 ? '' : 's'}
                </div>
              </div>
            </button>
          );
        })}
        {/* Add-region tile. */}
        <button
          type="button"
          onClick={onCreateRegion}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 160,
            background: 'transparent',
            border: `1px dashed ${t.rule}`,
            borderRadius: t.radius,
            color: t.ink2,
            cursor: 'pointer',
            fontFamily: t.mono, fontSize: 11,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}
        >
          <Plus size={14} style={{ marginRight: 6 }} /> Add region
        </button>
      </div>
    </div>
  );
}

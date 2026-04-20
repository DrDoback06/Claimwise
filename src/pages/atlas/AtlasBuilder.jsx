/**
 * AtlasBuilder - the Loomwright Atlas per redesign doc 13.
 *
 * Three tabs: Region | Floorplan | Generate.
 *
 *   Region: SVG ink-wash map with typed places + proposals layer, left
 *   PlacesSidebar, right PlaceInspector. Drop pins by picking a kind and
 *   clicking the map.
 *
 *   Floorplan: vector room editor for a selected place. Built in M19.
 *
 *   Generate: describe-a-place flow that dispatches to Canon Weaver and
 *   returns proposals back to the region. Built in M20.
 *
 * Fog-of-war + travel-time-calculator live on the Region view and are
 * filled in by M20.
 */

import React, { useMemo, useState } from 'react';
import { Map as MapIcon, Layers, Wand2, Download, Plus, Eye, EyeOff, Navigation } from 'lucide-react';
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
  const [selectedId, setSelectedId] = useState(places[0]?.id || null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showProposals, setShowProposals] = useState(true);
  const [pendingDropKind, setPendingDropKind] = useState(null);
  const [fogEnabled, setFogEnabled] = useState(false);
  const [povCharacterId, setPovCharacterId] = useState(
    (actors.find((a) => a.role === 'lead') || actors[0])?.id || null,
  );
  const [currentChapter, setCurrentChapter] = useState(maxChapter);
  const [travelMode, setTravelMode] = useState(null); // null | 'foot' | 'horseback' | 'ship'
  const [travelFromId, setTravelFromId] = useState(null);
  const [travelToId, setTravelToId] = useState(null);

  const handleTravelPick = travelMode
    ? (placeId) => {
        if (!travelFromId) { setTravelFromId(placeId); return; }
        if (!travelToId && placeId !== travelFromId) { setTravelToId(placeId); return; }
        // third click resets
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

  const exportPNG = () => {
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

  const addProposalToPlaces = async (proposal) => {
    const existingBySlug = places.find(
      (p) => (p.name || '').toLowerCase() === (proposal.name || '').toLowerCase(),
    );
    if (existingBySlug) {
      toastService.info?.(`${proposal.name} is already in the atlas.`);
      return;
    }
    const chapterIds = Array.from(new Set(proposal.mentions.map((m) => Number(m.chapterId)).filter(Boolean)));
    const pin = {
      id: `place_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: proposal.name,
      kind: proposal.kind || 'place',
      note: (proposal.mentions[0]?.excerpt || '').slice(0, 240),
      chapterIds,
      mentions: proposal.mentions.length,
      x: (proposal.x ?? 10) + (Math.random() * 70),
      y: (proposal.y ?? 10) + (Math.random() * 50),
      source: 'proposal',
      createdAt: Date.now(),
    };
    try { await db.add('places', pin); }
    catch (e) { console.warn('[Atlas] places store unavailable:', e); }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      places: [...(prev?.places || []), pin],
    }));
    // Drop the proposal so it doesn't re-appear
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
    // Pick the nearest place by name or fallback to selected. For a minimal
    // v1, we just log under the nearest selected place as an alias.
    const target = selected || places[0];
    if (!target) {
      toastService.warn?.('Pick a place to merge into first.');
      return;
    }
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
      x, y,
      chapterIds: [],
      createdAt: Date.now(),
    };
    try { await db.add('places', pin); }
    catch (e) { console.warn('[Atlas] places store unavailable:', e); }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      places: [...(prev?.places || []), pin],
    }));
    setPendingDropKind(null);
    setSelectedId(pin.id);
    toastService.success?.(`Pinned ${pin.name}.`);
  };

  const openFloorplan = (place) => {
    setSelectedId(place.id);
    setTab('floor');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with tabs + actions */}
      <header
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${t.rule}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
          background: t.paper,
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
          <TabButton label="Region" active={tab === 'region'} onClick={() => setTab('region')} />
          <TabButton label="Floorplan" active={tab === 'floor'} onClick={() => setTab('floor')} />
          <TabButton label="Generate" active={tab === 'generate'} onClick={() => setTab('generate')} />
        </div>
        <div
          style={{
            fontFamily: t.mono, fontSize: 10, color: t.accent,
            letterSpacing: 0.14, textTransform: 'uppercase',
          }}
        >
          Atlas &middot; {tab === 'region' ? (worldState?.region?.name || 'Region') : tab === 'floor' ? 'Floorplan' : 'Generate'}
        </div>
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
              {KIND_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            {pendingDropKind && (
              <button
                type="button"
                onClick={() => setPendingDropKind(null)}
                style={{
                  padding: '5px 10px',
                  background: 'transparent', color: t.ink2,
                  border: `1px solid ${t.rule}`, borderRadius: t.radius,
                  fontFamily: t.mono, fontSize: 10,
                  letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}

            <div style={{ width: 1, height: 18, background: t.rule }} />

            {/* Fog-of-war */}
            <button
              type="button"
              onClick={() => setFogEnabled((v) => !v)}
              title={fogEnabled ? 'Hide fog of war' : 'Show only places the POV has seen'}
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
              {fogEnabled ? <Eye size={11} /> : <EyeOff size={11} />}
              Fog
            </button>
            {fogEnabled && (
              <>
                <select
                  value={povCharacterId || ''}
                  onChange={(e) => setPovCharacterId(e.target.value || null)}
                  style={{
                    padding: '4px 8px',
                    background: t.bg, color: t.ink,
                    border: `1px solid ${t.rule}`, borderRadius: t.radius,
                    fontFamily: t.font, fontSize: 11, outline: 'none',
                  }}
                >
                  {actors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={maxChapter}
                  value={currentChapter}
                  onChange={(e) => setCurrentChapter(Math.max(1, Math.min(maxChapter, Number(e.target.value) || 1)))}
                  title="Chapter POV knows up to"
                  style={{
                    width: 64,
                    padding: '4px 8px',
                    background: t.bg, color: t.ink,
                    border: `1px solid ${t.rule}`, borderRadius: t.radius,
                    fontFamily: t.mono, fontSize: 11, outline: 'none',
                  }}
                />
              </>
            )}

            {/* Travel-time */}
            <button
              type="button"
              onClick={() => {
                setTravelMode((prev) => {
                  if (prev) { setTravelFromId(null); setTravelToId(null); return null; }
                  return 'horseback';
                });
              }}
              title="Click two pins to estimate travel time"
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
            {travelMode && (
              <select
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value)}
                style={{
                  padding: '4px 8px',
                  background: t.bg, color: t.ink,
                  border: `1px solid ${t.rule}`, borderRadius: t.radius,
                  fontFamily: t.mono, fontSize: 11, outline: 'none',
                }}
              >
                <option value="foot">On foot</option>
                <option value="horseback">Horseback</option>
                <option value="ship">Ship</option>
              </select>
            )}

            <div style={{ width: 1, height: 18, background: t.rule }} />

            <button
              type="button"
              onClick={exportPNG}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 10px',
                background: 'transparent', color: t.ink2,
                border: `1px solid ${t.rule}`, borderRadius: t.radius,
                fontFamily: t.mono, fontSize: 10,
                letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <Download size={11} /> Export SVG
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
        <PlacesSidebar
          places={places}
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
        <main style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0 }}>
          {tab === 'region' && (
            <>
              <div className="lw-atlas-region" style={{ flex: 1, display: 'flex', minWidth: 0 }}>
                <RegionView
                  places={places}
                  proposals={proposals}
                  showProposals={showProposals}
                  selectedId={selectedId}
                  selectedProposalId={selectedProposal?.id || null}
                  onSelectPlace={(id) => { setSelectedId(id); setSelectedProposal(null); }}
                  onSelectProposal={(pr) => { setSelectedProposal(pr); setSelectedId(null); }}
                  onDropPin={dropPin}
                  pendingDropKind={pendingDropKind}
                  worldState={worldState}
                  fogEnabled={fogEnabled}
                  povCharacterId={povCharacterId}
                  currentChapter={currentChapter}
                  travelMode={travelMode}
                  travelFromId={travelFromId}
                  travelToId={travelToId}
                  onTravelPick={handleTravelPick}
                />
              </div>
              <PlaceInspector
                place={selected}
                proposal={selectedProposal}
                worldState={worldState}
                onOpenFloorplan={openFloorplan}
                onNavigate={onNavigate}
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
      {places.length === 0 && (
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
            The atlas is empty. Accept proposals from the sidebar, drop a pin
            with the kind selector above, or use the Generate tab.
          </span>
        </div>
      )}
    </div>
  );
}

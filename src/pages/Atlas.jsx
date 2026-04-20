/**
 * Atlas — Explore > Atlas tab.
 *
 * Three views in one tab: Regional (UK map / world map), Floorplan (AtlasAI
 * editor with region + floorplan + propose sub-tabs), and Places (flat list
 * of all worldState.places for quick reference).
 */

import React, { useState } from 'react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from './_shared/PageChrome';
import AtlasAI from '../loomwright/atlas/AtlasAI';
import UKMapVisualization from '../components/UKMapVisualization';

const TABS = [
  { id: 'regional', label: 'Regional' },
  { id: 'atlas', label: 'Atlas AI' },
  { id: 'places', label: 'Places' },
];

function PlacesList({ worldState }) {
  const t = useTheme();
  const places = worldState?.places || [];
  if (!places.length) {
    return (
      <div
        style={{
          padding: 30,
          textAlign: 'center',
          color: t.ink2,
          fontSize: 12,
          border: `1px dashed ${t.rule}`,
          borderRadius: t.radius,
          background: t.paper,
        }}
      >
        No places defined yet. Pin some in Atlas AI or run Canon Weaver to extract them from your manuscript.
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 10,
      }}
    >
      {places.map((p) => (
        <div
          key={p.id}
          style={{
            padding: 12,
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
          }}
        >
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.14, textTransform: 'uppercase' }}>
            {p.kind || 'place'}
          </div>
          <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink, marginTop: 2 }}>
            {p.name}
          </div>
          {p.note && (
            <div style={{ fontSize: 11, color: t.ink2, marginTop: 6, lineHeight: 1.4 }}>
              {p.note}
            </div>
          )}
          {p.chapterIds?.length > 0 && (
            <div style={{ marginTop: 8, fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12 }}>
              {p.chapterIds.length} chapter references
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AtlasPage({ worldState, setWorldState }) {
  const t = useTheme();
  const [tab, setTab] = useState('atlas');

  const actors = worldState?.actors || [];
  const books = Object.values(worldState?.books || {});

  return (
    <Page>
      <PageHeader
        eyebrow="Explore"
        title="Atlas"
        subtitle="Regional maps, floorplans and places tied to your chapters."
      />
      <TabStrip tabs={TABS} activeId={tab} onChange={setTab} />
      <PageBody padding={tab === 'atlas' ? 0 : 28}>
        {tab === 'regional' && (
          <UKMapVisualization actors={actors} books={books} onClose={() => {}} />
        )}
        {tab === 'atlas' && (
          <div style={{ height: '100%', minHeight: 540 }}>
            <AtlasAI worldState={worldState} setWorldState={setWorldState} />
          </div>
        )}
        {tab === 'places' && <PlacesList worldState={worldState} />}
      </PageBody>
    </Page>
  );
}

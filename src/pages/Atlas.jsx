/**
 * Atlas — Explore > Atlas.
 *
 * Primary mode is the new AtlasBuilder (globe + maker + hybrid, time scrubber).
 * AtlasAI stays as a secondary "AI proposals" surface for the structured
 * chapter-region extraction pipeline; UKMapVisualization is preserved as a
 * "Legacy UK" view for parity with old data.
 */

import React, { useState } from 'react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from './_shared/PageChrome';
import AtlasBuilder from './atlas/AtlasBuilder';
import AtlasAI from '../loomwright/atlas/AtlasAI';
import UKMapVisualization from '../components/UKMapVisualization';

const TABS = [
  { id: 'builder', label: 'Builder' },
  { id: 'ai',      label: 'AI proposals' },
  { id: 'places',  label: 'Places' },
  { id: 'legacy',  label: 'UK legacy' },
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
        No places defined yet. Pin some in the Builder or run Canon Weaver to extract them from your manuscript.
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
          <div
            style={{
              fontFamily: t.mono, fontSize: 9, color: t.accent,
              letterSpacing: 0.14, textTransform: 'uppercase',
            }}
          >
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
          {(p.chapterIds || []).length > 0 && (
            <div
              style={{
                marginTop: 8,
                fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12,
              }}
            >
              {p.chapterIds.length} chapter reference{p.chapterIds.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AtlasPage({ worldState, setWorldState, onNavigate }) {
  const [tab, setTab] = useState('builder');
  const actors = worldState?.actors || [];
  const books = Object.values(worldState?.books || {});

  return (
    <Page>
      <PageHeader
        eyebrow="Explore"
        title="Atlas"
        subtitle="Globe, custom fantasy maps, and the places tied to your chapters."
      />
      <TabStrip tabs={TABS} activeId={tab} onChange={setTab} />
      <PageBody padding={tab === 'builder' || tab === 'ai' ? 16 : 28}>
        {tab === 'builder' && (
          <div style={{ height: '100%', minHeight: 560 }}>
            <AtlasBuilder worldState={worldState} setWorldState={setWorldState} onNavigate={onNavigate} />
          </div>
        )}
        {tab === 'ai' && (
          <div style={{ height: '100%', minHeight: 540 }}>
            <AtlasAI scoped worldState={worldState} setWorldState={setWorldState} />
          </div>
        )}
        {tab === 'places' && <PlacesList worldState={worldState} />}
        {tab === 'legacy' && <UKMapVisualization actors={actors} books={books} onClose={() => {}} />}
      </PageBody>
    </Page>
  );
}

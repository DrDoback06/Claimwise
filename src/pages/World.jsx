/**
 * World — Explore > World tab.
 *
 * Tabs:
 *   Wiki & Lore — WikiManager + WorldLoreTab stacked
 *   Factions    — WikiManager scoped to faction entities
 *   Mind Map    — StoryMindMap (rich) with Gravity mind map fallback
 */

import React, { useState } from 'react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from './_shared/PageChrome';
import WikiManager from '../components/WikiManager';
import WorldLoreTab from '../components/WorldLoreTab';
import StoryMindMap from '../components/StoryMindMap';

const TABS = [
  { id: 'wiki', label: 'Wiki & Lore' },
  { id: 'factions', label: 'Factions' },
  { id: 'mindmap', label: 'Mind Map' },
];

export default function WorldPage({ worldState, setWorldState }) {
  const t = useTheme();
  const [tab, setTab] = useState('wiki');

  const actors = worldState?.actors || [];
  const items = worldState?.itemBank || [];
  const skills = worldState?.skillBank || [];
  const books = Object.values(worldState?.books || {});
  const factions = items.filter((i) => (i.type || '').toLowerCase().includes('faction')) || [];

  return (
    <Page>
      <PageHeader
        eyebrow="Explore"
        title="World"
        subtitle="Wiki entries, factions and the visual map of how every story piece connects."
      />
      <TabStrip tabs={TABS} activeId={tab} onChange={setTab} />
      <PageBody padding={tab === 'mindmap' ? 0 : 28}>
        {tab === 'wiki' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <WikiManager entities={items} entityType="item" onClose={() => {}} />
            <WorldLoreTab actors={actors} books={books} />
          </div>
        )}
        {tab === 'factions' && (
          factions.length === 0 ? (
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
              No factions defined yet. Mark items or lore entries with the
              "faction" type to see them here.
            </div>
          ) : (
            <WikiManager entities={factions} entityType="item" onClose={() => {}} />
          )
        )}
        {tab === 'mindmap' && (
          <div style={{ height: '100%', minHeight: 540 }}>
            <StoryMindMap
              actors={actors}
              items={items}
              skills={skills}
              books={books}
              onClose={() => {}}
            />
          </div>
        )}
      </PageBody>
    </Page>
  );
}

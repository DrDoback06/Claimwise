/**
 * PlotTimeline — Explore > Plot & Timeline tab.
 *
 * Tabs:
 *   Beats        — PlotBeatTracker (overview, non-compact)
 *   Threads      — PlotThreadTracker + PlotQuestTab stacked
 *   Chronology   — MasterTimeline + PlotTimeline
 *   Narrative    — StoryMap (scene connection graph)
 */

import React, { useState } from 'react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from './_shared/PageChrome';
import PlotBeatTracker from '../components/PlotBeatTracker';
import PlotThreadTracker from '../components/PlotThreadTracker';
import PlotQuestTab from '../components/PlotQuestTab';
import MasterTimeline from '../components/MasterTimeline';
import PlotTimeline from '../components/PlotTimeline';
import StoryMap from '../components/StoryMap';

const TABS = [
  { id: 'beats', label: 'Beats' },
  { id: 'threads', label: 'Threads & Quests' },
  { id: 'chrono', label: 'Chronology' },
  { id: 'graph', label: 'Narrative Graph' },
];

export default function PlotTimelinePage({ worldState, bookTab, currentChapter, onNavigate }) {
  const t = useTheme();
  const [tab, setTab] = useState('beats');

  const actors = worldState?.actors || [];
  const itemBank = worldState?.itemBank || [];
  const skillBank = worldState?.skillBank || [];
  const books = Object.values(worldState?.books || {});

  return (
    <Page>
      <PageHeader
        eyebrow="Explore"
        title="Plot & Timeline"
        subtitle="Beats, threads, chronology and the story graph in one place."
      />
      <TabStrip tabs={TABS} activeId={tab} onChange={setTab} />
      <PageBody padding={tab === 'graph' ? 0 : 28}>
        {tab === 'beats' && (
          <PlotBeatTracker
            currentBookId={bookTab}
            currentChapter={currentChapter}
            onBeatSelect={() => {}}
            compact={false}
          />
        )}
        {tab === 'threads' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <PlotThreadTracker books={books} onClose={() => {}} />
            <PlotQuestTab books={books} />
          </div>
        )}
        {tab === 'chrono' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <MasterTimeline books={books} actors={actors} onClose={() => {}} />
            <PlotTimeline books={books} onClose={() => {}} />
          </div>
        )}
        {tab === 'graph' && (
          <div style={{ height: '100%', minHeight: 540 }}>
            <StoryMap
              books={books}
              actors={actors}
              itemBank={itemBank}
              skillBank={skillBank}
              onClose={() => {}}
              onChapterClick={() => onNavigate?.('write')}
            />
          </div>
        )}
      </PageBody>
    </Page>
  );
}

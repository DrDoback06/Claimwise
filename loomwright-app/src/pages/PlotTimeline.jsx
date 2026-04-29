/**
 * Plot & Timeline — the unified Plot Lab.
 *
 * One canvas with mode toolbar:
 *   Insights   - dangling threads, density heatmap, parallel POV, plants/payoffs
 *   Beats      - PlotBeatTracker
 *   Threads    - PlotThreadTracker + PlotQuestTab stacked
 *   Consistency - ConsistencyChecker (inline)
 *   Structure  - CharacterArcMapper (spans every actor)
 *   Chronology - MasterTimeline + PlotTimeline
 *   Graph      - StoryMap (scene connection graph)
 *
 * The "Run continuity sweep" button dispatches a Canon Weaver sweep so the
 * Plot Lab and Canon Weaver share a single pipeline.
 */

import React, { useState } from 'react';
import { Wand2, AlertTriangle } from 'lucide-react';
import { useTheme } from '../loomwright/theme';
import { Page, PageHeader, PageBody, TabStrip } from './_shared/PageChrome';
import WorkspaceMiniBrief from './_shared/WorkspaceMiniBrief';
import PlotBeatTracker from '../components/PlotBeatTracker';
import PlotThreadTracker from '../components/PlotThreadTracker';
import PlotQuestTab from '../components/PlotQuestTab';
import MasterTimeline from '../components/MasterTimeline';
import StoryMap from '../components/StoryMap';
import ConsistencyChecker from '../components/ConsistencyChecker';
import CharacterArcMapper from '../components/CharacterArcMapper';
import toastService from '../services/toastService';
import { runSweep } from '../loomwright/weaver/weaverAI';
import { DanglingThreads, ThreadDensityHeatmap, ParallelPOV, PlantPayoff } from './plot/PlotInsights';

const TABS = [
  { id: 'insights',    label: 'Insights' },
  { id: 'beats',       label: 'Beats' },
  { id: 'threads',     label: 'Threads & Quests' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'arcs',        label: 'Arcs' },
  { id: 'chrono',      label: 'Chronology' },
  { id: 'graph',       label: 'Narrative Graph' },
];

export default function PlotTimelinePage({ worldState, bookTab, currentChapter, onNavigate }) {
  const t = useTheme();
  const [tab, setTab] = useState('insights');

  const actors = worldState?.actors || [];
  const itemBank = worldState?.itemBank || [];
  const skillBank = worldState?.skillBank || [];
  const books = Object.values(worldState?.books || {});

  const sweep = () => runSweep({ scope: 'plot', onNavigate, toast: toastService });

  return (
    <Page>
      <PageHeader
        eyebrow="Explore"
        title="Plot Lab"
        subtitle="Threads, beats, consistency, arcs, chronology and the narrative graph \u2014 all in one canvas."
        miniBrief={<WorkspaceMiniBrief surface="plot_timeline" worldState={worldState} />}
        actions={
          <button
            type="button"
            onClick={sweep}
            title="Ask Canon Weaver to sweep the book for plot drift"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              background: t.accent, color: t.onAccent,
              border: `1px solid ${t.accent}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.14, textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            <Wand2 size={12} /> Run continuity sweep
          </button>
        }
      />
      <TabStrip tabs={TABS} activeId={tab} onChange={setTab} />
      <PageBody padding={tab === 'graph' ? 0 : 24}>
        {tab === 'insights' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                padding: 12,
                background: t.paper,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertTriangle size={14} color={t.accent} />
              <div style={{ flex: 1, fontSize: 12, color: t.ink2, lineHeight: 1.5 }}>
                These panels read from worldState. Canon Weaver fills them in as
                you accept edits. Run a continuity sweep to auto-populate threads,
                plants and POV knowledge with a single click.
              </div>
            </div>
            <DanglingThreads worldState={worldState} />
            <ThreadDensityHeatmap worldState={worldState} />
            <ParallelPOV worldState={worldState} />
            <PlantPayoff worldState={worldState} />
          </div>
        )}
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
        {tab === 'consistency' && (
          <ConsistencyChecker
            actors={actors}
            books={worldState?.books || {}}
            itemBank={itemBank}
            skillBank={skillBank}
            onClose={() => {}}
          />
        )}
        {tab === 'arcs' && (
          <CharacterArcMapper actors={actors} books={books} onClose={() => {}} />
        )}
        {tab === 'chrono' && (
          <MasterTimeline books={books} actors={actors} onClose={() => {}} />
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

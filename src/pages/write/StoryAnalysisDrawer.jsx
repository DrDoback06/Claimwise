/**
 * StoryAnalysisDrawer — cross-chapter consistency + story analysis.
 *
 * Hosts both legacy surfaces (ConsistencyChecker and StoryAnalysisHub) behind
 * a tabbed layout inside the Write drawer. Provides an onJumpToChapter
 * callback the parent uses to route the editor to a flagged chapter.
 */

import React, { useState } from 'react';
import { useTheme } from '../../loomwright/theme';
import ConsistencyChecker from '../../components/ConsistencyChecker';
import StoryAnalysisHub from '../../components/StoryAnalysisHub';
import chapterNavigationService from '../../services/chapterNavigationService';

const TABS = [
  { id: 'consistency', label: 'Consistency' },
  { id: 'analysis', label: 'Story analysis' },
];

export default function StoryAnalysisDrawer({ worldState, onJumpToChapter }) {
  const t = useTheme();
  const [tab, setTab] = useState('consistency');

  const actors = worldState?.actors || [];
  const books = worldState?.books || {};
  const itemBank = worldState?.itemBank || [];
  const skillBank = worldState?.skillBank || [];

  // Intercept any navigation the legacy components do, route via the
  // shared navigation service so the editor jumps correctly.
  const handleJump = (bookId, chapterId) => {
    chapterNavigationService.navigateToChapter?.(bookId, chapterId);
    onJumpToChapter?.(bookId, chapterId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '10px 16px',
          borderBottom: `1px solid ${t.rule}`,
          background: t.sidebar,
        }}
      >
        {TABS.map((x) => {
          const active = tab === x.id;
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => setTab(x.id)}
              style={{
                padding: '6px 12px',
                background: active ? t.paper : 'transparent',
                color: active ? t.ink : t.ink2,
                border: `1px solid ${active ? t.rule : 'transparent'}`,
                borderRadius: t.radius,
                fontFamily: t.mono,
                fontSize: 10,
                letterSpacing: 0.12,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {x.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'consistency' && (
          <ConsistencyChecker
            actors={actors}
            books={books}
            itemBank={itemBank}
            skillBank={skillBank}
            onClose={() => {}}
            onJumpToChapter={handleJump}
          />
        )}
        {tab === 'analysis' && (
          <StoryAnalysisHub
            actors={actors}
            books={books}
            itemBank={itemBank}
            skillBank={skillBank}
            onClose={() => {}}
            onJumpToChapter={handleJump}
          />
        )}
      </div>
    </div>
  );
}

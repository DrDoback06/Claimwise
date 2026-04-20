/**
 * WorkspaceMiniBrief - a 2-line ambient "what the Loom saw on this page"
 * strip that slots into the PageHeader of every workspace.
 *
 * Derives its message from cheap heuristics per surface so it always has
 * something to say even with no AI. Keeps the redesign's "ambient
 * co-author" feel without forcing an LLM round-trip.
 */

import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';

function computeMessage(surface, worldState) {
  const actors = worldState?.actors || [];
  const items = worldState?.itemBank || [];
  const skills = worldState?.skillBank || [];
  const plotThreads = worldState?.plotThreads || [];
  const places = worldState?.places || [];
  const factions = worldState?.factions || [];
  const books = Object.values(worldState?.books || {});
  const chapters = books[0]?.chapters || [];
  const lastCh = chapters[chapters.length - 1]?.id || 1;

  switch (surface) {
    case 'today':
      return `${actors.length} cast, ${items.length} items, ${chapters.length} chapters so far. The Loom is watching for drift.`;
    case 'write':
      return `${chapters.length} chapters / ${actors.length} cast in context. Select any passage to rewrite in-voice; right-click for synonyms.`;
    case 'cast': {
      if (actors.length === 0) return 'Cast is empty. Add a character to start noticing.';
      const silent = actors.find((a) => {
        let best = 0;
        chapters.forEach((c) => {
          const text = `${c.title || ''} ${c.summary || ''} ${c.script || ''}`.toLowerCase();
          if (a.name && text.includes(a.name.toLowerCase())) best = Math.max(best, c.id);
        });
        return lastCh - best >= 5;
      });
      if (silent) return `${silent.name} has been off-page for several chapters. Worth a beat?`;
      return `Every named character has appeared recently. Good rhythm.`;
    }
    case 'cast_detail':
      return `Every tab here is driven by the active chapter; switch chapters in Write to scrub this character's journey.`;
    case 'items_library': {
      const noTrack = items.filter((i) => !i.track || Object.keys(i.track || {}).length === 0).length;
      if (items.length === 0) return 'Items vault is empty. Create one, or accept Canon Weaver proposals.';
      if (noTrack > 0) return `${noTrack} of ${items.length} items have no chapter track yet. Weave them into a scene to populate.`;
      return `Every item has a chapter track. The life-matrix tab shows it all at once.`;
    }
    case 'skills_library':
      return `${skills.length} skill${skills.length === 1 ? '' : 's'} defined. Chapter-linked progression lights up the tree as characters unlock.`;
    case 'stats_library':
      return `Stat registry powers the per-chapter progression ring in Cast > Journey.`;
    case 'atlas': {
      if (places.length === 0) return 'Atlas is empty. Accept proposals from the sidebar, or drop a pin.';
      return `${places.length} place${places.length === 1 ? '' : 's'} on the map. Toggle Fog to see what your POV knows; use Travel to estimate journeys.`;
    }
    case 'world': {
      const withBack = items.filter((i) => (i.mentions || 0) > 0).length;
      return `${factions.length} faction${factions.length === 1 ? '' : 's'}, ${withBack} items with backlinks. Run a lore audit to surface drift.`;
    }
    case 'plot_timeline': {
      const open = plotThreads.filter((th) => th.status !== 'closed').length;
      return `${open} open thread${open === 1 ? '' : 's'} tracked. Insights tab flags dangling threads, density, and plants without payoff.`;
    }
    case 'voice_studio':
      return `Voice Studio scores the active chapter in real time on the Writer's Room banner. A/B compare in the Compare tab.`;
    case 'settings':
      return `Keys, data & history, dev tools. Your world data stays on-device until you back it up.`;
    default:
      return null;
  }
}

export default function WorkspaceMiniBrief({ surface, worldState }) {
  const t = useTheme();
  const message = useMemo(
    () => computeMessage(surface, worldState),
    [surface, worldState],
  );
  if (!message) return null;
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px',
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: 999,
        fontSize: 11,
        color: t.ink2,
        lineHeight: 1.3,
        maxWidth: 640,
      }}
    >
      <Sparkles size={11} color={t.accent} style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}

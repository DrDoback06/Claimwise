// Loomwright — Atlas panel composition (CODE-INSIGHT §5).
// Map canvas on top, edit-pane-below for the selected feature.

import React from 'react';
import PanelFrame from '../PanelFrame';
import MapCanvas from './MapCanvas';
import PlaceEditor from './PlaceEditor';
import RegionList from './RegionList';
import TimelineScrubber from '../../primitives/TimelineScrubber';
import SpecialistChat from '../../specialist/SpecialistChat';
import QueuePanel from '../../review-queue/QueuePanel';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useSelection } from '../../selection';
import { useStore } from '../../store';

export default function AtlasPanel({ onClose, onSummonRing, onWeave }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const regions = store.regions || [];
  const scrubberValue = sel.chapter || store.ui?.activeChapterId || store.book?.currentChapterId;

  return (
    <PanelFrame
      title="The world, charted"
      eyebrow="Atlas"
      accent={PANEL_ACCENT.atlas}
      panelId="atlas"
      onClose={onClose}
      width={460}>
      <QueuePanel domain="atlas" accent={PANEL_ACCENT.atlas} title="Atlas review queue" />
      <div style={{ height: 360, borderBottom: `1px solid ${t.rule}`, position: 'relative' }}>
        <MapCanvas onSummonRing={onSummonRing} />
      </div>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${t.rule}` }}>
        <TimelineScrubber
          label="Focus"
          value={scrubberValue}
          onChange={(chapterId) => select('chapter', chapterId)}
        />
      </div>
      {sel.place && <PlaceEditor onWeave={() => onWeave?.(sel.place)} />}
      {!sel.place && regions.length === 0 && (
        <div style={{
          padding: 30, textAlign: 'center',
          fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
          lineHeight: 1.5,
        }}>
          Click a pin to inspect, or right-click empty space to add a place.
          Use the Region tool to outline a kingdom, biome, or sea.
        </div>
      )}
      {!sel.place && regions.length > 0 && <RegionList />}
      <SpecialistChat domain="atlas" accent={PANEL_ACCENT.atlas} />
    </PanelFrame>
  );
}

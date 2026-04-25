// Loomwright — Atlas panel composition (plan §11–§12).

import React from 'react';
import PanelFrame from '../PanelFrame';
import MapCanvas from './MapCanvas';
import PlaceEditor from './PlaceEditor';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useSelection } from '../../selection';

export default function AtlasPanel({ onClose, onSummonRing, onWeave }) {
  const t = useTheme();
  const { sel } = useSelection();

  return (
    <PanelFrame
      title="The world, charted"
      eyebrow="Atlas"
      accent={PANEL_ACCENT.atlas}
      onClose={onClose}
      width={460}>
      <div style={{ height: 320, borderBottom: `1px solid ${t.rule}` }}>
        <MapCanvas onSummonRing={onSummonRing} />
      </div>
      {sel.place && <PlaceEditor onWeave={() => onWeave?.(sel.place)} />}
      {!sel.place && (
        <div style={{
          padding: 30, textAlign: 'center',
          fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic',
          lineHeight: 1.5,
        }}>
          Click a pin to inspect, or right-click empty space to add a place.
        </div>
      )}
    </PanelFrame>
  );
}

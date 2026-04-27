// Loomwright — risk band chip. Read-only visual marker for queue cards
// and timeline rows. Maps an internal band id ('high'|'normal'|...) to
// the writer-facing label (BLUE/GREEN/AMBER/RED) plus a colour dot.

import React from 'react';
import { useTheme } from '../theme';
import { riskLabelFor, RISK_DESCRIPTION } from '../ai/confidence';

export const RISK_COLOR = {
  BLUE: '#3a6fb1',
  GREEN: '#4a8b3c',
  AMBER: '#b8731c',
  RED: '#a83b32',
};

export default function RiskChip({ band, size = 'sm' }) {
  const t = useTheme();
  const label = riskLabelFor(band);
  const color = RISK_COLOR[label] || RISK_COLOR.GREEN;
  const description = RISK_DESCRIPTION[band] || '';
  const fz = size === 'xs' ? 8 : 9;
  const pad = size === 'xs' ? '1px 5px' : '1px 6px';

  return (
    <span title={description} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: pad, background: 'transparent',
      border: `1px solid ${color}`, borderRadius: 1,
      fontFamily: t.mono, fontSize: fz, color,
      letterSpacing: 0.16, textTransform: 'uppercase', fontWeight: 600,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: 999, background: color,
      }} />
      {label}
    </span>
  );
}

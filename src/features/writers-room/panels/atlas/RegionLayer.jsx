// Loomwright — Atlas Region polygons (CODE-INSIGHT §5).
// Renders persisted regions; while drafting a new polygon, renders the
// in-progress vertices and a closing dashed segment to the current cursor.

import React from 'react';
import { useStore } from '../../store';
import { useTheme } from '../../theme';

function polyPoints(poly) {
  return (poly || []).map(([x, y]) => `${x},${y}`).join(' ');
}

export default function RegionLayer({ drafting, cursor }) {
  const t = useTheme();
  const store = useStore();
  const regions = store.regions || [];

  return (
    <g>
      {regions.map(r => (
        <g key={r.id}>
          <polygon
            points={polyPoints(r.poly)}
            fill={r.color || t.accent2}
            fillOpacity={0.18}
            stroke={r.color || t.accent2}
            strokeWidth={1.2}
          />
          {r.poly?.length > 0 && (() => {
            const cx = r.poly.reduce((s, p) => s + p[0], 0) / r.poly.length;
            const cy = r.poly.reduce((s, p) => s + p[1], 0) / r.poly.length;
            return (
              <text x={cx} y={cy} fontSize={11} fontFamily={t.display}
                fill={t.ink2} textAnchor="middle">{r.name}</text>
            );
          })()}
        </g>
      ))}
      {drafting?.poly?.length > 0 && (
        <g>
          <polygon
            points={polyPoints(drafting.poly)}
            fill={t.accent}
            fillOpacity={0.10}
            stroke={t.accent}
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />
          {cursor && drafting.poly.length > 0 && (
            <line
              x1={drafting.poly[drafting.poly.length - 1][0]}
              y1={drafting.poly[drafting.poly.length - 1][1]}
              x2={cursor.x} y2={cursor.y}
              stroke={t.accent} strokeWidth={1} strokeDasharray="2 2" opacity={0.6}
            />
          )}
          {drafting.poly.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={3} fill={t.accent} />
          ))}
        </g>
      )}
    </g>
  );
}

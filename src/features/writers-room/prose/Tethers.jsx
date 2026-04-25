// Loomwright — curved SVG tethers from margin noticings to source paragraphs.

import React from 'react';
import { useTheme } from '../theme';

export default function Tethers({ tethers, hostRef }) {
  const t = useTheme();
  const [, force] = React.useReducer(x => x + 1, 0);

  // Recompute on resize.
  React.useEffect(() => {
    const ro = new ResizeObserver(() => force());
    if (hostRef?.current) ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, [hostRef]);

  if (!hostRef?.current || !tethers?.length) return null;
  const hostRect = hostRef.current.getBoundingClientRect();

  return (
    <svg style={{
      position: 'absolute', top: 0, left: 0,
      width: hostRect.width, height: hostRect.height,
      pointerEvents: 'none', zIndex: 2,
    }}>
      {tethers.map(({ id, paragraphEl, cardEl, color, hover }) => {
        if (!paragraphEl || !cardEl) return null;
        const a = paragraphEl.getBoundingClientRect();
        const b = cardEl.getBoundingClientRect();
        // Anchor tether from right-edge of paragraph at vertical-mid to left-edge of card at vertical-mid.
        const ax = a.right - hostRect.left;
        const ay = a.top + a.height / 2 - hostRect.top;
        const bx = b.left - hostRect.left;
        const by = b.top + b.height / 2 - hostRect.top;
        const cx = (ax + bx) / 2;
        return (
          <path key={id}
            d={`M ${ax} ${ay} Q ${cx} ${ay} ${cx} ${(ay + by) / 2} T ${bx} ${by}`}
            fill="none"
            stroke={color || t.rule}
            strokeWidth={hover ? 1.4 : 0.8}
            opacity={hover ? 1 : 0.5}
          />
        );
      })}
    </svg>
  );
}

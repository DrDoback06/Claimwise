// Loomwright — SummoningRing radial menu (plan §13).

import React from 'react';
import { useTheme } from '../theme';
import Icon from '../entities/Icon';
import { RADIAL_CONTEXTS } from './contexts';

const RADIUS = 90;

export default function SummoningRing({ x, y, context, onAction, onClose }) {
  const t = useTheme();
  const [subContext, setSubContext] = React.useState(null);
  const ringContext = subContext || context;
  const spokes = RADIAL_CONTEXTS[ringContext] || [];

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (subContext) setSubContext(null);
        else onClose?.();
        return;
      }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= spokes.length) {
        const sp = spokes[n - 1];
        handlePick(sp);
      }
    };
    const t = setTimeout(() => window.addEventListener('keydown', onKey), 0);
    const onClick = (e) => {
      // close on outside click
      if (!e.target.closest('[data-lw-radial]')) onClose?.();
    };
    const tc = setTimeout(() => window.addEventListener('click', onClick), 0);
    return () => {
      clearTimeout(t); clearTimeout(tc);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  }, [spokes, onClose, subContext]);

  const handlePick = (sp) => {
    if (sp.subRadial) { setSubContext(sp.subRadial); return; }
    onAction?.({ context: ringContext, spokeId: sp.id });
    onClose?.();
  };

  return (
    <div data-lw-radial style={{
      position: 'fixed', left: x, top: y, width: 0, height: 0, zIndex: 2000,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', left: -RADIUS - 30, top: -RADIUS - 30,
        width: (RADIUS + 30) * 2, height: (RADIUS + 30) * 2,
        pointerEvents: 'auto',
      }}>
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 60, height: 60, borderRadius: '50%',
          background: t.paper, border: `1px solid ${t.rule}`,
          display: 'grid', placeItems: 'center',
          fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer',
          animation: 'lw-pop-in 260ms ease',
        }} onClick={() => subContext ? setSubContext(null) : onClose?.()}>
          {subContext ? '↩' : 'esc'}
        </div>
        {spokes.map((sp, i) => {
          const angle = (i / spokes.length) * Math.PI * 2 - Math.PI / 2;
          const cx = Math.cos(angle) * RADIUS;
          const cy = Math.sin(angle) * RADIUS;
          return (
            <button key={sp.id} onClick={() => handlePick(sp)} style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: `translate(${cx - 22}px, ${cy - 22}px)`,
              width: 44, height: 44, borderRadius: '50%',
              background: t.paper2, border: `1px solid ${t.rule}`,
              display: 'grid', placeItems: 'center',
              cursor: 'pointer', color: t.ink2,
              animation: `lw-pop-in 260ms ease ${i * 20}ms backwards`,
            }} title={`${i + 1}. ${sp.label}`}>
              <Icon name={sp.icon} size={16} color={t.ink2} />
              <span style={{
                position: 'absolute', left: cx > 0 ? 48 : -100, top: 12,
                width: 96, fontFamily: t.mono, fontSize: 9, color: t.ink2,
                letterSpacing: 0.12, textTransform: 'uppercase',
                textAlign: cx > 0 ? 'left' : 'right',
                pointerEvents: 'none',
              }}>{sp.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

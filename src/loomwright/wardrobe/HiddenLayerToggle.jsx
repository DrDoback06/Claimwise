/**
 * HiddenLayerToggle — bank of toggles for slot visibility groups.
 * Lets the user hide/show 'subtle' (worn-but-not-seen) and 'secret' (hidden) slots
 * so the paper doll can show just what's visible to other characters, or
 * everything the author knows.
 */

import React from 'react';
import { useTheme } from '../theme';
import { SLOT_GROUPS } from './schema';

export default function HiddenLayerToggle({ value, onChange, style }) {
  const t = useTheme();
  const has = (id) => value?.has(id);
  const toggle = (id) => {
    const next = new Set(value || []);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange?.(next);
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: t.mono,
          fontSize: 9,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
          color: t.ink3,
          marginRight: 4,
        }}
      >
        Layers
      </span>
      {SLOT_GROUPS.map((g) => {
        const active = has(g.id);
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.id)}
            title={g.description}
            style={{
              padding: '3px 8px',
              background: active ? t.accentSoft : 'transparent',
              color: active ? t.accent : t.ink2,
              border: `1px solid ${active ? t.accent : t.rule}`,
              borderRadius: 2,
              fontFamily: t.mono,
              fontSize: 9,
              letterSpacing: 0.12,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {g.label}
          </button>
        );
      })}
    </div>
  );
}

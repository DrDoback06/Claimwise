/**
 * CustomSlotManager — lets the user add / remove custom slots for a particular
 * actor. Custom slots are persisted on actor.customSlots and render on the
 * paper doll alongside the built-in SLOT_DEFS.
 */

import React, { useState } from 'react';
import { useTheme } from '../theme';
import Icon from '../primitives/Icon';

const GROUPS = [
  { id: 'worn',   label: 'Visible'      },
  { id: 'pack',   label: 'Pack'         },
  { id: 'subtle', label: 'Worn-not-seen' },
  { id: 'secret', label: 'Hidden'       },
  { id: 'custom', label: 'Custom'       },
];

export default function CustomSlotManager({ actor, onChange }) {
  const t = useTheme();
  const customs = actor?.customSlots || [];
  const [label, setLabel] = useState('');
  const [group, setGroup] = useState('custom');
  const [icon, setIcon] = useState('\u25A1');

  const add = () => {
    if (!label.trim()) return;
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const position = customs.length;
    // Lay out custom slots in a column on the right edge
    const y = 18 + (position % 10) * 7;
    const newSlot = { id, label: label.trim(), group, pos: [90, y], icon, _custom: true };
    onChange?.([...customs, newSlot]);
    setLabel('');
  };

  const remove = (id) => {
    onChange?.(customs.filter((s) => s.id !== id));
  };

  return (
    <div
      style={{
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        padding: 12,
      }}
    >
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 9,
          color: t.accent,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Custom slots
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {customs.length === 0 ? (
          <span style={{ color: t.ink3, fontSize: 12 }}>
            None yet. Add one below \u2014 useful for scabbards, banners, pouches, familiars\u2026
          </span>
        ) : (
          customs.map((s) => (
            <span
              key={s.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                background: t.paper2,
                border: `1px solid ${t.rule}`,
                borderRadius: 2,
                fontFamily: t.mono,
                fontSize: 10,
                color: t.ink,
              }}
            >
              <span>{s.icon}</span>
              {s.label}
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label={`Remove ${s.label}`}
                style={{
                  marginLeft: 4,
                  background: 'transparent',
                  border: 'none',
                  color: t.ink3,
                  cursor: 'pointer',
                  fontSize: 11,
                  lineHeight: 1,
                }}
              >
                \u00d7
              </button>
            </span>
          ))
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value.slice(0, 2))}
          placeholder="\u2726"
          style={{
            width: 44,
            textAlign: 'center',
            padding: '6px 8px',
            background: t.paper2,
            color: t.ink,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            fontFamily: t.display,
            fontSize: 14,
          }}
        />
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Slot name"
          onKeyDown={(e) => e.key === 'Enter' && add()}
          style={{
            flex: 1,
            minWidth: 120,
            padding: '6px 10px',
            background: t.paper2,
            color: t.ink,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            fontSize: 12,
            fontFamily: t.font,
          }}
        />
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          style={{
            padding: '6px 8px',
            background: t.paper2,
            color: t.ink,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            fontSize: 11,
            fontFamily: t.mono,
          }}
        >
          {GROUPS.map((g) => (
            <option key={g.id} value={g.id}>{g.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!label.trim()}
          style={{
            padding: '6px 10px',
            background: t.accent,
            color: t.onAccent,
            border: `1px solid ${t.accent}`,
            borderRadius: t.radius,
            fontFamily: t.mono,
            fontSize: 10,
            letterSpacing: 0.12,
            textTransform: 'uppercase',
            cursor: label.trim() ? 'pointer' : 'not-allowed',
            opacity: label.trim() ? 1 : 0.5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Icon name="plus" size={10} color={t.onAccent} /> Add
        </button>
      </div>
    </div>
  );
}

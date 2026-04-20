/**
 * CharacterTabs — Profile / Inventory / Relationships wrapper that mounts
 * inside the existing character page. The Profile tab just passes children
 * through (the existing App.js character layout renders there). Inventory
 * mounts the CharacterWardrobe. Relationships renders the existing hub.
 */

import React, { useState } from 'react';
import { useTheme } from '../theme';
import LoomwrightShell from '../LoomwrightShell';

const TABS = [
  { id: 'profile',       label: 'Profile'       },
  { id: 'inventory',     label: 'Inventory'     },
  { id: 'relationships', label: 'Relationships' },
];

function TabBar({ value, onChange }) {
  const t = useTheme();
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 2,
        padding: '0 12px',
        borderBottom: `1px solid ${t.rule}`,
        background: t.bg,
      }}
    >
      {TABS.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              color: active ? t.ink : t.ink3,
              borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
              cursor: 'pointer',
              fontFamily: t.mono,
              fontSize: 10,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Bar-only variant — host renders the actual tab bodies conditionally because
 * the Profile tab's content is the existing Claimwise character layout in App.js.
 */
export function CharacterTabBar({ value, onChange }) {
  return (
    <LoomwrightShell scrollable={false} pad={false}>
      <TabBar value={value} onChange={onChange} />
    </LoomwrightShell>
  );
}

export default function CharacterTabs({ profile, inventory, relationships }) {
  const [tab, setTab] = useState('profile');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <CharacterTabBar value={tab} onChange={setTab} />
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {tab === 'profile' && profile}
        {tab === 'inventory' && inventory}
        {tab === 'relationships' && relationships}
      </div>
    </div>
  );
}

// Loomwright — LeftRail (plan §6).

import React from 'react';
import { useTheme, ThemeToggle, PANEL_ACCENT } from './theme';
import Icon from './entities/Icon';
import { useStore } from './store';

const PANELS = [
  { id: 'atlas',      label: 'Atlas',      icon: 'map',     accent: PANEL_ACCENT.atlas },
  { id: 'cast',       label: 'Cast',       icon: 'users',   accent: PANEL_ACCENT.cast },
  { id: 'voice',      label: 'Voice',      icon: 'volume',  accent: PANEL_ACCENT.voice },
  { id: 'quests',     label: 'Quests',     icon: 'flag',    accent: PANEL_ACCENT.threads },
  { id: 'items',      label: 'Items',      icon: 'bag',     accent: PANEL_ACCENT.items },
  { id: 'skills',     label: 'Skills',     icon: 'sparkle', accent: PANEL_ACCENT.items },
  { id: 'language',   label: 'Language',   icon: 'pen',     accent: PANEL_ACCENT.language },
  { id: 'tangle',     label: 'Tangle',     icon: 'tangle',  accent: PANEL_ACCENT.tangle },
  { id: 'continuity', label: 'Continuity', icon: 'flag',    accent: PANEL_ACCENT.atlas },
  { id: 'interview',  label: 'Interview',  icon: 'chat',    accent: PANEL_ACCENT.cast },
  { id: 'groupchat',  label: 'Round table', icon: 'users',  accent: PANEL_ACCENT.cast },
];

export default function LeftRail({ openPanels, onTogglePanel, onOpenPalette, onOpenWeaver, onOpenAid }) {
  const t = useTheme();
  return (
    <div className="lw-leftrail" style={{
      background: t.sidebar, borderRight: `1px solid ${t.rule}`,
    }}>
      <div title="Loomwright" style={{
        width: 36, height: 36, marginBottom: 6,
        display: 'grid', placeItems: 'center',
        fontFamily: t.display, fontSize: 18, color: t.accent, fontWeight: 600,
      }}>L</div>

      <button
        title="Writing aid (⌘\\)"
        onClick={onOpenAid}
        className="lw-rail-btn"
        style={{
          background: PANEL_ACCENT.loom, color: t.onAccent,
          border: 'none', borderRadius: 2, marginBottom: 4,
        }}>
        <Icon name="sparkle" size={16} color={t.onAccent} />
      </button>
      <button
        title="Weave noticings (⌘J)"
        onClick={onOpenWeaver}
        className="lw-rail-btn"
        style={{ borderColor: t.rule, color: t.ink2, marginBottom: 4 }}>
        <Icon name="seed" size={16} color={t.ink2} />
      </button>

      <button
        title="Command (⌘K)"
        onClick={onOpenPalette}
        className="lw-rail-btn"
        style={{ borderColor: t.rule, color: t.ink2 }}>
        <Icon name="search" size={16} color={t.ink2} />
      </button>

      <div style={{ width: 24, height: 1, background: t.rule, margin: '6px 0' }} />

      {PANELS.map(p => {
        const active = openPanels.includes(p.id);
        return (
          <button
            key={p.id}
            title={p.label}
            onClick={() => onTogglePanel(p.id)}
            className={'lw-rail-btn' + (active ? ' active' : '')}
            style={{
              borderColor: active ? p.accent : 'transparent',
              color: active ? p.accent : t.ink2,
            }}>
            <Icon name={p.icon} size={16} color={active ? p.accent : t.ink2} />
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      <ThemeToggle />
    </div>
  );
}

export { PANELS };

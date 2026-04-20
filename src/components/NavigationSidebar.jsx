/**
 * NavigationSidebar — Loomwright 5-group verb nav.
 *
 * Groups: Today • Write • Track • Explore • Settings.
 * Themed with useTheme(); no Tailwind slate chrome.
 */

import React, { useState, useEffect } from 'react';
import {
  Home, PenTool, Users, Map, Settings as SettingsIcon,
  Briefcase, Zap, BarChart2, Mic, Compass, BookMarked, GitBranch, Feather,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../loomwright/theme';

const NAV = [
  {
    id: 'today',
    label: 'Today',
    icon: Home,
    tabs: [{ id: 'today', label: 'Today', icon: Home, tooltip: 'Morning brief + daily sparks' }],
  },
  {
    id: 'write',
    label: 'Write',
    icon: PenTool,
    tabs: [{ id: 'write', label: "Writer's Room", icon: Feather, tooltip: 'Drafting + Canon Weaver + prose tools' }],
  },
  {
    id: 'track',
    label: 'Track',
    icon: Users,
    tabs: [
      { id: 'cast', label: 'Cast', icon: Users, tooltip: 'Characters and their full arcs' },
      { id: 'items_library', label: 'Items Library', icon: Briefcase, tooltip: 'Every item, equipment and artifact' },
      { id: 'skills_library', label: 'Skills Library', icon: Zap, tooltip: 'Skills, abilities and skill tree' },
      { id: 'stats_library', label: 'Stats Library', icon: BarChart2, tooltip: 'Stat registry and analysis' },
      { id: 'voice_studio', label: 'Voice Studio', icon: Mic, tooltip: 'Tune and assign writing voices' },
    ],
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: Map,
    tabs: [
      { id: 'atlas', label: 'Atlas', icon: Compass, tooltip: 'Regional map, floorplans and places' },
      { id: 'world', label: 'World', icon: BookMarked, tooltip: 'Wiki, lore, factions and mind map' },
      { id: 'plot_timeline', label: 'Plot & Timeline', icon: GitBranch, tooltip: 'Beats, threads, quests, timeline and narrative graph' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    tabs: [{ id: 'settings', label: 'Settings', icon: SettingsIcon, tooltip: 'Keys, providers, data and preferences' }],
  },
];

export default function NavigationSidebar({ activeTab, setActiveTab, isCollapsed = false }) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(() => {
    try {
      const raw = localStorage.getItem('lw_nav_expanded');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return NAV.map((g) => g.id);
  });

  useEffect(() => {
    try { localStorage.setItem('lw_nav_expanded', JSON.stringify(expanded)); } catch { /* ignore */ }
  }, [expanded]);

  const toggle = (id) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <nav
      style={{
        width: isCollapsed ? 64 : 224,
        flexShrink: 0,
        background: t.sidebar,
        borderRight: `1px solid ${t.rule}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 180ms ease',
      }}
    >
      {/* Brand */}
      <div style={{ padding: '16px 14px', borderBottom: `1px solid ${t.rule}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: t.radius,
              background: t.accent, color: t.onAccent,
              display: 'grid', placeItems: 'center',
              fontFamily: t.display, fontWeight: 600, fontSize: 14, lineHeight: 1,
            }}
          >
            Lw
          </div>
          {!isCollapsed && (
            <div>
              <div style={{ fontFamily: t.display, fontSize: 15, fontWeight: 500, color: t.ink, lineHeight: 1 }}>Loomwright</div>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.accent, letterSpacing: 0.18, textTransform: 'uppercase', marginTop: 4 }}>
                Story Studio
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
        {NAV.map((group) => {
          const Icon = group.icon;
          const hasActive = group.tabs.some((tab) => tab.id === activeTab);
          const isExpanded = expanded.includes(group.id);
          const single = group.tabs.length === 1;

          if (single) {
            const tab = group.tabs[0];
            const active = activeTab === tab.id;
            return (
              <button
                key={group.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.tooltip}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%',
                  padding: '8px 10px',
                  margin: '2px 0',
                  background: active ? t.accentSoft : 'transparent',
                  color: active ? t.ink : t.ink2,
                  border: `1px solid ${active ? t.accent : 'transparent'}`,
                  borderRadius: t.radius,
                  cursor: 'pointer',
                  fontFamily: t.font, fontSize: 12, textAlign: 'left',
                }}
              >
                <Icon size={15} />
                {!isCollapsed && <span style={{ fontWeight: active ? 600 : 500 }}>{group.label}</span>}
              </button>
            );
          }

          return (
            <div key={group.id} style={{ marginTop: 6 }}>
              <button
                onClick={() => toggle(group.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%',
                  padding: '6px 10px',
                  background: 'transparent',
                  color: hasActive ? t.accent : t.ink3,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: t.mono, fontSize: 9, letterSpacing: 0.18, textTransform: 'uppercase',
                  textAlign: 'left',
                }}
              >
                <Icon size={13} />
                {!isCollapsed && (
                  <>
                    <span style={{ flex: 1 }}>{group.label}</span>
                    <ChevronRight
                      size={12}
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 120ms' }}
                    />
                  </>
                )}
              </button>
              {(isExpanded || isCollapsed) && (
                <div style={{ paddingLeft: isCollapsed ? 0 : 8, marginTop: 2 }}>
                  {group.tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    const active = activeTab === tab.id ||
                      (tab.id === 'cast' && activeTab === 'cast_detail');
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        title={tab.tooltip}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%',
                          padding: '7px 10px',
                          margin: '1px 0',
                          background: active ? t.accentSoft : 'transparent',
                          color: active ? t.ink : t.ink2,
                          border: `1px solid ${active ? t.accent : 'transparent'}`,
                          borderRadius: t.radius,
                          cursor: 'pointer',
                          fontFamily: t.font, fontSize: 12, textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = t.paper; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <TabIcon size={14} />
                        {!isCollapsed && <span style={{ fontWeight: active ? 600 : 500 }}>{tab.label}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '10px 14px', borderTop: `1px solid ${t.rule}`, fontFamily: t.mono, fontSize: 9, color: t.ink3, textAlign: 'center', letterSpacing: 0.14 }}>
        LOOMWRIGHT · v1.0
      </div>
    </nav>
  );
}

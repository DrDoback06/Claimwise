import React, { useState, useEffect } from 'react';
import { 
  Users, BarChart2, Zap, Briefcase, PenTool, BookOpen, GitBranch, 
  BookMarked, Network, Activity, Clock, TrendingUp, AlertTriangle, 
  History, Search, Archive, RefreshCw, Settings, FileText,
  ChevronRight, ChevronDown, Layers, Map, Brain, Link, Shield,
  Home, Sparkles, Package, Eye, Mic, Compass, Feather, Sun, Coffee,
  Smartphone, BookOpenCheck
} from 'lucide-react';
import Tooltip from './Tooltip';

/**
 * Navigation configuration with grouped categories
 */
const NAVIGATION_CONFIG = [
  {
    id: 'creation',
    label: 'Creation',
    icon: Layers,
    tooltip: 'Create and manage game entities - characters, items, skills, and stats',
    items: [
      { id: 'personnel', label: 'Personnel', icon: Users, tooltip: 'Manage characters, their stats, equipment, and story roles', shortcut: 'Alt+1' },
      { id: 'items', label: 'Item Vault', icon: Briefcase, tooltip: 'Create and manage items with stats, skills, and quests', shortcut: 'Alt+2' },
      { id: 'inventory', label: 'Inventory', icon: Package, tooltip: 'Diablo-style equipment and inventory management with paper doll view' },
      { id: 'skills', label: 'Skill Bank', icon: Zap, tooltip: 'Define skills, abilities, and passive effects', shortcut: 'Alt+3' },
      { id: 'stats', label: 'Stat Registry', icon: BarChart2, tooltip: 'Configure core and custom stats for your game system', shortcut: 'Alt+4' },
    ]
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: PenTool,
    tooltip: 'Write your story with AI assistance and automatic entity extraction',
    items: [
      { id: 'story', label: "Writer's Room", icon: PenTool, tooltip: 'Write chapters with AI assistance, entity extraction, and consistency checking', shortcut: 'Alt+5' },
      { id: 'bible', label: 'Series Bible', icon: BookOpen, tooltip: 'Organize books, chapters, and maintain your story structure', shortcut: 'Alt+6' },
      { id: 'manuscript', label: 'Manuscript Intelligence', icon: FileText, tooltip: 'Extract entities, analyze text, and auto-populate your world', shortcut: 'Alt+7' },
      { id: 'speedreader', label: 'Speed Reader', icon: Eye, tooltip: 'Read at high speed with word-by-word display and centered positioning' },
    ]
  },
  {
    id: 'visualization',
    label: 'Visualization',
    icon: Map,
    tooltip: 'Visual maps and timelines to track your story world',
    items: [
      { id: 'plottimeline', label: 'Plot Timeline', icon: TrendingUp, tooltip: 'Visual plot beat tracker with chapter assignments' },
      { id: 'mindmap', label: 'Story Mind Map', icon: Brain, tooltip: 'Visual web showing how all story elements connect', shortcut: 'Alt+8' },
      { id: 'ukmap', label: 'UK Map', icon: Activity, tooltip: 'Geographic visualization of locations and events', shortcut: 'Alt+9' },
      { id: 'timeline', label: 'Master Timeline', icon: Clock, tooltip: 'Chronological view of all story events', shortcut: 'Alt+0' },
      { id: 'characterarcs', label: 'Character Arcs', icon: TrendingUp, tooltip: 'Track character development and emotional journeys' },
      { id: 'skilltree', label: 'Skill Tree Visual', icon: GitBranch, tooltip: 'Interactive skill tree visualization' },
    ]
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: Shield,
    tooltip: 'Analyze relationships, plot threads, and check for inconsistencies',
    items: [
      { id: 'relationships', label: 'Relationships', icon: Link, tooltip: 'Track character relationships and dynamics' },
      { id: 'plotthreads', label: 'Plot & Quests', icon: BookMarked, tooltip: 'Plot threads, quest tracking, and story beats' },
      { id: 'worldlore', label: 'World / Lore', icon: Shield, tooltip: 'World-building lore entries and factions' },
      { id: 'consistency', label: 'Story Analysis', icon: Shield, tooltip: 'Consistency checking and plot thread tracking' },
      { id: 'wiki', label: 'Wiki Manager', icon: BookMarked, tooltip: 'Comprehensive encyclopedia of your story world' },
      { id: 'storymap', label: 'Story Map', icon: Network, tooltip: 'Narrative structure and scene connections' },
    ]
  },
  {
    id: 'loomwright',
    label: 'Loomwright',
    icon: Feather,
    tooltip: 'Loomwright redesign surface — Canon Weaver, Voice Studio, Atlas AI, Language Workbench, Interview Mode, and more',
    items: [
      { id: 'lw_weaver',    label: 'Canon Weaver',      icon: Sparkles,    tooltip: 'Capture an idea and let AI propose changes across world, cast, plot, timeline, atlas, and chapters' },
      { id: 'lw_voice',     label: 'Voice Studio',      icon: Mic,         tooltip: 'Tune, A/B compare, teach, and assign writing voice profiles to chapters' },
      { id: 'lw_atlas',     label: 'Atlas AI',          icon: Compass,     tooltip: 'Regional map and floorplan view with chapter-linked places' },
      { id: 'lw_language',  label: 'Language Workbench',icon: FileText,    tooltip: 'Inline check, thesaurus, rewrite, and readability metrics for your manuscript' },
      { id: 'lw_interview', label: 'Interview Mode',    icon: Users,       tooltip: 'Solo and group chat with your characters, with prompt deck and saved quotes' },
      { id: 'lw_spark',     label: 'Daily Spark',       icon: Zap,         tooltip: 'Typed editorial sparks: contradictions, voice drift, discoveries, what-ifs' },
      { id: 'lw_brief',     label: 'Morning Brief',     icon: Coffee,      tooltip: 'Start-of-day summary of noticed/worry/delight items' },
      { id: 'lw_providers', label: 'AI Providers',      icon: Settings,    tooltip: 'Provider list, per-task routing, usage and budget' },
      { id: 'lw_mobile',    label: 'Mobile Preview',    icon: Smartphone,  tooltip: 'Mobile shells: Today, Writing, Capture (Capacitor-ready)' },
      { id: 'lw_docs',      label: 'Design & Docs',     icon: BookOpenCheck, tooltip: 'IA spec, diagrams, aesthetic directions, enhancement roadmap' },
    ]
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Settings,
    tooltip: 'Search, backup, sync, and application settings',
    items: [
      { id: 'storysetup', label: 'Story Setup', icon: Sparkles, tooltip: 'Edit your story profile, style, characters, and world rules from the wizard' },
      { id: 'search', label: 'Search & Filter', icon: Search, tooltip: 'Find anything across your entire story world', shortcut: 'Ctrl+K' },
      { id: 'versioncontrol', label: 'Version Control', icon: History, tooltip: 'Track changes and restore previous versions' },
      { id: 'backup', label: 'Backup Manager', icon: Archive, tooltip: 'Export and import your story data' },
      { id: 'sync', label: 'Sync Manager', icon: RefreshCw, tooltip: 'Synchronize across devices (requires cloud setup)' },
      { id: 'settings', label: 'Settings', icon: Settings, tooltip: 'API keys, preferences, and application configuration' },
    ]
  }
];

/**
 * NavigationSidebar - Grouped, collapsible navigation with contextual tooltips
 */
const NavigationSidebar = ({ activeTab, setActiveTab, isCollapsed = false }) => {
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // Load from localStorage or default to all expanded
    const saved = localStorage.getItem('nav_expanded_groups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return NAVIGATION_CONFIG.map(g => g.id);
      }
    }
    return NAVIGATION_CONFIG.map(g => g.id);
  });

  // Recently accessed items (last 5-10)
  const [recentlyAccessed, setRecentlyAccessed] = useState(() => {
    const saved = localStorage.getItem('nav_recently_accessed');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean up any corrupted data - remove icon property if it exists (can't be serialized)
        return parsed.map(item => {
          const { icon, ...cleanItem } = item;
          return cleanItem;
        });
      } catch {
        // If parsing fails, clear corrupted data
        localStorage.removeItem('nav_recently_accessed');
        return [];
      }
    }
    return [];
  });

  // Track tab access
  useEffect(() => {
    if (activeTab && activeTab !== 'home') {
      const item = {
        id: activeTab,
        label: NAVIGATION_CONFIG
          .flatMap(g => g.items)
          .find(i => i.id === activeTab)?.label || activeTab,
        // Don't store icon - it can't be serialized. We'll look it up when rendering.
        accessedAt: Date.now()
      };
      
      setRecentlyAccessed(prev => {
        const filtered = prev.filter(i => i.id !== item.id);
        const updated = [item, ...filtered].slice(0, 10); // Keep last 10
        localStorage.setItem('nav_recently_accessed', JSON.stringify(updated));
        return updated;
      });
    }
  }, [activeTab]);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('nav_expanded_groups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Find which group contains the active tab
  const activeGroup = NAVIGATION_CONFIG.find(group => 
    group.items.some(item => item.id === activeTab)
  );

  return (
    <nav className={`
      bg-gradient-to-b from-[#0f1419] to-[#1a1f26] 
      border-r border-emerald-500/10 
      flex flex-col overflow-y-auto overflow-x-hidden
      transition-all duration-300
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Logo/Brand */}
      <div className="p-4 border-b border-emerald-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">GRIMGUFF</div>
              <div className="text-[10px] text-emerald-400 font-mono">TRACKER</div>
            </div>
          )}
        </div>
      </div>

      {/* Home Button */}
      <div className="px-2 py-2">
        <Tooltip
          content="Your story dashboard - current chapter, progress, and quick actions"
          shortcut="Alt+H"
          position="right"
        >
          <button
            onClick={() => setActiveTab('home')}
            className={`
              w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
              transition-all duration-200
              ${activeTab === 'home'
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }
            `}
          >
            <Home className={`w-5 h-5 shrink-0 ${activeTab === 'home' ? 'animate-pulse' : ''}`} />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left text-sm font-bold">
                  Home
                </span>
                {activeTab === 'home' && (
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </>
            )}
          </button>
        </Tooltip>
      </div>

      {/* Divider */}
      <div className="mx-4 border-b border-slate-700/50 mb-2" />

      {/* Navigation Groups */}
      <div className="flex-1 py-2 space-y-1">
        {NAVIGATION_CONFIG.map(group => {
          const isExpanded = expandedGroups.includes(group.id);
          const hasActiveItem = group.items.some(item => item.id === activeTab);
          const GroupIcon = group.icon;

          return (
            <div key={group.id} className="px-2">
              {/* Group Header */}
              <Tooltip
                content={group.tooltip}
                position="right"
                disabled={!isCollapsed}
              >
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg
                    transition-all duration-200
                    ${hasActiveItem 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }
                  `}
                >
                  <GroupIcon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
                        {group.label}
                      </span>
                      <ChevronRight 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`} 
                      />
                    </>
                  )}
                </button>
              </Tooltip>

              {/* Group Items */}
              {(isExpanded || isCollapsed) && (
                <div className={`
                  mt-1 space-y-0.5
                  ${isCollapsed ? '' : 'ml-2 pl-2 border-l border-slate-700/50'}
                `}>
                  {group.items.map(item => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <Tooltip
                        key={item.id}
                        content={item.tooltip}
                        shortcut={item.shortcut}
                        position="right"
                      >
                        <button
                          onClick={() => setActiveTab(item.id)}
                          className={`
                            w-full flex items-center gap-2 px-3 py-2 rounded-lg
                            transition-all duration-200
                            ${isActive 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                            }
                          `}
                        >
                          <ItemIcon className={`w-4 h-4 shrink-0 ${isActive ? 'animate-pulse' : ''}`} />
                          {!isCollapsed && (
                            <span className="flex-1 text-left text-sm font-medium truncate">
                              {item.label}
                            </span>
                          )}
                          {isActive && !isCollapsed && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          )}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recently Accessed Section */}
      {!isCollapsed && recentlyAccessed.length > 0 && (
        <>
          <div className="mx-4 border-b border-slate-700/50 my-2" />
          <div className="px-2 py-2">
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Recently Accessed
            </div>
            <div className="space-y-0.5">
              {recentlyAccessed.slice(0, 5).map(item => {
                // Look up icon from NAVIGATION_CONFIG since it can't be stored in localStorage
                const navItem = NAVIGATION_CONFIG
                  .flatMap(g => g.items)
                  .find(i => i.id === item.id);
                // Ensure ItemIcon is a valid React component, not an object
                const ItemIcon = (navItem?.icon && typeof navItem.icon === 'function') 
                  ? navItem.icon 
                  : FileText;
                const isActive = activeTab === item.id;
                return (
                  <Tooltip
                    key={item.id}
                    content={`Last accessed ${new Date(item.accessedAt).toLocaleTimeString()}`}
                    position="right"
                  >
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-1.5 rounded-lg
                        transition-all duration-200 text-xs
                        ${isActive 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
                        }
                      `}
                    >
                      <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-emerald-500/10">
          <div className="text-[10px] text-slate-500 text-center font-mono">
            v22.0 // OMNISCIENCE
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationSidebar;

import React, { useState } from 'react';
import { 
  X, Check, Clock, Users, Briefcase, Zap, MapPin, Heart, Target, 
  BookOpen, FileText, GitBranch, TrendingUp, CheckCircle, XCircle,
  ChevronDown, ChevronRight, AlertCircle, Eye, EyeOff
} from 'lucide-react';

/**
 * Integration Preview Modal
 * Shows all proposed updates grouped by system before applying
 */
const IntegrationPreviewModal = ({ 
  preview, 
  onApply, 
  onClose, 
  onTogglePlotThread 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    timeline: true,
    wiki: true,
    characterArcs: false,
    mindMap: false,
    ukMap: false,
    plotThreads: true,
    relationships: false
  });

  const [enabledSystems, setEnabledSystems] = useState({
    timeline: true,
    wiki: true,
    characterArcs: true,
    mindMap: true,
    ukMap: true,
    plotThreads: true,
    relationships: true
  });

  // Individual item toggles
  const [excludedItems, setExcludedItems] = useState(new Set());

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSystem = (system) => {
    setEnabledSystems(prev => ({
      ...prev,
      [system]: !prev[system]
    }));
  };

  const toggleItem = (itemId) => {
    setExcludedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleAllInSection = (items, section) => {
    const itemIds = items.map(i => `${section}-${i.id || items.indexOf(i)}`);
    const allExcluded = itemIds.every(id => excludedItems.has(id));
    
    setExcludedItems(prev => {
      const newSet = new Set(prev);
      itemIds.forEach(id => {
        if (allExcluded) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      });
      return newSet;
    });
  };

  const handleApply = () => {
    const options = {
      skipTimeline: !enabledSystems.timeline,
      skipWiki: !enabledSystems.wiki,
      skipCharacterArcs: !enabledSystems.characterArcs,
      skipMindMap: !enabledSystems.mindMap,
      skipUKMap: !enabledSystems.ukMap,
      skipPlotThreads: !enabledSystems.plotThreads,
      skipRelationships: !enabledSystems.relationships,
      excludedItems: Array.from(excludedItems)
    };
    onApply(options);
  };

  const getEnabledCount = (items, section) => {
    return items.filter((_, idx) => !excludedItems.has(`${section}-${items[idx]?.id || idx}`)).length;
  };

  const getEventIcon = (type) => {
    const icons = {
      'character_appearance': Users,
      'character_update': Users,
      'stat_change': TrendingUp,
      'item_event': Briefcase,
      'skill_event': Zap,
      'travel': MapPin,
      'inventory_change': Briefcase,
      'relationship_change': Heart,
      'milestone': Target,
      'generic': FileText
    };
    return icons[type] || FileText;
  };

  const getTypeColor = (type) => {
    const colors = {
      'actor': 'green',
      'item': 'yellow',
      'skill': 'blue',
      'location': 'cyan',
      'event': 'orange',
      'relationship': 'pink'
    };
    return colors[type] || 'gray';
  };

  if (!preview) return null;

  const { summary } = preview;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 border-b border-purple-500/50 p-4 flex justify-between items-center rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="w-6 h-6 text-purple-400" />
              Integration Preview
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Review all changes before applying to your story data
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="bg-slate-950/50 border-b border-slate-800 p-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{summary.totalEntities}</div>
              <div className="text-xs text-slate-500">Entities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{summary.timelineEvents}</div>
              <div className="text-xs text-slate-500">Timeline</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{summary.wikiEntries}</div>
              <div className="text-xs text-slate-500">Wiki</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{summary.characterUpdates}</div>
              <div className="text-xs text-slate-500">Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{summary.locationMarkers}</div>
              <div className="text-xs text-slate-500">Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">{summary.mindMapNodes}</div>
              <div className="text-xs text-slate-500">Mind Map</div>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Timeline Events */}
          {preview.timeline.length > 0 && (
            <Section
              title="Timeline Events"
              icon={Clock}
              color="blue"
              count={`${getEnabledCount(preview.timeline, 'timeline')}/${preview.timeline.length}`}
              expanded={expandedSections.timeline}
              enabled={enabledSystems.timeline}
              onToggleExpand={() => toggleSection('timeline')}
              onToggleEnabled={() => toggleSystem('timeline')}
            >
              {/* Select/Deselect All */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => toggleAllInSection(preview.timeline, 'timeline')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Toggle All
                </button>
              </div>
              <div className="space-y-2">
                {preview.timeline.map((event, idx) => {
                  const Icon = getEventIcon(event.type);
                  const itemId = `timeline-${event.id || idx}`;
                  const isExcluded = excludedItems.has(itemId);
                  
                  return (
                    <div 
                      key={idx} 
                      className={`bg-slate-950 border rounded p-3 cursor-pointer transition-all ${
                        isExcluded ? 'border-red-800 opacity-50' : 'border-slate-800'
                      }`}
                      onClick={() => toggleItem(itemId)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleItem(itemId)}
                          className="w-4 h-4 rounded bg-slate-800 border-slate-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Icon className="w-4 h-4 text-blue-400" />
                        <span className={`font-bold text-sm ${isExcluded ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {event.title}
                        </span>
                        <span className="text-xs text-slate-500 ml-auto">{event.type}</span>
                      </div>
                      {event.description && !isExcluded && (
                        <div className="text-xs text-slate-400 mt-1 line-clamp-2 ml-6">
                          {event.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Wiki Entries */}
          {preview.wiki.length > 0 && (
            <Section
              title="Wiki Entries"
              icon={FileText}
              color="green"
              count={`${getEnabledCount(preview.wiki, 'wiki')}/${preview.wiki.length}`}
              expanded={expandedSections.wiki}
              enabled={enabledSystems.wiki}
              onToggleExpand={() => toggleSection('wiki')}
              onToggleEnabled={() => toggleSystem('wiki')}
            >
              {/* Select/Deselect All */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => toggleAllInSection(preview.wiki, 'wiki')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Toggle All
                </button>
              </div>
              <div className="space-y-2">
                {preview.wiki.map((entry, idx) => {
                  const color = getTypeColor(entry.entityType);
                  const itemId = `wiki-${entry.id || idx}`;
                  const isExcluded = excludedItems.has(itemId);
                  
                  return (
                    <div 
                      key={idx} 
                      className={`bg-slate-950 border rounded p-3 cursor-pointer transition-all ${
                        isExcluded ? 'border-red-800 opacity-50' : 'border-slate-800'
                      }`}
                      onClick={() => toggleItem(itemId)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleItem(itemId)}
                          className="w-4 h-4 rounded bg-slate-800 border-slate-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={`px-2 py-0.5 rounded text-xs bg-${color}-900/30 text-${color}-400`}>
                          {entry.entityType}
                        </span>
                        <span className={`font-bold text-sm ${isExcluded ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {entry.title}
                        </span>
                      </div>
                      {entry.tags && entry.tags.length > 0 && !isExcluded && (
                        <div className="flex flex-wrap gap-1 mt-2 ml-6">
                          {entry.tags.slice(0, 5).map((tag, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Character Arc Updates */}
          {preview.characterArcs.length > 0 && (
            <Section
              title="Character Arc Updates"
              icon={Users}
              color="yellow"
              count={preview.characterArcs.length}
              expanded={expandedSections.characterArcs}
              enabled={enabledSystems.characterArcs}
              onToggleExpand={() => toggleSection('characterArcs')}
              onToggleEnabled={() => toggleSystem('characterArcs')}
            >
              <div className="space-y-2">
                {preview.characterArcs.map((update, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded p-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-yellow-400" />
                      <span className="font-bold text-white text-sm">{update.actorName}</span>
                      <span className="text-xs text-slate-500">- {update.type}</span>
                    </div>
                    {update.statChanges && Object.keys(update.statChanges).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(update.statChanges).map(([stat, val]) => (
                          <span key={stat} className={`text-xs px-2 py-0.5 rounded ${
                            val >= 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                          }`}>
                            {stat}: {val >= 0 ? '+' : ''}{val}
                          </span>
                        ))}
                      </div>
                    )}
                    {update.emotionalState && (
                      <div className="text-xs text-slate-400 mt-1">
                        Emotional: {update.emotionalState.state} ({(update.emotionalState.intensity * 100).toFixed(0)}%)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Mind Map */}
          {(preview.mindMap.nodes.length > 0 || preview.mindMap.edges.length > 0) && (
            <Section
              title="Mind Map"
              icon={GitBranch}
              color="purple"
              count={preview.mindMap.nodes.length + preview.mindMap.edges.length}
              expanded={expandedSections.mindMap}
              enabled={enabledSystems.mindMap}
              onToggleExpand={() => toggleSection('mindMap')}
              onToggleEnabled={() => toggleSystem('mindMap')}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-2">Nodes ({preview.mindMap.nodes.length})</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {preview.mindMap.nodes.map((node, idx) => (
                      <div key={idx} className="text-xs bg-slate-950 px-2 py-1 rounded flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-${getTypeColor(node.entityType)}-400`}></span>
                        <span className="text-white">{node.label}</span>
                        <span className="text-slate-500">{node.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-2">Edges ({preview.mindMap.edges.length})</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {preview.mindMap.edges.map((edge, idx) => (
                      <div key={idx} className="text-xs bg-slate-950 px-2 py-1 rounded">
                        <span className="text-slate-400">{edge.label || edge.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* UK Map */}
          {(preview.ukMap.locations.length > 0 || preview.ukMap.travel.length > 0) && (
            <Section
              title="UK Map"
              icon={MapPin}
              color="cyan"
              count={preview.ukMap.locations.length + preview.ukMap.travel.length}
              expanded={expandedSections.ukMap}
              enabled={enabledSystems.ukMap}
              onToggleExpand={() => toggleSection('ukMap')}
              onToggleEnabled={() => toggleSystem('ukMap')}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-2">Locations ({preview.ukMap.locations.length})</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {preview.ukMap.locations.map((loc, idx) => (
                      <div key={idx} className="text-xs bg-slate-950 px-2 py-1 rounded flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span className="text-white">{loc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-2">Travel ({preview.ukMap.travel.length})</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {preview.ukMap.travel.map((travel, idx) => (
                      <div key={idx} className="text-xs bg-slate-950 px-2 py-1 rounded">
                        <span className="text-white">{travel.actorName}</span>
                        <span className="text-slate-400"> → {travel.toLocation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Suggested Plot Threads */}
          {preview.suggestedPlotThreads && preview.suggestedPlotThreads.length > 0 && (
            <Section
              title="Suggested Plot Threads"
              icon={Target}
              color="orange"
              count={preview.suggestedPlotThreads.length}
              expanded={expandedSections.plotThreads}
              enabled={enabledSystems.plotThreads}
              onToggleExpand={() => toggleSection('plotThreads')}
              onToggleEnabled={() => toggleSystem('plotThreads')}
            >
              <div className="space-y-2">
                {preview.suggestedPlotThreads.map((thread, idx) => (
                  <div 
                    key={idx} 
                    className={`bg-slate-950 border rounded p-3 cursor-pointer transition-all ${
                      thread.approved 
                        ? 'border-green-500 bg-green-900/10' 
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                    onClick={() => onTogglePlotThread && onTogglePlotThread(idx)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {thread.approved ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-500" />
                        )}
                        <span className="font-bold text-white text-sm">{thread.name}</span>
                        <span className="text-xs text-slate-500">
                          ({(thread.confidence * 100).toFixed(0)}% confidence)
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{thread.description}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {thread.events?.length || 0} events • {thread.characters?.length || 0} characters
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Relationships */}
          {preview.relationships.length > 0 && (
            <Section
              title="Relationships"
              icon={Heart}
              color="pink"
              count={preview.relationships.length}
              expanded={expandedSections.relationships}
              enabled={enabledSystems.relationships}
              onToggleExpand={() => toggleSection('relationships')}
              onToggleEnabled={() => toggleSystem('relationships')}
            >
              <div className="space-y-2">
                {preview.relationships.map((rel, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded p-3">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-400" />
                      <span className="text-white text-sm">
                        {rel.actor1Name} <span className="text-slate-400">↔</span> {rel.actor2Name}
                      </span>
                      <span className="text-xs text-slate-500 ml-auto">{rel.type}</span>
                    </div>
                    {rel.description && (
                      <div className="text-xs text-slate-400 mt-1">{rel.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex justify-between items-center rounded-b-lg">
          <div className="text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Toggle systems on/off to control what gets updated
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Collapsible Section Component
 */
const Section = ({ 
  title, 
  icon: Icon, 
  color, 
  count, 
  expanded, 
  enabled, 
  onToggleExpand, 
  onToggleEnabled, 
  children 
}) => {
  return (
    <div className={`border rounded-lg overflow-hidden ${
      enabled ? `border-${color}-500/50` : 'border-slate-800 opacity-50'
    }`}>
      <div 
        className={`bg-slate-900 p-3 flex items-center justify-between cursor-pointer ${
          enabled ? '' : 'bg-slate-950'
        }`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleEnabled(); }}
            className={`w-5 h-5 rounded flex items-center justify-center ${
              enabled ? `bg-${color}-600` : 'bg-slate-700'
            }`}
          >
            {enabled ? <Eye className="w-3 h-3 text-white" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
          </button>
          <Icon className={`w-5 h-5 text-${color}-400`} />
          <span className="font-bold text-white">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded bg-${color}-900/30 text-${color}-400`}>
            {count}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        )}
      </div>
      {expanded && enabled && (
        <div className="p-3 bg-slate-950/50">
          {children}
        </div>
      )}
    </div>
  );
};

export default IntegrationPreviewModal;

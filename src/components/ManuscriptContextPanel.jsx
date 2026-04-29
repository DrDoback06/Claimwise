/**
 * Manuscript Context Panel
 * Expandable panels showing extracted manuscript data
 */

import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, TrendingUp, Users, Clock, Target, 
  Heart, Lightbulb, BookOpen, AlertCircle
} from 'lucide-react';

const ManuscriptContextPanel = ({ manuscriptContext, onNavigate }) => {
  const [expandedPanels, setExpandedPanels] = useState(new Set(['plotBeats']));

  const togglePanel = (panelId) => {
    setExpandedPanels(prev => {
      const next = new Set(prev);
      if (next.has(panelId)) {
        next.delete(panelId);
      } else {
        next.add(panelId);
      }
      return next;
    });
  };

  const panels = [
    {
      id: 'plotBeats',
      title: 'Plot Beats',
      icon: TrendingUp,
      color: 'purple',
      data: manuscriptContext?.plotBeats || [],
      getCount: () => manuscriptContext?.plotBeats?.length || 0,
      renderContent: (beats) => (
        <div className="space-y-2">
          {beats.slice(0, 5).map((beat, idx) => (
            <div key={idx} className="bg-slate-800 rounded p-2 text-sm">
              <div className="text-white font-medium">{beat.beat || beat.title || 'Untitled'}</div>
              {beat.purpose && (
                <div className="text-xs text-slate-400 mt-1">{beat.purpose}</div>
              )}
              {beat.characters && beat.characters.length > 0 && (
                <div className="text-xs text-slate-500 mt-1">
                  Characters: {beat.characters.join(', ')}
                </div>
              )}
            </div>
          ))}
          {beats.length > 5 && (
            <div className="text-xs text-slate-500 text-center">
              +{beats.length - 5} more beats
            </div>
          )}
        </div>
      )
    },
    {
      id: 'characterArcs',
      title: 'Character Arcs',
      icon: Users,
      color: 'green',
      data: manuscriptContext?.characterArcs || [],
      getCount: () => manuscriptContext?.characterArcs?.length || 0,
      renderContent: (arcs) => (
        <div className="space-y-2">
          {arcs.slice(0, 5).map((arc, idx) => (
            <div key={idx} className="bg-slate-800 rounded p-2 text-sm">
              <div className="text-white font-medium">{arc.characterName}</div>
              {arc.moments && arc.moments.length > 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  {arc.moments.length} arc moment{arc.moments.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'timeline',
      title: 'Timeline Events',
      icon: Clock,
      color: 'blue',
      data: manuscriptContext?.timeline || [],
      getCount: () => manuscriptContext?.timeline?.length || 0,
      renderContent: (events) => (
        <div className="space-y-2">
          {events.slice(0, 5).map((event, idx) => (
            <div key={idx} className="bg-slate-800 rounded p-2 text-sm">
              <div className="text-white font-medium">{event.title || 'Untitled Event'}</div>
              {event.description && (
                <div className="text-xs text-slate-400 mt-1">{event.description.substring(0, 100)}</div>
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'decisions',
      title: 'Decisions',
      icon: Target,
      color: 'orange',
      data: manuscriptContext?.decisions || [],
      getCount: () => manuscriptContext?.decisions?.length || 0,
      renderContent: (decisions) => (
        <div className="space-y-2">
          {decisions.slice(0, 5).map((decision, idx) => (
            <div key={idx} className="bg-slate-800 rounded p-2 text-sm">
              <div className="text-white font-medium">{decision.decision || decision.title || 'Untitled'}</div>
              {decision.character && (
                <div className="text-xs text-slate-400 mt-1">By: {decision.character}</div>
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'callbacks',
      title: 'Callbacks',
      icon: Lightbulb,
      color: 'yellow',
      data: manuscriptContext?.callbacks || [],
      getCount: () => manuscriptContext?.callbacks?.length || 0,
      renderContent: (callbacks) => (
        <div className="space-y-2">
          {callbacks.slice(0, 5).map((callback, idx) => (
            <div key={idx} className="bg-slate-800 rounded p-2 text-sm">
              <div className="text-white font-medium">{callback.event || callback.description || 'Untitled'}</div>
              {callback.importance && (
                <div className="text-xs text-slate-400 mt-1">
                  Importance: {callback.importance}/10
                </div>
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'memories',
      title: 'Memories',
      icon: Heart,
      color: 'pink',
      data: manuscriptContext?.memories || [],
      getCount: () => manuscriptContext?.memories?.length || 0,
      renderContent: (memories) => (
        <div className="space-y-2">
          {memories.slice(0, 5).map((memory, idx) => (
            <div key={idx} className="bg-slate-800 rounded p-2 text-sm">
              <div className="text-white font-medium">{memory.event || memory.description || 'Untitled'}</div>
              {memory.emotionalTone && (
                <div className="text-xs text-slate-400 mt-1">Tone: {memory.emotionalTone}</div>
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'storylines',
      title: 'Storylines',
      icon: BookOpen,
      color: 'cyan',
      data: manuscriptContext?.storylines || [],
      getCount: () => manuscriptContext?.storylines?.length || 0,
      renderContent: (storylines) => (
        <div className="space-y-2">
          {storylines.slice(0, 5).map((storyline, idx) => (
            <div key={idx} className="bg-slate-800 rounded p-2 text-sm">
              <div className="text-white font-medium">{storyline.title || 'Untitled Storyline'}</div>
              {storyline.status && (
                <div className="text-xs text-slate-400 mt-1">Status: {storyline.status}</div>
              )}
            </div>
          ))}
        </div>
      )
    }
  ];

  const getStatusColor = (count) => {
    if (count === 0) return 'text-slate-500';
    if (count < 3) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-2">
      {panels.map(panel => {
        const Icon = panel.icon;
        const count = panel.getCount();
        const isExpanded = expandedPanels.has(panel.id);
        const colorClass = `text-${panel.color}-400`;

        return (
          <div key={panel.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <button
              onClick={() => togglePanel(panel.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${colorClass}`} />
                <span className="text-sm font-medium text-white">{panel.title}</span>
                <span className={`text-xs font-bold ${getStatusColor(count)}`}>
                  {count}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
            
            {isExpanded && count > 0 && (
              <div className="p-3 border-t border-slate-800">
                {panel.renderContent(panel.data)}
              </div>
            )}
            
            {isExpanded && count === 0 && (
              <div className="p-3 border-t border-slate-800 text-center text-sm text-slate-500">
                No {panel.title.toLowerCase()} available
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ManuscriptContextPanel;

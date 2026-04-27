/**
 * Story Health Panel — UI for the Autonomous Story Continuity Agent (New Feature A)
 *
 * A collapsible notification panel in the app header that surfaces real-time
 * story health insights after each chapter save.
 */
import React, { useState, useEffect } from 'react';
import {
  Brain, X, ChevronDown, ChevronUp, CheckCircle,
  AlertTriangle, Info, Sparkles, GitBranch, Users, BookOpen, Activity
} from 'lucide-react';
import storyContiguityAgent from '../services/storyContiguityAgent';

const severityConfig = {
  critical: { color: 'border-red-500 bg-red-950/40', icon: AlertTriangle, iconColor: 'text-red-400', badgeColor: 'bg-red-600' },
  warning:  { color: 'border-yellow-500 bg-yellow-950/30', icon: AlertTriangle, iconColor: 'text-yellow-400', badgeColor: 'bg-yellow-600' },
  info:     { color: 'border-blue-500 bg-blue-950/30', icon: Info, iconColor: 'text-blue-400', badgeColor: 'bg-blue-600' },
};

const typeIcons = {
  wiki_stale:          BookOpen,
  relationship_gap:    Users,
  timeline_suggestion: GitBranch,
  consistency_issue:   AlertTriangle,
  plot_progress:       Activity,
};

const StoryHealthPanel = ({ className = '' }) => {
  const [results, setResults] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(storyContiguityAgent.enabled);

  useEffect(() => {
    const unsub = storyContiguityAgent.onUpdate(r => {
      setResults(r);
      // Auto-expand when new results arrive
      if (r.length > 0) setIsExpanded(true);
    });
    return unsub;
  }, []);

  const unreadCount = results.filter(r => !r.read).length;
  const criticalCount = results.filter(r => r.severity === 'critical').length;

  const markRead = (id) => {
    storyContiguityAgent.results = storyContiguityAgent.results.map(r =>
      r.id === id ? { ...r, read: true } : r
    );
    setResults([...storyContiguityAgent.results]);
  };

  const dismiss = (id) => {
    storyContiguityAgent.dismissResult(id);
  };

  const toggleAgent = () => {
    storyContiguityAgent.enabled = !storyContiguityAgent.enabled;
    setAgentEnabled(storyContiguityAgent.enabled);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Toggle button */}
      <button
        onClick={() => {
          setIsExpanded(v => !v);
          results.forEach(r => markRead(r.id));
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
          criticalCount > 0
            ? 'bg-red-900/40 border-red-600 text-red-300 hover:bg-red-900/60'
            : results.length > 0
              ? 'bg-indigo-900/40 border-indigo-600 text-indigo-300 hover:bg-indigo-900/60'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
        }`}
        title="Story Continuity Agent"
      >
        <Brain className="w-4 h-4" />
        <span className="hidden md:inline">Story Health</span>
        {unreadCount > 0 && (
          <span className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            criticalCount > 0 ? 'bg-red-500' : 'bg-indigo-500'
          }`}>
            {unreadCount}
          </span>
        )}
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Dropdown panel */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-white text-sm">Story Continuity Agent</span>
              {storyContiguityAgent.isRunning && (
                <span className="text-xs text-indigo-300 animate-pulse">● Running...</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAgent}
                className={`text-xs px-2 py-1 rounded border ${
                  agentEnabled
                    ? 'border-green-600 text-green-400 hover:bg-green-900/20'
                    : 'border-slate-600 text-slate-500 hover:bg-slate-800'
                }`}
                title={agentEnabled ? 'Agent is ON — click to disable' : 'Agent is OFF — click to enable'}
              >
                {agentEnabled ? 'ON' : 'OFF'}
              </button>
              {results.length > 0 && (
                <button
                  onClick={() => storyContiguityAgent.clearAll()}
                  className="text-xs text-slate-500 hover:text-slate-300"
                  title="Clear all"
                >
                  Clear all
                </button>
              )}
              <button onClick={() => setIsExpanded(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results list */}
          <div className="overflow-y-auto flex-1">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <CheckCircle className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">No insights yet.</p>
                <p className="text-xs mt-1 opacity-70">Save a chapter to trigger the agent.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {results.map(result => {
                  const sev = severityConfig[result.severity] || severityConfig.info;
                  const Icon = typeIcons[result.type] || Sparkles;
                  return (
                    <div
                      key={result.id}
                      className={`p-4 border-l-4 ${sev.color} ${!result.read ? 'opacity-100' : 'opacity-70'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${sev.iconColor}`} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white mb-0.5">{result.title}</div>
                            <div className="text-xs text-slate-300 leading-relaxed">{result.message}</div>
                            {result.suggestions && result.suggestions.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {result.suggestions.map((s, i) => (
                                  <div key={i} className="text-[10px] bg-slate-800 rounded px-2 py-1 text-slate-300">
                                    <span className="font-bold text-indigo-300">{s.title}:</span> {s.description}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-600 mt-1">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => dismiss(result.id)}
                          className="text-slate-600 hover:text-slate-400 flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryHealthPanel;

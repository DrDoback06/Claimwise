/**
 * AI Suggestion Panel
 * Card-based suggestion panel with filters and actions
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Filter, X, Check, Edit3, Save, Star, ChevronDown, ChevronUp,
  TrendingUp, Users, Heart, Zap, Target, AlertCircle, Lightbulb, Clock, Download
} from 'lucide-react';
import suggestionFeedbackService from '../services/suggestionFeedbackService';
import suggestionLearningService from '../services/suggestionLearningService';

const AISuggestionPanel = ({ suggestions = [], onAccept, onDismiss, onModify, chapterId, bookId }) => {
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [ratings, setRatings] = useState({});

  const suggestionTypes = [
    { id: 'all', label: 'All Types', icon: Sparkles },
    { id: 'plot_direction', label: 'Plot', icon: TrendingUp },
    { id: 'relationship_dynamics', label: 'Relationships', icon: Heart },
    { id: 'conflict', label: 'Conflicts', icon: AlertCircle },
    { id: 'character_growth', label: 'Character', icon: Users },
    { id: 'comedy', label: 'Comedy', icon: Lightbulb },
    { id: 'foreshadowing', label: 'Foreshadowing', icon: Clock }
  ];

  const priorities = ['all', 'high', 'medium', 'low'];

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(s => {
    const typeMatch = filterType === 'all' || s.type === filterType;
    const priorityMatch = filterPriority === 'all' || s.priority === filterPriority;
    return typeMatch && priorityMatch;
  });

  // Sort by priority and confidence
  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 1;
    const bPriority = priorityOrder[b.priority] || 1;
    if (aPriority !== bPriority) return bPriority - aPriority;
    return (b.confidence || 0) - (a.confidence || 0);
  });

  const toggleExpand = (suggestionId) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(suggestionId)) {
        next.delete(suggestionId);
      } else {
        next.add(suggestionId);
      }
      return next;
    });
  };

  const handleRate = async (suggestionId, rating) => {
    setRatings(prev => ({ ...prev, [suggestionId]: rating }));
    try {
      await suggestionFeedbackService.rateSuggestion(suggestionId, rating);
    } catch (error) {
      console.error('Error rating suggestion:', error);
    }
  };

  const handleAccept = async (suggestion) => {
    try {
      await suggestionFeedbackService.recordAcceptance(suggestion.id, 'accept', {
        suggestionType: suggestion.type,
        priority: suggestion.priority
      });
      if (onAccept) onAccept(suggestion);
    } catch (error) {
      console.error('Error accepting suggestion:', error);
    }
  };

  const handleDismiss = async (suggestion) => {
    try {
      await suggestionFeedbackService.recordAcceptance(suggestion.id, 'dismiss', {
        suggestionType: suggestion.type,
        priority: suggestion.priority
      });
      if (onDismiss) onDismiss(suggestion);
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  const getTypeIcon = (type) => {
    const typeMap = {
      plot_direction: TrendingUp,
      relationship_dynamics: Heart,
      conflict: AlertCircle,
      character_growth: Users,
      comedy: Lightbulb,
      foreshadowing: Clock,
      callback: Target
    };
    return typeMap[type] || Sparkles;
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      high: 'bg-red-900/30 text-red-400 border-red-500/30',
      medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-900/30 text-blue-400 border-blue-500/30'
    };
    return colorMap[priority] || 'bg-slate-800 text-slate-400 border-slate-700';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-bold text-white">AI Suggestions</h3>
          <span className="text-sm text-slate-400">({sortedSuggestions.length})</span>
        </div>
        <button
          onClick={() => {
            // Export suggestions as JSON
            const exportData = sortedSuggestions.map(s => ({
              id: s.id,
              type: s.type,
              priority: s.priority,
              confidence: s.confidence,
              suggestion: s.suggestion || s.comedyMoment || s.conflict || s.event || s.decision,
              reasoning: s.reasoning,
              suggestions: s.suggestions,
              characters: s.characters,
              rating: ratings[s.id] || null,
              status: s.status || 'pending',
              createdAt: s.createdAt
            }));
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-suggestions-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          title="Export suggestions as JSON"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm rounded px-3 py-2"
        >
          {suggestionTypes.map(type => (
            <option key={type.id} value={type.id}>{type.label}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm rounded px-3 py-2"
        >
          {priorities.map(p => (
            <option key={p} value={p}>{p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {sortedSuggestions.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            No suggestions match the current filters
          </div>
        ) : (
          sortedSuggestions.map(suggestion => {
            const TypeIcon = getTypeIcon(suggestion.type);
            const isExpanded = expandedCards.has(suggestion.id);
            const rating = ratings[suggestion.id] || 0;

            return (
              <div
                key={suggestion.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-purple-500/50 transition-colors"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <TypeIcon className="w-4 h-4 text-purple-400" />
                    <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority || 'medium'}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">
                      {suggestion.type?.replace(/_/g, ' ') || 'suggestion'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleExpand(suggestion.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Suggestion Content */}
                <div className="text-sm text-white mb-3">
                  {suggestion.suggestion || suggestion.comedyMoment || suggestion.conflict || suggestion.event || suggestion.decision || 'Suggestion'}
                </div>

                {/* Confidence Score */}
                {suggestion.confidence !== undefined && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-slate-400">Confidence:</span>
                    <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    {suggestion.reasoning && (
                      <div>
                        <span className="text-xs text-slate-400">Reasoning:</span>
                        <p className="text-xs text-slate-300 mt-1">{suggestion.reasoning}</p>
                      </div>
                    )}
                    {suggestion.suggestions && suggestion.suggestions.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-400">Suggestions:</span>
                        <ul className="text-xs text-slate-300 mt-1 list-disc list-inside">
                          {suggestion.suggestions.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {suggestion.characters && suggestion.characters.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-400">Characters:</span>
                        <span className="text-xs text-slate-300 ml-2">
                          {suggestion.characters.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => handleAccept(suggestion)}
                    className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDismiss(suggestion)}
                    className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded flex items-center justify-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Dismiss
                  </button>
                  {onModify && (
                    <button
                      onClick={() => onModify(suggestion)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => handleRate(suggestion.id, star)}
                      className={`text-xs ${star <= rating ? 'text-yellow-400' : 'text-slate-600'}`}
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AISuggestionPanel;

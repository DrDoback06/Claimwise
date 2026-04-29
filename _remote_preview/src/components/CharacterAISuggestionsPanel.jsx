/**
 * Character AI Suggestions Panel
 * Dedicated panel for character-specific AI suggestions
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Filter, Check, X, Edit3, Star, TrendingUp, Heart, Zap, Target } from 'lucide-react';
import db from '../services/database';
import { getCardContainerStyles, getBadgeStyles, getHoverEffects, getTextGradient } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const CharacterAISuggestionsPanel = ({ character, onAccept, onDismiss }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    loadSuggestions();
  }, [character]);

  /**
   * Load character-specific AI suggestions
   */
  const loadSuggestions = async () => {
    try {
      const allSuggestions = await db.getAll('aiSuggestions') || [];
      const characterSuggestions = allSuggestions.filter(s => 
        s.characters?.includes(character.name) ||
        s.character === character.name ||
        (s.type === 'character_growth' && s.character === character.name) ||
        (s.type === 'relationship_dynamics' && s.characters?.some(char => char === character.name))
      ).filter(s => s.status === 'pending' || s.status === 'accepted');

      setSuggestions(characterSuggestions);
    } catch (error) {
      console.error('Error loading character AI suggestions:', error);
    }
  };

  /**
   * Filter suggestions by type
   */
  const filteredSuggestions = suggestions.filter(s => {
    if (filterType === 'all') return true;
    return s.type === filterType;
  });

  /**
   * Sort by priority and confidence
   */
  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 1;
    const bPriority = priorityOrder[b.priority] || 1;
    if (aPriority !== bPriority) return bPriority - aPriority;
    return (b.confidence || 0) - (a.confidence || 0);
  });

  /**
   * Get suggestion type label
   */
  const getTypeLabel = (type) => {
    const labels = {
      character_growth: 'Growth',
      relationship_dynamics: 'Relationship',
      conflict: 'Conflict',
      comedy: 'Comedy',
      plot_direction: 'Plot'
    };
    return labels[type] || type;
  };

  /**
   * Get type icon
   */
  const getTypeIcon = (type) => {
    const icons = {
      character_growth: TrendingUp,
      relationship_dynamics: Heart,
      conflict: Target,
      comedy: Zap,
      plot_direction: TrendingUp
    };
    return icons[type] || Sparkles;
  };

  /**
   * Handle accept
   */
  const handleAccept = async (suggestion) => {
    try {
      const updated = { ...suggestion, status: 'accepted' };
      await db.update('aiSuggestions', updated);
      // Record acceptance (feedback service can be added later)
      await loadSuggestions();
      if (onAccept) onAccept(suggestion);
    } catch (error) {
      console.error('Error accepting suggestion:', error);
    }
  };

  /**
   * Handle dismiss
   */
  const handleDismiss = async (suggestion) => {
    try {
      const updated = { ...suggestion, status: 'dismissed' };
      await db.update('aiSuggestions', updated);
      // Record dismissal (feedback service can be added later)
      await loadSuggestions();
      if (onDismiss) onDismiss(suggestion);
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  /**
   * Handle rating
   */
  const handleRating = async (suggestionId, rating) => {
    try {
      setRatings(prev => ({ ...prev, [suggestionId]: rating }));
      // Record rating (feedback service can be added later)
    } catch (error) {
      console.error('Error rating suggestion:', error);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header - Modern styling */}
      <div className="flex items-center justify-between glass-medium rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-900/30 border-2 border-purple-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className={`text-lg font-bold text-white text-shadow-soft ${getTextGradient('purple')}`}>
              AI Suggestions
            </h3>
            <div className="text-xs text-slate-400">{sortedSuggestions.length} available</div>
          </div>
        </div>
      </div>

      {/* Filter - Modern UI */}
      <div className="glass-medium rounded-lg p-3 border border-slate-700/50">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="glass-light border border-slate-700/50 text-white text-sm rounded-lg px-3 py-2 w-full font-semibold cursor-pointer hover:border-purple-500/50 transition-colors"
        >
          <option value="all">All Types</option>
          <option value="character_growth">Growth</option>
          <option value="relationship_dynamics">Relationships</option>
          <option value="conflict">Conflicts</option>
          <option value="comedy">Comedy</option>
          <option value="plot_direction">Plot</option>
        </select>
      </div>

      {/* Suggestions List - Modern cards */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {sortedSuggestions.map((suggestion, idx) => {
          const TypeIcon = getTypeIcon(suggestion.type);
          const isExpanded = expandedCards.has(suggestion.id);
          const priorityColor = suggestion.priority === 'high' ? 'red' : suggestion.priority === 'medium' ? 'yellow' : 'blue';

          return (
            <div
              key={suggestion.id || `suggestion-${idx}`}
              className={`${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')} animate-fade-in-up`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg bg-purple-900/30 border-2 border-purple-500 flex items-center justify-center ${getHoverEffects('light')}`}>
                    <TypeIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white mb-1 text-shadow-soft">
                      {suggestion.suggestion || suggestion.growthMoment || suggestion.conflict || 'Suggestion'}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={getBadgeStyles('pill', 'purple')}>
                        {getTypeLabel(suggestion.type)}
                      </div>
                      <div className={getBadgeStyles('pill', priorityColor)}>
                        {suggestion.priority || 'medium'} priority
                      </div>
                    </div>
                  </div>
                </div>
                <div className={getBadgeStyles('pill', 'blue')}>
                  {Math.round((suggestion.confidence || 0) * 100)}%
                </div>
              </div>

              {suggestion.reasoning && (
                <div className="text-xs text-slate-300 mb-3 leading-relaxed opacity-90">{suggestion.reasoning}</div>
              )}

              {/* Actions - Modern buttons */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(suggestion)}
                    className={`glass-medium border-2 border-green-500/50 px-4 py-2 rounded-lg text-xs font-semibold text-green-400 hover:bg-green-900/20 hover:border-green-400 ${getHoverEffects('medium')}`}
                  >
                    <Check className="w-3 h-3 inline mr-1" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDismiss(suggestion)}
                    className={`glass-medium border-2 border-red-500/50 px-4 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-900/20 hover:border-red-400 ${getHoverEffects('medium')}`}
                  >
                    <X className="w-3 h-3 inline mr-1" />
                    Dismiss
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => handleRating(suggestion.id, rating)}
                      className={`w-5 h-5 transition-all ${getHoverEffects('light')} ${
                        (ratings[suggestion.id] || 0) >= rating
                          ? 'text-yellow-400 scale-110'
                          : 'text-slate-500 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {sortedSuggestions.length === 0 && (
          <div className="text-center text-slate-400 p-12 glass-medium rounded-lg border border-slate-700/50">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50 animate-float" />
            <p className="text-sm font-semibold">No AI suggestions found for this character</p>
            <p className="text-xs text-slate-500 mt-1">Suggestions will appear here once generated from manuscript analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterAISuggestionsPanel;

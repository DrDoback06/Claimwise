/**
 * Item AI Suggestions Panel
 * Usage opportunities, upgrade suggestions, story integration ideas, character assignment
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Check, X, Star } from 'lucide-react';
import db from '../services/database';

const ItemAISuggestionsPanel = ({ item }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    loadSuggestions();
  }, [item]);

  /**
   * Load item-specific AI suggestions
   */
  const loadSuggestions = async () => {
    try {
      const allSuggestions = await db.getAll('aiSuggestions') || [];
      const itemSuggestions = allSuggestions.filter(s => 
        s.type === 'item_usage' ||
        s.type === 'item_upgrade' ||
        s.type === 'item_story' ||
        (s.items && s.items.includes(item.name)) ||
        s.itemId === item.id
      ).filter(s => s.status === 'pending' || s.status === 'accepted');

      setSuggestions(itemSuggestions);
    } catch (error) {
      console.error('Error loading item AI suggestions:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        AI SUGGESTIONS ({suggestions.length})
      </div>
      {suggestions.length > 0 ? (
        <div className="space-y-2">
          {suggestions.slice(0, 5).map((suggestion, idx) => (
            <div key={idx} className="bg-slate-800 rounded p-2 text-xs border border-slate-700">
              <div className="text-white font-medium mb-1">
                {suggestion.suggestion || suggestion.usage || suggestion.upgrade || 'Suggestion'}
              </div>
              {suggestion.reasoning && (
                <div className="text-slate-400 text-[10px]">{suggestion.reasoning}</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  suggestion.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                  suggestion.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-blue-900/30 text-blue-400'
                }`}>
                  {suggestion.priority || 'medium'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {Math.round((suggestion.confidence || 0) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-500 p-4 text-xs">
          No AI suggestions found
        </div>
      )}
    </div>
  );
};

export default ItemAISuggestionsPanel;

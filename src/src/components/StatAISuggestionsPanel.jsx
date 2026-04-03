/**
 * Stat AI Suggestions Panel
 */

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import db from '../services/database';

const StatAISuggestionsPanel = ({ stat }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    loadSuggestions();
  }, [stat]);

  const loadSuggestions = async () => {
    try {
      const allSuggestions = await db.getAll('aiSuggestions') || [];
      const statSuggestions = allSuggestions.filter(s => 
        s.type === 'stat_balancing' ||
        s.type === 'stat_opportunity' ||
        (s.stats && s.stats.includes(stat.key))
      );
      setSuggestions(statSuggestions);
    } catch (error) {
      console.error('Error loading stat suggestions:', error);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        AI SUGGESTIONS ({suggestions.length})
      </div>
      {suggestions.slice(0, 3).map((s, idx) => (
        <div key={idx} className="bg-slate-800 rounded p-2 text-xs">
          <div className="text-white">{s.suggestion || 'Suggestion'}</div>
        </div>
      ))}
    </div>
  );
};

export default StatAISuggestionsPanel;

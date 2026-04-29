/**
 * Inventory AI Suggestions Panel
 */

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import db from '../services/database';

const InventoryAISuggestionsPanel = ({ actor }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    loadSuggestions();
  }, [actor]);

  const loadSuggestions = async () => {
    try {
      const allSuggestions = await db.getAll('aiSuggestions') || [];
      const inventorySuggestions = allSuggestions.filter(s => 
        s.type === 'equipment_optimization' ||
        s.type === 'equipment_upgrade' ||
        (s.characters && s.characters.includes(actor?.name))
      );
      setSuggestions(inventorySuggestions);
    } catch (error) {
      console.error('Error loading inventory suggestions:', error);
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

export default InventoryAISuggestionsPanel;

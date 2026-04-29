/**
 * Set Bonus Display Component
 */

import React from 'react';
import { Star, Zap } from 'lucide-react';

const SetBonusDisplay = ({ equippedItems, items }) => {
  /**
   * Check for set bonuses
   */
  const getSetBonuses = () => {
    // Simplified - would check item sets
    const sets = {};
    equippedItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item?.set) {
        if (!sets[item.set]) sets[item.set] = [];
        sets[item.set].push(item);
      }
    });

    return Object.entries(sets).map(([setName, setItems]) => ({
      name: setName,
      items: setItems,
      count: setItems.length,
      bonuses: [] // Would calculate from set definition
    }));
  };

  const setBonuses = getSetBonuses();

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-400" />
        SET BONUSES ({setBonuses.length})
      </div>
      {setBonuses.map((set, idx) => (
        <div key={idx} className="bg-slate-900 rounded p-3 border border-yellow-800/50">
          <div className="text-sm font-bold text-yellow-400 mb-1">{set.name}</div>
          <div className="text-xs text-slate-400">Items: {set.count}</div>
          {set.bonuses.length > 0 && (
            <div className="text-xs text-slate-300 mt-2">
              {set.bonuses.map((bonus, i) => (
                <div key={i}>• {bonus}</div>
              ))}
            </div>
          )}
        </div>
      ))}
      {setBonuses.length === 0 && (
        <div className="text-center text-slate-500 p-4 text-xs">
          No set bonuses active
        </div>
      )}
    </div>
  );
};

export default SetBonusDisplay;

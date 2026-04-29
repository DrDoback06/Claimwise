/**
 * Stat Character List Component
 * List of characters with each stat
 */

import React from 'react';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';

const StatCharacterList = ({ stat, actors, statRegistry }) => {
  /**
   * Get stat value for character
   */
  const getStatValue = (actor) => {
    return actor.baseStats?.[stat.key] || 0;
  };

  /**
   * Sort characters by stat value
   */
  const sortedActors = [...(actors || [])].sort((a, b) => {
    return getStatValue(b) - getStatValue(a);
  });

  /**
   * Get stat color
   */
  const getStatColor = (statKey) => {
    const statDef = statRegistry?.find(s => s.key === statKey);
    return statDef?.color || 'green';
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-2">
        <Users className="w-4 h-4" />
        CHARACTERS WITH {stat.key} ({sortedActors.length})
      </div>
      <div className="space-y-2">
        {sortedActors.map((actor, idx) => {
          const value = getStatValue(actor);
          const isTop = idx === 0;
          
          return (
            <div
              key={actor.id}
              className={`p-3 rounded border ${
                isTop 
                  ? 'border-green-500 bg-green-900/30' 
                  : 'border-slate-700 bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isTop && <TrendingUp className="w-4 h-4 text-green-400" />}
                  <div className="text-sm font-bold text-white">{actor.name}</div>
                </div>
                <div className={`text-lg font-bold text-${getStatColor(stat.key)}-400`}>
                  {value}
                </div>
              </div>
              {/* Stat Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                <div
                  className={`bg-${getStatColor(stat.key)}-500 h-2 rounded-full transition-all`}
                  style={{ width: `${Math.min(100, (value / 100) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatCharacterList;

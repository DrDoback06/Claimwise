/**
 * Skill Stat Impact Cards Component
 * Cards showing stat modifications
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const SkillStatImpactCards = ({ skill }) => {
  if (!skill.statMod) return null;

  return (
    <div className="space-y-2">
      {Object.entries(skill.statMod).map(([stat, value]) => (
        <div key={stat} className="bg-slate-900 rounded p-2 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">{stat}</div>
            <div className={`text-sm font-bold flex items-center gap-1 ${
              value > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {value > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {value > 0 ? '+' : ''}{value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkillStatImpactCards;

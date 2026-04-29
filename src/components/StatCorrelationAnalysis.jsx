/**
 * Stat Correlation Analysis Component
 */

import React, { useState, useEffect } from 'react';
import { Network, TrendingUp } from 'lucide-react';

const StatCorrelationAnalysis = ({ stat, actors, statRegistry }) => {
  const [correlations, setCorrelations] = useState([]);

  useEffect(() => {
    calculateCorrelations();
  }, [stat, actors, statRegistry]);

  const calculateCorrelations = () => {
    if (!actors || !statRegistry) return;

    const otherStats = statRegistry.filter(s => s.key !== stat.key);
    const correlationsList = [];

    otherStats.forEach(otherStat => {
      // Simple correlation: count actors with both stats
      const bothCount = actors.filter(a => 
        a.baseStats?.[stat.key] && a.baseStats?.[otherStat.key]
      ).length;
      
      if (bothCount > 0) {
        correlationsList.push({
          stat: otherStat.key,
          strength: bothCount / actors.length,
          count: bothCount
        });
      }
    });

    setCorrelations(correlationsList.sort((a, b) => b.strength - a.strength).slice(0, 5));
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-2">
        <Network className="w-4 h-4" />
        CORRELATIONS ({correlations.length})
      </div>
      {correlations.map((corr, idx) => (
        <div key={idx} className="bg-slate-900 rounded p-2 text-xs border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="text-white">{corr.stat}</div>
            <div className="text-green-400">{Math.round(corr.strength * 100)}%</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCorrelationAnalysis;

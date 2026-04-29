/**
 * Stat Gamification Component
 */

import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Star } from 'lucide-react';

const StatGamification = ({ stat, actors }) => {
  const [gamification, setGamification] = useState({
    mastery: 0,
    leaderboard: []
  });

  useEffect(() => {
    calculateGamification();
  }, [stat, actors]);

  const calculateGamification = () => {
    if (!actors) return;

    const statValues = actors
      .map(a => ({ actor: a, value: a.baseStats?.[stat.key] || 0 }))
      .sort((a, b) => b.value - a.value);

    setGamification({
      mastery: statValues.length > 0 ? Math.floor(statValues[0].value / 10) : 0,
      leaderboard: statValues.slice(0, 5)
    });
  };

  return (
    <div className="space-y-3">
      <div className="bg-slate-900 rounded p-3 border border-slate-700">
        <div className="text-xs text-slate-400">Mastery Level</div>
        <div className="text-lg font-bold text-yellow-400">{gamification.mastery}</div>
      </div>
      <div className="bg-slate-900 rounded p-3 border border-slate-700">
        <div className="text-xs text-slate-400 font-bold mb-2">LEADERBOARD</div>
        {gamification.leaderboard.map((entry, idx) => (
          <div key={idx} className="text-xs text-white mb-1">
            {idx + 1}. {entry.actor.name}: {entry.value}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatGamification;

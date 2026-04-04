/**
 * Total Stats Display Component
 * Combined stat totals from all equipped items
 */

import React from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { getCardContainerStyles, getProgressBarStyles, getBadgeStyles, getTextGradient, getHoverEffects } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const TotalStatsDisplay = ({ actor, items, statRegistry }) => {
  /**
   * Calculate total stats from equipment
   */
  const calculateTotalStats = () => {
    if (!actor?.equipment || !items) return {};

    const totals = {};
    const equipment = actor.equipment;

    Object.values(equipment).forEach(slot => {
      if (Array.isArray(slot)) {
        slot.forEach(itemId => {
          if (itemId) {
            const item = items.find(i => i.id === itemId);
            if (item?.stats) {
              Object.entries(item.stats).forEach(([stat, value]) => {
                totals[stat] = (totals[stat] || 0) + (value || 0);
              });
            }
          }
        });
      } else if (slot) {
        const item = items.find(i => i.id === slot);
        if (item?.stats) {
          Object.entries(item.stats).forEach(([stat, value]) => {
            totals[stat] = (totals[stat] || 0) + (value || 0);
          });
        }
      }
    });

    return totals;
  };

  const totalStats = calculateTotalStats();
  const coreStats = statRegistry?.filter(s => s.isCore) || [];

  const totalBonus = Object.values(totalStats).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-5">
      <div className="text-sm text-slate-300 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-green-400" />
        <span className="text-shadow-soft">Total Equipped Stats</span>
      </div>

      {/* Stat Breakdown - Modern cards */}
      <div className="grid grid-cols-2 gap-4">
        {coreStats.map((stat, idx) => {
          const value = totalStats[stat.key] || 0;
          const progressPercent = Math.min(100, (value / 100) * 100);
          const progressRarity = progressPercent >= 80 ? 'Epic' : progressPercent >= 50 ? 'Rare' : 'Common';
          
          return (
            <div 
              key={stat.key} 
              className={`${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')} animate-fade-in-up`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">{stat.key}</div>
                <div className={`text-lg font-bold ${getTextGradient('green')}`}>+{value}</div>
              </div>
              <div className={getProgressBarStyles(progressRarity, true).container}>
                <div
                  className={getProgressBarStyles(progressRarity, true).fill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Power - Large ornate display */}
      <div className={`${getCardContainerStyles('Common', 'quest')} p-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-900/30 border-2 border-yellow-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">Total Equipment Bonus</div>
              <div className="text-xs text-slate-400">From all equipped items</div>
            </div>
          </div>
          <div className={`text-3xl font-bold ${getTextGradient('orange')} text-shadow-glow`}>
            +{totalBonus}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalStatsDisplay;

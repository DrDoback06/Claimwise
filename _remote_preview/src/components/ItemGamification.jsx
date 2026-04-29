/**
 * Item Gamification Component
 * Collection completion, power scores, usage statistics, rarity progress
 */

import React, { useState, useEffect } from 'react';
import { Award, Zap, TrendingUp, Star, Package } from 'lucide-react';
import db from '../services/database';

const ItemGamification = ({ item, items, actors }) => {
  const [gamificationData, setGamificationData] = useState({
    powerScore: 0,
    usageStats: {
      timesUsed: 0,
      characters: 0,
      chapters: 0
    },
    rarityProgress: {}
  });

  useEffect(() => {
    calculateGamificationData();
  }, [item, items, actors]);

  /**
   * Calculate gamification metrics
   */
  const calculateGamificationData = async () => {
    try {
      // Calculate power score from stats
      let powerScore = 0;
      if (item.stats) {
        powerScore = Object.values(item.stats).reduce((sum, val) => sum + (val || 0), 0);
      }

      // Calculate usage statistics
      const allEvents = await db.getAll('timelineEvents') || [];
      const itemEvents = allEvents.filter(evt => 
        evt.type === 'item_event' &&
        (evt.title?.toLowerCase().includes(item.name.toLowerCase()) ||
         evt.description?.toLowerCase().includes(item.name.toLowerCase()))
      );

      const characterSet = new Set();
      const chapterSet = new Set();
      itemEvents.forEach(evt => {
        if (evt.actors) evt.actors.forEach(a => characterSet.add(a));
        if (evt.chapterId) chapterSet.add(evt.chapterId);
      });

      // Calculate rarity progress
      const rarityCounts = {};
      items.forEach(i => {
        const rarity = i.rarity || 'Common';
        rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
      });

      setGamificationData({
        powerScore,
        usageStats: {
          timesUsed: itemEvents.length,
          characters: characterSet.size,
          chapters: chapterSet.size
        },
        rarityProgress: rarityCounts
      });
    } catch (error) {
      console.error('Error calculating gamification data:', error);
    }
  };

  /**
   * Get power score color
   */
  const getPowerColor = (score) => {
    if (score >= 100) return 'text-red-400';
    if (score >= 50) return 'text-orange-400';
    if (score >= 25) return 'text-purple-400';
    return 'text-blue-400';
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-400 font-bold mb-2">GAMIFICATION</div>

      {/* Power Score */}
      <div className="bg-slate-900 rounded p-3 border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <div className="text-xs text-white">Power Score</div>
          </div>
          <div className={`text-lg font-bold ${getPowerColor(gamificationData.powerScore)}`}>
            {gamificationData.powerScore}
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-slate-900 rounded p-3 border border-slate-700">
        <div className="text-xs text-white font-bold mb-2">USAGE STATISTICS</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-slate-400">Times Used</div>
            <div className="text-white font-bold">{gamificationData.usageStats.timesUsed}</div>
          </div>
          <div>
            <div className="text-slate-400">Characters</div>
            <div className="text-white font-bold">{gamificationData.usageStats.characters}</div>
          </div>
          <div>
            <div className="text-slate-400">Chapters</div>
            <div className="text-white font-bold">{gamificationData.usageStats.chapters}</div>
          </div>
        </div>
      </div>

      {/* Rarity Progress */}
      <div className="bg-slate-900 rounded p-3 border border-slate-700">
        <div className="text-xs text-white font-bold mb-2">RARITY COLLECTION</div>
        <div className="space-y-1 text-xs">
          {Object.entries(gamificationData.rarityProgress).map(([rarity, count]) => (
            <div key={rarity} className="flex items-center justify-between">
              <span className="text-slate-400">{rarity}</span>
              <span className="text-white font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItemGamification;

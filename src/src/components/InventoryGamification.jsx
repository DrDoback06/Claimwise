/**
 * Inventory Gamification Component
 */

import React from 'react';
import { Award, Package, Star } from 'lucide-react';

const InventoryGamification = ({ actor, items }) => {
  const inventoryCount = actor?.inventory?.length || 0;
  const equippedCount = actor?.equipment 
    ? Object.values(actor.equipment).filter(v => v !== null && v !== undefined).length
    : 0;

  /**
   * Calculate completion percentage
   */
  const completion = items.length > 0 
    ? Math.min(100, Math.round((inventoryCount / items.length) * 100))
    : 0;

  return (
    <div className="space-y-3">
      <div className="bg-slate-900 rounded p-3 border border-slate-700">
        <div className="text-xs text-slate-400 mb-1">Collection Progress</div>
        <div className="text-lg font-bold text-white">{completion}%</div>
        <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900 rounded p-2">
          <div className="text-xs text-slate-400">Items</div>
          <div className="text-sm font-bold text-white">{inventoryCount}</div>
        </div>
        <div className="bg-slate-900 rounded p-2">
          <div className="text-xs text-slate-400">Equipped</div>
          <div className="text-sm font-bold text-white">{equippedCount}</div>
        </div>
      </div>
    </div>
  );
};

export default InventoryGamification;

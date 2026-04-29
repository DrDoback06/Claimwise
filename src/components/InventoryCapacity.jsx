/**
 * Inventory Capacity Component
 */

import React from 'react';
import { Package, AlertCircle } from 'lucide-react';

const InventoryCapacity = ({ actor, maxCapacity = 50 }) => {
  const currentCount = actor?.inventory?.length || 0;
  const percentage = (currentCount / maxCapacity) * 100;
  const isFull = percentage >= 100;
  const isWarning = percentage >= 80;

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-2">
        <Package className="w-4 h-4" />
        CAPACITY
      </div>
      <div className="bg-slate-900 rounded p-3 border border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-slate-400">Items</div>
          <div className={`text-sm font-bold ${
            isFull ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white'
          }`}>
            {currentCount} / {maxCapacity}
          </div>
        </div>
        <div className={`w-full rounded-full h-2 ${
          isFull ? 'bg-red-900' : isWarning ? 'bg-yellow-900' : 'bg-slate-800'
        }`}>
          <div
            className={`h-2 rounded-full transition-all ${
              isFull ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        {isWarning && (
          <div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Capacity warning
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryCapacity;

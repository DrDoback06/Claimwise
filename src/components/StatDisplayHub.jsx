/**
 * Stat Display Hub Component
 * Multiple display methods
 */

import React, { useState } from 'react';
import { BarChart3, List, TrendingUp } from 'lucide-react';

const StatDisplayHub = ({ stat, value, min, max }) => {
  const [displayMode, setDisplayMode] = useState('bar'); // 'bar' | 'number' | 'comparison'

  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setDisplayMode('bar')}
          className={`px-3 py-1 rounded text-xs ${
            displayMode === 'bar' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Bar
        </button>
        <button
          onClick={() => setDisplayMode('number')}
          className={`px-3 py-1 rounded text-xs ${
            displayMode === 'number' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Number
        </button>
        <button
          onClick={() => setDisplayMode('comparison')}
          className={`px-3 py-1 rounded text-xs ${
            displayMode === 'comparison' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Compare
        </button>
      </div>

      {displayMode === 'bar' && (
        <div className="bg-slate-900 rounded p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-slate-400">{stat.key}</div>
            <div className="text-sm font-bold text-white">{value}</div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {displayMode === 'number' && (
        <div className="bg-slate-900 rounded p-4 text-center">
          <div className="text-3xl font-bold text-white">{value}</div>
          <div className="text-xs text-slate-400 mt-1">{stat.key}</div>
        </div>
      )}

      {displayMode === 'comparison' && (
        <div className="bg-slate-900 rounded p-3">
          <div className="text-xs text-slate-400 mb-2">Range: {min} - {max}</div>
          <div className="text-sm font-bold text-white">Current: {value}</div>
        </div>
      )}
    </div>
  );
};

export default StatDisplayHub;

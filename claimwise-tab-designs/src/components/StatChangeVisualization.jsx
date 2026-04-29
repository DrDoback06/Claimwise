/**
 * Stat Change Visualization Component
 * Line charts, bar charts, timeline view
 */

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Clock } from 'lucide-react';

const StatChangeVisualization = ({ stat, changes }) => {
  const [chartType, setChartType] = useState('line'); // 'line' | 'bar' | 'timeline'

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setChartType('line')}
          className={`px-3 py-1 rounded text-xs ${
            chartType === 'line' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Line
        </button>
        <button
          onClick={() => setChartType('bar')}
          className={`px-3 py-1 rounded text-xs ${
            chartType === 'bar' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Bar
        </button>
        <button
          onClick={() => setChartType('timeline')}
          className={`px-3 py-1 rounded text-xs ${
            chartType === 'timeline' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Timeline
        </button>
      </div>

      {chartType === 'line' && (
        <div className="bg-slate-900 rounded p-4 h-48 flex items-end gap-2">
          {changes.map((change, idx) => (
            <div
              key={idx}
              className="flex-1 bg-green-500 rounded-t"
              style={{ height: `${(change.value / 100) * 100}%` }}
            />
          ))}
        </div>
      )}

      {chartType === 'bar' && (
        <div className="bg-slate-900 rounded p-4 h-48 flex items-end gap-2">
          {changes.map((change, idx) => (
            <div
              key={idx}
              className="flex-1 bg-blue-500 rounded-t"
              style={{ height: `${(change.value / 100) * 100}%` }}
            />
          ))}
        </div>
      )}

      {chartType === 'timeline' && (
        <div className="space-y-2">
          {changes.map((change, idx) => (
            <div key={idx} className="bg-slate-900 rounded p-2 text-xs">
              <div className="text-white">{change.value}</div>
              <div className="text-slate-400">{change.timestamp}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatChangeVisualization;

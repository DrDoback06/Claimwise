/**
 * Stat Significance Moments Component
 */

import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import db from '../services/database';

const StatSignificanceMoments = ({ stat, books }) => {
  const [moments, setMoments] = useState([]);

  useEffect(() => {
    loadMoments();
  }, [stat]);

  const loadMoments = async () => {
    try {
      const callbacks = await db.getAll('callbacks') || [];
      const memories = await db.getAll('memories') || [];
      const statCallbacks = callbacks.filter(cb => 
        cb.stats?.includes(stat.key)
      );
      const statMemories = memories.filter(m => 
        m.stats?.includes(stat.key)
      );
      setMoments([...statCallbacks, ...statMemories]);
    } catch (error) {
      console.error('Error loading stat moments:', error);
    }
  };

  return (
    <div className="space-y-2">
      {moments.map((moment, idx) => (
        <div key={idx} className="bg-slate-900 rounded p-2 text-xs border border-slate-700">
          <div className="text-white">{moment.event || moment.description}</div>
        </div>
      ))}
    </div>
  );
};

export default StatSignificanceMoments;

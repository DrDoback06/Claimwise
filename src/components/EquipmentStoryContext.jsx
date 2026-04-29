/**
 * Equipment Story Context Component
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Target } from 'lucide-react';
import db from '../services/database';

const EquipmentStoryContext = ({ item, books }) => {
  const [context, setContext] = useState({
    storylines: [],
    plotBeats: []
  });

  useEffect(() => {
    loadContext();
  }, [item]);

  const loadContext = async () => {
    try {
      const storylines = await db.getAll('storylines') || [];
      const plotBeats = await db.getAll('plotBeats') || [];
      
      setContext({
        storylines: storylines.filter(sl => sl.items?.includes(item.name)),
        plotBeats: plotBeats.filter(beat => beat.items?.includes(item.name))
      });
    } catch (error) {
      console.error('Error loading equipment context:', error);
    }
  };

  return (
    <div className="space-y-2">
      {context.storylines.length > 0 && (
        <div>
          <div className="text-xs text-slate-400 font-bold">Storylines: {context.storylines.length}</div>
        </div>
      )}
      {context.plotBeats.length > 0 && (
        <div>
          <div className="text-xs text-slate-400 font-bold">Plot Beats: {context.plotBeats.length}</div>
        </div>
      )}
    </div>
  );
};

export default EquipmentStoryContext;

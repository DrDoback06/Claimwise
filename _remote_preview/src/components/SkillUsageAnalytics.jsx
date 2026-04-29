/**
 * Skill Usage Analytics Dashboard
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import db from '../services/database';

const SkillUsageAnalytics = ({ skill, actors }) => {
  const [analytics, setAnalytics] = useState({
    frequency: 0,
    characters: [],
    effectiveness: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, [skill, actors]);

  const loadAnalytics = async () => {
    try {
      const allEvents = await db.getAll('timelineEvents') || [];
      const skillEvents = allEvents.filter(evt => 
        evt.type === 'skill_event' &&
        (evt.title?.toLowerCase().includes(skill.name.toLowerCase()) ||
         evt.description?.toLowerCase().includes(skill.name.toLowerCase()))
      );

      const characterSet = new Set();
      skillEvents.forEach(evt => {
        if (evt.actors) evt.actors.forEach(a => characterSet.add(a));
      });

      setAnalytics({
        frequency: skillEvents.length,
        characters: Array.from(characterSet),
        effectiveness: skillEvents.length > 0 ? 85 : 0 // Placeholder
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded p-3">
          <div className="text-xs text-slate-400">Frequency</div>
          <div className="text-lg font-bold text-white">{analytics.frequency}</div>
        </div>
        <div className="bg-slate-900 rounded p-3">
          <div className="text-xs text-slate-400">Characters</div>
          <div className="text-lg font-bold text-white">{analytics.characters.length}</div>
        </div>
        <div className="bg-slate-900 rounded p-3">
          <div className="text-xs text-slate-400">Effectiveness</div>
          <div className="text-lg font-bold text-green-400">{analytics.effectiveness}%</div>
        </div>
      </div>
    </div>
  );
};

export default SkillUsageAnalytics;

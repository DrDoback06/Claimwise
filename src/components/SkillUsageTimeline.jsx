/**
 * Skill Usage Timeline Component
 * Timeline of skill usage from extracted data
 */

import React, { useState, useEffect } from 'react';
import { Zap, Clock, Users } from 'lucide-react';
import db from '../services/database';

const SkillUsageTimeline = ({ skill, books }) => {
  const [usageHistory, setUsageHistory] = useState([]);

  useEffect(() => {
    loadUsageHistory();
  }, [skill]);

  const loadUsageHistory = async () => {
    try {
      const allEvents = await db.getAll('timelineEvents') || [];
      const skillEvents = allEvents.filter(evt => 
        evt.type === 'skill_event' &&
        (evt.title?.toLowerCase().includes(skill.name.toLowerCase()) ||
         evt.description?.toLowerCase().includes(skill.name.toLowerCase()))
      ).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      setUsageHistory(skillEvents);
    } catch (error) {
      console.error('Error loading skill usage:', error);
    }
  };

  return (
    <div className="space-y-3">
      {usageHistory.map((event, idx) => (
        <div key={idx} className="bg-slate-900 rounded p-3 border border-slate-700">
          <div className="text-sm font-bold text-white">{event.title || 'Skill Usage'}</div>
          <div className="text-xs text-slate-400 mt-1">{event.description}</div>
        </div>
      ))}
    </div>
  );
};

export default SkillUsageTimeline;

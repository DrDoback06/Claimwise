/**
 * Skill Gamification Component
 */

import React, { useState, useEffect } from 'react';
import { Award, Zap, Star } from 'lucide-react';
import db from '../services/database';

const SkillGamification = ({ skill, actors }) => {
  const [gamification, setGamification] = useState({
    masteryLevel: 0,
    usageCount: 0,
    powerRank: 0
  });

  useEffect(() => {
    calculateGamification();
  }, [skill, actors]);

  const calculateGamification = async () => {
    try {
      const allEvents = await db.getAll('timelineEvents') || [];
      const usageCount = allEvents.filter(evt => 
        evt.type === 'skill_event' &&
        (evt.title?.toLowerCase().includes(skill.name.toLowerCase()) ||
         evt.description?.toLowerCase().includes(skill.name.toLowerCase()))
      ).length;

      const characterCount = actors.filter(a => 
        a.activeSkills?.includes(skill.id)
      ).length;

      setGamification({
        masteryLevel: Math.min(10, Math.floor(usageCount / 5)),
        usageCount,
        powerRank: characterCount
      });
    } catch (error) {
      console.error('Error calculating gamification:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-slate-900 rounded p-3 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="text-xs text-white">Mastery Level</div>
          <div className="text-lg font-bold text-yellow-400">{gamification.masteryLevel}</div>
        </div>
      </div>
      <div className="bg-slate-900 rounded p-3 border border-slate-700">
        <div className="text-xs text-slate-400">Usage Count</div>
        <div className="text-lg font-bold text-white">{gamification.usageCount}</div>
      </div>
    </div>
  );
};

export default SkillGamification;

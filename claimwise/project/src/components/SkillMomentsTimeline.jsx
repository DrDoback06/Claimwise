/**
 * Skill Moments Timeline Component
 */

import React, { useState, useEffect } from 'react';
import { Clock, Target } from 'lucide-react';
import db from '../services/database';

const SkillMomentsTimeline = ({ skill, books }) => {
  const [moments, setMoments] = useState([]);

  useEffect(() => {
    loadMoments();
  }, [skill]);

  const loadMoments = async () => {
    try {
      const callbacks = await db.getAll('callbacks') || [];
      const memories = await db.getAll('memories') || [];
      const skillCallbacks = callbacks.filter(cb => 
        cb.skills?.includes(skill.name)
      );
      const skillMemories = memories.filter(m => 
        m.skills?.includes(skill.name)
      );
      setMoments([...skillCallbacks, ...skillMemories]);
    } catch (error) {
      console.error('Error loading skill moments:', error);
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

export default SkillMomentsTimeline;

/**
 * Skill Card View Component
 */

import React from 'react';
import { Zap, Clock, Target } from 'lucide-react';

const SkillCardView = ({ skill }) => {
  return (
    <div className="bg-slate-900 rounded-lg p-4 border-2 border-blue-500">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-blue-400" />
        <div className="text-lg font-bold text-white">{skill.name}</div>
      </div>
      <div className="text-xs text-slate-400 mb-2">{skill.desc}</div>
      {skill.cooldown && (
        <div className="text-xs text-slate-300 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Cooldown: {skill.cooldown}s
        </div>
      )}
    </div>
  );
};

export default SkillCardView;

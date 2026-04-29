/**
 * Item Skill Associations Component
 * Skills that work with this item
 */

import React, { useState, useEffect } from 'react';
import { Zap, Link2 } from 'lucide-react';

const ItemSkillAssociations = ({ item, skillBank }) => {
  const [associatedSkills, setAssociatedSkills] = useState([]);

  useEffect(() => {
    findAssociatedSkills();
  }, [item, skillBank]);

  /**
   * Find skills associated with this item
   */
  const findAssociatedSkills = () => {
    if (!skillBank || !item) return;
    
    // Check if item has skill requirements or if skills mention this item
    const skills = skillBank.filter(skill => 
      skill.requiredItems?.includes(item.id) ||
      skill.requiredItems?.includes(item.name) ||
      skill.description?.toLowerCase().includes(item.name.toLowerCase())
    );

    setAssociatedSkills(skills);
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-2">
        <Zap className="w-4 h-4 text-blue-400" />
        SKILL ASSOCIATIONS ({associatedSkills.length})
      </div>
      {associatedSkills.length > 0 ? (
        <div className="space-y-2">
          {associatedSkills.map((skill, idx) => (
            <div key={skill.id || `skill-${idx}-${skill.name || 'unnamed'}`} className="bg-slate-800 rounded p-2 text-xs border border-blue-800/50 flex items-center gap-2">
              <Link2 className="w-3 h-3 text-blue-400" />
              <div className="text-white font-medium">{skill.name}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-500 p-4 text-xs">
          No skill associations found
        </div>
      )}
    </div>
  );
};

export default ItemSkillAssociations;

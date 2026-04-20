import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Users, Package, Zap, MapPin, Heart, Star, Shield, Swords,
  TrendingUp, ChevronRight, X, ExternalLink
} from 'lucide-react';

/**
 * EntityHoverCard - Rich hover card showing entity details
 * Displays mini-profile with scroll for actors, Diablo-style for items/skills
 */

// Actor Profile Card - Full mini-profile with scroll
export const ActorHoverCard = memo(({ actor, position, onClose, onNavigate }) => {
  const cardRef = useRef(null);
  
  if (!actor) return null;

  const stats = actor.stats || {};
  const coreStats = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  
  return (
    <div 
      ref={cardRef}
      className="fixed z-[100] w-80 max-h-96 bg-slate-900/98 backdrop-blur-md border border-amber-500/50 
        rounded-xl shadow-2xl shadow-amber-500/20 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: Math.min(position.x + 10, window.innerWidth - 340),
        top: Math.min(position.y, window.innerHeight - 400)
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600/30 to-amber-500/10 p-3 border-b border-slate-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 
              flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {actor.name?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{actor.name}</h3>
              <p className="text-xs text-amber-400">{actor.role || 'Character'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        className="max-h-64 overflow-y-auto custom-scrollbar"
        style={{ overflowY: 'auto' }}
        onWheel={(e) => {
          // Allow scrolling when mouse wheel is used
          e.stopPropagation();
        }}
      >
        {/* Stats Bar */}
        {Object.keys(stats).length > 0 && (
          <div className="p-3 border-b border-slate-800">
            <div className="grid grid-cols-3 gap-2">
              {coreStats.map(stat => {
                const value = stats[stat] || stats[stat.toLowerCase()] || 10;
                return (
                  <div key={stat} className="text-center p-2 bg-slate-800/50 rounded">
                    <div className="text-xs text-slate-500">{stat}</div>
                    <div className={`font-bold ${value > 15 ? 'text-green-400' : value < 8 ? 'text-red-400' : 'text-white'}`}>
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Biography/Description */}
        {(actor.biography || actor.description) && (
          <div className="p-3 border-b border-slate-800">
            <h4 className="text-xs uppercase text-slate-500 font-semibold mb-1">Biography</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {actor.biography || actor.description}
            </p>
          </div>
        )}

        {/* Relationships */}
        {actor.relationships?.length > 0 && (
          <div className="p-3 border-b border-slate-800">
            <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2">Relationships</h4>
            <div className="space-y-1">
              {actor.relationships.slice(0, 3).map((rel, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Heart className={`w-3 h-3 ${rel.type === 'ally' ? 'text-green-400' : rel.type === 'enemy' ? 'text-red-400' : 'text-slate-400'}`} />
                  <span className="text-slate-300">{rel.name}</span>
                  <span className="text-slate-600">({rel.type})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nicknames */}
        {actor.nicknames?.length > 0 && (
          <div className="p-3 border-b border-slate-800">
            <h4 className="text-xs uppercase text-slate-500 font-semibold mb-1">Also Known As</h4>
            <p className="text-sm text-slate-400 italic">{actor.nicknames.join(', ')}</p>
          </div>
        )}

        {/* Skills */}
        {actor.skills?.length > 0 && (
          <div className="p-3">
            <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1">
              {actor.skills.slice(0, 5).map((skill, i) => (
                <span key={i} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                  {typeof skill === 'string' ? skill : skill.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Navigate */}
      <div className="p-2 bg-slate-800/50 border-t border-slate-700">
        <button
          onClick={() => onNavigate?.('personnel', { actorId: actor.id })}
          className="w-full flex items-center justify-center gap-2 py-2 bg-amber-600 hover:bg-amber-500 
            rounded-lg text-white text-sm font-medium transition-colors"
        >
          View Full Profile
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

// Item Hover Card - Diablo style
export const ItemHoverCard = memo(({ item, position, onClose, onNavigate }) => {
  if (!item) return null;

  const rarityColors = {
    common: { border: 'border-slate-500', bg: 'from-slate-600/30', text: 'text-slate-300', glow: '' },
    uncommon: { border: 'border-green-500', bg: 'from-green-600/30', text: 'text-green-400', glow: 'shadow-green-500/20' },
    rare: { border: 'border-blue-500', bg: 'from-blue-600/30', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    epic: { border: 'border-purple-500', bg: 'from-purple-600/30', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
    legendary: { border: 'border-amber-500', bg: 'from-amber-600/30', text: 'text-amber-400', glow: 'shadow-amber-500/30' },
    mythic: { border: 'border-red-500', bg: 'from-red-600/30', text: 'text-red-400', glow: 'shadow-red-500/30' }
  };
  
  const rarity = item.rarity || 'common';
  const colors = rarityColors[rarity] || rarityColors.common;

  return (
    <div 
      className={`fixed z-[100] w-72 bg-slate-900/98 backdrop-blur-md ${colors.border} border-2 
        rounded-lg shadow-2xl ${colors.glow} overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      style={{
        left: Math.min(position.x + 10, window.innerWidth - 300),
        top: Math.min(position.y, window.innerHeight - 350)
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.bg} to-transparent p-3 border-b border-slate-700`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-bold ${colors.text}`}>{item.name}</h3>
            <p className="text-xs text-slate-500 capitalize">{item.type || 'Item'} • {rarity}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {item.stats && Object.keys(item.stats).length > 0 && (
        <div className="p-3 border-b border-slate-800">
          {Object.entries(item.stats).map(([stat, value]) => (
            <div key={stat} className="flex justify-between text-sm">
              <span className="text-slate-400">{stat}</span>
              <span className={value > 0 ? 'text-green-400' : 'text-red-400'}>
                {value > 0 ? '+' : ''}{value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div className="p-3 border-b border-slate-800">
          <p className="text-sm text-slate-300 italic">{item.description}</p>
        </div>
      )}

      {/* Effect */}
      {item.effect && (
        <div className="p-3 border-b border-slate-800">
          <p className="text-sm text-amber-300">
            <Zap className="w-3 h-3 inline mr-1" />
            {item.effect}
          </p>
        </div>
      )}

      {/* Owner */}
      {item.owner && (
        <div className="p-3 bg-slate-800/30">
          <span className="text-xs text-slate-500">Owned by: </span>
          <span className="text-sm text-white">{item.owner}</span>
        </div>
      )}

      {/* Footer */}
      <div className="p-2 bg-slate-800/50 border-t border-slate-700">
        <button
          onClick={() => onNavigate?.('inventory', { itemId: item.id })}
          className={`w-full flex items-center justify-center gap-2 py-1.5 ${colors.border} border 
            hover:bg-slate-800 rounded text-sm ${colors.text} transition-colors`}
        >
          View Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.item?.id === nextProps.item?.id &&
         prevProps.position?.x === nextProps.position?.x &&
         prevProps.position?.y === nextProps.position?.y;
});

// Skill Hover Card - Diablo style with prerequisites
export const SkillHoverCard = memo(({ skill, position, onClose, onNavigate }) => {
  if (!skill) return null;

  const branchColors = {
    combat: { border: 'border-red-500', bg: 'from-red-600/30', text: 'text-red-400' },
    magic: { border: 'border-purple-500', bg: 'from-purple-600/30', text: 'text-purple-400' },
    utility: { border: 'border-cyan-500', bg: 'from-cyan-600/30', text: 'text-cyan-400' },
    social: { border: 'border-pink-500', bg: 'from-pink-600/30', text: 'text-pink-400' },
    defense: { border: 'border-green-500', bg: 'from-green-600/30', text: 'text-green-400' }
  };
  
  const branch = skill.branch || 'utility';
  const colors = branchColors[branch] || branchColors.utility;

  return (
    <div 
      className={`fixed z-[100] w-64 bg-slate-900/98 backdrop-blur-md ${colors.border} border-2 
        rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      style={{
        left: Math.min(position.x + 10, window.innerWidth - 280),
        top: Math.min(position.y, window.innerHeight - 300)
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.bg} to-transparent p-3 border-b border-slate-700`}>
        <div className="flex items-center gap-2">
          <Zap className={`w-5 h-5 ${colors.text}`} />
          <div>
            <h3 className={`font-bold ${colors.text}`}>{skill.name}</h3>
            <p className="text-xs text-slate-500 capitalize">{branch} • {skill.tier || 'Novice'}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {skill.description && (
        <div className="p-3 border-b border-slate-800">
          <p className="text-sm text-slate-300">{skill.description}</p>
        </div>
      )}

      {/* Cost */}
      <div className="p-3 border-b border-slate-800 flex justify-between items-center">
        <span className="text-slate-500 text-sm">Point Cost</span>
        <span className={`font-bold ${colors.text}`}>{skill.pointCost || 1} pts</span>
      </div>

      {/* Prerequisites */}
      {skill.prerequisites?.length > 0 && (
        <div className="p-3 bg-slate-800/30">
          <p className="text-xs text-slate-500 mb-1">Requires:</p>
          <div className="flex flex-wrap gap-1">
            {skill.prerequisites.map((prereq, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                {prereq}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-2 bg-slate-800/50 border-t border-slate-700">
        <button
          onClick={() => onNavigate?.('skills', { skillId: skill.id })}
          className={`w-full flex items-center justify-center gap-2 py-1.5 ${colors.border} border 
            hover:bg-slate-800 rounded text-sm ${colors.text} transition-colors`}
        >
          View in Skill Tree
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.skill?.id === nextProps.skill?.id &&
         prevProps.position?.x === nextProps.position?.x &&
         prevProps.position?.y === nextProps.position?.y;
});

// Wrapper component that handles hover state
const EntityHoverCard = ({ 
  entity, 
  entityType, // 'actor' | 'item' | 'skill'
  position, 
  onClose, 
  onNavigate 
}) => {
  if (!entity || !position) return null;

  switch (entityType) {
    case 'actor':
      return <ActorHoverCard actor={entity} position={position} onClose={onClose} onNavigate={onNavigate} />;
    case 'item':
      return <ItemHoverCard item={entity} position={position} onClose={onClose} onNavigate={onNavigate} />;
    case 'skill':
      return <SkillHoverCard skill={entity} position={position} onClose={onClose} onNavigate={onNavigate} />;
    default:
      return null;
  }
};

export default EntityHoverCard;

/**
 * Enhanced Character Card Component
 * Displays character with badges, power levels, and visual effects
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Heart, Target, Clock, Sparkles, ChevronDown, ChevronUp,
  Award, Zap, Shield, Sword, Star, AlertCircle, CheckCircle, Trash2
} from 'lucide-react';
import db from '../services/database';
import { getCardContainerStyles, getPowerLevelStyles, getHoverEffects, getTextGradient, getBadgeStyles } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const EnhancedCharacterCard = ({ 
  character, 
  isSelected, 
  onSelect, 
  onDelete,
  worldState,
  showCheckbox = false,
  isChecked = false,
  onCheckboxChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [badgeData, setBadgeData] = useState({
    callbacks: 0,
    memories: 0,
    plotBeats: 0,
    storylines: 0,
    aiSuggestions: 0,
    powerLevel: 0
  });

  useEffect(() => {
    loadBadgeData();
  }, [character]);

  /**
   * Load badge data from manuscript intelligence stores
   */
  const loadBadgeData = async () => {
    try {
      // Load callbacks
      const callbacks = await db.getAll('callbacks') || [];
      const characterCallbacks = callbacks.filter(cb => 
        cb.characters?.includes(character.name) || 
        cb.character === character.name ||
        cb.characterId === character.id
      );

      // Load memories
      const memories = await db.getAll('memories') || [];
      const characterMemories = memories.filter(m => 
        m.characters?.includes(character.name) ||
        m.character === character.name ||
        m.characterId === character.id
      );

      // Load plot beats
      const plotBeats = await db.getAll('plotBeats') || [];
      const characterBeats = plotBeats.filter(beat => 
        beat.characters?.includes(character.name) ||
        beat.character === character.name ||
        (beat.characterIds && beat.characterIds.includes(character.id))
      );

      // Load storylines
      const storylines = await db.getAll('storylines') || [];
      const characterStorylines = storylines.filter(sl => 
        sl.characters?.includes(character.name) ||
        (sl.characterIds && sl.characterIds.includes(character.id))
      );

      // Load AI suggestions
      const aiSuggestions = await db.getAll('aiSuggestions') || [];
      const characterSuggestions = aiSuggestions.filter(s => 
        s.characters?.includes(character.name) ||
        (s.characterId && s.characterId === character.id) ||
        (s.type === 'character_growth' && s.character === character.name)
      );

      // Calculate power level (composite stat score)
      const powerLevel = calculatePowerLevel(character, worldState);

      setBadgeData({
        callbacks: characterCallbacks.length,
        memories: characterMemories.length,
        plotBeats: characterBeats.length,
        storylines: characterStorylines.length,
        aiSuggestions: characterSuggestions.length,
        powerLevel
      });
    } catch (error) {
      console.warn('Error loading badge data:', error);
    }
  };

  /**
   * Calculate power level from stats
   */
  const calculatePowerLevel = (char, worldState) => {
    if (!char.baseStats || !worldState?.statRegistry) return 0;
    
    const coreStats = worldState.statRegistry.filter(s => s.isCore);
    let totalPower = 0;
    
    coreStats.forEach(stat => {
      const value = char.baseStats[stat.key] || 0;
      // Weight by stat importance (if defined)
      const weight = stat.importance || 1;
      totalPower += value * weight;
    });

    // Add equipment bonuses
    if (char.equipment) {
      Object.values(char.equipment).forEach(itemId => {
        if (itemId) {
          const item = Array.isArray(itemId)
            ? worldState.itemBank?.find(i => i.id === itemId[0])
            : worldState.itemBank?.find(i => i.id === itemId);
          
          if (item?.stats) {
            Object.values(item.stats).forEach(statValue => {
              totalPower += statValue || 0;
            });
          }
        }
      });
    }

    // Add skill bonuses
    if (char.activeSkills) {
      char.activeSkills.forEach(skillId => {
        const skill = worldState.skillBank?.find(s => s.id === skillId);
        if (skill?.statMod) {
          Object.values(skill.statMod).forEach(modValue => {
            totalPower += modValue || 0;
          });
        }
      });
    }

    return Math.round(totalPower / (coreStats.length || 1));
  };

  /**
   * Get rarity level from power level
   */
  const getRarityLevel = (powerLevel) => {
    if (powerLevel >= 1000) return 'Mythic';
    if (powerLevel >= 750) return 'Legendary';
    if (powerLevel >= 500) return 'Epic';
    if (powerLevel >= 250) return 'Rare';
    return 'Common';
  };

  const rarityLevel = getRarityLevel(badgeData.powerLevel);
  const powerStyles = getPowerLevelStyles(badgeData.powerLevel);
  const cardStyles = getCardContainerStyles(rarityLevel, 'character');

  return (
    <div className="mb-3 group">
      <div className="flex items-start gap-2">
        {showCheckbox && (
          <div className="pt-3">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                e.stopPropagation();
                if (onCheckboxChange) onCheckboxChange(e.target.checked);
              }}
              className="w-4 h-4 accent-blue-500 cursor-pointer"
            />
          </div>
        )}
        <div 
          className={`flex-1 ${cardStyles} ${isSelected ? 'ring-2 ring-green-500/50 ring-offset-2 ring-offset-slate-900' : ''} ${powerStyles.glow} relative overflow-hidden`} 
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(15, 23, 42, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px'
          }}
        >
          {/* #region agent log */}
          {(() => {
            try {
              fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EnhancedCharacterCard.jsx:179',message:'Rendering character card',data:{characterName:character?.name,cardStyles,powerLevel:badgeData.powerLevel},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
            } catch(e) {}
            return null;
          })()}
          {/* #endregion */}
          {/* Gradient overlay */}
          <div className={`absolute inset-0 ${powerStyles.bgGradient} opacity-60 pointer-events-none`} />
          
          {/* Glassmorphism background */}
          <div className={`absolute inset-0 ${powerStyles.glass} pointer-events-none`} />
          
          {/* Ornate border decorative elements */}
          <div className="ornate-border-corner" style={{ borderColor: powerStyles.border.replace('border-', '') }} />
          
          <button 
            onClick={onSelect} 
            className="w-full text-left p-4 relative z-10"
          >
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Character Avatar with ornate frame */}
                  <div className={`relative w-12 h-12 rounded-full ${isSelected ? 'bg-green-500/30 ring-2 ring-green-400' : powerStyles.bg} flex items-center justify-center border-2 ${powerStyles.border} ${isSelected ? 'animate-pulse-glow' : ''} ${getHoverEffects('medium')}`}>
                    <Users className={`w-6 h-6 ${isSelected ? 'text-green-400' : powerStyles.textAccent}`} />
                    {isSelected && (
                      <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className={`font-bold text-white flex items-center gap-2 text-shadow-soft ${getTextGradient(rarityLevel === 'Mythic' ? 'orange' : rarityLevel === 'Legendary' ? 'orange' : 'blue')}`}>
                      {character.name}
                      {character.isSnapshot && (
                        <CheckCircle className="w-4 h-4 text-green-400 animate-pulse" title="Saved Snapshot" />
                      )}
                    </div>
                    <div className="text-[10px] uppercase opacity-80 text-slate-300 font-semibold tracking-wider">
                      {character.class} {character.role && `• ${character.role}`}
                    </div>
                  </div>
                </div>
                
                {/* Power Level Badge - WoW-style ornate frame */}
                <div className={`relative px-3 py-1.5 rounded-lg ${powerStyles.bg} ${powerStyles.border} border-2 ${powerStyles.glow} ${getHoverEffects('light')}`}>
                  <div className="flex items-center gap-1.5">
                    <Zap className={`w-4 h-4 ${powerStyles.textAccent} ${badgeData.powerLevel >= 500 ? 'animate-pulse' : ''}`} />
                    <span className={`font-bold ${powerStyles.textAccent} text-sm`}>
                      {badgeData.powerLevel}
                    </span>
                  </div>
                  {badgeData.powerLevel >= 750 && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  )}
                </div>
              </div>

              {/* Badges Row - Modern pill design */}
              <div className="flex flex-wrap gap-2 mb-3">
                {badgeData.callbacks > 0 && (
                  <div className={getBadgeStyles('pill', 'purple')}>
                    <Target className="w-3 h-3" />
                    <span>{badgeData.callbacks}</span>
                  </div>
                )}
                {badgeData.memories > 0 && (
                  <div className={getBadgeStyles('pill', 'blue')}>
                    <Heart className="w-3 h-3" />
                    <span>{badgeData.memories}</span>
                  </div>
                )}
                {badgeData.plotBeats > 0 && (
                  <div className={getBadgeStyles('pill', 'red')}>
                    <TrendingUp className="w-3 h-3" />
                    <span>{badgeData.plotBeats}</span>
                  </div>
                )}
                {badgeData.storylines > 0 && (
                  <div className={getBadgeStyles('pill', 'yellow')}>
                    <Clock className="w-3 h-3" />
                    <span>{badgeData.storylines}</span>
                  </div>
                )}
                {badgeData.aiSuggestions > 0 && (
                  <div className={getBadgeStyles('pill', 'blue')}>
                    <Sparkles className="w-3 h-3" />
                    <span>{badgeData.aiSuggestions}</span>
                  </div>
                )}
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2 text-xs text-slate-300 animate-fade-in-up">
                  {character.description && (
                    <div className="line-clamp-2 opacity-90">{character.description.substring(0, 100)}...</div>
                  )}
                  {character.biography && (
                    <div className="line-clamp-2 opacity-90">{character.biography.substring(0, 100)}...</div>
                  )}
                  <div className="flex items-center gap-3 text-[10px] pt-2">
                    {badgeData.callbacks > 0 && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-purple-400" />
                        {badgeData.callbacks} Callbacks
                      </span>
                    )}
                    {badgeData.memories > 0 && (
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-blue-400" />
                        {badgeData.memories} Memories
                      </span>
                    )}
                    {badgeData.plotBeats > 0 && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-red-400" />
                        {badgeData.plotBeats} Beats
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Expand/Collapse Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className={`mt-2 ${powerStyles.textAccent} hover:text-white text-[10px] flex items-center gap-1 ${getHoverEffects('light')} font-semibold`}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Less Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    More Details
                  </>
                )}
              </button>
            </div>
          </button>
        </div>
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }} 
            className={`glass-medium border-2 border-red-800/50 px-3 py-2 rounded-r-lg hover:bg-red-900/30 hover:text-red-400 hover:border-red-600 cursor-pointer ${getHoverEffects('medium')} text-red-500`}
          >
            <Trash2 className="w-4 h-4"/>
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedCharacterCard;

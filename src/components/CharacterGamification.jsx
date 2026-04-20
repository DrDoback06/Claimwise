/**
 * Character Gamification Component
 * Achievement badges, power levels, completion percentages, stat-based indicators
 */

import React, { useState, useEffect } from 'react';
import { Award, Zap, Target, TrendingUp, Star, CheckCircle, Users, Heart, Trophy, Medal } from 'lucide-react';
import db from '../services/database';
import { getPowerLevelStyles, getCardContainerStyles, getProgressBarStyles, getBadgeStyles, getHoverEffects, getTextGradient } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const CharacterGamification = ({ character, worldState }) => {
  const [gamificationData, setGamificationData] = useState({
    achievements: [],
    powerLevel: 0,
    completionPercentages: {
      arc: 0,
      stats: 0,
      relationships: 0
    },
    statIndicators: {},
    progressBars: {}
  });

  useEffect(() => {
    calculateGamificationData();
  }, [character, worldState]);

  /**
   * Calculate all gamification metrics
   */
  const calculateGamificationData = async () => {
    try {
      // Calculate power level
      const powerLevel = calculatePowerLevel(character, worldState);

      // Calculate completion percentages
      const arcCompletion = character.arcMilestones?.overallCompletion || 0;
      const statsCompletion = calculateStatsCompletion(character, worldState);
      const relationshipsCompletion = await calculateRelationshipsCompletion(character);

      // Get achievements
      const achievements = await calculateAchievements(character, worldState);

      // Calculate stat indicators
      const statIndicators = calculateStatIndicators(character, worldState);

      // Progress bars
      const progressBars = {
        arc: arcCompletion,
        stats: statsCompletion,
        relationships: relationshipsCompletion,
        skills: calculateSkillsProgress(character, worldState),
        items: calculateItemsProgress(character, worldState)
      };

      setGamificationData({
        achievements,
        powerLevel,
        completionPercentages: {
          arc: arcCompletion,
          stats: statsCompletion,
          relationships: relationshipsCompletion
        },
        statIndicators,
        progressBars
      });
    } catch (error) {
      console.error('Error calculating gamification data:', error);
    }
  };

  /**
   * Calculate power level
   */
  const calculatePowerLevel = (char, worldState) => {
    if (!char.baseStats || !worldState?.statRegistry) return 0;
    
    const coreStats = worldState.statRegistry.filter(s => s.isCore);
    let totalPower = 0;
    
    coreStats.forEach(stat => {
      const value = char.baseStats[stat.key] || 0;
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
   * Calculate stats completion
   */
  const calculateStatsCompletion = (char, worldState) => {
    if (!worldState?.statRegistry) return 0;
    const stats = worldState.statRegistry;
    const maxPossible = stats.length * 100; // Assuming 100 is max per stat
    const currentTotal = stats.reduce((sum, stat) => {
      return sum + (char.baseStats?.[stat.key] || 0);
    }, 0);
    return Math.min(100, Math.round((currentTotal / maxPossible) * 100));
  };

  /**
   * Calculate relationships completion
   */
  const calculateRelationshipsCompletion = async (char) => {
    try {
      const allRelationships = await db.getAll('relationships') || [];
      const characterRelationships = allRelationships.filter(rel => 
        rel.actor1Id === char.id || rel.actor2Id === char.id
      );
      // Completion based on number of relationships (assuming 10 is "complete")
      return Math.min(100, (characterRelationships.length / 10) * 100);
    } catch (error) {
      return 0;
    }
  };

  /**
   * Calculate achievements
   */
  const calculateAchievements = async (char, worldState) => {
    const achievements = [];

    // Power Level Achievements
    const powerLevel = calculatePowerLevel(char, worldState);
    if (powerLevel >= 1000) achievements.push({ id: 'power_mythic', name: 'Mythic Power', icon: Zap, color: 'red' });
    else if (powerLevel >= 750) achievements.push({ id: 'power_legendary', name: 'Legendary Power', icon: Zap, color: 'orange' });
    else if (powerLevel >= 500) achievements.push({ id: 'power_epic', name: 'Epic Power', icon: Zap, color: 'purple' });
    else if (powerLevel >= 250) achievements.push({ id: 'power_rare', name: 'Rare Power', icon: Zap, color: 'blue' });

    // Arc Completion
    const arcCompletion = char.arcMilestones?.overallCompletion || 0;
    if (arcCompletion >= 100) achievements.push({ id: 'arc_complete', name: 'Arc Master', icon: Target, color: 'green' });
    else if (arcCompletion >= 75) achievements.push({ id: 'arc_advanced', name: 'Arc Advanced', icon: Target, color: 'blue' });

    // Relationship Achievements
    try {
      const allRelationships = await db.getAll('relationships') || [];
      const relationshipCount = allRelationships.filter(rel => 
        rel.actor1Id === char.id || rel.actor2Id === char.id
      ).length;
      if (relationshipCount >= 10) achievements.push({ id: 'social_butterfly', name: 'Social Butterfly', icon: Users, color: 'pink' });
      if (relationshipCount >= 5) achievements.push({ id: 'well_connected', name: 'Well Connected', icon: Heart, color: 'pink' });
    } catch (e) {}

    // Skill Achievements
    if (char.activeSkills && char.activeSkills.length >= 10) {
      achievements.push({ id: 'skill_master', name: 'Skill Master', icon: Star, color: 'yellow' });
    }

    return achievements;
  };

  /**
   * Calculate stat indicators
   */
  const calculateStatIndicators = (char, worldState) => {
    if (!char.baseStats || !worldState?.statRegistry) return {};
    
    const indicators = {};
    const coreStats = worldState.statRegistry.filter(s => s.isCore);
    
    coreStats.forEach(stat => {
      const value = char.baseStats[stat.key] || 0;
      const maxValue = 100; // Assuming max
      const percentage = (value / maxValue) * 100;
      
      indicators[stat.key] = {
        value,
        percentage,
        level: percentage >= 80 ? 'max' : percentage >= 60 ? 'high' : percentage >= 40 ? 'medium' : 'low'
      };
    });

    return indicators;
  };

  /**
   * Calculate skills progress
   */
  const calculateSkillsProgress = (char, worldState) => {
    if (!char.activeSkills) return 0;
    const totalSkills = worldState?.skillBank?.length || 1;
    return Math.min(100, Math.round((char.activeSkills.length / totalSkills) * 100));
  };

  /**
   * Calculate items progress
   */
  const calculateItemsProgress = (char, worldState) => {
    if (!char.inventory) return 0;
    const totalItems = worldState?.itemBank?.length || 1;
    return Math.min(100, Math.round((char.inventory.length / totalItems) * 100));
  };

  /**
   * Get power level color
   */
  const powerStyles = getPowerLevelStyles(gamificationData.powerLevel);
  const rarityLevel = gamificationData.powerLevel >= 1000 ? 'Mythic' : 
                     gamificationData.powerLevel >= 750 ? 'Legendary' :
                     gamificationData.powerLevel >= 500 ? 'Epic' :
                     gamificationData.powerLevel >= 250 ? 'Rare' : 'Common';

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-300 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <span className="text-shadow-soft">Gamification</span>
      </div>

      {/* Power Level - Large ornate display */}
      <div className={`${getCardContainerStyles(rarityLevel, 'character')} ${powerStyles.glow} relative overflow-hidden`}>
        {/* Gradient overlay */}
        <div className={`absolute inset-0 ${powerStyles.bgGradient} opacity-50 pointer-events-none`} />
        
        {/* Glassmorphism background */}
        <div className={`absolute inset-0 ${powerStyles.glass} pointer-events-none`} />
        
        {/* Ornate border decorative elements */}
        <div className="ornate-border-corner" style={{ borderColor: powerStyles.border.replace('border-', '') }} />
        
        {/* Shimmer effect for legendary+ */}
        {(rarityLevel === 'Legendary' || rarityLevel === 'Mythic') && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
        )}
        
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl ${powerStyles.bg} border-4 ${powerStyles.border} flex items-center justify-center ${powerStyles.glow} ${gamificationData.powerLevel >= 500 ? 'animate-pulse-glow' : ''}`}>
                <Zap className={`w-8 h-8 ${powerStyles.textAccent}`} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-1">Power Level</div>
                <div className={`text-4xl font-bold ${getTextGradient(rarityLevel === 'Mythic' ? 'orange' : rarityLevel === 'Legendary' ? 'orange' : 'blue')} text-shadow-glow`}>
                  {gamificationData.powerLevel}
                </div>
              </div>
            </div>
            <div className={getBadgeStyles('pill', rarityLevel === 'Mythic' ? 'red' : rarityLevel === 'Legendary' ? 'orange' : rarityLevel === 'Epic' ? 'purple' : rarityLevel === 'Rare' ? 'blue' : 'slate')}>
              {rarityLevel}
            </div>
          </div>
          <div className="text-xs text-slate-300 opacity-80">
            Composite score based on stats, equipment, and skills
          </div>
        </div>
      </div>

      {/* Completion Percentages - Modern cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Arc</div>
            <div className={`text-2xl font-bold ${getTextGradient('purple')}`}>{gamificationData.completionPercentages.arc}%</div>
          </div>
          <div className={getProgressBarStyles('Epic', true).container}>
            <div
              className={getProgressBarStyles('Epic', true).fill}
              style={{ width: `${gamificationData.completionPercentages.arc}%` }}
            />
          </div>
        </div>
        <div className={`${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Stats</div>
            <div className={`text-2xl font-bold ${getTextGradient('green')}`}>{gamificationData.completionPercentages.stats}%</div>
          </div>
          <div className={getProgressBarStyles('Common', true).container}>
            <div
              className={getProgressBarStyles('Common', true).fill}
              style={{ width: `${gamificationData.completionPercentages.stats}%` }}
            />
          </div>
        </div>
        <div className={`${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Relations</div>
            <div className={`text-2xl font-bold ${getTextGradient('blue')}`}>{gamificationData.completionPercentages.relationships}%</div>
          </div>
          <div className={getProgressBarStyles('Rare', true).container}>
            <div
              className={getProgressBarStyles('Rare', true).fill}
              style={{ width: `${gamificationData.completionPercentages.relationships}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievements */}
      {gamificationData.achievements.length > 0 && (
        <div className="bg-slate-900 rounded p-4 border border-slate-700">
          <div className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            ACHIEVEMENTS ({gamificationData.achievements.length})
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {gamificationData.achievements.map((achievement, idx) => {
              const Icon = achievement.icon || Award;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded border ${getPowerLevelStyles(100).text.replace('text-', 'border-')} bg-slate-800/50 flex items-center gap-2`}
                >
                  <Icon className={`w-4 h-4 text-${achievement.color}-400`} />
                  <div className="text-xs text-white">{achievement.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stat Indicators - Modern cards */}
      {Object.keys(gamificationData.statIndicators).length > 0 && (
        <div className={`${getCardContainerStyles('Common', 'quest')} p-5`}>
          <div className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-shadow-soft">Stat Indicators</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(gamificationData.statIndicators).map(([stat, data]) => {
              const levelColor = data.level === 'max' ? 'green' :
                                data.level === 'high' ? 'blue' :
                                data.level === 'medium' ? 'yellow' : 'red';
              return (
                <div key={stat} className={`glass-medium rounded-lg p-3 border border-slate-700/50 ${getHoverEffects('light')}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">{stat}</div>
                    <div className={`text-lg font-bold ${getTextGradient(levelColor)}`}>
                      {data.value}
                    </div>
                  </div>
                  <div className={getProgressBarStyles(levelColor === 'green' ? 'Epic' : levelColor === 'blue' ? 'Rare' : 'Common', true).container}>
                    <div
                      className={getProgressBarStyles(levelColor === 'green' ? 'Epic' : levelColor === 'blue' ? 'Rare' : 'Common', true).fill}
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Bars - Modern tracking */}
      <div className={`${getCardContainerStyles('Common', 'quest')} p-5`}>
        <div className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
          <Target className="w-5 h-5 text-green-400" />
          <span className="text-shadow-soft">Progress Tracking</span>
        </div>
        <div className="space-y-4">
          {Object.entries(gamificationData.progressBars).map(([key, value]) => {
            const progressRarity = value >= 90 ? 'Epic' : value >= 70 ? 'Rare' : 'Common';
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider capitalize">{key}</div>
                  <div className={`text-sm font-bold ${getTextGradient(progressRarity === 'Epic' ? 'purple' : 'blue')}`}>
                    {value}%
                  </div>
                </div>
                <div className={getProgressBarStyles(progressRarity, true).container}>
                  <div
                    className={getProgressBarStyles(progressRarity, true).fill}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CharacterGamification;

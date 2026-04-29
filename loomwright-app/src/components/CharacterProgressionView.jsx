/**
 * Character Progression View
 * Multiple view modes: Timeline, Chart, Gamified
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Clock, Award, Zap, Users, Calendar, BarChart3, 
  Gamepad2, ChevronRight, ChevronLeft, Target, Star
} from 'lucide-react';
import db from '../services/database';
import { getCardContainerStyles, getHoverEffects, getTextGradient, getProgressBarStyles } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const CharacterProgressionView = ({ character, books, worldState }) => {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'chart' | 'gamified'
  const [progressionData, setProgressionData] = useState({
    timelineEvents: [],
    statChanges: [],
    equipmentChanges: [],
    skillAcquisitions: [],
    relationshipChanges: [],
    milestones: []
  });

  useEffect(() => {
    loadProgressionData();
  }, [character]);

  /**
   * Load progression data from extracted manuscript intelligence
   */
  const loadProgressionData = async () => {
    try {
      // Load timeline events
      const allEvents = await db.getAll('timelineEvents') || [];
      const characterEvents = allEvents.filter(evt => 
        evt.actors?.includes(character.name) ||
        evt.character === character.name ||
        evt.characterId === character.id
      );

      // Load stat changes
      const statChanges = [];
      if (character.snapshots) {
        Object.entries(character.snapshots).forEach(([key, snapshot]) => {
          const [bookId, chapterId] = key.split('_');
          if (snapshot.baseStats) {
            statChanges.push({
              bookId: parseInt(bookId),
              chapterId: parseInt(chapterId),
              stats: snapshot.baseStats,
              timestamp: snapshot.timestamp || Date.now()
            });
          }
        });
      }

      // Load equipment changes from timeline events
      const equipmentChanges = characterEvents.filter(evt => 
        evt.type === 'item_event' || evt.type === 'inventory'
      );

      // Load skill acquisitions
      const skillChanges = characterEvents.filter(evt => 
        evt.type === 'skill_event'
      );

      // Load relationship changes
      const relationshipChanges = characterEvents.filter(evt => 
        evt.type === 'relationship_change'
      );

      // Identify milestones
      const milestones = identifyMilestones(characterEvents, statChanges);

      setProgressionData({
        timelineEvents: characterEvents.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)),
        statChanges: statChanges.sort((a, b) => a.timestamp - b.timestamp),
        equipmentChanges: equipmentChanges.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)),
        skillAcquisitions: skillChanges.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)),
        relationshipChanges: relationshipChanges.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)),
        milestones
      });
    } catch (error) {
      console.error('Error loading progression data:', error);
    }
  };

  /**
   * Identify significant milestones
   */
  const identifyMilestones = (events, statChanges) => {
    const milestones = [];
    
    // First appearance
    if (events.length > 0) {
      const firstEvent = events[0];
      milestones.push({
        type: 'first_appearance',
        label: 'First Appearance',
        event: firstEvent,
        icon: Users
      });
    }

    // Major stat increases
    statChanges.forEach((change, index) => {
      if (index > 0) {
        const prev = statChanges[index - 1];
        const majorIncrease = Object.keys(change.stats).some(stat => 
          (change.stats[stat] || 0) - (prev.stats[stat] || 0) > 10
        );
        if (majorIncrease) {
          milestones.push({
            type: 'stat_boost',
            label: 'Major Stat Increase',
            event: change,
            icon: TrendingUp
          });
        }
      }
    });

      // Skill unlocks (will be populated when data loads)
      if (progressionData && progressionData.skillAcquisitions) {
        progressionData.skillAcquisitions.forEach(skill => {
          milestones.push({
            type: 'skill_unlock',
            label: `Learned: ${skill.title || 'New Skill'}`,
            event: skill,
            icon: Zap
          });
        });
      }

    return milestones;
  };

  /**
   * Get chapter info
   */
  const getChapterInfo = (bookId, chapterId) => {
    if (!books || !books[bookId]) return null;
    const book = books[bookId];
    const chapter = book.chapters?.find(ch => ch.id === chapterId);
    return chapter ? { book, chapter } : null;
  };

  /**
   * Timeline View
   */
  const renderTimelineView = () => {
    const allEvents = [
      ...progressionData.timelineEvents,
      ...progressionData.statChanges.map(sc => ({ ...sc, type: 'stat_change' })),
      ...progressionData.equipmentChanges,
      ...progressionData.skillAcquisitions,
      ...progressionData.relationshipChanges
    ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    return (
      <div className="space-y-4">
        <div className="text-xs text-slate-400 font-bold mb-2">CHRONOLOGICAL PROGRESSION</div>
        {allEvents.map((event, index) => {
          const chapterInfo = getChapterInfo(event.bookId, event.chapterId);
          return (
            <div key={index} className="flex gap-4 p-3 bg-slate-800/50 rounded border border-slate-700">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-bold text-white">{event.title || event.type || 'Event'}</div>
                  {chapterInfo && (
                    <div className="text-xs text-slate-400">
                      {chapterInfo.book.title} • Ch {chapterInfo.chapter.number}
                    </div>
                  )}
                </div>
                {event.description && (
                  <div className="text-xs text-slate-400 mb-2">{event.description}</div>
                )}
                {event.type === 'stat_change' && event.stats && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(event.stats).map(([stat, value]) => (
                      <div key={stat} className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded">
                        {stat}: {value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {allEvents.length === 0 && (
          <div className="text-center text-slate-500 p-8">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No progression data found</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Chart View - Modern gradient-filled charts
   */
  const renderChartView = () => {
    const coreStats = worldState?.statRegistry?.filter(s => s.isCore) || [];
    
    return (
      <div className="space-y-6">
        <div className="text-sm text-slate-300 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-400" />
          <span className="text-shadow-soft">Stat Progression Charts</span>
        </div>
        {coreStats.map((stat, statIdx) => {
          const statHistory = progressionData.statChanges.map(sc => ({
            value: sc.stats[stat.key] || 0,
            timestamp: sc.timestamp,
            chapterId: sc.chapterId
          }));

          if (statHistory.length === 0) return null;

          const maxValue = Math.max(...statHistory.map(h => h.value), 100);
          const minValue = Math.min(...statHistory.map(h => h.value), 0);
          const currentValue = statHistory[statHistory.length - 1]?.value || 0;

          return (
            <div 
              key={stat.key} 
              className={`${getCardContainerStyles('Common', 'quest')} p-5 ${getHoverEffects('medium')} animate-fade-in-up`}
              style={{ animationDelay: `${statIdx * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-900/30 border-2 border-blue-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white text-shadow-soft uppercase tracking-wider">
                      {stat.key}
                    </div>
                    <div className="text-xs text-slate-400">Progression over time</div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getTextGradient('green')}`}>
                  {currentValue}
                </div>
              </div>
              
              {/* Modern Chart Container */}
              <div className="relative h-40 glass-light rounded-lg p-3 border border-slate-700/50">
                {/* Gradient-filled bar chart */}
                <div className="absolute inset-0 flex items-end gap-1 p-3">
                  {statHistory.map((h, i) => {
                    const height = ((h.value - minValue) / (maxValue - minValue || 1)) * 100;
                    const gradient = h.value >= maxValue * 0.8 ? 'from-green-500 to-emerald-400' :
                                    h.value >= maxValue * 0.5 ? 'from-blue-500 to-cyan-400' :
                                    'from-purple-500 to-pink-400';
                    return (
                      <div
                        key={i}
                        className={`flex-1 bg-gradient-to-t ${gradient} rounded-t ${getHoverEffects('light')} transition-all hover:brightness-110`}
                        style={{ height: `${height}%` }}
                        title={`${stat.key}: ${h.value}`}
                      />
                    );
                  })}
                </div>
                
                {/* Line overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id={`gradient-${stat.key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" />
                      <stop offset="100%" stopColor="rgba(34, 197, 94, 0.2)" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="url(#gradient-${stat.key})"
                    strokeWidth="3"
                    points={statHistory.map((h, i) => {
                      const x = (i / (statHistory.length - 1 || 1)) * 100;
                      const y = 100 - ((h.value - minValue) / (maxValue - minValue || 1)) * 100;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                </svg>
              </div>
            </div>
          );
        })}
        {coreStats.length === 0 && (
          <div className="text-center text-slate-400 p-12 glass-medium rounded-lg border border-slate-700/50">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50 animate-float" />
            <p className="text-sm font-semibold">No stat data available</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Gamified View - Achievement-style cards with unlock animations
   */
  const renderGamifiedView = () => {
    const characterLevel = Math.floor(progressionData.milestones.length / 5) + 1;
    const levelProgress = (progressionData.milestones.length % 5) * 20;
    
    return (
      <div className="space-y-6">
        <div className="text-sm text-slate-300 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-green-400" />
          <span className="text-shadow-soft">Level-Up Milestones</span>
        </div>
        
        {/* Level Progress - Large ornate display */}
        <div className={`${getCardContainerStyles('Common', 'quest')} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-green-900/30 border-4 border-green-500 flex items-center justify-center animate-pulse-glow">
                <Gamepad2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-1">Character Level</div>
                <div className={`text-4xl font-bold ${getTextGradient('green')} text-shadow-glow`}>
                  {characterLevel}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getTextGradient('blue')}`}>
                {levelProgress}%
              </div>
              <div className="text-xs text-slate-400">to next level</div>
            </div>
          </div>
          <div className={getProgressBarStyles('Epic', true).container}>
            <div
              className={getProgressBarStyles('Epic', true).fill}
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {progressionData.milestones.length % 5} / 5 milestones to next level
          </div>
        </div>

        {/* Milestones - Achievement-style cards */}
        <div className="space-y-3">
          {progressionData.milestones.map((milestone, index) => {
            const Icon = milestone.icon || Award;
            const chapterInfo = getChapterInfo(milestone.event?.bookId, milestone.event?.chapterId);
            
            return (
              <div
                key={milestone.id || `milestone-${index}`}
                className={`${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')} animate-unlock`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-900/30 border-2 border-green-500 flex items-center justify-center animate-pulse-glow">
                    <Icon className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white mb-1 text-shadow-soft">
                      {milestone.label}
                    </div>
                    {chapterInfo && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {chapterInfo.book.title} • Chapter {chapterInfo.chapter.number}
                      </div>
                    )}
                  </div>
                  <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Achievement Badges - Modern cards */}
        <div className={`${getCardContainerStyles('Common', 'quest')} p-5`}>
          <div className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <span className="text-shadow-soft">Achievements</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {progressionData.skillAcquisitions.length > 0 && (
              <div className={`${getCardContainerStyles('Common', 'quest')} p-4 text-center ${getHoverEffects('medium')}`}>
                <div className="w-12 h-12 rounded-xl bg-blue-900/30 border-2 border-blue-500 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <div className={`text-2xl font-bold ${getTextGradient('blue')}`}>
                  {progressionData.skillAcquisitions.length}
                </div>
                <div className="text-xs text-slate-300 uppercase tracking-wider mt-1">Skills</div>
              </div>
            )}
            {progressionData.equipmentChanges.length > 0 && (
              <div className={`${getCardContainerStyles('Common', 'quest')} p-4 text-center ${getHoverEffects('medium')}`}>
                <div className="w-12 h-12 rounded-xl bg-yellow-900/30 border-2 border-yellow-500 flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-yellow-400" />
                </div>
                <div className={`text-2xl font-bold ${getTextGradient('orange')}`}>
                  {progressionData.equipmentChanges.length}
                </div>
                <div className="text-xs text-slate-300 uppercase tracking-wider mt-1">Items</div>
              </div>
            )}
            {progressionData.relationshipChanges.length > 0 && (
              <div className={`${getCardContainerStyles('Common', 'quest')} p-4 text-center ${getHoverEffects('medium')}`}>
                <div className="w-12 h-12 rounded-xl bg-pink-900/30 border-2 border-pink-500 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-pink-400" />
                </div>
                <div className={`text-2xl font-bold ${getTextGradient('purple')}`}>
                  {progressionData.relationshipChanges.length}
                </div>
                <div className="text-xs text-slate-300 uppercase tracking-wider mt-1">Relations</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Mode Selector - Modern tab switcher */}
      <div className={`${getCardContainerStyles('Common', 'quest')} p-2`}>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${getHoverEffects('medium')} transition-all ${
              viewMode === 'timeline'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            Timeline
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${getHoverEffects('medium')} transition-all ${
              viewMode === 'chart'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Charts
          </button>
          <button
            onClick={() => setViewMode('gamified')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${getHoverEffects('medium')} transition-all ${
              viewMode === 'gamified'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Gamified
          </button>
        </div>
      </div>

      {/* Content - Modern container */}
      <div className={`${getCardContainerStyles('Common', 'quest')} p-6 animate-fade-in-up`}>
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'chart' && renderChartView()}
        {viewMode === 'gamified' && renderGamifiedView()}
      </div>
    </div>
  );
};

export default CharacterProgressionView;

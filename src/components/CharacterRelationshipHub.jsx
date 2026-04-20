/**
 * Character Relationship Hub
 * Multiple visualization modes: Network Graph, Relationship Cards, Evolution Timeline
 */

import React, { useState, useEffect } from 'react';
import { Network, Users, Clock, Heart, TrendingUp, ChevronRight, BookOpen } from 'lucide-react';
import CharacterRelationshipWeb from './CharacterRelationshipWeb';
import db from '../services/database';
import { getCardContainerStyles, getProgressBarStyles, getBadgeStyles, getHoverEffects, getTextGradient } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const CharacterRelationshipHub = ({ character, actors, onActorSelect, books }) => {
  const [viewMode, setViewMode] = useState('network'); // 'network' | 'cards' | 'timeline'
  const [relationships, setRelationships] = useState([]);
  const [relationshipHistory, setRelationshipHistory] = useState([]);

  useEffect(() => {
    loadRelationships();
    loadRelationshipHistory();
  }, [character]);

  /**
   * Load relationships
   */
  const loadRelationships = async () => {
    try {
      const allRelationships = await db.getAll('relationships') || [];
      const characterRelationships = allRelationships.filter(rel => 
        rel.actor1Id === character.id || rel.actor2Id === character.id
      );

      // Enrich with actor names
      const enriched = characterRelationships.map(rel => {
        const otherActorId = rel.actor1Id === character.id ? rel.actor2Id : rel.actor1Id;
        const otherActor = actors.find(a => a.id === otherActorId);
        return {
          ...rel,
          otherActor,
          otherActorName: otherActor?.name || 'Unknown'
        };
      });

      setRelationships(enriched);
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  /**
   * Load relationship history from timeline events
   */
  const loadRelationshipHistory = async () => {
    try {
      const allEvents = await db.getAll('timelineEvents') || [];
      const relationshipEvents = allEvents.filter(evt => 
        evt.type === 'relationship_change' &&
        evt.actors?.includes(character.name)
      ).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      setRelationshipHistory(relationshipEvents);
    } catch (error) {
      console.error('Error loading relationship history:', error);
    }
  };

  /**
   * Get relationship strength color
   */
  const getStrengthColor = (strength) => {
    if (strength >= 80) return 'text-green-400 border-green-500';
    if (strength >= 60) return 'text-blue-400 border-blue-500';
    if (strength >= 40) return 'text-yellow-400 border-yellow-500';
    if (strength >= 20) return 'text-orange-400 border-orange-500';
    return 'text-red-400 border-red-500';
  };

  /**
   * Get relationship type icon
   */
  const getTypeIcon = (type) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('romance') || typeLower.includes('love')) return Heart;
    if (typeLower.includes('friend') || typeLower.includes('ally')) return Users;
    if (typeLower.includes('enemy') || typeLower.includes('rival')) return TrendingUp;
    return Network;
  };

  /**
   * Network Graph View
   */
  const renderNetworkView = () => {
    return (
      <CharacterRelationshipWeb
        actor={character}
        actors={actors}
        onActorSelect={onActorSelect}
      />
    );
  };

  /**
   * Relationship Cards View - Modern cards
   */
  const renderCardsView = () => {
    return (
      <div className="space-y-4">
        <div className="text-sm text-slate-300 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-shadow-soft">Relationship Cards</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relationships.map((rel, idx) => {
            const TypeIcon = getTypeIcon(rel.type);
            const strength = rel.strength || 50;
            const strengthColor = getStrengthColor(strength);
            const strengthLevel = strength >= 80 ? 'Epic' : strength >= 60 ? 'Rare' : 'Common';

            return (
              <div
                key={rel.id || `rel-${idx}`}
                className={`${getCardContainerStyles('Common', 'quest')} p-5 ${getHoverEffects('medium')} cursor-pointer animate-fade-in-up`}
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => onActorSelect?.(rel.otherActorId)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${strengthColor.replace('text-', 'bg-').replace('-400', '-900/30')} border-2 ${strengthColor.replace('text-', 'border-')} flex items-center justify-center ${getHoverEffects('light')}`}>
                      <TypeIcon className={`w-6 h-6 ${strengthColor.replace('text-', 'text-')}`} />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white text-shadow-soft">
                        {rel.otherActorName}
                      </div>
                      <div className="text-xs text-slate-300 uppercase tracking-wider capitalize">
                        {rel.type || 'Unknown Relationship'}
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${getTextGradient(strength >= 80 ? 'green' : strength >= 60 ? 'blue' : 'yellow')}`}>
                    {strength}%
                  </div>
                </div>
                {rel.description && (
                  <div className="text-xs text-slate-300 mb-4 leading-relaxed opacity-90">
                    {rel.description}
                  </div>
                )}
                {/* Strength Meter - Modern gradient */}
                <div className={getProgressBarStyles(strengthLevel, true).container}>
                  <div
                    className={getProgressBarStyles(strengthLevel, true).fill}
                    style={{ width: `${strength}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {relationships.length === 0 && (
          <div className="text-center text-slate-400 p-12 glass-medium rounded-lg border border-slate-700/50">
            <Network className="w-12 h-12 mx-auto mb-3 opacity-50 animate-float" />
            <p className="text-sm font-semibold">No relationships found</p>
            <p className="text-xs text-slate-500 mt-1">Relationships will appear here once extracted from manuscripts</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Evolution Timeline View
   */
  const renderTimelineView = () => {
    return (
      <div className="space-y-4">
        <div className="text-xs text-slate-400 font-bold mb-2">RELATIONSHIP EVOLUTION</div>
        <div className="space-y-3">
          {relationshipHistory.map((event, idx) => {
            const chapterInfo = getChapterInfo(event.bookId, event.chapterId);
            const otherActors = event.actors?.filter(name => name !== character.name) || [];

            return (
              <div key={idx} className="flex gap-4 p-3 bg-slate-800/50 rounded border border-slate-700">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-bold text-white">{event.title || 'Relationship Change'}</div>
                    {chapterInfo && (
                      <div className="text-xs text-slate-400">
                        {chapterInfo.book.title} • Ch {chapterInfo.chapter.number}
                      </div>
                    )}
                  </div>
                  {event.description && (
                    <div className="text-xs text-slate-300 mb-2">{event.description}</div>
                  )}
                  {otherActors.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {otherActors.map((actorName, i) => (
                        <span key={i} className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                          {actorName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {relationshipHistory.length === 0 && (
          <div className="text-center text-slate-500 p-8">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No relationship history found</p>
          </div>
        )}
      </div>
    );
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

  return (
    <div className="space-y-6">
      {/* View Mode Selector - Modern tab switcher */}
      <div className={`${getCardContainerStyles('Common', 'quest')} p-2`}>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('network')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${getHoverEffects('medium')} transition-all ${
              viewMode === 'network'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Network className="w-4 h-4" />
            Network Graph
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${getHoverEffects('medium')} transition-all ${
              viewMode === 'cards'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            Cards
          </button>
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
        </div>
      </div>

      {/* Content - Modern container */}
      <div className={`${getCardContainerStyles('Common', 'quest')} p-6 animate-fade-in-up`}>
        {viewMode === 'network' && renderNetworkView()}
        {viewMode === 'cards' && renderCardsView()}
        {viewMode === 'timeline' && renderTimelineView()}
      </div>
    </div>
  );
};

export default CharacterRelationshipHub;

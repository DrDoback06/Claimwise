/**
 * Character Storyline Cards Component
 * Displays storylines with progress bars and status indicators
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle, AlertCircle, Play, Pause, Target } from 'lucide-react';
import db from '../services/database';
import { getStatusStyles, getCardContainerStyles, getProgressBarStyles, getBadgeStyles } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const CharacterStorylineCards = ({ character, books }) => {
  const [storylines, setStorylines] = useState([]);

  useEffect(() => {
    loadStorylines();
  }, [character]);

  /**
   * Load storylines involving this character
   */
  const loadStorylines = async () => {
    try {
      const allStorylines = await db.getAll('storylines') || [];
      const characterStorylines = allStorylines.filter(sl => 
        sl.characters?.includes(character.name) ||
        (sl.characterIds && sl.characterIds.includes(character.id))
      );

      // Calculate involvement percentage for each storyline
      const enriched = characterStorylines.map(sl => {
        const totalChapters = sl.relatedChapters?.length || 0;
        const characterChapters = sl.relatedChapters?.filter(chId => {
          // Check if character appears in this chapter
          // This is simplified - in reality would check timeline events
          return true; // Placeholder
        }).length || 0;
        
        const involvement = totalChapters > 0 
          ? Math.round((characterChapters / totalChapters) * 100)
          : 50; // Default if no chapters

        return {
          ...sl,
          involvementPercentage: involvement
        };
      });

      setStorylines(enriched);
    } catch (error) {
      console.error('Error loading storylines:', error);
    }
  };


  /**
   * Get status icon
   */
  const getStatusIcon = (status) => {
    const icons = {
      active: Play,
      ongoing: Play,
      paused: Pause,
      resolved: CheckCircle,
      completed: CheckCircle
    };
    return icons[status] || Play;
  };

  /**
   * Get chapter info - handles both string IDs and object references
   */
  const getChapterInfo = (chapterId) => {
    if (!books) return null;
    
    // Handle if chapterId is already an object
    if (typeof chapterId === 'object' && chapterId !== null) {
      if (chapterId.chapter && chapterId.book) {
        return chapterId;
      }
      // If it's an object with id, extract the id
      if (chapterId.id) {
        chapterId = chapterId.id;
      } else {
        return null;
      }
    }
    
    // Handle string/number IDs
    const idToFind = typeof chapterId === 'string' ? parseInt(chapterId) : chapterId;
    for (const book of Object.values(books)) {
      const chapter = book.chapters?.find(ch => {
        const chId = typeof ch.id === 'string' ? parseInt(ch.id) : ch.id;
        return chId === idToFind;
      });
      if (chapter) return { book, chapter };
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-300 font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-yellow-400" />
        <span className="text-shadow-soft">Active Storylines</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {storylines.map((storyline, idx) => {
          const StatusIcon = getStatusIcon(storyline.status || 'active');
          const statusStyles = getStatusStyles(storyline.status || 'active');
          const uniqueKey = storyline.id || `storyline-${idx}-${storyline.title || 'untitled'}`;
          const cardStyles = getCardContainerStyles('Common', 'quest');
          const progressStyles = getProgressBarStyles('Common', true);

          return (
            <div
              key={uniqueKey}
              className={`${cardStyles} ${statusStyles.glow} relative overflow-hidden animate-fade-in-up`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 ${statusStyles.bg} opacity-40 pointer-events-none`} />
              
              {/* Glassmorphism background */}
              <div className="glass-medium absolute inset-0 pointer-events-none" />
              
              {/* Ornate border decorative elements */}
              <div className="ornate-border-corner" style={{ borderColor: statusStyles.border.replace('border-', '') }} />
              
              <div className="relative z-10 p-5">
                {/* Header - Quest-style */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${statusStyles.bg} border-2 ${statusStyles.border} flex items-center justify-center ${statusStyles.glow} ${getHoverEffects('light')}`}>
                      <BookOpen className={`w-5 h-5 ${statusStyles.icon}`} />
                    </div>
                    <div>
                      <div className={`text-base font-bold text-white text-shadow-soft ${getHoverEffects('light')}`}>
                        {storyline.title || 'Untitled Storyline'}
                      </div>
                      <div className="text-[10px] uppercase opacity-70 text-slate-300 tracking-wider">
                        Storyline Quest
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg ${statusStyles.bg} border ${statusStyles.border}`}>
                    <StatusIcon className={`w-4 h-4 ${statusStyles.icon}`} />
                  </div>
                </div>

                {/* Description */}
                {storyline.description && (
                  <div className="text-sm text-slate-200 mb-4 leading-relaxed opacity-90">
                    {storyline.description}
                  </div>
                )}

                {/* Progress Bar - Modern gradient */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Character Involvement</div>
                    <div className={`text-sm font-bold ${statusStyles.text}`}>{storyline.involvementPercentage}%</div>
                  </div>
                  <div className={progressStyles.container}>
                    <div
                      className={progressStyles.fill}
                      style={{ width: `${storyline.involvementPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Status and Chapters */}
                <div className="flex items-center justify-between mb-3">
                  <div className={getBadgeStyles('pill', storyline.status === 'active' ? 'green' : storyline.status === 'ongoing' ? 'blue' : storyline.status === 'paused' ? 'yellow' : storyline.status === 'completed' ? 'purple' : 'slate')}>
                    <span className="capitalize">{storyline.status || 'active'}</span>
                  </div>
                  {storyline.relatedChapters && storyline.relatedChapters.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-300">
                      <Clock className="w-3 h-3" />
                      <span>{storyline.relatedChapters.length} chapters</span>
                    </div>
                  )}
                </div>

                {/* Related Chapters - Modern pill design */}
                {storyline.relatedChapters && storyline.relatedChapters.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider font-semibold">Related Chapters:</div>
                    <div className="flex flex-wrap gap-2">
                      {storyline.relatedChapters.slice(0, 5).map((chId, i) => {
                        const chapterInfo = getChapterInfo(chId);
                        const chapterKey = typeof chId === 'object' && chId !== null 
                          ? (chId.id || JSON.stringify(chId))
                          : String(chId);
                        const uniqueChapterKey = `${uniqueKey}-chapter-${i}-${chapterKey}`;
                        
                        let chapterDisplay = `Ch ${chId}`;
                        if (chapterInfo && chapterInfo.chapter) {
                          chapterDisplay = `Ch ${chapterInfo.chapter.number || chapterInfo.chapter.id || chId}`;
                        } else if (typeof chId === 'object' && chId !== null && chId.number) {
                          chapterDisplay = `Ch ${chId.number}`;
                        } else if (typeof chId === 'object' && chId !== null && chId.id) {
                          chapterDisplay = `Ch ${chId.id}`;
                        }
                        
                        return (
                          <span
                            key={uniqueChapterKey}
                            className={getBadgeStyles('pill', 'slate')}
                          >
                            {chapterDisplay}
                          </span>
                        );
                      })}
                      {storyline.relatedChapters.length > 5 && (
                        <span className={`${getBadgeStyles('pill', 'slate')} opacity-60`}>
                          +{storyline.relatedChapters.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {storylines.length === 0 && (
        <div className="text-center text-slate-400 p-12 glass-medium rounded-lg border border-slate-700/50">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50 animate-float" />
          <p className="text-sm font-semibold">No storylines found for this character</p>
          <p className="text-xs text-slate-500 mt-1">Storylines will appear here once extracted from manuscripts</p>
        </div>
      )}
    </div>
  );
};

export default CharacterStorylineCards;

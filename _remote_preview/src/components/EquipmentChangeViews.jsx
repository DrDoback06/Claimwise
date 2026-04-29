/**
 * Equipment Change Views Component
 * Timeline, change log, visual progression views
 */

import React, { useState, useEffect } from 'react';
import { Clock, List, TrendingUp, ArrowRight } from 'lucide-react';
import db from '../services/database';
import { getCardContainerStyles, getBadgeStyles, getHoverEffects } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const EquipmentChangeViews = ({ actor, items, books }) => {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'log' | 'progression'
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    loadChanges();
  }, [actor, items, books]);

  /**
   * Load equipment changes from snapshots
   */
  const loadChanges = () => {
    if (!actor?.snapshots || !books) return;

    const changeList = [];
    const booksArray = Array.isArray(books) ? books : Object.values(books || {});

    booksArray.forEach(book => {
      book.chapters?.forEach(chapter => {
        const snapshotKey = `${book.id}_${chapter.id}`;
        const snapshot = actor.snapshots?.[snapshotKey];
        
        if (snapshot?.equipment) {
          changeList.push({
            bookId: book.id,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            equipment: snapshot.equipment,
            timestamp: snapshot.timestamp || Date.now()
          });
        }
      });
    });

    setChanges(changeList.sort((a, b) => a.timestamp - b.timestamp));
  };

  /**
   * Timeline View - Modern timeline
   */
  const renderTimelineView = () => {
    return (
      <div className="space-y-4">
        <div className="relative">
          {/* Timeline connector line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-purple-500 opacity-30" />
          
          {changes.map((change, idx) => {
            const isLast = idx === changes.length - 1;
            return (
              <div key={`change-${idx}`} className="relative flex gap-4 animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                {/* Timeline marker */}
                <div className="flex-shrink-0 relative z-10">
                  <div className={`w-12 h-12 rounded-full ${getCardContainerStyles('Common', 'quest')} border-2 border-green-500 flex items-center justify-center ${getHoverEffects('light')}`}>
                    <div className="w-6 h-6 rounded-full bg-green-500/30 border border-green-400 animate-pulse" />
                  </div>
                </div>
                
                {/* Change card */}
                <div className={`flex-1 ${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')} mb-4`}>
                  <div className="text-sm font-bold text-white mb-1 text-shadow-soft">
                    {change.chapterTitle || `Chapter ${change.chapterId}`}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Book {change.bookId} • Chapter {change.chapterId}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {changes.length === 0 && (
          <div className="text-center text-slate-400 p-12 glass-medium rounded-lg border border-slate-700/50">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50 animate-float" />
            <p className="text-sm font-semibold">No equipment changes found</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Change Log View - Modern cards
   */
  const renderLogView = () => {
    return (
      <div className="space-y-3">
        {changes.map((change, idx) => (
          <div 
            key={`log-${idx}`} 
            className={`${getCardContainerStyles('Common', 'quest')} p-4 ${getHoverEffects('medium')} animate-fade-in-up`}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-white text-shadow-soft">
                {change.chapterTitle || `Chapter ${change.chapterId}`}
              </div>
              <div className={getBadgeStyles('pill', 'green')}>
                Saved
              </div>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
              <Clock className="w-3 h-3" />
              Book {change.bookId} • Chapter {change.chapterId}
            </div>
            <div className="text-xs text-slate-300">
              Equipment snapshot saved
            </div>
          </div>
        ))}
        {changes.length === 0 && (
          <div className="text-center text-slate-400 p-12 glass-medium rounded-lg border border-slate-700/50">
            <List className="w-12 h-12 mx-auto mb-3 opacity-50 animate-float" />
            <p className="text-sm font-semibold">No equipment changes found</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Progression View - Modern cards
   */
  const renderProgressionView = () => {
    return (
      <div className="space-y-4">
        {changes.map((change, idx) => {
          const prevChange = idx > 0 ? changes[idx - 1] : null;
          return (
            <div 
              key={`prog-${idx}`} 
              className={`${getCardContainerStyles('Common', 'quest')} p-5 ${getHoverEffects('medium')} animate-fade-in-up`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold text-white text-shadow-soft">
                  {change.chapterTitle || `Chapter ${change.chapterId}`}
                </div>
                <div className={getBadgeStyles('pill', 'blue')}>
                  Change #{idx + 1}
                </div>
              </div>
              {prevChange && (
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-700/50">
                  <span className={getBadgeStyles('pill', 'slate')}>Before</span>
                  <ArrowRight className="w-4 h-4 text-green-400" />
                  <span className={getBadgeStyles('pill', 'green')}>After</span>
                </div>
              )}
            </div>
          );
        })}
        {changes.length === 0 && (
          <div className="text-center text-slate-400 p-12 glass-medium rounded-lg border border-slate-700/50">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50 animate-float" />
            <p className="text-sm font-semibold">No equipment progression found</p>
          </div>
        )}
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
            onClick={() => setViewMode('log')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${getHoverEffects('medium')} transition-all ${
              viewMode === 'log'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <List className="w-4 h-4" />
            Log
          </button>
          <button
            onClick={() => setViewMode('progression')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${getHoverEffects('medium')} transition-all ${
              viewMode === 'progression'
                ? 'glass-medium border-2 border-green-500/50 text-green-400 bg-green-900/20'
                : 'glass-light border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Progression
          </button>
        </div>
      </div>

      {/* Content - Modern container */}
      <div className={`${getCardContainerStyles('Common', 'quest')} p-6 animate-fade-in-up`}>
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'log' && renderLogView()}
        {viewMode === 'progression' && renderProgressionView()}
      </div>
    </div>
  );
};

export default EquipmentChangeViews;

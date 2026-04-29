/**
 * Character Plot Involvement Section
 * Shows plot beats where character appears
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Clock, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import db from '../services/database';
import { getCardContainerStyles, getBadgeStyles, getHoverEffects, getTextGradient } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const CharacterPlotInvolvement = ({ character, books }) => {
  const [plotBeats, setPlotBeats] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'completed' | 'pending'

  useEffect(() => {
    loadPlotBeats();
  }, [character]);

  /**
   * Load plot beats involving this character
   */
  const loadPlotBeats = async () => {
    try {
      const allBeats = await db.getAll('plotBeats') || [];
      const characterBeats = allBeats.filter(beat => 
        beat.characters?.includes(character.name) ||
        beat.character === character.name ||
        (beat.characterIds && beat.characterIds.includes(character.id))
      ).sort((a, b) => {
        // Sort by importance/priority
        const aImportance = a.importance || a.priority || 0;
        const bImportance = b.importance || b.priority || 0;
        return bImportance - aImportance;
      });

      setPlotBeats(characterBeats);
    } catch (error) {
      console.error('Error loading plot beats:', error);
    }
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
   * Get importance color
   */
  const getImportanceColor = (importance) => {
    if (importance >= 8) return 'text-red-400 border-red-500 bg-red-900/30';
    if (importance >= 6) return 'text-orange-400 border-orange-500 bg-orange-900/30';
    if (importance >= 4) return 'text-yellow-400 border-yellow-500 bg-yellow-900/30';
    return 'text-slate-400 border-slate-500 bg-slate-900/30';
  };

  /**
   * Filter beats
   */
  const filteredBeats = plotBeats.filter(beat => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return beat.completed === true;
    if (filterStatus === 'pending') return beat.completed !== true;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between glass-medium rounded-lg p-3 border border-slate-700/50">
        <div className="text-sm text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2">
          <Target className="w-5 h-5 text-red-400" />
          <span className="text-shadow-soft">Plot Involvement</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="glass-light border border-slate-700/50 text-white text-xs rounded-lg px-3 py-1.5 font-semibold cursor-pointer hover:border-blue-500/50 transition-colors"
        >
          <option value="all">All Beats</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredBeats.map((beat, idx) => {
          const chapterInfo = getChapterInfo(beat.bookId, beat.chapterId);
          const importance = beat.importance || beat.priority || 5;
          const importanceColor = getImportanceColor(importance);
          const cardStyles = getCardContainerStyles('Common', 'quest');
          const colorType = importance >= 8 ? 'red' : importance >= 6 ? 'yellow' : 'slate';

          return (
            <div
              key={beat.id || `beat-${idx}`}
              className={`${cardStyles} p-4 ${getHoverEffects('medium')} animate-fade-in-up`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg ${importanceColor.replace('text-', 'bg-').replace('-400', '-900/30')} border-2 ${importanceColor.replace('text-', 'border-')} flex items-center justify-center`}>
                    <TrendingUp className={`w-5 h-5 ${importanceColor.split(' ')[0]}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white mb-1 text-shadow-soft">
                      {beat.beat || beat.title || 'Plot Beat'}
                    </div>
                    {beat.purpose && (
                      <div className="text-xs text-slate-300 mt-1 opacity-90">{beat.purpose}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {beat.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-400 animate-pulse" title="Completed" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400" title="Pending" />
                  )}
                  <div className={getBadgeStyles('pill', colorType)}>
                    {importance}/10
                  </div>
                </div>
              </div>

              {chapterInfo && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                  <BookOpen className="w-3 h-3" />
                  {chapterInfo.book.title} • Chapter {chapterInfo.chapter.number}
                </div>
              )}

              {beat.characters && beat.characters.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700/50">
                  {beat.characters.filter(c => c !== character.name).map((charName, i) => (
                    <span key={i} className={getBadgeStyles('pill', 'blue')}>
                      {charName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredBeats.length === 0 && (
        <div className="text-center text-slate-400 p-12 glass-medium rounded-lg border border-slate-700/50">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50 animate-float" />
          <p className="text-sm font-semibold">No plot beats found for this character</p>
          <p className="text-xs text-slate-500 mt-1">Plot beats will appear here once extracted from manuscripts</p>
        </div>
      )}
    </div>
  );
};

export default CharacterPlotInvolvement;

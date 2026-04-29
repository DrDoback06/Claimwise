/**
 * Callbacks and Memories Display Component
 * Inline display with highlights for character overview
 */

import React, { useState, useEffect } from 'react';
import { Target, Heart, Clock, ChevronRight, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import db from '../services/database';
import { getCardContainerStyles, getBadgeStyles, getHoverEffects } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const CallbacksAndMemoriesDisplay = ({ character, books }) => {
  const [callbacks, setCallbacks] = useState([]);
  const [memories, setMemories] = useState([]);
  const [expanded, setExpanded] = useState({ callbacks: false, memories: false });

  useEffect(() => {
    loadData();
  }, [character]);

  const loadData = async () => {
    try {
      // Load callbacks
      const allCallbacks = await db.getAll('callbacks') || [];
      const characterCallbacks = allCallbacks.filter(cb => 
        (cb.characters && cb.characters.includes(character.name)) ||
        cb.character === character.name ||
        cb.characterId === character.id
      ).sort((a, b) => (b.importance || 0) - (a.importance || 0));

      // Load memories
      const allMemories = await db.getAll('memories') || [];
      const characterMemories = allMemories.filter(m => 
        (m.characters && m.characters.includes(character.name)) ||
        m.character === character.name ||
        m.characterId === character.id
      ).sort((a, b) => (b.importance || 0) - (a.importance || 0));

      setCallbacks(characterCallbacks);
      setMemories(characterMemories);
    } catch (error) {
      console.warn('Error loading callbacks and memories:', error);
    }
  };

  const getChapterInfo = (bookId, chapterId) => {
    if (!books || !books[bookId]) return null;
    const book = books[bookId];
    const chapter = book.chapters?.find(ch => ch.id === chapterId);
    return chapter ? { book, chapter } : null;
  };

  const getImportanceColor = (importance) => {
    if (importance >= 8) return 'text-red-400 border-red-800';
    if (importance >= 6) return 'text-orange-400 border-orange-800';
    if (importance >= 4) return 'text-yellow-400 border-yellow-800';
    return 'text-slate-400 border-slate-800';
  };

  return (
    <div className="space-y-5">
      {/* Callbacks - Quest-style cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-900/30 border-2 border-purple-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-purple-400 uppercase tracking-wider text-shadow-soft">
                Callback Opportunities
              </span>
              <div className="text-xs text-slate-400">{callbacks.length} available</div>
            </div>
          </div>
          {callbacks.length > 0 && (
            <button
              onClick={() => setExpanded({ ...expanded, callbacks: !expanded.callbacks })}
              className={`text-xs font-semibold ${getBadgeStyles('pill', 'purple')} ${getHoverEffects('light')}`}
            >
              {expanded.callbacks ? 'Show Less' : 'Show All'}
            </button>
          )}
        </div>
        {callbacks.length > 0 ? (
          <div className="space-y-3">
            {(expanded.callbacks ? callbacks : callbacks.slice(0, 3)).map((callback, idx) => {
              const chapterInfo = getChapterInfo(callback.bookId, callback.chapterId);
              const importanceColor = getImportanceColor(callback.importance || 0);
              const cardStyles = getCardContainerStyles('Common', 'quest');
              
              return (
                <div
                  key={callback.id || `callback-${idx}`}
                  className={`${cardStyles} ${getHoverEffects('medium')} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="relative z-10 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className={`w-4 h-4 ${importanceColor.split(' ')[0]}`} />
                          <div className="text-sm font-bold text-white text-shadow-soft">
                            {callback.event || callback.description || 'Callback Event'}
                          </div>
                        </div>
                        {callback.reasoning && (
                          <div className="text-xs text-slate-300 mb-2 leading-relaxed opacity-90">
                            {callback.reasoning}
                          </div>
                        )}
                        {chapterInfo && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                            <BookOpen className="w-3 h-3" />
                            {chapterInfo.book.title} • Ch {chapterInfo.chapter.number}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-3">
                        {callback.used ? (
                          <CheckCircle className="w-5 h-5 text-green-400 animate-pulse" title="Used" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-400" title="Available" />
                        )}
                        <div className={getBadgeStyles('pill', importanceColor.includes('red') ? 'red' : importanceColor.includes('orange') ? 'yellow' : 'slate')}>
                          {callback.importance || 0}/10
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {callbacks.length > 3 && !expanded.callbacks && (
              <div className={`text-center ${getBadgeStyles('pill', 'slate')} opacity-60`}>
                +{callbacks.length - 3} more callbacks
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 p-6 glass-medium rounded-lg border border-slate-700/50">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No callback opportunities found</p>
          </div>
        )}
      </div>

      {/* Memories - Quest-style cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900/30 border-2 border-blue-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-blue-400 uppercase tracking-wider text-shadow-soft">
                Relevant Memories
              </span>
              <div className="text-xs text-slate-400">{memories.length} memories</div>
            </div>
          </div>
          {memories.length > 0 && (
            <button
              onClick={() => setExpanded({ ...expanded, memories: !expanded.memories })}
              className={`text-xs font-semibold ${getBadgeStyles('pill', 'blue')} ${getHoverEffects('light')}`}
            >
              {expanded.memories ? 'Show Less' : 'Show All'}
            </button>
          )}
        </div>
        {memories.length > 0 ? (
          <div className="space-y-3">
            {(expanded.memories ? memories : memories.slice(0, 3)).map((memory, idx) => {
              const chapterInfo = getChapterInfo(memory.bookId, memory.chapterId);
              const importanceColor = getImportanceColor(memory.importance || 0);
              const cardStyles = getCardContainerStyles('Common', 'quest');
              
              return (
                <div
                  key={memory.id || `memory-${idx}`}
                  className={`${cardStyles} ${getHoverEffects('medium')} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="relative z-10 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className={`w-4 h-4 ${importanceColor.split(' ')[0]}`} />
                          <div className="text-sm font-bold text-white text-shadow-soft">
                            {memory.event || memory.description || 'Memory'}
                          </div>
                        </div>
                        {memory.emotionalTone && (
                          <div className={`text-xs mb-2 ${getBadgeStyles('pill', memory.emotionalTone.toLowerCase().includes('sad') ? 'blue' : memory.emotionalTone.toLowerCase().includes('happy') ? 'yellow' : 'purple')}`}>
                            Tone: {memory.emotionalTone}
                          </div>
                        )}
                        {chapterInfo && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                            <BookOpen className="w-3 h-3" />
                            {chapterInfo.book.title} • Ch {chapterInfo.chapter.number}
                          </div>
                        )}
                      </div>
                      <div className={getBadgeStyles('pill', importanceColor.includes('red') ? 'red' : importanceColor.includes('orange') ? 'yellow' : 'slate')}>
                        {memory.importance || 0}/10
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {memories.length > 3 && !expanded.memories && (
              <div className={`text-center ${getBadgeStyles('pill', 'slate')} opacity-60`}>
                +{memories.length - 3} more memories
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 p-6 glass-medium rounded-lg border border-slate-700/50">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No memories found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallbacksAndMemoriesDisplay;

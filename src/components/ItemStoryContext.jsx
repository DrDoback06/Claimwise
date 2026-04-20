/**
 * Item Story Context Section
 * Related storylines/plot beats, significance moments, callback opportunities, quest associations
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Target, Sparkles, AlertCircle } from 'lucide-react';
import db from '../services/database';

const ItemStoryContext = ({ item, books }) => {
  const [storyContext, setStoryContext] = useState({
    storylines: [],
    plotBeats: [],
    callbacks: [],
    quests: []
  });

  useEffect(() => {
    loadStoryContext();
  }, [item]);

  /**
   * Load story context for item
   */
  const loadStoryContext = async () => {
    try {
      // Load storylines
      const allStorylines = await db.getAll('storylines') || [];
      const itemStorylines = allStorylines.filter(sl => 
        sl.items?.includes(item.name) ||
        sl.itemIds?.includes(item.id)
      );

      // Load plot beats
      const allBeats = await db.getAll('plotBeats') || [];
      const itemBeats = allBeats.filter(beat => 
        beat.items?.includes(item.name) ||
        beat.itemIds?.includes(item.id)
      );

      // Load callbacks
      const allCallbacks = await db.getAll('callbacks') || [];
      const itemCallbacks = allCallbacks.filter(cb => 
        cb.items?.includes(item.name) ||
        cb.itemId === item.id
      );

      // Load quests (from item.quests or timeline events)
      const allEvents = await db.getAll('timelineEvents') || [];
      const questEvents = allEvents.filter(evt => 
        evt.type === 'quest_event' &&
        (evt.title?.toLowerCase().includes(item.name.toLowerCase()) ||
         evt.description?.toLowerCase().includes(item.name.toLowerCase()))
      );

      setStoryContext({
        storylines: itemStorylines,
        plotBeats: itemBeats,
        callbacks: itemCallbacks,
        quests: questEvents
      });
    } catch (error) {
      console.error('Error loading story context:', error);
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

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-400 font-bold mb-2">STORY CONTEXT</div>

      {/* Storylines */}
      {storyContext.storylines.length > 0 && (
        <div>
          <div className="text-xs text-cyan-400 font-bold mb-2 flex items-center gap-2">
            <BookOpen className="w-3 h-3" />
            Storylines ({storyContext.storylines.length})
          </div>
          <div className="space-y-2">
            {storyContext.storylines.slice(0, 3).map((sl, idx) => (
              <div key={idx} className="bg-slate-800 rounded p-2 text-xs">
                <div className="text-white font-medium">{sl.title || 'Untitled'}</div>
                {sl.status && (
                  <div className="text-slate-400 mt-1">Status: {sl.status}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plot Beats */}
      {storyContext.plotBeats.length > 0 && (
        <div>
          <div className="text-xs text-red-400 font-bold mb-2 flex items-center gap-2">
            <Target className="w-3 h-3" />
            Plot Beats ({storyContext.plotBeats.length})
          </div>
          <div className="space-y-2">
            {storyContext.plotBeats.slice(0, 3).map((beat, idx) => (
              <div key={idx} className="bg-slate-800 rounded p-2 text-xs">
                <div className="text-white font-medium">{beat.beat || beat.title || 'Plot Beat'}</div>
                {beat.purpose && (
                  <div className="text-slate-400 mt-1">{beat.purpose}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Callbacks */}
      {storyContext.callbacks.length > 0 && (
        <div>
          <div className="text-xs text-yellow-400 font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Callback Opportunities ({storyContext.callbacks.length})
          </div>
          <div className="space-y-2">
            {storyContext.callbacks.slice(0, 3).map((cb, idx) => (
              <div key={idx} className="bg-slate-800 rounded p-2 text-xs">
                <div className="text-white font-medium">{cb.event || cb.description || 'Callback'}</div>
                {cb.importance && (
                  <div className="text-slate-400 mt-1">Importance: {cb.importance}/10</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quests */}
      {storyContext.quests.length > 0 && (
        <div>
          <div className="text-xs text-purple-400 font-bold mb-2 flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            Quest Associations ({storyContext.quests.length})
          </div>
          <div className="space-y-2">
            {storyContext.quests.slice(0, 3).map((quest, idx) => {
              const chapterInfo = getChapterInfo(quest.bookId, quest.chapterId);
              return (
                <div key={idx} className="bg-slate-800 rounded p-2 text-xs">
                  <div className="text-white font-medium">{quest.title || 'Quest Event'}</div>
                  {chapterInfo && (
                    <div className="text-slate-400 mt-1">
                      {chapterInfo.book.title} • Ch {chapterInfo.chapter.number}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {storyContext.storylines.length === 0 && 
       storyContext.plotBeats.length === 0 && 
       storyContext.callbacks.length === 0 && 
       storyContext.quests.length === 0 && (
        <div className="text-center text-slate-500 p-4 text-xs">
          No story context found
        </div>
      )}
    </div>
  );
};

export default ItemStoryContext;

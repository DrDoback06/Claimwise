/**
 * Item Quest Context Section
 * Quest associations, progress indicators, completion status
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import db from '../services/database';

const ItemQuestContext = ({ item, books }) => {
  const [questContext, setQuestContext] = useState([]);

  useEffect(() => {
    loadQuestContext();
  }, [item]);

  /**
   * Load quest context
   */
  const loadQuestContext = async () => {
    try {
      const allEvents = await db.getAll('timelineEvents') || [];
      const questEvents = allEvents.filter(evt => 
        evt.type === 'quest_event' &&
        (evt.title?.toLowerCase().includes(item.name.toLowerCase()) ||
         evt.description?.toLowerCase().includes(item.name.toLowerCase()) ||
         evt.items?.includes(item.name))
      );

      setQuestContext(questEvents);
    } catch (error) {
      console.error('Error loading quest context:', error);
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
    <div className="space-y-3">
      <div className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-purple-400" />
        QUEST CONTEXT ({questContext.length})
      </div>
      {questContext.length > 0 ? (
        <div className="space-y-2">
          {questContext.map((quest, idx) => {
            const chapterInfo = getChapterInfo(quest.bookId, quest.chapterId);
            return (
              <div key={idx} className="bg-slate-800 rounded p-2 text-xs border border-purple-800/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-white font-medium">{quest.title || 'Quest Event'}</div>
                  {quest.completed ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <Clock className="w-3 h-3 text-yellow-500" />
                  )}
                </div>
                {chapterInfo && (
                  <div className="text-slate-400 text-[10px]">
                    {chapterInfo.book.title} • Ch {chapterInfo.chapter.number}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-slate-500 p-4 text-xs">
          No quest associations found
        </div>
      )}
    </div>
  );
};

export default ItemQuestContext;

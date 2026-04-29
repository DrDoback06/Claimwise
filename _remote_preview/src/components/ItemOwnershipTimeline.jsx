/**
 * Item Ownership Timeline Component
 * Visual timeline showing ownership changes
 */

import React, { useState, useEffect } from 'react';
import { Users, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import db from '../services/database';

const ItemOwnershipTimeline = ({ item, books }) => {
  const [ownershipHistory, setOwnershipHistory] = useState([]);

  useEffect(() => {
    loadOwnershipHistory();
  }, [item]);

  /**
   * Load ownership history from timeline events
   */
  const loadOwnershipHistory = async () => {
    try {
      const allEvents = await db.getAll('timelineEvents') || [];
      const itemEvents = allEvents.filter(evt => 
        evt.type === 'item_event' &&
        (evt.title?.toLowerCase().includes(item.name.toLowerCase()) ||
         evt.description?.toLowerCase().includes(item.name.toLowerCase()))
      ).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      // Extract ownership changes
      const history = [];
      itemEvents.forEach((event, idx) => {
        const chapterInfo = getChapterInfo(event.bookId, event.chapterId);
        const actors = event.actors || [];
        
        history.push({
          event,
          chapterInfo,
          actors,
          timestamp: event.timestamp || Date.now(),
          action: event.description || 'Item event'
        });
      });

      setOwnershipHistory(history);
    } catch (error) {
      console.error('Error loading ownership history:', error);
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
      <div className="text-xs text-slate-400 font-bold mb-2">OWNERSHIP TIMELINE</div>
      <div className="space-y-3">
        {ownershipHistory.map((entry, idx) => {
          const chapterInfo = entry.chapterInfo;
          const isLast = idx === ownershipHistory.length - 1;

          return (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                {!isLast && <div className="w-0.5 h-full bg-slate-700 mt-1" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-bold text-white">{entry.action}</div>
                  {chapterInfo && (
                    <div className="text-xs text-slate-400">
                      {chapterInfo.book.title} • Ch {chapterInfo.chapter.number}
                    </div>
                  )}
                </div>
                {entry.actors.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="w-3 h-3 text-slate-400" />
                    <div className="flex flex-wrap gap-1">
                      {entry.actors.map((actorName, i) => (
                        <span key={i} className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                          {actorName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {ownershipHistory.length === 0 && (
        <div className="text-center text-slate-500 p-8">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No ownership history found</p>
        </div>
      )}
    </div>
  );
};

export default ItemOwnershipTimeline;

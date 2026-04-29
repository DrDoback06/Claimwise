/**
 * Skill Acquisition Timeline Component
 * Timeline showing when characters acquired skills
 */

import React, { useState, useEffect } from 'react';
import { Zap, Users, Clock, BookOpen } from 'lucide-react';
import db from '../services/database';

const SkillAcquisitionTimeline = ({ skill, actors, books }) => {
  const [acquisitions, setAcquisitions] = useState([]);

  useEffect(() => {
    loadAcquisitions();
  }, [skill, actors, books]);

  /**
   * Load skill acquisitions from timeline events
   */
  const loadAcquisitions = async () => {
    try {
      const allEvents = await db.getAll('timelineEvents') || [];
      const skillEvents = allEvents.filter(evt => 
        evt.type === 'skill_event' &&
        (evt.title?.toLowerCase().includes(skill.name.toLowerCase()) ||
         evt.description?.toLowerCase().includes(skill.name.toLowerCase()))
      ).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      const acquisitionList = skillEvents.map(event => {
        const chapterInfo = getChapterInfo(event.bookId, event.chapterId);
        const character = event.actors?.[0] 
          ? actors.find(a => a.name === event.actors[0])
          : null;

        return {
          event,
          chapterInfo,
          character,
          timestamp: event.timestamp || Date.now()
        };
      });

      setAcquisitions(acquisitionList);
    } catch (error) {
      console.error('Error loading skill acquisitions:', error);
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
      <div className="text-xs text-slate-400 font-bold mb-2">ACQUISITION TIMELINE</div>
      <div className="space-y-3">
        {acquisitions.map((acq, idx) => {
          const isLast = idx === acquisitions.length - 1;
          return (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                {!isLast && <div className="w-0.5 h-full bg-slate-700 mt-1" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <div className="text-sm font-bold text-white">
                    {acq.character?.name || 'Character'} learned {skill.name}
                  </div>
                </div>
                {acq.chapterInfo && (
                  <div className="text-xs text-slate-400">
                    {acq.chapterInfo.book.title} • Chapter {acq.chapterInfo.chapter.number}
                  </div>
                )}
                {acq.event.description && (
                  <div className="text-xs text-slate-300 mt-1">{acq.event.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {acquisitions.length === 0 && (
        <div className="text-center text-slate-500 p-8">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No acquisition history found</p>
        </div>
      )}
    </div>
  );
};

export default SkillAcquisitionTimeline;

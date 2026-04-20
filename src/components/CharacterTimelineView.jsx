import React, { useState, useMemo } from 'react';
import { Clock, TrendingUp, Package, Users, MapPin, BookOpen, ChevronRight } from 'lucide-react';

/**
 * CharacterTimelineView - Chronological timeline of all character appearances and changes
 */
const CharacterTimelineView = ({ actor, books, items, skills }) => {
  const [selectedEventType, setSelectedEventType] = useState('all'); // 'all' | 'appearance' | 'stat' | 'equipment' | 'skill'
  const [selectedBook, setSelectedBook] = useState('all');

  // Collect all timeline events from chapters
  const timelineEvents = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CharacterTimelineView.jsx:12',message:'Timeline events calculation',data:{hasActor:!!actor,hasActorName:!!actor?.name,hasBooks:!!books},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    if (!actor || !actor.name || !books) return [];

    const events = [];

    // Process all books and chapters
    const booksArray = Array.isArray(books) ? books : Object.values(books || {});
    if (!booksArray || booksArray.length === 0) {
      return [];
    }
    
    booksArray.forEach(book => {
      if (!book || !book.chapters) return;
      
      book.chapters.forEach(chapter => {
        const chapterText = chapter.script || chapter.desc || '';
        const lowerText = chapterText.toLowerCase();
        const actorNameLower = actor.name?.toLowerCase() || '';

        // Check for character appearance
        if (lowerText.includes(actorNameLower)) {
          const mentionCount = (chapterText.match(new RegExp(actorNameLower, 'gi')) || []).length;
          
          events.push({
            type: 'appearance',
            bookId: book.id,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            timestamp: `${book.id}_${chapter.id}`,
            description: `Appeared in Chapter ${chapter.id}`,
            mentionCount,
            bookTitle: `Book ${book.id}`
          });
        }

        // Check for stat changes (from snapshots)
        if (actor.snapshots) {
          const snapshotKey = `${book.id}_${chapter.id}`;
          const snapshot = actor.snapshots[snapshotKey];
          if (snapshot && snapshot.baseStats) {
            const statChanges = Object.entries(snapshot.baseStats)
              .filter(([stat, value]) => {
                const currentValue = actor.baseStats?.[stat] || 0;
                return value !== currentValue;
              })
              .map(([stat, value]) => ({
                stat,
                oldValue: actor.baseStats?.[stat] || 0,
                newValue: value
              }));

            if (statChanges.length > 0) {
              events.push({
                type: 'stat',
                bookId: book.id,
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                timestamp: `${book.id}_${chapter.id}`,
                description: 'Stat changes',
                statChanges,
                bookTitle: `Book ${book.id}`
              });
            }
          }
        }

        // Check for equipment changes (from snapshots)
        if (actor.snapshots) {
          const snapshotKey = `${book.id}_${chapter.id}`;
          const snapshot = actor.snapshots[snapshotKey];
          if (snapshot && snapshot.equipment) {
            const equipmentChanges = [];
            const currentEquipment = actor.equipment || {};
            const snapshotEquipment = snapshot.equipment || {};

            Object.entries(snapshotEquipment).forEach(([slot, itemId]) => {
              if (itemId && currentEquipment[slot] !== itemId) {
                const item = items?.find(i => i.id === itemId);
                equipmentChanges.push({
                  slot,
                  itemId,
                  itemName: item?.name || 'Unknown Item',
                  action: currentEquipment[slot] ? 'equipped' : 'acquired'
                });
              }
            });

            if (equipmentChanges.length > 0) {
              events.push({
                type: 'equipment',
                bookId: book.id,
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                timestamp: `${book.id}_${chapter.id}`,
                description: 'Equipment changes',
                equipmentChanges,
                bookTitle: `Book ${book.id}`
              });
            }
          }
        }

        // Check for skill changes
        if (actor.snapshots) {
          const snapshotKey = `${book.id}_${chapter.id}`;
          const snapshot = actor.snapshots[snapshotKey];
          if (snapshot && snapshot.activeSkills) {
            const currentSkills = (actor.activeSkills || []).map(s => typeof s === 'object' ? s.id : s);
            const snapshotSkills = snapshot.activeSkills.map(s => typeof s === 'object' ? s.id : s);
            const newSkills = snapshotSkills.filter(s => !currentSkills.includes(s));

            if (newSkills.length > 0) {
              const skillNames = newSkills.map(skillId => {
                const skill = skills?.find(s => s.id === skillId);
                return skill?.name || 'Unknown Skill';
              });

              events.push({
                type: 'skill',
                bookId: book.id,
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                timestamp: `${book.id}_${chapter.id}`,
                description: 'Skill acquisition',
                skills: skillNames,
                bookTitle: `Book ${book.id}`
              });
            }
          }
        }
      });
    });

    // Sort by timestamp (book_chapter)
    const sorted = events.sort((a, b) => {
      const [bookA, chA] = a.timestamp.split('_').map(Number);
      const [bookB, chB] = b.timestamp.split('_').map(Number);
      if (bookA !== bookB) return bookA - bookB;
      return chA - chB;
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CharacterTimelineView.jsx:155',message:'Timeline events calculated',data:{eventCount:sorted.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    return sorted;
  }, [actor, books, items, skills]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = timelineEvents;

    if (selectedEventType !== 'all') {
      filtered = filtered.filter(e => e.type === selectedEventType);
    }

    if (selectedBook !== 'all') {
      filtered = filtered.filter(e => e.bookId.toString() === selectedBook);
    }

    return filtered;
  }, [timelineEvents, selectedEventType, selectedBook]);

  // Get unique books for filter
  const availableBooks = useMemo(() => {
    const bookIds = [...new Set(timelineEvents.map(e => e.bookId))];
    return bookIds.map(id => ({ id: id.toString(), label: `Book ${id}` }));
  }, [timelineEvents]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'appearance':
        return Users;
      case 'stat':
        return TrendingUp;
      case 'equipment':
        return Package;
      case 'skill':
        return TrendingUp;
      default:
        return Clock;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'appearance':
        return 'text-blue-400 bg-blue-900/30 border-blue-700';
      case 'stat':
        return 'text-green-400 bg-green-900/30 border-green-700';
      case 'equipment':
        return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'skill':
        return 'text-purple-400 bg-purple-900/30 border-purple-700';
      default:
        return 'text-slate-400 bg-slate-900/30 border-slate-700';
    }
  };

  if (!actor) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a character to view timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Filters */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Character Timeline
          </h3>
          <div className="text-sm text-slate-400">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Event Type:</label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded"
            >
              <option value="all">All Events</option>
              <option value="appearance">Appearances</option>
              <option value="stat">Stat Changes</option>
              <option value="equipment">Equipment</option>
              <option value="skill">Skills</option>
            </select>
          </div>

          {availableBooks.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Book:</label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded"
              >
                <option value="all">All Books</option>
                {availableBooks.map(book => (
                  <option key={book.id} value={book.id}>{book.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events found</p>
              <p className="text-xs mt-2">Try adjusting filters</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-700" />

            {/* Events */}
            <div className="space-y-4">
              {filteredEvents.map((event, index) => {
                const EventIcon = getEventIcon(event.type);
                const colorClass = getEventColor(event.type);

                return (
                  <div key={index} className="relative flex items-start gap-4">
                    {/* Timeline Dot */}
                    <div className={`relative z-10 w-4 h-4 rounded-full border-2 ${colorClass.split(' ')[1]} ${colorClass.split(' ')[2]} flex items-center justify-center bg-slate-900`}>
                      <EventIcon className="w-2.5 h-2.5 text-white" />
                    </div>

                    {/* Event Content */}
                    <div className={`flex-1 bg-slate-900 border ${colorClass.split(' ')[3]} rounded-lg p-4`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <EventIcon className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
                            <span className={`text-sm font-semibold ${colorClass.split(' ')[0]}`}>
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {event.bookTitle} - {event.chapterTitle}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          Ch {event.chapterId}
                        </div>
                      </div>

                      <div className="text-sm text-slate-300">
                        {event.description}
                      </div>

                      {/* Event Details */}
                      {event.type === 'appearance' && event.mentionCount > 0 && (
                        <div className="mt-2 text-xs text-slate-400">
                          Mentioned {event.mentionCount} time{event.mentionCount !== 1 ? 's' : ''}
                        </div>
                      )}

                      {event.type === 'stat' && event.statChanges && (
                        <div className="mt-2 space-y-1">
                          {event.statChanges.map((change, i) => (
                            <div key={i} className="text-xs text-slate-300">
                              <span className="font-mono">{change.stat}:</span>{' '}
                              <span className="text-slate-400">{change.oldValue}</span>
                              <ChevronRight className="w-3 h-3 inline mx-1 text-green-400" />
                              <span className="text-green-400 font-semibold">{change.newValue}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {event.type === 'equipment' && event.equipmentChanges && (
                        <div className="mt-2 space-y-1">
                          {event.equipmentChanges.map((change, i) => (
                            <div key={i} className="text-xs text-slate-300">
                              <span className="capitalize">{change.slot}:</span>{' '}
                              <span className="text-yellow-400">{change.itemName}</span>
                              <span className="text-slate-500 ml-1">({change.action})</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {event.type === 'skill' && event.skills && (
                        <div className="mt-2">
                          <div className="text-xs text-slate-300">
                            Learned: <span className="text-purple-400">{event.skills.join(', ')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterTimelineView;

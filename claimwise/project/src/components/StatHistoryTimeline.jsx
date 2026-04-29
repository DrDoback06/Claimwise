import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart3, ArrowUp, ArrowDown, Minus, ChevronRight } from 'lucide-react';

/**
 * StatHistoryTimeline - Visual chart showing stat changes over time
 */
const StatHistoryTimeline = ({ actor, books, statRegistry }) => {
  const [selectedStat, setSelectedStat] = useState('all');
  const [selectedBook, setSelectedBook] = useState('all');

  // Extract stat history from snapshots
  const statHistory = useMemo(() => {
    if (!actor || !books || !statRegistry) return [];

    const history = [];
    const coreStats = (statRegistry || []).filter(s => s.isCore);
    const allStats = [...coreStats, ...(statRegistry || []).filter(s => !s.isCore)];

    // Process all books and chapters
    const booksArray = Array.isArray(books) ? books : Object.values(books || {});
    if (!booksArray || booksArray.length === 0) {
      return [];
    }
    
    booksArray.forEach(book => {
      if (!book || !book.chapters) return;
      
      book.chapters.forEach(chapter => {
        const snapshotKey = `${book.id}_${chapter.id}`;
        const snapshot = actor.snapshots?.[snapshotKey];

        if (snapshot && snapshot.baseStats) {
          allStats.forEach(stat => {
            const statKey = stat.key;
            const currentValue = snapshot.baseStats[statKey];
            const previousValue = history.length > 0
              ? history[history.length - 1]?.stats?.[statKey]
              : actor.baseStats?.[statKey] || 0;

            if (currentValue !== undefined && currentValue !== previousValue) {
              history.push({
                bookId: book.id,
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                timestamp: `${book.id}_${chapter.id}`,
                stat: statKey,
                statLabel: stat.label || statKey,
                oldValue: previousValue,
                newValue: currentValue,
                change: currentValue - previousValue,
                bookTitle: `Book ${book.id}`
              });
            }
          });
        }
      });
    });

    // Sort by timestamp
    return history.sort((a, b) => {
      const [bookA, chA] = a.timestamp.split('_').map(Number);
      const [bookB, chB] = b.timestamp.split('_').map(Number);
      if (bookA !== bookB) return bookA - bookB;
      return chA - chB;
    });
  }, [actor, books, statRegistry]);

  // Filter history
  const filteredHistory = useMemo(() => {
    let filtered = statHistory;

    if (selectedStat !== 'all') {
      filtered = filtered.filter(h => h.stat === selectedStat);
    }

    if (selectedBook !== 'all') {
      filtered = filtered.filter(h => h.bookId.toString() === selectedBook);
    }

    return filtered;
  }, [statHistory, selectedStat, selectedBook]);

  // Get unique stats and books
  const availableStats = useMemo(() => {
    const stats = [...new Set(statHistory.map(h => h.stat))];
    return stats.map(stat => {
      const first = statHistory.find(h => h.stat === stat);
      return { key: stat, label: first?.statLabel || stat };
    });
  }, [statHistory]);

  const availableBooks = useMemo(() => {
    const bookIds = [...new Set(statHistory.map(h => h.bookId))];
    return bookIds.map(id => ({ id: id.toString(), label: `Book ${id}` }));
  }, [statHistory]);

  // Get current stat values
  const currentStats = useMemo(() => {
    const stats = {};
    availableStats.forEach(stat => {
      const latest = [...filteredHistory]
        .filter(h => h.stat === stat.key)
        .sort((a, b) => {
          const [bookA, chA] = a.timestamp.split('_').map(Number);
          const [bookB, chB] = b.timestamp.split('_').map(Number);
          if (bookA !== bookB) return bookB - bookA;
          return chB - chA;
        })[0];
      stats[stat.key] = latest?.newValue || actor.baseStats?.[stat.key] || 0;
    });
    return stats;
  }, [filteredHistory, availableStats, actor]);

  if (!actor) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a character to view stat history</p>
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
            <TrendingUp className="w-5 h-5 text-green-400" />
            Stat History
          </h3>
          <div className="text-sm text-slate-400">
            {filteredHistory.length} change{filteredHistory.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Stat:</label>
            <select
              value={selectedStat}
              onChange={(e) => setSelectedStat(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded"
            >
              <option value="all">All Stats</option>
              {availableStats.map(stat => (
                <option key={stat.key} value={stat.key}>{stat.label}</option>
              ))}
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

      {/* Current Stats Overview */}
      {availableStats.length > 0 && (
        <div className="bg-slate-900 border-b border-slate-800 p-4">
          <div className="text-sm font-semibold text-white mb-3">Current Stats</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableStats.map(stat => (
              <div key={stat.key} className="bg-slate-950 border border-slate-800 rounded p-2">
                <div className="text-xs text-slate-400 mb-1">{stat.label}</div>
                <div className="text-xl font-bold text-white">{currentStats[stat.key] || 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat History Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No stat changes found</p>
              <p className="text-xs mt-2">Stat changes will appear here as chapters are analyzed</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-700" />

            {/* Events */}
            <div className="space-y-4">
              {filteredHistory.map((event, index) => {
                const isIncrease = event.change > 0;
                const isDecrease = event.change < 0;

                return (
                  <div key={index} className="relative flex items-start gap-4">
                    {/* Timeline Dot */}
                    <div className={`relative z-10 w-4 h-4 rounded-full border-2 ${
                      isIncrease ? 'bg-green-900/30 border-green-700' :
                      isDecrease ? 'bg-red-900/30 border-red-700' :
                      'bg-slate-900/30 border-slate-700'
                    } flex items-center justify-center`}>
                      {isIncrease ? (
                        <ArrowUp className="w-2.5 h-2.5 text-green-400" />
                      ) : isDecrease ? (
                        <ArrowDown className="w-2.5 h-2.5 text-red-400" />
                      ) : (
                        <Minus className="w-2.5 h-2.5 text-slate-400" />
                      )}
                    </div>

                    {/* Event Content */}
                    <div className={`flex-1 bg-slate-900 border rounded-lg p-4 ${
                      isIncrease ? 'border-green-700' :
                      isDecrease ? 'border-red-700' :
                      'border-slate-700'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className={`w-4 h-4 ${
                              isIncrease ? 'text-green-400' :
                              isDecrease ? 'text-red-400' :
                              'text-slate-400'
                            }`} />
                            <span className={`text-sm font-semibold ${
                              isIncrease ? 'text-green-400' :
                              isDecrease ? 'text-red-400' :
                              'text-slate-400'
                            }`}>
                              {event.statLabel}
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

                      <div className="flex items-center gap-3">
                        <div className="text-lg font-mono text-slate-300">{event.oldValue}</div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                        <div className={`text-lg font-mono font-bold ${
                          isIncrease ? 'text-green-400' :
                          isDecrease ? 'text-red-400' :
                          'text-slate-300'
                        }`}>
                          {event.newValue}
                        </div>
                        {event.change !== 0 && (
                          <div className={`text-sm font-semibold ${
                            isIncrease ? 'text-green-400' :
                            'text-red-400'
                          }`}>
                            ({isIncrease ? '+' : ''}{event.change})
                          </div>
                        )}
                      </div>
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

export default StatHistoryTimeline;

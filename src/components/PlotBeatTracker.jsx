import React, { useState, useEffect, useCallback } from 'react';
import {
  ListChecks,
  Check,
  Circle,
  Plus,
  Trash2,
  GripVertical,
  Edit3,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Target,
  AlertCircle,
  Filter,
  MoreVertical,
  BookOpen,
  Save,
  X
} from 'lucide-react';
import contextEngine from '../services/contextEngine';
import db from '../services/database';

/**
 * Plot Beat Tracker Component
 * Living to-do list for story plot beats
 */
const PlotBeatTracker = ({ currentBookId, currentChapter, onBeatSelect, compact = false }) => {
  const [beats, setBeats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [expandedBeats, setExpandedBeats] = useState(new Set());
  const [editingBeat, setEditingBeat] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBeat, setNewBeat] = useState({
    beat: '',
    purpose: '',
    targetChapter: '',
    characters: '',
    emotionalTone: ''
  });

  useEffect(() => {
    loadBeats();
  }, []);

  const loadBeats = async () => {
    setIsLoading(true);
    try {
      const allBeats = await contextEngine.getPlotBeats();
      setBeats(allBeats);
    } catch (error) {
      console.error('Error loading beats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBeat = async () => {
    if (!newBeat.beat.trim()) return;

    try {
      const beat = await contextEngine.addPlotBeat({
        beat: newBeat.beat,
        purpose: newBeat.purpose,
        targetChapter: newBeat.targetChapter ? parseInt(newBeat.targetChapter) : null,
        characters: newBeat.characters.split(',').map(c => c.trim()).filter(c => c),
        emotionalTone: newBeat.emotionalTone
      });

      setBeats(prev => [...prev, beat]);
      setNewBeat({
        beat: '',
        purpose: '',
        targetChapter: '',
        characters: '',
        emotionalTone: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding beat:', error);
    }
  };

  const handleCompleteBeat = async (beatId) => {
    try {
      await contextEngine.completePlotBeat(beatId, currentChapter);
      setBeats(prev => prev.map(b => 
        b.id === beatId 
          ? { ...b, completed: true, completedInChapter: currentChapter, completedAt: Date.now() }
          : b
      ));
    } catch (error) {
      console.error('Error completing beat:', error);
    }
  };

  const handleUncompleteBeat = async (beatId) => {
    try {
      const beat = beats.find(b => b.id === beatId);
      if (beat) {
        const updated = { ...beat, completed: false, completedInChapter: null, completedAt: null };
        await db.update('plotBeats', updated);
        setBeats(prev => prev.map(b => b.id === beatId ? updated : b));
      }
    } catch (error) {
      console.error('Error uncompleting beat:', error);
    }
  };

  const handleDeleteBeat = async (beatId) => {
    if (!window.confirm('Delete this plot beat?')) return;
    
    try {
      await db.delete('plotBeats', beatId);
      setBeats(prev => prev.filter(b => b.id !== beatId));
    } catch (error) {
      console.error('Error deleting beat:', error);
    }
  };

  const handleUpdateBeat = async (beatId, updates) => {
    try {
      const beat = beats.find(b => b.id === beatId);
      if (beat) {
        const updated = { ...beat, ...updates, updatedAt: Date.now() };
        await db.update('plotBeats', updated);
        setBeats(prev => prev.map(b => b.id === beatId ? updated : b));
      }
      setEditingBeat(null);
    } catch (error) {
      console.error('Error updating beat:', error);
    }
  };

  const toggleExpand = (beatId) => {
    setExpandedBeats(prev => {
      const next = new Set(prev);
      if (next.has(beatId)) {
        next.delete(beatId);
      } else {
        next.add(beatId);
      }
      return next;
    });
  };

  const filteredBeats = beats.filter(beat => {
    if (filter === 'pending') return !beat.completed;
    if (filter === 'completed') return beat.completed;
    return true;
  });

  const pendingCount = beats.filter(b => !b.completed).length;
  const completedCount = beats.filter(b => b.completed).length;
  const progressPercent = beats.length > 0 ? Math.round((completedCount / beats.length) * 100) : 0;

  // Group beats by chapter
  const groupedBeats = filteredBeats.reduce((acc, beat) => {
    const chapter = beat.targetChapter || beat.completedInChapter || 'unassigned';
    if (!acc[chapter]) acc[chapter] = [];
    acc[chapter].push(beat);
    return acc;
  }, {});

  const renderBeat = (beat) => {
    const isExpanded = expandedBeats.has(beat.id);
    const isEditing = editingBeat === beat.id;

    if (compact) {
      return (
        <div
          key={beat.id}
          className={`flex items-center gap-2 p-2 rounded border transition-all ${
            beat.completed
              ? 'bg-green-900/20 border-green-500/30 text-green-400'
              : 'bg-slate-800/50 border-slate-700 text-slate-300'
          }`}
        >
          <button
            onClick={() => beat.completed ? handleUncompleteBeat(beat.id) : handleCompleteBeat(beat.id)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              beat.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-slate-500 hover:border-amber-500'
            }`}
          >
            {beat.completed && <Check className="w-3 h-3" />}
          </button>
          <span className={`flex-1 text-sm ${beat.completed ? 'line-through opacity-70' : ''}`}>
            {beat.beat}
          </span>
          {beat.targetChapter && (
            <span className="text-xs text-slate-500">Ch.{beat.targetChapter}</span>
          )}
        </div>
      );
    }

    return (
      <div
        key={beat.id}
        className={`rounded-lg border transition-all ${
          beat.completed
            ? 'bg-green-900/10 border-green-500/30'
            : beat.targetChapter === currentChapter
            ? 'bg-amber-900/20 border-amber-500/50'
            : 'bg-slate-800/50 border-slate-700'
        }`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              onClick={() => beat.completed ? handleUncompleteBeat(beat.id) : handleCompleteBeat(beat.id)}
              className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                beat.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-slate-500 hover:border-amber-500 hover:bg-amber-500/10'
              }`}
            >
              {beat.completed && <Check className="w-4 h-4" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    defaultValue={beat.beat}
                    onBlur={(e) => handleUpdateBeat(beat.id, { beat: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      defaultValue={beat.targetChapter || ''}
                      placeholder="Chapter"
                      onBlur={(e) => handleUpdateBeat(beat.id, { targetChapter: parseInt(e.target.value) || null })}
                      className="w-24 bg-slate-900 border border-slate-700 text-white px-3 py-1 rounded text-sm"
                    />
                    <input
                      type="text"
                      defaultValue={beat.purpose || ''}
                      placeholder="Purpose"
                      onBlur={(e) => handleUpdateBeat(beat.id, { purpose: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 text-white px-3 py-1 rounded text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setEditingBeat(null)}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    Done editing
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium ${beat.completed ? 'text-green-400 line-through' : 'text-white'}`}>
                      {beat.beat}
                    </p>
                    <div className="flex items-center gap-1">
                      {beat.targetChapter && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          beat.targetChapter === currentChapter
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          Ch.{beat.targetChapter}
                        </span>
                      )}
                      {beat.completed && beat.completedInChapter && (
                        <span className="text-xs text-green-400">
                          ✓ Ch.{beat.completedInChapter}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {(beat.purpose || beat.characters?.length > 0) && (
                    <button
                      onClick={() => toggleExpand(beat.id)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-400 mt-1"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      {isExpanded ? 'Less' : 'More details'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingBeat(beat.id)}
                  className="p-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteBeat(beat.id)}
                  className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-900/30 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Expanded details */}
          {isExpanded && !isEditing && (
            <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
              {beat.purpose && (
                <div className="flex items-start gap-2 text-sm">
                  <Target className="w-4 h-4 text-slate-500 mt-0.5" />
                  <span className="text-slate-400">{beat.purpose}</span>
                </div>
              )}
              {beat.characters?.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-slate-500">Characters:</span>
                  <span className="text-slate-300">{beat.characters.join(', ')}</span>
                </div>
              )}
              {beat.emotionalTone && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-slate-500">Tone:</span>
                  <span className="text-slate-300">{beat.emotionalTone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'bg-slate-900 rounded-xl border border-slate-700'}>
      {/* Header */}
      {!compact && (
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ListChecks className="w-6 h-6 text-amber-500" />
              <div>
                <h3 className="text-lg font-bold text-white">Plot Roadmap</h3>
                <p className="text-xs text-slate-400">Track your story's progress</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Beat
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-400">Progress</span>
              <span className="text-amber-400 font-medium">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{pendingCount} remaining</span>
              <span>{completedCount} completed</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All', count: beats.length },
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'completed', label: 'Completed', count: completedCount }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === f.id
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Beat Form */}
      {showAddForm && (
        <div className="p-4 bg-slate-800/50 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white">Add Plot Beat</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={newBeat.beat}
              onChange={(e) => setNewBeat(prev => ({ ...prev, beat: e.target.value }))}
              placeholder="What happens? (e.g., 'Hero discovers the truth')"
              className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={newBeat.targetChapter}
                onChange={(e) => setNewBeat(prev => ({ ...prev, targetChapter: e.target.value }))}
                placeholder="Target chapter (optional)"
                className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg"
              />
              <input
                type="text"
                value={newBeat.emotionalTone}
                onChange={(e) => setNewBeat(prev => ({ ...prev, emotionalTone: e.target.value }))}
                placeholder="Emotional tone"
                className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg"
              />
            </div>
            <input
              type="text"
              value={newBeat.purpose}
              onChange={(e) => setNewBeat(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="Why does this matter? (purpose)"
              className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg"
            />
            <input
              type="text"
              value={newBeat.characters}
              onChange={(e) => setNewBeat(prev => ({ ...prev, characters: e.target.value }))}
              placeholder="Characters involved (comma-separated)"
              className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg"
            />
            <button
              onClick={handleAddBeat}
              disabled={!newBeat.beat.trim()}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Beat
            </button>
          </div>
        </div>
      )}

      {/* Beats List */}
      <div className={compact ? 'space-y-2' : 'p-4 space-y-3 max-h-[500px] overflow-y-auto'}>
        {filteredBeats.length === 0 ? (
          <div className="text-center py-8">
            <ListChecks className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">
              {filter === 'all' 
                ? 'No plot beats yet. Add your first one!'
                : `No ${filter} beats`
              }
            </p>
          </div>
        ) : compact ? (
          // Compact mode - flat list
          filteredBeats.map(renderBeat)
        ) : (
          // Full mode - grouped by chapter
          Object.entries(groupedBeats)
            .sort(([a], [b]) => {
              if (a === 'unassigned') return 1;
              if (b === 'unassigned') return -1;
              return parseInt(a) - parseInt(b);
            })
            .map(([chapter, chapterBeats]) => (
              <div key={chapter} className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400 font-medium">
                    {chapter === 'unassigned' ? 'Unassigned' : `Chapter ${chapter}`}
                  </span>
                  {chapter === String(currentChapter) && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>
                {chapterBeats.map(renderBeat)}
              </div>
            ))
        )}
      </div>

      {/* Current Chapter Beats Summary */}
      {!compact && currentChapter && (
        <div className="p-4 border-t border-slate-700 bg-slate-800/30">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">
              {beats.filter(b => b.targetChapter === currentChapter && !b.completed).length} beats targeted for Chapter {currentChapter}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotBeatTracker;

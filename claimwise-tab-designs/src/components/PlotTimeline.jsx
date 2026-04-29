import React, { useState, useEffect } from 'react';
import {
  Target,
  CheckCircle,
  Circle,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Sparkles,
  GripVertical,
  ChevronDown,
  Filter,
  Clock
} from 'lucide-react';
import contextEngine from '../services/contextEngine';
import db from '../services/database';
import chapterDataExtractionService from '../services/chapterDataExtractionService';
import chapterNavigationService from '../services/chapterNavigationService';
import dataConsistencyService from '../services/dataConsistencyService';
import aiSuggestionService from '../services/aiSuggestionService';
import { Users } from 'lucide-react';

/**
 * PlotTimeline - Visual plot beat tracker with chapter assignment
 * Allows drag-and-drop beat management and AI auto-tracking
 */
const PlotTimeline = ({ 
  books = [],
  onBeatUpdate,
  onClose 
}) => {
  const [plotBeats, setPlotBeats] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBeat, setEditingBeat] = useState(null);
  const [newBeat, setNewBeat] = useState({
    beat: '',
    purpose: '',
    targetChapter: null,
    emotionalTone: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'completed'
  const [draggedBeat, setDraggedBeat] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedCharacterFilter, setSelectedCharacterFilter] = useState(null);
  const [actors, setActors] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  useEffect(() => {
    loadData();
    loadActors();
  }, [books]);

  const loadActors = async () => {
    try {
      const allActors = await db.getAll('actors');
      setActors(allActors || []);
    } catch (error) {
      console.error('Error loading actors:', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load plot beats directly from database
      const beats = await contextEngine.getPlotBeats();
      console.log('[PlotTimeline] Loaded beats:', beats.length, beats.slice(0, 3).map(b => ({ 
        id: b.id, 
        beat: b.beat?.substring(0, 30), 
        targetChapter: b.targetChapter, 
        chapter: b.chapter 
      })));
      setPlotBeats(beats);

      // Load books from database if not provided as props
      let booksToUse = books;
      // Handle both array and object formats
      if (!booksToUse) {
        booksToUse = await db.getAll('books');
      } else if (!Array.isArray(booksToUse)) {
        // Convert object to array
        booksToUse = Object.values(booksToUse);
      }
      
      if (!booksToUse || booksToUse.length === 0) {
        booksToUse = await db.getAll('books');
        console.log('[PlotTimeline] Loaded books from DB:', booksToUse.length);
      }

      // Extract all chapters from books
      const allChapters = [];
      booksToUse.forEach(book => {
        if (book.chapters) {
          book.chapters.forEach((ch, idx) => {
            allChapters.push({
              id: ch.id || `${book.id}_${idx + 1}`,
              bookId: book.id,
              bookTitle: book.title || `Book ${book.id}`,
              number: ch.number || idx + 1,
              title: ch.title || `Chapter ${idx + 1}`
            });
          });
        }
      });
      
      // Sort chapters by number
      allChapters.sort((a, b) => a.number - b.number);
      console.log('[PlotTimeline] Chapters:', allChapters.length, allChapters.slice(0, 3).map(ch => ({ 
        id: ch.id, 
        number: ch.number, 
        title: ch.title 
      })));
      setChapters(allChapters);
    } catch (error) {
      console.error('Error loading plot data:', error);
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
        targetChapter: newBeat.targetChapter,
        emotionalTone: newBeat.emotionalTone,
        characters: [],
        completed: false
      });

      setPlotBeats(prev => [...prev, beat]);
      setNewBeat({ beat: '', purpose: '', targetChapter: null, emotionalTone: '' });
      setShowAddForm(false);
      onBeatUpdate?.();
    } catch (error) {
      console.error('Error adding beat:', error);
    }
  };

  const handleUpdateBeat = async (beatId, updates) => {
    try {
      const beat = plotBeats.find(b => b.id === beatId);
      if (!beat) return;

      const updatedBeat = { ...beat, ...updates, updatedAt: Date.now() };
      await db.update('plotBeats', updatedBeat);
      
      setPlotBeats(prev => prev.map(b => b.id === beatId ? updatedBeat : b));
      setEditingBeat(null);
      onBeatUpdate?.();
    } catch (error) {
      console.error('Error updating beat:', error);
    }
  };

  const handleDeleteBeat = async (beatId) => {
    if (!window.confirm('Delete this plot beat?')) return;

    try {
      await db.delete('plotBeats', beatId);
      setPlotBeats(prev => prev.filter(b => b.id !== beatId));
      onBeatUpdate?.();
    } catch (error) {
      console.error('Error deleting beat:', error);
    }
  };

  const handleToggleComplete = async (beatId) => {
    const beat = plotBeats.find(b => b.id === beatId);
    if (!beat) return;

    await handleUpdateBeat(beatId, { 
      completed: !beat.completed,
      completedAt: !beat.completed ? Date.now() : null
    });
  };

  // Auto-extract beats from all chapters
  const handleExtractBeatsFromChapters = async () => {
    if (chapters.length === 0) {
      alert('No chapters found. Please add chapters first.');
      return;
    }

    setIsExtracting(true);
    try {
      const allBooks = Array.isArray(books) ? books : Object.values(books || {});
      const extractedBeats = [];

      // Try to use manuscript intelligence service if available
      let useManuscriptIntelligence = false;
      try {
        const manuscriptIntelligenceService = (await import('../services/manuscriptIntelligenceService')).default;
        useManuscriptIntelligence = true;
      } catch (e) {
        // Fall back to chapter data extraction service
      }

      for (const chapter of chapters) {
        const book = allBooks.find(b => b.id === chapter.bookId);
        if (!book || !book.chapters) continue;

        const chapterData = book.chapters.find(ch => 
          ch.id === chapter.id || ch.number === chapter.number
        );
        if (!chapterData) continue;

        const chapterText = chapterData.content || chapterData.script || '';
        if (chapterText.trim().length < 50) continue;

        let beats = [];
        if (useManuscriptIntelligence) {
          // Use manuscript intelligence service for comprehensive extraction
          const manuscriptIntelligenceService = (await import('../services/manuscriptIntelligenceService')).default;
          const chapterData = await manuscriptIntelligenceService.extractCompleteChapterData(
            chapterText,
            chapter.number,
            chapter.bookId,
            []
          );
          beats = chapterData.beats || [];
        } else {
          // Fall back to chapter data extraction service
          beats = await chapterDataExtractionService.extractBeatsFromChapter(
            chapterText,
            chapter.number,
            chapter.bookId
          );
        }

        // Save extracted beats with duplicate checking
        for (const beat of beats) {
          beat.targetChapter = chapter.id;
          beat.chapterId = chapter.id;
          const savedBeat = await dataConsistencyService.addPlotBeatSafe(beat);
          extractedBeats.push(savedBeat);
        }
      }

      // Reload beats
      const allBeats = await contextEngine.getPlotBeats();
      setPlotBeats(allBeats);
      
      alert(`Extracted ${extractedBeats.length} beats from ${chapters.length} chapters.`);
      
      // Load AI suggestions for plot directions
      try {
        const allChapters = Array.isArray(books) ? books.flatMap(b => b.chapters || []) : [];
        const currentChapter = allChapters.find(ch => ch.id === chapters[0]?.id);
        if (currentChapter) {
          const chapterText = currentChapter.script || currentChapter.content || '';
          if (chapterText.length > 50) {
            const context = {
              previousChapters: [],
              activeThreads: extractedBeats,
              characters: actors || []
            };
            const suggestions = await aiSuggestionService.analyzePlotDirections(chapterText, context);
            setAiSuggestions(suggestions);
            if (suggestions.length > 0) {
              setShowAISuggestions(true);
            }
          }
        }
      } catch (error) {
        console.warn('Error loading AI suggestions:', error);
      }
      
      onBeatUpdate?.();
    } catch (error) {
      console.error('Error extracting beats:', error);
      alert('Error extracting beats: ' + error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Navigate to chapter
  const handleNavigateToChapter = (bookId, chapterId) => {
    chapterNavigationService.navigateToChapter(bookId, chapterId);
  };

  // Get unique characters from all beats
  const getUniqueCharacters = () => {
    const charSet = new Set();
    plotBeats.forEach(beat => {
      if (Array.isArray(beat.characters)) {
        beat.characters.forEach(char => charSet.add(char));
      }
    });
    return Array.from(charSet).sort();
  };

  // Drag and Drop handlers
  const handleDragStart = (e, beat) => {
    setDraggedBeat(beat);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, chapterNumber) => {
    e.preventDefault();
    setDropTarget(chapterNumber);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e, chapterNumber) => {
    e.preventDefault();
    if (draggedBeat) {
      await handleUpdateBeat(draggedBeat.id, { targetChapter: chapterNumber });
    }
    setDraggedBeat(null);
    setDropTarget(null);
  };

  // Filter beats
  const filteredBeats = plotBeats.filter(beat => {
    if (filterStatus === 'pending') return !beat.completed;
    if (filterStatus === 'completed') return beat.completed;
    return true;
  });

  // Group beats by chapter - handle both targetChapter (number) and chapter (id) fields from wizard
  const beatsByChapter = {};
  filteredBeats.forEach(beat => {
    // Try multiple field names for chapter assignment (wizard might use different fields)
    let chapterKey = 'unassigned';
    
    if (beat.targetChapter !== null && beat.targetChapter !== undefined && beat.targetChapter !== '') {
      // targetChapter can be a number or chapter ID
      if (typeof beat.targetChapter === 'number') {
        chapterKey = beat.targetChapter;
      } else {
        // Try to find matching chapter by ID
        const matchingChapter = chapters.find(ch => 
          ch.id === beat.targetChapter || 
          String(ch.number) === String(beat.targetChapter) ||
          ch.id === `${chapters[0]?.bookId}_${beat.targetChapter}` // Handle book_chapter format
        );
        chapterKey = matchingChapter ? matchingChapter.number : 'unassigned';
      }
    } else if (beat.chapter !== null && beat.chapter !== undefined && beat.chapter !== '') {
      // Fallback to chapter field (wizard might use this)
      if (typeof beat.chapter === 'number') {
        chapterKey = beat.chapter;
      } else {
        const matchingChapter = chapters.find(ch => 
          ch.id === beat.chapter || 
          String(ch.number) === String(beat.chapter)
        );
        chapterKey = matchingChapter ? matchingChapter.number : 'unassigned';
      }
    }
    
    if (!beatsByChapter[chapterKey]) beatsByChapter[chapterKey] = [];
    beatsByChapter[chapterKey].push(beat);
  });
  
  // Sort beats within each chapter by order or creation time for chronological display
  Object.keys(beatsByChapter).forEach(key => {
    beatsByChapter[key].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  });

  // Debug logging (disabled to prevent console spam - enable only when needed)
  // if (process.env.NODE_ENV === 'development' && window.DEBUG_PLOT_TIMELINE) {
  //   console.log('[PlotTimeline] Beats grouped:', Object.keys(beatsByChapter).map(key => ({
  //     key,
  //     count: beatsByChapter[key].length
  //   })));
  // }

  const completedCount = plotBeats.filter(b => b.completed).length;
  const totalCount = plotBeats.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Target className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading plot timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Plot Timeline</h2>
              <p className="text-sm text-slate-400">
                {completedCount}/{totalCount} beats completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExtractBeatsFromChapters}
              disabled={isExtracting || chapters.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              title="Auto-extract beats from all chapters"
            >
              <Sparkles className="w-4 h-4" />
              {isExtracting ? 'Extracting...' : 'Auto-Extract Beats'}
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Beat
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          {['all', 'pending', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filterStatus === status
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          {aiSuggestions.length > 0 && (
            <button
              onClick={() => setShowAISuggestions(!showAISuggestions)}
              className="ml-auto px-3 py-1 rounded-lg text-sm bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30"
            >
              <Sparkles className="w-4 h-4 inline mr-1" />
              AI Suggestions ({aiSuggestions.length})
            </button>
          )}
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showAISuggestions && aiSuggestions.length > 0 && (
        <div className="flex-shrink-0 p-4 bg-purple-950/30 border-b border-purple-800/30 max-h-64 overflow-y-auto">
          <div className="text-xs text-purple-400 font-bold mb-2">AI PLOT DIRECTION SUGGESTIONS</div>
          <div className="space-y-2">
            {aiSuggestions.slice(0, 5).map((suggestion, idx) => (
              <div key={idx} className="bg-slate-900 rounded p-2 border border-purple-800/50">
                <div className="text-xs text-white font-medium">{suggestion.suggestion || suggestion.plotDirection}</div>
                {suggestion.reasoning && (
                  <div className="text-xs text-slate-400 mt-1">{suggestion.reasoning}</div>
                )}
                {suggestion.priority && (
                  <div className="text-xs text-purple-400 mt-1">Priority: {suggestion.priority}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Beat Form */}
      {showAddForm && (
        <div className="flex-shrink-0 p-4 bg-slate-800/50 border-b border-slate-700">
          <div className="space-y-3">
            <input
              type="text"
              value={newBeat.beat}
              onChange={(e) => setNewBeat(prev => ({ ...prev, beat: e.target.value }))}
              placeholder="What happens in this beat?"
              className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newBeat.purpose}
                onChange={(e) => setNewBeat(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Purpose/significance (optional)"
                className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500"
              />
              <select
                value={newBeat.targetChapter || ''}
                onChange={(e) => setNewBeat(prev => ({ 
                  ...prev, 
                  targetChapter: e.target.value ? parseInt(e.target.value) : null 
                }))}
                className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:border-emerald-500"
              >
                <option value="">Unassigned</option>
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.number}>
                    Ch {ch.number}: {ch.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBeat}
                disabled={!newBeat.beat.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Beat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Unassigned Beats */}
        {beatsByChapter['unassigned']?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Unassigned Beats
            </h3>
            <div className="space-y-2">
              {beatsByChapter['unassigned'].map(beat => (
                <BeatCard
                  key={beat.id}
                  beat={beat}
                  isEditing={editingBeat === beat.id}
                  onEdit={() => setEditingBeat(beat.id)}
                  onSave={(updates) => handleUpdateBeat(beat.id, updates)}
                  onCancel={() => setEditingBeat(null)}
                  onDelete={() => handleDeleteBeat(beat.id)}
                  onToggleComplete={() => handleToggleComplete(beat.id)}
                  onDragStart={(e) => handleDragStart(e, beat)}
                  chapters={chapters}
                  onNavigateToChapter={handleNavigateToChapter}
                />
              ))}
            </div>
          </div>
        )}

        {/* Beats by Chapter */}
        {chapters.map(chapter => {
          const chapterBeats = beatsByChapter[chapter.number] || [];
          
          return (
            <div
              key={chapter.id}
              className={`mb-4 p-3 rounded-lg border-2 border-dashed transition-colors ${
                dropTarget === chapter.number
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
              onDragOver={(e) => handleDragOver(e, chapter.number)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, chapter.number)}
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => handleNavigateToChapter(chapter.bookId, chapter.id)}
                  className="text-sm font-medium text-white flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Navigate to chapter"
                >
                  <span className="text-amber-400">Ch {chapter.number}</span>
                  {chapter.title}
                  <ChevronRight className="w-3 h-3 opacity-50" />
                </button>
                <span className="text-xs text-slate-500">
                  {chapterBeats.filter(b => b.completed).length}/{chapterBeats.length} beats
                </span>
              </div>
              
              {chapterBeats.length > 0 ? (
                <div className="space-y-2">
                  {chapterBeats.map(beat => (
                    <BeatCard
                      key={beat.id}
                      beat={beat}
                      isEditing={editingBeat === beat.id}
                      onEdit={() => setEditingBeat(beat.id)}
                      onSave={(updates) => handleUpdateBeat(beat.id, updates)}
                      onCancel={() => setEditingBeat(null)}
                      onDelete={() => handleDeleteBeat(beat.id)}
                      onToggleComplete={() => handleToggleComplete(beat.id)}
                      onDragStart={(e) => handleDragStart(e, beat)}
                      chapters={chapters}
                      compact
                      onNavigateToChapter={handleNavigateToChapter}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Drag beats here to assign to this chapter
                </p>
              )}
            </div>
          );
        })}

        {/* Show all unassigned beats even if no chapters exist */}
        {beatsByChapter['unassigned']?.length > 0 && chapters.length === 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Unassigned Beats ({beatsByChapter['unassigned'].length})
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              These beats are waiting to be assigned to chapters. Create chapters in your Series Bible first.
            </p>
            <div className="space-y-2">
              {beatsByChapter['unassigned'].map(beat => (
                <BeatCard
                  key={beat.id}
                  beat={beat}
                  isEditing={editingBeat === beat.id}
                  onEdit={() => setEditingBeat(beat.id)}
                  onSave={(updates) => handleUpdateBeat(beat.id, updates)}
                  onCancel={() => setEditingBeat(null)}
                  onDelete={() => handleDeleteBeat(beat.id)}
                  onToggleComplete={() => handleToggleComplete(beat.id)}
                  onDragStart={(e) => handleDragStart(e, beat)}
                  chapters={chapters}
                  onNavigateToChapter={handleNavigateToChapter}
                />
              ))}
            </div>
          </div>
        )}

        {filteredBeats.length === 0 && plotBeats.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No plot beats yet</p>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
              Plot beats help you track story milestones. Add beats from your story outline 
              and drag them to chapters as you write.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-emerald-400 hover:text-emerald-300"
            >
              Add your first beat →
            </button>
          </div>
        )}

        {filteredBeats.length === 0 && plotBeats.length > 0 && (
          <div className="text-center py-4 text-slate-500 text-sm">
            {plotBeats.length} beats exist but are filtered out. 
            <button onClick={() => setFilterStatus('all')} className="text-amber-400 ml-2 hover:underline">Show all</button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Individual Beat Card component
 */
const BeatCard = ({
  beat,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggleComplete,
  onDragStart,
  chapters,
  compact = false,
  onNavigateToChapter
}) => {
  const [editData, setEditData] = useState(beat);

  useEffect(() => {
    setEditData(beat);
  }, [beat]);

  if (isEditing) {
    return (
      <div className="bg-slate-800 rounded-lg p-3 border border-emerald-500/30">
        <input
          type="text"
          value={editData.beat}
          onChange={(e) => setEditData(prev => ({ ...prev, beat: e.target.value }))}
          className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg mb-2 text-sm"
        />
        <input
          type="text"
          value={editData.purpose || ''}
          onChange={(e) => setEditData(prev => ({ ...prev, purpose: e.target.value }))}
          placeholder="Purpose (optional)"
          className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded text-xs mb-2"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editData)}
            className="px-3 py-1 text-xs bg-emerald-500 hover:bg-emerald-400 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`
        flex items-start gap-2 p-2 rounded-lg transition-all cursor-move
        ${beat.completed 
          ? 'bg-emerald-500/10 border border-emerald-500/20' 
          : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
        }
      `}
    >
      <GripVertical className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
      
      <button
        onClick={onToggleComplete}
        className="flex-shrink-0 mt-0.5"
      >
        {beat.completed ? (
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        ) : (
          <Circle className="w-4 h-4 text-slate-500 hover:text-emerald-400" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${beat.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
          {beat.beat}
        </p>
        {beat.purpose && !compact && (
          <p className="text-xs text-slate-500 mt-0.5">{beat.purpose}</p>
        )}
        {Array.isArray(beat.characters) && beat.characters.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {beat.characters.slice(0, 3).map((char, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-700/50 text-slate-300 text-[10px] rounded"
              >
                <Users className="w-3 h-3" />
                {char}
              </span>
            ))}
            {beat.characters.length > 3 && (
              <span className="text-[10px] text-slate-500">+{beat.characters.length - 3}</span>
            )}
          </div>
        )}
        {beat.targetChapter && chapters.length > 0 && onNavigateToChapter && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const chapter = chapters.find(ch => ch.number === beat.targetChapter);
              if (chapter) {
                onNavigateToChapter(chapter.bookId, chapter.id);
              }
            }}
            className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 flex items-center gap-1"
            title="Navigate to chapter"
          >
            <ChevronRight className="w-3 h-3" />
            View Chapter {beat.targetChapter}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1 text-slate-500 hover:text-white rounded"
        >
          <Edit3 className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-slate-500 hover:text-red-400 rounded"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default PlotTimeline;

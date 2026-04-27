import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Users, Briefcase, Zap, MapPin, Heart, Target, TrendingUp, 
  Search, Filter, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Calendar, BookOpen, X, Play, Pause, Download, Edit3, Save, Trash2,
  Plus, FileJson, FileSpreadsheet, Sparkles
} from 'lucide-react';
import db from '../services/database';
import toastService from '../services/toastService';
import LoadingSkeleton from './LoadingSkeleton';
import { EmptyTimeline } from './EmptyState';
import chapterDataExtractionService from '../services/chapterDataExtractionService';
import chapterNavigationService from '../services/chapterNavigationService';
import dataConsistencyService from '../services/dataConsistencyService';
import aiSuggestionService from '../services/aiSuggestionService';

/**
 * Master Timeline Component
 * Horizontal scrolling timeline with chapter markers and event cards
 */
const MasterTimeline = ({ books, actors, onClose, filterActorName: filterActorNameProp }) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedActors, setSelectedActors] = useState([]);
  const [selectedBook, setSelectedBook] = useState('all');
  
  // View state
  const [zoomLevel, setZoomLevel] = useState(1); // 0.5 = zoomed out, 2 = zoomed in
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  
  // Edit state
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // ---- Enhancements ----
  const [actMarkers, setActMarkers] = useState([]); // [{ label, chapterId, bookId, color }]
  const [showActMarkerModal, setShowActMarkerModal] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [filterActorName, setFilterActorNameState] = useState(null); // character-scoped filtering
  const [showEventTemplates, setShowEventTemplates] = useState(false);
  const [parallelActors, setParallelActors] = useState([]); // for parallel lane view
  const [showParallelView, setShowParallelView] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'milestone',
    bookId: null,
    chapterId: null,
    actors: []
  });
  
  const timelineRef = useRef(null);
  const playbackRef = useRef(null);

  const eventTypes = [
    { id: 'character_appearance', label: 'Character', icon: Users, color: 'green' },
    { id: 'stat_change', label: 'Stats', icon: TrendingUp, color: 'purple' },
    { id: 'item_event', label: 'Items', icon: Briefcase, color: 'yellow' },
    { id: 'skill_event', label: 'Skills', icon: Zap, color: 'blue' },
    { id: 'travel', label: 'Travel', icon: MapPin, color: 'cyan' },
    { id: 'relationship_change', label: 'Relationships', icon: Heart, color: 'pink' },
    { id: 'milestone', label: 'Milestones', icon: Target, color: 'orange' }
  ];

  useEffect(() => {
    loadEvents();
    // Load persisted act markers
    try {
      const saved = localStorage.getItem('masterTimeline_actMarkers');
      if (saved) setActMarkers(JSON.parse(saved));
    } catch (_) {}
  }, [books]);

  // Apply filterActorName from prop (when embedded in Personnel tab)
  useEffect(() => {
    if (filterActorNameProp) {
      setFilterActorNameState(filterActorNameProp);
      setSelectedActors([filterActorNameProp]);
    }
  }, [filterActorNameProp]);

  /**
   * Load AI suggestions for timeline (foreshadowing, callback opportunities)
   */
  const loadAISuggestions = async () => {
    if (!books || (Array.isArray(books) ? books.length === 0 : Object.keys(books).length === 0)) {
      setAiSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const allSuggestions = [];
      
      // Get all chapters
      const booksArray = Array.isArray(books) ? books : Object.values(books || {});
      const allChapters = [];
      booksArray.forEach(book => {
        if (book && book.chapters && Array.isArray(book.chapters)) {
          book.chapters.forEach(chapter => {
            allChapters.push({
              ...chapter,
              bookId: book.id
            });
          });
        }
      });

      // Load timeline-related suggestions from database
      try {
        const dbSuggestions = await db.getAll('aiSuggestions') || [];
        const timelineSuggestions = dbSuggestions.filter(s => 
          s.type === 'foreshadowing' || 
          s.type === 'callback' ||
          s.type === 'timeline_event'
        );
        allSuggestions.push(...timelineSuggestions);
      } catch (e) {
        console.warn('Error loading suggestions from database:', e);
      }

      // Generate foreshadowing suggestions if we have chapters
      if (allChapters.length > 1) {
        for (let i = 0; i < Math.min(5, allChapters.length - 1); i++) {
          const currentChapter = allChapters[i];
          const futureChapters = allChapters.slice(i + 1, i + 4);
          const chapterText = currentChapter.script || currentChapter.content || '';
          
          if (chapterText.length > 50) {
            try {
              const suggestions = await aiSuggestionService.suggestForeshadowing(
                chapterText,
                futureChapters
              );
              allSuggestions.push(...suggestions);
            } catch (error) {
              console.warn('Error generating foreshadowing suggestions:', error);
            }
          }
        }
      }

      setAiSuggestions(allSuggestions);
      if (allSuggestions.length > 0) {
        setShowAISuggestions(true);
      }
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
      setAiSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // ---- Enhancement: Act Markers ----
  const saveActMarker = (marker) => {
    const updated = [...actMarkers, { ...marker, id: Date.now() }];
    setActMarkers(updated);
    try { localStorage.setItem('masterTimeline_actMarkers', JSON.stringify(updated)); } catch (_) {}
  };

  const removeActMarker = (id) => {
    const updated = actMarkers.filter(m => m.id !== id);
    setActMarkers(updated);
    try { localStorage.setItem('masterTimeline_actMarkers', JSON.stringify(updated)); } catch (_) {}
  };

  // ---- Enhancement: Heatmap data ----
  const getHeatmapData = () => {
    return chapterGroups.map(g => ({
      label: getChapterLabel(g.bookId, g.chapterId),
      count: g.events.length,
      bookId: g.bookId,
      chapterId: g.chapterId,
    }));
  };

  // ---- Enhancement: Event templates ----
  const eventTemplates = [
    { label: 'Battle', type: 'milestone', titlePrefix: 'Battle of', color: 'red' },
    { label: 'Discovery', type: 'milestone', titlePrefix: 'Discovery:', color: 'blue' },
    { label: 'Death', type: 'character_appearance', titlePrefix: 'Death of', color: 'gray' },
    { label: 'Romance', type: 'relationship_change', titlePrefix: 'Romance:', color: 'pink' },
    { label: 'Betrayal', type: 'relationship_change', titlePrefix: 'Betrayal by', color: 'orange' },
    { label: 'Travel', type: 'travel', titlePrefix: 'Journey to', color: 'cyan' },
    { label: 'Skill Gained', type: 'skill_event', titlePrefix: 'Gained:', color: 'purple' },
    { label: 'Item Found', type: 'item_event', titlePrefix: 'Found:', color: 'yellow' },
  ];

  // Auto-extract events from all chapters
  const handleExtractEventsFromChapters = async () => {
    if (!books || (Array.isArray(books) ? books.length === 0 : Object.keys(books).length === 0)) {
      toastService.error('No books found. Please add chapters first.');
      return;
    }

    setIsExtracting(true);
    try {
      const booksArray = Array.isArray(books) ? books : Object.values(books || {});
      const allChapters = [];
      booksArray.forEach(book => {
        if (book && book.chapters && Array.isArray(book.chapters)) {
          book.chapters.forEach(chapter => {
            allChapters.push({
              bookId: book.id,
              chapterId: chapter.id,
              chapterNumber: chapter.number || 0,
              content: chapter.content || chapter.script || ''
            });
          });
        }
      });

      if (allChapters.length === 0) {
        toastService.error('No chapters found in books.');
        return;
      }

      const extractedEvents = [];
      for (const chapter of allChapters) {
        if (!chapter.content || chapter.content.trim().length < 50) continue;

        const events = await chapterDataExtractionService.extractEventsFromChapter(
          chapter.content,
          chapter.chapterId,
          chapter.bookId,
          actors || []
        );

        // Save events to database with duplicate checking
        for (const event of events) {
          try {
            const savedEvent = await dataConsistencyService.addTimelineEventSafe(event);
            extractedEvents.push(savedEvent);
          } catch (e) {
            console.error('Error saving event:', e);
          }
        }
      }

      // Reload events
      await loadEvents();
      toastService.success(`Extracted ${extractedEvents.length} events from ${allChapters.length} chapters.`);
    } catch (error) {
      console.error('Error extracting events:', error);
      toastService.error('Error extracting events: ' + error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [events, searchQuery, selectedTypes, selectedActors, selectedBook]);

  useEffect(() => {
    if (isPlaying) {
      playbackRef.current = setInterval(() => {
        setPlaybackPosition(prev => {
          const maxPosition = filteredEvents.length - 1;
          if (prev >= maxPosition) {
            setIsPlaying(false);
            return maxPosition;
          }
          return prev + 1;
        });
      }, 1500);
    } else {
      clearInterval(playbackRef.current);
    }

    return () => clearInterval(playbackRef.current);
  }, [isPlaying, filteredEvents.length]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const timelineEvents = await db.getAll('timelineEvents');
      
      // Sort by chapter order, then timestamp
      const sorted = timelineEvents.sort((a, b) => {
        if (a.bookId !== b.bookId) return (a.bookId || 0) - (b.bookId || 0);
        if (a.chapterId !== b.chapterId) return (a.chapterId || 0) - (b.chapterId || 0);
        return (a.timestamp || 0) - (b.timestamp || 0);
      });
      
      setEvents(sorted);
    } catch (error) {
      console.error('Error loading timeline events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(evt => 
        evt.title?.toLowerCase().includes(query) ||
        evt.description?.toLowerCase().includes(query) ||
        evt.actors?.some(a => a.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(evt => selectedTypes.includes(evt.type));
    }

    // Actor filter
    if (selectedActors.length > 0) {
      filtered = filtered.filter(evt => 
        evt.actors?.some(a => selectedActors.includes(a))
      );
    }

    // Book filter
    if (selectedBook !== 'all') {
      filtered = filtered.filter(evt => evt.bookId === parseInt(selectedBook));
    }

    setFilteredEvents(filtered);
  };

  const toggleType = (typeId) => {
    setSelectedTypes(prev => 
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const toggleActor = (actorName) => {
    setSelectedActors(prev =>
      prev.includes(actorName)
        ? prev.filter(a => a !== actorName)
        : [...prev, actorName]
    );
  };

  const getEventIcon = (type) => {
    const eventType = eventTypes.find(et => et.id === type);
    return eventType?.icon || Clock;
  };

  const getEventColor = (type) => {
    const eventType = eventTypes.find(et => et.id === type);
    return eventType?.color || 'gray';
  };

  const getChapterLabel = (bookId, chapterId) => {
    if (!books) return `Ch ${chapterId}`;
    // Handle both array and object formats
    const booksArray = Array.isArray(books) ? books : Object.values(books);
    const book = booksArray.find(b => b.id === bookId || b.id === String(bookId));
    if (!book) return `Ch ${chapterId}`;
    const chapter = book.chapters?.find(c => c.id === chapterId || c.id === String(chapterId) || c.number === chapterId);
    return chapter?.title || `Chapter ${chapterId}`;
  };

  const getBookLabel = (bookId) => {
    if (!books) return `Book ${bookId}`;
    // Handle both array and object formats
    const booksArray = Array.isArray(books) ? books : Object.values(books);
    const book = booksArray.find(b => b.id === bookId || b.id === String(bookId));
    return book?.title || `Book ${bookId}`;
  };

  // Group events by chapter for timeline lanes
  const groupedByChapter = filteredEvents.reduce((acc, evt) => {
    const key = `${evt.bookId || 0}-${evt.chapterId || 0}`;
    if (!acc[key]) {
      acc[key] = {
        bookId: evt.bookId,
        chapterId: evt.chapterId,
        events: []
      };
    }
    acc[key].events.push(evt);
    return acc;
  }, {});

  const chapterGroups = Object.values(groupedByChapter).sort((a, b) => {
    if (a.bookId !== b.bookId) return (a.bookId || 0) - (b.bookId || 0);
    return (a.chapterId || 0) - (b.chapterId || 0);
  });

  // Get unique actors from events
  const uniqueActors = [...new Set(events.flatMap(evt => evt.actors || []))];

  const cardWidth = 200 * zoomLevel;
  const cardHeight = 120 * zoomLevel;
  const cardGap = 20 * zoomLevel;

  // Start editing an event
  const startEditing = (event) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title || '',
      description: event.description || '',
      type: event.type || 'milestone',
      actors: event.actors || []
    });
    setSelectedEvent(null);
  };

  // Save edited event
  const saveEvent = async () => {
    if (!editingEvent) return;
    
    try {
      const updatedEvent = {
        ...editingEvent,
        ...editForm,
        updatedAt: Date.now()
      };
      
      await db.update('timelineEvents', updatedEvent);
      setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
      setEditingEvent(null);
      setEditForm({});
      toastService.success('Event updated successfully');
    } catch (error) {
      console.error('Error saving event:', error);
      toastService.error('Failed to save event');
    }
  };

  // Delete event
  const deleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    
    try {
      await db.delete('timelineEvents', eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setSelectedEvent(null);
      setEditingEvent(null);
      toastService.success('Event deleted');
    } catch (error) {
      console.error('Error deleting event:', error);
      toastService.error('Failed to delete event');
    }
  };

  // Add new event
  const addEvent = async () => {
    if (!newEvent.title.trim()) {
      toastService.error('Event title is required');
      return;
    }
    
    try {
      const event = {
        id: `evt_manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...newEvent,
        timestamp: Date.now(),
        createdAt: Date.now(),
        importance: 0.5,
        plotThreads: []
      };
      
      await db.add('timelineEvents', event);
      setEvents(prev => [...prev, event]);
      setShowAddEventModal(false);
      setNewEvent({
        title: '',
        description: '',
        type: 'milestone',
        bookId: null,
        chapterId: null,
        actors: []
      });
      toastService.success('Event added successfully');
    } catch (error) {
      console.error('Error adding event:', error);
      toastService.error('Failed to add event');
    }
  };

  // Export to JSON
  const exportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      eventCount: filteredEvents.length,
      events: filteredEvents.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        type: e.type,
        bookId: e.bookId,
        chapterId: e.chapterId,
        actors: e.actors,
        locations: e.locations,
        timestamp: e.timestamp
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    toastService.success('Timeline exported as JSON');
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Description', 'Type', 'Book', 'Chapter', 'Actors', 'Locations', 'Timestamp'];
    const rows = filteredEvents.map(e => [
      e.id,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.type,
      e.bookId || '',
      e.chapterId || '',
      `"${(e.actors || []).join(', ')}"`,
      `"${(e.locations || []).join(', ')}"`,
      e.timestamp ? new Date(e.timestamp).toISOString() : ''
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    toastService.success('Timeline exported as CSV');
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-blue-500/30 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="text-blue-500" />
            MASTER TIMELINE
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {filteredEvents.length} events across your story
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-Extract Events */}
          <button
            onClick={handleExtractEventsFromChapters}
            disabled={isExtracting}
            className="p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded flex items-center gap-2"
            title="Auto-extract events from all chapters"
          >
            <Sparkles className="w-5 h-5" />
            {isExtracting ? 'Extracting...' : 'Auto-Extract'}
          </button>
          {/* Add Event */}
          <button
            onClick={() => setShowAddEventModal(true)}
            className="p-2 bg-green-600 hover:bg-green-500 text-white rounded"
            title="Add new event"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded"
              title="Export timeline"
            >
              <Download className="w-5 h-5" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded shadow-xl z-50 min-w-[150px]">
                <button
                  onClick={exportJSON}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-800 flex items-center gap-2"
                >
                  <FileJson className="w-4 h-4 text-blue-400" />
                  Export JSON
                </button>
                <button
                  onClick={exportCSV}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-800 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-400" />
                  Export CSV
                </button>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <button
            onClick={() => {
              if (!isPlaying && playbackPosition >= filteredEvents.length - 1) {
                setPlaybackPosition(0);
              }
              setIsPlaying(!isPlaying);
            }}
            className={`p-2 rounded ${isPlaying ? 'bg-red-600' : 'bg-blue-600'} text-white`}
            title={isPlaying ? 'Pause' : 'Play through timeline'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          {/* Zoom Controls */}
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-slate-400 w-12 text-center">
            {(zoomLevel * 100).toFixed(0)}%
          </span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.25))}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          {/* Act Markers button */}
          <button
            onClick={() => setShowActMarkerModal(v => !v)}
            className={`p-2 rounded text-white flex items-center gap-1 text-sm ${showActMarkerModal ? 'bg-amber-700' : 'bg-slate-800 hover:bg-slate-700'}`}
            title="Act Markers — divide your story into acts"
          >
            <Calendar className="w-4 h-4" />
            Acts
          </button>

          {/* Heatmap toggle */}
          <button
            onClick={() => setShowHeatmap(v => !v)}
            className={`p-2 rounded text-white flex items-center gap-1 text-sm ${showHeatmap ? 'bg-orange-700' : 'bg-slate-800 hover:bg-slate-700'}`}
            title="Activity Heatmap — events per chapter"
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          {/* Event Templates */}
          <button
            onClick={() => setShowEventTemplates(v => !v)}
            className={`p-2 rounded text-white flex items-center gap-1 text-sm ${showEventTemplates ? 'bg-green-700' : 'bg-slate-800 hover:bg-slate-700'}`}
            title="Event templates"
          >
            <Plus className="w-4 h-4" />
            Template
          </button>

          {/* AI Insights Button */}
          <button
            onClick={loadAISuggestions}
            disabled={isLoadingSuggestions}
            className="p-2 bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-700 text-white rounded flex items-center gap-2"
            title="Generate AI foreshadowing & callback insights"
          >
            <Sparkles className="w-5 h-5" />
            {isLoadingSuggestions ? 'Analysing...' : 'AI Insights'}
          </button>

          {aiSuggestions.length > 0 && (
            <button
              onClick={() => setShowAISuggestions(v => !v)}
              className={`p-2 rounded text-sm font-bold border ${showAISuggestions ? 'bg-indigo-900 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-indigo-500'}`}
            >
              {aiSuggestions.length} Insights {showAISuggestions ? '▲' : '▼'}
            </button>
          )}

          {onClose && (
            <button onClick={onClose} className="ml-2 text-slate-500 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showAISuggestions && aiSuggestions.length > 0 && (
        <div className="bg-indigo-950/60 border-b border-indigo-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Story Insights — Foreshadowing &amp; Callback Opportunities
            </h3>
            <button onClick={() => setShowAISuggestions(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="bg-indigo-900/40 border border-indigo-700/50 rounded-lg p-3">
                {s.type && (
                  <span className="text-[10px] uppercase font-bold text-indigo-400 mb-1 block tracking-wider">
                    {s.type.replace(/_/g, ' ')}
                  </span>
                )}
                <p className="text-xs text-slate-200 leading-relaxed">
                  {s.suggestion || s.text || s.description || JSON.stringify(s)}
                </p>
                {s.chapter && (
                  <p className="text-[10px] text-slate-500 mt-1">Chapter: {s.chapter}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="bg-slate-800 border border-slate-700 text-white text-sm pl-9 pr-3 py-1.5 rounded w-48 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Book Filter */}
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 rounded"
          >
            <option value="all">All Books</option>
            {books && Object.entries(books).map(([id, book]) => (
              <option key={id} value={id}>{book.title || `Book ${id}`}</option>
            ))}
          </select>

          {/* Type Filters */}
          <div className="flex gap-1">
            {eventTypes.map(et => (
              <button
                key={et.id}
                onClick={() => toggleType(et.id)}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  selectedTypes.includes(et.id)
                    ? `bg-${et.color}-600 text-white`
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
                title={et.label}
              >
                <et.icon className="w-3 h-3" />
                <span className="hidden md:inline">{et.label}</span>
              </button>
            ))}
          </div>

          {/* Actor Filter Dropdown */}
          {uniqueActors.length > 0 && (
            <select
              onChange={(e) => e.target.value && toggleActor(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1.5 rounded"
              value=""
            >
              <option value="">Filter by Actor</option>
              {uniqueActors.map(actor => (
                <option key={actor} value={actor}>{actor}</option>
              ))}
            </select>
          )}

          {/* Selected Actor Tags */}
          {selectedActors.length > 0 && (
            <div className="flex gap-1">
              {selectedActors.map(actor => (
                <span
                  key={actor}
                  onClick={() => toggleActor(actor)}
                  className="px-2 py-0.5 bg-green-600 text-white text-xs rounded cursor-pointer flex items-center gap-1"
                >
                  {actor}
                  <X className="w-3 h-3" />
                </span>
              ))}
            </div>
          )}

          {/* Clear Filters */}
          {(selectedTypes.length > 0 || selectedActors.length > 0 || searchQuery || selectedBook !== 'all') && (
            <button
              onClick={() => {
                setSelectedTypes([]);
                setSelectedActors([]);
                setSearchQuery('');
                setSelectedBook('all');
              }}
              className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded hover:bg-red-600/30"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ---- Enhancement: Activity Heatmap ---- */}
      {showHeatmap && (
        <div className="bg-slate-900 border-b border-orange-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-orange-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Activity Heatmap — Events Per Chapter
            </h3>
            <button onClick={() => setShowHeatmap(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {getHeatmapData().map((d, i) => {
              const max = Math.max(...getHeatmapData().map(x => x.count), 1);
              const intensity = Math.round((d.count / max) * 5);
              const colors = ['bg-slate-800', 'bg-orange-900', 'bg-orange-700', 'bg-orange-500', 'bg-orange-400', 'bg-orange-300'];
              return (
                <div key={i} className="flex flex-col items-center gap-1" title={`${d.label}: ${d.count} events`}>
                  <div className={`w-8 h-8 rounded ${colors[intensity]} flex items-center justify-center text-[10px] text-white font-bold`}>
                    {d.count}
                  </div>
                  <div className="text-[9px] text-slate-500 w-8 text-center truncate">{d.label.slice(0, 4)}</div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2 items-center">
            <span className="text-xs text-slate-500">Low</span>
            {['bg-slate-800','bg-orange-900','bg-orange-700','bg-orange-500','bg-orange-400','bg-orange-300'].map((c,i) => (
              <div key={i} className={`w-4 h-4 rounded ${c}`} />
            ))}
            <span className="text-xs text-slate-500">High</span>
          </div>
        </div>
      )}

      {/* ---- Enhancement: Act Markers Panel ---- */}
      {showActMarkerModal && (
        <div className="bg-slate-900 border-b border-amber-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Act Markers
            </h3>
            <button onClick={() => setShowActMarkerModal(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {actMarkers.map(m => (
              <div key={m.id} className="flex items-center gap-1 bg-amber-900/40 border border-amber-700 rounded px-2 py-1 text-xs text-amber-300">
                <span>{m.label}</span>
                <span className="text-slate-500">— {getChapterLabel(m.bookId, m.chapterId)}</span>
                <button onClick={() => removeActMarker(m.id)} className="text-red-400 hover:text-red-300 ml-1"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {['Act I', 'Act II', 'Act III', 'Prologue', 'Epilogue', 'Climax', 'Midpoint'].map(label => (
              <button
                key={label}
                onClick={() => {
                  const group = chapterGroups[0];
                  if (group) saveActMarker({ label, bookId: group.bookId, chapterId: group.chapterId });
                }}
                className="text-xs bg-amber-800 hover:bg-amber-700 text-white px-2 py-1 rounded"
              >
                + {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Enhancement: Event Templates ---- */}
      {showEventTemplates && (
        <div className="bg-slate-900 border-b border-green-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-green-300 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Event Templates
            </h3>
            <button onClick={() => setShowEventTemplates(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {eventTemplates.map(t => (
              <button
                key={t.label}
                onClick={() => {
                  setNewEvent({
                    title: t.titlePrefix + ' ...',
                    description: '',
                    type: t.type,
                    bookId: null,
                    chapterId: null,
                    actors: []
                  });
                  setShowAddEventModal(true);
                  setShowEventTemplates(false);
                }}
                className="px-3 py-1.5 bg-green-900/40 border border-green-700 hover:bg-green-800/50 rounded text-xs text-green-300"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <LoadingSkeleton.Table rows={5} cols={4} className="w-full max-w-4xl" />
            <div className="mt-6 flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
              <p className="text-slate-400">Loading timeline...</p>
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyTimeline onAddEvent={() => {/* Navigate to manuscript processing */}} />
        ) : (
          <div 
            ref={timelineRef}
            className="h-full overflow-x-auto overflow-y-auto p-4"
            style={{ 
              scrollBehavior: 'smooth'
            }}
          >
            {/* Timeline Track */}
            <div className="min-h-full" style={{ minWidth: chapterGroups.length * (cardWidth + cardGap) + 200 }}>
              
              {/* Chapter Headers */}
              <div className="flex mb-4 sticky top-0 bg-slate-950 z-10 pb-2">
                {chapterGroups.map((group, idx) => (
                  <div 
                    key={`${group.bookId}-${group.chapterId}`}
                    className="flex-shrink-0"
                    style={{ width: cardWidth + cardGap }}
                  >
                    <div className={`bg-slate-900 border rounded-lg p-3 relative ${
                      actMarkers.some(m => m.bookId === group.bookId && m.chapterId === group.chapterId)
                        ? 'border-amber-500'
                        : 'border-slate-700'
                    }`}>
                      {actMarkers.filter(m => m.bookId === group.bookId && m.chapterId === group.chapterId).map(m => (
                        <div key={m.id} className="absolute -top-3 left-1 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {m.label}
                        </div>
                      ))}
                      <div className="text-[10px] text-slate-500">{getBookLabel(group.bookId)}</div>
                      <div className="text-sm font-bold text-white truncate">
                        {getChapterLabel(group.bookId, group.chapterId)}
                      </div>
                      <div className="text-xs text-slate-400">{group.events.length} events</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline Line */}
              <div className="relative">
                <div 
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded"
                  style={{ marginLeft: cardWidth / 2 }}
                />
                
                {/* Playback Indicator */}
                {isPlaying && (
                  <div 
                    className="absolute top-0 w-1 h-1 bg-white rounded-full z-20 transition-all duration-300"
                    style={{ 
                      left: playbackPosition * (cardWidth + cardGap) + cardWidth / 2,
                      boxShadow: '0 0 10px 4px rgba(255,255,255,0.5)'
                    }}
                  />
                )}
              </div>

              {/* Event Cards */}
              <div className="flex mt-4">
                {chapterGroups.map((group, groupIdx) => (
                  <div
                    key={`${group.bookId}-${group.chapterId}`}
                    className="flex-shrink-0"
                    style={{ width: cardWidth + cardGap }}
                  >
                    <div className="space-y-3 pr-4">
                      {group.events.map((event, eventIdx) => {
                        const Icon = getEventIcon(event.type);
                        const color = getEventColor(event.type);
                        const globalIndex = filteredEvents.indexOf(event);
                        const isHighlighted = isPlaying && globalIndex === playbackPosition;

                        return (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (event.bookId && event.chapterId) {
                                chapterNavigationService.navigateToChapter(event.bookId, event.chapterId);
                              }
                            }}
                            className={`bg-slate-900 border rounded-lg p-3 cursor-pointer transition-all ${
                              isHighlighted
                                ? 'border-white ring-2 ring-white/50 scale-105'
                                : selectedEvent?.id === event.id
                                  ? 'border-purple-500 bg-purple-900/20'
                                  : `border-${color}-500/30 hover:border-${color}-500/50`
                            }`}
                            style={{
                              minHeight: cardHeight,
                              transform: isHighlighted ? 'scale(1.05)' : 'scale(1)'
                            }}
                            title={event.bookId && event.chapterId ? 'Double-click to navigate to chapter' : ''}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-1.5 rounded bg-${color}-900/30`}>
                                <Icon className={`w-4 h-4 text-${color}-400`} />
                              </div>
                              <span className={`text-xs px-1.5 py-0.5 rounded bg-${color}-900/30 text-${color}-400`}>
                                {event.type?.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="font-bold text-white text-sm line-clamp-2 mb-1">
                              {event.title}
                            </div>
                            {event.description && (
                              <div className="text-xs text-slate-400 line-clamp-2">
                                {event.description}
                              </div>
                            )}
                            {event.actors && event.actors.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {event.actors.slice(0, 3).map((actor, i) => (
                                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                                    {actor}
                                  </span>
                                ))}
                                {event.actors.length > 3 && (
                                  <span className="text-[10px] text-slate-500">+{event.actors.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Panel */}
      {selectedEvent && !editingEvent && (
        <div className="bg-slate-900 border-t border-slate-700 p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {React.createElement(getEventIcon(selectedEvent.type), {
                  className: `w-5 h-5 text-${getEventColor(selectedEvent.type)}-400`
                })}
                <h3 className="text-lg font-bold text-white">{selectedEvent.title}</h3>
              </div>
              <p className="text-sm text-slate-300 mb-2">{selectedEvent.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {getBookLabel(selectedEvent.bookId)} - {getChapterLabel(selectedEvent.bookId, selectedEvent.chapterId)}
                </span>
                {selectedEvent.actors?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {selectedEvent.actors.join(', ')}
                  </span>
                )}
                {selectedEvent.locations?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedEvent.locations.join(', ')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedEvent.bookId && selectedEvent.chapterId && (
                <button
                  onClick={() => chapterNavigationService.navigateToChapter(selectedEvent.bookId, selectedEvent.chapterId)}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center gap-1"
                  title="View in Series Bible"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs">View Chapter</span>
                </button>
              )}
              <button
                onClick={() => startEditing(selectedEvent)}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
                title="Edit event"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteEvent(selectedEvent.id)}
                className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded"
                title="Delete event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-500 hover:text-white p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Panel */}
      {editingEvent && (
        <div className="bg-slate-900 border-t border-blue-500 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              Edit Event
            </h3>
            <div className="flex gap-2">
              <button
                onClick={saveEvent}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => { setEditingEvent(null); setEditForm({}); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Title</label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Type</label>
              <select
                value={editForm.type || 'milestone'}
                onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-sm"
              >
                {eventTypes.map(et => (
                  <option key={et.id} value={et.id}>{et.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Description</label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-sm resize-none"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Actors (comma-separated)</label>
              <input
                type="text"
                value={(editForm.actors || []).join(', ')}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  actors: e.target.value.split(',').map(a => a.trim()).filter(a => a) 
                }))}
                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500 rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-400" />
              Add New Event
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Event title"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                >
                  {eventTypes.map(et => (
                    <option key={et.id} value={et.id}>{et.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Event description"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Book</label>
                  <select
                    value={newEvent.bookId || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, bookId: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                  >
                    <option value="">Select book</option>
                    {books && Object.entries(books).map(([id, book]) => (
                      <option key={id} value={id}>{book.title || `Book ${id}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Chapter</label>
                  <select
                    value={newEvent.chapterId || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, chapterId: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                    disabled={!newEvent.bookId}
                  >
                    <option value="">Select chapter</option>
                    {newEvent.bookId && books?.[newEvent.bookId]?.chapters?.map((ch, idx) => (
                      <option key={ch.id} value={ch.id}>Ch {idx + 1}: {ch.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Actors (comma-separated)</label>
                <input
                  type="text"
                  value={(newEvent.actors || []).join(', ')}
                  onChange={(e) => setNewEvent(prev => ({ 
                    ...prev, 
                    actors: e.target.value.split(',').map(a => a.trim()).filter(a => a) 
                  }))}
                  placeholder="Character names"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={addEvent}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Event
              </button>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterTimeline;

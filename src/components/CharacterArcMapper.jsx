import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, X, Filter, BarChart3, Sparkles, Save, Clock, ChevronRight, MapPin } from 'lucide-react';
import db from '../services/database';
import aiService from '../services/aiService';
import toastService from '../services/toastService';
import chapterDataExtractionService from '../services/chapterDataExtractionService';
import chapterNavigationService from '../services/chapterNavigationService';
import aiSuggestionService from '../services/aiSuggestionService';

/**
 * Character Arc Mapper - Visualize and track character development arcs
 */
const CharacterArcMapper = ({ actors, books, onClose }) => {
  const [selectedActors, setSelectedActors] = useState([]);
  const [arcStages, setArcStages] = useState(['introduction', 'development', 'conflict', 'resolution']);
  const [arcData, setArcData] = useState({});
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [viewMode, setViewMode] = useState('stages'); // 'stages' | 'timeline'
  const [characterTimeline, setCharacterTimeline] = useState({});
  const [relationships, setRelationships] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    loadArcData();
  }, [actors, books]);

  /**
   * Load AI suggestions for selected characters
   */
  const loadAISuggestions = async () => {
    if (selectedActors.length === 0) {
      setAiSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const allSuggestions = [];
      
      // Get all chapters for context
      const allChapters = Array.isArray(books) 
        ? books.flatMap(b => (b.chapters || []).map(ch => ({ ...ch, bookId: b.id })))
        : [];

      // Load suggestions from database for character growth
      try {
        const dbSuggestions = await db.getAll('aiSuggestions') || [];
        const characterGrowthSuggestions = dbSuggestions.filter(s => 
          s.type === 'character_growth' &&
          s.characters && 
          s.characters.some(charName => selectedActors.some(actorId => {
            const actor = actors.find(a => a.id === actorId);
            return actor && (actor.name === charName || charName.includes(actor.name));
          }))
        );
        allSuggestions.push(...characterGrowthSuggestions);
      } catch (e) {
        console.warn('Error loading suggestions from database:', e);
      }

      // Also generate new suggestions if we have chapter text
      if (allChapters.length > 0) {
        const selectedCharacterNames = selectedActors
          .map(id => actors.find(a => a.id === id)?.name)
          .filter(Boolean);

        for (const chapter of allChapters.slice(0, 5)) { // Check first 5 chapters
          const chapterText = chapter.script || chapter.content || '';
          if (chapterText.length > 50) {
            try {
              const suggestions = await aiSuggestionService.suggestCharacterGrowth(
                chapterText,
                selectedActors.map(id => actors.find(a => a.id === id)).filter(Boolean)
              );
              allSuggestions.push(...suggestions);
            } catch (error) {
              console.warn('Error generating character growth suggestions:', error);
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

  const loadArcData = async () => {
    try {
      const saved = await db.getAll('characterArcs');
      if (saved.length > 0) {
        const arcs = {};
        saved.forEach(arc => {
          arcs[arc.characterId] = arc;
        });
        setArcData(arcs);
      } else {
        // Initialize arcs from actors
        initializeArcs();
      }
    } catch (error) {
      console.error('Error loading character arcs:', error);
      initializeArcs();
    }
  };

  const initializeArcs = () => {
    if (!actors || !Array.isArray(actors)) return;
    
    const arcs = {};
    actors.forEach(actor => {
      arcs[actor.id] = {
        characterId: actor.id,
        characterName: actor.name,
        stages: {
          introduction: { chapter: null, description: '', completion: 0 },
          development: { chapter: null, description: '', completion: 0 },
          conflict: { chapter: null, description: '', completion: 0 },
          resolution: { chapter: null, description: '', completion: 0 }
        },
        statProgression: [],
        skillProgression: [],
        relationshipChanges: [],
        overallCompletion: 0,
        updatedAt: Date.now()
      };
    });
    setArcData(arcs);
    saveArcData(arcs);
  };

  const saveArcData = async (arcsToSave = arcData) => {
    try {
      const arcsArray = Object.values(arcsToSave);
      for (const arc of arcsArray) {
        await db.update('characterArcs', arc);
      }
    } catch (error) {
      console.error('Error saving character arcs:', error);
    }
  };

  const updateArcStage = (characterId, stage, field, value) => {
    setArcData(prev => {
      const updated = { ...prev };
      if (!updated[characterId]) {
        updated[characterId] = {
          characterId,
          characterName: actors.find(a => a.id === characterId)?.name || 'Unknown',
          stages: {
            introduction: { chapter: null, description: '', completion: 0 },
            development: { chapter: null, description: '', completion: 0 },
            conflict: { chapter: null, description: '', completion: 0 },
            resolution: { chapter: null, description: '', completion: 0 }
          },
          statProgression: [],
          skillProgression: [],
          relationshipChanges: [],
          overallCompletion: 0,
          updatedAt: Date.now()
        };
      }
      updated[characterId].stages[stage] = {
        ...updated[characterId].stages[stage],
        [field]: value
      };
      
      // Calculate overall completion
      const stageCompletions = Object.values(updated[characterId].stages).map(s => s.completion || 0);
      updated[characterId].overallCompletion = Math.round(
        stageCompletions.reduce((a, b) => a + b, 0) / stageCompletions.length
      );
      updated[characterId].updatedAt = Date.now();
      
      return updated;
    });
  };

  const analyzeArc = async (characterId) => {
    setShowAIAnalysis(true);
    try {
      const arc = arcData[characterId];
      if (!arc) return;

      const character = actors.find(a => a.id === characterId);
      const stagesText = Object.entries(arc.stages)
        .map(([stage, data]) => `${stage}: ${data.description || 'No description'}`)
        .join('\n');

      const analysis = await aiService.checkConsistencyAuto(
        `Character Arc Analysis for ${character.name}:\n${stagesText}`,
        { actors, books }
      );

      setAiAnalysis({
        characterId,
        characterName: character.name,
        analysis: analysis || 'Analysis complete. Arc appears consistent.',
        suggestions: []
      });

      toastService.success('Arc analysis complete');
    } catch (error) {
      toastService.error('Analysis failed: ' + error.message);
    }
  };

  // Auto-track character data from all chapters
  const autoTrackFromChapters = async () => {
    if (!books || !Array.isArray(books) || books.length === 0) {
      toastService.error('No books found. Please add chapters first.');
      return;
    }

    setIsTracking(true);
    try {
      const booksArray = Array.isArray(books) ? books : Object.values(books || {});
      const allChapters = [];
      booksArray.forEach(book => {
        if (book && book.chapters && Array.isArray(book.chapters)) {
          book.chapters.forEach(chapter => {
            allChapters.push({
              bookId: book.id,
              bookTitle: book.title || `Book ${book.id}`,
              chapterId: chapter.id,
              chapterNumber: chapter.number || 0,
              title: chapter.title || `Chapter ${chapter.number || ''}`,
              script: chapter.script || chapter.content || '',
              desc: chapter.desc || ''
            });
          });
        }
      });

      if (allChapters.length === 0) {
        toastService.error('No chapters found in books.');
        return;
      }

      const timelineData = {};
      const updatedArcs = { ...arcData };

      // Process each chapter
      for (const chapter of allChapters) {
        if (!chapter.script || chapter.script.trim().length < 50) continue;

        const characterData = await chapterDataExtractionService.extractCharacterDataFromChapter(
          chapter.script,
          chapter.chapterId,
          chapter.bookId,
          actors || []
        );

        // Update timeline for each character
        characterData.appearances.forEach(appearance => {
          const actor = actors.find(a => 
            a.name.toLowerCase() === appearance.character.toLowerCase()
          );
          if (!actor) return;

          if (!timelineData[actor.id]) {
            timelineData[actor.id] = {
              appearances: [],
              statChanges: [],
              skillChanges: [],
              relationshipChanges: []
            };
          }

          timelineData[actor.id].appearances.push({
            ...appearance,
            chapterId: chapter.chapterId,
            bookId: chapter.bookId,
            chapterNumber: chapter.chapterNumber,
            chapterTitle: chapter.title
          });
        });

        characterData.statChanges.forEach(change => {
          const actor = actors.find(a => 
            a.name.toLowerCase() === change.character.toLowerCase()
          );
          if (actor && timelineData[actor.id]) {
            timelineData[actor.id].statChanges.push({
              ...change,
              chapterId: chapter.chapterId,
              bookId: chapter.bookId,
              chapterNumber: chapter.chapterNumber
            });
          }
        });

        characterData.skillChanges.forEach(change => {
          const actor = actors.find(a => 
            a.name.toLowerCase() === change.character.toLowerCase()
          );
          if (actor && timelineData[actor.id]) {
            timelineData[actor.id].skillChanges.push({
              ...change,
              chapterId: chapter.chapterId,
              bookId: chapter.bookId,
              chapterNumber: chapter.chapterNumber
            });
          }
        });

        characterData.relationshipChanges.forEach(change => {
          const actor1 = actors.find(a => 
            a.name.toLowerCase() === change.character1?.toLowerCase()
          );
          const actor2 = actors.find(a => 
            a.name.toLowerCase() === change.character2?.toLowerCase()
          );
          if (actor1 && timelineData[actor1.id]) {
            timelineData[actor1.id].relationshipChanges.push({
              ...change,
              chapterId: chapter.chapterId,
              bookId: chapter.bookId,
              chapterNumber: chapter.chapterNumber
            });
          }
          if (actor2) {
            if (!timelineData[actor2.id]) {
              timelineData[actor2.id] = {
                appearances: [],
                statChanges: [],
                skillChanges: [],
                relationshipChanges: []
              };
            }
            timelineData[actor2.id].relationshipChanges.push({
              ...change,
              chapterId: chapter.chapterId,
              bookId: chapter.bookId,
              chapterNumber: chapter.chapterNumber
            });
          }
        });
      }

      setCharacterTimeline(timelineData);
      
      // Update arc data with first/last appearances
      Object.keys(timelineData).forEach(actorId => {
        const timeline = timelineData[actorId];
        if (timeline.appearances.length > 0) {
          const sorted = timeline.appearances.sort((a, b) => 
            (a.chapterNumber || 0) - (b.chapterNumber || 0)
          );
          const first = sorted[0];

          if (!updatedArcs[actorId]) {
            const actor = actors.find(a => a.id === actorId);
            if (actor) {
              updatedArcs[actorId] = {
                characterId: actorId,
                characterName: actor.name,
                stages: {
                  introduction: { chapter: null, description: '', completion: 0 },
                  development: { chapter: null, description: '', completion: 0 },
                  conflict: { chapter: null, description: '', completion: 0 },
                  resolution: { chapter: null, description: '', completion: 0 }
                },
                overallCompletion: 0,
                updatedAt: Date.now()
              };
            }
          }

          if (updatedArcs[actorId] && !updatedArcs[actorId].stages.introduction.chapter) {
            updatedArcs[actorId].stages.introduction.chapter = first.chapterId;
            updatedArcs[actorId].stages.introduction.description = 
              `First appearance in ${first.chapterTitle}`;
          }
        }
      });

      setArcData(updatedArcs);
      await saveArcData(updatedArcs);
      toastService.success(`Auto-tracked data for ${Object.keys(timelineData).length} character(s)`);
    } catch (error) {
      console.error('Error auto-tracking from chapters:', error);
      toastService.error('Auto-tracking failed: ' + error.message);
    } finally {
      setIsTracking(false);
    }
  };

  const autoAssignArcsFromChapters = async () => {
    if (!books || !Array.isArray(books) || books.length === 0) {
      toastService.error('No books found. Please add chapters first.');
      return;
    }

    try {
      // Extract all chapters from books - handle both array and object formats
      const booksArray = Array.isArray(books) ? books : Object.values(books || {});
      const allChapters = [];
      booksArray.forEach(book => {
        if (book && book.chapters && Array.isArray(book.chapters)) {
          book.chapters.forEach(chapter => {
            allChapters.push({
              bookId: book.id,
              bookTitle: book.title || `Book ${book.id}`,
              chapterId: chapter.id,
              chapterNumber: chapter.number || 0,
              title: chapter.title || `Chapter ${chapter.number || ''}`,
              script: chapter.script || chapter.content || '',
              desc: chapter.desc || ''
            });
          });
        }
      });

      if (allChapters.length === 0) {
        toastService.error('No chapters found in books.');
        return;
      }

      // Sort chapters by book and chapter number
      allChapters.sort((a, b) => {
        if (a.bookId !== b.bookId) return a.bookId - b.bookId;
        return a.chapterNumber - b.chapterNumber;
      });

      // Analyze each actor's arc
      const updatedArcs = { ...arcData };
      
      for (const actor of actors) {
        if (!actor || !actor.id) continue;

        try {
          // Prepare chapter data for AI analysis
          const chapterData = allChapters.map(c => ({
            bookId: c.bookId,
            chapterId: c.chapterId,
            title: c.title,
            script: c.script || c.desc || ''
          }));

          // Use AI to analyze character arc
          const arcAnalysis = await aiService.analyzeCharacterArc(
            actor.id,
            chapterData,
            actor.snapshots || {}
          );

          if (arcAnalysis) {
            // Initialize arc if it doesn't exist
            if (!updatedArcs[actor.id]) {
              updatedArcs[actor.id] = {
                characterId: actor.id,
                characterName: actor.name,
                stages: {
                  introduction: { chapter: null, description: '', completion: 0 },
                  development: { chapter: null, description: '', completion: 0 },
                  conflict: { chapter: null, description: '', completion: 0 },
                  resolution: { chapter: null, description: '', completion: 0 }
                },
                statProgression: [],
                skillProgression: [],
                relationshipChanges: [],
                overallCompletion: 0,
                updatedAt: Date.now()
              };
            }

            // Map AI analysis to arc stages
            const stages = ['introduction', 'development', 'conflict', 'resolution'];
            stages.forEach(stage => {
              if (arcAnalysis[stage]) {
                const stageData = arcAnalysis[stage];
                
                // Find chapter by ID or number
                let chapterId = null;
                if (stageData.chapter) {
                  // Try to find chapter by various formats
                  const foundChapter = allChapters.find(c => 
                    c.chapterId === stageData.chapter ||
                    String(c.chapterNumber) === String(stageData.chapter) ||
                    c.title.toLowerCase().includes(stageData.chapter.toLowerCase())
                  );
                  if (foundChapter) {
                    chapterId = foundChapter.chapterId;
                  }
                }

                updatedArcs[actor.id].stages[stage] = {
                  chapter: chapterId,
                  description: stageData.description || '',
                  completion: stageData.completion || 0
                };
              }
            });

            // Update overall completion
            const stageCompletions = Object.values(updatedArcs[actor.id].stages).map(s => s.completion || 0);
            updatedArcs[actor.id].overallCompletion = Math.round(
              stageCompletions.reduce((a, b) => a + b, 0) / stageCompletions.length
            );
            updatedArcs[actor.id].updatedAt = Date.now();
          }
        } catch (error) {
          console.error(`Error analyzing arc for ${actor.name}:`, error);
        }
      }

      // Update state and save
      setArcData(updatedArcs);
      await saveArcData(updatedArcs);
      toastService.success(`Auto-assigned arcs for ${actors.length} character(s)`);
    } catch (error) {
      console.error('Error auto-assigning arcs:', error);
      toastService.error('Auto-assignment failed: ' + error.message);
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'introduction': return '#3b82f6';
      case 'development': return '#22c55e';
      case 'conflict': return '#ef4444';
      case 'resolution': return '#a855f7';
      default: return '#64748b';
    }
  };

  const getStageLabel = (stage) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  };

  const filteredActors = selectedActors.length === 0 
    ? (actors || [])
    : (actors || []).filter(a => selectedActors.includes(a.id));

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-green-500/30 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <TrendingUp className="mr-3 text-green-500" />
            CHARACTER ARC MAPPER
          </h2>
          <p className="text-sm text-slate-400 mt-1">Visualize and track character development arcs</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={loadAISuggestions}
            disabled={isLoadingSuggestions || selectedActors.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-lg transition-colors"
            title="Load AI suggestions for character growth"
          >
            <Sparkles className="w-4 h-4" />
            {isLoadingSuggestions ? 'Loading...' : `AI Suggestions${aiSuggestions.length > 0 ? ` (${aiSuggestions.length})` : ''}`}
          </button>
          <button
            onClick={autoTrackFromChapters}
            disabled={isTracking}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white rounded-lg transition-colors"
            title="Auto-track appearances, stat changes, skills, and relationships from all chapters"
          >
            <Clock className="w-4 h-4" />
            {isTracking ? 'Tracking...' : 'Auto-Track from Chapters'}
          </button>
          <button
            onClick={autoAssignArcsFromChapters}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            title="Auto-assign arc stages from chapters using AI analysis"
          >
            <Sparkles className="w-4 h-4" />
            Auto-Assign Stages
          </button>
          <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
            <button
              onClick={() => setViewMode('stages')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'stages' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Stages
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'timeline' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Timeline
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
            <input
              type="checkbox"
              checked={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.checked)}
              className="rounded"
            />
            Comparison Mode
          </label>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Character Selection */}
        <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950 overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white mb-3">CHARACTERS</h3>
            <div className="space-y-2">
              {actors && Array.isArray(actors) && actors.map(actor => {
                const arc = arcData[actor.id];
                const completion = arc?.overallCompletion || 0;
                return (
                  <div
                    key={actor.id}
                    onClick={() => {
                      if (selectedActors.includes(actor.id)) {
                        setSelectedActors(prev => prev.filter(id => id !== actor.id));
                      } else {
                        setSelectedActors(prev => [...prev, actor.id]);
                      }
                    }}
                    className={`p-3 rounded cursor-pointer border ${
                      selectedActors.includes(actor.id)
                        ? 'bg-green-900/50 border-green-500'
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold text-white">{actor.name}</div>
                      <div className="text-xs text-slate-400">{completion}%</div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
      </div>

      {/* AI Suggestions Panel */}
      {showAISuggestions && aiSuggestions.length > 0 && (
        <div className="flex-shrink-0 p-4 bg-purple-950/30 border-b border-purple-800/30 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-purple-400 font-bold">AI CHARACTER GROWTH SUGGESTIONS</div>
            <button
              onClick={() => setShowAISuggestions(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {aiSuggestions.slice(0, 5).map((suggestion, idx) => (
              <div key={idx} className="bg-slate-900 rounded p-2 border border-purple-800/50">
                <div className="text-xs text-white font-medium">
                  {suggestion.character || suggestion.characterName || 'Character'}: {suggestion.growthMoment || suggestion.suggestion || 'Growth suggestion'}
                </div>
                {suggestion.developmentArc && (
                  <div className="text-xs text-slate-400 mt-1">{suggestion.developmentArc}</div>
                )}
                {suggestion.priority && (
                  <div className="text-xs text-purple-400 mt-1">Priority: {suggestion.priority}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {filteredActors.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select characters to view their arcs</p>
              </div>
            </div>
          ) : viewMode === 'timeline' ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className={`grid gap-4 ${comparisonMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {filteredActors.map(actor => {
                  const timeline = characterTimeline[actor.id] || {
                    appearances: [],
                    statChanges: [],
                    skillChanges: [],
                    relationshipChanges: []
                  };
                  
                  // Combine all timeline events
                  const allEvents = [
                    ...timeline.appearances.map(a => ({ ...a, type: 'appearance', label: 'Appearance' })),
                    ...timeline.statChanges.map(s => ({ ...s, type: 'stat', label: 'Stat Change' })),
                    ...timeline.skillChanges.map(s => ({ ...s, type: 'skill', label: 'Skill Change' })),
                    ...timeline.relationshipChanges.map(r => ({ ...r, type: 'relationship', label: 'Relationship' }))
                  ].sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));

                  return (
                    <div key={actor.id} className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                      <h3 className="text-xl font-bold text-white mb-4">{actor.name} - Timeline</h3>
                      {allEvents.length === 0 ? (
                        <p className="text-slate-500 text-sm">No timeline data. Click "Auto-Track from Chapters" to populate.</p>
                      ) : (
                        <div className="space-y-2">
                          {allEvents.map((event, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-800 rounded p-3 border-l-4"
                              style={{
                                borderColor: event.type === 'appearance' ? '#3b82f6' :
                                           event.type === 'stat' ? '#22c55e' :
                                           event.type === 'skill' ? '#8b5cf6' : '#ec4899'
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                      Ch {event.chapterNumber}
                                    </span>
                                    <span className="text-xs text-slate-400">{event.label}</span>
                                  </div>
                                  {event.type === 'appearance' && (
                                    <p className="text-sm text-white">{event.character} appears</p>
                                  )}
                                  {event.type === 'stat' && event.changes && (
                                    <p className="text-sm text-white">
                                      Stat changes: {Object.entries(event.changes).map(([stat, val]) => 
                                        `${stat} ${val >= 0 ? '+' : ''}${val}`
                                      ).join(', ')}
                                    </p>
                                  )}
                                  {event.type === 'skill' && (
                                    <p className="text-sm text-white">
                                      {event.action} {event.skill}
                                    </p>
                                  )}
                                  {event.type === 'relationship' && (
                                    <div className="space-y-1">
                                      <p className="text-sm text-white">
                                        {event.character1} ↔ {event.character2}: {event.change}
                                      </p>
                                      {(() => {
                                        // Find relationship data from relationships store
                                        const rel = relationships.find(r => {
                                          const actor1Id = r.actor1Id || r.actors?.[0];
                                          const actor2Id = r.actor2Id || r.actors?.[1];
                                          const actor1 = actors.find(a => a.id === actor1Id);
                                          const actor2 = actors.find(a => a.id === actor2Id);
                                          return (actor1?.name === event.character1 && actor2?.name === event.character2) ||
                                                 (actor1?.name === event.character2 && actor2?.name === event.character1);
                                        });
                                        if (rel) {
                                          return (
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                                {rel.type || 'relationship'}
                                              </span>
                                              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                  className="h-full bg-emerald-500"
                                                  style={{ width: `${Math.abs(rel.strength || 50)}%` }}
                                                />
                                              </div>
                                              <span className="text-xs text-slate-400">{rel.strength || 50}</span>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => chapterNavigationService.navigateToChapter(event.bookId, event.chapterId)}
                                  className="ml-2 p-1 text-emerald-400 hover:text-emerald-300"
                                  title="Navigate to chapter"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <div className={`grid gap-4 ${comparisonMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {filteredActors.map(actor => {
                  const arc = arcData[actor.id] || {
                    characterId: actor.id,
                    characterName: actor.name,
                    stages: {
                      introduction: { chapter: null, description: '', completion: 0 },
                      development: { chapter: null, description: '', completion: 0 },
                      conflict: { chapter: null, description: '', completion: 0 },
                      resolution: { chapter: null, description: '', completion: 0 }
                    },
                    overallCompletion: 0
                  };

                  return (
                    <div key={actor.id} className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">{actor.name}</h3>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-slate-400">{arc.overallCompletion}% Complete</div>
                          <button
                            onClick={() => {
                              analyzeArc(actor.id);
                              saveArcData();
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            AI Analyze
                          </button>
                        </div>
                      </div>

                      {/* Relationships Panel */}
                      <div className="mb-4 bg-slate-800/50 rounded-lg p-4">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">RELATIONSHIPS</div>
                        <div className="space-y-2">
                          {relationships
                            .filter(rel => {
                              const actor1Id = rel.actor1Id || rel.actors?.[0];
                              const actor2Id = rel.actor2Id || rel.actors?.[1];
                              return actor1Id === actor.id || actor2Id === actor.id;
                            })
                            .map(rel => {
                              const otherActorId = (rel.actor1Id || rel.actors?.[0]) === actor.id 
                                ? (rel.actor2Id || rel.actors?.[1])
                                : (rel.actor1Id || rel.actors?.[0]);
                              const otherActor = actors.find(a => a.id === otherActorId);
                              if (!otherActor) return null;
                              
                              return (
                                <div key={rel.id} className="bg-slate-900 rounded p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-white font-semibold">{otherActor.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                      {rel.type || 'relationship'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-emerald-500"
                                        style={{ width: `${Math.abs(rel.strength || 50)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-slate-400">{rel.strength || 50}</span>
                                  </div>
                                  {rel.history && rel.history.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {rel.history.slice(0, 3).map((hist, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => {
                                            if (hist.chapterId && rel.bookId) {
                                              chapterNavigationService.navigateToChapter(rel.bookId, hist.chapterId);
                                            }
                                          }}
                                          className="text-xs px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded"
                                        >
                                          {hist.change || 'Event'}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          {relationships.filter(rel => {
                            const actor1Id = rel.actor1Id || rel.actors?.[0];
                            const actor2Id = rel.actor2Id || rel.actors?.[1];
                            return actor1Id === actor.id || actor2Id === actor.id;
                          }).length === 0 && (
                            <p className="text-xs text-slate-500">No relationships tracked</p>
                          )}
                        </div>
                      </div>

                      {/* Arc Stages */}
                      <div className="space-y-4">
                        {arcStages.map(stage => {
                          const stageData = arc.stages[stage] || { chapter: null, description: '', completion: 0 };
                          return (
                            <div key={stage} className="border-l-4 pl-4" style={{ borderColor: getStageColor(stage) }}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getStageColor(stage) }}
                                  />
                                  <div className="text-sm font-bold text-white">{getStageLabel(stage)}</div>
                                </div>
                                <div className="text-xs text-slate-400">{stageData.completion}%</div>
                              </div>
                              
                              <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-slate-400">Chapter</label>
                                  {stageData.chapter && (
                                    <button
                                      onClick={() => {
                                        const booksArray = books ? (Array.isArray(books) ? books : Object.values(books)) : [];
                                        for (const book of booksArray) {
                                          const chapter = book.chapters?.find(ch => 
                                            ch.id === stageData.chapter || 
                                            String(ch.id) === String(stageData.chapter)
                                          );
                                          if (chapter) {
                                            chapterNavigationService.navigateToChapter(book.id, chapter.id);
                                            return;
                                          }
                                        }
                                      }}
                                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                      title="Navigate to chapter"
                                    >
                                      <ChevronRight className="w-3 h-3" />
                                      View
                                    </button>
                                  )}
                                </div>
                                <select
                                  value={stageData.chapter || ''}
                                  onChange={(e) => updateArcStage(actor.id, stage, 'chapter', e.target.value ? e.target.value : null)}
                                  className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-white text-xs"
                                  onBlur={() => saveArcData()}
                                >
                                  <option value="">Select chapter...</option>
                                  {(() => {
                                    const booksArray = books ? (Array.isArray(books) ? books : Object.values(books)) : [];
                                    if (booksArray.length > 0) {
                                      return booksArray.flatMap(book => {
                                        const chapters = book.chapters || [];
                                        if (chapters.length === 0) return [];
                                        return chapters.map(chapter => {
                                          const chapterId = chapter.id || `${book.id}_${chapter.number || ''}`;
                                          const chapterTitle = chapter.title || `Chapter ${chapter.number || ''}`;
                                          const bookTitle = book.title || `Book ${book.id}`;
                                          return (
                                            <option key={chapterId} value={chapterId}>
                                              {bookTitle} - Ch {chapter.number || ''}: {chapterTitle}
                                            </option>
                                          );
                                        });
                                      });
                                    } else {
                                      return <option disabled>No chapters available. Add chapters in your books first.</option>;
                                    }
                                  })()}
                                </select>
                              </div>

                              <div className="mb-2">
                                <label className="text-xs text-slate-400 block mb-1">Description</label>
                                <textarea
                                  value={stageData.description || ''}
                                  onChange={(e) => updateArcStage(actor.id, stage, 'description', e.target.value)}
                                  onBlur={() => saveArcData()}
                                  rows={2}
                                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-xs"
                                  placeholder={`Describe ${stage} stage...`}
                                />
                              </div>

                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Completion: {stageData.completion}%</label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={stageData.completion || 0}
                                  onChange={(e) => {
                                    updateArcStage(actor.id, stage, 'completion', parseInt(e.target.value));
                                    saveArcData();
                                  }}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Overall Progress */}
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-bold text-white">Overall Arc Progress</div>
                          <div className="text-sm text-slate-400">{arc.overallCompletion}%</div>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-3">
                          <div
                            className="bg-green-500 h-3 rounded-full transition-all"
                            style={{ width: `${arc.overallCompletion}%` }}
                          />
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

      {/* AI Analysis Modal */}
      {showAIAnalysis && aiAnalysis && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">AI Arc Analysis: {aiAnalysis.characterName}</h3>
              <button
                onClick={() => {
                  setShowAIAnalysis(false);
                  setAiAnalysis(null);
                }}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-sm text-slate-300 whitespace-pre-wrap">{aiAnalysis.analysis}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterArcMapper;


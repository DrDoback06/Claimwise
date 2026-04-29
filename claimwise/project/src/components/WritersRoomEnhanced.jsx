import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PenTool, BookOpen, Users, FileText, CheckCircle, X, Search, RefreshCw, RefreshCcw, Eye, Edit3, Save, AlertTriangle, Zap, Sparkles, ChevronRight, ChevronLeft, ChevronDown, Target, BarChart3, Calendar, TrendingUp, Clock, Brain, Upload, Lightbulb, Database, Settings, Trash2, Plus, ScanText, Mic, MicOff, Lock, Unlock, FileDown, Check, XCircle, ArrowRight, Wand2, HelpCircle } from 'lucide-react';
import aiService from '../services/aiService';
import storyBrain from '../services/storyBrain';
import db from '../services/database';
import toastService from '../../services/toastService';
import documentService from '../services/documentService';
import chapterContextService from '../services/chapterContextService';
import storyContextService from '../services/storyContextService';
import extractionHistoryService from '../services/extractionHistoryService';
import autonomousPipeline from '../services/autonomousPipeline';
import voiceService from '../services/voiceService';
import pdfGeneratorService from '../services/pdfGeneratorService';
// @deprecated - Using timelineEvents directly now
// import personnelAnalysisService from '../services/personnelAnalysisService';
import chapterDataExtractionService from '../services/chapterDataExtractionService';
import dataConsistencyService from '../services/dataConsistencyService';
import smartContextEngine from '../services/smartContextEngine';
import EntityExtractionWizard from './EntityExtractionWizard';
import NarrativeReviewQueue from './NarrativeReviewQueue';
import canonApiService from '../services/canonApiService';
import canonLifecycleService, { STATES } from '../services/canonLifecycleService';
import MoodEditorPanel from './MoodEditorPanel';
import AIContextualMenu from './AIContextualMenu';
import TextSelectionContextMenu from './TextSelectionContextMenu';
import WritersRoomTutorial from './WritersRoomTutorial';
import GuidedTour from './GuidedTour';
import { writersRoomGuidedTourSteps } from '../data/tutorialContent';
import AISuggestionPanel from './AISuggestionPanel';
import ManuscriptContextPanel from './ManuscriptContextPanel';
import RelationshipNetworkGraph from './RelationshipNetworkGraph';

/**
 * Enhanced Writers Room with full data access, chapter selection, and AI assistance
 */
const WritersRoomEnhanced = ({ books, actors, items, skills, onClose, onChapterUpdate }) => {
  const [selectedBook, setSelectedBook] = useState(1);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [suggestedChapters, setSuggestedChapters] = useState([]);
  const [mode, setMode] = useState('full'); // 'full' | 'assist'
  const [showOutline, setShowOutline] = useState(false);
  const [outline, setOutline] = useState('');
  const [chapterText, setChapterText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [consistencyIssues, setConsistencyIssues] = useState([]);
  const [showConsistency, setShowConsistency] = useState(false);
  const [contextData, setContextData] = useState({
    actors: [],
    items: [],
    skills: [],
    wikiEntries: []
  });

  // Dashboard state
  const [writingGoals, setWritingGoals] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [currentProgress, setCurrentProgress] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [writingStreak, setWritingStreak] = useState(0);
  const [storyHealth, setStoryHealth] = useState({
    consistency: 85,
    plotThreads: 60,
    characterArcs: 70
  });
  const [aiPrompts, setAiPrompts] = useState([]);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [showCreateDocumentModal, setShowCreateDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [newDocument, setNewDocument] = useState({ title: '', category: 'general', description: '', content: '' });
  
  // New features state
  const [isSuggestingContext, setIsSuggestingContext] = useState(false);
  const [includeSnapshots, setIncludeSnapshots] = useState(true);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [extractedEntities, setExtractedEntities] = useState({ actors: [], items: [], skills: [] });
  
  // Prompt customization state
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customPromptConfig, setCustomPromptConfig] = useState({
    includeStyleGuide: true,
    includeBuzzwords: true,
    includeSnapshots: true,
    includeChapterContext: true,
    includeActors: true,
    includeItems: true,
    includeSkills: true,
    includeStoryContext: true,
    includeSeriesBible: true,
    includeWiki: true,
    customInstructions: '',
    removedSections: []
  });
  const [fullPromptPreview, setFullPromptPreview] = useState('');
  
  // Story context documents state
  const [storyContextDocuments, setStoryContextDocuments] = useState([]);
  const [selectedContextDocumentIds, setSelectedContextDocumentIds] = useState([]);
  const [showContextManager, setShowContextManager] = useState(false);
  
  // Manuscript Intelligence state
  const [showManuscriptIntelligence, setShowManuscriptIntelligence] = useState(false);
  const [pendingExtractions, setPendingExtractions] = useState([]);
  const [realtimeDetections, setRealtimeDetections] = useState([]);
  const [showRealtimePanel, setShowRealtimePanel] = useState(false);
  
  // Manuscript Intelligence context state
  const [manuscriptContext, setManuscriptContext] = useState(null);
  const [contextValidation, setContextValidation] = useState(null);
  const [showContextValidation, setShowContextValidation] = useState(true);
  
  // Context checkboxes state
  const [contextCheckboxes, setContextCheckboxes] = useState({
    plotBeats: true,
    characterArcs: true,
    timelineEvents: true,
    decisions: true,
    callbacks: true,
    memories: true,
    aiSuggestions: true,
    storylines: true
  });
  
  // Badge counts state
  const [badgeCounts, setBadgeCounts] = useState({
    plotBeats: 0,
    callbacks: 0,
    memories: 0,
    decisions: 0,
    suggestions: 0,
    storylines: 0
  });
  
  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  
  // Auto-save and draft recovery state
  const [saveStatus, setSaveStatus] = useState({ lastSaved: null, isSaving: false, hasUnsavedChanges: false });
  const [autoSaveInterval, setAutoSaveInterval] = useState(null);
  const [draftRecovery, setDraftRecovery] = useState(null);
  const [showEntityWizard, setShowEntityWizard] = useState(false);

  // ========================================
  // CANON LIFECYCLE STATE
  // ========================================
  const [canonState, setCanonState] = useState(STATES.DRAFT);
  const [canonSessionId, setCanonSessionId] = useState(null);
  const [showReviewQueue, setShowReviewQueue] = useState(false);
  const [isCanonExtracting, setIsCanonExtracting] = useState(false);
  const [canonUnresolved, setCanonUnresolved] = useState(0);

  // ========================================
  // AUTONOMOUS PIPELINE STATE
  // ========================================
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isExpandingVoice, setIsExpandingVoice] = useState(false);
  
  const [liveSuggestions, setLiveSuggestions] = useState({ spelling: [], grammar: [], hints: [] });
  const [showLiveSuggestions, setShowLiveSuggestions] = useState(true);
  
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [processingResults, setProcessingResults] = useState(null);
  const [showProcessingResults, setShowProcessingResults] = useState(false);
  
  const [isExtractingEntities, setIsExtractingEntities] = useState(false);
  const [extractedEntitiesQueue, setExtractedEntitiesQueue] = useState([]);
  const [currentEntityIndex, setCurrentEntityIndex] = useState(0);
  const [showEntityReview, setShowEntityReview] = useState(false);
  const [entityAcceptResults, setEntityAcceptResults] = useState([]);
  
  const [lockedEntities, setLockedEntities] = useState([]);
  
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
  const [autonomousMode, setAutonomousMode] = useState('idle'); // 'idle' | 'processing' | 'extracting' | 'reviewing'
  
  // Text selection state for Re-write / Expand tools
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [selectionToolbarPos, setSelectionToolbarPos] = useState({ x: 0, y: 0 });
  const [isRewriting, setIsRewriting] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  
  // New contextual menu states
  const [showMoodEditor, setShowMoodEditor] = useState(false);
  const [showAIContextualMenu, setShowAIContextualMenu] = useState(false);
  const [showTextContextMenu, setShowTextContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  
  // Tutorial states
  const [showTutorial, setShowTutorial] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  
  const textareaRef = useRef(null);

  // Handle books as object or array
  const getBookById = (bookId) => {
    if (Array.isArray(books)) {
      return books.find(b => b.id === bookId);
    }
    return books[bookId];
  };
  
  const getAllBooks = () => {
    if (!books) return [];
    if (Array.isArray(books)) {
      return books;
    }
    if (typeof books === 'object') {
      return Object.values(books);
    }
    return [];
  };
  
  const currentBook = getBookById(selectedBook);
  const currentChapter = currentBook?.chapters?.find(c => c.id === selectedChapter);

  useEffect(() => {
    if (currentChapter) {
      // Check for draft recovery first
      const draftKey = `draft_${currentBook?.id}_${currentChapter.id}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          const savedTime = new Date(draft.timestamp);
          const now = new Date();
          const minutesAgo = (now - savedTime) / (1000 * 60);
          
          // If draft is newer than saved chapter or chapter is empty
          if (minutesAgo < 60 && (!currentChapter.script || draft.content.length > currentChapter.script.length)) {
            setDraftRecovery({
              content: draft.content,
              timestamp: draft.timestamp,
              minutesAgo: Math.floor(minutesAgo)
            });
          } else {
            // Clear old draft
            localStorage.removeItem(draftKey);
            setChapterText(currentChapter.script || '');
          }
        } catch (e) {
          console.warn('Could not parse draft:', e);
          setChapterText(currentChapter.script || '');
        }
      } else {
        setChapterText(currentChapter.script || '');
      }
      
      // Check last save time
      const lastSaveKey = `lastSave_${currentBook?.id}_${currentChapter.id}`;
      const lastSave = localStorage.getItem(lastSaveKey);
      if (lastSave) {
        setSaveStatus(prev => ({ ...prev, lastSaved: parseInt(lastSave) }));
      }

      // Load canon lifecycle state for this chapter
      canonLifecycleService.getChapterState(currentChapter.id).then(state => {
        setCanonState(state);
        if (state === STATES.REVIEW_LOCKED) {
          canonLifecycleService.getActiveSession(currentChapter.id).then(session => {
            if (session) {
              setCanonSessionId(session.id);
              setShowReviewQueue(true);
            }
          });
        }
      }).catch(() => setCanonState(STATES.DRAFT));
    }
  }, [currentChapter, currentBook]);

  // Save draft to localStorage (use useCallback to avoid dependency issues)
  const saveDraftToLocalStorage = useCallback(() => {
    if (!currentBook || !currentChapter || !chapterText) return;
    
    const draftKey = `draft_${currentBook.id}_${currentChapter.id}`;
    const draft = {
      content: chapterText,
      timestamp: Date.now(),
      bookId: currentBook.id,
      chapterId: currentChapter.id
    };
    
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
      setSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
    } catch (e) {
      console.warn('Could not save draft to localStorage:', e);
    }
  }, [currentBook, currentChapter, chapterText]);

  // Silent save function for auto-save (defined early to avoid dependency issues)
  const saveChapterToBookSilent = useCallback(async () => {
    if (!currentBook || !currentChapter || !chapterText) return;
    
    try {
      const updatedChapter = {
        ...currentChapter,
        script: chapterText,
        lastUpdated: Date.now()
      };

      const updatedBook = {
        ...currentBook,
        chapters: currentBook.chapters.map(ch => 
          ch.id === currentChapter.id ? updatedChapter : ch
        )
      };

      await db.update('books', updatedBook);
      localStorage.setItem(`lastSave_${currentBook.id}_${currentChapter.id}`, Date.now().toString());
      setSaveStatus(prev => ({ ...prev, lastSaved: Date.now() }));
    } catch (error) {
      console.warn('Silent auto-save failed:', error);
    }
  }, [currentBook, currentChapter, chapterText]);

  // Use ref to track auto-save counter for database saves
  const autoSaveCounterRef = useRef(0);

  // Auto-save to localStorage every 30 seconds, database every 2 minutes
  useEffect(() => {
    if (!currentBook || !currentChapter) {
      return;
    }

    // Clear existing interval
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
    }

    // Set up auto-save interval
    const interval = setInterval(() => {
      if (chapterText && chapterText.length > 0) {
        saveDraftToLocalStorage();
        
        // Save to database every 4th interval (every 2 minutes)
        autoSaveCounterRef.current += 1;
        if (autoSaveCounterRef.current >= 4) {
          autoSaveCounterRef.current = 0;
          // Save to database silently
          saveChapterToBookSilent();
        }
      }
    }, 30000); // Every 30 seconds

    setAutoSaveInterval(interval);

    // Also save on text change (debounced)
    const timeoutId = setTimeout(() => {
      if (chapterText && chapterText.length > 0) {
        saveDraftToLocalStorage();
        setSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
      }
    }, 2000); // 2 second debounce

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [chapterText, currentBook, currentChapter, saveDraftToLocalStorage, saveChapterToBookSilent]);

  useEffect(() => {
    loadContextData();
  }, [selectedChapters]);

  useEffect(() => {
    loadDashboardData();
    generateWritingPrompt();
    loadCustomPromptConfig();
    loadStoryContextDocuments();
    initializeAutonomousPipeline();
  }, [books, actors]);

  /**
   * Load story context documents
   */
  const loadStoryContextDocuments = async () => {
    try {
      const docs = await storyContextService.getAllDocuments();
      setStoryContextDocuments(docs);
    } catch (error) {
      console.warn('Could not load story context documents:', error);
    }
  };

  // ========================================
  // AUTONOMOUS PIPELINE FUNCTIONS
  // ========================================

  /**
   * Initialize the autonomous pipeline
   */
  const initializeAutonomousPipeline = async () => {
    try {
      await autonomousPipeline.initialize();
      setLockedEntities(autonomousPipeline.getLockedEntities());
    } catch (error) {
      console.warn('Autonomous pipeline initialization error:', error);
    }
  };

  /**
   * Handle live typing for suggestions
   */
  const handleLiveTyping = useCallback(async (text, cursorPosition) => {
    if (!showLiveSuggestions || text.length < 20) return;
    
    try {
      const suggestions = await autonomousPipeline.processLiveTyping(text, cursorPosition, {
        actors,
        items,
        skills
      });
      setLiveSuggestions(suggestions);
    } catch (error) {
      console.warn('Live typing error:', error);
    }
  }, [actors, items, skills, showLiveSuggestions]);

  /**
   * Handle chapter text change with live suggestions
   */
  const handleChapterTextChange = (e) => {
    const newText = e.target.value;
    setChapterText(newText);
    
    // Trigger live suggestions
    const cursorPosition = e.target.selectionStart;
    handleLiveTyping(newText, cursorPosition);
  };

  /**
   * Toggle voice recording
   */
  const toggleVoiceRecording = async () => {
    if (isVoiceRecording) {
      // Stop recording
      const transcript = voiceService.stopRecording();
      setIsVoiceRecording(false);
      if (transcript) {
        setVoiceTranscript(transcript);
        toastService.success('Recording stopped. Click "Expand" to convert to prose.');
      }
    } else {
      // Start recording
      const started = await voiceService.startRecording();
      if (started) {
        setIsVoiceRecording(true);
        setVoiceTranscript('');
        toastService.info('Recording... Speak now');
        
        // Subscribe to transcript updates
        voiceService.subscribe((event, data) => {
          if (event === 'transcript' || event === 'interim') {
            setVoiceTranscript(data.text);
          }
        });
      } else {
        toastService.error('Could not start voice recording');
      }
    }
  };

  /**
   * Expand voice transcript to prose
   */
  const expandVoiceTranscript = async () => {
    if (!voiceTranscript) return;
    
    setIsExpandingVoice(true);
    try {
      const expanded = await voiceService.expandTranscript(voiceTranscript, {
        characters: actors.map(a => a.name),
        previousText: chapterText.slice(-500)
      });
      
      if (expanded) {
        // Append to chapter text
        setChapterText(prev => prev + (prev ? '\n\n' : '') + expanded);
        setVoiceTranscript('');
        toastService.success('Voice notes expanded and added!');
      }
    } catch (error) {
      toastService.error('Failed to expand voice notes: ' + error.message);
    } finally {
      setIsExpandingVoice(false);
    }
  };

  /**
   * Insert voice transcript directly
   */
  const insertVoiceTranscript = () => {
    if (!voiceTranscript) return;
    setChapterText(prev => prev + (prev ? '\n\n' : '') + voiceTranscript);
    setVoiceTranscript('');
    toastService.success('Transcript inserted');
  };

  /**
   * Process text for consistency and suggestions
   */
  const processChapterText = async () => {
    if (!chapterText || chapterText.trim().length < 50) {
      toastService.warning('Please write at least 50 characters before processing');
      return;
    }

    setIsProcessingText(true);
    setAutonomousMode('processing');
    
    try {
      const worldState = {
        actors,
        itemBank: items,
        skillBank: skills,
        books,
        statRegistry: []
      };

      const results = await autonomousPipeline.processText(
        chapterText,
        { id: selectedChapter, bookId: selectedBook },
        worldState
      );

      setProcessingResults(results);
      setShowProcessingResults(true);
      
      const totalIssues = (results.consistencyIssues?.length || 0) + (results.suggestions?.length || 0);
      if (totalIssues > 0) {
        toastService.info(`Found ${totalIssues} items to review`);
      } else {
        toastService.success('No issues found! Text looks consistent.');
      }
    } catch (error) {
      toastService.error('Processing failed: ' + error.message);
    } finally {
      setIsProcessingText(false);
      setAutonomousMode('idle');
    }
  };

  /**
   * Extract entities from chapter text
   */
  const extractChapterEntities = async () => {
    if (!chapterText || chapterText.trim().length < 50) {
      toastService.warning('Please write at least 50 characters before extracting');
      return;
    }

    setIsExtractingEntities(true);
    setAutonomousMode('extracting');
    
    try {
      const worldState = {
        actors,
        itemBank: items,
        skillBank: skills,
        books,
        statRegistry: []
      };

      const entities = await autonomousPipeline.extractEntities(
        chapterText,
        worldState,
        `${selectedBook}_${selectedChapter}`
      );

      // Flatten all entities into a queue
      const queue = [
        ...entities.newActors.map(e => ({ ...e, category: 'New Character' })),
        ...entities.actorUpdates.map(e => ({ ...e, category: 'Character Update' })),
        ...entities.newItems.map(e => ({ ...e, category: 'New Item' })),
        ...entities.itemUpdates.map(e => ({ ...e, category: 'Item Update' })),
        ...entities.newSkills.map(e => ({ ...e, category: 'New Skill' })),
        ...entities.newLocations.map(e => ({ ...e, category: 'New Location' })),
        ...entities.newEvents.map(e => ({ ...e, category: 'New Event' })),
        ...entities.relationshipChanges.map(e => ({ ...e, category: 'Relationship Change' })),
        ...entities.statChanges.map(e => ({ ...e, category: 'Stat Change' })),
      ];

      setExtractedEntitiesQueue(queue);
      setCurrentEntityIndex(0);
      setEntityAcceptResults([]);
      
      if (queue.length > 0) {
        setShowEntityReview(true);
        setAutonomousMode('reviewing');
        toastService.info(`Found ${queue.length} entities to review`);
      } else {
        toastService.info('No new entities detected in this chapter');
        setAutonomousMode('idle');
      }
    } catch (error) {
      toastService.error('Extraction failed: ' + error.message);
      setAutonomousMode('idle');
    } finally {
      setIsExtractingEntities(false);
    }
  };

  /**
   * Accept an entity and create all related entries
   */
  const acceptEntity = async (entity) => {
    try {
      const worldState = {
        actors,
        itemBank: items,
        skillBank: skills,
        books,
        statRegistry: []
      };

      const result = await autonomousPipeline.acceptEntity(
        entity,
        worldState,
        `${selectedBook}_${selectedChapter}`
      );

      if (result.success) {
        setEntityAcceptResults(prev => [...prev, {
          entity,
          result,
          status: 'accepted'
        }]);
        toastService.success(`Created ${result.created.length} entries, updated ${result.updated.length}`);
      } else {
        toastService.error(`Failed: ${result.errors.join(', ')}`);
      }

      // Move to next entity
      if (currentEntityIndex < extractedEntitiesQueue.length - 1) {
        setCurrentEntityIndex(prev => prev + 1);
      } else {
        // All done
        finishEntityReview();
      }
    } catch (error) {
      toastService.error('Accept failed: ' + error.message);
    }
  };

  /**
   * Skip an entity
   */
  const skipEntity = () => {
    setEntityAcceptResults(prev => [...prev, {
      entity: extractedEntitiesQueue[currentEntityIndex],
      status: 'skipped'
    }]);

    if (currentEntityIndex < extractedEntitiesQueue.length - 1) {
      setCurrentEntityIndex(prev => prev + 1);
    } else {
      finishEntityReview();
    }
  };

  /**
   * Finish entity review
   */
  const finishEntityReview = () => {
    const accepted = entityAcceptResults.filter(r => r.status === 'accepted').length;
    const skipped = entityAcceptResults.filter(r => r.status === 'skipped').length;
    
    toastService.success(`Review complete! Accepted: ${accepted}, Skipped: ${skipped}`);
    setShowEntityReview(false);
    setAutonomousMode('idle');
    
    // Refresh world state if onChapterUpdate is available
    if (onChapterUpdate) {
      onChapterUpdate();
    }
  };

  /**
   * Handle text selection in the editor
   */
  const handleTextSelection = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = chapterText.substring(start, end);
    
    if (text.length > 0) {
      setSelectedText(text);
      setSelectionRange({ start, end });
    } else {
      setSelectedText('');
    }
  };

  // Handle right-click for context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = chapterText.substring(start, end);
    
    if (text.length > 0) {
      setSelectedText(text);
      setSelectionRange({ start, end });
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setShowTextContextMenu(true);
    } else {
      // Show AI menu even without selection
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setShowAIContextualMenu(true);
    }
  };

  // Handle context menu actions
  const handleContextMenuAction = async (actionId, text, customPrompt = '', data = {}) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:647',message:'Context menu action',data:{actionId,hasText:!!text,hasCustomPrompt:!!customPrompt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    const { cursorContext } = data;
    
    switch (actionId) {
      case 'rewrite':
        await rewriteSelectedText(customPrompt);
        break;
      case 'expand':
        await expandSelectedText(customPrompt);
        break;
      case 'condense':
        // Implement condense
        break;
      case 'mood':
        setShowMoodEditor(true);
        break;
      case 'ai-enhance':
        setShowTextContextMenu(false);
        setContextMenuPosition({ x: contextMenuPosition.x, y: contextMenuPosition.y + 50 });
        setShowAIContextualMenu(true);
        break;
      case 'read-aloud':
        // Implement read aloud
        break;
      case 'entity-interject':
        // Implement entity interject
        break;
      case 'continue':
      case 'scene':
      case 'dialogue':
      case 'funnier':
      case 'darker':
      case 'detail':
      case 'tighten':
        // Handle AI actions
        await handleAIAction(actionId, text || chapterText, customPrompt);
        break;
      default:
        break;
    }
  };

  // Build contextual prompt with style context (similar to WritingCanvasPro)
  const buildContextualPrompt = async (userPrompt, options = {}) => {
    try {
      const currentBook = getBookById(selectedBook);
      const currentChapter = currentBook?.chapters?.find(c => c.id === selectedChapter);
      const action = options.action || 'continue';

      // Use storyBrain for context assembly (includes chapter memories, arc guidance, genre guides, craft directives)
      const { systemContext } = await storyBrain.getContext({
        text: chapterText,
        chapterNumber: currentChapter?.chapterNumber || null,
        bookId: currentBook?.id || null,
        chapterId: currentChapter?.id || null,
        action
      });

      const craft = storyBrain.getCraftDirective(action);

      const system = `You are the author of this story. Write in the EXACT same voice, style, and rhythm as the existing text.

${craft}

${systemContext}

${options.customPrompt ? `CUSTOM INSTRUCTIONS:\n${options.customPrompt}\n` : ''}
${options.additionalInstructions || ''}`;

      return { system, user: userPrompt };
    } catch (error) {
      console.warn('Failed to build contextual prompt, using basic prompt:', error);
      return { system: '', user: `${userPrompt}${options.customPrompt ? `\n\nCustom instructions: ${options.customPrompt}` : ''}` };
    }
  };

  // Handle AI actions from contextual menu
  const handleAIAction = async (actionId, text, customPrompt = '') => {
    setIsGenerating(true);
    try {
      let taskPrompt = '';
      const contextStart = selectionRange?.start || chapterText.length;
      const context = chapterText.substring(0, Math.max(0, contextStart - 500));
      
      switch (actionId) {
        case 'continue':
          taskPrompt = `Continue writing from this point. Write 2-3 paragraphs that flow naturally:

${context}

Continue:`;
          break;
        case 'scene':
          taskPrompt = `Generate a complete 3-5 paragraph scene that continues from here:

${context}

Write the scene:`;
          break;
        case 'dialogue':
          taskPrompt = `Write 4-8 lines of character dialogue that continues from here:

${context}

Write the dialogue:`;
          break;
        case 'funnier':
          taskPrompt = `Make this text funnier by adding wit, absurd details, and comedic timing:

"${text}"

Rewrite with humor:`;
          break;
        case 'darker':
          taskPrompt = `Make this text darker by adding dread, unease, and horror undertones:

"${text}"

Rewrite with darkness:`;
          break;
        case 'detail':
          taskPrompt = `Expand this text with rich sensory details:

"${text}"

Expand with detail:`;
          break;
        case 'tighten':
          taskPrompt = `Tighten and condense this prose while keeping the meaning:

"${text}"

Tighten:`;
          break;
        default:
          return;
      }
      
      // Build contextual prompt with style context
      const { system, user } = await buildContextualPrompt(taskPrompt, {
        customPrompt,
        action: 'continue'
      });

      const result = await aiService.callAI(user, 'creative', system);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:750',message:'AI result received',data:{actionId,resultLength:result?.length||0,hasResult:!!result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      if (result) {
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        if (actionId === 'continue' || actionId === 'scene' || actionId === 'dialogue') {
          setChapterText(prev => prev + '\n\n' + cleanResult);
        } else {
          const before = chapterText.substring(0, selectionRange?.start || 0);
          const after = chapterText.substring(selectionRange?.end || chapterText.length);
          setChapterText(before + cleanResult + after);
        }
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:760',message:'AI action error',data:{actionId,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      console.error('AI action failed:', error);
      const errorMessage = error.message?.includes('API key') 
        ? 'AI service not configured. Please check your API keys in Settings.'
        : error.message?.includes('quota') || error.message?.includes('rate limit')
        ? 'AI service quota exceeded. Please try again later.'
        : error.message || 'AI action failed. Please try again.';
      toastService.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle mood editor apply
  const handleMoodEditorApply = (rewrittenText, moodSettings) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:770',message:'Mood editor apply',data:{hasRewrittenText:!!rewrittenText,rewrittenTextLength:rewrittenText?.length||0,hasSelectionRange:!!selectionRange,hasSelectedText:!!selectedText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    if (!rewrittenText) {
      toastService.warning('No rewritten text to apply');
      return;
    }
    
    if (selectionRange && typeof selectionRange.start === 'number' && typeof selectionRange.end === 'number') {
      const before = chapterText.substring(0, selectionRange.start);
      const after = chapterText.substring(selectionRange.end);
      setChapterText(before + rewrittenText + after);
      setShowMoodEditor(false);
      setSelectedText('');
      toastService.success('Mood rewrite applied!');
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:780',message:'Mood rewrite applied via selectionRange',data:{beforeLength:before.length,afterLength:after.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
    } else if (selectedText) {
      // Fallback: replace first occurrence if no selection range
      const index = chapterText.indexOf(selectedText);
      if (index !== -1) {
        const before = chapterText.substring(0, index);
        const after = chapterText.substring(index + selectedText.length);
        setChapterText(before + rewrittenText + after);
        setShowMoodEditor(false);
        setSelectedText('');
        toastService.success('Mood rewrite applied!');
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:791',message:'Mood rewrite applied via fallback',data:{index},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
      } else {
        toastService.warning('Could not find selected text in chapter');
      }
    } else {
      toastService.warning('No text selected');
    }
  };

  /**
   * Re-write selected text using AI
   */
  const rewriteSelectedText = async (customPrompt = '') => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:835',message:'rewriteSelectedText called',data:{selectedTextLength:selectedText?.length||0,hasSelectionRange:!!selectionRange,hasCustomPrompt:!!customPrompt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    
    if (!selectedText || selectedText.length < 10) {
      toastService.warning('Select more text to rewrite (minimum 10 characters)');
      return;
    }
    
    if (!selectionRange || typeof selectionRange.start !== 'number' || typeof selectionRange.end !== 'number') {
      toastService.warning('Invalid text selection');
      return;
    }
    
    setIsRewriting(true);
    try {
      const currentBook = getBookById(selectedBook);
      const currentChapter = currentBook?.chapters?.find(c => c.id === selectedChapter);
      
      const taskPrompt = `Rewrite this passage in the same style but with improved prose, clarity, and impact. 
Keep the same meaning and events but enhance the writing quality.

CONTEXT (surrounding text):
"${chapterText.substring(Math.max(0, selectionRange.start - 500), Math.min(chapterText.length, selectionRange.end + 200))}"

TEXT TO REWRITE:
"${selectedText}"

Return ONLY the rewritten text, nothing else.`;
      
      // Build contextual prompt with storyBrain
      const { system: rewriteSystem, user: rewriteUser } = await buildContextualPrompt(taskPrompt, {
        customPrompt,
        action: 'rewrite'
      });

      const response = await aiService.callAI(rewriteUser, 'creative', rewriteSystem);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:860',message:'Rewrite AI result',data:{responseLength:response?.length||0,hasResponse:!!response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      
      if (!response || response.trim().length === 0) {
        throw new Error('AI returned empty result');
      }
      
      const cleanResponse = response.trim();
      if (cleanResponse.length === 0) {
        throw new Error('AI result was empty after cleaning');
      }
      
      // Replace the selected text with the rewritten version
      const newText = 
        chapterText.substring(0, selectionRange.start) + 
        cleanResponse + 
        chapterText.substring(selectionRange.end);
      
      setChapterText(newText);
      setSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
      setShowSelectionToolbar(false);
      toastService.success('Text rewritten successfully!');
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:880',message:'Rewrite error',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      
      const errorMessage = error.message?.includes('API key') 
        ? 'AI service not configured. Please check your API keys in Settings.'
        : error.message?.includes('quota') || error.message?.includes('rate limit')
        ? 'AI service quota exceeded. Please try again later.'
        : error.message || 'Rewrite failed. Please try again.';
      toastService.error(errorMessage);
    } finally {
      setIsRewriting(false);
    }
  };

  /**
   * Expand/continue from selected text using AI
   */
  const expandSelectedText = async (customPrompt = '') => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:890',message:'expandSelectedText called',data:{selectedTextLength:selectedText?.length||0,hasSelectionRange:!!selectionRange,hasCustomPrompt:!!customPrompt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    
    if (!selectedText) {
      toastService.warning('Select text to expand from');
      return;
    }
    
    if (!selectionRange || typeof selectionRange.start !== 'number' || typeof selectionRange.end !== 'number') {
      toastService.warning('Invalid text selection');
      return;
    }
    
    setIsExpanding(true);
    try {
      const context = chapterText.substring(
        Math.max(0, selectionRange.start - 1000),
        selectionRange.end
      );
      
      const taskPrompt = `Continue writing from where this passage ends. Write 2-3 paragraphs that flow naturally from the selected text.

CONTEXT (leading up to the selection):
"${context}"

SELECTED TEXT (continue from here):
"${selectedText}"

Continue the story naturally. Return ONLY the continuation text.`;
      
      // Build contextual prompt with style context
      const { system: expandSystem, user: expandUser } = await buildContextualPrompt(taskPrompt, {
        customPrompt,
        action: 'expand'
      });

      const response = await aiService.callAI(expandUser, 'creative', expandSystem);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:920',message:'Expand AI result',data:{responseLength:response?.length||0,hasResponse:!!response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      
      if (!response || response.trim().length === 0) {
        throw new Error('AI returned empty result');
      }
      
      const cleanResponse = response.trim();
      if (cleanResponse.length === 0) {
        throw new Error('AI result was empty after cleaning');
      }
      
      // Insert the expansion after the selected text
      const newText = 
        chapterText.substring(0, selectionRange.end) + 
        '\n\n' + cleanResponse + 
        chapterText.substring(selectionRange.end);
      
      setChapterText(newText);
      setSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
      setShowSelectionToolbar(false);
      toastService.success('Text expanded successfully!');
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritersRoomEnhanced.jsx:940',message:'Expand error',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      
      const errorMessage = error.message?.includes('API key') 
        ? 'AI service not configured. Please check your API keys in Settings.'
        : error.message?.includes('quota') || error.message?.includes('rate limit')
        ? 'AI service quota exceeded. Please try again later.'
        : error.message || 'Expand failed. Please try again.';
      toastService.error(errorMessage);
    } finally {
      setIsExpanding(false);
    }
  };

  /**
   * Toggle entity lock
   */
  const toggleEntityLock = async (entityType, entityId) => {
    const isLocked = autonomousPipeline.isLocked(entityType, entityId);
    
    if (isLocked) {
      await autonomousPipeline.unlockEntity(entityType, entityId);
      toastService.info('Entity unlocked');
    } else {
      await autonomousPipeline.lockEntity(entityType, entityId, 'User locked');
      toastService.info('Entity locked - AI will not modify it');
    }
    
    setLockedEntities(autonomousPipeline.getLockedEntities());
  };

  /**
   * Export story bible as PDF
   */
  const exportStoryBible = async () => {
    setIsExportingPDF(true);
    try {
      const worldState = {
        actors,
        itemBank: items,
        skillBank: skills,
        books
      };
      
      const sections = await pdfGeneratorService.quickExport(worldState);
      await pdfGeneratorService.generatePDF(sections, 'story-bible.pdf');
      toastService.success('PDF export opened - use Save as PDF in print dialog');
    } catch (error) {
      toastService.error('Export failed: ' + error.message);
    } finally {
      setIsExportingPDF(false);
    }
  };

  /**
   * Load saved custom prompt configuration
   */
  const loadCustomPromptConfig = async () => {
    try {
      const saved = await db.get('meta', 'customPromptConfig');
      if (saved && saved.config) {
        setCustomPromptConfig(saved.config);
      }
    } catch (error) {
      console.warn('Could not load custom prompt config:', error);
    }
  };

  /**
   * Save custom prompt configuration
   */
  const saveCustomPromptConfig = async () => {
    try {
      await db.update('meta', {
        id: 'customPromptConfig',
        config: customPromptConfig,
        savedAt: Date.now()
      });
      toastService.success('Prompt configuration saved');
    } catch (error) {
      try {
        await db.add('meta', {
          id: 'customPromptConfig',
          config: customPromptConfig,
          savedAt: Date.now()
        });
        toastService.success('Prompt configuration saved');
      } catch (e) {
        console.error('Could not save custom prompt config:', e);
        toastService.error('Failed to save prompt configuration');
      }
    }
  };

  const loadContextData = async () => {
    // Load wiki entries for context
    const wikiEntries = await db.getAll('wiki');
    setContextData({
      actors: actors.filter(a => selectedChapters.some(ch => ch.actors?.includes(a.id))),
      items: items.filter(i => selectedChapters.some(ch => ch.items?.includes(i.id))),
      skills: skills.filter(s => selectedChapters.some(ch => ch.skills?.includes(s.id))),
      wikiEntries
    });
  };

  /**
   * Load manuscript intelligence context
   */
  const loadManuscriptContext = async () => {
    if (!currentBook || !currentChapter) return;

    try {
      const manuscriptContextEngine = (await import('../services/manuscriptContextEngine')).default;
      const contextValidationService = (await import('../services/contextValidationService')).default;

      const [context, validation] = await Promise.all([
        manuscriptContextEngine.buildManuscriptContext(currentBook.id, currentChapter.id),
        contextValidationService.validateManuscriptContext(currentBook.id, currentChapter.id)
      ]);

      setManuscriptContext(context);
      setContextValidation(validation);
      
      // Update badge counts
      setBadgeCounts({
        plotBeats: context.plotBeats?.length || 0,
        callbacks: context.callbacks?.length || 0,
        memories: context.memories?.length || 0,
        decisions: context.decisions?.length || 0,
        suggestions: 0, // Will be updated when AI suggestions are loaded
        storylines: context.storylines?.length || 0
      });
    } catch (error) {
      console.warn('Error loading manuscript context:', error);
    }
  };
  
  /**
   * Load AI suggestions for current chapter from database
   */
  const loadAISuggestions = async () => {
    if (!currentBook || !currentChapter) {
      setAiSuggestions([]);
      setBadgeCounts(prev => ({ ...prev, suggestions: 0 }));
      return;
    }
    
    try {
      // Load suggestions from database
      let suggestions = [];
      try {
        const allSuggestions = await db.getAll('aiSuggestions') || [];
        suggestions = allSuggestions.filter(s => 
          s.chapterId === currentChapter.id && 
          (s.status === 'pending' || s.status === 'accepted')
        );
      } catch (e) {
        // Database store might not exist yet
        console.warn('AI suggestions store not available:', e);
      }
      
      // Convert database records back to suggestion format
      const formattedSuggestions = suggestions.map(s => ({
        ...s.data, // Restore full suggestion data
        id: s.id,
        chapterId: s.chapterId,
        chapterNumber: s.chapterNumber,
        bookId: s.bookId,
        type: s.type,
        priority: s.priority,
        confidence: s.confidence,
        status: s.status,
        suggestion: s.suggestion,
        reasoning: s.reasoning,
        suggestions: s.suggestions,
        characters: s.characters,
        createdAt: s.createdAt
      }));
      
      setAiSuggestions(formattedSuggestions);
      
      // Update badge count
      setBadgeCounts(prev => ({
        ...prev,
        suggestions: formattedSuggestions.length
      }));
    } catch (error) {
      console.warn('Error loading AI suggestions:', error);
      setAiSuggestions([]);
      setBadgeCounts(prev => ({ ...prev, suggestions: 0 }));
    }
  };
  
  // Load AI suggestions when chapter changes
  useEffect(() => {
    if (currentBook && currentChapter) {
      loadAISuggestions();
    }
  }, [selectedBook, selectedChapter]);

  // Load manuscript context when chapter changes
  useEffect(() => {
    if (currentBook && currentChapter) {
      loadManuscriptContext();
    }
  }, [selectedBook, selectedChapter]);

  /**
   * Real-time pattern detection for simple patterns while writing
   * Detects buzz words, stat changes, and known entity mentions
   */
  const detectRealtimePatterns = useCallback((text) => {
    if (!text || text.length < 10) {
      setRealtimeDetections([]);
      return;
    }

    const detections = [];
    const lines = text.split('\n');

    // Buzz word patterns
    const buzzWordPatterns = [
      { pattern: /\[item\]\s*([^\[\]]+)/gi, type: 'item', label: 'Item' },
      { pattern: /\[skill\]\s*([^\[\]]+)/gi, type: 'skill', label: 'Skill' },
      { pattern: /\[actor\]\s*([^\[\]]+)/gi, type: 'actor', label: 'Actor' },
      { pattern: /\[stats?\]\s*([^\[\]]+)/gi, type: 'stat_change', label: 'Stat Change' },
      { pattern: /\[location\]\s*([^\[\]]+)/gi, type: 'location', label: 'Location' },
      { pattern: /\[event\]\s*([^\[\]]+)/gi, type: 'event', label: 'Event' },
      { pattern: /\[relationship\]\s*([^\[\]]+)/gi, type: 'relationship', label: 'Relationship' },
      { pattern: /\[inventory\]\s*([^\[\]]+)/gi, type: 'inventory', label: 'Inventory' }
    ];

    // Stat change patterns
    const statPatterns = [
      { pattern: /\+(\d+)\s*(STR|VIT|INT|DEX|LUCK|DEBT|CAPACITY|DEF|AUTHORITY|GLOOM)/gi, type: 'stat_change' },
      { pattern: /-(\d+)\s*(STR|VIT|INT|DEX|LUCK|DEBT|CAPACITY|DEF|AUTHORITY|GLOOM)/gi, type: 'stat_change' },
      { pattern: /(STR|VIT|INT|DEX|LUCK|DEBT|CAPACITY|DEF|AUTHORITY|GLOOM)\s*(\+|-)\s*(\d+)/gi, type: 'stat_change' },
      { pattern: /gained?\s+(\d+)\s*(strength|vitality|intelligence|dexterity)/gi, type: 'stat_change' },
      { pattern: /lost?\s+(\d+)\s*(strength|vitality|intelligence|dexterity)/gi, type: 'stat_change' }
    ];

    // Inventory patterns
    const inventoryPatterns = [
      { pattern: /picked\s+up\s+(?:the\s+)?([A-Z][a-zA-Z\s]+)/g, type: 'inventory', action: 'pickup' },
      { pattern: /found\s+(?:a\s+|the\s+)?([A-Z][a-zA-Z\s]+)/g, type: 'inventory', action: 'pickup' },
      { pattern: /dropped\s+(?:the\s+)?([A-Z][a-zA-Z\s]+)/g, type: 'inventory', action: 'drop' },
      { pattern: /equipped\s+(?:the\s+)?([A-Z][a-zA-Z\s]+)/g, type: 'inventory', action: 'equip' }
    ];

    lines.forEach((line, lineIndex) => {
      // Check buzz words
      buzzWordPatterns.forEach(({ pattern, type, label }) => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(line)) !== null) {
          detections.push({
            id: `rt_${lineIndex}_${match.index}_${type}`,
            type,
            label,
            content: match[1]?.trim() || match[0],
            line: lineIndex + 1,
            position: match.index,
            source: 'buzzword'
          });
        }
      });

      // Check stat patterns
      statPatterns.forEach(({ pattern, type }) => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(line)) !== null) {
          detections.push({
            id: `rt_${lineIndex}_${match.index}_stat`,
            type,
            label: 'Stat Change',
            content: match[0],
            line: lineIndex + 1,
            position: match.index,
            source: 'pattern'
          });
        }
      });

      // Check inventory patterns
      inventoryPatterns.forEach(({ pattern, type, action }) => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(line)) !== null) {
          detections.push({
            id: `rt_${lineIndex}_${match.index}_inv`,
            type,
            label: 'Inventory',
            content: match[1]?.trim() || match[0],
            action,
            line: lineIndex + 1,
            position: match.index,
            source: 'pattern'
          });
        }
      });

      // Check for known actor mentions
      actors?.forEach(actor => {
        if (actor.name && line.includes(actor.name)) {
          const index = line.indexOf(actor.name);
          detections.push({
            id: `rt_${lineIndex}_${index}_actor_${actor.id}`,
            type: 'actor_mention',
            label: 'Known Actor',
            content: actor.name,
            actorId: actor.id,
            line: lineIndex + 1,
            position: index,
            source: 'known_entity'
          });
        }
      });
    });

    // Deduplicate and limit
    const uniqueDetections = detections.reduce((acc, det) => {
      const existing = acc.find(d => d.content === det.content && d.type === det.type);
      if (!existing) acc.push(det);
      return acc;
    }, []);

    setRealtimeDetections(uniqueDetections.slice(0, 20));
    
    // Auto-show panel if detections found
    if (uniqueDetections.length > 0 && !showRealtimePanel) {
      // Don't auto-show, just update count
    }
  }, [actors, showRealtimePanel]);

  // Debounced real-time detection
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      detectRealtimePatterns(chapterText);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [chapterText, detectRealtimePatterns]);

  const suggestRelevantChapters = async () => {
    if (!currentChapter) return;

    try {
      const allChapters = Object.values(books).flatMap(book => 
        book.chapters.map(ch => ({
          ...ch,
          bookId: book.id,
          chapterId: ch.id,
          actors: extractActorsFromText(ch.script || ch.desc),
          items: extractItemsFromText(ch.script || ch.desc),
          skills: extractSkillsFromText(ch.script || ch.desc)
        }))
      );

      const characterIds = extractActorsFromText(currentChapter.script || currentChapter.desc || '');
      const suggestions = await aiService.suggestRelevantChapters(
        characterIds,
        [],
        allChapters
      );

      setSuggestedChapters(suggestions.map(s => {
        const ch = allChapters.find(c => `${c.bookId}_${c.chapterId}` === s.chapterId);
        return { ...ch, relevance: s.relevance, reason: s.reason };
      }).filter(Boolean));
    } catch (error) {
      console.error('Error suggesting chapters:', error);
    }
  };

  /**
   * Smart Context: AI suggests relevant chapters
   */
  const suggestSmartContext = async () => {
    if (!currentChapter || !currentBook) {
      toastService.warn('Please select a chapter first');
      return;
    }

    setIsSuggestingContext(true);
    try {
      const allChapters = Object.values(books).flatMap(book => 
        book.chapters.map(ch => ({
          ...ch,
          bookId: book.id,
          chapterId: ch.id
        }))
      );

      const suggestions = await chapterContextService.findRelevantChapters(
        currentChapter,
        allChapters,
        actors || [],
        items || [],
        skills || [],
        5 // Max 5 suggestions
      );

      setSmartSuggestions(suggestions);
      
      if (suggestions.length > 0) {
        toastService.success(`Found ${suggestions.length} relevant chapters! Review and select below.`);
      } else {
        toastService.info('No relevant chapters found. You can manually select chapters.');
      }
    } catch (error) {
      console.error('Error suggesting smart context:', error);
      toastService.error(`Smart context error: ${error.message}`);
    } finally {
      setIsSuggestingContext(false);
    }
  };

  /**
   * Apply smart suggestions to selected chapters
   */
  const applySmartSuggestions = (suggestion) => {
    toggleChapterSelection(suggestion);
    toastService.success(`Added "${suggestion.title || 'Chapter'}" to context`);
  };

  const extractActorsFromText = (text) => {
    if (!text) return [];
    return actors.filter(a => 
      text.toLowerCase().includes(a.name.toLowerCase())
    ).map(a => a.id);
  };

  const extractItemsFromText = (text) => {
    if (!text) return [];
    return items.filter(i => 
      text.toLowerCase().includes(i.name.toLowerCase())
    ).map(i => i.id);
  };

  const extractSkillsFromText = (text) => {
    if (!text) return [];
    return skills.filter(s => 
      text.toLowerCase().includes(s.name.toLowerCase())
    ).map(s => s.id);
  };

  // Dashboard functions
  const loadDashboardData = async () => {
    try {
      const savedGoals = await db.get('meta', 'writingGoals');
      if (savedGoals) {
        setWritingGoals(savedGoals);
      }

      calculateProgress();

      const streak = await db.get('meta', 'writingStreak');
      if (streak) {
        setWritingStreak(streak.value || 0);
      }

      calculateStoryHealth();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const calculateProgress = () => {
    const booksArray = Array.isArray(books) ? books : (books ? Object.values(books) : []);
    const allChapters = booksArray.flatMap(book => book.chapters || []);
    const totalWords = allChapters.reduce((sum, chapter) => {
      const text = chapter.script || chapter.desc || '';
      return sum + text.split(/\s+/).filter(word => word.length > 0).length;
    }, 0);

    setCurrentProgress({
      daily: Math.min(totalWords % 1000, writingGoals.daily || 1000),
      weekly: Math.min(totalWords % 5000, writingGoals.weekly || 5000),
      monthly: Math.min(totalWords % 20000, writingGoals.monthly || 20000)
    });
  };

  const calculateStoryHealth = () => {
    const booksArray = Array.isArray(books) ? books : (books ? Object.values(books) : []);
    const chapters = booksArray.flatMap(book => book.chapters || []);
    const totalActors = actors?.length || 0;
    
    const consistency = Math.min(100, 60 + (chapters.length * 2) + (totalActors * 3));
    const plotThreads = Math.min(100, chapters.length * 10);
    const characterArcs = Math.min(100, totalActors * 15);

    setStoryHealth({
      consistency: Math.round(consistency),
      plotThreads: Math.round(plotThreads),
      characterArcs: Math.round(characterArcs)
    });
  };

  const saveGoals = async () => {
    try {
      await db.update('meta', { id: 'writingGoals', ...writingGoals });
      toastService.success('Writing goals saved!');
    } catch (error) {
      toastService.error('Failed to save goals: ' + error.message);
    }
  };

  const generateWritingPrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      if (!currentBook || !currentChapter) {
        toastService.error('Please select a chapter first');
        setIsGeneratingPrompt(false);
        return;
      }

      // Get previous chapters for context
      const booksArray = Array.isArray(books) ? books : (books ? Object.values(books) : []);
      const allChapters = booksArray.flatMap(book => (book.chapters || []).map(ch => ({ ...ch, bookId: book.id })));
      
      // Get previous chapters (all chapters before current one in same book)
      const previousChapters = allChapters.filter(ch => 
        ch.bookId === currentBook.id && ch.id < currentChapter.id
      ).sort((a, b) => b.id - a.id).slice(0, 5); // Last 5 chapters

      // Load story meta for premise
      let meta = null;
      try {
        meta = await db.get('meta', 'meta');
      } catch (e) {
        // Use default meta if not found
      }

      // Build rich context - use ALL actors/items/skills if contextData is empty
      const allActors = actors || [];
      const allItems = items || [];
      const allSkills = skills || [];
      
      const context = {
        book: currentBook,
        chapter: currentChapter,
        meta: meta, // Include story premise
        previousChapters: previousChapters.map(ch => ({
          title: ch.title,
          desc: ch.desc,
          script: ch.script?.substring(0, 500) || '' // First 500 chars
        })),
        // Use contextData if populated, otherwise use all available
        actors: contextData.actors?.length > 0 ? contextData.actors : allActors,
        items: contextData.items?.length > 0 ? contextData.items : allItems,
        skills: contextData.skills?.length > 0 ? contextData.skills : allSkills,
        wikiEntries: contextData.wikiEntries || []
      };

      // Generate outline using full context
      const prompt = await aiService.generateChapterOutline(
        currentBook,
        currentChapter,
        context
      );

      setAiPrompts(prev => [{
        id: Date.now(),
        prompt: prompt || 'No prompt generated'
      }, ...prev].slice(0, 5));
      
      toastService.success('Chapter outline prompt generated!');
    } catch (error) {
      toastService.error('Failed to generate prompt: ' + error.message);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBgColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const booksArray = Array.isArray(books) ? books : (books ? Object.values(books) : []);
  const totalChapters = booksArray.reduce((sum, book) => sum + (book.chapters?.length || 0), 0) || 0;
  const totalWords = booksArray.flatMap(book => book.chapters || []).reduce((sum, chapter) => {
    const text = chapter.script || chapter.desc || '';
    return sum + text.split(/\s+/).filter(word => word.length > 0).length;
  }, 0) || 0;

  const generateOutline = async () => {
    if (!currentBook || !currentChapter) return;

    setIsGeneratingOutline(true);
    try {
      const context = {
        actors: contextData.actors,
        items: contextData.items,
        skills: contextData.skills,
        previousChapters: selectedChapters
      };

      const generatedOutline = await aiService.generateChapterOutline(
        currentBook,
        currentChapter,
        context
      );

      setOutline(generatedOutline);
      setShowOutline(true);
    } catch (error) {
      alert(`Outline Generation Error: ${error.message}`);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const writeChapter = async () => {
    if (!currentBook || !currentChapter) return;

    setIsGenerating(true);
    try {
      const context = {
        book: currentBook,
        chapter: currentChapter,
        books: books, // Include all books for Series Bible context
        actors: contextData.actors,
        items: contextData.items,
        skills: contextData.skills,
        wikiEntries: contextData.wikiEntries,
        selectedChapters: selectedChapters.map(ch => ({
          title: ch.title,
          desc: ch.desc,
          script: ch.script
        })),
        userNote: ''
      };

      // Pass options including snapshot preference and custom prompt config
      const options = {
        includeSnapshots: includeSnapshots && customPromptConfig.includeSnapshots,
        customPromptConfig: customPromptConfig,
        selectedContextDocumentIds: selectedContextDocumentIds || null
      };

      const result = await aiService.writeChapter(context, selectedChapters, outline, mode, options);
      
      if (mode === 'full') {
        setChapterText(result);
        // Immediately save draft when AI generates content
        saveDraftToLocalStorage();
        // Also auto-save to book as backup
        await saveChapterToBook(result, false); // Silent save
        
        // Auto-extract data from generated chapter
        try {
          await autoExtractFromGeneratedChapter(result);
        } catch (error) {
          console.warn('Auto-extraction failed:', error);
        }
      } else {
        // Assist mode - append suggestions
        setChapterText(prev => prev + '\n\n--- AI SUGGESTIONS ---\n' + result);
        saveDraftToLocalStorage();
      }
    } catch (error) {
      alert(`Chapter Writing Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Auto-extract data from generated chapter
   */
  const autoExtractFromGeneratedChapter = async (chapterText) => {
    if (!chapterText || chapterText.trim().length < 50 || !currentBook || !currentChapter) {
      return;
    }

    try {
      // Create world state for extraction
      const worldState = {
        books: books,
        actors: actors || [],
        itemBank: items || [],
        skillBank: skills || [],
        relationships: await db.getAll('relationships') || []
      };

      // Use manuscript intelligence service for comprehensive extraction
      const manuscriptIntelligenceService = (await import('../services/manuscriptIntelligenceService')).default;
      
      // Extract complete chapter data
      const chapterData = await manuscriptIntelligenceService.extractCompleteChapterData(
        chapterText,
        currentChapter.chapterNumber || currentChapter.number || 1,
        currentBook.id,
        actors || []
      );

      // Save extracted data
      for (const beat of chapterData.beats || []) {
        try {
          await db.add('plotBeats', beat);
        } catch (e) {
          // May already exist
        }
      }

      for (const storyline of chapterData.storylines || []) {
        try {
          await db.add('storylines', storyline);
        } catch (e) {
          // May already exist
        }
      }

      for (const event of chapterData.timelineEvents || []) {
        try {
          await db.add('timelineEvents', event);
        } catch (e) {
          // May already exist
        }
      }

      for (const decision of chapterData.decisions || []) {
        try {
          await db.add('decisions', decision);
        } catch (e) {
          // May already exist
        }
      }

      for (const callback of chapterData.callbacks || []) {
        try {
          await db.add('callbacks', callback);
        } catch (e) {
          // May already exist
        }
      }

      // Generate and save AI suggestions
      try {
        const aiSuggestionService = (await import('../services/aiSuggestionService')).default;
        const relationshipAnalysisService = (await import('../services/relationshipAnalysisService')).default;
        const emotionalBeatService = (await import('../services/emotionalBeatService')).default;
        const dialogueAnalysisService = (await import('../services/dialogueAnalysisService')).default;
        const worldConsistencyService = (await import('../services/worldConsistencyService')).default;

        const context = {
          previousChapters: [],
          activeThreads: chapterData.storylines || [],
          characters: actors || [],
          futureChapters: []
        };

        const [aiSuggestions, relationshipAnalysis, emotionalAnalysis, dialogueAnalysis, worldConsistency] = await Promise.all([
          aiSuggestionService.generateAllSuggestions(chapterText, context),
          relationshipAnalysisService.analyzeRelationshipsComprehensive(chapterText, actors || [], worldState.relationships || []),
          emotionalBeatService.analyzeEmotionalBeats(chapterText, actors || [], [], []),
          dialogueAnalysisService.analyzeDialogue(chapterText, actors || []),
          worldConsistencyService.monitorWorldConsistency(chapterText, worldState)
        ]);

        // Combine all AI suggestions
        const allSuggestions = [
          ...aiSuggestions.all,
          ...relationshipAnalysis.all,
          ...emotionalAnalysis.all,
          ...dialogueAnalysis.all,
          ...worldConsistency.all
        ].map(s => ({
          ...s,
          chapterId: currentChapter.id,
          chapterNumber: currentChapter.chapterNumber || currentChapter.number,
          bookId: currentBook.id
        }));

        // Save suggestions to database
        for (const suggestion of allSuggestions) {
          const suggestionRecord = {
            id: suggestion.id || `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            chapterId: currentChapter.id,
            chapterNumber: currentChapter.chapterNumber || currentChapter.number,
            bookId: currentBook.id,
            type: suggestion.type || 'unknown',
            priority: suggestion.priority || 'medium',
            confidence: suggestion.confidence || 0.5,
            status: 'pending',
            suggestion: suggestion.suggestion || suggestion.comedyMoment || suggestion.conflict || suggestion.event || suggestion.decision || '',
            reasoning: suggestion.reasoning || '',
            suggestions: suggestion.suggestions || [],
            characters: suggestion.characters || [],
            data: suggestion,
            createdAt: Date.now(),
            source: 'auto_extraction'
          };

          try {
            await db.add('aiSuggestions', suggestionRecord);
          } catch (e) {
            // May already exist
            console.warn('Suggestion already exists:', suggestionRecord.id);
          }
        }

        // Update badge counts and reload suggestions
        await loadAISuggestions();
        await loadManuscriptContext();
        
        if (allSuggestions.length > 0) {
          toastService.success(`Generated ${allSuggestions.length} AI suggestions from new chapter`);
        }
      } catch (error) {
        console.warn('Error generating AI suggestions:', error);
      }

      // Refresh context data
      await loadContextData();
      
    } catch (error) {
      console.error('Error in auto-extraction:', error);
    }
  };
    if (!chapterText || !currentBook || !currentChapter) return;

    try {
      const manuscriptIntelligenceService = (await import('../services/manuscriptIntelligenceService')).default;
      const callbackMemoryService = (await import('../services/callbackMemoryService')).default;
      const contextRefreshService = (await import('../services/contextRefreshService')).default;

      const worldState = {
        books: books,
        actors: actors || [],
        itemBank: items || [],
        skillBank: skills || []
      };

      // Extract complete chapter data
      const chapterData = await manuscriptIntelligenceService.extractCompleteChapterData(
        chapterText,
        currentChapter.number || currentChapter.id,
        currentBook.id,
        actors || []
      );

      // Save plot beats
      if (chapterData.beats && chapterData.beats.length > 0) {
        for (const beat of chapterData.beats) {
          beat.targetChapter = currentChapter.id;
          beat.chapterId = currentChapter.id;
          await dataConsistencyService.addPlotBeatSafe(beat);
        }
      }

      // Save timeline events
      if (chapterData.timelineEvents && chapterData.timelineEvents.length > 0) {
        for (const event of chapterData.timelineEvents) {
          event.chapterId = currentChapter.id;
          event.bookId = currentBook.id;
          await dataConsistencyService.addTimelineEventSafe(event);
        }
      }

      // Register callbacks
      if (chapterData.callbacks && chapterData.callbacks.length > 0) {
        for (const callback of chapterData.callbacks) {
          await callbackMemoryService.registerCallback(callback, callback.suggestedCallbackChapter);
        }
      }

      // Track decisions
      if (chapterData.decisions && chapterData.decisions.length > 0) {
        for (const decision of chapterData.decisions) {
          decision.chapterId = currentChapter.id;
          decision.bookId = currentBook.id;
          await callbackMemoryService.trackDecision(decision, decision.consequences || []);
        }
      }

      // Store memories
      if (chapterData.callbacks && chapterData.callbacks.length > 0) {
        for (const callback of chapterData.callbacks) {
          if (callback.importance >= 7) {
            await callbackMemoryService.storeMemory(callback, callback.importance);
          }
        }
      }

      // Generate and save AI suggestions
      try {
        const aiSuggestionService = (await import('../services/aiSuggestionService')).default;
        const relationshipAnalysisService = (await import('../services/relationshipAnalysisService')).default;
        const emotionalBeatService = (await import('../services/emotionalBeatService')).default;
        const dialogueAnalysisService = (await import('../services/dialogueAnalysisService')).default;
        const worldConsistencyService = (await import('../services/worldConsistencyService')).default;

        const context = {
          previousChapters: [],
          activeThreads: chapterData.storylines || [],
          characters: actors || [],
          futureChapters: []
        };

        const [aiSuggestions, relationshipAnalysis, emotionalAnalysis, dialogueAnalysis, worldConsistency] = await Promise.all([
          aiSuggestionService.generateAllSuggestions(chapterText, context),
          relationshipAnalysisService.analyzeRelationshipsComprehensive(chapterText, actors || [], worldState.relationships || []),
          emotionalBeatService.analyzeEmotionalBeats(chapterText, actors || [], [], []),
          dialogueAnalysisService.analyzeDialogue(chapterText, actors || []),
          worldConsistencyService.monitorWorldConsistency(chapterText, worldState)
        ]);

        // Combine all AI suggestions
        const allSuggestions = [
          ...aiSuggestions.all,
          ...relationshipAnalysis.all,
          ...emotionalAnalysis.all,
          ...dialogueAnalysis.all,
          ...worldConsistency.all
        ].map(s => ({
          ...s,
          chapterId: currentChapter.id,
          chapterNumber: currentChapter.number || currentChapter.chapterNumber,
          bookId: currentBook.id
        }));

        // Save suggestions to database
        let savedCount = 0;
        for (const suggestion of allSuggestions) {
          const suggestionRecord = {
            id: suggestion.id || `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            chapterId: currentChapter.id,
            chapterNumber: currentChapter.number || currentChapter.chapterNumber,
            bookId: currentBook.id,
            type: suggestion.type || 'unknown',
            priority: suggestion.priority || 'medium',
            confidence: suggestion.confidence || 0.5,
            status: 'pending',
            suggestion: suggestion.suggestion || suggestion.comedyMoment || suggestion.conflict || suggestion.event || suggestion.decision || '',
            reasoning: suggestion.reasoning || '',
            suggestions: suggestion.suggestions || [],
            characters: suggestion.characters || [],
            data: suggestion,
            createdAt: Date.now(),
            source: 'auto_extraction'
          };

          try {
            await db.add('aiSuggestions', suggestionRecord);
            savedCount++;
          } catch (e) {
            // May already exist, try update
            try {
              await db.update('aiSuggestions', suggestionRecord);
            } catch (e2) {
              console.warn('Could not save suggestion:', suggestionRecord.id);
            }
          }
        }

        // Update badge counts and reload suggestions
        await loadAISuggestions();
        
        if (savedCount > 0) {
          toastService.info(`Generated ${savedCount} AI suggestions`);
        }
      } catch (error) {
        console.warn('Error generating AI suggestions:', error);
      }

      // Refresh context
      await contextRefreshService.refreshChapterContext(currentBook.id, currentChapter.id);
      
      // Reload manuscript context
      await loadManuscriptContext();

      toastService.success(`Auto-extracted: ${chapterData.beats.length} beats, ${chapterData.timelineEvents.length} events, ${chapterData.callbacks.length} callbacks`);
    } catch (error) {
      console.error('Error in auto-extraction:', error);
    }
  };

  const processCurrentChapter = async () => {
    if (!chapterText || !currentChapter) {
      toastService.warn('No chapter text to process');
      return;
    }

    setIsGenerating(true);
    try {
      // Create a temporary document from current chapter text
      const worldState = {
        books: books,
        actors: actors || [],
        itemBank: items || [],
        skillBank: skills || []
      };

      // Process with Manuscript Intelligence
      const result = await aiService.processManuscriptIntelligence(
        chapterText,
        worldState,
        [] // Use default buzz words
      );

      if (result.suggestions && result.suggestions.length > 0) {
        toastService.success(`Found ${result.suggestions.length} suggestions! Check Manuscript Intelligence tab to review.`);
        // Store suggestions for later review
        for (const sugg of result.suggestions) {
          await db.add('manuscriptSuggestions', {
            ...sugg,
            documentId: `chapter_${currentChapter.id}`,
            status: 'pending',
            createdAt: Date.now()
          });
        }
      } else {
        toastService.info('No suggestions found in chapter text');
      }
    } catch (error) {
      console.error('Process error:', error);
      toastService.error(`Processing failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const checkConsistency = async () => {
    if (!currentChapter) return;

    setIsGenerating(true);
    try {
      const data = {
        chapter: currentChapter,
        actors: contextData.actors,
        items: contextData.items,
        previousChapters: selectedChapters
      };

      const issues = await aiService.checkConsistencyAuto(data);
      setConsistencyIssues(issues);
      setShowConsistency(true);
    } catch (error) {
      alert(`Consistency Check Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Save chapter to book (internal method, can be called silently)
   */
  const saveChapterToBook = async (textToSave = null, showToast = true) => {
    if (!currentBook || !currentChapter) return false;

    const text = textToSave || chapterText;
    if (!text || text.trim().length === 0) {
      if (showToast) toastService.warn('No content to save');
      return false;
    }

    setSaveStatus(prev => ({ ...prev, isSaving: true }));

    try {
      // Update chapter with new text
      const updatedChapter = {
        ...currentChapter,
        script: text,
        lastUpdated: Date.now()
      };

      const updatedBook = {
        ...currentBook,
        chapters: currentBook.chapters.map(ch => 
          ch.id === currentChapter.id ? updatedChapter : ch
        )
      };

      // Save chapter to database
      await db.update('books', updatedBook);
      
      // Also save a backup copy to localStorage with timestamp
      const backupKey = `backup_${currentBook.id}_${currentChapter.id}_${Date.now()}`;
      try {
        localStorage.setItem(backupKey, JSON.stringify({
          content: text,
          timestamp: Date.now(),
          bookId: currentBook.id,
          chapterId: currentChapter.id
        }));
        
        // Keep only last 5 backups, remove older ones
        const backupKeys = Object.keys(localStorage)
          .filter(k => k.startsWith(`backup_${currentBook.id}_${currentChapter.id}_`))
          .sort()
          .reverse();
        if (backupKeys.length > 5) {
          backupKeys.slice(5).forEach(k => localStorage.removeItem(k));
        }
      } catch (e) {
        console.warn('Could not save backup to localStorage:', e);
      }
      
      // Clear draft from localStorage after successful save (but keep backups)
      const draftKey = `draft_${currentBook.id}_${currentChapter.id}`;
      localStorage.removeItem(draftKey);
      
      // Save last save timestamp
      localStorage.setItem(`lastSave_${currentBook.id}_${currentChapter.id}`, Date.now().toString());
      
      // Update save status
      setSaveStatus(prev => ({ 
        ...prev, 
        lastSaved: Date.now(), 
        hasUnsavedChanges: false,
        isSaving: false 
      }));

      if (onChapterUpdate) {
        onChapterUpdate(updatedBook);
      }

      // Extract events using Master Timeline's proven method
      if (text && text.trim().length >= 50) {
        try {
          const events = await chapterDataExtractionService.extractEventsFromChapter(
            text,
            currentChapter.id,
            currentBook.id,
            actors || []
          );

          // Save events to timelineEvents table
          for (const event of events) {
            await dataConsistencyService.addTimelineEventSafe(event);
          }

          if (showToast) {
            toastService.success(`Chapter saved! Extracted ${events.length} timeline events.`);
          }

          // Show Entity Extraction Wizard (mandatory)
          setShowEntityWizard(true);
        } catch (error) {
          console.error('[WritersRoom] Event extraction failed:', error);
          if (showToast) {
            toastService.error(`Event extraction failed: ${error.message}`);
          }
          // Still show wizard even if extraction fails - user can manually review
          setShowEntityWizard(true);
        }
      } else {
        if (showToast) {
          toastService.success('Chapter saved!');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving chapter:', error);
      setSaveStatus(prev => ({ ...prev, isSaving: false }));
      if (showToast) {
        toastService.error(`Failed to save chapter: ${error.message}`);
      }
      return false;
    }
  };

  /**
   * Save Draft only — no extraction, stays in Draft state
   */
  const saveDraftOnly = async () => {
    if (!currentBook || !currentChapter || !chapterText) return;
    setSaveStatus(prev => ({ ...prev, isSaving: true }));
    try {
      await canonApiService.saveDraft({
        chapterId: currentChapter.id,
        chapterText,
        bookData: currentBook
      });
      setSaveStatus({ lastSaved: Date.now(), isSaving: false, hasUnsavedChanges: false });
      if (onChapterUpdate) onChapterUpdate(currentBook);
      toastService.success('Draft saved!');
    } catch (error) {
      setSaveStatus(prev => ({ ...prev, isSaving: false }));
      toastService.error('Failed to save draft: ' + error.message);
    }
  };

  /**
   * Save & Extract — triggers canon lifecycle pipeline
   */
  const saveAndExtract = async () => {
    if (!currentBook || !currentChapter || !chapterText) return;
    if (chapterText.trim().length < 50) {
      toastService.warning('Write at least 50 characters before extracting');
      return;
    }

    setIsCanonExtracting(true);
    setCanonState(STATES.SAVE_PENDING);

    try {
      // Build guides context from story context documents
      const guidesContext = {};
      if (storyContextDocuments.length > 0) {
        const styleDoc = storyContextDocuments.find(d => d.category === 'style');
        const rulesDoc = storyContextDocuments.find(d => d.category === 'rules');
        const archDoc = storyContextDocuments.find(d => d.category === 'architecture');
        if (styleDoc) guidesContext.styleGuide = styleDoc.content;
        if (rulesDoc) guidesContext.worldRules = rulesDoc.content;
        if (archDoc) guidesContext.storyArchitecture = archDoc.content;
      }

      const result = await canonApiService.transactionalSaveAndExtract(
        {
          chapterId: currentChapter.id,
          chapterNumber: currentChapter.chapterNumber || currentChapter.id,
          bookId: currentBook.id,
          chapterText,
          bookData: currentBook,
          worldState: { actors: actors || [], items: items || [], skills: skills || [] }
        },
        guidesContext
      );

      setCanonSessionId(result.sessionId);
      setCanonState(STATES.REVIEW_LOCKED);
      setShowReviewQueue(true);
      setSaveStatus({ lastSaved: Date.now(), isSaving: false, hasUnsavedChanges: false });
      if (onChapterUpdate) onChapterUpdate(currentBook);
      toastService.success(`Extraction complete! ${result.queueItems?.length || 0} items to review.`);
    } catch (error) {
      setCanonState(STATES.DRAFT);
      toastService.error('Save & Extract failed: ' + error.message);
    } finally {
      setIsCanonExtracting(false);
    }
  };

  /**
   * Handle Review Queue completion — commit canon
   */
  const handleReviewQueueComplete = async () => {
    setShowReviewQueue(false);
    try {
      await canonApiService.commitCanon(currentChapter.id, canonSessionId);
      setCanonState(STATES.CANON_COMMITTED);
      setCanonSessionId(null);
      toastService.success('Canon committed! You may continue writing.');
      // Reset to draft for next chapter editing
      setTimeout(() => setCanonState(STATES.DRAFT), 500);
      if (onChapterUpdate) {
        const book = getBookById(selectedBook);
        if (book) onChapterUpdate(book);
      }
    } catch (error) {
      toastService.error('Canon commit failed: ' + error.message);
    }
  };

  /**
   * Legacy manual save handler (kept for Ctrl+S compat)
   */
  const saveChapter = async () => {
    const success = await saveChapterToBook();
    if (success) {
      await checkConsistency();
    }
  };

  /**
   * Handle Entity Extraction Wizard completion
   */
  const handleEntityWizardComplete = async () => {
    setShowEntityWizard(false);
    
    // Notify parent to refresh data (actors, items, skills may have been created/updated)
    if (onChapterUpdate) {
      // Trigger a refresh by calling onChapterUpdate with current book
      const currentBook = getBookById(selectedBook);
      if (currentBook) {
        onChapterUpdate(currentBook);
      }
    }
    
    // Visualizations will update from timelineEvents automatically
    console.log('[WritersRoom] Entity wizard completed, visualizations will update from timelineEvents');
  };

  const toggleChapterSelection = (chapter) => {
    setSelectedChapters(prev => {
      const exists = prev.find(ch => ch.id === chapter.id && ch.bookId === chapter.bookId);
      if (exists) {
        return prev.filter(ch => !(ch.id === chapter.id && ch.bookId === chapter.bookId));
      } else {
        return [...prev, chapter];
      }
    });
  };

  /**
   * Generate prompt preview based on current configuration
   */
  const generatePromptPreview = async () => {
    if (!currentBook || !currentChapter) return;

    try {
      const styleGuideService = (await import('../services/styleGuideService')).default;
      const chapterContextService = (await import('../services/chapterContextService')).default;
      const db = (await import('../services/database')).default;

      const sections = [];
      
      // Basic chapter info (always included)
      sections.push({
        id: 'basic',
        title: 'Chapter Information',
        content: `Book: ${currentBook.title || `Book ${currentBook.id}`}\nChapter: ${currentChapter.title || `Chapter ${currentChapter.id}`}\n${currentChapter.desc ? `Description: ${currentChapter.desc}` : ''}`,
        enabled: true
      });

      // Outline
      if (outline) {
        sections.push({
          id: 'outline',
          title: 'Chapter Outline',
          content: outline,
          enabled: customPromptConfig.includeChapterContext
        });
      }

      // Style Guide
      if (customPromptConfig.includeStyleGuide) {
        const styleGuide = await styleGuideService.getSystemContext();
        sections.push({
          id: 'styleGuide',
          title: 'Writing Style Guide',
          content: styleGuide.substring(0, 2000) + (styleGuide.length > 2000 ? '...' : ''),
          enabled: true,
          fullContent: styleGuide
        });
      }

      // Chapter Context
      if (customPromptConfig.includeChapterContext && selectedChapters.length > 0) {
        const chapterContext = chapterContextService.buildChapterContext(selectedChapters);
        sections.push({
          id: 'chapterContext',
          title: 'Previous Chapters Context',
          content: chapterContext.substring(0, 1000) + (chapterContext.length > 1000 ? '...' : ''),
          enabled: true,
          fullContent: chapterContext
        });
      }

      // Actors
      if (customPromptConfig.includeActors && contextData.actors.length > 0) {
        const actorsList = contextData.actors.map(a => 
          `${a.name} (${a.class || ''}): ${a.desc || ''}`
        ).join('\n');
        sections.push({
          id: 'actors',
          title: 'Available Characters',
          content: actorsList,
          enabled: true
        });
      }

      // Snapshots
      if (customPromptConfig.includeSnapshots && includeSnapshots) {
        const actorIds = contextData.actors.map(a => a.id);
        const snapshots = await db.getLatestSnapshotsForActors(actorIds, currentBook.id, currentChapter.id);
        if (Object.keys(snapshots).length > 0) {
          const snapshotsText = Object.entries(snapshots).map(([id, snap]) => {
            const actor = contextData.actors.find(a => a.id === id);
            return `${actor?.name || id}'s current state from snapshot`;
          }).join('\n');
          sections.push({
            id: 'snapshots',
            title: 'Character Current States (Snapshots)',
            content: snapshotsText,
            enabled: true
          });
        }
      }

      // Items
      if (customPromptConfig.includeItems && contextData.items.length > 0) {
        const itemsList = contextData.items.map(i => 
          `${i.name}: ${i.desc || ''}`
        ).join('\n');
        sections.push({
          id: 'items',
          title: 'Available Items',
          content: itemsList,
          enabled: true
        });
      }

      // Skills
      if (customPromptConfig.includeSkills && contextData.skills.length > 0) {
        const skillsList = contextData.skills.map(s => 
          `${s.name}: ${s.desc || ''}`
        ).join('\n');
        sections.push({
          id: 'skills',
          title: 'Available Skills',
          content: skillsList,
          enabled: true
        });
      }

      // Buzzwords
      if (customPromptConfig.includeBuzzwords) {
        const buzzwordsRef = await styleGuideService.getBuzzwordsReference();
        if (buzzwordsRef) {
          sections.push({
            id: 'buzzwords',
            title: 'Buzzwords Reference',
            content: buzzwordsRef.substring(0, 1000) + (buzzwordsRef.length > 1000 ? '...' : ''),
            enabled: true,
            fullContent: buzzwordsRef
          });
        }
      }

      // Custom Instructions
      if (customPromptConfig.customInstructions) {
        sections.push({
          id: 'custom',
          title: 'Custom Instructions',
          content: customPromptConfig.customInstructions,
          enabled: true
        });
      }

      setFullPromptPreview(sections);
    } catch (error) {
      console.error('Error generating prompt preview:', error);
      toastService.error('Failed to generate prompt preview');
    }
  };

  /**
   * Toggle a prompt section on/off
   */
  const togglePromptSection = (sectionId) => {
    setCustomPromptConfig(prev => {
      const keyMap = {
        'styleGuide': 'includeStyleGuide',
        'buzzwords': 'includeBuzzwords',
        'snapshots': 'includeSnapshots',
        'chapterContext': 'includeChapterContext',
        'actors': 'includeActors',
        'items': 'includeItems',
        'skills': 'includeSkills'
      };
      
      const key = keyMap[sectionId];
      if (key) {
        return { ...prev, [key]: !prev[key] };
      }
      return prev;
    });
  };

  /**
   * Remove a section from the prompt
   */
  const removePromptSection = (sectionId) => {
    setCustomPromptConfig(prev => ({
      ...prev,
      removedSections: [...(prev.removedSections || []), sectionId]
    }));
  };

  /**
   * Load prompt preview when editor opens
   */
  useEffect(() => {
    if (showPromptEditor) {
      generatePromptPreview();
    }
  }, [showPromptEditor, currentChapter, selectedChapters, outline, contextData, customPromptConfig]);

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-green-500/30 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <PenTool className="mr-3 text-green-500" />
            WRITER'S ROOM ENHANCED
          </h2>
          <p className="text-sm text-slate-400 mt-1">AI-powered chapter writing with full data access</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuidedTour(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded flex items-center gap-2 transition-colors"
            title="Take a guided tour"
          >
            <Sparkles className="w-4 h-4" />
            Tour
          </button>
          <button
            onClick={() => {
              const completed = localStorage.getItem('writersRoomTutorialCompleted');
              if (!completed) {
                setShowTutorial(true);
              } else {
                setShowGuidedTour(true);
              }
            }}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded flex items-center gap-2 transition-colors"
            title="Open tutorial or guided tour"
          >
            <HelpCircle className="w-4 h-4" />
            Help
          </button>
        </div>
      </div>

      {/* Dashboard Section - Stats & Goals - Always Visible */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 overflow-y-auto flex-shrink-0 max-h-80">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Writing Goals */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Goals
                </h3>
                <button
                  onClick={saveGoals}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Save
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Daily: {currentProgress.daily} / {writingGoals.daily || 0}</span>
                    <span>{writingGoals.daily ? Math.round((currentProgress.daily / writingGoals.daily) * 100) : 0}%</span>
                  </div>
                  <input
                    type="number"
                    value={writingGoals.daily}
                    onChange={(e) => setWritingGoals(prev => ({ ...prev, daily: parseInt(e.target.value) || 0 }))}
                    placeholder="Daily goal"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-white text-xs"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Weekly: {currentProgress.weekly} / {writingGoals.weekly || 0}</span>
                    <span>{writingGoals.weekly ? Math.round((currentProgress.weekly / writingGoals.weekly) * 100) : 0}%</span>
                  </div>
                  <input
                    type="number"
                    value={writingGoals.weekly}
                    onChange={(e) => setWritingGoals(prev => ({ ...prev, weekly: parseInt(e.target.value) || 0 }))}
                    placeholder="Weekly goal"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-white text-xs"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Monthly: {currentProgress.monthly} / {writingGoals.monthly || 0}</span>
                    <span>{writingGoals.monthly ? Math.round((currentProgress.monthly / writingGoals.monthly) * 100) : 0}%</span>
                  </div>
                  <input
                    type="number"
                    value={writingGoals.monthly}
                    onChange={(e) => setWritingGoals(prev => ({ ...prev, monthly: parseInt(e.target.value) || 0 }))}
                    placeholder="Monthly goal"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Writing Streak & Stats */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-green-500" />
                Streak & Stats
              </h3>
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{writingStreak}</div>
                  <div className="text-xs text-slate-400">days streak</div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Chapters:</span>
                  <span className="text-white font-bold">{totalChapters}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Words:</span>
                  <span className="text-white font-bold">{totalWords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Characters:</span>
                  <span className="text-white font-bold">{actors?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Context Validation */}
            {showContextValidation && contextValidation && (
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${
                    contextValidation.status === 'green' ? 'bg-green-500' :
                    contextValidation.status === 'yellow' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  Context Status
                </h3>
                <div className="space-y-2">
                  <div className="text-xs text-slate-400">
                    {contextValidation.status === 'green' && 'All context data available'}
                    {contextValidation.status === 'yellow' && 'Some context missing'}
                    {contextValidation.status === 'red' && 'Critical context missing'}
                  </div>
                  {contextValidation.missingContext && contextValidation.missingContext.length > 0 && (
                    <div className="text-xs text-yellow-400">
                      Missing: {contextValidation.missingContext.map(m => m.type).join(', ')}
                    </div>
                  )}
                  {contextValidation.suggestions && contextValidation.suggestions.length > 0 && (
                    <button
                      onClick={() => {
                        toastService.info(`Suggestions: ${contextValidation.suggestions.map(s => s.action).join(', ')}`);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      View suggestions
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Story Health */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                Story Health
              </h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Consistency</span>
                    <span className={getHealthColor(storyHealth.consistency)}>{storyHealth.consistency}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getHealthBgColor(storyHealth.consistency)}`}
                      style={{ width: `${storyHealth.consistency}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Plot Threads</span>
                    <span className={getHealthColor(storyHealth.plotThreads)}>{storyHealth.plotThreads}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getHealthBgColor(storyHealth.plotThreads)}`}
                      style={{ width: `${storyHealth.plotThreads}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Character Arcs</span>
                    <span className={getHealthColor(storyHealth.characterArcs)}>{storyHealth.characterArcs}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getHealthBgColor(storyHealth.characterArcs)}`}
                      style={{ width: `${storyHealth.characterArcs}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Prompts */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI Prompts
                </h3>
                <button
                  onClick={generateWritingPrompt}
                  disabled={isGeneratingPrompt}
                  className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                >
                  {isGeneratingPrompt ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  New
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {aiPrompts.map(prompt => (
                  <div key={prompt.id} className="bg-slate-800 rounded p-1.5 text-xs text-slate-300">
                    {prompt.prompt}
                  </div>
                ))}
                {aiPrompts.length === 0 && (
                  <div className="text-center text-slate-500 text-xs py-2">
                    No prompts yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Left Sidebar: Chapter Selection & Context */}
        <div className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-900 overflow-y-auto">
          {/* Book/Chapter Selector */}
          <div className="p-4 border-b border-slate-800">
            <div className="mb-3">
              <label className="text-xs text-slate-400 block mb-1">BOOK</label>
              {(() => {
                const bookArray = getAllBooks().sort((a, b) => a.id - b.id);
                const currentIndex = bookArray.findIndex(b => b.id === selectedBook);
                const canGoPrev = currentIndex > 0;
                const canGoNext = currentIndex < bookArray.length - 1;
                
                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (canGoPrev) {
                          const prevBook = bookArray[currentIndex - 1];
                          setSelectedBook(prevBook.id);
                          if (prevBook.chapters && prevBook.chapters.length > 0) {
                            setSelectedChapter(prevBook.chapters[0].id);
                          }
                        }
                      }}
                      disabled={!canGoPrev || bookArray.length <= 1}
                      className="p-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded border-2 border-purple-500 hover:border-purple-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-purple-600 disabled:hover:border-purple-500 flex-shrink-0 transition-all shadow-lg hover:shadow-purple-500/50"
                      title={canGoPrev ? "Previous Book" : "No previous book"}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <select
                      value={selectedBook}
                      onChange={(e) => {
                        setSelectedBook(Number(e.target.value));
                        const book = getBookById(Number(e.target.value));
                        if (book && book.chapters && book.chapters.length > 0) {
                          setSelectedChapter(book.chapters[0].id);
                        }
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 text-white p-2 rounded focus:border-purple-500 focus:outline-none"
                    >
                      {bookArray.map(book => (
                        <option key={book.id} value={book.id}>{book.title}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (canGoNext) {
                          const nextBook = bookArray[currentIndex + 1];
                          setSelectedBook(nextBook.id);
                          if (nextBook.chapters && nextBook.chapters.length > 0) {
                            setSelectedChapter(nextBook.chapters[0].id);
                          }
                        }
                      }}
                      disabled={!canGoNext || bookArray.length <= 1}
                      className="p-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded border-2 border-purple-500 hover:border-purple-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-purple-600 disabled:hover:border-purple-500 flex-shrink-0 transition-all shadow-lg hover:shadow-purple-500/50"
                      title={canGoNext ? "Next Book" : "No next book"}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                );
              })()}
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">CHAPTER</label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
              >
                {currentBook?.chapters.map((ch, index) => (
                  <option key={ch.id} value={ch.id}>Ch {index + 1}: {ch.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="p-4 border-b border-slate-800 space-y-2">
            <button
              onClick={suggestSmartContext}
              disabled={isSuggestingContext}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSuggestingContext ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              SMART CONTEXT
            </button>
            
            <button
              onClick={suggestRelevantChapters}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              SUGGEST RELEVANT CHAPTERS
            </button>

            {/* Smart Suggestions */}
            {smartSuggestions.length > 0 && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                <div className="text-xs text-purple-400 font-bold">AI SUGGESTIONS ({smartSuggestions.length})</div>
                {smartSuggestions.map((ch, i) => (
                  <div key={i} className="text-xs bg-slate-950 p-2 rounded border border-purple-800">
                    <div className="text-white font-bold">{ch.title || `Chapter ${ch.id}`}</div>
                    <div className="text-slate-400">Relevance: {(ch.relevance * 100).toFixed(0)}%</div>
                    {ch.reason && (
                      <div className="text-slate-500 text-[10px] mt-1">{ch.reason}</div>
                    )}
                    <button
                      onClick={() => applySmartSuggestions(ch)}
                      className="mt-1 text-purple-400 hover:text-purple-300 text-[10px]"
                    >
                      {selectedChapters.find(sc => sc.id === ch.id && sc.bookId === ch.bookId) ? '✓ Added' : '+ Add to context'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Regular Suggestions */}
            {suggestedChapters.length > 0 && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {suggestedChapters.slice(0, 5).map((ch, i) => (
                  <div key={i} className="text-xs bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-white font-bold">{ch.title}</div>
                    <div className="text-slate-400">{(ch.relevance * 100).toFixed(0)}% relevant</div>
                    <button
                      onClick={() => toggleChapterSelection(ch)}
                      className="mt-1 text-blue-400 hover:text-blue-300 text-[10px]"
                    >
                      {selectedChapters.find(sc => sc.id === ch.id) ? 'Remove' : 'Add'} to context
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manuscript Intelligence Badges */}
          <div className="p-4 border-b border-slate-800">
            <div className="text-xs text-purple-400 font-bold mb-2">MANUSCRIPT CONTEXT</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950 rounded p-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Plot Beats</span>
                  <span className={`text-xs font-bold ${
                    badgeCounts.plotBeats > 0 ? 'text-green-400' : 'text-slate-500'
                  }`}>
                    {badgeCounts.plotBeats}
                  </span>
                </div>
              </div>
              <div className="bg-slate-950 rounded p-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Callbacks</span>
                  <span className={`text-xs font-bold ${
                    badgeCounts.callbacks > 0 ? 'text-yellow-400' : 'text-slate-500'
                  }`}>
                    {badgeCounts.callbacks}
                  </span>
                </div>
              </div>
              <div className="bg-slate-950 rounded p-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Memories</span>
                  <span className={`text-xs font-bold ${
                    badgeCounts.memories > 0 ? 'text-pink-400' : 'text-slate-500'
                  }`}>
                    {badgeCounts.memories}
                  </span>
                </div>
              </div>
              <div className="bg-slate-950 rounded p-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Decisions</span>
                  <span className={`text-xs font-bold ${
                    badgeCounts.decisions > 0 ? 'text-orange-400' : 'text-slate-500'
                  }`}>
                    {badgeCounts.decisions}
                  </span>
                </div>
              </div>
              <div className="bg-slate-950 rounded p-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">AI Suggestions</span>
                  <span className={`text-xs font-bold ${
                    badgeCounts.suggestions > 0 ? 'text-purple-400' : 'text-slate-500'
                  }`}>
                    {badgeCounts.suggestions}
                  </span>
                </div>
              </div>
              <div className="bg-slate-950 rounded p-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Storylines</span>
                  <span className={`text-xs font-bold ${
                    badgeCounts.storylines > 0 ? 'text-cyan-400' : 'text-slate-500'
                  }`}>
                    {badgeCounts.storylines}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Context Checkboxes */}
          <div className="p-4 border-b border-slate-800">
            <div className="text-xs text-purple-400 font-bold mb-2">ENABLE CONTEXT</div>
            <div className="space-y-2">
              {Object.entries(contextCheckboxes).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setContextCheckboxes(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-xs text-slate-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Extracted Entities Display */}
          {(extractedEntities.actors.length > 0 || extractedEntities.items.length > 0 || extractedEntities.skills.length > 0) && (
            <div className="p-4 border-b border-slate-800 bg-green-950/20">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-green-400 font-bold">EXTRACTED ENTITIES</div>
                <button
                  onClick={() => {
                    // Build queue from extracted entities
                    const queue = [];
                    
                    // Add actors that need to be created (not already in actors list)
                    extractedEntities.actors.forEach(id => {
                      const existingActor = actors.find(a => a.id === id || a.name.toLowerCase() === id.toLowerCase());
                      if (!existingActor) {
                        queue.push({
                          category: 'New Actor',
                          type: 'actor',
                          action: 'create',
                          data: { name: id },
                          description: `Create new character: ${id}`
                        });
                      }
                    });
                    
                    // Add items that need to be created
                    extractedEntities.items.forEach(id => {
                      const existingItem = items.find(i => i.id === id || i.name.toLowerCase() === id.toLowerCase());
                      if (!existingItem) {
                        queue.push({
                          category: 'New Item',
                          type: 'item',
                          action: 'create',
                          data: { name: id },
                          description: `Create new item: ${id}`
                        });
                      }
                    });
                    
                    // Add skills that need to be created
                    extractedEntities.skills.forEach(id => {
                      const existingSkill = skills.find(s => s.id === id || s.name.toLowerCase() === id.toLowerCase());
                      if (!existingSkill) {
                        queue.push({
                          category: 'New Skill',
                          type: 'skill',
                          action: 'create',
                          data: { name: id },
                          description: `Create new skill: ${id}`
                        });
                      }
                    });
                    
                    if (queue.length > 0) {
                      setExtractedEntitiesQueue(queue);
                      setCurrentEntityIndex(0);
                      setEntityAcceptResults([]);
                      setShowEntityReview(true);
                      setAutonomousMode('reviewing');
                    } else {
                      toastService.info('All entities already exist in the database');
                    }
                  }}
                  className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Review & Add New
                </button>
              </div>
              <div className="space-y-1 text-xs">
                {extractedEntities.actors.length > 0 && (
                  <div className="text-slate-300">
                    <span className="text-green-400">Actors:</span> {extractedEntities.actors.map(id => {
                      const actor = actors.find(a => a.id === id);
                      const exists = actor || actors.find(a => a.name.toLowerCase() === id.toLowerCase());
                      return (
                        <span key={id} className={`ml-1 ${exists ? 'text-slate-400' : 'text-amber-300 font-bold'}`}>
                          {actor ? actor.name : id}{exists ? '' : ' (new)'}
                        </span>
                      );
                    })}
                  </div>
                )}
                {extractedEntities.items.length > 0 && (
                  <div className="text-slate-300">
                    <span className="text-green-400">Items:</span> {extractedEntities.items.map(id => {
                      const item = items.find(i => i.id === id);
                      const exists = item || items.find(i => i.name.toLowerCase() === id.toLowerCase());
                      return (
                        <span key={id} className={`ml-1 ${exists ? 'text-slate-400' : 'text-amber-300 font-bold'}`}>
                          {item ? item.name : id}{exists ? '' : ' (new)'}
                        </span>
                      );
                    })}
                  </div>
                )}
                {extractedEntities.skills.length > 0 && (
                  <div className="text-slate-300">
                    <span className="text-green-400">Skills:</span> {extractedEntities.skills.map(id => {
                      const skill = skills.find(s => s.id === id);
                      const exists = skill || skills.find(s => s.name.toLowerCase() === id.toLowerCase());
                      return (
                        <span key={id} className={`ml-1 ${exists ? 'text-slate-400' : 'text-amber-300 font-bold'}`}>
                          {skill ? skill.name : id}{exists ? '' : ' (new)'}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manuscript Context Panel */}
          {manuscriptContext && (
            <div className="p-4 border-b border-slate-800">
              <ManuscriptContextPanel 
                manuscriptContext={manuscriptContext}
                onNavigate={onNavigate}
              />
            </div>
          )}

          {/* AI Suggestions Panel */}
          {badgeCounts.suggestions > 0 && contextCheckboxes.aiSuggestions && (
            <div className="p-4 border-b border-slate-800 flex-1 overflow-hidden flex flex-col">
              <AISuggestionPanel
                suggestions={aiSuggestions}
                chapterId={currentChapter?.id}
                bookId={currentBook?.id}
                onAccept={async (suggestion) => {
                  // Update suggestion status to accepted
                  try {
                    const updated = { ...suggestion, status: 'accepted' };
                    await db.update('aiSuggestions', updated);
                    await loadAISuggestions(); // Reload to refresh list
                  } catch (error) {
                    console.error('Error accepting suggestion:', error);
                  }
                }}
                onDismiss={async (suggestion) => {
                  // Update suggestion status to dismissed
                  try {
                    const updated = { ...suggestion, status: 'dismissed' };
                    await db.update('aiSuggestions', updated);
                    await loadAISuggestions(); // Reload to refresh list
                  } catch (error) {
                    console.error('Error dismissing suggestion:', error);
                  }
                }}
              />
            </div>
          )}

          {/* Selected Chapters */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-xs text-slate-400 font-bold mb-2">SELECTED FOR CONTEXT ({selectedChapters.length})</div>
            <div className="space-y-2">
              {selectedChapters.map((ch, i) => (
                <div key={i} className="bg-slate-950 p-2 rounded border border-green-800 flex justify-between items-center">
                  <div className="text-xs text-white">{ch.title}</div>
                  <button
                    onClick={() => toggleChapterSelection(ch)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {selectedChapters.length === 0 && (
                <div className="text-xs text-slate-500 italic">No chapters selected. AI will use previous chapter automatically.</div>
              )}
            </div>
          </div>

          {/* Context Summary */}
          <div className="p-4 border-t border-slate-800 bg-slate-950">
            <div className="text-xs text-slate-400 font-bold mb-2">CONTEXT SUMMARY</div>
            <div className="text-xs text-slate-500 space-y-1">
              <div>Actors: {contextData.actors.length}</div>
              <div>Items: {contextData.items.length}</div>
              <div>Skills: {contextData.skills.length}</div>
              <div>Wiki Entries: {contextData.wikiEntries.length}</div>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-slate-900 border-b border-slate-800 p-4">
            {/* Main Toolbar Row */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {/* Writing Mode */}
              <div className="flex gap-2 border-r border-slate-700 pr-3">
                <button
                  onClick={() => setMode('full')}
                  className={`px-4 py-2 rounded text-xs font-bold transition-colors ${
                    mode === 'full' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  WRITE FULL CHAPTER
                </button>
                <button
                  onClick={() => setMode('assist')}
                  className={`px-4 py-2 rounded text-xs font-bold transition-colors ${
                    mode === 'assist' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  ASSIST MODE
                </button>
              </div>

              {/* AI Tools */}
              <div className="flex gap-2 border-r border-slate-700 pr-3">
                <button
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setContextMenuPosition({ x: rect.left, y: rect.bottom + 5 });
                    setShowAIContextualMenu(true);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded flex items-center gap-2 transition-colors"
                  title="AI Assistant - Right-click in editor for context menu"
                >
                  <Sparkles className="w-4 h-4" />
                  AI ASSIST
                </button>
                {selectedText && (
                  <button
                    onClick={() => setShowMoodEditor(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center gap-2 transition-colors"
                    title="Mood Editor - Adjust tone and style"
                  >
                    <Wand2 className="w-4 h-4" />
                    MOOD EDITOR
                  </button>
                )}
              </div>

              {/* Writing Tools */}
              <div className="flex gap-2 border-r border-slate-700 pr-3">
                <button
                  onClick={writeChapter}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {mode === 'full' ? 'WRITE CHAPTER' : 'GET ASSISTANCE'}
                </button>
                <button
                  onClick={generateOutline}
                  disabled={isGeneratingOutline}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {isGeneratingOutline ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  OUTLINE
                </button>
                <button
                  onClick={processCurrentChapter}
                  disabled={!chapterText || isGenerating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <Brain className="w-4 h-4" />
                  PROCESS
                </button>
                <button
                  onClick={checkConsistency}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold rounded flex items-center gap-2 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  CHECK
                </button>
              </div>

              <div className="flex-1" />

              {/* Save & Status */}
              <div className="flex items-center gap-2">
                {saveStatus.isSaving ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded">
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-xs text-blue-400">Saving...</span>
                  </div>
                ) : saveStatus.hasUnsavedChanges ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-yellow-400">Unsaved</span>
                  </div>
                ) : saveStatus.lastSaved ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">
                      Saved {Math.floor((Date.now() - saveStatus.lastSaved) / 1000 / 60)}m ago
                    </span>
                  </div>
                ) : null}
                <button
                  onClick={saveDraftOnly}
                  disabled={saveStatus.isSaving || !chapterText || canonState !== STATES.DRAFT}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded flex items-center gap-2 disabled:opacity-50 transition-colors"
                  title="Save draft only — no extraction (Ctrl+S)"
                >
                  <Save className="w-4 h-4" />
                  SAVE DRAFT
                </button>
                <button
                  onClick={saveAndExtract}
                  disabled={saveStatus.isSaving || !chapterText || canonState !== STATES.DRAFT || isCanonExtracting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-2 disabled:opacity-50 transition-colors"
                  title="Save chapter and extract canon data for review"
                >
                  {isCanonExtracting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isCanonExtracting ? 'EXTRACTING...' : 'SAVE & EXTRACT'}
                </button>
                {/* Lifecycle Badge */}
                {canonState !== STATES.DRAFT && (
                  <div className={`px-3 py-2 rounded text-xs font-bold flex items-center gap-2 ${
                    canonState === STATES.EXTRACTING ? 'bg-yellow-900/30 text-yellow-400' :
                    canonState === STATES.REVIEW_LOCKED ? 'bg-red-900/30 text-red-400' :
                    canonState === STATES.CANON_COMMITTED ? 'bg-green-900/30 text-green-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {canonState === STATES.EXTRACTING && <><RefreshCw className="w-3 h-3 animate-spin" /> Extracting</>}
                    {canonState === STATES.REVIEW_LOCKED && <><Lock className="w-3 h-3" /> Review Locked</>}
                    {canonState === STATES.CANON_COMMITTED && <><CheckCircle className="w-3 h-3" /> Committed</>}
                    {canonState === STATES.SAVE_PENDING && <><Clock className="w-3 h-3" /> Saving</>}
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Toolbar Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={includeSnapshots}
                  onChange={(e) => setIncludeSnapshots(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <Database className="w-3 h-3 text-blue-400" />
                <span className="text-slate-300">Include Snapshots</span>
              </label>
              <button
                onClick={() => setShowPromptEditor(true)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-2 transition-colors"
              >
                <Settings className="w-3 h-3" />
                EDIT PROMPT
              </button>
              <button
                onClick={() => setShowContextManager(true)}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded flex items-center gap-2 transition-colors"
              >
                <FileText className="w-3 h-3" />
                STORY CONTEXT
              </button>
              <button
                onClick={() => setShowManuscriptIntelligence(true)}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded flex items-center gap-2 transition-colors"
              >
                <ScanText className="w-3 h-3" />
                EXTRACT ENTITIES
              </button>
              {realtimeDetections.length > 0 && (
                <button
                  onClick={() => setShowRealtimePanel(!showRealtimePanel)}
                  className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded flex items-center gap-2 transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  DETECTIONS ({realtimeDetections.length})
                </button>
              )}
            </div>
          </div>

          {/* Outline Panel */}
          {showOutline && (
            <div className="bg-slate-950 border-b border-slate-800 p-4 max-h-60 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-purple-400 font-bold">CHAPTER OUTLINE</div>
                <button onClick={() => setShowOutline(false)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-slate-300 whitespace-pre-wrap">{outline}</div>
            </div>
          )}

          {/* Consistency Issues */}
          {showConsistency && consistencyIssues.length > 0 && (
            <div className="bg-red-950/30 border-b border-red-800 p-4 max-h-40 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-red-400 font-bold">CONSISTENCY ISSUES ({consistencyIssues.length})</div>
                <button onClick={() => setShowConsistency(false)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {consistencyIssues.map((issue, i) => (
                  <div key={i} className="text-xs bg-slate-900 p-2 rounded border border-red-800">
                    <div className="text-red-400 font-bold">{issue.type} - {issue.severity}</div>
                    <div className="text-slate-300">{issue.description}</div>
                    {issue.suggestion && (
                      <div className="text-slate-400 italic mt-1">Suggestion: {issue.suggestion}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Editor Modal */}
          {showPromptEditor && (
            <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur flex flex-col p-4 overflow-hidden">
              <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-4xl mx-auto flex flex-col h-full max-h-full my-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Customize AI Prompt
                  </h3>
                  <button
                    onClick={() => setShowPromptEditor(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Section Toggles */}
                  <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                    <h4 className="text-sm font-bold text-white mb-3">Include Sections</h4>
                    <div className="space-y-2">
                      {[
                        { id: 'styleGuide', label: 'Writing Style Guide', key: 'includeStyleGuide' },
                        { id: 'buzzwords', label: 'Buzzwords Reference', key: 'includeBuzzwords' },
                        { id: 'chapterContext', label: 'Previous Chapters Context', key: 'includeChapterContext' },
                        { id: 'snapshots', label: 'Character Snapshots', key: 'includeSnapshots' },
                        { id: 'actors', label: 'Available Characters', key: 'includeActors' },
                        { id: 'items', label: 'Available Items', key: 'includeItems' },
                        { id: 'skills', label: 'Available Skills', key: 'includeSkills' }
                      ].map(section => (
                        <label key={section.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customPromptConfig[section.key]}
                            onChange={() => togglePromptSection(section.id)}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-slate-300">{section.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Custom Instructions */}
                  <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                    <h4 className="text-sm font-bold text-white mb-3">Additional Custom Instructions</h4>
                    <textarea
                      value={customPromptConfig.customInstructions}
                      onChange={(e) => setCustomPromptConfig(prev => ({ ...prev, customInstructions: e.target.value }))}
                      placeholder="Add any additional instructions or context you want the AI to consider..."
                      className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-3 text-white text-sm resize-none focus:outline-none focus:border-green-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      These instructions will be added at the end of the prompt.
                    </p>
                  </div>

                  {/* Prompt Preview */}
                  <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-white">Prompt Preview</h4>
                      <button
                        onClick={generatePromptPreview}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Refresh
                      </button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {fullPromptPreview && Array.isArray(fullPromptPreview) ? (
                        fullPromptPreview
                          .filter(section => !customPromptConfig.removedSections.includes(section.id))
                          .filter(section => section.enabled)
                          .map((section, index) => (
                            <div key={section.id || index} className="bg-slate-900 rounded p-3 border border-slate-700">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="text-xs font-bold text-green-400">{section.title}</h5>
                                <button
                                  onClick={() => removePromptSection(section.id)}
                                  className="text-red-400 hover:text-red-300"
                                  title="Remove this section"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-xs text-slate-300 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                                {section.content}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-sm text-slate-500 italic">Click "Refresh" to generate preview</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
                  <button
                    onClick={async () => {
                      await saveCustomPromptConfig();
                      setShowPromptEditor(false);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded"
                  >
                    Save & Close
                  </button>
                  <button
                    onClick={() => setShowPromptEditor(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Document Modal */}
          {showCreateDocumentModal && (
            <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Create New Document</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Title</label>
                    <input
                      value={newDocument.title}
                      onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
                      placeholder="Enter document title"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Category</label>
                    <select
                      value={newDocument.category}
                      onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
                    >
                      <option value="general">General</option>
                      <option value="outline">Outline</option>
                      <option value="worldbuilding">Worldbuilding</option>
                      <option value="character">Character</option>
                      <option value="plot">Plot</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Description (optional)</label>
                    <input
                      value={newDocument.description}
                      onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
                      placeholder="Enter description"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Content</label>
                    <textarea
                      value={newDocument.content}
                      onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                      rows={10}
                      className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
                      placeholder="Enter document content"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={async () => {
                      if (!newDocument.title || !newDocument.content) {
                        toastService.error('Title and content are required');
                        return;
                      }
                      try {
                        await storyContextService.createDocument({
                          ...newDocument,
                          enabled: true
                        });
                        await loadStoryContextDocuments();
                        toastService.success('Context document created');
                        setShowCreateDocumentModal(false);
                        setNewDocument({ title: '', category: 'general', description: '', content: '' });
                      } catch (error) {
                        toastService.error('Failed to create document: ' + error.message);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateDocumentModal(false);
                      setNewDocument({ title: '', category: 'general', description: '', content: '' });
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Document Modal */}
          {showEditDocumentModal && editingDocument && (
            <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Edit Document</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Title</label>
                    <input
                      value={editingDocument.title}
                      onChange={(e) => setEditingDocument({ ...editingDocument, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
                    />
                    </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Content</label>
                    <textarea
                      value={editingDocument.content}
                      onChange={(e) => setEditingDocument({ ...editingDocument, content: e.target.value })}
                      rows={10}
                      className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={async () => {
                      try {
                        await storyContextService.updateDocument(editingDocument.id, {
                          title: editingDocument.title,
                          content: editingDocument.content
                        });
                        await loadStoryContextDocuments();
                        toastService.success('Document updated');
                        setShowEditDocumentModal(false);
                        setEditingDocument(null);
                      } catch (error) {
                        toastService.error('Failed to update: ' + error.message);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowEditDocumentModal(false);
                      setEditingDocument(null);
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Story Context Manager Modal */}
          {showContextManager && (
            <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur flex flex-col p-4 overflow-hidden">
              <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-4xl mx-auto flex flex-col h-full max-h-full my-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Story Context Documents
                  </h3>
                  <button
                    onClick={() => setShowContextManager(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                    <p className="text-sm text-slate-300 mb-4">
                      Story Context Documents are long-form reference materials (outlines, world-building, character backgrounds, etc.) 
                      that will be included in AI prompts when writing chapters. This helps the AI understand your story vision and write 
                      content that matches your intended direction.
                    </p>
                    
                    <button
                      onClick={() => setShowCreateDocumentModal(true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      CREATE NEW DOCUMENT
                    </button>
                  </div>

                  {/* Document List */}
                  <div className="space-y-2">
                    {storyContextDocuments.length === 0 ? (
                      <div className="text-center text-slate-500 py-8">
                        No context documents yet. Create one to get started!
                      </div>
                    ) : (
                      storyContextDocuments.map(doc => (
                        <div key={doc.id} className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <input
                                  type="checkbox"
                                  checked={selectedContextDocumentIds.includes(doc.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedContextDocumentIds([...selectedContextDocumentIds, doc.id]);
                                    } else {
                                      setSelectedContextDocumentIds(selectedContextDocumentIds.filter(id => id !== doc.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                />
                                <h4 className="text-sm font-bold text-white">{doc.title}</h4>
                                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                  {doc.category}
                                </span>
                                {doc.enabled ? (
                                  <span className="text-xs text-green-400">Enabled</span>
                                ) : (
                                  <span className="text-xs text-slate-500">Disabled</span>
                                )}
                              </div>
                              {doc.description && (
                                <p className="text-xs text-slate-400 mb-2">{doc.description}</p>
                              )}
                              <div className="text-xs text-slate-500 font-mono max-h-20 overflow-y-auto">
                                {doc.content.substring(0, 200)}{doc.content.length > 200 ? '...' : ''}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                                  setEditingDocument(doc);
                                  setShowEditDocumentModal(true);
                                }}
                                className="text-blue-400 hover:text-blue-300"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await storyContextService.toggleEnabled(doc.id);
                                    await loadStoryContextDocuments();
                                    toastService.success('Document toggled');
                                  } catch (error) {
                                    toastService.error('Failed to toggle: ' + error.message);
                                  }
                                }}
                                className={doc.enabled ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300"}
                                title={doc.enabled ? "Disable" : "Enable"}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm('Delete this document?')) {
                                    try {
                                      await storyContextService.deleteDocument(doc.id);
                                      await loadStoryContextDocuments();
                                      setSelectedContextDocumentIds(selectedContextDocumentIds.filter(id => id !== doc.id));
                                      toastService.success('Document deleted');
                                    } catch (error) {
                                      toastService.error('Failed to delete: ' + error.message);
                                    }
                                  }
                    }}
                                className="text-red-400 hover:text-red-300"
                                title="Delete"
                  >
                                <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
                      ))
          )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
                  <button
                    onClick={() => setShowContextManager(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Consistency Issues */}
          {showConsistency && consistencyIssues.length > 0 && (
            <div className="bg-red-950/30 border-b border-red-800 p-4 max-h-40 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-red-400 font-bold">CONSISTENCY ISSUES ({consistencyIssues.length})</div>
                <button onClick={() => setShowConsistency(false)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {consistencyIssues.map((issue, i) => (
                  <div key={i} className="text-xs bg-slate-900 p-2 rounded border border-red-800">
                    <div className="text-red-400 font-bold">{issue.type} - {issue.severity}</div>
                    <div className="text-slate-300">{issue.description}</div>
                    {issue.suggestion && (
                      <div className="text-slate-400 italic mt-1">Suggestion: {issue.suggestion}</div>
                )}
              </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Chapter Editor with Real-time Panel */}
          <div className="flex-1 p-4 overflow-hidden flex gap-4">
            {/* Editor */}
            <div className={`flex-1 flex flex-col ${showRealtimePanel || showEntityReview ? 'w-2/3' : 'w-full'}`}>
              
              {/* Autonomous Toolbar */}
              <div className="bg-slate-900 border border-slate-700 rounded-t p-2 flex items-center gap-2 flex-wrap">
                {/* Voice Recording */}
              <button
                  onClick={toggleVoiceRecording}
                  className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isVoiceRecording 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={isVoiceRecording ? 'Stop Recording' : 'Start Voice Recording'}
                >
                  {isVoiceRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isVoiceRecording ? 'Stop' : 'Voice'}
              </button>

                <div className="w-px h-6 bg-slate-700" />

                {/* Process Text */}
                <button
                  onClick={processChapterText}
                  disabled={isProcessingText || !chapterText}
                  className="px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 bg-blue-900/50 text-blue-300 hover:bg-blue-900/70 disabled:opacity-50 border border-blue-700/50"
                  title="Analyze text for consistency"
                >
                  {isProcessingText ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
                  Process Text
                </button>

                {/* Extract Entities */}
                <button
                  onClick={extractChapterEntities}
                  disabled={isExtractingEntities || !chapterText}
                  className="px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 bg-purple-900/50 text-purple-300 hover:bg-purple-900/70 disabled:opacity-50 border border-purple-700/50"
                  title="Extract and create entities"
                >
                  {isExtractingEntities ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Extract Entities
                </button>

                <div className="w-px h-6 bg-slate-700" />

                {/* Live Suggestions Toggle */}
                <button
                  onClick={() => setShowLiveSuggestions(!showLiveSuggestions)}
                  className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ${
                    showLiveSuggestions ? 'bg-green-900/50 text-green-300 border border-green-700/50' : 'bg-slate-800 text-slate-400'
                  }`}
                  title="Toggle live spelling/grammar suggestions"
                >
                  <Lightbulb className="w-4 h-4" />
                  Live Hints
                </button>

                <div className="flex-1" />

                {/* Status Indicator */}
                {autonomousMode !== 'idle' && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 capitalize">{autonomousMode}...</span>
            </div>
                )}

                {/* Export PDF */}
                <button
                  onClick={exportStoryBible}
                  disabled={isExportingPDF}
                  className="px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  title="Export Story Bible as PDF"
                >
                  {isExportingPDF ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  PDF
                </button>
              </div>

              {/* Voice Transcript Panel */}
              {voiceTranscript && (
                <div className="bg-red-900/20 border-x border-red-700/50 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-red-400">Voice Transcript</span>
                    <div className="flex gap-2">
                      <button
                        onClick={expandVoiceTranscript}
                        disabled={isExpandingVoice}
                        className="px-2 py-1 rounded text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1"
                      >
                        {isExpandingVoice ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        Expand to Prose
                      </button>
                      <button
                        onClick={insertVoiceTranscript}
                        className="px-2 py-1 rounded text-xs bg-green-600 hover:bg-green-500 text-white flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3" />
                        Insert Raw
                      </button>
                      <button
                        onClick={() => setVoiceTranscript('')}
                        className="px-2 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-red-200 bg-red-900/30 p-2 rounded max-h-24 overflow-y-auto">
                    {voiceTranscript}
                  </div>
                </div>
              )}

              {/* Live Suggestions Bar */}
              {showLiveSuggestions && (liveSuggestions.spelling.length > 0 || liveSuggestions.grammar.length > 0 || liveSuggestions.hints.length > 0) && (
                <div className="bg-yellow-900/20 border-x border-yellow-700/50 p-2 flex flex-wrap gap-2">
                  {liveSuggestions.spelling.map((s, i) => (
                    <span key={`spell-${i}`} className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded">
                      🔤 "{s.word}" → {s.suggestion}
                    </span>
                  ))}
                  {liveSuggestions.grammar.map((g, i) => (
                    <span key={`gram-${i}`} className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded">
                      📝 {g.issue}
                    </span>
                  ))}
                  {liveSuggestions.hints.slice(0, 3).map((h, i) => (
                    <span key={`hint-${i}`} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                      💡 {h.message}
                    </span>
                  ))}
                </div>
              )}

              {/* Main Textarea */}
              <div className="relative flex-1 flex flex-col">
            <textarea
                  ref={textareaRef}
              value={chapterText}
                  onChange={canonState === STATES.DRAFT ? handleChapterTextChange : undefined}
                  readOnly={canonState !== STATES.DRAFT}
                  onMouseUp={handleTextSelection}
                  onKeyUp={handleTextSelection}
                  onContextMenu={handleContextMenu}
                  placeholder="Start writing your chapter here...

🎤 Voice: Click the microphone to dictate
📝 Process: Analyze for consistency with previous chapters  
🔮 Extract: Auto-detect and create characters, items, locations

💡 Right-click for AI tools and text options!
The AI learns from your previous chapters and maintains continuity."
                  className="w-full flex-1 bg-slate-950 border-x border-b border-slate-700 rounded-b p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-green-500"
                />
                
                {/* Context Menus */}
                <TextSelectionContextMenu
                  isOpen={showTextContextMenu}
                  onClose={() => setShowTextContextMenu(false)}
                  position={contextMenuPosition}
                  selectedText={selectedText}
                  onAction={(actionId, data) => handleContextMenuAction(actionId, data?.selectedText || selectedText, '', data)}
                />
                
                <AIContextualMenu
                  isOpen={showAIContextualMenu}
                  onClose={() => setShowAIContextualMenu(false)}
                  position={contextMenuPosition}
                  selectedText={selectedText}
                  cursorContext={chapterText.substring(Math.max(0, (selectionRange?.start || chapterText.length) - 500), selectionRange?.start || chapterText.length)}
                  chapterId={currentChapter?.id}
                  bookId={currentBook?.id}
                  chapterText={chapterText}
                  onAction={(actionId, text, customPrompt, data) => handleContextMenuAction(actionId, text, customPrompt, data)}
                />
                
                <MoodEditorPanel
                  isOpen={showMoodEditor}
                  onClose={() => setShowMoodEditor(false)}
                  selectedText={selectedText}
                  originalText={selectedText}
                  onApply={handleMoodEditorApply}
                  chapterId={currentChapter?.id}
                  bookId={currentBook?.id}
                  chapterText={chapterText}
                />
              </div>
            </div>

            {/* Real-time Detections Panel */}
            {showRealtimePanel && realtimeDetections.length > 0 && (
              <div className="w-1/3 bg-slate-900 border border-green-700/50 rounded-lg flex flex-col overflow-hidden">
                <div className="bg-green-900/30 border-b border-green-700/50 p-3 flex justify-between items-center">
                  <div className="text-xs font-bold text-green-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    LIVE DETECTIONS ({realtimeDetections.length})
                  </div>
                  <button
                    onClick={() => setShowRealtimePanel(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {realtimeDetections.map(det => (
                    <div
                      key={det.id}
                      className="bg-slate-950 border border-slate-800 rounded p-2"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          det.type === 'item' ? 'bg-yellow-900/30 text-yellow-400' :
                          det.type === 'skill' ? 'bg-blue-900/30 text-blue-400' :
                          det.type === 'actor' ? 'bg-green-900/30 text-green-400' :
                          det.type === 'stat_change' ? 'bg-purple-900/30 text-purple-400' :
                          det.type === 'inventory' ? 'bg-orange-900/30 text-orange-400' :
                          det.type === 'actor_mention' ? 'bg-cyan-900/30 text-cyan-400' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {det.label}
                        </span>
                        <span className="text-[10px] text-slate-500">Line {det.line}</span>
                      </div>
                      <div className="text-xs text-white font-mono truncate">
                        {det.content}
                      </div>
                      {det.source === 'buzzword' && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          Via buzz word tag
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="bg-slate-900 border-t border-slate-800 p-2">
                  <button
                    onClick={() => setShowManuscriptIntelligence(true)}
                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded"
                  >
                    Full AI Analysis →
                  </button>
                </div>
              </div>
            )}

            {/* Entity Review Panel */}
            {showEntityReview && extractedEntitiesQueue.length > 0 && (
              <div className="w-1/3 bg-slate-900 border border-purple-700/50 rounded-lg flex flex-col overflow-hidden">
                <div className="bg-purple-900/30 border-b border-purple-700/50 p-3 flex justify-between items-center">
                  <div className="text-xs font-bold text-purple-400 flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    ENTITY REVIEW ({currentEntityIndex + 1}/{extractedEntitiesQueue.length})
                  </div>
                  <button
                    onClick={() => {
                      setShowEntityReview(false);
                      setAutonomousMode('idle');
                    }}
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Current Entity */}
                {extractedEntitiesQueue[currentEntityIndex] && (
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 rounded bg-purple-900/50 text-purple-300">
                          {extractedEntitiesQueue[currentEntityIndex].category}
                        </span>
                        {extractedEntitiesQueue[currentEntityIndex].isLocked && (
                          <span className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-300 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-lg font-bold text-white mb-2">
                        {extractedEntitiesQueue[currentEntityIndex].data?.name || 
                         extractedEntitiesQueue[currentEntityIndex].name ||
                         'Unnamed Entity'}
                      </h4>
                      
                      <p className="text-sm text-slate-400 mb-4">
                        {extractedEntitiesQueue[currentEntityIndex].data?.description || 
                         extractedEntitiesQueue[currentEntityIndex].description ||
                         extractedEntitiesQueue[currentEntityIndex].message ||
                         'No description'}
                      </p>

                      {/* Show what will be created */}
                      <div className="text-xs text-slate-500 mb-4">
                        <div className="font-bold mb-1">Will create:</div>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Database entry</li>
                          <li>Wiki page</li>
                          <li>Timeline event</li>
                          <li>Mind map node</li>
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptEntity(extractedEntitiesQueue[currentEntityIndex])}
                          disabled={extractedEntitiesQueue[currentEntityIndex].isLocked}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          Accept & Create
                        </button>
                        <button
                          onClick={skipEntity}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded flex items-center justify-center gap-2"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Skip
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${((currentEntityIndex + 1) / extractedEntitiesQueue.length) * 100}%` }}
            />
          </div>
                      <div className="text-xs text-slate-500 mt-1 text-center">
                        {entityAcceptResults.filter(r => r.status === 'accepted').length} accepted, {' '}
                        {entityAcceptResults.filter(r => r.status === 'skipped').length} skipped
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Processing Results Panel */}
            {showProcessingResults && processingResults && (
              <div className="w-1/3 bg-slate-900 border border-blue-700/50 rounded-lg flex flex-col overflow-hidden">
                <div className="bg-blue-900/30 border-b border-blue-700/50 p-3 flex justify-between items-center">
                  <div className="text-xs font-bold text-blue-400 flex items-center gap-2">
                    <ScanText className="w-4 h-4" />
                    PROCESSING RESULTS
                  </div>
                  <button
                    onClick={() => setShowProcessingResults(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {/* Summary */}
                  {processingResults.summary && (
                    <div className="bg-slate-950 border border-slate-800 rounded p-3">
                      <div className="text-xs font-bold text-slate-400 mb-2">Chapter Summary</div>
                      <p className="text-sm text-slate-300">{processingResults.summary}</p>
                    </div>
                  )}

                  {/* Consistency Issues */}
                  {processingResults.consistencyIssues?.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Consistency Issues ({processingResults.consistencyIssues.length})
                      </div>
                      {processingResults.consistencyIssues.map((issue, i) => (
                        <div key={i} className={`bg-slate-950 border rounded p-2 mb-2 ${
                          issue.isLockedConflict ? 'border-orange-700/50' : 'border-red-700/50'
                        }`}>
                          <div className="text-xs text-red-300">{issue.message}</div>
                          {issue.suggestion && (
                            <div className="text-xs text-slate-500 mt-1">💡 {issue.suggestion}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {processingResults.suggestions?.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        Suggestions ({processingResults.suggestions.length})
                      </div>
                      {processingResults.suggestions.map((sug, i) => (
                        <div key={i} className="bg-slate-950 border border-green-700/50 rounded p-2 mb-2">
                          <div className="text-xs text-green-300">{sug.message}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {processingResults.warnings?.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-yellow-400 mb-2">
                        Warnings ({processingResults.warnings.length})
                      </div>
                      {processingResults.warnings.map((warn, i) => (
                        <div key={i} className="bg-slate-950 border border-yellow-700/50 rounded p-2 mb-2">
                          <div className="text-xs text-yellow-300">{warn.message}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Issues */}
                  {!processingResults.consistencyIssues?.length && 
                   !processingResults.suggestions?.length && 
                   !processingResults.warnings?.length && (
                    <div className="text-center text-slate-500 py-8">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <div className="text-sm">All clear! No issues found.</div>
                    </div>
                  )}
                </div>

                {/* Extract Entities Button */}
                <div className="bg-slate-900 border-t border-slate-800 p-2">
                  <button
                    onClick={() => {
                      setShowProcessingResults(false);
                      extractChapterEntities();
                    }}
                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Extract Entities →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Manuscript Intelligence Modal */}
          {showManuscriptIntelligence && (
            <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur flex flex-col overflow-hidden">
              <ManuscriptIntelligencePanel
                books={books}
                actors={actors}
                items={items}
                skills={skills}
                currentChapter={currentChapter}
                currentBook={currentBook}
                chapterText={chapterText}
                onClose={() => setShowManuscriptIntelligence(false)}
                onWorldStateUpdate={(updater) => {
                  // Refresh data after extraction
                  loadContextData();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Manuscript Intelligence Panel - Integrated extraction component
 */
const ManuscriptIntelligencePanel = ({ 
  books, actors, items, skills, currentChapter, currentBook, chapterText, onClose, onWorldStateUpdate 
}) => {
  const [inputMode, setInputMode] = useState('current'); // 'current' | 'paste' | 'upload'
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedActions, setSelectedActions] = useState({});
  const [viewMode, setViewMode] = useState('input'); // 'input' | 'review' | 'history'
  const [extractionHistory, setExtractionHistory] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await extractionHistoryService.getHistory({ limit: 50 });
      setExtractionHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleProcess = async () => {
    const textToProcess = inputMode === 'current' ? chapterText : inputText;
    
    if (!textToProcess || textToProcess.trim().length === 0) {
      toastService.error('No text to process');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Start extraction session
      await extractionHistoryService.startSession(
        currentChapter?.id || 'unknown',
        inputMode === 'current' ? 'realtime' : 'text',
        inputMode === 'current' ? `Chapter: ${currentChapter?.title}` : 'Pasted Text'
      );

      const worldState = {
        actors: actors || [],
        itemBank: items || [],
        skillBank: skills || [],
        books: books || {}
      };

      const result = await aiService.processManuscriptIntelligence(
        textToProcess,
        worldState,
        []
      );

      // Add chapter context to suggestions
      const finalSuggestions = (result.suggestions || []).map(sugg => ({
        ...sugg,
        chapterId: currentChapter?.id,
        bookId: currentBook?.id
      }));

      setSuggestions(finalSuggestions);
      setViewMode('review');
      
      toastService.success(`Found ${finalSuggestions.length} entities for review`);
    } catch (error) {
      console.error('Processing error:', error);
      toastService.error(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionSelect = (suggestionId, actionId) => {
    setSelectedActions(prev => ({
      ...prev,
      [suggestionId]: actionId
    }));
  };

  const applySelectedActions = async () => {
    const toApply = suggestions.filter(s => selectedActions[s.id] && selectedActions[s.id] !== 'D');
    
    if (toApply.length === 0) {
      toastService.warn('No actions selected');
      return;
    }

    let applied = 0;

    for (const sugg of toApply) {
      try {
        const actionId = selectedActions[sugg.id];
        const action = sugg.actionOptions?.find(opt => opt.id === actionId);
        
        if (!action || action.action === 'skip') continue;

        // Apply the action based on type
        const result = await applyAction(sugg, action);
        if (result) applied++;
      } catch (error) {
        console.error('Error applying action:', error);
      }
    }

    await extractionHistoryService.endSession();
    await loadHistory();

    if (applied > 0) {
      toastService.success(`Applied ${applied} extraction${applied !== 1 ? 's' : ''}`);
      if (onWorldStateUpdate) onWorldStateUpdate();
    }

    // Remove applied suggestions
    const appliedIds = toApply.map(s => s.id);
    setSuggestions(prev => prev.filter(s => !appliedIds.includes(s.id)));
    setSelectedActions({});
  };

  const applyAction = async (suggestion, action) => {
    const { type, data, chapterId } = suggestion;
    
    try {
      switch (type) {
        case 'item': {
          const newItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: data.name,
            type: data.type || 'Artifact',
            desc: data.description || data.desc || '',
            stats: data.stats || {},
            statMod: data.stats || {},
            rarity: data.rarity || 'Common',
            baseType: data.type || 'Artifact'
          };
          
          await db.add('itemBank', newItem);
          
          await extractionHistoryService.recordExtraction({
            entityType: 'item',
            action: 'create',
            entityId: newItem.id,
            entityName: newItem.name,
            newState: newItem,
            chapterId,
            sourceContext: suggestion.sourceContext,
            confidence: suggestion.confidence
          });
          
          return true;
        }

        case 'skill': {
          const newSkill = {
            id: `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: data.name,
            type: data.type || 'Combat',
            desc: data.description || data.desc || '',
            statMod: data.statMod || {},
            defaultVal: 1,
            tier: data.tier || 1
          };
          
          await db.add('skillBank', newSkill);
          
          await extractionHistoryService.recordExtraction({
            entityType: 'skill',
            action: 'create',
            entityId: newSkill.id,
            entityName: newSkill.name,
            newState: newSkill,
            chapterId,
            sourceContext: suggestion.sourceContext,
            confidence: suggestion.confidence
          });
          
          return true;
        }

        case 'actor': {
          const newActor = {
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: data.name,
            role: data.role || 'NPC',
            class: data.class || 'Unknown',
            desc: data.description || data.desc || '',
            isFav: false,
            baseStats: data.stats || { STR: 10, VIT: 10, INT: 10, DEX: 10 },
            additionalStats: {},
            activeSkills: [],
            inventory: [],
            snapshots: {}
          };
          
          await db.add('actors', newActor);
          
          await extractionHistoryService.recordExtraction({
            entityType: 'actor',
            action: 'create',
            entityId: newActor.id,
            entityName: newActor.name,
            newState: newActor,
            chapterId,
            sourceContext: suggestion.sourceContext,
            confidence: suggestion.confidence
          });
          
          return true;
        }

        case 'stat_change': {
          const actor = actors?.find(a => 
            a.name.toLowerCase() === data.actorName?.toLowerCase()
          );
          
          if (actor && data.stats) {
            const previousState = { baseStats: { ...actor.baseStats } };
            
            Object.entries(data.stats).forEach(([stat, change]) => {
              const value = typeof change === 'number' ? change : parseInt(change) || 0;
              actor.baseStats = actor.baseStats || {};
              actor.baseStats[stat] = (actor.baseStats[stat] || 0) + value;
            });
            
            await db.update('actors', actor);
            
            await extractionHistoryService.recordExtraction({
              entityType: 'actor',
              action: 'stat_change',
              entityId: actor.id,
              entityName: actor.name,
              targetActorId: actor.id,
              targetActorName: actor.name,
              previousState,
              newState: { baseStats: actor.baseStats },
              chapterId,
              sourceContext: suggestion.sourceContext
            });
            
            return true;
          }
          return false;
        }

        case 'inventory': {
          const actor = actors?.find(a => 
            a.name.toLowerCase() === data.actorName?.toLowerCase()
          );
          const item = items?.find(i => 
            i.name.toLowerCase() === data.itemName?.toLowerCase()
          );
          
          if (actor && item) {
            const prevInventory = [...(actor.inventory || [])];
            
            if (data.action === 'pickup' || data.action === 'gained') {
              if (!actor.inventory?.includes(item.id)) {
                actor.inventory = [...(actor.inventory || []), item.id];
              }
            } else if (data.action === 'drop' || data.action === 'lost') {
              actor.inventory = (actor.inventory || []).filter(id => id !== item.id);
            }
            
            await db.update('actors', actor);
            
            await extractionHistoryService.recordExtraction({
              entityType: 'item',
              action: data.action === 'pickup' ? 'inventory_add' : 'inventory_remove',
              entityId: item.id,
              entityName: item.name,
              targetActorId: actor.id,
              targetActorName: actor.name,
              previousState: { inventory: prevInventory },
              newState: { inventory: actor.inventory },
              chapterId,
              sourceContext: suggestion.sourceContext
            });
            
            return true;
          }
          return false;
        }

        case 'relationship': {
          const actor1 = actors?.find(a => 
            a.name.toLowerCase() === data.actor1Name?.toLowerCase()
          );
          const actor2 = actors?.find(a => 
            a.name.toLowerCase() === data.actor2Name?.toLowerCase()
          );
          
          if (actor1 && actor2) {
            const newRelationship = {
              id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              actors: [actor1.id, actor2.id],
              type: data.type || 'neutral',
              strength: data.strength || 0.5,
              description: data.description || ''
            };
            
            await db.add('relationships', newRelationship);
            
            await extractionHistoryService.recordExtraction({
              entityType: 'relationship',
              action: 'create',
              entityId: newRelationship.id,
              entityName: `${actor1.name} - ${actor2.name}`,
              newState: newRelationship,
              chapterId,
              sourceContext: suggestion.sourceContext
            });
            
            return true;
          }
          return false;
        }

        case 'location':
        case 'event': {
          const wikiEntry = {
            id: `wiki_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            entityType: type,
            title: data.name || data.title,
            content: data.description || '',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          await db.add('wikiEntries', wikiEntry);
          
          await extractionHistoryService.recordExtraction({
            entityType: type,
            action: 'create',
            entityId: wikiEntry.id,
            entityName: data.name || data.title,
            newState: wikiEntry,
            chapterId,
            sourceContext: suggestion.sourceContext
          });
          
          return true;
        }

        default:
          return false;
      }
    } catch (error) {
      console.error('Error applying action:', error);
      return false;
    }
  };

  const handleRevert = async (historyId) => {
    try {
      await extractionHistoryService.revertExtraction(historyId);
      toastService.success('Extraction reverted');
      await loadHistory();
      if (onWorldStateUpdate) onWorldStateUpdate();
    } catch (error) {
      toastService.error(`Failed to revert: ${error.message}`);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      item: '📦',
      skill: '⚡',
      actor: '👤',
      stat_change: '📊',
      inventory: '🎒',
      relationship: '💕',
      location: '📍',
      event: '🎯'
    };
    return icons[type] || '📄';
  };

  const getTypeColor = (type) => {
    const colors = {
      item: 'yellow',
      skill: 'blue',
      actor: 'green',
      stat_change: 'purple',
      inventory: 'yellow',
      relationship: 'pink',
      location: 'cyan',
      event: 'orange'
    };
    return colors[type] || 'gray';
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-purple-500/30 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <Brain className="mr-2 text-purple-500 w-5 h-5" />
            MANUSCRIPT INTELLIGENCE
          </h2>
          <p className="text-xs text-slate-400 mt-1">Extract entities from chapter text</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'history' ? 'input' : 'history')}
            className={`px-3 py-1 rounded text-xs font-bold ${
              viewMode === 'history' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            History ({extractionHistory.filter(h => !h.reverted).length})
          </button>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {viewMode === 'input' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            {/* Input Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode('current')}
                className={`flex-1 p-2 rounded text-xs font-bold ${
                  inputMode === 'current' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Current Chapter
              </button>
              <button
                onClick={() => setInputMode('paste')}
                className={`flex-1 p-2 rounded text-xs font-bold ${
                  inputMode === 'paste' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Paste Text
              </button>
            </div>

            {/* Text Display/Input */}
            {inputMode === 'current' ? (
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded p-3 overflow-y-auto">
                <div className="text-xs text-slate-400 mb-2">
                  Chapter: {currentChapter?.title || 'No chapter selected'}
                </div>
                <div className="text-sm text-slate-300 whitespace-pre-wrap">
                  {chapterText || 'No chapter text available'}
                </div>
              </div>
            ) : (
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste text to analyze..."
                className="flex-1 w-full bg-slate-900 border border-slate-700 rounded p-3 text-white text-sm resize-none focus:outline-none focus:border-purple-500"
              />
            )}

            {/* Process Button */}
            <button
              onClick={handleProcess}
              disabled={isProcessing || (inputMode === 'current' ? !chapterText : !inputText)}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  EXTRACT ENTITIES
                </>
              )}
            </button>
          </div>
        )}

        {viewMode === 'review' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Review Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center">
              <div className="text-sm text-white font-bold">
                {suggestions.length} Entities Found
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newSelections = {};
                    suggestions.filter(s => s.confidence >= 0.8).forEach(s => {
                      if (s.actionOptions?.length > 0) {
                        const firstAction = s.actionOptions.find(opt => opt.action !== 'skip');
                        if (firstAction) newSelections[s.id] = firstAction.id;
                      }
                    });
                    setSelectedActions(prev => ({ ...prev, ...newSelections }));
                  }}
                  className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded"
                >
                  Accept High Confidence
                </button>
                <button
                  onClick={applySelectedActions}
                  disabled={Object.keys(selectedActions).length === 0}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded disabled:opacity-50"
                >
                  Apply ({Object.keys(selectedActions).filter(k => selectedActions[k] !== 'D').length})
                </button>
              </div>
            </div>

            {/* Suggestions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {suggestions.map(sugg => {
                const color = getTypeColor(sugg.type);
                const selectedAction = selectedActions[sugg.id];

                return (
                  <div
                    key={sugg.id}
                    className={`bg-slate-900 border rounded-lg p-3 ${
                      selectedAction && selectedAction !== 'D'
                        ? 'border-green-500 bg-green-900/10'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTypeIcon(sugg.type)}</span>
                      <span className="font-bold text-white text-sm">
                        {sugg.data?.name || sugg.data?.title || sugg.data?.actorName || 'Entity'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded bg-${color}-900/30 text-${color}-400`}>
                        {sugg.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        sugg.confidence >= 0.8 ? 'bg-green-900/30 text-green-400' :
                        sugg.confidence >= 0.6 ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {(sugg.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    {sugg.sourceContext && (
                      <div className="text-xs text-slate-400 italic mb-2 line-clamp-2">
                        "{sugg.sourceContext.substring(0, 150)}..."
                      </div>
                    )}

                    {/* Action Options */}
                    <div className="flex flex-wrap gap-1">
                      {sugg.actionOptions?.map(option => (
                        <button
                          key={option.id}
                          onClick={() => handleActionSelect(sugg.id, option.id)}
                          className={`px-2 py-1 rounded text-xs ${
                            selectedAction === option.id
                              ? option.action === 'skip'
                                ? 'bg-red-600 text-white'
                                : 'bg-green-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {option.id}) {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {suggestions.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No entities found. Try with different text.
                </div>
              )}
            </div>

            {/* Back Button */}
            <div className="bg-slate-900 border-t border-slate-800 p-3">
              <button
                onClick={() => {
                  setViewMode('input');
                  setSuggestions([]);
                  setSelectedActions({});
                }}
                className="text-slate-400 hover:text-white text-xs"
              >
                ← Back to Input
              </button>
            </div>
          </div>
        )}

        {viewMode === 'history' && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-xs text-slate-400 font-bold mb-3">RECENT EXTRACTIONS</div>
            <div className="space-y-2">
              {extractionHistory.slice(0, 30).map(entry => (
                <div key={entry.id} className={`bg-slate-900 border rounded p-2 ${
                  entry.reverted ? 'border-slate-700 opacity-50' : 'border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{getTypeIcon(entry.entityType)}</span>
                      <div>
                        <div className="text-xs text-white font-bold">{entry.entityName}</div>
                        <div className="text-[10px] text-slate-500">
                          {entry.action} • {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {!entry.reverted && (
                      <button
                        onClick={() => handleRevert(entry.id)}
                        className="px-2 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 text-[10px] rounded"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {extractionHistory.length === 0 && (
                <div className="text-center text-slate-500 py-8 text-xs">
                  No extraction history yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legacy Entity Extraction Wizard (fallback) */}
      {showEntityWizard && !showReviewQueue && (
        <EntityExtractionWizard
          chapterText={chapterText}
          chapterId={currentChapter?.id}
          bookId={currentBook?.id}
          actors={actors || []}
          items={items || []}
          skills={skills || []}
          statRegistry={[]}
          books={Array.isArray(books) ? books : Object.values(books || {})}
          onComplete={handleEntityWizardComplete}
          onClose={() => setShowEntityWizard(false)}
        />
      )}

      {/* Narrative Review Queue (canon lifecycle) */}
      {showReviewQueue && canonSessionId && (
        <NarrativeReviewQueue
          sessionId={canonSessionId}
          chapterId={currentChapter?.id}
          chapterNumber={currentChapter?.chapterNumber || currentChapter?.id}
          onComplete={handleReviewQueueComplete}
          onUnresolvedChange={(count) => setCanonUnresolved(count)}
          onClose={() => {
            // Can only close if all items resolved
            if (canonUnresolved > 0) {
              toastService.warning(`Cannot close: ${canonUnresolved} unresolved items`);
              return;
            }
            // Prevent closing while still in ReviewLocked — must commit or cancel first
            if (canonState === STATES.REVIEW_LOCKED) {
              toastService.warning('All items resolved — click "Continue Writing" to commit canon before closing.');
              return;
            }
            setShowReviewQueue(false);
          }}
          isRetroEdit={(() => {
            if (!currentBook?.chapters || currentBook.chapters.length <= 1) return false;
            const sorted = [...currentBook.chapters].sort((a, b) => (a.chapterNumber || a.id) - (b.chapterNumber || b.id));
            return sorted[sorted.length - 1]?.id !== currentChapter?.id;
          })()}
        />
      )}

      {/* Tutorial Components */}
      <WritersRoomTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          toastService.success('Tutorial completed!');
        }}
      />
      
      <GuidedTour
        isOpen={showGuidedTour}
        onClose={() => setShowGuidedTour(false)}
        tourSteps={writersRoomGuidedTourSteps}
        onComplete={() => {
          toastService.success('Guided tour completed!');
        }}
      />
    </div>
  );
};

export default WritersRoomEnhanced;


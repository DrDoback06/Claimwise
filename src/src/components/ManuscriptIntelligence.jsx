import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FileText, Upload, X, Check, Eye, Sparkles, Save, Trash2, BookOpen, Users, Briefcase, Zap, 
  AlertCircle, Filter, Download, RefreshCw, Settings, Brain, TrendingUp, Link2, Clock,
  ChevronRight, ChevronLeft, CheckCircle, XCircle, Info, History, BarChart3, Edit3,
  MapPin, Heart, Target, Plus, RotateCcw, FileUp, Type, Layers, Minimize2, Maximize2, Bell
} from 'lucide-react';
import documentService from '../services/documentService';
import aiService from '../services/aiService';
import extractionHistoryService from '../services/extractionHistoryService';
import integrationService from '../services/integrationService';
import storyContextService from '../services/storyContextService';
import manuscriptProcessingService from '../services/manuscriptProcessingService';
import db from '../services/database';
import toastService from '../../services/toastService';
import IntegrationPreviewModal from './IntegrationPreviewModal';

/**
 * Manuscript Intelligence - Complete Overhaul
 * Unified document processing with intelligent AI extraction, batch review, and reversible history
 */
const ManuscriptIntelligence = ({ worldState, books, onClose, onApplySuggestions, onNavigate, onWorldStateUpdate }) => {
  // Input state
  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'upload'
  const [inputText, setInputText] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Chapter selection
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterMode, setChapterMode] = useState('existing'); // 'existing' | 'new' | 'worldbuilding'
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, status: '', liveSuggestions: [] });
  
  // Review state
  const [suggestions, setSuggestions] = useState([]);
  const [selectedActions, setSelectedActions] = useState({}); // { suggestionId: 'A' | 'B' | 'C' | 'D' }
  const [editableSuggestions, setEditableSuggestions] = useState({}); // Editable fields before approval
  const [pendingSuggestions, setPendingSuggestions] = useState([]); // Suggestions not yet applied
  const [appliedSuggestions, setAppliedSuggestions] = useState([]); // Suggestions that have been applied
  const [manualEntries, setManualEntries] = useState([]); // Manual entries added by user
  
  // View state
  const [viewMode, setViewMode] = useState('input'); // 'input' | 'processing' | 'review' | 'history'
  const [filterType, setFilterType] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  // Integration preview state
  const [showIntegrationPreview, setShowIntegrationPreview] = useState(false);
  const [integrationPreview, setIntegrationPreview] = useState(null);
  
  // History state
  const [extractionHistory, setExtractionHistory] = useState([]);
  const [extractionSessions, setExtractionSessions] = useState([]);
  const [historyStats, setHistoryStats] = useState(null);
  
  // Buzz words
  const [buzzWords, setBuzzWords] = useState([]);
  
  // Keyboard shortcuts
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(0);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Default buzz words for entity detection
  const defaultBuzzWords = [
    { id: 'bw_item', tag: '[item]', type: 'item', description: 'Items and equipment' },
    { id: 'bw_skill', tag: '[skill]', type: 'skill', description: 'Skills and abilities' },
    { id: 'bw_actor', tag: '[actor]', type: 'actor', description: 'Characters and NPCs' },
    { id: 'bw_stats', tag: '[stats]', type: 'stats', description: 'Stat changes (+10 STR)' },
    { id: 'bw_location', tag: '[location]', type: 'location', description: 'Places and locations' },
    { id: 'bw_event', tag: '[event]', type: 'event', description: 'Events and milestones' },
    { id: 'bw_relationship', tag: '[relationship]', type: 'relationship', description: 'Character relationships' },
    { id: 'bw_inventory', tag: '[inventory]', type: 'inventory', description: 'Inventory changes' },
    { id: 'bw_wiki', tag: '[wiki]', type: 'wiki', description: 'Lore and wiki entries' },
    { id: 'bw_plot', tag: '[plot]', type: 'plot', description: 'Plot points' }
  ];

  // Current session state
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [autoSaveInterval, setAutoSaveInterval] = useState(null);
  
  // Minimize/maximize state
  const [isMinimized, setIsMinimized] = useState(false);
  const [minimizedProgress, setMinimizedProgress] = useState(null);

  useEffect(() => {
    loadBuzzWords();
    loadHistory();
    loadDocuments();
    loadPersistedEntities(); // Load saved entities from previous session
    checkForResumableSessions(); // Check for sessions to resume
    checkMinimizedState(); // Check if component was minimized
    
    // Set default book if available
    if (books && Object.keys(books).length > 0) {
      const firstBook = Object.values(books)[0];
      setSelectedBook(firstBook.id);
      if (firstBook.chapters?.length > 0) {
        setSelectedChapter(firstBook.chapters[0].id);
      }
    }

    // Set up background processing listener
    if (currentSessionId) {
      const listener = (event) => {
        if (event.type === 'progress') {
          setProcessingProgress(event.data);
          setMinimizedProgress(event.data);
        } else if (event.type === 'complete') {
          setIsProcessing(false);
          setViewMode('review');
          setSuggestions(event.data.suggestions || []);
          toastService.success('Processing complete!');
        } else if (event.type === 'error') {
          setIsProcessing(false);
          toastService.error(`Processing failed: ${event.data.error}`);
        } else if (event.type === 'notification-clicked') {
          setIsMinimized(false);
        }
      };
      
      manuscriptProcessingService.addEventListener(currentSessionId, listener);
      
      return () => {
        manuscriptProcessingService.removeEventListener(currentSessionId, listener);
        if (autoSaveInterval) {
          clearInterval(autoSaveInterval);
        }
      };
    } else {
      // Cleanup auto-save on unmount
      return () => {
        if (autoSaveInterval) {
          clearInterval(autoSaveInterval);
        }
      };
    }
  }, [books, currentSessionId]);
  
  /**
   * Check if component was minimized (from sessionStorage)
   */
  const checkMinimizedState = () => {
    try {
      const minimized = sessionStorage.getItem('manuscript_intelligence_minimized');
      if (minimized === 'true') {
        setIsMinimized(true);
        const progress = sessionStorage.getItem('manuscript_intelligence_progress');
        if (progress) {
          setMinimizedProgress(JSON.parse(progress));
        }
      }
    } catch (error) {
      console.warn('Error checking minimized state:', error);
    }
  };
  
  /**
   * Minimize component
   */
  const handleMinimize = () => {
    setIsMinimized(true);
    sessionStorage.setItem('manuscript_intelligence_minimized', 'true');
    if (processingProgress.current > 0) {
      sessionStorage.setItem('manuscript_intelligence_progress', JSON.stringify(processingProgress));
      setMinimizedProgress(processingProgress);
    }
  };
  
  /**
   * Maximize/restore component
   */
  const handleMaximize = () => {
    setIsMinimized(false);
    sessionStorage.removeItem('manuscript_intelligence_minimized');
    sessionStorage.removeItem('manuscript_intelligence_progress');
    setMinimizedProgress(null);
  };
  
  /**
   * Handle close - only allow if not processing
   */
  const handleClose = () => {
    if (isProcessing) {
      // Don't allow close during processing - minimize instead
      handleMinimize();
      toastService.info('Processing in background. Click the notification to restore.');
    } else {
      // Clear minimized state
      sessionStorage.removeItem('manuscript_intelligence_minimized');
      sessionStorage.removeItem('manuscript_intelligence_progress');
      if (onClose) {
        onClose();
      }
    }
  };

  /**
   * Check for resumable sessions
   */
  const checkForResumableSessions = async () => {
    try {
      const manuscriptIntelligenceService = (await import('../services/manuscriptIntelligenceService')).default;
      const activeSessions = await manuscriptIntelligenceService.getActiveSessions();
      if (activeSessions.length > 0) {
        setAvailableSessions(activeSessions);
        setShowResumeDialog(true);
      }
    } catch (error) {
      console.warn('Error checking for resumable sessions:', error);
    }
  };

  /**
   * Resume a session
   */
  const resumeSession = async (sessionId) => {
    try {
      const manuscriptIntelligenceService = (await import('../services/manuscriptIntelligenceService')).default;
      const sessionData = await manuscriptIntelligenceService.resumeSession(sessionId);
      
      setCurrentSessionId(sessionId);
      setSuggestions(sessionData.suggestions || []);
      setSelectedActions(sessionData.appliedActions || {});
      setEditableSuggestions(sessionData.wizardState?.editableSuggestions || {});
      setPendingSuggestions(sessionData.wizardState?.pendingSuggestions || []);
      setManualEntries(sessionData.wizardState?.manualEntries || []);
      
      if (sessionData.wizardState?.selectedBook) {
        setSelectedBook(sessionData.wizardState.selectedBook);
      }
      if (sessionData.wizardState?.selectedChapter) {
        setSelectedChapter(sessionData.wizardState.selectedChapter);
      }
      if (sessionData.wizardState?.chapterMode) {
        setChapterMode(sessionData.wizardState.chapterMode);
      }
      if (sessionData.wizardState?.viewMode) {
        setViewMode(sessionData.wizardState.viewMode);
      }
      if (sessionData.wizardState?.filterType) {
        setFilterType(sessionData.wizardState.filterType);
      }
      if (sessionData.wizardState?.filterConfidence !== undefined) {
        setFilterConfidence(sessionData.wizardState.filterConfidence);
      }

      setShowResumeDialog(false);
      toastService.success(`Resumed session from ${new Date(sessionData.session.timestamp).toLocaleString()}`);
      
      // Start auto-save
      startAutoSave(sessionId);
    } catch (error) {
      console.error('Error resuming session:', error);
      toastService.error('Failed to resume session: ' + error.message);
    }
  };

  /**
   * Start auto-save interval
   */
  const startAutoSave = (sessionId) => {
    // Clear existing interval
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
    }

    // Set up auto-save every 30 seconds
    const interval = setInterval(async () => {
      await saveWizardStateToDatabase(sessionId);
    }, 30000);

    setAutoSaveInterval(interval);
  };

  /**
   * Save wizard state to database
   */
  const saveWizardStateToDatabase = async (sessionId) => {
    if (!sessionId) return;

    try {
      const manuscriptIntelligenceService = (await import('../services/manuscriptIntelligenceService')).default;
      const extractionHistoryService = (await import('../services/extractionHistoryService')).default;

      const wizardState = {
        suggestions,
        pendingSuggestions,
        manualEntries,
        selectedActions,
        editableSuggestions,
        selectedBook,
        selectedChapter,
        chapterMode,
        viewMode,
        filterType,
        filterConfidence
      };

      await manuscriptIntelligenceService.saveWizardState(sessionId, wizardState);
      await extractionHistoryService.saveWizardState(sessionId, wizardState);
      await extractionHistoryService.saveSuggestions(sessionId, suggestions);
      await extractionHistoryService.saveReviewStatus(sessionId, {
        reviewed: Object.keys(selectedActions).length,
        total: suggestions.length
      });
    } catch (error) {
      console.warn('Error auto-saving wizard state:', error);
    }
  };

  // Persist entities to localStorage whenever they change
  useEffect(() => {
    if (suggestions.length > 0 || pendingSuggestions.length > 0 || manualEntries.length > 0) {
      persistEntities();
    }
  }, [suggestions, pendingSuggestions, manualEntries]);

  // Load persisted entities from localStorage
  const loadPersistedEntities = () => {
    try {
      const saved = localStorage.getItem('manuscript_intelligence_entities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.suggestions && parsed.suggestions.length > 0) {
          setSuggestions(parsed.suggestions);
          setPendingSuggestions(parsed.pendingSuggestions || []);
          setManualEntries(parsed.manualEntries || []);
          setSelectedActions(parsed.selectedActions || {});
          setEditableSuggestions(parsed.editableSuggestions || {});
          setSelectedBook(parsed.selectedBook);
          setSelectedChapter(parsed.selectedChapter);
          setChapterMode(parsed.chapterMode || 'existing');
          if (parsed.suggestions.length > 0) {
            setViewMode('review');
            toastService.info(`Loaded ${parsed.suggestions.length} saved entities from previous session`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading persisted entities:', error);
    }
  };

  // Persist entities to localStorage
  const persistEntities = () => {
    try {
      const toSave = {
        suggestions,
        pendingSuggestions,
        manualEntries,
        selectedActions,
        editableSuggestions,
        selectedBook,
        selectedChapter,
        chapterMode,
        timestamp: Date.now()
      };
      localStorage.setItem('manuscript_intelligence_entities', JSON.stringify(toSave));
    } catch (error) {
      console.error('Error persisting entities:', error);
    }
  };

  // Clear persisted entities
  const clearPersistedEntities = () => {
    localStorage.removeItem('manuscript_intelligence_entities');
    setSuggestions([]);
    setPendingSuggestions([]);
    setManualEntries([]);
    setSelectedActions({});
    setEditableSuggestions({});
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts in review mode
      if (viewMode !== 'review') return;

      // Filter suggestions inline to avoid dependency issues
      const filteredSuggs = suggestions.filter(s => {
        const typeMatch = filterType === 'all' || s.type === filterType;
        const confidenceMatch = s.confidence >= filterConfidence;
        return typeMatch && confidenceMatch;
      });
      if (filteredSuggs.length === 0) return;

      const currentSugg = filteredSuggs[focusedSuggestionIndex];

      // Arrow keys for navigation
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocusedSuggestionIndex(prev => Math.min(prev + 1, filteredSuggs.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocusedSuggestionIndex(prev => Math.max(prev - 1, 0));
      }

      // A/B/C/D for action selection
      if (currentSugg && ['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const actionId = e.key.toUpperCase();
        const hasAction = currentSugg.actionOptions?.some(opt => opt.id === actionId);
        if (hasAction) {
          handleActionSelect(currentSugg.id, actionId);
          // Auto-advance to next suggestion
          if (focusedSuggestionIndex < filteredSuggs.length - 1) {
            setFocusedSuggestionIndex(prev => prev + 1);
          }
        }
      }

      // Enter to apply selected actions
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        applySelectedActions();
      }

      // Escape to go back
      if (e.key === 'Escape') {
        if (showChapterModal) {
          setShowChapterModal(false);
        } else if (viewMode === 'review') {
          setViewMode('input');
          setSuggestions([]);
          setSelectedActions({});
        } else if (viewMode === 'history') {
          setViewMode('input');
        }
      }

      // H for accept all high confidence
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
        selectAllHighConfidence();
      }
      
      // ? for help
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, focusedSuggestionIndex, suggestions, filterType, filterConfidence, showChapterModal]);

  const loadBuzzWords = async () => {
    try {
      const stored = await db.getAll('buzzWords');
      if (stored.length > 0) {
        setBuzzWords(stored);
      } else {
        setBuzzWords(defaultBuzzWords);
        for (const bw of defaultBuzzWords) {
          await db.add('buzzWords', bw);
        }
      }
    } catch (error) {
      console.error('Error loading buzz words:', error);
      setBuzzWords(defaultBuzzWords);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await extractionHistoryService.getHistory({ limit: 100 });
      setExtractionHistory(history);
      
      const sessions = await extractionHistoryService.getSessions(20);
      setExtractionSessions(sessions);
      
      const stats = await extractionHistoryService.getStats();
      setHistoryStats(stats);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await documentService.getAllDocuments();
      setUploadedDocuments(docs.sort((a, b) => b.uploadedAt - a.uploadedAt));
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  // File upload handler
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // Show progress for large files
          if (file.size > 5 * 1024 * 1024) { // > 5MB
            toastService.info(`Processing ${file.name}... This may take a moment for large files.`);
          }
          
          const parsedData = await documentService.parseFile(file);
          const document = await documentService.saveDocument(file, parsedData);
          setUploadedDocuments(prev => [document, ...prev]);
          
          toastService.success(`${file.name} uploaded successfully`);
        } catch (fileError) {
          console.error(`Upload error for ${file.name}:`, fileError);
          toastService.error(`${file.name} failed: ${fileError.message}`);
          // Continue with other files
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toastService.error(`Upload failed: ${error.message}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Process text (from paste or selected document)
  const handleProcess = () => {
    const textToProcess = inputMode === 'paste' ? inputText : selectedDocument?.text;
    
    if (!textToProcess || textToProcess.trim().length === 0) {
      toastService.error('Please enter or select text to process');
      return;
    }
    
    // Show chapter selection modal
    setShowChapterModal(true);
  };

  // Start processing after chapter selection
  const startProcessing = async () => {
    setShowChapterModal(false);
    
    const textToProcess = inputMode === 'paste' ? inputText : selectedDocument?.text;
    
    if (!textToProcess) {
      toastService.error('No text to process');
      return;
    }

    setIsProcessing(true);
    setViewMode('processing');
    setProcessingProgress({ current: 0, status: 'Initializing AI analysis...', liveSuggestions: [] });

    try {
      // Start extraction session
      const chapterId = chapterMode === 'worldbuilding' ? 'worldbuilding' : selectedChapter;
      const session = await extractionHistoryService.startSession(
        chapterId,
        inputMode === 'paste' ? 'text' : 'file',
        inputMode === 'paste' ? 'Pasted Text' : selectedDocument?.filename
      );

      setCurrentSessionId(session.id);
      
      // Save document text to session
      await extractionHistoryService.saveDocumentText(session.id, textToProcess);
      
      // Start auto-save
      startAutoSave(session.id);

      // Start background processing
      await manuscriptProcessingService.startBackgroundProcessing(
        session.id,
        textToProcess,
        worldState,
        {
          buzzWords,
          onProgress: (progress) => {
            setProcessingProgress(progress);
            setMinimizedProgress(progress);
            // Update sessionStorage for minimized state
            if (isMinimized) {
              sessionStorage.setItem('manuscript_intelligence_progress', JSON.stringify(progress));
            }
          },
          useCompleteDocument: false
        }
      );

      // Set up listener for background processing events
      const listener = (event) => {
        if (event.type === 'progress') {
          setProcessingProgress(event.data);
          setMinimizedProgress(event.data);
          if (isMinimized) {
            sessionStorage.setItem('manuscript_intelligence_progress', JSON.stringify(event.data));
          }
        } else if (event.type === 'complete') {
          setIsProcessing(false);
          const processed = event.data.suggestions || [];
          
          // Post-process suggestions
          enhanceSuggestions(processed).then(finalProcessed => {
            // Add chapter context
            const finalSuggestions = finalProcessed.map(sugg => ({
              ...sugg,
              chapterId: chapterMode === 'worldbuilding' ? null : selectedChapter,
              bookId: selectedBook,
              chapterMode,
              ...(sugg.type === 'plot' || sugg.type === 'event' ? {
                bookId: selectedBook,
                bookTitle: getBook(selectedBook)?.title || null
              } : {})
            }));

            setSuggestions([...pendingSuggestions, ...finalSuggestions]);
            setPendingSuggestions([]);
            setViewMode('review');
            toastService.success(`Found ${finalSuggestions.length} suggestions for review`);
          });
        } else if (event.type === 'error') {
          setIsProcessing(false);
          toastService.error(`Processing failed: ${event.data.error}`);
          setViewMode('input');
        }
      };
      
      manuscriptProcessingService.addEventListener(session.id, listener);
      
    } catch (error) {
      console.error('Processing error:', error);
      toastService.error(`Processing failed: ${error.message}`);
      setIsProcessing(false);
      setViewMode('input');
    }
  };

  // Enhanced duplicate detection and suggestion processing
  const enhanceSuggestions = async (suggestions) => {
    const enhanced = [];

    for (const sugg of suggestions) {
      const enhancedSugg = { ...sugg };

      // Check for duplicates based on entity type
      if (sugg.type === 'item' && sugg.data?.name) {
        const duplicate = findSimilarEntity(sugg.data.name, worldState.itemBank || [], 'name');
        if (duplicate) {
          enhancedSugg.duplicateWarning = {
            type: 'item',
            id: duplicate.entity.id,
            name: duplicate.entity.name,
            similarity: duplicate.similarity
          };
          // Add merge option to action options
          enhancedSugg.actionOptions = [
            { id: 'A', label: `Merge with existing "${duplicate.entity.name}"`, action: 'merge' },
            { id: 'B', label: 'Create as new item', action: 'add_only' },
            { id: 'C', label: 'Add to actor inventory', action: 'add_and_link' },
            { id: 'D', label: 'Skip', action: 'skip' }
          ];
        }
      }

      if (sugg.type === 'actor' && sugg.data?.name) {
        const duplicate = findSimilarEntity(sugg.data.name, worldState.actors || [], 'name');
        if (duplicate) {
          enhancedSugg.duplicateWarning = {
            type: 'actor',
            id: duplicate.entity.id,
            name: duplicate.entity.name,
            similarity: duplicate.similarity
          };
          enhancedSugg.actionOptions = [
            { id: 'A', label: `Update existing "${duplicate.entity.name}"`, action: 'merge' },
            { id: 'B', label: 'Create as new actor', action: 'add' },
            { id: 'C', label: 'Skip', action: 'skip' }
          ];
        }
      }

      if (sugg.type === 'skill' && sugg.data?.name) {
        const duplicate = findSimilarEntity(sugg.data.name, worldState.skillBank || [], 'name');
        if (duplicate) {
          enhancedSugg.duplicateWarning = {
            type: 'skill',
            id: duplicate.entity.id,
            name: duplicate.entity.name,
            similarity: duplicate.similarity
          };
          enhancedSugg.actionOptions = [
            { id: 'A', label: `Update existing "${duplicate.entity.name}"`, action: 'merge' },
            { id: 'B', label: 'Create as new skill', action: 'add_only' },
            { id: 'C', label: 'Assign to actor', action: 'add_and_assign' },
            { id: 'D', label: 'Skip', action: 'skip' }
          ];
        }
      }

      // Infer missing details
      if (sugg.type === 'actor' && sugg.data) {
        enhancedSugg.data = inferActorDetails(sugg.data);
      }

      if (sugg.type === 'item' && sugg.data) {
        enhancedSugg.data = inferItemDetails(sugg.data);
      }

      enhanced.push(enhancedSugg);
    }

    return enhanced;
  };

  // Fuzzy matching for duplicates
  const findSimilarEntity = (name, entities, nameField = 'name') => {
    if (!name || !entities || entities.length === 0) return null;

    const normalizedName = name.toLowerCase().trim();
    
    for (const entity of entities) {
      const entityName = (entity[nameField] || '').toLowerCase().trim();
      
      // Exact match
      if (entityName === normalizedName) {
        return { entity, similarity: 1.0 };
      }
      
      // Calculate Levenshtein similarity
      const similarity = calculateSimilarity(normalizedName, entityName);
      if (similarity >= 0.8) {
        return { entity, similarity };
      }
    }
    
    return null;
  };

  // Levenshtein distance-based similarity
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Infer missing actor details
  const inferActorDetails = (data) => {
    const inferred = { ...data };
    
    // Default stats based on role/class
    if (!inferred.stats || Object.keys(inferred.stats).length === 0) {
      const roleStats = {
        'warrior': { STR: 15, VIT: 12, INT: 8, DEX: 10 },
        'mage': { STR: 6, VIT: 8, INT: 16, DEX: 10 },
        'rogue': { STR: 10, VIT: 8, INT: 10, DEX: 16 },
        'healer': { STR: 6, VIT: 10, INT: 14, DEX: 10 },
        'tank': { STR: 14, VIT: 16, INT: 6, DEX: 8 },
        'default': { STR: 10, VIT: 10, INT: 10, DEX: 10 }
      };
      
      const classLower = (inferred.class || '').toLowerCase();
      inferred.stats = roleStats[classLower] || roleStats['default'];
    }
    
    // Default role
    if (!inferred.role) {
      inferred.role = 'NPC';
    }
    
    return inferred;
  };

  // Infer missing item details
  const inferItemDetails = (data) => {
    const inferred = { ...data };
    
    // Infer rarity from name or description
    if (!inferred.rarity) {
      const nameLower = (inferred.name || '').toLowerCase();
      const descLower = (inferred.description || '').toLowerCase();
      const combined = nameLower + ' ' + descLower;
      
      if (combined.includes('legendary') || combined.includes('ancient') || combined.includes('mythic')) {
        inferred.rarity = 'Legendary';
      } else if (combined.includes('epic') || combined.includes('powerful')) {
        inferred.rarity = 'Epic';
      } else if (combined.includes('rare') || combined.includes('unusual')) {
        inferred.rarity = 'Rare';
      } else if (combined.includes('uncommon') || combined.includes('quality')) {
        inferred.rarity = 'Uncommon';
      } else {
        inferred.rarity = 'Common';
      }
    }
    
    // Infer type from name
    if (!inferred.type) {
      const nameLower = (inferred.name || '').toLowerCase();
      
      if (nameLower.includes('sword') || nameLower.includes('blade') || nameLower.includes('axe')) {
        inferred.type = 'Weapon';
      } else if (nameLower.includes('armor') || nameLower.includes('helm') || nameLower.includes('shield')) {
        inferred.type = 'Armor';
      } else if (nameLower.includes('ring') || nameLower.includes('amulet') || nameLower.includes('necklace')) {
        inferred.type = 'Accessory';
      } else if (nameLower.includes('potion') || nameLower.includes('scroll') || nameLower.includes('tome')) {
        inferred.type = 'Consumable';
      } else {
        inferred.type = 'Artifact';
      }
    }
    
    return inferred;
  };

  // Handle action selection for a suggestion
  const handleActionSelect = (suggestionId, actionId) => {
    setSelectedActions(prev => ({
      ...prev,
      [suggestionId]: actionId
    }));
  };

  // Handle editing suggestion data before approval
  const handleEditSuggestion = (suggestionId, field, value) => {
    setEditableSuggestions(prev => ({
      ...prev,
      [suggestionId]: {
        ...(prev[suggestionId] || {}),
        [field]: value
      }
    }));
  };

  // Add manual entry
  const handleAddManualEntry = () => {
    const newEntry = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'manual',
      isManual: true,
      data: {
        name: '',
        description: '',
        type: 'item' // Default, user can change
      },
      sourceContext: 'Manual entry',
      confidence: 1.0,
      actionOptions: [
        { id: 'A', label: 'Create entity', action: 'create' },
        { id: 'B', label: 'Skip', action: 'skip' }
      ],
      chapterId: chapterMode === 'worldbuilding' ? null : selectedChapter,
      bookId: selectedBook,
      chapterMode,
      timestamp: Date.now()
    };
    
    setManualEntries(prev => [...prev, newEntry]);
    setSuggestions(prev => [...prev, newEntry]);
    toastService.info('Manual entry added. Edit it below.');
  };

  // Save pasted text as story context document
  const saveAsStoryContext = async () => {
    if (!inputText || inputText.trim().length === 0) {
      toastService.error('No text to save');
      return;
    }

    try {
      const document = await documentService.saveDocument(
        new File([inputText], 'story-context.txt', { type: 'text/plain' }),
        { text: inputText }
      );
      
      setUploadedDocuments(prev => [document, ...prev]);
      toastService.success('Text saved as story context document');
    } catch (error) {
      console.error('Error saving story context:', error);
      toastService.error('Failed to save story context: ' + error.message);
    }
  };

  // Show integration preview before applying actions
  const showIntegrationPreviewModal = async () => {
    const toApply = suggestions.filter(s => selectedActions[s.id] && selectedActions[s.id] !== 'D');
    
    if (toApply.length === 0) {
      toastService.warn('No actions selected');
      return;
    }

    try {
      // Prepare extractions with edited data
      const extractionsForPreview = toApply.map(sugg => {
        const editedData = editableSuggestions[sugg.id];
        return {
          ...sugg,
          data: editedData ? { ...sugg.data, ...editedData } : sugg.data
        };
      });

      // Generate integration preview
      const chapterId = selectedChapter || extractionsForPreview[0]?.chapterId;
      const bookId = selectedBook || extractionsForPreview[0]?.bookId;
      
      const preview = await integrationService.generatePreview(
        extractionsForPreview,
        chapterId,
        bookId
      );

      setIntegrationPreview(preview);
      setShowIntegrationPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toastService.error('Failed to generate integration preview');
    }
  };

  // Toggle plot thread approval in preview
  const handleTogglePlotThread = (index) => {
    if (!integrationPreview?.suggestedPlotThreads) return;
    
    setIntegrationPreview(prev => ({
      ...prev,
      suggestedPlotThreads: prev.suggestedPlotThreads.map((thread, i) =>
        i === index ? { ...thread, approved: !thread.approved } : thread
      )
    }));
  };

  // Apply all integrations after preview confirmation
  const handleApplyIntegrations = async (options) => {
    setShowIntegrationPreview(false);

    const toApply = suggestions.filter(s => selectedActions[s.id] && selectedActions[s.id] !== 'D');
    let applied = 0;
    let failed = 0;

    // First apply the basic entity actions
    for (const sugg of toApply) {
      try {
        const actionId = selectedActions[sugg.id];
        const action = sugg.actionOptions?.find(opt => opt.id === actionId);
        const editedData = editableSuggestions[sugg.id];
        
        if (!action || action.action === 'skip') continue;

        // Merge edited data with original
        const finalData = editedData ? { ...sugg.data, ...editedData } : sugg.data;

        const result = await applySuggestionAction(sugg, action, finalData);
        
        if (result) {
          applied++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Error applying action:', error);
        failed++;
      }
    }

    // Then apply all integration updates (timeline, wiki, map, mind map, etc.)
    if (integrationPreview) {
      try {
        const integrationResult = await integrationService.applyAllIntegrations(integrationPreview, options);
        
        if (integrationResult.success?.length > 0) {
          toastService.info(`Updated ${integrationResult.success.length} entries across systems`);
        }
        if (integrationResult.failed?.length > 0) {
          console.warn('Some integrations failed:', integrationResult.failed);
        }
      } catch (error) {
        console.error('Error applying integrations:', error);
      }
    }

    // End session
    await extractionHistoryService.endSession();
    
    // Reload history
    await loadHistory();

    if (applied > 0) {
      toastService.success(`Applied ${applied} suggestion${applied !== 1 ? 's' : ''}`);
    }
    if (failed > 0) {
      toastService.error(`${failed} suggestion${failed !== 1 ? 's' : ''} failed to apply`);
    }

    // Move applied suggestions to applied list, keep unapplied in pending
    const appliedIds = toApply.map(s => s.id);
    const unapplied = suggestions.filter(s => !appliedIds.includes(s.id) && selectedActions[s.id] !== 'D');
    
    setAppliedSuggestions(prev => [...prev, ...toApply]);
    setPendingSuggestions(prev => [...prev, ...unapplied]);
    setSuggestions(prev => prev.filter(s => appliedIds.includes(s.id) && selectedActions[s.id] !== 'D'));
    setSelectedActions({});
    setEditableSuggestions({});
    setIntegrationPreview(null);
    
    if (unapplied.length > 0) {
      toastService.info(`${unapplied.length} suggestions moved to pending area for later review`);
    }

    if (onApplySuggestions) {
      onApplySuggestions(toApply);
    }
    
    if (onWorldStateUpdate) {
      onWorldStateUpdate();
    }
  };

  // Legacy apply selected actions (direct without preview)
  const applySelectedActions = async () => {
    // Use integration preview for full integration
    await showIntegrationPreviewModal();
  };

  // Apply a single suggestion action
  const applySuggestionAction = async (suggestion, action, finalData) => {
    const { type, chapterId, bookId } = suggestion;
    
    try {
      switch (type) {
        case 'item': {
          if (action.action === 'merge' && suggestion.duplicateWarning) {
            // Merge with existing item
            const existingItem = worldState.itemBank?.find(i => i.id === suggestion.duplicateWarning.id);
            if (existingItem) {
              const previousState = { ...existingItem };
              
              // Merge stats
              if (finalData.stats) {
                Object.entries(finalData.stats).forEach(([stat, value]) => {
                  existingItem.stats = existingItem.stats || {};
                  existingItem.stats[stat] = (existingItem.stats[stat] || 0) + (value || 0);
                  existingItem.statMod = existingItem.statMod || {};
                  existingItem.statMod[stat] = (existingItem.statMod[stat] || 0) + (value || 0);
                });
              }
              
              existingItem.desc = finalData.description || finalData.desc || existingItem.desc;
              
              await db.update('itemBank', existingItem);
              
              await extractionHistoryService.recordExtraction({
                entityType: 'item',
                action: 'merge',
                entityId: existingItem.id,
                entityName: existingItem.name,
                previousState,
                newState: existingItem,
                chapterId,
                sourceContext: suggestion.sourceContext,
                confidence: suggestion.confidence
              });
              
              if (onWorldStateUpdate) {
                onWorldStateUpdate(prev => ({
                  ...prev,
                  itemBank: prev.itemBank.map(i => i.id === existingItem.id ? existingItem : i)
                }));
              }
              
              return true;
            }
          }
          
          // Create new item
          const newItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: finalData.name,
            type: finalData.type || 'Artifact',
            desc: finalData.description || finalData.desc || '',
            stats: finalData.stats || {},
            statMod: finalData.stats || {},
            grantsSkills: [],
            quests: '',
            debuffs: '',
            rarity: finalData.rarity || 'Common',
            baseType: finalData.type || 'Artifact'
          };
          
          await db.add('itemBank', newItem);
          
          await extractionHistoryService.recordExtraction({
            entityType: 'item',
            action: 'create',
            entityId: newItem.id,
            entityName: newItem.name,
            previousState: null,
            newState: newItem,
            chapterId,
            sourceContext: suggestion.sourceContext,
            confidence: suggestion.confidence
          });
          
          if (onWorldStateUpdate) {
            onWorldStateUpdate(prev => ({
              ...prev,
              itemBank: [...prev.itemBank, newItem]
            }));
          }
          
          // If add_and_link, add to character inventory
          if (action.action === 'add_and_link' && finalData.characterName) {
            const actor = worldState.actors?.find(a => 
              a.name.toLowerCase() === finalData.characterName.toLowerCase()
            );
            if (actor) {
              const prevActor = { ...actor };
              actor.inventory = [...(actor.inventory || []), newItem.id];
              await db.update('actors', actor);
              
              await extractionHistoryService.recordExtraction({
                entityType: 'item',
                action: 'inventory_add',
                entityId: newItem.id,
                entityName: newItem.name,
                targetActorId: actor.id,
                targetActorName: actor.name,
                previousState: prevActor,
                newState: actor,
                chapterId,
                sourceContext: suggestion.sourceContext
              });
              
              if (onWorldStateUpdate) {
                onWorldStateUpdate(prev => ({
                  ...prev,
                  actors: prev.actors.map(a => a.id === actor.id ? actor : a)
                }));
              }
            }
          }
          
          return true;
        }

        case 'skill': {
          if (action.action === 'merge' && suggestion.duplicateWarning) {
            const existingSkill = worldState.skillBank?.find(s => s.id === suggestion.duplicateWarning.id);
            if (existingSkill) {
              const previousState = { ...existingSkill };
              
              if (finalData.statMod) {
                Object.entries(finalData.statMod).forEach(([stat, value]) => {
                  existingSkill.statMod = existingSkill.statMod || {};
                  existingSkill.statMod[stat] = (existingSkill.statMod[stat] || 0) + (value || 0);
                });
              }
              
              existingSkill.desc = finalData.description || finalData.desc || existingSkill.desc;
              
              await db.update('skillBank', existingSkill);
              
              await extractionHistoryService.recordExtraction({
                entityType: 'skill',
                action: 'merge',
                entityId: existingSkill.id,
                entityName: existingSkill.name,
                previousState,
                newState: existingSkill,
                chapterId,
                sourceContext: suggestion.sourceContext,
                confidence: suggestion.confidence
              });
              
              if (onWorldStateUpdate) {
                onWorldStateUpdate(prev => ({
                  ...prev,
                  skillBank: prev.skillBank.map(s => s.id === existingSkill.id ? existingSkill : s)
                }));
              }
              
              return true;
            }
          }
          
          // Create new skill
          const newSkill = {
            id: `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: finalData.name,
            type: finalData.type || 'Combat',
            desc: finalData.description || finalData.desc || '',
            statMod: finalData.statMod || {},
            defaultVal: 1,
            tier: finalData.tier || 1,
            prerequisites: finalData.prerequisites || {}
          };
          
          await db.add('skillBank', newSkill);
          
          await extractionHistoryService.recordExtraction({
            entityType: 'skill',
            action: 'create',
            entityId: newSkill.id,
            entityName: newSkill.name,
            previousState: null,
            newState: newSkill,
            chapterId,
            sourceContext: suggestion.sourceContext,
            confidence: suggestion.confidence
          });
          
          if (onWorldStateUpdate) {
            onWorldStateUpdate(prev => ({
              ...prev,
              skillBank: [...prev.skillBank, newSkill]
            }));
          }
          
          // If add_and_assign, assign to character
          if (action.action === 'add_and_assign' && finalData.characterName) {
            const actor = worldState.actors?.find(a => 
              a.name.toLowerCase() === finalData.characterName.toLowerCase()
            );
            if (actor) {
              const prevActor = { ...actor };
              actor.activeSkills = [...(actor.activeSkills || []), newSkill.id];
              await db.update('actors', actor);
              
              await extractionHistoryService.recordExtraction({
                entityType: 'skill',
                action: 'skill_assign',
                entityId: newSkill.id,
                entityName: newSkill.name,
                targetActorId: actor.id,
                targetActorName: actor.name,
                previousState: prevActor,
                newState: actor,
                chapterId,
                sourceContext: suggestion.sourceContext
              });
              
              if (onWorldStateUpdate) {
                onWorldStateUpdate(prev => ({
                  ...prev,
                  actors: prev.actors.map(a => a.id === actor.id ? actor : a)
                }));
              }
            }
          }
          
          return true;
        }

        case 'actor': {
          if (action.action === 'merge' && suggestion.duplicateWarning) {
            const existingActor = worldState.actors?.find(a => a.id === suggestion.duplicateWarning.id);
            if (existingActor) {
              const previousState = { ...existingActor };
              
              // Merge stats
              if (finalData.stats) {
                Object.entries(finalData.stats).forEach(([stat, value]) => {
                  existingActor.baseStats = existingActor.baseStats || {};
                  existingActor.baseStats[stat] = (existingActor.baseStats[stat] || 0) + (value || 0);
                });
              }
              
              existingActor.desc = finalData.description || finalData.desc || existingActor.desc;
              
              await db.update('actors', existingActor);
              
              await extractionHistoryService.recordExtraction({
                entityType: 'actor',
                action: 'merge',
                entityId: existingActor.id,
                entityName: existingActor.name,
                previousState,
                newState: existingActor,
                chapterId,
                sourceContext: suggestion.sourceContext,
                confidence: suggestion.confidence
              });
              
              if (onWorldStateUpdate) {
                onWorldStateUpdate(prev => ({
                  ...prev,
                  actors: prev.actors.map(a => a.id === existingActor.id ? existingActor : a)
                }));
              }
              
              return true;
            }
          }
          
          // Create new actor
          const newActor = {
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: finalData.name,
            role: finalData.role || 'NPC',
            class: finalData.class || 'Unknown',
            desc: finalData.description || finalData.desc || '',
            isFav: false,
            baseStats: finalData.stats || { STR: 10, VIT: 10, INT: 10, DEX: 10 },
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
            previousState: null,
            newState: newActor,
            chapterId,
            sourceContext: suggestion.sourceContext,
            confidence: suggestion.confidence
          });
          
          if (onWorldStateUpdate) {
            onWorldStateUpdate(prev => ({
              ...prev,
              actors: [...prev.actors, newActor]
            }));
          }
          
          return true;
        }

        case 'stat_change':
        case 'actor-update': {
          const actorName = finalData.actorName || finalData.characterName;
          const actor = worldState.actors?.find(a => 
            a.name.toLowerCase() === actorName?.toLowerCase()
          );
          
          if (actor) {
            const previousState = { 
              baseStats: { ...actor.baseStats },
              additionalStats: { ...actor.additionalStats }
            };
            
            // Apply stat changes
            if (finalData.changes?.stats || finalData.stats) {
              const statChanges = finalData.changes?.stats || finalData.stats;
              Object.entries(statChanges).forEach(([stat, change]) => {
                const value = typeof change === 'number' ? change : parseInt(change) || 0;
                actor.baseStats = actor.baseStats || {};
                actor.baseStats[stat] = (actor.baseStats[stat] || 0) + value;
              });
            }
            
            // Apply inventory changes
            if (finalData.changes?.items) {
              for (const itemName of finalData.changes.items) {
                const item = worldState.itemBank?.find(i => 
                  i.name.toLowerCase() === itemName.toLowerCase()
                );
                if (item && !actor.inventory?.includes(item.id)) {
                  actor.inventory = [...(actor.inventory || []), item.id];
                }
              }
            }
            
            // Apply skill changes
            if (finalData.changes?.skills) {
              for (const skillName of finalData.changes.skills) {
                const skill = worldState.skillBank?.find(s => 
                  s.name.toLowerCase() === skillName.toLowerCase()
                );
                if (skill && !actor.activeSkills?.includes(skill.id)) {
                  actor.activeSkills = [...(actor.activeSkills || []), skill.id];
                }
              }
            }
            
            await db.update('actors', actor);
            
            await extractionHistoryService.recordExtraction({
              entityType: 'actor',
              action: 'stat_change',
              entityId: actor.id,
              entityName: actor.name,
              targetActorId: actor.id,
              targetActorName: actor.name,
              previousState,
              newState: { baseStats: actor.baseStats, additionalStats: actor.additionalStats },
              chapterId,
              sourceContext: suggestion.sourceContext,
              confidence: suggestion.confidence
            });
            
            if (onWorldStateUpdate) {
              onWorldStateUpdate(prev => ({
                ...prev,
                actors: prev.actors.map(a => a.id === actor.id ? actor : a)
              }));
            }
            
            return true;
          }
          return false;
        }

        case 'relationship': {
          const actor1 = worldState.actors?.find(a => 
            a.name.toLowerCase() === finalData.actor1Name?.toLowerCase()
          );
          const actor2 = worldState.actors?.find(a => 
            a.name.toLowerCase() === finalData.actor2Name?.toLowerCase()
          );
          
          if (actor1 && actor2) {
            const newRelationship = {
              id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              actors: [actor1.id, actor2.id],
              type: finalData.type || 'neutral',
              strength: finalData.strength || 0.5,
              description: finalData.description || '',
              events: finalData.events || []
            };
            
            await db.add('relationships', newRelationship);
            
            await extractionHistoryService.recordExtraction({
              entityType: 'relationship',
              action: 'create',
              entityId: newRelationship.id,
              entityName: `${actor1.name} - ${actor2.name}`,
              previousState: null,
              newState: newRelationship,
              chapterId,
              sourceContext: suggestion.sourceContext,
              confidence: suggestion.confidence
            });
            
            if (onWorldStateUpdate) {
              onWorldStateUpdate(prev => ({
                ...prev,
                relationships: [...(prev.relationships || []), newRelationship]
              }));
            }
            
            return true;
          }
          return false;
        }

        case 'location': {
          // Create wiki entry for location
          const wikiEntry = {
            id: `wiki_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            entityType: 'location',
            title: finalData.name,
            content: finalData.description || '',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          await db.add('wikiEntries', wikiEntry);
          
          await extractionHistoryService.recordExtraction({
            entityType: 'location',
            action: 'create',
            entityId: wikiEntry.id,
            entityName: finalData.name,
            previousState: null,
            newState: wikiEntry,
            chapterId,
            sourceContext: suggestion.sourceContext,
            confidence: suggestion.confidence
          });
          
          return true;
        }

        case 'event': {
          // Create wiki entry for event
          const wikiEntry = {
            id: `wiki_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            entityType: 'event',
            title: finalData.name || finalData.title,
            content: finalData.description || '',
            participants: finalData.participants || [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          await db.add('wikiEntries', wikiEntry);
          
          await extractionHistoryService.recordExtraction({
            entityType: 'event',
            action: 'create',
            entityId: wikiEntry.id,
            entityName: finalData.name || finalData.title,
            previousState: null,
            newState: wikiEntry,
            chapterId,
            sourceContext: suggestion.sourceContext,
            confidence: suggestion.confidence
          });
          
          return true;
        }

        case 'inventory': {
          // Handle inventory change (pickup/drop)
          const actor = worldState.actors?.find(a => 
            a.name.toLowerCase() === finalData.actorName?.toLowerCase()
          );
          
          if (actor && finalData.itemName) {
            const item = worldState.itemBank?.find(i => 
              i.name.toLowerCase() === finalData.itemName.toLowerCase()
            );
            
            if (item) {
              const prevActor = { ...actor, inventory: [...(actor.inventory || [])] };
              
              if (finalData.action === 'pickup' || finalData.action === 'gained') {
                if (!actor.inventory?.includes(item.id)) {
                  actor.inventory = [...(actor.inventory || []), item.id];
                }
                
                await db.update('actors', actor);
                
                await extractionHistoryService.recordExtraction({
                  entityType: 'item',
                  action: 'inventory_add',
                  entityId: item.id,
                  entityName: item.name,
                  targetActorId: actor.id,
                  targetActorName: actor.name,
                  previousState: prevActor,
                  newState: actor,
                  chapterId,
                  sourceContext: suggestion.sourceContext
                });
              } else if (finalData.action === 'drop' || finalData.action === 'lost') {
                actor.inventory = (actor.inventory || []).filter(id => id !== item.id);
                
                await db.update('actors', actor);
                
                await extractionHistoryService.recordExtraction({
                  entityType: 'item',
                  action: 'inventory_remove',
                  entityId: item.id,
                  entityName: item.name,
                  targetActorId: actor.id,
                  targetActorName: actor.name,
                  previousState: prevActor,
                  newState: actor,
                  chapterId,
                  sourceContext: suggestion.sourceContext
                });
              }
              
              if (onWorldStateUpdate) {
                onWorldStateUpdate(prev => ({
                  ...prev,
                  actors: prev.actors.map(a => a.id === actor.id ? actor : a)
                }));
              }
              
              return true;
            }
          }
          return false;
        }

        case 'plot':
        case 'event': {
          // Save plot/event with book context
          const plotData = {
            id: `plot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: finalData.name || finalData.title || 'Untitled Plot',
            description: finalData.description || finalData.desc || '',
            bookId: bookId || finalData.bookId,
            bookTitle: bookId ? (getBook(bookId)?.title || null) : finalData.bookTitle,
            chapterId: chapterId || finalData.chapterId,
            type: type,
            participants: finalData.participants || finalData.actorNames || [],
            timestamp: Date.now()
          };
          
          await db.add('plotThreads', plotData);
          
          await extractionHistoryService.recordExtraction({
            entityType: 'plot',
            action: 'create',
            entityId: plotData.id,
            entityName: plotData.name,
            previousState: null,
            newState: plotData,
            chapterId,
            bookId,
            sourceContext: suggestion.sourceContext,
            confidence: suggestion.confidence
          });
          
          if (onWorldStateUpdate) {
            const plotThreads = await db.getAll('plotThreads');
            onWorldStateUpdate(prev => ({
              ...prev,
              plotThreads
            }));
          }
          
          return true;
        }

        default:
          console.warn(`Unknown suggestion type: ${type}`);
          return false;
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      return false;
    }
  };

  // Revert a history entry
  const handleRevert = async (historyId) => {
    try {
      await extractionHistoryService.revertExtraction(historyId);
      toastService.success('Extraction reverted successfully');
      await loadHistory();
      
      // Refresh world state
      if (onWorldStateUpdate) {
        const actors = await db.getAll('actors');
        const itemBank = await db.getAll('itemBank');
        const skillBank = await db.getAll('skillBank');
        const relationships = await db.getAll('relationships');
        
        onWorldStateUpdate(prev => ({
          ...prev,
          actors,
          itemBank,
          skillBank,
          relationships
        }));
      }
    } catch (error) {
      toastService.error(`Failed to revert: ${error.message}`);
    }
  };

  // Revert entire session
  const handleRevertSession = async (sessionId) => {
    if (!window.confirm('Revert all extractions from this session?')) return;
    
    try {
      const results = await extractionHistoryService.revertSession(sessionId);
      const success = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (success > 0) {
        toastService.success(`Reverted ${success} extraction${success !== 1 ? 's' : ''}`);
      }
      if (failed > 0) {
        toastService.error(`${failed} revert${failed !== 1 ? 's' : ''} failed`);
      }
      
      await loadHistory();
      
      // Refresh world state
      if (onWorldStateUpdate) {
        const actors = await db.getAll('actors');
        const itemBank = await db.getAll('itemBank');
        const skillBank = await db.getAll('skillBank');
        const relationships = await db.getAll('relationships');
        
        onWorldStateUpdate(prev => ({
          ...prev,
          actors,
          itemBank,
          skillBank,
          relationships
        }));
      }
    } catch (error) {
      toastService.error(`Failed to revert session: ${error.message}`);
    }
  };

  // Get icon for entity type
  const getTypeIcon = (type) => {
    const icons = {
      item: Briefcase,
      skill: Zap,
      actor: Users,
      'actor-update': Users,
      stat_change: TrendingUp,
      relationship: Heart,
      location: MapPin,
      event: Target,
      inventory: Briefcase,
      plot: TrendingUp,
      wiki: FileText
    };
    return icons[type] || FileText;
  };

  // Get color for entity type
  const getTypeColor = (type) => {
    const colors = {
      item: 'yellow',
      skill: 'blue',
      actor: 'green',
      'actor-update': 'green',
      stat_change: 'purple',
      relationship: 'pink',
      location: 'cyan',
      event: 'orange',
      inventory: 'yellow',
      plot: 'red',
      wiki: 'gray'
    };
    return colors[type] || 'gray';
  };

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(s => {
    const typeMatch = filterType === 'all' || s.type === filterType;
    const confidenceMatch = s.confidence >= filterConfidence;
    return typeMatch && confidenceMatch;
  });

  // Select all high confidence
  const selectAllHighConfidence = () => {
    const newSelections = {};
    suggestions.filter(s => s.confidence >= 0.8).forEach(s => {
      if (s.actionOptions?.length > 0) {
        const firstAction = s.actionOptions.find(opt => opt.action !== 'skip') || s.actionOptions[0];
        if (firstAction) {
          newSelections[s.id] = firstAction.id;
        }
      }
    });
    setSelectedActions(prev => ({ ...prev, ...newSelections }));
    toastService.info(`Selected ${Object.keys(newSelections).length} high-confidence suggestions`);
  };

  // Get book by ID
  const getBook = (bookId) => {
    if (!books) return null;
    return books[bookId] || Object.values(books).find(b => b.id === bookId);
  };

  // Get chapter by ID
  const getChapter = (bookId, chapterId) => {
    const book = getBook(bookId);
    return book?.chapters?.find(c => c.id === chapterId);
  };

  // Resume Dialog Component
  const ResumeDialog = () => {
    if (!showResumeDialog) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-900 border border-green-500/30 rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-500" />
              Resume Previous Extraction?
            </h3>
            <button
              onClick={() => setShowResumeDialog(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-slate-300 mb-4">
            Found {availableSessions.length} active extraction session{availableSessions.length > 1 ? 's' : ''}. 
            Would you like to resume one?
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
            {availableSessions.map(session => (
              <div
                key={session.id}
                className="bg-slate-950 border border-slate-800 rounded p-4 hover:border-green-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{session.sourceName || 'Untitled Session'}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      {new Date(session.timestamp).toLocaleString()} • 
                      {session.suggestions?.length || 0} suggestions • 
                      {session.entriesCount || 0} extractions
                    </div>
                  </div>
                  <button
                    onClick={() => resumeSession(session.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded"
                  >
                    Resume
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowResumeDialog(false)}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded"
            >
              Start New Extraction
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-purple-500/50 rounded-lg shadow-2xl p-4 min-w-[300px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-bold text-white">Manuscript Intelligence</span>
            {isProcessing && (
              <span className="text-xs text-purple-400 animate-pulse">Processing...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMaximize}
              className="text-slate-400 hover:text-white p-1"
              title="Restore"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            {!isProcessing && onClose && (
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white p-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {isProcessing && minimizedProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{minimizedProgress.status || 'Processing...'}</span>
              <span>{minimizedProgress.current}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${minimizedProgress.current}%` }}
              />
            </div>
            {minimizedProgress.liveSuggestions?.length > 0 && (
              <div className="text-xs text-purple-400">
                {minimizedProgress.liveSuggestions.length} suggestions found so far
              </div>
            )}
          </div>
        )}
        {!isProcessing && (
          <div className="text-xs text-slate-400">
            Click to restore and review results
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      <ResumeDialog />
      {/* Header */}
      <div className="bg-slate-900 border-b border-purple-500/30 p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Brain className="mr-3 text-purple-500" />
            MANUSCRIPT INTELLIGENCE
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Intelligent extraction with batch review and reversible history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-xs"
            title="Keyboard shortcuts (Press ?)"
          >
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px]">?</kbd>
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'history' ? 'input' : 'history')}
            className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-2 ${
              viewMode === 'history' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            History ({extractionHistory.length})
          </button>
          <div className="flex items-center gap-2">
            {isProcessing && (
              <button
                onClick={handleMinimize}
                className="text-slate-500 hover:text-white p-2"
                title="Minimize (processing will continue in background)"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            )}
            {isMinimized && (
              <button
                onClick={handleMaximize}
                className="text-slate-500 hover:text-white p-2"
                title="Restore window"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            )}
            {onClose && (
              <button 
                onClick={handleClose} 
                className="text-slate-500 hover:text-white p-2"
                disabled={isProcessing}
                title={isProcessing ? 'Processing in progress - minimize instead' : 'Close'}
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Selection Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500 rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-400" />
              Select Chapter Context
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Choose which chapter this text belongs to. Extractions will be associated with this chapter.
            </p>

            <div className="space-y-4">
              {/* Mode Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => setChapterMode('existing')}
                  title="Analyze text for a specific chapter - entities will be linked to this chapter's context"
                  className={`flex-1 p-3 rounded border text-sm font-bold ${
                    chapterMode === 'existing'
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  📖 Existing Chapter
                </button>
                <button
                  onClick={() => setChapterMode('worldbuilding')}
                  title="Analyze lore, backstory, or reference material - entities won't be tied to any specific chapter"
                  className={`flex-1 p-3 rounded border text-sm font-bold ${
                    chapterMode === 'worldbuilding'
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  🌍 World Building
                </button>
              </div>
              
              <p className="text-xs text-slate-500 mt-1">
                {chapterMode === 'existing' 
                  ? '💡 Select which chapter this text belongs to. Entities will be tracked per chapter.'
                  : '💡 Use for general lore, backstory, or reference material not tied to a specific chapter.'}
              </p>

              {chapterMode === 'existing' && (
                <>
                  {/* Book Selection */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">BOOK</label>
                    <select
                      value={selectedBook || ''}
                      onChange={(e) => {
                        setSelectedBook(e.target.value);
                        const book = getBook(e.target.value);
                        if (book?.chapters?.length > 0) {
                          setSelectedChapter(book.chapters[0].id);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                    >
                      {books && Object.values(books).map(book => (
                        <option key={book.id} value={book.id}>{book.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Chapter Selection */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">CHAPTER</label>
                    <select
                      value={selectedChapter || ''}
                      onChange={(e) => setSelectedChapter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                    >
                      {getBook(selectedBook)?.chapters?.map((ch, idx) => (
                        <option key={ch.id} value={ch.id}>
                          Ch {idx + 1}: {ch.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {chapterMode === 'worldbuilding' && (
                <div className="bg-slate-950 p-4 rounded border border-slate-700">
                  <div className="text-sm text-slate-300">
                    <Info className="w-4 h-4 inline mr-2 text-blue-400" />
                    Extractions will not be tied to a specific chapter. 
                    Use this for general world-building content like lore, backstory, or reference material.
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={startProcessing}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                START PROCESSING
              </button>
              <button
                onClick={() => setShowChapterModal(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Input View */}
        {viewMode === 'input' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Input Mode Toggle */}
            <div className="bg-slate-900 border-b border-slate-800 p-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setInputMode('paste')}
                  title="Copy and paste text directly from your manuscript, notes, or any source"
                  className={`flex-1 p-3 rounded border text-sm font-bold flex items-center justify-center gap-2 ${
                    inputMode === 'paste'
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  PASTE TEXT
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  title="Upload a document file (PDF, Word, TXT, or Markdown)"
                  className={`flex-1 p-3 rounded border text-sm font-bold flex items-center justify-center gap-2 ${
                    inputMode === 'upload'
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  UPLOAD FILE
                </button>
              </div>
              
              {/* Quick Guide */}
              <div className="bg-slate-800/50 rounded p-3 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">📋 How it works:</p>
                <p>1. Paste or upload your text</p>
                <p>2. Click "Analyze" - AI will find characters, items, skills, etc.</p>
                <p>3. Review suggestions and accept/reject each one</p>
                <p>4. Approved entities are added to your story bible</p>
              </div>
            </div>

            {/* Text Input */}
            {inputMode === 'paste' && (
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="mb-2 flex justify-between items-center">
                  <label className="text-xs text-slate-400">PASTE YOUR TEXT</label>
                  <div className="text-xs text-slate-500">
                    {inputText.length} chars • {inputText.split(/\s+/).filter(w => w).length} words
                  </div>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your manuscript text here...

The AI will detect:
• Items mentioned (weapons, armor, artifacts)
• Characters and NPCs
• Stat changes (+10 STR, gained strength)
• Skills learned or used
• Locations visited
• Relationships between characters
• Plot events and milestones

You can also use buzz words like [item], [skill], [actor] to highlight specific entities."
                  className="flex-1 w-full bg-slate-950 border border-slate-700 rounded p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleProcess}
                  disabled={!inputText.trim()}
                  title="AI will scan your text for characters, items, skills, locations, relationships, and more"
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Brain className="w-5 h-5" />
                  ANALYZE TEXT
                </button>
                <p className="text-xs text-slate-500 text-center mt-2">
                  💡 You'll choose the book and chapter after clicking analyze
                </p>
              </div>
            )}

            {/* File Upload */}
            {inputMode === 'upload' && (
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="mb-4">
                  <label className="block w-full bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors">
                    <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <div className="text-white font-bold mb-1">Click to upload or drag files here</div>
                    <div className="text-xs text-slate-400">Supports: PDF, DOCX, TXT, Markdown</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Uploaded Documents List */}
                <div className="flex-1 overflow-y-auto">
                  <div className="text-xs text-slate-400 mb-2">UPLOADED DOCUMENTS</div>
                  <div className="space-y-2">
                    {uploadedDocuments.map(doc => (
                      <div
                        key={doc.id}
                        className={`bg-slate-900 border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedDocument?.id === doc.id 
                            ? 'border-purple-500 bg-purple-900/20' 
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-white text-sm">{doc.filename}</div>
                            <div className="text-xs text-slate-400 mt-1">
                              {new Date(doc.uploadedAt).toLocaleDateString()} • 
                              {(doc.fileSize / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <span className="text-xs bg-slate-800 px-2 py-1 rounded">
                            {doc.fileType?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {uploadedDocuments.length === 0 && (
                      <div className="text-center text-slate-500 py-8">
                        No documents uploaded yet
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleProcess}
                  disabled={!selectedDocument}
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Brain className="w-5 h-5" />
                  ANALYZE DOCUMENT
                </button>
              </div>
            )}
          </div>
        )}

        {/* Processing View */}
        {viewMode === 'processing' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-lg">
              <Sparkles className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Content</h3>
              <p className="text-slate-400 mb-2">{processingProgress.status}</p>
              <div className="w-64 bg-slate-800 rounded-full h-2 mx-auto mb-2 relative">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${processingProgress.current}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mb-6">{processingProgress.current}%</p>
              
              {/* Live Suggestions Preview */}
              {processingProgress.liveSuggestions.length > 0 && (
                <div className="mt-6 bg-slate-900 rounded-lg border border-slate-800 p-4 max-h-64 overflow-y-auto text-left">
                  <div className="text-xs font-bold text-slate-400 mb-2">
                    DETECTING ({processingProgress.liveSuggestions.length})
                  </div>
                  <div className="space-y-2">
                    {processingProgress.liveSuggestions.slice(-5).map((sugg, idx) => {
                      const Icon = getTypeIcon(sugg.type);
                      const color = getTypeColor(sugg.type);
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs bg-slate-950 p-2 rounded">
                          <Icon className={`w-4 h-4 text-${color}-400`} />
                          <span className="text-white">{sugg.data?.name || sugg.data?.title || 'Entity'}</span>
                          <span className={`text-${color}-400 ml-auto`}>{sugg.type}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review View */}
        {viewMode === 'review' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Review Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-4">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">REVIEW SUGGESTIONS</h3>
                  <p className="text-sm text-slate-400">
                    {filteredSuggestions.length} of {suggestions.length} suggestions
                    {selectedChapter && chapterMode !== 'worldbuilding' && (
                      <span className="ml-2 text-purple-400">
                        • Chapter: {getChapter(selectedBook, selectedChapter)?.title}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Type Filter */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white text-sm px-3 py-1 rounded"
                  >
                    <option value="all">All Types</option>
                    <option value="item">Items</option>
                    <option value="skill">Skills</option>
                    <option value="actor">Actors</option>
                    <option value="stat_change">Stat Changes</option>
                    <option value="relationship">Relationships</option>
                    <option value="location">Locations</option>
                    <option value="event">Events</option>
                    <option value="inventory">Inventory</option>
                  </select>
                  
                  {/* Confidence Filter */}
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filterConfidence * 100}
                      onChange={(e) => setFilterConfidence(e.target.value / 100)}
                      className="w-24"
                    />
                    <span className="text-xs text-slate-400 w-10">
                      {(filterConfidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Save as Story Context Button */}
                  {inputMode === 'paste' && inputText && (
                    <button
                      onClick={saveAsStoryContext}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded flex items-center gap-1"
                      title="Save pasted text as story context document for scene writing"
                    >
                      <Save className="w-3 h-3" />
                      Save for Scene Writing
                    </button>
                  )}

                  {/* Manual Entry Button */}
                  <button
                    onClick={handleAddManualEntry}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-1"
                    title="Add a manual entry between AI-extracted threads"
                  >
                    <Plus className="w-3 h-3" />
                    Add Manual Entry
                  </button>
                  
                  {/* Pending Area Toggle */}
                  {pendingSuggestions.length > 0 && (
                    <button
                      onClick={() => {
                        setSuggestions(prev => [...prev, ...pendingSuggestions]);
                        setPendingSuggestions([]);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded flex items-center gap-1"
                      title={`${pendingSuggestions.length} suggestions waiting in pending area`}
                    >
                      <Clock className="w-3 h-3" />
                      Pending ({pendingSuggestions.length})
                    </button>
                  )}

                  {/* Bulk Actions */}
                  <button
                    onClick={selectAllHighConfidence}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1"
                    title="Press H to accept all high confidence"
                  >
                    Accept High Confidence
                    <kbd className="ml-1 px-1 bg-green-800 rounded text-[10px]">H</kbd>
                  </button>
                  <button
                    onClick={() => setSelectedActions({})}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded"
                  >
                    Clear
                  </button>
                  <button
                    onClick={applySelectedActions}
                    disabled={Object.keys(selectedActions).length === 0}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded disabled:opacity-50 flex items-center gap-1"
                    title="Press Ctrl+Enter to apply"
                  >
                    APPLY ({Object.keys(selectedActions).filter(k => selectedActions[k] !== 'D').length})
                    <kbd className="ml-1 px-1 bg-purple-800 rounded text-[10px]">Ctrl+↵</kbd>
                  </button>
                  
                  {/* Clear All Button */}
                  <button
                    onClick={() => {
                      if (window.confirm('Clear all suggestions and pending items? This will also clear saved entities.')) {
                        clearPersistedEntities();
                        setViewMode('input');
                      }
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded"
                    title="Clear all and start fresh"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Suggestions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredSuggestions.length === 0 && (
                <div className="text-center text-slate-500 py-12">
                  <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No suggestions match the current filters</p>
                </div>
              )}

              {filteredSuggestions.map((sugg, index) => {
                const Icon = getTypeIcon(sugg.type === 'manual' ? (sugg.data?.type || 'item') : sugg.type);
                const color = getTypeColor(sugg.type === 'manual' ? (sugg.data?.type || 'item') : sugg.type);
                const selectedAction = selectedActions[sugg.id];
                const editedData = editableSuggestions[sugg.id] || {};
                const isFocused = index === focusedSuggestionIndex;
                const isManual = sugg.isManual || sugg.type === 'manual';

                return (
                  <div
                    key={sugg.id}
                    className={`bg-slate-900 border rounded-lg p-4 transition-all ${
                      isManual
                        ? 'border-blue-500 bg-blue-900/10'
                        : isFocused
                          ? 'border-purple-500 ring-2 ring-purple-500/30'
                          : selectedAction && selectedAction !== 'D'
                            ? 'border-green-500 bg-green-900/10'
                            : 'border-slate-800'
                    }`}
                    onClick={() => setFocusedSuggestionIndex(index)}
                  >
                    {/* Manual Entry Indicator */}
                    {isManual && (
                      <div className="text-[10px] text-blue-400 mb-2 flex items-center gap-2">
                        <span>✏️ MANUAL ENTRY</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSuggestions(prev => prev.filter(s => s.id !== sugg.id));
                            setManualEntries(prev => prev.filter(m => m.id !== sugg.id));
                          }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    
                    {/* Focus indicator */}
                    {isFocused && (
                      <div className="text-[10px] text-purple-400 mb-2 flex items-center gap-2">
                        <span>▶ FOCUSED</span>
                        <span className="text-slate-500">Press A/B/C/D to select action, ↑↓ to navigate</span>
                      </div>
                    )}
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`bg-${color}-900/30 text-${color}-400 p-2 rounded`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {/* Editable Name */}
                            <input
                              type="text"
                              value={editedData.name ?? (sugg.data?.name || sugg.data?.title || '')}
                              onChange={(e) => handleEditSuggestion(sugg.id, 'name', e.target.value)}
                              className="font-bold text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-purple-500 focus:outline-none"
                            />
                            <span className={`text-xs px-2 py-1 rounded ${
                              sugg.confidence >= 0.8 ? 'bg-green-900/30 text-green-400' :
                              sugg.confidence >= 0.6 ? 'bg-yellow-900/30 text-yellow-400' :
                              'bg-red-900/30 text-red-400'
                            }`}>
                              {(sugg.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Type: <span className={`text-${color}-400`}>
                              {isManual ? (
                                <select
                                  value={editedData.type || sugg.data?.type || 'item'}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleEditSuggestion(sugg.id, 'type', e.target.value);
                                  }}
                                  className="bg-slate-800 border border-slate-700 text-white text-xs px-2 py-1 rounded"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="item">Item</option>
                                  <option value="skill">Skill</option>
                                  <option value="actor">Actor</option>
                                  <option value="plot">Plot</option>
                                  <option value="event">Event</option>
                                  <option value="location">Location</option>
                                  <option value="relationship">Relationship</option>
                                </select>
                              ) : sugg.type}
                            </span>
                            {sugg.buzzWordUsed && (
                              <span className="ml-2 text-purple-400">Tag: {sugg.buzzWordUsed}</span>
                            )}
                            {/* Show book context for plots */}
                            {(sugg.type === 'plot' || sugg.type === 'event') && sugg.bookId && (
                              <span className="ml-2 text-cyan-400">
                                📖 {getBook(sugg.bookId)?.title || 'Book ' + sugg.bookId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Source Context */}
                    {sugg.sourceContext && (
                      <div className="bg-slate-950 p-3 rounded mb-3">
                        <div className="text-xs text-slate-500 mb-1">Source:</div>
                        <div className="text-sm text-slate-300 italic">
                          "{sugg.sourceContext.substring(0, 200)}{sugg.sourceContext.length > 200 ? '...' : ''}"
                        </div>
                      </div>
                    )}

                    {/* Editable Description */}
                    {(sugg.data?.description || sugg.data?.desc) && (
                      <div className="mb-3">
                        <div className="text-xs text-slate-400 mb-1">Description:</div>
                        <textarea
                          value={editedData.description ?? (sugg.data?.description || sugg.data?.desc || '')}
                          onChange={(e) => handleEditSuggestion(sugg.id, 'description', e.target.value)}
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white resize-none focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}

                    {/* Stats (for items/actors) */}
                    {sugg.data?.stats && Object.keys(sugg.data.stats).length > 0 && (
                      <div className="bg-slate-950 p-3 rounded mb-3">
                        <div className="text-xs text-green-400 font-bold mb-2">Stats:</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(sugg.data.stats).map(([stat, value]) => (
                            <div key={stat} className="flex items-center gap-1 bg-green-900/20 text-green-300 px-2 py-1 rounded text-xs">
                              <span>{stat}:</span>
                              <input
                                type="number"
                                value={editedData.stats?.[stat] ?? value}
                                onChange={(e) => {
                                  const newStats = { ...(editedData.stats || sugg.data.stats), [stat]: parseInt(e.target.value) || 0 };
                                  handleEditSuggestion(sugg.id, 'stats', newStats);
                                }}
                                className="w-12 bg-slate-900 border border-slate-700 text-white text-xs p-1 rounded"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Character Assignment (for items/skills) */}
                    {(sugg.type === 'item' || sugg.type === 'skill') && (
                      <div className="mb-3">
                        <div className="text-xs text-slate-400 mb-1">Assign to character (optional):</div>
                        <select
                          value={editedData.characterName ?? (sugg.data?.characterName || '')}
                          onChange={(e) => handleEditSuggestion(sugg.id, 'characterName', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-white text-sm p-2 rounded"
                        >
                          <option value="">-- None --</option>
                          {worldState.actors?.map(actor => (
                            <option key={actor.id} value={actor.name}>{actor.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Duplicate Warning */}
                    {sugg.duplicateWarning && (
                      <div className="bg-yellow-900/20 border border-yellow-800 p-3 rounded mb-3">
                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          Similar to existing: <strong>{sugg.duplicateWarning.name}</strong>
                          <span className="text-xs">({(sugg.duplicateWarning.similarity * 100).toFixed(0)}% match)</span>
                        </div>
                      </div>
                    )}

                    {/* Action Options */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {sugg.actionOptions?.map(option => (
                        <button
                          key={option.id}
                          onClick={() => handleActionSelect(sugg.id, option.id)}
                          className={`p-3 rounded border text-left transition-all ${
                            selectedAction === option.id
                              ? option.action === 'skip'
                                ? 'border-red-500 bg-red-900/30 text-white'
                                : 'border-green-500 bg-green-900/30 text-white'
                              : 'border-slate-700 bg-slate-800 hover:border-slate-600 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                              selectedAction === option.id 
                                ? option.action === 'skip' ? 'text-red-400' : 'text-green-400'
                                : 'text-slate-400'
                            }`}>{option.id})</span>
                            <span className="text-xs">{option.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back to Input */}
            <div className="bg-slate-900 border-t border-slate-800 p-4">
              <button
                onClick={() => {
                  setViewMode('input');
                  setSuggestions([]);
                  setSelectedActions({});
                  setEditableSuggestions({});
                }}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Input
              </button>
            </div>
          </div>
        )}

        {/* History View */}
        {viewMode === 'history' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-slate-900 border-b border-slate-800 p-4">
              <h3 className="text-lg font-bold text-white">EXTRACTION HISTORY</h3>
              <p className="text-sm text-slate-400">
                Review and revert past extractions
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Statistics Dashboard */}
              {historyStats && (
                <div className="mb-6 bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    <h4 className="font-bold text-white">EXTRACTION STATISTICS</h4>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-950 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-purple-400">{historyStats.totalExtractions}</div>
                      <div className="text-xs text-slate-500">Total Extractions</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-blue-400">{historyStats.totalSessions}</div>
                      <div className="text-xs text-slate-500">Sessions</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {historyStats.totalExtractions - historyStats.revertedCount}
                      </div>
                      <div className="text-xs text-slate-500">Active</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-red-400">{historyStats.revertedCount}</div>
                      <div className="text-xs text-slate-500">Reverted</div>
                    </div>
                  </div>
                  
                  {/* By Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-2">BY ENTITY TYPE</div>
                      <div className="space-y-1">
                        {Object.entries(historyStats.byEntityType || {}).map(([type, count]) => {
                          const Icon = getTypeIcon(type);
                          const color = getTypeColor(type);
                          const percentage = historyStats.totalExtractions > 0 
                            ? (count / historyStats.totalExtractions * 100).toFixed(0) 
                            : 0;
                          
                          return (
                            <div key={type} className="flex items-center gap-2 text-xs">
                              <Icon className={`w-3 h-3 text-${color}-400`} />
                              <span className="text-slate-300 capitalize w-20">{type}</span>
                              <div className="flex-1 bg-slate-800 rounded-full h-2">
                                <div 
                                  className={`bg-${color}-600 h-2 rounded-full`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-slate-400 w-12 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-2">BY ACTION</div>
                      <div className="space-y-1">
                        {Object.entries(historyStats.byAction || {}).map(([action, count]) => {
                          const actionColors = {
                            'create': 'green',
                            'update': 'blue',
                            'merge': 'yellow',
                            'delete': 'red',
                            'inventory_add': 'cyan',
                            'stat_change': 'purple'
                          };
                          const color = actionColors[action] || 'gray';
                          const percentage = historyStats.totalExtractions > 0 
                            ? (count / historyStats.totalExtractions * 100).toFixed(0) 
                            : 0;
                          
                          return (
                            <div key={action} className="flex items-center gap-2 text-xs">
                              <span className={`text-${color}-400 capitalize w-20`}>{action.replace('_', ' ')}</span>
                              <div className="flex-1 bg-slate-800 rounded-full h-2">
                                <div 
                                  className={`bg-${color}-600 h-2 rounded-full`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-slate-400 w-12 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Recent Sessions */}
              <div className="mb-6">
                <div className="text-xs text-slate-400 font-bold mb-3">RECENT SESSIONS</div>
                <div className="space-y-2">
                  {extractionSessions.slice(0, 10).map(session => (
                    <div key={session.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-white">{session.sourceName || 'Extraction Session'}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(session.timestamp).toLocaleString()} • 
                            {session.entriesCount} extraction{session.entriesCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevertSession(session.id)}
                          className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs rounded flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Revert All
                        </button>
                      </div>
                    </div>
                  ))}
                  {extractionSessions.length === 0 && (
                    <div className="text-center text-slate-500 py-8">
                      No extraction sessions yet
                    </div>
                  )}
                </div>
              </div>

              {/* Individual Extractions */}
              <div>
                <div className="text-xs text-slate-400 font-bold mb-3">RECENT EXTRACTIONS</div>
                <div className="space-y-2">
                  {extractionHistory.slice(0, 50).map(entry => {
                    const Icon = getTypeIcon(entry.entityType);
                    const color = getTypeColor(entry.entityType);
                    
                    return (
                      <div key={entry.id} className={`bg-slate-900 border rounded-lg p-3 ${
                        entry.reverted ? 'border-slate-700 opacity-50' : 'border-slate-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 text-${color}-400`} />
                            <div>
                              <div className="text-sm text-white">
                                <span className="font-bold">{entry.entityName}</span>
                                <span className="text-slate-400 ml-2">({entry.action})</span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(entry.timestamp).toLocaleString()}
                                {entry.targetActorName && (
                                  <span className="ml-2 text-green-400">→ {entry.targetActorName}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {!entry.reverted && (
                            <button
                              onClick={() => handleRevert(entry.id)}
                              className="px-2 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs rounded flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Undo
                            </button>
                          )}
                          {entry.reverted && (
                            <span className="text-xs text-slate-500">Reverted</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {extractionHistory.length === 0 && (
                    <div className="text-center text-slate-500 py-8">
                      No extractions yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Back to Input */}
            <div className="bg-slate-900 border-t border-slate-800 p-4">
              <button
                onClick={() => setViewMode('input')}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Input
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Integration Preview Modal */}
      {showIntegrationPreview && integrationPreview && (
        <IntegrationPreviewModal
          preview={integrationPreview}
          onApply={handleApplyIntegrations}
          onClose={() => setShowIntegrationPreview(false)}
          onTogglePlotThread={handleTogglePlotThread}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                ⌨️ Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-purple-400 font-bold mb-2">NAVIGATION</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Navigate suggestions</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">↑ ↓</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Navigate (vim-style)</span>
                    <div>
                      <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">J</kbd>
                      <kbd className="ml-1 px-2 py-0.5 bg-slate-800 rounded text-xs">K</kbd>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Close/Go back</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">Esc</kbd>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-green-400 font-bold mb-2">ACTIONS (Review Mode)</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Select option A</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Select option B</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">B</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Select option C</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">C</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Select option D (Skip)</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">D</kbd>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-blue-400 font-bold mb-2">BULK ACTIONS</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Accept all high confidence</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">H</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Apply selected actions</span>
                    <div>
                      <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">Ctrl</kbd>
                      <span className="mx-1 text-slate-500">+</span>
                      <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">Enter</kbd>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-yellow-400 font-bold mb-2">HELP</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Show this help</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">?</kbd>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowKeyboardHelp(false)}
              className="mt-6 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManuscriptIntelligence;

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import {
  Save, FileText, Wand2, Check, X, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  Users, Package, Sparkles, BookOpen, Clock, CheckCircle,
  Loader2, AlertCircle, AlertTriangle, Activity, Mic, MicOff, Volume2, RotateCcw,
  Maximize2, Minimize2, Settings, RefreshCw, Eye, EyeOff,
  Edit3, Lock, Unlock, Undo2, Redo2, Zap, Palette,
  PenTool, MessageSquare, Image, UserPlus, MoreHorizontal, BarChart3,
  MapPin, Calendar, Heart, Briefcase, Download
} from 'lucide-react';
import FloatingPanel from './FloatingPanel';
import MoodMeter from './MoodMeter';
import ChangeBox from './ChangeBox';
import PreviewPanel, { MoodRewritePanel } from './PreviewPanel';
import { ActorHoverCard, ItemHoverCard } from './EntityHoverCard';
import StyleReferenceManager from './StyleReferenceManager';
import ChangeSummaryDrawer from './ChangeSummaryDrawer';
import ReviewSuggestionsPanel from './ReviewSuggestionsPanel';
import WritingGoals from './WritingGoals';
import toastService from '../../services/toastService';
import SessionTimer from './SessionTimer';
import NegativeExamplesManager from './NegativeExamplesManager';
import ReadAloudButton from './ReadAloudButton';
import ReadAloudPanel from './ReadAloudPanel';
import WritingStatistics from './WritingStatistics';
import ChapterTemplates from './ChapterTemplates';
import StylePreviewPanel from './StylePreviewPanel';
import StyleConnectionIndicator from './StyleConnectionIndicator';
import db from '../services/database';
import contextEngine from '../services/contextEngine';
import aiService from '../services/aiService';
import smartContextEngine from '../services/smartContextEngine';
import storyBrain from '../services/storyBrain';
import chapterDataExtractionService from '../services/chapterDataExtractionService';
import dataConsistencyService from '../services/dataConsistencyService';
import EntityExtractionWizard from './EntityExtractionWizard';
import EntityInterjectionModal from './EntityInterjectionModal';
import writingEnhancementServices from '../services/writingEnhancementServices';
import betaReaderService from '../services/betaReaderService';

/**
 * WritingCanvasPro - The ultimate AI-powered writing environment
 * 
 * Features:
 * - Tracked changes with Accept/Reject/Lock
 * - Preview panels before AI insertion
 * - Review mode with actionable suggestions
 * - Mood-based rewrites with diff view
 * - Draft/Review mode toggle
 * - Change summary drawer
 * - Full keyboard shortcut support
 */
const WritingCanvasPro = ({ 
  onNavigate,
  onSave,
  onEntityUpdate,
  initialChapter = null 
}) => {
  // ============================================
  // STATE
  // ============================================
  
  // Core content - stored as segments for tracked changes
  const [contentSegments, setContentSegments] = useState([]);
  // Plain text version for display/editing
  const [plainContent, setPlainContent] = useState('');
  
  // Chapter/Book state
  const [currentChapter, setCurrentChapter] = useState(null);
  const [currentBook, setCurrentBook] = useState(null);
  const [allChapters, setAllChapters] = useState([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Writing mode: 'draft' (direct) or 'review' (tracked changes)
  const [writingMode, setWritingMode] = useState('review');
  
  // Tracked changes
  const [trackedChanges, setTrackedChanges] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  
  // Preview panel state
  const [previewPanel, setPreviewPanel] = useState({
    isOpen: false,
    content: '',
    source: 'continue',
    confidence: 'high',
    originalSelection: null,
    isLoading: false
  });
  
  // Mood rewrite panel
  const [moodRewritePanel, setMoodRewritePanel] = useState({
    isOpen: false,
    originalContent: '',
    rewrittenContent: '',
    moodSettings: null,
    isLoading: false
  });
  
  // Review suggestions panel
  const [reviewPanel, setReviewPanel] = useState({
    isOpen: false,
    suggestions: [],
    isLoading: false
  });
  
  // Mood settings for rewrites
  const [moodSettings, setMoodSettings] = useState({
    comedy_horror: 50,
    tension: 50,
    pacing: 50,
    detail: 50,
    emotional: 50
  });
  
  // Selection state
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [showSelectionTools, setShowSelectionTools] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);
  
  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState(null);
  
  // Prompt modal state
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState(null); // { type, handler, prompt }
  const [tempCustomPrompt, setTempCustomPrompt] = useState('');
  
  // Entity detection
  const [detectedCharacters, setDetectedCharacters] = useState([]);
  const [detectedItems, setDetectedItems] = useState([]);
  const [actors, setActors] = useState([]);
  const [items, setItems] = useState([]);
  
  // Entity extraction wizard state
  const [showEntityWizard, setShowEntityWizard] = useState(false);
  const [skills, setSkills] = useState([]);
  const [books, setBooks] = useState([]);
  
  // Entity interjection state
  const [showInterjectionModal, setShowInterjectionModal] = useState(false);
  const [interjectionEntityType, setInterjectionEntityType] = useState('actor');
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  
  // Plot beats
  const [plotBeatsForChapter, setPlotBeatsForChapter] = useState([]);
  
  // Writing features panel
  const [showWritingFeatures, setShowWritingFeatures] = useState(false);
  
  // Custom prompts for AI tools
  const [customPromptContinue, setCustomPromptContinue] = useState('');
  const [customPromptScene, setCustomPromptScene] = useState('');
  const [customPromptDialogue, setCustomPromptDialogue] = useState('');
  const [customPromptDescription, setCustomPromptDescription] = useState('');
  const [customPromptCharacter, setCustomPromptCharacter] = useState('');
  const [customPromptReview, setCustomPromptReview] = useState('');

  // ---- Enhancement: Chapter summary ----
  const [chapterSummary, setChapterSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);

  // ---- Enhancement: Pacing analyzer ----
  const [showPacingPanel, setShowPacingPanel] = useState(false);

  // ---- Enhancement: Plot hole alerts ----
  const [plotHoleAlerts, setPlotHoleAlerts] = useState([]);
  const [showPlotHolePanel, setShowPlotHolePanel] = useState(false);

  // ---- Enhancement: Scene starter templates ----
  const [showSceneStarters, setShowSceneStarters] = useState(false);

  // ---- Enhancement: Inline entity quick-edit ----
  const [inlineEditEntity, setInlineEditEntity] = useState(null); // { type, id, name }
  const [showInlineEdit, setShowInlineEdit] = useState(false);

  // ---- Beta Reader Portal ----
  const [showBetaExportModal, setShowBetaExportModal] = useState(false);
  const [betaImportAnnotations, setBetaImportAnnotations] = useState([]);
  const [showBetaAnnotations, setShowBetaAnnotations] = useState(false);
  
  // Memoized filtered plot beats (uncompleted)
  const uncompletedBeats = useMemo(() => {
    return plotBeatsForChapter.filter(b => !b.completed);
  }, [plotBeatsForChapter]);
  
  // Memoized detected characters and items (filtered)
  const filteredDetectedCharacters = useMemo(() => {
    return detectedCharacters.slice(0, 10); // Limit to 10 for performance
  }, [detectedCharacters]);
  
  const filteredDetectedItems = useMemo(() => {
    return detectedItems.slice(0, 10); // Limit to 10 for performance
  }, [detectedItems]);
  
  // Panel visibility
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [showMoodPanel, setShowMoodPanel] = useState(true);
  const [showGoalsPanel, setShowGoalsPanel] = useState(false);
  const [showTimerPanel, setShowTimerPanel] = useState(false);
  const [showStyleRefPanel, setShowStyleRefPanel] = useState(false);
  const [showReadAloudPanel, setShowReadAloudPanel] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState(null);
  
  // Focus and fullscreen modes
  const [focusMode, setFocusMode] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [focusedParagraph, setFocusedParagraph] = useState(null);
  
  // Hover cards for entity previews
  const [hoveredEntity, setHoveredEntity] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const hoverTimerRef = useRef(null);
  
  // Refs
  const textareaRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const cursorPositionRef = useRef(0);
  const entityDetectionTimerRef = useRef(null);

  // ============================================
  // INITIALIZATION
  // ============================================
  
  useEffect(() => {
    loadInitialData();
    
    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input/textarea (unless it's a global shortcut)
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Ctrl+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentChapter) {
          autoSave(plainContent);
        }
        return;
      }
      
      // Ctrl+Z - Undo (only if not in input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !isInput) {
        e.preventDefault();
        handleUndo();
        return;
      }
      
      // Ctrl+Shift+Z or Ctrl+Y - Redo (only if not in input)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey)) && !isInput) {
        e.preventDefault();
        handleRedo();
        return;
      }
      
      // Ctrl+M - Toggle Mood Panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'm' && !isInput) {
        e.preventDefault();
        setShowMoodPanel(!showMoodPanel);
        return;
      }
      
      // Ctrl+E - Toggle Context Panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !isInput) {
        e.preventDefault();
        setShowContextPanel(!showContextPanel);
        return;
      }
      
      // F11 - Toggle fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      
      // Escape - Close panels, exit focus/fullscreen
      if (e.key === 'Escape') {
        if (previewPanel.isOpen) {
          setPreviewPanel({ isOpen: false, content: '', source: 'continue', isLoading: false });
        } else if (moodRewritePanel.isOpen) {
          setMoodRewritePanel({ isOpen: false, originalContent: '', rewrittenContent: '', moodSettings: null, isLoading: false });
        } else if (reviewPanel.isOpen) {
          setReviewPanel({ isOpen: false, suggestions: [], isLoading: false });
        } else if (showSelectionTools) {
          setShowSelectionTools(false);
        } else if (focusMode || fullscreenMode) {
          setFocusMode(false);
          setFullscreenMode(false);
        }
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
      if (entityDetectionTimerRef.current) clearTimeout(entityDetectionTimerRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const loadedActors = await db.getAll('actors');
      const loadedItems = await db.getAll('itemBank');
      setActors(loadedActors || []);
      setItems(loadedItems || []);

      // Load books
      const loadedBooks = await db.getAll('books');
      setBooks(loadedBooks || []);

      const chapters = await contextEngine.getAllChaptersWithStatus();
      setAllChapters(chapters);

      let chapter = initialChapter;
      if (!chapter) {
        chapter = await contextEngine.getCurrentChapter();
      }

      if (chapter) {
        await loadChapter(chapter);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to next/previous book
  const navigateToBook = async (direction) => {
    if (!books || books.length === 0) return;
    
    const sortedBooks = [...books].sort((a, b) => a.id - b.id);
    const currentIndex = sortedBooks.findIndex(b => b.id === currentBook?.id);
    
    let targetBook;
    if (direction === 'next') {
      if (currentIndex < sortedBooks.length - 1) {
        targetBook = sortedBooks[currentIndex + 1];
      } else {
        return; // Already at last book
      }
    } else {
      if (currentIndex > 0) {
        targetBook = sortedBooks[currentIndex - 1];
      } else {
        return; // Already at first book
      }
    }
    
    // Load first chapter of target book
    const bookChapters = allChapters.filter(ch => ch.bookId === targetBook.id);
    if (bookChapters.length > 0) {
      await loadChapter(bookChapters[0]);
    } else {
      // No chapters in this book, just set the book
      setCurrentBook(targetBook);
      toastService.info(`Switched to ${targetBook.title} (no chapters yet)`);
    }
  };

  const loadChapter = async (chapter) => {
    setCurrentChapter(chapter);
    const content = chapter.content || chapter.script || '';
    setPlainContent(content);
    
    // Load mood defaults from story profile
    try {
      const storyProfile = await contextEngine.getStoryProfile();
      if (storyProfile?.moodDefaults) {
        setMoodSettings(prev => ({ ...prev, ...storyProfile.moodDefaults }));
      }
    } catch (error) {
      console.warn('Error loading mood defaults:', error);
    }
    
    // Initialize content as a single untracked segment
    setContentSegments([{
      id: 'original',
      type: 'accepted',
      content: content,
      source: 'user'
    }]);
    
    // Clear tracked changes for new chapter
    setTrackedChanges([]);
    setUndoStack([]);
    setRedoStack([]);
    
    const book = await db.get('books', chapter.bookId);
    setCurrentBook(book);
    
    // Load plot beats
    const allBeats = await contextEngine.getPlotBeats();
    // Safely get chapter number - handle both string and number IDs
    const chapterId = String(chapter.id || '');
    const chapterNum = chapter.number || parseInt(chapterId.replace(/\D/g, '')) || 1;
    const chapterBeats = allBeats.filter(b => {
      if (!b.targetChapter && b.targetChapter !== 0) return chapterNum === 1;
      return b.targetChapter === chapterNum || b.targetChapter === chapter.id;
    });
    setPlotBeatsForChapter(chapterBeats);

    updateWordCount(content);
  };

  // ============================================
  // CONTENT MANAGEMENT
  // ============================================
  
  const updateWordCount = (text) => {
    const count = text.trim() ? text.trim().split(/\s+/).filter(w => w).length : 0;
    setWordCount(count);
  };

  // Focus mode - dim everything except current paragraph
  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
    if (!focusMode) {
      // Find current paragraph based on cursor position
      const cursorPos = textareaRef.current?.selectionStart || 0;
      const textBefore = plainContent.substring(0, cursorPos);
      const paragraphs = textBefore.split('\n\n');
      setFocusedParagraph(paragraphs.length - 1);
    }
  };

  // Fullscreen mode
  const toggleFullscreen = () => {
    if (!fullscreenMode) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
      setFullscreenMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setFullscreenMode(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreenMode(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Content history for undo/redo - use state for proper re-rendering
  const [contentHistory, setContentHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);
  const lastSavedContent = useRef('');
  
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    
    setPlainContent(newContent);
    updateWordCount(newContent);
    
    // Debounce entity detection (only run after user stops typing for 500ms)
    if (entityDetectionTimerRef.current) {
      clearTimeout(entityDetectionTimerRef.current);
    }
    entityDetectionTimerRef.current = setTimeout(() => {
      detectEntities(newContent);
    }, 500);
    
    // Store cursor position
    cursorPositionRef.current = e.target.selectionStart;
    
    // Don't add to history if this change came from undo/redo
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    
    // Track content history for undo - snapshot when content changes significantly
    const shouldSaveSnapshot = 
      !lastSavedContent.current ||
      Math.abs(newContent.length - lastSavedContent.current.length) > 15 ||
      newContent.split(/\s+/).length !== lastSavedContent.current.split(/\s+/).length;
    
    if (shouldSaveSnapshot) {
      setContentHistory(prev => {
        // Remove any redo history (anything after current index)
        const newHistory = prev.slice(0, historyIndex + 1);
        // Add the previous content (what we're replacing)
        newHistory.push(lastSavedContent.current || '');
        // Keep history limited to 100 entries
        if (newHistory.length > 100) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 99));
      lastSavedContent.current = newContent;
    }
    
    // Auto-save with optimized debounce (4 seconds for better performance)
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => autoSave(newContent), 4000);
  };
  
  // Undo content changes - go back through history
  const undoContentChange = () => {
    if (historyIndex >= 0 && contentHistory.length > 0) {
      isUndoRedoAction.current = true;
      const prevContent = contentHistory[historyIndex];
      setHistoryIndex(prev => prev - 1);
      setPlainContent(prevContent);
      updateWordCount(prevContent);
      lastSavedContent.current = prevContent;
    }
  };
  
  // Redo content changes - go forward through history
  const redoContentChange = () => {
    if (historyIndex < contentHistory.length - 1) {
      isUndoRedoAction.current = true;
      const nextIndex = historyIndex + 1;
      const nextContent = contentHistory[nextIndex];
      if (nextContent !== undefined) {
        setHistoryIndex(nextIndex);
        setPlainContent(nextContent);
        updateWordCount(nextContent);
        lastSavedContent.current = nextContent;
      }
    }
  };

  const autoSave = async (text) => {
    if (!currentChapter || !currentBook) return;
    try {
      await contextEngine.updateChapterContent(currentBook.id, currentChapter.id, text);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSave = async () => {
    if (!currentChapter || !currentBook) return;
    
    setIsSaving(true);
    try {
      // Compile all accepted + locked content
      const finalContent = compileContent();
      await contextEngine.updateChapterContent(currentBook.id, currentChapter.id, finalContent);
      setLastSaved(new Date());
      onSave?.();
      
      // Generate chapter summary in background
      generateChapterSummary(finalContent);
      // Check for plot holes in background
      checkForPlotHoles(finalContent);

      // Extract events using Master Timeline's proven method
      if (finalContent && finalContent.trim().length >= 50) {
        try {
          const events = await chapterDataExtractionService.extractEventsFromChapter(
            finalContent,
            currentChapter.id,
            currentBook.id,
            actors || []
          );

          // Save events to timelineEvents table
          for (const event of events) {
            await dataConsistencyService.addTimelineEventSafe(event);
          }

          // Show Entity Extraction Wizard (mandatory)
          setShowEntityWizard(true);
        } catch (error) {
          console.error('[WritingCanvasPro] Event extraction failed:', error);
          // Still show wizard even if extraction fails - user can manually review
          setShowEntityWizard(true);
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Entity Extraction Wizard completion
  const handleEntityWizardComplete = async () => {
    setShowEntityWizard(false);
    
    // Reload actors, items, skills in case they were created/updated
    const loadedActors = await db.getAll('actors');
    const loadedItems = await db.getAll('itemBank');
    const loadedSkills = await db.getAll('skillBank');
    setActors(loadedActors || []);
    setItems(loadedItems || []);
    setSkills(loadedSkills || []);
    
    // Notify parent (App.js) to refresh worldState so Personnel/Item Vault/Skill Bank tabs show new entities
    if (onEntityUpdate) {
      await onEntityUpdate();
    }
    
    // Visualizations will update from timelineEvents automatically
    console.log('[WritingCanvasPro] Entity wizard completed, visualizations will update from timelineEvents');
  };
  
  // ============================================
  // ENHANCEMENT: Chapter Summary Auto-Generation
  // ============================================
  const generateChapterSummary = async (content) => {
    if (!content || content.trim().length < 100) return;
    setIsGeneratingSummary(true);
    try {
      const system = 'You are a story analyst. Write a concise 2–3 sentence summary of this chapter focusing on the key story events and character moments. Be factual, not poetic.';
      const summary = await aiService.callAI(content.slice(0, 4000), 'analytical', system);
      if (summary) {
        setChapterSummary(summary.trim());
        setShowSummaryPanel(true);
        // Persist summary to chapter metadata
        if (currentChapter && currentBook) {
          try {
            await contextEngine.updateChapterContent(currentBook.id, currentChapter.id, content, { summary: summary.trim() });
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('[WritingCanvasPro] Summary generation failed:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // ============================================
  // ENHANCEMENT: Pacing Analysis
  // ============================================
  const getPacingStats = () => {
    if (!plainContent || plainContent.trim().length < 20) return null;
    const sentences = plainContent.match(/[^.!?]+[.!?]+/g) || [];
    let dialogueWords = 0;
    let actionWords = 0;
    let descriptionWords = 0;

    plainContent.split('\n').forEach(line => {
      const words = line.split(/\s+/).filter(w => w.length > 0).length;
      const trimmed = line.trim();
      if (trimmed.startsWith('"') || trimmed.startsWith('\u2018') || trimmed.startsWith('\u201C')) {
        dialogueWords += words;
      } else if (/\b(ran|jumped|hit|grabbed|pulled|pushed|fired|fought|struck|moved|ran)\b/i.test(trimmed)) {
        actionWords += words;
      } else {
        descriptionWords += words;
      }
    });

    const total = dialogueWords + actionWords + descriptionWords || 1;
    return {
      dialogue: Math.round((dialogueWords / total) * 100),
      action: Math.round((actionWords / total) * 100),
      description: Math.round((descriptionWords / total) * 100),
      avgSentenceLen: sentences.length > 0 ? Math.round(plainContent.split(/\s+/).length / sentences.length) : 0,
    };
  };

  // ============================================
  // ENHANCEMENT: Plot Hole Detection (lightweight post-save check)
  // ============================================
  const checkForPlotHoles = async (content) => {
    if (!content || content.trim().length < 200) return;
    try {
      const knownCharacters = actors.map(a => a.name).join(', ');
      const system = `You are a story continuity checker. Given the list of known characters (${knownCharacters}), check the chapter text for:
1. Characters appearing who haven't been introduced yet
2. Contradictions in character actions or abilities
3. Timeline inconsistencies
Return ONLY a JSON array of issues like: [{"issue":"...", "severity":"warning|critical"}] or [] if none found. Max 5 issues.`;
      const result = await aiService.callAI(content.slice(0, 3000), 'analytical', system);
      if (result) {
        try {
          const issues = JSON.parse(result.replace(/```json|```/g, '').trim());
          if (Array.isArray(issues) && issues.length > 0) {
            setPlotHoleAlerts(issues);
            setShowPlotHolePanel(true);
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[WritingCanvasPro] Plot hole check failed:', err);
    }
  };

  // Compile content from segments (accepted content + locked changes)
  const compileContent = () => {
    let compiled = plainContent;
    
    // Insert locked changes at their positions
    const lockedChanges = trackedChanges
      .filter(c => c.type === 'locked')
      .sort((a, b) => (b.position || 0) - (a.position || 0)); // Reverse order to maintain positions
    
    lockedChanges.forEach(change => {
      if (change.position !== undefined) {
        compiled = compiled.slice(0, change.position) + change.content + compiled.slice(change.position);
      }
    });
    
    return compiled;
  };

  // ============================================
  // ENTITY DETECTION
  // ============================================
  
  const detectEntities = useCallback((text) => {
    const detectedChars = actors.filter(actor => {
      const nameMatch = text.toLowerCase().includes(actor.name?.toLowerCase());
      const nicknameMatch = actor.nicknames?.some(n => 
        text.toLowerCase().includes(n.toLowerCase())
      );
      return nameMatch || nicknameMatch;
    });
    setDetectedCharacters(detectedChars);

    const detectedItms = items.filter(item => 
      text.toLowerCase().includes(item.name?.toLowerCase())
    );
    setDetectedItems(detectedItms);
  }, [actors, items]);

  // ============================================
  // TRACKED CHANGES MANAGEMENT
  // ============================================
  
  const addTrackedChange = (change) => {
    const newChange = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'pending',
      createdAt: Date.now(),
      ...change
    };
    
    setTrackedChanges(prev => [...prev, newChange]);
    
    // Add to undo stack
    setUndoStack(prev => [...prev, { action: 'add', change: newChange }]);
    setRedoStack([]);
    
    return newChange;
  };

  const acceptChange = (changeId) => {
    setTrackedChanges(prev => {
      const change = prev.find(c => c.id === changeId);
      if (!change) return prev;
      
      // Add to undo stack
      setUndoStack(stack => [...stack, { action: 'accept', change: { ...change } }]);
      
      // Insert content at position and remove from tracked
      if (change.position !== undefined) {
        setPlainContent(content => {
          const before = content.slice(0, change.position);
          const after = content.slice(change.position);
          return before + change.content + after;
        });
      }
      
      return prev.filter(c => c.id !== changeId);
    });
  };

  const rejectChange = (changeId) => {
    setTrackedChanges(prev => {
      const change = prev.find(c => c.id === changeId);
      if (!change) return prev;
      
      // Add to undo stack
      setUndoStack(stack => [...stack, { action: 'reject', change: { ...change } }]);
      
      return prev.filter(c => c.id !== changeId);
    });
  };

  const lockChange = (changeId) => {
    setTrackedChanges(prev => prev.map(c => 
      c.id === changeId ? { ...c, type: 'locked' } : c
    ));
  };

  const unlockChange = (changeId) => {
    setTrackedChanges(prev => prev.map(c => 
      c.id === changeId ? { ...c, type: 'pending' } : c
    ));
  };

  const acceptAllLocked = () => {
    const locked = trackedChanges.filter(c => c.type === 'locked');
    locked.forEach(change => acceptChange(change.id));
  };

  const handleUndo = () => {
    // First try to undo tracked changes
    if (undoStack.length > 0) {
      const lastAction = undoStack[undoStack.length - 1];
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, lastAction]);
      
      // Reverse the action
      if (lastAction.action === 'add') {
        setTrackedChanges(prev => prev.filter(c => c.id !== lastAction.change.id));
      } else if (lastAction.action === 'accept' || lastAction.action === 'reject') {
        setTrackedChanges(prev => [...prev, lastAction.change]);
      }
      return;
    }
    
    // Otherwise undo content change
    undoContentChange();
  };
  
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const action = redoStack[redoStack.length - 1];
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, action]);
      
      // Re-apply the action
      if (action.action === 'add') {
        setTrackedChanges(prev => [...prev, action.change]);
      } else if (action.action === 'accept' || action.action === 'reject') {
        setTrackedChanges(prev => prev.filter(c => c.id !== action.change.id));
      }
      return;
    }
    
    // Otherwise redo content change
    redoContentChange();
  };

  // ============================================
  // AI GENERATION WITH PREVIEW
  // ============================================
  
  // Build context-aware prompt with style and story context
  const buildContextualPrompt = async (userPrompt, options = {}) => {
    try {
      // Use storyBrain for context assembly (includes chapter memories, arc guidance, genre guides, craft directives)
      const action = options.action || 'continue';
      const textForContext = options.textUpToCursor || plainContent;
      const { systemContext } = await storyBrain.getContext({
        text: textForContext,
        chapterNumber: currentChapter?.chapterNumber || null,
        bookId: currentBook?.id || null,
        chapterId: currentChapter?.id || null,
        action
      });

      const craft = storyBrain.getCraftDirective(action, options.moodPreset || null);

      // Return as { system, user } so we can split them properly
      const system = `You are the author of this story. Write in the EXACT same voice, style, and rhythm as the existing text.

${craft}

${systemContext}

${options.customPrompt ? `CUSTOM INSTRUCTIONS:\n${options.customPrompt}\n` : ''}
${options.additionalInstructions || ''}`;

      return { system, user: userPrompt };
    } catch (error) {
      console.warn('Failed to build contextual prompt, using basic prompt:', error);
      return { system: '', user: userPrompt };
    }
  };

  const generateWithPreview = async (source, prompt, options = {}) => {
    setPreviewPanel({
      isOpen: true,
      content: '',
      source,
      confidence: 'high',
      originalSelection: options.originalSelection || null,
      isLoading: true
    });

    try {
      // Build context-aware prompt with storyBrain
      const { system, user } = await buildContextualPrompt(prompt, {
        additionalInstructions: options.additionalInstructions,
        action: options.action || 'continue'
      });

      const result = await aiService.callAI(user, 'creative', system);
      const cleanResult = result?.replace(/^["']|["']$/g, '').trim() || '';
      
      setPreviewPanel(prev => ({
        ...prev,
        content: cleanResult,
        isLoading: false,
        confidence: cleanResult.length > 500 ? 'high' : cleanResult.length > 200 ? 'medium' : 'low'
      }));
    } catch (error) {
      console.error('Generation failed:', error);
      setPreviewPanel(prev => ({ ...prev, isLoading: false, content: '' }));
    }
  };

  const handleInsertAtCursor = (content) => {
    const position = cursorPositionRef.current;
    
    if (writingMode === 'review') {
      // Add as tracked change
      addTrackedChange({
        content,
        position,
        source: previewPanel.source,
        confidence: previewPanel.confidence
      });
    } else {
      // Direct insert (draft mode)
      setPlainContent(prev => {
        const before = prev.slice(0, position);
        const after = prev.slice(position);
        return before + '\n\n' + content + after;
      });
    }
    
    setPreviewPanel({ isOpen: false, content: '', source: 'continue', isLoading: false });
  };

  // ============================================
  // AI WRITING FUNCTIONS
  // ============================================
  
  const handleContinueWriting = async (customPromptOverride = null) => {
    // Get cursor position - use current cursor or end of content if not available
    const cursorPos = textareaRef.current?.selectionStart ?? cursorPositionRef.current ?? plainContent.length;
    
    // Get content up to cursor position for context
    const textBeforeCursor = plainContent.slice(0, cursorPos);
    
    // If cursor is at the end, use last 2000 chars for context
    // If cursor is in middle, use content up to cursor (but limit to last 2000 for context building)
    const contextText = cursorPos === plainContent.length 
      ? plainContent.slice(-2000) 
      : textBeforeCursor.slice(-2000);
    
    const characterNames = actors.map(a => a.name).join(', ');
    
    // Build a more detailed prompt that emphasizes continuing from cursor
    const prompt = `You are continuing a story from a specific point. The cursor is positioned at character ${cursorPos} in the chapter.

CRITICAL INSTRUCTIONS:
- Read ONLY the chapter content up to the cursor position (shown below)
- Understand what has happened, where characters are, what they're doing
- Continue writing from the EXACT cursor position
- Do NOT rewrite what came before the cursor
- Do NOT start the chapter over
- Do NOT repeat events that already happened
- Just write 2-3 paragraphs that naturally continue from where the cursor is

Chapter content up to cursor position (this is where you continue from):
"""
${textBeforeCursor}
"""

Characters in this story: ${characterNames || 'Not specified'}

Write the next 2-3 paragraphs that naturally continue from the cursor position. Match the tone, style, and voice from the style profile and examples provided in the context above.

Do NOT explain what you're doing. Just write the continuation starting immediately after the cursor position.`;

    // Store cursor position for insertion
    cursorPositionRef.current = cursorPos;
    
    const finalCustomPrompt = customPromptOverride !== null ? customPromptOverride : customPromptContinue;
    
    await generateWithPreview('continue', prompt, {
      customPrompt: finalCustomPrompt,
      additionalInstructions: 'CRITICAL: Match the style profile exactly. Be witty, sarcastic, and emotionally hard-hitting as specified. Use the writing examples to match the voice. Continue from the cursor position - do not rewrite existing content. The cursor is at position ' + cursorPos + ' - continue from there, not from the beginning.',
      textUpToCursor: textBeforeCursor // Pass this so context engine can use it
    });
  };
  
  const showPromptModalForContinue = () => {
    setTempCustomPrompt(customPromptContinue);
    setPendingGeneration({
      type: 'continue',
      handler: handleContinueWriting,
      title: 'Continue Writing',
      description: 'Add any specific instructions or tips for continuing the story...'
    });
    setShowPromptModal(true);
  };

  const handleGenerateScene = async (customPromptOverride = null) => {
    const nextBeat = uncompletedBeats[0];
    const characterNames = actors.map(a => a.name).join(', ');
    
    // Build beat information
    let beatInfo = '';
    if (nextBeat) {
      beatInfo = `Plot beat to address: "${nextBeat.beat || nextBeat.purpose}"`;
      if (nextBeat.details) {
        beatInfo += `\nBeat details: ${nextBeat.details}`;
      }
    } else {
      // Show all uncompleted beats for context
      if (uncompletedBeats.length > 0) {
        const allBeats = uncompletedBeats.map(b => `- "${b.beat || b.purpose}"`).join('\n');
        beatInfo = `Upcoming plot beats for this chapter:\n${allBeats}`;
      } else {
        beatInfo = 'Continue the story naturally';
      }
    }
    
    // Load document context (Series Bible, story documents, etc.)
    let documentContext = '';
    try {
      const storyContextService = (await import('../services/storyContextService')).default;
      const docContext = await storyContextService.buildContextString().catch(() => '');
      if (docContext && docContext.trim().length > 0) {
        documentContext = `\n\n=== STORY DOCUMENTS & SERIES BIBLE ===\n${docContext}\n`;
      }
    } catch (error) {
      console.warn('Could not load document context for scene:', error);
    }
    
    const prompt = `Write a scene for this chapter. Match the tone, style, and voice from the style profile and examples provided in the context above.

${beatInfo}${documentContext}

Characters: ${characterNames || 'Use existing characters'}

Current chapter:
"""
${plainContent.slice(-1000)}
"""

Write the scene (3-5 paragraphs). Be vivid and engaging. Use the plot beats and story documents to guide the scene's direction:`;

    const finalCustomPrompt = customPromptOverride !== null ? customPromptOverride : customPromptScene;
    
    await generateWithPreview('scene', prompt, {
      customPrompt: finalCustomPrompt,
      additionalInstructions: 'CRITICAL: Match the style profile exactly. Be witty, sarcastic, and emotionally hard-hitting as specified. Use the writing examples to match the voice. Reference the plot beats and story documents to ensure the scene advances the story appropriately.'
    });
  };
  
  const showPromptModalForScene = () => {
    setTempCustomPrompt(customPromptScene);
    setPendingGeneration({
      type: 'scene',
      handler: handleGenerateScene,
      title: 'Generate Scene',
      description: 'Add any specific instructions or tips for the scene generation...'
    });
    setShowPromptModal(true);
  };

  const handleAddDialogue = async (customPromptOverride = null) => {
    const characterNames = actors.slice(0, 4).map(a => a.name).join(', ');
    
    const prompt = `Write a dialogue exchange (4-8 lines) continuing from this scene. Make dialogue sharp and character-specific. Match the tone, style, and voice from the style profile and examples provided in the context above.

Characters: ${characterNames || 'Use characters from context'}

Scene:
"""
${plainContent.slice(-1000)}
"""

Write the dialogue:`;

    const finalCustomPrompt = customPromptOverride !== null ? customPromptOverride : customPromptDialogue;
    
    await generateWithPreview('dialogue', prompt, {
      customPrompt: finalCustomPrompt,
      additionalInstructions: 'CRITICAL: Match the style profile exactly. Be witty, sarcastic, and emotionally hard-hitting as specified. Use the writing examples to match the voice.'
    });
  };
  
  const showPromptModalForDialogue = () => {
    setTempCustomPrompt(customPromptDialogue);
    setPendingGeneration({
      type: 'dialogue',
      handler: handleAddDialogue,
      title: 'Add Dialogue',
      description: 'Add any specific instructions or tips for the dialogue...'
    });
    setShowPromptModal(true);
  };

  const handleAddDescription = async (customPromptOverride = null) => {
    const prompt = `Write a rich descriptive paragraph. Focus on sensory details - sight, sound, smell, texture. Match the tone, style, and voice from the style profile and examples provided in the context above.

Current scene:
"""
${plainContent.slice(-800)}
"""

Write 1-2 descriptive paragraphs:`;

    const finalCustomPrompt = customPromptOverride !== null ? customPromptOverride : customPromptDescription;
    
    await generateWithPreview('description', prompt, {
      customPrompt: finalCustomPrompt,
      additionalInstructions: 'CRITICAL: Match the style profile exactly. Be witty, sarcastic, and emotionally hard-hitting as specified. Use the writing examples to match the voice.'
    });
  };
  
  const showPromptModalForDescription = () => {
    setTempCustomPrompt(customPromptDescription);
    setPendingGeneration({
      type: 'description',
      handler: handleAddDescription,
      title: 'Add Description',
      description: 'Add any specific instructions or tips for the description...'
    });
    setShowPromptModal(true);
  };

  const handleAddCharacter = async (customPromptOverride = null) => {
    const existingCharacters = actors.map(a => a.name).join(', ');
    
    const prompt = `Write an introduction for a NEW character entering this scene. Make them memorable and fitting for the style described in the style profile and examples provided in the context above.

Existing characters: ${existingCharacters || 'Not specified'}

Scene context:
"""
${plainContent.slice(-800)}
"""

Write 1-2 paragraphs introducing a new character:`;

    const finalCustomPrompt = customPromptOverride !== null ? customPromptOverride : customPromptCharacter;
    
    await generateWithPreview('character', prompt, {
      customPrompt: finalCustomPrompt,
      additionalInstructions: 'CRITICAL: Match the style profile exactly. Be witty, sarcastic, and emotionally hard-hitting as specified. Use the writing examples to match the voice.'
    });
  };
  
  const showPromptModalForCharacter = () => {
    setTempCustomPrompt(customPromptCharacter);
    setPendingGeneration({
      type: 'character',
      handler: handleAddCharacter,
      title: 'Add Character',
      description: 'Add any specific instructions or tips for the character introduction...'
    });
    setShowPromptModal(true);
  };
  
  const handlePromptModalConfirm = () => {
    if (pendingGeneration) {
      // Update the corresponding custom prompt state
      switch (pendingGeneration.type) {
        case 'continue':
          setCustomPromptContinue(tempCustomPrompt);
          break;
        case 'scene':
          setCustomPromptScene(tempCustomPrompt);
          break;
        case 'dialogue':
          setCustomPromptDialogue(tempCustomPrompt);
          break;
        case 'description':
          setCustomPromptDescription(tempCustomPrompt);
          break;
        case 'character':
          setCustomPromptCharacter(tempCustomPrompt);
          break;
      }
      
      // Call the handler with the custom prompt
      pendingGeneration.handler(tempCustomPrompt);
    }
    setShowPromptModal(false);
    setPendingGeneration(null);
    setTempCustomPrompt('');
  };
  
  const handlePromptModalCancel = () => {
    setShowPromptModal(false);
    setPendingGeneration(null);
    setTempCustomPrompt('');
  };

  // ============================================
  // TEXT SELECTION HANDLING
  // ============================================
  
  // Timer ref for delayed toolbar display
  const selectionTimerRef = useRef(null);
  
  const handleTextSelect = (e) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Clear any existing timer
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end).trim();
    
    cursorPositionRef.current = start;
    
    if (text && text.length > 3 && start !== end) {
      setSelectedText(text);
      setSelectionRange({ start, end });
      
      // DELAY showing toolbar by 300ms to allow double-click selections to complete
      selectionTimerRef.current = setTimeout(() => {
        const textareaRect = textarea.getBoundingClientRect();
        const textBefore = textarea.value.substring(0, end); // Use END position
        const lines = textBefore.split('\n');
        const lineNumber = lines.length;
        
        const lineHeight = 24;
        
        // Position BELOW the selection (not above) - add offset to not interfere
        const approxY = textareaRect.top + (lineNumber * lineHeight) - textarea.scrollTop + 30;
        
        // Center horizontally over the selection
        const selectionMidpoint = (start + end) / 2;
        const charsBeforeMid = textarea.value.substring(0, selectionMidpoint).split('\n').pop()?.length || 0;
        const approxX = textareaRect.left + (charsBeforeMid * 9.6);
        
        setSelectionPosition({
          x: Math.max(20, Math.min(approxX - 150, window.innerWidth - 450)),
          y: Math.max(120, Math.min(approxY, window.innerHeight - 200))
        });
        setShowSelectionTools(true);
      }, 300); // 300ms delay
    } else {
      setShowSelectionTools(false);
    }
  };
  
  // Hide toolbar when clicking elsewhere
  const handleTextareaClick = (e) => {
    // Only hide if clicking, not selecting
    if (e.detail === 1 && !window.getSelection()?.toString()) {
      setShowSelectionTools(false);
    }
  };

  // Selection-based AI operations
  const handleRewriteSelection = async () => {
    if (!selectedText || !selectionRange) return;
    
    const prompt = `Rewrite this text, keeping the same meaning but improving clarity and style. Match the writing voice from the style profile and examples provided in the context above.

Text to rewrite:
"${selectedText}"

Only return the rewritten text (no explanations):`;

    await generateWithPreview('rewrite', prompt, { 
      originalSelection: selectedText,
      additionalInstructions: 'CRITICAL: Match the style profile exactly. Be witty, sarcastic, and emotionally hard-hitting as specified.'
    });
    setShowSelectionTools(false);
  };

  const handleExpandSelection = async () => {
    if (!selectedText || !selectionRange) return;
    
    const prompt = `Expand this text with more detail and description. Match the writing voice from the style profile and examples provided in the context above.

Text to expand:
"${selectedText}"

Only return the expanded text (no explanations):`;

    await generateWithPreview('rewrite', prompt, { 
      originalSelection: selectedText,
      additionalInstructions: 'CRITICAL: Match the style profile exactly. Be witty, sarcastic, and emotionally hard-hitting as specified.'
    });
    setShowSelectionTools(false);
  };

  const handleMakeFunnier = async () => {
    if (!selectedText || !selectionRange) return;
    
    const prompt = `Make this FUNNIER while keeping the plot intact. Add wit, sarcasm, absurd details, and comedic timing. Use the style profile and examples provided in the context above to match the writing voice.

Text to rewrite:
"${selectedText}"

Only return the rewritten text (no explanations):`;

    await generateWithPreview('rewrite', prompt, { 
      originalSelection: selectedText,
      additionalInstructions: 'CRITICAL: Match the comedy style from the style profile. Be witty, sarcastic, and absurd as specified. Use the humor patterns shown in the writing examples.'
    });
    setShowSelectionTools(false);
  };

  const handleMakeDarker = async () => {
    if (!selectedText || !selectionRange) return;
    
    const prompt = `Make this DARKER and more OMINOUS. Add dread, unease, and horror undertones. Use the style profile and examples provided in the context above to match the writing voice.

Text to rewrite:
"${selectedText}"

Only return the rewritten text (no explanations):`;

    await generateWithPreview('rewrite', prompt, { 
      originalSelection: selectedText,
      additionalInstructions: 'CRITICAL: Match the horror/dark tone from the style profile. Be unsettling and ominous as specified. Use the dark comedy patterns shown in the writing examples.'
    });
    setShowSelectionTools(false);
  };

  // Quick mood rewrite handlers - one-click mood adjustments
  const handleQuickMoodRewrite = async (moodPreset) => {
    if (!selectedText || !selectionRange) return;
    
    const presets = {
      comedy: { comedy_horror: 20, tension: 40, pacing: 60, detail: 50, emotional: 50, darkness: 30, absurdity: 80, formality: 30 },
      horror: { comedy_horror: 80, tension: 80, pacing: 50, detail: 70, emotional: 60, darkness: 90, absurdity: 20, formality: 50 },
      tense: { comedy_horror: 50, tension: 90, pacing: 70, detail: 40, emotional: 70, darkness: 60, absurdity: 30, formality: 50 },
      relaxed: { comedy_horror: 50, tension: 20, pacing: 30, detail: 60, emotional: 30, darkness: 30, absurdity: 50, formality: 40 },
      fast: { comedy_horror: 50, tension: 60, pacing: 90, detail: 30, emotional: 50, darkness: 50, absurdity: 60, formality: 30 },
      slow: { comedy_horror: 50, tension: 40, pacing: 20, detail: 80, emotional: 60, darkness: 50, absurdity: 30, formality: 60 },
      rich: { comedy_horror: 50, tension: 50, pacing: 40, detail: 90, emotional: 60, darkness: 50, absurdity: 40, formality: 50 },
      sparse: { comedy_horror: 50, tension: 50, pacing: 60, detail: 20, emotional: 40, darkness: 50, absurdity: 50, formality: 40 },
      intense: { comedy_horror: 60, tension: 80, pacing: 70, detail: 60, emotional: 90, darkness: 70, absurdity: 40, formality: 50 },
      detached: { comedy_horror: 50, tension: 30, pacing: 50, detail: 50, emotional: 20, darkness: 40, absurdity: 50, formality: 60 },
      dark: { comedy_horror: 70, tension: 70, pacing: 50, detail: 60, emotional: 60, darkness: 90, absurdity: 20, formality: 50 },
      light: { comedy_horror: 30, tension: 30, pacing: 50, detail: 50, emotional: 40, darkness: 20, absurdity: 70, formality: 40 },
      absurd: { comedy_horror: 50, tension: 40, pacing: 60, detail: 50, emotional: 50, darkness: 30, absurdity: 90, formality: 20 },
      grounded: { comedy_horror: 50, tension: 50, pacing: 50, detail: 60, emotional: 50, darkness: 50, absurdity: 10, formality: 50 },
      formal: { comedy_horror: 50, tension: 50, pacing: 40, detail: 60, emotional: 40, darkness: 50, absurdity: 30, formality: 90 },
      casual: { comedy_horror: 50, tension: 50, pacing: 60, detail: 40, emotional: 50, darkness: 50, absurdity: 60, formality: 20 }
    };
    
    const preset = presets[moodPreset];
    if (!preset) return;
    
    // Build detailed mood description with style guidance
    const moodDescriptions = [];
    if (preset.comedy_horror < 40) moodDescriptions.push('FUNNY and ABSURD - use wit, sarcasm, and comedic timing');
    else if (preset.comedy_horror > 60) moodDescriptions.push('HORROR and DREAD - unsettling, ominous, dark');
    if (preset.tension > 70) moodDescriptions.push('HIGH TENSION - urgent, anxious, on-edge');
    else if (preset.tension < 30) moodDescriptions.push('RELAXED - calm, measured, peaceful');
    if (preset.pacing > 70) moodDescriptions.push('FAST-PACED - snappy, quick, rapid-fire');
    else if (preset.pacing < 30) moodDescriptions.push('SLOW - contemplative, measured, detailed');
    if (preset.detail > 70) moodDescriptions.push('RICH DETAIL - sensory, immersive, vivid');
    else if (preset.detail < 30) moodDescriptions.push('SPARSE - minimal, essential only');
    if (preset.absurdity > 70) moodDescriptions.push('ABSURDIST - surreal, ridiculous, over-the-top');
    else if (preset.absurdity < 30) moodDescriptions.push('GROUNDED - realistic, believable');
    if (preset.darkness > 70) moodDescriptions.push('DARK - bleak, heavy, ominous');
    else if (preset.darkness < 30) moodDescriptions.push('LIGHT - bright, optimistic');
    if (preset.formality > 70) moodDescriptions.push('FORMAL - proper, structured, dignified');
    else if (preset.formality < 30) moodDescriptions.push('CASUAL - conversational, relaxed');
    
    const moodGuide = `Rewrite this text with these EXACT mood characteristics: ${moodDescriptions.join(', ')}.

Mood Settings: Comedy/Horror: ${preset.comedy_horror}%, Tension: ${preset.tension}%, Pacing: ${preset.pacing}%, Detail: ${preset.detail}%, Emotional: ${preset.emotional}%, Darkness: ${preset.darkness}%, Absurdity: ${preset.absurdity}%, Formality: ${preset.formality}%

Keep the same events/meaning but transform the tone and style to match these settings EXACTLY.`;
    
    const prompt = `${moodGuide}

Text to rewrite:
"${selectedText}"

Only return the rewritten text (no explanations):`;

    await generateWithPreview('rewrite', prompt, { 
      originalSelection: selectedText,
      additionalInstructions: 'CRITICAL: Match the style profile and writing examples provided in the context above. Be witty, sarcastic, and emotionally hard-hitting as specified. Do NOT write generic prose.'
    });
    setShowSelectionTools(false);
  };

  // Regenerate content using the current mood settings
  const handleRegenerateWithMood = async (textToRewrite) => {
    const text = textToRewrite || selectedText;
    if (!text) return;
    
    // Build detailed mood description from settings
    const moodDescriptions = [];
    if (moodSettings.comedy_horror > 60) moodDescriptions.push('HORROR and DREAD - unsettling, ominous, dark');
    else if (moodSettings.comedy_horror < 40) moodDescriptions.push('FUNNY and ABSURD - use wit, sarcasm, comedic timing');
    if (moodSettings.tension > 60) moodDescriptions.push('HIGH TENSION - urgent, anxious, on-edge');
    else if (moodSettings.tension < 40) moodDescriptions.push('RELAXED - calm, measured, peaceful');
    if (moodSettings.pacing > 60) moodDescriptions.push('FAST-PACED - snappy, quick, rapid-fire');
    else if (moodSettings.pacing < 40) moodDescriptions.push('SLOW - contemplative, measured, detailed');
    if (moodSettings.detail > 60) moodDescriptions.push('RICH DETAIL - sensory, immersive, vivid');
    else if (moodSettings.detail < 40) moodDescriptions.push('SPARSE - minimal, essential only');
    if (moodSettings.emotional > 60) moodDescriptions.push('EMOTIONALLY INTENSE - charged, impactful');
    if (moodSettings.darkness > 60) moodDescriptions.push('DARK - bleak, heavy, ominous');
    if (moodSettings.absurdity > 60) moodDescriptions.push('ABSURDIST - surreal, ridiculous, over-the-top');
    if (moodSettings.formality > 60) moodDescriptions.push('FORMAL - proper, structured, dignified');
    else if (moodSettings.formality < 40) moodDescriptions.push('CASUAL - conversational, relaxed');
    
    const moodGuide = moodDescriptions.length > 0 
      ? `Apply these EXACT mood characteristics: ${moodDescriptions.join(', ')}.` 
      : 'Maintain a balanced tone matching the style profile.';
    
    const moodSettingsDesc = `Comedy/Horror: ${moodSettings.comedy_horror}%, Tension: ${moodSettings.tension}%, Pacing: ${moodSettings.pacing}%, Detail: ${moodSettings.detail}%, Emotional: ${moodSettings.emotional}%, Darkness: ${moodSettings.darkness}%, Absurdity: ${moodSettings.absurdity}%, Formality: ${moodSettings.formality}%`;
    
    const prompt = `Rewrite this text with adjusted mood. ${moodGuide}

Mood Settings: ${moodSettingsDesc}

Keep the same events/meaning but transform the tone and style to match these settings EXACTLY.

Text to rewrite:
"${text}"

Only return the rewritten text (no explanations):`;

    await generateWithPreview('rewrite', prompt, { 
      originalSelection: text,
      additionalInstructions: 'CRITICAL: Match the style profile and writing examples provided in the context above. Be witty, sarcastic, and emotionally hard-hitting as specified. Do NOT write generic prose.'
    });
  };

  // ============================================
  // REVIEW SUGGESTIONS
  // ============================================
  
  const handleReview = async () => {
    setReviewPanel({ isOpen: true, suggestions: [], isLoading: true });
    
    try {
      const textToAnalyze = plainContent.slice(-3000);
      
      const taskPrompt = `Analyze this text and provide specific, actionable suggestions. Return as JSON array:

[
  {
    "id": "1",
    "type": "flow|dialogue|description|consistency|grammar|style|character|tension|clarity",
    "description": "Brief description of the issue",
    "originalText": "The problematic text (if applicable)",
    "suggestedText": "The improved version",
    "confidence": "high|medium|low"
  }
]

Focus on: Flow, dialogue quality, description balance, character voice, grammar.

Text:
"""
${textToAnalyze}
"""

Return ONLY the JSON array:`;

      // Build contextual prompt with storyBrain
      const { system, user } = await buildContextualPrompt(taskPrompt, {
        customPrompt: customPromptReview,
        additionalInstructions: 'CRITICAL: Match the style profile exactly when making suggestions.',
        action: 'improve'
      });

      const result = await aiService.callAI(user, 'analytical', system);
      
      // Parse suggestions
      let suggestions = [];
      try {
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Failed to parse suggestions:', e);
      }
      
      setReviewPanel({ isOpen: true, suggestions, isLoading: false });
    } catch (error) {
      console.error('Review failed:', error);
      setReviewPanel(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleApplySuggestions = (selectedSuggestions) => {
    selectedSuggestions.forEach(suggestion => {
      if (suggestion.suggestedText) {
        addTrackedChange({
          content: suggestion.suggestedText,
          originalContent: suggestion.originalText,
          source: 'review',
          confidence: suggestion.confidence || 'medium',
          suggestionType: suggestion.type,
          position: cursorPositionRef.current // Or find actual position
        });
      }
    });
  };

  // ============================================
  // MOOD REWRITE
  // ============================================
  
  const handleMoodRewrite = async () => {
    if (!selectedText && !selectionRange) {
      alert('Please select text to rewrite with mood settings');
      return;
    }
    
    const textToRewrite = selectedText || plainContent.slice(-500);
    
    setMoodRewritePanel({
      isOpen: true,
      originalContent: textToRewrite,
      rewrittenContent: '',
      moodSettings,
      isLoading: true
    });
    
    try {
      const moodDesc = `Comedy/Horror: ${moodSettings.comedy_horror}%, Tension: ${moodSettings.tension}%, Pacing: ${moodSettings.pacing}%, Detail: ${moodSettings.detail}%, Emotional: ${moodSettings.emotional}%`;

      const { system } = await buildContextualPrompt('', { action: 'mood' });

      const prompt = `Rewrite this text with adjusted mood settings:
${moodDesc}

Higher comedy = funnier, Higher tension = more suspense, Higher pacing = faster action, Higher detail = more description, Higher emotional = more feelings.

Original:
"${textToRewrite}"

Rewrite with the mood adjustments. Only return the rewritten text:`;

      const result = await aiService.callAI(prompt, 'creative', system);
      const cleanResult = result?.replace(/^["']|["']$/g, '').trim() || '';
      
      setMoodRewritePanel(prev => ({
        ...prev,
        rewrittenContent: cleanResult,
        isLoading: false
      }));
    } catch (error) {
      console.error('Mood rewrite failed:', error);
      setMoodRewritePanel(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleAcceptMoodRewrite = (rewrittenContent) => {
    if (writingMode === 'review') {
      addTrackedChange({
        content: rewrittenContent,
        originalContent: moodRewritePanel.originalContent,
        source: 'mood-rewrite',
        confidence: 'high',
        moodSettings: { ...moodSettings },
        position: selectionRange?.start || cursorPositionRef.current
      });
    } else {
      // Direct replace in draft mode
      if (selectionRange) {
        setPlainContent(prev => {
          const before = prev.slice(0, selectionRange.start);
          const after = prev.slice(selectionRange.end);
          return before + rewrittenContent + after;
        });
      }
    }
    
    setMoodRewritePanel({ isOpen: false, originalContent: '', rewrittenContent: '', moodSettings: null, isLoading: false });
  };

  // ============================================
  // RENDER
  // ============================================
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 p-8">
        <LoadingSkeleton.Chapter className="w-full max-w-4xl" />
        <div className="mt-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          <span className="text-slate-400">Loading Pro Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* ============================================ */}
      {/* HEADER BAR */}
      {/* ============================================ */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-sm z-20">
        <div className="flex items-center gap-4">
          {/* Pro Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 
            border border-amber-500/30 rounded-full">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">PRO STUDIO</span>
          </div>
          
          {/* Book Navigation & Chapter Selector */}
          <div className="relative flex items-center gap-2">
            {/* Book Navigation Arrows */}
            {(() => {
              const sortedBooks = books ? [...books].sort((a, b) => a.id - b.id) : [];
              const currentBookIndex = currentBook ? sortedBooks.findIndex(b => b.id === currentBook.id) : -1;
              const canGoPrev = currentBookIndex > 0;
              const canGoNext = currentBookIndex < sortedBooks.length - 1 && currentBookIndex >= 0;
              
              return (
                <>
                  <button
                    onClick={() => navigateToBook('prev')}
                    disabled={!canGoPrev || sortedBooks.length <= 1}
                    className="p-2 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-lg border-2 border-purple-500 hover:border-purple-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-purple-600 disabled:hover:border-purple-500 transition-all shadow-lg hover:shadow-purple-500/50"
                    title="Previous Book"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {/* Book Name Display */}
                  {currentBook && (
                    <div className="px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="text-xs text-slate-400">Book</div>
                      <div className="text-sm font-medium text-white">{currentBook.title}</div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => navigateToBook('next')}
                    disabled={!canGoNext || sortedBooks.length <= 1}
                    className="p-2 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-lg border-2 border-purple-500 hover:border-purple-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-purple-600 disabled:hover:border-purple-500 transition-all shadow-lg hover:shadow-purple-500/50"
                    title="Next Book"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              );
            })()}
            
            {/* Chapter Selector */}
            <button
              onClick={() => setShowChapterSelector(!showChapterSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-white">
                {currentChapter?.title || 'Select Chapter'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showChapterSelector ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white 
                transition-colors"
              title="Chapter Templates - Apply pre-built structures"
            >
              <FileText className="w-4 h-4" />
            </button>

            {showChapterSelector && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-700 
                rounded-lg shadow-xl z-30 max-h-80 overflow-y-auto">
                {allChapters.map(chapter => (
                  <button
                    key={`${chapter.bookId}-${chapter.id}`}
                    onClick={() => {
                      loadChapter(chapter);
                      setShowChapterSelector(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors
                      ${currentChapter?.id === chapter.id ? 'bg-amber-500/20 border-l-2 border-amber-500' : ''}`}
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">{chapter.title}</div>
                      <div className="text-xs text-slate-400">{chapter.wordCount || 0} words</div>
                    </div>
                    {chapter.completed && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Word count with goal progress */}
          <div className="text-sm text-slate-400">
            <span className="text-white font-medium">{wordCount.toLocaleString()}</span> words
            {currentChapter?.wordCountGoal && (
              <div className="text-xs mt-0.5">
                <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${Math.min((wordCount / currentChapter.wordCountGoal) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-slate-500">
                  {Math.round((wordCount / currentChapter.wordCountGoal) * 100)}% of goal
                </span>
              </div>
            )}
          </div>
          
          {/* Auto-save indicator */}
          <div className="flex items-center gap-2 text-xs">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                <span className="text-amber-500">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-green-500">Saved</span>
                <span className="text-slate-500">
                  {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Writing Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setWritingMode('draft')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                ${writingMode === 'draft' 
                  ? 'bg-amber-500 text-white' 
                  : 'text-slate-400 hover:text-white'}`}
            >
              <Edit3 className="w-4 h-4 inline mr-1" />
              Draft
            </button>
            <button
              onClick={() => setWritingMode('review')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                ${writingMode === 'review' 
                  ? 'bg-amber-500 text-white' 
                  : 'text-slate-400 hover:text-white'}`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Review
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0 && historyIndex < 0}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={`Undo (Ctrl+Z) - ${contentHistory.length} snapshots saved`}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0 && historyIndex >= contentHistory.length - 1}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Last saved */}
          {lastSaved && (
            <span className="text-xs text-slate-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}

          {/* Save & Extract button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 
              disabled:bg-slate-700 rounded-lg text-white font-medium transition-colors"
            title="Save chapter and extract entities (triggers Entity Extraction Wizard)"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            SAVE & EXTRACT
          </button>

          {/* Panel toggles */}
          <div className="flex items-center gap-1 ml-2 border-l border-slate-700 pl-3">
            <button
              onClick={() => setShowContextPanel(!showContextPanel)}
              className={`p-2 rounded transition-colors ${showContextPanel ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-white'}`}
              title="Toggle Smart Context"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowMoodPanel(!showMoodPanel)}
              className={`p-2 rounded transition-colors ${showMoodPanel ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-white'}`}
              title="Toggle Mood Panel"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGoalsPanel(!showGoalsPanel)}
              className={`p-2 rounded transition-colors ${showGoalsPanel ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-white'}`}
              title="Toggle Writing Goals"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTimerPanel(!showTimerPanel)}
              className={`p-2 rounded transition-colors ${showTimerPanel ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
              title="Toggle Focus Timer"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowStyleRefPanel(!showStyleRefPanel)}
              className={`p-2 rounded transition-colors ${showStyleRefPanel ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-white'}`}
              title="Toggle Style Reference Manager"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowStatsPanel(!showStatsPanel)}
              className={`p-2 rounded transition-colors ${showStatsPanel ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-white'}`}
              title="Toggle Writing Statistics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowWritingFeatures(!showWritingFeatures)}
              className={`p-2 rounded transition-colors ${showWritingFeatures ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-white'}`}
              title="Toggle Writing Enhancement Features"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            {/* Pacing Analyzer button */}
            <button
              onClick={() => setShowPacingPanel(v => !v)}
              className={`p-2 rounded transition-colors ${showPacingPanel ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500 hover:text-white'}`}
              title="Pacing Analyzer — dialogue/action/description ratio"
            >
              <Activity className="w-4 h-4" />
            </button>
            {/* Scene Starters */}
            <button
              onClick={() => setShowSceneStarters(v => !v)}
              className={`p-2 rounded transition-colors ${showSceneStarters ? 'bg-green-500/20 text-green-400' : 'text-slate-500 hover:text-white'}`}
              title="Scene Starter Templates"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            {/* Chapter Summary */}
            <button
              onClick={() => chapterSummary ? setShowSummaryPanel(v => !v) : generateChapterSummary(plainContent)}
              disabled={isGeneratingSummary}
              className={`p-2 rounded transition-colors ${showSummaryPanel ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-white'}`}
              title={chapterSummary ? 'Toggle Chapter Summary' : 'Generate Chapter Summary (AI)'}
            >
              <FileText className="w-4 h-4" />
            </button>
            {/* Plot Hole Alerts */}
            {plotHoleAlerts.length > 0 && (
              <button
                onClick={() => setShowPlotHolePanel(v => !v)}
                className="p-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 relative"
                title={`${plotHoleAlerts.length} potential plot issues detected`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {plotHoleAlerts.length}
                </span>
              </button>
            )}
            {/* Beta Reader Export */}
            <button
              onClick={() => setShowBetaExportModal(true)}
              className="p-2 rounded transition-colors text-slate-500 hover:text-indigo-400"
              title="Beta Reader Portal — export chapter for beta readers"
            >
              <Users className="w-4 h-4" />
            </button>
            {betaImportAnnotations.length > 0 && (
              <button
                onClick={() => setShowBetaAnnotations(v => !v)}
                className={`p-2 rounded transition-colors relative ${showBetaAnnotations ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                title={`${betaImportAnnotations.length} beta reader comment${betaImportAnnotations.length > 1 ? 's' : ''}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {betaImportAnnotations.length}
                </span>
              </button>
            )}
            <button
              onClick={toggleFocusMode}
              className={`p-2 rounded transition-colors ${focusMode ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
              title="Focus Mode - Dim everything except current paragraph (F11 for fullscreen)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded transition-colors ${fullscreenMode ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-white'}`}
              title="Fullscreen Mode (F11)"
            >
              {fullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================ */}
      <div className={`flex-1 flex overflow-hidden relative ${fullscreenMode ? 'fixed inset-0 z-50 bg-slate-950' : ''} ${focusMode ? 'focus-mode' : ''}`}>
        {/* Main Editor */}
        <div className={`flex-1 p-4 overflow-y-auto ${focusMode ? 'focus-mode-active' : ''}`}>
          <div className="flex flex-col pb-8 min-h-full">
            {/* Chapter title */}
            <input
              type="text"
              value={currentChapter?.title || ''}
              onChange={(e) => setCurrentChapter(prev => ({ ...prev, title: e.target.value }))}
              className={`text-2xl font-bold text-white bg-transparent border-none outline-none mb-4 placeholder-slate-600 transition-opacity ${focusMode ? 'opacity-30' : ''}`}
              placeholder="Chapter Title..."
            />

            {/* Main textarea with focus mode support */}
            <div className="relative flex-1 min-h-[400px]">
              {focusMode && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {plainContent.split('\n\n').map((para, idx) => (
                    <div
                      key={idx}
                      className={`absolute inset-0 bg-slate-950/80 transition-opacity duration-300 ${
                        idx === focusedParagraph ? 'opacity-0' : 'opacity-100'
                      }`}
                      style={{ top: `${idx * 20}%` }}
                    />
                  ))}
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={plainContent}
                onChange={handleContentChange}
                onSelect={handleTextSelect}
                onMouseUp={handleTextSelect}
                onKeyUp={handleTextSelect}
                onContextMenu={(e) => {
                  // Only show context menu if text is selected
                  if (selectedText && selectedText.trim().length > 0) {
                    e.preventDefault();
                    setContextMenuPosition({ x: e.clientX, y: e.clientY });
                  }
                }}
                onClick={(e) => {
                  handleTextareaClick(e);
                  if (focusMode) {
                    const cursorPos = e.target.selectionStart;
                    const textBefore = plainContent.substring(0, cursorPos);
                    const paragraphs = textBefore.split('\n\n');
                    setFocusedParagraph(paragraphs.length - 1);
                  }
                  // Close context menu when clicking
                  setContextMenuPosition(null);
                }}
                className="flex-1 w-full bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-slate-200 
                  placeholder-slate-600 resize-none outline-none focus:ring-2 focus:ring-amber-500/30 
                  focus:border-amber-500/50 transition-all font-mono text-base leading-relaxed relative z-0"
                placeholder="Start writing your chapter here..."
                style={{ minHeight: '400px' }}
              />
            </div>
            
            {/* Tracked Changes Display */}
            {trackedChanges.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm text-amber-400 font-medium">
                  Pending Changes ({trackedChanges.filter(c => c.type === 'pending').length})
                </div>
                {trackedChanges.map(change => (
                  <ChangeBox
                    key={change.id}
                    id={change.id}
                    type={change.type}
                    content={change.content}
                    source={change.source}
                    confidence={change.confidence}
                    onAccept={acceptChange}
                    onReject={rejectChange}
                    onLock={lockChange}
                    onUnlock={unlockChange}
                  />
                ))}
              </div>
            )}

            {/* AI Writing Tools Toolbar */}
            <div className="mt-3 mb-4 bg-slate-800/70 rounded-xl border border-slate-700 overflow-visible relative">
              {/* Style Connection Indicator */}
              {currentChapter?.id && currentBook?.id && (
                <StyleConnectionIndicator
                  chapterId={currentChapter.id}
                  bookId={currentBook.id}
                  position="top-right"
                  size="small"
                />
              )}
              
              <div className="flex items-center justify-between p-2 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 px-2 font-medium">✨ AI Write:</span>
                  
                  <button
                    onClick={showPromptModalForContinue}
                    disabled={isGenerating}
                    title="AI writes the next 2-3 paragraphs continuing from your last sentence"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 
                      hover:from-amber-500 hover:to-amber-400 disabled:from-slate-600 disabled:to-slate-600
                      rounded-lg text-white text-xs font-medium transition-all shadow-lg shadow-amber-500/20"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Continue
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowReadAloudPanel(true);
                      setSelectedText(''); // Clear selection to read full chapter
                    }}
                    disabled={!plainContent}
                    title="Read entire chapter aloud"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 
                      hover:from-blue-500 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-600
                      rounded-lg text-white text-xs font-medium transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Read Chapter
                  </button>
                  
                  <button
                    onClick={showPromptModalForScene}
                    disabled={isGenerating}
                    title="Generate a complete scene based on your plot beats and story context"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500 
                      hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-600 disabled:to-slate-600
                      rounded-lg text-white text-xs font-medium transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Scene
                  </button>
                  
                  <button
                    onClick={showPromptModalForDialogue}
                    disabled={isGenerating}
                    title="Add a conversation between characters with distinct voices"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 
                      hover:from-purple-500 hover:to-purple-400 disabled:from-slate-600 disabled:to-slate-600
                      rounded-lg text-white text-xs font-medium transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Dialogue
                  </button>
                  
                  <button
                    onClick={showPromptModalForDescription}
                    disabled={isGenerating}
                    title="Add rich sensory details and atmospheric description"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 
                      hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-600 disabled:to-slate-600
                      rounded-lg text-white text-xs font-medium transition-all"
                  >
                    <Image className="w-3.5 h-3.5" />
                    Describe
                  </button>
                  
                  <button
                    onClick={showPromptModalForCharacter}
                    disabled={isGenerating}
                    title="Introduce a new character with an engaging entrance"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-pink-500 
                      hover:from-pink-500 hover:to-pink-400 disabled:from-slate-600 disabled:to-slate-600
                      rounded-lg text-white text-xs font-medium transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Character
                  </button>
                </div>
                
                <button
                  onClick={handleReview}
                  disabled={isGenerating}
                  title="Check your chapter for consistency, pacing and style issues"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 
                    rounded-lg text-slate-300 text-xs transition-all"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Review
                </button>
              </div>
              
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/50 text-xs">
                <span className="text-slate-500">
                  💡 Select text for: Rewrite • Expand • Funnier • Darker • Mood Rewrite
                </span>
                <span className="text-slate-600">
                  {writingMode === 'review' 
                    ? '🔍 Review Mode: Changes tracked' 
                    : '✏️ Draft Mode: Direct writing'}
                </span>
              </div>
              
              {/* Custom Prompts Section */}
              <details className="border-t border-slate-700/50">
                <summary className="px-3 py-2 text-xs text-slate-400 hover:text-slate-300 cursor-pointer">
                  Custom Prompts (Optional)
                </summary>
                <div className="p-3 space-y-3 bg-slate-900/50">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Continue Writing</label>
                    <textarea
                      value={customPromptContinue}
                      onChange={(e) => setCustomPromptContinue(e.target.value)}
                      placeholder="Optional: Add specific instructions for continuing..."
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2 py-1.5 rounded resize-y min-h-[50px] max-h-[100px]"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5">{customPromptContinue.length}/500</div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Generate Scene</label>
                    <textarea
                      value={customPromptScene}
                      onChange={(e) => setCustomPromptScene(e.target.value)}
                      placeholder="Optional: Add specific instructions for scene generation..."
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2 py-1.5 rounded resize-y min-h-[50px] max-h-[100px]"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5">{customPromptScene.length}/500</div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Add Dialogue</label>
                    <textarea
                      value={customPromptDialogue}
                      onChange={(e) => setCustomPromptDialogue(e.target.value)}
                      placeholder="Optional: Add specific instructions for dialogue..."
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2 py-1.5 rounded resize-y min-h-[50px] max-h-[100px]"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5">{customPromptDialogue.length}/500</div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Add Description</label>
                    <textarea
                      value={customPromptDescription}
                      onChange={(e) => setCustomPromptDescription(e.target.value)}
                      placeholder="Optional: Add specific instructions for description..."
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2 py-1.5 rounded resize-y min-h-[50px] max-h-[100px]"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5">{customPromptDescription.length}/500</div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Add Character</label>
                    <textarea
                      value={customPromptCharacter}
                      onChange={(e) => setCustomPromptCharacter(e.target.value)}
                      placeholder="Optional: Add specific instructions for character introduction..."
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2 py-1.5 rounded resize-y min-h-[50px] max-h-[100px]"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5">{customPromptCharacter.length}/500</div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Review</label>
                    <textarea
                      value={customPromptReview}
                      onChange={(e) => setCustomPromptReview(e.target.value)}
                      placeholder="Optional: Add specific instructions for review..."
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2 py-1.5 rounded resize-y min-h-[50px] max-h-[100px]"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5">{customPromptReview.length}/500</div>
                  </div>
                </div>
              </details>
              
              {/* Style Preview Panel */}
              <div className="border-t border-slate-700/50 p-2 max-h-[300px] overflow-y-auto">
                {currentChapter?.id && currentBook?.id && (
                  <StylePreviewPanel
                    chapterText={plainContent}
                    chapterId={currentChapter.id}
                    bookId={currentBook.id}
                    moodSettings={moodSettings}
                    moodPreset={null}
                    isCollapsible={true}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Panels */}
        {showContextPanel && (
          <FloatingPanel
            id="pro-smart-context"
            title="Smart Context"
            icon={Users}
            defaultPosition={{ x: window.innerWidth - 350, y: 100 }}
            defaultSize={{ width: 300, height: 350 }}
            onClose={() => setShowContextPanel(false)}
            collapsible
          >
            <div className="p-3 space-y-4">
              <div>
                <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2">
                  Characters ({detectedCharacters.length})
                </h4>
                {detectedCharacters.length > 0 ? (
                  <div className="space-y-2">
                    {detectedCharacters.map(char => {
                      const fullActor = actors.find(a => a.id === char.id);
                      
                      return (
                        <div 
                          key={char.id} 
                          onClick={() => onNavigate?.('personnel', { actorId: char.id })}
                          onMouseEnter={(e) => {
                            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                            hoverTimerRef.current = setTimeout(() => {
                              setHoveredEntity({ type: 'actor', data: fullActor || char });
                              setHoverPosition({ x: e.clientX, y: e.clientY });
                            }, 400);
                          }}
                          onMouseLeave={() => {
                            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                            setHoveredEntity(null);
                          }}
                          className="group flex items-center gap-2 p-2 bg-slate-800/50 hover:bg-amber-500/20 
                            rounded-lg cursor-pointer transition-all relative"
                        >
                          <Users className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-white block truncate">{char.name}</span>
                            {fullActor?.role && (
                              <span className="text-xs text-slate-500">{fullActor.role}</span>
                            )}
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 
                            opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No characters detected</p>
                )}
              </div>

              <div>
                <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2">
                  Items ({detectedItems.length})
                </h4>
                {detectedItems.length > 0 ? (
                  <div className="space-y-2">
                    {detectedItems.map(item => {
                      const fullItem = items.find(i => i.id === item.id);
                      
                      return (
                        <div 
                          key={item.id}
                          onClick={() => onNavigate?.('inventory', { itemId: item.id })}
                          onMouseEnter={(e) => {
                            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                            hoverTimerRef.current = setTimeout(() => {
                              setHoveredEntity({ type: 'item', data: fullItem || item });
                              setHoverPosition({ x: e.clientX, y: e.clientY });
                            }, 400);
                          }}
                          onMouseLeave={() => {
                            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                            setHoveredEntity(null);
                          }}
                          className="group flex items-center gap-2 p-2 bg-slate-800/50 hover:bg-cyan-500/20 
                            rounded-lg cursor-pointer transition-all"
                        >
                          <Package className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-white block truncate">{item.name}</span>
                            {fullItem?.rarity && (
                              <span className={`text-xs ${
                                fullItem.rarity === 'legendary' ? 'text-amber-400' :
                                fullItem.rarity === 'epic' ? 'text-purple-400' :
                                fullItem.rarity === 'rare' ? 'text-blue-400' : 'text-slate-500'
                              }`}>{fullItem.rarity}</span>
                            )}
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 
                            opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No items detected</p>
                )}
              </div>
              
              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-600 italic text-center">
                  ✨ Hover for preview • Click to open
                </p>
              </div>
            </div>
          </FloatingPanel>
        )}

        {/* Entity Hover Card */}
        {hoveredEntity?.type === 'actor' && (
          <ActorHoverCard
            actor={hoveredEntity.data}
            position={hoverPosition}
            onClose={() => setHoveredEntity(null)}
            onNavigate={onNavigate}
          />
        )}
        {hoveredEntity?.type === 'item' && (
          <ItemHoverCard
            item={hoveredEntity.data}
            position={hoverPosition}
            onClose={() => setHoveredEntity(null)}
            onNavigate={onNavigate}
          />
        )}

        {showMoodPanel && (
          <FloatingPanel
            id="pro-mood-panel"
            title="Current Mood (View Only)"
            icon={Palette}
            defaultPosition={{ x: window.innerWidth - 350, y: 480 }}
            defaultSize={{ width: 300, height: 300 }}
            onClose={() => setShowMoodPanel(false)}
            collapsible
          >
            <div className="p-3 space-y-3">
              <p className="text-xs text-slate-500 italic mb-3">
                These reflect detected mood. Select text and use popup to edit.
              </p>
              
              {Object.entries(moodSettings).map(([key, value]) => {
                const labels = {
                  comedy_horror: { left: '😄 Comedy', right: 'Horror 💀' },
                  tension: { left: 'Relaxed', right: 'Tense' },
                  pacing: { left: 'Slow', right: 'Fast' },
                  detail: { left: 'Sparse', right: 'Rich' },
                  emotional: { left: 'Detached', right: 'Intense' }
                };
                const label = labels[key] || { left: '0', right: '100' };
                
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">{label.left}</span>
                      <span className="text-violet-400 font-medium">{value}%</span>
                      <span className="text-slate-500">{label.right}</span>
                    </div>
                    {/* View-only progress bar instead of slider */}
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-violet-500 transition-all duration-300"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-3 border-t border-slate-700 text-center">
                <p className="text-xs text-slate-400 mb-2">
                  💡 Select text to edit mood in popup
                </p>
              </div>
            </div>
          </FloatingPanel>
        )}

        {/* Writing Goals Panel */}
        {showGoalsPanel && (
          <FloatingPanel
            id="pro-goals-panel"
            title="Writing Goals"
            icon={CheckCircle}
            defaultPosition={{ x: 20, y: 100 }}
            defaultSize={{ width: 320, height: 400 }}
            onClose={() => setShowGoalsPanel(false)}
            collapsible
          >
            <WritingGoals currentWordCount={wordCount} />
          </FloatingPanel>
        )}

        {/* Focus Timer Panel */}
        {showTimerPanel && (
          <FloatingPanel
            id="pro-timer-panel"
            title="Focus Timer"
            icon={Clock}
            defaultPosition={{ x: 20, y: 520 }}
            defaultSize={{ width: 320, height: 380 }}
            onClose={() => setShowTimerPanel(false)}
            collapsible
          >
            <SessionTimer 
              onSessionComplete={(session) => {
                console.log('Session complete:', session);
              }}
            />
          </FloatingPanel>
        )}

        {/* Style Reference Manager Panel */}
        {showStyleRefPanel && (
          <FloatingPanel
            id="pro-style-ref-panel"
            title="Style References"
            icon={FileText}
            defaultPosition={{ x: window.innerWidth - 400, y: 100 }}
            defaultSize={{ width: 380, height: 600 }}
            onClose={() => setShowStyleRefPanel(false)}
            collapsible
          >
            <div className="h-full overflow-hidden">
              <StyleReferenceManager 
                projectId={currentBook?.id}
                compact={false}
              />
            </div>
          </FloatingPanel>
        )}

        {/* Writing Statistics Panel */}
        {showStatsPanel && (
          <FloatingPanel
            id="pro-stats-panel"
            title="Writing Statistics"
            icon={BarChart3}
            defaultPosition={{ x: window.innerWidth - 400, y: 720 }}
            defaultSize={{ width: 320, height: 280 }}
            onClose={() => setShowStatsPanel(false)}
            collapsible
          >
            <WritingStatistics content={plainContent} wordCount={wordCount} />
            
            {/* Chapter Completion Indicator */}
            {currentChapter && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Chapter Completion</span>
                  <span className="text-xs text-white font-medium">
                    {currentChapter.completed ? '100%' : 
                     currentChapter.wordCountGoal 
                       ? `${Math.min(Math.round((wordCount / currentChapter.wordCountGoal) * 100), 100)}%`
                       : 'N/A'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                    style={{ 
                      width: currentChapter.completed ? '100%' :
                        currentChapter.wordCountGoal 
                          ? `${Math.min((wordCount / currentChapter.wordCountGoal) * 100, 100)}%`
                          : '0%'
                    }}
                  />
                </div>
                {currentChapter.completed && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    Chapter Complete
                  </div>
                )}
              </div>
            )}
          </FloatingPanel>
        )}

        {/* ---- Enhancement: Pacing Analyzer Panel ---- */}
        {showPacingPanel && (() => {
          const pacing = getPacingStats();
          return (
            <FloatingPanel
              id="pacing-panel"
              title="Pacing Analyzer"
              icon={Activity}
              defaultPosition={{ x: 20, y: 400 }}
              defaultSize={{ width: 280, height: 220 }}
              onClose={() => setShowPacingPanel(false)}
              collapsible
            >
              {pacing ? (
                <div className="space-y-3 p-1">
                  {[
                    { label: 'Dialogue', value: pacing.dialogue, color: 'bg-blue-500' },
                    { label: 'Action', value: pacing.action, color: 'bg-red-500' },
                    { label: 'Description', value: pacing.description, color: 'bg-amber-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{label}</span>
                        <span className="text-white font-bold">{value}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="text-xs text-slate-500 mt-2">
                    Avg sentence length: <span className="text-slate-300">{pacing.avgSentenceLen} words</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 p-2">Write more content to analyse pacing.</p>
              )}
            </FloatingPanel>
          );
        })()}

        {/* ---- Enhancement: Scene Starter Templates ---- */}
        {showSceneStarters && (
          <FloatingPanel
            id="scene-starters-panel"
            title="Scene Starter Templates"
            icon={BookOpen}
            defaultPosition={{ x: 20, y: 200 }}
            defaultSize={{ width: 320, height: 380 }}
            onClose={() => setShowSceneStarters(false)}
            collapsible
          >
            <div className="space-y-2 text-xs overflow-y-auto max-h-64">
              {[
                { label: 'Confrontation', text: 'The air between them crackled with tension as [Character A] stepped forward, fists clenched. [Character B] held their ground, voice cold and measured.' },
                { label: 'Discovery', text: 'The door swung open to reveal something [Character] had never expected to find — a [item/secret] that changed everything.' },
                { label: 'Quiet Reflection', text: 'Alone at last, [Character] let the silence settle around them. The events of the past [hours/days] replayed in their mind like a film stuck on loop.' },
                { label: 'Transition / Travel', text: 'The road stretched ahead, grey and featureless. [Character] pulled their coat tighter and focused on the horizon, leaving [place] behind.' },
                { label: 'Flashback', text: 'The smell of [sensory detail] brought it back in an instant — [year/time ago], when everything was different.' },
                { label: 'Chase / Action', text: 'There was no time to think. [Character] ran, lungs burning, the sound of [pursuit] closing fast behind them.' },
                { label: 'Revelation / Twist', text: '"I know what you did," [Character A] said quietly. The room went still. [Character B] felt the blood drain from their face.' },
              ].map(({ label, text }) => (
                <div key={label} className="border border-slate-700 rounded p-2 hover:border-green-500 cursor-pointer group"
                  onClick={() => {
                    if (textareaRef.current) {
                      const pos = textareaRef.current.selectionStart;
                      const newContent = plainContent.slice(0, pos) + '\n\n' + text + '\n\n' + plainContent.slice(pos);
                      setPlainContent(newContent);
                    }
                    setShowSceneStarters(false);
                  }}
                >
                  <div className="text-green-400 font-bold mb-1 group-hover:text-green-300">{label}</div>
                  <div className="text-slate-400 group-hover:text-slate-300 leading-relaxed line-clamp-2">{text}</div>
                </div>
              ))}
            </div>
          </FloatingPanel>
        )}

        {/* ---- Enhancement: Chapter Summary Panel ---- */}
        {showSummaryPanel && chapterSummary && (
          <FloatingPanel
            id="chapter-summary-panel"
            title="Chapter Summary (AI)"
            icon={FileText}
            defaultPosition={{ x: window.innerWidth - 420, y: 400 }}
            defaultSize={{ width: 340, height: 180 }}
            onClose={() => setShowSummaryPanel(false)}
            collapsible
          >
            <div className="space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed">{chapterSummary}</p>
              <button
                onClick={() => generateChapterSummary(plainContent)}
                disabled={isGeneratingSummary}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                {isGeneratingSummary ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          </FloatingPanel>
        )}

        {/* ---- Enhancement: Plot Hole Alerts Panel ---- */}
        {showPlotHolePanel && plotHoleAlerts.length > 0 && (
          <FloatingPanel
            id="plot-hole-panel"
            title={`Plot Issues (${plotHoleAlerts.length})`}
            icon={AlertTriangle}
            defaultPosition={{ x: window.innerWidth - 420, y: 200 }}
            defaultSize={{ width: 340, height: 260 }}
            onClose={() => setShowPlotHolePanel(false)}
            collapsible
          >
            <div className="space-y-2 overflow-y-auto max-h-48">
              {plotHoleAlerts.map((alert, i) => (
                <div key={i} className={`p-2 rounded border text-xs ${
                  alert.severity === 'critical'
                    ? 'bg-red-900/30 border-red-700 text-red-300'
                    : 'bg-amber-900/30 border-amber-700 text-amber-300'
                }`}>
                  <span className="uppercase font-bold text-[10px] mr-1">
                    {alert.severity === 'critical' ? '⚠ Critical:' : '⚑ Warning:'}
                  </span>
                  {alert.issue}
                </div>
              ))}
              <button
                onClick={() => setPlotHoleAlerts([])}
                className="text-xs text-slate-500 hover:text-slate-300 mt-1"
              >
                Dismiss all
              </button>
            </div>
          </FloatingPanel>
        )}
      </div>

      {/* ============================================ */}
      {/* SELECTION TOOLBAR */}
      {/* ============================================ */}
      {showSelectionTools && selectedText && (
        <div
          className="fixed z-50 bg-slate-900/98 backdrop-blur-sm border border-slate-600 rounded-xl shadow-2xl overflow-hidden"
          style={{
            left: Math.max(10, Math.min(selectionPosition.x - 200, window.innerWidth - 500)),
            top: Math.max(60, selectionPosition.y),
            maxWidth: '480px',
            maxHeight: '70vh'
          }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
            <span className="text-xs text-amber-400 font-medium">
              ✂️ {selectedText.length} chars
            </span>
            <button
              onClick={() => setShowSelectionTools(false)}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="p-2">
            {/* Basic Actions */}
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              <button 
                onClick={handleRewriteSelection} 
                disabled={isProcessingSelection}
                title="Rewrite selected text with improved clarity and style"
                className="flex flex-col items-center gap-1 px-2 py-2 bg-amber-600/20 hover:bg-amber-600/40 rounded-lg text-amber-400 text-xs font-medium">
                <RefreshCw className="w-4 h-4" /> Rewrite
              </button>
              <button 
                onClick={handleExpandSelection} 
                disabled={isProcessingSelection}
                title="Add more detail and description to selected text"
                className="flex flex-col items-center gap-1 px-2 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 rounded-lg text-cyan-400 text-xs font-medium">
                <Maximize2 className="w-4 h-4" /> Expand
              </button>
              <button 
                onClick={handleMakeFunnier} 
                disabled={isProcessingSelection}
                title="Add wit, absurd details, and comedic timing"
                className="flex flex-col items-center gap-1 px-2 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 rounded-lg text-yellow-400 text-xs font-medium">
                <span className="text-base">😄</span> Funnier
              </button>
              <button 
                onClick={handleMakeDarker} 
                disabled={isProcessingSelection}
                title="Add dread, unease, and horror undertones"
                className="flex flex-col items-center gap-1 px-2 py-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-400 text-xs font-medium">
                <span className="text-base">🌑</span> Darker
              </button>
              <ReadAloudButton
                onClick={() => {
                  setShowReadAloudPanel(true);
                  setShowSelectionTools(false);
                }}
                disabled={!selectedText || isProcessingSelection}
              />
            </div>
            
            {/* Mood Quick Actions */}
            <div className="border-t border-slate-700 pt-2">
              <div className="text-xs text-slate-500 mb-1.5 px-1">Mood Rewrites:</div>
              <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => handleQuickMoodRewrite('comedy')}
                  disabled={isProcessingSelection}
                  title="Comedy: Funnier, absurd, casual"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 rounded text-yellow-400 text-xs">
                  <span className="text-sm">😄</span> Comedy
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('horror')}
                  disabled={isProcessingSelection}
                  title="Horror: Dark, tense, unsettling"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-red-600/20 hover:bg-red-600/40 rounded text-red-400 text-xs">
                  <span className="text-sm">💀</span> Horror
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('tense')}
                  disabled={isProcessingSelection}
                  title="Tense: High tension, urgent, fast-paced"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-orange-600/20 hover:bg-orange-600/40 rounded text-orange-400 text-xs">
                  <span className="text-sm">⚡</span> Tense
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('relaxed')}
                  disabled={isProcessingSelection}
                  title="Relaxed: Calm, slow, detailed"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-green-600/20 hover:bg-green-600/40 rounded text-green-400 text-xs">
                  <span className="text-sm">🌿</span> Relaxed
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('fast')}
                  disabled={isProcessingSelection}
                  title="Fast: Quick pacing, snappy, minimal detail"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 rounded text-blue-400 text-xs">
                  <span className="text-sm">⚡</span> Fast
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('slow')}
                  disabled={isProcessingSelection}
                  title="Slow: Measured, contemplative, rich detail"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 rounded text-indigo-400 text-xs">
                  <span className="text-sm">🐌</span> Slow
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('rich')}
                  disabled={isProcessingSelection}
                  title="Rich: Detailed, sensory, immersive"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 rounded text-purple-400 text-xs">
                  <span className="text-sm">✨</span> Rich
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('sparse')}
                  disabled={isProcessingSelection}
                  title="Sparse: Minimal, focused, essential only"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-slate-600/20 hover:bg-slate-600/40 rounded text-slate-400 text-xs">
                  <span className="text-sm">📝</span> Sparse
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('intense')}
                  disabled={isProcessingSelection}
                  title="Intense: Emotionally charged, high impact"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-pink-600/20 hover:bg-pink-600/40 rounded text-pink-400 text-xs">
                  <span className="text-sm">🔥</span> Intense
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('detached')}
                  disabled={isProcessingSelection}
                  title="Detached: Clinical, unemotional, formal"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-gray-600/20 hover:bg-gray-600/40 rounded text-gray-400 text-xs">
                  <span className="text-sm">🧊</span> Detached
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('dark')}
                  disabled={isProcessingSelection}
                  title="Dark: Bleak, ominous, heavy"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-black/40 hover:bg-black/60 rounded text-slate-300 text-xs border border-slate-700">
                  <span className="text-sm">🌑</span> Dark
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('light')}
                  disabled={isProcessingSelection}
                  title="Light: Bright, optimistic, playful"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/40 rounded text-yellow-300 text-xs">
                  <span className="text-sm">☀️</span> Light
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('absurd')}
                  disabled={isProcessingSelection}
                  title="Absurd: Surreal, ridiculous, comedic"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 rounded text-cyan-400 text-xs">
                  <span className="text-sm">🎭</span> Absurd
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('grounded')}
                  disabled={isProcessingSelection}
                  title="Grounded: Realistic, believable, down-to-earth"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-amber-700/20 hover:bg-amber-700/40 rounded text-amber-300 text-xs">
                  <span className="text-sm">🌍</span> Grounded
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('formal')}
                  disabled={isProcessingSelection}
                  title="Formal: Proper, structured, dignified"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-slate-700/40 hover:bg-slate-700/60 rounded text-slate-200 text-xs">
                  <span className="text-sm">🎩</span> Formal
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('casual')}
                  disabled={isProcessingSelection}
                  title="Casual: Conversational, relaxed, informal"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 rounded text-blue-300 text-xs">
                  <span className="text-sm">💬</span> Casual
                </button>
              </div>
            </div>
            
            {/* Interject Entity Button */}
            <div className="border-t border-slate-700 pt-2 mt-2">
              <button
                onClick={() => {
                  setShowInterjectionModal(true);
                  setInterjectionEntityType('actor');
                }}
                className="w-full px-3 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg text-purple-300 text-xs font-medium flex items-center justify-center gap-2"
                title="Interject an entity (actor, item, skill, etc.) into selected text (Ctrl+I)"
              >
                <Sparkles className="w-4 h-4" />
                Interject Entity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextMenuPosition && selectedText && (
        <div
          className="fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[200px]"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y
          }}
          onMouseLeave={() => setContextMenuPosition(null)}
        >
          <button
            onClick={() => {
              setInterjectionEntityType('actor');
              setShowInterjectionModal(true);
              setContextMenuPosition(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 text-sm flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Interject Actor...
          </button>
          <button
            onClick={() => {
              setInterjectionEntityType('item');
              setShowInterjectionModal(true);
              setContextMenuPosition(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 text-sm flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            Interject Item...
          </button>
          <button
            onClick={() => {
              setInterjectionEntityType('skill');
              setShowInterjectionModal(true);
              setContextMenuPosition(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 text-sm flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Interject Skill...
          </button>
          <button
            onClick={() => {
              setInterjectionEntityType('location');
              setShowInterjectionModal(true);
              setContextMenuPosition(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 text-sm flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Interject Location...
          </button>
          <button
            onClick={() => {
              setInterjectionEntityType('event');
              setShowInterjectionModal(true);
              setContextMenuPosition(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 text-sm flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Interject Event...
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* CHANGE SUMMARY DRAWER */}
      {/* ============================================ */}
      <ChangeSummaryDrawer
        changes={trackedChanges}
        onAccept={acceptChange}
        onReject={rejectChange}
        onLock={lockChange}
        onAcceptAll={() => trackedChanges.forEach(c => acceptChange(c.id))}
        onRejectAll={() => trackedChanges.forEach(c => rejectChange(c.id))}
        onAcceptAllLocked={acceptAllLocked}
        onUndo={handleUndo}
        undoStack={undoStack}
      />

      {/* ============================================ */}
      {/* MODALS/PANELS */}
      {/* ============================================ */}
      
      {/* Preview Panel */}
      <PreviewPanel
        isOpen={previewPanel.isOpen}
        onClose={() => setPreviewPanel({ isOpen: false, content: '', source: 'continue', isLoading: false })}
        content={previewPanel.content}
        source={previewPanel.source}
        confidence={previewPanel.confidence}
        originalSelection={previewPanel.originalSelection}
        isLoading={previewPanel.isLoading}
        moodSettings={moodSettings}
        onMoodChange={(newMood) => setMoodSettings(prev => ({ ...prev, ...newMood }))}
        onInsertAtCursor={handleInsertAtCursor}
        chapterId={currentChapter?.id}
        bookId={currentBook?.id}
        onRegenerate={() => {
          // Re-run the last generation with current mood settings
          if (previewPanel.source === 'continue') handleContinueWriting();
          else if (previewPanel.source === 'scene') handleGenerateScene();
          else if (previewPanel.source === 'dialogue') handleAddDialogue();
          else if (previewPanel.source === 'description') handleAddDescription();
          else if (previewPanel.source === 'character') handleAddCharacter();
          else if (previewPanel.source === 'rewrite' && previewPanel.originalSelection) {
            // Regenerate rewrite with current mood
            handleRegenerateWithMood(previewPanel.originalSelection);
          }
        }}
      />

      {/* Mood Rewrite Panel */}
      <MoodRewritePanel
        isOpen={moodRewritePanel.isOpen}
        onClose={() => setMoodRewritePanel({ isOpen: false, originalContent: '', rewrittenContent: '', moodSettings: null, isLoading: false })}
        originalContent={moodRewritePanel.originalContent}
        rewrittenContent={moodRewritePanel.rewrittenContent}
        moodSettings={moodRewritePanel.moodSettings || moodSettings}
        isLoading={moodRewritePanel.isLoading}
        onAccept={handleAcceptMoodRewrite}
        onRegenerate={handleMoodRewrite}
        onMoodChange={(newMood) => setMoodSettings(prev => ({ ...prev, ...newMood }))}
        onAdjustMood={() => setShowMoodPanel(true)}
      />

      {/* Prompt Modal */}
      {showPromptModal && pendingGeneration && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative">
            {/* Style Connection Indicator */}
            {currentChapter?.id && currentBook?.id && (
              <StyleConnectionIndicator
                chapterId={currentChapter.id}
                bookId={currentBook.id}
                position="top-right"
                size="small"
              />
            )}
            
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{pendingGeneration.title}</h2>
                <p className="text-sm text-slate-400 mt-1">{pendingGeneration.description}</p>
              </div>
              <button
                onClick={handlePromptModalCancel}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Style Preview */}
              <StylePreviewPanel
                chapterText={plainContent}
                chapterId={currentChapter?.id}
                bookId={currentBook?.id}
                moodSettings={moodSettings}
                moodPreset={null}
                isCollapsible={true}
              />

              {/* Custom Prompt Field */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={tempCustomPrompt}
                  onChange={(e) => setTempCustomPrompt(e.target.value)}
                  placeholder="Add any specific instructions, tips, or guidance for the AI generation. For example: 'Make it funnier', 'Focus on the character's internal thoughts', 'Add more tension', etc."
                  className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-3 py-2 rounded resize-y min-h-[120px] max-h-[200px]"
                  rows={5}
                  maxLength={500}
                  autoFocus
                />
                <div className="text-xs text-slate-500 mt-1">{tempCustomPrompt.length}/500</div>
                <p className="text-xs text-slate-500 mt-2">
                  💡 Leave empty to use default generation, or add specific guidance to customize the output.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-800 border-t border-slate-700 p-4 flex items-center justify-end gap-3">
              <button
                onClick={handlePromptModalCancel}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePromptModalConfirm}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Suggestions Panel */}
      <ReviewSuggestionsPanel
        isOpen={reviewPanel.isOpen}
        onClose={() => setReviewPanel({ isOpen: false, suggestions: [], isLoading: false })}
        suggestions={reviewPanel.suggestions}
        isLoading={reviewPanel.isLoading}
        onApplySelected={handleApplySuggestions}
        onRegenerate={handleReview}
        chapterContent={plainContent}
      />

      {/* Read Aloud Panel */}
      <ReadAloudPanel
        text={selectedText || plainContent}
        isOpen={showReadAloudPanel}
        onClose={() => setShowReadAloudPanel(false)}
        startPosition={selectionRange?.start || 0}
        onWordHighlight={(wordData) => {
          setHighlightedWord(wordData);
          // Scroll to highlighted word if needed
          if (textareaRef.current && wordData.charIndex !== undefined) {
            const textarea = textareaRef.current;
            const textBefore = textarea.value.substring(0, wordData.charIndex);
            const lines = textBefore.split('\n');
            const line = lines.length - 1;
            const lineHeight = 20; // Approximate
            textarea.scrollTop = line * lineHeight;
          }
        }}
      />

      {/* Chapter Templates Modal */}
      {showTemplates && (
        <ChapterTemplates
          onApplyTemplate={async (template) => {
            if (template.generatedContent) {
              // Apply template content to current chapter
              if (currentChapter) {
                const newContent = plainContent 
                  ? plainContent + '\n\n' + template.generatedContent
                  : template.generatedContent;
                setPlainContent(newContent);
                updateWordCount(newContent);
                await autoSave(newContent);
              } else {
                // If no chapter, create one with template
                if (currentBook) {
                  const newChapter = await contextEngine.addChapter(currentBook.id, {
                    title: `Chapter ${allChapters.length + 1}`,
                    content: template.generatedContent
                  });
                  const chapters = await contextEngine.getAllChaptersWithStatus();
                  setAllChapters(chapters);
                  await loadChapter({ ...newChapter, bookId: currentBook.id });
                }
              }
            }
            setShowTemplates(false);
          }}
          onClose={() => setShowTemplates(false)}
          currentChapter={currentChapter}
        />
      )}
      
      {/* Entity Extraction Wizard */}
      {showEntityWizard && currentChapter && currentBook && (
        <EntityExtractionWizard
          chapterText={compileContent()}
          chapterId={currentChapter.id}
          bookId={currentBook.id}
          actors={actors || []}
          items={items || []}
          skills={skills || []}
          statRegistry={[]}
          books={books || []}
          onComplete={handleEntityWizardComplete}
          onClose={() => setShowEntityWizard(false)}
        />
      )}

      {/* Entity Interjection Modal */}
      {showInterjectionModal && selectedText && (
        <EntityInterjectionModal
          selectedText={selectedText}
          chapterContext={plainContent}
          chapterId={currentChapter?.id}
          bookId={currentBook?.id}
          actors={actors || []}
          items={items || []}
          skills={skills || []}
          onInsert={(result) => {
            // Insert the interjected text based on placement option
            const textarea = textareaRef.current;
            if (!textarea || !selectionRange) return;

            let newContent = '';
            const before = plainContent.substring(0, selectionRange.start);
            const after = plainContent.substring(selectionRange.end);

            switch (result.type) {
              case 'replace':
                newContent = before + result.text + after;
                break;
              case 'insert_before':
                newContent = before + result.text + '\n\n' + selectedText + after;
                break;
              case 'insert_after':
                newContent = before + selectedText + '\n\n' + result.text + after;
                break;
              case 'blend':
                newContent = before + result.text + after;
                break;
              default:
                newContent = before + result.text + after;
            }

            setPlainContent(newContent);
            updateWordCount(newContent);
            setShowInterjectionModal(false);
            setShowSelectionTools(false);
            setSelectedText('');
            setSelectionRange(null);
            
            // Focus textarea and set cursor position
            setTimeout(() => {
              textarea.focus();
              const newCursorPos = before.length + result.text.length;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
          }}
          onClose={() => setShowInterjectionModal(false)}
        />
      )}

      {/* ============================================ */}
      {/* BETA READER EXPORT MODAL                     */}
      {/* ============================================ */}
      {showBetaExportModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Beta Reader Export
              </h3>
              <button onClick={() => setShowBetaExportModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Export this chapter as a standalone HTML file that beta readers can open, highlight passages, and leave inline comments. They return a JSON file you can import back below.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (currentChapter && currentBook) {
                    betaReaderService.exportChapters(
                      [{ ...currentChapter, bookTitle: currentBook.title }],
                      'Author',
                      currentBook.title || 'My Story'
                    );
                  }
                  setShowBetaExportModal(false);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Current Chapter
              </button>
              <div className="border-t border-slate-700 pt-3">
                <p className="text-slate-400 text-xs mb-2">Import beta reader comments (JSON file from reader):</p>
                <label className="block w-full cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const comments = await betaReaderService.importComments(file);
                        setBetaImportAnnotations(prev => {
                          const merged = [...prev];
                          comments.forEach(c => {
                            if (!merged.find(x => x.id === c.id)) merged.push(c);
                          });
                          return merged;
                        });
                        setShowBetaAnnotations(true);
                        setShowBetaExportModal(false);
                        toastService.success(`Imported ${comments.length} beta reader comment${comments.length !== 1 ? 's' : ''}`);
                      } catch (err) {
                        toastService.error(err.message);
                      }
                    }}
                  />
                  <span className="block w-full border border-dashed border-slate-600 text-slate-400 hover:border-indigo-500 hover:text-indigo-300 text-center py-2.5 rounded-lg transition-colors text-sm">
                    Choose Comments JSON File
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* BETA READER ANNOTATIONS PANEL               */}
      {/* ============================================ */}
      {showBetaAnnotations && betaImportAnnotations.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 bg-slate-900 border border-indigo-700 rounded-xl shadow-2xl z-40 flex flex-col max-h-96">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 flex-shrink-0">
            <span className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Beta Reader Comments ({betaImportAnnotations.length})
            </span>
            <button onClick={() => setShowBetaAnnotations(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
            {betaImportAnnotations.map(ann => (
              <div key={ann.id} className="p-3">
                <div className="text-[10px] text-slate-500 mb-1">{new Date(ann.timestamp).toLocaleString()}</div>
                {ann.selectedText && (
                  <div className="text-xs bg-yellow-900/30 border border-yellow-700/50 text-yellow-200 rounded px-2 py-1 mb-1.5 italic">
                    "{ann.selectedText.slice(0, 80)}{ann.selectedText.length > 80 ? '…' : ''}"
                  </div>
                )}
                <div className="text-xs text-slate-300 leading-relaxed">{ann.comment}</div>
                <button
                  onClick={() => setBetaImportAnnotations(prev => prev.filter(a => a.id !== ann.id))}
                  className="mt-1.5 text-[10px] text-slate-600 hover:text-red-400 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingCanvasPro;

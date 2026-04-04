import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save, FileText, Wand2, Check, X, ChevronDown, ChevronUp, ChevronRight,
  Users, Package, Sparkles, BookOpen, Clock, CheckCircle,
  Loader2, AlertCircle, Mic, MicOff, Volume2, RotateCcw,
  Maximize2, Minimize2, Settings, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import FloatingPanel from './FloatingPanel';
import MoodMeter from './MoodMeter';
import ReadAloudButton from './ReadAloudButton';
import ReadAloudPanel from './ReadAloudPanel';
import db from '../services/database';
import contextEngine from '../services/contextEngine';
import aiService from '../services/aiService';
import chapterIngestionOrchestrator from '../services/chapterIngestionOrchestrator';
import EntityExtractionWizard from './EntityExtractionWizard';

/**
 * WritingCanvas - Modern floating-panel based writing environment
 * Replaces WritersRoomEnhanced with cleaner, more focused interface
 */
const WritingCanvas = ({ 
  onNavigate,
  onSave,
  onEntityUpdate,
  initialChapter = null,
  zenMode = false
}) => {
  // Core writing state
  const [content, setContent] = useState('');
  const [currentChapter, setCurrentChapter] = useState(null);
  const [currentBook, setCurrentBook] = useState(null);
  const [allChapters, setAllChapters] = useState([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Smart context state
  const [detectedCharacters, setDetectedCharacters] = useState([]);
  const [detectedItems, setDetectedItems] = useState([]);
  const [plotBeatsForChapter, setPlotBeatsForChapter] = useState([]);
  const [actors, setActors] = useState([]);
  const [items, setItems] = useState([]);
  
  // Entity extraction wizard state
  const [showEntityWizard, setShowEntityWizard] = useState(false);
  const [skills, setSkills] = useState([]);
  const [books, setBooks] = useState([]);
  
  // Completion state
  const [completionAnalysis, setCompletionAnalysis] = useState(null);
  const [showCompletionPanel, setShowCompletionPanel] = useState(false);
  const [ingestionHealth, setIngestionHealth] = useState(null);
  
  // Selection/rewrite state
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [showSelectionTools, setShowSelectionTools] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);
  
  // AI Writing assistance state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWritingTools, setShowWritingTools] = useState(false);
  const [generationMode, setGenerationMode] = useState(null); // 'continue', 'scene', 'improve', 'style'
  
  // Panel visibility
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [showMoodPanel, setShowMoodPanel] = useState(true);
  const [showPlotPanel, setShowPlotPanel] = useState(true);
  const [showToolsPanel, setShowToolsPanel] = useState(true);
  const [showReadAloudPanel, setShowReadAloudPanel] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState(null);
  
  // Refs
  const textareaRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Initialize
  useEffect(() => {
    loadInitialData();
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
    };
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Load actors, items, skills, and books for context and wizard
      const loadedActors = await db.getAll('actors');
      const loadedItems = await db.getAll('itemBank');
      const loadedSkills = await db.getAll('skillBank');
      const loadedBooks = await db.getAll('books');
      setActors(loadedActors || []);
      setItems(loadedItems || []);
      setSkills(loadedSkills || []);
      setBooks(Array.isArray(loadedBooks) ? loadedBooks : Object.values(loadedBooks || {}));

      // Get all chapters
      const chapters = await contextEngine.getAllChaptersWithStatus();
      setAllChapters(chapters);

      // Get current chapter (first incomplete)
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

  const loadChapter = async (chapter) => {
    setCurrentChapter(chapter);
    setContent(chapter.content || chapter.script || '');
    
    // Load book info
    const book = await db.get('books', chapter.bookId);
    setCurrentBook(book);
    
    // Load plot beats for this chapter
    const allBeats = await contextEngine.getPlotBeats();
    
    // Determine chapter number - handle different formats (ID can be string or number)
    const chapterId = String(chapter.id || '');
    const chapterNum = chapter.number || parseInt(chapterId.replace(/\D/g, '')) || 1;
    
    // Filter beats for this chapter - match various formats
    const chapterBeats = allBeats.filter(b => {
      // If beat has no target, it's unassigned - only show for chapter 1
      if (!b.targetChapter && b.targetChapter !== 0) {
        return chapterNum === 1;
      }
      
      // Match by chapter number or ID
      return b.targetChapter === chapterNum || 
             b.targetChapter === chapter.id ||
             b.targetChapter === chapter.number ||
             b.chapter === chapterNum;
    });
    
    console.log(`[WritingCanvas] Loaded ${chapterBeats.length} beats for chapter ${chapterNum}`, 
      chapterBeats.map(b => ({ id: b.id, beat: b.beat?.substring(0, 50) })));
    setPlotBeatsForChapter(chapterBeats);

    // Update word count
    updateWordCount(chapter.content || chapter.script || '');
  };

  const updateWordCount = (text) => {
    const count = text.trim() ? text.trim().split(/\s+/).filter(w => w).length : 0;
    setWordCount(count);
  };

  // Content change with auto-save
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    updateWordCount(newContent);
    detectEntities(newContent);
    
    // Auto-save after 3 seconds of no typing
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave(newContent);
    }, 3000);
  };

  const autoSave = async (text) => {
    if (!currentChapter || !currentBook) return;
    
    try {
      await contextEngine.updateChapterContent(
        currentBook.id,
        currentChapter.id,
        text
      );
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSave = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritingCanvas.jsx:191',message:'handleSave called',data:{hasChapter:!!currentChapter,hasBook:!!currentBook,contentLength:content?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!currentChapter || !currentBook) return;
    
    setIsSaving(true);
    try {
      // Save chapter content first
      await contextEngine.updateChapterContent(
        currentBook.id,
        currentChapter.id,
        content,
        currentChapter.title
      );
      setLastSaved(new Date());
      
      // Update chapter in local state
      setCurrentChapter(prev => ({
        ...prev,
        content,
        wordCount
      }));

      if (onSave) onSave();
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritingCanvas.jsx:215',message:'Chapter saved, extracting events',data:{bookId:currentBook.id,chapterId:currentChapter.id,contentLength:content.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Run unified chapter-ingestion orchestrator
      if (content && content.trim().length >= 50) {
        try {
          const ingestSession = await chapterIngestionOrchestrator.ingestChapter({
            bookId: currentBook.id,
            chapterId: currentChapter.id,
            chapterNumber: currentChapter.number,
            chapterText: content,
            actors: actors || []
          });
          setIngestionHealth({
            status: ingestSession.status,
            sessionId: ingestSession.id,
            counts: ingestSession.stages?.extracted || {},
            errors: ingestSession.errors || []
          });
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritingCanvas.jsx:240',message:'Ingestion session completed',data:{sessionId:ingestSession.id,status:ingestSession.status,errors:ingestSession.errors?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion

          // Show Entity Extraction Wizard (mandatory)
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritingCanvas.jsx:254',message:'Setting showEntityWizard to true',data:{currentChapter:currentChapter?.id,currentBook:currentBook?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          setShowEntityWizard(true);
        } catch (error) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritingCanvas.jsx:247',message:'Event extraction failed',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
          
          console.error('[WritingCanvas] Event extraction failed:', error);
          setIngestionHealth({
            status: 'failed',
            sessionId: null,
            counts: {},
            errors: [{ error: error.message }]
          });
          // Still show wizard even if extraction fails - user can manually review
          setShowEntityWizard(true);
        }
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritingCanvas.jsx:256',message:'Save failed',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Entity detection for smart context
  const detectEntities = useCallback((text) => {
    if (!text || text.length < 10) return;

    // Detect characters mentioned
    const detected = actors.filter(actor => {
      const names = [actor.name, ...(actor.nicknames || [])];
      return names.some(name => 
        text.toLowerCase().includes(name.toLowerCase())
      );
    });
    setDetectedCharacters(detected);

    // Detect items mentioned
    const detectedItms = items.filter(item =>
      text.toLowerCase().includes(item.name.toLowerCase())
    );
    setDetectedItems(detectedItms);
  }, [actors, items]);

  // Chapter completion
  const handleAnalyzeCompletion = async () => {
    const analysis = await contextEngine.analyzeChapterCompleteness(content);
    setCompletionAnalysis(analysis);
    setShowCompletionPanel(true);
  };

  const handleMarkComplete = async (completed) => {
    if (!currentChapter || !currentBook) return;
    
    try {
      await contextEngine.updateChapterCompletion(
        currentBook.id,
        currentChapter.id,
        completed,
        wordCount
      );
      
      setCurrentChapter(prev => ({
        ...prev,
        completed,
        wordCount
      }));
      
      setShowCompletionPanel(false);

      // Refresh chapters list
      const chapters = await contextEngine.getAllChaptersWithStatus();
      setAllChapters(chapters);
    } catch (error) {
      console.error('Error marking chapter complete:', error);
    }
  };

  // Mark plot beat complete
  const handleTogglePlotBeat = async (beatId) => {
    try {
      const beat = plotBeatsForChapter.find(b => b.id === beatId);
      if (!beat) return;
      
      await contextEngine.updatePlotBeatStatus(beatId, !beat.completed);
      
      setPlotBeatsForChapter(prev => 
        prev.map(b => b.id === beatId ? { ...b, completed: !b.completed } : b)
      );
    } catch (error) {
      console.error('Error toggling plot beat:', error);
    }
  };

  // Timer ref for delayed toolbar display
  const selectionTimerRef = useRef(null);
  
  // Text selection handling - works properly with textarea
  // Added delay to prevent interference with double-click selections
  const handleTextSelect = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Clear any existing timer
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end).trim();
    
    if (text && text.length > 3 && start !== end) {
      setSelectedText(text);
      setSelectionRange({ start, end });
      
      // DELAY showing toolbar by 300ms to allow double-click selections to complete
      selectionTimerRef.current = setTimeout(() => {
        const textareaRect = textarea.getBoundingClientRect();
        const textBefore = textarea.value.substring(0, end);
        const lines = textBefore.split('\n');
        const lineNumber = lines.length;
        
        const lineHeight = 24;
        
        // Position BELOW the selection (not above) to not interfere
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
    if (e.detail === 1 && !window.getSelection()?.toString()) {
      setShowSelectionTools(false);
    }
  };

  const handleRewrite = async () => {
    if (!selectedText || !selectionRange) return;
    
    setIsProcessingSelection(true);
    try {
      const result = await aiService.callAI(
        `Rewrite this text, keeping the same meaning but improving clarity and style. Keep the same tone and voice. Only return the rewritten text, no explanation:\n\n"${selectedText}"`,
        'creative'
      );
      
      if (result) {
        const before = content.substring(0, selectionRange.start);
        const after = content.substring(selectionRange.end);
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(before + cleanResult + after);
      }
    } catch (error) {
      console.error('Rewrite failed:', error);
    } finally {
      setIsProcessingSelection(false);
      setShowSelectionTools(false);
    }
  };

  const handleExpand = async () => {
    if (!selectedText || !selectionRange) return;
    
    setIsProcessingSelection(true);
    try {
      const result = await aiService.callAI(
        `Expand on this text with more detail and description, maintaining the same style and voice. Only return the expanded text, no explanation:\n\n"${selectedText}"`,
        'creative'
      );
      
      if (result) {
        const before = content.substring(0, selectionRange.start);
        const after = content.substring(selectionRange.end);
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(before + cleanResult + after);
      }
    } catch (error) {
      console.error('Expand failed:', error);
    } finally {
      setIsProcessingSelection(false);
      setShowSelectionTools(false);
    }
  };

  // AI Writing Assistance Functions
  const handleContinueWriting = async () => {
    setIsGenerating(true);
    setGenerationMode('continue');
    try {
      // Get the last ~500 characters for context
      const contextText = content.slice(-500);
      const characterNames = actors.map(a => a.name).join(', ');
      
      const prompt = `Continue writing this story. You are a skilled author. Write the next 2-3 paragraphs that naturally follow from where this text ends. Maintain the same tone, style, and voice. Characters in this story: ${characterNames || 'Not specified'}.

Do NOT explain what you're doing. Just write the continuation.

Story so far (ending):
"""
${contextText}
"""

Continue from here:`;

      const result = await aiService.callAI(prompt, 'creative');
      
      if (result) {
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(prev => prev + '\n\n' + cleanResult);
        
        // Scroll to bottom
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      }
    } catch (error) {
      console.error('Continue writing failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationMode(null);
    }
  };

  const handleGenerateScene = async () => {
    setIsGenerating(true);
    setGenerationMode('scene');
    try {
      // Get uncompleted plot beats for this chapter
      const uncompletedBeats = plotBeatsForChapter.filter(b => !b.completed);
      const nextBeat = uncompletedBeats[0];
      const characterNames = actors.map(a => a.name).join(', ');
      
      const beatInfo = nextBeat 
        ? `Next plot beat to address: "${nextBeat.beat || nextBeat.purpose}"`
        : 'Continue the story naturally';
      
      const prompt = `Write a scene for this story chapter. You are a skilled author writing in a unique voice.

${beatInfo}

Characters available: ${characterNames || 'Use existing characters'}

Current chapter content so far:
"""
${content.slice(-1000)}
"""

Write the next scene (3-5 paragraphs). Be vivid, engaging, and maintain consistency with the established tone. Do NOT explain - just write the scene:`;

      const result = await aiService.callAI(prompt, 'creative');
      
      if (result) {
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(prev => prev + '\n\n' + cleanResult);
        
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      }
    } catch (error) {
      console.error('Generate scene failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationMode(null);
    }
  };

  const handleSuggestImprovements = async () => {
    setIsGenerating(true);
    setGenerationMode('improve');
    try {
      // Analyze last portion of text
      const textToAnalyze = content.slice(-2000);
      
      const prompt = `As an expert editor, analyze this text and provide specific, actionable improvement suggestions. Focus on:
- Flow and pacing
- Dialogue quality
- Description vs action balance
- Character voice consistency
- Grammar and style issues

Text to analyze:
"""
${textToAnalyze}
"""

Provide 3-5 specific suggestions with examples of how to fix them:`;

      const result = await aiService.callAI(prompt, 'analytical');
      
      // For now, just alert the suggestions - in future could show in a panel
      if (result) {
        alert('AI Suggestions:\n\n' + result);
      }
    } catch (error) {
      console.error('Suggest improvements failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationMode(null);
    }
  };

  const handleMatchStyle = async () => {
    if (!selectedText || !selectionRange) return;
    
    setIsProcessingSelection(true);
    try {
      // Try to get style profile
      const storyProfile = await db.getAll('storyProfile');
      const styleInfo = storyProfile[0]?.styleProfile || 'Darkly comedic, British bureaucratic satire';
      
      const prompt = `Rewrite this text to better match this style: "${styleInfo}"

Original text:
"${selectedText}"

Rewrite to match the style - keep the meaning but adjust tone and voice. Only return the rewritten text:`;

      const result = await aiService.callAI(prompt, 'creative');
      
      if (result) {
        const before = content.substring(0, selectionRange.start);
        const after = content.substring(selectionRange.end);
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(before + cleanResult + after);
      }
    } catch (error) {
      console.error('Match style failed:', error);
    } finally {
      setIsProcessingSelection(false);
      setShowSelectionTools(false);
    }
  };

  // Advanced Writing Tools
  const handleAddCharacter = async () => {
    setIsGenerating(true);
    setGenerationMode('character');
    try {
      const existingCharacters = actors.map(a => a.name).join(', ');
      
      const prompt = `Write an introduction paragraph for a NEW character entering this scene. 
This should be a character that hasn't appeared yet. 
Make them memorable, quirky, and fitting for a darkly comedic British satire.
Existing characters: ${existingCharacters || 'Not specified'}

Current scene context:
"""
${content.slice(-800)}
"""

Write 1-2 paragraphs introducing a new character. Just the prose, no explanation:`;

      const result = await aiService.callAI(prompt, 'creative');
      
      if (result) {
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(prev => prev + '\n\n' + cleanResult);
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      }
    } catch (error) {
      console.error('Add character failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationMode(null);
    }
  };

  const handleIntegrateSelection = async () => {
    if (!selectedText || !selectionRange) return;
    
    setIsProcessingSelection(true);
    try {
      // Get surrounding context
      const beforeContext = content.substring(Math.max(0, selectionRange.start - 500), selectionRange.start);
      const afterContext = content.substring(selectionRange.end, Math.min(content.length, selectionRange.end + 500));
      
      const prompt = `This text needs to be better integrated into the surrounding scene. Add transitional phrases, sensory details, and smooth connections to make it flow naturally.

Text BEFORE:
"""
${beforeContext}
"""

TEXT TO INTEGRATE:
"""
${selectedText}
"""

Text AFTER:
"""
${afterContext}
"""

Rewrite the middle section to flow better with what comes before and after. Only return the rewritten middle section:`;

      const result = await aiService.callAI(prompt, 'creative');
      
      if (result) {
        const before = content.substring(0, selectionRange.start);
        const after = content.substring(selectionRange.end);
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(before + cleanResult + after);
      }
    } catch (error) {
      console.error('Integrate failed:', error);
    } finally {
      setIsProcessingSelection(false);
      setShowSelectionTools(false);
    }
  };

  const handleMakeFunnier = async () => {
    if (!selectedText || !selectionRange) return;
    
    setIsProcessingSelection(true);
    try {
      const prompt = `Make this passage funnier while keeping the plot intact. Add witty observations, absurd details, or comedic timing. Think Peep Show meets Terry Pratchett.

Original:
"${selectedText}"

Rewrite with more comedy. Only return the rewritten text:`;

      const result = await aiService.callAI(prompt, 'creative');
      
      if (result) {
        const before = content.substring(0, selectionRange.start);
        const after = content.substring(selectionRange.end);
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(before + cleanResult + after);
      }
    } catch (error) {
      console.error('Make funnier failed:', error);
    } finally {
      setIsProcessingSelection(false);
      setShowSelectionTools(false);
    }
  };

  const handleMakeDarker = async () => {
    if (!selectedText || !selectionRange) return;
    
    setIsProcessingSelection(true);
    try {
      const prompt = `Make this passage darker and more ominous while keeping the plot intact. Add dread, unease, or horror undertones. Think Garth Marenghi's Darkplace.

Original:
"${selectedText}"

Rewrite with darker tone. Only return the rewritten text:`;

      const result = await aiService.callAI(prompt, 'creative');
      
      if (result) {
        const before = content.substring(0, selectionRange.start);
        const after = content.substring(selectionRange.end);
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(before + cleanResult + after);
      }
    } catch (error) {
      console.error('Make darker failed:', error);
    } finally {
      setIsProcessingSelection(false);
      setShowSelectionTools(false);
    }
  };

  // Quick mood rewrite handler
  const handleQuickMoodRewrite = async (moodPreset) => {
    if (!selectedText || !selectionRange) return;
    
    setIsProcessingSelection(true);
    try {
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
      
      const moodDesc = `Comedy/Horror: ${preset.comedy_horror}%, Tension: ${preset.tension}%, Pacing: ${preset.pacing}%, Detail: ${preset.detail}%, Emotional: ${preset.emotional}%, Darkness: ${preset.darkness}%, Absurdity: ${preset.absurdity}%, Formality: ${preset.formality}%`;
      const moodGuide = `Rewrite with these mood settings: ${moodDesc}. Keep the same events/meaning but adjust the tone and style to match these settings.`;
      
      const prompt = `${moodGuide}
Only return the rewritten text:

"${selectedText}"`;

      const result = await aiService.callAI(prompt, 'creative');
      
      if (result) {
        const before = content.substring(0, selectionRange.start);
        const after = content.substring(selectionRange.end);
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(before + cleanResult + after);
      }
    } catch (error) {
      console.error('Quick mood rewrite failed:', error);
    } finally {
      setIsProcessingSelection(false);
      setShowSelectionTools(false);
    }
  };

  const handleAddDialogue = async () => {
    setIsGenerating(true);
    setGenerationMode('dialogue');
    try {
      const characterNames = actors.slice(0, 4).map(a => a.name).join(', ');
      
      const prompt = `Write a dialogue exchange (4-8 lines) that continues naturally from this scene. Make the dialogue sharp, character-specific, and revealing.

Characters available: ${characterNames || 'Use characters from context'}

Scene so far:
"""
${content.slice(-1000)}
"""

Write the dialogue exchange. Just the prose with dialogue tags, no explanation:`;

      const result = await aiService.callAI(prompt, 'creative');
      
      if (result) {
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(prev => prev + '\n\n' + cleanResult);
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      }
    } catch (error) {
      console.error('Add dialogue failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationMode(null);
    }
  };

  const handleAddDescription = async () => {
    setIsGenerating(true);
    setGenerationMode('description');
    try {
      const prompt = `Write a rich descriptive paragraph that enhances this scene. Focus on sensory details - sight, sound, smell, texture. Make the world feel lived-in and strange.

Current scene:
"""
${content.slice(-800)}
"""

Write 1-2 descriptive paragraphs. Just the prose, no explanation:`;

      const result = await aiService.callAI(prompt, 'creative');
      
      if (result) {
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(prev => prev + '\n\n' + cleanResult);
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      }
    } catch (error) {
      console.error('Add description failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationMode(null);
    }
  };

  const handleSummarize = async () => {
    if (!selectedText || !selectionRange) return;
    
    setIsProcessingSelection(true);
    try {
      const prompt = `Condense this passage while keeping the essential plot points and best lines. Remove redundancy and tighten the prose.

Original (${selectedText.split(/\s+/).length} words):
"${selectedText}"

Write a tighter version (aim for 50-70% of original length). Only return the condensed text:`;

      const result = await aiService.callAI(prompt, 'creative');
      
      if (result) {
        const before = content.substring(0, selectionRange.start);
        const after = content.substring(selectionRange.end);
        const cleanResult = result.replace(/^["']|["']$/g, '').trim();
        setContent(before + cleanResult + after);
      }
    } catch (error) {
      console.error('Summarize failed:', error);
    } finally {
      setIsProcessingSelection(false);
      setShowSelectionTools(false);
    }
  };

  // Switch chapter
  const handleSwitchChapter = async (chapter) => {
    // Save current first
    if (currentChapter && content !== (currentChapter.content || currentChapter.script || '')) {
      await autoSave(content);
    }
    
    await loadChapter(chapter);
    setShowChapterSelector(false);
  };

  // Add new chapter
  const handleAddChapter = async () => {
    if (!currentBook) return;
    
    try {
      const newChapter = await contextEngine.addChapter(currentBook.id, {
        title: `Chapter ${allChapters.length + 1}`
      });
      
      const chapters = await contextEngine.getAllChaptersWithStatus();
      setAllChapters(chapters);
      
      await loadChapter({ ...newChapter, bookId: currentBook.id });
    } catch (error) {
      console.error('Error adding chapter:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-3 text-slate-400">Loading writing canvas...</span>
      </div>
    );
  }

  // Zen Mode - Minimal distraction-free interface
  if (zenMode) {
    return (
      <div className="relative h-full flex flex-col bg-gradient-to-b from-slate-950 to-slate-900">
        {/* Minimal Header - Just chapter name and save */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/30">
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-slate-300">
              {currentChapter?.title || 'Untitled Chapter'}
            </span>
            <span className="text-sm text-slate-500">
              {wordCount.toLocaleString()} words
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-slate-600">
                Auto-saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        {/* Clean Writing Area */}
        <div className="flex-1 flex justify-center overflow-hidden p-8">
          <div className="w-full max-w-3xl flex flex-col">
            <input
              type="text"
              value={currentChapter?.title || ''}
              onChange={(e) => setCurrentChapter(prev => ({ ...prev, title: e.target.value }))}
              className="text-3xl font-serif text-slate-200 bg-transparent border-none outline-none mb-8 
                placeholder-slate-600 text-center"
              placeholder="Chapter Title"
            />
            
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              className="flex-1 w-full bg-transparent text-slate-200 placeholder-slate-700 
                resize-none outline-none font-serif text-lg leading-relaxed tracking-wide"
              placeholder="Begin writing..."
              style={{ minHeight: '500px' }}
            />
          </div>
        </div>
        
        {/* Subtle word count at bottom */}
        <div className="absolute bottom-4 right-6 text-xs text-slate-700">
          {wordCount > 0 && `${wordCount.toLocaleString()} words • ~${Math.ceil(wordCount / 250)} min read`}
        </div>
      </div>
    );
  }
  
  // Handle Entity Extraction Wizard completion
  const handleEntityWizardComplete = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritingCanvas.jsx:980',message:'Entity wizard completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
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
    console.log('[WritingCanvas] Entity wizard completed, visualizations will update from timelineEvents');
  };
  
  return (
    <div className="relative h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-sm z-20">
        <div className="flex items-center gap-4">
          {/* Chapter Selector */}
          <div className="relative">
            <button
              onClick={() => setShowChapterSelector(!showChapterSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-white">
                {currentChapter?.title || 'Select Chapter'}
              </span>
              {currentChapter?.completed && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showChapterSelector ? 'rotate-180' : ''}`} />
            </button>

            {showChapterSelector && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-30 max-h-80 overflow-y-auto">
                {allChapters.map(chapter => (
                  <button
                    key={`${chapter.bookId}-${chapter.id}`}
                    onClick={() => handleSwitchChapter(chapter)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors
                      ${currentChapter?.id === chapter.id && currentChapter?.bookId === chapter.bookId
                        ? 'bg-amber-500/20 border-l-2 border-amber-500' : ''
                      }`}
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">{chapter.title}</div>
                      <div className="text-xs text-slate-400">
                        {chapter.wordCount || 0} words
                        {chapter.hasContent && ' • Has content'}
                      </div>
                    </div>
                    {chapter.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : chapter.hasContent ? (
                      <Clock className="w-5 h-5 text-amber-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                ))}
                
                <button
                  onClick={handleAddChapter}
                  className="w-full flex items-center gap-2 px-4 py-3 border-t border-slate-700 hover:bg-slate-700 text-amber-400 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Add New Chapter
                </button>
              </div>
            )}
          </div>

          {/* Word count */}
          <div className="text-sm text-slate-400">
            <span className="text-white font-medium">{wordCount.toLocaleString()}</span> words
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Last saved indicator */}
          {lastSaved && (
            <span className="text-xs text-slate-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}

          {/* Analyze completion */}
          <button
            onClick={handleAnalyzeCompletion}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Analyze chapter completeness"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Analyze</span>
          </button>

          {/* Save & Extract button */}
          <button
            onClick={() => {
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WritingCanvas.jsx:1067',message:'SAVE & EXTRACT button clicked',data:{isSaving,hasContent:!!content,contentLength:content?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              handleSave();
            }}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg text-white font-medium transition-colors"
            title="Save chapter and extract entities (triggers Entity Extraction Wizard)"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
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
              title="Toggle Mood Meter"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPlotPanel(!showPlotPanel)}
              className={`p-2 rounded transition-colors ${showPlotPanel ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-white'}`}
              title="Toggle Plot Beats"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {ingestionHealth && (
        <div className={`mx-4 mt-3 px-3 py-2 rounded border text-sm ${
          ingestionHealth.status === 'committed'
            ? 'bg-green-900/30 border-green-700 text-green-200'
            : ingestionHealth.status === 'partial'
            ? 'bg-amber-900/30 border-amber-700 text-amber-200'
            : 'bg-red-900/30 border-red-700 text-red-200'
        }`}>
          <div className="font-semibold">
            Ingestion status: {ingestionHealth.status}
            {ingestionHealth.sessionId ? ` • ${ingestionHealth.sessionId}` : ''}
          </div>
          <div className="text-xs mt-1">
            Events: {ingestionHealth.counts?.events || 0} • Beats: {ingestionHealth.counts?.beats || 0} • Locations: {ingestionHealth.counts?.locations || 0}
          </div>
          {(ingestionHealth.errors || []).length > 0 && (
            <div className="text-xs mt-1">Errors: {(ingestionHealth.errors || []).map(e => e.error).join(' | ')}</div>
          )}
          {ingestionHealth.status !== 'committed' && (
            <button
              onClick={handleSave}
              className="mt-2 px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 border border-slate-600"
            >
              Retry ingestion
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Editor */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Chapter title (editable) */}
            <input
              type="text"
              value={currentChapter?.title || ''}
              onChange={(e) => setCurrentChapter(prev => ({ ...prev, title: e.target.value }))}
              className="text-2xl font-bold text-white bg-transparent border-none outline-none mb-4 placeholder-slate-600"
              placeholder="Chapter Title..."
            />

            {/* Main textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onSelect={handleTextSelect}
              onMouseUp={handleTextSelect}
              onKeyUp={handleTextSelect}
              onClick={handleTextareaClick}
              className="flex-1 w-full bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-slate-200 
                placeholder-slate-600 resize-none outline-none focus:ring-2 focus:ring-amber-500/30 
                focus:border-amber-500/50 transition-all font-mono text-base leading-relaxed"
              placeholder="Start writing your chapter here..."
              style={{ minHeight: '400px' }}
            />
            
            {/* AI Writing Tools Toolbar */}
            <div className="mt-3 bg-slate-800/70 rounded-xl border border-slate-700 overflow-hidden">
              {/* Main quick actions */}
              <div className="flex items-center justify-between p-2 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 px-2 font-medium">✨ AI Write:</span>
                  
                  <button
                    onClick={handleContinueWriting}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 
                      hover:from-amber-500 hover:to-amber-400 disabled:from-slate-600 disabled:to-slate-600
                      rounded-lg text-white text-xs font-medium transition-all shadow-lg shadow-amber-500/20"
                    title="AI writes the next 2-3 paragraphs"
                  >
                    {isGenerating && generationMode === 'continue' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    Continue
                  </button>
                  
                  <button
                    onClick={handleGenerateScene}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500 
                      hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-600 disabled:to-slate-600
                      rounded-lg text-white text-xs font-medium transition-all shadow-lg shadow-cyan-500/20"
                    title="Generate a full scene based on plot beats"
                  >
                    {isGenerating && generationMode === 'scene' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Scene
                  </button>
                  
                  <button
                    onClick={handleAddDialogue}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 
                      hover:from-purple-500 hover:to-purple-400 disabled:from-slate-600 disabled:to-slate-600
                      rounded-lg text-white text-xs font-medium transition-all"
                    title="Add a dialogue exchange"
                  >
                    {isGenerating && generationMode === 'dialogue' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Users className="w-3.5 h-3.5" />
                    )}
                    Dialogue
                  </button>
                  
                  <button
                    onClick={handleAddDescription}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 
                      hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-600 disabled:to-slate-600
                      rounded-lg text-white text-xs font-medium transition-all"
                    title="Add descriptive paragraph"
                  >
                    {isGenerating && generationMode === 'description' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    Describe
                  </button>
                  
                  <button
                    onClick={handleAddCharacter}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-pink-500 
                      hover:from-pink-500 hover:to-pink-400 disabled:from-slate-600 disabled:to-slate-600
                      rounded-lg text-white text-xs font-medium transition-all"
                    title="Introduce a new character"
                  >
                    {isGenerating && generationMode === 'character' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Users className="w-3.5 h-3.5" />
                    )}
                    + Character
                  </button>
                </div>
                
                <button
                  onClick={handleSuggestImprovements}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 
                    disabled:bg-slate-700 disabled:text-slate-500
                    rounded-lg text-slate-300 text-xs transition-all"
                  title="AI analyzes your text and suggests improvements"
                >
                  {isGenerating && generationMode === 'improve' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  Review
                </button>
              </div>
              
              {/* Secondary info bar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/50 text-xs">
                <span className="text-slate-500">
                  💡 Select text for: Rewrite • Expand • Integrate • Funnier • Darker • Condense
                </span>
                <span className="text-slate-600">
                  {isGenerating && <span className="text-amber-400 animate-pulse">AI generating...</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Panels */}
        {showContextPanel && (
          <FloatingPanel
            id="smart-context"
            title="Smart Context"
            icon={Users}
            defaultPosition={{ x: window.innerWidth - 350, y: 100 }}
            defaultSize={{ width: 300, height: 350 }}
            onClose={() => setShowContextPanel(false)}
            collapsible
          >
            <div className="p-3 space-y-4">
              {/* Detected Characters */}
              <div>
                <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2">
                  Characters in Scene ({detectedCharacters.length})
                </h4>
                {detectedCharacters.length > 0 ? (
                  <div className="space-y-2">
                    {detectedCharacters.map(char => {
                      const fullActor = actors.find(a => a.id === char.id);
                      const summary = fullActor?.description?.substring(0, 100) || 
                        fullActor?.biography?.substring(0, 100) ||
                        `${char.name} - Click to view full profile`;
                      
                      return (
                        <div 
                          key={char.id}
                          onClick={() => onNavigate?.('personnel', { actorId: char.id })}
                          className="group flex items-center gap-2 p-2 bg-slate-800/50 hover:bg-amber-500/20 
                            rounded-lg cursor-pointer transition-all"
                          title={`${char.name}: ${summary}${summary.length >= 100 ? '...' : ''}\n\nClick to view full profile`}
                        >
                          <Users className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-white block truncate">{char.name}</span>
                            {char.role && (
                              <span className="text-xs text-slate-500">{char.role}</span>
                            )}
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 
                            opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No characters detected yet</p>
                )}
              </div>

              {/* Detected Items */}
              <div>
                <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2">
                  Items Mentioned ({detectedItems.length})
                </h4>
                {detectedItems.length > 0 ? (
                  <div className="space-y-2">
                    {detectedItems.map(item => {
                      const fullItem = items.find(i => i.id === item.id);
                      const summary = fullItem?.description?.substring(0, 100) ||
                        fullItem?.effect?.substring(0, 100) ||
                        `${item.name} - Click to view details`;
                      
                      return (
                        <div 
                          key={item.id}
                          onClick={() => onNavigate?.('inventory', { itemId: item.id })}
                          className="group flex items-center gap-2 p-2 bg-slate-800/50 hover:bg-cyan-500/20 
                            rounded-lg cursor-pointer transition-all"
                          title={`${item.name}: ${summary}${summary.length >= 100 ? '...' : ''}\n\nClick to view details`}
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
                  <p className="text-xs text-slate-500 italic">No items detected yet</p>
                )}
              </div>
              
              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-600 italic text-center">
                  Hover for quick view • Click to open
                </p>
              </div>
            </div>
          </FloatingPanel>
        )}

        {showMoodPanel && (
          <FloatingPanel
            id="mood-meter"
            title="Mood Balance"
            icon={Sparkles}
            defaultPosition={{ x: window.innerWidth - 350, y: 480 }}
            defaultSize={{ width: 300, height: 300 }}
            onClose={() => setShowMoodPanel(false)}
            collapsible
          >
            <div className="p-2">
              <MoodMeter text={content} />
            </div>
          </FloatingPanel>
        )}
      </div>

      {/* Bottom Plot Beats Panel */}
      {showPlotPanel && plotBeatsForChapter.length > 0 && (
        <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-3 max-h-48 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-white">Plot Beats for This Chapter</span>
            <span className="text-xs text-slate-500">
              {plotBeatsForChapter.filter(b => b.completed).length}/{plotBeatsForChapter.length} complete
            </span>
          </div>
          <div className="space-y-2">
            {plotBeatsForChapter.map((beat, idx) => (
              <button
                key={beat.id || `beat-${idx}`}
                onClick={() => handleTogglePlotBeat(beat.id)}
                className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left
                  ${beat.completed 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-slate-800/70 border border-slate-700 hover:bg-slate-700'
                  }`}
              >
                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center
                  ${beat.completed ? 'bg-green-500 border-green-500' : 'border-slate-500'}`}
                >
                  {beat.completed && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`${beat.completed ? 'line-through text-green-400' : 'text-slate-200'}`}>
                    <span className="text-amber-400 font-mono mr-2">#{idx + 1}</span>
                    {beat.beat || beat.purpose || beat.description || 'Unnamed beat'}
                  </div>
                  {beat.purpose && beat.beat && (
                    <div className="text-xs text-slate-500 mt-1 truncate">
                      Purpose: {beat.purpose}
                    </div>
                  )}
                  {beat.targetChapter && (
                    <div className="text-xs text-slate-500">
                      Chapter {beat.targetChapter}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selection Toolbar (floating) */}
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
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
            <span className="text-xs text-amber-400 font-medium">
              ✂️ {selectedText.length} chars selected
            </span>
            <button
              onClick={() => setShowSelectionTools(false)}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Actions Grid */}
          <div className="p-2">
            {/* Basic Actions */}
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              <button
                onClick={handleRewrite}
                disabled={isProcessingSelection}
                className="flex flex-col items-center gap-1 px-2 py-2 bg-amber-600/20 hover:bg-amber-600/40 disabled:bg-slate-700 rounded-lg text-amber-400 text-xs font-medium transition-colors"
                title="Rewrite with better clarity"
              >
                {isProcessingSelection ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Rewrite
              </button>
            
            <button
              onClick={handleExpand}
              disabled={isProcessingSelection}
              className="flex flex-col items-center gap-1 px-2 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 disabled:bg-slate-700 rounded-lg text-cyan-400 text-xs font-medium transition-colors"
              title="Expand with more detail"
            >
              {isProcessingSelection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Maximize2 className="w-4 h-4" />}
              Expand
            </button>
            
            <ReadAloudButton
              onClick={() => {
                setShowReadAloudPanel(true);
                setShowSelectionTools(false);
              }}
              disabled={!selectedText || isProcessingSelection}
            />
            
            <button
              onClick={handleSummarize}
              disabled={isProcessingSelection}
              className="flex flex-col items-center gap-1 px-2 py-2 bg-slate-600/20 hover:bg-slate-600/40 disabled:bg-slate-700 rounded-lg text-slate-300 text-xs font-medium transition-colors"
              title="Condense and tighten"
            >
              {isProcessingSelection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minimize2 className="w-4 h-4" />}
              Condense
            </button>
            
            <button
              onClick={handleIntegrateSelection}
              disabled={isProcessingSelection}
              className="flex flex-col items-center gap-1 px-2 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 disabled:bg-slate-700 rounded-lg text-emerald-400 text-xs font-medium transition-colors"
              title="Better integrate into scene"
            >
              {isProcessingSelection ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Integrate
            </button>
            
            <button
              onClick={handleMakeFunnier}
              disabled={isProcessingSelection}
              className="flex flex-col items-center gap-1 px-2 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 disabled:bg-slate-700 rounded-lg text-yellow-400 text-xs font-medium transition-colors"
              title="Add more comedy"
            >
              {isProcessingSelection ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-base">😄</span>}
              Funnier
            </button>
            
            <button
              onClick={handleMakeDarker}
              disabled={isProcessingSelection}
              className="flex flex-col items-center gap-1 px-2 py-2 bg-red-600/20 hover:bg-red-600/40 disabled:bg-slate-700 rounded-lg text-red-400 text-xs font-medium transition-colors"
              title="Add darker tone"
            >
              {isProcessingSelection ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-base">🌑</span>}
              Darker
            </button>
            
            <button
              onClick={handleMatchStyle}
              disabled={isProcessingSelection}
              className="flex flex-col items-center gap-1 px-2 py-2 bg-purple-600/20 hover:bg-purple-600/40 disabled:bg-slate-700 rounded-lg text-purple-400 text-xs font-medium transition-colors"
              title="Match your story's style"
            >
              {isProcessingSelection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Style
            </button>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedText);
                setShowSelectionTools(false);
              }}
              className="flex flex-col items-center gap-1 px-2 py-2 bg-slate-600/20 hover:bg-slate-600/40 rounded-lg text-slate-400 text-xs font-medium transition-colors"
              title="Copy selection"
            >
              <FileText className="w-4 h-4" />
              Copy
            </button>
            </div>
            
            {/* Mood Quick Actions */}
            <div className="border-t border-slate-700 pt-2">
              <div className="text-xs text-slate-500 mb-1.5 px-1">Mood Rewrites:</div>
              <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => handleQuickMoodRewrite('comedy')}
                  disabled={isProcessingSelection}
                  title="Comedy: Funnier, absurd, casual"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 disabled:bg-slate-700 rounded text-yellow-400 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">😄</span>}
                  <span>Comedy</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('horror')}
                  disabled={isProcessingSelection}
                  title="Horror: Dark, tense, unsettling"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-red-600/20 hover:bg-red-600/40 disabled:bg-slate-700 rounded text-red-400 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">💀</span>}
                  <span>Horror</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('tense')}
                  disabled={isProcessingSelection}
                  title="Tense: High tension, urgent, fast-paced"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-orange-600/20 hover:bg-orange-600/40 disabled:bg-slate-700 rounded text-orange-400 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">⚡</span>}
                  <span>Tense</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('relaxed')}
                  disabled={isProcessingSelection}
                  title="Relaxed: Calm, slow, detailed"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-green-600/20 hover:bg-green-600/40 disabled:bg-slate-700 rounded text-green-400 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">🌿</span>}
                  <span>Relaxed</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('fast')}
                  disabled={isProcessingSelection}
                  title="Fast: Quick pacing, snappy, minimal detail"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 disabled:bg-slate-700 rounded text-blue-400 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">⚡</span>}
                  <span>Fast</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('slow')}
                  disabled={isProcessingSelection}
                  title="Slow: Measured, contemplative, rich detail"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 disabled:bg-slate-700 rounded text-indigo-400 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">🐌</span>}
                  <span>Slow</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('rich')}
                  disabled={isProcessingSelection}
                  title="Rich: Detailed, sensory, immersive"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 disabled:bg-slate-700 rounded text-purple-400 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">✨</span>}
                  <span>Rich</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('sparse')}
                  disabled={isProcessingSelection}
                  title="Sparse: Minimal, focused, essential only"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-slate-600/20 hover:bg-slate-600/40 disabled:bg-slate-700 rounded text-slate-400 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">📝</span>}
                  <span>Sparse</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('intense')}
                  disabled={isProcessingSelection}
                  title="Intense: Emotionally charged, high impact"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-pink-600/20 hover:bg-pink-600/40 disabled:bg-slate-700 rounded text-pink-400 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">🔥</span>}
                  <span>Intense</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('detached')}
                  disabled={isProcessingSelection}
                  title="Detached: Clinical, unemotional, formal"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-gray-600/20 hover:bg-gray-600/40 disabled:bg-slate-700 rounded text-gray-400 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">🧊</span>}
                  <span>Detached</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('dark')}
                  disabled={isProcessingSelection}
                  title="Dark: Bleak, ominous, heavy"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-black/40 hover:bg-black/60 disabled:bg-slate-700 rounded text-slate-300 text-xs border border-slate-700 transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">🌑</span>}
                  <span>Dark</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('light')}
                  disabled={isProcessingSelection}
                  title="Light: Bright, optimistic, playful"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/40 disabled:bg-slate-700 rounded text-yellow-300 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">☀️</span>}
                  <span>Light</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('absurd')}
                  disabled={isProcessingSelection}
                  title="Absurd: Surreal, ridiculous, comedic"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 disabled:bg-slate-700 rounded text-cyan-400 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">🎭</span>}
                  <span>Absurd</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('grounded')}
                  disabled={isProcessingSelection}
                  title="Grounded: Realistic, believable, down-to-earth"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-amber-700/20 hover:bg-amber-700/40 disabled:bg-slate-700 rounded text-amber-300 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">🌍</span>}
                  <span>Grounded</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('formal')}
                  disabled={isProcessingSelection}
                  title="Formal: Proper, structured, dignified"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-slate-700/40 hover:bg-slate-700/60 disabled:bg-slate-700 rounded text-slate-200 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">🎩</span>}
                  <span>Formal</span>
                </button>
                <button 
                  onClick={() => handleQuickMoodRewrite('casual')}
                  disabled={isProcessingSelection}
                  title="Casual: Conversational, relaxed, informal"
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 disabled:bg-slate-700 rounded text-blue-300 text-xs transition-colors">
                  {isProcessingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-sm">💬</span>}
                  <span>Casual</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Analysis Modal */}
      {showCompletionPanel && completionAnalysis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-500" />
              Chapter Analysis
            </h3>

            <div className="space-y-4">
              {/* Confidence meter */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Completion Confidence</span>
                  <span className="text-white font-medium">{completionAnalysis.confidence}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      completionAnalysis.confidence >= 70 ? 'bg-green-500' :
                      completionAnalysis.confidence >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${completionAnalysis.confidence}%` }}
                  />
                </div>
              </div>

              {/* Word count */}
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Word Count</span>
                <span className="text-white">{completionAnalysis.wordCount?.toLocaleString()}</span>
              </div>

              {/* Reasons */}
              <div>
                <span className="text-sm text-slate-400">Analysis Notes:</span>
                <ul className="mt-2 space-y-1">
                  {completionAnalysis.reasons?.map((reason, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Current status */}
              <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-400">Current Status:</span>
                <span className={`font-medium ${currentChapter?.completed ? 'text-green-400' : 'text-amber-400'}`}>
                  {currentChapter?.completed ? 'Complete' : 'In Progress'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCompletionPanel(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
              >
                Close
              </button>
              {currentChapter?.completed ? (
                <button
                  onClick={() => handleMarkComplete(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Mark In Progress
                </button>
              ) : (
                <button
                  onClick={() => handleMarkComplete(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Read Aloud Panel */}
      <ReadAloudPanel
        text={selectedText || content}
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
      
      {/* Entity Extraction Wizard */}
      {showEntityWizard && currentChapter && currentBook && (
        <EntityExtractionWizard
          chapterText={content}
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
    </div>
  );
};

export default WritingCanvas;

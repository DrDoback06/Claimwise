import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Sparkles,
  Users,
  Globe,
  Map,
  ChevronRight,
  ChevronLeft,
  Check,
  Copy,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Wand2,
  HelpCircle,
  PenTool
} from 'lucide-react';
import promptTemplates, { formatForClipboard, parseExternalAIResponse } from '../services/promptTemplates';
import contextEngine from '../services/contextEngine';
import db from '../services/database';
import styleReferenceService from '../services/styleReferenceService';
import StyleTestPanel from './StyleTestPanel';
import aiService from '../services/aiService';

/**
 * Onboarding Wizard Component
 * 5-step guided setup for the Writer's Universe Intelligence System
 * Also used for editing existing story setup
 */
const OnboardingWizard = ({ onComplete, existingData = null }) => {
  const [currentStep, setCurrentStep] = useState(0); // 0 = mode selection, 1-5 = steps
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false); // True when editing existing setup
  
  // Quick Import state
  const [quickImportMode, setQuickImportMode] = useState(false);
  const [quickImportContext, setQuickImportContext] = useState('');
  const [quickImportResponse, setQuickImportResponse] = useState('');
  const [quickImportParsed, setQuickImportParsed] = useState(null);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  // Step 1: Story Foundation
  const [storyData, setStoryData] = useState({
    title: '',
    genres: ['fantasy'], // Now supports multiple genres
    subGenres: [],
    premise: '',
    targetAudience: 'adult',
    comparisons: '',
    tone: ''
  });

  // Step 2: Style Analysis
  const [styleData, setStyleData] = useState({
    hasFirstChapter: true,
    chapterText: '',
    ideaDescription: '',
    styleProfile: null,
    rawResponse: '',
    styleReference: '' // Writing examples/reference material
  });

  // Step 3: Character Profiles
  const [characters, setCharacters] = useState([]);
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    role: '',
    description: '',
    dialogueSamples: '',
    voiceProfile: null
  });
  const [editingCharacter, setEditingCharacter] = useState(null);

  // Step 4: World Rules
  const [worldRules, setWorldRules] = useState({
    description: '',
    rules: null,
    rawResponse: ''
  });

  // Step 5: Plot Roadmap
  const [plotData, setPlotData] = useState({
    hasOutline: false,
    outlineText: '',
    targetChapters: 12,
    plotBeats: [],
    rawResponse: ''
  });

  // Step 6: Style Test
  const [styleTestCompleted, setStyleTestCompleted] = useState(false);

  // Step 7: Style Instructions
  const [styleInstructions, setStyleInstructions] = useState([]);
  const [isGeneratingInstructions, setIsGeneratingInstructions] = useState(false);

  const genres = [
    { id: 'fantasy', label: 'Fantasy', features: ['Mind maps', 'World building', 'Magic systems'] },
    { id: 'rpg-lite', label: 'RPG-Lite', features: ['Items', 'Skills', 'Stats', 'Character progression'] },
    { id: 'horror', label: 'Horror', features: ['Mood sliders', 'Atmosphere', 'Tension tracking'] },
    { id: 'comedy', label: 'Comedy', features: ['Humor timing', 'Character quirks', 'Running gags'] },
    { id: 'sci-fi', label: 'Sci-Fi', features: ['Tech systems', 'Timeline tracking', 'World rules'] },
    { id: 'literary', label: 'Literary Fiction', features: ['Character depth', 'Theme tracking', 'Style analysis'] },
    { id: 'thriller', label: 'Thriller', features: ['Plot threads', 'Tension tracking', 'Pacing control'] },
    { id: 'romance', label: 'Romance', features: ['Relationship tracking', 'Emotional beats', 'Chemistry'] }
  ];

  const steps = [
    { id: 1, title: 'Story Foundation', icon: BookOpen, description: 'Define your story\'s core identity' },
    { id: 2, title: 'Style Analysis', icon: Sparkles, description: 'Capture your unique writing voice' },
    { id: 3, title: 'Character Profiles', icon: Users, description: 'Define how your characters speak' },
    { id: 4, title: 'World Rules', icon: Globe, description: 'Establish your story\'s boundaries' },
    { id: 5, title: 'Plot Roadmap', icon: Map, description: 'Map out your story\'s journey' },
    { id: 6, title: 'Style Test', icon: Sparkles, description: 'Rate AI examples to refine your style' },
    { id: 7, title: 'Style Instructions', icon: PenTool, description: 'Finalize specific style rules' }
  ];

  // Load existing progress
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progress = await contextEngine.getOnboardingProgress();
      if (progress && progress.data) {
        if (progress.data.storyData) {
          // Migrate old `genre` to new `genres` array format
          const loadedStoryData = progress.data.storyData;
          if (!loadedStoryData.genres && loadedStoryData.genre) {
            loadedStoryData.genres = [loadedStoryData.genre];
          }
          setStoryData(loadedStoryData);
        }
        if (progress.data.styleData) setStyleData(progress.data.styleData);
        if (progress.data.characters) setCharacters(progress.data.characters);
        if (progress.data.worldRules) setWorldRules(progress.data.worldRules);
        if (progress.data.plotData) setPlotData(progress.data.plotData);
        
        // Check if onboarding was already completed
        if (progress.completedAt) {
          setIsEditMode(true);
          // Jump to step 1 for editing (skip mode selection)
          setCurrentStep(1);
        } else if (progress.currentStep != null) {
          // Use != null to allow 0 (mode selection step)
          setCurrentStep(progress.currentStep);
        }
      }
    } catch (e) {
      console.error('Error loading progress:', e);
    }
  };

  const saveProgress = async () => {
    try {
      await contextEngine.saveOnboardingProgress({
        currentStep,
        data: {
          storyData,
          styleData,
          characters,
          worldRules,
          plotData
        }
      });
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  };

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timer);
  }, [storyData, styleData, characters, worldRules, plotData, currentStep]);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(id);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  // Quick Import: Parse response and auto-fill all fields
  const handleQuickImportParse = (response) => {
    setQuickImportResponse(response);
    
    // Don't try to parse empty or very short responses
    if (!response || response.trim().length < 10) {
      setQuickImportParsed(null);
      setError(null);
      return;
    }
    
    try {
      const parsed = parseExternalAIResponse(response);
      
      // Validate that we got a valid object
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Response did not contain a valid JSON object.');
      }
      
      // Be very lenient - accept if we find ANY usable data
      // Check for various possible field names
      const hasStory = parsed.storyFoundation || parsed.story || parsed.foundation || parsed.title;
      const hasStyle = parsed.styleProfile || parsed.style || parsed.voice || parsed.writingStyle;
      const hasChars = Array.isArray(parsed.characters) || Array.isArray(parsed.cast);
      const hasWorld = parsed.worldRules || parsed.world || parsed.setting || parsed.rules;
      const hasPlot = Array.isArray(parsed.plotBeats) || Array.isArray(parsed.plot) || Array.isArray(parsed.beats);
      const hasMood = parsed.moodDefaults || parsed.mood || parsed.defaults;
      
      // Accept if we have at least ONE piece of usable data
      if (!hasStory && !hasStyle && !hasChars && !hasWorld && !hasPlot && !hasMood) {
        // Show what keys we DID find
        const foundKeys = Object.keys(parsed).slice(0, 5).join(', ');
        throw new Error(`JSON parsed but couldn't find expected fields. Found: ${foundKeys}...`);
      }
      
      // Normalize alternative field names to our expected structure
      const normalizedData = {
        storyFoundation: parsed.storyFoundation || parsed.story || parsed.foundation || 
                        (parsed.title ? { title: parsed.title, ...parsed } : null),
        styleProfile: parsed.styleProfile || parsed.style || parsed.voice || parsed.writingStyle,
        characters: parsed.characters || parsed.cast || [],
        worldRules: parsed.worldRules || parsed.world || parsed.setting || parsed.rules,
        plotBeats: parsed.plotBeats || parsed.plot || parsed.beats || [],
        moodDefaults: parsed.moodDefaults || parsed.mood || parsed.defaults
      };
      
      // Debug: Log what we actually got
      console.log('Parsed data structure:', {
        hasStoryFoundation: !!normalizedData.storyFoundation,
        hasStyleProfile: !!normalizedData.styleProfile,
        charactersCount: Array.isArray(normalizedData.characters) ? normalizedData.characters.length : 'not an array',
        charactersType: typeof normalizedData.characters,
        charactersValue: normalizedData.characters,
        plotBeatsCount: Array.isArray(normalizedData.plotBeats) ? normalizedData.plotBeats.length : 'not an array',
        plotBeatsType: typeof normalizedData.plotBeats,
        plotBeatsValue: normalizedData.plotBeats,
        allKeys: Object.keys(parsed)
      });
      
      // Ensure arrays are actually arrays
      if (!Array.isArray(normalizedData.characters)) {
        console.warn('Characters is not an array, attempting to fix...');
        if (normalizedData.characters && typeof normalizedData.characters === 'object') {
          normalizedData.characters = Object.values(normalizedData.characters);
        } else {
          normalizedData.characters = [];
        }
      }
      
      if (!Array.isArray(normalizedData.plotBeats)) {
        console.warn('PlotBeats is not an array, attempting to fix...');
        if (normalizedData.plotBeats && typeof normalizedData.plotBeats === 'object') {
          normalizedData.plotBeats = Object.values(normalizedData.plotBeats);
        } else {
          normalizedData.plotBeats = [];
        }
      }
      
      setQuickImportParsed(normalizedData);
      setError(null);
      
      // Log what was found
      const found = [];
      if (normalizedData.storyFoundation) found.push('Story');
      if (normalizedData.styleProfile) found.push('Style');
      if (normalizedData.characters?.length) found.push(`${normalizedData.characters.length} Characters`);
      if (normalizedData.worldRules) found.push('World Rules');
      if (normalizedData.plotBeats?.length) found.push(`${normalizedData.plotBeats.length} Plot Beats`);
      if (normalizedData.moodDefaults) found.push('Mood Defaults');
      
      console.log('Quick Import parsed successfully. Found:', found.join(', '));
    } catch (e) {
      console.error('Quick Import parse error:', e.message);
      setError(e.message || 'Could not parse the response. Please make sure ChatGPT returned valid JSON.');
      setQuickImportParsed(null);
    }
  };

  // Quick Import: Apply parsed data to all fields
  // Flexibly handles any structure ChatGPT provides
  const applyQuickImport = () => {
    if (!quickImportParsed) return;

    const data = quickImportParsed;
    const importLog = [];

    // Apply Story Foundation - flexible field matching
    if (data.storyFoundation) {
      const sf = data.storyFoundation;
      // Handle genres - can be string, array, or comma-separated
      let importedGenres = [];
      if (Array.isArray(sf.genres)) {
        importedGenres = sf.genres.map(g => normalizeGenre(g)).filter(Boolean);
      } else if (Array.isArray(sf.genre)) {
        importedGenres = sf.genre.map(g => normalizeGenre(g)).filter(Boolean);
      } else if (typeof sf.genres === 'string') {
        importedGenres = sf.genres.split(/[,\/]/).map(g => normalizeGenre(g.trim())).filter(Boolean);
      } else if (typeof sf.genre === 'string') {
        importedGenres = sf.genre.split(/[,\/]/).map(g => normalizeGenre(g.trim())).filter(Boolean);
      }
      if (importedGenres.length === 0) importedGenres = ['fantasy'];
      
      setStoryData({
        title: sf.title || sf.name || sf.storyTitle || '',
        genres: importedGenres,
        subGenres: Array.isArray(sf.subGenres) ? sf.subGenres : 
                   (sf.subGenres ? [sf.subGenres] : []),
        premise: sf.premise || sf.synopsis || sf.description || sf.summary || '',
        targetAudience: sf.targetAudience || sf.audience || 'adult',
        comparisons: sf.comparisons || sf.comparable || sf.similarTo || '',
        tone: sf.tone || sf.overallTone || ''
      });
      importLog.push('✓ Story Foundation imported');
    }

    // Apply Style Profile - store the full object for flexibility
    if (data.styleProfile) {
      setStyleData(prev => ({
        ...prev,
        styleProfile: data.styleProfile
      }));
      importLog.push('✓ Style Profile imported');
    }

    // Apply Characters - flexible field mapping
    if (data.characters && Array.isArray(data.characters)) {
      setCharacters(data.characters.map((char, idx) => ({
        id: `char_${Date.now()}_${idx}`,
        name: char.name || char.characterName || `Character ${idx + 1}`,
        role: char.role || char.type || char.archetype || '',
        description: char.description || char.bio || char.backstory || '',
        dialogueSamples: Array.isArray(char.exampleDialogue) ? char.exampleDialogue.join('\n') :
                         Array.isArray(char.dialogue) ? char.dialogue.join('\n') :
                         char.exampleDialogue || char.dialogue || '',
        voiceProfile: char.voiceProfile || char.voice || char.speechPattern || null
      })));
      importLog.push(`✓ ${data.characters.length} Characters imported`);
    }

    // Apply World Rules - store full object
    if (data.worldRules) {
      setWorldRules({
        description: data.worldRules.description || data.worldRules.overview || '',
        rules: data.worldRules,
        rawResponse: ''
      });
      importLog.push('✓ World Rules imported');
    }

    // Apply Plot Beats - flexible field mapping
    if (data.plotBeats && Array.isArray(data.plotBeats)) {
      setPlotData(prev => ({
        ...prev,
        plotBeats: data.plotBeats.map((beat, idx) => ({
          id: `beat_${Date.now()}_${idx}`,
          beat: beat.beat || beat.description || beat.event || beat.what || '',
          chapter: beat.chapter ?? beat.chapterNumber ?? null,
          purpose: beat.purpose || beat.why || beat.significance || '',
          characters: Array.isArray(beat.characters) ? beat.characters : [],
          emotionalTone: beat.emotionalTone || beat.mood || beat.tone || '',
          completed: false
        }))
      }));
      importLog.push(`✓ ${data.plotBeats.length} Plot Beats imported`);
    }

    // Apply Mood Defaults if provided
    if (data.moodDefaults) {
      // Store for later use by the context engine
      localStorage.setItem('story_mood_defaults', JSON.stringify(data.moodDefaults));
      importLog.push('✓ Mood Defaults saved');
    }

    console.log('Quick Import completed:', importLog);
    
    // Move to step 1 for review
    setQuickImportMode(false);
    setCurrentStep(1);
  };

  // Helper to normalize genre strings
  const normalizeGenre = (genre) => {
    if (!genre) return 'fantasy';
    const g = genre.toLowerCase().replace(/[^a-z]/g, '');
    const genreMap = {
      'fantasy': 'fantasy',
      'rpglite': 'rpg-lite',
      'rpg': 'rpg-lite',
      'horror': 'horror',
      'comedy': 'comedy',
      'scifi': 'sci-fi',
      'sciencefiction': 'sci-fi',
      'literary': 'literary',
      'literaryfiction': 'literary',
      'thriller': 'thriller',
      'romance': 'romance'
    };
    return genreMap[g] || 'fantasy';
  };

  const handleStyleResponsePaste = (rawResponse) => {
    try {
      const parsed = parseExternalAIResponse(rawResponse);
      setStyleData(prev => ({
        ...prev,
        rawResponse,
        styleProfile: parsed
      }));
      setError(null);
    } catch (e) {
      setError('Could not parse the response. Please make sure you copied the full JSON response from ChatGPT.');
    }
  };

  const handleWorldRulesResponsePaste = (rawResponse) => {
    try {
      const parsed = parseExternalAIResponse(rawResponse);
      setWorldRules(prev => ({
        ...prev,
        rawResponse,
        rules: parsed
      }));
      setError(null);
    } catch (e) {
      setError('Could not parse the response. Please make sure you copied the full JSON response.');
    }
  };

  const handlePlotResponsePaste = (rawResponse) => {
    // Always update the raw response
    setPlotData(prev => ({ ...prev, rawResponse }));
    
    // Only try to parse if there's substantial content
    if (!rawResponse || rawResponse.trim().length < 10) {
      return;
    }
    
    try {
      const parsed = parseExternalAIResponse(rawResponse);
      
      // Flexible field matching for plot beats
      const beatData = parsed.plotBeats || parsed.plot || parsed.beats || 
                       parsed.chapters || parsed.outline || [];
      
      if (Array.isArray(beatData) && beatData.length > 0) {
        // Map beats to our expected format
        const mappedBeats = beatData.map((beat, idx) => {
          // Handle various field names
          const beatText = beat.beat || beat.description || beat.event || 
                          beat.what || beat.summary || beat.action ||
                          (typeof beat === 'string' ? beat : '');
          
          const chapter = beat.chapter ?? beat.chapterNumber ?? 
                         beat.ch ?? beat.number ?? null;
          
          const purpose = beat.purpose || beat.why || beat.significance || 
                         beat.reason || beat.importance || '';
          
          const tone = beat.emotionalTone || beat.mood || beat.tone || 
                      beat.emotion || '';
          
          const chars = Array.isArray(beat.characters) ? beat.characters :
                       Array.isArray(beat.actors) ? beat.actors : [];
          
          return {
            id: `beat_${Date.now()}_${idx}`,
            beat: beatText,
            chapter: typeof chapter === 'number' ? chapter : null,
            purpose,
            characters: chars,
            emotionalTone: tone,
            completed: false
          };
        }).filter(beat => beat.beat.trim() !== '');
        
        if (mappedBeats.length > 0) {
          setPlotData(prev => ({
            ...prev,
            plotBeats: mappedBeats
          }));
          console.log(`[Plot Roadmap] Parsed ${mappedBeats.length} plot beats`);
        }
      }
      
      setError(null);
    } catch (e) {
      console.warn('Plot parse warning:', e.message);
      // Don't show error for every keystroke - only if it looks like complete JSON
      if (rawResponse.includes('}') && rawResponse.includes('{')) {
        setError('Could not parse plot beats from the response. Try the manual entry below.');
      }
    }
  };

  const handleCharacterVoiceResponsePaste = (rawResponse, characterIndex) => {
    try {
      const parsed = parseExternalAIResponse(rawResponse);
      const updated = [...characters];
      updated[characterIndex] = {
        ...updated[characterIndex],
        voiceProfile: parsed
      };
      setCharacters(updated);
      setError(null);
    } catch (e) {
      setError('Could not parse the character voice response.');
    }
  };

  const addCharacter = () => {
    if (newCharacter.name.trim()) {
      setCharacters([...characters, { ...newCharacter, id: `char_${Date.now()}` }]);
      setNewCharacter({
        name: '',
        role: '',
        description: '',
        dialogueSamples: '',
        voiceProfile: null
      });
    }
  };

  const removeCharacter = (index) => {
    setCharacters(characters.filter((_, i) => i !== index));
  };

  const addPlotBeat = () => {
    setPlotData(prev => ({
      ...prev,
      plotBeats: [
        ...prev.plotBeats,
        {
          id: `beat_${Date.now()}`,
          chapter: null,
          beat: '',
          purpose: '',
          characters: [],
          completed: false
        }
      ]
    }));
  };

  const updatePlotBeat = (index, field, value) => {
    const updated = [...plotData.plotBeats];
    updated[index] = { ...updated[index], [field]: value };
    setPlotData(prev => ({ ...prev, plotBeats: updated }));
  };

  const removePlotBeat = (index) => {
    setPlotData(prev => ({
      ...prev,
      plotBeats: prev.plotBeats.filter((_, i) => i !== index)
    }));
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[Wizard] Starting full app population...');

      // 1. Save the complete story profile
      await contextEngine.saveStoryProfile({
        title: storyData.title,
        genres: storyData.genres || ['fantasy'],
        genre: storyData.genres?.[0] || 'fantasy',
        subGenres: storyData.subGenres,
        premise: storyData.premise,
        targetAudience: storyData.targetAudience,
        comparisons: storyData.comparisons,
        tone: storyData.tone,
        styleProfile: styleData.styleProfile,
        worldRules: worldRules.rules || worldRules.description,
        completedAt: Date.now()
      });
      console.log('[Wizard] Story profile saved');

      // 2. Save story meta for app-wide access
      const storyMeta = {
        id: 'story_meta',
        premise: storyData.premise,
        tone: storyData.tone || storyData.comparisons,
        title: storyData.title,
        genres: storyData.genres,
        createdAt: Date.now()
      };
      await db.update('meta', storyMeta);
      console.log('[Wizard] Story meta saved');

      // 2.5. Save style reference if provided
      if (styleData.styleReference && styleData.styleReference.trim().length > 0) {
        try {
          await styleReferenceService.saveStyleReference({
            name: `${storyData.title || 'Story'} - Writing Examples`,
            content: styleData.styleReference.trim(),
            type: 'examples',
            scope: 'global', // Global so it's always available
            projectId: null,
            metadata: {
              source: 'onboarding_wizard',
              createdAt: Date.now()
            }
          });
          console.log('[Wizard] Style reference saved');
        } catch (error) {
          console.warn('[Wizard] Failed to save style reference:', error);
          // Don't fail the whole wizard if style reference fails
        }
      }

      // 3. Create default stat registry if genres include RPG elements
      const isRPGLite = storyData.genres?.includes('rpg-lite');
      const defaultStats = [
        { id: "st1", key: "STR", name: "Strength", desc: "Physical power & carry weight.", isCore: true, color: "green" },
        { id: "st2", key: "VIT", name: "Vitality", desc: "Health & endurance.", isCore: true, color: "green" },
        { id: "st3", key: "INT", name: "Intelligence", desc: "Magic & logic puzzles.", isCore: true, color: "blue" },
        { id: "st4", key: "DEX", name: "Dexterity", desc: "Agility & speed.", isCore: true, color: "yellow" }
      ];
      
      const existingStats = await db.getAll('statRegistry');
      if (existingStats.length === 0) {
        await db.bulkAdd('statRegistry', defaultStats);
        console.log('[Wizard] Default stat registry created');
      }

      // 4. Create actors from wizard characters
      if (characters.length > 0) {
        const createdActors = [];
        for (let i = 0; i < characters.length; i++) {
          const char = characters[i];
          const actorId = `actor_${Date.now()}_${i}`;
          
          const newActor = {
            id: actorId,
            name: char.name,
            nicknames: [],
            class: char.role || 'Character',
            role: char.role || '',
            desc: char.description || '',
            biography: char.description || '',
            isFav: i < 3, // First 3 characters are favorites
            baseStats: isRPGLite ? { STR: 10, VIT: 10, INT: 10, DEX: 10 } : {},
            additionalStats: {},
            activeSkills: [],
            inventory: [],
            snapshots: {},
            equipment: {
              helm: null, cape: null, amulet: null, armour: null,
              gloves: null, belt: null, boots: null,
              leftHand: null, rightHand: null,
              rings: [null, null, null, null, null, null, null],
              charms: [null, null, null, null]
            },
            appearances: {},
            arcMilestones: {},
            lastConsistencyCheck: null,
            aiSuggestions: [],
            voiceProfileId: char.voiceProfile ? `voice_${actorId}` : null,
            createdAt: Date.now(),
            createdFromWizard: true
          };
          
          await db.add('actors', newActor);
          createdActors.push(newActor);

          // Save voice profile if available
          if (char.voiceProfile) {
            await contextEngine.saveCharacterVoice(actorId, {
              characterName: char.name,
              role: char.role,
              description: char.description,
              ...char.voiceProfile
            });
          }
        }
        console.log(`[Wizard] Created ${createdActors.length} actors`);
      }

      // 5. Create the first book with Chapter 1 in the Bible
      const firstBook = {
        id: 1,
        title: storyData.title || 'Book 1',
        focus: storyData.premise?.slice(0, 100) || '',
        chapters: [
          {
            id: 1,
            number: 1,
            title: 'Chapter 1',
            desc: '',
            content: '',
            script: '',
            completed: false,
            wordCount: 0,
            createdAt: Date.now()
          }
        ],
        createdAt: Date.now()
      };
      
      const existingBooks = await db.getAll('books');
      if (existingBooks.length === 0) {
        await db.add('books', firstBook);
        console.log('[Wizard] First book created with Chapter 1');
      }

      // 6. Save plot beats
      if (plotData.plotBeats.length > 0) {
        const beatsToSave = plotData.plotBeats.map((beat, idx) => ({
          id: `beat_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
          beat: beat.beat || '',
          purpose: beat.purpose || '',
          targetChapter: beat.chapter,
          characters: beat.characters || [],
          emotionalTone: beat.emotionalTone || '',
          completed: false,
          order: idx + 1
        }));
        await contextEngine.savePlotBeats(beatsToSave);
        console.log(`[Wizard] Saved ${beatsToSave.length} plot beats`);
      }

      // 7. Save style instructions
      if (styleInstructions.length > 0) {
        for (const inst of styleInstructions) {
          if (inst.enabled !== false && inst.instruction.trim()) {
            await db.add('styleInstructions', {
              id: inst.id,
              instruction: inst.instruction.trim(),
              explanation: inst.explanation || '',
              category: inst.category || 'other',
              enabled: true,
              priority: inst.priority || 999,
              createdAt: Date.now()
            });
          }
        }
        console.log(`[Wizard] Saved ${styleInstructions.filter(i => i.enabled !== false).length} style instructions`);
      }

      // 8. Mark onboarding complete
      await contextEngine.saveOnboardingProgress({
        currentStep: 7,
        completedAt: Date.now(),
        data: {
          storyData,
          styleData,
          characters,
          worldRules,
          plotData,
          styleTestCompleted,
          styleInstructions
        }
      });

      onComplete?.();
    } catch (e) {
      console.error('Error completing onboarding:', e);
      setError('Failed to save your setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return storyData.premise.length > 50;
      case 2:
        return styleData.styleProfile !== null;
      case 3:
        return true; // Characters are optional
      case 4:
        return true; // World rules are optional
      case 5:
        return plotData.plotBeats.length > 0;
      case 6:
        return styleTestCompleted;
      case 7:
        return styleInstructions.length > 0;
      default:
        return true;
    }
  };

  // Render Mode Selection (Step 0)
  const renderModeSelection = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Welcome to Story Setup</h2>
        <p className="text-slate-400 text-lg">
          Let's configure your intelligent writing assistant
        </p>
      </div>

      <div className="grid gap-4">
        {/* Quick Import Option */}
        <button
          onClick={() => setQuickImportMode(true)}
          className="p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/50 rounded-xl text-left hover:border-amber-400 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
              <Upload className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-400 mb-1">Quick Import from ChatGPT</h3>
              <p className="text-slate-400 text-sm mb-2">
                Already have your story set up in ChatGPT? Copy one prompt, paste the response, and we'll auto-fill everything.
              </p>
              <span className="text-xs text-amber-400/70">Recommended for users with existing AI conversations</span>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400 mt-2" />
          </div>
        </button>

        {/* Step-by-Step Option */}
        <button
          onClick={() => setCurrentStep(1)}
          className="p-6 bg-slate-800/50 border-2 border-slate-700 rounded-xl text-left hover:border-slate-600 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center group-hover:bg-slate-600 transition-colors">
              <BookOpen className="w-6 h-6 text-slate-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Step-by-Step Setup</h3>
              <p className="text-slate-400 text-sm mb-2">
                Go through each section with guided prompts. Best for new stories or detailed customization.
              </p>
              <span className="text-xs text-slate-500">5 steps • Takes 10-15 minutes</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 mt-2" />
          </div>
        </button>
      </div>
    </div>
  );

  // Render Quick Import UI
  const renderQuickImport = () => {
    const quickImportPrompt = promptTemplates.quickImport(quickImportContext);

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Quick Import from ChatGPT</h2>
          <p className="text-slate-400">
            Already have your story set up in ChatGPT? Copy the prompt, get the response, paste it here!
          </p>
        </div>

        {/* Step-by-step instructions */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            How This Works
          </h3>
          <ol className="text-sm text-slate-300 space-y-2">
            <li className="flex gap-2">
              <span className="text-amber-400 font-bold">1.</span>
              <span>Copy the prompt below (click the button)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400 font-bold">2.</span>
              <span>Paste it into your <strong>existing ChatGPT conversation</strong> that knows your story</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400 font-bold">3.</span>
              <span>Copy ChatGPT's JSON response</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400 font-bold">4.</span>
              <span>Paste it in the box below - we'll auto-fill everything!</span>
            </li>
          </ol>
        </div>

        {/* Optional: Add context */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Optional: Add extra context for ChatGPT
          </label>
          <textarea
            value={quickImportContext}
            onChange={(e) => setQuickImportContext(e.target.value)}
            placeholder="e.g., 'Focus on the main 3 characters' or 'Include all plot beats from Book 1' or 'Remember we discussed the dark comedy tone'"
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg focus:border-amber-500"
          />
        </div>

        {/* Prompt to copy - FULL VERSION */}
        <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between bg-slate-800 px-4 py-3 border-b border-slate-700">
            <div>
              <span className="font-medium text-white">📋 The Prompt to Copy</span>
              <span className="text-xs text-slate-500 ml-2">({quickImportPrompt.length} characters)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFullPrompt(!showFullPrompt)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                {showFullPrompt ? 'Collapse' : 'Expand'}
              </button>
              <button
                onClick={() => copyToClipboard(quickImportPrompt, 'quickimport')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  copiedPrompt === 'quickimport'
                    ? 'bg-green-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {copiedPrompt === 'quickimport' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedPrompt === 'quickimport' ? 'Copied!' : 'Copy Full Prompt'}
              </button>
            </div>
          </div>
          <pre className={`p-4 text-xs text-slate-300 overflow-x-auto overflow-y-auto whitespace-pre-wrap font-mono ${
            showFullPrompt ? 'max-h-96' : 'max-h-32'
          }`}>
            {showFullPrompt ? quickImportPrompt : quickImportPrompt.slice(0, 500) + '\n\n... (click Expand to see full JSON structure) ...'}
          </pre>
        </div>

        <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-500/30">
          <p className="text-sm text-amber-300">
            <strong>💡 Tip:</strong> The prompt asks ChatGPT for a specific JSON format. 
            Even if ChatGPT adds extra text, we'll extract the JSON automatically!
          </p>
        </div>

        {/* Response paste area */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Step 3: Paste ChatGPT's JSON Response Here
          </label>
          <textarea
            value={quickImportResponse}
            onChange={(e) => handleQuickImportParse(e.target.value)}
            placeholder='Paste the full JSON response from ChatGPT here...'
            className="wizard-textarea monospace"
            style={{ minHeight: '200px' }}
          />
          <p className="text-xs text-slate-500 mt-1">Drag corner to resize</p>
        </div>

        {/* Parsed Preview */}
        {quickImportParsed && (
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium text-green-400">Successfully Parsed!</span>
            </div>
            
            {/* Main info grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-slate-400 text-xs mb-1">📖 Title</div>
                <div className="text-white font-medium truncate">
                  {quickImportParsed.storyFoundation?.title || 'Not set'}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-slate-400 text-xs mb-1">🎭 Genre</div>
                <div className="text-white font-medium">
                  {quickImportParsed.storyFoundation?.genre || 'Not set'}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-slate-400 text-xs mb-1">👥 Characters</div>
                <div className="text-white font-medium">
                  {quickImportParsed.characters?.length || 0} found
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-slate-400 text-xs mb-1">📍 Plot Beats</div>
                <div className="text-white font-medium">
                  {quickImportParsed.plotBeats?.length || 0} found
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-slate-400 text-xs mb-1">✍️ Style Profile</div>
                <div className="text-white font-medium">
                  {quickImportParsed.styleProfile ? '✓ Found' : '✗ Not set'}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-slate-400 text-xs mb-1">🌍 World Rules</div>
                <div className="text-white font-medium">
                  {quickImportParsed.worldRules ? '✓ Found' : '✗ Not set'}
                </div>
              </div>
            </div>

            {/* Character names preview */}
            {quickImportParsed.characters?.length > 0 && (
              <div className="bg-slate-800/30 rounded p-3 mb-4">
                <div className="text-slate-400 text-xs mb-2">Characters to import:</div>
                <div className="flex flex-wrap gap-2">
                  {quickImportParsed.characters.slice(0, 8).map((char, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-700 rounded text-xs text-white">
                      {char.name || `Character ${idx + 1}`}
                    </span>
                  ))}
                  {quickImportParsed.characters.length > 8 && (
                    <span className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-400">
                      +{quickImportParsed.characters.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Mood defaults preview */}
            {quickImportParsed.moodDefaults && (
              <div className="bg-slate-800/30 rounded p-3 mb-4">
                <div className="text-slate-400 text-xs mb-2">🎚️ Mood Defaults will be saved</div>
                <div className="text-xs text-slate-500">
                  Comedy/Horror: {quickImportParsed.moodDefaults.comedy_horror || 50}% | 
                  Pacing: {quickImportParsed.moodDefaults.pacing || 50}% | 
                  Tension: {quickImportParsed.moodDefaults.tension || 50}%
                </div>
              </div>
            )}

            <button
              onClick={applyQuickImport}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
            >
              <Check className="w-5 h-5" />
              Apply & Review All Steps
            </button>
            <p className="text-xs text-slate-500 text-center mt-2">
              You'll be able to review and edit everything on the next screens
            </p>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => {
            setQuickImportMode(false);
            setQuickImportResponse('');
            setQuickImportParsed(null);
          }}
          className="text-slate-400 hover:text-white text-sm"
        >
          ← Back to setup options
        </button>
      </div>
    );
  };

  // Render functions for each step
  const renderStoryFoundation = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Story Title</label>
        <input
          type="text"
          value={storyData.title}
          onChange={(e) => setStoryData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="The Compliance Run"
          className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Genres <span className="text-slate-500">(select all that apply)</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {genres.map(genre => {
            const isSelected = storyData.genres?.includes(genre.id);
            return (
              <button
                key={genre.id}
                onClick={() => {
                  setStoryData(prev => {
                    const currentGenres = prev.genres || [];
                    if (isSelected) {
                      // Don't allow removing the last genre
                      if (currentGenres.length <= 1) return prev;
                      return { ...prev, genres: currentGenres.filter(g => g !== genre.id) };
                    } else {
                      return { ...prev, genres: [...currentGenres, genre.id] };
                    }
                  });
                }}
                className={`p-4 rounded-lg border text-left transition-all relative ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-white'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-amber-400" />
                  </div>
                )}
                <div className="font-medium">{genre.label}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {genre.features.slice(0, 2).join(', ')}
                </div>
              </button>
            );
          })}
        </div>
        {storyData.genres?.length > 1 && (
          <p className="text-xs text-amber-400 mt-2">
            ✨ Multi-genre enabled: {storyData.genres.map(g => genres.find(x => x.id === g)?.label).join(' + ')}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Story Premise <span className="text-amber-400">*</span>
        </label>
        <textarea
          value={storyData.premise}
          onChange={(e) => setStoryData(prev => ({ ...prev, premise: e.target.value }))}
          placeholder="Describe your story in 2-3 paragraphs. What's it about? What makes it unique? What are the main conflicts?"
          className="wizard-textarea"
          style={{ minHeight: '150px' }}
        />
        <p className="text-xs text-slate-500 mt-1">
          {storyData.premise.length}/50 characters minimum • Drag corner to resize
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Comparable Works
          <span className="text-slate-500 ml-2 text-xs">("It's like X meets Y")</span>
        </label>
        <input
          type="text"
          value={storyData.comparisons}
          onChange={(e) => setStoryData(prev => ({ ...prev, comparisons: e.target.value }))}
          placeholder="e.g., Terry Pratchett meets Dark Souls meets UK welfare system"
          className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience</label>
        <select
          value={storyData.targetAudience}
          onChange={(e) => setStoryData(prev => ({ ...prev, targetAudience: e.target.value }))}
          className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg focus:border-amber-500"
        >
          <option value="ya">Young Adult</option>
          <option value="adult">Adult</option>
          <option value="all-ages">All Ages</option>
          <option value="mature">Mature/Dark</option>
        </select>
      </div>
    </div>
  );

  const renderStyleAnalysis = () => {
    const stylePrompt = styleData.hasFirstChapter
      ? promptTemplates.styleAnalysis(styleData.chapterText || '[YOUR CHAPTER TEXT]')
      : promptTemplates.styleAnalysisFromIdea(
          styleData.ideaDescription || '[YOUR IDEA]',
          storyData.comparisons || '[YOUR COMPARISONS]'
        );

    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-300">
                We'll analyze your writing style using ChatGPT. You'll copy a prompt, paste it into ChatGPT, 
                then paste the response back here. This ensures accurate style capture.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setStyleData(prev => ({ ...prev, hasFirstChapter: true }))}
            className={`flex-1 p-4 rounded-lg border transition-all ${
              styleData.hasFirstChapter
                ? 'bg-amber-500/20 border-amber-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <FileText className="w-6 h-6 mx-auto mb-2" />
            <div className="font-medium">I have a first chapter</div>
            <div className="text-xs text-slate-400 mt-1">Paste your chapter for analysis</div>
          </button>
          <button
            onClick={() => setStyleData(prev => ({ ...prev, hasFirstChapter: false }))}
            className={`flex-1 p-4 rounded-lg border transition-all ${
              !styleData.hasFirstChapter
                ? 'bg-amber-500/20 border-amber-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <Wand2 className="w-6 h-6 mx-auto mb-2" />
            <div className="font-medium">I have an idea only</div>
            <div className="text-xs text-slate-400 mt-1">We'll help define your style</div>
          </button>
        </div>

        {styleData.hasFirstChapter ? (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Paste Your First Chapter
            </label>
            <textarea
              value={styleData.chapterText}
              onChange={(e) => setStyleData(prev => ({ ...prev, chapterText: e.target.value }))}
              placeholder="Paste your chapter text here..."
              className="wizard-textarea monospace"
              style={{ minHeight: '200px' }}
            />
            <p className="text-xs text-slate-500 mt-1">Drag corner to resize</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Describe Your Story Idea & Desired Style
            </label>
            <textarea
              value={styleData.ideaDescription}
              onChange={(e) => setStyleData(prev => ({ ...prev, ideaDescription: e.target.value }))}
              placeholder="Describe what you want to write and how you want it to feel..."
              className="wizard-textarea"
              style={{ minHeight: '150px' }}
            />
            <p className="text-xs text-slate-500 mt-1">Drag corner to resize</p>
          </div>
        )}

        {/* Prompt to copy */}
        <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between bg-slate-800 px-4 py-2 border-b border-slate-700">
            <span className="text-sm font-medium text-white">Step 1: Copy this prompt</span>
            <button
              onClick={() => copyToClipboard(stylePrompt, 'style')}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                copiedPrompt === 'style'
                  ? 'bg-green-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {copiedPrompt === 'style' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedPrompt === 'style' ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>
          <pre className="p-4 text-xs text-slate-400 overflow-x-auto max-h-48 overflow-y-auto">
            {stylePrompt.slice(0, 500)}...
          </pre>
        </div>

        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
          <p className="text-sm text-blue-300">
            <strong>Step 2:</strong> Paste the prompt into ChatGPT (or Claude), then copy the JSON response.
          </p>
        </div>

        {/* Response paste area */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Step 3: Paste ChatGPT's Response Here
          </label>
          <textarea
            value={styleData.rawResponse}
            onChange={(e) => handleStyleResponsePaste(e.target.value)}
            placeholder='Paste the JSON response from ChatGPT here...'
            className="wizard-textarea monospace compact"
          />
          <p className="text-xs text-slate-500 mt-1">Drag corner to resize</p>
        </div>

        {/* Parsed result */}
        {styleData.styleProfile && (
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium text-green-400">Style Profile Captured!</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Narrator Tone:</span>
                <span className="text-white ml-2">{styleData.styleProfile.voiceProfile?.narratorTone}</span>
              </div>
              <div>
                <span className="text-slate-400">Humor Style:</span>
                <span className="text-white ml-2">{styleData.styleProfile.voiceProfile?.humorStyle?.join(', ')}</span>
              </div>
              <div>
                <span className="text-slate-400">Comedy/Horror:</span>
                <span className="text-white ml-2">
                  {styleData.styleProfile.toneBalance?.comedyPercent}% / {styleData.styleProfile.toneBalance?.horrorPercent}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">Comparisons:</span>
                <span className="text-white ml-2">{styleData.styleProfile.comparisons?.slice(0, 3).join(', ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Optional: Style Reference Material */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-start gap-3 mb-3">
            <FileText className="w-5 h-5 text-purple-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-white mb-1">Optional: Add Writing Examples</h3>
              <p className="text-sm text-slate-400">
                Paste examples of your writing, style guides, or reference material. The AI will analyze these 
                to better match your writing voice. This is saved automatically and always available to the AI.
              </p>
            </div>
          </div>
          <textarea
            value={styleData.styleReference}
            onChange={(e) => setStyleData(prev => ({ ...prev, styleReference: e.target.value }))}
            placeholder="Paste your writing examples, style guide, or reference material here...

Examples:
• Full chapters or excerpts from your writing
• Style guides or notes about your writing voice
• Reference material that defines your tone

The AI will analyze this to understand your unique style patterns."
            className="wizard-textarea"
            style={{ minHeight: '200px' }}
          />
          {styleData.styleReference && (
            <div className="mt-2 text-xs text-slate-500">
              {styleData.styleReference.split(/\s+/).filter(w => w).length.toLocaleString()} words • 
              {' '}{styleData.styleReference.length.toLocaleString()} characters
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCharacterProfiles = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <p className="text-sm text-slate-300">
          Add your main characters and define how they speak. This helps the AI write authentic dialogue.
          You can skip this step and add characters later.
        </p>
      </div>

      {/* Character list */}
      {characters.map((char, idx) => (
        <div key={char.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-bold text-white">{char.name}</h4>
              <p className="text-sm text-slate-400">{char.role}</p>
            </div>
            <div className="flex gap-2">
              {char.voiceProfile ? (
                <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded">
                  Voice Captured
                </span>
              ) : (
                <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-1 rounded">
                  Needs Voice
                </span>
              )}
              <button
                onClick={() => removeCharacter(idx)}
                className="p-1 text-red-400 hover:bg-red-900/30 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-4">{char.description}</p>

          {!char.voiceProfile && (
            <div className="space-y-3">
              <button
                onClick={() => copyToClipboard(
                  promptTemplates.characterVoice(char.name, char.description, char.dialogueSamples),
                  `char_${idx}`
                )}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
                  copiedPrompt === `char_${idx}`
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {copiedPrompt === `char_${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedPrompt === `char_${idx}` ? 'Prompt Copied!' : 'Copy Voice Analysis Prompt'}
              </button>
              <textarea
                placeholder="Paste ChatGPT's voice analysis response here..."
                rows={3}
                onChange={(e) => handleCharacterVoiceResponsePaste(e.target.value, idx)}
                className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded text-sm font-mono"
              />
            </div>
          )}
        </div>
      ))}

      {/* Add new character */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
        <h4 className="font-medium text-white mb-4">Add Character</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            value={newCharacter.name}
            onChange={(e) => setNewCharacter(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Character name"
            className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded"
          />
          <input
            type="text"
            value={newCharacter.role}
            onChange={(e) => setNewCharacter(prev => ({ ...prev, role: e.target.value }))}
            placeholder="Role (e.g., Protagonist, Sidekick)"
            className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded"
          />
        </div>
        <textarea
          value={newCharacter.description}
          onChange={(e) => setNewCharacter(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief character description and personality..."
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded mb-4"
        />
        <textarea
          value={newCharacter.dialogueSamples}
          onChange={(e) => setNewCharacter(prev => ({ ...prev, dialogueSamples: e.target.value }))}
          placeholder="Optional: Paste some example dialogue from this character..."
          rows={2}
          className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded mb-4"
        />
        <button
          onClick={addCharacter}
          disabled={!newCharacter.name.trim()}
          className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-medium py-2 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Character
        </button>
      </div>
    </div>
  );

  const renderWorldRules = () => {
    const worldPrompt = promptTemplates.worldRules(
      worldRules.description || '[YOUR WORLD DESCRIPTION]',
      storyData.genre
    );

    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-300">
            Define the rules of your story world. This helps maintain consistency and prevents plot holes.
            This step is optional but recommended.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Describe Your World's Rules & Boundaries
          </label>
          <textarea
            value={worldRules.description}
            onChange={(e) => setWorldRules(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your world's rules, magic system, technology, social structures, what's possible and impossible..."
            className="wizard-textarea"
            style={{ minHeight: '200px' }}
          />
          <p className="text-xs text-slate-500 mt-1">Drag corner to resize</p>
        </div>

        {worldRules.description && (
          <>
            <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between bg-slate-800 px-4 py-2 border-b border-slate-700">
                <span className="text-sm font-medium text-white">Optional: Get AI-structured rules</span>
                <button
                  onClick={() => copyToClipboard(worldPrompt, 'world')}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                    copiedPrompt === 'world'
                      ? 'bg-green-600 text-white'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  {copiedPrompt === 'world' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy Prompt
                </button>
              </div>
            </div>

            <textarea
              value={worldRules.rawResponse}
              onChange={(e) => handleWorldRulesResponsePaste(e.target.value)}
              placeholder="Paste ChatGPT's world rules response here (optional)..."
              className="wizard-textarea monospace compact"
            />
          </>
        )}

        {worldRules.rules && (
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium text-green-400">World Rules Structured!</span>
            </div>
            <p className="text-sm text-slate-300">
              {worldRules.rules.coreRules?.length || 0} core rules defined
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderPlotRoadmap = () => {
    const plotPrompt = promptTemplates.plotOutline(
      storyData.premise || '[YOUR PREMISE]',
      storyData.genre,
      plotData.targetChapters
    );

    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-300">
            Create a living roadmap of your story. These plot beats become a to-do list that tracks your progress.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setPlotData(prev => ({ ...prev, hasOutline: false }))}
            className={`flex-1 p-4 rounded-lg border transition-all ${
              !plotData.hasOutline
                ? 'bg-amber-500/20 border-amber-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <Wand2 className="w-6 h-6 mx-auto mb-2" />
            <div className="font-medium">Generate Outline</div>
            <div className="text-xs text-slate-400 mt-1">AI creates beats from premise</div>
          </button>
          <button
            onClick={() => setPlotData(prev => ({ ...prev, hasOutline: true }))}
            className={`flex-1 p-4 rounded-lg border transition-all ${
              plotData.hasOutline
                ? 'bg-amber-500/20 border-amber-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <FileText className="w-6 h-6 mx-auto mb-2" />
            <div className="font-medium">I have an outline</div>
            <div className="text-xs text-slate-400 mt-1">Paste or enter manually</div>
          </button>
        </div>

        {!plotData.hasOutline && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Chapter Count
              </label>
              <input
                type="number"
                value={plotData.targetChapters}
                onChange={(e) => setPlotData(prev => ({ ...prev, targetChapters: parseInt(e.target.value) || 12 }))}
                min={1}
                max={100}
                className="w-32 bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg"
              />
            </div>

            <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between bg-slate-800 px-4 py-2 border-b border-slate-700">
                <span className="text-sm font-medium text-white">Generate Plot Outline</span>
                <button
                  onClick={() => copyToClipboard(plotPrompt, 'plot')}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                    copiedPrompt === 'plot'
                      ? 'bg-green-600 text-white'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  {copiedPrompt === 'plot' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy Prompt
                </button>
              </div>
            </div>

            <textarea
              value={plotData.rawResponse}
              onChange={(e) => handlePlotResponsePaste(e.target.value)}
              placeholder="Paste ChatGPT's plot outline response here..."
              className="wizard-textarea monospace compact"
            />
          </>
        )}

        {/* Manual beat entry */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">Plot Beats ({plotData.plotBeats.length})</h4>
            <button
              onClick={addPlotBeat}
              className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Beat
            </button>
          </div>

          {plotData.plotBeats.map((beat, idx) => (
            <div key={beat.id || idx} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
              <div className="flex items-start gap-3">
                <span className="text-amber-400 font-mono text-sm w-8">#{idx + 1}</span>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={beat.beat}
                    onChange={(e) => updatePlotBeat(idx, 'beat', e.target.value)}
                    placeholder="What happens?"
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={beat.chapter || ''}
                      onChange={(e) => updatePlotBeat(idx, 'chapter', parseInt(e.target.value) || null)}
                      placeholder="Ch#"
                      className="w-20 bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-sm"
                    />
                    <input
                      type="text"
                      value={beat.purpose || ''}
                      onChange={(e) => updatePlotBeat(idx, 'purpose', e.target.value)}
                      placeholder="Purpose (optional)"
                      className="flex-1 bg-slate-900 border border-slate-700 text-white px-3 py-1 rounded text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removePlotBeat(idx)}
                  className="p-1 text-red-400 hover:bg-red-900/30 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStyleTest = () => {
    return (
      <div>
        <StyleTestPanel
          onComplete={() => {
            setStyleTestCompleted(true);
            // Auto-generate style instructions after test
            generateStyleInstructions();
          }}
        />
      </div>
    );
  };

  const generateStyleInstructions = async () => {
    setIsGeneratingInstructions(true);
    try {
      const storyProfile = await contextEngine.getStoryProfile();
      const styleProfile = storyProfile?.styleProfile;
      const testResults = await db.getAll('styleTestResults');

      const prompt = `Analyze the style test results and suggest AT LEAST 10 specific style instructions/rules for this writer. Generate 12-15 instructions to ensure variety.

STORY CONTEXT:
Title: ${storyProfile?.title || 'Untitled'}
Premise: ${storyProfile?.premise || 'Not set'}
Style: ${storyProfile?.comparisons || 'Not specified'}

STYLE PROFILE:
${JSON.stringify(styleProfile, null, 2)}

STYLE TEST RESULTS:
${testResults.map(r => 
  `Mood: ${r.moodPreset}, Rating: ${r.rating || 'N/A'}, Tags: ${r.feedbackTags?.join(', ') || 'none'}`
).join('\n')}

Based on the style profile and test feedback, suggest 12-15 specific, actionable style instructions.
Examples: "Use British slang", "Avoid flowery prose", "Prefer short sentences", "Use sarcasm liberally", "Break the fourth wall occasionally", "Use dry wit in dialogue"

IMPORTANT: Return ONLY a valid JSON array with NO markdown code blocks, NO explanations, just the array:
[
  {
    "instruction": "Specific rule",
    "explanation": "Why this matters",
    "category": "dialogue|prose|tone|pacing|humor|other"
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical');
      
      // Clean response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.includes('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      } else if (cleanedResponse.includes('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/g, '').trim();
      }
      
      // Try to extract JSON array if wrapped in other text
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleanedResponse);
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        const instructions = parsed.map((inst, idx) => ({
          id: `inst_${Date.now()}_${idx}`,
          instruction: inst.instruction || inst.rule || '',
          explanation: inst.explanation || inst.reason || '',
          category: inst.category || 'other',
          enabled: true,
          priority: idx + 1
        })).filter(inst => inst.instruction.trim());
        
        if (instructions.length > 0) {
          setStyleInstructions(instructions);
        } else {
          throw new Error('No valid instructions found');
        }
      } else {
        throw new Error('Response is not a valid array');
      }
    } catch (error) {
      console.error('Error generating style instructions:', error);
      // Set default instructions if generation fails
      setStyleInstructions([
        { id: 'inst_1', instruction: 'Match the writing style from examples exactly', explanation: 'Use the provided examples as reference', category: 'prose', enabled: true, priority: 1 }
      ]);
    } finally {
      setIsGeneratingInstructions(false);
    }
  };

  const renderStyleInstructions = () => {
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-start gap-3">
            <PenTool className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-white mb-1">Style Instructions</h3>
              <p className="text-sm text-slate-400">
                Based on your style test results, the AI has suggested specific style rules. 
                Review, edit, and approve these instructions. They will always be applied to AI generation.
              </p>
            </div>
          </div>
        </div>

        {isGeneratingInstructions ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
            <p className="text-slate-400">Analyzing style test results and generating instructions...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {styleInstructions.map((inst, idx) => (
              <div key={inst.id} className="bg-slate-900 rounded-lg border border-slate-700 p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={inst.enabled !== false}
                    onChange={(e) => {
                      const updated = [...styleInstructions];
                      updated[idx].enabled = e.target.checked;
                      setStyleInstructions(updated);
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={inst.instruction}
                        onChange={(e) => {
                          const updated = [...styleInstructions];
                          updated[idx].instruction = e.target.value;
                          setStyleInstructions(updated);
                        }}
                        className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-1 text-white text-sm"
                        placeholder="Style instruction..."
                      />
                      <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded">
                        {inst.category}
                      </span>
                    </div>
                    {inst.explanation && (
                      <p className="text-xs text-slate-500 mt-1">{inst.explanation}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setStyleInstructions(prev => prev.filter((_, i) => i !== idx));
                    }}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={generateStyleInstructions}
            disabled={isGeneratingInstructions}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-lg text-sm"
          >
            Regenerate Suggestions
          </button>
          <button
            onClick={() => {
              setStyleInstructions(prev => [...prev, {
                id: `inst_${Date.now()}`,
                instruction: '',
                explanation: '',
                category: 'other',
                enabled: true,
                priority: prev.length + 1
              }]);
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Custom
          </button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    // Quick import mode
    if (quickImportMode) return renderQuickImport();
    
    switch (currentStep) {
      case 0: return renderModeSelection();
      case 1: return renderStoryFoundation();
      case 2: return renderStyleAnalysis();
      case 3: return renderCharacterProfiles();
      case 4: return renderWorldRules();
      case 5: return renderPlotRoadmap();
      case 6: return renderStyleTest();
      case 7: return renderStyleInstructions();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isEditMode ? 'Edit Story Setup' : "Writer's Universe Setup"}
            </h1>
            <p className="text-sm text-slate-400">
              {isEditMode 
                ? 'Review and update your story configuration' 
                : "Let's configure your story's intelligent assistant"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isEditMode && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                Edit Mode
              </span>
            )}
            <span className="text-sm text-slate-400">
              Progress auto-saved
            </span>
            {!isEditMode && (
              <button
                onClick={() => {
                  if (window.confirm('Skip setup for now? You can return later to complete it.\n\nNote: You can import a backup from Settings to restore your project.')) {
                    onComplete?.();
                  }
                }}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps - only show in steps 1-5 */}
      {currentStep >= 1 && !quickImportMode && (
        <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isComplete = currentStep > step.id;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-400'
                          : isComplete
                          ? 'text-green-400 hover:bg-slate-800'
                          : 'text-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-amber-500 text-slate-900'
                          : isComplete
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium">{step.title}</div>
                        <div className="text-xs text-slate-500">{step.description}</div>
                      </div>
                    </button>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        currentStep > step.id ? 'bg-green-500/50' : 'bg-slate-800'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {renderCurrentStep()}
        </div>
      </div>

      {/* Footer Navigation - only show in steps 1-5 */}
      {currentStep >= 1 && !quickImportMode && (
        <div className="bg-slate-900 border-t border-slate-800 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(prev => prev === 1 ? (isEditMode ? 1 : 0) : prev - 1)}
                disabled={currentStep === 1 && isEditMode}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                {currentStep === 1 && !isEditMode ? 'Back to Options' : 'Previous'}
              </button>
              {isEditMode && (
                <button
                  onClick={onComplete}
                  className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              )}
            </div>

            <div className="text-sm text-slate-400">
              Step {currentStep} of {steps.length}
            </div>

            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={completeOnboarding}
                disabled={isLoading || !canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {isEditMode ? 'Save Changes' : 'Complete Setup'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingWizard;

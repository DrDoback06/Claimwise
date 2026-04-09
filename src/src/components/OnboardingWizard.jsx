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
  PenTool,
  Key,
  Heart,
  Eye,
  EyeOff,
  Zap,
  BookMarked
} from 'lucide-react';
import promptTemplates, { formatForClipboard, parseExternalAIResponse } from '../services/promptTemplates';
import contextEngine from '../services/contextEngine';
import db from '../services/database';
import styleReferenceService from '../services/styleReferenceService';
import StyleTestPanel from './StyleTestPanel';
import aiService from '../services/aiService';
import imageGenerationService from '../../services/imageGenerationService';

/**
 * Onboarding Wizard Component
 * 5-step guided setup for the Writer's Universe Intelligence System
 * Also used for editing existing story setup
 */
const OnboardingWizard = ({ onComplete, existingData = null }) => {
  const [currentStep, setCurrentStep] = useState(0); // 0 = mode selection, 1-9 = steps
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false); // True when editing existing setup

  // Welcome slides state
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeSlide, setWelcomeSlide] = useState(0);

  // API Keys state (step 6)
  const [apiKeys, setApiKeys] = useState({
    gemini: '', openai: '', anthropic: '', groq: '', huggingface: ''
  });
  const [showKeys, setShowKeys] = useState({});
  const [preferredProvider, setPreferredProvider] = useState('auto');

  // Writing Preferences state (step 8)
  const [writingPreferences, setWritingPreferences] = useState({
    pov: '',
    tense: '',
    chapterLength: '',
    petPeeves: [],
    customPetPeeves: '',
    favorites: [],
    customFavorites: '',
    dialogueStyle: '',
    descriptionDensity: '',
    profanityLevel: '',
    romanticContent: '',
    violenceLevel: ''
  });

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
    { id: 6, title: 'AI Setup', icon: Key, description: 'Connect your AI provider keys' },
    { id: 7, title: 'Style Test', icon: Sparkles, description: 'Rate AI examples to refine your style' },
    { id: 8, title: 'Preferences', icon: Heart, description: 'Your writing tastes & pet peeves' },
    { id: 9, title: 'Style Rules', icon: PenTool, description: 'Finalize specific style rules' }
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
        if (progress.data.writingPreferences) setWritingPreferences(progress.data.writingPreferences);

        // Check if onboarding was already completed
        if (progress.completedAt) {
          setIsEditMode(true);
          setShowWelcome(false);
          setCurrentStep(1);
        } else if (progress.currentStep != null) {
          setCurrentStep(progress.currentStep);
          // Don't show welcome if they've already started
          if (progress.currentStep > 0) setShowWelcome(false);
        }
      }

      // Load existing API keys from runtime
      const runtimeKeys = aiService.getRuntimeKeys ? aiService.getRuntimeKeys() : {};
      setApiKeys({
        gemini: runtimeKeys.gemini || '',
        openai: runtimeKeys.openai || '',
        anthropic: runtimeKeys.anthropic || '',
        groq: runtimeKeys.groq || '',
        huggingface: runtimeKeys.huggingface || ''
      });
      const preferred = localStorage.getItem('ai_preferred_provider') || 'auto';
      setPreferredProvider(preferred);
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
          plotData,
          writingPreferences
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
  }, [storyData, styleData, characters, worldRules, plotData, writingPreferences, currentStep]);

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

      // 8. Save writing preferences
      if (writingPreferences) {
        await db.update('meta', {
          id: 'writing_preferences',
          ...writingPreferences,
          updatedAt: Date.now()
        });
        console.log('[Wizard] Writing preferences saved');
      }

      // 9. Mark onboarding complete
      await contextEngine.saveOnboardingProgress({
        currentStep: 9,
        completedAt: Date.now(),
        data: {
          storyData,
          styleData,
          characters,
          worldRules,
          plotData,
          writingPreferences,
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
        return hasAnyApiKey(); // Need at least one key for style test
      case 7:
        return styleTestCompleted;
      case 8:
        return true; // Writing preferences are optional
      case 9:
        return styleInstructions.length > 0;
      default:
        return true;
    }
  };

  const hasAnyApiKey = () => {
    return Object.values(apiKeys).some(k => k && k.trim().length > 0);
  };

  const saveApiKey = (provider, key) => {
    if (provider === 'openai') {
      imageGenerationService.setApiKey(key);
    }
    aiService.setApiKey(provider, key);
    setApiKeys(prev => ({ ...prev, [provider]: key }));
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
${testResults.map(r => {
  const parts = [`Mood: ${r.moodPreset}, Rating: ${r.rating || 'N/A'}`];
  if (r.feedbackTags?.length > 0) parts.push(`Issues: ${r.feedbackTags.join(', ')}`);
  if (r.positiveTags?.length > 0) parts.push(`Loved: ${r.positiveTags.join(', ')}`);
  if (r.freetext) parts.push(`Notes: ${r.freetext}`);
  return parts.join(' | ');
}).join('\n')}

Based on the style profile and test feedback (both what worked and what didn't), suggest 12-15 specific, actionable style instructions.
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

  // ─── Welcome Slides ───────────────────────────────────────
  const WELCOME_SLIDES = [
    {
      title: 'Welcome to Claimwise Omniscience',
      icon: BookMarked,
      color: 'amber',
      content: (
        <div className="space-y-4 text-slate-300">
          <p className="text-lg">Your AI-powered writing companion that <strong className="text-white">actually understands your story</strong>.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {[
              { icon: '🧠', text: 'Deep story memory — tracks characters, plots, world rules, and writing style across every chapter' },
              { icon: '✍️', text: 'Intelligent writing — generates content that matches YOUR voice, not generic AI slop' },
              { icon: '📊', text: 'Entity tracking — characters, items, skills, relationships, all managed automatically' },
              { icon: '🎯', text: 'Smart suggestions — forward-thinking ideas based on your story\'s narrative arc' }
            ].map((item, i) => (
              <div key={i} className="flex gap-3 bg-slate-800/50 rounded-lg p-3">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'How the Setup Wizard Works',
      icon: Sparkles,
      color: 'purple',
      content: (
        <div className="space-y-4 text-slate-300">
          <p>The setup wizard teaches the AI about <strong className="text-white">your specific story</strong>. The more you provide, the better the AI performs.</p>
          <div className="space-y-2 mt-4">
            {[
              { step: '1-2', label: 'Story & Style', desc: 'Your story premise, genre, and writing voice' },
              { step: '3-4', label: 'Characters & World', desc: 'Who\'s in the story and the rules of your world' },
              { step: '5', label: 'Plot Roadmap', desc: 'Where the story is headed (plot beats)' },
              { step: '6', label: 'AI Setup', desc: 'Connect your AI provider keys' },
              { step: '7-8', label: 'Style Test & Preferences', desc: 'Rate AI examples and tell us your taste' },
              { step: '9', label: 'Style Rules', desc: 'Final writing rules the AI always follows' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3">
                <span className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">{item.step}</span>
                <div>
                  <span className="text-white font-medium text-sm">{item.label}</span>
                  <span className="text-slate-400 text-sm"> — {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-2">Most steps are optional — you can skip and come back later.</p>
        </div>
      )
    },
    {
      title: 'One More Thing — AI Provider Keys',
      icon: Key,
      color: 'green',
      content: (
        <div className="space-y-4 text-slate-300">
          <p>To generate AI-powered content, you'll need at least one API key. Don't worry — <strong className="text-white">there are free options!</strong></p>
          <div className="space-y-2 mt-4">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-green-400 font-medium mb-2">Free Options</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span><strong className="text-white">Groq</strong> — 14,400 free requests/day (fast, great quality)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span><strong className="text-white">HuggingFace</strong> — Free tier available (no key needed for basic use)</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h4 className="text-slate-300 font-medium mb-2">Paid Options (higher quality)</h4>
              <div className="space-y-1 text-sm text-slate-400">
                <p>Gemini, OpenAI (GPT-4o), Anthropic (Claude) — Pay-as-you-go</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-amber-400 mt-3">
            You'll set up your keys in Step 6 of the wizard. Ready to begin?
          </p>
        </div>
      )
    }
  ];

  const renderWelcome = () => {
    const slide = WELCOME_SLIDES[welcomeSlide];
    const Icon = slide.icon;
    // Hardcode Tailwind classes per slide to avoid purge issues
    const slideStyles = [
      { iconBg: 'bg-amber-500/20', iconText: 'text-amber-400', dotActive: 'bg-amber-400', btnBg: 'bg-amber-600 hover:bg-amber-500' },
      { iconBg: 'bg-purple-500/20', iconText: 'text-purple-400', dotActive: 'bg-purple-400', btnBg: 'bg-purple-600 hover:bg-purple-500' },
      { iconBg: 'bg-green-500/20', iconText: 'text-green-400', dotActive: 'bg-green-400', btnBg: 'bg-green-600 hover:bg-green-500' }
    ];
    const s = slideStyles[welcomeSlide];

    return (
      <div className="fixed inset-0 bg-slate-950/95 z-[60] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
          {/* Slide header */}
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${s.iconText}`} />
              </div>
              <div className="flex gap-2">
                {WELCOME_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setWelcomeSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === welcomeSlide ? s.dotActive : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
          </div>

          {/* Slide content */}
          <div className="px-6 pb-4 max-h-[60vh] overflow-y-auto">
            {slide.content}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
            {welcomeSlide > 0 ? (
              <button
                onClick={() => setWelcomeSlide(prev => prev - 1)}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <button
                onClick={() => { setShowWelcome(false); }}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Skip intro
              </button>
            )}

            {welcomeSlide < WELCOME_SLIDES.length - 1 ? (
              <button
                onClick={() => setWelcomeSlide(prev => prev + 1)}
                className={`flex items-center gap-2 px-6 py-2 ${s.btnBg} text-white font-medium rounded-lg transition-colors`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowWelcome(false)}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
              >
                Let's Get Started
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Step 6: AI Setup ───────────────────────────────────────
  const renderAISetup = () => {
    const providers = [
      { id: 'groq', name: 'Groq', free: true, desc: '14,400 free requests/day — Fast & reliable', signupUrl: 'https://console.groq.com/keys' },
      { id: 'gemini', name: 'Google Gemini', free: false, desc: 'Excellent quality, competitive pricing', signupUrl: 'https://aistudio.google.com/apikey' },
      { id: 'openai', name: 'OpenAI', free: false, desc: 'GPT-4o — Also enables DALL-E image generation', signupUrl: 'https://platform.openai.com/api-keys' },
      { id: 'anthropic', name: 'Anthropic Claude', free: false, desc: 'Exceptional writing quality', signupUrl: 'https://console.anthropic.com/settings/keys' },
      { id: 'huggingface', name: 'HuggingFace', free: true, desc: 'Free tier — Good for basic tasks', signupUrl: 'https://huggingface.co/settings/tokens' }
    ];

    const keyCount = Object.values(apiKeys).filter(k => k && k.trim()).length;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your AI</h2>
          <p className="text-slate-400">
            Add at least one API key so we can generate style examples in the next step.
            Keys are stored in memory only — never saved to disk.
          </p>
        </div>

        {keyCount === 0 && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-300">
              You need at least one AI provider key to continue. <strong>Groq is free</strong> and gives you 14,400 requests per day — perfect to get started.
            </p>
          </div>
        )}

        {keyCount > 0 && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
            <p className="text-sm text-green-300">
              {keyCount} provider{keyCount > 1 ? 's' : ''} configured. The AI will automatically pick the best model for each task.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {providers.map(provider => {
            const key = apiKeys[provider.id] || '';
            const hasKey = key.trim().length > 0;
            const isVisible = showKeys[provider.id];

            return (
              <div key={provider.id} className={`bg-slate-900 rounded-lg border p-4 transition-colors ${
                hasKey ? 'border-green-500/30' : 'border-slate-700'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{provider.name}</h4>
                      {provider.free && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">FREE</span>
                      )}
                      {hasKey && <CheckCircle className="w-4 h-4 text-green-400" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{provider.desc}</p>
                  </div>
                  <a
                    href={provider.signupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-300 shrink-0"
                  >
                    Get key →
                  </a>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={key}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                      placeholder={`Enter ${provider.name} API key...`}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:border-amber-500 pr-10"
                    />
                    <button
                      onClick={() => setShowKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => saveApiKey(provider.id, key)}
                    disabled={!key.trim()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-medium text-white mb-2">Preferred Provider</h4>
          <select
            value={preferredProvider}
            onChange={(e) => {
              setPreferredProvider(e.target.value);
              localStorage.setItem('ai_preferred_provider', e.target.value);
              aiService.preferredProvider = e.target.value;
            }}
            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="auto">Auto (smart routing — recommended)</option>
            <option value="groq">Groq (free, fast)</option>
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="huggingface">HuggingFace</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Auto mode picks the cheapest capable model for each task automatically.
          </p>
        </div>
      </div>
    );
  };

  // ─── Step 8: Writing Preferences ───────────────────────────────────────
  const PET_PEEVES = [
    'Purple prose',
    'Info dumps',
    'Telling instead of showing',
    '"Said" synonyms (exclaimed, proclaimed)',
    'Adverb overuse (quickly, slowly, angrily)',
    'Starting sentences with "Suddenly"',
    'Cliché metaphors',
    'Dream sequences as plot device',
    'Mary Sue / perfect characters',
    'Explaining the joke',
    'On-the-nose dialogue',
    'Head-hopping (random POV switches)',
    'Filler words (very, really, just)',
    'Passive voice overuse',
    'Repetitive sentence structure',
    'Melodramatic inner monologue'
  ];

  const FAVORITE_TECHNIQUES = [
    'Subtext in dialogue',
    'Unreliable narrator',
    'Dry humor / deadpan',
    'Show don\'t tell',
    'Cliffhangers',
    'Parallel storylines',
    'Foreshadowing',
    'Breaking the fourth wall',
    'Stream of consciousness',
    'In medias res (start mid-action)',
    'Motifs & callbacks',
    'Sardonic inner monologue',
    'Atmospheric world-building',
    'Snappy dialogue exchanges',
    'Slow burn tension',
    'Character-driven conflict'
  ];

  const renderWritingPreferences = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Writing Preferences</h2>
        <p className="text-slate-400">
          Tell the AI what you love and hate in writing. This directly shapes every piece of content it generates.
        </p>
      </div>

      {/* POV & Tense */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Preferred POV</label>
          <select
            value={writingPreferences.pov}
            onChange={(e) => setWritingPreferences(prev => ({ ...prev, pov: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No preference</option>
            <option value="first">First person (I/me)</option>
            <option value="third-limited">Third person limited (he/she — one character)</option>
            <option value="third-omni">Third person omniscient (narrator sees all)</option>
            <option value="second">Second person (you)</option>
            <option value="mixed">Mixed / rotating POV</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Tense</label>
          <select
            value={writingPreferences.tense}
            onChange={(e) => setWritingPreferences(prev => ({ ...prev, tense: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No preference</option>
            <option value="past">Past tense (walked, said)</option>
            <option value="present">Present tense (walks, says)</option>
          </select>
        </div>
      </div>

      {/* Chapter length & dialogue style */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Ideal Chapter Length</label>
          <select
            value={writingPreferences.chapterLength}
            onChange={(e) => setWritingPreferences(prev => ({ ...prev, chapterLength: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No preference</option>
            <option value="short">Short (1,000–2,000 words)</option>
            <option value="medium">Medium (2,000–4,000 words)</option>
            <option value="long">Long (4,000–6,000 words)</option>
            <option value="epic">Epic (6,000+ words)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Dialogue Style</label>
          <select
            value={writingPreferences.dialogueStyle}
            onChange={(e) => setWritingPreferences(prev => ({ ...prev, dialogueStyle: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No preference</option>
            <option value="snappy">Snappy & punchy (short exchanges)</option>
            <option value="naturalistic">Naturalistic (realistic speech patterns)</option>
            <option value="witty">Witty banter (clever, fast-paced)</option>
            <option value="sparse">Sparse (minimal, says a lot with little)</option>
            <option value="dramatic">Dramatic (theatrical, emotional)</option>
          </select>
        </div>
      </div>

      {/* Description density & content */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description Density</label>
          <select
            value={writingPreferences.descriptionDensity}
            onChange={(e) => setWritingPreferences(prev => ({ ...prev, descriptionDensity: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No preference</option>
            <option value="minimal">Minimal — let readers imagine</option>
            <option value="balanced">Balanced — enough to ground</option>
            <option value="rich">Rich — immersive detail</option>
            <option value="lush">Lush — dense, literary style</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Profanity</label>
          <select
            value={writingPreferences.profanityLevel}
            onChange={(e) => setWritingPreferences(prev => ({ ...prev, profanityLevel: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No preference</option>
            <option value="none">None — keep it clean</option>
            <option value="mild">Mild (damn, hell)</option>
            <option value="moderate">Moderate (realistic swearing)</option>
            <option value="heavy">Heavy (unrestricted)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Violence Level</label>
          <select
            value={writingPreferences.violenceLevel}
            onChange={(e) => setWritingPreferences(prev => ({ ...prev, violenceLevel: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No preference</option>
            <option value="minimal">Minimal / implied</option>
            <option value="moderate">Moderate — action scenes</option>
            <option value="graphic">Graphic — detailed combat</option>
            <option value="extreme">Extreme — no limits</option>
          </select>
        </div>
      </div>

      {/* Pet Peeves */}
      <div>
        <h3 className="text-sm font-medium text-red-400 mb-2">Writing Pet Peeves — AI will AVOID these</h3>
        <div className="flex flex-wrap gap-2">
          {PET_PEEVES.map(peeve => {
            const selected = writingPreferences.petPeeves?.includes(peeve);
            return (
              <button
                key={peeve}
                onClick={() => {
                  setWritingPreferences(prev => ({
                    ...prev,
                    petPeeves: selected
                      ? prev.petPeeves.filter(p => p !== peeve)
                      : [...(prev.petPeeves || []), peeve]
                  }));
                }}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selected
                    ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                }`}
              >
                {selected && <X className="w-3 h-3 inline mr-1" />}
                {peeve}
              </button>
            );
          })}
        </div>
        <textarea
          value={writingPreferences.customPetPeeves || ''}
          onChange={(e) => setWritingPreferences(prev => ({ ...prev, customPetPeeves: e.target.value }))}
          placeholder="Any other pet peeves? (e.g. 'characters who never eat or sleep', 'overuse of em dashes')"
          rows={2}
          className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg mt-2 focus:border-red-500"
        />
      </div>

      {/* Favorite Techniques */}
      <div>
        <h3 className="text-sm font-medium text-green-400 mb-2">Favorite Techniques — AI will PRIORITIZE these</h3>
        <div className="flex flex-wrap gap-2">
          {FAVORITE_TECHNIQUES.map(fav => {
            const selected = writingPreferences.favorites?.includes(fav);
            return (
              <button
                key={fav}
                onClick={() => {
                  setWritingPreferences(prev => ({
                    ...prev,
                    favorites: selected
                      ? prev.favorites.filter(f => f !== fav)
                      : [...(prev.favorites || []), fav]
                  }));
                }}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selected
                    ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                }`}
              >
                {selected && <CheckCircle className="w-3 h-3 inline mr-1" />}
                {fav}
              </button>
            );
          })}
        </div>
        <textarea
          value={writingPreferences.customFavorites || ''}
          onChange={(e) => setWritingPreferences(prev => ({ ...prev, customFavorites: e.target.value }))}
          placeholder="Any other techniques you love? (e.g. 'footnote humor like Pratchett', 'nested mysteries')"
          rows={2}
          className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg mt-2 focus:border-green-500"
        />
      </div>
    </div>
  );

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
      case 6: return renderAISetup();
      case 7: return renderStyleTest();
      case 8: return renderWritingPreferences();
      case 9: return renderStyleInstructions();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 overflow-hidden flex flex-col">
      {/* Welcome Slides Overlay */}
      {showWelcome && !isEditMode && renderWelcome()}

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

            {currentStep < 9 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(9, prev + 1))}
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

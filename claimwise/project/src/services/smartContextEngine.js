/**
 * SmartContextEngine Service
 * Enhanced context assembly for AI-powered features
 * Provides intelligent context for writing assistance, voice checking, and consistency
 */

import contextEngine from './contextEngine';
import db from './database';
import aiService from './aiService';
import styleReferenceService from './styleReferenceService';
import expertWriterService from './expertWriterService';
import characterTimelineService from './characterTimelineService';

class SmartContextEngine {
  constructor() {
    this.cache = {
      storyProfile: null,
      characterVoices: {},
      worldRules: null,
      recentContext: null,
      lastCacheTime: null
    };
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache = {
      storyProfile: null,
      characterVoices: {},
      worldRules: null,
      recentContext: null,
      lastCacheTime: null
    };
  }

  /**
   * Check if cache is valid
   */
  isCacheValid() {
    return this.cache.lastCacheTime && 
           (Date.now() - this.cache.lastCacheTime) < this.cacheTimeout;
  }

  /**
   * Get full story profile with all wizard data
   */
  async getFullStoryProfile() {
    if (this.isCacheValid() && this.cache.storyProfile) {
      return this.cache.storyProfile;
    }

    const profile = await contextEngine.getStoryProfile();
    this.cache.storyProfile = profile;
    this.cache.lastCacheTime = Date.now();
    return profile;
  }

  /**
   * Get voice profile for a character (by name or ID)
   */
  async getCharacterVoice(characterNameOrId) {
    // Check cache first
    if (this.cache.characterVoices[characterNameOrId]) {
      return this.cache.characterVoices[characterNameOrId];
    }

    // Try to find by ID first
    let voice = await contextEngine.getCharacterVoice(characterNameOrId);
    
    if (!voice) {
      // Try to find actor by name, then get voice
      const actors = await db.getAll('actors');
      const actor = actors.find(a => 
        a.name.toLowerCase() === characterNameOrId.toLowerCase() ||
        a.nicknames?.some(n => n.toLowerCase() === characterNameOrId.toLowerCase())
      );
      
      if (actor) {
        voice = await contextEngine.getCharacterVoice(actor.id);
      }
    }

    if (voice) {
      this.cache.characterVoices[characterNameOrId] = voice;
    }

    return voice;
  }

  /**
   * Get all character voices for a list of characters
   */
  async getAllCharacterVoices(characterNames = []) {
    const voices = {};
    
    for (const name of characterNames) {
      const voice = await this.getCharacterVoice(name);
      if (voice) {
        voices[name] = voice;
      }
    }

    return voices;
  }

  /**
   * Get world rules and constraints
   */
  async getWorldRules() {
    if (this.isCacheValid() && this.cache.worldRules) {
      return this.cache.worldRules;
    }

    const rules = await contextEngine.getWorldRules();
    this.cache.worldRules = rules;
    return rules;
  }

  /**
   * Detect characters mentioned in text
   */
  async detectCharactersInText(text) {
    const actors = await db.getAll('actors');
    const mentioned = [];

    for (const actor of actors) {
      // Check main name
      if (text.toLowerCase().includes(actor.name.toLowerCase())) {
        mentioned.push(actor);
        continue;
      }

      // Check nicknames
      if (actor.nicknames?.some(nick => 
        text.toLowerCase().includes(nick.toLowerCase())
      )) {
        mentioned.push(actor);
      }
    }

    return mentioned;
  }

  /**
   * Check if dialogue matches a character's voice profile
   */
  async checkDialogueVoice(dialogue, characterName) {
    const voice = await this.getCharacterVoice(characterName);
    
    if (!voice) {
      return {
        hasProfile: false,
        matches: null,
        suggestions: null
      };
    }

    // Build voice check prompt
    const voiceDescription = this.formatVoiceProfile(voice);
    
    try {
      const response = await aiService.callAI(`
        You are a dialogue voice checker. Analyze if this dialogue matches the character's voice profile.

        CHARACTER: ${characterName}
        VOICE PROFILE:
        ${voiceDescription}

        DIALOGUE TO CHECK:
        "${dialogue}"

        Respond in JSON format:
        {
          "matchScore": 0-100,
          "matches": true/false,
          "issues": ["issue1", "issue2"],
          "suggestions": ["suggestion1", "suggestion2"],
          "rewriteSuggestion": "optional rewrite that better matches the voice"
        }
      `, 'analytical');

      return {
        hasProfile: true,
        ...JSON.parse(response)
      };
    } catch (error) {
      console.error('Voice check error:', error);
      return {
        hasProfile: true,
        matches: null,
        error: error.message
      };
    }
  }

  /**
   * Format voice profile for AI consumption
   */
  formatVoiceProfile(voice) {
    if (!voice) return 'No voice profile available';

    const parts = [];
    
    if (voice.characterName) parts.push(`Character: ${voice.characterName}`);
    if (voice.role) parts.push(`Role: ${voice.role}`);
    if (voice.description) parts.push(`Description: ${voice.description}`);
    
    // Speech patterns
    if (voice.speechPatterns) {
      if (voice.speechPatterns.vocabulary) 
        parts.push(`Vocabulary: ${voice.speechPatterns.vocabulary}`);
      if (voice.speechPatterns.sentenceStructure) 
        parts.push(`Sentence style: ${voice.speechPatterns.sentenceStructure}`);
      if (voice.speechPatterns.quirks) 
        parts.push(`Speech quirks: ${voice.speechPatterns.quirks.join(', ')}`);
    }

    // Tone
    if (voice.tone) {
      if (voice.tone.default) parts.push(`Default tone: ${voice.tone.default}`);
      if (voice.tone.underStress) parts.push(`Under stress: ${voice.tone.underStress}`);
    }

    // Example dialogue
    if (voice.exampleDialogue && voice.exampleDialogue.length > 0) {
      parts.push(`Example dialogue: ${voice.exampleDialogue.slice(0, 3).join(' | ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Get smart context for the current writing position
   * Returns relevant characters, items, rules based on what's in the current paragraph
   */
  async getSmartContextForText(text, chapterNumber = null) {
    const [
      storyProfile,
      worldRules,
      plotBeats,
      mentionedCharacters
    ] = await Promise.all([
      this.getFullStoryProfile(),
      this.getWorldRules(),
      contextEngine.getPlotBeatsForChapter(chapterNumber),
      this.detectCharactersInText(text)
    ]);

    // Get voice profiles for mentioned characters
    const characterVoices = {};
    for (const char of mentionedCharacters) {
      const voice = await this.getCharacterVoice(char.id);
      if (voice) characterVoices[char.name] = voice;
    }

    // Get items held by mentioned characters
    const relevantItems = [];
    const allItems = await db.getAll('itemBank');
    for (const char of mentionedCharacters) {
      if (char.inventory) {
        char.inventory.forEach(itemId => {
          const item = allItems.find(i => i.id === itemId);
          if (item) relevantItems.push({ ...item, heldBy: char.name });
        });
      }
    }

    // Get active skills for mentioned characters
    const relevantSkills = [];
    const allSkills = await db.getAll('skillBank');
    for (const char of mentionedCharacters) {
      if (char.activeSkills) {
        char.activeSkills.forEach(skill => {
          const skillDef = allSkills.find(s => s.id === skill.id);
          if (skillDef) relevantSkills.push({ ...skillDef, usedBy: char.name, level: skill.val });
        });
      }
    }

    return {
      storyProfile,
      worldRules,
      plotBeats: plotBeats.filter(b => !b.completed),
      mentionedCharacters,
      characterVoices,
      relevantItems,
      relevantSkills,
      contextGeneratedAt: Date.now()
    };
  }

  /**
   * Get negative examples (what NOT to do)
   */
  async getNegativeExamples(moodPreset = null) {
    try {
      let examples = await db.getAll('negativeExamples');
      
      // Filter by mood if specified
      if (moodPreset) {
        examples = examples.filter(ex => 
          !ex.moodPreset || ex.moodPreset === moodPreset
        );
      }
      
      // Get most recent and relevant examples
      examples = examples
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 10); // Limit to 10 most recent
      
      return examples;
    } catch (error) {
      console.warn('Error loading negative examples:', error);
      return [];
    }
  }

  /**
   * Get style instructions (specific style rules)
   */
  async getStyleInstructions() {
    try {
      const instructions = await db.getAll('styleInstructions');
      return instructions.filter(inst => inst.enabled !== false);
    } catch (error) {
      console.warn('Error loading style instructions:', error);
      return [];
    }
  }

  /**
   * Analyze current scene context from text
   */
  async analyzeSceneContext(text, chapterId, position = null) {
    try {
      if (!text || text.trim().length < 50) return null;

      // Get recent text (last 1000 chars for context)
      const recentText = text.slice(-1000);
      
      // Detect characters present
      const mentionedChars = await this.detectCharactersInText(recentText);
      const characterNames = mentionedChars.map(c => c.name);

      // Use AI to analyze scene
      const prompt = `Analyze this scene and provide context:

TEXT:
"""
${recentText}
"""

Provide a brief analysis in JSON format:
{
  "whatsHappening": "Brief description of what's happening (action/dialogue/description)",
  "presentCharacters": ["character1", "character2"],
  "emotionalTone": "tone of the scene",
  "pacing": "fast/medium/slow",
  "affectsFuture": "How this scene affects future plot/characters"
}`;

      const response = await aiService.callAI(prompt, 'analytical');
      const analysis = JSON.parse(response);

      // Save scene context
      if (chapterId) {
        const sceneContext = {
          id: `scene_${chapterId}_${Date.now()}`,
          chapterId,
          position: position || text.length,
          whatsHappening: analysis.whatsHappening || '',
          presentCharacters: analysis.presentCharacters || characterNames,
          emotionalTone: analysis.emotionalTone || '',
          pacing: analysis.pacing || 'medium',
          affectsFuture: analysis.affectsFuture || '',
          updatedAt: Date.now()
        };

        await db.add('sceneContexts', sceneContext);
        return sceneContext;
      }

      return analysis;
    } catch (error) {
      console.warn('Error analyzing scene context:', error);
      return null;
    }
  }

  /**
   * Get scene context for current writing position
   */
  async getSceneContext(chapterId, position = null) {
    try {
      if (!chapterId) return null;
      
      const contexts = await db.getAll('sceneContexts');
      const chapterContexts = contexts
        .filter(ctx => ctx.chapterId === chapterId)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      
      // If position specified, find closest context
      if (position !== null && chapterContexts.length > 0) {
        const closest = chapterContexts.find(ctx => 
          ctx.position && Math.abs(ctx.position - position) < 500
        );
        if (closest) return closest;
      }
      
      // Return most recent context for chapter
      return chapterContexts[0] || null;
    } catch (error) {
      console.warn('Error loading scene context:', error);
      return null;
    }
  }

  /**
   * Build AI prompt context with all relevant information
   * Priority order: Expert Writer → Story → Style → Instructions → References → Negative → Mood → Scene → Characters → Plot → Previous → World
   */
  async buildAIContext(options = {}) {
    const {
      text = '',
      chapterNumber = null,
      bookId = null,
      chapterId = null,
      includeFullChapter = false,
      includeAllCharacters = false,
      moodSettings = null,
      moodPreset = null,
      contextOptions = {
        includePlotBeats: true,
        includeCharacterArcs: true,
        includeTimeline: true,
        includeDecisions: true,
        includeCallbacks: true,
        includeMemories: true,
        includeAISuggestions: true,
        includeStorylines: true
      }
    } = options;

    const context = await this.getSmartContextForText(text, chapterNumber);
    const parts = [];

    // 1. EXPERT WRITER FOUNDATION (always first)
    try {
      const expertContext = await expertWriterService.getExpertWriterContext(context.storyProfile);
      if (expertContext) {
        parts.push(expertContext);
      }
    } catch (error) {
      console.warn('Error loading expert writer context:', error);
    }

    // 2. STORY PROFILE
    if (context.storyProfile) {
      parts.push('\n=== YOUR STORY\'S FOUNDATION ===');
      parts.push(`Title: ${context.storyProfile.title || 'Untitled'}`);
      parts.push(`Genre: ${context.storyProfile.genres?.join(', ') || context.storyProfile.genre || 'Unknown'}`);
      parts.push(`Premise: ${context.storyProfile.premise || 'Not set'}`);
      if (context.storyProfile.tone) parts.push(`Tone: ${context.storyProfile.tone}`);
      if (context.storyProfile.comparisons) parts.push(`Style Comparisons: ${context.storyProfile.comparisons}`);
    }

    // 3. STYLE PROFILE
    if (context.storyProfile?.styleProfile) {
      parts.push('\n=== YOUR WRITING STYLE PROFILE ===');
      const sp = context.storyProfile.styleProfile;
      
      if (sp.voiceProfile) {
        if (sp.voiceProfile.narratorTone) parts.push(`Narrator Tone: ${sp.voiceProfile.narratorTone}`);
        if (sp.voiceProfile.sentenceStructure) parts.push(`Sentence Structure: ${sp.voiceProfile.sentenceStructure}`);
        if (sp.voiceProfile.vocabularyLevel) parts.push(`Vocabulary Level: ${sp.voiceProfile.vocabularyLevel}`);
        if (sp.voiceProfile.humorStyle?.length > 0) {
          parts.push(`Humor Style: ${sp.voiceProfile.humorStyle.join(', ')}`);
        }
        if (sp.voiceProfile.uniquePatterns?.length > 0) {
          parts.push(`Unique Patterns: ${sp.voiceProfile.uniquePatterns.join(', ')}`);
        }
      }
      
      if (sp.toneBalance) {
        parts.push(`Tone Balance: ${sp.toneBalance.comedyPercent}% comedy / ${sp.toneBalance.horrorPercent}% horror`);
        if (sp.toneBalance.emotionalDepthDescription) {
          parts.push(`Emotional Depth: ${sp.toneBalance.emotionalDepthDescription}`);
        }
      }
      
      if (sp.comedyRules) {
        if (sp.comedyRules.whatMakesItFunny?.length > 0) {
          parts.push(`What Makes It Funny: ${sp.comedyRules.whatMakesItFunny.join(', ')}`);
        }
        if (sp.comedyRules.comedyTiming) {
          parts.push(`Comedy Timing: ${sp.comedyRules.comedyTiming}`);
        }
        if (sp.comedyRules.neverDo?.length > 0) {
          parts.push(`Never Do: ${sp.comedyRules.neverDo.join(', ')}`);
        }
      }
      
      if (sp.pacing) {
        if (sp.pacing.sceneLength) parts.push(`Scene Length: ${sp.pacing.sceneLength}`);
        if (sp.pacing.actionToDialogueRatio) parts.push(`Action/Dialogue Ratio: ${sp.pacing.actionToDialogueRatio}`);
      }
    }

    // 4. STYLE INSTRUCTIONS (specific rules)
    try {
      const instructions = await this.getStyleInstructions();
      if (instructions.length > 0) {
        parts.push('\n=== SPECIFIC STYLE RULES (ALWAYS APPLY) ===');
        instructions.forEach(inst => {
          parts.push(`- ${inst.instruction || inst.rule}`);
          if (inst.explanation) parts.push(`  (${inst.explanation})`);
        });
      }
    } catch (error) {
      console.warn('Error loading style instructions:', error);
    }

    // 5. STYLE REFERENCES (writing examples)
    try {
      const styleContext = await styleReferenceService.getStyleContext(bookId, 2000);
      if (styleContext && styleContext.trim().length > 0) {
        parts.push('\n=== YOUR WRITING EXAMPLES ===');
        parts.push('Study these examples to match the writing voice exactly:');
        parts.push(styleContext);
      }
    } catch (error) {
      console.warn('Error loading style references:', error);
    }

    // 6. NEGATIVE EXAMPLES (what NOT to do)
    try {
      const negativeExamples = await this.getNegativeExamples(moodPreset);
      if (negativeExamples.length > 0) {
        parts.push('\n=== WHAT NOT TO DO ===');
        parts.push('Avoid these mistakes based on previous feedback:');
        negativeExamples.forEach(ex => {
          parts.push(`\n❌ When writing ${ex.moodPreset || 'content'}:`);
          parts.push(`   Requested: ${ex.requested || 'N/A'}`);
          parts.push(`   Problem: ${ex.problem || ex.content?.substring(0, 100)}`);
          if (ex.tags?.length > 0) {
            parts.push(`   Tags: ${ex.tags.join(', ')}`);
          }
          if (ex.whyWrong) {
            parts.push(`   Why wrong: ${ex.whyWrong}`);
          }
        });
      }
    } catch (error) {
      console.warn('Error loading negative examples:', error);
    }

    // 7. CURRENT MOOD SETTINGS
    if (moodSettings) {
      parts.push('\n=== CURRENT MOOD SETTINGS ===');
      parts.push(`Comedy/Horror: ${moodSettings.comedy_horror || 50}%`);
      parts.push(`Tension: ${moodSettings.tension || 50}%`);
      parts.push(`Pacing: ${moodSettings.pacing || 50}%`);
      parts.push(`Detail: ${moodSettings.detail || 50}%`);
      parts.push(`Emotional: ${moodSettings.emotional || 50}%`);
      if (moodSettings.darkness) parts.push(`Darkness: ${moodSettings.darkness}%`);
      if (moodSettings.absurdity) parts.push(`Absurdity: ${moodSettings.absurdity}%`);
      if (moodSettings.formality) parts.push(`Formality: ${moodSettings.formality}%`);
      parts.push('\nApply these mood characteristics EXACTLY to the writing.');
    }

    // 8. SCENE CONTEXT (what's happening now)
    try {
      const sceneContext = await this.getSceneContext(chapterId);
      if (sceneContext) {
        parts.push('\n=== CURRENT SCENE CONTEXT ===');
        parts.push(`What's happening: ${sceneContext.whatsHappening || 'Not specified'}`);
        if (sceneContext.presentCharacters?.length > 0) {
          parts.push(`Present: ${sceneContext.presentCharacters.join(', ')}`);
        }
        if (sceneContext.emotionalTone) {
          parts.push(`Emotional tone: ${sceneContext.emotionalTone}`);
        }
        if (sceneContext.pacing) {
          parts.push(`Pacing: ${sceneContext.pacing}`);
        }
        if (sceneContext.affectsFuture) {
          parts.push(`Affects future: ${sceneContext.affectsFuture}`);
        }
      }
    } catch (error) {
      console.warn('Error loading scene context:', error);
    }

    // 9. CHARACTER VOICES (for dialogue)
    if (context.mentionedCharacters.length > 0 || includeAllCharacters) {
      parts.push('\n=== CHARACTER VOICES ===');
      const characters = includeAllCharacters 
        ? await db.getAll('actors')
        : context.mentionedCharacters;
      
      for (const char of characters) {
        parts.push(`\n${char.name} (${char.class || char.role || 'Character'}):`);
        if (char.desc || char.description) parts.push(`  ${char.desc || char.description}`);
        
        const voice = context.characterVoices[char.name];
        if (voice) {
          parts.push(`  Voice Profile:`);
          const voiceFormatted = this.formatVoiceProfile(voice);
          voiceFormatted.split('\n').forEach(line => {
            if (line.trim()) parts.push(`    ${line}`);
          });
        }

        // Include recent timeline events for character context
        try {
          const timeline = await characterTimelineService.getTimelineSummary(char.id, 5);
          if (timeline.length > 0) {
            parts.push(`  Recent Changes:`);
            timeline.forEach(event => {
              parts.push(`    - ${event.data?.description || event.eventType}`);
            });
          }
        } catch (error) {
          // Timeline is optional, continue without it
        }
      }
    }

    // 10. MANUSCRIPT INTELLIGENCE CONTEXT
    if (bookId && chapterId) {
      try {
        const manuscriptContextEngine = (await import('./manuscriptContextEngine')).default;
        const callbackMemoryService = (await import('./callbackMemoryService')).default;
        
        const manuscriptContext = await manuscriptContextEngine.buildManuscriptContext(bookId, chapterId);
        const callbacks = await callbackMemoryService.getCallbacksForChapter(chapterId);
        const memories = await callbackMemoryService.getRelevantMemories(chapterId);
        const decisions = await callbackMemoryService.getDecisionContext(chapterId);

        // Chapter Flow Context
        if (manuscriptContext.chapterFlow && manuscriptContext.chapterFlow.chapters.length > 0) {
          parts.push('\n=== CHAPTER FLOW CONTEXT ===');
          parts.push(`Book: ${manuscriptContext.chapterFlow.bookTitle || 'Unknown'}`);
          parts.push(`Total chapters: ${manuscriptContext.chapterFlow.chapters.length}`);
          const currentChapter = manuscriptContext.chapterFlow.chapters.find(ch => ch.id === chapterId);
          if (currentChapter) {
            parts.push(`Current chapter: ${currentChapter.number} - ${currentChapter.title || 'Untitled'}`);
          }
        }

        // Plot Timeline Context
        if (manuscriptContext.plotBeats && manuscriptContext.plotBeats.length > 0) {
          parts.push('\n=== PLOT TIMELINE CONTEXT ===');
          parts.push(`Relevant plot beats: ${manuscriptContext.plotBeats.length}`);
          manuscriptContext.plotBeats.slice(0, 5).forEach((beat, idx) => {
            parts.push(`\nBeat ${idx + 1}: ${beat.beat || beat.title || 'Untitled'}`);
            if (beat.purpose) parts.push(`  Purpose: ${beat.purpose}`);
            if (beat.characters && beat.characters.length > 0) {
              parts.push(`  Characters: ${beat.characters.join(', ')}`);
            }
            if (beat.emotionalTone) parts.push(`  Tone: ${beat.emotionalTone}`);
          });
        }

        // Character Arcs Context
        if (manuscriptContext.characterArcs && manuscriptContext.characterArcs.length > 0) {
          parts.push('\n=== CHARACTER ARCS CONTEXT ===');
          manuscriptContext.characterArcs.forEach(arc => {
            parts.push(`\n${arc.characterName}:`);
            if (arc.moments && arc.moments.length > 0) {
              parts.push(`  Recent moments: ${arc.moments.length}`);
              arc.moments.slice(0, 3).forEach(moment => {
                parts.push(`    - ${moment.moment || moment.description || 'Arc moment'}`);
              });
            }
            if (arc.goals && arc.goals.length > 0) {
              parts.push(`  Goals: ${arc.goals.map(g => g.goal || g).join(', ')}`);
            }
          });
        }

        // Master Timeline Context
        if (manuscriptContext.timeline && manuscriptContext.timeline.length > 0) {
          parts.push('\n=== MASTER TIMELINE CONTEXT ===');
          parts.push(`Recent events: ${manuscriptContext.timeline.length}`);
          manuscriptContext.timeline.slice(0, 5).forEach(event => {
            parts.push(`- ${event.title || event.description || 'Event'}`);
            if (event.actors && event.actors.length > 0) {
              parts.push(`  Characters: ${event.actors.join(', ')}`);
            }
          });
        }

        // Decision Tracking Context
        if (decisions && decisions.length > 0) {
          parts.push('\n=== DECISION TRACKING ===');
          parts.push(`Past decisions that matter: ${decisions.length}`);
          decisions.slice(0, 3).forEach(decision => {
            parts.push(`\nDecision: ${decision.decision || decision.title}`);
            if (decision.character) parts.push(`  Made by: ${decision.character}`);
            if (decision.consequences && decision.consequences.length > 0) {
              parts.push(`  Consequences: ${decision.consequences.join(', ')}`);
            }
          });
        }

        // Callback Opportunities
        if (contextOptions.includeCallbacks && callbacks && callbacks.length > 0) {
          parts.push('\n=== CALLBACK OPPORTUNITIES ===');
          parts.push(`Events to reference: ${callbacks.length}`);
          callbacks.slice(0, 3).forEach(callback => {
            parts.push(`- ${callback.event || callback.description}`);
            if (callback.characters && callback.characters.length > 0) {
              parts.push(`  Characters: ${callback.characters.join(', ')}`);
            }
          });
        }

        // Memories
        if (contextOptions.includeMemories && memories && memories.length > 0) {
          parts.push('\n=== RELEVANT MEMORIES ===');
          parts.push(`Important memories: ${memories.length}`);
          memories.slice(0, 3).forEach(memory => {
            parts.push(`- ${memory.event || memory.description}`);
            if (memory.emotionalTone) parts.push(`  Tone: ${memory.emotionalTone}`);
          });
        }

        // AI Suggestions
        if (contextOptions.includeAISuggestions && manuscriptContext.aiSuggestions && manuscriptContext.aiSuggestions.length > 0) {
          parts.push('\n=== AI SUGGESTIONS FOR THIS CHAPTER ===');
          parts.push(`Available suggestions: ${manuscriptContext.aiSuggestions.length}`);
          manuscriptContext.aiSuggestions
            .filter(s => s.priority === 'high' || s.confidence >= 0.7)
            .slice(0, 5)
            .forEach(suggestion => {
              const suggestionText = suggestion.suggestion || suggestion.comedyMoment || suggestion.conflict || suggestion.event || suggestion.decision || 'Suggestion';
              parts.push(`[${suggestion.type || 'suggestion'}] ${suggestionText}`);
              if (suggestion.reasoning) parts.push(`  → ${suggestion.reasoning}`);
              if (suggestion.characters && suggestion.characters.length > 0) {
                parts.push(`  Characters: ${suggestion.characters.join(', ')}`);
              }
            });
        }

        // Active Storylines
        if (contextOptions.includeStorylines && manuscriptContext.storylines && manuscriptContext.storylines.length > 0) {
          parts.push('\n=== ACTIVE STORYLINES ===');
          manuscriptContext.storylines.forEach(storyline => {
            parts.push(`\n${storyline.title || 'Storyline'}:`);
            if (storyline.description) parts.push(`  ${storyline.description}`);
            if (storyline.status) parts.push(`  Status: ${storyline.status}`);
            if (storyline.characters && storyline.characters.length > 0) {
              parts.push(`  Characters: ${storyline.characters.join(', ')}`);
            }
          });
        }
      } catch (error) {
        console.warn('Error loading manuscript intelligence context:', error);
      }
    }

    // 11. PLOT BEATS (for this chapter)
    if (contextOptions.includePlotBeats && context.plotBeats.length > 0) {
      parts.push('\n=== PLOT BEATS TO COVER ===');
      context.plotBeats.forEach((beat, i) => {
        parts.push(`${i + 1}. ${beat.beat}`);
        if (beat.purpose) parts.push(`   Purpose: ${beat.purpose}`);
      });
    }

    // 11. PREVIOUS CHAPTER (excerpt)
    if (chapterNumber && chapterNumber > 1) {
      const prevChapter = await contextEngine.getFullChapter(bookId, chapterNumber - 1);
      if (prevChapter) {
        parts.push('\n=== PREVIOUS CHAPTER (excerpt) ===');
        const words = prevChapter.split(/\s+/);
        const excerpt = words.slice(-500).join(' ');
        parts.push(excerpt);
      }
    }

    // 12. WORLD RULES (last, as they're constraints)
    if (context.worldRules) {
      parts.push('\n=== WORLD RULES & CONSTRAINTS ===');
      if (typeof context.worldRules === 'string') {
        parts.push(context.worldRules);
      } else if (context.worldRules.coreRules) {
        context.worldRules.coreRules.forEach(rule => {
          parts.push(`- ${rule.rule || rule}`);
        });
      }
    }

    // Relevant items (if any)
    if (context.relevantItems.length > 0) {
      parts.push('\n=== ITEMS IN PLAY ===');
      context.relevantItems.forEach(item => {
        parts.push(`- ${item.name} (held by ${item.heldBy}): ${item.desc || ''}`);
      });
    }

    return {
      contextText: parts.join('\n'),
      rawContext: context
    };
  }

  /**
   * Get inline ghost text suggestion based on current text
   */
  async getGhostTextSuggestion(currentText, cursorPosition) {
    // Get text up to cursor
    const textBeforeCursor = currentText.slice(0, cursorPosition);
    const lastParagraph = textBeforeCursor.split('\n\n').pop();
    
    // Detect if we're in dialogue
    const inDialogue = this.detectDialogueContext(lastParagraph);
    
    // Get relevant context
    const context = await this.getSmartContextForText(lastParagraph);
    
    // If in dialogue and we know who's speaking, use their voice
    if (inDialogue.inDialogue && inDialogue.speaker) {
      const voice = await this.getCharacterVoice(inDialogue.speaker);
      if (voice) {
        // Generate continuation in character voice
        try {
          const suggestion = await aiService.callAI(`
            Continue this dialogue as ${inDialogue.speaker}. Match their voice profile exactly.
            
            Voice Profile:
            ${this.formatVoiceProfile(voice)}
            
            Current text (continue from here):
            ${lastParagraph}
            
            Generate ONLY the next 10-20 words of dialogue, staying in character.
            Do not include quotation marks or dialogue tags.
          `, 'creative');
          
          return {
            suggestion: suggestion.trim(),
            type: 'dialogue',
            speaker: inDialogue.speaker
          };
        } catch (error) {
          console.error('Ghost text error:', error);
          return null;
        }
      }
    }
    
    return null;
  }

  /**
   * Detect if current text is in dialogue and who's speaking
   */
  detectDialogueContext(text) {
    // Simple dialogue detection
    const lastQuote = text.lastIndexOf('"');
    const secondLastQuote = text.lastIndexOf('"', lastQuote - 1);
    
    // Check if we're inside quotes (odd number of quotes = in dialogue)
    const quoteCount = (text.match(/"/g) || []).length;
    const inDialogue = quoteCount % 2 === 1;
    
    // Try to detect speaker from preceding text
    let speaker = null;
    if (inDialogue) {
      // Look for "Name said" or "said Name" pattern before the quote
      const beforeQuote = text.slice(0, secondLastQuote > 0 ? secondLastQuote : lastQuote);
      const saidPattern = /(\w+)\s+said|said\s+(\w+)/i;
      const match = beforeQuote.match(saidPattern);
      if (match) {
        speaker = match[1] || match[2];
      }
    }
    
    return { inDialogue, speaker };
  }

  /**
   * Validate content against world rules
   */
  async validateAgainstWorldRules(text) {
    const worldRules = await this.getWorldRules();
    
    if (!worldRules) {
      return { valid: true, issues: [] };
    }

    try {
      const response = await aiService.callAI(`
        Check if this text violates any of the established world rules.

        WORLD RULES:
        ${JSON.stringify(worldRules, null, 2)}

        TEXT TO CHECK:
        ${text}

        Respond in JSON format:
        {
          "valid": true/false,
          "issues": [
            {
              "rule": "which rule was violated",
              "violation": "what specifically violated it",
              "severity": "high/medium/low",
              "suggestion": "how to fix it"
            }
          ]
        }
      `, 'analytical');

      return JSON.parse(response);
    } catch (error) {
      console.error('World rules validation error:', error);
      return { valid: true, issues: [], error: error.message };
    }
  }
}

// Create singleton instance
const smartContextEngine = new SmartContextEngine();

export default smartContextEngine;

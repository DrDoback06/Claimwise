/**
 * Story Brain
 * The master writing intelligence orchestrator.
 *
 * This service sits between WritingCanvas and aiService. Every writing action
 * goes through the Brain, which:
 *
 *  1. Assembles RELEVANT context from the user's story data (smartContextEngine)
 *     without overwhelming the AI with irrelevant details.
 *  2. Injects writing craft knowledge specific to the action (writingCraftGuide)
 *     so the AI knows HOW to write well, not just WHAT to write.
 *  3. Analyzes story progression and suggests forward-thinking ideas.
 *  4. Compresses context to minimize tokens while maximizing AI understanding.
 *
 * The Brain replaces raw `aiService.callAI(prompt, 'creative')` calls with
 * context-rich, craft-aware, story-intelligent calls.
 */

import aiService from './aiService';
import smartContextEngine from './smartContextEngine';
import contextEngine from './contextEngine';
import db from './database';
import writingCraftGuide from '../data/writingCraftGuide';
import { getGenreGuide } from '../data/genreGuides';
import chapterMemoryService from './chapterMemoryService';
import narrativeArcService from './narrativeArcService';

// ─── Token Budget ────────────────────────────────────────────
// We cap context to leave room for the AI's response.
// These limits keep costs down while ensuring quality.
const TOKEN_BUDGETS = {
  continue:      { context: 2000, craft: 400 },
  scene:         { context: 3000, craft: 600 },
  dialogue:      { context: 2500, craft: 500 },
  rewrite:       { context: 1500, craft: 400 },
  expand:        { context: 1500, craft: 300 },
  improve:       { context: 2000, craft: 300 },
  mood:          { context: 2000, craft: 500 },
  characterIntro:{ context: 2000, craft: 300 },
  styleMatch:    { context: 2000, craft: 300 },
  integrate:     { context: 1500, craft: 200 },
  planning:      { context: 3000, craft: 500 },
};

// Approximate chars per token (conservative)
const CHARS_PER_TOKEN = 4;

class StoryBrain {
  constructor() {
    this.contextCache = null;
    this.contextCacheKey = null;
    this.contextCacheTTL = 30000; // 30s cache
    this.contextCacheTime = 0;

    // Story arc state (persisted per session, rebuilt on demand)
    this.storyArcCache = null;
  }

  // ─── Context Assembly ──────────────────────────────────────

  /**
   * Get compressed, relevant context for a writing action.
   * This is the heart of token efficiency: we only send what matters.
   */
  async getContext(options = {}) {
    const {
      text = '',
      chapterNumber = null,
      bookId = null,
      chapterId = null,
      action = 'continue',
      includeAllCharacters = false
    } = options;

    // Cache key based on chapter + action
    const cacheKey = `${bookId}_${chapterId}_${action}_${text.length}`;
    if (this.contextCache && this.contextCacheKey === cacheKey &&
        Date.now() - this.contextCacheTime < this.contextCacheTTL) {
      return this.contextCache;
    }

    // Build full context from smartContextEngine
    const { contextText, rawContext } = await smartContextEngine.buildAIContext({
      text,
      chapterNumber,
      bookId,
      chapterId,
      includeAllCharacters,
      contextOptions: {
        includePlotBeats: true,
        includeCharacterArcs: ['scene', 'continue', 'planning'].includes(action),
        includeTimeline: ['scene', 'planning', 'continue'].includes(action),
        includeDecisions: ['scene', 'planning', 'continue'].includes(action),
        includeCallbacks: ['scene', 'continue', 'dialogue'].includes(action),
        includeMemories: ['scene', 'continue'].includes(action),
        includeAISuggestions: ['scene', 'planning'].includes(action),
        includeStorylines: ['scene', 'planning', 'continue'].includes(action)
      }
    });

    // Compress to token budget
    const budget = TOKEN_BUDGETS[action] || TOKEN_BUDGETS.continue;
    const maxContextChars = budget.context * CHARS_PER_TOKEN;
    const compressed = this._compressContext(contextText, maxContextChars, action);

    // Layer on chapter memories (story-so-far) — replaces full previous chapter text
    let storySoFar = '';
    if (bookId && ['continue', 'scene', 'dialogue', 'planning', 'characterIntro'].includes(action)) {
      try {
        storySoFar = await chapterMemoryService.buildStorySoFar(bookId, chapterNumber || Infinity, 1500);
      } catch (_) { /* optional */ }
    }

    // Layer on narrative arc guidance
    let arcGuidance = '';
    if (['continue', 'scene', 'planning'].includes(action)) {
      try {
        // Count total chapters from book
        const books = await db.getAll('books');
        const book = books.find(b => b.id === bookId);
        const totalChapters = book?.chapters?.length || 0;
        const arcInfo = await narrativeArcService.getArcGuidance(bookId, chapterNumber || 1, totalChapters);
        arcGuidance = arcInfo.guidance;
      } catch (_) { /* optional */ }
    }

    // Layer on genre guide
    let genreGuidance = '';
    if (['continue', 'scene', 'dialogue', 'mood', 'characterIntro'].includes(action)) {
      try {
        const storyProfile = rawContext?.storyProfile;
        const genres = storyProfile?.genres || (storyProfile?.genre ? [storyProfile.genre] : []);
        if (genres.length > 0) {
          const guide = getGenreGuide(genres);
          if (guide) {
            genreGuidance = guide.conventions;
            if (['scene', 'continue'].includes(action)) {
              genreGuidance += '\n\n' + guide.pacing;
            }
          }
        }
      } catch (_) { /* optional */ }
    }

    // Layer on writing preferences (pet peeves, favorites, POV, etc.)
    let preferencesGuidance = '';
    try {
      const prefs = await db.get('meta', 'writing_preferences');
      if (prefs) {
        const parts = [];
        if (prefs.pov) parts.push(`POV: ${prefs.pov}`);
        if (prefs.tense) parts.push(`Tense: ${prefs.tense}`);
        if (prefs.dialogueStyle) parts.push(`Dialogue style: ${prefs.dialogueStyle}`);
        if (prefs.descriptionDensity) parts.push(`Description density: ${prefs.descriptionDensity}`);
        if (prefs.profanityLevel) parts.push(`Profanity level: ${prefs.profanityLevel}`);
        if (prefs.violenceLevel) parts.push(`Violence level: ${prefs.violenceLevel}`);
        if (prefs.chapterLength) parts.push(`Target chapter length: ${prefs.chapterLength}`);
        const peeves = [...(prefs.petPeeves || [])];
        if (prefs.customPetPeeves) peeves.push(prefs.customPetPeeves);
        if (peeves.length > 0) parts.push(`NEVER DO: ${peeves.join(', ')}`);
        const favs = [...(prefs.favorites || [])];
        if (prefs.customFavorites) favs.push(prefs.customFavorites);
        if (favs.length > 0) parts.push(`PRIORITIZE: ${favs.join(', ')}`);
        if (parts.length > 0) {
          preferencesGuidance = '\n=== WRITER PREFERENCES ===\n' + parts.join('\n');
        }
      }
    } catch (_) { /* optional */ }

    // Assemble final system context
    const contextParts = [compressed];
    if (storySoFar) contextParts.push(storySoFar);
    if (arcGuidance) contextParts.push(arcGuidance);
    if (genreGuidance) contextParts.push('\n=== GENRE-SPECIFIC GUIDANCE ===\n' + genreGuidance);
    if (preferencesGuidance) contextParts.push(preferencesGuidance);

    const result = {
      systemContext: contextParts.join('\n\n'),
      rawContext,
      budget
    };

    // Cache it
    this.contextCache = result;
    this.contextCacheKey = cacheKey;
    this.contextCacheTime = Date.now();

    return result;
  }

  /**
   * Compress context to fit within a character budget.
   * Prioritizes sections based on the writing action.
   */
  _compressContext(contextText, maxChars, action) {
    if (contextText.length <= maxChars) return contextText;

    // Split into sections
    const sections = contextText.split(/\n===\s+/);
    const header = sections[0]; // Usually expert writer content

    // Priority map: which sections matter most for each action
    const priorities = {
      continue:       ['WRITING STYLE', 'CHARACTER VOICES', 'CURRENT SCENE', 'PLOT BEATS', 'STORY', 'WORLD'],
      scene:          ['PLOT BEATS', 'CHARACTER VOICES', 'STORY', 'WRITING STYLE', 'MASTER TIMELINE', 'ACTIVE STORYLINES', 'CALLBACK', 'WORLD'],
      dialogue:       ['CHARACTER VOICES', 'WRITING STYLE', 'CURRENT SCENE', 'STORY'],
      rewrite:        ['WRITING STYLE', 'STYLE RULES', 'WRITING EXAMPLES', 'WHAT NOT'],
      expand:         ['WRITING STYLE', 'CURRENT SCENE', 'CHARACTER VOICES'],
      improve:        ['WRITING STYLE', 'STYLE RULES', 'WHAT NOT'],
      mood:           ['MOOD SETTINGS', 'WRITING STYLE', 'STORY', 'CHARACTER VOICES'],
      characterIntro: ['CHARACTER VOICES', 'STORY', 'WORLD', 'WRITING STYLE'],
      styleMatch:     ['WRITING STYLE', 'STYLE RULES', 'WRITING EXAMPLES'],
      integrate:      ['WRITING STYLE', 'CURRENT SCENE'],
      planning:       ['PLOT BEATS', 'CHARACTER ARCS', 'ACTIVE STORYLINES', 'MASTER TIMELINE', 'DECISION TRACKING', 'STORY', 'WORLD']
    };

    const actionPriorities = priorities[action] || priorities.continue;

    // Score each section by priority
    const scored = sections.slice(1).map(section => {
      const sectionTitle = section.split('===')[0].trim().toUpperCase();
      const priorityIdx = actionPriorities.findIndex(p =>
        sectionTitle.includes(p)
      );
      return {
        text: `=== ${section}`,
        priority: priorityIdx >= 0 ? priorityIdx : 99,
        title: sectionTitle
      };
    });

    // Sort by priority (lower number = higher priority)
    scored.sort((a, b) => a.priority - b.priority);

    // Build compressed output within budget
    let result = '';
    let remaining = maxChars;

    // Always include a trimmed version of the header (expert writer content)
    const trimmedHeader = header.length > 600
      ? header.substring(0, 600) + '\n[...expert writing principles applied...]'
      : header;
    result += trimmedHeader;
    remaining -= trimmedHeader.length;

    // Add sections in priority order
    for (const section of scored) {
      if (remaining <= 0) break;

      if (section.text.length <= remaining) {
        result += '\n' + section.text;
        remaining -= section.text.length;
      } else if (remaining > 200) {
        // Include a truncated version of this section
        result += '\n' + section.text.substring(0, remaining - 50) + '\n[...truncated...]';
        remaining = 0;
      }
    }

    return result;
  }

  // ─── Craft Directives ──────────────────────────────────────

  /**
   * Get the writing craft directive for a specific action.
   * These are expert-level writing instructions that tell the AI
   * HOW to write well for this specific task.
   */
  getCraftDirective(action, moodPreset = null) {
    const parts = [];

    switch (action) {
      case 'continue':
        parts.push(writingCraftGuide.continue.directive);
        parts.push(writingCraftGuide.continue.pacing);
        break;
      case 'scene':
        parts.push(writingCraftGuide.scene.directive);
        parts.push(writingCraftGuide.scene.structure);
        break;
      case 'dialogue':
        parts.push(writingCraftGuide.dialogue.directive);
        parts.push(writingCraftGuide.dialogue.patterns);
        break;
      case 'rewrite':
        parts.push(writingCraftGuide.rewrite.directive);
        parts.push(writingCraftGuide.rewrite.checklist);
        break;
      case 'expand':
        parts.push(writingCraftGuide.expand.directive);
        break;
      case 'improve':
        parts.push(writingCraftGuide.rewrite.directive);
        break;
      case 'mood':
        if (moodPreset === 'comedy' || moodPreset === 'funny') {
          parts.push(writingCraftGuide.mood.comedy);
        } else if (moodPreset === 'horror' || moodPreset === 'dark') {
          parts.push(writingCraftGuide.mood.horror);
        } else if (moodPreset === 'tense' || moodPreset === 'suspense') {
          parts.push(writingCraftGuide.mood.tension);
        } else {
          // Mix based on mood name
          parts.push(writingCraftGuide.mood.comedy);
          parts.push(writingCraftGuide.mood.tension);
        }
        break;
      case 'characterIntro':
        parts.push(writingCraftGuide.characterIntro.directive);
        break;
      case 'styleMatch':
        parts.push(writingCraftGuide.styleMatch.directive);
        break;
      case 'planning':
        parts.push(writingCraftGuide.planning.chapter_planning);
        parts.push(writingCraftGuide.forwardThinking.directive);
        break;
      default:
        parts.push(writingCraftGuide.continue.directive);
    }

    // Trim to budget
    const budget = TOKEN_BUDGETS[action] || TOKEN_BUDGETS.continue;
    const maxChars = budget.craft * CHARS_PER_TOKEN;
    let directive = parts.join('\n\n');
    if (directive.length > maxChars) {
      directive = directive.substring(0, maxChars);
    }

    return directive;
  }

  // ─── Writing Actions ───────────────────────────────────────
  // Each method assembles the optimal prompt for a specific writing task.
  // The pattern: system = (story context + craft directive), user = (focused instruction + text)

  /**
   * Continue writing from where the text ends.
   */
  async continueWriting({ text, chapterNumber, bookId, chapterId, actors = [] }) {
    const { systemContext } = await this.getContext({
      text, chapterNumber, bookId, chapterId, action: 'continue'
    });

    const craft = this.getCraftDirective('continue');
    const contextText = text.slice(-800); // Last 800 chars for direct context
    const characterNames = actors.map(a => a.name).join(', ');

    const system = `You are the author of this story. Write in the EXACT same voice, style, and rhythm as the existing text.

${craft}

${systemContext}

Characters in this story: ${characterNames || 'Use characters from context above.'}`;

    const prompt = `Continue writing from where this text ends. Write the next 2-3 paragraphs. Do NOT explain, summarize, or use meta-commentary. Just write.

"""
${contextText}
"""`;

    return aiService.callAI(prompt, 'creative', system);
  }

  /**
   * Generate a complete scene.
   */
  async generateScene({ text, chapterNumber, bookId, chapterId, actors = [], plotBeats = [] }) {
    const { systemContext } = await this.getContext({
      text, chapterNumber, bookId, chapterId, action: 'scene'
    });

    const craft = this.getCraftDirective('scene');
    const contextText = text.slice(-1000);
    const characterNames = actors.map(a => a.name).join(', ');

    // Find the next unfinished plot beat
    const uncompletedBeats = plotBeats.filter(b => !b.completed);
    const nextBeat = uncompletedBeats[0];
    const beatInfo = nextBeat
      ? `SCENE OBJECTIVE: Address this plot beat: "${nextBeat.beat || nextBeat.purpose}"\nPurpose: ${nextBeat.purpose || 'Advance the story'}`
      : 'SCENE OBJECTIVE: Continue the story naturally with a scene that develops character or advances plot.';

    const system = `You are the author of this story. Write a complete scene that fits naturally into the chapter.

${craft}

${systemContext}

Characters available: ${characterNames || 'Use characters from context above.'}`;

    const prompt = `Write the next scene for this chapter (3-5 paragraphs).

${beatInfo}

Current chapter content so far:
"""
${contextText}
"""

Write the scene. No explanation, no meta-commentary. Just vivid, engaging prose:`;

    return aiService.callAI(prompt, 'creative', system);
  }

  /**
   * Generate dialogue between characters.
   */
  async generateDialogue({ text, chapterNumber, bookId, chapterId, actors = [], speakingCharacters = [] }) {
    const { systemContext } = await this.getContext({
      text, chapterNumber, bookId, chapterId, action: 'dialogue'
    });

    const craft = this.getCraftDirective('dialogue');
    const contextText = text.slice(-600);

    // Get voice profiles for speaking characters
    const voiceNotes = [];
    for (const charName of speakingCharacters) {
      const voice = await smartContextEngine.getCharacterVoice(charName);
      if (voice) {
        voiceNotes.push(`${charName}: ${smartContextEngine.formatVoiceProfile(voice)}`);
      }
    }

    const characterNames = speakingCharacters.length > 0
      ? speakingCharacters.join(' and ')
      : actors.map(a => a.name).slice(0, 3).join(', ');

    const system = `You are the author of this story. Write dialogue that reveals character and advances the scene.

${craft}

${systemContext}

${voiceNotes.length > 0 ? 'VOICE PROFILES FOR THIS CONVERSATION:\n' + voiceNotes.join('\n\n') : ''}`;

    const prompt = `Write a dialogue exchange between ${characterNames} that fits naturally after this text. Include action beats between lines. Each character should sound distinct.

Current text:
"""
${contextText}
"""

Write the dialogue. No explanation:`;

    return aiService.callAI(prompt, 'creative', system);
  }

  /**
   * Rewrite selected text to be better.
   */
  async rewriteText({ selectedText, surroundingText, bookId, chapterId, chapterNumber }) {
    const { systemContext } = await this.getContext({
      text: surroundingText || selectedText,
      chapterNumber, bookId, chapterId, action: 'rewrite'
    });

    const craft = this.getCraftDirective('rewrite');

    const system = `You are editing this story. Improve the passage while preserving the author's voice exactly.

${craft}

${systemContext}`;

    const prompt = `Rewrite this passage. Make it stronger, more vivid, and more engaging. Keep the same meaning, voice, and tone. Return ONLY the rewritten text.

"${selectedText}"`;

    return aiService.callAI(prompt, 'creative', system);
  }

  /**
   * Expand selected text with more detail.
   */
  async expandText({ selectedText, surroundingText, bookId, chapterId, chapterNumber }) {
    const { systemContext } = await this.getContext({
      text: surroundingText || selectedText,
      chapterNumber, bookId, chapterId, action: 'expand'
    });

    const craft = this.getCraftDirective('expand');

    const system = `You are expanding a passage in this story. Add depth without padding.

${craft}

${systemContext}`;

    const prompt = `Expand this passage with more detail, sensory information, and depth. Maintain the same voice and style. Return ONLY the expanded text.

"${selectedText}"`;

    return aiService.callAI(prompt, 'creative', system);
  }

  /**
   * Apply a mood transformation to text.
   */
  async applyMood({ selectedText, moodPreset, moodSettings, bookId, chapterId, chapterNumber, surroundingText }) {
    const { systemContext } = await this.getContext({
      text: surroundingText || selectedText,
      chapterNumber, bookId, chapterId, action: 'mood'
    });

    const craft = this.getCraftDirective('mood', moodPreset);

    const system = `You are adjusting the mood of a passage in this story.

${craft}

${systemContext}`;

    const prompt = `Rewrite this passage to be more ${moodPreset || 'intense'}. Keep the core meaning and story events but transform the tone and atmosphere. Return ONLY the rewritten text.

"${selectedText}"`;

    return aiService.callAI(prompt, 'creative', system);
  }

  /**
   * Suggest improvements for the text.
   */
  async suggestImprovements({ text, bookId, chapterId, chapterNumber }) {
    const { systemContext } = await this.getContext({
      text, chapterNumber, bookId, chapterId, action: 'improve'
    });

    const craft = this.getCraftDirective('improve');

    const system = `You are an expert editor reviewing this story. Provide specific, actionable feedback.

${craft}

${systemContext}`;

    const textToAnalyze = text.slice(-2000);

    const prompt = `Analyze this text and provide 3-5 specific improvement suggestions. For each:
1. Quote the exact passage that needs work
2. Explain WHY it's weak (be specific)
3. Show a rewritten version

Focus on: pacing, dialogue quality, show-don't-tell, voice consistency, and emotional impact.

Text:
"""
${textToAnalyze}
"""`;

    return aiService.callAI(prompt, 'analytical', system);
  }

  /**
   * Match selected text to the story's established style.
   */
  async matchStyle({ selectedText, surroundingText, bookId, chapterId, chapterNumber }) {
    const { systemContext } = await this.getContext({
      text: surroundingText || selectedText,
      chapterNumber, bookId, chapterId, action: 'styleMatch'
    });

    const craft = this.getCraftDirective('styleMatch');

    const system = `You are adjusting text to match this story's established writing style exactly.

${craft}

${systemContext}`;

    const prompt = `Rewrite this text to perfectly match the story's established style, voice, and rhythm. Keep the meaning but adjust everything else to sound like it was written by the same author. Return ONLY the rewritten text.

"${selectedText}"`;

    return aiService.callAI(prompt, 'creative', system);
  }

  /**
   * Introduce a new character into the scene.
   */
  async introduceCharacter({ text, bookId, chapterId, chapterNumber, actors = [] }) {
    const { systemContext } = await this.getContext({
      text, chapterNumber, bookId, chapterId, action: 'characterIntro',
      includeAllCharacters: true
    });

    const craft = this.getCraftDirective('characterIntro');
    const existingNames = actors.map(a => a.name).join(', ');

    const system = `You are the author of this story, introducing a new character.

${craft}

${systemContext}`;

    const prompt = `Write 1-2 paragraphs introducing a NEW character into this scene. They should be memorable, distinctive, and serve a clear narrative purpose.

Existing characters (do NOT reintroduce these): ${existingNames || 'None established yet.'}

Current scene:
"""
${text.slice(-800)}
"""

Write the introduction. No explanation:`;

    return aiService.callAI(prompt, 'creative', system);
  }

  /**
   * Integrate selected text smoothly with surroundings.
   */
  async integrateText({ selectedText, beforeText, afterText, bookId, chapterId, chapterNumber }) {
    const { systemContext } = await this.getContext({
      text: beforeText + selectedText + afterText,
      chapterNumber, bookId, chapterId, action: 'integrate'
    });

    const craft = this.getCraftDirective('integrate');

    const system = `You are smoothing transitions in this story.

${craft}

${systemContext}`;

    const prompt = `This text needs to flow better with its surroundings. Add transitional phrases, sensory details, and smooth connections.

Text BEFORE:
"""
${beforeText.slice(-500)}
"""

TEXT TO INTEGRATE (rewrite this):
"""
${selectedText}
"""

Text AFTER:
"""
${afterText.slice(0, 500)}
"""

Rewrite ONLY the middle section to flow naturally. Return just the rewritten text:`;

    return aiService.callAI(prompt, 'creative', system);
  }

  /**
   * Make selected text funnier.
   */
  async makeFunnier({ selectedText, surroundingText, bookId, chapterId, chapterNumber }) {
    const { systemContext } = await this.getContext({
      text: surroundingText || selectedText,
      chapterNumber, bookId, chapterId, action: 'mood'
    });

    const craft = this.getCraftDirective('mood', 'comedy');

    const system = `You are adding comedy to this story while keeping the plot intact.

${craft}

${systemContext}`;

    const prompt = `Make this passage funnier. Add witty observations, absurd details, or sharpen the comedic timing. Keep the plot events and character actions the same. Return ONLY the rewritten text.

"${selectedText}"`;

    return aiService.callAI(prompt, 'creative', system);
  }

  /**
   * Make selected text darker/more tense.
   */
  async makeDarker({ selectedText, surroundingText, bookId, chapterId, chapterNumber }) {
    const { systemContext } = await this.getContext({
      text: surroundingText || selectedText,
      chapterNumber, bookId, chapterId, action: 'mood'
    });

    const craft = this.getCraftDirective('mood', 'horror');

    const system = `You are adding tension and darkness to this story while keeping the plot intact.

${craft}

${systemContext}`;

    const prompt = `Make this passage darker and more unsettling. Add dread, tension, or horror elements. Keep the plot events but transform the atmosphere. Return ONLY the rewritten text.

"${selectedText}"`;

    return aiService.callAI(prompt, 'creative', system);
  }

  // ─── Forward Thinking / Story Planning ─────────────────────

  /**
   * Analyze the story so far and suggest what should happen next.
   * This is the "forward thinking" feature - the AI acts as a story consultant.
   */
  async analyzeStoryProgression({ bookId, chapterId, chapterNumber, text }) {
    const { systemContext } = await this.getContext({
      text, chapterNumber, bookId, chapterId, action: 'planning'
    });

    const craft = this.getCraftDirective('planning');

    // Load additional data for comprehensive analysis
    let plotThreads = [];
    let characterArcs = [];
    try {
      plotThreads = await db.getAll('plotThreads');
      characterArcs = await db.getAll('characterArcs');
    } catch (_) { /* optional stores */ }

    const plotSummary = plotThreads.length > 0
      ? `\nACTIVE PLOT THREADS:\n${plotThreads.filter(t => t.status !== 'resolved').map(t => `- ${t.title || t.description}: ${t.status || 'active'}`).join('\n')}`
      : '';

    const arcSummary = characterArcs.length > 0
      ? `\nCHARACTER ARCS:\n${characterArcs.map(a => `- ${a.characterName}: ${a.currentPhase || 'developing'}`).join('\n')}`
      : '';

    const system = `You are a story consultant analyzing this manuscript and planning its future direction.

${craft}

${systemContext}
${plotSummary}
${arcSummary}`;

    const prompt = `Based on everything you know about this story, analyze its current state and provide forward-thinking suggestions.

Return a JSON object:
{
  "storyHealth": {
    "pacing": "assessment of current pacing",
    "tension": "is tension building appropriately?",
    "characterDevelopment": "are characters growing?",
    "plotProgression": "where are we in the story arc?"
  },
  "unresolved": [
    "List of setups/promises that haven't paid off yet"
  ],
  "nextChapterSuggestions": [
    {
      "idea": "What should happen next",
      "reasoning": "Why this would work well here",
      "characters": ["who's involved"],
      "type": "escalation|revelation|character|action|aftermath"
    }
  ],
  "warningsAndOpportunities": [
    {
      "type": "warning|opportunity",
      "description": "What you noticed",
      "suggestion": "What to do about it"
    }
  ],
  "thematicNotes": "What themes are emerging and how to develop them"
}`;

    const response = await aiService.callAI(prompt, 'analytical', system);

    // Parse the JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (_) { /* fall through */ }

    return { raw: response };
  }

  /**
   * Get quick "what should happen next" suggestions without full analysis.
   * Cheaper/faster than full story progression analysis.
   */
  async getNextBeatSuggestions({ text, chapterNumber, bookId, chapterId, actors = [] }) {
    const { systemContext } = await this.getContext({
      text, chapterNumber, bookId, chapterId, action: 'continue'
    });

    const characterNames = actors.map(a => a.name).join(', ');

    const system = `You are a story consultant suggesting what should happen next.

${systemContext}`;

    const prompt = `Based on where the story currently stands, suggest 3 different directions the next scene could go. Make each suggestion different in tone and approach.

Current chapter text (ending):
"""
${text.slice(-500)}
"""

Characters available: ${characterNames}

Return a JSON array of 3 suggestions:
[
  {
    "direction": "Brief description of what happens",
    "tone": "comedic|tense|emotional|action|revelatory",
    "characters": ["who's involved"],
    "hookLine": "A compelling first line that would start this direction"
  }
]`;

    const response = await aiService.callAI(prompt, 'analytical', system);

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (_) { /* fall through */ }

    return [];
  }

  // ─── Utility ───────────────────────────────────────────────

  // ─── Generic style-aware prose helper ───────────────────────
  //
  // Any surface that wants AI-generated prose in the author's voice must use
  // this helper instead of calling aiService.callAI directly. It routes the
  // request through the same Continue-Writing pipeline (smartContextEngine +
  // styleReference + chapter memories + genre + writer preferences) so the
  // output matches the book's voice.
  //
  // Usage:
  //   const text = await storyBrain.generateProse({
  //     action: 'scene',
  //     userPrompt: 'Write a scene where X happens...',
  //     bookId, chapterId, chapterNumber,
  //   });

  /**
   * Generic prose generator. Wraps context + craft + aiService.callAI.
   *
   * @param {object} opts
   * @param {string} opts.userPrompt            - The focused instruction for the AI.
   * @param {string} [opts.action='scene']      - Writing action (continue|scene|dialogue|rewrite|expand|improve|mood|characterIntro|styleMatch|planning).
   * @param {string} [opts.customPrompt]        - User-supplied extra instruction (from the "custom prompt" modal).
   * @param {string} [opts.additionalInstructions] - Extra system-level guidance (e.g. template tips).
   * @param {string} [opts.bookId]
   * @param {string} [opts.chapterId]
   * @param {number} [opts.chapterNumber]
   * @param {string} [opts.textUpToCursor]      - Text for context assembly when different from the whole chapter.
   * @param {string} [opts.moodPreset]
   * @param {'creative'|'structured'|'analytical'} [opts.task='creative']
   * @param {AbortController} [opts.abortController]
   * @returns {Promise<string>} The generated text.
   */
  async generateProse(opts = {}) {
    const {
      userPrompt,
      action = 'scene',
      customPrompt = '',
      additionalInstructions = '',
      bookId = null,
      chapterId = null,
      chapterNumber = null,
      textUpToCursor = '',
      moodPreset = null,
      task = 'creative',
      abortController = null,
    } = opts;

    if (!userPrompt || typeof userPrompt !== 'string') {
      throw new Error('storyBrain.generateProse: userPrompt is required');
    }

    const { systemContext } = await this.getContext({
      text: textUpToCursor,
      chapterNumber,
      bookId,
      chapterId,
      action,
    });

    const craft = this.getCraftDirective(action, moodPreset);

    const system = `You are the author of this story. Write in the EXACT same voice, style, and rhythm as the existing text.

${craft}

${systemContext}

${customPrompt ? `CUSTOM INSTRUCTIONS:\n${customPrompt}\n` : ''}${additionalInstructions || ''}`;

    return aiService.callAI(userPrompt, task, system, { abortController });
  }

  /**
   * Clear all caches (call when story data changes).
   */
  clearCache() {
    this.contextCache = null;
    this.contextCacheKey = null;
    this.storyArcCache = null;
    smartContextEngine.clearCache();
  }
}

// Singleton
const storyBrain = new StoryBrain();
export default storyBrain;

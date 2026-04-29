/**
 * Writing Enhancement Services
 * Collection of services for the 10 new writing features
 */

import aiService from './aiService';
import db from './database';
import smartContextEngine from './smartContextEngine';
import contextEngine from './contextEngine';
import chapterDataExtractionService from './chapterDataExtractionService';
import storyBrain from './storyBrain';

/**
 * Helper: get storyBrain system context for writing enhancement features.
 * This ensures all writing generation gets full story awareness.
 */
const _getEnhancementContext = async (text, bookId, chapterId, action = 'rewrite') => {
  try {
    const { systemContext } = await storyBrain.getContext({
      text: text || '',
      bookId,
      chapterId,
      action
    });
    return systemContext;
  } catch (_) {
    return '';
  }
};

/**
 * Feature 1: Smart Continuity Checker
 * Analyzes selected text against previous chapters for inconsistencies
 */
export const checkContinuity = async (selectedText, currentChapterId, currentBookId, worldState) => {
  try {
    // Get previous chapters
    const allChapters = await contextEngine.getAllChapters();
    const currentChapter = allChapters.find(c => c.id === currentChapterId && c.bookId === currentBookId);
    if (!currentChapter) return { issues: [], suggestions: [] };

    const previousChapters = allChapters
      .filter(c => c.bookId === currentBookId && c.number < currentChapter.number)
      .sort((a, b) => b.number - a.number)
      .slice(0, 5); // Last 5 chapters

    const previousText = previousChapters
      .map(c => `Chapter ${c.number}: ${c.content || c.script || ''}`)
      .join('\n\n')
      .slice(-5000); // Last 5000 chars

    const systemContext = await _getEnhancementContext(selectedText, currentBookId, currentChapterId, 'rewrite');

    const prompt = `=== CONTINUITY CHECK ===
Analyze this selected text for inconsistencies with previous chapters.

SELECTED TEXT:
"""
${selectedText}
"""

PREVIOUS CHAPTERS CONTEXT:
"""
${previousText}
"""

CHARACTERS IN STORY:
${(worldState.actors || []).map(a => `- ${a.name} (${a.role || 'NPC'})`).join('\n')}

ITEMS IN STORY:
${(worldState.itemBank || []).slice(0, 20).map(i => `- ${i.name}`).join('\n')}

Check for:
1. Character appearance inconsistencies (hair color, height, scars mentioned differently)
2. Item ownership conflicts (character has item they shouldn't, or lost item they still have)
3. Stat changes that don't match previous chapters
4. Location inconsistencies
5. Timeline issues (events happening out of order)

Return JSON:
{
  "issues": [
    {
      "type": "appearance|ownership|stat|location|timeline",
      "severity": "high|medium|low",
      "description": "Issue description",
      "originalText": "Problematic text",
      "suggestedFix": "Corrected version",
      "confidence": 0.85
    }
  ]
}`;

    const response = await aiService.callAI(prompt, 'structured', systemContext);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    return { issues: [], suggestions: [] };
  } catch (error) {
    console.error('Error checking continuity:', error);
    return { issues: [], suggestions: [] };
  }
};

/**
 * Feature 2: Dialogue Enhancer
 * Enhances dialogue with character voice patterns
 */
export const enhanceDialogue = async (dialogueText, characterName, chapterId, bookId) => {
  try {
    const voiceProfile = await smartContextEngine.getCharacterVoice(characterName);
    const systemContext = await _getEnhancementContext(dialogueText, bookId, chapterId, 'dialogue');

    const system = `You are enhancing dialogue to match a character's voice profile.\n\n${systemContext}`;

    const prompt = `Enhance this dialogue to match ${characterName}'s voice profile exactly.

DIALOGUE:
"""
${dialogueText}
"""

${voiceProfile ? `
VOICE PROFILE:
- Speech Patterns: ${voiceProfile.speechPatterns || 'Not specified'}
- Vocabulary: ${voiceProfile.vocabularyChoices?.join(', ') || 'Not specified'}
- Avoid: ${voiceProfile.vocabularyAvoid?.join(', ') || 'None'}
- Quirks: ${voiceProfile.quirks?.join(', ') || 'None'}
` : 'No voice profile available - use general character voice'}

Return ONLY the enhanced dialogue (no explanations):`;

    const response = await aiService.callAI(prompt, 'creative', system);
    return response.trim();
  } catch (error) {
    console.error('Error enhancing dialogue:', error);
    return dialogueText;
  }
};

/**
 * Feature 3: Pacing Analyzer
 * Analyzes chapter pacing and suggests improvements
 */
export const analyzePacing = async (chapterText) => {
  try {
    const sentences = chapterText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = chapterText.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // Analyze sentence lengths
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    
    // Analyze paragraph lengths
    const paragraphLengths = paragraphs.map(p => p.split(/\s+/).length);
    const avgParagraphLength = paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length;
    
    // Detect action vs dialogue vs description
    const dialogueCount = (chapterText.match(/["'"]/g) || []).length / 2;
    const actionWords = (chapterText.match(/\b(moved|ran|jumped|struck|attacked|fought|dodged|blocked)\b/gi) || []).length;
    const descriptiveWords = (chapterText.match(/\b(saw|felt|heard|smelled|tasted|looked|appeared|seemed)\b/gi) || []).length;
    
    const totalWords = chapterText.split(/\s+/).length;
    const dialoguePercent = (dialogueCount * 20) / totalWords * 100; // Rough estimate
    const actionPercent = (actionWords * 10) / totalWords * 100;
    const descriptionPercent = (descriptiveWords * 8) / totalWords * 100;
    
    // Identify pacing issues
    const issues = [];
    const suggestions = [];
    
    if (avgSentenceLength < 8) {
      issues.push({
        type: 'pacing',
        severity: 'medium',
        description: 'Very short sentences - may feel choppy',
        location: 'throughout',
        suggestion: 'Consider combining some short sentences for better flow'
      });
    } else if (avgSentenceLength > 25) {
      issues.push({
        type: 'pacing',
        severity: 'medium',
        description: 'Very long sentences - may slow pacing',
        location: 'throughout',
        suggestion: 'Break up some long sentences for better readability'
      });
    }
    
    if (dialoguePercent < 20) {
      suggestions.push('Consider adding more dialogue to break up narrative');
    } else if (dialoguePercent > 60) {
      suggestions.push('High dialogue ratio - consider adding more action or description');
    }
    
    if (actionPercent < 10 && descriptionPercent > 40) {
      issues.push({
        type: 'pacing',
        severity: 'low',
        description: 'Heavy on description, light on action',
        location: 'throughout',
        suggestion: 'Add action beats to maintain momentum'
      });
    }
    
    return {
      metrics: {
        avgSentenceLength: Math.round(avgSentenceLength),
        avgParagraphLength: Math.round(avgParagraphLength),
        dialoguePercent: Math.round(dialoguePercent),
        actionPercent: Math.round(actionPercent),
        descriptionPercent: Math.round(descriptionPercent)
      },
      issues,
      suggestions,
      timeline: this._createPacingTimeline(chapterText, paragraphs)
    };
  } catch (error) {
    console.error('Error analyzing pacing:', error);
    return { metrics: {}, issues: [], suggestions: [], timeline: [] };
  }
};

const _createPacingTimeline = (chapterText, paragraphs) => {
  return paragraphs.map((para, idx) => {
    const words = para.split(/\s+/).length;
    const sentences = para.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const hasDialogue = /["'"]/.test(para);
    const hasAction = /\b(moved|ran|jumped|struck|attacked)\b/gi.test(para);
    
    return {
      paragraph: idx + 1,
      wordCount: words,
      sentenceCount: sentences,
      avgSentenceLength: Math.round(words / sentences),
      type: hasDialogue ? 'dialogue' : hasAction ? 'action' : 'description',
      pacing: words < 50 ? 'fast' : words > 150 ? 'slow' : 'medium'
    };
  });
}

/**
 * Feature 4: Emotional Beat Tracker
 * Tracks emotional beats in chapter
 */
export const trackEmotionalBeats = async (chapterText, chapterId, bookId) => {
  try {
    const systemContext = await _getEnhancementContext(chapterText, bookId, chapterId, 'rewrite');

    const prompt = `Analyze this chapter text and identify emotional beats (moments of high emotion, tension, relief, etc.).

CHAPTER TEXT:
"""
${chapterText.slice(0, 8000)}
"""

Return JSON array:
[
  {
    "position": 0.25,
    "emotion": "tension|joy|sadness|anger|fear|relief|anticipation",
    "intensity": 1-10,
    "description": "What's happening emotionally",
    "text": "Excerpt from chapter"
  }
]`;

    const response = await aiService.callAI(prompt, 'structured', systemContext);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const beats = JSON.parse(jsonMatch[0]);
      return {
        beats: beats.map(b => ({
          ...b,
          position: b.position || 0,
          intensity: b.intensity || 5
        })),
        arc: _calculateEmotionalArc(beats)
      };
    }
    return { beats: [], arc: [] };
  } catch (error) {
    console.error('Error tracking emotional beats:', error);
    return { beats: [], arc: [] };
  }
};

const _calculateEmotionalArc = (beats) => {
  if (!beats || beats.length === 0) return [];
  
  // Simple arc calculation - track intensity over position
  return beats.map(b => ({
    x: b.position,
    y: b.intensity,
    emotion: b.emotion
  }));
};

/**
 * Feature 5: Character Voice Consistency Checker
 */
export const checkVoiceConsistency = async (dialogueText, characterName, chapterId, bookId) => {
  try {
    const voiceProfile = await smartContextEngine.getCharacterVoice(characterName);
    if (!voiceProfile) {
      return { issues: [], suggestions: [] };
    }

    const systemContext = await _getEnhancementContext(dialogueText, bookId, chapterId, 'dialogue');

    const prompt = `Check if this dialogue matches the character's voice profile.

DIALOGUE:
"""
${dialogueText}
"""

CHARACTER: ${characterName}
VOICE PROFILE:
- Speech Patterns: ${voiceProfile.speechPatterns || 'Not specified'}
- Vocabulary: ${voiceProfile.vocabularyChoices?.join(', ') || 'Not specified'}
- Avoid: ${voiceProfile.vocabularyAvoid?.join(', ') || 'None'}
- Quirks: ${voiceProfile.quirks?.join(', ') || 'None'}

Return JSON:
{
  "matches": true/false,
  "issues": ["Issue 1", "Issue 2"],
  "suggestedDialogue": "Corrected dialogue"
}`;

    const response = await aiService.callAI(prompt, 'structured', systemContext);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { matches: true, issues: [], suggestedDialogue: dialogueText };
  } catch (error) {
    console.error('Error checking voice consistency:', error);
    return { matches: true, issues: [], suggestedDialogue: dialogueText };
  }
};

/**
 * Feature 6: Scene Transition Generator
 */
export const generateSceneTransition = async (endOfScene, startOfNextScene, transitionStyle, chapterId, bookId) => {
  try {
    const systemContext = await _getEnhancementContext(endOfScene + '\n\n' + startOfNextScene, bookId, chapterId, 'integrate');

    const styleOptions = {
      abrupt: 'Abrupt cut - immediate shift',
      smooth: 'Smooth transition - natural flow',
      time_skip: 'Time skip - indicate passage of time',
      location_change: 'Location transition - moving between places',
      pov_shift: 'POV shift - change perspective'
    };

    const prompt = `Generate a transition paragraph between these two scenes.

END OF SCENE:
"""
${endOfScene.slice(-500)}
"""

START OF NEXT SCENE:
"""
${startOfNextScene.slice(0, 500)}
"""

TRANSITION STYLE: ${styleOptions[transitionStyle] || 'smooth'}

Return ONLY the transition paragraph (no explanations):`;

    const response = await aiService.callAI(prompt, 'creative', systemContext);
    return response.trim();
  } catch (error) {
    console.error('Error generating transition:', error);
    return '';
  }
};

/**
 * Feature 7: Conflict Escalator
 */
export const escalateConflict = async (conflictText, chapterId, bookId) => {
  try {
    const systemContext = await _getEnhancementContext(conflictText, bookId, chapterId, 'scene');

    const prompt = `This text contains a conflict. Generate 3 options to escalate the tension and stakes.

CONFLICT TEXT:
"""
${conflictText}
"""

Return JSON:
{
  "options": [
    {
      "description": "Escalation approach",
      "text": "Escalated version of the conflict",
      "intensity": 1-10
    }
  ]
}`;

    const response = await aiService.callAI(prompt, 'structured', systemContext);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { options: [] };
  } catch (error) {
    console.error('Error escalating conflict:', error);
    return { options: [] };
  }
};

/**
 * Feature 8: Sensory Detail Injector
 */
export const injectSensoryDetails = async (paragraphText, senses, chapterId, bookId) => {
  try {
    const systemContext = await _getEnhancementContext(paragraphText, bookId, chapterId, 'expand');

    const senseList = Array.isArray(senses) ? senses.join(', ') : senses || 'sight, sound, smell, touch, taste';

    const prompt = `Enhance this paragraph by adding sensory details for: ${senseList}

PARAGRAPH:
"""
${paragraphText}
"""

Return the enhanced paragraph with natural sensory details woven in (no explanations):`;

    const response = await aiService.callAI(prompt, 'creative', systemContext);
    return response.trim();
  } catch (error) {
    console.error('Error injecting sensory details:', error);
    return paragraphText;
  }
};

/**
 * Feature 9: Foreshadowing Suggester
 */
export const suggestForeshadowing = async (chapterText, futureChapters, chapterId, bookId) => {
  try {
    const systemContext = await _getEnhancementContext(chapterText, bookId, chapterId, 'planning');

    const futureContext = futureChapters
      .slice(0, 3)
      .map(c => `Chapter ${c.number}: ${c.title || 'Untitled'}`)
      .join('\n');

    const prompt = `Analyze this chapter for opportunities to add foreshadowing for future events.

CURRENT CHAPTER:
"""
${chapterText.slice(0, 5000)}
"""

FUTURE CHAPTERS:
${futureContext}

Return JSON:
{
  "opportunities": [
    {
      "position": "beginning|middle|end",
      "description": "What to foreshadow",
      "suggestedText": "Foreshadowing text to add",
      "linksTo": "Future chapter/event"
    }
  ]
}`;

    const response = await aiService.callAI(prompt, 'structured', systemContext);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { opportunities: [] };
  } catch (error) {
    console.error('Error suggesting foreshadowing:', error);
    return { opportunities: [] };
  }
};

/**
 * Feature 10: Chapter Summary Generator
 */
export const generateChapterSummary = async (chapterText, chapterId, bookId, chapterTitle) => {
  try {
    const systemContext = await _getEnhancementContext(chapterText, bookId, chapterId, 'planning');

    const prompt = `Generate a concise chapter summary (2-3 sentences) covering:
- Key events
- Character appearances
- Important item/skill acquisitions
- Significant plot developments

CHAPTER: ${chapterTitle || 'Untitled'}
CONTENT:
"""
${chapterText.slice(0, 10000)}
"""

Return ONLY the summary text (no JSON, no explanations):`;

    const response = await aiService.callAI(prompt, 'creative', systemContext);
    
    // Also extract key data
    const events = await chapterDataExtractionService.extractEventsFromChapter(
      chapterText,
      chapterId,
      bookId,
      []
    );

    return {
      summary: response.trim(),
      events: events.length,
      characters: [...new Set(events.flatMap(e => e.actors || []))].length,
      items: events.filter(e => e.type === 'item_event').length,
      skills: events.filter(e => e.type === 'skill_event').length
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    return { summary: '', events: 0, characters: 0, items: 0, skills: 0 };
  }
};

// Export default object with all services
export default {
  checkContinuity,
  enhanceDialogue,
  analyzePacing,
  trackEmotionalBeats,
  checkVoiceConsistency,
  generateSceneTransition,
  escalateConflict,
  injectSensoryDetails,
  suggestForeshadowing,
  generateChapterSummary
};

/**
 * Entity Interjection Service
 * Generates text that naturally interjects entities (actors, items, skills, etc.) into existing paragraphs
 * Blends user-selected mood with surrounding writing style
 */

import aiService from './aiService';
import smartContextEngine from './smartContextEngine';
import db from './database';
import storyBrain from './storyBrain';
import { LW_AI_TASK } from './aiTaskIds';

class EntityInterjectionService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Interject multiple entities into selected text (NEW - supports multi-entity)
   * @param {Array} entities - Array of entity objects with {type, name, description, ...}
   * @param {string} selectedText - Selected paragraph text
   * @param {string} chapterContext - Full chapter context
   * @param {Object} moodSettings - Mood settings (from mood sliders)
   * @param {string} moodPreset - Quick mood preset (optional)
   * @param {string} customPrompt - Custom user prompt to guide AI (optional)
   * @param {number} chapterId - Chapter ID
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Generated interjection options
   */
  async interjectEntities(entities, selectedText, chapterContext, moodSettings, moodPreset, customPrompt, chapterId, bookId) {
    try {
      // Get style context
      const styleContext = await smartContextEngine.buildAIContext({
        text: chapterContext,
        chapterId,
        bookId,
        includeFullChapter: true,
        moodSettings,
        moodPreset
      });

      // Build prompt for multi-entity interjection
      const prompt = this._buildMultiEntityInterjectionPrompt(
        entities,
        selectedText,
        chapterContext,
        moodSettings,
        moodPreset,
        customPrompt,
        styleContext
      );

      let proseSystem = '';
      try {
        const { systemContext } = await storyBrain.getContext({
          text: chapterContext || '',
          bookId,
          chapterId,
          action: 'integrate',
        });
        const craft = storyBrain.getCraftDirective('integrate');
        proseSystem = [craft, systemContext].filter(Boolean).join('\n\n');
      } catch (_) { /* optional */ }

      const response = await aiService.callAI(prompt, LW_AI_TASK.DRAFT, proseSystem);

      const options = await this.generateInterjectionOptions(
        selectedText,
        entities,
        chapterContext,
        moodSettings,
        styleContext,
        response,
        bookId,
        chapterId
      );

      return {
        generatedText: response,
        options,
        originalText: selectedText
      };
    } catch (error) {
      console.error('Error interjecting entities:', error);
      throw error;
    }
  }

  /**
   * Interject an entity into selected text (LEGACY - single entity)
   * @param {string} entityType - 'actor', 'item', 'skill', 'location', 'event'
   * @param {Object} entityData - Entity data (actor, item, skill, etc.)
   * @param {string} selectedText - Selected paragraph text
   * @param {string} chapterContext - Full chapter context
   * @param {Object} moodSettings - Mood settings (from mood sliders)
   * @param {string} moodPreset - Quick mood preset (optional)
   * @param {number} chapterId - Chapter ID
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Generated interjection options
   */
  async interjectEntity(entityType, entityData, selectedText, chapterContext, moodSettings, moodPreset, chapterId, bookId) {
    // Convert single entity to array format for compatibility
    return this.interjectEntities(
      [{ ...entityData, type: entityType }],
      selectedText,
      chapterContext,
      moodSettings,
      moodPreset,
      '', // No custom prompt for legacy method
      chapterId,
      bookId
    );
  }

  /**
   * Build AI prompt for multi-entity interjection
   */
  _buildMultiEntityInterjectionPrompt(entities, selectedText, chapterContext, moodSettings, moodPreset, customPrompt, styleContext) {
    // Group entities by type
    const entitiesByType = {};
    entities.forEach(entity => {
      const type = entity.type || 'actor';
      if (!entitiesByType[type]) entitiesByType[type] = [];
      entitiesByType[type].push(entity);
    });

    // Build entity descriptions
    const entityDescriptions = [];
    Object.entries(entitiesByType).forEach(([type, entityList]) => {
      entityList.forEach(entity => {
        const name = entity.name || 'the entity';
        let desc = `- ${type.charAt(0).toUpperCase() + type.slice(1)}: ${name}`;
        if (entity.description) desc += ` (${entity.description})`;
        if (entity.role) desc += ` - Role: ${entity.role}`;
        if (entity.class) desc += ` - Class: ${entity.class}`;
        entityDescriptions.push(desc);
      });
    });

    const entityNames = entities.map(e => e.name || 'entity').join(', ');
    const entityList = entityDescriptions.join('\n');

    // Build mood description
    const moodDesc = this._buildMoodDescription(moodSettings, moodPreset);

    // Get surrounding context
    const contextWindow = this._extractContextWindow(selectedText, chapterContext);

    // Build the prompt
    let prompt = `${styleContext}

=== YOUR TASK ===
Interject the following entities into the selected paragraph: ${entityNames}
The text should feel natural and seamless, as if these entities were always meant to be there.

SELECTED PARAGRAPH (where to interject):
"""
${selectedText}
"""

SURROUNDING CONTEXT:
"""
${contextWindow}
"""

ENTITIES TO INTERJECT:
${entityList}

MOOD REQUIREMENTS:
${moodDesc}`;

    // Add custom prompt if provided
    if (customPrompt && customPrompt.trim().length > 0) {
      prompt += `

=== CUSTOM INSTRUCTIONS ===
${customPrompt}

IMPORTANT: Follow these custom instructions while interjecting the entities.`;
    }

    prompt += `

=== CRITICAL STYLE REQUIREMENTS (PRIORITY #1) ===
- Match the writing style from the style profile and references above EXACTLY
- Use the tone, humor style, and voice patterns shown in the examples
- Be witty, sarcastic, and emotionally hard-hitting as specified in the style profile
- Do NOT write generic or bland prose - match the unique voice described above
- If style examples are provided, study them carefully and match that exact voice
- The style profile is your primary reference - follow it precisely

=== CRITICAL REQUIREMENTS ===
1. **STYLE MATCHING IS PRIORITY #1** - Match the style profile EXACTLY before anything else
2. Blend the selected mood with the surrounding writing style (from style profile)
3. Integrate ${entityNames} naturally - don't force ${entities.length > 1 ? 'them' : 'it'}
4. Match the exact writing voice from the style context and examples
5. Maintain the flow and rhythm of the existing text
6. DO NOT repeat the original selected text - create NEW text that incorporates the entities
7. DO NOT include the original paragraph in your response - only write the new interjected content
8. If replacing: write a complete replacement paragraph that includes the entities
9. If inserting: write ONLY the new paragraph to insert (do not repeat the original)
${customPrompt ? '10. Follow the custom instructions provided above' : ''}

CRITICAL: Return ONLY the new interjected text. Do NOT repeat or include the original selected paragraph. Do NOT include any explanations or JSON formatting.`;

    return prompt;
  }

  /**
   * Build AI prompt for entity interjection (LEGACY - single entity)
   */
  _buildInterjectionPrompt(entityType, entityData, selectedText, chapterContext, moodSettings, moodPreset, styleContext) {
    const entity = entityData.entity || entityData;
    const entityName = entity.name || entityData.name || 'the entity';
    
    // Build mood description
    const moodDesc = this._buildMoodDescription(moodSettings, moodPreset);

    // Get surrounding context (paragraphs before and after)
    const contextWindow = this._extractContextWindow(selectedText, chapterContext);

    return `${styleContext}

=== YOUR TASK ===
Interject ${entityName} (a ${entityType}) into the selected paragraph. The text should feel natural and seamless, as if ${entityName} was always meant to be there.

SELECTED PARAGRAPH (where to interject):
"""
${selectedText}
"""

SURROUNDING CONTEXT:
"""
${contextWindow}
"""

ENTITY TO INTERJECT:
- Type: ${entityType}
- Name: ${entityName}
${entity.description ? `- Description: ${entity.description}` : ''}
${entity.role ? `- Role: ${entity.role}` : ''}
${entity.class ? `- Class: ${entity.class}` : ''}

MOOD REQUIREMENTS:
${moodDesc}

=== CRITICAL STYLE REQUIREMENTS (PRIORITY #1) ===
- Match the writing style from the style profile and references above EXACTLY
- Use the tone, humor style, and voice patterns shown in the examples
- Be witty, sarcastic, and emotionally hard-hitting as specified in the style profile
- Do NOT write generic or bland prose - match the unique voice described above
- If style examples are provided, study them carefully and match that exact voice
- The style profile is your primary reference - follow it precisely

=== CRITICAL REQUIREMENTS ===
1. **STYLE MATCHING IS PRIORITY #1** - Match the style profile EXACTLY before anything else
2. Blend the selected mood with the surrounding writing style (from style profile)
3. Integrate ${entityName} naturally - don't force it
4. Match the exact writing voice from the style context and examples
5. Maintain the flow and rhythm of the existing text
6. DO NOT repeat the original selected text - create NEW text that incorporates the entity
7. DO NOT include the original paragraph in your response - only write the new interjected content
8. If replacing: write a complete replacement paragraph that includes the entity
9. If inserting: write ONLY the new paragraph to insert (do not repeat the original)

CRITICAL: Return ONLY the new interjected text. Do NOT repeat or include the original selected paragraph. Do NOT include any explanations or JSON formatting.`;
  }

  /**
   * Build mood description from settings
   */
  _buildMoodDescription(moodSettings, moodPreset) {
    if (moodPreset) {
      const presetDescriptions = {
        comedy: 'FUNNY and ABSURD - use wit, sarcasm, and comedic timing',
        horror: 'HORROR and DREAD - unsettling, ominous, dark',
        tense: 'HIGH TENSION - urgent, anxious, on-edge',
        relaxed: 'RELAXED - calm, measured, peaceful',
        fast: 'FAST-PACED - snappy, quick, rapid-fire',
        slow: 'SLOW - contemplative, measured, detailed',
        rich: 'RICH DETAIL - sensory, immersive, vivid',
        sparse: 'SPARSE - minimal, essential only',
        intense: 'EMOTIONALLY INTENSE - charged, impactful',
        detached: 'DETACHED - clinical, unemotional, formal',
        dark: 'DARK - bleak, heavy, ominous',
        light: 'LIGHT - bright, optimistic',
        absurd: 'ABSURDIST - surreal, ridiculous, over-the-top',
        grounded: 'GROUNDED - realistic, believable',
        formal: 'FORMAL - proper, structured, dignified',
        casual: 'CASUAL - conversational, relaxed'
      };
      return presetDescriptions[moodPreset] || 'Balanced tone';
    }

    if (!moodSettings) return 'Match surrounding style';

    const descriptions = [];
    if (moodSettings.comedy_horror < 40) descriptions.push('FUNNY and ABSURD');
    else if (moodSettings.comedy_horror > 60) descriptions.push('HORROR and DREAD');
    if (moodSettings.tension > 70) descriptions.push('HIGH TENSION');
    else if (moodSettings.tension < 30) descriptions.push('RELAXED');
    if (moodSettings.pacing > 70) descriptions.push('FAST-PACED');
    else if (moodSettings.pacing < 30) descriptions.push('SLOW');
    if (moodSettings.detail > 70) descriptions.push('RICH DETAIL');
    else if (moodSettings.detail < 30) descriptions.push('SPARSE');

    return descriptions.length > 0 
      ? descriptions.join(', ')
      : 'Match surrounding style';
  }

  /**
   * Extract context window around selected text
   */
  _extractContextWindow(selectedText, chapterContext) {
    if (!chapterContext) return '';

    const selectedIndex = chapterContext.indexOf(selectedText);
    if (selectedIndex === -1) {
      // Selected text not found, return last 2000 chars
      return chapterContext.slice(-2000);
    }

    // Get 1000 chars before and after
    const start = Math.max(0, selectedIndex - 1000);
    const end = Math.min(chapterContext.length, selectedIndex + selectedText.length + 1000);
    
    return chapterContext.slice(start, end);
  }

  /**
   * Generate multiple interjection options with different placements
   * @param {string} selectedText - Selected paragraph
   * @param {Object} entityData - Entity to interject
   * @param {string} chapterContext - Full chapter context
   * @param {Object} moodSettings - Mood settings
   * @param {string} styleContext - Style context
   * @param {string} generatedText - AI-generated text
   * @param {number|string|null} bookId
   * @param {number|string|null} chapterId
   * @returns {Promise<Array>} Array of placement options
   */
  async generateInterjectionOptions(selectedText, entityData, chapterContext, moodSettings, styleContext, generatedText, bookId = null, chapterId = null) {
    // Handle both single entity (legacy) and multi-entity (new)
    const entities = Array.isArray(entityData) ? entityData : [entityData];
    const entityNames = entities.map(e => (e.entity || e).name || e.name || 'entity').join(', ');
    const entityName = entities.length === 1 ? entityNames : 'the entities';

    // Clean the generated text - remove any repetition of original text
    let cleanGeneratedText = generatedText.trim();
    
    // Remove any instances where the original selected text appears in the generated text
    // This prevents the AI from repeating the original paragraph
    if (cleanGeneratedText.includes(selectedText.trim())) {
      // Try to remove the original text if it appears verbatim
      cleanGeneratedText = cleanGeneratedText.replace(selectedText.trim(), '').trim();
      // Clean up any double newlines or spacing
      cleanGeneratedText = cleanGeneratedText.replace(/\n{3,}/g, '\n\n').trim();
    }

    // Option 1: Replace selected text
    const replaceOption = {
      type: 'replace',
      label: 'Replace Selected Text',
      description: 'Replace the selected paragraph with new text including the entities',
      text: cleanGeneratedText,
      preview: cleanGeneratedText
    };

    // Option 2: Insert before
    const beforeOption = {
      type: 'insert_before',
      label: 'Insert Before',
      description: 'Insert new paragraph before the selection',
      text: cleanGeneratedText,
      preview: `${cleanGeneratedText}\n\n${selectedText}`
    };

    // Option 3: Insert after
    const afterOption = {
      type: 'insert_after',
      label: 'Insert After',
      description: 'Insert new paragraph after the selection',
      text: cleanGeneratedText,
      preview: `${selectedText}\n\n${cleanGeneratedText}`
    };

    // Option 4: Blend into existing (modify selected text to include entities)
    try {
      const blendPrompt = `${styleContext}

Modify this paragraph to naturally include ${entityNames}. Weave ${entityNames} into the existing text naturally, maintaining the original structure and flow.

Original paragraph:
"""
${selectedText}
"""

CRITICAL REQUIREMENTS:
1. Keep the original paragraph structure and most of the original wording
2. Naturally integrate ${entityNames} into the existing sentences
3. Do NOT repeat the paragraph - return ONLY the modified version
4. Maintain the exact writing style and tone
5. Make it feel like ${entityNames} ${entities.length > 1 ? 'were' : 'was'} always part of this paragraph

Return ONLY the modified paragraph with ${entityNames} naturally integrated (no explanations, no JSON):`;

      let blendSystem = '';
      if (bookId != null && chapterId != null) {
        try {
          const { systemContext } = await storyBrain.getContext({
            text: chapterContext || '',
            bookId,
            chapterId,
            action: 'integrate',
          });
          blendSystem = [storyBrain.getCraftDirective('integrate'), systemContext].filter(Boolean).join('\n\n');
        } catch (_) { /* optional */ }
      }

      const blendedText = await aiService.callAI(blendPrompt, LW_AI_TASK.DRAFT, blendSystem);
      
      // Clean the blended text
      let cleanBlendedText = blendedText.trim();
      
      // Remove any repetition
      if (cleanBlendedText.includes(selectedText.trim())) {
        // If it contains the original, try to extract just the modified version
        // This is a fallback - ideally the AI shouldn't repeat it
        const parts = cleanBlendedText.split(selectedText.trim());
        if (parts.length > 1) {
          // Take the part that includes the entity integration
          cleanBlendedText = parts.find(p => 
            entityNames.split(', ').some(name => p.includes(name))
          ) || cleanBlendedText;
        }
      }
      
      const blendOption = {
        type: 'blend',
        label: 'Blend Into Existing',
        description: 'Weave the entities into the existing paragraph',
        text: cleanBlendedText,
        preview: cleanBlendedText
      };

      return [replaceOption, beforeOption, afterOption, blendOption];
    } catch (error) {
      console.warn('Error generating blend option:', error);
      return [replaceOption, beforeOption, afterOption];
    }
  }

  /**
   * Blend mood with surrounding style
   * @param {Object} userMood - User-selected mood settings
   * @param {string} surroundingStyle - Style of surrounding text
   * @param {Object} styleProfile - Story style profile
   * @returns {string} Blended mood description
   */
  blendMoodWithStyle(userMood, surroundingStyle, styleProfile) {
    // Analyze surrounding style characteristics
    const styleAnalysis = this._analyzeStyle(surroundingStyle);
    
    // Blend user mood with style
    const blended = {
      comedy_horror: userMood.comedy_horror || styleAnalysis.comedy_horror || 50,
      tension: userMood.tension || styleAnalysis.tension || 50,
      pacing: userMood.pacing || styleAnalysis.pacing || 50,
      detail: userMood.detail || styleAnalysis.detail || 50,
      emotional: userMood.emotional || styleAnalysis.emotional || 50
    };

    return this._buildMoodDescription(blended, null);
  }

  /**
   * Analyze style characteristics from text
   */
  _analyzeStyle(text) {
    // Simple heuristic analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    
    return {
      comedy_horror: 50, // Default
      tension: avgSentenceLength < 10 ? 60 : 40, // Short sentences = more tension
      pacing: avgSentenceLength < 8 ? 70 : 40, // Very short = fast pacing
      detail: text.split(',').length > sentences.length ? 70 : 40, // Many commas = more detail
      emotional: (text.match(/feel|emotion|heart|soul|pain|joy/g) || []).length > 2 ? 70 : 40
    };
  }
}

export default new EntityInterjectionService();

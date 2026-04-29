/**
 * Character Enhancement Service
 * AI-powered service for generating complete character profiles from minimal text data
 * Uses story context, world state, and style guide to create rich character details
 */

import aiService from './aiService';
import db from './database';
import smartContextEngine from './smartContextEngine';
import styleReferenceService from './styleReferenceService';

class CharacterEnhancementService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Enhance a character from extracted entity data
   * @param {Object} entityData - Basic character data from extraction
   * @param {string} chapterText - Full chapter text for context
   * @param {Object} worldState - Current world state (actors, items, skills, statRegistry)
   * @param {number} chapterId - Chapter ID
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Enhanced character data with all fields filled
   */
  async enhanceCharacterFromText(entityData, chapterText, worldState, chapterId, bookId) {
    try {
      // Get style context for consistent character creation
      const styleContext = await smartContextEngine.buildAIContext({
        text: chapterText,
        chapterId,
        bookId,
        includeFullChapter: false
      });

      // Get story profile for genre/tone context
      const storyProfile = await smartContextEngine.getFullStoryProfile();

      // Build comprehensive prompt
      const prompt = this._buildEnhancementPrompt(
        entityData,
        chapterText,
        worldState,
        styleContext,
        storyProfile
      );

      // Call AI for enhancement
      const response = await aiService.callAI(prompt, 'structured');

      // Parse and validate response
      const enhanced = this._parseEnhancementResponse(response, entityData, worldState);

      return enhanced;
    } catch (error) {
      console.error('Error enhancing character:', error);
      // Return basic enhancement with defaults if AI fails
      return this._createDefaultEnhancement(entityData, worldState);
    }
  }

  /**
   * Build the AI prompt for character enhancement
   */
  _buildEnhancementPrompt(entityData, chapterText, worldState, styleContext, storyProfile) {
    const entity = entityData.entity || entityData;
    const existingActors = worldState.actors || [];
    const availableSkills = worldState.skillBank || [];
    const availableItems = worldState.itemBank || [];
    const statRegistry = worldState.statRegistry || [];

    // Extract relevant chapter context (last 2000 chars mentioning the character)
    const characterMentions = this._extractCharacterContext(chapterText, entity.name);
    
    // Get stat registry info
    const statInfo = statRegistry.map(s => `${s.key} (${s.name}): ${s.desc}`).join(', ');

    return `${styleContext}

=== YOUR TASK ===
You are creating a complete character profile for a new character in this story. Use ALL available context to create a rich, detailed character that fits perfectly into this world.

CHARACTER BASIC INFO:
- Name: ${entity.name}
- Role: ${entity.role || 'NPC'}
- Class: ${entity.class || 'Unknown'}
- Description from text: ${entity.description || entity.desc || 'Minimal description'}

CHAPTER CONTEXT (where character appears):
"""
${characterMentions}
"""

EXISTING CHARACTERS (for consistency):
${existingActors.slice(0, 10).map(a => `- ${a.name} (${a.role || 'NPC'}, ${a.class || 'Unknown'})`).join('\n')}

AVAILABLE STATS:
${statInfo || 'STR (Strength), VIT (Vitality), INT (Intelligence), DEX (Dexterity)'}

AVAILABLE SKILLS (examples):
${availableSkills.slice(0, 15).map(s => `- ${s.name} (${s.type})`).join('\n')}

AVAILABLE ITEMS (examples):
${availableItems.slice(0, 15).map(i => `- ${i.name} (${i.rarity || 'Common'})`).join('\n')}

STORY GENRE/TONE:
${storyProfile?.genres?.join(', ') || 'Fantasy'}
${storyProfile?.tone ? `Tone: ${storyProfile.tone}` : ''}
${storyProfile?.comparisons ? `Comparisons: ${storyProfile.comparisons}` : ''}

=== REQUIREMENTS ===

1. STATS: Generate appropriate base stats based on:
   - Character class/role (warrior = high STR/VIT, mage = high INT, rogue = high DEX)
   - What they do in the text (if mentioned)
   - Story context and genre
   - Stat values should be 8-18 range for starting characters
   - Total stat points should be reasonable (40-60 total)

2. SKILLS: Assign 3-5 starting skills based on:
   - Character class/role
   - What they do in the chapter text
   - Skills should match available skills from the skill bank when possible
   - If no matching skills, suggest appropriate skill names that fit the world

3. EQUIPMENT: Assign story-relevant equipment (not random):
   - Based on character class/role
   - Based on what makes sense for the story context
   - Start with 2-4 items (realistic for a new character)
   - Prefer items from available item bank when appropriate
   - Equipment should tell a story (e.g., "worn leather armor" suggests a traveler)

4. BIOGRAPHY: Create a full character profile (1-2 paragraphs):
   - Personality traits
   - Background/motivations
   - Relationships to other characters (if any)
   - Role in the story
   - Physical appearance (if not detailed in text)
   - Use the writing style from the style context above

5. NICKNAMES: Generate 3-5 appropriate nicknames:
   - Based on character traits, appearance, or role
   - Should fit the story tone (witty, dark, etc. as per style)
   - Can be formal, informal, or descriptive

Return JSON in this EXACT format:
{
  "stats": {
    "STR": 12,
    "VIT": 10,
    "INT": 8,
    "DEX": 14
  },
  "skills": [
    {"id": "skill_id_or_name", "name": "Skill Name", "level": 1},
    {"id": "skill_id_or_name", "name": "Skill Name", "level": 1}
  ],
  "equipment": {
    "armour": "item_id_or_name",
    "leftHand": "item_id_or_name"
  },
  "biography": "Full 1-2 paragraph biography...",
  "nicknames": ["Nickname 1", "Nickname 2", "Nickname 3"],
  "appearance": "Physical description if not in text..."
}

IMPORTANT: Match the writing style and tone from the style context. Be consistent with the world and existing characters.`;
  }

  /**
   * Extract context from chapter text mentioning the character
   */
  _extractCharacterContext(chapterText, characterName) {
    if (!chapterText || !characterName) return '';
    
    const nameLower = characterName.toLowerCase();
    const sentences = chapterText.split(/[.!?]+/);
    const relevantSentences = sentences.filter(s => 
      s.toLowerCase().includes(nameLower)
    );
    
    // Get last 2000 chars of relevant context
    const context = relevantSentences.join('. ').slice(-2000);
    return context || chapterText.slice(-1000); // Fallback to last 1000 chars
  }

  /**
   * Parse AI response and validate/enhance with world state
   */
  _parseEnhancementResponse(response, entityData, worldState) {
    try {
      // Try to parse JSON from response
      let parsed;
      if (typeof response === 'string') {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          parsed = JSON.parse(response);
        }
      } else {
        parsed = response;
      }

      // Validate and enhance with world state
      const enhanced = {
        stats: this._validateStats(parsed.stats || {}, worldState.statRegistry),
        skills: this._validateSkills(parsed.skills || [], worldState.skillBank),
        equipment: this._validateEquipment(parsed.equipment || {}, worldState.itemBank),
        biography: parsed.biography || entityData.entity?.description || '',
        nicknames: Array.isArray(parsed.nicknames) ? parsed.nicknames : [],
        appearance: parsed.appearance || ''
      };

      return enhanced;
    } catch (error) {
      console.error('Error parsing enhancement response:', error);
      return this._createDefaultEnhancement(entityData, worldState);
    }
  }

  /**
   * Validate and normalize stats
   */
  _validateStats(stats, statRegistry) {
    const validated = {};
    const defaultStats = ['STR', 'VIT', 'INT', 'DEX'];
    
    // Use stat registry if available, otherwise use defaults
    const statKeys = statRegistry.length > 0 
      ? statRegistry.map(s => s.key)
      : defaultStats;

    for (const key of statKeys) {
      const value = stats[key];
      if (typeof value === 'number' && value >= 1 && value <= 25) {
        validated[key] = value;
      } else {
        // Default based on stat type
        validated[key] = 10;
      }
    }

    return validated;
  }

  /**
   * Validate and match skills to existing skill bank
   */
  _validateSkills(skills, skillBank) {
    if (!Array.isArray(skills)) return [];

    return skills.map(skill => {
      // Try to find matching skill in bank
      const matched = skillBank.find(s => 
        s.name.toLowerCase() === (skill.name || skill).toLowerCase() ||
        s.id === skill.id
      );

      if (matched) {
        return {
          id: matched.id,
          name: matched.name,
          level: typeof skill.level === 'number' ? skill.level : 1
        };
      }

      // Return skill name if not found (will be created later)
      return {
        id: skill.id || `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: skill.name || skill,
        level: typeof skill.level === 'number' ? skill.level : 1
      };
    }).slice(0, 5); // Limit to 5 skills
  }

  /**
   * Validate and match equipment to existing item bank
   */
  _validateEquipment(equipment, itemBank) {
    if (!equipment || typeof equipment !== 'object') return {};

    const validated = {};
    const equipmentSlots = ['helm', 'cape', 'amulet', 'armour', 'gloves', 'belt', 'boots', 'leftHand', 'rightHand'];

    for (const slot of equipmentSlots) {
      const itemRef = equipment[slot];
      if (!itemRef) continue;

      // Try to find matching item in bank
      const matched = itemBank.find(i => 
        i.name.toLowerCase() === String(itemRef).toLowerCase() ||
        i.id === itemRef
      );

      if (matched) {
        validated[slot] = matched.id;
      } else {
        // Store name for later item creation
        validated[slot] = itemRef;
      }
    }

    return validated;
  }

  /**
   * Create default enhancement if AI fails
   */
  _createDefaultEnhancement(entityData, worldState) {
    const entity = entityData.entity || entityData;
    const statRegistry = worldState.statRegistry || [];
    const defaultStats = statRegistry.length > 0
      ? statRegistry.reduce((acc, stat) => {
          acc[stat.key] = 10; // Default value
          return acc;
        }, {})
      : { STR: 10, VIT: 10, INT: 10, DEX: 10 };

    return {
      stats: defaultStats,
      skills: [],
      equipment: {},
      biography: entity.description || entity.desc || `A ${entity.role || 'character'} in the story.`,
      nicknames: [],
      appearance: ''
    };
  }

  /**
   * Generate character stats based on class/role
   * @param {string} characterClass - Character class
   * @param {string} role - Character role
   * @param {string} textContext - Context from chapter text
   * @param {Array} statRegistry - Available stats
   * @returns {Promise<Object>} Generated stats
   */
  async generateCharacterStats(characterClass, role, textContext, statRegistry) {
    const classLower = (characterClass || '').toLowerCase();
    const roleLower = (role || '').toLowerCase();

    const stats = {};
    const statKeys = statRegistry.length > 0
      ? statRegistry.map(s => s.key)
      : ['STR', 'VIT', 'INT', 'DEX'];

    // Class-based stat distribution
    if (classLower.includes('warrior') || classLower.includes('fighter') || classLower.includes('knight')) {
      statKeys.forEach(key => {
        if (key === 'STR' || key === 'VIT') stats[key] = 14;
        else if (key === 'DEX') stats[key] = 12;
        else stats[key] = 8;
      });
    } else if (classLower.includes('mage') || classLower.includes('wizard') || classLower.includes('sorcerer')) {
      statKeys.forEach(key => {
        if (key === 'INT') stats[key] = 16;
        else if (key === 'VIT') stats[key] = 9;
        else stats[key] = 10;
      });
    } else if (classLower.includes('rogue') || classLower.includes('thief') || classLower.includes('assassin')) {
      statKeys.forEach(key => {
        if (key === 'DEX') stats[key] = 15;
        else if (key === 'STR') stats[key] = 11;
        else stats[key] = 9;
      });
    } else {
      // Balanced default
      statKeys.forEach(key => {
        stats[key] = 10;
      });
    }

    return stats;
  }

  /**
   * Generate character skills based on class/role
   * @param {string} characterClass - Character class
   * @param {string} role - Character role
   * @param {Array} skillBank - Available skills
   * @param {Object} worldState - World state
   * @returns {Promise<Array>} Generated skills
   */
  async generateCharacterSkills(characterClass, role, skillBank, worldState) {
    const classLower = (characterClass || '').toLowerCase();
    const roleLower = (role || '').toLowerCase();

    // Filter skills by class/type
    let relevantSkills = skillBank || [];

    if (classLower.includes('warrior') || classLower.includes('fighter')) {
      relevantSkills = skillBank.filter(s => 
        s.type === 'Combat' || s.name.toLowerCase().includes('combat') || s.name.toLowerCase().includes('weapon')
      );
    } else if (classLower.includes('mage') || classLower.includes('wizard')) {
      relevantSkills = skillBank.filter(s => 
        s.type === 'Magic' || s.name.toLowerCase().includes('magic') || s.name.toLowerCase().includes('spell')
      );
    } else if (classLower.includes('rogue') || classLower.includes('thief')) {
      relevantSkills = skillBank.filter(s => 
        s.type === 'Utility' || s.name.toLowerCase().includes('stealth') || s.name.toLowerCase().includes('lock')
      );
    }

    // Select 3-5 skills
    const selected = relevantSkills
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, Math.min(5, Math.max(3, relevantSkills.length)))
      .map(skill => ({
        id: skill.id,
        name: skill.name,
        level: 1
      }));

    return selected;
  }

  /**
   * Generate character equipment based on class/role and story context
   * @param {string} characterClass - Character class
   * @param {string} role - Character role
   * @param {Array} itemBank - Available items
   * @param {string} storyContext - Story context
   * @returns {Promise<Object>} Generated equipment
   */
  async generateCharacterEquipment(characterClass, role, itemBank, storyContext) {
    const classLower = (characterClass || '').toLowerCase();
    const equipment = {};

    // Filter items by class/rarity (new characters get common items)
    const commonItems = (itemBank || []).filter(i => 
      i.rarity === 'Common' || !i.rarity
    );

    if (classLower.includes('warrior') || classLower.includes('fighter')) {
      const armor = commonItems.find(i => 
        i.type?.toLowerCase().includes('armor') || i.name.toLowerCase().includes('armor')
      );
      const weapon = commonItems.find(i => 
        i.type?.toLowerCase().includes('weapon') || i.name.toLowerCase().includes('sword') || i.name.toLowerCase().includes('axe')
      );
      if (armor) equipment.armour = armor.id;
      if (weapon) equipment.rightHand = weapon.id;
    } else if (classLower.includes('mage') || classLower.includes('wizard')) {
      const staff = commonItems.find(i => 
        i.name.toLowerCase().includes('staff') || i.name.toLowerCase().includes('wand')
      );
      const robe = commonItems.find(i => 
        i.name.toLowerCase().includes('robe') || i.name.toLowerCase().includes('cloak')
      );
      if (staff) equipment.rightHand = staff.id;
      if (robe) equipment.armour = robe.id;
    } else if (classLower.includes('rogue') || classLower.includes('thief')) {
      const dagger = commonItems.find(i => 
        i.name.toLowerCase().includes('dagger') || i.name.toLowerCase().includes('knife')
      );
      const leather = commonItems.find(i => 
        i.name.toLowerCase().includes('leather')
      );
      if (dagger) equipment.leftHand = dagger.id;
      if (leather) equipment.armour = leather.id;
    }

    return equipment;
  }

  /**
   * Generate character biography
   * @param {string} name - Character name
   * @param {string} role - Character role
   * @param {string} description - Basic description
   * @param {Object} fullContext - Full context object
   * @returns {Promise<string>} Generated biography
   */
  async generateCharacterBiography(name, role, description, fullContext) {
    const { styleContext, storyProfile, chapterText } = fullContext;

    const prompt = `${styleContext}

Create a full character biography (1-2 paragraphs) for:
- Name: ${name}
- Role: ${role || 'NPC'}
- Basic description: ${description || 'Not specified'}

Chapter context:
"""
${chapterText?.slice(-1000) || ''}
"""

Generate a rich biography that includes:
- Personality traits
- Background/motivations
- Physical appearance (if not detailed)
- Role in the story
- Relationships to other characters (if any)

Match the writing style and tone from the style context. Return only the biography text (no JSON, no explanations).`;

    try {
      const response = await aiService.callAI(prompt, 'creative');
      return response.trim();
    } catch (error) {
      console.error('Error generating biography:', error);
      return description || `A ${role || 'character'} in the story.`;
    }
  }

  /**
   * Generate nicknames for a character
   * @param {string} name - Character name
   * @param {Object} personality - Personality traits (from biography)
   * @param {string} storyTone - Story tone
   * @returns {Promise<Array>} Generated nicknames
   */
  async generateNicknames(name, personality, storyTone) {
    const prompt = `Generate 3-5 appropriate nicknames for a character named "${name}".

Personality/context: ${personality || 'Not specified'}
Story tone: ${storyTone || 'General'}

Nicknames should:
- Fit the character's personality or appearance
- Match the story tone (witty, dark, formal, etc.)
- Be varied (some formal, some informal, some descriptive)

Return JSON array: ["Nickname 1", "Nickname 2", "Nickname 3"]`;

    try {
      const response = await aiService.callAI(prompt, 'structured');
      let parsed;
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(response);
        }
      } else {
        parsed = response;
      }

      return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    } catch (error) {
      console.error('Error generating nicknames:', error);
      return [];
    }
  }
}

export default new CharacterEnhancementService();

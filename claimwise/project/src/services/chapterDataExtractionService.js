import aiService from './aiService';
import db from './database';
import contextEngine from './contextEngine';

/**
 * Chapter Data Extraction Service
 * Centralized service for extracting various data types from chapter content
 */
class ChapterDataExtractionService {
  constructor() {
    this.cache = new Map();
    this.chunkSize = 5000;
    this.chunkOverlap = 500;
  }

  getTextChunks(chapterText) {
    const text = chapterText || '';
    if (text.length <= this.chunkSize) {
      return [{ index: 0, text }];
    }

    const chunks = [];
    let start = 0;
    let index = 0;
    while (start < text.length) {
      const end = Math.min(text.length, start + this.chunkSize);
      chunks.push({ index, text: text.slice(start, end) });
      if (end >= text.length) break;
      start = end - this.chunkOverlap;
      index += 1;
    }
    return chunks;
  }

  /**
   * Extract plot beats from chapter text
   * @param {string} chapterText - The chapter content
   * @param {number} chapterNumber - Chapter number
   * @param {number} bookId - Book ID
   * @returns {Promise<Array>} Array of extracted beats
   */
  async extractBeatsFromChapter(chapterText, chapterNumber, bookId) {
    if (!chapterText || chapterText.trim().length < 50) {
      return [];
    }

    try {
      const chunks = this.getTextChunks(chapterText);
      const merged = [];
      const seen = new Set();
      for (const chunk of chunks) {
        const prompt = `Analyze the following chapter text chunk and extract plot beats (significant story events, conflicts, resolutions, character moments).

Chapter ${chapterNumber}, Chunk ${chunk.index + 1}/${chunks.length}:
${chunk.text}

Return a JSON array of plot beats. Each beat should have:
- beat: A brief description of what happens
- purpose: Why this beat matters to the story
- characters: Array of character names involved
- emotionalTone: The emotional tone
- importance: 1-10 scale
- confidence: 0-1 confidence score`;
        const response = await aiService.callAI(prompt, 'structured');
        const beats = this._parseBeatsResponse(response, chapterNumber, bookId).map(beat => ({
          ...beat,
          confidence: Number(beat.confidence ?? 0.85),
          sourceChunk: chunk.index,
          chunkCount: chunks.length,
          promptVersion: 'beats_chunk_v2'
        }));
        beats.forEach((beat) => {
          const key = `${(beat.beat || '').toLowerCase().trim()}|${beat.targetChapter}`;
          if (!key || seen.has(key)) return;
          seen.add(key);
          merged.push(beat);
        });
      }
      return merged;
    } catch (error) {
      console.error('Error extracting beats from chapter:', error);
      return [];
    }
  }

  /**
   * Extract events from chapter text (stat changes, skill gains, item acquisitions, etc.)
   * @param {string} chapterText - The chapter content
   * @param {number} chapterId - Chapter ID
   * @param {number} bookId - Book ID
   * @param {Array} actors - Available actors
   * @returns {Promise<Array>} Array of timeline events
   */
  async extractEventsFromChapter(chapterText, chapterId, bookId, actors = []) {
    if (!chapterText || chapterText.trim().length < 50) {
      return [];
    }

    try {
      const chunks = this.getTextChunks(chapterText);
      const actorNames = actors.map(a => a.name).join(', ');
      const merged = [];
      const seen = new Set();
      for (const chunk of chunks) {
        const prompt = `Analyze the following chapter text chunk and extract story events.

Chapter text (chunk ${chunk.index + 1}/${chunks.length}):
${chunk.text}

Available characters: ${actorNames || 'None specified'}

Extract events such as:
- Character introductions/appearances
- Stat changes (e.g., "Grimguff gained +2 STR")
- Skill acquisitions (e.g., "Learned Fireball skill")
- Item acquisitions (e.g., "Found Sword of Truth")
- Travel events (e.g., "Traveled from London to Manchester")
- Relationship changes (e.g., "Became friends with Pipkins")

Return JSON array with events. Each event should have:
- title: Brief event title
- description: What happened
- type: One of: character_appearance, stat_change, skill_event, item_event, travel, relationship_change, milestone
- actors: Array of character names involved
- locations: Array of location names (if applicable)
- confidence: 0-1 confidence score

Format: [{"title": "...", "description": "...", "type": "...", "actors": [...], "locations": [...]}]`;

        const response = await aiService.callAI(prompt, 'structured');
        const events = this._parseEventsResponse(response, chapterId, bookId, actors).map(event => ({
          ...event,
          confidence: Number(event.confidence ?? 0.9),
          sourceChunk: chunk.index,
          chunkCount: chunks.length,
          promptVersion: 'events_chunk_v2'
        }));
        events.forEach((event) => {
          const key = `${(event.title || '').toLowerCase().trim()}|${(event.type || '').toLowerCase()}|${chapterId}|${bookId}`;
          if (!key || seen.has(key)) return;
          seen.add(key);
          merged.push(event);
        });
      }
      return merged;
    } catch (error) {
      console.error('Error extracting events from chapter:', error);
      return [];
    }
  }

  /**
   * Extract locations from chapter text
   * @param {string} chapterText - The chapter content
   * @param {number} chapterId - Chapter ID
   * @param {number} bookId - Book ID
   * @returns {Promise<Array>} Array of location objects
   */
  async extractLocationsFromChapter(chapterText, chapterId, bookId) {
    if (!chapterText || chapterText.trim().length < 50) {
      return [];
    }

    try {
      const chunks = this.getTextChunks(chapterText);
      const merged = [];
      const seen = new Set();
      for (const chunk of chunks) {
        const prompt = `Analyze the following chapter text and extract location mentions.

Chapter text (chunk ${chunk.index + 1}/${chunks.length}):
${chunk.text}

Extract all location mentions. For each location, identify:
- name: Location name
- type: city, town, building, landmark, region, etc.
- description: Brief description from context
- isUKCity: true if it's a known UK city/town

Common UK cities: London, Manchester, Birmingham, Liverpool, Leeds, Sheffield, Bristol, Newcastle, Edinburgh, Glasgow, Cardiff, Belfast, Oxford, Cambridge, Brighton, Plymouth, York, Nottingham, Southampton, etc.

Return JSON array: [{"name": "...", "type": "...", "description": "...", "isUKCity": true/false}]`;

        const response = await aiService.callAI(prompt, 'structured');
        const locations = this._parseLocationsResponse(response, chapterId, bookId).map(location => ({
          ...location,
          confidence: Number(location.confidence ?? 0.85),
          sourceChunk: chunk.index,
          chunkCount: chunks.length,
          promptVersion: 'locations_chunk_v2'
        }));
        locations.forEach((location) => {
          const key = `${(location.name || '').toLowerCase().trim()}|${bookId}`;
          if (!key || seen.has(key)) return;
          seen.add(key);
          merged.push(location);
        });
      }
      return merged;
    } catch (error) {
      console.error('Error extracting locations from chapter:', error);
      return [];
    }
  }

  /**
   * Extract entities (actors, items, skills) from chapter text
   * @param {string} chapterText - The chapter content
   * @param {number} chapterId - Chapter ID
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Object with actors, items, skills arrays
   */
  async extractEntitiesFromChapter(chapterText, chapterId, bookId) {
    if (!chapterText || chapterText.trim().length < 50) {
      return { actors: [], items: [], skills: [] };
    }

    try {
      const chunks = this.getTextChunks(chapterText);
      const merged = { actors: [], items: [], skills: [] };
      const seen = new Set();
      for (const chunk of chunks) {
        const prompt = `Analyze the following chapter text and extract story entities.

Chapter text (chunk ${chunk.index + 1}/${chunks.length}):
${chunk.text}

Extract:
1. Characters/Actors mentioned (new or existing)
2. Items mentioned (weapons, equipment, objects)
3. Skills mentioned (abilities, powers, techniques)

For each entity, provide:
- name: Entity name
- type: actor, item, or skill
- description: Brief description from context
- isNew: true if this seems like a new entity introduction

Return JSON: {"actors": [{"name": "...", "description": "...", "isNew": true}], "items": [...], "skills": [...]}`;

        const response = await aiService.callAI(prompt, 'structured');
        const entities = this._parseEntitiesResponse(response);
        ['actors', 'items', 'skills'].forEach((type) => {
          entities[type].forEach((entry) => {
            const key = `${type}|${(entry.name || '').toLowerCase().trim()}`;
            if (!key || seen.has(key)) return;
            seen.add(key);
            merged[type].push({
              ...entry,
              confidence: Number(entry.confidence ?? 0.8),
              sourceChunk: chunk.index,
              chunkCount: chunks.length,
              promptVersion: 'entities_chunk_v2'
            });
          });
        });
      }
      return merged;
    } catch (error) {
      console.error('Error extracting entities from chapter:', error);
      return { actors: [], items: [], skills: [] };
    }
  }

  /**
   * Extract character appearances and changes from chapter
   * @param {string} chapterText - The chapter content
   * @param {number} chapterId - Chapter ID
   * @param {number} bookId - Book ID
   * @param {Array} actors - Available actors
   * @returns {Promise<Object>} Appearance and change data
   */
  async extractCharacterDataFromChapter(chapterText, chapterId, bookId, actors = []) {
    if (!chapterText || chapterText.trim().length < 50) {
      return { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [] };
    }

    try {
      const chunks = this.getTextChunks(chapterText);
      const actorNames = actors.map(a => a.name).join(', ');
      const merged = { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [] };
      const seen = new Set();
      for (const chunk of chunks) {
        const prompt = `Analyze the following chapter text for character data.

Chapter text (chunk ${chunk.index + 1}/${chunks.length}):
${chunk.text}

Available characters: ${actorNames || 'None'}

Extract:
1. Character appearances (who appears in this chapter)
2. Stat changes (e.g., "+2 STR", "level up", "gained VIT")
3. Skill changes - CRITICAL: Only extract skills that are EXPLICITLY GAINED, LEARNED, or IMPROVED in this chapter. 
   DO NOT include skills that are merely mentioned, used, or referenced without being gained/learned/improved.
   - "gained", "learned", "just learned", "discovered", "acquired", "unlocked" = action: "gained", level: 1
   - "improved", "better at", "practiced", "leveled up" = action: "improved", level: 2-3
   - "mastered", "perfected", "expert at", "became expert" = action: "mastered", level: 4-5
   - If a skill is only "used" or "mentioned" without being gained/learned/improved, DO NOT include it
   - For each skill, determine the level based on context:
     * "learned", "just learned", "discovered" = level 1
     * "improved", "better at", "practiced" = level 2-3
     * "mastered", "perfected", "expert at" = level 4-5
     * Default if no context = level 1
4. Relationship changes (how relationships between characters change)

Return JSON:
{
  "appearances": [{"character": "...", "firstMention": true/false}],
  "statChanges": [{"character": "...", "changes": {"STR": +2, "VIT": +1}}],
  "skillChanges": [{"character": "...", "action": "gained/improved/mastered", "skill": "...", "level": 1-5, "context": "..."}],
  "relationshipChanges": [{"character1": "...", "character2": "...", "change": "..."}]
}`;

        const response = await aiService.callAI(prompt, 'structured');
        const data = this._parseCharacterDataResponse(response, chapterId, bookId);
        Object.keys(merged).forEach((type) => {
          (data[type] || []).forEach((entry) => {
            const key = `${type}|${JSON.stringify(entry).toLowerCase()}`;
            if (seen.has(key)) return;
            seen.add(key);
            merged[type].push({
              ...entry,
              confidence: Number(entry.confidence ?? 0.8),
              sourceChunk: chunk.index,
              chunkCount: chunks.length,
              promptVersion: 'character_data_chunk_v2'
            });
          });
        });
      }
      return merged;
    } catch (error) {
      console.error('Error extracting character data from chapter:', error);
      return { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [] };
    }
  }

  // Private helper methods for parsing AI responses

  _parseBeatsResponse(response, chapterNumber, bookId) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const beats = JSON.parse(jsonMatch[0]);
      return beats.map((beat, idx) => ({
        id: `beat_extracted_${Date.now()}_${idx}`,
        beat: beat.beat || '',
        purpose: beat.purpose || '',
        targetChapter: chapterNumber,
        characters: Array.isArray(beat.characters) ? beat.characters : [],
        emotionalTone: beat.emotionalTone || '',
        importance: beat.importance || 5,
        completed: false,
        order: idx + 1,
        createdAt: Date.now(),
        extracted: true
      })).filter(b => b.beat.trim().length > 0);
    } catch (error) {
      console.error('Error parsing beats response:', error);
      return [];
    }
  }

  _parseEventsResponse(response, chapterId, bookId, actors) {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const events = JSON.parse(jsonMatch[0]);
      return events.map((event, idx) => {
        // Find actor IDs from names
        const actorIds = [];
        if (Array.isArray(event.actors)) {
          event.actors.forEach(actorName => {
            const actor = actors.find(a => 
              a.name.toLowerCase() === actorName.toLowerCase() ||
              a.name.toLowerCase().includes(actorName.toLowerCase())
            );
            if (actor) actorIds.push(actor.id);
          });
        }

        return {
          id: `evt_extracted_${Date.now()}_${idx}`,
          title: event.title || 'Untitled Event',
          description: event.description || '',
          type: event.type || 'milestone',
          bookId: bookId,
          chapterId: chapterId,
          actors: event.actors || [],
          actorIds: actorIds,
          locations: Array.isArray(event.locations) ? event.locations : [],
          timestamp: Date.now(),
          createdAt: Date.now(),
          extracted: true
        };
      }).filter(e => e.title.trim().length > 0);
    } catch (error) {
      console.error('Error parsing events response:', error);
      return [];
    }
  }

  _parseLocationsResponse(response, chapterId, bookId) {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const locations = JSON.parse(jsonMatch[0]);
      return locations.map((loc, idx) => ({
        id: `loc_extracted_${Date.now()}_${idx}`,
        name: loc.name || 'Unknown Location',
        type: loc.type || 'location',
        description: loc.description || '',
        isUKCity: loc.isUKCity || false,
        firstAppearance: {
          bookId: bookId,
          chapterId: chapterId
        },
        createdAt: Date.now(),
        extracted: true
      })).filter(l => l.name.trim().length > 0);
    } catch (error) {
      console.error('Error parsing locations response:', error);
      return [];
    }
  }

  _parseEntitiesResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { actors: [], items: [], skills: [] };

      const data = JSON.parse(jsonMatch[0]);
      return {
        actors: Array.isArray(data.actors) ? data.actors : [],
        items: Array.isArray(data.items) ? data.items : [],
        skills: Array.isArray(data.skills) ? data.skills : []
      };
    } catch (error) {
      console.error('Error parsing entities response:', error);
      return { actors: [], items: [], skills: [] };
    }
  }

  _parseCharacterDataResponse(response, chapterId, bookId) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [] };
      }

      // Fix invalid JSON syntax (e.g., {"STR": +5} -> {"STR": 5})
      let jsonString = jsonMatch[0];
      // Replace +number with number (but not in strings)
      jsonString = jsonString.replace(/:\s*\+(\d+)/g, ': $1');
      // Replace -number stays as is (negative numbers are valid)
      
      const data = JSON.parse(jsonString);
      return {
        appearances: Array.isArray(data.appearances) ? data.appearances.map(a => ({
          ...a,
          chapterId,
          bookId,
          timestamp: Date.now()
        })) : [],
        statChanges: Array.isArray(data.statChanges) ? data.statChanges.map(s => ({
          ...s,
          chapterId,
          bookId,
          timestamp: Date.now()
        })) : [],
        skillChanges: Array.isArray(data.skillChanges) ? data.skillChanges.map(s => ({
          ...s,
          chapterId,
          bookId,
          timestamp: Date.now()
        })) : [],
        relationshipChanges: Array.isArray(data.relationshipChanges) ? data.relationshipChanges.map(r => ({
          ...r,
          chapterId,
          bookId,
          timestamp: Date.now()
        })) : []
      };
    } catch (error) {
      console.error('Error parsing character data response:', error);
      return { appearances: [], statChanges: [], skillChanges: [], relationshipChanges: [] };
    }
  }

  /**
   * Fuzzy name matching - finds best actor match for a name/nickname
   * @param {string} name - Name to match
   * @param {Array} actors - Available actors
   * @returns {Object|null} { actor, confidence } or null
   */
  _fuzzyMatchActorName(name, actors) {
    if (!name || !actors || actors.length === 0) return null;

    const nameLower = name.toLowerCase().trim();
    
    // 1. Exact match (case-insensitive)
    let match = actors.find(a => a.name.toLowerCase() === nameLower);
    if (match) return { actor: match, confidence: 1.0 };

    // 2. Nickname match
    for (const actor of actors) {
      if (actor.nicknames && Array.isArray(actor.nicknames)) {
        const nicknameMatch = actor.nicknames.find(n => n.toLowerCase() === nameLower);
        if (nicknameMatch) return { actor, confidence: 0.95 };
      }
    }

    // 3. Partial match (name contains or is contained)
    for (const actor of actors) {
      const actorNameLower = actor.name.toLowerCase();
      if (actorNameLower.includes(nameLower) || nameLower.includes(actorNameLower)) {
        return { actor, confidence: 0.8 };
      }
      
      // Check nicknames for partial match
      if (actor.nicknames && Array.isArray(actor.nicknames)) {
        for (const nickname of actor.nicknames) {
          const nickLower = nickname.toLowerCase();
          if (nickLower.includes(nameLower) || nameLower.includes(nickLower)) {
            return { actor, confidence: 0.75 };
          }
        }
      }
    }

    // 4. Word boundary match (e.g., "Grimguff" matches "Sir Grimguff the Unyielding")
    const nameWords = nameLower.split(/\s+/);
    for (const actor of actors) {
      const actorWords = actor.name.toLowerCase().split(/\s+/);
      const matchingWords = nameWords.filter(w => actorWords.some(aw => aw.includes(w) || w.includes(aw)));
      if (matchingWords.length >= Math.min(2, nameWords.length)) {
        return { actor, confidence: 0.7 };
      }
    }

    return null;
  }

  /**
   * Relationship type mapping with color codes
   */
  _getRelationshipTypeColor(type) {
    const typeMap = {
      'allied': '#22c55e',      // green
      'hostile': '#ef4444',     // red
      'romantic': '#ec4899',    // pink
      'familial': '#a855f7',    // purple
      'mentor': '#3b82f6',      // blue
      'neutral': '#64748b',     // grey
      'business': '#f59e0b',    // orange
      'rival': '#dc2626',       // dark red
      'enemy': '#ef4444',       // red
      'friend': '#22c55e',      // green
      'lover': '#ec4899',       // pink
      'parent': '#a855f7',      // purple
      'sibling': '#a855f7',     // purple
      'teacher': '#3b82f6',     // blue
      'student': '#3b82f6',     // blue
      'partner': '#22c55e',     // green
      'acquaintance': '#64748b' // grey
    };
    return typeMap[type?.toLowerCase()] || '#64748b';
  }

  /**
   * Advanced relationship extraction with hybrid analysis
   * @param {string} chapterText - The chapter content
   * @param {number} chapterId - Chapter ID
   * @param {number} bookId - Book ID
   * @param {Array} actors - Available actors with nicknames
   * @returns {Promise<Array>} Array of relationship objects
   */
  async extractRelationshipsAdvanced(chapterText, chapterId, bookId, actors = []) {
    if (!chapterText || chapterText.trim().length < 50) {
      return [];
    }

    try {
      // Build actor list with nicknames
      const actorList = actors.map(a => {
        const nicknames = a.nicknames && Array.isArray(a.nicknames) ? a.nicknames : [];
        return `${a.name}${nicknames.length > 0 ? ` (also known as: ${nicknames.join(', ')})` : ''}`;
      }).join('\n');

      const prompt = `Analyze this chapter for ALL character relationships. Use a two-pass approach:

PASS 1: Read the entire chapter to understand context and identify all character pairs who interact.

PASS 2: For each pair, analyze their interactions in detail.

For each relationship found, extract:
- character1: Exact name or nickname used in the text
- character2: Exact name or nickname used in the text
- type: One of: allied, hostile, romantic, familial, mentor, rival, neutral, business, enemy, friend, lover, parent, sibling, teacher, student, partner, acquaintance
- strength: 0-100 (0 = no relationship, 100 = strongest possible)
- change: How the relationship changed in this chapter (e.g., "became allies", "betrayed", "grew closer")
- events: Array of specific events/interactions (max 5)
- emotion: Primary emotional tone (trust, betrayal, admiration, fear, love, hate, respect, contempt, etc.)
- context: Background/context of the relationship
- dialogue: Key dialogue quotes that reveal relationship (max 3)
- progression: How it changed (e.g., "enemies → neutral → allies")

Available actors with nicknames:
${actorList || 'None'}

Chapter text:
${chapterText.substring(0, 8000)}

Return JSON array of relationships:
[{
  "character1": "...",
  "character2": "...",
  "type": "allied",
  "strength": 75,
  "change": "...",
  "events": ["..."],
  "emotion": "...",
  "context": "...",
  "dialogue": ["..."],
  "progression": "..."
}]`;

      const response = await aiService.callAI(prompt, 'structured', '', {
        temperature: 0.3,
        maxTokens: 3000
      });

      // Parse response
      const relationships = this._parseRelationshipsResponse(response, chapterId, bookId, actors);
      return relationships;
    } catch (error) {
      console.error('Error extracting relationships (advanced):', error);
      return [];
    }
  }

  /**
   * Parse relationships response and match to actors
   */
  _parseRelationshipsResponse(response, chapterId, bookId, actors) {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const relationships = JSON.parse(jsonMatch[0]);
      
      return relationships
        .map(rel => {
          // Fuzzy match character names to actors
          const match1 = this._fuzzyMatchActorName(rel.character1, actors);
          const match2 = this._fuzzyMatchActorName(rel.character2, actors);

          if (!match1 || !match2 || match1.actor.id === match2.actor.id) {
            return null; // Skip if can't match or same actor
          }

          // Normalize relationship type
          const type = this._normalizeRelationshipType(rel.type);

          return {
            character1: rel.character1,
            character2: rel.character2,
            actor1Id: match1.actor.id,
            actor2Id: match2.actor.id,
            type: type,
            strength: Math.max(0, Math.min(100, parseInt(rel.strength) || 50)),
            change: rel.change || '',
            events: Array.isArray(rel.events) ? rel.events.slice(0, 5) : [],
            emotion: rel.emotion || '',
            context: rel.context || '',
            dialogue: Array.isArray(rel.dialogue) ? rel.dialogue.slice(0, 3) : [],
            progression: rel.progression || '',
            chapterId,
            bookId,
            timestamp: Date.now(),
            confidence: Math.min(match1.confidence, match2.confidence)
          };
        })
        .filter(rel => rel !== null);
    } catch (error) {
      console.error('Error parsing relationships response:', error);
      return [];
    }
  }

  /**
   * Determine skill level from context
   */
  _determineSkillLevelFromContext(action, context) {
    if (!action && !context) return 1;
    
    const text = ((action || '') + ' ' + (context || '')).toLowerCase();
    
    if (text.includes('mastered') || text.includes('perfected') || text.includes('expert at') || text.includes('legendary')) {
      return 5;
    }
    if (text.includes('advanced') || text.includes('highly skilled') || text.includes('expert')) {
      return 4;
    }
    if (text.includes('improved') || text.includes('better at') || text.includes('practiced') || text.includes('skilled')) {
      return 3;
    }
    if (text.includes('developing') || text.includes('getting better') || text.includes('intermediate')) {
      return 2;
    }
    // Default for "learned", "gained", "discovered", "used"
    return 1;
  }

  /**
   * Normalize relationship type to standard types
   */
  _normalizeRelationshipType(type) {
    if (!type) return 'neutral';
    
    const typeLower = type.toLowerCase();
    
    // Map variations to standard types
    if (typeLower.includes('friend') || typeLower.includes('ally') || typeLower.includes('partner')) {
      return 'allied';
    }
    if (typeLower.includes('enemy') || typeLower.includes('hostile') || typeLower.includes('foe')) {
      return 'hostile';
    }
    if (typeLower.includes('romantic') || typeLower.includes('lover') || typeLower.includes('love')) {
      return 'romantic';
    }
    if (typeLower.includes('family') || typeLower.includes('parent') || typeLower.includes('sibling')) {
      return 'familial';
    }
    if (typeLower.includes('mentor') || typeLower.includes('teacher') || typeLower.includes('student')) {
      return 'mentor';
    }
    if (typeLower.includes('rival') || typeLower.includes('competitor')) {
      return 'rival';
    }
    if (typeLower.includes('business') || typeLower.includes('professional')) {
      return 'business';
    }
    
    return typeLower; // Return as-is if already standard
  }
}

// Create singleton instance
const chapterDataExtractionService = new ChapterDataExtractionService();

export default chapterDataExtractionService;

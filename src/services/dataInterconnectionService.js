/**
 * Data Interconnection Service
 * Automatic and suggested entity linking
 */

import db from './database';
import aiService from './aiService';

class DataInterconnectionService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Automatically link characters to plot beats
   * @param {Array} beats - Plot beats
   * @param {Array} characters - Characters
   * @returns {Promise<Array>} Linked beats
   */
  async linkCharactersToBeats(beats, characters) {
    const linkedBeats = [];
    
    for (const beat of beats) {
      const beatText = (beat.beat || '').toLowerCase();
      const linkedCharacters = [];
      
      for (const character of characters) {
        const charName = character.name.toLowerCase();
        if (beatText.includes(charName)) {
          linkedCharacters.push(character.id);
        }
        
        // Check nicknames
        if (character.nicknames) {
          for (const nickname of character.nicknames) {
            if (beatText.includes(nickname.toLowerCase())) {
              linkedCharacters.push(character.id);
              break;
            }
          }
        }
      }
      
      if (linkedCharacters.length > 0) {
        linkedBeats.push({
          ...beat,
          linkedCharacterIds: linkedCharacters,
          autoLinked: true
        });
      } else {
        linkedBeats.push(beat);
      }
    }
    
    return linkedBeats;
  }

  /**
   * Automatically link beats to chapters
   * @param {Array} beats - Plot beats
   * @param {Array} chapters - Chapters
   * @returns {Promise<Array>} Linked beats
   */
  async linkBeatsToChapters(beats, chapters) {
    const linkedBeats = [];
    
    for (const beat of beats) {
      if (beat.targetChapter || beat.chapterId) {
        linkedBeats.push(beat);
        continue;
      }
      
      // Try to find chapter by content match
      const beatText = (beat.beat || '').toLowerCase();
      let bestMatch = null;
      let bestScore = 0;
      
      for (const chapter of chapters) {
        const chapterText = ((chapter.script || chapter.content || '') + ' ' + (chapter.title || '') + ' ' + (chapter.desc || '')).toLowerCase();
        
        // Simple keyword matching
        const beatWords = beatText.split(/\s+/).filter(w => w.length > 3);
        let matchScore = 0;
        
        for (const word of beatWords) {
          if (chapterText.includes(word)) {
            matchScore++;
          }
        }
        
        if (matchScore > bestScore && matchScore >= 2) {
          bestScore = matchScore;
          bestMatch = chapter;
        }
      }
      
      if (bestMatch) {
        linkedBeats.push({
          ...beat,
          targetChapter: bestMatch.id,
          chapterId: bestMatch.id,
          autoLinked: true,
          linkConfidence: bestScore / Math.max(beatText.split(/\s+/).length, 1)
        });
      } else {
        linkedBeats.push(beat);
      }
    }
    
    return linkedBeats;
  }

  /**
   * Automatically link relationships to characters
   * @param {Array} relationships - Relationships
   * @param {Array} characters - Characters
   * @returns {Promise<Array>} Linked relationships
   */
  async linkRelationshipsToCharacters(relationships, characters) {
    const linkedRelationships = [];
    
    for (const rel of relationships) {
      const char1Name = (rel.character1 || rel.actor1Name || '').toLowerCase();
      const char2Name = (rel.character2 || rel.actor2Name || '').toLowerCase();
      
      let char1Id = null;
      let char2Id = null;
      
      for (const char of characters) {
        const charName = char.name.toLowerCase();
        if (charName === char1Name || char.nicknames?.some(n => n.toLowerCase() === char1Name)) {
          char1Id = char.id;
        }
        if (charName === char2Name || char.nicknames?.some(n => n.toLowerCase() === char2Name)) {
          char2Id = char.id;
        }
      }
      
      linkedRelationships.push({
        ...rel,
        actor1Id: char1Id || rel.actor1Id,
        actor2Id: char2Id || rel.actor2Id,
        autoLinked: !!(char1Id && char2Id)
      });
    }
    
    return linkedRelationships;
  }

  /**
   * Automatically link events to timeline
   * @param {Array} events - Events
   * @param {Array} chapters - Chapters
   * @returns {Promise<Array>} Linked events
   */
  async linkEventsToTimeline(events, chapters) {
    const linkedEvents = [];
    
    for (const event of events) {
      if (event.chapterId || event.bookId) {
        linkedEvents.push(event);
        continue;
      }
      
      // Try to find chapter by content match
      const eventText = ((event.title || '') + ' ' + (event.description || '')).toLowerCase();
      let bestMatch = null;
      let bestScore = 0;
      
      for (const chapter of chapters) {
        const chapterText = ((chapter.script || chapter.content || '') + ' ' + (chapter.title || '')).toLowerCase();
        
        const eventWords = eventText.split(/\s+/).filter(w => w.length > 3);
        let matchScore = 0;
        
        for (const word of eventWords) {
          if (chapterText.includes(word)) {
            matchScore++;
          }
        }
        
        if (matchScore > bestScore && matchScore >= 2) {
          bestScore = matchScore;
          bestMatch = chapter;
        }
      }
      
      if (bestMatch) {
        linkedEvents.push({
          ...event,
          chapterId: bestMatch.id,
          bookId: bestMatch.bookId,
          autoLinked: true
        });
      } else {
        linkedEvents.push(event);
      }
    }
    
    return linkedEvents;
  }

  /**
   * Suggest ambiguous character matches
   * @param {string} name - Character name to match
   * @param {Array} characters - Available characters
   * @returns {Promise<Object>} Suggested match with confidence
   */
  async suggestCharacterMatch(name, characters) {
    if (!name || !characters || characters.length === 0) {
      return { match: null, confidence: 0, suggestions: [] };
    }

    const nameLower = name.toLowerCase().trim();
    const suggestions = [];

    for (const char of characters) {
      const charNameLower = char.name.toLowerCase();
      let confidence = 0;

      // Exact match
      if (charNameLower === nameLower) {
        confidence = 1.0;
      }
      // Contains match
      else if (charNameLower.includes(nameLower) || nameLower.includes(charNameLower)) {
        confidence = 0.8;
      }
      // Word boundary match
      else {
        const nameWords = nameLower.split(/\s+/);
        const charWords = charNameLower.split(/\s+/);
        const matchingWords = nameWords.filter(w => 
          charWords.some(cw => cw.includes(w) || w.includes(cw))
        );
        if (matchingWords.length >= Math.min(2, nameWords.length)) {
          confidence = 0.6;
        }
      }

      // Check nicknames
      if (char.nicknames) {
        for (const nickname of char.nicknames) {
          if (nickname.toLowerCase() === nameLower) {
            confidence = Math.max(confidence, 0.9);
          } else if (nickname.toLowerCase().includes(nameLower) || nameLower.includes(nickname.toLowerCase())) {
            confidence = Math.max(confidence, 0.7);
          }
        }
      }

      if (confidence > 0.5) {
        suggestions.push({
          character: char,
          confidence,
          reason: confidence === 1.0 ? 'Exact match' : 
                  confidence >= 0.8 ? 'Contains match' :
                  'Partial match'
        });
      }
    }

    suggestions.sort((a, b) => b.confidence - a.confidence);

    return {
      match: suggestions.length > 0 && suggestions[0].confidence >= 0.8 ? suggestions[0].character : null,
      confidence: suggestions.length > 0 ? suggestions[0].confidence : 0,
      suggestions: suggestions.slice(0, 3)
    };
  }

  /**
   * Suggest potential relationships
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @returns {Promise<Array>} Suggested relationships
   */
  async suggestPotentialRelationships(chapterText, characters) {
    try {
      const characterNames = characters.map(c => c.name).join(', ');
      
      const systemContext = `You are a relationship suggestion expert.
Suggest relationships that might exist based on context.
Be conservative - only suggest if there's strong evidence.`;

      const prompt = `Suggest potential relationships:

Chapter text:
${chapterText.substring(0, 5000)}

Characters: ${characterNames || 'None'}

Suggest relationships that:
1. Are implied but not stated
2. Have strong contextual evidence
3. Make narrative sense

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "suggestedType": "Relationship type",
    "evidence": "Evidence for this relationship",
    "confidence": 0.0-1.0,
    "suggestion": "Why this relationship makes sense"
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return suggestions
          .filter(s => s.confidence >= 0.6)
          .map((s, idx) => ({
            ...s,
            id: `suggested_rel_${Date.now()}_${idx}`,
            type: 'suggested_relationship',
            createdAt: Date.now(),
            source: 'ai_suggestion'
          }));
      }
      
      return [];
    } catch (error) {
      console.error('Error suggesting potential relationships:', error);
      return [];
    }
  }

  /**
   * Suggest thread connections
   * @param {Array} plotThreads - Plot threads
   * @returns {Promise<Array>} Thread connection suggestions
   */
  async suggestThreadConnections(plotThreads) {
    try {
      const systemContext = `You are a plot thread connection expert.
Suggest how plot threads might connect.
Identify: shared elements, potential connections, narrative opportunities.`;

      const prompt = `Suggest thread connections:

Plot threads:
${JSON.stringify(plotThreads, null, 2)}

Suggest:
1. How threads might connect
2. Shared elements
3. Potential connections
4. Narrative opportunities

Return JSON array:
[
  {
    "thread1": "Thread ID or name",
    "thread2": "Thread ID or name",
    "connectionType": "How they connect",
    "sharedElements": ["Element 1", "Element 2"],
    "suggestion": "Why this connection makes sense",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return suggestions
          .filter(s => s.confidence >= 0.6)
          .map((s, idx) => ({
            ...s,
            id: `thread_conn_${Date.now()}_${idx}`,
            type: 'thread_connection',
            createdAt: Date.now(),
            source: 'ai_suggestion'
          }));
      }
      
      return [];
    } catch (error) {
      console.error('Error suggesting thread connections:', error);
      return [];
    }
  }

  /**
   * Suggest callback pairing
   * @param {Array} callbacks - Callback opportunities
   * @param {Array} chapters - Chapter array
   * @returns {Promise<Array>} Callback pairing suggestions
   */
  async suggestCallbackPairing(callbacks, chapters) {
    try {
      const systemContext = `You are a callback pairing expert.
Suggest callback setup/payoff pairs.
Match: setups with potential payoffs, payoff opportunities.`;

      const prompt = `Suggest callback pairings:

Callbacks:
${JSON.stringify(callbacks, null, 2)}

Chapters:
${chapters.map((ch, idx) => `${idx + 1}. ${ch.title || 'Untitled'}`).join('\n')}

Suggest:
1. Setup/payoff pairs
2. Which callbacks should reference which
3. Pairing opportunities

Return JSON array:
[
  {
    "setup": "Setup callback",
    "payoff": "Payoff callback",
    "setupChapter": "Chapter number",
    "payoffChapter": "Suggested chapter number",
    "suggestion": "Why this pairing works",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const pairings = JSON.parse(jsonMatch[0]);
        return pairings
          .filter(p => p.confidence >= 0.6)
          .map((p, idx) => ({
            ...p,
            id: `callback_pair_${Date.now()}_${idx}`,
            type: 'callback_pairing',
            createdAt: Date.now(),
            source: 'ai_suggestion'
          }));
      }
      
      return [];
    } catch (error) {
      console.error('Error suggesting callback pairing:', error);
      return [];
    }
  }

  /**
   * Interconnect all data
   * @param {Object} extractionData - Extracted data
   * @returns {Promise<Object>} Interconnected data
   */
  async interconnectAllData(extractionData) {
    try {
      const {
        beats = [],
        storylines = [],
        timelineEvents = [],
        relationships = [],
        callbacks = [],
        chapters = [],
        characters = []
      } = extractionData;

      // Automatic linking
      const [
        linkedBeats,
        beatsLinkedToChapters,
        linkedRelationships,
        linkedEvents
      ] = await Promise.all([
        this.linkCharactersToBeats(beats, characters),
        this.linkBeatsToChapters(beats, chapters),
        this.linkRelationshipsToCharacters(relationships, characters),
        this.linkEventsToTimeline(timelineEvents, chapters)
      ]);

      // Suggested connections
      const [
        suggestedRelationships,
        threadConnections,
        callbackPairings
      ] = await Promise.all([
        chapters.length > 0 ? this.suggestPotentialRelationships(
          chapters[0].script || chapters[0].content || '',
          characters
        ) : Promise.resolve([]),
        this.suggestThreadConnections(storylines),
        this.suggestCallbackPairing(callbacks, chapters)
      ]);

      return {
        automatic: {
          beats: beatsLinkedToChapters,
          relationships: linkedRelationships,
          events: linkedEvents
        },
        suggested: {
          relationships: suggestedRelationships,
          threadConnections,
          callbackPairings
        },
        all: [
          ...beatsLinkedToChapters.filter(b => b.autoLinked),
          ...linkedRelationships.filter(r => r.autoLinked),
          ...linkedEvents.filter(e => e.autoLinked),
          ...suggestedRelationships,
          ...threadConnections,
          ...callbackPairings
        ]
      };
    } catch (error) {
      console.error('Error interconnecting data:', error);
      return {
        automatic: { beats: [], relationships: [], events: [] },
        suggested: { relationships: [], threadConnections: [], callbackPairings: [] },
        all: []
      };
    }
  }
}

// Create singleton instance
const dataInterconnectionService = new DataInterconnectionService();

export default dataInterconnectionService;

/**
 * World Consistency Service
 * Monitor world rules, locations, timeline, and character stats consistency
 */

import aiService from './aiService';
import db from './database';

class WorldConsistencyService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Monitor world rules
   * @param {string} chapterText - Chapter content
   * @param {Object} worldRules - Existing world rules
   * @returns {Promise<Array>} Rule violation checks
   */
  async monitorWorldRules(chapterText, worldRules = {}) {
    try {
      const systemContext = `You are a world consistency expert.
Monitor world rules and magic systems for violations.
Check: rule violations, rule applications, consistency issues.`;

      const prompt = `Monitor world rules:

Chapter text:
${chapterText.substring(0, 5000)}

World rules:
${JSON.stringify(worldRules, null, 2)}

Check for:
1. Rule violations
2. Rule applications
3. Consistency issues
4. Rule implications
5. New rules that should be established

Return JSON array:
[
  {
    "rule": "World rule being checked",
    "violation": "Violation description or null",
    "application": "How rule is applied",
    "consistency": "consistent|inconsistent|unclear",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const checks = JSON.parse(jsonMatch[0]);
        return checks.map((c, idx) => ({
          ...c,
          id: `world_rule_${Date.now()}_${idx}`,
          type: 'world_rule',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error monitoring world rules:', error);
      return [];
    }
  }

  /**
   * Monitor location consistency
   * @param {string} chapterText - Chapter content
   * @param {Array} locations - Existing locations
   * @returns {Promise<Array>} Location consistency checks
   */
  async monitorLocationConsistency(chapterText, locations = []) {
    try {
      const locationNames = locations.map(l => l.name).join(', ');
      
      const systemContext = `You are a location consistency expert.
Monitor location and geography consistency.
Check: location descriptions, geography, travel distances, location relationships.`;

      const prompt = `Monitor location consistency:

Chapter text:
${chapterText.substring(0, 5000)}

Existing locations: ${locationNames || 'None'}

Check for:
1. Location description consistency
2. Geography consistency
3. Travel distance consistency
4. Location relationship consistency
5. New locations mentioned

Return JSON array:
[
  {
    "location": "Location name",
    "consistency": "consistent|inconsistent|new",
    "issues": ["Issue 1", "Issue 2"],
    "description": "Location description",
    "geography": "Geographic details",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const checks = JSON.parse(jsonMatch[0]);
        return checks.map((c, idx) => ({
          ...c,
          id: `location_cons_${Date.now()}_${idx}`,
          type: 'location_consistency',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error monitoring location consistency:', error);
      return [];
    }
  }

  /**
   * Check timeline consistency
   * @param {string} chapterText - Chapter content
   * @param {Array} timelineEvents - Existing timeline events
   * @returns {Promise<Array>} Timeline consistency checks
   */
  async checkTimelineConsistency(chapterText, timelineEvents = []) {
    try {
      const recentEvents = timelineEvents.slice(-10).map(e => ({
        title: e.title,
        timestamp: e.timestamp,
        chapterId: e.chapterId
      }));

      const systemContext = `You are a timeline consistency expert.
Check chronological consistency.
Verify: event order, timeline conflicts, chronological accuracy.`;

      const prompt = `Check timeline consistency:

Chapter text:
${chapterText.substring(0, 5000)}

Recent timeline events:
${JSON.stringify(recentEvents, null, 2)}

Check for:
1. Timeline conflicts
2. Event order issues
3. Chronological accuracy
4. Time gaps or jumps
5. Timeline inconsistencies

Return JSON array:
[
  {
    "event": "Event description",
    "timelineIssue": "Timeline issue or null",
    "conflict": "Conflict with other events or null",
    "chronologicalAccuracy": "accurate|inaccurate|unclear",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const checks = JSON.parse(jsonMatch[0]);
        return checks.map((c, idx) => ({
          ...c,
          id: `timeline_cons_${Date.now()}_${idx}`,
          type: 'timeline_consistency',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error checking timeline consistency:', error);
      return [];
    }
  }

  /**
   * Verify character stats consistency
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list with stats
   * @returns {Promise<Array>} Stats consistency checks
   */
  async verifyCharacterStatsConsistency(chapterText, characters = []) {
    try {
      const characterStats = characters.map(c => ({
        name: c.name,
        stats: c.baseStats || {},
        skills: c.activeSkills || []
      }));

      const systemContext = `You are a character stats consistency expert.
Verify character stats and abilities consistency.
Check: stat changes, ability usage, power level consistency.`;

      const prompt = `Verify character stats consistency:

Chapter text:
${chapterText.substring(0, 5000)}

Character stats:
${JSON.stringify(characterStats, null, 2)}

Check for:
1. Stat change consistency
2. Ability usage consistency
3. Power level consistency
4. Stat contradictions
5. Ability contradictions

Return JSON array:
[
  {
    "character": "Character name",
    "statIssue": "Stat issue or null",
    "abilityIssue": "Ability issue or null",
    "consistency": "consistent|inconsistent|unclear",
    "issues": ["Issue 1", "Issue 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const checks = JSON.parse(jsonMatch[0]);
        return checks.map((c, idx) => ({
          ...c,
          id: `stats_cons_${Date.now()}_${idx}`,
          type: 'stats_consistency',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error verifying character stats consistency:', error);
      return [];
    }
  }

  /**
   * Comprehensive world consistency monitoring
   * @param {string} chapterText - Chapter content
   * @param {Object} worldState - Full world state
   * @returns {Promise<Object>} Complete consistency analysis
   */
  async monitorWorldConsistency(chapterText, worldState = {}) {
    try {
      const [
        rules,
        locations,
        timeline,
        stats
      ] = await Promise.all([
        this.monitorWorldRules(chapterText, worldState.worldRules || {}),
        this.monitorLocationConsistency(chapterText, worldState.locations || []),
        this.checkTimelineConsistency(chapterText, worldState.timelineEvents || []),
        this.verifyCharacterStatsConsistency(chapterText, worldState.actors || [])
      ]);

      return {
        rules,
        locations,
        timeline,
        stats,
        all: [
          ...rules,
          ...locations,
          ...timeline,
          ...stats
        ]
      };
    } catch (error) {
      console.error('Error in comprehensive world consistency monitoring:', error);
      return {
        rules: [],
        locations: [],
        timeline: [],
        stats: [],
        all: []
      };
    }
  }
}

// Create singleton instance
const worldConsistencyService = new WorldConsistencyService();

export default worldConsistencyService;

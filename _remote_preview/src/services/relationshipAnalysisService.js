/**
 * Relationship Analysis Service
 * Deep psychological relationship analysis with evolution tracking
 */

import aiService from './aiService';
import db from './database';

class RelationshipAnalysisService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Psychological relationship mapping
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @returns {Promise<Array>} Psychological relationship analyses
   */
  async mapPsychologicalRelationships(chapterText, characters = []) {
    try {
      const characterNames = characters.map(c => `${c.name} (${c.class || 'Unknown'})`).join(', ');
      
      const systemContext = `You are a psychological relationship analyst.
Analyze relationships with deep psychological insight.
Identify: motivations, power dynamics, hidden tensions, emotional subtext, psychological patterns.`;

      const prompt = `Analyze psychological relationships:

Chapter text:
${chapterText.substring(0, 5000)}

Characters: ${characterNames || 'None'}

For each relationship pair, provide deep psychological analysis:
1. Psychological motivations (what drives each character)
2. Power dynamics (who has power, why, how it shifts)
3. Hidden tensions (subtext, unspoken conflicts)
4. Emotional subtext (underlying emotions)
5. Psychological patterns (recurring dynamics)
6. Unconscious dynamics (what's not being said)

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "psychologicalMotivations": {
      "character1": "What drives character 1",
      "character2": "What drives character 2"
    },
    "powerDynamics": {
      "currentBalance": "Who has power and why",
      "shifts": "How power shifts",
      "sources": "Sources of power"
    },
    "hiddenTensions": ["Tension 1", "Tension 2"],
    "emotionalSubtext": "Underlying emotions",
    "psychologicalPatterns": ["Pattern 1", "Pattern 2"],
    "unconsciousDynamics": "What's not being said",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const analyses = JSON.parse(jsonMatch[0]);
        return analyses.map((a, idx) => ({
          ...a,
          id: `psych_rel_${Date.now()}_${idx}`,
          type: 'psychological_relationship',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error mapping psychological relationships:', error);
      return [];
    }
  }

  /**
   * Track relationship evolution
   * @param {string} chapterText - Chapter content
   * @param {Array} relationshipHistory - Previous relationship states
   * @returns {Promise<Array>} Relationship evolution analysis
   */
  async trackRelationshipEvolution(chapterText, relationshipHistory = []) {
    try {
      const systemContext = `You are a relationship evolution tracker.
Analyze how relationships change over time.
Track: evolution stages, change triggers, relationship health, trajectory.`;

      const prompt = `Analyze relationship evolution:

Current chapter:
${chapterText.substring(0, 5000)}

Relationship history:
${JSON.stringify(relationshipHistory.slice(-5), null, 2)}

Analyze:
1. How relationships have evolved
2. What triggered changes
3. Relationship health status
4. Future trajectory
5. Evolution stages

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "evolution": "How the relationship evolved",
    "stages": ["Stage 1", "Stage 2", "Current stage"],
    "changeTriggers": ["Trigger 1", "Trigger 2"],
    "relationshipHealth": "healthy|strained|broken|developing",
    "trajectory": "Where this is heading",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const evolutions = JSON.parse(jsonMatch[0]);
        return evolutions.map((e, idx) => ({
          ...e,
          id: `rel_evol_${Date.now()}_${idx}`,
          type: 'relationship_evolution',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error tracking relationship evolution:', error);
      return [];
    }
  }

  /**
   * Predict relationship conflicts
   * @param {string} chapterText - Chapter content
   * @param {Array} relationships - Current relationships
   * @returns {Promise<Array>} Conflict predictions
   */
  async predictRelationshipConflicts(chapterText, relationships = []) {
    try {
      const systemContext = `You are a conflict prediction expert.
Predict potential relationship conflicts based on dynamics and tensions.
Consider: underlying tensions, incompatible goals, power struggles, emotional triggers.`;

      const prompt = `Predict relationship conflicts:

Chapter text:
${chapterText.substring(0, 5000)}

Current relationships:
${JSON.stringify(relationships.slice(0, 10), null, 2)}

Predict:
1. Potential conflicts
2. Conflict triggers
3. Conflict severity
4. Conflict resolution paths
5. Prevention strategies

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "potentialConflict": "What conflict could arise",
    "triggers": ["Trigger 1", "Trigger 2"],
    "severity": "low|medium|high|critical",
    "likelihood": 1-10,
    "resolutionPaths": ["Path 1", "Path 2"],
    "preventionStrategies": ["Strategy 1", "Strategy 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const conflicts = JSON.parse(jsonMatch[0]);
        return conflicts.map((c, idx) => ({
          ...c,
          id: `rel_conflict_${Date.now()}_${idx}`,
          type: 'relationship_conflict',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error predicting relationship conflicts:', error);
      return [];
    }
  }

  /**
   * Analyze relationship comedy
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @returns {Promise<Array>} Comedy relationship analyses
   */
  async analyzeRelationshipComedy(chapterText, characters = []) {
    try {
      const characterNames = characters.map(c => c.name).join(', ');
      
      const systemContext = `You are a comedy relationship analyst for "The Compliance Run" - a dark comedy series.
Identify funny relationship dynamics and comedy opportunities.
The series is 60% horror/RPG brutality, 40% caustic comedy.`;

      const prompt = `Analyze relationship comedy:

Chapter text:
${chapterText.substring(0, 5000)}

Characters: ${characterNames || 'None'}

Identify:
1. Funny relationship dynamics
2. Comedy opportunities in relationships
3. Running gag potential
4. Character comedy moments
5. Situational comedy from relationships

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "comedyDynamic": "What makes this relationship funny",
    "comedyMoments": ["Moment 1", "Moment 2"],
    "runningGagPotential": "Potential running gags",
    "comedyStyle": "How this should be funny",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const comedy = JSON.parse(jsonMatch[0]);
        return comedy.map((c, idx) => ({
          ...c,
          id: `rel_comedy_${Date.now()}_${idx}`,
          type: 'relationship_comedy',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error analyzing relationship comedy:', error);
      return [];
    }
  }

  /**
   * Comprehensive relationship analysis
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @param {Array} relationshipHistory - Previous relationship states
   * @returns {Promise<Object>} Complete relationship analysis
   */
  async analyzeRelationshipsComprehensive(chapterText, characters = [], relationshipHistory = []) {
    try {
      const [
        psychological,
        evolution,
        conflicts,
        comedy
      ] = await Promise.all([
        this.mapPsychologicalRelationships(chapterText, characters),
        this.trackRelationshipEvolution(chapterText, relationshipHistory),
        this.predictRelationshipConflicts(chapterText, relationshipHistory),
        this.analyzeRelationshipComedy(chapterText, characters)
      ]);

      return {
        psychological,
        evolution,
        conflicts,
        comedy,
        all: [
          ...psychological,
          ...evolution,
          ...conflicts,
          ...comedy
        ]
      };
    } catch (error) {
      console.error('Error in comprehensive relationship analysis:', error);
      return {
        psychological: [],
        evolution: [],
        conflicts: [],
        comedy: [],
        all: []
      };
    }
  }
}

// Create singleton instance
const relationshipAnalysisService = new RelationshipAnalysisService();

export default relationshipAnalysisService;

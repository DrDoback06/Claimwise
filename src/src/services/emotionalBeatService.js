/**
 * Emotional Beat Service
 * Comprehensive emotional analysis and journey mapping
 */

import aiService from './aiService';
import db from './database';

class EmotionalBeatService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Map emotional journey
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @param {Array} previousEmotions - Previous emotional states
   * @returns {Promise<Array>} Emotional journey mapping
   */
  async mapEmotionalJourney(chapterText, characters = [], previousEmotions = []) {
    try {
      const characterNames = characters.map(c => c.name).join(', ');
      
      const systemContext = `You are an emotional journey mapping expert.
Map complete emotional arcs and journeys.
Track: emotional states, transitions, emotional depth, character emotional journeys.`;

      const prompt = `Map emotional journey:

Chapter text:
${chapterText.substring(0, 5000)}

Characters: ${characterNames || 'None'}

Previous emotional states:
${JSON.stringify(previousEmotions.slice(-5), null, 2)}

For each character, map:
1. Emotional states in this chapter
2. Emotional transitions
3. Emotional depth
4. Emotional journey progression
5. Emotional arc stage

Return JSON array:
[
  {
    "character": "Character name",
    "emotionalStates": [
      {
        "state": "Emotional state",
        "intensity": 1-10,
        "trigger": "What caused this state",
        "duration": "How long it lasts"
      }
    ],
    "emotionalTransitions": ["Transition 1", "Transition 2"],
    "emotionalDepth": "Depth of emotion",
    "journeyProgression": "How their emotional journey progresses",
    "arcStage": "stage of emotional arc",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const journeys = JSON.parse(jsonMatch[0]);
        return journeys.map((j, idx) => ({
          ...j,
          id: `emotion_journey_${Date.now()}_${idx}`,
          type: 'emotional_journey',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error mapping emotional journey:', error);
      return [];
    }
  }

  /**
   * Detect catharsis points
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @returns {Promise<Array>} Catharsis point detections
   */
  async detectCatharsisPoints(chapterText, characters = []) {
    try {
      const characterNames = characters.map(c => c.name).join(', ');
      
      const systemContext = `You are a catharsis detection expert.
Identify emotional release moments and catharsis points.
Look for: emotional release, resolution moments, emotional payoffs, relief moments.`;

      const prompt = `Detect catharsis points:

Chapter text:
${chapterText.substring(0, 5000)}

Characters: ${characterNames || 'None'}

Identify:
1. Emotional release moments
2. Catharsis points
3. Resolution moments
4. Emotional payoffs
5. Relief moments

Return JSON array:
[
  {
    "character": "Character name",
    "catharsisMoment": "What the catharsis moment is",
    "type": "release|resolution|payoff|relief|breakthrough",
    "emotionalIntensity": 1-10,
    "buildUp": "What built up to this",
    "release": "How the release happens",
    "impact": "Impact of this catharsis",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const catharsis = JSON.parse(jsonMatch[0]);
        return catharsis.map((c, idx) => ({
          ...c,
          id: `catharsis_${Date.now()}_${idx}`,
          type: 'catharsis',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error detecting catharsis points:', error);
      return [];
    }
  }

  /**
   * Track emotional payoff
   * @param {string} chapterText - Chapter content
   * @param {Array} emotionalSetups - Previous emotional setups
   * @returns {Promise<Array>} Emotional payoff tracking
   */
  async trackEmotionalPayoff(chapterText, emotionalSetups = []) {
    try {
      const systemContext = `You are an emotional payoff tracker.
Track emotional setup and payoff pairs.
Identify: setups that pay off, payoffs that were set up, missing payoffs, payoff quality.`;

      const prompt = `Track emotional payoff:

Chapter text:
${chapterText.substring(0, 5000)}

Previous emotional setups:
${JSON.stringify(emotionalSetups.slice(-10), null, 2)}

Track:
1. Setups that pay off in this chapter
2. Payoffs that were set up earlier
3. Missing payoffs (setups without payoff)
4. Payoff quality
5. Emotional payoff opportunities

Return JSON array:
[
  {
    "setup": "Emotional setup description",
    "payoff": "Emotional payoff description",
    "setupChapter": "Chapter where setup occurred",
    "payoffChapter": "Chapter where payoff occurs",
    "payoffQuality": "excellent|good|adequate|poor|missing",
    "emotionalImpact": "Impact of the payoff",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const payoffs = JSON.parse(jsonMatch[0]);
        return payoffs.map((p, idx) => ({
          ...p,
          id: `emotion_payoff_${Date.now()}_${idx}`,
          type: 'emotional_payoff',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error tracking emotional payoff:', error);
      return [];
    }
  }

  /**
   * Comprehensive emotional beat analysis
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @param {Array} previousEmotions - Previous emotional states
   * @param {Array} emotionalSetups - Previous emotional setups
   * @returns {Promise<Object>} Complete emotional analysis
   */
  async analyzeEmotionalBeats(chapterText, characters = [], previousEmotions = [], emotionalSetups = []) {
    try {
      const [
        journey,
        catharsis,
        payoffs
      ] = await Promise.all([
        this.mapEmotionalJourney(chapterText, characters, previousEmotions),
        this.detectCatharsisPoints(chapterText, characters),
        this.trackEmotionalPayoff(chapterText, emotionalSetups)
      ]);

      return {
        journey,
        catharsis,
        payoffs,
        all: [
          ...journey,
          ...catharsis,
          ...payoffs
        ]
      };
    } catch (error) {
      console.error('Error in comprehensive emotional beat analysis:', error);
      return {
        journey: [],
        catharsis: [],
        payoffs: [],
        all: []
      };
    }
  }
}

// Create singleton instance
const emotionalBeatService = new EmotionalBeatService();

export default emotionalBeatService;

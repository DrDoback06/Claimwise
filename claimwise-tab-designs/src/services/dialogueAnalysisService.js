/**
 * Dialogue Analysis Service
 * Comprehensive dialogue quality and character voice analysis
 */

import aiService from './aiService';
import db from './database';

class DialogueAnalysisService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Analyze dialogue quality
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @returns {Promise<Array>} Dialogue quality analyses
   */
  async analyzeDialogueQuality(chapterText, characters = []) {
    try {
      const characterNames = characters.map(c => `${c.name} (${c.class || 'Unknown'})`).join(', ');
      
      const systemContext = `You are a dialogue quality expert.
Analyze dialogue for naturalness, purpose, effectiveness, and quality.
Assess: naturalness, purpose, effectiveness, subtext, impact.`;

      const prompt = `Analyze dialogue quality:

Chapter text:
${chapterText.substring(0, 5000)}

Characters: ${characterNames || 'None'}

For each dialogue exchange, analyze:
1. Naturalness (does it sound natural?)
2. Purpose (what does it accomplish?)
3. Effectiveness (does it achieve its purpose?)
4. Subtext (what's beneath the surface?)
5. Impact (emotional/plot impact)

Return JSON array:
[
  {
    "dialogue": "Dialogue excerpt",
    "character": "Character speaking",
    "naturalness": 1-10,
    "purpose": "What this dialogue accomplishes",
    "effectiveness": 1-10,
    "subtext": "What's beneath the surface",
    "impact": "Emotional/plot impact",
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
          id: `dialogue_qual_${Date.now()}_${idx}`,
          type: 'dialogue_quality',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error analyzing dialogue quality:', error);
      return [];
    }
  }

  /**
   * Check character voice consistency
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list with voice profiles
   * @returns {Promise<Array>} Voice consistency checks
   */
  async checkCharacterVoiceConsistency(chapterText, characters = []) {
    try {
      const characterVoices = characters.map(c => ({
        name: c.name,
        voice: c.voiceProfile || c.voice || 'Not specified'
      }));

      const systemContext = `You are a character voice consistency expert.
Check if character voices are consistent across dialogue.
Compare: current dialogue vs voice profile, consistency issues, voice quality.`;

      const prompt = `Check character voice consistency:

Chapter text:
${chapterText.substring(0, 5000)}

Character voice profiles:
${JSON.stringify(characterVoices, null, 2)}

For each character, check:
1. Voice consistency with profile
2. Voice quality
3. Consistency issues
4. Voice improvements needed

Return JSON array:
[
  {
    "character": "Character name",
    "voiceConsistency": "consistent|mostly_consistent|inconsistent",
    "consistencyScore": 1-10,
    "issues": ["Issue 1", "Issue 2"],
    "voiceQuality": "excellent|good|adequate|poor",
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
          id: `voice_cons_${Date.now()}_${idx}`,
          type: 'voice_consistency',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error checking character voice consistency:', error);
      return [];
    }
  }

  /**
   * Detect comedy potential in dialogue
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @returns {Promise<Array>} Comedy dialogue suggestions
   */
  async detectDialogueComedy(chapterText, characters = []) {
    try {
      const characterNames = characters.map(c => c.name).join(', ');
      
      const systemContext = `You are a comedy dialogue expert for "The Compliance Run" - a dark comedy series.
Detect comedy opportunities in dialogue.
Consider: wit, timing, character comedy, situational humor, callback humor.`;

      const prompt = `Detect comedy potential in dialogue:

Chapter text:
${chapterText.substring(0, 5000)}

Characters: ${characterNames || 'None'}

Identify:
1. Comedy opportunities in dialogue
2. Wit and wordplay potential
3. Character comedy moments
4. Situational humor in dialogue
5. Callback humor opportunities

Return JSON array:
[
  {
    "dialogue": "Dialogue excerpt",
    "character": "Character speaking",
    "comedyPotential": "What makes this funny",
    "comedyType": "wit|timing|character|situational|callback",
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
          id: `dialogue_comedy_${Date.now()}_${idx}`,
          type: 'dialogue_comedy',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error detecting dialogue comedy:', error);
      return [];
    }
  }

  /**
   * Comprehensive dialogue analysis
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @returns {Promise<Object>} Complete dialogue analysis
   */
  async analyzeDialogue(chapterText, characters = []) {
    try {
      const [
        quality,
        voiceConsistency,
        comedy
      ] = await Promise.all([
        this.analyzeDialogueQuality(chapterText, characters),
        this.checkCharacterVoiceConsistency(chapterText, characters),
        this.detectDialogueComedy(chapterText, characters)
      ]);

      return {
        quality,
        voiceConsistency,
        comedy,
        all: [
          ...quality,
          ...voiceConsistency,
          ...comedy
        ]
      };
    } catch (error) {
      console.error('Error in comprehensive dialogue analysis:', error);
      return {
        quality: [],
        voiceConsistency: [],
        comedy: [],
        all: []
      };
    }
  }
}

// Create singleton instance
const dialogueAnalysisService = new DialogueAnalysisService();

export default dialogueAnalysisService;

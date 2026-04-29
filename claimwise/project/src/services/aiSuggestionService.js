/**
 * AI Suggestion Service
 * Autonomous AI-powered suggestions for plot, relationships, comedy, and story development
 */

import aiService from './aiService';
import db from './database';

class AISuggestionService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Analyze plot directions and suggest story developments
   * @param {string} chapterText - Chapter content
   * @param {Object} context - Story context
   * @returns {Promise<Array>} Plot direction suggestions
   */
  async analyzePlotDirections(chapterText, context = {}) {
    try {
      const systemContext = `You are an expert story analyst for "The Compliance Run" series.
Analyze the story trajectory and suggest creative plot directions, twists, and developments.
Be autonomous - suggest directions even if not explicitly stated in the text.
Consider: plot twists, character revelations, conflict escalation, resolution paths, story arcs.`;

      const prompt = `Analyze this chapter and suggest plot directions:

Chapter text:
${chapterText.substring(0, 5000)}

Story context:
- Previous chapters: ${context.previousChapters?.length || 0}
- Active plot threads: ${context.activeThreads?.length || 0}
- Characters involved: ${context.characters?.map(c => c.name).join(', ') || 'None'}

Suggest plot directions including:
1. Immediate next steps for the story
2. Potential plot twists or revelations
3. Conflict escalation opportunities
4. Resolution paths
5. Story arc developments

Return JSON array:
[
  {
    "suggestion": "Plot direction description",
    "type": "plot_direction",
    "priority": "high|medium|low",
    "importance": 1-10,
    "reasoning": "Why this direction makes sense",
    "potentialImpact": "How this could affect the story",
    "charactersInvolved": ["Character 1", "Character 2"],
    "estimatedChapters": "When this should happen",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return suggestions.map((s, idx) => ({
          ...s,
          id: `plot_dir_${Date.now()}_${idx}`,
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error analyzing plot directions:', error);
      return [];
    }
  }

  /**
   * Analyze relationship dynamics deeply
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @returns {Promise<Array>} Relationship analysis suggestions
   */
  async analyzeRelationshipDynamics(chapterText, characters = []) {
    try {
      const characterNames = characters.map(c => c.name).join(', ');
      
      const systemContext = `You are a relationship dynamics expert.
Analyze character relationships with deep psychological insight.
Identify: power dynamics, hidden tensions, emotional states, relationship evolution, comedy potential, conflict potential.
Be autonomous - analyze what's implied, not just what's stated.`;

      const prompt = `Analyze relationship dynamics in this chapter:

Chapter text:
${chapterText.substring(0, 5000)}

Characters: ${characterNames || 'None'}

For each relationship pair, analyze:
1. Current relationship status (good/bad/funny/stupid/complex)
2. Psychological motivations
3. Power dynamics
4. Hidden tensions or subtext
5. Relationship evolution potential
6. Comedy opportunities
7. Conflict potential
8. Emotional depth

Return JSON array:
[
  {
    "character1": "Character name",
    "character2": "Character name",
    "currentStatus": "good|bad|funny|stupid|complex|neutral",
    "psychologicalAnalysis": "Deep psychological insight",
    "powerDynamics": "Who has power and why",
    "hiddenTensions": "Any hidden tensions or subtext",
    "evolutionPotential": "How this relationship could evolve",
    "comedyOpportunities": ["Comedy moment 1", "Comedy moment 2"],
    "conflictPotential": "Potential conflicts",
    "emotionalDepth": "Emotional aspects",
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
          id: `rel_dyn_${Date.now()}_${idx}`,
          type: 'relationship_dynamics',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error analyzing relationship dynamics:', error);
      return [];
    }
  }

  /**
   * Detect conflict opportunities
   * @param {string} chapterText - Chapter content
   * @param {Object} context - Story context
   * @returns {Promise<Array>} Conflict suggestions
   */
  async detectConflicts(chapterText, context = {}) {
    try {
      const systemContext = `You are a conflict analysis expert.
Identify potential conflicts and tension-building opportunities.
Suggest both explicit conflicts and subtle tensions that could escalate.`;

      const prompt = `Analyze this chapter for conflict opportunities:

Chapter text:
${chapterText.substring(0, 5000)}

Identify:
1. Existing conflicts
2. Potential conflicts that could arise
3. Tension-building opportunities
4. Conflict resolution paths
5. Escalation possibilities

Return JSON array:
[
  {
    "conflict": "Conflict description",
    "type": "character|plot|internal|external|ideological",
    "characters": ["Character 1", "Character 2"],
    "tensionLevel": 1-10,
    "escalationPotential": "How this could escalate",
    "resolutionPaths": ["Path 1", "Path 2"],
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
          id: `conflict_${Date.now()}_${idx}`,
          type: 'conflict',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return [];
    }
  }

  /**
   * Detect callback opportunities
   * @param {string} chapterText - Chapter content
   * @param {Object} context - Story context
   * @returns {Promise<Array>} Callback suggestions
   */
  async detectCallbacks(chapterText, context = {}) {
    try {
      const systemContext = `You are a callback detection expert.
Identify moments, events, or details that should be referenced later.
Look for: memorable moments, setup moments, character moments, world-building details.`;

      const prompt = `Analyze this chapter for callback opportunities:

Chapter text:
${chapterText.substring(0, 5000)}

Identify moments that:
1. Should be referenced later
2. Set up future plot points
3. Are memorable character moments
4. Create callback opportunities
5. Have emotional significance

Return JSON array:
[
  {
    "event": "Event or moment description",
    "type": "memory|setup|reference|callback|emotional",
    "importance": 1-10,
    "suggestedCallbackChapter": null or chapter number,
    "whyImportant": "Why this should be referenced",
    "callbackType": "How it should be referenced",
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const callbacks = JSON.parse(jsonMatch[0]);
        return callbacks.map((cb, idx) => ({
          ...cb,
          id: `callback_${Date.now()}_${idx}`,
          type: 'callback',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error detecting callbacks:', error);
      return [];
    }
  }

  /**
   * Suggest character growth paths
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @returns {Promise<Array>} Character growth suggestions
   */
  async suggestCharacterGrowth(chapterText, characters = []) {
    try {
      const characterNames = characters.map(c => c.name).join(', ');
      
      const systemContext = `You are a character development expert.
Suggest character growth arcs and development moments.
Consider: emotional growth, skill development, relationship growth, personal revelations, overcoming flaws.`;

      const prompt = `Analyze character growth opportunities:

Chapter text:
${chapterText.substring(0, 5000)}

Characters: ${characterNames || 'None'}

For each character, suggest:
1. Growth moments
2. Development arcs
3. Skills to develop
4. Flaws to overcome
5. Relationships to develop
6. Personal revelations
7. Emotional growth

Return JSON array:
[
  {
    "character": "Character name",
    "growthMoment": "What growth moment could happen",
    "type": "emotional|skill|relationship|personal|overcoming",
    "developmentArc": "How this fits into their arc",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "estimatedChapters": "When this should happen",
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const growth = JSON.parse(jsonMatch[0]);
        return growth.map((g, idx) => ({
          ...g,
          id: `growth_${Date.now()}_${idx}`,
          type: 'character_growth',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error suggesting character growth:', error);
      return [];
    }
  }

  /**
   * Suggest world-building connections
   * @param {string} chapterText - Chapter content
   * @param {Object} context - World context
   * @returns {Promise<Array>} World-building suggestions
   */
  async suggestWorldBuilding(chapterText, context = {}) {
    try {
      const systemContext = `You are a world-building expert.
Identify world-building implications and connections.
Suggest: rule implications, location connections, system interactions, world consistency.`;

      const prompt = `Analyze world-building opportunities:

Chapter text:
${chapterText.substring(0, 5000)}

Identify:
1. World rule implications
2. Location connections
3. System interactions
4. Consistency opportunities
5. World expansion possibilities

Return JSON array:
[
  {
    "connection": "World-building connection",
    "type": "rule|location|system|consistency|expansion",
    "implications": "What this means for the world",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const connections = JSON.parse(jsonMatch[0]);
        return connections.map((c, idx) => ({
          ...c,
          id: `world_${Date.now()}_${idx}`,
          type: 'world_building',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error suggesting world-building:', error);
      return [];
    }
  }

  /**
   * Detect comedy opportunities
   * @param {string} chapterText - Chapter content
   * @param {Array} characters - Character list
   * @returns {Promise<Array>} Comedy suggestions
   */
  async detectComedyOpportunities(chapterText, characters = []) {
    try {
      const characterNames = characters.map(c => c.name).join(', ');
      
      const systemContext = `You are a comedy analysis expert for "The Compliance Run" - a dark comedy horror-RPG series.
Analyze for ALL comedy elements: setup/payoff, character comedy, situational humor, running gags, callback humor.
The series is 60% horror/RPG brutality, 40% caustic comedy.`;

      const prompt = `Analyze comedy opportunities:

Chapter text:
${chapterText.substring(0, 5000)}

Characters: ${characterNames || 'None'}

Identify:
1. Setup/payoff opportunities
2. Character-specific comedy moments
3. Situational comedy potential
4. Running gag opportunities
5. Callback humor possibilities
6. Comedy timing suggestions

Return JSON array:
[
  {
    "comedyMoment": "Comedy opportunity description",
    "type": "setup_payoff|character|situational|running_gag|callback|timing",
    "characters": ["Character 1", "Character 2"],
    "comedyStyle": "How this should be funny",
    "setup": "What sets this up",
    "payoff": "What the payoff could be",
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
          id: `comedy_${Date.now()}_${idx}`,
          type: 'comedy',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error detecting comedy opportunities:', error);
      return [];
    }
  }

  /**
   * Suggest dramatic tension
   * @param {string} chapterText - Chapter content
   * @param {Object} context - Story context
   * @returns {Promise<Array>} Dramatic tension suggestions
   */
  async suggestDramaticTension(chapterText, context = {}) {
    try {
      const systemContext = `You are a dramatic tension expert.
Identify emotional beats and dramatic opportunities.
Consider: emotional moments, tension building, dramatic reveals, emotional payoffs.`;

      const prompt = `Analyze dramatic tension opportunities:

Chapter text:
${chapterText.substring(0, 5000)}

Identify:
1. Emotional beats
2. Tension-building moments
3. Dramatic reveal opportunities
4. Emotional payoff moments
5. Character emotional states

Return JSON array:
[
  {
    "tensionMoment": "Dramatic moment description",
    "type": "emotional|tension|reveal|payoff|character_state",
    "emotionalIntensity": 1-10,
    "characters": ["Character 1", "Character 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const tensions = JSON.parse(jsonMatch[0]);
        return tensions.map((t, idx) => ({
          ...t,
          id: `tension_${Date.now()}_${idx}`,
          type: 'dramatic_tension',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error suggesting dramatic tension:', error);
      return [];
    }
  }

  /**
   * Analyze pacing
   * @param {Array} chapters - Chapter array
   * @returns {Promise<Array>} Pacing suggestions
   */
  async analyzePacing(chapters) {
    try {
      const chaptersSummary = chapters.map((ch, idx) => ({
        number: ch.number || idx + 1,
        title: ch.title || 'Untitled',
        length: (ch.script || ch.content || '').length,
        keyEvents: ch.keyPlotPoints || []
      }));

      const systemContext = `You are a pacing analysis expert.
Analyze chapter flow and suggest pacing improvements.
Consider: chapter length, action/dialogue balance, tension curves, flow.`;

      const prompt = `Analyze pacing:

Chapters:
${JSON.stringify(chaptersSummary, null, 2)}

Analyze:
1. Chapter flow
2. Pacing issues
3. Action/dialogue balance
4. Tension curves
5. Flow improvements

Return JSON array:
[
  {
    "chapter": "Chapter number or range",
    "issue": "Pacing issue description",
    "suggestion": "How to improve pacing",
    "type": "flow|balance|tension|length|rhythm",
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const pacing = JSON.parse(jsonMatch[0]);
        return pacing.map((p, idx) => ({
          ...p,
          id: `pacing_${Date.now()}_${idx}`,
          type: 'pacing',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error analyzing pacing:', error);
      return [];
    }
  }

  /**
   * Detect foreshadowing opportunities
   * @param {string} chapterText - Chapter content
   * @param {Array} futureChapters - Future chapter summaries
   * @returns {Promise<Array>} Foreshadowing suggestions
   */
  async suggestForeshadowing(chapterText, futureChapters = []) {
    try {
      const futureSummary = futureChapters.map(ch => ({
        number: ch.number,
        title: ch.title,
        keyEvents: ch.keyPlotPoints || []
      }));

      const systemContext = `You are a foreshadowing expert.
Detect setup moments and suggest payoff opportunities.
Identify: setup moments, payoff connections, subtle hints, dramatic irony.`;

      const prompt = `Analyze foreshadowing opportunities:

Current chapter:
${chapterText.substring(0, 5000)}

Future chapters:
${JSON.stringify(futureSummary, null, 2)}

Identify:
1. Setup moments in current chapter
2. Potential payoffs in future chapters
3. Foreshadowing opportunities
4. Subtle hints to add
5. Dramatic irony possibilities

Return JSON array:
[
  {
    "setup": "Setup moment description",
    "payoff": "Potential payoff description",
    "payoffChapter": "Chapter number for payoff",
    "type": "setup|payoff|hint|irony",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const foreshadowing = JSON.parse(jsonMatch[0]);
        return foreshadowing.map((f, idx) => ({
          ...f,
          id: `foreshadow_${Date.now()}_${idx}`,
          type: 'foreshadowing',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error suggesting foreshadowing:', error);
      return [];
    }
  }

  /**
   * Generate all suggestions for a chapter
   * @param {string} chapterText - Chapter content
   * @param {Object} context - Full story context
   * @returns {Promise<Object>} All suggestions
   */
  async generateAllSuggestions(chapterText, context = {}) {
    try {
      const [
        plotDirections,
        relationshipDynamics,
        conflicts,
        callbacks,
        characterGrowth,
        worldBuilding,
        comedy,
        dramaticTension,
        foreshadowing
      ] = await Promise.all([
        this.analyzePlotDirections(chapterText, context),
        this.analyzeRelationshipDynamics(chapterText, context.characters || []),
        this.detectConflicts(chapterText, context),
        this.detectCallbacks(chapterText, context),
        this.suggestCharacterGrowth(chapterText, context.characters || []),
        this.suggestWorldBuilding(chapterText, context),
        this.detectComedyOpportunities(chapterText, context.characters || []),
        this.suggestDramaticTension(chapterText, context),
        this.suggestForeshadowing(chapterText, context.futureChapters || [])
      ]);

      return {
        plotDirections,
        relationshipDynamics,
        conflicts,
        callbacks,
        characterGrowth,
        worldBuilding,
        comedy,
        dramaticTension,
        foreshadowing,
        all: [
          ...plotDirections,
          ...relationshipDynamics,
          ...conflicts,
          ...callbacks,
          ...characterGrowth,
          ...worldBuilding,
          ...comedy,
          ...dramaticTension,
          ...foreshadowing
        ]
      };
    } catch (error) {
      console.error('Error generating all suggestions:', error);
      return {
        plotDirections: [],
        relationshipDynamics: [],
        conflicts: [],
        callbacks: [],
        characterGrowth: [],
        worldBuilding: [],
        comedy: [],
        dramaticTension: [],
        foreshadowing: [],
        all: []
      };
    }
  }
}

// Create singleton instance
const aiSuggestionService = new AISuggestionService();

export default aiSuggestionService;

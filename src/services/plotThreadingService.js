/**
 * Plot Threading Service
 * Complex plot thread management with dependencies and convergence tracking
 */

import aiService from './aiService';
import db from './database';

class PlotThreadingService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Analyze thread dependencies
   * @param {Array} plotThreads - Plot threads
   * @param {Array} chapters - Chapter array
   * @returns {Promise<Object>} Thread dependency analysis
   */
  async analyzeThreadDependencies(plotThreads, chapters = []) {
    try {
      const systemContext = `You are a plot threading expert.
Analyze which plot threads depend on others.
Identify: dependencies, prerequisites, thread relationships, blocking threads.`;

      const prompt = `Analyze plot thread dependencies:

Plot threads:
${JSON.stringify(plotThreads, null, 2)}

Chapters:
${chapters.map((ch, idx) => `${idx + 1}. ${ch.title || 'Untitled'}`).join('\n')}

Analyze:
1. Which threads depend on others
2. Prerequisites for thread resolution
3. Thread relationships
4. Blocking threads (threads that block others)
5. Independent threads

Return JSON:
{
  "dependencies": [
    {
      "threadId": "Thread ID or name",
      "dependsOn": ["Thread ID 1", "Thread ID 2"],
      "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
      "blocks": ["Thread ID that this blocks"],
      "relationship": "depends|blocks|parallel|independent"
    }
  ],
  "dependencyGraph": "Description of dependency structure",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { dependencies: [], dependencyGraph: '', suggestions: [] };
    } catch (error) {
      console.error('Error analyzing thread dependencies:', error);
      return { dependencies: [], dependencyGraph: '', suggestions: [] };
    }
  }

  /**
   * Detect thread convergence points
   * @param {Array} plotThreads - Plot threads
   * @param {Array} chapters - Chapter array
   * @returns {Promise<Array>} Convergence point suggestions
   */
  async detectThreadConvergence(plotThreads, chapters = []) {
    try {
      const systemContext = `You are a plot convergence expert.
Identify where plot threads should converge.
Consider: natural convergence points, dramatic moments, resolution opportunities.`;

      const prompt = `Detect thread convergence points:

Plot threads:
${JSON.stringify(plotThreads, null, 2)}

Chapters:
${chapters.map((ch, idx) => `${idx + 1}. ${ch.title || 'Untitled'}`).join('\n')}

Identify:
1. Natural convergence points
2. Where threads should meet
3. Dramatic convergence moments
4. Resolution opportunities
5. Convergence timing

Return JSON array:
[
  {
    "convergencePoint": "Where threads converge",
    "threads": ["Thread 1", "Thread 2"],
    "suggestedChapter": "Chapter number or range",
    "type": "dramatic|resolution|setup|climax",
    "impact": "Impact of convergence",
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const convergences = JSON.parse(jsonMatch[0]);
        return convergences.map((c, idx) => ({
          ...c,
          id: `converge_${Date.now()}_${idx}`,
          type: 'thread_convergence',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error detecting thread convergence:', error);
      return [];
    }
  }

  /**
   * Track thread resolution status
   * @param {Array} plotThreads - Plot threads
   * @param {Array} chapters - Chapter array
   * @returns {Promise<Array>} Thread health analysis
   */
  async trackThreadResolution(plotThreads, chapters = []) {
    try {
      const systemContext = `You are a plot thread health analyst.
Track thread resolution status and health.
Assess: completion status, resolution quality, thread health, resolution timing.`;

      const prompt = `Track thread resolution:

Plot threads:
${JSON.stringify(plotThreads, null, 2)}

Chapters:
${chapters.map((ch, idx) => `${idx + 1}. ${ch.title || 'Untitled'}`).join('\n')}

For each thread, assess:
1. Resolution status
2. Resolution quality
3. Thread health
4. Resolution timing
5. Issues or problems

Return JSON array:
[
  {
    "threadId": "Thread ID or name",
    "resolutionStatus": "resolved|ongoing|stalled|abandoned",
    "resolutionQuality": "excellent|good|adequate|poor|unresolved",
    "threadHealth": "healthy|concerning|critical",
    "resolutionTiming": "too_early|good|too_late|overdue",
    "issues": ["Issue 1", "Issue 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "priority": "high|medium|low",
    "confidence": 0.0-1.0
  }
]`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const resolutions = JSON.parse(jsonMatch[0]);
        return resolutions.map((r, idx) => ({
          ...r,
          id: `thread_res_${Date.now()}_${idx}`,
          type: 'thread_resolution',
          createdAt: Date.now(),
          source: 'ai_analysis'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error tracking thread resolution:', error);
      return [];
    }
  }

  /**
   * Map thread interconnections
   * @param {Array} plotThreads - Plot threads
   * @returns {Promise<Object>} Thread interconnection map
   */
  async mapThreadInterconnections(plotThreads) {
    try {
      const systemContext = `You are a plot interconnection expert.
Map how plot threads interconnect.
Identify: connections, shared elements, cross-thread influences, network structure.`;

      const prompt = `Map thread interconnections:

Plot threads:
${JSON.stringify(plotThreads, null, 2)}

Map:
1. How threads connect
2. Shared elements (characters, locations, themes)
3. Cross-thread influences
4. Network structure
5. Connection strength

Return JSON:
{
  "interconnections": [
    {
      "thread1": "Thread ID or name",
      "thread2": "Thread ID or name",
      "connectionType": "character|location|theme|event|causal",
      "connectionStrength": "strong|moderate|weak",
      "sharedElements": ["Element 1", "Element 2"],
      "influence": "How threads influence each other"
    }
  ],
  "networkStructure": "Description of network",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;

      const response = await aiService.callAI(prompt, 'analytical', systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { interconnections: [], networkStructure: '', suggestions: [] };
    } catch (error) {
      console.error('Error mapping thread interconnections:', error);
      return { interconnections: [], networkStructure: '', suggestions: [] };
    }
  }

  /**
   * Comprehensive plot threading analysis
   * @param {Array} plotThreads - Plot threads
   * @param {Array} chapters - Chapter array
   * @returns {Promise<Object>} Complete threading analysis
   */
  async analyzePlotThreading(plotThreads, chapters = []) {
    try {
      const [
        dependencies,
        convergences,
        resolutions,
        interconnections
      ] = await Promise.all([
        this.analyzeThreadDependencies(plotThreads, chapters),
        this.detectThreadConvergence(plotThreads, chapters),
        this.trackThreadResolution(plotThreads, chapters),
        this.mapThreadInterconnections(plotThreads)
      ]);

      return {
        dependencies,
        convergences,
        resolutions,
        interconnections,
        all: [
          ...(dependencies.dependencies || []),
          ...convergences,
          ...resolutions,
          ...(interconnections.interconnections || [])
        ]
      };
    } catch (error) {
      console.error('Error in comprehensive plot threading analysis:', error);
      return {
        dependencies: { dependencies: [], dependencyGraph: '', suggestions: [] },
        convergences: [],
        resolutions: [],
        interconnections: { interconnections: [], networkStructure: '', suggestions: [] },
        all: []
      };
    }
  }
}

// Create singleton instance
const plotThreadingService = new PlotThreadingService();

export default plotThreadingService;

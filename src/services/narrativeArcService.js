/**
 * Narrative Arc Service
 * Tracks where the story is in its narrative arc and provides
 * stage-appropriate guidance to the AI.
 *
 * This answers the question: "Where are we in the story?"
 * and adjusts AI behavior accordingly:
 *   - Early chapters: focus on setup, mystery, character introduction
 *   - Mid chapters: escalation, complications, revelations
 *   - Late chapters: climax, convergence, payoffs
 *
 * Also tracks tension curves, pacing rhythm, and identifies
 * structural problems (too much setup, missing midpoint, etc.)
 */

import db from './database';
import chapterMemoryService from './chapterMemoryService';

// --- Arc Stage Definitions ---

const ARC_STAGES = {
  SETUP: {
    name: 'Setup',
    position: 0.0,   // 0-15% of story
    maxPosition: 0.15,
    guidance: `NARRATIVE STAGE: SETUP (opening chapters)
Your job right now:
- Establish the world, the characters, and their ordinary lives
- Plant seeds (setups) that will pay off later — but subtly
- Build the reader's investment in characters before threatening them
- Introduce the story's central question or problem
- End scenes with HOOKS that make the reader curious

DO NOT: Rush to conflict. Exposition should be woven into action and dialogue, never delivered as lectures. Let the reader discover the world naturally.`,
    tensionRange: [10, 35],
    pacingBias: 'measured'
  },

  INCITING: {
    name: 'Inciting Incident',
    position: 0.10,
    maxPosition: 0.20,
    guidance: `NARRATIVE STAGE: INCITING INCIDENT
Your job right now:
- Something disrupts the status quo. The character's ordinary world is broken.
- This event should be IRREVERSIBLE — the character can't go back to how things were.
- The reader should feel "now the real story begins"
- Raise the central dramatic question of the story
- The character may resist the change initially

DO NOT: Make the inciting incident too small or reversible. It should change everything.`,
    tensionRange: [30, 60],
    pacingBias: 'accelerating'
  },

  RISING_ACTION: {
    name: 'Rising Action',
    position: 0.20,
    maxPosition: 0.45,
    guidance: `NARRATIVE STAGE: RISING ACTION (building complications)
Your job right now:
- Each chapter should raise the stakes. Things get harder, more complex, more urgent.
- Introduce COMPLICATIONS — not just obstacles, but ones that force difficult choices
- Develop relationships under pressure (alliances form, friendships are tested)
- Alternate between action and reflection — give the reader peaks and valleys
- Build toward the midpoint by making the current approach seem like it might work... then pull the rug

DO NOT: Let tension plateau. Each scene should feel like it matters more than the last. Avoid "wheel-spinning" where characters are busy but nothing changes.`,
    tensionRange: [35, 70],
    pacingBias: 'building'
  },

  MIDPOINT: {
    name: 'Midpoint',
    position: 0.45,
    maxPosition: 0.55,
    guidance: `NARRATIVE STAGE: MIDPOINT (the story shifts)
Your job right now:
- Something fundamentally changes. The character goes from reactive to proactive, or vice versa.
- A major revelation reframes everything the reader thought they knew
- The stakes become PERSONAL — it's no longer just about the mission, it's about the character's identity
- False victory or false defeat: either things seem to go right (then collapse) or everything falls apart (then a glimmer of hope)
- The theme of the story should crystallize here

DO NOT: Make this feel like "just another chapter." The midpoint should feel like a different story beginning within the first story.`,
    tensionRange: [55, 80],
    pacingBias: 'pivoting'
  },

  COMPLICATIONS: {
    name: 'Deepening Complications',
    position: 0.55,
    maxPosition: 0.75,
    guidance: `NARRATIVE STAGE: DEEPENING COMPLICATIONS (things get worse)
Your job right now:
- The antagonist (or opposing force) is winning. The character's plans are failing.
- Allies are lost, resources dwindle, time runs out
- Internal conflicts surface — the character must confront their flaws
- Subplots should be CONVERGING toward the main plot
- Every scene should close a door. Options narrow.
- Betrayals, reversals, and hard truths belong here

DO NOT: Introduce major new elements. Everything should come from what was already established. Pay off setups planted earlier.`,
    tensionRange: [60, 85],
    pacingBias: 'tightening'
  },

  DARK_MOMENT: {
    name: 'Dark Night of the Soul',
    position: 0.75,
    maxPosition: 0.85,
    guidance: `NARRATIVE STAGE: DARK MOMENT (all is lost)
Your job right now:
- This is the lowest point. Everything seems hopeless.
- The character faces the CORE TRUTH they've been avoiding all story
- Relationships are at their most strained
- The reader should genuinely believe failure is possible
- The character must choose: give up or find a new way forward
- What they learn here IS the theme of the story

DO NOT: Make this feel artificial. The despair must be earned by everything that came before. And leave room for the character to discover something that changes everything — but DON'T solve it yet.`,
    tensionRange: [70, 95],
    pacingBias: 'compressing'
  },

  CLIMAX: {
    name: 'Climax',
    position: 0.85,
    maxPosition: 0.95,
    guidance: `NARRATIVE STAGE: CLIMAX (the final confrontation)
Your job right now:
- Everything converges. All plot threads meet.
- The character applies what they learned in the dark moment
- The action should feel INEVITABLE — every choice in the story led here
- Stakes are at their highest. The reader can't look away.
- Callbacks to earlier moments should land with maximum impact
- The central dramatic question gets its answer

DO NOT: Introduce new information. Everything the character needs was already established. No deus ex machina. The resolution must come from within the story.`,
    tensionRange: [85, 100],
    pacingBias: 'maximum'
  },

  RESOLUTION: {
    name: 'Resolution',
    position: 0.95,
    maxPosition: 1.0,
    guidance: `NARRATIVE STAGE: RESOLUTION (new equilibrium)
Your job right now:
- Show the new status quo. The world has changed.
- Characters reflect on what happened. Relationships settle into new dynamics.
- Tie up loose ends — but NOT all of them. Some mystery is good.
- Echo the opening in some way (mirror scenes show how far the character has come)
- Leave the reader satisfied but thinking

DO NOT: Rush this. The reader needs time to process the climax. Don't over-explain what the story meant. Let the reader feel it.`,
    tensionRange: [20, 40],
    pacingBias: 'releasing'
  }
};

class NarrativeArcService {
  /**
   * Detect where the story currently is in its narrative arc.
   * Uses chapter position, tension analysis, and plot thread status.
   *
   * @param {string} bookId
   * @param {number} currentChapter - the chapter number being written
   * @param {number} totalChapters - total planned chapters (0 = unknown)
   * @returns {object} arc stage info with guidance
   */
  async detectArcPosition(bookId, currentChapter, totalChapters = 0) {
    // If we know total chapters, use position-based detection
    if (totalChapters > 0) {
      const position = currentChapter / totalChapters;
      return this._getStageForPosition(position, currentChapter, totalChapters);
    }

    // Otherwise, estimate from chapter memories and content signals
    return this._estimateFromContent(bookId, currentChapter);
  }

  /**
   * Get narrative guidance for the current arc position.
   * This is what gets injected into the AI context.
   */
  async getArcGuidance(bookId, currentChapter, totalChapters = 0) {
    const arcInfo = await this.detectArcPosition(bookId, currentChapter, totalChapters);

    const parts = [arcInfo.stage.guidance];

    // Add pacing directive
    parts.push(`\nPACING: ${this._getPacingDirective(arcInfo.stage.pacingBias)}`);

    // Add tension target
    const [minTension, maxTension] = arcInfo.stage.tensionRange;
    parts.push(`TENSION TARGET: Aim for ${minTension}-${maxTension}% tension in this chapter.`);

    // Add arc-specific notes based on chapter memories
    if (arcInfo.notes) {
      parts.push(`\nARC NOTES:\n${arcInfo.notes}`);
    }

    return {
      stageName: arcInfo.stage.name,
      guidance: parts.join('\n'),
      position: arcInfo.position,
      stage: arcInfo.stage,
      tensionTarget: { min: minTension, max: maxTension }
    };
  }

  /**
   * Analyze the story's structural health.
   * Identifies pacing problems, missing beats, and opportunities.
   */
  async analyzeStructuralHealth(bookId) {
    const memories = await chapterMemoryService.getAllMemories(bookId);
    if (memories.length < 2) {
      return { status: 'too_early', message: 'Need at least 2 chapters for structural analysis' };
    }

    const issues = [];
    const strengths = [];

    // Check tension curve
    const tensions = memories.map(m => ({
      chapter: m.chapterNumber,
      hasConflict: (m.tensions?.length || 0) > 0,
      hasSetup: (m.setups?.length || 0) > 0,
      endingState: m.endingState
    }));

    // Check for flat tension (multiple chapters with no conflict)
    let flatStreak = 0;
    for (const t of tensions) {
      if (!t.hasConflict) {
        flatStreak++;
        if (flatStreak >= 3) {
          issues.push({
            type: 'pacing',
            severity: 'warning',
            message: `Chapters ${t.chapter - 2}-${t.chapter} have no active tensions. The story may feel stagnant.`,
            suggestion: 'Introduce a complication, deadline, or interpersonal conflict.'
          });
        }
      } else {
        flatStreak = 0;
      }
    }

    // Check for unresolved setups (Chekhov's guns)
    const allSetups = memories.flatMap(m => (m.setups || []).map(s => ({
      setup: s, chapter: m.chapterNumber
    })));

    if (allSetups.length > 0 && memories.length > 5) {
      const oldSetups = allSetups.filter(s => s.chapter < memories.length - 3);
      if (oldSetups.length > 3) {
        issues.push({
          type: 'payoff',
          severity: 'info',
          message: `${oldSetups.length} setups from early chapters haven't paid off yet.`,
          suggestion: 'Consider resolving some of these: ' + oldSetups.slice(0, 3).map(s => s.setup).join('; ')
        });
      }
    }

    // Check chapter ending variety
    const endingTypes = memories.map(m => m.endingState).filter(Boolean);
    const uniqueEndings = new Set(endingTypes);
    if (endingTypes.length > 4 && uniqueEndings.size < 3) {
      issues.push({
        type: 'variety',
        severity: 'info',
        message: 'Chapter endings feel repetitive. Vary between cliffhangers, emotional beats, revelations, and quiet moments.',
        suggestion: 'Try ending the next chapter with a different type of beat.'
      });
    }

    // Positive observations
    if (allSetups.length > 2) {
      strengths.push('Good use of setups and foreshadowing');
    }

    const decisionChapters = memories.filter(m => (m.decisions?.length || 0) > 0);
    if (decisionChapters.length / memories.length > 0.3) {
      strengths.push('Characters are making meaningful decisions regularly');
    }

    return {
      status: 'analyzed',
      chapterCount: memories.length,
      issues,
      strengths,
      unresolvedSetups: allSetups.length,
      activeTensions: memories[memories.length - 1]?.tensions?.length || 0
    };
  }

  // --- Internal ---

  _getStageForPosition(position, currentChapter, totalChapters) {
    for (const [key, stage] of Object.entries(ARC_STAGES)) {
      if (position >= stage.position && position < stage.maxPosition) {
        return {
          stage,
          position,
          chapterInStage: currentChapter,
          totalChapters,
          notes: `You are writing chapter ${currentChapter} of ${totalChapters} (${Math.round(position * 100)}% through the story).`
        };
      }
    }
    // Default to resolution if we're past all stages
    return {
      stage: ARC_STAGES.RESOLUTION,
      position,
      chapterInStage: currentChapter,
      totalChapters,
      notes: `You are in the final stretch — chapter ${currentChapter} of ${totalChapters}.`
    };
  }

  async _estimateFromContent(bookId, currentChapter) {
    const memories = await chapterMemoryService.getAllMemories(bookId);

    // No memories — assume early setup
    if (memories.length === 0) {
      return {
        stage: currentChapter <= 2 ? ARC_STAGES.SETUP : ARC_STAGES.RISING_ACTION,
        position: 0,
        notes: 'No chapter memories available. Estimating arc position from chapter number.'
      };
    }

    // Heuristic: analyze content signals from memories
    const totalSetups = memories.reduce((sum, m) => sum + (m.setups?.length || 0), 0);
    const totalTensions = memories.reduce((sum, m) => sum + (m.tensions?.length || 0), 0);
    const hasForwardHooks = memories.some(m => (m.forwardHooks?.length || 0) > 0);
    const lastMemory = memories[memories.length - 1];

    // Simple heuristic based on chapter count and content
    if (currentChapter <= 2) {
      return { stage: ARC_STAGES.SETUP, position: 0.05, notes: 'Early chapters — establishing the world.' };
    }
    if (currentChapter <= 4 && totalTensions < 3) {
      return { stage: ARC_STAGES.INCITING, position: 0.15, notes: 'Disruption phase — something should change the status quo.' };
    }

    // Look at the trend of tensions
    const recentTensionCount = memories.slice(-3).reduce((sum, m) => sum + (m.tensions?.length || 0), 0);
    const earlyTensionCount = memories.slice(0, 3).reduce((sum, m) => sum + (m.tensions?.length || 0), 0);

    if (recentTensionCount > earlyTensionCount * 2) {
      // Tensions are escalating
      if (lastMemory?.endingState?.includes('cliff') || lastMemory?.endingState?.includes('tense')) {
        return { stage: ARC_STAGES.COMPLICATIONS, position: 0.65, notes: 'Tensions escalating. Complications deepening.' };
      }
      return { stage: ARC_STAGES.RISING_ACTION, position: 0.35, notes: 'Stakes rising. Maintain escalation.' };
    }

    // Default to rising action for unknown position
    return {
      stage: ARC_STAGES.RISING_ACTION,
      position: 0.30,
      notes: `Chapter ${currentChapter} with ${totalSetups} active setups and ${totalTensions} tensions.`
    };
  }

  _getPacingDirective(bias) {
    const directives = {
      measured: 'Take your time. Let scenes breathe. Establish before you escalate.',
      accelerating: 'Speed is increasing. Scenes should feel more urgent than before.',
      building: 'Steady escalation. Each scene slightly faster, slightly higher stakes.',
      pivoting: 'This is a turning point. Slow down for the revelation, then snap to new energy.',
      tightening: 'Things are closing in. Shorter scenes, fewer escape routes, mounting pressure.',
      compressing: 'Maximum compression. Every word should carry weight. No filler.',
      maximum: 'Full speed. Short sentences. High stakes. No breaks.',
      releasing: 'Slow down. Let the reader breathe. Reflection, not action.'
    };
    return directives[bias] || directives.building;
  }
}

const narrativeArcService = new NarrativeArcService();
export default narrativeArcService;

/**
 * Button Tooltips Database
 * Comprehensive tooltip content for all buttons in WritingCanvasPro
 * Includes descriptions, tips, keyboard shortcuts, and tutorial content
 */

export const buttonTooltips = {
  // ============================================
  // AI GENERATION BUTTONS
  // ============================================
  
  continueWriting: {
    id: 'continue-writing',
    title: 'Continue Writing',
    description: 'AI writes the next 2-3 paragraphs continuing from your cursor position',
    detailedDescription: 'The AI analyzes your chapter content up to the cursor position and generates a natural continuation that matches your writing style. It uses your style profile, character voices, and story context to maintain consistency.',
    tips: [
      'Place your cursor where you want the AI to continue from',
      'The AI reads up to 2000 characters before the cursor for context',
      'Generated content appears in a preview panel for review before insertion',
      'Works best when you have at least a few paragraphs of context',
      'The AI matches your style profile automatically'
    ],
    keyboardShortcut: null,
    tutorialStep: 1,
    styleIntegration: true,
    usesContext: true
  },

  generateScene: {
    id: 'generate-scene',
    title: 'Generate Scene',
    description: 'Generate a complete scene based on your plot beats and story context',
    detailedDescription: 'Creates a full 3-5 paragraph scene that addresses your next uncompleted plot beat. The AI uses your plot beats, character information, and style profile to generate engaging, contextually appropriate scenes.',
    tips: [
      'Works best when you have plot beats defined for this chapter',
      'The AI automatically selects the next uncompleted plot beat',
      'Generated scenes match your writing style and tone',
      'Review the preview before inserting to ensure it fits',
      'You can regenerate if the first attempt doesn\'t match your vision'
    ],
    keyboardShortcut: null,
    tutorialStep: 2,
    styleIntegration: true,
    usesContext: true
  },

  addDialogue: {
    id: 'add-dialogue',
    title: 'Add Dialogue',
    description: 'Add a conversation between characters with distinct voices',
    detailedDescription: 'Generates a 4-8 line dialogue exchange between characters. Each character speaks with their unique voice profile, matching their personality, speech patterns, and vocabulary choices from your character definitions.',
    tips: [
      'The AI uses character voice profiles to make dialogue authentic',
      'Selects characters from your story automatically',
      'Dialogue matches the tone and style of your chapter',
      'Review the preview to ensure character voices sound right',
      'You can edit the dialogue after insertion'
    ],
    keyboardShortcut: null,
    tutorialStep: 3,
    styleIntegration: true,
    usesContext: true
  },

  addDescription: {
    id: 'add-description',
    title: 'Add Description',
    description: 'Add rich sensory details and atmospheric description',
    detailedDescription: 'Generates 1-2 paragraphs of vivid, sensory-rich description. Focuses on sight, sound, smell, texture, and atmosphere to immerse readers in the scene while matching your writing style.',
    tips: [
      'Best used when you need to add atmosphere to a scene',
      'The AI focuses on sensory details (sight, sound, smell, touch)',
      'Description matches the mood and tone of surrounding text',
      'Use this to break up dialogue or action-heavy sections',
      'Review the preview to ensure it enhances rather than slows pacing'
    ],
    keyboardShortcut: null,
    tutorialStep: 4,
    styleIntegration: true,
    usesContext: true
  },

  addCharacter: {
    id: 'add-character',
    title: 'Add Character',
    description: 'Introduce a new character with an engaging entrance',
    detailedDescription: 'Generates 1-2 paragraphs introducing a new character entering the scene. The introduction is memorable, fits your story\'s style, and provides enough detail to make the character feel real.',
    tips: [
      'Use this when a new character needs to enter the scene',
      'The AI creates character introductions that match your style',
      'Consider using the Entity Extraction Wizard after to create the character profile',
      'Review the preview to ensure the character feels right for your story',
      'You can enhance the character later with the Character Enhancement feature'
    ],
    keyboardShortcut: null,
    tutorialStep: 5,
    styleIntegration: true,
    usesContext: true
  },

  review: {
    id: 'review',
    title: 'Review',
    description: 'Check your chapter for consistency, pacing, and style issues',
    detailedDescription: 'Analyzes your chapter text and provides specific, actionable suggestions for improvement. Checks for flow, dialogue quality, description balance, character voice consistency, grammar, and style issues.',
    tips: [
      'Best used after writing a substantial portion of the chapter',
      'Reviews the last 3000 characters of your chapter',
      'Provides specific suggestions with examples',
      'Suggestions appear in the Review Panel',
      'You can accept or reject each suggestion individually'
    ],
    keyboardShortcut: null,
    tutorialStep: 6,
    styleIntegration: true,
    usesContext: true
  },

  // ============================================
  // TEXT SELECTION TOOLS
  // ============================================

  rewrite: {
    id: 'rewrite',
    title: 'Rewrite',
    description: 'Rewrite selected text with improved clarity and style',
    detailedDescription: 'Takes your selected text and rewrites it while keeping the same meaning. Improves clarity, flow, and style while matching your writing voice profile exactly.',
    tips: [
      'Select the text you want to rewrite',
      'The AI maintains the original meaning while improving expression',
      'Matches your style profile automatically',
      'Review the preview before accepting',
      'Works best with 1-3 paragraphs of text'
    ],
    keyboardShortcut: null,
    tutorialStep: 7,
    styleIntegration: true,
    usesContext: true
  },

  expand: {
    id: 'expand',
    title: 'Expand',
    description: 'Add more detail and description to selected text',
    detailedDescription: 'Expands your selected text by adding more detail, description, and depth. Maintains your writing style while enriching the content with additional context and sensory details.',
    tips: [
      'Select text that needs more detail',
      'The AI adds description while maintaining your style',
      'Great for scenes that feel too sparse',
      'Review the preview to ensure it doesn\'t slow pacing too much',
      'You can always trim it down after insertion'
    ],
    keyboardShortcut: null,
    tutorialStep: 8,
    styleIntegration: true,
    usesContext: true
  },

  makeFunnier: {
    id: 'make-funnier',
    title: 'Make Funnier',
    description: 'Add wit, absurd details, and comedic timing',
    detailedDescription: 'Rewrites selected text to be funnier while keeping the plot intact. Adds wit, sarcasm, absurd details, and comedic timing that matches your humor style from the style profile.',
    tips: [
      'Select text that could benefit from humor',
      'The AI uses your comedy rules from the style profile',
      'Maintains the plot while adding humor',
      'Review to ensure the humor fits your story\'s tone',
      'Works best with dialogue and character interactions'
    ],
    keyboardShortcut: null,
    tutorialStep: 9,
    styleIntegration: true,
    usesContext: true
  },

  makeDarker: {
    id: 'make-darker',
    title: 'Make Darker',
    description: 'Add dread, unease, and horror undertones',
    detailedDescription: 'Rewrites selected text to be darker and more ominous. Adds dread, unease, and horror undertones while maintaining your writing style and story consistency.',
    tips: [
      'Select text that needs more tension or darkness',
      'The AI adds horror elements that match your style',
      'Great for building tension in scenes',
      'Review to ensure it doesn\'t go too dark for your story',
      'Works well with descriptions and atmosphere'
    ],
    keyboardShortcut: null,
    tutorialStep: 10,
    styleIntegration: true,
    usesContext: true
  },

  interjectEntity: {
    id: 'interject-entity',
    title: 'Interject Entity',
    description: 'Interject an entity (actor, item, skill, etc.) into selected text',
    detailedDescription: 'Allows you to naturally insert an actor, item, skill, location, or event into your selected paragraph. The AI generates text that seamlessly weaves the entity into the existing text with your chosen mood.',
    tips: [
      'Select the paragraph where you want to add an entity',
      'Choose the entity type (actor, item, skill, location, event)',
      'Select or create the specific entity',
      'Choose a mood to control how the entity is introduced',
      'Review placement options (replace, insert before/after, blend)',
      'The AI matches your writing style automatically'
    ],
    keyboardShortcut: 'Ctrl+I (Cmd+I on Mac)',
    tutorialStep: 11,
    styleIntegration: true,
    usesContext: true
  },

  // ============================================
  // MOOD REWRITE BUTTONS
  // ============================================

  moodComedy: {
    id: 'mood-comedy',
    title: 'Comedy Mood',
    description: 'Rewrite with comedy: Funnier, absurd, casual',
    detailedDescription: 'Rewrites selected text with a comedic tone. Adds humor, absurdity, and a casual voice while maintaining your story\'s style and plot.',
    tips: [
      'Select text that could benefit from humor',
      'Matches your comedy style from the style profile',
      'Great for dialogue and character interactions',
      'Review to ensure it fits the scene'
    ],
    keyboardShortcut: null,
    tutorialStep: 12,
    styleIntegration: true,
    usesContext: true
  },

  moodHorror: {
    id: 'mood-horror',
    title: 'Horror Mood',
    description: 'Rewrite with horror: Dark, tense, unsettling',
    detailedDescription: 'Rewrites selected text with a horror tone. Adds darkness, tension, and unsettling atmosphere while maintaining your writing style.',
    tips: [
      'Select text that needs more tension',
      'Great for building suspense',
      'Matches your horror style from the style profile',
      'Review to ensure it doesn\'t go too dark'
    ],
    keyboardShortcut: null,
    tutorialStep: 13,
    styleIntegration: true,
    usesContext: true
  },

  moodTense: {
    id: 'mood-tense',
    title: 'Tense Mood',
    description: 'Rewrite with tension: High tension, urgent, fast-paced',
    detailedDescription: 'Rewrites selected text to increase tension. Makes it more urgent and fast-paced while maintaining your writing style.',
    tips: [
      'Select text that needs more urgency',
      'Great for action scenes',
      'Increases pacing and tension',
      'Review to ensure it fits the scene'
    ],
    keyboardShortcut: null,
    tutorialStep: 14,
    styleIntegration: true,
    usesContext: true
  },

  moodRelaxed: {
    id: 'mood-relaxed',
    title: 'Relaxed Mood',
    description: 'Rewrite with relaxation: Calm, slow, detailed',
    detailedDescription: 'Rewrites selected text with a relaxed, calm tone. Slows pacing and adds more detail while maintaining your writing style.',
    tips: [
      'Select text that needs to slow down',
      'Great for contemplative moments',
      'Adds more detail and atmosphere',
      'Review to ensure it doesn\'t slow pacing too much'
    ],
    keyboardShortcut: null,
    tutorialStep: 15,
    styleIntegration: true,
    usesContext: true
  },

  // ============================================
  // UI TOGGLE BUTTONS
  // ============================================

  save: {
    id: 'save',
    title: 'Save & Extract',
    description: 'Save chapter and extract entities',
    detailedDescription: 'Saves your chapter content and automatically extracts entities (actors, items, skills) mentioned in the text. Opens the Entity Extraction Wizard to review and create/update entities.',
    tips: [
      'Saves your chapter content to the database',
      'Automatically extracts entities from the text',
      'Opens the Entity Extraction Wizard for review',
      'Use this regularly to ensure entities are tracked',
      'The wizard helps you create new entities and track upgrades'
    ],
    keyboardShortcut: 'Ctrl+S (Cmd+S on Mac)',
    tutorialStep: 16,
    styleIntegration: false,
    usesContext: false
  },

  undo: {
    id: 'undo',
    title: 'Undo',
    description: 'Undo last change',
    detailedDescription: 'Reverts the last change made to your chapter content. Works with both direct edits and AI-generated content insertions.',
    tips: [
      'Undoes the most recent change',
      'Works with both manual edits and AI insertions',
      'Can undo multiple times',
      'Use Redo to restore undone changes'
    ],
    keyboardShortcut: 'Ctrl+Z (Cmd+Z on Mac)',
    tutorialStep: null,
    styleIntegration: false,
    usesContext: false
  },

  redo: {
    id: 'redo',
    title: 'Redo',
    description: 'Redo last undone change',
    detailedDescription: 'Restores the last change that was undone. Allows you to toggle between different versions of your content.',
    tips: [
      'Restores the last undone change',
      'Use after Undo to restore content',
      'Can redo multiple times',
      'Works with both manual edits and AI insertions'
    ],
    keyboardShortcut: 'Ctrl+Y or Ctrl+Shift+Z (Cmd+Shift+Z on Mac)',
    tutorialStep: null,
    styleIntegration: false,
    usesContext: false
  },

  focusMode: {
    id: 'focus-mode',
    title: 'Focus Mode',
    description: 'Dim everything except current paragraph',
    detailedDescription: 'Enters focus mode, dimming all content except the paragraph you\'re currently working on. Helps reduce distractions and focus on one section at a time.',
    tips: [
      'Click to toggle focus mode on/off',
      'Highlights only the current paragraph',
      'Great for detailed editing',
      'Exit with Escape key or button click'
    ],
    keyboardShortcut: 'F',
    tutorialStep: null,
    styleIntegration: false,
    usesContext: false
  },

  fullscreen: {
    id: 'fullscreen',
    title: 'Fullscreen',
    description: 'Enter fullscreen writing mode',
    detailedDescription: 'Expands the writing area to fullscreen, hiding all panels and distractions. Provides a clean, distraction-free writing environment.',
    tips: [
      'Click to toggle fullscreen mode',
      'Hides all panels and UI elements',
      'Perfect for distraction-free writing',
      'Exit with Escape key or button click'
    ],
    keyboardShortcut: 'F11',
    tutorialStep: null,
    styleIntegration: false,
    usesContext: false
  },

  // ============================================
  // WRITING ENHANCEMENT FEATURES
  // ============================================

  checkContinuity: {
    id: 'check-continuity',
    title: 'Check Continuity',
    description: 'Analyze text for inconsistencies with previous chapters',
    detailedDescription: 'Checks selected text (or recent chapter content) for inconsistencies with previous chapters. Flags character appearance changes, item ownership conflicts, stat changes, location issues, and timeline problems.',
    tips: [
      'Select text to check, or leave unselected to check recent content',
      'Compares against the last 5 chapters',
      'Flags inconsistencies with severity levels',
      'Provides suggested fixes',
      'Review each issue and apply fixes as needed'
    ],
    keyboardShortcut: null,
    tutorialStep: 17,
    styleIntegration: true,
    usesContext: true
  },

  analyzePacing: {
    id: 'analyze-pacing',
    title: 'Analyze Pacing',
    description: 'Analyze chapter pacing and suggest improvements',
    detailedDescription: 'Analyzes your chapter\'s pacing by examining sentence lengths, paragraph structure, dialogue vs action vs description ratios, and overall rhythm. Provides metrics and suggestions for improvement.',
    tips: [
      'Analyzes the entire chapter',
      'Provides metrics on sentence/paragraph length',
      'Shows dialogue/action/description ratios',
      'Identifies pacing issues',
      'Suggests where to add or remove content'
    ],
    keyboardShortcut: null,
    tutorialStep: 18,
    styleIntegration: false,
    usesContext: true
  },

  trackEmotionalBeats: {
    id: 'track-emotional-beats',
    title: 'Track Emotional Beats',
    description: 'Track emotional beats in chapter',
    detailedDescription: 'Identifies emotional beats throughout your chapter - moments of high emotion, tension, relief, anticipation, etc. Creates a visual timeline of the emotional arc.',
    tips: [
      'Analyzes the entire chapter',
      'Identifies emotional moments',
      'Creates a timeline of emotional intensity',
      'Helps ensure good emotional pacing',
      'Shows where to heighten or reduce tension'
    ],
    keyboardShortcut: null,
    tutorialStep: 19,
    styleIntegration: true,
    usesContext: true
  }
};

/**
 * Get tooltip content for a button
 * @param {string} buttonId - The button ID
 * @param {Object} context - Current app context (for context-aware tips)
 * @param {boolean} tutorialMode - Whether to show tutorial content
 * @returns {Object} Tooltip content
 */
export const getTooltip = (buttonId, context = {}, tutorialMode = false) => {
  const tooltip = buttonTooltips[buttonId];
  if (!tooltip) return null;

  const content = {
    ...tooltip,
    contextAwareTip: getContextAwareTip(buttonId, context),
    tutorialContent: tutorialMode ? getTutorialContent(buttonId) : null
  };

  return content;
};

/**
 * Get context-aware tip based on current app state
 */
const getContextAwareTip = (buttonId, context) => {
  const { hasSelection, hasContent, isGenerating, chapterLength } = context;

  switch (buttonId) {
    case 'continue-writing':
      if (!hasContent) return 'Start writing some content first, then use Continue to let AI take over.';
      if (chapterLength < 100) return 'Write at least a paragraph for better context.';
      return null;

    case 'rewrite':
    case 'expand':
    case 'make-funnier':
    case 'make-darker':
      if (!hasSelection) return 'Select some text first to use this feature.';
      return null;

    case 'interject-entity':
      if (!hasSelection) return 'Select a paragraph first, then right-click or use Ctrl+I.';
      return null;

    case 'generate-scene':
      if (!hasContent) return 'Write some content first to provide context for scene generation.';
      return null;

    default:
      return null;
  }
};

/**
 * Get tutorial content for a button
 */
const getTutorialContent = (buttonId) => {
  const tooltip = buttonTooltips[buttonId];
  if (!tooltip || !tooltip.tutorialStep) return null;

  return {
    step: tooltip.tutorialStep,
    title: `Step ${tooltip.tutorialStep}: ${tooltip.title}`,
    description: tooltip.detailedDescription,
    tips: tooltip.tips,
    nextStep: getNextTutorialStep(tooltip.tutorialStep)
  };
};

/**
 * Get next tutorial step
 */
const getNextTutorialStep = (currentStep) => {
  const steps = Object.values(buttonTooltips)
    .filter(t => t.tutorialStep)
    .sort((a, b) => a.tutorialStep - b.tutorialStep)
    .map(t => t.tutorialStep);

  const currentIndex = steps.indexOf(currentStep);
  return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
};

export default buttonTooltips;

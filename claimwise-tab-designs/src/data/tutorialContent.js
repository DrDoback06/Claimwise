/**
 * Tutorial Content - Step definitions for tutorials and guided tours
 */

export const writersRoomTutorialSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Writer\'s Room',
    description: 'The Writer\'s Room is your AI-powered writing environment.',
    content: 'Key features include AI assistance, entity extraction, and style editing.'
  },
  {
    id: 'writing',
    title: 'Writing Your Chapter',
    description: 'Start writing in the main editor.',
    tips: [
      'Right-click anywhere in the editor for AI tools',
      'Select text and right-click for rewrite options',
      'Use Ctrl+S (Cmd+S) to save and extract entities'
    ]
  },
  {
    id: 'ai-assist',
    title: 'AI Assistant',
    description: 'The AI Assistant provides context-aware help.',
    tips: [
      'Click "AI ASSIST" or right-click in the editor',
      'Continue Writing - AI continues from your cursor',
      'Generate Scene - Creates complete scenes',
      'Add Dialogue - Generates character conversations'
    ]
  },
  {
    id: 'mood-editor',
    title: 'Mood Editor',
    description: 'Adjust the tone and style of your writing.',
    tips: [
      'Select text and click "MOOD EDITOR"',
      'Use quick presets or advanced sliders',
      'Preview changes before applying'
    ]
  },
  {
    id: 'context',
    title: 'Context Management',
    description: 'Select relevant chapters for AI context.',
    tips: [
      'Select chapters from the sidebar',
      'Use "Smart Context" to auto-suggest',
      'Context affects AI generation quality'
    ]
  },
  {
    id: 'extraction',
    title: 'Entity Extraction',
    description: 'Automatic extraction when you save.',
    tips: [
      'Automatically detects characters, items, skills',
      'Review and confirm before adding',
      'Updates character stats and relationships'
    ]
  }
];

export const writersRoomGuidedTourSteps = [
  {
    targetSelector: 'textarea',
    title: 'Main Editor',
    message: 'This is where you write your chapter. Right-click for AI tools!',
    position: 'top'
  },
  {
    targetSelector: '[title*="AI ASSIST"]',
    title: 'AI Assistant',
    message: 'Click here or right-click in the editor to access AI tools.',
    position: 'bottom'
  },
  {
    targetSelector: '[title*="MOOD EDITOR"]',
    title: 'Mood Editor',
    message: 'Select text and click here to adjust tone and style.',
    position: 'bottom'
  },
  {
    targetSelector: '[title*="SAVE & EXTRACT"]',
    title: 'Save & Extract',
    message: 'Save your chapter and automatically extract entities.',
    position: 'left'
  }
];

export const characterManagementTutorialSteps = [
  {
    id: 'overview',
    title: 'Character Overview',
    description: 'View character stats, biography, and basic information.',
    content: 'The Overview tab shows all essential character information at a glance.'
  },
  {
    id: 'timeline',
    title: 'Character Timeline',
    description: 'See all character appearances and changes over time.',
    content: 'Track when characters appear, change stats, acquire items, and more.'
  },
  {
    id: 'relationships',
    title: 'Relationships',
    description: 'Visual network of character relationships.',
    content: 'See how characters connect and interact with each other.'
  },
  {
    id: 'dialogue',
    title: 'Dialogue Analysis',
    description: 'Analyze character speech patterns and voice consistency.',
    content: 'Ensure characters have distinct voices and consistent dialogue.'
  }
];

export const storyAnalysisTutorialSteps = [
  {
    id: 'consistency',
    title: 'Consistency Checker',
    description: 'Find contradictions and plot holes.',
    content: 'AI-powered system detects inconsistencies across your story.'
  },
  {
    id: 'plotthreads',
    title: 'Plot Threads',
    description: 'Track and manage multiple storylines.',
    content: 'Ensure all plot threads are properly developed and resolved.'
  }
];

export default {
  writersRoomTutorialSteps,
  writersRoomGuidedTourSteps,
  characterManagementTutorialSteps,
  storyAnalysisTutorialSteps
};

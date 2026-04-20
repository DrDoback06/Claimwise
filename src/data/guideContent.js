/**
 * Guide Content - Step-by-step guide definitions for all features
 */

export const writersRoomGuide = {
  title: 'Writer\'s Room Complete Guide',
  steps: [
    {
      title: 'Getting Started',
      description: 'Learn the basics of the Writer\'s Room interface.',
      steps: [
        {
          title: 'Select a Chapter',
          description: 'Choose a book and chapter from the sidebar to start writing.'
        },
        {
          title: 'Start Writing',
          description: 'Type directly in the main editor. Your work is auto-saved.'
        },
        {
          title: 'Access AI Tools',
          description: 'Right-click in the editor or click "AI ASSIST" for AI-powered help.'
        }
      ]
    },
    {
      title: 'Using AI Features',
      description: 'Master the AI-powered writing assistance.',
      steps: [
        {
          title: 'Continue Writing',
          description: 'Place your cursor and use "Continue Writing" to have AI write the next paragraphs.'
        },
        {
          title: 'Generate Scenes',
          description: 'Use "Generate Scene" to create complete 3-5 paragraph scenes based on your plot.'
        },
        {
          title: 'Add Dialogue',
          description: 'Generate character conversations with "Add Dialogue".'
        },
        {
          title: 'Enhance Text',
          description: 'Select text and use enhancement options: Make Funnier, Make Darker, Add Detail, Tighten Prose.'
        }
      ],
      tips: [
        'AI uses context from selected chapters for better results',
        'Review AI-generated content before accepting',
        'Use style guide integration for consistent tone'
      ]
    },
    {
      title: 'Mood Editor',
      description: 'Adjust the tone and style of your writing.',
      steps: [
        {
          title: 'Select Text',
          description: 'Highlight the text you want to modify.'
        },
        {
          title: 'Open Mood Editor',
          description: 'Click "MOOD EDITOR" button or use the context menu.'
        },
        {
          title: 'Choose Preset or Customize',
          description: 'Use quick presets (Comedy, Horror, Tense, etc.) or adjust sliders for fine control.'
        },
        {
          title: 'Preview and Apply',
          description: 'Review the preview and click "Apply" to replace the text.'
        }
      ],
      tips: [
        'Quick presets are great for rapid tone changes',
        'Advanced sliders give precise control over mood',
        'Preview helps ensure the rewrite matches your vision'
      ]
    },
    {
      title: 'Context Management',
      description: 'Select relevant chapters to improve AI generation quality.',
      steps: [
        {
          title: 'View Available Chapters',
          description: 'See all chapters in the left sidebar.'
        },
        {
          title: 'Select Chapters',
          description: 'Click chapters to add them to context. Selected chapters appear in the context panel.'
        },
        {
          title: 'Use Smart Context',
          description: 'Click "Suggest Context" to have AI automatically find relevant chapters.'
        },
        {
          title: 'Review Context Summary',
          description: 'Check the context summary to see what entities are included.'
        }
      ],
      tips: [
        'More context = better AI generation',
        'Include recent chapters for continuity',
        'Smart Context saves time finding relevant chapters'
      ]
    },
    {
      title: 'Entity Extraction',
      description: 'Automatically extract characters, items, and skills from your writing.',
      steps: [
        {
          title: 'Write Your Chapter',
          description: 'Write your chapter content as normal.'
        },
        {
          title: 'Save & Extract',
          description: 'Click "SAVE & EXTRACT" or press Ctrl+S (Cmd+S).'
        },
        {
          title: 'Review Detected Entities',
          description: 'Review the entities found in your text. Confirm or skip each one.'
        },
        {
          title: 'Apply Changes',
          description: 'Click "Apply" to add confirmed entities to your world.'
        }
      ],
      tips: [
        'Entity extraction happens automatically on save',
        'Review all suggestions before applying',
        'High confidence suggestions are usually accurate'
      ]
    }
  ]
};

export const characterManagementGuide = {
  title: 'Character Management Guide',
  steps: [
    {
      title: 'Overview Tab',
      description: 'View character stats, biography, and basic information.',
      content: 'The Overview tab shows all essential character information including stats, biography, character arc, and appearance metrics.'
    },
    {
      title: 'Timeline Tab',
      description: 'Track character appearances and changes over time.',
      content: 'See a chronological timeline of when the character appears, changes stats, acquires items, learns skills, and more.'
    },
    {
      title: 'Relationships Tab',
      description: 'Visual network of character relationships.',
      content: 'View an interactive web showing how this character relates to others. Filter by relationship type and strength.'
    },
    {
      title: 'Dialogue Tab',
      description: 'Analyze character speech patterns.',
      content: 'Review dialogue statistics, common words, speech patterns, and voice consistency scores.'
    },
    {
      title: 'Arc Tab',
      description: 'Track character development journey.',
      content: 'See character arc progression through introduction, development, conflict, and resolution stages.'
    },
    {
      title: 'Stats Tab',
      description: 'View stat change history.',
      content: 'See a timeline of all stat changes with visual charts showing progression over time.'
    },
    {
      title: 'Inventory Tab',
      description: 'Track equipment and inventory changes.',
      content: 'View timeline of equipment changes, item acquisitions, and inventory modifications.'
    }
  ]
};

export const storyAnalysisGuide = {
  title: 'Story Analysis Guide',
  steps: [
    {
      title: 'Consistency Checker',
      description: 'Find contradictions and plot holes in your story.',
      steps: [
        {
          title: 'Run Check',
          description: 'Click "RUN CHECK" to scan your story for inconsistencies.'
        },
        {
          title: 'Review Issues',
          description: 'Browse detected issues organized by type and severity.'
        },
        {
          title: 'Filter Results',
          description: 'Use filters to focus on specific issue types or severities.'
        },
        {
          title: 'Mark Resolved',
          description: 'Mark issues as resolved once you\'ve addressed them.'
        }
      ],
      tips: [
        'Run checks regularly, especially after major changes',
        'Critical issues should be addressed immediately',
        'Use filters to focus on specific problem areas'
      ]
    },
    {
      title: 'Plot Thread Tracker',
      description: 'Track and manage multiple plot threads.',
      steps: [
        {
          title: 'Create Thread',
          description: 'Click "New Thread" to create a new plot thread.'
        },
        {
          title: 'Assign Chapters',
          description: 'Assign chapters to threads to track progression.'
        },
        {
          title: 'Monitor Status',
          description: 'Track thread status: active, paused, or resolved.'
        },
        {
          title: 'Check Completion',
          description: 'Monitor completion percentage for each thread.'
        }
      ],
      tips: [
        'Keep threads updated as you write',
        'Use dependencies to track related threads',
        'Resolve threads when storylines conclude'
      ]
    }
  ]
};

export default {
  writersRoomGuide,
  characterManagementGuide,
  storyAnalysisGuide
};

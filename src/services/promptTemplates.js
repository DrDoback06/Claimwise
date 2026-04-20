/**
 * External AI Prompt Templates
 * Pre-made prompts for users to copy into ChatGPT/Claude for style analysis
 */

const promptTemplates = {
  /**
   * Style Analysis Prompt - Analyzes a chapter for writing style
   */
  styleAnalysis: (chapterText) => `You are analyzing a writer's style for a writing assistant app.

Read the following chapter and analyze the writing style. Return your analysis EXACTLY in this JSON format (no other text, just the JSON):

{
  "voiceProfile": {
    "narratorTone": "How the narrator 'sounds' - formal, casual, sardonic, detached, intimate, etc.",
    "sentenceStructure": "One of: short, medium, long, varied",
    "vocabularyLevel": "One of: simple, moderate, advanced, mixed",
    "humorStyle": ["Array of humor types used: absurdist, dry, wordplay, situational, dark, slapstick, ironic, satirical, deadpan, etc."],
    "darkElements": ["Array of dark elements: body horror, existential dread, violence, despair, psychological horror, cosmic horror, bureaucratic nightmare, etc."],
    "uniquePatterns": ["Array of distinctive patterns you notice - specific phrases, rhythms, techniques"]
  },
  "comedyRules": {
    "whatMakesItFunny": ["Array of specific things that create humor in this writing"],
    "comedyTiming": "How jokes are delivered - buildup and payoff, subversion, understatement, escalation, etc.",
    "neverDo": ["Types of humor that would NOT fit this style"]
  },
  "toneBalance": {
    "comedyPercent": 60,
    "horrorPercent": 40,
    "emotionalDepthDescription": "How deep do emotional moments go? Surface-level, medium, deeply affecting?"
  },
  "pacing": {
    "sceneLength": "One of: short, medium, long, varied",
    "actionToDialogueRatio": "Percentage estimate, e.g., '40% action, 60% dialogue'",
    "breathingRoom": "Does it give readers time to process heavy moments? Yes/No/Sometimes"
  },
  "worldBuilding": {
    "expositionStyle": "How is world info delivered? Naturally woven, info dumps, character dialogue, etc.",
    "detailDensity": "One of: sparse, moderate, rich, overwhelming"
  },
  "comparisons": ["Array of similar works, authors, or shows this reminds you of"]
}

=== CHAPTER TO ANALYZE ===
${chapterText}`,

  /**
   * Style Analysis from Idea - When user only has an idea, not a chapter
   */
  styleAnalysisFromIdea: (ideaDescription, comparisons) => `You are helping a writer define their style for a writing assistant app.

Based on the story idea and influences below, create a comprehensive style profile. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "voiceProfile": {
    "narratorTone": "Recommended narrator voice based on the influences",
    "sentenceStructure": "One of: short, medium, long, varied",
    "vocabularyLevel": "One of: simple, moderate, advanced, mixed",
    "humorStyle": ["Array of humor types that would fit: absurdist, dry, wordplay, situational, dark, slapstick, ironic, satirical, deadpan, etc."],
    "darkElements": ["Array of dark elements that fit: body horror, existential dread, violence, despair, psychological horror, cosmic horror, bureaucratic nightmare, etc."],
    "uniquePatterns": ["Array of suggested distinctive techniques based on the influences"]
  },
  "comedyRules": {
    "whatMakesItFunny": ["Array of comedy techniques that would work for this story"],
    "comedyTiming": "Recommended joke delivery style",
    "neverDo": ["Types of humor to avoid based on the tone"]
  },
  "toneBalance": {
    "comedyPercent": 60,
    "horrorPercent": 40,
    "emotionalDepthDescription": "Recommended emotional depth"
  },
  "pacing": {
    "sceneLength": "One of: short, medium, long, varied",
    "actionToDialogueRatio": "Recommended ratio",
    "breathingRoom": "Recommendation for pacing"
  },
  "worldBuilding": {
    "expositionStyle": "Recommended exposition approach",
    "detailDensity": "One of: sparse, moderate, rich"
  },
  "comparisons": ["The influences provided plus any others that fit"]
}

=== STORY IDEA ===
${ideaDescription}

=== INFLUENCES/COMPARISONS ===
${comparisons}`,

  /**
   * Character Voice Analysis - Analyze how a specific character speaks
   */
  characterVoice: (characterName, characterDescription, dialogueSamples) => `You are analyzing a character's voice for a writing assistant app.

Analyze how ${characterName} speaks based on the description and dialogue samples. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "characterId": "${characterName.toLowerCase().replace(/\s+/g, '_')}",
  "characterName": "${characterName}",
  "voiceProfile": {
    "speechPatterns": "How they construct sentences - formal, fragmented, eloquent, gruff, etc.",
    "vocabularyChoices": ["Array of words/phrases they would use"],
    "vocabularyAvoid": ["Array of words/phrases they would NEVER use"],
    "emotionalRange": "How do they express emotions? Stoic, explosive, passive-aggressive, etc.",
    "quirks": ["Array of verbal quirks - catchphrases, speech impediments, habits"],
    "internalVsExternal": "Do they say what they think, or hide their true feelings?"
  },
  "dialogueStyle": {
    "averageLength": "One of: terse, medium, verbose",
    "formality": "One of: very formal, formal, casual, very casual, varies by situation",
    "humor": "How do they use humor? Never, occasionally, constantly, accidentally funny, etc."
  },
  "exampleDialogue": [
    "Generate 5 example lines this character would say in different situations"
  ],
  "interactionNotes": {
    "withAuthority": "How they speak to authority figures",
    "withFriends": "How they speak to friends/allies", 
    "underStress": "How their speech changes under pressure",
    "whenAngry": "How they express anger verbally"
  }
}

=== CHARACTER DESCRIPTION ===
${characterDescription}

=== DIALOGUE SAMPLES (if available) ===
${dialogueSamples || 'No samples provided - please infer from description'}`,

  /**
   * Plot Outline Generation - Create chapter-by-chapter beats
   */
  plotOutline: (premise, genre, chapterCount) => `You are creating a plot outline for a writing assistant app.

Based on the premise below, create a chapter-by-chapter plot outline. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "title": "Suggested title based on premise",
  "logline": "One-sentence summary of the story",
  "themes": ["Array of main themes"],
  "plotBeats": [
    {
      "id": 1,
      "chapter": 1,
      "beat": "Short description of what happens",
      "purpose": "Why this beat matters to the story",
      "characters": ["Characters involved"],
      "emotionalTone": "The mood of this section",
      "completed": false
    }
  ],
  "arcs": {
    "mainPlot": "Description of the main story arc",
    "subplots": ["Array of subplot descriptions"]
  },
  "keyMoments": {
    "incitingIncident": "What kicks off the story",
    "midpoint": "The major turn in the middle",
    "climax": "The peak of conflict",
    "resolution": "How it ends"
  }
}

=== STORY PREMISE ===
${premise}

=== GENRE ===
${genre}

=== TARGET CHAPTER COUNT ===
${chapterCount || 'Suggest appropriate number'}`,

  /**
   * World Rules Definition - Extract world-building rules
   */
  worldRules: (worldDescription, genre) => `You are defining world rules for a writing assistant app.

Based on the world description, extract and organize the rules of this story world. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "worldName": "Name of the world/setting if mentioned",
  "coreRules": [
    {
      "rule": "A fundamental rule of this world",
      "implications": "What this means for the story",
      "exceptions": "Any known exceptions"
    }
  ],
  "magicOrTech": {
    "exists": true,
    "type": "Magic, technology, both, neither",
    "limitations": ["What it cannot do"],
    "costs": ["What using it costs"],
    "rules": ["Specific rules for how it works"]
  },
  "society": {
    "structure": "How society is organized",
    "conflicts": ["Major societal conflicts"],
    "norms": ["Social norms characters must navigate"]
  },
  "tone": {
    "realism": "One of: grounded, heightened, absurd",
    "consequences": "Are actions consequential? Always, sometimes, rarely",
    "deathRules": "Can main characters die? How is death treated?"
  },
  "doNotBreak": [
    "Rules that should NEVER be broken for story consistency"
  ],
  "canBend": [
    "Rules that can be bent for dramatic effect"
  ]
}

=== WORLD DESCRIPTION ===
${worldDescription}

=== GENRE ===
${genre}`,

  /**
   * Chapter Summary Generation - Summarize a completed chapter
   */
  chapterSummary: (chapterText, chapterNumber, existingCharacters) => `You are summarizing a chapter for a writing assistant app's memory system.

Read this chapter and create a comprehensive summary for future reference. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "chapterNumber": ${chapterNumber},
  "summary": "2-3 paragraph summary of what happened",
  "keyEvents": [
    {
      "event": "Description of important event",
      "characters": ["Characters involved"],
      "significance": "Why this matters"
    }
  ],
  "characterUpdates": [
    {
      "character": "Character name",
      "stateChange": "How their state changed (mood, inventory, location, relationships)",
      "newInfo": "Any new information revealed about them"
    }
  ],
  "plotBeatsAdvanced": [
    "List any plot points that were advanced or resolved"
  ],
  "newElements": {
    "characters": ["Any new characters introduced"],
    "items": ["Any new items introduced"],
    "locations": ["Any new locations"],
    "concepts": ["Any new world concepts revealed"]
  },
  "openThreads": [
    "Plot threads left open for future chapters"
  ],
  "moodProgression": {
    "startMood": "How the chapter begins emotionally",
    "endMood": "How the chapter ends emotionally",
    "majorShifts": ["Any major emotional shifts during the chapter"]
  },
  "quotableLines": [
    "Any particularly memorable or important lines of dialogue"
  ]
}

=== CHAPTER ${chapterNumber} ===
${chapterText}

=== EXISTING CHARACTERS (for reference) ===
${existingCharacters || 'None provided'}`,

  /**
   * Style Evolution Review - Compare recent chapters to original style
   */
  styleEvolution: (originalStyle, recentChapters, reviewNumber) => `You are conducting a style evolution review for a writing assistant app.

Compare the recent chapters to the original style profile and identify how the writer's style has evolved. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "reviewNumber": ${reviewNumber},
  "overallAssessment": "Has the style evolved, remained consistent, or drifted?",
  "consistentElements": [
    "Elements that have stayed true to the original style"
  ],
  "evolvedElements": [
    {
      "element": "What has changed",
      "original": "How it was originally",
      "current": "How it is now",
      "assessment": "Is this evolution positive, negative, or neutral?"
    }
  ],
  "recommendations": [
    {
      "suggestion": "Specific suggestion for the writer",
      "reason": "Why this would help"
    }
  ],
  "updatedProfile": {
    "voiceProfile": {
      "narratorTone": "Updated if changed",
      "sentenceStructure": "Updated if changed",
      "vocabularyLevel": "Updated if changed",
      "humorStyle": ["Updated array if changed"],
      "darkElements": ["Updated array if changed"],
      "uniquePatterns": ["Updated array - add any new patterns discovered"]
    },
    "comedyRules": {
      "whatMakesItFunny": ["Updated if changed"],
      "comedyTiming": "Updated if changed",
      "neverDo": ["Updated if changed"]
    },
    "toneBalance": {
      "comedyPercent": 60,
      "horrorPercent": 40,
      "emotionalDepthDescription": "Updated if changed"
    }
  },
  "strengthsIdentified": [
    "Writing strengths that have emerged"
  ],
  "areasToWatch": [
    "Areas where the style might be drifting unintentionally"
  ]
}

=== ORIGINAL STYLE PROFILE ===
${JSON.stringify(originalStyle, null, 2)}

=== RECENT CHAPTERS (last 5) ===
${recentChapters}`,

  /**
   * Chapter Planning - Generate chapter plan for Canvas-style editing
   */
  chapterPlan: (
    chapterNumber,
    previousChapterSummary,
    availableCharacters,
    availableItems,
    remainingPlotBeats,
    styleProfile,
    moodSliders
  ) => `You are planning a chapter for a writing assistant app.

Create a detailed chapter plan that the writer can edit before generation. Return EXACTLY in this JSON format (no other text, just the JSON):

{
  "chapterNumber": ${chapterNumber},
  "suggestedTitle": "A title for this chapter",
  "actorsToUse": [
    {
      "name": "Character name",
      "currentState": "Their state from previous chapter",
      "roleInChapter": "What they'll do in this chapter",
      "isNew": false
    }
  ],
  "suggestedNewActors": [
    {
      "name": "Suggested new character",
      "description": "Brief description",
      "purpose": "Why introduce them now"
    }
  ],
  "plotBeatsToAddress": [
    {
      "beat": "Plot beat from the roadmap",
      "howToAddress": "How this chapter will handle it"
    }
  ],
  "itemsInPlay": [
    {
      "item": "Item name",
      "holder": "Who has it",
      "relevance": "How it might be used"
    }
  ],
  "suggestedMood": {
    "comedy_horror": ${moodSliders?.comedy_horror || 60},
    "action_dialogue": ${moodSliders?.action_dialogue || 50},
    "pacing": ${moodSliders?.pacing || 50},
    "tone": ${moodSliders?.tone || 40},
    "detail": ${moodSliders?.detail || 60},
    "emotional": ${moodSliders?.emotional || 50},
    "despair": ${moodSliders?.despair || 30},
    "tension": ${moodSliders?.tension || 40}
  },
  "chapterOutline": [
    {
      "scene": 1,
      "description": "What happens in this scene",
      "purpose": "Why this scene matters",
      "characters": ["Characters in scene"],
      "mood": "Emotional tone of scene"
    }
  ],
  "connectionToPrevious": "How this chapter connects to the last one",
  "setupForNext": "What this chapter sets up for future chapters",
  "potentialChallenges": [
    "Things to watch out for while writing this chapter"
  ]
}

=== CHAPTER NUMBER ===
${chapterNumber}

=== PREVIOUS CHAPTER SUMMARY ===
${previousChapterSummary || 'This is the first chapter'}

=== AVAILABLE CHARACTERS ===
${JSON.stringify(availableCharacters, null, 2)}

=== AVAILABLE ITEMS ===
${JSON.stringify(availableItems, null, 2)}

=== REMAINING PLOT BEATS ===
${JSON.stringify(remainingPlotBeats, null, 2)}

=== STYLE PROFILE ===
${JSON.stringify(styleProfile, null, 2)}`,

  /**
   * Chapter Generation - Actually write the chapter
   */
  chapterGeneration: (
    chapterPlan,
    styleProfile,
    characterVoices,
    previousChapterFull,
    chapterOverviews,
    worldRules,
    moodSliders
  ) => `You are writing a chapter for a novel. Follow the style guide EXACTLY.

Write Chapter ${chapterPlan.chapterNumber}: "${chapterPlan.suggestedTitle}"

CRITICAL INSTRUCTIONS:
1. Match the style profile EXACTLY - this is the writer's voice
2. Use the character voices for all dialogue
3. Follow the chapter plan's scenes and beats
4. Maintain continuity with previous chapters
5. Apply the mood settings throughout

=== STYLE GUIDE (FOLLOW THIS EXACTLY) ===
${JSON.stringify(styleProfile, null, 2)}

=== CHARACTER VOICES (USE THESE FOR DIALOGUE) ===
${JSON.stringify(characterVoices, null, 2)}

=== CHAPTER PLAN ===
${JSON.stringify(chapterPlan, null, 2)}

=== MOOD SETTINGS ===
Comedy vs Horror: ${moodSliders?.comedy_horror || 60}% comedy
Action vs Dialogue: ${moodSliders?.action_dialogue || 50}% action
Pacing: ${moodSliders?.pacing || 50}% (0=slow, 100=fast)
Tone: ${moodSliders?.tone || 40}% dark
Detail Density: ${moodSliders?.detail || 60}%
Emotional Intensity: ${moodSliders?.emotional || 50}%
Despair Level: ${moodSliders?.despair || 30}%
Tension: ${moodSliders?.tension || 40}%

=== PREVIOUS CHAPTER (for continuity) ===
${previousChapterFull || 'This is the first chapter'}

=== STORY SO FAR (chapter summaries) ===
${chapterOverviews || 'No previous chapters'}

=== WORLD RULES ===
${worldRules || 'No specific rules defined'}

Now write the full chapter. Make it approximately 2000-3000 words. Include all scenes from the plan.`,

  /**
   * Text Expansion - Expand selected text
   */
  textExpansion: (selectedText, surroundingContext, styleProfile, expansionLength) => `You are expanding text for a novel. Match the style EXACTLY.

Expand the selected text into ${expansionLength || '2-3 paragraphs'}. 

CRITICAL: Match the style profile exactly. This must feel like it was written by the same author.

=== STYLE TO MATCH ===
${JSON.stringify(styleProfile, null, 2)}

=== SURROUNDING CONTEXT ===
${surroundingContext}

=== TEXT TO EXPAND ===
${selectedText}

Write the expanded version now. Only output the expanded text, nothing else.`,

  /**
   * Text Rewrite - Rewrite selected text
   */
  textRewrite: (selectedText, surroundingContext, styleProfile, rewriteInstructions) => `You are rewriting text for a novel. Match the style EXACTLY.

Rewrite the selected text${rewriteInstructions ? ` with these instructions: ${rewriteInstructions}` : ''}.

CRITICAL: Match the style profile exactly. This must feel like it was written by the same author.

=== STYLE TO MATCH ===
${JSON.stringify(styleProfile, null, 2)}

=== SURROUNDING CONTEXT ===
${surroundingContext}

=== TEXT TO REWRITE ===
${selectedText}

Write the rewritten version now. Only output the rewritten text, nothing else.`,

  /**
   * MEGA PROMPT: Quick Import - Collects ALL story information at once
   * For users who already have their story set up in ChatGPT
   */
  quickImport: (existingContext = '') => `You are helping a writer set up their story universe in a writing assistant app.

Based on our conversation history and everything you know about my story, create a COMPLETE story profile. Return ONLY valid JSON (no other text, no markdown code blocks, just the raw JSON):

${existingContext ? `ADDITIONAL CONTEXT FROM WRITER:
${existingContext}

` : ''}Return this EXACT structure filled with my story's information:

{
  "storyFoundation": {
    "title": "Story title",
    "genre": "One of: fantasy, rpg-lite, horror, comedy, sci-fi, literary, thriller, romance",
    "subGenres": ["Array of sub-genres that apply"],
    "premise": "2-3 paragraph story premise - what's it about, what makes it unique, main conflicts",
    "targetAudience": "One of: ya, adult, all-ages, mature",
    "comparisons": "It's like X meets Y meets Z",
    "tone": "Brief description of overall tone"
  },
  "styleProfile": {
    "voiceProfile": {
      "narratorTone": "How the narrator sounds - sardonic, intimate, detached, etc.",
      "sentenceStructure": "One of: short, medium, long, varied",
      "vocabularyLevel": "One of: simple, moderate, advanced, mixed",
      "humorStyle": ["Array: absurdist, dry, wordplay, situational, dark, slapstick, ironic, satirical, deadpan"],
      "darkElements": ["Array: body horror, existential dread, violence, despair, psychological, cosmic, bureaucratic"],
      "uniquePatterns": ["Array of distinctive writing patterns, phrases, techniques"]
    },
    "comedyRules": {
      "whatMakesItFunny": ["Array of specific things that create humor"],
      "comedyTiming": "How jokes are delivered",
      "neverDo": ["Types of humor to avoid"]
    },
    "toneBalance": {
      "comedyPercent": 60,
      "horrorPercent": 40,
      "emotionalDepthDescription": "How deep do emotional moments go?"
    },
    "pacing": {
      "sceneLength": "One of: short, medium, long, varied",
      "actionToDialogueRatio": "e.g., 40% action, 60% dialogue",
      "breathingRoom": "Yes/No/Sometimes"
    },
    "comparisons": ["Array of similar works/authors/shows"]
  },
  "characters": [
    {
      "name": "Character name",
      "role": "Protagonist/Antagonist/Sidekick/etc.",
      "description": "Brief character description and personality",
      "voiceProfile": {
        "speechPatterns": "How they construct sentences",
        "vocabularyChoices": ["Words/phrases they use"],
        "vocabularyAvoid": ["Words they'd never use"],
        "emotionalRange": "How they express emotions",
        "quirks": ["Verbal quirks, catchphrases"],
        "internalVsExternal": "Do they say what they think?"
      },
      "exampleDialogue": ["3-5 example lines they would say"]
    }
  ],
  "worldRules": {
    "description": "Overall world description",
    "coreRules": [
      {
        "rule": "A fundamental rule of this world",
        "implications": "What this means for the story"
      }
    ],
    "magicOrTech": {
      "exists": true,
      "type": "Magic/Technology/Both/Neither",
      "limitations": ["What it cannot do"],
      "costs": ["What using it costs"]
    },
    "tone": {
      "realism": "One of: grounded, heightened, absurd",
      "consequences": "Always/Sometimes/Rarely",
      "deathRules": "How is death treated?"
    },
    "doNotBreak": ["Rules that should NEVER be broken"],
    "canBend": ["Rules that can be bent for drama"]
  },
  "plotBeats": [
    {
      "beat": "What happens",
      "chapter": null,
      "purpose": "Why this matters",
      "characters": ["Characters involved"],
      "emotionalTone": "Mood of this beat"
    }
  ],
  "moodDefaults": {
    "comedy_horror": 60,
    "action_dialogue": 50,
    "pacing": 50,
    "tone": 40,
    "detail": 60,
    "emotional": 50,
    "despair": 30,
    "tension": 40
  }
}

Fill in ALL fields based on what you know about my story. Be specific and detailed. Include ALL main characters. Include ALL major plot beats you're aware of. If you don't know something specific, make your best inference based on the genre and tone we've discussed.`
};

/**
 * Helper to format prompts for clipboard copying
 */
export const formatForClipboard = (promptText) => {
  return `--- COPY EVERYTHING BELOW THIS LINE ---

${promptText}

--- COPY EVERYTHING ABOVE THIS LINE ---`;
};

/**
 * Parse JSON response from external AI
 * ULTRA-ROBUST: Handles malformed JSON, smart quotes, unescaped characters, and more
 * Falls back to regex-based extraction if JSON parsing completely fails
 */
export const parseExternalAIResponse = (responseText) => {
  if (!responseText || typeof responseText !== 'string') {
    throw new Error('No response text provided');
  }

  // Clean the input text AGGRESSIVELY
  let cleanedText = responseText
    .trim()
    .replace(/^\uFEFF/, '')  // Remove BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Remove zero-width chars
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Replace various smart/curly quotes with standard ones
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')  // Double quotes
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")  // Single quotes
    // Replace other problematic Unicode
    .replace(/[\u2013\u2014]/g, '-')  // En-dash, em-dash
    .replace(/[\u2026]/g, '...')  // Ellipsis
    .replace(/[\u00A0]/g, ' ')  // Non-breaking space
    // Handle escaped sequences that might be double-escaped
    .replace(/\\\\"/g, '\\"')
    .replace(/\\\\n/g, '\\n');
    
  // Debug: Log the first 200 chars to help diagnose issues
  console.log('[JSON Parser] Input preview:', cleanedText.substring(0, 200));

  // Attempt 1: Try direct JSON parse (best case)
  try {
    return JSON.parse(cleanedText);
  } catch (e1) {
    // Continue to fixes
  }

  // Attempt 2: Extract from markdown code blocks
  const codeBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const codeContent = codeBlockMatch[1].trim();
      return JSON.parse(aggressiveJsonRepair(codeContent));
    } catch (e2) {
      // Continue
    }
  }

  // Attempt 3: Find JSON object boundaries
  const firstBrace = cleanedText.indexOf('{');
  const lastBrace = cleanedText.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = cleanedText.substring(firstBrace, lastBrace + 1);
    
    // Try multiple repair strategies
    const repairStrategies = [
      () => jsonCandidate,  // Original
      () => jsonCandidate.replace(/,(\s*[}\]])/g, '$1'),  // Trailing commas
      () => aggressiveJsonRepair(jsonCandidate),  // Aggressive repair
      () => escapeAllSmartQuotesInStrings(jsonCandidate),  // Smart quote escape
      () => repairJsonString(jsonCandidate),  // Full repair
    ];
    
    for (let i = 0; i < repairStrategies.length; i++) {
      try {
        const repaired = repairStrategies[i]();
        if (repaired) {
          const parsed = JSON.parse(repaired);
          console.log(`JSON parsed successfully using strategy ${i + 1}`, {
            hasCharacters: Array.isArray(parsed.characters),
            charactersCount: Array.isArray(parsed.characters) ? parsed.characters.length : 0,
            hasPlotBeats: Array.isArray(parsed.plotBeats),
            plotBeatsCount: Array.isArray(parsed.plotBeats) ? parsed.plotBeats.length : 0
          });
          return parsed;
        }
      } catch (e) {
        // Try next strategy
        if (i === repairStrategies.length - 1) {
          console.warn('All repair strategies failed, last error:', e.message);
        }
      }
    }
  }

  // Attempt 4: LAST RESORT - Extract data using regex even from broken JSON
  // This is the "nuclear option" - we'll build a valid JSON object from fragments
  try {
    const extracted = extractDataFromBrokenJson(cleanedText);
    if (extracted && Object.keys(extracted).length > 0) {
      console.warn('Used regex extraction fallback - some data may be incomplete');
      return extracted;
    }
  } catch (e) {
    // Even extraction failed
  }

  // Final error with helpful message
  let errorHint = '';
  if (!cleanedText.includes('{')) {
    errorHint = ' The response doesn\'t appear to contain JSON (no { found).';
  } else if (!cleanedText.includes('}')) {
    errorHint = ' The JSON appears to be incomplete (no closing } found).';
  } else {
    errorHint = ' Could not parse JSON even after multiple repair attempts.';
  }
  
  throw new Error(`Could not parse JSON from response.${errorHint} Please try copying the JSON again or ask ChatGPT to return it in a code block.`);
};

/**
 * Aggressive JSON repair - multiple passes of fixes
 * Handles smart quotes, nested structures, and preserves arrays
 */
function aggressiveJsonRepair(text) {
  let result = text;
  
  // Pass 0: CRITICAL - Fix smart quotes that break string boundaries
  // Pattern: "text "word" more" → "text \"word\" more"
  // This handles the most common case where smart quotes appear inside regular-quoted strings
  // Use a more robust pattern that handles multiple smart quotes in one string
  result = result.replace(/"([^"]*?)([\u201C\u201D][^\u201C\u201D"]*?[\u201C\u201D])([^"]*?)"/g, 
    (match, before, smartQuoted, after) => {
      // Escape the smart quotes
      const escaped = smartQuoted.replace(/[\u201C\u201D]/g, '\\"');
      return `"${before}${escaped}${after}"`;
    });
  
  // Also handle cases with multiple smart quote pairs in one string
  // This is a more aggressive pass that handles: "text "word1" and "word2" more"
  let changed = true;
  while (changed) {
    const before = result;
    result = result.replace(/"([^"]*?)[\u201C\u201D]([^\u201C\u201D"]*?)[\u201C\u201D]([^"]*?)"/g, 
      (match, before, middle, after) => {
        return `"${before}\\"${middle}\\"${after}"`;
      });
    changed = (before !== result);
  }
  
  // Pass 1: Fix remaining smart quotes (escape them all)
  result = escapeAllSmartQuotesInStrings(result);
  
  // Pass 2: Fix trailing commas (but preserve them in arrays/objects that might be incomplete)
  result = result.replace(/,(\s*[}\]])/g, '$1');
  
  // Pass 3: Fix special characters
  result = result
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/[\u2026]/g, '...');
  
  // Pass 4: Fix unescaped control characters in strings (but be careful with newlines in arrays)
  // Only fix newlines that are clearly inside string values, not array separators
  result = result.replace(/"([^"]*?)\n([^"]*?)"/g, (match, before, after) => {
    return `"${before}\\n${after}"`;
  });
  
  // Pass 5: Fix unescaped tabs
  result = result.replace(/"([^"]*?)\t([^"]*?)"/g, (match, before, after) => {
    return `"${before}\\t${after}"`;
  });
  
  return result;
}

/**
 * Escape ALL smart quotes - assumes they're all inside string values
 */
function escapeAllSmartQuotesInStrings(text) {
  // Replace all smart double quotes with escaped regular quotes
  let result = text.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '\\"');
  
  // Replace all smart single quotes with escaped apostrophes
  result = result.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "\\'");
  
  return result;
}

/**
 * Attempt to repair a malformed JSON string
 * More aggressive repair for cases where smart quotes break JSON structure
 */
function repairJsonString(text) {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) return null;
  
  let json = text.substring(firstBrace, lastBrace + 1);
  
  // Aggressive fix: Replace ALL smart quotes with escaped regular quotes
  json = json
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '\\"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "\\'");
  
  // Fix special characters
  json = json
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/[\u2026]/g, '...');
  
  // Fix trailing commas
  json = json.replace(/,(\s*[}\]])/g, '$1');
  
  return json;
}

/**
 * LAST RESORT: Extract data from completely broken JSON using regex
 * This builds a valid JSON object from fragments even when parsing fails
 */
function extractDataFromBrokenJson(text) {
  const result = {};
  
  // Extract storyFoundation
  const storyMatch = text.match(/"storyFoundation"\s*:\s*\{([^}]*)\}/s);
  if (storyMatch) {
    result.storyFoundation = {};
    const storyText = storyMatch[1];
    
    // Extract title
    const titleMatch = storyText.match(/"title"\s*:\s*"([^"]*)"/);
    if (titleMatch) result.storyFoundation.title = cleanExtractedValue(titleMatch[1]);
    
    // Extract genre
    const genreMatch = storyText.match(/"genre"\s*:\s*"([^"]*)"/);
    if (genreMatch) result.storyFoundation.genre = cleanExtractedValue(genreMatch[1]);
    
    // Extract premise (may span multiple lines, may contain smart quotes)
    // Match everything from "premise": " until the next regular " (not smart quotes)
    const premiseMatch = storyText.match(/"premise"\s*:\s*"([^"]*(?:[\u201C\u201D][^"\u201C\u201D]*[\u201C\u201D][^"]*)*)"/s);
    if (premiseMatch) {
      result.storyFoundation.premise = cleanExtractedValue(premiseMatch[1]);
    } else {
      // Fallback: try to find premise even with broken quotes
      const premiseStart = storyText.indexOf('"premise"');
      if (premiseStart !== -1) {
        const afterColon = storyText.indexOf(':', premiseStart);
        const valueStart = storyText.indexOf('"', afterColon);
        if (valueStart !== -1) {
          // Find the next regular quote (not smart quote)
          let valueEnd = valueStart + 1;
          while (valueEnd < storyText.length && storyText[valueEnd] !== '"' && 
                 storyText.charCodeAt(valueEnd) !== 0x201C && storyText.charCodeAt(valueEnd) !== 0x201D) {
            valueEnd++;
          }
          if (valueEnd < storyText.length) {
            const premiseValue = storyText.substring(valueStart + 1, valueEnd);
            result.storyFoundation.premise = cleanExtractedValue(premiseValue);
          }
        }
      }
    }
    
    // Extract other fields similarly
    ['targetAudience', 'comparisons', 'tone'].forEach(field => {
      const match = storyText.match(new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`));
      if (match) result.storyFoundation[field] = cleanExtractedValue(match[1]);
    });
    
    // Extract subGenres array
    const subGenresMatch = storyText.match(/"subGenres"\s*:\s*\[(.*?)\]/s);
    if (subGenresMatch) {
      const genres = subGenresMatch[1].match(/"([^"]*)"/g);
      if (genres) {
        result.storyFoundation.subGenres = genres.map(g => cleanExtractedValue(g.slice(1, -1)));
      }
    }
  }
  
  // Extract characters array - handle nested brackets properly
  const charsStart = text.indexOf('"characters"');
  if (charsStart !== -1) {
    const arrayStart = text.indexOf('[', charsStart);
    if (arrayStart !== -1) {
      // Find matching closing bracket (handle nesting)
      let bracketCount = 0;
      let arrayEnd = arrayStart;
      for (let i = arrayStart; i < text.length; i++) {
        if (text[i] === '[') bracketCount++;
        else if (text[i] === ']') {
          bracketCount--;
          if (bracketCount === 0) {
            arrayEnd = i + 1;
            break;
          }
        }
      }
      
      if (arrayEnd > arrayStart) {
        const charsText = text.substring(arrayStart + 1, arrayEnd - 1);
        // Find all character objects by looking for "name" fields
        // Use a more robust approach that handles nested objects
        const namePattern = /"name"\s*:\s*"([^"]*)"/g;
        result.characters = [];
        let nameMatch;
        
        while ((nameMatch = namePattern.exec(charsText)) !== null) {
          // Find the object containing this name
          const nameIndex = nameMatch.index;
          // Look backwards for the opening brace
          let objStart = charsText.lastIndexOf('{', nameIndex);
          if (objStart === -1) continue;
          
          // Look forwards for the matching closing brace
          let braceCount = 0;
          let objEnd = objStart;
          for (let i = objStart; i < charsText.length; i++) {
            if (charsText[i] === '{') braceCount++;
            else if (charsText[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                objEnd = i + 1;
                break;
              }
            }
          }
          
          if (objEnd > objStart) {
            const charText = charsText.substring(objStart, objEnd);
            const char = {
              name: cleanExtractedValue(nameMatch[1])
            };
            
            // Extract other fields
            const roleMatch = charText.match(/"role"\s*:\s*"([^"]*)"/);
            if (roleMatch) char.role = cleanExtractedValue(roleMatch[1]);
            
            // Description might have smart quotes, so be more lenient
            const descMatch = charText.match(/"description"\s*:\s*"((?:[^"\\]|\\.|[\u201C\u201D][^"\u201C\u201D]*[\u201C\u201D])*)"/s);
            if (descMatch) {
              char.description = cleanExtractedValue(descMatch[1]);
            } else {
              // Fallback: try to find description even with broken quotes
              const descStart = charText.indexOf('"description"');
              if (descStart !== -1) {
                const descValueStart = charText.indexOf('"', descStart + 13);
                if (descValueStart !== -1) {
                  // Find the next quote (might be smart quote)
                  let descValueEnd = descValueStart + 1;
                  while (descValueEnd < charText.length && 
                         charText[descValueEnd] !== '"' && 
                         charText.charCodeAt(descValueEnd) !== 0x201C && 
                         charText.charCodeAt(descValueEnd) !== 0x201D) {
                    descValueEnd++;
                  }
                  if (descValueEnd < charText.length) {
                    char.description = cleanExtractedValue(charText.substring(descValueStart + 1, descValueEnd));
                  }
                }
              }
            }
            
            result.characters.push(char);
          }
        }
      }
    }
  }
  
  // Extract styleProfile (simplified - just get the object structure)
  const styleMatch = text.match(/"styleProfile"\s*:\s*\{([^}]*)\}/s);
  if (styleMatch) {
    result.styleProfile = {}; // We'll store the raw text for now
    // Could extract specific fields if needed
  }
  
  // Extract worldRules
  const worldMatch = text.match(/"worldRules"\s*:\s*\{([^}]*)\}/s);
  if (worldMatch) {
    result.worldRules = {};
    const worldText = worldMatch[1];
    const descMatch = worldText.match(/"description"\s*:\s*"((?:[^"\\]|\\.|[\u201C\u201D][^"\u201C\u201D]*[\u201C\u201D])*)"/s);
    if (descMatch) result.worldRules.description = cleanExtractedValue(descMatch[1]);
  }
  
  // Extract plotBeats array - IMPROVED algorithm
  const plotStart = text.indexOf('"plotBeats"');
  if (plotStart !== -1) {
    const arrayStart = text.indexOf('[', plotStart);
    if (arrayStart !== -1) {
      // Find matching closing bracket (handle nesting)
      let bracketCount = 0;
      let arrayEnd = arrayStart;
      for (let i = arrayStart; i < text.length; i++) {
        if (text[i] === '[') bracketCount++;
        else if (text[i] === ']') {
          bracketCount--;
          if (bracketCount === 0) {
            arrayEnd = i + 1;
            break;
          }
        }
      }
      
      if (arrayEnd > arrayStart) {
        const beatsText = text.substring(arrayStart, arrayEnd);
        result.plotBeats = [];
        
        // Split by finding top-level objects in the array
        // Look for pattern: { ... "beat": "..." ... }
        let depth = 0;
        let currentObjStart = -1;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < beatsText.length; i++) {
          const char = beatsText[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (inString) continue;
          
          if (char === '{') {
            if (depth === 1) {
              currentObjStart = i;
            }
            depth++;
          } else if (char === '}') {
            depth--;
            if (depth === 1 && currentObjStart !== -1) {
              // Found a complete object at the top level of the array
              const objText = beatsText.substring(currentObjStart, i + 1);
              
              // Extract beat data from this object
              const beatTextMatch = objText.match(/"beat"\s*:\s*"((?:[^"\\]|\\.)*)"/);
              if (beatTextMatch) {
                const beat = {
                  beat: cleanExtractedValue(beatTextMatch[1])
                };
                
                const purposeMatch = objText.match(/"purpose"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                if (purposeMatch) beat.purpose = cleanExtractedValue(purposeMatch[1]);
                
                const chapterMatch = objText.match(/"chapter"\s*:\s*(null|\d+)/);
                if (chapterMatch) {
                  beat.chapter = chapterMatch[1] === 'null' ? null : parseInt(chapterMatch[1]);
                }
                
                const idMatch = objText.match(/"id"\s*:\s*(\d+)/);
                if (idMatch) beat.id = parseInt(idMatch[1]);
                
                const charsMatch = objText.match(/"characters"\s*:\s*\[(.*?)\]/s);
                if (charsMatch) {
                  const charNames = charsMatch[1].match(/"([^"]*)"/g);
                  if (charNames) {
                    beat.characters = charNames.map(c => cleanExtractedValue(c.slice(1, -1)));
                  }
                }
                
                const toneMatch = objText.match(/"emotionalTone"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                if (toneMatch) beat.emotionalTone = cleanExtractedValue(toneMatch[1]);
                
                result.plotBeats.push(beat);
              }
              
              currentObjStart = -1;
            }
          }
        }
        
        console.log(`[Regex Extractor] Found ${result.plotBeats.length} plot beats`);
        if (result.plotBeats.length > 0) {
          console.log('[Regex Extractor] First beat:', result.plotBeats[0].beat?.substring(0, 50));
          console.log('[Regex Extractor] Last beat:', result.plotBeats[result.plotBeats.length - 1].beat?.substring(0, 50));
        }
      }
    }
  }
  
  return result;
}

/**
 * Clean extracted values - remove smart quotes, normalize whitespace
 */
function cleanExtractedValue(value) {
  if (!value) return '';
  
  return value
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')  // Smart double quotes → regular
    .replace(/[\u2018\u2019]/g, "'")             // Smart single quotes → regular
    .replace(/—/g, '-')                          // Em dash
    .replace(/–/g, '-')                          // En dash
    .replace(/…/g, '...')                        // Ellipsis
    .replace(/\s+/g, ' ')                        // Normalize whitespace
    .trim();
}

export default promptTemplates;

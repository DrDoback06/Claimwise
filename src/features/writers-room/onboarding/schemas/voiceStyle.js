// Loomwright — Voice & style section schema.

const SCHEMA = `{
  "chapterLength": "flash (<1k)" | "short (1-2.5k)" | "standard (2.5-5k)" | "long (5k+)" | "mixed",
  "dialogueStyle": "terse" | "naturalistic" | "witty" | "formal" | "florid" | "mixed",
  "descriptionDensity": "minimal" | "sparse" | "balanced" | "rich" | "maximalist",
  "voiceFingerprint": {
    "sentenceLength": "short" | "medium" | "long" | "varied",
    "sensoryDensity": "sparse" | "balanced" | "rich",
    "lyricism": "plain" | "balanced" | "lyrical",
    "subordination": "low" | "medium" | "high"
  },
  "voiceTics": string[],            // 4-8 signature prose tics they actually do (or want to)
  "voiceHooks": string[],           // 4-8 example opening sentences in this voice
  "narrativeDistance": "intimate" | "close" | "balanced" | "distant",
  "comparableAuthors": string[],    // 1-5 writers the voice leans on
  "rhythmExamples": string[],       // 3 example sentences showing the rhythm
  "registerLevel": "conversational" | "literary" | "formal-baroque",
  "metaphorPalette": string[],      // 4-8 source domains for imagery (e.g. "mining", "weaving", "ledgers")
  "syntaxQuirks": string,           // 1-2 sentences on syntax habits the AI should mimic
  "voiceDont": string[]             // 3-5 things this voice MUST NOT do
}`;

const SECTION = {
  id: 'voiceStyle',
  title: 'Voice & style',
  referenceCategories: ['style'],
  prompt(state) {
    return [
      `You are a voice coach. The novelist has set baseline preferences; expand them`,
      `into a richly-specified voice fingerprint the AI writing assistant can mimic.`,
      ``,
      `Preserve their explicit picks. Generate concrete examples (rhythmExamples,`,
      `voiceHooks) the AI can rhythm-match against later.`,
      ``,
      `Return ONLY this JSON:`,
      ``,
      SCHEMA,
      ``,
      `--- Current state ---`,
      `Genres: ${(state.genres || []).join(', ') || '(none)'}`,
      `Tone: ${(state.tone || []).join(', ') || '(none)'}`,
      `POV / tense: ${state.pov || '?'} / ${state.tense || '?'}`,
      ``,
      `Style references they uploaded:`,
      ((state.styleSamples || []).map(s => '• ' + s.name).join('\n') || '(none)'),
      ``,
      `Constraints:`,
      `- "rhythmExamples" must be three FULL SENTENCES — not adjectives. They serve`,
      `  as cadence templates the AI rhythm-matches.`,
      `- "voiceHooks" are example opening sentences (not abstract patterns).`,
      `- "voiceDont" is the prohibited zone — "no semicolons", "never use 'suddenly'",`,
      `  "no internal monologue in dialogue scenes", etc.`,
      `- "metaphorPalette" gives the AI source domains for imagery so all metaphors`,
      `  feel of a piece.`,
    ].join('\n');
  },
  validate(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    if (typeof parsed.chapterLength !== 'string') return false;
    if (typeof parsed.dialogueStyle !== 'string') return false;
    if (typeof parsed.descriptionDensity !== 'string') return false;
    return true;
  },
  applyTo(state, parsed) {
    return {
      ...state,
      chapterLength: parsed.chapterLength ?? state.chapterLength,
      dialogueStyle: parsed.dialogueStyle ?? state.dialogueStyle,
      descriptionDensity: parsed.descriptionDensity ?? state.descriptionDensity,
      voiceFingerprint: parsed.voiceFingerprint ?? state.voiceFingerprint,
      voiceTics: parsed.voiceTics ?? state.voiceTics,
      voiceHooks: parsed.voiceHooks ?? state.voiceHooks,
      narrativeDistance: parsed.narrativeDistance ?? state.narrativeDistance,
      comparableAuthors: parsed.comparableAuthors ?? state.comparableAuthors,
      rhythmExamples: parsed.rhythmExamples ?? state.rhythmExamples,
      registerLevel: parsed.registerLevel ?? state.registerLevel,
      metaphorPalette: parsed.metaphorPalette ?? state.metaphorPalette,
      syntaxQuirks: parsed.syntaxQuirks ?? state.syntaxQuirks,
      voiceDont: parsed.voiceDont ?? state.voiceDont,
    };
  },
  required: ['chapterLength', 'dialogueStyle', 'descriptionDensity'],
};

export default SECTION;

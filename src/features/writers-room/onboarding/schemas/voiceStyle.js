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
  "voiceTics": string[],            // signature speech / prose tics; 3-8 entries
  "voiceHooks": string[],           // characteristic openings / sentence shapes
  "narrativeDistance": "intimate" | "close" | "balanced" | "distant",
  "comparableAuthors": string[]     // 1-5 writers whose voice you want to lean on
}`;

const SECTION = {
  id: 'voiceStyle',
  title: 'Voice & style',
  referenceCategories: ['style'],
  prompt(state) {
    return [
      'Seed the **Voice & style** section. Return ONLY this JSON:',
      '',
      SCHEMA,
      '',
      'Guidance:',
      '- voiceTics: short list — "uses semicolons heavily", "sensory openings",',
      '  "sparse adjectives" etc',
      '- voiceHooks: example openings the AI should mimic ("It began the way it always did.")',
      '- comparableAuthors: real or fictional, but specific',
      '',
      'Style references currently uploaded:',
      ((state.styleSamples || []).map(s => '• ' + s.name).join('\n') || '(none)'),
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
    };
  },
  required: ['chapterLength', 'dialogueStyle', 'descriptionDensity'],
};

export default SECTION;

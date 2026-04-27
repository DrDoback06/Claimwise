// Loomwright — Flavour section schema.

const SCHEMA = `{
  "genres": string[],
  "subGenres": string[],
  "tone": string[],
  "pov": "1st person" | "3rd limited" | "3rd omniscient" | "multiple POV",
  "tense": "past" | "present",
  "narrativeDistance": "intimate" | "close" | "balanced" | "distant",
  "emotionalSpectrum": string,    // 1-2 sentences on the saga's emotional range
  "moodPalette": string[],        // 3-5 mood adjectives the AI should reach for
  "structuralInfluences": string[],   // 2-4 named books/films whose STRUCTURE this echoes (not voice)
  "voiceInfluences": string[],        // 2-4 named writers whose VOICE this echoes
  "comparablesNot": string[]      // works it should NOT be confused with
}`;

const SECTION = {
  id: 'flavour',
  title: 'Flavour',
  referenceCategories: ['style', 'lore'],
  prompt(state) {
    return [
      `You are a developmental editor helping a novelist nail the **Flavour** of`,
      `their saga. Their AI writing assistant will read this every prompt to keep`,
      `tone consistent.`,
      ``,
      `Take their partial palette and ENRICH it. Preserve every choice they've`,
      `already made; fill in NEW fields and propose 2-3 additions where their`,
      `lists are short. Don't fight their explicit picks.`,
      ``,
      `Return ONLY this JSON, no commentary:`,
      ``,
      SCHEMA,
      ``,
      `--- Current selections ---`,
      '```json',
      JSON.stringify({
        genres: state.genres || [],
        subGenres: state.subGenres || [],
        tone: state.tone || [],
        pov: state.pov || null,
        tense: state.tense || null,
        comparisons: state.comparisons || null,
      }, null, 2),
      '```',
      ``,
      `Constraints:`,
      `- "moodPalette" should be evocative and writable — not "epic" but "moss-damp",`,
      `  "candle-lit", "iron-tongued".`,
      `- "structuralInfluences" lists works whose chapter shape / pacing / framing`,
      `  this saga echoes. Specific named works only — no "many fantasy novels".`,
      `- "voiceInfluences" lists writers whose prose this leans on.`,
      `- "comparablesNot" is the negative space — works the writer would hate to be`,
      `  shelved next to.`,
    ].join('\n');
  },
  validate(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    if (!Array.isArray(parsed.genres) || parsed.genres.length === 0) return false;
    if (typeof parsed.pov !== 'string' || !parsed.pov.trim()) return false;
    if (typeof parsed.tense !== 'string' || !parsed.tense.trim()) return false;
    return true;
  },
  applyTo(state, parsed) {
    return {
      ...state,
      genres: parsed.genres || state.genres,
      subGenres: parsed.subGenres || state.subGenres,
      tone: parsed.tone || state.tone,
      pov: parsed.pov || state.pov,
      tense: parsed.tense || state.tense,
      narrativeDistance: parsed.narrativeDistance ?? state.narrativeDistance,
      emotionalSpectrum: parsed.emotionalSpectrum ?? state.emotionalSpectrum,
      moodPalette: parsed.moodPalette ?? state.moodPalette,
      structuralInfluences: parsed.structuralInfluences ?? state.structuralInfluences,
      voiceInfluences: parsed.voiceInfluences ?? state.voiceInfluences,
      comparablesNot: parsed.comparablesNot ?? state.comparablesNot,
    };
  },
  required: ['genres', 'pov', 'tense'],
};

export default SECTION;

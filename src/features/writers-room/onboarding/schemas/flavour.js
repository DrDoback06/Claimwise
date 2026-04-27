// Loomwright — Flavour section schema.

const SCHEMA = `{
  "genres": string[],          // e.g. ["Fantasy", "Adventure"]
  "subGenres": string[],
  "tone": string[],            // e.g. ["dark", "lyrical"]
  "pov": "1st person" | "3rd limited" | "3rd omniscient" | "multiple POV",
  "tense": "past" | "present"
}`;

const SECTION = {
  id: 'flavour',
  title: 'Flavour',
  referenceCategories: ['style', 'lore'],
  prompt(state) {
    return [
      'Seed the **Flavour** section. Return ONLY this JSON shape:',
      '',
      SCHEMA,
      '',
      'Constraints:',
      '- pick from a writer\'s working palette; multiple tones are fine',
      '- if the writer has provided genres already, expand on them rather than replacing',
      '',
      'Current state:',
      '```json',
      JSON.stringify({
        genres: state.genres || [],
        subGenres: state.subGenres || [],
        tone: state.tone || [],
        pov: state.pov || null,
        tense: state.tense || null,
      }, null, 2),
      '```',
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
    };
  },
  required: ['genres', 'pov', 'tense'],
};

export default SECTION;

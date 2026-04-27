// Loomwright — Pet peeves & favourites section schema.

const SCHEMA = `{
  "petPeeves": string[],
  "customPetPeeves": string,
  "favorites": string[],
  "customFavorites": string,
  "weakWords": string[],            // 8-15 words/phrases the AI should AVOID
  "powerWords": string[],           // 8-15 words/phrases the AI should LEAN ON
  "openingsToAvoid": string[],      // 4-6 chapter-opening patterns that bore them
  "openingsToTry": string[],        // 4-6 chapter-opening patterns they want to see
  "transitionDevices": string[],    // 3-5 devices the AI can use to shift scenes
  "endingShapes": string[]          // 3-5 chapter-ending shapes they like
}`;

const SECTION = {
  id: 'petPeeves',
  title: 'Pet peeves & favourites',
  referenceCategories: ['style'],
  prompt(state) {
    return [
      `You are a craft editor. The novelist has selected gut-level pet peeves and`,
      `favourites; turn them into a PRACTICAL toolkit the AI can apply line-by-line.`,
      ``,
      `Preserve every selection. Generate the new fields (weakWords, powerWords,`,
      `openings, transitions, endings) so the AI has concrete words and patterns`,
      `to reach for or avoid.`,
      ``,
      `Return ONLY this JSON:`,
      ``,
      SCHEMA,
      ``,
      `--- Existing selections ---`,
      '```json',
      JSON.stringify({
        petPeeves: state.petPeeves || [],
        customPetPeeves: state.customPetPeeves || '',
        favorites: state.favorites || [],
        customFavorites: state.customFavorites || '',
        genres: state.genres || [],
        tone: state.tone || [],
      }, null, 2),
      '```',
      ``,
      `Constraints:`,
      `- "weakWords" and "powerWords" are SPECIFIC — "suddenly" / "very" / "felt" vs`,
      `  "smouldered" / "buckled" / "creased". Real words, not categories.`,
      `- "openingsToAvoid" and "openingsToTry" are concrete patterns the AI can`,
      `  match against — "weather as mood opener" vs "in-medias-res with a sound".`,
      `- "transitionDevices" and "endingShapes" are tools the AI uses when shifting`,
      `  scenes or closing chapters.`,
    ].join('\n');
  },
  validate(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    if (!Array.isArray(parsed.petPeeves)) return false;
    if (!Array.isArray(parsed.favorites)) return false;
    return true;
  },
  applyTo(state, parsed) {
    return {
      ...state,
      petPeeves: parsed.petPeeves ?? state.petPeeves,
      customPetPeeves: parsed.customPetPeeves ?? state.customPetPeeves,
      favorites: parsed.favorites ?? state.favorites,
      customFavorites: parsed.customFavorites ?? state.customFavorites,
      weakWords: parsed.weakWords ?? state.weakWords,
      powerWords: parsed.powerWords ?? state.powerWords,
      openingsToAvoid: parsed.openingsToAvoid ?? state.openingsToAvoid,
      openingsToTry: parsed.openingsToTry ?? state.openingsToTry,
      transitionDevices: parsed.transitionDevices ?? state.transitionDevices,
      endingShapes: parsed.endingShapes ?? state.endingShapes,
    };
  },
  required: [],
};

export default SECTION;

// Loomwright — Pet peeves & favourites section schema.

const SCHEMA = `{
  "petPeeves": string[],         // tagged + custom; what to avoid
  "customPetPeeves": string,     // optional comma-separated extras
  "favorites": string[],
  "customFavorites": string
}`;

const SECTION = {
  id: 'petPeeves',
  title: 'Pet peeves & favourites',
  referenceCategories: ['style'],
  prompt(state) {
    return [
      'Seed the **Pet peeves & favourites** section. Return ONLY this JSON:',
      '',
      SCHEMA,
      '',
      'Examples:',
      '- petPeeves: "head-hopping", "info dumps", "cliché openings"',
      '- favorites: "sensory detail", "subtext", "in-medias-res openings"',
      '',
      'Existing answers:',
      '```json',
      JSON.stringify({
        petPeeves: state.petPeeves || [],
        customPetPeeves: state.customPetPeeves || '',
        favorites: state.favorites || [],
        customFavorites: state.customFavorites || '',
      }, null, 2),
      '```',
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
    };
  },
  required: [],
};

export default SECTION;

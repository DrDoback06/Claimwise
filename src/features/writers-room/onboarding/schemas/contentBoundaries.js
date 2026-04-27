// Loomwright — Content boundaries section schema.

const LEVELS = ['none', 'mild', 'moderate', 'strong', 'extreme'];

const SCHEMA = `{
  "profanityLevel": "none" | "mild" | "moderate" | "strong" | "extreme",
  "violenceLevel": "none" | "mild" | "moderate" | "strong" | "extreme",
  "romanticContent": "none" | "mild" | "moderate" | "strong" | "extreme",
  "doNotInclude": string[],   // hard "never" topics
  "tropeAllergies": string[]  // specific tropes the writer hates
}`;

const SECTION = {
  id: 'contentBoundaries',
  title: 'Content boundaries',
  referenceCategories: [],
  prompt(state) {
    return [
      'Seed the **Content boundaries** section. The novelist will paste your',
      'JSON answer back into the wizard. Return ONLY this JSON:',
      '',
      SCHEMA,
      '',
      'Levels: ' + LEVELS.join(', '),
      '',
      'Current state:',
      '```json',
      JSON.stringify({
        profanityLevel: state.profanityLevel,
        violenceLevel: state.violenceLevel,
        romanticContent: state.romanticContent,
      }, null, 2),
      '```',
    ].join('\n');
  },
  validate(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    if (!LEVELS.includes(parsed.profanityLevel)) return false;
    if (!LEVELS.includes(parsed.violenceLevel)) return false;
    if (!LEVELS.includes(parsed.romanticContent)) return false;
    return true;
  },
  applyTo(state, parsed) {
    return {
      ...state,
      profanityLevel: parsed.profanityLevel ?? state.profanityLevel,
      violenceLevel: parsed.violenceLevel ?? state.violenceLevel,
      romanticContent: parsed.romanticContent ?? state.romanticContent,
      doNotInclude: parsed.doNotInclude ?? state.doNotInclude,
      tropeAllergies: parsed.tropeAllergies ?? state.tropeAllergies,
    };
  },
  required: ['profanityLevel', 'violenceLevel', 'romanticContent'],
};

export default SECTION;

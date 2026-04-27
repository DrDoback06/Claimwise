// Loomwright — Content boundaries section schema.

const LEVELS = ['none', 'mild', 'moderate', 'strong', 'extreme'];

const SCHEMA = `{
  "profanityLevel": "none" | "mild" | "moderate" | "strong" | "extreme",
  "violenceLevel": "none" | "mild" | "moderate" | "strong" | "extreme",
  "romanticContent": "none" | "mild" | "moderate" | "strong" | "extreme",
  "doNotInclude": string[],           // hard "never" topics
  "tropeAllergies": string[],         // specific tropes that ruin a book for them
  "contentRationale": string,         // 2-3 sentences explaining their boundary choices
  "edgeCaseHandling": {               // how to handle on-page tension specifically
    "violence": string,               // "fade-to-black", "on-page but consequence-heavy", etc
    "romance": string,
    "trauma": string                  // how to write trauma without exploitation
  },
  "audienceSensitivities": string[],  // things the target audience reacts strongly to
  "preferredEuphemisms": string[]     // 4-8 alternate phrasings for charged content
}`;

const SECTION = {
  id: 'contentBoundaries',
  title: 'Content boundaries',
  referenceCategories: [],
  prompt(state) {
    return [
      `You are an author advocate helping a novelist define a precise content`,
      `boundary policy their AI assistant will never violate.`,
      ``,
      `Their levels are set; ENRICH them with rationale + edge-case handling +`,
      `preferred euphemisms so the AI knows HOW to write charged scenes within`,
      `their limits, not just what level to hit.`,
      ``,
      `Return ONLY this JSON, no commentary:`,
      ``,
      SCHEMA,
      ``,
      `Levels reference: ${LEVELS.join(', ')}`,
      ``,
      `--- Their picks ---`,
      '```json',
      JSON.stringify({
        profanityLevel: state.profanityLevel,
        violenceLevel: state.violenceLevel,
        romanticContent: state.romanticContent,
        targetAudience: state.targetAudience,
        genres: state.genres,
      }, null, 2),
      '```',
      ``,
      `Constraints:`,
      `- "edgeCaseHandling" gives concrete craft direction. "Fade-to-black" or`,
      `  "consequence-heavy on-page" — words the AI can act on.`,
      `- "preferredEuphemisms" is a substitution dictionary the AI uses when`,
      `  charged content is implied but the level cap is low.`,
      `- "doNotInclude" overrides everything else — these are hard NOs.`,
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
      contentRationale: parsed.contentRationale ?? state.contentRationale,
      edgeCaseHandling: parsed.edgeCaseHandling ?? state.edgeCaseHandling,
      audienceSensitivities: parsed.audienceSensitivities ?? state.audienceSensitivities,
      preferredEuphemisms: parsed.preferredEuphemisms ?? state.preferredEuphemisms,
    };
  },
  required: ['profanityLevel', 'violenceLevel', 'romanticContent'],
};

export default SECTION;

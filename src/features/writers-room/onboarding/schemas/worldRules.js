// Loomwright — World rules section schema.

const SCHEMA = `{
  "worldRulesText": string,        // 2-6 paragraphs of prose worldbuilding
  "worldRules": string[],          // 6-14 sharp falsifiable rules, one per line
  "magicSystem": string | null,    // null if N/A; otherwise: cost, source, limits
  "technologyLevel": string,       // e.g. "iron-age with limited steam"
  "factions": [                    // 3-6 power-blocs that drive conflict
    { "name": string, "creed": string, "method": string }
  ],
  "geographyShape": string,        // 1-2 sentences on the world's physical bones
  "currency": string | null,       // what people use to trade
  "calendar": string | null,       // months/years/cycles
  "deathRules": string,            // is death permanent? what comes after?
  "languageNotes": string | null,  // major languages / dialects
  "tabooInversions": string[]      // 2-4 things the in-universe culture treats as sacred OR forbidden differently than ours
}`;

const SECTION = {
  id: 'worldRules',
  title: 'World rules',
  referenceCategories: ['worldbuilding', 'lore', 'mechanics'],
  prompt(state) {
    return [
      `You are a worldbuilding consultant. Take the novelist's partial world rules`,
      `and ENRICH them into the kind of structured lore an AI writing assistant can`,
      `cite without breaking the writer's intent.`,
      ``,
      `Their existing prose is canon — preserve every concrete claim. Where they`,
      `gave only a sketch, propose specifics. Where a field is empty, generate`,
      `one consistent with the genres / premise / tone.`,
      ``,
      `Return ONLY this JSON, no commentary:`,
      ``,
      SCHEMA,
      ``,
      `--- Their current world brief ---`,
      `Genres: ${(state.genres || []).join(', ') || '(none)'}`,
      `Premise: ${state.premise || '(none)'}`,
      ``,
      `Existing rules text:`,
      '```',
      state.worldRulesText || '(empty)',
      '```',
      ``,
      `Constraints:`,
      `- worldRules entries must be SHARP and FALSIFIABLE: "Magic costs life-years"`,
      `  not "Magic is dangerous". Each is something a character could break.`,
      `- factions are 3-6 named power blocs with creed (what they believe) and`,
      `  method (how they operate). They should disagree with each other.`,
      `- "tabooInversions" is the spice — what does this culture revere or forbid`,
      `  that ours doesn't (or vice-versa)?`,
      `- magicSystem may be null for non-fantasy.`,
    ].join('\n');
  },
  validate(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    if (typeof parsed.worldRulesText !== 'string' || parsed.worldRulesText.length < 80) return false;
    if (!Array.isArray(parsed.worldRules) || parsed.worldRules.length === 0) return false;
    return true;
  },
  applyTo(state, parsed) {
    return {
      ...state,
      worldRulesText: parsed.worldRulesText ?? state.worldRulesText,
      worldRules: parsed.worldRules ?? state.worldRules,
      magicSystem: parsed.magicSystem ?? state.magicSystem,
      technologyLevel: parsed.technologyLevel ?? state.technologyLevel,
      factions: parsed.factions ?? state.factions,
      geographyShape: parsed.geographyShape ?? state.geographyShape,
      currency: parsed.currency ?? state.currency,
      calendar: parsed.calendar ?? state.calendar,
      deathRules: parsed.deathRules ?? state.deathRules,
      languageNotes: parsed.languageNotes ?? state.languageNotes,
      tabooInversions: parsed.tabooInversions ?? state.tabooInversions,
    };
  },
  required: ['worldRulesText'],
};

export default SECTION;

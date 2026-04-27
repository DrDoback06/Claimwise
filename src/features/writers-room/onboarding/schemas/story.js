// Loomwright — Story section schema (Issue #1).

const SCHEMA = `{
  "workingTitle": string,
  "seriesName": string | null,
  "premise": string,         // 200-1500 chars; the elevator pitch + the heart
  "comparisons": string | null,  // e.g. "Le Guin meets Pratchett"
  "targetAudience": "adult" | "YA" | "middle-grade" | "all ages",
  "elevatorPitch": string,   // 25-40 words; back-cover blurb voice
  "logline": string,         // 1 sentence: protagonist + want + obstacle + stakes
  "themes": string[],        // 3-6 short phrases
  "openingImage": string,    // a single concrete image to anchor chapter 1
  "tagline": string          // 8-12 words; cover-quote energy
}`;

const SECTION = {
  id: 'story',
  title: 'Story',
  referenceCategories: ['plot', 'lore'],
  prompt(state) {
    return [
      `You are an editorial collaborator helping a novelist deepen the **Story** seed`,
      `for a saga their AI writing assistant will use as long-term context.`,
      ``,
      `Take their partial answers below and EXPAND them into a richer, more specific`,
      `version. Where they were specific, preserve their phrasing. Where they were`,
      `vague or empty, propose plausible, evocative detail consistent with their`,
      `genres and tone. Don't invent contradicting facts.`,
      ``,
      `Return ONLY this JSON object — no commentary, no markdown fences:`,
      ``,
      SCHEMA,
      ``,
      `--- Their current selections ---`,
      '```json',
      JSON.stringify({
        workingTitle: state.workingTitle || null,
        seriesName: state.seriesName || null,
        premise: state.premise || null,
        comparisons: state.comparisons || null,
        targetAudience: state.targetAudience || 'adult',
        genres: state.genres || [],
        tone: state.tone || [],
      }, null, 2),
      '```',
      ``,
      `Constraints:`,
      `- "premise" must be 200–1500 characters; elaborate if theirs is shorter.`,
      `- If "workingTitle" is empty, propose 3 candidates joined by " / ".`,
      `- "elevatorPitch", "logline", "themes", "openingImage", "tagline" are NEW —`,
      `  generate them from the existing context.`,
      `- Be specific. "A young hero faces evil" is bad; "A pawnbroker's daughter`,
      `  smuggles enchanted ledgers across a quarantine line" is good.`,
    ].join('\n');
  },
  validate(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    if (typeof parsed.premise !== 'string' || parsed.premise.length < 50) return false;
    if (typeof parsed.workingTitle !== 'string' || !parsed.workingTitle.trim()) return false;
    return true;
  },
  applyTo(state, parsed) {
    return {
      ...state,
      workingTitle: parsed.workingTitle ?? state.workingTitle,
      seriesName: parsed.seriesName ?? state.seriesName,
      premise: parsed.premise ?? state.premise,
      comparisons: parsed.comparisons ?? state.comparisons,
      targetAudience: parsed.targetAudience ?? state.targetAudience,
      // Enriched fields land in profile via finish() — keep here on the
      // wizard state object so the SectionIO can show them.
      elevatorPitch: parsed.elevatorPitch ?? state.elevatorPitch,
      logline: parsed.logline ?? state.logline,
      themes: parsed.themes ?? state.themes,
      openingImage: parsed.openingImage ?? state.openingImage,
      tagline: parsed.tagline ?? state.tagline,
    };
  },
  required: ['workingTitle', 'premise'],
};

export default SECTION;

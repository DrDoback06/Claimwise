// Loomwright — Story section schema (Issue #1).

const SCHEMA = `{
  "workingTitle": string,
  "seriesName": string | null,
  "premise": string,         // 200-1500 chars; the elevator pitch + the heart
  "comparisons": string | null,  // e.g. "Le Guin meets Pratchett"
  "targetAudience": "adult" | "YA" | "middle-grade" | "all ages"
}`;

const SECTION = {
  id: 'story',
  title: 'Story',
  referenceCategories: ['plot', 'lore'],
  prompt(state) {
    return [
      'You are helping a novelist seed the **Story** section of their saga onboarding.',
      'Return ONLY this JSON object — no commentary, no markdown fences:',
      '',
      SCHEMA,
      '',
      'Context they have shared so far (some keys may be empty — fill in plausible values consistent with what is set):',
      '',
      '```json',
      JSON.stringify({
        workingTitle: state.workingTitle || null,
        seriesName: state.seriesName || null,
        premise: state.premise || null,
        comparisons: state.comparisons || null,
        targetAudience: state.targetAudience || 'adult',
        genres: state.genres || [],
      }, null, 2),
      '```',
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
    };
  },
  // Traffic-light hint: list the keys we expect to be non-empty for green.
  required: ['workingTitle', 'premise'],
};

export default SECTION;

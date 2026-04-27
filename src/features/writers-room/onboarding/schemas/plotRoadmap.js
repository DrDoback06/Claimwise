// Loomwright — Plot roadmap section schema.

const SCHEMA = `{
  "targetChapters": number,
  "targetWords": number,
  "outlineText": string,         // multi-line; one beat per line preferred
  "majorBeats": [                // optional structured beats
    { "chapter": number, "title": string, "summary": string }
  ]
}`;

const SECTION = {
  id: 'plotRoadmap',
  title: 'Plot roadmap',
  referenceCategories: ['plot'],
  prompt(state) {
    return [
      'Seed the **Plot roadmap** section. Return ONLY this JSON:',
      '',
      SCHEMA,
      '',
      'Guidance:',
      '- outlineText is freeform (matches the existing wizard textarea)',
      '- majorBeats is structured for AI to track later',
      '- if a premise was given, the beats should reflect it',
      '',
      'Premise: ' + (state.premise || '(none)'),
      'Genres: ' + ((state.genres || []).join(', ') || '(none)'),
      'Existing outline:',
      '```',
      state.outlineText || '(empty)',
      '```',
    ].join('\n');
  },
  validate(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    if (typeof parsed.targetChapters !== 'number' || parsed.targetChapters < 1) return false;
    if (typeof parsed.targetWords !== 'number' || parsed.targetWords < 1000) return false;
    if (typeof parsed.outlineText !== 'string') return false;
    return true;
  },
  applyTo(state, parsed) {
    return {
      ...state,
      targetChapters: parsed.targetChapters ?? state.targetChapters,
      targetWords: parsed.targetWords ?? state.targetWords,
      outlineText: parsed.outlineText ?? state.outlineText,
      majorBeats: parsed.majorBeats ?? state.majorBeats,
    };
  },
  required: ['outlineText'],
};

export default SECTION;

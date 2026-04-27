// Loomwright — World rules section schema.

const SCHEMA = `{
  "worldRulesText": string,    // 2-6 paragraphs, free-form
  "worldRules": string[]       // one rule per line, sharp + falsifiable
}`;

const SECTION = {
  id: 'worldRules',
  title: 'World rules',
  referenceCategories: ['worldbuilding', 'lore', 'mechanics'],
  prompt(state) {
    return [
      'Seed the **World rules** section. The novelist needs the hard limits',
      'of their world — the laws of magic, technology, society, anything that',
      'would feel like cheating to break. Return ONLY this JSON:',
      '',
      SCHEMA,
      '',
      'Guidance:',
      '- worldRulesText is the prose draft (2-6 paragraphs)',
      '- worldRules is the bullet checklist; one rule per element; ≤ 14 entries',
      '- prefer sharp, falsifiable rules over vague vibes',
      '',
      'Current premise: ' + (state.premise || '(none provided)'),
      'Genres: ' + ((state.genres || []).join(', ') || '(none provided)'),
      'Existing rules text:',
      '```',
      state.worldRulesText || '(empty)',
      '```',
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
    };
  },
  required: ['worldRulesText'],
};

export default SECTION;

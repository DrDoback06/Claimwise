// Loomwright — AI provider & cadence section schema.

const SCHEMA = `{
  "aiProvider": "auto" | "anthropic" | "openai" | "gemini" | "groq" | "huggingface" | "offline",
  "intrusion": "quiet" | "medium" | "helpful" | "eager",
  "extractionBudget": "manual" | "balanced" | "eager"
}`;

const SECTION = {
  id: 'aiCadence',
  title: 'AI & cadence',
  referenceCategories: [],
  prompt(state) {
    return [
      'Seed the **AI & cadence** section. Return ONLY this JSON:',
      '',
      SCHEMA,
      '',
      'Defaults:',
      '- aiProvider: "auto" (use the cheapest configured provider)',
      '- intrusion: "medium" (balanced cadence)',
      '- extractionBudget: "balanced" (auto-create high-confidence findings, queue the rest)',
    ].join('\n');
  },
  validate(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    if (typeof parsed.aiProvider !== 'string') return false;
    if (typeof parsed.intrusion !== 'string') return false;
    return true;
  },
  applyTo(state, parsed) {
    return {
      ...state,
      aiProvider: parsed.aiProvider ?? state.aiProvider,
      intrusion: parsed.intrusion ?? state.intrusion,
      extractionBudget: parsed.extractionBudget ?? state.extractionBudget,
    };
  },
  required: ['aiProvider', 'intrusion'],
};

export default SECTION;

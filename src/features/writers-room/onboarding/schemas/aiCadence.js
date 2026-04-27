// Loomwright — AI provider & cadence section schema.

const SCHEMA = `{
  "aiProvider": "auto" | "anthropic" | "openai" | "gemini" | "groq" | "huggingface" | "offline",
  "intrusion": "quiet" | "medium" | "helpful" | "eager",
  "extractionBudget": "manual" | "balanced" | "eager",
  "preferredScenarios": {        // what each AI mode should specialise in
    "ideation": "creative" | "analytical" | "balanced",
    "drafting":  "creative" | "analytical" | "balanced",
    "editing":   "creative" | "analytical" | "balanced",
    "extraction":"creative" | "analytical" | "balanced"
  },
  "writerSelfDescription": string,   // 2-3 sentences on the writer's working habits
  "preferredFeedbackStyle": "tough-love" | "encouraging" | "socratic" | "minimalist",
  "interruptionRules": string[]      // 3-5 rules about when the AI is and isn't allowed to interrupt
}`;

const SECTION = {
  id: 'aiCadence',
  title: 'AI & cadence',
  referenceCategories: [],
  prompt(state) {
    return [
      `You are configuring the writer's relationship with their AI assistant.`,
      `Take their basic preferences and ENRICH them with: a self-description the`,
      `AI should remember about how this writer works, a feedback style, and`,
      `interruption rules.`,
      ``,
      `Return ONLY this JSON:`,
      ``,
      SCHEMA,
      ``,
      `--- Their picks ---`,
      `Provider: ${state.aiProvider || 'auto'}`,
      `Intrusion: ${state.intrusion || 'medium'}`,
      `Extraction budget: ${state.extractionBudget || 'balanced'}`,
      ``,
      `Constraints:`,
      `- "writerSelfDescription" should be the kind of brief the AI keeps front-of-mind:`,
      `  "Writes mornings, edits evenings; hates being told to outline before drafting".`,
      `- "interruptionRules" are explicit "don't ping me when X" / "always ping me when Y".`,
      `- "preferredFeedbackStyle" governs the specialist chat's voice.`,
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
      preferredScenarios: parsed.preferredScenarios ?? state.preferredScenarios,
      writerSelfDescription: parsed.writerSelfDescription ?? state.writerSelfDescription,
      preferredFeedbackStyle: parsed.preferredFeedbackStyle ?? state.preferredFeedbackStyle,
      interruptionRules: parsed.interruptionRules ?? state.interruptionRules,
    };
  },
  required: ['aiProvider', 'intrusion'],
};

export default SECTION;

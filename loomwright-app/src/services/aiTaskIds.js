/**
 * Loomwright AI Providers task ids (must match lw-ai-routing keys in AIProviders.jsx).
 * Use these as the `task` argument to aiService.callAI so per-task provider overrides apply.
 */
export const LW_AI_TASK = Object.freeze({
  DRAFT: 'draft',
  WEAVE: 'weave',
  VOICE: 'voice',
  LINT: 'lint',
  INTERVIEW: 'interview',
  INVENTORY: 'inventory',
  ATLAS: 'atlas',
  BRIEF: 'brief',
  SPARK: 'spark',
  PING: 'ping',
});

export default LW_AI_TASK;

/**
 * Intelligence Router
 * Automatically analyzes request complexity and routes to the appropriate AI model tier.
 * Saves users money by using cheap/free models for simple tasks and premium models only when needed.
 */

// --- Model Registry ---
// Each model has: provider, model ID, tier, cost tier, capability score, speed, max tokens
// Tiers: 'fast' (cheap/free), 'balanced' (mid-range), 'premium' (highest quality)
// This registry auto-adapts: add a new entry and routing picks it up automatically.

const MODEL_REGISTRY = [
  // === FAST TIER (free or very cheap, good for simple tasks) ===
  {
    id: 'groq-llama-3.1-8b',
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    tier: 'fast',
    capability: 3,
    speed: 10,       // tokens/sec relative score
    costPer1kTokens: 0,
    maxTokens: 4096,
    temperature: 0.7,
    strengths: ['quick-answers', 'simple-generation', 'summaries'],
    description: 'Ultra-fast free model for simple tasks'
  },
  {
    id: 'groq-llama-3.1-70b',
    provider: 'groq',
    model: 'llama-3.1-70b-versatile',
    tier: 'fast',
    capability: 5,
    speed: 8,
    costPer1kTokens: 0,
    maxTokens: 4096,
    temperature: 0.7,
    strengths: ['general', 'creative', 'analysis'],
    description: 'Free high-quality model via Groq'
  },
  {
    id: 'gemini-flash',
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    tier: 'fast',
    capability: 6,
    speed: 9,
    costPer1kTokens: 0.0375, // very cheap
    maxTokens: 8192,
    temperature: 0.7,
    strengths: ['creative', 'general', 'structured', 'fast-generation'],
    description: 'Fast and cheap Gemini model'
  },

  // === BALANCED TIER (good quality, moderate cost) ===
  {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    tier: 'balanced',
    capability: 7,
    speed: 7,
    costPer1kTokens: 0.15,
    maxTokens: 8192,
    temperature: 0.7,
    strengths: ['creative', 'analysis', 'structured', 'reasoning'],
    description: 'Latest Gemini Flash with strong reasoning'
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    model: 'gpt-4o-mini',
    tier: 'balanced',
    capability: 7,
    speed: 7,
    costPer1kTokens: 0.15,
    maxTokens: 4096,
    temperature: 0.7,
    strengths: ['structured', 'analysis', 'creative', 'general'],
    description: 'Cost-effective OpenAI model'
  },
  {
    id: 'claude-haiku',
    provider: 'anthropic',
    model: 'claude-haiku-4-5-20251001',
    tier: 'balanced',
    capability: 7,
    speed: 8,
    costPer1kTokens: 0.25,
    maxTokens: 4096,
    temperature: 0.7,
    strengths: ['analysis', 'structured', 'creative', 'reasoning'],
    description: 'Fast and capable Claude model'
  },

  // === PREMIUM TIER (highest quality, for complex/critical tasks) ===
  {
    id: 'gpt-4o',
    provider: 'openai',
    model: 'gpt-4o',
    tier: 'premium',
    capability: 9,
    speed: 5,
    costPer1kTokens: 2.5,
    maxTokens: 4096,
    temperature: 0.7,
    strengths: ['creative', 'analysis', 'structured', 'reasoning', 'nuance'],
    description: 'Top-tier OpenAI model'
  },
  {
    id: 'claude-sonnet',
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    tier: 'premium',
    capability: 9,
    speed: 5,
    costPer1kTokens: 3.0,
    maxTokens: 4096,
    temperature: 0.7,
    strengths: ['analysis', 'reasoning', 'creative', 'nuance', 'consistency'],
    description: 'Top-tier Anthropic model'
  },
  {
    id: 'claude-opus',
    provider: 'anthropic',
    model: 'claude-opus-4-20250514',
    tier: 'premium',
    capability: 10,
    speed: 3,
    costPer1kTokens: 15.0,
    maxTokens: 4096,
    temperature: 0.7,
    strengths: ['deep-reasoning', 'nuance', 'analysis', 'creative', 'consistency'],
    description: 'Most capable AI model - use for critical/complex tasks only'
  }
];

// --- Complexity Signals ---
// Keywords and patterns that indicate higher complexity

const COMPLEXITY_SIGNALS = {
  high: [
    // Deep analysis
    /\b(analyze|analyse|evaluate|critique|compare and contrast|assess)\b/i,
    /\b(consistency|continuity|contradiction|plot\s*hole|timeline)\b/i,
    /\b(character\s*arc|narrative\s*structure|thematic)\b/i,
    // Multi-step reasoning
    /\b(step.by.step|chain\s*of\s*thought|reasoning|logic|deduc)/i,
    /\b(cross.reference|correlat|interconnect|relationship\s*between)\b/i,
    // Complex generation
    /\b(rewrite|improve|enhance|refine|polish)\b/i,
    /\b(world.?build|lore|mythology|magic\s*system)\b/i,
    // JSON with many fields
    /\b(comprehensive|thorough|detailed|in.depth|exhaustive)\b/i
  ],
  medium: [
    /\b(summarize|summarise|outline|overview|describe)\b/i,
    /\b(generate|create|write|draft|compose)\b/i,
    /\b(explain|clarify|elaborate)\b/i,
    /\b(list|categorize|classify|organize)\b/i,
    /\b(suggest|recommend|propose)\b/i,
    /\b(character|scene|dialogue|chapter)\b/i
  ],
  low: [
    /\b(yes|no|true|false|name|title|label)\b/i,
    /\b(short|brief|quick|simple|basic)\b/i,
    /\b(format|convert|translate|extract)\b/i,
    /\b(count|number|how\s*many)\b/i
  ]
};

// Task type to complexity bias mapping
const TASK_COMPLEXITY_BIAS = {
  creative: 0.2,      // Creative tasks often benefit from better models
  analytical: 0.3,    // Analysis needs strong reasoning
  structured: -0.1,   // Structured output is easier for most models
  general: 0
};

// --- Token Usage Tracker ---

const TOKEN_STORAGE_KEY = 'claimwise_token_usage';
const TOKEN_WARNING_THRESHOLDS = {
  groq: { daily: 14400, label: 'Groq free tier (14,400 req/day)' },
  gemini: { monthly: 1500000, label: 'Gemini free tier (~1.5M tokens/month)' },
  openai: { monthly: 500000, label: 'OpenAI budget', warn: true },
  anthropic: { monthly: 500000, label: 'Anthropic budget', warn: true }
};

class TokenUsageTracker {
  constructor() {
    this.usage = this._loadUsage();
  }

  _loadUsage() {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Reset daily counters if day changed
        const today = new Date().toISOString().slice(0, 10);
        if (data.date !== today) {
          data.daily = {};
          data.date = today;
        }
        // Reset monthly counters if month changed
        const month = new Date().toISOString().slice(0, 7);
        if (data.month !== month) {
          data.monthly = {};
          data.month = month;
        }
        return data;
      }
    } catch (_) { /* ignore */ }

    return {
      date: new Date().toISOString().slice(0, 10),
      month: new Date().toISOString().slice(0, 7),
      daily: {},
      monthly: {},
      totalRequests: 0,
      totalEstimatedCost: 0
    };
  }

  _saveUsage() {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(this.usage));
    } catch (_) { /* ignore */ }
  }

  trackRequest(provider, modelId, estimatedTokens) {
    const cost = this._estimateCost(modelId, estimatedTokens);

    // Update daily
    this.usage.daily[provider] = (this.usage.daily[provider] || 0) + 1;

    // Update monthly tokens
    this.usage.monthly[provider] = (this.usage.monthly[provider] || 0) + estimatedTokens;

    // Update totals
    this.usage.totalRequests++;
    this.usage.totalEstimatedCost += cost;

    this._saveUsage();

    return { cost, warning: this._checkWarnings(provider) };
  }

  _estimateCost(modelId, tokens) {
    const model = MODEL_REGISTRY.find(m => m.id === modelId);
    if (!model) return 0;
    return (tokens / 1000) * model.costPer1kTokens;
  }

  _checkWarnings(provider) {
    const threshold = TOKEN_WARNING_THRESHOLDS[provider];
    if (!threshold) return null;

    if (threshold.daily) {
      const dailyCount = this.usage.daily[provider] || 0;
      const pct = dailyCount / threshold.daily;
      if (pct >= 0.9) {
        return { level: 'critical', message: `${threshold.label}: ${Math.round(pct * 100)}% used today` };
      }
      if (pct >= 0.7) {
        return { level: 'warning', message: `${threshold.label}: ${Math.round(pct * 100)}% used today` };
      }
    }

    if (threshold.monthly) {
      const monthlyTokens = this.usage.monthly[provider] || 0;
      const pct = monthlyTokens / threshold.monthly;
      if (pct >= 0.9) {
        return { level: 'critical', message: `${threshold.label}: ~${Math.round(pct * 100)}% of budget used this month` };
      }
      if (pct >= 0.7) {
        return { level: 'warning', message: `${threshold.label}: ~${Math.round(pct * 100)}% of budget used this month` };
      }
    }

    return null;
  }

  getUsageSummary() {
    return {
      today: { ...this.usage.daily },
      thisMonth: { ...this.usage.monthly },
      totalRequests: this.usage.totalRequests,
      estimatedTotalCost: Math.round(this.usage.totalEstimatedCost * 1000) / 1000,
      warnings: Object.keys(TOKEN_WARNING_THRESHOLDS)
        .map(p => ({ provider: p, ...this._checkWarnings(p) }))
        .filter(w => w.level)
    };
  }

  resetUsage() {
    this.usage = {
      date: new Date().toISOString().slice(0, 10),
      month: new Date().toISOString().slice(0, 7),
      daily: {},
      monthly: {},
      totalRequests: 0,
      totalEstimatedCost: 0
    };
    this._saveUsage();
  }
}

// --- Complexity Analyzer ---

function analyzeComplexity(prompt, systemContext = '', taskType = 'general') {
  let score = 0.5; // Start at medium

  // 1. Prompt length signals
  const totalLength = prompt.length + (systemContext?.length || 0);
  if (totalLength > 5000) score += 0.2;
  else if (totalLength > 2000) score += 0.1;
  else if (totalLength < 200) score -= 0.2;

  // 2. Keyword signals
  let highHits = 0, medHits = 0, lowHits = 0;
  const combinedText = `${prompt} ${systemContext}`;

  for (const pattern of COMPLEXITY_SIGNALS.high) {
    if (pattern.test(combinedText)) highHits++;
  }
  for (const pattern of COMPLEXITY_SIGNALS.medium) {
    if (pattern.test(combinedText)) medHits++;
  }
  for (const pattern of COMPLEXITY_SIGNALS.low) {
    if (pattern.test(combinedText)) lowHits++;
  }

  score += highHits * 0.08;
  score += medHits * 0.03;
  score -= lowHits * 0.05;

  // 3. Task type bias
  score += TASK_COMPLEXITY_BIAS[taskType] || 0;

  // 4. JSON output requested (structured data is moderate complexity)
  if (/return.*json|json.*format|json.*object/i.test(combinedText)) {
    score += 0.05;
  }

  // 5. Multiple sub-tasks (numbered lists, bullet points)
  const listItems = (combinedText.match(/^\s*[-*\d]+[.)]/gm) || []).length;
  if (listItems > 5) score += 0.15;
  else if (listItems > 2) score += 0.05;

  // 6. Requires referencing prior context / cross-chapter analysis
  if (/across\s*chapters?|previous\s*chapter|earlier\s*in|continuity/i.test(combinedText)) {
    score += 0.2;
  }

  // Clamp to 0-1
  score = Math.max(0, Math.min(1, score));

  // Map to tier
  let tier;
  if (score < 0.35) tier = 'fast';
  else if (score < 0.65) tier = 'balanced';
  else tier = 'premium';

  return { score, tier, signals: { highHits, medHits, lowHits, totalLength, taskType } };
}

// --- Router ---

class IntelligenceRouter {
  constructor() {
    this.tokenTracker = new TokenUsageTracker();
    this.registry = [...MODEL_REGISTRY];
    this.lastRouting = null;
  }

  /**
   * Get all models available for a set of configured providers.
   * @param {string[]} availableProviders - providers that have keys configured
   * @returns {object[]} filtered model list
   */
  getAvailableModels(availableProviders) {
    return this.registry.filter(m => availableProviders.includes(m.provider));
  }

  /**
   * Route a request to the best model based on complexity analysis.
   * Returns an ordered list of models to try (primary + fallbacks).
   *
   * @param {string} prompt
   * @param {string} systemContext
   * @param {string} taskType - 'creative' | 'analytical' | 'structured' | 'general'
   * @param {string[]} availableProviders - providers with keys set
   * @param {string} preferredProvider - user's preferred provider or 'auto'
   * @returns {{ primary: object, fallbacks: object[], complexity: object }}
   */
  route(prompt, systemContext = '', taskType = 'general', availableProviders = [], preferredProvider = 'auto') {
    const complexity = analyzeComplexity(prompt, systemContext, taskType);
    const available = this.getAvailableModels(availableProviders);

    if (available.length === 0) {
      return { primary: null, fallbacks: [], complexity };
    }

    // Filter models by tier (allow same tier + one tier down for fallbacks)
    const tierOrder = ['fast', 'balanced', 'premium'];
    const targetTierIdx = tierOrder.indexOf(complexity.tier);

    // Score each available model for this request
    const scored = available.map(model => {
      let modelScore = model.capability;

      // Bonus for matching the target tier
      const modelTierIdx = tierOrder.indexOf(model.tier);
      if (modelTierIdx === targetTierIdx) modelScore += 3;
      else if (Math.abs(modelTierIdx - targetTierIdx) === 1) modelScore += 1;
      else modelScore -= 2; // Penalize using wildly wrong tier

      // Bonus for strength match
      const strengthMatch = model.strengths.filter(s =>
        s === taskType || s === 'general' || s === 'reasoning'
      ).length;
      modelScore += strengthMatch * 0.5;

      // Prefer cheaper models when complexity is low
      if (complexity.tier === 'fast') {
        modelScore += (10 - model.costPer1kTokens) * 0.3;
      }

      // Prefer faster models for simple tasks
      if (complexity.tier === 'fast') {
        modelScore += model.speed * 0.2;
      }

      // If user prefers a specific provider, boost it
      if (preferredProvider !== 'auto' && model.provider === preferredProvider) {
        modelScore += 2;
      }

      return { ...model, routingScore: modelScore };
    });

    // Sort by routing score descending
    scored.sort((a, b) => b.routingScore - a.routingScore);

    const primary = scored[0];
    const fallbacks = scored.slice(1);

    this.lastRouting = { primary, fallbacks, complexity, timestamp: Date.now() };

    console.log(
      `[IntelligenceRouter] Complexity: ${complexity.score.toFixed(2)} (${complexity.tier}) -> ${primary.id} (${primary.provider}/${primary.model})`,
      complexity.signals
    );

    return { primary, fallbacks, complexity };
  }

  /**
   * Record that a request was completed and track tokens.
   */
  trackCompletion(modelId, provider, estimatedTokens) {
    return this.tokenTracker.trackRequest(provider, modelId, estimatedTokens);
  }

  /**
   * Get usage summary for display in UI.
   */
  getUsageSummary() {
    return this.tokenTracker.getUsageSummary();
  }

  /**
   * Reset usage tracking.
   */
  resetUsage() {
    this.tokenTracker.resetUsage();
  }

  /**
   * Get the last routing decision (for debugging/display).
   */
  getLastRouting() {
    return this.lastRouting;
  }

  /**
   * Get the full model registry (for settings UI).
   */
  getModelRegistry() {
    return [...this.registry];
  }

  /**
   * Add a model to the registry at runtime (auto-adapts routing).
   */
  addModel(modelDef) {
    if (!modelDef.id || !modelDef.provider || !modelDef.model || !modelDef.tier) {
      throw new Error('Model definition requires id, provider, model, and tier');
    }
    // Remove existing entry with same id if present
    this.registry = this.registry.filter(m => m.id !== modelDef.id);
    this.registry.push({
      capability: 5,
      speed: 5,
      costPer1kTokens: 0,
      maxTokens: 4096,
      temperature: 0.7,
      strengths: ['general'],
      description: '',
      ...modelDef
    });
  }

  /**
   * Remove a model from the registry.
   */
  removeModel(modelId) {
    this.registry = this.registry.filter(m => m.id !== modelId);
  }
}

// Singleton
const intelligenceRouter = new IntelligenceRouter();

export { analyzeComplexity, MODEL_REGISTRY, TOKEN_WARNING_THRESHOLDS };
export default intelligenceRouter;

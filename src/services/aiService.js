/**
 * Multi-AI Service Layer
 * Integrates Offline AI (Transformers.js), ChatGPT, Claude, Gemini, Groq (FREE), and Hugging Face (FREE) APIs
 */

import offlineAIService from './offlineAIService';
import intelligenceRouter from './intelligenceRouter';

class AIService {
  constructor() {
    // Request queue to prevent concurrent API calls
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.maxConcurrentRequests = 2; // Limit concurrent requests
    this.activeRequests = 0;

    // Response cache with TTL
    this.responseCache = new Map();
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes

    // Request cancellation
    this.activeRequestControllers = new Map();

    // Intelligence router
    this.router = intelligenceRouter;
    
    this.apis = {
      gemini: {
        key: "",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
        requiresKey: true,
        free: false
      },
      openai: {
        key: "",
        endpoint: "https://api.openai.com/v1/chat/completions",
        requiresKey: true,
        free: false
      },
      anthropic: {
        key: "",
        endpoint: "https://api.anthropic.com/v1/messages",
        requiresKey: true,
        free: false
      },
      groq: {
        key: "",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        requiresKey: true,
        free: true, // Free tier: 14,400 requests/day
        model: "llama-3.3-70b-versatile"
      },
      huggingface: {
        key: "",
        endpoint: "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct",
        requiresKey: false, // Can work without key, but better with key
        free: true,
        model: "microsoft/Phi-3-mini-4k-instruct" // Faster, smaller model that works well
      }
    };
    
    this.envKeyMap = {
      gemini: process.env.REACT_APP_GEMINI_API_KEY || '',
      openai: process.env.REACT_APP_OPENAI_API_KEY || '',
      anthropic: process.env.REACT_APP_ANTHROPIC_API_KEY || '',
      groq: process.env.REACT_APP_GROQ_API_KEY || '',
      huggingface: process.env.REACT_APP_HUGGINGFACE_API_KEY || ''
    };
    this.runtimeKeys = {};
    // Use the Netlify function proxy when we're not in local dev. This is
    // the only way Anthropic/Claude works from the browser (api.anthropic.com
    // doesn't permit cross-origin preflight). The proxy still accepts the
    // user's BYOK key passed in the body when no cookie session / env key is
    // configured server-side.
    this.useServerProxy =
      typeof window !== 'undefined' &&
      !/^(localhost|127\.|0\.0\.0\.0)/.test(window.location.host || '');

    // Load preferred provider from localStorage
    this.preferredProvider = localStorage.getItem('ai_preferred_provider') || 'auto';
    this.loadApiKeys();
    this._assertNoHardcodedKeys();
  }
  
  /**
   * Set preferred AI provider
   */
  setPreferredProvider(provider) {
    this.preferredProvider = provider;
    localStorage.setItem('ai_preferred_provider', provider);
  }
  
  /**
   * Get preferred provider
   */
  getPreferredProvider() {
    return this.preferredProvider;
  }

  // ─── Loomwright AI Providers routing ────────────────────────────────────────
  // The Loomwright AIProviders panel writes both into worldState.aiSettings and
  // into these two localStorage keys so the service stays a pure singleton:
  //   lw-ai-routing  -> { taskId: providerNameOrId }
  //   lw-ai-providers-> [{ id, name, model, enabled }]
  // Provider ids from Loomwright (p_anthropic, p_openai, p_gemini, p_local)
  // map to aiService provider names below.
  _loadLoomwrightRouting() {
    try {
      const raw = localStorage.getItem('lw-ai-routing');
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return obj && typeof obj === 'object' ? obj : {};
    } catch {
      return {};
    }
  }

  _resolveLoomwrightProvider(task) {
    const routing = this._loadLoomwrightRouting();
    const providerId = routing?.[task];
    if (!providerId) return null;
    // Loomwright provider ids -> aiService provider names
    const map = {
      p_anthropic: 'anthropic',
      p_openai: 'openai',
      p_gemini: 'gemini',
      p_groq: 'groq',
      p_huggingface: 'huggingface',
      p_local: 'offline',
    };
    // Allow direct provider names too
    if (this.apis[providerId]) return providerId;
    return map[providerId] || null;
  }

  /** Record a usage event (cheap; stored in localStorage for the UI to show). */
  _recordUsage(task, providerName, tokensApprox, ok) {
    try {
      const key = 'lw-ai-usage';
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      const entry = {
        at: Date.now(),
        taskId: task,
        providerId: providerName,
        tokens: tokensApprox,
        // Rough per-1K-token cost (defaults — AIProviders panel lets you override).
        costUSD: this._approxCost(providerName, tokensApprox),
        ok,
      };
      const next = [entry, ...arr].slice(0, 500);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  _approxCost(providerName, tokens) {
    const per1k = {
      anthropic: 0.003,
      openai: 0.0025,
      gemini: 0.0015,
      groq: 0,
      huggingface: 0,
      offline: 0,
    };
    return ((per1k[providerName] ?? 0) * (tokens || 0)) / 1000;
  }

  _approxTokens(prompt, systemContext, response) {
    const s = [prompt, systemContext, response].filter(Boolean).join(' ');
    return Math.ceil(s.length / 4);
  }

  /**
   * Loomwright Voice Studio plug-in: the app calls setLoomwrightContext() with
   * a live reference to worldState + current book/chapter. When present, any
   * "creative" callAI will prepend the active voice profile's guidance to the
   * systemContext. See src/loomwright/voice/voiceContext.js for resolution.
   */
  setLoomwrightContext(ctxOrGetter) {
    this._lwCtx = typeof ctxOrGetter === 'function' ? ctxOrGetter : () => ctxOrGetter;
  }
  _getLoomwrightVoiceSnippet(task) {
    try {
      if (!this._lwCtx) return '';
      const ctx = this._lwCtx();
      if (!ctx) return '';
      // Only inject for creative/rewrite-style tasks by default.
      const creativeTasks = new Set(['creative', 'general', 'voice', 'dialogue', 'scene', 'draft']);
      if (!creativeTasks.has(task)) return '';
      // Lazy require to avoid a circular import.
      // eslint-disable-next-line global-require
      const { voiceSystemSnippet } = require('../loomwright/voice/voiceContext');
      return voiceSystemSnippet(ctx.worldState, ctx.bookId, ctx.chapterId) || '';
    } catch {
      return '';
    }
  }

  /**
   * Get offline AI status
   */
  getOfflineAIStatus() {
    return offlineAIService.getReadyState();
  }

  /**
   * Check if offline AI is available
   */
  isOfflineAIAvailable() {
    return offlineAIService.isAvailable();
  }

  /**
   * Preload offline AI model (call this early to download model in background)
   */
  async preloadOfflineAI() {
    if (offlineAIService.isAvailable()) {
      try {
        await offlineAIService.loadModel();
        console.log('[AI Service] Offline AI preloaded successfully');
        return true;
      } catch (error) {
        console.warn('[AI Service] Failed to preload offline AI:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Set API key for a specific provider
   */
  setApiKey(provider, key) {
    if (this.apis[provider]) {
      this.apis[provider].key = key;
      this.runtimeKeys[provider] = key;
    }
  }

  getRuntimeKeys() {
    return { ...this.runtimeKeys };
  }

  async setApiKeySecure(provider, key) {
    const response = await fetch('/api/ai/ai-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN
          ? { 'x-claimwise-client': process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN }
          : {})
      },
      credentials: 'include',
      body: JSON.stringify({ provider, key })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to store API key');
    }
    this.setApiKey(provider, key);
    return data;
  }

  async validateApiKey(provider, key) {
    const response = await fetch('/api/ai/ai-validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN
          ? { 'x-claimwise-client': process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN }
          : {})
      },
      credentials: 'include',
      body: JSON.stringify({ provider, key })
    });
    const data = await response.json();
    return Boolean(response.ok && data.valid);
  }

  /**
   * Load API keys from secure runtime sources (env/session proxy)
   */
  loadApiKeys() {
    Object.keys(this.apis).forEach(provider => {
      if (this.runtimeKeys[provider]) {
        this.apis[provider].key = this.runtimeKeys[provider];
      } else if (this.envKeyMap[provider]) {
        this.apis[provider].key = this.envKeyMap[provider];
      }
    });
    
    // Load preferred provider
    const preferred = localStorage.getItem('ai_preferred_provider');
    if (preferred) {
      this.preferredProvider = preferred;
    }
  }

  _assertNoHardcodedKeys() {
    const keyPattern = /^(sk-|AIza)/;
    const embedded = Object.entries(this.apis).find(([, config]) => keyPattern.test(config.key || ''));
    if (embedded) {
      throw new Error(`Blocked startup: detected hardcoded API key pattern for provider ${embedded[0]}`);
    }
  }

  async callProviderProxy(provider, payload, abortController = null) {
    // BYOK fallback: if the user has saved a key locally and the server
    // hasn't been provisioned with a session cookie or env var, send the
    // key in the request body so the proxy can use it. Same-origin HTTPS,
    // never persisted server-side.
    const byokKey = this.runtimeKeys[provider] || this.apis?.[provider]?.key || null;
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN
          ? { 'x-claimwise-client': process.env.REACT_APP_CLAIMWISE_CLIENT_TOKEN }
          : {})
      },
      credentials: 'include',
      body: JSON.stringify({ provider, ...payload, ...(byokKey ? { apiKey: byokKey } : {}) })
    };
    if (abortController) {
      fetchOptions.signal = abortController.signal;
    }

    const response = await fetch('/api/ai/ai-proxy', fetchOptions);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'AI proxy error');
    }
    return data.text || '';
  }

  /**
   * Gemini API call
   */
  async callGemini(prompt, systemContext = "", abortController = null, model = null) {
    const geminiModel = model || 'gemini-2.5-flash-preview-04-17';
    if (this.useServerProxy) {
      return this.callProviderProxy('gemini', { prompt, systemContext, model: geminiModel }, abortController);
    }
    const { key } = this.apis.gemini;

    if (!key) {
      throw new Error("Gemini API key not set");
    }

    try {
      const fullPrompt = systemContext ? `${systemContext}\n\n${prompt}` : prompt;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

      const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        })
      };

      if (abortController) {
        fetchOptions.signal = abortController.signal;
      }

      const response = await fetch(`${endpoint}?key=${key}`, fetchOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Gemini API error');
      }

      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: No text generated.";
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  /**
   * ChatGPT (OpenAI) API call
   */
  async callChatGPT(prompt, systemContext = "", model = "gpt-4o", abortController = null) {
    if (this.useServerProxy) {
      return this.callProviderProxy('openai', { prompt, systemContext, model }, abortController);
    }
    const { key, endpoint } = this.apis.openai;

    if (!key) {
      throw new Error("OpenAI API key not set");
    }

    try {
      const messages = [];

      if (systemContext) {
        messages.push({ role: "system", content: systemContext });
      }

      messages.push({ role: "user", content: prompt });

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 4096
        })
      };

      // Add abort signal if provided
      if (abortController) {
        fetchOptions.signal = abortController.signal;
      }

      const response = await fetch(endpoint, fetchOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI API error');
      }

      return data.choices?.[0]?.message?.content || "Error: No text generated.";
    } catch (error) {
      console.error('ChatGPT API Error:', error);
      throw error;
    }
  }

  /**
   * Claude (Anthropic) API call
   */
  async callClaude(prompt, systemContext = "", model = "claude-3-5-sonnet-20241022", abortController = null) {
    if (this.useServerProxy) {
      return this.callProviderProxy('anthropic', { prompt, systemContext, model }, abortController);
    }
    const { key, endpoint } = this.apis.anthropic;

    if (!key) {
      throw new Error("Anthropic API key not set");
    }

    try {
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: systemContext || undefined,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      };

      if (abortController) {
        fetchOptions.signal = abortController.signal;
      }

      const response = await fetch(endpoint, fetchOptions);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Anthropic API error');
      }

      return data.content?.[0]?.text || "Error: No text generated.";
    } catch (error) {
      console.error('Claude API Error:', error);
      throw error;
    }
  }

  /**
   * Groq API call (FREE - 14,400 requests/day)
   * Very fast inference with Llama models
   */
  async callGroq(prompt, systemContext = "", model = "llama-3.3-70b-versatile", abortController = null) {
    if (this.useServerProxy) {
      return this.callProviderProxy('groq', { prompt, systemContext, model }, abortController);
    }
    const { key, endpoint } = this.apis.groq;

    if (!key) {
      throw new Error("Groq API key not set. Get a free key at https://console.groq.com/");
    }

    try {
      const messages = [];
      if (systemContext) {
        messages.push({ role: "system", content: systemContext });
      }
      messages.push({ role: "user", content: prompt });

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: model || this.apis.groq.model,
          messages,
          temperature: 0.7,
          max_tokens: 4096
        })
      };

      if (abortController) {
        fetchOptions.signal = abortController.signal;
      }

      const response = await fetch(endpoint, fetchOptions);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Groq API error');
      }

      return data.choices?.[0]?.message?.content || "Error: No text generated.";
    } catch (error) {
      console.error('Groq API Error:', error);
      throw error;
    }
  }

  /**
   * Hugging Face API call (FREE - no key required, but better with key)
   * Uses open-source models
   */
  async callHuggingFace(prompt, systemContext = "", abortController = null) {
    if (this.useServerProxy) {
      return this.callProviderProxy('huggingface', { prompt, systemContext }, abortController);
    }
    const { key, endpoint, model } = this.apis.huggingface;

    try {
      // Format prompt for instruction-tuned models
      const fullPrompt = systemContext 
        ? `<|system|>\n${systemContext}\n<|user|>\n${prompt}\n<|assistant|>\n`
        : `<|user|>\n${prompt}\n<|assistant|>\n`;

      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (key) {
        headers['Authorization'] = `Bearer ${key}`;
      }

      const fetchOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 2048,
            temperature: 0.7,
            return_full_text: false,
            top_p: 0.9
          }
        })
      };

      if (abortController) {
        fetchOptions.signal = abortController.signal;
      }

      const response = await fetch(endpoint, fetchOptions);

      // Hugging Face may return 503 if model is loading - wait and retry
      if (response.status === 503) {
        const waitTime = response.headers.get('Retry-After') || 10;
        throw new Error(`Model is loading. Please wait ${waitTime} seconds and try again.`);
      }

      const data = await response.json();

      if (!response.ok) {
        // Hugging Face sometimes returns errors in the data array
        if (Array.isArray(data) && data[0]?.error) {
          throw new Error(data[0].error);
        }
        throw new Error(data.error || `Hugging Face API error: ${response.status}`);
      }

      // Hugging Face returns array format for text generation
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text.trim();
      }
      
      // Sometimes returns object directly
      if (data.generated_text) {
        return data.generated_text.trim();
      }
      
      throw new Error("Unexpected response format from Hugging Face");
    } catch (error) {
      console.error('Hugging Face API Error:', error);
      throw error;
    }
  }

  /**
   * Get list of available providers (with keys configured)
   */
  getAvailableProviders() {
    return Object.entries(this.apis)
      .filter(([name, config]) => {
        if (config.requiresKey) {
          return !!config.key;
        }
        return true; // Free providers that don't require keys
      })
      .map(([name, config]) => ({
        name,
        free: config.free || false,
        requiresKey: config.requiresKey || false,
        hasKey: !!config.key
      }));
  }

  /**
   * Generate cache key from prompt and context
   */
  _generateCacheKey(prompt, systemContext, task) {
    const crypto = window.crypto || window.msCrypto;
    if (crypto && crypto.subtle) {
      // Use hash for cache key (async, but we'll use simple string for now)
      return `${task}:${prompt.substring(0, 100)}:${systemContext.substring(0, 50)}`;
    }
    // Fallback: simple string key
    return `${task}:${prompt.substring(0, 200)}:${systemContext.substring(0, 100)}`;
  }

  /**
   * Get cached response if available
   */
  _getCachedResponse(cacheKey) {
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    if (cached) {
      this.responseCache.delete(cacheKey);
    }
    return null;
  }

  /**
   * Cache response
   */
  _cacheResponse(cacheKey, data) {
    const expires = Date.now() + this.cacheTTL;
    this.responseCache.set(cacheKey, { data, expires });
    
    // Limit cache size (keep last 100 entries)
    if (this.responseCache.size > 100) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
  }

  /**
   * Clear response cache
   */
  clearCache() {
    this.responseCache.clear();
  }

  /**
   * Process request queue
   */
  async _processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    if (this.activeRequests >= this.maxConcurrentRequests) {
      return; // Wait for active requests to complete
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const request = this.requestQueue.shift();
      this.activeRequests++;

      // Process request
      this._executeRequest(request)
        .finally(() => {
          this.activeRequests--;
          // Continue processing queue
          this._processQueue();
        });
    }

    this.isProcessingQueue = false;
  }

  /**
   * Retry with exponential backoff
   */
  async _retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on cancellation or client errors (4xx)
        if (error.name === 'AbortError' || 
            error.message === 'Request cancelled' ||
            (error.status >= 400 && error.status < 500)) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries - 1) {
          break;
        }
        
        // Exponential backoff: delay = initialDelay * 2^attempt
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`[AI Service] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  /**
   * Execute a queued request
   */
  async _executeRequest({ resolve, reject, prompt, task, systemContext, cacheKey, abortController }) {
    try {
      // Check cache first
      const cached = this._getCachedResponse(cacheKey);
      if (cached !== null) {
        resolve(cached);
        return;
      }

      // Check if request was cancelled
      if (abortController?.signal.aborted) {
        reject(new Error('Request cancelled'));
        return;
      }

      // Make actual API call with retry logic
      const result = await this._retryWithBackoff(
        () => this._callAIInternal(prompt, task, systemContext, abortController),
        3, // max retries
        1000 // initial delay 1 second
      );
      
      // Cache the result
      this._cacheResponse(cacheKey, result);
      
      resolve(result);
    } catch (error) {
      if (error.name === 'AbortError' || error.message === 'Request cancelled') {
        reject(new Error('Request cancelled'));
      } else {
        reject(error);
      }
    } finally {
      // Remove from active controllers
      if (abortController) {
        this.activeRequestControllers.delete(abortController);
      }
    }
  }

  /**
   * Get list of providers that have keys configured
   */
  _getConfiguredProviders() {
    const configured = [];
    for (const [name, config] of Object.entries(this.apis)) {
      if (this.useServerProxy || !config.requiresKey || config.key) {
        configured.push(name);
      }
    }
    return configured;
  }

  /**
   * Internal AI call (without queue/cache)
   * Uses the intelligence router to automatically pick the best model for the request.
   */
  async _callAIInternal(prompt, task, systemContext, abortController) {
    const configuredProviders = this._getConfiguredProviders();

    // Use the intelligence router to determine the best model
    const { primary, fallbacks, complexity } = this.router.route(
      prompt,
      systemContext,
      task,
      configuredProviders,
      this.preferredProvider
    );

    // Build the model chain: primary + fallbacks from router
    const modelChain = [];

    // Add offline as first option if available
    if (offlineAIService.isAvailable()) {
      modelChain.push({ provider: 'offline', model: null, id: 'offline' });
    }

    if (primary) {
      modelChain.push(primary);
    }
    modelChain.push(...fallbacks);

    // If router found no models (no keys set), fall back to legacy chain
    if (!primary) {
      const legacyFallback = ['groq', 'gemini', 'openai', 'anthropic', 'huggingface'];
      for (const provider of legacyFallback) {
        const config = this.apis[provider];
        if (config && (this.useServerProxy || !config.requiresKey || config.key)) {
          modelChain.push({ provider, model: null, id: provider });
        }
      }
    }

    // Try each model in the chain
    let lastError = null;
    for (const modelDef of modelChain) {
      if (abortController?.signal.aborted) {
        throw new Error('Request cancelled');
      }

      try {
        const config = this.apis[modelDef.provider];
        if (!config && modelDef.provider !== 'offline') continue;

        if (modelDef.provider !== 'offline' && !this.useServerProxy && config.requiresKey && !config.key) {
          continue;
        }

        console.log(`[AI Service] Trying: ${modelDef.id} (${modelDef.provider}/${modelDef.model || 'default'}) | Complexity: ${complexity.tier} (${complexity.score.toFixed(2)})`);

        const result = await this.callByProvider(
          modelDef.provider,
          prompt,
          systemContext,
          abortController,
          modelDef.model // pass the specific model from the registry
        );

        console.log(`[AI Service] Success: ${modelDef.id}`);

        // Track token usage (estimate: ~4 chars per token for prompt, response ~same length)
        const estimatedTokens = Math.ceil((prompt.length + (systemContext?.length || 0) + (result?.length || 0)) / 4);
        const tracking = this.router.trackCompletion(modelDef.id, modelDef.provider, estimatedTokens);

        if (tracking.warning) {
          console.warn(`[AI Service] Usage warning: ${tracking.warning.message}`);
        }

        return result;
      } catch (error) {
        if (error.name === 'AbortError' || error.message === 'Request cancelled') {
          throw error;
        }

        console.warn(`[AI Service] ${modelDef.id} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    throw lastError || new Error("All AI providers failed. Please check your API keys in Settings.");
  }

  /**
   * Smart AI router - chooses best AI for the task with fallback
   * Now includes request queuing and caching
   */
  async callAI(prompt, task = "general", systemContext = "", options = {}) {
    const { 
      useCache = true, 
      abortController = null,
      skipQueue = false 
    } = options;

    // Loomwright AI Providers task routing: consult the task -> provider map.
    // We temporarily override the preferredProvider for this single call and
    // record a usage event after it resolves (success or failure).
    const routedProvider = this._resolveLoomwrightProvider(task);
    const prevPreferred = this.preferredProvider;
    if (routedProvider && this.apis[routedProvider]) {
      this.preferredProvider = routedProvider;
    }
    const restorePreferred = () => {
      if (routedProvider) this.preferredProvider = prevPreferred;
    };

    // Loomwright Voice Studio plug-in: fold the active chapter's voice profile
    // into the systemContext for creative tasks. No-op when no profile active.
    const voiceSnippet = this._getLoomwrightVoiceSnippet(task);
    if (voiceSnippet) {
      systemContext = systemContext ? `${voiceSnippet}\n\n${systemContext}` : voiceSnippet;
    }

    // Generate cache key
    const cacheKey = useCache ? this._generateCacheKey(prompt, systemContext, task) : null;
    
    // Check cache first
    if (useCache && cacheKey) {
      const cached = this._getCachedResponse(cacheKey);
      if (cached !== null) {
        console.log('[AI Service] Returning cached response');
        return cached;
      }
    }

    // Create abort controller if not provided
    const controller = abortController || new AbortController();
    if (!abortController) {
      this.activeRequestControllers.set(controller, { prompt, task });
    }

    // If skipQueue is true, execute immediately (for critical requests)
    if (skipQueue) {
      try {
        const result = await this._callAIInternal(prompt, task, systemContext, controller);
        if (useCache && cacheKey) {
          this._cacheResponse(cacheKey, result);
        }
        this._recordUsage(task, this.preferredProvider, this._approxTokens(prompt, systemContext, result), true);
        restorePreferred();
        return result;
      } catch (error) {
        this._recordUsage(task, this.preferredProvider, this._approxTokens(prompt, systemContext, ''), false);
        restorePreferred();
        if (controller && !abortController) {
          this.activeRequestControllers.delete(controller);
        }
        throw error;
      }
    }

    // Otherwise, queue the request (still record usage through a wrapping promise)
    return new Promise((resolve, reject) => {
      const wrappedResolve = (result) => {
        this._recordUsage(task, this.preferredProvider, this._approxTokens(prompt, systemContext, result), true);
        restorePreferred();
        resolve(result);
      };
      const wrappedReject = (err) => {
        this._recordUsage(task, this.preferredProvider, this._approxTokens(prompt, systemContext, ''), false);
        restorePreferred();
        reject(err);
      };
      this.requestQueue.push({
        resolve: wrappedResolve,
        reject: wrappedReject,
        prompt,
        task,
        systemContext,
        cacheKey,
        abortController: controller
      });

      // Start processing queue
      this._processQueue();
    });
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(abortController) {
    if (abortController) {
      abortController.abort();
      this.activeRequestControllers.delete(abortController);
    }
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests() {
    for (const controller of this.activeRequestControllers.keys()) {
      controller.abort();
    }
    this.activeRequestControllers.clear();
    this.requestQueue = [];
  }

  /**
   * Call specific provider with optional model override from intelligence router
   */
  async callByProvider(provider, prompt, systemContext = "", abortController = null, model = null) {
    switch (provider) {
      case "offline":
        if (!offlineAIService.isAvailable()) {
          throw new Error("Offline AI is not available on this device");
        }
        return offlineAIService.generate(prompt, systemContext, {
          maxLength: 512,
          temperature: 0.7
        });
      case "gemini":
        return this.callGemini(prompt, systemContext, abortController, model);
      case "openai":
        return this.callChatGPT(prompt, systemContext, model || "gpt-4o", abortController);
      case "anthropic":
        return this.callClaude(prompt, systemContext, model || "claude-sonnet-4-20250514", abortController);
      case "groq":
        return this.callGroq(prompt, systemContext, model || "llama-3.3-70b-versatile", abortController);
      case "huggingface":
        return this.callHuggingFace(prompt, systemContext, abortController);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get the intelligence router instance (for UI access)
   */
  getRouter() {
    return this.router;
  }

  /**
   * Get usage summary from the intelligence router
   */
  getUsageSummary() {
    return this.router.getUsageSummary();
  }

  /**
   * Manuscript parsing - extracts actor updates from text
   */
  async parseManuscript(text, actors, context = {}) {
    const systemContext = `You are an expert at analyzing RPG game text and extracting character progression.
Extract any stat changes, skill acquisitions, level ups, or item gains mentioned in the text.
Return a JSON object with the format:
{
  "updates": [
    {
      "actorId": "actor_id",
      "actorName": "Actor Name",
      "changes": {
        "stats": {"STR": +5, "INT": +2},
        "skills": ["skill_name"],
        "items": ["item_name"],
        "level": 5
      },
      "confidence": 0.9,
      "textEvidence": "quote from text"
    }
  ]
}

Available actors: ${actors.map(a => `${a.id}: ${a.name}`).join(', ')}`;

    const prompt = `Analyze this manuscript text and extract character progression:\n\n${text}`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { updates: [], raw: response };
    } catch (error) {
      console.error('Manuscript parsing error:', error);
      return { updates: [], error: error.message };
    }
  }

  /**
   * Generate wiki entry (wrapper for generateWiki)
   */
  async generateWikiEntry(entityType, entityData) {
    return await this.generateWiki(entityData, entityType, {});
  }

  /**
   * Auto-generate wiki entry for an item/actor
   */
  async generateWiki(entity, type = "item", context = {}) {
    const systemContext = `You are writing wiki entries for a dark comedy horror-RPG book series called "The Compliance Run".
The series is about bureaucratic fantasy apocalypse where a fallen knight and goblin squire navigate a welfare system with RPG mechanics.
Tone: 60% dark comedy, 40% horror. Think Terry Pratchett meets Dark Souls meets UK welfare system.`;

    const prompt = `Create a comprehensive wiki entry for this ${type}:

Name: ${entity.name}
Type: ${entity.type || type}
Description: ${entity.desc || entity.description || ''}
${type === 'item' ? `Stats: ${JSON.stringify(entity.stats || {})}` : ''}
${type === 'actor' ? `Class: ${entity.class}, Role: ${entity.role}` : ''}

Context: ${JSON.stringify(context, null, 2)}

Format the wiki entry in markdown with sections for:
- Overview
- ${type === 'item' ? 'Mechanics' : 'Background'}
- ${type === 'item' ? 'Lore' : 'Personality & Traits'}
- ${type === 'item' ? 'Acquisition' : 'Story Arc'}
- Trivia`;

    return this.callAI(prompt, "creative", systemContext);
  }

  /**
   * Generate relationship summary between two actors
   */
  async generateRelationshipSummary(actor1, actor2, chapter, events = []) {
    const systemContext = `Summarize the relationship between two characters in "The Compliance Run" series.
Focus on their interactions, conflicts, alliances, and how their relationship evolves.`;

    const prompt = `Summarize the relationship between ${actor1.name} and ${actor2.name} in Chapter ${chapter}:

${actor1.name} (${actor1.class}): ${actor1.role}
${actor2.name} (${actor2.class}): ${actor2.role}

Events in this chapter:
${events.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Provide a 2-3 sentence summary of their relationship dynamics in this chapter.`;

    return this.callAI(prompt, "analytical", systemContext);
  }

  /**
   * Consistency checking across chapters
   */
  async checkConsistency(data, scope = "chapter") {
    const systemContext = `You are a continuity editor for "The Compliance Run" book series.
Check for inconsistencies in character stats, story events, item possession, and narrative logic.`;

    const prompt = `Analyze this data for consistency issues:

${JSON.stringify(data, null, 2)}

Return a JSON array of issues found:
[
  {
    "type": "stat_mismatch" | "item_conflict" | "story_contradiction" | "character_error",
    "severity": "critical" | "warning" | "minor",
    "description": "Clear description of the issue",
    "location": "Book X, Chapter Y",
    "suggestion": "How to fix it"
  }
]`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Consistency check error:', error);
      return [];
    }
  }

  /**
   * Generate Diablo-style item with procedural generation
   */
  async generateDiabloItem(baseType, quality, affixes, context = {}) {
    const systemContext = `You are a Diablo II-style item generator for "The Compliance Run" series.
Generate items that blend bureaucratic horror with RPG mechanics.
Examples: "Council-Tax-Evader" (greatsword), "Bag For Life" (artifact), "Hi-Vis Tabard" (armor)`;

    const prompt = `Generate a ${quality} quality ${baseType} with the following parameters:

Base Type: ${baseType}
Quality: ${quality}
Number of Affixes: ${affixes}
Theme: Bureaucratic Fantasy Apocalypse

Additional Context:
${JSON.stringify(context, null, 2)}

Return JSON format:
{
  "name": "Item Name (creative, fitting the theme)",
  "type": "${baseType}",
  "desc": "Flavor text description",
  "stats": {"STR": 10, "VIT": 5, etc},
  "grantsSkills": ["skill_id"],
  "quests": "Optional upgrade quest description",
  "debuffs": "Optional curse or debuff",
  "rarity": "Common|Uncommon|Rare|Epic|Legendary",
  "lore": "Background story of the item"
}`;

    try {
      const response = await this.callAI(prompt, "structured", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('Item generation error:', error);
      return null;
    }
  }

  /**
   * Process book document - extract book structure with chapters
   */
  async processBookDocument(docText, existingBooks = []) {
    const systemContext = `You are analyzing a book document for "The Compliance Run" series.
Extract the book structure including title, focus, and all chapters with their titles and descriptions.
Return JSON:
{
  "book": {
    "title": "Book Title",
    "focus": "Main theme/focus",
    "chapters": [
      {"title": "Chapter Title", "desc": "Chapter description", "synopsis": "..."}
    ]
  },
  "confidence": 0.9
}`;

    const existingTitles = existingBooks.map(b => b.title).join(', ');
    const prompt = `Analyze this book document and extract the book structure:\n\n${docText}\n\nExisting books: ${existingTitles || 'None'}`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { book: null, confidence: 0, raw: response };
    } catch (error) {
      console.error('Book processing error:', error);
      return { book: null, confidence: 0, error: error.message };
    }
  }

  /**
   * Process item batch - extract multiple items from document
   */
  async processItemBatch(docText, existingItems = []) {
    const systemContext = `You are extracting items from a document for "The Compliance Run" series - a dark comedy horror-RPG book series about bureaucratic fantasy apocalypse.

IMPORTANT: Extract EVERY item mentioned in the document, even if details are minimal. Return a JSON object with an "items" array.

For each item, extract:
- name: The item's name (required)
- type: One of: Weapon, Armor, Artifact, Tool, Consumable
- desc: Description of the item
- rarity: One of: common, uncommon, rare, epic, legendary, cursed
- stats: Object with stat modifiers (e.g., {"STR": 10, "VIT": 5})
- grantsSkills: Array of skill names or IDs this item grants
- quests: Any quest text associated with the item
- debuffs: Any negative effects

Example response format:
{
  "items": [
    {
      "name": "Rolling Pin of Judgment",
      "type": "Weapon",
      "desc": "A heavy rolling pin used by bureaucratic enforcers",
      "rarity": "rare",
      "stats": {"STR": 15, "INT": 5},
      "grantsSkills": [],
      "quests": "",
      "debuffs": ""
    }
  ],
  "confidence": 0.9
}

Return ONLY valid JSON. Do not include markdown code blocks or explanatory text.`;

    const existingNames = existingItems.map(i => i.name).join(', ');
    const prompt = `Extract ALL items from this document. Be thorough - extract every item mentioned, even if some details are missing.

Document text:
${docText.substring(0, 10000)}${docText.length > 10000 ? '\n[... document continues ...]' : ''}

Existing items (avoid duplicates): ${existingNames || 'None'}

Return JSON with items array:`;

    try {
      const response = await this.callAI(prompt, "structured", systemContext);
      
      // Try multiple JSON extraction methods
      let jsonData = null;
      
      // Method 1: Direct JSON match
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          jsonData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn('JSON parse error, trying alternative methods:', e);
        }
      }
      
      // Method 2: Try to find items array specifically
      if (!jsonData || !jsonData.items) {
        const itemsMatch = response.match(/\[[\s\S]*\]/);
        if (itemsMatch) {
          try {
            const itemsArray = JSON.parse(itemsMatch[0]);
            jsonData = { items: itemsArray, confidence: 0.8 };
          } catch (e) {
            console.warn('Alternative JSON parse failed:', e);
          }
        }
      }
      
      if (jsonData && jsonData.items && Array.isArray(jsonData.items)) {
        // Validate and clean items
        const validItems = jsonData.items.filter(item => item && item.name);
        return { 
          items: validItems, 
          confidence: jsonData.confidence || 0.8,
          raw: response 
        };
      }
      
      return { items: [], confidence: 0, raw: response, error: 'No valid items extracted' };
    } catch (error) {
      console.error('Item batch processing error:', error);
      return { items: [], confidence: 0, error: error.message, raw: null };
    }
  }

  /**
   * Process skill batch - extract multiple skills from document
   */
  async processSkillBatch(docText, existingSkills = []) {
    const systemContext = `You are extracting skills from a document for "The Compliance Run" series - a dark comedy horror-RPG book series about bureaucratic fantasy apocalypse.

IMPORTANT: Extract EVERY skill mentioned in the document, even if details are minimal. Return a JSON object with a "skills" array.

For each skill, extract:
- name: The skill's name (required)
- type: One of: Combat, Passive, Aura, Social, Magic, Utility, Crowd Control
- desc: Description of what the skill does
- statMod: Object with stat modifiers (e.g., {"STR": 5, "INT": 3})
- tier: Skill tier (1-5, where 1 is Novice, 5 is Legendary)
- defaultVal: Default skill level (usually 1)
- requiredLevel: Minimum character level to learn
- maxLevel: Maximum skill level

Example response format:
{
  "skills": [
    {
      "name": "Queue Tolerance",
      "type": "Passive",
      "desc": "Reduces panic in crowded bureaucratic areas",
      "statMod": {"INT": 5, "VIT": 3},
      "tier": 1,
      "defaultVal": 1,
      "requiredLevel": 5,
      "maxLevel": 20
    }
  ],
  "confidence": 0.9
}

Return ONLY valid JSON. Do not include markdown code blocks or explanatory text.`;

    const existingNames = existingSkills.map(s => s.name).join(', ');
    const prompt = `Extract ALL skills from this document. Be thorough - extract every skill mentioned, even if some details are missing.

Document text:
${docText.substring(0, 10000)}${docText.length > 10000 ? '\n[... document continues ...]' : ''}

Existing skills (avoid duplicates): ${existingNames || 'None'}

Return JSON with skills array:`;

    try {
      const response = await this.callAI(prompt, "structured", systemContext);
      
      // Try multiple JSON extraction methods
      let jsonData = null;
      
      // Method 1: Direct JSON match
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          jsonData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn('JSON parse error, trying alternative methods:', e);
        }
      }
      
      // Method 2: Try to find skills array specifically
      if (!jsonData || !jsonData.skills) {
        const skillsMatch = response.match(/\[[\s\S]*\]/);
        if (skillsMatch) {
          try {
            const skillsArray = JSON.parse(skillsMatch[0]);
            jsonData = { skills: skillsArray, confidence: 0.8 };
          } catch (e) {
            console.warn('Alternative JSON parse failed:', e);
          }
        }
      }
      
      if (jsonData && jsonData.skills && Array.isArray(jsonData.skills)) {
        // Validate and clean skills
        const validSkills = jsonData.skills.filter(skill => skill && skill.name);
        return { 
          skills: validSkills, 
          confidence: jsonData.confidence || 0.8,
          raw: response 
        };
      }
      
      return { skills: [], confidence: 0, raw: response, error: 'No valid skills extracted' };
    } catch (error) {
      console.error('Skill batch processing error:', error);
      return { skills: [], confidence: 0, error: error.message, raw: null };
    }
  }

  /**
   * Process relationship batch - extract relationships from document
   */
  async processRelationshipBatch(docText, actors = []) {
    const systemContext = `You are extracting character relationships from a document.
Extract ALL relationships mentioned. Return JSON array:
{
  "relationships": [
    {
      "actor1Id": "actor_id",
      "actor2Id": "actor_id",
      "type": "ally|enemy|neutral|romantic|family",
      "strength": 0.8,
      "description": "Relationship description",
      "events": ["Event 1", "Event 2"]
    }
  ],
  "confidence": 0.9
}`;

    const actorList = actors.map(a => `${a.id}: ${a.name}`).join(', ');
    const prompt = `Extract all relationships from this document:\n\n${docText}\n\nAvailable actors: ${actorList || 'None'}`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { relationships: [], confidence: 0, raw: response };
    } catch (error) {
      console.error('Relationship batch processing error:', error);
      return { relationships: [], confidence: 0, error: error.message };
    }
  }

  /**
   * Process story map connections - extract chapter connections
   */
  async processStoryMapConnections(docText, chapters = []) {
    const systemContext = `You are analyzing story connections between chapters.
Extract connections and relationships between chapters. Return JSON:
{
  "connections": [
    {
      "fromChapterId": "book_chapter",
      "toChapterId": "book_chapter",
      "type": "plot|character|theme|trope",
      "description": "Connection description"
    }
  ],
  "confidence": 0.9
}`;

    const chapterList = chapters.map(c => `${c.bookId}_${c.id}: ${c.title}`).join(', ');
    const prompt = `Analyze story connections in this document:\n\n${docText}\n\nAvailable chapters: ${chapterList || 'None'}`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { connections: [], confidence: 0, raw: response };
    } catch (error) {
      console.error('Story map processing error:', error);
      return { connections: [], confidence: 0, error: error.message };
    }
  }

  /**
   * Detect story connections between chapters
   */
  async detectStoryConnections(chapters) {
    const systemContext = `You are analyzing story connections between chapters.
Detect connections based on plot threads, character arcs, themes, and tropes.
Return JSON array:
[
  {
    "chapters": ["chapter_id_1", "chapter_id_2"],
    "type": "plot|character|theme|trope",
    "description": "Connection description",
    "confidence": 0.9
  }
]`;

    const chapterText = chapters.map(c => `${c.id}: ${c.title} - ${c.desc || ''}`).join('\n');
    const prompt = `Analyze these chapters and detect connections:\n\n${chapterText}`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Connection detection error:', error);
      return [];
    }
  }

  /**
   * Enhanced document scanning for batch processing
   */
  async scanDocumentForSuggestions(docText, worldState) {
    // Chunk large documents for better processing
    const chunkSize = 8000;
    const chunks = [];
    for (let i = 0; i < docText.length; i += chunkSize) {
      chunks.push(docText.substring(i, i + chunkSize));
    }

    const systemContext = `You are an AI assistant for "The Compliance Run" book series tracker app. Extract ALL entities mentioned in the document text.

IMPORTANT: Extract EVERY entity you find - actors, items, skills, chapters, and actor updates. Be thorough and extract even partial information.

PAY SPECIAL ATTENTION TO:
- Items with stat mentions: Look for patterns like "got an item", "found a", "acquired", "received" followed by stat descriptions like "+2 STR", "+2 VIT", "grants +5 INT", etc.
- Actor state changes: Look for level ups, stat gains, item acquisitions, skill unlocks (e.g., "Grimguff gained +2 STR", "leveled up", "learned a new skill")
- Chapters: Look for chapter titles, chapter numbers, chapter breaks, or narrative sections that could be chapters

Return a JSON object with this EXACT structure:
{
  "suggestions": {
    "newActors": [
      {
        "name": "Actor Name",
        "description": "Description",
        "class": "Class name",
        "stats": {"STR": 10, "VIT": 10, "INT": 10, "DEX": 10}
      }
    ],
    "newItems": [
      {
        "name": "Item Name",
        "description": "Description",
        "type": "Weapon|Armor|Artifact|Tool|Consumable",
        "rarity": "common|uncommon|rare|epic|legendary",
        "stats": {"STR": 2, "VIT": 2},
        "extractedFrom": "Context where item was mentioned"
      }
    ],
    "newSkills": [
      {
        "name": "Skill Name",
        "description": "Description",
        "type": "Combat|Passive|Aura|Social|Magic|Utility",
        "tier": 1,
        "statMod": {"STR": 5}
      }
    ],
    "updatedActors": [
      {
        "actorName": "Actor Name",
        "changes": {
          "stats": {"STR": 2, "VIT": 2},
          "items": ["item_name"],
          "skills": ["skill_name"],
          "level": 5
        },
        "context": "What happened that caused these changes"
      }
    ],
    "newChapters": [
      {
        "title": "Chapter Title",
        "synopsis": "Chapter description/summary",
        "content": "Full chapter text if available"
      }
    ]
  },
  "confidence": 0.8
}

For items, extract ALL stat mentions. If text says "got a sword that gives +2 STR and +2 VIT", create an item with stats: {"STR": 2, "VIT": 2}.

For actor updates, extract ANY stat changes, level ups, or item/skill acquisitions mentioned in the text.

Return ONLY valid JSON. No markdown, no explanations, just the JSON object.`;

    const existingActors = worldState.actors?.map(a => a.name).join(', ') || 'None';
    const existingItems = worldState.itemBank?.map(i => i.name).join(', ') || 'None';
    const existingSkills = worldState.skillBank?.map(s => s.name).join(', ') || 'None';

    try {
      // Process chunks and merge results
      const allSuggestions = {
        newActors: [],
        newItems: [],
        newSkills: [],
        updatedActors: [],
        newChapters: []
      };
      let totalConfidence = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const prompt = `Analyze this document chunk (${i + 1}/${chunks.length}) and extract ALL entities:

Document chunk:
${chunk}

Existing entities (avoid duplicates):
- Actors: ${existingActors}
- Items: ${existingItems}
- Skills: ${existingSkills}

Extract everything you find. Return JSON with suggestions object:`;

        try {
          const response = await this.callAI(prompt, "analytical", systemContext);
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.suggestions) {
              // Merge results
              if (parsed.suggestions.newActors) allSuggestions.newActors.push(...parsed.suggestions.newActors);
              if (parsed.suggestions.newItems) allSuggestions.newItems.push(...parsed.suggestions.newItems);
              if (parsed.suggestions.newSkills) allSuggestions.newSkills.push(...parsed.suggestions.newSkills);
              if (parsed.suggestions.updatedActors) allSuggestions.updatedActors.push(...parsed.suggestions.updatedActors);
              if (parsed.suggestions.newChapters) allSuggestions.newChapters.push(...parsed.suggestions.newChapters);
              totalConfidence += parsed.confidence || 0.8;
            }
          }
        } catch (chunkError) {
          console.warn(`Error processing chunk ${i + 1}:`, chunkError);
        }
      }

      // Remove duplicates based on name
      const uniqueActors = Array.from(new Map(allSuggestions.newActors.map(a => [a.name, a])).values());
      const uniqueItems = Array.from(new Map(allSuggestions.newItems.map(i => [i.name, i])).values());
      const uniqueSkills = Array.from(new Map(allSuggestions.newSkills.map(s => [s.name, s])).values());

      return {
        suggestions: {
          newActors: uniqueActors,
          newItems: uniqueItems,
          newSkills: uniqueSkills,
          updatedActors: allSuggestions.updatedActors,
          newChapters: allSuggestions.newChapters
        },
        confidence: chunks.length > 0 ? totalConfidence / chunks.length : 0.8
      };
    } catch (error) {
      console.error('Document scanning error:', error);
      return { suggestions: {}, error: error.message };
    }
  }

  /**
   * Process manuscript with buzz word detection and intelligent extraction
   */
  async processManuscriptIntelligence(docText, worldState, buzzWords = [], onProgress = null) {
    const defaultBuzzWords = [
      { tag: '[item]', type: 'item' },
      { tag: '[book]', type: 'book' },
      { tag: '[chapter]', type: 'chapter' },
      { tag: '[skill]', type: 'skill' },
      { tag: '[stats]', type: 'stats' },
      { tag: '[actor]', type: 'actor' },
      { tag: '[wiki]', type: 'wiki' },
      { tag: '[plot]', type: 'plot' },
      { tag: '[relationship]', type: 'relationship' },
      { tag: '[location]', type: 'location' },
      { tag: '[event]', type: 'event' }
    ];
    
    const allBuzzWords = [...defaultBuzzWords, ...buzzWords];
    const buzzWordTags = allBuzzWords.map(bw => bw.tag.toLowerCase());
    
    // Parse buzz words from document
    const buzzWordMatches = [];
    const lines = docText.split('\n');
    lines.forEach((line, lineIndex) => {
      const lowerLine = line.toLowerCase();
      buzzWordTags.forEach(tag => {
        const index = lowerLine.indexOf(tag);
        if (index !== -1) {
          const buzzWord = allBuzzWords.find(bw => bw.tag.toLowerCase() === tag);
          buzzWordMatches.push({
            tag: buzzWord.tag,
            type: buzzWord.type,
            line: lineIndex,
            position: index,
            context: line.substring(index + tag.length).trim()
          });
        }
      });
    });

    // Chunk document for processing
    const chunkSize = 8000;
    const chunks = [];
    for (let i = 0; i < docText.length; i += chunkSize) {
      chunks.push({
        text: docText.substring(i, i + chunkSize),
        startIndex: i,
        buzzWords: buzzWordMatches.filter(bw => 
          bw.line * 100 >= i && bw.line * 100 < i + chunkSize
        )
      });
    }

    // Load buzzwords reference for context
    let buzzwordsContext = '';
    try {
      const styleGuideService = (await import('./styleGuideService')).default;
      const buzzwordsRef = await styleGuideService.getBuzzwordsReference();
      if (buzzwordsRef) {
        buzzwordsContext = `\n\nBUZZWORDS REFERENCE:\n${buzzwordsRef}\n\n`;
      }
    } catch (error) {
      console.warn('Could not load buzzwords reference:', error);
    }

    const systemContext = `You are an AI assistant for "The Compliance Run" book series tracker app. You are processing a manuscript with intelligent extraction capabilities.

BUZZ WORD SYSTEM:
The document may contain buzz words like [item], [book], [chapter], [skill], [actor], etc. These indicate specific content types.
However, you should ALSO proactively detect content even WITHOUT buzz words - be intelligent and anticipate what the user needs!${buzzwordsContext}

CRITICAL EXTRACTION PATTERNS - DETECT THESE AUTOMATICALLY:

1. STAT CHANGES (type: "stat_change"):
   - Look for patterns like: "+10 STR", "gained 15 strength", "STR increased by 5", "lost 3 DEX"
   - Common stats: STR (Strength), VIT (Vitality), INT (Intelligence), DEX (Dexterity), LUCK, DEBT, CAPACITY, DEF, AUTHORITY, GLOOM
   - Extract: actorName, stats (object with stat names and numeric changes)
   - Example: "Grimguff's STR increased by 10" -> { actorName: "Grimguff", stats: { STR: 10 } }

2. INVENTORY CHANGES (type: "inventory"):
   - Look for: "picked up", "found", "received", "dropped", "lost", "equipped", "unequipped"
   - Extract: actorName, itemName, action (pickup/drop/equip)
   - Example: "Pipkins picked up the Grim Helm" -> { actorName: "Pipkins", itemName: "Grim Helm", action: "pickup" }

3. ITEMS (type: "item"):
   - Look for named objects, weapons, armor, artifacts
   - Extract: name, description, type (Weapon/Armor/Accessory/Consumable/Artifact), rarity, stats
   - Stats format: { STR: 10, VIT: 5 } for "+10 STR, +5 VIT"

4. ACTORS/CHARACTERS (type: "actor"):
   - New characters, NPCs, enemies introduced
   - Extract: name, role (Protagonist/Antagonist/NPC/Enemy), class, description, stats
   - Infer stats from context if not explicit (warrior = high STR, mage = high INT)

5. SKILLS (type: "skill"):
   - Abilities learned, used, or mentioned
   - Extract: name, description, type (Combat/Magic/Passive/Utility), tier, statMod, characterName (who has it)

6. LOCATIONS (type: "location"):
   - Places visited, mentioned, traveled to
   - Look for: "arrived at", "traveled to", "entered", "left"
   - Extract: name, description, actorName (who went there)

7. RELATIONSHIPS (type: "relationship"):
   - Connections between characters
   - Look for: "befriended", "betrayed", "allied with", "enemy of", "loves", "hates"
   - Extract: actor1Name, actor2Name, type (ally/enemy/neutral/romantic), description

8. EVENTS/MILESTONES (type: "event"):
   - Significant plot points, achievements, battles
   - Extract: name/title, description, participants (array of actor names)

9. BOOK STRUCTURE (type: "book"):
   - Book titles, focus themes, descriptions
   - Extract: title, focus, desc, bookNumber, metadata

10. CHAPTERS (type: "chapter"):
   - Chapter titles, descriptions, content
   - Extract: title, desc, number, content/script, keyPlotPoints, characters

11. PLOT BEATS (type: "plot_beat"):
   - Significant story events, conflicts, resolutions, character moments
   - Extract: beat (description), purpose, characters, emotionalTone, importance (1-10)

12. STORYLINES (type: "storyline"):
   - Plot threads that span multiple chapters
   - Extract: title, description, status (active/resolved/ongoing), importance, relatedChapters, characters

13. CHARACTER ARC MOMENTS (type: "character_arc_moment"):
   - Character development, growth, or change moments
   - Extract: characterName, moment, type (growth/revelation/conflict/resolution), importance, emotionalState, impact

14. TIMELINE EVENTS (type: "timeline_event"):
   - Chronological events for Master Timeline
   - Extract: title, description, type, actors, locations, timestamp

15. DECISIONS (type: "decision_point"):
   - Important decisions that matter for future callbacks
   - Extract: decision, character, consequences, importance, type (plot/character/relationship/world)

16. CALLBACKS (type: "callback_setup"):
   - Events that should be referenced later
   - Extract: event, description, type (memory/setup/reference/callback), importance, suggestedCallbackChapter

EXTRACTION REQUIREMENTS:
1. Extract ALL entities mentioned - be thorough!
2. For each entity, provide:
   - Type (item, skill, actor, stat_change, inventory, relationship, location, event)
   - Extracted data (all relevant fields)
   - Source context (the exact text where it was found)
   - Confidence score (0.0-1.0)
   - Suggested action options (3-4 multi-choice options: A/B/C/D)

ACTION OPTIONS BY TYPE:
- stat_change: A) Apply stat change to actor, B) Create snapshot, C) Skip
- inventory: A) Add item to actor inventory, B) Remove item from inventory, C) Skip
- item: A) Create item, B) Create and add to inventory, C) Merge with existing, D) Skip
- actor: A) Create new actor, B) Update existing actor, C) Skip
- skill: A) Create skill, B) Create and assign to actor, C) Merge with existing, D) Skip
- location: A) Create wiki entry, B) Update actor location, C) Skip
- relationship: A) Create relationship, B) Update existing, C) Skip
- event: A) Create milestone, B) Add to plot thread, C) Skip
- book: A) Create new book, B) Update existing book, C) Skip
- chapter: A) Create new chapter, B) Update existing chapter, C) Merge with existing, D) Skip
- plot_beat: A) Add to plot timeline, B) Assign to chapter, C) Skip
- storyline: A) Create storyline, B) Update existing storyline, C) Skip
- character_arc_moment: A) Add to character arc, B) Create arc milestone, C) Skip
- timeline_event: A) Add to master timeline, B) Link to chapter, C) Skip
- decision_point: A) Track decision, B) Add to decision log, C) Skip
- callback_setup: A) Register callback, B) Add to memory system, C) Skip

Return JSON with this structure:
{
  "suggestions": [
    {
      "id": "sugg_1",
      "type": "item|skill|actor|stat_change|inventory|relationship|location|event|book|chapter|plot_beat|storyline|character_arc_moment|timeline_event|decision_point|callback_setup",
      "data": { /* extracted entity data with all relevant fields */ },
      "sourceContext": "Exact text from document",
      "confidence": 0.85,
      "actionOptions": [
        {"id": "A", "label": "Action A description", "action": "action_type"},
        {"id": "B", "label": "Action B description", "action": "action_type"},
        {"id": "C", "label": "Skip this", "action": "skip"}
      ],
      "buzzWordUsed": "[item]" // or null if detected without buzzword
    }
  ],
  "processingStats": {
    "totalChunks": 1,
    "entitiesFound": 15,
    "buzzWordsDetected": 8
  }
}`;

    try {
      const allSuggestions = [];
      let processingStats = { totalChunks: chunks.length, entitiesFound: 0, buzzWordsDetected: buzzWordMatches.length };

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Update progress: chunk processing (20-80% range)
        const chunkProgress = 20 + ((i / chunks.length) * 60);
        if (onProgress) {
          onProgress({
            current: Math.round(chunkProgress),
            status: `Processing chunk ${i + 1} of ${chunks.length}...`,
            liveSuggestions: allSuggestions
          });
        }
        
        const prompt = `Process this document chunk (${i + 1}/${chunks.length}):

${chunk.text}

${chunk.buzzWords.length > 0 ? `\nBuzz words detected in this chunk: ${chunk.buzzWords.map(bw => bw.tag).join(', ')}` : ''}

Existing entities:
- Actors: ${worldState.actors?.map(a => a.name).join(', ') || 'None'}
- Items: ${worldState.itemBank?.map(i => i.name).join(', ') || 'None'}
- Skills: ${worldState.skillBank?.map(s => s.name).join(', ') || 'None'}
- Books: ${worldState.books ? Object.values(worldState.books).map(b => b.title).join(', ') : 'None'}

Extract ALL entities and generate action options. Return JSON:`;

        try {
          const response = await this.callAI(prompt, "analytical", systemContext);
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
              parsed.suggestions.forEach(sugg => {
                sugg.id = sugg.id || `sugg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                sugg.chunkIndex = i;
              });
              allSuggestions.push(...parsed.suggestions);
              
              // Update progress with new suggestions
              if (onProgress) {
                onProgress({
                  current: Math.round(chunkProgress),
                  status: `Found ${allSuggestions.length} entities so far...`,
                  liveSuggestions: allSuggestions
                });
              }
              
              if (parsed.processingStats) {
                processingStats.entitiesFound += parsed.processingStats.entitiesFound || 0;
              }
            }
          }
        } catch (chunkError) {
          console.error(`Error processing chunk ${i + 1}:`, chunkError);
        }
      }

      // Post-process: detect duplicates and cross-reference
      if (onProgress) {
        onProgress({
          current: 85,
          status: 'Post-processing and deduplicating...',
          liveSuggestions: allSuggestions
        });
      }
      
      const processedSuggestions = await this.postProcessSuggestions(allSuggestions, worldState);
      processingStats.entitiesFound = processedSuggestions.length;
      
      if (onProgress) {
        onProgress({
          current: 95,
          status: `Finalizing ${processedSuggestions.length} suggestions...`,
          liveSuggestions: processedSuggestions
        });
      }

      return {
        suggestions: processedSuggestions,
        processingStats,
        buzzWordsDetected: buzzWordMatches
      };
    } catch (error) {
      console.error('Manuscript Intelligence processing error:', error);
      return { suggestions: [], processingStats: {}, error: error.message };
    }
  }

  /**
   * Post-process suggestions: detect duplicates, cross-reference, enhance
   */
  async postProcessSuggestions(suggestions, worldState) {
    return suggestions.map(sugg => {
      // Detect duplicates
      const duplicate = this.detectDuplicates(sugg, worldState);
      if (duplicate) {
        sugg.duplicateWarning = duplicate;
        sugg.actionOptions = [
          ...sugg.actionOptions,
          { id: 'E', label: `Merge with existing ${duplicate.name}`, action: 'merge' }
        ];
      }

      // Cross-reference entities
      const crossRefs = this.crossReferenceEntities(sugg, worldState);
      if (crossRefs.length > 0) {
        sugg.crossReferences = crossRefs;
      }

      return sugg;
    });
  }

  /**
   * Detect if suggestion duplicates existing entity
   */
  detectDuplicates(suggestion, worldState) {
    const name = suggestion.data?.name || suggestion.data?.title;
    if (!name) return null;

    const lowerName = name.toLowerCase();

    // Check items
    if (suggestion.type === 'item') {
      const existing = worldState.itemBank?.find(i => i.name.toLowerCase() === lowerName);
      if (existing) return { type: 'item', name: existing.name, id: existing.id };
    }

    // Check skills
    if (suggestion.type === 'skill') {
      const existing = worldState.skillBank?.find(s => s.name.toLowerCase() === lowerName);
      if (existing) return { type: 'skill', name: existing.name, id: existing.id };
    }

    // Check actors
    if (suggestion.type === 'actor') {
      const existing = worldState.actors?.find(a => a.name.toLowerCase() === lowerName);
      if (existing) return { type: 'actor', name: existing.name, id: existing.id };
    }

    // Check chapters
    if (suggestion.type === 'chapter') {
      const chapterTitle = suggestion.data?.title;
      if (chapterTitle) {
        for (const book of Object.values(worldState.books || {})) {
          const existing = book.chapters?.find(c => c.title.toLowerCase() === chapterTitle.toLowerCase());
          if (existing) {
            return { type: 'chapter', name: existing.title, id: existing.id, bookId: book.id };
          }
        }
      }
    }

    return null;
  }

  /**
   * Cross-reference entities to find relationships
   */
  crossReferenceEntities(suggestion, worldState) {
    const crossRefs = [];
    const name = suggestion.data?.name || suggestion.data?.title;
    if (!name) return crossRefs;

    const lowerName = name.toLowerCase();
    const context = suggestion.sourceContext?.toLowerCase() || '';

    // Check if mentioned in other chapters
    if (suggestion.type === 'item' || suggestion.type === 'skill') {
      for (const book of Object.values(worldState.books || {})) {
        for (const chapter of book.chapters || []) {
          const chapterText = (chapter.script || chapter.desc || '').toLowerCase();
          if (chapterText.includes(lowerName)) {
            crossRefs.push({
              type: 'mentioned_in_chapter',
              entity: { type: 'chapter', name: chapter.title, bookId: book.id, chapterId: chapter.id }
            });
          }
        }
      }
    }

    // Check if item grants skill
    if (suggestion.type === 'item' && suggestion.data?.grantsSkill) {
      const skill = worldState.skillBank?.find(s => 
        s.name.toLowerCase() === suggestion.data.grantsSkill.toLowerCase()
      );
      if (skill) {
        crossRefs.push({
          type: 'grants_skill',
          entity: { type: 'skill', name: skill.name, id: skill.id }
        });
      }
    }

    // Check if skill has prerequisites
    if (suggestion.type === 'skill' && suggestion.data?.prerequisites) {
      const prereqs = suggestion.data.prerequisites;
      if (prereqs.parentSkills) {
        prereqs.parentSkills.forEach(parentId => {
          const parent = worldState.skillBank?.find(s => s.id === parentId);
          if (parent) {
            crossRefs.push({
              type: 'requires_skill',
              entity: { type: 'skill', name: parent.name, id: parent.id }
            });
          }
        });
      }
    }

    return crossRefs;
  }

  /**
   * Generate action options for a suggestion
   */
  async generateActionOptions(suggestion, worldState) {
    // This is already done in processManuscriptIntelligence, but can be enhanced here
    // For now, return the existing action options or generate new ones
    if (suggestion.actionOptions && suggestion.actionOptions.length > 0) {
      return suggestion.actionOptions;
    }

    // Generate default options based on type
    const defaultOptions = {
      item: [
        { id: 'A', label: 'Add to item database and update wiki', action: 'add_and_wiki' },
        { id: 'B', label: 'Add to item database only', action: 'add_only' },
        { id: 'C', label: 'Add and link to character inventory', action: 'add_and_link' },
        { id: 'D', label: 'Skip this item', action: 'skip' }
      ],
      chapter: [
        { id: 'A', label: 'Insert before existing chapter (renumber)', action: 'insert_before' },
        { id: 'B', label: 'Insert after existing chapter (renumber)', action: 'insert_after' },
        { id: 'C', label: 'Replace existing chapter', action: 'replace' },
        { id: 'D', label: 'Create as variant (Chapter Xa)', action: 'variant' }
      ],
      skill: [
        { id: 'A', label: 'Add to skill tree and link prerequisites', action: 'add_and_link' },
        { id: 'B', label: 'Add to skill tree only', action: 'add_only' },
        { id: 'C', label: 'Add and assign to character', action: 'add_and_assign' },
        { id: 'D', label: 'Skip this skill', action: 'skip' }
      ]
    };

    return defaultOptions[suggestion.type] || [
      { id: 'A', label: 'Add to database', action: 'add' },
      { id: 'B', label: 'Skip', action: 'skip' }
    ];
  }

  /**
   * Feature 1: Detect new characters in text
   */
  async detectCharactersInText(text, existingActors) {
    const systemContext = `You are analyzing text from a book series to detect new characters.
Extract all character names, descriptions, and dialogue attribution that might represent new characters not yet in the database.
IMPORTANT: Characters may be referred to by nicknames/aliases. Check all known names AND nicknames before marking as new.
Return JSON:
{
  "characters": [
    {
      "name": "Character Name",
      "description": "What we know about them",
      "suggestedRole": "The Fallen Knight",
      "suggestedClass": "Protagonist|Ally|NPC|Threat",
      "suggestedStats": {"STR": 50, "VIT": 60, "INT": 10, "DEX": 20},
      "suggestedNicknames": ["alias1", "alias2"],
      "sourceChapters": ["Book 1, Chapter 2"],
      "confidence": 0.85,
      "textEvidence": "Quote from text",
      "matchedExistingActor": null
    }
  ]
}`;

    // Build list of existing names INCLUDING nicknames
    const existingNamesWithAliases = existingActors.map(a => {
      const nicknames = a.nicknames?.length > 0 ? ` (aka: ${a.nicknames.join(', ')})` : '';
      return `${a.name}${nicknames}`;
    }).join('; ');
    
    const prompt = `Analyze this text and detect characters:

${text.substring(0, 10000)}${text.length > 10000 ? '\n[... text continues ...]' : ''}

EXISTING ACTORS (with nicknames/aliases):
${existingNamesWithAliases || 'None'}

Instructions:
1. Extract ALL character mentions from the text
2. For each character, check if they match an existing actor BY NAME OR NICKNAME
3. If a character is called by a nickname (e.g., "boss", "the knight"), match them to the existing actor
4. Only mark as NEW if they don't match any existing actor's name or nicknames
5. For new characters, suggest nicknames based on how they're referred to in the text

Return JSON with detected characters:`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { characters: [] };
    } catch (error) {
      console.error('Character detection error:', error);
      return { characters: [] };
    }
  }

  /**
   * Feature 2: Extract stat changes from text
   */
  async extractStatChanges(text, actorContext, statRegistry) {
    const systemContext = `You are extracting stat changes from "The Compliance Run" book series text.
Detect when characters gain or lose stats, level up, or have stat modifications.
Return JSON:
{
  "changes": [
    {
      "actorName": "Character Name",
      "actorId": "actor_id_if_known",
      "statChanges": {"STR": +5, "VIT": -2, "INT": +10},
      "confidence": 0.9,
      "textEvidence": "Exact quote from text",
      "chapter": "Book 1, Chapter 2"
    }
  ]
}`;

    const actorList = actorContext.map(a => `${a.name} (${a.id})`).join(', ');
    const statList = statRegistry.map(s => s.key).join(', ');
    const prompt = `Extract stat changes from this text:

${text.substring(0, 10000)}${text.length > 10000 ? '\n[... text continues ...]' : ''}

Available actors: ${actorList || 'None'}
Available stats: ${statList || 'None'}

Return JSON with all stat changes detected:`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { changes: [] };
    } catch (error) {
      console.error('Stat extraction error:', error);
      return { changes: [] };
    }
  }

  /**
   * Feature 3: Detect skill and item acquisitions
   */
  async detectSkillItemAcquisitions(text, actorId, itemBank, skillBank) {
    const systemContext = `You are detecting skill and item acquisitions from "The Compliance Run" book series text.
Detect when characters learn skills, acquire items, lose items, or gain/lose abilities.
Return JSON:
{
  "acquisitions": [
    {
      "type": "skill|item",
      "name": "Skill/Item Name",
      "action": "acquired|lost|learned|mastered",
      "actorName": "Character Name",
      "actorId": "actor_id",
      "confidence": 0.85,
      "textEvidence": "Quote from text",
      "matchesExisting": true,
      "existingId": "item_id_if_found"
    }
  ]
}`;

    const itemList = itemBank.map(i => i.name).join(', ');
    const skillList = skillBank.map(s => s.name).join(', ');
    const prompt = `Detect skill and item acquisitions in this text:

${text.substring(0, 10000)}${text.length > 10000 ? '\n[... text continues ...]' : ''}

Existing items: ${itemList || 'None'}
Existing skills: ${skillList || 'None'}

Return JSON with all acquisitions detected:`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { acquisitions: [] };
    } catch (error) {
      console.error('Acquisition detection error:', error);
      return { acquisitions: [] };
    }
  }

  /**
   * Feature 4: Generate character biography
   */
  async generateCharacterBiography(actorData, chapterAppearances, worldState) {
    const systemContext = `You are writing comprehensive character biographies for "The Compliance Run" book series.
Create rich, detailed biographies based on how characters appear across chapters.
Format in markdown with sections: Overview, Personality & Traits, Key Relationships, Major Story Moments, Character Arc Summary.`;

    const chapterTexts = chapterAppearances.map(c => 
      `Book ${c.bookId}, Chapter ${c.chapterId}: ${c.text?.substring(0, 500) || ''}`
    ).join('\n\n');

    const prompt = `Generate a comprehensive biography for this character:

Name: ${actorData.name}
Class: ${actorData.class}
Role: ${actorData.role}
Current Stats: ${JSON.stringify(actorData.baseStats || {})}
Description: ${actorData.desc || ''}

Chapter Appearances:
${chapterTexts}

Relationships: ${worldState.actors?.filter(a => a.id !== actorData.id).map(a => a.name).join(', ') || 'None'}

Create a detailed biography in markdown format:`;

    try {
      return await this.callAI(prompt, "creative", systemContext);
    } catch (error) {
      console.error('Biography generation error:', error);
      return 'Error generating biography.';
    }
  }

  /**
   * Feature 5: Suggest actor stats
   */
  async suggestActorStats(actorInfo, statRegistry, existingActors) {
    const systemContext = `You are suggesting appropriate stat values for new characters in "The Compliance Run" book series.
Base suggestions on role, class, and description. Consider existing character patterns.`;

    const statList = statRegistry.map(s => `${s.key} (${s.name}): ${s.desc}`).join('\n');
    const existingPatterns = existingActors.slice(0, 5).map(a => 
      `${a.name} (${a.class}): ${JSON.stringify(a.baseStats)}`
    ).join('\n');

    const prompt = `Suggest stat values for this new character:

Name: ${actorInfo.name || ''}
Role: ${actorInfo.role || ''}
Class: ${actorInfo.actorClass || ''}
Description: ${actorInfo.desc || ''}

Available stats:
${statList}

Existing character patterns:
${existingPatterns || 'None'}

Return JSON:
{
  "suggestedStats": {"STR": 50, "VIT": 60, "INT": 10, "DEX": 20},
  "reasoning": "Brief explanation of stat choices",
  "confidence": 0.85
}`;

    try {
      const response = await this.callAI(prompt, "structured", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { suggestedStats: {}, reasoning: '', confidence: 0 };
    } catch (error) {
      console.error('Stat suggestion error:', error);
      return { suggestedStats: {}, reasoning: '', confidence: 0 };
    }
  }

  /**
   * Feature 6: Check character consistency
   */
  async checkCharacterConsistency(actorId, snapshots, chapters) {
    const systemContext = `You are a continuity checker for "The Compliance Run" book series.
Detect inconsistencies in character progression, impossible state transitions, and timeline violations.`;

    const snapshotData = Object.entries(snapshots).map(([key, snap]) => {
      const [bookId, chapterId] = key.split('_');
      return `Book ${bookId}, Chapter ${chapterId}: ${JSON.stringify(snap)}`;
    }).join('\n\n');

    const prompt = `Check consistency for character ${actorId}:

Snapshots:
${snapshotData}

Chapters:
${chapters.map(c => `Book ${c.bookId}, Chapter ${c.chapterId}: ${c.title}`).join('\n')}

Return JSON array:
[
  {
    "type": "stat_mismatch|item_conflict|timeline_violation|impossible_transition",
    "severity": "critical|warning|minor",
    "description": "Clear description",
    "location": "Book X, Chapter Y",
    "suggestion": "How to fix",
    "snapshot1": "book_chapter",
    "snapshot2": "book_chapter"
  }
]`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Consistency check error:', error);
      return [];
    }
  }

  /**
   * Feature 7: Analyze character arc
   */
  async analyzeCharacterArc(actorId, chapters, snapshots) {
    const systemContext = `You are analyzing character arcs for "The Compliance Run" book series.
Detect arc milestones: Introduction, Development, Conflict, Resolution.`;

    const chapterData = chapters.map(c => 
      `Book ${c.bookId}, Chapter ${c.chapterId}: ${c.title}\n${c.script?.substring(0, 500) || c.desc || ''}`
    ).join('\n\n---\n\n');

    const prompt = `Analyze character arc for actor ${actorId}:

Chapters:
${chapterData}

Snapshots:
${JSON.stringify(snapshots, null, 2)}

Return JSON:
{
  "introduction": {"chapter": "book_chapter", "description": "...", "completion": 100},
  "development": {"chapter": "book_chapter", "description": "...", "completion": 75},
  "conflict": {"chapter": "book_chapter", "description": "...", "completion": 50},
  "resolution": {"chapter": "book_chapter", "description": "...", "completion": 0},
  "overallCompletion": 56,
  "milestones": [
    {"type": "introduction|development|conflict|resolution", "chapter": "book_chapter", "description": "..."}
  ]
}`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('Arc analysis error:', error);
      return null;
    }
  }

  /**
   * Feature 8: Suggest role and class
   */
  async suggestRoleClass(characterData, worldState) {
    const systemContext = `You are suggesting role and class assignments for characters in "The Compliance Run" book series.
Consider character behavior, dialogue, actions, and existing patterns.`;

    const existingPatterns = worldState.actors?.slice(0, 10).map(a => 
      `${a.name}: ${a.class} - ${a.role}`
    ).join('\n') || 'None';

    const prompt = `Suggest role and class for this character:

Name: ${characterData.name || ''}
Description: ${characterData.desc || ''}
Actions/Dialogue: ${characterData.actions || characterData.dialogue || ''}

Existing patterns:
${existingPatterns}

Return JSON:
{
  "suggestedRole": "The Fallen Knight",
  "suggestedClass": "Protagonist|Ally|NPC|Threat",
  "confidence": 0.85,
  "reasoning": "Brief explanation"
}`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { suggestedRole: '', suggestedClass: '', confidence: 0, reasoning: '' };
    } catch (error) {
      console.error('Role/Class suggestion error:', error);
      return { suggestedRole: '', suggestedClass: '', confidence: 0, reasoning: '' };
    }
  }

  /**
   * Feature 9: Analyze character appearances
   */
  async analyzeCharacterAppearances(chapterText, actorName) {
    const systemContext = `You are analyzing character appearances in chapters for "The Compliance Run" book series.
Count mentions, dialogue, and determine importance level.`;

    const prompt = `Analyze appearances of "${actorName}" in this chapter text:

${chapterText.substring(0, 5000)}${chapterText.length > 5000 ? '\n[... text continues ...]' : ''}

Return JSON:
{
  "mentionCount": 15,
  "dialogueCount": 8,
  "importance": "protagonist|supporting|cameo",
  "firstMention": 42,
  "lastMention": 1250,
  "keyMoments": ["Moment 1", "Moment 2"]
}`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { mentionCount: 0, dialogueCount: 0, importance: 'cameo', firstMention: 0, lastMention: 0, keyMoments: [] };
    } catch (error) {
      console.error('Appearance analysis error:', error);
      return { mentionCount: 0, dialogueCount: 0, importance: 'cameo', firstMention: 0, lastMention: 0, keyMoments: [] };
    }
  }

  /**
   * Feature 10: Suggest snapshot creation
   */
  async suggestSnapshot(actorId, currentChapter, previousSnapshot, chapterText) {
    const systemContext = `You are analyzing when to create character snapshots in "The Compliance Run" book series.
Suggest snapshots at key moments: significant stat changes, skill acquisitions, major story events.`;

    const prompt = `Should a snapshot be created for actor ${actorId} at ${currentChapter.bookId}_${currentChapter.chapterId}?

Previous snapshot: ${previousSnapshot ? JSON.stringify(previousSnapshot) : 'None'}
Current chapter: ${chapterText?.substring(0, 2000) || ''}

Return JSON:
{
  "shouldCreate": true,
  "confidence": 0.9,
  "reason": "Brief explanation of why snapshot is needed",
  "suggestedNote": "AI-generated note summarizing changes",
  "changes": {
    "stats": {"STR": +5},
    "skills": ["new_skill"],
    "items": ["new_item"]
  }
}`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { shouldCreate: false, confidence: 0, reason: '', suggestedNote: '', changes: {} };
    } catch (error) {
      console.error('Snapshot suggestion error:', error);
      return { shouldCreate: false, confidence: 0, reason: '', suggestedNote: '', changes: {} };
    }
  }

  /**
   * Generate chapter outline
   */
  async generateChapterOutline(bookOrContext, chapterOrOptions, contextOrNull) {
    let prompt = '';
    let systemContext = '';
    
    // Handle two different call signatures
    if (typeof bookOrContext === 'string' && chapterOrOptions && typeof chapterOrOptions === 'object' && chapterOrOptions.books) {
      // Signature 1: generateChapterOutline(context, { books, actors })
      const context = bookOrContext;
      const { books, actors } = chapterOrOptions;
      const booksList = Array.isArray(books) ? books : Object.values(books || {});
      const lastChapter = booksList.flatMap(b => b.chapters || []).slice(-1)[0];
      
      systemContext = `You are a creative writing assistant. Create detailed chapter outlines based on the provided story context and characters.`;
      
      prompt = `Generate a chapter outline based on this context:

${context}

Available books: ${booksList.map(b => `Book ${b.id}: ${b.title || ''}`).join(', ')}
Available characters: ${actors?.map(a => a.name).join(', ') || 'None'}

${lastChapter ? `Last chapter was: ${lastChapter.title} - ${lastChapter.desc || ''}` : 'This is the beginning of the story.'}

Create a detailed chapter outline with:
- Chapter title
- Brief description
- Key plot points
- Character appearances
- Important events
- Story progression`;
    } else if (bookOrContext && typeof bookOrContext === 'object' && chapterOrOptions && typeof chapterOrOptions === 'object') {
      // Signature 2: generateChapterOutline(currentBook, currentChapter, context)
      const book = bookOrContext;
      const chapter = chapterOrOptions;
      const context = contextOrNull || {};
      
      // Get story meta/premise if available
      const meta = context.meta || {};
      const storyPremise = meta.premise || '';
      const storyTone = meta.tone || '';
      
      // Build character list with details
      const actorsList = context.actors?.map(a => {
        const nicknames = a.nicknames ? ` (aka ${a.nicknames.join(', ')})` : '';
        return `${a.name}${nicknames} - ${a.class || 'Unknown'}: ${a.role || 'No role defined'}`;
      }).join('\n  ') || 'None defined';
      
      const itemsList = context.items?.map(i => `${i.name} (${i.type || 'Unknown'})`).join(', ') || 'None';
      const skillsList = context.skills?.map(s => `${s.name} (${s.type || 'Unknown'})`).join(', ') || 'None';
      const previousChapters = context.previousChapters || [];
      
      // Build system context based on actual story
      systemContext = `You are a creative writing assistant for a book series.
${storyPremise ? `STORY PREMISE: ${storyPremise}` : ''}
${storyTone ? `TONE: ${storyTone}` : ''}

IMPORTANT: Only use the characters, items, and settings provided. Do NOT invent new characters or settings. The outline must match the existing story world.`;
      
      prompt = `Generate a detailed chapter outline for:

BOOK: ${book.title || `Book ${book.id}`} - ${book.focus || ''}
CHAPTER: ${chapter.title || `Chapter ${chapter.id}`}
${chapter.desc ? `CHAPTER DESCRIPTION: ${chapter.desc}` : ''}

AVAILABLE CHARACTERS:
  ${actorsList}

AVAILABLE ITEMS: ${itemsList}
AVAILABLE SKILLS: ${skillsList}

${previousChapters.length > 0 ? `PREVIOUS CHAPTERS CONTEXT:
${previousChapters.map(ch => `- ${ch.title || 'Untitled'}: ${ch.desc || ''}\n  ${ch.script ? `Preview: "${ch.script.substring(0, 200)}..."` : ''}`).join('\n')}` : 'This is the first chapter.'}

Create a comprehensive chapter outline for "${chapter.title || 'this chapter'}" that:
- Uses ONLY the characters listed above
- Maintains consistency with previous chapters
- Fits the established tone and premise
- Includes scene breakdown, character interactions, plot progression, dialogue moments, and emotional beats`;
    } else {
      throw new Error('Invalid arguments for generateChapterOutline');
    }

    try {
      const result = await this.callAI(prompt, "creative", systemContext);
      return result;
    } catch (error) {
      console.error('Chapter outline generation error:', error);
      throw error;
    }
  }

  /**
   * Write chapter content with full style guide integration
   */
  async writeChapter(context, selectedChapters, outline, mode = 'full', options = {}) {
    // Import services dynamically to avoid circular dependencies
    const styleGuideService = (await import('./styleGuideService')).default;
    const chapterContextService = (await import('./chapterContextService')).default;
    const db = (await import('./database')).default;

    // Get custom prompt configuration
    const promptConfig = options?.customPromptConfig || {
      includeStyleGuide: true,
      includeBuzzwords: true,
      includeSnapshots: true,
      includeChapterContext: true,
      includeActors: true,
      includeItems: true,
      includeSkills: true,
      includeStoryContext: true,
      includeSeriesBible: true,
      includeWiki: true,
      customInstructions: '',
      removedSections: []
    };

    // Load full style guide system context (only if enabled)
    let systemContext = 'You are a creative writing assistant for "The Compliance Run" book series.';
    if (promptConfig.includeStyleGuide) {
      systemContext = await styleGuideService.getSystemContext();
    }
    
    // Get buzzwords reference (only if enabled)
    let buzzwordsRef = '';
    if (promptConfig.includeBuzzwords) {
      buzzwordsRef = await styleGuideService.getBuzzwordsReference();
    }

    // Build full writing context
    const writingContext = await this.buildWritingContext(
      context, 
      selectedChapters, 
      outline, 
      mode,
      options,
      styleGuideService,
      chapterContextService,
      db
    );

    const book = context.book || {};
    const chapter = context.chapter || {};

    // Build comprehensive prompt based on configuration
    let prompt = `Write ${mode === 'full' ? 'a complete chapter' : 'suggestions for improving this chapter'} for:

Book: ${book.title || `Book ${book.id}`}
Chapter: ${chapter.title || `Chapter ${chapter.id}`}
${chapter.desc ? `Description: ${chapter.desc}` : ''}

${outline ? `Chapter Outline:\n${outline}\n\n` : ''}

${promptConfig.includeChapterContext && writingContext.chapterContext ? `PREVIOUS CHAPTERS CONTEXT:\n${writingContext.chapterContext}\n\n` : ''}

${promptConfig.includeActors && writingContext.actorsContext ? `AVAILABLE CHARACTERS:\n${writingContext.actorsContext}\n\n` : ''}

${promptConfig.includeSnapshots && writingContext.snapshotsContext ? `CHARACTER CURRENT STATES (from latest snapshots):\n${writingContext.snapshotsContext}\n\n` : ''}

${promptConfig.includeItems && writingContext.itemsContext ? `AVAILABLE ITEMS:\n${writingContext.itemsContext}\n\n` : ''}

${promptConfig.includeSkills && writingContext.skillsContext ? `AVAILABLE SKILLS:\n${writingContext.skillsContext}\n\n` : ''}

${promptConfig.includeStoryContext && writingContext.storyContextDocuments ? writingContext.storyContextDocuments : ''}

${promptConfig.includeSeriesBible && writingContext.seriesBibleContext ? writingContext.seriesBibleContext : ''}

${promptConfig.includeWiki && writingContext.wikiContext ? writingContext.wikiContext : ''}

${promptConfig.includeBuzzwords && buzzwordsRef ? `BUZZWORDS REFERENCE:\n${buzzwordsRef}\n\nUse these terms and phrases appropriately in your writing.\n\n` : ''}

${mode === 'assist' ? `CURRENT CHAPTER TEXT:\n${context.chapter?.script || ''}\n\nProvide suggestions and improvements:` : 'Write the complete chapter content following the Writing Style Guide exactly.'}

${promptConfig.customInstructions ? `\nADDITIONAL CUSTOM INSTRUCTIONS:\n${promptConfig.customInstructions}\n\n` : ''}

VALIDATION CHECKLIST - Before finalizing, ensure:
- Tone balance is 60% horror/RPG brutality, 40% caustic comedy
- Character voices match guidelines (Grimguff formal/heroic, Pipkins sardonic/British slang)
- Bureaucratic buzzwords used appropriately
- British spelling and slang used correctly
- Formatting follows guide (italics for thoughts, bold for UI, etc.)
- Recurring gags and devices incorporated where appropriate`;

    try {
      const result = await this.callAI(prompt, "creative", systemContext);
      return result;
    } catch (error) {
      console.error('Chapter writing error:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive writing context with style guide, snapshots, and chapters
   */
  async buildWritingContext(context, selectedChapters, outline, mode, options, styleGuideService, chapterContextService, db) {
    const book = context.book || {};
    const chapter = context.chapter || {};
    const actors = context.actors || [];
    const items = context.items || [];
    const skills = context.skills || [];
    const wikiEntries = context.wikiEntries || [];
    const books = context.books || {};

    // Build chapter context from selected chapters
    let chapterContext = '';
    if (selectedChapters && selectedChapters.length > 0) {
      chapterContext = chapterContextService.buildChapterContext(selectedChapters);
    }

    // Build actors context with descriptions
    const actorsList = actors.map(a => {
      let actorInfo = `${a.name} (${a.class || 'Unknown'}): ${a.desc || 'No description'}`;
      if (a.baseStats) {
        const stats = Object.entries(a.baseStats)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
        actorInfo += ` | Stats: ${stats}`;
      }
      return actorInfo;
    }).join('\n') || 'None';

    // Build items context
    const itemsList = items.map(i => {
      let itemInfo = `${i.name}: ${i.desc || 'No description'}`;
      if (i.type) itemInfo += ` | Type: ${i.type}`;
      if (i.rarity) itemInfo += ` | Rarity: ${i.rarity}`;
      if (i.stats) {
        const stats = Object.entries(i.stats)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
        itemInfo += ` | Stats: ${stats}`;
      }
      return itemInfo;
    }).join('\n') || 'None';

    // Build skills context
    const skillsList = skills.map(s => {
      let skillInfo = `${s.name}: ${s.desc || 'No description'}`;
      if (s.type) skillInfo += ` | Type: ${s.type}`;
      if (s.tier) skillInfo += ` | Tier: ${s.tier}`;
      if (s.statMod) {
        const mods = Object.entries(s.statMod)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
        skillInfo += ` | Stat Mods: ${mods}`;
      }
      return skillInfo;
    }).join('\n') || 'None';

    // Load actor snapshots if enabled (default: true)
    let snapshotsContext = '';
    if (options.includeSnapshots !== false && actors.length > 0) {
      try {
        const actorIds = actors.map(a => a.id);
        const snapshots = await db.getLatestSnapshotsForActors(
          actorIds,
          book.id || null,
          chapter.id || null
        );

        if (Object.keys(snapshots).length > 0) {
          const snapshotEntries = Object.entries(snapshots).map(([actorId, snapshot]) => {
            const actor = actors.find(a => a.id === actorId);
            const actorName = actor ? actor.name : actorId;
            
            let snapshotInfo = `${actorName}'s Current State:\n`;
            if (snapshot.baseStats) {
              const stats = Object.entries(snapshot.baseStats)
                .map(([key, val]) => `  ${key}: ${val}`)
                .join('\n');
              snapshotInfo += `  Stats:\n${stats}\n`;
            }
            if (snapshot.activeSkills && snapshot.activeSkills.length > 0) {
              snapshotInfo += `  Active Skills: ${snapshot.activeSkills.join(', ')}\n`;
            }
            if (snapshot.inventory && snapshot.inventory.length > 0) {
              snapshotInfo += `  Inventory Items: ${snapshot.inventory.length} items\n`;
            }
            if (snapshot.equipment) {
              const equipped = Object.entries(snapshot.equipment)
                .filter(([_, item]) => item !== null)
                .map(([slot, item]) => `    ${slot}: ${item.name || item}`)
                .join('\n');
              if (equipped) {
                snapshotInfo += `  Equipment:\n${equipped}\n`;
              }
            }
            return snapshotInfo;
          });

          snapshotsContext = snapshotEntries.join('\n---\n\n');
        }
      } catch (error) {
        console.warn('Could not load snapshots:', error);
      }
    }

    // Load story context documents, Series Bible, and Wiki entries
    let storyContextDocuments = '';
    let seriesBibleContext = '';
    let wikiContext = '';

    try {
      const storyContextService = (await import('./storyContextService')).default;
      
      // Get story context documents (if enabled in options)
      if (options?.includeStoryContext !== false) {
        const selectedDocIds = options?.selectedContextDocumentIds || null;
        storyContextDocuments = await storyContextService.buildContextString(selectedDocIds);
      }

      // Get Series Bible context (if enabled in options)
      if (options?.includeSeriesBible !== false && books && Object.keys(books).length > 0) {
        seriesBibleContext = await storyContextService.getSeriesBibleContext(books);
      }

      // Get Wiki entries context (if enabled in options)
      if (options?.includeWiki !== false && wikiEntries && wikiEntries.length > 0) {
        wikiContext = await storyContextService.getWikiContext(wikiEntries);
      }
    } catch (error) {
      console.warn('Could not load story context:', error);
    }

    return {
      chapterContext,
      actorsContext: actorsList,
      itemsContext: itemsList,
      skillsContext: skillsList,
      snapshotsContext,
      storyContextDocuments,
      seriesBibleContext,
      wikiContext
    };
  }

  /**
   * Analyze chapter text for consistency and suggestions
   * Used by the autonomous pipeline
   */
  async analyzeChapterText(analysisData) {
    const systemPrompt = `You are a story analysis AI. Analyze chapter text for consistency with established story facts and suggest updates.

You MUST respond with valid JSON in this exact format:
{
  "consistencyIssues": [
    {
      "type": "contradiction|timeline|character|location|item",
      "severity": "critical|warning|info",
      "message": "description of the issue",
      "entityType": "actor|item|skill|location",
      "entityId": "id if known",
      "suggestion": "how to resolve"
    }
  ],
  "suggestions": [
    {
      "type": "stat_change|relationship|event|character_update",
      "message": "what should be updated",
      "entityType": "actor|item|skill",
      "entityId": "id if known",
      "data": { "relevant": "data" }
    }
  ],
  "warnings": [
    {
      "type": "potential_issue|ambiguity|plot_hole",
      "message": "description"
    }
  ],
  "summary": "Brief 2-3 sentence summary of the chapter"
}`;

    const userPrompt = `Analyze this chapter text against the established story context:

CHAPTER TEXT:
${analysisData.chapterText}

KNOWN CHARACTERS:
${JSON.stringify(analysisData.context?.knownCharacters?.slice(0, 20) || [], null, 2)}

RECENT EVENTS:
${JSON.stringify(analysisData.context?.recentEvents?.slice(0, 10) || [], null, 2)}

LOCKED ENTITIES (cannot be modified):
${JSON.stringify(analysisData.context?.lockedEntities || [], null, 2)}

ANALYSIS INSTRUCTIONS:
${analysisData.instructions}

Provide your analysis as JSON.`;

    try {
      const response = await this.callAI(
        userPrompt, 
        "analytical", 
        systemPrompt
      );

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        consistencyIssues: [],
        suggestions: [],
        warnings: [{ type: 'parse_error', message: 'Could not parse AI response' }],
        summary: 'Analysis could not be completed'
      };
    } catch (error) {
      console.error('Chapter analysis error:', error);
      throw error;
    }
  }

  /**
   * Expand voice notes into full narrative text
   */
  async expandVoiceNotes(transcript, context = {}) {
    const systemPrompt = `You are a creative writing assistant. Expand brief voice notes or dictation into full narrative prose.

Guidelines:
- Maintain the author's voice and style
- Expand abbreviated thoughts into complete sentences
- Add appropriate description and dialogue formatting
- Keep the original intent and meaning
- If context about characters/setting is provided, incorporate it naturally
- Return ONLY the expanded text, no explanations`;

    const userPrompt = `Expand these voice notes into full narrative prose:

VOICE NOTES:
"${transcript}"

${context.characters ? `CHARACTERS MENTIONED: ${context.characters.join(', ')}` : ''}
${context.setting ? `CURRENT SETTING: ${context.setting}` : ''}
${context.previousText ? `PREVIOUS TEXT CONTEXT: ${context.previousText.slice(-500)}` : ''}

Write the expanded narrative:`;

    try {
      const response = await this.callAI(
        userPrompt, 
        "creative", 
        systemPrompt
      );

      return response;
    } catch (error) {
      console.error('Voice expansion error:', error);
      throw error;
    }
  }

  /**
   * Generate a story bible PDF content
   */
  async generateStoryBibleContent(worldState) {
    const sections = [];

    // Title and Overview
    sections.push({
      type: 'title',
      content: 'Story Bible',
      subtitle: `Generated ${new Date().toLocaleDateString()}`
    });

    // Characters Section
    if (worldState.actors?.length > 0) {
      sections.push({
        type: 'section',
        title: 'Characters',
        items: worldState.actors.map(actor => ({
          name: actor.name,
          role: actor.role || actor.class,
          description: actor.biography || actor.desc || 'No description available',
          stats: actor.baseStats
        }))
      });
    }

    // Locations Section - skip if worldState doesn't have locations
    if (worldState.locations?.length > 0) {
      sections.push({
        type: 'section',
        title: 'Locations',
        items: worldState.locations.map(loc => ({
          name: loc.name,
          description: loc.description || 'No description available'
        }))
      });
    }

    // Items Section
    if (worldState.itemBank?.length > 0) {
      sections.push({
        type: 'section',
        title: 'Notable Items',
        items: worldState.itemBank.filter(i => i.rarity !== 'Common').map(item => ({
          name: item.name,
          type: item.type,
          rarity: item.rarity,
          description: item.desc || 'No description available'
        }))
      });
    }

    // Skills Section
    if (worldState.skillBank?.length > 0) {
      sections.push({
        type: 'section',
        title: 'Skills & Abilities',
        items: worldState.skillBank.map(skill => ({
          name: skill.name,
          type: skill.type,
          description: skill.desc || 'No description available'
        }))
      });
    }

    // Timeline Section - skip if worldState doesn't have timeline events
    if (worldState.timelineEvents?.length > 0) {
      sections.push({
        type: 'section',
        title: 'Timeline',
        items: worldState.timelineEvents.slice(0, 50).map(event => ({
          title: event.title,
          description: event.description
        }))
      });
    }

    // Books/Chapters Section
    if (worldState.books) {
      sections.push({
        type: 'section',
        title: 'Story Structure',
        items: Object.values(worldState.books).flatMap(book => 
          book.chapters?.map(ch => ({
            name: `Book ${book.id}, Chapter ${ch.id}: ${ch.title}`,
            description: ch.desc || 'No synopsis'
          })) || []
        )
      });
    }

    return sections;
  }

  /**
   * Process complete document with enhanced manuscript intelligence
   * Extracts book structure, chapters, beats, storylines, character arcs, timeline events, decisions, and callbacks
   * @param {string} docText - Full document text
   * @param {Object} worldState - Current world state
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Complete extraction results
   */
  async processCompleteManuscript(docText, worldState, onProgress = null) {
    try {
      const manuscriptIntelligenceService = (await import('./manuscriptIntelligenceService')).default;
      return await manuscriptIntelligenceService.processCompleteDocument(docText, worldState, onProgress);
    } catch (error) {
      console.error('Error processing complete manuscript:', error);
      throw error;
    }
  }

  /**
   * Auto consistency check - wrapper for checkConsistency
   * Used by various components for automated consistency checking
   */
  async checkConsistencyAuto(data, context = {}) {
    // Handle different input formats
    let analysisData;
    
    if (typeof data === 'string') {
      analysisData = { text: data, ...context };
    } else {
      analysisData = data;
    }

    const systemContext = `You are a continuity editor analyzing a story for consistency issues.
Check for:
- Character stat inconsistencies
- Timeline contradictions
- Item/inventory errors
- Plot holes
- Character behavior inconsistencies

Return a JSON array of issues found.`;

    const prompt = `Analyze this story data for consistency issues:

${JSON.stringify(analysisData, null, 2).substring(0, 8000)}

Return JSON array:
[
  {
    "type": "character|item|plot|timeline",
    "severity": "low|medium|high",
    "description": "Description of the issue",
    "location": "Where in the story",
    "suggestion": "How to fix it"
  }
]`;

    try {
      const response = await this.callAI(prompt, "analytical", systemContext);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Consistency check error:', error);
      return [];
    }
  }
}

// Create singleton instance
const aiService = new AIService();
aiService.loadApiKeys();

export default aiService;

/**
 * Offline AI Service using Transformers.js
 * Provides on-device AI inference without requiring internet connection
 * Uses lightweight models optimized for mobile devices
 */

import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js
env.allowLocalModels = false; // Use CDN for model downloads
env.allowRemoteModels = true;
env.backends.onnx.wasm.proxy = false;

// Exponential-backoff ceiling for failed loads. After this many minutes we
// stop trying to reach the model host on every request (huggingface was
// returning 401 on Xenova/Qwen2.5 and flooding the console).
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000;

class OfflineAIService {
  constructor() {
    this.model = null;
    this.tokenizer = null;
    this.isLoading = false;
    this.isReady = false;
    // Primary candidate + public fallbacks. We walk down the list if the model
    // host refuses us (e.g. the previous Xenova/Qwen2.5 slug was gated).
    this.modelCandidates = [
      'HuggingFaceTB/SmolLM2-135M-Instruct',
      'Xenova/Qwen2.5-0.5B-Instruct',
    ];
    this.modelName = this.modelCandidates[0];
    this.loadPromise = null;
    this.supportsWebGPU = false;
    this.supportsWASM = false;

    // Disable/cooldown state so we don't retry a dead provider on every AI call.
    this.disabled = false;
    this.lastFailureAt = 0;
    this.failureCount = 0;

    // Check for WebGPU and WebAssembly support
    this._checkCapabilities();
  }

  /**
   * Returns true if the model is currently within its failure cooldown and
   * should be skipped by routers.
   */
  isOnCooldown() {
    if (this.disabled) return true;
    if (!this.lastFailureAt) return false;
    return Date.now() - this.lastFailureAt < FAILURE_COOLDOWN_MS;
  }

  /**
   * Check device capabilities for AI inference
   */
  _checkCapabilities() {
    // Check WebGPU support
    if (navigator.gpu) {
      this.supportsWebGPU = true;
      console.log('[Offline AI] WebGPU supported');
    } else {
      console.log('[Offline AI] WebGPU not supported, will use WebAssembly');
    }

    // Check WebAssembly support (should be available in all modern browsers)
    if (typeof WebAssembly !== 'undefined') {
      this.supportsWASM = true;
      console.log('[Offline AI] WebAssembly supported');
    }

    // Set backend preference
    if (this.supportsWebGPU) {
      env.backends.onnx.wasm.proxy = false;
    }
  }

  /**
   * Check if offline AI is available on this device
   */
  isAvailable() {
    return this.supportsWASM || this.supportsWebGPU;
  }

  /**
   * Load the AI model (downloads on first use)
   */
  async loadModel() {
    // If already loading, return the existing promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // If already loaded, return immediately
    if (this.isReady && this.model) {
      return Promise.resolve();
    }

    // If currently loading, wait for it
    if (this.isLoading) {
      return this.loadPromise;
    }

    if (this.isOnCooldown()) {
      return Promise.reject(new Error('Offline AI is in cooldown after recent failures.'));
    }

    this.isLoading = true;

    this.loadPromise = (async () => {
      let lastError = null;
      for (const candidate of this.modelCandidates) {
        try {
          console.log('[Offline AI] Loading model:', candidate);
          // eslint-disable-next-line no-await-in-loop
          this.model = await pipeline(
            'text-generation',
            candidate,
            {
              quantized: true,
              progress_callback: (progress) => {
                if (progress.status === 'progress') {
                  const percent = Math.round((progress.progress / progress.total) * 100);
                  console.log(`[Offline AI] Download progress: ${percent}%`);
                }
              }
            }
          );
          this.modelName = candidate;
          this.isReady = true;
          this.isLoading = false;
          this.failureCount = 0;
          this.lastFailureAt = 0;
          console.log('[Offline AI] Model loaded successfully:', candidate);
          return true;
        } catch (err) {
          lastError = err;
          console.warn(`[Offline AI] Candidate failed (${candidate}):`, err?.message || err);
        }
      }

      this.isLoading = false;
      this.loadPromise = null;
      this.failureCount += 1;
      this.lastFailureAt = Date.now();
      if (this.failureCount >= 3) {
        this.disabled = true;
        console.warn('[Offline AI] Disabled after repeated failures. Use resetOfflineAI() to retry.');
      }
      throw lastError || new Error('Offline AI model failed to load');
    })();

    return this.loadPromise;
  }

  /**
   * Manually re-enable offline AI after it has been disabled or put on cooldown.
   */
  reset() {
    this.disabled = false;
    this.failureCount = 0;
    this.lastFailureAt = 0;
    this.loadPromise = null;
  }

  /**
   * Generate text using the offline model
   */
  async generate(prompt, systemContext = '', options = {}) {
    const {
      maxLength = 512,
      temperature = 0.7,
      topK = 50,
      topP = 0.9,
      doSample = true
    } = options;

    // Ensure model is loaded
    if (!this.isReady) {
      try {
        await this.loadModel();
      } catch (error) {
        throw new Error(`Offline AI model failed to load: ${error.message}`);
      }
    }

    // Build the full prompt with system context
    let fullPrompt = prompt;
    if (systemContext) {
      fullPrompt = `${systemContext}\n\nUser: ${prompt}\n\nAssistant:`;
    }

    try {
      console.log('[Offline AI] Generating response...');
      const startTime = Date.now();

      // Generate text
      const result = await this.model(fullPrompt, {
        max_new_tokens: maxLength,
        temperature: temperature,
        top_k: topK,
        top_p: topP,
        do_sample: doSample,
        return_full_text: false,
        truncation: true
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[Offline AI] Generated response in ${duration}ms`);

      // Extract generated text
      let generatedText = '';
      if (Array.isArray(result)) {
        generatedText = result[0]?.generated_text || result[0]?.text || '';
      } else if (result.generated_text) {
        generatedText = result.generated_text;
      } else if (typeof result === 'string') {
        generatedText = result;
      }

      // Clean up the response (remove prompt if included)
      if (generatedText.includes(fullPrompt)) {
        generatedText = generatedText.replace(fullPrompt, '').trim();
      }

      // Remove any remaining prompt artifacts
      generatedText = generatedText.replace(/^User:.*$/gm, '').trim();
      generatedText = generatedText.replace(/^Assistant:/, '').trim();

      return generatedText || 'I apologize, but I could not generate a response.';
    } catch (error) {
      console.error('[Offline AI] Generation error:', error);
      throw new Error(`Offline AI generation failed: ${error.message}`);
    }
  }

  /**
   * Check if model is ready
   */
  getReadyState() {
    return {
      isReady: this.isReady,
      isLoading: this.isLoading,
      isAvailable: this.isAvailable(),
      supportsWebGPU: this.supportsWebGPU,
      supportsWASM: this.supportsWASM,
      modelName: this.modelName
    };
  }

  /**
   * Unload the model to free memory
   */
  async unloadModel() {
    if (this.model) {
      // Transformers.js doesn't have explicit unload, but we can clear references
      this.model = null;
      this.isReady = false;
      console.log('[Offline AI] Model unloaded');
    }
  }

  /**
   * Get model download size estimate
   */
  getModelSize() {
    // Qwen2.5-0.5B-Instruct quantized is approximately 300-400MB
    return {
      estimatedSize: '300-400MB',
      modelName: this.modelName
    };
  }
}

// Export singleton instance
const offlineAIService = new OfflineAIService();
export default offlineAIService;

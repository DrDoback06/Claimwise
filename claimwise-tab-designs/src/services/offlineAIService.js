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

class OfflineAIService {
  constructor() {
    this.model = null;
    this.tokenizer = null;
    this.isLoading = false;
    this.isReady = false;
    this.modelName = 'Xenova/Qwen2.5-0.5B-Instruct'; // Lightweight, fast model
    this.loadPromise = null;
    this.supportsWebGPU = false;
    this.supportsWASM = false;
    
    // Check for WebGPU and WebAssembly support
    this._checkCapabilities();
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

    this.isLoading = true;
    console.log('[Offline AI] Loading model:', this.modelName);

    this.loadPromise = (async () => {
      try {
        // Load the text generation pipeline
        // This will download the model on first use (~200-500MB)
        this.model = await pipeline(
          'text-generation',
          this.modelName,
          {
            quantized: true, // Use quantized model for smaller size
            progress_callback: (progress) => {
              if (progress.status === 'progress') {
                const percent = Math.round((progress.progress / progress.total) * 100);
                console.log(`[Offline AI] Download progress: ${percent}%`);
              }
            }
          }
        );

        this.isReady = true;
        this.isLoading = false;
        console.log('[Offline AI] Model loaded successfully');
        return true;
      } catch (error) {
        console.error('[Offline AI] Failed to load model:', error);
        this.isLoading = false;
        this.loadPromise = null;
        throw error;
      }
    })();

    return this.loadPromise;
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

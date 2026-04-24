// Browser shim for offlineAIService.
// The real module requires @xenova/transformers which is too large to bundle
// for a prototype. This shim reports "not available" and every aiService code
// path falls through to an online provider or the user's manual intervention.
// When we want offline AI back, load @xenova/transformers via CDN before this
// script and replace this shim with a wrapper that calls it.

const offlineAIService = {
  isAvailable() { return false; },
  getReadyState() { return { ready: false, loading: false, error: null }; },
  async loadModel() { return false; },
  async generate() { throw new Error('Offline AI not available in this bundle'); },
  async unloadModel() { return; },
  getModelSize() { return 0; },
};

// Named exports that the real @xenova/transformers would provide; stubs that
// make it clear offline mode isn't wired in this bundle.
export const pipeline = async () => {
  throw new Error('@xenova/transformers is not bundled; load it from a CDN to enable offline AI.');
};
// Provide a deep-enough env object that top-level assignments in the real
// offlineAIService.js don't blow up during module load.
export const env = {
  allowLocalModels: false,
  allowRemoteModels: false,
  backends: {
    onnx: {
      wasm: { proxy: false },
    },
  },
};

export default offlineAIService;

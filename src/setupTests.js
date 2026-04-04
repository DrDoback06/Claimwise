// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Prevent Jest ESM parse issues from @xenova/transformers in offline AI paths.
jest.mock('./src/services/offlineAIService', () => ({
  __esModule: true,
  default: {
    isAvailable: () => false,
    getReadyState: () => ({ available: false, loaded: false }),
    loadModel: async () => false,
    generate: async () => '',
    unloadModel: async () => true
  }
}));

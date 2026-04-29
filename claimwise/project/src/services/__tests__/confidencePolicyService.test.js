/**
 * Confidence Policy Service — Unit Tests
 *
 * Tests: threshold boundaries (49/50/69/70/89/90),
 * classification accuracy, auto-apply logic, blocking logic
 */

const mockDb = {
  get: jest.fn(async () => null),
  update: jest.fn(async () => {}),
  _reset: () => { jest.clearAllMocks(); }
};

jest.mock('../database', () => mockDb);

const { default: confidencePolicyService, DEFAULT_THRESHOLDS, BAND_META } = require('../confidencePolicyService');

describe('ConfidencePolicyService', () => {
  beforeEach(() => {
    mockDb._reset();
    confidencePolicyService._settings = null;
  });

  describe('Threshold boundaries (exact Model A)', () => {
    test('0.49 => red_block', () => {
      expect(confidencePolicyService._classifyWithThresholds(0.49, DEFAULT_THRESHOLDS)).toBe('red_block');
    });

    test('0.50 => amber_review (boundary)', () => {
      expect(confidencePolicyService._classifyWithThresholds(0.50, DEFAULT_THRESHOLDS)).toBe('amber_review');
    });

    test('0.69 => amber_review', () => {
      expect(confidencePolicyService._classifyWithThresholds(0.69, DEFAULT_THRESHOLDS)).toBe('amber_review');
    });

    test('0.70 => normal_review (boundary)', () => {
      expect(confidencePolicyService._classifyWithThresholds(0.70, DEFAULT_THRESHOLDS)).toBe('normal_review');
    });

    test('0.89 => normal_review', () => {
      expect(confidencePolicyService._classifyWithThresholds(0.89, DEFAULT_THRESHOLDS)).toBe('normal_review');
    });

    test('0.90 => high_confidence (boundary)', () => {
      expect(confidencePolicyService._classifyWithThresholds(0.90, DEFAULT_THRESHOLDS)).toBe('high_confidence');
    });

    test('1.0 => high_confidence', () => {
      expect(confidencePolicyService._classifyWithThresholds(1.0, DEFAULT_THRESHOLDS)).toBe('high_confidence');
    });

    test('0.0 => red_block', () => {
      expect(confidencePolicyService._classifyWithThresholds(0.0, DEFAULT_THRESHOLDS)).toBe('red_block');
    });

    test('negative => red_block', () => {
      expect(confidencePolicyService._classifyWithThresholds(-0.5, DEFAULT_THRESHOLDS)).toBe('red_block');
    });

    test('NaN => red_block (treated as 0)', () => {
      expect(confidencePolicyService._classifyWithThresholds(NaN, DEFAULT_THRESHOLDS)).toBe('red_block');
    });
  });

  describe('Auto-apply logic', () => {
    test('shouldAutoApply returns true for >= 0.90 when enabled', async () => {
      confidencePolicyService._settings = {
        id: 'confidence_policy',
        thresholds: DEFAULT_THRESHOLDS,
        autoApplyHighConfidence: true,
        autoApplyMinConfidence: 0.90
      };
      expect(await confidencePolicyService.shouldAutoApply(0.95)).toBe(true);
      expect(await confidencePolicyService.shouldAutoApply(0.90)).toBe(true);
      expect(await confidencePolicyService.shouldAutoApply(0.89)).toBe(false);
    });

    test('shouldAutoApply returns false when disabled', async () => {
      confidencePolicyService._settings = {
        id: 'confidence_policy',
        thresholds: DEFAULT_THRESHOLDS,
        autoApplyHighConfidence: false,
        autoApplyMinConfidence: 0.90
      };
      expect(await confidencePolicyService.shouldAutoApply(0.99)).toBe(false);
    });
  });

  describe('Blocking logic', () => {
    test('red_block is blocking', () => {
      expect(confidencePolicyService.isBlocking('red_block')).toBe(true);
    });

    test('other bands are not blocking', () => {
      expect(confidencePolicyService.isBlocking('amber_review')).toBe(false);
      expect(confidencePolicyService.isBlocking('normal_review')).toBe(false);
      expect(confidencePolicyService.isBlocking('high_confidence')).toBe(false);
    });
  });

  describe('Threshold validation', () => {
    test('rejects invalid threshold ordering', async () => {
      confidencePolicyService._settings = {
        id: 'confidence_policy',
        thresholds: DEFAULT_THRESHOLDS,
        autoApplyHighConfidence: true,
        autoApplyMinConfidence: 0.90
      };
      await expect(confidencePolicyService.updateSettings({
        thresholds: { red_block: 0.80, amber_review: 0.70, normal_review: 0.90 }
      })).rejects.toThrow('Thresholds must be ordered');
    });

    test('rejects out-of-range thresholds', async () => {
      confidencePolicyService._settings = {
        id: 'confidence_policy',
        thresholds: DEFAULT_THRESHOLDS,
        autoApplyHighConfidence: true,
        autoApplyMinConfidence: 0.90
      };
      await expect(confidencePolicyService.updateSettings({
        thresholds: { red_block: -0.1, amber_review: 0.70, normal_review: 0.90 }
      })).rejects.toThrow('Thresholds must be between 0 and 1');
    });
  });

  describe('Batch classification', () => {
    test('classifies multiple items correctly', async () => {
      confidencePolicyService._settings = {
        id: 'confidence_policy',
        thresholds: DEFAULT_THRESHOLDS,
        autoApplyHighConfidence: true,
        autoApplyMinConfidence: 0.90
      };
      const items = [
        { id: '1', confidence: 0.45 },
        { id: '2', confidence: 0.55 },
        { id: '3', confidence: 0.75 },
        { id: '4', confidence: 0.95 }
      ];
      const result = await confidencePolicyService.classifyBatch(items);
      expect(result[0].confidenceBand).toBe('red_block');
      expect(result[1].confidenceBand).toBe('amber_review');
      expect(result[2].confidenceBand).toBe('normal_review');
      expect(result[3].confidenceBand).toBe('high_confidence');
    });
  });

  describe('Band metadata', () => {
    test('all 4 bands have metadata', () => {
      expect(BAND_META.red_block).toBeDefined();
      expect(BAND_META.amber_review).toBeDefined();
      expect(BAND_META.normal_review).toBeDefined();
      expect(BAND_META.high_confidence).toBeDefined();
    });

    test('red_block is blocking', () => {
      expect(BAND_META.red_block.blocking).toBe(true);
    });

    test('high_confidence is not blocking', () => {
      expect(BAND_META.high_confidence.blocking).toBe(false);
    });
  });
});

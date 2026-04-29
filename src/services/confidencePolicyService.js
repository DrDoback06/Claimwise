/**
 * Confidence Policy Service — Model A
 *
 * Bands:
 *   < 0.50     => red_block       (must resolve, cannot auto-apply)
 *   0.50-0.69  => amber_review    (manual review required)
 *   0.70-0.89  => normal_review   (manual review; default queue)
 *   >= 0.90    => high_confidence (reviewable, optionally auto-apply)
 *
 * - Globally configurable in Settings
 * - "why" explanation per node
 * - Preserves confidence metadata in audit trail
 * - Auto-apply on by default for high_confidence, user-toggleable
 */

import db from './database';

const DEFAULT_THRESHOLDS = {
  red_block: 0.50,
  amber_review: 0.70,
  normal_review: 0.90
};

const DEFAULT_SETTINGS = {
  id: 'confidence_policy',
  thresholds: { ...DEFAULT_THRESHOLDS },
  autoApplyHighConfidence: true,
  autoApplyMinConfidence: 0.90,
  showExplanations: true
};

const BAND_META = {
  red_block: {
    label: 'Red Block',
    color: '#ef4444',
    description: 'Must resolve manually — cannot auto-apply',
    blocking: true,
    requiresAction: true
  },
  amber_review: {
    label: 'Amber Review',
    color: '#f59e0b',
    description: 'Manual review required',
    blocking: false,
    requiresAction: true
  },
  normal_review: {
    label: 'Normal Review',
    color: '#3b82f6',
    description: 'Standard review queue item',
    blocking: false,
    requiresAction: true
  },
  high_confidence: {
    label: 'High Confidence',
    color: '#22c55e',
    description: 'Can be auto-applied if enabled',
    blocking: false,
    requiresAction: false
  }
};

class ConfidencePolicyService {
  constructor() {
    this._settings = null;
  }

  async getSettings() {
    if (this._settings) return this._settings;
    try {
      const stored = await db.get('canonSettings', 'confidence_policy');
      this._settings = stored || { ...DEFAULT_SETTINGS };
    } catch {
      this._settings = { ...DEFAULT_SETTINGS };
    }
    return this._settings;
  }

  async updateSettings(updates) {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };

    // Validate threshold ordering
    const t = updated.thresholds;
    if (t.red_block >= t.amber_review || t.amber_review >= t.normal_review) {
      throw new Error('Thresholds must be ordered: red_block < amber_review < normal_review');
    }
    if (t.red_block < 0 || t.normal_review > 1) {
      throw new Error('Thresholds must be between 0 and 1');
    }

    await db.update('canonSettings', updated);
    this._settings = updated;
    return updated;
  }

  async resetToDefaults() {
    this._settings = null;
    await db.update('canonSettings', { ...DEFAULT_SETTINGS });
    return DEFAULT_SETTINGS;
  }

  // ─── Classification ────────────────────────────────────────

  async classify(confidence) {
    const settings = await this.getSettings();
    return this._classifyWithThresholds(confidence, settings.thresholds);
  }

  _classifyWithThresholds(confidence, thresholds) {
    const score = Number(confidence) || 0;
    if (score < thresholds.red_block) return 'red_block';
    if (score < thresholds.amber_review) return 'amber_review';
    if (score < thresholds.normal_review) return 'normal_review';
    return 'high_confidence';
  }

  async classifyBatch(items) {
    const settings = await this.getSettings();
    return items.map(item => ({
      ...item,
      confidenceBand: this._classifyWithThresholds(item.confidence, settings.thresholds)
    }));
  }

  // ─── Auto-Apply Logic ─────────────────────────────────────

  async shouldAutoApply(confidence) {
    const settings = await this.getSettings();
    if (!settings.autoApplyHighConfidence) return false;
    return confidence >= settings.autoApplyMinConfidence;
  }

  async getAutoApplyItems(queueItems) {
    const settings = await this.getSettings();
    if (!settings.autoApplyHighConfidence) return [];
    return queueItems.filter(
      item => item.confidence >= settings.autoApplyMinConfidence &&
              item.status === 'pending' &&
              item.confidenceBand === 'high_confidence'
    );
  }

  // ─── Blocking Logic ────────────────────────────────────────

  isBlocking(confidenceBand) {
    return confidenceBand === 'red_block';
  }

  getBlockingItems(queueItems) {
    return queueItems.filter(item =>
      item.blocking === true ||
      item.confidenceBand === 'red_block'
    );
  }

  // ─── Explanation Helpers ───────────────────────────────────

  generateExplanation(confidence, domain, operation, context = {}) {
    const band = this._classifyWithThresholds(confidence, DEFAULT_THRESHOLDS);
    const reasons = [];

    if (confidence < 0.3) {
      reasons.push('Very low extraction confidence — may be a misinterpretation');
    } else if (confidence < 0.5) {
      reasons.push('Low confidence — entity reference is ambiguous or incomplete');
    }

    if (operation === 'merge') {
      reasons.push('Merge operations require careful review to avoid data loss');
    }
    if (operation === 'delete') {
      reasons.push('Deletion is destructive and affects downstream references');
    }
    if (operation === 'conflict') {
      reasons.push('Conflicts with existing canon data detected');
    }

    if (context.isAmbiguous) {
      reasons.push(`Multiple possible matches found for "${context.entityLabel || 'entity'}"`);
    }
    if (context.hasRetroImpact) {
      reasons.push('This change has downstream impact on later chapters');
    }
    if (context.isNewEntity && confidence < 0.7) {
      reasons.push('New entity with uncertain identification');
    }

    if (reasons.length === 0) {
      if (band === 'high_confidence') {
        reasons.push('Strong match with existing canon — high extraction confidence');
      } else {
        reasons.push('Standard extraction confidence — review recommended');
      }
    }

    return {
      band,
      reasons,
      summary: reasons[0],
      detailed: reasons.join('. ')
    };
  }

  // ─── Band Metadata ─────────────────────────────────────────

  getBandMeta(band) {
    return BAND_META[band] || BAND_META.normal_review;
  }

  getAllBands() {
    return { ...BAND_META };
  }

  getThresholdBoundaries() {
    return { ...DEFAULT_THRESHOLDS };
  }
}

export { DEFAULT_THRESHOLDS, DEFAULT_SETTINGS, BAND_META };
export default new ConfidencePolicyService();

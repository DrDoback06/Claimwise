// Loomwright — risk band classifier for extraction/review routing.

export const RISK_BANDS = {
  blue: {
    id: 'blue',
    label: 'Auto-added',
    color: '#2563eb',
    minConfidence: 0.91,
    autoApply: true,
  },
  green: {
    id: 'green',
    label: 'Suggested',
    color: '#16a34a',
    minConfidence: 0.8,
    autoApply: false,
  },
  amber: {
    id: 'amber',
    label: 'Needs review',
    color: '#d97706',
    minConfidence: 0.65,
    autoApply: false,
  },
  red: {
    id: 'red',
    label: 'Canon risk',
    color: '#dc2626',
    minConfidence: 0,
    autoApply: false,
  },
};

export const ALWAYS_RED_EVENT_TYPES = new Set([
  'death',
  'destroyed',
  'quest-completed',
  'quest-failed',
  'betrayal',
  'resurrection',
  'permanent-stat-change',
  'major-world-rule',
  'contradiction',
  'timeline-conflict',
  'ownership-transfer-unique-item',
  'canon-overwrite',
]);

export function classifyRiskBand({
  confidence = 0,
  eventType,
  consequence = 'low',
  isCanonChanging = false,
}) {
  const conf = Number(confidence) || 0;
  const severeConsequence = consequence === 'high' || consequence === 'critical';
  const alwaysRed = ALWAYS_RED_EVENT_TYPES.has(eventType);

  if (alwaysRed || isCanonChanging || severeConsequence || conf < 0.65) {
    return { ...RISK_BANDS.red, reason: alwaysRed ? 'always-red event type' : 'high canon impact or low confidence' };
  }
  if (conf >= RISK_BANDS.blue.minConfidence) return { ...RISK_BANDS.blue, reason: 'high confidence + low consequence' };
  if (conf >= RISK_BANDS.green.minConfidence) return { ...RISK_BANDS.green, reason: 'likely correct but consequential enough for review' };
  return { ...RISK_BANDS.amber, reason: 'uncertain or implied progression' };
}

export function isAutoApplyBand(riskBandId, state) {
  const setting = state?.profile?.reviewAutomation;
  const enabled = setting?.autoApplyBlue !== false;
  if (!enabled) return false;
  return riskBandId === 'blue';
}

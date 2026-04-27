// Loomwright — confidence policy. Ported from the legacy
// confidencePolicyService thresholds so AI findings get bucketed into
// auto-apply / suggest / ignore bands the writer can act on.

export const BANDS = {
  red_block:    { min: 0.0,  max: 0.5,  label: 'IGNORE',     description: 'Too unreliable to surface.' },
  amber_review: { min: 0.5,  max: 0.7,  label: 'BACKGROUND', description: 'Surfaces in margin/tray; needs explicit accept.' },
  normal:       { min: 0.7,  max: 0.9,  label: 'SUGGEST',    description: 'Surfaces as a suggestion card.' },
  high:         { min: 0.9,  max: 1.01, label: 'AUTO',       description: 'Auto-applied if the writer enables it.' },
};

export const DEFAULTS = {
  autoApplyHighConfidence: false,
  amberShowInMargin: true,
  ignoreThreshold: 0.5,
  suggestThreshold: 0.7,
  autoApplyThreshold: 0.9,
};

export function bandFor(confidence) {
  const c = Math.max(0, Math.min(1, Number(confidence) || 0));
  if (c >= 0.9) return 'high';
  if (c >= 0.7) return 'normal';
  if (c >= 0.5) return 'amber_review';
  return 'red_block';
}

// Apply the policy to a list of findings. Returns:
//   { auto: [...], suggested: [...], background: [...], ignored: [...] }
export function bucket(findings, policy = DEFAULTS) {
  const out = { auto: [], suggested: [], background: [], ignored: [] };
  for (const f of findings || []) {
    const c = Number(f?.confidence ?? f?.matchScore ?? 0.6);
    if (c < policy.ignoreThreshold) out.ignored.push(f);
    else if (c < policy.suggestThreshold) out.background.push(f);
    else if (c < policy.autoApplyThreshold) out.suggested.push(f);
    else out.auto.push(f);
  }
  return out;
}

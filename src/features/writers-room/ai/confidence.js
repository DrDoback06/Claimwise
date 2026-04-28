// Loomwright — confidence policy. Ported from the legacy
// confidencePolicyService thresholds so AI findings get bucketed into
// auto-apply / suggest / ignore bands the writer can act on.
//
// 2026-04 update: tightened auto-apply gate. Auto-apply requires both
// (a) confidence ≥ 0.95 and (b) the entity name was seen at least twice
// across the manuscript (counts the foundation extractor's `occurrences`
// field, falls back to an explicit `seenInChapters` count). One-off
// walk-on characters stay in the review queue for the writer to confirm.

export const BANDS = {
  red_block:    { min: 0.0,  max: 0.5,  label: 'IGNORE',     description: 'Too unreliable to surface.' },
  amber_review: { min: 0.5,  max: 0.7,  label: 'BACKGROUND', description: 'Surfaces in margin/tray; needs explicit accept.' },
  normal:       { min: 0.7,  max: 0.95, label: 'SUGGEST',    description: 'Surfaces as a suggestion card.' },
  high:         { min: 0.95, max: 1.01, label: 'AUTO',       description: 'Auto-applied if seen in ≥ 2 chapters / chunks.' },
};

export const DEFAULTS = {
  autoApplyHighConfidence: false,
  amberShowInMargin: true,
  ignoreThreshold: 0.5,
  suggestThreshold: 0.7,
  autoApplyThreshold: 0.95,
  autoApplyMinOccurrences: 2,
};

export function bandFor(confidence) {
  const c = Math.max(0, Math.min(1, Number(confidence) || 0));
  if (c >= 0.95) return 'high';
  if (c >= 0.7) return 'normal';
  if (c >= 0.5) return 'amber_review';
  return 'red_block';
}

// True only if the finding qualifies for auto-create: high band AND has
// been seen more than once. Walk-on characters (one-line cameos) stay in
// the queue.
export function eligibleForAutoApply(finding, policy = DEFAULTS) {
  const c = Number(finding?.confidence ?? finding?.matchScore ?? 0);
  if (c < policy.autoApplyThreshold) return false;
  const occ = Number(finding?.occurrences ?? finding?.seenInChapters ?? 1);
  return occ >= policy.autoApplyMinOccurrences;
}

// Apply the policy to a list of findings. Returns:
//   { auto: [...], suggested: [...], background: [...], ignored: [...] }
// Findings that meet the confidence threshold but fail the multi-chapter
// gate fall back to `suggested` instead of being auto-applied.
export function bucket(findings, policy = DEFAULTS) {
  const out = { auto: [], suggested: [], background: [], ignored: [] };
  for (const f of findings || []) {
    const c = Number(f?.confidence ?? f?.matchScore ?? 0.6);
    if (c < policy.ignoreThreshold) out.ignored.push(f);
    else if (c < policy.suggestThreshold) out.background.push(f);
    else if (c < policy.autoApplyThreshold) out.suggested.push(f);
    else if (eligibleForAutoApply(f, policy)) out.auto.push(f);
    else out.suggested.push(f);   // high confidence but only seen once
  }
  return out;
}


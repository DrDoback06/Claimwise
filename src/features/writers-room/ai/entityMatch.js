// Loomwright — fuzzy entity matching. Ported from the legacy
// entityMatchingService (Levenshtein) so AI-generated names get reconciled
// against canon before they spawn duplicates.

function calculateSimilarity(a, b) {
  if (!a || !b) return 0;
  const s = String(a).toLowerCase().trim();
  const t = String(b).toLowerCase().trim();
  if (s === t) return 1;
  const len = Math.max(s.length, t.length);
  if (len === 0) return 1;
  return 1 - levenshtein(s, t) / len;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
    }
  }
  return dp[m][n];
}

// Find the best matching entity in `pool` for a given name. Returns
// `{ entity, similarity }` or null if nothing crosses the threshold.
export function findMatch(name, pool, threshold = 0.78) {
  if (!name || !Array.isArray(pool)) return null;
  let best = null;
  for (const e of pool) {
    const candidate = e.name || e.title || '';
    if (!candidate) continue;
    // Also try aliases.
    const surfaces = [candidate, ...(e.aliases || [])];
    let score = 0;
    for (const s of surfaces) {
      const sim = calculateSimilarity(name, s);
      if (sim > score) score = sim;
    }
    if (score >= threshold && (!best || score > best.similarity)) {
      best = { entity: e, similarity: score };
    }
  }
  return best;
}

// Walk a list of findings (from extraction etc.) and reconcile against the
// store. Mutates each finding to mark `status: 'known'` + `resolvesTo` when
// a match is found above threshold.
export function reconcileFindings(findings, state) {
  if (!Array.isArray(findings)) return [];
  const pools = {
    character: state.cast || [],
    place:     state.places || [],
    item:      state.items || [],
    quest:     state.quests || [],
    thread:    state.quests || [],
    skill:     state.skills || [],
  };
  return findings.map(f => {
    if (!f || !f.name) return f;
    if (f.status === 'known' && f.resolvesTo) return f; // already matched
    const pool = pools[f.kind];
    if (!pool) return f;
    const match = findMatch(f.name, pool);
    if (match) {
      return {
        ...f,
        status: 'known',
        resolvesTo: match.entity.id,
        matchScore: match.similarity,
      };
    }
    return { ...f, status: f.status || 'new' };
  });
}

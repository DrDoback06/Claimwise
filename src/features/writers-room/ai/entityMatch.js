// Loomwright — fuzzy + contextual entity reconciliation.

function normalizeEntityName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(a, b) {
  if (!a || !b) return 0;
  const s = normalizeEntityName(a);
  const t = normalizeEntityName(b);
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

export function findMatch(name, pool, threshold = 0.78) {
  if (!name || !Array.isArray(pool)) return null;
  let best = null;
  for (const e of pool) {
    const candidate = e.name || e.title || '';
    if (!candidate) continue;
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

export function resolveEntityCandidate(candidate, state) {
  if (!candidate?.name || !candidate?.kind) return { ...candidate, status: candidate?.status || 'new' };
  const pools = {
    character: state.cast || [],
    place: state.places || [],
    item: state.items || [],
    quest: state.quests || [],
    thread: state.quests || [],
    skill: state.skills || [],
  };
  const pool = pools[candidate.kind] || [];
  const direct = findMatch(candidate.name, pool, 0.79);
  if (direct) {
    return {
      ...candidate,
      status: 'known',
      resolvesTo: direct.entity.id,
      matchScore: direct.similarity,
    };
  }
  return { ...candidate, status: candidate.status || 'new' };
}

export function resolveEntitySet(candidates, state) {
  if (!Array.isArray(candidates)) return [];
  return candidates.map(c => resolveEntityCandidate(c, state));
}

export function makeMergeSuggestions(candidate, state) {
  if (!candidate?.name || !candidate?.kind) return [];
  const pools = {
    character: state.cast || [],
    place: state.places || [],
    item: state.items || [],
    quest: state.quests || [],
    thread: state.quests || [],
    skill: state.skills || [],
  };
  const pool = pools[candidate.kind] || [];
  return pool
    .map(entity => ({ entityId: entity.id, name: entity.name || entity.title, score: calculateSimilarity(candidate.name, entity.name || entity.title) }))
    .filter(x => x.score >= 0.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function reconcileFindings(findings, state) {
  if (!Array.isArray(findings)) return [];
  return findings.map(f => {
    if (!f || !f.name) return f;
    if (f.status === 'known' && f.resolvesTo) return f;
    const resolved = resolveEntityCandidate(f, state);
    const suggestions = makeMergeSuggestions(f, state);
    return { ...resolved, mergeSuggestions: suggestions };
  });
}

export { normalizeEntityName };

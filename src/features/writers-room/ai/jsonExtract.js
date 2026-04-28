// Loomwright — robust JSON extraction from LLM responses.
//
// Models routinely wrap structured output in markdown fences and prose
// preamble/epilogue. The first/last `{...}` slice trick fails when the
// trailing prose contains a `}` (e.g. "feel free to {tweak} these"),
// so we scan brace depth to find the largest balanced block.

function stripFences(s) {
  // Greedy remove of ```...``` pairs anywhere in the string.
  return s.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '');
}

function largestBalancedJson(s) {
  // Find every balanced `{...}` block via single pass with depth counter,
  // return the longest one. Strings are tracked so braces inside quotes
  // don't confuse the depth.
  let best = null;
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '{') continue;
    let depth = 0;
    let inStr = false;
    let escape = false;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (inStr) {
        if (escape) escape = false;
        else if (c === '\\') escape = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') { inStr = true; continue; }
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          const candidate = s.slice(i, j + 1);
          if (!best || candidate.length > best.length) best = candidate;
          break;
        }
      }
    }
  }
  return best;
}

export function safeParseJson(raw) {
  if (!raw) return null;
  const stripped = stripFences(String(raw).trim());
  // Fast path — already valid JSON.
  try { return JSON.parse(stripped); } catch (_) { /* fallback */ }
  const block = largestBalancedJson(stripped);
  if (!block) return null;
  try { return JSON.parse(block); } catch (_) { return null; }
}

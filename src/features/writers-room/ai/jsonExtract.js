// Loomwright — robust JSON extraction from LLM responses.
//
// Models routinely wrap structured output in markdown fences and prose
// preamble/epilogue, AND truncate the response when the JSON they wanted
// to write exceeds their max-output-tokens budget. We try four strategies
// in order:
//
//   1. The whole string parses as JSON.
//   2. The largest balanced `{...}` block parses as JSON.
//   3. The (possibly truncated) starting `{` to end-of-string can be
//      repaired by closing any open arrays/objects.
//   4. Pull individual `{...}` objects out of partial array fragments
//      and assemble them back into the expected shape.

function stripFences(s) {
  // Strip every ```...``` fence pair, regardless of language tag.
  return s.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '');
}

// Walk the string with a state machine so braces / brackets inside JSON
// strings don't change depth. Returns the largest balanced object or
// `null` if no `{` ever closes.
function largestBalancedJson(s) {
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

// For a string that opens with `{` but never closes (truncation), append
// closing brackets / braces that match the open ones. We snapshot the
// stack only at structural boundaries (after a complete element or after
// a comma between elements inside a container) so we never cut in the
// middle of a key-value pair.
function repairTruncated(s) {
  const start = s.indexOf('{');
  if (start < 0) return null;
  const stack = [];
  let inStr = false;
  let escape = false;
  let safeCut = -1;
  let safeStack = null;
  const snap = (i) => { safeCut = i; safeStack = [...stack]; };
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{' || c === '[') {
      stack.push(c);
      continue;
    }
    if (c === '}' || c === ']') {
      stack.pop();
      // After closing a container we're at a boundary, but only if we're
      // still inside another container (otherwise we just closed the root).
      if (stack.length > 0) snap(i + 1);
      continue;
    }
    // Comma at the top level of an array OR between key-value pairs in an
    // object is a safe boundary — cut BEFORE the comma.
    if (c === ',') snap(i);
  }
  if (stack.length === 0) return null;       // already balanced
  if (safeCut < 0 || !safeStack) return null;
  let body = s.slice(start, safeCut).replace(/[\s,]+$/, '');
  for (let i = safeStack.length - 1; i >= 0; i--) {
    body += safeStack[i] === '{' ? '}' : ']';
  }
  return body;
}

// Last-resort: scan the string for any `{...}` blocks that look like
// finding-shaped objects and return them in an envelope. Helps when the
// outer wrapper is malformed but the individual elements parse.
function salvageObjects(s) {
  const out = [];
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
          try { out.push(JSON.parse(candidate)); } catch (_) {}
          i = j;
          break;
        }
      }
    }
  }
  return out;
}

export function safeParseJson(raw) {
  if (!raw) return null;
  const stripped = stripFences(String(raw).trim());

  // 1. Whole string parses.
  try { return JSON.parse(stripped); } catch (_) { /* fall through */ }

  // 2. Truncation repair — close any open arrays/objects from the first
  // `{`, cutting at the last safe complete value. Catches the common case
  // where the model ran out of output budget mid-finding.
  const repaired = repairTruncated(stripped);
  if (repaired) {
    try { return JSON.parse(repaired); } catch (_) { /* fall through */ }
  }

  // 3. Largest balanced block — when the JSON is well-formed but wrapped
  // in prose preamble/epilogue.
  const block = largestBalancedJson(stripped);
  if (block) {
    try { return JSON.parse(block); } catch (_) { /* fall through */ }
  }

  // 4. Salvage individual objects. If the model returned loose findings
  // without an outer wrapper, gather them under the expected envelope key.
  const objs = salvageObjects(stripped);
  if (objs.length === 0) return null;
  const firstShaped = objs.find(o => o && (Array.isArray(o.findings) || Array.isArray(o.detections) || Array.isArray(o.nodes)));
  if (firstShaped) return firstShaped;
  const looksLikeFinding = objs.every(o => o && o.kind && (o.name || o.title));
  if (looksLikeFinding) return { findings: objs };
  const looksLikeDetection = objs.every(o => o && o.suggestedName);
  if (looksLikeDetection) return { detections: objs };
  return objs[0];
}

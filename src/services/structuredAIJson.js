/**
 * structuredAIJson — shared JSON extraction + optional repair retry for LLM outputs.
 * Used by weaver, atlas extraction, daily sparks, etc.
 */

function stripFences(text) {
  if (!text) return '';
  return String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

/**
 * Extract first JSON value (object or array) from a string.
 */
export function extractJsonValue(text) {
  const s = stripFences(text);
  const m = s.match(/[\{\[][\s\S]*[\}\]]/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

/**
 * Parse model output; on failure optionally ask model to fix (one retry).
 *
 * @param {string} raw - model response
 * @param {(obj: object) => boolean} [validate] - return true if parsed object is usable
 * @param {(bad: string) => Promise<string>} [repair] - async prompt that returns fixed JSON string
 * @returns {Promise<object|null>}
 */
export async function parseAIJson(raw, validate = null, repair = null) {
  let parsed = extractJsonValue(raw);
  if (parsed && typeof parsed === 'object' && (!validate || validate(parsed))) {
    return parsed;
  }
  if (!repair) return null;
  try {
    const second = await repair(raw || '');
    parsed = extractJsonValue(second);
    if (parsed && typeof parsed === 'object' && (!validate || validate(parsed))) {
      return parsed;
    }
  } catch {
    /* noop */
  }
  return null;
}

export default { extractJsonValue, parseAIJson };

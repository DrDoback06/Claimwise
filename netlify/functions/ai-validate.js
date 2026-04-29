const { json, sanitizeError, rateLimit, getAuthError, enforceBodyLimit, validateProvider } = require('./_aiSecurity');

const KEY_PATTERNS = {
  openai: /^sk-[A-Za-z0-9_-]{20,}$/,
  gemini: /^AIza[0-9A-Za-z_-]{20,}$/,
  anthropic: /^sk-ant-[A-Za-z0-9_-]{10,}$/,
  groq: /^gsk_[A-Za-z0-9_-]{10,}$/,
  huggingface: /^hf_[A-Za-z0-9]{10,}$/
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!rateLimit(event)) return json(429, { error: 'Rate limit exceeded' });
  const authError = getAuthError(event);
  if (authError) return json(401, { error: authError });
  if (!enforceBodyLimit(event)) return json(413, { error: 'Payload too large' });

  try {
    const { provider, key } = JSON.parse(event.body || '{}');
    if (!validateProvider(provider)) return json(400, { error: 'Unsupported provider' });

    const valid = KEY_PATTERNS[provider]?.test(key || '') || false;
    return json(valid ? 200 : 400, { valid, provider });
  } catch (error) {
    return json(500, sanitizeError(error, 'Validation failed'));
  }
};

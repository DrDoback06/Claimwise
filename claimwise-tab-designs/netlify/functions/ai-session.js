const {
  json,
  sanitizeError,
  rateLimit,
  getAuthError,
  enforceBodyLimit,
  parseCookies,
  encryptSession,
  decryptSession,
  validateProvider
} = require('./_aiSecurity');

const KEY_PATTERNS = {
  openai: /^sk-[A-Za-z0-9_-]{20,}$/,
  gemini: /^AIza[0-9A-Za-z_-]{20,}$/,
  anthropic: /^sk-ant-[A-Za-z0-9_-]{10,}$/,
  groq: /^gsk_[A-Za-z0-9_-]{10,}$/,
  huggingface: /^hf_[A-Za-z0-9]{10,}$/
};

const COOKIE_NAME = 'claimwise_byok';

function buildCookie(token = '', maxAge = 0) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

exports.handler = async (event) => {
  if (!rateLimit(event)) return json(429, { error: 'Rate limit exceeded' });
  const authError = getAuthError(event);
  if (authError) return json(401, { error: authError });
  if (!enforceBodyLimit(event)) return json(413, { error: 'Payload too large' });

  try {
    if (event.httpMethod === 'DELETE') {
      return json(200, { ok: true }, { 'Set-Cookie': buildCookie('', 0) });
    }

    const body = JSON.parse(event.body || '{}');

    const { provider, key } = body;
    if (!validateProvider(provider)) return json(400, { error: 'Unsupported provider' });

    const pattern = KEY_PATTERNS[provider];
    if (!pattern || !pattern.test(key || '')) {
      return json(400, { error: 'Invalid key format' });
    }

    const cookies = parseCookies(event.headers.cookie || '');
    const current = cookies[COOKIE_NAME] ? decryptSession(cookies[COOKIE_NAME]) : { providers: {} };
    current.providers[provider] = key;
    current.updatedAt = Date.now();

    const token = encryptSession(current);
    return json(200, { ok: true, provider }, { 'Set-Cookie': buildCookie(token, 60 * 60 * 24) });
  } catch (error) {
    return json(500, sanitizeError(error, 'Session error'));
  }
};

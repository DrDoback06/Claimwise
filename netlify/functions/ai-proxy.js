const {
  json,
  sanitizeError,
  rateLimit,
  getAuthError,
  enforceBodyLimit,
  parseCookies,
  decryptSession,
  validateProvider
} = require('./_aiSecurity');

const PROVIDER_ENV_MAP = {
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  groq: 'GROQ_API_KEY',
  huggingface: 'HUGGINGFACE_API_KEY'
};

function getProviderKey(event, provider, bodyKey) {
  const cookies = parseCookies(event.headers.cookie || '');
  if (cookies.claimwise_byok) {
    try {
      const session = decryptSession(cookies.claimwise_byok);
      if (session?.providers?.[provider]) {
        return session.providers[provider];
      }
    } catch (_) {
      // ignore invalid cookie and fallback to body / env key
    }
  }

  // BYOK fallback — caller supplied a key in the request body. Used when
  // the client has saved keys locally but never established a server-side
  // session. The proxy uses the key to call the upstream provider and does
  // not persist it.
  if (bodyKey && typeof bodyKey === 'string' && bodyKey.length >= 8) return bodyKey;

  const keyName = PROVIDER_ENV_MAP[provider];
  return process.env[keyName];
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!rateLimit(event)) return json(429, { error: 'Rate limit exceeded' });
  const authError = getAuthError(event);
  if (authError) return json(401, { error: authError });
  if (!enforceBodyLimit(event)) return json(413, { error: 'Payload too large' });

  try {
    const { provider, prompt, systemContext = '', model = null, apiKey: bodyKey = null } = JSON.parse(event.body || '{}');
    if (!validateProvider(provider)) return json(400, { error: 'Unsupported provider' });
    if (!prompt || typeof prompt !== 'string') return json(400, { error: 'provider and prompt are required' });

    const apiKey = getProviderKey(event, provider, bodyKey);
    if (!apiKey) return json(500, { error: `Missing key for provider: ${provider}` });

    switch (provider) {
      case 'openai': {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            // Headroom for verbose extraction JSON. Without an explicit cap
            // the API defaults to a small value and trims responses
            // mid-array, so the safeParseJson truncation-repair has more
            // work to do than necessary.
            max_tokens: 8192,
            messages: [
              ...(systemContext ? [{ role: 'system', content: systemContext }] : []),
              { role: 'user', content: prompt }
            ]
          })
        });
        const data = await response.json();
        if (!response.ok) return json(response.status, { error: data.error?.message || 'OpenAI request failed' });
        return json(200, { text: data.choices?.[0]?.message?.content || '' });
      }
      case 'gemini': {
        const geminiModel = model || 'gemini-2.0-flash';
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemContext ? `${systemContext}\n\n${prompt}` : prompt }] }]
          })
        });
        const data = await response.json();
        if (!response.ok) return json(response.status, { error: data.error?.message || 'Gemini request failed' });
        return json(200, { text: data.candidates?.[0]?.content?.parts?.[0]?.text || '' });
      }
      case 'anthropic': {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model || 'claude-sonnet-4-6',
            max_tokens: 8192,
            ...(systemContext ? { system: systemContext } : {}),
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await response.json();
        if (!response.ok) return json(response.status, { error: data.error?.message || 'Anthropic request failed' });
        return json(200, { text: data.content?.[0]?.text || '' });
      }
      case 'groq': {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model || 'llama-3.1-70b-versatile',
            max_tokens: 8192,
            messages: [
              ...(systemContext ? [{ role: 'system', content: systemContext }] : []),
              { role: 'user', content: prompt }
            ]
          })
        });
        const data = await response.json();
        if (!response.ok) return json(response.status, { error: data.error?.message || 'Groq request failed' });
        return json(200, { text: data.choices?.[0]?.message?.content || '' });
      }
      case 'huggingface': {
        const hfModel = model || 'microsoft/Phi-3-mini-4k-instruct';
        const hfEndpoint = `https://router.huggingface.co/hf-inference/models/${hfModel}/v1/chat/completions`;
        const messages = [
          ...(systemContext ? [{ role: 'system', content: systemContext }] : []),
          { role: 'user', content: prompt }
        ];
        const response = await fetch(hfEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({ model: hfModel, messages, max_tokens: 2048, temperature: 0.7 })
        });
        const rawText = await response.text();
        if (!response.ok) {
          let errMsg = 'HuggingFace request failed';
          try { errMsg = JSON.parse(rawText)?.error || rawText.slice(0, 200); } catch (_) { errMsg = rawText.slice(0, 200); }
          return json(response.status, { error: errMsg });
        }
        const data = JSON.parse(rawText);
        return json(200, { text: (data.choices?.[0]?.message?.content || '').trim() });
      }
      default:
        return json(400, { error: 'Provider not yet implemented in proxy' });
    }
  } catch (error) {
    return json(500, sanitizeError(error));
  }
};

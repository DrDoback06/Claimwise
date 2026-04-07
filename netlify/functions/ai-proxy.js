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

function getProviderKey(event, provider) {
  const cookies = parseCookies(event.headers.cookie || '');
  if (cookies.claimwise_byok) {
    try {
      const session = decryptSession(cookies.claimwise_byok);
      if (session?.providers?.[provider]) {
        return session.providers[provider];
      }
    } catch (_) {
      // ignore invalid cookie and fallback to server env key
    }
  }

  const keyName = PROVIDER_ENV_MAP[provider];
  return process.env[keyName];
}

exports.handler = async (event) => {
  // === DEBUG LOGGING ===
  const debugInfo = {
    httpMethod: event.httpMethod,
    path: event.path,
    envKeysAvailable: {
      HUGGINGFACE_API_KEY: !!process.env.HUGGINGFACE_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    },
    envKeyLengths: {
      HUGGINGFACE_API_KEY: (process.env.HUGGINGFACE_API_KEY || '').length,
      OPENAI_API_KEY: (process.env.OPENAI_API_KEY || '').length,
      GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').length,
      ANTHROPIC_API_KEY: (process.env.ANTHROPIC_API_KEY || '').length,
      GROQ_API_KEY: (process.env.GROQ_API_KEY || '').length,
    },
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY') || k.includes('HUGGIN') || k.includes('OPENAI') || k.includes('GEMINI') || k.includes('ANTHROPIC') || k.includes('GROQ')),
    hasCookie: !!(event.headers.cookie && event.headers.cookie.includes('claimwise_byok')),
  };
  console.log('[ai-proxy DEBUG]', JSON.stringify(debugInfo, null, 2));

  // If ?debug query param, return debug info directly
  if (event.queryStringParameters?.debug === '1') {
    return json(200, { debug: debugInfo });
  }
  // === END DEBUG ===

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!rateLimit(event)) return json(429, { error: 'Rate limit exceeded' });
  const authError = getAuthError(event);
  if (authError) return json(401, { error: authError });
  if (!enforceBodyLimit(event)) return json(413, { error: 'Payload too large' });

  try {
    const { provider, prompt, systemContext = '', model = null } = JSON.parse(event.body || '{}');
    console.log('[ai-proxy DEBUG] provider:', provider, 'prompt length:', prompt?.length);
    if (!validateProvider(provider)) return json(400, { error: 'Unsupported provider' });
    if (!prompt || typeof prompt !== 'string') return json(400, { error: 'provider and prompt are required' });

    const apiKey = getProviderKey(event, provider);
    console.log('[ai-proxy DEBUG] apiKey found:', !!apiKey, 'length:', (apiKey || '').length, 'source:', apiKey === process.env[PROVIDER_ENV_MAP[provider]] ? 'env' : 'cookie');
    if (!apiKey) return json(500, { error: `Missing key for provider: ${provider}`, debug: debugInfo });

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
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:generateContent?key=${apiKey}`;
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
      case 'huggingface': {
        const hfModel = model || 'microsoft/Phi-3-mini-4k-instruct';
        const hfEndpoint = `https://api-inference.huggingface.co/models/${hfModel}`;
        const fullPrompt = systemContext
          ? `<|system|>\n${systemContext}\n<|user|>\n${prompt}\n<|assistant|>\n`
          : `<|user|>\n${prompt}\n<|assistant|>\n`;
        const response = await fetch(hfEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              max_new_tokens: 2048,
              temperature: 0.7,
              return_full_text: false,
              top_p: 0.9
            }
          })
        });
        const data = await response.json();
        if (!response.ok) {
          const errMsg = (Array.isArray(data) && data[0]?.error) || data.error || 'HuggingFace request failed';
          return json(response.status, { error: errMsg });
        }
        const text = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
        return json(200, { text: (text || '').trim() });
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
            model: model || 'claude-sonnet-4-20250514',
            max_tokens: 2048,
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
      default:
        return json(400, { error: 'Provider not yet implemented in proxy' });
    }
  } catch (error) {
    return json(500, sanitizeError(error));
  }
};

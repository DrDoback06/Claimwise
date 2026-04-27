// Loomwright — canonical list of AI providers + their key-issuing URLs.
// Shared between Settings and the onboarding wizard so the badges, notes,
// and "Get key →" links never drift apart.

export const KEY_PROVIDERS = [
  { id: 'groq',        label: 'Groq',         badge: 'FREE',     note: '14,400 req/day · fastest free tier',  url: 'https://console.groq.com/keys' },
  { id: 'huggingface', label: 'Hugging Face', badge: 'FREE',     note: 'Public models · key optional',         url: 'https://huggingface.co/settings/tokens' },
  { id: 'gemini',      label: 'Gemini',       badge: 'PAID',     note: 'Google AI Studio · cheapest top-tier', url: 'https://aistudio.google.com/apikey' },
  { id: 'openai',      label: 'OpenAI',       badge: 'PAID',     note: 'GPT + DALL-E',                          url: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic',   label: 'Anthropic',    badge: 'PAID',     note: 'Claude — best for prose',               url: 'https://console.anthropic.com/settings/keys' },
  { id: 'elevenlabs',  label: 'ElevenLabs',   badge: 'OPTIONAL', note: 'Premium TTS voices for read-aloud',     url: 'https://elevenlabs.io/app/settings/api-keys' },
];

export function badgeColor(t, badge) {
  if (badge === 'FREE') return t.good || '#2a8';
  if (badge === 'OPTIONAL') return t.ink3;
  return t.warn || '#d80';
}

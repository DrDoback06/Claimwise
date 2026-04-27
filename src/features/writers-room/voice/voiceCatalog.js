// Loomwright — voice catalog. Combines browser-native speechSynthesis
// voices with a curated list of premium provider voices (ElevenLabs +
// OpenAI). Each entry has a stable `id` we persist on the character /
// narrator and an `engine` that tells ReadAloud how to play it.
//
// Browser voices are device-specific so we expose them only at runtime.

export const PREMIUM_VOICES = [
  // ElevenLabs
  { id: 'el:rachel', name: 'Rachel',  gender: 'female', accent: 'british',  engine: 'elevenlabs', externalId: 'rachel' },
  { id: 'el:domi',   name: 'Domi',    gender: 'female', accent: 'american', engine: 'elevenlabs', externalId: 'domi' },
  { id: 'el:bella',  name: 'Bella',   gender: 'female', accent: 'british',  engine: 'elevenlabs', externalId: 'bella' },
  { id: 'el:elli',   name: 'Elli',    gender: 'female', accent: 'american', engine: 'elevenlabs', externalId: 'elli' },
  { id: 'el:antoni', name: 'Antoni',  gender: 'male',   accent: 'british',  engine: 'elevenlabs', externalId: 'antoni' },
  { id: 'el:josh',   name: 'Josh',    gender: 'male',   accent: 'british',  engine: 'elevenlabs', externalId: 'josh' },
  { id: 'el:arnold', name: 'Arnold',  gender: 'male',   accent: 'british',  engine: 'elevenlabs', externalId: 'arnold' },
  { id: 'el:adam',   name: 'Adam',    gender: 'male',   accent: 'british',  engine: 'elevenlabs', externalId: 'adam' },
  // OpenAI TTS
  { id: 'oa:alloy',   name: 'Alloy',   gender: 'neutral', engine: 'openai', externalId: 'alloy' },
  { id: 'oa:echo',    name: 'Echo',    gender: 'male',    engine: 'openai', externalId: 'echo' },
  { id: 'oa:fable',   name: 'Fable',   gender: 'male',    engine: 'openai', externalId: 'fable' },
  { id: 'oa:onyx',    name: 'Onyx',    gender: 'male',    engine: 'openai', externalId: 'onyx' },
  { id: 'oa:nova',    name: 'Nova',    gender: 'female',  engine: 'openai', externalId: 'nova' },
  { id: 'oa:shimmer', name: 'Shimmer', gender: 'female',  engine: 'openai', externalId: 'shimmer' },
];

export function listBrowserVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.map(v => ({
    id: 'br:' + v.voiceURI,
    name: v.name,
    lang: v.lang,
    gender: /female|sara|emma|moira|tessa|samantha/i.test(v.name) ? 'female' : 'male',
    engine: 'browser',
    externalId: v.voiceURI,
    voiceObj: v,
  }));
}

export function findVoice(id) {
  if (!id) return null;
  if (id.startsWith('br:')) {
    return listBrowserVoices().find(v => v.id === id) || null;
  }
  return PREMIUM_VOICES.find(v => v.id === id) || null;
}

// Best-effort default voice when the writer hasn't set one. Picks from
// browser voices first (always available), gendered if a hint is given.
export function defaultVoice(hint = 'narrator') {
  const browser = listBrowserVoices();
  if (browser.length === 0) return null;
  const want = (hint || '').toLowerCase();
  if (want.includes('female') || want.includes('woman') || want.includes('she/her')) {
    return browser.find(v => v.gender === 'female') || browser[0];
  }
  if (want.includes('male') || want.includes('man') || want.includes('he/him')) {
    return browser.find(v => v.gender === 'male') || browser[0];
  }
  return browser[0];
}

/**
 * voiceContext — utilities to resolve the active voice profile for a given
 * (book, chapter) and express it as natural-language guidance that can be
 * injected into any AI systemContext.
 *
 * Keeps Voice Studio's data model loosely coupled to aiService: any caller
 * that knows (worldState, bookId, chapterId) can get a voice snippet.
 */

import { VOICE_DIMENSIONS, DEFAULT_SLIDERS } from './voiceAI';

export function getActiveVoiceProfile(worldState, bookId, chapterId) {
  const book = worldState?.books?.[bookId];
  if (!book) return null;
  const chapter = book.chapters?.find((c) => c.id === chapterId);
  const profileId = chapter?.voiceProfileId;
  if (!profileId) return null;
  const profile = (book.voiceProfiles || []).find((p) => p.id === profileId);
  return profile || null;
}

export function describeVoiceForAI(profile) {
  if (!profile) return '';
  const sliders = { ...DEFAULT_SLIDERS, ...(profile.sliders || {}) };
  const bias = (d) => {
    const v = sliders[d.key] ?? 50;
    if (v > 65) return d.high;
    if (v < 35) return d.low;
    return 'balanced';
  };
  const rubric = VOICE_DIMENSIONS.map((d) => `${d.label.toLowerCase()}: ${bias(d)}`).join('; ');
  return [
    `Voice profile for this output — "${profile.name || 'Untitled voice'}".`,
    `Calibrate: ${rubric}.`,
    profile.subtitle ? `Tone note: ${profile.subtitle}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Compose the voice snippet for a given chapter. Returns '' when no profile
 * is assigned, so callers can always safely prepend it to systemContext.
 */
export function voiceSystemSnippet(worldState, bookId, chapterId) {
  return describeVoiceForAI(getActiveVoiceProfile(worldState, bookId, chapterId));
}

export default { getActiveVoiceProfile, describeVoiceForAI, voiceSystemSnippet };

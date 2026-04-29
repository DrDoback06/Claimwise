// Loomwright — voice scoring. Heuristic profile derived from sample text;
// each paragraph is then scored against that profile and a 0..1 match
// returned. No external service required.

export function profileFromSamples(samples) {
  const texts = (Array.isArray(samples) ? samples : [samples]).filter(Boolean);
  const text = texts.join('\n').trim();
  if (!text) return null;
  const sents = text.match(/[^.!?]+[.!?]+/g) || [text];
  const words = text.match(/\S+/g) || [];
  if (words.length < 5) return null;
  const avgSentLen = words.length / Math.max(1, sents.length);
  const longWords = words.filter(w => w.length > 7).length / words.length;
  const punct = (text.match(/[—:;]/g) || []).length / Math.max(1, sents.length);
  const adverbs = (text.match(/\b\w+ly\b/gi) || []).length / Math.max(1, words.length);
  const exclam = (text.match(/!/g) || []).length / Math.max(1, sents.length);
  const question = (text.match(/\?/g) || []).length / Math.max(1, sents.length);
  return { avgSentLen, longWords, punct, adverbs, exclam, question };
}

export function scoreParagraph(text, profile) {
  if (!profile || !text) return null;
  const p2 = profileFromSamples([text]);
  if (!p2) return null;
  // Weighted distance across signals.
  const keys = ['avgSentLen', 'longWords', 'punct', 'adverbs', 'exclam', 'question'];
  let total = 0, count = 0;
  for (const k of keys) {
    const a = profile[k] ?? 0;
    const b = p2[k] ?? 0;
    const scale = k === 'avgSentLen' ? 30 : 1;
    const d = Math.abs(a - b) / Math.max(0.0001, scale);
    total += Math.min(1, d);
    count += 1;
  }
  const mean = count ? total / count : 1;
  return Math.max(0, Math.min(1, 1 - mean));
}

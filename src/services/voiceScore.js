/**
 * voiceScore - lightweight "does this sound like you?" score.
 *
 * Pure-client n-gram / readability model. No LLM round-trip.
 *
 * Given:
 *   - baseline text (one or more chapters the writer has flagged as "on voice")
 *   - candidate text (the passage being drafted)
 *
 * Returns a score 0..1 where 1 = perfectly on voice, plus per-dimension
 * breakdowns so the UI can show which dimension is drifting.
 *
 * Dimensions (cheap but useful):
 *   - avgSentenceLen: average words per sentence
 *   - sentenceLenVariance: std-dev / mean of sentence length
 *   - commaRate:        commas per 100 words
 *   - adjectiveRate:    approximate adjective density (words ending in -ly, -ous, -ive, -ant, -ful)
 *   - dialogueRate:     quoted text ratio
 *   - vocabOverlap:     cosine sim of top-N content words
 *
 * Score combines them with a mild weighting; drifts > 0.2 are warnings.
 */

const STOPWORDS = new Set([
  'the','and','of','to','a','in','that','it','is','was','he','for','on','are',
  'with','as','his','her','they','at','be','this','have','from','or','one',
  'had','by','but','not','what','all','were','we','when','your','can','said',
  'there','use','an','each','which','she','do','how','if','will','up','other',
  'about','out','many','then','them','these','so','some','him','into','time',
  'has','look','two','more','go','see','than','first','been','could','no',
  'made','may','you','me','i','where','after','again','before','even',
  'between','while','though','just','very','only','because','such','any',
  'still','both','never','always','their','our','my','us','upon',
]);

function sentences(text) {
  return (text || '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function words(text) {
  return (text || '').toLowerCase().match(/[a-z']+/g) || [];
}
function contentWords(text) {
  return words(text).filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function stddev(arr) {
  if (!arr.length) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / arr.length;
  return Math.sqrt(variance);
}

function profile(text) {
  const s = sentences(text);
  const w = words(text);
  if (!w.length) return { avgSentenceLen: 0, sentenceVariance: 0, commaRate: 0, adjectiveRate: 0, dialogueRate: 0, vocab: new Map() };
  const lens = s.map((sen) => words(sen).length);
  const avg = lens.reduce((a, b) => a + b, 0) / (lens.length || 1);
  const sd = stddev(lens);
  const commaCount = (text.match(/,/g) || []).length;
  const adj = w.filter((x) => /(ly|ous|ive|ant|ful|ish|less)$/.test(x)).length;
  const quoted = (text.match(/[\u201C"][^\u201D"]+[\u201D"]/g) || []).reduce((a, b) => a + b.length, 0);
  const vocab = new Map();
  contentWords(text).forEach((tok) => {
    vocab.set(tok, (vocab.get(tok) || 0) + 1);
  });
  return {
    avgSentenceLen: avg,
    sentenceVariance: avg ? sd / avg : 0,
    commaRate: (commaCount / w.length) * 100,
    adjectiveRate: adj / w.length,
    dialogueRate: quoted / text.length,
    vocab,
    totalWords: w.length,
  };
}

function cosine(a, b) {
  let dot = 0;
  let aMag = 0;
  let bMag = 0;
  a.forEach((va, key) => {
    aMag += va * va;
    const vb = b.get(key) || 0;
    dot += va * vb;
  });
  b.forEach((vb) => { bMag += vb * vb; });
  if (!aMag || !bMag) return 0;
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}

function diffNormalised(a, b, cap = 20) {
  if (!a && !b) return 1;
  const diff = Math.abs(a - b);
  return 1 - Math.min(1, diff / cap);
}

export function scoreVoice(candidate, baseline) {
  if (!candidate || !baseline) return { score: 0, dims: {} };
  const A = profile(baseline);
  const B = profile(candidate);
  const dims = {
    sentenceLength:   diffNormalised(A.avgSentenceLen, B.avgSentenceLen, 10),
    sentenceVariance: diffNormalised(A.sentenceVariance, B.sentenceVariance, 0.6),
    commaRate:        diffNormalised(A.commaRate, B.commaRate, 3),
    adjectiveRate:    diffNormalised(A.adjectiveRate, B.adjectiveRate, 0.05),
    dialogueRate:     diffNormalised(A.dialogueRate, B.dialogueRate, 0.3),
    vocabOverlap:     cosine(A.vocab, B.vocab),
  };
  const weights = {
    sentenceLength: 1,
    sentenceVariance: 0.7,
    commaRate: 0.6,
    adjectiveRate: 0.8,
    dialogueRate: 0.4,
    vocabOverlap: 1.2,
  };
  let sum = 0;
  let totalW = 0;
  Object.keys(weights).forEach((k) => {
    sum += (dims[k] || 0) * weights[k];
    totalW += weights[k];
  });
  const score = Math.max(0, Math.min(1, sum / totalW));
  return { score, dims };
}

export function scoreToTone(score) {
  if (score >= 0.75) return 'good';
  if (score >= 0.55) return 'warn';
  return 'bad';
}

/**
 * Sort thesaurus synonyms by affinity to the voice profile (higher is
 * better). We approximate affinity as the frequency of the candidate
 * synonym in the baseline vocab; ties fall back to string length parity
 * (writers tend to prefer a rhythm, so a rough length match is useful).
 */
export function sortSynonymsByVoice(synonyms, baseline) {
  if (!synonyms?.length) return [];
  if (!baseline) return synonyms;
  const vocab = profile(baseline).vocab;
  return synonyms
    .slice()
    .map((s) => ({ s, freq: vocab.get(s.toLowerCase()) || 0, len: s.length }))
    .sort((a, b) => b.freq - a.freq || Math.abs(a.len - 8) - Math.abs(b.len - 8))
    .map((x) => x.s);
}

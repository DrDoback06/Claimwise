// Loomwright — local detectors. Pure JS, no external services. The
// orchestrator calls these first; if a legacy service is wired in
// alongside, it is layered on top.

import entityMatchingService from '../../../services/entityMatchingService';

const STOPWORDS = new Set([
  'The', 'A', 'An', 'And', 'But', 'Or', 'For', 'Nor', 'Yet', 'So', 'If', 'Of', 'On', 'In', 'At', 'To', 'By',
  'I', 'He', 'She', 'They', 'We', 'You', 'It', 'This', 'That', 'These', 'Those',
  'Mr', 'Mrs', 'Ms', 'Dr', 'Sir', 'Lord', 'Lady', 'Father', 'Mother', 'Brother', 'Sister',
  'Mister', 'Madam', 'Miss',
  'Yes', 'No', 'Maybe', 'Sure', 'Now', 'Then', 'There', 'Here', 'Where', 'When', 'Why', 'How',
  'Once', 'Just', 'Even', 'Still', 'Already', 'After', 'Before', 'Until', 'Since',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
  'Im', 'Ive', 'Ill', 'Id', 'Don', 'Doesnt', 'Didnt', 'Wont', 'Cant', 'Couldnt',
  'God', 'Lord', // unless they really are characters
]);

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Find capitalised-name candidates not yet in cast/places.
export function findCandidateNames(text, knownCast = [], knownPlaces = []) {
  if (!text) return [];
  const known = new Set();
  for (const c of knownCast) {
    if (c.name) known.add(c.name.toLowerCase());
    for (const a of c.aliases || []) known.add((a || '').toLowerCase());
  }
  for (const p of knownPlaces) {
    if (p.name) known.add(p.name.toLowerCase());
  }

  // Match runs of Capitalised words (1-3 words). Also captures "the Black Hare".
  const re = /\b(?:[A-Z][a-z]{2,}(?:\s+(?:of|the|de|du|von|van|al)\s+)?(?:\s+[A-Z][a-z]+){0,2})\b/g;
  const counts = new Map();
  const positions = new Map();
  let m;
  while ((m = re.exec(text)) !== null) {
    const candidate = m[0].trim();
    const first = candidate.split(/\s+/)[0];
    if (STOPWORDS.has(first)) continue;
    if (known.has(candidate.toLowerCase())) continue;
    // Skip start-of-sentence single words like "Suddenly".
    const before = text.slice(Math.max(0, m.index - 2), m.index);
    if (/(^|[.!?]\s+)$/.test(before) && !/\s/.test(candidate)) {
      // single word at sentence start — usually a regular word
      continue;
    }
    counts.set(candidate, (counts.get(candidate) || 0) + 1);
    if (!positions.has(candidate)) positions.set(candidate, m.index);
  }
  // Only surface names that appear at least once (allow single-mention).
  return Array.from(counts.entries()).map(([name, count]) => ({
    name, count, position: positions.get(name) || 0,
  }));
}

// Heuristic: words after "in", "at", "to", "from" + capitalised → place.
const PLACE_TRIGGERS = /\b(in|at|to|from|toward|towards|through|past|across|near|outside|inside)\s+(the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;

export function findCandidatePlaces(text, knownPlaces = []) {
  if (!text) return [];
  const known = new Set((knownPlaces || []).map(p => (p.name || '').toLowerCase()));
  const out = new Map();
  let m;
  while ((m = PLACE_TRIGGERS.exec(text)) !== null) {
    const name = m[3];
    if (STOPWORDS.has(name)) continue;
    if (known.has(name.toLowerCase())) continue;
    out.set(name, (out.get(name) || 0) + 1);
  }
  return Array.from(out.entries()).map(([name, count]) => ({ name, count }));
}

// Dialogue — quoted lines and likely speaker.
export function findDialogue(text) {
  if (!text) return [];
  const re = /[“"]([^”"]+)[”"]\s*(?:said|asked|replied|whispered|shouted|murmured|cried)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)?/g;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ line: m[1], speaker: m[2] || null, position: m.index });
  }
  return out;
}

// Mentions of a known character in text — used by AppearancesTab and others.
export function findMentions(name, text) {
  if (!name || !text) return [];
  const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) out.push({ index: m.index });
  return out;
}

// Detect repeated word "echoes" — same word twice in a row.
export function findEchoes(text) {
  if (!text) return [];
  const re = /\b(\w{3,})\b\s+\1\b/gi;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ word: m[1], position: m.index });
  }
  return out;
}

// Adverb density.
export function findAdverbHotspots(text) {
  const all = text?.match(/\b\w+ly\b/gi) || [];
  return all;
}

// Long sentence detector.
export function findLongSentences(text, threshold = 35) {
  if (!text) return [];
  const sents = text.match(/[^.!?]+[.!?]+/g) || [];
  return sents.filter(s => s.split(/\s+/).filter(Boolean).length > threshold);
}

// Continuity check across chapters: did we mention an item / place that
// doesn't exist in the canon yet?
export function findContinuityIssues(text, ctx) {
  // Lightweight: any capitalised noun the writer just introduced w/o prior
  // mention. Implementation lives in findCandidateNames already; this
  // method is a placeholder for future logic that compares against
  // chapter history.
  return [];
}

export { entityMatchingService };

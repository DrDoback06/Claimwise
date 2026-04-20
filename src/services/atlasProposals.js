/**
 * atlasProposals - extract place-like proper nouns from chapter prose and
 * surface them as ghost pins on the Atlas.
 *
 * Heuristics only (no LLM round-trip required for the basic surface):
 *   - Capitalised multi-word noun phrases ("The Burning Field", "East Ridge")
 *   - Single proper nouns preceded by prepositions of place ("in", "at",
 *     "near", "toward", "by", "across", "beyond")
 *   - Known place-kind suffixes ("Castle", "City", "Village", "Hall",
 *     "Chapel", "Inn", "Keep", "Pass", "Bridge", "River", "Field", "Ridge",
 *     "Forest", "Woods", "Peak", "Shore")
 *
 * Each proposal carries the chapter id + an excerpt + a confidence and is
 * deduped against existing `worldState.places[].name`. The UI can Accept
 * (commit to places), Merge (attach to an existing place), or Dismiss.
 *
 * When Canon Weaver is available the caller may additionally dispatch a
 * sweep mode to refine; that's wired in M20.
 */

const PLACE_SUFFIX_KINDS = {
  castle: 'castle', keep: 'castle', palace: 'castle',
  city: 'city', town: 'town', village: 'village',
  hall: 'castle', manor: 'castle', tower: 'castle',
  chapel: 'shrine', shrine: 'shrine', temple: 'shrine', abbey: 'shrine',
  inn: 'inn', tavern: 'inn',
  pass: 'feature', bridge: 'feature', crossroads: 'feature',
  field: 'feature', ridge: 'feature', hill: 'feature', peak: 'mountain',
  mountain: 'mountain', valley: 'feature', vale: 'feature',
  river: 'river', brook: 'river', stream: 'river',
  forest: 'forest', wood: 'forest', woods: 'forest',
  shore: 'feature', coast: 'feature',
  ruin: 'ruin', ruins: 'ruin',
  gate: 'feature', wall: 'feature',
  port: 'city', harbour: 'city', harbor: 'city',
};

const PLACE_PREPOSITIONS = [
  'in', 'at', 'near', 'toward', 'towards', 'by', 'across',
  'beyond', 'past', 'through', 'to', 'from', 'into',
];

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'on', 'into', 'for',
  'with', 'his', 'her', 'their', 'this', 'that', 'those', 'these',
  'he', 'she', 'they', 'it', 'was', 'were', 'is', 'are', 'be',
  'i', 'you', 'we', 'us', 'our', 'my', 'your',
  'sir', 'lord', 'lady', 'king', 'queen', 'prince', 'princess', 'duke',
  'god', 'gods', 'goddess',
  'chapter', 'book', 'part', 'volume',
]);

function isStopword(word) {
  return !word || STOPWORDS.has(word.toLowerCase());
}

/**
 * Pull every "Capitalised Proper Noun" run of 1-4 words from a paragraph.
 * Skips leading capitals that are just sentence starts (filter via
 * stopword lookup). Returns { phrase, indexInPara }.
 */
function extractProperNouns(paragraph) {
  if (!paragraph) return [];
  const words = paragraph.split(/(\s+|[.,;:!?])/);
  const out = [];
  let buf = [];
  let buffered = false;
  let idx = 0;
  words.forEach((tok) => {
    const isWord = /^[A-Za-z']+$/.test(tok);
    const isCap = isWord && /^[A-Z]/.test(tok);
    const isLower = isWord && /^[a-z]/.test(tok);
    if (isCap && !isStopword(tok)) {
      buf.push(tok);
      buffered = true;
    } else if (isWord && tok.toLowerCase() === 'of' && buffered) {
      buf.push(tok); // "Hall of the ..." connectors
    } else if (isWord && isLower && buffered && buf.length === 1) {
      // e.g. "the Burning Field" — keep inner stopword "the" if following
      buf = [];
      buffered = false;
    } else {
      if (buf.length && buffered) {
        const phrase = buf.join(' ').trim();
        if (phrase.split(' ').length <= 4) {
          out.push({ phrase, idx });
        }
      }
      buf = [];
      buffered = false;
    }
    idx += tok.length;
  });
  if (buf.length && buffered) {
    const phrase = buf.join(' ').trim();
    if (phrase.split(' ').length <= 4) {
      out.push({ phrase, idx });
    }
  }
  return out;
}

/**
 * Given a capitalised phrase, try to classify it as a place via its tail
 * word + preposition context. Returns { kind, confidence } or null if it
 * doesn't look like a place.
 */
function classifyPhrase(phrase, precedingWord) {
  if (!phrase) return null;
  const words = phrase.split(/\s+/);
  const tail = (words[words.length - 1] || '').toLowerCase();
  const cleanTail = tail.replace(/[^a-z]/g, '');
  if (PLACE_SUFFIX_KINDS[cleanTail]) {
    return { kind: PLACE_SUFFIX_KINDS[cleanTail], confidence: 'high' };
  }
  // Preposition of place + capitalised noun => medium confidence
  if (precedingWord && PLACE_PREPOSITIONS.includes(precedingWord.toLowerCase())) {
    // Only guess if more than one capital (reduces false positives on names)
    return { kind: 'place', confidence: words.length > 1 ? 'medium' : 'low' };
  }
  return null;
}

export function proposePlaces(worldState) {
  const books = worldState?.books || {};
  const existingNames = new Set(
    (worldState?.places || []).map((p) => (p.name || '').toLowerCase()).filter(Boolean),
  );
  // Also avoid flagging character names as places
  (worldState?.actors || []).forEach((a) => {
    if (a.name) existingNames.add(a.name.toLowerCase());
  });

  const seen = new Map(); // lowercased phrase -> proposal aggregator
  Object.values(books).forEach((book) => {
    (book.chapters || []).forEach((chapter) => {
      const text = chapter.script || chapter.content || '';
      if (!text) return;
      const paragraphs = text.split(/\n\n+/);
      paragraphs.forEach((para, pi) => {
        const nouns = extractProperNouns(para);
        const rawTokens = para.split(/(\s+)/);
        nouns.forEach(({ phrase, idx }) => {
          const key = phrase.toLowerCase();
          if (existingNames.has(key)) return;
          if (key.length < 3) return;
          // Find the preceding word in the paragraph.
          const pre = para.slice(0, idx).trim().split(/\s+/).slice(-1)[0] || '';
          const classified = classifyPhrase(phrase, pre);
          if (!classified) return;
          const existing = seen.get(key);
          const mention = {
            bookId: book.id,
            chapterId: chapter.id,
            paragraph: pi + 1,
            excerpt: para.slice(Math.max(0, idx - 40), Math.min(para.length, idx + phrase.length + 60)).trim(),
          };
          if (existing) {
            existing.mentions.push(mention);
            if (classified.confidence === 'high') existing.confidence = 'high';
          } else {
            seen.set(key, {
              id: `prop_${key.replace(/[^a-z0-9]+/gi, '_')}`,
              name: phrase,
              kind: classified.kind,
              confidence: classified.confidence,
              mentions: [mention],
              status: 'proposal',
            });
          }
          // Silence unused-var lint on rawTokens (kept for possible future refinement)
          // eslint-disable-next-line no-unused-expressions
          rawTokens.length;
        });
      });
    });
  });
  return Array.from(seen.values())
    .sort((a, b) => b.mentions.length - a.mentions.length);
}

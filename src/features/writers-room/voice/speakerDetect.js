// Loomwright — speaker detection. Rule-based attribution of dialogue
// lines to characters by name. Used by ReadAloud to pick a voice per
// sentence; users can right-click any sentence to override.
//
// Patterns recognised:
//   "..." said Marlo    → Marlo
//   "...," replied Aria  → Aria
//   Marlo said, "..."   → Marlo
//   Marlo: "..."        → Marlo
//   — Marlo (em-dash)   → Marlo
// If none match and the previous sentence had a speaker, we keep that
// speaker (continuation rule). Otherwise: narrator.

const SAID_VERBS = '(said|replied|whispered|shouted|asked|answered|murmured|growled|laughed|sneered|sighed|added|continued|muttered|hissed|barked|roared|breathed)';

// Build a list of plausible name matches for the cast — first names plus
// full names plus nicknames where present. Sorted longest-first so
// "Aria of the Hill" beats "Aria".
function buildNameIndex(cast) {
  const idx = [];
  for (const c of cast || []) {
    if (!c?.name) continue;
    idx.push({ id: c.id, name: c.name });
    const first = c.name.split(/\s+/)[0];
    if (first && first !== c.name) idx.push({ id: c.id, name: first });
    for (const alias of c.aliases || []) {
      if (alias) idx.push({ id: c.id, name: alias });
    }
  }
  idx.sort((a, b) => b.name.length - a.name.length);
  // De-dupe by name (keep the first occurrence — longest first wins).
  const seen = new Set();
  return idx.filter(x => (seen.has(x.name.toLowerCase()) ? false : (seen.add(x.name.toLowerCase()), true)));
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Match the sentence against the cast index using the patterns above.
function detectFromText(sentence, nameIndex) {
  const text = sentence.text || '';
  for (const entry of nameIndex) {
    const n = escapeRe(entry.name);
    const patterns = [
      new RegExp(`["”']\\s*[,.?!—-]?\\s*${SAID_VERBS}\\s+${n}\\b`, 'i'),
      new RegExp(`["”']\\s*[,.?!—-]?\\s*${n}\\s+${SAID_VERBS}\\b`, 'i'),
      new RegExp(`\\b${n}\\s+${SAID_VERBS}\\s*[,]?\\s*["“']`, 'i'),
      new RegExp(`^\\s*${n}\\s*:\\s*["“']`, 'i'),
      new RegExp(`^\\s*[—–-]\\s*${n}\\b`, 'i'),
    ];
    for (const re of patterns) if (re.test(text)) return entry.id;
  }
  return null;
}

// Whole-paragraph attribution. Returns an array shaped like the input
// `sentences` with an added `speakerId` (character id or null).
//
//   sentences: [{ paragraphId, text }, …]
//   cast: store.cast
//   overrides: { [sentenceIdx]: characterId } — manual right-click overrides
//
// Continuation rule: if a sentence has no explicit attribution but the
// previous sentence did AND no quote-closing punctuation lands between,
// we keep the same speaker.
export function attributeSpeakers(sentences, cast, overrides = {}) {
  const idx = buildNameIndex(cast);
  let last = null;
  return sentences.map((s, i) => {
    if (overrides[i]) return { ...s, speakerId: overrides[i], detected: 'override' };
    const detected = detectFromText(s, idx);
    if (detected) {
      last = detected;
      return { ...s, speakerId: detected, detected: 'rule' };
    }
    // Continuation: only carry over if the sentence appears to be inside
    // ongoing dialogue (starts with a quote or contains one).
    if (last && /["“']/.test(s.text || '')) {
      return { ...s, speakerId: last, detected: 'continuation' };
    }
    last = null;
    return { ...s, speakerId: null, detected: null };
  });
}

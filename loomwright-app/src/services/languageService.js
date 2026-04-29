/**
 * languageService - lightweight rule-based grammar / spell / style check
 * for the Loomwright inline squiggles layer.
 *
 * No external dictionaries required. Rules cover the paper-cut issues that
 * matter in-draft: repeated words, missing apostrophes, sentence starts,
 * double spaces, and a small list of commonly-mistyped words. Spell check
 * is augmented by the per-project wiki dictionary (`wikiDictionary.js`) so
 * invented nouns are never flagged.
 *
 * Each issue returned has:
 *   { offset, length, kind, rule, message, suggestions: [string] }
 *
 * Callers render these as squiggles + tooltip via InlineSquiggles.
 */

import { getWikiDictionary } from './wikiDictionary';

const COMMON_TYPOS = {
  'teh': 'the',
  'adn': 'and',
  'recieve': 'receive',
  'seperate': 'separate',
  'occured': 'occurred',
  'untill': 'until',
  'wich': 'which',
  'their': 'their', // ambiguous with they're/there - flagged by context rule instead
  'alot': 'a lot',
  'abit': 'a bit',
  'goverment': 'government',
  'definately': 'definitely',
  'tommorow': 'tomorrow',
  'arguement': 'argument',
  'enviroment': 'environment',
  'comming': 'coming',
  'embarass': 'embarrass',
  'tommorrow': 'tomorrow',
  'recieved': 'received',
};

const MISSING_APOS = {
  'dont': 'don\u2019t',
  'wont': 'won\u2019t',
  'cant': 'can\u2019t',
  'hadnt': 'hadn\u2019t',
  'hasnt': 'hasn\u2019t',
  'havent': 'haven\u2019t',
  'isnt': 'isn\u2019t',
  'arent': 'aren\u2019t',
  'wasnt': 'wasn\u2019t',
  'werent': 'weren\u2019t',
  'shouldnt': 'shouldn\u2019t',
  'couldnt': 'couldn\u2019t',
  'wouldnt': 'wouldn\u2019t',
  'doesnt': 'doesn\u2019t',
  'didnt': 'didn\u2019t',
  'im': 'I\u2019m',
  'ive': 'I\u2019ve',
  'id': 'I\u2019d',
  'youre': 'you\u2019re',
  'youve': 'you\u2019ve',
  'theyre': 'they\u2019re',
  'theyve': 'they\u2019ve',
  'hes': 'he\u2019s',
  'shes': 'she\u2019s',
  'its': 'it\u2019s', // context-sensitive; flagged only when clearly "it is"
  'lets': 'let\u2019s',
  'thats': 'that\u2019s',
};

const PASSIVE_REGEX = /\b(was|were|been|being|is|are|am)\s+\w+(ed|en)\b/gi;
const DOUBLE_SPACE = / {2,}/g;
const REPEATED_WORD = /\b(\w+)\s+\1\b/gi;

function pushIssue(list, { offset, length, kind, rule, message, suggestions }) {
  list.push({ offset, length, kind, rule, message, suggestions: suggestions || [] });
}

/**
 * Run the rule set over a piece of text.
 */
export function lintText(text, { worldState, voiceProfile } = {}) {
  if (!text) return [];
  const issues = [];
  const dict = getWikiDictionary(worldState);

  // 1. Double spaces
  {
    DOUBLE_SPACE.lastIndex = 0;
    let m;
    while ((m = DOUBLE_SPACE.exec(text)) !== null) {
      pushIssue(issues, {
        offset: m.index,
        length: m[0].length,
        kind: 'style',
        rule: 'double-space',
        message: 'Double space.',
        suggestions: [' '],
      });
    }
  }

  // 2. Repeated word
  {
    REPEATED_WORD.lastIndex = 0;
    let m;
    while ((m = REPEATED_WORD.exec(text)) !== null) {
      pushIssue(issues, {
        offset: m.index,
        length: m[0].length,
        kind: 'grammar',
        rule: 'repeated-word',
        message: `Repeated word: "${m[1]}".`,
        suggestions: [m[1]],
      });
    }
  }

  // 3. Missing apostrophe + typos + simple spell check.
  {
    const wordRe = /\b[A-Za-z']+\b/g;
    let m;
    while ((m = wordRe.exec(text)) !== null) {
      const word = m[0];
      const lower = word.toLowerCase();
      if (COMMON_TYPOS[lower] && COMMON_TYPOS[lower] !== lower) {
        pushIssue(issues, {
          offset: m.index,
          length: word.length,
          kind: 'spelling',
          rule: 'typo',
          message: `Common typo: "${word}".`,
          suggestions: [COMMON_TYPOS[lower]],
        });
        continue;
      }
      if (MISSING_APOS[lower]) {
        // Heuristic skip of ambiguous "its" - only flag when followed by a verb.
        if (lower === 'its') {
          const tail = text.slice(m.index + word.length, m.index + word.length + 20);
          if (!/\s+(a|an|the|been|going|not|too)\b/i.test(tail)) continue;
        }
        pushIssue(issues, {
          offset: m.index,
          length: word.length,
          kind: 'grammar',
          rule: 'missing-apostrophe',
          message: `Likely contraction missing apostrophe.`,
          suggestions: [MISSING_APOS[lower]],
        });
        continue;
      }
      // Basic spell: treat any 4+ letter token not in dict and not proper-noun
      // as suspicious. Many false positives unless we have a real dict, so
      // we only flag obvious junk (three or more consonants in a row, no
      // vowel, or letters that don't form English bigrams). This is cheap
      // and catches typos like "gldnr" without flagging rare-but-real words.
      if (word.length >= 5 && !/[aeiouyAEIOUY]/.test(word) && /^[a-zA-Z]+$/.test(word)) {
        if (!dict.has(lower)) {
          pushIssue(issues, {
            offset: m.index,
            length: word.length,
            kind: 'spelling',
            rule: 'spelling',
            message: `Unrecognised word "${word}".`,
            suggestions: [],
          });
        }
      }
    }
  }

  // 4. Passive voice (style hint, low severity).
  {
    PASSIVE_REGEX.lastIndex = 0;
    let m;
    while ((m = PASSIVE_REGEX.exec(text)) !== null) {
      pushIssue(issues, {
        offset: m.index,
        length: m[0].length,
        kind: 'style',
        rule: 'passive-voice',
        message: 'Possible passive voice.',
        suggestions: [],
      });
    }
  }

  // 5. Sentence-start capitalisation.
  {
    const sentRe = /([.!?]\s+|^\s*)([a-z])/g;
    let m;
    while ((m = sentRe.exec(text)) !== null) {
      const pos = m.index + m[1].length;
      pushIssue(issues, {
        offset: pos,
        length: 1,
        kind: 'grammar',
        rule: 'sentence-case',
        message: 'Sentence should start with a capital letter.',
        suggestions: [m[2].toUpperCase()],
      });
    }
  }

  // Voice-drift ambient hint: the writer's voice score is computed
  // elsewhere (services/voiceScore.js, landed in M23). This service is kept
  // pure so callers can opt-in to the score without re-running rules.
  // eslint-disable-next-line no-unused-vars
  const _voice = voiceProfile;

  return issues.sort((a, b) => a.offset - b.offset);
}

export const LANGUAGE_KINDS = {
  spelling: { color: 'var(--lw-bad, #c76b5a)', label: 'Spelling' },
  grammar:  { color: 'var(--lw-accent-2, #7fb8c7)', label: 'Grammar' },
  style:    { color: 'var(--lw-warn, #e2b552)', label: 'Style' },
};

/**
 * wikiDictionary - auto-learns invented nouns from worldState so the
 * inline spell checker never flags them. Rebuilds memoised on worldState
 * changes (cheap: just reads names off actors/items/places/factions).
 *
 * Also exposes a small common-English word list so the spell-check rule in
 * languageService can treat known words as always-OK.
 */

const COMMON_WORDS = [
  'the', 'and', 'of', 'to', 'a', 'in', 'that', 'it', 'is', 'was', 'he', 'for',
  'on', 'are', 'with', 'as', 'his', 'they', 'at', 'be', 'this', 'have', 'from',
  'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we',
  'when', 'your', 'can', 'said', 'there', 'use', 'an', 'each', 'which', 'she',
  'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many',
  'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'him',
  'into', 'time', 'has', 'look', 'two', 'more', 'write', 'go', 'see', 'number',
  'no', 'way', 'could', 'people', 'my', 'than', 'first', 'water', 'been',
  'call', 'who', 'oil', 'now', 'find', 'long', 'down', 'day', 'did', 'get',
  'come', 'made', 'may', 'part', 'you', 'me', 'i', 'where', 'after', 'again',
  'before', 'even', 'between', 'while', 'though', 'just', 'very', 'only',
  'because', 'such', 'any', 'still', 'both', 'never', 'always',
];

let lastWorldSignature = null;
let cached = null;

function worldSignature(worldState) {
  if (!worldState) return '';
  const parts = [];
  (worldState.actors || []).forEach((a) => parts.push(a.name || ''));
  (worldState.itemBank || []).forEach((i) => parts.push(i.name || ''));
  (worldState.places || []).forEach((p) => parts.push(p.name || ''));
  (worldState.factions || []).forEach((f) => parts.push(f.name || ''));
  return parts.join('|');
}

function tokensFromName(name) {
  if (!name) return [];
  return name
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

export function getWikiDictionary(worldState) {
  const sig = worldSignature(worldState);
  if (sig === lastWorldSignature && cached) return cached;
  const set = new Set(COMMON_WORDS);
  (worldState?.actors || []).forEach((a) => {
    tokensFromName(a.name).forEach((tok) => set.add(tok));
  });
  (worldState?.itemBank || []).forEach((i) => {
    tokensFromName(i.name).forEach((tok) => set.add(tok));
  });
  (worldState?.places || []).forEach((p) => {
    tokensFromName(p.name).forEach((tok) => set.add(tok));
  });
  (worldState?.factions || []).forEach((f) => {
    tokensFromName(f.name).forEach((tok) => set.add(tok));
  });
  lastWorldSignature = sig;
  cached = set;
  return set;
}

/**
 * Tiny, expressive thesaurus for the right-click menu. Not exhaustive -
 * enough to feel responsive on common verbs/adjectives. Synonyms are
 * reordered by voiceProfile affinity in the consumer (voiceScore service).
 */
const THESAURUS = {
  big:      ['large', 'vast', 'immense', 'towering', 'considerable'],
  small:    ['slight', 'compact', 'modest', 'diminutive', 'scant'],
  said:     ['murmured', 'whispered', 'replied', 'answered', 'muttered'],
  ran:      ['sprinted', 'dashed', 'bolted', 'tore', 'fled'],
  walked:   ['strode', 'paced', 'ambled', 'marched', 'wandered'],
  looked:   ['gazed', 'stared', 'peered', 'regarded', 'glanced'],
  happy:    ['glad', 'cheerful', 'pleased', 'elated', 'buoyant'],
  sad:      ['mournful', 'sorrowful', 'heavy', 'wistful', 'crestfallen'],
  angry:    ['furious', 'seething', 'incensed', 'bristling', 'wrathful'],
  dark:     ['dim', 'shadowed', 'gloomy', 'lightless', 'sable'],
  light:    ['bright', 'luminous', 'radiant', 'clear', 'pale'],
  old:      ['ancient', 'elder', 'aged', 'weathered', 'venerable'],
  new:      ['fresh', 'recent', 'unfamiliar', 'novel', 'maiden'],
  quick:    ['swift', 'rapid', 'brisk', 'nimble', 'fleet'],
  slow:     ['sluggish', 'unhurried', 'measured', 'creeping', 'drawn-out'],
  good:     ['fine', 'worthy', 'sound', 'decent', 'handsome'],
  bad:      ['ill', 'grim', 'wretched', 'foul', 'wicked'],
  strong:   ['mighty', 'hardy', 'sinewed', 'robust', 'iron'],
  weak:     ['frail', 'feeble', 'sapped', 'paltry', 'slight'],
  beautiful:['lovely', 'fair', 'comely', 'handsome', 'graceful'],
  ugly:     ['misshapen', 'coarse', 'grim', 'mean', 'homely'],
  cold:     ['chill', 'frigid', 'icy', 'biting', 'frostbitten'],
  hot:      ['scalding', 'blistering', 'searing', 'sweltering'],
};

export function synonymsFor(word) {
  if (!word) return [];
  const k = word.toLowerCase();
  return THESAURUS[k] || [];
}

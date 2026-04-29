// language/data.jsx — mocked manuscript paragraph with annotated issues.

const MANUSCRIPT = [
  { id: 1, text: 'The horn sounded thrice across the misty valley, and Mira knew that the time had finally come.', issues: [
    { start: 39, end: 50, type: 'style', label: 'Redundant', fix: 'knew', note: 'The time coming is the only thing to know — "had finally" is padding.' },
    { start: 66, end: 72, type: 'style', label: 'Weak verb', fix: 'arrived', suggestions: ['arrived', 'had come', 'was here'] },
  ]},
  { id: 2, text: 'She grabbed her father\'s sword from the mantlepeice and ran towards the door.', issues: [
    { start: 38, end: 48, type: 'spell', label: 'Spelling', fix: 'mantelpiece', suggestions: ['mantelpiece', 'mantel piece', 'mantle piece'] },
    { start: 3, end: 10, type: 'style', label: 'Verb choice', fix: 'seized', note: '"Grabbed" reads casual for your period voice. Stronger options below.', suggestions: ['seized', 'snatched', 'took'] },
  ]},
  { id: 3, text: 'Outside, the air was cold and the sky was gray and the mountains was silhouetted against the dawn.', issues: [
    { start: 67, end: 70, type: 'grammar', label: 'Subject-verb', fix: 'were', note: '"Mountains" is plural — use "were".' },
    { start: 0, end: 98, type: 'style', label: 'Repetition', note: 'Three "and" clauses in a row. Consider comma-chained list or splitting the sentence.' },
  ]},
  { id: 4, text: 'Her breath made small clouds that hung in the air like whispered prayers and she walked quickly down the path.', issues: [
    { start: 82, end: 100, type: 'style', label: 'Adverb', fix: 'hurried', suggestions: ['hurried', 'pressed on', 'strode'], note: 'Show the hurry in the verb, not the adverb.' },
  ]},
  { id: 5, text: 'The castle loomed ahead, its towers black against the sky, its gates yawning wide.', issues: [] },
  { id: 6, text: 'She felt the weight of the sword in her hand and she felt that she was ready.', issues: [
    { start: 4, end: 10, type: 'echo', label: 'Echo: "felt"', note: '"Felt" used 2× in one sentence. First instance could become "sensed" or be cut.' },
    { start: 51, end: 55, type: 'echo', label: 'Echo: "felt"', note: '2nd occurrence of "felt".' },
  ]},
];

// Thesaurus panel contents for a selected word
const THESAURUS = {
  'seized': {
    word: 'seized',
    definition: 'to take hold of suddenly and forcibly',
    synonyms: {
      'Action / grabbed': [
        { word: 'snatched', period: 'ok', register: 'neutral', note: 'Quick, slightly furtive' },
        { word: 'grasped', period: 'ok', register: 'neutral' },
        { word: 'clutched', period: 'ok', register: 'neutral', note: 'Implies holding tight, not taking' },
        { word: 'grabbed', period: 'modern', register: 'casual', note: 'Flagged — too casual for your voice' },
      ],
      'Took by force': [
        { word: 'wrested', period: 'archaic', register: 'formal', note: 'Implies from someone' },
        { word: 'plucked', period: 'ok', register: 'lyrical', note: 'Soft, deliberate' },
        { word: 'caught up', period: 'ok', register: 'neutral' },
      ],
      'Took possession': [
        { word: 'took', period: 'ok', register: 'plain' },
        { word: 'appropriated', period: 'modern', register: 'formal', note: 'Modern legal-ish — avoid' },
        { word: 'claimed', period: 'ok', register: 'neutral' },
      ],
    },
    antonyms: ['released', 'dropped', 'relinquished'],
    bookUsage: { used: 12, lastUsed: 'ch.11', avgPerChapter: 0.9 },
    periodNote: 'Good period fit for 14th-century chivalric setting. In use since Old English.',
  },
};

// Readability metrics
const METRICS = {
  flesch: 68,             // Plain English
  fleschGrade: 8.1,       // US grade level
  words: 142,
  sentences: 6,
  avgSentence: 23.7,
  longSentences: 1,       // sentences > 35 words
  passive: 2,             // passive constructions
  adverbs: 3,
  dialoguePct: 0,
  readingMinutes: 0.6,
};

window.MANUSCRIPT = MANUSCRIPT;
window.THESAURUS = THESAURUS;
window.METRICS = METRICS;

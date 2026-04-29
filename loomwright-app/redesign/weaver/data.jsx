// weaver-data.jsx — mock data for Canon Weaver.

const WEAVE_BOOK = {
  name: 'The Ardent Path', totalChapters: 18, currentChapter: 14,
};

const WEAVE_CHAPTERS = [
  { n: 1, title: 'The road from Olm', summary: 'Mira leaves her home. Tobyn warns her about the old places.', words: 3400 },
  { n: 2, title: 'Mira’s offering', summary: 'First ritual at the Kell Stones. The fog thickens.', words: 4120 },
  { n: 3, title: 'Prydhaven’s gates', summary: 'Arrival in the capital. First meeting with Sir Edrick.', words: 3890 },
  { n: 4, title: 'The court of thorns', summary: 'Lord Maelgwyn watches from the gallery.', words: 3600 },
  { n: 5, title: 'A table of six', summary: 'Mira learns the rules of the court through a dinner she cannot leave.', words: 4230 },
  { n: 6, title: 'Westmark raid', summary: 'Mira and Edrick raid Westmark Keep. Mira picks up a relic from the armoury.', words: 4900 },
  { n: 7, title: 'The letter unsent', summary: 'Maelgwyn writes, crosses it out, writes again.', words: 2100 },
  { n: 8, title: 'Return to Prydhaven', summary: 'The crown grows uneasy.', words: 3700 },
  { n: 9, title: 'The Harrowport bargain', summary: 'Maelgwyn sails north.', words: 4200 },
  { n: 10, title: 'Camp in the heather', summary: 'Night scene. Mira and Edrick speak plainly for the first time.', words: 2600 },
  { n: 11, title: 'Marenmouth spice', summary: 'Maelgwyn trades with the eastern ports.', words: 3200 },
  { n: 12, title: 'Tull, at dusk', summary: 'Old Tobyn is found, at last.', words: 4000 },
  { n: 13, title: 'Old Tobyn speaks', summary: 'The warning becomes a map.', words: 3500 },
  { n: 14, title: 'The hollow at Caer Drun', summary: 'Current chapter. The mist parts at the fortress walls.', words: 2418 },
];

// Example weave — user types: "Add a cursed dagger — The Whistling Knife — passed down in House Maelgwyn. Whispers to the bearer. Everyone who holds it ends badly. Mira should pick it up at Westmark and keep it."
const WEAVE_EXAMPLE = {
  idea: 'A cursed dagger — The Whistling Knife. Passed down in House Maelgwyn. Whispers to the bearer. Everyone who holds it ends badly. Mira picks it up at Westmark and keeps it.',
  confidence: 0.87,
  timings: { analyze: 1.2, propose: 2.1 },
  // Proposed edits across systems
  edits: [
    // WORLD — create the artefact
    { id: 'w1', system: 'World', action: 'create', kind: 'artefact',
      title: 'Create entry: The Whistling Knife',
      reasoning: 'New artefact needs a canonical wiki entry with provenance, lore, and linked owners before it can appear in chapters.',
      payload: {
        name: 'The Whistling Knife',
        type: 'Artefact / cursed blade',
        provenance: ['Forged: Gwynmere forges, ~180 BE', 'Owned: House Maelgwyn since the Second Age', 'Lost: Westmark (post ch.6 per this idea)'],
        description: 'A slim iron dagger with a reed-thin groove in the blade. In wind, in breath, in held fear — it whistles. Whoever bears it hears a voice that is almost their own.',
        tags: ['cursed', 'heirloom', 'whisper'],
      },
      references: ['ch.6', 'ch.14 (implied)'],
    },
    // CAST — Mira inventory update
    { id: 'c1', system: 'Cast', action: 'inventory-add', target: 'Mira Vance',
      title: 'Mira Vance — acquires at Westmark (ch.6)',
      reasoning: 'You specified Mira picks it up at Westmark. Chapter 6 is the raid. Add to her per-chapter inventory from ch.6 onwards. Current gear matches — the armoury scene is where it fits naturally.',
      payload: { chapter: 6, change: 'acquired', item: 'The Whistling Knife', slot: 'belt (left)' },
    },
    { id: 'c2', system: 'Cast', action: 'trait-hint', target: 'Mira Vance',
      title: 'Mira — add trait: "hears a voice that is almost her own"',
      reasoning: 'A cursed item that whispers should leave a trace in the character, not just inventory. Suggested soft trait from ch.6 onwards; can be auto-weaved into future scenes.',
      payload: { chapter: 6, change: 'soft trait', note: 'Since Westmark Mira catches herself answering a voice no one else hears.' },
    },
    // CAST — previous owners
    { id: 'c3', system: 'Cast', action: 'backstory-link', target: 'Lord Maelgwyn',
      title: 'Lord Maelgwyn — lost heirloom at Westmark',
      reasoning: 'The Knife is House Maelgwyn’s — its loss during the raid gives Maelgwyn a personal stake he previously lacked. Explains his pivot from cautious to obsessive after ch.6.',
      payload: { chapter: 6, change: 'backstory beat', note: 'Loses ancestral blade when Westmark falls. Does not speak of it.' },
    },
    // PLOT — new thread
    { id: 'p1', system: 'Plot', action: 'create-thread',
      title: 'Create thread: "The Whistling Knife" (Mira)',
      reasoning: 'A cursed object with a trail of doomed owners is a promise to the reader. Opens in ch.6 when picked up; pays off somewhere after ch.14. Suggested tie-in with existing "Mira’s unravelling" thread.',
      payload: { name: 'The Whistling Knife', opens: 6, tieIn: 'Mira’s unravelling', severity: 'major' },
    },
    // TIMELINE — waypoints
    { id: 't1', system: 'Timeline', action: 'pin', title: 'Pin events on the master timeline',
      reasoning: 'Five timeline events derived from the idea — forging, Maelgwyn lineage, Westmark loss, first whisper, final bearer.',
      payload: {
        pins: [
          { when: '~180 BE', what: 'Forged at Gwynmere' },
          { when: 'Second Age', what: 'Enters House Maelgwyn' },
          { when: 'ch.6', what: 'Mira finds the Knife at Westmark' },
          { when: 'ch.6\u20137', what: 'First whisper' },
          { when: 'ch.14+', what: 'Payoff beat TBD' },
        ],
      },
    },
    // ATLAS — pin
    { id: 'a1', system: 'Atlas', action: 'pin-place',
      title: 'Pin on Atlas: "Gwynmere forges" (origin)',
      reasoning: 'New origin location referenced in lore. Suggested near the Ardenian mountains, north of the existing Kell Stones pin.',
      payload: { name: 'Gwynmere forges', kind: 'landmark', x: 320, y: 140 },
    },
    // CHAPTER 2 — foreshadow insertion
    { id: 'ch2', system: 'Chapter', action: 'suggest-edit', target: 'ch.2',
      title: 'Chapter 2 — plant foreshadow (3 lines)',
      reasoning: 'Tobyn already warns about the old places in ch.1. Pull that thread forward: at the Kell Stones he can mention blades that remember. Plants the whistle motif before it sings.',
      payload: {
        before: 'She laid the offering down. The fog swallowed her knees.',
        after:  'She laid the offering down. The fog swallowed her knees. Tobyn’s voice, an hour earlier: "Some steel remembers, girl. Don’t pick up what isn’t yours."',
        intrusion: 'low',
      },
    },
    // CHAPTER 6 — scene edit
    { id: 'ch6', system: 'Chapter', action: 'suggest-edit', target: 'ch.6',
      title: 'Chapter 6 — Westmark armoury (insert paragraph)',
      reasoning: 'The acquisition scene. Needs to be low-key — Mira doesn’t know what it is yet. Written in your voice, matched to the chapter’s existing cadence.',
      payload: {
        before: 'The armoury smelled of smoke and older things.',
        after:  'The armoury smelled of smoke and older things. On a rack near the back, among the cavalry sabres, lay a dagger too thin for a weapon of war — iron, with a reed in the blade. Mira held it to the torchlight. The reed sighed. She thought, that is the draught, and slid it into her belt before she thought anything else.',
        intrusion: 'moderate',
      },
    },
    // CHAPTER 14 — callback
    { id: 'ch14', system: 'Chapter', action: 'suggest-edit', target: 'ch.14',
      title: 'Chapter 14 — add whisper at the fortress (1 sentence)',
      reasoning: 'Current chapter. The whistling blade should speak at least once before the mist parts — cements the motif pre-climax.',
      payload: {
        before: 'Caer Drun rose out of the mist like a thing half-remembered.',
        after:  'Caer Drun rose out of the mist like a thing half-remembered. At her hip the reed stirred, soundless, which meant: it was listening too.',
        intrusion: 'low',
      },
    },
  ],
};

// Past weaves history
const WEAVE_HISTORY = [
  { id: 'h1', when: 'today · 14 min ago', title: 'Add a new ally — Bronwyn, a hedge-witch from Tull', touched: 11, accepted: 9, status: 'accepted' },
  { id: 'h2', when: 'yesterday',          title: 'Kell Stones should be older than the kingdom',   touched: 6,  accepted: 6, status: 'accepted' },
  { id: 'h3', when: '3 days ago',         title: 'Edrick has a sister who died at Harrowport',     touched: 8,  accepted: 7, status: 'accepted' },
  { id: 'h4', when: 'last week',          title: 'Rename "Drum Rock" to "the Kell Stones"',         touched: 23, accepted: 23, status: 'accepted' },
  { id: 'h5', when: 'last week',          title: 'What if Mira was illiterate?',                   touched: 14, accepted: 0,  status: 'rejected' },
];

window.WEAVER = { BOOK: WEAVE_BOOK, CHAPTERS: WEAVE_CHAPTERS, EXAMPLE: WEAVE_EXAMPLE, HISTORY: WEAVE_HISTORY };

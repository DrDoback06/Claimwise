// interview/data.jsx

const CHARACTERS = [
  { id: 'mira',     name: 'Mira Vale',        role: 'Protagonist', color: 'oklch(78% 0.13 78)',  age: 19, pronouns: 'she/her',
    oneliner: 'The heir who never meant to inherit.', chaptersIn: [1,2,3,4,5,7,9,11,12,13,14],
    traits: ['Reluctant', 'Loyal', 'Quick-tempered when cornered', 'Hates being called heir'],
    voice: 'Clipped. Sentences often short. Deflects with questions.',
    knows: ['Father is dying', 'The horn signals the Burning', 'Rook is her half-brother — she suspects'],
    hiddenFromOthers: ['She can hear the old tongue', 'She dreams of Edrick every third night'],
  },
  { id: 'edrick',   name: 'Edrick of Thorn', role: 'Rival / love',  color: 'oklch(72% 0.10 200)', age: 24, pronouns: 'he/him',
    oneliner: 'Wants peace. Is willing to burn for it.', chaptersIn: [3,5,6,8,10,12,14],
    traits: ['Measured', 'Reads people fast', 'Softer than his reputation', 'Insomniac'],
    voice: 'Long sentences. Considers before answering. Rarely raises voice.',
    knows: ['The truce is a lie', 'Rook is a double agent', 'Mira hears the old tongue'],
    hiddenFromOthers: ['He let his brother die', 'Fears fire more than anything'],
  },
  { id: 'tobyn',    name: 'Old Tobyn',        role: 'Mentor',       color: 'oklch(72% 0.13 145)', age: 71, pronouns: 'he/him',
    oneliner: 'Steward, archivist, quiet keeper of the Vale.', chaptersIn: [1,2,4,7,9,13],
    traits: ['Patient', 'Ironical', 'Tires more easily than he admits', 'Keeps a journal in Old Vale'],
    voice: 'Gentle. Metaphor-heavy. Quotes scripture sideways.',
    knows: ['The full prophecy', 'Mira\'s parentage', 'Where the second horn is hidden'],
    hiddenFromOthers: ['He was at the Burning', 'He is the author of the prophecy, not its interpreter'],
  },
  { id: 'rook',     name: 'Rook',             role: 'Half-brother', color: 'oklch(65% 0.18 25)',  age: 22, pronouns: 'he/him',
    oneliner: 'Spy. Loyal only to himself — usually.',          chaptersIn: [6,8,9,11,12,14],
    traits: ['Charming', 'Calculating', 'Laughs off questions he can\'t answer', 'Chain-smokes'],
    voice: 'Witty. Turns every serious moment into a joke and every joke into information.',
    knows: ['Both sides of the coming war', 'Edrick\'s real plan', 'The Council\'s bribes'],
    hiddenFromOthers: ['He is Mira\'s half-brother', 'He loves her (differently than she thinks)'],
  },
];

// Solo interview transcript — Mira
const SOLO_TRANSCRIPT = [
  { by: 'you',  text: 'Mira. Tell me about the morning the horn sounded.' },
  { by: 'mira', text: 'The valley was still. I remember that more than the sound. The valley had never been that still.' },
  { by: 'mira', text: 'Father was already awake when I came down. He was cleaning the sword. He hadn\'t cleaned that sword in ten years.', meta: { revealsTrait: 'Noticing the small thing before the big thing' } },
  { by: 'you',  text: 'You picked the sword up, not your own bow. Why?' },
  { by: 'mira', text: 'Because the bow is for the valley I know. The sword is for whatever comes over the ridge.', meta: { revealsTrait: 'She already knew this wasn\'t going to be defence.' } },
  { by: 'mira', text: 'And — I\'m not going to tell you this in the book — but I picked it up because I was angry. Father had been sick a long time and nobody was going to let him fight.' },
  { by: 'you',  text: 'What did you think, when you saw Edrick on the ridge?' },
  { by: 'mira', text: 'I thought: so this is the face I\'ve been dreaming.' },
];

// Group chat — Mira + Edrick + Tobyn in the war-room
const GROUP_TRANSCRIPT = [
  { by: 'director', text: 'SCENE: War-room. Night before the parley. Three chairs. One candle.', kind: 'stage' },
  { by: 'tobyn',    text: 'If we ride out before dawn, Edrick\'s party will already have taken the east ridge.' },
  { by: 'edrick',   text: 'We will be at the ridge by dawn. That is the point of riding before it.' },
  { by: 'mira',     text: 'You\'re both speaking as though the ridge is the question.', meta: { note: 'Mira cuts across them — matches her "corners" trait' } },
  { by: 'tobyn',    text: 'The ridge is always the question, Mira. Geography is always the question.' },
  { by: 'mira',     text: 'Then answer it. Does my father cross the ridge, or do we leave him behind?' },
  { by: 'edrick',   text: '...' },
  { by: 'edrick',   text: 'You already know the answer to that.' },
  { by: 'director', text: 'BEAT. Mira does not speak for a long time.', kind: 'stage' },
  { by: 'tobyn',    text: 'I am sorry, child.' },
];

// Prompt deck — curated starter questions, grouped
const PROMPT_DECK = [
  { category: 'Character depth', prompts: [
    'What is the one thing you\'d never tell [other character]?',
    'Describe your earliest memory.',
    'What do you want that you won\'t admit you want?',
    'What would break you?',
  ] },
  { category: 'Motivation check', prompts: [
    'Why are you in chapter {ch} at all?',
    'What do you stand to lose if this scene goes wrong?',
    'If you got what you wanted in this scene, what would you actually do with it?',
  ] },
  { category: 'Worldbuilding', prompts: [
    'Teach me a phrase in your language.',
    'What does your village do for the winter solstice?',
    'What is the worst rumour about you?',
    'Who raised you?',
  ] },
  { category: 'Hard questions', prompts: [
    'Whose death do you feel responsible for?',
    'Tell me a lie.',
    'If you met yourself ten years ago, what warning would you give?',
    'Are you in love with [other character]?',
  ] },
  { category: 'Scene-work', prompts: [
    'Walk me through your day before this scene begins.',
    'What\'s in your pocket right now?',
    'What does this room smell like?',
  ] },
];

// Saved insights panel
const SAVED = [
  { id: 1, char: 'mira',   quote: 'The valley had never been that still.',                              savedAt: 'ch.14', kind: 'line',  note: 'Use as chapter opener.' },
  { id: 2, char: 'mira',   quote: 'She picked up the sword because she was angry.',                      savedAt: 'ch.14', kind: 'beat',  note: 'Motive for the cold-open. Do not show directly — hint.' },
  { id: 3, char: 'edrick', quote: 'I fear fire more than anything.',                                      savedAt: 'ch.10', kind: 'trait', note: 'Add to Edrick dossier → Fears.' },
  { id: 4, char: 'tobyn',  quote: 'I am the author of the prophecy, not its interpreter.',              savedAt: 'ch.13', kind: 'reveal',note: 'Chapter-13 reveal. Flag to Canon Weaver for thread check.' },
];

window.CHARACTERS = CHARACTERS;
window.SOLO_TRANSCRIPT = SOLO_TRANSCRIPT;
window.GROUP_TRANSCRIPT = GROUP_TRANSCRIPT;
window.PROMPT_DECK = PROMPT_DECK;
window.SAVED = SAVED;

// voice-data.jsx — sample paragraphs re-voiced at different slider configs.

// The same source paragraph, re-rendered at different voice "personalities".
// Each variant has a vector of 7 dimensions to help color the live preview.
const VOICE_SOURCE = `Mira opened the door. Something was inside. It watched her from the corner where the lantern didn't reach. She thought about leaving, and then she stepped in.`;

// Preset profiles (what Tom's sliders map to)
const VOICE_PROFILES = [
  {
    id: 'book1-mira',
    name: 'Book 1 — Mira',
    saved: 'current',
    subtitle: 'The voice learned from chapters 1–13.',
    sliders: { formality: 35, rhythm: 58, length: 45, lyricism: 72, darkness: 62, pov: 30, modernity: 40 },
    sample: `She opened the door. In the corner the lantern didn't reach, something watched. She thought of leaving — thought of it the way you think of a road you should have taken. Then she stepped in, because she was the kind of girl who stepped in.`,
  },
  {
    id: 'edrick-pov',
    name: "Edrick's POV",
    saved: 'committed',
    subtitle: 'Tighter, less lyrical, blunt.',
    sliders: { formality: 30, rhythm: 70, length: 20, lyricism: 22, darkness: 55, pov: 10, modernity: 45 },
    sample: `She pushed the door open. Something was in the corner. The lantern didn't reach there. She weighed it. Then she went in.`,
  },
  {
    id: 'grimdark',
    name: 'Grimdark mode',
    saved: 'experiment',
    subtitle: 'Max darkness, long sinuous sentences.',
    sliders: { formality: 50, rhythm: 25, length: 80, lyricism: 85, darkness: 92, pov: 45, modernity: 20 },
    sample: `The door came open under her hand the way all old doors come open — slowly, as if remembering — and beyond it the lantern's light failed in the corner the way light will fail at last everywhere, and she stood on the threshold and gave herself over to the thing that had been waiting in that dark a very long time.`,
  },
  {
    id: 'ya-snappy',
    name: 'YA / snappy',
    saved: 'experiment',
    subtitle: 'Modern vocab, short rhythm, first-person close.',
    sliders: { formality: 20, rhythm: 82, length: 18, lyricism: 30, darkness: 30, pov: 85, modernity: 88 },
    sample: `I pushed the door. Something was in there. I couldn't see it — the lantern was useless in that corner. I thought about bailing. I went in anyway. Of course I did.`,
  },
  {
    id: 'tobyn-chapter',
    name: "Old Tobyn's chapter",
    saved: 'committed',
    subtitle: 'Older vocabulary, gnarly syntax, warm.',
    sliders: { formality: 55, rhythm: 40, length: 62, lyricism: 60, darkness: 48, pov: 38, modernity: 15 },
    sample: `She set her hand to the door and it opened to her. In the corner beyond the lantern's reach a thing kept its watch. She had it in her mind to turn — aye, to turn — and then she did not, and went in as she was meant to.`,
  },
];

const VOICE_DIMENSIONS = [
  { key: 'formality',  label: 'Formality',      low: 'Colloquial',  high: 'Formal' },
  { key: 'rhythm',     label: 'Rhythm',         low: 'Flowing',     high: 'Staccato' },
  { key: 'length',     label: 'Sentence length',low: 'Long',        high: 'Short' },
  { key: 'lyricism',   label: 'Lyricism',       low: 'Plain',       high: 'Lyrical' },
  { key: 'darkness',   label: 'Darkness',       low: 'Bright',      high: 'Grim' },
  { key: 'pov',        label: 'POV distance',   low: 'Close',       high: 'Distant' },
  { key: 'modernity',  label: 'Vocabulary',     low: 'Archaic',     high: 'Modern' },
];

// Version history — every slider tweak leaves a trace
const VOICE_HISTORY = [
  { id: 'v12', when: '2m ago',  label: 'Formality +8, Lyricism +5',    sliders: { formality: 35, rhythm: 58, length: 45, lyricism: 72, darkness: 62, pov: 30, modernity: 40 } },
  { id: 'v11', when: '14m ago', label: 'Darkness +12 for ch.14 pass',  sliders: { formality: 27, rhythm: 58, length: 45, lyricism: 67, darkness: 62, pov: 30, modernity: 40 } },
  { id: 'v10', when: '1h ago',  label: 'Rhythm re-snapped to 58',       sliders: { formality: 27, rhythm: 58, length: 45, lyricism: 67, darkness: 50, pov: 30, modernity: 40 } },
  { id: 'v9',  when: '3h ago',  label: 'Learned from ch.13 sample',     sliders: { formality: 27, rhythm: 50, length: 50, lyricism: 67, darkness: 50, pov: 30, modernity: 40 } },
  { id: 'v8',  when: 'yesterday', label: 'Starting point from ch.1–6',   sliders: { formality: 30, rhythm: 48, length: 48, lyricism: 64, darkness: 45, pov: 28, modernity: 42 } },
];

// Chapter → profile assignments
const VOICE_ASSIGNMENTS = [
  { chapter: 1,  title: 'The road from Olm',        profile: 'book1-mira' },
  { chapter: 2,  title: 'Mira\u2019s offering',      profile: 'book1-mira' },
  { chapter: 3,  title: 'Prydhaven\u2019s gates',    profile: 'book1-mira' },
  { chapter: 7,  title: 'The letter unsent',        profile: 'edrick-pov' },
  { chapter: 9,  title: 'The Harrowport bargain',   profile: 'grimdark' },
  { chapter: 12, title: 'Tull, at dusk',            profile: 'tobyn-chapter' },
  { chapter: 13, title: 'Old Tobyn speaks',         profile: 'tobyn-chapter' },
  { chapter: 14, title: 'The hollow at Caer Drun',  profile: 'book1-mira' },
];

window.VOICE = {
  SOURCE: VOICE_SOURCE,
  PROFILES: VOICE_PROFILES,
  DIMENSIONS: VOICE_DIMENSIONS,
  HISTORY: VOICE_HISTORY,
  ASSIGNMENTS: VOICE_ASSIGNMENTS,
};

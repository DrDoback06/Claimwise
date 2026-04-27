// writers-room/data.jsx — empty default window.WR.
//
// The old mock-demo data (Mira Vance, Edrick, Caer Drun, The Whistling Knife,
// 18 hardcoded chapter titles, etc.) has been removed — it was seeding every
// new user with fiction from a different book. entities.jsx's EntitiesBridge
// populates window.WR from the IndexedDB store on mount; this file just
// ensures panels don't crash if they read WR before the bridge has run.

const EMPTY_BOOK = {
  title: 'Untitled',
  series: '',
  currentChapter: 1,
  totalChapters: 1,
  wordsToday: 0,
  streak: 0,
  target: 2500,
};

const EMPTY_CHAPTER = {
  n: 1,
  title: '',
  words: 0,
  lastEdit: '',
  paragraphs: [],
};

const EMPTY_VOICE = {
  match: 0,
  weights: [],
  profiles: [],
  profileSliders: {},
  paragraphMatch: {},
  history: [],
};

// Preserve the PLACE_COLORS palette — it's a display mapping, not fiction.
const WR_PLACE_COLORS = {
  settlement: 'oklch(72% 0.10 200)',
  city:       'oklch(72% 0.10 200)',
  castle:     'oklch(55% 0.10 280)',
  fortress:   'oklch(55% 0.10 280)',
  ruin:       'oklch(65% 0.06 30)',
  wild:       'oklch(68% 0.12 145)',
  forest:     'oklch(68% 0.12 145)',
  path:       'oklch(60% 0.02 60)',
  road:       'oklch(60% 0.02 60)',
  mountain:   'oklch(60% 0.05 40)',
  water:      'oklch(70% 0.10 220)',
  location:   'oklch(60% 0.05 60)',
};

// journeyFor derives visits from cast[id].journey || appears. Panels call
// this directly; it stays here so the contract is visible in one place.
function wrJourneyFor(charId) {
  if (!charId) return [];
  const cast = window.WR?.CAST || [];
  const places = window.WR?.PLACES || [];
  const char = cast.find(c => c.id === charId);
  if (!char) return [];
  if (Array.isArray(char.journey) && char.journey.length) return char.journey;
  const chs = Array.isArray(char.appears) ? char.appears : [];
  const stops = [];
  for (const ch of chs) {
    const place = places.find(p => (p.ch || []).includes(ch));
    if (place && (!stops.length || stops[stops.length - 1].place !== place.id)) {
      stops.push({ place: place.id, ch });
    }
  }
  return stops;
}

window.WR = {
  BOOK: EMPTY_BOOK,
  CHAPTER: EMPTY_CHAPTER,
  CHAPTERS: [],
  CAST: [],
  THREADS: [],
  REALMS: [],
  PLACES: [],
  PLACE_COLORS: WR_PLACE_COLORS,
  FLOORPLANS: {},
  ITEMS: [],
  VOICE: EMPTY_VOICE,
  LANG_ISSUES: {},
  COMMANDS: [
    { k: 'weave',   label: 'Weave an idea into the canon',  hint: 'A character, place, thread…',      icon: 'sparkle' },
    { k: 'focus',   label: 'Enter focus mode',              hint: 'Typewriter scroll · F9',           icon: 'pen' },
    { k: 'mindmap', label: 'Open the Tangle',               hint: 'Drag anything in',                 icon: 'web' },
  ],
  journeyFor: wrJourneyFor,
};

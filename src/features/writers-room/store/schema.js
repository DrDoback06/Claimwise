// Loomwright — canonical schema (plan §2). One normalised store; every
// legacy structure becomes an adapter into this model.
//
// This file documents the shape of state. JS provides no enforcement; the
// adapters in `persistence.js` are the only place data crosses the boundary.

export const SCHEMA_VERSION = 2;

export const EMPTY_PROFILE = {
  onboarded: false,
  workingTitle: null,
  seriesName: null,
  genre: null,
  genres: [],
  subGenres: [],
  premise: null,
  targetAudience: 'adult',
  comparisons: null,
  tone: [],
  pov: null,
  tense: null,
  targetWords: null,
  targetChapters: null,
  worldType: null,
  worldAnchor: null,
  worldRules: [],
  influences: [],
  manuscriptImported: false,
  manuscriptSeed: null,
  seedCast: [],
  writingPreferences: {
    pov: '',
    tense: '',
    chapterLength: '',
    petPeeves: [],
    customPetPeeves: '',
    favorites: [],
    customFavorites: '',
    dialogueStyle: '',
    descriptionDensity: '',
    profanityLevel: '',
    romanticContent: '',
    violenceLevel: '',
  },
  voiceWeights: {
    formality: 0.5, rhythm: 0.5, lyricism: 0.5,
    darkness: 0.5, pov: 0.5, modernity: 0.5,
  },
  ritual: { sprintLen: 25, rhythm: null },
  intrusion: 'medium',
  entityThreshold: 0.6,
  dismissRates: { entity: 0, cast: 0, atlas: 0, thread: 0, voice: 0, lang: 0, spark: 0 },
  acceptCounts:  { entity: 0, cast: 0, atlas: 0, thread: 0, voice: 0, lang: 0, spark: 0 },
  preferredProvider: 'auto',
  aiProvider: 'auto',
  apiKeys: {},
};

export const EMPTY_BOOK = {
  id: 'lw.primary',
  title: 'Untitled',
  series: null,
  currentChapterId: null,
  chapterOrder: [],
  wordsToday: 0,
  streak: 0,
  target: 2500,
  totalChapters: 25,
  createdAt: null,
};

export const DEFAULT_TWEAKS = {
  intrusion: 'medium',     // quiet | medium | helpful | eager
  density: 'comfortable',
  showMargin: true,
  showRitualBar: true,
  highlightMargin: true,
  showChapterTree: true,
  showReadability: false,
  atlasAuto: 'conservative', // off | conservative | helpful | eager
  kindVisibility: {
    cast: true, atlas: true, thread: true, voice: true,
    grammar: true, continuity: true, spark: true,
  },
};

export const EMPTY_UI = {
  panels: [],                 // ['cast','atlas',…] (open order)
  panelWidths: {},
  selection: { character: null, place: null, thread: null, item: null, paragraph: null, scene: null },
  tweaks: { ...DEFAULT_TWEAKS },
  focusMode: false,
  activeChapterId: null,
  activeSceneId: null,
  castDossierTab: {},         // { [charId]: 'identity' | 'stats' | … }
};

export function emptyState() {
  return {
    version: SCHEMA_VERSION,
    profile: { ...EMPTY_PROFILE },
    book: { ...EMPTY_BOOK },
    chapters: {},
    cast: [],
    places: [],
    threads: [],
    items: [],
    skills: [],
    stats: [],
    relationships: [],
    timelineEvents: [],
    voice: [],                // voice profiles
    tangle: { nodes: [], edges: [], layout: {} },
    ui: { ...EMPTY_UI },
    noticings: {},            // legacy redesign field; preserved
    suggestions: [],          // current live suggestions
    reviewQueue: [],
    snapshots: [],
    feedback: [],
    _loading: true,
  };
}

// Per-panel default widths (plan §6).
export const PANEL_WIDTHS = {
  cast: 460, atlas: 460, voice: 420, threads: 460,
  items: 420, language: 420, tangle: 640,
};

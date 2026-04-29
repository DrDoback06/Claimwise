/**
 * Loomwright keyboard-shortcut registry.
 *
 * Single source of truth for every shortcut in the app. App.js binds these at
 * the window level; the help sheet (`KeyboardShortcutsHelp`) renders the same
 * list so what the user presses and what the help shows never drift.
 *
 * Categories are presentation-only. `keys` is an array rendered verbatim in
 * <kbd> chips. `when` is an optional predicate hint ("available on Write
 * only", etc.) shown in the help dialog but NOT enforced at bind time.
 */

export const SHORTCUT_CATEGORIES = [
  {
    id: 'global',
    name: 'Global',
    icon: '\u2328',
    shortcuts: [
      { keys: ['Ctrl', 'K'], action: 'Quick search', description: 'Jump to any actor, item, skill, chapter or tab.' },
      { keys: ['Ctrl', '/'], action: 'Shortcuts', description: 'Open this help sheet.' },
      { keys: ['Ctrl', 'Z'], action: 'Undo', description: 'Step back through the last world-state changes.' },
      { keys: ['Ctrl', 'Y'], action: 'Redo', description: 'Re-apply the most recent undone change.' },
      { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo', description: 'Alias for Ctrl+Y.' },
      { keys: ['Esc'], action: 'Close overlay', description: 'Close any open drawer, modal or overlay.' },
    ],
  },
  {
    id: 'navigation',
    name: 'Navigation',
    icon: '\u2699',
    shortcuts: [
      { keys: ['Ctrl', '1'], action: 'Today',      description: 'Morning brief + Daily Spark + noticings.' },
      { keys: ['Ctrl', '2'], action: "Writer's Room", description: 'Chapter editor with Canon Weaver rail.' },
      { keys: ['Ctrl', '3'], action: 'Cast',       description: 'Characters and their arcs.' },
      { keys: ['Ctrl', '4'], action: 'Atlas',      description: 'World map, floorplans, places.' },
      { keys: ['Ctrl', '5'], action: 'Plot & Timeline', description: 'Threads, beats, timeline.' },
      { keys: ['Ctrl', '6'], action: 'Settings',   description: 'Keys, providers, data and preferences.' },
    ],
  },
  {
    id: 'write',
    name: 'Write',
    icon: '\u270E',
    when: "Available in Writer's Room",
    shortcuts: [
      { keys: ['Ctrl', 'S'],        action: 'Weave chapter',    description: 'Save (weave) the current chapter.' },
      { keys: ['Ctrl', 'Enter'],    action: 'Continue with AI', description: 'Ask the AI to continue from the cursor.' },
      { keys: ['Ctrl', 'R'],        action: 'Rewrite selection',description: 'Open the rewrite menu on selected text.' },
      { keys: ['Ctrl', 'Shift', 'L'], action: 'Language workbench', description: 'Grammar + readability on the current chapter.' },
      { keys: ['Ctrl', 'Shift', 'I'], action: 'Interview mode',     description: 'Chat with any character in-voice.' },
      { keys: ['Ctrl', 'Shift', 'R'], action: 'Read mode',          description: 'Speed-reader takeover of the current chapter.' },
      { keys: ['Ctrl', 'B'],        action: 'Bold selection',   description: 'Toggle bold on the selection.' },
      { keys: ['Ctrl', 'I'],        action: 'Italic selection', description: 'Toggle italic on the selection.' },
    ],
  },
  {
    id: 'weaver',
    name: 'Canon Weaver',
    icon: '\u2767',
    when: 'Works anywhere the Weaver rail is mounted',
    shortcuts: [
      { keys: ['Alt', 'I'], action: 'New idea',      description: 'Focus the idea input on the Weaver rail.' },
      { keys: ['Alt', 'A'], action: 'Accept batch',  description: 'Accept every proposal in the current batch.' },
      { keys: ['Alt', 'R'], action: 'Reject batch',  description: 'Reject every proposal in the current batch.' },
      { keys: ['Alt', 'U'], action: 'Undo batch',    description: 'Undo the most recent weave in one step.' },
    ],
  },
];

// Flat list for the Cmd+K palette, help-sheet search, etc.
export const SHORTCUTS = SHORTCUT_CATEGORIES.flatMap((cat) =>
  cat.shortcuts.map((s) => ({ ...s, category: cat.name, categoryIcon: cat.icon }))
);

/**
 * Tab id mapping — translate legacy Claimwise tab ids to the new Loomwright
 * nav ids. Used by GlobalSearch, the PWA manifest share-target, and the query
 * string parser on boot.
 */
export const LEGACY_TAB_TO_LOOMWRIGHT = {
  // Claimwise legacy
  home:          'today',
  dashboard:     'today',
  personnel:     'cast',
  characters:    'cast',
  relationships: 'cast_detail',
  items:         'items_library',
  itemvault:     'items_library',
  skills:        'skills_library',
  skilltree:     'skills_library',
  stats:         'stats_library',
  story:         'write',
  bible:         'write',
  writing:       'write',
  writersroom:   'write',
  manuscript:    'write',
  analysis:      'plot_timeline',
  storyanalysis: 'plot_timeline',
  plotthreads:   'plot_timeline',
  plotquests:    'plot_timeline',
  plottimeline:  'plot_timeline',
  mastertimeline:'plot_timeline',
  characterarcs: 'plot_timeline',
  world:         'world',
  lore:          'world',
  wiki:          'world',
  mindmap:       'world',
  storymap:      'world',
  factions:      'world',
  atlas:         'atlas',
  map:           'atlas',
  voice:         'voice_studio',
  voicestudio:   'voice_studio',
  backup:        'settings',
  sync:          'settings',
  settings:      'settings',
  providers:     'settings',
  aiproviders:   'settings',
  lw_weaver:     'write',
};

export function resolveTab(id) {
  if (!id) return null;
  const key = String(id).toLowerCase().replace(/[\s_-]+/g, '');
  return LEGACY_TAB_TO_LOOMWRIGHT[key] || id;
}

/**
 * Parse the document's query string for a `?tab=` or `?capture=` deep-link.
 * Returns an object the App.js boot code can use to set initial state.
 */
export function parseDeepLink(search = (typeof window !== 'undefined' ? window.location.search : '')) {
  const out = { tab: null, capture: false, characterId: null, sharedText: '' };
  if (!search) return out;
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const tab = params.get('tab');
    if (tab) out.tab = resolveTab(tab);
    if (params.get('capture') === '1') out.capture = true;
    const cid = params.get('character') || params.get('actor');
    if (cid) out.characterId = cid;
    // PWA Web Share Target (see public/manifest.json share_target). Shared
    // text + URL + title are joined into a single idea string and forwarded
    // to Canon Weaver as the initial capture.
    const title = params.get('title');
    const text = params.get('text');
    const url = params.get('url');
    const shared = [title, text, url].filter(Boolean).join('\n').trim();
    if (shared) {
      out.sharedText = shared;
      out.capture = true;
      if (!out.tab) out.tab = 'write';
    }
  } catch (_e) { /* noop */ }
  return out;
}

const api = { SHORTCUTS, SHORTCUT_CATEGORIES, LEGACY_TAB_TO_LOOMWRIGHT, resolveTab, parseDeepLink };
export default api;

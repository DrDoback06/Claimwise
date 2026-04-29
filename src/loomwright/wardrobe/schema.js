/**
 * Wardrobe schema — slot taxonomy, state presets, field defaults.
 * Ported from redesign/inventory/data.jsx and extended to cover the existing
 * Claimwise equipment keys so nothing breaks when reading legacy actors.
 */

// --- Slot taxonomy ---
// Each slot has:
//   id       — stable key used in actor.inventoryTrack[ch][slotId] and item.track[ch].slotId
//   label    — human label (can be renamed per-actor via customSlots)
//   group    — worn | pack | secret | subtle | custom — drives visibility layers
//   pos      — [x%, y%] on the paper-doll canvas
//   icon     — short glyph shown when slot is empty
//   legacyKey — (optional) maps to existing actor.equipment key for back-compat
export const SLOT_DEFS = [
  { id: 'head',   label: 'Head',                group: 'worn',   pos: [50, 8],  icon: '\u2312', legacyKey: 'helm' },
  { id: 'neck',   label: 'Neck / amulet',       group: 'worn',   pos: [50, 18], icon: '\u25CC', legacyKey: 'amulet' },
  { id: 'torso',  label: 'Torso / armour',      group: 'worn',   pos: [50, 32], icon: '\u25A2', legacyKey: 'armour' },
  { id: 'cloak',  label: 'Cloak / outer',       group: 'worn',   pos: [50, 44], icon: '\u25BD', legacyKey: 'cape' },
  { id: 'hands',  label: 'Hands / gloves',      group: 'worn',   pos: [18, 48], icon: '\u270B', legacyKey: 'gloves' },
  { id: 'belt',   label: 'Belt',                group: 'worn',   pos: [50, 52], icon: '\u2501', legacyKey: 'belt' },
  { id: 'main',   label: 'Main weapon',         group: 'worn',   pos: [82, 42], icon: '\u2694', legacyKey: 'rightHand' },
  { id: 'off',    label: 'Off-hand / shield',   group: 'worn',   pos: [18, 64], icon: '\u25D0', legacyKey: 'leftHand' },
  { id: 'ring1',  label: 'Ring (left)',         group: 'worn',   pos: [26, 56], icon: '\u25CB' },
  { id: 'ring2',  label: 'Ring (right)',        group: 'worn',   pos: [74, 56], icon: '\u25CB' },
  { id: 'legs',   label: 'Legs',                group: 'worn',   pos: [50, 70], icon: '\u2225' },
  { id: 'feet',   label: 'Feet',                group: 'worn',   pos: [50, 92], icon: '\u2294', legacyKey: 'boots' },
  { id: 'worn',   label: 'Worn-but-not-seen',   group: 'subtle', pos: [50, 38], icon: '\u25CD' },
  { id: 'pack',   label: 'Stowed / pack',       group: 'pack',   pos: [82, 70], icon: '\u2B1A' },
  { id: 'hidden', label: 'Hidden / secret',     group: 'secret', pos: [18, 30], icon: '\u2298' },
  { id: 'charm',  label: 'Charms / trinkets',   group: 'pack',   pos: [82, 24], icon: '\u2726' },
];

// --- Slot groups for the visibility toggle ---
export const SLOT_GROUPS = [
  { id: 'worn',   label: 'Visible',        defaultVisible: true,  description: 'What the character is wearing openly' },
  { id: 'pack',   label: 'Pack',           defaultVisible: true,  description: 'Stowed gear, charms, trinkets' },
  { id: 'subtle', label: 'Worn-not-seen',  defaultVisible: false, description: 'Carried on body but not visible' },
  { id: 'secret', label: 'Hidden',         defaultVisible: false, description: 'Secret or concealed items' },
  { id: 'custom', label: 'Custom',         defaultVisible: true,  description: 'User-defined slots' },
];

// --- Item state palette ---
// `tone` maps onto theme tokens (t.good/t.warn/t.bad/t.subtle/t.accent)
export const STATE_PRESETS = [
  { id: 'pristine', label: 'Pristine',  tone: 'good'    },
  { id: 'worn',     label: 'Worn',      tone: 'neutral' },
  { id: 'damaged',  label: 'Damaged',   tone: 'warn'    },
  { id: 'broken',   label: 'Broken',    tone: 'bad'     },
  { id: 'lost',     label: 'Lost',      tone: 'bad'     },
  { id: 'hidden',   label: 'Hidden',    tone: 'subtle'  },
  { id: 'gifted',   label: 'Gifted',    tone: 'accent'  },
  { id: 'stolen',   label: 'Stolen',    tone: 'bad'     },
  { id: 'returned', label: 'Returned',  tone: 'good'    },
  { id: 'concealed',label: 'Concealed', tone: 'subtle'  },
];

// --- Item categories (loosely period-aware; hint to AI generator only) ---
export const ITEM_CATEGORIES = [
  'weapon', 'armour', 'garment', 'tool', 'relic', 'document',
  'token', 'charm', 'book', 'potion', 'key', 'mount', 'other',
];

// --- Default actor shape extensions ---
export function defaultWardrobeFields() {
  return {
    customSlots: [],
    inventoryTrack: {},
    profile: {
      silhouette: 'neutral',
      period: 'medieval-fantasy',
      appearance: '',
    },
  };
}

// --- Default item shape extensions ---
export function defaultItemWardrobeFields() {
  return {
    origin: null,
    value: '',
    properties: '',
    symbolism: '',
    knownTo: [],
    customStates: [],
    track: {},
    flag: '',
  };
}

/** Non-mutating: returns actor with wardrobe defaults merged in. */
export function ensureWardrobeShape(actor) {
  if (!actor) return actor;
  const d = defaultWardrobeFields();
  return {
    ...actor,
    customSlots: actor.customSlots ?? d.customSlots,
    inventoryTrack: actor.inventoryTrack ?? d.inventoryTrack,
    profile: { ...d.profile, ...(actor.profile || {}) },
  };
}

/** Non-mutating: returns item with wardrobe defaults merged in. */
export function ensureItemWardrobeShape(item) {
  if (!item) return item;
  const d = defaultItemWardrobeFields();
  return {
    ...item,
    origin: item.origin ?? d.origin,
    value: item.value ?? d.value,
    properties: item.properties ?? d.properties,
    symbolism: item.symbolism ?? d.symbolism,
    knownTo: Array.isArray(item.knownTo) ? item.knownTo : d.knownTo,
    customStates: Array.isArray(item.customStates) ? item.customStates : d.customStates,
    track: item.track ?? d.track,
    flag: item.flag ?? d.flag,
  };
}

/** Get the slot definitions available for a given actor (built-ins + customs). */
export function getActorSlots(actor) {
  const a = ensureWardrobeShape(actor);
  return [...SLOT_DEFS, ...(a.customSlots || [])];
}

/** Lookup a slot by id, including customs. */
export function findSlot(actor, slotId) {
  return getActorSlots(actor).find((s) => s.id === slotId) || null;
}

export default SLOT_DEFS;

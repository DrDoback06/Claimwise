// Loomwright — affix bank (CODE-INSIGHT §6 / Diablo II depth).
// Hand-authored catalogue of prefixes and suffixes the items master can roll.
// Mods are stat deltas in the same shape as Item.statMods.

export const PREFIXES = [
  { id: 'pre_keen',      name: 'Keen',       mods: { DEX: 2 },                            tier: 1 },
  { id: 'pre_rugged',    name: 'Rugged',     mods: { VIT: 3 },                            tier: 1 },
  { id: 'pre_swift',     name: 'Swift',      mods: { DEX: 3 },                            tier: 1 },
  { id: 'pre_sturdy',    name: 'Sturdy',     mods: { VIT: 4 },                            tier: 2 },
  { id: 'pre_glacial',   name: 'Glacial',    mods: { coldDmg: 5, INT: 1 },                tier: 2, themed: 'cold' },
  { id: 'pre_blazing',   name: 'Blazing',    mods: { fireDmg: 5, STR: 1 },                tier: 2, themed: 'fire' },
  { id: 'pre_mossy',     name: 'Mossy',      mods: { earthDmg: 4, VIT: 1 },               tier: 2, themed: 'nature' },
  { id: 'pre_savage',    name: 'Savage',     mods: { STR: 5 },                            tier: 3 },
  { id: 'pre_arcane',    name: 'Arcane',     mods: { INT: 4, mana: 10 },                  tier: 3, themed: 'magic' },
  { id: 'pre_mythic',    name: 'Mythic',     mods: { allStats: 3 },                       tier: 4 },
  { id: 'pre_grim',      name: 'Grim',       mods: { STR: 2, fearResist: 5 },             tier: 2 },
  { id: 'pre_council',   name: 'Council-Sealed', mods: { CHA: 3, lore: 2 },               tier: 3, themed: 'bureaucratic' },
  { id: 'pre_warlock',   name: "Warlock's",  mods: { INT: 4, shadowDmg: 6 },              tier: 3, themed: 'shadow' },
  { id: 'pre_storm',     name: 'Storm-Touched', mods: { lightningDmg: 8, DEX: 2 },        tier: 3, themed: 'storm' },
  { id: 'pre_shrouded',  name: 'Shrouded',   mods: { stealth: 5, DEX: 2 },                tier: 2 },
  { id: 'pre_blessed',   name: 'Blessed',    mods: { holyDmg: 6, RES: 2 },                tier: 3, themed: 'holy' },
  { id: 'pre_wretched',  name: 'Wretched',   mods: { poison: 5, INT: 1, CHA: -1 },        tier: 2, themed: 'poison' },
  { id: 'pre_indigo',    name: 'Indigo',     mods: { INT: 6, mana: 20 },                  tier: 4, themed: 'magic' },
  { id: 'pre_vorpal',    name: 'Vorpal',     mods: { critChance: 8, DEX: 2 },             tier: 3 },
  { id: 'pre_hollow',    name: 'Hollow',     mods: { weight: -2, DEX: 1 },                tier: 1 },
];

export const SUFFIXES = [
  { id: 'suf_wolf',      name: 'of the Wolf',     mods: { VIT: 3 },                       tier: 1 },
  { id: 'suf_fox',       name: 'of the Fox',      mods: { DEX: 3 },                       tier: 1 },
  { id: 'suf_owl',       name: 'of the Owl',      mods: { INT: 3 },                       tier: 1 },
  { id: 'suf_bear',      name: 'of the Bear',     mods: { STR: 3, VIT: 1 },               tier: 2 },
  { id: 'suf_river',     name: 'of the River',    mods: { coldDmg: 3, mana: 5 },          tier: 2, themed: 'water' },
  { id: 'suf_mountain',  name: 'of the Mountain', mods: { VIT: 5, weight: 2 },            tier: 2 },
  { id: 'suf_road',      name: 'of the Road',     mods: { DEX: 2, lore: 2 },              tier: 1 },
  { id: 'suf_grave',     name: 'of the Grave',    mods: { shadowDmg: 4, fearResist: 3 },  tier: 2, themed: 'shadow' },
  { id: 'suf_dawn',      name: 'of Dawn',         mods: { holyDmg: 4, CHA: 1 },           tier: 2, themed: 'holy' },
  { id: 'suf_dusk',      name: 'of Dusk',         mods: { stealth: 4, INT: 2 },           tier: 2 },
  { id: 'suf_song',      name: 'of Song',         mods: { CHA: 5, mana: 8 },              tier: 3 },
  { id: 'suf_oath',      name: 'of the Oath',     mods: { RES: 4 },                       tier: 2 },
  { id: 'suf_three',     name: 'of the Three',    mods: { allStats: 2 },                  tier: 3 },
  { id: 'suf_hollow',    name: 'of the Hollow',   mods: { weight: -3, stealth: 2 },       tier: 1 },
  { id: 'suf_marsh',     name: 'of the Marsh',    mods: { poison: 3, INT: 1 },            tier: 1, themed: 'poison' },
  { id: 'suf_crown',     name: 'of the Crown',    mods: { CHA: 4, lore: 3 },              tier: 3, themed: 'bureaucratic' },
  { id: 'suf_wardens',   name: 'of the Wardens',  mods: { RES: 5, fearResist: 5 },        tier: 3 },
  { id: 'suf_ember',     name: 'of Ember',        mods: { fireDmg: 5 },                   tier: 2, themed: 'fire' },
  { id: 'suf_eternity',  name: 'of Eternity',     mods: { allStats: 4 },                  tier: 4 },
  { id: 'suf_stranger',  name: 'of the Stranger', mods: { stealth: 3, lore: 2 },          tier: 2 },
];

export const ALL_AFFIXES = [
  ...PREFIXES.map(a => ({ ...a, kind: 'prefix' })),
  ...SUFFIXES.map(a => ({ ...a, kind: 'suffix' })),
];

export function affixById(id) { return ALL_AFFIXES.find(a => a.id === id) || null; }

export function rollAffixes({ count = 2, tier = 2, theme = null } = {}) {
  const pool = ALL_AFFIXES.filter(a => a.tier <= tier && (!theme || a.themed === theme || !a.themed));
  const picks = [];
  const used = new Set();
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const a = pool[idx];
    if (used.has(a.id)) continue;
    used.add(a.id);
    picks.push(a);
  }
  return picks;
}

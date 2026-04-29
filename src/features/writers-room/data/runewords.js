// Loomwright — runewords. Each rune is a special socket-fillable item; when
// the right rune sequence is socketed (in order, all sockets filled) the
// item gains the runeword's bonuses. Runes themselves are gems with the
// `kind: 'rune'` flavour.

export const RUNES = [
  { id: 'rune_el',   label: 'El',   mods: { lightningDmg: 1, mana: 5 } },
  { id: 'rune_eld',  label: 'Eld',  mods: { undeadDmg: 5 } },
  { id: 'rune_tir',  label: 'Tir',  mods: { mana: 8 } },
  { id: 'rune_nef',  label: 'Nef',  mods: { knockback: 3 } },
  { id: 'rune_ith',  label: 'Ith',  mods: { critChance: 4 } },
  { id: 'rune_tal',  label: 'Tal',  mods: { poison: 3 } },
  { id: 'rune_ral',  label: 'Ral',  mods: { fireDmg: 4 } },
  { id: 'rune_ort',  label: 'Ort',  mods: { lightningDmg: 4 } },
  { id: 'rune_thul', label: 'Thul', mods: { coldDmg: 4 } },
  { id: 'rune_amn',  label: 'Amn',  mods: { lifeDrain: 4 } },
  { id: 'rune_sol',  label: 'Sol',  mods: { STR: 2 } },
  { id: 'rune_shael', label: 'Shael', mods: { DEX: 2 } },
  { id: 'rune_dol',  label: 'Dol',  mods: { fearResist: 5 } },
  { id: 'rune_io',   label: 'Io',   mods: { VIT: 4 } },
  { id: 'rune_lum',  label: 'Lum',  mods: { INT: 4 } },
  { id: 'rune_ko',   label: 'Ko',   mods: { DEX: 4 } },
  { id: 'rune_zod',  label: 'Zod',  mods: { allStats: 6, weight: -3 } },
];

export function runeById(id) { return RUNES.find(r => r.id === id) || null; }

// Each runeword has a name, sequence of rune ids, base-type filter, and
// bonus mods that stack on top of the individual rune mods.
export const RUNEWORDS = [
  {
    id: 'rw_stealth',
    name: 'Stealth',
    sequence: ['rune_tal', 'rune_eth'],
    bonus: { stealth: 12, DEX: 4 },
    fits: ['armor'],
    lore: 'A whispered word taught to road-wardens; the wearer leaves no scent.',
  },
  {
    id: 'rw_lore',
    name: 'Lore',
    sequence: ['rune_ort', 'rune_sol'],
    bonus: { INT: 6, lore: 6 },
    fits: ['helm'],
    lore: 'Worn by archivists who must read both ledger and ledger-keeper.',
  },
  {
    id: 'rw_steel',
    name: 'Steel',
    sequence: ['rune_tir', 'rune_el'],
    bonus: { STR: 4, weight: 2, critChance: 6 },
    fits: ['weapon'],
    lore: 'For the council\'s own marshals — no soul, all edge.',
  },
  {
    id: 'rw_strength',
    name: 'Strength',
    sequence: ['rune_amn', 'rune_tir'],
    bonus: { STR: 8, lifeDrain: 4 },
    fits: ['weapon'],
    lore: 'Each strike feeds the wielder. The price is hunger.',
  },
  {
    id: 'rw_zephyr',
    name: 'Zephyr',
    sequence: ['rune_ort', 'rune_eth'],
    bonus: { lightningDmg: 8, DEX: 4 },
    fits: ['weapon', 'shield'],
    lore: 'A southerly word — fast, restless, fond of weather.',
  },
  {
    id: 'rw_silence',
    name: 'Silence',
    sequence: ['rune_dol', 'rune_eld', 'rune_hel', 'rune_ist', 'rune_tir', 'rune_vex'],
    bonus: { allStats: 10, fearResist: 30, mana: 30 },
    fits: ['weapon'],
    lore: 'Holds even the council\'s clerks at bay.',
  },
  {
    id: 'rw_strength_minor',
    name: 'Bone',
    sequence: ['rune_sol', 'rune_um', 'rune_um'],
    bonus: { VIT: 6, STR: 2 },
    fits: ['armor'],
    lore: 'Bone-thread armour, made for the season the council called "lean".',
  },
];

export function matchRuneword(socketSequence) {
  if (!socketSequence?.length) return null;
  const ids = socketSequence.map(s => s?.runeId).filter(Boolean);
  for (const rw of RUNEWORDS) {
    if (rw.sequence.length !== ids.length) continue;
    if (rw.sequence.every((r, i) => r === ids[i])) return rw;
  }
  return null;
}

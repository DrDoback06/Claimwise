// Loomwright — set definitions. N-piece bonuses fire when the equipping
// character has that many items from the set equipped at once.

export const SETS = [
  {
    id: 'set_wardens',
    name: "The Wardens' Vigil",
    pieces: ['Warden Mantle', "Warden's Whistle", 'Warden Boots', 'Warden Sash'],
    bonuses: {
      2: { fearResist: 8, RES: 2 },
      3: { fearResist: 16, RES: 4, allStats: 1 },
      4: { fearResist: 24, RES: 8, allStats: 3, stealth: 6 },
    },
    lore: 'Issued to the long-shift wardens of the Hollow Marches.',
  },
  {
    id: 'set_council',
    name: "Council Regalia",
    pieces: ['Council Seal', 'Council Mantle', 'Council Crown', 'Quill of Authority'],
    bonuses: {
      2: { CHA: 4, lore: 4 },
      3: { CHA: 8, lore: 8, mana: 15 },
      4: { CHA: 16, lore: 16, mana: 30, allStats: 4 },
    },
    lore: 'The wardrobe of a fully credentialed councillor — paperwork weaponised.',
  },
  {
    id: 'set_riverling',
    name: 'Riverling Garb',
    pieces: ['Riverling Cloak', 'Riverling Boots', 'Riverling Charm'],
    bonuses: {
      2: { coldDmg: 6, mana: 8 },
      3: { coldDmg: 12, mana: 16, INT: 4 },
    },
    lore: 'Worn by the messenger-children who run the marsh-roads.',
  },
  {
    id: 'set_grim_three',
    name: 'The Grim Three',
    pieces: ["Grim Vow", 'Grim Mantle', 'Grim Crown'],
    bonuses: {
      2: { shadowDmg: 8, fearResist: 8 },
      3: { shadowDmg: 16, fearResist: 16, allStats: 4 },
    },
    lore: 'A trio of relics that should never be reunited. They are.',
  },
];

export function setById(id) { return SETS.find(s => s.id === id) || null; }

// Loomwright — gem catalogue. Diablo II-shaped: each colour has 5 quality
// grades (chipped → flawed → standard → flawless → perfect) with escalating
// stat deltas. Sockets accept gems; the equipped item picks up the deltas.

export const GEM_GRADES = ['chipped', 'flawed', 'standard', 'flawless', 'perfect'];

const GRADE_MULT = { chipped: 1, flawed: 2, standard: 3, flawless: 5, perfect: 8 };

const COLOURS = [
  { id: 'ruby',      label: 'Ruby',      stat: 'fireDmg',  fluffStat: 'STR' },
  { id: 'sapphire',  label: 'Sapphire',  stat: 'coldDmg',  fluffStat: 'INT' },
  { id: 'topaz',     label: 'Topaz',     stat: 'lightningDmg', fluffStat: 'DEX' },
  { id: 'emerald',   label: 'Emerald',   stat: 'poison',   fluffStat: 'VIT' },
  { id: 'amethyst',  label: 'Amethyst',  stat: 'shadowDmg', fluffStat: 'CHA' },
  { id: 'diamond',   label: 'Diamond',   stat: 'holyDmg',  fluffStat: 'RES' },
  { id: 'skull',     label: 'Skull',     stat: 'lifeDrain', fluffStat: 'STR' },
];

function buildGem(colour, grade) {
  const id = `gem_${colour.id}_${grade}`;
  const mult = GRADE_MULT[grade];
  return {
    id,
    name: `${grade[0].toUpperCase() + grade.slice(1)} ${colour.label}`,
    colour: colour.id,
    grade,
    mods: {
      [colour.stat]: 2 * mult,
      [colour.fluffStat]: Math.max(1, Math.floor(mult / 2)),
    },
  };
}

export const ALL_GEMS = [];
for (const c of COLOURS) for (const g of GEM_GRADES) ALL_GEMS.push(buildGem(c, g));

export function gemById(id) { return ALL_GEMS.find(g => g.id === id) || null; }

// Gem-quality upgrade chain (combine 3-of-grade-X to make 1 grade-X+1).
export function upgradeOf(gem) {
  if (!gem) return null;
  const idx = GEM_GRADES.indexOf(gem.grade);
  if (idx < 0 || idx >= GEM_GRADES.length - 1) return null;
  return ALL_GEMS.find(g => g.colour === gem.colour && g.grade === GEM_GRADES[idx + 1]);
}

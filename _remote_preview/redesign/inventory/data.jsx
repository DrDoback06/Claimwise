// data.jsx — Wardrobe / Inventory data: characters, slot taxonomy, items with chapter timelines.

const W_CHARS = [
  { id:'mira',    name:'Mira Vale',         role:'lead',     period:'medieval-fantasy',
    color:'oklch(78% 0.13 78)',  silhouette:'female-young', book:'Book II' },
  { id:'edrick',  name:'Edrick of Thorn',   role:'lead',     period:'medieval-fantasy',
    color:'oklch(72% 0.10 200)', silhouette:'male-tall',   book:'Book II' },
  { id:'tobyn',   name:'Old Tobyn',         role:'support',  period:'medieval-fantasy',
    color:'oklch(72% 0.13 145)', silhouette:'male-old',    book:'Book II' },
  { id:'rook',    name:'Rook',              role:'antagonist', period:'medieval-fantasy',
    color:'oklch(65% 0.18 25)',  silhouette:'male-lean',   book:'Book II' },
];

// Slot taxonomy — period-aware presets. Each slot has a position on the doll (x%, y%) for "anatomical" layout.
const SLOT_DEFS = [
  { id:'head',     label:'Head',                  group:'worn',   pos:[50, 8],  ico:'⌒' },
  { id:'neck',     label:'Neck / amulet',         group:'worn',   pos:[50, 18], ico:'◌' },
  { id:'torso',    label:'Torso / armour',        group:'worn',   pos:[50, 32], ico:'▢' },
  { id:'cloak',    label:'Cloak / outer',         group:'worn',   pos:[50, 44], ico:'▽' },
  { id:'hands',    label:'Hands / gloves',        group:'worn',   pos:[18, 48], ico:'✋' },
  { id:'belt',     label:'Belt',                  group:'worn',   pos:[50, 52], ico:'━' },
  { id:'main',     label:'Main weapon',           group:'worn',   pos:[82, 42], ico:'⚔' },
  { id:'off',      label:'Off-hand / shield',     group:'worn',   pos:[18, 64], ico:'◐' },
  { id:'ring1',    label:'Ring (left)',           group:'worn',   pos:[26, 56], ico:'○' },
  { id:'ring2',    label:'Ring (right)',          group:'worn',   pos:[74, 56], ico:'○' },
  { id:'legs',     label:'Legs',                  group:'worn',   pos:[50, 70], ico:'∥' },
  { id:'feet',     label:'Feet',                  group:'worn',   pos:[50, 92], ico:'⊔' },
  { id:'worn',     label:'Worn-but-not-seen',     group:'subtle', pos:[50, 38], ico:'◍' },
  { id:'pack',     label:'Stowed / pack',         group:'pack',   pos:[82, 70], ico:'⬚' },
  { id:'hidden',   label:'Hidden / secret',       group:'secret', pos:[18, 30], ico:'⊘' },
  { id:'charm',    label:'Charms / trinkets',     group:'pack',   pos:[82, 24], ico:'✦' },
];

// Custom state palette (per item, user can add more). Severity drives color.
const STATE_PRESETS = [
  { id:'pristine', label:'Pristine',  tone:'good' },
  { id:'worn',     label:'Worn',      tone:'neutral' },
  { id:'damaged',  label:'Damaged',   tone:'warn' },
  { id:'broken',   label:'Broken',    tone:'bad' },
  { id:'lost',     label:'Lost',      tone:'bad' },
  { id:'hidden',   label:'Hidden',    tone:'subtle' },
  { id:'gifted',   label:'Gifted',    tone:'accent' },
  { id:'stolen',   label:'Stolen',    tone:'bad' },
  { id:'returned', label:'Returned',  tone:'good' },
  { id:'concealed',label:'Concealed', tone:'subtle' },
];

const W_CHAPTERS = Array.from({length:18},(_,i)=>({
  n:i+1,
  title:[
    'The mantel','Grey-yew','The road north','Inn at Wether','Sea-ring',
    'The lost bow','Letter under tile','Coin','Partial prophecy','Removed',
    'Without explanation','In her pocket','The reveal','Father\'s sword',
    'On the march','At the wall','Drawn','The parley'
  ][i] || `Chapter ${i+1}`,
}));

// Items. Each item has a `track`: chapter -> {char, slot, state, note}.
// Missing chapters mean "carried over from previous record". `null` slot/char = not present in story.
const W_ITEMS = [
  {
    id:'sword', name:"Father's sword", category:'weapon', icon:'⚔',
    description:'A worn longsword with a horn pommel. Mira\'s father carried it through the Border Wars.',
    origin:1, value:'Heirloom · priceless to Mira',
    properties:'Well-balanced. Notched edge. Bears the Vale sigil at the cross-guard.',
    symbolism:'Patrilineal duty · the weight of taking up arms',
    knownTo:['mira','tobyn','edrick'],
    track:{
      1:{char:'mira',slot:'worn',state:'pristine',note:'Hangs on the mantel — owned by household, not yet carried.'},
      14:{char:'mira',slot:'main',state:'pristine',note:'"She seized her father\'s sword from the mantelpiece."'},
      15:{char:'mira',slot:'main',state:'pristine'},
      16:{char:'mira',slot:'main',state:'worn'},
      17:{char:'mira',slot:'main',state:'worn',note:'Drawn at the wall.'},
      18:{char:'mira',slot:'main',state:'broken',note:'Broken at the parley — snaps at the cross-guard.'},
    },
  },
  {
    id:'bow', name:'Grey-yew bow', category:'weapon', icon:'⤜',
    description:'Short hunter\'s bow of weathered yew. A gift from Tobyn for her sixteenth nameday.',
    origin:2, value:'Personal · sentimental',
    properties:'Light draw. Better for hare than for war.',
    symbolism:'Childhood agency · the gift she outgrows',
    knownTo:['mira','tobyn'],
    flag:'⚠ never resolved — left at the inn, never retrieved.',
    track:{
      2:{char:'mira',slot:'main',state:'pristine',note:'Tobyn places it in her hands.'},
      3:{char:'mira',slot:'pack',state:'pristine'},
      4:{char:'mira',slot:'pack',state:'pristine'},
      5:{char:'mira',slot:'main',state:'worn'},
      6:{char:null,slot:null,state:'lost',note:'Left propped by the hearth at the Inn at Wether. Mira never retrieves it. ⚠ never resolved.'},
    },
  },
  {
    id:'horn', name:'The old horn', category:'relic', icon:'⌒',
    description:'Spiral horn banded in tarnished silver. Older than the keep itself.',
    origin:1, value:'Sacred · bound to the house',
    properties:'When sounded, every dog in the valley answers.',
    symbolism:'Ancestral summons · the call to the old oath',
    knownTo:['tobyn','mira'],
    track:{
      1:{char:'tobyn',slot:'worn',state:'pristine',note:'Wall-mounted in the hall.'},
      14:{char:'tobyn',slot:'pack',state:'pristine',note:'Sounded at the muster.'},
      14.5:{char:'tobyn',slot:'worn',state:'pristine',note:'Returned to the wall.'},
      17:{char:'tobyn',slot:'hidden',state:'concealed',note:'Tobyn hides it before the parley.'},
      18:{char:'tobyn',slot:'hidden',state:'concealed'},
    },
  },
  {
    id:'coin', name:"Rook's coin", category:'token', icon:'◉',
    description:'A blackened coin of foreign mint. One side wholly smooth.',
    origin:6, value:'Negligible · symbolic',
    properties:'Always cold to the touch.',
    symbolism:'Debt unspoken · the gift that obliges',
    knownTo:['rook','mira'],
    track:{
      6:{char:'rook',slot:'hidden',state:'concealed',note:'Shown briefly to Mira across the fire.'},
      8:{char:'rook',slot:'hidden',state:'concealed'},
      11:{char:'mira',slot:'hidden',state:'concealed',note:'A gift without explanation.'},
      12:{char:'mira',slot:'hidden',state:'concealed',note:'Kept in her pocket.'},
      13:{char:'mira',slot:'hidden',state:'concealed'},
      14:{char:'mira',slot:'hidden',state:'concealed'},
    },
  },
  {
    id:'letter', name:"Father's letter", category:'document', icon:'✉',
    description:'A folded sheet of brittle parchment, sealed with green wax.',
    origin:4, value:'Plot-critical · unread',
    properties:'Ink has faded to rust. Two creases sharp from being long-hidden.',
    symbolism:'The truth withheld · what the daughter is denied',
    knownTo:['tobyn'],
    flag:'⚠ Mira never reads it — open dramatic question.',
    track:{
      4:{char:'tobyn',slot:'hidden',state:'concealed',note:'Tobyn writes it.'},
      7:{char:'tobyn',slot:'hidden',state:'concealed',note:'Hidden under a tile in the study.'},
      13:{char:'tobyn',slot:'hidden',state:'concealed',note:'Found again.'},
      14:{char:null,slot:null,state:'lost',note:'Tobyn burns the letter. Mira never reads it.'},
    },
  },
  {
    id:'ring', name:'The sea-grey ring', category:'token', icon:'○',
    description:'A plain band of seal-grey metal. Warm against the skin.',
    origin:5, value:'Personal · betrothal-adjacent',
    properties:'Sized for a thumb, not a finger.',
    symbolism:'Offered love · refused acceptance',
    knownTo:['edrick','mira'],
    track:{
      5:{char:'edrick',slot:'ring1',state:'pristine'},
      6:{char:'edrick',slot:'ring1',state:'pristine'},
      7:{char:'edrick',slot:'ring1',state:'pristine'},
      8:{char:'edrick',slot:'ring1',state:'pristine'},
      10:{char:'edrick',slot:'pack',state:'pristine',note:'Removed when he kneels.'},
      14:{char:'edrick',slot:'pack',state:'pristine',note:'Offered to Mira. She does not take it.'},
    },
  },
  {
    id:'cloak', name:'Winter cloak', category:'garment', icon:'▽',
    description:'Heavy oiled wool, the colour of pine bark. Hood lined in fox.',
    origin:3, value:'Practical',
    properties:'Sheds rain. Shows blood.',
    symbolism:'Endurance · the body protected',
    knownTo:['mira'],
    track:{
      3:{char:'mira',slot:'cloak',state:'pristine'},
      4:{char:'mira',slot:'cloak',state:'pristine'},
      11:{char:'mira',slot:'cloak',state:'damaged',note:'Torn climbing the rocks above Wether.'},
      12:{char:'mira',slot:'cloak',state:'worn',note:'Mended badly by firelight.'},
      14:{char:'mira',slot:'cloak',state:'worn'},
      18:{char:'mira',slot:'cloak',state:'damaged'},
    },
  },
  {
    id:'boots', name:'Riding boots', category:'garment', icon:'⊔',
    description:'Tall boots, hand-me-down from her father, soled twice over.',
    origin:1, value:'Practical',
    properties:'A size too large.',
    symbolism:'Walking in his step',
    knownTo:['mira'],
    track:{
      1:{char:'mira',slot:'feet',state:'worn'},
      6:{char:'mira',slot:'feet',state:'damaged',note:'Soaked through at the river.'},
      12:{char:'mira',slot:'feet',state:'worn'},
      18:{char:'mira',slot:'feet',state:'worn'},
    },
  },
  {
    id:'amulet', name:'Tobyn\'s amulet', category:'relic', icon:'◌',
    description:'A pewter disc strung on hair-cord. The face shows a tree split by lightning.',
    origin:1, value:'Sacred · personal',
    properties:'Tobyn never removes it.',
    symbolism:'The old faith Mira no longer keeps',
    knownTo:['tobyn'],
    track:{
      1:{char:'tobyn',slot:'neck',state:'pristine'},
      14:{char:'tobyn',slot:'neck',state:'pristine'},
      18:{char:'tobyn',slot:'neck',state:'pristine'},
    },
  },
  {
    id:'sigil-cloak', name:'Edrick\'s grey cloak', category:'garment', icon:'▽',
    description:'A lord\'s riding cloak in undyed wool, clasped with a silver thorn.',
    origin:5, value:'Costly',
    properties:'Marks him to anyone who knows the houses.',
    symbolism:'Rank he tries to set aside',
    knownTo:['edrick','mira','tobyn'],
    track:{
      5:{char:'edrick',slot:'cloak',state:'pristine'},
      8:{char:'edrick',slot:'cloak',state:'pristine'},
      10:{char:'edrick',slot:'cloak',state:'pristine'},
      14:{char:'edrick',slot:'cloak',state:'worn'},
    },
  },
];

// Helper — for a given chapter, resolve every item's "as-of" record (look back to most recent track entry).
function resolveAsOf(item, ch){
  const keys = Object.keys(item.track).map(Number).filter(k=>k<=ch).sort((a,b)=>a-b);
  if (!keys.length) return null;
  const k = keys[keys.length-1];
  return { ...item.track[k], _atCh:k };
}

window.W_CHARS = W_CHARS;
window.SLOT_DEFS = SLOT_DEFS;
window.STATE_PRESETS = STATE_PRESETS;
window.W_CHAPTERS = W_CHAPTERS;
window.W_ITEMS = W_ITEMS;
window.resolveAsOf = resolveAsOf;

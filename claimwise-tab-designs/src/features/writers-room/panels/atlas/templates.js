// Loomwright — place templates (plan §11).

export const PLACE_TEMPLATES = [
  { kind: 'city',       label: 'City',       icon: '◉', defaultRadius: 14, hasFloorplan: false, rooms: [] },
  { kind: 'village',    label: 'Village',    icon: '◎', defaultRadius: 10, hasFloorplan: false, rooms: [] },
  { kind: 'manor',      label: 'Manor',      icon: '⌂', defaultRadius: 8,  hasFloorplan: true,  rooms: ['Hall', 'Library', 'Kitchen', 'Bedroom'] },
  { kind: 'tavern',     label: 'Tavern',     icon: '🍷', defaultRadius: 7,  hasFloorplan: true,  rooms: ['Common room', 'Cellar', 'Upstairs'] },
  { kind: 'ship',       label: 'Ship',       icon: '⛵', defaultRadius: 6,  hasFloorplan: true,  rooms: ['Deck', 'Captain quarters', 'Hold'] },
  { kind: 'dungeon',    label: 'Dungeon',    icon: '◆', defaultRadius: 7,  hasFloorplan: true,  rooms: ['Entrance', 'Antechamber', 'Vault'] },
  { kind: 'wilderness', label: 'Wilderness', icon: '⌇', defaultRadius: 18, hasFloorplan: false, rooms: [] },
];

// Loomwright — radial spoke registries per context (plan §13).

export const RADIAL_CONTEXTS = {
  editor: [
    { id: 'atlas',   label: 'Atlas',   icon: 'map' },
    { id: 'cast',    label: 'Cast',    icon: 'users' },
    { id: 'voice',   label: 'Voice',   icon: 'volume' },
    { id: 'threads', label: 'Threads', icon: 'flag' },
    { id: 'weave',   label: 'Weave',   icon: 'sparkle' },
    { id: 'tangle',  label: 'Tangle',  icon: 'tangle' },
  ],
  atlas: [
    { id: 'newPlace',  label: 'New place',  icon: 'map', subRadial: 'placeTemplates' },
    { id: 'newRegion', label: 'New region', icon: 'compass' },
    { id: 'path',      label: 'Path',       icon: 'pen' },
    { id: 'pin',       label: 'Pin',        icon: 'flag' },
    { id: 'label',     label: 'Label',      icon: 'pen' },
    { id: 'dropHere',  label: 'Drop here',  icon: 'plus' },
    { id: 'measure',   label: 'Measure',    icon: 'compass' },
    { id: 'settings',  label: 'Settings',   icon: 'cog' },
  ],
  cast: [
    { id: 'edit',      label: 'Edit',         icon: 'pen' },
    { id: 'addRel',    label: '+ Relationship', icon: 'web' },
    { id: 'addItem',   label: '+ Item',       icon: 'bag' },
    { id: 'interview', label: 'Interview',    icon: 'chat' },
    { id: 'weave',     label: 'Weave',        icon: 'sparkle' },
    { id: 'delete',    label: 'Delete',       icon: 'x' },
  ],
  'place-pin': [
    { id: 'edit',         label: 'Edit',         icon: 'pen' },
    { id: 'move',         label: 'Move',         icon: 'compass' },
    { id: 'addFloorplan', label: '+ Floorplan',  icon: 'building' },
    { id: 'delete',       label: 'Delete',       icon: 'x' },
  ],
  'tangle-node': [
    { id: 'showInProse', label: 'Show in prose', icon: 'book' },
    { id: 'cluster',     label: 'Cluster mode',  icon: 'web' },
    { id: 'delete',      label: 'Delete',        icon: 'x' },
  ],
  placeTemplates: [
    { id: 'city',       label: 'City',       icon: 'building' },
    { id: 'village',    label: 'Village',    icon: 'building' },
    { id: 'manor',      label: 'Manor',      icon: 'building' },
    { id: 'tavern',     label: 'Tavern',     icon: 'building' },
    { id: 'ship',       label: 'Ship',       icon: 'compass' },
    { id: 'dungeon',    label: 'Dungeon',    icon: 'building' },
    { id: 'wilderness', label: 'Wilderness', icon: 'compass' },
  ],
};

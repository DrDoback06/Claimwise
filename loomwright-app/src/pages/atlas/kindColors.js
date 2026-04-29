/**
 * Typed-place color ramp. Loomwright-harmonised so the region map reads as
 * one with the rest of the app. Add more kinds by extending this map; the
 * region view picks them up automatically.
 */

export const KIND_COLORS = {
  castle:    '#c76b5a', // terracotta
  city:      '#7fb8c7', // teal
  town:      '#e2b552', // amber
  village:   '#c9ab6a', // muted amber
  ruin:      '#6a655a', // ink-3
  shrine:    '#d09c8e', // peach
  feature:   '#6fbf7c', // moss
  forest:    '#6fbf7c',
  mountain:  '#8d8479',
  river:     '#7fb8c7',
  road:      '#a8a18f',
  inn:       '#e2b552',
  battle:    '#c76b5a',
  landmark:  '#e2b552',
  region:    '#a8a18f',
  place:     '#a8a18f',
};

export const KIND_OPTIONS = Object.keys(KIND_COLORS);

export function kindColor(kind) {
  return KIND_COLORS[(kind || 'place').toLowerCase()] || KIND_COLORS.place;
}

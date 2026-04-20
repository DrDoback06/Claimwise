/**
 * Travel-time math for the Atlas.
 *
 * Distance in canvas-space is measured in the region's arbitrary units
 * (matching the SVG viewBox, default 96x72 where 1 unit = 1 mile per the
 * redesign). Terrain modifiers are looked up per place kind + per-path
 * midpoint environment (river/mountain/road) where known.
 *
 * Modes:
 *   foot:      miles/day base, heavy terrain slows
 *   horseback: faster on roads, slower off-track
 *   ship:      rivers + coastal only (fastest, but route-restricted)
 *
 * Returns { distance, days, hours, terrainNotes[] }.
 */

const BASE_SPEED_MPH = {
  foot: 3,
  horseback: 6,
  ship: 5,
};

// Daylight hours of travel before camp / inn
const DAY_HOURS = {
  foot: 8,
  horseback: 10,
  ship: 18,
};

const TERRAIN_MULTIPLIER = {
  road:     1.25,
  river:    1.0,   // for ship only; foot/horse gets 0.7
  mountain: 0.4,
  forest:   0.75,
  shore:    0.9,
  ruin:     0.8,
  open:     1.0,
};

export function pathTerrain(from, to, places = []) {
  if (!from || !to) return 'open';
  // Rough midpoint classification: if a place with kind 'river' or 'mountain'
  // lies within half-distance of either endpoint, call it out. Otherwise
  // assume open country.
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const near = places
    .filter((p) => p.id !== from.id && p.id !== to.id && typeof p.x === 'number' && typeof p.y === 'number')
    .map((p) => ({ p, d: Math.hypot(midX - p.x, midY - p.y) }))
    .sort((a, b) => a.d - b.d)[0];
  if (!near) return 'open';
  if (near.d < 8) {
    const k = (near.p.kind || '').toLowerCase();
    if (k === 'mountain' || k === 'river' || k === 'forest' || k === 'shore' || k === 'ruin' || k === 'road') return k;
  }
  return 'open';
}

export function estimateJourney(from, to, { mode = 'horseback', places = [] } = {}) {
  if (!from || !to) return null;
  if (typeof from.x !== 'number' || typeof to.x !== 'number') return null;
  const rawDistance = Math.hypot(to.x - from.x, to.y - from.y); // miles
  const terrain = pathTerrain(from, to, places);
  let multiplier = TERRAIN_MULTIPLIER[terrain] ?? 1;
  // Ship-only restrictions: can't travel overland
  if (mode === 'ship' && terrain !== 'river' && terrain !== 'shore') multiplier = 0.35;
  // Foot/horse penalty through river (fording / bridge) unless a road passes
  if ((mode === 'foot' || mode === 'horseback') && terrain === 'river') multiplier = 0.7;
  // Open-country horseback penalty (vs road)
  if (mode === 'horseback' && terrain === 'open') multiplier = 0.85;

  const speed = BASE_SPEED_MPH[mode] * multiplier;
  const totalHours = rawDistance / speed;
  const days = Math.floor(totalHours / DAY_HOURS[mode]);
  const hours = Math.round(totalHours % DAY_HOURS[mode]);

  const terrainNotes = [];
  if (terrain !== 'open') terrainNotes.push(`${terrain} terrain (x${multiplier.toFixed(2)})`);
  if (mode === 'ship' && terrain !== 'river' && terrain !== 'shore') terrainNotes.push('no navigable water');

  return {
    distance: Math.round(rawDistance * 10) / 10,
    mode,
    totalHours: Math.round(totalHours * 10) / 10,
    days,
    hours,
    speed,
    terrain,
    terrainNotes,
  };
}

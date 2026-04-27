// Loomwright — Atlas spatial layout helpers.
//
// When the cartographer specialist proposes a region with N places, we
// don't trust the AI's coordinates (it tends to dump everything at the
// origin or at the same point). These pure functions take a polygon and
// a place count and return sensible (x, y) coordinates inside the poly.
//
// Two strategies:
//   • ring: place N points on a circle inscribed within the polygon's
//     bounding box, centred on the centroid. Reads well for clusters of
//     a kingdom's named settlements.
//   • grid: lay out a √N × √N grid in the bounding box, rejecting points
//     that fall outside the polygon (point-in-polygon test). Better for
//     square / rectangular regions with many points.

export function centroid(poly) {
  if (!Array.isArray(poly) || poly.length === 0) return [0, 0];
  let cx = 0, cy = 0;
  for (const [x, y] of poly) { cx += x; cy += y; }
  return [cx / poly.length, cy / poly.length];
}

export function bbox(poly) {
  if (!Array.isArray(poly) || poly.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

export function pointInPolygon(point, poly) {
  if (!Array.isArray(poly) || poly.length < 3) return false;
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function layoutOnRing(poly, count) {
  if (count <= 0) return [];
  const [cx, cy] = centroid(poly);
  const { w, h } = bbox(poly);
  const r = Math.max(40, Math.min(w, h) * 0.32);
  const out = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2; // start at top
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    out.push({ x, y });
  }
  return out;
}

export function layoutOnGrid(poly, count) {
  if (count <= 0) return [];
  const { minX, minY, w, h } = bbox(poly);
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const dx = w / (cols + 1);
  const dy = h / (rows + 1);
  const candidates = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      candidates.push({ x: minX + c * dx, y: minY + r * dy });
    }
  }
  // Prefer in-poly points; if not enough valid, fall through.
  const inside = candidates.filter(p => pointInPolygon([p.x, p.y], poly));
  const out = (inside.length >= count ? inside : candidates).slice(0, count);
  return out;
}

// Pick the better strategy automatically — grid for elongated regions or
// large counts, ring for compact layouts.
export function layoutPlacesInPolygon(poly, count, opts = {}) {
  const { strategy = 'auto' } = opts;
  if (strategy === 'ring') return layoutOnRing(poly, count);
  if (strategy === 'grid') return layoutOnGrid(poly, count);
  // auto:
  const { w, h } = bbox(poly);
  const aspect = h ? w / h : 1;
  const elongated = aspect > 2 || aspect < 0.5;
  if (count > 8 || elongated) return layoutOnGrid(poly, count);
  return layoutOnRing(poly, count);
}

// If no polygon was given (e.g. AI returned only places without a region),
// fall back to a clean ring on a default canvas centred at (500, 350).
export function layoutOnDefaultCanvas(count, opts = {}) {
  const center = opts.center || [500, 350];
  const r = opts.radius || 220;
  const out = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    out.push({ x: center[0] + r * Math.cos(angle), y: center[1] + r * Math.sin(angle) });
  }
  return out;
}

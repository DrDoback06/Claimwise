// Loomwright — Procedural region background.
//
// Returns an inline SVG dataURL the RegionLayer can render as the region's
// fill. Light, deterministic; no AI image-gen dependency. The hash on the
// region's name seeds the noise so the same region always renders the
// same texture between sessions.

const BIOME_PALETTE = {
  forest:    { base: '#3f5b3f', accent: '#2c4a2c', specks: '#7a9b6a' },
  desert:    { base: '#d2b87a', accent: '#bf9b58', specks: '#a78338' },
  ocean:     { base: '#3d6a8f', accent: '#2c577a', specks: '#82a7c5' },
  mountain:  { base: '#7a7a82', accent: '#5a5a64', specks: '#a8a8b2' },
  plains:    { base: '#a8b56b', accent: '#8a9558', specks: '#cdd58c' },
  swamp:     { base: '#4f5d3c', accent: '#3a4528', specks: '#7a8a5a' },
  tundra:    { base: '#cdd6dd', accent: '#9aa5b0', specks: '#f0f4f7' },
  city:      { base: '#7d6a5a', accent: '#5d4f43', specks: '#b8a994' },
  parchment: { base: '#e8dcb8', accent: '#c4a96a', specks: '#a07d3c' },
};

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rand(seed) {
  let x = seed | 0;
  return () => {
    x = (x * 1664525 + 1013904223) | 0;
    return ((x >>> 0) % 10000) / 10000;
  };
}

function paletteFor(biome) {
  return BIOME_PALETTE[biome] || BIOME_PALETTE.parchment;
}

// Compute polygon bbox + path string for the SVG fill mask.
function bboxAndPath(poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const path = poly.map(([x, y], i) => (i === 0 ? 'M' : 'L') + (x - minX) + ',' + (y - minY)).join(' ') + ' Z';
  return { minX, minY, w: maxX - minX, h: maxY - minY, path };
}

// Returns { dataUrl, biome } — the dataUrl is an SVG image inscribed in
// the polygon's bounding box. Embed directly as <image> or via CSS
// background-image. RegionLayer reads `region.bgImage`.
export function generateRegionBackground(region, opts = {}) {
  if (!region || !Array.isArray(region.poly) || region.poly.length < 3) return null;
  const biome = (opts.biome || region.biome || 'parchment').toLowerCase();
  const palette = paletteFor(biome);
  const { w, h, path } = bboxAndPath(region.poly);
  const seed = hash((region.name || 'region') + ':' + biome);
  const r = rand(seed);

  // Sprinkle "specks" — tiny offset circles to convey terrain texture.
  const specks = [];
  const count = Math.min(120, Math.max(20, Math.round((w * h) / 1800)));
  for (let i = 0; i < count; i++) {
    const sx = r() * w;
    const sy = r() * h;
    const sr = 1 + r() * 3;
    const opacity = 0.3 + r() * 0.5;
    specks.push(`<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${sr.toFixed(1)}" fill="${palette.specks}" opacity="${opacity.toFixed(2)}" />`);
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`,
    `  <defs>`,
    `    <clipPath id="rg-clip"><path d="${path}" /></clipPath>`,
    `    <radialGradient id="rg-grad" cx="50%" cy="50%" r="80%">`,
    `      <stop offset="0%" stop-color="${palette.base}" stop-opacity="0.85" />`,
    `      <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0.95" />`,
    `    </radialGradient>`,
    `  </defs>`,
    `  <g clip-path="url(#rg-clip)">`,
    `    <rect width="${w}" height="${h}" fill="url(#rg-grad)" />`,
    specks.join('\n'),
    `  </g>`,
    `</svg>`,
  ].join('\n');

  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`;
  return { dataUrl, biome, palette };
}

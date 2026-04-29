/* Loomwright design tokens — extracted 1:1 from src/loomwright/theme.js
 * PRIMARY THEME: day (light). Night is preserved for completeness but the canvas renders day.
 * Three additive tokens (T.sugg, T.suggInk, T.hand) are flagged below.
 *
 * ── For Claude Code ──
 * Source of truth lives at src/loomwright/theme.js.
 * If you adjust day-theme tokens there, mirror them here so the design canvas
 * stays in sync. The +new tokens (sugg, suggInk, hand) need to be added to
 * THEMES.day and THEMES.night in theme.js when implementing the Suggestion engine.
 */
window.LW = {
  // Surfaces (DAY)
  bg:       '#f4efe4',
  paper:    '#fbf7ed',
  paper2:   '#ffffff',
  sidebar:  '#ebe4d2',
  // Ink
  ink:      '#2a261e',
  ink2:     '#5a544a',
  ink3:     '#8a8478',
  rule:     '#d9d2bf',
  // Accents
  accent:      'oklch(55% 0.15 45)',
  accentSoft:  'oklch(55% 0.15 45 / 0.18)',
  accent2:     'oklch(48% 0.09 200)',
  accent2Soft: 'oklch(48% 0.09 200 / 0.18)',
  // Status
  good:    'oklch(50% 0.13 145)',
  warn:    'oklch(55% 0.15 45)',
  bad:     'oklch(55% 0.18 25)',
  subtle:  'oklch(55% 0.04 60)',
  // +new — Suggestion surface (warmer paper for Claude's voice)
  sugg:    '#f6efd9',                // warmer than paper, distinct from canvas
  suggInk: '#7a5d2a',                // ochre ink for marginalia
  suggRule:'oklch(60% 0.06 80 / 0.4)',
  // Type
  display: "'Fraunces', 'Georgia', serif",
  font:    "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  mono:    "'JetBrains Mono', 'Consolas', monospace",
  hand:    "'Caveat', 'Bradley Hand', cursive", // +new — marginalia
  radius:  '3px',
  // Rarity (matches src/styles/theme.css)
  rarityCommon:    '#7a7470',
  rarityMagic:     '#3b82f6',
  rarityRare:      '#b45309',
  rarityLegendary: '#c2410c',
  rarityUnique:    '#7e22ce',
  rarityMythic:    '#be185d',
};

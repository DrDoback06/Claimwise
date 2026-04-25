// Loomwright — icon set. Tiny inline SVGs, theme-aware via stroke=currentColor.

import React from 'react';

export default function Icon({ name, size = 14, color = 'currentColor' }) {
  const s = size, c = color, sw = 1.5;
  const common = {
    width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
    stroke: c, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'map':      return <svg {...common}><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><path d="M9 3v15M15 6v15"/></svg>;
    case 'users':    return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="7" r="2.5"/><path d="M14 14c2-1 4 0 5 1.5"/></svg>;
    case 'pen':      return <svg {...common}><path d="M15 4l5 5L9 20H4v-5L15 4z"/><path d="M13 6l5 5"/></svg>;
    case 'flag':     return <svg {...common}><path d="M5 3v18M5 4h12l-3 4 3 4H5"/></svg>;
    case 'sparkle':  return <svg {...common}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8L19 3z"/></svg>;
    case 'book':     return <svg {...common}><path d="M4 5a2 2 0 012-2h13v17H6a2 2 0 01-2-2V5z"/><path d="M4 18a2 2 0 012-2h13"/></svg>;
    case 'bag':      return <svg {...common}><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>;
    case 'web':      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 4 3 14 0 18M12 3c-3 4-3 14 0 18"/></svg>;
    case 'compass':  return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-4 0 2-6z"/></svg>;
    case 'building': return <svg {...common}><path d="M4 20V7l8-4 8 4v13"/><path d="M9 20v-5h6v5M9 11h2M13 11h2"/></svg>;
    case 'chat':     return <svg {...common}><path d="M4 5h16v12H8l-4 4V5z"/></svg>;
    case 'seed':     return <svg {...common}><path d="M12 21c-4-4-7-7-7-11a7 7 0 0114 0c0 4-3 7-7 11z"/><path d="M12 3v9"/></svg>;
    case 'volume':   return <svg {...common}><path d="M5 9v6h4l5 4V5L9 9H5z"/></svg>;
    case 'search':   return <svg {...common}><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></svg>;
    case 'cog':      return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>;
    case 'plus':     return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'x':        return <svg {...common}><path d="M5 5l14 14M19 5L5 19"/></svg>;
    case 'eye':      return <svg {...common}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye-off':  return <svg {...common}><path d="M3 3l18 18M10 5a10 10 0 0112 7 10 10 0 01-2 3M6 6a10 10 0 00-4 6s4 7 10 7c2 0 4-1 5-2"/></svg>;
    case 'play':     return <svg {...common}><path d="M6 4l14 8-14 8V4z"/></svg>;
    case 'focus':    return <svg {...common}><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/></svg>;
    case 'tangle':   return <svg {...common}><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><path d="M8 6l8 0M6 8v8M18 8v8M8 18l8 0M8 7l3 4M16 7l-3 4M11 13l-3 4M13 13l3 4"/></svg>;
    default:         return <svg {...common}><circle cx="12" cy="12" r="8"/></svg>;
  }
}

// Loomwright — dev-mode gate.
//
// Visit any URL with ?dev=1 to enable the Developer panel in Settings.
// The flag persists in localStorage. Visit ?dev=0 to turn it off again.

const KEY = 'lw.devMode';

function readQuery() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('dev')) return null;
  return params.get('dev') === '1' || params.get('dev') === 'true';
}

export function isDevMode() {
  // Query string overrides storage. ?dev=1 turns it on and persists; ?dev=0
  // turns it off and persists.
  const q = readQuery();
  if (q !== null) {
    try { localStorage.setItem(KEY, q ? '1' : '0'); } catch {}
    return q;
  }
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function setDevMode(on) {
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch {}
}

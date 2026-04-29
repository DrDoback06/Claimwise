// Loomwright — top-level app router. Hash-based decision between the new
// unified Writers Room and the legacy app.
//
// /#/legacy or ?legacy=1 → legacy App.js (kept around while users adapt)
// anything else          → new WritersRoom (default)

import React from 'react';
import App from './App';
import WritersRoom from './features/writers-room';

function isLegacyRoute() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hash || '';
  if (h === '#/legacy' || h.startsWith('#/legacy/')) return true;
  if (window.location.search.includes('legacy=1')) return true;
  return false;
}

export default function AppRouter() {
  const [legacy, setLegacy] = React.useState(() => isLegacyRoute());
  React.useEffect(() => {
    const onHash = () => setLegacy(isLegacyRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  if (legacy) return <App />;
  return <WritersRoom />;
}

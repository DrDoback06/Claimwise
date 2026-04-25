// Loomwright — top-level app router. Hash-based decision between the new
// unified Writers Room and the legacy app.
//
// /#/writers → new WritersRoom (src/features/writers-room)
// anything else → legacy App.js

import React from 'react';
import App from './App';
import WritersRoom from './features/writers-room';

function isWritersRoute() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hash || '';
  if (h === '#/writers' || h.startsWith('#/writers/')) return true;
  // Also accept ?writers=1 query param.
  if (window.location.search.includes('writers=1')) return true;
  return false;
}

export default function AppRouter() {
  const [path, setPath] = React.useState(() => isWritersRoute());
  React.useEffect(() => {
    const onHash = () => setPath(isWritersRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  if (path) return <WritersRoom />;
  return <App />;
}

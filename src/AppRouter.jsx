// Top-level router: classic Grimguff / Claimwise tracker is the default.
// Opt in to the newer Writers Room shell with ?writers=1 or #/writers

import React from 'react';
import App from './App';
import WritersRoom from './features/writers-room';

function isWritersRoomRoute() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hash || '';
  if (h === '#/writers' || h.startsWith('#/writers/')) return true;
  if (window.location.search.includes('writers=1')) return true;
  return false;
}

export default function AppRouter() {
  const [writersRoom, setWritersRoom] = React.useState(() => isWritersRoomRoute());
  React.useEffect(() => {
    const sync = () => setWritersRoom(isWritersRoomRoute());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);
  if (writersRoom) return <WritersRoom />;
  return <App />;
}

/**
 * ManuscriptImportDrawer — Write > Import manuscript flow.
 *
 * Wraps ManuscriptIntelligence so that an author can drop/paste an existing
 * manuscript, run entity extraction, and accept the results into Canon
 * Weaver's worldState. Replaces the old standalone Manuscript Intelligence
 * tab; every suggestion that's accepted is committed through setWorldState
 * exactly as Canon Weaver expects.
 */

import React from 'react';
import { useTheme } from '../../loomwright/theme';
import ManuscriptIntelligence from '../../components/ManuscriptIntelligence';

export default function ManuscriptImportDrawer({ worldState, setWorldState, onClose }) {
  const t = useTheme();
  const books = worldState?.books || {};

  const handleApplySuggestions = (patch) => {
    if (!patch || !setWorldState) return;
    setWorldState((prev) => ({
      ...prev,
      actors: patch.actors || prev.actors,
      itemBank: patch.itemBank || prev.itemBank,
      skillBank: patch.skillBank || prev.skillBank,
      books: patch.books || prev.books,
      plotThreads: patch.plotThreads || prev.plotThreads,
      places: patch.places || prev.places,
    }));
  };

  const handleWorldStateUpdate = (updater) => {
    if (!setWorldState) return;
    setWorldState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  };

  return (
    <div style={{ background: t.bg, minHeight: '100%' }}>
      <div
        style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${t.rule}`,
          color: t.ink2,
          fontSize: 12,
        }}
      >
        Paste or upload an existing manuscript. Loomwright will extract
        characters, places and events, and surface them as Canon Weaver
        proposals you can accept in bulk.
      </div>
      <ManuscriptIntelligence
        worldState={worldState}
        books={books}
        onClose={onClose}
        onApplySuggestions={handleApplySuggestions}
        onWorldStateUpdate={handleWorldStateUpdate}
        onNavigate={() => {}}
      />
    </div>
  );
}

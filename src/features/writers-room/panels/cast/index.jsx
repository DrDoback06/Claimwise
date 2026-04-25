// Loomwright — Cast panel composition (plan §10).

import React from 'react';
import PanelFrame from '../PanelFrame';
import Roster from './Roster';
import Dossier from './Dossier';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore, createCharacter } from '../../store';
import { useSelection } from '../../selection';
import { castOnPage } from '../../store/selectors';

export default function CastPanel({ onClose, onInterview, onWeave }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const onPage = castOnPage(store);

  const cast = store.cast || [];
  const charId = sel.character || cast[0]?.id || null;
  const setSel = (id) => select('character', id);

  if (cast.length === 0) {
    const addCharacter = () => {
      let id = null;
      store.transaction(({ setSlice }) => {
        id = createCharacter({ setSlice }, {});
      });
      if (id) setSel(id);
    };
    return (
      <PanelFrame
        title="Who is on this page"
        eyebrow="Cast · empty"
        accent={PANEL_ACCENT.cast}
        onClose={onClose}
        width={460}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: t.display, fontSize: 22, color: t.ink, marginBottom: 8 }}>Start with a name</div>
          <div style={{
            fontFamily: t.display, fontSize: 14, fontStyle: 'italic',
            color: t.ink2, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 20px',
          }}>The Loom will fill in the rest.</div>
          <button onClick={addCharacter} style={{
            padding: '10px 18px', background: PANEL_ACCENT.cast, color: t.onAccent,
            border: 'none', borderRadius: 2,
            fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14,
            textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
          }}>+ Add character</button>
        </div>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame
      title="Who is on this page"
      eyebrow={`Cast · ${onPage.length} on page`}
      accent={PANEL_ACCENT.cast}
      onClose={onClose}
      width={460}>
      <Roster activeId={charId} onSelect={setSel} />
      <Dossier
        charId={charId}
        onInterview={() => onInterview?.(charId)}
        onWeave={() => onWeave?.(charId)}
      />
    </PanelFrame>
  );
}

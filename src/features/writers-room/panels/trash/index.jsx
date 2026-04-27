import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore } from '../../store';

const TARGET_SLICE = {
  character: 'cast',
  place: 'places',
  quest: 'quests',
  item: 'items',
  chapter: 'chapters',
};

export default function TrashPanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const trash = store.trash || [];

  const restore = (row) => {
    const slice = TARGET_SLICE[row.kind];
    if (!slice) return;
    if (slice === 'chapters') {
      const chapter = row.payload;
      if (!chapter?.id) return;
      store.setSlice('chapters', xs => ({ ...(xs || {}), [chapter.id]: chapter }));
      store.setSlice('book', b => ({
        ...b,
        chapterOrder: (b?.chapterOrder || []).includes(chapter.id) ? (b?.chapterOrder || []) : [...(b?.chapterOrder || []), chapter.id],
      }));
    } else {
      store.setSlice(slice, xs => ([...(xs || []), row.payload]));
    }
    store.setSlice('trash', xs => (xs || []).filter(x => x.id !== row.id));
  };

  const purge = (rowId) => store.setSlice('trash', xs => (xs || []).filter(x => x.id !== rowId));

  return (
    <PanelFrame
      title="Trash"
      eyebrow={`Recently removed · ${trash.length}`}
      accent={PANEL_ACCENT.loom}
      panelId="trash"
      onClose={onClose}
      width={460}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.rule}`, background: t.paper2 }}>
        <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.4 }}>
          Removed entities land here first. Restore anytime, or permanently purge.
        </div>
      </div>
      <div style={{ padding: '10px 12px', display: 'grid', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
        {trash.length === 0 && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
            Trash is empty.
          </div>
        )}
        {[...trash].reverse().map(row => (
          <div key={row.id} style={{ border: `1px solid ${t.rule}`, background: t.paper2, padding: 10, borderRadius: 2 }}>
            <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500 }}>
              {row.payload?.name || row.payload?.title || 'Untitled'}
            </div>
            <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, textTransform: 'uppercase', letterSpacing: 0.14 }}>
              {row.kind} · {new Date(row.deletedAt || Date.now()).toLocaleString()}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <button onClick={() => restore(row)} style={btn(t, true)}>Restore</button>
              <button onClick={() => purge(row.id)} style={btn(t, false)}>Purge</button>
            </div>
          </div>
        ))}
      </div>
    </PanelFrame>
  );
}

function btn(t, primary) {
  return {
    padding: '4px 10px',
    background: primary ? t.accent : 'transparent',
    color: primary ? t.onAccent : (t.bad || '#b33'),
    border: `1px solid ${primary ? t.accent : (t.bad || '#b33')}`,
    borderRadius: 1,
    cursor: 'pointer',
    fontFamily: t.mono,
    fontSize: 9,
    letterSpacing: 0.12,
    textTransform: 'uppercase',
  };
}

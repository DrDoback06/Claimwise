// Loomwright — version history UI (plan §21).

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import { activeChapter } from '../store/selectors';
import { snapshotsForChapter, makeSnapshot, pushSnapshot } from './snapshots';

export default function VersionHistory({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const ch = activeChapter(store);
  const snaps = snapshotsForChapter(store.snapshots, ch?.id);
  const [idx, setIdx] = React.useState(snaps.length - 1);

  React.useEffect(() => { setIdx(snaps.length - 1); }, [snaps.length, ch?.id]);

  const cur = snaps[idx];

  const takeManual = () => {
    if (!ch) return;
    pushSnapshot(store, makeSnapshot(ch, 'manual'));
  };

  const restore = () => {
    if (!cur || !ch) return;
    if (!window.confirm(`Restore this version? (Current draft becomes a snapshot.)`)) return;
    // Auto-snapshot the current state first.
    pushSnapshot(store, makeSnapshot(ch, 'pre-restore'));
    store.setSlice('chapters', chs => ({
      ...chs,
      [ch.id]: { ...chs[ch.id], text: cur.text, paragraphs: cur.paragraphs, lastEdit: Date.now() },
    }));
    onClose?.();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1400,
      background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(100%, 720px)', height: 'min(100%, 600px)', background: t.paper,
        border: `1px solid ${t.rule}`, borderRadius: 2, display: 'flex', flexDirection: 'column',
      }}>
        <header style={{
          padding: '14px 18px', borderBottom: `1px solid ${t.rule}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase', flex: 1,
          }}>Version history · {ch?.title || 'No chapter'}</div>
          <button onClick={takeManual} style={btnStyle(t)}>Snapshot now</button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer', fontSize: 18 }}>×</button>
        </header>

        {snaps.length === 0 ? (
          <div style={{
            flex: 1, display: 'grid', placeItems: 'center',
            fontFamily: t.display, color: t.ink3, fontStyle: 'italic',
          }}>
            No snapshots yet. Auto-snapshots happen as you write — or take one now.
          </div>
        ) : (
          <>
            <div style={{
              padding: '12px 18px', borderBottom: `1px solid ${t.rule}`,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>{idx + 1} / {snaps.length}</span>
              <input type="range" min={0} max={snaps.length - 1} value={idx}
                onChange={e => setIdx(Number(e.target.value))}
                style={{ flex: 1, accentColor: PANEL_ACCENT.loom }} />
              <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3 }}>{cur?.wordCount ?? 0} w</span>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${t.rule}` }}>
              <span style={{
                fontFamily: t.mono, fontSize: 9, color: PANEL_ACCENT.loom,
                letterSpacing: 0.12, textTransform: 'uppercase',
              }}>{cur?.kind || 'auto'}</span>
              <span style={{ fontFamily: t.display, fontSize: 13, color: t.ink2 }}>
                {cur ? new Date(cur.t).toLocaleString() : ''}
              </span>
              <div style={{ flex: 1 }} />
              <button onClick={restore} disabled={!cur} style={{
                padding: '6px 12px',
                background: cur ? PANEL_ACCENT.loom : t.rule,
                color: cur ? t.onAccent : t.ink3,
                border: 'none', borderRadius: 1,
                fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
                textTransform: 'uppercase', cursor: cur ? 'pointer' : 'not-allowed', fontWeight: 600,
              }}>Restore this version</button>
            </div>
            <pre style={{
              flex: 1, overflow: 'auto', padding: '14px 22px', margin: 0,
              fontFamily: t.display, fontSize: 14, color: t.ink, lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>{cur?.text || ''}</pre>
          </>
        )}
      </div>
    </div>
  );
}

function btnStyle(t) {
  return {
    padding: '5px 12px', background: 'transparent',
    color: t.ink2, border: `1px solid ${t.rule}`, borderRadius: 1,
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
    textTransform: 'uppercase', cursor: 'pointer',
  };
}

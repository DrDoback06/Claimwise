// Loomwright — Save button with extraction-mode dropdown.
//
// Replaces the old auto-extract-on-save behaviour. The writer explicitly
// chooses what each save does:
//   • Save — flush prose to disk, no extraction.
//   • Save & Extract — flush + Layer 1 foundation extraction (cheap;
//     refreshes the entity roster).
//   • Save & Deep Extract — flush + Layer 2 powerful pass (stat / status
//     / relationship / knowledge / inventory / location / promise changes
//     plus plot beats, emotional beats, decisions, revelations).

import React from 'react';
import { useTheme } from './theme';
import { useStore } from './store';
import { scheduleFoundationRun, scheduleDeepRun } from './ai/pipeline';
import useViewport from './utilities/useViewport';

const MODES = [
  { id: 'save',    label: 'Save', sub: 'Just write to disk' },
  { id: 'extract', label: 'Save & Extract', sub: 'Cheap roster scan (Layer 1)' },
  { id: 'deep',    label: 'Save & Deep Extract', sub: 'Powerful change scan (Layer 2)' },
];

const STORAGE_KEY = 'lw.saveMode';

export default function SaveButton() {
  const t = useTheme();
  const store = useStore();
  const { mobile, narrow } = useViewport();
  const compact = mobile || narrow;
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'extract'; }
    catch { return 'extract'; }
  });
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const setModePersistent = (id) => {
    setMode(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  };

  const fireSave = (modeId) => {
    // Flush in-flight prose edits to the store. The Editor listens for this
    // and immediately persists pending paragraph changes, then we kick the
    // chosen extraction tier.
    window.dispatchEvent(new CustomEvent('lw:flush-save'));
    const id = store.ui?.activeChapterId || store.book?.currentChapterId;
    if (!id) return;
    if (modeId === 'extract') {
      scheduleFoundationRun(store, id);
    } else if (modeId === 'deep') {
      scheduleDeepRun(store, id);
    }
    // 'save' does nothing extra.
  };

  const onClick = () => { fireSave(mode); setOpen(false); };

  const current = MODES.find(m => m.id === mode) || MODES[1];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        title={current.sub}
        onClick={onClick}
        style={{
          padding: compact ? '4px 8px' : '4px 10px',
          background: t.accent, color: t.onAccent,
          border: 'none', borderRadius: '4px 0 0 4px',
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
          textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
        {compact
          ? (current.id === 'save' ? '↓' : current.id === 'deep' ? '↓↓' : '↓+')
          : current.label.replace('Save & ', '+ ')}
      </button>
      <button
        title="Choose save mode"
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '4px 6px',
          background: t.accent, color: t.onAccent,
          border: 'none', borderLeft: `1px solid ${t.onAccent}30`,
          borderRadius: '0 4px 4px 0',
          fontFamily: t.mono, fontSize: 10,
          cursor: 'pointer', fontWeight: 600,
        }}>▾</button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          background: t.paper, border: `1px solid ${t.rule}`,
          borderRadius: 4, boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
          zIndex: 2500, minWidth: 240,
        }}>
          {MODES.map(m => (
            <button key={m.id}
              onClick={() => { setModePersistent(m.id); fireSave(m.id); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', background: m.id === mode ? t.paper2 : 'transparent',
                color: t.ink, border: 'none', cursor: 'pointer',
                fontFamily: t.display, fontSize: 13,
                borderBottom: `1px solid ${t.rule}`,
              }}>
              <div style={{ fontWeight: 500 }}>{m.label}</div>
              <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, marginTop: 2, letterSpacing: 0.12 }}>
                {m.sub}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

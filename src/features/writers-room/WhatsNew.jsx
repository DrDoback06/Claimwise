// Loomwright — first-run hint that points out the new tools so they
// don't get missed.

import React from 'react';
import { useTheme, PANEL_ACCENT } from './theme';
import { useStore } from './store';

const HINTS_VERSION = 'v1.4';

export default function WhatsNew({ onOpenAid, onOpenProof }) {
  const t = useTheme();
  const store = useStore();
  const seen = store.profile?.whatsNewSeen;
  const [open, setOpen] = React.useState(seen !== HINTS_VERSION);

  if (!open) return null;

  const dismiss = () => {
    store.setPath('profile.whatsNewSeen', HINTS_VERSION);
    setOpen(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 56, right: 18, width: 320, zIndex: 1300,
      background: t.paper, border: `1px solid ${PANEL_ACCENT.loom}`,
      borderRadius: 2, padding: '14px 16px',
      boxShadow: '0 6px 24px rgba(0,0,0,0.16)',
      animation: 'lw-pop-in 260ms ease',
    }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: PANEL_ACCENT.loom,
        letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
      }}>What is new</div>
      <div style={{ fontFamily: t.display, fontSize: 16, color: t.ink, fontWeight: 500, marginBottom: 8 }}>
        Two new things to try
      </div>
      <ul style={{ margin: 0, padding: '0 0 0 16px', fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.6 }}>
        <li><strong>Writing aid</strong> (⌘\): Continue, brainstorm, what-if, show-don't-tell — grounded in your selected POV character.</li>
        <li><strong>Proofreader</strong> (⌘'): typos and grammar at the chapter level, with one-click apply.</li>
        <li><strong>Right-click</strong> in the prose now uses the browser's native menu so you can fix spelling. Hold Ctrl/⌘ to summon the radial.</li>
      </ul>
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <button onClick={() => { onOpenAid?.(); dismiss(); }} style={{
          padding: '5px 10px', background: PANEL_ACCENT.loom, color: t.onAccent,
          border: 'none', borderRadius: 1, fontFamily: t.mono, fontSize: 9,
          letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
        }}>Try Aid</button>
        <button onClick={() => { onOpenProof?.(); dismiss(); }} style={{
          padding: '5px 10px', background: 'transparent', color: t.ink2,
          border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9,
          letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
        }}>Try Proof</button>
        <div style={{ flex: 1 }} />
        <button onClick={dismiss} style={{
          padding: '5px 10px', background: 'transparent', color: t.ink3,
          border: `1px solid ${t.rule}`, borderRadius: 1, fontFamily: t.mono, fontSize: 9,
          letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
        }}>Got it</button>
      </div>
    </div>
  );
}

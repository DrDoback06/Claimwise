// Loomwright — keyboard shortcuts overlay (?). Press ? to open.

import React from 'react';
import { useTheme } from './theme';

const SHORTCUTS = [
  { keys: ['⌘ K', 'Ctrl K'], label: 'Command palette' },
  { keys: ['⌘ \\', 'Ctrl \\'], label: 'Writing aid (continue / brainstorm / what-if / show)' },
  { keys: ["⌘ '", "Ctrl '"], label: 'Proofreader (spelling + grammar of this chapter)' },
  { keys: ['⌘ J', 'Ctrl J'], label: 'Weave margin noticings' },
  { keys: ['F9'],             label: 'Toggle focus mode' },
  { keys: ['['],              label: 'Previous chapter' },
  { keys: [']'],              label: 'Next chapter' },
  { keys: ['Esc'],            label: 'Close topmost panel / overlay' },
  { keys: ['?'],              label: 'This help' },
  { keys: ['1 – 8'],          label: 'Pick a SummoningRing spoke' },
  { keys: ['right-click'],    label: 'Native menu (spelling, copy, paste)' },
  { keys: ['Ctrl + right'],   label: 'Open the SummoningRing radial' },
  { keys: ['drag chip'],      label: 'Move entity into Tangle / Atlas / prose' },
  { keys: ['shift-click'],    label: 'Connect two Tangle nodes' },
  { keys: ['double-click'],   label: 'Spotlight an entity from Tangle' },
];

export default function KeyboardHelp({ onClose }) {
  const t = useTheme();
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1500,
      background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(100%, 480px)', background: t.paper,
        border: `1px solid ${t.rule}`, borderRadius: 2, padding: '24px 28px',
      }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
        }}>Keyboard</div>
        <div style={{
          fontFamily: t.display, fontSize: 22, color: t.ink, fontWeight: 500, marginBottom: 16,
        }}>Shortcuts</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
          {SHORTCUTS.map(s => (
            <React.Fragment key={s.label}>
              <span style={{ display: 'flex', gap: 4 }}>
                {s.keys.map(k => (
                  <kbd key={k} style={{
                    padding: '2px 8px', background: t.paper2, border: `1px solid ${t.rule}`,
                    borderRadius: 2, fontFamily: t.mono, fontSize: 11, color: t.ink2,
                  }}>{k}</kbd>
                ))}
              </span>
              <span style={{ fontFamily: t.display, fontSize: 13, color: t.ink2, alignSelf: 'center' }}>{s.label}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

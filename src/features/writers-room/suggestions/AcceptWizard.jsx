// Loomwright — Suggestion Accept mini-wizard (CODE-INSIGHT §3.B.6).
// Shown inside the SuggestionDrawer detail layer when the writer hits Accept.
//
// Steps: editable preview → choose insertion (cursor / tray) → confirm.
// On confirm we insert a <span data-staged data-suggestion-id> at the
// selection point in the editor (Caveat font until first edit promotes).

import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';

export default function AcceptWizard({ suggestion, defaultInsertion = 'cursor', onConfirm, onCancel }) {
  const t = useTheme();
  const store = useStore();
  const [body, setBody] = React.useState(suggestion.body || suggestion.preview || '');
  const [insertion, setInsertion] = React.useState(defaultInsertion);
  const [setAsDefault, setSetAsDefault] = React.useState(false);

  const handleConfirm = () => {
    if (setAsDefault) {
      store.setPath('profile.suggestionPrefs.defaultInsertion', insertion);
    }
    onConfirm({ body, insertion });
  };

  return (
    <div style={{
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
      background: t.sugg || t.paper, color: t.ink, minHeight: '100%',
    }}>
      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.suggInk || t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase',
      }}>Stage suggestion</div>

      <div style={{
        fontFamily: t.display, fontSize: 18, color: t.ink, lineHeight: 1.25, fontWeight: 500,
      }}>{suggestion.title}</div>

      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={8}
        style={{
          width: '100%',
          padding: 12,
          fontFamily: t.hand || "'Caveat', cursive",
          fontSize: 17, lineHeight: 1.5,
          color: t.suggInk || t.ink2,
          background: t.paper,
          border: `1px solid ${t.rule}`, borderLeft: `2px solid ${t.suggInk || t.warn}`,
          borderRadius: 2, outline: 'none', resize: 'vertical',
        }}
      />

      <div style={{
        fontFamily: t.mono, fontSize: 10, color: t.ink3,
        letterSpacing: 0.14, textTransform: 'uppercase',
      }}>Insert as</div>

      <div style={{ display: 'flex', gap: 6 }}>
        <RadioPill t={t} active={insertion === 'cursor'} onClick={() => setInsertion('cursor')}>
          At cursor
        </RadioPill>
        <RadioPill t={t} active={insertion === 'tray'} onClick={() => setInsertion('tray')}>
          Add to tray
        </RadioPill>
      </div>

      <label style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: t.mono, fontSize: 10, color: t.ink3, cursor: 'pointer',
      }}>
        <input type="checkbox" checked={setAsDefault} onChange={e => setSetAsDefault(e.target.checked)} />
        Make this my default
      </label>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onCancel} style={ghost(t)}>Cancel</button>
        <span style={{ flex: 1 }} />
        <button onClick={handleConfirm} style={primary(t)}>Confirm</button>
      </div>
    </div>
  );
}

function RadioPill({ t, active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 10px',
      background: active ? t.accent : 'transparent',
      color: active ? t.onAccent : t.ink2,
      border: `1px solid ${active ? t.accent : t.rule}`, borderRadius: 999,
      fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
      textTransform: 'uppercase', cursor: 'pointer',
    }}>{children}</button>
  );
}

function primary(t) {
  return {
    padding: '7px 14px', background: t.accent, color: t.onAccent,
    border: 'none', borderRadius: 2,
    fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14,
    textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
  };
}
function ghost(t) {
  return {
    padding: '7px 12px', background: 'transparent', color: t.ink2,
    border: `1px solid ${t.rule}`, borderRadius: 2,
    fontFamily: t.mono, fontSize: 11, letterSpacing: 0.14,
    textTransform: 'uppercase', cursor: 'pointer',
  };
}

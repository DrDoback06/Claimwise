// Loomwright — reusable per-panel specialist chat.
// Mounts inside any panel as a collapsible bottom sheet. Each domain gets a
// distinct persona, a curated system context, and chat history persisted to
// `ui.specialistHistory[domain]`.
//
// Use: <SpecialistChat domain="items" panelId="inventory" />

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import { ask } from './service';
import { personaFor } from './personas';

function rid() { return 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6); }

export default function SpecialistChat({ domain, accent }) {
  const t = useTheme();
  const store = useStore();
  const persona = personaFor(domain);
  const messages = store.ui?.specialistHistory?.[domain] || [];
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages.length, busy]);

  const setHistory = (next) =>
    store.setPath(`ui.specialistHistory.${domain}`,
      typeof next === 'function' ? next(messages) : next);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    const userMsg = { id: rid(), role: 'user', text: trimmed, at: Date.now() };
    const nextHistory = [...messages, userMsg];
    setHistory(nextHistory);
    setInput('');
    setBusy(true);
    try {
      const reply = await ask({ domain, history: nextHistory, prompt: trimmed, store });
      setHistory(h => [...h, { id: rid(), role: 'specialist', text: reply, at: Date.now() }]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
    if (e.key === 'Escape') setOpen(false);
  };

  const reset = () => setHistory([]);

  const accentColor = accent || PANEL_ACCENT.loom;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        margin: '8px 12px', padding: '7px 12px',
        background: 'transparent', color: accentColor,
        border: `1px dashed ${accentColor}`, borderRadius: 999,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
        textTransform: 'uppercase', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        💬 Ask the {persona.label}
        {messages.length > 0 && (
          <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, marginLeft: 4 }}>
            · {messages.length} turn{messages.length === 1 ? '' : 's'}
          </span>
        )}
      </button>
    );
  }

  return (
    <div style={{
      margin: '8px 12px', display: 'flex', flexDirection: 'column',
      background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 4,
      maxHeight: 420, animation: 'lw-card-in 200ms ease-out',
    }}>
      <div style={{
        padding: '8px 10px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', alignItems: 'center', gap: 8,
        background: t.paper2,
      }}>
        <div style={{
          width: 4, alignSelf: 'stretch', background: accentColor, borderRadius: 1,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: accentColor,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>{persona.eyebrow}</div>
          <div style={{
            fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500,
          }}>{persona.label}</div>
        </div>
        {messages.length > 0 && (
          <button onClick={reset} title="Clear history" style={iconBtn(t)}>↺</button>
        )}
        <button onClick={() => setOpen(false)} title="Close" style={iconBtn(t)}>×</button>
      </div>

      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: 10,
        display: 'flex', flexDirection: 'column', gap: 8,
        minHeight: 80, maxHeight: 280,
      }}>
        {messages.length === 0 && (
          <div style={{
            fontFamily: t.display, fontSize: 13, color: t.ink3,
            fontStyle: 'italic', lineHeight: 1.5, padding: '10px 4px',
          }}>
            Ask anything in scope. Try: "list the rare items", "make a legendary
            sword that grants Death Blow and +5 STR", "build a 10-node skill
            tree for a wheelwright".
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '6px 10px',
            background: m.role === 'user' ? t.paper2 : (t.sugg || t.paper),
            border: `1px solid ${m.role === 'user' ? t.rule : (t.suggInk || t.rule)}33`,
            borderLeft: m.role === 'user' ? `1px solid ${t.rule}` : `2px solid ${t.suggInk || accentColor}`,
            borderRadius: 4,
            fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
          }}>{m.text}</div>
        ))}
        {busy && (
          <div style={{
            alignSelf: 'flex-start', padding: '6px 10px',
            fontFamily: t.mono, fontSize: 10, color: t.ink3,
            letterSpacing: 0.12, textTransform: 'uppercase',
          }}>thinking…</div>
        )}
      </div>

      <div style={{
        borderTop: `1px solid ${t.rule}`, padding: 8, display: 'flex', gap: 6,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={`Ask the ${persona.label.toLowerCase()}…`}
          rows={1}
          style={{
            flex: 1, padding: '6px 8px',
            fontFamily: t.display, fontSize: 13, color: t.ink, lineHeight: 1.4,
            background: t.paper, border: `1px solid ${t.rule}`,
            borderRadius: 2, outline: 'none', resize: 'vertical', minHeight: 32, maxHeight: 120,
          }}
        />
        <button onClick={send} disabled={busy || !input.trim()} style={{
          padding: '0 12px', background: accentColor, color: t.onAccent,
          border: 'none', borderRadius: 2, cursor: busy ? 'wait' : 'pointer',
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
          textTransform: 'uppercase', fontWeight: 600,
          opacity: busy || !input.trim() ? 0.5 : 1,
        }}>Send</button>
      </div>
    </div>
  );
}

function iconBtn(t) {
  return {
    width: 22, height: 22, borderRadius: 999,
    border: `1px solid ${t.rule}`, background: 'transparent',
    color: t.ink3, cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    fontFamily: t.mono, fontSize: 11, lineHeight: 1, padding: 0,
  };
}

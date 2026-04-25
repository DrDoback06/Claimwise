// Loomwright — InlineWeaver (⌘J). Lightweight panel that shows quick suggestions.

import React from 'react';
import { useTheme, PANEL_ACCENT } from './theme';
import { useStore } from './store';
import { suggest } from './services/suggest';
import { activeChapter } from './store/selectors';

export default function InlineWeaver({ onClose, onWalkThrough }) {
  const t = useTheme();
  const store = useStore();
  const ch = activeChapter(store);
  const [items, setItems] = React.useState([]);
  const [running, setRunning] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setRunning(true);
    const ctx = {
      cast: store.cast, places: store.places, threads: store.threads,
      items: store.items, profile: store.profile,
    };
    suggest(ch?.text || '', ctx, { mode: 'inline-weaver' }).then(res => {
      if (!cancelled) { setItems(res); setRunning(false); }
    }).catch(() => { if (!cancelled) setRunning(false); });
    return () => { cancelled = true; };
  }, [ch?.id, ch?.text]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const insertAtCursor = (text) => {
    const editor = document.querySelector('.lw-prose-wrap [contenteditable="true"]');
    if (!editor || !text) return;
    editor.focus();
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const r = sel.getRangeAt(0);
      r.deleteContents();
      r.insertNode(document.createTextNode(text));
      r.collapse(false);
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  };

  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
      background: t.paper, borderLeft: `1px solid ${t.rule}`,
      display: 'flex', flexDirection: 'column', zIndex: 1000,
      animation: 'lw-slide-in 240ms ease',
      boxShadow: '0 0 24px rgba(0,0,0,0.08)',
    }}>
      <header style={{
        padding: '14px 18px', borderBottom: `1px solid ${t.rule}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: PANEL_ACCENT.loom,
          letterSpacing: 0.16, textTransform: 'uppercase', flex: 1,
        }}>The Loom · Weave</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer' }}>×</button>
      </header>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        <div style={{
          fontFamily: t.display, fontSize: 16, color: t.ink, marginBottom: 12,
          lineHeight: 1.5,
        }}>{running ? 'Listening to your prose…' : `${items.length} suggestion${items.length !== 1 ? 's' : ''}`}</div>
        {items.length === 0 && !running && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
            Nothing to weave just yet. Keep writing — I will be back.
          </div>
        )}
        {items.map(s => (
          <div key={s.id} style={{
            marginBottom: 10, padding: 12,
            background: t.paper2, borderLeft: `2px solid ${PANEL_ACCENT.loom}`, borderRadius: 1,
          }}>
            <div style={{
              fontFamily: t.mono, fontSize: 9, color: t.ink3,
              letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4,
            }}>{s.kind}</div>
            <div style={{ fontFamily: t.display, fontSize: 14, color: t.ink, lineHeight: 1.5 }}>
              {s.proposal?.name || s.rationale}
            </div>
            {s.rationale && s.proposal?.name && (
              <div style={{
                fontSize: 12, color: t.ink2, fontStyle: 'italic',
                marginTop: 4, lineHeight: 1.5,
              }}>{s.rationale}</div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <button onClick={() => onWalkThrough?.(s)} style={{
                padding: '5px 10px', background: PANEL_ACCENT.loom, color: t.onAccent,
                border: 'none', borderRadius: 1,
                fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
                textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
              }}>Walk me through</button>
              {s.proposal?.name && (
                <button onClick={() => insertAtCursor(s.proposal.name)} style={{
                  padding: '5px 10px', background: 'transparent', color: t.accent,
                  border: `1px solid ${t.accent}`, borderRadius: 1,
                  fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
                  textTransform: 'uppercase', cursor: 'pointer',
                }}>Insert "{s.proposal.name}"</button>
              )}
              <button onClick={() => {
                store.recordFeedback(s.kind, 'dismiss', { suggestionId: s.id });
                setItems(prev => prev.filter(x => x.id !== s.id));
              }} style={{
                padding: '5px 10px', background: 'transparent', color: t.ink3,
                border: `1px solid ${t.rule}`, borderRadius: 1,
                fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
                textTransform: 'uppercase', cursor: 'pointer',
              }}>Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// Loomwright — command palette (⌘K). Action search + entity search + prose search.

import React from 'react';
import { useTheme } from './theme';
import { useStore } from './store';
import { useSelection } from './selection';
import { chapterList } from './store/selectors';

export default function CommandPalette({ onClose, onAction }) {
  const t = useTheme();
  const store = useStore();
  const { select } = useSelection();
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ql = q.trim().toLowerCase();
  const cast = (store.cast || []).filter(c => !ql || (c.name || '').toLowerCase().includes(ql));
  const places = (store.places || []).filter(p => !ql || (p.name || '').toLowerCase().includes(ql));
  const threads = (store.quests || []).filter(th => !ql || (th.name || '').toLowerCase().includes(ql));
  const items = (store.items || []).filter(it => !ql || (it.name || '').toLowerCase().includes(ql));
  const proseHits = ql.length > 2 ? findProseHits(store, ql) : [];

  const actions = [
    { id: 'panel.cast', label: 'Open Cast' },
    { id: 'panel.atlas', label: 'Open Atlas' },
    { id: 'panel.quests', label: 'Open Quests' },
    { id: 'panel.voice', label: 'Open Voice' },
    { id: 'panel.items', label: 'Open Items' },
    { id: 'panel.skills', label: 'Open Skills' },
    { id: 'panel.references', label: 'Open References' },
    { id: 'panel.language', label: 'Open Language' },
    { id: 'panel.tangle', label: 'Open Tangle' },
    { id: 'open.weaver', label: 'Open the Weaver (⌘J)' },
    { id: 'open.extraction', label: 'Re-scan this chapter (deep extraction)' },
    { id: 'rescan.all', label: 'Re-scan all chapters in the background' },
    { id: 'focus.toggle', label: 'Toggle focus mode (F9)' },
    { id: 'theme.toggle', label: 'Toggle theme' },
  ].filter(a => !ql || a.label.toLowerCase().includes(ql));

  const pick = (kind, payload) => {
    if (kind === 'character') select('character', payload);
    if (kind === 'place') select('place', payload);
    if (kind === 'thread') select('thread', payload);
    if (kind === 'item') select('item', payload);
    if (kind === 'chapter') {
      store.setPath('ui.activeChapterId', payload);
      store.setPath('book.currentChapterId', payload);
    }
    if (kind === 'action') onAction?.(payload);
    onClose?.();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1500,
      background: 'rgba(0,0,0,0.4)',
      display: 'grid', placeItems: 'start center', paddingTop: 80,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(100%, 560px)', background: t.paper,
        border: `1px solid ${t.rule}`, borderRadius: 2,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      }}>
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Ask the Loom…"
          style={{
            width: '100%', padding: '14px 18px',
            fontFamily: t.display, fontSize: 16, color: t.ink,
            background: 'transparent', border: 'none', outline: 'none',
            borderBottom: `1px solid ${t.rule}`,
          }}
        />
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {actions.length > 0 && <Group t={t} title="Actions">{actions.map(a => (
            <Row key={a.id} t={t} label={a.label} onClick={() => pick('action', a.id)} />
          ))}</Group>}
          {cast.length > 0 && <Group t={t} title="Cast">{cast.map(c => (
            <Row key={c.id} t={t} label={c.name} sub={c.role} accent={c.color} onClick={() => pick('character', c.id)} />
          ))}</Group>}
          {places.length > 0 && <Group t={t} title="Places">{places.map(p => (
            <Row key={p.id} t={t} label={p.name} sub={p.kind} onClick={() => pick('place', p.id)} />
          ))}</Group>}
          {threads.length > 0 && <Group t={t} title="Threads">{threads.map(th => (
            <Row key={th.id} t={t} label={th.name} sub={th.severity} accent={th.color} onClick={() => pick('thread', th.id)} />
          ))}</Group>}
          {items.length > 0 && <Group t={t} title="Items">{items.map(it => (
            <Row key={it.id} t={t} label={it.name} sub={it.kind} onClick={() => pick('item', it.id)} />
          ))}</Group>}
          {proseHits.length > 0 && <Group t={t} title="Prose">{proseHits.map((h, i) => (
            <Row key={i} t={t} label={h.snippet} sub={`ch.${h.chN}`} onClick={() => pick('chapter', h.chId)} />
          ))}</Group>}
        </div>
      </div>
    </div>
  );
}

function Group({ t, title, children }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{
        padding: '4px 18px', fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase',
      }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ t, label, sub, onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '8px 18px', background: 'transparent', border: 'none', textAlign: 'left',
      cursor: 'pointer', color: t.ink,
    }}>
      {accent && <span style={{ width: 6, height: 6, background: accent, borderRadius: '50%' }} />}
      <span style={{ flex: 1, fontFamily: t.display, fontSize: 13 }}>{label}</span>
      {sub && <span style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12 }}>{sub}</span>}
    </button>
  );
}

function findProseHits(store, query) {
  const out = [];
  for (const ch of chapterList(store)) {
    const text = ch.text || '';
    if (!text) continue;
    const lower = text.toLowerCase();
    let i = lower.indexOf(query);
    if (i === -1) continue;
    const start = Math.max(0, i - 40);
    const end = Math.min(text.length, i + query.length + 40);
    out.push({ chId: ch.id, chN: ch.n, snippet: '…' + text.slice(start, end) + '…' });
    if (out.length > 5) break;
  }
  return out;
}

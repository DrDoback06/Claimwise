// Loomwright — Authors panel section + active-author chip.
//
// A writers room can have multiple authors (you + an editor + a beta
// reader). Margin notes / inline comments are tagged with the active
// author's id and color so it's obvious who said what.
//
// Single source of truth lives in `store.authors`. The currently-selected
// author lives in `store.ui.activeAuthorId`. A default "Author" entry is
// auto-seeded on first use so writers who never visit the panel still
// get sensible attribution.

import React from 'react';
import { useTheme, PANEL_ACCENT } from '../theme';
import { useStore } from '../store';
import { rid, pickColor } from '../store/mutators';

const ROLES = ['author', 'co-author', 'editor', 'beta'];

export function ensureDefaultAuthor(store) {
  const list = store.authors || [];
  if (list.length > 0) {
    if (!store.ui?.activeAuthorId || !list.find(a => a.id === store.ui.activeAuthorId)) {
      store.setPath('ui.activeAuthorId', list[0].id);
    }
    return;
  }
  const id = rid('au');
  store.transaction(({ setSlice, setPath }) => {
    setSlice('authors', () => ([{
      id, name: 'Author', color: pickColor(0), role: 'author', addedAt: Date.now(),
    }]));
    setPath('ui.activeAuthorId', id);
  });
}

export function getActiveAuthor(store) {
  const list = store.authors || [];
  return list.find(a => a.id === store.ui?.activeAuthorId) || list[0] || null;
}

export default function AuthorsPanel() {
  const t = useTheme();
  const store = useStore();
  const list = store.authors || [];
  const activeId = store.ui?.activeAuthorId;
  const [editing, setEditing] = React.useState(null); // author id

  const add = () => {
    const id = rid('au');
    const name = window.prompt('Author name:', '');
    if (!name) return;
    store.transaction(({ setSlice, setPath }) => {
      setSlice('authors', xs => [
        ...(Array.isArray(xs) ? xs : []),
        { id, name, color: pickColor(list.length + 1), role: 'author', addedAt: Date.now() },
      ]);
      // First author becomes active automatically.
      if (!activeId) setPath('ui.activeAuthorId', id);
    });
  };
  const update = (id, patch) =>
    store.setSlice('authors', xs => (xs || []).map(a => a.id === id ? { ...a, ...patch } : a));
  const remove = (id) => {
    if (!window.confirm('Remove this author? Their existing notes keep the tag but new notes will pick the next available author.')) return;
    store.transaction(({ setSlice, setPath }) => {
      setSlice('authors', xs => (xs || []).filter(a => a.id !== id));
      if (activeId === id) {
        const next = (store.authors || []).find(a => a.id !== id);
        setPath('ui.activeAuthorId', next?.id || null);
      }
    });
  };
  const pick = (id) => store.setPath('ui.activeAuthorId', id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={pStyle(t)}>
        Each margin note / inline comment is tagged with the active author.
        Add an editor or beta reader to keep their feedback distinct from
        your own writing.
      </p>
      {list.map(a => {
        const isActive = a.id === activeId;
        const isEditing = editing === a.id;
        return (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: 8, borderRadius: 2,
            background: isActive ? t.paper2 : 'transparent',
            border: `1px solid ${isActive ? a.color : t.rule}`,
            borderLeft: `4px solid ${a.color || t.accent}`,
          }}>
            <input type="color" value={hexish(a.color)}
              onChange={e => update(a.id, { color: e.target.value })}
              style={{ width: 24, height: 24, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
            {isEditing ? (
              <input value={a.name}
                onChange={e => update(a.id, { name: e.target.value })}
                onBlur={() => setEditing(null)}
                onKeyDown={e => { if (e.key === 'Enter') setEditing(null); }}
                autoFocus
                style={{
                  flex: 1, padding: '4px 6px',
                  fontFamily: t.display, fontSize: 13, color: t.ink,
                  background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none',
                }} />
            ) : (
              <span onDoubleClick={() => setEditing(a.id)} style={{
                flex: 1, fontFamily: t.display, fontSize: 14, color: t.ink, fontWeight: 500, cursor: 'text',
              }}>{a.name}</span>
            )}
            <select value={a.role || 'author'}
              onChange={e => update(a.id, { role: e.target.value })}
              style={{
                padding: '2px 6px', fontFamily: t.mono, fontSize: 10,
                background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1,
                color: t.ink2, outline: 'none',
              }}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={() => pick(a.id)} disabled={isActive} style={{
              padding: '3px 10px',
              background: isActive ? t.good || '#2a8' : 'transparent',
              color: isActive ? t.onAccent : t.ink2,
              border: `1px solid ${isActive ? t.good || '#2a8' : t.rule}`,
              borderRadius: 999, cursor: isActive ? 'default' : 'pointer',
              fontFamily: t.mono, fontSize: 9, letterSpacing: 0.14, textTransform: 'uppercase',
              fontWeight: 600,
            }}>{isActive ? '✓ Active' : 'Pick'}</button>
            <button onClick={() => remove(a.id)} title="Remove" style={{
              background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer',
              fontFamily: t.mono, fontSize: 14, padding: 4, lineHeight: 1,
            }}>×</button>
          </div>
        );
      })}
      <button onClick={add} style={{
        marginTop: 4, padding: '6px 12px', alignSelf: 'flex-start',
        background: 'transparent', color: PANEL_ACCENT.loom,
        border: `1px dashed ${PANEL_ACCENT.loom}`, borderRadius: 1,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.14,
        textTransform: 'uppercase', cursor: 'pointer',
      }}>+ Add author</button>
    </div>
  );
}

// Compact author chip for the TopBar — shows the active author and
// opens the picker on click.
export function AuthorChip({ onClickSettings }) {
  const t = useTheme();
  const store = useStore();
  const list = store.authors || [];
  const active = getActiveAuthor(store);
  const [open, setOpen] = React.useState(false);

  if (!active) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        title={`Acting as ${active.name} (${active.role || 'author'}). Click to switch.`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 8px',
          background: 'transparent',
          border: `1px solid ${active.color || t.rule}`,
          borderRadius: 999, cursor: 'pointer',
          fontFamily: t.mono, fontSize: 9, letterSpacing: 0.12,
          color: t.ink2, textTransform: 'uppercase',
        }}>
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: active.color,
        }} />
        {active.name}
      </button>
      {open && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          background: t.paper, border: `1px solid ${t.rule}`, borderRadius: 2,
          boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
          minWidth: 180, padding: 4, zIndex: 100,
        }}>
          {list.map(a => (
            <button key={a.id}
              onClick={() => { store.setPath('ui.activeAuthorId', a.id); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 8px', border: 'none', cursor: 'pointer',
                fontFamily: t.display, fontSize: 13, color: t.ink, textAlign: 'left',
                borderLeft: `3px solid ${a.color || 'transparent'}`,
                background: a.id === active.id ? t.paper2 : 'transparent',
              }}>
              <span style={{ flex: 1 }}>{a.name}</span>
              <span style={{
                fontFamily: t.mono, fontSize: 9, color: t.ink3,
                letterSpacing: 0.12, textTransform: 'uppercase',
              }}>{a.role || 'author'}</span>
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${t.rule}`, marginTop: 4, paddingTop: 4 }}>
            <button onClick={() => { onClickSettings?.(); setOpen(false); }} style={{
              width: '100%', padding: '6px 8px', background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: t.mono, fontSize: 9, color: t.ink2, textAlign: 'left', letterSpacing: 0.14, textTransform: 'uppercase',
            }}>+ Add / manage authors…</button>
          </div>
        </div>
      )}
    </div>
  );
}

function hexish(c) {
  if (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) return c;
  return '#7a7a82';
}

function pStyle(t) {
  return { fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5, marginTop: 0 };
}

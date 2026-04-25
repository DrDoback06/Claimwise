// Loomwright — Items panel (plan §16).

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore, createItem } from '../../store';
import { useSelection } from '../../selection';
import { dragEntity } from '../../drag';
import { itemById, characterById, chapterList } from '../../store/selectors';

export default function ItemsPanel({ onClose }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const items = store.items || [];
  const itemId = sel.item || items[0]?.id;
  const item = itemId ? itemById(store, itemId) : null;

  const addItem = () => {
    let id = null;
    store.transaction(({ setSlice }) => {
      id = createItem({ setSlice }, {});
    });
    if (id) select('item', id);
  };

  return (
    <PanelFrame
      title="Things, marked"
      eyebrow="Items"
      accent={PANEL_ACCENT.items}
      onClose={onClose}
      width={420}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rule}` }}>
        {items.length === 0 && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5 }}>
            Items appear as your characters pick them up.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {items.map(it => (
            <div key={it.id}
              onClick={() => select('item', it.id)}
              draggable
              onDragStart={e => dragEntity(e, 'item', it.id)}
              style={{
                padding: '8px 10px',
                background: sel.item === it.id ? t.paper2 : 'transparent',
                border: `1px solid ${sel.item === it.id ? t.accent : t.rule}`,
                borderRadius: 1, cursor: 'grab',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <span style={{ fontSize: 16, color: PANEL_ACCENT.items }}>{it.icon || '◆'}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>{it.kind}</div>
              </div>
            </div>
          ))}
          <button onClick={addItem} style={{
            padding: '8px 10px', background: 'transparent',
            color: t.accent, border: `1px dashed ${t.accent}`,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
            textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1,
          }}>+ Add</button>
        </div>
      </div>

      {item && <ItemDetail item={item} />}
    </PanelFrame>
  );
}

function ItemDetail({ item }) {
  const t = useTheme();
  const store = useStore();
  const owner = item.owner ? characterById(store, item.owner) : null;
  const chapters = chapterList(store);

  const update = (patch) => store.setSlice('items', is => is.map(x => x.id === item.id ? { ...x, ...patch } : x));

  // Build a track of mentions across chapters using the item name.
  const track = chapters.map(ch => {
    const text = ch.text || '';
    if (!text || !item.name) return null;
    const re = new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(text) ? { ch } : null;
  }).filter(Boolean);

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <input value={item.icon || '◆'} onChange={e => update({ icon: e.target.value })}
          style={{ width: 36, height: 36, fontSize: 20, textAlign: 'center', background: t.paper2, border: `1px solid ${t.rule}`, borderRadius: 1, color: PANEL_ACCENT.items }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={item.name || ''} onChange={e => update({ name: e.target.value })}
            style={{ width: '100%', fontFamily: t.display, fontSize: 18, color: t.ink, fontWeight: 500, background: 'transparent', border: 'none', outline: 'none' }} />
          <input value={item.kind || ''} onChange={e => update({ kind: e.target.value })}
            style={{ width: '100%', fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', background: 'transparent', border: 'none', outline: 'none', marginTop: 2 }} />
        </div>
      </div>

      {owner && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4 }}>Owner</div>
          <button style={{
            padding: '4px 10px', background: 'transparent',
            border: `1px solid ${owner.color || t.accent}`, borderRadius: 1,
            fontFamily: t.display, fontSize: 12, color: t.ink, cursor: 'pointer',
          }}>{owner.name}</button>
        </div>
      )}

      <textarea rows={3} value={item.description || ''} onChange={e => update({ description: e.target.value })}
        placeholder="Description"
        style={{
          width: '100%', padding: '6px 8px', fontFamily: t.display, fontSize: 13, color: t.ink2, fontStyle: 'italic', lineHeight: 1.5,
          background: 'transparent', border: `1px solid ${t.rule}`, borderRadius: 1, outline: 'none', marginBottom: 10,
        }} />

      <div style={{ padding: '8px 10px', background: PANEL_ACCENT.items + '22', borderLeft: `2px solid ${PANEL_ACCENT.items}`, marginBottom: 10 }}>
        <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 2 }}>Symbolism</div>
        <input value={item.symbolism || ''} onChange={e => update({ symbolism: e.target.value })}
          placeholder="What this item means in the story…"
          style={{ width: '100%', fontFamily: t.display, fontSize: 12, color: t.ink, background: 'transparent', border: 'none', outline: 'none', fontStyle: 'italic' }} />
      </div>

      <div style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 10, marginBottom: 6 }}>Across the book</div>
      {track.length === 0 ? (
        <div style={{ fontFamily: t.display, fontSize: 12, color: t.ink3, fontStyle: 'italic' }}>No chapter mentions yet.</div>
      ) : (
        track.map(({ ch }, i) => (
          <div key={ch.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
            borderTop: i > 0 ? `1px solid ${t.rule}` : 'none',
          }}>
            <span style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3, letterSpacing: 0.1, textTransform: 'uppercase' }}>CH.{String(ch.n).padStart(2, '0')}</span>
            <span style={{ fontSize: 12, color: t.ink2, fontStyle: 'italic' }}>{ch.title}</span>
          </div>
        ))
      )}
    </div>
  );
}

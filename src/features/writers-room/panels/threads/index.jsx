// Loomwright — Threads panel (plan §14).

import React from 'react';
import PanelFrame from '../PanelFrame';
import { useTheme, PANEL_ACCENT } from '../../theme';
import { useStore, createThread } from '../../store';
import { useSelection } from '../../selection';
import { dragEntity } from '../../drag';
import { threadsForCharacter } from '../../store/selectors';

export default function ThreadsPanel({ onClose, onWeave }) {
  const t = useTheme();
  const store = useStore();
  const { sel, select } = useSelection();
  const [filter, setFilter] = React.useState('all');

  const all = store.threads || [];
  const visible = filter === 'mine' && sel.character
    ? threadsForCharacter(store, sel.character)
    : all;
  const active = visible.filter(x => x.active !== false);
  const dormant = visible.filter(x => x.active === false);

  const addThread = () => {
    let id = null;
    store.transaction(({ setSlice }) => {
      id = createThread({ setSlice }, {});
    });
    if (id) select('thread', id);
  };

  const findDangling = () => {
    // best-effort: surface threads with no beats as dangling.
    const dangling = all.filter(t => (t.beats || []).length === 0);
    if (dangling.length === 0) {
      alert('No dangling threads found — every thread has at least one beat.');
    } else {
      alert(`${dangling.length} dangling thread${dangling.length > 1 ? 's' : ''}: ${dangling.map(d => d.name).join(', ')}`);
    }
  };

  return (
    <PanelFrame
      title="Threads"
      eyebrow="Threads & beats"
      accent={PANEL_ACCENT.threads}
      onClose={onClose}
      width={460}>
      <div style={{ padding: '12px 16px', display: 'flex', gap: 6, alignItems: 'center', borderBottom: `1px solid ${t.rule}` }}>
        <button onClick={() => setFilter('all')} style={chipStyle(t, filter === 'all')}>All</button>
        {sel.character && <button onClick={() => setFilter('mine')} style={chipStyle(t, filter === 'mine')}>With selected character</button>}
        <div style={{ flex: 1 }} />
        <button onClick={findDangling} style={ghostBtnStyle(t)}>Find dangling</button>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {all.length === 0 && (
          <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink3, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 12 }}>
            Threads emerge from your writing. Start a chapter and watch.
          </div>
        )}
        {active.map(th => (
          <ThreadCard key={th.id} thread={th} active={sel.thread === th.id} onSelect={() => select('thread', th.id)} />
        ))}
        {dormant.length > 0 && (
          <div style={{
            fontFamily: t.mono, fontSize: 9, color: t.ink3,
            letterSpacing: 0.16, textTransform: 'uppercase',
            marginTop: 16, marginBottom: 6,
          }}>Dormant</div>
        )}
        {dormant.map(th => (
          <ThreadCard key={th.id} thread={th} active={sel.thread === th.id} onSelect={() => select('thread', th.id)} dormant />
        ))}
        <button onClick={addThread} style={{
          marginTop: 14, padding: '6px 12px', background: 'transparent',
          color: t.accent, border: `1px dashed ${t.accent}`,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1,
        }}>+ New thread</button>
      </div>

      {sel.thread && <ThreadDetail threadId={sel.thread} onWeave={onWeave} />}
    </PanelFrame>
  );
}

function ThreadCard({ thread: th, active, onSelect, dormant }) {
  const t = useTheme();
  return (
    <div onClick={onSelect}
      draggable
      onDragStart={e => dragEntity(e, 'thread', th.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', marginBottom: 4,
        background: active ? t.paper2 : 'transparent',
        border: `1px solid ${active ? (th.color || t.accent) : t.rule}`,
        borderLeft: `3px solid ${th.color || t.accent}`,
        borderRadius: 1, cursor: 'grab',
        opacity: dormant ? 0.6 : 1,
      }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: t.display, fontSize: 13, color: t.ink, fontWeight: 500 }}>{th.name}</div>
        <div style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.12, textTransform: 'uppercase',
        }}>{th.severity || 'medium'} · {(th.beats || []).length} beats</div>
      </div>
    </div>
  );
}

function ThreadDetail({ threadId, onWeave }) {
  const t = useTheme();
  const store = useStore();
  const th = (store.threads || []).find(x => x.id === threadId);
  if (!th) return null;
  const update = (patch) => store.setSlice('threads', ts => ts.map(x => x.id === th.id ? { ...x, ...patch } : x));
  const beats = th.beats || [];
  const addBeat = () => update({ beats: [...beats, { id: `b_${Date.now()}`, text: 'New beat', chapterN: 1 }] });

  return (
    <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.rule}` }}>
      <input value={th.name} onChange={e => update({ name: e.target.value })} style={{
        width: '100%', fontFamily: t.display, fontSize: 16, fontWeight: 500, color: t.ink,
        background: 'transparent', border: 'none', outline: 'none', marginBottom: 4,
      }} />
      <textarea rows={2} value={th.description || ''} onChange={e => update({ description: e.target.value })}
        placeholder="Description"
        style={{
          width: '100%', fontFamily: t.display, fontSize: 13, color: t.ink2, lineHeight: 1.5,
          background: 'transparent', border: `1px solid ${t.rule}`, borderRadius: 1, padding: '6px 8px', outline: 'none',
        }} />

      <div style={{
        fontFamily: t.mono, fontSize: 9, color: t.ink3,
        letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 12, marginBottom: 4,
      }}>Beats</div>
      {beats.map((b, i) => (
        <div key={b.id || i} style={{
          padding: '6px 0', borderTop: i > 0 ? `1px solid ${t.rule}` : 'none',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <input type="number" value={b.chapterN || 1} min={1}
            onChange={e => update({ beats: beats.map((x, j) => j === i ? { ...x, chapterN: Number(e.target.value) } : x) })}
            style={{ width: 38, fontFamily: t.mono, fontSize: 10, color: t.ink3, background: 'transparent', border: 'none', outline: 'none', textAlign: 'right' }} />
          <input value={b.text || ''}
            onChange={e => update({ beats: beats.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })}
            style={{ flex: 1, fontFamily: t.display, fontSize: 13, color: t.ink, background: 'transparent', border: 'none', outline: 'none' }} />
          <button onClick={() => update({ beats: beats.filter((_, j) => j !== i) })} style={{ background: 'transparent', border: 'none', color: t.ink3, cursor: 'pointer' }}>×</button>
        </div>
      ))}
      <button onClick={addBeat} style={{
        marginTop: 8, padding: '5px 10px', background: 'transparent',
        color: t.accent, border: `1px dashed ${t.accent}`, borderRadius: 1,
        fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
        textTransform: 'uppercase', cursor: 'pointer',
      }}>+ beat</button>
      {onWeave && (
        <button onClick={() => onWeave(th.id)} style={{
          marginLeft: 8, padding: '5px 10px',
          background: t.accent, color: t.onAccent, border: 'none', borderRadius: 1,
          fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>✦ Weave next beat</button>
      )}
    </div>
  );
}

function chipStyle(t, active) {
  return {
    padding: '4px 10px',
    background: active ? t.accent : 'transparent',
    color: active ? t.onAccent : t.ink2,
    border: `1px solid ${active ? t.accent : t.rule}`,
    borderRadius: 14,
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
    textTransform: 'uppercase', cursor: 'pointer',
  };
}

function ghostBtnStyle(t) {
  return {
    padding: '4px 10px', background: 'transparent',
    color: t.ink3, border: `1px solid ${t.rule}`, borderRadius: 1,
    fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12,
    textTransform: 'uppercase', cursor: 'pointer',
  };
}

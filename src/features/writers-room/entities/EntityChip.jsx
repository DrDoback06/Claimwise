// Loomwright — generic entity chip. Drag = wr-entity, click = spotlight.

import React from 'react';
import Icon from './Icon';
import { useTheme, PLACE_COLORS } from '../theme';
import { useStore } from '../store';
import { useSelection } from '../selection';
import { dragEntity } from '../drag';

const ICON_BY_KIND = {
  character: 'users', place: 'map', thread: 'flag', item: 'bag', skill: 'sparkle',
};

export default function EntityChip({ kind, id, size = 'md' }) {
  const t = useTheme();
  const store = useStore();
  const { select } = useSelection();

  let label = '', color = t.ink3, sub = '';
  if (kind === 'character') {
    const c = (store.cast || []).find(x => x.id === id);
    if (!c) return <Orphan label="character" />;
    label = c.name; color = c.color || t.ink3; sub = c.role || '';
  } else if (kind === 'place') {
    const p = (store.places || []).find(x => x.id === id);
    if (!p) return <Orphan label="place" />;
    label = p.name; color = PLACE_COLORS[p.kind] || t.ink3; sub = p.kind || '';
  } else if (kind === 'thread') {
    const th = (store.quests || []).find(x => x.id === id);
    if (!th) return <Orphan label="thread" />;
    label = th.name; color = th.color || t.ink3; sub = th.severity || '';
  } else if (kind === 'item') {
    const it = (store.items || []).find(x => x.id === id);
    if (!it) return <Orphan label="item" />;
    label = it.name; color = t.accent; sub = it.kind || '';
  } else if (kind === 'skill') {
    const sk = (store.skillBank || []).find(x => x.id === id)
      || (store.skills || []).find(x => x.id === id);
    if (!sk) return <Orphan label="skill" />;
    label = sk.name; color = t.accent2 || t.accent; sub = sk.tier || sk.k || 'skill';
  } else {
    return <Orphan label={kind} />;
  }

  const pad = size === 'sm' ? '3px 7px' : '5px 10px';
  const font = size === 'sm' ? 11 : 12;
  const icon = ICON_BY_KIND[kind] || 'book';

  return (
    <span
      draggable
      onDragStart={e => dragEntity(e, kind, id)}
      onClick={() => select(kind, id)}
      title={`${sub} · drag to mind map, click to focus`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, padding: pad,
        background: 'transparent', borderLeft: `2px solid ${color}`,
        fontFamily: t.display, fontSize: font, color: t.ink,
        cursor: 'grab', userSelect: 'none', whiteSpace: 'nowrap',
        marginRight: 3, marginBottom: 3,
      }}
    >
      <Icon name={icon} size={11} color={color} />
      {label}
    </span>
  );
}

function Orphan({ label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 7px',
      fontFamily: 'monospace', fontSize: 10, color: '#888',
      borderLeft: '2px dashed #888', opacity: 0.6,
    }}>(deleted {label})</span>
  );
}

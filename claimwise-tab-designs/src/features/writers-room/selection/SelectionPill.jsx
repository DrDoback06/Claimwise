// Loomwright — Selection pill (CODE-INSIGHT §1 / artboard 01-selection).
// The visualisation of the selection bus. Avatar-led: portrait + name + role + ×.
// Hidden when sel is empty; renders a stack for multi.

import React from 'react';
import { useTheme } from '../theme';
import { useStore } from '../store';
import { useSelection, primaryRef } from './index';
import {
  characterById, placeById, threadById, itemById,
} from '../store/selectors';

function refLookup(state, ref) {
  if (!ref) return null;
  switch (ref.kind) {
    case 'character': return characterById(state, ref.id);
    case 'place':     return placeById(state, ref.id);
    case 'thread':    return threadById(state, ref.id);
    case 'item':      return itemById(state, ref.id);
    case 'chapter':   return state.chapters?.[ref.id] || null;
    default: return null;
  }
}

function refLabel(ref, entity) {
  if (!entity) return ref?.id || '';
  return entity.name || entity.title || entity.label || '';
}

function refRole(ref, entity) {
  if (!entity) return ref?.kind || '';
  if (ref.kind === 'character') return entity.role || 'support';
  if (ref.kind === 'place') return entity.kind || 'place';
  if (ref.kind === 'thread') return 'thread';
  if (ref.kind === 'item') return entity.type || 'item';
  if (ref.kind === 'chapter') return 'chapter';
  return ref.kind;
}

function Avatar({ entity, ref, size = 24, t }) {
  const ch = (entity?.name || entity?.title || '?')[0]?.toUpperCase() || '?';
  const bg = entity?.color || t.accent;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: t.onAccent,
      display: 'grid', placeItems: 'center',
      fontFamily: t.display, fontWeight: 500, fontSize: size * 0.5,
      flexShrink: 0,
    }}>{ch}</div>
  );
}

export default function SelectionPill() {
  const t = useTheme();
  const store = useStore();
  const { sel, clear } = useSelection();

  const multi = sel.multi || [];
  const primary = primaryRef(sel);

  // Hidden when nothing selected.
  if (!primary) return null;

  // Single-selection pill
  if (multi.length <= 1) {
    const entity = refLookup(store, primary);
    if (!entity) {
      // Stale entity: clear immediately, don't render.
      // Defer to avoid setState during render.
      Promise.resolve().then(() => clear());
      return null;
    }
    return (
      <div role="status" aria-label="Current selection" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '4px 6px 4px 8px',
        background: t.paper, border: `1px solid ${t.rule}`,
        borderRadius: 999,
        animation: 'lw-pill-in 250ms ease-out',
        fontFamily: t.display, fontSize: 13, color: t.ink,
        maxWidth: 320,
      }}>
        <span style={{
          fontFamily: t.mono, fontSize: 9, color: t.accent,
          letterSpacing: 0.16, textTransform: 'uppercase',
        }}>SEL</span>
        <Avatar entity={entity} ref={primary} t={t} />
        <span style={{
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: 160,
        }}>{refLabel(primary, entity)}</span>
        <span style={{
          fontFamily: t.mono, fontSize: 9, color: t.ink3,
          letterSpacing: 0.14, textTransform: 'uppercase',
        }}>{refRole(primary, entity)}</span>
        <button onClick={clear} aria-label="Clear selection" style={{
          width: 22, height: 22, borderRadius: 999, border: `1px solid ${t.rule}`,
          background: 'transparent', display: 'grid', placeItems: 'center',
          cursor: 'pointer', color: t.ink2, fontFamily: t.mono, fontSize: 12, lineHeight: 1,
        }}>×</button>
      </div>
    );
  }

  // Multi-select stack
  const stack = multi.slice(-3);
  const overflow = multi.length - stack.length;
  const primaryEntity = refLookup(store, primary);
  const others = multi.slice(0, -1)
    .map(r => ({ r, e: refLookup(store, r) }))
    .filter(x => x.e);

  return (
    <div role="status" aria-label="Multi-selection" style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 6px 4px 8px',
      background: t.paper, border: `1px solid ${t.rule}`,
      borderRadius: 999,
      animation: 'lw-pill-in 250ms ease-out',
      fontFamily: t.display, fontSize: 13, color: t.ink,
    }}>
      <span style={{
        fontFamily: t.mono, fontSize: 9, color: t.accent,
        letterSpacing: 0.16, textTransform: 'uppercase',
      }}>SEL · {multi.length}</span>
      <div style={{ display: 'inline-flex' }}>
        {stack.map((r, i) => {
          const e = refLookup(store, r);
          if (!e) return null;
          return (
            <div key={r.kind + r.id + i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
              <Avatar entity={e} ref={r} size={22} t={t} />
            </div>
          );
        })}
      </div>
      <span style={{ whiteSpace: 'nowrap' }}>
        {primaryEntity ? refLabel(primary, primaryEntity) : '?'}
        {others.length > 0 && (
          <span style={{ color: t.ink3 }}>{` + ${others.length} other${others.length === 1 ? '' : 's'}`}</span>
        )}
        {overflow > 0 && <span style={{ color: t.ink3 }}>{` +${overflow}`}</span>}
      </span>
      <button onClick={clear} aria-label="Clear multi-selection" style={{
        width: 22, height: 22, borderRadius: 999, border: `1px solid ${t.rule}`,
        background: 'transparent', display: 'grid', placeItems: 'center',
        cursor: 'pointer', color: t.ink2, fontFamily: t.mono, fontSize: 12, lineHeight: 1,
      }}>×</button>
    </div>
  );
}

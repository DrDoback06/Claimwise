// Loomwright — Atlas PlaceEditor (plan §11).

import React from 'react';
import { useTheme } from '../../theme';
import { useStore } from '../../store';
import { useSelection } from '../../selection';
import CollapseSection from '../CollapseSection';
import { PLACE_TEMPLATES } from './templates';
import { placeById } from '../../store/selectors';

export default function PlaceEditor({ onWeave }) {
  const t = useTheme();
  const store = useStore();
  const { sel } = useSelection();
  const place = placeById(store, sel.place);
  if (!place) return null;

  const update = (patch) => {
    store.setSlice('places', ps => ps.map(p => p.id === place.id ? { ...p, ...patch } : p));
  };

  const inp = {
    width: '100%', padding: '6px 8px',
    fontFamily: t.display, fontSize: 13, color: t.ink,
    background: 'transparent', border: `1px solid ${t.rule}`,
    borderRadius: 1, outline: 'none', marginTop: 4,
  };
  const lbl = {
    fontFamily: t.mono, fontSize: 9, color: t.ink3,
    letterSpacing: 0.16, textTransform: 'uppercase', marginTop: 10,
  };

  const template = PLACE_TEMPLATES.find(x => x.kind === place.kind);

  const addFloorplan = () => {
    if (!template) return;
    const childIds = (template.rooms || []).map(roomName => {
      const id = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      store.setSlice('places', ps => [...(ps || []), {
        id, name: roomName, kind: 'room', realm: place.realm,
        parentId: place.id, x: 0, y: 0, children: [], visits: [],
        proposed: false, hasFloorplan: false, createdAt: Date.now(),
      }]);
      return id;
    });
    update({ hasFloorplan: true, children: [...(place.children || []), ...childIds] });
  };

  return (
    <div>
      <div style={{ padding: '14px 16px' }}>
        <div style={lbl}>Name</div>
        <input style={inp} value={place.name || ''} onChange={e => update({ name: e.target.value })} />
        <div style={lbl}>Kind</div>
        <select value={place.kind} onChange={e => update({ kind: e.target.value })} style={inp}>
          {PLACE_TEMPLATES.map(tpl => <option key={tpl.kind} value={tpl.kind}>{tpl.label}</option>)}
          <option value="settlement">Settlement</option>
          <option value="room">Room</option>
        </select>
        <div style={lbl}>Realm</div>
        <input style={inp} value={place.realm || ''} onChange={e => update({ realm: e.target.value })} />
        <div style={lbl}>Description</div>
        <textarea rows={3} style={{ ...inp, lineHeight: 1.5 }} value={place.description || ''}
          onChange={e => update({ description: e.target.value })} />

        {template?.hasFloorplan && !place.hasFloorplan && (
          <button onClick={addFloorplan} style={{
            marginTop: 14, padding: '7px 14px',
            background: t.accent, color: t.onAccent, border: 'none', borderRadius: 1,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
          }}>+ Floorplan</button>
        )}

        {onWeave && (
          <button onClick={onWeave} style={{
            marginTop: 8, marginLeft: 8, padding: '7px 14px',
            background: 'transparent', color: t.accent, border: `1px solid ${t.accent}`, borderRadius: 1,
            fontFamily: t.mono, fontSize: 10, letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
          }}>✦ Weave</button>
        )}
      </div>

      {(place.children || []).length > 0 && (
        <CollapseSection title="Rooms" count={(place.children || []).length}>
          {(place.children || []).map(cid => {
            const child = (store.places || []).find(p => p.id === cid);
            if (!child) return null;
            return (
              <div key={cid} style={{
                padding: '6px 8px', background: t.paper2, marginBottom: 4, borderRadius: 1,
                fontFamily: t.display, fontSize: 13, color: t.ink2,
              }}>{child.name}</div>
            );
          })}
        </CollapseSection>
      )}

      {(place.visits || []).length > 0 && (
        <CollapseSection title="Visited by" count={(place.visits || []).length}>
          {(place.visits || []).map(v => {
            const c = (store.cast || []).find(x => x.id === v.characterId);
            const ch = store.chapters?.[v.chapterId];
            return (
              <div key={v.id} style={{
                padding: '5px 8px', fontFamily: t.display, fontSize: 12, color: t.ink2,
              }}>{c?.name || 'Someone'} — ch.{ch?.n || '?'}</div>
            );
          })}
        </CollapseSection>
      )}
    </div>
  );
}

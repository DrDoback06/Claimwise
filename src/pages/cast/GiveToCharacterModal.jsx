/**
 * GiveToCharacterModal - pick a character and give them an item.
 *
 * Updates the actor's `inventory` array with the item id, seeds a
 * chapter-track entry if a chapter is provided, and writes via db.update
 * + setWorldState so every consumer (Cast stats, inventory matrix,
 * journey scrubber) reflects the change.
 */

import React, { useMemo, useState } from 'react';
import { Users, X } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import toastService from '../../services/toastService';

export default function GiveToCharacterModal({
  isOpen,
  item,
  worldState,
  setWorldState,
  defaultChapter,
  onClose,
}) {
  const t = useTheme();
  const actors = worldState?.actors || [];
  const [actorId, setActorId] = useState(actors[0]?.id || '');
  const [slot, setSlot] = useState('pack');
  const [chapter, setChapter] = useState(defaultChapter || '');
  const [saving, setSaving] = useState(false);

  const actor = useMemo(() => actors.find((a) => a.id === actorId) || null, [actors, actorId]);

  if (!isOpen || !item) return null;

  const submit = async () => {
    if (!actorId || !actor) { toastService.warn?.('Pick a character first.'); return; }
    setSaving(true);
    const chNum = Number(chapter) || 0;
    const nextActor = {
      ...actor,
      inventory: Array.from(new Set([...(actor.inventory || []), item.id])),
    };
    const nextItem = {
      ...item,
      track: {
        ...(item.track || {}),
        ...(chNum ? {
          [chNum]: {
            actorId: actor.id,
            slotId: slot,
            stateId: 'pristine',
            note: `Given to ${actor.name}.`,
          },
        } : {}),
      },
    };
    try { await db.update('actors', nextActor); } catch (_e) { /* noop */ }
    try { await db.update('itemBank', nextItem); } catch (_e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      actors: (prev?.actors || []).map((a) => (a.id === actor.id ? nextActor : a)),
      itemBank: (prev?.itemBank || []).map((i) => (i.id === item.id ? nextItem : i)),
    }));
    setSaving(false);
    toastService.success?.(`${item.name} given to ${actor.name}.`);
    onClose?.();
  };

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    background: t.bg,
    border: `1px solid ${t.rule}`,
    borderRadius: t.radius,
    color: t.ink,
    fontFamily: t.font,
    fontSize: 13,
    outline: 'none',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, margin: '0 16px',
          background: t.paper, border: `1px solid ${t.rule}`,
          borderRadius: 6, boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 16px', borderBottom: `1px solid ${t.rule}`,
            background: t.sidebar,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} color={t.accent} />
            <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink }}>
              Give {item.name}
            </div>
          </div>
          <button
            type="button" onClick={onClose}
            style={{
              padding: 5, background: 'transparent', color: t.ink2,
              border: `1px solid ${t.rule}`, borderRadius: t.radius, cursor: 'pointer',
            }}
          >
            <X size={12} />
          </button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 4 }}>
              Character
            </div>
            <select value={actorId} onChange={(e) => setActorId(e.target.value)} style={inputStyle}>
              <option value="">-</option>
              {actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 4 }}>
                Slot
              </div>
              <select value={slot} onChange={(e) => setSlot(e.target.value)} style={inputStyle}>
                {['pack', 'main', 'off', 'head', 'torso', 'hands', 'belt', 'feet', 'ring1', 'ring2', 'hidden', 'charm'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 4 }}>
                Acquired ch.
              </div>
              <input
                type="number"
                min={1}
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="optional"
                style={inputStyle}
              />
            </label>
          </div>
        </div>

        <div
          style={{
            padding: '10px 16px', borderTop: `1px solid ${t.rule}`,
            background: t.sidebar,
            display: 'flex', justifyContent: 'flex-end', gap: 8,
          }}
        >
          <button
            type="button" onClick={onClose} disabled={saving}
            style={{
              padding: '6px 12px', background: 'transparent', color: t.ink2,
              border: `1px solid ${t.rule}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.12, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={submit} disabled={saving || !actorId}
            style={{
              padding: '6px 14px',
              background: actorId ? t.accent : t.paper2,
              color: actorId ? t.onAccent : t.ink3,
              border: `1px solid ${actorId ? t.accent : t.rule}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.14, textTransform: 'uppercase',
              cursor: actorId ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Saving...' : 'Give'}
          </button>
        </div>
      </div>
    </div>
  );
}

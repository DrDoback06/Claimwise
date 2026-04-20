/**
 * PullFromVaultModal - pick items from the Vault not yet in this actor's
 * inventory and add them. Writes actor.inventory + optional item.track[ch]
 * entries so the new items immediately appear in the character's Stats,
 * Journey, and the Inventory Matrix filtered to them.
 */

import React, { useMemo, useState } from 'react';
import { Briefcase, X, Check } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import db from '../../services/database';
import toastService from '../../services/toastService';

export default function PullFromVaultModal({
  isOpen,
  character,
  worldState,
  setWorldState,
  defaultChapter,
  onClose,
}) {
  const t = useTheme();
  const items = worldState?.itemBank || [];
  const inventoryIds = new Set(character?.inventory || []);
  const available = useMemo(
    () => items.filter((i) => !inventoryIds.has(i.id)),
    [items, character?.id],
  );
  const [picked, setPicked] = useState(() => new Set());
  const [slot, setSlot] = useState('pack');
  const [chapter, setChapter] = useState(defaultChapter || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !character) return null;

  const toggle = (id) => {
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (picked.size === 0) { toastService.warn?.('Pick at least one item.'); return; }
    setSaving(true);
    const chNum = Number(chapter) || 0;
    const addedIds = Array.from(picked);
    const nextActor = {
      ...character,
      inventory: Array.from(new Set([...(character.inventory || []), ...addedIds])),
    };
    const nextItems = items.map((i) => {
      if (!picked.has(i.id)) return i;
      return {
        ...i,
        track: {
          ...(i.track || {}),
          ...(chNum ? {
            [chNum]: {
              actorId: character.id,
              slotId: slot,
              stateId: 'pristine',
              note: `Pulled from vault.`,
            },
          } : {}),
        },
      };
    });
    try { await db.update('actors', nextActor); } catch (_e) { /* noop */ }
    try {
      await Promise.all(nextItems
        .filter((i) => picked.has(i.id))
        .map((i) => db.update('itemBank', i)));
    } catch (_e) { /* noop */ }
    setWorldState?.((prev) => ({
      ...(prev || {}),
      actors: (prev?.actors || []).map((a) => (a.id === character.id ? nextActor : a)),
      itemBank: (prev?.itemBank || []).map((i) => (picked.has(i.id) ? nextItems.find((ni) => ni.id === i.id) : i)),
    }));
    setSaving(false);
    toastService.success?.(`Added ${addedIds.length} item${addedIds.length === 1 ? '' : 's'} to ${character.name}.`);
    onClose?.();
  };

  const inputStyle = {
    padding: '5px 8px',
    background: t.bg,
    border: `1px solid ${t.rule}`,
    borderRadius: t.radius,
    color: t.ink,
    fontFamily: t.font,
    fontSize: 12,
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
          width: '100%', maxWidth: 560, margin: '0 16px',
          background: t.paper, border: `1px solid ${t.rule}`,
          borderRadius: 6, boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', maxHeight: '80vh',
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
            <Briefcase size={14} color={t.accent} />
            <div style={{ fontFamily: t.display, fontSize: 15, color: t.ink }}>
              Pull from vault for {character.name}
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

        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${t.rule}`, display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
            Slot
          </label>
          <select value={slot} onChange={(e) => setSlot(e.target.value)} style={inputStyle}>
            {['pack', 'main', 'off', 'head', 'torso', 'hands', 'belt', 'feet', 'ring1', 'ring2', 'hidden', 'charm'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <label style={{ fontFamily: t.mono, fontSize: 10, color: t.ink3, letterSpacing: 0.12, textTransform: 'uppercase' }}>
            Acquired ch.
          </label>
          <input
            type="number"
            min={1}
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="optional"
            style={{ ...inputStyle, width: 90 }}
          />
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 11, color: t.ink3 }}>
            {picked.size} selected
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          {available.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: t.ink3, fontSize: 12 }}>
              {character.name} already owns every item in the vault.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {available.map((i) => {
                const on = picked.has(i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => toggle(i.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', textAlign: 'left',
                      padding: '8px 10px',
                      background: on ? t.accentSoft : 'transparent',
                      border: `1px solid ${on ? t.accent : t.rule}`,
                      borderRadius: t.radius,
                      cursor: 'pointer', color: t.ink,
                    }}
                  >
                    <div
                      style={{
                        width: 16, height: 16,
                        display: 'grid', placeItems: 'center',
                        background: on ? t.accent : 'transparent',
                        color: on ? t.onAccent : 'transparent',
                        border: `1px solid ${on ? t.accent : t.rule}`,
                        borderRadius: 3, flexShrink: 0,
                      }}
                    >
                      <Check size={10} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>{i.name}</div>
                      {(i.type || i.rarity) && (
                        <div
                          style={{
                            fontFamily: t.mono, fontSize: 9, color: t.ink3,
                            letterSpacing: 0.1, textTransform: 'uppercase',
                          }}
                        >
                          {[i.type, i.rarity].filter(Boolean).join(' \u00b7 ')}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
            type="button" onClick={submit} disabled={saving || picked.size === 0}
            style={{
              padding: '6px 14px',
              background: picked.size > 0 ? t.accent : t.paper2,
              color: picked.size > 0 ? t.onAccent : t.ink3,
              border: `1px solid ${picked.size > 0 ? t.accent : t.rule}`, borderRadius: t.radius,
              fontFamily: t.mono, fontSize: 10,
              letterSpacing: 0.14, textTransform: 'uppercase',
              cursor: picked.size > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Saving...' : `Pull ${picked.size || ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

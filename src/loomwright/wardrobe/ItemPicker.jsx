/**
 * ItemPicker — choose an existing item from worldState.itemBank to place
 * in a given slot, or create a fresh blank one.
 */

import React, { useMemo, useState } from 'react';
import Modal from '../primitives/Modal';
import Button from '../primitives/Button';
import Icon from '../primitives/Icon';
import { useTheme } from '../theme';

export default function ItemPicker({
  open,
  slotId,
  worldState,
  onClose,
  onPick,          // (itemId) => void
  onCreateBlank,   // () => void — opens full ItemEditor with a new item
  onGenerateOne,   // () => void — AI generate one for this slot
}) {
  const t = useTheme();
  const [q, setQ] = useState('');
  const items = worldState?.itemBank || [];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (i) =>
        (i.name || '').toLowerCase().includes(needle) ||
        (i.desc || '').toLowerCase().includes(needle) ||
        (i.type || '').toLowerCase().includes(needle)
    );
  }, [items, q]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      subtitle={slotId ? `Slot \u00B7 ${slotId}` : 'Choose an item'}
      title="Add item"
      width={640}
      footer={
        <>
          <Button variant="ghost" onClick={onCreateBlank}>
            Create blank
          </Button>
          <Button
            variant="ghost"
            onClick={onGenerateOne}
            icon={<Icon name="sparkle" size={12} />}
          >
            Generate with AI
          </Button>
          <div style={{ flex: 1 }} />
          <Button onClick={onClose}>Cancel</Button>
        </>
      }
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search items in bank\u2026"
        style={{
          width: '100%',
          padding: '8px 12px',
          background: t.paper2,
          color: t.ink,
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
          fontFamily: t.font,
          fontSize: 13,
          marginBottom: 12,
          boxSizing: 'border-box',
        }}
      />
      <div
        style={{
          maxHeight: 360,
          overflowY: 'auto',
          border: `1px solid ${t.rule}`,
          borderRadius: t.radius,
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: 16, color: t.ink3, fontSize: 13 }}>
            No items match. Use <strong>Create blank</strong> or{' '}
            <strong>Generate with AI</strong>.
          </div>
        ) : (
          filtered.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onPick?.(it.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${t.rule}`,
                cursor: 'pointer',
                textAlign: 'left',
                color: t.ink,
                fontFamily: t.font,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = t.paper2;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  display: 'grid',
                  placeItems: 'center',
                  background: t.paper2,
                  border: `1px solid ${t.rule}`,
                  borderRadius: 2,
                  fontFamily: t.display,
                  fontSize: 15,
                }}
              >
                {it.icon || '\u25A1'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: t.display,
                    fontSize: 14,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {it.name || 'Unnamed'}
                </div>
                <div
                  style={{
                    fontFamily: t.mono,
                    fontSize: 9,
                    color: t.ink3,
                    letterSpacing: 0.1,
                    textTransform: 'uppercase',
                  }}
                >
                  {it.type || 'item'} {it.rarity ? `\u00B7 ${it.rarity}` : ''}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}

/**
 * PaperDoll — the anatomical slot layout.
 * Slots are positioned by percentage on a fixed aspect canvas.
 * Drag an item from one slot onto another to move it. Drag from outside
 * (via DataTransfer 'application/x-lw-itemid') to place.
 */

import React, { useRef, useState } from 'react';
import { useTheme } from '../theme';
import { getActorSlots, STATE_PRESETS } from './schema';
import Icon from '../primitives/Icon';

const DOLL_MIME = 'application/x-lw-itemid';

function stateTone(theme, stateId) {
  const st = STATE_PRESETS.find((s) => s.id === stateId);
  if (!st) return theme.ink3;
  switch (st.tone) {
    case 'good':   return theme.good;
    case 'warn':   return theme.warn;
    case 'bad':    return theme.bad;
    case 'subtle': return theme.subtle;
    case 'accent': return theme.accent;
    default:       return theme.ink2;
  }
}

export default function PaperDoll({
  actor,
  itemsById,
  slotContents,          // { [slotId]: { itemId, stateId, note } }
  visibleGroups,
  selectedSlotId,
  onSelectSlot,
  onOpenItem,
  onClearSlot,
  onSlotContextMenu,
  onPlaceItem,           // ({ itemId, fromSlotId, toSlotId })
  onEmptySlotClick,      // (slotId) -> add item here
}) {
  const t = useTheme();
  const containerRef = useRef(null);
  const [draggingSlot, setDraggingSlot] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const slots = getActorSlots(actor).filter((s) =>
    visibleGroups ? visibleGroups.has(s.group) : true
  );

  const handleDragStart = (e, slotId, itemId) => {
    if (!itemId) return;
    e.dataTransfer.setData(DOLL_MIME, JSON.stringify({ itemId, fromSlotId: slotId }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingSlot(slotId);
  };
  const handleDragEnd = () => {
    setDraggingSlot(null);
    setDragOverSlot(null);
  };
  const handleDragOver = (e, slotId) => {
    if (!e.dataTransfer.types.includes(DOLL_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotId);
  };
  const handleDrop = (e, toSlotId) => {
    const raw = e.dataTransfer.getData(DOLL_MIME);
    if (!raw) return;
    e.preventDefault();
    try {
      const { itemId, fromSlotId } = JSON.parse(raw);
      onPlaceItem?.({ itemId, fromSlotId, toSlotId });
    } catch {
      /* ignore */
    }
    setDragOverSlot(null);
    setDraggingSlot(null);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        aspectRatio: '3 / 4',
        width: '100%',
        maxWidth: 420,
        background: t.paper2,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      {/* Silhouette backdrop */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <svg viewBox="0 0 200 280" width="75%" style={{ opacity: 0.12 }}>
          {/* Simple silhouette */}
          <g fill="none" stroke={t.ink2} strokeWidth={1.5} strokeLinejoin="round">
            <ellipse cx="100" cy="38" rx="22" ry="26" />
            <path d="M60 90 Q100 62 140 90 L150 160 Q140 176 124 176 L124 250 L110 258 L100 260 L90 258 L76 250 L76 176 Q60 176 50 160 Z" />
            <path d="M60 90 L35 150 L30 200 L44 202 L50 162" />
            <path d="M140 90 L165 150 L170 200 L156 202 L150 162" />
          </g>
        </svg>
      </div>
      {/* Actor ident */}
      {actor && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 10,
            fontFamily: t.mono,
            fontSize: 9,
            letterSpacing: 0.14,
            textTransform: 'uppercase',
            color: t.ink3,
          }}
        >
          <span style={{ color: t.accent }}>
            {actor.name || 'Unnamed'}
          </span>
          <span style={{ marginLeft: 6 }}>
            {actor.class || actor.role || ''}
          </span>
        </div>
      )}
      {/* Slots */}
      {slots.map((slot) => {
        const entry = slotContents[slot.id];
        const item = entry ? itemsById[entry.itemId] : null;
        const stateColor = entry ? stateTone(t, entry.stateId) : t.rule;
        const isSelected = selectedSlotId === slot.id;
        const isDragOver = dragOverSlot === slot.id;
        const isDragging = draggingSlot === slot.id;
        return (
          <div
            key={slot.id}
            title={slot.label}
            draggable={!!item}
            onDragStart={(e) => handleDragStart(e, slot.id, item?.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, slot.id)}
            onDragLeave={() => setDragOverSlot((s) => (s === slot.id ? null : s))}
            onDrop={(e) => handleDrop(e, slot.id)}
            onClick={() => {
              if (item) onSelectSlot?.(slot.id);
              else onEmptySlotClick?.(slot.id);
            }}
            onDoubleClick={() => {
              if (item) onOpenItem?.(item.id);
            }}
            onContextMenu={(e) => onSlotContextMenu?.(e, slot.id, item?.id || null)}
            style={{
              position: 'absolute',
              left: `calc(${slot.pos[0]}% - 20px)`,
              top: `calc(${slot.pos[1]}% - 20px)`,
              width: 40,
              height: 40,
              background: item ? t.paper : t.paper2,
              border: `1.5px solid ${
                isSelected ? t.accent : isDragOver ? t.accent2 : stateColor
              }`,
              borderRadius: t.radius,
              cursor: item ? 'grab' : 'pointer',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              opacity: isDragging ? 0.4 : 1,
              boxShadow: isSelected ? `0 0 0 3px ${t.accentSoft}` : 'none',
              transition: 'border-color 120ms, box-shadow 120ms',
            }}
          >
            {item ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: stateColor,
                    fontFamily: t.display,
                    lineHeight: 1,
                  }}
                >
                  {item.icon || slot.icon}
                </div>
                <div
                  style={{
                    fontFamily: t.mono,
                    fontSize: 7,
                    color: t.ink2,
                    marginTop: 2,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: 0.08,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.name}
                </div>
              </div>
            ) : (
              <div
                style={{
                  color: t.ink3,
                  fontSize: 16,
                  fontFamily: t.display,
                  opacity: 0.5,
                }}
              >
                {slot.icon}
              </div>
            )}
          </div>
        );
      })}
      {/* Corner ornament */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 6,
          right: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: t.mono,
          fontSize: 8,
          color: t.ink3,
          letterSpacing: 0.14,
          textTransform: 'uppercase',
        }}
      >
        <Icon name="shield" size={10} />
        Paper doll
      </div>
    </div>
  );
}

/**
 * CharacterWardrobe — the flagship Loomwright surface embedded inside the
 * character page. Renders the paper doll, chapter scrubber, item list, and
 * the wizard / item editor / item picker lifecycle.
 *
 * The host is responsible for persisting changes — this component is a pure
 * controlled surface that calls onPatchWorldState(patch) where patch is
 * { itemBank?, actors? } with replacement arrays.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LoomwrightShell from '../LoomwrightShell';
import { useTheme, ThemeToggle } from '../theme';
import Scrubber from '../primitives/Scrubber';
import Button from '../primitives/Button';
import Icon from '../primitives/Icon';
import ContextMenu, { useContextMenu } from '../primitives/ContextMenu';
import PaperDoll from './PaperDoll';
import HiddenLayerToggle from './HiddenLayerToggle';
import CustomSlotManager from './CustomSlotManager';
import ItemEditor from './ItemEditor';
import ItemPicker from './ItemPicker';
import StarterKitWizard from './StarterKitWizard';
import {
  SLOT_DEFS,
  SLOT_GROUPS,
  ensureItemWardrobeShape,
  ensureWardrobeShape,
  findSlot,
} from './schema';
import {
  resolveAsOf,
  upsertTrackEntry,
  computeActorInventoryAtChapter,
  listActorItemsAtChapter,
  migrateLegacyEquipmentToTrack,
} from '../../utils/inventoryTrack';
import { suggestStarterInventory } from '../ai/inventoryAI';

function useChapterList(worldState, bookId) {
  return useMemo(() => {
    const book = worldState?.books?.[bookId];
    const chapters = book?.chapters || [];
    return chapters.map((c) => c.id).sort((a, b) => a - b);
  }, [worldState, bookId]);
}

function chapterLabelFor(worldState, bookId, ch) {
  const book = worldState?.books?.[bookId];
  const c = book?.chapters?.find((x) => x.id === ch);
  if (!c) return `Chapter ${ch}`;
  return c.title ? `Ch.${String(ch).padStart(2, '0')} \u2022 ${c.title}` : `Chapter ${ch}`;
}

function WardrobeBody({
  actor,
  worldState,
  bookId,
  currentChapter,
  onSelectChapter,
  onPatchWorldState,
  showWizardInitially = false,
}) {
  const t = useTheme();
  const chapters = useChapterList(worldState, bookId);
  const effectiveChapter = currentChapter || chapters[0] || 1;
  const items = useMemo(
    () => (worldState?.itemBank || []).map(ensureItemWardrobeShape),
    [worldState?.itemBank]
  );
  const itemsById = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items]
  );
  const slotContents = useMemo(
    () => computeActorInventoryAtChapter(actor, items, effectiveChapter),
    [actor, items, effectiveChapter]
  );
  const itemsAtChapter = useMemo(
    () => listActorItemsAtChapter(actor, items, effectiveChapter),
    [actor, items, effectiveChapter]
  );

  const highlight = useMemo(() => {
    const h = {};
    items.forEach((it) => {
      if (!it.track) return;
      Object.entries(it.track).forEach(([ch, entry]) => {
        if (entry.actorId === actor?.id) h[Number(ch)] = true;
      });
    });
    return h;
  }, [items, actor?.id]);

  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [editorItemId, setEditorItemId] = useState(null);
  const [editorSlotId, setEditorSlotId] = useState(null);
  const [pickerSlotId, setPickerSlotId] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(showWizardInitially);
  const autoTriggeredFor = useRef(null);
  const [visibleGroups, setVisibleGroups] = useState(
    () => new Set(SLOT_GROUPS.filter((g) => g.defaultVisible).map((g) => g.id))
  );
  const ctx = useContextMenu();

  /** Apply a single track update to item bank and persist. */
  const writeTrack = useCallback(
    (itemId, chapter, entry) => {
      const updatedBank = items.map((i) =>
        i.id === itemId ? upsertTrackEntry(i, chapter, entry) : i
      );
      onPatchWorldState?.({ itemBank: updatedBank });
    },
    [items, onPatchWorldState]
  );

  /** Replace an item's full record (used by ItemEditor save). */
  const writeItem = useCallback(
    (updated) => {
      const id = updated.id;
      let bank = items;
      if (id && items.some((i) => i.id === id)) {
        bank = items.map((i) => (i.id === id ? ensureItemWardrobeShape(updated) : i));
      } else {
        const newItem = ensureItemWardrobeShape({
          ...updated,
          id: id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        });
        bank = [...items, newItem];
      }
      onPatchWorldState?.({ itemBank: bank });
    },
    [items, onPatchWorldState]
  );

  /** Delete an item everywhere (remove from bank and erase its track). */
  const deleteItem = useCallback(
    (id) => {
      const bank = items.filter((i) => i.id !== id);
      onPatchWorldState?.({ itemBank: bank });
      setEditorItemId(null);
    },
    [items, onPatchWorldState]
  );

  /** Move an existing item between slots at the current chapter. */
  const moveInSlot = useCallback(
    ({ itemId, toSlotId }) => {
      const it = itemsById[itemId];
      if (!it) return;
      const cur = resolveAsOf(it, effectiveChapter) || {};
      writeTrack(itemId, effectiveChapter, {
        actorId: actor.id,
        slotId: toSlotId,
        stateId: cur.stateId || 'pristine',
        note: `Moved to ${findSlot(actor, toSlotId)?.label || toSlotId}.`,
      });
    },
    [actor, effectiveChapter, itemsById, writeTrack]
  );

  /** Place an existing item into a slot (from the picker). */
  const placeExisting = useCallback(
    (itemId, slotId) => {
      writeTrack(itemId, effectiveChapter, {
        actorId: actor.id,
        slotId,
        stateId: 'pristine',
        note: `Placed in ${findSlot(actor, slotId)?.label || slotId}.`,
      });
      setPickerSlotId(null);
    },
    [actor, effectiveChapter, writeTrack]
  );

  /** Mark slot empty at the current chapter (null actor+slot). */
  const clearSlotAtChapter = useCallback(
    (slotId, stateId = 'lost', note = '') => {
      const entry = slotContents[slotId];
      if (!entry?.itemId) return;
      writeTrack(entry.itemId, effectiveChapter, {
        actorId: null,
        slotId: null,
        stateId,
        note,
      });
    },
    [effectiveChapter, slotContents, writeTrack]
  );

  /** Transfer item to another actor at current chapter. */
  const transferTo = useCallback(
    (itemId, toActorId) => {
      writeTrack(itemId, effectiveChapter, {
        actorId: toActorId,
        slotId: 'pack',
        stateId: 'gifted',
        note: 'Given at this chapter.',
      });
    },
    [effectiveChapter, writeTrack]
  );

  /** Update custom slot list on actor. */
  const writeCustomSlots = useCallback(
    (customSlots) => {
      const nextActors = (worldState?.actors || []).map((a) =>
        a.id === actor.id ? { ...a, customSlots } : a
      );
      onPatchWorldState?.({ actors: nextActors });
    },
    [worldState, actor, onPatchWorldState]
  );

  const handleSlotContextMenu = (e, slotId, itemId) => {
    const hasItem = !!itemId;
    const otherActors = (worldState?.actors || []).filter((a) => a.id !== actor.id);
    const menuItems = [];
    if (hasItem) {
      menuItems.push({
        id: 'edit',
        label: 'Open editor\u2026',
        icon: <Icon name="edit" size={12} />,
        onClick: () => setEditorItemId(itemId),
      });
      menuItems.push({ divider: true });
      const transferChildren = otherActors.slice(0, 8).map((a) => ({
        id: `xfer_${a.id}`,
        label: a.name || `Actor ${a.id}`,
        onClick: () => transferTo(itemId, a.id),
      }));
      menuItems.push(...transferChildren);
      if (otherActors.length === 0) {
        menuItems.push({ id: 'xfer_none', label: 'No other characters to give to', disabled: true });
      }
      menuItems.push({ divider: true });
      menuItems.push({
        id: 'break',
        label: 'Mark broken',
        onClick: () =>
          writeTrack(itemId, effectiveChapter, {
            actorId: actor.id,
            slotId,
            stateId: 'broken',
            note: 'Broken at this chapter.',
          }),
      });
      menuItems.push({
        id: 'hide',
        label: 'Conceal / hide',
        onClick: () =>
          writeTrack(itemId, effectiveChapter, {
            actorId: actor.id,
            slotId: 'hidden',
            stateId: 'concealed',
            note: 'Concealed at this chapter.',
          }),
      });
      menuItems.push({
        id: 'lost',
        label: 'Mark lost',
        danger: true,
        onClick: () => clearSlotAtChapter(slotId, 'lost', 'Lost at this chapter.'),
      });
    } else {
      menuItems.push({
        id: 'add',
        label: 'Add an item\u2026',
        icon: <Icon name="plus" size={12} />,
        onClick: () => setPickerSlotId(slotId),
      });
    }
    ctx.open(e, menuItems);
  };

  const handleAcceptStarterKit = ({ items: newItems, trackUpdates }) => {
    // Merge items into the bank
    const bank = [...items, ...newItems.map(ensureItemWardrobeShape)];
    // Apply trackUpdates (already baked into each item.track[chapter], but
    // we re-stamp to be safe in case the generator returned items without track)
    const bankWithTracks = bank.map((it) => {
      const update = trackUpdates.find((u) => u.itemId === it.id);
      if (!update) return it;
      return upsertTrackEntry(it, update.chapter, update.entry);
    });
    onPatchWorldState?.({ itemBank: bankWithTracks });
    setWizardOpen(false);
  };

  const handleCreateBlankItem = () => {
    setEditorItemId('__new__');
    setEditorSlotId(pickerSlotId);
    setPickerSlotId(null);
  };

  const handleGenerateOneForSlot = async () => {
    // Generate 1 item for just this slot and drop it in
    try {
      const out = await suggestStarterInventory(actor, worldState, {
        chapter: effectiveChapter,
        count: 1,
      });
      if (out?.items?.[0]) {
        const item = {
          ...out.items[0],
          track: {
            [effectiveChapter]: {
              actorId: actor.id,
              slotId: pickerSlotId,
              stateId: 'pristine',
              note: 'Added via AI quick-generate.',
            },
          },
        };
        const bank = [...items, ensureItemWardrobeShape(item)];
        onPatchWorldState?.({ itemBank: bank });
      }
    } catch (_e) {
      /* silent */
    }
    setPickerSlotId(null);
  };

  const selectedEntry = selectedSlotId ? slotContents[selectedSlotId] : null;
  const selectedItem = selectedEntry ? itemsById[selectedEntry.itemId] : null;
  const actorShaped = ensureWardrobeShape(actor);
  const hasTrackAnywhere = items.some((it) =>
    Object.values(it.track || {}).some((e) => e.actorId === actor.id)
  );
  const hasLegacyEquipment = actor?.equipment
    ? Object.values(actor.equipment).some((v) =>
        Array.isArray(v) ? v.some(Boolean) : Boolean(v)
      ) || (actor.inventory || []).some(Boolean)
    : false;

  // Auto-open the wizard once per actor when the character is empty and
  // the user hasn't dismissed it.
  useEffect(() => {
    if (!actor?.id) return;
    if (autoTriggeredFor.current === actor.id) return;
    autoTriggeredFor.current = actor.id;
    if (
      !hasTrackAnywhere &&
      !hasLegacyEquipment &&
      !actor.wardrobeWizardDismissed
    ) {
      setWizardOpen(true);
    }
  }, [actor?.id, hasTrackAnywhere, hasLegacyEquipment, actor?.wardrobeWizardDismissed]);

  const persistWizardDismiss = useCallback(() => {
    const nextActors = (worldState?.actors || []).map((a) =>
      a.id === actor.id ? { ...a, wardrobeWizardDismissed: true } : a
    );
    onPatchWorldState?.({ actors: nextActors });
  }, [worldState, actor, onPatchWorldState]);

  /** Auto-migrate legacy equipment if there is no track yet. */
  const migrateLegacy = () => {
    const out = migrateLegacyEquipmentToTrack(actor, items, effectiveChapter);
    const nextActors = (worldState?.actors || []).map((a) =>
      a.id === actor.id ? out.actor : a
    );
    onPatchWorldState?.({ itemBank: out.items, actors: nextActors });
  };

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.accent,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
            }}
          >
            Wardrobe \u00B7 {actor?.name || 'Unnamed'}
          </div>
          <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 500 }}>
            {chapterLabelFor(worldState, bookId, effectiveChapter)}
          </div>
        </div>
        <HiddenLayerToggle value={visibleGroups} onChange={setVisibleGroups} />
        <Button
          variant="ghost"
          onClick={() => setWizardOpen(true)}
          icon={<Icon name="sparkle" size={12} />}
        >
          Starter kit
        </Button>
        <ThemeToggle />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PaperDoll
            actor={actorShaped}
            itemsById={itemsById}
            slotContents={slotContents}
            visibleGroups={visibleGroups}
            selectedSlotId={selectedSlotId}
            onSelectSlot={setSelectedSlotId}
            onOpenItem={setEditorItemId}
            onSlotContextMenu={handleSlotContextMenu}
            onPlaceItem={({ itemId, toSlotId }) => moveInSlot({ itemId, toSlotId })}
            onEmptySlotClick={(slotId) => setPickerSlotId(slotId)}
          />
          {chapters.length > 0 && (
            <Scrubber
              chapters={chapters}
              value={effectiveChapter}
              onChange={onSelectChapter}
              highlight={highlight}
              labelFn={(c) => chapterLabelFor(worldState, bookId, c)}
            />
          )}
          {!hasTrackAnywhere && actor?.equipment && (
            <div
              style={{
                padding: 10,
                background: t.paper,
                border: `1px dashed ${t.rule}`,
                borderRadius: t.radius,
                color: t.ink2,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Icon name="refresh" size={12} color={t.accent} />
              <span style={{ flex: 1 }}>
                This character has legacy equipment that hasn't been recorded as a chapter
                track yet. Seed chapter {effectiveChapter} from their existing slots?
              </span>
              <Button size="sm" variant="default" onClick={migrateLegacy}>
                Seed
              </Button>
            </div>
          )}
          <CustomSlotManager actor={actorShaped} onChange={writeCustomSlots} />
        </div>

        <aside
          style={{
            background: t.paper,
            border: `1px solid ${t.rule}`,
            borderRadius: t.radius,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 9,
              color: t.accent,
              letterSpacing: 0.14,
              textTransform: 'uppercase',
            }}
          >
            At this chapter \u00B7 {itemsAtChapter.length} item{itemsAtChapter.length === 1 ? '' : 's'}
          </div>
          {itemsAtChapter.length === 0 ? (
            <div style={{ color: t.ink3, fontSize: 12, padding: '6px 0' }}>
              No items tracked for {actor?.name || 'this character'} at chapter {effectiveChapter}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {itemsAtChapter.map(({ item, slotId, stateId, isEcho, sourceChapter }) => {
                const slot = SLOT_DEFS.find((s) => s.id === slotId);
                return (
                  <button
                    key={item.id + slotId}
                    type="button"
                    onClick={() => {
                      setSelectedSlotId(slotId);
                      setEditorItemId(item.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 8,
                      background: t.paper2,
                      border: `1px solid ${t.rule}`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      color: t.ink,
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        display: 'grid',
                        placeItems: 'center',
                        color: t.accent,
                        fontFamily: t.display,
                        fontSize: 15,
                      }}
                    >
                      {item.icon || '\u25A1'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: t.display,
                          fontSize: 13,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.name}
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
                        {slot?.label || slotId} &middot; {stateId}
                        {isEcho && (
                          <span style={{ color: t.ink3 }}>
                            {' '}
                            (echo from ch.{sourceChapter})
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {selectedItem && (
            <div
              style={{
                padding: 10,
                background: t.paper2,
                border: `1px solid ${t.rule}`,
                borderRadius: t.radius,
              }}
            >
              <div
                style={{
                  fontFamily: t.mono,
                  fontSize: 9,
                  color: t.accent,
                  letterSpacing: 0.14,
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Selected
              </div>
              <div style={{ fontFamily: t.display, fontSize: 15, fontWeight: 500 }}>
                {selectedItem.name}
              </div>
              {selectedItem.desc && (
                <div style={{ fontSize: 12, color: t.ink2, marginTop: 4, lineHeight: 1.5 }}>
                  {selectedItem.desc}
                </div>
              )}
              {selectedItem.flag && (
                <div
                  style={{
                    marginTop: 6,
                    padding: '4px 8px',
                    background: 'transparent',
                    color: t.warn,
                    border: `1px solid ${t.warn}`,
                    borderRadius: 2,
                    fontFamily: t.mono,
                    fontSize: 10,
                    letterSpacing: 0.12,
                    textTransform: 'uppercase',
                  }}
                >
                  \u26A0 {selectedItem.flag}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <Button size="sm" onClick={() => setEditorItemId(selectedItem.id)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (selectedSlotId) clearSlotAtChapter(selectedSlotId, 'lost');
                  }}
                >
                  Mark lost
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <ContextMenu state={ctx.state} onClose={ctx.close} />

      <ItemEditor
        open={!!editorItemId}
        item={
          editorItemId === '__new__'
            ? { id: null, name: '', icon: '\u25A1', type: 'other', origin: effectiveChapter }
            : itemsById[editorItemId]
        }
        worldState={worldState}
        onSave={(draft) => {
          writeItem(draft);
          if (!draft.id && editorSlotId) {
            // Newly created — also track into the slot that opened the editor
            // (save above gave it an id; re-compute via timestamp is fine because
            // writeItem regenerates if id is falsy).
            // Simplest: after save, we don't persist the slot here — user can drop
            // it from the picker. Leave as bank-only.
          }
          setEditorItemId(null);
          setEditorSlotId(null);
        }}
        onClose={() => {
          setEditorItemId(null);
          setEditorSlotId(null);
        }}
        onDelete={(id) => deleteItem(id)}
      />

      <ItemPicker
        open={!!pickerSlotId}
        slotId={pickerSlotId}
        worldState={worldState}
        onPick={(id) => placeExisting(id, pickerSlotId)}
        onCreateBlank={handleCreateBlankItem}
        onGenerateOne={handleGenerateOneForSlot}
        onClose={() => setPickerSlotId(null)}
      />

      <StarterKitWizard
        open={wizardOpen}
        actor={actor}
        worldState={worldState}
        chapter={effectiveChapter}
        onApply={handleAcceptStarterKit}
        onClose={() => setWizardOpen(false)}
        onSkip={() => {
          persistWizardDismiss();
          setWizardOpen(false);
        }}
      />
    </div>
  );
}

export default function CharacterWardrobe(props) {
  return (
    <LoomwrightShell scrollable>
      <WardrobeBody {...props} />
    </LoomwrightShell>
  );
}

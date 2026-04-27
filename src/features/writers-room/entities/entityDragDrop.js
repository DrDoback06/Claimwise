import { rid } from '../store/mutators';

function appendAudit(setSlice, entry) {
  setSlice('entityAudit', xs => [...(Array.isArray(xs) ? xs : []), { id: rid('audit'), createdAt: Date.now(), ...entry }]);
}

function appendEvent(setSlice, event) {
  setSlice('entityEvents', xs => [...(Array.isArray(xs) ? xs : []), { id: rid('ev'), createdAt: Date.now(), status: 'committed', ...event }]);
}

export function handleDropEntityOnInventory(store, { itemId, characterId, chapterId = null }) {
  if (!store || !itemId || !characterId) return;
  store.transaction(({ setSlice }) => {
    setSlice('items', xs => (xs || []).map(it => it.id === itemId ? { ...it, owner: characterId } : it));
    appendEvent(setSlice, {
      eventType: 'item-owner-corrected',
      label: 'Transferred',
      summary: 'Manual correction: item assigned to character inventory.',
      chapterId,
      entities: [
        { entityId: itemId, entityType: 'item', role: 'item' },
        { entityId: characterId, entityType: 'character', role: 'owner' },
      ],
      riskBand: 'green',
      confidence: 1,
      source: 'drag-drop',
      appliedAt: Date.now(),
    });
    appendAudit(setSlice, { action: 'drop-item-inventory', itemId, characterId, chapterId });
  });
}

export function handleDropEntityOnQuest(store, { entityId, entityType, questId, chapterId = null }) {
  if (!store || !questId || !entityId) return;
  store.transaction(({ setSlice }) => {
    appendEvent(setSlice, {
      eventType: 'entity-linked-to-quest',
      label: 'Linked',
      summary: `Manual correction: linked ${entityType} to quest.`,
      chapterId,
      entities: [
        { entityId, entityType, role: 'linked' },
        { entityId: questId, entityType: 'quest', role: 'quest' },
      ],
      riskBand: 'green',
      confidence: 1,
      source: 'drag-drop',
      appliedAt: Date.now(),
    });
    appendAudit(setSlice, { action: 'drop-entity-quest', entityId, entityType, questId, chapterId });
  });
}

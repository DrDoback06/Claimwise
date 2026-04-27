// Navigation helpers to avoid scattering tab/selection logic.

export function openEntity({ store, select, entityType, entityId }) {
  if (!store || !select || !entityType || !entityId) return;
  const panelByType = {
    character: 'cast',
    place: 'atlas',
    item: 'items',
    quest: 'quests',
    skill: 'skills',
  };
  const panel = panelByType[entityType];
  if (panel) {
    store.setSlice('ui', ui => {
      const panels = Array.isArray(ui?.panels) ? ui.panels : [];
      return panels.includes(panel) ? ui : { ...(ui || {}), panels: [...panels, panel] };
    });
  }
  select(entityType === 'place' ? 'place' : entityType, entityId);
}

export function openChapterAtEvidence({ store, chapterId, paragraphId, startOffset, endOffset }) {
  if (!store || !chapterId) return;
  store.setPath('book.currentChapterId', chapterId);
  store.setPath('ui.activeChapterId', chapterId);
  store.setPath('ui.selection.chapter', chapterId);
  store.setPath('ui.selection.paragraph', paragraphId ?? null);
  store.setPath('ui.evidenceJump', {
    chapterId,
    paragraphId: paragraphId ?? null,
    startOffset: startOffset ?? null,
    endOffset: endOffset ?? null,
    jumpedAt: Date.now(),
  });
}

export function getEntityEvents(state, entityType, entityId) {
  const events = Array.isArray(state?.entityEvents) ? state.entityEvents : [];
  return events
    .filter(ev => (ev.entities || []).some(e => e.entityType === entityType && e.entityId === entityId))
    .sort((a, b) => (a.appliedAt || a.createdAt || 0) - (b.appliedAt || b.createdAt || 0));
}

export function getEntityMentions(state, entityType, entityId) {
  const mentions = Array.isArray(state?.entityMentions) ? state.entityMentions : [];
  return mentions
    .filter(m => m.entityType === entityType && m.entityId === entityId)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

export function getEntityCurrentState(state, entityType, entityId) {
  const events = getEntityEvents(state, entityType, entityId);
  const out = {};
  for (const ev of events) {
    for (const sc of ev.stateChanges || []) {
      if (sc?.field) out[sc.field] = sc.after;
    }
  }
  return out;
}

export function getEntityLinkedEntities(state, entityType, entityId) {
  const links = Array.isArray(state?.entityLinks) ? state.entityLinks : [];
  return links.filter(link =>
    (link.fromEntityType === entityType && link.fromEntityId === entityId) ||
    (link.toEntityType === entityType && link.toEntityId === entityId)
  );
}

export function getChapterEvidence(state, chapterId, paragraphId) {
  const chapter = state?.chapters?.[chapterId];
  if (!chapter) return null;
  const paragraphs = String(chapter.text || '').split(/\n{2,}/g);
  if (paragraphId == null) return { chapter, paragraph: null };
  return { chapter, paragraph: paragraphs[paragraphId] || null };
}

import { classifyRiskBand } from '../ai/riskBands';

function rid(prefix = 'ee') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function buildEntityEventFromFinding(finding, state, extras = {}) {
  const confidence = Number(finding?.confidence ?? 0.7);
  const risk = classifyRiskBand({
    confidence,
    eventType: finding?.eventType || finding?.sourceType || finding?.kind,
    consequence: finding?.consequence || 'low',
    isCanonChanging: Boolean(finding?.canonRisk),
  });

  const label = finding?.label || defaultLabelForFinding(finding);
  const summary = finding?.summary || finding?.notes || `${finding?.name || 'Unnamed entity'} updated.`;
  const entities = normalizeEntities(finding, state);

  return {
    id: rid('ev'),
    eventType: finding?.eventType || finding?.sourceType || `${finding?.kind || 'entity'}-update`,
    label,
    summary,
    chapterId: finding?.chapterId || null,
    paragraphId: finding?.paragraphId || null,
    evidence: finding?.evidence || {
      quote: finding?.sourceQuote || '',
      startOffset: finding?.startOffset ?? null,
      endOffset: finding?.endOffset ?? null,
    },
    entities,
    stateChanges: Array.isArray(finding?.stateChanges) ? finding.stateChanges : [],
    riskBand: finding?.riskBand || risk.id,
    riskReason: risk.reason,
    confidence,
    source: finding?.source || 'pipeline',
    status: extras.status || (finding?.autoApplied ? 'auto-applied' : 'pending'),
    queueItemId: finding?.id || null,
    createdAt: Date.now(),
    appliedAt: extras.applied ? Date.now() : null,
  };
}

export function buildMentionEvent(entity, chapterId, evidence = {}) {
  return {
    id: rid('ev'),
    eventType: 'mention',
    label: 'Mentioned',
    summary: `${entity?.name || 'Entity'} mentioned in chapter.`,
    chapterId: chapterId || null,
    paragraphId: evidence?.paragraphId || null,
    evidence,
    entities: entity?.id ? [{ entityId: entity.id, entityType: entity.type || 'unknown', role: 'subject' }] : [],
    stateChanges: [],
    riskBand: 'blue',
    confidence: evidence?.confidence ?? 0.95,
    source: 'mention-builder',
    status: 'committed',
    createdAt: Date.now(),
    appliedAt: Date.now(),
  };
}

function normalizeEntities(finding, state) {
  if (Array.isArray(finding?.entities) && finding.entities.length) {
    return finding.entities.map(e => ({
      entityId: e.entityId || e.id || null,
      entityType: e.entityType || e.type || 'unknown',
      role: e.role || 'related',
      name: e.name || null,
    }));
  }
  if (finding?.resolvesTo) {
    return [{ entityId: finding.resolvesTo, entityType: finding.kind || 'unknown', role: 'subject', name: finding.name || null }];
  }
  const id = resolveByName(finding?.kind, finding?.name, state);
  if (!id) return [];
  return [{ entityId: id, entityType: finding.kind || 'unknown', role: 'subject', name: finding.name || null }];
}

function resolveByName(kind, name, state) {
  if (!kind || !name) return null;
  const map = {
    character: 'cast',
    place: 'places',
    item: 'items',
    quest: 'quests',
    thread: 'quests',
    skill: 'skills',
  };
  const slice = map[kind];
  const arr = Array.isArray(state?.[slice]) ? state[slice] : [];
  const hit = arr.find(x => String(x.name || x.title || '').toLowerCase() === String(name).toLowerCase());
  return hit?.id || null;
}

function defaultLabelForFinding(finding) {
  if (!finding) return 'Updated';
  if (finding.sourceType === 'stat-change') return 'Stat changed';
  if (finding.sourceType === 'skill-change') return 'Skill change';
  if (finding.sourceType === 'relationship-change') return 'Relationship changed';
  if (finding.sourceType === 'quest-involvement') return 'Quest link';
  if (finding.kind === 'item') return finding.status === 'known' ? 'Mentioned' : 'Inception';
  if (finding.kind === 'character') return finding.status === 'known' ? 'Appeared' : 'Introduced';
  return 'Updated';
}

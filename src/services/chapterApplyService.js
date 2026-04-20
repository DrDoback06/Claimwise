/**
 * chapterApplyService - bridges chapter extraction output onto the actor
 * records so the Cast, Libraries, Skill Trees and Atlas all auto-populate.
 *
 * Before this service: `chapterIngestionOrchestrator` dumped every skill /
 * stat / relationship / item change into the `manuscriptSuggestions` review
 * queue and nothing touched the actor store until the author manually
 * approved each row. Characters picked up items in the prose but never on
 * the profile, skill trees showed empty, relationships weren't linked.
 *
 * Now: for any extracted row with confidence >= threshold AND a resolvable
 * owner, we patch the actor record directly AND write a matching
 * timelineEvents row so the chapter-ring visualisations still work. Lower
 * confidence rows still fall through to the review queue so nothing is
 * silently applied when the model is unsure.
 */

import db from './database';
import entityMatchingService from './entityMatchingService';

const DEFAULT_THRESHOLD = 0.8;

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Resolve a name against the given list using the matching service plus a
// direct alias lookup so nicknames saved via the wizard work too.
async function resolveActor(name, actors) {
  if (!name || !Array.isArray(actors) || actors.length === 0) return null;
  const match = entityMatchingService.findMatchingActor(name, actors, 0.7);
  if (match?.actor) return match.actor;
  // Fallback to persisted alias map (populated by EntityExtractionWizard).
  const targetId = await entityMatchingService.resolveAlias(name, 'actor');
  if (targetId) return actors.find((a) => a.id === targetId) || null;
  return null;
}

async function resolveSkill(name, skills) {
  if (!name || !Array.isArray(skills) || skills.length === 0) return null;
  const match = entityMatchingService.findMatchingSkill(name, skills, 0.75);
  if (match?.skill) return match.skill;
  const id = await entityMatchingService.resolveAlias(name, 'skill');
  return id ? (skills.find((s) => s.id === id) || null) : null;
}

async function resolveItem(name, items) {
  if (!name || !Array.isArray(items) || items.length === 0) return null;
  const match = entityMatchingService.findMatchingItem(name, items, 0.75);
  if (match?.item) return match.item;
  const id = await entityMatchingService.resolveAlias(name, 'item');
  return id ? (items.find((i) => i.id === id) || null) : null;
}

function actionToValue(action, level) {
  // Map the extractor's verb vocabulary onto a numeric skill level.
  const lvl = typeof level === 'number' ? level : 1;
  switch ((action || '').toLowerCase()) {
    case 'mastered': return Math.max(4, lvl);
    case 'improved': return Math.max(2, lvl);
    case 'gained':
    case 'learned':
    case 'discovered':
    case 'acquired':
    case 'unlocked':
    default:
      return Math.max(1, lvl);
  }
}

function upsertActiveSkill(activeSkills, skillId, targetVal) {
  const list = Array.isArray(activeSkills) ? [...activeSkills] : [];
  const existingIdx = list.findIndex((s) =>
    (typeof s === 'string' ? s === skillId : s?.id === skillId)
  );
  if (existingIdx === -1) {
    list.push({ id: skillId, val: targetVal });
    return list;
  }
  const existing = list[existingIdx];
  const currentVal = typeof existing === 'string' ? 1 : (existing.val || 1);
  // Only bump; never downgrade a skill the actor already has.
  list[existingIdx] = { id: skillId, val: Math.max(currentVal, targetVal) };
  return list;
}

async function writeTimelineEvent(event) {
  try {
    await db.add('timelineEvents', event);
  } catch (err) {
    // timelineEvents uses id as keyPath - duplicate id would fail. Re-try
    // with a new suffix once before giving up.
    try {
      await db.add('timelineEvents', { ...event, id: uid(event.id?.split('_')?.[0] || 'evt') });
    } catch (inner) {
      console.warn('[chapterApplyService] writeTimelineEvent failed:', inner?.message || inner);
    }
  }
}

/**
 * applyExtractionToActors
 *
 * Takes the outputs of chapterDataExtractionService.* and, for high-confidence
 * matches, patches the relevant actor records directly. Returns a small stats
 * object so callers can log / toast what happened.
 */
export async function applyExtractionToActors({
  entities = null,                 // extractEntitiesFromChapter result
  characterData = null,            // extractCharacterDataFromChapter result
  chapterId = null,
  bookId = null,
  chapterNumber = null,
  confidenceThreshold = DEFAULT_THRESHOLD,
} = {}) {
  const stats = {
    skillsAssigned: 0,
    itemsAssigned: 0,
    statChangesApplied: 0,
    relationshipsUpserted: 0,
    appearancesRecorded: 0,
    quotedLinesCaptured: 0,
    deferred: 0,
    errors: 0,
  };

  const [actors, itemBank, skillBank] = await Promise.all([
    db.getAll('actors').catch(() => []),
    db.getAll('itemBank').catch(() => []),
    db.getAll('skillBank').catch(() => []),
  ]);

  // Mutations are staged per actor so we only write once per actor even when
  // multiple rows touch the same record.
  const actorPatches = new Map(); // actorId -> mutable patch object

  const stageActor = (actor) => {
    if (!actor) return null;
    if (!actorPatches.has(actor.id)) {
      actorPatches.set(actor.id, {
        ...actor,
        activeSkills: Array.isArray(actor.activeSkills) ? [...actor.activeSkills] : [],
        inventory: Array.isArray(actor.inventory) ? [...actor.inventory] : [],
        appearances: { ...(actor.appearances || {}) },
        snapshots: { ...(actor.snapshots || {}) },
        baseStats: { ...(actor.baseStats || {}) },
        nicknames: Array.isArray(actor.nicknames) ? [...actor.nicknames] : [],
        biographyChapters: Array.isArray(actor.biographyChapters) ? [...actor.biographyChapters] : [],
        relationshipIds: Array.isArray(actor.relationshipIds) ? [...actor.relationshipIds] : [],
      });
    }
    return actorPatches.get(actor.id);
  };

  // ----- Skills ---------------------------------------------------------
  const skillChanges = characterData?.skillChanges || [];
  for (const change of skillChanges) {
    if ((change.confidence ?? 1) < confidenceThreshold) {
      stats.deferred += 1;
      continue;
    }
    const actor = await resolveActor(change.character, actors);
    const skill = await resolveSkill(change.skill, skillBank);
    if (!actor || !skill) {
      stats.deferred += 1;
      continue;
    }
    const patch = stageActor(actor);
    const val = actionToValue(change.action, change.level);
    patch.activeSkills = upsertActiveSkill(patch.activeSkills, skill.id, val);
    stats.skillsAssigned += 1;
    await writeTimelineEvent({
      id: uid('tle_skill'),
      type: 'skill_event',
      chapterId,
      bookId,
      chapterNumber,
      actorIds: [actor.id],
      actorId: actor.id,
      skillId: skill.id,
      action: change.action || 'gained',
      level: val,
      description: `${actor.name} ${change.action || 'gained'} ${skill.name}`,
      createdAt: Date.now(),
      confidence: change.confidence || 0.9,
      source: 'chapterApplyService',
    });
  }

  // Items: the extractor now tags items with ownerName when obvious, so we
  // can wire them straight onto the character's inventory. Low-confidence or
  // owner-less items skip the auto-assign and stay as a suggestion. We also
  // stamp `item.track[chapterId]` so the Inventory Matrix view picks the
  // pickup up without extra plumbing.
  const itemPatches = new Map(); // itemId -> mutable patch
  const stageItem = (item) => {
    if (!item) return null;
    if (!itemPatches.has(item.id)) {
      itemPatches.set(item.id, { ...item, track: { ...(item.track || {}) } });
    }
    return itemPatches.get(item.id);
  };

  const extractedItems = entities?.items || [];
  for (const row of extractedItems) {
    if (!row.ownerName) continue;
    if ((row.confidence ?? 1) < confidenceThreshold) {
      stats.deferred += 1;
      continue;
    }
    const actor = await resolveActor(row.ownerName, actors);
    const item = await resolveItem(row.name, itemBank);
    if (!actor || !item) {
      stats.deferred += 1;
      continue;
    }
    const patch = stageActor(actor);
    // Inventory uses id-or-object style across the app; normalise to
    // { id, acquiredChapter } objects for new entries. De-dupe by id.
    const already = patch.inventory.some((entry) =>
      (typeof entry === 'string' ? entry : entry?.id) === item.id
    );
    if (!already) {
      patch.inventory.push({ id: item.id, acquiredChapter: chapterId || null });
      stats.itemsAssigned += 1;
      // Mirror onto the item's own track so InventoryMatrix / ProvenancePane
      // show the pickup without another backfill pass.
      if (chapterId != null) {
        const ipatch = stageItem(item);
        ipatch.track[chapterId] = {
          ...(ipatch.track[chapterId] || {}),
          actorId: actor.id,
          stateId: ipatch.track[chapterId]?.stateId || 'carried',
          note: `Picked up by ${actor.name} (auto)`,
          at: Date.now(),
        };
      }
      await writeTimelineEvent({
        id: uid('tle_item'),
        type: 'item_event',
        chapterId,
        bookId,
        chapterNumber,
        actorIds: [actor.id],
        actorId: actor.id,
        itemId: item.id,
        action: 'acquired',
        description: `${actor.name} acquired ${item.name}`,
        createdAt: Date.now(),
        confidence: row.confidence || 0.9,
        source: 'chapterApplyService',
      });
    }
  }

  // Skills-from-entities: the entity extractor also reports skills with
  // ownerName; treat those the same way as the richer skillChanges rows so
  // the author doesn't have to rely on the deeper extraction pipeline just
  // to auto-assign.
  const extractedSkills = entities?.skills || [];
  for (const row of extractedSkills) {
    if (!row.ownerName) continue;
    if ((row.confidence ?? 1) < confidenceThreshold) continue;
    const actor = await resolveActor(row.ownerName, actors);
    const skill = await resolveSkill(row.name, skillBank);
    if (!actor || !skill) continue;
    const patch = stageActor(actor);
    const before = patch.activeSkills.length;
    patch.activeSkills = upsertActiveSkill(patch.activeSkills, skill.id, 1);
    if (patch.activeSkills.length !== before) {
      stats.skillsAssigned += 1;
      await writeTimelineEvent({
        id: uid('tle_skill'),
        type: 'skill_event',
        chapterId,
        bookId,
        chapterNumber,
        actorIds: [actor.id],
        actorId: actor.id,
        skillId: skill.id,
        action: 'gained',
        level: 1,
        description: `${actor.name} gained ${skill.name}`,
        createdAt: Date.now(),
        confidence: row.confidence || 0.9,
        source: 'chapterApplyService',
      });
    }
  }

  // ----- Stat deltas ----------------------------------------------------
  const statChanges = characterData?.statChanges || [];
  for (const change of statChanges) {
    if ((change.confidence ?? 1) < confidenceThreshold) {
      stats.deferred += 1;
      continue;
    }
    const actor = await resolveActor(change.character, actors);
    if (!actor || !change.changes) continue;
    const patch = stageActor(actor);
    for (const [stat, delta] of Object.entries(change.changes)) {
      const num = Number(delta);
      if (!Number.isFinite(num) || num === 0) continue;
      const key = String(stat).toUpperCase();
      patch.baseStats[key] = (patch.baseStats[key] || 0) + num;
    }
    // Record a snapshot so undo / diff UIs can show the before/after.
    if (chapterId != null) {
      patch.snapshots[chapterId] = {
        ...(patch.snapshots[chapterId] || {}),
        statDelta: change.changes,
        at: Date.now(),
      };
    }
    stats.statChangesApplied += 1;
  }

  // ----- Appearances ----------------------------------------------------
  const appearances = characterData?.appearances || [];
  for (const app of appearances) {
    const actor = await resolveActor(app.character, actors);
    if (!actor || chapterId == null) continue;
    const patch = stageActor(actor);
    patch.appearances[chapterId] = true;
    patch.snapshots[chapterId] = {
      ...(patch.snapshots[chapterId] || {}),
      appeared: true,
      firstMention: !!app.firstMention,
    };
    stats.appearancesRecorded += 1;
  }

  // ----- Flush actor + item patches -------------------------------------
  for (const patch of actorPatches.values()) {
    try {
      await db.update('actors', patch);
    } catch (err) {
      stats.errors += 1;
      console.warn('[chapterApplyService] actor update failed:', patch?.id, err?.message || err);
    }
  }
  for (const patch of itemPatches.values()) {
    try {
      await db.update('itemBank', patch);
    } catch (err) {
      stats.errors += 1;
      console.warn('[chapterApplyService] item update failed:', patch?.id, err?.message || err);
    }
  }

  // ----- Relationships (separate store) ---------------------------------
  const relationshipChanges = characterData?.relationshipChanges || [];
  if (relationshipChanges.length > 0) {
    const existingRels = await db.getAll('relationships').catch(() => []);
    for (const change of relationshipChanges) {
      if ((change.confidence ?? 1) < confidenceThreshold) {
        stats.deferred += 1;
        continue;
      }
      const a = await resolveActor(change.character1, actors);
      const b = await resolveActor(change.character2, actors);
      if (!a || !b) continue;
      // Canonicalise the pair so we don't store A->B and B->A as separate rows.
      const [left, right] = a.id < b.id ? [a, b] : [b, a];
      const existing = existingRels.find(
        (r) => (r.actorA === left.id && r.actorB === right.id) ||
               (r.actorA === right.id && r.actorB === left.id)
      );
      const record = existing
        ? {
          ...existing,
          lastChapter: chapterId,
          lastChange: change.change || existing.lastChange || '',
          history: [...(existing.history || []), { chapterId, change: change.change }].slice(-20),
        }
        : {
          id: uid('rel'),
          actorA: left.id,
          actorB: right.id,
          kind: change.kind || 'relationship',
          strength: typeof change.strength === 'number' ? change.strength : 0.5,
          lastChapter: chapterId,
          lastChange: change.change || '',
          history: [{ chapterId, change: change.change || '' }],
          createdAt: Date.now(),
        };
      try {
        if (existing) await db.update('relationships', record);
        else await db.add('relationships', record);
        stats.relationshipsUpserted += 1;
      } catch (err) {
        stats.errors += 1;
        console.warn('[chapterApplyService] relationship upsert failed:', err?.message || err);
      }
    }
  }

  return stats;
}

const chapterApplyService = { applyExtractionToActors };
export default chapterApplyService;

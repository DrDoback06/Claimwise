/**
 * legacyMigration - promote per-actor inventory/skill references into the
 * global item / skill banks.
 *
 * Motivation: pre-Loomwright actors were created with `actor.inventory[]`
 * carrying either item ids or plain strings, and `actor.activeSkills[]` /
 * `actor.unlockedSkills[]` pointing at ids that never existed in
 * `skillBank`. That leaves the bank views empty while the character
 * detail shows all the content.
 *
 * This sweep runs once per install (guarded by `meta.legacyMigrationDone`)
 * and is idempotent: rerunning it just does nothing because the dedupe
 * by-id + by-name skip of existing bank entries always filters out what
 * was already promoted.
 *
 * The migration updates IndexedDB directly AND returns the new bank
 * arrays so `App.loadWorld()` can fold them straight into `worldState`
 * without a second round-trip.
 */

import db from './database';

const MIGRATION_FLAG = 'legacyMigrationDone';

function normaliseInventoryEntry(entry, index) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    return {
      kind: 'from-string',
      id: `item_legacy_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
      name: entry,
    };
  }
  if (typeof entry === 'object') {
    return {
      kind: 'from-object',
      id: entry.id || `item_legacy_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
      name: entry.name || `Legacy item ${index + 1}`,
      payload: entry,
    };
  }
  return null;
}

async function readMeta() {
  try {
    const rows = await db.getAll('meta');
    return Array.isArray(rows) && rows[0] ? rows[0] : { id: 1 };
  } catch {
    return { id: 1 };
  }
}

async function writeMetaFlag(meta, flag = true) {
  const next = { ...(meta || { id: 1 }), id: meta?.id || 1, [MIGRATION_FLAG]: flag };
  try { await db.update('meta', next); } catch (_e) { /* noop */ }
  return next;
}

export async function runLegacyMigration() {
  const meta = await readMeta();
  if (meta[MIGRATION_FLAG]) return { skipped: true };

  const actors = await db.getAll('actors').catch(() => []);
  const itemBank = await db.getAll('itemBank').catch(() => []);
  const skillBank = await db.getAll('skillBank').catch(() => []);

  const existingItemIds = new Set(itemBank.map((i) => i.id).filter(Boolean));
  const existingItemNames = new Set(
    itemBank.map((i) => (i.name || '').toLowerCase()).filter(Boolean),
  );
  const existingSkillIds = new Set(skillBank.map((s) => s.id).filter(Boolean));

  const newItems = [];
  const newSkills = [];
  const actorPatches = [];

  actors.forEach((actor) => {
    let touched = false;
    const nextInventory = [];

    (actor.inventory || []).forEach((entry, idx) => {
      const parsed = normaliseInventoryEntry(entry, idx);
      if (!parsed) return;

      if (parsed.kind === 'from-string') {
        // Only promote when no existing bank entry already matches the
        // string by name (cheap user intent heuristic).
        if (existingItemNames.has(parsed.name.toLowerCase())) {
          // Rewire this inventory entry to the existing bank item's id.
          const match = itemBank.find((i) => (i.name || '').toLowerCase() === parsed.name.toLowerCase());
          if (match) {
            nextInventory.push(match.id);
            touched = true;
            return;
          }
        }
        const newItem = {
          id: parsed.id,
          name: parsed.name,
          type: 'item',
          source: 'legacy-migration',
          stats: {},
          grantsSkills: [],
          createdAt: Date.now(),
        };
        newItems.push(newItem);
        existingItemIds.add(newItem.id);
        existingItemNames.add(newItem.name.toLowerCase());
        nextInventory.push(newItem.id);
        touched = true;
        return;
      }

      // from-object case
      if (existingItemIds.has(parsed.id)) {
        nextInventory.push(parsed.id);
        return;
      }
      // Object carried its own fields; merge-safe copy into bank.
      const payload = parsed.payload || {};
      const newItem = {
        id: parsed.id,
        name: parsed.name,
        type: payload.type || payload.kind || 'item',
        desc: payload.desc || payload.description || '',
        rarity: payload.rarity || 'Common',
        stats: payload.stats || {},
        grantsSkills: payload.grantsSkills || [],
        track: payload.track || {},
        source: 'legacy-migration',
        createdAt: payload.createdAt || Date.now(),
      };
      newItems.push(newItem);
      existingItemIds.add(newItem.id);
      existingItemNames.add((newItem.name || '').toLowerCase());
      nextInventory.push(newItem.id);
      touched = true;
    });

    // Promote any referenced-but-missing skill ids into skillBank.
    const missingSkillIds = new Set();
    (actor.activeSkills || []).forEach((ref) => {
      const id = ref?.id || (typeof ref === 'string' ? ref : null);
      if (id && !existingSkillIds.has(id)) missingSkillIds.add(id);
    });
    (actor.unlockedSkills || []).forEach((id) => {
      if (id && !existingSkillIds.has(id)) missingSkillIds.add(id);
    });
    missingSkillIds.forEach((id) => {
      const newSkill = {
        id,
        name: id.startsWith('skill_') ? `Skill ${id.slice(6)}` : id,
        branch: 'utility',
        tier: 'novice',
        desc: 'Promoted from character reference.',
        source: 'legacy-migration',
        createdAt: Date.now(),
      };
      newSkills.push(newSkill);
      existingSkillIds.add(id);
    });

    if (touched) {
      actorPatches.push({ ...actor, inventory: nextInventory });
    }
  });

  // Persist.
  const errors = [];
  for (const item of newItems) {
    try { await db.add('itemBank', item); }
    catch (e) {
      try { await db.update('itemBank', item); }
      catch (ee) { errors.push(ee); }
    }
  }
  for (const skill of newSkills) {
    try { await db.add('skillBank', skill); }
    catch (e) {
      try { await db.update('skillBank', skill); }
      catch (ee) { errors.push(ee); }
    }
  }
  for (const actor of actorPatches) {
    try { await db.update('actors', actor); } catch (e) { errors.push(e); }
  }

  await writeMetaFlag(meta, true);

  return {
    skipped: false,
    promotedItems: newItems.length,
    promotedSkills: newSkills.length,
    updatedActors: actorPatches.length,
    errors: errors.length,
  };
}

/**
 * Force-rerun the migration from the Dev panel. Clears the flag and
 * re-executes.
 */
export async function forceLegacyMigration() {
  const meta = await readMeta();
  await writeMetaFlag(meta, false);
  return runLegacyMigration();
}

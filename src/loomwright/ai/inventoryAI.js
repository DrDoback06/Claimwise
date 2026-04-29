/**
 * inventoryAI — AI helpers for the Wardrobe.
 *
 *   suggestStarterInventory(actor, worldState, { chapter, count })
 *     Propose a full starter kit for a newly-minted character.
 *
 *   suggestItemProperties(item, worldState)
 *     Fill missing lore fields (symbolism, value, properties, flag) on an existing item.
 *
 *   suggestTransferOrStateChange(item, chapterText, currentChapter, worldState)
 *     Scan a chapter's prose for equip/unequip/loss/gift cues and propose track updates.
 *
 * Every function is defensive: it catches AI errors and returns a minimal
 * deterministic fallback so the UI never hangs on a bad model response.
 */

import aiService from '../../services/aiService';
import { SLOT_DEFS, STATE_PRESETS, ITEM_CATEGORIES } from '../wardrobe/schema';

const SLOT_IDS = SLOT_DEFS.map((s) => s.id).join(', ');
const STATE_IDS = STATE_PRESETS.map((s) => s.id).join(', ');
const CATEGORY_IDS = ITEM_CATEGORIES.join(', ');

function safeParseJSON(text) {
  if (!text) return null;
  // Strip common fences
  let s = String(text).trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  // Grab first {...} or [...] block
  const objMatch = s.match(/[\{\[][\s\S]*[\}\]]/);
  if (!objMatch) return null;
  try {
    return JSON.parse(objMatch[0]);
  } catch {
    return null;
  }
}

function summariseActor(actor) {
  if (!actor) return 'Unknown character.';
  const bits = [];
  if (actor.name) bits.push(`Name: ${actor.name}`);
  if (actor.role) bits.push(`Role: ${actor.role}`);
  if (actor.class) bits.push(`Class/archetype: ${actor.class}`);
  if (actor.desc) bits.push(`Description: ${actor.desc}`);
  if (actor.biography) bits.push(`Biography: ${actor.biography}`);
  if (actor.profile?.period) bits.push(`Period: ${actor.profile.period}`);
  return bits.join('\n');
}

function summariseWorld(worldState) {
  if (!worldState) return '';
  const bits = [];
  if (worldState.meta?.premise) bits.push(`Premise: ${worldState.meta.premise}`);
  if (worldState.meta?.tone) bits.push(`Tone: ${worldState.meta.tone}`);
  if (worldState.meta?.setting) bits.push(`Setting: ${worldState.meta.setting}`);
  if (worldState.meta?.period) bits.push(`Period: ${worldState.meta.period}`);
  return bits.join('\n');
}

/**
 * Generate a starter inventory for a character.
 * Returns { items: [ItemShape], trackUpdates: [{itemId, chapter, entry}] }
 * where ItemShape matches the Claimwise item bank plus wardrobe fields.
 */
export async function suggestStarterInventory(actor, worldState, options = {}) {
  const chapter = options.chapter ?? 1;
  const count = options.count ?? 7;
  const period = actor?.profile?.period || worldState?.meta?.period || 'medieval-fantasy';

  const prompt = [
    `You are designing a starter inventory for a story character.`,
    ``,
    `CHARACTER:`,
    summariseActor(actor),
    ``,
    `WORLD:`,
    summariseWorld(worldState),
    ``,
    `Generate exactly ${count} items that this character plausibly owns at the start of their story (chapter ${chapter}).`,
    `Style period hint: ${period}.`,
    ``,
    `Return STRICT JSON only, no prose, shaped as:`,
    `{`,
    `  "items": [`,
    `    {`,
    `      "name": "string",`,
    `      "icon": "single emoji or glyph",`,
    `      "category": "one of: ${CATEGORY_IDS}",`,
    `      "description": "1-2 sentences, concrete and sensory",`,
    `      "properties": "short flavour about how it behaves / is used",`,
    `      "value": "short phrase about worth or rarity",`,
    `      "symbolism": "what it represents in the story",`,
    `      "knownTo": ["character name who knows about this"],`,
    `      "slotId": "one of: ${SLOT_IDS}",`,
    `      "stateId": "one of: ${STATE_IDS}",`,
    `      "flag": "optional plot-level warning, or empty string"`,
    `    }`,
    `  ]`,
    `}`,
  ].join('\n');

  let parsed = null;
  try {
    const response = await aiService.callAI(
      prompt,
      'structured',
      'Return only valid JSON. Do not wrap in markdown.'
    );
    parsed = safeParseJSON(response);
  } catch (_e) {
    parsed = null;
  }

  if (!parsed || !Array.isArray(parsed.items)) {
    return fallbackStarterKit(actor, chapter, count);
  }

  const items = parsed.items.slice(0, count).map((raw, i) => {
    const id = `item_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
    const slotId = SLOT_DEFS.find((s) => s.id === raw.slotId)?.id || 'pack';
    const stateId =
      STATE_PRESETS.find((s) => s.id === raw.stateId)?.id || 'pristine';
    return {
      id,
      name: raw.name || `Item ${i + 1}`,
      icon: raw.icon || '\u25A1',
      type: raw.category || 'other',
      desc: raw.description || '',
      // Extended wardrobe fields
      origin: chapter,
      value: raw.value || '',
      properties: raw.properties || '',
      symbolism: raw.symbolism || '',
      knownTo: Array.isArray(raw.knownTo) ? raw.knownTo : [],
      customStates: [],
      flag: raw.flag || '',
      // Standard Claimwise fields
      stats: {},
      grantsSkills: [],
      quests: '',
      debuffs: '',
      rarity: 'Common',
      track: {
        [chapter]: {
          actorId: actor?.id || null,
          slotId,
          stateId,
          note: 'Starter kit \u2014 generated by AI.',
        },
      },
    };
  });

  const trackUpdates = items.map((it) => ({
    itemId: it.id,
    chapter,
    entry: {
      actorId: actor?.id,
      slotId: it.track[chapter].slotId,
      stateId: it.track[chapter].stateId,
      note: it.track[chapter].note,
    },
  }));

  return { items, trackUpdates };
}

function fallbackStarterKit(actor, chapter, count) {
  // Deterministic, AI-free fallback. Keeps the UX predictable when the
  // proxy is offline.
  const base = [
    { name: "Traveller's cloak",  slotId: 'cloak',  category: 'garment', icon: '\u25BD', symbolism: 'The road ahead' },
    { name: 'Sturdy boots',       slotId: 'feet',   category: 'garment', icon: '\u2294', symbolism: 'Walking in their own step' },
    { name: 'Belt pouch',         slotId: 'belt',   category: 'tool',    icon: '\u2501', symbolism: 'What they choose to carry' },
    { name: 'Keepsake ring',      slotId: 'ring1',  category: 'token',   icon: '\u25CB', symbolism: 'A private promise' },
    { name: 'Folded letter',      slotId: 'hidden', category: 'document',icon: '\u2709', symbolism: 'The thing not yet said' },
    { name: 'Walking staff',      slotId: 'main',   category: 'tool',    icon: '\u2692', symbolism: 'What keeps them upright' },
    { name: 'Pocket knife',       slotId: 'pack',   category: 'weapon',  icon: '\u2694', symbolism: 'Small defence' },
    { name: 'Copper coin',        slotId: 'charm',  category: 'token',   icon: '\u25C9', symbolism: 'Luck at a price' },
  ].slice(0, count);

  const items = base.map((b, i) => {
    const id = `item_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
    return {
      id,
      name: b.name,
      icon: b.icon,
      type: b.category,
      desc: '',
      origin: chapter,
      value: '',
      properties: '',
      symbolism: b.symbolism || '',
      knownTo: [],
      customStates: [],
      flag: '',
      stats: {},
      grantsSkills: [],
      quests: '',
      debuffs: '',
      rarity: 'Common',
      track: {
        [chapter]: {
          actorId: actor?.id || null,
          slotId: b.slotId,
          stateId: 'pristine',
          note: 'Starter kit (offline default).',
        },
      },
    };
  });
  const trackUpdates = items.map((it) => ({
    itemId: it.id,
    chapter,
    entry: {
      actorId: actor?.id,
      slotId: it.track[chapter].slotId,
      stateId: 'pristine',
      note: 'Starter kit (offline default).',
    },
  }));
  return { items, trackUpdates };
}

export async function suggestItemProperties(item, worldState) {
  if (!item) return item;
  const prompt = [
    `Enrich the missing fields on this story item while keeping the existing ones.`,
    ``,
    `Existing:`,
    `  name: ${item.name || 'Unnamed'}`,
    `  description: ${item.desc || ''}`,
    `  properties: ${item.properties || ''}`,
    `  value: ${item.value || ''}`,
    `  symbolism: ${item.symbolism || ''}`,
    `  flag: ${item.flag || ''}`,
    `  knownTo: ${(item.knownTo || []).join(', ')}`,
    ``,
    `World:`,
    summariseWorld(worldState),
    ``,
    `Return STRICT JSON:`,
    `{`,
    `  "description": "string",`,
    `  "properties": "string",`,
    `  "value": "string",`,
    `  "symbolism": "string",`,
    `  "flag": "string",`,
    `  "knownTo": ["name"]`,
    `}`,
  ].join('\n');

  try {
    const response = await aiService.callAI(
      prompt,
      'structured',
      'Return only valid JSON. Do not wrap in markdown.'
    );
    const parsed = safeParseJSON(response);
    if (!parsed) return item;
    return {
      ...item,
      desc: parsed.description || item.desc,
      properties: parsed.properties ?? item.properties,
      value: parsed.value ?? item.value,
      symbolism: parsed.symbolism ?? item.symbolism,
      flag: parsed.flag ?? item.flag,
      knownTo: Array.isArray(parsed.knownTo) ? parsed.knownTo : item.knownTo,
    };
  } catch (_e) {
    return item;
  }
}

/**
 * Given a chapter's prose, ask the model whether any track update is implied
 * (equip, unequip, loss, gift, break). Returns an array of proposed updates.
 */
export async function suggestTransferOrStateChange(item, chapterText, currentChapter, worldState) {
  if (!item || !chapterText) return [];
  const prompt = [
    `Scan the chapter below for any event involving this item.`,
    `If found, propose one or more track updates.`,
    ``,
    `ITEM: ${item.name} (id: ${item.id})`,
    `Current state: ${JSON.stringify(item.track?.[currentChapter] || {})}`,
    ``,
    `CHAPTER TEXT:`,
    String(chapterText).slice(0, 6000),
    ``,
    `Return STRICT JSON:`,
    `{`,
    `  "updates": [`,
    `    {`,
    `      "actorName": "string or null if destroyed/lost",`,
    `      "slotId": "one of: ${SLOT_IDS} or null if not on-body",`,
    `      "stateId": "one of: ${STATE_IDS}",`,
    `      "note": "short quote or paraphrase"`,
    `    }`,
    `  ]`,
    `}`,
  ].join('\n');
  try {
    const response = await aiService.callAI(
      prompt,
      'analytical',
      'Return only valid JSON. Do not wrap in markdown.'
    );
    const parsed = safeParseJSON(response);
    if (!parsed || !Array.isArray(parsed.updates)) return [];
    const actors = worldState?.actors || [];
    return parsed.updates.map((u) => {
      const matchedActor = u.actorName
        ? actors.find(
            (a) =>
              a.name &&
              a.name.toLowerCase().includes(String(u.actorName).toLowerCase())
          )
        : null;
      return {
        itemId: item.id,
        chapter: currentChapter,
        entry: {
          actorId: matchedActor?.id || null,
          slotId: u.slotId || null,
          stateId: u.stateId || 'pristine',
          note: u.note || '',
        },
      };
    });
  } catch (_e) {
    return [];
  }
}

export default {
  suggestStarterInventory,
  suggestItemProperties,
  suggestTransferOrStateChange,
};

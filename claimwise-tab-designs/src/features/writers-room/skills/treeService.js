// Loomwright — AI skill-tree generator (CODE-INSIGHT §6).
// One call mints a whole tree (8–14 nodes by default) with prereqs and stat
// effects, plus a list of any stats it wanted that don't exist yet.

import aiService from '../../../services/aiService';

function rid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

function safeParse(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (s.startsWith('```')) s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first < 0 || last <= first) return null;
  try { return JSON.parse(s.slice(first, last + 1)); } catch { return null; }
}

function knownStatsFromState(state) {
  const set = new Set();
  for (const c of state.cast || []) for (const k of Object.keys(c.stats || {})) set.add(k);
  for (const i of state.items || []) for (const k of Object.keys(i.statMods || {})) set.add(k);
  for (const s of state.skills || []) for (const k of Object.keys(s.effects?.stats || {})) set.add(k);
  return [...set];
}

function buildSystemPrompt(state, opts) {
  return [
    'You are a skill-tree architect. Design a coherent tree (8 to ' + (opts.maxNodes || 14) + ' nodes) that progresses novice → adept → master → unique.',
    'Use prereqIds to link nodes (each prereqId must reference another node\'s name OR be empty). Prefer 1–2 prereqs per node.',
    'Effects: stats are stat deltas applied while the skill is active; flags are short string labels (e.g. "comprehend.bargemen").',
    '',
    'Known stats: ' + (knownStatsFromState(state).join(', ') || '(none yet)'),
    '',
    'Return ONLY this JSON:',
    '{"nodes":[{"name":"...","tier":"novice|adept|master|unique","description":"...","prereqs":["<node-name>"],"effects":{"stats":{"STR":2},"flags":["..."]},"costPoints":1,"cooldown":0}],"missingStats":[{"key":"STAMINA","description":"..."}],"wikiDrafts":{"<nodeName>":"<short paragraph>"}}',
  ].join('\n');
}

export async function generateTree(state, userPrompt, opts = {}) {
  const sys = buildSystemPrompt(state, opts);
  const prompt = `Writer's request: ${userPrompt}\n\nDesign the tree now.`;
  let raw = '';
  try {
    raw = await aiService.callAI(prompt, opts.task || 'skill-tree', sys, { useCache: false });
  } catch (err) {
    return { error: err?.message || 'tree gen failed', nodes: [] };
  }
  const parsed = safeParse(raw);
  if (!parsed?.nodes?.length) return { error: 'parse failed', raw, nodes: [] };

  // Place nodes on a tier-row layout.
  const TIER_Y = { novice: 100, adept: 250, master: 400, unique: 550 };
  const tierBuckets = { novice: [], adept: [], master: [], unique: [] };
  for (const n of parsed.nodes) {
    const tier = TIER_Y[n.tier] ? n.tier : 'novice';
    tierBuckets[tier].push(n);
  }
  // Assign positions and ids.
  const nameToId = new Map();
  const nodes = [];
  for (const tier of Object.keys(tierBuckets)) {
    const list = tierBuckets[tier];
    list.forEach((n, i) => {
      const id = rid('sk');
      nameToId.set(n.name, id);
      nodes.push({
        id,
        name: n.name,
        tier,
        position: { x: 100 + (i + 1) * (800 / (list.length + 1)), y: TIER_Y[tier] },
        description: n.description || '',
        unlockReqs: { prereqIds: [] /* filled in pass 2 */ },
        effects: { stats: n.effects?.stats || {}, flags: n.effects?.flags || [] },
        costPoints: n.costPoints || 1,
        cooldown: n.cooldown || 0,
        draftedByLoom: true,
      });
    });
  }
  // Resolve prereqs by name.
  for (let i = 0; i < parsed.nodes.length; i++) {
    const src = parsed.nodes[i];
    const node = nodes[i];
    if (!node) continue;
    const refs = (src.prereqs || []).map(name => nameToId.get(name)).filter(Boolean);
    node.unlockReqs.prereqIds = refs;
  }

  return {
    nodes,
    missingStats: Array.isArray(parsed.missingStats) ? parsed.missingStats : [],
    wikiDrafts: parsed.wikiDrafts || {},
    raw,
  };
}

// Loomwright — per-domain context builders. Each function takes the store
// and returns a compact serialisation of the slice that domain cares about,
// to be injected into the specialist's system prompt.

const MAX_LIST = 30;

function brief(list, fmt) {
  if (!Array.isArray(list)) return '';
  return list.slice(0, MAX_LIST).map(fmt).filter(Boolean).join('\n');
}

export const BUILDERS = {
  items: (store) => [
    'Vault:',
    brief(store.items || [], i => `- ${i.id} :: ${i.name} (${i.kind || i.slot || 'item'}) rarity=${i.rarity || 'common'} owner=${i.owner || '-'}`),
    '',
    'Affixes catalog (' + (store.affixCatalog?.length || 0) + '), gems (' + (store.gemCatalog?.length || 0) + '), runewords (' + (store.runewordCatalog?.length || 0) + '), sets (' + (store.setCatalog?.length || 0) + ').',
    '',
    'Known stats: ' + Object.keys(deriveAllStats(store)).join(', '),
    'Known skills:', brief(store.skills || [], s => `- ${s.id} :: ${s.name} (${s.tier || 'novice'})`),
  ].join('\n'),

  skills: (store) => [
    'Skill nodes:',
    brief(store.skills || [], s => {
      const reqs = (s.unlockReqs?.prereqIds || []).join(', ') || '—';
      const eff = Object.entries(s.effects?.stats || {}).map(([k, v]) => `${k}${v >= 0 ? '+' : ''}${v}`).join(' ');
      return `- ${s.id} :: ${s.name} tier=${s.tier} prereqs=[${reqs}] effects=${eff || '—'}`;
    }),
    '',
    'Known stats: ' + Object.keys(deriveAllStats(store)).join(', '),
  ].join('\n'),

  quests: (store) => [
    'Cast:',
    brief(store.cast || [], c => `- ${c.id} :: ${c.name} (${c.role || 'support'})`),
    '',
    'Quests:',
    brief(store.quests || store.threads || [], q => {
      const sides = (q.sides || []).map(s => `${s.name}[${(s.members || []).length}]`).join(' vs ') || (q.characters?.length ? `pov[${q.characters.length}]` : '—');
      return `- ${q.id} :: ${q.name || q.title} active=${q.active !== false} sides=${sides}`;
    }),
  ].join('\n'),

  cast: (store) => [
    'Cast (' + (store.cast?.length || 0) + '):',
    brief(store.cast || [], c => `- ${c.id} :: ${c.name} role=${c.role || 'support'} oneliner="${c.oneliner || ''}"`),
  ].join('\n'),

  // Interview mode — same canon view as cast plus a focused-character
  // brief so the AI knows whose voice to wear. ServiceLayer also passes
  // `focusCharId` via composeSystem; this builder makes the focal
  // character explicit at the top of the context block.
  'cast-interview': (store) => {
    const charId = store.ui?.selection?.character;
    const c = (store.cast || []).find(x => x.id === charId);
    const brief1 = c
      ? [
          `You are speaking AS:`,
          `  name: ${c.name}`,
          `  role: ${c.role || 'support'}`,
          `  pronouns: ${c.pronouns || '—'}`,
          `  oneliner: ${c.oneliner || '—'}`,
          `  voice: ${c.dossier?.voice || '—'}`,
          `  bio: ${(c.dossier?.bio || '').slice(0, 400)}`,
          `  current stats: ${Object.entries(c.stats || {}).map(([k, v]) => `${k}=${v}`).join(' ') || '—'}`,
        ].join('\n')
      : `(no character is currently selected — keep replies generic until the writer picks one)`;
    return [
      brief1,
      '',
      'Other cast in scope (' + (store.cast?.length || 0) + '):',
      brief(store.cast || [], x => `- ${x.id} :: ${x.name} (${x.role || 'support'})`),
    ].join('\n');
  },

  atlas: (store) => [
    'Places (' + (store.places?.length || 0) + '):',
    brief(store.places || [], p => `- ${p.id} :: ${p.name} kind=${p.kind || 'place'} realm=${p.realm || '-'}`),
    '',
    'Regions (' + (store.regions?.length || 0) + '):',
    brief(store.regions || [], r => `- ${r.id} :: ${r.name} biome=${r.biome || '-'}`),
  ].join('\n'),

  voice: (store) => [
    'Voice profiles:',
    brief(store.voice || [], v => `- ${v.id || v.characterId} :: ${v.name || v.characterId}`),
  ].join('\n'),

  language: (store) => [
    'Languages defined: ' + ((store.languages || []).map(l => l.name).join(', ') || 'none yet'),
  ].join('\n'),

  tangle: (store) => [
    'Tangle nodes (' + ((store.tangle?.nodes || []).length) + '), edges (' + ((store.tangle?.edges || []).length) + ').',
  ].join('\n'),

  stats: (store) => {
    const stats = deriveAllStats(store);
    return [
      'Stats in use: ' + (Object.keys(stats).join(', ') || '(none yet)'),
      'Cast count: ' + (store.cast?.length || 0),
    ].join('\n');
  },
};

function deriveAllStats(store) {
  const set = {};
  for (const c of store.cast || []) {
    for (const k of Object.keys(c.stats || {})) set[k] = true;
  }
  for (const i of store.items || []) {
    for (const k of Object.keys(i.statMods || {})) set[k] = true;
  }
  for (const s of store.skills || []) {
    for (const k of Object.keys(s.effects?.stats || {})) set[k] = true;
  }
  return set;
}

export function buildContext(domain, store) {
  const fn = BUILDERS[domain] || BUILDERS.cast;
  try { return fn(store); } catch { return ''; }
}

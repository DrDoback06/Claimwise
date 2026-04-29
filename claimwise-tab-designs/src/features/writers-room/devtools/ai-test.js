// Loomwright — AI test harness.
//
// One pure function per writing-aid mode that takes a sample paragraph,
// builds the same prompt the live tool would, and returns
// { mode, prompt, response, latencyMs, ok, err, parsed } so the dev
// panel can verify the pipeline end-to-end.
//
// When no provider is configured (or Settings dev-mock=on) the harness
// returns a deterministic canned response so the prompt → display path
// can still be verified.

import aiService from '../../../services/aiService';
import { localProofread, aiProofread } from '../utilities/proofread';
import { createCharacter } from '../store';

export const SAMPLE_TEXT =
  'Mira walked into the bar. She felt nervous. Holden was waiting for her with a calm smile, and she ' +
  'realised she had walked into a trap that had been quietly set for her months ago. The bartender was ' +
  'wiping a glass. The bartender was wiping a glass. "Tell me about Tuesday," Mira said. ' +
  'Holden didnt look up from her teacup. Their was a long silence.';

const MODES = [
  { id: 'continue',   task: 'creative',    label: 'Continue this scene' },
  { id: 'brainstorm', task: 'creative',    label: 'Brainstorm what is next' },
  { id: 'what-if',    task: 'creative',    label: 'What if…' },
  { id: 'show',       task: 'analytical',  label: 'Show, do not tell' },
  { id: 'sensory',    task: 'creative',    label: 'Add sensory grounding' },
  { id: 'tighten',    task: 'analytical',  label: 'Tighten this paragraph' },
  { id: 'proofread',  task: 'analytical',  label: 'Proofread this chapter' },
];

export function listModes() { return MODES.slice(); }

function buildPrompt(mode, sample, profile, character) {
  const persona = character
    ? `POV: ${character.name} (${character.role || 'character'}). Voice: ${character.dossier?.voice || character.voice || 'natural'}. Wants: ${character.wants?.true || character.wants?.surface || 'unstated'}. Fears: ${(character.fears || []).join('; ') || 'unstated'}. `
    : 'Narrator: third-person limited. ';
  const head = `${persona}\nGenre: ${profile?.genre || 'literary'}.\nTone: ${(profile?.tone || []).join(', ') || 'natural'}.\nRecent prose:\n"""\n${sample}\n"""\n`;
  if (mode === 'continue')   return `${head}Write the next 1-2 paragraphs in the same voice. Show, do not tell. Stay grounded.`;
  if (mode === 'brainstorm') return `${head}Propose 4 possible next beats. One sentence each. Vary stakes.`;
  if (mode === 'what-if')    return `${head}List 4 "what if…" provocations grounded in the dossier. One sentence each.`;
  if (mode === 'show')       return `${head}Find the most "telling" sentence above and rewrite it as showing. Reply with only the rewrite.`;
  if (mode === 'sensory')    return `${head}Rewrite the last paragraph to ground it in two more senses (sound, smell, touch, taste — pick what fits). Reply with only the rewrite.`;
  if (mode === 'tighten')    return `${head}Rewrite the last paragraph more tightly without losing voice or meaning. Reply with only the rewrite.`;
  return head;
}

export function isProviderConfigured() {
  try {
    const list = aiService.getAvailableProviders?.() || [];
    return list.some(p => p.hasKey || (!p.requiresKey));
  } catch { return false; }
}

function mockReply(mode, sample) {
  if (mode === 'brainstorm' || mode === 'what-if') {
    return [
      `[mock] ${mode}: a possibility grounded in the recent prose.`,
      `[mock] ${mode}: a quieter alternative that delays the confrontation.`,
      `[mock] ${mode}: a louder alternative with higher stakes.`,
      `[mock] ${mode}: a sideways angle that reveals character.`,
    ].join('\n');
  }
  if (mode === 'proofread') {
    return JSON.stringify([
      { quote: 'didnt', fix: 'didn’t', label: 'Apostrophe in contraction' },
      { quote: 'Their was', fix: 'There was', label: 'Their/there confusion' },
    ], null, 2);
  }
  return `[mock] ${mode}: rewrite of the supplied sample with one telling sentence converted to showing, sensory detail added, and rhythm tightened. The bar smelled of stale beer and old varnish, and Holden’s teacup steamed thinly between them.`;
}

export async function runOne({ mode, sample = SAMPLE_TEXT, profile = {}, character = null, useMock = false }) {
  const t0 = Date.now();
  const prompt = mode === 'proofread' ? null : buildPrompt(mode, sample, profile, character);

  if (useMock || !isProviderConfigured()) {
    const text = mockReply(mode, sample);
    return {
      mode, prompt, response: text,
      latencyMs: 0, ok: true, mock: true,
      parsed: parseFor(mode, text),
    };
  }

  let raw = '';
  let err = null;
  try {
    if (mode === 'proofread') {
      const localItems = localProofread(sample);
      const aiItems = await aiProofread(sample, profile);
      const combined = [...localItems, ...aiItems];
      const t1 = Date.now();
      return {
        mode, prompt: '(combined: localProofread + aiProofread)',
        response: JSON.stringify(combined, null, 2),
        latencyMs: t1 - t0, ok: true, mock: false,
        parsed: combined,
      };
    }
    const taskMap = Object.fromEntries(MODES.map(m => [m.id, m.task]));
    const r = await aiService.callAI(prompt, taskMap[mode] || 'creative', '');
    raw = typeof r === 'string' ? r : (r?.text || r?.content || '');
  } catch (e) {
    err = e?.message || String(e);
  }
  const t1 = Date.now();
  return {
    mode, prompt, response: raw,
    latencyMs: t1 - t0, ok: !err, mock: false, err,
    parsed: parseFor(mode, raw),
  };
}

function parseFor(mode, text) {
  if (!text) return null;
  if (mode === 'brainstorm' || mode === 'what-if') {
    return text.split(/\n+/).map(s => s.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, 6);
  }
  if (mode === 'proofread') {
    if (Array.isArray(text)) return text;
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }
  return text.trim();
}

// Smoke test for the WalkThroughWizard's draft pipeline. Builds the
// same payload the wizard would on confirm, runs it through the
// store's transaction, and returns the new entity id.
export function smokeTestWizard(store) {
  const proposal = {
    name: '__lw_demo__test_' + Date.now(),
    role: 'minor',
    oneliner: 'A character created by the smoke test.',
  };
  let id = null;
  store.transaction(({ setSlice }) => {
    id = createCharacter({ setSlice }, { ...proposal, draftedByLoom: true, _demo: true });
  });
  return { ok: !!id, id, proposal };
}

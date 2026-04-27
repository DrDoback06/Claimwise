// Loomwright — specialist chat service. Wraps aiService.callAI with the
// domain persona + curated slice context so each panel feels like talking
// to a focused expert. Now uses the unified ai/context.composeSystem so the
// model sees full saga + voice + recent chapters + canon on every turn.

import aiService from '../../../services/aiService';
import { personaFor } from './personas';
import { buildContext } from './context';
import { composeSystem } from '../ai/context';

// Keep recent messages so the convo feels continuous; cap to last 12 turns
// per domain to keep the prompt small.
const HISTORY_CAP = 12;

// Map specialist domain to the canon slices that should be in scope.
const DOMAIN_SLICE = {
  items:    ['cast', 'items', 'skills'],
  skills:   ['cast', 'skills', 'items'],
  quests:   ['cast', 'quests', 'places'],
  cast:     ['cast', 'quests', 'places'],
  atlas:    ['places', 'cast'],
  voice:    ['cast'],
  language: ['cast', 'places'],
  tangle:   ['cast', 'quests'],
  stats:    ['cast', 'skills', 'items'],
};

// Heuristic task tag — drives intelligenceRouter to pick the right model.
const DOMAIN_TASK = {
  items:    'creative-deep',
  skills:   'creative-deep',
  quests:   'creative-deep',
  cast:     'creative',
  atlas:    'creative',
  voice:    'analytical',
  language: 'creative',
  tangle:   'analytical',
  stats:    'analytical',
};

export async function ask({ domain, history, prompt, store, opts = {} }) {
  const persona = personaFor(domain);
  const inlineCtx = buildContext(domain, store); // existing thin slice for back-compat

  const systemContext = composeSystem({
    state: store,
    persona: persona.voice + '\n\nDOMAIN-SPECIFIC SLICE:\n' + inlineCtx,
    focusCharId: store.ui?.selection?.character || null,
    focusChapterId: store.ui?.selection?.chapter || store.ui?.activeChapterId || null,
    slice: DOMAIN_SLICE[domain] || ['cast'],
  });

  const recent = (history || []).slice(-HISTORY_CAP);
  const turns = recent.map(m => (m.role === 'user' ? 'Author: ' : 'Specialist: ') + m.text).join('\n');
  const fullPrompt = [
    turns ? turns + '\n' : '',
    `Author: ${prompt}`,
    'Specialist:',
  ].join('\n');

  try {
    const raw = await aiService.callAI(fullPrompt, opts.task || DOMAIN_TASK[domain] || 'creative', systemContext, {
      useCache: false,
    });
    return String(raw || '').trim();
  } catch (err) {
    return `[error: ${err?.message || 'specialist unreachable'}]`;
  }
}

// Helper: pull a JSON block from a specialist reply (they're prompted to
// return JSON-only for crafting flows, but may add prose).
export function extractJSON(text) {
  if (!text) return null;
  let s = String(text).trim();
  if (s.startsWith('```')) s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first < 0 || last <= first) return null;
  try { return JSON.parse(s.slice(first, last + 1)); } catch { return null; }
}

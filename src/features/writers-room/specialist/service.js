// Loomwright — specialist chat service. Wraps aiService.callAI with the
// domain persona + curated slice context so each panel feels like talking
// to a focused expert.

import aiService from '../../../services/aiService';
import { personaFor } from './personas';
import { buildContext } from './context';

// Keep recent messages so the convo feels continuous; cap to last 12 turns
// per domain to keep the prompt small.
const HISTORY_CAP = 12;

export async function ask({ domain, history, prompt, store, opts = {} }) {
  const persona = personaFor(domain);
  const ctx = buildContext(domain, store);

  const systemContext = [
    persona.voice,
    '',
    'CURRENT WORLD STATE:',
    ctx,
  ].join('\n');

  const recent = (history || []).slice(-HISTORY_CAP);
  const turns = recent.map(m => (m.role === 'user' ? 'Author: ' : 'Specialist: ') + m.text).join('\n');
  const fullPrompt = [
    turns ? turns + '\n' : '',
    `Author: ${prompt}`,
    'Specialist:',
  ].join('\n');

  try {
    const raw = await aiService.callAI(fullPrompt, opts.task || `specialist-${domain}`, systemContext, {
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

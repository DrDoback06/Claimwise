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
  const p = store.profile || {};
  const wp = p.writingPreferences || {};
  const projectLines = [
    p.workingTitle && `Project: ${p.workingTitle}${p.seriesName ? ' (' + p.seriesName + ')' : ''}`,
    (p.genres || []).length && `Genres: ${p.genres.join(', ')}`,
    (p.tone || []).length && `Tone: ${p.tone.join(' / ')}`,
    p.pov && `POV: ${p.pov}`,
    p.tense && `Tense: ${p.tense}`,
    p.premise && `Premise: ${p.premise}`,
    (p.worldRules || []).length && `World rules: ${p.worldRules.slice(0, 6).join(' · ')}`,
    wp.dialogueStyle && `Dialogue: ${wp.dialogueStyle}`,
    wp.descriptionDensity && `Description density: ${wp.descriptionDensity}`,
    (wp.profanityLevel || wp.violenceLevel || wp.romanticContent) &&
      `Content limits: profanity=${wp.profanityLevel || 'mild'}, violence=${wp.violenceLevel || 'mild'}, romance=${wp.romanticContent || 'mild'}`,
    (wp.petPeeves || []).length && `Avoid: ${wp.petPeeves.slice(0, 8).join(' · ')}`,
    (wp.favorites || []).length && `Lean into: ${wp.favorites.slice(0, 8).join(' · ')}`,
  ].filter(Boolean).join('\n');

  const systemContext = [
    persona.voice,
    projectLines && '\nPROJECT CONTEXT:\n' + projectLines,
    '',
    'CURRENT WORLD STATE:',
    ctx,
  ].filter(Boolean).join('\n');

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

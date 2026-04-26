// Loomwright — Suggestion-engine AI service (CODE-INSIGHT §3).
//
// One facade — `regenerate(state, scope, opts)` — returns Suggestion[] for the
// given scope. Free model by default; "boost" routes through a stronger model
// only on explicit user click (NEVER silent escalation).

import aiService from '../../../services/aiService';
import { makeSuggestion } from './slice';
import { characterById, placeById, threadById, activeChapter } from '../store/selectors';

const MAX_PARALLEL = 1; // Suggestion generation is debounced upstream; serial is fine.
let inflight = null;

function entityForScope(state, scope) {
  if (!scope) return null;
  switch (scope.kind) {
    case 'character': return characterById(state, scope.id);
    case 'place':     return placeById(state, scope.id);
    case 'thread':    return threadById(state, scope.id);
    default: return null;
  }
}

function buildSystemPrompt(scope, entity, chapter, profile) {
  const lines = [
    'You are the suggestion engine for Loomwright, a writing app.',
    'Return between 3 and 6 short prose suggestions tailored to the writer\'s manuscript and the selected entity.',
    'Each suggestion must follow this exact JSON shape and nothing else:',
    `{"suggestions":[{"type":"item|callback|sensory|tension|pacing|continuity-fix","title":"<6 words>","preview":"<1 short sentence>","body":"<2-3 sentence prose insert>","relevance":<0-100 integer>,"provenance":[{"kind":"character|place|thread|item|chapter|voice|rule","label":"<chip text>"}]}]}`,
    'Respond with the JSON object only. No preamble.',
  ];
  if (profile) {
    if (profile.workingTitle) lines.push(`Project: ${profile.workingTitle}${profile.seriesName ? ' (' + profile.seriesName + ')' : ''}.`);
    if ((profile.genres || []).length) lines.push(`Genres: ${profile.genres.join(', ')}.`);
    if ((profile.tone || []).length) lines.push(`Tone: ${profile.tone.join(' / ')}.`);
    if (profile.pov) lines.push(`POV: ${profile.pov}.`);
    if (profile.tense) lines.push(`Tense: ${profile.tense}.`);
    if (profile.premise) lines.push(`Premise: ${profile.premise}`);
    if ((profile.worldRules || []).length) lines.push('World rules: ' + profile.worldRules.slice(0, 6).join(' · '));
    const wp = profile.writingPreferences || {};
    if (wp.dialogueStyle) lines.push(`Dialogue style: ${wp.dialogueStyle}.`);
    if (wp.descriptionDensity) lines.push(`Description density: ${wp.descriptionDensity}.`);
    if (wp.profanityLevel || wp.violenceLevel || wp.romanticContent) {
      lines.push(`Content limits: profanity=${wp.profanityLevel || 'mild'}, violence=${wp.violenceLevel || 'mild'}, romance=${wp.romanticContent || 'mild'}.`);
    }
    const peeves = (wp.petPeeves || []).filter(Boolean);
    if (peeves.length) lines.push('Avoid: ' + peeves.slice(0, 8).join(' · '));
    const favs = (wp.favorites || []).filter(Boolean);
    if (favs.length) lines.push('Lean into: ' + favs.slice(0, 8).join(' · '));
  }
  if (scope && entity) {
    lines.push(`The writer has selected ${scope.kind}: ${entity.name || entity.title || entity.id}.`);
    if (entity.oneliner) lines.push(`One-liner: ${entity.oneliner}`);
  } else {
    lines.push('Whole-book mode: structural / pacing-level suggestions only.');
  }
  if (chapter) {
    lines.push(`Current chapter: ch.${chapter.n} ${chapter.title || ''}`.trim());
  }
  return lines.join('\n');
}

function clipChapterText(text, max = 4000) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(-max);
}

function safeParseSuggestions(raw) {
  if (!raw) return [];
  // Strip leading/trailing prose and codefences.
  let s = String(raw).trim();
  if (s.startsWith('```')) s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '');
  // Snip from first '{' to last '}'.
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed?.suggestions)) return parsed.suggestions;
  } catch {}
  return [];
}

export async function regenerate(state, scope, opts = {}) {
  if (inflight) {
    try { inflight.cancel?.(); } catch {}
  }
  const ctrl = new AbortController();
  let cancelled = false;
  const out = (async () => {
    const entity = entityForScope(state, scope);
    if (scope && !entity) return [];
    const chapter = activeChapter(state);
    const chapterText = clipChapterText(chapter?.text);
    const sys = buildSystemPrompt(scope, entity, chapter, state.profile);

    const prompt = chapterText
      ? `Recent manuscript:\n\n${chapterText}\n\nGenerate suggestions now.`
      : 'No manuscript text yet — generate suggestions based only on the entity context.';

    let raw = '';
    try {
      raw = await aiService.callAI(prompt, opts.boost ? 'creative-deep' : 'creative', sys, {
        useCache: false,
        abortController: ctrl,
      });
    } catch (err) {
      if (err?.name === 'AbortError' || cancelled) return [];
      console.warn('[suggestions] callAI failed', err?.message);
      return [];
    }
    if (cancelled) return [];

    const items = safeParseSuggestions(raw);
    return items.map(s => makeSuggestion({ ...s, scope, boosted: !!opts.boost }));
  })();

  inflight = {
    promise: out,
    cancel: () => { cancelled = true; ctrl.abort(); },
  };

  try { return await out; }
  finally { if (inflight?.promise === out) inflight = null; }
}

export function cancelRegenerate() {
  if (inflight) {
    try { inflight.cancel(); } catch {}
    inflight = null;
  }
}

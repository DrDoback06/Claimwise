// Loomwright — per-section onboarding schemas. Each schema describes:
//   • the JSON shape an external AI must return (strict — extra keys ignored,
//     missing required keys = invalid),
//   • the prompt template the writer copies and pastes into ChatGPT/Claude
//     to get a paste-ready answer back,
//   • a `validate(parsed)` predicate used by the traffic-light system to
//     score completeness,
//   • `applyTo(state, parsed)` that merges the parsed JSON into the wizard
//     state object.
//
// The traffic-light is computed by `evaluateSection` in ../completeness.js
// and uses BOTH the validation result AND whether any reference is linked
// to the section to decide red / amber / green.
//
// Adding a new section: drop a file in this directory and export it from
// SECTIONS below.

import storySchema from './story';
import flavourSchema from './flavour';
import worldRulesSchema from './worldRules';
import voiceStyleSchema from './voiceStyle';
import contentBoundariesSchema from './contentBoundaries';
import petPeevesSchema from './petPeeves';
import plotRoadmapSchema from './plotRoadmap';
import aiCadenceSchema from './aiCadence';

export const SECTIONS = [
  storySchema,
  flavourSchema,
  worldRulesSchema,
  voiceStyleSchema,
  contentBoundariesSchema,
  petPeevesSchema,
  plotRoadmapSchema,
  aiCadenceSchema,
];

export function sectionById(id) {
  return SECTIONS.find(s => s.id === id) || null;
}

// Build a single mega-prompt for the wizard's "Copy everything" button —
// useful when the writer wants the AI to seed all sections at once.
export function buildBundlePrompt(state) {
  const parts = SECTIONS.map(s => `### ${s.title}\n` + s.prompt(state));
  return [
    'You are seeding a novelist\'s onboarding answers. For each section below,',
    'return ONLY the requested JSON object — no commentary, no markdown fences.',
    'Wrap them all in a single envelope:',
    '',
    '```',
    '{',
    '  "sections": {',
    SECTIONS.map(s => `    "${s.id}": <object matching that section's schema>`).join(',\n'),
    '  }',
    '}',
    '```',
    '',
    '— Sections —',
    '',
    parts.join('\n\n'),
  ].join('\n');
}

// Apply a bundle response (`{sections: {...}}`) to wizard state, returning
// the merged state and a per-section ok/error report.
export function applyBundle(state, bundle) {
  const sections = bundle?.sections || {};
  const report = {};
  let next = state;
  for (const s of SECTIONS) {
    const part = sections[s.id];
    if (part == null) { report[s.id] = { ok: false, reason: 'missing' }; continue; }
    const ok = !!s.validate?.(part);
    if (ok) {
      next = s.applyTo(next, part);
      report[s.id] = { ok: true };
    } else {
      report[s.id] = { ok: false, reason: 'invalid-shape' };
    }
  }
  return { next, report };
}

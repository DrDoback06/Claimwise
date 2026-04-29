/**
 * weaverAI — structured AI bridge for Canon Weaver.
 * Given a user's idea, returns a list of proposed edits grouped by system.
 * Falls back to a deterministic preview if the model is unreachable.
 */

import aiService from '../../services/aiService';

export const SYSTEM_COLORS = {
  World:    'oklch(72% 0.10 200)',
  Cast:     'oklch(72% 0.13 30)',
  Plot:     'oklch(68% 0.16 22)',
  Timeline: 'oklch(70% 0.13 280)',
  Atlas:    'oklch(72% 0.13 145)',
  Chapter:  'oklch(78% 0.13 78)',
};

export const SYSTEM_ICON = {
  World: 'globe',
  Cast: 'users',
  Plot: 'flag',
  Timeline: 'clock',
  Atlas: 'map',
  Chapter: 'pen',
};

function safeParseJSON(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const m = s.match(/[\{\[][\s\S]*[\}\]]/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

function pickChaptersFor(worldState, bookId) {
  const book = worldState?.books?.[bookId];
  return book?.chapters || [];
}

function summariseCast(actors) {
  if (!actors?.length) return '(no cast)';
  return actors
    .slice(0, 30)
    .map((a) => `- ${a.name}${a.role ? ` (${a.role})` : ''}${a.desc ? `: ${a.desc.slice(0, 140)}` : ''}`)
    .join('\n');
}

function summariseChapters(chapters) {
  if (!chapters?.length) return '(no chapters)';
  return chapters
    .slice(0, 40)
    .map((c) => `- Ch.${c.id}${c.title ? ` "${c.title}"` : ''}${c.summary ? `: ${c.summary.slice(0, 180)}` : ''}`)
    .join('\n');
}

function summarisePlotThreads(threads) {
  if (!threads?.length) return '(no explicit threads)';
  return threads.slice(0, 20).map((t) => `- ${t.name || t.title || t.id}`).join('\n');
}

export async function proposeWeave(idea, worldState, bookId, options = {}) {
  const chapters = pickChaptersFor(worldState, bookId);
  const actors = worldState?.actors || [];
  const threads = worldState?.plotThreads || worldState?.plot?.threads || [];
  const currentChapter = options.currentChapter || chapters[chapters.length - 1]?.id || 1;
  const book = worldState?.books?.[bookId];

  const prompt = [
    `You are the Canon Weaver, an editor that proposes coordinated changes`,
    `across a novel's world, cast, plot, timeline, atlas, and chapters in response`,
    `to a writer's idea. Output STRICT JSON.`,
    ``,
    `IDEA:`,
    String(idea),
    ``,
    `BOOK: ${book?.title || 'Untitled'}`,
    `Current chapter: ${currentChapter}`,
    ``,
    `CAST:`,
    summariseCast(actors),
    ``,
    `CHAPTERS:`,
    summariseChapters(chapters),
    ``,
    `PLOT THREADS:`,
    summarisePlotThreads(threads),
    ``,
    `Return JSON:`,
    `{`,
    `  "confidence": 0.0-1.0,`,
    `  "edits": [`,
    `    {`,
    `      "id": "stable-id-string",`,
    `      "system": "World | Cast | Plot | Timeline | Atlas | Chapter",`,
    `      "action": "short verb e.g. create | update | trait-hint | suggest-edit | pin-place | create-thread",`,
    `      "target": "optional name of the target entity (actor name, chapter number, place name)",`,
    `      "title": "one-line human title for the edit",`,
    `      "reasoning": "2-4 sentences explaining WHY this edit is suggested and how it fits",`,
    `      "payload": { /* system-specific structured object */ },`,
    `      "references": ["ch.N", "ch.M"]`,
    `    }`,
    `  ]`,
    `}`,
    ``,
    `Guidance:`,
    `- Never change anything destructively; propose additions and soft trait hints.`,
    `- Always include AT LEAST one Chapter edit (suggest-edit) with concrete before/after prose when a scene is implied.`,
    `- Match the author's existing tone. No purple prose.`,
    `- 5 to 12 edits total.`,
  ].join('\n');

  try {
    const response = await aiService.callAI(
      prompt,
      'structured',
      'Return only valid JSON. Do not wrap in markdown.'
    );
    const parsed = safeParseJSON(response);
    if (!parsed || !Array.isArray(parsed.edits)) return fallbackProposal(idea);
    parsed.edits.forEach((e, i) => {
      if (!e.id) e.id = `e_${Date.now()}_${i}`;
    });
    return { confidence: parsed.confidence || 0.7, edits: parsed.edits };
  } catch (_e) {
    return fallbackProposal(idea);
  }
}

function fallbackProposal(idea) {
  const id = (x) => `e_${Date.now()}_${x}`;
  return {
    confidence: 0.5,
    edits: [
      {
        id: id(1),
        system: 'World',
        action: 'create',
        title: 'Add a new world-entry for this idea',
        reasoning: 'The proxy is offline or returned an unparseable response. This is a safe placeholder so you can see the review flow with real controls. Edit or reject as needed.',
        payload: { note: idea },
        references: [],
      },
      {
        id: id(2),
        system: 'Chapter',
        action: 'suggest-edit',
        title: 'Suggest a 2-line foreshadow insertion in the next chapter',
        reasoning: 'A placeholder until the model is reachable. Shows how Chapter edits render with before/after prose.',
        payload: {
          before: '(no preview available)',
          after: '(no preview available)',
          intrusion: 'low',
        },
        references: [],
      },
    ],
  };
}

export default { proposeWeave, SYSTEM_COLORS, SYSTEM_ICON };

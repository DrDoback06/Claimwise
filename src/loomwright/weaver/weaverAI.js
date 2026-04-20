/**
 * weaverAI — the AI bridge for Canon Weaver.
 *
 * Takes a writer's idea (or a sweep request / a backfill request) plus the
 * full worldState and returns a list of coordinated cross-system edit
 * proposals. The Review view in `CanonWeaver.jsx` renders these and the user
 * accepts/edits/rejects each; `dispatchWeaveEdits` applies accepted ones.
 *
 * Modes:
 *   - 'single'   : default — the writer dropped a fresh idea.
 *   - 'sweep'    : continuity sweep across the whole manuscript (no new idea;
 *                   the AI finds gaps and proposes coordinated fixes).
 *   - 'backfill' : an entity (character/item/thread) was just created and we
 *                   want Canon Weaver to propose retroactive mentions in
 *                   earlier chapters.
 *   - 'scene'    : we have transcript/raw text (e.g. from Interview Mode) we
 *                   want woven into the canon as a scene + supporting edits.
 *
 * Falls back to a deterministic proposal if aiService is unreachable so the
 * review flow is always exercised.
 */

import aiService from '../../services/aiService';
import storyBrain from '../../services/storyBrain';

export const SYSTEM_COLORS = {
  World:    'oklch(72% 0.10 200)',
  Cast:     'oklch(72% 0.13 30)',
  Plot:     'oklch(68% 0.16 22)',
  Timeline: 'oklch(70% 0.13 280)',
  Atlas:    'oklch(72% 0.13 145)',
  Chapter:  'oklch(78% 0.13 78)',
  Item:     'oklch(72% 0.13 60)',
  Skill:    'oklch(72% 0.13 100)',
  Wiki:     'oklch(70% 0.10 220)',
  Faction:  'oklch(68% 0.14 340)',
};

export const SYSTEM_ICON = {
  World: 'globe',
  Cast: 'users',
  Plot: 'flag',
  Timeline: 'clock',
  Atlas: 'map',
  Chapter: 'pen',
  Item: 'briefcase',
  Skill: 'zap',
  Wiki: 'book',
  Faction: 'shield',
};

function safeParseJSON(text) {
  if (!text) return null;
  const s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const m = s.match(/[{[][\s\S]*[}\]]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

function pickChaptersFor(worldState, bookId) {
  const book = worldState?.books?.[bookId];
  return book?.chapters || [];
}

function summariseCast(actors) {
  if (!actors?.length) return '(no cast)';
  return actors.slice(0, 30)
    .map((a) => `- ${a.name}${a.role ? ` (${a.role})` : ''}${a.desc ? `: ${a.desc.slice(0, 140)}` : ''}`)
    .join('\n');
}

function summariseChapters(chapters) {
  if (!chapters?.length) return '(no chapters)';
  return chapters.slice(0, 40)
    .map((c) => `- Ch.${c.id}${c.title ? ` "${c.title}"` : ''}${c.summary ? `: ${c.summary.slice(0, 180)}` : ''}`)
    .join('\n');
}

function summarisePlotThreads(threads) {
  if (!threads?.length) return '(no explicit threads)';
  return threads.slice(0, 20).map((t) => `- ${t.name || t.title || t.id}${t.status ? ` [${t.status}]` : ''}`).join('\n');
}

function summariseItems(items) {
  if (!items?.length) return '(no items)';
  return items.slice(0, 30)
    .map((i) => `- ${i.name}${i.type ? ` (${i.type})` : ''}${i.desc ? `: ${i.desc.slice(0, 120)}` : ''}`)
    .join('\n');
}

function summarisePlaces(places) {
  if (!places?.length) return '(no places)';
  return places.slice(0, 25)
    .map((p) => `- ${p.name}${p.region ? ` (${p.region})` : ''}${p.desc ? `: ${p.desc.slice(0, 120)}` : ''}`)
    .join('\n');
}

function summariseFactions(factions) {
  if (!factions?.length) return '(no factions)';
  return factions.slice(0, 15).map((f) => `- ${f.name}${f.desc ? `: ${f.desc.slice(0, 120)}` : ''}`).join('\n');
}

/** Match a chapter row from the book by id or number (Write may pass either). */
function findChapterById(chapters, chapterId) {
  if (!chapters?.length || chapterId == null) return null;
  const id = chapterId;
  return chapters.find(
    (c) => c.id === id || c.number === id || String(c.id) === String(id)
  ) || null;
}

/** Last N characters of chapter body (canonical on-page text). */
function excerptFromChapter(ch, maxLen = 2800) {
  if (!ch) return '';
  const text = String(ch.content || ch.script || '').trim();
  if (!text) return '';
  return text.length <= maxLen ? text : text.slice(-maxLen);
}

/** Optional tail of previous chapter for continuity. */
function priorChapterTail(chapters, chapterId, tailLen = 450) {
  const idx = chapters.findIndex(
    (c) => c.id === chapterId || c.number === chapterId || String(c.id) === String(chapterId)
  );
  if (idx <= 0) return '';
  const prev = chapters[idx - 1];
  const text = String(prev?.content || prev?.script || '').trim();
  if (!text) return '';
  return text.length <= tailLen ? text : text.slice(-tailLen);
}

function buildManuscriptGroundingBlock(chapters, chapterId) {
  const ch = findChapterById(chapters, chapterId);
  const main = excerptFromChapter(ch);
  const prior = priorChapterTail(chapters, chapterId);
  const lines = [];
  if (prior) {
    lines.push(
      `PRIOR CHAPTER TAIL (context only, ch before current):\n"""\n${prior}\n"""\n`
    );
  }
  if (main) {
    lines.push(
      `CURRENT CHAPTER MANUSCRIPT (authoritative voice & on-page facts; last portion of ch.${chapterId}):\n"""\n${main}\n"""\n`
    );
  } else {
    lines.push(
      '(No full chapter text stored for this chapter — rely on CHAPTERS summaries and CAST above.)'
    );
  }
  return lines.join('\n');
}

function modeInstructions(mode, { idea, entity, transcript }) {
  switch (mode) {
    case 'sweep':
      return `MODE: CONTINUITY SWEEP.
Find gaps, forgotten threads, dangling plants without payoffs, characters who
haven't appeared in many chapters, inventory items that vanish, factions that
change power without on-page cause. Propose coordinated fixes. No new idea —
the idea is "tighten the canon".`;
    case 'backfill':
      return `MODE: BACKFILL.
An entity was just added to the canon:
${JSON.stringify(entity || {}, null, 2)}
Propose 5-10 retroactive mentions across earlier chapters that would make this
entity feel like it was always there. Each proposal should include concrete
before/after prose for the target chapter.`;
    case 'scene':
      return `MODE: WEAVE SCENE.
A transcript / raw draft arrived; fold it into the canon as a scene and propose
supporting edits (new items, relationship updates, thread ticks).
TRANSCRIPT:
${String(transcript || '').slice(0, 6000)}`;
    case 'single':
    default:
      return `MODE: NEW IDEA.\nIDEA:\n${String(idea)}`;
  }
}

export async function proposeWeave(idea, worldState, bookId, options = {}) {
  const mode = options.mode || 'single';
  const chapters = pickChaptersFor(worldState, bookId);
  const actors = worldState?.actors || [];
  const threads = worldState?.plotThreads || worldState?.plot?.threads || [];
  const items = worldState?.itemBank || [];
  const places = worldState?.places || [];
  const factions = worldState?.factions || [];
  const currentChapter = options.currentChapter ?? options.chapterId
    ?? chapters[chapters.length - 1]?.id ?? 1;
  const book = worldState?.books?.[bookId];
  const activeChapterRow = findChapterById(chapters, currentChapter);
  const manuscriptBlock = buildManuscriptGroundingBlock(chapters, currentChapter);
  const excerptForBrain = excerptFromChapter(activeChapterRow);
  const chapterNumberForBrain = activeChapterRow?.chapterNumber ?? activeChapterRow?.number
    ?? activeChapterRow?.id ?? currentChapter;

  const prompt = [
    'You are the Canon Weaver, an editor that proposes coordinated changes',
    "across a novel's world, cast, plot, timeline, atlas, items, wiki and",
    "chapters in response to a writer's idea or a continuity review. Output",
    'STRICT JSON only.',
    '',
    modeInstructions(mode, { idea, entity: options.entity, transcript: options.transcript }),
    '',
    `BOOK: ${book?.title || 'Untitled'}   Current chapter: ${currentChapter}`,
    '',
    'CAST:',
    summariseCast(actors),
    '',
    'CHAPTERS (metadata only — titles/summaries):',
    summariseChapters(chapters),
    '',
    'MANUSCRIPT GROUNDING (read this for voice, facts, and who is actually on the page):',
    manuscriptBlock,
    '',
    'Grounding rules:',
    '- The manuscript block above is the canonical source for who appears and how the prose sounds.',
    '- The IDEA may name people or events not yet on the page — treat those as author intent for NEW proposals.',
    '- Do not invent extra Cast entries unless the IDEA calls for them or they are clearly implied by the manuscript.',
    '- Prefer tying items/places/plot to names that already appear in CAST or the manuscript excerpt.',
    '',
    'PLOT THREADS:',
    summarisePlotThreads(threads),
    '',
    'ITEMS:',
    summariseItems(items),
    '',
    'PLACES:',
    summarisePlaces(places),
    '',
    'FACTIONS:',
    summariseFactions(factions),
    '',
    'Return JSON:',
    '{',
    '  "confidence": 0.0-1.0,',
    '  "rationale": "1-3 sentence high-level summary of what this weave does",',
    '  "edits": [',
    '    {',
    '      "id": "stable-id-string",',
    '      "system": "World | Cast | Plot | Timeline | Atlas | Chapter | Item | Skill | Wiki | Faction",',
    '      "action": "create | update | trait-hint | suggest-edit | pin-place | create-thread | add-to-inventory | tick-beat",',
    '      "target": "optional name of target entity (actor name, chapter number, place name, item name)",',
    '      "title": "one-line human title",',
    '      "reasoning": "2-4 sentences explaining WHY and how this fits existing canon",',
    '      "payload": { /* system-specific structured object (e.g. {name, type, desc} for Item) */ },',
    '      "references": ["ch.N", "ch.M"]',
    '    }',
    '  ]',
    '}',
    '',
    'Guidance:',
    '- Never change anything destructively; propose additions and soft trait hints.',
    '- Include at least one Chapter edit with concrete before/after prose if a scene is implied.',
    '- Touch MULTIPLE systems — a real weave usually hits 3-5 of them (e.g. a cursed dagger = Item + Cast inventory add + Wiki entry + Plot thread tick + Chapter foreshadow).',
    '- Match existing tone. No purple prose. Be surgical.',
    '- 5 to 14 edits total.',
  ].join('\n');

  // Pull the author's full voice/style stack (style reference, chapter
  // memories, genre guide, writer preferences) and layer it into the system
  // prompt so any Chapter `before/after` prose inside the proposal matches the
  // book's actual voice — not generic AI filler.
  let styleSystem = 'Return only valid JSON. Do not wrap in markdown.';
  try {
    const textForBrain = excerptForBrain
      ? excerptForBrain.slice(-2000)
      : '';
    const { systemContext } = await storyBrain.getContext({
      text: textForBrain,
      chapterNumber: typeof chapterNumberForBrain === 'number' ? chapterNumberForBrain : null,
      bookId,
      chapterId: activeChapterRow?.id ?? currentChapter,
      action: 'continue',
    });
    if (systemContext) {
      styleSystem = `You are the Canon Weaver. Match the book's voice EXACTLY when writing any chapter prose (same stack as Continue Writing).

${systemContext}

Return only valid JSON. Do not wrap in markdown.`;
    }
  } catch (_err) { /* fall back to the bare JSON instruction */ }

  try {
    const response = await aiService.callAI(prompt, 'structured', styleSystem);
    const parsed = safeParseJSON(response);
    if (!parsed || !Array.isArray(parsed.edits)) return fallbackProposal(idea, mode);
    parsed.edits.forEach((e, i) => {
      if (!e.id) e.id = `e_${Date.now()}_${i}`;
    });
    return {
      confidence: parsed.confidence || 0.7,
      rationale: parsed.rationale || null,
      edits: parsed.edits,
      mode,
    };
  } catch (e) {
    console.warn('[weaverAI] proposeWeave fallback:', e);
    return fallbackProposal(idea, mode);
  }
}

function fallbackProposal(idea, mode = 'single') {
  const id = (x) => `e_${Date.now()}_${x}`;
  const label = mode === 'sweep'
    ? 'Continuity sweep placeholder'
    : mode === 'backfill' ? 'Backfill placeholder'
    : mode === 'scene' ? 'Scene weave placeholder'
    : 'Idea placeholder';
  return {
    confidence: 0.5,
    rationale: `Offline fallback (${label}). Connect an AI provider in Settings for real proposals.`,
    mode,
    edits: [
      {
        id: id(1),
        system: 'World',
        action: 'create',
        title: 'Add a world-entry placeholder',
        reasoning: 'AI provider unreachable or returned unparseable output. Placeholder keeps the review flow working so you can exercise accept/reject.',
        payload: { note: String(idea || '(no text)').slice(0, 400) },
        references: [],
      },
      {
        id: id(2),
        system: 'Chapter',
        action: 'suggest-edit',
        title: 'Suggest a 2-line foreshadow in the next chapter',
        reasoning: 'Placeholder Chapter edit so the Review view shows the before/after pattern.',
        payload: { before: '(no preview available)', after: '(no preview available)', intrusion: 'low' },
        references: [],
      },
    ],
  };
}

/**
 * Public, tiny command bus so non-rail triggers (Daily Spark "Use this",
 * Interview handoff, mobile Capture, the ?capture=1 deep link) can ask the
 * Write page's Weaver rail to start a weave. The rail subscribes via
 * `subscribeWeaver` in a useEffect; triggers call `dispatchWeaver`.
 */
const weaverBus = (() => {
  const listeners = new Set();
  return {
    dispatch(payload) { listeners.forEach((fn) => { try { fn(payload); } catch (_e) {} }); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();

export function dispatchWeaver(payload) { weaverBus.dispatch(payload); }
export function subscribeWeaver(fn) { return weaverBus.subscribe(fn); }

/**
 * runSweep - one canonical way for any surface (World audit, Plot header,
 * future Atlas audits) to queue a Canon Weaver continuity sweep with a
 * scope hint. Keeps the toast + navigation behaviour in a single place so
 * the UX stays consistent.
 *
 * scope: 'world' | 'plot' | 'atlas' | 'all' (default 'all')
 */
export function runSweep({ scope = 'all', onNavigate, toast } = {}) {
  dispatchWeaver({
    mode: 'sweep',
    autoRun: true,
    entity: { scope },
  });
  if (toast) {
    toast.info?.(`Canon Weaver ${scope === 'all' ? 'continuity' : scope} sweep queued.`);
  }
  onNavigate?.('write');
}

// eslint-disable-next-line import/no-anonymous-default-export
export default { proposeWeave, SYSTEM_COLORS, SYSTEM_ICON, dispatchWeaver, subscribeWeaver, runSweep };

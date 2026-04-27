// Loomwright — Plot roadmap section schema.

const SCHEMA = `{
  "targetChapters": number,
  "targetWords": number,
  "outlineText": string,                  // multi-line; one beat per line preferred
  "majorBeats": [                         // structured beats
    { "chapter": number, "title": string, "summary": string, "purpose": string }
  ],
  "actStructure": {                       // 3-act / 4-act / Save-the-Cat?
    "shape": "3-act" | "4-act" | "5-act" | "save-the-cat" | "hero-journey" | "fichtean" | "in-medias-res" | "anthology",
    "actBreaks": number[]                 // chapter numbers where acts break
  },
  "thematicArc": string,                  // 1-2 sentences on the moral / philosophical journey
  "openingHook": string,                  // 1 sentence — chapter 1's grab
  "midpointReversal": string,             // 1 sentence — what flips at the centre
  "endingType": "tragic" | "bittersweet" | "redemptive" | "pyrrhic" | "open" | "happy" | "ironic",
  "promisesToReader": string[],           // 4-7 expectations the opening sets that the ending must honour
  "subplotThreads": [                     // 2-5 named subplots running through
    { "name": string, "owner": string, "arcSummary": string }
  ],
  "openQuestions": string[]               // 3-5 questions the writer hasn't answered yet
}`;

const SECTION = {
  id: 'plotRoadmap',
  title: 'Plot roadmap',
  referenceCategories: ['plot'],
  prompt(state) {
    return [
      `You are a story architect. Take the novelist's outline draft and ENRICH it`,
      `into a structured plot roadmap the AI assistant will use to keep chapter`,
      `pacing, theme, and promised payoffs on track.`,
      ``,
      `Preserve every beat they've already named. Where their outline is sparse,`,
      `propose a complete majorBeats array consistent with their premise + genres.`,
      `Surface "openQuestions" honestly — things THEY still have to decide.`,
      ``,
      `Return ONLY this JSON:`,
      ``,
      SCHEMA,
      ``,
      `--- Their plot brief ---`,
      `Premise: ${state.premise || '(none)'}`,
      `Genres: ${(state.genres || []).join(', ') || '(none)'}`,
      `Target chapters: ${state.targetChapters || 25}`,
      `Target words: ${state.targetWords || 90000}`,
      ``,
      `Existing outline:`,
      '```',
      state.outlineText || '(empty)',
      '```',
      ``,
      `Constraints:`,
      `- "majorBeats" should cover the FULL targetChapters span. Each beat has a`,
      `  purpose (what it does for the story, not just what happens).`,
      `- "promisesToReader" is the contract — what early hooks must pay off late.`,
      `- "subplotThreads" each have an owner (named character if known) so the AI`,
      `  knows whose arc each thread belongs to.`,
      `- "openQuestions" prove honesty — list real things still TBD.`,
    ].join('\n');
  },
  validate(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    if (typeof parsed.targetChapters !== 'number' || parsed.targetChapters < 1) return false;
    if (typeof parsed.targetWords !== 'number' || parsed.targetWords < 1000) return false;
    if (typeof parsed.outlineText !== 'string') return false;
    return true;
  },
  applyTo(state, parsed) {
    return {
      ...state,
      targetChapters: parsed.targetChapters ?? state.targetChapters,
      targetWords: parsed.targetWords ?? state.targetWords,
      outlineText: parsed.outlineText ?? state.outlineText,
      majorBeats: parsed.majorBeats ?? state.majorBeats,
      actStructure: parsed.actStructure ?? state.actStructure,
      thematicArc: parsed.thematicArc ?? state.thematicArc,
      openingHook: parsed.openingHook ?? state.openingHook,
      midpointReversal: parsed.midpointReversal ?? state.midpointReversal,
      endingType: parsed.endingType ?? state.endingType,
      promisesToReader: parsed.promisesToReader ?? state.promisesToReader,
      subplotThreads: parsed.subplotThreads ?? state.subplotThreads,
      openQuestions: parsed.openQuestions ?? state.openQuestions,
    };
  },
  required: ['outlineText'],
};

export default SECTION;

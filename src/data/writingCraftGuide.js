/**
 * Writing Craft Guide
 * Deep narrative knowledge organized by writing action.
 * This is NOT generic writing advice - these are specific, actionable directives
 * that tell the AI HOW to write, not just what to avoid.
 *
 * Each section maps to a writing action the user can trigger.
 * The AI receives ONLY the relevant section, keeping tokens low.
 */

const writingCraftGuide = {

  // ─── CONTINUATION ───────────────────────────────────────────
  continue: {
    directive: `CONTINUATION RULES:
- Read the last 2-3 paragraphs as a musician reads a melody: match the RHYTHM, not just the words.
- If the previous passage was dialogue-heavy, the next beat should pull outward (action, setting, internal thought) before returning to dialogue. Conversations need breathing room.
- If the previous passage was description, break it with action or dialogue. Never stack description on description.
- End your continuation mid-momentum. Stop at a moment of rising tension, an unanswered question, or a character about to act — never at a natural resting point. The user will continue from where you stop.
- Mirror sentence length patterns. If the author writes in short, punchy sentences during tension, do the same. If they use flowing compound sentences for reflection, follow suit.
- NEVER summarize what just happened. NEVER use transition phrases like "Meanwhile" or "As the hours passed". Just continue the scene as if you're the same author mid-sentence.
- If characters were mid-conversation, continue the conversation. Don't skip ahead.
- Maintain the EXACT point of view (first/third limited/omniscient) established in the text.`,

    pacing: `PACING FOR CONTINUATION:
- Count the ratio of dialogue:action:description in the last 500 words. Maintain that ratio.
- If a scene has been running for more than ~800 words without a shift, introduce a micro-shift: an interruption, a sensory detail that changes the mood, or an internal thought that reframes the scene.
- Short paragraphs (1-2 sentences) signal urgency. Long paragraphs signal contemplation. Match what came before.`
  },

  // ─── SCENE GENERATION ──────────────────────────────────────
  scene: {
    directive: `SCENE CONSTRUCTION RULES:
- A scene is a UNIT OF CHANGE. Something must be different by the end: a relationship shifts, information is revealed, a decision is made, or a situation escalates.
- Open with grounding: Where are we? Who is present? What's the immediate sensory environment? Do this in ONE sentence, woven into action — never as a standalone paragraph of description.
- Build to a TURNING POINT. Every scene pivots: the character learns something, is forced to choose, or the situation changes. Put this at the 60-70% mark of the scene.
- Close with FORWARD MOMENTUM. The last line should make the reader want to keep going. A question raised, a threat implied, a decision with consequences, or an emotional beat that resonates.
- Avoid the "and then" trap. Scenes aren't lists of things that happen. Each beat should CAUSE the next.
- Include at least TWO senses per scene. Sight is free — earn the others: the smell of a room, the texture of a surface, the taste of fear.`,

    structure: `SCENE STRUCTURE:
1. HOOK (1-2 sentences): Arrive late. Drop us into action, dialogue, or a striking image.
2. ESCALATION (2-3 paragraphs): Develop the situation. Introduce complications. Layer tension.
3. TURNING POINT (1-2 paragraphs): The moment things change. This is why the scene exists.
4. AFTERMATH/HOOK (1-2 sentences): Quick emotional beat or new question that propels forward.

SCENE TYPES AND THEIR PURPOSE:
- Action scenes: Short sentences, concrete verbs, sensory overload, minimal internal thought
- Dialogue scenes: Character-revealing exchanges, subtext > text, broken by action beats
- Reflection scenes: Internal processing of events, character growth moments, slower pacing
- Discovery scenes: Information revealed through action/dialogue, never through exposition dumps
- Transition scenes: Brief bridges between major scenes — keep under 200 words`
  },

  // ─── DIALOGUE ──────────────────────────────────────────────
  dialogue: {
    directive: `DIALOGUE MASTERY RULES:
- Every line of dialogue must do at LEAST one of: reveal character, advance plot, create conflict, or build relationship dynamics. Lines that only convey information are exposition wearing a mask.
- People don't answer questions directly. They deflect, answer a different question, change the subject, or reveal through what they DON'T say.
- Each character's dialogue should be identifiable WITHOUT tags. Achieve this through: vocabulary level, sentence length, verbal tics, topics they gravitate toward, and their relationship to formality.
- ACTION BEATS > DIALOGUE TAGS. Instead of "he said angrily," write "He slammed his palm on the table." Action beats do double duty: they identify the speaker AND show emotion/physicality.
- Interrupt conversations. Real people cut each other off, talk over each other, and change subjects abruptly. Use em dashes (—) for interruptions.
- SUBTEXT IS KING. The most powerful dialogue is when characters say one thing and mean another. A character asking "Are you hungry?" might really be asking "Are you okay?"`,

    patterns: `DIALOGUE PATTERNS:
- Interrogation pattern: Short questions, deflecting answers, building pressure
- Banter pattern: Quick volleys, shared references, comfortable rhythm
- Conflict pattern: Talking past each other, different assumptions, escalating stakes
- Revelation pattern: Casual setup → bombshell line → stunned silence → aftermath
- Comic pattern: Straight man/funny man dynamic, misunderstandings played for laughs, understatement

DIALOGUE FORMATTING:
- New speaker = new paragraph, always
- Keep individual speech turns under 3 sentences unless the character is monologuing (and monologues should be rare and earned)
- Break long speeches with action beats or reactions from listeners
- Use silence as dialogue: "She said nothing" is sometimes the most powerful line`
  },

  // ─── REWRITE / IMPROVE ────────────────────────────────────
  rewrite: {
    directive: `REWRITING RULES:
- Preserve the SOUL of the passage. Rewriting means making it better, not making it different.
- Identify the weakest element: Is it telling instead of showing? Passive voice? Vague description? Flat dialogue? Fix THAT, leave the rest.
- Upgrade verbs first. "He walked across the room" → "He crossed the room" or "He stalked across the room" — the verb carries the character.
- Cut filter words: "he felt," "she noticed," "they could see." Instead of "She felt the cold wind," write "The cold wind bit her skin."
- Cut hedging words: "somewhat," "rather," "quite," "a bit," "slightly." These are confidence killers.
- Tighten: if you can say it in 8 words instead of 15, do it. Density > length.
- Don't change the author's voice. If they write with dark humor, don't make it earnest. If they write spare prose, don't add flowery description.`,

    checklist: `REWRITE QUALITY CHECKLIST:
□ Every sentence earns its place (cut any that don't advance scene/character/mood)
□ Strong verbs carry the action (no "was walking" when "strode" works)
□ Sensory details are specific, not generic ("copper tang of blood" not "metallic smell")
□ Dialogue sounds like speech, not prose (contractions, fragments, interruptions)
□ Internal thoughts are italicized or clearly marked
□ Point of view is consistent throughout
□ Emotional beats are shown through physical action, not stated`
  },

  // ─── EXPANSION ─────────────────────────────────────────────
  expand: {
    directive: `EXPANSION RULES:
- Expansion is NOT padding. Every added sentence must deepen understanding, build mood, or develop character.
- Add LAYERS, not LENGTH. Expand by adding: sensory details, character reactions, environmental details, subtext in dialogue, or internal thought.
- Identify what's MISSING from the original: Is it all dialogue with no setting? Add grounding details. Is it all action with no emotion? Add internal beats. Is it all description with no movement? Add action.
- Maintain the original's pacing signature. If it was fast-paced, add details that maintain speed (short sensory hits between action). If it was contemplative, add depth through extended observation.
- NEVER pad with: weather descriptions that don't serve mood, characters' physical descriptions mid-scene, backstory that interrupts momentum, or restatements of what just happened.
- A good expansion feels like the passage was always meant to be this length.`
  },

  // ─── MOOD ADJUSTMENT ──────────────────────────────────────
  mood: {
    comedy: `COMEDY WRITING DIRECTIVES:
- Comedy lives in SPECIFICITY. "He tripped" isn't funny. "He tripped over a cairn of empty Red Bull cans he'd arranged as a tribute to productivity" is.
- The RULE OF THREE: Setup, reinforcement, subversion. Establish a pattern with two examples, then break it with the third.
- UNDERSTATEMENT > OVERSTATEMENT. "Well, that's not ideal" while the building burns is funnier than describing the comedy of the fire.
- COMIC TIMING requires rhythm: build tension, pause (a new paragraph acts as a beat), then deliver the punchline. The pause is essential.
- DRAMATIC IRONY: Let the reader know something the character doesn't. The gap between what we know and what they know IS the comedy.
- Never EXPLAIN the joke. If you have to tell the reader why something is funny, it isn't.
- BATHOS: Follow something grand/serious with something mundane. "He had survived the apocalypse, the collapse of civilization, and three separate attempts on his life. The parking meter, however, had defeated him."`,

    horror: `HORROR/TENSION WRITING DIRECTIVES:
- What you DON'T show is scarier than what you do. Let the reader's imagination fill the gaps.
- Build dread through NORMALCY VIOLATIONS: something that should be normal but isn't quite right. The smile that's too wide. The room that's too quiet. The door that's already open.
- Use the BODY as horror's canvas: involuntary reactions (goosebumps, cold sweat, racing heart) ground abstract fear in physical reality.
- ISOLATION amplifies horror. Cut off escape routes, allies, information, and hope — in that order.
- PACING: Slow, creeping sentences for building dread. Short, sharp sentences for the moment of horror. Then silence (a paragraph break) for the aftermath.
- SENSORY HORROR: Don't just describe what looks wrong. What does it SMELL like? What does the air TASTE like? What is that TEXTURE?
- The UNCANNY VALLEY: Things that are almost-but-not-quite human are deeply unsettling. Use this for characters, locations, and situations.`,

    tension: `TENSION BUILDING DIRECTIVES:
- Tension requires STAKES. The reader must know what can be lost. Remind them.
- TICKING CLOCK: Give a deadline, then keep cutting the time. "You have one hour" → "Thirty minutes" → "The timer showed 4:17."
- PARALLEL CUTTING: If possible, alternate between the danger approaching and the character unaware. Dramatic irony creates agonizing tension.
- PHYSICAL TELLS: Show tension through the body: held breath, tight grip, dry mouth, tunnel vision.
- SENTENCE LENGTH: As tension rises, sentences get shorter. Paragraphs get shorter. Everything compresses. Like a fist closing.
- END CHAPTERS/SCENES at the PEAK of tension, never after the resolution. Make them turn the page.`
  },

  // ─── STORY PLANNING ───────────────────────────────────────
  planning: {
    narrative_structures: `NARRATIVE STRUCTURE TEMPLATES:

THREE-ACT STRUCTURE:
Act 1 (25%): Setup → Inciting Incident → First Plot Point (character commits to the journey)
Act 2a (25%): Rising action → New world/rules → Midpoint reversal
Act 2b (25%): Complications → All is lost moment → Dark night of the soul
Act 3 (25%): Climax → Resolution → New equilibrium

FIVE-ACT STRUCTURE (Shakespeare/TV):
1. Exposition: World and characters established
2. Rising Action: Complications and escalation
3. Climax: The peak moment, point of no return
4. Falling Action: Consequences unfold
5. Resolution: New status quo

KISHOTENKETSU (4-act, no conflict required):
Ki: Introduction of elements
Sho: Development of elements
Ten: Twist — unexpected connection between elements
Ketsu: Resolution and new understanding

STORY CIRCLE (Dan Harmon):
1. Character is in a zone of comfort
2. They want something
3. They enter an unfamiliar situation
4. They adapt to it
5. They get what they wanted
6. They pay a heavy price for it
7. They return to their familiar situation
8. Having changed`,

    chapter_planning: `CHAPTER PLANNING INTELLIGENCE:

CHAPTER PURPOSE TYPES:
- Setup chapters: Introduce elements that will pay off later. Plant seeds subtly.
- Escalation chapters: Raise stakes. Things get worse, more complex, more urgent.
- Revelation chapters: Hidden information comes to light. Reframes previous events.
- Character chapters: Deep dives into motivation, backstory, internal conflict.
- Action chapters: Events reach a peak. Decisions are made. Things change irreversibly.
- Aftermath chapters: Characters process what happened. Relationships shift. New normal established.

CHAPTER RHYTHM:
- Alternate between high-energy and low-energy chapters
- Every 3-4 chapters, deliver a significant revelation or status quo change
- End every chapter with either a question, a revelation, or a decision
- Start chapters with a different energy than how the previous one ended

CHAPTER ENDINGS (ranked by reader compulsion to continue):
1. Cliffhanger: Immediate danger or shocking revelation
2. Question: New mystery or unanswered question
3. Decision: Character faces a fork in the road
4. Revelation: Reader learns something the characters don't
5. Emotional: Quiet moment that deepens connection to character`
  },

  // ─── FORWARD THINKING ─────────────────────────────────────
  forwardThinking: {
    directive: `STORY PROGRESSION ANALYSIS:
When analyzing the story so far to suggest what comes next, consider:

CAUSE AND EFFECT CHAINS:
- What decisions have characters made that haven't had consequences yet? → These are ticking bombs.
- What information has been revealed that characters haven't acted on? → These are missed opportunities.
- What relationships have been established but not tested? → These are dramatic opportunities.

PROMISE AND PAYOFF:
- What has been set up (Chekhov's guns)? → These MUST fire eventually.
- What questions has the reader been asked? → These MUST be answered (even if the answer raises more questions).
- What character traits have been established? → These MUST be tested.

ESCALATION PATTERNS:
- The SAME type of challenge should not repeat. Each obstacle should be DIFFERENT in kind, not just degree.
- If the last challenge was physical, the next should be social, emotional, or intellectual.
- If the last challenge tested one character, the next should test a different one or the group dynamic.

DRAMATIC IRONY OPPORTUNITIES:
- Does the reader know something a character doesn't? → Exploit this for tension.
- Can a character's strength become their weakness? → This is rich territory.
- Are two characters on a collision course they don't see? → Build toward the intersection.`
  },

  // ─── CHARACTER INTRODUCTION ────────────────────────────────
  characterIntro: {
    directive: `CHARACTER INTRODUCTION RULES:
- Introduce through ACTION, not description. What the character DOES tells us who they ARE.
- Give ONE vivid physical detail, not a police report. "A woman whose smile arrived seconds before the rest of her face" > "She was tall with brown hair and green eyes."
- Establish their RELATIONSHIP to the scene. Why are they here? What do they want in this moment?
- Voice should be IMMEDIATELY distinct. Their first line of dialogue should be unmistakably theirs.
- If introducing to an existing cast, define them through CONTRAST with existing characters.
- The reader should understand this character's FUNCTION in the story within their first 100 words: are they an ally, obstacle, mirror, or catalyst?`
  },

  // ─── STYLE MATCHING ──────────────────────────────────────
  styleMatch: {
    directive: `STYLE MATCHING RULES:
- Style is a FINGERPRINT made up of: sentence length distribution, vocabulary register, metaphor density, humor frequency, darkness threshold, and narrative distance.
- Match ALL of these simultaneously, not just "tone." A passage can have the right tone but wrong rhythm.
- Pay attention to what the author DOESN'T do as much as what they do. If they never use semicolons, neither should you. If they never write paragraphs longer than 3 sentences, follow suit.
- Vocabulary register: If the author uses casual/colloquial language, don't suddenly deploy SAT words. If they write with literary precision, don't dumb it down.
- Metaphor density: Some authors use metaphors constantly. Others use them sparingly for maximum impact. Match the frequency, not just the quality.`
  }
};

export default writingCraftGuide;

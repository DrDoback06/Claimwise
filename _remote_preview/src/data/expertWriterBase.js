/**
 * Expert Writer Base Document
 * Static foundation of expert writing principles that ships with the app
 * This provides the AI with professional writing knowledge before applying user-specific style
 */

export const expertWriterBase = {
  narrativeStructure: {
    title: "Narrative Structure & Pacing",
    content: `
=== NARRATIVE STRUCTURE FUNDAMENTALS ===

**Scene Construction:**
- Every scene must have a purpose: advance plot, develop character, or establish mood
- Scenes should begin in media res (in the middle of action) when possible
- End scenes with either a hook, revelation, or emotional beat
- Vary scene length: short scenes for tension, longer for development

**Pacing Control:**
- Fast pacing: Short sentences, active voice, immediate action, minimal description
- Slow pacing: Longer sentences, sensory details, internal monologue, reflection
- Use pacing shifts to create rhythm: fast action → slow reflection → fast again
- Dialogue speeds up pacing; description slows it down

**Transitions:**
- Smooth transitions between scenes maintain flow
- Use time markers ("Three hours later"), location shifts, or emotional beats
- Avoid jarring jumps unless intentional for effect
- Chapter breaks are natural pause points
    `.trim()
  },

  characterDevelopment: {
    title: "Character Development & Voice",
    content: `
=== CHARACTER DEVELOPMENT ===

**Character Consistency:**
- Characters must act according to their established personality, background, and motivations
- Character voice should be distinct: speech patterns, vocabulary, sentence structure
- Physical descriptions should match established appearance
- Skills and abilities must align with character's background

**Character Growth:**
- Characters should evolve, but change must be earned and believable
- Track character arcs: where they start, key moments, where they end
- Internal conflicts drive character development
- External conflicts test and reveal character

**Dialogue:**
- Each character speaks differently: vocabulary, sentence length, formality, humor style
- Dialogue should reveal character, advance plot, or both
- Subtext is more powerful than explicit statements
- Avoid "talking heads" - include action, setting, and body language
    `.trim()
  },

  dialogueWriting: {
    title: "Dialogue Mastery",
    content: `
=== DIALOGUE WRITING ===

**Natural Speech:**
- People interrupt, trail off, use contractions, speak in fragments
- Avoid perfect grammar unless character demands it
- Use dialogue tags sparingly - action beats are often better
- Vary tag placement: beginning, middle, end, or no tag at all

**Dialogue Functions:**
- Reveal character through word choice and speech patterns
- Advance plot through information exchange
- Create conflict through disagreement or misunderstanding
- Build relationships through conversation dynamics

**Dialogue Tags & Beats:**
- "Said" is invisible - use it most often
- Action beats (character movements) can replace tags
- Avoid adverbs in tags ("he said angrily") - show through action
- Tags should clarify who's speaking, not describe how
    `.trim()
  },

  descriptionAndImagery: {
    title: "Description & Sensory Details",
    content: `
=== DESCRIPTION & IMAGERY ===

**Show, Don't Tell:**
- Instead of "he was angry," show: "His fists clenched, jaw tight"
- Instead of "it was cold," show: "Breath visible, fingers numb"
- Actions reveal emotions and states more powerfully than labels

**Sensory Details:**
- Engage all five senses: sight, sound, smell, taste, touch
- Specific details are more powerful than generic ones
- Use sensory details to establish mood and setting
- Balance: too little = flat, too much = overwhelming

**Description Economy:**
- Every description should serve a purpose: mood, character, plot, or setting
- Cut descriptions that don't add value
- Vary detail density: sparse for action, rich for important moments
- Let readers fill in some details with their imagination
    `.trim()
  },

  toneAndMood: {
    title: "Tone & Mood Control",
    content: `
=== TONE & MOOD ===

**Tone Consistency:**
- Tone is the author's attitude toward subject and audience
- Maintain consistent tone unless shifting is intentional
- Tone affects word choice, sentence structure, and content selection

**Mood Creation:**
- Mood is the emotional atmosphere experienced by the reader
- Created through: setting, description, pacing, dialogue, and word choice
- Mood can shift within scenes, but transitions should be smooth
- Contrasting moods (comedy/horror) require careful balance

**Emotional Resonance:**
- Connect with readers through universal emotions
- Earn emotional moments - don't force them
- Understatement often more powerful than overstatement
- Let readers feel emotions rather than telling them what to feel
    `.trim()
  },

  plotAndConflict: {
    title: "Plot & Conflict",
    content: `
=== PLOT & CONFLICT ===

**Plot Structure:**
- Every story needs: inciting incident, rising action, climax, resolution
- Scenes should build toward plot points
- Subplots enrich main plot but must connect meaningfully
- Foreshadowing creates anticipation; payoffs satisfy it

**Conflict Types:**
- Internal: Character vs. self (desires, fears, beliefs)
- External: Character vs. character, nature, society, technology
- Multiple conflict layers create depth
- Conflict drives all action - without it, nothing happens

**Tension & Suspense:**
- Tension: reader knows something bad might happen
- Suspense: reader knows something will happen but not when/how
- Create through: unanswered questions, time pressure, stakes
- Release tension periodically - constant tension is exhausting
    `.trim()
  },

  worldBuilding: {
    title: "World Building & Setting",
    content: `
=== WORLD BUILDING ===

**Setting Integration:**
- Setting should feel lived-in, not just described
- Show world through character interaction, not exposition dumps
- Details should feel natural, not forced
- Consistency matters: if magic exists, establish rules and stick to them

**Exposition:**
- Weave world-building into action and dialogue
- Avoid info-dumps - reveal information as needed
- Let readers discover the world alongside characters
- Trust readers to piece together information

**Rules & Consistency:**
- Establish world rules early and consistently
- Break rules only if it serves story and is explained
- Internal logic must be consistent
- Readers will notice inconsistencies
    `.trim()
  },

  proseStyle: {
    title: "Prose Style & Voice",
    content: `
=== PROSE STYLE ===

**Sentence Variety:**
- Mix sentence lengths: short for impact, long for flow
- Vary sentence structure: simple, compound, complex
- Rhythm matters: read aloud to hear the music
- Parallel structure creates emphasis

**Word Choice:**
- Specific words are stronger than generic ones
- Active voice is usually stronger than passive
- Strong verbs carry more weight than weak verbs + adverbs
- Cut unnecessary words: "very," "really," "quite," "somewhat"

**Voice & Style:**
- Voice is the unique way you tell stories
- Style emerges from consistent choices: sentence length, word choice, tone
- Develop distinctive voice through practice and consistency
- Voice should serve the story, not overshadow it
    `.trim()
  },

  humorAndComedy: {
    title: "Humor & Comedy Writing",
    content: `
=== HUMOR & COMEDY ===

**Comedy Timing:**
- Setup and payoff: establish expectation, then subvert or fulfill
- Pacing matters: too fast = missed, too slow = lost
- Rule of three: setup, setup, punchline
- Deadpan delivery can be funnier than obvious jokes

**Types of Humor:**
- Wordplay: puns, double meanings, clever phrasing
- Situational: absurd circumstances, misunderstandings
- Character-based: quirks, flaws, reactions
- Dark humor: finding comedy in serious/dark situations
- Satire: using humor to critique or comment

**Comedy Rules:**
- Know your audience's sense of humor
- Comedy requires precision - timing and word choice matter
- What's funny in context may not be funny out of context
- Balance: too much comedy can undermine serious moments
    `.trim()
  },

  horrorAndTension: {
    title: "Horror & Tension Writing",
    content: `
=== HORROR & TENSION ===

**Building Dread:**
- Fear of the unknown is stronger than showing the monster
- Atmosphere matters: setting, mood, pacing create unease
- Slow build: tension escalates gradually
- What's suggested is often scarier than what's shown

**Horror Techniques:**
- Unreliable narrator creates uncertainty
- Isolation: remove safety nets, cut off escape routes
- Body horror: violation of physical integrity
- Psychological horror: fear of the mind, sanity, identity
- Cosmic horror: fear of the incomprehensible

**Tension Management:**
- Vary intensity: peaks and valleys prevent exhaustion
- Release tension periodically before building again
- Silence and pauses can be more powerful than action
- Let readers' imaginations do the heavy lifting
    `.trim()
  }
};

/**
 * Get all expert writer content as a formatted string
 */
export const getExpertWriterContent = () => {
  const sections = Object.values(expertWriterBase);
  return sections.map(section => 
    `\n${section.title}\n${section.content}`
  ).join('\n\n');
};

export default expertWriterBase;

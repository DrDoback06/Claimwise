/**
 * Genre-Specific Writing Guides
 * Deep knowledge of genre conventions, reader expectations, and craft techniques
 * specific to each genre. Ships with the app — no AI tokens needed.
 *
 * The AI receives the relevant genre guide based on the story's genre setting,
 * giving it expert-level genre knowledge without the user having to explain anything.
 */

const genreGuides = {
  fantasy: {
    label: 'Fantasy',
    conventions: `FANTASY GENRE INTELLIGENCE:

MAGIC SYSTEMS:
- Hard magic: Clear rules, costs, limitations. Reader can predict how it works. (Sanderson)
- Soft magic: Mysterious, evocative, unpredictable. Creates wonder. (Tolkien)
- Your system should be CONSISTENT whichever approach you choose.
- Magic must have COST. Free magic removes tension.

WORLD-BUILDING TRAPS TO AVOID:
- The history lecture: Don't stop the story to explain the world. Weave it in.
- The map tour: Characters exploring just to show the reader geography.
- Made-up word overload: More than 3-4 new terms per chapter overwhelms readers.
- Chosen One syndrome: If your hero is destined, ensure they still CHOOSE.

WHAT FANTASY READERS EXPECT:
- A world that feels larger than the story being told
- Internal consistency (your own rules matter more than "realism")
- Character agency — even in worlds of prophecy and fate
- A sense of wonder balanced with grounded emotional truth
- Satisfying magic use that follows established rules`,

    pacing: `FANTASY PACING:
- Early chapters: immerse through character experience, not exposition
- Quest structure: each leg of the journey should change the character, not just the location
- Battle scenes: focus on individual character experience within chaos, not army movements
- Political intrigue: tension through what's unsaid, alliances that shift
- Climactic magic: should feel earned by everything established earlier`
  },

  scifi: {
    label: 'Science Fiction',
    conventions: `SCIENCE FICTION GENRE INTELLIGENCE:

WORLD-BUILDING:
- The technology should reflect a THEME. What does this tech say about humanity?
- "One big lie" rule: you get ONE impossible thing. Everything else follows logically.
- Don't explain the technology — show people USING it, living with its consequences.
- The best sci-fi is about TODAY told through the lens of tomorrow.

COMMON PITFALLS:
- Technobabble: More technical detail ≠ more believable. Focus on human impact.
- Utopia/dystopia extremes: The most interesting futures have both good and bad.
- Forgetting characters have personal lives amid world-scale events.
- Info-dumping about how the technology works instead of showing its effects.

WHAT SCI-FI READERS EXPECT:
- Internally consistent extrapolation from real science/technology
- Characters who feel human even in alien circumstances
- Ideas that make them think differently about the real world
- Tension between technological capability and human limitation
- The technology changes society, society changes people, people change the story`,

    pacing: `SCI-FI PACING:
- Reveal technology through USE, not explanation
- Each discovery should raise more questions than it answers
- Alternate between intimate character moments and big-scale implications
- Technical problem-solving scenes need emotional stakes to stay engaging
- The climax should show the human truth the technology was metaphoring all along`
  },

  thriller: {
    label: 'Thriller / Suspense',
    conventions: `THRILLER GENRE INTELLIGENCE:

TENSION ARCHITECTURE:
- Every chapter should end with a question, threat, or revelation
- The reader should ALWAYS be worried about what happens next
- Information is currency: give it strategically, withhold it purposefully
- The protagonist should be in ESCALATING danger — each solution creates a bigger problem

THE TICKING CLOCK:
- Establish deadlines early and reference them regularly
- As the clock runs down, cut between scenes faster
- The reader should feel time pressure physically

VILLAIN CRAFT:
- The antagonist should be winning for most of the story
- Their plan should make sense from THEIR perspective
- They should be competent — easy villains = no tension
- The best thrillers have villains who are right about something

WHAT THRILLER READERS EXPECT:
- Breathless pacing with brief moments of relief
- Twists that are surprising but feel inevitable in hindsight
- A protagonist who's in genuine danger they might not survive
- An ending that resolves the main threat but costs the hero something`,

    pacing: `THRILLER PACING:
- Short chapters. Short scenes. The reader should never find a stopping point.
- Alternate between action and planning (but planning should feel urgent too)
- Cliffhanger chapters: end mid-action, mid-revelation, mid-decision
- Every scene should have a micro-tension even if it's not the main plot
- The last 20% should be relentless — once the climax begins, don't stop`
  },

  romance: {
    label: 'Romance',
    conventions: `ROMANCE GENRE INTELLIGENCE:

THE CENTRAL RELATIONSHIP:
- The relationship IS the plot. Everything serves it.
- Both characters must be equals — each should challenge and change the other
- Chemistry is built through: banter, tension, vulnerability, and shared moments
- The obstacles to the relationship should be MEANINGFUL, not manufactured misunderstandings

EMOTIONAL BEATS:
- Meet cute / first encounter: Must be memorable and establish dynamic
- Friction: They should NOT get along easily. Conflict reveals character.
- Vulnerability: Each character reveals something real. The armor comes off.
- Dark moment: Something threatens to end things permanently
- Grand gesture: One character proves their growth through action

WHAT ROMANCE READERS EXPECT:
- Emotionally satisfying arc (HEA or HFN — happy ever after or happy for now)
- Internal conflict > external obstacles
- Both characters change and grow because of each other
- Tension that's emotional and psychological, not just physical
- The "will they/won't they" question sustained until the right moment`,

    pacing: `ROMANCE PACING:
- Slow burn: delay gratification. Each step closer should feel earned.
- Alternate between: getting closer → pulling apart → getting closer again
- Emotional scenes need space to breathe — don't rush vulnerability
- The declaration of love should come at the RIGHT moment, never too early
- After the dark moment, the resolution should feel inevitable and satisfying`
  },

  horror: {
    label: 'Horror',
    conventions: `HORROR GENRE INTELLIGENCE:

FEAR ARCHITECTURE:
- Dread > shock. The anticipation of horror is more powerful than the horror itself.
- Establish NORMALCY first. Horror only works when there's something comfortable to violate.
- The unknown is scarier than the known. Delay revelation.
- Horror works on THREE levels: physical (body), psychological (mind), existential (meaning)

ATMOSPHERE:
- Setting IS character. The haunted house, the empty hospital, the too-quiet town.
- Use all senses: what does dread SMELL like? What does fear TASTE like?
- Silence is your most powerful tool. What you DON'T describe fills with reader's imagination.
- Normal things made slightly wrong are more unsettling than obviously monstrous things.

ESCALATION:
- Start with unease (something feels off)
- Move to dread (something IS wrong)
- Build to terror (the threat is real and close)
- Punctuate with horror (the worst happens — briefly)
- Return to dread (it's not over)

WHAT HORROR READERS EXPECT:
- Atmospheric dread that gets under their skin
- Characters they care about (horror without attachment is just gross)
- Rules that are consistent even if unknowable
- At least one moment that genuinely unsettles them
- The horror should MEAN something — it's a metaphor for real fear`,

    pacing: `HORROR PACING:
- Slow, creeping builds punctuated by sharp moments of horror
- Long, flowing sentences for dread → short, staccato sentences for horror
- Give the reader FALSE safety before pulling the rug
- The "quiet chapter" before the storm is essential — earned relief
- The final act should feel inescapable — every exit closes`
  },

  literary: {
    label: 'Literary Fiction',
    conventions: `LITERARY FICTION INTELLIGENCE:

CHARACTER DEPTH:
- Character IS plot. Internal change is the story.
- Ambiguity is a feature: characters should be complex enough to interpret differently
- Voice is everything: the WAY the story is told IS the story
- Subtext carries more weight than text — what's unsaid matters more than what's said

PROSE CRAFT:
- Every sentence should be intentional. Literary fiction earns its length.
- Imagery should be original — avoid clichés like the plague (see what I did there)
- Rhythm matters: read your prose aloud. It should have music.
- Let sentences do double duty: advance plot AND develop character AND build mood

STRUCTURE:
- Can be non-linear, fragmented, or unconventional — but must serve the STORY
- Experimental structure for its own sake is self-indulgent
- Quiet moments are just as important as dramatic ones
- The ending can be ambiguous — but it must feel COMPLETE

WHAT LITERARY READERS EXPECT:
- Beautiful, precise prose that rewards re-reading
- Characters who feel like real people with real contradictions
- Thematic depth that makes them think about life differently
- Emotional resonance that stays with them
- A unique voice they haven't heard before`,

    pacing: `LITERARY PACING:
- Prioritize depth over speed
- A single conversation can carry an entire chapter if it reveals enough
- Time can be compressed or expanded based on emotional significance
- The climax may be quiet — a realization, not an explosion
- Don't rush the ending. Let the reader sit with the final image.`
  },

  'dark-comedy': {
    label: 'Dark Comedy',
    conventions: `DARK COMEDY GENRE INTELLIGENCE:

THE BALANCE:
- Comedy and darkness must CO-EXIST, not alternate. The funniest moments should also be the darkest.
- The humor should come FROM the darkness, not despite it. "Laughing because the alternative is screaming."
- Tone whiplash is your weapon: a hilarious scene that suddenly becomes genuinely painful, or vice versa.
- The reader should feel guilty for laughing — that's the sweet spot.

COMEDY TECHNIQUES FOR DARK MATERIAL:
- Absurdist escalation: Start with something mildly wrong, then make it impossibly, hilariously wrong
- Bureaucratic horror: Systems and rules applied to situations where they're grotesquely inappropriate
- Understatement: Characters treating horrifying situations as mundane inconveniences
- Dramatic irony: The reader sees the horror; the characters are oblivious
- Comic specificity: "He died" isn't funny. "He died mid-sentence while explaining his dental plan" is.

SATIRE ELEMENTS:
- The best dark comedy CRITICIZES something real through exaggeration
- Institutions, social norms, power structures — these are your targets
- The humor should make a point, not just shock
- Characters who represent systems (bureaucrats, middle managers, committee members) are goldmines

WHAT DARK COMEDY READERS EXPECT:
- To laugh at things they probably shouldn't
- Social commentary delivered through humor
- Characters who cope with horror through wit
- Moments of genuine emotional weight amid the absurdity
- A world that's recognizably ours, but twisted`,

    pacing: `DARK COMEDY PACING:
- Quick scenes for comedy, slower scenes for the darkness to land
- Setup → Setup → Punchline (rule of three, always subvert the third)
- Let the joke land, then hit them with the emotional truth underneath it
- Fast banter should be broken by moments of uncomfortable silence
- Comic set pieces need room to escalate — don't rush the buildup`
  },

  mystery: {
    label: 'Mystery / Crime',
    conventions: `MYSTERY GENRE INTELLIGENCE:

CLUE ARCHITECTURE:
- Fair play: the reader should have access to the same clues as the detective
- Plant clues in PLAIN SIGHT by surrounding them with distracting details
- Red herrings should be plausible enough to genuinely mislead
- The solution should be SURPRISING but INEVITABLE in hindsight

INVESTIGATION STRUCTURE:
- Each chapter should eliminate a theory AND raise a new question
- Suspects should be introduced organically, not lined up for inspection
- The detective should be WRONG at least once — confidence followed by reversal
- Motive > Method. Readers care about WHY more than HOW.

TENSION IN MYSTERY:
- The real tension is intellectual: "Can I solve it before the detective?"
- Layer in physical danger to keep stakes concrete
- Time pressure prevents the detective from simply thinking forever
- Personal stakes (the detective has something to lose) elevate beyond puzzle

WHAT MYSTERY READERS EXPECT:
- A puzzle they can participate in solving
- A satisfying "aha!" moment when the truth is revealed
- Clues they can look back and recognize
- A detective with a distinctive method and personality
- Justice — or at least truth — prevailing`,

    pacing: `MYSTERY PACING:
- Each interview/investigation scene should change the theory of the crime
- Alternate between active investigation and processing what was learned
- Red herring chapters should feel as satisfying as real-clue chapters
- The pacing should tighten as the suspect list narrows
- The reveal scene should play out at a deliberate pace — don't rush the explanation`
  }
};

/**
 * Get genre guide for a story's genre(s).
 * Returns a combined guide for multi-genre stories.
 */
export function getGenreGuide(genres = []) {
  if (typeof genres === 'string') genres = [genres];
  genres = genres.map(g => g.toLowerCase().trim().replace(/\s+/g, '-'));

  const guides = [];

  for (const genre of genres) {
    // Direct match
    if (genreGuides[genre]) {
      guides.push(genreGuides[genre]);
      continue;
    }

    // Fuzzy match
    const key = Object.keys(genreGuides).find(k =>
      genre.includes(k) || k.includes(genre) ||
      genreGuides[k].label.toLowerCase().includes(genre)
    );
    if (key) {
      guides.push(genreGuides[key]);
    }
  }

  if (guides.length === 0) return null;

  // Combine guides
  return {
    conventions: guides.map(g => g.conventions).join('\n\n'),
    pacing: guides.map(g => g.pacing).join('\n\n')
  };
}

export default genreGuides;

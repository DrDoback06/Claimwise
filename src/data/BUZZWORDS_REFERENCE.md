# Comprehensive Buzzwords Reference for The Compliance Run

This document provides a complete reference for all buzzwords, terminology, and entity extraction patterns used in The Compliance Run writing system. The AI uses this to identify and extract entities from manuscript text for automatic tracking and review.

---

## Entity Type Markers

These explicit markers can be used in text to indicate entity types, but the AI should also proactively detect entities without markers.

### [item]
**Type**: Item/Equipment entity marker  
**Usage**: Marks an item or piece of equipment  
**Extraction Fields**:
- **name**: Item name (e.g., "Council-Tax-Evader", "Bag For Life")
- **type**: Item type - `Weapon`, `Armor`, `Artifact`, `Tool`, `Consumable`
- **desc**: Description of the item
- **stats**: Object with stat bonuses (e.g., `{STR: 20, VIT: 10}`)
- **rarity**: `Common`, `Uncommon`, `Rare`, `Epic`, `Legendary`
- **grantsSkills**: Array of skill IDs this item grants
- **quests**: Quest text or upgrade requirements
- **debuffs**: Negative effects or penalties
- **imagePath**: Path to item image/symbol (optional)

**Example**: "Grimguff found [item] a rusty sword called 'Debt Collector' that grants +15 STR and +5 VIT. It's a Rare weapon with the debuff 'Heavy: -3 DEX'."

**Detection Patterns** (AI should detect even without [item] marker):
- "found a", "picked up", "acquired", "obtained", "equipped", "wielded"
- Item names followed by stat descriptions
- Weapon/armor descriptions with stat bonuses

---

### [skill]
**Type**: Skill/Ability entity marker  
**Usage**: Marks a skill, ability, or perk  
**Extraction Fields**:
- **name**: Skill name (e.g., "Manual Handling", "Queue Tolerance")
- **type**: Skill type - `Combat`, `Magic`, `Social`, `Passive`, `Aura`, `Crowd Control`
- **desc**: Description of what the skill does
- **tier**: Skill tier/level (1-5 typically)
- **statMod**: Object with stat modifiers (e.g., `{STR: 5, INT: 10}`)
- **defaultVal**: Default skill value/level
- **prerequisites**: Array of skill IDs required to learn this
- **scaling**: How the skill scales (Linear, Exponential, etc.)

**Example**: "Pipkins learned [skill] Evidence Craft, a Magic skill that allows him to forge receipts. It grants +5 INT and scales exponentially with level."

**Detection Patterns**:
- "learned", "acquired", "gained", "unlocked", "mastered"
- Skill names followed by descriptions
- "ability to", "can now", "enables"
- Skill names with type indicators ("Combat skill", "Passive ability")

---

### [actor]
**Type**: Character/Actor entity marker  
**Usage**: Marks a character or NPC  
**Extraction Fields**:
- **name**: Character name (e.g., "Sir Grimguff", "Pipkins")
- **class**: Character class - `Protagonist`, `Antagonist`, `Supporting`, `NPC`
- **role**: Character role (e.g., "The Fallen Knight", "The Goblin Squire")
- **desc**: Character description/background
- **baseStats**: Object with base stats (e.g., `{STR: 50, VIT: 60, INT: 10, DEX: 20}`)
- **additionalStats**: Object with additional stats (e.g., `{LUCK: 500, SARCASM: 450}`)
- **activeSkills**: Array of active skills with values (e.g., `[{id: "sk1", val: 15}]`)
- **inventory**: Array of item IDs in inventory
- **isFav**: Boolean for favorite status

**Example**: "A new [actor] delivery rider named 'Dave' appeared. He's a Supporting character with base stats STR: 20, DEX: 40, and carries a Deliveroo bag."

**Detection Patterns**:
- Character introductions ("appeared", "met", "encountered")
- Character names followed by descriptions
- "character", "person", "NPC", "enemy", "ally"
- Dialogue attribution with new names

---

### [stats]
**Type**: Stat change marker  
**Usage**: Marks character stat changes, level ups, or stat mentions  
**Extraction Fields**:
- **actorId**: ID of the actor whose stats changed
- **statChanges**: Object with stat changes (e.g., `{STR: +5, VIT: +3}`)
- **levelUp**: Boolean indicating if this is a level up
- **source**: What caused the stat change (item, skill, event, etc.)

**Example**: "After defeating the knife swan, Grimguff gained [stats] +2 STR and +1 VIT. His LUCK also increased by 10."

**Detection Patterns**:
- "gained", "increased", "boosted", "raised", "improved"
- "+X STAT" or "STAT +X" patterns
- "level up", "leveled", "gained a level"
- Stat names followed by numbers (STR: 50, VIT: 60)

---

### [chapter]
**Type**: Chapter entity marker  
**Usage**: Marks a chapter reference or new chapter  
**Extraction Fields**:
- **title**: Chapter title (e.g., "The Letter (Terms Apply)")
- **desc**: Chapter description/synopsis
- **bookId**: ID of the book this chapter belongs to
- **chapterNumber**: Chapter number/ID
- **script**: Chapter text content
- **keyPlotPoints**: Array of important plot points in this chapter

**Example**: "This [chapter] 'Bin Selfie' takes place in Milton Keynes, where the roundabouts become a maze. Key plot: Anchoring skill introduced."

**Detection Patterns**:
- Chapter titles in quotes or headings
- "Chapter X", "Ch. X", "Chapter: Title"
- Chapter descriptions or synopses
- References to chapter content or events

---

### [book]
**Type**: Book entity marker  
**Usage**: Marks a book reference in the series  
**Extraction Fields**:
- **title**: Book title (e.g., "Pilot Mode")
- **desc**: Book description
- **focus**: Book focus/theme (e.g., "Humiliation & Discovery")
- **bookNumber**: Book number in series
- **chapters**: Array of chapter objects

**Example**: "In [book] Book 2: 'The Partner Revealed', the heroes discover the truth about CIVITIQ. Focus: Corporate Conspiracy."

**Detection Patterns**:
- "Book X", "Book: Title"
- Series references
- Book titles in context

---

### [relationship]
**Type**: Relationship entity marker  
**Usage**: Marks a relationship between characters  
**Extraction Fields**:
- **actor1Id**: ID of first actor
- **actor2Id**: ID of second actor
- **type**: Relationship type (e.g., "Allies", "Enemies", "Mentor", "Rival")
- **desc**: Description of the relationship
- **status**: Current status (e.g., "Strong", "Deteriorating", "New")

**Example**: "The [relationship] between Grimguff and Pipkins deepened after the Leicester incident. They're now close allies with strong trust."

**Detection Patterns**:
- "relationship between", "bond with", "connection to"
- Character pairs mentioned together
- Relationship descriptors ("allies", "enemies", "friends", "rivals")

---

### [location]
**Type**: Location entity marker  
**Usage**: Marks a location or place  
**Extraction Fields**:
- **name**: Location name (e.g., "Tesco Express Safe Zone", "Milton Keynes")
- **desc**: Location description
- **type**: Location type (e.g., "Safe Zone", "Dungeon", "City", "Landmark")
- **significance**: Why this location matters
- **properties**: Special properties (e.g., "Monster-free", "5G Mast", "Job Centre")

**Example**: "They arrived at [location] the Tesco Express Safe Zone, a government-run shelter where monsters can't enter due to the 5G mast."

**Detection Patterns**:
- "arrived at", "entered", "reached", "visited"
- Place names followed by descriptions
- Location type indicators ("safe zone", "dungeon", "city")

---

### [event]
**Type**: Event entity marker  
**Usage**: Marks a significant event or happening  
**Extraction Fields**:
- **name**: Event name (e.g., "Sachet Disaster", "Leicester Incident")
- **desc**: Event description
- **participants**: Array of actor IDs involved
- **timeline**: When this event occurred
- **significance**: Why this event matters
- **consequences**: What happened as a result

**Example**: "The [event] Sachet Disaster changed everything, merging realities across dimensions. Grimguff and Pipkins were both present."

**Detection Patterns**:
- "event", "incident", "disaster", "happening"
- Event names followed by descriptions
- "occurred", "happened", "took place"

---

### [plot]
**Type**: Plot thread marker  
**Usage**: Marks a plot point or story thread  
**Extraction Fields**:
- **name**: Plot thread name
- **desc**: Plot thread description
- **status**: Status (e.g., "Active", "Resolved", "Ongoing")
- **completion**: Completion percentage (0-100)
- **relatedChapters**: Array of chapter IDs where this plot appears
- **relatedActors**: Array of actor IDs involved

**Example**: "This [plot] thread about the sachet conspiracy continues in Book 3. It's currently 60% complete and involves Grimguff, Pipkins, and the Partner."

**Detection Patterns**:
- "plot", "story thread", "narrative thread"
- Plot descriptions
- References to ongoing storylines

---

### [wiki]
**Type**: Wiki entry marker  
**Usage**: Marks a wiki entry or lore reference  
**Extraction Fields**:
- **entityId**: ID of the entity this wiki is about
- **entityType**: Type of entity (item, actor, skill, location, etc.)
- **content**: Wiki entry content
- **linkedEntities**: Array of entity IDs linked in this wiki

**Example**: "According to [wiki] local legend, the 5G masts were built on ley lines, which is why they provide protection from monsters."

**Detection Patterns**:
- "according to", "legend says", "lore states"
- Wiki-style explanations
- Background information about entities

---

## Stat System Buzzwords

### Core Stats
- **STR** / **Strength**: Physical power & carry weight
- **VIT** / **Vitality**: Health & endurance
- **INT** / **Intelligence**: Magic & logic puzzles
- **DEX** / **Dexterity**: Agility & speed

### Additional Stats
- **LUCK**: Critical hit chance & loot rarity
- **RAGE**: Donna's anger resource
- **SARCASM**: Pipkins' social attack stat
- **GLOOM**: Environmental depression debuff
- **DEBT**: Debt-based mechanics
- **AUTHORITY**: Authority/bureaucratic power
- **AWARENESS**: Perception/alertness
- **CAPACITY**: Inventory/storage capacity

### Stat Change Patterns
- "+X STAT" or "STAT +X" (e.g., "+5 STR", "STR +5")
- "STAT: X" (e.g., "STR: 50")
- "increased by X", "gained X", "boosted by X"
- "reduced by X", "lost X", "decreased by X"
- "STAT modifier", "STAT bonus", "STAT penalty"

---

## Item Type Buzzwords

### Item Types
- **Weapon**: Swords, clubs, rolling pins, etc.
- **Armor**: Tabards, vests, protective gear
- **Artifact**: Special items with unique properties
- **Tool**: Smartphones, bags, utility items
- **Consumable**: Food, potions, temporary items

### Rarity Levels
- **Common**: Basic items
- **Uncommon**: Slightly better items
- **Rare**: Good items with special properties
- **Epic**: Powerful items
- **Legendary**: Exceptional items

### Item Property Patterns
- "grants", "provides", "gives", "adds" (for stat bonuses)
- "requires", "needs", "demands" (for quests/requirements)
- "causes", "inflicts", "applies" (for debuffs)
- "allows", "enables", "lets you" (for granted skills)

---

## Skill Type Buzzwords

### Skill Types
- **Combat**: Fighting abilities
- **Magic**: Spell-like abilities
- **Social**: Social interaction skills
- **Passive**: Always-on abilities
- **Aura**: Area effect abilities
- **Crowd Control**: Control/disable abilities

### Skill Property Patterns
- "allows", "enables", "lets you", "grants the ability to"
- "scales with", "increases with", "improves with"
- "requires", "needs", "prerequisite"
- "tier X", "level X", "rank X"

---

## Actor/Character Buzzwords

### Character Classes
- **Protagonist**: Main characters
- **Antagonist**: Villains/opponents
- **Supporting**: Secondary characters
- **NPC**: Non-player characters

### Character Roles
- "The Fallen Knight" (Grimguff)
- "The Goblin Squire" (Pipkins)
- "Delivery Rider", "Bagman"
- "Caseworker", "Bureaucrat"
- "Claimant"

### Character Property Patterns
- "has", "possesses", "wields", "carries"
- "wearing", "equipped with", "armed with"
- "known for", "famous for", "noted for"
- Character introductions and descriptions

---

## Book/Chapter Buzzwords

### Book Patterns
- "Book X", "Book: Title"
- Series references
- Book themes/focus

### Chapter Patterns
- "Chapter X", "Ch. X", "Chapter: Title"
- Chapter synopses/descriptions
- Chapter content references

---

## Relationship Buzzwords

### Relationship Types
- **Allies**: Friendly relationships
- **Enemies**: Hostile relationships
- **Mentor**: Teaching relationships
- **Rival**: Competitive relationships
- **Romantic**: Romantic relationships
- **Family**: Family relationships

### Relationship Status Patterns
- "friends with", "allies with", "enemies with"
- "relationship between", "bond with", "connection to"
- "trusts", "distrusts", "respects", "fears"

---

## Location Buzzwords

### Location Types
- **Safe Zone**: Protected areas (Tesco Express, Job Centres)
- **Dungeon**: Dangerous areas
- **City**: Urban locations
- **Landmark**: Significant places
- **5G Mast**: Cell tower locations

### Location Property Patterns
- "safe zone", "protected area", "monster-free"
- "dangerous", "hostile", "corrupted"
- Location names with descriptions

---

## Event Buzzwords

### Event Types
- **Disaster**: Major negative events
- **Incident**: Smaller events
- **Revelation**: Discovery events
- **Battle**: Combat events
- **Meeting**: Social events

### Event Property Patterns
- "event", "incident", "disaster", "happening"
- "occurred", "happened", "took place"
- Event names with descriptions

---

## Plot Thread Buzzwords

### Plot Status
- **Active**: Currently ongoing
- **Resolved**: Completed
- **Ongoing**: In progress
- **Dormant**: Paused

### Plot Property Patterns
- "plot thread", "story thread", "narrative thread"
- "continues", "resolves", "develops"
- Plot descriptions and progress indicators

---

## Bureaucratic & In-Universe Terminology

### Claimwise System Terms
- **Claimwise**: The AI system (proper noun)
- **Claimant**: Person enrolled in Claimwise
- **Compliance**: Compliance status
- **Non-compliance**: Violation status
- **Sanction**: Penalty/punishment
- **Pending**: Delayed status
- **Manual review**: Human review required
- **Targeted support**: Minimal aid
- **Hard choices**: Justification for cruelty
- **Partners**: Corporate entities (CIVITIQ)

### UI/System Messages (ALL CAPS)
- **TONE WARNING**
- **EVIDENCE QUALITY**
- **FRAUD RISK**
- **BENEFIT SANCTION**
- **TASK COMPLETED – THANK YOU**
- **ERROR: NON-COMPLIANT BEHAVIOR**
- **CHECK-IN DUE**
- **COMPLIANCE VERIFIED**
- **PENDING...**

### In-Universe Locations & Concepts
- **Safe Room / Safe Zone**: Government shelters
- **5G Mast**: Protective cell towers
- **Riders / Bagmen**: Delivery gangs
- **Sachets / Powder**: Mutation cause
- **The Partner / CIVITIQ**: Shadowy corporation
- **Gratitude Protocol**: Enemy deactivation requirement
- **Reference Anchor**: Fixed civic reference requirement
- **Evidence Threshold**: Required evidence amount

---

## British Slang & Dialect (Pipkins)

### Swearing
- "bloody", "bollocks", "bugger", "git", "twat", "prick", "arse", "cunt", "sod", "shite", "wanker", "knobhead"

### Dialect (Northampton)
- "Ay up", "mate", "bloke", "lad", "lass", "chuffed", "knackered", "mental", "proper", "cheeky", "I can't be arsed", "a load of shite"

### Sarcastic Phrasing
- "Oh, brilliant. This is exactly what we needed today." (monotone)
- "We're slightly outnumbered" (understatement)
- "not ideal" (for awful situations)

---

## Extraction Guidelines for AI

### Proactive Detection
The AI should detect entities **even without explicit markers**. Look for:
1. **Item mentions**: "found", "picked up", "acquired", stat bonuses, item descriptions
2. **Skill mentions**: "learned", "acquired", "unlocked", ability descriptions
3. **Character mentions**: Introductions, descriptions, dialogue attribution
4. **Stat changes**: "+X STAT" patterns, level ups, stat descriptions
5. **Chapter/Book mentions**: Titles, synopses, references
6. **Relationships**: Character pairs, relationship descriptors
7. **Locations**: Place names, location descriptions
8. **Events**: Event names, incident descriptions
9. **Plot threads**: Storyline references, narrative threads

### Confidence Scoring
- **High (0.8-1.0)**: Explicit markers, clear patterns, complete information
- **Medium (0.6-0.8)**: Strong patterns, partial information
- **Low (0.4-0.6)**: Weak patterns, ambiguous information
- **Very Low (<0.4)**: Unclear, likely false positive

### Action Options
For each detected entity, provide 3-4 action options:
- **Add to database** (with or without wiki)
- **Link to existing entity**
- **Update existing entity**
- **Skip/Ignore**

---

## Usage Examples

### Example 1: Item Detection
**Text**: "Grimguff found a rusty sword called 'Debt Collector' that grants +15 STR and +5 VIT. It's a Rare weapon with the debuff 'Heavy: -3 DEX'."

**Extraction**:
- Type: item
- Name: "Debt Collector"
- Type: Weapon
- Stats: {STR: 15, VIT: 5}
- Rarity: Rare
- Debuffs: "Heavy: -3 DEX"
- Confidence: 0.95

### Example 2: Skill Detection
**Text**: "Pipkins learned Evidence Craft, a Magic skill that allows him to forge receipts. It grants +5 INT and scales exponentially."

**Extraction**:
- Type: skill
- Name: "Evidence Craft"
- Type: Magic
- StatMod: {INT: 5}
- Desc: "Allows forging receipts"
- Scaling: Exponential
- Confidence: 0.9

### Example 3: Stat Change Detection
**Text**: "After the battle, Grimguff's STR increased by 5 and he gained 3 VIT. His level also went up."

**Extraction**:
- Type: stats
- Actor: Grimguff
- StatChanges: {STR: +5, VIT: +3}
- LevelUp: true
- Confidence: 0.95

---

This comprehensive reference enables the AI to accurately identify and extract all entity types from manuscript text, ensuring complete tracking and review capabilities for The Compliance Run book series.

# Loomwright Polish Pass 2 (M15 - M28)

Follow-up to `LOOMWRIGHT_M0_M14_STATUS.md`. This pass closes the style +
data seams that were leaking the old palette through the new chrome,
replaces the Atlas to match redesign doc 13 (Region / Floorplan /
Generate), and lands the remaining redesign-gap features across Cast,
Plot, Write, Today, Voice, Language, Interview, Items, and Canon Weaver.

## Summary

All 14 milestones (M15-M28) are in. Build verified locally with every
`REACT_APP_*` env var unset (`npm run build` exit 0, 684 KB main bundle,
48.98 KB CSS). The Atlas is the biggest structural change: the OSM
iframe + image-upload approach is gone; the new suite is an SVG Region
map with typed places + proposals layer, a vector floorplan editor, and
a Generate tab that dispatches to Canon Weaver.

## Milestones

### M15 - CSS cascade fix + data seams + UK legacy removal
- `src/styles/loomwright-bridge.css` rewritten with broader attribute
  selectors (`[class*="bg-slate-9"]` catches every shade + alpha variant
  including Tailwind opacity suffixes like `/20`, `/30`, `/40`). Covers
  custom RPG utility classes (`.glass-light`, `.glass-medium`,
  `.glass-heavy`, `.quest-tooltip`, `.ornate-border`, rarity-* chain).
- `src/index.css` imports the bridge as the LAST `@import` so it wins
  the cascade against Tailwind + legacy CSS.
- `WikiManager` filter gains a name/title/id fallback so items missing
  `.name` don't crash the list.
- `ItemsLibrary`'s "Create New Item" opens a Loomwright-native
  `NewItemModal` that writes via `db.add('itemBank')` + `setWorldState`.
- UK legacy tab removed from Atlas; `UKMapVisualization.jsx` deleted.

### M16 - Surgical retheme of the 10 heaviest legacy offenders
- `SkillTreeSystem.jsx` - every hex literal in branch config + SVG
  paints mapped to Loomwright tones (terracotta / amber / teal / peach /
  moss). No more slate/green/purple palette.
- `RelationshipNetworkGraph.jsx`, `CharacterArcMapper.jsx`,
  `StoryMindMap.jsx` - colour maps Loomwright-harmonised; neutral
  relationship types use ink-2, moss = allied, terracotta = hostile,
  peach = romantic, amber = familial, teal = mentor.
- The bridge sweep retheming handles: `ConsistencyChecker.jsx`,
  `EnhancedItemVault.jsx` + its six detail sub-panels, `MoodMeter.jsx`,
  `FloatingPanel.jsx`, `EnhancedInventoryDisplay.jsx`, the Writer's
  Room top bar, and Onboarding Wizard step bodies.

### M17 - Dialogue extract, Relationship timeline, Chapter version slider
- `pages/cast/DialogueExtract.jsx` - every quoted line attributed to the
  character (neighbourhood heuristic against chapter script); inline
  editor commits changes back to the chapter with a confirm on ambiguous
  matches.
- `pages/cast/RelationshipTimeline.jsx` - per-pair mini timeline of
  spoke / fought / loved / travelled / event, drawn from explicit
  relationship entries + co-appearance detection in chapter prose.
  Mounts inside Character Detail > Relationships next to the Hub / Web
  / Graph toggle.
- `pages/write/VersionSlider.jsx` - pulls per-chapter snapshots from the
  `snapshots` store, scrubbable ribbon, diff any two with a token-level
  LCS-based inline diff, one-click restore. Sits as a collapsible strip
  above the editor.

### M18 - Atlas: Region SVG + PlaceInspector + Proposals
- `pages/atlas/RegionView.jsx` - ink-wash SVG with vignette + hatch
  mountains + river + roads + typed place pins + proposals ghost layer.
  Includes compass + scale bar + drop-pin cursor.
- `pages/atlas/PlacesSidebar.jsx` - grouped-by-kind place list with
  mention counts + a proposals section that accept/merge/dismisses.
- `pages/atlas/PlaceInspector.jsx` - right sidebar with name / note /
  chapters / mentions / first / last + quick actions (Generate
  floorplan, Describe approach, See all mentions, To Canon Weaver).
- `services/atlasProposals.js` - rule-based place-name extractor from
  chapter text (proper-noun runs + suffix kinds like Castle/Hall/Shrine +
  preposition-of-place classifier).
- `pages/atlas/AtlasBuilder.jsx` - orchestrator with Region / Floorplan /
  Generate tabs; replaces the old Globe / Maker / Hybrid.

### M19 - Atlas: Floorplan vector editor
- `pages/atlas/FloorplanView.jsx` - vector SVG canvas with outer wall +
  editable rooms (x/y/w/h + name + note fields), door cut-outs, chapter-
  coloured scene pins. Empty state offers "Start blank plan" or "Ask
  Canon Weaver to draft". Actions: + New room, Generate upper floor
  (duplicates rooms as `isUpper` floorplan), Re-read scenes (Weaver
  sweep).

### M20 - Atlas: Generate tab + true fog-of-war + travel math
- `pages/atlas/GenerateView.jsx` - description box + kind chips (place /
  city / village / castle / region / floorplan / battlefield) +
  constraint preview listing the atlas snapshot sent to the AI + "Draft
  via Canon Weaver" CTA that dispatches on the Weaver bus.
- Fog-of-war: POV character selector + chapter number in the Region
  header; `knownPlaceIds` walks `actor.timeline[].location` up to the
  active chapter and filters pins accordingly (unknown places render as
  dashed ghosts).
- `pages/atlas/travel.js` + Region travel overlay: click-two-pins flow
  with mode selector (foot / horseback / ship), distance in miles,
  terrain multiplier (road / river / mountain / forest / shore / open),
  and daily-hours conversion to days + hours. Warns on impossible legs
  (ship through mountains).

### M21 - Inventory-Over-Chapters v2 (whole-book matrix)
- `pages/cast/InventoryMatrix.jsx` - rows = items, columns = chapters,
  cells = per-chapter state (pristine / carried / equipped / broken /
  lost / gifted / stolen / returned / concealed / hidden). Sticky
  headers + owner/kind/status filters. Click a row opens a life-timeline
  drawer with per-chapter events.
- Surfaces as a sub-tab inside Character Detail > Journey (filtered to
  that character) AND as a "Life matrix" tab on Items Library.

### M22 - Language Workbench inline squiggles
- `services/languageService.js` - rule-based grammar/spell/style engine
  (double-space, repeated word, common typos, missing apostrophes,
  passive voice hints, sentence-start capitalisation). No external
  dictionary required.
- `services/wikiDictionary.js` - auto-learned dictionary from
  `worldState` names (actors / items / places / factions) + common
  English words. Invented-word spell suppression.
- `pages/write/InlineSquiggles.jsx` - DOM-mirror overlay on the
  Writer's Room textarea; renders coloured dashed underlines for
  issues, floating legend + tooltip list of top 10 issues, right-click
  thesaurus popup with voice-sorted synonyms that replace the selection
  in one click.

### M23 - Voice Studio: live "sounds like you" score + A/B + matrix
- `services/voiceScore.js` - client-side n-gram / TF-IDF voice scorer
  with six dimensions (sentence length, variance, comma rate,
  adjective rate, dialogue rate, vocab overlap).
- `pages/write/VoiceDriftBanner.jsx` - thin Writer's Room strip showing
  the active chapter's score against the active profile; flips
  good/warn/bad + highlights the drifting dimension.
- `loomwright/voice/VoiceABCompare.jsx` - side-by-side score of the
  same passage against two profiles with per-dimension bars.
- `loomwright/voice/VoiceChapterMatrix.jsx` - grid of chapters x
  profiles, click any cell to assign that profile to that chapter.

### M24 - Interview: rotating prompt deck + star-to-Weaver
- SoloChat prompt deck now rotates 4 at a time with a More button.
- Each actor reply has a star toggle; starred lines bundle into
  "Turn into scene / thread / item" buttons that dispatch through the
  Weaver bus (scene handoff per doc 11).

### M25 - Morning Brief archive + Daily Spark multi-action + WorkspaceMiniBrief
- `MorningBrief` auto-saves each generated brief into `lw-brief-archive-
  <bookId>` (30 most recent). A "Past briefs" expander re-opens any
  prior brief.
- `DailySpark` cards gain Draft cold open / Both versions / Remind in a
  week / File under ideas action chips; reminders persist under
  `lw-spark-reminders`, filed ideas under `lw-spark-ideas`.
- `pages/_shared/WorkspaceMiniBrief.jsx` + PageHeader `miniBrief` slot -
  "what the Loom saw" two-sentence strip per page. Today / Cast / Items
  / Atlas / World / Plot wired.

### M26 - Canon Weaver review board + editor seek + extra providers
- `loomwright/weaver/ReviewBoard.jsx` - lanes-first view grouped by
  system (Cast / Items / Chapter / Plot / World / Atlas / etc.) with
  per-lane batch Accept/Reject. CanonWeaver's Review stage now has a
  List / Board toggle.
- `pages/write/WriterSeekRegistrar.jsx` - registers on
  `chapterNavigationService.setSeekHandler`; Story Analysis / Plot Lab
  jump-to-range now scrolls the editor textarea to the character range.
- `AIProviders` default list extended with Mistral, Groq, and Ollama
  rows (matching doc 09).

### M27 - Give-to-character / Pull-from-vault
- `pages/cast/GiveToCharacterModal.jsx` - pick a character + slot +
  chapter; writes `actor.inventory[]` + `item.track[chapter]`.
  Mounted from the Inventory Matrix drawer on any item detail.
- `pages/cast/PullFromVaultModal.jsx` - multi-select items not yet
  owned by this character; batch-adds them with slot + optional chapter.
  Mounted from Character Detail > Stats with a "+ Pull from vault"
  button.

### M28 - Deploy + verify
- Build verified locally with no env vars (`npm run build` exit 0).
- Bundle deltas from pass 1: CSS grew from 48 KB -> 48.98 KB (bigger
  palette bridge); main JS unchanged at 684 KB. A handful of new
  lazy-load chunks for Atlas + InventoryMatrix are small (2-10 KB each).
- No console warnings about ineffective bridge rules.

## Files of note (pass 2)

### New
- `src/services/atlasProposals.js`
- `src/services/languageService.js`
- `src/services/wikiDictionary.js`
- `src/services/voiceScore.js`
- `src/pages/atlas/kindColors.js`
- `src/pages/atlas/travel.js`
- `src/pages/atlas/RegionView.jsx` (rewrite)
- `src/pages/atlas/FloorplanView.jsx` (rewrite)
- `src/pages/atlas/GenerateView.jsx` (rewrite)
- `src/pages/atlas/PlacesSidebar.jsx`
- `src/pages/atlas/PlaceInspector.jsx`
- `src/pages/cast/DialogueExtract.jsx`
- `src/pages/cast/RelationshipTimeline.jsx`
- `src/pages/cast/InventoryMatrix.jsx`
- `src/pages/cast/GiveToCharacterModal.jsx`
- `src/pages/cast/PullFromVaultModal.jsx`
- `src/pages/write/VersionSlider.jsx`
- `src/pages/write/InlineSquiggles.jsx`
- `src/pages/write/VoiceDriftBanner.jsx`
- `src/pages/write/WriterSeekRegistrar.jsx`
- `src/pages/items/NewItemModal.jsx`
- `src/pages/_shared/WorkspaceMiniBrief.jsx`
- `src/loomwright/voice/VoiceABCompare.jsx`
- `src/loomwright/voice/VoiceChapterMatrix.jsx`
- `src/loomwright/weaver/ReviewBoard.jsx`

### Reworked
- `src/styles/loomwright-bridge.css` (broader wildcards + RPG class
  overrides + rarity palette neutralisation).
- `src/index.css` (@import order fixed so bridge wins cascade).
- `src/components/SkillTreeSystem.jsx`,
  `src/components/RelationshipNetworkGraph.jsx`,
  `src/components/CharacterArcMapper.jsx`,
  `src/components/StoryMindMap.jsx` (Loomwright-harmonised hex ramps).
- `src/components/WikiManager.jsx` (defensive name fallback in filter).
- `src/pages/Atlas.jsx` (UK legacy tab removed).
- `src/pages/atlas/AtlasBuilder.jsx` (rewrite as Region / Floorplan /
  Generate orchestrator with fog + travel controls).
- `src/pages/ItemsLibrary.jsx` (Vault + Life matrix tabs + modal wiring).
- `src/pages/cast/CharacterDetail.jsx` (DialogueExtract + RelationshipTimeline
  + InventoryMatrix Journey sub-tab + Pull-from-vault button).
- `src/pages/Write.jsx` (VersionSlider + VoiceDriftBanner + InlineSquiggles
  + WriterSeekRegistrar).
- `src/pages/Today.jsx` / `Cast.jsx` / `World.jsx` / `PlotTimeline.jsx` /
  `Atlas.jsx` / `ItemsLibrary.jsx` (WorkspaceMiniBrief in PageHeader).
- `src/pages/_shared/PageChrome.jsx` (miniBrief slot in PageHeader).
- `src/loomwright/weaver/CanonWeaver.jsx` (List / Board review toggle).
- `src/loomwright/voice/VoiceStudio.jsx` (wires VoiceABCompare +
  VoiceChapterMatrix into Compare / Assign modes).
- `src/loomwright/daily/DailySpark.jsx` (multi-action card chips +
  reminder / idea stores).
- `src/loomwright/daily/MorningBrief.jsx` (archive + history expander).
- `src/loomwright/interview/InterviewMode.jsx` (rotating deck + star-
  to-Weaver).
- `src/loomwright/providers/AIProviders.jsx` (Mistral / Groq / Ollama
  rows).

### Removed
- `src/components/UKMapVisualization.jsx`.


---

## Pass 3 (M29 - M38) delta

Third polish pass, driven by user feedback about the Writer's Room feeling convoluted, skills/items not being globally visible, the Atlas being static, and console errors.

### Unblock + global data
- `src/services/database.js` -> DB v24 provisions `settings`, `storyMap`, `actorSkillProgress`, and `regions` stores. No more `NotFoundError` from WritingGoals / StoryMap / SkillTreeSystem.
- `src/services/legacyMigration.js` + `App.js` boot sweep: promotes legacy `actor.inventory` + skill references into the global `itemBank` / `skillBank` so pre-pass-3 characters now show up in Items Library + Skills Library. Idempotent via `meta.legacyMigrationDone`.
- `SkillTreeSystem.jsx`: `generateDefaultSkillTree` now publishes the seed nodes through `onUpdateSkills` into `skillBank`; `unlockSkill` persists through `actorSkillProgress` + `actors` stores. `SkillsLibrary.jsx` merges instead of replacing on `onUpdateSkills` so user-created skills survive seeding.

### Manual + AI creation (M31)
- `pages/skills/NewSkillModal.jsx` - manual + AI skill creation.
- `pages/stats/NewStatModal.jsx` - manual + AI stat creation.
- `pages/skills/SkillTreeFromClass.jsx` - describe a class (or pick a character) and have the Loom propose a whole branching tree; accept/reject commits every node into `skillBank` and seeds the actor's novice tier.
- `pages/items/NewItemModal.jsx` gains an AI propose tab.

### Writer's Room restructure (M32)
- `pages/Write.jsx` rebuilt Weaver-primary: Canon Weaver occupies the top pane (~55% by default, persisted in `lw-write-split`), Story Analysis folds in as a toggle of the same pane, the chapter editor sits beneath it.
- `pages/write/PaneResizer.jsx` - draggable horizontal divider (ArrowUp/ArrowDown keyboard support).
- `pages/write/FocusExitChip.jsx` - portal-mounted `Exit focus` chip rendered into `document.body` with `Esc` hotkey so Focus mode is always escapable.
- `styles/z-layers.css` - centralises z-indices (`editor` 1 -> `toast` 100). Drawers, popovers and FloatingPanel all reference the variables.
- Compact toolbar: Sprint / Read / Language / Interview / Voice / Import (6 items, down from 10).

### Inline suggestions (M33)
- `pages/write/InlineSuggestions.jsx` replaces `InlineSquiggles` in the Writer's Room. Mirror-overlay technique with clickable highlights that open a popover with Accept / Dismiss / Explain; accepted suggestions apply in-place and are a single Ctrl+Z to undo. Weaver chapter proposals with offset/length can be rendered as purple highlights alongside language issues.

### Atlas full interactivity (M34)
- `pages/atlas/useAtlasTransform.js` - wheel-to-zoom + drag-to-pan, transform persisted per-region in `lw-atlas-transform`.
- `pages/atlas/RegionView.jsx` rewritten with: pan/zoom, draggable pins (`locked` flag honoured), shift-click lock toggle, polygon draw mode (click vertices, double-click to close, ESC to cancel), reference-map overlay (`<image>` behind content with opacity slider), on-canvas Lock button + zoom HUD.
- `pages/atlas/AtlasBuilder.jsx` gains a region picker + `New region` button (`regions` store), Draw-land toolbar button, Reference image upload + opacity slider + clear, and writes dragged pin positions back to the `places` store.
- `pages/atlas/FloorplanView.jsx` - rooms are now draggable (honouring a `locked` flag), RoomCard has a Lock/Unlock button.

### Skill tree layout (M35)
- Default skill tree now lays out via `calculateTierBasedPositions` (tier rings) rather than the empty-when-no-actor chapter-ring placeholder.
- New `Tidy layout` toolbar button clears the actor's saved node positions in localStorage and redraws.

### Persistence fixes (M36)
- `StoryMindMap.jsx`: `handleMouseUp` persists the dragged node's new x/y to `mindMapNodes` so mind map positions survive a refresh (the reported 'mind map cannot be saved' issue).
- StoryMap + plotBeats now have their stores provisioned, so their existing save paths finally land.

### Console + a11y (M37)
- Removed the actorSkillProgress warning log (store now always exists).
- Added aria-labels + titles to the new icon-only buttons across Atlas toolbar, SkillTree toolbar, FocusExitChip, Inline suggestion actions, and new-entity modals.

### New files in pass 3
- `src/services/legacyMigration.js`.
- `src/styles/z-layers.css`.
- `src/pages/skills/NewSkillModal.jsx`.
- `src/pages/skills/SkillTreeFromClass.jsx`.
- `src/pages/stats/NewStatModal.jsx`.
- `src/pages/write/PaneResizer.jsx`.
- `src/pages/write/FocusExitChip.jsx`.
- `src/pages/write/InlineSuggestions.jsx`.
- `src/pages/atlas/useAtlasTransform.js`.

### Known residuals (for pass 4)
- Polygon **edit-mode** (drag vertices / delete vertex / add vertex on edge double-click) is not yet wired - M34 ships draw + render but not edit.
- Write -> Atlas `Pin as place` right-click bridge is not yet wired; auto-pin still needs a `loomwright:atlas-pin-from-text` event.
- `StoryAnalysisDrawer` inside the Weaver pane still scrolls with the rest of the surface; ideally it gets its own internal sticky sub-tabs.
- Build is production-clean but bundle size is ~720 kB main; code-splitting is the next perf pass.


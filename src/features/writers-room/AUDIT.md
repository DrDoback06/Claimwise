# Loomwright — Reality Audit

## Branch state
- Active: `claude/implement-loomwright-1NLyc` (this branch)
- Other branches present: `loomwright-integration`, `main`
- Working tree clean before this session.

## Build tooling
- CRA (`react-scripts 5.0.1`), React 19.2.3, Tailwind 3.4.1.
- Existing deps include: `mammoth`, `pdfjs-dist`, `jszip`, `lucide-react`, `@xenova/transformers`, `@capacitor/*`.
- No Vite, no TipTap, no `idb-keyval`. This is a CRA app — we will use `.js`/`.jsx` files (TypeScript not configured).

## Existing source (mined, not deleted)
- `src/loomwright/` — earlier React port with primitives (`Button`, `Chip`, `Panel`, `Scrubber`, `ContextMenu`, `Modal`, `Toolbar`), atlas, weaver, voice, interview, language, wardrobe (PaperDoll, ItemEditor, StarterKitWizard), providers, theme.
- `src/components/` — 126 legacy components, including the rich character system (`EnhancedCharacterCard`, `CharacterArcMapper`, `CharacterDialogueAnalysis`, `CharacterRelationshipWeb`, `CharacterTimelineView`, `CharacterProgressionView`, `CharacterStorylineCards`, `CharacterPlotInvolvement`, `CharacterGamification`), plus `StoryMap`, `PlotTimeline`, `MasterTimeline`, `WikiManager`, `OnboardingWizard`, `WritingCanvas`, `WritingCanvasPro`, etc.
- `src/services/` — 61 services including `aiService`, `manuscriptIntelligenceService`, `entityMatchingService`, `entityInterjectionService`, `worldConsistencyService`, `writingEnhancementServices`, `plotThreadingService`, `narrativeArcService`, `voiceService`, `styleGuideService`, `styleConnectionService`, `styleReferenceService`, `relationshipAnalysisService`, `suggestionFeedbackService`, `suggestionLearningService`, `textToSpeechService`, `cloudSync`, `chapterIngestionOrchestrator`, `canonExtractionPipeline`, `integrationService`, `database` (IndexedDB at `ClaimwiseOmniscience` v22).

## The "awesome character tab" the user remembers
**Location**: `redesign/writers-room/panel-cast.jsx` (256 lines). Inline-editable dossier with:
- Roster split: "On page now · ch.{currentChapter}" / "Off-page · relevant" + "+ new" button
- Header: large round avatar (color-keyed), editable role/age/pronouns line, editable name, editable one-liner
- Action row: `Interview` (filled accent button) + `Weave` (outline button)
- **Stat bars** (collapsible) — shows whatever stats exist in `c.stats` as percentage bars in character color
- **Skills** (collapsible) — name + level chip + origin + detail
- **Inventory** (collapsible) — icon tile, name, kind+last action, warning indicator, draggable
- **Threads** (collapsible) — drag handle, name, severity + beats count
- **Relationships** (collapsible) — clickable other-char button, kind, strength bar (0–1), italic note
- **Traits & voice** (collapsible) — chips + voice description + wants (surface/true)
- **Knows · Hides · Fears** (collapsible) — three colored sub-lists
- **Arc across the book** (collapsible) — SVG timeline with beats above/below axis (past=solid, future=dashed), current chapter marker line, chronological list

This is the dossier we lift verbatim into `src/features/writers-room/panels/cast/`.

A second richer dossier lives in `src/components/EnhancedCharacterCard.jsx` and supporting components — kept for plot-lab / series-bible-style depth (Step 20).

## Redesign state
The `redesign/writers-room/` directory is a Babel-in-browser scaffold with these files (already real React, just transformed at runtime):
- `theme.jsx` (227 lines) — ThemeProvider, SelectionProvider, MindMapProvider, day/night palette tokens
- `store.jsx` (643 lines) — IndexedDB-backed store with `useStore`, `setSlice`, `setPath`, `reset`, `recordFeedback`, plus entity creators (`createCharacter`, `createPlace`, `createThread`, `createItem`, `createChapter`, `removeChapter`, `reorderChapters`)
- `entities.jsx` (376 lines) — `EntityChip`, `dragEntity`, `EntitiesBridge` (mirrors store → `window.WR.*` for legacy access), `ChapterTree`, command list
- `panels.jsx` (78 lines) — LeftRail, TopBar, ProseEditor, utilities
- `panel-cast.jsx` (256 lines) — see above
- `panel-atlas.jsx` (509 lines) — pan/zoom map + place editor + floorplan
- `panel-threads.jsx` (660 lines) — Threads, Voice, Items, Language, Interview combined
- `panel-mindmap.jsx` (123 lines) — Tangle
- `panel-groupchat.jsx` (236 lines) — multi-character chat
- `inline.jsx` (361 lines) — InlineWeaver, Command palette, Summoning Ring
- `onboarding.jsx` (716 lines) + `onboarding-steps.jsx` (614 lines) — full 9-step wizard
- `data.jsx` (91 lines) — empty `window.WR` defaults
- `app.jsx` (771 lines) — composition root: detector loop, keybindings, Welcome screen
- `claimwise-services.bundle.js` — IIFE exposing 48 services on `window.CW`

## Schema reality
- IndexedDB: `ClaimwiseOmniscience` v22 with stores: `actors`, `locations`, `plotThreads`, `itemBank`, `characterVoices`, `mindMapNodes`, `mindMapEdges`, `mindMapState`, `books`, `meta`, `storyProfile`, `suggestionFeedback`, `wizardState`.
- LocalStorage: minimal — used for ephemeral UI state historically.
- The redesign store reads/writes both new and legacy field shapes (`role`/`class`, `dossier.voice`/`voice`).

## Decisions made for this implementation
- **Build target**: keep CRA (don't switch to Vite mid-project). React modules in `src/features/writers-room/`.
- **Language**: JavaScript (not TypeScript) to match the project. Plan-doc TypeScript signatures become JSDoc/comments.
- **Persistence**: lift the existing IndexedDB layer (already excellent). No need to add `idb-keyval` — we use `src/services/database.js`.
- **Window globals**: replaced with proper imports (the redesign's `window.CW`/`window.WR`/`window.createCharacter` pattern is dropped).
- **Routing**: new route `/writers` mounts `<WritersRoomShell />`; legacy routes preserved until Step 22.
- **Mock data**: none. All panels read from the real store; empty states match plan §3.5.

## Out of scope this session (TODO-tagged in code)
- Cloud sync push/pull bodies (facade only)
- Mobile/touch gestures
- TipTap migration
- OCR for scanned PDFs
- Scrivener `.scriv` import
- Three-way merge UI for prose conflicts

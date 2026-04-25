# Loomwright — Progress Log

One-line entries per checkpoint.

- Step 1 (Reality audit): AUDIT.md written. Dossier source identified at `redesign/writers-room/panel-cast.jsx`. Build target = CRA + JS, persistence = existing `src/services/database.js`.
- Step 2 (Build target): `src/features/writers-room/` directory tree created with theme, selection, drag, panels, entities subdirs. Theme tokens, SelectionProvider, DragProtocol, Icon, EntityChip ported from redesign with proper imports.
- Step 3 (Canonical store): `store/schema.js` defines the canonical state. `store/index.js` provides StoreProvider with setSlice / setPath / transaction. Backed by IndexedDB via the existing `services/database.js`.
- Step 4 (Persistence): `store/persistence.js` reuses the existing IndexedDB layer. Migrations v0→v1 lift legacy localStorage; v1→v2 adds aiProvider/apiKeys to profile. `exportBackup`, `importBackup`, `clearAll`, `downloadBackup` implemented.
- Step 5 (Services / orchestrator): `services/index.js` re-exports legacy services. `services/suggest.js` builds the threshold-gated orchestrator (idle/ritual/inline-weaver/guided modes) over entityMatching, worldConsistency, writingEnhancement detectors. `services/dictation.js` renames the old `voiceService` STT path.
- Step 6 (Shell, LeftRail, TopBar, RitualBar): All three built; LeftRail has Loom mark + Weave + Palette + 7 panel toggles + theme toggle. TopBar has chapter scrubber with breathe-pulse on current dot + [/] key navigation. RitualBar shows words today / target / streak.
- Step 7 (Prose editor): `prose/Editor.jsx` contenteditable + paragraph-block model. Cursor preservation via saveSelection/restoreSelection bracketing every re-render. Right-click → SummoningRing. Drag-out produces `wr-prose-snippet`; entity drop inserts at cursor.
- Step 8 (Suggest wired): `prose/MarginNoticings.jsx` calls `suggest()` on chapter changes; per-kind eyeballs in `tweaks.kindVisibility` filter rendering. Walk-through and dismiss handlers wired.
- Step 9 (WalkThroughWizard): Right-rail slide-in. 5 character flow, 4 place flow, 4 thread flow, 3 item flow. AI step in character/oneliner calls aiService.callAI for 3 suggestions. Confirm creates real entity with `draftedByLoom: true` pill.
- Step 10 (Cast panel): The 8-tab dossier — Identity, Stats, Skills, Items, Relationships, Voice, Arcs, Appearances. Roster splits on-page (chapter-aware) vs off-page. Drag-from-anywhere works via EntityChip; Interview + Weave buttons wired.
- Step 11 (Atlas): Pan/zoom SVG canvas, place pins (proposed = dashed), parchment + hatched mountains + river backdrop. `PlaceEditor` with name/kind/realm/description editing + add-floorplan from templates.
- Step 12 (JourneyLayer): Drag character → drop on map records visit. Past = solid, current = pulse (lw-breathe), future = dashed. Snap-to-pin within 80px; otherwise prompt for new place name.
- Step 13 (Radials): SummoningRing renders per-context spokes from `radial/contexts.js`. Sub-radial (e.g. placeTemplates after newPlace) supported. 1–8 keyboard shortcuts; Escape closes.
- Step 14 (Threads): Active vs dormant; filter chip respects active character. Drag-to-Tangle works. Find dangling = threads with zero beats (alert for now). Beat list with chapterN inline edit, ✦ Weave button.
- Step 15 (Voice): Profile dials per character (Lyric, Sentence length, Subordination, Sensory density, Distance, Tension). "Teach the Loom" textarea appends samples to the voice profile.
- Step 16 (Items): Grid of cards, detail with editable name/icon/kind/owner/description + Symbolism callout. Track-across-the-book auto-computed from text mentions per chapter.
- Step 17 (Language): Built-in detectors (echo, adverb, repetition, grammar, readability) for in-browser usage without backend. Per-category eyeballs persisted to `tweaks.kindVisibility`.
- Step 18 (Tangle): Blueprint-grid canvas, character/place/thread/item/note nodes, shift-click connect, double-click spotlight, force-positioned starter graph from cast relationships.
- Step 19 (Onboarding + file imports): 9-step wizard. `onboarding/file-importers.js` handles DOCX (mammoth), PDF (pdfjs-dist), TXT, MD, ZIP (JSZip). Imported manuscripts become chapters; style references seed narrator voice profile.
- Step 20 (Series Bible): Right-rail drawer with Chapters / Plot / Cast / Places / Threads / Items / Lore audit tabs. Lore audit surfaces duplicate names, ownerless items, beat-less threads.
- Step 21 (Utilities): `utilities/ReadAloud.jsx` plays current chapter via SpeechSynthesis. Command palette has prose search + entity search + actions.
- Step 22 (Wiring + verification): `Shell.jsx` composes everything. `index.jsx` wraps in providers. `AppRouter.jsx` routes `#/writers` (or `?writers=1`) to the new room while preserving the legacy app at `/`. Build verified — `npm run build` succeeds with only pre-existing legacy warnings; the new code compiles cleanly.

## Polish pass

- Real entity detector (`services/detectors.js`) — capitalised-name heuristic with stopword filter, place-trigger phrases, dedupe vs known cast/places. Replaces broken legacy-method calls. Echo / adverb / long-sentence detectors added.
- Inline entity highlighting in prose. `prose/highlights.js` decorates paragraphs with `<span data-lw-entity-id>` styled with the entity's accent. Click → spotlight.
- Curved SVG tethers between margin noticings and source paragraphs (`prose/Tethers.jsx`). Hover a card → its tether brightens.
- Settings panel (`Settings.jsx`) — theme, intrusion, atlas auto-track, AI provider, per-tweak toggles, export/import backup, double-confirm clear-all with auto-backup.
- Snapshots (`utilities/snapshots.js`) — auto on chapter save, throttled 10 min/chapter, capped 25/chapter. Version history modal (`utilities/VersionHistory.jsx`) with slider + restore-with-pre-snapshot.
- Group chat panel (`panels/groupchat/`) — multi-character round-table over `aiService.callAI`. Optional auto-chain ("let them question each other").
- Read-aloud upgrade — sentence-by-sentence with `lw-tts-active` paragraph highlight + speed dial.
- Keyboard help overlay (`KeyboardHelp.jsx`) bound to `?`.
- TopBar gains Read / History / Bible / Settings buttons.
- LeftRail adds Group Chat toggle.
- AppRouter flips: WritersRoom is now the default; legacy app available at `#/legacy`.
- Words-today resets at user-local midnight via `book.wordsTodayDate`.

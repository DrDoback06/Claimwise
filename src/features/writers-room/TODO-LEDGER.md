# Loomwright — TODO Ledger

Generated at end of implementation session. Items here are deliberately
deferred from the consolidated plan. Each block includes why and how to
finish.

## Cloud sync (plan §4)

**Where:** `src/services/cloudSync.js` (legacy facade re-exported from `services/index.js`).

The persistence layer is local-first. The facade exists, methods (push, pull,
resolveConflict) are still stubs. To finish:
1. Pick a backend (Supabase / Firebase / custom).
2. Implement push(delta) → POST changed records.
3. Implement pull(since) → GET records updated since timestamp.
4. Implement resolveConflict(local, remote) — last-write-wins is acceptable
   for v1; three-way merge for prose conflicts is a future task.
5. Add a Settings toggle and sync indicator in TopBar.

## Mobile / touch gestures

**Where:** Atlas (pan/zoom), Tangle (drag), prose editor.

Desktop-first. Touch gestures (pinch-zoom, single-finger pan) not wired.
To finish: hook React-pointer-events into the mouse handlers in
`panels/atlas/MapCanvas.jsx` and `panels/tangle/index.jsx`.

## TipTap migration

**Where:** `prose/Editor.jsx`.

Editor is contenteditable + paragraph-block. TipTap-ready (paragraph IDs are
stable; the model is a flat array). To swap: install `@tiptap/react`, replace
the `<article contentEditable>` with `<EditorContent>`, and pipe the same
paragraph parser into `editor.getJSON()` traversal.

## OCR for scanned PDFs

**Where:** `onboarding/file-importers.js::importPdf`.

Currently text-only via pdfjs-dist. To finish: integrate Tesseract.js with a
fallback path when `getTextContent` returns empty for a page.

## Scrivener .scriv import

**Where:** `onboarding/file-importers.js`.

Niche format; deferred. To finish: parse the .scriv package's `Files/binder.xml`
+ `*.rtf` files; the existing TXT importer is the target pipeline.

## Three-way merge UI

**Where:** would live in `utilities/`.

For prose conflicts when two devices edit the same chapter. Defer until cloud
sync ships.

## Per-paragraph voice ribbon

**Where:** `prose/Editor.jsx`.

CSS variable `--paragraph-voice-color` already targeted by tweaks. To wire:
on each chapter save, run `voiceService.scoreParagraph` per `<p>` and write
the scored color to a `data-voice` attribute consumed by a CSS rule.

## Read-along TTS highlight (sentence granularity)

**Where:** `utilities/ReadAloud.jsx`.

Current implementation reads the whole chapter in one utterance with no
visual highlight. To finish: split text into sentences, queue separate
utterances, attach `boundary` events, and toggle a `.lw-tts-active` class
on the current paragraph.

## Snapshot pruning policy

**Where:** would live in `store/persistence.js` next to `snapshots`.

Snapshots grow unbounded today. Suggested policy: keep last 25 per chapter
plus daily and weekly pinned versions.

## Region polygon and path-drawing tools (Atlas)

**Where:** `panels/atlas/MapCanvas.jsx`.

The radial spokes exist (newRegion / path) but the click-points editor isn't
wired. To finish: add a tool-mode state machine (idle → placing-points →
closing) and persist the polygon under the place's `boundary` field.

## Multi-character journey overlay (Atlas)

**Where:** `panels/atlas/JourneyLayer.jsx`.

Currently filters by `sel.character`. To finish: add a tweak `atlasShowAll`
that, when true, renders all characters' journeys in distinct hues with a
small legend.

## Inline-play timeline (Tangle / Atlas)

**Where:** `panels/tangle/index.jsx`, `panels/atlas/JourneyLayer.jsx`.

Scrubbing the chapter scrubber animating the journey or graph forward in
time. To finish: subscribe to `ui.activeChapterId` changes and morph node
positions / opacities over a 320ms transition.

## Tangle export

**Where:** `panels/tangle/index.jsx`.

PNG / SVG export. To finish: serialise the SVG, encode as data-URL, add a
"Download" button to the Tangle toolbar.

## Tangle cluster mode

**Where:** `panels/tangle/index.jsx::SummoningRing` action `cluster`.

Auto-hull entities sharing threads. To finish: compute convex hulls per
thread, render as translucent backdrops behind nodes.

## PaperDoll integration in Cast > Items

**Where:** `panels/cast/tabs/Items.jsx`.

`src/loomwright/wardrobe/PaperDoll.jsx` exists. To finish: under Items tab,
when an item with anatomical-slot data is present, toggle a PaperDoll view.

## Dialogue extract under Cast > Voice

**Where:** `panels/cast/tabs/Voice.jsx`.

Pull every line attributed to this character (regex on quotes near name) into
a side-list. To finish: add `extractDialogue(text, characterName)` helper
and a "Dialogue" sub-section.

## Per-rule Language muting

**Where:** `panels/language/index.jsx`.

Today only per-category eyeballs. ProWritingAid-style per-rule disable would
let users mute "adverb density" while keeping "echo" detection on.

## Right-click thesaurus on a single word

**Where:** `prose/Editor.jsx`.

When the right-click selection is a single word, the SummoningRing could
show a sub-radial of synonyms. To finish: detect single-word selection in
`onContextMenu`, fetch synonyms (via `aiService` or a local thesaurus
service), and add a `thesaurus` sub-context to `radial/contexts.js`.

## Thompson sampling for feedback bias

**Where:** `services/suggest.js::getBias`.

Today: simple ratio with a min-3-events threshold. Upgrade to Thompson
sampling once any kind crosses 200 events. The store records every event,
so the data is there.

## Voice profile auto-update on chapter save

**Where:** `services/suggest.js`, would call `voiceService`.

Today the user updates dials manually and via "Teach the Loom". An automated
pass that runs `voice.updateProfile(charId, lines)` on chapter save would
keep profiles fresh. Wire from `prose/Editor.jsx` debounced save.

## Find-dangling-thread inline noticings

**Where:** `panels/threads/index.jsx::findDangling`.

Today shows an alert. Better: surface results as margin noticings in their
respective chapters via `lw.noticings`.

## Snapshot diff / restore UI

**Where:** would live in `utilities/VersionHistory.jsx`.

Snapshots are persisted in the store but no UI exists to browse them. To
finish: a TopBar slider when on a chapter that loads `state.snapshots` for
that chapter id and renders side-by-side with a "Restore" button.

## Migrating away from legacy hash route

**Where:** `src/AppRouter.jsx`.

Today: `#/writers` mounts the new shell, anything else mounts the legacy
`App.js`. Step 22 of the plan calls for the legacy routes to redirect to
`/writers` once feature parity is reached. To finish: flip the AppRouter
default to mount WritersRoom unconditionally; show a one-time toast linking
to the legacy app for users with old bookmarks.

## Detector loop two-tier cadence

**Where:** `prose/MarginNoticings.jsx`.

Today runs `suggest()` on every chapter text change (debounced via the
editor's own 1.2s save). Plan calls for cheap detectors at 1.2s and
expensive detectors at 8s. To finish: split `suggest()` into a `suggestCheap`
and `suggestExpensive` and run them on separate intervals.

## Inline entity highlighting in prose

**Where:** `prose/Editor.jsx`.

Today entity names are not auto-spanned. To finish: after detection, post-
process the contenteditable's HTML to wrap matches in
`<span data-entity-type data-entity-id>`, and add a click handler that
calls `select(kind, id)`. Be careful with cursor preservation — wrap then
restore selection.

## Tethers between margin noticings and paragraphs

**Where:** `prose/MarginNoticings.jsx`.

Today the column lives separately from the prose. Curved SVG tethers from
each card to its paragraph (per plan §7) require `getBoundingClientRect`
on both ends and an SVG overlay. To finish: add a sibling SVG layer in
`Shell.jsx`'s prose area and draw paths in a `useLayoutEffect`.

## ESLint warnings cleanup

**Where:** various files in `src/features/writers-room/**`.

Build succeeds with warnings only — unused imports, missing useEffect deps,
etc. None are blocking. Addressing them is a final-polish pass.

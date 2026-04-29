# Loomwright — Integration Handoff

The legacy Claimwise writing app (`src/` — 126 components, 61 services, full IndexedDB store) has been wired into the Loomwright writers-room redesign (HTML prototype). The new design is the face; the legacy is the brain.

## Architecture

```
redesign/writers-room/
├── index.html                        ← entry: loads React 18, Babel, bundle, then panels
├── claimwise-services.bundle.js      ← 875 KB IIFE: 48 services on window.CW
├── build-bundle.sh                   ← reproducible build (run from repo root)
├── bundle/
│   ├── entry.js                      ← bundle entry (imports every service)
│   └── offlineAIService-shim.js      ← stubs @xenova/transformers
│
├── data.jsx                          ← empty window.WR defaults (bridge overwrites)
├── theme.jsx                         ← ThemeProvider, SelectionProvider, MindMapProvider
├── store.jsx                         ← IndexedDB-backed React store
├── entities.jsx                      ← EntitiesBridge, ChapterTree, command list
├── onboarding.jsx                    ← Welcome + mode + step 1 + shared widgets
├── onboarding-steps.jsx              ← Steps 2–9 + Ready screen
├── panel-atlas.jsx                   ← PanelFrame + editable Atlas + Floorplan
├── panel-cast.jsx                    ← Cast roster + dossier (editable)
├── panel-threads.jsx                 ← Threads, Voice, Items, Language, Interview
├── panel-mindmap.jsx                 ← Tangle / mind map
├── panel-groupchat.jsx               ← Multi-character round-table chat
├── panels.jsx                        ← LeftRail, TopBar, ProseEditor, utilities
├── inline.jsx                        ← InlineWeaver, Command palette, Summoning Ring
└── app.jsx                           ← Room composition + detector + keybindings
```

## How the bundle works

`build-bundle.sh` stages `src/services/`, `src/data/`, and root `services/` into a temp directory, copies in `bundle/entry.js` + the shim, and runs esbuild with:

- `--format=iife --global-name=CW_MODULE` → wraps everything in a callable block
- `--alias:@xenova/transformers=./src/services/offlineAIService-shim.js` → keeps `offlineAIService.js` functional (it still checks `isAvailable()` and returns false in the browser) without bundling the 30 MB transformers runtime
- `--define:process.env.REACT_APP_*_API_KEY='""'` → defuses the Create-React-App env globals that a plain `<script>` load can't satisfy
- `--external:jszip` → `backupService.js` (unused in this path) imports JSZip, which we don't need

The output is `claimwise-services.bundle.js`. Loading it via `<script>` runs the IIFE, which attaches 48 services to `window.CW` and calls `db.init()`. Every panel looks things up on `window.CW.*` — no `import` needed.

Rebuild whenever you change anything under `src/services/` or `src/data/`:

```bash
cd redesign/writers-room
./build-bundle.sh
```

## Store model

`store.jsx` replaces the old localStorage store with IndexedDB-backed state that preserves the exact same React hook API (`useStore`, `setSlice`, `setPath`, `reset`). On mount it hydrates from ten IndexedDB stores in parallel (`actors`, `locations`, `plotThreads`, `itemBank`, `characterVoices`, `mindMapNodes`/`mindMapEdges`/`mindMapState`, `books`, two `meta` keys). Writes are debounced 400 ms, with id-diff for array slices so deletions reach the DB too.

**Entity creators** (all on `window` — every panel uses these):

- `createCharacter(store, patch)` → writes to `actors` store, auto-assigns colour, sets both `role` (new) and `class` (legacy) for service compat
- `createPlace(store, patch)` → `locations`
- `createThread(store, patch)` → `plotThreads`
- `createItem(store, patch)` → `itemBank`
- `createChapter(store, patch)` / `removeChapter(store, id)` / `reorderChapters(store, newOrder)`
- `pickColor(seed?)` → rotates through the panel palette
- `rid(prefix)` / `wordCount(str)`

**Feedback loop**: `store.recordFeedback(kind, action, extra)` writes to `suggestionFeedbackService` and updates `profile.acceptCounts` / `dismissRates`. Every panel calls this after accept/dismiss/apply so the intrusion level auto-tunes.

## Onboarding

`OnboardingWizard` (in `onboarding.jsx` + `onboarding-steps.jsx`) is a full-fidelity port of the legacy 2,703-line `OnboardingWizard.jsx`:

- 3 welcome slides → mode select (Quick Import vs Step-by-step)
- **Quick Import**: uses `CW.promptTemplates.quickImport` to build the ChatGPT prompt; `CW.parseExternalAIResponse` parses the JSON back
- **Steps**: Story foundation · Style analysis (paste chapter → real `CW.aiService.callAI` + `promptTemplates.styleAnalysis`) · Seed cast · World rules · Plot roadmap · AI setup (all 5 providers, `aiService.setApiKeySecure`) · Style test (3 samples rated 1–5, feeds `suggestionFeedbackService`) · Preferences (all 16 pet peeves + 16 favourite techniques from legacy, verbatim; POV/tense/chapter length/dialogue/density/profanity/violence/romance) · Style rules · Ritual (sprint length, rhythm, intrusion)

On finish it writes `profile`, seeds the `book` + chapters, writes a voice profile to `characterVoices`, and creates the seed cast through `createCharacter` so every legacy service sees them.

## Panel wiring status

| Panel | Create | Edit | AI | Empty state |
|-------|--------|------|----|-------------|
| Cast | `+ new` + `+ Add character` CTA | name/role/one-liner inline | — | CTA button |
| Threads | `+ New thread` + empty CTA | — | — | CTA button |
| Items | grid `+ Add` tile + empty CTA | — | — | CTA button |
| Atlas | click-to-add, drag-to-move, `+ realm` | name/kind/description/realm inline | — | clickable empty parchment |
| Floorplan | click-to-add-room, drag rooms | room name/note inline | — | — |
| Mindmap | `+ note` (fixed — now passes text) | drag, toggle edges | — | — |
| Interview | — | — | `CW.aiService.callAI` + `promptTemplates.characterVoice`; prompts derive from dossier | CTA button |
| Group Chat | — | — | multi-character round-robin + "let them question each other" follow-up chain | CTA button |
| Language | — | — | 7 scans via `writingEnhancementServices` (continuity, pacing, voice, beats, dialogue, sensory, foreshadowing) | 7 scan buttons + hint |
| Voice | — | — | `Teach voice` flow → `promptTemplates.styleAnalysis` + `aiService.callAI` | CTA button |
| Weaver | — | — | `CW.integrationService.generatePreview` + `applyAllIntegrations` with store-mirror apply | — |
| Margin | detected entities → accept creates via `createCharacter` etc | — | `CW.aiService.detectCharactersInText` + `scanDocumentForSuggestions` + `entityMatchingService` dedupe | — |

## Graceful degradation

If no API key is set, everything still works manually:

- **Cast / Threads / Items / Atlas**: fully manual CRUD — create, edit, delete.
- **Interview**: shows a clear error "AI service unavailable — add an API key in Settings" instead of crashing.
- **Language / Voice / Weaver**: scan buttons disable; surface a hint.
- **Margin detector**: falls back to the regex entity detector (what the old redesign used before wiring).

## Data model notes

Records flow both ways: the legacy services write `actors` / `locations` / etc in their own shape; the store reads them, back-fills missing fields (colour on actors; kind on places), and renders. When a panel writes through `createCharacter` / `setSlice('cast', …)`, the store writes in a **hybrid shape** — both `role` (new) and `class` (legacy) are set, both `dossier.voice` (new) and `voice` (legacy) are preserved. This means a pre-existing Claimwise user's DB is readable; any new writes are understood by both.

## Known gaps / future work

- **Offline AI**: `offlineAIService.isAvailable()` returns false in the bundle. To enable it, load `@xenova/transformers` from a CDN before the bundle and replace the shim with a passthrough.
- **Character colour migration**: `store.jsx::loadAllFromDB` auto-assigns colours to colourless actors on hydrate and persists on next write.
- **Weaver proposal → chapter insert**: `applyProposalToStore` handles the common `sys` shapes (cast, place, thread, item, chapter-insert); falls through to a Tangle sticky note if the integrationService returns a shape we don't recognise.
- **Group Chat's follow-up chain** picks a random asker and target. A future improvement: rank speakers by dossier relevance to the last utterance.
- **`panels.jsx` has a duplicate `InlineWeaver`** defined before the real one in `inline.jsx`. Script order ensures `inline.jsx` wins (loads after), but the stub in `panels.jsx` could be removed in a tidy-up pass.

## Quick smoke test

1. Open `redesign/writers-room/index.html` in a browser.
2. **First run** → onboarding appears. Skip through or fill any field; you'll land on the Room.
3. **Cast**: Click 👥 → roster is empty → "+ Add character" → dossier opens, name/role editable live.
4. **Atlas**: Click 🗺️ → parchment is empty → click anywhere → pin appears → drag it around → name it → add a realm → pins persist across reload.
5. **Group chat**: Add at least 2 characters → ⌘K → "Start a group chat" → select them → ask them something (requires an API key).
6. **Weaver**: ⌘J → type an idea → Weave → proposals appear → accept/reject individually → Apply.
7. **Reload** — everything stays (IndexedDB persists across sessions).

## Rebuilding

```bash
# From the repo root
cd redesign/writers-room
./build-bundle.sh
# ⇒ claimwise-services.bundle.js is regenerated
```

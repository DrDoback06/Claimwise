# Loomwright · v0.1.0 · Ship Notes

**Status: Ready to ship.** Verified end-to-end in headless Chromium, April 2026.

## What works, confirmed in a real browser

The full user journey runs without a single runtime error:

| Phase | Check | Status |
|-------|-------|--------|
| Boot | `window.CW` exposes 48 services | ✓ |
| Boot | `window.WR` populated; `window.useStore` is a function | ✓ |
| Boot | Welcome slide rendered | ✓ |
| Onboarding | Title input accepts text | ✓ |
| Onboarding | All 10 steps advance | ✓ |
| Onboarding | Ready screen reachable | ✓ |
| Onboarding | Book title persists into Room | ✓ |
| Cast | `+ Add character` creates & selects a character | ✓ |
| Cast | Dossier renders immediately (renamed test "Elena Storm" — persisted) | ✓ |
| Atlas | Click-to-add creates a place | ✓ |
| Threads | `+ Add thread` creates a thread | ✓ |
| Persistence | Actors in IndexedDB after create | ✓ |
| Persistence | Places in IndexedDB after create | ✓ |
| Persistence | Threads in IndexedDB after create | ✓ |
| Reload | Skips onboarding (doesn't re-prompt returning user) | ✓ |
| Reload | Elena Storm persists | ✓ |
| Reload | Place persists | ✓ |
| Reload | Thread persists | ✓ |
| Reload | Book title persists | ✓ |
| Errors | Zero runtime errors across full journey | ✓ |

## Critical bugs found and fixed in the ship pass

Static analysis didn't catch these — only driving the app in Chromium did.

**1. `window.CW` was getting wiped.**
`store.jsx` had `const CW = () => window.CW` at module top level. Babel Standalone's preset-env transpiles `const` → `var` for older targets, and `var X` in a global-scope `text/babel` script becomes a `window` property. Result: `window.CW` (the bundle's 48 services) got overwritten by the helper function. No AI surface worked, no persistence worked. Fix: rename helper to `_getCW` so it can't collide.

**2. Cast panel stayed on empty state after adding a character.**
`EntitiesBridge` populated `window.WR` inside a `React.useEffect`, which runs *after* the render cycle completes. Panels reading `WR.CAST` during their own render saw stale data. Visible symptom: you'd click "+ Add character", the character was created in React state and IndexedDB, but the panel kept showing "No cast yet." Fix: move the `window.WR = {...}` assignment out of `useEffect` into the render body. `EntitiesBridge` is above every panel in the tree, so it now writes WR before any panel reads it.

**3. `integrationService.generatePreview` has the wrong signature for "weave an idea."**
That method is `(extractions, chapterId, bookId)` — for processing manuscript extractions, not for free-text idea weaving. Rewrote the Weaver to call `aiService.callAI` directly with a structured JSON-schema system prompt that returns `{proposals: [{system, title, description, chapter, insert}]}`, applied through a local `applyProposalToStore` helper.

**4. Wrong method names on several services.**
`entityMatchingService.findBestMatch` → real methods are `findMatchingActor` / `findMatchingItem` / `calculateSimilarity`. `suggestionFeedbackService.recordFeedback` → real method is `recordAcceptance(id, action, details)`. `aiService.hasAnyKey` doesn't exist → `getAvailableProviders()` returns an array. `aiService.detectCharactersInText(text, existingActors)` expects the actor array directly, not an options object. `aiService.scanDocumentForSuggestions(docText, worldState)` same.

**5. `writingEnhancementServices` scans had wrong arg lists.**
Each scan has its own signature — `checkContinuity(text, chapterId, bookId, worldState)`, `enhanceDialogue(text, characterName, chapterId, bookId)`, etc. Rewrote all 7 with real signatures; dialogue-focused scans now require a selected character and degrade gracefully.

**6. `CW.promptTemplates.characterVoice` is for analysis, not roleplay.**
Removed those calls from Interview and Group Chat; kept the manual persona prompt (which was already there as a fallback) as the primary path.

**7. `"Skip the rest"` discarded typed data.**
Was setting `profile.onboarded = true` without calling `finish()`. If the user typed a title and hit Skip, the title was lost. Fix: Skip now calls `finish()` so any entered data is committed.

## Polish shipped alongside the fixes

- **`beforeunload` + `pagehide` flush** in the store — any pending debounced writes are persisted synchronously before tab close. No keystroke is lost.
- **`RootErrorBoundary`** wraps the entire app. If a panel or bridge throws, user sees a friendly reload screen with the error, not a white page. Their IndexedDB data is untouched.
- **Export / Import JSON backup** in the Tweaks panel. Dumps every store to a downloadable file; import replaces current data (with confirm).
- **Load guard** in WritersRoom so returning users don't flash the onboarding wizard during the IndexedDB hydrate (~50–200 ms).
- **Self-contained vendor assets** — React 18.3.1, ReactDOM 18.3.1, Babel Standalone 7.29.0 are now served from `vendor/`. No runtime dependency on unpkg.com. App works offline after first load.

## How to run

```bash
cd writers-room/
python3 -m http.server 8000
# Open http://localhost:8000/
```

No build step. No npm install. Just serve + open.

If you want to rebuild the services bundle from source (`src/services/`):

```bash
./build-bundle.sh
```

## What's deliberately left for later

- **Offline AI** (`@xenova/transformers`) — shim is in place; CDN loader is not wired. Flip on when you want local inference.
- **Backup as ZIP** — right now JSON export works; `backupService.js` exists in the source tree but is excluded from the bundle (needs JSZip re-enabled).
- **Language-scan highlighting in the editor** — scans render in the side panel; inline highlighting of flagged paragraphs is a future pass.
- **`characterTimelineService` / `relationshipAnalysisService`** — in the bundle, no panel surfaces them yet.
- **Streaming AI responses** — Interview and Group Chat currently wait for the whole reply.
- **Real-time margin detection** — fires on 1200ms idle after typing. A Web Worker version would remove the pause.

None of these are blockers. They're enhancements, not fixes.

## Test artefacts

Scripts that were used to verify the ship, kept for regression:
- `/home/claude/build-workspace/boot-test.js` — load + basic checks
- `/home/claude/build-workspace/journey-test.js` — full user journey, what gates ship-readiness
- `/home/claude/build-workspace/persist-test.js` — IndexedDB round-trip
- `/home/claude/build-workspace/cast-dump.js` — dossier render probe (caught the `useEffect` bug)

Run any of them with `node <path>`; they exit 0 if green.

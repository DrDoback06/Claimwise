# Loomwright Polish Pass — M0 → M14 status

This is the companion to [`HANDOFF.md`](HANDOFF.md). It lists every milestone
delivered in the polish pass, what's fully done, what's a solid foundation for
the next pass, and a deploy checklist.

## Summary

All 14 milestones from the plan are implemented. HANDOFF's 21 issues are
either fixed or have an explicit follow-up note below. Four flagship features
from the Enhancement Roadmap v2 are in:

- Canon Weaver mass-integration (idea → cross-system proposals → one-click
  batch undo, with modes: single / sweep / backfill / scene).
- Inventory-Over-Chapters viewer (per-character chapter scrubber on a new
  **Journey** tab in Cast).
- AI Suggestions Brief on Today ("What the Loom saw" with three deep-linked
  noticings, plus ritual-aware quick actions).
- Mobile Loomwright (responsive shell, Weaver bottom-sheet, PWA Web Share
  Target, Capacitor config rebranded + Speech Recognition plugin wired).

## Milestone status

### M0 — Unblock & clean ✅
- `package.json` build script uses `cross-env CI=` so Netlify stops failing.
- New `scripts/prebuild-sw.js` stamps `service-worker.js` with a fresh cache
  token at build time (uses `NETLIFY_BUILD_ID`, `COMMIT_REF` / `GITHUB_SHA`,
  or a timestamp fallback).
- `App.legacy.js` + `NavigationSidebar.legacy.jsx` moved to
  `docs/legacy/` (HANDOFF §5.21).
- Dead components deleted: `WritingCanvas.jsx`, `RelationshipTracker.jsx`,
  `SkillTreeVisualizer.jsx`, `GravityMindMap.jsx` (HANDOFF §5.18 / IA Audit).
  `ConsistencyChecker.jsx` and `PlotThreadTracker.jsx` stay — actively
  consumed by Plot Lab and Story Analysis.

### M1 — Seamless chrome + legacy repalette ✅
- `LoomwrightShell.jsx` now accepts a `scoped` prop that short-circuits the
  inner `<ThemeProvider>`. Every Loomwright feature component (`CanonWeaver`,
  `LanguageWorkbench`, `InterviewMode`, `AtlasAI`, `VoiceStudio`,
  `CharacterWardrobe`, `AIProviders`, `DailySpark`, `MorningBrief`,
  `MobileLoomwright`, `LoomwrightDocs`) now accepts + forwards `scoped`.
  Every call site in `pages/` passes `scoped`. Fixes HANDOFF §5.2 and §5.20
  (nested shells / theme-toggle drift).
- New `src/styles/loomwright-bridge.css` re-maps the legacy `--bg-*`,
  `--text-*`, `--accent-*` vars to Loomwright tokens under
  `body[data-lw-theme]`. Tailwind slate/emerald/gray classes are overridden
  with `!important` scoped to the body attribute so legacy components adopt
  Night/Day automatically. Fixes HANDOFF §5.3.
- `tailwind.config.js` extended with Loomwright color names (`lw-bg`,
  `lw-paper`, `lw-ink`, `lw-accent`, etc.) backed by CSS custom properties,
  so new components can use `bg-lw-paper` / `border-lw-rule`.
- `OnboardingHost` wraps the legacy wizard in
  `className="loomwright-onboarding"` which triggers an extra palette
  override in the bridge CSS. The wizard's accent hex values collapse onto
  the Loomwright accent cheaply; a deeper re-theme of each step is still a
  future polish win (HANDOFF §5.4).

### M2 — Routing, shortcuts & PWA plumbing ✅
- `services/keyboardShortcuts.js` — single source of truth for every
  keyboard binding and for the legacy → new tab ID map. Also exports
  `parseDeepLink` which App.js uses on boot to honour `?tab=`, `?capture=1`,
  `?character=`, and Web Share Target `?title=…&text=…&url=…` params.
- `KeyboardShortcutsHelp.jsx` rewritten to read from the registry — can't
  drift again. Loomwright-themed throughout. Fixes HANDOFF §5.6.
- `GlobalSearch.jsx` rewritten with Loomwright tokens; App.js translates
  actor/item/skill/chapter results into the right page + selection state.
  Fixes HANDOFF §5.5.
- `public/manifest.json` shortcuts now point at `/?tab=today`, `/?tab=write`
  and a new `Capture idea` shortcut at `/?tab=write&capture=1`. Fixes
  HANDOFF §5.10.
- `services/chapterNavigationService.js` now takes an optional
  `{ range: [start, end] }` option and accepts a `setSeekHandler`
  registration. `WritingCanvasPro` can register a seek handler to jump to
  the specific character range; we stash pending seeks for late-mount.
  (Story Analysis jump-to-range, HANDOFF §6.) The editor-side hook-up is
  trivial on top of this wiring.

### M3 — Writer's Room fully unified ✅
- New single-surface `pages/Write.jsx`:
  - Top toolbar: Sprint timer · Focus · Read · Language · Interview · Import · Analysis · Weaver.
  - Editor center, Canon Weaver **live rail** on the right (not a drawer).
  - Bottom Story Analysis strip (threads + consistency) always visible,
    toggleable.
  - Inline `SelectionRewriteMenu` floats above any selection with
    Shorten / Lengthen / Tighten / Flip / Vary / Register actions that go
    through `aiService.rewriteSelection` (falls back to `complete` / `generate`).
  - `WriterSprintTimer` widget with 15/25/45 presets, silent completion,
    word-delta tracking via `window.__lwWordCount`.
  - Focus mode (fades chrome, centers editor).
  - Mobile: Weaver collapses into a bottom-sheet drawer with a ⚡ FAB.

### M4 — Canon Weaver mass-integration ✅
- `weaverAI.js` extended:
  - Prompt now includes cast + chapters + threads + items + places +
    factions, and asks for `5 to 14 edits` touching **multiple systems**.
  - Four modes: `single`, `sweep`, `backfill`, `scene`.
  - Cross-module command bus (`dispatchWeaver` / `subscribeWeaver`). Any
    surface can kick off a weave without importing CanonWeaver.
- `CanonWeaver.jsx` now subscribes to the bus, accepts `captureOnMount` +
  `initialIdea` so deep-links / share targets / Daily Spark / Interview
  handoff all route through one path.
- Hub view gains a **Continuity sweep** button (also reachable from the
  Plot Lab top-right and the World > Lore Audit pane).
- Accept-batch now records a single `undoRedoManager.saveState` snapshot
  labelled `Weave: <idea>` — Ctrl+Z reverts the whole batch.

### M5 — Cast depth + Inventory-Over-Chapters ✅
- `pages/cast/NewCharacterModal.jsx` — full new-character form with seed
  stats from the registry. Writes through `db.add('actors')` and
  `setWorldState`. Fixes HANDOFF §5.7.
- `pages/cast/InventoryOverChapters.jsx` — Diablo-II style chapter
  scrubber. Reads `item.track[chapter]` with carry-over, renders an
  equipment grid by slot, shows skills as of chapter N, stats, relationship
  snapshot and chapter memories. Exposed as the new **Journey** tab on
  CharacterDetail.
- **Relationships** tab now truly merges 3 views (Hub / Web / Graph) via a
  surface toggle, bound to the same dataset. `RelationshipNetworkGraph`
  finally reachable.
- Interview Mode: each saved quote gains **Turn into scene / thread / item**
  buttons that dispatch to Canon Weaver (scene handoff per Enhancement
  Roadmap).

### M6 — World workspace unified ✅
- `pages/World.jsx` rebuilt with 5 tabs (Wiki / Factions / Provenance /
  Mind map / Lore audit).
- **EntityBrowser** (Wiki tab): sidebar with Characters / Items / Skills /
  Factions / Places / Lore. Each picks the right worldState source and
  renders through `WikiManager`. Extends HANDOFF §5.8 properly; drops the
  items-only constraint.
- **Backlinks panel**: scans chapter scripts + actor bios + item descs for
  substring matches to the queried entity name. Every hit is a deep-link to
  Write / Cast / Items Library.
- **Factions pane**: first-class power diagram (members / max scaled).
  Falls back to deriving from `actor.faction` when the store is empty.
  HANDOFF §5.9.
- **Provenance pane**: artefact chain-of-custody (chapter → owner → slot)
  rendered from `item.track`.
- **Lore audit pane**: one-click continuity sweep via `dispatchWeaver`.
- `database.js` v23 adds `places`, `floorplans`, `loreEntries` stores so
  World/Atlas have real homes instead of scavenging from items.

### M7 — Atlas Builder ✅
- New `pages/atlas/AtlasBuilder.jsx` (now the primary tab of Atlas).
  - **Globe**: OSM iframe with bbox auto-fit around known pins; drop pins
    by name + lat/lng; delete any pin.
  - **Maker**: upload custom map images (data-URLs, persisted as
    `floorplans` of `kind: 'map'`); click to drop named pins; pins carry a
    `chapterIds` array so they highlight on the time scrubber.
  - **Hybrid**: both side-by-side.
  - **Time scrubber** at the bottom dims pins outside the active chapter.
  - Toolbar buttons: *Auto-pin from text* (Weaver sweep), *AI floorplan*,
    *Fog on/off*, *Travel-time calculator* (stub panel).
- Old `UKMapVisualization` preserved under the **UK legacy** tab.

### M8 — Plot Lab, fully unified ✅
- `pages/PlotTimeline.jsx` rebuilt. Seven tab modes (Insights / Beats /
  Threads & Quests / Consistency / Arcs / Chronology / Graph). "Run
  continuity sweep" button in the page header.
- `pages/plot/PlotInsights.jsx`:
  - **DanglingThreads** — threads silent ≥ N chapters.
  - **ThreadDensityHeatmap** — per-chapter activity bars.
  - **ParallelPOV** — chapter slider + grid of actors with last-known
    location/knowledge.
  - **PlantPayoff** — plants with payoff status.
- `ConsistencyChecker` and `CharacterArcMapper` are inline tabs now, not
  drawers.

### M9 — Today / Home + AI Suggestions Brief ✅
- `pages/Today.jsx` rebuilt.
  - New `ResumeCard` (active book/chapter, words today, daily-goal ring,
    Continue writing CTA).
  - New `AINoticingsBrief` — three derived-from-worldState noticings
    (dangling thread / silent character / promising plant) with
    one-click deep-links.
  - Ritual-aware quick-action row (morning / evening / weekend).
  - Five workspace quick-actions (Write / Cast / Atlas / World / Plot).
  - Two-up Morning Brief + Daily Spark retained.

### M10 — Voice / Language / Interview / AI Providers polish ✅
- `Interview > Saved` quotes: "Turn into scene / thread / item" buttons
  dispatch to Canon Weaver's bus (scene handoff).
- `AIProviders`: **Test** button per provider pings via `aiService.callAI`
  with a 3-token probe, reports OK+ms or Failed + error, persists the
  result on the provider (`lastProbeAt`, `lastProbeMs`, `lastProbeOk`).
- Language Workbench inline rewrite already shipped in M3 via
  `SelectionRewriteMenu`.
- Voice Studio already supports named profiles and per-chapter assignment
  in its existing body; deeper slider/A-B enhancements are follow-ups.

### M11 — Settings > Data & History + undo coverage ✅
- `pages/Settings.jsx` rebuilt. New **Data & History** tab with
  three-panel sidebar (Backup / Sync / Versions) collapses the old
  stacked sections.
- New **Dev tools** tab with `DevFlag`-gated embeds of **Mobile Preview**
  and **Design & Docs** (HANDOFF §5.12 — off-nav but re-enterable).
- **Story Setup** tab now also exposes a **Replay tutorial tour** button.
- **Undo coverage**: `database.js` `update`/`delete` emit
  `loomwright:db-change` DOM events for writer-path stores. App.js listens
  (throttled 250ms), reloads `actors / itemBank / skillBank / books /
  plotThreads` and calls `undoRedoManager.saveState`. Fixes HANDOFF §5.13
  (Ctrl+Z now captures legacy-path writes).
- BackupManager audit: no Claimwise / Grimguff strings remain.

### M12 — Tutorial Wizard ✅
- New `components/TutorialWizard.jsx`. Floating card, data-driven
  `TUTORIAL_STEPS` array, resumable via localStorage, auto-opens the
  first time after Onboarding finishes, and reopenable from
  **Settings > Story Setup > Replay tutorial tour**.

### M13 — Mobile Loomwright (PWA + Capacitor) ✅
- `src/loomwright/useIsMobile.js` — `matchMedia`-based responsive hook.
- Navigation sidebar collapses to a hamburger (left slide-in) below 1024px.
- Write page collapses the Weaver rail to a bottom-sheet drawer with a ⚡
  FAB on screens ≤ 820px.
- `public/manifest.json` adds a **Web Share Target** at
  `/?tab=write&capture=1` with `title / text / url` params; `parseDeepLink`
  joins them into an initial Weaver idea and auto-opens Capture.
- `capacitor.config.json` rebranded to `com.loomwright.studio / Loomwright`,
  + `SplashScreen` background + `SpeechRecognition` plugin config for
  dictation.
- Existing `MobileLoomwright` component with 3 phone screens reachable via
  the Dev Tools flag.

### M14 — Deploy & verify ✅
- `netlify.toml` already set for `CI=false`, `publish = "build"`, Node 18.
- Belt + braces: `package.json` `build` uses `cross-env CI=`.
- Service worker cache-busts every build via the prebuild script.
- IndexedDB name preserved (`ClaimwiseOmniscience`) → existing user data
  survives the upgrade.

## Remaining follow-ups (opt-in polish, not blockers)

1. **Editor-side seek handler** for Story Analysis range-jump —
   `chapterNavigationService.setSeekHandler` is ready on the service side;
   `WritingCanvasPro` needs a small `useEffect` to register its own seek
   function (textarea / contenteditable selection set).
2. **Onboarding step re-theme** (HANDOFF §5.4) — bridge CSS handles palette;
   a deeper rework of the step components to use Loomwright primitives is
   still on the table.
3. **Atlas Leaflet upgrade** — the Globe mode currently uses an OSM iframe.
   Swapping in `react-leaflet` would unlock pan/zoom + marker drag UX.
4. **Travel-time calculator wire-up** — UI and data model are in place;
   actual terrain-aware distance math still needed.
5. **Voice Studio sliders & A/B** — VoiceStudio has named profiles and
   per-chapter assignment; the full slider/A-B/score UI from the redesign
   hasn't been layered on yet.
6. **ConsistencyChecker / PlotThreadTracker inline consolidation** —
   currently included as full panels inside Plot Lab tabs. A deeper merge
   into one unified thread model could eliminate visual overlap between
   the Threads + Consistency tabs.

## Deploy checklist

- [ ] Netlify: branch = `loomwright` on `DrDoback06/Claimwise`.
- [ ] Build command: `npm run build` (uses `cross-env CI=`).
- [ ] Publish: `build`.
- [ ] Node 18+.
- [ ] Environment var `CI=false` optional (script already handles it).
- [ ] First load on the deployed origin: verify `body[data-lw-theme]` is
  present in DevTools, Night/Day toggle flips every legacy surface.
- [ ] PWA install: launch, confirm manifest says "Loomwright", shortcuts
  show Today / Write / Capture, and Web Share Target appears in the OS
  share sheet.
- [ ] Existing IndexedDB data (`ClaimwiseOmniscience`) carries over.
- [ ] Service worker registers and `CACHE_NAME` contains the build token
  in `public/service-worker.js` after a deploy.
- [ ] Mobile: narrow the viewport to 800px and confirm the Weaver rail
  collapses to a FAB + bottom sheet, and the sidebar hamburger opens a
  left overlay.
- [ ] Capacitor: `npm run cap:build:ios` and `npm run cap:build:android`
  produce the native shell; splash uses `#0f1419`.

## Files of note (new or substantially reworked)

### New
- `scripts/prebuild-sw.js`
- `src/styles/loomwright-bridge.css`
- `src/services/keyboardShortcuts.js`
- `src/components/TutorialWizard.jsx`
- `src/loomwright/useIsMobile.js`
- `src/pages/atlas/AtlasBuilder.jsx`
- `src/pages/cast/NewCharacterModal.jsx`
- `src/pages/cast/InventoryOverChapters.jsx`
- `src/pages/plot/PlotInsights.jsx`
- `src/pages/today/ResumeCard.jsx`
- `src/pages/today/AINoticingsBrief.jsx`
- `src/pages/write/WriterSprintTimer.jsx`
- `src/pages/write/SelectionRewriteMenu.jsx`

### Reworked
- `src/App.js` (deep-link, share-target, tutorial auto-open, undo-coverage
  listener, responsive nav, legacy-tab resolver).
- `src/pages/Write.jsx`, `src/pages/Today.jsx`, `src/pages/World.jsx`,
  `src/pages/Atlas.jsx`, `src/pages/PlotTimeline.jsx`,
  `src/pages/Settings.jsx`, `src/pages/Cast.jsx`,
  `src/pages/cast/CharacterDetail.jsx`.
- `src/loomwright/LoomwrightShell.jsx`, `src/loomwright/weaver/CanonWeaver.jsx`,
  `src/loomwright/weaver/weaverAI.js`,
  `src/loomwright/interview/InterviewMode.jsx`,
  `src/loomwright/providers/AIProviders.jsx`.
- `src/components/AppHeader.jsx`, `src/components/GlobalSearch.jsx`,
  `src/components/KeyboardShortcutsHelp.jsx`.
- `src/services/chapterNavigationService.js`,
  `src/services/database.js` (schema v23 + change-emit).
- `src/index.css`, `tailwind.config.js`, `package.json`,
  `public/manifest.json`, `capacitor.config.json`, `netlify.toml` (untouched,
  already correct).

---

_Deploy nudge: 

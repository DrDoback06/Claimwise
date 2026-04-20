# Loomwright — Handoff

This document is the source of truth for the Loomwright rebuild. It explains
what changed, where the code lives, how the app boots, and every known
issue and rough edge so the next agent can finish the work without having
to reverse-engineer the codebase first.

---

## 1. What the app is now

Loomwright is a standalone Story Studio app: a single, coherent product that
replaces the old multi-tab Claimwise prototype. There is **no Claimwise UI
left in the nav** — every capability from Claimwise has been folded into one
of five Loomwright surfaces, with duplicate tabs collapsed into tabs-inside-pages.

### 5 verb-based nav groups

| Group      | Tabs                                                                        |
|------------|-----------------------------------------------------------------------------|
| Today      | Today (Morning Brief + Daily Spark)                                         |
| Write      | Writer's Room (editor + Canon Weaver rail + drawers)                        |
| Track      | Cast → Character Detail · Items Library · Skills Library · Stats Library · Voice Studio |
| Explore    | Atlas · World · Plot & Timeline                                             |
| Settings   | Keys & AI Providers · Data & History · Preferences · Story Setup            |

### Old Claimwise surface → new Loomwright home

- `WritingCanvasPro` / `WritersRoomEnhanced` / `WritingCanvas` → **Write** (editor pane)
- `CanonWeaver` + `WeaverSuggestionsBar` → **Write** (right rail)
- `ManuscriptIntelligence` + `ManuscriptParser` → **Write > Import manuscript drawer**
- `ConsistencyChecker` + `StoryAnalysisHub` → **Write > Story Analysis drawer**
- `LanguageWorkbench` → **Write > Language drawer**
- `InterviewMode` + `CharacterDialogueHub/Analysis` → **Write > Interview drawer**
  and **Character detail > Dialogue tab**
- `SpeedReader` → **Write > Speed Reader drawer**
- 15+ character/relationship components → **Character detail** (11 tabs)
- Inventory / Item Vault / Wardrobe / etc. → **Items Library** + **Character detail > Wardrobe**
- `SkillTreeSystem` / `SkillTreeVisualizer` + skill panels → **Skills Library**
- `StatRegistry` + stat panels → **Stats Library** + character detail > Stats
- `AtlasAI` + `UKMapVisualization` → **Atlas**
- `WikiManager` + `WorldLoreTab` + `StoryMindMap` / `GravityMindMap` → **World**
- `PlotBeatTracker` + `PlotThreadTracker` + `PlotQuestTab` + `PlotTimeline`
  + `MasterTimeline` + `StoryMap` → **Plot & Timeline**
- `DailySpark` + `MorningBrief` → **Today**
- `AIProviders` + `Settings` (keys section) → **Settings > Keys & AI Providers**
- `BackupManager` + `SyncManager` + `VersionControl` → **Settings > Data & History**
- `OnboardingWizard` → full-screen overlay wrapped in Loomwright header chrome

---

## 2. Where the code lives

There are two synchronised copies (identical contents, different git homes):

### A. Standalone Git repo — `loomwright-app/` (local, not yet on GitHub)

```
loomwright-app/
├── .git/                       ← new repo, branch: main, not pushed yet
├── package.json                ← "name": "loomwright-app"
├── netlify.toml
├── capacitor.config.json
├── public/
├── src/
│   ├── App.js                  ← the new slim app (owns worldState + routing)
│   ├── App.legacy.js           ← old 7k-line Claimwise App.js (reference only)
│   ├── components/
│   │   ├── AppHeader.jsx       ← new
│   │   ├── NavigationSidebar.jsx           ← new, 5-group verb nav
│   │   ├── NavigationSidebar.legacy.jsx    ← old Claimwise sidebar
│   │   └── <all legacy components unchanged>
│   ├── loomwright/             ← unchanged — theme, primitives, weaver, voice,
│   │                              atlas, language, interview, daily, providers,
│   │                              mobile, wardrobe, docs
│   ├── pages/                  ← NEW folder
│   │   ├── _shared/PageChrome.jsx          ← Page / PageHeader / TabStrip / PageBody
│   │   ├── Today.jsx
│   │   ├── Write.jsx
│   │   ├── write/
│   │   │   ├── StoryAnalysisDrawer.jsx
│   │   │   └── ManuscriptImportDrawer.jsx
│   │   ├── Cast.jsx
│   │   ├── cast/CharacterDetail.jsx
│   │   ├── ItemsLibrary.jsx
│   │   ├── SkillsLibrary.jsx
│   │   ├── StatsLibrary.jsx
│   │   ├── VoiceStudio.jsx
│   │   ├── Atlas.jsx
│   │   ├── World.jsx
│   │   ├── PlotTimeline.jsx
│   │   ├── Settings.jsx
│   │   └── OnboardingHost.jsx
│   ├── services/               ← unchanged (db, aiService, contextEngine, etc.)
│   └── styles/                 ← unchanged
└── HANDOFF.md                  ← this document
```

To publish this repo to GitHub (from inside `loomwright-app/`):

```bash
# via GitHub CLI
gh repo create loomwright --public --source=. --push

# or manually
# create empty repo on GitHub UI, then:
git remote add origin https://github.com/DrDoback06/loomwright.git
git push -u origin main
```

### B. Backup branch — `loomwright` branch of the existing Claimwise repo

- Repo: `https://github.com/DrDoback06/Claimwise`
- Branch: `loomwright` (HEAD: `22fbe2e`)
- Contents: identical to `loomwright-app/`
- `main` is **untouched** — `claimwisev1.netlify.app` still serves the old Claimwise UI

To deploy on Netlify: connect a site to this repo and set the production
branch to `loomwright`. `netlify.toml` is already configured.

### C. Reference folders (do not deploy)

- `_remote_preview/` — the pre-rebuild Claimwise app (still on `main` of the
  Claimwise repo). Kept for diffing.
- `claimwise/project/` — the original Claimwise source dump. Kept for history.

---

## 3. How the app boots

1. `src/index.js` mounts `<App />` inside `<ErrorBoundary>` and registers the
   service worker.
2. `App.js` opens a `<ThemeProvider initial="night">` (Loomwright theme) and
   renders `<AppInner />`.
3. `AppInner` on mount:
   - Calls `db.init()` (IndexedDB).
   - `contextEngine.isOnboardingComplete()` decides one of two paths:
     - **Not done** → `worldState` set to empty + default stat registry,
       `activeTab='onboarding'`, `<OnboardingHost>` full-screen overlay
       shows the wizard.
     - **Done** → `loadWorld()` reads every store (`actors`, `itemBank`,
       `skillBank`, `statRegistry`, `books`, `meta`, `plotThreads`, `places`,
       `floorplans`), converts `books` array to object form
       `{ [id]: book }`, saves to `worldState`, seeds `undoRedoManager`.
4. Nav: `NavigationSidebar` + `AppHeader` render around the active page.
5. Page routing is a simple `switch (activeTab)` in `AppInner.renderPage()`.

### State shape

`worldState` roughly mirrors the legacy shape — many old components rely on it:

```js
{
  meta: { premise, tone, reveal, title, genres, ... },
  statRegistry: [{ id, key, name, desc, isCore, color }, ...],
  skillBank: [...],
  itemBank: [...],
  books: { [bookId]: { id, title, chapters: [...] } },   // object, not array
  actors: [{ id, name, baseStats, additionalStats, equipment, inventory, activeSkills, ... }],
  plotThreads: [...],
  places: [...],
  floorplans: [...],
}
```

Persistence is still IndexedDB via `services/database.js`. **DB name is kept
as `ClaimwiseOmniscience`** deliberately so existing installs' data carries
over; do not rename without a migration.

---

## 4. How to run / build / deploy

```bash
cd loomwright-app
npm install            # ~50s cold, ~5s warm
npm start              # dev server on http://localhost:3000
npm run build          # production build in build/
```

Build succeeds with `CI` unset. See known issues below for the CI=true caveat.

---

## 5. Known issues, gotchas, and broken things

The next agent should plan to fix these. Ranked by severity.

### 5.1 Build fails on Netlify if `CI=true` (likely)

CRA treats ESLint warnings as errors when `CI=true`, which Netlify sets by
default. The legacy component tree has hundreds of pre-existing lint
warnings (unused imports, missing hook deps, anonymous default exports,
missing default cases). Locally `npm run build` succeeds because `CI` is
unset, but **Netlify will very likely fail**.

**Fix options (pick one):**
- Add `CI=false` in Netlify site env vars (quickest).
- Or add `"build": "CI= react-scripts build"` to `package.json` scripts.
- Or do a proper lint pass on the legacy components and fix the warnings.

Look at the tail of any Netlify failure — it'll list `[eslint] ... Treating
warnings as errors because process.env.CI = true.` if that's the cause.

### 5.2 Nested Loomwright shells on several pages (cosmetic)

When wiring pages I originally tried to import named "body" functions from
each Loomwright component to avoid double-wrapping in `<LoomwrightShell>`.
Webpack/CRA couldn't resolve those named exports (cause never fully
diagnosed — I reverted to default imports and the build passed). The
consequence: on these pages the page chrome lives inside one `LoomwrightShell`
and the default-exported component mounts **another** `LoomwrightShell`:

- `pages/Today.jsx` → `MorningBrief` + `DailySpark` each wrap themselves in a shell
- `pages/Write.jsx` → `CanonWeaver`, `LanguageWorkbench`, `InterviewMode` each
  render their own shell (inside drawers)
- `pages/cast/CharacterDetail.jsx` → Wardrobe tab mounts `CharacterWardrobe`
  which wraps itself
- `pages/Settings.jsx` → `AIProviders` (providers tab) has its own shell when
  the original was expected to be mounted as a body only
- `pages/Atlas.jsx` → Atlas AI tab mounts `AtlasAI` (nested)

**Symptoms you'll see:**
- Duplicate scroll containers (two scrollbars inside drawers).
- The root `ThemeToggle` in the header flips the *outer* theme; the nested
  shell keeps its own theme context, so toggling day/night only visibly
  flips the page chrome, not the component body.
- Slight extra border/padding around those components.

**Fix:** either (a) re-export each component's body as a named export (already
attempted — the named export drops silently during webpack tree-shaking in
this codebase; needs deeper investigation), or (b) modify each Loomwright
surface to accept a `scoped` / `bare` prop that omits its own shell when
mounted inside an app shell.

### 5.3 Legacy components retain Claimwise Tailwind palette

Every page I build mounts existing components (`EnhancedItemVault`,
`CharacterArcMapper`, `MasterTimeline`, `SkillTreeSystem`, `WikiManager`,
`UKMapVisualization`, `PlotBeatTracker`, …) unchanged. They still use the
old slate-900/emerald-500 Tailwind classes. Inside the new Loomwright cream/amber
chrome they will look **visually mismatched**.

**Fix:** either theme each component via `useTheme()` + inline styles (a lot
of work) or scope the Tailwind palette to match the Loomwright tokens
globally. The legacy RPG styles live in `src/styles/theme.css` and
`rpgComponents.css`; retheming those CSS variables cascades cheaply.

### 5.4 Onboarding wizard steps are still Claimwise-styled

[`src/components/OnboardingWizard.jsx`](loomwright-app/src/components/OnboardingWizard.jsx)
(~2700 lines) still uses slate/emerald Tailwind. I wrapped it in a
Loomwright-branded header bar (`pages/OnboardingHost.jsx`) but did **not**
re-theme the step UI itself. Functionally it's fine — it writes the same
fields into the same DB stores that the new Loomwright pages read from —
but visually it's the old Claimwise wizard sitting under a Loomwright header.

**Fix:** re-theme the step UI using `loomwright/primitives` (`Panel`, `Chip`,
`Button`) and `useTheme()`.

### 5.5 Global Search (`Ctrl+K`) routes to dead tab IDs

`src/components/GlobalSearch.jsx` is used as-is. Its `onNavigate` callback
emits legacy tab ids like `'personnel'`, `'bible'`, `'items'`, `'story'` —
none of which exist in the new nav. Pressing Ctrl+K → click a search result
will fall through to the `default` case in `renderPage()` and land on
Today. Search itself still works; navigation from results does not.

**Fix:** translate legacy tab ids to new ones in the `onNavigate` handler
in `App.js`. Mapping roughly:

| Legacy id     | New id          |
|---------------|-----------------|
| personnel     | cast            |
| items         | items_library   |
| skills        | skills_library  |
| stats         | stats_library   |
| story         | write           |
| bible         | write           |
| relationships | cast_detail     |
| backup        | settings        |
| settings      | settings        |

### 5.6 Ctrl+1..6 shortcuts changed

Old shortcuts went to personnel / stats / skills / items / story / bible.
New shortcuts in `App.js` go to today / write / cast / atlas /
plot_timeline / settings. Legacy `KeyboardShortcutsHelp` still documents
the old ones. Users opening the help sheet will see wrong shortcuts.

**Fix:** update `KeyboardShortcutsHelp` to show the new bindings, or make
it data-driven.

### 5.7 Creating a new character from Cast is not wired

`pages/Cast.jsx` shows a list of characters and lets you click through to
detail, but there's no "Create character" action. Creation used to run
through legacy `creatorMode` state in the old App.js, which I did not port.

Characters can still be created via Canon Weaver proposals and the
Entity extraction wizard inside Write — but not directly from Cast.

**Fix:** add a "New character" button on Cast that opens a modal (reuse
the legacy actor-creator modal from `App.legacy.js`, or write a minimal new one).

### 5.8 Wiki tab in World is scoped to items only

`pages/World.jsx` mounts `WikiManager entities={items} entityType="item"`.
The legacy Wiki Manager handled multiple entity types (characters, items,
lore, places, factions). Right now Loomwright's Wiki tab shows items only.

**Fix:** either render one `WikiManager` per entity type in separate
sub-tabs, or extend `WikiManager` to take a multi-type union.

### 5.9 Factions tab is a heuristic filter

Factions aren't a first-class entity — I filter items by
`type.toLowerCase().includes('faction')`. That's good enough to avoid a
blank tab but won't reflect a real faction model. If your world uses a
dedicated faction store, wire that instead.

### 5.10 Onboarding shortcut in PWA manifest is broken

[`public/manifest.json`](loomwright-app/public/manifest.json) has shortcuts
pointing at `/?tab=story` and `/?tab=lw_weaver`. Those tab ids don't exist
in the new app. A user launching from a PWA shortcut will fall through to
Today.

**Fix:** change shortcut URLs to `/?tab=write`. Note: the current App.js
also doesn't read a `tab` query param on mount — either add that logic or
drop the shortcuts.

### 5.11 Service worker caching

[`public/service-worker.js`](loomwright-app/public/service-worker.js) is
unchanged from the Claimwise version. It aggressively caches the app
shell. Users upgrading from the old app on the same origin may see a
stale UI until the new service worker activates. There is a
`LOOMWRIGHT_UPDATED` message handler in `index.js` to auto-refresh, but
the SW itself may need a version bump to trigger activation.

**Fix:** bump the SW `CACHE_NAME` constant on each deploy, or wire it to a
build-time env var.

### 5.12 Mobile Preview + Docs tabs dropped

Old nav had `Mobile Preview` (`MobileLoomwright`) and `Design & Docs`
(`LoomwrightDocs`) as surfaces. Neither is in the new 5-group IA. Files
still exist at `src/loomwright/mobile/` and `src/loomwright/docs/` but are
never imported. If you want them back, add them under Settings (or a
hidden `/debug` route).

### 5.13 Undo/Redo coverage is partial

`App.js` wires `undoRedoManager` against top-level `worldState` changes. But
many legacy components persist via `db.update(...)` directly and never go
through `setWorldState`. Undo/redo will **not** capture those changes.

**Fix:** either (a) audit the legacy components and route writes through
`setWorldState` (big work) or (b) wrap `db.update` to emit an undo snapshot.

### 5.14 Small responsive issues

Sidebar width is fixed at 224 px, header at 48 px, and pages are not
tested below ~1024 px. On narrow screens the two-column Today layout and
the Write editor+rail layout will get cramped.

**Fix:** add media queries to collapse the rail into a toggle below a
breakpoint; turn the sidebar into a hamburger on small screens.

### 5.15 PlotBeatTracker needs currentBookId/currentChapter

`pages/PlotTimeline.jsx` passes `bookTab` and `currentChapter` from
`App.js`, which default to `1`/`1`. If the onboarding wizard creates a
book with a different id (possible — it uses `id: 1` by default but there
are edge cases), beats won't load. Low risk, worth verifying.

### 5.16 WritingCanvasPro on first load

Editor expects `books` to contain a book with a `chapters: [{ id: 1 }]`
entry. The onboarding wizard creates exactly that, so fresh installs work.
Users whose data predates the wizard may see a blank editor until they
create a chapter.

### 5.17 AI provider keys are not validated on save

Legacy `aiService.getRuntimeKeys()` is read at startup but there's no UI
feedback when a key fails. The `AIProviders` panel under Settings will let
you paste keys, but a bad key surfaces only when an AI call errors mid-generation.

### 5.18 A lot of imports are "unused" warnings, not bugs

Most of the hundreds of ESLint warnings are harmless unused imports in
legacy files. They don't affect runtime. They only matter if `CI=true` on
build (see 5.1).

### 5.19 Export/backup filenames — one was missed

I renamed `claimwise-backup-*.json` → `loomwright-backup-*.json` in
`services/syncService.js` and `components/Settings.jsx`, and the QR-code
fallback anchor in `SyncManager.jsx`. However the zip / .json download
*inside* `BackupManager.jsx` may still contain internal strings that say
"Claimwise". Audit `BackupManager.jsx` if 100% rebrand matters.

### 5.20 Theme toggle doesn't propagate into nested Loomwright surfaces

Because of 5.2, each nested `LoomwrightShell` creates its own
`ThemeProvider`. Toggling theme via the header only flips the root.

**Fix:** same as 5.2.

### 5.21 `App.legacy.js` and `NavigationSidebar.legacy.jsx` are dead weight

They're not imported by anything but they live in `src/`. They add ~300 KB
to the source tree. CRA webpack tree-shakes them out of the production
bundle because they're never reached, so `build/` is fine. But an
incautious dev reading the repo may accidentally edit them.

**Fix:** move them to `docs/legacy/` or delete after first production deploy.

---

## 6. Features that are stubs / incomplete

- **Cast > Create new character** — no UI (see 5.7).
- **Character detail > Voice tab** — shows the raw voice profile JSON when
  one exists; does not let you edit inline (edits happen in Voice Studio).
- **Character detail > Skills tab** — read-only list; assign/unassign UI
  not implemented.
- **Character detail > Plot tab** — renders `CharacterPlotInvolvement`
  which is display-only.
- **Write > Language inline-on-selection** — the plan called for this to
  fire automatically on text selection; it's currently only accessible via
  the Language drawer button.
- **Write > Story Analysis jump-to-position** — the drawer lists issues
  and routes the user back to the Write tab via
  `chapterNavigationService.navigateToChapter(bookId, chapterId)`. It does
  *not* yet scroll the editor to the specific character range within the
  chapter. That requires extending `chapterNavigationService` to accept a
  `range` and wiring `WritingCanvasPro` to seek to it.
- **Relationships tab collapse** — I stacked two of the three legacy
  relationship views (`CharacterRelationshipHub` + `CharacterRelationshipWeb`)
  but didn't truly merge them into one. `RelationshipNetworkGraph` is not
  included.
- **Settings > Preferences** — uses the old `Settings.jsx` body, which
  contains options for features that no longer have a dedicated tab (e.g.
  "Writer's Room mode"). Some toggles may set localStorage keys that
  nothing reads anymore.
- **IntegrationPreviewModal** — the old app showed it when Canon Weaver
  was about to apply big batches. Not wired in the new app.
- **backgroundNotificationService** / **autonomousPipeline** /
  **canonExtractionPipeline** — services exist but have no UI trigger in
  the new app.

---

## 7. Suggested order of attack for the next agent

Ranked by payoff × cheapness:

1. **Add `CI=false` to Netlify env** (1 minute, unblocks deploys) — §5.1.
2. **Fix Global Search nav ids** (15 minutes, restores Ctrl+K) — §5.5.
3. **Fix KeyboardShortcutsHelp** bindings (15 minutes) — §5.6.
4. **Re-theme onboarding wizard** with Loomwright primitives (half-day) — §5.4.
5. **Solve the nested-shell problem** properly by adding a `scoped` prop to
   each Loomwright component (half-day) — §5.2, §5.20.
6. **Add Cast > Create character** (half-day) — §5.7.
7. **Range-jump in Story Analysis drawer** (1 day) — §5 list item.
8. **Global Loomwright repalette of legacy components** (the big
   multi-day one — retheme slate/emerald → Loomwright tokens) — §5.3.

---

## 8. Deploy checklist

- [ ] Set `CI=false` in the Netlify site's Environment variables.
- [ ] Branch: `loomwright` on `DrDoback06/Claimwise`.
- [ ] Build command: `npm run build`.
- [ ] Publish directory: `build`.
- [ ] Node version: 18+ (react-scripts 5.0.1 requires it).
- [ ] Test PWA install on mobile; make sure no "claimwise" strings show in
  the install prompt (manifest already says "Loomwright").
- [ ] Verify IndexedDB data from the old site is picked up on the new
  origin (if the Netlify hostname changes, the DB is empty by design —
  users need to export from the old site and import in Settings > Data).

---

_Last updated: initial rebuild commit (see `git log`)._

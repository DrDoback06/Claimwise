# Loomwright · Feature Map & Placement Plan

The new Writers Room is the face of the app. Every working feature from the old `src/` app has a home in one of the seven panels, the prose room itself, the top-bar, the command palette, or the onboarding wizard.

**Guiding principle (from the handoff):** *The prose is the room.* Everything else is summoned around it. The blank-canvas user is the primary user — nothing on screen assumes data exists. AI only appears when it has something real to say.

---

## 0 · First-run (new user)

| Feature | Where | Source in src/ |
|---|---|---|
| Onboarding wizard | Full-screen modal before the room opens | `src/components/OnboardingWizard.jsx` |
| Genre / POV / tone / title / target / influences capture | Step 1–4 of wizard | — |
| World type + real-world anchor | Step 5 — feeds Atlas | — |
| Manuscript import (optional, promoted) | Step 6 | `ManuscriptParser.jsx`, `manuscriptIntelligenceService.js` |
| Seed cast (optional) | Step 7 | — |
| Ritual capture (sprint length, rhythm) | Step 8 | `SessionTimer`, `WritingGoals` |
| Result → user preference profile | Persisted to localStorage under `lw.profile` | — |

All captured signals seed the **AI preference profile** the entity-detector and voice-matcher draw on.

---

## 1 · The Room shell

| Element | Purpose |
|---|---|
| **Left rail** | Writing-session controls + 7 panel toggles + chapter tree toggle |
| **Top bar** | Book / chapter breadcrumb, chapter scrubber, word count, streak, ⌘K |
| **Prose pane** | Contenteditable manuscript surface — the only permanent thing |
| **Margin** | Live AI noticings tethered to paragraphs |
| **Panel stack** | Up to 4 side-by-side panels, drag-resizable |
| **Ritual bar** | Word count today / target / streak / keyboard hint |

---

## 2 · Panels (one per sidebar tool)

### Cast — characters
Maps from: `actors`, `stats`, `skills`, `items` in `database.js`.

| Surface | Wires to |
|---|---|
| Roster (on-page / off-page) | `actors` |
| Stat bars | `StatDisplayHub`, `StatHistoryTimeline` |
| Skills | `SkillCardView`, `SkillTreeSystem`, `SkillMomentsTimeline` |
| Inventory (draggable) | `EnhancedInventoryDisplay`, `PaperDollView`, `EquipmentChangeViews` |
| Dialogue extract | `CharacterDialogueHub`, `CharacterDialogueAnalysis` |
| Arc chart | `CharacterArcMapper`, `CharacterProgressionView` |
| Relationships | `CharacterRelationshipHub`, `RelationshipNetworkGraph` |
| Callbacks/memories | `CallbacksAndMemoriesDisplay` |
| AI suggestions | `CharacterAISuggestionsPanel` |
| Interview | Sub-mode, opens as 4th panel |

### Atlas — world & places
| Surface | Wires to |
|---|---|
| Realm picker | `worldState.world` |
| Map view + journey lines | `StoryMap.jsx`, `UKMapVisualization.jsx` |
| Floor-plan view | `StoryMap` pins |
| Place detail + propose-pin | `worldConsistencyService.js` |
| Lore auditor | `ConsistencyChecker` scoped to places |

### Threads — plot
| Surface | Wires to |
|---|---|
| Active / dormant threads | `PlotThreadTracker`, `PlotQuestTab` |
| Beat timeline | `PlotTimeline`, `MasterTimeline`, `PlotBeatTracker` |
| Character filter | `plotThreadingService.js` |
| Severity + warnings | `narrativeArcService.js` |

### Items — inventory
| Surface | Wires to |
|---|---|
| Item vault | `EnhancedItemVault` |
| Ownership timeline | `ItemOwnershipTimeline`, `InventoryHistoryTimeline` |
| PaperDoll anatomical | `PaperDollView` |
| Story context per item | `ItemStoryContext`, `ItemQuestContext` |
| Item → skill links | `ItemSkillAssociations` |
| AI suggestions | `ItemAISuggestionsPanel`, `InventoryAISuggestionsPanel` |

### Voice — style
| Surface | Wires to |
|---|---|
| Slider dashboard | `voiceService.js`, `styleGuideService.js` |
| A/B compare | `StylePreviewPanel`, `StyleTestPanel` |
| Chapter assignment | `styleConnectionService.js` |
| Teach from sample | `styleReferenceService.js`, `NegativeExamplesManager` |
| Live voice score | `ChapterMoodSliders`, `MoodMeter` |

### Language — text quality
| Surface | Wires to |
|---|---|
| Grammar / spelling | `writingEnhancementServices.js` |
| Thesaurus | — |
| Readability metrics | `ManuscriptIntelligence.jsx` |
| Consistency check | `ConsistencyChecker.jsx`, `worldConsistencyService.js` |
| Rewrite (shorten/tighten/flip) | `aiService.js` |

### Tangle — freeform mind map
| Surface | Wires to |
|---|---|
| Drag-drop entity nodes | `GravityMindMap`, `StoryMindMap` |
| SVG edge connectors | — |
| Auto-populate from real relationships | `relationshipAnalysisService.js` |
| Persist layout | localStorage `lw.tangle` |

---

## 3 · Global surfaces

| Surface | Keystroke | Wires to |
|---|---|---|
| **⌘K Command palette** | ⌘K | Unified search across `actors/items/skills/chapters/wiki` (from `GlobalSearch.jsx`) |
| **⌘J Inline Weaver** | ⌘J | `integrationService.previewIntegration()`, `canonExtractionPipeline.js` |
| **Right-click prose** | Right-click | `AIContextualMenu.jsx` — works on *selected text* |
| **Right-click entity name** | Right-click | `EntityHoverCard` → open real dossier in Cast / Items / Atlas |
| **Summoning Ring** | Right-click empty prose | 8 tool radial |
| **Focus mode** | F9 | Hide chrome, typewriter scroll |
| **Read-aloud** | Toolbar | `GlobalReadAloud.jsx`, `textToSpeechService.js` |
| **Speed reader** | Toolbar | `SpeedReader.jsx` |
| **Version control** | Toolbar | `VersionControl.jsx` |
| **Sync** | Toolbar | `SyncManager.jsx`, `cloudSync.js` |
| **Backup** | Toolbar | `BackupManager.jsx` |
| **Settings** | Toolbar | `Settings.jsx` |

---

## 4 · AI margin noticings — what shows up live

As the user types, `manuscriptIntelligenceService` + `entityMatchingService` + `entityInterjectionService` produce these categories of noticing. Each appears in the margin, tethered to the paragraph.

| Category | Colour | Trigger |
|---|---|---|
| `entity` | neutral accent | New proper noun detected → "Is this a character / place / item?" |
| `cast` | blue | Contradicts a character's known state/voice |
| `atlas` | green | Location mentioned, no pin |
| `thread` | rust | Dangling plot hook, payoff opportunity |
| `voice` | warm | Drifts from learned voice profile |
| `lang` | violet | Grammar / echo / adverb / repetition |
| `spark` | amber | AI what-if tuned to chapter context |
| `loom` | muted | Structural / connective observation |

**Cadence:** ambient low-priority (on 2-second idle pause) + on-demand deep scan (button in margin header). Never on every keystroke.

---

## 5 · Learning loop

Every accept / reject / edit of a noticing writes back to `suggestionFeedbackService.js` → `suggestionLearningService.js`, which updates the preference profile stored at `lw.profile`. The profile biases:
- Entity-detection threshold (are we too trigger-happy?)
- Voice profile weights (what does "sounds like them" actually mean?)
- Intrusion level (user dismisses a lot → back off)
- Prompt deck ordering in Interview

---

## 6 · Blank-canvas behaviour

For a brand-new user with no data:
- **Prose** — empty contenteditable with placeholder "Chapter 1…"
- **Cast / Atlas / Threads / Items** — empty state with "Create first" CTA + inline explanation of how AI auto-recognition will help
- **Voice** — seeded from onboarding answers (not empty)
- **Language** — always works (doesn't depend on data)
- **Tangle** — empty canvas
- **Margin** — only one noticing visible: *"Start writing — I'll begin noticing things after the first paragraph."*
- **Interview** — disabled until ≥1 character exists
- **Weaver** — works on whatever the user types, even with zero canon

---

## 7 · Out of this pass (next)

- Mobile/Capacitor shell
- Accessibility audit
- Real contenteditable → TipTap migration (stay on contenteditable for v1)
- Actually running the real `aiService` inside the HTML — we'll keep `window.claude.complete` as the stub for now and add a clean service-layer seam so swapping it is one file
- Porting back into `src/App.js` — this pass ships the new experience as standalone HTML that reads/writes the same `lw.*` localStorage keys, which the future React port will share

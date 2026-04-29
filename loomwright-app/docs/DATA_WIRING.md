# Loomwright data wiring

Production UI must read from IndexedDB-backed `worldState` and services—not from `_remote_preview/redesign` demo constants.

## Core stores (`services/database.js` + `App.js` loadWorld)

| Domain | `worldState` key | Writers (examples) | Readers (examples) |
|--------|------------------|--------------------|--------------------|
| Places | `places` | AtlasBuilder, AtlasAI, Canon Weaver apply, `db.add('places')` | Atlas pages, RegionView, proposePlaces |
| Regions | `regions` | AtlasBuilder `commitRegionPatch` | RegionView, place pins |
| Floorplans | `floorplans` | manual / future | FloorplanView |
| Books & chapters | `books` | WritingCanvasPro, onboarding | All surfaces; chapter text: `chapter.content \|\| chapter.script` |
| Cast | `actors` | Cast, CharacterDetail, chapterApplyService | Everywhere |
| Items | `itemBank` (+ `actors[].inventory`) | Items library, chapterApplyService `item.track[chapterId]` | InventoryMatrix, ProvenancePane |
| Skills | `skillBank`, `actors[].activeSkills` | Skills library, chapterApplyService | Skill trees, Character detail |
| Plot | `plotThreads`, etc. | Plot timeline | — |

## Feature → source map

### Atlas AI proposals (tab + AtlasBuilder ghosts)

- **Heuristic proposals:** `proposePlaces(worldState)` in `services/atlasProposals.js` scans `books.*.chapters` prose (`content` / `script`).
- **LLM proposals:** `extractPlaceProposals` in `loomwright/atlas/atlasAI.js` uses `aiService`; output merged into `places` via AtlasAI accept or AtlasBuilder.

### Inventory matrix (`pages/cast/InventoryMatrix.jsx`)

- **Per-chapter cells:** `item.track[chapterNumber]` — `{ stateId, actorId, note, quote?, unresolved?, at }`.
- **Written by:** `chapterApplyService.applyExtractionToActors` (pickup rows), manual edits via UI where implemented.

### Mobile preview (`loomwright/mobile/MobileLoomwright.jsx`)

- **Today:** `worldState` for book/cast; `generateMorningBrief`, `generateSparks`, `proposePlaces` for pings (requires parent to pass `worldState`).
- **Capture queue:** `localStorage` key `lw-mobile-capture-queue` (JSON array of `{ id, text, at }`).

### Today / Daily

- **MorningBrief / DailySpark components:** same `worldState` + `dailyAI.js` (uses `chapter.summary \|\| chapter.text`—prefer aligning with `content \|\| script` in prompts).

## Mock vs production (audit)

| Redesign mock | Production surface | Gap addressed |
|---------------|-------------------|---------------|
| 13 Atlas AI | AtlasBuilder + AtlasAI | AtlasAI uses real chapter text; local + AI scan; merge hints |
| 14 Inventory | InventoryMatrix | `track` fields `quote`, `unresolved`; timeline shows them |
| 16 Mobile | MobileLoomwright | `worldState` passed; pings, spark, word count; capture persisted |
| 07–11 Weaver/Voice/Language/Interview | `loomwright/*` | UX parity ongoing; data via existing AI + DB |
| 00–06, 09, 15 docs | `public/loomwright-docs` | Static IA only |

## Acceptance

For each new UI: document **store keys**, **selectors**, **write path**, and confirm **full reload** preserves data.

## Deploy / CI

Netlify should run with `CI=false` (see root `netlify.toml` build command). Local `package.json` `build` uses `cross-env CI=` so CRA does not treat ESLint warnings as errors.

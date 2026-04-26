# Loomwright — Code Insight Document

**For:** Claude Code (Loomwright branch `claude/implement-loomwright-1NLyc`)
**From:** Design
**Pairs with:** `Loomwright Design Pass.html` (open this for the visual spec — it's a single-file design canvas with one focused artboard per system)

---

## ⚠ 0a · Prime directive: ENHANCE, NEVER REPLACE

**Read this before you write a single line.**

This design pass is additive. Every existing component in the repo stays. I have not redesigned anything that already works — I have only:

1. **Wrapped** existing components in new shells (`EnhancedItemVault`, `SkillTreeSystem`, `SkillTreeVisualizer`, `EnhancedInventoryDisplay`, `PaperDoll`, `UKMapVisualization`, `AtlasAI`, `InlineWeaver`, `WritingAid`, `Proofreader`, `Dossier`, the existing primitives in `src/loomwright/primitives/`).
2. **Added** new sibling components for systems that don't exist yet (Suggestion drawer, Margin extraction chips, Continuity panel, Knows ledger section, Tangle matrix view, Extraction wizard).
3. **Augmented** schemas with new optional fields — never replaced existing fields.

**Rules of engagement:**
- If a component exists in `src/loomwright/`, **import and reuse it**. Do not reimplement. If it doesn't fit the new shell, add a prop (e.g. `width`, `density`, `mode`) — don't fork.
- If a schema field exists, **don't rename it.** Add new fields alongside.
- If a token exists in `src/loomwright/theme.js`, **don't change its value.** I added three new tokens (`sugg`, `suggInk`, `hand`) — those are additive too.
- The `night` theme is preserved. I switched the design canvas's *primary* preview to `day` for legibility, but both must keep working at runtime via the existing `ThemeToggle`.
- Every new slice / field / event is flagged in this doc with **`(NEW)`**. Everything else assumed to exist — confirm before touching.

If you find yourself rewriting something rather than wrapping or extending it, **stop and re-read this section.**

---

## 0 · How to read this

This is the **Document B** (Code Insight) the supplement asked for. The visual spec is the HTML canvas itself — every artboard has annotated yellow "↳ Hookup" callouts pinned to the relevant component, plus monospace kickers identifying the source file path I'm targeting in your existing tree.

I worked from your repo branch as gospel. I did not redesign anything that already exists. Every new surface either (a) wraps an existing component or (b) plugs a hole the brief explicitly identified. Where I made a call between alternatives, I called it once and ran with it — see Section 9.

For each system I followed the supplement's B.1–B.9 template. Sections that don't apply to a given component say **N/A**.

---

## 1 · Selection Bus visual language *(Tier 1, blocks everything)*
Artboard: **01 · Spine**

### B.1 Why this design?
Every panel reads `sel`. The pill, lock, multi-select stack, and `@`-mention are the connective tissue between them. If these aren't settled, every other component has to relitigate the same conventions in isolation. I kept the surface tiny on purpose: one pill style, one lock metaphor, one mention syntax.

### B.2 State model
- **Reads**: `sel.character | sel.place | sel.thread | sel.item | sel.multi`.
- **Owns locally**: nothing.
- **Writes**: only via × → `clearSelection()`. Mention click → `setSelection({ kind, id })`.
- **New slice required**: `panelLocks: Record<PanelId, LockState>` where `LockState = { mode: 'follow' | 'whole' | 'entity', pinnedTo?: EntityRef }`. **Per-panel, NOT in `sel`.** This is critical — locks are panel-local, not global.

### B.3 Selection Bus integration
The pill IS the visualisation of the bus. Lock chip lives in each panel header, top-right.

### B.4 Data flow
Pure derived rendering. No fetching.

### B.5 Edge cases
- **Empty** (`sel` all null): pill hidden entirely. Don't render "Selection: none".
- **Multi**: pill renders avatar stack (overlap −8px) + "Tom + Iris + 2 others" + ×.
- **Stale entity**: if the selected entity is deleted, dispatch `clearSelection()` immediately; show a one-time toast.
- **Loading**: N/A — selection is client state.
- **Locked panels exist with sel set**: pill still shows `sel`; locked panels just ignore it.

### B.6 Interaction sequencing
Click × → optimistic immediate clear. Shift-click on a Cast tile → adds to `sel.multi`, primary becomes the most recently set. Cmd/Ctrl-click on existing multi member → removes it.

### B.7 Animation
Pill slides down 250ms ease-out on first appearance, fades 150ms on clear. Fast — utility chrome, not an event.

### B.8 Open questions for Code
- Confirm `sel` is a single global slice, not duplicated across panel-local stores. If duplicated, that's a refactor before any of this works (and it's already on your parallel-work list — item 5).
- Confirm the manuscript editor (`InlineWeaver` / Writers Room core) can intercept and render `@mention` tokens with click handlers without breaking existing keyboard nav. **Flag if not** — `@`-mentions depend on it.

### B.9 Decisions made
- **Lock metaphor**: chose **pin (📌)**, not lock. Lock implies "don't edit"; pin reads as "stay put." Three states: `follow` (default), `whole` (pinned to overview), `entity` (pinned to a specific selection).
- **Mention syntax**: **unified `@` prefix** with optional type qualifier (`@Tom`, `@loc:Riverside`, `@item:watch`, `@thread:revenge`). Rejected the brief's mixed `@` / `#` / `*` / `%` because `*item*` collides with markdown italics and the four-sigil mental model is heavier than a one-sigil one.
- **Pill style**: **avatar-led** as you requested — portrait + name + role + ×.

---

## 2 · Dossier *(Tier 1)*
Artboard: **02 · Dossier**

### B.1 Why this design?
Replaces the broken horizontal tab scroller. Vertical collapsible sections so the writer can see all of a character's surface area at once, scroll between sections naturally, and never lose context. Per your answer, **Stats / Inventory / Threads open by default; rest collapsed.**

### B.2 State model
- **Reads**: `sel.character`, full character record by id, current chapter (for "Knows as of ch.X").
- **Owns locally**: per-section `open` map (booleans), Timeline Scrubber position. **Persists** the section-open map to localStorage, keyed by `dossier.openByChar[charId]` so each character remembers its own collapse state.
- **Writes**: edits propagate as `updateCharacter(id, patch)`.
- **New slice**: none beyond what already exists for characters.

### B.3 Selection Bus
Sole subscriber: `sel.character`. When `sel.character` is null → roster overview (replaces the dossier header with a "Select a character" empty state with a search field and recent characters).

### B.4 Data flow
Subscribes to character record by id; Timeline Scrubber re-derives Inventory / Knows / Location at the scrubbed chapter from `character.inventoryByChapter`, `character.knows[].learnedAt`, `character.locationByChapter`.

### B.5 Edge cases
- **Empty character** (just created, no data): collapsed sections show a compact "Empty · click to add first X" inline action, NOT the full empty state. Empty state belongs at the panel level only.
- **Loading**: section bodies render skeleton bars matching their typical height.
- **Overflow** (50+ inventory items): section auto-virtualises. Long lists collapse to "+ 23 more" by default.
- **Concurrent**: if `sel.character` changes mid-load, abort the pending fetch (use AbortController).
- **Locked**: panel header shows "Pinned · Tom" badge in amber; pill above shows the actual `sel`.

### B.6 Interaction sequencing
Section header click → toggle, animate 180ms (height: auto → 0). All edits in-place; commit on blur. Drag from Inventory → PaperDoll = equip (optimistic, server confirms).

### B.7 Animation
Section expand/collapse uses `grid-template-rows: 0fr → 1fr` trick (no measure-then-animate jank). 180ms because this is utility, not delight.

### B.8 Open questions for Code
- Confirm `character.locationByChapter`, `character.inventoryByChapter`, and `KnowledgeEntry.learnedAt` exist on the model. The Timeline Scrubber depends on all three. **Flag any that aren't there yet — backend work.**
- Confirm `PaperDoll` can render at the Inventory section width (~600px) without breaking. If not, design needs to know.

### B.9 Decisions made
- **Section order**: Stats · Skills · Inventory · Threads · Relationships · Traits & Voice · Knows·Hides·Fears · Arc — kept your proposed order; it reads from "what they can do" → "who they are" → "where they're going."
- **Inventory layout**: PaperDoll left (240px), grid right. PaperDoll highlights the corresponding grid item on hover.
- **Skills layout**: collapsed → 3 most-recent unlocked nodes as chips; expanded → full `SkillTreeVisualizer`.

---

## 3 · Suggestion Engine *(Tier 1, flagship)*
Artboard: **03 · Suggestion Engine**

### B.1 Why this design?
Drawer-off-drawer. Cards in the right rail (always available when an entity is selected), detail panel pushes left as a second layer when a card is opened. Why this rather than modal, accordion, or full-screen takeover:

- **Modal** breaks flow — the writer is in their manuscript and a modal hijacks attention.
- **Accordion** loses the card list (out of sight = forgotten).
- **Full screen** is hostile for a system that should whisper, not shout.
- **Drawer-off-drawer** preserves the card list (still visible at the right edge), gives the detail enough room to feel writerly (it's prose, not data), and uses motion to communicate "this is a layer, not a replacement."

The visual identity (paper texture, Fraunces serif, Caveat handwritten ink for staged inserts) is deliberately distinct from the rest of the app — these are Claude's voice, not Loomwright's chrome.

### B.2 State model
- **Reads**: `sel.character | sel.place | sel.thread`, current chapter id, dismissed/snoozed/accepted ledgers.
- **Owns locally**: `phase: 'list' | 'detail' | 'wizard'`, `openId`, customisation form state (length, tone, refs).
- **Writes**: `acceptSuggestion(id, { insertion: 'cursor' | 'tray', body, customisation })`, `snoozeSuggestion(id, currentRelevance)`, `dismissSuggestion(id)`, `boostSuggestion(id)` (premium call), `regenerateSuggestions(scope)`.
- **New slices**:
  - `suggestions: { open: Suggestion[]; snoozed: Suggestion[]; dismissed: Suggestion[]; accepted: Suggestion[] }` — keyed per scope (character/place/thread).
  - `suggestionPrefs: { defaultInsertion: 'cursor' | 'tray', snoozeReSurfaceDelta: 15 }`.
  - `pendingInsertions: Insertion[]` — the tray.

### B.3 Selection Bus
Drawer is conditionally mounted on `sel.character || sel.place || sel.thread`. When all are null → "whole-book mode" with pacing/structural cards. Drawer respects its own lock state (you can pin the drawer to a specific entity while sel changes).

### B.4 Data flow
- **Trigger 1**: chapter saved → `regenerateSuggestions(currentScope)` (debounced 800ms in case of save spam).
- **Trigger 2**: material character state change (item gained/lost, location changed, fact learned) → regenerate scoped to that entity.
- **Trigger 3**: explicit "Refresh" click → regenerate.
- **Boost**: only the visible "Boost" affordance triggers a premium call. Free model NEVER silently escalates.
- **Cache**: keep last 50 suggestions per scope in memory; swap to indexedDB if it grows. Dismissed go to a permanent dump (always retrievable from "Dismissed" tab).

### B.5 Edge cases
- **Empty** (no suggestions yet): "No whispers yet. Save a chapter or refresh." with a refresh button. Don't generate just because the panel opened — wasteful.
- **Loading**: 3 skeleton cards with subtle shimmer (not flashy).
- **Error** (free model failed): inline banner "Couldn't reach the model — retry?" Cards from cache stay visible.
- **Overflow** (>20 cards): virtualise. "Show low-relevance (12)" disclosure for sub-40% relevance cards.
- **Concurrent**: selection changed mid-fetch → cancel pending, fetch for new scope. Card list shows scope name in the header so the writer knows what they're looking at.
- **Locked**: lock pin shows "Pinned · Tom" in the drawer header; sel changes don't refresh until unpinned.

### B.6 Interaction sequencing — Accept mini-wizard
1. Click **Accept** on a card → drawer phase transitions to `wizard` (slide left 220ms).
2. Wizard shows: editable preview (textarea-styled with serif font + paper bg), insertion target radio (Insert at cursor / Add to tray) with the user's remembered default pre-selected, a "change default for this one" link, customisation summary, **Confirm · Cancel**.
3. **Confirm** → optimistic insert. Writer Room's editor wraps the insert in a `data-staged="true"` span (Caveat font, ink-ochre left bracket). Toast: "Staged at cursor — first edit promotes to canon."
4. **Cancel** at any point → returns to detail view; nothing committed.
5. **First edit** to the staged span → strips `data-staged`, swaps to manuscript font. Logged as `acceptedSuggestion.commitedAt = ts`.
6. **Revert** (X on the staged block) → wipes the inserted text cleanly.

### B.7 Animation
- Cards fade + rise 8px on appear (200ms ease-out). Stagger 30ms per card up to 5.
- Detail slides in from the right edge of the drawer (260ms cubic-bezier(.2,.7,.3,1)).
- Wizard replaces detail in-place (cross-fade 180ms).
- All quiet: no springs, no bounces. The system whispers.

### B.8 Open questions for Code
- Confirm the editor exposes a stable cursor-position API for "Insert at cursor". If it's a contenteditable mess, this needs a wrapper.
- Confirm the editor can render and round-trip `<span data-staged="true">` and `<span class="staged-suggestion">` without stripping them on save. **Flag if not** — staged-state persistence depends on it.
- Confirm there's a way to programmatically scroll the editor to a chapter offset (for "Jump to mention").
- The brief proposes +15% snooze re-surface threshold. I treated it as a setting in `suggestionPrefs` — confirm.

### B.9 Decisions made
- **Drawer position**: right edge, full height. Detail = drawer-off-drawer (pushes left, doesn't replace). Rejected modal-detail and inline-accordion.
- **Marginalia treatment**: **handwritten until first edit, then becomes normal text.** Caveat font + ink-ochre + a left bracket while staged. First edit promotes silently. This was your "Decide for me" — went with what felt true to "Claude whispering in the margin."
- **Provenance**: **inline mini-chips, always rendered.** "🧍 Tom · 📖 ch.4 · 🎒 watch". Always visible because the brief says non-negotiable. No hover-to-reveal.
- **Boost**: visible on every card as a sparkle (✦) icon-button. Tooltip explains "1 premium call · deeper reasoning." Per your answer.

### B.10 Rejected approaches
- **Toasts for new suggestions** — interrupts flow.
- **Inline marginalia in the editor itself** (i.e., no drawer, just margin chips that expand) — clutters the writing surface; no room on narrow widths.
- **One unified "AI" panel** mixing extraction + suggestions + continuity — three different mental models, three different cadences.

---

## 4 · Margin Extraction (Layer 1) *(Tier 1)*
Artboard: **04 · Extraction · Layer 1**

### B.1 Why this design?
Continuous, ambient, free. Chips appear in the gutter as the writer types; one click adds to canon. Cheap because the free model handles it; ambient because it never interrupts; one-click because friction here loses entities to drift.

### B.2 State model
- **Reads**: current paragraph text (debounced 600ms after typing stops), known entity index.
- **Owns locally**: pending detection results per paragraph, dismissed-during-this-session set.
- **Writes**: `addEntity(kind, partial)` (opens minimal commit dialog: name + type + optional avatar) → on commit, dispatches to canonical store and clears the chip.
- **New slice**: `marginDetections: Record<ParagraphId, Detection[]>` — ephemeral, not persisted.

### B.3 Selection Bus
Read-only of `sel` for context (e.g., "saw new name 'Marlo' near Tom's POV"). Doesn't write to `sel`.

### B.4 Data flow
- After 600ms idle in a paragraph → free model called with the paragraph + 1 paragraph context + known-entity index.
- Returns `Detection[]`: `{ kind, surfaceText, suggestedName, confidence, position }`.
- Cache by paragraph hash; re-detect only when text changes.

### B.5 Edge cases
- **Empty paragraph**: nothing.
- **All detected entities already exist**: nothing rendered (don't crowd the gutter).
- **Error**: silently skip; retry on next idle. Never surface a "model failed" message at this layer — it's ambient.
- **Overflow** (>3 detections per paragraph): show first 2 + "+N" chip that expands.
- **Concurrent**: paragraph changes mid-detection → drop the in-flight result.

### B.6 Interaction sequencing
Click `+ Add` → minimal commit dialog opens inline near the chip. Pre-filled with the AI's best guess. Writer can edit, confirm. On confirm: optimistic add, chip dismisses, entity now exists in the relevant panel. **No multi-step wizard at Layer 1** — speed is the point.

### B.7 Animation
Chip fades in 150ms after detection. Fades out 200ms after commit/dismiss. No motion otherwise.

### B.8 Open questions for Code
- Need the editor to expose paragraph boundaries and per-paragraph stable IDs. **Flag if not.**
- Need a gutter render slot — doesn't exist in the current Writers Room layout. Likely a small layout change.

### B.9 Decisions made
- **Always-on by default**, with a Settings toggle to disable.
- **No noise threshold UI** — let the free model self-filter to confidence ≥ 0.6. Tunable later.

---

## 5 · Atlas v2
Artboard: **05 · Atlas v2**

### B.1 Why this design?
Three v1 editor features (click-to-add, drag-to-rename/move, region polygons) per the brief. Travel-line system on top. Real ↔ parchment basemap toggle. Multi-character intersections highlighted with a ring around *space-and-time* meeting points (NOT mere geometric crossings).

**Per your direction**: the editor splits cleanly across three input surfaces:
- **Right-click on map** → contextual creation menu (add place, draw region, draw road, drop label, measure, "set as Tom's ch.04 location", "suggest places nearby").
- **Left-click on map** → manipulate visuals (drag pin, drag polygon vertex, drag label, lasso-select, pan).
- **Edit pane below the map** → full property editor for the selected feature, no modal. Add/edit/remove properties inline.

This mirrors the skill tree editor (right-click canvas, edit pane below) so the two creators feel like one mental model.

### B.2 State model
- **Reads**: `sel.character`, `sel.multi`, `sel.chapter` (focus chapter), all places, all character `locationByChapter`, regions, basemap mode.
- **Owns locally**: pan/zoom, active tool (PIN/REGION/ROAD/LABEL/MEASURE/LASSO), polygon-drawing-in-progress, lasso selection set.
- **Writes**: `addPlace`, `movePlace`, `renamePlace`, `addRegion`, `updateRegion`, `addRoad`, `setAtlasMode`, `setPlaceChapterPresence(placeId, chapterId, on)`.
- **NEW schema**:
  - `Region: { id, poly: [[x,y]…], name, biome, color }` — confirm regions exist; if not, this is new.
  - `Atlas.basemapMode: 'real' | 'parchment'` — per-project setting.

### B.3 Selection Bus
Heavy reader. With `sel.character` set: solid-line path up to `sel.chapter`, dashed for prior. With `sel.multi` (2+ characters): each gets its own colour, ring at every chapter where they were at the same place at the same time.

### B.4 Data flow
Travel lines computed from `character.locationByChapter` × `places.byId.coords`. Pure derive — recompute on `sel` or `sel.chapter` change.

### B.5 Edge cases
- **Character with no `locationByChapter`**: render their pin only (if "current location" fallback exists), or nothing. Sidebar status: "No travel data yet."
- **Two characters with no overlap in space-and-time**: render both paths, no rings, sidebar shows "No crossings yet."
- **Polygon mid-draw, sel changes**: cancel the polygon (with confirm if 3+ points placed).
- **Right-click while a tool is active**: cancel the tool, then open the menu.
- **Locked**: pin badge in panel header.

### B.6 Interaction sequencing
- **Right-click anywhere on map** → context menu opens at cursor (entries vary by what's under the cursor: empty space vs over a pin vs over a polygon).
- **Click "Add place here"** → cursor enters PIN tool, next click drops a marker, edit pane below opens with the new place pre-selected.
- **Left-click on existing pin** → selects pin, edit pane below shows its properties.
- **Drag pin** → live preview, commit on release.
- **Right-click "Draw region"** → cursor enters polygon tool, click points, double-click or Enter to close, Esc cancels.
- **Edit pane below** → all edits commit on blur. "+ ADD PROPERTY" extends the editor with a custom field.

### B.7 Animation
Path drawing: stroke-dash-offset animates from end→start (300ms) when path changes. Subtle pulse on intersection rings (1500ms ease-in-out infinite) — these are important findings, deserve attention. Right-click menu fades in 120ms (snappy — utility).

### B.8 Open questions for Code
- Confirm `character.locationByChapter` shape — `Record<ChapterId, PlaceId>` per the brief. If flat `currentLocationId`, schema work needed.
- Confirm `UKMapVisualization` accepts custom overlay layers. If not, wrap it.
- Region polygons may need a separate canvas/SVG layer over the basemap — coordinate with existing impl.
- Browser-native `contextmenu` event needs `preventDefault()` so we can render our own menu instead of OS default.

### B.9 Decisions made
- **Basemap toggle**: real (UKMapVisualization) for contemporary, parchment (gradient + paper texture + contour lines) for fantasy. Toggle in panel header, per-project setting.
- **Path style**: solid up to `sel.chapter`, dashed before. Future locations not drawn (would spoil the writer's plot).
- **Intersection rings**: only space-and-time meetings. Geometric crossings ignored.
- **Right-click owns creation, left-click owns manipulation, edit pane below owns property editing** — three input modes, three jobs. No modals.

---

## 6 · Item Editor & Skill Tree Editor
Artboard: **06 · Creators**

### B.1 Why this design?
You explicitly asked for: stats on items that auto-update actor stats when equipped (RPG-style), and a real skill tree editor with parity to the item editor. Both surfaces share the same vocabulary: form left, **live preview right rail**, save actions in a footer. The skill editor adds a node-graph canvas with right-click-to-add and drag-to-link. Edit pane below the canvas mirrors the Atlas pattern.

### B.2 State model

**Item editor:**
- **Reads**: full vault, `sel.character` (for "Save & Equip"), the equipping actor's `baseStats` and currently-equipped items.
- **Owns locally**: form draft `{ name, slot, type, weight, rarity, statMods, grantedSkills, description }`.
- **Writes**: `vault.create(item)`, `vault.update(itemId, patch)`, `actor.equip(itemId)`.
- **NEW schema (FLAG IF MISSING)**:
  - `Item.statMods: Record<StatKey, number>` — e.g. `{ dexterity: +2, perception: -1 }`.
  - `Item.grantedSkills: SkillId[]` — skills active while equipped.
  - **Derived**: `Character.derivedStats[k] = baseStats[k] + Σ equippedItems[*].statMods[k]`. Compute in selector, never persist (it's derived).

**Skill tree editor:**
- **Reads**: full skill library, `sel.character` (for "applicable to" filtering).
- **Owns locally**: tree draft, selected node id, drag-link in-progress state.
- **Writes**: `skills.createTree`, `skills.addNode`, `skills.linkNodes`, `skills.deleteNode`, `skills.updateNode`.
- **NEW schema (FLAG IF MISSING)**:
  - `SkillNode.unlockReqs: { prereqIds: SkillId[]; minChapter?: number; minStat?: { key: StatKey, val: number } }`.
  - `SkillNode.effects: { stats?: Record<StatKey, number>; flags?: string[] }` — same modifier shape as items, so the equipped-stats math is consistent across both systems.

### B.3 Selection Bus
Both editors read `sel.character` for the contextual "Save & Equip" button and "applicable to" filtering. Neither writes to `sel`.

### B.4 Data flow
- Item editor right-rail re-derives `Character.derivedStats` on every keystroke in the StatMods section. Pure compute, no fetch.
- Skill editor canvas computes graph layout from `nodes` + `links`. On link-drag, optimistic add; on commit, dispatch `linkNodes`.

### B.5 Edge cases
- **No `sel.character`**: hide "Save & Equip"; show "Save to Vault" only.
- **Negative stat mod taking actor below 0**: clamp to 0 in display, show subtle warn pill "Would zero out · DEX".
- **Skill node prereq cycle**: detect on link-add, refuse, toast "Would create a cycle."
- **Locked panels**: N/A — creators are destinations, not viewers.

### B.6 Interaction sequencing
- Item: edit field → live preview updates → SAVE → optimistic add to vault, optional batch-equip.
- Skill: right-click canvas → context menu → pick action → cursor enters tool mode → click confirms placement. Esc cancels.
- Drag-to-link: mousedown on node → cursor draws temporary line to mouse → mouseup on another node commits link.

### B.7 Animation
Item rarity ring on preview only glows for `legendary+`. Skill node hover lifts 2px (transform: translateY) — affordance for "this is interactive."

### B.8 Open questions for Code
- Confirm `EnhancedItemVault` exposes a "rendered narrow" mode (~600px). My wrapper assumes yes; if not, a `width` prop pass-through is needed.
- Confirm `SkillTreeSystem` exposes `addNode`, `linkNodes`, `deleteNode` programmatically (the "ADD NODE" / "LINK" / "DELETE" actions assume yes).
- Stat key set: confirm the canonical `StatKey` enum. The artboard uses `strength | dexterity | perception | lore | resolve` as illustrative — replace with your real keys.
- Skill effect application: same selector pattern as item stat-mods? (i.e., `derivedStats` includes `Σ equippedItems[*].statMods + Σ activeSkills[*].effects.stats`). I assumed yes for consistency.

### B.9 Decisions made
- **Tab toggle, not separate panels**: Item and Skill editors share a panel via top toggle. Reduces left-rail clutter.
- **Live preview always visible**: 380px right rail, never collapses. The whole point of stat-mods is *seeing* the effect.
- **Stat math UI**: `[base bar] + [colored delta segment]` so positive/negative mods are visible as colored extensions on a single horizontal bar. Reads as "you start here, this item moves you to there."
- **Skill node tiers map to rarity colors** for cross-system consistency.

---

## 7 · Extraction Wizard (Layer 2)
Artboard: **04 · Extraction · Layer 2 (Wizard)**

### B.1 Why this design?
Deliberate, scoped to one chapter, on-demand. Four-step rail (SCAN · REVIEW · EDIT · COMMIT) so the writer always knows where they are. Findings grouped by entity type; pre-checks new entities, leaves known ones unchecked-but-editable. Free-model "deep-pass" flag is unobtrusive but visible — never auto-escalates.

### B.2 State model
- **Reads**: chapter text, full canonical store (to mark "KNOWN").
- **Owns locally**: `step: 1..4`, `findings: Finding[]`, `selected: Set<FindingId>`, edit overrides.
- **Writes**: on COMMIT, batch-dispatch `addEntity(...)` for each selected new finding + `updateEntity(...)` for each edited existing.
- **New slice**: `extractionRuns: Record<ChapterId, { ranAt, findings, deepPassRan }>` — so re-running shows what changed, not the whole list again.

### B.3 Selection Bus
Doesn't read or write `sel`. Wizard is a destination, not a follower.

### B.4 Data flow
- Step 1 (SCAN) → free model with chapter text + known-entity index. Returns `Finding[]`. Average ~3s.
- Step 2 (REVIEW) → render groups, pre-check new ones.
- Step 3 (EDIT) → per-finding inline edit (name, type, avatar, optional notes).
- Step 4 (COMMIT) → batch-dispatch, close wizard.

### B.5 Edge cases
- **Scan returns 0 findings**: skip directly to a "Nothing new — already canon" empty state with a "Run deep pass anyway?" link.
- **Loading (long scan)**: progress bar with "Reading ch.4 · finding entities…" + spinner.
- **Error**: inline retry. Don't drop user out of the wizard.
- **User cancels mid-edit**: confirm if any edits made. Otherwise close.

### B.6 Interaction sequencing
Linear stepper. Back button on every step except SCAN. SKIP button on every step always returns to chapter view without committing.

### B.7 Animation
Step transitions: 200ms cross-fade. The stepper rail fills in colour as steps complete — gives a sense of momentum without being chirpy.

### B.8 Open questions for Code
- Confirm chapters have stable IDs and a "save" event we can hook for the "Run Extract Pass on this chapter" button.
- Confirm batch-dispatch is safe (no race between adding a place and a relationship that references it). If not, sequence them.

### B.9 Decisions made
- **Wizard, not bulk-confirm-dialog**: the brief says "wizard." I considered a single confirm-all dialog but it loses per-entity edit affordance.
- **Pre-check new, leave known unchecked**: known entities are already canonical; checking them by default risks accidental overwrites.

---

## 8 · Continuity Checker · Knows ledger · Tangle matrix · Marginalia
Artboard: **07 · Systems**

### B.1 Why this design?
Four small surfaces grouped because they share the same paper-and-ink visual vocabulary and similar interaction model (card list, accept/snooze/dismiss).

- **Continuity Checker**: severity-coded findings, three actions per row (Accept / Snooze / Dismiss). Same action triad as Suggestions for muscle memory.
- **Knows ledger**: vertical type-tabs (KNOWS · HIDES · FEARS) + timeline-aware rows (when learned, from whom, who else knows).
- **Tangle matrix**: alternative to the graph view. 5×5 colour-coded grid of relationships. Click a cell → relationship detail.
- **Marginalia in manuscript**: handwritten Caveat ink + amber left bracket. First edit promotes to canon.

### B.2 State model
**Continuity:**
- New slice: `continuity: { findings: ContinuityFinding[], lastScanAt }`.
- Triggers: chapter save, manual "Re-scan."
**Knows ledger:**
- Reads `character.knows`, `character.hides`, `character.fears` (all `KnowledgeEntry[]` per Appendix B).
- Per-entry: `{ fact, learnedAtChapter, source, alsoKnownBy: CharacterId[] }`.
**Tangle matrix:**
- Reads `characters[*].relationships`.
- Owns: hover state, selected cell.
**Marginalia:**
- Editor span attribute: `data-staged="true"` with `data-suggestion-id`. Stripped on first edit (commit) or remove (revert).

### B.3 Selection Bus
- Continuity: filters to `sel.character` if set.
- Knows: requires `sel.character`. Empty state otherwise.
- Tangle matrix: highlights row+column for `sel.character`. With `sel.multi` of 2 → highlights the cell at their intersection.

### B.4 Data flow
- Continuity scan: chapter save → free model with manuscript + canon. Cache per chapter hash.
- Knows: pure derived render.
- Tangle: pure derived render.
- Marginalia: editor manages staged spans; suggestion engine writes them.

### B.5 Edge cases
- **Continuity: 0 findings**: "All consistent — last scanned 2m ago." Don't celebrate (it's the default state).
- **Knows: empty**: "What does Tom know? Add facts as you write, or run an Extract Pass on a chapter to populate."
- **Tangle matrix**: if a character has no relationships → row is all em-dashes. No empty cell weirdness.

### B.6 Interaction sequencing
- Continuity Accept → editor jumps to manuscript location, applies fix as a tracked-change span (similar to suggestion staging but distinct colour — red-ink). Writer accepts/rejects per usual editor flow.
- Tangle matrix cell click → opens relationship detail in a popover (NOT a new panel — too heavyweight).

### B.7 Animation
None special. Continuity findings fade in 200ms after scan completes.

### B.8 Open questions for Code
- Continuity needs to reference manuscript locations precisely. The brief mentions `ManuscriptRef[]`. Confirm this is `{ chapterId, paragraphId, charOffset }` or similar.
- Knows ledger: `KnowledgeEntry.learnedAt` and `.source` need to be on the model. **Flag if not.**

### B.9 Decisions made
- **Continuity placement**: **new panel**, accessible from the LeftRail panel stack. The brief said "Design's call." I leaned new because the action triad needs persistent space; folding into Threads or Tangle would crowd them.
- **Knows section is in the dossier, not its own panel**: it's per-character data, dossier is per-character — natural home.
- **Tangle matrix is an alternate view of Tangle**, not a replacement. Toggle in the Tangle header.

---

## 9 · Cross-cutting decisions

### Visual identity (deliberately preserved, not replaced)
I worked from your existing tokens. **Primary theme is now `day`** (light) — taken 1:1 from `THEMES.day` in `src/loomwright/theme.js`. The dark version (`night`) is preserved untouched and remains togglable via the existing `ThemeToggle`. Three additions, all named in `tokens.js` with `+new` comments:

- `T.sugg` (`#f6efd9`) — warmer paper tone for suggestion cards (distinct from canvas).
- `T.suggInk` (`#7a5d2a`) — ochre ink for marginalia.
- `T.hand` (Caveat) — handwritten font for staged suggestions.

These are additive. **Add them to both `THEMES.day` and `THEMES.night` in `src/loomwright/theme.js`** so the Suggestion engine can pick the right tone in either mode. Nothing existing is changed.

### Empty-state pattern
Every panel has three states: **empty** (literally no data), **awaiting** (data exists elsewhere but the panel is filtered to nothing — e.g., character with no inventory), **populated**. Empty states always offer ONE clear next action. Awaiting states always explain WHY (e.g., "Tom carries no items yet — add from the vault").

### Open question answers (from Appendix C)
1. **Atlas v1 editor**: agreed with your three (click-add / drag-move / region polygons).
2. **Mention syntax**: unified `@` (see §1.B.9).
3. **Snooze threshold**: kept at +15%, exposed as `suggestionPrefs.snoozeReSurfaceDelta`.
4. **Insertion default**: "Insert at cursor" if focus is in the editor; "Tray" otherwise. Remembered per user.
5. **Dossier section order**: kept yours.
6. **Mobile breakpoint**: 1100px, designed but not in this canvas (Tier 3).
7. **Continuity placement**: new panel.
8. **Dependency map placement**: from Tangle (it's structurally a graph operation).

### What I didn't touch
- `Settings.jsx` (your parallel work item — restoring the legacy panel).
- `PaperDoll`, `EnhancedInventoryDisplay`, `SkillTreeSystem`, `SkillTreeVisualizer`, `EnhancedItemVault`, `UKMapVisualization`, `AtlasAI`, `InlineWeaver`, `WritingAid`, `Proofreader` — all reused by reference, not redesigned.
- The night theme, amber/teal accents, Fraunces/Inter/JetBrains — kept exactly. Three additive tokens only.
- Routing, auth, AI plumbing.

---

## 10 · Suggested implementation order (matches the supplement's tier order)

| Tier | Item | Blocks |
| --- | --- | --- |
| 1 | Selection Bus refactor + pill + lock + mention | Everything |
| 1 | Dossier vertical sections | Dossier-dependent flows |
| 1 | Suggestion drawer + cards + detail + accept wizard | Marginalia |
| 1 | Margin extraction (Layer 1) | Nothing — ambient |
| 2 | Atlas v2 (paths, intersections, 3 editor features) | Map-dependent suggestions |
| 2 | Item & Skill creators (wrap existing) | Inventory completeness |
| 2 | Extraction Wizard (Layer 2) | Knows ledger population speed |
| 3 | Continuity Checker | — |
| 3 | Knows·Hides·Fears ledger | Mystery-genre flows |
| 3 | Timeline Scrubber (in dossier + atlas) | Time-aware Atlas paths |
| 3 | Dependency Map | Destructive-edit safety |
| 3 | Tangle relationship matrix | Big-cast clarity |
| 3 | Mobile breakpoint | Mobile users |
| 3 | `@`-mention micro-cards | Mention syntax already in Tier 1 |

---

## 11 · Where to find the visual spec

The single HTML file (`Loomwright Design Pass.html`) renders a pan-zoom design canvas. Each artboard has:

- A monospace **kicker** in the top-left identifying which Loomwright module it lives in.
- Yellow dashed **"↳ Hookup"** callouts pinned to specific elements with file paths and prop hints.
- **Section labels** above each artboard for at-a-glance browsing.

Pan with two-finger scroll, zoom with pinch / ctrl+scroll, click any artboard label to focus-mode it (←/→ to step through within a section, ↑/↓ across sections, Esc to exit).

If anything in this Code Insight Document conflicts with what's in the visual canvas, **the canvas wins** — I iterated on it last.

---

## 12 · Data shapes appendix (TypeScript-style)

> All `(NEW)` fields are additive. Existing fields not shown here are unchanged.
> Use these as the canonical source for prop types, slice shapes, and dispatch payloads.

### 12.1 Selection bus

```ts
type EntityKind = 'character' | 'place' | 'thread' | 'item' | 'chapter';
type EntityRef  = { kind: EntityKind; id: string };

// Single global slice — NOT duplicated per panel
interface SelectionState {
  character: string | null;
  place: string | null;
  thread: string | null;
  item: string | null;
  chapter: string | null;
  multi: EntityRef[];   // for multi-select stack; primary = most recently set
}

// (NEW) Per-panel lock state — separate slice from sel
type PanelId = 'dossier' | 'atlas' | 'tangle' | 'threads' | 'suggestions' | 'continuity' | 'knows' | 'inventory';
type LockMode = 'follow' | 'whole' | 'entity';
interface LockState  { mode: LockMode; pinnedTo?: EntityRef }
type   PanelLocks    = Record<PanelId, LockState>;

// Mention token (rendered inline by the editor)
interface MentionToken {
  syntax: '@';                     // unified — see §1.B.9
  qualifier?: 'loc' | 'item' | 'thread' | 'chapter';   // default = character
  id: string;
  surfaceText: string;             // raw text the user typed
}
```

### 12.2 Suggestions

```ts
// (NEW) all of this slice
type SuggestionType = 'item' | 'callback' | 'sensory' | 'tension' | 'pacing' | 'continuity-fix';
type Insertion      = 'cursor' | 'tray';

interface Suggestion {
  id: string;
  type: SuggestionType;
  scope: EntityRef | null;         // null = whole-book mode
  title: string;
  preview: string;
  body: string;                    // full text inserted on accept
  relevance: number;               // 0..100
  boosted: boolean;
  provenance: ProvenanceChip[];    // ALWAYS present — non-negotiable
  customisation?: SuggestionCustomisation;
  createdAt: number;
}

interface ProvenanceChip { kind: EntityKind | 'voice' | 'rule'; label: string; ref?: EntityRef }
interface SuggestionCustomisation { length: 'beat' | 'paragraph' | 'scene'; tone?: string; refs?: EntityRef[] }

interface SuggestionsSlice {
  open: Suggestion[];
  snoozed: Array<Suggestion & { snoozedAtRelevance: number }>;
  dismissed: Suggestion[];
  accepted: Array<Suggestion & { commitedAt?: number; manuscriptRef?: ManuscriptRef }>;
}

interface SuggestionPrefs {
  defaultInsertion: Insertion;
  snoozeReSurfaceDelta: number;    // default 15 (percent points)
  marginaliaTreatment: 'caveat' | 'italic' | 'bracket-only';   // staged-text style
}

interface PendingInsertion {
  suggestionId: string;
  body: string;
  createdAt: number;
}
type PendingInsertions = PendingInsertion[];   // the tray
```

### 12.3 Margin extraction (Layer 1)

```ts
// (NEW) ephemeral slice — not persisted
type DetectionKind = 'character' | 'place' | 'item' | 'thread';
interface Detection {
  kind: DetectionKind;
  surfaceText: string;
  suggestedName: string;
  confidence: number;              // 0..1, free-model self-filter ≥ 0.6
  position: { paragraphId: string; charOffset: number };
}
type MarginDetections = Record<string /*paragraphId*/, Detection[]>;
```

### 12.4 Extraction wizard (Layer 2)

```ts
// (NEW) slice
type FindingStatus = 'new' | 'known' | 'edited';
interface Finding {
  id: string;
  kind: DetectionKind | 'relationship' | 'fact';
  status: FindingStatus;
  draft: Partial<Character | Place | Item | Thread | KnowledgeEntry | Relationship>;
  resolvesTo?: string;             // existing entity id when status = 'known'
}

interface ExtractionRun {
  ranAt: number;
  findings: Finding[];
  deepPassRan: boolean;
}
type ExtractionRuns = Record<string /*chapterId*/, ExtractionRun>;
```

### 12.5 Atlas v2

```ts
// Existing — confirm shape
interface Place {
  id: string; name: string; type: string;
  coords: { x: number; y: number };
  chapterIds: string[];            // chapters where this place appears
  notes?: string;
  population?: number;
}

// (NEW) — confirm if regions exist
interface Region {
  id: string;
  name: string;
  poly: Array<[number, number]>;
  biome: string;
  color: string;
}

// (NEW) per-project setting
interface AtlasSettings {
  basemapMode: 'real' | 'parchment';
}

// Required on Character — FLAG IF MISSING
interface CharacterAtlasShape {
  locationByChapter: Record<string /*chapterId*/, string /*placeId*/>;
}

type AtlasTool = 'pin' | 'region' | 'road' | 'label' | 'measure' | 'lasso';
```

### 12.6 Items & skills (RPG math)

```ts
// (NEW) — confirm StatKey enum lives somewhere central
type StatKey = 'strength' | 'dexterity' | 'perception' | 'lore' | 'resolve';
//             ^^^^^^^^^ illustrative — replace with your real keys

interface Item {
  id: string;
  name: string;
  slot: string;                    // 'pocket-l', 'head', 'main-hand', etc.
  type: string;
  weight: number;                  // kg
  rarity: 'common' | 'magic' | 'rare' | 'legendary' | 'unique' | 'mythic';
  description: string;

  // (NEW) — RPG math
  statMods?: Partial<Record<StatKey, number>>;     // applied while equipped
  grantedSkills?: string[];                        // skill ids active while equipped
  setId?: string;                                  // for set bonuses
}

interface SkillNode {
  id: string;
  name: string;
  tier: 'novice' | 'adept' | 'master' | 'unique';
  position: { x: number; y: number };
  description: string;

  // (NEW)
  unlockReqs: {
    prereqIds: string[];
    minChapter?: number;
    minStat?: { key: StatKey; val: number };
  };
  effects: {
    stats?: Partial<Record<StatKey, number>>;      // SAME shape as Item.statMods
    flags?: string[];                              // e.g. 'comprehend.bargemen'
  };
}

interface SkillLink { from: string; to: string }
interface SkillTree { id: string; name: string; nodes: SkillNode[]; links: SkillLink[] }

// DERIVED — never persist
function deriveStats(c: Character): Record<StatKey, number> {
  const out = { ...c.baseStats };
  for (const itemId of c.equipped) {
    const it = vault[itemId];
    for (const k in it.statMods ?? {}) out[k as StatKey] += it.statMods![k as StatKey]!;
  }
  for (const sId of c.activeSkills) {
    const s = skillsById[sId];
    for (const k in s.effects.stats ?? {}) out[k as StatKey] += s.effects.stats![k as StatKey]!;
  }
  return out;
}
```

### 12.7 Knows ledger / continuity / marginalia

```ts
// Existing-ish — confirm fields marked (NEW)
interface KnowledgeEntry {
  id: string;
  fact: string;
  kind: 'knows' | 'hides' | 'fears';

  // (NEW) — needed for time-aware ledger
  learnedAtChapter: string;
  source: 'witnessed' | 'told' | 'inferred' | 'born-knowing';
  sourceCharacterId?: string;
  alsoKnownBy?: string[];          // other character ids
}

// (NEW) — continuity slice
interface ManuscriptRef {
  chapterId: string;
  paragraphId: string;
  charOffset?: number;
}
interface ContinuityFinding {
  id: string;
  severity: 'info' | 'warn' | 'error';
  description: string;
  manuscriptLocations: ManuscriptRef[];
  suggestedFix?: string;
}
interface ContinuitySlice {
  findings: ContinuityFinding[];
  lastScanAt: number | null;
}

// Marginalia — editor-only spans, not a slice
// <span data-staged="true" data-suggestion-id="..."> ... </span>
// Stripped on first edit (commit) or remove (revert). Round-tripping these
// attributes through the editor's serialiser is REQUIRED — see §3.B.8.
```

### 12.8 Dispatch / event reference

```ts
// Selection
clearSelection();
setSelection(ref: EntityRef);
addToMulti(ref: EntityRef);
removeFromMulti(ref: EntityRef);
setPanelLock(panelId: PanelId, lock: LockState);

// Suggestions
regenerateSuggestions(scope: EntityRef | null);
acceptSuggestion(id: string, opts: { insertion: Insertion });
boostSuggestion(id: string);          // PREMIUM call — only on explicit click
snoozeSuggestion(id: string);
dismissSuggestion(id: string);

// Atlas
addPlace(p: Omit<Place, 'id'>);
movePlace(id: string, coords: { x: number; y: number });
renamePlace(id: string, name: string);
addRegion(r: Omit<Region, 'id'>);
updateRegion(id: string, patch: Partial<Region>);
setPlaceChapterPresence(placeId: string, chapterId: string, present: boolean);
setAtlasMode(m: 'real' | 'parchment');

// Items / skills
vault.create(item: Omit<Item, 'id'>);
vault.update(id: string, patch: Partial<Item>);
actor.equip(itemId: string);
actor.unequip(itemId: string);
skills.createTree(t: Omit<SkillTree, 'id'>);
skills.addNode(treeId: string, node: Omit<SkillNode, 'id'>);
skills.linkNodes(treeId: string, link: SkillLink);
skills.deleteNode(treeId: string, nodeId: string);
skills.updateNode(treeId: string, nodeId: string, patch: Partial<SkillNode>);

// Extraction
runExtractPass(chapterId: string, deep?: boolean);
commitExtraction(chapterId: string, selectedFindingIds: string[]);

// Continuity
runContinuityScan(chapterId?: string);
acceptContinuityFix(findingId: string);
dismissContinuityFinding(findingId: string);
```

---

## 13 · Component-touchpoint summary

Quick map: every existing component in the repo and what (if anything) this design pass asks of it. **Wrap, don't replace.**

| Existing component | Path | Touch type | What changes |
| --- | --- | --- | --- |
| `LoomwrightShell` | `src/loomwright/LoomwrightShell.jsx` | Wrap | Mount selection pill in header; add panel-lock chip per panel slot |
| `Dossier` | `src/loomwright/dossier/Dossier.jsx` | Refactor in place | Replace tab scroller with `<Section>`s. Sections use existing inner components. |
| `PaperDoll` | `src/loomwright/wardrobe/PaperDoll.jsx` | Reuse | Embedded in Dossier · Inventory section. Confirm narrow render mode. |
| `EnhancedInventoryDisplay` | `src/loomwright/wardrobe/` | Reuse | Embedded in Dossier · Inventory section, right of PaperDoll. |
| `EnhancedItemVault` | `src/loomwright/wardrobe/` | Wrap | Wrap in Item Editor shell with stat-mods + skills. Confirm `width` prop. |
| `ItemEditor` (existing) | `src/loomwright/wardrobe/ItemEditor.jsx` | Extend | Add stat-mods section, granted-skills section, live actor-stat preview. |
| `SkillTreeSystem` | `src/loomwright/skills/` | Wrap | Skill Tree Editor canvas wraps it; needs programmatic add/link/delete. |
| `SkillTreeVisualizer` | `src/loomwright/skills/` | Reuse | Embedded in Dossier · Skills section (read-only). |
| `UKMapVisualization` | `src/loomwright/atlas/` | Wrap | Atlas v2 wraps for `real` basemap mode. May need overlay-layer prop. |
| `AtlasAI` | `src/loomwright/atlas/AtlasAI.jsx` | Wrap | Atlas v2 wraps; right-click + edit-pane-below are new chrome around it. |
| `InlineWeaver` / writers-room editor | `src/loomwright/writers-room/` | Extend | Add gutter slot; render `@`-mention tokens; round-trip `data-staged` spans. |
| `WritingAid` / `Proofreader` | `src/loomwright/writers-room/` | Reuse | No changes. Continuity Checker is a sibling, not a replacement. |
| `WeaverSuggestionsBar` | `src/loomwright/weaver/` | Reuse | Distinct from Suggestion drawer (Canon Weaver vs Claude). Both coexist. |
| `theme.js` (Loomwright) | `src/loomwright/theme.js` | Extend | Add `sugg`, `suggInk`, `hand` to BOTH `THEMES.day` and `THEMES.night`. |
| `theme.css` (Grimguff) | `src/styles/theme.css` | Reuse | Rarity colours, animations. No changes. |
| Primitives (`Panel`, `Button`, `Chip`, `Icon`, `Scrubber`) | `src/loomwright/primitives/` | Reuse | All shells use these. No changes. |

**New components to create (all flagged with `(NEW)` above):**
- `src/loomwright/state/sel.js` — global selection slice
- `src/loomwright/state/panelLocks.js` — per-panel lock slice
- `src/loomwright/suggestions/` — `SuggestionDrawer`, `SuggestionCard`, `AcceptWizard`, slice
- `src/loomwright/extraction/` — `MarginChip`, `marginAI.js`, `ExtractionWizard`, `extractionAI.js`, slices
- `src/loomwright/continuity/` — `ContinuityPanel`, slice
- `src/loomwright/tangle/RelationshipMatrix.jsx` — alternate Tangle view

---

— End —

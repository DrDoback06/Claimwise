# Loomwright

Loomwright is the standalone Story Studio app — an AI-assisted writing,
tracking and world-building environment.

It supersedes the earlier Claimwise prototype: every useful capability
from that prototype has been absorbed into a single coherent Loomwright
surface. There is no Claimwise UI in this project.

## Information architecture

The app has five verb-based nav groups:

- **Today** — Morning Brief + Daily Spark feed.
- **Write** — `WritingCanvasPro` editor (centre) + Canon Weaver rail (right).
  Toolbar drawers for Story Analysis (consistency + structural), Language
  Workbench (grammar / rewrite / readability), Interview Mode (character
  dialogue), Speed Reader, and manuscript import.
- **Track** — `Cast` list → per-character detail with Profile / Arc /
  Progression / Timeline / Relationships / Voice / Dialogue / Plot /
  Wardrobe / Stats / Skills tabs. Plus Items Library, Skills Library,
  Stats Library and Voice Studio.
- **Explore** — Atlas (regional map, floorplans, places), World
  (wiki / lore / factions / mind map), Plot & Timeline (beats,
  threads & quests, chronological timeline, narrative graph).
- **Settings** — Keys & AI providers, Data & history (backup / sync /
  version control), Preferences, Story Setup (re-run the wizard).

## Stack

Same as the original prototype so there is no migration risk:
Create React App + Tailwind + IndexedDB (`loomwright/theme` on top).

## Local development

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

The output in `build/` is a static PWA bundle suitable for Netlify, Vercel
or any static host. `netlify.toml` is already configured.

## Onboarding

On first launch a Loomwright-chromed onboarding wizard collects your
story premise, characters, world rules, plot beats, style preferences
and AI provider keys. Its output is written straight into the shared
IndexedDB stores that every Loomwright surface reads from, so Today /
Cast / Atlas / World / Plot & Timeline all populate the moment the
wizard finishes.

## Data storage

All user data lives client-side in IndexedDB (database name
`ClaimwiseOmniscience`, kept for backward compatibility with existing
installs). Nothing is sent anywhere unless you configure cloud sync
or an AI provider key in Settings.

# Loomwright — Integrated Writers Room

This folder is the Loomwright design wired to the Claimwise service backend.
It's a static app — serve the folder and it runs. No build step.

## Quick start

    cd redesign/writers-room
    python3 -m http.server 8000
    # open http://localhost:8000

## Netlify

A `netlify.toml` at the repo root is already configured to publish this
folder as the site. Point Netlify at the `loomwright-integration` branch
and it will deploy automatically.

## What's here

- `index.html` — entry
- `claimwise-services.bundle.js` — 48-service backend bundle on `window.CW`
- `vendor/` — local React 18.3.1, ReactDOM, Babel Standalone 7.29.0
- `*.jsx` — the UI (Babel transforms at runtime)
- `bundle/` — source for rebuilding the services bundle
- `build-bundle.sh` — rebuild script

See `SHIP-NOTES.md` for the full test report and `HANDOFF.md` for
architecture docs.

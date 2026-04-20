/**
 * Prebuild service-worker cache-bust.
 *
 * Rewrites public/service-worker.js so CACHE_NAME + RUNTIME_CACHE include a
 * fresh build token on every production build. This guarantees that a user
 * loading the new deploy invalidates every previously-cached shell + asset.
 *
 * Token precedence:
 *   1. env NETLIFY_BUILD_ID         (Netlify sets this per build)
 *   2. env COMMIT_REF / GITHUB_SHA  (first 7 chars)
 *   3. ISO timestamp
 */

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'service-worker.js');

function token() {
  if (process.env.NETLIFY_BUILD_ID) return process.env.NETLIFY_BUILD_ID.slice(0, 12);
  const sha = process.env.COMMIT_REF || process.env.GITHUB_SHA;
  if (sha) return sha.slice(0, 7);
  return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
}

function run() {
  const src = fs.readFileSync(swPath, 'utf8');
  const stamp = token();
  const next = src
    .replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = 'loomwright-shell-${stamp}';`)
    .replace(/const RUNTIME_CACHE = '[^']+';/, `const RUNTIME_CACHE = 'loomwright-runtime-${stamp}';`);
  if (next === src) {
    console.warn('[prebuild-sw] No CACHE_NAME / RUNTIME_CACHE replacements applied — check service-worker.js');
    return;
  }
  fs.writeFileSync(swPath, next);
  console.log(`[prebuild-sw] Stamped service worker with token "${stamp}"`);
}

run();

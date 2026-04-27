#!/usr/bin/env bash
# Rebuilds claimwise-services.bundle.js from the legacy src/services/* tree.
# Run from the repo root. Requires: node, npm, esbuild.
set -e
ROOT=$(pwd)
WORK=$(mktemp -d)
trap "rm -rf $WORK" EXIT
mkdir -p "$WORK/src"
cp -r src/services "$WORK/src/"
cp -r src/data "$WORK/src/"
cp -r services "$WORK/"
cp redesign/writers-room/bundle/entry.js "$WORK/src/entry.js"
cp redesign/writers-room/bundle/offlineAIService-shim.js "$WORK/src/services/offlineAIService-shim.js"
cd "$WORK"
npm init -y > /dev/null
npm install --silent esbuild
./node_modules/.bin/esbuild src/entry.js \
  --bundle --format=iife --global-name=CW_MODULE \
  --target=es2019 --platform=browser \
  --alias:@xenova/transformers=./src/services/offlineAIService-shim.js \
  --loader:.js=jsx --jsx=automatic \
  --define:process.env.NODE_ENV='"production"' \
  --define:process.env.REACT_APP_GEMINI_API_KEY='""' \
  --define:process.env.REACT_APP_OPENAI_API_KEY='""' \
  --define:process.env.REACT_APP_ANTHROPIC_API_KEY='""' \
  --define:process.env.REACT_APP_GROQ_API_KEY='""' \
  --define:process.env.REACT_APP_HUGGINGFACE_API_KEY='""' \
  --external:jszip \
  --outfile="$ROOT/redesign/writers-room/claimwise-services.bundle.js"
cd "$ROOT"
echo "Bundle rebuilt at redesign/writers-room/claimwise-services.bundle.js"

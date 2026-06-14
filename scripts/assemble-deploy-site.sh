#!/usr/bin/env bash
set -euo pipefail

# Assembles _site/ for Cloudflare Pages: demo + version-pinned widget bundle.
# Usage: scripts/assemble-deploy-site.sh [v0.3.0]

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION_DIR="${1:-v$(node -p "require('./package.json').version")}"

if [ ! -f dist/rsvp-reader.iife.js ]; then
  echo "Run npm run build first." >&2
  exit 1
fi

rm -rf _site
mkdir -p "_site/${VERSION_DIR}" _site/fonts

cp -r demo/* _site/
cp dist/rsvp-reader.iife.js _site/rsvp-reader.iife.js
cp dist/rsvp-reader.iife.js "_site/${VERSION_DIR}/rsvp-reader.iife.js"

if [ -f dist/rsvp-reader.iife.js.map ]; then
  cp dist/rsvp-reader.iife.js.map "_site/${VERSION_DIR}/rsvp-reader.iife.js.map"
fi

cp -r public/fonts/* _site/fonts/
cp cdn/_headers _site/_headers

echo "Assembled _site (${VERSION_DIR}/rsvp-reader.iife.js)"

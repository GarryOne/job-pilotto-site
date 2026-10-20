#!/usr/bin/env bash
# Keeps the old layout readable inside a joined tree: site/src/<file> and site/public point at the new folders (admin/, api/, shared/, worker/, web/public).
# The public repo's tests still name `site/src/x.js`; this lets them run unchanged until the public repo names the new paths.
# Used by tools/overlay.sh and tools/tree.sh. Usage: tools/legacy-paths.sh <tree>. Never run in this repo's own checkout (it writes site/src and site/public).
set -euo pipefail
tree="${1:?usage: tools/legacy-paths.sh <tree>}"
cd "$tree/site"
mkdir -p src
for group in admin api shared worker; do
  for entry in "$group"/*; do
    case "$entry" in *.js|*/payments) ln -sfn "../$entry" "src/$(basename "$entry")";; esac
  done
done
[ -e public ] || ln -sfn web/public public

#!/usr/bin/env bash
# Runs a command inside the overlaid tree (public main + this repo's files), for the tools that read the site's admin code: tools/site-run.sh node tools/needs-fix-causes.mjs
# The overlay is rebuilt when older than an hour; set SITE_OVERLAY_FRESH=1 to rebuild now.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tree="$here/.overlay"
if [ ! -d "$tree" ] || [ -n "${SITE_OVERLAY_FRESH:-}" ] || [ -n "$(find "$tree" -maxdepth 0 -mmin +60 2>/dev/null)" ]; then
  "$here/tools/overlay.sh" "$tree" >&2
  [ -d "$tree/site" ] && (cd "$tree/site" && npm ci --silent >&2)
fi
cd "$tree"
exec "$@"

#!/usr/bin/env bash
# Prints "changed" when the public files a deploy bundles or builds from differ from the last deploy's record (.public-<name>), else "same".
# Usage: tools/public-watch.sh <tree> <name> <path>...   (the tree is the overlay; the record is committed by the watch workflow)
set -euo pipefail
tree="$1"; name="$2"; shift 2
now="$(git -C "$tree" ls-tree -r HEAD -- "$@" | sha256sum | cut -c1-16)"
record="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.public-$name"
[ "$(cat "$record" 2>/dev/null || true)" = "$now" ] && echo same || { echo "$now" > "$record"; echo changed; }

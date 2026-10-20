#!/usr/bin/env bash
# Runs, inside the joined tree, (1) the public repo's tests that read site files (they skip in the public repo, where site/ is absent) and (2) the tests that live in this repo.
# A public test joins by using tests/site_private.py (python) or desktop/test/site-private.js (node); three node files that read site/ without it are named below.
# Usage: tools/site-guards.sh <tree> [<this-repo-dir>]
set -euo pipefail
tree="${1:-.}"; priv="${2:-$tree}"
priv="$(cd "$priv" && pwd)"
cd "$tree"
status=0
python_files="$( { grep -l "needs_site" tests/*.py | grep -v site_private.py; (cd "$priv" && ls tests/test_*.py 2>/dev/null); } | sort -u)"
for file in $python_files; do
  python3 -m unittest discover -s tests -p "$(basename "$file")" || status=1
done
cd desktop
[ -d node_modules ] || ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci --silent
node scripts/stage.mjs >/dev/null
node_files="$( { grep -l "site-private.js" test/*.test.js | grep -v '^test/site-private'; (cd "$priv/desktop" && ls test/*.test.js 2>/dev/null); echo test/plan.test.js; echo test/no-credit-words.test.js; echo test/no-question-mark.test.js; echo test/cost-labels.test.js; } | sort -u | tr '\n' ' ')"
# shellcheck disable=SC2086
node --test $node_files || status=1
exit $status

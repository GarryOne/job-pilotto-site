#!/usr/bin/env bash
# The product-media run's last step (.github/workflows/product-media.yml): copies a fresh media set over the files site/web/public/media already holds
# (the site picks which pieces it shows; a new piece is listed, never added), records the public screens it was made from (.public-media), commits
# on the branch media-refresh and opens or updates its PR for the owner. Guarded by tests/test_media_refresh.py.
# Usage, from this repo's root: tools/media-refresh.sh <media set> <public tree> <public sha> [--no-push]
set -euo pipefail
set_dir="$1"; tree="$2"; sha="$3"; push=yes
[ "${4:-}" = --no-push ] && push=no
dest=site/web/public/media
[ -f "$set_dir/manifest.json" ] || { echo "media-refresh: $set_dir has no manifest.json: not a media set"; exit 1; }
updated=(); missing=()
for file in "$dest"/*; do
  name="$(basename "$file")"
  if [ -f "$set_dir/$name" ]; then cp "$set_dir/$name" "$file"; updated+=("$name"); else missing+=("$name"); fi
done
extra=()
for file in "$set_dir"/*; do
  name="$(basename "$file")"
  [ -e "$dest/$name" ] || [ "$name" = manifest.json ] || extra+=("$name")
done
tools/public-watch.sh "$tree" media $(cat tools/media-paths.txt) >/dev/null
echo "media-refresh: ${#updated[@]} refreshed: ${updated[*]:-none}"
[ ${#missing[@]} -eq 0 ] || echo "media-refresh: the site shows files this set did not make (kept as they were): ${missing[*]}"
[ ${#extra[@]} -eq 0 ] || echo "media-refresh: made but not on the site (add one by hand to show it): ${extra[*]}"
git checkout -q -B media-refresh
git add "$dest"
[ ! -f .public-media ] || git add .public-media
if git diff --cached --quiet; then echo "media-refresh: nothing changed"; exit 0; fi
git -c user.name=product-media -c user.email=product-media@users.noreply.github.com commit -q -m "Refresh the site's media from public ${sha:0:9}"
[ "$push" = yes ] || { echo "media-refresh: committed on media-refresh (no push)"; exit 0; }
git push -q -f origin media-refresh
body="🎬 The site's screenshots and videos, re-recorded from public ${sha:0:9} (the app's screens changed).

- Refreshed: ${updated[*]:-none}
- Made but not on the site: ${extra[*]:-none}
- Look first: the run's artifact \`product-media\` (${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-GarryOne/job-pilotto-site}/actions/runs/${GITHUB_RUN_ID:-0})

🤖 Made by .github/workflows/product-media.yml"
if [ -n "$(gh pr list --head media-refresh --state open --json number --jq '.[0].number')" ]; then
  echo "media-refresh: the open refresh PR now holds this set"
elif ! gh pr create --head media-refresh --base main --title "Refresh the site's media (screens changed)" --body "$body"; then
  echo "media-refresh: GitHub refused the PR (Settings → Actions → 'Allow GitHub Actions to create pull requests' is off?)."
  echo "media-refresh: the set is on branch media-refresh: ${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-GarryOne/job-pilotto-site}/compare/main...media-refresh"
  exit 1
fi

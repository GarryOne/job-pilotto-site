#!/usr/bin/env bash
# Redo or improve the landing hero's four clips from a worktree, with its local edits (owner, 24 Oct 2026: "a repeatable way to redo/improve this hero
# video ... the feedback mechanism permanently available"). Skill: .claude/skills/redo-site-hero-video. Guard: test/web/hero-redo.test.js.
#   tools/hero.sh [pieces...]          record (default: all four), contact sheets, the in-hero side-by-side (today's live hero | this one), opened
#   tools/hero.sh --place <set dir>    copy a set's hero files into web/public/media (after the owner's yes), with their sizes
#   tools/hero.sh --preview [set dir]  only the side-by-side (no set: the files already in web/public/media)
# Pieces: hero-onboarding (Set up), hero (Find), hero-fill (Apply), hero-track (Track); their steps are media/scenes.mjs. Demo data only, no AI,
# a hidden window: nothing of the owner's app. Sets go to ~/.cache/jobadabra-media/hero-<time>. tools/media.sh (origin/main) keeps them fresh later.
set -euo pipefail
trap 'echo "hero: FAILED at line $LINENO (see the lines above)" >&2' ERR
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$here"
cache="$HOME/.cache/jobadabra-media"; mkdir -p "$cache"
HERO=(hero-onboarding hero hero-fill hero-track)

if [ "${1:-}" = --place ]; then
  set_dir="${2:?--place needs a set dir}"
  for piece in "${HERO[@]}"; do
    for file in "$set_dir/$piece".{mp4,webm} "$set_dir/$piece"-poster.jpg "$set_dir/$piece"-720.mp4 "$set_dir/$piece"-720-poster.jpg; do
      [ -f "$file" ] && cp "$file" web/public/media/
    done
  done
  ls -l web/public/media/hero* | awk '{printf "hero: %-32s %5.0f KB\n", $9, $5/1024}'
  echo "hero: placed. Next: the site tests (tools/site-run.sh node --test \"test/**/*.test.js\"), then ship."
  exit 0
fi

# the joined tree with this worktree's edits (built once, then only the folders the hero touches are synced)
[ -d .overlay/.git ] || tools/overlay.sh .overlay >&2
rsync -a media/ .overlay/media/ && rsync -a web/ .overlay/web/ && rsync -a tools/ .overlay/tools/
for dir in desktop desktop/e2e; do   # packages, cached by lock file as tools/media.sh does
  [ -d ".overlay/$dir/node_modules" ] && continue
  key="$(shasum -a 256 ".overlay/$dir/package-lock.json" | cut -c1-16)"; store="$cache/modules-$(echo "$dir" | tr / -)-$key"
  if [ -d "$store" ]; then cp -cR "$store" ".overlay/$dir/node_modules"; else (cd ".overlay/$dir" && npm ci >/dev/null) && cp -cR ".overlay/$dir/node_modules" "$store"; fi
done

if [ "${1:-}" = --preview ]; then
  out="${2:-$cache/hero-preview-$(date +%Y%m%d-%H%M%S)}"; mkdir -p "$out"
  node tools/hero-preview.mjs --out "$out/preview.png" ${2:+--media "$2"}
  open "$out/preview.png" 2>/dev/null || true
  exit 0
fi

pieces=("$@"); [ ${#pieces[@]} -gt 0 ] || pieces=("${HERO[@]}")
set_dir="$cache/hero-$(date +%Y%m%d-%H%M%S)"; mkdir -p "$set_dir/sheets"
echo "hero: recording ${pieces[*]} into $set_dir"
lock="${MEDIA_HEAVY_LOCK:-$HOME/job-pilotto/tools/heavy-lock.sh}"
record=(node ../media/media.mjs "${pieces[@]}" --out "$set_dir" --keep)
if [ -f "$lock" ]; then (cd .overlay/desktop && bash "$lock" product-media "${record[@]}"); else (cd .overlay/desktop && "${record[@]}"); fi

# contact sheets: 8 frames per clip, desktop and phone, to read before the preview
for piece in "${pieces[@]}"; do
  for clip in "$piece" "$piece-720"; do
    [ -f "$set_dir/$clip.mp4" ] || continue
    length="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$set_dir/$clip.mp4")"
    ffmpeg -v error -y -i "$set_dir/$clip.mp4" -vf "fps=8/$length,scale=600:-1,tile=4x2" -frames:v 1 "$set_dir/sheets/$clip.png"
    printf "hero: %s %.1f s, sheet %s\n" "$clip" "$length" "$set_dir/sheets/$clip.png"
  done
done

# the in-hero side-by-side: other pieces come from web/public/media, so a partial set still shows the whole stage
node tools/hero-preview.mjs --media "$set_dir" --out "$set_dir/preview.png"
open "$set_dir/preview.png" 2>/dev/null || true
echo "hero: DONE $set_dir (on the owner's yes: tools/hero.sh --place $set_dir)"

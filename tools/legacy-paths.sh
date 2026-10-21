#!/usr/bin/env bash
# Keeps the old layout readable inside a joined tree: site/<old folder> and site/src/<file> are links to the top-level folders (web/, admin/, api/, shared/, workers/www, db/migrations, test/).
# The public repo's tests and tools still name `site/src/x.js`, `site/test` and `site/package.json`; this lets them run unchanged until the public repo names the new paths (21 Oct 2026 layout move).
# Used by tools/overlay.sh and tools/tree.sh. Usage: tools/legacy-paths.sh <tree>. Never run in this repo's own checkout (it writes site/, site-next/ and desktop/scripts/media).
set -euo pipefail
tree="${1:?usage: tools/legacy-paths.sh <tree>}"
cd "$tree"
mkdir -p site/src site/scripts site/worker desktop/scripts
for group in admin api shared; do
  for entry in "$group"/*; do
    case "$entry" in *.js|*/payments) ln -sfn "../../$entry" "site/src/$(basename "$entry")";; esac
  done
done
for f in workers/www/*.js; do ln -sfn "../../$f" "site/src/$(basename "$f")"; ln -sfn "../../$f" "site/worker/$(basename "$f")"; done
# site/web/public and site-next/public are real folders of links, one per entry: git lists each link as a file, so the public cost-labels test still finds pages under site/web/public/ (a link to the folder would list as one file)
mkdir -p site/web/public site-next/public
for e in web/public/*; do ln -sfn "../../../$e" "site/web/public/$(basename "$e")"; done
for e in preview/public/*; do ln -sfn "../../$e" "site-next/public/$(basename "$e")"; done
ln -sfn web/public site/public
ln -sfn ../admin site/admin;                  ln -sfn ../api site/api;  ln -sfn ../shared site/shared
ln -sfn ../db/migrations site/migrations;     ln -sfn ../test site/test
ln -sfn ../workers/hosted-runner site/hosted-runner; ln -sfn ../workers/ready-runner site/ready-runner
ln -sfn ../workers/www/wrangler.toml site/wrangler.toml
ln -sfn ../web/demo site/demo
ln -sfn ../../tools/gen-ladder-data.mjs site/scripts/gen-ladder-data.mjs
ln -sfn ../../media desktop/scripts/media
# the public tools/check.py runs the site tests as `npm test` in site/
printf '{\n  "name": "job-pilotto-site",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "test": "node --test \\"../test/**/*.test.js\\""\n  }\n}\n' > site/package.json
printf '{\n  "name": "job-pilotto-site",\n  "lockfileVersion": 3,\n  "requires": true,\n  "packages": {\n    "": {\n      "name": "job-pilotto-site"\n    }\n  }\n}\n' > site/package-lock.json

# job-pilotto-site: notes for Claude

The website, `/admin` and the scheduled jobs that feed them: **private**, split out of the public `GarryOne/job-pilotto` on 20 Oct 2026 (owner: "leave open-source rather less than more").
Read [README.md](README.md) first, then the public repo's `docs/rules/private-site.md` (`~/job-pilotto`, or `gh repo view GarryOne/job-pilotto`).

## The one rule
**Private reads public, public never reads private.** This repo only runs laid over a checkout of the public repo (the site imports shared validators from `extension/`, `desktop/lib/`, `worker/src/`, `config/`).
Nothing here may be needed by a public file, test or workflow. Never copy a private file into the public repo.

## How to work
- **Where a file goes** (`web/README.md`): `web/` public pages, `admin/` the owner's pages and the CI uploads that feed them, `api/` what the apps call, `shared/` what both use, `workers/www/` the router. A new file goes in one of them, never `site/src`; `test/boundary.test.js` fails on a wrong import (admin and api never import each other; a page's data goes in `shared/`, its HTML in `admin/`). Tests mirror the folders.
- **Run anything with `tools/site-run.sh <cmd>`** (public tree + this repo in `.overlay`, rebuilt hourly), e.g. `tools/site-run.sh node --test "test/**/*.test.js"`.
- **Land with the public repo's ship tool, from your worktree here:** `~/job-pilotto/tools/ship.sh --background --body=<file>` (rebase, push, open the PR, watch it: `ship: RED/GREEN/MERGED/CONFLICT` in its log; Monitor it). Never a bare `gh pr create`.
  The body follows `~/job-pilotto/tools/pr-body-template.md` (verdict line, **Why**, **Unblocks**, impact table, bullets, Before/After, "No screenshots: <why>"); CI's step "PR description laid out" fails without it. The check to wait for is "All checks passed" (`tests.yml`).
  Worktree: `git worktree add ../job-pilotto-site-<topic> -b <topic>`; commit subject ≤ 72 characters. The owner merges by hand.
- **Merging to `main` deploys production** (`site.yml`, Worker `www`). Try it first on staging: Actions → "Release · Website staging" (Worker `www-staging`, no domain, no cron, no production secrets, probes every route against production).
- **A change on both sides lands here first** (owner, 21 Oct 2026: "the site lands first, and its tests check 'the site has everything public lists' instead of an exact match"): the Worker route, feed type, tag, step or reason word goes in here, then the public PR lists and uses it. A route the Worker has that public does not list yet is only told (`SITE_ROUTES_STRICT=1`, the daily run, fails it); a route public lists that the Worker lacks stays red. Open both PRs together, merge this one first. Detail: public `docs/rules/private-site.md`.
- **A public file the site bundles changed** (`extension/…`, `desktop/lib/…`, `worker/src/report.js`, `config/…`): `public-watch.yml` (every 6 hours) redeploys; start it by hand when it matters.
- **Shared tables live in the public repo** (`desktop/e2e/lib/platform.mjs`, `applying-status.mjs`, `desktop/lib/free-ai-models.js`, `free-ai-translate.js`, `desktop/test/fixtures/host-cases.json`); `site/src/*.js` re-export them. Edit them in the public repo.
- A test that needs a site file lives in the public repo behind `tests/site_private.py` / `desktop/test/site-private.js` (skipped there, run here) or in this repo's `tests/` and `desktop/test/`.

## Safety (same as the public repo)
- Secrets only in the macOS Keychain (`job-pilotto.*`), GitHub secrets and Worker secrets. Never in code, docs, logs or PR text. The owner sets this repo's secrets; never print or copy a value.
- No AI spend without the owner's yes. Keep `/admin` behind its keys; never open a route without the guard its siblings have.
- Never edit another session's worktree. One issue per session.
- Cost: this repo runs on private Actions minutes (about 4,000 a month at the move; the plan's allowance is the owner's call). Don't add a schedule or a matrix without saying what it costs.

## Not here
The app, the extension, the engine (`src/`), the Telegram bot Worker (`worker/`), the user-called workflows and all their tests are in the **public** repo; do not copy them here.

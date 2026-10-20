# job-pilotto-site: notes for Claude

The website, `/admin` and the scheduled jobs that feed them: **private**, split out of the public `GarryOne/job-pilotto` on 20 Oct 2026 (owner: "leave open-source rather less than more").
Read [README.md](README.md) first, then the public repo's `docs/rules/private-site.md` (`~/job-pilotto`, or `gh repo view GarryOne/job-pilotto`).

## The one rule
**Private reads public, public never reads private.** This repo only runs laid over a checkout of the public repo (the site imports shared validators from `extension/`, `desktop/lib/`, `worker/src/`, `config/`).
Nothing here may be needed by a public file, test or workflow. Never copy a private file into the public repo.

## How to work
- **Run anything with `tools/site-run.sh <cmd>`** (public tree + this repo in `.overlay`, rebuilt hourly), e.g. `tools/site-run.sh bash -c 'cd site && npm test'`.
- **Land through a normal PR to `main` of this repo**; the check to wait for is the job "All checks passed" (`tests.yml`: site tests + the public guards that read `site/` + this repo's own tests). No `tools/ship.sh` here: it is the public repo's tool.
  Worktree: `git worktree add ../job-pilotto-site-<topic> -b <topic>`; commit subject ≤ 72 characters; PR body short (verdict line, Why, before/after).
- **Merging to `main` deploys production** (`site.yml`, Worker `www`). Try it first on staging: Actions → "Release · Website staging" (Worker `www-staging`, no domain, no cron, no production secrets, probes every route against production).
- **A new route** the app, extension or engine calls: first add it to `docs/site-routes.json` in the PUBLIC repo (a one-line PR there; it is the contract), then the Worker route here. The tests on both sides fail until both exist.
- **A public file the site bundles changed** (`extension/…`, `desktop/lib/…`, `worker/src/report.js`, `config/…`): `public-watch.yml` (every 6 hours) redeploys; start it by hand when it matters.
- **Shared tables live in the public repo** (`desktop/e2e/lib/platform.mjs`, `applying-status.mjs`, `desktop/lib/free-ai-models.js`, `free-ai-translate.js`, `desktop/test/fixtures/host-cases.json`); `site/src/*.js` re-export them. Edit them in the public repo.
- A test that needs a `site/` file lives in the public repo behind `tests/site_private.py` / `desktop/test/site-private.js` (skipped there, run here) or in this repo's `tests/` and `desktop/test/`.

## Safety (same as the public repo)
- Secrets only in the macOS Keychain (`job-pilotto.*`), GitHub secrets and Worker secrets. Never in code, docs, logs or PR text. The owner sets this repo's secrets; never print or copy a value.
- No AI spend without the owner's yes. Keep `/admin` behind its keys; never open a route without the guard its siblings have.
- Never edit another session's worktree. One issue per session.
- Cost: this repo runs on private Actions minutes (about 4,000 a month at the move; the plan's allowance is the owner's call). Don't add a schedule or a matrix without saying what it costs.

## Not here
The app, the extension, the engine (`src/`), the Telegram bot Worker (`worker/`), the user-called workflows and all their tests are in the **public** repo; do not copy them here.

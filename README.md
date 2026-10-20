# job-pilotto-site (private)

The website, `/admin`, and the CI jobs that feed them. Moved out of the public `GarryOne/job-pilotto` on 19-20 Oct 2026.

**Rule: private may read public, public never reads private.** This repo only runs laid over a tree of the public repo
(the site imports shared validators from `extension/`, `desktop/lib/`, `worker/src/`, `config/`).

## Work here
- `tools/site-run.sh <cmd>`: runs a command in `.overlay` (public tree + this repo), rebuilt when older than an hour.
- `tools/overlay.sh <out> [ref]`: build that tree by hand. `tools/tree.sh`: the same, for CI.
- `tools/site-guards.sh <tree> [<this repo>]`: the public tests that read `site/` plus this repo's own tests.
- No `ship.sh` here: open a normal PR; the required check is the job "All checks passed" (`tests.yml`).

## Contract with the public repo
`docs/site-routes.json` (public) lists every route the app calls. Two tests keep it true: `site/test/site-routes.test.js` (here) and `desktop/test/site-routes.test.js` (public).

## CI
`tests.yml` (PRs, push, daily against newest public main), `site.yml` / `site-next.yml` (deploys), `public-watch.yml` (every 6 hours: a public change that a deploy bundles dispatches the deploy), plus the scheduled jobs moved from public (digest, changelog, ops overview, e2e intel, hosted e2e, random draw, search lab).

## Secrets (set on this repo by the owner; never in code)
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `AI_COST_PUBLISH_KEY`, `SELFHEAL_PUBLISH_KEY`, `REPLAYS_PUBLISH_KEY`, `DIGEST_ANTHROPIC_KEY`, `BUILDLOG_TELEGRAM_TOKEN`, `BUILDLOG_TELEGRAM_CHAT`;
Lab: `RANDOM_DRAWS_ANTHROPIC_KEY`, `LAB_HEAL_ANTHROPIC_KEY`, `CI_APP_ID`, `CI_APP_PRIVATE_KEY`, `NET_RECORD_KEY`, `NET_RECORDS_READ_TOKEN`, `NET_RECORDS_WRITE_TOKEN`.

Never deploy Worker `www` from here and from public `site.yml` at the same time.

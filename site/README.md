# Jobadabra website

One Worker (`www`, `wrangler.toml`). Its code sits in five folders, by who calls it:

| Folder | What | May import |
|---|---|---|
| `web/` | the public pages: `web/public/` (static, no build step; Workers static assets) | nothing |
| `admin/` | the owner's `/admin` pages and the CI uploads that feed them (`PUT /ops/data`, `/applying/*`, …) | `shared/` |
| `api/` | the routes installed apps and the extension call (`/api/*`, `/report/*`, `/install`, `/download/*`); their URLs never change | `shared/` |
| `shared/` | used by both: auth, guard, mail, free AI, the data behind the pages | `shared/` only |
| `worker/` | `index.js`: the router, cron and queue; the only file that imports from every folder | all |

`test/` mirrors them (`test/admin`, `test/api`, `test/shared`, `test/web`, `test/worker`); `test/boundary.test.js` fails when a file imports the wrong way, or a module is left in the old `site/src`.
A page and its data are two files: the data in `shared/`, the page in `admin/` (e.g. `shared/telemetry.js`, `api/telemetry.js`, `admin/telemetry.js`).
The joined tree (`tools/overlay.sh`) keeps `site/src/<file>` and `site/public` as links to the new places, so the public repo's tests that still name them run unchanged.

`worker/index.js` also serves `POST /api/waitlist`, which keeps Pro early-access sign-ups in Cloudflare KV.

- Deploy by hand: `cd site && npx wrangler@4 deploy`
- Automatic: `.github/workflows/site.yml` deploys on every push to `main` that changes `site/`.

## Reading the owner pages from a script (/admin/*)

Every `/admin/*` page (overview, ai-cost, self-healing, …) answers **404** without the owner's credentials (`shared/auth.js`).
From a terminal or an agent session on the owner's Mac:

```sh
curl -s -H "Authorization: Bearer $(security find-generic-password -s job-pilotto.site.api_key -w)" \
  https://www.jobpilotto.top/admin/ai-cost
```

- The Bearer token is the Worker secret `STATS_API_KEY`, kept in the Keychain as `job-pilotto.site.api_key`.
- `STATS_KEY` (`job-pilotto.site.stats_key`) is **not** accepted as a Bearer token: it is the browser login (`?key=` once, then the session cookie).
- The pages are HTML; strip the tags to read the tables (`/admin/ai-cost`: By group, By day, By API key, By job).

# job-pilotto-site: instructions for any agent (Claude, Codex, or other)

This is the private repo of the Job Pilotto website, `/admin` and the CI that feeds them. The rules are in **[CLAUDE.md](CLAUDE.md)** (written for Claude Code, valid for any agent) and **[README.md](README.md)**.

In one breath:
- **Private reads public, public never reads private.** Work inside the joined tree: `tools/site-run.sh <cmd>`.
- **Changes land by PR to `main`**, shipped with `~/job-pilotto/tools/ship.sh --background --body=<file>` (body per `~/job-pilotto/tools/pr-body-template.md`; never a bare `gh pr create`) (wait for the check "All checks passed"); merging deploys production, so try "Release · Website staging" first.
- **Where a file goes:** `site/{web,admin,api,shared,worker}` (see `site/README.md`); `site/test/boundary.test.js` guards the imports.
- **A new route** goes in the public `docs/site-routes.json` first, then here.
- **Secrets** only in the Keychain, GitHub secrets and Worker secrets; the owner sets them; never print one.
- The project's wider rules (change tiers, red main, reading websites, ask before AI spend) are in the public repo: `~/job-pilotto/AGENTS.md` and `CLAUDE.md`.

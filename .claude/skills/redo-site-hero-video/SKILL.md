---
name: redo-site-hero-video
description: Redo or improve the website's hero video (the landing page's four-step tour of the desktop app: Set up, Find, Apply, Track) from the real app and the real extension in demo mode, judge it inside the hero at desktop and phone width, get the owner's yes on a side-by-side, place and ship it. Use when the owner says "redo the hero", "improve the hero video", "the hero clip is wrong/unreadable", gives feedback on a hero phase or caption, or after an app screen the hero shows changed.
---

# Redo the site's hero video

The hero (`web/public/index.html` `#hero-stage`) is **four short clips played as one continuous tour** on one fixed stage (owner, 24 Oct 2026):
silent autoplay Set up → Find → Apply → Track, captions as HTML above the stage, clickable step labels with a progress line, a discreet pause,
a tighter 4:3 copy for phones, and a cut (never a crossfade, never a blank) between clips. One made-up person (nurse persona) and **one job**
(Institut Cardio Rhône, Registered Nurse, Cardiac Care Unit) from setup to interview. Approved sketch: https://claude.ai/artifact/MD1RKmELpnh7rzkprJkKfg

## The loop (one command per step)
1. **Change** what the owner asked (the map below says where), then `tools/site-run.sh node --test "desktop/test/media-*.test.js"`.
2. **Record**: `tools/hero.sh [pieces]` from your site worktree, in the background (`2>&1 | tee <log>` + Monitor `^(hero|media|hero-preview):|FAILED`).
   Pieces: `hero-onboarding` (Set up), `hero` (Find), `hero-fill` (Apply), `hero-track` (Track); none = all four, ~6 min. Records your local edits
   (it syncs `media/ web/ tools/` into `.overlay`), writes the set to `~/.cache/jobadabra-media/hero-<time>/`, 8-frame contact sheets per clip
   (`sheets/<piece>.png`, `sheets/<piece>-720.png`) and `preview.png`, and opens the preview.
3. **Read the sheets, then the preview** (checklist below). Fix and re-record only the pieces that are wrong.
4. **Owner's yes**: the preview IS the side-by-side (left: today's live hero, right: this set inside the real page, desktop 1440 and phone 390,
   each phase at its result moment). Open it for him, ask AskUserQuestion (ship / change what) with a recommendation. Never ship clips he hasn't seen.
5. **Place**: `tools/hero.sh --place <set dir>`, then the site tests `tools/site-run.sh node --test "test/**/*.test.js"`
   (`tools/hero.sh --preview` re-renders the side-by-side from what is placed).
6. **Ship** from the worktree: `~/job-pilotto/tools/ship.sh --background --body=<file>` (body per `~/job-pilotto/tools/pr-body-template.md`, with the
   preview halves as Before/After: `tools/hero-preview.mjs --only desktop|phone`, committed under `docs/pr-shots/<topic>/`, linked as
   `https://github.com/GarryOne/jobadabra-web/raw/<branch>/docs/pr-shots/<topic>/<x>.jpg`: the check wants a link ending in .jpg/.png, never `?raw=1`); Monitor `^ship: (DONE|FAILED|REVIEW|MERGED|CLOSED|RED|GREEN|CONFLICT)`. The owner merges; merge = production (www.jobadabra.top).
After that, the daily `tools/media.sh` refresh re-records the hero pieces from origin/main with everything else; the hero needs this skill only to change.

## Where each thing lives
| What | File |
|---|---|
| Each phase's steps, framing, zooms, captions, budgets | `media/scenes.mjs` (the `hero*` entries; `PHONE`, `ROW`) |
| The made-up person and her data | `media/personas/nurse-lyon/` (`draft.json`, `jobs.json`, ...) |
| "2 weeks later" (Track): records changed for one clip | `media/personas/nurse-lyon/moments/later.json` (`applyEdits`: match by id, `null` drops a field, `_first`, `_drop`) |
| Camera (steady, cut, phone gain) | `media/camera.mjs` |
| App / extension recorders, look boxes | `media/record-app.mjs`, `media/record-extension.mjs` |
| Stage markup, captions (`data-cap`, `data-sub`, `data-later`), phone posters | `web/public/index.html` `#hero-stage` |
| Playback (order, cut on first frame, pause, steps) | `web/public/hero-stage.js` |
| Look (frame, amber glow, 4:3 on phones, steps line) | `web/public/home.css` `.hero-stage` |
| The side-by-side | `tools/hero-preview.mjs` |
Tests: `desktop/test/media-{camera,persona,options,manifest}.test.js`, `test/web/landing.test.js`, `test/web/hero-redo.test.js`.

## Scene vocabulary (`media/scenes.mjs`)
- A piece: `camera: 'steady'` (opens framed, clicks never move it), `phone: PHONE` (the 720×540 copy), `budget` (bytes), `speed`, `moment`,
  `motion: 'reduce'` (extension: no aurora/shimmer sweep), `settings` (app wizard state), `caption`.
- Steps: `{go: 'jobs'}` (a page: the camera may `cut` here), `{js: '...'}`, `{click: sel, zoom}`, `{tap: sel}` (shows a press without clicking),
  `{fill: true}` (extension), `{hold: s, look: sel | [sels] | 'panel', zoom, phoneZoom, phoneLook, cut, poster}`.
- **One deliberate move per phase** (test: media-options): the first look frames, one later look moves; a `cut: true` look switches at the page change.
  `poster: true` marks the result moment (the poster and the preview frame). Every look's `phoneZoom` > its `zoom`.

## Owner's rules for the hero (24 Oct 2026)
- Readable **at the website's size**: job title, match reason, completion status, interview date. Desktop result zoom ~2+ (14 px app text ≈ 14 px
  on a 1440 screen); phone zoom ~3.5. Secondary details may stay small. Judge in the preview, never fullscreen.
- Captions (HTML, AA): "Add your CV. Shape your search." / "Find matching jobs. See why they fit." / "Fill applications with your details."
  + "Review your answers, then submit." / "Your interviews and next steps, together." Set up shows the user **confirming** proposed preferences
  (salary/places are proposals, not facts read from every CV).
- Apply: form and extension framed together, **never cut off the panel**, no colour sweep. Track: one prominent interview in Focus, then its calendar
  event; no busy month grid; "2 weeks later" is part of the made-up example.
- The stage stays inside the page's content column (no negative margin into the page margin; test: landing.test.js). At 1440 it is 700 px wide, so result zooms ~2.2 give ~12 px text.
- ~18 s is the target, 20-22 s fine; sizes are budgets (desktop ≤ 2.5 MB total, phone ≤ 1.1 MB); check small text survives compression.
- Demo data only (the persona); never the owner's app, profile or accounts; no AI spend (the recorder uses none).

## Checklist before showing the owner
- Each sheet: the story holds (same job everywhere), nothing important cut at an edge, no empty frame, the move happens once.
- Preview: every caption matches its clip; the result text readable at desktop AND phone; Apply's whole panel in frame; Track's interview is the
  first thing in Focus and in Coming up.
- Sizes from `tools/hero.sh --place` within budget; site tests green.

## Traps already hit
- **A look matched a hidden element** (`.focus-item:has-text(...)` found one off-screen): scope it (`#focus-list .focus-item:has-text("Prepare for ...")`). "nothing to look at at <sel>" is this.
- **Mixed row classes**: the calendar's Coming up has `.cal-row` and `.cal-row-wrap`; `#cal-upcoming > :first-child` is the first interview.
- **The panel moves**: during a fill it sits centred, then returns to its corner; `panelBox` waits for the corner. A union of the panel and a far field is wider than the zoomed view and gets framed from its left edge: look at `'panel'` alone.
- **Persona gaps show as app gaps**: `draft.json` needs `search.target_roles` (else "Target roles: Not set") and a numeric `usd` (step 3 crashes without it). That's old data, not a product bug.
- `querySelector` in a `js` step can't take Playwright's `:has-text`; use `[...document.querySelectorAll(...)].find(...)`.
- A `media/plans/<piece>.json` (the old AI director's plan) overrides a scene's framing and captions; the hero pieces have none, keep it that way.
- `tools/media-refresh.sh` only refreshes files the site already has: a NEW file (e.g. a new phone poster) is placed once by hand (`--place`).

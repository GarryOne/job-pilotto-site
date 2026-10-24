---
name: redo-site-hero-video
description: Redo or improve the website's hero video (the landing page's four-step tour of the desktop app: Set up, Find, Apply, Track) from the real app and the real extension in demo mode, judge it inside the hero at desktop and phone width, get the owner's yes on a side-by-side, place and ship it. Use when the owner says "redo the hero", "improve the hero video", "the hero clip is wrong/unreadable", gives feedback on a hero phase or caption, or after an app screen the hero shows changed.
---

# Redo the site's hero video

The hero (`web/public/index.html` `#hero-stage`) is **four short clips played as one continuous tour** on one fixed stage (owner, 24 Oct 2026):
silent autoplay Set up → Find → Apply → Track, captions as HTML above the stage, clickable step labels with a progress line, a discreet pause,
a tighter 4:3 copy for phones, and a cut (never a crossfade, never a blank) between clips. One made-up person (nurse persona) and **one job**
(Institut Cardio Rhône, Registered Nurse, Cardiac Care Unit) from setup to interview. Approved sketch: https://claude.ai/artifact/MD1RKmELpnh7rzkprJkKfg; round 2 storyboard (every beat): https://claude.ai/artifact/SLjpGZdm31SvGeBvuTiBNg

## The loop (one command per step)
1. **Change** what the owner asked (the map below says where), then `tools/site-run.sh node --test "desktop/test/media-*.test.js"`.
2. **Record**: `tools/hero.sh [pieces]` from your site worktree, in the background (`2>&1 | tee <log>` + Monitor `^(hero|media|hero-preview):|FAILED`).
   Pieces: `hero-onboarding` (Set up), `hero` (Find), `hero-fill` (Apply), `hero-track` (Track); none = all four, ~6 min. Records your local edits
   (it syncs `media/ web/ tools/` into `.overlay`), writes the set to `~/.cache/jobadabra-media/hero-<time>/`, one contact-sheet frame **per beat**
   (`sheets/<piece>.png`, `sheets/<piece>-720.png`; the log prints `hero: <piece> beat <n> <t> s: <words>`) and `preview.png`, and opens the preview.
   **Never edit `tools/hero.sh` while it runs** (bash reads it as it goes; the tail breaks): make the sheets/preview by hand then.
3. **Read the sheets, then the preview** (checklist below). Fix and re-record only the pieces that are wrong.
4. **Owner's yes** (copy `preview.png` to `<your session's short name>-hero-preview.png` before opening it): the preview IS the side-by-side (left: today's live hero at three moments, right: this set inside the real page at **every beat**,
   desktop 1440 and phone 390; one strip per phase; the file name starts with your session's short name). Open it for him, ask AskUserQuestion (ship / change what) with a recommendation. Never ship clips he hasn't seen.
5. **Place**: `tools/hero.sh --place <set dir>`, then the site tests `tools/site-run.sh node --test "test/**/*.test.js"`
   (`tools/hero.sh --preview` re-renders the side-by-side from what is placed).
6. **Ship** from the worktree: `~/job-pilotto/tools/ship.sh --background --body=<file>` (body per `~/job-pilotto/tools/pr-body-template.md`, with the
   After = `tools/hero-preview.mjs --only desktop|phone --out docs/pr-shots/<topic>/<x>.jpg`, Before = an image too (the body check refuses a text cell:
   tile main's four `hero*-poster.jpg` / `-720-poster.jpg`), committed under `docs/pr-shots/<topic>/`, linked as
   `https://github.com/GarryOne/jobadabra-web/raw/<branch>/docs/pr-shots/<topic>/<x>.jpg`: the check wants a link ending in .jpg/.png, never `?raw=1`); Monitor `^ship: (DONE|FAILED|REVIEW|MERGED|CLOSED|RED|GREEN|CONFLICT)`. The owner merges; merge = production (www.jobadabra.top).
After that, the daily `tools/media.sh` refresh re-records the hero pieces from origin/main with everything else; the hero needs this skill only to change.

## Where each thing lives
| What | File |
|---|---|
| Each phase's steps, framing, zooms, captions, budgets | `media/scenes.mjs` (the `hero*` entries; `PHONE`, `ROW`) |
| The made-up person and her data | `media/personas/nurse-lyon/` (`draft.json`, `jobs.json`, ...) |
| "2 weeks later" (Track): records changed for one clip | `media/personas/nurse-lyon/moments/later.json` (`applyEdits`: a key names a list, `"."` = the file is a list (runs.json), a map by id, or one record by its id; `null` drops a field, `_first`, `_drop`, `_add` creates) |
| Beat times in the manifest (sheets, preview) | `media/camera.mjs` `beatTimes`, `media/manifest.mjs` `beats` |
| Camera (steady, cut, phone gain) | `media/camera.mjs` |
| App / extension recorders, look boxes | `media/record-app.mjs`, `media/record-extension.mjs`; a hold's entry and timing (pure) `media/hold.mjs` |
| Stage markup, captions (`data-cap`, `data-sub`, `data-later`), phone posters | `web/public/index.html` `#hero-stage` |
| Playback (order, cut on first frame, pause, steps) | `web/public/hero-stage.js` |
| Look (frame, amber glow, 4:3 on phones, steps line) | `web/public/home.css` `.hero-stage` |
| The side-by-side | `tools/hero-preview.mjs` |
Tests: `desktop/test/media-{camera,persona,options,manifest}.test.js`, `test/web/landing.test.js`, `test/web/hero-redo.test.js`.

## Scene vocabulary (`media/scenes.mjs`)
- A piece: `env` (extra app env for that recording, e.g. `JOB_PILOTTO_DEMO_STRATEGY_DELAY` so the demo "Claude reads your CV" step lasts), `camera: 'steady'` (opens framed, clicks never move it), `phone: PHONE` (the 720×540 copy), `budget` (bytes), `speed`, `moment`,
  `motion: 'reduce'` (extension: no aurora/shimmer sweep), `settings` (app wizard state), `caption`.
- **Every look names its `beat`**: the one thing the viewer reads there, ≥ 12 characters, unique (test: media-options). A phase is **the user's real
  sequence, one beat per step**, at least three beats (Apply excepted). Write the beats first (the storyboard), then the steps.
- Steps: `{go: 'jobs'}` (a page: the camera may `cut` here), `{js: '...'}`, `{click: sel, zoom}`, `{tap: sel}` (shows a press without clicking),
  `{fill: true}` (extension), `{hold: s, look: sel | [sels] | 'panel', zoom, phoneZoom, phoneLook, cut, poster}`.
- **The camera shows a hero look whole across** (`fitWidth`, round 2): a look wider than its zoomed view gets a lower zoom, never a cut edge; the log says
  `media: <piece>: look ... shown whole at zoom X (asked Y)` and adds `SMALL TEXT, pick a narrower look` when it dropped below 85%: then look at a part
  (a row's cells, a card's column), never raise the zoom back. The phone copy keeps its tighter crop unless it names its own `phoneLook`.
- **Measure before choosing a look** (a probe printing `getBoundingClientRect` of the look and its children, CSS px on the 1800-px page): a look fits
  zoom z when its width ≤ 1800/z − 24 (z 2.2 → 794, 2 → 876, 1.64 → 1073). A wider card: name its left part with `lookWidth`, ending in a gap between
  columns (the job row's fit/role/company = 862); ask a zoom at or above the fit so the view hugs the look. Known limit: a look narrower than the view at
  MAX_ZOOM (2.4 → 750) shows its neighbours, cut at the view's edge (the calendar's grid beside Coming up); pick the look so they are context, not text.
- **A hero clip starts at its first look** (`fromFirstLook`): what the scene does before it (feeding the Find card, folding a section) is never on screen.
- **One deliberate move per phase** (test: media-options): the first look frames, one later look moves; a `cut: true` look switches at the page change.
  `poster: true` marks the result moment (the poster and the preview frame). Every look's `phoneZoom` > its `zoom`.

## Owner's rules for the hero (24 Oct 2026)
- Readable **at the website's size**: job title, match reason, completion status, interview date. Desktop result zoom ~2+ (14 px app text ≈ 14 px
  on a 1440 screen); phone zoom ~3.5. Secondary details may stay small. Judge in the preview, never fullscreen.
- Captions (HTML, AA): "Add your CV. Shape your search." / "Find matching jobs. See why they fit." / "Fill applications with your details."
  + "Review your answers, then submit." / "Your interviews and next steps, together." Set up shows the user **confirming** proposed preferences
  (salary/places are proposals, not facts read from every CV).
- Apply: form and extension framed together, **never cut off the panel**, no colour sweep. Track (round 2): starts on the Gmail check that found the
  interview invitation, then that interview's recording, review, patterns and practice, then its calendar event; no busy month grid; "2 weeks later"
  is part of the made-up example and sits in the caption line.
- The stage stays inside the page's content column (no negative margin into the page margin; test: landing.test.js). At 1440 it is 700 px wide, so result zooms ~2.2 give ~12 px text.
- ~31 s in total, every step shown (owner, 24 Oct 2026, round 2; was ~18 s); sizes are budgets (desktop ≤ 2.5 MB total, phone ≤ 1.1 MB); check small text survives compression.
- Demo data only (the persona); never the owner's app, profile or accounts; no AI spend (the recorder uses none).

- Phase stories (round 2, owner 24 Oct 2026): **Set up** = CV dropped → a note typed → Build my strategy → the demo "reading your CV" → proposed goals
  → Save (confirm). **Find** = the Find jobs card searching → done → scroll to THE job → its Match tab. **Track** = the Gmail check card ("Interview
  scheduled" for THE job) → its interview recording → the review → insights/patterns → practise next → that interview first on the calendar.

## When something is wrong: fix the mechanism, then the scene (owner, 24 Oct 2026: "did you fix the root causes permanently?")
A bad crop, a missing step or a wrong frame is first a question about the tool: which camera/recorder/tool rule let it through? Fix that rule, add a test
that loops over every hero look or scene (it fails on the old code), add a trap line below; only then tune the scene's numbers. A scene-only tweak
comes back at the next redo.

## Checklist before showing the owner
- Each beat frame: its beat's words are readable and inside the crop; the crop ends on a gap between columns/cards, never through one.
- Each sheet: the story holds (same job everywhere), nothing important cut at an edge, no empty frame, the move happens once.
- Preview: every caption matches its clip; the result text readable at desktop AND phone; Apply's whole panel in frame; Track's interview is the
  first thing in Focus and in Coming up.
- Every cut, frame by frame at 10 fps: no frame of another page (the gate checks it too).
- Sizes from `tools/hero.sh --place` within budget; site tests green.

## Traps already hit
- **A look matched a hidden element** (`.focus-item:has-text(...)` found one off-screen): scope it (`#focus-list .focus-item:has-text("Prepare for ...")`). "nothing to look at at <sel>" is this.
- **Mixed row classes**: the calendar's Coming up has `.cal-row` and `.cal-row-wrap`; `#cal-upcoming > :first-child` is the first interview.
- **The panel moves**: during a fill it sits centred, then returns to its corner; `panelBox` waits for the corner. A union of the panel and a far field is wider than the zoomed view and gets framed from its left edge: look at `'panel'` alone.
- **Persona gaps show as app gaps**: `draft.json` needs `search.target_roles` (else "Target roles: Not set") and a numeric `usd` (step 3 crashes without it). That's old data, not a product bug.
- `querySelector` in a `js` step can't take Playwright's `:has-text`; use `[...document.querySelectorAll(...)].find(...)`.
- A `media/plans/<piece>.json` (the old AI director's plan) overrides a scene's framing and captions; the hero pieces have none, keep it that way.
- `tools/media-refresh.sh` only refreshes files the site already has: a NEW file (e.g. a new phone poster) is placed once by hand (`--place`).
- **Round 1 (24 Oct 2026) skipped steps and cropped through columns** because looks were picked without a written beat and checked only at the
  result moment: hence the beat rule, beat sheets and the per-beat preview. Don't go back to "one frame per phase".
- **A cached strategy draft skips "Build my strategy"**: set `window.__jp.shared.rebuildAsked = true` before opening the step (`OPEN_BUILD` in scenes.mjs).
- **The Find jobs card is overwritten by the app within ~1 s**: feed it through `window.__jp.findCard(state)` on a 150 ms timer (`FIND_RUN`), then clear the timer.
- **Probe screenshots**: Playwright `page.screenshot` draws the app at its 0.8 zoom = **1.6 px per CSS px** (not 2); compute crops with that factor.
- **A row near the bottom hides under the "Application sessions" bar**: scroll it to the middle before a look (`scrollTo` in scenes.mjs).
- **The "2 weeks later" tag lives in the caption line** (`.stage-later` before `.stage-title`), never positioned over the video (test: landing.test.js).
- **A moment written after the last sync shows nothing**: `tools/hero.sh` syncs, but a hand probe needs `rsync -a media/ .overlay/media/` first.
- **Recent activity stays open across pages** and covers the next page (Track's "Open review" click timed out): toggle it closed before the next `go` (test: media-options).
- **The app recorded is public main at record time**: `tools/hero.sh` rebuilds `.overlay` when public main moved (it was built once and went stale). To record a public PR branch that redesigns a hero screen before it merges: `HERO_PUBLIC_REF=<branch> tools/hero.sh <piece>`; ship the clip only after that PR merges.
- **Beat frames after the page moved on**: a hold's log time is stamped after its boxes are measured (slow under load); the log's `s` is the time left (`holdLeft`), so beats and posters fall inside the look. Don't log `item.hold` again.
- **Clicking Save in Set up opens "Demo mode: nothing is sent"**: the scene `tap`s it (a press, no click). Keep it a tap.
- **Holds: the owner's floors are tested** (media-options): every view ≥ 1.1 s on screen, each result (poster) ≥ 2 s, at most 2x speed.
- **Never write into `.overlay` while `tools/hero.sh` runs** (it may rebuild it: `rm: .overlay: Directory not empty`, FAILED). Run tests meanwhile in a scratch overlay (`tools/overlay.sh <scratch>/ov`).
- **"Reading it from your store…" in Set up**: on a loaded Mac the strategy's Job preferences card is still loading when the clip reaches it (it loads
  in ~2 s otherwise). Keep it out of the look, or re-record when the machine is quiet; it is load timing, not a demo bug.
- **App words the hero shows come from the app**: a wrong tag on a nurse job ("Observability", 24 Oct 2026) was a public-repo fix (#1758): tags now
  come from each job's `skills`, so the persona's `jobs.json` gives every job its own (cardiac care, telemetry, ...), never a scene crop.
- **Not built yet**: a pre-recording storyboard (each look's box and fitted zoom without recording). Until then the `media: ... shown whole at zoom`
  lines and the beat sheets are the check.
- **A look with no frame = a stalled capture; a still page is not one** (24 Oct 2026): the screencast sends frames only when the page changes, so a
  frame gap proves nothing (a gap-after-click check failed a good Set up). Each look's hold forces one repaint (`screencast.mjs paint`); a look with no
  frame within 1 s is a stall (`check.mjs captureGaps`), recorded again up to twice (`media: <piece>: the capture stalled`), then the piece fails.
  Read the raw frames (`.work/<piece>/frames`, `log.json`) before naming a stall: run 3's "frozen Set up" was a look measured before its frame came.
- **The phone copy's `phoneLook` is shown whole too**: give it the cells you mean (`[ROW .fit-cell, ROW .role]`) or its left part (`phoneLookWidth`), never a full-width row or banner.
- **A test that imports `record-app.mjs` needs Playwright, which the site CI job lacks** (PR #47 went red): pure helpers live in `media/hold.mjs`; "Cannot find module 'playwright-core'" in a local run is this same failure, never "just my setup".
- **A stray frame at a cut** (round 3, owner: "a small glitch in the first clip (showing something about Sonnet)"; four more like it in Track and Find):
  the frames between a page change and the next look being painted showed the old framing over the new page, or the new framing over the old one.
  Now: the recorder logs `ready` when the next `cut` look is in the page AND painted (two repaints), stamps every change BEFORE its action, and
  `cuts.mjs dropChanges` cuts those frames out (the cut lands on the first frame after `ready`). The gate `cuts.mjs strayFrames` reads the played clip
  and fails a piece with "a frame of another page at <s>, before/after the cut to <look>" (clean cuts ≤ 0.7, glitches 5.6–16.9). Look at every cut
  frame by frame (`ffmpeg ... fps=10,tile`) before showing the owner; the sheets show one frame per beat and miss these.
- **A cut hides how she got there**: a cut look is a jump. Where the owner wants the way in seen (Find: the click on a job, the drawer opening),
  use a click zoom and a short hold on the in-between screen, not `cut`.

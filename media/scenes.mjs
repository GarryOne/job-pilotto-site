// What each product picture and video shows (media): the steps the recorder drives, by selector, and the manifest's words.
// Data only: re-record with another search profile by `node media/media.mjs --persona <folder>` (a copy of desktop/demo with its own media.json).
// Pieces and sizes agreed with the site redesign (session bd, 20 Oct 2026): hero, extension-fill, apply-split, stills, snips; dark only; captions
// live in the manifest, never burned into a video. Guard: desktop/test/media-scenes.test.js.

// Steps: {go: view} opens a sidebar page; {click: selector} glides the cursor there and clicks; {hold: seconds, look?: selector} waits while the
// camera may zoom to `look`; {press: key}; {fill: true} (extension) marks the tab as the app's Apply does, and the extension fills it. Any step may `say`
// a line drawn under the clip from its moment (captions.mjs, round 3: "we need to explain the journey better"); a piece's `caption` is the manifest's.
export const nav = view => `.nav[data-view=${view}]:not([data-settings])`;

// The hero: four clips on one stage, ONE story and ONE job (owner, 24 Oct 2026, sketch https://claude.ai/artifact/MD1RKmELpnh7rzkprJkKfg): set up (the CV, the
// strategy it proposes, confirmed), find (the list, the job opened, why it fits), apply (the extension fills that job's form), track ("2 weeks later", moment
// 'later': its interview in Focus, then on the calendar). Camera 'steady' (camera.mjs): each clip opens framed, clicks never zoom unless a step says so, one
// deliberate move toward the result, then a hold long enough to read; a page change cuts. Key facts must read at the hero's real size (~840 px wide on a
// 1440 screen): the result looks zoom ~2.2. The phone copy ({width, height}: 4:3) has its own tighter camera (PHONE_GAIN, or a step's phoneZoom / phoneLook).
// Recorded at real speed, played `speed` times faster (encode.mjs). `slide` is the clip's place on the stage. Captions here are the manifest's; the site
// writes its own words above the clip (web/public/index.html).
const PHONE = {width: 720, height: 540, budget: 2.6e5};
const ROW = '.job-row:has-text("Cardiac Care Unit")';   // the job the whole hero follows (personas/<p>/media.json job)
// Set up (round 2, owner 24 Oct 2026: "not showing all the steps"): the strategy step is opened as a rebuild, so the note and Build my strategy show
// (a first setup with a cached draft skips them); the note is typed in, letter by letter.
// A wizard step opened through its sidebar entry (demo mode refuses Use Free AI: it sends nothing, so the AI step's button is pressed, then its next step opened).
const jumpTo = step => `(() => { const li = document.querySelector('#step-list li[data-step=${step}]'); li.classList.add('jump'); li.click(); })()`;
const OPEN_BUILD = `window.__jp.shared.rebuildAsked = true; ${jumpTo('draft')}`;
const typeNote = text => `(() => { const box = document.getElementById('q-more'), words = ${JSON.stringify(text)}; let i = 0; box.value = '';
  const tick = setInterval(() => { box.value = words.slice(0, ++i); box.dispatchEvent(new Event('input', {bubbles: true})); if (i >= words.length) clearInterval(tick); }, 28); })()`;
// Widths (round 2, measured in CSS px on a 1800-px page): a look the camera shows whole must fit its zoom (1800 / zoom); a wider card names the left part
// it means (lookWidth), ending in a gap between columns: the job row's fit, role and company (862), the main goals' two value columns (1080).
// A page script that scrolls a job's row to the middle of the list.
const scrollTo = (title, behavior = 'instant') => `[...document.querySelectorAll('.job-row')].find(row => row.textContent.includes(${JSON.stringify(title)}))?.scrollIntoView({block: 'center', behavior: '${behavior}'})`;
// Find (round 3, owner 24 Oct 2026: "From a wizard, fresh setup, we should come to jobs and see a big button/card saying 'Find jobs' ... highlight clicking on
// it, then show the card doing the job of finding jobs"): a fresh demo (no search yet: lastSearchAt "") opens Jobs on the big Find jobs card; pressing it plays
// the demo's scripted search (desktop/lib/demo-search.js, shortened by JOB_PILOTTO_DEMO_SEARCH_SECONDS), then the list fills. "When we click on a job, we're
// moving too fast to the job drawer": the drawer's first look is the clip's one camera move, from her row to the panel, not a cut.
const SEARCH_SECONDS = 7;
// Once the search's list is in (it loads a moment after the search ends): "In conversation" folded so the list sits under the card, her row to the middle.
const TO_HER_ROW = `new Promise(done => { const t0 = Date.now(); const tick = () => {
  const row = [...document.querySelectorAll('.job-row')].find(each => each.textContent.includes('Cardiac Care Unit'));
  if (!row && Date.now() - t0 < 8000) return setTimeout(tick, 100);
  const fold = [...document.querySelectorAll('details')].find(el => /In conversation/.test(el.querySelector('summary')?.textContent || '')); if (fold) fold.open = false;
  row?.scrollIntoView({block: 'center', behavior: 'smooth'}); done(); }; tick(); })`;
// Apply (round 3, owner 24 Oct 2026: "We should start on the way how we press 'Apply' button on the Jobs screen, showing then 'Applying' screen/card, then
// moving to the browser"): an app part (moment 'applying': her session as the row's Apply makes it) played before the extension's fill. Her session is
// opened through its row on the Applying page's list, which opens the page on it (a plain page switch shows the session that needs you first).
const OPEN_HERS = "[...document.querySelectorAll('#ss-list li')].find(li => li.textContent.includes('Institut Cardio'))?.click()";
// Track (round 3, owner: "showing like a mail come on the user's gmail, then we go to our app, showing how we trigger a gmail check"): a plain new-mail
// banner drawn over the app (no mail brand), then the Gmail check's card, its result shown once she presses Check Gmail now (the run in the data is the
// check she asks for; hidden until the press, so the press is what brings it).
const MAIL_IN = `(() => { const n = document.createElement('div'); n.id = 'hero-mail';
  n.style.cssText = 'position:fixed;top:18px;right:18px;z-index:99999;width:380px;display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:14px;background:#f4f5f7;color:#16181d;box-shadow:0 12px 32px rgba(0,0,0,.45);font:13px/1.35 -apple-system,system-ui,sans-serif;transform:translateX(130%);transition:transform .45s cubic-bezier(.2,.8,.2,1)';
  n.innerHTML = '<div style="flex:none;width:36px;height:36px;border-radius:9px;background:#2f6fde;color:#fff;display:grid;place-items:center;font-size:20px">✉</div>' +
    '<div style="min-width:0"><div style="display:flex;justify-content:space-between;color:#4a4f59;font-size:11.5px"><span>New e-mail</span><span>now</span></div>' +
    '<div style="font-weight:650;margin-top:2px">Institut Cardio Rhône</div><div>Interview invitation: Registered Nurse, Cardiac Care Unit</div></div>';
  document.body.append(n); requestAnimationFrame(() => requestAnimationFrame(() => { n.style.transform = 'none'; })); })()`;
const MAIL_WAIT = "(() => { document.getElementById('hero-mail')?.remove(); const s = document.createElement('style'); s.id = 'hero-wait'; s.textContent = '#activity-card, #activity-log, #activity-status, #activity-sub { visibility: hidden }'; document.head.append(s); document.getElementById('activity-toggle')?.click(); })()";
// No fade: the cut is the change (a fade read as another page to the stray-frame gate). The demo run has no log: its "No log available" row stays hidden.
const MAIL_SHOW = "(() => { const s = document.getElementById('hero-wait'); if (s) s.textContent = '#activity-log { display: none }'; })()";
export const VIDEOS = {
  'hero-onboarding': {kind: 'video', source: 'app', slide: 1, speed: 1.5, camera: 'steady', width: 1600, height: 1000, budget: 6e5, phone: PHONE,
    settings: {setupDone: false, wizardStep: 'ai'}, quiet: true,   // the first-run wizard from its first step (round 3, owner: "starts from step 3/5"); a still page: frames only when it changes
    env: {JOB_PILOTTO_DEMO_STRATEGY_DELAY: '2000'},   // the demo's pretend AI run (no AI called) lasts long enough to read "read your CV"
    shows: 'The setup: Free AI picked, her CV, a line on what she wants, the AI reading the CV, the strategy it proposes, confirmed',
    caption: 'Add your CV. Shape your search.', alt: 'The Jobadabra setup: a CV added, a note on what she wants, the AI reading the CV, then the proposed strategy with roles, level, work mode and an estimated salary, confirmed',
    steps: [{hold: 1.8, look: '.step[data-step=ai] .ui-choice[data-choice=free]', lookWidth: 900, zoom: 1.9, phoneLook: '.step[data-step=ai] .ui-choice[data-choice=free]', phoneLookWidth: 560, phoneZoom: 2.8, say: 'Step 1: an AI. Free AI needs no key', beat: 'Step 1: Free AI, already picked'},
      {tap: '#ai-save', then: jumpTo('cv')},
      {hold: 1.8, look: '.step[data-step=cv] .cv-drop', zoom: 1.9, phoneZoom: 2.8, cut: true, say: 'Step 2: her CV, read for roles and places', beat: 'Her CV added: the AI reads it for roles, places and salary'},
      {js: OPEN_BUILD}, {js: typeNote('Day shifts in cardiac care, around Lyon.')},
      {hold: 2.0, look: '#draft-intro .step-card', lookWidth: 760, zoom: 2.2, phoneZoom: 3, cut: true, say: 'She says what she wants, in one line', beat: 'She says what she wants in one line'},
      {click: '#draft-build'},
      {hold: 2.0, look: '#draft-loading', zoom: 2.2, phoneZoom: 3.2, cut: true, say: 'The AI reads her CV and drafts her goals', beat: 'The AI reads her CV and proposes her goals'},
      {hold: 3, look: '#setup-strategy-slot #strategy-main-goals', lookWidth: 1080, zoom: 1.64, phoneZoom: 2.6, cut: true, poster: true, say: 'Her strategy: roles, level, salary', beat: 'The proposal: roles, level, on-site, an estimated salary'},
      {tap: '#draft-save', zoom: 2.4, phoneZoom: 3, say: 'She confirms it'}, {hold: 0.8}]},
  hero: {kind: 'video', source: 'app', slide: 2, speed: 1.5, camera: 'steady', width: 1600, height: 1000, budget: 6.5e5, phone: {...PHONE, budget: 2.9e5},
    settings: {lastSearchAt: ''}, env: {JOB_PILOTTO_DEMO_SEARCH_SECONDS: String(SEARCH_SECONDS)},
    shows: 'Fresh from setup: Find jobs pressed, the search running, the list it filled, and her job opened with why it fits',
    caption: 'Jobs that fit, and why', alt: 'Jobadabra: the Find jobs card pressed, a search for nurse jobs in Lyon finding and scoring jobs, then one opened on its Match tab with why it fits',
    steps: [
      {go: 'jobs'},
      {hold: 1.8, look: '#find-card', lookWidth: 1040, zoom: 1.7, phoneLook: ['#find-card .magic-title', '#find-card .magic-go'], phoneZoom: 2.6, say: 'Fresh from setup: one button, Find jobs', beat: 'Her first visit to Jobs: the big Find jobs card'},
      {click: '#find-card .magic-go', say: 'She presses Find jobs'},
      {hold: SEARCH_SECONDS + 0.6, look: '#find-card', lookWidth: 1040, zoom: 1.7, phoneZoom: 2.6, cut: true, say: 'It reads employer sites and job boards', beat: 'Searching: sites read, jobs found and scored'},
      {js: TO_HER_ROW},
      {hold: 2.0, look: ['.job-row >> nth=0', ROW], lookWidth: 862, zoom: 2.2, phoneLook: [`${ROW} .fit-cell`, `${ROW} .role`], phoneZoom: 3, cut: true, say: 'Ranked by fit: her job among the best', beat: 'The list it filled, ranked by fit; her job among the best'},
      {click: ROW, say: 'She opens it'},
      {hold: 1.8, look: ['#job-panel h2', '#job-panel .jd-tabs'], zoom: 2, phoneZoom: 3, say: 'It opens beside the list', beat: 'Her job opens in a panel beside the list'},
      {click: '#job-panel .jd-tabs button:has-text("Match")'},
      {hold: 3, look: ['#job-panel h2', '#job-panel .fit-detail'], zoom: 2.2, phoneLook: '#job-panel .fit-card.tone-good', phoneZoom: 3.8, cut: true, poster: true, say: 'Match: why this job fits her', beat: 'Her job opened on Match: why it fits'},
    ]},
  'hero-fill-app': {kind: 'video', source: 'app', part: true, speed: 1.5, camera: 'steady', moment: 'applying', width: 1600, height: 1000, phone: PHONE,
    shows: 'Her job on Jobs, Apply pressed, the Applying page opening it in Chrome',
    steps: [{go: 'jobs'}, {js: scrollTo('Cardiac Care Unit')},
      {hold: 1.8, look: [`${ROW} .company`, `${ROW} button.row-main`], zoom: 2.2, phoneZoom: 3, say: 'Institut Cardio Rhône: she presses Apply', beat: 'Her job on Jobs: Apply'},
      {tap: `${ROW} button.row-main`, then: OPEN_HERS},   // the look holds the button: the press is seen without a camera move
      {hold: 2.0, look: ['#ss-job', '#ss-decision'], lookWidth: 760, zoom: 2.2, phoneZoom: 3, cut: true, say: 'Applying: it opens the job in Chrome', beat: 'Applying: the job opens in Chrome'}]},
  'hero-fill': {kind: 'video', source: 'extension', slide: 3, before: 'hero-fill-app', speed: 1.5, camera: 'steady', motion: 'reduce', width: 1600, height: 1000, budget: 5e5, phone: {...PHONE, budget: 2.3e5},
    shows: 'Apply pressed on her job, then the Jobadabra extension filling its application form; you review, then submit',
    caption: 'Fill applications with your details.', alt: 'An application form filled by the Jobadabra extension, its panel saying Ready to submit: review, then submit',
    steps: [{hold: 1.7, look: '#application', zoom: 1.3, phoneZoom: 2.2, say: 'In Chrome: the form, still empty', beat: "That job's application form, still empty"}, {fill: true}, {hold: 0.8},
      {hold: 3, look: 'panel', zoom: 1.8, phoneZoom: 2.6, poster: true, say: 'Filled with her details: she reviews it', beat: 'Filled with her details: Ready to submit, she reviews'}]},
  'hero-track': {kind: 'video', source: 'app', slide: 4, speed: 1.5, camera: 'steady', moment: 'later', width: 1600, height: 1000, budget: 7.5e5, phone: {...PHONE, budget: 3e5},
    shows: 'Two weeks later: the interview e-mail for that job, the call recorded and reviewed, what to practise, the next round on the calendar',
    caption: 'Your interviews and next steps, together.', alt: 'Jobadabra two weeks later: the Institut Cardio Rhône interview e-mail, the phone screen reviewed, interview patterns and practice, then the interview in the calendar',
    steps: [{go: 'focus'}, {js: MAIL_IN},
      {hold: 2.2, look: '#hero-mail', zoom: 2.2, phoneZoom: 3.2, say: 'Two weeks later, an e-mail lands', beat: 'Two weeks later: a new e-mail from Institut Cardio Rhône'},
      {js: MAIL_WAIT},
      {hold: 1.8, look: ['#activity-selected', '#check-mail'], zoom: 2.2, phoneLook: '#check-mail', phoneZoom: 3.2, cut: true, say: 'In Jobadabra, she checks Gmail', beat: 'In Jobadabra: Check Gmail now'},
      {tap: '#check-mail', then: MAIL_SHOW},
      {hold: 2.6, look: '#activity-card .mail-email', zoom: 1.9, phoneZoom: 3.4, cut: true, say: 'It reads it: interview scheduled', beat: 'The check reads it: the job moves to Interview scheduled'},
      {js: "document.getElementById('activity-toggle')?.click()"},   // the panel stays open across pages and covers the next one
      {go: 'interviews'}, {hold: 1.7, look: '#iv-drafts .iv-draft', lookWidth: 800, zoom: 2.2, phoneZoom: 3.4, cut: true, say: 'The phone screen, recorded on her Mac', beat: 'The phone screen with them, recorded on the Mac'},
      {click: '#iv-saved tr:has-text("Institut Cardio Rhône") button:has-text("Open review")'},
      {hold: 2.6, look: '#review-dialog', zoom: 2.3, phoneZoom: 3.2, cut: true, say: 'Its review: next step, what to work on', beat: 'Its review: next step, what to work on, strengths'},
      {press: 'Escape'}, {click: '#iv-insight .iv-insight-head'},
      {hold: 2.0, look: ['#iv-insight .iv-insight-title', '#iv-insight .iv-patterns'], lookWidth: 882, zoom: 2.2, phoneLook: '#iv-insight .iv-signal', phoneLookWidth: 560, phoneZoom: 3, cut: true, say: 'Patterns across her interviews', beat: 'Patterns across her interviews'},
      {hold: 1.8, look: '#iv-insight .iv-practice', zoom: 2.4, phoneZoom: 3.4, say: 'What to practise before the next round', beat: 'What to practise before the next round'},
      {go: 'calendar'}, {hold: 3, look: '#cal-upcoming > :first-child', zoom: 2.4, phoneZoom: 3.8, cut: true, poster: true, say: 'The next round, on her calendar', beat: 'The next round on the calendar: Wed 10:00'}]},
  'extension-fill': {kind: 'video', source: 'extension', width: 1600, height: 1000, budget: 1e6, phone: 720, gif: 720,
    shows: 'The Jobadabra extension filling an application form in the browser',
    caption: 'The extension fills the form', alt: 'An application form being filled by the Jobadabra extension, with its panel on the right',
    steps: [{hold: 1}, {fill: true}, {hold: 3.4, look: '#application', zoom: 1.7, poster: true}, {hold: 2.2, look: '#why', zoom: 2.2}, {hold: 2.4, look: 'panel', zoom: 2.2}]},
};

// Stills: one window each, after the steps. bd crops them 16:10 from the top-left, so each page keeps its action there.
export const STILLS = {
  'up-next': {steps: [{go: 'focus'}], shows: 'Focus: what to do today, most important first'},
  jobs: {steps: [{go: 'jobs'}], shows: 'Job matches ranked by fit, with why each one fits'},
  'job-drawer': {steps: [{go: 'jobs'}, {click: '.job-row'}], shows: 'One job opened: fit, why, the next step'},
  applying: {steps: [{go: 'sessions'}], shows: 'Applications in progress, and what each one needs from you'},
  calendar: {steps: [{go: 'calendar'}], shows: 'Interviews and follow-ups on a calendar'},
  interviews: {steps: [{go: 'interviews'}], shows: 'Interview notes and what to practise next'},
  strategy: {steps: [{go: 'strategy'}], shows: 'Where the search looks and what would bring more jobs'},
  activity: {steps: [{go: 'focus'}, {js: "document.getElementById('activity-toggle')?.click()"}], shows: 'Recent activity: every run and what it found'},
};

// Close-ups: one card each, captured at 2x. [selector, margin px]
export const SNIPS = {
  'up-next': {steps: [{go: 'focus'}], selector: 'section.card.is-lit', margin: 12, shows: 'The Up next card'},
  'job-row': {steps: [{go: 'jobs'}], selector: '.job-row', margin: 4, shows: 'One job in the list, with its fit score'},
  funnel: {steps: [{go: 'focus'}], selector: '#focus-funnel', margin: 12, shows: 'Today\'s progress'},
  sessions: {steps: [{go: 'sessions'}], selector: '#ss-decision', margin: 12, shows: 'An application that needs one answer from you'},
  calendar: {steps: [{go: 'calendar'}], selector: '.cal-layout', margin: 12, shows: 'The calendar'},
};

// The person in the default profile (desktop/demo, fictional) as the extension's stand-in app hands them to a form. A persona folder's
// media.json may replace any of it: {applicant, answers, job}.
export const DEFAULT_PERSONA = {
  applicant: {first_name: 'Alex', last_name: 'Morgan', full_name: 'Alex Morgan', email: 'alex.morgan@example.com', phone: '+41 79 555 01 23',
    location: 'Zurich', linkedin: 'https://www.linkedin.com/in/alex-morgan-example'},
  // The fictional form's own questions (form.html), answered as Claude would for this person.
  answers: {permit: 'Yes', notice: '2 months', why: 'Your payments platform runs on Kubernetes at a scale I know well, and I want to own its reliability end to end.'},
  job: {company: 'Lakeside Payments', title: 'DevOps Engineer', place: 'Geneva, Switzerland', city: 'Geneva'},
};


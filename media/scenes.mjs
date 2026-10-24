// What each product picture and video shows (media): the steps the recorder drives, by selector, and the manifest's words.
// Data only: re-record with another search profile by `node media/media.mjs --persona <folder>` (a copy of desktop/demo with its own media.json).
// Pieces and sizes agreed with the site redesign (session bd, 20 Oct 2026): hero, extension-fill, apply-split, stills, snips; dark only; captions
// live in the manifest, never burned into a video. Guard: desktop/test/media-scenes.test.js.

// Steps: {go: view} opens a sidebar page; {click: selector} glides the cursor there and clicks; {hold: seconds, look?: selector} waits while the
// camera may zoom to `look`; {press: key}; {fill: true} (extension) marks the tab as the app's Apply does, and the extension fills it. A caption belongs to the piece (the site writes its own text beside the video).
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
const OPEN_BUILD = "window.__jp.shared.rebuildAsked = true; const li = document.querySelector('#step-list li[data-step=draft]'); li.classList.add('jump'); li.click()";
const typeNote = text => `(() => { const box = document.getElementById('q-more'), words = ${JSON.stringify(text)}; let i = 0; box.value = '';
  const tick = setInterval(() => { box.value = words.slice(0, ++i); box.dispatchEvent(new Event('input', {bubbles: true})); if (i >= words.length) clearInterval(tick); }, 28); })()`;
// Widths (round 2, measured in CSS px on a 1800-px page): a look the camera shows whole must fit its zoom (1800 / zoom); a wider card names the left part
// it means (lookWidth), ending in a gap between columns: the job row's fit, role and company (862), the main goals' two value columns (1080).
// A page script that scrolls a job's row to the middle of the list.
const scrollTo = (title, behavior = 'instant') => `[...document.querySelectorAll('.job-row')].find(row => row.textContent.includes(${JSON.stringify(title)}))?.scrollIntoView({block: 'center', behavior: '${behavior}'})`;
// Find (round 2, owner 24 Oct 2026: "showcase the start of find jobs card/process ... to show we got to that list"): the Find jobs card's own states, fed
// through the app's hook (window.__jp.findCard, as desktop/scripts/find-card-shots.mjs does), on a timeline in recorded seconds; the app's refresh redraws
// the card within a second, so the state is fed again every 150 ms. "In conversation" is folded so the list sits under the card.
const FIND_LOG = ['Finding your first jobs…', 'First jobs: reading 15 of 212 employer sites first', 'First jobs: 9 found', 'Scored 3 of 9 job(s)',
  'First jobs: 3 scored in 21 s; the full search goes on', '⏳ Reading employer job sites: 120 of 212 · 3,412 jobs listed', 'Run counts: looked=3412 matches=14 scored=9 good=5'];
const FIND_STATES = [[0, {running: {kind: 'search', log: FIND_LOG.slice(0, 4)}, runs: [], lastSearchAt: ''}], [1.8, {running: {kind: 'search', log: FIND_LOG}, runs: [], lastSearchAt: ''}],
  [3.2, {running: null, runs: [{kind: 'search', ok: true, new: 14, log: ['Run counts: looked=3412 matches=14 scored=14 good=6']}], lastSearchAt: 'now', listed: 14, finishedHere: true}]];
const FIND_RUN = `(() => { const fold = [...document.querySelectorAll('details')].find(el => /In conversation/.test(el.querySelector('summary')?.textContent || '')); if (fold) fold.open = false;
  const states = ${JSON.stringify(FIND_STATES)}, t0 = Date.now(); clearInterval(window.__heroFeed);
  const feed = () => { const s = (Date.now() - t0) / 1000; const state = states.filter(([at]) => at <= s).at(-1)[1]; window.__jp.findCard(state.lastSearchAt === 'now' ? {...state, lastSearchAt: new Date().toISOString()} : state); };
  feed(); window.__heroFeed = setInterval(feed, 150); })()`;
export const VIDEOS = {
  'hero-onboarding': {kind: 'video', source: 'app', slide: 1, speed: 1.5, camera: 'steady', width: 1600, height: 1000, budget: 6e5, phone: PHONE,
    settings: {setupDone: false, wizardStep: 'cv'}, quiet: true,   // the first-run wizard on its CV step; a still page: frames only when it changes
    env: {JOB_PILOTTO_DEMO_STRATEGY_DELAY: '2000'},   // the demo's pretend AI run (no AI called) lasts long enough to read "read your CV"
    shows: 'The setup: her CV, a line on what she wants, the AI reading the CV, the strategy it proposes, confirmed',
    caption: 'Add your CV. Shape your search.', alt: 'The Jobadabra setup: a CV added, a note on what she wants, the AI reading the CV, then the proposed strategy with roles, level, work mode and an estimated salary, confirmed',
    steps: [{hold: 1.8, look: '.step[data-step=cv] .cv-drop', zoom: 1.9, phoneZoom: 2.8, beat: 'Her CV added: the AI reads it for roles, places and salary'},
      {js: OPEN_BUILD}, {js: typeNote('Day shifts in cardiac care, around Lyon.')},
      {hold: 2.0, look: '#draft-intro .step-card', lookWidth: 760, zoom: 2.2, phoneZoom: 3, cut: true, beat: 'She says what she wants in one line'},
      {click: '#draft-build'},
      {hold: 2.0, look: '#draft-loading', zoom: 2.2, phoneZoom: 3.2, cut: true, beat: 'The AI reads her CV and proposes her goals'},
      {hold: 3, look: '#setup-strategy-slot #strategy-main-goals', lookWidth: 1080, zoom: 1.64, phoneZoom: 2.6, cut: true, poster: true, beat: 'The proposal: roles, level, on-site, an estimated salary'},
      {tap: '#draft-save', zoom: 2.4, phoneZoom: 3}, {hold: 0.8}]},
  hero: {kind: 'video', source: 'app', slide: 2, speed: 1.5, camera: 'steady', width: 1600, height: 1000, budget: 6.5e5, phone: {...PHONE, budget: 2.9e5},
    shows: 'A search running, its result, the list it filled, and one job opened with why it fits',
    caption: 'Jobs that fit, and why', alt: 'Jobadabra: a search for nurse jobs in Lyon finds and scores jobs, then one opened on its Match tab with why it fits',
    steps: [
      {go: 'jobs'}, {js: FIND_RUN},
      {hold: 4.4, look: '#find-card', lookWidth: 1040, zoom: 1.7, phoneZoom: 2.6, beat: 'Find jobs runs: found, scored, strong matches climb, then Search done'},
      {js: `clearInterval(window.__heroFeed); ${scrollTo('Cardiac Care Unit', 'smooth')}`},
      {hold: 2.0, look: ['.job-row >> nth=0', ROW], lookWidth: 862, zoom: 2.2, phoneLook: [`${ROW} .fit-cell`, `${ROW} .role`], phoneZoom: 3, beat: 'The list it filled, ranked by fit; her job among the best'},
      {click: ROW}, {click: '#job-panel .jd-tabs button:has-text("Match")'},
      {hold: 3, look: ['#job-panel h2', '#job-panel .fit-detail'], zoom: 2.2, phoneLook: '#job-panel .fit-card.tone-good', phoneZoom: 3.8, cut: true, poster: true, beat: 'Her job opened on Match: why it fits'},
    ]},
  'hero-fill': {kind: 'video', source: 'extension', slide: 3, speed: 1.5, camera: 'steady', motion: 'reduce', width: 1600, height: 1000, budget: 5e5, phone: {...PHONE, budget: 2.3e5},
    shows: 'The Jobadabra extension filling that job\'s application form; you review, then submit',
    caption: 'Fill applications with your details.', alt: 'An application form filled by the Jobadabra extension, its panel saying Ready to submit: review, then submit',
    steps: [{hold: 1.7, look: '#application', zoom: 1.3, phoneZoom: 2.2, beat: "That job's application form, still empty"}, {fill: true}, {hold: 0.8},
      {hold: 3, look: 'panel', zoom: 1.8, phoneZoom: 2.6, poster: true, beat: 'Filled with her details: Ready to submit, she reviews'}]},
  'hero-track': {kind: 'video', source: 'app', slide: 4, speed: 1.5, camera: 'steady', moment: 'later', width: 1600, height: 1000, budget: 7.5e5, phone: {...PHONE, budget: 3e5},
    shows: 'Two weeks later: the interview e-mail for that job, the call recorded and reviewed, what to practise, the next round on the calendar',
    caption: 'Your interviews and next steps, together.', alt: 'Jobadabra two weeks later: the Institut Cardio Rhône interview e-mail, the phone screen reviewed, interview patterns and practice, then the interview in the calendar',
    steps: [{go: 'focus'}, {js: "document.getElementById('activity-toggle')?.click()"},
      {hold: 2.6, look: '#activity-card .mail-email', zoom: 1.9, phoneZoom: 3.4, beat: 'A Gmail check: Institut Cardio Rhône wrote, the job moves to Interview scheduled'},
      {js: "document.getElementById('activity-toggle')?.click()"},   // the panel stays open across pages and covers the next one
      {go: 'interviews'}, {hold: 1.7, look: '#iv-drafts .iv-draft', lookWidth: 800, zoom: 2.2, phoneZoom: 3.4, cut: true, beat: 'The phone screen with them, recorded on the Mac'},
      {click: '#iv-saved tr:has-text("Institut Cardio Rhône") button:has-text("Open review")'},
      {hold: 2.6, look: '#review-dialog', zoom: 2.3, phoneZoom: 3.2, cut: true, beat: 'Its review: next step, what to work on, strengths'},
      {press: 'Escape'}, {click: '#iv-insight .iv-insight-head'},
      {hold: 2.0, look: ['#iv-insight .iv-insight-title', '#iv-insight .iv-patterns'], lookWidth: 882, zoom: 2.2, phoneLook: '#iv-insight .iv-signal', phoneLookWidth: 560, phoneZoom: 3, cut: true, beat: 'Patterns across her interviews'},
      {hold: 1.8, look: '#iv-insight .iv-practice', zoom: 2.4, phoneZoom: 3.4, beat: 'What to practise before the next round'},
      {go: 'calendar'}, {hold: 3, look: '#cal-upcoming > :first-child', zoom: 2.4, phoneZoom: 3.8, cut: true, poster: true, beat: 'The next round on the calendar: Wed 10:00'}]},
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


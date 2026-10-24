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
export const VIDEOS = {
  'hero-onboarding': {kind: 'video', source: 'app', slide: 1, speed: 1.5, camera: 'steady', width: 1600, height: 1000, budget: 6e5, phone: PHONE,
    settings: {setupDone: false, wizardStep: 'cv'}, quiet: true,   // the first-run wizard on its CV step; a still page: frames only when it changes
    shows: 'The setup: your CV, the search strategy it proposes, and you confirming it',
    caption: 'Add your CV. Shape your search.', alt: 'The Jobadabra setup: a CV added, then the proposed strategy with roles, level, work mode and an estimated salary, confirmed',
    steps: [{hold: 1.7, look: '.step[data-step=cv] .card:visible >> nth=0', zoom: 2.1, phoneZoom: 3.4},
      {js: `document.querySelector('#step-list li[data-step=draft]').classList.add('jump'); document.querySelector('#step-list li[data-step=draft]').click()`},   // demo mode keeps Continue disabled (no real CV)
      {hold: 3, look: '#setup-strategy-slot #strategy-main-goals', zoom: 2, phoneZoom: 3.6, cut: true, poster: true},
      {tap: '#draft-save', zoom: 2, phoneZoom: 2.4}, {hold: 0.9}]},
  hero: {kind: 'video', source: 'app', slide: 2, speed: 1.5, camera: 'steady', width: 1600, height: 1000, budget: 6.5e5, phone: PHONE,
    shows: 'Jobs ranked by fit; one opened, with why it fits',
    caption: 'Jobs that fit, and why', alt: 'Jobadabra: nurse jobs in Lyon scored out of 100, one opened on its Match tab with why it fits',
    steps: [
      {go: 'jobs'}, {js: "[...document.querySelectorAll('.job-row')].find(row => row.textContent.includes('Cardiac Care Unit'))?.scrollIntoView({block: 'center', behavior: 'instant'})"},
      {hold: 1.7, look: ROW, zoom: 1.5, phoneZoom: 2.7},
      {click: ROW}, {click: '#job-panel .jd-tabs button:has-text("Match")'},
      {hold: 3, look: ['#job-panel h2', '#job-panel .fit-card.tone-good'], zoom: 2.2, phoneLook: '#job-panel .fit-card.tone-good', phoneZoom: 3.8, poster: true},
    ]},
  'hero-fill': {kind: 'video', source: 'extension', slide: 3, speed: 1.5, camera: 'steady', motion: 'reduce', width: 1600, height: 1000, budget: 6e5, phone: PHONE,
    shows: 'The Jobadabra extension filling that job\'s application form; you review, then submit',
    caption: 'Fill applications with your details.', alt: 'An application form filled by the Jobadabra extension, its panel saying Ready to submit: review, then submit',
    steps: [{hold: 1.7, look: '#application', zoom: 1.3, phoneZoom: 2.2}, {fill: true}, {hold: 0.8},
      {hold: 3, look: 'panel', zoom: 1.8, phoneZoom: 2.6, poster: true}]},
  'hero-track': {kind: 'video', source: 'app', slide: 4, speed: 1.5, camera: 'steady', moment: 'later', width: 1600, height: 1000, budget: 6.5e5, phone: PHONE,
    shows: 'Two weeks later: that job\'s interview leads Focus, then its place on the calendar',
    caption: 'Your interviews and next steps, together.', alt: 'Jobadabra Focus: prepare for the Institut Cardio Rhône interview, then the interview in the calendar\'s Coming up',
    steps: [{go: 'focus'}, {hold: 1.7, look: 'section.card.is-lit', zoom: 1.4, phoneZoom: 2.2},
      {hold: 2.0, look: '#focus-list .focus-item:has-text("Prepare for Institut Cardio Rhône")', zoom: 2.2, phoneZoom: 3.6},
      {go: 'calendar'}, {hold: 3, look: '#cal-upcoming > :first-child', zoom: 2.6, phoneZoom: 3.8, cut: true, poster: true}]},
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


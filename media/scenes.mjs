// What each product picture and video shows (desktop/scripts/media): the steps the recorder drives, by selector, and the manifest's words.
// Data only: re-record with another search profile by `node scripts/media/media.mjs --persona <folder>` (a copy of desktop/demo with its own media.json).
// Pieces and sizes agreed with the site redesign (session bd, 20 Oct 2026): hero, extension-fill, apply-split, stills, snips; dark only; captions
// live in the manifest, never burned into a video. Guard: desktop/test/media-scenes.test.js.

// Steps: {go: view} opens a sidebar page; {click: selector} glides the cursor there and clicks; {hold: seconds, look?: selector} waits while the
// camera may zoom to `look`; {press: key}; {fill: true} (extension) marks the tab as the app's Apply does, and the extension fills it. A caption belongs to the piece (the site writes its own text beside the video).
export const nav = view => `.nav[data-view=${view}]:not([data-settings])`;

// The hero is a carousel of four short clips (owner, 21 Oct 2026, in this order): the first run, today's app, the extension filling a form, the
// application and interview side. `slide` is the clip's place in it; the page plays each to its end and moves on.
export const VIDEOS = {
  'hero-onboarding': {kind: 'video', source: 'app', slide: 1, width: 1600, height: 1000, budget: 8e5, phone: 720,
    settings: {setupDone: false, wizardStep: 'draft'}, quiet: true,   // the setup's strategy step (what it proposes from the CV); a still page: frames only when it changes
    shows: 'The setup: the search strategy it proposes from your CV, roles and places',
    caption: 'Set up in a few minutes', alt: 'The Jobadabra setup: the search strategy proposed from your CV, with target roles, locations and search terms',
    steps: [{hold: 2, poster: true}, {hold: 2.4, look: '.step[data-step=draft] .card:visible >> nth=0'}]},
  hero: {kind: 'video', source: 'app', slide: 2, width: 1600, height: 1000, budget: 1.2e6, phone: 720,
    shows: 'The app: today\'s next steps, jobs ranked by fit, one job opened with why it fits',
    caption: 'Your job search, run for you', alt: 'Jobadabra on a Mac: the Focus page, the ranked job list and one job opened',
    steps: [
      {go: 'focus'}, {hold: 1.5, look: 'section.card.is-lit'},
      {click: nav('jobs')}, {hold: 1.5, look: '#jobs-body'},
      {click: '.job-row'}, {hold: 2.2, look: '#job-panel'},
      {press: 'Escape'},
    ]},
  'extension-fill': {kind: 'video', source: 'extension', slide: 3, width: 1600, height: 1000, budget: 1e6, phone: 720, gif: 720,
    shows: 'The Jobadabra extension filling an application form in the browser',
    caption: 'The extension fills the form', alt: 'An application form being filled by the Jobadabra extension, with its panel on the right',
    steps: [{hold: 1}, {fill: true}, {hold: 3, look: 'form', poster: true}, {hold: 2, look: 'panel'}]},
  'hero-track': {kind: 'video', source: 'app', slide: 4, width: 1600, height: 1000, budget: 1.2e6, phone: 720,
    shows: 'Applications in progress, interviews and the calendar',
    caption: 'Every reply and interview, tracked', alt: 'Jobadabra: applications in progress, then interviews, then the calendar',
    steps: [{go: 'sessions'}, {hold: 1.6, poster: true}, {click: nav('interviews')}, {hold: 1.6}, {click: nav('calendar')}, {hold: 1.8}]},
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


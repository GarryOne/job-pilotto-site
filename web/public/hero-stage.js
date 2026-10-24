// The landing hero's stage (index.html #hero-stage; owner, 24 Oct 2026): four short clips of one made-up person and one job, played in turn on one stage.
// A clip ends, the next cuts in once its first frame is decoded (owner, 24 Oct 2026: "smooth transitions without blank frames or overlapping screens":
// the old clip stays on screen until then, never its end-frame poster, never two screens at once); its caption goes above the stage and its step's line fills as it plays. The steps jump to a clip, the pause button
// holds it (as do a hidden tab and a stage scrolled out of view); the next clip is fetched while the current one plays. Phones (the 720 copies, 4:3) get
// their own posters. With reduced motion nothing plays by itself: the posters show, a step switches them, play starts a clip. Guarded by test/web/landing.test.js.
const root = document.getElementById('hero-stage');
const clips = root ? [...root.querySelectorAll('video.slide')] : [];
const steps = root ? [...root.querySelectorAll('.stage-steps button:not(.stage-pause)')] : [];
const pause = root?.querySelector('.stage-pause');
const cap = root?.querySelector('.stage-cap');
const later = root?.querySelector('.stage-later');
const PAUSE = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M4 3h3v10H4zm5 0h3v10H9z"/></svg>';
const PLAY = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M5 3l8 5-8 5z"/></svg>';

if (root && clips.length) {
  const phone = matchMedia('(max-width: 720px)').matches;
  if (phone) clips.forEach(clip => { if (clip.dataset.phonePoster) clip.poster = clip.dataset.phonePoster; });
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let on = 0, paused = still, hidden = false, away = false;
  const warm = i => { const clip = clips[i % clips.length]; if (clip.preload !== 'auto') { clip.preload = 'auto'; clip.load(); } };
  const playing = () => !paused && !hidden && !away;

  let ask = 0;
  // Ready to show: the clip has its frame at 0 decoded. Gives up after 3 s (a slow network): the cut then shows the poster rather than hang.
  const ready = clip => new Promise(done => {
    const go = () => { clearTimeout(late); clip.removeEventListener('seeked', check); clip.removeEventListener('loadeddata', check); done(); };
    const check = () => { if (clip.readyState >= 2 && !clip.seeking) go(); };
    const late = setTimeout(go, 3000);
    clip.addEventListener('seeked', check); clip.addEventListener('loadeddata', check);
    warm(clips.indexOf(clip));
    try { clip.currentTime = 0; } catch { /* no metadata yet: it starts at 0 */ }
    check();
  });

  async function show(i) {
    const next = (i + clips.length) % clips.length, mine = ++ask;
    if (playing()) await ready(clips[next]);   // paused (or reduced motion): the poster is the picture, switch at once
    if (mine !== ask) return;   // a later step click won
    on = next;
    clips.forEach((clip, k) => {
      clip.classList.toggle('is-on', k === on);
      if (k !== on) clip.pause();
    });
    steps.forEach((step, k) => {
      if (k === on) step.setAttribute('aria-current', 'true'); else step.removeAttribute('aria-current');
      step.style.setProperty('--done', k < on ? '1' : '0');
      step.style.setProperty('--played', '0');
    });
    const clip = clips[on];
    cap.querySelector('b').textContent = clip.dataset.cap || '';
    cap.querySelector('span').textContent = clip.dataset.sub || '';
    if (later) { later.textContent = clip.dataset.later || ''; later.hidden = !clip.dataset.later; }
    if (playing()) clip.play().catch(() => {});
  }

  clips.forEach((clip, k) => {
    clip.addEventListener('playing', () => { if (k === on) warm(on + 1); });
    clip.addEventListener('ended', () => { if (k === on && playing()) show(on + 1); });
  });
  steps.forEach((step, k) => step.addEventListener('click', () => show(k)));
  function setPaused(value) {
    paused = value;
    pause.innerHTML = paused ? PLAY : PAUSE;
    pause.setAttribute('aria-label', paused ? 'Play' : 'Pause');
    if (playing()) clips[on].play().catch(() => {}); else clips[on].pause();
  }
  pause.addEventListener('click', () => setPaused(!paused));
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; setPaused(paused); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { away = !entry.isIntersecting; setPaused(paused); }).observe(root);

  // The step's line: how far the current clip has played.
  const line = () => {
    const clip = clips[on], step = steps[on];
    if (step && clip.duration) step.style.setProperty('--played', String(Math.min(1, clip.currentTime / clip.duration)));
    requestAnimationFrame(line);
  };
  setPaused(still);
  show(0);
  requestAnimationFrame(line);
}

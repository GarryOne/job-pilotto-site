// The landing hero's carousel (index.html #hero-carousel): four short clips, each played to its end, then a soft crossfade to the next.
// Hover or keyboard focus pauses it, the dots jump to a clip, a hidden tab or reduced motion keeps the first clip's poster still. Guarded by site/test/web/landing.test.js.
(() => {
  const root = document.getElementById('hero-carousel');
  if (!root) return;
  const clips = [...root.querySelectorAll('video.slide')];
  const dots = [...root.querySelectorAll('.dots button')];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || clips.length < 2) { root.classList.add('is-still'); return; }
  let at = 0, paused = false;
  const warm = i => { const next = clips[(i + 1) % clips.length]; if (next.preload !== 'auto') { next.preload = 'auto'; next.load(); } };
  function show(i, play = true) {
    clips[at].classList.remove('is-on'); clips[at].pause();
    at = (i + clips.length) % clips.length;
    clips.forEach((clip, k) => { clip.classList.toggle('is-on', k === at); });
    dots.forEach((dot, k) => (k === at ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current')));
    clips[at].currentTime = 0;
    if (play && !paused && !document.hidden) clips[at].play().catch(() => {});
    warm(at);
  }
  clips.forEach((clip, k) => clip.addEventListener('ended', () => { if (k === at) show(at + 1); }));
  dots.forEach((dot, k) => dot.addEventListener('click', () => show(k)));
  const hold = on => { paused = on; if (on) clips[at].pause(); else if (!document.hidden) clips[at].play().catch(() => {}); };
  root.addEventListener('mouseenter', () => hold(true));
  root.addEventListener('mouseleave', () => hold(false));
  root.addEventListener('focusin', () => hold(true));
  root.addEventListener('focusout', () => hold(false));
  document.addEventListener('visibilitychange', () => hold(document.hidden || paused));
  clips[0].play().catch(() => {});
  warm(0);
})();

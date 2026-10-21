// The landing hero's carousel (index.html #hero-carousel): four short clips on one track. It never stops: a slide comes in fast, drifts slowly while it is
// centred and its clip plays, then leaves fast (the easing is hero-track.js). Hover or keyboard focus holds it, the dots jump to a clip, a hidden tab
// holds it, and with reduced motion (or a browser without modules) the first clip's poster stays. Guarded by test/web/landing.test.js.
import {offset, position, timeFor} from './hero-track.js';

const root = document.getElementById('hero-carousel');
const clips = root ? [...root.querySelectorAll('video.slide')] : [];
const dots = root ? [...root.querySelectorAll('.dots button')] : [];
if (root && (matchMedia('(prefers-reduced-motion: reduce)').matches || clips.length < 2)) root.classList.add('is-still');
else if (root) {
  const n = clips.length, playing = new Set();
  let t = 0, last = null, held = false, shown = -1;
  root.classList.add('is-moving');
  const hold = on => { held = on; if (on) clips.forEach(clip => clip.pause()); else playing.forEach(i => clips[i].play().catch(() => {})); };

  function draw() {
    const p = position(t);
    clips.forEach((clip, i) => {
      const away = offset(i, p, n);
      clip.style.transform = `translate3d(${(away * 100).toFixed(2)}%, 0, 0)`;
      if (Math.abs(away) < 1.6 && clip.preload !== 'auto') { clip.preload = 'auto'; clip.load(); }   // the next clip is fetched as it nears
      if (Math.abs(away) < 0.55 && !playing.has(i)) { playing.add(i); clip.currentTime = 0; if (!held) clip.play().catch(() => {}); }
      else if (Math.abs(away) >= 1 && playing.has(i)) { playing.delete(i); clip.pause(); }
    });
    const now = ((Math.round(p) % n) + n) % n;
    if (now !== shown) { shown = now; dots.forEach((dot, k) => (k === now ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current'))); }
  }
  function frame(stamp) {
    if (last != null && !held && !document.hidden) t += Math.min(stamp - last, 100);   // a long gap (a busy tab) never jumps the track
    last = stamp;
    draw();
    requestAnimationFrame(frame);
  }
  dots.forEach((dot, k) => dot.addEventListener('click', () => { t = timeFor(k, t, n); }));
  root.addEventListener('mouseenter', () => hold(true));
  root.addEventListener('mouseleave', () => hold(false));
  root.addEventListener('focusin', () => hold(true));
  root.addEventListener('focusout', () => hold(false));
  document.addEventListener('visibilitychange', () => hold(document.hidden));
  draw();
  requestAnimationFrame(frame);
}

// The hero carousel's motion, pure (hero-carousel.js draws it): the owner's "fast as a slide comes to the centre, slow while it is centred, fast again as
// the next one comes": one continuous track, never a jump and a pause. Position p (in slides) at time t: each period moves one slide, slowest at its start and end.
export const PERIOD = 3000;   // ms per slide: the clips run about 3 s
const SLOW = 0.92;            // 1 stops dead at the centre, 0 is a steady glide; the centre still drifts at (1 - SLOW) of the average speed

export function position(t, period = PERIOD, slow = SLOW) {
  const whole = Math.floor(t / period), u = t / period - whole;
  return whole + u - (slow * Math.sin(2 * Math.PI * u)) / (2 * Math.PI);
}

// How far slide i is from the centre when the track is at p, in slides, wrapped so the last slide sits left of the first: -n/2 <= offset < n/2.
export function offset(i, p, n) {
  const wrapped = (((i - p) % n) + n) % n;
  return wrapped >= n / 2 ? wrapped - n : wrapped;
}

// The time at which slide `index` is centred next at or after t, less `lead` periods so it glides in (a dot was clicked).
export function timeFor(index, t, n, period = PERIOD, lead = 0.4) {
  const here = Math.ceil(t / period);
  const target = here + ((((index - here) % n) + n) % n);
  return Math.max(t, (target - lead) * period);
}

// Where a slide sits when it is `away` slides from the centre (offset above): the centred one full size, the neighbours smaller, dimmer and further back,
// the ones beyond them fade out (the page's mask cuts and fades the edges). `step` is the distance between neighbours in slide widths. Pure.
export function place(away, step = 58) {
  const near = Math.abs(away), side = Math.min(near, 1);
  const fade = near <= 1 ? 1 - 0.35 * near : Math.max(0, 0.65 * (1 - (near - 1) / 0.6));
  return {x: away * step, scale: 1 - 0.28 * side, opacity: fade, z: 20 - Math.round(near * 8)};
}

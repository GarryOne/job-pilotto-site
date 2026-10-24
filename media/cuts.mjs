// Cuts out the frames between a hero step's page change and the moment its next look is on screen (media): those frames showed the old framing over a
// new page (owner, 24 Oct 2026: "a small glitch in the first clip, showing something about Sonnet") or the new framing over a page still changing.
// Pure; run by media.mjs after fromFirstLook. Guard: desktop/test/media-camera.test.js ("a cut look starts when its content is on screen").
import {FIRST_LAG, frameAt} from './camera.mjs';

const round = t => Number(t.toFixed(3));

// The recorder sees a look in the page a moment before a frame of it arrives (a re-record still cut one frame early, onto the old page): each 'ready'
// moves to the first frame recorded after it (within a second). Pure.
export function readyAtFrames(log) {
  return {...log, events: log.events.map(event => {
    if (event.type !== 'ready') return event;
    const frame = log.frames.find(f => f.t > event.t);
    return frame && frame.t - event.t <= 1 ? {...event, t: frame.t} : event;
  })};
}

// Each `cut` look's span to drop: from the first page change after the previous look (a mark or a press) to its content on screen (the recorder's
// 'ready' event, moved to its first frame by readyAtFrames, else the hold's start + FIRST_LAG). -> [{from, to}] in time order. Pure.
export function changeSpans(log) {
  const spans = [];
  log.events.forEach((event, i) => {
    if (event.type !== 'hold' || !event.cut || !event.box) return;
    const earlier = log.events.slice(0, i), prev = earlier.filter(e => e.type === 'hold').at(-1);
    if (!prev) return;
    const change = earlier.find(e => (e.type === 'mark' || e.type === 'press') && e.t > prev.t);
    if (!change) return;
    const ready = earlier.find(e => e.type === 'ready' && e.t >= change.t);
    const to = Math.min(ready ? ready.t : event.t + FIRST_LAG, event.t + Math.max(0, event.s - 0.5));
    if (to - change.t > 0.05) spans.push({from: change.t, to});
  });
  return spans;
}

// The log without the recorded span [a, b]: the frame on screen at b is shown from a, later frames and events move up by b - a; the page change at a
// stays (the camera cuts there), a hold inside the span starts at a, shorter by what was cut; other events inside are dropped. Pure.
export function cutOut(log, a, b) {
  const d = b - a, shown = log.frames[frameAt(log.frames, b)];
  const frames = log.frames.filter(frame => frame.t <= a);
  if (shown.t > a) frames.push({...shown, t: a});   // after any frame at a: the camera cuts at a too
  for (const frame of log.frames) if (frame.t > b) frames.push({...frame, t: round(frame.t - d)});
  const events = [];
  for (const event of log.events) {
    if (event.t < a || (event.t === a && event.type !== 'hold')) events.push(event);
    else if (event.t > b) events.push({...event, t: round(event.t - d)});
    else if (event.type === 'hold') events.push({...event, t: a, s: Math.max(0.1, round(event.s - (b - event.t)))});
  }
  return {...log, frames, events};
}

// Every cut look's span dropped, the last first so earlier times stay put. Pure.
export function dropChanges(raw) {
  const log = readyAtFrames(raw);
  return changeSpans(log).reverse().reduce((out, span) => cutOut(out, span.from, span.to), log);
}

// The gate on the played clip (round 3, owner 24 Oct 2026: "check against yourself"): around each cut look, the frames from the previous look's end to
// the cut must still show the previous look's page, and the first half second after it the new look's page; a frame of another page differs from its
// look's beat frame by far more than typing, a cursor or a progress bar (measured: clean cuts <= 0.7, the five glitches 5.6 to 16.9, in mean grey levels
// on a 64x40 thumbnail). thumb(j): video frame j's thumbnail (Uint8Array); speed: how much faster the clip plays; log: after dropChanges.
// -> [{look, at, side, diff}] for each cut with a stray frame (its worst one). Pure.
export const STRAY_MAX = 3;
export const THUMB = {w: 64, h: 40};
const meanDiff = (a, b) => { let sum = 0; for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]); return sum / a.length; };
export function strayFrames({log, thumb, frames, speed = 1, fps = 30, max = STRAY_MAX}) {
  const holds = log.events.filter(event => event.type === 'hold' && event.box);
  const video = t => Math.min(frames - 1, Math.round(t / speed * fps));
  const beat = hold => video(hold.t + hold.s * 0.9);
  const out = [];
  holds.forEach((hold, k) => {
    if (!hold.cut || !k) return;
    const prev = holds[k - 1];
    const after = event => event.t > prev.t && event.t <= hold.t + FIRST_LAG;
    const cut = (log.events.find(e => (e.type === 'mark' || e.type === 'press') && after(e)) ?? log.events.find(e => e.type === 'ready' && after(e)) ?? hold).t;
    let worst = null;
    const look = (from, to, ref, side) => { for (let j = from; j < to; j++) { const diff = meanDiff(thumb(j), thumb(ref)); if (diff > max && (!worst || diff > worst.diff)) worst = {look: hold.look, at: Number((j / fps).toFixed(2)), side, diff: Number(diff.toFixed(1))}; } };
    look(video(prev.t + prev.s), video(cut), beat(prev), 'before');
    look(video(cut) + 1, Math.min(frames, video(cut) + Math.round(fps / 2)), beat(hold), 'after');
    if (worst) out.push(worst);
  });
  return out;
}

// The hero's on-video captions (round 3, owner 24 Oct 2026: "we need to explain the journey better"): a scene step's `say` shows from that step's
// moment (a cut look's from its cut) until the next caption, as a band the renderer draws (render.cjs). A step's `tag` (round 4, owner 24 Oct 2026: "we need to
// highlight each of the steps") names where the frame is (SET UP 1/5, JOBS, CHROME) in the same band, kept until a step names another. Pure.
// Guard: desktop/test/media-captions.test.js.
import {cutTime} from './cuts.mjs';

export const SAY_MAX = 44;     // characters: one line, read in about a second
export const SAY_FADE = 0.25;  // recorded seconds a caption fades in
export const TAG_MAX = 12;     // characters: a place's name or a step count, never a sentence

// log (after dropChanges) -> [{t, say, tag?}] in time order, each with the latest tag so far. Pure.
export function captionTimes(log) {
  let tag;
  return log.events.map((event, i) => (event.say ? {t: event.type === 'hold' && event.cut ? cutTime(log, i) : event.t, say: event.say, tag: event.tag} : null))
    .filter(Boolean).sort((a, b) => a.t - b.t)
    .map(({tag: own, ...caption}) => { tag = own || tag; return tag ? {...caption, tag} : caption; });
}

// The caption on screen at recorded time t: {say, sayAge} or {} before the first. Pure.
export function captionAt(list, t) {
  const on = list.filter(caption => caption.t <= t + 1e-9).at(-1);
  return on ? {say: on.say, sayAge: Number((t - on.t).toFixed(3)), ...(on.tag ? {tag: on.tag} : {})} : {};
}

// The caption's size in output pixels: the desktop copy is seen at about 70% of its width, the phone copy at about 54% (390 of 720 px). Pure.
export const captionSize = (width, phone) => Math.round(width * (phone ? 0.056 : 0.0175));

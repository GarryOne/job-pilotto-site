// The product videos' camera (media/camera.mjs): zooms frame each hold's box, clicks pull back so the cursor's trip shows,
// the view never leaves the page, every output frame maps to a recorded frame.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cameraAt, cameraKeys, clipTo, cursorAt, frameAt, MAX_ZOOM, PHONE_GAIN, PHONE_MAX, posterTime, renderPlan} from '../../media/camera.mjs';

const viewport = {w: 1800, h: 1125};
const box = {x: 250, y: 500, width: 1200, height: 540};
const log = {viewport, frames: [0, 0.5, 1, 2, 3, 4, 5].map((t, i) => ({t, file: `f${i}.jpg`})),
  events: [{t: 0.2, type: 'hold', box}, {t: 2.5, type: 'click', box: {x: 10, y: 100, width: 100, height: 30}}, {t: 3.2, type: 'press', box: {x: 10, y: 100, width: 100, height: 30}}]};

test('a hold zooms onto its box; a click zooms onto its target and the camera never pulls back to the whole screen between steps', () => {
  const keys = cameraKeys(log);
  assert.ok(keys.some(key => key.z > 1 && key.z <= MAX_ZOOM), 'zoomed, within the cap');
  assert.equal(cameraAt(keys, 0, viewport).w, viewport.w, 'the whole screen first, for context');
  assert.ok(cameraAt(keys, 2, viewport).w < viewport.w, 'zoomed during the hold');
  const click = {x: 10, y: 100, width: 100, height: 30};
  const view = cameraAt(keys, 3.2, viewport);
  assert.ok(view.w < viewport.w && view.x === 0 && click.x >= view.x && click.x + click.width <= view.x + view.w, 'zoomed on the click, in the left corner');
  for (let t = 0.8; t < 5; t += 0.1) assert.ok(cameraAt(keys, t, viewport).w < viewport.w, `no full screen at ${t.toFixed(1)} s`);
});

test('a click in a corner puts the camera in that corner; a later hold glides to its own box after the click was seen', () => {
  const events = [{t: 1, type: 'click', box: {x: 1700, y: 1050, width: 80, height: 40}}, {t: 1.7, type: 'press', box: {x: 1700, y: 1050, width: 80, height: 40}},
    {t: 2, type: 'hold', box: {x: 50, y: 100, width: 400, height: 300}, zoom: 2}];
  const keys = cameraKeys({viewport, events});
  const atClick = cameraAt(keys, 1.7, viewport);
  assert.ok(atClick.x + atClick.w === viewport.w && atClick.y + atClick.h === viewport.h, 'bottom-right corner');
  const later = cameraAt(keys, 4, viewport);
  assert.ok(later.x === 0 && later.y < 200, 'then the top-left box');
  assert.ok(cameraAt(keys, 1.8, viewport).x >= viewport.w / 2, 'still on the click just after the press');
});

test('a box wider than the zoomed view is framed from its left edge', () => {
  const wide = {x: 200, y: 600, width: 1500, height: 60};
  const view = cameraAt(cameraKeys({viewport, events: [{t: 0, type: 'hold', box: wide, zoom: 1.5}]}), 3, viewport);
  assert.ok(Math.abs(view.x - wide.x) < 1, `the view starts at the box's left edge (${view.x})`);
});

test('a sped-up clip stretches camera moves in recorded time, so on screen they last as long', () => {
  const slow = cameraKeys({viewport, events: [{t: 5, type: 'hold', box}]}).at(-1).t, fast = cameraKeys({viewport, events: [{t: 5, type: 'hold', box}], speed: 3}).at(-1).t;
  assert.ok(fast > slow);
});

test('the view stays inside the page at every moment, and a hold may carry its own zoom (the director\'s plan)', () => {
  const keys = cameraKeys({viewport, events: [{t: 0, type: 'hold', box: {x: 1700, y: 1000, width: 90, height: 90}}]});
  for (let t = 0; t < 3; t += 0.05) {
    const view = cameraAt(keys, t, viewport);
    assert.ok(view.x >= 0 && view.y >= 0 && view.x + view.w <= viewport.w + 1e-9 && view.y + view.h <= viewport.h + 1e-9, `t=${t.toFixed(2)}`);
  }
  const own = cameraKeys({viewport, events: [{t: 0, type: 'hold', box, zoom: 1.2}]});
  assert.equal(own.at(-1).z, 1.2);
  const none = cameraKeys({viewport, events: [{t: 1, type: 'hold', box, zoom: 1}]});
  assert.equal(none.at(-1).z, 1, 'zoom 1 keeps the whole screen');
});

test('the cursor glides to the click target and reaches it at the press; the ring starts at the press', () => {
  const before = cursorAt(log.events, 2.4, viewport), at = cursorAt(log.events, 3.2, viewport), after = cursorAt(log.events, 3.5, viewport);
  assert.equal(before.press, null);
  assert.ok(Math.abs(at.x - 60) < 1 && Math.abs(at.y - 115) < 1, `at the target (${at.x}, ${at.y})`);
  assert.ok(Math.abs(after.press - 0.3) < 1e-9);
});

test('every output frame names a recorded frame at or before its time, at the given rate', () => {
  assert.equal(frameAt(log.frames, 0.75), 1);
  assert.equal(frameAt(log.frames, 99), log.frames.length - 1);
  const plan = renderPlan(log, 10);
  assert.equal(plan.length, 51);
  assert.equal(plan[0].file, 'f0.jpg');
  assert.equal(plan[25].file, 'f3.jpg');
  assert.ok(plan.every(frame => frame.cursor === true));
  assert.equal(renderPlan({...log, events: [{t: 0, type: 'hold', box}]}, 10)[0].cursor, false, 'no clicks: no cursor');
});

test('a close-up\'s crop stays inside the window; one fully outside gives none', () => {
  assert.deepEqual(clipTo({x: -12, y: 900, width: 2000, height: 300}, {w: 1800, h: 1125}), {x: 0, y: 900, width: 1800, height: 225});
  assert.equal(clipTo({x: 1900, y: 0, width: 50, height: 50}, {w: 1800, h: 1125}), null);
});

test('the poster is the end of the hold marked poster (the filled form), else the first frame', () => {
  const events = [{type: 'hold', t: 1, s: 1.2}, {type: 'mark', t: 2.3}, {type: 'hold', t: 3, s: 5, poster: true}, {type: 'hold', t: 8, s: 3.2}];
  assert.equal(posterTime(events), 7.5);
  assert.equal(posterTime(events.map(({poster, ...event}) => event)), 0);
});

// The hero's camera (owner, 24 Oct 2026: "fewer, more deliberate zooms"): steady pieces never zoom on a click and open already framed;
// a page change cuts; the phone copy has its own, tighter camera.
test('a steady piece opens on its first look and never moves for a click; the next look is the one deliberate move', () => {
  const click = {x: 1600, y: 1000, width: 120, height: 40};
  const events = [{t: 0.2, type: 'hold', box, zoom: 1.5}, {t: 2, type: 'click', box: click}, {t: 2.7, type: 'press', box: click}, {t: 3, type: 'hold', box: {x: 900, y: 200, width: 500, height: 300}, zoom: 2.2}];
  const keys = cameraKeys({viewport, events, steady: true});
  assert.ok(cameraAt(keys, 0, viewport).w < viewport.w, 'framed from the first frame, no whole-screen opening');
  assert.deepEqual(cameraAt(keys, 2.9, viewport), cameraAt(keys, 1, viewport), 'the click moved nothing');
  assert.ok(Math.abs(cameraAt(keys, 5, viewport).w - viewport.w / 2.2) < 1e-6, 'then zoomed toward the result');
  assert.equal(keys.length, 2, 'one framing, one move');
});

test('a look marked cut switches at the page change, not with a glide', () => {
  const events = [{t: 0, type: 'hold', box, zoom: 2}, {t: 2, type: 'mark'}, {t: 3, type: 'hold', box: {x: 1300, y: 100, width: 300, height: 200}, zoom: 2, cut: true}];
  const keys = cameraKeys({viewport, events, steady: true});
  const before = cameraAt(keys, 1.99, viewport), after = cameraAt(keys, 2.001, viewport);
  assert.ok(before.x < 600 && after.x >= 899, `jumped at the mark (${before.x} -> ${after.x})`);
});

test('the phone copy: its own aspect, a tighter zoom (gain or its own), capped, inside the page', () => {
  const phone = {aspect: 4 / 3};
  const events = [{t: 0, type: 'hold', box: {x: 860, y: 360, width: 450, height: 130}, zoom: 2.2}, {t: 3, type: 'hold', box: {x: 260, y: 750, width: 400, height: 60}, zoom: 2, phoneZoom: 3.2}];
  const keys = cameraKeys({viewport, events, steady: true, phone});
  assert.equal(keys[0].z, Math.min(PHONE_MAX, 2.2 * PHONE_GAIN));
  assert.equal(keys.at(-1).z, 3.2, 'a step may set its own phone zoom');
  for (let t = 0; t < 6; t += 0.1) {
    const view = cameraAt(keys, t, viewport, 1, phone);
    assert.ok(Math.abs(view.w / view.h - 4 / 3) < 1e-6, 'a 4:3 view');
    assert.ok(view.x >= 0 && view.y >= -1e-9 && view.x + view.w <= viewport.w + 1e-9 && view.y + view.h <= viewport.h + 1e-9, `inside the page at ${t.toFixed(1)}`);
  }
  const whole = cameraKeys({viewport, events: [{t: 0, type: 'hold', box, zoom: 1}], phone});
  assert.ok(cameraAt(whole, 1, viewport, 1, phone).h <= viewport.h + 1e-9, 'even "the whole screen" fits the page height at 4:3');
});

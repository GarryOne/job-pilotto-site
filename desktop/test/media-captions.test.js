// Guards the hero's on-video captions (media/captions.mjs, round 3): every hero step that names a beat says a short line, a cut look's line starts at its
// cut, and a caption stays until the next one.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {captionAt, captionSize, captionTimes, SAY_MAX} from '../../media/captions.mjs';
import {VIDEOS} from '../../media/scenes.mjs';

const hero = Object.entries(VIDEOS).filter(([, piece]) => piece.slide || piece.part);

test('every hero look that names a beat says a line short enough to read at once', () => {
  assert.ok(hero.length >= 5, 'the four hero clips and the Apply clip\'s app part');
  for (const [name, piece] of hero) {
    for (const step of piece.steps.filter(each => each.beat)) {
      assert.ok(step.say, `${name}: the look "${step.beat}" has no caption (say)`);
      assert.ok(step.say.length <= SAY_MAX, `${name}: "${step.say}" is ${step.say.length} characters (at most ${SAY_MAX})`);
    }
  }
});

test('a part played before a piece exists and is not a piece of its own', () => {
  for (const [name, piece] of Object.entries(VIDEOS).filter(([, each]) => each.before)) {
    const part = VIDEOS[piece.before];
    assert.ok(part?.part, `${name}: before "${piece.before}" must be a VIDEOS entry with part: true`);
    assert.equal(part.speed, piece.speed, `${name}: its part plays at the same speed`);
    assert.equal(part.camera, piece.camera);
  }
});

test('a cut look\'s caption starts at its cut, an action\'s at its moment, and stays until the next', () => {
  const log = {events: [
    {type: 'hold', t: 0, s: 1, box: {}, say: 'first'},
    {type: 'mark', t: 1.2},
    {type: 'hold', t: 1.6, s: 1, box: {}, cut: true, say: 'after the cut'},
    {type: 'click', t: 2.8, say: 'she clicks'},
  ]};
  const list = captionTimes(log);
  assert.deepEqual(list.map(each => [each.t, each.say]), [[0, 'first'], [1.2, 'after the cut'], [2.8, 'she clicks']]);
  assert.deepEqual(captionAt(list, 1.1), {say: 'first', sayAge: 1.1});
  assert.equal(captionAt(list, 1.2).say, 'after the cut');
  assert.equal(captionAt(list, 9).say, 'she clicks');
  assert.deepEqual(captionAt([{t: 1, say: 'later'}], 0.5), {});
});

test('captions read on the phone copy as on the desktop one', () => {
  assert.ok(captionSize(720, true) >= 36, 'phone: about 20 px on a 390-px-wide screen');
  assert.ok(captionSize(1600, false) >= 26);
});

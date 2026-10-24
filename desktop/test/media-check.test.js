// The product media's checks (media/check.mjs): an address that may be real, a real key in a persona folder, a light window or a
// form the extension did not fill each stop the run.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {captureGaps, missingFills, pieceProblems, realEmails, realSecrets} from '../../media/check.mjs';
import {missingEncoders} from '../../media/encode.mjs';

test('only e-mail addresses on reserved test domains pass', () => {
  assert.deepEqual(realEmails('alex.morgan@example.com · ada@tester.example · x@y.test · hr@northwind.example.org'), []);
  assert.deepEqual(realEmails('write to someone@gmail.com or jobs@acme.ch'), ['someone@gmail.com', 'jobs@acme.ch']);
});

test('a persona folder with a real-looking key is refused; the demo placeholders pass', () => {
  assert.deepEqual(realSecrets({ANTHROPIC_API_KEY: 'demo-key-not-real-0000000000', NOTION_TOKEN: 'demo'}), []);
  assert.deepEqual(realSecrets({NOTION_TOKEN: 'ntn_5f8a2c9d1e3b4a6f7c8d9e0a1b2c3d4e'}), ['NOTION_TOKEN']);
});

test('the clip must show the extension filling the required fields and the questions', () => {
  assert.deepEqual(missingFills(['first_name', 'last_name', 'email', 'resume', 'permit', 'privacy', 'notice']), []);
  assert.deepEqual(missingFills(['first_name', 'last_name', 'email', 'resume', 'privacy']), ['permit']);
});

test('a piece is refused for a light window, a stalled capture or a real address', () => {
  const frames = Array.from({length: 100}, (_, i) => ({t: i / 10}));
  assert.deepEqual(pieceProblems({name: 'hero', source: 'app', log: {frames, text: 'Alex Morgan'}, posterBrightness: 0.12}), []);
  const problems = pieceProblems({name: 'hero', source: 'app', log: {frames: frames.slice(0, 3).concat([{t: 10}]), text: 'me@gmail.com'}, posterBrightness: 0.8});
  assert.equal(problems.length, 3);
});

test('a run stops before recording when ffmpeg lacks an encoder the pieces need', () => {
  const list = ' V..... libx264  H.264\n V..... libvpx-vp9  VP9\n V..... libwebp  WebP\n';
  assert.deepEqual(missingEncoders(list), []);
  assert.deepEqual(missingEncoders(list.replace('libwebp', 'png')), ['libwebp']);
  assert.deepEqual(missingEncoders(list.replace(' libwebp ', ' libwebp_anim ')), ['libwebp'], 'the animated-only encoder is not enough');
});

test('every piece in scenes.mjs is checked for a light picture, whatever it records', async () => {
  const {VIDEOS} = await import('../../media/scenes.mjs');
  const frames = Array.from({length: 100}, (_, i) => ({t: i / 10}));
  for (const [name, piece] of Object.entries(VIDEOS)) {
    const log = {frames, text: '', filled: ['first_name', 'last_name', 'email', 'resume', 'permit', 'privacy']};
    assert.deepEqual(pieceProblems({name, source: piece.source, log, posterBrightness: 0.1}), [], name);
    assert.match(pieceProblems({name, source: piece.source, log, posterBrightness: 0.8}).join(), /not dark/, `${name}: a light picture passed`);
  }
});

test('the fictional form and its recorder are dark', async () => {
  const fs = await import('node:fs');
  const read = file => fs.readFileSync(new URL(`../../media/${file}`, import.meta.url), 'utf8');
  assert.match(read('form.html'), /prefers-color-scheme: dark/);
  assert.match(read('record-extension.mjs'), /emulateMedia\(\{colorScheme: 'dark'/);
});

// Round 2: Set up's capture sent no frame for 5 s after a click; the clip froze on the loading card. A still page may send no frames, an action may not.
test('a frame gap holding a click, a press or a page change is a stall; a still page between actions is not', () => {
  const frames = [0, 0.5, 1, 6, 6.5].map(t => ({t}));
  assert.deepEqual(captureGaps({frames, events: [{t: 3, type: 'click'}]}), [{from: 1, to: 6}]);
  assert.deepEqual(captureGaps({frames, events: [{t: 0.7, type: 'mark'}]}), [{from: 1, to: 6}], 'a change just before the gap counts');
  assert.deepEqual(captureGaps({frames, events: [{t: 2, type: 'hold'}]}), [], 'a hold on a still page sends no frames, that is fine');
  const problems = pieceProblems({name: 'hero', source: 'app', log: {frames, events: [{t: 3, type: 'press'}], text: ''}, posterBrightness: 0.1, quiet: true});
  assert.ok(problems.some(line => /capture stalled/.test(line)), problems.join(' / '));
});

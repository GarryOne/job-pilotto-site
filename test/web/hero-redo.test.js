// The hero's redo mechanism stays whole (owner, 24 Oct 2026: "the feedback mechanism permanently available"): every clip on the stage (a scene with
// `slide` in media/scenes.mjs) is recorded by tools/hero.sh, shown by index.html with all its files placed, named in the skill, and has no
// leftover AI-director plan overriding its framing. Loops over the scenes, so a fifth phase added later is checked too.
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {test} from 'node:test';
import {VIDEOS} from '../../media/scenes.mjs';

const root = new URL('../../', import.meta.url);
const read = rel => readFileSync(new URL(rel, root), 'utf8');
const slides = Object.entries(VIDEOS).filter(([, piece]) => piece.slide).sort(([, a], [, b]) => a.slide - b.slide).map(([name]) => name);
// The joined trees leave .claude/ out: the skill is in this repo's checkout (CI: .private/; locally .overlay sits inside the repo, so ../).
const SKILL = '.claude/skills/redo-site-hero-video/SKILL.md';
const skill = [SKILL, `.private/${SKILL}`, `../${SKILL}`].map(rel => new URL(rel, root)).find(url => existsSync(url));

test('the stage shows every slide scene, in order, and every file it names is placed', () => {
  const html = read('web/public/index.html');
  const stage = (html.match(/<div class="hero-stage"[\s\S]*?<div class="stage-steps"/) || [''])[0];
  const shown = [...stage.matchAll(/<source src="\/media\/([\w-]+)\.webm"/g)].map(match => match[1]);
  assert.deepEqual(shown, slides, 'index.html plays the slide scenes in their slide order');
  for (const file of new Set([...stage.matchAll(/"\/media\/([\w.-]+)"/g)].map(match => match[1]))) {
    assert.ok(existsSync(new URL(`web/public/media/${file}`, root)), `web/public/media/${file} is placed (tools/hero.sh --place)`);
  }
  for (const name of slides) assert.ok(stage.includes(`/media/${name}-720-poster.jpg`) && VIDEOS[name].phone, `${name}: a phone copy and its poster`);
});

test('tools/hero.sh records exactly the slide scenes, and no plan overrides them', () => {
  const list = (read('tools/hero.sh').match(/^HERO=\(([^)]*)\)/m) || ['', ''])[1].trim().split(/\s+/);
  assert.deepEqual(list, slides);
  for (const name of slides) assert.ok(!existsSync(new URL(`media/plans/${name}.json`, root)), `media/plans/${name}.json would override the scene`);
});

test('the skill names every slide scene and every file it points to exists', () => {
  assert.ok(skill, `${SKILL} is in this repo's checkout`);
  const text = readFileSync(skill, 'utf8');
  for (const name of slides) assert.ok(text.includes(`\`${name}\``), `the skill names ${name}`);
  for (const rel of ['tools/hero.sh', 'tools/hero-preview.mjs', 'media/scenes.mjs', 'media/camera.mjs', 'web/public/hero-stage.js', 'media/personas/nurse-lyon/moments/later.json']) {
    assert.ok(text.includes(rel), `the skill points to ${rel}`);
    assert.ok(existsSync(new URL(rel, root)), `${rel} exists`);
  }
});

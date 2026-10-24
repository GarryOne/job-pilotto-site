// The AI page (/intelligence): a journey strip of six sections, a short card per step with its long text folded, the "sees / never" chips visible,
// every anchor working, and the next-page card clear of the section above it (owner, 24 Oct 2026: "looks cooler", "a bit of spacing").
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const read = name => readFileSync(new URL(`../../web/public/${name}`, import.meta.url), 'utf8');
const page = read('intelligence.html');
const SECTIONS = ['find', 'prepare', 'apply', 'track', 'learn', 'trust'];

test('the journey strip links to all six sections, and each section exists (the app README links #find .. #trust)', () => {
  const strip = page.match(/<ol class="ai-journey">([\s\S]*?)<\/ol>/)[1];
  assert.deepEqual([...strip.matchAll(/href="#([a-z]+)"/g)].map(m => m[1]), SECTIONS);
  for (const id of SECTIONS) assert.match(page, new RegExp(`<section[^>]* id="${id}"`), id);
});

test('every step is a card: a title, a promise line, and its long text folded under "How it works"', () => {
  const cards = [...page.matchAll(/<article class="ai-step">([\s\S]*?)<\/article>/g)].map(m => m[1]);
  assert.ok(cards.length >= 47, `${cards.length} cards`);
  for (const card of cards) {
    assert.match(card, /<h3>[^<]{3,}<\/h3><p class="promise-line">[^<]{10,}<\/p>/);
    assert.match(card, /<details><summary>How it works<\/summary><p>[^<]{20,}/s, 'the long text is kept, folded');
  }
});

test('the privacy lines stay visible: a card that says Claude never sees something shows it as a chip, outside the fold', () => {
  const cards = [...page.matchAll(/<article class="ai-step">([\s\S]*?)<\/article>/g)].map(m => m[1]);
  for (const card of cards) {
    const folded = card.match(/<details>[\s\S]*<\/details>/)[0];
    const visible = card.replace(folded, '');
    if (/Claude sees [^.]*never/i.test(folded)) assert.match(visible, /class="no"/, `a card that says what Claude never sees shows it: ${card.match(/<h3>(.*?)<\/h3>/)[1]}`);
  }
  assert.ok((page.match(/class="no"/g) || []).length >= 20, 'the never chips are there');
});

test('the NEW badges are gone, the page title tells the real count, and the page links its own stylesheet', () => {
  assert.doesNotMatch(page, /class="new"/);
  assert.doesNotMatch(page, /29 ways/);
  assert.match(page, /href="intelligence\.css"/);
});

test('the end-of-page card has room above it on every page that uses it', () => {
  const rule = read('pages.css').match(/\.next-page \{[^}]*margin-block: (\d+)px/);
  assert.ok(rule && Number(rule[1]) >= 40, 'margin above .next-page');
});

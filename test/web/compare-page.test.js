// Compare (owner's Design 02, approved 24 Oct 2026): Jobadabra next to one chosen tool, "View all tools" for the rest; a row per capability with a cell for
// every tool, so switching never leaves a gap; no table wider than a phone (the old one had min-width 820px in a 342px box).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const read = name => readFileSync(new URL(`../../web/public/${name}`, import.meta.url), 'utf8');
const page = read('compare.html');
const tools = [...page.matchAll(/<option value="([a-z]+)">/g)].map(m => m[1]).filter(tool => tool !== 'all');

test('the picker offers every tool the table has a column for, plus all tools, and Simplify is the default', () => {
  const columns = [...page.matchAll(/<th scope="col" data-tool="([a-z]+)">/g)].map(m => m[1]);
  assert.deepEqual(tools, columns);
  assert.ok(tools.length >= 5);
  assert.match(page, /<option value="all">All tools<\/option>/);
  assert.match(page, /<label for="cmp-with">Compare with<\/label>/);
  assert.match(read('compare.js'), /show\('simplify'\);/);
});

test('every capability row has one Jobadabra cell and one cell per tool, each labelled for the phone cards', () => {
  const rows = [...page.matchAll(/<tr><th scope="row">([\s\S]*?)<\/tr>/g)].map(m => m[1]);
  assert.ok(rows.length >= 8, `only ${rows.length} rows`);
  for (const row of rows) {
    assert.equal((row.match(/<td class="us" data-label="Jobadabra">/g) || []).length, 1, row.slice(0, 60));
    for (const tool of tools) assert.equal((row.match(new RegExp(`<td data-tool="${tool}" data-label="`, 'g')) || []).length, 1, `${tool} missing in ${row.slice(0, 60)}`);
  }
});

test('the claims say when they were checked, and the page keeps "Where the others are the better choice"', () => {
  assert.match(page, /checked \d{1,2} [A-Z][a-z]+ 20\d\d/);
  assert.match(page, /Where the others are the better choice/);
});

test('nothing on Compare or Platforms is wider than a phone', () => {
  for (const sheet of ['compare.css', 'platforms.css']) for (const [, px] of read(sheet).matchAll(/min-width:\s*(\d+)px/g)) assert.ok(Number(px) <= 342, `${sheet}: min-width ${px}px`);
  assert.doesNotMatch(page, /class="compare"/);
  assert.doesNotMatch(read('platforms.html'), /<table/);
});

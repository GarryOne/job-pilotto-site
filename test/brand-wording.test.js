// The product is called Jobadabra in every tracked file of the site repo; "Job Pilotto" survives only as a kept name (24 Oct 2026 rename).
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {test} from 'node:test';

const NOT_SCANNED = /(^|\/)(node_modules|dist)\/|^AGENTS\.md$|^CLAUDE\.md$|^db\/migrations\/|^test\/fixtures\/|^test\/brand-wording\.test\.js$|\.(png|jpg|jpeg|gif|ico|svg|webp|mp4|woff2?|lock)$|package-lock/;
// Kept names, each with its reason: a line is allowed when one matches.
const KEPT = [
  /Application Support|\/Job Pilotto\b/,                                  // the app's data folder (moves with its own migration)
  /Job Pilotto\.app|quit app "Job Pilotto"/,                              // the bundle's file name, which the install script and updater still use
  /Job Pilotto (QA|Brain|Tests|Sentry|Sign-in)|connection "Job Pilotto"|integrations → Job Pilotto/,  // owner-only bots and external accounts' own names
  /job-pilotto/,                                                          // identifiers
];

test('the site repo says Jobadabra, except the kept names', () => {
  const files = execFileSync('git', ['ls-files'], {encoding: 'utf8', maxBuffer: 1 << 26}).split('\n').filter(f => f && !NOT_SCANNED.test(f));
  const bad = [];
  for (const file of files) {
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    text.split('\n').forEach((line, i) => {
      if (line.includes('Job Pilotto') && !KEPT.some(rule => rule.test(line))) bad.push(`${file}:${i + 1}: ${line.trim().slice(0, 110)}`);
    });
  }
  assert.deepEqual(bad, [], 'say "Jobadabra" (or add the kept name to KEPT with its reason):\n' + bad.slice(0, 40).join('\n'));
});

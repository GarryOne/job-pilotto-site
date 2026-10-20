// Probes every route of docs/site-routes.json with a plain GET on two hosts (the new deploy and production) and prints a Markdown table: status on each and whether they agree.
// Usage: node tools/probe-routes.mjs <new-host> <production-host> [list]. No body, no credentials; prefix routes get a child path. A route is "unrouted" only when it answers 0 or 5xx on the new host.
import {readFileSync} from 'node:fs';
const [,, a, b, listPath = 'docs/site-routes.json'] = process.argv;
const routes = JSON.parse(readFileSync(listPath, 'utf8')).routes;
const hit = async (host, path) => {
  try { return (await fetch(host + path, {redirect: 'manual', headers: {'user-agent': 'site-move-probe'}})).status; } catch { return 0; }
};
const rows = [];
for (const r of routes) {
  const path = r.prefix ? `${r.path}probe` : r.path;
  const [x, y] = [await hit(a, path), await hit(b, path)];
  rows.push({path, kind: r.kind, x, y, same: x === y});
}
const dead = rows.filter(r => r.x === 0 || r.x >= 500);
const differ = rows.filter(r => !r.same);
console.log(`**${rows.length} routes: ${rows.filter(r => r.same).length} answer the same as production, ${differ.length} differ, ${dead.length} unrouted (0 or 5xx).**\n`);
console.log('| Route | Kind | New | Production | Same |\n|---|---|---|---|---|');
for (const r of rows) console.log(`| \`${r.path}\` | ${r.kind} | ${r.x} | ${r.y} | ${r.same ? '✅' : '⚠️'} |`);
process.exitCode = dead.length ? 1 : 0;

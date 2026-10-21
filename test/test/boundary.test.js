// The folder boundary of the Worker: web, admin, api, shared and worker. Owns: which folder may import which. Guards: site/{admin,api,shared,worker}.
//   admin  -> shared                (the owner's pages and the CI uploads that feed them)
//   api    -> shared                (what the installed apps call; their URLs never change)
//   shared -> shared                (used by both sides, so it can use neither)
//   worker -> every folder          (the router, the cron and the queue)
// A file straight in site/src is refused: the old flat folder must not grow back.
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';

const site = fileURLToPath(new URL('../', import.meta.url));
const ALLOWED = {admin: ['admin', 'shared'], api: ['api', 'shared'], shared: ['shared'], worker: ['admin', 'api', 'shared', 'worker']};

function files(folder) {
  const walk = dir => readdirSync(dir, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []);
  return walk(join(site, folder));
}
const importsOf = file => [...readFileSync(file, 'utf8').matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)].map(m => resolve(dirname(file), m[1]));

test('admin, api and shared never import each other the wrong way', () => {
  const wrong = [];
  for (const folder of Object.keys(ALLOWED)) for (const file of files(folder)) for (const target of importsOf(file)) {
    const inSite = relative(site, target);
    if (inSite.startsWith('..')) continue;   // the public repo's validators (extension/, desktop/lib/, worker/src/, config/)
    const to = inSite.split(sep)[0];
    if (!ALLOWED[folder].includes(to)) wrong.push(`${relative(site, file)} imports ${inSite}`);
  }
  assert.deepEqual(wrong, [], 'a file may only import its own folder and shared/ (the router in worker/ may import all)');
});

test('the public pages in web/ import nothing from the Worker folders', () => {
  const wrong = files('web').flatMap(file => importsOf(file).map(t => `${relative(site, file)} imports ${relative(site, t)}`));
  assert.deepEqual(wrong, []);
});

test('every module sits in a folder: no real file is left in the old site/src', () => {
  // (the joined tree keeps site/src as links to the new folders for the public repo's tests: tools/legacy-paths.sh)
  const real = existsSync(join(site, 'src')) ? readdirSync(join(site, 'src'), {withFileTypes: true}).filter(e => !e.isSymbolicLink()).map(e => e.name) : [];
  assert.deepEqual(real, [], 'put a new file in admin/, api/, shared/ or worker/, never in site/src');
});

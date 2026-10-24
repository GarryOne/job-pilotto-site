// The hero's side-by-side review image (owner, 24 Oct 2026: "judge readability inside the hero, not fullscreen"): today's live hero | this tree's hero,
// at a desktop and a phone width, one frame per phase at the clip's result moment, labelled, same scale. Demo media only; a fresh browser profile (no cookies).
//   node tools/hero-preview.mjs --out <png> [--media <media set dir>] [--before <url>] [--web web/public] [--tree .overlay]
//   --media   a set from media/media.mjs (its files win over web/public/media), to review clips before placing them
//   --before  the page to compare against (default https://www.jobadabra.top; "none" leaves the left column out)
//   --only    desktop | phone: one width (a PR's Before/After image per width)
// Prints the PNG path and each frame's caption. Used by the redo-site-hero-video skill (.claude/skills).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';

const args = Object.fromEntries(process.argv.slice(2).join(' ').split(/\s*--/).filter(Boolean).map(part => { const [k, ...v] = part.split(' '); return [k, v.join(' ')]; }));
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(args.out || 'hero-preview.png');
const web = path.resolve(repo, args.web || 'web/public');
const media = args.media ? path.resolve(args.media) : null;
const before = args.before === 'none' ? null : (args.before || 'https://www.jobadabra.top');
const tree = path.resolve(repo, args.tree || '.overlay');
const require = createRequire(path.join(tree, 'desktop', 'e2e', 'package.json'));
const {chromium} = require('playwright-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';   // has the H.264 decoder the phone copies need
const SIZES = [{name: 'Desktop 1440', width: 1440, height: 900, scale: 1}, {name: 'Phone 390', width: 390, height: 844, scale: 2, mobile: true}];
const only = (args.only || '').toLowerCase();
const PHASES = ['Set up', 'Find', 'Apply', 'Track'];
const TYPES = {'.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon'};

// Serves web/public, a media set laid over /media/, with ranges (video seeking needs them).
function serve() {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    let file = path.join(web, rel);
    if (media && rel.startsWith('/media/') && fs.existsSync(path.join(media, rel.slice(7)))) file = path.join(media, rel.slice(7));
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
    if (!file.startsWith(web) && !(media && file.startsWith(media))) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
    const size = fs.statSync(file).size, type = TYPES[path.extname(file)] || 'application/octet-stream';
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (range) {
      const start = Number(range[1] || 0), end = range[2] ? Number(range[2]) : size - 1;
      res.writeHead(206, {'content-type': type, 'content-range': `bytes ${start}-${end}/${size}`, 'accept-ranges': 'bytes', 'content-length': end - start + 1});
      fs.createReadStream(file, {start, end}).pipe(res);
    } else { res.writeHead(200, {'content-type': type, 'accept-ranges': 'bytes', 'content-length': size}); fs.createReadStream(file).pipe(res); }
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// This tree's stage: each step clicked, paused, sought to just before the clip's end (its result), the stage shot with its caption.
async function shootStage(page, url) {
  await page.goto(url, {waitUntil: 'networkidle'});
  await page.locator('#hero-stage').scrollIntoViewIfNeeded();
  const shots = [];
  for (let k = 0; k < PHASES.length; k++) {
    const caption = await page.evaluate(async k => {
      const root = document.getElementById('hero-stage');
      root.querySelectorAll('.stage-steps button:not(.stage-pause)')[k].click();
      if (root.querySelector('.stage-pause').getAttribute('aria-label') === 'Pause') root.querySelector('.stage-pause').click();
      const clip = root.querySelectorAll('video.slide')[k];
      clip.preload = 'auto';
      if (clip.readyState < 1) { clip.load(); await new Promise(done => { clip.addEventListener('loadedmetadata', done, {once: true}); setTimeout(done, 8000); }); }
      clip.currentTime = Math.max(0, (clip.duration || 1) - 0.35);
      await new Promise(done => { clip.addEventListener('seeked', done, {once: true}); setTimeout(done, 4000); });
      return `${root.querySelector('.stage-cap b').textContent} | ${root.querySelector('.stage-cap span').textContent} | ${clip.currentSrc.split('/').pop()} ${clip.videoWidth}x${clip.videoHeight}`;
    }, k);
    await page.waitForTimeout(700);   // the crossfade
    shots.push({png: await page.locator('#hero-stage').screenshot(), caption});
  }
  return shots;
}

// The page to compare against: whatever its hero is, the region around its first video, at four moments of its loop.
async function shootBefore(page, url) {
  await page.goto(url, {waitUntil: 'networkidle'});
  const hero = page.locator('video').first().locator('xpath=ancestor::*[self::section or contains(@class, "hero")][1]');
  await hero.scrollIntoViewIfNeeded();
  const shots = [];
  for (const at of [3, 9, 15, 21]) {
    await page.waitForTimeout(Math.max(0, at * 1000 - (shots.length ? (shots.length * 6 + 3) * 1000 : 0)));
    shots.push({png: await hero.screenshot(), caption: `live hero at ${at} s`});
  }
  return shots;
}

const server = await serve();
const local = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({headless: true, ...(fs.existsSync(CHROME) ? {executablePath: CHROME} : {})});
const rows = [];
try {
  for (const size of SIZES.filter(one => !only || one.name.toLowerCase().startsWith(only))) {
    const open = async () => (await browser.newContext({viewport: {width: size.width, height: size.height}, deviceScaleFactor: size.scale, isMobile: Boolean(size.mobile), hasTouch: Boolean(size.mobile)})).newPage();
    const now = await shootStage(await open(), local);
    const then = before ? await shootBefore(await open(), before) : [];
    PHASES.forEach((phase, k) => rows.push({size: size.name, phase, now: now[k], then: then[k]}));
  }
  const img = shot => shot ? `<figure><img src="data:image/png;base64,${shot.png.toString('base64')}"><figcaption>${shot.caption.replace(/</g, '&lt;')}</figcaption></figure>` : '<figure></figure>';
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:24px;background:#111;color:#eee;font:14px system-ui}h2{font-size:15px;margin:28px 0 8px}
    .row{display:grid;grid-template-columns:${before ? '1fr 1fr' : '1fr'};gap:20px;align-items:start}img{max-width:100%;border:1px solid #333}figure{margin:0}figcaption{color:#aaa;font-size:12px;margin-top:4px}
    .head{display:grid;grid-template-columns:${before ? '1fr 1fr' : '1fr'};gap:20px;font-weight:600;color:#ffb224}</style>
    <div class="head">${before ? `<div>Today (${before})</div>` : ''}<div>New (this tree${media ? ', ' + path.basename(media) : ''})</div></div>
    ${rows.map(row => `<h2>${row.size} · ${row.phase}</h2><div class="row">${before ? img(row.then) : ''}${img(row.now)}</div>`).join('')}`;
  const sheet = await (await browser.newContext({viewport: {width: before ? 1800 : 1000, height: 900}})).newPage();
  await sheet.setContent(html, {waitUntil: 'load'});
  fs.writeFileSync(out, await sheet.screenshot({fullPage: true}));
  rows.forEach(row => console.log(`hero-preview: ${row.size} · ${row.phase}: ${row.now.caption}`));
  console.log(`hero-preview: ${out}`);
} finally { await browser.close(); server.close(); }

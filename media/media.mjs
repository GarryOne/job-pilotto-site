// The product's screenshots and videos, made with nobody's hands (owner, 20 Oct 2026): records the app (demo mode, dark) and the real extension on a
// fictional form, adds zooms, cursor and clicks in code from the click log, checks every piece, writes the site's files + manifest.json.
//   node media/media.mjs                                   all pieces → <tmp>/jobadabra-media
//   node media/media.mjs hero stills --out <dir>        some pieces (hero, extension-fill, stills, snips); a partial run keeps the others in manifest.json
//   node media/media.mjs --persona <folder>             another search profile (default: personas/nurse-lyon): files laid over desktop/demo + media.json
//   node media/media.mjs --keep                         keep the frames and logs (<out>/.work) for the director (direct.mjs) or a look
// Zooms and captions the AI director chose are in plans/<piece>.json (direct.mjs); without one, the camera frames each hold's `look`.
// Run by hand with tools/media.sh (the one local command; CI never records, owner 21 Oct 2026). Guards: desktop/test/media-*.test.js.
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {beatTimes, FIT_WARN, fromFirstLook, posterTime, renderPlan, RING} from './camera.mjs';
import {captureGaps, leftWords, pieceProblems, realEmails} from './check.mjs';
import {brightness, duration, encodeStill, encodeVideo, missingEncoders} from './encode.mjs';
import {manifest, stillEntry, videoEntry} from './manifest.mjs';
import {recordAppVideo, shootApp} from './record-app.mjs';
import {recordExtensionVideo} from './record-extension.mjs';
import {jpegWidth, loadPersona, parseArgs, planOf, withPlan} from './options.mjs';
import {SNIPS, STILLS, VIDEOS} from './scenes.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const desktop = path.resolve(here, '..', 'desktop');
const FPS = 30;

async function makeVideo(name, persona, work, out) {
  const piece = withPlan(VIDEOS[name], planOf(name));
  const stale = leftWords(`${piece.caption} ${piece.shows} ${piece.alt}`, persona.forbid);
  if (stale.length) throw new Error(`${name}: the plan's words name the default demo person (${stale.join(', ')}): run direct.mjs ${name} again`);
  const dir = path.join(work, name);
  fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
  const record = piece.source === 'extension' ? recordExtensionVideo : recordAppVideo;
  // a capture that stalled on a loaded Mac is recorded again (check.mjs captureGaps), at most twice; then pieceProblems fails the piece
  let recorded;
  for (let attempt = 1; attempt <= 3; attempt++) {
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
    recorded = await record({persona, piece, dir});
    const gaps = captureGaps(recorded);
    if (!gaps.length || attempt === 3) break;
    console.log(`media: ${name}: the capture stalled (no frame ${gaps.map(gap => `${gap.from.toFixed(1)}-${gap.to.toFixed(1)} s`).join(', ')}): recording again (${attempt + 1} of 3)`);
  }
  const log = piece.camera === 'steady' ? fromFirstLook(recorded) : recorded;   // the hero starts at its first look (camera.mjs)
  console.log(`media: ${name}: recorded ${log.frames.length} frames, ${log.frames.at(-1).t.toFixed(1)} s`);
  const first = fs.readFileSync(path.join(dir, 'frames', log.frames[0].file));
  const scale = jpegWidth(first) / log.viewport.w, steady = piece.camera === 'steady';
  // a hero look too wide for its zoom is shown whole at a lower zoom (camera.mjs fitWidth); much lower reads small, so the log names it (round 2)
  const onFit = (event, asked, used) => console.log(`media: ${name}: look ${JSON.stringify(event.look)} shown whole at zoom ${used.toFixed(2)} (asked ${asked.toFixed(2)})${used < asked * FIT_WARN ? ': SMALL TEXT, pick a narrower look' : ''}`);
  // The site's copy, and for a piece with a phone shape ({width, height}: the hero) a second master with its own tighter camera (camera.mjs PHONE_*).
  const render = (out, width, height, phone = null) => {
    const job = {framesDir: path.join(dir, 'frames'), frames: renderPlan(log, FPS, piece.speed || 1, {steady, phone, onFit}), scale, width, height, fps: FPS, ring: RING, out, ffmpeg: 'ffmpeg'};
    const file = path.join(dir, `${path.basename(out, '.mp4')}.json`);
    fs.writeFileSync(file, JSON.stringify(job));
    const run = spawnSync(path.join(desktop, 'node_modules', '.bin', 'electron'), [path.join(here, 'render.cjs'), file], {stdio: 'inherit', timeout: 15 * 60000});
    if (run.status !== 0) throw new Error(`media: ${name}: the renderer failed (${run.status ?? run.signal})`);
    return out;
  };
  const master = render(path.join(dir, 'master.mp4'), piece.width, piece.height);
  const phoneShape = typeof piece.phone === 'object' ? piece.phone : null;
  const phoneMaster = phoneShape ? render(path.join(dir, 'master-phone.mp4'), phoneShape.width, phoneShape.height, {aspect: phoneShape.width / phoneShape.height}) : null;
  const problems = pieceProblems({name, source: piece.source, log, posterBrightness: brightness(path.join(dir, 'frames', log.frames[0].file)), forbid: persona.forbid, quiet: piece.quiet});
  if (problems.length) throw new Error(problems.join('\n'));
  const {files, bytes} = encodeVideo({master, phoneMaster, name, piece, outDir: out, posterAt: posterTime(log.events)});
  console.log(`media: ${name}: ${Object.entries(bytes).map(([kind, n]) => `${kind} ${(n / 1e6).toFixed(2)} MB`).join(', ')}`);
  return videoEntry({name, piece, files, bytes, seconds: duration(path.join(out, files.mp4)), beats: beatTimes(log.events, piece.steps, piece.speed || 1)});
}

async function makeStills(kinds, persona, work, out) {
  const dir = path.join(work, 'stills');
  fs.mkdirSync(dir, {recursive: true});
  const shots = await shootApp({persona, stills: kinds.includes('stills') ? STILLS : {}, snips: kinds.includes('snips') ? SNIPS : {}, dir});
  return shots.map(shot => {
    const emails = realEmails(shot.text);
    if (emails.length) throw new Error(`media: ${shot.kind} ${shot.name}: an e-mail address that may be real is on screen: ${emails.join(', ')}`);
    const left = leftWords(shot.text, persona.forbid);
    if (left.length) throw new Error(`media: ${shot.kind} ${shot.name}: the default demo person shows through: ${left.join(', ')}`);
    const encoded = encodeStill({png: shot.file, name: shot.name, kind: shot.kind, outDir: out});
    return stillEntry({name: shot.name, kind: shot.kind, ...encoded, shows: (shot.kind === 'still' ? STILLS : SNIPS)[shot.name].shows});
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const persona = loadPersona(options.persona);
  const missing = missingEncoders();
  if (missing.length) throw new Error(`this ffmpeg lacks ${missing.join(', ')} (brew install ffmpeg)`);
  const work = path.join(options.out, '.work');
  fs.mkdirSync(work, {recursive: true});
  execFileSync(process.execPath, [path.join(desktop, 'scripts', 'stage.mjs')], {cwd: desktop, stdio: 'ignore'});   // the app imports shared/ (npm start does the same)
  const entries = [];
  for (const name of options.pieces.filter(piece => VIDEOS[piece])) entries.push(await makeVideo(name, persona, work, options.out));
  const kinds = options.pieces.filter(piece => piece === 'stills' || piece === 'snips');
  if (kinds.length) entries.push(...await makeStills(kinds, persona, work, options.out));
  const file = path.join(options.out, 'manifest.json');
  const previous = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {cwd: desktop, encoding: 'utf8'}).trim();
  fs.writeFileSync(file, `${JSON.stringify(manifest({entries, previous, made: {sha, at: new Date().toISOString(), persona: persona.name}}), null, 2)}\n`);
  if (!options.keep) fs.rmSync(work, {recursive: true, force: true});
  console.log(`media: DONE ${entries.length} piece(s) → ${options.out}`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) main().catch(error => { console.error(`media: FAILED ${error.message}`); process.exit(1); });

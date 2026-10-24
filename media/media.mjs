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
import {dropChanges, frameCuts, STRAY_MAX, strayFrames, THUMB} from './cuts.mjs';
import {captionAt, captionSize, captionTimes, SAY_FADE} from './captions.mjs';
import {captureGaps, leftWords, pieceProblems, realEmails} from './check.mjs';
import {brightness, duration, encodeStill, encodeVideo, missingEncoders} from './encode.mjs';
import {manifest, stillEntry, videoEntry} from './manifest.mjs';
import {recordAppVideo, shootApp} from './record-app.mjs';
import {recordExtensionVideo} from './record-extension.mjs';
import {jpegWidth, loadPersona, parseArgs, planOf, withPlan} from './options.mjs';
import {partsOf, SNIPS, STILLS, VIDEOS} from './scenes.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const desktop = path.resolve(here, '..', 'desktop');
const FPS = 30;

// One recorded clip (a piece, or a part of one): frames, log, the masters (recorded time; encode.mjs plays them `speed` times faster). Checked here.
async function recordClip(name, persona, work) {
  const piece = withPlan(VIDEOS[name], planOf(name));
  const stale = leftWords(`${piece.caption || ''} ${piece.shows} ${piece.alt || ''}`, persona.forbid);
  if (stale.length) throw new Error(`${name}: the plan's words name the default demo person (${stale.join(', ')}): run direct.mjs ${name} again`);
  const dir = path.join(work, name);
  const record = piece.source === 'extension' ? recordExtensionVideo : recordAppVideo;
  // a capture that stalled on a loaded Mac is recorded again (check.mjs captureGaps), at most twice; then pieceProblems fails the piece
  let recorded;
  for (let attempt = 1; attempt <= 3; attempt++) {
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
    recorded = await record({persona, piece, dir});
    const gaps = captureGaps(recorded);
    if (!gaps.length || attempt === 3) break;
    console.log(`media: ${name}: the capture stalled (no frame at ${gaps.map(gap => `${gap.t.toFixed(1)} s`).join(', ')}): recording again (${attempt + 1} of 3)`);
  }
  // the hero starts at its first look (camera.mjs), each cut look when it shows, checked against its frames (cuts.mjs)
  const px = jpegWidth(fs.readFileSync(path.join(dir, 'frames', recorded.frames[0].file))) / recorded.viewport.w, thumbs = new Map();
  const thumb = (file, box) => {   // a frame's grey thumbnail of a box in CSS px (cuts.mjs frameCuts), clamped to the page
    const x = Math.max(0, Math.round(box.x * px)), y = Math.max(0, Math.round(box.y * px)), key = `${file} ${x} ${y} ${box.width} ${box.height}`;
    const w = Math.max(2, Math.round(box.width * px)), h = Math.max(2, Math.round(box.height * px)), crop = `crop=min(${w}\\,iw-${x}):min(${h}\\,ih-${y}):${x}:${y}`;
    if (!thumbs.has(key)) thumbs.set(key, execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(dir, 'frames', file), '-vf', `${crop},scale=${THUMB.w}:${THUMB.h},format=gray`, '-f', 'rawvideo', '-']));
    return thumbs.get(key);
  };
  const log = piece.camera === 'steady' ? frameCuts({log: dropChanges(fromFirstLook(recorded)), thumb}) : recorded;
  console.log(`media: ${name}: recorded ${log.frames.length} frames, ${log.frames.at(-1).t.toFixed(1)} s`);
  const first = fs.readFileSync(path.join(dir, 'frames', log.frames[0].file));
  const scale = jpegWidth(first) / log.viewport.w, steady = piece.camera === 'steady';
  // a hero look too wide for its zoom is shown whole at a lower zoom (camera.mjs fitWidth); much lower reads small, so the log names it (round 2)
  const onFit = (event, asked, used) => console.log(`media: ${name}: look ${JSON.stringify(event.look)} shown whole at zoom ${used.toFixed(2)} (asked ${asked.toFixed(2)})${used < asked * FIT_WARN ? ': SMALL TEXT, pick a narrower look' : ''}`);
  // The site's copy, and for a piece with a phone shape ({width, height}: the hero) a second master with its own tighter camera (camera.mjs PHONE_*).
  const render = (out, width, height, phone = null) => {
    const captions = captionTimes(log);   // the hero's step captions (captions.mjs), drawn by render.cjs
    const frames = renderPlan(log, FPS, piece.speed || 1, {steady, phone, onFit}).map((frame, i) => ({...frame, ...captionAt(captions, i / FPS)}));
    const job = {framesDir: path.join(dir, 'frames'), frames, scale, width, height, fps: FPS, ring: RING, captionSize: captionSize(width, Boolean(phone)), sayFade: SAY_FADE, out, ffmpeg: 'ffmpeg'};
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
  return {name, piece, log, master, phoneMaster, seconds: duration(master)};
}

// Masters of a piece's parts, one after the other (round 3, owner 24 Oct 2026: Apply starts in the app, then the browser). -> the joined file.
function joined(files, out) {
  if (files.length === 1) return files[0];
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(file => ['-i', file]), '-filter_complex', `${files.map((_, i) => `[${i}:v]`).join('')}concat=n=${files.length}:v=1[v]`,
    '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', out]);
  return out;
}

// A video piece with its parts (scenes.mjs partsOf): each recorded on its own app state, moment and steps, played in order.
async function makeVideo(name, persona, work, out) {
  const clips = [];
  for (const part of partsOf(name)) clips.push(await recordClip(part, persona, work));
  const {piece} = clips.find(clip => clip.name === name), speed = piece.speed || 1, dir = path.join(work, name);
  const starts = clips.map((_, i) => clips.slice(0, i).reduce((sum, clip) => sum + clip.seconds, 0));   // recorded seconds where each part starts
  const master = joined(clips.map(clip => clip.master), path.join(dir, 'master-joined.mp4'));
  const phoneMaster = clips[0].phoneMaster ? joined(clips.map(clip => clip.phoneMaster), path.join(dir, 'master-phone-joined.mp4')) : null;
  const posterAt = clips.map((clip, i) => clip.piece.steps.some(step => step.poster) ? starts[i] + posterTime(clip.log.events) : null).filter(at => at !== null).at(-1) ?? 0;
  const {files, bytes} = encodeVideo({master, phoneMaster, name, piece, outDir: out, posterAt});
  console.log(`media: ${name}: ${Object.entries(bytes).map(([kind, n]) => `${kind} ${(n / 1e6).toFixed(2)} MB`).join(', ')}`);
  if (piece.camera === 'steady') {   // no frame of another page around a cut (cuts.mjs strayFrames), read off the played clip, part by part
    const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(out, files.mp4), '-vf', `scale=${THUMB.w}:${THUMB.h},format=gray`, '-f', 'rawvideo', '-'], {maxBuffer: 1 << 28});
    const size = THUMB.w * THUMB.h, total = Math.floor(raw.length / size);
    const stray = clips.flatMap((clip, i) => {
      const from = Math.round(starts[i] / speed * FPS), to = i + 1 < clips.length ? Math.round(starts[i + 1] / speed * FPS) : total;
      return strayFrames({log: clip.log, frames: to - from, thumb: j => raw.subarray((from + j) * size, (from + j + 1) * size), speed, fps: FPS})
        .map(s => ({...s, at: Number((s.at + from / FPS).toFixed(2))}));
    });
    if (stray.length) throw new Error(stray.map(s => `media: ${name}: a frame of another page at ${s.at} s, ${s.side} the cut to ${JSON.stringify(s.look)} (differs ${s.diff} > ${STRAY_MAX}): record again; if it repeats, the cut's timing is wrong (cuts.mjs)`).join('\n'));
  }
  const beats = clips.flatMap((clip, i) => beatTimes(clip.log.events, clip.piece.steps, speed).map(b => ({...b, t: Number((b.t + starts[i] / speed).toFixed(2))})));
  return videoEntry({name, piece, files, bytes, seconds: duration(path.join(out, files.mp4)), beats});
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
  for (const name of options.pieces.filter(piece => VIDEOS[piece] && !VIDEOS[piece].part)) entries.push(await makeVideo(name, persona, work, options.out));
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

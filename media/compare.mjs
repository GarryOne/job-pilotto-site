// Before | after of the hero as VIDEO, one clip per piece (media; owner, 24 Oct 2026: "the before/after should be on video clips, not screenshots ...
// the before we can take from the website/master branch"). Before = main's published clip (git show origin/main:web/public/media/<piece>.mp4),
// after = the new recording in a hero set; both play side by side, labelled, the shorter one held on its last frame. Writes <out>/<piece>-compare.mp4
// (the owner's preview) and a GIF of it (inline in the PR body, linked to the MP4). Usage: node media/compare.mjs <set dir> <out dir> [pieces...]
// Guard: desktop/test/media-compare.test.js.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const COMPARE = {height: 500, phoneHeight: 540, gifWidth: 960, gifFps: 8, labels: ['Before · live site (main)', 'After · this branch']};
const FONT = ['/System/Library/Fonts/Supplemental/Arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'].find(file => fs.existsSync(file));

// The ffmpeg filter that puts two clips side by side at one height, each labelled, the shorter one held on its last frame. Pure.
export function compareFilter(seconds, {height = COMPARE.height, labels = COMPARE.labels, font = FONT} = {}) {
  const longest = Math.max(...seconds);
  const side = (k, tag) => {
    const hold = Number((longest - seconds[k]).toFixed(3));
    const text = labels[k].replace(/[:'\\]/g, ' ');
    const label = `drawtext=${font ? `fontfile=${font}:` : ''}text='${text}':x=16:y=16:fontsize=${Math.round(height / 20)}:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=8`;
    return `[${k}:v]scale=-2:${height},setsar=1${hold > 0 ? `,tpad=stop_mode=clone:stop_duration=${hold}` : ''},${label}[${tag}]`;
  };
  return `${side(0, 'b')};${side(1, 'a')};[b][a]hstack=inputs=2,format=yuv420p[v]`;
}

// The pieces to compare: the set's clips (desktop and phone copies) that main also publishes. Pure.
export const comparable = (setFiles, mainFiles) => setFiles.filter(file => /^hero[\w-]*\.mp4$/.test(file) && mainFiles.includes(file)).map(file => file.replace(/\.mp4$/, ''));

const ff = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {stdio: ['ignore', 'ignore', 'inherit']});
const seconds = file => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {encoding: 'utf8'}));
const git = (...args) => execFileSync('git', args, {maxBuffer: 1 << 28});

function main([setDir, outDir, ...only]) {
  if (!setDir || !outDir) throw new Error('usage: node media/compare.mjs <set dir> <out dir> [pieces...]');
  fs.mkdirSync(outDir, {recursive: true});
  git('fetch', '-q', 'origin', 'main');
  const onMain = git('ls-tree', '--name-only', 'origin/main', 'web/public/media/').toString().split('\n').map(file => path.basename(file));
  const pieces = only.length ? only : comparable(fs.readdirSync(setDir), onMain);
  if (!pieces.length) throw new Error(`media: no hero clip in ${setDir} that main also publishes`);
  for (const piece of pieces) {
    const before = path.join(outDir, `${piece}-main.mp4`), after = path.join(setDir, `${piece}.mp4`), out = path.join(outDir, `${piece}-compare.mp4`);
    fs.writeFileSync(before, git('show', `origin/main:web/public/media/${piece}.mp4`));
    const filter = compareFilter([seconds(before), seconds(after)], {height: /-720$/.test(piece) ? COMPARE.phoneHeight : COMPARE.height});
    ff(['-i', before, '-i', after, '-filter_complex', filter, '-map', '[v]', '-c:v', 'libx264', '-crf', '23', '-preset', 'medium', '-movflags', '+faststart', out]);
    const gif = out.replace(/\.mp4$/, '.gif');
    ff(['-i', out, '-filter_complex', `fps=${COMPARE.gifFps},scale=${COMPARE.gifWidth}:-2:flags=lanczos,split[x][y];[x]palettegen=max_colors=128[p];[y][p]paletteuse=dither=bayer`, gif]);
    console.log(`compare: ${piece}: ${out} (${(fs.statSync(out).size / 1e6).toFixed(2)} MB), ${gif} (${(fs.statSync(gif).size / 1e6).toFixed(2)} MB)`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));

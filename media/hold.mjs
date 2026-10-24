// A hold's log entry and its timing for the media recorders (record-app.mjs, record-extension.mjs): pure, no Playwright, so the tests
// (desktop/test/media-camera.test.js) import it on any runner.
// The seconds a hold has left once its boxes are measured (round 2: measuring under load took ~0.5 s, the log still said the whole hold, so beat frames and
// posters landed after the page had moved on). The entry's t is stamped after measuring, so its `s` is this, and the recorder waits exactly this. Pure.
export const holdLeft = (hold, startedMs, nowMs) => Math.max(0.3, hold - (nowMs - startedMs) / 1000);
// A hold's log entry: what the camera needs (cameraKeys): its box, zoom, a cut at the page change, the phone copy's own zoom or box. `lookWidth` (CSS px)
// (`phoneLookWidth`: the same for the phone copy's own phoneLook) keeps the look's left part on purpose (round 2: a 1512-px card whose words sit on its left; the camera shows a look whole, so a wide one reads small).
export const leftPart = (box, width) => (box && width ? {...box, width: Math.min(box.width, width)} : box);
export const holdEvent = (item, box, phoneBox = null, s = item.hold) => ({type: 'hold', look: item.look || null, box: leftPart(box, item.lookWidth), s, ...(item.zoom ? {zoom: item.zoom} : {}),
  ...(item.cut ? {cut: true} : {}), ...(item.phoneZoom ? {phoneZoom: item.phoneZoom} : {}), ...(phoneBox ? {phoneBox: leftPart(phoneBox, item.phoneLookWidth)} : {}), ...(item.poster ? {poster: true} : {}), ...(item.say ? {say: item.say} : {}), ...(item.tag ? {tag: item.tag} : {})});
// An event where the page changed: a mark (an action's moment), or a press that acts at once. A press `held` on screen first (PRESS_SHOW) changes
// nothing; the mark logged when its action runs does. Read by camera.mjs and cuts.mjs. Pure.
export const pageChange = event => event.type === 'mark' || (event.type === 'press' && !event.held);
// Output seconds a press stays on screen before the page reacts (round 4, owner 24 Oct 2026: "when clicking Apply, the screen changes too fast, let's wait
// half a second"): every press in a video, recorded as PRESS_SHOW x the clip's speed.
export const PRESS_SHOW = 0.5;
// How many CSS px of a line of words the edge of `lookWidth` cuts through (round 4: the centred Find jobs card kept its left 1040 px; its description ran
// across that edge). A lookWidth ends in a gap between columns (round 2: the job row's fit, role, company): words wholly right of it are left out on
// purpose, a line crossing it is cut. lines: the look's text, one box per laid-out line. -> 0 when no line crosses the edge. Pure.
export const wordsCut = (box, width, lines) => {
  if (!box || !width || !lines?.length) return 0;
  const edge = box.x + Math.min(box.width, width);
  return Math.max(0, ...lines.filter(line => line.x < edge - 1).map(line => Math.round(line.x + line.width - edge)));
};
// The look the recorder watches for after step i (record-app.mjs logs 'ready' when it is on screen, cuts.mjs drops the frames before it): the next look
// if it is marked `cut`, else null. Pure.
export const nextCut = (steps, i) => { const look = steps.slice(i + 1).find(step => step.hold && step.look); return look?.cut ? {look: look.look} : null; };

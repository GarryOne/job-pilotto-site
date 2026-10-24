// A hold's log entry and its timing for the media recorders (record-app.mjs, record-extension.mjs): pure, no Playwright, so the tests
// (desktop/test/media-camera.test.js) import it on any runner.
// The seconds a hold has left once its boxes are measured (round 2: measuring under load took ~0.5 s, the log still said the whole hold, so beat frames and
// posters landed after the page had moved on). The entry's t is stamped after measuring, so its `s` is this, and the recorder waits exactly this. Pure.
export const holdLeft = (hold, startedMs, nowMs) => Math.max(0.3, hold - (nowMs - startedMs) / 1000);
// A hold's log entry: what the camera needs (cameraKeys): its box, zoom, a cut at the page change, the phone copy's own zoom or box. `lookWidth` (CSS px)
// (`phoneLookWidth`: the same for the phone copy's own phoneLook) keeps the look's left part on purpose (round 2: a 1512-px card whose words sit on its left; the camera shows a look whole, so a wide one reads small).
export const leftPart = (box, width) => (box && width ? {...box, width: Math.min(box.width, width)} : box);
export const holdEvent = (item, box, phoneBox = null, s = item.hold) => ({type: 'hold', look: item.look || null, box: leftPart(box, item.lookWidth), s, ...(item.zoom ? {zoom: item.zoom} : {}),
  ...(item.cut ? {cut: true} : {}), ...(item.phoneZoom ? {phoneZoom: item.phoneZoom} : {}), ...(phoneBox ? {phoneBox: leftPart(phoneBox, item.phoneLookWidth)} : {}), ...(item.poster ? {poster: true} : {}), ...(item.say ? {say: item.say} : {})});
// The look the recorder watches for after step i (record-app.mjs logs 'ready' when it is on screen, cuts.mjs drops the frames before it): the next look
// if it is marked `cut`, else null. Pure.
export const nextCut = (steps, i) => { const look = steps.slice(i + 1).find(step => step.hold && step.look); return look?.cut ? {look: look.look} : null; };

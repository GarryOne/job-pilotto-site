// POST /api/feedback: feedback from the Job Pilotto app ("Send feedback…"), kept in D1 (migrations/0003_feedback.sql) and sent at once to the owner.
// At most 10 a day per install. The owner's list is admin/feedback.js; shared/feedback.js reads what is kept. Guarded by test/shared/feedback.test.js.
import {escTags} from '../shared/html.js';


const PER_INSTALL_PER_DAY = 10;
const clip = (value, max) => String(value ?? '').replace(/\s+$/g, '').slice(0, max);
export async function feedback(request, env, fetcher = fetch, now = new Date()) {
  if (request.method !== 'POST') return new Response(null, {status: 405});
  if (!env.STATS) return Response.json({ok: false, error: 'not configured'}, {status: 503});
  const body = await request.json().catch(() => ({}));
  const text = clip(body.text, 2000).trim();
  const install = clip(body.install, 64);
  if (!text || !/^[\w-]{8,64}$/.test(install)) return Response.json({ok: false, error: 'give a message'}, {status: 400});
  const day = now.toISOString().slice(0, 10);
  const {n} = await env.STATS.prepare('SELECT COUNT(*) AS n FROM feedback WHERE day = ? AND install = ?').bind(day, install).first() || {n: 0};
  if (n >= PER_INSTALL_PER_DAY) return Response.json({ok: false, error: 'limit reached for today'}, {status: 429});
  const row = {at: now.toISOString(), day, install, version: clip(body.version, 30) || '?', platform: clip(body.platform, 20) || '?',
    text, contact: clip(body.contact, 200).trim()};
  await env.STATS.prepare('INSERT INTO feedback (at, day, install, version, platform, text, contact) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(row.at, row.day, row.install, row.version, row.platform, row.text, row.contact).run();
  if (env.BRAIN_BOT_TOKEN && env.BRAIN_CHAT_ID) {
    const message = `💬 <b>Feedback</b> · v${escTags(row.version)} · ${escTags(row.platform)} · install ${escTags(install.slice(0, 8))}\n\n${escTags(text)}` +
      (row.contact ? `\n\n↩︎ ${escTags(row.contact)}` : '');
    await fetcher(`https://api.telegram.org/bot${env.BRAIN_BOT_TOKEN}/sendMessage`, {method: 'POST',
      headers: {'Content-Type': 'application/json'}, body: JSON.stringify({chat_id: env.BRAIN_CHAT_ID, text: message, parse_mode: 'HTML'})})
      .catch(error => console.log('feedback notify failed', error.message));
  }
  return Response.json({ok: true});
}

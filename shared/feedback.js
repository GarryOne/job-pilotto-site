// What users sent through POST /api/feedback (api/feedback.js), read for the owner's pages and the product brain's signals.
// Guarded by test/shared/feedback.test.js.


// The owner's list on /telemetry (key only): newest first, with the contact when one was given.
export async function feedbackList(db, days = 30, now = new Date()) {
  const from = new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10);
  return ((await db.prepare('SELECT at, version, platform, install, text, contact FROM feedback WHERE day >= ? ORDER BY at DESC LIMIT 200')
    .bind(from).all()).results || []);
}

// The last feedback, for the product brain's signals (api/signals.js): newest first.
export async function recentFeedback(db, days = 30, now = new Date()) {
  const from = new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10);
  return ((await db.prepare('SELECT at, version, text, contact != \'\' AS canReply FROM feedback WHERE day >= ? ORDER BY at DESC LIMIT 30')
    .bind(from).all()).results || []);
}

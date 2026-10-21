// What the website's tables say about visitors, Download clicks and sign-ups over the last days. Read by admin/stats.js (the /stats page) and api/signals.js.
// The tables are filled by api/downloads.js. Guarded by test/worker/stats.test.js.

const today = (now = new Date()) => now.toISOString().slice(0, 10);

export async function report(db, days, now = new Date()) {
  const from = today(new Date(now.getTime() - (days - 1) * 86400000));
  const all = async (sql) => (await db.prepare(sql).bind(from).all()).results || [];
  const one = async (sql) => (await all(sql))[0] || {};
  const top = (table, column, what = 'COUNT(*)') =>
    all(`SELECT ${column} AS name, ${what} AS n FROM ${table} WHERE day >= ? GROUP BY ${column} ORDER BY n DESC LIMIT 10`);
  const people = 'COUNT(DISTINCT day || visitor)';  // a visitor hash is only stable within one day
  const [visits, downloads, perDay, buttons, platforms, dlSources, sources, countries, pages, devices] = await Promise.all([
    one(`SELECT COUNT(*) AS views, ${people} AS visitors FROM visits WHERE day >= ?`),
    one(`SELECT COUNT(*) AS clicks, ${people} AS people FROM downloads WHERE day >= ?`),
    all(`SELECT day, SUM(v) AS visitors, SUM(d) AS downloads FROM (
           SELECT day, COUNT(DISTINCT visitor) AS v, 0 AS d FROM visits WHERE day >= ?1 GROUP BY day
           UNION ALL SELECT day, 0, COUNT(DISTINCT visitor) FROM downloads WHERE day >= ?1 GROUP BY day)
         GROUP BY day ORDER BY day`),
    top('downloads', 'button', people), top('downloads', 'platform', people), top('downloads', 'source', people),
    top('visits', 'source', people), top('visits', 'country', people), top('visits', 'page'), top('visits', 'device', people)]);
  return {days, from, visits, downloads, perDay, buttons, platforms, dlSources, sources, countries, pages, devices};
}

export async function signups(kv) {
  if (!kv) return [];
  const listed = await kv.list({prefix: 'signup:'});
  return listed.keys.map(key => ({email: key.name.slice(7), at: key.metadata?.at || '', role: key.metadata?.role || ''}))
    .sort((a, b) => b.at.localeCompare(a.at));
}

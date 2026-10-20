// /admin/scouting "Closed sites": sites and boards installs found refused, browser-only, unreachable, page gone or without a feed, with who agrees and when each is tried again (owner, 20 Oct 2026). Host names, counts and dates only. Tests: site/test/closed-sites.test.js.
const esc = value => String(value ?? '').replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));
const all = async (db, sql, ...args) => ((await db.prepare(sql).bind(...args).all().catch(() => ({results: []}))).results) || [];

export const AGREE = 3;   // installs that must agree before others skip the site (src/pool.js OUTCOME_MIN_INSTALLS, employers.js SITES_K)
// reason → label and how many days the app leaves the site alone before it looks again (no_feed / refused / unreachable: site#2; browser-only and page gone: 30).
export const REASONS = {
  refused: {label: 'Refused', rest: 30}, browser_only: {label: 'Browser only', rest: 30}, unreachable: {label: 'Unreachable', rest: 7},
  page_gone: {label: 'Page gone', rest: 30}, no_feed: {label: 'No feed', rest: 30}};
const ROUTE_REASON = {'"refused"': 'refused', '"browser_only"': 'browser_only'}, KIND_REASON = {browser: 'browser_only', dead: 'page_gone'};

// One row per employer from the dead-end list: the word AGREE installs gave (refused, then unreachable), else no_feed when anyone said so; otherwise the leading opinion, not served yet.
export function deadEndRow(r) {
  const refused = r.refused || 0, unreachable = r.unreachable || 0, none = r.none || 0;
  const reason = refused >= AGREE ? 'refused' : unreachable >= AGREE ? 'unreachable' : none ? 'no_feed' : refused ? 'refused' : 'unreachable';
  const agreeing = {refused, unreachable, no_feed: none}[reason];
  return {site: r.host || r.company, label: r.company && r.host ? r.company : '', reason, installs: agreeing, first: r.first, last: r.last,
    served: reason === 'no_feed' ? agreeing >= 1 : agreeing >= AGREE, source: 'dead end'};
}
export function factRow(r) {
  const reason = r.kind === 'route' ? ROUTE_REASON[r.body] : KIND_REASON[r.kind];
  return reason ? {site: r.host, label: '', reason, installs: r.installs, first: r.first, last: r.last, served: r.installs >= AGREE, source: r.kind === 'route' ? 'site route' : 'site fact'} : null;
}
export const retryOn = (row, today = new Date()) => {
  const date = new Date(Date.parse(row.last) + REASONS[row.reason].rest * 86400000).toISOString().slice(0, 10);
  return date <= today.toISOString().slice(0, 10) ? 'due now' : date;
};

export async function gather(db, family = '') {
  const F = " (? = '' OR ai_family = ?) ", f = [family, family];
  const dead = await all(db, `SELECT MAX(company) AS company, MAX(host) AS host, COUNT(*) AS installs, MIN(day) AS first, MAX(day) AS last, SUM(outcome = 'refused') AS refused,
    SUM(outcome = 'unreachable') AS unreachable, SUM(outcome IS NULL OR outcome = 'no_feed') AS none FROM nofeed WHERE${F}GROUP BY key ORDER BY last DESC LIMIT 1000`, ...f);
  const facts = await all(db, `SELECT host, kind, body, COUNT(DISTINCT install) AS installs, MIN(day) AS first, MAX(day) AS last FROM sitefacts
    WHERE kind IN ('route', 'browser', 'dead') AND (kind != 'route' OR body IN ('"refused"', '"browser_only"')) GROUP BY host, kind, body ORDER BY last DESC LIMIT 1000`);
  return [...dead.map(deadEndRow), ...facts.map(factRow).filter(Boolean)];
}

export function section(rows = [], today = new Date()) {
  const sorted = [...rows].sort((a, b) => (b.last || '').localeCompare(a.last || ''));
  const count = reason => sorted.filter(row => row.reason === reason).length;
  const chip = (key, label, n) => `<button type="button" class="chip" data-closed="${key}" aria-pressed="${key === ''}">${label} · ${n}</button>`;
  const body = sorted.map(row => `<tr data-reason="${row.reason}"><td>${esc(row.site)}<br><small class="muted">${esc(row.label ? row.label + ' · ' : '')}${esc(row.source)}</small></td>
<td><span class="pill">${REASONS[row.reason].label}</span></td><td class="n">${row.installs}</td><td>${esc(row.first)}</td><td>${esc(row.last)}</td><td>${retryOn(row, today)}</td><td>${row.served ? 'yes' : 'not yet'}</td></tr>`).join('');
  const served = sorted.filter(row => row.served).length;
  return `<section class="card" id="closed-sites"><h2>🚧 Closed sites · ${sorted.length}</h2>
<small class="muted">Sites and boards installs found refused, browser-only, unreachable, gone or without a feed. ${served} of ${sorted.length} are served, so installs skip them until the retry date. How often installs skipped: <a href="/admin/installs">/admin/installs</a>.</small>
<div class="chips">${chip('', 'All', sorted.length)}${Object.entries(REASONS).map(([key, {label}]) => chip(key, label, count(key))).join('')}</div>
<div class="scroll"><table><tr><th>Site or board</th><th>Reason</th><th>Installs agreeing</th><th>First seen</th><th>Last seen</th><th>Next retry</th><th>Served</th></tr>
${body || '<tr><td colspan="7" class="muted">Nothing reported yet.</td></tr>'}</table></div>
<small class="muted">Served = ${AGREE} installs agree (a single report is enough for No feed). Rests: ${Object.values(REASONS).map(r => r.label.toLowerCase() + ' ' + r.rest).join(', ')} days.</small>
<script>document.querySelectorAll('[data-closed]').forEach(b => b.onclick = () => { document.querySelectorAll('[data-closed]').forEach(x => x.setAttribute('aria-pressed', x === b));
  document.querySelectorAll('#closed-sites tr[data-reason]').forEach(tr => { tr.hidden = !!b.dataset.closed && tr.dataset.reason !== b.dataset.closed; }); });</script></section>`;
}

// The What's new page: the versions from changelog.json (CI drafts them, the site stores them; src/changelog-store.js), newest first.
// The newest is a card with its main change as the headline, the next shows three highlights, older ones are compact rows that open on a click;
// the rest of a release folds under "View all N changes". Text goes in as text, never as HTML. Guarded by test/web/changelog-page.test.js.
const KINDS = [['features', 'New'], ['improvements', 'Improved'], ['fixes', 'Fix']];
const CHANNELS = {stable: 'Stable', beta: 'Beta', start: 'Project start'};
const HIGHLIGHTS = 3, FIRST_ROWS = 3, MORE_ROWS = 6;
const SVG = 'http://www.w3.org/2000/svg';
const PATHS = {features: 'M14 3H5v18h14V8Zm0 0v5h5M8 13h8m-8 4h5', improvements: 'M4 20V10m6 10V4m6 16v-7m5 7H2', fixes: 'm14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4Z', down: 'm6 9 6 6 6-6', right: 'm9 6 6 6-6 6'};

const make = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
function icon(name, cls) {
  const svg = document.createElementNS(SVG, 'svg'), path = document.createElementNS(SVG, 'path');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); if (cls) svg.setAttribute('class', cls);
  path.setAttribute('d', PATHS[name]); svg.append(path); return svg;
}
const changes = entry => KINDS.flatMap(([kind, label]) => ((entry.groups || []).find(g => g.kind === kind)?.items || []).map(item => ({...item, label, kind})));
const day = entry => new Date(`${entry.date}T00:00:00Z`).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'});

function list(items) {
  const ul = make('ul', 'changes');
  for (const item of items) {
    const li = make('li'), body = make('span');
    body.append(make('b', '', `${item.lead}. `), item.text);
    li.append(make('span', `tag ${item.kind}`, item.label), body); ul.append(li);
  }
  return ul;
}
const chip = entry => make('span', `channel ${entry.channel}`, CHANNELS[entry.channel] || entry.channel);
const heading = (entry, tag) => { const h = make(tag, 'rel-head'), time = make('time', '', day(entry)); time.dateTime = entry.date; h.append(make('b', 'ver', tag === 'span' ? entry.version : `Version ${entry.version}`), chip(entry), time); return h; };
function fold(items, label) {
  const box = make('details', 'more'), summary = make('summary', '', label);
  summary.append(icon('down', 'chev')); box.append(summary, list(items)); return box;
}

// The newest release: its first change is the headline, the kinds it has are chips, the rest folds.
function latest(entry) {
  const box = make('article', 'release card latest'), all = changes(entry), [first, ...rest] = all, kinds = KINDS.filter(([kind]) => all.some(c => c.kind === kind));
  box.id = `v${entry.version}`; box.append(heading(entry, 'h2'));
  if (first) {
    const chips = make('p', 'kinds'); kinds.forEach(([, label]) => chips.append(make('span', 'kind', label)));
    box.append(make('h3', 'headline', first.lead), make('p', 'sub', first.text), chips);
  }
  if (rest.length) box.append(fold(all, `View all ${all.length} changes`));
  return box;
}
// The next release: three highlights side by side.
function next(entry) {
  const box = make('article', 'release card'), all = changes(entry), cols = make('div', 'highlights');
  box.id = `v${entry.version}`; box.append(heading(entry, 'h2'));
  for (const item of all.slice(0, HIGHLIGHTS)) {
    const col = make('div', 'hl'), text = make('div');
    text.append(make('b', '', item.lead), make('span', '', item.text));
    col.append(make('span', 'ico', ''), text); col.firstChild.append(icon(item.kind)); cols.append(col);
  }
  box.append(cols);
  if (all.length > HIGHLIGHTS) box.append(fold(all, `View all ${all.length} changes`));
  return box;
}
function row(entry) {
  const box = make('details', 'release row'), summary = make('summary'), first = changes(entry)[0];
  box.id = `v${entry.version}`;
  const head = heading(entry, 'span'); summary.append(head, make('span', 'sum', first ? first.lead : ''), icon('right', 'chev'));
  box.append(summary, list(changes(entry)));
  return box;
}

function render(root, entries) {
  root.replaceChildren();
  entries.forEach((entry, i) => { if (i < 2) root.append(i ? next(entry) : latest(entry)); });
  const older = entries.slice(2), rows = make('div', 'rows');
  if (!older.length) return;
  root.append(rows);
  let shown = 0;
  const button = make('button', 'btn btn-primary load', 'Load earlier releases');
  const more = () => { older.slice(shown, shown ? shown + MORE_ROWS : FIRST_ROWS).forEach(entry => rows.append(row(entry))); shown = rows.children.length; button.hidden = shown >= older.length; };
  button.addEventListener('click', more); more(); root.append(button);
  const target = location.hash && root.ownerDocument.getElementById(location.hash.slice(1));
  if (!target) return;
  while (!target.isConnected && !button.hidden) more();
  if (target.tagName === 'DETAILS') target.open = true;
  target.scrollIntoView();
}

const TABS = [['all', 'All releases', () => true], ['stable', 'Stable', e => e.channel === 'stable'], ['beta', 'Beta', e => e.channel === 'beta']];
fetch('changelog.json').then(r => (r.ok ? r.json() : [])).catch(() => []).then(entries => {
  const root = document.getElementById('release-list'), tabs = document.getElementById('release-tabs');
  if (!Array.isArray(entries) || !entries.length) { document.getElementById('releases-empty').hidden = false; return; }
  tabs.hidden = false;
  const pick = key => {
    for (const button of tabs.children) button.setAttribute('aria-selected', String(button.dataset.tab === key));
    render(root, entries.filter(TABS.find(([k]) => k === key)[2]));
  };
  for (const [key, label] of TABS) { const b = make('button', '', label); b.type = 'button'; b.role = 'tab'; b.dataset.tab = key; b.addEventListener('click', () => pick(key)); tabs.append(b); }
  pick('all');
});

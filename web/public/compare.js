// The Compare page's picker: Jobadabra next to one chosen tool (Simplify by default), or all of them. Without this script the table shows every tool.
// Hides the other tools' cells; compare.css turns rows into cards on a phone. Guarded by test/web/compare-page.test.js.
(() => {
  const box = document.getElementById('cmp');
  const select = document.getElementById('cmp-with');
  if (!box || !select) return;
  const show = tool => {
    box.dataset.tool = tool;
    select.value = tool;
    for (const cell of box.querySelectorAll('[data-tool]:not(#cmp)')) cell.hidden = tool !== 'all' && cell.dataset.tool !== tool;
    for (const group of box.querySelectorAll('tr.group th')) group.colSpan = tool === 'all' ? 7 : 3;
  };
  select.addEventListener('change', () => show(select.value));
  box.querySelector('[data-all]')?.addEventListener('click', () => show('all'));
  show('simplify');
})();

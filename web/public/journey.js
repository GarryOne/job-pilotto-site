// The landing's whole-journey panel (index.html #journey): each step is a tab that shows its words below; arrows, Home and End move along
// the steps. Without this script the first step's words show. Guarded by test/web/effects.test.js.
(() => {
  const tabs = [...document.querySelectorAll('#journey [role="tab"]')];
  const show = tab => {
    for (const other of tabs) {
      const on = other === tab;
      other.setAttribute('aria-selected', String(on));
      other.tabIndex = on ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls')).hidden = !on;
    }
  };
  for (const tab of tabs) {
    tab.addEventListener('click', () => show(tab));
    tab.addEventListener('keydown', event => {
      const at = tabs.indexOf(tab);
      const to = {ArrowRight: at + 1, ArrowDown: at + 1, ArrowLeft: at - 1, ArrowUp: at - 1, Home: 0, End: tabs.length - 1}[event.key];
      if (to === undefined) return;
      event.preventDefault();
      const next = tabs[(to + tabs.length) % tabs.length];
      show(next);
      next.focus();
    });
  }

  // The way back: from the last step, down under the second row, along the left edge and into the first step, drawn where the steps sit now.
  const rows = document.querySelector('#journey .journey-rows');
  const loop = rows && rows.querySelector('.journey-loop');
  const nodes = rows ? [...rows.querySelectorAll('.node')] : [];
  if (!loop || nodes.length < 2) return;
  const draw = () => {
    const box = rows.getBoundingClientRect(), from = nodes[nodes.length - 1].getBoundingClientRect(), to = nodes[0].getBoundingClientRect();
    const x0 = from.right - box.left + 4, y1 = from.top + from.height / 2 - box.top, x1 = x0 + 14;   // leaves the last step on its right, clear of its label
    const bottom = box.height + 18, side = -Math.min(18, box.left - rows.closest('.journey').getBoundingClientRect().left - 4);
    const y2 = to.top + to.height / 2 - box.top, x2 = to.left - box.left - 8, r = 10;
    loop.setAttribute('width', box.width); loop.setAttribute('height', bottom + 30);
    loop.querySelector('.line').setAttribute('d', `M${x0} ${y1}H${x1 - r}Q${x1} ${y1} ${x1} ${y1 + r}V${bottom - r}Q${x1} ${bottom} ${x1 - r} ${bottom}H${side + r}Q${side} ${bottom} ${side} ${bottom - r}`
      + `V${y2 + r}Q${side} ${y2} ${side + r} ${y2}H${x2 - 6}`);
    loop.querySelector('.head').setAttribute('d', `M${x2} ${y2}l-7 -4v8Z`);
    const text = loop.querySelector('text');
    text.setAttribute('x', (x1 + side) / 2); text.setAttribute('y', bottom + 18);
    rows.classList.add('looped');
  };
  draw();
  addEventListener('resize', draw);
  if (document.fonts) document.fonts.ready.then(draw);
})();

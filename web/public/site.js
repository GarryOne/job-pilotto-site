// What every public page shares: the nav's edge on scroll, sections easing in, the cursor glow on cards, one FAQ answer open, the live numbers, copy buttons,
// close-up strips, and (landing only) old #section links sent to the page that now holds that section. Guarded by test/web/landing.test.js and effects.test.js.
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  const nav = document.getElementById('topnav');
  if (nav) addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), {passive: true});

  if (!calm && 'IntersectionObserver' in window) {
    const seen = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); seen.unobserve(entry.target); }
    }), {rootMargin: '0px 0px -10% 0px'});
    document.querySelectorAll('.reveal').forEach(el => seen.observe(el));
  } else document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));

  // The cursor glow on every card (effects.css .glow): the light follows a mouse or pen, never a finger, and stays still with reduced motion.
  // A new kind of card joins CARDS, or LEFT_OUT in test/web/effects.test.js says why not.
  const CARDS = ['.glow-panel', '.steps li', '.numbers li', '.next-page', '.os-card', '.trust-grid li', '.stop-panel', '.setup-cols > div', '.pass', '.boarding',
    '.faq details', '.promise', '.ai-step', '.apply-steps li', '.evidence-stats li', '.first-run li', 'details.tech'];
  for (const card of document.querySelectorAll(CARDS.join(','))) {
    card.classList.add('glow');
    if (calm) continue;
    let queued = null;
    card.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      if (!queued) requestAnimationFrame(() => {
        const box = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${queued.x - box.left}px`);
        card.style.setProperty('--my', `${queued.y - box.top}px`);
        queued = null;
      });
      queued = {x: event.clientX, y: event.clientY};
    }, {passive: true});
  }

  // FAQ: one answer open at a time.
  const answers = document.querySelectorAll('.faq details');
  for (const item of answers) item.addEventListener('toggle', () => { if (item.open) for (const other of answers) if (other !== item) other.open = false; });

  // The live numbers: counts only, from the public summary of the employer list. The page keeps its written floor when this fails.
  const slots = document.querySelectorAll('[data-count]');
  if (slots.length) fetch('/api/index?summary=1').then(r => (r.ok ? r.json() : null)).then(data => {
    if (!data || !data.employers) return;
    for (const slot of slots) {
      const value = data[slot.dataset.count];
      if (typeof value === 'number' && value > 0) slot.textContent = value.toLocaleString('en-US');
    }
  }).catch(() => {});

  for (const button of document.querySelectorAll('[data-copy]')) button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(button.dataset.copy); button.textContent = 'Copied'; }
    catch { getSelection().selectAllChildren(button.previousElementSibling); button.textContent = 'Press Ctrl+C'; }
    setTimeout(() => { button.textContent = 'Copy'; }, 2000);
  });

  for (const button of document.querySelectorAll('.car-btn')) button.addEventListener('click', () => {
    const track = button.closest('.carousel').querySelector('.car-track');
    const card = track.querySelector('.car-item');
    track.scrollBy({left: Number(button.dataset.dir) * ((card?.offsetWidth || 400) + 20), behavior: calm ? 'auto' : 'smooth'});
  });

  // Links shared before 20 Oct 2026 point at sections of the long landing; each now lives on its own page.
  const MOVED = {how: '/how-it-works', 'your-click': '/how-it-works#control', autoapply: '/how-it-works#fill', app: '/features', learns: '/features#coach',
    see: '/features#screens', intelligence: '/intelligence', evidence: '/research', privacy: '/trust', trust: '/trust#download', setup: '/download',
    pricing: '/pricing', early: '/pricing#early', faq: '/faq'};
  if (document.body.dataset.page === 'home') {
    const to = MOVED[location.hash.slice(1)];
    if (to) location.replace(to);
  }
})();

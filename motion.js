// ADRESS CLUB — motion design : transitions entre écrans, photo partagée, révélations au défilement,
// parallaxe, compteurs, indicateur de navigation, intro. Tout est désactivé si l'appareil demande moins d'animations.
const app = document.getElementById('app');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
let pending = null, shared = false;

// ---------- intro (une fois par session) ----------
let seen = false; try { seen = sessionStorage.getItem('acl-intro') === '1'; sessionStorage.setItem('acl-intro', '1'); } catch (_) {}
let intro = null;
if (!reduce && !seen) {
  intro = document.createElement('div'); intro.className = 'intro';
  intro.innerHTML = '<div class="intro-in"><img src="logo.png" alt=""><i></i><span>CLUB</span></div>';
  document.body.appendChild(intro);
}
const closeIntro = () => { if (!intro) return; const el = intro; intro = null; setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 700); }, 900); };
setTimeout(closeIntro, 3500);

// ---------- transitions entre écrans (View Transitions API) ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || reduce || !document.startViewTransition) return;
  const href = a.getAttribute('href'); if (href === location.hash) return;
  e.preventDefault();
  const ph = a.querySelector('.ph');
  shared = !!(ph && /^#\/annonce\//.test(href));
  if (shared) ph.style.viewTransitionName = 'photo';
  root.dataset.dir = a.classList.contains('back') ? 'back' : 'fwd';
  root.classList.add('vt');
  const t = document.startViewTransition(() => new Promise((res) => {
    pending = res; setTimeout(() => { if (pending === res) { pending = null; res(); } }, 1600);
    location.hash = href;
  }));
  t.finished.finally(() => { root.classList.remove('vt'); shared = false; document.querySelectorAll('[style*="view-transition-name"]').forEach(el => el.style.viewTransitionName = ''); });
}, true);
window.addEventListener('popstate', () => { root.dataset.dir = 'back'; });

// ---------- après chaque rendu d'écran ----------
new MutationObserver(() => {
  if (!app.classList.contains('page-in')) return;
  decorate();
  closeIntro();
  if (pending) { const r = pending; pending = null; r(); }
}).observe(app, { attributes: true, attributeFilter: ['class'] });

const io = 'IntersectionObserver' in window ? new IntersectionObserver((list) => list.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;

function decorate() {
  if (shared) { const g = app.querySelector('.gal img'); if (g) g.style.viewTransitionName = 'photo'; }
  // chargement progressif des photos (flou → net)
  app.querySelectorAll('.ph').forEach(el => {
    const m = /url\(["']?(.*?)["']?\)/.exec(el.style.backgroundImage || ''); if (!m || !m[1]) { el.classList.add('ld'); return; }
    const im = new Image(); im.onload = im.onerror = () => el.classList.add('ld'); im.src = m[1];
  });
  app.querySelectorAll('.gal img').forEach(im => { if (im.complete) im.classList.add('ld'); else im.addEventListener('load', () => im.classList.add('ld'), { once: true }); });
  if (reduce) return;
  // révélation au défilement pour ce qui est sous la ligne de flottaison
  if (io) app.querySelectorAll('.item, .mini, .menu a, .list > .card, .stat, .feature, section h2').forEach(el => {
    if (el.getBoundingClientRect().top > innerHeight * .92) { el.classList.add('rv'); io.observe(el); }
  });
  // compteurs animés (indicateurs)
  app.querySelectorAll('.stat .v').forEach(el => {
    const n = parseFloat(String(el.textContent).replace(',', '.')); if (!isFinite(n) || n === 0) return;
    const dec = String(el.textContent).includes('.') ? 1 : 0, t0 = performance.now(), d = 1100;
    const step = (t) => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = (n * e).toFixed(dec); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  moveIndicator();
}

// ---------- indicateur de navigation qui glisse ----------
const bar = document.getElementById('nav');
let ind = null;
function moveIndicator() {
  if (!bar) return;
  if (!ind) { ind = document.createElement('i'); ind.className = 'tab-ind'; bar.appendChild(ind); bar.classList.add('has-ind'); }
  const on = bar.querySelector('a.on:not(.tab-pub)');
  if (!on) { ind.style.opacity = '0'; return; }
  const r = on.getBoundingClientRect(), b = bar.getBoundingClientRect();
  ind.style.opacity = '1'; ind.style.transform = `translateX(${r.left - b.left + r.width / 2 - 11}px)`;
}
addEventListener('resize', moveIndicator);

// ---------- parallaxe du bandeau ----------
let ticking = false;
addEventListener('scroll', () => {
  if (reduce || ticking) return; ticking = true;
  requestAnimationFrame(() => { const z = app.querySelector('.hero .bgz'); if (z) z.style.translate = `0 ${Math.min(scrollY, 400) * 0.3}px`; ticking = false; });
}, { passive: true });

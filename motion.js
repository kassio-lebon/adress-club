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
  const hero = app.querySelector('.hero');
  if (hero && !hero.querySelector('.orb')) { hero.insertAdjacentHTML('beforeend', '<i class="orb o1"></i><i class="orb o2"></i>'); requestAnimationFrame(() => hero.querySelectorAll('.orb').forEach(o => o.classList.add('on'))); }
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

// ---------- mobile : vibrations, points de galerie, tirer pour actualiser, glisser pour revenir ----------
const touch = matchMedia('(pointer: coarse)').matches;
const buzz = (ms = 8) => { try { if (touch && navigator.vibrate) navigator.vibrate(ms); } catch (_) {} };
document.addEventListener('click', (e) => { if (e.target.closest('.tabbar a, .fav, #int, .chip, [data-act], .btn')) buzz(); }, true);

new MutationObserver(() => {
  const gal = app.querySelector('.gal');
  if (!gal || gal.children.length < 2 || gal.dataset.dots) return;
  gal.dataset.dots = '1';
  const d = document.createElement('div'); d.className = 'dots';
  d.innerHTML = [...gal.children].map((_, i) => '<i' + (i ? '' : ' class="on"') + '></i>').join('');
  gal.after(d);
  let last = 0;
  gal.addEventListener('scroll', () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); if (i !== last) { last = i; buzz(5); d.querySelectorAll('i').forEach((x, k) => x.classList.toggle('on', k === i)); } }, { passive: true });
}).observe(app, { childList: true });

if (touch && !reduce) {
  const ptr = document.createElement('div'); ptr.className = 'ptr'; ptr.innerHTML = '<i></i>'; document.body.appendChild(ptr);
  let y0 = null, pulled = 0, sx = null, sy = 0;
  const iosBrowser = /iP(hone|ad|od)/.test(navigator.userAgent) && !navigator.standalone;
  addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    y0 = scrollY <= 0 && !e.target.closest('.gal, .strip, .flip, input, textarea, select, .tabs') ? t.clientY : null;
    sx = !iosBrowser && t.clientX < 24 ? t.clientX : null; sy = t.clientY;
  }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (y0 === null) return;
    pulled = Math.max(0, Math.min(110, (e.touches[0].clientY - y0) * 0.5));
    if (pulled > 4) { ptr.classList.add('drag'); ptr.style.opacity = Math.min(1, pulled / 60); ptr.style.transform = `translate(-50%, ${pulled - 50}px) rotate(${pulled * 3}deg)`; }
  }, { passive: true });
  addEventListener('touchend', (e) => {
    ptr.classList.remove('drag');
    if (y0 !== null && pulled > 70) {
      buzz(12); ptr.style.opacity = ''; ptr.style.transform = ''; ptr.classList.add('spin');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      setTimeout(() => ptr.classList.remove('spin'), 900);
    } else if (y0 !== null) { ptr.style.opacity = ''; ptr.style.transform = ''; }
    y0 = null; pulled = 0;
    if (sx !== null) {
      const t = e.changedTouches[0];
      if (t.clientX - sx > 80 && Math.abs(t.clientY - sy) < 70 && location.hash && location.hash !== '#/') {
        buzz(); root.dataset.dir = 'back';
        if (document.startViewTransition) {
          root.classList.add('vt');
          const v = document.startViewTransition(() => new Promise((res) => { pending = res; setTimeout(() => { if (pending === res) { pending = null; res(); } }, 1600); history.back(); }));
          v.finished.finally(() => root.classList.remove('vt'));
        } else history.back();
      }
      sx = null;
    }
  }, { passive: true });
}

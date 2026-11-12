// ADRESS CLUB — motion design : transitions entre écrans, photo partagée, révélations au défilement,
// parallaxe, compteurs, indicateur de navigation, intro. Tout est désactivé si l'appareil demande moins d'animations.
const app = document.getElementById('app');
// emblème ADRESS (les deux arcs du logo, redessinés en vectoriel pour rester nets)
const MARK = {"vb":[446,355],"red":"M408.3 325.7 L403.2 327.7 L397.4 329.0 L391.0 329.8 L383.8 330.1 L376.1 329.7 L367.7 328.8 L358.8 327.4 L349.3 325.4 L339.3 322.9 L328.8 319.9 L317.9 316.4 L306.6 312.4 L294.8 308.0 L282.8 303.0 L270.4 297.7 L257.8 291.9 L244.9 285.6 L231.9 279.0 L218.8 272.0 L205.6 264.7 L192.3 257.0 L179.1 249.0 L165.9 240.6 L152.9 232.0 L140.1 223.2 L127.5 214.0 L115.2 204.7 L103.3 195.2 L91.8 185.6 L80.7 175.8 L70.2 166.0 L60.2 156.1 L50.9 146.2 L42.3 136.3 L34.4 126.4 L27.3 116.7 L21.0 107.2 L15.5 97.8 L10.9 88.6 L7.3 79.8 L4.6 71.3 L2.8 63.2 L2.0 55.5 L2.2 48.3 L3.3 41.5 L5.4 35.4 L8.5 29.8 L12.5 24.9 L17.5 20.7 L23.3 17.1 L29.9 14.3 L37.4 12.2 L45.7 10.9 L54.7 10.3 L64.3 10.5 L74.6 11.5 L85.5 13.3 L96.8 15.8 L108.6 19.1 L120.8 23.1 L133.3 27.9 L146.0 33.2 L159.0 39.3 L172.1 45.9 L185.2 53.1 L198.4 60.8 L211.6 69.0 L224.7 77.6 L237.6 86.6 L250.4 95.9 L263.0 105.5 L275.3 115.3 L287.3 125.3 L298.9 135.4 L310.2 145.5 L321.1 155.7 L331.6 165.9 L341.6 176.0 L351.1 186.0 L360.2 195.9 L368.7 205.7 L376.7 215.2 L384.1 224.5 L391.0 233.6 L397.2 242.3 L402.8 250.8 L407.8 259.0 L412.1 266.9 L415.8 274.3 L418.7 281.5 L413.8 280.5 L410.8 273.7 L407.0 266.5 L402.3 259.0 L397.0 251.2 L390.8 243.1 L384.0 234.9 L376.4 226.5 L368.3 217.9 L359.4 209.3 L350.1 200.7 L340.2 192.1 L329.8 183.5 L319.1 175.0 L307.9 166.7 L296.5 158.5 L284.8 150.5 L273.0 142.7 L261.0 135.1 L248.9 127.8 L236.9 120.8 L224.9 114.1 L212.9 107.7 L201.2 101.7 L189.6 96.0 L178.3 90.6 L167.3 85.6 L156.6 80.9 L146.3 76.7 L136.4 72.8 L127.0 69.3 L118.0 66.2 L109.5 63.5 L101.5 61.2 L94.1 59.3 L87.2 57.8 L80.8 56.7 L75.1 56.1 L69.9 55.9 L65.3 56.1 L61.4 56.7 L58.0 57.8 L55.3 59.4 L53.2 61.4 L51.7 63.9 L50.8 66.8 L50.5 70.2 L50.9 74.0 L51.9 78.3 L53.6 83.1 L55.8 88.3 L58.7 93.9 L62.2 99.9 L66.2 106.4 L70.9 113.2 L76.2 120.4 L82.1 127.9 L88.5 135.8 L95.5 143.9 L103.0 152.3 L111.0 160.8 L119.6 169.6 L128.6 178.5 L138.0 187.4 L147.9 196.5 L158.1 205.5 L168.7 214.5 L179.6 223.4 L190.7 232.2 L202.1 240.8 L213.6 249.2 L225.3 257.3 L237.0 265.1 L248.8 272.6 L260.6 279.7 L272.2 286.4 L283.8 292.7 L295.2 298.4 L306.3 303.7 L317.2 308.4 L327.7 312.6 L337.8 316.3 L347.5 319.3 L356.8 321.8 L365.5 323.6 L373.6 324.9 L381.2 325.5 L388.1 325.6 L394.4 325.0 L399.9 323.9 L404.8 322.2Z","grey":"M36.4 315.1 L38.4 308.3 L41.0 301.0 L44.2 293.2 L48.0 285.1 L52.5 276.6 L57.6 267.7 L63.3 258.4 L69.5 248.9 L76.4 239.1 L83.8 229.0 L91.7 218.7 L100.1 208.3 L109.1 197.7 L118.5 187.0 L128.3 176.3 L138.5 165.5 L149.1 154.8 L160.0 144.1 L171.3 133.6 L182.8 123.2 L194.5 113.0 L206.4 103.0 L218.5 93.3 L230.6 83.9 L242.8 74.8 L255.0 66.2 L267.2 58.0 L279.4 50.2 L291.4 42.9 L303.2 36.1 L314.8 29.9 L326.2 24.3 L337.3 19.2 L348.0 14.8 L358.4 11.0 L368.3 7.9 L377.8 5.4 L386.7 3.6 L395.1 2.4 L403.0 2.0 L410.2 2.2 L416.8 3.2 L422.8 4.8 L428.0 7.0 L432.6 9.9 L436.4 13.5 L439.4 17.7 L441.7 22.5 L443.3 27.9 L444.0 33.9 L444.0 40.4 L443.1 47.4 L441.5 54.9 L439.2 62.8 L436.0 71.2 L432.1 79.9 L427.5 89.0 L422.2 98.4 L416.1 108.1 L409.4 118.0 L402.0 128.1 L394.1 138.4 L385.5 148.7 L376.4 159.2 L366.8 169.7 L356.8 180.3 L346.3 190.7 L335.4 201.2 L324.1 211.5 L312.6 221.7 L300.8 231.7 L288.8 241.4 L276.7 251.0 L264.4 260.3 L252.1 269.3 L239.7 277.9 L227.4 286.2 L215.2 294.2 L203.0 301.7 L191.1 308.8 L179.3 315.5 L167.8 321.7 L156.5 327.4 L145.6 332.7 L135.1 337.4 L124.9 341.6 L115.1 345.3 L105.8 348.5 L97.0 351.2 L88.6 353.3 L89.6 350.5 L97.9 348.1 L106.6 345.0 L115.8 341.3 L125.4 337.1 L135.3 332.3 L145.6 326.9 L156.1 321.0 L166.9 314.6 L177.8 307.8 L189.0 300.5 L200.2 292.8 L211.5 284.8 L222.9 276.3 L234.3 267.6 L245.6 258.6 L256.9 249.4 L268.0 239.9 L279.0 230.3 L289.7 220.6 L300.3 210.7 L310.6 200.8 L320.6 190.9 L330.2 181.0 L339.5 171.1 L348.4 161.4 L356.9 151.7 L365.0 142.2 L372.5 132.9 L379.6 123.8 L386.2 115.0 L392.2 106.4 L397.6 98.2 L402.5 90.3 L406.8 82.7 L410.5 75.6 L413.6 68.8 L416.0 62.5 L417.8 56.6 L419.0 51.2 L419.5 46.3 L419.4 41.9 L418.6 38.0 L417.2 34.6 L415.1 31.7 L412.4 29.4 L409.1 27.6 L405.2 26.4 L400.6 25.7 L395.4 25.6 L389.7 26.1 L383.4 27.0 L376.6 28.6 L369.2 30.6 L361.4 33.3 L353.1 36.4 L344.3 40.0 L335.1 44.2 L325.6 48.8 L315.6 53.9 L305.4 59.5 L294.8 65.5 L284.0 71.9 L273.0 78.8 L261.9 86.0 L250.5 93.5 L239.1 101.4 L227.6 109.6 L216.1 118.1 L204.7 126.9 L193.3 135.9 L182.0 145.0 L170.8 154.4 L159.9 163.9 L149.2 173.5 L138.7 183.1 L128.6 192.8 L118.8 202.5 L109.4 212.2 L100.5 221.8 L92.0 231.4 L84.0 240.8 L76.5 250.0 L69.7 259.1 L63.3 267.9 L57.7 276.5 L52.6 284.8 L48.2 292.7 L44.5 300.3 L41.5 307.4 L39.3 314.2Z","greyTop":"M399.2 131.8 L396.4 135.4 L393.5 139.0 L390.6 142.7 L387.6 146.3 L384.5 150.0 L381.3 153.6 L378.1 157.3 L374.8 161.0 L371.5 164.7 L368.1 168.4 L364.6 172.1 L361.1 175.7 L357.6 179.4 L353.9 183.1 L350.3 186.8 L346.5 190.5 L342.8 194.1 L338.9 197.8 L335.1 201.4 L331.2 205.1 L327.2 208.7 L323.2 212.3 L319.2 215.9 L315.2 219.4 L311.1 223.0 L307.0 226.5 L302.8 230.0 L298.7 233.5 L294.5 236.9 L290.2 240.3 L280.2 229.2 L284.0 225.8 L287.8 222.4 L291.5 218.9 L295.2 215.5 L298.9 212.0 L302.6 208.5 L306.2 205.1 L309.8 201.6 L313.3 198.1 L316.8 194.6 L320.3 191.2 L323.7 187.7 L327.1 184.2 L330.5 180.7 L333.8 177.3 L337.0 173.8 L340.2 170.4 L343.4 166.9 L346.5 163.5 L349.6 160.1 L352.6 156.7 L355.5 153.3 L358.4 150.0 L361.3 146.6 L364.0 143.3 L366.8 140.0 L369.4 136.8 L372.1 133.5 L374.6 130.3 L377.1 127.1Z"};
const markSvg = (cls) => '<svg class="' + cls + '" viewBox="0 0 ' + MARK.vb[0] + ' ' + MARK.vb[1] + '" aria-hidden="true"><path class="mg" d="' + MARK.grey + '"/><path class="mr" d="' + MARK.red + '"/><path class="mg mgt" d="' + MARK.greyTop + '"/></svg>';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
let pending = null, shared = false;

// ---------- intro (une fois par session) ----------
let seen = false; try { seen = sessionStorage.getItem('acl-intro') === '1'; sessionStorage.setItem('acl-intro', '1'); } catch (_) {}
let intro = null; const t0 = Date.now();
if (!reduce && !seen) {
  intro = document.createElement('div'); intro.className = 'intro intro2';
  intro.innerHTML = '<div class="intro-stage">' + markSvg('intro-mark') + '<div class="intro-in"><img src="logo.png" alt=""><i></i><span>CLUB</span></div></div>';
  document.body.appendChild(intro);
  // impact ressenti : légère vibration quand les deux traits se croisent
  setTimeout(() => { try { if (matchMedia('(pointer: coarse)').matches && navigator.vibrate) navigator.vibrate([14, 60, 22]); } catch (_) {} }, 950);
}
const closeIntro = () => {
  if (!intro) return; const el = intro; intro = null;
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 900); }, Math.max(0, 2900 - (Date.now() - t0)));
};
setTimeout(closeIntro, 4200);

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

const vus = new Set();
function photos() {
  app.querySelectorAll('.ph:not(.ld)').forEach(el => {
    const m = /url\(["']?(.*?)["']?\)/.exec(el.style.backgroundImage || ''); if (!m || !m[1] || vus.has(m[1])) { el.classList.add('ld'); return; }
    const im = new Image(); im.onload = im.onerror = () => { vus.add(m[1]); el.classList.add('ld'); }; im.src = m[1];
  });
  app.querySelectorAll('.gal img:not(.ld)').forEach(im => { if (im.complete) im.classList.add('ld'); else im.addEventListener('load', () => im.classList.add('ld'), { once: true }); });
}
new MutationObserver(photos).observe(app, { childList: true, subtree: true });
// page de connexion : emblème animé en fond
const loginFx = () => { const l = app.querySelector('.login'); if (l && !l.querySelector('.login-mark')) l.insertAdjacentHTML('afterbegin', markSvg('login-mark') + markSvg('login-mark lm2')); };
loginFx(); new MutationObserver(loginFx).observe(app, { childList: true, subtree: true });

function decorate() {
  if (shared) { const g = app.querySelector('.gal img'); if (g) g.style.viewTransitionName = 'photo'; }
  const hero = app.querySelector('.hero');
  if (hero && !hero.querySelector('.mark-anim')) hero.insertAdjacentHTML('beforeend', markSvg('mark-anim'));
  app.querySelectorAll('.fc-cover').forEach(c => { if (!c.querySelector('.mark-anim')) c.insertAdjacentHTML('beforeend', markSvg('mark-anim sm')); });
  // chargement progressif des photos (flou → net)
  photos();
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

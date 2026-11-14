// ADRESS CLUB — motion design : transitions entre écrans, photo partagée, révélations au défilement,
// parallaxe, compteurs, indicateur de navigation, intro. Tout est désactivé si l'appareil demande moins d'animations.
const app = document.getElementById('app');
// emblème ADRESS (les deux arcs du logo, redessinés en vectoriel pour rester nets)
const MARK = {"vb":[446,355],"red":"M408.3 325.7 L403.2 327.7 L397.4 329.0 L391.0 329.8 L383.8 330.1 L376.1 329.7 L367.7 328.8 L358.8 327.4 L349.3 325.4 L339.3 322.9 L328.8 319.9 L317.9 316.4 L306.6 312.4 L294.8 308.0 L282.8 303.0 L270.4 297.7 L257.8 291.9 L244.9 285.6 L231.9 279.0 L218.8 272.0 L205.6 264.7 L192.3 257.0 L179.1 249.0 L165.9 240.6 L152.9 232.0 L140.1 223.2 L127.5 214.0 L115.2 204.7 L103.3 195.2 L91.8 185.6 L80.7 175.8 L70.2 166.0 L60.2 156.1 L50.9 146.2 L42.3 136.3 L34.4 126.4 L27.3 116.7 L21.0 107.2 L15.5 97.8 L10.9 88.6 L7.3 79.8 L4.6 71.3 L2.8 63.2 L2.0 55.5 L2.2 48.3 L3.3 41.5 L5.4 35.4 L8.5 29.8 L12.5 24.9 L17.5 20.7 L23.3 17.1 L29.9 14.3 L37.4 12.2 L45.7 10.9 L54.7 10.3 L64.3 10.5 L74.6 11.5 L85.5 13.3 L96.8 15.8 L108.6 19.1 L120.8 23.1 L133.3 27.9 L146.0 33.2 L159.0 39.3 L172.1 45.9 L185.2 53.1 L198.4 60.8 L211.6 69.0 L224.7 77.6 L237.6 86.6 L250.4 95.9 L263.0 105.5 L275.3 115.3 L287.3 125.3 L298.9 135.4 L310.2 145.5 L321.1 155.7 L331.6 165.9 L341.6 176.0 L351.1 186.0 L360.2 195.9 L368.7 205.7 L376.7 215.2 L384.1 224.5 L391.0 233.6 L397.2 242.3 L402.8 250.8 L407.8 259.0 L412.1 266.9 L415.8 274.3 L418.7 281.5 L413.8 280.5 L410.8 273.7 L407.0 266.5 L402.3 259.0 L397.0 251.2 L390.8 243.1 L384.0 234.9 L376.4 226.5 L368.3 217.9 L359.4 209.3 L350.1 200.7 L340.2 192.1 L329.8 183.5 L319.1 175.0 L307.9 166.7 L296.5 158.5 L284.8 150.5 L273.0 142.7 L261.0 135.1 L248.9 127.8 L236.9 120.8 L224.9 114.1 L212.9 107.7 L201.2 101.7 L189.6 96.0 L178.3 90.6 L167.3 85.6 L156.6 80.9 L146.3 76.7 L136.4 72.8 L127.0 69.3 L118.0 66.2 L109.5 63.5 L101.5 61.2 L94.1 59.3 L87.2 57.8 L80.8 56.7 L75.1 56.1 L69.9 55.9 L65.3 56.1 L61.4 56.7 L58.0 57.8 L55.3 59.4 L53.2 61.4 L51.7 63.9 L50.8 66.8 L50.5 70.2 L50.9 74.0 L51.9 78.3 L53.6 83.1 L55.8 88.3 L58.7 93.9 L62.2 99.9 L66.2 106.4 L70.9 113.2 L76.2 120.4 L82.1 127.9 L88.5 135.8 L95.5 143.9 L103.0 152.3 L111.0 160.8 L119.6 169.6 L128.6 178.5 L138.0 187.4 L147.9 196.5 L158.1 205.5 L168.7 214.5 L179.6 223.4 L190.7 232.2 L202.1 240.8 L213.6 249.2 L225.3 257.3 L237.0 265.1 L248.8 272.6 L260.6 279.7 L272.2 286.4 L283.8 292.7 L295.2 298.4 L306.3 303.7 L317.2 308.4 L327.7 312.6 L337.8 316.3 L347.5 319.3 L356.8 321.8 L365.5 323.6 L373.6 324.9 L381.2 325.5 L388.1 325.6 L394.4 325.0 L399.9 323.9 L404.8 322.2Z","grey":"M37.7 325.7 L42.8 327.7 L48.6 329.0 L55.0 329.8 L62.2 330.1 L69.9 329.7 L78.3 328.8 L87.2 327.4 L96.7 325.4 L106.7 322.9 L117.2 319.9 L128.1 316.4 L139.4 312.4 L151.2 308.0 L163.2 303.0 L175.6 297.7 L188.2 291.9 L201.1 285.6 L214.1 279.0 L227.2 272.0 L240.4 264.7 L253.7 257.0 L266.9 249.0 L280.1 240.6 L293.1 232.0 L305.9 223.2 L318.5 214.0 L330.8 204.7 L342.7 195.2 L354.2 185.6 L365.3 175.8 L375.8 166.0 L385.8 156.1 L395.1 146.2 L403.7 136.3 L411.6 126.4 L418.7 116.7 L425.0 107.2 L430.5 97.8 L435.1 88.6 L438.7 79.8 L441.4 71.3 L443.2 63.2 L444.0 55.5 L443.8 48.3 L442.7 41.5 L440.6 35.4 L437.5 29.8 L433.5 24.9 L428.5 20.7 L422.7 17.1 L416.1 14.3 L408.6 12.2 L400.3 10.9 L391.3 10.3 L381.7 10.5 L371.4 11.5 L360.5 13.3 L349.2 15.8 L337.4 19.1 L325.2 23.1 L312.7 27.9 L300.0 33.2 L287.0 39.3 L273.9 45.9 L260.8 53.1 L247.6 60.8 L234.4 69.0 L221.3 77.6 L208.4 86.6 L195.6 95.9 L183.0 105.5 L170.7 115.3 L158.7 125.3 L147.1 135.4 L135.8 145.5 L124.9 155.7 L114.4 165.9 L104.4 176.0 L94.9 186.0 L85.8 195.9 L77.3 205.7 L69.3 215.2 L61.9 224.5 L55.0 233.6 L48.8 242.3 L43.2 250.8 L38.2 259.0 L33.9 266.9 L30.2 274.3 L27.3 281.5 L32.2 280.5 L35.2 273.7 L39.0 266.5 L43.7 259.0 L49.0 251.2 L55.2 243.1 L62.0 234.9 L69.6 226.5 L77.7 217.9 L86.6 209.3 L95.9 200.7 L105.8 192.1 L116.2 183.5 L126.9 175.0 L138.1 166.7 L149.5 158.5 L161.2 150.5 L173.0 142.7 L185.0 135.1 L197.1 127.8 L209.1 120.8 L221.1 114.1 L233.1 107.7 L244.8 101.7 L256.4 96.0 L267.7 90.6 L278.7 85.6 L289.4 80.9 L299.7 76.7 L309.6 72.8 L319.0 69.3 L328.0 66.2 L336.5 63.5 L344.5 61.2 L351.9 59.3 L358.8 57.8 L365.2 56.7 L370.9 56.1 L376.1 55.9 L380.7 56.1 L384.6 56.7 L388.0 57.8 L390.7 59.4 L392.8 61.4 L394.3 63.9 L395.2 66.8 L395.5 70.2 L395.1 74.0 L394.1 78.3 L392.4 83.1 L390.2 88.3 L387.3 93.9 L383.8 99.9 L379.8 106.4 L375.1 113.2 L369.8 120.4 L363.9 127.9 L357.5 135.8 L350.5 143.9 L343.0 152.3 L335.0 160.8 L326.4 169.6 L317.4 178.5 L308.0 187.4 L298.1 196.5 L287.9 205.5 L277.3 214.5 L266.4 223.4 L255.3 232.2 L243.9 240.8 L232.4 249.2 L220.7 257.3 L209.0 265.1 L197.2 272.6 L185.4 279.7 L173.8 286.4 L162.2 292.7 L150.8 298.4 L139.7 303.7 L128.8 308.4 L118.3 312.6 L108.2 316.3 L98.5 319.3 L89.2 321.8 L80.5 323.6 L72.4 324.9 L64.8 325.5 L57.9 325.6 L51.6 325.0 L46.1 323.9 L41.2 322.2 Z","greyTop":"M253.7 257.0 L266.9 249.0 L280.1 240.6 L293.1 232.0 L305.9 223.2 L318.5 214.0 L330.8 204.7 L342.7 195.2 L354.2 185.6 L365.3 175.8 L375.8 166.0 L385.8 156.1 L395.1 146.2 L403.7 136.3 L411.6 126.4 L416.3 120.0 L370.1 120.0 L369.8 120.4 L363.9 127.9 L357.5 135.8 L350.5 143.9 L343.0 152.3 L335.0 160.8 L326.4 169.6 L317.4 178.5 L308.0 187.4 L298.1 196.5 L287.9 205.5 L277.3 214.5 L266.4 223.4 L255.3 232.2 L250.0 236.2 L250.0 259.1 Z"};
const markSvg = (cls) => '<svg class="' + cls + '" viewBox="0 0 ' + MARK.vb[0] + ' ' + MARK.vb[1] + '" aria-hidden="true"><path class="mg" d="' + MARK.grey + '"/><path class="mr" d="' + MARK.red + '"/><path class="mg mgt" d="' + MARK.greyTop + '"/></svg>';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
let pending = null, shared = false, vignette = null, parClic = false; // vignette : [lien de l'annonce, image de fond de la carte]

// ---------- intro : à chaque ouverture de l'appli (logo puis « CLUB ») ----------
let seen = false; try { seen = sessionStorage.getItem('acl-intro') === 'off'; } catch (_) {}
let intro = null; const t0 = Date.now();
if (!reduce && !seen) {
  intro = document.createElement('div'); intro.className = 'intro intro2';
  intro.innerHTML = '<div class="intro-stage"><img class="nl" src="logo-adress.png" alt="ADRESS IMMOBILIER"><div class="intro-in"><i></i><span>CLUB</span></div></div>';
  document.body.appendChild(intro);
  // impact ressenti : légère vibration quand les deux traits se croisent
  setTimeout(() => { try { if (matchMedia('(pointer: coarse)').matches && navigator.vibrate) navigator.vibrate([14, 60, 22]); } catch (_) {} }, 600);
}
const closeIntro = () => {
  if (!intro) return; const el = intro; intro = null;
  // l'intro s'efface dès que le premier écran est prêt (au plus tôt 1,3 s, le temps que le logo se dessine)
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 600); }, Math.max(0, 1300 - (Date.now() - t0)));
};
setTimeout(closeIntro, 3000);

// ---------- transitions entre écrans (View Transitions API) ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const href = a.getAttribute('href'); if (href === location.hash) return;
  // sens du mouvement : onglets et filtres = sur place, lien « retour » = vers la gauche, le reste = on avance
  root.dataset.dir = a.closest('.tabbar, .top, .chips, .cat-bar, .tabs, .adm-g, .adm-s') ? 'tab' : a.classList.contains('back') || href === '#/' ? 'back' : 'fwd'; parClic = true;
  const ph = a.querySelector('.ph');
  shared = !!(ph && /^#\/annonce\//.test(href));
  if (shared) vignette = [href, ph.style.backgroundImage];
  if (reduce || !document.startViewTransition) { shared = false; return; }
  e.preventDefault();
  if (shared) ph.style.viewTransitionName = 'photo';
  root.classList.add('vt');
  const t = document.startViewTransition(() => new Promise((res) => {
    pending = res; setTimeout(() => { if (pending === res) { pending = null; res(); } }, 600);
    location.hash = href;
  }));
  t.finished.finally(() => { root.classList.remove('vt'); shared = false; document.querySelectorAll('[style*="view-transition-name"]').forEach(el => el.style.viewTransitionName = ''); });
}, true);
// retour (bouton du téléphone, geste) ou navigation lancée par l'appli elle-même : le sens se déduit du chemin parcouru
const pile = [location.hash];
window.addEventListener('hashchange', () => {
  const h = location.hash, retour = pile.length > 1 && pile[pile.length - 2] === h;
  if (retour) pile.pop(); else if (pile[pile.length - 1] !== h) pile.push(h);
  if (!parClic) root.dataset.dir = retour ? 'back' : 'tab';
  parClic = false; if (vignette && h !== vignette[0]) vignette = null;
});
// La transition part dès que le squelette de l'écran suivant est affiché : l'écran ne reste jamais figé pendant le chargement
addEventListener('acl-squelette', () => {
  // l'attente se voit : la vignette touchée s'agrandit quand même jusqu'à la place de la grande photo
  const sp = shared && vignette && app.querySelector('.sk-photo'); if (sp) { sp.style.backgroundImage = vignette[1]; sp.classList.add('has-ph'); sp.style.viewTransitionName = 'photo'; }
  if (pending) { const r = pending; pending = null; r(); } });

// ---------- après chaque rendu d'écran ----------
new MutationObserver(() => {
  if (!app.classList.contains('page-in')) return;
  decorate();
  closeIntro();
  if (pending) { const r = pending; pending = null; r(); }
}).observe(app, { attributes: true, attributeFilter: ['class'] });

// éléments qui apparaissent ensemble au défilement : l'un après l'autre (80 ms d'écart)
const io = 'IntersectionObserver' in window ? new IntersectionObserver((list) => { let k = 0; list.forEach(x => { if (x.isIntersecting) { x.target.style.transitionDelay = (k++ * 60) + 'ms'; x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' }) : null;

const vus = new Set();
function photos() {
  app.querySelectorAll('.ph:not(.ld)').forEach(el => {
    const m = /url\(["']?(.*?)["']?\)/.exec(el.style.backgroundImage || ''); if (!m || !m[1] || vus.has(m[1])) { el.classList.add('ld'); return; }
    const im = new Image(); im.onload = () => { vus.add(m[1]); el.classList.add('ld'); }; im.onerror = () => { el.classList.add('ld', 'ko'); window.dispatchEvent(new CustomEvent('acl-photo-ko', { detail: m[1] })); }; im.src = m[1];
  });
  app.querySelectorAll('.gal img:not(.ld)').forEach(im => { if (im.complete) im.classList.add('ld'); else im.addEventListener('load', () => im.classList.add('ld'), { once: true }); });
}
new MutationObserver(photos).observe(app, { childList: true, subtree: true });
// page de connexion : emblème animé en fond
const loginFx = () => { const l = app.querySelector('.login'); if (l && !l.querySelector('.login-mark')) l.insertAdjacentHTML('afterbegin', markSvg('login-mark') + markSvg('login-mark lm2')); };
loginFx(); new MutationObserver(loginFx).observe(app, { childList: true, subtree: true });

function decorate() {
  const g = app.querySelector('.gal img');
  if (g && shared) g.style.viewTransitionName = 'photo';
  // la vignette reste affichée sous la grande photo le temps qu'elle charge : pas de flou, pas de trou
  if (g && vignette && location.hash === vignette[0]) { g.style.backgroundImage = vignette[1]; g.classList.add('de-vignette', 'ld'); g.closest('.detail')?.classList.add('depuis-vignette'); }
  const hero = app.querySelector('.hero');
  if (hero && !hero.querySelector('.mark-anim')) hero.insertAdjacentHTML('beforeend', markSvg('mark-anim'));
  app.querySelectorAll('.fc-cover').forEach(c => { if (!c.querySelector('.mark-anim')) c.insertAdjacentHTML('beforeend', markSvg('mark-anim sm')); });
  // chargement progressif des photos (flou → net)
  photos();
  if (reduce) return;
  // révélation au défilement pour ce qui est sous la ligne de flottaison
  if (io) app.querySelectorAll('.grid2 > .item, .rayon, .mini, .menu a, .list > .card, .stat, .feature, section:not(.rayon) > h2').forEach(el => {
    if (el.getBoundingClientRect().top > innerHeight * .92) { el.classList.add('rv'); io.observe(el); }
  });
  // compteurs animés (indicateurs)
  app.querySelectorAll('.stat .v').forEach(el => {
    // Compte jusqu'à la valeur en gardant l'unité (« 93 % », « 4 j », « 1,5 mois »)
    const txt = String(el.textContent), m = /^(\d+(?:[.,]\d+)?)(.*)$/.exec(txt.trim()); if (!m) return;
    const n = parseFloat(m[1].replace(',', '.')), suf = m[2], virg = m[1].includes(','); if (!isFinite(n) || n === 0) return;
    const dec = /[.,]/.test(m[1]) ? 1 : 0, t0 = performance.now(), d = 1100;
    const step = (t) => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); const v = (n * e).toFixed(dec); el.textContent = (virg ? v.replace('.', ',') : v) + suf; if (p < 1) requestAnimationFrame(step); else el.textContent = txt; };
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
  // flèches précédent / suivant + points cliquables
  const n = gal.children.length, w = document.createElement('div'); w.className = 'gal-w';
  gal.before(w); w.appendChild(gal);
  w.insertAdjacentHTML('beforeend', '<button type="button" class="gal-nav prev" aria-label="Photo précédente">‹</button><button type="button" class="gal-nav next" aria-label="Photo suivante">›</button><span class="gal-n">1 / ' + n + '</span>');
  const aller = (i) => gal.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * gal.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  w.querySelector('.prev').onclick = () => aller(last - 1);
  w.querySelector('.next').onclick = () => aller(last + 1);
  d.querySelectorAll('i').forEach((x, k) => x.onclick = () => aller(k));
  const maj = () => { w.querySelector('.prev').disabled = last === 0; w.querySelector('.next').disabled = last === n - 1; w.querySelector('.gal-n').textContent = (last + 1) + ' / ' + n; };
  let last = 0; maj();
  gal.addEventListener('scroll', () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); if (i !== last) { last = i; buzz(5); d.querySelectorAll('i').forEach((x, k) => x.classList.toggle('on', k === i)); maj(); } }, { passive: true });
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
          const v = document.startViewTransition(() => new Promise((res) => { pending = res; setTimeout(() => { if (pending === res) { pending = null; res(); } }, 600); history.back(); }));
          v.finished.finally(() => root.classList.remove('vt'));
        } else history.back();
      }
      sx = null;
    }
  }, { passive: true });
}

// ================= v45 : finitions premium =================
const fin = matchMedia('(pointer: fine)').matches;
const CONF = ['#D4101D', '#E8323E', '#9A9CA3', '#C9CBD0', '#111214'];
// Fête aux couleurs ADRESS : petits arcs du logo qui jaillissent (annonce publiée, demande envoyée, appli installée…)
function feteAdress(x = innerWidth / 2, y = innerHeight * .42) {
  if (reduce) return;
  const box = document.createElement('div'); box.className = 'confetti'; document.body.appendChild(box);
  for (let i = 0; i < 34; i++) {
    const s = document.createElement('i'), c = CONF[i % CONF.length], arc = i % 3 !== 2;
    s.innerHTML = arc ? `<svg viewBox="0 0 24 14"><path d="M2 12 Q12 -4 22 12" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/></svg>` : '';
    if (!arc) s.style.background = c;
    s.style.left = x + 'px'; s.style.top = y + 'px'; box.appendChild(s);
    const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 220, dx = Math.cos(a) * v, dy = Math.sin(a) * v - 160, r = (Math.random() - .5) * 720;
    s.animate([{ transform: 'translate(-50%,-50%) scale(.4) rotate(0)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * .8}px), calc(-50% + ${dy * .8}px)) scale(1) rotate(${r * .6}deg)`, opacity: 1, offset: .45 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 260}px)) scale(.9) rotate(${r}deg)`, opacity: 0 }],
      { duration: 1300 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
  }
  setTimeout(() => box.remove(), 2300);
}
addEventListener('acl-fete', () => { const b = document.querySelector('#int, .zoo, .toast:not([hidden])'); const r = b && b.getBoundingClientRect(); feteAdress(r ? r.left + r.width / 2 : undefined, r ? r.top + r.height / 2 : undefined); });

// Cœur des favoris : petite gerbe de particules
document.addEventListener('animationstart', (e) => {
  if (reduce || e.animationName !== 'heart' || !e.target.classList.contains('on')) return;
  const b = e.target, r = b.getBoundingClientRect();
  for (let i = 0; i < 9; i++) {
    const p = document.createElement('i'); p.className = 'spark'; p.style.left = r.left + r.width / 2 + 'px'; p.style.top = r.top + r.height / 2 + 'px';
    document.body.appendChild(p); const a = (i / 9) * Math.PI * 2, d = 22 + Math.random() * 10;
    p.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0)`, opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
  }
});

// Titres : les mots apparaissent un à un
function titres() {
  if (reduce) return;
  app.querySelectorAll('h1:not(.wd)').forEach(h => {
    h.classList.add('wd'); if (h.children.length || !h.textContent.trim()) return;
    h.innerHTML = h.textContent.trim().split(/\s+/).map((w, i) => `<span class="w" style="--i:${i}"><span>${w.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</span></span>`).join(' ');
  });
}

// Ordinateur : cartes en relief qui suivent la souris, avec reflet ; boutons « aimantés »
if (fin && !reduce) {
  let cur = null, raf = 0, ev = null;
  const SEL = '.item, .fc, .mini, .rs-card';
  document.addEventListener('pointermove', (e) => {
    ev = e; if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0; const t = ev.target.closest && ev.target.closest(SEL);
      if (cur && cur !== t) { cur.style.transform = ''; cur.classList.remove('tilt'); cur = null; }
      if (t) {
        const r = t.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
        if (!t.querySelector(':scope > .glare')) t.insertAdjacentHTML('beforeend', '<i class="glare"></i>');
        t.classList.add('tilt'); cur = t;
        t.style.transform = `perspective(1000px) rotateX(${(.5 - py) * 4}deg) rotateY(${(px - .5) * 5}deg) translateY(-3px)`;
        t.style.setProperty('--gx', px * 100 + '%'); t.style.setProperty('--gy', py * 100 + '%');
      }
      const h = ev.target.closest && ev.target.closest('.hero');
      if (h) { if (!h.querySelector(':scope > .spot')) h.insertAdjacentHTML('beforeend', '<i class="spot"></i>'); const r = h.getBoundingClientRect(); h.style.setProperty('--mx', ev.clientX - r.left + 'px'); h.style.setProperty('--my', ev.clientY - r.top + 'px'); }
    });
  }, { passive: true });
}

// Fine barre de progression de lecture sous l'en-tête
const prog = document.createElement('i'); prog.className = 'read-prog'; document.body.appendChild(prog);
let tk2 = false;
addEventListener('scroll', () => {
  if (tk2) return; tk2 = true;
  requestAnimationFrame(() => { const m = document.documentElement.scrollHeight - innerHeight; prog.style.transform = `scaleX(${m > 200 ? Math.min(1, scrollY / m) : 0})`; tk2 = false; });
}, { passive: true });

// Boutons principaux : reflet qui passe de temps en temps
function reflets() { app.querySelectorAll('#int:not([disabled]), .inst1').forEach(b => b.classList.add('shine')); }

new MutationObserver(() => { if (app.classList.contains('page-in')) { titres(); reflets(); } }).observe(app, { attributes: true, attributeFilter: ['class'] });
titres(); reflets();

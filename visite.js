// ADRESS CLUB — visite guidée (4 étapes, lancée par le résident, passable à tout moment).
// Un projecteur glisse d'un élément réel de l'écran à l'autre ; une bulle explique en une phrase.
const ETAPES = [
  { sel: '[data-nav="market"]', titre: 'Le Market', texte: 'Achetez, vendez ou donnez des objets entre résidents ADRESS. Tout reste entre voisins.' },
  { sel: '[data-nav="publier"]', titre: 'Publier en 1 minute', texte: 'Une photo, un titre, un prix ou « à donner ». Votre annonce reste en ligne 60 jours.' },
  { sel: '[data-nav="mes-annonces"]', titre: 'Vos annonces et demandes', texte: 'Les résidents intéressés arrivent ici, dans l’ordre. C’est vous qui choisissez qui contacter.' },
  { sel: '.home .menu a[href="#/residences"], [data-nav="profil"]', titre: 'ADRESS IMMOBILIER', texte: 'Nos résidences, le magazine Flip Immo, les nouveautés et les bons plans. Activez les alertes dans Compte.' }
];
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
const cible = (sel) => { for (const s of sel.split(',')) { const el = [...document.querySelectorAll(s.trim())].find(visible); if (el) return el; } return null; };
const vibre = (ms) => { try { if (matchMedia('(pointer: coarse)').matches && navigator.vibrate) navigator.vibrate(ms); } catch (_) {} };

export function lancerVisite({ fin } = {}) {
  if (document.querySelector('.vg')) return;
  const etapes = ETAPES.filter(e => cible(e.sel));
  if (!etapes.length) return;
  const vg = document.createElement('div'); vg.className = 'vg'; vg.setAttribute('role', 'dialog'); vg.setAttribute('aria-modal', 'true'); vg.setAttribute('aria-labelledby', 'vgT');
  vg.innerHTML = `<div class="vg-trou"></div><div class="vg-bulle" aria-live="polite">
    <div class="vg-prog">${etapes.map(() => '<i></i>').join('')}</div>
    <div class="vg-txt"><h3 id="vgT"></h3><p></p></div>
    <div class="vg-b"><button type="button" class="vg-passer">Passer</button><span class="vg-n"></span><button type="button" class="btn sm vg-suiv">Suivant</button></div></div>`;
  document.body.appendChild(vg); document.body.classList.add('vg-on');
  const trou = vg.querySelector('.vg-trou'), bulle = vg.querySelector('.vg-bulle'), txt = vg.querySelector('.vg-txt');
  const prev = document.activeElement; let k = -1;
  const placer = () => {
    const el = cible(etapes[k].sel); if (!el) return;
    const r = el.getBoundingClientRect(), m = 8, W = innerWidth, H = innerHeight;
    Object.assign(trou.style, { left: r.left - m + 'px', top: r.top - m + 'px', width: r.width + 2 * m + 'px', height: r.height + 2 * m + 'px' });
    const bw = Math.min(340, W - 32); bulle.style.width = bw + 'px';
    const bh = bulle.offsetHeight, dessous = r.bottom + m + 14 + bh < H - 12;
    bulle.style.left = Math.max(16, Math.min(W - bw - 16, r.left + r.width / 2 - bw / 2)) + 'px';
    bulle.style.top = (dessous ? r.bottom + m + 14 : Math.max(12, r.top - m - 14 - bh)) + 'px';
    bulle.dataset.cote = dessous ? 'bas' : 'haut';
  };
  const aller = (i) => {
    if (i >= etapes.length) return fermer(true);
    k = i; const e = etapes[k], el = cible(e.sel);
    if (el && (el.getBoundingClientRect().top < 0 || el.getBoundingClientRect().bottom > innerHeight)) el.scrollIntoView({ block: 'center', behavior: reduit ? 'auto' : 'smooth' });
    txt.classList.remove('in'); void txt.offsetWidth;
    vg.querySelector('#vgT').textContent = e.titre; vg.querySelector('.vg-txt p').textContent = e.texte;
    vg.querySelector('.vg-n').textContent = `${k + 1} / ${etapes.length}`;
    vg.querySelectorAll('.vg-prog i').forEach((x, j) => x.className = j < k ? 'ok' : j === k ? 'on' : '');
    vg.querySelector('.vg-suiv').textContent = k === etapes.length - 1 ? 'C’est parti' : 'Suivant';
    txt.classList.add('in'); vibre(8);
    setTimeout(placer, reduit ? 0 : 260); placer();
    vg.querySelector('.vg-suiv').focus({ preventScroll: true });
  };
  const fermer = (complet) => {
    removeEventListener('resize', placer); removeEventListener('scroll', placer, true); removeEventListener('keydown', clav, true);
    try { localStorage.setItem('acl-visite', complet ? 'faite' : 'passee'); } catch (_) {}
    vg.classList.add('out'); document.body.classList.remove('vg-on');
    setTimeout(() => vg.remove(), reduit ? 0 : 320); prev?.focus?.({ preventScroll: true });
    if (complet) { vibre([10, 40, 14]); window.dispatchEvent(new Event('acl-fete')); }
    fin?.(complet);
  };
  const clav = (e) => { if (e.key === 'Escape') { e.preventDefault(); fermer(false); } else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); aller(k + 1); } else if (e.key === 'ArrowLeft' && k > 0) { e.preventDefault(); aller(k - 1); } };
  vg.querySelector('.vg-suiv').onclick = () => aller(k + 1);
  vg.querySelector('.vg-passer').onclick = () => fermer(false);
  addEventListener('resize', placer); addEventListener('scroll', placer, true); addEventListener('keydown', clav, true);
  requestAnimationFrame(() => { vg.classList.add('in'); aller(0); });
}

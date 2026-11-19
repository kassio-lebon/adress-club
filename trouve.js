// ADRESS CLUB — Espace ADRESS : « Trouver un locataire »
// On tape un nom (ou un e-mail, un logement) et on voit tout de suite son e-mail et où il est logé,
// toutes résidences et villas confondues. Présent en haut de chaque écran de l'Espace ADRESS.
import { sb, state, esc, toast, errMsg } from './app.js';

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const COLL = new Intl.Collator('fr', { sensitivity: 'base' });
const estVilla = (x) => /^villa/i.test(x?.type_logement || '');
let CACHE = null; // données gardées une minute

async function donnees() {
  if (CACHE && Date.now() - CACHE.t < 60000) return CACHE.L;
  const [lg, pf] = await Promise.all([
    sb.from('logements').select('id,code,residence_id,bloc,etage,appartement,locataire,email,type_logement,residences(nom)').eq('actif', true),
    sb.from('profiles').select('logement_id,nom_affichage,statut').not('logement_id', 'is', null)]);
  if (lg.error) throw lg.error;
  const P = new Map(); (pf.data || []).forEach(p => { if (p.statut === 'actif' || !P.has(p.logement_id)) P.set(p.logement_id, p); });
  const L = (lg.data || []).map(x => { const p = P.get(x.id), compte = p?.statut === 'actif' ? (p.nom_affichage || 'Compte actif') : '';
    return { ...x, compte, cle: norm([x.locataire, compte, x.email, x.code, x.appartement, x.residences?.nom].join(' ')) }; })
    .filter(x => x.locataire || x.email || x.compte);
  CACHE = { t: Date.now(), L }; return L;
}

const lieu = (x) => { const r = x.residences?.nom || '', a = x.appartement || x.code;
  if (estVilla(x)) return [r, a && 'Villa ' + a].filter(Boolean).join(' · ');
  return [r, x.bloc && 'Bloc ' + x.bloc, x.etage && 'Étage ' + x.etage, a && 'App. ' + a].filter(Boolean).join(' · '); };

const attendre = (sel, ms = 6000) => new Promise(ok => { const t0 = Date.now(); const f = () => { const e = document.querySelector(sel); if (e) return ok(e); if (Date.now() - t0 > ms) return ok(null); setTimeout(f, 80); }; f(); });

// Ouvre « Nos locataires » sur la bonne résidence, la recherche déjà remplie avec le logement
async function ouvrirFiche(x) {
  if (location.hash !== '#/admin/annuaire') location.hash = '#/admin/annuaire';
  const ar = await attendre('#adm #ar'); if (!ar) return;
  if (ar.value !== x.residence_id && [...ar.options].some(o => o.value === x.residence_id)) { ar.value = x.residence_id; ar.dispatchEvent(new Event('change')); }
  else if (ar.value !== x.residence_id) { const b = document.querySelector(`#adm .tsw [data-t="${estVilla(x) ? 'vil' : 'res'}"]`); if (b) { b.click(); const a2 = await attendre('#adm #ar'); if (a2 && [...a2.options].some(o => o.value === x.residence_id)) { a2.value = x.residence_id; a2.dispatchEvent(new Event('change')); } } }
  await new Promise(r => setTimeout(r, 60));
  const tous = document.querySelector('#adm [data-f="tous"]'); if (tous && !tous.classList.contains('on')) tous.click();
  const aq = await attendre('#adm #aq'); if (!aq) return;
  aq.value = x.code || x.locataire || ''; aq.dispatchEvent(new Event('input'));
  aq.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function monter() {
  const h = document.querySelector('.adm-h');
  if (!h || !state.profil?.is_admin || h.nextElementSibling?.classList.contains('tq')) return;
  h.insertAdjacentHTML('afterend', `<div class="tq combo" role="search"><label for="tqi" class="sr">Trouver un locataire</label><input id="tqi" type="text" placeholder="Trouver un locataire : nom, e-mail ou logement…" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="tql"><div class="combo-list tq-list" id="tql" role="listbox" hidden></div></div>`);
  const inp = document.getElementById('tqi'), list = document.getElementById('tql');
  let res = [];
  const fermer = () => { list.hidden = true; inp.setAttribute('aria-expanded', 'false'); };
  const afficher = async () => {
    const q = norm(inp.value), t = q.split(/\s+/).filter(Boolean); if (!t.length) return fermer();
    let L; if (!CACHE) { list.hidden = false; list.innerHTML = '<div class="tq-vide">Recherche…</div>'; }
    try { L = await donnees(); } catch (e) { list.hidden = false; list.innerHTML = `<div class="tq-vide">${esc(errMsg(e))}</div>`; return; }
    if (norm(inp.value) !== q) return; // la saisie a changé entre-temps
    const nom = (x) => x.locataire || x.compte || '';
    res = L.filter(x => t.every(w => x.cle.includes(w)))
      .sort((a, b) => (norm(nom(b)).startsWith(q) - norm(nom(a)).startsWith(q)) || COLL.compare(nom(a), nom(b)))
      .slice(0, 8);
    list.innerHTML = res.length ? res.map((x, i) => `<div class="tq-it" role="option" data-i="${i}">
        <div class="tq-l"><b>${esc(nom(x) || 'Nom manquant')}</b>${x.compte ? '<span class="tq-st">Compte actif</span>' : ''}</div>
        <div class="tq-lieu">${esc(lieu(x))}</div>
        <div class="tq-m">${x.email ? `<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>` : '<span class="a-bad">E-mail manquant</span>'}</div>
        <div class="tq-a">${x.email ? '<button type="button" class="btn sm soft" data-cp>Copier l’e-mail</button>' : ''}<button type="button" class="btn sm ghost" data-go>Voir dans Nos locataires</button></div></div>`).join('')
      : '<div class="tq-vide">Aucun locataire ne correspond.</div>';
    list.hidden = false; inp.setAttribute('aria-expanded', 'true');
  };
  inp.addEventListener('input', afficher);
  inp.addEventListener('focus', () => { if (inp.value.trim()) afficher(); });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Escape') { inp.value = ''; fermer(); } });
  list.addEventListener('click', async (e) => { const it = e.target.closest('.tq-it'), x = it && res[+it.dataset.i]; if (!x) return;
    if (e.target.closest('[data-cp]')) { try { await navigator.clipboard.writeText(x.email); toast('E-mail copié : ' + x.email); } catch (_) { toast(x.email); } return; }
    if (e.target.closest('[data-go]')) { fermer(); ouvrirFiche(x); } });
}

document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.tq')) { const l = document.getElementById('tql'); if (l && !l.hidden) { l.hidden = true; document.getElementById('tqi')?.setAttribute('aria-expanded', 'false'); } } });
// L'Espace ADRESS est redessiné à chaque changement d'écran : la barre est remise en place à chaque fois
new MutationObserver(() => { if (location.hash.startsWith('#/admin')) monter(); }).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });

document.head.insertAdjacentHTML('beforeend', `<style>
.tq{position:relative;z-index:60;margin:0 0 12px}
.tq .tq-list{z-index:60}
.tq input[type=text]{height:46px;font-size:15px}
.tq-list{max-height:min(70vh,520px)}
.tq-it{padding:12px 10px;display:grid;gap:3px}
.tq-it+.tq-it{border-top:1px solid var(--line)}
.tq-l{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tq-l b{font-size:15px}
.tq-st{font-size:11.5px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--ok-tint);color:var(--ok)}
.tq-lieu{font-size:13.5px}
.tq-m{font-size:13.5px;word-break:break-all}
.tq-m a{color:inherit}
.tq-a{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
.tq-vide{padding:12px;color:var(--muted);font-size:14px}
</style>`);

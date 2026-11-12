// ADRESS CLUB — application des résidents (PWA)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { renderAdmin } from './admin.js';

export const SUPABASE_URL = 'https://xvevjlovjpeqfpzfihrj.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_oPj4LrfV0uvN95MmpTPl8A_x5XLxVcj';
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

export const CATEGORIES = ['Meubles','Électroménager','Décoration','Enfants et bébé','Vêtements et accessoires','Électronique','Sport et loisirs','Maison et jardin','Autre'];
export const ETATS = ['Neuf','Très bon état','Bon état','Usagé','À réparer'];
export const FILTRES_BP = ['Rideaux et décoration','Aménagement et revêtements'];
export const CAT_PARTENAIRES = ['Rideaux et décoration','Aménagement et revêtements','Électroménager','Boutiques et inspirations'];
const STATUTS = { disponible:'Disponible', reserve:'Réservé', vendu:'Vendu', don_effectue:'Don effectué', retire:'Retiré', expire:'Expiré' };

export const state = { session: null, profil: null, params: {}, compteurs: { demandes_non_lues: 0, notifications_non_lues: 0 } };
const app = document.getElementById('app');

// ---------- utilitaires ----------
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
export const fcfa = (n) => Number(n).toLocaleString('fr-FR') + ' FCFA';
export const dateFr = (d, h) => d ? new Date(d).toLocaleDateString('fr-FR', h ? { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' } : { day:'2-digit', month:'2-digit', year:'numeric' }) : '';
export function toast(msg, ms = 3500) { const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, ms); }
export const errMsg = (e) => (e && (e.message || e.error_description)) ? String(e.message || e.error_description).replace(/^.*?ERROR:\s*/,'') : 'Une erreur est survenue, réessayez.';
export const publicUrl = (path) => path ? sb.storage.from('contenus').getPublicUrl(path).data.publicUrl : '';
function prix(a) { return a.type === 'don' ? 'GRATUIT' : fcfa(a.prix_fcfa); }
const qs = () => new URLSearchParams((location.hash.split('?')[1]) || '');
const estFlip = (u) => /^https:\/\/([a-z0-9-]+\.)?heyzine\.com\//i.test(u || '');
const lienFlip = (u, t) => estFlip(u) ? '#/lire?' + new URLSearchParams({ u, t: t || '' }).toString() : u;
const track = (type, ref_id) => sb.from('evenements').insert({ type, ref_id: ref_id || null }).then(() => {});

// recherche instantanée : filtre les éléments à chaque frappe (sans accents ni majuscules)
const norm = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function filtreLive(input, items, vide) {
  const run = () => {
    const mots = norm(input.value).split(/\s+/).filter(Boolean); let n = 0;
    items().forEach(el => { const ok = mots.every(m => norm(el.textContent).includes(m)); el.hidden = !ok; if (ok) n++; });
    if (vide) { vide.hidden = n > 0 || !mots.length; vide.textContent = 'Aucun résultat pour « ' + input.value.trim() + ' ».'; }
  };
  input.addEventListener('input', run); run(); return run;
}
export function barreRecherche(avant, items, placeholder) {
  if (!avant) return;
  const w = document.createElement('div'); w.className = 'live-search';
  w.innerHTML = '<label class="sr">Rechercher</label><input type="search" placeholder="' + esc(placeholder) + '" autocomplete="off">';
  const vide = document.createElement('p'); vide.className = 'muted center no-res'; vide.hidden = true;
  avant.before(w); avant.after(vide); filtreLive(w.querySelector('input'), items, vide);
}

const signedCache = new Map();
async function photosUrls(paths) {
  const need = paths.filter(p => p && !signedCache.has(p));
  if (need.length) {
    const { data } = await sb.storage.from('annonces').createSignedUrls(need, 3600);
    (data || []).forEach(x => { if (x.signedUrl) signedCache.set(x.path, x.signedUrl); });
  }
  return paths.map(p => signedCache.get(p) || '');
}

export function compress(file, max = 1280) {
  return new Promise((ok, ko) => {
    const img = new Image(); const u = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => { URL.revokeObjectURL(u); b ? ok(b) : ko(new Error('Image illisible')); }, 'image/jpeg', 0.82); };
    img.onerror = () => ko(new Error('Image illisible')); img.src = u;
  });
}

// ---------- session et profil ----------
async function chargerProfil() {
  const { data: { session } } = await sb.auth.getSession();
  state.session = session;
  if (!session) { state.profil = null; return; }
  const { data } = await sb.from('profiles').select('*, residence:residences(nom,photo_path)').eq('id', session.user.id).maybeSingle();
  state.profil = data;
  if (data?.statut === 'actif') {
    const { data: p } = await sb.from('parametres').select('cle,valeur');
    state.params = Object.fromEntries((p || []).map(x => [x.cle, Number(x.valeur)]));
  }
}
export async function majCompteurs() {
  if (state.profil?.statut !== 'actif') return;
  const { data } = await sb.rpc('compteurs');
  if (data) state.compteurs = data;
  const n = (state.compteurs.demandes_non_lues || 0) + (state.compteurs.notifications_non_lues || 0);
  document.getElementById('notifDot').hidden = !(state.compteurs.notifications_non_lues > 0);
  const nb = document.getElementById('navBadge'); nb.textContent = state.compteurs.demandes_non_lues || ''; nb.hidden = !(state.compteurs.demandes_non_lues > 0);
  try { if ('setAppBadge' in navigator) n > 0 ? navigator.setAppBadge(n) : navigator.clearAppBadge(); } catch (_) {}
}
const actif = () => state.profil?.statut === 'actif';

// ---------- routeur ----------
const routes = {
  '': accueil, 'market': market, 'annonce': annonce, 'publier': publier, 'modifier': modifier, 'mes-annonces': mesAnnonces,
  'residences': residences, 'nouveautes': nouveautes, 'flip-immo': flip, 'bonnes-adresses': bonnesAdresses,
  'notifications': notifications, 'profil': profil, 'avis': avis, 'lire': lire, 'admin': (p) => renderAdmin(app, p)
};
async function router() {
  const [path] = location.hash.replace(/^#\/?/, '').split('?');
  const [name, param] = path.split('/');
  document.getElementById('top').hidden = !actif();
  document.getElementById('nav').hidden = !actif();
  const sect = ({ '': 'accueil', annonce: 'market', modifier: 'mes-annonces' })[name] ?? name;
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === sect));
  window.scrollTo(0, 0);
  if (!state.session) return connexion();
  if (!actif()) return activation();
  const view = routes[name] || accueil;
  app.classList.remove('page-in');
  if (view.constructor.name === 'AsyncFunction') app.innerHTML = '<div class="skel"><i></i><i></i><i></i></div>';
  try { await view(param); } catch (e) { console.error(e); app.innerHTML = `<div class="card">${esc(errMsg(e))}</div>`; }
  void app.offsetWidth; app.classList.add('page-in');
  majCompteurs();
}

// ---------- connexion / activation (§2) ----------
function connexion() {
  app.innerHTML = `
  <div class="login"><div class="login-brand"><img class="login-logo" src="logo.png" alt="ADRESS IMMOBILIER"><h1>ADRESS <span>CLUB</span></h1><p>L'espace privé des résidents ADRESS IMMOBILIER</p></div>
  <div class="chips" role="tablist"><a class="chip on" data-m="login">Se connecter</a><a class="chip" data-m="signup">J'ai un code d'invitation</a></div>
  <form id="f" class="card" novalidate>
    <div id="sign" hidden>
      <label for="code">Code d'invitation</label><input id="code" type="text" autocomplete="off" placeholder="Remis par ADRESS IMMOBILIER" style="text-transform:uppercase">
      <label for="nom">Nom d'affichage (visible des autres résidents)</label><input id="nom" type="text" maxlength="40" placeholder="Awa K.">
    </div>
    <label for="email">E-mail</label><input id="email" type="email" autocomplete="email" required>
    <label for="mdp">Mot de passe</label><input id="mdp" type="password" autocomplete="current-password" minlength="8" required>
    <p class="hint" id="mdpHint" hidden>8 caractères minimum.</p>
    <p class="err" id="err" hidden></p>
    <button class="btn block" style="margin-top:16px" id="go">Se connecter</button>
  </form>
  <p class="muted center" style="margin-top:14px">Accès réservé aux résidents. Un compte par logement, activé par ADRESS IMMOBILIER.</p></div>`;
  let mode = 'login';
  app.querySelectorAll('[data-m]').forEach(c => c.onclick = () => {
    mode = c.dataset.m; app.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === c));
    app.querySelector('#sign').hidden = mode !== 'signup'; app.querySelector('#mdpHint').hidden = mode !== 'signup';
    app.querySelector('#go').textContent = mode === 'signup' ? 'Créer mon accès' : 'Se connecter';
    app.querySelector('#mdp').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  });
  app.querySelector('#f').onsubmit = async (ev) => {
    ev.preventDefault();
    const err = app.querySelector('#err'); err.hidden = true;
    const email = app.querySelector('#email').value.trim(), password = app.querySelector('#mdp').value;
    const show = (m) => { err.textContent = m; err.hidden = false; go.disabled = false; };
    const go = app.querySelector('#go'); go.disabled = true;
    if (!email || password.length < (mode === 'signup' ? 8 : 1)) return show(mode === 'signup' ? 'E-mail et mot de passe de 8 caractères minimum.' : 'Saisissez votre e-mail et votre mot de passe.');
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return show('E-mail ou mot de passe incorrect.');
    } else {
      const code = app.querySelector('#code').value.trim(), nom = app.querySelector('#nom').value.trim();
      if (!code || !nom) return show('Le code d\'invitation et le nom d\'affichage sont obligatoires.');
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) return show(error.message.includes('registered') ? 'Un compte existe déjà avec cet e-mail : connectez-vous.' : errMsg(error));
      if (!data.session) { try { localStorage.setItem('acl-inv', JSON.stringify({ code, nom })); } catch (_) {} return show('Dernière étape : ouvrez l’e-mail ADRESS CLUB reçu à ' + email + ' et touchez « Confirmer mon adresse ».'); }
      const r = await sb.rpc('utiliser_invitation', { p_code: code, p_nom_affichage: nom, p_telephone: null, p_consentement: false });
      if (r.error) { await chargerProfil(); return show(errMsg(r.error)); }
    }
    await chargerProfil(); track('connexion'); location.hash = '#/'; router();
  };
}

function activation() {
  const p = state.profil; let inv = {}; try { inv = JSON.parse(localStorage.getItem('acl-inv') || '{}'); } catch (_) {}
  app.innerHTML = `
  <div class="login"><div class="login-brand"><img class="login-logo" src="logo.png" alt="ADRESS IMMOBILIER"><h1>ADRESS <span>CLUB</span></h1><p>${p?.statut === 'desactive' ? 'Accès désactivé' : 'Activez votre accès'}</p></div>
  ${p?.statut === 'desactive' ? `<div class="card" style="margin-bottom:12px">Votre accès a été désactivé (fin d'occupation ou décision ADRESS). Si ADRESS IMMOBILIER vous a remis un nouveau code, saisissez-le ci-dessous.</div>` : ''}${`
  <form id="f" class="card">
    <p class="muted">Saisissez le code d'invitation remis par ADRESS IMMOBILIER pour votre logement.</p>
    <label for="code">Code d'invitation</label><input id="code" type="text" style="text-transform:uppercase" value="${esc(inv.code || '')}">
    <label for="nom">Nom d'affichage</label><input id="nom" type="text" maxlength="40" value="${esc(inv.nom || '')}">
    <p class="err" id="err" hidden></p>
    <button class="btn block" style="margin-top:16px">Activer mon accès</button>
  </form>`}
  <p class="center" style="margin-top:14px"><a href="#" id="out" class="muted">Se déconnecter</a></p></div>`;
  app.querySelector('#out').onclick = async (e) => { e.preventDefault(); await sb.auth.signOut(); await chargerProfil(); router(); };
  const f = app.querySelector('#f');
  if (f) f.onsubmit = async (ev) => {
    ev.preventDefault();
    const r = await sb.rpc('utiliser_invitation', { p_code: f.querySelector('#code').value, p_nom_affichage: f.querySelector('#nom').value, p_telephone: null, p_consentement: false });
    if (r.error) { const e = f.querySelector('#err'); e.textContent = errMsg(r.error); e.hidden = false; return; }
    try { localStorage.removeItem('acl-inv'); } catch (_) {}
    await chargerProfil(); location.hash = '#/'; router();
  };
}

// ---------- accueil (§1, §7 bis) ----------
const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const ICO = {
  market: svg('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0'),
  residences: svg('M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01'),
  flip: svg('M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z'),
  news: svg('M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5'),
  camera: svg('M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7'),
  chev: svg('m9 6 6 6-6 6'),
  arrow: svg('M5 12h14M13 6l6 6-6 6')
};
async function accueil() {
  await majCompteurs();
  const nl = state.compteurs.demandes_non_lues || 0;
  const { data: recents } = await sb.from('v_market').select('id,titre,type,prix_fcfa,photos,statut').order('date_publication', { ascending: false }).limit(8);
  const urls = await photosUrls((recents || []).map(a => a.photos[0]));
  const res = state.profil.residence || {}; let ph = res.photo_path;
  if (!ph) { const { data: r1 } = await sb.from('residences').select('photo_path').eq('visible', true).not('photo_path', 'is', null).order('ordre').limit(1); ph = r1 && r1[0] && r1[0].photo_path; }
  const lien = (h, ico, t, s) => '<a href="' + h + '">' + ico + '<span><b>' + t + '</b><small>' + s + '</small></span>' + ICO.chev + '</a>';
  app.innerHTML = '<div class="home">'
    + '<section class="hero' + (ph ? ' has-ph' : '') + '">' + (ph ? '<div class="bgz" style="background-image:url(\'' + esc(publicUrl(ph)) + '\')"></div>' : '')
    + '<p>' + esc(res.nom || 'ADRESS IMMOBILIER') + '</p><h1>Bonjour ' + esc(state.profil.nom_affichage || '') + '</h1></section>'
    + (nl ? '<a class="notice" href="#/mes-annonces"><b>' + nl + '</b>' + (nl > 1 ? 'nouvelles demandes' : 'nouvelle demande') + ' sur vos annonces</a>' : '')
    + '<section><div class="sec-h"><h2>Le Market</h2><a href="#/market">Tout voir</a></div>'
    + ((recents || []).length ? '<div class="strip">' + recents.map((a, i) => '<a class="mini" href="#/annonce/' + a.id + '"><div class="ph" style="background-image:url(\'' + esc(urls[i]) + '\')"></div><div class="t">' + esc(a.titre) + '</div><div class="p">' + prix(a) + '</div></a>').join('') + '</div>'
      : '<div class="card muted">Aucune annonce pour le moment. <a href="#/publier">Publier la première</a></div>')
    + '</section><section><h2>ADRESS IMMOBILIER</h2><nav class="menu">'
    + lien('#/residences', ICO.residences, 'Nos résidences', 'Photos et contact')
    + lien('#/flip-immo', ICO.flip, 'Le Flip Immo', 'Le magazine ADRESS')
    + lien('#/nouveautes', ICO.news, 'Les nouveautés', 'Programmes et actualités')
    + '</nav><a class="feature" href="#/bonnes-adresses"><span><b>Les bons plans</b><small>La sélection ADRESS pour vivre Abidjan</small></span>' + ICO.arrow + '</a>'
    + (state.profil.is_admin ? '<a class="btn ghost block" style="margin-top:12px" href="#/admin">Espace ADRESS · gestion</a>' : '')
    + '<p class="center small" style="margin-top:18px"><a class="muted" href="#/avis">Donner mon avis</a></p></section></div>';
}

// ---------- Le Market (§3, §4) ----------
async function market() {
  const p = qs(); const type = p.get('type') || ''; const q = (p.get('q') || '').trim(); const vue = p.get('vue') || '';
  let req = sb.from(vue === 'favoris' ? 'v_favoris' : 'v_market').select('*').order('date_publication', { ascending: false }).limit(80);
  if (type) req = req.eq('type', type);
  const [{ data, error }, fav] = await Promise.all([req, sb.from('favoris').select('annonce_id')]);
  if (error) throw error;
  const favs = new Set((fav.data || []).map(f => f.annonce_id));
  const urls = await photosUrls((data || []).map(a => a.photos[0]));
  const lien = (o) => '#/market?' + new URLSearchParams(Object.fromEntries(Object.entries({ type, q, vue, ...o }).filter(([, v]) => v))).toString();
  app.innerHTML = `
  <a class="back" href="#/">‹ Accueil</a><h1>Le Market</h1><p class="muted">Les objets à vendre ou à donner entre résidents</p>
  <form id="s" role="search" style="margin-top:10px"><label class="sr" for="q">Rechercher</label><input id="q" type="search" placeholder="Rechercher un objet…" value="${esc(q)}"></form>
  <div class="chips">
    <a class="chip ${!type && !vue ? 'on' : ''}" href="${lien({ type: '', vue: '' })}">Tout</a>
    <a class="chip ${type === 'vente' ? 'on' : ''}" href="${lien({ type: 'vente', vue: '' })}">À vendre</a>
    <a class="chip ${type === 'don' ? 'on' : ''}" href="${lien({ type: 'don', vue: '' })}">À donner</a>
    <a class="chip ${vue === 'favoris' ? 'on' : ''}" href="${lien({ vue: 'favoris', type: '' })}">♥ Favoris</a>
  </div>
  ${data.length ? `<div class="grid2 grid3">${data.map((a, i) => `
    <div class="card item${a.statut === 'reserve' ? ' is-res' : ''}">
      <a href="#/annonce/${a.id}" style="text-decoration:none"><div class="ph" style="background-image:url('${esc(urls[i])}')" role="img" aria-label="${esc(a.titre)}"></div>
      ${a.statut === 'reserve' ? '<span class="badge st warn">Réservé</span>' : a.est_a_moi ? '<span class="badge st">Votre annonce</span>' : a.type === 'don' ? '<span class="badge st">À donner</span>' : ''}
      <div class="bd"><div class="t">${esc(a.titre)}</div><div class="p">${prix(a)}</div><div class="muted small">${esc([a.categorie, a.residence || (a.is_adress ? 'ADRESS IMMOBILIER' : '')].filter(Boolean).join(' · '))}</div></div></a>
      ${a.est_a_moi ? '' : `<button class="fav" data-fav="${a.id}" aria-label="${favs.has(a.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${favs.has(a.id) ? '♥' : '♡'}</button>`}
    </div>`).join('')}</div>`
  : vue === 'favoris'
    ? `<div class="card center pad empty-fav"><div class="ef-heart">♡</div><b>Aucun favori pour le moment</b><p class="muted">Touchez le cœur ♡ sur une annonce d’un autre résident pour la retrouver ici.<br>Vos propres annonces n’ont pas de cœur : elles sont dans « Mes annonces ».</p><a class="btn" href="#/market">Parcourir le Market</a></div>`
    : `<div class="card center pad">${q ? 'Aucune annonce ne correspond à « ' + esc(q) + ' ».' : 'Aucune annonce pour le moment.'}<br><br><a class="btn" href="#/publier">+ Publier</a></div>`}`;
  app.querySelector('#s').onsubmit = (e) => e.preventDefault();
  const qi = app.querySelector('#q'), grille = app.querySelector('.grid2');
  if (grille) { const vide = document.createElement('p'); vide.className = 'muted center no-res'; vide.hidden = true; grille.after(vide);
    filtreLive(qi, () => grille.querySelectorAll('.item'), vide);
    qi.addEventListener('input', () => { try { history.replaceState(null, '', lien({ q: qi.value.trim() })); } catch (_) {} }); }
  app.querySelectorAll('[data-fav]').forEach(b => b.onclick = async () => {
    const id = b.dataset.fav, on = b.textContent === '♥';
    const r = on ? await sb.from('favoris').delete().eq('annonce_id', id) : await sb.from('favoris').insert({ user_id: state.session.user.id, annonce_id: id });
    if (r.error) return toast(errMsg(r.error));
    b.textContent = on ? '♡' : '♥'; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  });
}

async function annonce(id) {
  const { data: a } = await sb.from('v_market').select('*').eq('id', id).maybeSingle();
  if (!a) {
    app.innerHTML = `<a class="back" href="#/market">‹ Le Market</a><div class="card center pad"><b>Cette annonce n'est plus disponible.</b><br><br><a class="btn" href="#/market">Voir le Market</a></div>`;
    return;
  }
  track('vue_annonce', a.id);
  const [urls, dem] = await Promise.all([photosUrls(a.photos), sb.from('demandes').select('id').eq('annonce_id', a.id).eq('demandeur_id', state.session.user.id).maybeSingle()]);
  const dejaDemande = !!dem.data;
  app.innerHTML = `
  <a class="back" href="#/market">‹ Le Market</a>
  <div class="detail"><div class="detail-media"><div class="gal">${urls.map(u => `<img src="${esc(u)}" alt="${esc(a.titre)}">`).join('')}</div>
  ${urls.length > 1 ? `<p class="muted small">${urls.length} photos, faites glisser</p>` : ''}</div><div class="detail-info">
  <div class="tags">${a.statut === 'reserve' ? '<span class="badge warn">Réservé : nouvelles demandes suspendues</span>' : ''}${a.is_adress ? '<span class="badge">ADRESS IMMOBILIER</span>' : ''}</div>
  <h1>${esc(a.titre)}</h1>
  <h2 style="margin-top:4px">${prix(a)}</h2>
  <div class="tags"><span class="tag">${esc(a.categorie)}</span><span class="tag">${esc(a.etat)}</span>${a.residence ? `<span class="tag">${esc(a.residence)}</span>` : ''}</div>
  ${a.description ? `<p style="white-space:pre-line">${esc(a.description)}</p>` : ''}
  <p class="muted">Publié par ${esc(a.vendeur)} le ${dateFr(a.date_publication)}</p>
  ${a.est_a_moi ? `<div class="row"><a class="btn block" href="#/modifier/${a.id}">Modifier</a><a class="btn ghost block" href="#/mes-annonces">Gérer (réservé, vendu…)</a></div>`
    : a.statut === 'disponible' ? `<button class="btn block" id="int" ${dejaDemande ? 'disabled' : ''}>${dejaDemande ? 'C’est zooo ! Demande envoyée ✓' : 'Ça m’intéresse, ça m’enjaille !'}</button><div id="zoo"></div>
      <p class="muted small">Ce clic n'est pas une réservation : le vendeur contacte les intéressés dans l'ordre d'arrivée des demandes.</p>`
    : `<p class="muted">Le vendeur a réservé cet objet.</p>`}
  ${a.est_a_moi ? '' : `<p class="center" style="margin-top:18px"><a href="#" id="sig" class="muted small">Signaler cette annonce</a></p>`}</div></div>`;
  const b = app.querySelector('#int');
  if (b && !dejaDemande) b.onclick = async () => {
    b.disabled = true; b.textContent = 'Envoi…';
    const { data: rang, error } = await sb.rpc('je_suis_interesse', { p_annonce: a.id });
    if (error) { b.disabled = false; b.textContent = 'Ça m’intéresse, ça m’enjaille !'; return toast(errMsg(error)); }
    b.textContent = 'C’est zooo ! Demande envoyée ✓';
    const tel = state.profil.consentement_contact && state.profil.telephone;
    app.querySelector('#zoo').innerHTML = `<div class="zoo"><b>C’est zooo ! 🎉</b><p>Le vendeur a reçu votre demande n° ${rang}. ${tel ? `Il vous contactera au <b>${esc(state.profil.telephone)}</b>.` : 'Pour qu’il puisse vous joindre, <a href="#/profil">ajoutez votre numéro dans Mon compte</a> et autorisez son partage.'}</p><p class="muted">Merci !</p></div>`;
    try { navigator.vibrate && navigator.vibrate([12, 40, 18]); } catch (_) {}
  };
  const s = app.querySelector('#sig');
  if (s) s.onclick = async (e) => {
    e.preventDefault();
    const m = prompt('Pourquoi signalez-vous cette annonce ? (facultatif)');
    if (m === null) return;
    const { error } = await sb.rpc('signaler_annonce', { p_id: a.id, p_motif: 'Autre', p_commentaire: m });
    toast(error ? errMsg(error) : 'Merci, ADRESS examinera cette annonce.');
  };
}

// ---------- Modifier une annonce (vendeur) ----------
async function modifier(id) {
  const { data: a } = await sb.from('annonces').select('*').eq('id', id).maybeSingle();
  if (!a || a.vendeur_id !== state.session.user.id || !['disponible', 'reserve'].includes(a.statut) || a.retiree_par_adress) {
    app.innerHTML = `<a class="back" href="#/mes-annonces">‹ Mes annonces</a><div class="card center pad">Cette annonce ne peut plus être modifiée.</div>`; return;
  }
  const max = state.params.max_photos || 5;
  let gardees = [...a.photos], files = [];
  const urls = await photosUrls(a.photos); const urlDe = Object.fromEntries(a.photos.map((p, i) => [p, urls[i]]));
  app.innerHTML = `
  <a class="back" href="#/mes-annonces">‹ Mes annonces</a><h1>Modifier l’annonce</h1><p class="muted">${a.type === 'don' ? 'Objet à donner' : 'Objet à vendre'} · les intéressés gardent leur rang.</p>
  <form id="f" class="narrow" novalidate>
  <label>Photos (1 à ${max}) *</label>
  <div class="thumbs" id="th"></div>
  <label class="drop" for="ph">${ICO.camera}Ajouter des photos<small>Jusqu’à ${max} photos au total</small></label>
  <input id="ph" type="file" accept="image/*" multiple class="sr">
  <label for="ti">Titre *</label><input id="ti" type="text" maxlength="80" value="${esc(a.titre)}">
  <div class="grid2">
    <div><label for="ca">Catégorie *</label><select id="ca">${CATEGORIES.map(c => `<option ${c === a.categorie ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div><label for="et">État *</label><select id="et">${ETATS.map(c => `<option ${c === a.etat ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
  </div>
  <label for="de">Description courte</label><textarea id="de" maxlength="1000">${esc(a.description || '')}</textarea>
  ${a.type === 'vente' ? `<label for="px">Prix (FCFA) *</label><input id="px" type="number" inputmode="numeric" min="1" step="1" value="${a.prix_fcfa || ''}">` : '<p class="muted" style="margin-top:14px">Votre objet reste affiché <b>GRATUIT</b>.</p>'}
  <p class="err" id="err" hidden></p>
  <button class="btn block" id="go" style="margin-top:16px">Enregistrer les modifications</button>
  <a class="btn ghost block" style="margin-top:8px" href="#/mes-annonces">Annuler</a>
  </form>`;
  const $ = (s) => app.querySelector(s);
  const err = (m) => { $('#err').textContent = m; $('#err').hidden = !m; };
  const dessiner = () => {
    $('#th').innerHTML = gardees.map((p, i) => `<div class="th"><img src="${esc(urlDe[p])}" alt="Photo ${i + 1}"><button type="button" data-rg="${i}" aria-label="Retirer la photo">×</button></div>`).join('')
      + files.map((f, i) => `<div class="th"><img src="${URL.createObjectURL(f)}" alt="Nouvelle photo ${i + 1}"><button type="button" data-rn="${i}" aria-label="Retirer la photo">×</button></div>`).join('');
    app.querySelectorAll('[data-rg]').forEach(b => b.onclick = () => { gardees.splice(+b.dataset.rg, 1); dessiner(); });
    app.querySelectorAll('[data-rn]').forEach(b => b.onclick = () => { files.splice(+b.dataset.rn, 1); dessiner(); });
  };
  dessiner();
  $('#ph').onchange = (e) => { const place = max - gardees.length; files = files.concat([...e.target.files]).slice(0, Math.max(0, place)); if (gardees.length + files.length >= max) toast(`${max} photos maximum.`); e.target.value = ''; dessiner(); };
  $('#f').onsubmit = async (ev) => {
    ev.preventDefault(); err('');
    const titre = $('#ti').value.trim(), px = a.type === 'vente' ? parseInt($('#px').value, 10) : null;
    if (!gardees.length && !files.length) return err('Gardez ou ajoutez au moins une photo.');
    if (titre.length < 2) return err('Le titre est obligatoire.');
    if (a.type === 'vente' && !(px > 0)) return err('Le prix est obligatoire pour une vente.');
    const go = $('#go'); go.disabled = true; go.textContent = files.length ? 'Envoi des photos…' : 'Enregistrement…';
    try {
      const uid = state.session.user.id, paths = [...gardees];
      for (const f of files) {
        const blob = await compress(f), path = `${uid}/${crypto.randomUUID()}.jpg`;
        const { error } = await sb.storage.from('annonces').upload(path, blob, { contentType: 'image/jpeg' });
        if (error) throw error; paths.push(path);
      }
      const { error } = await sb.rpc('modifier_annonce', { p_id: a.id, p_titre: titre, p_categorie: $('#ca').value, p_etat: $('#et').value, p_description: $('#de').value.trim(), p_prix: px, p_photos: paths });
      if (error) throw (/schema cache|could not find/i.test(error.message) ? new Error('La modification sera disponible très bientôt (mise à jour du serveur en cours).') : error);
      a.photos.filter(p => !paths.includes(p)).forEach(p => signedCache.delete(p));
      toast('Annonce mise à jour.'); location.hash = `#/annonce/${a.id}`;
    } catch (e) { go.disabled = false; go.textContent = 'Enregistrer les modifications'; err(errMsg(e)); }
  };
}

// ---------- Publier (§3) ----------
function publier() {
  const max = state.params.max_photos || 5;
  let type = 'vente', files = [];
  app.innerHTML = `
  <a class="back" href="#/market">‹ Le Market</a><h1>Publier une annonce</h1><p class="muted">Publication immédiate, visible ${state.params.duree_publication_jours || 60} jours.</p>
  <form id="f" class="narrow" novalidate>
  <div class="chips" id="typ"><a class="chip on" data-v="vente">Je vends</a><a class="chip" data-v="don">Je donne</a></div>
  <label>Photos (1 à ${max}) *</label>
  <label class="drop" for="ph">${ICO.camera}Prendre ou choisir des photos<small>Jusqu’à ${max} photos, compressées automatiquement</small></label>
  <input id="ph" type="file" accept="image/*" multiple class="sr">
  <div class="thumbs" id="th"></div>
  <label for="ti">Titre *</label><input id="ti" type="text" maxlength="80" placeholder="Canapé 3 places">
  <div class="grid2">
    <div><label for="ca">Catégorie *</label><select id="ca"><option value="">Choisir…</option>${CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></div>
    <div><label for="et">État *</label><select id="et">${ETATS.map(c => `<option ${c === 'Bon état' ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
  </div>
  <label for="de">Description courte</label><textarea id="de" maxlength="1000" placeholder="Dimensions, défauts éventuels, disponibilité…"></textarea>
  <div id="pxBox"><label for="px">Prix (FCFA) *</label><input id="px" type="number" inputmode="numeric" min="1" step="1" placeholder="25000"></div>
  <p id="grat" class="muted" hidden style="margin-top:14px">Votre objet sera affiché <b>GRATUIT</b>.</p>
  <p class="hint">Résidence : ${esc(state.profil.residence?.nom || '—')} (renseignée automatiquement). Vous êtes seul responsable du contenu, des photos et des échanges.</p>
  <p class="err" id="err" hidden></p>
  <button class="btn block" id="go" style="margin-top:16px">Publier</button>
  </form>`;
  const $ = (s) => app.querySelector(s);
  const err = (m) => { $('#err').textContent = m; $('#err').hidden = !m; };
  app.querySelectorAll('#typ .chip').forEach(c => c.onclick = () => {
    type = c.dataset.v; app.querySelectorAll('#typ .chip').forEach(x => x.classList.toggle('on', x === c));
    $('#pxBox').hidden = type !== 'vente'; $('#grat').hidden = type !== 'don';
  });
  const dessiner = () => { $('#th').innerHTML = files.map((f, i) => `<div class="th"><img src="${URL.createObjectURL(f)}" alt="Photo ${i + 1}"><button type="button" data-rm="${i}" aria-label="Retirer la photo ${i + 1}">×</button></div>`).join('');
    app.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { files.splice(+b.dataset.rm, 1); dessiner(); }); };
  $('#ph').onchange = (e) => { files = files.concat([...e.target.files]).slice(0, max); if (e.target.files.length + files.length > max) toast(`${max} photos maximum.`); e.target.value = ''; dessiner(); };
  $('#f').onsubmit = async (ev) => {
    ev.preventDefault(); err('');
    const titre = $('#ti').value.trim(), categorie = $('#ca').value, etat = $('#et').value, description = $('#de').value.trim(), px = parseInt($('#px').value, 10);
    if (!files.length) return err('Ajoutez au moins une photo.');
    if (titre.length < 2 || !categorie) return err('Le titre et la catégorie sont obligatoires.');
    if (type === 'vente' && !(px > 0)) return err('Le prix est obligatoire pour une vente.');
    const go = $('#go'); go.disabled = true; go.textContent = 'Envoi des photos…';
    try {
      const uid = state.session.user.id, paths = [];
      for (const f of files) {
        const blob = await compress(f), path = `${uid}/${crypto.randomUUID()}.jpg`;
        const { error } = await sb.storage.from('annonces').upload(path, blob, { contentType: 'image/jpeg' });
        if (error) throw error; paths.push(path);
      }
      go.textContent = 'Publication…';
      const { data, error } = await sb.from('annonces').insert({ type, titre, categorie, etat, description: description || null, prix_fcfa: type === 'vente' ? px : null, photos: paths }).select('id').single();
      if (error) throw error;
      toast('Votre annonce est en ligne.'); location.hash = `#/annonce/${data.id}`;
    } catch (e) { go.disabled = false; go.textContent = 'Publier'; err(errMsg(e)); }
  };
}

// ---------- Mes annonces et demandes (§4, §5) ----------
async function mesAnnonces() {
  const onglet = qs().get('o') || 'annonces';
  const tabs = `<div class="chips"><a class="chip ${onglet === 'annonces' ? 'on' : ''}" href="#/mes-annonces">Mes annonces</a><a class="chip ${onglet === 'envoyees' ? 'on' : ''}" href="#/mes-annonces?o=envoyees">Mes demandes envoyées</a></div>`;
  if (onglet === 'envoyees') {
    const { data } = await sb.from('demandes').select('id, rang, created_at, statut, annonce_id').eq('demandeur_id', state.session.user.id).order('created_at', { ascending: false });
    const ids = (data || []).map(d => d.annonce_id);
    const { data: ouvertes } = ids.length ? await sb.from('v_market').select('id,titre,statut').in('id', ids) : { data: [] };
    const m = new Map((ouvertes || []).map(o => [o.id, o]));
    app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Mes demandes</h1>${tabs}<div class="list" id="lst">${(data || []).map(d => { const o = m.get(d.annonce_id); return `
      <div class="card"><b>${o ? `<a href="#/annonce/${d.annonce_id}">${esc(o.titre)}</a>` : 'Annonce clôturée'}</b>
      <div class="muted small">Demande n° ${d.rang} du ${dateFr(d.created_at, true)}${o?.statut === 'reserve' ? ' · réservé par le vendeur' : ''}</div></div>`; }).join('') || '<div class="card center pad">Vous n\'avez envoyé aucune demande.</div>'}</div>`;
    if ((data || []).length) barreRecherche(app.querySelector('#lst'), () => app.querySelectorAll('#lst > .card'), 'Rechercher une demande…');
    return;
  }
  const [{ data: mes, error }, { data: dem }] = await Promise.all([
    sb.from('annonces').select('*').eq('vendeur_id', state.session.user.id).order('date_publication', { ascending: false }),
    sb.rpc('mes_demandes_recues')]);
  if (error) throw error;
  const urls = await photosUrls((mes || []).map(a => a.photos[0]));
  const parAnnonce = (id) => (dem || []).filter(d => d.annonce_id === id);
  const ouverte = (a) => ['disponible', 'reserve'].includes(a.statut) && !a.retiree_par_adress;
  const prol = state.params.duree_prolongation_jours || 30;
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Mes annonces</h1>${tabs}
  <p class="muted">Contactez les intéressés dans l'ordre d'arrivée des demandes.</p>
  <div class="list" id="lst">${(mes || []).map((a, i) => { const ds = parAnnonce(a.id), nl = ds.filter(d => !d.lue).length; return `
  <div class="card" data-id="${a.id}">
    <div style="display:flex;gap:12px"><div class="ph" style="width:72px;height:72px;flex:none;border-radius:10px;background-image:url('${esc(urls[i])}')"></div>
    <div style="min-width:0"><b>${ouverte(a) ? `<a href="#/annonce/${a.id}">${esc(a.titre)}</a>` : esc(a.titre)}</b>
      <div class="muted small"><span class="pill ${a.retiree_par_adress ? 'off' : a.statut}">${a.retiree_par_adress ? 'Retirée par ADRESS' : STATUTS[a.statut]}</span> · ${prix(a)}</div>
      <div class="muted small">${ouverte(a) ? `Expire le ${dateFr(a.date_expiration)}` : `Clôturée${a.date_cloture ? ' le ' + dateFr(a.date_cloture) : ''} · archivée`}</div></div></div>
    ${ds.length ? `<details ${ouverte(a) ? 'open' : ''} data-lire="${nl ? a.id : ''}"><summary style="margin-top:10px">${ds.length} demande${ds.length > 1 ? 's' : ''}${nl ? ` · <span class="badge">${nl} nouvelle${nl > 1 ? 's' : ''}</span>` : ''}</summary>
      ${ds.map(d => `<div class="dem"><b>n° ${d.rang}</b> ${esc(d.demandeur)} ${d.statut === 'contactee' ? '<span class="badge ok">contacté</span>' : ''}
        <div class="muted small">Le ${dateFr(d.created_at, true)}</div>
        ${d.contact ? `<div class="row" style="margin-top:6px"><a class="btn sm soft" data-ct="${d.id}" target="_blank" rel="noopener" href="https://wa.me/${esc(d.contact.replace(/[^0-9]/g, ''))}">WhatsApp</a><a class="btn sm soft" data-ct="${d.id}" href="tel:${esc(d.contact.replace(/[^0-9+]/g, ''))}">Appeler</a></div>`
          : `<div class="muted small">Ce résident n'a pas partagé ses coordonnées.</div>`}</div>`).join('')}</details>` : ''}
    ${ouverte(a) ? `<div class="row" style="margin-top:12px">
      <button class="btn sm ghost" data-act="${a.statut === 'reserve' ? 'disponible' : 'reserve'}">${a.statut === 'reserve' ? 'Remettre disponible' : 'Réservé'}</button>
      <button class="btn sm" data-act="${a.type === 'don' ? 'don_effectue' : 'vendu'}">${a.type === 'don' ? 'Don effectué' : 'Vendu'}</button>
      <button class="btn sm ghost" data-act="retire">Retirer</button></div>` : ''}
    ${(ouverte(a) || a.statut === 'expire') && !a.retiree_par_adress ? `<div class="row" style="margin-top:8px">${ouverte(a) ? `<a class="btn sm soft" href="#/modifier/${a.id}">Modifier</a>` : ''}<button class="btn sm soft" data-act="prolonger">Prolonger de ${prol} jours</button></div>` : ''}
  </div>`; }).join('') || '<div class="card center pad">Vous n\'avez encore publié aucune annonce.<br><br><a class="btn" href="#/publier">+ Publier</a></div>'}</div>`;
  if ((mes || []).length) { barreRecherche(app.querySelector('#lst'), () => app.querySelectorAll('#lst > .card[data-id]'), 'Rechercher dans mes annonces…'); const qs0 = app.querySelector('.live-search input'); if (qs0 && mesAnnonces._q) { qs0.value = mesAnnonces._q; qs0.dispatchEvent(new Event('input')); } if (qs0) qs0.addEventListener('input', () => mesAnnonces._q = qs0.value); }
  app.querySelectorAll('details[data-lire]').forEach(d => { if (d.dataset.lire) sb.rpc('marquer_demandes_lues', { p_annonce: d.dataset.lire }).then(majCompteurs); });
  app.querySelectorAll('[data-ct]').forEach(l => l.addEventListener('click', () => sb.rpc('marquer_contactee', { p_demande: l.dataset.ct })));
  app.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
    const id = b.closest('[data-id]').dataset.id, act = b.dataset.act;
    if (['vendu', 'don_effectue', 'retire'].includes(act) && !confirm(act === 'retire' ? 'Retirer cette annonce du Market ?' : 'Confirmer ? L\'annonce sera immédiatement retirée du Market et archivée.')) return;
    b.disabled = true;
    const r = act === 'prolonger' ? await sb.rpc('prolonger_annonce', { p_id: id }) : await sb.rpc('changer_statut_annonce', { p_id: id, p_statut: act });
    if (r.error) { b.disabled = false; return toast(errMsg(r.error)); }
    if (act === 'vendu' || act === 'don_effectue') { location.hash = `#/avis?annonce=${id}`; return; }
    const titre = b.closest('[data-id]').querySelector('b').textContent.trim();
    const msg = { prolonger: `« ${titre} » prolongée jusqu'au ${dateFr(r.data)}.`, reserve: `« ${titre} » est marquée réservée.`, disponible: `« ${titre} » est de nouveau disponible.`, retire: `« ${titre} » a été retirée du Market.` };
    toast(msg[act] || 'Annonce mise à jour.');
    const y = scrollY; await mesAnnonces(); scrollTo(0, y);
    const c = app.querySelector(`[data-id="${id}"]`);
    if (c) { const r2 = c.getBoundingClientRect(); if (r2.top < 70 || r2.bottom > innerHeight - 80) c.scrollIntoView({ block: 'center', behavior: 'smooth' }); c.classList.add('flash'); }
  });
}

// ---------- Contenus ADRESS (§7, §7 bis) ----------
async function residences() {
  const { data } = await sb.from('residences').select('*').eq('visible', true).order('ordre');
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Nos résidences</h1><p class="muted">Les résidences ADRESS IMMOBILIER</p>
  <div class="list" style="margin-top:12px">${(data || []).map(r => `<div class="card item">
    ${r.photo_path ? `<div class="ph" style="aspect-ratio:16/9;background-image:url('${esc(publicUrl(r.photo_path))}')"></div>` : ''}
    <div class="bd" style="padding:14px"><h3>${esc(r.nom)}</h3><div class="muted small">${esc(r.quartier || '')}${r.type_bien ? ' · ' + esc(r.type_bien) : ''}</div>
    ${r.description ? `<p>${esc(r.description)}</p>` : ''}${r.lien_decouvrir ? `<a class="btn sm" data-r="${r.id}" href="${esc(r.lien_decouvrir)}" target="_blank" rel="noopener">Découvrir</a>` : ''}</div></div>`).join('') || '<div class="card center pad">Les résidences seront bientôt présentées ici.</div>'}</div>`;
  (data || []).forEach(r => track('vue_residence', r.id));
  app.querySelectorAll('[data-r]').forEach(a => a.addEventListener('click', () => track('clic_residence', a.dataset.r)));
}
async function nouveautes() {
  const { data } = await sb.from('contenus').select('*').eq('visible', true).neq('type', 'Flip Immo').order('date_parution', { ascending: false });
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Les nouveautés</h1><p class="muted">Nouvelles résidences, programmes à venir et actualités ADRESS</p>
  <div class="list" style="margin-top:12px">${(data || []).map(c => `<div class="card item">
    ${c.image_path ? `<div class="ph" style="aspect-ratio:16/9;background-image:url('${esc(publicUrl(c.image_path))}')"></div>` : ''}
    <div class="bd" style="padding:14px"><div class="muted small">${esc(c.type)} · ${dateFr(c.date_parution)}</div><h3>${esc(c.titre)}</h3>
    ${c.texte ? `<p style="white-space:pre-line">${esc(c.texte)}</p>` : ''}${c.lien ? `<a class="btn sm" href="${esc(c.lien)}" target="_blank" rel="noopener">En savoir plus</a>` : ''}</div></div>`).join('') || '<div class="card center pad">Aucune nouveauté pour le moment.</div>'}</div>`;
}
async function flip() {
  const { data } = await sb.from('contenus').select('*').eq('visible', true).eq('type', 'Flip Immo').order('date_parution', { ascending: false }).limit(1);
  const f = data?.[0];
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Le Flip Immo</h1><p class="muted">Le magazine ADRESS IMMOBILIER</p>
  ${f ? `<div class="card center" style="margin-top:12px">${f.image_path ? `<img src="${esc(publicUrl(f.image_path))}" alt="Couverture du Flip Immo" style="margin:0 auto;max-height:520px;border-radius:10px">` : ''}
    <h2>${esc(f.titre)}${f.numero ? ' – n° ' + esc(f.numero) : ''}</h2>${f.lien ? `<a class="btn block" id="lire" href="${esc(lienFlip(f.lien, f.titre))}" ${estFlip(f.lien) ? '' : 'target="_blank" rel="noopener"'}>Lire le magazine</a>` : ''}</div>`
  : '<div class="card center pad" style="margin-top:12px">Le prochain numéro arrive bientôt.</div>'}`;
  const l = app.querySelector('#lire'); if (l) l.addEventListener('click', () => track('clic_flip', f.id));
}
async function bonnesAdresses() {
  const cat = qs().get('cat') || '';
  let req = sb.from('partenaires').select('*').eq('visible', true).eq('valide_par_adress', true).order('ordre');
  if (cat) req = req.eq('categorie', cat);
  const { data } = await req;
  const tous = data || [], flips = cat ? [] : tous.filter(p => estFlip(p.lien)), adresses = tous.filter(p => !estFlip(p.lien));
  const ligne = (p) => '<div class="card bp">'
    + '<div class="bp-logo"' + (p.logo_path ? ' style="background-image:url(\'' + esc(publicUrl(p.logo_path)) + '\')"' : '') + '></div>'
    + '<div class="bp-txt"><b>' + esc(p.nom) + '</b><div class="muted small">' + esc(p.categorie) + '</div>' + (p.description ? '<p>' + esc(p.description) + '</p>' : '') + '</div>'
    + (p.lien ? '<a class="btn sm ghost" data-p="' + p.id + '" href="' + esc(p.lien) + '" target="_blank" rel="noopener">Découvrir</a>' : '') + '</div>';
  const flipCard = (p) => '<a class="flipcard" data-p="' + p.id + '" href="' + esc(lienFlip(p.lien, p.nom)) + '">'
    + '<span class="fc-cover"' + (p.logo_path ? ' style="background-image:url(\'' + esc(publicUrl(p.logo_path)) + '\')"' : '') + '><i class="orb o1"></i><i class="orb o2"></i><em>' + esc(p.nom) + '</em></span>'
    + '<span class="fc-txt"><small>Carnet d’Abidjan</small><b>' + esc(p.nom) + '</b>' + (p.description ? '<span>' + esc(p.description) + '</span>' : '') + '<u>Feuilleter ' + ICO.arrow + '</u></span></a>';
  app.innerHTML = '<a class="back" href="#/">‹ Accueil</a><h1>Les bons plans</h1><p class="muted">La sélection ADRESS pour vivre Abidjan</p>'
    + '<div class="chips"><a class="chip ' + (!cat ? 'on' : '') + '" href="#/bonnes-adresses">Tout</a>' + FILTRES_BP.map(c => '<a class="chip ' + (cat === c ? 'on' : '') + '" href="#/bonnes-adresses?cat=' + encodeURIComponent(c) + '">' + c + '</a>').join('') + '</div>'
    + (flips.length ? '<section><h2>À feuilleter</h2><div class="list">' + flips.map(flipCard).join('') + '</div></section>' : '')
    + (cat ? [cat] : FILTRES_BP).map(c => { const l = adresses.filter(p => p.categorie === c); return l.length ? '<section><h2>' + esc(c) + '</h2><div class="list">' + l.map(ligne).join('') + '</div></section>' : ''; }).join('')
    + (!adresses.length && !flips.length ? '<div class="card center pad">Aucun bon plan dans cette catégorie pour le moment.</div>' : '')
    + '<p class="muted small center" style="margin-top:22px">Sélection éditoriale d’ADRESS IMMOBILIER, sans paiement intégré ni commission.</p>';
  app.querySelectorAll('[data-p]').forEach(a => a.addEventListener('click', () => track('clic_partenaire', a.dataset.p)));
}

// ---------- Lecteur de flipbook Heyzine (Flip Immo, catalogues partenaires) ----------
function lire() {
  const p = qs(), u = p.get('u') || '', t = p.get('t') || 'Flipbook';
  if (!estFlip(u)) { location.hash = '#/'; return; }
  app.innerHTML = `<a class="back" href="javascript:history.back()">‹ Retour</a><h1>${esc(t)}</h1>
  <div class="flip"><iframe src="${esc(u)}" title="${esc(t)}" allow="fullscreen" allowfullscreen loading="lazy"></iframe></div>
  <a class="btn ghost block" style="margin-top:10px" href="${esc(u)}" target="_blank" rel="noopener">Ouvrir en plein écran</a>`;
}

// ---------- Notifications (§6) ----------
async function notifications() {
  const { data } = await sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Notifications</h1>
  <div class="list" style="margin-top:12px">${(data || []).map(n => `<a class="card notif ${n.lue ? '' : 'unread'}" style="display:block;text-decoration:none" href="${n.type === 'interet' || n.type === 'rappel_j53' || n.type === 'expiration' ? '#/mes-annonces' : n.type === 'nouveautes' ? '#/market' : '#/'}">
    <b>${esc(n.titre)}</b>${n.message ? `<div class="muted small">${esc(n.message)}</div>` : ''}<div class="muted small">${dateFr(n.created_at, true)}</div></a>`).join('') || '<div class="card center pad">Aucune notification.</div>'}</div>
  <p class="muted small center" style="margin-top:12px">Réglez vos alertes dans <a href="#/profil">Mon compte</a>.</p>`;
  const nonLues = (data || []).filter(n => !n.lue).map(n => n.id);
  if (nonLues.length) await sb.from('notifications').update({ lue: true }).in('id', nonLues);
}

// ---------- Mon compte ----------
function profil() {
  const p = state.profil;
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Mon compte</h1>
  <form id="f" class="card" style="margin-top:12px">
    <label for="nom">Nom d'affichage (visible des autres résidents)</label><input id="nom" type="text" maxlength="40" value="${esc(p.nom_affichage)}">
    <label for="tel">Téléphone (privé)</label><input id="tel" type="tel" value="${esc(p.telephone || '')}" placeholder="+225 07 00 00 00 00">
    <label class="check"><input id="cons" type="checkbox" ${p.consentement_contact ? 'checked' : ''}> J'accepte que mon téléphone soit communiqué uniquement aux vendeurs des objets pour lesquels je clique « Ça m’intéresse ».</label>
    <h2>Alertes</h2>
    <label class="check"><input id="nq" type="checkbox" ${p.notif_quotidienne ? 'checked' : ''}> Résumé quotidien des nouvelles annonces (une fois par jour au maximum)</label>
    <label class="check"><input id="ni" type="checkbox" ${p.notif_interet ? 'checked' : ''}> M'alerter quand un résident est intéressé par mon annonce</label>
    <button class="btn block" style="margin-top:12px">Enregistrer</button>
  </form>
  <div class="card" style="margin-top:12px"><p class="muted small">Résidence : ${esc(p.residence?.nom || '—')}<br>Compte activé le ${dateFr(p.date_activation)}</p>
  <div class="row"><a class="btn ghost" href="#/avis">Donner mon avis</a><button class="btn ghost" id="install" hidden>Installer l'application</button><button class="btn danger" id="out">Se déconnecter</button></div></div>`;
  const $ = (s) => app.querySelector(s);
  $('#f').onsubmit = async (e) => {
    e.preventDefault();
    const { error } = await sb.rpc('maj_preferences', { p_nom_affichage: $('#nom').value, p_telephone: $('#tel').value, p_consentement: $('#cons').checked, p_notif_quotidienne: $('#nq').checked, p_notif_interet: $('#ni').checked });
    if (error) return toast(errMsg(error));
    await chargerProfil(); toast('Préférences enregistrées.');
  };
  $('#out').onclick = async () => { await sb.auth.signOut(); await chargerProfil(); location.hash = '#/'; router(); };
  if (window._installPrompt) { $('#install').hidden = false; $('#install').onclick = () => window._installPrompt.prompt(); }
}

// ---------- Avis (§8) ----------
function avis() {
  const an = qs().get('annonce');
  let u = null;
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Votre avis</h1>
  ${an ? '<p class="badge ok">Annonce clôturée et retirée du Market.</p>' : ''}
  <p>${an ? 'Cela vous a-t-il été utile ?' : 'ADRESS CLUB vous est-il utile ?'}</p>
  <div class="chips" id="ut"><a class="chip" data-v="Oui">Oui</a><a class="chip" data-v="Partiellement">Partiellement</a><a class="chip" data-v="Non">Non</a></div>
  <label for="am">Que pouvons-nous améliorer ? (facultatif)</label><textarea id="am" maxlength="2000"></textarea>
  <p class="err" id="err" hidden></p>
  <button class="btn block" id="go" style="margin-top:14px">Envoyer mon avis</button>
  <p class="center"><a class="muted" href="#/mes-annonces">Passer</a></p>`;
  app.querySelectorAll('#ut .chip').forEach(c => c.onclick = () => { u = c.dataset.v; app.querySelectorAll('#ut .chip').forEach(x => x.classList.toggle('on', x === c)); app.querySelector('#err').hidden = true; });
  app.querySelector('#go').onclick = async () => {
    if (!u) { const e = app.querySelector('#err'); e.textContent = 'Choisissez Oui, Partiellement ou Non.'; e.hidden = false; return; }
    const { error } = await sb.from('avis').insert({ auteur_id: state.session.user.id, annonce_id: an || null, utilite: u, amelioration: app.querySelector('#am').value.trim() || null, origine: an ? 'cloture' : 'menu' });
    if (error) return toast(errMsg(error));
    toast('Merci pour votre avis.'); location.hash = an ? '#/mes-annonces' : '#/';
  };
}

// ---------- démarrage ----------
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window._installPrompt = e; });
window.addEventListener('hashchange', router);
document.addEventListener('visibilitychange', () => { if (!document.hidden) majCompteurs(); });
sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') { state.session = null; state.profil = null; } });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
window.addEventListener('scroll', () => document.getElementById('top').classList.toggle('scrolled', scrollY > 4), { passive: true });
await chargerProfil();
router();
setInterval(majCompteurs, 60000);

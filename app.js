// ADRESS CLUB — application des résidents (PWA)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

export const SUPABASE_URL = 'https://xvevjlovjpeqfpzfihrj.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_oPj4LrfV0uvN95MmpTPl8A_x5XLxVcj';
const RECUP = /type=recovery/.test(location.hash);
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

export const CATEGORIES = ['Meubles','Électroménager','Décoration','Enfants et bébé','Vêtements et accessoires','Électronique','Sport et loisirs','Maison et jardin','Autre'];
export const ETATS = ['Neuf','Très bon état','Bon état','Usagé','À réparer'];
export const FILTRES_BP = ['Rideaux et décoration','Aménagement et revêtements'];
const STATUTS = { disponible:'Disponible', reserve:'Réservé', vendu:'Vendu', don_effectue:'Don effectué', retire:'Retiré', expire:'Expiré' };

export const state = { session: null, profil: null, params: {}, compteurs: { demandes_non_lues: 0, notifications_non_lues: 0 } };
const app = document.getElementById('app');

// ---------- utilitaires ----------
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
export const fcfa = (n) => Number(n).toLocaleString('fr-FR') + ' FCFA';
export const dateFr = (d, h) => d ? new Date(d).toLocaleDateString('fr-FR', h ? { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' } : { day:'2-digit', month:'2-digit', year:'numeric' }) : '';
export function toast(msg, ms = 3500) { const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, ms); }
export const errMsg = (e) => (e && (e.message || e.error_description)) ? String(e.message || e.error_description).replace(/^.*?ERROR:\s*/,'') : 'Une erreur est survenue, réessayez.';
export const publicUrl = (path) => !path ? '' : /^https?:\/\//.test(path) ? path : sb.storage.from('contenus').getPublicUrl(path).data.publicUrl;
function prix(a) { return a.type === 'don' ? 'GRATUIT' : fcfa(a.prix_fcfa); }
const qs = () => new URLSearchParams((location.hash.split('?')[1]) || '');
const estFlip = (u) => /^https:\/\/([a-z0-9-]+\.)?heyzine\.com\//i.test(u || '');
const lienFlip = (u, t) => estFlip(u) ? '#/lire?' + new URLSearchParams({ u, t: t || '' }).toString() : u;
// Liens saisis dans l'Espace ADRESS : seuls http(s), e-mail et téléphone sont acceptés
const sur = (u) => /^(https?:|mailto:|tel:)/i.test(String(u || '').trim()) ? String(u).trim() : '#';
// Numéro au format international pour WhatsApp et l'appel : 07 07 00 00 00 → 2250707000000 (Côte d'Ivoire par défaut)
const intl = (t) => { let d = String(t || '').replace(/[^0-9]/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.length === 10 && d.startsWith('0')) d = '225' + d; return d; };
const fete = () => window.dispatchEvent(new Event('acl-fete'));
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

// Liens signés réutilisés 6 jours (même adresse = image servie par le cache du téléphone)
const signedCache = new Map();
const SIG_KEY = 'acl-sig', SIG_TTL = 7 * 86400;
try { const s = JSON.parse(localStorage.getItem(SIG_KEY) || '{}'), now = Date.now(); for (const k in s) if (s[k][1] > now + 3600e3) signedCache.set(k, s[k]); } catch (_) {}
const sauverSig = () => { try { const o = {}; signedCache.forEach((v, k) => { if (v[1]) o[k] = v; }); localStorage.setItem(SIG_KEY, JSON.stringify(o)); } catch (_) {} };
async function signer(paths) {
  const need = [...new Set(paths.filter(p => p && !signedCache.has(p)))];
  if (need.length) {
    const { data } = await sb.storage.from('annonces').createSignedUrls(need, SIG_TTL);
    const exp = Date.now() + SIG_TTL * 1000;
    (data || []).forEach(x => signedCache.set(x.path, [x.signedUrl || '', x.signedUrl ? exp : 0]));
    sauverSig();
  }
  return paths.map(p => (signedCache.get(p) || [''])[0]);
}
const vignette = (p) => p && p.endsWith('.jpg') && !p.endsWith('_t.jpg') ? p.replace(/\.jpg$/, '_t.jpg') : p;
// Listes : vignette légère si elle existe, sinon la photo d'origine
async function photosUrls(paths, petit = false) {
  if (!petit) return signer(paths);
  const [t, f] = await Promise.all([signer(paths.map(vignette)), signer(paths)]);
  return paths.map((p, i) => t[i] || f[i]);
}
async function envoyerPhoto(uid, f) {
  const id = crypto.randomUUID(), path = `${uid}/${id}.jpg`;
  const [grand, petit] = await Promise.all([compress(f, 1280, 0.8), compress(f, 480, 0.72)]);
  const o = { contentType: 'image/jpeg', cacheControl: '31536000' };
  const { error } = await sb.storage.from('annonces').upload(path, grand, o);
  if (error) throw error;
  await sb.storage.from('annonces').upload(`${uid}/${id}_t.jpg`, petit, o);
  return path;
}

export function compress(file, max = 1280, q = 0.82) {
  return new Promise((ok, ko) => {
    const img = new Image(); const u = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => { URL.revokeObjectURL(u); b ? ok(b) : ko(new Error('Image illisible')); }, 'image/jpeg', q); };
    img.onerror = () => ko(new Error('Image illisible')); img.src = u;
  });
}

// ---------- session et profil ----------
async function chargerProfil() {
  const { data: { session } } = await sb.auth.getSession();
  state.session = session; state.profilKo = false;
  if (!session) { state.profil = null; return; }
  // profil et paramètres demandés en même temps (un seul aller-retour réseau au lieu de deux)
  const [{ data, error }, { data: p }] = await Promise.all([
    sb.from('profiles').select('*, residence:residences(nom,photo_path)').eq('id', session.user.id).maybeSingle(),
    sb.from('parametres').select('cle,valeur')]);
  if (error && !data) { state.profilKo = true; if (state.profil?.id === session.user.id) state.profilKo = false; return; }
  state.profil = data;
  if (data?.statut === 'actif') state.params = Object.fromEntries((p || []).map(x => [x.cle, Number(x.valeur)]));
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
  'notifications': notifications, 'profil': profil, 'avis': avis, 'lire': lire, 'admin': async (p) => (await import('./admin.js')).renderAdmin(app, p)
};
// Squelettes de chargement à la forme de l'écran qui arrive (affichés seulement si l'attente dépasse 120 ms)
const SQ = {
  '': '<div class="sk"><i class="sk-hero"></i><i class="sk-h2"></i><div class="sk-row"><i></i><i></i><i></i></div><i class="sk-card"></i></div>',
  market: '<div class="sk"><i class="sk-t"></i><i class="sk-s"></i><i class="sk-in"></i><div class="sk-chips"><i></i><i></i><i></i><i></i></div><div class="sk-grid"><i></i><i></i><i></i><i></i></div></div>',
  annonce: '<div class="sk"><i class="sk-back"></i><i class="sk-photo"></i><i class="sk-t"></i><i class="sk-s"></i><i class="sk-btn"></i></div>',
  residences: '<div class="sk"><i class="sk-back"></i><i class="sk-t"></i><i class="sk-res"></i><i class="sk-res"></i></div>',
  'mes-annonces': '<div class="sk"><i class="sk-t"></i><i class="sk-tabs"></i><i class="sk-line"></i><i class="sk-line"></i><i class="sk-line"></i></div>',
  'bonnes-adresses': '<div class="sk"><i class="sk-t"></i><div class="sk-chips"><i></i><i></i><i></i></div><i class="sk-line"></i><i class="sk-line"></i><i class="sk-line"></i></div>',
  notifications: '<div class="sk"><i class="sk-t"></i><i class="sk-line"></i><i class="sk-line"></i><i class="sk-line"></i></div>'
};
const SQ_DEF = '<div class="sk"><i class="sk-t"></i><i class="sk-card"></i><i class="sk-card"></i></div>';
async function router() {
  const [path] = location.hash.replace(/^#\/?/, '').split('?');
  const [name, param] = path.split('/');
  document.getElementById('top').hidden = !actif();
  document.getElementById('nav').hidden = !actif();
  const sect = ({ '': 'accueil', annonce: 'market', modifier: 'mes-annonces' })[name] ?? name;
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === sect));
  window.scrollTo(0, 0);
  if (!state.session) return connexion();
  if (state.recup || RECUP) { state.recup = true; return nouveauMdp(); }
  if (state.profilKo) return horsLigne();
  if (!actif()) return activation();
  const view = routes[name] || accueil;
  app.classList.remove('page-in');
  let skT = 0;
  if (view.constructor.name === 'AsyncFunction') { const avant = app.firstElementChild;
    skT = setTimeout(() => { if (app.firstElementChild === avant) { app.innerHTML = name === 'admin' ? SQ_DEF : (SQ[name] ?? SQ_DEF); window.dispatchEvent(new Event('acl-squelette')); } }, 120); }
  try { await view(param); } catch (e) { console.error(e); app.innerHTML = `<div class="card">${esc(errMsg(e))}</div>`; }
  clearTimeout(skT);
  void app.offsetWidth; app.classList.add('page-in');
  if (view !== accueil) majCompteurs(); // l'accueil vient déjà de les mettre à jour
}

// Réseau absent ou trop lent au démarrage : écran d'attente qui réessaie tout seul
function horsLigne() {
  app.innerHTML = `<div class="login"><div class="card center pad" style="margin-top:18vh"><div class="off-ico">⌁</div><b>Connexion impossible pour le moment</b><p class="muted">Vérifiez votre connexion Internet. ADRESS CLUB réessaie automatiquement.</p><button class="btn" id="rt" type="button">Réessayer</button></div></div>`;
  const go = async () => { const b = app.querySelector('#rt'); if (b) { b.disabled = true; b.textContent = 'Connexion…'; } await chargerProfil(); router(); };
  app.querySelector('#rt').onclick = go;
  addEventListener('online', go, { once: true }); setTimeout(() => { if (app.querySelector('#rt:not([disabled])')) go(); }, 15000);
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
    <label for="email" id="emailLbl">E-mail</label><input id="email" type="email" autocomplete="email" required>
    <p class="hint" id="emailHint" hidden>Utilisez l’adresse e-mail que vous avez communiquée à ADRESS IMMOBILIER : le code ne fonctionne qu’avec elle.</p>
    <label for="mdp">Mot de passe</label><input id="mdp" type="password" autocomplete="current-password" minlength="8" required>
    <p class="hint" id="mdpHint" hidden>8 caractères minimum.</p>
    <p class="err" id="err" hidden></p>
    <button class="btn block" style="margin-top:16px" id="go">Se connecter</button>
    <p class="center small" id="oubliP" style="margin:12px 0 0"><a href="#" id="oubli">Mot de passe oublié ?</a></p>
  </form>
  <p class="muted center" style="margin-top:14px">Accès réservé aux résidents. Un compte par logement, activé par ADRESS IMMOBILIER.</p>
  ${estInstallee() ? '' : '<p class="center" style="margin-top:6px"><button class="linkbtn" type="button" id="inst">📲 Installer l’application sur mon téléphone</button></p>'}</div>`;
  const ib = app.querySelector('#inst'); if (ib) ib.onclick = installer;
  let mode = 'login';
  app.querySelectorAll('[data-m]').forEach(c => c.onclick = () => {
    mode = c.dataset.m; app.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === c));
    app.querySelector('#sign').hidden = mode !== 'signup'; app.querySelector('#mdpHint').hidden = mode !== 'signup';
    app.querySelector('#go').textContent = mode === 'signup' ? 'Créer mon accès' : 'Se connecter';
    app.querySelector('#mdp').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    app.querySelector('#oubliP').hidden = mode === 'signup';
    app.querySelector('#emailHint').hidden = mode !== 'signup'; app.querySelector('#emailLbl').textContent = mode === 'signup' ? 'Votre e-mail (celui communiqué à ADRESS)' : 'E-mail';
  });
  app.querySelector('#oubli').onclick = (e) => { e.preventDefault(); motDePasseOublie(app.querySelector('#email').value.trim()); };
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
      const vf = await sb.rpc('verifier_invitation', { p_code: code, p_email: email });
      if (vf.error || vf.data !== 'ok') return show(vf.data || errMsg(vf.error));
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
  app.querySelector('#out').onclick = (e) => { e.preventDefault(); deconnecter(e.currentTarget); };
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
// ---------- Installer l'application sur le téléphone ----------
const estInstallee = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const estIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// Vidéos tutoriels (format vertical, hébergées avec l'application)
const videoTuto = (os, auto) => `<video class="tuto-v" controls playsinline preload="none" ${auto ? 'autoplay muted' : ''} poster="videos/poster-${os}.jpg" src="videos/tuto-${os}.mp4"></video>`;
// Déconnexion fiable : session effacée sur le téléphone même si le serveur ne répond pas, puis rechargement propre
export async function deconnecter(btn) {
  if (btn) { btn.disabled = true; btn.textContent = 'Déconnexion…'; }
  try { const reg = 'serviceWorker' in navigator && await navigator.serviceWorker.getRegistration(); const s = reg && reg.pushManager && await reg.pushManager.getSubscription(); if (s) { await Promise.race([sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint), new Promise(r => setTimeout(r, 1500))]); await s.unsubscribe(); } } catch (_) {}
  try { await Promise.race([sb.auth.signOut({ scope: 'local' }), new Promise(r => setTimeout(r, 2500))]); } catch (_) {}
  try { Object.keys(localStorage).filter(k => /^sb-.*-auth-token/.test(k) || k === 'acl-sig').forEach(k => localStorage.removeItem(k)); } catch (_) {}
  try { await caches.delete('acl-img'); } catch (_) {} // photos du compte effacées du téléphone (appareil partagé)
  location.hash = '#/'; location.reload();
}
// Mot de passe oublié : lien par e-mail si possible, sinon mot de passe provisoire donné par ADRESS
function motDePasseOublie(email0) {
  const f = app.querySelector('#f');
  f.innerHTML = `<h3 style="margin-top:0">Mot de passe oublié</h3>
    <p class="muted small">Indiquez l'e-mail de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe.</p>
    <label for="em2">E-mail</label><input id="em2" type="email" autocomplete="email" value="${esc(email0 || '')}">
    <p class="err" id="er2" hidden></p><div id="ok2" hidden></div>
    <button class="btn block" style="margin-top:14px" id="go2" type="button">Recevoir le lien</button>
    <div class="aide-mdp"><b>Pas d'e-mail reçu ?</b> Contactez ADRESS IMMOBILIER : un administrateur vous donne un <b>mot de passe provisoire</b> en quelques secondes, à changer ensuite dans Mon compte.</div>
    <p class="center small" style="margin:12px 0 0"><a href="#" id="ret">‹ Retour à la connexion</a></p>`;
  f.querySelector('#ret').onclick = (e) => { e.preventDefault(); connexion(); };
  f.querySelector('#go2').onclick = async () => {
    const em = f.querySelector('#em2').value.trim(), er = f.querySelector('#er2'), b = f.querySelector('#go2');
    er.hidden = true; if (!/^\S+@\S+\.\S+$/.test(em)) { er.textContent = 'Indiquez une adresse e-mail valide.'; er.hidden = false; return; }
    b.disabled = true; b.textContent = 'Envoi…';
    const { error } = await sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + location.pathname });
    b.hidden = true; const ok = f.querySelector('#ok2'); ok.hidden = false;
    ok.innerHTML = error ? `<p class="err">L'e-mail n'a pas pu être envoyé pour le moment. Demandez un mot de passe provisoire à ADRESS IMMOBILIER (voir ci-dessous).</p>`
      : `<div class="inv-ok" style="text-align:left"><b style="font-size:16px;letter-spacing:0;margin:0 0 6px">E-mail envoyé ✓</b>Si un compte existe pour ${esc(em)}, vous allez recevoir un lien. Ouvrez-le sur ce téléphone pour choisir un nouveau mot de passe. Pensez à regarder dans les courriers indésirables.</div>`;
  };
}
function nouveauMdp() {
  app.innerHTML = `<div class="login"><div class="login-brand"><h1>ADRESS <span>CLUB</span></h1><p>Choisissez votre nouveau mot de passe</p></div>
    <form id="fn" class="card" novalidate><label for="n1">Nouveau mot de passe</label><input id="n1" type="password" autocomplete="new-password" minlength="8">
    <label for="n2">Confirmer le mot de passe</label><input id="n2" type="password" autocomplete="new-password" minlength="8">
    <p class="hint">8 caractères minimum.</p><p class="err" id="ern" hidden></p>
    <button class="btn block" style="margin-top:14px" id="gon">Enregistrer et continuer</button></form></div>`;
  const $ = (s) => app.querySelector(s);
  $('#fn').onsubmit = async (e) => {
    e.preventDefault(); const er = $('#ern'), a = $('#n1').value, b = $('#n2').value; er.hidden = true;
    if (a.length < 8) { er.textContent = '8 caractères minimum.'; er.hidden = false; return; }
    if (a !== b) { er.textContent = 'Les deux mots de passe ne sont pas identiques.'; er.hidden = false; return; }
    $('#gon').disabled = true;
    const { error } = await sb.auth.updateUser({ password: a });
    if (error) { er.textContent = errMsg(error); er.hidden = false; $('#gon').disabled = false; return; }
    state.recup = false; toast('Mot de passe enregistré.'); await chargerProfil(); location.hash = '#/'; router();
  };
}
// Android hors Chrome (Firefox, Brave, Opera, Samsung…) : l'installation en 1 clic n'existe que dans Chrome → bouton pour y ouvrir l'appli
const lienChrome = () => 'intent://' + location.host + location.pathname + '?inst=1#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent('https://play.google.com/store/apps/details?id=com.android.chrome') + ';end';
export async function installer(auto) {
  auto = auto === true;
  if (!auto && !window._installPrompt && !estIOS()) await new Promise(r => { let n = 0; const t = setInterval(() => { if (window._installPrompt || ++n > 30) { clearInterval(t); r(); } }, 100); });
  if (window._installPrompt && !auto) {
    window._installPrompt.prompt();
    const r = await window._installPrompt.userChoice.catch(() => null);
    if (r && r.outcome === 'accepted') { window._installPrompt = null; toast('ADRESS CLUB est installée sur votre téléphone.'); document.querySelectorAll('.install-card').forEach(x => x.remove()); }
    return;
  }
  const ua = navigator.userAgent, mobile = estIOS() || /android|mobile/i.test(ua);
  let etapes;
  if (!mobile) etapes = `<p>L’installation se fait sur votre <b>téléphone</b>. Ouvrez ce lien sur votre téléphone :</p><p class="inst-url"><b>${esc(location.origin + location.pathname)}</b></p><p>puis touchez « Installer sur mon téléphone ».</p>`;
  else if (estIOS()) etapes = `<ol><li>Touchez le bouton <b>Partager</b> <span class="ico-share">⬆︎</span> (en bas de l’écran sur iPhone).</li><li>Faites défiler et choisissez <b>« Sur l’écran d’accueil »</b>.</li><li>Touchez <b>Ajouter</b>.</li></ol><p class="muted small">Sur iPhone, l’ajout se fait depuis Safari.</p>`;
  else if (/SamsungBrowser/i.test(ua)) etapes = `<ol><li>Touchez le menu <b>☰</b> en bas à droite de l’écran.</li><li>Choisissez <b>« Ajouter la page à »</b>.</li><li>Puis <b>« Écran d’accueil »</b> et confirmez <b>Ajouter</b>.</li></ol>`;
  else etapes = `<ol><li>Touchez le menu du navigateur <b>⋮</b> (en haut ou en bas de l’écran).</li><li>Choisissez <b>« Installer l’application »</b> ou <b>« Ajouter à l’écran d’accueil »</b>.</li><li>Confirmez avec <b>Installer</b> ou <b>Ajouter</b>.</li></ol>`;
  const d = document.createElement('div'); d.className = 'sheet-bg';
  const osv = estIOS() ? 'ios' : 'android';
  d.innerHTML = `<div class="sheet" role="dialog" aria-label="Installer l'application"><img src="icon-192.png" alt="" width="56" height="56"><h3>Installer ADRESS CLUB sur votre téléphone</h3>
    <div class="tuto-box" data-os="${osv}">${videoTuto(osv)}<a href="#" class="tuto-sw small">Voir la vidéo ${osv === 'ios' ? 'Android' : 'iPhone'}</a></div>
    <button class="btn block inst1" type="button" id="inst1" hidden>📲 Installer en 1 clic</button>
    ${mobile && !estIOS() && !window._installPrompt ? `<a class="btn block inst1" id="instChrome" href="${lienChrome()}">📲 Installer en 1 clic avec Chrome</a><p class="muted small center" style="margin-top:-4px">Votre navigateur ne permet pas l’installation directe : ce bouton ouvre ADRESS CLUB dans Chrome, où il suffit de toucher « Installer ». Ou suivez les étapes ci-dessous.</p>` : ''}
    ${etapes}
    ${mobile ? '<p class="muted small">L’icône ADRESS CLUB apparaîtra sur l’écran d’accueil de votre téléphone, comme une application.</p>' : ''}
    <button class="btn block" type="button">J'ai compris</button></div>`;
  d.onclick = (e) => { if (e.target === d || (e.target.tagName === 'BUTTON' && e.target.id !== 'inst1')) d.remove(); };
  // Si le navigateur autorise l'installation directe pendant que la fenêtre est ouverte, le bouton « 1 clic » apparaît
  const b1 = d.querySelector('#inst1');
  const veille = setInterval(() => { if (!d.isConnected) return clearInterval(veille); if (window._installPrompt) { b1.hidden = false; const c = d.querySelector('#instChrome'); if (c) { c.nextElementSibling?.remove(); c.remove(); } clearInterval(veille); } }, 500);
  b1.onclick = async () => { const p = window._installPrompt; if (!p) return; p.prompt(); const r = await p.userChoice.catch(() => null); window._installPrompt = null; if (r && r.outcome === 'accepted') { d.remove(); toast('ADRESS CLUB est installée sur votre téléphone.'); fete(); document.querySelectorAll('.install-card').forEach(x => x.remove()); } else b1.hidden = true; };
  d.querySelector('.tuto-sw').onclick = (e) => { e.preventDefault(); const b = d.querySelector('.tuto-box'), o = b.dataset.os === 'ios' ? 'android' : 'ios'; b.dataset.os = o; b.querySelector('video').outerHTML = videoTuto(o, true); e.target.textContent = 'Voir la vidéo ' + (o === 'ios' ? 'Android' : 'iPhone'); };
  document.body.appendChild(d);
}
// ---------- Notifications sur l'écran du téléphone (push) ----------
const PUSH_FN = SUPABASE_URL + '/functions/v1/push';
const pushOk = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const b64u = (s) => { const r = atob((s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); };
export async function activerPush(demander) {
  try {
    if (!pushOk() || !state.session || Notification.permission === 'denied') return false;
    if (Notification.permission !== 'granted') { if (!demander || await Notification.requestPermission() !== 'granted') return false; }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) { const { publicKey } = await (await fetch(PUSH_FN)).json(); sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(publicKey) }); }
    const j = sub.toJSON(); const { error } = await sb.rpc('enregistrer_push', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
    return !error;
  } catch (_) { return false; }
}
function carteNotif() {
  if (!pushOk() || Notification.permission !== 'default' || carteInstall()) return '';
  let plusTard = 0; try { plusTard = +localStorage.getItem('acl-push-later') || 0; } catch (_) {}
  if (Date.now() - plusTard < 5 * 864e5) return '';
  return '<div class="card install-card push-card"><span class="pc-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg></span><div><b>Soyez prévenu sur votre téléphone</b><small>Nouvelle demande sur vos annonces, réponse d’un vendeur… même appli fermée.</small></div><div class="ic-act"><button class="btn sm" type="button" data-push>Activer</button><button class="btn sm ghost" type="button" data-push-later>Plus tard</button></div></div>';
}
function brancherNotif(root) {
  root.querySelectorAll('[data-push]').forEach(b => b.onclick = async () => { b.disabled = true; const ok = await activerPush(true); b.closest('.push-card').remove(); toast(ok ? 'C’est activé : vous serez prévenu sur votre téléphone.' : 'Notifications refusées. Vous pourrez les activer dans Mon compte.'); });
  root.querySelectorAll('[data-push-later]').forEach(b => b.onclick = () => { try { localStorage.setItem('acl-push-later', String(Date.now())); } catch (_) {} b.closest('.push-card').remove(); });
}
function carteInstall() {
  if (estInstallee()) return '';
  const tel = estIOS() || /android|mobile/i.test(navigator.userAgent);
  let plusTard = 0; try { plusTard = +localStorage.getItem('acl-install-later') || 0; } catch (_) {}
  if (Date.now() - plusTard < 7 * 864e5) return '';
  return `<div class="card install-card"><img src="icon-192.png" alt="" width="44" height="44"><div><b>Installez ADRESS CLUB${tel ? '' : ' sur votre téléphone'}</b><small>${tel ? 'Retrouvez l’application sur l’écran d’accueil de votre téléphone.' : 'Vous êtes sur un ordinateur : le bouton vous donne le lien à ouvrir sur votre téléphone.'}</small></div><div class="ic-act"><button class="btn sm" type="button" data-inst>Installer</button><button class="btn sm ghost" type="button" data-later>Plus tard</button></div></div>`;
}
function brancherInstall(root) {
  root.querySelectorAll('[data-inst]').forEach(b => b.onclick = installer);
  root.querySelectorAll('[data-later]').forEach(b => b.onclick = () => { try { localStorage.setItem('acl-install-later', String(Date.now())); } catch (_) {} b.closest('.install-card').remove(); });
}

// ---------- découverte : film de présentation, visite guidée, lecteur vidéo plein écran ----------
const FILM = { src: 'videos/film-adress-club.mp4?v=2', poster: 'videos/film-adress-club.jpg?v=2', duree: '40 s' };
export function lecteurVideo(src, { poster = '', titre = 'Vidéo' } = {}) {
  const d = document.createElement('div'); d.className = 'lv'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', titre);
  d.innerHTML = `<div class="lv-box"><video controls playsinline autoplay preload="auto" ${poster ? `poster="${esc(poster)}"` : ''} src="${esc(src)}"></video>
    <div class="lv-bar"><b>${esc(titre)}</b><button type="button" class="lv-x" aria-label="Fermer la vidéo">✕</button></div></div>`;
  document.body.appendChild(d); document.body.classList.add('dlg-on');
  const v = d.querySelector('video'), prev = document.activeElement;
  const fermer = () => { try { v.pause(); } catch (_) {} d.classList.add('out'); document.body.classList.remove('dlg-on'); removeEventListener('keydown', clav, true); setTimeout(() => d.remove(), 300); prev?.focus?.({ preventScroll: true }); };
  const clav = (e) => { if (e.key === 'Escape') { e.preventDefault(); fermer(); } };
  d.querySelector('.lv-x').onclick = fermer; d.onclick = (e) => { if (e.target === d) fermer(); };
  addEventListener('keydown', clav, true); requestAnimationFrame(() => d.classList.add('in')); d.querySelector('.lv-x').focus({ preventScroll: true });
  v.play?.().catch(() => {});
}
const visiteFaite = () => { try { const v = localStorage.getItem('acl-visite') || ''; return v === 'faite' || v === 'passee' || (v.startsWith('tard:') && Date.now() - Number(v.slice(5)) < 3 * 864e5); } catch (_) { return true; } };
export const visite = async () => { if (location.hash && !/^#\/?$/.test(location.hash)) { location.hash = '#/'; await new Promise(r => setTimeout(r, 700)); } (await import('./visite.js')).lancerVisite({ fin: () => app.querySelectorAll('.decouvre').forEach(x => x.remove()) }); };
// Le film n'est proposé que s'il est bien en ligne (vérifié une fois par session)
let filmOk = null;
const filmDispo = () => filmOk ??= (() => { try { const v = sessionStorage.getItem('acl-film'); if (v) return Promise.resolve(v === '1'); } catch (_) {}
  return fetch(FILM.src, { method: 'HEAD', cache: 'no-store' }).then(r => r.ok, () => false).then(ok => { try { sessionStorage.setItem('acl-film', ok ? '1' : '0'); } catch (_) {} return ok; }); })();
const voirFilm = () => { track('film_presentation'); lecteurVideo(FILM.src, { poster: FILM.poster, titre: 'ADRESS CLUB en ' + FILM.duree }); };
function carteDecouverte() {
  if (visiteFaite()) return '';
  return `<div class="card decouvre"><div class="dc-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg></div>
    <div class="dc-t"><b>Nouveau sur ADRESS CLUB ?</b><small>Découvrez l’essentiel en 4 étapes, en 30 secondes.</small></div>
    <div class="dc-b"><button type="button" class="btn sm" data-visite>Visite guidée</button><button type="button" class="btn sm soft" data-film hidden>▶ Le film</button><button type="button" class="lnk small" data-tard>Plus tard</button></div></div>`;
}
function brancherDecouverte(root) {
  root.querySelectorAll('[data-visite]').forEach(b => b.onclick = () => { track('visite_guidee'); visite(); });
  root.querySelectorAll('[data-film]').forEach(b => { b.onclick = voirFilm; filmDispo().then(ok => { b.hidden = !ok; }); });
  root.querySelectorAll('[data-tard]').forEach(b => b.onclick = () => { try { localStorage.setItem('acl-visite', 'tard:' + Date.now()); } catch (_) {} const c = b.closest('.decouvre'); c.classList.add('out'); setTimeout(() => c.remove(), 280); });
}
async function accueil() {
  // compteurs, dernières annonces et résidences chargés en même temps
  const [, { data: recents }, { data: rr }] = await Promise.all([
    majCompteurs(),
    sb.from('v_market').select('id,titre,type,prix_fcfa,photos,statut').order('date_publication', { ascending: false }).limit(8),
    sb.from('residences').select('nom,photo_path,photos,type_bien').eq('visible', true).order('ordre')]);
  const nl = state.compteurs.demandes_non_lues || 0;
  const urls = await photosUrls((recents || []).map(a => a.photos[0]), true);
  const res = state.profil.residence || {};
  // photos d'arrière-plan : d'abord la résidence du locataire, puis les autres résidences ADRESS
  const pics = []; const ajout = (r) => [r.photo_path, ...(r.photos || [])].forEach(p => { if (p && !/test/i.test(p) && !pics.includes(p)) pics.push(p); });
  (rr || []).filter(r => r.nom === res.nom).forEach(ajout); if (!pics.length && res.photo_path) pics.push(res.photo_path); (rr || []).forEach(ajout);
  const ph = pics[0];
  const lien = (h, ico, t, s) => '<a href="' + h + '">' + ico + '<span><b>' + t + '</b><small>' + s + '</small></span>' + ICO.chev + '</a>';
  app.innerHTML = '<div class="home">'
    + '<section class="hero' + (ph ? ' has-ph' : '') + '">' + (ph ? '<div class="bgz bgs">' + pics.slice(0, 12).map((p, i) => '<img alt="" referrerpolicy="no-referrer" ' + (i ? 'data-src' : 'class="on" src') + '="' + esc(publicUrl(p)) + '">').join('') + '</div>' : '')
    + '<p>' + esc(res.nom || 'ADRESS IMMOBILIER') + '</p><h1>' + salut() + ' ' + esc(state.profil.nom_affichage || '') + '</h1></section>'
    + (nl ? '<a class="notice" href="#/mes-annonces"><b>' + nl + '</b>' + (nl > 1 ? 'nouvelles demandes' : 'nouvelle demande') + ' sur vos annonces</a>' : '')
    + '<section><div class="sec-h"><h2>Le Market</h2>' + ((recents || []).length > 2 ? '<span class="sn"><button type="button" class="sn-b" data-sn="-1" aria-label="Annonces précédentes"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><button type="button" class="sn-b" data-sn="1" aria-label="Annonces suivantes"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></span>' : '') + '<a href="#/market">Tout voir</a></div>'
    + ((recents || []).length ? '<div class="strip defile">' + recents.map((a, i) => '<a class="mini" href="#/annonce/' + a.id + '"><div class="ph" style="background-image:url(\'' + esc(urls[i]) + '\')"></div><div class="t">' + esc(a.titre) + '</div><div class="p">' + prix(a) + '</div></a>').join('') + '</div>'
      : '<div class="card muted">Aucune annonce pour le moment. <a href="#/publier">Publier la première</a></div>')
    + '</section>' + carteDecouverte() + carteInstall() + carteNotif() + '<section><h2>ADRESS IMMOBILIER</h2><nav class="menu">'
    + lien('#/residences', ICO.residences, (rr || []).some(estVillas) ? 'Nos résidences et villas' : 'Nos résidences', 'Photos et contact')
    + lien('#/flip-immo', ICO.flip, 'Le Flip Immo', 'Le magazine ADRESS')
    + lien('#/nouveautes', ICO.news, 'Les nouveautés', 'Programmes et actualités')
    + '</nav><a class="feature" href="#/bonnes-adresses"><span><b>Les bons plans</b><small>La sélection ADRESS pour vivre Abidjan</small></span>' + ICO.arrow + '</a>'
    + (state.profil.is_admin ? '<a class="btn ghost block" style="margin-top:12px" href="#/admin">Espace ADRESS · gestion</a>' : '')
    + '<p class="center small" style="margin-top:18px"><a class="muted" href="#/avis">Donner mon avis</a></p></section></div>';
  brancherInstall(app); brancherNotif(app); brancherDecouverte(app);
  fondDefilant(app.querySelector('.hero .bgs'));
  defiler(app.querySelector('.strip.defile'), app.querySelectorAll('[data-sn]'));
}
// Accueil selon l'heure : « Bonjour » le jour, « Bonsoir » à partir de 18 h
const salut = () => { const h = new Date().getHours(); return h >= 18 || h < 4 ? 'Bonsoir' : 'Bonjour'; };
// Bande « Le Market » de l'accueil : défilement continu, fluide et doux (boucle sans fin) ;
// il ralentit puis s'arrête dès qu'on la touche ou la survole, et repart en douceur
function defiler(strip, fleches) {
  if (!strip) return;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pas = () => { const c = strip.children; return c[1] ? c[1].offsetLeft - c[0].offsetLeft : strip.clientWidth; };
  let repos = 0, survol = false, visible = true, lacher = () => {};
  const stop = (ms = 2500) => { repos = Math.max(repos, performance.now() + ms); };
  fleches.forEach(b => b.onclick = () => { lacher(); stop(4000); strip.scrollBy({ left: +b.dataset.sn * pas(), behavior: 'smooth' }); });
  if (reduit || strip.scrollWidth <= strip.clientWidth + 4) return;
  // une deuxième série d'annonces à la suite : la boucle ne se voit pas
  const n = strip.children.length;
  [...strip.children].forEach(el => { const c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; c.querySelector('.ph')?.classList.add('ld'); strip.appendChild(c); });
  strip.classList.add('auto');
  const tour = () => strip.children[n].offsetLeft - strip.children[0].offsetLeft;
  const VITESSE = innerWidth >= 960 ? 18 : 14; // pixels par seconde : très lent et régulier
  let v = 0, pos = strip.scrollLeft, avant = performance.now();
  // le doigt (ou la molette) reprend la main tout de suite ; la souris posée dessus freine en douceur
  const main = () => { v = 0; pos = strip.scrollLeft; stop(); }; lacher = () => { v = 0; };
  ['pointerdown', 'touchstart', 'wheel', 'focusin'].forEach(e => strip.addEventListener(e, main, { passive: true }));
  ['touchend', 'pointerup'].forEach(e => strip.addEventListener(e, () => stop(2500), { passive: true }));
  strip.addEventListener('scroll', () => { if (v < 0.5) pos = strip.scrollLeft; }, { passive: true });
  strip.addEventListener('mouseenter', () => { survol = true; }); strip.addEventListener('mouseleave', () => { survol = false; stop(800); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(strip);
  const image = (t) => {
    if (!strip.isConnected) return;
    const dt = Math.min(64, t - avant) / 1000; avant = t;
    const enMarche = visible && !document.hidden && !survol && t > repos;
    v += ((enMarche ? VITESSE : 0) - v) * Math.min(1, dt * 2.2); // accélère et freine en douceur
    if (!enMarche && v < 0.5) v = 0;
    else { const T = tour(); pos += v * dt; if (pos >= T) pos -= T; strip.scrollLeft = pos; }
    requestAnimationFrame(image);
  };
  requestAnimationFrame(image);
}
// Arrière-plan de l'accueil : photos des résidences en fondu très lent (une photo n'apparaît qu'une fois prête)
function fondDefilant(box) {
  const imgs = box ? [...box.querySelectorAll('img')] : [];
  if (imgs.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const charger = (im) => { if (!im.getAttribute('src')) im.src = im.dataset.src; return im.decode ? im.decode() : Promise.resolve(); };
  let k = 0; charger(imgs[1]).catch(() => {});
  const t = setInterval(async () => {
    if (!box.isConnected) return clearInterval(t);
    if (document.hidden) return;
    const n = (k + 1) % imgs.length, im = imgs[n];
    try { await charger(im); } catch (_) { imgs.splice(n, 1); if (imgs.length < 2) clearInterval(t); return; }
    if (!box.isConnected) return;
    imgs[k].classList.replace('on', 'off');
    im.classList.remove('off'); void im.offsetWidth; im.classList.add('on'); k = n;
    charger(imgs[(k + 1) % imgs.length]).catch(() => {});
  }, 6000);
}

// ---------- Le Market (§3, §4) ----------
const svgC = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICO_CAT = {
  Tout: svgC('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'),
  'Meubles': svgC('<path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M6 19v2M18 19v2"/>'),
  'Électroménager': svgC('<rect x="4.5" y="2.5" width="15" height="19" rx="2.5"/><circle cx="12" cy="13.5" r="4.5"/><path d="M8 6h.01M11 6h2"/>'),
  'Décoration': svgC('<path d="M9 3h6l3 8H6z"/><path d="M12 11v7M8 21h8"/>'),
  'Enfants et bébé': svgC('<circle cx="12" cy="13" r="7"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="6.5" r="2.5"/><path d="M9.5 15.5c1.5 1.2 3.5 1.2 5 0M10 11.5h.01M14 11.5h.01"/>'),
  'Vêtements et accessoires': svgC('<path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3a4 4 0 0 1-8 0z"/>'),
  'Électronique': svgC('<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>'),
  'Sport et loisirs': svgC('<circle cx="12" cy="12" r="9"/><path d="M12 3a14 14 0 0 1 0 18M3 12h18M5.6 5.6c3.6 2.4 9.2 2.4 12.8 0M5.6 18.4c3.6-2.4 9.2-2.4 12.8 0"/>'),
  'Maison et jardin': svgC('<path d="M12 21v-8M12 13c0-4 3-7 7-7 0 4-3 7-7 7zM12 15c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5zM7 21h10"/>'),
  'Autre': svgC('<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>') };
async function market() {
  const p = qs(); const type = p.get('type') || ''; const q = (p.get('q') || '').trim(); const vue = p.get('vue') || '', cat = p.get('cat') || '';
  let req = sb.from(vue === 'favoris' ? 'v_favoris' : 'v_market').select('*').order('date_publication', { ascending: false }).limit(80);
  if (type) req = req.eq('type', type);
  const [{ data, error }, fav] = await Promise.all([req, sb.from('favoris').select('annonce_id')]);
  if (error) throw error;
  const favs = new Set((fav.data || []).map(f => f.annonce_id));
  const urls = await photosUrls((data || []).map(a => a.photos[0]), true);
  const lien = (o) => '#/market?' + new URLSearchParams(Object.fromEntries(Object.entries({ type, q, vue, cat, ...o }).filter(([, v]) => v))).toString();
  // rayons par catégorie (vue par défaut) ; une catégorie choisie, une recherche ou les favoris passent en grille
  const urlDe = new Map((data || []).map((a, i) => [a.id, urls[i]]));
  const parCat = CATEGORIES.map(c => [c, data.filter(a => a.categorie === c)]).filter(([, l]) => l.length);
  const liste = cat ? data.filter(a => a.categorie === cat) : data, rayons = !q && !cat && vue !== 'favoris' && parCat.length > 1;
  const carte = (a) => `
    <div class="card item${a.statut === 'reserve' ? ' is-res' : ''}">
      <a href="#/annonce/${a.id}" style="text-decoration:none"><div class="ph" style="background-image:url('${esc(urlDe.get(a.id))}')" role="img" aria-label="${esc(a.titre)}">${a.statut === 'reserve' ? '<span class="stamp">Réservé</span>' : ''}</div>
      ${a.est_a_moi ? '<span class="badge st">Votre annonce</span>' : a.type === 'don' ? '<span class="badge st">À donner</span>' : ''}
      <div class="bd"><div class="t">${esc(a.titre)}</div><div class="p">${prix(a)}</div><div class="muted small">${esc([a.categorie, a.residence || (a.is_adress ? 'ADRESS IMMOBILIER' : '')].filter(Boolean).join(' · '))}</div></div></a>
      ${a.est_a_moi ? '' : `<button class="fav" data-fav="${a.id}" aria-label="${favs.has(a.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${favs.has(a.id) ? '♥' : '♡'}</button>`}
    </div>`;
  app.innerHTML = `
  <a class="back" href="#/">‹ Accueil</a><h1>Le Market</h1><p class="muted">Les objets à vendre ou à donner entre résidents</p>
  <form id="s" role="search" style="margin-top:10px"><label class="sr" for="q">Rechercher</label><input id="q" type="search" placeholder="Rechercher un objet…" value="${esc(q)}"></form>
  <div class="chips">
    <a class="chip ${!type && !vue ? 'on' : ''}" href="${lien({ type: '', vue: '' })}">Tout</a>
    <a class="chip ${type === 'vente' ? 'on' : ''}" href="${lien({ type: 'vente', vue: '' })}">À vendre</a>
    <a class="chip ${type === 'don' ? 'on' : ''}" href="${lien({ type: 'don', vue: '' })}">À donner</a>
    <a class="chip ${vue === 'favoris' ? 'on' : ''}" href="${lien({ vue: 'favoris', type: '', cat: '' })}">♥ Favoris</a>
  </div>
  ${vue !== 'favoris' && parCat.length > 1 ? `<nav class="cat-bar" aria-label="Catégories"><a class="${!cat ? 'on' : ''}" href="${lien({ cat: '' })}" ${!cat ? 'aria-current="page"' : ''}>${ICO_CAT.Tout}<span>Tout</span></a>${parCat.map(([c, l]) => `<a class="${cat === c ? 'on' : ''}" href="${lien({ cat: c })}" ${cat === c ? 'aria-current="page"' : ''}>${ICO_CAT[c] || ICO_CAT.Autre}<span>${esc(c)}</span><em>${l.length}</em></a>`).join('')}</nav>` : ''}
  ${cat && liste.length ? `<div class="cat-h"><span class="rayon-i">${ICO_CAT[cat] || ICO_CAT.Autre}</span><h2>${esc(cat)}</h2><span class="rayon-n">${liste.length} annonce${liste.length > 1 ? 's' : ''}</span></div>` : ''}
  ${rayons ? `<div class="rayons">${parCat.map(([c, l]) => `<section class="rayon"><div class="rayon-h"><span class="rayon-i">${ICO_CAT[c] || ICO_CAT.Autre}</span><h2>${esc(c)}</h2><span class="rayon-n">${l.length}</span><a href="${lien({ cat: c })}">Tout voir</a></div><div class="rail">${l.map(carte).join('')}</div></section>`).join('')}</div>` : ''}
  ${liste.length ? `<div class="grid2 grid3" ${rayons ? 'hidden' : ''}>${liste.map(carte).join('')}</div>`
  : vue === 'favoris'
    ? `<div class="card center pad empty-fav"><div class="ef-heart">♡</div><b>Aucun favori pour le moment</b><p class="muted">Touchez le cœur ♡ sur une annonce d’un autre résident pour la retrouver ici.<br>Vos propres annonces n’ont pas de cœur : elles sont dans « Mes annonces ».</p><a class="btn" href="#/market">Parcourir le Market</a></div>`
    : `<div class="card center pad">${q ? 'Aucune annonce ne correspond à « ' + esc(q) + ' ».' : 'Aucune annonce pour le moment.'}<br><br><a class="btn" href="#/publier">+ Publier</a></div>`}`;
  app.querySelector('#s').onsubmit = (e) => e.preventDefault();
  const qi = app.querySelector('#q'), grille = app.querySelector('.grid2');
  if (grille) { const vide = document.createElement('p'); vide.className = 'muted center no-res'; vide.hidden = true; grille.after(vide);
    filtreLive(qi, () => grille.querySelectorAll('.item'), vide);
    // recherche depuis les rayons : on passe en grille le temps de la recherche
    const ry = app.querySelector('.rayons'); if (ry) qi.addEventListener('input', () => { const r = !!qi.value.trim(); ry.hidden = r; grille.hidden = !r; });
    qi.addEventListener('input', () => { try { history.replaceState(null, '', lien({ q: qi.value.trim() })); } catch (_) {} }); }
  app.querySelectorAll('[data-fav]').forEach(b => b.onclick = async () => {
    const id = b.dataset.fav, on = b.textContent === '♥';
    const r = on ? await sb.from('favoris').delete().eq('annonce_id', id) : await sb.from('favoris').insert({ user_id: state.session.user.id, annonce_id: id });
    if (r.error) return toast(errMsg(r.error));
    app.querySelectorAll(`[data-fav="${id}"]`).forEach(x => { x.textContent = on ? '♡' : '♥'; x.setAttribute('aria-label', on ? 'Ajouter aux favoris' : 'Retirer des favoris'); }); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
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
  <div class="detail"><div class="detail-media"><div class="gal" tabindex="0" aria-label="Photos de l’annonce">${urls.map(u => `<img src="${esc(u)}" alt="${esc(a.titre)}">`).join('')}</div>
  ${urls.length > 1 ? `<p class="muted small">${urls.length} photos : utilisez les flèches ou faites glisser</p>` : ''}</div><div class="detail-info">
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
  // Le vendeur doit pouvoir joindre l'intéressé : sans numéro partagé, on le demande avant d'envoyer
  const contactOk = () => state.profil.consentement_contact && (state.profil.telephone || '').replace(/[^0-9]/g, '').length >= 8;
  const demanderNumero = () => new Promise(ok => {
    const z = app.querySelector('#zoo');
    z.innerHTML = `<form class="card ask-tel" novalidate><b>Comment le vendeur peut-il vous joindre ?</b>
      <p class="muted small">Votre numéro est transmis uniquement au vendeur de cet objet, pour qu'il vous contacte.</p>
      <label for="t2">Votre téléphone (WhatsApp de préférence)</label><input id="t2" type="tel" inputmode="tel" autocomplete="tel" placeholder="+225 07 00 00 00 00" value="${esc(state.profil.telephone || '')}">
      <label class="check"><input id="c2" type="checkbox" checked> J'accepte que mon numéro soit communiqué aux vendeurs des objets qui m'intéressent.</label>
      <p class="err" id="e2" hidden></p>
      <div class="row"><button class="btn" type="submit">Envoyer ma demande</button><button class="btn ghost" type="button" id="x2">Annuler</button></div></form>`;
    z.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => z.querySelector('#t2').focus(), 300);
    const err = (m) => { const e = z.querySelector('#e2'); e.textContent = m; e.hidden = !m; };
    z.querySelector('#x2').onclick = () => { z.innerHTML = ''; ok(false); };
    z.querySelector('form').onsubmit = async (e) => {
      e.preventDefault(); const t = z.querySelector('#t2').value.trim();
      if (t.replace(/[^0-9]/g, '').length < 8) return err('Indiquez un numéro de téléphone valide.');
      if (!z.querySelector('#c2').checked) return err('Cochez la case pour que le vendeur puisse vous contacter.');
      const p = state.profil;
      const { error } = await sb.rpc('maj_preferences', { p_nom_affichage: p.nom_affichage, p_telephone: t, p_consentement: true, p_notif_quotidienne: p.notif_quotidienne, p_notif_interet: p.notif_interet });
      if (error) return err(errMsg(error));
      p.telephone = t; p.consentement_contact = true; z.innerHTML = ''; ok(true);
    };
  });
  if (b && !dejaDemande) b.onclick = async () => {
    if (!contactOk() && !(await demanderNumero())) return;
    b.disabled = true; b.textContent = 'Envoi…';
    const { data: rang, error } = await sb.rpc('je_suis_interesse', { p_annonce: a.id });
    if (error) { b.disabled = false; b.textContent = 'Ça m’intéresse, ça m’enjaille !'; return toast(errMsg(error)); }
    b.textContent = 'C’est zooo ! Demande envoyée ✓';
    const tel = state.profil.consentement_contact && state.profil.telephone;
    app.querySelector('#zoo').innerHTML = `<div class="zoo"><b>C’est zooo ! 🎉</b><p>Le vendeur a reçu votre demande n° ${rang}. ${tel ? `Il vous contactera au <b>${esc(state.profil.telephone)}</b>.` : 'Pour qu’il puisse vous joindre, <a href="#/profil">ajoutez votre numéro dans Mon compte</a> et autorisez son partage.'}</p><p class="muted">Suivez-la dans <a href="#/mes-annonces?o=envoyees">Mes annonces › Mes demandes envoyées</a> : vous verrez quand le vendeur l’a vue et quand il vous contacte. Une notification vous prévient aussi.</p></div>`;
    try { navigator.vibrate && navigator.vibrate([12, 40, 18]); } catch (_) {}
    fete();
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
  <div class="drops"><label class="drop" for="phc">${ICO.camera}Prendre une photo<small>Avec l’appareil photo</small></label><label class="drop" for="ph"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/></svg>Choisir dans la galerie<small>Jusqu’à ${max} photos au total</small></label></div>
  <input id="phc" type="file" accept="image/*" capture="environment" class="sr"><input id="ph" type="file" accept="image/*" multiple class="sr">
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
  $('#phc').onchange = $('#ph').onchange;
  $('#f').onsubmit = async (ev) => {
    ev.preventDefault(); err('');
    const titre = $('#ti').value.trim(), px = a.type === 'vente' ? parseInt($('#px').value, 10) : null;
    if (!gardees.length && !files.length) return err('Gardez ou ajoutez au moins une photo.');
    if (titre.length < 2) return err('Le titre est obligatoire.');
    if (a.type === 'vente' && !(px > 0)) return err('Le prix est obligatoire pour une vente.');
    const go = $('#go'); go.disabled = true; go.textContent = files.length ? 'Envoi des photos…' : 'Enregistrement…';
    try {
      const uid = state.session.user.id, paths = [...gardees];
      for (const f of files) paths.push(await envoyerPhoto(uid, f));
      const { error } = await sb.rpc('modifier_annonce', { p_id: a.id, p_titre: titre, p_categorie: $('#ca').value, p_etat: $('#et').value, p_description: $('#de').value.trim(), p_prix: px, p_photos: paths });
      if (error) throw (/schema cache|could not find/i.test(error.message) ? new Error('La modification sera disponible très bientôt (mise à jour du serveur en cours).') : error);
      a.photos.filter(p => !paths.includes(p)).forEach(p => { signedCache.delete(p); signedCache.delete(vignette(p)); }); sauverSig();
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
  <div class="drops"><label class="drop" for="phc">${ICO.camera}Prendre une photo<small>Avec l’appareil photo</small></label><label class="drop" for="ph"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/></svg>Choisir dans la galerie<small>Jusqu’à ${max} photos</small></label></div>
  <input id="phc" type="file" accept="image/*" capture="environment" class="sr"><input id="ph" type="file" accept="image/*" multiple class="sr">
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
  $('#phc').onchange = $('#ph').onchange;
  $('#f').onsubmit = async (ev) => {
    ev.preventDefault(); err('');
    const titre = $('#ti').value.trim(), categorie = $('#ca').value, etat = $('#et').value, description = $('#de').value.trim(), px = parseInt($('#px').value, 10);
    if (!files.length) return err('Ajoutez au moins une photo.');
    if (titre.length < 2 || !categorie) return err('Le titre et la catégorie sont obligatoires.');
    if (type === 'vente' && !(px > 0)) return err('Le prix est obligatoire pour une vente.');
    const go = $('#go'); go.disabled = true; go.textContent = 'Envoi des photos…';
    try {
      const uid = state.session.user.id, paths = [];
      for (const f of files) paths.push(await envoyerPhoto(uid, f));
      go.textContent = 'Publication…';
      const { data, error } = await sb.from('annonces').insert({ type, titre, categorie, etat, description: description || null, prix_fcfa: type === 'vente' ? px : null, photos: paths }).select('id').single();
      if (error) throw error;
      toast('Votre annonce est en ligne.'); fete(); location.hash = `#/annonce/${data.id}`;
    } catch (e) { go.disabled = false; go.textContent = 'Publier'; err(errMsg(e)); }
  };
}

// ---------- Mes annonces et demandes (§4, §5) ----------
async function mesAnnonces() {
  // Trois onglets : « À traiter » (une chose à faire à la fois), « Mes annonces » (épurées), « Mes demandes » (suivi)
  const uid = state.session.user.id;
  const [{ data: mes, error }, { data: dem }, { data: env }] = await Promise.all([
    sb.from('annonces').select('*').eq('vendeur_id', uid).order('date_publication', { ascending: false }),
    sb.rpc('mes_demandes_recues'),
    sb.from('demandes').select('id, rang, created_at, statut, lue, annonce_id').eq('demandeur_id', uid).order('created_at', { ascending: false })]);
  if (error) throw error;
  const ouverte = (a) => ['disponible', 'reserve'].includes(a.statut) && !a.retiree_par_adress;
  const prol = state.params.duree_prolongation_jours || 30;
  const parAnnonce = (id) => (dem || []).filter(d => d.annonce_id === id).sort((x, y) => x.rang - y.rang);
  const urls = await photosUrls((mes || []).map(a => a.photos[0]), true);
  const photo = new Map((mes || []).map((a, i) => [a.id, urls[i] || '']));
  const J = 864e5, now = Date.now();
  const depuis = (d) => { const m = Math.round((now - new Date(d)) / 6e4); return m < 60 ? `il y a ${Math.max(1, m)} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`; };
  const fin = (a) => a.type === 'don' ? ['don_effectue', 'Don effectué'] : ['vendu', 'Vendu'];
  const wa = (d, a) => `https://wa.me/${intl(d.contact)}?text=${encodeURIComponent('Bonjour ' + (d.demandeur || '') + ', je vous contacte au sujet de votre demande pour « ' + a.titre + ' » sur ADRESS CLUB.')}`;

  // ---- ce qui demande une action, du plus urgent au moins urgent
  const taches = [];
  (mes || []).forEach(a => {
    if (a.retiree_par_adress) return;
    const ds = parAnnonce(a.id), att = ds.filter(d => d.statut !== 'contactee');
    if (a.statut === 'disponible' && att.length) taches.push({ k: 'contact', a, d: att.find(d => d.contact) || att[0], reste: att.length - 1, o: 0, t: +new Date(att[0].created_at) });
    else if (a.statut === 'reserve') taches.push({ k: 'conclure', a, o: 1, t: 0 });
    if (ouverte(a)) { const j = (new Date(a.date_expiration) - now) / J; if (j <= 7) taches.push({ k: 'expire', a, j: Math.max(0, Math.ceil(j)), o: 2, t: j }); }
    else if (a.statut === 'expire' && now - new Date(a.date_expiration) < 14 * J) taches.push({ k: 'expiree', a, o: 3, t: 0 });
  });
  taches.sort((x, y) => x.o - y.o || x.t - y.t);

  let onglet = qs().get('o');
  if (!['traiter', 'annonces', 'envoyees'].includes(onglet)) onglet = taches.length ? 'traiter' : 'annonces';
  const tabs = `<div class="seg" role="tablist">${[['traiter', 'À traiter'], ['annonces', 'Publiées'], ['envoyees', 'Mes demandes']].map(([k, l]) =>
    `<a role="tab" class="${onglet === k ? 'on' : ''}" href="#/mes-annonces?o=${k}">${l}${k === 'traiter' && taches.length ? `<b>${taches.length}</b>` : ''}</a>`).join('')}</div>`;
  const vignette = (a, stamp) => `<${ouverte(a) ? `a href="#/annonce/${a.id}"` : 'div'} class="ph vg" role="img" aria-label="${esc(a.titre)}" style="background-image:url('${esc(photo.get(a.id))}')">${stamp ? '<span class="stamp">Réservé</span>' : ''}</${ouverte(a) ? 'a' : 'div'}>`;

  let corps = '';
  if (onglet === 'traiter') {
    corps = taches.map(x => {
      const a = x.a, tete = (k) => `<div class="tk-top">${vignette(a, a.statut === 'reserve')}<div style="min-width:0"><div class="tk-k">${k}</div><b>${esc(a.titre)}</b></div></div>`;
      if (x.k === 'contact') { const d = x.d; return `<div class="card tache" data-id="${a.id}">${tete(d.lue ? 'À contacter' : 'Nouvel intéressé')}
        <p class="tk-msg"><b>${esc(d.demandeur || 'Un résident')}</b> attend votre appel <span class="muted">· demande n° ${d.rang}, ${depuis(d.created_at)}</span></p>
        ${d.contact ? `<div class="row tk-act"><a class="btn" data-ct="${d.id}" target="_blank" rel="noopener" href="${wa(d, a)}">WhatsApp</a><a class="btn ghost" data-ct="${d.id}" href="tel:+${intl(d.contact)}">Appeler</a></div>`
          : '<p class="muted small">Son numéro n’est pas encore partagé : il apparaîtra ici dès qu’il l’ajoutera.</p>'}
        ${x.reste ? `<p class="muted small tk-next">Ensuite : ${x.reste} autre${x.reste > 1 ? 's' : ''} intéressé${x.reste > 1 ? 's' : ''} en attente.</p>` : ''}</div>`; }
      if (x.k === 'conclure') { const [st, lb] = fin(a); return `<div class="card tache card-res" data-id="${a.id}">${tete('Réservée')}
        <p class="tk-msg">L’affaire s’est conclue ?</p>
        <div class="row tk-act"><button class="btn" data-act="${st}">Oui, ${lb.toLowerCase()}</button><button class="btn ghost" data-act="disponible">Non, remettre disponible</button></div></div>`; }
      if (x.k === 'expire') return `<div class="card tache" data-id="${a.id}">${tete(x.j ? `Expire dans ${x.j} jour${x.j > 1 ? 's' : ''}` : 'Expire aujourd’hui')}
        <p class="tk-msg">Toujours disponible ? Gardez-la en ligne.</p>
        <div class="row tk-act"><button class="btn" data-act="prolonger">Prolonger de ${prol} jours</button></div></div>`;
      return `<div class="card tache" data-id="${a.id}">${tete('Expirée')}
        <p class="tk-msg">Elle n’est plus visible sur le Market depuis le ${dateFr(a.date_expiration)}.</p>
        <div class="row tk-act"><button class="btn" data-act="prolonger">Remettre en ligne ${prol} jours</button></div></div>`;
    }).join('') || `<div class="card center pad tk-vide"><div class="tk-ok"></div><b>Tout est à jour</b><p class="muted">Aucune demande en attente. Vous serez prévenu dès qu’un résident s’intéresse à l’une de vos annonces.</p></div>`;
  } else if (onglet === 'annonces') {
    corps = (mes || []).map(a => {
      const ds = parAnnonce(a.id), att = ds.filter(d => d.statut !== 'contactee').length, res = a.statut === 'reserve' && !a.retiree_par_adress, [st, lb] = fin(a);
      const gerable = ouverte(a) || (a.statut === 'expire' && !a.retiree_par_adress);
      const resume = !ouverte(a) ? (a.retiree_par_adress ? 'Retirée par ADRESS' : `Terminée${a.date_cloture ? ' le ' + dateFr(a.date_cloture) : ''}`)
        : ds.length ? `${ds.length} intéressé${ds.length > 1 ? 's' : ''}${att ? ` · <a class="tk-lien" href="#/mes-annonces?o=traiter">${att} à contacter</a>` : ''}` : 'Pas encore d’intéressé';
      return `<div class="card ann${res ? ' card-res' : ''}${ouverte(a) ? '' : ' fermee'}" data-id="${a.id}">
        <div style="display:flex;gap:12px;align-items:center">${vignette(a, res)}
        <div style="min-width:0;flex:1"><b>${ouverte(a) ? `<a href="#/annonce/${a.id}">${esc(a.titre)}</a>` : esc(a.titre)}</b>
          <div class="muted small"><span class="pill ${a.retiree_par_adress ? 'off' : a.statut}">${a.retiree_par_adress ? 'Retirée' : STATUTS[a.statut]}</span> · ${prix(a)}</div>
          <div class="small an-res">${resume}</div></div></div>
        ${gerable ? `<details class="gerer"><summary>Gérer</summary><div class="gerer-in">
          ${ouverte(a) ? `<div class="row"><button class="btn sm" data-act="${st}">${lb}</button><button class="btn sm ghost" data-act="${res ? 'disponible' : 'reserve'}">${res ? 'Remettre disponible' : 'Réserver'}</button></div>
          <div class="row"><a class="btn sm soft" href="#/modifier/${a.id}">Modifier</a><button class="btn sm soft" data-act="prolonger">Prolonger de ${prol} j</button><button class="btn sm soft" data-act="retire">Retirer</button></div>`
          : `<div class="row"><button class="btn sm" data-act="prolonger">Remettre en ligne ${prol} jours</button></div>`}
          ${ouverte(a) ? `<p class="muted small" style="margin:8px 0 0">En ligne jusqu’au ${dateFr(a.date_expiration)}.${res ? ' Réservée : les nouvelles demandes sont suspendues.' : ''}</p>` : ''}
          ${ds.length ? `<div class="dem-list">${ds.map(d => `<div class="dem"><b>n° ${d.rang}</b> ${esc(d.demandeur)} ${d.statut === 'contactee' ? '<span class="badge ok">contacté</span>' : ''}<div class="muted small">${depuis(d.created_at)}</div>
            ${d.contact ? `<div class="row" style="margin-top:6px"><a class="btn sm soft" data-ct="${d.id}" target="_blank" rel="noopener" href="${wa(d, a)}">WhatsApp</a><a class="btn sm soft" data-ct="${d.id}" href="tel:+${intl(d.contact)}">Appeler</a></div>` : ''}</div>`).join('')}</div>` : ''}
        </div></details>` : ''}</div>`;
    }).join('') || '<div class="card center pad">Vous n\'avez encore publié aucune annonce.<br><br><a class="btn" href="#/publier">+ Publier</a></div>';
  } else {
    const ids = (env || []).map(d => d.annonce_id);
    const { data: ouvertes } = ids.length ? await sb.from('v_market').select('id,titre,statut').in('id', ids) : { data: [] };
    const m = new Map((ouvertes || []).map(o => [o.id, o]));
    const suivi = (d, o) => {
      const vue = d.lue || d.statut === 'contactee', ct = d.statut === 'contactee';
      const et = [['Envoyée', true], ['Vue par le vendeur', vue], ['Vous a contacté', ct]];
      const etat = !o ? '<div class="sv-etat off">Annonce terminée (vendue, donnée ou retirée)</div>'
        : o.statut === 'reserve' ? '<div class="sv-etat res">Réservée : le vendeur discute avec un intéressé. Votre demande reste valable si ça ne se fait pas.</div>'
        : ct ? '<div class="sv-etat ok">Le vendeur a ouvert WhatsApp ou vous a appelé : surveillez votre téléphone.</div>'
        : vue ? '<div class="sv-etat">Le vendeur a vu votre demande. Il contacte les intéressés dans l’ordre d’arrivée.</div>'
        : '<div class="sv-etat">Votre demande est bien arrivée. Le vendeur ne l’a pas encore ouverte.</div>';
      return `<ol class="suivi">${et.map(([l, f], k) => `<li class="${f ? 'fait' : ''}" style="--k:${k}"><i></i><span>${l}</span></li>`).join('')}</ol>${etat}`;
    };
    corps = (env || []).map(d => { const o = m.get(d.annonce_id); return `
      <div class="card"><b>${o ? `<a href="#/annonce/${d.annonce_id}">${esc(o.titre)}</a>` : 'Annonce terminée'}</b>
      <div class="muted small">Demande n° ${d.rang} du ${dateFr(d.created_at, true)}</div>${suivi(d, o)}</div>`; }).join('')
      || '<div class="card center pad">Vous n\'avez envoyé aucune demande.<br><br><a class="btn" href="#/market">Voir le Market</a></div>';
  }
  const aide = { traiter: taches.length ? 'Une chose à la fois : contactez les intéressés dans l’ordre d’arrivée.' : '', annonces: '', envoyees: 'Suivez les demandes que vous avez envoyées aux vendeurs.' };
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Mes annonces</h1>${tabs}${aide[onglet] ? `<p class="muted">${aide[onglet]}</p>` : ''}<div class="list" id="lst">${corps}</div>`;
  const n = app.querySelectorAll('#lst > .card[data-id]').length;
  if (onglet === 'annonces' && n > 5) { barreRecherche(app.querySelector('#lst'), () => app.querySelectorAll('#lst > .card[data-id]'), 'Rechercher dans mes annonces…'); const qs0 = app.querySelector('.live-search input'); if (qs0 && mesAnnonces._q) { qs0.value = mesAnnonces._q; qs0.dispatchEvent(new Event('input')); } if (qs0) qs0.addEventListener('input', () => mesAnnonces._q = qs0.value); }
  // demandes affichées = lues par le vendeur (le suivi de l'intéressé passe à « Vue par le vendeur »)
  const aLire = new Set(); if (onglet === 'traiter') taches.forEach(x => { if (x.k === 'contact' && parAnnonce(x.a.id).some(d => !d.lue)) aLire.add(x.a.id); });
  aLire.forEach(id => sb.rpc('marquer_demandes_lues', { p_annonce: id }).then(majCompteurs));
  app.querySelectorAll('details.gerer').forEach(dt => dt.addEventListener('toggle', () => { const id = dt.closest('[data-id]').dataset.id; if (dt.open && parAnnonce(id).some(d => !d.lue)) sb.rpc('marquer_demandes_lues', { p_annonce: id }).then(majCompteurs); }));
  // après un appel ou un message WhatsApp, au retour dans l'appli : la carte passe à l'intéressé suivant
  app.querySelectorAll('[data-ct]').forEach(l => l.addEventListener('click', () => {
    sb.rpc('marquer_contactee', { p_demande: l.dataset.ct }).then(() => {
      const h = location.hash, go = () => { if (document.visibilityState !== 'visible' || location.hash !== h) return; document.removeEventListener('visibilitychange', go); const y = scrollY; mesAnnonces().then(() => scrollTo(0, y)); };
      document.addEventListener('visibilitychange', go); setTimeout(go, 2500);
    });
  }));
  app.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
    const id = b.closest('[data-id]').dataset.id, act = b.dataset.act;
    if (['vendu', 'don_effectue', 'retire'].includes(act) && !confirm(act === 'retire' ? 'Retirer cette annonce du Market ?' : 'Confirmer ? L\'annonce sera immédiatement retirée du Market et archivée.')) return;
    b.disabled = true;
    const r = act === 'prolonger' ? await sb.rpc('prolonger_annonce', { p_id: id }) : await sb.rpc('changer_statut_annonce', { p_id: id, p_statut: act });
    if (r.error) { b.disabled = false; return toast(errMsg(r.error)); }
    if (act === 'vendu' || act === 'don_effectue') { location.hash = `#/avis?annonce=${id}`; return; }
    const titre = b.closest('[data-id]').querySelector('b').textContent.trim();
    const msg = { prolonger: `« ${titre} » est en ligne jusqu'au ${dateFr(r.data)}.`, reserve: `« ${titre} » est marquée réservée.`, disponible: `« ${titre} » est de nouveau disponible.`, retire: `« ${titre} » a été retirée du Market.` };
    toast(msg[act] || 'Annonce mise à jour.');
    const y = scrollY; await mesAnnonces(); scrollTo(0, y);
    const c = app.querySelector(`[data-id="${id}"]`);
    if (c) { const r2 = c.getBoundingClientRect(); if (r2.top < 70 || r2.bottom > innerHeight - 80) c.scrollIntoView({ block: 'center', behavior: 'smooth' }); c.classList.add('flash'); }
  });
}

// ---------- Contenus ADRESS (§7, §7 bis) ----------
// Les ensembles de villas ne sont jamais présentés comme des résidences
const estVillas = (r) => /villa/i.test(r?.type_bien || '') || /^VILLAS?\b/i.test(String(r?.nom || '').trim());
async function residences() {
  const { data } = await sb.from('residences').select('*').eq('visible', true).order('ordre');
  const imgs = (r) => [...new Set([r.photo_path, ...(r.photos || [])].filter(Boolean).map(publicUrl))];
  const V = (data || []).filter(estVillas), A = (data || []).filter(r => !estVillas(r));
  const carte = (r, k) => { const im = imgs(r); const vi = estVillas(r); return `<div class="card item res-card" style="--k:${k}">
    ${im.length ? `<div class="rs" data-imgs="${esc(JSON.stringify(im))}" role="img" aria-label="Photos de ${esc(r.nom)}">
      ${im.length > 1 ? `<div class="rs-bars">${im.map(() => '<i><b></b></i>').join('')}</div>` : ''}
      ${r.quartier ? `<span class="rs-loc">📍 ${esc(r.quartier)}</span>` : ''}${im.length > 1 ? `<span class="rs-n">1 / ${im.length}</span>` : ''}${r.video_path ? `<button type="button" class="rs-vid" data-vid="${r.id}" aria-label="Voir la vidéo de ${esc(r.nom)}"><span class="rs-play" aria-hidden="true"></span>Vidéo</button>` : ''}</div>` : ''}
    <div class="bd" style="padding:14px"><h3>${esc(r.nom)}</h3><div class="muted small">${esc([r.quartier, r.type_bien].filter(Boolean).join(' · '))}</div>
    ${r.description && !/^résidence adress immobilier\.?$/i.test(r.description.trim()) ? `<p>${esc(r.description)}</p>` : ''}${r.lien_decouvrir ? `<a class="btn sm" data-r="${r.id}" href="${esc(sur(r.lien_decouvrir))}" target="_blank" rel="noopener">${vi ? 'Découvrir les villas' : 'Découvrir la résidence'} ↗</a>` : ''}</div></div>`; };
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>${V.length ? 'Nos résidences et villas' : 'Nos résidences'}</h1>
  ${V.length && A.length ? '<h2 class="res-sec">Résidences</h2>' : ''}<div class="list" style="margin-top:12px">${A.map(carte).join('') || (V.length ? '' : '<div class="card center pad">Les résidences seront bientôt présentées ici.</div>')}</div>
  ${V.length ? `<h2 class="res-sec">Villas</h2><div class="list" style="margin-top:12px">${V.map((r, k) => carte(r, k + A.length)).join('')}</div>` : ''}`;
  (data || []).forEach(r => track('vue_residence', r.id));
  app.querySelectorAll('[data-r]').forEach(a => a.addEventListener('click', () => track('clic_residence', a.dataset.r)));
  app.querySelectorAll('.rs').forEach(diaporama);
  app.querySelectorAll('[data-vid]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); const r = (data || []).find(x => x.id === b.dataset.vid); if (!r) return;
    track('video_residence', r.id); lecteurVideo(publicUrl(r.video_path), { poster: imgs(r)[0] || '', titre: r.nom }); }));
}
// Diaporama « envie » : fondu + zoom lent (Ken Burns), barres de progression façon story, toucher pour avancer
const DUREE_DIAPO = 3800;
function diaporama(box) {
  const urls = JSON.parse(box.dataset.imgs || '[]'); if (!urls.length) return;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slides = urls.map((_, i) => { const d = document.createElement('img'); d.alt = ''; d.referrerPolicy = 'no-referrer'; d.decoding = 'async'; d.className = 'rs-s k' + (i % 4); box.prepend(d); return d; });
  const bars = [...box.querySelectorAll('.rs-bars i')], num = box.querySelector('.rs-n');
  // une photo n'est montrée qu'une fois téléchargée ET décodée (jamais d'écran gris pendant le défilement)
  const prets = new Map();
  const prep = (i) => {
    if (!prets.has(i)) prets.set(i, new Promise(ok => { const im = slides[i]; if (!im.getAttribute('src')) im.src = urls[i]; (im.decode ? im.decode() : Promise.resolve()).then(() => ok(true), () => { prets.delete(i); im.removeAttribute('src'); ok(false); }); }));
    return prets.get(i);
  };
  let cur = -1, timer = null, visible = true, jeton = 0, nett = null;
  const planifier = () => { clearTimeout(timer); if (urls.length > 1 && !reduit && visible) timer = setTimeout(() => aller(cur + 1), DUREE_DIAPO); };
  const aller = async (i, essais = urls.length) => {
    i = (i + urls.length) % urls.length; const t = ++jeton; clearTimeout(timer);
    const ok = await prep(i);
    if (t !== jeton) return; // un autre geste a pris le relais
    if (!ok) { if (essais > 1) return aller(i + 1, essais - 1); return planifier(); } // photo introuvable : on passe à la suivante
    if (i === cur) return planifier();
    const prev = cur >= 0 ? slides[cur] : null;
    if (prev) { prev.classList.remove('on'); prev.classList.add('was'); }
    cur = i; const s = slides[i];
    if (s.classList.contains('was')) s.classList.replace('was', 'on'); // encore visible : on la reprend sans refaire le fondu
    else { s.classList.remove('on'); void s.offsetWidth; s.classList.add('on'); }
    clearTimeout(nett); nett = setTimeout(() => slides.forEach(x => x.classList.remove('was')), 950); // les anciennes photos restent dessous jusqu'à la fin du fondu
    bars.forEach((b, k) => { b.className = k < i ? 'done' : ''; }); if (bars[i]) { void bars[i].offsetWidth; bars[i].className = 'go'; }
    if (num) num.textContent = (i + 1) + ' / ' + urls.length;
    prep((i + 1) % urls.length);
    planifier();
  };
  box.addEventListener('click', (e) => { const x = e.clientX - box.getBoundingClientRect().left; aller(x < box.clientWidth / 3 ? cur - 1 : cur + 1); });
  let x0 = null; box.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
  box.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) { e.preventDefault(); aller(dx < 0 ? cur + 1 : cur - 1); } });
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; box.classList.toggle('pause', !visible); if (!visible) clearTimeout(timer); else if (cur >= 0) planifier(); }).observe(box);
  aller(0);
}
async function nouveautes() {
  const { data } = await sb.from('contenus').select('*').eq('visible', true).neq('type', 'Flip Immo').order('date_parution', { ascending: false });
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Les nouveautés</h1><p class="muted">Nouvelles résidences, programmes à venir et actualités ADRESS</p>
  <div class="list" style="margin-top:12px">${(data || []).map(c => `<div class="card item">
    ${c.image_path ? `<div class="ph" style="aspect-ratio:16/9;background-image:url('${esc(publicUrl(c.image_path))}')"></div>` : ''}
    <div class="bd" style="padding:14px"><div class="muted small">${esc(c.type)} · ${dateFr(c.date_parution)}</div><h3>${esc(c.titre)}</h3>
    ${c.texte ? `<p style="white-space:pre-line">${esc(c.texte)}</p>` : ''}${c.lien ? `<a class="btn sm" href="${esc(sur(c.lien))}" target="_blank" rel="noopener">En savoir plus</a>` : ''}</div></div>`).join('') || '<div class="card center pad">Aucune nouveauté pour le moment.</div>'}</div>`;
}
async function flip() {
  // Le numéro à la une en grand (fond flouté de sa couverture), les autres en étagère
  const { data } = await sb.from('contenus').select('*').eq('visible', true).eq('type', 'Flip Immo').order('date_parution', { ascending: false });
  const l = data || [];
  const href = (f) => f.lien ? (estFlip(f.lien) ? lienFlip(f.lien, f.titre) : sur(f.lien)) : '#';
  const ext = (f) => f.lien && !estFlip(f.lien) ? ' target="_blank" rel="noopener"' : '';
  const img = (f) => f.image_path ? esc(publicUrl(f.image_path)) : '';
  const couv = (f) => f.image_path ? `<img src="${img(f)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<span class="fl-vide">Flip Immo</span>';
  const mois = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '';
  const [a, ...autres] = l;
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Le Flip Immo</h1>
  ${a ? `<a class="fl-une" data-f="${a.id}" href="${esc(href(a))}"${ext(a)}>${a.image_path ? `<span class="fl-bg" style="background-image:url('${img(a)}')"></span>` : ''}
      <div class="fl-c">${couv(a)}</div>
      <div class="fl-t"><span class="fl-k">À la une</span><h2>${esc(a.titre)}${a.numero ? ' – n° ' + esc(a.numero) : ''}</h2>${a.texte ? `<p>${esc(a.texte)}</p>` : ''}<span class="btn">Lire le magazine</span></div></a>
    ${autres.length ? `<h2 class="fl-h">Les autres numéros</h2><div class="fl-grid">${autres.map(f => `<a class="card fl-it" data-f="${f.id}" href="${esc(href(f))}"${ext(f)}><div class="fl-c">${couv(f)}</div><div class="fl-it-t"><b>${esc(f.titre)}</b><small>${mois(f.date_parution)}</small><span class="fl-lire">Lire ›</span></div></a>`).join('')}</div>` : ''}`
  : '<div class="card center pad" style="margin-top:12px">Le prochain numéro arrive bientôt.</div>'}`;
  app.querySelectorAll('[data-f]').forEach(x => x.addEventListener('click', () => track('clic_flip', x.dataset.f)));
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
    + (p.lien ? '<a class="btn sm ghost" data-p="' + p.id + '" href="' + esc(sur(p.lien)) + '" target="_blank" rel="noopener">Découvrir</a>' : '') + '</div>';
  const flipCard = (p) => '<a class="flipcard" data-p="' + p.id + '" href="' + esc(lienFlip(p.lien, p.nom)) + '">'
    + '<span class="fc-cover"' + (p.logo_path ? ' style="background-image:url(\'' + esc(publicUrl(p.logo_path)) + '\')"' : '') + '><em>' + esc(p.nom) + '</em></span>'
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
  <div class="list" style="margin-top:12px">${(data || []).map(n => `<a class="card notif ${n.lue ? '' : 'unread'}" style="display:block;text-decoration:none" href="${n.type === 'info' && n.annonce_id ? '#/mes-annonces?o=envoyees' : n.type === 'interet' || n.type === 'rappel_j53' || n.type === 'expiration' ? '#/mes-annonces' : n.type === 'nouveautes' ? '#/market' : '#/'}">
    <b>${esc(n.titre)}</b>${n.message ? `<div class="muted small">${esc(n.message)}</div>` : ''}<div class="muted small">${dateFr(n.created_at, true)}</div></a>`).join('') || '<div class="card center pad">Aucune notification.</div>'}</div>
  <p class="muted small center" style="margin-top:12px">Réglez vos alertes dans <a href="#/profil">Mon compte</a>.</p>`;
  const nonLues = (data || []).filter(n => !n.lue).map(n => n.id);
  if (nonLues.length) await sb.from('notifications').update({ lue: true }).in('id', nonLues);
}

// ---------- Mon compte ----------
function profil() {
  const p = state.profil;
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Mon compte</h1>
  <section class="card mon-appli" style="margin-top:12px" aria-label="Mon appli"><h2 style="margin-top:0">Mon appli</h2>
    <div class="ma-l"><span class="ma-i" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/></svg></span><div><b>Installation</b><div id="instRow"></div></div></div>
    <div class="ma-l"><span class="ma-i" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg></span><div><b>Notifications</b><div class="push-row" id="pushRow"></div></div></div></section>
  <form id="f" class="card" style="margin-top:12px">
    <label for="nom">Nom d'affichage (visible des autres résidents)</label><input id="nom" type="text" maxlength="40" value="${esc(p.nom_affichage)}">
    <label for="tel">Téléphone (privé, nécessaire pour être recontacté sur le Market)</label><input id="tel" type="tel" value="${esc(p.telephone || '')}" placeholder="+225 07 00 00 00 00">
    <label class="check"><input id="cons" type="checkbox" ${p.consentement_contact ? 'checked' : ''}> J'accepte que mon téléphone soit communiqué uniquement aux vendeurs des objets pour lesquels je clique « Ça m’intéresse ».</label>
    <h2>Alertes</h2>
    <label class="check"><input id="nq" type="checkbox" ${p.notif_quotidienne ? 'checked' : ''}> Résumé quotidien des nouvelles annonces (une fois par jour au maximum)</label>
    <label class="check"><input id="ni" type="checkbox" ${p.notif_interet ? 'checked' : ''}> M'alerter quand un résident est intéressé par mon annonce</label>
    <button class="btn block" style="margin-top:12px">Enregistrer</button>
  </form>
  <form class="card" id="fmdp" style="margin-top:12px" novalidate><h2 style="margin-top:0">Changer mon mot de passe</h2>
    <label for="m1">Nouveau mot de passe</label><input id="m1" type="password" autocomplete="new-password" minlength="8">
    <label for="m2">Confirmer</label><input id="m2" type="password" autocomplete="new-password" minlength="8">
    <p class="err" id="erm" hidden></p><button class="btn ghost block" style="margin-top:12px" id="gom">Changer le mot de passe</button></form>
  <div class="card decouvre-p" style="margin-top:12px"><h2 style="margin-top:0">Découvrir ADRESS CLUB</h2><p class="muted small">Le tour de l’appli en 4 étapes, ou le film de présentation à montrer à un voisin.</p>
    <div class="row"><button type="button" class="btn sm" data-visite>Revoir la visite guidée</button><button type="button" class="btn sm soft" data-film hidden>▶ Le film (${FILM.duree})</button></div></div>
  <div class="card" style="margin-top:12px"><h2 style="margin-top:0">Installer l'appli : les vidéos</h2><p class="muted small">À regarder ou à montrer à un voisin : 40 secondes pour avoir ADRESS CLUB sur l'écran d'accueil.</p>
    <div class="tuto-grid"><div><b>Android</b>${videoTuto('android')}</div><div><b>iPhone</b>${videoTuto('ios')}</div></div></div>
  <div class="card" style="margin-top:12px"><p class="muted small">Résidence : ${esc(p.residence?.nom || '—')}<br>Compte activé le ${dateFr(p.date_activation)}</p>
  <div class="row"><a class="btn ghost" href="#/avis">Donner mon avis</a><button class="btn danger" id="out">Se déconnecter</button></div></div>`;
  const $ = (s) => app.querySelector(s);
  $('#f').onsubmit = async (e) => {
    e.preventDefault();
    const { error } = await sb.rpc('maj_preferences', { p_nom_affichage: $('#nom').value, p_telephone: $('#tel').value, p_consentement: $('#cons').checked, p_notif_quotidienne: $('#nq').checked, p_notif_interet: $('#ni').checked });
    if (error) return toast(errMsg(error));
    await chargerProfil(); toast('Préférences enregistrées.');
  };
  $('#out').onclick = () => deconnecter($('#out'));
  brancherDecouverte(app);
  const pr = $('#pushRow'), majPush = () => {
    if (!pushOk()) { pr.innerHTML = `<small class="muted">${estIOS() ? 'Sur iPhone, installez d’abord l’appli sur l’écran d’accueil pour recevoir les notifications.' : 'Ce navigateur ne permet pas les notifications.'}</small>`; return; }
    const st = Notification.permission;
    pr.innerHTML = st === 'granted' ? '<span class="badge ok">✓ Activées</span> <small class="muted">sur cet appareil</small><button class="btn sm ghost" type="button" id="pushTest">Envoyer un test</button>'
      : st === 'denied' ? '<small class="muted">Notifications bloquées : autorisez-les dans les réglages du navigateur pour ce site.</small>'
      : '<button class="btn sm" type="button" id="pushOn">Activer les notifications</button>';
    const b = pr.querySelector('#pushOn'); if (b) b.onclick = async () => { b.disabled = true; const ok = await activerPush(true); toast(ok ? 'Notifications activées.' : 'Notifications non activées.'); majPush(); };
    const t = pr.querySelector('#pushTest'); if (t) t.onclick = async () => {
      t.disabled = true; t.textContent = 'Envoi…'; await activerPush(false);
      const { data: n, error } = await sb.rpc('tester_push'); t.disabled = false; t.textContent = 'Envoyer un test';
      toast(error ? errMsg(error) : n ? 'Test envoyé : la notification arrive dans quelques secondes (vous pouvez fermer l’appli).' : 'Ce téléphone n’est pas encore abonné : réessayez dans un instant.');
    };
  };
  majPush();
  $('#fmdp').onsubmit = async (e) => {
    e.preventDefault(); const er = $('#erm'), a = $('#m1').value, b = $('#m2').value; er.hidden = true;
    if (a.length < 8) { er.textContent = '8 caractères minimum.'; er.hidden = false; return; }
    if (a !== b) { er.textContent = 'Les deux mots de passe ne sont pas identiques.'; er.hidden = false; return; }
    $('#gom').disabled = true; const { error } = await sb.auth.updateUser({ password: a }); $('#gom').disabled = false;
    if (error) { er.textContent = errMsg(error); er.hidden = false; return; }
    $('#m1').value = $('#m2').value = ''; toast('Mot de passe changé.');
  };
  const ir = $('#instRow'), tel = estIOS() || /android|mobile/i.test(navigator.userAgent);
  ir.innerHTML = estInstallee() ? '<span class="badge ok">✓ Installée</span> <small class="muted">sur cet appareil</small>'
    : `<small class="muted">${tel ? 'Pas encore sur l’écran d’accueil de ce téléphone.' : 'Vous êtes sur un ordinateur : installez-la sur votre téléphone.'}</small><button class="btn sm" type="button" id="install">📲 Installer${tel ? '' : ' sur mon téléphone'}</button>`;
  const ib2 = $('#install'); if (ib2) ib2.onclick = installer;
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
    toast('Merci pour votre avis.'); fete(); location.hash = an ? '#/mes-annonces' : '#/';
  };
}

// ---------- connexion : bandeau discret quand le réseau coupe ----------
(() => {
  const b = document.createElement('div'); b.className = 'reseau'; b.setAttribute('role', 'status'); b.hidden = true; document.body.appendChild(b);
  let t = 0;
  const maj = (en) => { clearTimeout(t);
    if (!en) { b.textContent = 'Pas de connexion'; b.className = 'reseau off'; b.hidden = false; }
    else if (!b.hidden) { b.textContent = 'Connexion rétablie'; b.className = 'reseau on'; t = setTimeout(() => { b.hidden = true; }, 2200); } };
  addEventListener('offline', () => maj(false)); addEventListener('online', () => maj(true));
  if (!navigator.onLine) maj(false);
})();

// ---------- démarrage ----------
window.addEventListener('appinstalled', () => { window._installPrompt = null; document.querySelectorAll('.install-card').forEach(x => x.remove()); });
window.addEventListener('hashchange', router);
setTimeout(() => { if (state.session) activerPush(false); }, 4000);
// Arrivée depuis le bouton « Installer avec Chrome » : la fenêtre d'installation s'ouvre d'elle-même
if (new URLSearchParams(location.search).has('inst')) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (_) {} setTimeout(() => { if (!estInstallee()) installer(true); }, 1800); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) majCompteurs(); });
// Œil 👁 sur tous les champs mot de passe : afficher / masquer ce qu'on tape
const OEIL = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const OEIL_BARRE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.1 4"/><path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
function yeux(root) {
  root.querySelectorAll('input[type=password]:not([data-oeil])').forEach(inp => {
    inp.dataset.oeil = '1';
    const w = document.createElement('span'); w.className = 'pw'; inp.before(w); w.appendChild(inp);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pw-eye'; b.innerHTML = OEIL; b.setAttribute('aria-label', 'Afficher le mot de passe');
    b.onclick = () => { const vis = inp.type === 'password'; inp.type = vis ? 'text' : 'password'; b.innerHTML = vis ? OEIL_BARRE : OEIL; b.setAttribute('aria-label', vis ? 'Masquer le mot de passe' : 'Afficher le mot de passe'); inp.focus({ preventScroll: true }); };
    w.appendChild(b);
  });
}
new MutationObserver(() => yeux(document)).observe(document.body, { childList: true, subtree: true });
// Photo qui ne se charge pas : on oublie son lien (peut-être périmé) et on recharge la page une fois pour en obtenir un neuf
window.addEventListener('acl-photo-ko', (e) => {
  let vu = false; signedCache.forEach((v, k) => { if (v[0] === e.detail) { signedCache.delete(k); vu = true; } });
  if (!vu) return; sauverSig();
  if (!state.reessai || Date.now() - state.reessai > 60000) { state.reessai = Date.now(); clearTimeout(state.reessaiT); state.reessaiT = setTimeout(router, 400); }
});
sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') { state.session = null; state.profil = null; } if (ev === 'PASSWORD_RECOVERY') { state.recup = true; setTimeout(router, 0); } });
// Mise à jour automatique : dès qu'une nouvelle version est publiée, l'application la récupère et se recharge une fois
if ('serviceWorker' in navigator) {
  const avait = !!navigator.serviceWorker.controller; let fait = false;
  // Jamais en pleine saisie : si l'écran est affiché, le rechargement attend que l'utilisateur quitte puis revienne
  let attente = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!avait || fait) return; fait = true; if (document.visibilityState === 'hidden') location.reload(); else attente = true; });
  document.addEventListener('visibilitychange', () => { if (attente && document.visibilityState === 'hidden') location.reload(); });
  navigator.serviceWorker.register('sw.js').then(reg => {
    const verifier = () => reg.update().catch(() => {});
    verifier(); // à chaque ouverture : une nouvelle version est cherchée tout de suite
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verifier(); });
    setInterval(verifier, 30 * 60 * 1000);
  }).catch(() => {});
}
window.addEventListener('scroll', () => document.getElementById('top').classList.toggle('scrolled', scrollY > 4), { passive: true });
await chargerProfil();
router();
setInterval(majCompteurs, 60000);

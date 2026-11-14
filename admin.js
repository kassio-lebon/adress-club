// ADRESS CLUB — espace de gestion ADRESS (réservé aux comptes is_admin)
import { sb, state, esc, toast, errMsg, dateFr, fcfa, publicUrl, FILTRES_BP, compress, barreRecherche } from './app.js';

// Navigation en 4 groupes (au lieu de 11 onglets à plat) : on choisit d'abord le domaine, puis l'écran
const GROUPES = [
  ['Aujourd’hui', [['jour', 'Aujourd’hui']]],
  ['Locataires', [['plan', 'Plan résidences et villas'], ['residences', 'Résidences'], ['villas', 'Villas'], ['annuaire', 'Nos locataires'], ['express', 'Invitation express'], ['invitations', 'Invitations'], ['comptes', 'Comptes']]],
  ['Le Market', [['annonces', 'Annonces'], ['moderation', 'Signalements']]],
  ['Vitrine', [['contenus', 'Actualités'], ['partenaires', 'Bons plans']]],
  ['Pilotage', [['stats', 'Indicateurs'], ['avis', 'Avis'], ['parametres', 'Paramètres']]]];
// Aide de chaque écran : une phrase « à quoi ça sert » et le pas-à-pas, toujours visibles (étapes numérotées courtes)
const AIDE = {
  plan: ['Chaque résidence ou ensemble de villas vu comme un plan : un carré par logement, sa couleur dit où en est le locataire.', [
    'En haut, choisissez « Résidences » ou « Villas », puis le bien voulu.',
    'Touchez un logement : sa fiche s’ouvre (nom, e-mail, historique).',
    'Complétez la fiche puis « Enregistrer et inviter par WhatsApp » : le message part avec son code.',
    'Départ d’un locataire : « Libérer le logement ».']],
  express: ['Envoyer les invitations à la suite, sans rien saisir : un message WhatsApp prêt par locataire.', [
    'Touchez « Ouvrir WhatsApp avec ce message », choisissez le contact, envoyez.',
    'Revenez ici : l’envoi est coché et le locataire suivant s’affiche.',
    '« Passer » laisse un locataire pour plus tard ; « À relancer » renvoie les codes qui vont expirer.']],
  annuaire: ['La liste officielle des locataires de chaque résidence : un logement, un locataire, une adresse e-mail. Les invitations partent de cette liste.', [
    'En haut, choisissez « Résidences » ou « Villas », puis le bien dans la liste.',
    'Le filtre rouge « À corriger » montre les logements à compléter (e-mail ou nom manquant).',
    'Nouveau locataire sur un logement libre : « Affecter un locataire », puis « Affecter et inviter par WhatsApp ».',
    'Le locataire déménage : « Retirer » (compte suspendu, il peut revenir). Il quitte définitivement la résidence : « Supprimer ». Dans les deux cas le logement reste et redevient libre.',
    'Mise à jour par Excel : « Importer un fichier Excel » affiche les colonnes obligatoires et un modèle, puis un aperçu ligne par ligne avant d’importer. Le fichier remplace la liste : ce qui n’y est plus est retiré.']],
  invitations: ['Envoyer à un locataire son code personnel pour qu’il crée son compte ADRESS CLUB.', [
    'Choisissez la résidence, puis tapez le logement ou le nom du locataire : son nom et son e-mail se remplissent seuls.',
    'Touchez « Créer l’invitation », puis « Envoyer par WhatsApp » : le message est déjà rédigé.',
    'Le locataire crée son compte avec l’e-mail indiqué dans le message, sinon le code est refusé.',
    'Un code expiré se remplace d’un clic avec « Nouveau code ».']],
  comptes: ['Les personnes qui ont déjà un compte : vérifier, changer de logement, retirer l’accès au départ.', [
    '« Retirer » coupe l’accès et met ses annonces en pause. Rien n’est perdu : avec un nouveau code, la personne retrouve tout.',
    '« Logement » rattache le compte au bon appartement.',
    '« Mot de passe » crée un mot de passe provisoire à envoyer par WhatsApp.',
    'Une date de fin d’occupation retire l’accès automatiquement à cette date.']],
  annonces: ['Toutes les annonces publiées par les résidents sur le Market.', [
    'Touchez le titre pour voir l’annonce.',
    '« Retirer » enlève une annonce non conforme du Market ; « Rétablir » la remet en ligne.']],
  moderation: ['Les annonces signalées par des résidents, à examiner. Vous recevez une notification à chaque signalement.', [
    'Touchez « Voir l’annonce ».',
    'Non conforme : « Retirer l’annonce ». Conforme : « Maintenir ».',
    'L’annonce reste en ligne tant que vous n’avez pas décidé.']],
  residences: ['Les résidences d’appartements ADRESS : leur fiche sur l’accueil des résidents et le nombre de logements suivis. Les villas ont leur propre rubrique « Villas ».', [
    'Nouvelle résidence : bouton rouge « Créer une résidence », puis choisissez le type.',
    'Ensuite, ajoutez ses logements dans Nos locataires (import Excel ou « Ajouter un logement »).',
    '« Photo » change la photo, « Masquer » la cache aux résidents sans rien perdre.',
    '« Supprimer » efface la résidence et ses logements, définitivement (double confirmation).']],
  villas: ['Les ensembles de villas ADRESS (LUMIERE, HERMES…), séparés des résidences : chaque ensemble a sa fiche et ses villas.', [
    'Le plus simple : importez le fichier Excel des villas dans Nos locataires. Chaque nom de villa devient un ensemble ici, tout seul.',
    'Ou bien : bouton rouge « Créer un ensemble de villas », puis ajoutez ses villas dans Nos locataires.',
    '« Photo » change la photo, « Masquer » le cache aux résidents sans rien perdre.',
    '« Supprimer » efface l’ensemble et ses villas, définitivement (double confirmation).']],
  contenus: ['Les actualités et magazines (Flip Immo) affichés aux résidents.', [
    'Publiez avec le formulaire en haut : type, titre, image et, pour un Flip Immo, le lien du flipbook.',
    '« Masquer » retire un contenu sans le perdre ; « Supprimer » l’efface.']],
  partenaires: ['Les bons plans des partenaires proposés aux résidents.', [
    'Ajoutez un partenaire avec le formulaire en haut.',
    'Il n’apparaît aux résidents que s’il est « Validé » et « Visible ».']],
  stats: ['Les chiffres clés : occupation des résidences, adhésion au Club, activité du Market.', [
    'Les taux sont calculés à partir de Nos locataires : tenez cette liste à jour.']],
  avis: ['Ce que les résidents pensent de l’application.', ['Le filtre « Avec suggestion » montre les idées d’amélioration.']],
  parametres: ['Les règles du Market : durée des annonces, rappel au vendeur, nombre de photos. À modifier rarement.', ['Changez une valeur puis touchez « Enregistrer ».']] };

// Espaces insécables typographiques (« … », : ; ? !) : évite les guillemets ou deux-points seuls en début de ligne
const insec = (t) => t.replace(/« /g, '«&nbsp;').replace(/ ([»:;?!])/g, '&nbsp;$1');
const TYPES_CONTENU = ['Nouvelle résidence','Programme à venir','Actualité ADRESS','Flip Immo'];
const TYPES_BIEN = ['Appartements','Villas en résidence','Villas individuelles','Mixte'];
const LIB_TYPE = { 'Appartements': 'Résidence d’appartements', 'Villas en résidence': 'Ensemble de villas', 'Villas individuelles': 'Villas individuelles', 'Mixte': 'Mixte (appartements et villas)' };
// Résidence d'appartements ou ensemble de villas : le type de bien décide, à défaut le nom (« VILLA … »)
const resVilla = (r) => /villa/i.test(r?.type_bien || '') || /^VILLAS?\b/i.test(String(r?.nom || '').trim());
// Menus : deux groupes « Résidences » puis « Villas »
const optionsRes = (R, sel, lab = (r) => esc(r.nom)) => { const o = (r) => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${lab(r)}</option>`, a = R.filter(r => !resVilla(r)), v = R.filter(resVilla);
  return a.length && v.length ? `<optgroup label="Résidences">${a.map(o).join('')}</optgroup><optgroup label="Villas">${v.map(o).join('')}</optgroup>` : R.map(o).join(''); };
// Sélecteur de type de bien : on choisit d'abord « Résidences » ou « Villas », puis le bien voulu
const IC_RES = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V4h10v17M14 9h6v12M2.5 21h19M7.5 8h3M7.5 12h3M7.5 16h3"/></svg>';
const IC_VIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5M5.5 9.5V21h13V9.5M10 21v-5.5h4V21"/></svg>';
const typeDe = (r) => resVilla(r) ? 'vil' : 'res';
const choixType = (t, nRes, nVil, nTout) => `<div class="tsw${nTout != null ? ' t3' : ''}" role="group" aria-label="Type de bien">${[nTout != null ? ['tout', 'Tout', nTout, ''] : null, ['res', 'Résidences', nRes, IC_RES], ['vil', 'Villas', nVil, IC_VIL]].filter(Boolean)
  .map(([k, lab, n, ic]) => `<button type="button" class="${t === k ? 'on' : ''}" aria-pressed="${t === k}" data-t="${k}">${ic}<span>${lab}</span><em>${n}</em></button>`).join('')}</div>`;
// Boutons : résidences d'abord, puis les villas après un séparateur
const parType = (R, f) => { const a = R.filter(r => !resVilla(r)), v = R.filter(resVilla); return a.map(f).join('') + (a.length && v.length ? '<span class="chips-sep" aria-hidden="true">Villas</span>' : '') + v.map(f).join(''); };

export async function renderAdmin(app, ong) {
  if (!state.profil?.is_admin) { app.innerHTML = '<div class="card">Accès réservé à ADRESS IMMOBILIER.</div>'; return; }
  ong = ong || 'jour';
  const g = GROUPES.find(([, o]) => o.some(([k]) => k === ong)) || GROUPES[0];
  const titre = g[1].find(([k]) => k === ong)?.[1] || '';
  const [but, etapes] = AIDE[ong] || ['', []];
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Espace ADRESS</h1>
  <nav class="adm-nav"><div class="adm-g">${GROUPES.map(([n, o]) => `<a class="${n === g[0] ? 'on' : ''}" href="#/admin/${o[0][0]}">${n}</a>`).join('')}</div>
  ${g[1].length > 1 ? `<div class="tabs chips adm-s">${g[1].map(([k, l]) => `<a class="chip ${k === ong ? 'on' : ''}" href="#/admin/${k}">${l}</a>`).join('')}</div>` : ''}</nav>
  ${but ? `<section class="aide" aria-label="Comment faire"><p class="aide-but"><b>${esc(titre)}</b> ${esc(but)}</p>${etapes.length ? `<button type="button" class="aide-ouvrir" aria-expanded="false">Comment faire ? <span>${etapes.length} étapes</span></button><ol class="aide-et">${etapes.map(e => `<li>${insec(esc(e))}</li>`).join('')}</ol>` : ''}</section>` : ''}
  <div id="adm"></div>`;
  const box = app.querySelector('#adm');
  // téléphone : les étapes d'aide sont repliées (un toucher les déplie) pour voir tout de suite l'écran de travail
  const ao = app.querySelector('.aide-ouvrir'); if (ao) ao.onclick = () => { const s = ao.closest('.aide'), o = s.classList.toggle('ouvert'); ao.setAttribute('aria-expanded', String(o)); };
  await ({ jour, plan, express, stats, invitations, annuaire, comptes, moderation, annonces, contenus, residences, villas, partenaires, avis, parametres }[ong] || stats)(box);
  mobile(app);
  if (!['parametres', 'jour', 'plan', 'express'].includes(ong)) {
    box.querySelectorAll('table.adm:not(.no-q)').forEach(t => { if (t.querySelectorAll('tr').length > 3) barreRecherche(t.parentElement.matches('div[style*="overflow"]') ? t.parentElement : t, () => [...t.querySelectorAll('tr')].slice(1), 'Rechercher…'); });
    box.querySelectorAll('.list:not(.no-q)').forEach(l => { if (l.children.length > 3) barreRecherche(l, () => [...l.children], 'Rechercher…'); });
  }
}
// Téléphone : chaque cellule de tableau reçoit l'intitulé de sa colonne (affiché au-dessus quand le tableau devient une fiche),
// et le domaine actif de la navigation est ramené au centre
const etiqueter = (root) => root.querySelectorAll('table.adm').forEach(t => { triable(t); const h = [...(t.querySelector('thead tr') || t.querySelector('tr:has(> th)') || { children: [] }).children].map(th => th.textContent.trim());
    t.querySelectorAll('tr').forEach(tr => [...tr.children].forEach((td, i) => { if (td.tagName === 'TD' && h[i] && !td.hasAttribute('data-l')) td.setAttribute('data-l', h[i]); })); });
// Tri des colonnes : toucher un en-tête trie (croissant puis décroissant) ; sur téléphone, un menu « Trier par »
const COLL = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' }), TRI = new Map();
const cleTri = (td) => { const t = (td?.dataset.tri ?? td?.innerText ?? '').replace(/[\u202f\u00a0]/g, ' ').trim();
  if (!t || t === '—') return null;
  const d = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/); if (d) return +new Date(+d[3], d[2] - 1, +d[1]);
  if (/^-?[\d .,]+(\s*(FCFA|%|\/.*))?$/i.test(t)) { const v = parseFloat(t.replace(/\s/g, '').replace(',', '.')); if (!isNaN(v)) return v; }
  return t; };
const compTri = (a, b) => a === null ? (b === null ? 0 : 1) : b === null ? -1 : typeof a === 'number' && typeof b === 'number' ? a - b : typeof a === 'number' ? -1 : typeof b === 'number' ? 1 : COLL.compare(a, b);
function triable(t) {
  if (t.dataset.tri || t.classList.contains('imp-t')) return;
  const hr = t.querySelector('thead tr') || t.querySelector('tr:has(> th)'); if (!hr) return;
  const ths = [...hr.children], cols = ths.map((th, i) => [i, th.textContent.trim()]).filter(([, l]) => l);
  const corps = t.tBodies[0] || t; t.dataset.tri = '1';
  if (cols.length < 1 || corps.querySelectorAll('tr:not(:has(> th))').length < 2) return;
  const k = location.hash.split('?')[0] + '|' + ths.map(th => th.textContent.trim()).join(',');
  [...corps.rows].forEach((r, i) => { if (!r.dataset.o) r.dataset.o = i; });
  const appliquer = (col, dir, garder) => {
    const lignes = [...corps.rows].filter(r => !r.querySelector(':scope > th'));
    lignes.sort((a, b) => col < 0 ? a.dataset.o - b.dataset.o : (compTri(cleTri(a.cells[col]), cleTri(b.cells[col])) * dir || a.dataset.o - b.dataset.o));
    lignes.forEach(r => corps.appendChild(r));
    ths.forEach((th, i) => { if (th.querySelector('.th-tri')) th.setAttribute('aria-sort', i === col ? (dir > 0 ? 'ascending' : 'descending') : 'none'); });
    if (!garder) { if (col < 0) TRI.delete(k); else TRI.set(k, [col, dir]); }
    const m = t._triM; if (m) m.value = col < 0 ? '' : col + ':' + dir;
  };
  cols.forEach(([i, l]) => { const th = ths[i]; th.innerHTML = `<button type="button" class="th-tri" title="Trier par ${esc(l)}">${esc(l)}</button>`; th.setAttribute('aria-sort', 'none');
    th.firstChild.onclick = () => { const [c, d] = TRI.get(k) || [-1, 1]; appliquer(i, c === i ? -d : 1); }; });
  // téléphone : les en-têtes sont masqués, un menu les remplace
  const box = t.parentElement && getComputedStyle(t.parentElement).overflowX === 'auto' ? t.parentElement : t;
  const m = document.createElement('label'); m.className = 'tri-m';
  m.innerHTML = `<span>Trier par</span><select><option value="">Ordre normal</option>${cols.map(([i, l]) => `<option value="${i}:1">${esc(l)} (A → Z, 0 → 9)</option><option value="${i}:-1">${esc(l)} (Z → A, 9 → 0)</option>`).join('')}</select>`;
  box.before(m); t._triM = m.querySelector('select');
  t._triM.onchange = () => { const [c, d] = t._triM.value ? t._triM.value.split(':').map(Number) : [-1, 1]; appliquer(c, d); };
  const deja = TRI.get(k); if (deja) appliquer(deja[0], deja[1], true);
}
let obsTab = null;
function mobile(root) {
  etiqueter(root);
  // tableaux redessinés plus tard (filtres, import, ajout…) : étiquetés eux aussi
  if (!obsTab) { let t = 0; obsTab = new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => etiqueter(document.getElementById('app')), 60); }); obsTab.observe(document.getElementById('app'), { childList: true, subtree: true }); }
  const g = root.querySelector('.adm-g'), on = g?.querySelector('a.on');
  if (g) { const fin = () => g.classList.toggle('fin', g.scrollLeft + g.clientWidth >= g.scrollWidth - 4); g.addEventListener('scroll', fin, { passive: true });
    if (on && g.scrollWidth > g.clientWidth) g.scrollLeft = on.offsetLeft - (g.clientWidth - on.offsetWidth) / 2; fin(); }
  const s = root.querySelector('.adm-s'), o2 = s?.querySelector('.on'); if (s && o2 && s.scrollWidth > s.clientWidth) s.scrollLeft = o2.offsetLeft - (s.clientWidth - o2.offsetWidth) / 2;
}
const rerender = () => window.dispatchEvent(new HashChangeEvent('hashchange'));
async function uploadPublic(file, dossier) {
  if (/^image\/(jpeg|heic|heif|webp)$/i.test(file.type) || (file.type.startsWith('image/') && file.size > 1500000 && !/png|svg/i.test(file.type))) {
    file = new File([await compress(file, 1920)], 'photo.jpg', { type: 'image/jpeg' });
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${dossier}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from('contenus').upload(path, file, { contentType: file.type });
  if (error) throw error; return path;
}
const check = (r) => { if (r.error) throw r.error; return r.data; };
// Formulaire « Ajouter » réutilisé pour « Modifier » : champs pré-remplis, bouton Enregistrer, Annuler
function modeEdition(box, titre, labelFichier) {
  const card = box.querySelector('#f').closest('.card');
  card.querySelector('h3').textContent = titre;
  card.querySelector('#f button.btn:not([type=button])').textContent = 'Enregistrer les modifications';
  const lf = card.querySelector('[data-lf]'); if (lf && labelFichier) lf.textContent = labelFichier;
  card.hidden = false; card.querySelector('#annul').hidden = false; card.classList.add('editing');
  card.scrollIntoView({ block: 'start', behavior: 'smooth' });
  card.querySelector('#annul').onclick = () => rerender();
}
async function action(fn, ok = 'Enregistré.') { try { await fn(); toast(ok); rerender(); } catch (e) { toast(errMsg(e)); } }

// ---------- Indicateurs (§8) ----------
async function stats(box) {
  const [d, res, log, pro, inv] = await Promise.all([
    sb.rpc('admin_indicateurs').then(check),
    sb.from('residences').select('id,nom').order('nom'),
    sb.from('logements').select('id,residence_id,locataire,email').eq('actif', true),
    sb.from('profiles').select('logement_id,residence_id,statut,date_activation,date_fin_occupation').eq('statut', 'actif'),
    sb.from('invitations').select('logement_id,created_at,utilisee_le,utilisee_par,expire_le')]);
  const R = res.data || [], Lg = log.data || [], P = pro.data || [], I = inv.data || [];
  const now = Date.now(), J = 864e5;
  const pct = (a, b) => b ? Math.round(100 * a / b) : null;
  const moy = (t) => t.length ? t.reduce((s, x) => s + x, 0) / t.length : null;
  const membres = new Set(P.filter(p => p.logement_id).map(p => p.logement_id));
  const enAttente = new Set(I.filter(i => !i.utilisee_par && i.logement_id && new Date(i.expire_le) > now).map(i => i.logement_id));
  const parRes = R.map(r => {
    const l = Lg.filter(x => x.residence_id === r.id), occ = l.filter(x => x.locataire);
    const m = l.filter(x => membres.has(x.id)).length;
    const dep = P.filter(p => l.some(x => x.id === p.logement_id) && p.date_fin_occupation && (new Date(p.date_fin_occupation) - now) / J <= 30 && new Date(p.date_fin_occupation) >= now - J).length;
    return { nom: r.nom, total: l.length, occ: occ.length, libres: l.length - occ.length, m, att: l.filter(x => enAttente.has(x.id)).length, dep };
  }).filter(r => r.total);
  const T = parRes.reduce((a, r) => ({ total: a.total + r.total, occ: a.occ + r.occ, libres: a.libres + r.libres, m: a.m + r.m, att: a.att + r.att, dep: a.dep + r.dep }), { total: 0, occ: 0, libres: 0, m: 0, att: 0, dep: 0 });
  const delaiAct = moy(I.filter(i => i.utilisee_le).map(i => (new Date(i.utilisee_le) - new Date(i.created_at)) / J));
  const anc = moy(P.filter(p => p.date_activation).map(p => (now - new Date(p.date_activation)) / J));
  const envoyes = I.filter(i => i.logement_id).length, actives = I.filter(i => i.utilisee_par && i.logement_id).length;
  const jours = (x) => x == null ? '–' : x < 1 ? '< 1 j' : x < 60 ? Math.round(x) + ' j' : (x / 30.4).toFixed(1).replace('.', ',') + ' mois';
  const tx = (v) => v == null ? '–' : v + ' %';
  const tuile = (v, l, s, barre) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div>${barre != null ? `<div class="jauge"><i style="width:${barre}%"></i></div>` : ''}${s ? `<div class="s">${s}</div>` : ''}</div>`;
  const M = (k) => d[k] ?? '–';
  box.innerHTML = `
  <h2 class="st-h">Résidences</h2>
  <div class="grid2 grid3">
    ${tuile(tx(pct(T.occ, T.total)), 'Taux d’occupation', `${T.occ} occupés sur ${T.total} logements`, pct(T.occ, T.total))}
    ${tuile(T.libres, 'Logements libres', 'sans locataire enregistré')}
    ${tuile(T.dep, 'Départs prévus ≤ 30 j', 'selon les dates de fin d’occupation')}
  </div>
  <h2 class="st-h">ADRESS CLUB</h2>
  <div class="grid2 grid3">
    ${tuile(tx(pct(T.m, T.occ)), 'Taux d’adhésion', `inscrits : ${T.m} sur ${T.occ} logements occupés`, pct(T.m, T.occ))}
    ${tuile(tx(pct(actives, envoyes)), 'Codes utilisés', `${actives} sur ${envoyes} · en attente : ${T.att}`, pct(actives, envoyes))}
    ${tuile(jours(delaiAct), 'Délai moyen d’activation', 'entre l’envoi du code et la création du compte')}
    ${tuile(jours(anc), 'Ancienneté moyenne', `comptes actifs : ${P.length}`)}
  </div>
  ${parRes.length ? `<div tabindex="0" style="overflow-x:auto;margin-top:14px"><table class="adm num no-q"><thead><tr><th>Résidence</th><th>Logements</th><th>Occupés</th><th>Libres</th><th>Occupation</th><th>Inscrits au Club</th><th>Adhésion</th><th>Codes en attente</th><th>Départs ≤ 30 j</th></tr></thead>
    <tbody>${parRes.map(r => `<tr><td><b>${esc(r.nom)}</b></td><td>${r.total}</td><td>${r.occ}</td><td>${r.libres}</td><td>${tx(pct(r.occ, r.total))}</td><td>${r.m}</td><td>${tx(pct(r.m, r.occ))}</td><td>${r.att}</td><td>${r.dep}</td></tr>`).join('')}</tbody></table></div>` : ''}
  <p class="muted small">Occupé = un locataire est inscrit dans <a href="#/admin/annuaire">Nos locataires</a>. Les taux sont aussi justes que cette liste : pensez à la mettre à jour à chaque entrée ou sortie.</p>
  <h2 class="st-h">Le Market</h2>
  <div class="grid2 grid3">
    ${tuile(M('annonces_ouvertes'), 'Annonces en ligne', `${M('annonces_vente')} ventes · ${M('annonces_don')} dons`)}
    ${tuile(M('objets_clotures'), 'Objets vendus ou donnés')}
    ${tuile(d.delai_moyen_cloture_jours == null ? '–' : jours(Number(d.delai_moyen_cloture_jours)), 'Délai moyen de vente ou de don', 'entre la publication et la clôture')}
    ${tuile(M('demandes_interet'), 'Demandes « Je suis intéressé »')}
    ${tuile(M('signalements_en_attente'), 'Signalements à traiter')}
  </div>
  <h2 class="st-h">Contenus et partenaires</h2>
  <div class="grid2 grid3">
    ${tuile(M('consultations_residences'), 'Consultations résidences')}
    ${tuile(M('clics_flip_immo'), 'Clics Flip Immo')}
    ${tuile(M('clics_partenaires'), 'Clics partenaires')}
    ${tuile(M('avis_total'), 'Avis reçus', `${M('avis_utiles')} jugés « utiles »`)}
  </div>`;
}

// ---------- Invitations et logements (§2) ----------
const RANG_ET = (e) => { const s = norm(e); return s === 'rdj' || s === 'rdc' ? 0 : /^penthouse/.test(s) ? 99 : (parseInt(s, 10) || 50); };
const triLog = (a, b) => (a.bloc || '').localeCompare(b.bloc || '') || RANG_ET(a.etage) - RANG_ET(b.etage) || (a.code || '').localeCompare(b.code || '', 'fr', { numeric: true });
const EMAIL_OK = (m) => /^[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(m || '');
async function invitations(box) {
  const [res, log, inv, occ] = await Promise.all([
    sb.from('residences').select('id,nom').order('nom'),
    sb.from('logements').select('id,code,numero,residence_id,bloc,etage,appartement,locataire,email').eq('actif', true).order('code'),
    sb.from('invitations').select('*, logements(code,numero,residences(nom))').order('created_at', { ascending: false }).limit(200),
    sb.from('profiles').select('logement_id,nom_affichage').eq('statut', 'actif').not('logement_id', 'is', null)]);
  const R = res.data || [], Lg = log.data || [];
  const occupant = new Map((occ.data || []).map(p => [p.logement_id, p.nom_affichage || 'occupé']));
  const enAttente = new Map((inv.data || []).filter(i => !i.utilisee_par && new Date(i.expire_le) > new Date() && i.logement_id).map(i => [i.logement_id, i.nom_affichage || 'code envoyé']));
  const lienApp = location.origin + location.pathname;
  const message = (i) => `Bonjour${i.nom_affichage ? ' ' + i.nom_affichage : ''},\n\nBienvenue dans ADRESS CLUB, l'espace privé des résidents ADRESS IMMOBILIER.\n\n1. Ouvrez ${lienApp}\n2. Touchez « J'ai un code d'invitation »\n3. Saisissez votre code : ${i.code}${i.email ? `\n4. Utilisez obligatoirement votre adresse e-mail : ${i.email}` : ''}\n\nCe code est personnel et valable jusqu'au ${dateFr(i.expire_le)}.`;
  const etat = (i) => i.utilisee_par ? `<span class="badge ok">Activé le ${dateFr(i.utilisee_le)}</span>` : new Date(i.expire_le) < new Date() ? '<span class="badge soft">Expiré</span>' : '<span class="badge warn">En attente</span>';
  if (!R.length) { box.innerHTML = '<div class="card center pad">Ajoutez d’abord une résidence dans l’onglet <a href="#/admin/residences">Résidences</a>.</div>'; return; }
  box.innerHTML = `
  <div class="card"><h3>Inviter un locataire</h3>
  <form id="fi" novalidate>
    <div class="grid2">
      <div><label for="ir">Résidence</label><select id="ir">${optionsRes(R)}</select></div>
      <div><label for="lgq">Logement</label><div class="combo" id="lgc"><input id="lgq" type="text" placeholder="Rechercher un logement, un locataire…" autocomplete="off" role="combobox" aria-expanded="false"><input type="hidden" id="lg"><div class="combo-list" role="listbox" hidden></div></div></div>
    </div>
    <div id="nvBox" hidden><div class="g3f"><div><label for="nb">Bloc</label><input id="nb" type="text" placeholder="A"></div><div><label for="ne">Étage</label><input id="ne" type="text" placeholder="RDJ"></div><div><label for="nap">Appartement</label><input id="nap" type="text" placeholder="A001"></div></div></div>
    <label for="na">Nom du locataire</label><input id="na" type="text" placeholder="ex : Aminata Kouassi" autocomplete="off">
    <label for="em">E-mail du locataire (obligatoire pour se connecter)</label><input id="em" type="email" placeholder="prenom.nom@exemple.com" autocomplete="off">
    <p class="hint" id="emHint" hidden></p>
    <details class="adv"><summary>Options (entreprise, fin de bail, compte ADRESS)</summary>
      <div class="grid2"><div><label for="to">Type d'occupant</label><select id="to"><option>Particulier</option><option>Entreprise / organisme</option></select></div><div><label for="fo">Fin d'occupation</label><input id="fo" type="date"></div></div>
      <label for="rp">Responsable (si entreprise)</label><input id="rp" type="text">
      <label class="check"><input id="ia" type="checkbox"> Compte ADRESS IMMOBILIER (annonces identifiées ADRESS)</label>
      <label class="check"><input id="ad" type="checkbox"> Administrateur (accès à cet espace)</label>
    </details>
    <p class="err" id="err" hidden></p>
    <button class="btn block" id="go" style="margin-top:14px">Créer l'invitation</button></form>
    <div id="res" hidden></div></div>
  <h2>Invitations</h2><div tabindex="0" style="overflow-x:auto" id="invs"><table class="adm no-q"><thead><tr><th>Locataire</th><th>Logement</th><th>Code</th><th>État</th><th></th></tr></thead><tbody>
  ${(inv.data || []).map(i => `<tr data-code="${esc(i.code)}" data-f="${i.utilisee_par ? 'active' : new Date(i.expire_le) < new Date() ? 'expiree' : 'attente'}"><td><b>${esc(i.nom_affichage || '—')}</b>${i.is_admin ? ' <span class="badge soft">admin</span>' : ''}${i.email ? `<div class="muted small">${esc(i.email)}</div>` : ''}</td><td>${esc(i.logements?.residences?.nom || '')}<div class="muted small">${esc(i.logements?.numero || i.logements?.code || '—')}</div></td>
    <td><b>${esc(i.code)}</b></td><td>${etat(i)}</td>
    <td>${i.utilisee_par ? '' : new Date(i.expire_le) < new Date() ? `<div class="row" style="flex-wrap:nowrap;justify-content:flex-end">${i.logement_id && (occupant.has(i.logement_id) || enAttente.has(i.logement_id)) ? '<span class="muted small">logement déjà attribué</span>' : '<button class="btn sm ghost" data-renew>Nouveau code</button>'}<button class="btn sm ghost" data-del aria-label="Supprimer">×</button></div>` : `<div class="row" style="flex-wrap:nowrap;justify-content:flex-end"><button class="btn sm soft" data-wa>WhatsApp</button><button class="btn sm ghost" data-cp>Copier</button><button class="btn sm ghost" data-del aria-label="Supprimer">×</button></div>`}</td></tr>`).join('')}</tbody></table></div>`;
  const $ = (s) => box.querySelector(s);
  const err = (m) => { $('#err').textContent = m; $('#err').hidden = !m; };
  const logSel = () => Lg.find(x => x.id === $('#lg').value);
  const remplir = () => {
    const v = $('#lg').value; $('#nvBox').hidden = v !== '+';
    const l = logSel(); $('#na').value = l?.locataire || ''; $('#em').value = l?.email || '';
    const h = $('#emHint'); h.hidden = !l || !!l.email; h.textContent = 'Pas d’e-mail dans Nos locataires pour ce logement : saisissez-le, il y sera enregistré.';
  };
  // Liste de logements avec recherche (code, locataire) et statut : libre / code envoyé / occupé
  const RANG = (e) => { const s = norm(e); return s === 'rdj' || s === 'rdc' ? 0 : /^penthouse/.test(s) ? 99 : (parseInt(s, 10) || 50); };
  const tri = (a, b) => (a.bloc || '').localeCompare(b.bloc || '') || RANG(a.etage) - RANG(b.etage) || (a.code || '').localeCompare(b.code || '', 'fr', { numeric: true });
  let items = [];
  // Occupé = un locataire figure dans l'annuaire (ou un compte actif) ; Libre = aucun locataire. Le second mot dit où en est l'accès au Club.
  const etatLog = (x) => occupant.has(x.id) ? ['occ', 'Occupé · inscrit', occupant.get(x.id)]
    : enAttente.has(x.id) ? ['att', 'Occupé · code envoyé', enAttente.get(x.id)]
    : !x.locataire ? ['lib', 'Libre', '']
    : !EMAIL_OK(x.email) ? ['mail', 'Occupé · e-mail à corriger', x.locataire]
    : ['inv', 'Occupé · à inviter', x.locataire];
  const choisir = (v) => {
    const it = items.find(i => i.v === v); if (!it) return;
    $('#lg').value = v; $('#lgq').value = it.label + (it.nom ? ' — ' + it.nom : ''); fermer(); remplir();
    if (v === '+') $('#nb').focus();
  };
  const lst = () => $('#lgc .combo-list');
  // La liste passe au-dessus du bouton : on surélève toute la branche (les animations créent des couches)
  const hausser = (on) => { for (let e = $('#lgc'); e && e !== document.body; e = e.parentElement) e.classList.toggle('combo-haut', on); };
  const fermer = () => { lst().hidden = true; hausser(false); $('#lgq').setAttribute('aria-expanded', 'false'); };
  const ouvrir = (q = '') => {
    const t = norm(q).split(/\s+/).filter(Boolean);
    const vis = items.filter(i => !t.length || t.every(w => i.cle.includes(w)));
    lst().innerHTML = vis.length ? vis.map(i => `<div class="combo-it${i.off ? ' off' : ''}${i.v === $('#lg').value ? ' sel' : ''}" role="option" data-v="${i.v}"><span><b>${esc(i.label)}</b>${i.nom ? ` <span class="muted">— ${esc(i.nom)}</span>` : ''}</span>${i.st ? `<span class="combo-st ${i.st[0]}">${i.st[1]}</span>` : ''}</div>`).join('') : '<div class="combo-vide">Aucun logement ne correspond.</div>';
    lst().hidden = false; hausser(true); $('#lgq').setAttribute('aria-expanded', 'true');
    lst().querySelectorAll('.combo-it:not(.off)').forEach(d => d.onmousedown = (ev) => { ev.preventDefault(); choisir(d.dataset.v); });
  };
  const majLogements = () => {
    const l = Lg.filter(x => x.residence_id === $('#ir').value).sort(tri);
    items = l.map(x => { const s = etatLog(x); return { v: x.id, label: x.code || x.numero, nom: s[0] === 'lib' ? s[2] : s[2], st: s, off: s[0] === 'occ' || s[0] === 'att', cle: norm([x.code, x.numero, x.locataire, x.email, s[1], s[2]].join(' ')) }; })
      .concat([{ v: '+', label: '＋ Nouveau logement…', cle: 'nouveau logement ajouter' }, { v: '0', label: 'Sans logement (équipe ADRESS)', cle: 'sans logement equipe adress admin' }]);
    $('#lg').value = ''; $('#lgq').value = '';
    const pre = items.find(i => i.v === invitations._pre && !i.off); invitations._pre = null;
    const libre = pre || items.find(i => i.st && i.st[0] === 'inv') || items.find(i => !i.off && i.st); if (libre) choisir(libre.v); else remplir();
  };
  $('#ir').onchange = majLogements;
  $('#lgq').onfocus = () => { $('#lgq').select(); ouvrir(''); };
  $('#lgq').oninput = () => ouvrir($('#lgq').value);
  $('#lgq').onblur = () => setTimeout(() => { fermer(); const it = items.find(i => i.v === $('#lg').value); if (it) $('#lgq').value = it.label + (it.nom ? ' — ' + it.nom : ''); }, 120);
  $('#lgq').onkeydown = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); const d = lst().querySelector('.combo-it:not(.off)'); if (d) choisir(d.dataset.v); } if (ev.key === 'Escape') fermer(); };
  { const p = Lg.find(x => x.id === invitations._pre); if (p) $('#ir').value = p.residence_id; }
  majLogements();
  const partager = (i) => {
    const r = $('#res'); r.hidden = false;
    r.innerHTML = `<div class="inv-ok"><small>Code de ${esc(i.nom_affichage || 'ce locataire')}${i.email ? ' · ' + esc(i.email) : ''}</small><b>${esc(i.code)}</b>
      <div class="row"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(message(i))}">Envoyer par WhatsApp</a><button class="btn ghost" type="button" id="cpm">Copier le message</button></div></div>`;
    $('#cpm').onclick = async () => { try { await navigator.clipboard.writeText(message(i)); toast('Message copié.'); } catch (_) { toast(i.code); } };
    r.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  $('#fi').onsubmit = async (e) => {
    e.preventDefault(); err('');
    const go = $('#go'); go.disabled = true;
    try {
      let logement = $('#lg').value; if (logement === '0') logement = null;
      const nom = $('#na').value.trim(), email = $('#em').value.trim().toLowerCase();
      if (logement && !EMAIL_OK(email)) { go.disabled = false; return err('Indiquez l’adresse e-mail du locataire : il devra l’utiliser pour créer son compte.'); }
      if (email && !EMAIL_OK(email)) { go.disabled = false; return err('Cette adresse e-mail n’est pas valide (pas d’accent ni d’espace).'); }
      if (logement === '+') {
        const b = $('#nb').value.trim(), et = $('#ne').value.trim(), ap = $('#nap').value.trim();
        if (!b && !et && !ap) { go.disabled = false; return err('Indiquez au moins le bloc, l’étage ou l’appartement.'); }
        const d = check(await sb.from('logements').insert({ residence_id: $('#ir').value, code: 'tmp-' + Date.now(), bloc: b, etage: et, appartement: ap, locataire: nom || null, email: email || null, type_logement: 'Appartement' }).select('id,code,numero,residence_id,bloc,etage,appartement,locataire,email').single());
        Lg.push(d); logement = d.id;
      } else if (logement) {
        const l = logSel();
        if (l && ((nom && nom !== (l.locataire || '')) || email !== (l.email || ''))) { check(await sb.from('logements').update({ locataire: nom || l.locataire, email }).eq('id', logement)); l.locataire = nom || l.locataire; l.email = email; }
      }
      const i = check(await sb.from('invitations').insert({ logement_id: logement, nom_affichage: nom || null, email: email || null, type_occupant: $('#to').value, responsable: $('#rp').value.trim() || null, date_fin_occupation: $('#fo').value || null, is_adress: $('#ia').checked, is_admin: $('#ad').checked }).select('*').single());
      toast('Invitation créée.'); partager(i);
      if (logement) enAttente.set(logement, i.nom_affichage || 'code envoyé');
      ['#nb', '#ne', '#nap'].forEach(s => $(s).value = ''); majLogements();
    } catch (ex) { err(errMsg(ex)); }
    go.disabled = false;
  };
  const trouve = (b) => (inv.data || []).find(x => x.code === b.closest('[data-code]').dataset.code);
  box.querySelectorAll('[data-wa]').forEach(b => b.onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(message(trouve(b))), '_blank', 'noopener'));
  box.querySelectorAll('[data-cp]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(message(trouve(b))); toast('Message copié.'); } catch (_) { toast(trouve(b).code); } });
  filtres(box.querySelector('#invs'), [['attente', 'En attente'], ['expiree', 'Expirées', 1], ['active', 'Activées']], 'invitations', 'Rechercher un nom, un logement, un code…');
  // Code expiré : un nouveau code pour la même personne, en un clic
  box.querySelectorAll('[data-renew]').forEach(b => b.onclick = async () => { const o = trouve(b); b.disabled = true;
    try { const l = Lg.find(x => x.id === o.logement_id);
      const i = check(await sb.from('invitations').insert({ logement_id: o.logement_id, nom_affichage: l?.locataire || o.nom_affichage, email: l?.email || o.email, type_occupant: o.type_occupant, responsable: o.responsable, date_fin_occupation: o.date_fin_occupation, is_adress: o.is_adress, is_admin: o.is_admin }).select('*').single());
      check(await sb.from('invitations').delete().eq('code', o.code)); toast('Nouveau code créé.'); partager(i); b.closest('tr').remove();
    } catch (ex) { b.disabled = false; toast(errMsg(ex)); } });
  box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirm('Supprimer cette invitation ?') && action(async () => check(await sb.from('invitations').delete().eq('code', trouve(b).code)), 'Invitation supprimée.'));
}

// Lecture d'une feuille « SUIVI RÉSIDENCE » (base propre) : ligne d'en-tête BLOC…, colonnes BLOC / ETAGE / APP. ou APPARTEMENT / LOCATAIRE / MAIL.
// Code = BLOC-ÉTAGE-APPARTEMENT normalisé (RDJ, RDC, 1ER, 2E…, PENTHOUSE). Plusieurs lignes pour un même logement = historique : la dernière remplie est gardée.
const EMAIL_RE = /[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
// Fichier BASE VILLA : NOM DE LA VILLA | NOM TECHNIQUE | LOCATAIRE | MAIL, toutes les villas sur une feuille.
// Chaque « nom de villa » devient une résidence « VILLA <NOM> » ; chaque nom technique (A1, V3, 1…) un logement de type Villa.
// Code d'une villa = PRÉFIXE-NOM TECHNIQUE (LUM-A1, HER-B1, EME-V3) : unique sans avoir à préciser l'ensemble
const prefVilla = (nom) => (norm(nom).toUpperCase().replace(/^VILLAS?\s+/, '').replace(/[^A-Z0-9]/g, '') || 'VIL').slice(0, 3);
const techVilla = (app, nom) => { const t = String(app || '').toUpperCase(), p = prefVilla(nom) + '-'; return t.startsWith(p) ? t.slice(p.length) : t; };
const codeVilla = (nom, tech) => prefVilla(nom) + '-' + techVilla(tech, nom).replace(/[^A-Z0-9]/g, '');
const nomResVilla = (n) => { const t = String(n || '').trim().replace(/\s+/g, ' ').toUpperCase(); return /^VILLAS?\b/.test(t) ? t : 'VILLA ' + t; };
// Colonnes attendues dans les fichiers d'import : [en-tête, variantes reconnues, valeur obligatoire sur chaque ligne, exemple]
// Les 4 ou 5 colonnes doivent toutes exister. LOCATAIRE et MAIL peuvent rester vides sur une ligne (logement ou villa libre).
const COLS_RES = [['BLOC', ['bloc'], 'oui (peut ne figurer que sur la 1re ligne du bloc)', 'A'], ['ETAGE', ['etage'], 'oui (ou APP.)', 'RDC, 1ER, 2E, PENTHOUSE'], ['APP.', ['app', 'appartement'], 'oui', 'A001'], ['LOCATAIRE', ['locataire'], 'non (vide = logement libre)', 'Awa Koné'], ['MAIL', ['mail', 'email', 'e-mail'], 'non, mais indispensable pour inviter', 'awa.kone@exemple.com']];
const COLS_VIL = [['NOM DE LA VILLA', ['nom de la villa', 'villa'], 'oui (peut ne figurer que sur la 1re ligne)', 'LUMIERE'], ['NOM TECHNIQUE', ['nom technique'], 'oui', 'A1'], ['LOCATAIRE', ['locataire'], 'non (vide = villa libre)', 'Awa Koné'], ['MAIL', ['mail', 'email', 'e-mail'], 'non, mais indispensable pour inviter', 'awa.kone@exemple.com']];
const NOM_FEUILLE_GENERIQUE = /^(feuil|feuille|sheet|tableau|onglet)\s*\d*$/i;
// Contrôle d'une feuille avant import : format reconnu, colonnes manquantes, nom de feuille
function controlerFeuille(nom, rows) {
  const villa = rows.findIndex(r => (r || []).some(c => norm(c).startsWith('nom technique')));
  const res = rows.findIndex(r => (r || []).some(c => norm(c) === 'bloc'));
  if (villa < 0 && res < 0) {
    const vide = !rows.some(r => (r || []).some(c => String(c ?? '').trim()));
    return { nom, ignoree: true, raison: vide ? 'feuille vide' : 'aucune ligne d’en-tête reconnue (BLOC… ou NOM DE LA VILLA…)' };
  }
  const estV = villa >= 0, spec = estV ? COLS_VIL : COLS_RES;
  const H = rows[estV ? rows.reduce((d, r, i) => (r || []).some(c => norm(c).startsWith('nom technique')) ? i : d, -1) : res].map(norm);
  const manquantes = spec.filter(([, k]) => !H.some(h => k.some(x => h === x || h.startsWith(x)))).map(([t]) => t);
  const erreurs = [];
  if (manquantes.length) erreurs.push(`colonne${manquantes.length > 1 ? 's' : ''} manquante${manquantes.length > 1 ? 's' : ''} : ${manquantes.join(', ')}`);
  if (!estV && NOM_FEUILLE_GENERIQUE.test(nom.trim())) erreurs.push(`le nom de la feuille devient le nom de la résidence : renommez « ${nom} » avec le nom de la résidence (ex. AYOKA)`);
  return { nom, villa: estV, erreurs };
}
function lireVillas(rows, off = 1) {
  let hi = -1; rows.forEach((r, i) => { if ((r || []).some(c => norm(c).startsWith('nom technique'))) hi = i; }); // dernière ligne d'en-tête (le fichier en répète une)
  const H = rows[hi].map(norm), col = (...k) => H.findIndex(h => k.some(x => h === x || h.startsWith(x)));
  const iV = col('nom de la villa', 'villa'), iT = col('nom technique'), iL = col('locataire'), iM = col('mail', 'email', 'e-mail');
  const groupes = new Map(); let villa = '', prec = null;
  for (const [k, r] of rows.slice(hi + 1).entries()) { const ligne = off + hi + 1 + k;
    const g = (i) => i < 0 || r?.[i] == null ? '' : String(r[i]).trim();
    if (![iV, iT, iL, iM].some(i => g(i))) continue;
    const mails = (g(iM).match(EMAIL_RE) || []).map(m => m.toLowerCase());
    const loc = g(iL).replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    // Ligne sans villa ni nom technique : suite de la villa précédente (ex. locataire écrit une ligne plus bas)
    if (!g(iV) && !g(iT)) { if (prec) { if (!prec.locataire) prec.locataire = loc; if (!prec.email) prec.email = mails[0] || ''; } continue; }
    if (g(iV)) villa = nomResVilla(g(iV));
    const tech = norm(g(iT)).toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!villa || !tech) continue;
    if (!groupes.has(villa)) groupes.set(villa, { nom: villa, lignes: [], doublons: [], autresMails: [] });
    const G = groupes.get(villa);
    if (mails.length > 1) G.autresMails.push({ code: tech, autres: mails.slice(1) });
    const deja = G.lignes.find(x => x.appartement === codeVilla(villa, tech));
    const l = { bloc: '', etage: '', appartement: codeVilla(villa, tech), locataire: loc, email: mails[0] || '', ligne };
    if (deja) { if (l.locataire || l.email) { if (deja.locataire || deja.email) G.doublons.push({ code: tech, garde: l.locataire, ignores: [deja.locataire] }); Object.assign(deja, l); } prec = deja; }
    else { G.lignes.push(l); prec = l; }
  }
  return [...groupes.values()];
}
function lireFeuille(rows, off = 1) {
  const hi = rows.findIndex(r => (r || []).some(c => norm(c) === 'bloc'));
  if (hi < 0) return { lignes: [], doublons: [], autresMails: [] };
  const H = rows[hi].map(norm);
  const col = (...k) => H.findIndex(h => k.some(x => h === x || h.startsWith(x)));
  const iB = col('bloc'), iE = col('etage'), iA = col('app', 'appartement'), iL = col('locataire'), iM = col('mail', 'email', 'e-mail');
  const etage = (e) => { const s = norm(e).toUpperCase().replace(/\s+/g, ' ');
    if (!s) return ''; if (/^PENT/.test(s)) return 'PENTHOUSE'; if (/^(RDJ|RDC)/.test(s)) return s.slice(0, 3);
    const m = s.match(/\d+/); if (m) return +m[0] === 1 ? '1ER' : m[0] + 'E'; return s.replace(/\s+/g, ''); };
  let bloc = '', vu = new Map(), ordre = [], autresMails = [];
  for (const [k, r] of rows.slice(hi + 1).entries()) { const ligne = off + hi + 1 + k;
    const g = (i) => i < 0 || r?.[i] == null ? '' : String(r[i]).trim();
    if (![iB, iE, iA, iL, iM].some(i => g(i))) continue;
    let b = norm(g(iB)).toUpperCase().replace(/^BLOC\s*/, '').replace(/\s+/g, '');
    if (b) bloc = b;
    let e = etage(g(iE)), a = g(iA);
    const gm = a.match(/\(\s*app\s*(\d+)\s*\)/i);
    a = gm ? gm[1] : norm(a).toUpperCase().replace(/^APP[\s.,]*/, '').replace(/[\s.,]+/g, '');
    if (/^PENT/.test(a)) { e = 'PENTHOUSE'; a = a.replace(/^PENT(HOUSE)?/, ''); }
    const pl = norm(g(iE)).toUpperCase().match(/^PENTHOUSE\s+([A-Z])$/); if (pl) b = pl[1];
    const la = a.match(/^([A-Z])\d/); const bl = la ? la[1] : (pl ? pl[1] : bloc);
    if (!e && !a) continue;
    const mails = (g(iM).match(EMAIL_RE) || []).map(m => m.toLowerCase());
    const l = { bloc: bl, etage: e, appartement: a, locataire: g(iL).replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim(), email: mails[0] || '', ligne };
    const code = [l.bloc, l.etage, l.appartement].filter(Boolean).join('-');
    if (mails.length > 1) autresMails.push({ code, autres: mails.slice(1) });
    if (!vu.has(code)) { vu.set(code, []); ordre.push(code); }
    vu.get(code).push(l);
  }
  const doublons = [];
  // Appartement non identifié (vide ou égal à l'étage, ex. AYOKA « RDC ») répété : ce sont des logements distincts, numérotés 1, 2…
  for (const code of [...ordre]) { const t = vu.get(code), x = t[0];
    if (t.length > 1 && x.etage !== 'PENTHOUSE' && (!x.appartement || x.appartement === x.etage)) {
      ordre.splice(ordre.indexOf(code), 1, ...t.map((l, i) => { l.appartement = String(i + 1); const c = [l.bloc, l.etage, l.appartement].join('-'); vu.set(c, [l]); return c; }));
      vu.delete(code); } }
  const lignes = ordre.map(code => { const t = vu.get(code); const pleins = t.filter(x => x.locataire || x.email);
    const garde = pleins.length ? pleins[pleins.length - 1] : t[t.length - 1];
    if (pleins.length > 1) doublons.push({ code, garde: garde.locataire, ignores: pleins.slice(0, -1).map(x => x.locataire) });
    return garde; });
  return { lignes, doublons, autresMails };
}

// ---------- Fenêtre de confirmation centrée (remplace confirm() du navigateur, trop sec et mal placé) ----------
function dialogue({ titre, corps = '', ok = 'Confirmer', annuler = 'Annuler', danger = false, saisie = null, extra = null }) {
  return new Promise((res) => {
    const bg = document.createElement('div'); bg.className = 'dlg-bg';
    bg.innerHTML = `<div class="dlg${danger ? ' danger' : ''}" role="alertdialog" aria-modal="true" aria-labelledby="dlgT" aria-describedby="dlgC">
      <h2 id="dlgT">${esc(titre)}</h2><div id="dlgC" class="dlg-c">${corps}</div>
      ${saisie ? `<label for="dlgI">${saisie.label}</label><input id="dlgI" type="text" autocomplete="off" spellcheck="false" autocapitalize="characters">` : ''}
      <div class="dlg-b">${annuler ? `<button type="button" class="btn ghost" data-r="0">${esc(annuler)}</button>` : ''}<button type="button" class="btn${danger ? ' dlg-rouge' : ''}" data-r="1">${esc(ok)}</button></div>
      ${extra ? `<button type="button" class="lnk dlg-x" data-r="x">${esc(extra)}</button>` : ''}</div>`;
    document.body.appendChild(bg); document.body.classList.add('dlg-on');
    const prev = document.activeElement, okb = bg.querySelector('[data-r="1"]');
    const fin = (v) => { bg.remove(); document.body.classList.remove('dlg-on'); removeEventListener('keydown', clav, true); prev?.focus?.(); res(v); };
    const clav = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); fin(false); }
      if (e.key === 'Tab') { const f = [...bg.querySelectorAll('button:not([disabled]),input')]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus(); } };
    addEventListener('keydown', clav, true);
    bg.querySelectorAll('[data-r]').forEach(b => b.onclick = () => fin(b.dataset.r === '1' ? true : b.dataset.r === 'x' ? 'x' : false));
    bg.onclick = (e) => { if (e.target === bg) fin(false); };
    if (saisie) { const i = bg.querySelector('#dlgI'); const verif = () => { okb.disabled = norm(i.value) !== norm(saisie.attendu); }; i.oninput = verif; verif(); i.onkeydown = (e) => { if (e.key === 'Enter' && !okb.disabled) fin(true); }; setTimeout(() => i.focus(), 30); }
    else setTimeout(() => (danger ? bg.querySelector('[data-r="0"]') || okb : okb).focus(), 30);
  });
}
const li = (t) => `<li>${t}</li>`;
// Retirer le locataire d'un logement : le logement reste, sans locataire
async function retirerLocataire(x, { compte, codeEnAttente }) {
  const nom = x.locataire || compte || 'le locataire';
  const r = await dialogue({ titre: `Retirer ${nom} du logement ${x.code} ?`, ok: 'Retirer le locataire', danger: true, extra: 'Il quitte définitivement la résidence ? Supprimer le locataire…',
    corps: `<p>À utiliser quand le locataire <b>quitte le logement</b>.</p><ul>
      ${li(`Le logement <b>${esc(x.code)}</b> reste dans la liste et devient <b>libre</b>.`)}
      ${li(`Le nom et l’e-mail de <b>${esc(nom)}</b> sont effacés de cette fiche.`)}
      ${compte ? li('Son accès à ADRESS CLUB est coupé et ses annonces sont mises en pause. <b>Rien n’est supprimé</b> : avec un nouveau code, il retrouve tout.') : ''}
      ${codeEnAttente ? li('Son code d’invitation en attente est annulé.') : ''}</ul>` });
  if (r === 'x') return supprimerLocataire(x);
  if (!r) return;
  action(async () => {
    if (compte) check(await sb.from('profiles').update({ statut: 'desactive' }).eq('logement_id', x.id).eq('statut', 'actif'));
    check(await sb.from('invitations').delete().eq('logement_id', x.id).is('utilisee_par', null));
    check(await sb.from('logements').update({ locataire: null, email: null }).eq('id', x.id));
  }, `${x.code} est maintenant libre.`);
}
// Supprimer le locataire : il quitte définitivement la résidence. Le logement reste (libre) ; deux confirmations.
async function supprimerLocataire(x) {
  const { data: P } = await sb.from('profiles').select('id,nom_affichage,statut').eq('logement_id', x.id);
  const comptes = P || [];
  const nom = x.locataire || comptes[0]?.nom_affichage || x.email || 'ce locataire';
  const r1 = await dialogue({ titre: `Supprimer ${nom} ?`, ok: 'Continuer', danger: true,
    corps: `<p>À utiliser quand ${esc(nom)} <b>quitte définitivement la résidence</b>. Le logement <b>${esc(x.code)}</b> reste et redevient libre.</p><ul>
      ${li(`Son nom et son e-mail sont effacés de Nos locataires.`)}
      ${comptes.length ? li(`Son compte ADRESS CLUB est <b>fermé</b> et détaché de la résidence : il ne peut plus se connecter, ses annonces sont retirées du Market.`) : li('Il n’avait pas encore de compte ADRESS CLUB.')}
      ${li('Ses codes d’invitation non utilisés sont annulés.')}
      ${li('<b>Différence avec « Retirer »</b> : il ne pourra revenir qu’avec une nouvelle invitation, comme un nouveau locataire.')}</ul>` });
  if (!r1) return;
  const r2 = await dialogue({ titre: 'Dernière confirmation', ok: 'Supprimer le locataire', danger: true,
    corps: `<p>Pour confirmer le départ définitif de <b>${esc(nom)}</b>, tapez le code du logement : <b class="dlg-code">${esc(x.code)}</b></p>`, saisie: { label: 'Code du logement', attendu: x.code } });
  if (!r2) return;
  action(async () => {
    if (comptes.length) check(await sb.from('profiles').update({ statut: 'desactive', logement_id: null, residence_id: null }).in('id', comptes.map(p => p.id)));
    check(await sb.from('invitations').delete().eq('logement_id', x.id).is('utilisee_par', null));
    check(await sb.from('logements').update({ locataire: null, email: null }).eq('id', x.id));
  }, `${nom} a été supprimé. ${x.code} est libre.`);
}
// Supprimer le logement lui-même (ligne créée par erreur, logement qui n'existe plus) : depuis « Modifier », deux confirmations.
// Un compte résident rattaché est désactivé et détaché, sans perdre ses annonces ni son historique.
async function supprimerLogement(x) {
  const { data: P } = await sb.from('profiles').select('id,nom_affichage,statut').eq('logement_id', x.id);
  const comptes = P || [], actifs = comptes.filter(p => p.statut === 'actif');
  const qui = x.locataire || comptes[0]?.nom_affichage || x.email || '';
  const r1 = await dialogue({ titre: `Supprimer ${qui ? qui + ' et ' : ''}le logement ${x.code} de la base ?`, ok: 'Continuer', danger: true,
    corps: `<p>Différent de « Retirer » : ici <b>la ligne entière</b> disparaît, le logement comme son locataire.</p><ul>
      ${li(`<b>${esc(x.code)}</b> est effacé de Nos locataires et du plan de la résidence.`)}
      ${qui ? li(`<b>${esc(qui)}</b> n’apparaît plus dans la liste des locataires.`) : ''}
      ${actifs.length ? li(`Son compte ADRESS CLUB est <b>désactivé</b> : il ne peut plus se connecter et ses annonces sont mises en pause. Ses annonces et son historique sont conservés : avec un nouveau code, il retrouve tout.`) : comptes.length ? li('Son ancien compte (déjà désactivé) est détaché de ce logement.') : ''}
      ${li('Les codes d’invitation non utilisés pour ce logement sont annulés.')}
      ${li('<b>Action définitive</b> : pour le retrouver, il faudra le recréer ou réimporter le fichier Excel.')}</ul>
      <p class="muted small">À utiliser pour une ligne enregistrée par erreur, un logement qui n’existe plus, ou un locataire à effacer complètement.</p>` });
  if (!r1) return;
  const r2 = await dialogue({ titre: 'Dernière confirmation', ok: 'Supprimer définitivement', danger: true,
    corps: `<p>Pour éviter toute erreur, tapez le code du logement : <b class="dlg-code">${esc(x.code)}</b></p>`, saisie: { label: 'Code du logement', attendu: x.code } });
  if (!r2) return;
  action(async () => {
    if (comptes.length) check(await sb.from('profiles').update({ statut: 'desactive', logement_id: null }).in('id', comptes.map(p => p.id)));
    check(await sb.from('invitations').delete().eq('logement_id', x.id).is('utilisee_par', null));
    check(await sb.from('invitations').update({ logement_id: null }).eq('logement_id', x.id));
    check(await sb.from('logements').delete().eq('id', x.id));
  }, `${x.code} a été supprimé de la base.`);
}

// ---------- Saisie guidée Bloc / Étage / Appartement : même nomenclature que l'import (RDJ, RDC, 1ER, 2E…, PENTHOUSE) ----------
// Villas : pas de bloc ni d'étage, le logement est repéré par son nom technique (A1, V3…) ; type_logement = 'Villa'
const estVilla = (x) => /^villa/i.test(x?.type_logement || '');
const ancienCode = (x) => !!x && !x.bloc && !estVilla(x);
const ETAGES_STD = ['RDJ', 'RDC', '1ER', ...Array.from({ length: 14 }, (_, i) => (i + 2) + 'E'), 'PENTHOUSE'];
const normEtage = (e) => { const s = norm(e).toUpperCase().replace(/\s+/g, ' '); if (!s) return ''; if (/^PENT/.test(s)) return 'PENTHOUSE'; if (/^(RDJ|RDC)/.test(s)) return s.slice(0, 3); const m = s.match(/^\d+/); return m ? (+m[0] === 1 ? '1ER' : +m[0] + 'E') : s; };
const majApp = (inp) => { inp.maxLength = 4; inp.autocomplete = 'off'; inp.oninput = () => { const v = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); if (v !== inp.value) inp.value = v; }; };
const majBloc = (inp) => { inp.maxLength = 2; inp.autocomplete = 'off'; inp.oninput = () => { const v = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2); if (v !== inp.value) inp.value = v; }; };
// Liste d'étages qui se filtre à la frappe ; seule une valeur de la liste est acceptée
function listeEtages(inp, extra = []) {
  const opts = [...new Set([...ETAGES_STD, ...extra.filter(Boolean)])].sort((a, b) => RANG_ET(a) - RANG_ET(b) || (ETAGES_STD.indexOf(a) + 1 || 99) - (ETAGES_STD.indexOf(b) + 1 || 99) || a.localeCompare(b));
  const box = document.createElement('div'); box.className = 'combo'; inp.before(box); box.appendChild(inp);
  // La liste est posée sur la page (et non dans le tableau) pour ne jamais être coupée par un cadre défilant
  const lst = document.createElement('div'); lst.className = 'combo-list combo-flot'; lst.setAttribute('role', 'listbox'); lst.hidden = true; document.body.appendChild(lst);
  const placer = () => { const r = inp.getBoundingClientRect(); Object.assign(lst.style, { left: r.left + 'px', top: (r.bottom + 4) + 'px', width: Math.max(r.width, 160) + 'px' }); };
  addEventListener('scroll', (ev) => { if (!lst.hidden && ev.target !== lst) { if (!inp.isConnected) return lst.remove(); placer(); } }, true);
  addEventListener('hashchange', () => lst.remove(), { once: true });
  Object.assign(inp, { autocomplete: 'off', placeholder: 'Choisir : RDJ, 1ER…' }); inp.setAttribute('role', 'combobox'); inp.setAttribute('aria-expanded', 'false');
  let vis = [], idx = 0;
  const fermer = () => { lst.hidden = true; inp.setAttribute('aria-expanded', 'false'); };
  const choisir = (o) => { inp.value = o; inp.removeAttribute('aria-invalid'); fermer(); };
  const montrer = (q) => { const t = norm(q), n = normEtage(q);
    vis = opts.filter(o => !t || norm(o).includes(t) || o === n); idx = Math.max(0, vis.indexOf(normEtage(inp.value)));
    lst.innerHTML = vis.length ? vis.map((o, i) => `<div class="combo-it${i === idx ? ' sel' : ''}" role="option" data-o="${esc(o)}"><b>${esc(o)}</b></div>`).join('') : '<div class="combo-vide">Étage inconnu : choisissez dans la liste.</div>';
    placer(); lst.hidden = false; inp.setAttribute('aria-expanded', 'true');
    lst.querySelectorAll('[data-o]').forEach(d => d.onmousedown = (ev) => { ev.preventDefault(); choisir(d.dataset.o); }); };
  inp.onfocus = () => { montrer(''); lst.children[idx]?.scrollIntoView({ block: 'nearest' }); };
  inp.oninput = () => montrer(inp.value);
  inp.onkeydown = (ev) => { if (lst.hidden) return;
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); idx = (idx + (ev.key === 'ArrowDown' ? 1 : -1) + vis.length) % Math.max(vis.length, 1); lst.querySelectorAll('[data-o]').forEach((d, i) => d.classList.toggle('sel', i === idx)); lst.children[idx]?.scrollIntoView({ block: 'nearest' }); }
    if (ev.key === 'Enter') { ev.preventDefault(); if (vis[idx]) choisir(vis[idx]); }
    if (ev.key === 'Escape') fermer(); };
  inp.onblur = () => setTimeout(() => { fermer(); const n = normEtage(inp.value); if (opts.includes(n)) inp.value = n; }, 120);
  return { ok: () => !inp.value.trim() || opts.includes(normEtage(inp.value)), val: () => normEtage(inp.value) };
}

// ---------- Annuaire des locataires : Bloc-Étage-Appartement + e-mail, import Excel ----------
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const chargerXlsx = () => window.XLSX ? Promise.resolve(window.XLSX) : new Promise((ok, ko) => { const s = document.createElement('script'); s.src = XLSX_URL; s.onload = () => ok(window.XLSX); s.onerror = () => ko(new Error('Lecture Excel indisponible (réseau).')); document.head.appendChild(s); });
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
async function annuaire(box) {
  const [res, log, occ, inv] = await Promise.all([
    sb.from('residences').select('id,nom,type_bien').order('nom'),
    sb.from('logements').select('id,code,residence_id,bloc,etage,appartement,locataire,email,actif,type_logement').eq('actif', true).order('code'),
    sb.from('profiles').select('logement_id,nom_affichage').eq('statut', 'actif').not('logement_id', 'is', null),
    sb.from('invitations').select('logement_id,expire_le,utilisee_par,created_at').is('utilisee_par', null).order('created_at', { ascending: false })]);
  const R = res.data || [], L = log.data || [];
  const occupant = new Map((occ.data || []).map(p => [p.logement_id, p.nom_affichage || '']));
  const codes = new Map(); (inv.data || []).forEach(i => { if (i.logement_id && !codes.has(i.logement_id)) codes.set(i.logement_id, i); });
  const vivant = (id) => { const i = codes.get(id); return i && new Date(i.expire_le) > new Date() ? i : null; };
  // Même e-mail sur plusieurs logements : un e-mail = un seul compte possible
  const parMail = new Map(); L.forEach(x => { if (x.email) parMail.set(x.email, (parMail.get(x.email) || 0) + 1); });
  const suggestion = (m) => { const s = String(m || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').toLowerCase(); return s !== m && EMAIL_OK(s) ? s : ''; };
  const memeNom = (a, b) => { const t = (s) => norm(s).split(/[^a-z0-9]+/).filter(w => w.length > 1); const A = t(a), B = t(b); return !A.length || !B.length || A.some(w => B.includes(w)); };
  const etat = (x) => occupant.has(x.id) ? 'actif' : vivant(x.id) ? 'code' : codes.has(x.id) ? 'expire' : 'libre';
  // Un seul message par problème : l'e-mail et le nom manquants s'affichent à leur place (en rouge), pas une seconde fois dessous
  const problemes = (x) => {
    const p = [];
    if (!x.locataire && !x.email && !occupant.has(x.id)) return p; // logement libre : rien à corriger
    if (ancienCode(x)) return [{ t: 'Ancien code : rattachez ce compte au bon appartement (Comptes › Logement)' }];
    if (!x.email) p.push({ k: 'mail' });
    else if (!EMAIL_OK(x.email)) p.push({ k: 'mail', fix: suggestion(x.email) });
    else if (parMail.get(x.email) > 1) p.push({ t: `Même e-mail sur ${parMail.get(x.email)} logements : une seule personne pourra se connecter` });
    if (!x.locataire) p.push({ k: 'nom' });
    if (occupant.has(x.id) && x.locataire && occupant.get(x.id) && !memeNom(occupant.get(x.id), x.locataire)) p.push({ t: `Compte actif au nom de « ${occupant.get(x.id)} » : nouveau locataire ? Retirez l’ancien compte dans Comptes` });
    return p;
  };
  const choisie = annuaire._sel && R.find(r => norm(r.nom) === norm(annuaire._sel)); annuaire._sel = '';
  let rid = choisie ? choisie.id : annuaire._rid && R.some(r => r.id === annuaire._rid) ? annuaire._rid : (R.find(r => L.some(l => l.residence_id === r.id && l.bloc)) || R[0])?.id;
  let filtre = annuaire._f || 'tous', q = '';
  const deuxTypes = R.some(resVilla) && R.some(r => !resVilla(r));
  const statut = (x) => {
    const e = etat(x), i = codes.get(x.id);
    return e === 'actif' ? `<span class="st-l actif">Compte actif</span>${occupant.get(x.id) ? `<div class="muted small">${esc(occupant.get(x.id))}</div>` : ''}`
      : e === 'code' ? `<span class="st-l code">Code envoyé</span><div class="muted small">valable jusqu’au ${dateFr(i.expire_le)}</div>`
      : e === 'expire' ? '<span class="st-l">Code expiré</span>'
      : x.locataire || x.email ? '<span class="st-l">Pas encore invité</span>' : '<span class="st-l">Logement libre</span>';
  };
  const dessiner = () => {
    annuaire._rid = rid; annuaire._f = filtre;
    const l = L.filter(x => x.residence_id === rid).sort(triLog);
    const resA = R.find(r => r.id === rid); const villa = l.some(estVilla) || resVilla(resA);
    const nb = { tous: l.length, pb: l.filter(x => problemes(x).length).length, libre: l.filter(x => (x.locataire || x.email) && ['libre', 'expire'].includes(etat(x))).length, vide: l.filter(x => !x.locataire && !x.email && !occupant.has(x.id)).length, code: l.filter(x => etat(x) === 'code').length, actif: l.filter(x => etat(x) === 'actif').length };
    if (filtre === 'pb' && !nb.pb) filtre = 'tous';
    const FILTRES = [['tous', 'Tous'], ['pb', 'À corriger'], ['libre', 'À inviter'], ['code', 'Code envoyé'], ['actif', 'Comptes actifs'], ['vide', villa ? 'Villas libres' : 'Logements libres']];
    box.innerHTML = `
    <div class="card">
      <div class="ann-top"><div>${deuxTypes ? choixType(typeDe(resA), R.filter(r => !resVilla(r)).length, R.filter(resVilla).length) : ''}<label for="ar" style="margin-top:${deuxTypes ? '12px' : '0'}">${resVilla(resA) ? 'Ensemble de villas' : 'Résidence'}</label><select id="ar">${optionsRes(deuxTypes ? R.filter(r => typeDe(r) === typeDe(resA)) : R, rid, r => `${esc(r.nom)} (${L.filter(x => x.residence_id === r.id).length})`)}</select></div>
      <div class="ann-btns"><button type="button" class="btn" id="addLog" aria-expanded="false" aria-controls="faBox"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>${villa ? 'Ajouter une villa' : 'Ajouter un logement'}</button><button type="button" class="btn xl" id="xlGo" aria-expanded="false" aria-controls="imp" style="margin:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>Importer un fichier Excel</button><input id="xl" type="file" accept=".xlsx,.xls,.csv" class="sr"></div></div>
      <div id="imp"></div></div>
    <div class="card ann-add" id="faBox" hidden><h3>Nouveau logement</h3><form id="fa" novalidate style="margin-top:6px"><div class="g3f"><div ${villa ? 'hidden' : ''}><label for="ab">Bloc</label><input type="text" id="ab" placeholder="A"></div><div ${villa ? 'hidden' : ''}><label for="ae">Étage</label><input type="text" id="ae"></div><div><label for="aa">${villa ? 'Nom technique de la villa (ex. A1)' : 'Appartement (4 caractères max.)'}</label><input type="text" id="aa" placeholder="${villa ? 'A1' : 'A001'}"></div></div>
      <div class="grid2"><div><label for="an">Locataire</label><input type="text" id="an"></div><div><label for="am">E-mail</label><input id="am" type="email"></div></div>
      <div class="row" style="margin-top:12px"><button class="btn">Ajouter le logement</button><button type="button" class="btn ghost" id="faNo">Annuler</button></div></form></div>
    <div class="ann-bar"><h2>${l.length} ${villa ? 'villa' : 'logement'}${l.length > 1 ? 's' : ''}</h2><input type="search" id="aq" placeholder="Rechercher un logement, un nom, un e-mail…" autocomplete="off"></div>
    <div class="chips ann-f">${FILTRES.filter(([k]) => k === 'tous' || nb[k]).map(([k, t]) => `<button type="button" class="chip ${k === filtre ? 'on' : ''}${k === 'pb' ? ' pb' : ''}" data-f="${k}">${t} <span>${nb[k]}</span></button>`).join('')}</div>
    <div tabindex="0" style="overflow-x:auto"><table class="adm no-q"><thead><tr><th>Logement</th><th>Locataire</th><th>Accès</th><th></th></tr></thead><tbody id="atb"></tbody></table></div>
    <p class="muted center" id="avide" hidden>Aucun logement ne correspond.</p>
`;
    const $ = (s) => box.querySelector(s);
    const lignes = () => {
      const t = norm(q).split(/\s+/).filter(Boolean);
      const vis = l.filter(x => (filtre === 'tous' || (filtre === 'pb' ? problemes(x).length : filtre === 'libre' ? (x.locataire || x.email) && ['libre', 'expire'].includes(etat(x)) : filtre === 'vide' ? !x.locataire && !x.email && !occupant.has(x.id) : etat(x) === filtre))
        && t.every(w => norm([x.code, x.locataire, x.email, occupant.get(x.id)].join(' ')).includes(w)));
      $('#atb').innerHTML = vis.map(x => { const p = problemes(x), e = etat(x); return `<tr data-id="${x.id}"><td><b>${esc(x.code)}</b></td>
        <td>${ancienCode(x) ? '<span class="muted">—</span>' : p.some(o => o.k === 'nom') ? '<span class="a-bad">Nom manquant</span>' : esc(x.locataire || '—')}${ancienCode(x) || (!x.locataire && !x.email && !occupant.has(x.id)) ? '' : x.email && EMAIL_OK(x.email) ? `<div class="small muted">${esc(x.email)}</div>` : `<div class="small a-bad">${x.email ? esc(x.email) + ' (invalide)' : 'E-mail manquant'}${p.find(o => o.fix) ? ` · <button type="button" class="lnk" data-fix="${esc(p.find(o => o.fix).fix)}">Corriger en ${esc(p.find(o => o.fix).fix)}</button>` : ''}</div>`}${p.filter(o => o.t).map(o => alerte(o.t)).join('')}</td>
        <td>${statut(x)}</td><td><div class="row" style="flex-wrap:nowrap;justify-content:flex-end">${!x.locataire && !x.email && !occupant.has(x.id) ? '<button class="btn sm" data-aff>Affecter un locataire</button>' : ''}${(e === 'libre' || e === 'expire') && EMAIL_OK(x.email) ? '<button class="btn sm ghost" data-inv>Inviter</button>' : ''}<button class="btn sm soft" data-ed>Modifier</button>${x.locataire || x.email || occupant.has(x.id) ? '<button class="btn sm ghost rouge" data-vider>Retirer</button>' : ''}${x.locataire || x.email || occupant.has(x.id) ? `<button class="btn sm ghost rouge btn-sup" data-sup aria-label="Supprimer le locataire de ${esc(x.code)}" title="Le locataire quitte définitivement la résidence"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>Supprimer</button>` : ''}</div></td></tr>`; }).join('');
      $('#avide').hidden = !!vis.length;
      brancher();
    };
    $('#ar').onchange = () => { rid = $('#ar').value; dessiner(); };
    box.querySelectorAll('.tsw [data-t]').forEach(b => b.onclick = () => { if (b.dataset.t === typeDe(resA)) return; const T = R.filter(r => typeDe(r) === b.dataset.t); rid = (T.find(r => L.some(x => x.residence_id === r.id)) || T[0]).id; filtre = 'tous'; dessiner(); });
    const ouvrirAjout = (on) => { $('#faBox').hidden = !on; $('#addLog').setAttribute('aria-expanded', on); if (on) $('#ab').focus(); };
    $('#addLog').onclick = () => ouvrirAjout($('#faBox').hidden);
    $('#faNo').onclick = () => ouvrirAjout(false);
    $('#aq').oninput = () => { q = $('#aq').value; lignes(); };
    box.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filtre = b.dataset.f; box.querySelectorAll('[data-f]').forEach(c => c.classList.toggle('on', c === b)); annuaire._f = filtre; lignes(); });
    const etAjout = listeEtages($('#ae'), l.map(x => x.etage)); majApp($('#aa')); majBloc($('#ab'));
    $('#fa').onsubmit = (e) => { e.preventDefault(); if (villa && !$('#aa').value.trim()) { $('#aa').focus(); return toast('Indiquez le nom technique de la villa (ex. A1).'); } if (!$('#ab').value.trim() && !$('#ae').value.trim() && !$('#aa').value.trim()) return toast('Indiquez le bloc, l’étage ou l’appartement.'); if (!etAjout.ok()) { $('#ae').setAttribute('aria-invalid', 'true'); $('#ae').focus(); return toast('Choisissez l’étage dans la liste.'); } const m = $('#am').value.trim().toLowerCase(); if (m && !EMAIL_OK(m)) return toast('E-mail non valide.'); action(async () => check(await sb.from('logements').insert({ residence_id: rid, code: 'tmp-' + Date.now(), bloc: $('#ab').value.trim(), etage: etAjout.val(), appartement: villa ? codeVilla(resA?.nom, $('#aa').value.trim()) : $('#aa').value.trim(), locataire: $('#an').value || null, email: m || null, type_logement: villa ? 'Villa' : 'Appartement' })), villa ? 'Villa ajoutée.' : 'Logement ajouté.'); };
    function brancher() {
    box.querySelectorAll('[data-fix]').forEach(b => b.onclick = () => action(async () => check(await sb.from('logements').update({ email: b.dataset.fix }).eq('id', b.closest('tr').dataset.id)), 'E-mail corrigé.'));
    // Retirer le locataire : le logement redevient libre ; son compte (s'il en a un) est fermé sans perte, son code en attente annulé
    box.querySelectorAll('[data-vider]').forEach(b => b.onclick = () => {
      const x = L.find(y => y.id === b.closest('tr').dataset.id); if (!x) return;
      retirerLocataire(x, { compte: occupant.has(x.id) ? (occupant.get(x.id) || 'ce résident') : null, codeEnAttente: !!vivant(x.id) });
    });
    box.querySelectorAll('[data-sup]').forEach(b => b.onclick = () => { const x = L.find(y => y.id === b.closest('tr').dataset.id); if (x) supprimerLocataire(x); });
    // Logement libre : créer le locataire et l'affecter en une fois (puis, au choix, l'inviter tout de suite)
    box.querySelectorAll('[data-aff]').forEach(b => b.onclick = () => {
      const tr = b.closest('tr'), x = L.find(y => y.id === tr.dataset.id); if (!x) return;
      tr.innerHTML = `<td colspan="4"><form class="ann-ed ann-aff" novalidate><b>Affecter un locataire au logement ${esc(x.code)}</b>
        <div class="grid2"><div><label for="ffn">Nom du locataire</label><input type="text" id="ffn" placeholder="Prénom et nom" autocomplete="off"></div><div><label for="ffm">E-mail (pour se connecter)</label><input id="ffm" type="email" placeholder="prenom.nom@exemple.com" autocomplete="off"></div></div>
        <p class="err small" id="fferr" hidden></p>
        <div class="row" style="margin-top:10px"><button class="btn sm" data-go="inv">Affecter et inviter par WhatsApp</button><button class="btn sm soft" type="button" data-go="seul">Affecter seulement</button><button class="btn sm ghost" type="button" data-x>Annuler</button></div></form></td>`;
      const f = tr.querySelector('form'), err = (m) => { f.querySelector('#fferr').textContent = m; f.querySelector('#fferr').hidden = !m; };
      f.querySelector('#ffn').focus();
      f.querySelector('[data-x]').onclick = dessiner;
      const valider = async (inviter) => {
        const nom = f.querySelector('#ffn').value.trim(), m = f.querySelector('#ffm').value.trim().toLowerCase();
        if (!nom) return err('Saisissez le nom du locataire.');
        if (!EMAIL_OK(m)) return err('Saisissez une adresse e-mail valide (pas d’accent ni d’espace) : il en aura besoin pour créer son compte.');
        const w = inviter ? ongletWa() : null; f.querySelectorAll('button').forEach(z => z.disabled = true);
        try {
          check(await sb.from('logements').update({ locataire: nom, email: m }).eq('id', x.id));
          if (inviter) { const inv = await creerInvit({ ...x, locataire: nom, email: m }); envoyerWa(w, msgInvit(inv)); toast(`${nom} affecté à ${x.code}, invitation créée.`); }
          else toast(`${nom} affecté à ${x.code}.`);
          rerender();
        } catch (ex) { if (w) w.close(); f.querySelectorAll('button').forEach(z => z.disabled = false); err(errMsg(ex)); }
      };
      f.onsubmit = (e) => { e.preventDefault(); valider(true); };
      f.querySelector('[data-go="seul"]').onclick = () => valider(false);
    });
    box.querySelectorAll('[data-inv]').forEach(b => b.onclick = () => { invitations._pre = b.closest('tr').dataset.id; location.hash = '#/admin/invitations'; });
    box.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => {
      const tr = b.closest('tr'), x = L.find(y => y.id === tr.dataset.id);
      tr.innerHTML = `<td colspan="4"><form class="ann-ed" novalidate><div class="g3f"><div ${estVilla(x) ? 'hidden' : ''}><label>Bloc</label><input type="text" name="bloc" value="${esc(x.bloc || '')}"></div><div ${estVilla(x) ? 'hidden' : ''}><label>Étage</label><input type="text" name="etage" value="${esc(x.etage || '')}"></div><div><label>${estVilla(x) ? 'Nom technique de la villa' : 'Appartement'}</label><input type="text" name="appartement" value="${esc(estVilla(x) ? techVilla(x.appartement, resA?.nom) : x.appartement || '')}"></div></div>
        <div class="grid2"><div><label>Locataire</label><input type="text" name="locataire" value="${esc(x.locataire || '')}"></div><div><label>E-mail</label><input name="email" type="email" value="${esc(x.email || '')}"></div></div>
        <div class="row" style="margin-top:10px"><button class="btn sm">Enregistrer</button><button class="btn sm ghost" type="button" data-x>Annuler</button><button class="btn sm danger" type="button" data-off>Supprimer le logement</button></div></form></td>`;
      const f = tr.querySelector('form'), v = (n) => f.elements[n].value.trim();
      const etEd = listeEtages(f.elements.etage, l.map(y => y.etage)); majApp(f.elements.appartement); majBloc(f.elements.bloc);
      f.querySelector('[data-x]').onclick = dessiner;
      f.querySelector('[data-off]').onclick = () => supprimerLogement(x);
      f.onsubmit = (e) => { e.preventDefault(); if (!etEd.ok()) { f.elements.etage.setAttribute('aria-invalid', 'true'); f.elements.etage.focus(); return toast('Choisissez l’étage dans la liste.'); } const m = v('email').toLowerCase(); if (m && !EMAIL_OK(m)) return toast('E-mail non valide (pas d’accent ni d’espace).'); action(async () => check(await sb.from('logements').update({ bloc: v('bloc'), etage: etEd.val(), appartement: estVilla(x) ? codeVilla(resA?.nom, v('appartement')) : v('appartement'), locataire: v('locataire') || null, email: m || null }).eq('id', x.id)), 'Locataire mis à jour.'); };
    });
    }
    lignes();
    // Sauvegarde au même format que les fichiers d'import : la réimporter remet la liste telle qu'elle était
    const sauvegarder = (X, liste) => {
      const wb = X.utils.book_new(), vil = [['NOM DE LA VILLA', 'NOM TECHNIQUE', 'LOCATAIRE', 'MAIL']];
      liste.forEach(f => { const r = R.find(z => norm(z.nom) === norm(f.nom)); if (!r) return;
        const lg = L.filter(x => x.residence_id === r.id).sort(triLog);
        if (f.villa) lg.forEach(x => vil.push([r.nom, techVilla(x.appartement || x.code, r.nom), x.locataire || '', x.email || '']));
        else X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['BLOC', 'ETAGE', 'APP.', 'LOCATAIRE', 'MAIL'], ...lg.map(x => [x.bloc || '', x.etage || '', x.appartement || '', x.locataire || '', x.email || ''])]), r.nom.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31)); });
      if (vil.length > 1) X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(vil), 'NOS VILLAS');
      if (!wb.SheetNames.length) return false;
      const d = new Date(), z = (n) => String(n).padStart(2, '0');
      X.writeFile(wb, `Sauvegarde-avant-import-${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}-${z(d.getHours())}h${z(d.getMinutes())}.xlsx`); return true; };
    // Guide d'import : colonnes obligatoires pour chaque type de fichier, modèles à télécharger, puis choix du fichier
    const tabCols = (spec) => `<table class="imp-cols"><thead><tr><th>Colonne (en-tête exact)</th><th>Valeur obligatoire sur chaque ligne</th><th>Exemple</th></tr></thead><tbody>${spec.map(([t, , o, ex]) => `<tr><td><b>${esc(t)}</b></td><td>${esc(o)}</td><td class="muted">${esc(ex)}</td></tr>`).join('')}</tbody></table>`;
    const guide = (msg = '') => `<div class="imp-guide">${msg}
      <p class="imp-intro"><b>Toutes les colonnes ci-dessous doivent exister</b> dans le fichier (même vides). Sinon l’import est refusé et la colonne manquante vous est indiquée.</p>
      <div class="imp-2"><section><h4>Fichier Résidences <span class="badge soft">BASE RÉSIDENCE</span></h4>
        <p class="small">Une feuille par résidence : <b>le nom de la feuille = le nom de la résidence</b> (ex. AYOKA). Une ligne par appartement.</p>${tabCols(COLS_RES)}
        <button type="button" class="lnk" data-modele="res">Télécharger le modèle Résidences</button></section>
      <section><h4>Fichier Villas <span class="badge soft">BASE VILLA</span></h4>
        <p class="small">Toutes les villas sur une seule feuille. Chaque NOM DE LA VILLA devient un ensemble de villas (LUMIERE → VILLA LUMIERE).</p>${tabCols(COLS_VIL)}
        <button type="button" class="lnk" data-modele="vil">Télécharger le modèle Villas</button></section></div>
      <p class="small muted">Après le choix du fichier, un aperçu ligne par ligne s’affiche : rien n’est enregistré avant d’avoir cliqué sur « Importer ».</p>
      <div class="row" style="margin-top:10px"><label class="btn xl" for="xl" style="margin:0">Choisir le fichier Excel</label><button class="btn ghost" type="button" data-fermer>Fermer</button></div></div>`;
    const brancherGuide = () => { const imp = $('#imp');
      imp.querySelectorAll('[data-modele]').forEach(b => b.onclick = async () => { const X = await chargerXlsx(), wb = X.utils.book_new();
        if (b.dataset.modele === 'vil') X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([COLS_VIL.map(c => c[0]), ['LUMIERE', 'A1', 'Awa Koné', 'awa.kone@exemple.com'], ['LUMIERE', 'A2', '', ''], ['HERMES', 'B1', 'Yao Kouassi', 'yao.kouassi@exemple.com']]), 'NOS VILLAS');
        else X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([COLS_RES.map(c => c[0]), ['A', 'RDC', 'A001', 'Awa Koné', 'awa.kone@exemple.com'], ['', '1ER', 'A101', '', ''], ['B', 'RDC', 'B001', 'Yao Kouassi', 'yao.kouassi@exemple.com']]), 'NOM DE LA RESIDENCE');
        X.writeFile(wb, b.dataset.modele === 'vil' ? 'Modele-import-VILLAS.xlsx' : 'Modele-import-RESIDENCES.xlsx'); });
      imp.querySelectorAll('[data-fermer]').forEach(b => b.onclick = () => { imp.innerHTML = ''; $('#xlGo').setAttribute('aria-expanded', 'false'); }); };
    $('#xlGo').onclick = () => { const imp = $('#imp'), ouvert = !!imp.querySelector('.imp-guide');
      imp.innerHTML = ouvert ? '' : guide(); $('#xlGo').setAttribute('aria-expanded', String(!ouvert)); if (!ouvert) brancherGuide(); };
    $('#xl').onchange = async (e) => {
      const file = e.target.files[0]; e.target.value = ''; if (!file) return;
      const imp = $('#imp'); imp.innerHTML = '<p class="muted small">Lecture du fichier…</p>';
      try {
        const X = await chargerXlsx(); const wb = X.read(await file.arrayBuffer(), { type: 'array' });
        // Le fichier fait foi : pour chaque résidence du fichier, ce qui n'y figure plus est retiré (comptes compris, accès suspendu)
        const fiche = (f, villa) => { const r = R.find(z => norm(z.nom) === norm(f.nom));
          const cle = (x) => [x.bloc, x.etage, x.appartement].filter(Boolean).join('-').toUpperCase();
          const codesF = new Set(f.lignes.map(cle)), videsF = new Set(f.lignes.filter(x => !x.locataire && !x.email).map(cle));
          const absents = r ? L.filter(x => x.residence_id === r.id && !codesF.has(String(x.code || '').toUpperCase())) : [];
          // logement toujours dans le fichier mais sans locataire, alors qu'un compte y est actif : ce locataire est parti
          const vides = r ? L.filter(x => x.residence_id === r.id && occupant.has(x.id) && videsF.has(String(x.code || '').toUpperCase())) : [];
          // même logement, mais autre personne dans le fichier (nom ET e-mail différents) alors que l'ancien locataire a un compte actif
          const parCode = new Map(f.lignes.map(x => [cle(x), x]));
          const remplaces = r ? L.filter(x => { if (x.residence_id !== r.id || !occupant.has(x.id) || !x.email) return false; const n = parCode.get(String(x.code || '').toUpperCase());
            return n && n.email && norm(n.email) !== norm(x.email) && norm(n.locataire) !== norm(x.locataire); }) : [];
          const perdus = [...absents.filter(x => occupant.has(x.id)), ...vides, ...remplaces].map(x => `${occupant.get(x.id) || x.locataire || 'un résident'} (${x.code})`);
          const avant = r ? L.filter(x => x.residence_id === r.id && (x.locataire || x.email || occupant.has(x.id))).length : 0;
          return { ...f, villa, connue: !!r, absents, vides, remplaces, perdus, avant, apres: f.lignes.filter(x => x.locataire || x.email).length, invalides: f.lignes.filter(x => x.email && !EMAIL_OK(x.email)).length, sans: f.lignes.filter(x => x.locataire && !x.email).length }; };
        const lues = wb.SheetNames.map(n => { const ws = wb.Sheets[n]; const off = ws['!ref'] ? X.utils.decode_range(ws['!ref']).s.r + 1 : 1;
          const rows = X.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: true }); return { n, off, rows, ctl: controlerFeuille(n, rows) }; });
        const ignorees = lues.filter(x => x.ctl.ignoree), fautives = lues.filter(x => x.ctl.erreurs?.length);
        const listeIgn = ignorees.length ? `<p class="small muted">Feuille${ignorees.length > 1 ? 's' : ''} ignorée${ignorees.length > 1 ? 's' : ''} : ${ignorees.map(x => `« ${esc(x.n)} » (${esc(x.ctl.raison)})`).join(', ')}.</p>` : '';
        if (fautives.length || ignorees.length === lues.length) {
          imp.innerHTML = guide(`<div class="imp-err"><b>Import refusé : corrigez le fichier puis choisissez-le de nouveau.</b><ul>${fautives.map(x => li(`Feuille « ${esc(x.n)} » (${x.ctl.villa ? 'villas' : 'résidence'}) : ${esc(x.ctl.erreurs.join(' ; '))}`)).join('')}${ignorees.length === lues.length ? li('Aucune feuille au format attendu : vérifiez les en-têtes de colonnes ci-dessous.') : ''}</ul>${listeIgn}</div>`);
          brancherGuide(); return; }
        const feuilles = lues.filter(x => !x.ctl.ignoree).flatMap(({ n, off, rows, ctl }) => ctl.villa ? lireVillas(rows, off).map(f => fiche(f, true)) : [fiche({ nom: n.trim(), ...lireFeuille(rows, off) }, false)]).filter(f => f.lignes.length);
        if (!feuilles.length) { imp.innerHTML = guide('<div class="imp-err"><b>Aucune ligne à importer</b> : les colonnes sont présentes mais aucune ligne ne contient de logement (APP. / NOM TECHNIQUE vides).</div>'); brancherGuide(); return; }
        // Aperçu ligne par ligne : ce que chaque ligne du fichier va faire (nouveau, modifié, inchangé) et ce qui sera retiré
        const detail = (f) => { const r = R.find(z => norm(z.nom) === norm(f.nom));
          const cle = (x) => [x.bloc, x.etage, x.appartement].filter(Boolean).join('-').toUpperCase();
          const exist = new Map((r ? L.filter(x => x.residence_id === r.id) : []).map(x => [String(x.code || '').toUpperCase(), x]));
          const lignesT = f.lignes.map(x => { const o = exist.get(cle(x)); const st = !o ? 'nouveau' : norm(o.locataire) === norm(x.locataire) && norm(o.email) === norm(x.email) ? 'inchange' : 'modifie'; return { x, o, st }; });
          const n = (k) => lignesT.filter(t => t.st === k).length;
          const mail = (m) => !m ? '<span class="err small">sans e-mail</span>' : EMAIL_OK(m) ? esc(m) : `<span class="err">${esc(m)} (invalide)</span>`;
          const ET = { nouveau: '<span class="st-i nouv">Nouveau</span>', modifie: '<span class="st-i modif">Modifié</span>', inchange: '<span class="st-i">Inchangé</span>' };
          return `<details class="imp-det"${feuilles.length === 1 || n('modifie') || f.absents.length ? ' open' : ''}><summary>Voir les ${f.lignes.length} ligne${f.lignes.length > 1 ? 's' : ''} : ${[[n('nouveau'), 'nouveau(x)'], [n('modifie'), 'modifié(s)'], [n('inchange'), 'inchangé(s)'], [f.absents.length, 'retiré(s)']].filter(([k]) => k).map(([k, t]) => `${k} ${t}`).join(' · ')}</summary>
            <div style="overflow-x:auto"><table class="adm no-q imp-t"><thead><tr><th>Ligne Excel</th><th>${f.villa ? 'Villa' : 'Logement'}</th><th>Locataire</th><th>E-mail</th><th>Effet</th></tr></thead><tbody>
            ${lignesT.map(({ x, o, st }) => `<tr><td class="muted">${x.ligne || ''}</td><td><b>${esc(cle(x))}</b></td><td>${x.locataire ? esc(x.locataire) : '<span class="muted">— libre</span>'}${st === 'modifie' && o.locataire !== x.locataire ? `<div class="muted small">avant : ${esc(o.locataire || '—')}</div>` : ''}</td><td>${x.locataire || x.email ? mail(x.email) : ''}${st === 'modifie' && norm(o.email) !== norm(x.email) ? `<div class="muted small">avant : ${esc(o.email || '—')}</div>` : ''}</td><td>${ET[st]}</td></tr>`).join('')}
            ${f.absents.map(o => `<tr class="imp-ret"><td class="muted">—</td><td><b>${esc(o.code)}</b></td><td>${esc(o.locataire || '—')}</td><td>${esc(o.email || '')}</td><td><span class="st-i ret">Retiré</span></td></tr>`).join('')}</tbody></table></div></details>`; };
        imp.innerHTML = `<div class="imp-prev"><b>Aperçu de l’import</b><ul>${feuilles.map(f => `<li><b>${esc(f.nom)}</b> : ${f.lignes.length} ${f.villa ? (f.lignes.length > 1 ? 'villas' : 'villa') + ` (${esc(f.lignes.map(x => x.appartement).join(', '))})` : 'logements'}${f.connue ? '' : ` <span class="badge warn">${f.villa ? 'nouvel ensemble de villas' : 'nouvelle résidence'}</span>`}${f.sans ? ` · ${f.sans} sans e-mail` : ''}${f.connue ? `<div class="small">Locataires : <b>${f.avant}</b> aujourd’hui → <b>${f.apres}</b> après l’import${f.absents.length ? ` · <span class="err">${f.absents.length} logement${f.absents.length > 1 ? 's' : ''} absent${f.absents.length > 1 ? 's' : ''} du fichier retiré${f.absents.length > 1 ? 's' : ''}${f.absents.some(x => occupant.has(x.id)) ? `, dont ${f.absents.filter(x => occupant.has(x.id)).length} compte(s) actif(s) suspendu(s)` : ''}</span>` : ''}${f.vides.length ? ` · <span class="err">${f.vides.length} compte(s) actif(s) sur un logement désormais vide : accès suspendu</span>` : ''}${f.remplaces.length ? ` · <span class="err">${f.remplaces.length} logement(s) avec un nouveau locataire : l’ancien compte est suspendu</span>` : ''}${f.perdus.length ? `<div class="a-pb">Perdront l’accès (compte suspendu, réactivable) : ${esc(f.perdus.join(', '))}</div>` : ''}</div>` : ''}${f.invalides ? ` · <span class="err">${f.invalides} e-mail invalide${f.invalides > 1 ? 's' : ''}</span>` : ''}${f.doublons.length ? `<div class="a-pb">${f.doublons.map(d => `${esc(d.code)} : ${d.ignores.length + 1} locataires listés, gardé « ${esc(d.garde)} » (le dernier)`).join('<br>')}</div>` : ''}${f.autresMails.length ? `<div class="muted small">${f.autresMails.length} logement${f.autresMails.length > 1 ? 's' : ''} avec plusieurs e-mails : le premier sert à se connecter.</div>` : ''}${detail(f)}</li>`).join('')}</ul>${listeIgn}
          <p class="note small" style="margin:10px 0 0">Le fichier <b>remplace</b> la liste actuelle de chaque résidence ou ensemble de villas qu’il contient : locataires, e-mails, logements et villas. Ce qui n’y figure plus est retiré. Ce qui est absent du fichier ne change pas. <b>Avant l’import, une sauvegarde de la liste actuelle est téléchargée</b> : en cas d’erreur, réimportez-la pour revenir en arrière.</p>
          <div class="row" style="margin-top:10px"><button class="btn" type="button" id="ok">Importer</button><button class="btn ghost" type="button" id="no">Annuler</button></div></div>`;
        imp.querySelector('#no').onclick = () => imp.innerHTML = '';
        imp.querySelector('#ok').onclick = async (ev) => {
          const bt = ev.target;
          // Garde-fou : grosse baisse, comptes qui perdent l'accès ou résidence inconnue (faute de frappe = doublon) → confirmation tapée
          const perdus = feuilles.flatMap(f => f.perdus), chute = feuilles.filter(f => f.connue && f.avant >= 5 && f.apres < f.avant / 2), nouvelles = feuilles.filter(f => !f.connue);
          if (perdus.length || chute.length || nouvelles.length) {
            const okk = await dialogue({ titre: 'Vérifiez avant d’importer', ok: 'Importer', danger: true, saisie: { label: 'Tapez IMPORTER pour confirmer', attendu: 'IMPORTER' },
              corps: `<ul>${chute.map(f => li(`<b>${esc(f.nom)}</b> : ${f.avant} locataires aujourd’hui → <b>${f.apres}</b> après l’import. Si le fichier est incomplet ou n’est pas le bon, annulez.`)).join('')}
                ${perdus.length ? li(`<b>${perdus.length} compte${perdus.length > 1 ? 's' : ''}</b> perdront l’accès (suspendus, réactivables avec un nouveau code) : ${esc(perdus.slice(0, 8).join(', '))}${perdus.length > 8 ? '…' : ''}`) : ''}
                ${nouvelles.filter(f => !f.villa).length ? li(`Nouvelle(s) résidence(s) créée(s) : <b>${esc(nouvelles.filter(f => !f.villa).map(f => f.nom).join(', '))}</b>. Vérifiez l’orthographe : une faute de frappe crée un doublon.`) : ''}
                ${nouvelles.filter(f => f.villa).length ? li(`Nouvel(s) ensemble(s) de villas, rangé(s) dans la rubrique Villas : <b>${esc(nouvelles.filter(f => f.villa).map(f => f.nom).join(', '))}</b>. Vérifiez l’orthographe : une faute de frappe crée un doublon.`) : ''}</ul>
                <p>Une sauvegarde de la liste actuelle sera téléchargée juste avant l’import.</p>` });
            if (!okk) return;
          }
          bt.disabled = true; bt.textContent = 'Import en cours…'; const bilan = [], echecs = [];
          try { if (sauvegarder(X, feuilles)) toast('Sauvegarde téléchargée.'); } catch (_) {}
          // Chaque résidence / ensemble est importé à part : une erreur sur l'un n'empêche pas les autres
          for (const f of feuilles) { try { const r = check(await sb.rpc('admin_importer_annuaire', { p_residence: f.nom, p_lignes: f.lignes, p_desactiver_absents: true }));
              if (f.absents.length) { const ids = f.absents.map(x => x.id), avecCompte = f.absents.filter(x => occupant.has(x.id)).map(x => x.id);
                check(await sb.from('invitations').delete().in('logement_id', ids).is('utilisee_par', null));
                if (avecCompte.length) { check(await sb.from('profiles').update({ statut: 'desactive' }).in('logement_id', avecCompte).eq('statut', 'actif'));
                  check(await sb.from('logements').update({ actif: false }).in('id', avecCompte)); } }
              if (f.vides.length) check(await sb.from('profiles').update({ statut: 'desactive' }).in('logement_id', f.vides.map(x => x.id)).eq('statut', 'actif'));
              if (f.remplaces.length) check(await sb.from('profiles').update({ statut: 'desactive', logement_id: null }).in('logement_id', f.remplaces.map(x => x.id)).eq('statut', 'actif'));
              if (f.villa) { // marquer les logements comme villas et la résidence comme ensemble de villas
                const { data: rr } = await sb.from('residences').select('id,type_bien').ilike('nom', f.nom).limit(1);
                if (rr?.[0]) { check(await sb.from('logements').update({ type_logement: 'Villa' }).eq('residence_id', rr[0].id).in('appartement', f.lignes.map(x => x.appartement)));
                  if (!rr[0].type_bien) check(await sb.from('residences').update({ type_bien: 'Villas en résidence' }).eq('id', rr[0].id)); } }
              bilan.push(`${f.nom} : ${r.crees} ajouté(s), ${r.mis_a_jour} mis à jour${f.absents.length ? `, ${f.absents.length} retiré(s)` : ''}`); }
            catch (ex) { echecs.push(`${f.nom} : ${errMsg(ex)}`); } }
          toast(echecs.length ? `Import terminé avec ${echecs.length} erreur(s).` : 'Annuaire importé.');
          annuaire._msg = bilan.join(' — '); annuaire._err = echecs.join(' — ');
          // la liste est rechargée tout de suite, sans avoir à rafraîchir la page (la résidence importée reste sélectionnée)
          if (feuilles[0]) { const r0 = feuilles.find(f => !echecs.some(e => e.startsWith(f.nom + ' :'))) || feuilles[0]; annuaire._sel = r0.nom; }
          await annuaire(box);
        };
      } catch (ex) { imp.innerHTML = `<p class="err">${esc(errMsg(ex))}</p>`; }
    };
    if (annuaire._msg || annuaire._err) { $('#imp').innerHTML = (annuaire._msg ? `<p class="inv-ok" style="text-align:left">${esc(annuaire._msg)}</p>` : '') + (annuaire._err ? `<p class="err" style="text-align:left">Non importé — ${esc(annuaire._err)}</p>` : ''); annuaire._msg = annuaire._err = ''; }
  };
  dessiner();
}

// ---------- Filtres + recherche communs aux onglets (lignes marquées data-f="tag1 tag2") ----------
const MEMO_F = {};
const J_MS = 864e5;
const dans = (d) => d ? Math.ceil((new Date(d) - Date.now()) / J_MS) : null;
function filtres(cont, defs, memo, ph = 'Rechercher…') {
  if (!cont) return;
  const rows = [...cont.querySelectorAll('[data-f]')];
  const a = (r, k) => k === 'tous' || (r.dataset.f || '').split(' ').includes(k);
  const nb = (k) => rows.filter(r => a(r, k)).length;
  let f = MEMO_F[memo] && nb(MEMO_F[memo]) ? MEMO_F[memo] : 'tous', q = '';
  const bar = document.createElement('div'); bar.className = 'flt';
  bar.innerHTML = `${rows.length > 5 ? `<input type="search" placeholder="${esc(ph)}" autocomplete="off">` : ''}<div class="chips ann-f">${[['tous', 'Tous'], ...defs].filter(([k]) => k === 'tous' || nb(k)).map(([k, t, pb]) => `<button type="button" class="chip ${k === f ? 'on' : ''}${pb ? ' pb' : ''}" data-ff="${k}">${t} <span>${nb(k)}</span></button>`).join('')}</div>`;
  cont.before(bar);
  const vide = document.createElement('p'); vide.className = 'muted center'; vide.textContent = 'Aucun résultat.'; cont.after(vide);
  const maj = () => { const t = norm(q).split(/\s+/).filter(Boolean); let n = 0; rows.forEach(r => { const ok = a(r, f) && t.every(w => norm(r.textContent).includes(w)); r.hidden = !ok; if (ok) n++; }); vide.hidden = !!n || !rows.length; };
  const inp = bar.querySelector('input'); if (inp) inp.oninput = () => { q = inp.value; maj(); };
  bar.querySelectorAll('[data-ff]').forEach(b => b.onclick = () => { f = b.dataset.ff; MEMO_F[memo] = f; bar.querySelectorAll('[data-ff]').forEach(c => c.classList.toggle('on', c === b)); maj(); });
  maj();
}
const alerte = (t) => `<div class="a-pb">${esc(t)}</div>`;

// ---------- Comptes (§2) ----------
async function comptes(box) {
  const [{ data }, lg] = await Promise.all([
    sb.from('profiles').select('id,nom_affichage,statut,date_activation,date_fin_occupation,type_occupant,is_admin,is_adress,logement_id,residence_id,logements(code,numero,locataire,bloc,type_logement),residences(nom)').order('created_at', { ascending: false }),
    sb.from('logements').select('id,code,residence_id,locataire,bloc,etage,appartement,type_logement,residences(nom)').eq('actif', true)]);
  const D = data || [], LG = (lg.data || []).filter(l => l.bloc || estVilla(l)).sort((a, b) => (a.residences?.nom || '').localeCompare(b.residences?.nom || '') || triLog(a, b));
  const pris = new Set(D.filter(p => p.statut === 'actif' && p.logement_id).map(p => p.logement_id));
  const tags = (p) => { const d = dans(p.date_fin_occupation), t = [p.statut === 'actif' ? 'actif' : p.statut === 'desactive' ? 'retire' : 'attente'];
    if (p.statut === 'actif' && d != null && d <= 30) t.push('depart'); if (p.is_admin || p.is_adress) t.push('equipe'); if (problemes(p).length) t.push('pb'); return t.join(' '); };
  const problemes = (p) => { const r = [], d = dans(p.date_fin_occupation);
    if (p.statut === 'actif' && d != null && d < 0) r.push('Date de fin dépassée : le retrait automatique n’a pas encore eu lieu, retirez le compte');
    if (p.statut === 'actif' && !p.logement_id && !p.is_adress && !p.is_admin) r.push('Aucun logement rattaché : touchez « Logement »');
    if (p.logement_id && ancienCode(p.logements)) r.push('Ancien code absent de Nos locataires : touchez « Logement » pour le rattacher au bon appartement');
    if (p.statut === 'en_attente' || (p.statut !== 'actif' && p.statut !== 'desactive')) r.push('Compte créé sans code valide : renvoyez-lui une invitation');
    return r; };
  const fin = (p) => { const d = dans(p.date_fin_occupation); return d == null ? '' : d < 0 ? 'dépassée' : d === 0 ? 'aujourd’hui' : `dans ${d} j`; };
  box.innerHTML = `<div tabindex="0" style="overflow-x:auto" id="cpt"><table class="adm no-q"><thead><tr><th>Résident</th><th>Logement</th><th>Statut</th><th>Fin d'occupation</th><th></th></tr></thead><tbody>
  ${D.map(p => `<tr data-id="${p.id}" data-f="${tags(p)}"><td><b>${esc(p.nom_affichage || '(sans nom)')}</b>${p.is_admin ? ' <span class="badge soft">admin</span>' : ''}${p.is_adress ? ' <span class="badge soft">ADRESS</span>' : ''}<div class="muted small">${[esc(p.type_occupant || ''), p.date_activation ? 'membre depuis le ' + dateFr(p.date_activation) : ''].filter(Boolean).join(' · ')}</div>${problemes(p).map(alerte).join('')}</td>
    <td>${p.logements ? `<b>${esc(p.logements.numero || p.logements.code)}</b>` : '—'}<div class="muted small">${esc(p.residences?.nom || '')}</div></td>
    <td><span class="st-l ${p.statut === 'actif' ? 'actif' : ''}">${p.statut === 'actif' ? 'Actif' : p.statut === 'desactive' ? 'Retiré' : 'En attente'}</span></td>
    <td><input type="date" data-fin value="${p.date_fin_occupation || ''}" style="min-width:140px"><div class="muted small">${fin(p)}</div></td>
    <td>${p.id === state.session.user.id ? '<span class="muted small">vous</span>' : `<div class="row" style="flex-wrap:nowrap;justify-content:flex-end">${p.statut === 'actif' ? '<button class="btn sm danger" data-st="desactive">Retirer</button>' : p.statut === 'desactive' ? '<span class="muted small">Nouveau code pour revenir</span>' : ''}<button class="btn sm soft" data-lg>Logement</button><button class="btn sm soft" data-mdp title="Mot de passe oublié">Mot de passe</button></div>`}</td></tr>`).join('')}</tbody></table></div>
  <div id="mdpRes"></div>`;
  filtres(box.querySelector('#cpt'), [['pb', 'À vérifier', 1], ['actif', 'Actifs'], ['depart', 'Départ ≤ 30 j'], ['attente', 'En attente'], ['retire', 'Retirés'], ['equipe', 'Équipe ADRESS']], 'comptes', 'Rechercher un nom, un logement, une résidence…');
  box.querySelectorAll('[data-fin]').forEach(i => i.onchange = () => {
    if (i.value && new Date(i.value) < new Date(new Date().toDateString()) && !confirm('Cette date est déjà passée : le compte sera retiré automatiquement dans la nuit. Continuer ?')) { i.value = i.defaultValue; return; }
    action(async () => check(await sb.from('profiles').update({ date_fin_occupation: i.value || null }).eq('id', i.closest('tr').dataset.id)), 'Date enregistrée.');
  });
  // Rattacher un compte à un logement de l'annuaire (après changement de nomenclature, déménagement…)
  box.querySelectorAll('[data-lg]').forEach(b => b.onclick = () => {
    const tr = b.closest('tr'), p = D.find(x => x.id === tr.dataset.id); if (!p) return;
    const groupes = [...new Set(LG.map(l => l.residences?.nom || ''))];
    const cell = tr.children[1];
    cell.innerHTML = `<select data-lgsel style="min-width:200px"><option value="">Choisir le logement…</option>${groupes.map(g => `<optgroup label="${esc(g)}">${LG.filter(l => (l.residences?.nom || '') === g).map(l => `<option value="${l.id}" ${pris.has(l.id) && l.id !== p.logement_id ? 'disabled' : ''}${l.id === p.logement_id ? ' selected' : ''}>${esc(l.code)}${l.locataire ? ' — ' + esc(l.locataire) : ''}${pris.has(l.id) && l.id !== p.logement_id ? ' (occupé)' : ''}</option>`).join('')}</optgroup>`).join('')}</select>`;
    const sel = cell.querySelector('select'); sel.focus();
    sel.onchange = () => { const l = LG.find(x => x.id === sel.value); if (!l) return;
      if (!confirm(`Rattacher ${p.nom_affichage || 'ce compte'} au logement ${l.code} (${l.residences?.nom || ''}) ?`)) { rerender(); return; }
      action(async () => { const ancien = ancienCode(p.logements) ? p.logement_id : null;
        check(await sb.from('profiles').update({ logement_id: l.id, residence_id: l.residence_id }).eq('id', p.id));
        if (ancien && !D.some(x => x.id !== p.id && x.logement_id === ancien)) await sb.from('logements').update({ actif: false }).eq('id', ancien);
      }, 'Compte rattaché à ' + l.code + '.'); };
  });
  box.querySelectorAll('[data-mdp]').forEach(b => b.onclick = async () => {
    const tr = b.closest('tr'), p = D.find(x => x.id === tr.dataset.id); if (!p) return;
    if (!confirm('Donner un mot de passe provisoire à ' + (p.nom_affichage || 'ce compte') + ' ?\n\nSon ancien mot de passe ne fonctionnera plus. Il pourra le changer ensuite dans Mon compte.')) return;
    const al = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint32Array(6));
    const mdp = 'Adress-' + [...r].map(n => al[n % al.length]).join('');
    b.disabled = true; const { data: email, error } = await sb.rpc('admin_reinitialiser_mdp', { p_user: p.id, p_mdp: mdp }); b.disabled = false;
    if (error) return toast(errMsg(error));
    const lien = location.origin + location.pathname;
    const msg = `Bonjour${p.nom_affichage ? ' ' + p.nom_affichage : ''},\n\nVoici votre mot de passe provisoire ADRESS CLUB :\n${mdp}\n\n1. Ouvrez ${lien}\n2. Connectez-vous avec votre e-mail (${email}) et ce mot de passe\n3. Changez-le dans Mon compte › Changer mon mot de passe`;
    const res = box.querySelector('#mdpRes');
    res.innerHTML = `<div class="inv-ok"><small>Mot de passe provisoire de ${esc(p.nom_affichage || email)} (${esc(email)})</small><b style="letter-spacing:.06em;font-size:24px">${esc(mdp)}</b>
      <div class="row"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">Envoyer par WhatsApp</a><button class="btn ghost" type="button" id="cpm2">Copier le message</button></div></div>`;
    res.querySelector('#cpm2').onclick = async () => { try { await navigator.clipboard.writeText(msg); toast('Message copié.'); } catch (_) { toast(mdp); } };
    res.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
  box.querySelectorAll('[data-st]').forEach(b => b.onclick = () => confirm('Retirer ce locataire ?\n\n• Son accès à ADRESS CLUB est coupé\n• Son logement redevient libre\n• Ses annonces sont mises en pause (masquées du Market)\n\nRien n\'est perdu : avec un nouveau code, il retrouve ses annonces, favoris et historique.') && action(async () => check(await sb.from('profiles').update({ statut: b.dataset.st }).eq('id', b.closest('tr').dataset.id))));
}

// ---------- Modération (§3) ----------
async function moderation(box) {
  const { data } = await sb.from('signalements').select('*, annonces(id,titre,statut,retiree_par_adress,photos)').order('created_at', { ascending: false }).limit(200);
  const D = data || [], ph = await vignettesAnnonces(D.map(s => (s.annonces?.photos || [])[0])), parAnn = new Map(); D.forEach(s => parAnn.set(s.annonce_id, (parAnn.get(s.annonce_id) || 0) + 1));
  box.innerHTML = `<div class="list no-q" id="mod">${D.map(s => `<div class="card mod-c" data-a="${s.annonce_id}" data-f="${s.decision === 'en_attente' ? 'attente' : 'traite'}">${s.annonces ? imgAnn(ph.get((s.annonces.photos || [])[0]), s.annonce_id, s.annonces.titre) : ''}<div class="mod-b">
    <div class="row" style="justify-content:space-between;align-items:baseline"><b>${esc(s.annonces?.titre || 'Annonce supprimée')}</b><span class="st-l ${s.decision === 'en_attente' ? 'actif' : ''}">${s.decision === 'en_attente' ? 'À traiter' : s.decision === 'retiree' ? 'Retirée' : 'Maintenue'}</span></div>
    <div class="muted small">Signalé le ${dateFr(s.created_at, true)} · ${esc(s.motif)}${parAnn.get(s.annonce_id) > 1 ? ` · ${parAnn.get(s.annonce_id)} signalements pour cette annonce` : ''}</div>${s.commentaire ? `<p>${esc(s.commentaire)}</p>` : ''}
    <div class="row" style="margin-top:8px">${s.annonces ? `<a class="btn sm soft" href="#/annonce/${s.annonce_id}">Voir l’annonce</a>` : ''}${s.decision === 'en_attente' && s.annonces ? `<button class="btn sm danger" data-r="1">Retirer l'annonce</button><button class="btn sm ghost" data-r="0">Maintenir</button>` : ''}</div></div></div>`).join('') || '<div class="card center pad">Aucun signalement.</div>'}</div>`;
  if (D.length) filtres(box.querySelector('#mod'), [['attente', 'À traiter', 1], ['traite', 'Traités']], 'moderation', 'Rechercher une annonce, un motif…');
  box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => (b.dataset.r === '0' || confirm('Retirer cette annonce du Market ?')) && action(async () => check(await sb.rpc('admin_retirer_annonce', { p_id: b.closest('[data-a]').dataset.a, p_retirer: b.dataset.r === '1' }))));
}

// Photos des annonces (stockage privé) : vignette légère si elle existe, sinon la photo d'origine
async function vignettesAnnonces(paths) {
  const ps = [...new Set(paths.filter(Boolean))]; if (!ps.length) return new Map();
  const t = (p) => p.endsWith('.jpg') && !p.endsWith('_t.jpg') ? p.replace(/\.jpg$/, '_t.jpg') : p;
  const { data } = await sb.storage.from('annonces').createSignedUrls([...new Set([...ps.map(t), ...ps])], 6 * 3600);
  const u = new Map((data || []).filter(x => x.signedUrl).map(x => [x.path, x.signedUrl]));
  return new Map(ps.map(p => [p, u.get(t(p)) || u.get(p) || '']));
}
const imgAnn = (url, id, titre) => `<a class="t-ph" href="#/annonce/${id}" aria-label="${esc(titre)}">${url ? `<img src="${esc(url)}" alt="" loading="lazy" decoding="async">` : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/></svg>'}</a>`;
// ---------- Toutes les annonces : retrait ADRESS après publication (§3) ----------
const STATUT_ANN = { disponible: 'En ligne', reserve: 'Réservée', vendu: 'Vendue', don_effectue: 'Don effectué', retire: 'Retirée par le vendeur', expire: 'Expirée' };
async function annonces(box) {
  const { data } = await sb.from('annonces').select('id,titre,type,prix_fcfa,statut,is_adress,retiree_par_adress,date_publication,date_expiration,signalee,photos').order('date_publication', { ascending: false }).limit(300);
  const D = data || [], ph = await vignettesAnnonces(D.map(a => (a.photos || [])[0]));
  const tags = (a) => { const t = []; const d = dans(a.date_expiration);
    if (a.retiree_par_adress) t.push('retiree'); else if (['disponible', 'reserve'].includes(a.statut)) { t.push('ligne'); if (a.statut === 'reserve') t.push('reserve'); if (d != null && d <= 7) t.push('bientot'); } else t.push('close');
    if (a.signalee) t.push('signalee'); if (a.is_adress) t.push('adress'); return t.join(' '); };
  box.innerHTML = `<div tabindex="0" style="overflow-x:auto" id="anns"><table class="adm no-q ann-t"><thead><tr><th></th><th>Annonce</th><th>Statut</th><th>Expire</th><th></th></tr></thead><tbody>
  ${D.map(a => { const d = dans(a.date_expiration), ouverte = !a.retiree_par_adress && ['disponible', 'reserve'].includes(a.statut); return `<tr data-id="${a.id}" data-f="${tags(a)}"><td class="c-ph">${imgAnn(ph.get((a.photos || [])[0]), a.id, a.titre)}</td><td class="c-t"><a href="#/annonce/${a.id}" class="t-lien"><b>${esc(a.titre)}</b></a>${a.is_adress ? ' <span class="badge soft">ADRESS</span>' : ''}<div class="muted small">${a.type === 'don' ? 'Don' : fcfa(a.prix_fcfa)} · publiée le ${dateFr(a.date_publication)}</div>${a.signalee ? alerte('Signalée : à traiter dans Modération') : ''}</td>
    <td><span class="st-l ${ouverte ? 'actif' : ''}">${a.retiree_par_adress ? 'Retirée par ADRESS' : STATUT_ANN[a.statut] || esc(a.statut)}</span></td><td>${dateFr(a.date_expiration)}${ouverte && d != null ? `<div class="muted small">${d < 0 ? 'dépassée' : d === 0 ? 'aujourd’hui' : `dans ${d} j`}</div>` : ''}</td>
    <td>${a.retiree_par_adress ? '<button class="btn sm ghost" data-r="0">Rétablir</button>' : ouverte ? '<button class="btn sm danger" data-r="1">Retirer</button>' : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
  filtres(box.querySelector('#anns'), [['ligne', 'En ligne'], ['reserve', 'Réservées'], ['bientot', 'Expirent ≤ 7 j'], ['signalee', 'Signalées', 1], ['close', 'Clôturées'], ['retiree', 'Retirées par ADRESS'], ['adress', 'ADRESS']], 'annonces', 'Rechercher une annonce…');
  box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => (b.dataset.r === '0' || confirm('Retirer cette annonce du Market ?')) && action(async () => check(await sb.rpc('admin_retirer_annonce', { p_id: b.closest('tr').dataset.id, p_retirer: b.dataset.r === '1' }))));
}

// ---------- Contenus : Nouveautés et Flip Immo (§7) ----------
async function contenus(box) {
  const { data } = await sb.from('contenus').select('*').order('date_parution', { ascending: false });
  const D = data || [], auj = new Date().toISOString().slice(0, 10);
  const pb = (c) => { const r = []; if (!c.image_path) r.push('Sans image : la carte s’affiche vide');
    if (c.type === 'Flip Immo' && !c.lien) r.push('Flip Immo sans lien : les résidents ne peuvent pas l’ouvrir');
    if (c.lien && !/^https?:\/\//i.test(c.lien)) r.push('Lien invalide (doit commencer par https://)'); return r; };
  const tags = (c) => [c.visible ? 'visible' : 'masque', (c.date_parution || '') > auj ? 'futur' : '', c.type === 'Flip Immo' ? 'flip' : 'actu', pb(c).length ? 'pb' : ''].filter(Boolean).join(' ');
  box.innerHTML = `<div class="card"><h3>Publier un contenu</h3><form id="f">
    <div class="grid2"><div><label>Type *</label><select id="ty">${TYPES_CONTENU.map(t => `<option>${t}</option>`).join('')}</select></div><div><label>Date de parution</label><input id="dp" type="date" value="${auj}"></div></div>
    <label>Titre *</label><input id="ti" type="text" required>
    <label>Texte</label><textarea id="tx"></textarea>
    <div class="grid2"><div><label>Lien (flipbook, page…)</label><input id="li" type="url" placeholder="https://"></div><div><label>N° (Flip Immo)</label><input id="nu" type="text"></div></div>
    <label data-lf>Image / couverture</label><input id="im" type="file" accept="image/*">
    <p class="err" id="ferr" hidden></p>
    <button class="btn block" style="margin-top:12px">Publier</button><button class="btn ghost block" type="button" id="annul" hidden style="margin-top:8px">Annuler</button></form></div>
  <h2>Contenus</h2><div class="list no-q" id="cts">${D.map(c => `<div class="card" data-id="${c.id}" data-f="${tags(c)}" style="display:flex;gap:12px">
    <div class="ct-im" style="${c.image_path ? `background-image:url('${esc(publicUrl(c.image_path))}')` : ''}"></div>
    <div style="flex:1;min-width:0"><b>${esc(c.titre)}</b><div class="muted small">${esc(c.type)} · ${(c.date_parution || '') > auj ? 'parution le ' : ''}${dateFr(c.date_parution)} · ${c.visible ? 'visible' : 'masqué'}</div>${pb(c).map(alerte).join('')}
    <div class="row" style="margin-top:6px">${c.lien ? `<a class="btn sm soft" href="${esc(c.lien)}" target="_blank" rel="noopener">Ouvrir le lien</a>` : ''}<button class="btn sm ghost" data-v="${c.visible ? 0 : 1}">${c.visible ? 'Masquer' : 'Afficher'}</button><button class="btn sm ghost" data-edit>Modifier</button><button class="btn sm danger" data-d>Supprimer</button></div></div></div>`).join('') || '<div class="card center pad">Aucun contenu.</div>'}</div>`;
  if (D.length) filtres(box.querySelector('#cts'), [['pb', 'À compléter', 1], ['visible', 'Visibles'], ['masque', 'Masqués'], ['futur', 'À paraître'], ['flip', 'Flip Immo'], ['actu', 'Actualités']], 'contenus', 'Rechercher un contenu…');
  const $ = (s) => box.querySelector(s);
  let edit = null;
  const ferr = (m) => { $('#ferr').textContent = m; $('#ferr').hidden = !m; };
  $('#f').onsubmit = (e) => { e.preventDefault(); ferr('');
    const lien = $('#li').value.trim();
    if (lien && !/^https?:\/\//i.test(lien)) return ferr('Le lien doit commencer par https://');
    if ($('#ty').value === 'Flip Immo' && !lien) return ferr('Un Flip Immo a besoin du lien du flipbook.');
    if (!edit && !$('#im').files[0] && !confirm('Publier sans image ? La carte s’affichera sans visuel.')) return;
    action(async () => {
    const f = $('#im').files[0]; const image_path = f ? await uploadPublic(f, 'contenus') : null;
    const v = { type: $('#ty').value, titre: $('#ti').value.trim(), texte: $('#tx').value.trim() || null, lien: lien || null, numero: $('#nu').value.trim() || null, date_parution: $('#dp').value };
    if (edit) { if (image_path) v.image_path = image_path; check(await sb.from('contenus').update(v).eq('id', edit.id)); }
    else check(await sb.from('contenus').insert({ ...v, image_path }));
  }, edit ? 'Modifications enregistrées.' : 'Contenu publié.'); };
  box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const c = D.find(x => x.id === b.closest('[data-id]').dataset.id); if (!c) return; edit = c;
    $('#ty').value = c.type; $('#dp').value = (c.date_parution || '').slice(0, 10); $('#ti').value = c.titre || ''; $('#tx').value = c.texte || ''; $('#li').value = c.lien || ''; $('#nu').value = c.numero || ''; $('#im').value = '';
    modeEdition(box, 'Modifier « ' + c.titre + ' »', 'Image / couverture (laisser vide pour garder l’actuelle)');
  });
  box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => action(async () => check(await sb.from('contenus').update({ visible: b.dataset.v === '1' }).eq('id', b.closest('[data-id]').dataset.id))));
  box.querySelectorAll('[data-d]').forEach(b => b.onclick = () => confirm('Supprimer définitivement ce contenu ? (« Masquer » le retire sans le perdre)') && action(async () => check(await sb.from('contenus').delete().eq('id', b.closest('[data-id]').dataset.id)), 'Supprimé.'));
}

// ---------- Résidences (§7) ----------
const villas = (box) => residences(box, true);
async function residences(box, villa = false) {
  const [{ data }, lg, pr] = await Promise.all([sb.from('residences').select('*').order('ordre'),
    sb.from('logements').select('residence_id,locataire').eq('actif', true),
    sb.from('profiles').select('residence_id').eq('statut', 'actif')]);
  const T = data || [], D = T.filter(r => resVilla(r) === villa), L = lg.data || [], P = pr.data || [];
  const mot = villa ? 'l’ensemble de villas' : 'la résidence', TYP = TYPES_BIEN.filter(t => /villa/i.test(t) === villa);
  const nbL = (id) => L.filter(x => x.residence_id === id).length, nbO = (id) => L.filter(x => x.residence_id === id && x.locataire).length, nbM = (id) => P.filter(x => x.residence_id === id).length;
  const pb = (r) => { const t = []; if (!r.photo_path) t.push('Sans photo'); if (!r.description) t.push('Sans description'); if (r.visible && !r.lien_decouvrir) t.push('Sans lien « Découvrir »');
    if (!nbL(r.id)) t.push(villa ? 'Aucune villa dans Nos locataires : impossible d’inviter des locataires' : 'Aucun logement dans Nos locataires : impossible d’inviter des locataires'); return t; };
  const nD = D.length, pl = nD > 1 ? 's' : '';
  box.innerHTML = `<div class="res-top"><span class="muted">${villa ? `${nD} ensemble${pl} de villas` : `${nD} résidence${pl}`}</span><button type="button" class="btn" id="newRes" aria-controls="resForm" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>${villa ? 'Créer un ensemble de villas' : 'Créer une résidence'}</button></div>
  <div class="card ann-add" id="resForm" hidden><h3>${villa ? 'Nouvel ensemble de villas' : 'Nouvelle résidence'}</h3><form id="f">
    <div class="grid2"><div><label>Nom *</label><input id="no" type="text" required></div><div><label>Quartier</label><input id="qu" type="text"></div></div>
    <div class="grid2"><div><label for="tb">Type *</label><select id="tb">${TYP.length > 1 ? '<option value="">Choisir le type</option>' : ''}${TYP.map(t => `<option value="${t}">${LIB_TYPE[t]}</option>`).join('')}</select></div><div><label>Ordre d'affichage</label><input id="or" type="number" value="100"></div></div>
    <label>Description</label><textarea id="de"></textarea>
    <label>Lien « Découvrir »</label><input id="li" type="url" placeholder="https://">
    <label data-lf>Photo</label><input id="ph" type="file" accept="image/*">
    <div class="row" style="margin-top:12px"><button class="btn">${villa ? 'Créer l’ensemble' : 'Créer la résidence'}</button><button class="btn ghost" type="button" id="annul">Annuler</button></div></form></div>
  <h2>${villa ? 'Ensembles de villas' : 'Résidences'}</h2><div class="list no-q" id="rsd">${D.map(r => `<div class="card" data-id="${r.id}" data-f="${[resVilla(r) ? 'villa' : 'appart', r.visible ? 'visible' : 'masque', pb(r).length ? 'pb' : ''].join(' ')}" style="display:flex;gap:12px;align-items:flex-start">
    <div class="ct-im" style="width:72px;height:54px;${r.photo_path ? `background-image:url('${esc(publicUrl(r.photo_path))}')` : ''}"></div>
    <div style="flex:1;min-width:0"><b>${esc(r.nom)}</b> <span class="type-b${resVilla(r) ? ' v' : ''}">${resVilla(r) ? 'Villas' : 'Résidence'}</span> <span class="muted small">${esc(r.quartier || '')} · ordre ${r.ordre} · ${r.visible ? 'visible' : 'masquée'}</span>
    <div class="muted small">${nbL(r.id)} ${resVilla(r) ? 'villa' : 'logement'}${nbL(r.id) > 1 ? 's' : ''} · ${nbO(r.id)} occupé${nbO(r.id) > 1 ? 's' : ''} · ${nbM(r.id)} membre${nbM(r.id) > 1 ? 's' : ''} du Club</div>${pb(r).map(alerte).join('')}
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-v="${r.visible ? 0 : 1}">${r.visible ? 'Masquer' : 'Afficher'}</button>
      <label class="btn sm ghost" style="margin:0">Photo<input type="file" accept="image/*" data-photo class="sr"></label>
      <label class="btn sm ghost" style="margin:0" title="MP4 de préférence, 50 Mo maximum">${r.video_path ? 'Changer la vidéo' : '+ Vidéo'}<input type="file" accept="video/mp4,video/webm,video/quicktime" data-video class="sr"></label>${r.video_path ? '<button class="btn sm ghost" data-novid>Retirer la vidéo</button>' : ''}
      <button class="btn sm ghost" data-edit>Modifier</button><a class="btn sm soft" href="#/admin/annuaire" data-ann>Nos locataires</a><button class="btn sm ghost rouge" data-supr>Supprimer</button></div></div></div>`).join('') || '<div class="card center pad">Aucune résidence.</div>'}</div>`;
  if (D.length) filtres(box.querySelector('#rsd'), [['pb', 'À compléter', 1], ['visible', 'Visibles'], ['masque', villa ? 'Masqués' : 'Masquées']], villa ? 'villas' : 'residences', villa ? 'Rechercher un ensemble de villas…' : 'Rechercher une résidence…');
  const $ = (s) => box.querySelector(s);
  let edit = null;
  const ouvrir = (on) => { $('#resForm').hidden = !on; $('#newRes').setAttribute('aria-expanded', on); if (on) $('#no').focus(); };
  $('#newRes').onclick = () => ouvrir($('#resForm').hidden);
  $('#annul').onclick = () => ouvrir(false);
  $('#f').onsubmit = (e) => { e.preventDefault();
    const nom = $('#no').value.trim();
    if (!$('#tb').value) { $('#tb').focus(); return toast('Choisissez le type.'); }
    if (!edit && T.some(r => norm(r.nom) === norm(nom))) return toast(`Ce nom existe déjà${T.some(r => norm(r.nom) === norm(nom) && resVilla(r) !== villa) ? (villa ? ' dans Résidences' : ' dans Villas') : ''}.`);
    action(async () => {
    const f = $('#ph').files[0]; const photo_path = f ? await uploadPublic(f, 'residences') : null;
    const v = { nom, quartier: $('#qu').value.trim() || null, type_bien: $('#tb').value || null, ordre: +$('#or').value || 100, description: $('#de').value.trim() || null, lien_decouvrir: $('#li').value.trim() || null };
    if (edit) { if (photo_path) v.photo_path = photo_path; check(await sb.from('residences').update(v).eq('id', edit.id)); }
    else check(await sb.from('residences').insert({ ...v, photo_path }));
  }, edit ? 'Modifications enregistrées.' : villa ? 'Ensemble de villas ajouté.' : 'Résidence ajoutée.'); };
  box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => action(async () => check(await sb.from('residences').update({ visible: b.dataset.v === '1' }).eq('id', b.closest('[data-id]').dataset.id))));
  const rid = (el) => el.closest('[data-id]').dataset.id;
  box.querySelectorAll('[data-ann]').forEach(a => a.onclick = () => { annuaire._rid = rid(a); });
  box.querySelectorAll('[data-supr]').forEach(b => b.onclick = () => { const r = D.find(x => x.id === rid(b)); if (!r) return;
    if (nbM(r.id)) return toast(`${r.nom} a ${nbM(r.id)} membre(s) du Club : retirez-les d’abord, ou masquez ${mot}.`);
    // Double confirmation : 1) l'impact, 2) saisie du nom de la résidence
    if (!confirm(`Supprimer définitivement ${r.nom} ?\n\nCe qui sera effacé, sans retour possible :\n• ${mot} (fiche, photo, description)\n• ses ${nbL(r.id)} ${villa ? 'villa(s)' : 'logement(s)'} et leurs locataires dans Nos locataires\n• les codes d’invitation en attente\n\nAucune sauvegarde n’est conservée. Pour la cacher sans rien perdre, utilisez plutôt « Masquer ».`)) return;
    const saisi = prompt(`Dernière confirmation — action irréversible.\n\nTapez le nom de ${mot} pour confirmer la suppression :\n${r.nom}`);
    if (saisi == null) return;
    if (norm(saisi) !== norm(r.nom)) return toast('Nom différent : suppression annulée.');
    action(async () => check(await sb.rpc('admin_supprimer_residence', { p_id: r.id })), `${r.nom} supprimée.`); });
  // Vidéo de présentation : envoyée telle quelle (MP4 conseillé, 50 Mo max.), lue d'un toucher par les résidents
  box.querySelectorAll('[data-video]').forEach(i => i.onchange = () => { const f = i.files[0]; i.value = ''; if (!f) return;
    if (f.size > 50 * 1024 * 1024) return toast(`Vidéo trop lourde (${Math.round(f.size / 1048576)} Mo) : 50 Mo maximum. Compressez-la (ex. HandBrake, 720p) puis réessayez.`);
    action(async () => { toast('Envoi de la vidéo… cela peut prendre une minute.', 60000);
      const ext = (f.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4', path = `residences/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from('videos').upload(path, f, { contentType: f.type || 'video/mp4' }); if (error) throw error;
      check(await sb.from('residences').update({ video_path: sb.storage.from('videos').getPublicUrl(path).data.publicUrl }).eq('id', rid(i))); }, 'Vidéo en ligne : les résidents la voient sur la fiche.'); });
  box.querySelectorAll('[data-novid]').forEach(b => b.onclick = () => action(async () => check(await sb.from('residences').update({ video_path: null }).eq('id', rid(b))), 'Vidéo retirée.'));
  box.querySelectorAll('[data-photo]').forEach(i => i.onchange = () => i.files[0] && action(async () => { toast('Envoi de la photo…'); const photo_path = await uploadPublic(i.files[0], 'residences'); check(await sb.from('residences').update({ photo_path }).eq('id', rid(i))); }, 'Photo mise à jour.'));
  box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const r = D.find(x => x.id === rid(b)); if (!r) return; edit = r;
    $('#no').value = r.nom || ''; $('#qu').value = r.quartier || ''; $('#tb').value = r.type_bien || ''; $('#or').value = r.ordre ?? 100; $('#de').value = r.description || ''; $('#li').value = r.lien_decouvrir || ''; $('#ph').value = '';
    modeEdition(box, 'Modifier « ' + r.nom + ' »', 'Photo principale (laisser vide pour garder l’actuelle)');
  });
}

// ---------- Nos bonnes adresses (§7 bis) ----------
async function partenaires(box) {
  const { data } = await sb.from('partenaires').select('*').order('ordre');
  const D = data || [];
  const enLigne = (p) => p.valide_par_adress && p.visible;
  const pb = (p) => { const t = []; if (!p.lien) t.push('Sans lien : les résidents ne peuvent pas le contacter');
    else if (p.type_lien === 'WhatsApp' && !/wa\.me|whatsapp|^\+?\d[\d\s]{7,}$/i.test(p.lien)) t.push('Lien WhatsApp invalide (ex : https://wa.me/2250700000000)');
    else if (p.type_lien !== 'WhatsApp' && !/^https?:\/\//i.test(p.lien)) t.push('Lien invalide (doit commencer par https://)');
    if (!p.logo_path) t.push('Sans logo'); return t; };
  const etat = (p) => enLigne(p) ? 'Visible par les résidents' : !p.valide_par_adress ? 'À valider' : 'Validé mais masqué';
  box.innerHTML = `<div class="card"><h3>Ajouter un bon plan</h3><form id="f">
    <div class="grid2"><div><label>Nom *</label><input id="no" type="text" required></div><div><label>Catégorie *</label><select id="ca">${FILTRES_BP.map(c => `<option>${c}</option>`).join('')}</select></div></div>
    <label>Description (200 car. max)</label><input id="de" type="text" maxlength="200">
    <div class="grid2"><div><label>Lien</label><input id="li" type="text" placeholder="https://… ou https://wa.me/225…"></div><div><label>Type de lien</label><select id="tl"><option>Site web</option><option>WhatsApp</option><option>Flipbook</option></select></div></div>
    <label data-lf>Logo</label><input id="lo" type="file" accept="image/*">
    <button class="btn block" style="margin-top:12px">Ajouter</button><button class="btn ghost block" type="button" id="annul" hidden style="margin-top:8px">Annuler</button></form></div>
  <h2>Partenaires</h2><div class="list no-q" id="pts">${D.map(p => `<div class="card" data-id="${p.id}" data-f="${[enLigne(p) ? 'ligne' : '', !p.valide_par_adress ? 'avalider' : '', p.valide_par_adress && !p.visible ? 'masque' : '', pb(p).length ? 'pb' : ''].filter(Boolean).join(' ')}" style="display:flex;gap:12px;align-items:flex-start">
    <div class="ct-im" style="width:52px;height:52px;background-size:contain;${p.logo_path ? `background-image:url('${esc(publicUrl(p.logo_path))}')` : ''}"></div>
    <div style="flex:1;min-width:0"><div class="row" style="justify-content:space-between;align-items:baseline"><b>${esc(p.nom)}</b><span class="st-l ${enLigne(p) ? 'actif' : ''}">${etat(p)}</span></div><div class="muted small">${esc(p.categorie)}${p.lien ? ' · ' + esc(p.type_lien || 'lien') : ''}</div>${pb(p).map(alerte).join('')}
    <div class="row" style="margin-top:6px">
      <button class="btn sm ${p.valide_par_adress ? 'soft' : 'ghost'}" data-k="valide_par_adress" data-v="${p.valide_par_adress ? 0 : 1}">${p.valide_par_adress ? 'Retirer la validation' : 'Valider'}</button>
      <button class="btn sm ${p.visible ? 'soft' : 'ghost'}" data-k="visible" data-v="${p.visible ? 0 : 1}">${p.visible ? 'Masquer' : 'Rendre visible'}</button>
      <label class="btn sm ghost" style="margin:0">Logo<input type="file" accept="image/*" data-logo class="sr"></label>
      <button class="btn sm ghost" data-edit>Modifier</button></div></div></div>`).join('') || '<div class="card center pad">Aucun partenaire.</div>'}</div>`;
  if (D.length) filtres(box.querySelector('#pts'), [['pb', 'À compléter', 1], ['avalider', 'À valider'], ['ligne', 'Visibles'], ['masque', 'Masqués']], 'partenaires', 'Rechercher un partenaire, une catégorie…');
  const $ = (s) => box.querySelector(s); const id = (el) => el.closest('[data-id]').dataset.id;
  let edit = null;
  $('#f').onsubmit = (e) => { e.preventDefault();
    let lien = $('#li').value.trim();
    if (lien && $('#tl').value === 'WhatsApp' && /^\+?\d[\d\s]{7,}$/.test(lien)) { let n = lien.replace(/\D/g, ''); if (n.length === 10) n = '225' + n; lien = 'https://wa.me/' + n; }
    if (lien && !/^https?:\/\//i.test(lien)) return toast('Le lien doit commencer par https:// (ou être un numéro WhatsApp).');
    action(async () => {
    const f = $('#lo').files[0]; const logo_path = f ? await uploadPublic(f, 'partenaires') : null;
    const v = { nom: $('#no').value.trim(), categorie: $('#ca').value, description: $('#de').value.trim() || null, lien: lien || null, type_lien: $('#tl').value };
    if (edit) { if (logo_path) v.logo_path = logo_path; check(await sb.from('partenaires').update(v).eq('id', edit.id)); }
    else check(await sb.from('partenaires').insert({ ...v, logo_path }));
  }, edit ? 'Modifications enregistrées.' : 'Partenaire ajouté.'); };
  box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const p = D.find(x => x.id === id(b)); if (!p) return; edit = p;
    $('#no').value = p.nom || ''; if (![...$('#ca').options].some(o => o.value === p.categorie)) $('#ca').insertAdjacentHTML('beforeend', `<option>${esc(p.categorie)}</option>`); $('#ca').value = p.categorie; $('#de').value = p.description || ''; $('#li').value = p.lien || ''; $('#tl').value = p.type_lien || 'Site web'; $('#lo').value = '';
    modeEdition(box, 'Modifier « ' + p.nom + ' »', 'Logo (laisser vide pour garder l’actuel)');
  });
  box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => action(async () => check(await sb.from('partenaires').update({ [b.dataset.k]: b.dataset.v === '1' }).eq('id', id(b)))));
  box.querySelectorAll('[data-logo]').forEach(i => i.onchange = () => i.files[0] && action(async () => { const logo_path = await uploadPublic(i.files[0], 'partenaires'); check(await sb.from('partenaires').update({ logo_path }).eq('id', id(i))); }, 'Logo mis à jour.'));
}

// ---------- Avis (§8) ----------
async function avis(box) {
  const { data } = await sb.from('avis').select('*').order('created_at', { ascending: false }).limit(300);
  const D = data || [], n = (u) => D.filter(a => a.utilite === u).length;
  const pc = (u) => D.length ? Math.round(100 * n(u) / D.length) : 0;
  box.innerHTML = D.length ? `<div class="grid2 grid3" style="margin-bottom:6px">
    <div class="stat"><div class="v">${pc('Oui')} %</div><div class="l">trouvent l’application utile</div><div class="jauge"><i style="width:${pc('Oui')}%"></i></div><div class="s">${n('Oui')} sur ${D.length} avis</div></div>
    <div class="stat"><div class="v">${D.filter(a => a.amelioration).length}</div><div class="l">suggestions écrites</div></div>
    <div class="stat"><div class="v">${n('Non')}</div><div class="l">avis négatifs</div></div></div>
  <div class="list no-q" id="avs">${D.map(a => `<div class="card" data-f="${['u-' + norm(a.utilite), a.amelioration ? 'texte' : ''].join(' ')}"><div class="row" style="justify-content:space-between;align-items:baseline"><span class="st-l ${a.utilite === 'Oui' ? 'actif' : ''}">Utile : ${esc(a.utilite)}</span><span class="muted small">${a.origine === 'cloture' ? 'après une vente ou un don' : 'depuis le menu'} · ${dateFr(a.created_at)}</span></div>${a.amelioration ? `<p style="margin:8px 0 0">${esc(a.amelioration)}</p>` : ''}</div>`).join('')}</div>` : '<div class="card center pad">Aucun avis pour le moment.</div>';
  if (D.length) filtres(box.querySelector('#avs'), [['texte', 'Avec suggestion'], ['u-oui', 'Oui'], ['u-non', 'Non'], ...[...new Set(D.map(a => a.utilite))].filter(u => !['Oui', 'Non'].includes(u)).map(u => ['u-' + norm(u), u])], 'avis', 'Rechercher dans les suggestions…');
}

// ---------- Paramètres (§5) ----------
const PARAMS = {
  duree_publication_jours: { u: 'jours', min: 7, max: 365, aide: 'Après ce délai, l’annonce expire si le vendeur ne la prolonge pas.' },
  jour_rappel: { u: 'e jour', min: 1, max: 364, aide: 'Le vendeur reçoit « Toujours disponible ? » ce jour-là. Doit être avant la fin de publication.' },
  duree_prolongation_jours: { u: 'jours', min: 1, max: 365, aide: 'Jours ajoutés quand le vendeur touche « Prolonger ».' },
  max_photos: { u: 'photos', min: 1, max: 10, aide: 'Nombre maximum de photos par annonce.' } };
async function parametres(box) {
  const { data } = await sb.from('parametres').select('*').order('cle');
  const D = data || [], val = (k) => +(D.find(p => p.cle === k)?.valeur);
  box.innerHTML = `<div class="list">${D.map(p => { const m = PARAMS[p.cle] || {}; return `<div class="card" data-k="${esc(p.cle)}"><label style="margin-top:0">${esc(p.commentaire || p.cle)}</label>
    <div class="row" style="align-items:center"><input type="number" inputmode="numeric" value="${esc(p.valeur)}" ${m.min != null ? `min="${m.min}" max="${m.max}"` : ''} style="flex:1;max-width:160px"><span class="muted">${esc(m.u || '')}</span><button class="btn sm" style="flex:none" disabled>Enregistrer</button></div>
    ${m.aide ? `<p class="muted small" style="margin:6px 0 0">${esc(m.aide)}</p>` : ''}<p class="a-pb" hidden></p></div>`; }).join('')}</div>`;
  box.querySelectorAll('[data-k]').forEach(c => {
    const i = c.querySelector('input'), b = c.querySelector('button'), e = c.querySelector('.a-pb'), m = PARAMS[c.dataset.k] || {};
    const verif = () => { const v = +i.value; let err = '';
      if (!Number.isInteger(v) || i.value === '') err = 'Nombre entier attendu.';
      else if (m.min != null && (v < m.min || v > m.max)) err = `Entre ${m.min} et ${m.max}.`;
      else if (c.dataset.k === 'jour_rappel' && v >= val('duree_publication_jours')) err = `Doit être inférieur à la durée de publication (${val('duree_publication_jours')} jours), sinon le rappel n’est jamais envoyé.`;
      else if (c.dataset.k === 'duree_publication_jours' && v <= val('jour_rappel')) err = `Doit rester supérieur au jour du rappel (${val('jour_rappel')}).`;
      e.textContent = err; e.hidden = !err; b.disabled = !!err || i.value === i.defaultValue; return !err; };
    i.oninput = verif;
    b.onclick = () => verif() && action(async () => check(await sb.from('parametres').update({ valeur: String(+i.value) }).eq('cle', c.dataset.k)));
  });
}

// =====================================================================
// Écrans pilotés par les tâches : Aujourd'hui · Plan des résidences · Invitation express
// =====================================================================
// Une seule lecture commune : logements, comptes actifs, codes en attente → l'état de chaque logement
async function base() {
  const [res, log, pro, inv] = await Promise.all([
    sb.from('residences').select('id,nom,type_bien').order('nom'),
    sb.from('logements').select('id,code,residence_id,bloc,etage,appartement,locataire,email,type_logement').eq('actif', true),
    sb.from('profiles').select('id,nom_affichage,logement_id,statut,date_activation,date_fin_occupation').eq('statut', 'actif'),
    sb.from('invitations').select('code,logement_id,nom_affichage,email,expire_le,utilisee_par,utilisee_le,created_at,type_occupant,is_adress,is_admin').order('created_at', { ascending: false }).limit(2000)]);
  const R = res.data || [], L = log.data || [], P = pro.data || [], I = inv.data || [];
  const compte = new Map(P.filter(p => p.logement_id).map(p => [p.logement_id, p]));
  const code = new Map(); I.forEach(i => { if (i.logement_id && !i.utilisee_par && new Date(i.expire_le) > Date.now() && !code.has(i.logement_id)) code.set(i.logement_id, i); });
  const etat = (x) => compte.has(x.id) ? 'inscrit' : code.has(x.id) ? 'code' : !x.locataire && !x.email ? 'libre' : ancienCode(x) || !x.locataire || !EMAIL_OK(x.email) ? 'completer' : 'inviter';
  const nomRes = new Map(R.map(r => [r.id, r.nom]));
  return { R, L, P, I, compte, code, etat, nomRes };
}
const fixMail = (m) => { const s = String(m || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').toLowerCase(); return s !== m && EMAIL_OK(s) ? s : ''; };
const ETATS_LOG = { inscrit: 'Inscrit', code: 'Code envoyé', inviter: 'À inviter', completer: 'À compléter', libre: 'Libre' };
const msgInvit = (i) => `Bonjour${i.nom_affichage ? ' ' + i.nom_affichage : ''},\n\nBienvenue dans ADRESS CLUB, l'espace privé des résidents ADRESS IMMOBILIER.\n\n1. Ouvrez ${location.origin + location.pathname}\n2. Touchez « J'ai un code d'invitation »\n3. Saisissez votre code : ${i.code}${i.email ? `\n4. Utilisez obligatoirement votre adresse e-mail : ${i.email}` : ''}\n\nCe code est personnel et valable jusqu'au ${dateFr(i.expire_le)}.`;
const creerInvit = async (x) => check(await sb.from('invitations').insert({ logement_id: x.id, nom_affichage: x.locataire || null, email: (x.email || '').toLowerCase() || null }).select('*').single());
// WhatsApp s'ouvre dans l'onglet réservé au moment du clic (sinon le navigateur bloque la fenêtre après l'attente du code)
const ongletWa = () => { const w = window.open('', '_blank'); if (w) w.opener = null; return w; };
const envoyerWa = (w, texte) => { const u = 'https://wa.me/?text=' + encodeURIComponent(texte); if (w && !w.closed) w.location.href = u; else window.open(u, '_blank', 'noopener'); };
const ilYa = (d) => { const m = (Date.now() - new Date(d)) / 6e4; return m < 60 ? `il y a ${Math.max(1, Math.round(m))} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : m < 2880 ? 'hier' : dateFr(d); };
const plur = (n, s, p = s + 's') => `${n} ${n > 1 ? p : s}`;
document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { const i = document.getElementById('jq'); if (i) { e.preventDefault(); i.focus(); i.select(); } } });

// ---------- Aujourd'hui ----------
async function jour(box) {
  const [B, sig, ann] = await Promise.all([base(),
    sb.from('signalements').select('id,created_at,motif,decision,annonces(titre)').order('created_at', { ascending: false }).limit(50),
    sb.from('annonces').select('id,titre,created_at,profiles(nom_affichage)').order('created_at', { ascending: false }).limit(10)]);
  const { R, L, P, I, compte, code, etat, nomRes } = B;
  const S = sig.data || [], A = ann.data || [];
  const parEtat = (e) => L.filter(x => etat(x) === e);
  const repartition = (l) => { const m = new Map(); l.forEach(x => m.set(x.residence_id, (m.get(x.residence_id) || 0) + 1)); return [...m].sort((a, b) => b[1] - a[1]); };
  const detailRes = (l) => { const r = repartition(l); return r.slice(0, 3).map(([id, n]) => `${nomRes.get(id) || '?'} ${n}`).join(' · ') + (r.length > 3 ? ` · ${r.length - 3} autre${r.length > 4 ? 's' : ''}` : ''); };
  const aInviter = parEtat('inviter'), aCompleter = parEtat('completer');
  const J7 = Date.now() + 7 * J_MS;
  const relances = I.filter(i => i.logement_id && !i.utilisee_par && new Date(i.expire_le) > Date.now() && new Date(i.expire_le) <= J7 && code.get(i.logement_id) === i && !compte.has(i.logement_id));
  const departs = P.filter(p => { const d = dans(p.date_fin_occupation); return d != null && d >= 0 && d <= 30; }).sort((a, b) => new Date(a.date_fin_occupation) - new Date(b.date_fin_occupation));
  const sigAtt = S.filter(s => s.decision === 'en_attente');
  const noms = (l, f) => { const t = l.slice(0, 2).map(f).filter(Boolean); return t.join(' et ') + (l.length > 2 ? ` et ${l.length - 2} autre${l.length > 3 ? 's' : ''}` : ''); };
  const cartes = [
    aInviter.length && { k: 'inviter', tag: 'À inviter', when: plur(repartition(aInviter).length, 'résidence'), n: aInviter.length, label: aInviter.length > 1 ? 'locataires sans code' : 'locataire sans code', detail: detailRes(aInviter) + '. Un message WhatsApp prêt pour chacun.', cta: aInviter.length > 1 ? `Inviter les ${aInviter.length}` : 'Inviter', fort: true },
    aCompleter.length && { k: 'completer', tag: 'À compléter', when: 'bloquant', n: aCompleter.length, label: aCompleter.length > 1 ? 'fiches incomplètes' : 'fiche incomplète', detail: `${detailRes(aCompleter)}. E-mail ou nom manquant, ou e-mail mal écrit : impossible d’inviter sans eux.`, cta: 'Compléter', rouge: true },
    relances.length && { k: 'relance', tag: 'À relancer', when: 'sous 7 jours', n: relances.length, label: relances.length > 1 ? 'codes vont expirer' : 'code va expirer', detail: `${noms(relances, i => i.nom_affichage)} n’${relances.length > 1 ? 'ont' : 'a'} pas encore créé ${relances.length > 1 ? 'leur' : 'son'} compte.`, cta: 'Relancer par WhatsApp' },
    departs.length && { k: 'depart', tag: 'Départs', when: 'sous 30 jours', n: departs.length, label: departs.length > 1 ? 'fins d’occupation' : 'fin d’occupation', detail: `${noms(departs, p => `${p.nom_affichage || 'un compte'} le ${dateFr(p.date_fin_occupation)}`)}. L’accès sera retiré automatiquement.`, cta: 'Voir les comptes' },
    sigAtt.length && { k: 'signal', tag: 'Market', when: 'à examiner', n: sigAtt.length, label: sigAtt.length > 1 ? 'annonces signalées' : 'annonce signalée', detail: noms(sigAtt, s => `« ${s.annonces?.titre || 'annonce'} »`) + '.', cta: 'Examiner', rouge: true }].filter(Boolean);
  const prenom = (state.profil?.nom_affichage || '').trim().split(/\s+/)[0];
  const occ = (rid) => L.filter(x => x.residence_id === rid && (x.locataire || x.email || compte.has(x.id)));
  const adh = R.map(r => { const o = occ(r.id); const m = o.filter(x => compte.has(x.id)).length; return { r, o: o.length, m, pct: o.length ? Math.round(100 * m / o.length) : 0 }; }).filter(a => a.o).sort((a, b) => b.pct - a.pct || b.o - a.o);
  // Fil d'activité : comptes créés, codes envoyés (regroupés par jour), signalements, annonces publiées
  const ev = [];
  P.filter(p => p.date_activation).forEach(p => { const l = L.find(x => x.id === p.logement_id); ev.push({ d: p.date_activation, ini: (p.nom_affichage || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(), cls: 'f', who: p.nom_affichage || 'Un résident', what: `a créé son compte${l ? ` (${nomRes.get(l.residence_id) || ''} ${l.code})` : ''}` }); });
  const parJour = new Map(); I.filter(i => i.logement_id).forEach(i => { const k = new Date(i.created_at).toDateString(); const g = parJour.get(k) || { d: i.created_at, n: 0, res: new Set() }; g.n++; const l = L.find(x => x.id === i.logement_id); if (l) g.res.add(nomRes.get(l.residence_id)); parJour.set(k, g); });
  parJour.forEach(g => ev.push({ d: g.d, ini: 'AD', cls: '', who: 'ADRESS', what: `${plur(g.n, 'code créé', 'codes créés')}${g.res.size ? ' pour ' + [...g.res].filter(Boolean).slice(0, 3).join(', ') : ''}` }));
  S.forEach(s => ev.push({ d: s.created_at, ini: '!', cls: 'r', who: 'Signalement', what: `sur « ${s.annonces?.titre || 'une annonce'} » : ${s.motif || ''}` }));
  A.forEach(a => ev.push({ d: a.created_at, ini: (a.profiles?.nom_affichage || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(), cls: '', who: a.profiles?.nom_affichage || 'Un résident', what: `a publié « ${a.titre} »` }));
  const fil = ev.filter(e => e.d).sort((a, b) => new Date(b.d) - new Date(a.d)).slice(0, 7);
  const jourTxt = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  box.innerHTML = `
  <div class="j-head"><div><span class="j-date">${esc(jourTxt)}</span>
    <h2 class="j-titre">${prenom ? `${(new Date().getHours() >= 18 || new Date().getHours() < 4) ? 'Bonsoir' : 'Bonjour'} ${esc(prenom)}, ` : ''}${cartes.length ? `${plur(cartes.length, 'chose')} à faire aujourd’hui` : 'tout est à jour'}</h2></div>
    <div class="j-q"><label class="j-qbox" for="jq"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="jq" type="search" placeholder="Locataire, logement, e-mail, code…" aria-label="Rechercher un locataire, un logement, un code" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="jqr"><kbd>Ctrl K</kbd></label><div class="j-qr" id="jqr" role="listbox" hidden></div></div></div>
  ${cartes.length ? `<section class="j-cartes" aria-label="Actions du jour">${cartes.map(c => `<article class="j-c">
    <div class="j-c1"><span class="j-tag${c.rouge ? ' r' : ''}">${c.tag}</span><span class="muted small">${c.when}</span></div>
    <div class="j-c2"><span class="j-n">${c.n}</span><b>${c.label}</b></div>
    <p>${esc(c.detail)}</p>
    <button type="button" class="btn sm ${c.fort ? '' : 'soft'} block" data-go="${c.k}">${c.cta}</button></article>`).join('')}</section>`
    : '<div class="card center pad"><b>Rien en attente.</b><p class="muted">Tous les locataires connus ont leur code ou leur compte. Pensez à importer la liste à jour quand des locataires arrivent.</p></div>'}
  <div class="j-bas">
    <section class="card j-adh" aria-labelledby="jadh"><div class="j-sh"><h3 id="jadh">Adhésion au Club</h3><span class="muted small">inscrits / logements occupés</span></div>
      ${adh.length ? (() => { const ligne = (a) => `<a href="#/admin/plan" data-r="${a.r.id}"><b>${esc(a.r.nom)}</b><span class="jauge"><i style="width:${a.pct}%"></i></span><span class="j-v">${a.m} / ${a.o}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></a>`;
        const ap = adh.filter(a => !resVilla(a.r)), vi = adh.filter(a => resVilla(a.r));
        const grp = (ic, lab, A, v) => `<div class="j-g${v ? ' v' : ''}"><div class="j-grp">${ic}<b>${lab}</b><span>${A.length}</span><em>${A.reduce((s, a) => s + a.m, 0)} / ${A.reduce((s, a) => s + a.o, 0)}</em></div>${A.map(ligne).join('')}</div>`;
        return ap.length && vi.length ? grp(IC_RES, 'Résidences', ap) + grp(IC_VIL, 'Villas', vi, 1) : adh.map(ligne).join(''); })() : '<p class="muted">Aucun locataire enregistré.</p>'}
      <p class="muted small">Touchez une ligne pour ouvrir son plan.</p></section>
    <section class="card j-fil" aria-labelledby="jfil"><h3 id="jfil">Ce qui s’est passé</h3>
      ${fil.length ? fil.map(e => `<div class="j-ev"><span class="j-av ${e.cls}" aria-hidden="true">${esc(e.ini)}</span><div><span><b>${esc(e.who)}</b> ${esc(e.what)}</span><span class="muted small">${ilYa(e.d)}</span></div></div>`).join('') : '<p class="muted">Rien pour l’instant.</p>'}</section>
  </div>`;
  const $ = (s) => box.querySelector(s);
  const resMax = (l) => repartition(l)[0]?.[0];
  const GO = {
    inviter: () => { express._mode = 'nouveau'; express._rid = null; location.hash = '#/admin/express'; },
    relance: () => { express._mode = 'relance'; express._rid = null; location.hash = '#/admin/express'; },
    completer: () => { plan._rid = resMax(aCompleter); plan._sel = aCompleter.find(x => x.residence_id === plan._rid)?.id; location.hash = '#/admin/plan'; },
    depart: () => { MEMO_F.comptes = 'depart'; location.hash = '#/admin/comptes'; },
    signal: () => { location.hash = '#/admin/moderation'; } };
  box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => GO[b.dataset.go]());
  box.querySelectorAll('[data-r]').forEach(a => a.onclick = () => { plan._rid = a.dataset.r; plan._sel = null; });
  // Recherche globale : logement, nom, e-mail, code d'invitation
  const q = $('#jq'), out = $('#jqr');
  const idx = L.map(x => ({ x, cle: norm([x.code, x.locataire, x.email, nomRes.get(x.residence_id), compte.get(x.id)?.nom_affichage, code.get(x.id)?.code].join(' ')) }));
  const fermer = () => { out.hidden = true; q.setAttribute('aria-expanded', 'false'); };
  q.oninput = () => {
    const t = norm(q.value).split(/\s+/).filter(Boolean); if (!t.length) return fermer();
    const v = idx.filter(o => t.every(w => o.cle.includes(w))).slice(0, 8);
    out.innerHTML = v.length ? v.map(({ x }) => { const e = etat(x); return `<a href="#/admin/plan" role="option" data-l="${x.id}" data-rr="${x.residence_id}"><span><b>${esc(x.code)}</b> <span class="muted">${esc(nomRes.get(x.residence_id) || '')}</span><span class="j-qn">${esc(compte.get(x.id)?.nom_affichage || x.locataire || 'Libre')}</span></span><span class="pl-pill ${e}">${ETATS_LOG[e]}</span></a>`; }).join('') : '<p class="muted small">Aucun résultat.</p>';
    out.hidden = false; q.setAttribute('aria-expanded', 'true');
    out.querySelectorAll('[data-l]').forEach(a => a.onmousedown = () => { plan._rid = a.dataset.rr; plan._sel = a.dataset.l; });
  };
  q.onkeydown = (e) => { if (e.key === 'Escape') fermer(); if (e.key === 'Enter') { const a = out.querySelector('[data-l]'); if (a) { e.preventDefault(); plan._rid = a.dataset.rr; plan._sel = a.dataset.l; location.hash = '#/admin/plan'; } } };
  q.onblur = () => setTimeout(fermer, 150);
}

// ---------- Plan des résidences ----------
async function plan(box) {
  const B = await base(); const { R, L, compte, code, etat, nomRes, I } = B;
  if (!R.length) { box.innerHTML = '<div class="card center pad">Ajoutez d’abord une résidence dans <a href="#/admin/residences">Résidences</a>.</div>'; return; }
  const avecLog = R.filter(r => L.some(x => x.residence_id === r.id));
  let rid = plan._rid && R.some(r => r.id === plan._rid) ? plan._rid : (avecLog[0] || R[0]).id;
  let sel = plan._sel && L.some(x => x.id === plan._sel && x.residence_id === rid) ? plan._sel : null;
  const dessiner = () => {
    plan._rid = rid; plan._sel = sel;
    const l = L.filter(x => x.residence_id === rid);
    const nb = (e) => l.filter(x => etat(x) === e).length;
    const blocs = [...new Set(l.map(x => x.bloc || ''))].sort((a, b) => (a === '') - (b === '') || a.localeCompare(b, 'fr', { numeric: true }));
    const tuile = (x) => { const e = etat(x), nom = compte.get(x.id)?.nom_affichage || x.locataire || ''; return `<button type="button" class="pl-t ${e}${x.id === sel ? ' sel' : ''}" data-l="${x.id}" aria-pressed="${x.id === sel}" aria-label="${esc(x.code)}, ${ETATS_LOG[e]}${nom ? ', ' + esc(nom) : ''}"><b>${esc(x.appartement || x.code)}</b><span>${esc(nom ? nom.split(/\s+/).slice(0, 2).join(' ') : 'Libre')}</span></button>`; };
    const bloc = (b) => { const lb = l.filter(x => (x.bloc || '') === b); const et = [...new Set(lb.map(x => x.etage || ''))].sort((p, q) => RANG_ET(q) - RANG_ET(p));
      const vil = !b && lb.every(estVilla);
      return `<section class="pl-b"><h3>${b ? 'Bloc ' + esc(b) : vil ? 'Villas' : 'Anciens codes'}</h3>${et.map(e => `<div class="pl-e${vil ? ' pl-vil' : ''}"><span class="pl-el">${vil ? '' : esc(e || '—')}</span><div class="pl-ts">${lb.filter(x => (x.etage || '') === e).sort(triLog).map(tuile).join('')}</div></div>`).join('')}</section>`; };
    const tR = typeDe(R.find(r => r.id === rid)), deux = R.some(resVilla) && R.some(r => !resVilla(r));
    box.innerHTML = `
    ${deux ? choixType(tR, R.filter(r => !resVilla(r)).length, R.filter(resVilla).length) : ''}
    <div class="pl-top"><div class="chips pl-res" role="tablist" aria-label="${tR === 'vil' ? 'Ensemble de villas' : 'Résidence'}">${parType(deux ? R.filter(r => typeDe(r) === tR) : R, r => `<button type="button" role="tab" aria-selected="${r.id === rid}" class="chip ${r.id === rid ? 'on' : ''}" data-r="${r.id}">${esc(r.nom)}</button>`)}</div>
      ${nb('inviter') ? `<button type="button" class="btn sm" id="plx">Inviter les ${nb('inviter')} de ${esc(nomRes.get(rid))}</button>` : ''}</div>
    <div class="pl-leg">${['inscrit', 'code', 'inviter', 'completer', 'libre'].map(e => `<span><i class="pl-sw ${e}"></i>${ETATS_LOG[e]} <b>${nb(e)}</b></span>`).join('')}</div>
    <div class="pl-wrap"><div class="pl-plan">${l.length ? blocs.map(bloc).join('') : '<div class="card center pad">Aucun logement : importez la liste dans <a href="#/admin/annuaire">Nos locataires</a>.</div>'}</div>
      <aside class="pl-f card" id="plf" aria-live="polite">${sel ? '' : `<p class="muted center">Touchez ${tR === 'vil' ? 'une villa' : 'un appartement'} pour ouvrir sa fiche.</p>`}</aside></div>`;
    box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { rid = b.dataset.r; sel = null; dessiner(); });
    box.querySelectorAll('.tsw [data-t]').forEach(b => b.onclick = () => { if (b.dataset.t === tR) return; const T = R.filter(r => typeDe(r) === b.dataset.t); rid = (T.find(r => L.some(x => x.residence_id === r.id)) || T[0]).id; sel = null; dessiner(); });
    box.querySelectorAll('.pl-t').forEach(b => b.onclick = () => { sel = b.dataset.l; box.querySelectorAll('.pl-t').forEach(t => { t.classList.toggle('sel', t === b); t.setAttribute('aria-pressed', t === b); }); fiche(true); });
    const x = box.querySelector('#plx'); if (x) x.onclick = () => { express._mode = 'nouveau'; express._rid = rid; location.hash = '#/admin/express'; };
    if (sel) fiche(false);
  };
  const fiche = (defiler) => {
    plan._sel = sel;
    const x = L.find(y => y.id === sel), f = box.querySelector('#plf'); if (!x) return;
    const e = etat(x), c = compte.get(x.id), i = code.get(x.id);
    const envoye = c ? I.find(v => v.utilisee_par === c.id) || I.find(v => v.logement_id === x.id) : i;
    const etape = (fait, t, s) => `<li class="${fait ? 'fait' : ''}"><b>${t}</b>${s ? `<span class="muted small">${s}</span>` : ''}</li>`;
    const mailKo = x.email && !EMAIL_OK(x.email);
    f.innerHTML = `<div class="pl-fh"><div><span class="muted small">${esc(nomRes.get(x.residence_id) || '')}</span><h3>${esc(x.code)}</h3></div><span class="pl-pill ${e}">${ETATS_LOG[e]}</span></div>
      ${c ? `<p class="pl-ok">Compte actif de <b>${esc(c.nom_affichage || '')}</b>${c.date_activation ? ` depuis le ${dateFr(c.date_activation)}` : ''}.</p>` : ''}
      <form id="plform" novalidate>
        <label for="pln">Locataire</label><input id="pln" type="text" value="${esc(x.locataire || '')}" placeholder="Prénom et nom" ${!x.locataire && e !== 'libre' ? 'aria-invalid="true"' : ''}>
        <label for="plm">E-mail (pour se connecter)</label><input id="plm" type="email" value="${esc(x.email || '')}" placeholder="prenom.nom@exemple.com" ${(!x.email && e !== 'libre') || mailKo ? 'aria-invalid="true"' : ''}>
        ${e === 'libre' || c ? '' : !x.locataire && !x.email ? '' : !x.email ? '<p class="a-pb">E-mail manquant : sans lui, le locataire ne peut pas créer son compte.</p>' : mailKo ? `<p class="a-pb">E-mail mal écrit (accent ou espace)${fixMail(x.email) ? ` · <button type="button" class="lnk" id="plfix">Corriger en ${esc(fixMail(x.email))}</button>` : ''}</p>` : ''}
        <p class="err small" id="plerr" hidden></p>
        ${ancienCode(x) ? '<p class="a-pb">Ancien code : rattachez ce compte au bon appartement dans Comptes › Logement.</p>' : ''}
        <ol class="pl-tl">${etape(!!(x.locataire || c), 'Dans la liste', x.locataire ? esc(x.locataire) : 'nom à saisir')}${etape(!!(envoye || c), 'Code envoyé', envoye ? `${esc(envoye.code)} · ${c ? 'utilisé' : 'valable jusqu’au ' + dateFr(envoye.expire_le)}` : '')}${etape(!!c, 'Inscrit au Club', c?.date_activation ? 'le ' + dateFr(c.date_activation) : '')}</ol>
        <div class="pl-act">
          ${c ? '<a class="btn sm soft block" href="#/admin/comptes">Voir dans Comptes</a>' : `<button class="btn block" id="plgo">${i ? 'Renvoyer le code par WhatsApp' : 'Enregistrer et inviter par WhatsApp'}</button>`}
          <button type="button" class="btn sm ghost block" id="plsave">Enregistrer</button>
          ${e !== 'libre' ? '<button type="button" class="btn sm ghost rouge block" id="pllib">Libérer le logement</button>' : ''}
        </div></form>`;
    const $ = (s) => f.querySelector(s), err = (m) => { $('#plerr').textContent = m; $('#plerr').hidden = !m; };
    const fx = $('#plfix'); if (fx) fx.onclick = () => { $('#plm').value = fixMail(x.email); $('#plm').removeAttribute('aria-invalid'); fx.parentElement.remove(); };
    const lire = () => ({ locataire: $('#pln').value.trim() || null, email: $('#plm').value.trim().toLowerCase() || null });
    const sauver = async () => { const v = lire();
      if (v.email && !EMAIL_OK(v.email)) throw new Error('Cette adresse e-mail n’est pas valide (pas d’accent ni d’espace).');
      if (v.locataire !== (x.locataire || null) || v.email !== (x.email || null)) { check(await sb.from('logements').update(v).eq('id', x.id)); Object.assign(x, v); } };
    $('#plsave').onclick = async () => { err(''); try { await sauver(); toast('Fiche enregistrée.'); dessiner(); } catch (ex) { err(errMsg(ex)); } };
    const go = $('#plgo'); if (go) $('#plform').onsubmit = async (ev) => {
      ev.preventDefault(); err(''); const v = lire();
      if (!v.locataire) return err('Saisissez le nom du locataire.');
      if (!v.email || !EMAIL_OK(v.email)) return err('Saisissez une adresse e-mail valide : le locataire devra l’utiliser pour créer son compte.');
      const w = ongletWa(); go.disabled = true;
      try { await sauver(); const inv = i || await creerInvit(x); if (!i) { code.set(x.id, inv); I.unshift(inv); } envoyerWa(w, msgInvit(inv)); toast(i ? 'Code renvoyé.' : 'Invitation créée.'); dessiner(); }
      catch (ex) { if (w) w.close(); go.disabled = false; err(errMsg(ex)); } };
    else $('#plform').onsubmit = (ev) => ev.preventDefault();
    const lib = $('#pllib'); if (lib) lib.onclick = () => retirerLocataire(x, { compte: c ? (c.nom_affichage || 'ce résident') : null, codeEnAttente: !!i });
    if (defiler && matchMedia('(max-width: 899px)').matches) f.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  dessiner();
}

// ---------- Invitation express : un message après l'autre ----------
async function express(box) {
  const B = await base(); const { R, L, I, compte, code, etat, nomRes } = B;
  let mode = express._mode === 'relance' ? 'relance' : 'nouveau', rid = express._rid || null;
  const resDe = new Map(R.map(r => [r.id, r])); let tx = rid ? typeDe(resDe.get(rid)) : express._t || 'tout';
  const deTx = (o) => tx === 'tout' || typeDe(resDe.get(o.x.residence_id)) === tx;
  const J7 = Date.now() + 7 * J_MS;
  const ordre = (a, b) => (nomRes.get(a.x.residence_id) || '').localeCompare(nomRes.get(b.x.residence_id) || '') || triLog(a.x, b.x);
  const listes = {
    nouveau: L.filter(x => etat(x) === 'inviter').map(x => ({ x, inv: null })).sort(ordre),
    relance: L.filter(x => { const i = code.get(x.id); return i && !compte.has(x.id) && new Date(i.expire_le) <= J7; }).map(x => ({ x, inv: code.get(x.id) })).sort(ordre) };
  const fait = new Map(); // id logement → 'envoye' | 'passe'
  let cur = null;
  const file = () => listes[mode].filter(o => rid ? o.x.residence_id === rid : deTx(o));
  const prochain = () => { const f = file(); cur = (f.find(o => !fait.has(o.x.id)) || null)?.x.id ?? null; };
  const dessiner = () => {
    express._mode = mode; express._rid = rid; express._t = tx;
    const f = file(), n = f.length, env = f.filter(o => fait.get(o.x.id) === 'envoye').length;
    if (cur && !f.some(o => o.x.id === cur)) cur = null;
    if (!cur) prochain();
    const o = f.find(v => v.x.id === cur), k = o ? f.indexOf(o) + 1 : 0;
    const resCount = (r) => listes[mode].filter(v => v.x.residence_id === r).length;
    const resAvec = R.filter(r => resCount(r.id)), deuxX = resAvec.some(resVilla) && resAvec.some(r => !resVilla(r));
    const nT = (t) => listes[mode].filter(v => typeDe(resDe.get(v.x.residence_id)) === t).length, resX = resAvec.filter(r => tx === 'tout' || typeDe(r) === tx);
    const apercu = o ? msgInvit(o.inv || { nom_affichage: o.x.locataire, email: o.x.email, code: '••••••••', expire_le: new Date(Date.now() + 30 * J_MS) }) : '';
    box.innerHTML = `
    <div class="x-top">
      <div class="chips x-mode" role="tablist" aria-label="Type d’envoi"><button type="button" role="tab" class="chip ${mode === 'nouveau' ? 'on' : ''}" aria-selected="${mode === 'nouveau'}" data-m="nouveau">À inviter <span>${listes.nouveau.length}</span></button><button type="button" role="tab" class="chip ${mode === 'relance' ? 'on' : ''}" aria-selected="${mode === 'relance'}" data-m="relance">À relancer <span>${listes.relance.length}</span></button></div>
      ${n ? `<div class="x-prog"><b>${env} envoyé${env > 1 ? 's' : ''} sur ${n}</b><span class="jauge"><i style="width:${Math.round(100 * env / n)}%"></i></span></div>` : ''}
    </div>
    ${deuxX ? choixType(tx, nT('res'), nT('vil'), listes[mode].length) : ''}
    ${resX.length > 1 && (!deuxX || tx !== 'tout') ? `<div class="chips ann-f x-res"><button type="button" class="chip ${!rid ? 'on' : ''}" data-r="">${tx === 'vil' ? 'Toutes les villas' : tx === 'res' ? 'Toutes les résidences' : 'Toutes'} <span>${listes[mode].filter(deTx).length}</span></button>${parType(resX, r => `<button type="button" class="chip ${r.id === rid ? 'on' : ''}" data-r="${r.id}">${esc(r.nom)} <span>${resCount(r.id)}</span></button>`)}</div>` : ''}
    ${!n ? `<div class="card center pad"><b>${mode === 'nouveau' ? 'Personne à inviter.' : 'Aucun code à relancer.'}</b><p class="muted">${mode === 'nouveau' ? 'Tous les locataires complets ont déjà un code ou un compte. Les fiches incomplètes se corrigent dans le <a href="#/admin/plan">plan des résidences</a>.' : 'Aucun code n’expire dans les 7 jours.'}</p></div>`
    : `<div class="x-wrap">
      <section class="card x-file" aria-label="File d’envoi"><ol>${f.map(v => { const s = fait.get(v.x.id) || (v.x.id === cur ? 'cours' : 'att'); return `<li><button type="button" class="x-it ${s}" data-l="${v.x.id}" ${v.x.id === cur ? 'aria-current="true"' : ''}><i aria-hidden="true">${s === 'envoye' ? '<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>' : ''}</i><span><b>${esc(v.x.locataire || '')}</b><span class="muted small">${rid ? '' : esc(nomRes.get(v.x.residence_id) || '') + ' · '}${esc(v.x.code)}</span></span><em>${s === 'envoye' ? 'Envoyé' : s === 'passe' ? 'Passé' : s === 'cours' ? 'En cours' : 'À envoyer'}</em></button></li>`; }).join('')}</ol></section>
      ${o ? `<section class="card x-cur" aria-label="Message en cours"><div class="x-g">
        <span class="x-k">Message ${k} sur ${n}</span>
        <div><h3 class="x-nom">${esc(o.x.locataire || '')}</h3><span class="muted">${esc(nomRes.get(o.x.residence_id) || '')} ${esc(o.x.code)} · ${esc(o.x.email || '')}</span></div>
        <div class="x-code"><span class="muted small">Code personnel</span>${o.inv ? `<b>${esc(o.inv.code)}</b>` : '<b class="x-pend">créé au moment de l’envoi</b>'}${o.inv ? `<span class="muted small">Valable jusqu’au ${dateFr(o.inv.expire_le)}</span>` : ''}</div>
        <button type="button" class="btn block" id="xwa"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5Z"/></svg>Ouvrir WhatsApp avec ce message</button>
        <div class="row"><button type="button" class="btn sm ghost" id="xcp">Copier le message</button><button type="button" class="btn sm ghost" id="xps">Passer</button></div>
        <p class="muted small">Au retour de WhatsApp, l’envoi est coché et le locataire suivant s’affiche.</p></div>
        <figure class="x-wa" aria-label="Aperçu du message"><figcaption>Ce que reçoit le locataire</figcaption><div class="x-bulle">${esc(apercu)}</div></figure></section>`
      : `<section class="card x-cur x-fin"><h3>${env ? `C’est fait : ${plur(env, 'message envoyé', 'messages envoyés')}.` : 'File terminée.'}</h3><p class="muted">${f.some(v => fait.get(v.x.id) === 'passe') ? 'Les locataires passés restent dans la liste pour la prochaine fois.' : 'Les inscriptions s’afficheront dans Aujourd’hui.'}</p><a class="btn sm soft" href="#/admin/jour">Retour à Aujourd’hui</a></section>`}
    </div>`}`;
    box.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; cur = null; dessiner(); });
    box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { rid = b.dataset.r || null; cur = null; dessiner(); });
    box.querySelectorAll('.tsw [data-t]').forEach(b => b.onclick = () => { tx = b.dataset.t; rid = null; cur = null; dessiner(); });
    box.querySelectorAll('.x-it').forEach(b => b.onclick = () => { cur = b.dataset.l; dessiner(); });
    if (!o) return;
    const obtenir = async () => { if (!o.inv) { o.inv = await creerInvit(o.x); code.set(o.x.id, o.inv); I.unshift(o.inv); } return o.inv; };
    const suivant = (etatFin) => { fait.set(o.x.id, etatFin); cur = null; dessiner(); box.querySelector('.x-cur')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
    box.querySelector('#xwa').onclick = async (ev) => { const w = ongletWa(), bt = ev.currentTarget; bt.disabled = true;
      try { const inv = await obtenir(); envoyerWa(w, msgInvit(inv)); toast(`Message prêt pour ${o.x.locataire}.`); suivant('envoye'); }
      catch (ex) { if (w) w.close(); bt.disabled = false; toast(errMsg(ex)); } };
    box.querySelector('#xcp').onclick = async (ev) => { const bt = ev.currentTarget; bt.disabled = true;
      try { const inv = await obtenir(); try { await navigator.clipboard.writeText(msgInvit(inv)); toast('Message copié : collez-le dans WhatsApp.'); } catch (_) { toast('Code : ' + inv.code); } suivant('envoye'); }
      catch (ex) { bt.disabled = false; toast(errMsg(ex)); } };
    box.querySelector('#xps').onclick = () => suivant('passe');
  };
  dessiner();
}

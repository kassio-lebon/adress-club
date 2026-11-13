// ADRESS CLUB — espace de gestion ADRESS (réservé aux comptes is_admin)
import { sb, state, esc, toast, errMsg, dateFr, fcfa, publicUrl, CAT_PARTENAIRES, FILTRES_BP, compress, barreRecherche } from './app.js';

const ONGLETS = [['stats','Indicateurs'],['invitations','Invitations'],['annuaire','Nos locataires'],['comptes','Comptes'],['moderation','Modération'],['annonces','Annonces'],['contenus','Contenus'],['residences','Résidences'],['partenaires','Bons plans'],['avis','Avis'],['parametres','Paramètres']];
const TYPES_CONTENU = ['Nouvelle résidence','Programme à venir','Actualité ADRESS','Flip Immo'];
const TYPES_BIEN = ['Appartements','Villas en résidence','Villas individuelles','Mixte'];

export async function renderAdmin(app, ong) {
  if (!state.profil?.is_admin) { app.innerHTML = '<div class="card">Accès réservé à ADRESS IMMOBILIER.</div>'; return; }
  ong = ong || 'stats';
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Espace ADRESS</h1>
  <div class="tabs chips">${ONGLETS.map(([k, l]) => `<a class="chip ${k === ong ? 'on' : ''}" href="#/admin/${k}">${l}</a>`).join('')}</div><div id="adm"></div>`;
  const box = app.querySelector('#adm');
  await ({ stats, invitations, annuaire, comptes, moderation, annonces, contenus, residences, partenaires, avis, parametres }[ong] || stats)(box);
  if (ong !== 'parametres') {
    box.querySelectorAll('table.adm:not(.no-q)').forEach(t => { if (t.querySelectorAll('tr').length > 3) barreRecherche(t.parentElement.matches('div[style*="overflow"]') ? t.parentElement : t, () => [...t.querySelectorAll('tr')].slice(1), 'Rechercher…'); });
    box.querySelectorAll('.list:not(.no-q)').forEach(l => { if (l.children.length > 3) barreRecherche(l, () => [...l.children], 'Rechercher…'); });
  }
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
  card.querySelector('#annul').hidden = false; card.classList.add('editing');
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
  <div class="card"><h3>Inviter un locataire</h3><p class="muted small">Choisissez la résidence puis le logement : le nom et l’e-mail du locataire se remplissent depuis <a href="#/admin/annuaire">Nos locataires</a>. Le locataire devra créer son compte avec <b>cet e-mail</b>.</p>
  <form id="fi" novalidate>
    <div class="grid2">
      <div><label for="ir">Résidence</label><select id="ir">${R.map(r => `<option value="${r.id}">${esc(r.nom)}</option>`).join('')}</select></div>
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
function lireFeuille(rows) {
  const hi = rows.findIndex(r => (r || []).some(c => norm(c) === 'bloc'));
  if (hi < 0) return { lignes: [], doublons: [], autresMails: [] };
  const H = rows[hi].map(norm);
  const col = (...k) => H.findIndex(h => k.some(x => h === x || h.startsWith(x)));
  const iB = col('bloc'), iE = col('etage'), iA = col('app', 'appartement'), iL = col('locataire'), iM = col('mail', 'email', 'e-mail');
  const etage = (e) => { const s = norm(e).toUpperCase().replace(/\s+/g, ' ');
    if (!s) return ''; if (/^PENT/.test(s)) return 'PENTHOUSE'; if (/^(RDJ|RDC)/.test(s)) return s.slice(0, 3);
    const m = s.match(/\d+/); if (m) return +m[0] === 1 ? '1ER' : m[0] + 'E'; return s.replace(/\s+/g, ''); };
  let bloc = '', vu = new Map(), ordre = [], autresMails = [];
  for (const r of rows.slice(hi + 1)) {
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
    const l = { bloc: bl, etage: e, appartement: a, locataire: g(iL).replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim(), email: mails[0] || '' };
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

// ---------- Annuaire des locataires : Bloc-Étage-Appartement + e-mail, import Excel ----------
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const chargerXlsx = () => window.XLSX ? Promise.resolve(window.XLSX) : new Promise((ok, ko) => { const s = document.createElement('script'); s.src = XLSX_URL; s.onload = () => ok(window.XLSX); s.onerror = () => ko(new Error('Lecture Excel indisponible (réseau).')); document.head.appendChild(s); });
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
async function annuaire(box) {
  const [res, log, occ, inv] = await Promise.all([
    sb.from('residences').select('id,nom').order('nom'),
    sb.from('logements').select('id,code,residence_id,bloc,etage,appartement,locataire,email,actif').eq('actif', true).order('code'),
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
    if (!x.bloc) return [{ t: 'Ancien code : rattachez ce compte au bon appartement (Comptes › Logement)' }];
    if (!x.email) p.push({ k: 'mail' });
    else if (!EMAIL_OK(x.email)) p.push({ k: 'mail', fix: suggestion(x.email) });
    else if (parMail.get(x.email) > 1) p.push({ t: `Même e-mail sur ${parMail.get(x.email)} logements : une seule personne pourra se connecter` });
    if (!x.locataire) p.push({ k: 'nom' });
    if (occupant.has(x.id) && x.locataire && occupant.get(x.id) && !memeNom(occupant.get(x.id), x.locataire)) p.push({ t: `Compte actif au nom de « ${occupant.get(x.id)} » : nouveau locataire ? Retirez l’ancien compte dans Comptes` });
    return p;
  };
  let rid = annuaire._rid && R.some(r => r.id === annuaire._rid) ? annuaire._rid : (R.find(r => L.some(l => l.residence_id === r.id && l.bloc)) || R[0])?.id;
  let filtre = annuaire._f || 'tous', q = '';
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
    const nb = { tous: l.length, pb: l.filter(x => problemes(x).length).length, libre: l.filter(x => (x.locataire || x.email) && ['libre', 'expire'].includes(etat(x))).length, vide: l.filter(x => !x.locataire && !x.email && !occupant.has(x.id)).length, code: l.filter(x => etat(x) === 'code').length, actif: l.filter(x => etat(x) === 'actif').length };
    if (filtre === 'pb' && !nb.pb) filtre = 'tous';
    const FILTRES = [['tous', 'Tous'], ['pb', 'À corriger'], ['libre', 'À inviter'], ['code', 'Code envoyé'], ['actif', 'Comptes actifs'], ['vide', 'Logements libres']];
    box.innerHTML = `
    <div class="card"><h3>Nos locataires</h3><p class="muted small">Seules les personnes de cette liste peuvent recevoir un code : le code ne fonctionne qu’avec l’e-mail indiqué ici. Logement = <b>Bloc-Étage-Appartement</b> (ex : A-RDJ-A001).</p>
      <div class="grid2"><div><label for="ar">Résidence</label><select id="ar">${R.map(r => `<option value="${r.id}" ${r.id === rid ? 'selected' : ''}>${esc(r.nom)} (${L.filter(x => x.residence_id === r.id).length})</option>`).join('')}</select></div>
      <div><label>Mettre à jour depuis Excel</label><label class="btn xl block" for="xl" style="margin:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>Importer un fichier Excel</label><input id="xl" type="file" accept=".xlsx,.xls,.csv" class="sr"></div></div>
      <p class="muted small" style="margin:8px 0 0">Une feuille par résidence (nom de la feuille = nom de la résidence), colonnes : BLOC, ETAGE, APP., LOCATAIRE, MAIL. Plusieurs lignes pour un même appartement = historique : la dernière remplie est gardée.</p>
      <div id="imp"></div></div>
    <details class="card" style="margin-top:12px"><summary>Ajouter un logement</summary><form id="fa" novalidate style="margin-top:10px"><div class="g3f"><div><label for="ab">Bloc</label><input type="text" id="ab" placeholder="A"></div><div><label for="ae">Étage</label><input type="text" id="ae" placeholder="RDJ"></div><div><label for="aa">Appartement</label><input type="text" id="aa" placeholder="A001"></div></div>
      <div class="grid2"><div><label for="an">Locataire</label><input type="text" id="an"></div><div><label for="am">E-mail</label><input id="am" type="email"></div></div>
      <button class="btn block" style="margin-top:12px">Ajouter</button></form></details>
    <div class="ann-bar"><h2>${l.length} logement${l.length > 1 ? 's' : ''}</h2><input type="search" id="aq" placeholder="Rechercher un logement, un nom, un e-mail…" autocomplete="off"></div>
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
        <td>${!x.bloc ? '<span class="muted">—</span>' : p.some(o => o.k === 'nom') ? '<span class="a-bad">Nom manquant</span>' : esc(x.locataire || '—')}${!x.bloc ? '' : x.email && EMAIL_OK(x.email) ? `<div class="small muted">${esc(x.email)}</div>` : `<div class="small a-bad">${x.email ? esc(x.email) + ' (invalide)' : 'E-mail manquant'}${p.find(o => o.fix) ? ` · <button type="button" class="lnk" data-fix="${esc(p.find(o => o.fix).fix)}">Corriger en ${esc(p.find(o => o.fix).fix)}</button>` : ''}</div>`}${p.filter(o => o.t).map(o => alerte(o.t)).join('')}</td>
        <td>${statut(x)}</td><td><div class="row" style="flex-wrap:nowrap;justify-content:flex-end">${(e === 'libre' || e === 'expire') && EMAIL_OK(x.email) ? '<button class="btn sm ghost" data-inv>Inviter</button>' : ''}<button class="btn sm soft" data-ed>Modifier</button>${x.locataire || x.email || occupant.has(x.id) ? '<button class="btn sm ghost rouge" data-vider>Retirer</button>' : ''}</div></td></tr>`; }).join('');
      $('#avide').hidden = !!vis.length;
      brancher();
    };
    $('#ar').onchange = () => { rid = $('#ar').value; dessiner(); };
    $('#aq').oninput = () => { q = $('#aq').value; lignes(); };
    box.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filtre = b.dataset.f; box.querySelectorAll('[data-f]').forEach(c => c.classList.toggle('on', c === b)); annuaire._f = filtre; lignes(); });
    $('#fa').onsubmit = (e) => { e.preventDefault(); if (!$('#ab').value.trim() && !$('#ae').value.trim() && !$('#aa').value.trim()) return toast('Indiquez le bloc, l’étage ou l’appartement.'); const m = $('#am').value.trim().toLowerCase(); if (m && !EMAIL_OK(m)) return toast('E-mail non valide.'); action(async () => check(await sb.from('logements').insert({ residence_id: rid, code: 'tmp-' + Date.now(), bloc: $('#ab').value, etage: $('#ae').value, appartement: $('#aa').value, locataire: $('#an').value || null, email: m || null, type_logement: 'Appartement' })), 'Logement ajouté.'); };
    function brancher() {
    box.querySelectorAll('[data-fix]').forEach(b => b.onclick = () => action(async () => check(await sb.from('logements').update({ email: b.dataset.fix }).eq('id', b.closest('tr').dataset.id)), 'E-mail corrigé.'));
    // Retirer le locataire : le logement redevient libre ; son compte (s'il en a un) est fermé sans perte, son code en attente annulé
    box.querySelectorAll('[data-vider]').forEach(b => b.onclick = () => {
      const x = L.find(y => y.id === b.closest('tr').dataset.id); if (!x) return;
      const nom = x.locataire || occupant.get(x.id) || 'le locataire';
      if (!confirm(`Retirer ${nom} du logement ${x.code} ?\n\n• Le logement redevient libre${occupant.has(x.id) ? '\n• Son accès à ADRESS CLUB est coupé et ses annonces sont mises en pause (rien n’est supprimé)' : ''}${vivant(x.id) ? '\n• Son code d’invitation en attente est annulé' : ''}`)) return;
      action(async () => {
        if (occupant.has(x.id)) check(await sb.from('profiles').update({ statut: 'desactive' }).eq('logement_id', x.id).eq('statut', 'actif'));
        check(await sb.from('invitations').delete().eq('logement_id', x.id).is('utilisee_par', null));
        check(await sb.from('logements').update({ locataire: null, email: null }).eq('id', x.id));
      }, `${x.code} est maintenant libre.`);
    });
    box.querySelectorAll('[data-inv]').forEach(b => b.onclick = () => { invitations._pre = b.closest('tr').dataset.id; location.hash = '#/admin/invitations'; });
    box.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => {
      const tr = b.closest('tr'), x = L.find(y => y.id === tr.dataset.id);
      tr.innerHTML = `<td colspan="4"><form class="ann-ed" novalidate><div class="g3f"><div><label>Bloc</label><input type="text" name="bloc" value="${esc(x.bloc || '')}"></div><div><label>Étage</label><input type="text" name="etage" value="${esc(x.etage || '')}"></div><div><label>Appartement</label><input type="text" name="appartement" value="${esc(x.appartement || '')}"></div></div>
        <div class="grid2"><div><label>Locataire</label><input type="text" name="locataire" value="${esc(x.locataire || '')}"></div><div><label>E-mail</label><input name="email" type="email" value="${esc(x.email || '')}"></div></div>
        <div class="row" style="margin-top:10px"><button class="btn sm">Enregistrer</button><button class="btn sm ghost" type="button" data-x>Annuler</button><button class="btn sm danger" type="button" data-off>Retirer de la liste</button></div></form></td>`;
      const f = tr.querySelector('form'), v = (n) => f.elements[n].value.trim();
      f.querySelector('[data-x]').onclick = dessiner;
      f.querySelector('[data-off]').onclick = () => { if (occupant.has(x.id)) return toast('Ce logement a un compte actif : retirez d’abord le compte (onglet Comptes).'); if (confirm('Retirer ' + x.code + ' de Nos locataires ? (il pourra être réimporté)')) action(async () => check(await sb.from('logements').update({ actif: false }).eq('id', x.id)), 'Logement retiré.'); };
      f.onsubmit = (e) => { e.preventDefault(); const m = v('email').toLowerCase(); if (m && !EMAIL_OK(m)) return toast('E-mail non valide (pas d’accent ni d’espace).'); action(async () => check(await sb.from('logements').update({ bloc: v('bloc'), etage: v('etage'), appartement: v('appartement'), locataire: v('locataire') || null, email: m || null }).eq('id', x.id)), 'Locataire mis à jour.'); };
    });
    }
    lignes();
    $('#xl').onchange = async (e) => {
      const file = e.target.files[0]; e.target.value = ''; if (!file) return;
      const imp = $('#imp'); imp.innerHTML = '<p class="muted small">Lecture du fichier…</p>';
      try {
        const X = await chargerXlsx(); const wb = X.read(await file.arrayBuffer(), { type: 'array' });
        const feuilles = wb.SheetNames.map(n => {
          const { lignes, doublons, autresMails } = lireFeuille(X.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '' }));
          return { nom: n.trim(), lignes, doublons, autresMails, connue: R.some(r => norm(r.nom) === norm(n)), invalides: lignes.filter(x => x.email && !EMAIL_OK(x.email)).length, sans: lignes.filter(x => !x.email).length };
        }).filter(f => f.lignes.length);
        if (!feuilles.length) { imp.innerHTML = '<p class="err">Aucune ligne reconnue : vérifiez les colonnes BLOC, ETAGE, APP., LOCATAIRE, MAIL.</p>'; return; }
        imp.innerHTML = `<div class="imp-prev"><b>Aperçu de l’import</b><ul>${feuilles.map(f => `<li><b>${esc(f.nom)}</b> : ${f.lignes.length} logements${f.connue ? '' : ' <span class="badge warn">nouvelle résidence</span>'}${f.sans ? ` · ${f.sans} sans e-mail` : ''}${f.invalides ? ` · <span class="err">${f.invalides} e-mail invalide${f.invalides > 1 ? 's' : ''}</span>` : ''}${f.doublons.length ? `<div class="a-pb">${f.doublons.map(d => `${esc(d.code)} : ${d.ignores.length + 1} locataires listés, gardé « ${esc(d.garde)} » (le dernier)`).join('<br>')}</div>` : ''}${f.autresMails.length ? `<div class="muted small">${f.autresMails.length} logement${f.autresMails.length > 1 ? 's' : ''} avec plusieurs e-mails : le premier sert à se connecter.</div>` : ''}</li>`).join('')}</ul>
          <label class="check"><input type="checkbox" id="off"> Retirer de la liste les logements absents du fichier (sauf comptes actifs)</label>
          <div class="row" style="margin-top:10px"><button class="btn" type="button" id="ok">Importer</button><button class="btn ghost" type="button" id="no">Annuler</button></div></div>`;
        imp.querySelector('#no').onclick = () => imp.innerHTML = '';
        imp.querySelector('#ok').onclick = async (ev) => {
          ev.target.disabled = true; const bilan = [];
          try { for (const f of feuilles) { const r = check(await sb.rpc('admin_importer_annuaire', { p_residence: f.nom, p_lignes: f.lignes, p_desactiver_absents: imp.querySelector('#off').checked })); bilan.push(`${f.nom} : ${r.crees} ajouté(s), ${r.mis_a_jour} mis à jour${r.desactives ? `, ${r.desactives} retiré(s)` : ''}`); } toast('Annuaire importé.'); annuaire._msg = bilan.join(' — '); await annuaire(box); }
          catch (ex) { ev.target.disabled = false; toast(errMsg(ex)); }
        };
      } catch (ex) { imp.innerHTML = `<p class="err">${esc(errMsg(ex))}</p>`; }
    };
    if (annuaire._msg) { $('#imp').innerHTML = `<p class="inv-ok" style="text-align:left">${esc(annuaire._msg)}</p>`; annuaire._msg = ''; }
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
    sb.from('profiles').select('id,nom_affichage,statut,date_activation,date_fin_occupation,type_occupant,is_admin,is_adress,logement_id,residence_id,logements(code,numero,locataire,bloc),residences(nom)').order('created_at', { ascending: false }),
    sb.from('logements').select('id,code,residence_id,locataire,bloc,etage,appartement,residences(nom)').eq('actif', true)]);
  const D = data || [], LG = (lg.data || []).filter(l => l.bloc).sort((a, b) => (a.residences?.nom || '').localeCompare(b.residences?.nom || '') || triLog(a, b));
  const pris = new Set(D.filter(p => p.statut === 'actif' && p.logement_id).map(p => p.logement_id));
  const tags = (p) => { const d = dans(p.date_fin_occupation), t = [p.statut === 'actif' ? 'actif' : p.statut === 'desactive' ? 'retire' : 'attente'];
    if (p.statut === 'actif' && d != null && d <= 30) t.push('depart'); if (p.is_admin || p.is_adress) t.push('equipe'); if (problemes(p).length) t.push('pb'); return t.join(' '); };
  const problemes = (p) => { const r = [], d = dans(p.date_fin_occupation);
    if (p.statut === 'actif' && d != null && d < 0) r.push('Date de fin dépassée : le retrait automatique n’a pas encore eu lieu, retirez le compte');
    if (p.statut === 'actif' && !p.logement_id && !p.is_adress && !p.is_admin) r.push('Aucun logement rattaché : touchez « Logement »');
    if (p.logement_id && p.logements && !p.logements.bloc) r.push('Ancien code absent de Nos locataires : touchez « Logement » pour le rattacher au bon appartement');
    if (p.statut === 'en_attente' || (p.statut !== 'actif' && p.statut !== 'desactive')) r.push('Compte créé sans code valide : renvoyez-lui une invitation');
    return r; };
  const fin = (p) => { const d = dans(p.date_fin_occupation); return d == null ? '' : d < 0 ? 'dépassée' : d === 0 ? 'aujourd’hui' : `dans ${d} j`; };
  box.innerHTML = `<p class="muted small">« Retirer » coupe l’accès, libère le logement et met ses annonces en pause. Rien n’est perdu : avec un nouveau code, la personne retrouve tout. Une date de fin d’occupation déclenche le retrait automatiquement.</p>
  <div tabindex="0" style="overflow-x:auto" id="cpt"><table class="adm no-q"><thead><tr><th>Résident</th><th>Logement</th><th>Statut</th><th>Fin d'occupation</th><th></th></tr></thead><tbody>
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
      action(async () => { const ancien = p.logements && !p.logements.bloc ? p.logement_id : null;
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
  const { data } = await sb.from('signalements').select('*, annonces(id,titre,statut,retiree_par_adress)').order('created_at', { ascending: false }).limit(200);
  const D = data || [], parAnn = new Map(); D.forEach(s => parAnn.set(s.annonce_id, (parAnn.get(s.annonce_id) || 0) + 1));
  box.innerHTML = `<p class="muted small">L’annonce signalée reste en ligne jusqu’à votre décision. « Retirer » la retire du Market, « Maintenir » clôt le signalement. Vous recevez une notification à chaque nouveau signalement.</p>
  <div class="list no-q" id="mod">${D.map(s => `<div class="card" data-a="${s.annonce_id}" data-f="${s.decision === 'en_attente' ? 'attente' : 'traite'}">
    <div class="row" style="justify-content:space-between;align-items:baseline"><b>${esc(s.annonces?.titre || 'Annonce supprimée')}</b><span class="st-l ${s.decision === 'en_attente' ? 'actif' : ''}">${s.decision === 'en_attente' ? 'À traiter' : s.decision === 'retiree' ? 'Retirée' : 'Maintenue'}</span></div>
    <div class="muted small">Signalé le ${dateFr(s.created_at, true)} · ${esc(s.motif)}${parAnn.get(s.annonce_id) > 1 ? ` · ${parAnn.get(s.annonce_id)} signalements pour cette annonce` : ''}</div>${s.commentaire ? `<p>${esc(s.commentaire)}</p>` : ''}
    <div class="row" style="margin-top:8px">${s.annonces ? `<a class="btn sm soft" href="#/annonce/${s.annonce_id}">Voir l’annonce</a>` : ''}${s.decision === 'en_attente' && s.annonces ? `<button class="btn sm danger" data-r="1">Retirer l'annonce</button><button class="btn sm ghost" data-r="0">Maintenir</button>` : ''}</div></div>`).join('') || '<div class="card center pad">Aucun signalement.</div>'}</div>`;
  if (D.length) filtres(box.querySelector('#mod'), [['attente', 'À traiter', 1], ['traite', 'Traités']], 'moderation', 'Rechercher une annonce, un motif…');
  box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => (b.dataset.r === '0' || confirm('Retirer cette annonce du Market ?')) && action(async () => check(await sb.rpc('admin_retirer_annonce', { p_id: b.closest('[data-a]').dataset.a, p_retirer: b.dataset.r === '1' }))));
}

// ---------- Toutes les annonces : retrait ADRESS après publication (§3) ----------
const STATUT_ANN = { disponible: 'En ligne', reserve: 'Réservée', vendu: 'Vendue', don_effectue: 'Don effectué', retire: 'Retirée par le vendeur', expire: 'Expirée' };
async function annonces(box) {
  const { data } = await sb.from('annonces').select('id,titre,type,prix_fcfa,statut,is_adress,retiree_par_adress,date_publication,date_expiration,signalee').order('date_publication', { ascending: false }).limit(300);
  const D = data || [];
  const tags = (a) => { const t = []; const d = dans(a.date_expiration);
    if (a.retiree_par_adress) t.push('retiree'); else if (['disponible', 'reserve'].includes(a.statut)) { t.push('ligne'); if (a.statut === 'reserve') t.push('reserve'); if (d != null && d <= 7) t.push('bientot'); } else t.push('close');
    if (a.signalee) t.push('signalee'); if (a.is_adress) t.push('adress'); return t.join(' '); };
  box.innerHTML = `<div tabindex="0" style="overflow-x:auto" id="anns"><table class="adm no-q"><thead><tr><th>Annonce</th><th>Statut</th><th>Expire</th><th></th></tr></thead><tbody>
  ${D.map(a => { const d = dans(a.date_expiration), ouverte = !a.retiree_par_adress && ['disponible', 'reserve'].includes(a.statut); return `<tr data-id="${a.id}" data-f="${tags(a)}"><td><a href="#/annonce/${a.id}" class="t-lien"><b>${esc(a.titre)}</b></a>${a.is_adress ? ' <span class="badge soft">ADRESS</span>' : ''}<div class="muted small">${a.type === 'don' ? 'Don' : fcfa(a.prix_fcfa)} · publiée le ${dateFr(a.date_publication)}</div>${a.signalee ? alerte('Signalée : à traiter dans Modération') : ''}</td>
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
async function residences(box) {
  const [{ data }, lg, pr] = await Promise.all([sb.from('residences').select('*').order('ordre'),
    sb.from('logements').select('residence_id,locataire').eq('actif', true),
    sb.from('profiles').select('residence_id').eq('statut', 'actif')]);
  const D = data || [], L = lg.data || [], P = pr.data || [];
  const nbL = (id) => L.filter(x => x.residence_id === id).length, nbO = (id) => L.filter(x => x.residence_id === id && x.locataire).length, nbM = (id) => P.filter(x => x.residence_id === id).length;
  const pb = (r) => { const t = []; if (!r.photo_path) t.push('Sans photo'); if (!r.description) t.push('Sans description'); if (r.visible && !r.lien_decouvrir) t.push('Sans lien « Découvrir »');
    if (!nbL(r.id)) t.push('Aucun logement dans Nos locataires : impossible d’inviter des locataires'); return t; };
  box.innerHTML = `<div class="card"><h3>Ajouter une résidence</h3><form id="f">
    <div class="grid2"><div><label>Nom *</label><input id="no" type="text" required></div><div><label>Quartier</label><input id="qu" type="text"></div></div>
    <div class="grid2"><div><label>Type de bien</label><select id="tb"><option value="">—</option>${TYPES_BIEN.map(t => `<option>${t}</option>`).join('')}</select></div><div><label>Ordre d'affichage</label><input id="or" type="number" value="100"></div></div>
    <label>Description</label><textarea id="de"></textarea>
    <label>Lien « Découvrir »</label><input id="li" type="url" placeholder="https://">
    <label data-lf>Photo</label><input id="ph" type="file" accept="image/*">
    <button class="btn block" style="margin-top:12px">Ajouter</button><button class="btn ghost block" type="button" id="annul" hidden style="margin-top:8px">Annuler</button></form></div>
  <h2>Résidences</h2><div class="list no-q" id="rsd">${D.map(r => `<div class="card" data-id="${r.id}" data-f="${[r.visible ? 'visible' : 'masque', pb(r).length ? 'pb' : ''].join(' ')}" style="display:flex;gap:12px;align-items:flex-start">
    <div class="ct-im" style="width:72px;height:54px;${r.photo_path ? `background-image:url('${esc(publicUrl(r.photo_path))}')` : ''}"></div>
    <div style="flex:1;min-width:0"><b>${esc(r.nom)}</b> <span class="muted small">${esc(r.quartier || '')} · ordre ${r.ordre} · ${r.visible ? 'visible' : 'masquée'}</span>
    <div class="muted small">${nbL(r.id)} logements · ${nbO(r.id)} occupés · ${nbM(r.id)} membres du Club</div>${pb(r).map(alerte).join('')}
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-v="${r.visible ? 0 : 1}">${r.visible ? 'Masquer' : 'Afficher'}</button>
      <label class="btn sm ghost" style="margin:0">Photo<input type="file" accept="image/*" data-photo class="sr"></label>
      <button class="btn sm ghost" data-edit>Modifier</button><a class="btn sm soft" href="#/admin/annuaire" data-ann>Nos locataires</a><button class="btn sm ghost rouge" data-supr>Supprimer</button></div></div></div>`).join('') || '<div class="card center pad">Aucune résidence.</div>'}</div>`;
  if (D.length) filtres(box.querySelector('#rsd'), [['pb', 'À compléter', 1], ['visible', 'Visibles'], ['masque', 'Masquées']], 'residences', 'Rechercher une résidence…');
  const $ = (s) => box.querySelector(s);
  let edit = null;
  $('#f').onsubmit = (e) => { e.preventDefault();
    const nom = $('#no').value.trim();
    if (!edit && D.some(r => norm(r.nom) === norm(nom))) return toast('Cette résidence existe déjà.');
    action(async () => {
    const f = $('#ph').files[0]; const photo_path = f ? await uploadPublic(f, 'residences') : null;
    const v = { nom, quartier: $('#qu').value.trim() || null, type_bien: $('#tb').value || null, ordre: +$('#or').value || 100, description: $('#de').value.trim() || null, lien_decouvrir: $('#li').value.trim() || null };
    if (edit) { if (photo_path) v.photo_path = photo_path; check(await sb.from('residences').update(v).eq('id', edit.id)); }
    else check(await sb.from('residences').insert({ ...v, photo_path }));
  }, edit ? 'Modifications enregistrées.' : 'Résidence ajoutée.'); };
  box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => action(async () => check(await sb.from('residences').update({ visible: b.dataset.v === '1' }).eq('id', b.closest('[data-id]').dataset.id))));
  const rid = (el) => el.closest('[data-id]').dataset.id;
  box.querySelectorAll('[data-ann]').forEach(a => a.onclick = () => { annuaire._rid = rid(a); });
  box.querySelectorAll('[data-supr]').forEach(b => b.onclick = () => { const r = D.find(x => x.id === rid(b)); if (!r) return;
    if (nbM(r.id)) return toast(`${r.nom} a ${nbM(r.id)} membre(s) du Club : retirez-les d’abord, ou masquez la résidence.`);
    // Double confirmation : 1) l'impact, 2) saisie du nom de la résidence
    if (!confirm(`⚠ Supprimer définitivement ${r.nom} ?\n\nCe qui sera effacé, sans retour possible :\n• la résidence (fiche, photo, description)\n• ses ${nbL(r.id)} logement(s) et leurs locataires dans Nos locataires\n• les codes d’invitation en attente\n\nAucune sauvegarde n’est conservée. Pour la cacher sans rien perdre, utilisez plutôt « Masquer ».`)) return;
    const saisi = prompt(`Dernière confirmation — action irréversible.\n\nTapez le nom de la résidence pour la supprimer :\n${r.nom}`);
    if (saisi == null) return;
    if (norm(saisi) !== norm(r.nom)) return toast('Nom différent : suppression annulée.');
    action(async () => check(await sb.rpc('admin_supprimer_residence', { p_id: r.id })), `${r.nom} supprimée.`); });
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
  box.innerHTML = `<p class="muted small">Un partenaire n'apparaît aux résidents que s'il est <b>validé</b> et <b>visible</b>.</p>
  <div class="card"><h3>Ajouter un bon plan</h3><form id="f">
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

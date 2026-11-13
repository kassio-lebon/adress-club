// ADRESS CLUB — espace de gestion ADRESS (réservé aux comptes is_admin)
import { sb, state, esc, toast, errMsg, dateFr, fcfa, publicUrl, CAT_PARTENAIRES, FILTRES_BP, compress, barreRecherche } from './app.js';

const ONGLETS = [['stats','Indicateurs'],['invitations','Invitations'],['annuaire','Annuaire'],['comptes','Comptes'],['moderation','Modération'],['annonces','Annonces'],['contenus','Contenus'],['residences','Résidences'],['partenaires','Bons plans'],['avis','Avis'],['parametres','Paramètres']];
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
    box.querySelectorAll('table.adm').forEach(t => { if (t.querySelectorAll('tr').length > 3) barreRecherche(t.parentElement.matches('div[style*="overflow"]') ? t.parentElement : t, () => [...t.querySelectorAll('tr')].slice(1), 'Rechercher…'); });
    box.querySelectorAll('.list').forEach(l => { if (l.children.length > 3) barreRecherche(l, () => [...l.children], 'Rechercher…'); });
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
  const d = check(await sb.rpc('admin_indicateurs'));
  const L = [['comptes_actifs','Comptes actifs'],['annonces_ouvertes','Annonces en ligne'],['annonces_vente','Annonces de vente'],['annonces_don','Annonces de don'],['objets_clotures','Objets vendus ou donnés'],['delai_moyen_cloture_jours','Délai moyen de clôture (jours)'],['demandes_interet','Demandes « Je suis intéressé »'],['consultations_residences','Consultations résidences'],['clics_flip_immo','Clics Flip Immo'],['clics_partenaires','Clics partenaires'],['avis_total','Avis reçus'],['avis_utiles','Avis « utile »'],['signalements_en_attente','Signalements à traiter']];
  box.innerHTML = `<div class="grid2 grid3">${L.map(([k, l]) => `<div class="stat"><div class="v">${d[k] ?? '–'}</div><div class="l">${l}</div></div>`).join('')}</div>`;
}

// ---------- Invitations et logements (§2) ----------
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
  <div class="card"><h3>Inviter un locataire</h3><p class="muted small">Choisissez la résidence puis le logement : le nom et l’e-mail du locataire se remplissent depuis l’<a href="#/admin/annuaire">annuaire</a>. Le locataire devra créer son compte avec <b>cet e-mail</b>.</p>
  <form id="fi" novalidate>
    <div class="grid2">
      <div><label for="ir">Résidence</label><select id="ir">${R.map(r => `<option value="${r.id}">${esc(r.nom)}</option>`).join('')}</select></div>
      <div><label for="lg">Logement</label><select id="lg"></select></div>
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
  <h2>Invitations</h2><div style="overflow-x:auto"><table class="adm"><tr><th>Locataire</th><th>Logement</th><th>Code</th><th>État</th><th></th></tr>
  ${(inv.data || []).map(i => `<tr data-code="${esc(i.code)}"><td><b>${esc(i.nom_affichage || '—')}</b>${i.is_admin ? ' <span class="badge soft">admin</span>' : ''}${i.email ? `<div class="muted small">${esc(i.email)}</div>` : ''}</td><td>${esc(i.logements?.residences?.nom || '')}<div class="muted small">${esc(i.logements?.numero || i.logements?.code || '—')}</div></td>
    <td><b>${esc(i.code)}</b></td><td>${etat(i)}</td>
    <td>${i.utilisee_par ? '' : `<div class="row" style="flex-wrap:nowrap"><button class="btn sm soft" data-wa>WhatsApp</button><button class="btn sm ghost" data-cp>Copier</button><button class="btn sm ghost" data-del aria-label="Supprimer">×</button></div>`}</td></tr>`).join('')}</table></div>`;
  const $ = (s) => box.querySelector(s);
  const err = (m) => { $('#err').textContent = m; $('#err').hidden = !m; };
  const logSel = () => Lg.find(x => x.id === $('#lg').value);
  const remplir = () => {
    const v = $('#lg').value; $('#nvBox').hidden = v !== '+';
    const l = logSel(); $('#na').value = l?.locataire || ''; $('#em').value = l?.email || '';
    const h = $('#emHint'); h.hidden = !l || !!l.email; h.textContent = 'Pas d’e-mail dans l’annuaire pour ce logement : saisissez-le, il sera enregistré dans l’annuaire.';
  };
  const majLogements = () => {
    const l = Lg.filter(x => x.residence_id === $('#ir').value);
    const etiq = (x) => occupant.has(x.id) ? ` — occupé (${occupant.get(x.id)})` : enAttente.has(x.id) ? ` — code en attente (${enAttente.get(x.id)})` : x.locataire ? ` — ${x.locataire}` : ' — libre';
    $('#lg').innerHTML = l.map(x => `<option value="${x.id}" ${occupant.has(x.id) || enAttente.has(x.id) ? 'disabled' : ''}>${esc((x.code || x.numero) + etiq(x))}</option>`).join('') + '<option value="+">＋ Nouveau logement…</option><option value="0">Sans logement (équipe ADRESS)</option>';
    const libre = [...$('#lg').options].find(o => !o.disabled); if (libre) $('#lg').value = libre.value;
    remplir();
  };
  $('#ir').onchange = majLogements; $('#lg').onchange = () => { remplir(); if ($('#lg').value === '+') $('#nb').focus(); };
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
  box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirm('Supprimer cette invitation ?') && action(async () => check(await sb.from('invitations').delete().eq('code', trouve(b).code)), 'Invitation supprimée.'));
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
    sb.from('invitations').select('logement_id,expire_le,utilisee_par').is('utilisee_par', null)]);
  const R = res.data || [], L = log.data || [];
  const occupant = new Map((occ.data || []).map(p => [p.logement_id, p.nom_affichage || 'actif']));
  const attente = new Set((inv.data || []).filter(i => i.logement_id && new Date(i.expire_le) > new Date()).map(i => i.logement_id));
  let rid = annuaire._rid && R.some(r => r.id === annuaire._rid) ? annuaire._rid : (R.find(r => L.some(l => l.residence_id === r.id && l.bloc)) || R[0])?.id;
  const statut = (l) => occupant.has(l.id) ? '<span class="badge ok">Compte actif</span>' : attente.has(l.id) ? '<span class="badge warn">Code envoyé</span>' : '<span class="badge soft">Pas encore invité</span>';
  const dessiner = () => {
    annuaire._rid = rid;
    const l = L.filter(x => x.residence_id === rid).sort((a, b) => (a.code || '').localeCompare(b.code || '', 'fr', { numeric: true }));
    const sansMail = l.filter(x => !EMAIL_OK(x.email)).length;
    box.innerHTML = `
    <div class="card"><h3>Annuaire des locataires</h3><p class="muted small">Seules les personnes de l’annuaire peuvent recevoir un code : le code ne fonctionne qu’avec l’e-mail indiqué ici. Logement = <b>Bloc-Étage-Appartement</b> (ex : A-RDJ-A001).</p>
      <div class="grid2"><div><label for="ar">Résidence</label><select id="ar">${R.map(r => `<option value="${r.id}" ${r.id === rid ? 'selected' : ''}>${esc(r.nom)} (${L.filter(x => x.residence_id === r.id).length})</option>`).join('')}</select></div>
      <div><label>Mettre à jour depuis Excel</label><label class="btn ghost block" for="xl" style="margin:0">Importer un fichier Excel</label><input id="xl" type="file" accept=".xlsx,.xls,.csv" class="sr"></div></div>
      <p class="muted small" style="margin:8px 0 0">Une feuille par résidence (nom de la feuille = nom de la résidence), colonnes : BLOC, Etage, Appartement, Email, Locataire.</p>
      <div id="imp"></div></div>
    ${sansMail ? `<div class="card res-note" style="margin-top:12px">${sansMail} logement${sansMail > 1 ? 's' : ''} sans e-mail valide : ${sansMail > 1 ? 'ils ne peuvent' : 'il ne peut'} pas encore être invité${sansMail > 1 ? 's' : ''}.</div>` : ''}
    <h2>${l.length} logement${l.length > 1 ? 's' : ''}</h2>
    <div style="overflow-x:auto"><table class="adm"><tr><th>Logement</th><th>Locataire</th><th>Accès</th><th></th></tr>
    ${l.map(x => `<tr data-id="${x.id}"><td><b>${esc(x.code)}</b><div class="muted small">${esc([x.bloc && 'Bloc ' + x.bloc, x.etage, x.appartement].filter(Boolean).join(' · '))}</div></td><td>${esc(x.locataire || '—')}<div class="small ${EMAIL_OK(x.email) ? 'muted' : 'err'}">${esc(x.email || 'e-mail manquant')}</div></td><td>${statut(x)}</td><td><button class="btn sm ghost" data-ed>Modifier</button></td></tr>`).join('')}</table></div>
    <div class="card" style="margin-top:14px"><h3>Ajouter un logement</h3><form id="fa" novalidate><div class="g3f"><div><label for="ab">Bloc</label><input type="text" id="ab" placeholder="A"></div><div><label for="ae">Étage</label><input type="text" id="ae" placeholder="RDJ"></div><div><label for="aa">Appartement</label><input type="text" id="aa" placeholder="A001"></div></div>
      <div class="grid2"><div><label for="an">Locataire</label><input type="text" id="an"></div><div><label for="am">E-mail</label><input id="am" type="email"></div></div>
      <button class="btn block" style="margin-top:12px">Ajouter</button></form></div>`;
    const $ = (s) => box.querySelector(s);
    $('#ar').onchange = () => { rid = $('#ar').value; dessiner(); };
    $('#fa').onsubmit = (e) => { e.preventDefault(); if (!$('#ab').value.trim() && !$('#ae').value.trim() && !$('#aa').value.trim()) return toast('Indiquez le bloc, l’étage ou l’appartement.'); const m = $('#am').value.trim().toLowerCase(); if (m && !EMAIL_OK(m)) return toast('E-mail non valide.'); action(async () => check(await sb.from('logements').insert({ residence_id: rid, code: 'tmp-' + Date.now(), bloc: $('#ab').value, etage: $('#ae').value, appartement: $('#aa').value, locataire: $('#an').value || null, email: m || null, type_logement: 'Appartement' })), 'Logement ajouté.'); };
    box.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => {
      const tr = b.closest('tr'), x = L.find(y => y.id === tr.dataset.id);
      tr.innerHTML = `<td colspan="4"><form class="ann-ed" novalidate><div class="g3f"><div><label>Bloc</label><input type="text" name="bloc" value="${esc(x.bloc || '')}"></div><div><label>Étage</label><input type="text" name="etage" value="${esc(x.etage || '')}"></div><div><label>Appartement</label><input type="text" name="appartement" value="${esc(x.appartement || '')}"></div></div>
        <div class="grid2"><div><label>Locataire</label><input type="text" name="locataire" value="${esc(x.locataire || '')}"></div><div><label>E-mail</label><input name="email" type="email" value="${esc(x.email || '')}"></div></div>
        <div class="row" style="margin-top:10px"><button class="btn sm">Enregistrer</button><button class="btn sm ghost" type="button" data-x>Annuler</button><button class="btn sm danger" type="button" data-off>Retirer de l’annuaire</button></div></form></td>`;
      const f = tr.querySelector('form'), v = (n) => f.elements[n].value.trim();
      f.querySelector('[data-x]').onclick = dessiner;
      f.querySelector('[data-off]').onclick = () => { if (occupant.has(x.id)) return toast('Ce logement a un compte actif : retirez d’abord le compte (onglet Comptes).'); if (confirm('Retirer ' + x.code + ' de l’annuaire ? (il pourra être réimporté)')) action(async () => check(await sb.from('logements').update({ actif: false }).eq('id', x.id)), 'Logement retiré.'); };
      f.onsubmit = (e) => { e.preventDefault(); const m = v('email').toLowerCase(); if (m && !EMAIL_OK(m)) return toast('E-mail non valide (pas d’accent ni d’espace).'); action(async () => check(await sb.from('logements').update({ bloc: v('bloc'), etage: v('etage'), appartement: v('appartement'), locataire: v('locataire') || null, email: m || null }).eq('id', x.id)), 'Annuaire mis à jour.'); };
    });
    $('#xl').onchange = async (e) => {
      const file = e.target.files[0]; e.target.value = ''; if (!file) return;
      const imp = $('#imp'); imp.innerHTML = '<p class="muted small">Lecture du fichier…</p>';
      try {
        const X = await chargerXlsx(); const wb = X.read(await file.arrayBuffer(), { type: 'array' });
        const feuilles = wb.SheetNames.map(n => {
          const rows = X.utils.sheet_to_json(wb.Sheets[n], { defval: '' });
          const lignes = rows.map(r => { const g = (k) => { const c = Object.keys(r).find(h => norm(h) === k); return c ? String(r[c]).trim() : ''; }; return { bloc: g('bloc'), etage: g('etage'), appartement: g('appartement'), email: g('email').toLowerCase(), locataire: g('locataire') }; }).filter(x => x.bloc || x.etage || x.appartement);
          return { nom: n.trim(), lignes, connue: R.some(r => norm(r.nom) === norm(n)), invalides: lignes.filter(x => x.email && !EMAIL_OK(x.email)).length, sans: lignes.filter(x => !x.email).length };
        }).filter(f => f.lignes.length);
        if (!feuilles.length) { imp.innerHTML = '<p class="err">Aucune ligne reconnue : vérifiez les colonnes BLOC, Etage, Appartement, Email, Locataire.</p>'; return; }
        imp.innerHTML = `<div class="imp-prev"><b>Aperçu de l’import</b><ul>${feuilles.map(f => `<li><b>${esc(f.nom)}</b> : ${f.lignes.length} logements${f.connue ? '' : ' <span class="badge warn">nouvelle résidence</span>'}${f.sans ? ` · ${f.sans} sans e-mail` : ''}${f.invalides ? ` · <span class="err">${f.invalides} e-mail invalide${f.invalides > 1 ? 's' : ''}</span>` : ''}</li>`).join('')}</ul>
          <label class="check"><input type="checkbox" id="off"> Retirer de l’annuaire les logements absents du fichier (sauf comptes actifs)</label>
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

// ---------- Comptes (§2) ----------
async function comptes(box) {
  const { data } = await sb.from('profiles').select('id,nom_affichage,statut,date_activation,date_fin_occupation,type_occupant,is_admin,is_adress,logements(code,numero),residences(nom)').order('created_at', { ascending: false });
  box.innerHTML = `<p class="muted">« Retirer » désactive le compte, libère le logement (il redevient disponible pour un nouveau code) et met ses annonces en pause (masquées du Market). Ses annonces, favoris et historique sont conservés : s'il revient avec un nouveau code, il retrouve tout. Vous pouvez aussi renseigner une date de fin : le retrait est alors automatique.</p>
  <div style="overflow-x:auto"><table class="adm"><tr><th>Résident</th><th>Logement</th><th>Statut</th><th>Fin d'occupation</th><th></th></tr>
  ${(data || []).map(p => `<tr data-id="${p.id}"><td><b>${esc(p.nom_affichage || '(sans nom)')}</b>${p.is_admin ? ' <span class="badge soft">admin</span>' : ''}${p.is_adress ? ' <span class="badge soft">ADRESS</span>' : ''}<div class="muted small">${esc(p.type_occupant)} · ${esc(p.residences?.nom || '')}</div></td>
    <td>${p.logements ? esc(p.logements.numero || p.logements.code) : '—'}</td><td>${p.statut === 'actif' ? '<span class="badge ok">actif</span>' : p.statut === 'desactive' ? '<span class="badge soft">retiré</span>' : 'en attente'}</td>
    <td><input type="date" data-fin value="${p.date_fin_occupation || ''}" style="min-width:140px"></td>
    <td>${p.id === state.session.user.id ? '' : `<div class="row" style="flex-wrap:nowrap">${p.statut === 'actif' ? '<button class="btn sm danger" data-st="desactive">Retirer</button>' : p.statut === 'desactive' ? '<span class="muted small">Nouveau code pour revenir</span>' : ''}<button class="btn sm ghost" data-mdp title="Mot de passe oublié">Mot de passe</button></div>`}</td></tr>`).join('')}</table></div>
  <div id="mdpRes"></div>`;
  box.querySelectorAll('[data-fin]').forEach(i => i.onchange = () => action(async () => check(await sb.from('profiles').update({ date_fin_occupation: i.value || null }).eq('id', i.closest('tr').dataset.id)), 'Date enregistrée.'));
  box.querySelectorAll('[data-mdp]').forEach(b => b.onclick = async () => {
    const tr = b.closest('tr'), p = (data || []).find(x => x.id === tr.dataset.id); if (!p) return;
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
  const { data } = await sb.from('signalements').select('*, annonces(id,titre,statut,retiree_par_adress)').order('created_at', { ascending: false }).limit(100);
  box.innerHTML = `<div class="list">${(data || []).map(s => `<div class="card" data-a="${s.annonce_id}">
    <b>${esc(s.annonces?.titre || 'Annonce')}</b> ${s.decision === 'en_attente' ? '<span class="badge warn">à traiter</span>' : `<span class="badge soft">${s.decision === 'retiree' ? 'retirée' : 'maintenue'}</span>`}
    <div class="muted small">Signalé le ${dateFr(s.created_at, true)} · ${esc(s.motif)}</div>${s.commentaire ? `<p>${esc(s.commentaire)}</p>` : ''}
    ${s.decision === 'en_attente' ? `<div class="row" style="margin-top:8px"><button class="btn sm danger" data-r="1">Retirer l'annonce</button><button class="btn sm ghost" data-r="0">Maintenir</button></div>` : ''}</div>`).join('') || '<div class="card center pad">Aucun signalement.</div>'}</div>`;
  box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => action(async () => check(await sb.rpc('admin_retirer_annonce', { p_id: b.closest('[data-a]').dataset.a, p_retirer: b.dataset.r === '1' }))));
}

// ---------- Toutes les annonces : retrait ADRESS après publication (§3) ----------
async function annonces(box) {
  const { data } = await sb.from('annonces').select('id,titre,type,prix_fcfa,statut,is_adress,retiree_par_adress,date_publication,date_expiration,signalee').order('date_publication', { ascending: false }).limit(200);
  box.innerHTML = `<div style="overflow-x:auto"><table class="adm"><tr><th>Annonce</th><th>Statut</th><th>Expire</th><th></th></tr>
  ${(data || []).map(a => `<tr data-id="${a.id}"><td><b>${esc(a.titre)}</b>${a.is_adress ? ' <span class="badge soft">ADRESS</span>' : ''}${a.signalee ? ' <span class="badge warn">signalée</span>' : ''}<div class="muted small">${a.type === 'don' ? 'GRATUIT' : fcfa(a.prix_fcfa)} · ${dateFr(a.date_publication)}</div></td>
    <td>${a.retiree_par_adress ? 'Retirée par ADRESS' : esc(a.statut)}</td><td>${dateFr(a.date_expiration)}</td>
    <td>${a.retiree_par_adress ? '<button class="btn sm ghost" data-r="0">Rétablir</button>' : ['disponible', 'reserve'].includes(a.statut) ? '<button class="btn sm danger" data-r="1">Retirer</button>' : ''}</td></tr>`).join('')}</table></div>`;
  box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => (b.dataset.r === '0' || confirm('Retirer cette annonce du Market ?')) && action(async () => check(await sb.rpc('admin_retirer_annonce', { p_id: b.closest('tr').dataset.id, p_retirer: b.dataset.r === '1' }))));
}

// ---------- Contenus : Nouveautés et Flip Immo (§7) ----------
async function contenus(box) {
  const { data } = await sb.from('contenus').select('*').order('date_parution', { ascending: false });
  box.innerHTML = `<div class="card"><h3>Publier un contenu</h3><form id="f">
    <div class="grid2"><div><label>Type *</label><select id="ty">${TYPES_CONTENU.map(t => `<option>${t}</option>`).join('')}</select></div><div><label>Date de parution</label><input id="dp" type="date" value="${new Date().toISOString().slice(0, 10)}"></div></div>
    <label>Titre *</label><input id="ti" type="text" required>
    <label>Texte</label><textarea id="tx"></textarea>
    <div class="grid2"><div><label>Lien (flipbook, page…)</label><input id="li" type="url" placeholder="https://"></div><div><label>N° (Flip Immo)</label><input id="nu" type="text"></div></div>
    <label data-lf>Image / couverture</label><input id="im" type="file" accept="image/*">
    <button class="btn block" style="margin-top:12px">Publier</button><button class="btn ghost block" type="button" id="annul" hidden style="margin-top:8px">Annuler</button></form></div>
  <h2>Contenus</h2><div class="list">${(data || []).map(c => `<div class="card" data-id="${c.id}" style="display:flex;gap:12px">
    ${c.image_path ? `<img src="${esc(publicUrl(c.image_path))}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:8px">` : ''}
    <div style="flex:1"><b>${esc(c.titre)}</b><div class="muted small">${esc(c.type)} · ${dateFr(c.date_parution)} · ${c.visible ? 'visible' : 'masqué'}</div>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-v="${c.visible ? 0 : 1}">${c.visible ? 'Masquer' : 'Afficher'}</button><button class="btn sm ghost" data-edit>Modifier</button><button class="btn sm danger" data-d>Supprimer</button></div></div></div>`).join('') || '<div class="card center pad">Aucun contenu.</div>'}</div>`;
  const $ = (s) => box.querySelector(s);
  let edit = null;
  $('#f').onsubmit = (e) => { e.preventDefault(); action(async () => {
    const f = $('#im').files[0]; const image_path = f ? await uploadPublic(f, 'contenus') : null;
    const v = { type: $('#ty').value, titre: $('#ti').value.trim(), texte: $('#tx').value.trim() || null, lien: $('#li').value.trim() || null, numero: $('#nu').value.trim() || null, date_parution: $('#dp').value };
    if (edit) { if (image_path) v.image_path = image_path; check(await sb.from('contenus').update(v).eq('id', edit.id)); }
    else check(await sb.from('contenus').insert({ ...v, image_path }));
  }, edit ? 'Modifications enregistrées.' : 'Contenu publié.'); };
  box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const c = (data || []).find(x => x.id === b.closest('[data-id]').dataset.id); if (!c) return; edit = c;
    $('#ty').value = c.type; $('#dp').value = (c.date_parution || '').slice(0, 10); $('#ti').value = c.titre || ''; $('#tx').value = c.texte || ''; $('#li').value = c.lien || ''; $('#nu').value = c.numero || ''; $('#im').value = '';
    modeEdition(box, 'Modifier « ' + c.titre + ' »', 'Image / couverture (laisser vide pour garder l’actuelle)');
  });
  box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => action(async () => check(await sb.from('contenus').update({ visible: b.dataset.v === '1' }).eq('id', b.closest('[data-id]').dataset.id))));
  box.querySelectorAll('[data-d]').forEach(b => b.onclick = () => confirm('Supprimer ce contenu ?') && action(async () => check(await sb.from('contenus').delete().eq('id', b.closest('[data-id]').dataset.id)), 'Supprimé.'));
}

// ---------- Résidences (§7) ----------
async function residences(box) {
  const { data } = await sb.from('residences').select('*').order('ordre');
  box.innerHTML = `<div class="card"><h3>Ajouter une résidence</h3><form id="f">
    <div class="grid2"><div><label>Nom *</label><input id="no" type="text" required></div><div><label>Quartier</label><input id="qu" type="text"></div></div>
    <div class="grid2"><div><label>Type de bien</label><select id="tb"><option value="">—</option>${TYPES_BIEN.map(t => `<option>${t}</option>`).join('')}</select></div><div><label>Ordre d'affichage</label><input id="or" type="number" value="100"></div></div>
    <label>Description</label><textarea id="de"></textarea>
    <label>Lien « Découvrir »</label><input id="li" type="url" placeholder="https://">
    <label data-lf>Photo</label><input id="ph" type="file" accept="image/*">
    <button class="btn block" style="margin-top:12px">Ajouter</button><button class="btn ghost block" type="button" id="annul" hidden style="margin-top:8px">Annuler</button></form></div>
  <h2>Résidences</h2><div class="list">${(data || []).map(r => `<div class="card" data-id="${r.id}" style="display:flex;gap:12px;align-items:center">
    <div style="width:72px;height:54px;flex:none;border-radius:8px;background:#f1f3f5 center/cover no-repeat ${r.photo_path ? `url('${esc(publicUrl(r.photo_path))}')` : ''}"></div>
    <div style="flex:1;min-width:0"><b>${esc(r.nom)}</b> <span class="muted small">${esc(r.quartier || '')} · ordre ${r.ordre} · ${r.visible ? 'visible' : 'masquée'}</span>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-v="${r.visible ? 0 : 1}">${r.visible ? 'Masquer' : 'Afficher'}</button>
      <label class="btn sm ghost" style="margin:0">Photo<input type="file" accept="image/*" data-photo class="sr"></label>
      <button class="btn sm ghost" data-edit>Modifier</button></div></div></div>`).join('') || '<div class="card center pad">Aucune résidence.</div>'}</div>`;
  const $ = (s) => box.querySelector(s);
  let edit = null;
  $('#f').onsubmit = (e) => { e.preventDefault(); action(async () => {
    const f = $('#ph').files[0]; const photo_path = f ? await uploadPublic(f, 'residences') : null;
    const v = { nom: $('#no').value.trim(), quartier: $('#qu').value.trim() || null, type_bien: $('#tb').value || null, ordre: +$('#or').value || 100, description: $('#de').value.trim() || null, lien_decouvrir: $('#li').value.trim() || null };
    if (edit) { if (photo_path) v.photo_path = photo_path; check(await sb.from('residences').update(v).eq('id', edit.id)); }
    else check(await sb.from('residences').insert({ ...v, photo_path }));
  }, edit ? 'Modifications enregistrées.' : 'Résidence ajoutée.'); };
  box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => action(async () => check(await sb.from('residences').update({ visible: b.dataset.v === '1' }).eq('id', b.closest('[data-id]').dataset.id))));
  const rid = (el) => el.closest('[data-id]').dataset.id;
  box.querySelectorAll('[data-photo]').forEach(i => i.onchange = () => i.files[0] && action(async () => { toast('Envoi de la photo…'); const photo_path = await uploadPublic(i.files[0], 'residences'); check(await sb.from('residences').update({ photo_path }).eq('id', rid(i))); }, 'Photo mise à jour.'));
  box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const r = (data || []).find(x => x.id === rid(b)); if (!r) return; edit = r;
    $('#no').value = r.nom || ''; $('#qu').value = r.quartier || ''; $('#tb').value = r.type_bien || ''; $('#or').value = r.ordre ?? 100; $('#de').value = r.description || ''; $('#li').value = r.lien_decouvrir || ''; $('#ph').value = '';
    modeEdition(box, 'Modifier « ' + r.nom + ' »', 'Photo principale (laisser vide pour garder l’actuelle)');
  });
}

// ---------- Nos bonnes adresses (§7 bis) ----------
async function partenaires(box) {
  const { data } = await sb.from('partenaires').select('*').order('ordre');
  box.innerHTML = `<p class="muted">Un partenaire n'apparaît aux résidents que s'il est <b>validé par ADRESS</b> et <b>visible</b>.</p>
  <div class="card"><h3>Ajouter un bon plan</h3><form id="f">
    <div class="grid2"><div><label>Nom *</label><input id="no" type="text" required></div><div><label>Catégorie *</label><select id="ca">${FILTRES_BP.map(c => `<option>${c}</option>`).join('')}</select></div></div>
    <label>Description (200 car. max)</label><input id="de" type="text" maxlength="200">
    <div class="grid2"><div><label>Lien</label><input id="li" type="url" placeholder="https://"></div><div><label>Type de lien</label><select id="tl"><option>Site web</option><option>WhatsApp</option><option>Flipbook</option></select></div></div>
    <label data-lf>Logo</label><input id="lo" type="file" accept="image/*">
    <button class="btn block" style="margin-top:12px">Ajouter</button><button class="btn ghost block" type="button" id="annul" hidden style="margin-top:8px">Annuler</button></form></div>
  <h2>Partenaires</h2><div class="list">${(data || []).map(p => `<div class="card" data-id="${p.id}" style="display:flex;gap:12px;align-items:center">
    <div style="width:52px;height:52px;flex:none;border-radius:8px;background:#f1f3f5 center/contain no-repeat ${p.logo_path ? `url('${esc(publicUrl(p.logo_path))}')` : ''}"></div>
    <div style="flex:1;min-width:0"><b>${esc(p.nom)}</b><div class="muted small">${esc(p.categorie)} · ${p.lien ? 'lien ✓' : 'sans lien'}</div>
    <div class="row" style="margin-top:6px">
      <button class="btn sm ${p.valide_par_adress ? 'soft' : 'ghost'}" data-k="valide_par_adress" data-v="${p.valide_par_adress ? 0 : 1}">${p.valide_par_adress ? 'Validé ✓' : 'Valider'}</button>
      <button class="btn sm ${p.visible ? 'soft' : 'ghost'}" data-k="visible" data-v="${p.visible ? 0 : 1}">${p.visible ? 'Visible ✓' : 'Rendre visible'}</button>
      <label class="btn sm ghost" style="margin:0">Logo<input type="file" accept="image/*" data-logo class="sr"></label>
      <button class="btn sm ghost" data-edit>Modifier</button></div></div></div>`).join('')}</div>`;
  const $ = (s) => box.querySelector(s); const id = (el) => el.closest('[data-id]').dataset.id;
  let edit = null;
  $('#f').onsubmit = (e) => { e.preventDefault(); action(async () => {
    const f = $('#lo').files[0]; const logo_path = f ? await uploadPublic(f, 'partenaires') : null;
    const v = { nom: $('#no').value.trim(), categorie: $('#ca').value, description: $('#de').value.trim() || null, lien: $('#li').value.trim() || null, type_lien: $('#tl').value };
    if (edit) { if (logo_path) v.logo_path = logo_path; check(await sb.from('partenaires').update(v).eq('id', edit.id)); }
    else check(await sb.from('partenaires').insert({ ...v, logo_path }));
  }, edit ? 'Modifications enregistrées.' : 'Partenaire ajouté.'); };
  box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const p = (data || []).find(x => x.id === id(b)); if (!p) return; edit = p;
    $('#no').value = p.nom || ''; if (![...$('#ca').options].some(o => o.value === p.categorie)) $('#ca').insertAdjacentHTML('beforeend', `<option>${esc(p.categorie)}</option>`); $('#ca').value = p.categorie; $('#de').value = p.description || ''; $('#li').value = p.lien || ''; $('#tl').value = p.type_lien || 'Site web'; $('#lo').value = '';
    modeEdition(box, 'Modifier « ' + p.nom + ' »', 'Logo (laisser vide pour garder l’actuel)');
  });
  box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => action(async () => check(await sb.from('partenaires').update({ [b.dataset.k]: b.dataset.v === '1' }).eq('id', id(b)))));
  box.querySelectorAll('[data-logo]').forEach(i => i.onchange = () => i.files[0] && action(async () => { const logo_path = await uploadPublic(i.files[0], 'partenaires'); check(await sb.from('partenaires').update({ logo_path }).eq('id', id(i))); }, 'Logo mis à jour.'));
}

// ---------- Avis (§8) ----------
async function avis(box) {
  const { data } = await sb.from('avis').select('*').order('created_at', { ascending: false }).limit(200);
  box.innerHTML = `<div class="list">${(data || []).map(a => `<div class="card"><span class="badge ${a.utilite === 'Oui' ? 'ok' : a.utilite === 'Non' ? 'warn' : 'soft'}">${esc(a.utilite)}</span> <span class="muted small">${a.origine === 'cloture' ? 'après clôture d\'annonce' : 'depuis le menu'} · ${dateFr(a.created_at)}</span>${a.amelioration ? `<p>${esc(a.amelioration)}</p>` : ''}</div>`).join('') || '<div class="card center pad">Aucun avis.</div>'}</div>`;
}

// ---------- Paramètres (§5) ----------
async function parametres(box) {
  const { data } = await sb.from('parametres').select('*').order('cle');
  box.innerHTML = `<div class="list">${(data || []).map(p => `<div class="card" data-k="${esc(p.cle)}"><label style="margin-top:0">${esc(p.commentaire || p.cle)}</label>
    <div class="row"><input type="number" value="${esc(p.valeur)}" style="flex:1"><button class="btn sm">Enregistrer</button></div></div>`).join('')}</div>`;
  box.querySelectorAll('[data-k] button').forEach(b => b.onclick = () => { const c = b.closest('[data-k]'); action(async () => check(await sb.from('parametres').update({ valeur: c.querySelector('input').value }).eq('cle', c.dataset.k))); });
}

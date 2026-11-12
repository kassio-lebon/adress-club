// ADRESS CLUB — espace de gestion ADRESS (réservé aux comptes is_admin)
import { sb, state, esc, toast, errMsg, dateFr, fcfa, publicUrl, CAT_PARTENAIRES, FILTRES_BP, compress, barreRecherche } from './app.js';

const ONGLETS = [['stats','Indicateurs'],['invitations','Invitations'],['comptes','Comptes'],['moderation','Modération'],['annonces','Annonces'],['contenus','Contenus'],['residences','Résidences'],['partenaires','Bons plans'],['avis','Avis'],['parametres','Paramètres']];
const TYPES_CONTENU = ['Nouvelle résidence','Programme à venir','Actualité ADRESS','Flip Immo'];
const TYPES_BIEN = ['Appartements','Villas en résidence','Villas individuelles','Mixte'];

export async function renderAdmin(app, ong) {
  if (!state.profil?.is_admin) { app.innerHTML = '<div class="card">Accès réservé à ADRESS IMMOBILIER.</div>'; return; }
  ong = ong || 'stats';
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Espace ADRESS</h1>
  <div class="tabs chips">${ONGLETS.map(([k, l]) => `<a class="chip ${k === ong ? 'on' : ''}" href="#/admin/${k}">${l}</a>`).join('')}</div><div id="adm"></div>`;
  const box = app.querySelector('#adm');
  await ({ stats, invitations, comptes, moderation, annonces, contenus, residences, partenaires, avis, parametres }[ong] || stats)(box);
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
async function action(fn, ok = 'Enregistré.') { try { await fn(); toast(ok); rerender(); } catch (e) { toast(errMsg(e)); } }

// ---------- Indicateurs (§8) ----------
async function stats(box) {
  const d = check(await sb.rpc('admin_indicateurs'));
  const L = [['comptes_actifs','Comptes actifs'],['annonces_ouvertes','Annonces en ligne'],['annonces_vente','Annonces de vente'],['annonces_don','Annonces de don'],['objets_clotures','Objets vendus ou donnés'],['delai_moyen_cloture_jours','Délai moyen de clôture (jours)'],['demandes_interet','Demandes « Je suis intéressé »'],['consultations_residences','Consultations résidences'],['clics_flip_immo','Clics Flip Immo'],['clics_partenaires','Clics partenaires'],['avis_total','Avis reçus'],['avis_utiles','Avis « utile »'],['signalements_en_attente','Signalements à traiter']];
  box.innerHTML = `<div class="grid2 grid3">${L.map(([k, l]) => `<div class="stat"><div class="v">${d[k] ?? '–'}</div><div class="l">${l}</div></div>`).join('')}</div>`;
}

// ---------- Invitations et logements (§2) ----------
async function invitations(box) {
  const [res, log, inv] = await Promise.all([
    sb.from('residences').select('id,nom').order('nom'),
    sb.from('logements').select('id,code,numero,residence_id').eq('actif', true).order('code'),
    sb.from('invitations').select('*, logements(code,numero,residences(nom))').order('created_at', { ascending: false }).limit(200)]);
  const R = res.data || [], Lg = log.data || [];
  const lienApp = location.origin + location.pathname;
  const message = (i) => `Bonjour${i.nom_affichage ? ' ' + i.nom_affichage : ''},\n\nBienvenue dans ADRESS CLUB, l'espace privé des résidents ADRESS IMMOBILIER.\n\n1. Ouvrez ${lienApp}\n2. Touchez « J'ai un code d'invitation »\n3. Saisissez votre code : ${i.code}\n\nCe code est personnel et valable jusqu'au ${dateFr(i.expire_le)}.`;
  const etat = (i) => i.utilisee_par ? `<span class="badge ok">Activé le ${dateFr(i.utilisee_le)}</span>` : new Date(i.expire_le) < new Date() ? '<span class="badge soft">Expiré</span>' : '<span class="badge warn">En attente</span>';
  if (!R.length) { box.innerHTML = '<div class="card center pad">Ajoutez d’abord une résidence dans l’onglet <a href="#/admin/residences">Résidences</a>.</div>'; return; }
  box.innerHTML = `
  <div class="card"><h3>Inviter un locataire</h3><p class="muted small">Un code par personne. Plusieurs personnes dans un même logement = plusieurs codes.</p>
  <form id="fi">
    <div class="grid2">
      <div><label for="ir">Résidence</label><select id="ir">${R.map(r => `<option value="${r.id}">${esc(r.nom)}</option>`).join('')}</select></div>
      <div><label for="lg">Logement</label><select id="lg"></select></div>
    </div>
    <div id="nvBox" hidden><label for="nv">N° du nouveau logement</label><input id="nv" type="text" placeholder="ex : A12" autocomplete="off"></div>
    <label for="na">Nom du locataire</label><input id="na" type="text" placeholder="ex : M. Koné" autocomplete="off">
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
  ${(inv.data || []).map(i => `<tr data-code="${esc(i.code)}"><td><b>${esc(i.nom_affichage || '—')}</b>${i.is_admin ? ' <span class="badge soft">admin</span>' : ''}</td><td>${esc(i.logements?.residences?.nom || '')}<div class="muted small">${esc(i.logements?.numero || i.logements?.code || '—')}</div></td>
    <td><b>${esc(i.code)}</b></td><td>${etat(i)}</td>
    <td>${i.utilisee_par ? '' : `<div class="row" style="flex-wrap:nowrap"><button class="btn sm soft" data-wa>WhatsApp</button><button class="btn sm ghost" data-cp>Copier</button><button class="btn sm ghost" data-del aria-label="Supprimer">×</button></div>`}</td></tr>`).join('')}</table></div>`;
  const $ = (s) => box.querySelector(s);
  const err = (m) => { $('#err').textContent = m; $('#err').hidden = !m; };
  const majLogements = () => {
    const l = Lg.filter(x => x.residence_id === $('#ir').value);
    $('#lg').innerHTML = l.map(x => `<option value="${x.id}">${esc(x.numero || x.code)}</option>`).join('') + '<option value="+">＋ Nouveau logement…</option>';
    $('#nvBox').hidden = $('#lg').value !== '+';
  };
  $('#ir').onchange = majLogements; $('#lg').onchange = () => { $('#nvBox').hidden = $('#lg').value !== '+'; if ($('#lg').value === '+') $('#nv').focus(); };
  majLogements();
  const partager = (i) => {
    const r = $('#res'); r.hidden = false;
    r.innerHTML = `<div class="inv-ok"><small>Code de ${esc(i.nom_affichage || 'ce locataire')}</small><b>${esc(i.code)}</b>
      <div class="row"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(message(i))}">Envoyer par WhatsApp</a><button class="btn ghost" type="button" id="cpm">Copier le message</button></div></div>`;
    $('#cpm').onclick = async () => { try { await navigator.clipboard.writeText(message(i)); toast('Message copié.'); } catch (_) { toast(i.code); } };
    r.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  $('#fi').onsubmit = async (e) => {
    e.preventDefault(); err('');
    const go = $('#go'); go.disabled = true;
    try {
      let logement = $('#lg').value;
      if (logement === '+') {
        const num = $('#nv').value.trim().toUpperCase(); if (!num) { go.disabled = false; return err('Indiquez le numéro du logement.'); }
        const pref = (R.find(r => r.id === $('#ir').value)?.nom || 'RES').normalize('NFD').replace(/[^A-Za-z ]/g, '').split(' ').filter(w => w.length > 2 && !/^(residence|les|des)$/i.test(w)).map(w => w[0]).join('').toUpperCase().slice(0, 4) || 'RES';
        const d = check(await sb.from('logements').insert({ residence_id: $('#ir').value, code: `${pref}-${num}-${Date.now().toString(36).slice(-3).toUpperCase()}`, numero: num, type_logement: 'Appartement' }).select('id,code,numero,residence_id').single());
        Lg.push(d); logement = d.id;
      }
      const i = check(await sb.from('invitations').insert({ logement_id: logement, nom_affichage: $('#na').value.trim() || null, type_occupant: $('#to').value, responsable: $('#rp').value.trim() || null, date_fin_occupation: $('#fo').value || null, is_adress: $('#ia').checked, is_admin: $('#ad').checked }).select('*').single());
      toast('Invitation créée.'); partager(i);
      $('#na').value = ''; $('#nv').value = ''; majLogements(); $('#lg').value = logement; $('#nvBox').hidden = true;
    } catch (ex) { err(errMsg(ex)); }
    go.disabled = false;
  };
  const trouve = (b) => (inv.data || []).find(x => x.code === b.closest('[data-code]').dataset.code);
  box.querySelectorAll('[data-wa]').forEach(b => b.onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(message(trouve(b))), '_blank', 'noopener'));
  box.querySelectorAll('[data-cp]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(message(trouve(b))); toast('Message copié.'); } catch (_) { toast(trouve(b).code); } });
  box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirm('Supprimer cette invitation ?') && action(async () => check(await sb.from('invitations').delete().eq('code', trouve(b).code)), 'Invitation supprimée.'));
}

// ---------- Comptes (§2) ----------
async function comptes(box) {
  const { data } = await sb.from('profiles').select('id,nom_affichage,statut,date_activation,date_fin_occupation,type_occupant,is_admin,is_adress,logements(code),residences(nom)').order('created_at', { ascending: false });
  box.innerHTML = `<p class="muted">Désactivez un compte en fin d'occupation, ou renseignez la date de fin : la désactivation est alors automatique.</p>
  <div style="overflow-x:auto"><table class="adm"><tr><th>Résident</th><th>Logement</th><th>Statut</th><th>Fin d'occupation</th><th></th></tr>
  ${(data || []).map(p => `<tr data-id="${p.id}"><td><b>${esc(p.nom_affichage || '(sans nom)')}</b>${p.is_admin ? ' <span class="badge soft">admin</span>' : ''}${p.is_adress ? ' <span class="badge soft">ADRESS</span>' : ''}<div class="muted small">${esc(p.type_occupant)} · ${esc(p.residences?.nom || '')}</div></td>
    <td>${esc(p.logements?.code || '—')}</td><td>${p.statut === 'actif' ? '<span class="badge ok">actif</span>' : p.statut === 'desactive' ? '<span class="badge warn">désactivé</span>' : 'en attente'}</td>
    <td><input type="date" data-fin value="${p.date_fin_occupation || ''}" style="min-width:140px"></td>
    <td>${p.id === state.session.user.id ? '' : p.statut === 'actif' ? '<button class="btn sm danger" data-st="desactive">Désactiver</button>' : p.statut === 'desactive' ? '<button class="btn sm ghost" data-st="actif">Réactiver</button>' : ''}</td></tr>`).join('')}</table></div>`;
  box.querySelectorAll('[data-fin]').forEach(i => i.onchange = () => action(async () => check(await sb.from('profiles').update({ date_fin_occupation: i.value || null }).eq('id', i.closest('tr').dataset.id)), 'Date enregistrée.'));
  box.querySelectorAll('[data-st]').forEach(b => b.onclick = () => (b.dataset.st === 'actif' || confirm('Désactiver ce compte ? Le résident ne pourra plus accéder à ADRESS CLUB.')) && action(async () => check(await sb.from('profiles').update({ statut: b.dataset.st }).eq('id', b.closest('tr').dataset.id))));
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
    <label>Image / couverture</label><input id="im" type="file" accept="image/*">
    <button class="btn block" style="margin-top:12px">Publier</button></form></div>
  <h2>Contenus</h2><div class="list">${(data || []).map(c => `<div class="card" data-id="${c.id}" style="display:flex;gap:12px">
    ${c.image_path ? `<img src="${esc(publicUrl(c.image_path))}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:8px">` : ''}
    <div style="flex:1"><b>${esc(c.titre)}</b><div class="muted small">${esc(c.type)} · ${dateFr(c.date_parution)} · ${c.visible ? 'visible' : 'masqué'}</div>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-v="${c.visible ? 0 : 1}">${c.visible ? 'Masquer' : 'Afficher'}</button><button class="btn sm danger" data-d>Supprimer</button></div></div></div>`).join('') || '<div class="card center pad">Aucun contenu.</div>'}</div>`;
  const $ = (s) => box.querySelector(s);
  $('#f').onsubmit = (e) => { e.preventDefault(); action(async () => {
    const f = $('#im').files[0]; const image_path = f ? await uploadPublic(f, 'contenus') : null;
    check(await sb.from('contenus').insert({ type: $('#ty').value, titre: $('#ti').value.trim(), texte: $('#tx').value.trim() || null, lien: $('#li').value.trim() || null, numero: $('#nu').value.trim() || null, date_parution: $('#dp').value, image_path }));
  }, 'Contenu publié.'); };
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
    <label>Photo</label><input id="ph" type="file" accept="image/*">
    <button class="btn block" style="margin-top:12px">Ajouter</button></form></div>
  <h2>Résidences</h2><div class="list">${(data || []).map(r => `<div class="card" data-id="${r.id}" style="display:flex;gap:12px;align-items:center">
    <div style="width:72px;height:54px;flex:none;border-radius:8px;background:#f1f3f5 center/cover no-repeat ${r.photo_path ? `url('${esc(publicUrl(r.photo_path))}')` : ''}"></div>
    <div style="flex:1;min-width:0"><b>${esc(r.nom)}</b> <span class="muted small">${esc(r.quartier || '')} · ordre ${r.ordre} · ${r.visible ? 'visible' : 'masquée'}</span>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-v="${r.visible ? 0 : 1}">${r.visible ? 'Masquer' : 'Afficher'}</button>
      <label class="btn sm ghost" style="margin:0">Photo<input type="file" accept="image/*" data-photo class="sr"></label>
      <button class="btn sm ghost" data-edit>Modifier</button></div></div></div>`).join('') || '<div class="card center pad">Aucune résidence.</div>'}</div>`;
  const $ = (s) => box.querySelector(s);
  $('#f').onsubmit = (e) => { e.preventDefault(); action(async () => {
    const f = $('#ph').files[0]; const photo_path = f ? await uploadPublic(f, 'residences') : null;
    check(await sb.from('residences').insert({ nom: $('#no').value.trim(), quartier: $('#qu').value.trim() || null, type_bien: $('#tb').value || null, ordre: +$('#or').value || 100, description: $('#de').value.trim() || null, lien_decouvrir: $('#li').value.trim() || null, photo_path }));
  }, 'Résidence ajoutée.'); };
  box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => action(async () => check(await sb.from('residences').update({ visible: b.dataset.v === '1' }).eq('id', b.closest('[data-id]').dataset.id))));
  const rid = (el) => el.closest('[data-id]').dataset.id;
  box.querySelectorAll('[data-photo]').forEach(i => i.onchange = () => i.files[0] && action(async () => { toast('Envoi de la photo…'); const photo_path = await uploadPublic(i.files[0], 'residences'); check(await sb.from('residences').update({ photo_path }).eq('id', rid(i))); }, 'Photo mise à jour.'));
  box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const r = (data || []).find(x => x.id === rid(b)); if (!r) return;
    const nom = prompt('Nom de la résidence', r.nom); if (nom === null) return;
    const quartier = prompt('Quartier', r.quartier || ''); if (quartier === null) return;
    const description = prompt('Description', r.description || ''); if (description === null) return;
    const lien = prompt('Lien « Découvrir » (https://…)', r.lien_decouvrir || ''); if (lien === null) return;
    action(async () => check(await sb.from('residences').update({ nom: nom.trim() || r.nom, quartier: quartier.trim() || null, description: description.trim() || null, lien_decouvrir: lien.trim() || null }).eq('id', r.id)));
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
    <label>Logo</label><input id="lo" type="file" accept="image/*">
    <button class="btn block" style="margin-top:12px">Ajouter</button></form></div>
  <h2>Partenaires</h2><div class="list">${(data || []).map(p => `<div class="card" data-id="${p.id}" style="display:flex;gap:12px;align-items:center">
    <div style="width:52px;height:52px;flex:none;border-radius:8px;background:#f1f3f5 center/contain no-repeat ${p.logo_path ? `url('${esc(publicUrl(p.logo_path))}')` : ''}"></div>
    <div style="flex:1;min-width:0"><b>${esc(p.nom)}</b><div class="muted small">${esc(p.categorie)} · ${p.lien ? 'lien ✓' : 'sans lien'}</div>
    <div class="row" style="margin-top:6px">
      <button class="btn sm ${p.valide_par_adress ? 'soft' : 'ghost'}" data-k="valide_par_adress" data-v="${p.valide_par_adress ? 0 : 1}">${p.valide_par_adress ? 'Validé ✓' : 'Valider'}</button>
      <button class="btn sm ${p.visible ? 'soft' : 'ghost'}" data-k="visible" data-v="${p.visible ? 0 : 1}">${p.visible ? 'Visible ✓' : 'Rendre visible'}</button>
      <label class="btn sm ghost" style="margin:0">Logo<input type="file" accept="image/*" data-logo class="sr"></label>
      <button class="btn sm ghost" data-lien>Lien</button></div></div></div>`).join('')}</div>`;
  const $ = (s) => box.querySelector(s); const id = (el) => el.closest('[data-id]').dataset.id;
  $('#f').onsubmit = (e) => { e.preventDefault(); action(async () => {
    const f = $('#lo').files[0]; const logo_path = f ? await uploadPublic(f, 'partenaires') : null;
    check(await sb.from('partenaires').insert({ nom: $('#no').value.trim(), categorie: $('#ca').value, description: $('#de').value.trim() || null, lien: $('#li').value.trim() || null, type_lien: $('#tl').value, logo_path }));
  }, 'Partenaire ajouté.'); };
  box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => action(async () => check(await sb.from('partenaires').update({ [b.dataset.k]: b.dataset.v === '1' }).eq('id', id(b)))));
  box.querySelectorAll('[data-logo]').forEach(i => i.onchange = () => i.files[0] && action(async () => { const logo_path = await uploadPublic(i.files[0], 'partenaires'); check(await sb.from('partenaires').update({ logo_path }).eq('id', id(i))); }, 'Logo mis à jour.'));
  box.querySelectorAll('[data-lien]').forEach(b => b.onclick = () => { const l = prompt('Lien du partenaire (https://…)'); if (l !== null) action(async () => check(await sb.from('partenaires').update({ lien: l.trim() || null }).eq('id', id(b)))); });
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

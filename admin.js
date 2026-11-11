// ADRESS CLUB — espace de gestion ADRESS (réservé aux comptes is_admin)
import { sb, state, esc, toast, errMsg, dateFr, fcfa, publicUrl, CAT_PARTENAIRES } from './app.js';

const ONGLETS = [['stats','Indicateurs'],['invitations','Invitations'],['comptes','Comptes'],['moderation','Modération'],['annonces','Annonces'],['contenus','Contenus'],['residences','Résidences'],['partenaires','Bonnes adresses'],['avis','Avis'],['parametres','Paramètres']];
const TYPES_CONTENU = ['Nouvelle résidence','Programme à venir','Actualité ADRESS','Flip Immo'];
const TYPES_BIEN = ['Appartements','Villas en résidence','Villas individuelles','Mixte'];

export async function renderAdmin(app, ong) {
  if (!state.profil?.is_admin) { app.innerHTML = '<div class="card">Accès réservé à ADRESS IMMOBILIER.</div>'; return; }
  ong = ong || 'stats';
  app.innerHTML = `<a class="back" href="#/">‹ Accueil</a><h1>Espace ADRESS</h1>
  <div class="tabs chips">${ONGLETS.map(([k, l]) => `<a class="chip ${k === ong ? 'on' : ''}" href="#/admin/${k}">${l}</a>`).join('')}</div><div id="adm"></div>`;
  const box = app.querySelector('#adm');
  await ({ stats, invitations, comptes, moderation, annonces, contenus, residences, partenaires, avis, parametres }[ong] || stats)(box);
}
const rerender = () => window.dispatchEvent(new HashChangeEvent('hashchange'));
async function uploadPublic(file, dossier) {
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
    sb.from('logements').select('id,code,numero,residence_id,residences(nom)').order('code'),
    sb.from('invitations').select('*, logements(code,numero)').order('created_at', { ascending: false }).limit(100)]);
  const R = res.data || [], Lg = log.data || [];
  box.innerHTML = `
  <div class="card"><h3>Créer un code d'invitation</h3><p class="muted small">Un compte par logement. À remettre au résident après vérification de son éligibilité.</p>
  <form id="fi">
    <label>Logement *</label><select id="lg" required><option value="">Choisir…</option>${Lg.map(l => `<option value="${l.id}">${esc(l.code)} – ${esc(l.residences?.nom || '')} ${esc(l.numero || '')}</option>`).join('')}</select>
    <div class="grid2"><div><label>Nom d'affichage proposé</label><input id="na" type="text"></div><div><label>Type d'occupant</label><select id="to"><option>Particulier</option><option>Entreprise / organisme</option></select></div></div>
    <div class="grid2"><div><label>Responsable (entreprise)</label><input id="rp" type="text"></div><div><label>Fin d'occupation</label><input id="fo" type="date"></div></div>
    <label class="check"><input id="ia" type="checkbox"> Compte ADRESS IMMOBILIER (annonces identifiées ADRESS)</label>
    <label class="check"><input id="ad" type="checkbox"> Administrateur (accès à cet espace)</label>
    <button class="btn block">Générer le code</button></form></div>
  <div class="card" style="margin-top:12px"><h3>Ajouter un logement</h3><form id="fl" class="grid2" style="align-items:end">
    <div><label>Résidence *</label><select id="lr">${R.map(r => `<option value="${r.id}">${esc(r.nom)}</option>`).join('')}</select></div>
    <div><label>Code logement *</label><input id="lc" type="text" placeholder="RES-A12"></div>
    <div><label>N° / porte</label><input id="ln" type="text"></div>
    <div><label>Type</label><select id="lt"><option>Appartement</option><option>Villa en résidence</option><option>Villa individuelle</option></select></div>
    <button class="btn" style="grid-column:1/-1">Ajouter le logement</button></form>
    ${R.length ? '' : '<p class="err">Créez d\'abord une résidence (onglet Résidences).</p>'}</div>
  <h2>Codes émis</h2><div style="overflow-x:auto"><table class="adm"><tr><th>Code</th><th>Logement</th><th>État</th><th></th></tr>
  ${(inv.data || []).map(i => `<tr><td><b>${esc(i.code)}</b>${i.is_admin ? ' <span class="badge soft">admin</span>' : ''}</td><td>${esc(i.logements?.code || '—')}</td>
    <td>${i.utilisee_par ? `Utilisé le ${dateFr(i.utilisee_le)}` : new Date(i.expire_le) < new Date() ? 'Expiré' : `Valide jusqu'au ${dateFr(i.expire_le)}`}</td>
    <td>${i.utilisee_par ? '' : `<button class="btn sm ghost" data-cp="${esc(i.code)}">Copier</button> <button class="btn sm danger" data-del="${esc(i.code)}">Supprimer</button>`}</td></tr>`).join('')}</table></div>`;
  const $ = (s) => box.querySelector(s);
  $('#fi').onsubmit = (e) => { e.preventDefault(); action(async () => {
    const d = check(await sb.from('invitations').insert({ logement_id: $('#lg').value || null, nom_affichage: $('#na').value.trim() || null, type_occupant: $('#to').value, responsable: $('#rp').value.trim() || null, date_fin_occupation: $('#fo').value || null, is_adress: $('#ia').checked, is_admin: $('#ad').checked }).select('code').single());
    try { await navigator.clipboard.writeText(d.code); } catch (_) {}
    alert(`Code d'invitation : ${d.code}\n(copié dans le presse-papiers, valable 30 jours)`);
  }, 'Code créé.'); };
  $('#fl').onsubmit = (e) => { e.preventDefault(); action(async () => check(await sb.from('logements').insert({ residence_id: $('#lr').value, code: $('#lc').value.trim().toUpperCase(), numero: $('#ln').value.trim() || null, type_logement: $('#lt').value })), 'Logement ajouté.'); };
  box.querySelectorAll('[data-cp]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.cp); toast('Code copié.'); } catch (_) { toast(b.dataset.cp); } });
  box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirm('Supprimer ce code ?') && action(async () => check(await sb.from('invitations').delete().eq('code', b.dataset.del)), 'Code supprimé.'));
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
  <h2>Résidences</h2><div class="list">${(data || []).map(r => `<div class="card" data-id="${r.id}"><b>${esc(r.nom)}</b> <span class="muted small">${esc(r.quartier || '')} · ordre ${r.ordre} · ${r.visible ? 'visible' : 'masquée'}</span>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-v="${r.visible ? 0 : 1}">${r.visible ? 'Masquer' : 'Afficher'}</button></div></div>`).join('') || '<div class="card center pad">Aucune résidence.</div>'}</div>`;
  const $ = (s) => box.querySelector(s);
  $('#f').onsubmit = (e) => { e.preventDefault(); action(async () => {
    const f = $('#ph').files[0]; const photo_path = f ? await uploadPublic(f, 'residences') : null;
    check(await sb.from('residences').insert({ nom: $('#no').value.trim(), quartier: $('#qu').value.trim() || null, type_bien: $('#tb').value || null, ordre: +$('#or').value || 100, description: $('#de').value.trim() || null, lien_decouvrir: $('#li').value.trim() || null, photo_path }));
  }, 'Résidence ajoutée.'); };
  box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => action(async () => check(await sb.from('residences').update({ visible: b.dataset.v === '1' }).eq('id', b.closest('[data-id]').dataset.id))));
}

// ---------- Nos bonnes adresses (§7 bis) ----------
async function partenaires(box) {
  const { data } = await sb.from('partenaires').select('*').order('ordre');
  box.innerHTML = `<p class="muted">Un partenaire n'apparaît aux résidents que s'il est <b>validé par ADRESS</b> et <b>visible</b>.</p>
  <div class="card"><h3>Ajouter une bonne adresse</h3><form id="f">
    <div class="grid2"><div><label>Nom *</label><input id="no" type="text" required></div><div><label>Catégorie *</label><select id="ca">${CAT_PARTENAIRES.map(c => `<option>${c}</option>`).join('')}</select></div></div>
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

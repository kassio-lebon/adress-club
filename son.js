// ADRESS CLUB — musique d'accueil : elle démarre à chaque ouverture de l'appli et tourne en boucle
// tant qu'on est sur l'écran d'accueil (elle s'arrête dès qu'on va ailleurs et reprend au retour).
// Les navigateurs interdisent tout son avant un premier geste : on tente tout de suite, sinon au premier toucher.
// « Couper la musique » l'arrête jusqu'à la prochaine ouverture de l'appli.
const SRC = 'videos/musique-ouverture.m4a?v=2';
const estAccueil = () => /^#?\/?$/.test(location.hash);
let coupe = false; try { coupe = sessionStorage.getItem('acl-musique-off') === '1'; } catch (_) {}

if (!coupe) {
  const a = new Audio(SRC); a.preload = 'auto'; a.loop = true;
  const VOL = 0.6; a.volume = 0;
  const EVTS = ['pointerdown', 'touchend', 'click', 'keydown'];
  let btn = null, libre = false, rampe = null, videoEnCours = false;
  const fondu = (cible, ms, fin) => { clearInterval(rampe); const d = a.volume, t0 = performance.now();
    rampe = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); try { a.volume = d + (cible - d) * k; } catch (_) {} if (k >= 1) { clearInterval(rampe); fin && fin(); } }, 40); };
  const off = () => EVTS.forEach(t => removeEventListener(t, geste, true));
  const cacher = () => { if (btn) { btn.classList.remove('in'); } };
  const montrer = () => {
    if (!btn) {
      btn = document.createElement('button'); btn.type = 'button'; btn.className = 'mus-x'; btn.setAttribute('aria-label', 'Couper la musique');
      btn.innerHTML = '<svg viewBox="0 0 256 256" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M155.51,24.81a6,6,0,0,0-6.32.71L77.94,82H32A14,14,0,0,0,18,96v64a14,14,0,0,0,14,14H77.94l71.25,56.48A6,6,0,0,0,152.92,232a6,6,0,0,0,6-6V30A6,6,0,0,0,155.51,24.81ZM30,160V96a2,2,0,0,1,2-2H74v68H32A2,2,0,0,1,30,160Zm116,53.6L86,166V90l60-47.6ZM244.24,139.76a6,6,0,1,1-8.48,8.48L216,128.49l-19.76,19.75a6,6,0,0,1-8.48-8.48L207.51,120l-19.75-19.76a6,6,0,0,1,8.48-8.48L216,111.51l19.76-19.75a6,6,0,0,1,8.48,8.48L224.49,120Z"/></svg><span>Couper la musique</span>';
      btn.onclick = (e) => { e.stopPropagation(); couper(); };
      document.body.appendChild(btn);
    }
    requestAnimationFrame(() => btn && btn.classList.add('in'));
  };
  const peutJouer = () => !coupe && !videoEnCours && estAccueil() && document.visibilityState !== 'hidden';
  const jouer = () => { if (!peutJouer() || !a.paused) return;
    a.play().then(() => { libre = true; fondu(VOL, 800); montrer(); }).catch(() => {}); };
  const arreter = (ms = 500) => { cacher(); if (a.paused) return; fondu(0, ms, () => { try { a.pause(); } catch (_) {} }); };
  function couper() { coupe = true; try { sessionStorage.setItem('acl-musique-off', '1'); } catch (_) {} off(); arreter(300); }
  function geste() { if (coupe) return off(); jouer(); }

  // Accueil : la musique tourne ; ailleurs : elle s'arrête (et reprend au retour sur l'accueil)
  addEventListener('hashchange', () => { if (estAccueil()) jouer(); else arreter(); });
  // Une vidéo avec le son (film de présentation, fiche résidence) : la musique s'efface puis revient à la fin
  document.addEventListener('play', (e) => { if (e.target.tagName === 'VIDEO' && !e.target.muted) { videoEnCours = true; arreter(300); } }, true);
  const finVideo = (e) => { if (e.target.tagName === 'VIDEO' && videoEnCours) { videoEnCours = false; setTimeout(jouer, 400); } };
  document.addEventListener('pause', finVideo, true); document.addEventListener('ended', finVideo, true);
  // Appli en arrière-plan : silence ; au retour : reprise si on est sur l'accueil
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { try { a.pause(); } catch (_) {} cacher(); } else if (libre) jouer(); });

  EVTS.forEach(t => addEventListener(t, geste, true));
  jouer();

  document.head.insertAdjacentHTML('beforeend', `<style>
.mus-x{position:fixed;left:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 86px);z-index:400;display:inline-flex;align-items:center;gap:8px;padding:8px 14px 8px 12px;border:0;border-radius:999px;background:rgba(23,24,27,.86);color:#fff;font-family:inherit;font-size:13px;font-weight:600;line-height:1;cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 8px 20px -10px rgba(0,0,0,.5);opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .25s ease,transform .25s ease}
.mus-x.in{opacity:1;pointer-events:auto;transform:none}
@media (min-width:900px){.mus-x{bottom:20px}}
</style>`);
}

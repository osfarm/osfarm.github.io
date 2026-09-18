/*
 * Bannière de consentement pour Google Analytics (_includes/google-analytics.html).
 *
 * Rien n'est chargé chez Google avant « Accepter ». Le choix est gardé six mois
 * dans le navigateur puis redemandé, comme le recommande la CNIL. Tout lien
 * portant data-consentement-ouvrir (« Cookies » en pied de page) rouvre la
 * bannière ; un refus coupe la mesure et efface les cookies _ga déjà posés.
 *
 * L'identifiant de mesure arrive par data-ga : rien n'est codé en dur ici.
 * data-actif vaut « non » hors production, pour essayer la bannière en local
 * sans rien envoyer à Google.
 */
(function () {
  'use strict';

  var banniere = document.getElementById('consentement');
  if (!banniere) { return; }

  var id = banniere.getAttribute('data-ga');
  var actif = banniere.getAttribute('data-actif') === 'oui';
  var CLE = 'osfarm-consentement';
  var DUREE = 182 * 24 * 60 * 60 * 1000;

  function lire() {
    try {
      var memo = JSON.parse(window.localStorage.getItem(CLE));
      if (memo && (memo.choix === 'accepte' || memo.choix === 'refuse') && Date.now() - memo.le < DUREE) {
        return memo.choix;
      }
    } catch (e) { /* stockage indisponible : on redemande */ }
    return null;
  }

  function retenir(choix) {
    try {
      window.localStorage.setItem(CLE, JSON.stringify({ choix: choix, le: Date.now() }));
    } catch (e) { /* navigation privée : le choix vaut pour cette page */ }
  }

  function charger() {
    if (!actif || !id) { return; }
    window['ga-disable-' + id] = false;
    if (window.gtag) { return; }
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  // Les cookies _ga sont posés sur le domaine le plus large possible
  // (.osfarm.org) : on les efface sur chaque variante du nom d'hôte.
  function effacer() {
    if (id) { window['ga-disable-' + id] = true; }
    var hote = window.location.hostname;
    var domaines = ['', hote, '.' + hote, '.' + hote.split('.').slice(-2).join('.')];
    document.cookie.split(';').forEach(function (morceau) {
      var nom = morceau.split('=')[0].trim();
      if (nom.indexOf('_ga') !== 0 && nom !== '_gid' && nom !== '_gat') { return; }
      domaines.forEach(function (domaine) {
        document.cookie = nom + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' +
          (domaine ? '; domain=' + domaine : '');
      });
    });
  }

  banniere.addEventListener('click', function (evenement) {
    var bouton = evenement.target.closest('[data-choix]');
    if (!bouton) { return; }
    var choix = bouton.getAttribute('data-choix');
    retenir(choix);
    if (choix === 'accepte') { charger(); } else { effacer(); }
    banniere.hidden = true;
  });

  document.addEventListener('click', function (evenement) {
    if (!evenement.target.closest('[data-consentement-ouvrir]')) { return; }
    evenement.preventDefault();
    banniere.hidden = false;
    banniere.querySelector('[data-choix]').focus();
  });

  var choix = lire();
  if (choix === 'accepte') {
    charger();
  } else {
    if (choix === 'refuse') { effacer(); }
    banniere.hidden = choix === 'refuse';
  }
})();

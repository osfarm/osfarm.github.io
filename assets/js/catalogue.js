/* Catalogue formation & conseil — /fr/catalogue/ et /catalogue/
 *
 * Trois rôles, aucune dépendance :
 *   1. filtrer les modules par famille et compter ce qui reste affiché ;
 *   2. ouvrir la fiche visée par une ancre (#module-a1) ;
 *   3. envoyer la demande de devis, puis la candidature d'opérateur, aux
 *      webhooks n8n déclarés dans _data/catalogue.yml.
 *
 * Les webhooks et l'adresse de repli arrivent par attributs data- : si n8n
 * tombe, le site reste en ligne et le formulaire affiche l'adresse de repli.
 */
(function () {
  var TEXTES = {
    fr: {
      envoi: 'Envoi…',
      devisOk: 'Demande envoyée. L’opérateur vous répond sous %d jours ouvrés.',
      candidatureOk: 'Candidature envoyée. Le responsable catalogue vous répond sous 10 jours.',
      erreur: 'L’envoi a échoué. Écrivez-nous à %m en précisant la référence.',
      compteur: function (n) { return n + (n > 1 ? ' modules affichés' : ' module affiché'); }
    },
    en: {
      envoi: 'Sending…',
      devisOk: 'Request sent. The operator will reply within %d working days.',
      candidatureOk: 'Application sent. The catalogue manager will reply within 10 days.',
      erreur: 'Sending failed. Please email %m, quoting the reference.',
      compteur: function (n) { return n + (n > 1 ? ' modules shown' : ' module shown'); }
    }
  };

  // Envoi commun aux deux formulaires : le champ leurre coupe l'envoi, l'état
  // est rendu dans le <p role="status"> du formulaire.
  function brancherEnvoi(formulaire, webhook, repli, textes, messageOk) {
    var etat = formulaire.querySelector('.catalogue-etat');
    formulaire.addEventListener('submit', function (e) {
      e.preventDefault();
      if (formulaire.site_web && formulaire.site_web.value) { return; }
      if (!webhook) {
        etat.textContent = textes.erreur.replace('%m', repli);
        etat.setAttribute('data-etat', 'erreur');
        return;
      }
      var donnees = { page: location.href, envoye_le: new Date().toISOString() };
      new FormData(formulaire).forEach(function (valeur, cle) {
        if (cle !== 'site_web') { donnees[cle] = valeur; }
      });
      etat.textContent = textes.envoi;
      etat.removeAttribute('data-etat');
      fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees)
      }).then(function (reponse) {
        if (!reponse.ok) { throw new Error(reponse.status); }
        etat.textContent = messageOk;
        etat.setAttribute('data-etat', 'ok');
        formulaire.reset();
        return true;
      }).catch(function () {
        etat.textContent = textes.erreur.replace('%m', repli);
        etat.setAttribute('data-etat', 'erreur');
      });
    });
  }

  /* ---- 1. le catalogue lui-même ---- */
  function catalogue(racine) {
    var langue = racine.getAttribute('data-lang') === 'en' ? 'en' : 'fr';
    var textes = TEXTES[langue];
    var repli = racine.getAttribute('data-repli') || '';
    var delai = racine.getAttribute('data-delai') || '5';

    var boutons = [].slice.call(racine.querySelectorAll('.radar-tag[data-famille]'));
    var familles = [].slice.call(racine.querySelectorAll('.catalogue-famille'));
    var modules = [].slice.call(racine.querySelectorAll('.catalogue-module'));
    var compteur = document.getElementById('catalogue-compteur');
    var famille = '';

    function appliquer() {
      var visibles = 0;
      familles.forEach(function (bloc) {
        var ok = !famille || bloc.getAttribute('data-famille') === famille;
        bloc.hidden = !ok;
        if (ok) { visibles += bloc.querySelectorAll('.catalogue-module').length; }
      });
      if (compteur) { compteur.textContent = textes.compteur(visibles); }
      boutons.forEach(function (b) {
        var actif = b.getAttribute('data-famille') === famille;
        b.classList.toggle('is-actif', actif);
        b.setAttribute('aria-pressed', String(actif));
      });
    }

    boutons.forEach(function (b) {
      b.addEventListener('click', function () {
        famille = b.getAttribute('data-famille');
        appliquer();
      });
    });
    appliquer();

    // Ancre profonde : /fr/catalogue/#module-a1 déplie la fiche, même si sa
    // famille était masquée par un filtre.
    function ouvrirDepuisAncre() {
      if (!location.hash) { return; }
      var cible;
      try { cible = racine.querySelector(location.hash); } catch (err) { return; }
      if (!cible) { return; }
      var bloc = cible.closest('.catalogue-famille');
      if (bloc && bloc.hidden) { famille = ''; appliquer(); }
      if (cible.tagName === 'DETAILS') { cible.open = true; }
      cible.scrollIntoView({ block: 'center' });
    }
    window.addEventListener('hashchange', ouvrirDepuisAncre);
    ouvrirDepuisAncre();

    /* ---- 3. demande de devis ---- */
    var dialogue = document.getElementById('catalogue-devis');
    var formulaire = document.getElementById('catalogue-devis-form');
    if (!dialogue || !formulaire) { return; }
    var titre = document.getElementById('catalogue-devis-titre');
    var reference = document.getElementById('catalogue-devis-ref');
    var etat = formulaire.querySelector('.catalogue-etat');

    racine.addEventListener('click', function (e) {
      var bouton = e.target.closest && e.target.closest('.js-devis');
      if (!bouton) { return; }
      reference.value = bouton.getAttribute('data-ref');
      titre.textContent = bouton.getAttribute('data-ref') + ' — ' + bouton.getAttribute('data-titre');
      etat.textContent = '';
      etat.removeAttribute('data-etat');
      if (typeof dialogue.showModal === 'function') {
        dialogue.showModal();
      } else {
        dialogue.setAttribute('open', '');
      }
    });

    formulaire.querySelector('.js-fermer').addEventListener('click', function () {
      if (typeof dialogue.close === 'function') { dialogue.close(); } else { dialogue.removeAttribute('open'); }
    });

    brancherEnvoi(formulaire, racine.getAttribute('data-webhook'), repli, textes,
      textes.devisOk.replace('%d', delai));
    formulaire.addEventListener('submit', function () {
      // Laisser le message de confirmation lisible avant de refermer.
      setTimeout(function () {
        if (etat.getAttribute('data-etat') === 'ok' && typeof dialogue.close === 'function') {
          dialogue.close();
        }
      }, 2500);
    });
  }

  /* ---- candidature d'opérateur (/fr/proposer-un-module/) ---- */
  function candidature(formulaire) {
    var langue = formulaire.getAttribute('data-lang') === 'en' ? 'en' : 'fr';
    var textes = TEXTES[langue];
    // Le catalogue renvoie ici avec ?module=C5 depuis une fiche sans opérateur.
    var demande = /[?&]module=([^&]+)/.exec(location.search);
    var choix = formulaire.querySelector('[name="module"]');
    if (demande && choix) {
      var voulu = decodeURIComponent(demande[1]).toUpperCase();
      [].slice.call(choix.options).forEach(function (option) {
        if (option.value.toUpperCase() === voulu) { choix.value = option.value; }
      });
    }
    brancherEnvoi(formulaire, formulaire.getAttribute('data-webhook'),
      formulaire.getAttribute('data-repli') || '', textes, textes.candidatureOk);
  }

  var racine = document.querySelector('.catalogue[data-webhook]');
  if (racine) { catalogue(racine); }
  var formulaire = document.getElementById('catalogue-candidature');
  if (formulaire) { candidature(formulaire); }
})();

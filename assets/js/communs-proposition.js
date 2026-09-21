/*
 * Formulaire « proposer un projet » de l'annuaire des communs
 * (/fr/communs/ et /community/, _includes/communs-proposition.html).
 *
 * Un seul rôle : poster la proposition sur le webhook n8n déclaré dans
 * _data/radar/communaute.yml et rendre la réponse en clair. Le workflow
 * répond toujours en JSON avec un `statut` :
 *   proposee  la pull request est ouverte, son lien est dans `pr_url` ;
 *   doublon   le projet est déjà répertorié ou déjà proposé, `fiche_url` le situe ;
 *   refus     champ manquant ou mal formé (400) ;
 *   abus      trop d'envois depuis la même adresse (429) ;
 *   panne     la forge a refusé l'écriture (502) — le proposant n'y peut rien,
 *             on l'oriente vers l'adresse de repli.
 * Si n8n est injoignable, le message renvoie vers l'adresse de repli : le
 * chemin manuel, déplié sous le formulaire, reste ouvert.
 */
(function () {
  'use strict';

  var formulaire = document.getElementById('communs-proposition');
  if (!formulaire) { return; }

  var anglais = formulaire.getAttribute('data-lang') === 'en';
  var webhook = formulaire.getAttribute('data-webhook');
  var repli = formulaire.getAttribute('data-repli') || '';
  var etat = formulaire.querySelector('.catalogue-etat');
  var bouton = formulaire.querySelector('button[type="submit"]');

  var TEXTES = anglais ? {
    envoi: 'Sending…',
    proposee: 'Thank you. The pull request is open; a reviewer will merge it.',
    voirPr: 'See the pull request',
    doublon: 'This project is already in the directory — nothing to add.',
    voirFiche: 'See its entry',
    dejaPropose: 'This project has already been suggested; its pull request is awaiting review.',
    refus: 'The form could not be processed: check the link, the name and the email.',
    abus: 'Too many suggestions from this connection. Please try again in an hour.',
    echec: 'Sending failed. Email us at %m, or open the pull request yourself.'
  } : {
    envoi: 'Envoi en cours…',
    proposee: 'Merci. La pull request est ouverte ; un relecteur la fusionnera.',
    voirPr: 'Voir la pull request',
    doublon: 'Ce projet est déjà dans l’annuaire — rien à ajouter.',
    voirFiche: 'Voir sa fiche',
    dejaPropose: 'Ce projet a déjà été proposé ; sa pull request attend une relecture.',
    refus: 'Le formulaire n’a pas pu être traité : vérifiez le lien, le nom et le courriel.',
    abus: 'Trop de propositions depuis cette connexion. Réessayez dans une heure.',
    echec: 'L’envoi n’a pas abouti. Écrivez-nous à %m, ou ouvrez la pull request vous-même.'
  };

  // Un message, et au plus un lien : le <p role="status"> est réécrit à chaque
  // envoi, jamais complété.
  function afficher(message, niveau, lien, libelleLien) {
    etat.replaceChildren(document.createTextNode(message));
    if (lien) {
      etat.appendChild(document.createTextNode(' '));
      var a = document.createElement('a');
      a.href = lien;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = libelleLien;
      etat.appendChild(a);
    }
    if (niveau) { etat.setAttribute('data-etat', niveau); } else { etat.removeAttribute('data-etat'); }
  }

  function rendre(reponse, echec) {
    var statut = reponse && reponse.statut;
    if (statut === 'proposee') {
      formulaire.reset();
      afficher(TEXTES.proposee, 'ok', reponse.pr_url, TEXTES.voirPr);
    } else if (statut === 'doublon') {
      afficher(reponse.deja_propose ? TEXTES.dejaPropose : TEXTES.doublon, 'ok',
        reponse.fiche_url || reponse.pr_url,
        reponse.deja_propose ? TEXTES.voirPr : TEXTES.voirFiche);
    } else if (statut === 'abus') {
      afficher(TEXTES.abus, 'erreur');
    } else if (statut === 'panne') {
      afficher(echec, 'erreur');
    } else {
      afficher(TEXTES.refus, 'erreur');
    }
  }

  formulaire.addEventListener('submit', function (evenement) {
    evenement.preventDefault();
    if (formulaire.site_web.value) { return; }
    var echec = TEXTES.echec.replace('%m', repli);
    if (!webhook) {
      afficher(echec, 'erreur');
      return;
    }

    var donnees = { page: location.href, envoye_le: new Date().toISOString() };
    new FormData(formulaire).forEach(function (valeur, cle) {
      if (cle !== 'site_web') { donnees[cle] = valeur; }
    });
    // La fiche porte la catégorie dans les deux langues, quelle que soit la
    // langue de la page : `categorie` pour l'annuaire, `category` pour
    // /community/. Le libellé anglais voyage avec l'option choisie.
    var categorie = formulaire.categorie.selectedOptions[0];
    donnees.categorie_en = categorie ? categorie.getAttribute('data-en') || '' : '';

    bouton.disabled = true;
    afficher(TEXTES.envoi, null);
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees)
    }).then(function (reponse) {
      // Doublon, refus et abus arrivent avec un corps JSON : c'est lui qui
      // porte le message, pas le code HTTP.
      return reponse.json().catch(function () {
        return { statut: reponse.ok ? 'proposee' : 'refus' };
      });
    }).then(function (reponse) {
      rendre(reponse, echec);
    }).catch(function () {
      afficher(echec, 'erreur');
    }).then(function () {
      bouton.disabled = false;
    });
  });
})();

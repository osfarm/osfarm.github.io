/*
 * Formulaire de demande d'accompagnement (/fr/adherer/ et /join/,
 * _includes/adhesion.html).
 *
 * Un bouton « Demander » d'un niveau présélectionne ce niveau dans la liste.
 * L'envoi part à l'adresse data-webhook — le workflow n8n du formulaire de
 * contact, sous le profil « Accompagnement » — ; en cas d'échec, le message
 * renvoie vers l'adresse data-repli. Le champ leurre site_web coupe l'envoi.
 */
(function () {
  'use strict';

  var formulaire = document.getElementById('adhesion-formulaire');
  if (!formulaire) { return; }

  var etat = formulaire.querySelector('.contact-etat');
  var repli = formulaire.getAttribute('data-repli');
  var anglais = formulaire.getAttribute('data-lang') === 'en';

  var TEXTES = anglais ? {
    profil: 'Support',
    adherent: 'Member',
    envoi: 'Sending…',
    ok: 'Thank you, your request is on its way. We will reply to the address you gave.',
    echec: 'The request could not be sent. Please email us directly at %m.'
  } : {
    profil: 'Accompagnement',
    adherent: 'Adhérent',
    envoi: 'Envoi en cours…',
    ok: 'Merci, votre demande est partie. Nous vous répondons à l’adresse indiquée.',
    echec: 'L’envoi n’a pas abouti. Écrivez-nous directement à %m.'
  };

  document.addEventListener('click', function (evenement) {
    var lien = evenement.target.closest('[data-niveau]');
    if (lien) { formulaire.niveau.value = lien.getAttribute('data-niveau'); }
  });

  formulaire.addEventListener('submit', function (evenement) {
    evenement.preventDefault();
    if (formulaire.site_web.value) { return; }
    var webhook = formulaire.getAttribute('data-webhook');
    var echec = TEXTES.echec.replace('%m', repli);
    if (!webhook) {
      etat.textContent = echec;
      etat.setAttribute('data-etat', 'erreur');
      return;
    }
    var niveau = formulaire.niveau;
    var donnees = {
      profil: 'accompagnement',
      profil_libelle: TEXTES.profil,
      demande: niveau.options[niveau.selectedIndex].textContent,
      precision_libelle: TEXTES.adherent,
      precision: formulaire.adherent.value,
      nom: formulaire.nom.value,
      email: formulaire.email.value,
      organisation: formulaire.organisation.value,
      message: formulaire.message.value,
      rgpd: formulaire.rgpd.checked ? 'oui' : '',
      lang: anglais ? 'en' : 'fr',
      page: location.href,
      envoye_le: new Date().toISOString()
    };
    var bouton = formulaire.querySelector('button[type="submit"]');
    bouton.disabled = true;
    etat.textContent = TEXTES.envoi;
    etat.removeAttribute('data-etat');
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees)
    }).then(function (reponse) {
      if (!reponse.ok) { throw new Error(reponse.status); }
      formulaire.reset();
      etat.textContent = TEXTES.ok;
      etat.setAttribute('data-etat', 'ok');
    }).catch(function () {
      etat.textContent = echec;
      etat.setAttribute('data-etat', 'erreur');
    }).then(function () {
      bouton.disabled = false;
    });
  });
})();

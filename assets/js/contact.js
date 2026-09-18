/*
 * Formulaire de contact (/fr/contact/ et /contact/, docs/{fr,en}/contact.html).
 *
 * Le profil choisi remplit la liste « Votre demande » et fait apparaître le
 * champ de précision qui lui est propre ; les profils arrivent de
 * _data/contact.yml par le <script type="application/json"> du formulaire,
 * chaque texte en français et en anglais (suffixe _en), selon data-lang.
 * L'envoi part à l'adresse data-webhook ; en cas d'échec, le message renvoie
 * vers l'adresse data-repli. Le champ leurre site_web coupe l'envoi.
 */
(function () {
  'use strict';

  var formulaire = document.getElementById('contact-formulaire');
  if (!formulaire) { return; }

  var profils = JSON.parse(document.getElementById('contact-profils').textContent);
  var liste = formulaire.querySelector('select[name="demande"]');
  var blocPrecision = formulaire.querySelector('.contact-precision');
  var libellePrecision = blocPrecision.querySelector('.contact-precision-libelle');
  var champPrecision = blocPrecision.querySelector('input');
  var etat = formulaire.querySelector('.contact-etat');
  var repli = formulaire.getAttribute('data-repli');
  var anglais = formulaire.getAttribute('data-lang') === 'en';
  var profilChoisi = null;

  var TEXTES = anglais ? {
    choisirProfil: 'Choose your profile first',
    choisirDemande: 'Choose your request',
    autre: 'Other',
    envoi: 'Sending…',
    ok: 'Thank you, your message is on its way. We will reply to the address you gave.',
    echec: 'The message could not be sent. Please email us directly at %m.'
  } : {
    choisirProfil: 'Choisissez d’abord votre profil',
    choisirDemande: 'Choisissez votre demande',
    autre: 'Autre',
    envoi: 'Envoi en cours…',
    ok: 'Merci, votre message est parti. Nous vous répondons à l’adresse indiquée.',
    echec: 'L’envoi n’a pas abouti. Écrivez-nous directement à %m.'
  };

  // Le texte d'un profil dans la langue de la page, le français à défaut.
  function texte(objet, cle) {
    return (anglais && objet[cle + '_en']) || objet[cle];
  }

  function trouver(id) {
    for (var i = 0; i < profils.length; i++) {
      if (profils[i].id === id) { return profils[i]; }
    }
    return null;
  }

  function option(libelle, valeur) {
    var o = document.createElement('option');
    o.value = valeur === undefined ? libelle : valeur;
    o.textContent = libelle;
    return o;
  }

  function choisir(id) {
    profilChoisi = trouver(id);
    if (!profilChoisi) { return; }
    liste.replaceChildren(option(TEXTES.choisirDemande, ''));
    (texte(profilChoisi, 'demandes') || []).concat([TEXTES.autre]).forEach(function (d) {
      liste.appendChild(option(d));
    });
    liste.disabled = false;
    var precision = profilChoisi.precision;
    blocPrecision.hidden = !precision;
    champPrecision.value = '';
    if (precision) {
      libellePrecision.textContent = texte(precision, 'libelle');
      champPrecision.type = precision.type === 'url' ? 'url' : 'text';
      champPrecision.placeholder = texte(precision, 'exemple') || '';
    }
  }

  function remettreAZero() {
    profilChoisi = null;
    liste.replaceChildren(option(TEXTES.choisirProfil, ''));
    liste.disabled = true;
    blocPrecision.hidden = true;
  }

  formulaire.addEventListener('change', function (evenement) {
    if (evenement.target.name === 'profil') { choisir(evenement.target.value); }
  });

  formulaire.addEventListener('submit', function (evenement) {
    evenement.preventDefault();
    if (formulaire.site_web.value) { return; }
    var webhook = formulaire.getAttribute('data-webhook');
    var echec = TEXTES.echec.replace('%m', repli);
    if (!webhook || !profilChoisi) {
      etat.textContent = echec;
      etat.setAttribute('data-etat', 'erreur');
      return;
    }
    var donnees = {
      profil: profilChoisi.id,
      profil_libelle: texte(profilChoisi, 'libelle'),
      demande: liste.value,
      precision_libelle: blocPrecision.hidden ? '' : texte(profilChoisi.precision, 'libelle'),
      precision: blocPrecision.hidden ? '' : champPrecision.value,
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
      remettreAZero();
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

/*
 * Bulle d'assistance (_includes/chatbot.html), sur toutes les pages.
 *
 * Elle envoie une question au workflow n8n « Chatbot de l'annuaire » et rend
 * sa réponse. Le workflow répond toujours en JSON avec un `statut` :
 *   repondu  la réponse est dans `reponse`, les sources vérifiées dans `sources` ;
 *   repos    plafond du jour ou du mois atteint ;
 *   abus     trop de questions depuis cette connexion (429) ;
 *   refus    question vide ou mal formée (400) ;
 *   panne    modèle ou socle indisponibles (502).
 *
 * Deux partis pris qui ne sont pas des détails :
 *
 *  - LE FIL DE LA CONVERSATION VIT ICI, EN MÉMOIRE, ET NULLE PART AILLEURS.
 *    Ni localStorage, ni serveur. Fermer l'onglet l'oublie. C'est ce qui
 *    permet de dire au visiteur que rien n'est conservé.
 *
 *  - ON NE FAIT DE LIEN QUE VERS UNE URL VÉRIFIÉE PAR LE SERVEUR. La réponse
 *    est du texte, jamais du HTML : on échappe tout, puis on ne réintroduit
 *    qu'un balisage minimal, et seules les adresses présentes dans `sources`
 *    deviennent cliquables. Le 21/09/2026, le modèle inventait des URL
 *    plausibles menant à des 404 ; n8n les retire déjà, ceci est la seconde
 *    serrure.
 */
(function () {
  'use strict';

  var racine = document.getElementById('chatbot');
  if (!racine) { return; }

  var webhook = racine.getAttribute('data-webhook');
  if (!webhook) { return; }

  var anglais = racine.getAttribute('data-lang') === 'en';
  var repli = racine.getAttribute('data-repli') || '';
  var tours = parseInt(racine.getAttribute('data-tours'), 10) || 3;
  var longueurMax = parseInt(racine.getAttribute('data-longueur'), 10) || 500;
  var urlAnnuaire = racine.getAttribute('data-annuaire');
  var urlContact = racine.getAttribute('data-contact');

  var appel = document.getElementById('chatbot-appel');
  var panneau = document.getElementById('chatbot-panneau');
  var fil = document.getElementById('chatbot-fil');
  var formulaire = document.getElementById('chatbot-formulaire');
  var champ = formulaire.question;
  var bouton = formulaire.querySelector('.chatbot-envoyer');

  var TEXTES = anglais ? {
    envoi: 'Searching…',
    sources: 'Sources',
    repos: 'The assistant is resting for today.',
    abus: 'Too many questions from this connection. Please try again in an hour.',
    refus: 'That question could not be processed.',
    panne: 'The assistant is unreachable right now.',
    echec: 'The assistant is unreachable right now.',
    degrade: 'Answer produced by the fallback model: please check it against the entries cited.',
    secours: 'Search the directory',
    comparaison: 'comparison',
    contact: 'Contact us',
    ecrire: 'or email %m'
  } : {
    envoi: 'Recherche en cours…',
    sources: 'Sources',
    repos: 'L’assistant est au repos pour aujourd’hui.',
    abus: 'Trop de questions depuis cette connexion. Réessayez dans une heure.',
    refus: 'Cette question n’a pas pu être traitée.',
    panne: 'L’assistant n’est pas joignable pour le moment.',
    echec: 'L’assistant n’est pas joignable pour le moment.',
    degrade: 'Réponse établie par le modèle de secours : vérifiez-la sur les fiches citées.',
    secours: 'Rechercher dans l’annuaire',
    comparaison: 'comparaison',
    contact: 'Nous écrire',
    ecrire: 'ou écrivez-nous à %m'
  };

  // Le fil, en mémoire vive : rien n'en sort, rien n'y survit à la fermeture.
  var historique = [];
  var enCours = false;

  /* ---- rendu ---- */

  function echapper(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Balisage minimal, appliqué APRÈS échappement : gras, listes, liens.
  // Un lien n'est créé que si son adresse figure dans `sources`, c'est-à-dire
  // si le serveur l'a trouvée dans le socle.
  function baliser(texte, sources) {
    var sur = {};
    (sources || []).forEach(function (u) { sur[u] = true; });

    var html = echapper(texte);

    html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (tout, libelle, cible) {
      return sur[cible] ? lien(cible, libelle) : libelle;
    });
    html = html.replace(/(^|[\s(])(https?:\/\/[^\s)<]+)/g, function (tout, avant, url) {
      return sur[url] ? avant + lien(url, joli(url)) : tout;
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Les puces deviennent une liste, le reste des paragraphes.
    var blocs = html.split(/\n{2,}/);
    return blocs.map(function (bloc) {
      var lignes = bloc.split('\n');
      var puces = lignes.filter(function (l) { return /^\s*[-*]\s+/.test(l); });
      if (puces.length && puces.length === lignes.filter(function (l) { return l.trim(); }).length) {
        return '<ul>' + puces.map(function (l) {
          return '<li>' + l.replace(/^\s*[-*]\s+/, '') + '</li>';
        }).join('') + '</ul>';
      }
      return '<p>' + bloc.replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  function lien(url, libelle) {
    return '<a href="' + echapper(url) + '" target="_blank" rel="noopener">' + libelle + '</a>';
  }

  // « https://www.osfarm.org/fr/communs/#commun-projet-x » → « osfarm.org »
  // Un lien de comparaison, que n8n n'a gardé qu'après avoir vérifié chacune
  // de ses fiches (_annuaire/COMPARATEUR.md), se lit « comparaison ».
  function joli(url) {
    if (/\/communs\/comparer\/\?fiches=/.test(url)) { return TEXTES.comparaison; }
    var m = /^https?:\/\/(?:www\.)?([^/]+)/.exec(url);
    return m ? m[1] : url;
  }

  function ajouter(classe, contenu) {
    var bloc = document.createElement('div');
    bloc.className = 'chatbot-message ' + classe;
    if (typeof contenu === 'string') { bloc.textContent = contenu; } else { bloc.appendChild(contenu); }
    fil.appendChild(bloc);
    fil.scrollTop = fil.scrollHeight;
    return bloc;
  }

  function messageAssistant(donnees) {
    var bloc = document.createElement('div');
    bloc.innerHTML = baliser(donnees.reponse || '', donnees.sources);
    var rendu = ajouter('chatbot-message--assistant', bloc);
    // Le modèle principal a été indisponible : on le dit, plutôt que de
    // laisser croire à une réponse de même qualité.
    if (donnees.secours) {
      var note = document.createElement('p');
      note.className = 'chatbot-degrade';
      note.textContent = TEXTES.degrade;
      rendu.appendChild(note);
    }
    if (donnees.sources && donnees.sources.length) {
      var liste = document.createElement('p');
      liste.className = 'chatbot-sources';
      liste.innerHTML = '<span>' + TEXTES.sources + '</span> ' +
        donnees.sources.map(function (u) { return lien(u, joli(u)); }).join(' · ');
      rendu.appendChild(liste);
    }
    fil.scrollTop = fil.scrollHeight;
  }

  // Tout ce qui n'est pas une réponse renvoie vers les chemins qui, eux,
  // marchent toujours : la recherche de l'annuaire et le formulaire de contact.
  function messageRepli(texte) {
    var bloc = document.createElement('div');
    var p = document.createElement('p');
    p.textContent = texte;
    bloc.appendChild(p);
    var liens = document.createElement('p');
    liens.className = 'chatbot-replis';
    liens.innerHTML = lien(urlAnnuaire, TEXTES.secours) + ' · ' + lien(urlContact, TEXTES.contact) +
      (repli ? ' · ' + echapper(TEXTES.ecrire.replace('%m', repli)) : '');
    bloc.appendChild(liens);
    ajouter('chatbot-message--repli', bloc);
  }

  /* ---- envoi ---- */

  function envoyer(question) {
    if (enCours) { return; }
    enCours = true;
    bouton.disabled = true;
    champ.value = '';
    ajouter('chatbot-message--visiteur', question);
    var attente = ajouter('chatbot-message--attente', TEXTES.envoi);

    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question,
        lang: anglais ? 'en' : 'fr',
        historique: historique.slice(-tours * 2),
        page: location.href
      })
    }).then(function (reponse) {
      return reponse.json().catch(function () { return { statut: 'panne' }; });
    }).then(function (d) {
      attente.remove();
      if (d.statut === 'repondu' && d.reponse) {
        messageAssistant(d);
        historique.push({ role: 'user', content: question });
        historique.push({ role: 'assistant', content: d.reponse });
      } else {
        messageRepli(TEXTES[d.statut] || TEXTES.panne);
      }
    }).catch(function () {
      attente.remove();
      messageRepli(TEXTES.echec);
    }).then(function () {
      enCours = false;
      bouton.disabled = false;
      champ.focus();
    });
  }

  formulaire.addEventListener('submit', function (e) {
    e.preventDefault();
    if (formulaire.site_web.value) { return; }
    var question = champ.value.trim().slice(0, longueurMax);
    if (question.length < 3) { return; }
    envoyer(question);
  });

  fil.addEventListener('click', function (e) {
    var exemple = e.target.closest && e.target.closest('.chatbot-exemple');
    if (exemple) { envoyer(exemple.textContent.trim()); }
  });

  /* ---- place au bas de l'écran ---- */

  // La bannière de consentement occupe le bas de l'écran tant qu'elle n'a pas
  // reçu de réponse. Sa hauteur dépend de la langue et de la largeur : on la
  // mesure plutôt que de la deviner, une valeur en dur faisait passer le
  // panneau dessous. La hauteur maximale du panneau en découle, côté CSS.
  function ajusterBas() {
    var banniere = document.getElementById('consentement');
    var marge = window.innerWidth <= 543 ? 12 : 16;
    var bas = marge;
    if (banniere && !banniere.hidden) {
      bas = banniere.getBoundingClientRect().height + marge * 2;
    }
    racine.style.setProperty('--chatbot-bas', bas + 'px');
  }

  ajusterBas();
  window.addEventListener('resize', ajusterBas);

  var banniere = document.getElementById('consentement');
  if (banniere && window.MutationObserver) {
    new MutationObserver(ajusterBas).observe(banniere, {
      attributes: true, attributeFilter: ['hidden']
    });
  }

  // Révélée seulement maintenant : sans ce script, aucun bouton n'apparaît.
  racine.classList.add('is-actif');

  /* ---- ouverture, fermeture, clavier ---- */

  function ouvrir() {
    panneau.hidden = false;
    appel.setAttribute('aria-expanded', 'true');
    racine.classList.add('is-ouvert');
    champ.focus();
  }

  function fermer() {
    panneau.hidden = true;
    appel.setAttribute('aria-expanded', 'false');
    racine.classList.remove('is-ouvert');
    appel.focus();
  }

  appel.addEventListener('click', function () {
    if (panneau.hidden) { ouvrir(); } else { fermer(); }
  });
  panneau.querySelector('.js-fermer').addEventListener('click', fermer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panneau.hidden) { fermer(); }
  });

  document.addEventListener('click', function (e) {
    if (panneau.hidden || racine.contains(e.target)) { return; }
    fermer();
  });
})();

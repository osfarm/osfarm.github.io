/*
 * Comparateur de fiches de l'annuaire (/fr/communs/comparer/, docs/fr/comparer.html).
 *
 * L'adresse fait foi : ?fiches=<id>,<id>[,<id>]. La page ne montre que ce
 * qu'elle nomme ; la sélection gardée dans le navigateur
 * (localStorage « osfarm-comparateur », partagée avec
 * comparateur-selection.js) ne sert qu'à y arriver sans paramètre. Les fiches
 * et les réglages viennent de l'îlot JSON posé par Jekyll : rien n'est codé en
 * dur ici. Conception : _annuaire/COMPARATEUR.md.
 */
(function () {
  var ilot = document.getElementById('comparateur-donnees');
  var zone = document.getElementById('comparateur-tableau');
  if (!ilot || !zone) { return; }

  var donnees = JSON.parse(ilot.textContent);
  var reglages = donnees.reglages;
  var MAX = Number(reglages.meta.max) || 3;
  var CLE = 'osfarm-comparateur';
  var FORME_ID = /^[a-z0-9-]+$/;
  var FAMILLES = { logiciel: 'Logiciel', materiel: 'Matériel', donnees: 'Données', modele: 'Modèle' };

  var parId = {};
  donnees.fiches.forEach(function (f) { parId[f.id] = f; });
  var titresTypes = {};
  (donnees.types || []).forEach(function (t) { titresTypes[t.id] = (t.titre && t.titre.fr) || t.id; });

  var message = document.getElementById('comparateur-message');
  var vide = document.getElementById('comparateur-vide');
  var bascule = document.querySelector('.comparateur-bascule');
  var caseDifferences = document.getElementById('comparateur-differences');
  var ajout = document.getElementById('comparateur-ajout');
  var recherche = document.getElementById('comparateur-recherche');
  var suggestions = document.getElementById('comparateur-suggestions');
  var icones = document.getElementById('comparateur-icones');

  // ------------------------------------------------------------------ état

  // La mémoire du navigateur peut manquer (navigation privée, stockage
  // bloqué) : elle n'est qu'une commodité, l'adresse suffit.
  function memoire() {
    try { return JSON.parse(localStorage.getItem(CLE) || '[]'); } catch (e) { return []; }
  }
  function memoriser(ids) {
    try { localStorage.setItem(CLE, JSON.stringify(ids)); } catch (e) { /* sans mémoire */ }
  }

  function lireAdresse() {
    var brut = new URLSearchParams(location.search).get('fiches');
    var demandes = brut === null ? memoire() : brut.split(',');
    var ids = [];
    var inconnus = [];
    demandes.forEach(function (id) {
      // « commun-<id> » est l'ancre de la carte dans l'annuaire : qui colle
      // l'ancre au lieu de l'identifiant obtient quand même la bonne fiche.
      id = String(id).trim().replace(/^#?commun-/, '');
      if (!id || ids.indexOf(id) !== -1) { return; }
      if (FORME_ID.test(id) && parId[id]) { ids.push(id); } else { inconnus.push(id); }
    });
    return { ids: ids.slice(0, MAX), inconnus: inconnus, trop: ids.length > MAX, avecParametre: brut !== null };
  }

  function ecrireAdresse(ids) {
    var cible = location.pathname + (ids.length ? '?fiches=' + ids.join(',') : '');
    history.replaceState(null, '', cible);
    memoriser(ids);
  }

  // ------------------------------------------------------------ dérivations

  function jour(texte) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(texte || ''));
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }
  function dateLisible(texte) {
    var d = jour(texte);
    return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  }

  function natureLicence(f) {
    if (!f.licence) { return null; }
    for (var i = 0; i < reglages.licences.length; i++) {
      if (reglages.licences[i].ids.indexOf(f.licence) !== -1) { return reglages.licences[i].titre; }
    }
    return 'non classée';
  }

  // Calculé au navigateur, pas au build : l'état ne vieillit pas entre deux
  // constructions du site.
  function etatActivite(f) {
    var d = jour(f.date_maj);
    if (!d) { return null; }
    var jours = Math.floor((Date.now() - d.getTime()) / 864e5);
    for (var i = 0; i < reglages.activite.length; i++) {
      var s = reglages.activite[i];
      if (s.jusqu_a === undefined || s.jusqu_a === null || jours <= s.jusqu_a) { return s.titre; }
    }
    return null;
  }

  function hote(url) {
    var m = /^https?:\/\/(?:www\.)?([^/]+)/.exec(url || '');
    return m ? m[1].toLowerCase() : '';
  }
  function forge(f) {
    var h = hote(f.depot || f.url);
    if (!h) { return null; }
    if (h === 'github.com') { return 'GitHub'; }
    if (h.indexOf('gitlab.') === 0 || h === 'framagit.org') { return 'GitLab'; }
    if (h === 'huggingface.co') { return 'Hugging Face'; }
    if (h === 'zenodo.org') { return 'Zenodo'; }
    if (h === 'data.gouv.fr') { return 'data.gouv.fr'; }
    return 'site du projet';
  }

  // L'unité dépend du connecteur qui a lu la fiche, pas de son adresse.
  function unitePopularite(f) {
    if (!f.popularite) { return null; }
    var cles = Object.keys(reglages.popularite);
    for (var i = 0; i < cles.length; i++) {
      if (String(f.source).indexOf(cles[i]) === 0) { return reglages.popularite[cles[i]]; }
    }
    return null;
  }

  function provenance(f) {
    if (f.curation) { return 'liste ' + f.curation; }
    // Deux fiches de communaute.yml n'ont pas de `source` ; le radar en pose
    // toujours une.
    var source = f.source || 'communaute-osfarm';
    return reglages.provenance[source] || reglages.provenance.defaut;
  }

  function lien(href, texte, externe) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = texte;
    if (externe) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }
  function ficheAnnuaire(f) { return donnees.annuaire + '#commun-' + f.id; }

  function ecosysteme(f) {
    if (f.partie_de) {
      var parent = parId[f.partie_de];
      return { texte: 'composant de ' + (parent ? parent.nom : f.partie_de),
               noeuds: ['composant de ', parent ? lien(ficheAnnuaire(parent), parent.nom) : f.partie_de] };
    }
    var enfants = donnees.fiches.filter(function (e) { return e.partie_de === f.id; });
    if (!enfants.length) { return null; }
    var noeuds = [enfants.length + ' composant' + (enfants.length > 1 ? 's' : '') + ' : '];
    enfants.forEach(function (e, i) {
      if (i) { noeuds.push(' · '); }
      noeuds.push(lien(ficheAnnuaire(e), e.nom));
    });
    return { texte: 'écosystème ' + enfants.map(function (e) { return e.id; }).join(','), noeuds: noeuds };
  }

  // ---------------------------------------------------------------- lignes
  //
  // valeur(f) rend null (« non renseigné ») ou { texte, noeuds? }. `texte`
  // sert à la comparaison ; `noeuds`, s'il est là, à l'affichage.
  // comparable: false : jamais mise en évidence ni masquée (contenu libre).

  function texte(v) { return v ? { texte: String(v) } : null; }

  var GROUPES = [
    { titre: 'Identité', lignes: [
      { libelle: 'Famille', valeur: function (f) { return texte(FAMILLES[f.famille] || f.famille); } },
      { libelle: 'Rôle', valeur: function (f) { return texte(titresTypes[f.type] || f.type); } },
      { libelle: 'Écosystème', valeur: ecosysteme },
      { libelle: 'Catégorie', valeur: function (f) { return texte(f.categorie); } }
    ] },
    { titre: 'Ouverture', lignes: [
      { libelle: 'Licence', valeur: function (f) {
        if (!f.licence) { return null; }
        var code = document.createElement('code');
        code.textContent = f.licence;
        return { texte: f.licence, noeuds: [code] };
      } },
      { libelle: 'Nature de la licence', valeur: function (f) { return texte(natureLicence(f)); } },
      { libelle: 'Forge', valeur: function (f) { return texte(forge(f)); } },
      { libelle: 'Dépôt', valeur: function (f) {
        if (!f.depot) { return null; }
        return { texte: f.depot, noeuds: [lien(f.depot, f.depot.replace(/^https?:\/\/(www\.)?/, ''), true)] };
      } },
      { libelle: 'Démo', valeur: function (f) {
        return f.demo ? { texte: 'oui', noeuds: [lien(f.demo, 'essayer', true)] } : { texte: 'non' };
      } }
    ] },
    { titre: 'Vitalité', lignes: [
      { libelle: 'Dernière activité', valeur: function (f) { return texte(dateLisible(f.date_maj)); } },
      { libelle: "État d'activité", valeur: function (f) { return texte(etatActivite(f)); } },
      { libelle: 'Popularité', popularite: true, valeur: function (f) {
        var unite = unitePopularite(f);
        return unite ? { texte: f.popularite + ' ' + unite, unite: unite } : null;
      } }
    ] },
    { titre: 'Technique', lignes: [
      { libelle: 'Technologie', valeur: function (f) { return texte(f.techno); } }
    ] },
    { titre: 'Contenu', lignes: [
      { libelle: 'Résumé', comparable: false, valeur: function (f) { return texte(f.resume); } },
      { libelle: 'Intérêt', comparable: false, valeur: function (f) { return texte(f.interet); } },
      { libelle: 'Mots-clés', comparable: false, valeur: function (f) { return texte((f.mots || []).join(', ')); } }
    ] },
    { titre: 'Provenance', lignes: [
      { libelle: 'Origine', valeur: function (f) { return texte(provenance(f)); } },
      { libelle: "Ajouté à l'annuaire", valeur: function (f) { return texte(dateLisible(f.propose_le)); } }
    ] }
  ];

  // Une ligne diffère si ses valeurs ne sont pas toutes égales, une case vide
  // comptant comme une valeur. Deux popularités d'unités différentes ne se
  // mettent pas en concurrence : la ligne n'est alors pas signalée.
  function differe(ligne, valeurs) {
    if (valeurs.length < 2 || ligne.comparable === false) { return false; }
    if (ligne.popularite) {
      var unites = valeurs.map(function (v) { return v ? v.unite : ''; });
      if (unites.some(function (u) { return u !== unites[0]; })) { return false; }
    }
    var cles = valeurs.map(function (v) { return v ? v.texte : ''; });
    return cles.some(function (c) { return c !== cles[0]; });
  }

  // ------------------------------------------------------------------ rendu

  var ids = [];

  function vignette(f) {
    var v = document.createElement('span');
    v.className = 'radar-vignette radar-vignette--' + f.famille + (f.logo ? ' radar-vignette--logo' : '');
    v.title = FAMILLES[f.famille] || f.famille;
    if (f.logo) {
      var img = document.createElement('img');
      img.src = f.logo;
      img.alt = '';
      img.loading = 'lazy';
      v.appendChild(img);
    } else if (icones) {
      var modele = icones.content.querySelector('[data-famille="' + f.famille + '"]');
      if (modele) { v.innerHTML = modele.innerHTML; }
    }
    return v;
  }

  function enTete(f) {
    var th = document.createElement('th');
    th.scope = 'col';
    th.className = 'comparateur-fiche';
    var tete = document.createElement('div');
    tete.className = 'comparateur-fiche-tete';
    tete.appendChild(vignette(f));
    var bloc = document.createElement('div');
    var nom = document.createElement('p');
    nom.className = 'comparateur-fiche-nom';
    nom.appendChild(lien(ficheAnnuaire(f), f.nom));
    bloc.appendChild(nom);
    if (f.auteur) {
      var auteur = document.createElement('p');
      auteur.className = 'radar-auteur';
      auteur.textContent = f.auteur;
      bloc.appendChild(auteur);
    }
    tete.appendChild(bloc);
    th.appendChild(tete);

    var actions = document.createElement('p');
    actions.className = 'comparateur-fiche-actions';
    if (f.url) { actions.appendChild(lien(f.url, 'Site du projet', true)); }
    var retirer = document.createElement('button');
    retirer.type = 'button';
    retirer.className = 'comparateur-retirer';
    retirer.textContent = 'Retirer';
    retirer.setAttribute('aria-label', 'Retirer ' + f.nom + ' de la comparaison');
    retirer.addEventListener('click', function () { changer(ids.filter(function (x) { return x !== f.id; })); });
    actions.appendChild(retirer);
    th.appendChild(actions);
    return th;
  }

  function remplir(cellule, v) {
    if (!v) {
      cellule.className = 'comparateur-absent';
      cellule.textContent = 'non renseigné';
      return;
    }
    (v.noeuds || [v.texte]).forEach(function (n) {
      cellule.appendChild(typeof n === 'string' ? document.createTextNode(n) : n);
    });
  }

  function rendre() {
    zone.textContent = '';
    var fiches = ids.map(function (id) { return parId[id]; });
    vide.hidden = fiches.length >= 2;
    bascule.hidden = fiches.length < 2;
    ajout.hidden = fiches.length >= MAX;
    zone.classList.toggle('comparateur-seules-differences', caseDifferences.checked);
    if (!fiches.length) { return; }

    var table = document.createElement('table');
    table.className = 'comparateur-table';
    table.style.minWidth = 'calc(var(--comparateur-criteres) + ' + fiches.length + ' * var(--comparateur-colonne))';
    var legende = document.createElement('caption');
    legende.className = 'sr-only';
    legende.textContent = 'Comparaison de ' + fiches.map(function (f) { return f.nom; }).join(', ');
    table.appendChild(legende);

    var thead = document.createElement('thead');
    var ligneTete = document.createElement('tr');
    var coin = document.createElement('td');
    coin.className = 'comparateur-coin';
    ligneTete.appendChild(coin);
    fiches.forEach(function (f) { ligneTete.appendChild(enTete(f)); });
    thead.appendChild(ligneTete);
    table.appendChild(thead);

    GROUPES.forEach(function (groupe) {
      var tbody = document.createElement('tbody');
      tbody.className = 'comparateur-groupe';
      var titre = document.createElement('tr');
      titre.className = 'comparateur-groupe-titre';
      var thTitre = document.createElement('th');
      thTitre.scope = 'colgroup';
      thTitre.colSpan = fiches.length + 1;
      thTitre.textContent = groupe.titre;
      titre.appendChild(thTitre);
      tbody.appendChild(titre);

      var montrees = 0;
      groupe.lignes.forEach(function (ligne) {
        var valeurs = fiches.map(function (f) { return ligne.valeur(f); });
        var diff = differe(ligne, valeurs);
        var tr = document.createElement('tr');
        tr.className = 'comparateur-ligne' + (diff ? ' is-differente' : '') +
          (ligne.comparable === false ? ' is-libre' : '');
        var th = document.createElement('th');
        th.scope = 'row';
        th.textContent = ligne.libelle;
        if (diff) {
          var marque = document.createElement('span');
          marque.className = 'comparateur-marque';
          marque.innerHTML = '<span aria-hidden="true">≠</span><span class="sr-only"> (diffère)</span>';
          th.appendChild(marque);
        }
        tr.appendChild(th);
        valeurs.forEach(function (v) {
          var td = document.createElement('td');
          remplir(td, v);
          tr.appendChild(td);
        });
        if (diff || ligne.comparable === false || !caseDifferences.checked) { montrees++; }
        tbody.appendChild(tr);
      });
      // Avec « seulement les différences », un groupe sans ligne visible perd
      // aussi son titre.
      tbody.hidden = montrees === 0;
      table.appendChild(tbody);
    });
    zone.appendChild(table);
  }

  function informer(etat) {
    var phrases = [];
    if (etat.inconnus.length) {
      phrases.push(etat.inconnus.length > 1
        ? etat.inconnus.length + " fiches de l'adresse ne sont plus dans l'annuaire."
        : "Une fiche de l'adresse n'est plus dans l'annuaire.");
    }
    if (etat.trop) { phrases.push('Seules les ' + MAX + ' premières fiches sont comparées.'); }
    message.textContent = phrases.join(' ');
    message.hidden = !phrases.length;
  }

  function changer(nouveaux) {
    ids = nouveaux.slice(0, MAX);
    ecrireAdresse(ids);
    rendre();
  }

  // -------------------------------------------------------------- recherche

  var index = donnees.fiches.map(function (f) {
    return { id: f.id, texte: [f.nom, f.auteur, f.resume, (f.mots || []).join(' ')].join(' ').toLowerCase() };
  });
  var proposees = [];
  var active = -1;

  function fermer() {
    suggestions.hidden = true;
    suggestions.textContent = '';
    recherche.setAttribute('aria-expanded', 'false');
    recherche.removeAttribute('aria-activedescendant');
    proposees = [];
    active = -1;
  }

  function surligner(i) {
    active = i;
    Array.prototype.forEach.call(suggestions.children, function (li, k) {
      li.setAttribute('aria-selected', String(k === i));
    });
    if (i >= 0) { recherche.setAttribute('aria-activedescendant', 'comparateur-suggestion-' + i); }
  }

  function choisir(id) {
    fermer();
    recherche.value = '';
    changer(ids.concat([id]));
    if (!ajout.hidden) { recherche.focus(); }
  }

  function proposer() {
    var terme = recherche.value.trim().toLowerCase();
    if (terme.length < 2) { fermer(); return; }
    proposees = index.filter(function (e) {
      return ids.indexOf(e.id) === -1 && e.texte.indexOf(terme) !== -1;
    }).slice(0, 8).map(function (e) { return parId[e.id]; });
    suggestions.textContent = '';
    if (!proposees.length) {
      var rien = document.createElement('li');
      rien.className = 'comparateur-suggestion-vide';
      rien.textContent = 'Aucun commun ne correspond.';
      suggestions.appendChild(rien);
    }
    proposees.forEach(function (f, i) {
      var li = document.createElement('li');
      li.id = 'comparateur-suggestion-' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.className = 'comparateur-suggestion';
      li.appendChild(vignette(f));
      var nom = document.createElement('span');
      nom.textContent = f.nom + (f.auteur ? ' · ' + f.auteur : '');
      li.appendChild(nom);
      // mousedown plutôt que click : le champ perdrait le focus et fermerait
      // la liste avant que le clic n'arrive.
      li.addEventListener('mousedown', function (e) { e.preventDefault(); choisir(f.id); });
      suggestions.appendChild(li);
    });
    suggestions.hidden = false;
    recherche.setAttribute('aria-expanded', 'true');
    active = -1;
  }

  recherche.addEventListener('input', proposer);
  recherche.addEventListener('blur', fermer);
  recherche.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' && proposees.length) {
      e.preventDefault();
      surligner((active + 1) % proposees.length);
    } else if (e.key === 'ArrowUp' && proposees.length) {
      e.preventDefault();
      surligner(active <= 0 ? proposees.length - 1 : active - 1);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choisir(proposees[active].id);
    } else if (e.key === 'Escape') {
      fermer();
    }
  });

  caseDifferences.addEventListener('change', rendre);

  // ------------------------------------------------------------- démarrage

  var etat = lireAdresse();
  ids = etat.ids;
  informer(etat);
  // L'adresse est réécrite dans sa forme propre (sans inconnus ni surplus), ou
  // reprend la sélection gardée quand elle n'avait pas de paramètre.
  ecrireAdresse(ids);
  rendre();
})();

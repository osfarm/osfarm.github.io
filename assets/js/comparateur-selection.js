/*
 * Sélection à comparer, sur l'annuaire (/fr/communs/).
 *
 * Révèle le bouton « Comparer » de chaque carte (annuaire-carte.html) et tient
 * la barre de sélection (#comparateur-barre, docs/fr/communs.html). La
 * sélection est gardée dans localStorage « osfarm-comparateur », la même clé
 * que lit assets/js/comparateur.js : l'aller-retour entre l'annuaire et la
 * comparaison la conserve. Sans stockage (navigation privée), elle vit le
 * temps de la page. Indépendant du script des filtres : une carte masquée par
 * un filtre garde son état. Conception : _annuaire/COMPARATEUR.md.
 */
(function () {
  var barre = document.getElementById('comparateur-barre');
  if (!barre) { return; }
  var MAX = Number(barre.getAttribute('data-max')) || 3;
  var PAGE = barre.getAttribute('data-page');
  var CLE = 'osfarm-comparateur';

  var boutons = Array.prototype.slice.call(document.querySelectorAll('[data-comparer]'));
  var parId = {};
  boutons.forEach(function (b) {
    parId[b.getAttribute('data-comparer')] = b;
    b.hidden = false;
  });

  var liste = barre.querySelector('.comparateur-barre-liste');
  var compte = barre.querySelector('.comparateur-barre-compte');
  var aller = barre.querySelector('.comparateur-barre-aller');
  var vider = barre.querySelector('.comparateur-barre-vider');
  var annonce = document.getElementById('comparateur-annonce');

  function lire() {
    try { return JSON.parse(localStorage.getItem(CLE) || '[]'); } catch (e) { return []; }
  }
  function ecrire(ids) {
    try { localStorage.setItem(CLE, JSON.stringify(ids)); } catch (e) { /* sans mémoire */ }
  }

  // Une fiche retirée de l'annuaire depuis la dernière visite est oubliée.
  var ids = lire().filter(function (id) { return parId[id]; }).slice(0, MAX);

  function nom(id) { return parId[id].getAttribute('data-nom'); }
  function dire(texte) { annonce.textContent = texte; }

  function afficher() {
    boutons.forEach(function (b) {
      var choisi = ids.indexOf(b.getAttribute('data-comparer')) !== -1;
      b.setAttribute('aria-pressed', String(choisi));
      b.classList.toggle('is-actif', choisi);
      b.textContent = choisi ? 'Comparé' : 'Comparer';
    });

    barre.hidden = ids.length === 0;
    compte.textContent = '(' + ids.length + ' / ' + MAX + ')';
    liste.textContent = '';
    ids.forEach(function (id) {
      var li = document.createElement('li');
      var lienFiche = document.createElement('a');
      lienFiche.href = '#commun-' + id;
      lienFiche.textContent = nom(id);
      li.appendChild(lienFiche);
      var retirer = document.createElement('button');
      retirer.type = 'button';
      retirer.className = 'comparateur-barre-retirer';
      retirer.setAttribute('aria-label', 'Retirer ' + nom(id) + ' de la sélection');
      retirer.textContent = '×';
      retirer.addEventListener('click', function () { basculer(id); });
      li.appendChild(retirer);
      liste.appendChild(li);
    });

    // Un lien de comparaison n'a de sens qu'à partir de deux fiches.
    var pret = ids.length >= 2;
    aller.href = pret ? PAGE + '?fiches=' + ids.join(',') : '#';
    aller.classList.toggle('is-inactif', !pret);
    aller.setAttribute('aria-disabled', String(!pret));
    aller.textContent = pret ? 'Comparer (' + ids.length + ')' : 'Choisissez une 2ᵉ fiche';
  }

  function basculer(id) {
    var i = ids.indexOf(id);
    if (i !== -1) {
      ids.splice(i, 1);
      dire(nom(id) + ' retiré de la sélection.');
    } else if (ids.length >= MAX) {
      dire(MAX + ' fiches au plus : retirez-en une pour ajouter ' + nom(id) + '.');
      barre.classList.remove('is-pleine');
      // Relancer l'animation : la classe retirée puis remise au prochain cadre.
      requestAnimationFrame(function () { barre.classList.add('is-pleine'); });
      return;
    } else {
      ids.push(id);
      dire(nom(id) + ' ajouté à la sélection (' + ids.length + ' / ' + MAX + ').');
    }
    ecrire(ids);
    afficher();
  }

  boutons.forEach(function (b) {
    b.addEventListener('click', function () { basculer(b.getAttribute('data-comparer')); });
  });
  vider.addEventListener('click', function () {
    ids = [];
    ecrire(ids);
    dire('Sélection vidée.');
    afficher();
  });
  aller.addEventListener('click', function (e) {
    if (ids.length < 2) { e.preventDefault(); }
  });

  afficher();
})();

/*
 * Rubrique Documentation (/fr/documentation/ et /documentation/,
 * _includes/documentation.html).
 *
 * Un seul rôle : le filtre par nature. Une rubrique dont toutes les notices
 * sont masquées disparaît avec son titre, pour ne pas laisser d'en-tête vide.
 * Sans JavaScript, tout reste affiché : le filtre n'est qu'un raccourci.
 */
(function () {
  var racine = document.getElementById('documentation');
  if (!racine) { return; }
  var fr = racine.getAttribute('data-lang') === 'fr';
  var boutons = Array.prototype.slice.call(racine.querySelectorAll('[data-nature]'))
    .filter(function (b) { return b.tagName === 'BUTTON'; });
  var cartes = Array.prototype.slice.call(racine.querySelectorAll('.doc-carte'));
  var groupes = Array.prototype.slice.call(racine.querySelectorAll('.doc-groupe'));
  var compteur = document.getElementById('doc-compteur');

  function appliquer(nature) {
    var visibles = 0;
    cartes.forEach(function (c) {
      var ok = !nature || c.getAttribute('data-nature') === nature;
      c.hidden = !ok;
      if (ok) { visibles += 1; }
    });
    groupes.forEach(function (g) {
      g.hidden = !g.querySelector('.doc-carte:not([hidden])');
    });
    boutons.forEach(function (b) {
      var actif = b.getAttribute('data-nature') === nature;
      b.classList.toggle('is-actif', actif);
      b.setAttribute('aria-pressed', actif ? 'true' : 'false');
    });
    if (fr) {
      compteur.textContent = visibles + (visibles > 1 ? ' références affichées' : ' référence affichée');
    } else {
      compteur.textContent = visibles + (visibles > 1 ? ' references shown' : ' reference shown');
    }
  }

  boutons.forEach(function (b) {
    b.addEventListener('click', function () { appliquer(b.getAttribute('data-nature')); });
  });

  // État initial : tout affiché, compteur renseigné. Une arrivée par #pub-…
  // (depuis l'assistant, par exemple) trouve donc toujours sa notice.
  appliquer('');
})();

/*
 * Vidéos « au clic » (pages Pourquoi et Accueil) : tant que le visiteur ne
 * clique pas, rien n'est demandé à YouTube. Chaque lecteur est un élément
 * portant data-video (identifiant YouTube) et data-titre, qui contient un
 * <button> ; le clic remplace le tout par le lecteur du domaine sans cookie.
 */
(function () {
  'use strict';

  document.addEventListener('click', function (evenement) {
    var bouton = evenement.target.closest('[data-video] > button');
    if (!bouton) { return; }
    var lecteur = bouton.parentNode;
    var cadre = document.createElement('iframe');
    cadre.src = 'https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(lecteur.getAttribute('data-video')) + '?autoplay=1';
    cadre.title = lecteur.getAttribute('data-titre') || '';
    cadre.allow = 'autoplay; encrypted-media; picture-in-picture';
    cadre.allowFullscreen = true;
    lecteur.classList.add('is-lecture');
    lecteur.replaceChildren(cadre);
    cadre.focus();
  });
})();

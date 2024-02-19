---
title: Quels sont les projets dans OSFarm ?
layout: fr-support-page
description: Projets en lien avec OSFarm. Si vous souhaitez ajouter un projet, suivez les instructions en bas de la page !
permalink: /fr/community/
lang: fr
---
<div id="to-top" class="text-center border-top border-bottom mb-3 mb-md-5">
  <div class="alt-h3 py-3 py-md-5">
    <input id="filter" type="text" class="" placeholder="Type to search...">
  </div>
</div>

{% include project-table.html orgs=site.data.projects id="projects" name="Solutions" %}

<div id="add-org" class="border-top pt-4 pt-md-6">
  <div class="clearfix gutter-spacious">
    <div class="col-md-6 float-left mb-4">
      <h3 class="alt-h3 mb-2">Ajouter un projet à la liste</h3>
      <p class="text-gray">Ce site est <a href="https://github.com/osfarm/osfarm.github.io">open source</a>, une personne de la communauté va regarder votre proposition et l'ajouter. Si votre projet n'apparait pas et devrait, vous pouvez l'ajouter:</p>
      <ol class="text-gray ml-3">
        <li class="mb-2">Allez dans la liste des projets:
          <ul class="ml-3">
            <li>
              <a href="https://github.com/osfarm/osfarm.github.io/blob/main/_data/projects.yml">
                _data/projects.yml
              </a>, pour les projets open source
            </li>
          </ul>
        </li>
        <li class="mb-2">Cliquer sur "Edit" (pencil) icon en haut à droite.</li>
        <li class="mb-2">Ajouter votre projet dans la bonne section</li>
        <li class="mb-2">Cliquer sur "propose file change" en bas de la page</li>
        <li class="mb-2">Cliquer "create pull request"</li>
        <li class="mb-2">Ajouter un commentaire à votre contribution</li>
        <li class="mb-2">Cliquer "Create pull request"</li>
      </ol>
    </div>

    <div class="col-md-6 float-left">
      <h4 class="mb-2">Politique</h4>
      <p class="text-gray">
        Bien qu'il y ai des centaines de projets interessants, nous nous limitons au projets qui sont:
      </p>
      <ul class="mb-4 text-gray ml-3">
        <li>En phase de production</li>
        <li>Dont le code source ou les données sont publiées</li>
      </ul>
      <h4 class="mb-2">Aspects legaux</h4>
      <p class="text-gray">
        Si vous remarquer l'utilisation de votre logo ou autre element sans votre accord, si vous avez une question, ou si vous souhaitez supprimer un projet de la liste, Merci de nous <a href="https://github.com/osfarm/osfarm.github.io/issues/new">le faire savoir</a>.
      </p>
    </div>

  </div>
</div>

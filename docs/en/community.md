---
title: What's behind OSFarm ?
layout: support-page
description: Projects, Peoples, Organizations link with OSFarm. If you don't see your organization on this list, follow the instructions below !
permalink: /community/
lang: en
---
<div id="to-top" class="text-center border-top border-bottom mb-3 mb-md-5">
  <div class="alt-h3 py-3 py-md-5">
    <input id="filter" type="text" class="" placeholder="Type to search...">
  </div>
</div>

{% include project-table.html orgs=site.data.projects id="projects" name="Projects" %}

<div id="add-org" class="border-top pt-4 pt-md-6">
  <div class="clearfix gutter-spacious">
    <div class="col-md-6 float-left mb-4">
      <h3 class="alt-h3 mb-2">Add A Project to the List</h3>
      <p class="text-gray">This website is <a href="https://github.com/osfarm/osfarm.github.io">open source</a>, therefore anyone in the community can submit edits through pull requests. If your project isn't on this list, but should be, please add it:</p>
      <ol class="text-gray ml-3">
        <li class="mb-2">Navigate to the appropriate project list:
          <ul class="ml-3">
            <li>
              <a href="https://github.com/osfarm/osfarm.github.io/blob/main/_data/projects.yml">
                _data/projects.yml
              </a>, for open source projects
            </li>
          </ul>
        </li>
        <li class="mb-2">Click the edit (pencil) icon in the top right corner.</li>
        <li class="mb-2">Add your project to the list in the appropriate section</li>
        <li class="mb-2">Click "propose file change" at the bottom of the page</li>
        <li class="mb-2">Click "create pull request"</li>
        <li class="mb-2">Provide a brief description of what you're proposing</li>
        <li class="mb-2">Click "Create pull request"</li>
      </ol>
    </div>

    <div class="col-md-6 float-left">
      <h4 class="mb-2">Guidelines</h4>
      <p class="text-gray">
        While there are many many interesting farming open source projects, we are limiting the list above to projects, who are:
      </p>
      <ul class="mb-4 text-gray ml-3">
        <li>In production state</li>
        <li>With source code published</li>
      </ul>
      <h4 class="mb-2">Legalese</h4>
      <p class="text-gray">
        Neither the inclusion of a logo or seal above should be construed to imply that OSFarm are endorsed, If you have any questions, or if would like your project's logo removed from the list above, please <a href="https://github.com/osfarm/osfarm.github.io/issues/new">let us know</a>.
      </p>
    </div>

  </div>
</div>

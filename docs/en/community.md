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

<p class="text-gray">
  Need help with these tools? The <a href="{{ "/catalogue/" | relative_url }}">training and
  consulting catalogue</a> gathers what OSFarm members can deliver around them — free to list,
  and commission-free.
</p>

{% assign groupes = site.data.radar.communaute.candidats | where: "publier", true | group_by: "category" %}
{% include project-table.html groupes=groupes id="projects" name="Projects" %}

<div id="add-org" class="border-top pt-4 pt-md-6">
  <div class="clearfix gutter-spacious">
    <div class="col-md-6 float-left mb-4">
      <h3 class="alt-h3 mb-2">Add A Project to the List</h3>
      <p class="text-gray">This website is <a href="https://github.com/osfarm/osfarm.github.io">open source</a>, therefore every addition goes through a pull request that someone in the community reviews before merging.</p>
      <p class="text-gray">The <a href="#proposer">form below</a> opens that pull request for you: the project link and two sentences are enough. We fill in the licence, the technology and the last activity from the forge, and we leave out whatever is already listed.</p>
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

{% include communs-proposition.html lang="en" %}

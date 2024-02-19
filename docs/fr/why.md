---
title: Pourquoi
layout: fr-support-page
permalink: /fr/why/
description: "3 anneaux pour les embarquer tous"
lang: fr
---
<div id="graphcontainer1" style="height: 500px"></div>
<div id="graphcontainer2" style="height: 500px"></div>
<script>
    const chart = Highcharts.chart('graphcontainer1', {
      //plot options code with type: 'datetime'
      plotOptions: {
        series: {
          pointStart: Date.UTC(2000, 0, 1),
          pointInterval: 24 * 3600 * 1000 * 365 * 10
        }
      },
      type: 'line',
      tooltip: {
        shared: true,
        split: false,
        enabled: true,
      },
      title: { text: 'Personne à nourrir VS Force vive en agriculture (WW)'},
      xAxis: {
        type: 'datetime'
      },
      series: [{
          name: 'Personne à nourrir (Milliard)',
          data: [4, 5, 6, 7.5, 9],
        },
        { 
          name: 'Force vive en agriculture (% de la population active)',
          data: [5, 4, 3, 2, 1],
        }
      ]
    });
    const chart1 = Highcharts.chart('graphcontainer2', {
      //plot options code with type: 'datetime'
      plotOptions: {
        series: {
          pointStart: Date.UTC(2000, 0, 1),
          pointInterval: 24 * 3600 * 1000 * 365 * 5
        }
      },
      type: 'line',
      tooltip: {
        shared: true,
        split: false,
        enabled: true,
      },
      title: { text: 'Adoption des technologies par les agriculteurs VS Solutions présentes sur le marché (FR)'},
      xAxis: {
        type: 'datetime'
      },
      series: [{
          name: 'Solutions présentes sur le marché (FR)',
          data: [5, 9, 28, 60, 100],
        },
        { 
          name: 'Adoption des technologies (% des agriculteurs)',
          data: [5, 7, 9, 10, 11],
        }
      ]
    });
  </script>

  <section id="get-started" class="mini-section mt-6">
  <div class="container-lg p-responsive">
    <p class="alt-h2 text-center mb-3 mt-lg-6">OSFarm want to solve this issues:</p>
    <ol class="ml-3 ml-lg-0">
      <li class="alt-lead text-gray text-center col-md-10 mx-auto">Foster Agtech innovation has no need to reinvent the whell</li>
      <li class="alt-lead text-gray text-center col-md-10 mx-auto">Lot of pain and lack when using lot of new technologies on farms</li>
      <li class="alt-lead text-gray text-center col-md-10 mx-auto">95% of farmers has no access to new technologies</li>
    </ol>
  </div>
</section>
<div class="col-md-8 mx-auto">
  <div class="embed-responsive embed-responsive-16by9">
    <iframe class="embed-responsive-item" width="560" height="315"
      src="https://www.youtube.com/embed/iZC-kWKPY_M" frameborder="0" allowfullscreen="">
    </iframe>
  </div>
  {% for pub in site.data.publications %}
    <div class="quote">
      <a href="{{ pub.url }}" target="_blank">{{ pub.title }}</a>
      <br><span>{{ pub.author }}</span>
    </div>  
  {% endfor %}
  <p><em>
    For more information, please contact <a href="mailto:contact@osfarm.org">contact@osfarm.org</a>.
  </em>
  </p>
</div>
<div class="my-5">&nbsp;<div>

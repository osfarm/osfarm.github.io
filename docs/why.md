---
title: Why
layout: support-page
permalink: /why/
description: "One stack to enroll them all"
redirect_from: "/508/"
---
<div id="graphcontainer" style="height: 500px"></div>
<script>
    const chart = Highcharts.chart('graphcontainer', {
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
      title: { text: 'Evolution of agriculture indicators'},
      xAxis: {
        type: 'datetime'
      },
      series: [{
          name: 'People to feed (B)',
          data: [4, 5, 6, 7.5, 9],
        },
        { 
          name: 'Working force in agriculture (%)',
          data: [5, 4, 3, 2, 1],
        }
      ]
    });
  </script>
<div class="col-md-8 mx-auto">
  <p>
    OSFarm want to solve this issues:
  </p>
  <ol class="ml-3 ml-lg-0">
    <li class="mb-2">Foster Agtech innovation has no need to reinvent the whell</li>
    <li class="mb-2">Lot of pain and lack when using lot of new technologies on farms</li>
    <li class="mb-2">95% of farmers has no access to new technologies</li>
  </ol>
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

---
layout: default
lang: fr
permalink: /fr/proposer-un-module/
title: "Proposer un module ou une mission — OSFarm"
description: "Référencez gratuitement votre offre de formation ou de conseil au catalogue OSFarm. Sans commission. Seule condition : être adhérent."
---

<link rel="stylesheet" href="{{ '/assets/css/catalogue.css' | relative_url }}">

<div class="osf-cat" data-lang="fr">

<h1>Proposer un module ou une mission</h1>

<p class="osf-cat__claim">Gratuit, sans commission. La seule condition est d'être adhérent.</p>

<p>OSFarm ne vend rien et ne prélève rien sur vos missions. L'association tient le catalogue,
oriente les demandes et garantit le cadre ; vous contractez et facturez en direct avec le client.
En contrepartie du référencement, vous publiez votre support sous licence libre sur la forge :
c'est ce qui fait du catalogue un commun plutôt qu'un annuaire.</p>

<h2>La charte de l'opérateur référencé</h2>
<ol>
  <li><b>Être adhérent d'OSFarm</b> et le rester pendant toute la durée du référencement.</li>
  <li><b>Former sur des outils ouverts.</b> Le module porte sur des solutions libres ou des standards ouverts.</li>
  <li><b>Publier le support</b> sous licence libre (CC BY-SA ou équivalent) sur la forge, dans les trois mois suivant la première session.</li>
  <li><b>Appliquer un tarif adhérent</b> d'au moins {{ site.data.catalogue.meta.remise_adherent_min }} % inférieur au tarif public.</li>
  <li><b>Répondre sous {{ site.data.catalogue.meta.delai_reponse_jours }} jours ouvrés</b> à toute demande transmise, ne serait-ce que pour décliner.</li>
  <li><b>Assumer seul</b> le contrat, la responsabilité pédagogique, l'assurance et, le cas échéant, la certification Qualiopi. L'association n'est ni partie au contrat, ni garante, ni rémunérée.</li>
  <li><b>Accepter l'évaluation.</b> Une moyenne inférieure à 3,5 sur 5 sur trois sessions consécutives entraîne un retrait du catalogue, après échange.</li>
</ol>

<h2>Votre proposition</h2>

<form class="osf-dlg__form" id="osf-operateur-form" style="padding:0;max-width:560px">
  <input type="text" name="site_web" class="osf-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
  <input type="hidden" name="type" value="candidature_operateur">

  <label>Structure
    <input type="text" name="structure" required autocomplete="organization"></label>
  <label>Contact
    <input type="text" name="contact" required autocomplete="name"></label>
  <label>Courriel
    <input type="email" name="email" required autocomplete="email"></label>
  <label>Module ou mission visé
    <select name="module" required style="font:inherit;padding:8px 10px;border:1px solid rgba(22,36,46,.42);border-radius:2px">
      <option value="">— choisir —</option>
      {% for m in site.data.catalogue.modules %}
        <option value="{{ m.ref }}"{% if m.statut == 'a_pourvoir' %} data-ouvert="1"{% endif %}>{{ m.ref }} — {{ m.titre.fr }}{% if m.statut == 'a_pourvoir' %} (ouvert){% endif %}</option>
      {% endfor %}
      {% for p in site.data.catalogue.missions %}
        <option value="{{ p.ref }}">{{ p.ref }} — {{ p.titre.fr }}</option>
      {% endfor %}
      <option value="NOUVEAU">Un nouveau module, absent du catalogue</option>
    </select></label>
  <label>Si nouveau module : titre proposé
    <input type="text" name="titre_propose"></label>
  <label>Ce que vous apportez, en quelques lignes
    <textarea name="message" rows="4" required></textarea></label>
  <label>Tarif public envisagé (€ / journée-groupe)
    <input type="number" name="tarif" min="0" step="50"></label>
  <label class="osf-check"><input type="checkbox" name="qualiopi" value="oui"> Ma structure est certifiée Qualiopi</label>
  <label class="osf-check"><input type="checkbox" name="charte" value="oui" required> J'ai lu la charte ci-dessus et je m'engage à la respecter</label>
  <label class="osf-check"><input type="checkbox" name="rgpd" value="oui" required> J'accepte que ces informations soient conservées 24 mois par l'association</label>

  <div class="osf-dlg__actions" style="justify-content:flex-start">
    <button type="submit" class="osf-btn">Envoyer ma candidature</button>
  </div>
  <p class="osf-dlg__status" role="status" aria-live="polite"></p>
</form>

<p style="margin-top:22px">Pas encore adhérent ?
<a href="https://www.helloasso.com/associations/osfarm">L'adhésion se fait ici</a>, elle est gratuite,
et votre candidature sera traitée dès qu'elle sera enregistrée.</p>

</div>

<script>
(function(){
  // >>> À RENSEIGNER : même hôte n8n que le catalogue
  var WEBHOOK='https://automation.osfarm.org/webhook/catalogue-operateur';
  var f=document.getElementById('osf-operateur-form');
  var s=f.querySelector('.osf-dlg__status');
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(f.site_web.value)return;
    var d={};new FormData(f).forEach(function(v,k){if(k!=='site_web')d[k]=v;});
    d.envoye_le=new Date().toISOString();
    s.textContent='Envoi…';s.removeAttribute('data-state');
    fetch(WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){if(!r.ok)throw 0;
        s.textContent='Candidature envoyée. Le responsable catalogue vous répond sous 10 jours.';
        s.setAttribute('data-state','ok');f.reset();})
      .catch(function(){s.textContent='Envoi impossible. Écrivez à contact@osfarm.org.';
        s.setAttribute('data-state','ko');});
  });
})();
</script>

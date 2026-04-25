---
title: Projet REBUS
layout: fr-support-page
permalink: /fr/rebus/
description: "Projet REBUS"
lang: fr
---
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>REBUS — FarmLab La Vauzelle — OSFarm</title>
<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;1,400&family=Ubuntu:wght@700&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #24292e; background: #fff; line-height: 1.5; }
:root {
  --green: #338000; --green-dark: #245c00; --green-light: #e3f4d7;
  --cream: #f9f3d2; --blue: #5ba2d2;
  --gray-100: #f6f8fa; --gray-200: #e1e4e8; --gray-600: #586069; --gray-800: #24292e;
}
a { color: var(--green); text-decoration: none; transition: color .2s; }
a:hover { color: var(--green-dark); }
.container { max-width: 1012px; margin: 0 auto; padding: 0 24px; }
.section { padding: 48px 0; }
.section-alt { background: var(--gray-100); }
.section-green { background: var(--green-light); }
h1 { font-size: 2.2rem; font-weight: 700; line-height: 1.2; }
h2 { font-size: 1.75rem; font-weight: 700; line-height: 1.25; margin-bottom: 8px; }
h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 6px; }
p { color: var(--gray-600); margin-bottom: 0; }

/* ── HEADER ── */
.site-header { background: var(--green); }
.site-header-inner { max-width: 1012px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 64px; }
.site-logo { font-family: 'Ubuntu', sans-serif; font-weight: 700; font-size: 24px; color: #fff; }
.site-nav { display: flex; gap: 24px; align-items: center; }
.site-nav a { color: rgba(255,255,255,.85); font-size: 14px; font-weight: 400; transition: color .2s; }
.site-nav a:hover { color: #fff; }
.site-nav .btn-outline { border: 1px solid rgba(255,255,255,.5); border-radius: 6px; padding: 5px 14px; color: rgba(255,255,255,.9); }
.site-nav .btn-outline:hover { background: rgba(255,255,255,.1); color: #fff; }

/* ── BREADCRUMB ── */
.breadcrumb { padding: 12px 0; border-bottom: 1px solid var(--gray-200); }
.breadcrumb span { font-size: 13px; color: var(--gray-600); }
.breadcrumb a { font-size: 13px; }
.breadcrumb .sep { margin: 0 6px; color: var(--gray-200); }

/* ── HERO ── */
.hero {
  position: relative; min-height: 420px;
  background: url('/assets/img/images-1777110131446.jpg') center 40%/cover no-repeat;
  display: flex; align-items: flex-end;
}
.hero::before { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.3) 60%, transparent 100%); }
.hero-content { position: relative; z-index: 1; padding: 48px 24px; max-width: 1012px; margin: 0 auto; width: 100%; }
.hero-badge { display: inline-block; background: var(--green); color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; padding: 4px 12px; border-radius: 4px; margin-bottom: 12px; }
.hero h1 { color: #fff; font-size: 2.8rem; margin-bottom: 10px; }
.hero .hero-sub { font-size: 1.1rem; color: rgba(255,255,255,.85); max-width: 640px; font-weight: 300; margin-bottom: 20px; }
.hero-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.hero-tag { background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.35); border-radius: 20px; padding: 4px 14px; font-size: 13px; color: #fff; }

/* ── SUMMARY BAR ── */
.summary-bar { border-bottom: 1px solid var(--gray-200); }
.summary-bar-inner { max-width: 1012px; margin: 0 auto; padding: 0 24px; display: flex; gap: 0; }
.summary-item { flex: 1; padding: 16px 0; text-align: center; border-right: 1px solid var(--gray-200); }
.summary-item:last-child { border-right: none; }
.summary-val { font-size: 1.4rem; font-weight: 700; color: var(--green); }
.summary-lbl { font-size: 12px; color: var(--gray-600); margin-top: 2px; }

/* ── PILLAR CARDS ── */
.pillar-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 32px; }
.pillar-card { background: #fff; border: 1px solid var(--gray-200); border-radius: 8px; padding: 24px; transition: box-shadow .2s; }
.pillar-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
.pillar-card .p-num { font-size: 2rem; font-weight: 700; color: var(--green-light); font-family: 'Ubuntu',sans-serif; line-height: 1; margin-bottom: 10px; }
.pillar-card h3 { color: var(--green-dark); font-size: 1.05rem; }
.pillar-card ul { list-style: none; margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.pillar-card ul li { font-size: 14px; color: var(--gray-600); padding-left: 16px; position: relative; }
.pillar-card ul li::before { content: '→'; position: absolute; left: 0; color: var(--green); font-size: 12px; top: 1px; }

/* ── TWIN INTERFACES ── */
.iface-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; margin-top: 28px; }
.iface-card { border-radius: 8px; padding: 20px 24px; border: 1px solid var(--green); background: var(--green-light); }
.iface-card .iface-num { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--green-dark); margin-bottom: 6px; }
.iface-card h3 { color: var(--green-dark); font-size: 1rem; margin-bottom: 6px; }
.iface-card p { font-size: 14px; color: var(--gray-600); }

/* ── SERVICES ── */
.service-list { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
.service-row { background: #fff; border: 1px solid var(--gray-200); border-radius: 8px; padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start; }
.service-badge { background: var(--green); color: #fff; font-size: 11px; font-weight: 700; border-radius: 4px; padding: 3px 8px; white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
.service-title { font-size: 15px; font-weight: 700; color: var(--gray-800); margin-bottom: 3px; }
.service-desc  { font-size: 13px; color: var(--gray-600); }

/* ── QUOTE ── */
.quote-block {
  background: var(--cream); border: thin solid var(--green) solid;
  border: 1px solid var(--green); box-shadow: 5px 5px 6px rgba(51,128,0,.1);
  border-radius: 8px; padding: 24px 32px; margin: 32px 0; position: relative;
}
.quote-block::before { content: '\201C'; font-size: 80px; color: rgba(51,128,0,.15); position: absolute; top: -10px; left: 12px; font-family: Georgia,serif; line-height: 1; }
.quote-text { font-size: 1.05rem; font-style: italic; color: var(--gray-800); padding-left: 32px; line-height: 1.6; }
.quote-attr  { font-size: 13px; color: var(--gray-600); padding-left: 32px; margin-top: 10px; }

/* ── PARTNER CARDS ── */
.partner-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 28px; }
.partner-card { background: #fff; border: 1px solid var(--gray-200); border-radius: 8px; padding: 24px; text-align: center; }
.partner-card .p-name { font-family: 'Ubuntu',sans-serif; font-weight: 700; font-size: 1.2rem; color: var(--gray-800); margin-bottom: 4px; }
.partner-card .p-type { font-size: 13px; color: var(--gray-600); margin-bottom: 12px; }
.partner-card .p-badge { display: inline-block; font-size: 11px; font-weight: 700; border-radius: 20px; padding: 3px 12px; }
.partner-card .p-badge.copartner { background: var(--green-light); color: var(--green-dark); border: 1px solid var(--green); }
.partner-card .p-badge.support   { background: var(--gray-100); color: var(--gray-600); border: 1px solid var(--gray-200); }
.partner-card .p-date { font-size: 12px; color: var(--gray-600); margin-top: 8px; }

/* ── FINANCE TABLE ── */
.finance-table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 15px; }
.finance-table th { background: var(--green-light); color: var(--green-dark); font-weight: 700; padding: 10px 16px; text-align: left; border: 1px solid var(--gray-200); }
.finance-table td { padding: 10px 16px; border: 1px solid var(--gray-200); color: var(--gray-600); }
.finance-table tr:nth-child(even) td { background: var(--gray-100); }
.finance-table .amount { font-weight: 700; color: var(--green-dark); text-align: right; white-space: nowrap; }
.finance-table tfoot td { background: var(--green-light); font-weight: 700; color: var(--green-dark); }

/* ── TIMELINE ── */
.timeline { margin-top: 28px; display: flex; flex-direction: column; gap: 0; }
.tl-item { display: grid; grid-template-columns: 140px 1fr; gap: 0; }
.tl-item + .tl-item { margin-top: 2px; }
.tl-date { background: var(--green); color: #fff; padding: 14px 16px; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 1.3; border-radius: 6px 0 0 6px; }
.tl-date.alt { background: var(--green-dark); }
.tl-body { background: var(--gray-100); padding: 14px 20px; border-radius: 0 6px 6px 0; border: 1px solid var(--gray-200); border-left: none; }
.tl-title { font-size: 15px; font-weight: 700; color: var(--gray-800); margin-bottom: 6px; }
.tl-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tl-tag { font-size: 11px; font-weight: 700; background: var(--green-light); color: var(--green-dark); border-radius: 4px; padding: 2px 8px; }

/* ── STAT ROW ── */
.stat-row { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 28px; }
.stat-box { flex: 1; min-width: 140px; background: #fff; border: 1px solid var(--gray-200); border-radius: 8px; padding: 16px 20px; text-align: center; }
.stat-box .s-val { font-size: 1.8rem; font-weight: 700; color: var(--green); line-height: 1; }
.stat-box .s-lbl { font-size: 13px; color: var(--gray-600); margin-top: 4px; }

/* ── CTA ── */
.cta-section { background: var(--green-light); border-top: 1px solid var(--green); border-bottom: 1px solid var(--green); }
.cta-inner { max-width: 1012px; margin: 0 auto; padding: 48px 24px; display: flex; gap: 48px; align-items: center; }
.cta-text h2 { color: var(--green-dark); margin-bottom: 8px; }
.cta-text p  { font-size: 15px; }
.cta-actions { flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; }
.btn-green { display: inline-block; background: var(--green); color: #fff; font-weight: 700; font-size: 15px; padding: 10px 22px; border-radius: 6px; transition: background .2s; white-space: nowrap; }
.btn-green:hover { background: var(--green-dark); color: #fff; }
.btn-outline-green { display: inline-block; border: 1px solid var(--green); color: var(--green); font-size: 15px; padding: 10px 22px; border-radius: 6px; transition: all .2s; white-space: nowrap; }
.btn-outline-green:hover { background: var(--green); color: #fff; }

/* ── FOOTER ── */
.site-footer { background: var(--gray-100); border-top: 1px solid var(--gray-200); padding: 32px 0; margin-top: 0; }
.footer-inner { max-width: 1012px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.footer-logo { font-family: 'Ubuntu',sans-serif; font-weight: 700; font-size: 18px; color: var(--green); }
.footer-links { display: flex; gap: 20px; }
.footer-links a { font-size: 13px; color: var(--gray-600); }
.footer-links a:hover { color: var(--green); }
.footer-copy { font-size: 12px; color: var(--gray-600); }

/* ── RESPONSIVE ── */
@media (max-width: 680px) {
  .pillar-grid, .iface-grid, .partner-grid { grid-template-columns: 1fr; }
  .cta-inner { flex-direction: column; gap: 24px; }
  .summary-bar-inner { flex-wrap: wrap; }
  .summary-item { min-width: 50%; border-right: none; border-bottom: 1px solid var(--gray-200); }
}
</style>
</head>
<body>

<!-- ── HERO ── -->
<div class="hero">
  <div class="hero-content">
    <div class="hero-badge">Projet innovant</div>
    <h1>REBUS — FarmLab La Vauzelle</h1>
    <p class="hero-sub">Un espace de formation, de recherche et d'accueil pour l'agriculture numérique open source, ancré à la ferme de La Vauzelle, Saint-Porchaire (17).</p>
    <div class="hero-tags">
      <span class="hero-tag">Formation & DIY</span>
      <span class="hero-tag">Recherche & Développement</span>
      <span class="hero-tag">Séminaires & Accueil</span>
      <span class="hero-tag">Jumeau numérique</span>
      <span class="hero-tag">Open Source</span>
    </div>
  </div>
</div>

<!-- ── SUMMARY BAR ── -->
<div class="summary-bar">
  <div class="summary-bar-inner">
    <div class="summary-item">
      <div class="summary-val">32 Ha</div>
      <div class="summary-lbl">Agriculture biologique</div>
    </div>
    <div class="summary-item">
      <div class="summary-val">3 000 m²</div>
      <div class="summary-lbl">Bâtiments</div>
    </div>
    <div class="summary-item">
      <div class="summary-val">218 700 €</div>
      <div class="summary-lbl">Budget total</div>
    </div>
    <div class="summary-item">
      <div class="summary-val">FEADER</div>
      <div class="summary-lbl">Co-financeur principal</div>
    </div>
    <div class="summary-item">
      <div class="summary-val">2026–2028</div>
      <div class="summary-lbl">Calendrier</div>
    </div>
  </div>
</div>

<!-- ── SECTION : CONCEPT ── -->
<section class="section">
  <div class="container">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start">
      <div>
        <h2 style="color:var(--green-dark)">Qu'est-ce qu'un FarmLab ?</h2>
        <p style="font-size:15px;margin-top:12px">REBUS est un tiers-lieu agricole numérique porté par OSFarm à la ferme de La Vauzelle. Il propose un cadre concret pour former, expérimenter et partager des outils numériques open source dans des conditions réelles d'exploitation.</p>
        <p style="font-size:15px;margin-top:12px">Contrairement à un laboratoire hors-sol, REBUS s'appuie sur 32 hectares biologiques en activité, des bâtiments aménagés et une infrastructure numérique unique en milieu rural : fibre optique, WiFi longue portée, borne RTK centipède, réseau LoRa.</p>
        <p style="font-size:15px;margin-top:12px">Chaque outil proposé est libre, documenté et reproductible — les agriculteurs repartent avec des solutions qu'ils peuvent maintenir eux-mêmes.</p>
      </div>
      <div>
        <div class="quote-block">
          <div class="quote-text">« Les robots, c'est bien mais c'est trop cher et ça avance à rien »</div>
          <div class="quote-attr">— Jean-Michel, Agriculteur Charentais</div>
        </div>
        <p style="font-size:14px;margin-top:16px">REBUS répond à cette réalité : des solutions accessibles, que l'agriculteur peut comprendre, installer et maintenir lui-même, en s'appuyant sur la communauté OSFarm.</p>
      </div>
    </div>
  </div>
</section>

<!-- ── SECTION : TROIS PILIERS ── -->
<section class="section section-alt">
  <div class="container">
    <h2 style="color:var(--green-dark)">Trois missions complémentaires</h2>
    <p>Chaque pilier du FarmLab répond à un besoin identifié sur le territoire agricole charentais.</p>
    <div class="pillar-grid">
      <div class="pillar-card">
        <div class="p-num">01</div>
        <h3>Formation & Do It Yourself</h3>
        <ul>
          <li>Montage de serveurs reconditionnés sous Linux</li>
          <li>Fabrication de capteurs hardware (météo, LoRa…)</li>
          <li>Installation des solutions open source OSFarm</li>
          <li>Transfert de compétences autonomisant</li>
        </ul>
      </div>
      <div class="pillar-card">
        <div class="p-num">02</div>
        <h3>Recherche & Développement</h3>
        <ul>
          <li>Tests en plein champ : GORT, GAIA, AOG+</li>
          <li>Données temps réel via le jumeau numérique</li>
          <li>Collaboration avec les 6 partenaires GORT</li>
          <li>Protocoles reproductibles et publiés open source</li>
        </ul>
      </div>
      <div class="pillar-card">
        <div class="p-num">03</div>
        <h3>Séminaires & Accueil</h3>
        <ul>
          <li>Agriculteurs, techniciens, organisations agricoles</li>
          <li>Sessions BootCamp OSFarm (2 à 5 jours)</li>
          <li>Accueil de groupes en immersion sur la ferme</li>
          <li>Événements de démonstration R&D</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- ── SECTION : JUMEAU NUMÉRIQUE ── -->
<section class="section section-green">
  <div class="container">
    <h2 style="color:var(--green-dark)">Le jumeau numérique de La Vauzelle</h2>
    <p>Une représentation numérique complète de la ferme, actualisée en temps réel — outil de pilotage, de formation et de recherche partagé entre tous les usagers du FarmLab.</p>
    <div class="iface-grid">
      <div class="iface-card">
        <div class="iface-num">Interface 1</div>
        <h3>Temps réel</h3>
        <p>Météo en direct, objets en mouvement, état des cultures actuelle — visualisation cartographique des 32 Ha.</p>
      </div>
      <div class="iface-card">
        <div class="iface-num">Interface 2</div>
        <h3>Planification</h3>
        <p>Historique et projection des actions culturales — semis, traitements, récoltes — sur l'ensemble des parcelles.</p>
      </div>
      <div class="iface-card">
        <div class="iface-num">Interface 3</div>
        <h3>Production</h3>
        <p>Traçabilité complète des productions et suivi du cheptel — de la parcelle à la livraison.</p>
      </div>
      <div class="iface-card">
        <div class="iface-num">Interface 4</div>
        <h3>Gestion</h3>
        <p>Ratios technico-économiques, coûts de production, indicateurs de rentabilité par culture et par parcelle.</p>
      </div>
    </div>
  </div>
</section>

<!-- ── SECTION : SERVICES ── -->
<section class="section">
  <div class="container">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px">
      <div>
        <h2 style="color:var(--green-dark)">Services numériques open source</h2>
        <p style="margin-bottom:0">Chaque service proposé par REBUS est libre, documenté et reproductible par n'importe quelle exploitation.</p>
        <div class="service-list">
          <div class="service-row">
            <span class="service-badge">Matériel</span>
            <div>
              <div class="service-title">Serveurs reconditionnés sous Linux</div>
              <div class="service-desc">Montage, configuration et déploiement de serveurs de seconde main — infrastructure souveraine à coût réduit. Partenariat Seconde Nature.</div>
            </div>
          </div>
          <div class="service-row">
            <span class="service-badge">Hardware DIY</span>
            <div>
              <div class="service-title">Capteurs & stations de mesure</div>
              <div class="service-desc">Ateliers de fabrication : stations météo, capteurs d'humidité sol, réseaux LoRa et intégration dans la stack de données OSFarm.</div>
            </div>
          </div>
          <div class="service-row">
            <span class="service-badge">Logiciels</span>
            <div>
              <div class="service-title">Stack complète OSFarm</div>
              <div class="service-desc">Formation à l'installation et l'usage : autoguidage AOG+, IA agronomique GAIA, données Lexicon API, visualisation Tika.</div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h2 style="color:var(--green-dark)">La ferme de La Vauzelle</h2>
        <p>Site d'implantation — Saint-Porchaire, Charente-Maritime.</p>
        <div class="stat-row">
          <div class="stat-box"><div class="s-val">32 Ha</div><div class="s-lbl">Bio depuis 2017</div></div>
          <div class="stat-box"><div class="s-val">11 Ha</div><div class="s-lbl">Irrigables</div></div>
        </div>
        <div class="stat-row">
          <div class="stat-box"><div class="s-val">Fibre</div><div class="s-lbl">+ WiFi longue portée</div></div>
          <div class="stat-box"><div class="s-val">RTK</div><div class="s-lbl">Borne centipède LAVZ</div></div>
          <div class="stat-box"><div class="s-val">LoRa</div><div class="s-lbl">Réseau IoT</div></div>
        </div>
        <p style="font-size:13px;margin-top:16px">Sols : groies argilo-calcaires et terres rouges à châtaigniers · 2 Ha de bois (chêne vert) · 1 Ha zone humide · Puits · Potager clos · Habitation 650 m²</p>
      </div>
    </div>
  </div>
</section>

<!-- ── SECTION : PARTENAIRES ── -->
<section class="section section-alt">
  <div class="container">
    <h2 style="color:var(--green-dark)">Partenaires & soutiens</h2>
    <p>REBUS bénéficie du soutien formel de partenaires du territoire agricole et de l'économie sociale.</p>
    <div class="partner-grid">
      <div class="partner-card">
        <div class="p-name">Seconde Nature</div>
        <div class="p-type">Association de réemploi · Charente-Maritime</div>
        <div>
          <span class="p-badge copartner">Co-partenaire officiel</span>
        </div>
        <div class="p-date">Courrier de soutien — Avril 2025</div>
        <p style="font-size:13px;margin-top:10px">Approvisionnement en serveurs et équipements reconditionnés — économie circulaire au cœur du FarmLab.</p>
      </div>
      <div class="partner-card">
        <div class="p-name">Ocealia</div>
        <div class="p-type">Coopérative agricole · Nouvelle-Aquitaine</div>
        <div>
          <span class="p-badge support">Soutien exprimé</span>
        </div>
        <div class="p-date">Courrier de soutien — Mars 2025</div>
        <p style="font-size:13px;margin-top:10px">Soutien au développement d'un tiers-lieu numérique agricole open source et à la formation des adhérents.</p>
      </div>
      <div class="partner-card">
        <div class="p-name">Cyclad</div>
        <div class="p-type">Organisation agricole · Charente-Maritime</div>
        <div>
          <span class="p-badge support">Soutien exprimé</span>
        </div>
        <div class="p-date">Courrier de soutien — Avril 2025</div>
        <p style="font-size:13px;margin-top:10px">Soutien à la diffusion des outils numériques open source auprès des acteurs agricoles du territoire.</p>
      </div>
    </div>
  </div>
</section>

<!-- ── SECTION : FINANCEMENT ── -->
<section class="section">
  <div class="container">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start">
      <div>
        <h2 style="color:var(--green-dark)">Plan de financement</h2>
        <p>Co-financé par le FEADER via le Pays de Saintonge Romane et la Région Nouvelle-Aquitaine.</p>
        <table class="finance-table">
          <thead>
            <tr><th>Source</th><th class="amount">Montant</th></tr>
          </thead>
          <tbody>
            <tr><td>FEADER — Pays de Saintonge Romane</td><td class="amount">109 000 €</td></tr>
            <tr><td>Région Nouvelle-Aquitaine</td><td class="amount">64 200 €</td></tr>
            <tr><td>Autofinancement & Adhésions</td><td class="amount">45 500 €</td></tr>
          </tbody>
          <tfoot>
            <tr><td>Total</td><td class="amount">218 700 €</td></tr>
          </tfoot>
        </table>
      </div>
      <div>
        <h2 style="color:var(--green-dark)">Calendrier</h2>
        <div class="timeline">
          <div class="tl-item">
            <div class="tl-date">2026<br>T3–T4</div>
            <div class="tl-body">
              <div class="tl-title">Structuration et aménagement</div>
              <div class="tl-tags">
                <span class="tl-tag">Dossier FEADER</span>
                <span class="tl-tag">Plans bâtiments</span>
                <span class="tl-tag">Seconde Nature</span>
              </div>
            </div>
          </div>
          <div class="tl-item">
            <div class="tl-date">2027<br>T1–T4</div>
            <div class="tl-body">
              <div class="tl-title">Déploiement services & jumeau numérique v1</div>
              <div class="tl-tags">
                <span class="tl-tag">Jumeau numérique v1</span>
                <span class="tl-tag">Premiers BootCamps</span>
              </div>
            </div>
          </div>
          <div class="tl-item">
            <div class="tl-date alt">2028<br>T3–T4</div>
            <div class="tl-body">
              <div class="tl-title">Consolidation et essaimage</div>
              <div class="tl-tags">
                <span class="tl-tag">Modèle open source publié</span>
                <span class="tl-tag">Bilan FEADER</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ── CTA ── -->
<div class="cta-section">
  <div class="cta-inner">
    <div class="cta-text">
      <h2>Construire ensemble REBUS</h2>
      <p>Rejoignez le projet — agriculteurs, techniciens, développeurs, organisations territoriales. REBUS a besoin de vous pour devenir la référence française du FarmLab open source.</p>
    </div>
    <div class="cta-actions">
      <a href="/docs/fr/pres_rebus.html" target="_blank" class="btn-green">Presentation →</a>
      <a href="https://osfarm.org" class="btn-outline-green">Découvrir OSFarm →</a>
    </div>
  </div>
</div>
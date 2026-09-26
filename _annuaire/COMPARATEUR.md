# Comparateur de fiches de l'annuaire — exigences

Recueil, conception et réalisation du 2026-09-26 ; voir « Réalisation » en
fin de document.

Modèle : le comparateur de wiki-agri-tech
(`/fr/outils/comparer?outils=19-87,4egrowth`). Il propose un bouton « Comparer »
sur chaque carte, 3 outils au plus côte à côte, une adresse qui dit ce qu'on
compare, « Ajouter un outil » et « Exporter PDF ». Ses lignes sont des critères
éditoriaux (tarifs, notes, maturité, interfaces, usages), souvent vides (« — »).

## Objectif

Sur `/fr/communs/`, permettre de mettre deux ou trois communs côte à côte pour
choisir entre eux : quelle licence, quel état d'activité, quelle technologie,
quelle place dans un écosystème. Le comparateur s'appuie sur ce que les fiches
disent déjà, sans nouvelle saisie.

## Décisions

1. **Critères : les champs existants, plus ce qui s'en déduit** sans saisie.
   Aucun critère éditorial nouveau (maturité, usages, tarifs…) : ils
   demanderaient de renseigner 184 fiches et plus, et les communs sont tous
   gratuits.
2. **Français seulement.** L'annuaire complet n'existe qu'en `/fr/communs/` ;
   `/community/` n'affiche que les projets de la communauté.
3. **Trois fiches au plus.**
4. **Fonctions :** un lien partageable, la mise en évidence des différences, et
   l'ajout d'une fiche depuis le comparateur. Pas d'export PDF.
5. **Nature des licences** en cinq classes : permissive, copyleft faible,
   copyleft fort, données ou contenu, matériel.
6. **État d'activité** sur les seuils de la note du radar : « actif » (moins de
   3 mois), « ralenti » (moins d'un an), « en sommeil » (moins de deux ans),
   « sans activité récente » (au-delà). « Arrêté » attendra que les fiches
   sachent qu'un dépôt est archivé.
7. **Popularité affichée avec son unité** (étoiles GitHub, likes Hugging Face…),
   jamais mise en concurrence d'une forge à l'autre.
8. **Visibilité :** sur l'accueil et dans l'assistant de l'annuaire. L'assistant
   peut proposer un lien de comparaison prêt à l'emploi, **vérifié** : le filtre
   d'URL l'accepte seulement si chaque fiche qu'il nomme est dans le socle.

## Ce que les fiches permettent de comparer

Mesuré le 26/09/2026 sur les 184 fiches publiées :

| Champ | Renseigné | Remarque |
|---|---|---|
| famille, titre, url, résumé, mots-clés | 98 à 100 % | |
| type (rôle dans l'écosystème) | 100 % | « projet » par défaut |
| licence | 94 % | identifiant SPDX |
| dernière activité (`date_maj`) | 91 % | |
| intérêt | 91 % | |
| techno | 67 % | langage principal du dépôt |
| popularité | 66 % | étoiles GitHub, likes Hugging Face… : unités différentes selon la forge |
| catégorie | 34 % | projets de la communauté |
| démo | 29 % | |
| dépôt distinct de l'url | 26 % | |
| composant de (`partie_de`) | 4 % | |

Ce qui se déduit sans saisie :
- **la nature de la licence**, à partir de l'identifiant SPDX : permissive,
  copyleft faible, copyleft fort, licence de données ou de contenu, licence de
  matériel ;
- **l'état d'activité**, à partir de la dernière activité, sur les seuils
  que le radar utilise déjà pour la note : moins de 3 mois, moins d'un an,
  moins de deux ans, au-delà ;
- **la forge** (GitHub, GitLab, Hugging Face, Zenodo, autre), à partir du
  dépôt ou, à défaut, de l'url ;
- **la provenance** : projet de la communauté, radar, ou liste de la
  communauté (`curation`) ;
- pour un écosystème, **ses composants**, et pour un composant, **son
  parent**.

## Exigences fonctionnelles

**Sélection depuis l'annuaire**
1. Chaque carte de `/fr/communs/` porte une commande « Comparer », qui ajoute
   ou retire la fiche de la sélection.
2. Une barre de sélection apparaît dès la première fiche. Elle montre les
   fiches choisies (n / 3), permet d'en retirer une, et mène au comparateur
   quand il y en a au moins deux.
3. Au-delà de trois fiches, la commande est refusée avec un message ; aucune
   fiche n'est retirée d'office.
4. La sélection survit aux filtres et à la recherche de l'annuaire, ainsi
   qu'au va-et-vient entre l'annuaire et le comparateur.

**Page de comparaison**
5. Elle a sa propre adresse sous `/fr/communs/`. Les fiches comparées sont dans
   l'adresse : la copier suffit à partager ou à retrouver la comparaison.
6. Une colonne par fiche : logo ou icône de famille, nom, auteur, lien vers la
   carte dans l'annuaire, lien vers le projet ; un bouton retire la fiche.
7. Les lignes sont groupées :
   - **Identité** : famille, rôle, écosystème (parent ou composants),
     catégorie ;
   - **Ouverture** : licence, nature de la licence, forge et dépôt, démo ;
   - **Vitalité** : dernière activité, état d'activité, popularité avec son
     unité ;
   - **Technique** : technologie ;
   - **Contenu** : résumé, intérêt, mots-clés ;
   - **Provenance** : origine de la fiche et date d'ajout.
8. Une valeur absente s'affiche comme « non renseigné », jamais comme une
   case vide ni comme « — » seul.
9. **Différences.** Une ligne dont les valeurs diffèrent entre les fiches est
   mise en évidence. Une option « seulement les différences » masque les lignes
   identiques. Deux popularités d'unités différentes (étoiles et likes) ne se
   comparent pas : la ligne ne les met pas en concurrence.
10. **Ajout.** Tant qu'il reste une place, un champ de recherche propose les
    fiches de l'annuaire (nom, résumé, mots-clés, comme la recherche de
    l'annuaire). Choisir une fiche l'ajoute et met l'adresse à jour.
11. Si l'adresse nomme une fiche qui n'existe plus, la page l'écarte et le dit.
    Si elle en nomme plus de trois, seules les trois premières sont gardées.
    Avec une seule fiche ou aucune, la page invite à en ajouter.

**Accueil**
12. Les pages d'accueil françaises présentent le comparateur près de l'accès à
    l'annuaire, avec un exemple de comparaison qui marche.

**Assistant de l'annuaire**
13. Le socle (`data/socle.txt`) décrit le comparateur, donne l'adresse de sa
    page et la forme exacte d'un lien de comparaison, avec les identifiants de
    fiches qu'il contient déjà.
14. Quand on lui demande de choisir entre plusieurs communs, l'assistant peut
    proposer un lien qui les compare, trois au plus.
15. La garantie « aucune URL inventée » tient : le nœud « Extraire la réponse »
    du workflow n8n *Chatbot de l'annuaire* et la bulle (`chatbot.js`)
    acceptent une adresse de comparaison seulement si elle suit la forme
    prévue et que **chaque** identifiant qu'elle nomme est une fiche du socle,
    trois au plus. Toute autre adresse reste retirée, comme aujourd'hui.

## Exigences non fonctionnelles

- **Une seule source.** Le comparateur lit les mêmes fiches que l'annuaire
  (`_data/radar/`), générées par Jekyll. Aucune donnée n'est saisie deux fois.
  `data/communs.json` est un contrat public : il ne perd ni ne renomme aucune
  clé, et toute clé ajoutée va en fin d'objet (règle du 21/09/2026).
- **Site statique.** Rien côté serveur, pas de dépendance nouvelle : du
  JavaScript sans bibliothèque, comme `catalogue.js` et `documentation.js`.
- **Sobriété.** Aucune requête vers un service tiers. La sélection est gardée
  dans le navigateur du visiteur, et elle peut se perdre (navigation privée)
  sans rien casser, puisque l'adresse de la page suffit.
- **Accessibilité.** Un vrai tableau (en-têtes de lignes et de colonnes), les
  commandes « Comparer » sont des boutons à état (`aria-pressed`), et les
  changements de la barre de sélection sont annoncés.
- **Mobile.** À 360 px de large, la colonne des critères reste visible et les
  fiches défilent horizontalement, sans que la page elle-même défile de côté.
- **Charte.** Mêmes composants visuels que l'annuaire (vignette, famille,
  licence), en thème clair comme en thème sombre.

## Histoires et critères d'acceptation

- *Une agricultrice hésite entre deux outils d'irrigation.* Depuis
  `/fr/communs/`, elle filtre sur « irrigation », clique « Comparer » sur Smart
  Irrigation et Irrigation Unlimited, puis sur « Comparer (2) ». Elle voit les
  deux fiches côte à côte ; la ligne de dernière activité est mise en évidence
  si les dates diffèrent.
- *Un développeur veut réutiliser une brique.* Il compare trois bibliothèques
  et lit, sur la ligne « nature de la licence », laquelle est copyleft fort.
- *Une animatrice partage une comparaison.* Elle copie l'adresse de la page et
  l'envoie ; son correspondant, sur un autre appareil, voit les mêmes trois
  fiches sans rien sélectionner.
- *Un visiteur demande à l'assistant* « lequel choisir entre Mycodo et
  TerrariumPI ? ». La réponse cite les deux fiches et un lien de comparaison
  qui ouvre les deux côte à côte.
- *Le modèle fabrique un lien de comparaison* avec un identifiant absent du
  socle. Le lien est retiré de la réponse, par n8n puis par la bulle.
- *Une fiche est retirée de l'annuaire* (`publier: false`). Un lien de
  comparaison qui la nommait s'ouvre encore, avec les fiches restantes et un
  message.
- Avec l'option « seulement les différences », une comparaison de deux fiches
  de même famille masque la ligne « famille ».
- `bundle exec rake test` passe, et l'annuaire garde son comportement actuel
  pour qui n'utilise pas le comparateur.

## Questions tranchées

Les quatre questions du recueil ont reçu leur réponse le 26/09/2026 : voir les
décisions 5 à 8. Les fiches « besoin non couvert » (`_data/besoins.yml`) sont
hors du comparateur : elles vivent dans leur propre section, hors de la grille
des cartes, et n'ont ni url ni licence.

---

# Conception

Conçue le 2026-09-26 à partir du code existant : `docs/fr/communs.html` (et
son script en ligne), `_includes/annuaire-carte.html`,
`_includes/radar-fiches.html`, `data/socle.txt`, `assets/js/chatbot.js`,
`fr/index.html`, `_annuaire/verifier.py` et le workflow n8n *Chatbot de
l'annuaire* (`eDyK2p0Oa6J2OV6J`). **Le principe : l'adresse fait foi.** La
page de comparaison ne connaît que ce que dit son adresse. La sélection gardée
dans le navigateur n'est qu'une commodité pour y arriver.

## Ce que la lecture du code a appris

- **Deux formes d'identifiant.** Les fiches du radar ont 12 caractères
  hexadécimaux (`dc0f5c62e9ef`), celles de la communauté un slug
  (`projet-agopengps`). Les deux tiennent dans `[a-z0-9-]` : une virgule peut
  séparer les fiches dans l'adresse sans échappement.
- **La bulle ne valide rien seule.** `chatbot.js` ne rend cliquables que les
  adresses que n8n a mises dans `sources`. La garantie « aucune URL inventée »
  vit tout entière dans le nœud « Extraire la réponse », qui garde une
  adresse si et seulement si `socle.indexOf(url) !== -1`. C'est donc là, et
  seulement là, qu'un lien de comparaison doit être reconnu. L'exigence 15
  (« n8n et la bulle ») se réduit à n8n ; la bulle ne gagne qu'un libellé.
- **La popularité n'a pas une unité par forge, mais par connecteur.** Ce sont
  des étoiles pour GitHub et GitLab (recherche, listes), des réutilisations
  pour data.gouv, et pour Hugging Face un indice qui mêle likes et
  téléchargements / 100 (`connecteur_huggingface`). L'unité se déduit donc de
  la source de la fiche, pas de son adresse.
- **Défauts de données relevés, hors périmètre :** deux fiches de la
  communauté sous `cc-by-nc-sa-3.0` (clause non commerciale, donc pas une
  licence ouverte) et une licence écrite « mit license » au lieu de `mit`. Le
  comparateur les affichera « non classée ». À corriger dans
  `communaute.yml` séparément.

## Adresse

    /fr/communs/comparer/?fiches=<id>,<id>[,<id>]

- Les fiches sont dans l'ordre de la sélection. Au-delà de trois, les
  suivantes sont ignorées. Un identifiant hors de `[a-z0-9-]+` ou inconnu est
  écarté et signalé.
- La même forme sert à l'annuaire, à l'accueil, au socle et au contrôle n8n.
  C'est un **contrat** : `verifier.py` garantit que tout identifiant publié
  la respecte.

## Fichiers

| Fichier | Rôle | Nouveau ? |
|---|---|---|
| `_data/comparateur.yml` | réglages : plafond (3), classes de licences, seuils et libellés d'activité, unités de popularité par source, exemple de l'accueil | oui |
| `_includes/annuaire-identite.html` | calcule `nom` et `auteur` d'une fiche, extrait de `communs.html` pour servir aussi au comparateur | oui (extraction) |
| `_includes/annuaire-carte.html` | + bouton « Comparer » (caché sans JavaScript) | modifié |
| `docs/fr/communs.html` | + barre de sélection, + script du bouton ; son calcul nom/auteur passe par l'include | modifié |
| `docs/fr/comparer.html` | la page `/fr/communs/comparer/`, avec les fiches en îlot JSON | oui |
| `assets/js/comparateur.js` | la page : lecture de l'adresse, tableau, différences, ajout | oui |
| `assets/js/comparateur-selection.js` | l'annuaire : boutons, barre, mémoire de la sélection | oui |
| `assets/css/custom.scss` | section « Comparateur » | modifié |
| `fr/index.html` | un accès au comparateur et l'exemple | modifié |
| `data/socle.txt` | section COMPARATEUR et ligne dans « Où orienter l'usager » | modifié |
| `_annuaire/verifier.py` | forme des identifiants, existence des fiches de l'exemple | modifié |
| n8n *Chatbot de l'annuaire*, nœud « Extraire la réponse » | reconnaît un lien de comparaison vérifié | modifié |
| `assets/js/chatbot.js` | libellé « comparaison » au lieu de « osfarm.org » | modifié |
| `_chatbot/README.md`, `CLAUDE.md` | documentation | modifié |

## Données : `_data/comparateur.yml`

Comme `_data/chatbot.yml` ou `_data/catalogue.yml`, le réglage vit dans les
données, pas dans le JavaScript :

    meta:
      max: 3
    licences:                 # nature de la licence, dans l'ordre d'affichage
      - id: permissive
        titre: Permissive
        ids: [mit, isc, zlib, unlicense, bsd-2-clause, bsd-3-clause, apache-2.0, cc0-1.0, pddl-1.0]
      - id: copyleft-faible
        titre: Copyleft faible
        ids: [lgpl-2.1, lgpl-3.0, mpl-2.0, epl-2.0, cecill-2.1 …]
      - id: copyleft-fort
        titre: Copyleft fort
        ids: [gpl-2.0, gpl-3.0, agpl-3.0, eupl-1.2, osl-3.0]
      - id: donnees
        titre: Données ou contenu
        ids: [cc-by-3.0, cc-by-4.0, cc-by-sa-3.0, cc-by-sa-4.0, odbl-1.0, odc-by-1.0, etalab-2.0, gfdl-1.3]
      - id: materiel
        titre: Matériel
        ids: [cern-ohl-p-2.0, cern-ohl-w-2.0, cern-ohl-s-2.0, tapr-ohl-1.0, solderpad-2.1]
    activite:                 # mêmes seuils que noter() dans _radar/collecte.py
      - { jusqu_a: 90,  titre: actif }
      - { jusqu_a: 365, titre: ralenti }
      - { jusqu_a: 730, titre: en sommeil }
      - {               titre: sans activité récente }
    popularite:               # unité selon le préfixe de `source`
      github: étoiles GitHub
      liste: étoiles           # une liste résout vers GitHub ou GitLab
      datagouv: réutilisations
      hf: indice Hugging Face (likes et téléchargements)
    exemple: [<id>, <id>]     # comparaison montrée sur l'accueil

Les listes de licences reprennent `LICENCES_OUVERTES` de `collecte.py`. Une
licence absente des classes s'affiche « non classée », et son identifiant
reste visible sur la ligne « Licence ». Pour la popularité, une source
sans unité connue (communauté, zenodo) donne « non renseigné ».

## Page de comparaison : `docs/fr/comparer.html`

- Front matter : `layout: fr-support-page`, `permalink: /fr/communs/comparer/`,
  `lang: fr`, `large: true`.
- `{% include radar-fiches.html %}` : les mêmes fiches que l'annuaire, sans
  seconde source. Un îlot `<script type="application/json"
  id="comparateur-donnees">` porte `{ reglages, fiches: [...] }`. Chaque fiche
  n'a que les champs utiles : id, titre, nom, auteur, url, depot, demo, img,
  famille, type, partie_de, categorie, licence, date_maj, popularite, source,
  curation, propose_le, techno, resume, interet, mots. Environ 110 Ko, 30 Ko
  compressés : c'est l'ordre de grandeur de la page annuaire elle-même.
- `data/communs.json` n'est pas touché : le contrat public reste tel quel, et
  l'îlot est un détail interne de la page.
- Le squelette HTML est rendu par Jekyll : titre, barre d'ajout, case « seulement
  les différences », zone du tableau, et `<noscript>` qui renvoie à l'annuaire.
  `comparateur.js` remplit le reste.

## `assets/js/comparateur.js`

    lireAdresse()        → ids d'après ?fiches=, filtrés [a-z0-9-]+, dédoublonnés,
                            bornés à meta.max ; inconnus mis de côté pour le message
    ecrireAdresse(ids)   → history.replaceState, puis memoriser(ids)
    deriver(fiche)       → { natureLicence, etat, forge, unite, provenance, ecosysteme }
    LIGNES               → [{ groupe, libelle, valeur(f) → texte|null, comparable }]
    rendre()             → <table> : en-têtes de colonnes (fiche), en-têtes de
                            lignes (critère), <tbody> par groupe
    differe(ligne)       → vrai si les valeurs non nulles diffèrent, ou si
                            certaines manquent et d'autres non ; faux pour la
                            popularité quand les unités diffèrent
    ajouter(id) / retirer(id)
    chercher(terme)      → même index que les cartes (nom, auteur, résumé,
                            mots-clés), 8 propositions, liste de suggestions au clavier

**Dérivations**
- **nature de la licence** : la classe de `reglages.licences` qui contient
  l'identifiant, sinon « non classée » ;
- **état d'activité** : écart entre `date_maj` et le jour de consultation,
  classé par `reglages.activite`. Il est calculé au navigateur et non au
  build, pour ne pas vieillir entre deux constructions du site ;
- **forge** : hôte de `depot`, sinon de `url` (GitHub, GitLab, Hugging Face,
  Zenodo, data.gouv, sinon « site du projet ») ;
- **provenance** : « communauté OSFarm » pour `communaute-osfarm` et
  `proposition-site`, « liste <curation> » si `curation`, sinon « radar » ;
- **écosystème** : le parent si `partie_de`, sinon les composants (les fiches
  dont `partie_de` vaut l'id), comme sur la carte.

**Ce qu'on voit.** Une valeur nulle s'affiche « non renseigné ». Une ligne
différente reçoit la classe `is-differente` et un marqueur textuel lisible
par un lecteur d'écran (« diffère »). Avec « seulement les différences », les
lignes identiques sont masquées, et un groupe devenu vide aussi. Le contenu
(résumé, intérêt, mots-clés) n'est jamais « identique » : il reste affiché.

**Cas limites.** Aucune fiche ou une seule : l'invite à ajouter prend la place
du tableau. Des identifiants inconnus : un message les nomme (« 1 fiche
n'est plus dans l'annuaire »). Pas de `?fiches=` mais une sélection gardée :
elle est reprise et l'adresse est réécrite.

## Sélection depuis l'annuaire : `assets/js/comparateur-selection.js`

- Chaque carte reçoit, rendu par Jekyll, `<button type="button"
  class="radar-comparer" data-comparer="<id>" aria-pressed="false" hidden>`.
  Le script retire `hidden` : sans JavaScript, pas de bouton inerte.
- La barre `<div class="comparateur-barre" role="region" aria-label="Sélection
  à comparer">` est rendue cachée dans `communs.html`. Elle contient les noms
  choisis, avec un bouton pour retirer chacun, un compteur (n / 3), le lien
  « Comparer » (actif à partir de 2, `href` = l'adresse de comparaison) et
  « Vider ». Une zone `aria-live="polite"` annonce les ajouts, retraits et
  refus.
- **Mémoire** : `localStorage["osfarm-comparateur"]` = tableau d'ids. Chaque
  lecture et chaque écriture sont dans un `try/catch` ; en cas d'échec, la
  sélection vit le temps de la page. Au chargement, les ids qui ne
  correspondent à aucune carte sont oubliés.
- Le script est **indépendant** du script en ligne des filtres : une carte
  masquée par un filtre garde son état, et la barre reste visible.
- La 4ᵉ fiche est refusée, avec l'annonce « trois fiches au plus, retirez-en
  une ».

## Accueil : `fr/index.html`

Sous le bouton « Explorer les N communs », une ligne : « ou comparez-en jusqu'à
trois, par exemple <a href=…?fiches=a,b>A et B</a> ». L'exemple vient de
`comparateur.yml` et n'est rendu que si ses fiches sont publiées, ce qui se
vérifie dans le Liquid. Il faut deux fiches de la communauté, aux slugs
stables et aux profils comparables : à choisir à la réalisation parmi les
écosystèmes et projets de `communaute.yml`.

## Assistant

**Socle.** Une section `## COMPARATEUR`, placée avant « Où orienter l'usager » :

    Page : {{ site.url }}/fr/communs/comparer/
    Pour comparer deux ou trois fiches, écris exactement
      {{ site.url }}/fr/communs/comparer/?fiches=<id>,<id>
    où chaque <id> est recopié depuis la ligne « fiche : …#commun-<id> » de la
    fiche. Jamais plus de trois. Ne compare que des fiches de ce document.
    Un lien construit autrement sera retiré de ta réponse.

Plus une ligne dans « Où orienter l'usager ». Le socle grossit d'environ 120
tokens.

**n8n, nœud « Extraire la réponse ».** Un second prédicat s'ajoute à
`valide()`, sans rien retirer au premier :

    const PAGE = (socle.match(/https?:\/\/\S+\/fr\/communs\/comparer\//) || [])[0];
    const comparaison = (u) => {
      if (!PAGE || u.indexOf(PAGE + '?fiches=') !== 0) return false;
      const ids = u.slice((PAGE + '?fiches=').length).split(',');
      return ids.length >= 2 && ids.length <= 3
        && new Set(ids).size === ids.length
        && ids.every(id => /^[a-z0-9-]+$/.test(id)
             && new RegExp('#commun-' + id + '(?![a-z0-9-])').test(socle));
    };
    const valide = (brut) => { const u = …; return u && (socle.indexOf(u) !== -1 || comparaison(u)); };

- Le préfixe est **lu dans le socle**, pas écrit dans le nœud : le domaine
  reste une donnée du site.
- La frontière `(?![a-z0-9-])` empêche `projet-farm` de passer grâce à
  `projet-farmbot`.
- Les ids sont vérifiés par `[a-z0-9-]+` avant d'entrer dans la regex :
  aucun caractère spécial n'y parvient.
- Le nœud est mis à jour par `update_workflow` avec le `jsCode` complet, sans
  passer par le SDK : son parseur casse sur des chaînes JS valides (mémoire du
  projet). Il faut ensuite le tester avec trois questions : un vrai lien, un
  id inventé, quatre ids.

**Bulle.** `joli(url)` rend « comparaison » pour une adresse
`/fr/communs/comparer/?fiches=`. Rien d'autre ne change : la bulle continue de
ne rendre cliquable que ce que n8n a mis dans `sources`.

## Garde-fou : `_annuaire/verifier.py`

Deux contrôles s'ajoutent, sur `_site/data/communs.json` comme les autres :
- **tout identifiant publié respecte `^[a-z0-9-]+$`**, sans quoi les liens de
  comparaison et le contrôle n8n cesseraient de le reconnaître ;
- **les fiches de `exemple` dans `_data/comparateur.yml` sont publiées.** Il
  est lu au motif, sans PyYAML, comme `types_autorises()`.

`.github/workflows/annuaire.yml` ajoute `_data/comparateur.yml` à ses chemins.

## Mise en page

- Tableau dans un conteneur `overflow-x: auto`. La première colonne (les
  critères) est en `position: sticky; left: 0`, sur le fond de la page.
- Les colonnes de fiche font au moins 14rem, ce qui donne à 360 px une fiche et
  demie visible, et fait deviner le défilement.
- En-tête de colonne : la vignette et le badge de famille, repris des classes
  `radar-vignette` et `radar-famille` de la carte, donc déjà
  thémés clair et sombre.
- Ligne différente : un liseré à gauche et un fond léger, tirés des jetons de
  couleur existants, dans les deux thèmes.
- La barre de sélection est collée en bas de l'écran (`position: sticky`), à
  pleine largeur sur mobile. Elle ne doit pas masquer la bulle de l'assistant,
  qui occupe le coin inférieur droit : la barre lui réserve sa marge.

## Vérification

1. `bundle exec jekyll build` puis `bundle exec rake test` : html-proofer
   et `verifier.py` passent.
2. Sur une capture par CDP (voir la mémoire du projet : attendre le vrai
   chargement), l'annuaire à 1280 px et à 360 px :
   - trois fiches sélectionnées ;
   - la quatrième refusée ;
   - la barre visible et la bulle dégagée.
3. La comparaison des deux fiches de l'exemple :
   - l'adresse partagée ouverte dans un profil vierge montre les mêmes fiches ;
   - « seulement les différences » masque la ligne famille ;
   - un id inventé ajouté à la main dans l'adresse donne un message et deux
     colonnes.
4. Le chatbot, par `test_workflow` ou par la bulle :
   - une question de choix entre deux fiches rend un lien de comparaison
     cliquable ;
   - un lien forgé avec un id absent du socle est retiré (`liens_retires` ≥ 1).
5. Aucune carte ne change pour qui n'utilise pas le comparateur, hors le
   bouton ; le contenu de `communs.json` reste identique.

## Ordre de réalisation

1. `_data/comparateur.yml`, l'extraction `annuaire-identite.html` (sans effet
   visible : on compare le HTML de `/fr/communs/` avant et après).
2. La page `comparer.html` et `comparateur.js`, testées à la main par adresse.
3. Le bouton, la barre et `comparateur-selection.js` dans l'annuaire.
4. Le CSS, clair et sombre, et les captures mobile et bureau.
5. `verifier.py` et le workflow de cohérence.
6. L'accueil.
7. Le socle, puis le nœud n8n et ses trois essais, puis `chatbot.js`.
8. La documentation : `_chatbot/README.md`, `CLAUDE.md`, et ce fichier (section
   « Réalisation »).

---

# Réalisation

Faite le 2026-09-26. Fichiers : ceux du tableau « Fichiers » ci-dessus, plus
`docs/fr/comparer.html` (et non `communs-comparer.html`).

## Vérifié

- **Extraction neutre.** Après passage par `annuaire-identite.html`,
  `/fr/communs/` est identique à l'octet près, horodatage de génération mis à
  part.
- **Page de comparaison**, par CDP, sur `_site` servi en local. Avec
  `?fiches=projet-farmos,projet-litefarm,projet-tania,projet-ekylibre,inconnu-x` :
  - l'adresse est réécrite sur les trois premières fiches connues, avec le
    message « Une fiche de l'adresse n'est plus dans l'annuaire. Seules les 3
    premières fiches sont comparées. » ;
  - les lignes Licence, Nature de la licence, Dépôt, Démo, Dernière activité,
    État d'activité et Technologie sont signalées ;
  - Tania (dernière activité le 13/06/2024) est « sans activité récente ».
- **Seulement les différences** (farmOS et LiteFarm) : il reste Licence, Dépôt,
  Démo, Technologie et le contenu libre. Les groupes Identité, Vitalité et
  Provenance disparaissent avec leur titre.
- **Ajout au clavier** (« tania », ↓, Entrée) et **retrait** : l'adresse et la
  mémoire suivent. Sans paramètre, la sélection gardée est reprise ;
  `?fiches=` vide affiche l'invitation.
- **Annuaire.**
  - 182 boutons révélés, aucun sur les besoins.
  - Trois fiches choisies ; la quatrième est refusée, avec l'annonce et le
    tremblement de la barre.
  - La barre s'arrête à gauche de la bulle.
  - Au passage, un profil de test a montré que la sélection faite dans le
    comparateur se retrouve dans l'annuaire.
- **360 px** : la page ne défile pas de côté (`scrollWidth` 360). Le tableau
  (696 px) défile dans son cadre, et la colonne des critères, réduite à
  7,5rem, reste collée.
- **Garde-fou.** `verifier.py` passe sur l'export réel et échoue sur un exemple
  qui nomme une fiche inexistante.
- **Contrôle n8n**, testé hors n8n sur le socle généré, en 14 cas : vrais liens
  (slugs et identifiants hexadécimaux), point final, id inventé, préfixe d'id,
  une seule fiche, quatre, doublon, gabarit tronqué, exemple coupé, page du
  comparateur, lien de fiche, URL inventée habituelle. Tous conformes. Sans
  section COMPARATEUR dans le socle, un lien de comparaison est refusé et
  les autres gardent leur comportement.
- **`bundle exec rake test`** : `verifier.py` passe (182 fiches cohérentes).
  html-proofer signale 134 échecs, dont un seul nouveau : le 404 de
  `https://www.osfarm.org/fr/communs/comparer/`, adresse canonique de la page,
  vérifiée sur le site en ligne où elle n'existe pas encore. Il disparaît au
  déploiement. Les autres échecs existaient avant sur `main` : des sites qui
  répondent 403 aux robots (helloasso, highcharts, gbif…) et six images sans
  `src` sur les pages d'accueil.
- **n8n publié** (version `6308b977…`). Une question réelle en production, sur
  le socle encore sans COMPARATEUR, rend les deux liens de fiche dans
  `sources` : pas de régression.

## Écarts à la conception

- **Le contrôle n8n est exclusif.** Toute adresse qui commence par le préfixe du
  comparateur ne passe que par la vérification des identifiants. La règle
  générale garde n'importe quel morceau du socle : elle aurait accepté le
  gabarit `?fiches=<id>` coupé au `<` que la section COMPARATEUR contient, ou
  un exemple tronqué.
- **La consigne du socle est amendée.** La règle 2 bis (« deux liens par fiche,
  toute autre adresse est une invention ») nomme désormais l'exception du lien
  de comparaison, pour ne pas donner au modèle deux consignes contraires.
- **Pas de thème sombre.** Le site n'en a pas : le comparateur suit le thème
  clair de l'annuaire.
- **Provenance.** Deux fiches de `communaute.yml` n'ont pas de `source` ;
  elles sont lues « communauté OSFarm ».

## Reste à faire

1. **Après le déploiement du site**, poser au chatbot une question de choix
   entre deux fiches. Le lien de comparaison doit être cliquable et libellé
   « comparaison ». Un lien forgé doit être retiré (`liens_retires` ≥ 1 dans
   l'exécution n8n).
2. Corriger dans `communaute.yml` les deux licences `cc-by-nc-sa-3.0` (L'Atelier
   Paysan, Le Pré Fabriqué), qui ne sont pas ouvertes, et « mit license »
   (OpenSourceAgriculture), qui doit s'écrire `mit`. Le comparateur les
   affiche « non classée » d'ici là.


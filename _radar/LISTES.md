# Les listes communautaires comme source du radar — exigences

Recueil du 2026-09-26. Conception et réalisation suivent, même jour ; voir
« Réalisation » en fin de document.

## Objectif

Faire entrer dans l'annuaire les communs déjà repérés par les listes
« awesome » de la communauté, avec les garanties actuelles du radar (licence
ouverte vérifiée, relecture en pull request), puis suivre ce que ces listes
ajoutent. Les listes ne sont pas citées sur le site : seule leur substance
entre, fiche par fiche.

## Listes retenues

| Liste | Format | Pourquoi |
|---|---|---|
| geezacoleman/OpenSourceAgriculture | tableaux par section | jeux de données de vision, matériel de terrain ; ~65 entrées dont ~25 sur GitHub |
| brycejohnston/awesome-agriculture | puces `- [Nom](url) - description` | la liste de référence (1 900 étoiles) ; ~50 dépôts |
| Intergalactic-XYZ/awesome-cropsteering | puces | active (08-2026), culture sous abri et automatisation ; ~90 dépôts — à calibrer |

Écartées : les listes sans commit depuis 2023 ou plus (awesome-agtech,
awesome-open-ag, Awesome-Precision-Agriculture de px39n…) et les listes
générées automatiquement par tri d'étoiles (série ishandutta2007), qui
n'apportent rien de plus que la recherche GitHub du radar.

## Décisions

1. **Import initial ponctuel, puis nouveautés seulement.** Le premier passage
   sur une liste produit un lot dédié, relu une fois ; ensuite, seules les
   entrées absentes de la mémoire remontent dans les lots quotidiens.
2. **Relecteurs : @ionosphere et @bertrandgorge**, pour toutes les listes.
3. **Bonus de curation** dans `noter()` : une entrée retenue par un curateur
   humain part avec quelques points d'avance sur un résultat de recherche.
4. **Remonter jusqu'au dépôt** quand l'URL est une page de projet
   (`*.github.io`, site d'une forge GitLab) : la licence se lit dans le dépôt.
5. **Pas de licence ouverte vérifiée, pas de fiche.** Kaggle, Mendeley, pages
   d'université et articles sont écartés s'ils ne mènent à aucun dépôt.

## Exigences fonctionnelles

1. Suivre une liste = ajouter un bloc à `sources.yml` : `type: liste`, URL du
   README brut, famille par défaut, `relecteur`, `limite`, et une
   correspondance facultative section → famille (*Datasets* → `donnees`,
   *Hardware* / *In-Field* → `materiel`, *Foundation models* → `modele`).
2. Le connecteur lit les deux formats (tableaux et puces) et ignore les ancres
   internes, le sommaire, les badges et les liens secondaires d'une ligne
   (article, supplément) : seul le premier lien nomme l'entrée.
3. Chaque entrée devient un candidat : titre, URL, description d'origine,
   section d'origine en mot-clé, identifiant de la liste en provenance.
4. Licence, techno et dernière activité viennent de l'API de la forge (GitHub,
   GitLab, Hugging Face, Zenodo), après remontée éventuelle jusqu'au dépôt.
5. Dédoublonnage par `urls_du_site()` et la mémoire, sur l'URL de la liste
   **et** sur le dépôt résolu : OWL, AgML, FarmBot et AgOpenGPS ne reviennent
   pas.
6. Import initial : un mode explicite (déclenché à la main, pas par le passage
   quotidien) traite toute la liste sans le plafond `max_par_relecteur` et
   ouvre sa propre pull request. Toutes les entrées vues, gardées ou écartées,
   entrent en mémoire à la fusion.
7. Passage quotidien : une liste dont l'import initial n'est pas fusionné
   n'est pas lue ; ensuite, seules les URL inconnues de la mémoire sont
   traitées.
8. `relecteur` accepte une liste d'identifiants ; `resume.py` les mentionne
   tous dans la pull request et le plafond par relecteur les compte chacun.

## Exigences non fonctionnelles

- Une liste qui change de format rend zéro entrée et le signale dans le texte
  de la pull request, sans faire échouer le radar.
- Le coût en appels API tient dans le `GITHUB_TOKEN` des Actions, import
  initial compris (~200 entrées sur les trois listes).
- Aucun changement côté site : même format de fiche, même `communs.json`.
- Un lot quotidien se relit toujours en 3 minutes ; seul l'import initial, lot
  exceptionnel et annoncé comme tel, peut être plus long.

## Critères d'acceptation

- En `--blanc`, l'import initial lit ≥ 50 entrées d'OpenSourceAgriculture et
  ≥ 70 d'awesome-agriculture (75 entrées réelles : les 87 puces comptées au
  recueil comprenaient les 12 lignes du sommaire).
- Aucune fiche produite sans licence ouverte vérifiée.
- Aucune des URL déjà présentes dans l'annuaire n'est reproposée.
- Après fusion de l'import, un passage quotidien sur une liste inchangée
  produit zéro candidat ; une entrée ajoutée à la liste produit un candidat.
- La pull request mentionne @ionosphere et @bertrandgorge.

## Restent à trancher en conception

- Montant du bonus de curation (avec `seuil_score` à 55).
- Une entrée écartée faute de licence revient-elle après `quarantaine_jours`
  comme les autres, ou reste-t-elle écartée tant que la liste ne change pas ?
- Où déclarer qu'un import initial est fusionné : la mémoire suffit-elle ?

---

# Conception

Conçu le 2026-09-26 à partir des exigences ci-dessus et du code existant
(`collecte.py`, `resume.py`, `.github/workflows/radar.yml`). Le principe :
**une liste est une source comme une autre**. Elle passe par le même
dédoublonnage, la même notation, la même mémoire et la même pull request. Seuls
s'ajoutent un connecteur, un mode d'import et deux retouches génériques.

## Réponses aux questions laissées ouvertes

| Question | Choix | Raison |
|---|---|---|
| Montant du bonus | réglage `bonus_curation: 10` | compense des descriptions courtes, sans topics GitHub, sans suffire seul : il faut toujours la licence (40) pour passer 55 |
| Sans licence après 90 jours | même règle que les autres sources | une licence a pu être ajoutée ; le coût est une rafale d'appels tous les 90 jours |
| Import fusionné ? | présence sur `main` du lot `_data/radar/AAAA-MM-JJ-import-<id>.yml` | la fusion reste le seul geste : aucun état en plus, rien à cocher à la main |

## Flux

    import (une fois par liste, à la main)
      Actions → Radar des communs → Run workflow, champ « liste » = liste-osa
        collecte.py --import-liste liste-osa
          connecteur_liste : lire le README → entrées → résoudre le dépôt
                             → interroger la forge → candidats
          notation (+ bonus_curation), dédoublonnage, mémoire   [inchangés]
          pas de plafond par relecteur
          écrit _data/radar/AAAA-MM-JJ-import-liste-osa.yml   (même si 0 fiche)
        resume.py → PR « Radar : import de la liste … », labels radar + radar-import
      fusion → fiches publiées, mémoire sur main, lot d'import présent sur main

    passage quotidien (inchangé pour les autres sources)
      liste sans lot d'import sur main → ignorée, une ligne dans le journal
      liste importée → connecteur_liste ne résout que les URL inconnues
                       de la mémoire → presque toujours 0 appel à la forge
      plafond max_par_relecteur habituel

Un lot d'import compte comme un lot ouvert : aucun passage quotidien ne tourne
tant qu'il attend, ce qui évite deux pull requests en conflit sur
`memoire.json`. Il expire après **14 jours**, au lieu de 3, parce qu'il est plus
long à relire.

## Déclaration dans `sources.yml`

    # ------------------------------------------------------ listes de la communauté
    # Une liste « awesome » curatée à la main. Import initial par le workflow
    # (champ « liste »), puis seules ses nouveautés remontent. Voir LISTES.md.
    - id: liste-osa
      type: liste
      url: https://raw.githubusercontent.com/geezacoleman/OpenSourceAgriculture/main/README.md
      nom: OpenSourceAgriculture          # écrit dans le champ `curation` des fiches
      famille: logiciel                   # si aucune section ne correspond
      familles_par_section:               # sous-chaîne d'un titre, du plus profond au plus haut
        dataset: donnees
        foundation model: modele
        hardware: materiel
        in-field: materiel
      famille_fixe: true
      relecteur: [ionosphere, bertrandgorge]

    - id: liste-awesome-agriculture
      type: liste
      url: https://raw.githubusercontent.com/brycejohnston/awesome-agriculture/master/README.md
      nom: awesome-agriculture
      famille: logiciel
      familles_par_section: { hardware: materiel, robot: materiel, data: donnees }
      relecteur: [ionosphere, bertrandgorge]

    - id: liste-cropsteering
      type: liste
      actif: false                        # à calibrer en --blanc avant l'import
      url: https://raw.githubusercontent.com/Intergalactic-XYZ/awesome-cropsteering/main/README.md
      nom: awesome-cropsteering
      famille: logiciel
      relecteur: [ionosphere, bertrandgorge]

Dans `reglages` : `bonus_curation: 10`.

## Composants

### 1. Lecture du Markdown : `lire_liste(texte) -> list[Entree]`

`Entree` : `titre`, `url`, `description`, `sections` (pile des titres
englobants). La fonction est pure, testable sur un README enregistré, et ne
fait aucun appel réseau.

- Titres `#`… `######` : ils tiennent à jour la pile des sections. Les
  sections *Contents*, *Table of contents*, *Contributing*, *License*,
  *Related lists* et *Other awesome lists* sont ignorées.
- Lignes de tableau : la ligne d'en-tête donne l'index de la colonne
  *Description* ; à défaut, on prend la dernière cellule non vide. Le séparateur
  `|---|` et les lignes sans lien sont sautés.
- Puces `- [Nom](url) - description` (séparateur `-`, `–`, `—` ou `:`).
- Le **premier** lien de la ligne nomme l'entrée. On tolère `((url))`, faute
  vue dans OpenSourceAgriculture. On écarte les ancres `#…`, les `mailto:` et
  les badges `[![…](…)](…)`.
- Le Markdown est retiré des descriptions : liens réduits à leur texte,
  `*italique*` supprimé.

### 2. Résolution du dépôt : `resoudre(url) -> Depot | None`

`Depot` : `url`, `licence`, `date_maj`, `techno`, `popularite`,
`description`, `mots_cles`. Les règles, dans l'ordre :

| URL de la liste | Dépôt interrogé |
|---|---|
| `github.com/o/r/…` | `GET /repos/o/r` (on retire `tree/…`, `blob/…`, `.git`, `#…`) |
| `github.com/o` (compte seul) | `GET /users/o/repos` : un seul dépôt non fork → celui-là, sinon rien |
| `o.github.io/r/…` | `github.com/o/r` |
| `gitlab.*/g/p/…` | `GET /api/v4/projects/g%2Fp?license=true` (gitlab.com et instances publiques) |
| `huggingface.co/datasets/o/n`, `huggingface.co/o/n` | API Hugging Face, `cardData.license`, `lastModified` |
| `zenodo.org/record(s)/N` | `GET /api/records/N`, `metadata.license.id` |
| autre site | une page lue : si elle pointe vers **un seul** dépôt GitHub ou GitLab, il est suivi ; sinon rien |

Réglage de source `suivre_les_sites: false` pour couper la dernière règle.
Aucun dépôt trouvé → `licence` vide → écarté par la règle actuelle
(`sans_licence`, réexaminé après 90 jours). Un dépôt archivé est **gardé** : un
jeu de données fini n'est pas mort, la note d'activité s'en charge.

### 3. Connecteur : `connecteur_liste(src) -> list[Candidat]`

1. Télécharger `src["url"]` et le passer à `lire_liste`. **Zéro entrée → lever
   une exception** « aucune entrée lue, format changé ? ». `main()` la range
   déjà dans `pannes`, qui s'affiche dans la PR et dans l'issue d'échec : le
   radar continue.
2. Pré-filtre, pour économiser la forge : sauter une entrée dont l'URL figure
   dans `urls_du_site()`, ou dont l'identifiant en mémoire est `propose`, ou
   a été examiné il y a moins de `quarantaine_jours`. La mémoire n'est que
   lue ; `main()` garde la décision finale.
3. `resoudre()` pour le reste, avec `pause_entre_requetes` (2,1 s avec jeton).
4. Candidat :
   - `titre` : le nom dans la liste (plus parlant que `o/r`) ;
   - `url` : l'URL de la liste ;
   - `depot` : l'URL du dépôt, s'il est différent de `url` ;
   - `description` : celle de la liste, ou à défaut celle du dépôt ;
   - `mots_cles` : section la plus proche + topics du dépôt ;
   - `famille` : via `familles_par_section`, sinon `src.famille` ;
   - `curation` : `src.nom`.

### 4. Retouches génériques de `collecte.py`

- `Candidat` gagne deux champs : `depot: str = ""` et `curation: str = ""`.
  `depot` est déjà lu par `communs.html` et `radar-fiches.html` pour les
  fiches de la communauté : rien à changer côté site.
- `noter()` : si `c.curation`, alors `+ bonus_curation` et la raison
  « retenu par la liste <nom> ». Le montant est lu dans `reglages` et passé à
  `noter()`.
- Dédoublonnage de `main()` sur `url` **et** `depot`, contre le site et contre
  la mémoire. Sans cela, un dépôt déjà proposé par `github-agri` reviendrait
  sous l'URL de son site vitrine.
- `nouveau()` : un `relecteur` en liste est joint par des espaces. Le champ du
  lot reste une chaîne, les anciens lots restent lisibles, et le plafond compte
  la paire comme un seul groupe.

### 5. Mode d'import : `collecte.py --import-liste <id>`

- Il implique `--source <id>`, refuse une source dont le `type` n'est pas
  `liste`, et lève le plafond par relecteur.
- Il écrit `_data/radar/AAAA-MM-JJ-import-<id>.yml` avec, en plus,
  `liste: <nom>`, et l'écrit même vide pour que la fusion marque l'import.
  Le préfixe de date garde l'ordre chronologique de `/fr/actualites/`, qui
  parcourt `site.data.radar` par clé.
- `--blanc` fonctionne comme d'habitude (dans `_radar/brouillon/`, mémoire
  intacte).
- Passage quotidien : `import_fait(id)` = un fichier
  `*-import-<id>.yml` existe dans `fichiers_lots()`. Sinon la source est
  sautée, sans panne.

### 6. `resume.py`

- Les mentions de relecteurs découpent `relecteur` sur les espaces.
- Lot d'import (champ `liste`) : titre « Import de la liste <nom> », fiches
  groupées par famille puis par section, et un avertissement adapté (« expire
  sous 14 jours » au lieu de « 3 jours »).

### 7. Workflow `radar.yml`

- `workflow_dispatch` gagne une entrée `liste` (texte, facultative).
- Étape d'expiration : les PR `radar-import` expirent après 14 jours, les
  autres après 3 ; les deux comptent comme lot ouvert.
- Étape Collecte : `--import-liste "$LISTE"` si l'entrée est remplie. L'étape
  de PR ajoute alors le label `radar-import`, prend le titre
  « Radar : import de la liste … (N fiches) » et la branche
  `radar/import-<id>`.
- Un import retenant 0 fiche ouvre quand même sa PR (lot vide + mémoire) : la
  condition `retenus != '0'` ne vaut pas en mode import.

### 8. Site

`/fr/actualites/` : un lot d'import s'intitule « Import de la liste <nom> »
au lieu de « Radar du … ». Un lot sans aucune fiche `publier: true` n'affiche
pas d'article. Rien d'autre ne change : les fiches entrent dans l'annuaire,
dans `communs.json` (avec `source`) et dans le socle du chatbot,
comme celles des autres lots.

## Budget d'appels

| Passage | GitHub REST | Autres |
|---|---|---|
| Import OpenSourceAgriculture | ~30 | ~10 HF / Zenodo, ~25 pages lues |
| Import awesome-agriculture | ~55 | quelques pages |
| Import awesome-cropsteering | ~90 | — |
| Quotidien après import | 3 lectures de README + nouveautés | ≈ 0 |

C'est largement sous les 1 000 requêtes par heure du `GITHUB_TOKEN` des
Actions. Avec trois imports, un par pull request, il n'y a jamais plus de ~100
appels dans une même exécution.

## Vérification

1. `lire_liste` sur les trois README enregistrés dans `_radar/brouillon/` :
   ≥ 50 entrées pour OpenSourceAgriculture, ≥ 70 pour awesome-agriculture ;
   aucune ancre, aucun badge.
2. `collecte.py --import-liste liste-osa --blanc` : zéro fiche sans licence
   ouverte ; OWL, AgML, FarmBot et AgOpenGPS comptés « déjà sur le site ».
3. Copier le lot d'import de `brouillon/` vers `_data/radar/`, remplir la
   mémoire, relancer le passage quotidien : 0 candidat. Ajouter une ligne au
   README enregistré : 1 candidat.
4. `resume.py --sans-ia` sur le lot d'import : les mentions contiennent
   @ionosphere et @bertrandgorge.
5. `bundle exec rake test` : `/fr/actualites/` et `/fr/communs/` se
   construisent avec un lot d'import.

## Ordre de réalisation

1. `lire_liste` + `resoudre`, testés en local sans toucher au reste.
2. `Candidat.depot` / `curation`, bonus, dédoublonnage sur `depot`,
   relecteurs multiples.
3. `connecteur_liste`, `--import-liste`, `import_fait`.
4. `resume.py`, puis le workflow, puis la page actualités.
5. Mettre à jour `_radar/README.md` (section « Sources ») et le paragraphe
   Radar du `CLAUDE.md`.
6. Import réel d'OpenSourceAgriculture, puis d'awesome-agriculture ; calibrer
   cropsteering en `--blanc`.

---

# Réalisation

Faite le 2026-09-26 (`collecte.py`, `resume.py`, `sources.yml`, `radar.yml`,
`docs/fr/actualites.html`, `_radar/README.md`). Rien n'est encore importé.

## Mesures en `--blanc`

| Liste | Entrées | Déjà sur le site | Sans licence ouverte | Sous le seuil | Proposées |
|---|---|---|---|---|---|
| OpenSourceAgriculture | 63 | 5 (3 par l'URL, 2 par le dépôt) | 44 | 4 | **10** |
| awesome-agriculture | 75 | 1 | 40 | 2 | **19** (22 avant les correctifs ci-dessous) |

Dans une copie jetable du dépôt, l'import réel suivi d'un passage quotidien sur
la liste inchangée donne 0 candidat, pour 2 appels à la forge : les 2 entrées
dont seul le dépôt est dans l'annuaire, rejetées sans être mémorisées. Une
ligne ajoutée à la liste (OpenFarm, MIT) remonte avec une note de 92, dont le
bonus. Un second import de la même liste est refusé.

## Écarts à la conception, dictés par les essais

- **Le dépôt cité par un site doit porter son nom.** Sans ce garde-fou,
  Mendeley menait à `newrelic/newrelic-browser-agent` et le forum d'AgOpenGPS
  à `discourse/discourse` : des scripts tiers embarqués dans les pages.
  `apparente()` exige qu'un mot du titre, ou du nom d'hôte (hors `discourse`,
  `forum`, `docs`…), figure dans le propriétaire ou le nom du dépôt.
- **Ni site web ni documentation.** QGIS menait à `qgis/QGIS-Website`, sous
  MIT alors que le logiciel est sous GPL. Les dépôts en `-website`, `-site`,
  `-docs` ou `.github.io` ne sont plus suivis depuis un site.
- **Les listes citées par une liste sont écartées** (« Awesome GIS »,
  « Awesome Sentinel ») : ce sont des lectures, pas des communs.
- **Les ancres sont retirées des URL** (`…/record/7535814#.ZC3um3ZByUk`), pour
  que la mémoire reconnaisse le projet.
- **`communs.json` ne gagne pas de clé `depot`** : ce fichier est un contrat
  public, et le dépôt n'y était pas pour les fiches de la communauté non plus.

## Reste à faire

1. Fusionner ce travail, puis lancer l'import d'OpenSourceAgriculture depuis
   Actions (champ « liste » = `liste-osa`), le relire et le fusionner.
2. Même chose pour `liste-awesome-agriculture`. L'import reste bloqué tant
   qu'un lot du jour est ouvert, et inversement.
3. Calibrer `liste-cropsteering` en `--blanc` avant de l'activer. Sa section
   *Reading* (guides) n'apporte que du bruit : il faudra peut-être ajouter à
   la source une liste de sections à ignorer.

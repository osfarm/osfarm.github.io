# Radar des communs agricoles

Veille quotidienne sur les logiciels, matériels, données et modèles agricoles
publiés sous licence ouverte. Le radar propose, les relecteurs valident, la
fusion publie. Tout vit dans ce dépôt, sans serveur ni second projet.

## Ce que le radar ajoute au site

    _radar/                       scripts, sources et mémoire (Jekyll ignore ce dossier)
    _data/radar/AAAA-MM-JJ.yml    un fichier par lot : c'est ce que le site affiche
    _data/radar/communaute.yml    projets choisis par la communauté, tenus à la main
    _includes/radar-fiches.html   rassemble les fiches publiées de ce dossier
    _includes/communs-proposition.html  « proposer un projet » (FR et EN)
    assets/js/communs-proposition.js    son envoi au webhook n8n
    docs/fr/communs.html          /fr/communs/    annuaire filtrable (lots et communauté)
    docs/fr/actualites.html       /fr/actualites/ un article par lot publié
    data/communs.json, .csv       /data/communs.* le catalogue en données ouvertes
    .github/workflows/radar.yml   le passage quotidien

Aucun script ne publie : les pages sont calculées par Jekyll à partir de
`_data/radar/`. Un lot fusionné est en ligne au build GitHub Pages suivant.

## Fonctionnement quotidien

    05 h UTC, du lundi au vendredi (.github/workflows/radar.yml)
      1. un lot déjà ouvert depuis plus de 3 jours est fermé ; s'il en reste un
         en relecture, le radar s'arrête là (un seul lot à la fois)
      2. collecte.py interroge les sources, écarte ce qui n'a pas de licence
         ouverte, note le reste et écrit _data/radar/AAAA-MM-JJ.yml
      3. resume.py fait rédiger deux phrases par fiche (Mistral) et prépare
         le texte de la pull request
      4. une pull request « Radar : N fiche(s) à relire » est ouverte

    relecture, 3 minutes
      dans « Files changed », éditer le lot : passer à `publier: false` ce qui
      ne doit pas sortir, corriger un résumé si besoin

    fusion
      les fiches restantes apparaissent dans l'annuaire, le fil d'actualités et
      les exports

Un lot fermé sans fusion ne laisse rien derrière lui : sa mémoire n'arrive pas
sur `main`, donc ses projets reviennent dans un lot suivant.

## Installation, une seule fois

1. **Autoriser les Actions à ouvrir des pull requests** : Settings → Actions →
   General → « Allow GitHub Actions to create and approve pull requests ».
   Sans cela, la dernière étape du workflow échoue.
2. **Secrets facultatifs** (Settings → Secrets and variables → Actions) :

   | Secret | Rôle | Sans lui |
   |---|---|---|
   | `MISTRAL_API_KEY` | rédaction des résumés en français | la description d'origine est gardée |
   | `OSHWA_TOKEN` | annuaire du matériel certifié OSHWA | la source est ignorée |

3. **Relecteurs** : renseigner `relecteur` (identifiant GitHub) dans
   `_radar/sources.yml` pour les familles qui n'en ont pas encore. Ils sont
   mentionnés dans chaque pull request.
4. Lancer un premier passage à la main : Actions → Radar des communs → Run workflow.

## En local

    pip install -r _radar/requirements.txt
    GITHUB_TOKEN=$(gh auth token) python _radar/collecte.py --blanc
    python _radar/resume.py --sans-ia        # traite le lot le plus récent
    python _radar/diffusion.py               # brouillon de newsletter, 7 derniers jours
    python _radar/diffusion.py --format reseaux

`--blanc` écrit le lot dans `_radar/brouillon/` (ignoré par git) et ne touche
pas à la mémoire : on peut relancer autant qu'on veut pendant le calibrage.
Sans `GITHUB_TOKEN`, la recherche GitHub est bridée à 10 requêtes par minute et
le script ralentit en conséquence.

## Réglages

`_radar/sources.yml` : une source par bloc, avec les réglages en tête :

- `seuil_score` (55) : monter à 65 si les lots sont trop bruyants, descendre à 45
  si les fiches intéressantes sont rares ;
- `max_par_relecteur` (8) : plafond par lot ; le surplus revient au lot suivant ;
- `filtres.etoiles_min` : le plus efficace contre les dépôts GitHub vides ;
- `famille_fixe: true` sur une source : le modèle ne peut plus reclasser ses
  fiches. Activé pour les sources de matériel, que le modèle a tendance à
  ranger en « logiciel » dès qu'un dépôt contient du code.

Chaque requête GitHub doit viser juste : un mot seul ramène ses homonymes
(« orchard » ramenait surtout le CMS OrchardCore, d'où son retrait). Un faux
positif isolé n'est pas grave, le modèle le marque hors sujet et le passe à
`publier: false`, mais il consomme une place du plafond par relecteur.

Le vocabulaire agricole, les faux amis (« yield farming », « server farm », les
jeux vidéo) et la liste des licences acceptées sont en tête de `collecte.py`.
Les projets dont l'URL figure déjà dans un fichier `_data/*.yml` du site ou
dans `_data/radar/communaute.yml` (url, dépôt ou démo) ne sont jamais proposés.
`fichiers_lots()` (dans `collecte.py`) écarte ce dernier fichier : ce n'est pas
un lot, et ni `resume.py` ni `diffusion.py` ne le traitent.

## L'autre porte d'entrée : le formulaire de proposition

Le radar cherche ; la communauté propose aussi. Le formulaire « proposer un
projet », en bas de `/fr/communs/` et de `/community/`, poste sur le webhook
n8n déclaré dans `meta.webhook_proposition` de `communaute.yml`. Le workflow
n8n **Annuaire — proposition de projet** :

1. écarte ce qui est déjà répertorié — il compare le lien aux fiches publiées
   (`/data/communs.json`, lots du radar compris) et au `communaute.yml` de
   `main`, à la casse, au « www. », au « .git » et à la barre finale près ;
2. complète les champs manquants — licence SPDX, technologie, mots-clés et
   dernière activité viennent de l'API du dépôt quand le projet est sur
   GitHub ; hors GitHub, la fiche part avec ce que donne le formulaire ;
3. écrit la fiche à sa place alphabétique dans `candidats` sur une branche
   `annuaire/<slug>` et **ouvre la pull request**, avec sa liste de
   vérification. Le slug vient du titre : un second envoi du même projet
   retombe sur la même branche et reçoit « déjà proposé » au lieu d'une
   deuxième pull request.

La relecture reste la fusion de cette pull request : le formulaire ne publie
rien, exactement comme le radar. `resume` et `interet` sont à relire en
priorité — une proposition en anglais arrive sans résumé français plutôt
qu'avec un résumé inventé. Les propositions sont journalisées dans la table
n8n `annuaire_propositions` ; le courriel du proposant n'apparaît jamais dans
la pull request, le dépôt étant public.

## Ce que le modèle rédige, et ses limites

`resume.py` envoie au modèle le titre, la description, la licence et les
mots-clés de chaque fiche, rien d'autre. La consigne (`CONSIGNE`, en tête du
script) lui interdit donc d'affirmer ce que ces champs ne disent pas : usage,
popularité, public, pays, partenaires. Au premier lot, avant ce resserrement,
il avait écrit de farmOS qu'il était « largement utilisé dans la communauté
agricole francophone ». Au deuxième lot, il plaquait encore « pour les acteurs
francophones » sur des projets qui n'en disent rien, par écho à la consigne,
qui ne mentionne plus la francophonie. Au troisième, il illustrait l'intérêt
de tâches absentes du texte (FarmBot « pour le désherbage ou la récolte ») :
la consigne interdit désormais ces exemples. La ligne « intérêt » reste celle à
relire en priorité.

Il décide aussi `pertinence` (« non » écarte la fiche par défaut) et peut
changer la `famille`, sauf pour les sources en `famille_fixe`. Une fiche sans
résumé est aussi écartée par défaut, quelle que soit sa pertinence : la page
afficherait sinon la description brute, souvent en anglais et tronquée.

## Mémoire

- `_radar/memoire.json` : chaque projet examiné et son statut (`propose`,
  `quarantaine` sous le seuil, `sans_licence`). Les deux derniers sont
  réexaminés après `quarantaine_jours`.
- `_radar/resumes.json` : les résumés déjà rédigés par le modèle, pour ne pas
  payer deux fois le même appel.

Les deux fichiers sont mis à jour dans la pull request du lot, jamais
directement sur `main`.

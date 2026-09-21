# Annuaire des communs — restructuration du modèle de fiche

Conception du 21/09/2026, en réponse au §2.5 du rapport consolidé : *« un dépôt,
une famille de produits, une entreprise, un jeu de données et une infrastructure
peuvent occuper le même niveau sans relation explicite entre eux »*.

Jekyll ignore ce dossier (préfixe `_`), comme `_radar/`, `_catalogue/` et
`_chatbot/`.

## La décision, en une ligne

**`famille` ne bouge pas. Deux champs s'ajoutent : `type` et `partie_de`.**

C'est ce qui permet à toute la restructuration de se faire **sans toucher au
radar, ni à la consigne du modèle, ni au workflow n8n, ni au contrat de
`/data/communs.json`**.

## Pourquoi ainsi — les deux questions tranchées

### Q2 d'abord : ajouter plutôt que renommer

`/data/communs.json` et `.csv` sont annoncés sur le site comme des communs
téléchargeables. Des tiers peuvent déjà les consommer, et nous n'avons aucun
moyen de le savoir. **Renommer ou recycler `famille` casserait un contrat
public sans avertissement.**

Ajouter des champs, au contraire, est invisible pour un consommateur existant :
il lit les clés qu'il connaît et ignore les autres. `famille` devient un axe
d'affichage hérité, appelé à s'effacer quand les consommateurs auront migré —
pas avant, et pas par surprise.

**Effet de bord décisif** : puisque `famille` garde ses quatre valeurs, le radar
(`FAMILLES` dans `collecte.py`, la consigne de `resume.py`, le tri de
`diffusion.py`) et le nœud de validation du workflow n8n restent **littéralement
inchangés**. Les deux points aveugles relevés au cadrage — une consigne de
modèle et un workflow hors dépôt, qu'aucun test ne rattrape — sortent du
périmètre de la phase 1.

### Q1 : une typologie de rôle, pas de nature

`famille` répond déjà à « quelle sorte d'artefact ? » (logiciel, matériel,
données, modèle). Lui superposer projet/composant/données/service dupliquerait
la moitié des valeurs.

`type` répond donc à une autre question : **« quel rôle cet objet joue-t-il
dans l'écosystème ? »** Les deux axes sont orthogonaux et se lisent ensemble :
*FarmBot est un `materiel` de type `ecosysteme`* ; *ISOBUS est un `donnees` de
type `standard`*.

Vocabulaire retenu, six valeurs :

| `type` | Sens | Mesuré sur les 110 fiches |
|---|---|---|
| `projet` | autonome, s'installe ou s'utilise tel quel — **défaut** | l'essentiel |
| `ecosysteme` | regroupe des composants publiés séparément | FarmBot, FIWARE, Frappe |
| `composant` | fait partie d'un autre, exige `partie_de` | ~9 indices textuels |
| `standard` | une norme ou un vocabulaire, pas une implémentation | ~6, aujourd'hui inclassables |
| `service` | hébergé par un tiers, ne s'installe pas | Météo France, IGN, data.gouv.fr |
| `besoin` | manque identifié, sans implémentation connue | nouveau — voir plus bas |

`standard` est la valeur qui justifie à elle seule le chantier : SAREF4AGRI,
ISOBUS, MIAPPE ne sont ni logiciels, ni matériels, ni données, ni modèles. Ils
n'ont aujourd'hui aucune place honnête.

## Modèle de données

### Ce qui s'ajoute à une fiche

```yaml
- id: projet-farmbot
  titre: FarmBot
  famille: materiel          # inchangé
  type: ecosysteme           # nouveau, défaut « projet » si absent
  # …

- id: projet-farmbot-os
  titre: FarmBot OS
  famille: logiciel
  type: composant
  partie_de: projet-farmbot  # nouveau, l'id d'une fiche de ce même annuaire
```

**Une seule direction de lien.** Le composant désigne son parent ; l'écosystème
ne liste pas ses enfants. Les enfants se dérivent au rendu
(`where: "partie_de", f.id`). Pas de double écriture, donc pas de
désynchronisation possible — c'est le défaut classique des relations
bidirectionnelles tenues à la main.

### Règles de cohérence

1. `type: composant` **exige** `partie_de` renseigné et pointant vers une fiche
   existante. Sans quoi le composant devient orphelin et invisible.
2. `partie_de` ne se met que sur un `composant`. Un `projet` qui dépend d'un
   autre n'est pas un composant : c'est une dépendance, hors périmètre ici.
3. Un `ecosysteme` sans aucun composant est une erreur de saisie, pas un
   écosystème.
4. Pas de hiérarchie à plus d'un niveau. Un composant de composant se rattache
   à l'écosystème racine. La profondeur n'apporte rien et complique tout.

### Export public

`/data/communs.json` gagne trois clés, **additives** :

```json
{ "type": "composant", "partie_de": "projet-farmbot", "composants": [] }
```

`composants` est calculé au build pour les écosystèmes, vide ailleurs. Un
consommateur écrit avant le changement lit exactement les mêmes clés qu'avant.
`communs.csv` gagne les colonnes `type` et `partie_de` **en fin de ligne** :
un lecteur positionnel n'est pas décalé.

## Les fiches « besoin non couvert »

Elles vivent dans **`_data/besoins.yml`**, et non dans `_data/radar/`.

C'est un choix de conception, pas de rangement : `fichiers_lots()` dans
`collecte.py` prend tout `_data/radar/*.yml` sauf `communaute.yml`. Un fichier
de besoins posé là serait traité comme un lot du radar. À l'inverse,
`_data/besoins.yml` reste scanné par `urls_du_site()` — donc le radar ne
proposera pas une ressource qu'on y aurait citée.

```yaml
- id: besoin-incubateur-ouvert
  titre: Contrôleur d'incubateur ouvert
  famille: materiel
  type: besoin
  categorie: Élevage
  resume: Aucun projet publié sous licence ouverte ne couvre le pilotage
    d'une couveuse. Identifié dans l'inventaire de septembre 2026.
  interet: Permettrait de documenter et reproduire une couveuse sans
    dépendre d'un automate propriétaire.
  propose_le: '2026-09-21'
  source: inventaire-2026-09
```

Elles se distinguent visuellement des communs et ne proposent pas de lien de
téléchargement, mais un appel à contribution vers `/fr/contact/`.

## Rendu

**Deuxième rangée de filtres sur `/fr/communs/`**, « Nature », à côté de
« Famille », alimentée par `_data/radar/communaute.yml` comme l'est déjà la
liste des familles du formulaire de proposition.

**Sur la carte** : un écosystème affiche « N composants » et les déplie ; un
composant affiche « composant de FarmBot », en lien vers l'ancre du parent ; un
standard porte une étiquette distincte ; un besoin est visuellement à part.

**Le compteur de la page** annonce les communs, sans les besoins — ce sont deux
grandeurs différentes, et les mélanger ferait mentir l'indicateur.

## Le socle de l'assistant

`data/socle.txt` gagne, sur la ligne de chaque fiche, son `type` et, le cas
échéant, `composant de <titre du parent>`. C'est ce qui permettra à l'assistant
de répondre « FarmBot OS fait partie de FarmBot » au lieu de les présenter comme
deux projets sans rapport.

Les besoins entrent dans le socle sous une section propre, avec une consigne :
ne jamais les présenter comme une solution existante.

## Ce qui ne change pas

C'est la partie la plus importante de cette conception.

| Composant | Changement |
|---|---|
| `_radar/collecte.py`, `resume.py`, `diffusion.py` | **aucun** |
| Consigne Mistral du radar | **aucun** |
| Workflow n8n « proposition de projet » | **aucun** |
| Clés existantes de `communs.json` / `.csv` | **aucun** |
| Les 110 fiches actuelles | aucune édition obligatoire |

Le radar continue d'émettre des fiches sans `type` ; elles valent `projet` par
défaut. La restructuration est donc **entièrement rétrocompatible et
progressive** : elle n'oblige à annoter que les fiches qui en ont besoin.

## Migration

Aucun script. Le travail est éditorial et tient en trois passes :

1. **Les vingt fiches du §7.0 du rapport**, qui portent déjà les instructions :
   FarmBot en écosystème, ERPNext rattaché à Frappe, les deux OpenFarm
   distingués, FIWARE relié à ses briques.
2. **Les standards** : ~6 fiches à marquer.
3. **Les services** : data.gouv.fr, Météo France, IGN — ~17 fiches.

Le reste garde le défaut `projet` et n'est pas touché.

## Le tableau de bord — **FAIT le 21/09/2026**

Quatre nombres en haut de `/fr/communs/` : **communs publiés**, **écosystèmes**,
**standards couverts**, **besoins non couverts**. Le dernier est le seul qui ait
vocation à baisser — c'est aussi celui qui dira si l'annuaire sert à quelque
chose.

Une rangée de tuiles, pas un graphique : une poignée de valeurs isolées se lit
en nombres, jamais en barres. Chaque tuile **filtre** — c'est un instrument de
navigation, pas un ornement ; celle des besoins descend à leur section.

**Le total ne porte pas de couleur.** Ce n'est pas une catégorie sœur des trois
autres, c'est leur contenant. Les trois marqueurs reprennent exactement les
teintes des étiquettes de fiche, pour que le clic et la carte qui s'affiche
ensuite se répondent.

### Les teintes ont été calculées, pas choisies

Le premier jeu d'étiquettes livré ce matin — violet `#5b4a8b` pour
« écosystème », bleu `#2c6590` pour « standard » — **échouait** à la
vérification : ΔE 8,9 en vision normale, sous le plancher de 15. Deux teintes
qu'un lecteur sans aucun trouble de la vision distingue mal, et que la
deutéranopie confond tout à fait (ΔE 3,2).

Jeu retenu, qui passe les cinq contrôles sur **toutes** les paires — bande de
clarté, plancher de chroma, séparation sous deutéranopie, protanopie et
tritanopie, contraste sur le fond :

```scss
$type-ecosysteme: #8e2f80;   // magenta
$type-standard:   #1f5fb0;   // bleu
$type-besoin:     #b06000;   // ambre
```

Ne pas les retoucher à l'œil. Le turquoise et le vert-orange ont été essayés et
rejetés : le premier passe sous le plancher de chroma en sRGB à cette clarté, le
second se confond avec le vert OSFarm en deutéranopie.

### Un défaut antérieur, laissé en l'état

La palette des **familles** échoue au même contrôle, et sur la même paire :
`#2c6590` (données) contre `#5b4a8b` (modèles), ΔE 8,9 en vision normale. Elle
teinte la vignette de chacune des 110 cartes — c'est l'axe visuel principal de
l'annuaire.

Elle n'a pas été changée : elle est antérieure, elle engage l'identité visuelle
du site bien au-delà de ce chantier, et la famille reste lisible autrement
(l'icône diffère, et l'étiquette la nomme en toutes lettres). **C'est une
décision d'identité qui revient au bureau**, pas une correction technique. Si
elle est prise, la contrainte est connue : reprendre les quatre teintes
ensemble, et les passer au validateur.

## Le garde-fou de la migration — **FAIT le 21/09/2026**

`_annuaire/verifier.py` applique les six règles de cohérence sur l'export
publié `/_site/data/communs.json`, relations dérivées comprises. Il est appelé
par `rake test`, **et par un workflow de pull request** (`.github/workflows/annuaire.yml`).

Le workflow n'est pas un excès de zèle : `rake test` n'était exécuté nulle part
en intégration continue, et les deux sources de modification de ces fichiers
sont automatiques — les lots du radar et le formulaire « proposer un projet »,
qui ouvrent tous deux des pull requests. Sans lui, le garde-fou n'aurait
protégé que les modifications faites à la main sur un poste de développement.

Ce qu'il rattrape, et que ni Jekyll ni html-proofer ne signalent — la page se
construit, le lien mène simplement nulle part :

| Violation | Vérifiée |
|---|---|
| `partie_de` désignant une fiche absente | ✅ |
| `composant` sans `partie_de` | ✅ |
| `partie_de` sur autre chose qu'un composant | ✅ |
| `type` hors vocabulaire | ✅ |
| `ecosysteme` sans aucun composant | ✅ |
| Hiérarchie à deux niveaux | ✅ |

Les six sont éprouvées par injection de fautes : chacune a été introduite dans
une copie de l'export et détectée. Un contrôle qui ne sait pas dire non ne sert
à rien.

Le vocabulaire est lu dans `_data/radar/communaute.yml` et non recopié dans le
script : c'est la même source de vérité que le site et le formulaire. Aucune
dépendance Python n'est requise, pour que la vérification tourne telle quelle
en intégration continue.

## Risques

| Risque | Traitement |
|---|---|
| ~~`partie_de` pointant vers une fiche disparue~~ | **traité** : `_annuaire/verifier.py`, en local et sur pull request |
| Deux champs voisins (`famille`, `type`) prêtent à confusion | L'en-tête de `communaute.yml` doit dire lequel répond à quoi |
| `famille` a déjà un autre sens dans `_data/catalogue.yml` (A/B/C/D) | Ne pas introduire `type` dans le catalogue ; le mot y reste local |
| Le radar n'émet jamais de `type` | Assumé : c'est un enrichissement humain, pas une détection automatique |

## Vocabulaire — **VALIDÉ le 21/09/2026**

Les six valeurs de `type` sont arrêtées : `projet`, `ecosysteme`, `composant`,
`standard`, `service`, `besoin`. Elles sont déclarées dans
`_data/radar/communaute.yml`, à côté des familles : en ajouter ou en retirer
une reste une ligne de données et une étiquette, jamais une modification de
code.

Le rapport consolidé a été annoté et renvoyé à son auteur avec ces décisions
(`Rapport_consolide_OSFarm_annote_2026-09-21.docx`, six commentaires ancrés).

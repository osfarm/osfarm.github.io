# Rubrique Documentation — exigences

Cadrage du 22/09/2026, à partir de
`Complement_documentation_IA_numerique_agriculture_OSFarm.docx` (31 références,
consultées le 22/09/2026). Jekyll ignore ce dossier (préfixe `_`).

## La décision, en une ligne

**Les publications ne sont pas une famille de l'annuaire : elles ont leur
rubrique, Documentation.**

Le document source le demande (« sans les confondre avec les logiciels, données
et standards de l'annuaire des communs », « ne change pas le décompte de 110
fiches »), et `_annuaire/DESIGN.md` interdit de toucher à `famille` : ses quatre
valeurs sont un contrat public (`/data/communs.{json,csv}`), codé dans
`FAMILLES` du radar, dans la consigne de `resume.py` et dans le nœud de
validation n8n. Une cinquième valeur casserait ces quatre points sans qu'aucun
test ne le signale.

## Objectifs

1. Réunir en un lieu les publications, rapports, ouvrages et portails de veille
   sur l'IA et le numérique agricoles.
2. Donner à chaque référence son statut (rapport, article évalué, prépublication,
   portail vivant) pour que le lecteur sache ce qu'il lit.
3. Permettre à l'assistant de citer ces références.
4. Laisser l'annuaire, son compteur, ses exports, le radar et n8n inchangés.

## Exigences fonctionnelles

**F1 — Pages.** `/fr/documentation/` et `/documentation/`, jumelles polyglot,
entrée « Documentation » dans `fr-header.html` et `header.html`, entre
« Communs » et « Actualités ».

**F2 — Source de vérité.** `_data/publications.yml`, étendu. Les 4 entrées
existantes (ONU, PNUD, FAO) sont reprises au nouveau format, et `/why/`
continue de les afficher (aucune régression sur `docs/{fr,en}/why.html`).

**F3 — Notice.** Chaque entrée porte, d'après le « mode de classement » du
document :

| Champ | Obligatoire | Remarque |
|---|---|---|
| `id` | oui | identifiant stable, sert d'ancre `#pub-<id>` |
| `titre` | oui | dans la langue originale, jamais traduit |
| `auteur` | oui | auteurs ou organisme, sous le nom porté par le document |
| `annee` | oui | ou `continu` pour un portail |
| `nature` | oui | `rapport`, `etude`, `strategie`, `ouvrage`, `dossier`, `article`, `prepublication`, `portail` |
| `groupe` | oui | les 6 rubriques du document : `france`, `europe`, `etats-unis`, `international`, `recherche`, `portails` |
| `langue` | oui | langue du texte : `fr`, `en` |
| `resume` | oui | `{ fr, en }` — résumé du document, traduit pour l'anglais |
| `url` | oui | lien pérenne ; DOI quand il existe |
| `acces` | non | `ouvert`, `formulaire` (gratuit contre formulaire), `notice` (texte non libre) |
| `titre_fr`, `url_fr` | non | version française officielle, montrée sur la page française |
| `pourquoi` | non | `true` : cité aussi sur `/why/` |
| `verifie_le` | oui | date du dernier contrôle du lien |

**F4 — Premier lot.** Les 31 références du document, plus les 3 anciennes
entrées de `/why/` (la quatrième, SOFA 2022, était déjà dans le document) :
34 notices. Après vérification, 4 portails : HAL DigitAg, ARS *Find a
Publication*, OCDE *Innovation and digital in agriculture*, et la page
programme IA de NIFA (sans date de publication). *IA des champs* est un livre
(Éditions France Agricole, 2026), rangé avec les références françaises.

**F5 — Étiquettes visibles.** Une prépublication (AgriBench, AgroBench) porte
l'étiquette « Prépublication arXiv — la version liée n'est pas celle d'une
revue » (AgriBench a été présenté à un atelier d'ECCV 2024, AgroBench annoncé
pour ICCV 2025 : « non évaluée » serait inexact) ; un portail porte
« Portail vivant — source de veille, non publication ». *IA des champs* est
présenté comme ouvrage et parcours de lecture, pas comme commun logiciel.

**F6 — Navigation.** Groupement par zone, dans l'ordre du document ; filtre par
nature. Tri alphabétique par titre dans chaque groupe (règle du CLAUDE.md).
Lien vers la notice originale, jamais de copie du texte intégral.

**F7 — Assistant.** Les notices entrent dans `data/socle.txt`, dans une section
distincte des communs, avec leur URL (qui devient citable) et leur nature, pour
que l'assistant ne présente pas une prépublication comme un résultat établi.

**F8 — Signalement.** Un lien « signaler un lien mort » par notice, vers
`contact@osfarm.org` (pas de nouveau workflow n8n dans ce lot).

## Exigences non fonctionnelles

- **N1 — Contrats intacts.** `data/communs.{json,csv}`, le compteur de 110
  fiches, `_radar/`, `_annuaire/verifier.py` et les workflows n8n ne changent
  pas. Contrôle : diff nul sur ces fichiers, `communs.json` identique avant/après
  build.
- **N2 — Budget du socle.** +34 notices : 68 → 86 Ko, soit ~12 900 → ~16 400 tokens
  (mesuré le 22/09/2026, à débit constant de `ministral-14b`). Le socle
  doit rester complet (le workflow refuse d'interroger le modèle sinon) : vérifier
  sa taille et sa dernière section après build.
- **N3 — Validation.** `bundle exec rake test` passe, html-proofer compris
  (les 31 liens externes sont vérifiés).
- **N4 — Données seules.** Ajouter une publication = éditer
  `_data/publications.yml`, comme pour le catalogue.
- **N5 — Accessibilité et thème.** Mêmes cartes, contrastes et comportement
  mobile que l'annuaire (`annuaire-carte.html` sert de modèle visuel, sans être
  réutilisé tel quel : il est lié à `famille`).

## Récits utilisateur et critères d'acceptation

- *En tant que conseiller agricole, je veux trouver les rapports de référence
  français sur l'IA en agriculture.* → La rubrique ouvre sur le groupe
  « Références françaises » ; le rapport CGAAER 25034 y figure avec année,
  organisme et lien.
- *En tant que lecteur, je veux savoir si un texte a été évalué.* → Les
  2 prépublications et les 4 portails portent leur étiquette ; aucun autre n'en
  porte.
- *En tant que visiteur anglophone.* → `/documentation/` affiche les 34
  références, titres originaux, résumés en anglais.
- *En tant que visiteur de l'assistant.* → « Quel rapport européen sur la
  digitalisation des exploitations ? » renvoie l'enquête JRC 2025 avec son URL
  `publications.jrc.ec.europa.eu/…/JRC141259`.
- *En tant que mainteneur.* → Ajouter une entrée dans le YAML suffit à la
  publier sur les deux pages et dans le socle.

## Hors périmètre

- Un indexeur automatique du flux HAL DigitAg (le portail est lié, pas copié).
- Un workflow n8n de proposition de publication (analogue à « proposer un
  projet »).
- L'ajout des 529 candidats du rapport précédent.
- Toute modification de `famille` ou `type` dans l'annuaire.

## Décisions du 22/09/2026

1. **Publication à la fusion.** Les 31 références paraissent dès la fusion de
   la PR, sans champ `publier` : la relecture éditoriale se fait sur la PR.
2. **Années contrôlées une par une.** Avant import, chaque lien est ouvert et
   l'année retenue est celle de la publication, non celle de la notice
   (ARS 2020, NIFA 2025 à vérifier en priorité) ; `verifie_le` porte la date
   de ce contrôle.
3. **IA des champs** : `https://ia-des-champs.com` (renvoie aujourd'hui en 301
   vers l'hébergeur ; c'est le domaine qui est publié, pas l'adresse de
   l'hébergeur).

## Questions ouvertes

1. **Droits.** Les résumés sont des rédactions OSFarm ; aucun extrait n'est
   repris. À confirmer pour les notices où le résumé colle au texte de l'éditeur.
2. **Actualités.** Faut-il annoncer la rubrique sur `/fr/actualites/` ?

## Vérification du 22/09/2026

Chaque lien a été ouvert (curl, pdftotext, Wayback ou API de l'éditeur quand
le site bloque les robots). Écarts corrigés par rapport au document source :

- **Années** : CGAAER 24053 → 2024 (novembre 2024, mis en ligne en 2026) ;
  CGAAER 25034 → 2025 ; stratégie IA de l'USDA → 2024 (« Issued November 2024 »).
- **Commission européenne** : la page « Unlocking the potential… » est une
  actualité ; le document est l'étude Fraunhofer IESE *AI-enabled
  Decision-Making Support Tools (AI DMST) for Agriculture* (2025).
- **ARS 2020** : c'est un article de *IT Professional* (IEEE), DOI
  10.1109/MITP.2020.2986124 ; la page ARS n'en est que la notice.
- **NIFA** : page programme sans date → portail.
- **Banque mondiale, profils numériques** : les liens vers les 4 rapports ne
  mènent plus aux textes → `acces: notice`, signalé dans le résumé.
- **Banque mondiale, observation de la Terre** : URL `/en/` au lieu de `/pt/`.
- **National AI Report** : auteurs de l'Extension Foundation et de ses
  universités partenaires ; l'UNH Extension n'est que remerciée.
- **IA des champs** : livre *L'IA des champs – Les graines d'un futur possible*
  (H. Pillaud, K. Cailleaux-Breton, D. Joulin, Éditions France Agricole, 2026).
- **ONU DESA** : l'ancienne URL de `/why/` renvoyait vers une page de catégorie
  sans rapport → PDF de la note de novembre 2021.

Sites qui renvoient 403 à tout robot, exclus de html-proofer dans le
`Rakefile` : `www.oecd.org`, `www.usda.gov`, `www.undp.org`.

À surveiller :
- La stratégie IA de l'USDA est un document de l'administration précédente ;
  rien ne garantit qu'il reste en ligne.
- `ia-des-champs.com` redirige vers `ia-des-champs.lovable.app`, dont la
  balise canonical pointe vers `lia-des-champs.lovable.app`, qui répond 404.

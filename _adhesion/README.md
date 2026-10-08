# Adhésion et accompagnement

Pages `/fr/adherer/` et `/join/` : les deux formules d'adhésion, ce que le
Lexicon ouvre aux adhérents, les niveaux d'accompagnement et le formulaire de
demande.

Deux modèles cohabitent sur le site, et la page le dit :

- **le catalogue** (`_catalogue/README.md`) : l'association référence, les
  adhérents opèrent et facturent ;
- **les niveaux d'accompagnement** : l'association organise, vend et facture
  elle-même (décision du bureau, octobre 2026).

## Fichiers

    _data/adhesion.yml              formules, avantages, solutions hébergées, niveaux, adresses
    _includes/adhesion.html         la page, dans les deux langues (lang="fr" | "en")
    _includes/adhesion-prix.html    le prix d'un niveau pour un public
    assets/js/adhesion.js           présélection du niveau et envoi du formulaire
    docs/fr/adherer.html            /fr/adherer/
    docs/en/join.html               /join/

## Gestes courants

| Pour… | Modifier dans `_data/adhesion.yml` | Effet |
|---|---|---|
| Changer une cotisation | `formules[].prix` | Cartes, phrase d'incitation, socle de l'assistant |
| Changer de campagne HelloAsso | `meta.helloasso` | Les deux boutons « Adhérer sur HelloAsso » et le socle |
| Avoir une campagne par formule | `formules[].helloasso` | Le bouton de cette formule seulement |
| Héberger une solution de plus | une entrée dans `hebergees` | Avantage des formules, socle ; avec `fiche`, la mention sur la carte de l'annuaire |
| Changer le prix d'un niveau | `niveaux[].prix` | Les trois prix du niveau |
| Offrir une session à une formule | `formules[].inclus` | Carte de la formule et prix du niveau (« 1 incluse par an, puis… ») |
| Changer le délai d'ouverture des accès | `meta.delai_acces_jours` | La note sous les formules, le socle |

Les textes existent en français et en anglais. `python3 _annuaire/verifier.py`
(appelé par `rake test`) contrôle que `inclus` cite un niveau existant, que
`hebergees[].fiche` est une fiche publiée et que `voir_catalogue` est une
référence du catalogue.

## Formulaire de demande

Il part à `meta.webhook`, aujourd'hui le workflow n8n **Site — formulaire de
contact**, avec la même forme d'envoi que la page Contact : `profil` vaut
`accompagnement`, `demande` le niveau choisi, `precision` la réponse à « Êtes-vous
adhérent ? ». Le courriel arrive à contact@osfarm.org sous l'objet
`[OSFarm contact] Accompagnement : <niveau> (<nom>)`. Les deux formulaires
partagent la limite de cinq envois par heure et par adresse IP.

## Courriel de bienvenue

Le workflow n8n **Adhésion — courriel de bienvenue** (`tJpMcjeoxFwHDUYD`,
en service depuis le 08/10/2026) relève chaque heure, à la minute 7, les
adhésions payées sur HelloAsso et envoie le courriel de bienvenue du bureau.

- **Émetteur** : « Bertrand Gorge » depuis `catalogue@osfarm.org` ; les
  réponses vont à `bertrand.gorge@osfarm.org` ; `bureau@osfarm.org` est en
  copie cachée, ce qui lui sert aussi de signal pour ouvrir les accès.
- **Une fois par adresse, pour toujours** : la table n8n `adhesion_bienvenue`
  (adresse, formule, montant, dates) retient qui a été accueilli. Elle n'est
  écrite qu'après un envoi abouti ; un échec est retenté au passage suivant.
  Un renouvellement ne redéclenche rien.
- **Fenêtre** : le relevé porte sur les 14 derniers jours et ignore ce qui
  précède le réglage `depuis` (la mise en service).
- **Réglages** : le nœud « Réglages » porte `depuis`, `essai_vers`, `plafond`,
  `delai_acces_jours` et `formulaires_exclus`. Une adresse dans `essai_vers` fait partir un seul
  courriel d'essai, sans copie au bureau ni enregistrement ; la vider remet
  le workflow en production. Au-delà de `plafond` envois (20) en un passage,
  rien ne part et l'exécution échoue.
- **Texte** : en tête du nœud « Retenir les nouveaux adhérents ». Le délai
  d'ouverture des accès y est répété : `delai_acces_jours` du nœud
  « Réglages » et `meta.delai_acces_jours` de `_data/adhesion.yml` se changent
  ensemble.
- **Formulaires d'essai** : `formulaires_exclus` écarte les adhésions passées
  sur un formulaire HelloAsso de test (`adhesion-osfarm-2026-dev`).
- **Exécutions** : les exécutions réussies ne sont pas conservées dans n8n,
  car elles contiennent les réponses de HelloAsso. La table
  `adhesion_bienvenue` est la trace des envois.
- **Panne** : si HelloAsso ne répond pas, rien n'est envoyé et le bureau est
  prévenu une fois par jour, à 9 h. Une panne du serveur de courrier ne peut
  pas être signalée par courriel : elle se lit dans les exécutions de n8n.

L'adresse retenue est celle du payeur sur HelloAsso.

## Liste hebdomadaire des adhérents

Le workflow n8n **Adhésion — liste hebdomadaire** (`T51feb38F7WZ62Pj`, en
service depuis le 08/10/2026) envoie chaque jeudi à 11 h (Europe/Paris) la
liste des adhérents : nom, prénom, courriel, date d'adhésion, triée par nom.

- **Destinataire** : `bureau@osfarm.org`, réglable dans le nœud « Réglages »
  (plusieurs adresses séparées par des virgules).
- **Qui est adhérent** : quiconque a une adhésion enregistrée sur HelloAsso
  depuis `periode_mois` mois (12). Une personne qui a renouvelé n'apparaît
  qu'une fois, à la date de sa dernière adhésion. Le nom est celui de
  l'adhérent, l'adresse celle du payeur.
- **Formulaires d'essai** : `formulaires_exclus` écarte les adhésions passées
  sur un formulaire HelloAsso de test (`adhesion-osfarm-2026-dev`).
- **Nouveaux** : les adhésions des sept derniers jours sont sur fond vert et
  comptées dans l'objet du courriel.
- **Rien n'est gardé dans n8n** : la liste est relue sur HelloAsso à chaque
  envoi, et les exécutions réussies ne sont pas conservées.

## Ce qui n'est pas fait

- **Ouverture des accès** (invitation au canal, compte Traccar, clef d'API du
  Lexicon) : à la main, après vérification de l'adhésion sur HelloAsso.
- **Adresse du canal des adhérents** : la page n'en donne pas, l'invitation
  est envoyée après l'adhésion.
- **Mention « hébergé par OSFarm » en anglais** : seule la carte de
  `/fr/communs/` la porte ; `/community/` utilise un autre gabarit.

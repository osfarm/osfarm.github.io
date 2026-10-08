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

## Ce qui n'est pas fait

- **Ouverture des accès** (invitation au canal, compte Traccar, clef d'API du
  Lexicon) : à la main, après vérification de l'adhésion sur HelloAsso.
- **Adresse du canal des adhérents** : la page n'en donne pas, l'invitation
  est envoyée après l'adhésion.
- **Campagne HelloAsso** : `meta.helloasso` pointe sur la campagne 2024 ; à
  vérifier qu'elle est ouverte et qu'elle propose les deux cotisations.
- **Mention « hébergé par OSFarm » en anglais** : seule la carte de
  `/fr/communs/` la porte ; `/community/` utilise un autre gabarit.

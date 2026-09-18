# Catalogue formation & conseil

Formations et missions de conseil autour des outils ouverts de l'agriculture.
Modèle : **l'association référence, les adhérents opèrent**. Service gratuit,
**aucune commission**, adhésion obligatoire pour être référencé.

L'association n'est ni partie au contrat, ni garante, ni rémunérée : elle tient
la liste, oriente la demande et garantit le cadre.

## Ce que le catalogue ajoute au site

    _catalogue/README.md              ce document (Jekyll ignore ce dossier)
    _data/catalogue.yml               modules, missions, tarifs, adresses : la source de vérité
    _data/operateurs.yml              les adhérents qui opèrent, et les partenaires cités
    _includes/catalogue.html          filtres, fiches, missions, formulaire de devis
    _includes/catalogue-candidature.html  charte de l'opérateur et formulaire de candidature
    _includes/catalogue-tarif.html    un prix en euros, séparateur de milliers par langue
    assets/js/catalogue.js            filtres, ancres profondes, envoi aux webhooks
    assets/css/custom.scss            section « Catalogue formation & conseil »
    docs/fr/catalogue.html            /fr/catalogue/
    docs/en/catalogue.html            /catalogue/
    docs/fr/proposer-un-module.html   /fr/proposer-un-module/
    docs/en/propose-a-module.html     /propose-a-module/
    catalogue.json                    /catalogue.json — le flux lu par n8n

Aucun script ne publie : les pages sont calculées par Jekyll à partir de
`_data/`. Une modification fusionnée est en ligne au build GitHub Pages suivant,
soit environ une minute.

## Vie du catalogue au quotidien

Tout se pilote depuis `_data/`. Aucune ligne de code à toucher.

| Geste | Fichier | Effet |
|---|---|---|
| Ajouter un module | `_data/catalogue.yml` → `modules:` | Apparaît dans sa famille |
| Ouvrir un module sans opérateur | `statut: a_pourvoir`, `operateur: null` | Appel à opérateur au lieu du bouton de devis |
| Référencer un opérateur | `_data/operateurs.yml` + `operateur:` du module | Nom affiché, bouton de devis actif |
| Retirer un opérateur | `charte_signee: null`, `operateur: null`, `statut: a_pourvoir` | Le module bascule en « ouvert » |
| Changer la remise adhérent | `meta.remise_adherent_min` | Recalcule tous les tarifs adhérents affichés |
| Déplacer les webhooks | `meta.webhook_demande`, `meta.webhook_candidature` | Les formulaires suivent, le JS n'a rien codé en dur |

**Règle de cohérence** : un module ne montre le bouton « demander un devis » que
si `statut: ouvert` **et** `operateur` renseigné. C'est le garde-fou qui empêche
de promettre une formation que personne n'anime. `adherent`, `charte_signee` et
`qualiopi` dans `_data/operateurs.yml` sont la trace du contrôle fait par le
responsable catalogue : c'est à lui de n'ouvrir un module qu'une fois la charte
signée. Seul `qualiopi: true` s'affiche sur la fiche.

`meta.commission` vaut `0` et n'est pas affiché : il existe pour documenter la
décision du bureau. Le changer impliquerait de revoir la charte, la page
« proposer un module » et le régime fiscal de l'association — donc un vote.

## Chaîne complète d'une demande

```
Visiteur  ──►  /fr/catalogue/  ──►  formulaire  ──►  n8n
                                                      │
                                     lit /catalogue.json pour trouver l'opérateur
                                                      │
                          ┌───────────────────────────┼───────────────────────┐
                          ▼                           ▼                       ▼
                 mail à l'opérateur         ligne dans le CRM        copie catalogue@
                          │
             pas de réponse à J+5 ──► réacheminement vers l'opérateur de secours
                          │
                  mission réalisée ──► J+7 mail d'évaluation (3 questions)
```

Côté association, aucune intervention humaine sauf la revue trimestrielle du
catalogue et l'arbitrage d'un litige.

Si n8n tombe, le site reste en ligne : le formulaire affiche l'adresse de repli
`meta.courriel_repli` et invite à écrire en précisant la référence.

## Les deux webhooks

Hôte suggéré : `https://automation.osfarm.org`, déclaré dans
`_data/catalogue.yml` (`meta.webhook_demande` et `meta.webhook_candidature`) et
lu par `assets/js/catalogue.js` via des attributs `data-`.

### 1. `POST /webhook/catalogue-demande`

Demande de devis ou de mise en relation émise depuis le catalogue.

```json
{
  "ref": "A1",
  "lang": "fr",
  "nom": "Marie Dupont",
  "organisation": "CUMA de l'Anguienne",
  "email": "marie.dupont@example.org",
  "telephone": "+33 6 12 34 56 78",
  "participants": "8",
  "periode": "printemps 2027",
  "message": "Nous voulons intégrer Lexicon dans notre outil de suivi parcellaire.",
  "adherent": "oui",
  "rgpd": "oui",
  "page": "https://www.osfarm.org/fr/catalogue/#module-a1",
  "envoye_le": "2027-01-14T09:22:11.004Z"
}
```

1. **Valider** : `ref` connue, `email` bien formé, `rgpd` = `oui`. Sinon → 400.
2. **Résoudre l'opérateur** : lire `https://www.osfarm.org/catalogue.json` pour
   obtenir `operateur`, `secours[]` et le contact.
3. **Vérifier l'adhésion du demandeur** si `adherent = oui` : appel HelloAsso
   (`GET /v5/organizations/osfarm/items?userSearchKey={email}`). Si non trouvé →
   ajouter au corps du mail la mention « adhésion non retrouvée, tarif public ».
4. **Envoyer** le courriel à l'opérateur, en copie à `catalogue@osfarm.org`.
   Objet : `[OSFarm {{ref}}] Demande de {{organisation}}`.
5. **Écrire une ligne** dans la table `demandes` du CRM (Baserow/NocoDB) avec
   `statut = envoyee`, `echeance = maintenant + meta.delai_reponse_jours`.
6. **Répondre 200** au navigateur.

Relance automatique (workflow séparé, cron quotidien 8 h) :

- demandes `statut = envoyee` dont l'échéance est dépassée → renvoi vers le
  premier opérateur de `secours`, `statut = reroutee`, mail d'information au
  demandeur ;
- demandes `statut = envoyee` depuis plus de 10 jours et sans secours → alerte
  au responsable catalogue ;
- demandes `statut = realisee` depuis 7 jours → mail d'évaluation, trois
  questions notées de 1 à 5, réponses stockées dans `evaluations`.

### 2. `POST /webhook/catalogue-operateur`

Candidature d'un adhérent pour opérer un module.

```json
{
  "type": "candidature_operateur",
  "lang": "fr",
  "structure": "Apuso Libre",
  "contact": "Nicolas de Kermel",
  "email": "contact@example.org",
  "module": "C1",
  "titre_propose": "",
  "message": "Nous formons déjà au RTK libre depuis deux ans.",
  "tarif": "1600",
  "qualiopi": "oui",
  "charte": "oui",
  "rgpd": "oui",
  "envoye_le": "2026-11-03T15:04:00.000Z"
}
```

1. **Vérifier l'adhésion** via l'API HelloAsso sur `email` et sur `structure`.
   - Adhésion trouvée → statut `a_valider`, mail au responsable catalogue.
   - Adhésion absente → mail automatique au candidat (« votre candidature est
     enregistrée, elle sera traitée dès votre adhésion ») avec le lien
     HelloAsso, statut `en_attente_adhesion`, relance à J+14, abandon à J+60.
     Une candidature sans adhésion est mise en attente, jamais rejetée.
2. **Créer une ligne** dans la table `candidatures` du CRM.
3. **Créer une issue** sur `github.com/osfarm/osfarm.github.io` intitulée
   `Catalogue — candidature {{structure}} sur {{module}}`, la charge utile en
   commentaire. C'est ce qui déclenche la mise à jour de `_data/`.
4. **Répondre 200**.

La validation finale reste humaine : le responsable catalogue édite
`_data/operateurs.yml` et `_data/catalogue.yml`, ouvre une pull request, la
fusionne. Environ cinq minutes par candidature.

### Sécurité minimale

- Champ leurre `site_web` : les formulaires abandonnent l'envoi s'il est
  rempli ; refaire le contrôle côté n8n.
- Limiter à 5 requêtes par IP et par heure.
- CORS : n'autoriser que `https://www.osfarm.org` et `https://osfarm.github.io`.
- Ne jamais renvoyer au navigateur autre chose qu'un statut : aucune adresse
  d'opérateur dans la réponse HTTP.
- Identifiants HelloAsso : à créer depuis l'espace association, à stocker dans
  les identifiants n8n, **jamais dans le dépôt**.

## Vérification de l'adhésion

Le référencement est réservé aux adhérents. Deux contrôles :

- **à la candidature** (webhook `catalogue-operateur`), décrit ci-dessus ;
- **au fil de l'eau** : un workflow mensuel compare `_data/operateurs.yml` à la
  liste HelloAsso et signale les adhésions non renouvelées au responsable
  catalogue, qui bascule le module en `a_pourvoir` si besoin.

## Avant la mise en ligne

- [ ] Compléter les champs `url` et `qualiopi` de `_data/operateurs.yml`
- [ ] Faire signer la charte aux premiers opérateurs, renseigner
      `charte_signee`, et passer en `a_pourvoir` les modules dont l'opérateur
      n'a pas signé
- [ ] Confirmer l'adhésion du Réseau Centipède (`adherent: null`)
- [ ] Créer la boîte `catalogue@osfarm.org`
- [ ] Déployer n8n et les deux webhooks, avec CORS restreint, puis vérifier les
      deux formulaires en conditions réelles
- [ ] Ajouter au règlement intérieur la gratuité du service et la règle de
      non-préférence entre opérateurs à compétence égale

## Évolutions prévisibles

- **Pages par module** : convertir `modules:` en collection Jekyll `_modules/`
  pour une URL et un référencement propres par formation. Le YAML actuel est
  déjà au bon format, la conversion est mécanique.
- **Calendrier de sessions** : ajouter un tableau `sessions:` dans
  `catalogue.yml` (date, lieu, module, places) et une vue « prochaines dates ».
- **Affichage des évaluations** : une fois trente évaluations collectées,
  publier la note moyenne par module — c'est ce qui rendra le catalogue crédible
  face à un organisme de formation classique.

# Webhooks n8n — catalogue OSFarm

Deux points d'entrée. Ils sont indépendants du site : si n8n tombe, le site reste en ligne
et le formulaire affiche l'adresse de repli `contact@osfarm.org`.

Hôte suggéré : `https://automation.osfarm.org` (à adapter dans
`assets/js/catalogue.js` et dans `fr/proposer-un-module.md`).

---

## 1. `POST /webhook/catalogue-demande`

Demande de devis ou de mise en relation émise depuis le catalogue.

### Charge utile reçue

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

### Traitement attendu

1. **Valider** : `ref` connue, `email` bien formé, `rgpd` = `oui`. Sinon → 400.
2. **Résoudre l'opérateur** : lire `_data/catalogue.yml` publié sur le site
   (`https://www.osfarm.org/catalogue.json`, voir README § 4) pour obtenir
   `operateur`, `secours[]` et le courriel de contact.
3. **Vérifier l'adhésion du demandeur** si `adherent = oui` : appel HelloAsso
   (`GET /v5/organizations/osfarm/items?userSearchKey={email}`). Si non trouvé →
   ajouter au corps du mail la mention « adhésion non retrouvée, tarif public ».
4. **Envoyer** le courriel à l'opérateur, en copie à `catalogue@osfarm.org`.
   Objet : `[OSFarm {{ref}}] Demande de {{organisation}}`.
5. **Écrire une ligne** dans la table `demandes` du CRM (Baserow/NocoDB) avec
   `statut = envoyee`, `echeance = maintenant + 5 jours ouvrés`.
6. **Répondre 200** au navigateur.

### Relance automatique (workflow séparé, cron quotidien 8h)

- Demandes `statut = envoyee` dont l'échéance est dépassée → renvoi vers le
  premier opérateur de `secours`, `statut = reroutee`, mail d'information au demandeur.
- Demandes `statut = envoyee` depuis plus de 10 jours et sans secours →
  alerte au responsable catalogue.

### Évaluation (workflow séparé, cron quotidien)

- Demandes `statut = realisee` depuis 7 jours → mail au demandeur avec trois
  questions notées de 1 à 5. Réponse stockée dans `evaluations`.

---

## 2. `POST /webhook/catalogue-operateur`

Candidature d'un adhérent pour opérer un module.

### Charge utile reçue

```json
{
  "type": "candidature_operateur",
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

### Traitement attendu

1. **Vérifier l'adhésion** via l'API HelloAsso sur `email` et sur `structure`.
   - Adhésion trouvée → statut `a_valider`, mail au responsable catalogue.
   - Adhésion absente → mail automatique au candidat : « votre candidature est
     enregistrée, elle sera traitée dès votre adhésion », avec le lien HelloAsso.
     Statut `en_attente_adhesion`. Relance à J+14, abandon à J+60.
2. **Créer une ligne** dans la table `candidatures` du CRM.
3. **Créer une issue** sur `github.com/osfarm/osfarm.github.io` intitulée
   `Catalogue — candidature {{structure}} sur {{module}}`, avec la charge utile
   en commentaire. C'est ce qui déclenche la mise à jour de `_data/`.
4. **Répondre 200**.

> La validation finale reste humaine : le responsable catalogue édite
> `_data/operateurs.yml` et `_data/catalogue.yml`, ouvre une pull request,
> la fusionne. GitHub Pages republie le catalogue en une minute.
> Temps réel : environ cinq minutes par candidature.

---

## Sécurité minimale

- Champ leurre `site_web` déjà en place côté formulaire : rejeter toute requête
  où il est renseigné (fait côté client, à refaire côté n8n).
- Limiter à 5 requêtes par IP et par heure dans n8n.
- CORS : n'autoriser que `https://www.osfarm.org` et `https://osfarm.github.io`.
- Ne jamais renvoyer au navigateur autre chose qu'un statut : pas d'adresse
  d'opérateur dans la réponse HTTP.

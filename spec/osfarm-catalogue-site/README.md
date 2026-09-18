# Catalogue formation & conseil — intégration au site osfarm.org

Export prêt à poser dans le dépôt Jekyll du site (`osfarm.github.io`).
Modèle porté : **l'association référence, les adhérents opèrent**, service
gratuit, **aucune commission**, adhésion obligatoire pour être référencé.

---

## 1. Ce que contient l'export

```
_data/catalogue.yml          17 modules + 6 missions, bilingue FR/EN
_data/operateurs.yml         les structures adhérentes qui opèrent
_includes/catalogue.html     le bloc Liquid : filtres, modules, missions, formulaire
assets/css/catalogue.css     styles préfixés .osf- (n'impacte pas le reste du site)
assets/js/catalogue.js       filtres, ancres profondes, envoi de la demande
fr/catalogue.md              page /fr/catalogue/
en/catalogue.md              page /catalogue/
fr/proposer-un-module.md     page /fr/proposer-un-module/ (charte + candidature)
catalogue.json               flux JSON du catalogue, lu par n8n
n8n/webhooks.md              spécification des deux webhooks
```

Aucune dépendance, aucun plugin Jekyll : compatible GitHub Pages tel quel.

---

## 2. Pose en cinq étapes

1. **Copier les fichiers** en respectant l'arborescence. Si les pages du site
   vivent ailleurs que dans `fr/` et `en/`, seuls les `permalink:` comptent —
   déplacez les `.md` où vous voulez.
2. **Vérifier le layout** : les pages déclarent `layout: default`. Remplacez par
   le nom réel de votre layout si nécessaire.
3. **Renseigner l'URL du webhook** dans `assets/js/catalogue.js` (constante
   `WEBHOOK`) et dans le script en bas de `fr/proposer-un-module.md`.
4. **Ajouter les liens de navigation** vers `/fr/catalogue/` et `/catalogue/`
   dans le menu, et un bloc d'appel depuis `/fr/community/`.
5. **Construire et vérifier** :
   `bundle exec jekyll serve` puis ouvrir `/fr/catalogue/` et `/catalogue.json`.

---

## 3. Vie du catalogue au quotidien

Tout se pilote depuis `_data/`. Aucune ligne de code à toucher.

| Geste | Fichier | Effet |
|---|---|---|
| Ajouter un module | `_data/catalogue.yml` → `modules:` | Apparaît dans sa famille |
| Ouvrir un module sans opérateur | `statut: a_pourvoir`, `operateur: null` | Affiche un appel à opérateur au lieu du bouton de devis |
| Référencer un opérateur | `_data/operateurs.yml` + `operateur:` du module | Nom affiché, bouton de devis actif |
| Retirer un opérateur | `charte_signee: null` et `operateur: null` | Le module bascule en « ouvert » |
| Changer la remise adhérent | `meta.remise_adherent_min` | Recalcule tous les tarifs affichés |

**Règle de cohérence** : un module ne montre le bouton « demander un devis » que
si `statut: ouvert` **et** `operateur` renseigné. C'est le garde-fou qui empêche
de promettre une formation que personne n'anime.

`meta.commission` vaut `0` et n'est pas affiché : il existe pour documenter la
décision du bureau. Le changer impliquerait de revoir la charte, la page
`proposer-un-module` et le régime fiscal de l'association — donc un vote.

---

## 4. Chaîne complète d'une demande

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
catalogue et l'arbitrage d'un litige. Voir `n8n/webhooks.md` pour le détail.

---

## 5. Vérification de l'adhésion

Le référencement est réservé aux adhérents. Deux contrôles :

- **À la candidature** (webhook `catalogue-operateur`) : appel HelloAsso sur le
  courriel et la structure. Sans adhésion, la candidature est mise en attente et
  le candidat reçoit le lien d'adhésion — elle n'est pas rejetée.
- **Au fil de l'eau** : un workflow mensuel compare `_data/operateurs.yml` à la
  liste HelloAsso et signale les adhésions non renouvelées au responsable
  catalogue, qui bascule le module en « ouvert » si besoin.

Identifiants HelloAsso : à créer depuis l'espace association, à stocker dans les
identifiants n8n, jamais dans le dépôt.

---

## 6. Ce qu'il reste à faire avant la mise en ligne

- [ ] Compléter les champs `url` et `qualiopi` de `_data/operateurs.yml`
- [ ] Faire signer la charte aux quatre premiers opérateurs (A1, B1, C1, D4)
      et passer les autres modules en `statut: a_pourvoir`
- [ ] Créer la boîte `catalogue@osfarm.org`
- [ ] Déployer n8n et les deux webhooks, avec CORS restreint
- [ ] Ajouter au règlement intérieur la gratuité du service et la règle de
      non-préférence entre opérateurs à compétence égale
- [ ] Ajouter la mention d'information RGPD (finalité, durée 24 mois,
      destinataire, droit de suppression) sur les deux formulaires
- [ ] Traduire `proposer-un-module` en anglais si l'ouverture internationale
      est souhaitée dès 2027

---

## 7. Évolutions prévisibles

- **Pages par module** : convertir `modules:` en collection Jekyll `_modules/`
  pour une URL et un référencement propres par formation. Le YAML actuel est
  déjà au bon format, la conversion est mécanique.
- **Calendrier de sessions** : ajouter un tableau `sessions:` dans
  `catalogue.yml` (date, lieu, module, places) et une vue « prochaines dates ».
- **Affichage des évaluations** : une fois trente évaluations collectées,
  publier la note moyenne par module — c'est ce qui rendra le catalogue crédible
  face à un organisme de formation classique.

# Chatbot de l'annuaire — plan d'implémentation

Plan issu de la conception du 21/09/2026. Ce document est un plan : il ne
décrit pas ce qui existe, mais ce qu'il faut faire et dans quel ordre. Quand la
bulle sera en service, il laissera la place à un `README.md` sur le modèle de
`_radar/` et `_catalogue/`.

Jekyll ignore ce dossier (préfixe `_`), comme `_radar/` et `_catalogue/`.

## Rappel de la décision

Ni base vectorielle, ni workflow d'indexation, ni widget de chat n8n. Le site
publie son corpus au build (`/data/socle.txt`, 9 530 tokens mesurés), n8n le
lit et interroge Mistral en HTTP direct, la bulle est du JavaScript vanille.
Le raisonnement complet est dans l'échange de conception ; l'essentiel tient
en une ligne : **le corpus tient cinq fois dans le contexte, donc il n'y a rien
à indexer.**

## Graphe de dépendances

```
  P0 prérequis  ──┬─────────────────────────────────┐
  (bloquant)      │                                 │
                  ▼                                 ▼
             P1 socle ──► P2 cœur n8n ──► P3 garde-fous ──► P6 mise en service
                  │              │                                  ▲
                  └──► P4 bulle ─┘                                  │
                             P5 secours Cloudflare ─────────────────┘
```

- **P1 et P4 sont parallélisables** une fois P0 franchi : le socle et la bulle
  ne se touchent pas. P4 peut se développer contre un webhook qui renvoie une
  réponse fixe.
- **P5 est indépendant** de P3 et peut attendre : le service fonctionne sans
  secours, il dégrade simplement plus tôt.
- **P0 est bloquant au sens fort** : si les limites du Free mode Mistral sont
  inexploitables, la conception est à revoir. Ne rien construire avant.

---

## P0 — Prérequis, à faire avant toute ligne de code

Aucune de ces tâches n'est du développement, et toutes peuvent invalider la
suite. D'où leur place.

| # | Tâche | Fait quand |
|---|---|---|
| 0.1 | ~~Désactiver l'entraînement chez Mistral~~ **FAIT** (bascules Vibe et API, séparées dans la barre latérale) | ✅ |
| 0.2 | ~~Relever les limites réelles du Free mode~~ **FAIT le 21/09/2026**, voir ci-dessous | ✅ |
| 0.3 | ~~Aucun moyen de paiement enregistré~~ **CONFIRMÉ le 21/09/2026** — le dépassement est impossible, pas surveillé | ✅ |
| 0.4 | ~~Compte Cloudflare Workers AI~~ **FAIT** | ✅ |
| 0.5 | ~~Décider l'endpoint~~ **FAIT : `api.eu.mistral.ai`** — latence plus régulière, mêmes limites, inférence en UE (voir 0.2 bis) | ✅ |
| 0.6 | **Créer la credential Mistral dans n8n** — type « Mistral Cloud API ». L'instance n'a aujourd'hui que SMTP, GitHub et HelloAsso ; la clé du radar vit dans un secret GitHub, pas dans n8n. | La credential apparaît dans `list_credentials` |

**P0 est clos le 21/09/2026**, sauf 0.6 (credential n8n), qui ne conditionne
que l'exécution et non la conception. Le point d'arrêt est levé : Ministral 8B
donne 48 questions/minute à froid et 188 à chaud, très au-delà du besoin.

### 0.2 — Limites relevées le 21/09/2026 (console Mistral)

Les limites sont **par modèle**, et elles réservent une surprise : le modèle
prévu par la conception est le plus mal doté du compte.

| Modèle | Tokens/min | Req/s | q/min à froid | $/question | q/mois dans 10 $ |
|---|---|---|---|---|---|
| `mistral-small-2603` | 20 000 | 1,00 | 1,5 | 0,00207 | 4 822 |
| `mistral-medium-latest` | 20 000 | 1,00 | 1,5 | 0,02119 | 471 |
| `mistral-large-2512` | 250 000 | 1,00 | 19,3 | 0,00676 | 1 478 |
| `ministral-3b-2512` | 1 300 000 | 12,50 | 100,6 | 0,00129 | 7 736 |
| **`ministral-8b-2512`** | 625 000 | 3,13 | **48,4** | 0,00194 | 5 157 |
| `ministral-14b-2512` | 937 500 | 0,50 | 30,0 | 0,00259 | 3 868 |
| `mistral-embed-2312` | 20 000 000 | 1,00 | — | — | — |

Une question coûte **12 925 tokens** au quota — mesuré, pas estimé : l'en-tête
`x-ratelimit-tokens-query-cost` vaut exactement `prompt_tokens` + `completion_tokens`.
La colonne « q/min à froid » suppose donc qu'aucun cache ne porte ; avec cache,
voir 0.2 bis, ces chiffres sont multipliés par 34 et c'est la limite en nombre
de requêtes qui devient contraignante.

**Ces limites sont celles de la zone UE** (`admin.mistral.ai/plateforme/limits?api_zone=eu`,
sélecteur « Région : UE » en haut à droite). Elles valent donc pour
`api.eu.mistral.ai`, l'endpoint retenu en 0.5. Les mesures de 0.2 bis montrent
que la zone mondiale sert les mêmes limites, avec des compteurs distincts.
Workspace concerné : « catalogue ».

**Ce que ça change**

1. **La contrainte n'est pas le budget, c'est le débit.** Les 10 $/mois
   couvrent des milliers de questions chez tous ; 20 000 tokens/minute n'en
   couvrent que deux. Deux visiteurs simultanés sur `mistral-small`, et le
   second reçoit un 429.
2. **Le modèle principal devient `ministral-8b-latest`** : 31 fois plus de
   débit, le même prix d'entrée, quatre fois moins cher en sortie que Small 4.
3. **Repli de qualité : `mistral-large-2512`**, et non `mistral-small`. Large
   dispose de 250 000 tokens/minute, douze fois Small. Si la discipline de
   refus de Ministral 8B ne passe pas le point d'arrêt P2, c'est vers Large
   qu'il faut aller, jamais vers Small.
4. **Le secours Cloudflare (P5) monte en importance** : il ne couvre plus
   seulement « crédits épuisés » mais aussi « 429 à l'instant T », qui est le
   cas fréquent. Même branche, deux motifs.
5. Les embeddings sont à 20 000 000 tokens/minute : le jour où l'indexation
   deviendra utile, le débit ne sera pas le sujet.

**Réserve** : un modèle de 8 milliards de paramètres tient moins bien une
consigne de refus qu'un modèle plus gros. C'est précisément ce que le point
d'arrêt P2 vérifie. Ne pas le contourner.

### 0.2 bis — Mesures réelles, 6 appels sur `ministral-8b-latest`

Le script `_chatbot/mesurer_limites.py` a été passé sur les deux zones. Trois
résultats corrigent des estimations de la conception.

| Mesure | Valeur | Ce que j'avais estimé |
|---|---|---|
| Tokens d'entrée réels | **12 625** | 9 890 — sous-estimé de 28 % |
| Latence, zone UE | **3,9 à 4,4 s** | non estimée |
| Latence, zone mondiale | 3,9 à 8,8 s (8,8 s à froid) | non estimée |
| Coût de quota, 1er appel | **12 925 tokens** | — |
| Coût de quota, appels suivants | **381 tokens** | — |
| Limite réelle | 625 000 tk/min et **188 req/min** | 625 000 et 187,8 |

**1. Le ratio tokens/mot est de 2,0, pas 1,5.** Le socle fait 6 354 mots pour
12 625 tokens : le français, les URL et les lignes structurées coûtent plus
cher que la règle usuelle. Toutes les estimations de tokens faites à partir du
nombre de mots dans ce dépôt sont à corriger du même facteur.

**2. Le cache agit sur le DÉBIT, pas seulement sur la facture.** C'est le
résultat le plus important, et il contredit ce que le script affichait
d'abord. `prompt_tokens` ne bouge pas — d'où la fausse conclusion — mais deux
autres signaux le disent sans ambiguïté :

- `usage.prompt_tokens_details.cached_tokens` : 0 au premier appel,
  **12 544** ensuite ;
- en-tête `x-ratelimit-tokens-query-cost` : **12 925 puis 381**, soit une
  division par 34 de ce que la requête consomme du quota par minute.

Conséquences chiffrées :

| | Sans cache | Avec cache |
|---|---|---|
| Débit | 48 questions/min | **188/min** (bridé par les requêtes) |
| Coût | 0,00194 $ | **~0,00025 $** |
| Questions dans 10 $/mois | 5 157 | **~40 000** |

Le cache est donc à considérer comme acquis en fonctionnement normal, et non
plus comme un bonus incertain : le socle étant identique d'un visiteur à
l'autre, seul le tout premier appel après une reconstruction du site le paie.
Le budget reste dimensionné sans cache par prudence — la TTL n'est toujours pas
documentée — mais la marge est désormais confortable dans les deux cas.

**3. Zone UE retenue — tâche 0.5 close.** Latence plus régulière (3,9–4,4 s
contre 3,9–8,8 s), mêmes limites de débit, inférence en UE pour +10 %. À noter
au passage : les compteurs de quota sont **distincts par zone**, tandis que le
cache, lui, semble partagé — le premier appel sur la zone mondiale a été servi
par le cache constitué sur la zone UE.

**4. Point d'attention pour P4** : 4 secondes de latence se voient. La bulle
doit afficher son état d'attente dès l'envoi (`textes.*.envoi` est déjà prévu
dans `_data/chatbot.yml`). Si cela paraît long à l'usage, la réponse en flux
(`stream: true`) fera tomber le temps perçu à moins d'une seconde, au prix d'un
rendu incrémental côté bulle.

---

## P1 — Le socle (côté site, sans n8n) — **FAIT le 21/09/2026**

**Objectif** : `/data/socle.txt` existe, fait la taille attendue, et se
régénère seul à chaque fusion.

**Résultat mesuré** : 6 354 mots, **~9 530 tokens**, 44 Ko, 123 URL, 85 fiches
et 17 modules. Sous l'estimation de 11 300 et très loin du plafond de 20 000.
Sortie en texte brut, pas de HTML. Aucune régression html-proofer (les 2 échecs
restants sont le lien HTTP d'AgIoT, déjà ignoré par le `Rakefile`).

**Deux pièges Liquid rencontrés, et leur remède** — à connaître avant de
toucher au gabarit :

1. **`.md` aurait été converti en HTML.** Un fichier à front matter dont
   l'extension est `.md` passe par kramdown ; le socle serait sorti en
   paragraphes HTML. D'où `.txt`, qui subit Liquid sans conversion.
2. **`blank` n'est pas reconnu comme littéral** par le Liquid de cette version
   de Jekyll : `{% if x != blank %}` le lit comme une variable indéfinie, et
   laisse passer les chaînes vides — 62 séparateurs orphelins au milieu des
   lignes de fiches. Remède retenu : `{% assign v = x | strip %}` puis
   `{% if v != "" %}`, le filtre ramenant `nil` comme `""` à une chaîne vide.
   Corollaire : `{% if f.techno %}` ne filtre rien, une chaîne vide étant
   vraie en Liquid.

À noter aussi : `_data/operateurs.yml` contient deux entrées pour bziiit (deux
identifiants, un seul nom). Le socle les dédoublonne par nom — le chatbot n'a
que faire des identifiants internes.

| # | Tâche | Fichier |
|---|---|---|
| 1.1 | Gabarit Jekyll du socle : `layout: null`, `permalink: /data/socle.txt`, `sitemap: false` — sur le modèle exact de `data/communs.json`. | `data/socle.txt` |
| 1.2 | Section « consigne » en tête, en dur : règles d'ancrage, de citation, de refus. Reprendre les leçons de `_radar/README.md` (§ « Ce que le modèle rédige, et ses limites »). | idem |
| 1.3 | Section « association » : adhésion, gouvernance, ce qu'OSFarm fait et ne fait pas. Condensé à la main, ~2 000 tokens. | idem |
| 1.4 | Section « catalogue » depuis `_data/catalogue.yml` + `operateurs.yml` : référence, titre, famille, durée, tarif, opérateur, statut. | idem |
| 1.5 | Section « annuaire » : boucle sur `radar-fiches.html`, une ligne courte par fiche — `titre · famille · catégorie · licence · techno · résumé (220 c.) · URL`. | idem |
| 1.6 | Section « où orienter » : contact, catalogue, proposer un projet, forge. | idem |
| 1.7 | `_data/chatbot.yml` : webhook, adresse de repli, textes FR/EN de la bulle. Convention du dépôt : rien de codé en dur côté client. | `_data/chatbot.yml` |

**Validation P1**

```bash
bundle exec jekyll build
wc -w _site/data/socle.txt                 # attendu ~7 500 mots (~11 300 tokens)
head -40 _site/data/socle.txt              # la consigne doit être EN TÊTE
grep -c "https://" _site/data/socle.txt    # une URL par fiche, au moins 100
bundle exec rake test                      # aucune régression html-proofer
```

**Points de vigilance**

- L'ordre des sections n'est pas cosmétique : le préfixe stable doit être en
  tête pour que `prompt_cache_key` serve à quelque chose. La question de
  l'usager va à la fin, côté n8n.
- Si le socle dépasse 20 000 tokens dès maintenant, réduire les résumés avant
  d'aller plus loin — pas après.

---

## P2 + P3 — Cœur du workflow et garde-fous — **CONSTRUIT le 21/09/2026**

Workflow `Chatbot de l'annuaire`, id `eDyK2p0Oa6J2OV6J`, 19 nœuds, **non
activé** tant que le point d'arrêt P2 n'est pas passé.

**Entorse assumée au plan : P2 et P3 ont été faits d'un bloc.** Le plan les
séparait pour que le test de refus ne soit pas brouillé par des bugs de
plafond. Mais cette séparation crée une fenêtre pendant laquelle un endpoint
de modèle public tourne sans protection, ce qu'interdit ENF-2. Les garde-fous
passent donc avant le premier appel au modèle, dès la première version.

**Protection ajoutée en cours de construction, absente du plan initial** :
*jamais de modèle sans socle*. Si `/data/socle.txt` est illisible ou tronqué,
le workflow répond 502 au lieu d'interroger Mistral. Un modèle sans ancrage
inventerait librement — exactement ce qu'EF-2 interdit. Le test porte sur le
marqueur de **fin** du fichier : une page d'erreur passerait un test « non
vide ».

Tables : `catalogue_anti_abus` (partagée, `formulaire: chat`) et `chat_quota`
(`0xpekmXYUVBeZFGN`, une ligne par jour, upsert sur `jour`).

**Reste à faire** : pousser `data/socle.txt` (404 en ligne au moment de la
construction), activer, puis passer le point d'arrêt.

### Le plan d'origine, pour mémoire

## P2 — Le cœur du workflow n8n

**Objectif** : une question posée en `curl` reçoit une réponse ancrée. Pas
encore de garde-fous, pas encore de bulle.

| # | Nœud | Note d'implémentation |
|---|---|---|
| 2.1 | Webhook `POST /webhook/annuaire-chat` | `responseMode: responseNode`, `allowedOrigins` sur les deux domaines |
| 2.2 | HTTP `GET /data/socle.txt` | `responseFormat: text`, `retryOnFail`, timeout 10 s |
| 2.3 | Code « Composer » | socle en tête, historique (3 tours max), question en fin |
| 2.4 | **HTTP → Mistral** | `chat/completions`, **`ministral-8b-latest`** (voir 0.2 : 31× le débit de Small), `temperature: 0.2`, `prompt_cache_key` **fixe et stable**, `max_tokens: 600` |
| 2.5 | Code « Extraire » | texte + `sources[]` reconstruites depuis les URL du socle citées |
| 2.6 | Respond 200 | `{ok, reponse, sources[], statut: "repondu"}` |

**Pourquoi HTTP Request et non le nœud `Mistral Cloud Chat Model`** : vérifié
le 21/09/2026, ce nœud n'expose que `model`, `maxTokens`, `temperature`,
`topP`, `safeMode`, `randomSeed`. Ni `prompt_cache_key` — qui divise le coût
d'entrée par dix — ni l'URL de base, donc pas d'endpoint UE.

**Attention au parseur du SDK n8n** : il rejette des chaînes JavaScript
pourtant valides (guillemets échappés, tableaux de concaténations). Créer les
nœuds Code avec un corps vide puis injecter le code par `update_workflow` /
`setNodeParameter` sur `/jsCode`. C'est le mode opératoire déjà employé pour
*Annuaire — proposition de projet*.

**Validation P2**

```bash
# ancrage : doit citer des fiches réelles, avec leurs URL
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"question":"Quel logiciel libre pour gérer une exploitation ?","lang":"fr"}' \
  https://automation.osfarm.org/webhook/annuaire-chat

# refus : doit refuser et renvoyer vers le contact
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"question":"Quel est le chiffre d affaires d OSFarm ?","lang":"fr"}' \
  https://automation.osfarm.org/webhook/annuaire-chat
```

**Point d'arrêt P2** : tant que le second appel n'invente pas de chiffre, ne
pas continuer. C'est le critère qui protège la crédibilité de l'association ;
tout le reste est réparable après coup.

---

## P3 — Garde-fous d'abus et de coût

**Objectif** : le dépassement devient impossible, pas surveillé.

| # | Tâche | Détail |
|---|---|---|
| 3.1 | Table n8n `chat_quota` | colonnes : `jour` (date), `questions` (number), `tokens_entree` (number) |
| 3.2 | Lecture anti-abus | table `catalogue_anti_abus` existante, `formulaire: chat`, fenêtre 1 h |
| 3.3 | Code « Valider » | leurre, question ≤ 500 caractères, historique tronqué à 3 tours, langue, verdict |
| 3.4 | Switch à 4 sorties | `abus` → 429 · `refus` → 400 · `quota` → 200 « au repos » · `ok` → suite |
| 3.5 | Journalisation | une ligne anti-abus par requête, **avant** l'appel au modèle |
| 3.6 | Compteurs | incrément de `chat_quota` **après** la réponse |
| 3.7 | Plafonds | 5/heure/IP · 150/jour · 2 500/mois — sous le plafond réel de Mistral |

Les plafonds sont **opérationnels**, donc dans n8n ; les textes vus par le
visiteur sont **éditoriaux**, donc dans `_data/chatbot.yml`. C'est la même
séparation que pour le catalogue.

**Validation P3**

```bash
for i in $(seq 1 7); do curl -s -o /dev/null -w "%{http_code} " -X POST \
  -H 'Content-Type: application/json' -d '{"question":"test","lang":"fr"}' \
  https://automation.osfarm.org/webhook/annuaire-chat; done
# attendu : 200 200 200 200 200 429 429
```

Puis forcer `chat_quota.questions` au-dessus du plafond mensuel et vérifier la
réponse « au repos », **sans aucun appel au modèle** (à lire dans l'exécution
n8n, pas à supposer).

---

## P4 — La bulle (parallélisable avec P1)

**Objectif** : une bulle bilingue, accessible, qui dégrade proprement.

| # | Tâche | Fichier |
|---|---|---|
| 4.1 | Balisage de la bulle, paramètre `lang="fr"/"en"` | `_includes/chatbot.html` |
| 4.2 | Inclusion dans les deux pieds de page | `_includes/footer.html`, `fr-footer.html` |
| 4.3 | Ouverture/fermeture, `Échap`, piège de focus, `aria-live` sur les réponses | `assets/js/chatbot.js` |
| 4.4 | Envoi, historique côté navigateur (3 tours), rendu des `sources[]` en liens | idem |
| 4.5 | Replis : `statut: "repos"`, 429, 502, `fetch` en échec → message + liens vers la recherche de `/fr/communs/` et `/fr/contact/` | idem |
| 4.6 | Styles, section « Bulle d'assistance » | `assets/css/custom.scss` |
| 4.7 | Champ leurre `site_web`, comme les autres formulaires | `_includes/chatbot.html` |

**Aucun appel au modèle avant que le visiteur ait ouvert la bulle et écrit.**
C'est ce qui protège le quota des robots, bien plus que le plafond par IP.

**Validation P4**

- Navigation clavier seule : ouvrir, écrire, envoyer, fermer par `Échap`.
- JavaScript désactivé : aucune bulle, aucune régression de page.
- `data-webhook` vidé dans `_data/chatbot.yml` : message de repli, pas d'erreur
  en console.
- Les deux langues, sur `/fr/communs/` et `/community/`.

---

## P5 — Secours Cloudflare (indépendant)

| # | Tâche |
|---|---|
| 5.1 | Credential Cloudflare dans n8n |
| 5.2 | Branche d'erreur après 2.4 : `onError: continueRegularOutput` puis IF sur l'absence de réponse |
| 5.3 | HTTP → Workers AI, `mistral-7b-instruct`, même consigne, même socle |
| 5.4 | `statut: "secours"` dans la réponse ; la bulle annonce le mode dégradé |

Deux motifs déclenchent le secours, pas un seul : **crédits épuisés** (rare) et
**429 de débit** (fréquent — voir 0.2). La branche est la même ; c'est le
second cas qui justifie de ne pas remettre P5 à plus tard.

**Validation P5** : révoquer temporairement la clé Mistral dans n8n et vérifier
que la réponse arrive quand même, marquée `secours`.

---

## P6 — Mise en service

| # | Tâche |
|---|---|
| **6.0** | **REDESCENDRE `PAR_IP_HEURE` DE 30 À 5** dans le nœud « Valider la question ». Monté à 30 le 21/09/2026 pour la mise au point du point d'arrêt P2. |
| 6.1 | Ligne au bloc « Données personnelles » de `docs/fr/contact.html` et `docs/en/contact.html` : finalité, absence de conservation des échanges, destinataire |
| 6.2 | Mention du traitement par `automation.osfarm.org` (le bloc « Formulaires » des mentions légales la couvre déjà — vérifier qu'elle suffit) |
| 6.3 | `_chatbot/README.md` remplace ce plan : ce qui existe, comment l'éditer, où sont les plafonds |
| 6.4 | Deux lignes dans `CLAUDE.md`, sur le modèle des sections radar et catalogue |
| 6.5 | Publier le workflow n8n, puis fusionner la PR du site |
| 6.6 | Observer une semaine : nombre de questions, refus, dégradations, coût réel constaté dans la console Mistral |

---

## Critères d'acceptation (repris du cadrage)

| # | Critère | Phase |
|---|---|---|
| A1 | « Quel logiciel libre pour gérer mon exploitation ? » cite ≥ 2 fiches réelles avec leurs liens | P2 |
| A2 | « Quel est le chiffre d'affaires d'OSFarm ? » → refus explicite + lien contact | P2 |
| A3 | Un projet fusionné la veille est cité correctement | P1 + P2 |
| A4 | 100 requêtes/minute depuis une IP → bloquées **avant** tout appel au modèle | P3 |
| A5 | Quota atteint → message clair, renvoi vers la recherche, **zéro euro** | P3 |
| A6 | Même question en anglais sur `/community/` → réponse en anglais | P1 + P4 |
| A7 | JavaScript désactivé → aucune bulle, aucune régression | P4 |

---

## Risques suivis

| Risque | Phase où il se révèle | Traitement |
|---|---|---|
| ~~Limites du Free mode inexploitables~~ — **levé** : Ministral 8B donne 63 q/min | P0 | Modèle principal changé, repli qualité = Large et non Small |
| Ministral 8B tient mal la consigne de refus | P2 | Point d'arrêt P2 ; repli sur `mistral-large-2512` |
| Pic de trafic simultané → 429 | P5 | Secours Cloudflare sur le même branchement |
| TTL du cache Mistral non documentée | P2 | Budget dimensionné **sans** cache : 5 150 questions/mois suffisent |
| Le modèle invente malgré la consigne | P2 | Point d'arrêt : on ne passe pas P2 |
| Socle plus gros que prévu | P1 | Raccourcir les résumés avant P2 |
| Robots épuisant le quota | P3 + P4 | Appel au modèle seulement après ouverture + saisie |
| Qualité du secours Cloudflare | P5 | Mode annoncé explicitement dans la bulle |

## Ce que ce plan ne couvre pas

- L'indexation vectorielle : hors sujet avant ~100 000 tokens de socle, soit 12
  à 18 mois au rythme du radar. Quand ce jour viendra, seule l'étape 2.2 change.
- Les 4 PDF de `docs/` : écartés au cadrage.
- Toute action engageante depuis la bulle (adhérer, demander un devis,
  proposer un projet) : la bulle oriente vers les formulaires, elle ne les
  remplit pas.

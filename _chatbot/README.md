# Assistant de l'annuaire

Une bulle, en bas à droite de chaque page, qui répond aux questions des
visiteurs à partir du contenu publié du site : l'annuaire des communs, le
catalogue et les pages de l'association. Elle cite ses sources, refuse ce
qu'elle ne sait pas, et ne coûte rien.

Jekyll ignore ce dossier (préfixe `_`), comme `_radar/` et `_catalogue/`.

## La décision, en une ligne

**Ni base vectorielle, ni workflow d'indexation, ni widget de chat tiers.**
Le site publie lui-même son corpus au build, n8n le lit et interroge Mistral,
la bulle est du JavaScript vanille maison.

La raison tient à une mesure : tout le site représente ~14 000 tokens. Une base
vectorielle sert à choisir dans ce qui ne tient pas en contexte ; ici tout
tient, plusieurs fois. Vectoriser aurait coûté un second fournisseur — aucun
nœud d'embeddings Mistral n'existe dans n8n — un index volatil, et une
réindexation à surveiller, pour résoudre un problème que nous n'avons pas.

## Ce que l'assistant ajoute au site

    _chatbot/README.md            ce document
    _chatbot/mesurer_limites.py   mesure débit, latence et cache chez Mistral
    data/socle.txt                /data/socle.txt — le corpus, généré par Jekyll
    _data/chatbot.yml             webhook, textes FR et EN, interrupteur
    _includes/chatbot.html        la bulle, paramètre lang="fr"/"en"
    assets/js/chatbot.js          envoi, rendu, replis, mesure de la bannière
    assets/css/custom.scss        section « Bulle d'assistance »
    _includes/{fr-,}footer.html   une ligne d'inclusion chacun
    docs/{fr,en}/contact.html     une ligne au bloc « Données personnelles »

Côté n8n : workflow **Chatbot de l'annuaire** (`eDyK2p0Oa6J2OV6J`), tables
`chat_quota` et `catalogue_anti_abus` (partagée avec les autres formulaires,
colonne `formulaire` à `chat`).

## Comment ça marche

```
   BUILD (GitHub Pages, à chaque fusion)
   _data/radar/*.yml ─┐
   _data/catalogue.yml├─► Jekyll ──► /data/socle.txt
   _data/*.yml ───────┘                    │
                                           │ lu à chaque question
   EXÉCUTION                               ▼
   ┌──────────────┐  POST   ┌──────────────────────────────────────┐
   │ bulle 💬     │────────►│ n8n — Chatbot de l'annuaire          │
   │              │  JSON   │  1. anti-abus 5/h/IP ──► 429         │
   │              │◄────────│  2. plafonds jour/mois ► « au repos » │
   └──────────────┘  JSON   │  3. socle complet ? ───► 502 sinon    │
          │                 │  4. ministral-14b, zone UE            │
          │ si coupé        │     └─ échec ► ministral-3b (secours) │
          ▼                 │  5. URL vérifiées, compteurs, réponse │
   recherche /fr/communs/   └──────────────────────────────────────┘
   + /fr/contact/
```

**Aucun état de conversation côté serveur.** Le navigateur tient le fil et
renvoie les trois derniers échanges ; n8n les transmet et les oublie. C'est ce
qui permet d'écrire, dans les mentions légales, qu'aucune conversation n'est
conservée.

## Vie quotidienne

Tout se pilote depuis `_data/` et le socle se régénère seul.

| Geste | Où | Effet |
|---|---|---|
| Éteindre l'assistant | `_data/chatbot.yml` → `meta.webhook: ""` | La bulle disparaît du site au build suivant. Aucun code à toucher. |
| Changer un texte de la bulle | `_data/chatbot.yml` → `textes.fr` / `textes.en` | Immédiat au build |
| Changer les règles de réponse | `data/socle.txt`, section CONSIGNE | Le modèle les suit dès le build suivant |
| Ajouter un projet au corpus | rien à faire | Une fiche fusionnée y entre automatiquement |
| Changer les plafonds | n8n, nœud « Valider la question » | `PAR_IP_HEURE`, `PAR_JOUR`, `PAR_MOIS` |
| Changer de modèle | n8n, nœud « Composer la requête » | Lire d'abord « Le choix du modèle » ci-dessous |

Les plafonds sont des réglages d'exploitation, donc dans n8n ; les textes vus
par le visiteur sont éditoriaux, donc dans `_data/`. Même séparation que pour
le catalogue.

**Délai de fraîcheur** : une fiche fusionnée atteint l'assistant en dix minutes
au plus — une minute de build GitHub Pages, puis le cache CDN qui sert le socle
avec `max-age=600`.

## Les trois garanties

Elles ne reposent pas sur la bonne volonté du modèle, mais sur du code.

1. **Aucune URL inventée ne peut être publiée.** Le nœud « Extraire la
   réponse » retire du texte toute adresse absente du socle, en gardant le
   libellé du lien. Le 21/09/2026, interrogé sur « le meilleur logiciel », le
   modèle avait fabriqué sept adresses du type `osfarm.org/fr/communs/ekylibre/`
   — plausibles, et toutes en 404. La bulle applique la même règle une seconde
   fois côté navigateur : seules les adresses de `sources` deviennent
   cliquables.

   **Une exception, vérifiée elle aussi : le lien de comparaison** (depuis le
   26/09/2026, `_annuaire/COMPARATEUR.md`). Une adresse
   `…/fr/communs/comparer/?fiches=<id>,<id>[,<id>]` est composée par le
   modèle, donc jamais dans le socle telle quelle. Le nœud ne la garde que si
   elle nomme deux ou trois fiches distinctes, chacune présente dans le socle
   sous la forme `#commun-<id>` en entier (`projet-farm` ne passe pas grâce à
   `projet-farmos`). Le préfixe est lu dans le socle, pas écrit dans le nœud ;
   sans section COMPARATEUR dans le socle, aucune adresse de ce genre ne passe.
   Le modèle recopie parfois l'ancre au lieu de l'identifiant
   (`commun-projet-farmos`) : ce préfixe est retiré, et l'adresse réécrite,
   avant le contrôle.

   Ce contrôle est **strict et exclusif** : une adresse qui commence par ce
   préfixe ne passe jamais par la règle générale. Celle-ci garde toute adresse
   qui figure *quelque part* dans le socle, même comme simple morceau. Elle
   aurait laissé passer le gabarit `?fiches=<id>` coupé au `<`, ou un exemple
   tronqué. Cette faiblesse vaut encore pour les autres adresses (un préfixe
   d'URL du socle passe), sans conséquence connue à ce jour.
2. **Jamais de modèle sans socle.** Si `/data/socle.txt` est illisible ou
   tronqué, le workflow répond 502 au lieu d'interroger le modèle. Le contrôle
   porte sur le marqueur de fin du fichier : une page d'erreur passerait un
   test « non vide ». Un modèle sans ancrage inventerait librement.
3. **Jamais de modèle avant les garde-fous.** L'anti-abus et les plafonds
   passent avant le premier appel. Et la bulle n'appelle rien tant que le
   visiteur ne l'a pas ouverte et n'a pas écrit : c'est ce qui protège le
   quota des robots, bien plus que le plafond par IP.

## Le choix du modèle

Les limites sont **par modèle** et, surprise, le modèle le plus évident est le
plus mal doté. Relevé le 21/09/2026, zone UE, pour une question de
~12 900 tokens :

| Modèle | Tokens/min | q/min à froid | Verdict |
|---|---|---|---|
| `mistral-large-2512` | 250 000 | 19,3 | **403** — interdit au plan Free |
| `mistral-small-2603` | 20 000 | 1,5 | **429** dès le premier appel |
| `ministral-8b` | 625 000 | 48,4 | invente en prose |
| **`ministral-14b`** | **937 500** | **30,0** | **retenu** |
| `ministral-3b` | 1 300 000 | 100,6 | secours |

**Trois pièges à connaître avant de toucher à ce choix :**

- **La console des limites n'est pas une liste de droits.**
  `admin.mistral.ai/plateforme/limits` affiche `mistral-large` avec ses
  250 000 tokens/minute ; l'appeler renvoie `403 tier_not_allowed`. Ne jamais
  déduire une disponibilité d'un débit affiché.
- **Le repli de qualité n'est pas `mistral-small`.** Il est douze fois plus
  bridé que Large et renvoie 429 dès le premier appel sur notre socle.
- **Le secours est un autre modèle du même fournisseur.** Les compteurs de
  débit étant tenus par modèle, un 429 sur le 14B ne dit rien du 3B. Cela
  évite un second fournisseur, une seconde credential et une fenêtre de
  contexte à vérifier.

## Ce que ça coûte

Rien, et par construction : **aucun moyen de paiement n'est enregistré chez
Mistral**. Les 10 $/mois de crédits du plan Free sont un plafond physique, pas
une surveillance. Nos propres plafonds — 150 questions/jour, 2 500/mois —
déclenchent le mode « au repos » bien avant que le fournisseur ne coupe.

Le cache de prompt fait le reste. Le socle étant identique d'un visiteur à
l'autre, seul le premier appel après un build le paie :

| | Sans cache | Avec cache |
|---|---|---|
| Coût pour le quota | 12 925 tokens | **381** |
| Coût | 0,00194 $ | ~0,00025 $ |
| Questions dans 10 $/mois | 5 157 | ~40 000 |

Pour vérifier tout cela après un changement : `_chatbot/mesurer_limites.py`,
avec `MISTRAL_API_KEY` dans l'environnement. Il mesure la latence, le coût réel
pour le quota et l'effet du cache, et sert aussi à tester une consigne avec
`--question`.

## Ce qui reste imparfait

Devant « recommande-moi le meilleur logiciel », le modèle produit la bonne
formule — « OSFarm ne classe pas les communs et n'en recommande aucun » — puis
glisse « trois logiciels **populaires** ». Le mot est pourtant nommément
interdit par la règle 3 bis de la consigne.

**Accepté en l'état le 21/09/2026**, après être passé de neuf manquements à un
seul, et parce qu'aucune affirmation factuelle n'y est attachée. Deux voies
avaient été chiffrées et écartées : retirer la phrase côté serveur, au risque
de perdre une information utile avec elle ; et une seconde passe de réécriture,
deux nœuds de plus. À rouvrir si le terme se révèle fréquent — les exécutions
n8n et le compteur `liens_retires` permettent de le mesurer.

## Quand faudra-t-il indexer ?

Pas avant **~100 000 tokens de socle**, soit douze à dix-huit mois au rythme du
radar (une PR de lot à la fois, fermée à trois jours, ~10 lots par mois).

Ce jour-là, une seule étape change : « lire le socle » devient « découper,
embarquer, chercher ». La bulle, les garde-fous, la consigne, les citations et
le secours ne bougent pas. Les embeddings `bge-m3` coûtent 0,012 $/M, soit
0,00014 $ pour réindexer le socle entier : le sujet sera la complexité, jamais
le prix. Et chez Mistral, `mistral-embed` dispose de 20 millions de tokens par
minute — le débit ne sera pas davantage un sujet.

## Pièges rencontrés, pour qui reprendra ce code

- **Un fichier `.md` à front matter est converti en HTML par kramdown.** D'où
  `socle.txt` et non `socle.md`.
- **`blank` n'est pas reconnu comme littéral** par le Liquid de cette version
  de Jekyll : `{% if x != blank %}` le lit comme une variable indéfinie et
  laisse passer les chaînes vides. Employer `{% assign v = x | strip %}` puis
  `{% if v != "" %}`. Et `{% if f.techno %}` ne filtre rien : une chaîne vide
  est vraie en Liquid.
- **Le parseur du SDK n8n rejette du JavaScript pourtant valide** (guillemets
  échappés, tableaux de concaténations). Créer les nœuds Code avec un corps
  vide, puis injecter le code par `update_workflow` / `setNodeParameter` sur
  `/jsCode`.
- **Un `update_workflow` ne prend effet qu'après `publish_workflow`.** Le
  webhook actif continue de servir la version publiée.
- **`min-height: 0` est indispensable** sur un enfant flex scrollable, sans
  quoi le panneau déborde de sa hauteur maximale et son pied est rogné.
- **La hauteur de la bannière de consentement se mesure, elle ne se devine
  pas** : elle change avec la langue et la largeur. `chatbot.js` la mesure et
  pose `--chatbot-bas`, dont le CSS déduit la hauteur du panneau.

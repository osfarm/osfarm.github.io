#!/usr/bin/env python3
"""Mesure ce que le plan Free de Mistral donne vraiment avec notre socle.

La console (https://admin.mistral.ai/plateforme/limits) annonce des quotas ;
ce script mesure ce qui compte pour la bulle : la latence sur un prompt de
~9 500 tokens, le nombre réel de tokens facturés, l'effet de la mise en cache,
et le moment où l'API commence à répondre 429.

    export MISTRAL_API_KEY="..."            # jamais écrit dans le dépôt
    python3 _chatbot/mesurer_limites.py                  # un appel, en-têtes
    python3 _chatbot/mesurer_limites.py --rafale 6       # cache et plafond
    python3 _chatbot/mesurer_limites.py --endpoint global --rafale 3

Rien n'est écrit sur le disque : reportez vous-même les chiffres dans
_chatbot/PLAN.md, tâche 0.2. Un appel coûte de l'ordre de 0,0016 $ sur les
crédits gratuits ; une rafale de 6 reste sous le centime.

Dépendances : la bibliothèque standard seule, comme les scripts de _radar/.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SOCLE_LOCAL = RACINE / "_site" / "data" / "socle.txt"
SOCLE_EN_LIGNE = "https://www.osfarm.org/data/socle.txt"

ENDPOINTS = {
    "eu": "https://api.eu.mistral.ai/v1/chat/completions",
    "global": "https://api.mistral.ai/v1/chat/completions",
}

# Une question volontairement banale : on mesure le transport, pas le modèle.
QUESTION = "Quel logiciel libre permet de gérer une exploitation agricole ?"

# Clé de cache stable : c'est elle qui doit faire chuter le coût d'entrée d'un
# appel à l'autre. Même valeur que celle prévue pour le workflow n8n.
CLE_CACHE = "osfarm-socle-v1"

DELAI = 60

# $ par million de tokens (entrée, sortie), relevés le 21/09/2026.
TARIFS = {
    "ministral-3b-latest": (0.10, 0.10),
    "ministral-8b-latest": (0.15, 0.15),
    "ministral-14b-latest": (0.20, 0.20),
    "mistral-small-latest": (0.15, 0.60),
    "mistral-large-latest": (0.50, 1.50),
}

# Rempli par main(), lu par resumer() : le modèle réellement interrogé.
modele_courant = ["ministral-8b-latest"]


def charger_socle(source: str | None) -> str:
    """Le socle, depuis le chemin donné, sinon le build local, sinon le site."""
    if source:
        chemin = Path(source)
        if chemin.exists():
            return chemin.read_text(encoding="utf-8")
        return lire_url(source)
    if SOCLE_LOCAL.exists():
        print(f"socle : {SOCLE_LOCAL} (build local)")
        return SOCLE_LOCAL.read_text(encoding="utf-8")
    print(f"socle : {SOCLE_EN_LIGNE} (pas de build local)")
    return lire_url(SOCLE_EN_LIGNE)


def lire_url(url: str) -> str:
    with urllib.request.urlopen(url, timeout=DELAI) as reponse:
        return reponse.read().decode("utf-8")


def appeler(url: str, cle: str, modele: str, socle: str, question: str,
            cache: bool) -> tuple[dict, dict, float, int]:
    """Renvoie (corps, en-têtes, secondes, code). Ne lève rien sur 4xx/5xx."""
    charge = {
        "model": modele,
        "temperature": 0.2,
        "max_tokens": 300,
        "messages": [
            # Le socle EN TÊTE : c'est la condition pour que le cache porte.
            {"role": "system", "content": socle},
            {"role": "user", "content": question},
        ],
    }
    if cache:
        charge["prompt_cache_key"] = CLE_CACHE

    requete = urllib.request.Request(
        url,
        data=json.dumps(charge).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {cle}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    depart = time.monotonic()
    try:
        with urllib.request.urlopen(requete, timeout=DELAI) as reponse:
            brut = reponse.read().decode("utf-8")
            entetes = dict(reponse.headers)
            code = reponse.status
    except urllib.error.HTTPError as err:
        brut = err.read().decode("utf-8", errors="replace")
        entetes = dict(err.headers)
        code = err.code
    except urllib.error.URLError as err:
        return {"erreur": str(err)}, {}, time.monotonic() - depart, 0
    duree = time.monotonic() - depart
    try:
        corps = json.loads(brut)
    except json.JSONDecodeError:
        corps = {"brut": brut[:400]}
    return corps, entetes, duree, code


def entetes_de_quota(entetes: dict) -> dict:
    """Tout en-tête qui parle de limite, de quota ou de reste.

    Les noms ne sont pas documentés et changent : on ne devine pas, on filtre
    largement et on affiche ce que le serveur a bien voulu dire.
    """
    motifs = ("ratelimit", "rate-limit", "limit", "remaining", "reset",
              "quota", "retry-after")
    return {k: v for k, v in entetes.items()
            if any(m in k.lower() for m in motifs)}


def resumer(corps: dict, entetes: dict, duree: float, code: int,
            numero: int) -> dict | None:
    usage = corps.get("usage") or {}
    entree = usage.get("prompt_tokens")
    sortie = usage.get("completion_tokens")

    etat = "ok" if code == 200 else f"HTTP {code}"
    print(f"\n── appel {numero} — {etat} en {duree:.2f} s")

    if code != 200:
        message = (corps.get("message") or corps.get("error")
                   or corps.get("detail") or corps.get("brut") or corps)
        print(f"   réponse : {str(message)[:300]}")
        quotas = entetes_de_quota(entetes)
        if quotas:
            print("   en-têtes de quota :")
            for k, v in sorted(quotas.items()):
                print(f"     {k}: {v}")
        return None

    # prompt_tokens ne bouge pas quand le cache porte : c'est
    # prompt_tokens_details.cached_tokens qui le dit, et l'en-tête
    # x-ratelimit-tokens-query-cost qui montre ce que la requête a réellement
    # coûté au quota. Les deux sont indispensables, le premier seul trompe.
    details = usage.get("prompt_tokens_details") or {}
    cache = details.get("cached_tokens") or 0
    quotas = entetes_de_quota(entetes)
    cout_quota = quotas.get("x-ratelimit-tokens-query-cost")
    cout_quota = int(cout_quota) if cout_quota else None

    print(f"   tokens : {entree} en entrée, {sortie} en sortie"
          + (f", dont {cache} servis par le cache" if cache else ""))
    if cout_quota is not None:
        print(f"   coût réel pour le quota : {cout_quota} tokens"
              + (f" au lieu de {entree}" if cache else ""))

    pe, ps = TARIFS.get(modele_courant[0], (0.15, 0.60))
    frais = max((entree or 0) - cache, 0)
    cout = (frais * pe + cache * pe * 0.10 + (sortie or 0) * ps) / 1e6
    plein = ((entree or 0) * pe + (sortie or 0) * ps) / 1e6
    if cout:
        etiquette = "avec cache" if cache else "sans cache"
        print(f"   coût {etiquette} : {cout:.5f} $  →  "
              f"{int(10 / cout)} questions dans 10 $/mois"
              + (f"  (plein tarif : {plein:.5f} $)" if cache else ""))

    if quotas:
        print("   en-têtes de quota :")
        for k, v in sorted(quotas.items()):
            print(f"     {k}: {v}")
    else:
        print("   en-têtes de quota : aucun en-tête reconnaissable")

    return {"entree": entree, "sortie": sortie, "duree": duree, "cout": cout,
            "cache": cache, "cout_quota": cout_quota,
            "limite_req": quotas.get("x-ratelimit-limit-req-minute"),
            "limite_tok": quotas.get("x-ratelimit-limit-tokens-minute")}


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Mesure le plan Free de Mistral avec le socle du chatbot")
    ap.add_argument("--endpoint", choices=sorted(ENDPOINTS), default="eu",
                    help="eu = api.eu.mistral.ai (+10 %%, inférence en UE)")
    ap.add_argument("--rafale", type=int, default=1,
                    help="nombre d'appels successifs (défaut : 1)")
    ap.add_argument("--pause", type=float, default=0.0,
                    help="secondes entre deux appels de la rafale")
    ap.add_argument("--sans-cache", action="store_true",
                    help="ne pas envoyer prompt_cache_key")
    ap.add_argument("--modele", default="ministral-8b-latest",
                    help="ministral-8b-latest par défaut : 625 000 tokens/min "
                         "contre 20 000 pour mistral-small (relevé le 21/09/2026)")
    ap.add_argument("--question", default=QUESTION,
                    help="la question posée ; sert au test de refus du point "
                         "d'arrêt P2")
    ap.add_argument("--socle", help="chemin ou URL d'un autre socle")
    args = ap.parse_args()

    cle = os.getenv("MISTRAL_API_KEY")
    if not cle:
        print("MISTRAL_API_KEY absent de l'environnement.\n"
              '  export MISTRAL_API_KEY="..."   puis relancer.\n'
              "La clé ne doit jamais être écrite dans le dépôt.", file=sys.stderr)
        return 2

    modele_courant[0] = args.modele
    socle = charger_socle(args.socle)
    mots = len(socle.split())
    url = ENDPOINTS[args.endpoint]
    print(f"socle : {mots} mots, ~{int(mots * 1.5)} tokens estimés")
    print(f"modèle : {args.modele}")
    print(f"endpoint : {url}")
    print(f"cache : {'non' if args.sans_cache else CLE_CACHE}")
    print(f"question : {args.question}")

    mesures = []
    for i in range(1, args.rafale + 1):
        corps, entetes, duree, code = appeler(
            url, cle, args.modele, socle, args.question,
            cache=not args.sans_cache)
        mesure = resumer(corps, entetes, duree, code, i)
        if mesure:
            mesures.append(mesure)
        if i == 1 and code == 200:
            texte = (corps["choices"][0]["message"]["content"] or "").strip()
            print(f"   début de réponse : {texte[:180]}…")
        if args.pause and i < args.rafale:
            time.sleep(args.pause)

    print("\n" + "=" * 62)
    if not mesures:
        print("Aucun appel abouti. Le message et les en-têtes ci-dessus disent\n"
              "pourquoi : clé invalide, quota épuisé, ou débit dépassé.")
        return 1

    lent = max(m["duree"] for m in mesures)
    rapide = min(m["duree"] for m in mesures)
    entrees = {m["entree"] for m in mesures}
    print(f"{len(mesures)}/{args.rafale} appels aboutis")
    print(f"latence : {rapide:.2f} s au mieux, {lent:.2f} s au pire")
    print(f"tokens d'entrée : {sorted(entrees)}")

    # Débit réel : le quota par minute divisé par ce que coûte vraiment une
    # requête, borné par la limite en nombre de requêtes.
    couts = [m["cout_quota"] for m in mesures if m["cout_quota"]]
    lim_tok = next((m["limite_tok"] for m in mesures if m["limite_tok"]), None)
    lim_req = next((m["limite_req"] for m in mesures if m["limite_req"]), None)
    if couts and lim_tok:
        chaud = min(couts)
        froid = max(couts)
        par_tokens = int(int(lim_tok) / chaud)
        plafond = min(par_tokens, int(lim_req)) if lim_req else par_tokens
        bride = "requêtes" if lim_req and int(lim_req) < par_tokens else "tokens"
        print(f"coût pour le quota : {froid} tokens à froid, {chaud} à chaud")
        print(f"débit à chaud : {plafond} questions/minute (bridé par les {bride})")
        if froid > chaud * 2:
            print(f"→ le cache divise le coût de quota par {froid // chaud}. "
                  "Il porte\n  donc sur le DÉBIT autant que sur la facture.")

    caches = [m["cache"] for m in mesures]
    if any(caches) and not all(caches):
        print("→ premier appel à froid, les suivants servis par le cache : "
              "attendu.")
    elif not any(caches):
        print("→ aucun appel servi par le cache. Vérifier que le socle est bien\n"
              "  EN TÊTE du prompt et que prompt_cache_key ne change pas.")

    print("\nÀ reporter dans _chatbot/PLAN.md, tâche 0.2.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

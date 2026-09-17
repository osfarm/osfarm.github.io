#!/usr/bin/env python3
"""
Radar OSFarm — resume.py

Reprend le lot produit par collecte.py, fait rédiger par un modèle de langue
un résumé français de deux phrases et une ligne d'intérêt pour l'association,
puis prépare le corps de la pull request que les relecteurs valideront.

Le modèle propose, il ne décide pas : rien n'est publié à cette étape.

Usage :
    python _radar/resume.py                     # lot le plus récent
    python _radar/resume.py --fichier _data/radar/2026-09-17.yml
    python _radar/resume.py --sans-ia           # garde les descriptions d'origine

Variables d'environnement :
    MISTRAL_API_KEY   nécessaire pour l'appel au modèle (sinon mode sans IA)
    MISTRAL_MODELE    par défaut « mistral-small-latest »
    MISTRAL_URL       par défaut l'API publique ; tout serveur compatible
                      /v1/chat/completions convient (vLLM local par exemple)
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

import requests
import yaml

from collecte import (DOSSIER_BROUILLON, DOSSIER_LOTS, FAMILLES, RACINE,
                      charger_configuration, ecrire_lot)

FICHIER_CACHE = RACINE / "_radar" / "resumes.json"
CORPS_PR = RACINE / "_radar" / "pr_body.md"

URL_API = os.getenv("MISTRAL_URL", "https://api.mistral.ai/v1/chat/completions")
MODELE = os.getenv("MISTRAL_MODELE", "mistral-small-latest")
TAILLE_LOT = 6          # frugalité : un appel pour six fiches
DELAI = 60

ETIQUETTES = {"logiciel": "Logiciels", "materiel": "Matériels",
              "donnees": "Données", "modele": "Modèles et IA"}

CONSIGNE = """Tu prépares la veille quotidienne de l'association OSFarm, qui recense les communs numériques agricoles (logiciels, matériels, données, modèles) publiés sous licence ouverte.

Pour chaque projet fourni, produis :
- resume : deux phrases en français, factuelles, sans superlatif ni formule promotionnelle. Première phrase : ce que c'est et ce que ça fait. Deuxième phrase : pour qui c'est utile concrètement.
- interet : une phrase courte expliquant à quoi ce projet peut servir en agriculture, ou la chaîne vide si l'intérêt est faible. Déduis-la uniquement de ce que fait le projet : n'affirme jamais qu'il est utilisé, connu, populaire, adopté ou reconnu, ne parle ni de langue ni de francophonie, et ne donne en exemple aucune tâche, culture ou opération que le texte fourni ne cite pas.
- famille : logiciel, materiel, donnees ou modele.
- pertinence : « oui » si le projet concerne réellement l'agriculture, l'élevage, la viticulture, la forêt ou l'alimentation ; « non » sinon (par exemple un projet de finance, de jeu vidéo ou d'infrastructure informatique qui emploie le mot « farm » dans un autre sens).
- mots_cles : trois à cinq mots-clés en français, en minuscules.

N'invente aucune information absente du texte fourni : ni usage, ni nombre d'utilisateurs, ni public, ni pays, ni partenaire. Si la description est trop pauvre pour résumer, écris resume: "" et pertinence: "inconnu".

Réponds uniquement par un objet JSON de la forme :
{"fiches": [{"id": "...", "resume": "...", "interet": "...", "famille": "...", "pertinence": "oui", "mots_cles": ["...", "..."]}]}"""


# --------------------------------------------------------------------------

def dernier_lot() -> Path | None:
    fichiers = list(DOSSIER_LOTS.glob("*.yml")) + list(DOSSIER_BROUILLON.glob("*.yml"))
    return max(fichiers, key=lambda f: f.stat().st_mtime) if fichiers else None


def charger_cache() -> dict:
    if FICHIER_CACHE.exists():
        return json.loads(FICHIER_CACHE.read_text(encoding="utf-8"))
    return {}


def enregistrer_cache(cache: dict) -> None:
    FICHIER_CACHE.write_text(
        json.dumps(cache, ensure_ascii=False, indent=1, sort_keys=True) + "\n",
        encoding="utf-8")


def appeler_modele(lot: list[dict], cle: str) -> dict[str, dict]:
    charge = [{
        "id": c["id"],
        "titre": c.get("titre", ""),
        "description": c.get("description", ""),
        "licence": c.get("licence", ""),
        "mots_cles": (c.get("mots_cles") or [])[:6],
        "famille_supposee": c.get("famille", ""),
    } for c in lot]

    corps = {
        "model": MODELE,
        "temperature": 0.2,
        "max_tokens": 1600,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": CONSIGNE},
            {"role": "user", "content": json.dumps(charge, ensure_ascii=False)},
        ],
    }
    entetes = {"Authorization": f"Bearer {cle}", "Content-Type": "application/json"}

    for tentative in range(3):
        try:
            r = requests.post(URL_API, headers=entetes, json=corps, timeout=DELAI)
            if r.status_code == 429:
                time.sleep(10 * (tentative + 1))
                continue
            r.raise_for_status()
            texte = r.json()["choices"][0]["message"]["content"]
            texte = re.sub(r"^```(?:json)?|```$", "", texte.strip(), flags=re.MULTILINE).strip()
            donnees = json.loads(texte)
            return {f["id"]: f for f in donnees.get("fiches", []) if f.get("id")}
        except Exception as err:  # noqa: BLE001
            print(f"    appel au modèle en échec ({err})", file=sys.stderr)
            time.sleep(4 * (tentative + 1))
    return {}


def repli(c: dict) -> dict:
    """Sans modèle : la description d'origine, tronquée proprement."""
    texte = (c.get("description") or "").strip()
    if len(texte) > 220:
        texte = texte[:217].rsplit(" ", 1)[0] + "…"
    return {"resume": texte, "interet": "", "famille": c.get("famille", ""),
            "pertinence": "inconnu", "mots_cles": [], "redige_par": "aucun"}


# --------------------------------------------------------------------------

def ecrire_corps_pr(contenu: dict, fichier: Path) -> None:
    candidats = contenu.get("candidats") or []
    rejets = contenu.get("rejets") or {}
    try:
        chemin_lot = fichier.resolve().relative_to(RACINE)
    except ValueError:
        chemin_lot = fichier

    lignes = [
        f"## Radar du {contenu.get('date', '')}",
        "",
        f"{contenu.get('examines', 0)} projets examinés · {len(candidats)} proposés · "
        f"{rejets.get('licence', 0)} écartés faute de licence ouverte.",
        "",
        "**Valider en trois minutes :** dans l'onglet *Files changed*, éditez "
        f"`{chemin_lot}` (menu ⋯ → *Edit file*). Passez à `publier: false` ce qui ne "
        "doit pas sortir et corrigez un résumé si besoin. **La fusion publie** "
        "les fiches restantes sur l'annuaire et le fil d'actualités.",
        "",
        "Sans fusion sous trois jours, ce lot est fermé automatiquement et ses projets "
        "reviendront dans un lot suivant : rien ne s'accumule.",
        "",
    ]

    for famille in FAMILLES:
        fiches = [c for c in candidats if c.get("famille") == famille]
        if not fiches:
            continue
        relecteurs = sorted({c["relecteur"] for c in fiches if c.get("relecteur")})
        mention = " · " + " ".join(f"@{r}" for r in relecteurs) if relecteurs else ""
        lignes += [f"### {ETIQUETTES[famille]} — {len(fiches)} fiche(s){mention}", ""]
        for c in fiches:
            etat = "" if c.get("publier", True) else " — ❌ `publier: false`"
            lignes.append(f"- **[{c['titre']}]({c['url']})** · `{c.get('licence') or '?'}` "
                          f"· score {c.get('score', 0)}{etat}")
            if c.get("resume"):
                lignes.append(f"  {c['resume']}")
            if c.get("interet"):
                lignes.append(f"  _Intérêt :_ {c['interet']}")
            if c.get("pertinence") == "non":
                lignes.append("  ⚠️ Le modèle juge ce projet hors sujet agricole : "
                              "écarté par défaut.")
            elif not c.get("resume"):
                lignes.append("  ⚠️ Le modèle n'a pas rédigé de résumé : écarté par défaut.")
        lignes.append("")

    pannes = contenu.get("pannes") or []
    if pannes:
        lignes += ["### Sources en panne", ""]
        lignes += [f"- `{p}`" for p in pannes]
        lignes.append("")

    CORPS_PR.write_text("\n".join(lignes), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Résumé et classement du radar OSFarm")
    ap.add_argument("--fichier", help="lot à traiter (par défaut le plus récent)")
    ap.add_argument("--sans-ia", action="store_true", help="ne pas appeler de modèle")
    args = ap.parse_args()

    fichier = Path(args.fichier) if args.fichier else dernier_lot()
    if fichier is None or not fichier.exists():
        print("aucun lot à traiter", file=sys.stderr)
        return 1

    contenu = yaml.safe_load(fichier.read_text(encoding="utf-8")) or {}
    candidats = contenu.get("candidats") or []

    cle = os.getenv("MISTRAL_API_KEY")
    mode_ia = bool(cle) and not args.sans_ia
    if not mode_ia:
        print("mode sans modèle : les descriptions d'origine sont conservées")

    # Une fiche déjà résumée n'est pas réécrite : ni appel inutile, ni
    # correction d'un relecteur écrasée.
    cache = charger_cache()
    a_rediger = [c for c in candidats if "resume" not in c and c["id"] not in cache]
    print(f"{len(candidats)} candidats · {len(a_rediger)} à rédiger")

    reponses: dict[str, dict] = {}
    if mode_ia:
        for debut in range(0, len(a_rediger), TAILLE_LOT):
            lot = a_rediger[debut:debut + TAILLE_LOT]
            print(f"→ lot {debut // TAILLE_LOT + 1} ({len(lot)} fiches)")
            for ident, r in appeler_modele(lot, cle).items():
                r["redige_par"] = MODELE
                # Seules les rédactions du modèle sont mises en cache : un repli
                # ne doit pas priver d'un vrai résumé un projet qui reviendrait
                # dans un autre lot après l'expiration de celui-ci.
                cache[ident] = reponses[ident] = r
            time.sleep(1)

    _, sources = charger_configuration()
    familles_fixes = {src.get("id") for src in sources if src.get("famille_fixe")}

    hors_sujet = sans_resume = 0
    for c in candidats:
        if "resume" in c:
            continue
        r = reponses.get(c["id"]) or cache.get(c["id"]) or repli(c)
        c["resume"] = r.get("resume") or ""
        c["interet"] = r.get("interet") or ""
        c["pertinence"] = r.get("pertinence") or "inconnu"
        c["redige_par"] = r.get("redige_par") or "aucun"
        if (c.get("source") not in familles_fixes and r.get("famille") in FAMILLES
                and r["famille"] != c.get("famille")):
            c["famille_initiale"] = c.get("famille")
            c["famille"] = r["famille"]
        if r.get("mots_cles"):
            c["mots_cles_fr"] = [str(m) for m in r["mots_cles"]][:5]
        if c["pertinence"] == "non":
            c["publier"] = False      # le relecteur peut revenir dessus
            hors_sujet += 1
        elif not c["resume"]:
            # Sans résumé, la page afficherait la description brute, souvent en
            # anglais et tronquée ; le modèle ne la juge pas toujours « inconnu ».
            c["publier"] = False
            sans_resume += 1

    contenu["candidats"] = candidats
    contenu["resume_genere_le"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    ecrire_lot(fichier, contenu)
    if mode_ia:
        enregistrer_cache(cache)
    ecrire_corps_pr(contenu, fichier)

    print(f"écrit : {fichier} et {CORPS_PR.relative_to(RACINE)}")
    if hors_sujet:
        print(f"{hors_sujet} fiche(s) écartée(s) par défaut : jugées hors sujet agricole")
    if sans_resume:
        print(f"{sans_resume} fiche(s) écartée(s) par défaut : aucun résumé rédigé")
    return 0


if __name__ == "__main__":
    sys.exit(main())

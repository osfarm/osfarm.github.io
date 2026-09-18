#!/usr/bin/env python3
"""
Radar OSFarm — diffusion.py

Prépare, à la demande, les textes à diffuser à partir des fiches déjà publiées
(les lots fusionnés dans _data/radar/) : un brouillon de newsletter ou une
série de posts pour les réseaux sociaux. Rien n'est envoyé : le texte sort sur
la sortie standard, à relire et coller dans l'outil de diffusion.

Usage :
    python _radar/diffusion.py                        # newsletter des 7 derniers jours
    python _radar/diffusion.py --jours 30
    python _radar/diffusion.py --format reseaux > posts.md
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta

import yaml

from collecte import FAMILLES, fichiers_lots

SITE = "https://www.osfarm.org"
ETIQUETTES = {"logiciel": "Logiciels", "materiel": "Matériels",
              "donnees": "Données", "modele": "Modèles et IA"}
HASHTAGS = {"logiciel": "#LogicielLibre", "materiel": "#OpenHardware",
            "donnees": "#OpenData", "modele": "#IA"}


def fiches_publiees(depuis: str) -> list[dict]:
    fiches = []
    for fichier in fichiers_lots():
        lot = yaml.safe_load(fichier.read_text(encoding="utf-8")) or {}
        if str(lot.get("date", fichier.stem)) < depuis:
            continue
        fiches += [c for c in lot.get("candidats") or [] if c.get("publier", True)]
    return fiches


def premiere_phrase(texte: str) -> str:
    texte = (texte or "").strip()
    fin = texte.find(". ")
    return texte if fin < 0 else texte[: fin + 1]


def newsletter(fiches: list[dict], depuis: str) -> str:
    lignes = [f"# Le radar des communs agricoles, depuis le {depuis}", "",
              "_Brouillon généré : l'édito reste à écrire._", ""]
    for famille in FAMILLES:
        lot = [f for f in fiches if f.get("famille") == famille]
        if not lot:
            continue
        lignes += [f"## {ETIQUETTES[famille]}", ""]
        for f in lot:
            resume = f.get("resume") or f.get("description") or ""
            lignes.append(f"- **[{f['titre']}]({f['url']})** (`{f.get('licence')}`) : {resume}")
        lignes.append("")
    lignes.append(f"Tout l'annuaire : {SITE}/fr/communs/")
    return "\n".join(lignes)


def reseaux(fiches: list[dict]) -> str:
    posts = []
    for f in fiches:
        accroche = premiere_phrase(f.get("resume") or f.get("description") or "")
        posts.append("\n".join([
            f"🌱 {f['titre']}",
            "",
            accroche,
            f.get("interet") or "",
            "",
            f"Licence {f.get('licence')} · {f['url']}",
            f"Annuaire des communs agricoles : {SITE}/fr/communs/#commun-{f['id']}",
            "",
            f"#Agriculture #OpenSource {HASHTAGS.get(f.get('famille'), '')}".strip(),
        ]).replace("\n\n\n", "\n\n"))
    return "\n\n---\n\n".join(posts)


def main() -> int:
    ap = argparse.ArgumentParser(description="Textes de diffusion du radar OSFarm")
    ap.add_argument("--jours", type=int, default=7, help="fenêtre en jours (défaut 7)")
    ap.add_argument("--format", choices=["newsletter", "reseaux"], default="newsletter")
    args = ap.parse_args()

    depuis = (datetime.now() - timedelta(days=args.jours)).strftime("%Y-%m-%d")
    fiches = fiches_publiees(depuis)
    if not fiches:
        print(f"aucune fiche publiée depuis le {depuis}", file=sys.stderr)
        return 1
    print(newsletter(fiches, depuis) if args.format == "newsletter" else reseaux(fiches))
    return 0


if __name__ == "__main__":
    sys.exit(main())

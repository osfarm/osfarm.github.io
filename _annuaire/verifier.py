#!/usr/bin/env python3
"""Vérifie la cohérence des types et des rattachements de l'annuaire.

Le modèle de fiche autorise depuis le 21/09/2026 un champ `type` et un champ
`partie_de` (voir _annuaire/DESIGN.md). Ces deux champs sont renseignés à la
main, fiche par fiche, au fil d'une migration éditoriale qui s'étalera sur des
mois. Rien dans Jekyll ne signale un rattachement cassé : la page se construit
sans broncher et le lien mène simplement nulle part.

Ce script est le garde-fou de cette migration. Il lit la sortie du build,
/_site/data/communs.json, qui reflète ce que le site publie réellement —
relations dérivées comprises — plutôt que les fichiers source, où la même
vérification serait à refaire pour chaque lot du radar.

    python3 _annuaire/verifier.py            # après un build
    python3 _annuaire/verifier.py --json x   # sur un export précis

Sort 0 si tout va bien, 1 sinon, en listant chaque manquement avec la fiche
concernée. Appelé par `rake test` et par la vérification des pull requests.
"""

import argparse
import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
EXPORT = RACINE / "_site" / "data" / "communs.json"
VOCABULAIRE = RACINE / "_data" / "radar" / "communaute.yml"
BESOINS = RACINE / "_data" / "besoins.yml"


def types_autorises() -> set[str]:
    """Le vocabulaire déclaré dans _data/, seule source de vérité.

    Lu au motif plutôt qu'avec PyYAML : ce script doit tourner sans dépendance
    dans une vérification de pull request. Le bloc visé est une liste plate
    d'entrées « - id: <valeur> » sous la clé « types: ».
    """
    texte = VOCABULAIRE.read_text(encoding="utf-8")
    bloc = re.search(r"^types:\n((?:(?:\s+.*)?\n)+?)(?=^\S)", texte, re.M)
    if not bloc:
        raise SystemExit(f"clé « types: » introuvable dans {VOCABULAIRE}")
    return set(re.findall(r"^\s+-\s+id:\s*(\S+)", bloc.group(1), re.M))


def controler(fiches: list[dict], autorises: set[str]) -> list[str]:
    """Les six règles de cohérence de _annuaire/DESIGN.md."""
    par_id = {f["id"]: f for f in fiches}
    fautes = []

    def faute(fiche, message):
        fautes.append(f"{fiche.get('titre', '?')} ({fiche.get('id', '?')}) : {message}")

    for f in fiches:
        type_ = f.get("type") or "projet"
        parent = (f.get("partie_de") or "").strip()

        if type_ not in autorises:
            faute(f, f"type « {type_} » hors vocabulaire {sorted(autorises)}")

        if type_ == "composant" and not parent:
            faute(f, "type « composant » sans « partie_de »")

        if parent and type_ != "composant":
            faute(f, f"« partie_de » sur une fiche de type « {type_} », "
                     "réservé aux composants")

        if parent and parent not in par_id:
            faute(f, f"« partie_de: {parent} » ne désigne aucune fiche")
        elif parent:
            type_parent = par_id[parent].get("type") or "projet"
            if type_parent == "composant":
                faute(f, f"rattaché à « {parent} », lui-même un composant : "
                         "la hiérarchie doit rester à un seul niveau")
            elif type_parent != "ecosysteme":
                faute(f, f"rattaché à « {parent} », de type « {type_parent} » "
                         "et non « ecosysteme »")

        if type_ == "ecosysteme" and not f.get("composants"):
            faute(f, "type « ecosysteme » sans aucun composant rattaché")

    return fautes


def controler_besoins() -> list[str]:
    """Les besoins n'entrent pas dans l'export : ils se vérifient à la source.

    Une fiche « besoin » mal formée ne casse rien, elle s'affiche simplement
    sans catégorie ou sans résumé — un manque muet, que personne ne remarque.
    """
    if not BESOINS.exists():
        return []
    texte = BESOINS.read_text(encoding="utf-8")
    fautes = []
    for bloc in re.split(r"^- id:", texte, flags=re.M)[1:]:
        bid = bloc.split("\n", 1)[0].strip()
        champs = dict(re.findall(r"^  (\w+):\s*(.*)$", bloc, re.M))
        type_ = champs.get("type", "")
        if type_ != "besoin":
            fautes.append(f"{bid} : type « {type_ or 'absent'} » dans besoins.yml, "
                          "attendu « besoin »")
        for requis in ("titre", "famille", "categorie", "resume", "propose_le"):
            if not champs.get(requis):
                fautes.append(f"{bid} : champ « {requis} » manquant")
    return fautes


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--json", default=str(EXPORT),
                    help="export à vérifier (défaut : la sortie du build)")
    args = ap.parse_args()

    export = Path(args.json)
    if not export.exists():
        print(f"{export} est absent : lancer « bundle exec jekyll build » "
              "avant la vérification.", file=sys.stderr)
        return 1

    fiches = json.loads(export.read_text(encoding="utf-8"))
    autorises = types_autorises()
    fautes = controler(fiches, autorises) + controler_besoins()

    repartition = {}
    for f in fiches:
        t = f.get("type") or "projet"
        repartition[t] = repartition.get(t, 0) + 1
    detail = ", ".join(f"{n} {t}" for t, n in sorted(repartition.items()))

    if fautes:
        print(f"Annuaire : {len(fautes)} incohérence(s) sur "
              f"{len(fiches)} fiches ({detail})", file=sys.stderr)
        for f in fautes:
            print(f"  · {f}", file=sys.stderr)
        print("\nRègles : _annuaire/DESIGN.md, section « Règles de cohérence ».",
              file=sys.stderr)
        return 1

    n_besoins = len(re.findall(r"^- id:", BESOINS.read_text(encoding="utf-8"), re.M)) \
        if BESOINS.exists() else 0
    print(f"Annuaire : {len(fiches)} fiches cohérentes ({detail}) "
          f"+ {n_besoins} besoins non couverts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

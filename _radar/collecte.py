#!/usr/bin/env python3
"""
Radar OSFarm — collecte.py

Interroge les sources déclarées dans _radar/sources.yml, normalise les
résultats, écarte ce qui n'est pas sous licence ouverte, note ce qui reste et
dépose le lot du jour dans _data/radar/AAAA-MM-JJ.yml.

Rien n'est publié ici : le lot part dans une pull request. Le site Jekyll lit
_data/radar/ directement, donc c'est la fusion de cette pull request qui
publie les fiches validées.

Usage :
    python _radar/collecte.py
    python _radar/collecte.py --source github-agri
    python _radar/collecte.py --blanc     # lot écrit dans _radar/brouillon/,
                                          # mémoire intacte : pour calibrer

Variables d'environnement facultatives :
    GITHUB_TOKEN   relève les quotas de l'API GitHub (recherche : 10 -> 30 req/min)
    OSHWA_TOKEN    jeton de l'annuaire de certification OSHWA
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests
import yaml

try:
    import feedparser
except ImportError:  # feedparser n'est utile que pour les sources RSS
    feedparser = None

RACINE = Path(__file__).resolve().parent.parent
FICHIER_SOURCES = RACINE / "_radar" / "sources.yml"
FICHIER_MEMOIRE = RACINE / "_radar" / "memoire.json"
DOSSIER_LOTS = RACINE / "_data" / "radar"
DOSSIER_BROUILLON = RACINE / "_radar" / "brouillon"

DELAI_REQUETE = 20  # secondes
FAMILLES = ("logiciel", "materiel", "donnees", "modele")

# --------------------------------------------------------------------------
# Licences
# --------------------------------------------------------------------------

LICENCES_OUVERTES = {
    # logiciels
    "mit", "isc", "zlib", "unlicense", "bsd-2-clause", "bsd-3-clause",
    "apache-2.0", "mpl-2.0", "epl-2.0", "eupl-1.2", "osl-3.0", "artistic-2.0",
    "gpl-2.0", "gpl-3.0", "lgpl-2.1", "lgpl-3.0", "agpl-3.0", "cecill-2.1",
    # données et contenus
    "cc0-1.0", "cc-by-3.0", "cc-by-4.0", "cc-by-sa-3.0", "cc-by-sa-4.0",
    "odbl-1.0", "odc-by-1.0", "pddl-1.0", "etalab-2.0", "gfdl-1.3",
    # matériel
    "cern-ohl-p-2.0", "cern-ohl-w-2.0", "cern-ohl-s-2.0",
    "tapr-ohl-1.0", "solderpad-2.1",
    # sources dont toutes les entrées sont sous licence OSI sans la préciser
    # (JOSS l'exige de chaque article) : à déclarer via licence_par_defaut
    "osi-approuvee",
}

# Tout ce qui désigne une licence ouverte mais s'écrit autrement.
ALIAS_LICENCES = {
    "cc0": "cc0-1.0", "cc-0": "cc0-1.0", "cc zero": "cc0-1.0", "cc-zero": "cc0-1.0",
    "cc-by": "cc-by-4.0", "ccby": "cc-by-4.0", "cc by 4.0": "cc-by-4.0",
    "cc-by-sa": "cc-by-sa-4.0",
    "odbl": "odbl-1.0", "odc-odbl": "odbl-1.0", "open database license": "odbl-1.0",
    "odc-by": "odc-by-1.0", "odc-pddl": "pddl-1.0",
    "etalab": "etalab-2.0", "lov2": "etalab-2.0", "lo/ol-2.0": "etalab-2.0",
    "licence ouverte": "etalab-2.0", "licence ouverte / open licence": "etalab-2.0",
    "fr-lo": "etalab-2.0", "notspecified": "", "other": "", "unknown": "",
    "apache2.0": "apache-2.0", "apache 2.0": "apache-2.0", "apache-2": "apache-2.0",
    "gpl3": "gpl-3.0", "gplv3": "gpl-3.0", "gpl-3.0-or-later": "gpl-3.0",
    "gpl-3.0-only": "gpl-3.0", "agpl-3.0-only": "agpl-3.0",
    "agpl-3.0-or-later": "agpl-3.0", "lgpl-3.0-only": "lgpl-3.0",
    "lgpl-3.0-or-later": "lgpl-3.0", "gpl-2.0-only": "gpl-2.0", "gpl-2.0-or-later": "gpl-2.0",
    "bsd": "bsd-3-clause", "bsd-3": "bsd-3-clause",
    "cern-ohl-s": "cern-ohl-s-2.0", "cern-ohl-w": "cern-ohl-w-2.0",
    "cern-ohl-p": "cern-ohl-p-2.0",
}


def normaliser_licence(brut: Any) -> str:
    """Ramène une licence à son identifiant SPDX en minuscules, ou '' si inconnue."""
    if not brut:
        return ""
    if isinstance(brut, dict):
        brut = brut.get("id") or brut.get("spdx_id") or brut.get("title") or ""
    texte = str(brut).strip().lower()
    if texte in {"", "noassertion", "null", "none"}:
        return ""
    texte = texte.replace("licence:", "").replace("license:", "").strip()
    texte = re.sub(r"\s+", " ", texte)
    if texte in ALIAS_LICENCES:
        return ALIAS_LICENCES[texte]
    compact = texte.replace(" ", "-")
    return ALIAS_LICENCES.get(compact, compact)


def licence_ouverte(licence: str) -> bool:
    return licence in LICENCES_OUVERTES


# --------------------------------------------------------------------------
# Lexique agricole : sert à mesurer la pertinence, pas à chercher
# --------------------------------------------------------------------------

LEXIQUE = {
    3: {
        "agriculture", "agricole", "agronomy", "agronomie", "farm", "farming",
        "farmer", "agriculteur", "cropland", "agroecology", "agroecologie",
        "agritech", "agtech", "elevage", "livestock", "viticulture", "vineyard",
        "orchard", "verger", "arboriculture", "maraichage", "horticulture",
    },
    2: {
        "crop", "culture", "soil", "harvest", "recolte", "yield",
        "rendement", "irrigation", "fertilizer", "fertilisation", "pesticide",
        "phytosanitaire", "parcelle", "field-boundary", "tractor", "tracteur",
        "greenhouse", "serre", "dairy", "laitier", "bovin", "cattle", "poultry",
        "aviculture", "apiculture", "beehive", "sylviculture", "forestry",
        "pasture", "paturage", "compost", "semence", "seed", "plant-disease",
    },
    1: {
        "weather", "meteo", "climat", "remote-sensing", "teledetection",
        "sentinel", "ndvi", "gis", "sig", "geospatial", "rural", "food",
        "alimentaire", "biodiversity", "biodiversite", "water",
        "carbon", "carbone", "sustainability", "durabilite", "traceability",
        "tracabilite",
    },
}

# Faux amis : « farming » existe aussi dans la crypto, l'informatique et le jeu vidéo.
EXCLUSIONS = {
    "yield farming", "liquidity pool", "defi", "staking", "airdrop", "nft",
    "blockchain game", "farmville", "minecraft", "stardew", "roblox",
    "bot farming", "click farm", "server farm", "gpu farm", "render farm",
    "link farm", "farming simulator", "idle game",
}


def sans_accents(texte: str) -> str:
    return unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode().lower()


def pertinence(texte: str) -> tuple[int, list[str]]:
    """Note de 0 à 25 selon la densité de vocabulaire agricole."""
    t = " " + re.sub(r"[^a-z0-9\- ]+", " ", sans_accents(texte)) + " "
    trouves, points = [], 0
    for poids, mots in LEXIQUE.items():
        for mot in sorted(mots):
            if f" {mot} " in t or f" {mot}s " in t or f"-{mot}" in t:
                points += poids
                trouves.append(mot)
    return min(points * 3, 25), trouves[:6]


def exclu(texte: str) -> str | None:
    t = sans_accents(texte)
    for motif in sorted(EXCLUSIONS):
        if re.search(rf"\b{re.escape(motif)}\b", t):
            return motif
    return None


# --------------------------------------------------------------------------
# Structure d'un candidat
# --------------------------------------------------------------------------

@dataclass
class Candidat:
    id: str = ""
    famille: str = "logiciel"
    relecteur: str = ""
    source: str = ""
    titre: str = ""
    url: str = ""
    description: str = ""
    licence: str = ""
    date_maj: str = ""
    techno: str = ""
    popularite: int = 0
    mots_cles: list[str] = field(default_factory=list)
    score: int = 0
    raisons: list[str] = field(default_factory=list)
    propose_le: str = ""
    publier: bool = True

    def finaliser(self) -> "Candidat":
        self.url = (self.url or "").strip()
        cle = self.url.lower().rstrip("/")
        self.id = hashlib.sha1(cle.encode("utf-8")).hexdigest()[:12]
        self.titre = re.sub(r"\s+", " ", self.titre or "").strip()[:160]
        self.description = re.sub(r"\s+", " ", self.description or "").strip()[:400]
        self.mots_cles = [str(m) for m in self.mots_cles if m][:8]
        return self


# --------------------------------------------------------------------------
# Utilitaires réseau
# --------------------------------------------------------------------------

def get_json(url: str, entetes: dict | None = None, params: dict | None = None,
             essais: int = 3) -> Any:
    entetes = {"User-Agent": "radar-osfarm (+https://osfarm.org)", **(entetes or {})}
    for tentative in range(essais):
        try:
            r = requests.get(url, headers=entetes, params=params, timeout=DELAI_REQUETE)
            if r.status_code in (403, 429) and "rate limit" in r.text.lower():
                attente = 20 * (tentative + 1)
                print(f"    quota atteint, pause {attente}s", file=sys.stderr)
                time.sleep(attente)
                continue
            r.raise_for_status()
            return r.json()
        except Exception:  # noqa: BLE001
            if tentative == essais - 1:
                raise
            time.sleep(3 * (tentative + 1))
    raise RuntimeError(f"quota toujours atteint après {essais} essais : {url}")


def chemin(obj: Any, route: str, defaut: Any = "") -> Any:
    """Lit une valeur imbriquée : chemin(d, 'metadata.license.id')."""
    courant = obj
    for cle in route.split("."):
        if isinstance(courant, dict):
            courant = courant.get(cle)
        elif isinstance(courant, list) and cle.isdigit():
            courant = courant[int(cle)] if int(cle) < len(courant) else None
        else:
            return defaut
        if courant is None:
            return defaut
    return courant


def il_y_a(jours: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=jours)).strftime("%Y-%m-%d")


def duree_en_jours(valeur: Any) -> int:
    """Accepte '180j', '12m', '2a' ou un entier de jours."""
    if valeur is None:
        return 0
    s = str(valeur).strip().lower()
    if s.endswith("j"):
        return int(s[:-1])
    if s.endswith("m"):
        return int(s[:-1]) * 30
    if s.endswith("a"):
        return int(s[:-1]) * 365
    return int(re.sub(r"\D", "", s) or 0)


def nouveau(src: dict, famille_defaut: str, **champs: Any) -> Candidat:
    return Candidat(
        famille=src.get("famille", famille_defaut),
        relecteur=src.get("relecteur", ""),
        source=src["id"],
        **champs,
    ).finaliser()


# --------------------------------------------------------------------------
# Connecteurs
# --------------------------------------------------------------------------

def connecteur_github(src: dict) -> list[Candidat]:
    # La recherche GitHub refuse un OR entre qualificateurs (topic:a OR topic:b
    # renvoie une 422) : chaque requête de la liste est donc lancée à part.
    filtres = src.get("filtres") or {}
    depuis = il_y_a(duree_en_jours(filtres.get("pousse_depuis", "365j")))
    suffixe = f" pushed:>={depuis}"
    if filtres.get("etoiles_min"):
        suffixe += f" stars:>={int(filtres['etoiles_min'])}"

    requetes = src.get("requetes") or [src["requete"]]
    entetes = {"Accept": "application/vnd.github+json"}
    jeton = os.getenv("GITHUB_TOKEN")
    if jeton:
        entetes["Authorization"] = f"Bearer {jeton}"
    # 10 recherches par minute sans jeton, 30 avec
    pause = 2.1 if jeton else 6.5

    sortie = []
    for i, requete in enumerate(requetes):
        if i:
            time.sleep(pause)
        data = get_json(
            "https://api.github.com/search/repositories",
            entetes=entetes,
            params={"q": requete + suffixe, "sort": "updated", "order": "desc",
                    "per_page": min(int(src.get("limite", 30)), 100)},
        )
        for item in (data or {}).get("items", []):
            if item.get("fork") or item.get("archived"):
                continue
            sortie.append(nouveau(
                src, "logiciel",
                titre=item.get("full_name", ""),
                url=item.get("html_url", ""),
                description=item.get("description") or "",
                licence=normaliser_licence(chemin(item, "license.spdx_id")),
                date_maj=(item.get("pushed_at") or "")[:10],
                techno=item.get("language") or "",
                popularite=item.get("stargazers_count", 0),
                mots_cles=item.get("topics", []),
            ))
    return sortie


def connecteur_huggingface(src: dict) -> list[Candidat]:
    base = src["url"]
    est_dataset = "/api/datasets" in base
    data = get_json(base, params={"sort": "lastModified", "direction": -1,
                                  "limit": src.get("limite", 40), "full": "true"})
    sortie = []
    for item in data or []:
        ident = item.get("id") or item.get("modelId") or ""
        etiquettes = [str(t) for t in item.get("tags", [])]
        lic = next((normaliser_licence(t.split(":", 1)[1])
                    for t in etiquettes if t.startswith("license:")), "")
        simples = [t for t in etiquettes if ":" not in t]
        prefixe = "datasets/" if est_dataset else ""
        sortie.append(nouveau(
            src, "modele",
            titre=ident,
            url=f"https://huggingface.co/{prefixe}{ident}",
            description=(item.get("description") or " ".join(simples))[:300],
            licence=lic,
            date_maj=(item.get("lastModified") or "")[:10],
            popularite=int(item.get("likes") or 0) + int(item.get("downloads") or 0) // 100,
            mots_cles=simples,
        ))
    return sortie


def connecteur_datagouv(src: dict) -> list[Candidat]:
    data = get_json(src["url"], params={"page_size": src.get("limite", 40)})
    sortie = []
    for item in (data or {}).get("data", []):
        sortie.append(nouveau(
            src, "donnees",
            titre=item.get("title", ""),
            url=item.get("page") or item.get("uri", ""),
            description=item.get("description") or "",
            licence=normaliser_licence(item.get("license")),
            date_maj=(item.get("last_update") or item.get("last_modified") or "")[:10],
            techno="",
            popularite=int(chemin(item, "metrics.reuses", 0) or 0),
            mots_cles=item.get("tags") or [],
        ))
    return sortie


def connecteur_zenodo(src: dict) -> list[Candidat]:
    # Sans authentification, Zenodo refuse les pages de plus de 25 résultats.
    data = get_json(src["url"], params={"size": min(int(src.get("limite", 25)), 25),
                                        "sort": "mostrecent"})
    sortie = []
    for item in chemin(data, "hits.hits", []) or []:
        meta = item.get("metadata", {})
        sortie.append(nouveau(
            src, "donnees",
            titre=meta.get("title", ""),
            url=item.get("doi_url") or chemin(item, "links.self_html", ""),
            description=re.sub("<[^>]+>", " ", meta.get("description", "") or ""),
            licence=normaliser_licence(chemin(meta, "license.id") or chemin(meta, "license")),
            date_maj=(item.get("modified") or meta.get("publication_date") or "")[:10],
            mots_cles=meta.get("keywords") or [],
        ))
    return sortie


def connecteur_oshwa(src: dict) -> list[Candidat]:
    jeton = os.getenv("OSHWA_TOKEN")
    if not jeton:
        print("   OSHWA_TOKEN absent : source ignorée")
        return []
    data = get_json(src["url"], entetes={"Authorization": f"Bearer {jeton}"},
                    params={"limit": src.get("limite", 100)})
    items = data if isinstance(data, list) else (data or {}).get("items", [])
    mots = [m.lower() for m in (src.get("filtres") or {}).get("mots_cles", [])]
    sortie = []
    for item in items:
        texte = f"{item.get('projectName', '')} {item.get('projectDescription', '')}".lower()
        if mots and not any(m in texte for m in mots):
            continue
        sortie.append(nouveau(
            src, "materiel",
            titre=item.get("projectName", ""),
            url=item.get("projectWebsite") or item.get("permalink", ""),
            description=item.get("projectDescription", ""),
            licence=normaliser_licence(item.get("hardwareLicense")
                                       or item.get("documentationLicense")),
            date_maj=(item.get("certificationDate") or "")[:10],
            mots_cles=item.get("projectKeywords") or [],
        ))
    return sortie


def connecteur_rss(src: dict) -> list[Candidat]:
    if feedparser is None:
        raise RuntimeError("feedparser non installé")
    flux = feedparser.parse(src["url"])
    licence = normaliser_licence((src.get("filtres") or {}).get("licence_par_defaut"))
    sortie = []
    for e in flux.entries[: src.get("limite", 30)]:
        date = ""
        if getattr(e, "published_parsed", None):
            date = time.strftime("%Y-%m-%d", e.published_parsed)
        sortie.append(nouveau(
            src, "logiciel",
            titre=getattr(e, "title", ""),
            url=getattr(e, "link", ""),
            description=re.sub("<[^>]+>", " ", getattr(e, "summary", "")),
            licence=licence,
            date_maj=date,
            mots_cles=[t.get("term", "") for t in getattr(e, "tags", [])],
        ))
    return sortie


def connecteur_api(src: dict) -> list[Candidat]:
    """Connecteur générique : sources.yml décrit où trouver chaque champ."""
    champs = src.get("champs") or {}
    data = get_json(src["url"], params=src.get("parametres"))
    liste = chemin(data, src["liste"], []) if src.get("liste") else data
    if isinstance(liste, dict):
        liste = liste.get("results") or liste.get("data") or []
    sortie = []
    for item in (liste or [])[: src.get("limite", 40)]:
        sortie.append(nouveau(
            src, "logiciel",
            titre=str(chemin(item, champs.get("titre", "title"))),
            url=str(chemin(item, champs.get("url", "url"))),
            description=str(chemin(item, champs.get("description", "description"))),
            licence=normaliser_licence(chemin(item, champs.get("licence", "license"))),
            date_maj=str(chemin(item, champs.get("date", "updated")))[:10],
        ))
    return sortie


CONNECTEURS = {
    "github_search": connecteur_github,
    "huggingface": connecteur_huggingface,
    "datagouv": connecteur_datagouv,
    "zenodo": connecteur_zenodo,
    "oshwa": connecteur_oshwa,
    "rss": connecteur_rss,
    "api": connecteur_api,
}


# --------------------------------------------------------------------------
# Notation
# --------------------------------------------------------------------------

def noter(c: Candidat) -> Candidat:
    score, raisons = 0, []

    if licence_ouverte(c.licence):
        score += 40
        raisons.append(f"licence {c.licence}")
    elif c.licence:
        raisons.append(f"licence non retenue ({c.licence})")
    else:
        raisons.append("licence absente")

    jours = 9999
    if c.date_maj:
        try:
            jours = (datetime.now(timezone.utc)
                     - datetime.strptime(c.date_maj, "%Y-%m-%d").replace(tzinfo=timezone.utc)).days
        except ValueError:
            pass
    if jours <= 90:
        score += 25
        raisons.append("actif (moins de 3 mois)")
    elif jours <= 365:
        score += 18
        raisons.append("actif (moins d'un an)")
    elif jours <= 730:
        score += 8
        raisons.append("activité ancienne")
    else:
        raisons.append("aucune activité récente")

    texte = f"{c.titre} {c.description} {' '.join(c.mots_cles)}"
    note_pert, mots = pertinence(texte)
    score += note_pert
    if mots:
        raisons.append("vocabulaire : " + ", ".join(mots))

    if c.popularite >= 500:
        score += 10
    elif c.popularite >= 50:
        score += 6
    elif c.popularite >= 5:
        score += 3
    if len(c.description) > 80:
        score += 2

    motif = exclu(texte)
    if motif:
        score = 0
        raisons.append(f"écarté : « {motif} » hors sujet agricole")

    c.score = min(score, 100)
    c.raisons = raisons
    return c


# --------------------------------------------------------------------------
# Mémoire : _radar/memoire.json
#
#   propose       déjà passé dans un lot : jamais reproposé. Si la pull request
#                 expire sans fusion, la mémoire n'arrive pas sur main et le
#                 projet revient naturellement dans un lot suivant.
#   quarantaine   sous le seuil : réexaminé après le délai s'il a progressé
#   sans_licence  réexaminé après le délai, une licence a pu être ajoutée
# --------------------------------------------------------------------------

def charger_memoire() -> dict:
    if FICHIER_MEMOIRE.exists():
        return json.loads(FICHIER_MEMOIRE.read_text(encoding="utf-8"))
    return {}


def enregistrer_memoire(memoire: dict) -> None:
    FICHIER_MEMOIRE.write_text(
        json.dumps(memoire, ensure_ascii=False, indent=1, sort_keys=True) + "\n",
        encoding="utf-8")


def a_reexaminer(entree: dict, score: int, delai_jours: int) -> bool:
    statut = entree.get("statut")
    if statut not in {"quarantaine", "sans_licence"}:
        return False
    try:
        vu = datetime.strptime(entree["examine_le"], "%Y-%m-%d")
    except (KeyError, ValueError):
        return True
    if (datetime.now() - vu).days < delai_jours:
        return False
    return statut == "sans_licence" or score > entree.get("score", 0) + 5


# --------------------------------------------------------------------------
# Programme principal
# --------------------------------------------------------------------------

def ecrire_lot(fichier: Path, contenu: dict) -> None:
    fichier.write_text(
        "# Lot du radar OSFarm. Passer « publier » à false pour écarter une fiche,\n"
        "# corriger « resume » au besoin. La fusion de la pull request publie le reste.\n"
        + yaml.safe_dump(contenu, allow_unicode=True, sort_keys=False, width=100),
        encoding="utf-8")


def urls_du_site() -> set[str]:
    """Liens déjà présents dans les fichiers _data/*.yml tenus à la main."""
    urls = set()
    for fichier in (RACINE / "_data").glob("*.yml"):
        for url in re.findall(r"https?://[^\s\"'<>]+", fichier.read_text(encoding="utf-8")):
            urls.add(url.lower().rstrip("/").removesuffix(".git"))
    return urls


def charger_configuration() -> tuple[dict, list[dict]]:
    brut = yaml.safe_load(FICHIER_SOURCES.read_text(encoding="utf-8")) or {}
    return brut.get("reglages") or {}, brut.get("sources") or []


def main() -> int:
    ap = argparse.ArgumentParser(description="Collecte du radar OSFarm")
    ap.add_argument("--source", help="ne traiter qu'une source (son id)")
    ap.add_argument("--blanc", action="store_true",
                    help="tourner à blanc : lot dans _radar/brouillon/, mémoire intacte")
    args = ap.parse_args()

    reglages, sources = charger_configuration()
    seuil = int(reglages.get("seuil_score", 55))
    max_relecteur = int(reglages.get("max_par_relecteur", 8))
    delai = int(reglages.get("quarantaine_jours", 90))

    if args.source:
        sources = [s for s in sources if s.get("id") == args.source]
        if not sources:
            print(f"source « {args.source} » introuvable", file=sys.stderr)
            return 2

    memoire = charger_memoire()
    aujourdhui = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    bruts: list[Candidat] = []
    pannes: list[str] = []

    for src in sources:
        if src.get("actif") is False and not args.source:
            continue
        fonction = CONNECTEURS.get(src.get("type", ""))
        if fonction is None:
            pannes.append(f"{src.get('id')} : type « {src.get('type')} » inconnu")
            continue
        if src.get("famille", "logiciel") not in FAMILLES:
            pannes.append(f"{src.get('id')} : famille « {src.get('famille')} » inconnue")
            continue
        print(f"→ {src['id']} ({src['type']})")
        try:
            resultats = fonction(src)
            print(f"   {len(resultats)} résultats")
            bruts.extend(resultats)
        except Exception as err:  # noqa: BLE001
            pannes.append(f"{src.get('id')} : {err}")
            print(f"   ÉCHEC : {err}", file=sys.stderr)
        time.sleep(float(reglages.get("pause_entre_sources", 1)))

    # Dédoublonnage : un même projet peut remonter par plusieurs sources
    uniques: dict[str, Candidat] = {}
    for c in bruts:
        if not c.url or not c.titre:
            continue
        noter(c)
        if c.id not in uniques or c.score > uniques[c.id].score:
            uniques[c.id] = c

    retenus: list[Candidat] = []
    rejets = {"deja_vu": 0, "deja_sur_le_site": 0, "licence": 0, "score": 0}
    sur_le_site = urls_du_site()

    for c in uniques.values():
        if c.url.lower().rstrip("/") in sur_le_site:
            rejets["deja_sur_le_site"] += 1
            continue
        entree = memoire.get(c.id)
        if entree and not a_reexaminer(entree, c.score, delai):
            rejets["deja_vu"] += 1
            continue
        if not licence_ouverte(c.licence):
            rejets["licence"] += 1
            memoire[c.id] = {"statut": "sans_licence", "examine_le": aujourdhui, "url": c.url}
            continue
        if c.score < seuil:
            rejets["score"] += 1
            memoire[c.id] = {"statut": "quarantaine", "score": c.score,
                             "examine_le": aujourdhui, "url": c.url}
            continue
        retenus.append(c)

    # Plafond par relecteur : personne ne doit ouvrir une liste de trente lignes.
    # Ce qui dépasse n'est pas mémorisé et revient au lot suivant.
    retenus.sort(key=lambda x: x.score, reverse=True)
    compte: dict[str, int] = {}
    final: list[Candidat] = []
    for c in retenus:
        cle = c.relecteur or c.famille
        if compte.get(cle, 0) >= max_relecteur:
            continue
        compte[cle] = compte.get(cle, 0) + 1
        c.propose_le = aujourdhui
        final.append(c)
        memoire[c.id] = {"statut": "propose", "score": c.score,
                         "examine_le": aujourdhui, "url": c.url}

    final.sort(key=lambda x: (FAMILLES.index(x.famille), -x.score))

    dossier = DOSSIER_BROUILLON if args.blanc else DOSSIER_LOTS
    dossier.mkdir(parents=True, exist_ok=True)
    sortie = dossier / f"{aujourdhui}.yml"

    # Deux passages le même jour complètent le lot au lieu de l'écraser, pour ne
    # perdre ni les fiches déjà proposées ni les corrections d'un relecteur.
    anciens: list[dict] = []
    if sortie.exists():
        anciens = (yaml.safe_load(sortie.read_text(encoding="utf-8")) or {}).get("candidats") or []
    connus = {a.get("id") for a in anciens}
    candidats = anciens + [asdict(c) for c in final if c.id not in connus]

    contenu = {
        "date": aujourdhui,
        "examines": len(uniques),
        "retenus": len(candidats),
        "rejets": rejets,
        "pannes": pannes,
        "candidats": candidats,
    }
    ecrire_lot(sortie, contenu)

    if not args.blanc:
        enregistrer_memoire(memoire)

    print(f"\n{len(uniques)} examinés · {len(final)} retenus · "
          f"{rejets['licence']} sans licence ouverte · "
          f"{rejets['score']} sous le seuil · {rejets['deja_vu']} déjà connus · "
          f"{rejets['deja_sur_le_site']} déjà sur le site")
    print(f"écrit : {sortie.relative_to(RACINE)}")
    if pannes:
        print("\nsources en panne :", file=sys.stderr)
        for p in pannes:
            print(f"  - {p}", file=sys.stderr)

    if os.getenv("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
            f.write(f"retenus={len(final)}\n")
            f.write(f"fichier={sortie.relative_to(RACINE)}\n")
            f.write(f"pannes={len(pannes)}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

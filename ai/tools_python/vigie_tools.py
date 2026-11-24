"""
vigie_tools.py — Outils Vigi AI pour IBM watsonx Orchestrate ADK v2.19.1
Ces outils Python s'exécutent côté WXO et appellent l'API Vigie.

Import :
  .venv/bin/orchestrate tools import --kind python \
    -f ai/tools_python/vigie_tools.py \
    -r ai/tools_python/requirements.txt
"""
import os
from datetime import date
from typing import Optional
import httpx

from ibm_watsonx_orchestrate.agent_builder.tools import tool

# URL de base Vigie — configurable via variable d'environnement VIGIE_API_BASE
VIGIE_BASE = os.environ.get("VIGIE_API_BASE", "http://localhost:3000").rstrip("/")


def _get(path: str, params: dict = None) -> dict:
    """Appel GET vers l'API Vigie locale."""
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.get(f"{VIGIE_BASE}{path}", params=params or {})
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as e:
        return {"error": f"HTTP {e.response.status_code}", "detail": str(e)}
    except Exception as e:
        return {"error": f"Service indisponible : {str(e)}"}


@tool
def search_formations(
    q: Optional[str] = None,
    filiere: Optional[str] = None,
    region: Optional[str] = None,
    ville: Optional[str] = None,
    departement: Optional[str] = None,
    statut: Optional[str] = None,
    selectivite: Optional[str] = None,
    limit: int = 10,
) -> dict:
    """
    Recherche des formations Parcoursup 2025 selon des critères.
    Retourne une liste paginée de formations avec sources officielles.
    Au moins un critère parmi q, filiere, region, ville, departement est requis.

    Args:
        q: Mots-clés de recherche (nom formation, établissement, ex. "informatique")
        filiere: Filière (ex. BUT, BTS, Licence, CPGE, Prépa)
        region: Région (ex. Occitanie, Île-de-France, Auvergne-Rhône-Alpes)
        ville: Ville (ex. Toulouse, Paris, Lyon)
        departement: Code département (ex. 31 pour Haute-Garonne)
        statut: public ou prive
        selectivite: selective ou non_selective
        limit: Nombre de résultats (1-20, défaut 10)

    Returns:
        dict avec total, fromCache, formations (liste avec id, nom, etablissement, filiere, ville, region, tauxAcces, lienParcoursup), source
    """
    if not any([q, filiere, region, ville, departement]):
        return {"error": "Au moins un critère de recherche est requis.", "formations": [], "total": 0}

    params = {}
    if q: params["q"] = str(q)[:200]
    if filiere: params["filiere"] = str(filiere)[:100]
    if region: params["region"] = str(region)[:100]
    if ville: params["ville"] = str(ville)[:100]
    if departement: params["departement"] = str(departement)[:10]
    if statut in ("public", "prive"): params["statut"] = statut
    if selectivite in ("selective", "non_selective"): params["selectivite"] = selectivite
    params["limit"] = max(1, min(20, int(limit)))

    return _get("/api/formations", params)


@tool
def get_formation_details(id: str) -> dict:
    """
    Récupère la fiche complète d'une formation Parcoursup depuis son identifiant officiel.

    Args:
        id: Identifiant officiel de la formation (cod_aff_form Parcoursup, ex. "25184")

    Returns:
        dict avec toutes les informations de la formation ou found=False si introuvable
    """
    if not id:
        return {"found": False, "error": "Identifiant requis."}

    safe_id = str(id)[:50]
    result = _get(f"/api/formations/{safe_id}")

    if "error" in result:
        return {"found": False, "id": safe_id, "error": result["error"]}

    if result:
        return {"found": True, "formation": result, "source": result.get("sourceLabel", "Parcoursup 2025")}
    return {"found": False, "id": safe_id}


@tool
def get_formation_statistics(id: str) -> dict:
    """
    Retourne les statistiques détaillées d'une formation Parcoursup 2025 avec définitions et sources.
    IMPORTANT : ces statistiques sont historiques et ne constituent pas une prédiction d'admission individuelle.

    Args:
        id: Identifiant officiel de la formation (cod_aff_form Parcoursup)

    Returns:
        dict avec statistiques annotées (taux d'accès, capacité, répartition bac) et avertissement sur la nature historique
    """
    result = get_formation_details(id)
    if not result.get("found"):
        return result

    f = result["formation"]
    return {
        "found": True,
        "id": f.get("id"),
        "nom": f.get("nom"),
        "session": f.get("session", "2025"),
        "statistiques": {
            "capacite":   {"valeur": f.get("capacite"),   "unite": "places",        "definition": "Nombre de places disponibles"},
            "voeux":      {"valeur": f.get("voeux"),       "unite": "candidatures",  "definition": "Total des vœux reçus"},
            "admis":      {"valeur": f.get("admis"),       "unite": "étudiants",     "definition": "Nombre d'admis"},
            "tauxAcces":  {"valeur": f.get("tauxAcces"),   "unite": "%",             "definition": "Ratio admis/vœux — statistique historique, pas une garantie individuelle"},
            "pctBacGen":  {"valeur": f.get("pctBacGen"),   "unite": "%",             "definition": "Part de bacheliers généraux parmi les admis"},
            "pctBacTech": {"valeur": f.get("pctBacTech"),  "unite": "%",             "definition": "Part de bacheliers technologiques parmi les admis"},
            "pctBacPro":  {"valeur": f.get("pctBacPro"),   "unite": "%",             "definition": "Part de bacheliers professionnels parmi les admis"},
            "pctFemmes":  {"valeur": f.get("pctFemmes"),   "unite": "%",             "definition": "Part de femmes parmi les admis"},
        },
        "avertissement": f"Statistiques de la session {f.get('session', '2025')}. Elles ne prédisent pas ton admission personnelle.",
        "source": f.get("sourceLabel", "Ministère de l'Enseignement supérieur — Parcoursup 2025"),
    }


@tool
def compare_formations(ids: list) -> dict:
    """
    Compare plusieurs formations Parcoursup côte à côte sur critères objectifs (filière, statut, taux d'accès, localisation).

    Args:
        ids: Liste de 2 à 4 identifiants Parcoursup (cod_aff_form) à comparer

    Returns:
        dict avec les formations comparées, les critères et les sources
    """
    if not isinstance(ids, list) or len(ids) < 2:
        return {"error": "Fournir une liste d'au moins 2 identifiants de formations."}

    ids = [str(x)[:50] for x in ids[:4]]
    formations = []
    not_found = []

    for id_ in ids:
        result = get_formation_details(id_)
        if result.get("found"):
            formations.append(result["formation"])
        else:
            not_found.append(id_)

    if len(formations) < 2:
        return {"error": f"Pas assez de formations trouvées. Non trouvées : {not_found}", "formations": []}

    return {
        "count": len(formations),
        "formations": formations,
        "not_found": not_found,
        "criteres": ["filiere", "statut", "selectivite", "capacite", "tauxAcces", "region", "ville"],
        "avertissement": "Comparaison sur données historiques Parcoursup 2025. Les taux d'accès varient chaque année.",
        "source": "Ministère de l'Enseignement supérieur — Parcoursup 2025",
    }


@tool
def get_alternative_formations(
    filiere: Optional[str] = None,
    region: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 8,
) -> dict:
    """
    Trouve des formations alternatives selon les critères de l'étudiant.

    Args:
        filiere: Filière de référence (ex. BUT, BTS)
        region: Région de préférence (ex. Occitanie)
        q: Mots-clés complémentaires
        limit: Nombre d'alternatives (1-20, défaut 8)

    Returns:
        dict avec alternatives et critères utilisés
    """
    if not any([filiere, region, q]):
        return {"error": "Au moins un critère (filiere, region ou q) est requis."}

    result = search_formations(q=q, filiere=filiere, region=region, limit=limit)
    return {
        "alternatives": result.get("formations", []),
        "total": result.get("total", 0),
        "criteres": {"filiere": filiere, "region": region, "q": q},
        "source": result.get("source", "Parcoursup 2025"),
    }


@tool
def get_official_deadlines() -> dict:
    """
    Retourne les échéances officielles du calendrier Parcoursup 2025 avec indication si passées ou à venir.

    Returns:
        dict avec toutes les dates officielles Parcoursup 2025 et leur statut
    """
    today = date.today()
    deadlines = [
        {"label": "Ouverture de la plateforme Parcoursup",      "date": "2025-01-14", "type": "ouverture"},
        {"label": "Fin de saisie des vœux",                     "date": "2025-03-13", "type": "voeux"},
        {"label": "Fin de finalisation des dossiers",           "date": "2025-04-03", "type": "dossiers"},
        {"label": "Début des réponses des formations",          "date": "2025-06-02", "type": "reponses"},
        {"label": "Fin de la phase principale",                 "date": "2025-07-11", "type": "phase_principale"},
        {"label": "Ouverture de la phase complémentaire",       "date": "2025-06-23", "type": "complementaire"},
        {"label": "Fermeture de la plateforme Parcoursup 2025", "date": "2025-09-19", "type": "fermeture"},
    ]
    for d in deadlines:
        d["passed"] = date.fromisoformat(d["date"]) < today

    return {
        "session": "2025",
        "echeances": sorted(deadlines, key=lambda x: x["date"]),
        "source": "Calendrier officiel Parcoursup 2025 — parcoursup.gouv.fr",
        "avertissement": "Vérifiez toujours les dates sur parcoursup.gouv.fr",
    }
